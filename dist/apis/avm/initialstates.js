"use strict";
/**
 * @packageDocumentation
 * @module API-AVM-InitialStates
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InitialStates = void 0;
const buffer_1 = require("buffer/");
const bintools_1 = __importDefault(require("../../utils/bintools"));
const output_1 = require("../../common/output");
const outputs_1 = require("./outputs");
const constants_1 = require("./constants");
const serialization_1 = require("../../utils/serialization");
/**
 * @ignore
 */
const bintools = bintools_1.default.getInstance();
const serializer = serialization_1.Serialization.getInstance();
/**
 * Class for creating initial output states used in asset creation
 */
class InitialStates extends serialization_1.Serializable {
    constructor() {
        super(...arguments);
        this._typeName = "AmountInput";
        this._typeID = undefined;
        this.fxs = {};
    }
    serialize(encoding = "hex") {
        let fields = super.serialize(encoding);
        let flatfxs = {};
        for (let fxid in this.fxs) {
            flatfxs[fxid] = this.fxs[fxid].map((o) => o.serialize(encoding));
        }
        return Object.assign(Object.assign({}, fields), { "fxs": flatfxs });
    }
    ;
    deserialize(fields, encoding = "hex") {
        super.deserialize(fields, encoding);
        let unflat = {};
        for (let fxid in fields["fxs"]) {
            unflat[fxid] = fields["fxs"][fxid].map((o) => {
                let out = outputs_1.SelectOutputClass(o["_typeID"]);
                out.deserialize(o, encoding);
                return out;
            });
        }
        this.fxs = unflat;
    }
    /**
       *
       * @param out The output state to add to the collection
       * @param fxid The FxID that will be used for this output, default AVMConstants.SECPFXID
       */
    addOutput(out, fxid = constants_1.AVMConstants.SECPFXID) {
        if (!(fxid in this.fxs)) {
            this.fxs[fxid] = [];
        }
        this.fxs[fxid].push(out);
    }
    fromBuffer(bytes, offset = 0) {
        const result = [];
        const klen = bintools.copyFrom(bytes, offset, offset + 4);
        offset += 4;
        const klennum = klen.readUInt32BE(0);
        for (let i = 0; i < klennum; i++) {
            const fxidbuff = bintools.copyFrom(bytes, offset, offset + 4);
            offset += 4;
            const fxid = fxidbuff.readUInt32BE(0);
            result[fxid] = [];
            const statelenbuff = bintools.copyFrom(bytes, offset, offset + 4);
            offset += 4;
            const statelen = statelenbuff.readUInt32BE(0);
            for (let j = 0; j < statelen; j++) {
                const outputid = bintools.copyFrom(bytes, offset, offset + 4).readUInt32BE(0);
                offset += 4;
                const out = outputs_1.SelectOutputClass(outputid);
                offset = out.fromBuffer(bytes, offset);
                result[fxid].push(out);
            }
        }
        this.fxs = result;
        return offset;
    }
    toBuffer() {
        const buff = [];
        const keys = Object.keys(this.fxs).map((k) => parseInt(k, 10)).sort();
        const klen = buffer_1.Buffer.alloc(4);
        klen.writeUInt32BE(keys.length, 0);
        buff.push(klen);
        for (let i = 0; i < keys.length; i++) {
            const fxid = keys[i];
            const fxidbuff = buffer_1.Buffer.alloc(4);
            fxidbuff.writeUInt32BE(fxid, 0);
            buff.push(fxidbuff);
            const initialState = this.fxs[fxid].sort(output_1.Output.comparator());
            const statelen = buffer_1.Buffer.alloc(4);
            statelen.writeUInt32BE(initialState.length, 0);
            buff.push(statelen);
            for (let j = 0; j < initialState.length; j++) {
                const outputid = buffer_1.Buffer.alloc(4);
                outputid.writeInt32BE(initialState[j].getOutputID(), 0);
                buff.push(outputid);
                buff.push(initialState[j].toBuffer());
            }
        }
        return buffer_1.Buffer.concat(buff);
    }
}
exports.InitialStates = InitialStates;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5pdGlhbHN0YXRlcy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9hcGlzL2F2bS9pbml0aWFsc3RhdGVzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7O0dBR0c7Ozs7OztBQUVILG9DQUFpQztBQUNqQyxvRUFBNkM7QUFDN0MsZ0RBQTZDO0FBQzdDLHVDQUE4QztBQUM5QywyQ0FBMkM7QUFDM0MsNkRBQTRGO0FBQzVGOztHQUVHO0FBQ0gsTUFBTSxRQUFRLEdBQUcsa0JBQVEsQ0FBQyxXQUFXLEVBQUUsQ0FBQztBQUN4QyxNQUFNLFVBQVUsR0FBRyw2QkFBYSxDQUFDLFdBQVcsRUFBRSxDQUFDO0FBRS9DOztHQUVHO0FBQ0gsTUFBYSxhQUFjLFNBQVEsNEJBQVk7SUFBL0M7O1FBQ1ksY0FBUyxHQUFHLGFBQWEsQ0FBQztRQUMxQixZQUFPLEdBQUcsU0FBUyxDQUFDO1FBMEJwQixRQUFHLEdBQWlDLEVBQUUsQ0FBQztJQWdFbkQsQ0FBQztJQXhGQyxTQUFTLENBQUMsV0FBOEIsS0FBSztRQUMzQyxJQUFJLE1BQU0sR0FBVSxLQUFLLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQzlDLElBQUksT0FBTyxHQUFVLEVBQUUsQ0FBQTtRQUN2QixLQUFJLElBQUksSUFBSSxJQUFJLElBQUksQ0FBQyxHQUFHLEVBQUM7WUFDdkIsT0FBTyxDQUFDLElBQUksQ0FBQyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7U0FDbEU7UUFDRCx1Q0FDSyxNQUFNLEtBQ1QsS0FBSyxFQUFFLE9BQU8sSUFDZjtJQUNILENBQUM7SUFBQSxDQUFDO0lBQ0YsV0FBVyxDQUFDLE1BQWEsRUFBRSxXQUE4QixLQUFLO1FBQzVELEtBQUssQ0FBQyxXQUFXLENBQUMs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QUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsWUFBWSxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRTtnQkFDNUMsTUFBTSxRQUFRLEdBQVUsZUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDeEMsUUFBUSxDQUFDLFlBQVksQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDLENBQUMsV0FBVyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0JBQ3hELElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7Z0JBQ3BCLElBQUksQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUM7YUFDdkM7U0FDRjtRQUNELE9BQU8sZUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUM3QixDQUFDO0NBRUY7QUE1RkQsc0NBNEZDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAcGFja2FnZURvY3VtZW50YXRpb25cbiAqIEBtb2R1bGUgQVBJLUFWTS1Jbml0aWFsU3RhdGVzXG4gKi9cblxuaW1wb3J0IHsgQnVmZmVyIH0gZnJvbSBcImJ1ZmZlci9cIjtcbmltcG9ydCBCaW5Ub29scyAgZnJvbSAnLi4vLi4vdXRpbHMvYmludG9vbHMnO1xuaW1wb3J0IHsgT3V0cHV0IH0gZnJvbSAnLi4vLi4vY29tbW9uL291dHB1dCc7XG5pbXBvcnQgeyBTZWxlY3RPdXRwdXRDbGFzcyB9IGZyb20gJy4vb3V0cHV0cyc7XG5pbXBvcnQgeyBBVk1Db25zdGFudHMgfSBmcm9tICcuL2NvbnN0YW50cyc7XG5pbXBvcnQgeyBTZXJpYWxpemFibGUsIFNlcmlhbGl6YXRpb24sIFNlcmlhbGl6ZWRFbmNvZGluZyB9IGZyb20gJy4uLy4uL3V0aWxzL3NlcmlhbGl6YXRpb24nO1xuLyoqXG4gKiBAaWdub3JlXG4gKi9cbmNvbnN0IGJpbnRvb2xzID0gQmluVG9vbHMuZ2V0SW5zdGFuY2UoKTtcbmNvbnN0IHNlcmlhbGl6ZXIgPSBTZXJpYWxpemF0aW9uLmdldEluc3RhbmNlKCk7XG5cbi8qKlxuICogQ2xhc3MgZm9yIGNyZWF0aW5nIGluaXRpYWwgb3V0cHV0IHN0YXRlcyB1c2VkIGluIGFzc2V0IGNyZWF0aW9uXG4gKi9cbmV4cG9ydCBjbGFzcyBJbml0aWFsU3RhdGVzIGV4dGVuZHMgU2VyaWFsaXphYmxle1xuICBwcm90ZWN0ZWQgX3R5cGVOYW1lID0gXCJBbW91bnRJbnB1dFwiO1xuICBwcm90ZWN0ZWQgX3R5cGVJRCA9IHVuZGVmaW5lZDtcblxuICBzZXJpYWxpemUoZW5jb2Rpbmc6U2VyaWFsaXplZEVuY29kaW5nID0gXCJoZXhcIik6b2JqZWN0IHtcbiAgICBsZXQgZmllbGRzOm9iamVjdCA9IHN1cGVyLnNlcmlhbGl6ZShlbmNvZGluZyk7XG4gICAgbGV0IGZsYXRmeHM6b2JqZWN0ID0ge31cbiAgICBmb3IobGV0IGZ4aWQgaW4gdGhpcy5meHMpe1xuICAgICAgZmxhdGZ4c1tmeGlkXSA9IHRoaXMuZnhzW2Z4aWRdLm1hcCgobykgPT4gby5zZXJpYWxpemUoZW5jb2RpbmcpKTtcbiAgICB9XG4gICAgcmV0dXJuIHtcbiAgICAgIC4uLmZpZWxkcyxcbiAgICAgIFwiZnhzXCI6IGZsYXRmeHNcbiAgICB9XG4gIH07XG4gIGRlc2VyaWFsaXplKGZpZWxkczpvYmplY3QsIGVuY29kaW5nOlNlcmlhbGl6ZWRFbmNvZGluZyA9IFwiaGV4XCIpIHtcbiAgICBzdXBlci5kZXNlcmlhbGl6ZShmaWVsZHMsIGVuY29kaW5nKTtcbiAgICBsZXQgdW5mbGF0OntbZnhpZDpudW1iZXJdOkFycmF5PE91dHB1dD59ID0ge307XG4gICAgZm9yKGxldCBmeGlkIGluIGZpZWxkc1tcImZ4c1wiXSl7XG4gICAgICB1bmZsYXRbZnhpZF0gPSBmaWVsZHNbXCJmeHNcIl1bZnhpZF0ubWFwKChvOm9iamVjdCkgPT4ge1xuICAgICAgICBsZXQgb3V0Ok91dHB1dCA9IFNlbGVjdE91dHB1dENsYXNzKG9bXCJfdHlwZUlEXCJdKTtcbiAgICAgICAgb3V0LmRlc2VyaWFsaXplKG8sIGVuY29kaW5nKTtcbiAgICAgICAgcmV0dXJuIG91dDtcbiAgICAgIH0pO1xuICAgIH1cbiAgICB0aGlzLmZ4cyA9IHVuZmxhdDtcbiAgfVxuXG4gIHByb3RlY3RlZCBmeHM6e1tmeGlkOm51bWJlcl06QXJyYXk8T3V0cHV0Pn0gPSB7fTtcblxuICAvKipcbiAgICAgKlxuICAgICAqIEBwYXJhbSBvdXQgVGhlIG91dHB1dCBzdGF0ZSB0byBhZGQgdG8gdGhlIGNvbGxlY3Rpb25cbiAgICAgKiBAcGFyYW0gZnhpZCBUaGUgRnhJRCB0aGF0IHdpbGwgYmUgdXNlZCBmb3IgdGhpcyBvdXRwdXQsIGRlZmF1bHQgQVZNQ29uc3RhbnRzLlNFQ1BGWElEXG4gICAgICovXG4gIGFkZE91dHB1dChvdXQ6T3V0cHV0LCBmeGlkOm51bWJlciA9IEFWTUNvbnN0YW50cy5TRUNQRlhJRCk6dm9pZCB7XG4gICAgaWYgKCEoZnhpZCBpbiB0aGlzLmZ4cykpIHtcbiAgICAgIHRoaXMuZnhzW2Z4aWRdID0gW107XG4gICAgfVxuICAgIHRoaXMuZnhzW2Z4aWRdLnB1c2gob3V0KTtcbiAgfVxuXG4gIGZyb21CdWZmZXIoYnl0ZXM6QnVmZmVyLCBvZmZzZXQ6bnVtYmVyID0gMCk6bnVtYmVyIHtcbiAgICBjb25zdCByZXN1bHQ6e1tmeGlkOm51bWJlcl06QXJyYXk8T3V0cHV0Pn0gPSBbXTtcbiAgICBjb25zdCBrbGVuOkJ1ZmZlciA9IGJpbnRvb2xzLmNvcHlGcm9tKGJ5dGVzLCBvZmZzZXQsIG9mZnNldCArIDQpO1xuICAgIG9mZnNldCArPSA0O1xuICAgIGNvbnN0IGtsZW5udW06bnVtYmVyID0ga2xlbi5yZWFkVUludDMyQkUoMCk7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBrbGVubnVtOyBpKyspIHtcbiAgICAgIGNvbnN0IGZ4aWRidWZmOkJ1ZmZlciA9IGJpbnRvb2xzLmNvcHlGcm9tKGJ5dGVzLCBvZmZzZXQsIG9mZnNldCArIDQpO1xuICAgICAgb2Zmc2V0ICs9IDQ7XG4gICAgICBjb25zdCBmeGlkOm51bWJlciA9IGZ4aWRidWZmLnJlYWRVSW50MzJCRSgwKTtcbiAgICAgIHJlc3VsdFtmeGlkXSA9IFtdO1xuICAgICAgY29uc3Qgc3RhdGVsZW5idWZmOkJ1ZmZlciA9IGJpbnRvb2xzLmNvcHlGcm9tKGJ5dGVzLCBvZmZzZXQsIG9mZnNldCArIDQpO1xuICAgICAgb2Zmc2V0ICs9IDQ7XG4gICAgICBjb25zdCBzdGF0ZWxlbjpudW1iZXIgPSBzdGF0ZWxlbmJ1ZmYucmVhZFVJbnQzMkJFKDApO1xuICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCBzdGF0ZWxlbjsgaisrKSB7XG4gICAgICAgIGNvbnN0IG91dHB1dGlkOm51bWJlciA9IGJpbnRvb2xzLmNvcHlGcm9tKGJ5dGVzLCBvZmZzZXQsIG9mZnNldCArIDQpLnJlYWRVSW50MzJCRSgwKTtcbiAgICAgICAgb2Zmc2V0ICs9IDQ7XG4gICAgICAgIGNvbnN0IG91dDpPdXRwdXQgPSBTZWxlY3RPdXRwdXRDbGFzcyhvdXRwdXRpZCk7XG4gICAgICAgIG9mZnNldCA9IG91dC5mcm9tQnVmZmVyKGJ5dGVzLCBvZmZzZXQpO1xuICAgICAgICByZXN1bHRbZnhpZF0ucHVzaChvdXQpO1xuICAgICAgfVxuICAgIH1cbiAgICB0aGlzLmZ4cyA9IHJlc3VsdDtcbiAgICByZXR1cm4gb2Zmc2V0O1xuICB9XG5cbiAgdG9CdWZmZXIoKTpCdWZmZXIge1xuICAgIGNvbnN0IGJ1ZmY6QXJyYXk8QnVmZmVyPiA9IFtdO1xuICAgIGNvbnN0IGtleXM6QXJyYXk8bnVtYmVyPiA9IE9iamVjdC5rZXlzKHRoaXMuZnhzKS5tYXAoKGspID0+IHBhcnNlSW50KGssIDEwKSkuc29ydCgpO1xuICAgIGNvbnN0IGtsZW46QnVmZmVyID0gQnVmZmVyLmFsbG9jKDQpO1xuICAgIGtsZW4ud3JpdGVVSW50MzJCRShrZXlzLmxlbmd0aCwgMCk7XG4gICAgYnVmZi5wdXNoKGtsZW4pO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwga2V5cy5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3QgZnhpZDpudW1iZXIgPSBrZXlzW2ldO1xuICAgICAgY29uc3QgZnhpZGJ1ZmY6QnVmZmVyID0gQnVmZmVyLmFsbG9jKDQpO1xuICAgICAgZnhpZGJ1ZmYud3JpdGVVSW50MzJCRShmeGlkLCAwKTtcbiAgICAgIGJ1ZmYucHVzaChmeGlkYnVmZik7XG4gICAgICBjb25zdCBpbml0aWFsU3RhdGUgPSB0aGlzLmZ4c1tmeGlkXS5zb3J0KE91dHB1dC5jb21wYXJhdG9yKCkpO1xuICAgICAgY29uc3Qgc3RhdGVsZW46QnVmZmVyID0gQnVmZmVyLmFsbG9jKDQpO1xuICAgICAgc3RhdGVsZW4ud3JpdGVVSW50MzJCRShpbml0aWFsU3RhdGUubGVuZ3RoLCAwKTtcbiAgICAgIGJ1ZmYucHVzaChzdGF0ZWxlbik7XG4gICAgICBmb3IgKGxldCBqID0gMDsgaiA8IGluaXRpYWxTdGF0ZS5sZW5ndGg7IGorKykge1xuICAgICAgICBjb25zdCBvdXRwdXRpZDpCdWZmZXIgPSBCdWZmZXIuYWxsb2MoNCk7XG4gICAgICAgIG91dHB1dGlkLndyaXRlSW50MzJCRShpbml0aWFsU3RhdGVbal0uZ2V0T3V0cHV0SUQoKSwgMCk7XG4gICAgICAgIGJ1ZmYucHVzaChvdXRwdXRpZCk7XG4gICAgICAgIGJ1ZmYucHVzaChpbml0aWFsU3RhdGVbal0udG9CdWZmZXIoKSk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBCdWZmZXIuY29uY2F0KGJ1ZmYpO1xuICB9XG5cbn1cbiAgIl19