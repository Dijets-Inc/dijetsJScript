"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExportTx = void 0;
/**
 * @packageDocumentation
 * @module API-AVM-ExportTx
 */
const buffer_1 = require("buffer/");
const bintools_1 = __importDefault(require("../../utils/bintools"));
const constants_1 = require("./constants");
const outputs_1 = require("./outputs");
const basetx_1 = require("./basetx");
const constants_2 = require("../../utils/constants");
const bn_js_1 = __importDefault(require("bn.js"));
const serialization_1 = require("../../utils/serialization");
/**
 * @ignore
 */
const bintools = bintools_1.default.getInstance();
const serializer = serialization_1.Serialization.getInstance();
/**
 * Class representing an unsigned Export transaction.
 */
class ExportTx extends basetx_1.BaseTx {
    /**
       * Class representing an unsigned Export transaction.
       *
       * @param networkid Optional networkid, [[DefaultNetworkID]]
       * @param blockchainid Optional blockchainid, default Buffer.alloc(32, 16)
       * @param outs Optional array of the [[TransferableOutput]]s
       * @param ins Optional array of the [[TransferableInput]]s
       * @param memo Optional {@link https://github.com/feross/buffer|Buffer} for the memo field
       * @param destinationChain Optional chainid which identifies where the funds will sent to
       * @param exportOuts Array of [[TransferableOutputs]]s used in the transaction
       */
    constructor(networkid = constants_2.DefaultNetworkID, blockchainid = buffer_1.Buffer.alloc(32, 16), outs = undefined, ins = undefined, memo = undefined, destinationChain = undefined, exportOuts = undefined) {
        super(networkid, blockchainid, outs, ins, memo);
        this._typeName = "ExportTx";
        this._codecID = constants_1.AVMConstants.LATESTCODEC;
        this._typeID = this._codecID === 0 ? constants_1.AVMConstants.EXPORTTX : constants_1.AVMConstants.EXPORTTX_CODECONE;
        this.destinationChain = undefined;
        this.numOuts = buffer_1.Buffer.alloc(4);
        this.exportOuts = [];
        /**
           * Returns the id of the [[ExportTx]]
           */
        this.getTxType = () => {
            return this._typeID;
        };
        /**
         * Returns a {@link https://github.com/feross/buffer|Buffer} for the destination chainid.
         */
        this.getDestinationChain = () => {
            return this.destinationChain;
        };
        this.destinationChain = destinationChain; // no correction, if they don't pass a chainid here, it will BOMB on toBuffer
        if (typeof exportOuts !== 'undefined' && Array.isArray(exportOuts)) {
            for (let i = 0; i < exportOuts.length; i++) {
                if (!(exportOuts[i] instanceof outputs_1.TransferableOutput)) {
                    throw new Error("Error - ExportTx.constructor: invalid TransferableOutput in array parameter 'exportOuts'");
                }
            }
            this.exportOuts = exportOuts;
        }
    }
    serialize(encoding = "hex") {
        let fields = super.serialize(encoding);
        return Object.assign(Object.assign({}, fields), { "destinationChain": serializer.encoder(this.destinationChain, encoding, "Buffer", "cb58"), "exportOuts": this.exportOuts.map((e) => e.serialize(encoding)) });
    }
    ;
    deserialize(fields, encoding = "hex") {
        super.deserialize(fields, encoding);
        this.destinationChain = serializer.decoder(fields["destinationChain"], encoding, "cb58", "Buffer", 32);
        this.exportOuts = fields["exportOuts"].map((e) => {
            let eo = new outputs_1.TransferableOutput();
            eo.deserialize(e, encoding);
            return eo;
        });
        this.numOuts = buffer_1.Buffer.alloc(4);
        this.numOuts.writeUInt32BE(this.exportOuts.length, 0);
    }
    setCodecID(codecID) {
        if (codecID !== 0 && codecID !== 1) {
            /* istanbul ignore next */
            throw new Error("Error - ExportTx.setCodecID: invalid codecID. Valid codecIDs are 0 and 1.");
        }
        this._codecID = codecID;
        this._typeID = this._codecID === 0 ? constants_1.AVMConstants.EXPORTTX : constants_1.AVMConstants.EXPORTTX_CODECONE;
    }
    /**
     * Returns an array of [[TransferableOutput]]s in this transaction.
     */
    getExportOutputs() {
        return this.exportOuts;
    }
    /**
     * Returns the totall exported amount as a {@link https://github.com/indutny/bn.js/|BN}.
     */
    getExportTotal() {
        let val = new bn_js_1.default(0);
        for (let i = 0; i < this.exportOuts.length; i++) {
            val = val.add(this.exportOuts[i].getOutput().getAmount());
        }
        return val;
    }
    getTotalOuts() {
        return [...this.getOuts(), ...this.getExportOutputs()];
    }
    /**
       * Takes a {@link https://github.com/feross/buffer|Buffer} containing an [[ExportTx]], parses it, populates the class, and returns the length of the [[ExportTx]] in bytes.
       *
       * @param bytes A {@link https://github.com/feross/buffer|Buffer} containing a raw [[ExportTx]]
       *
       * @returns The length of the raw [[ExportTx]]
       *
       * @remarks assume not-checksummed
       */
    fromBuffer(bytes, offset = 0) {
        offset = super.fromBuffer(bytes, offset);
        this.destinationChain = bintools.copyFrom(bytes, offset, offset + 32);
        offset += 32;
        this.numOuts = bintools.copyFrom(bytes, offset, offset + 4);
        offset += 4;
        const numOuts = this.numOuts.readUInt32BE(0);
        for (let i = 0; i < numOuts; i++) {
            const anOut = new outputs_1.TransferableOutput();
            offset = anOut.fromBuffer(bytes, offset);
            this.exportOuts.push(anOut);
        }
        return offset;
    }
    /**
       * Returns a {@link https://github.com/feross/buffer|Buffer} representation of the [[ExportTx]].
       */
    toBuffer() {
        if (typeof this.destinationChain === "undefined") {
            throw new Error("ExportTx.toBuffer -- this.destinationChain is undefined");
        }
        this.numOuts.writeUInt32BE(this.exportOuts.length, 0);
        let barr = [super.toBuffer(), this.destinationChain, this.numOuts];
        this.exportOuts = this.exportOuts.sort(outputs_1.TransferableOutput.comparator());
        for (let i = 0; i < this.exportOuts.length; i++) {
            barr.push(this.exportOuts[i].toBuffer());
        }
        return buffer_1.Buffer.concat(barr);
    }
    clone() {
        let newbase = new ExportTx();
        newbase.fromBuffer(this.toBuffer());
        return newbase;
    }
    create(...args) {
        return new ExportTx(...args);
    }
}
exports.ExportTx = ExportTx;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXhwb3J0dHguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9zcmMvYXBpcy9hdm0vZXhwb3J0dHgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQUE7OztHQUdHO0FBQ0gsb0NBQWlDO0FBQ2pDLG9FQUE0QztBQUM1QywyQ0FBMkM7QUFDM0MsdUNBQTZEO0FBRTdELHFDQUFrQztBQUNsQyxxREFBeUQ7QUFDekQsa0RBQXVCO0FBQ3ZCLDZEQUE4RTtBQUc5RTs7R0FFRztBQUNILE1BQU0sUUFBUSxHQUFHLGtCQUFRLENBQUMsV0FBVyxFQUFFLENBQUM7QUFDeEMsTUFBTSxVQUFVLEdBQUcsNkJBQWEsQ0FBQyxXQUFXLEVBQUUsQ0FBQztBQUUvQzs7R0FFRztBQUNILE1BQWEsUUFBUyxTQUFRLGVBQU07SUE0SGxDOzs7Ozs7Ozs7O1NBVUs7SUFDTCxZQUNFLFlBQW1CLDRCQUFnQixFQUFFLGVBQXNCLGVBQU0sQ0FBQyxLQUFLLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUMvRSxPQUFpQyxTQUFTLEVBQUUsTUFBK0IsU0FBUyxFQUNwRixPQUFjLFNBQVMsRUFBRSxtQkFBMEIsU0FBUyxFQUFFLGFBQXVDLFNBQVM7UUFFOUcsS0FBSyxDQUFDLFNBQVMsRUFBRSxZQUFZLEVBQUUsSUFBSSxFQUFFLEdBQUcsRUFBRSxJQUFJLENBQUMsQ0FBQztRQTNJeEMsY0FBUyxHQUFHLFVBQVUsQ0FBQztRQUN2QixhQUFRLEdBQUcsd0JBQVksQ0FBQyxXQUFXLENBQUM7UUFDcEMsWUFBTyxHQUFHLElBQUksQ0FBQyxRQUFRLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyx3QkFBWSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsd0JBQVksQ0FBQyxpQkFBaUIsQ0FBQztRQXNCdkYscUJBQWdCLEdBQVUsU0FBUyxDQUFDO1FBQ3BDLFlBQU8sR0FBVSxlQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ2pDLGVBQVUs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QUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDO1FBQ3BDLE9BQU8sT0FBZSxDQUFDO0lBQ3pCLENBQUM7SUFFRCxNQUFNLENBQUMsR0FBRyxJQUFVO1FBQ2hCLE9BQU8sSUFBSSxRQUFRLENBQUMsR0FBRyxJQUFJLENBQVMsQ0FBQztJQUN6QyxDQUFDO0NBNkJGO0FBdkpELDRCQXVKQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQHBhY2thZ2VEb2N1bWVudGF0aW9uXG4gKiBAbW9kdWxlIEFQSS1BVk0tRXhwb3J0VHhcbiAqL1xuaW1wb3J0IHsgQnVmZmVyIH0gZnJvbSAnYnVmZmVyLyc7XG5pbXBvcnQgQmluVG9vbHMgZnJvbSAnLi4vLi4vdXRpbHMvYmludG9vbHMnO1xuaW1wb3J0IHsgQVZNQ29uc3RhbnRzIH0gZnJvbSAnLi9jb25zdGFudHMnO1xuaW1wb3J0IHsgVHJhbnNmZXJhYmxlT3V0cHV0LCBBbW91bnRPdXRwdXQgfSBmcm9tICcuL291dHB1dHMnO1xuaW1wb3J0IHsgVHJhbnNmZXJhYmxlSW5wdXQgfSBmcm9tICcuL2lucHV0cyc7XG5pbXBvcnQgeyBCYXNlVHggfSBmcm9tICcuL2Jhc2V0eCc7XG5pbXBvcnQgeyBEZWZhdWx0TmV0d29ya0lEIH0gZnJvbSAnLi4vLi4vdXRpbHMvY29uc3RhbnRzJztcbmltcG9ydCBCTiBmcm9tICdibi5qcyc7XG5pbXBvcnQgeyBTZXJpYWxpemF0aW9uLCBTZXJpYWxpemVkRW5jb2RpbmcgfSBmcm9tICcuLi8uLi91dGlscy9zZXJpYWxpemF0aW9uJztcblxuXG4vKipcbiAqIEBpZ25vcmVcbiAqL1xuY29uc3QgYmludG9vbHMgPSBCaW5Ub29scy5nZXRJbnN0YW5jZSgpO1xuY29uc3Qgc2VyaWFsaXplciA9IFNlcmlhbGl6YXRpb24uZ2V0SW5zdGFuY2UoKTtcblxuLyoqXG4gKiBDbGFzcyByZXByZXNlbnRpbmcgYW4gdW5zaWduZWQgRXhwb3J0IHRyYW5zYWN0aW9uLlxuICovXG5leHBvcnQgY2xhc3MgRXhwb3J0VHggZXh0ZW5kcyBCYXNlVHgge1xuICBwcm90ZWN0ZWQgX3R5cGVOYW1lID0gXCJFeHBvcnRUeFwiO1xuICBwcm90ZWN0ZWQgX2NvZGVjSUQgPSBBVk1Db25zdGFudHMuTEFURVNUQ09ERUM7XG4gIHByb3RlY3RlZCBfdHlwZUlEID0gdGhpcy5fY29kZWNJRCA9PT0gMCA/IEFWTUNvbnN0YW50cy5FWFBPUlRUWCA6IEFWTUNvbnN0YW50cy5FWFBPUlRUWF9DT0RFQ09ORTtcblxuICBzZXJpYWxpemUoZW5jb2Rpbmc6U2VyaWFsaXplZEVuY29kaW5nID0gXCJoZXhcIik6b2JqZWN0IHtcbiAgICBsZXQgZmllbGRzOm9iamVjdCA9IHN1cGVyLnNlcmlhbGl6ZShlbmNvZGluZyk7XG4gICAgcmV0dXJuIHtcbiAgICAgIC4uLmZpZWxkcyxcbiAgICAgIFwiZGVzdGluYXRpb25DaGFpblwiOiBzZXJpYWxpemVyLmVuY29kZXIodGhpcy5kZXN0aW5hdGlvbkNoYWluLCBlbmNvZGluZywgXCJCdWZmZXJcIiwgXCJjYjU4XCIpLFxuICAgICAgXCJleHBvcnRPdXRzXCI6IHRoaXMuZXhwb3J0T3V0cy5tYXAoKGUpID0+IGUuc2VyaWFsaXplKGVuY29kaW5nKSlcbiAgICB9XG4gIH07XG4gIGRlc2VyaWFsaXplKGZpZWxkczpvYmplY3QsIGVuY29kaW5nOlNlcmlhbGl6ZWRFbmNvZGluZyA9IFwiaGV4XCIpIHtcbiAgICBzdXBlci5kZXNlcmlhbGl6ZShmaWVsZHMsIGVuY29kaW5nKTtcbiAgICB0aGlzLmRlc3RpbmF0aW9uQ2hhaW4gPSBzZXJpYWxpemVyLmRlY29kZXIoZmllbGRzW1wiZGVzdGluYXRpb25DaGFpblwiXSwgZW5jb2RpbmcsIFwiY2I1OFwiLCBcIkJ1ZmZlclwiLCAzMik7XG4gICAgdGhpcy5leHBvcnRPdXRzID0gZmllbGRzW1wiZXhwb3J0T3V0c1wiXS5tYXAoKGU6b2JqZWN0KSA9PiB7XG4gICAgICBsZXQgZW86VHJhbnNmZXJhYmxlT3V0cHV0ID0gbmV3IFRyYW5zZmVyYWJsZU91dHB1dCgpO1xuICAgICAgZW8uZGVzZXJpYWxpemUoZSwgZW5jb2RpbmcpO1xuICAgICAgcmV0dXJuIGVvO1xuICAgIH0pO1xuICAgIHRoaXMubnVtT3V0cyA9IEJ1ZmZlci5hbGxvYyg0KTtcbiAgICB0aGlzLm51bU91dHMud3JpdGVVSW50MzJCRSh0aGlzLmV4cG9ydE91dHMubGVuZ3RoLCAwKTtcbiAgfVxuXG4gIHByb3RlY3RlZCBkZXN0aW5hdGlvbkNoYWluOkJ1ZmZlciA9IHVuZGVmaW5lZDtcbiAgcHJvdGVjdGVkIG51bU91dHM6QnVmZmVyID0gQnVmZmVyLmFsbG9jKDQpO1xuICBwcm90ZWN0ZWQgZXhwb3J0T3V0czpBcnJheTxUcmFuc2ZlcmFibGVPdXRwdXQ+ID0gW107XG5cbiAgc2V0Q29kZWNJRChjb2RlY0lEOiBudW1iZXIpOiB2b2lkIHtcbiAgICBpZihjb2RlY0lEICE9PSAwICYmIGNvZGVjSUQgIT09IDEpIHtcbiAgICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIkVycm9yIC0gRXhwb3J0VHguc2V0Q29kZWNJRDogaW52YWxpZCBjb2RlY0lELiBWYWxpZCBjb2RlY0lEcyBhcmUgMCBhbmQgMS5cIik7XG4gICAgfVxuICAgIHRoaXMuX2NvZGVjSUQgPSBjb2RlY0lEO1xuICAgIHRoaXMuX3R5cGVJRCA9IHRoaXMuX2NvZGVjSUQgPT09IDAgPyBBVk1Db25zdGFudHMuRVhQT1JUVFggOiBBVk1Db25zdGFudHMuRVhQT1JUVFhfQ09ERUNPTkU7XG4gIH1cblxuICAvKipcbiAgICAgKiBSZXR1cm5zIHRoZSBpZCBvZiB0aGUgW1tFeHBvcnRUeF1dXG4gICAgICovXG4gIGdldFR4VHlwZSA9ICgpOm51bWJlciA9PiB7XG4gICAgcmV0dXJuIHRoaXMuX3R5cGVJRDtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIGFuIGFycmF5IG9mIFtbVHJhbnNmZXJhYmxlT3V0cHV0XV1zIGluIHRoaXMgdHJhbnNhY3Rpb24uXG4gICAqL1xuICBnZXRFeHBvcnRPdXRwdXRzKCk6QXJyYXk8VHJhbnNmZXJhYmxlT3V0cHV0PiB7XG4gICAgcmV0dXJuIHRoaXMuZXhwb3J0T3V0cztcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSB0b3RhbGwgZXhwb3J0ZWQgYW1vdW50IGFzIGEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9pbmR1dG55L2JuLmpzL3xCTn0uXG4gICAqL1xuICBnZXRFeHBvcnRUb3RhbCgpOkJOIHtcbiAgICBsZXQgdmFsOkJOID0gbmV3IEJOKDApO1xuICAgIGZvcihsZXQgaSA9IDA7IGkgPCB0aGlzLmV4cG9ydE91dHMubGVuZ3RoOyBpKyspe1xuICAgICAgdmFsID0gdmFsLmFkZCgodGhpcy5leHBvcnRPdXRzW2ldLmdldE91dHB1dCgpIGFzIEFtb3VudE91dHB1dCkuZ2V0QW1vdW50KCkpO1xuICAgIH1cbiAgICByZXR1cm4gdmFsO1xuICB9XG5cbiAgZ2V0VG90YWxPdXRzKCk6QXJyYXk8VHJhbnNmZXJhYmxlT3V0cHV0PiB7XG4gICAgcmV0dXJuIFsuLi50aGlzLmdldE91dHMoKSBhcyBBcnJheTxUcmFuc2ZlcmFibGVPdXRwdXQ+LCAuLi50aGlzLmdldEV4cG9ydE91dHB1dHMoKV07XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IGZvciB0aGUgZGVzdGluYXRpb24gY2hhaW5pZC5cbiAgICovXG4gIGdldERlc3RpbmF0aW9uQ2hhaW4gPSAoKTpCdWZmZXIgPT4ge1xuICAgIHJldHVybiB0aGlzLmRlc3RpbmF0aW9uQ2hhaW47XG4gIH1cblxuICAvKipcbiAgICAgKiBUYWtlcyBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IGNvbnRhaW5pbmcgYW4gW1tFeHBvcnRUeF1dLCBwYXJzZXMgaXQsIHBvcHVsYXRlcyB0aGUgY2xhc3MsIGFuZCByZXR1cm5zIHRoZSBsZW5ndGggb2YgdGhlIFtbRXhwb3J0VHhdXSBpbiBieXRlcy5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBieXRlcyBBIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IGNvbnRhaW5pbmcgYSByYXcgW1tFeHBvcnRUeF1dXG4gICAgICpcbiAgICAgKiBAcmV0dXJucyBUaGUgbGVuZ3RoIG9mIHRoZSByYXcgW1tFeHBvcnRUeF1dXG4gICAgICpcbiAgICAgKiBAcmVtYXJrcyBhc3N1bWUgbm90LWNoZWNrc3VtbWVkXG4gICAgICovXG4gIGZyb21CdWZmZXIoYnl0ZXM6QnVmZmVyLCBvZmZzZXQ6bnVtYmVyID0gMCk6bnVtYmVyIHtcbiAgICBvZmZzZXQgPSBzdXBlci5mcm9tQnVmZmVyKGJ5dGVzLCBvZmZzZXQpO1xuICAgIHRoaXMuZGVzdGluYXRpb25DaGFpbiA9IGJpbnRvb2xzLmNvcHlGcm9tKGJ5dGVzLCBvZmZzZXQsIG9mZnNldCArIDMyKTtcbiAgICBvZmZzZXQgKz0gMzI7XG4gICAgdGhpcy5udW1PdXRzID0gYmludG9vbHMuY29weUZyb20oYnl0ZXMsIG9mZnNldCwgb2Zmc2V0ICsgNCk7XG4gICAgb2Zmc2V0ICs9IDQ7XG4gICAgY29uc3QgbnVtT3V0czpudW1iZXIgPSB0aGlzLm51bU91dHMucmVhZFVJbnQzMkJFKDApO1xuICAgIGZvciAobGV0IGk6bnVtYmVyID0gMDsgaSA8IG51bU91dHM7IGkrKykge1xuICAgICAgY29uc3QgYW5PdXQ6VHJhbnNmZXJhYmxlT3V0cHV0ID0gbmV3IFRyYW5zZmVyYWJsZU91dHB1dCgpO1xuICAgICAgb2Zmc2V0ID0gYW5PdXQuZnJvbUJ1ZmZlcihieXRlcywgb2Zmc2V0KTtcbiAgICAgIHRoaXMuZXhwb3J0T3V0cy5wdXNoKGFuT3V0KTtcbiAgICB9XG4gICAgcmV0dXJuIG9mZnNldDtcbiAgfVxuXG4gIC8qKlxuICAgICAqIFJldHVybnMgYSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSByZXByZXNlbnRhdGlvbiBvZiB0aGUgW1tFeHBvcnRUeF1dLlxuICAgICAqL1xuICB0b0J1ZmZlcigpOkJ1ZmZlciB7XG4gICAgaWYodHlwZW9mIHRoaXMuZGVzdGluYXRpb25DaGFpbiA9PT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiRXhwb3J0VHgudG9CdWZmZXIgLS0gdGhpcy5kZXN0aW5hdGlvbkNoYWluIGlzIHVuZGVmaW5lZFwiKTtcbiAgICB9XG4gICAgdGhpcy5udW1PdXRzLndyaXRlVUludDMyQkUodGhpcy5leHBvcnRPdXRzLmxlbmd0aCwgMCk7XG4gICAgbGV0IGJhcnI6QXJyYXk8QnVmZmVyPiA9IFtzdXBlci50b0J1ZmZlcigpLCB0aGlzLmRlc3RpbmF0aW9uQ2hhaW4sIHRoaXMubnVtT3V0c107XG4gICAgdGhpcy5leHBvcnRPdXRzID0gdGhpcy5leHBvcnRPdXRzLnNvcnQoVHJhbnNmZXJhYmxlT3V0cHV0LmNvbXBhcmF0b3IoKSk7XG4gICAgZm9yKGxldCBpID0gMDsgaSA8IHRoaXMuZXhwb3J0T3V0cy5sZW5ndGg7IGkrKykge1xuICAgICAgICBiYXJyLnB1c2godGhpcy5leHBvcnRPdXRzW2ldLnRvQnVmZmVyKCkpO1xuICAgIH1cbiAgICByZXR1cm4gQnVmZmVyLmNvbmNhdChiYXJyKTtcbiAgfVxuXG4gIGNsb25lKCk6dGhpcyB7XG4gICAgbGV0IG5ld2Jhc2U6RXhwb3J0VHggPSBuZXcgRXhwb3J0VHgoKTtcbiAgICBuZXdiYXNlLmZyb21CdWZmZXIodGhpcy50b0J1ZmZlcigpKTtcbiAgICByZXR1cm4gbmV3YmFzZSBhcyB0aGlzO1xuICB9XG5cbiAgY3JlYXRlKC4uLmFyZ3M6YW55W10pOnRoaXMge1xuICAgICAgcmV0dXJuIG5ldyBFeHBvcnRUeCguLi5hcmdzKSBhcyB0aGlzO1xuICB9XG5cbiAgLyoqXG4gICAgICogQ2xhc3MgcmVwcmVzZW50aW5nIGFuIHVuc2lnbmVkIEV4cG9ydCB0cmFuc2FjdGlvbi5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBuZXR3b3JraWQgT3B0aW9uYWwgbmV0d29ya2lkLCBbW0RlZmF1bHROZXR3b3JrSURdXVxuICAgICAqIEBwYXJhbSBibG9ja2NoYWluaWQgT3B0aW9uYWwgYmxvY2tjaGFpbmlkLCBkZWZhdWx0IEJ1ZmZlci5hbGxvYygzMiwgMTYpXG4gICAgICogQHBhcmFtIG91dHMgT3B0aW9uYWwgYXJyYXkgb2YgdGhlIFtbVHJhbnNmZXJhYmxlT3V0cHV0XV1zXG4gICAgICogQHBhcmFtIGlucyBPcHRpb25hbCBhcnJheSBvZiB0aGUgW1tUcmFuc2ZlcmFibGVJbnB1dF1dc1xuICAgICAqIEBwYXJhbSBtZW1vIE9wdGlvbmFsIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IGZvciB0aGUgbWVtbyBmaWVsZFxuICAgICAqIEBwYXJhbSBkZXN0aW5hdGlvbkNoYWluIE9wdGlvbmFsIGNoYWluaWQgd2hpY2ggaWRlbnRpZmllcyB3aGVyZSB0aGUgZnVuZHMgd2lsbCBzZW50IHRvXG4gICAgICogQHBhcmFtIGV4cG9ydE91dHMgQXJyYXkgb2YgW1tUcmFuc2ZlcmFibGVPdXRwdXRzXV1zIHVzZWQgaW4gdGhlIHRyYW5zYWN0aW9uXG4gICAgICovXG4gIGNvbnN0cnVjdG9yKFxuICAgIG5ldHdvcmtpZDpudW1iZXIgPSBEZWZhdWx0TmV0d29ya0lELCBibG9ja2NoYWluaWQ6QnVmZmVyID0gQnVmZmVyLmFsbG9jKDMyLCAxNiksIFxuICAgIG91dHM6QXJyYXk8VHJhbnNmZXJhYmxlT3V0cHV0PiA9IHVuZGVmaW5lZCwgaW5zOkFycmF5PFRyYW5zZmVyYWJsZUlucHV0PiA9IHVuZGVmaW5lZCxcbiAgICBtZW1vOkJ1ZmZlciA9IHVuZGVmaW5lZCwgZGVzdGluYXRpb25DaGFpbjpCdWZmZXIgPSB1bmRlZmluZWQsIGV4cG9ydE91dHM6QXJyYXk8VHJhbnNmZXJhYmxlT3V0cHV0PiA9IHVuZGVmaW5lZFxuICApIHtcbiAgICBzdXBlcihuZXR3b3JraWQsIGJsb2NrY2hhaW5pZCwgb3V0cywgaW5zLCBtZW1vKTtcbiAgICB0aGlzLmRlc3RpbmF0aW9uQ2hhaW4gPSBkZXN0aW5hdGlvbkNoYWluOyAvLyBubyBjb3JyZWN0aW9uLCBpZiB0aGV5IGRvbid0IHBhc3MgYSBjaGFpbmlkIGhlcmUsIGl0IHdpbGwgQk9NQiBvbiB0b0J1ZmZlclxuICAgIGlmICh0eXBlb2YgZXhwb3J0T3V0cyAhPT0gJ3VuZGVmaW5lZCcgJiYgQXJyYXkuaXNBcnJheShleHBvcnRPdXRzKSkge1xuICAgICAgZm9yIChsZXQgaTpudW1iZXIgPSAwOyBpIDwgZXhwb3J0T3V0cy5sZW5ndGg7IGkrKykge1xuICAgICAgICBpZiAoIShleHBvcnRPdXRzW2ldIGluc3RhbmNlb2YgVHJhbnNmZXJhYmxlT3V0cHV0KSkge1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIkVycm9yIC0gRXhwb3J0VHguY29uc3RydWN0b3I6IGludmFsaWQgVHJhbnNmZXJhYmxlT3V0cHV0IGluIGFycmF5IHBhcmFtZXRlciAnZXhwb3J0T3V0cydcIik7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHRoaXMuZXhwb3J0T3V0cyA9IGV4cG9ydE91dHM7XG4gICAgfVxuICB9XG59Il19