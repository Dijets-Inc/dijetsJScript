"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseTx = void 0;
/**
 * @packageDocumentation
 * @module API-AVM-BaseTx
 */
const buffer_1 = require("buffer/");
const bintools_1 = __importDefault(require("../../utils/bintools"));
const constants_1 = require("./constants");
const outputs_1 = require("./outputs");
const inputs_1 = require("./inputs");
const credentials_1 = require("./credentials");
const tx_1 = require("../../common/tx");
const credentials_2 = require("../../common/credentials");
const constants_2 = require("../../utils/constants");
const tx_2 = require("./tx");
const serialization_1 = require("../../utils/serialization");
/**
 * @ignore
 */
const bintools = bintools_1.default.getInstance();
const serializer = serialization_1.Serialization.getInstance();
/**
 * Class representing a base for all transactions.
 */
class BaseTx extends tx_1.StandardBaseTx {
    /**
     * Class representing a BaseTx which is the foundation for all transactions.
     *
     * @param networkid Optional networkid, [[DefaultNetworkID]]
     * @param blockchainid Optional blockchainid, default Buffer.alloc(32, 16)
     * @param outs Optional array of the [[TransferableOutput]]s
     * @param ins Optional array of the [[TransferableInput]]s
     * @param memo Optional {@link https://github.com/feross/buffer|Buffer} for the memo field
     */
    constructor(networkid = constants_2.DefaultNetworkID, blockchainid = buffer_1.Buffer.alloc(32, 16), outs = undefined, ins = undefined, memo = undefined) {
        super(networkid, blockchainid, outs, ins, memo);
        this._typeName = "BaseTx";
        this._codecID = constants_1.AVMConstants.LATESTCODEC;
        this._typeID = this._codecID === 0 ? constants_1.AVMConstants.BASETX : constants_1.AVMConstants.BASETX_CODECONE;
        /**
         * Returns the id of the [[BaseTx]]
         */
        this.getTxType = () => {
            return this._typeID;
        };
    }
    //serialize is inherited
    deserialize(fields, encoding = "hex") {
        super.deserialize(fields, encoding);
        this.outs = fields["outs"].map((o) => {
            let newOut = new outputs_1.TransferableOutput();
            newOut.deserialize(o, encoding);
            return newOut;
        });
        this.ins = fields["ins"].map((i) => {
            let newIn = new inputs_1.TransferableInput();
            newIn.deserialize(i, encoding);
            return newIn;
        });
        this.numouts = serializer.decoder(this.outs.length.toString(), "display", "decimalString", "Buffer", 4);
        this.numins = serializer.decoder(this.ins.length.toString(), "display", "decimalString", "Buffer", 4);
    }
    getOuts() {
        return this.outs;
    }
    getIns() {
        return this.ins;
    }
    getTotalOuts() {
        return this.getOuts();
    }
    setCodecID(codecID) {
        if (codecID !== 0 && codecID !== 1) {
            /* istanbul ignore next */
            throw new Error("Error - BaseTx.setCodecID: invalid codecID. Valid codecIDs are 0 and 1.");
        }
        this._codecID = codecID;
        this._typeID = this._codecID === 0 ? constants_1.AVMConstants.BASETX : constants_1.AVMConstants.BASETX_CODECONE;
    }
    /**
     * Takes a {@link https://github.com/feross/buffer|Buffer} containing an [[BaseTx]], parses it, populates the class, and returns the length of the BaseTx in bytes.
     *
     * @param bytes A {@link https://github.com/feross/buffer|Buffer} containing a raw [[BaseTx]]
     *
     * @returns The length of the raw [[BaseTx]]
     *
     * @remarks assume not-checksummed
     */
    fromBuffer(bytes, offset = 0) {
        this.networkid = bintools.copyFrom(bytes, offset, offset + 4);
        offset += 4;
        this.blockchainid = bintools.copyFrom(bytes, offset, offset + 32);
        offset += 32;
        this.numouts = bintools.copyFrom(bytes, offset, offset + 4);
        offset += 4;
        const outcount = this.numouts.readUInt32BE(0);
        this.outs = [];
        for (let i = 0; i < outcount; i++) {
            const xferout = new outputs_1.TransferableOutput();
            offset = xferout.fromBuffer(bytes, offset);
            this.outs.push(xferout);
        }
        this.numins = bintools.copyFrom(bytes, offset, offset + 4);
        offset += 4;
        const incount = this.numins.readUInt32BE(0);
        this.ins = [];
        for (let i = 0; i < incount; i++) {
            const xferin = new inputs_1.TransferableInput();
            offset = xferin.fromBuffer(bytes, offset);
            this.ins.push(xferin);
        }
        let memolen = bintools.copyFrom(bytes, offset, offset + 4).readUInt32BE(0);
        offset += 4;
        this.memo = bintools.copyFrom(bytes, offset, offset + memolen);
        offset += memolen;
        return offset;
    }
    /**
     * Takes the bytes of an [[UnsignedTx]] and returns an array of [[Credential]]s
     *
     * @param msg A Buffer for the [[UnsignedTx]]
     * @param kc An [[KeyChain]] used in signing
     *
     * @returns An array of [[Credential]]s
     */
    sign(msg, kc) {
        const sigs = [];
        for (let i = 0; i < this.ins.length; i++) {
            const cred = credentials_1.SelectCredentialClass(this.ins[i].getInput().getCredentialID());
            const sigidxs = this.ins[i].getInput().getSigIdxs();
            for (let j = 0; j < sigidxs.length; j++) {
                const keypair = kc.getKey(sigidxs[j].getSource());
                const signval = keypair.sign(msg);
                const sig = new credentials_2.Signature();
                sig.fromBuffer(signval);
                cred.addSignature(sig);
            }
            sigs.push(cred);
        }
        return sigs;
    }
    clone() {
        let newbase = new BaseTx();
        newbase.fromBuffer(this.toBuffer());
        return newbase;
    }
    create(...args) {
        return new BaseTx(...args);
    }
    select(id, ...args) {
        let newbasetx = tx_2.SelectTxClass(id, ...args);
        return newbasetx;
    }
}
exports.BaseTx = BaseTx;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmFzZXR4LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vc3JjL2FwaXMvYXZtL2Jhc2V0eC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQTs7O0dBR0c7QUFDSCxvQ0FBaUM7QUFDakMsb0VBQTRDO0FBQzVDLDJDQUEyQztBQUMzQyx1Q0FBK0M7QUFDL0MscUNBQTZDO0FBQzdDLCtDQUFzRDtBQUV0RCx3Q0FBaUQ7QUFDakQsMERBQXlFO0FBQ3pFLHFEQUF5RDtBQUN6RCw2QkFBcUM7QUFDckMsNkRBQThFO0FBRTlFOztHQUVHO0FBQ0gsTUFBTSxRQUFRLEdBQUcsa0JBQVEsQ0FBQyxXQUFXLEVBQUUsQ0FBQztBQUN4QyxNQUFNLFVBQVUsR0FBRyw2QkFBYSxDQUFDLFdBQVcsRUFBRSxDQUFDO0FBRS9DOztHQUVHO0FBQ0gsTUFBYSxNQUFRLFNBQVEsbUJBQWlDO0lBbUk1RDs7Ozs7Ozs7T0FRRztJQUNILFlBQVksWUFBbUIsNEJBQWdCLEVBQUUsZUFBc0IsZUFBTSxDQUFDLEtBQUssQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsT0FBaUMsU0FBUyxFQUFFLE1BQStCLFNBQVMsRUFBRSxPQUFjLFNBQVM7UUFDeE0sS0FBSyxDQUFDLFNBQVMsRUFBRSxZQUFZLEVBQUUsSUFBSSxFQUFFLEdBQUcsRUFBRSxJQUFJLENBQUMsQ0FBQztRQTVJeEMsY0FBUyxHQUFHLFFBQVEsQ0FBQztRQUNyQixhQUFRLEdBQUcsd0JBQVksQ0FBQyxXQUFXLENBQUM7UUFDcEMsWUFBTyxHQUFHLElBQUksQ0FBQyxRQUFRLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyx3QkFBWSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsd0JBQVksQ0FBQyxlQUFlLENBQUM7UUF5QzdGOztXQUVHO1FBQ0gsY0FBUyxHQUFHLEdBQVUsRUFBRTtZQUN0QixPQUFPLElBQUksQ0FBQyxPQUFPLENBQUM7UUFDdEIsQ0FBQyxDQUFBO0lBNkZELENB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TyxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQztRQUNwQyxPQUFPLE9BQWUsQ0FBQztJQUN6QixDQUFDO0lBRUQsTUFBTSxDQUFDLEdBQUcsSUFBVTtRQUNsQixPQUFPLElBQUksTUFBTSxDQUFDLEdBQUcsSUFBSSxDQUFTLENBQUM7SUFDckMsQ0FBQztJQUVELE1BQU0sQ0FBQyxFQUFTLEVBQUUsR0FBRyxJQUFVO1FBQzdCLElBQUksU0FBUyxHQUFVLGtCQUFhLENBQUMsRUFBRSxFQUFFLEdBQUcsSUFBSSxDQUFDLENBQUM7UUFDbEQsT0FBTyxTQUFpQixDQUFDO0lBQzNCLENBQUM7Q0FjRjtBQS9JRCx3QkErSUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBwYWNrYWdlRG9jdW1lbnRhdGlvblxuICogQG1vZHVsZSBBUEktQVZNLUJhc2VUeFxuICovXG5pbXBvcnQgeyBCdWZmZXIgfSBmcm9tICdidWZmZXIvJztcbmltcG9ydCBCaW5Ub29scyBmcm9tICcuLi8uLi91dGlscy9iaW50b29scyc7XG5pbXBvcnQgeyBBVk1Db25zdGFudHMgfSBmcm9tICcuL2NvbnN0YW50cyc7XG5pbXBvcnQgeyBUcmFuc2ZlcmFibGVPdXRwdXQgfSBmcm9tICcuL291dHB1dHMnO1xuaW1wb3J0IHsgVHJhbnNmZXJhYmxlSW5wdXQgfSBmcm9tICcuL2lucHV0cyc7XG5pbXBvcnQgeyBTZWxlY3RDcmVkZW50aWFsQ2xhc3MgfSBmcm9tICcuL2NyZWRlbnRpYWxzJztcbmltcG9ydCB7IEtleUNoYWluLCBLZXlQYWlyIH0gZnJvbSAnLi9rZXljaGFpbic7XG5pbXBvcnQgeyBTdGFuZGFyZEJhc2VUeCB9IGZyb20gJy4uLy4uL2NvbW1vbi90eCc7XG5pbXBvcnQgeyBTaWduYXR1cmUsIFNpZ0lkeCwgQ3JlZGVudGlhbCB9IGZyb20gJy4uLy4uL2NvbW1vbi9jcmVkZW50aWFscyc7XG5pbXBvcnQgeyBEZWZhdWx0TmV0d29ya0lEIH0gZnJvbSAnLi4vLi4vdXRpbHMvY29uc3RhbnRzJztcbmltcG9ydCB7IFNlbGVjdFR4Q2xhc3MgfSBmcm9tICcuL3R4JztcbmltcG9ydCB7IFNlcmlhbGl6YXRpb24sIFNlcmlhbGl6ZWRFbmNvZGluZyB9IGZyb20gJy4uLy4uL3V0aWxzL3NlcmlhbGl6YXRpb24nO1xuXG4vKipcbiAqIEBpZ25vcmVcbiAqL1xuY29uc3QgYmludG9vbHMgPSBCaW5Ub29scy5nZXRJbnN0YW5jZSgpO1xuY29uc3Qgc2VyaWFsaXplciA9IFNlcmlhbGl6YXRpb24uZ2V0SW5zdGFuY2UoKTtcblxuLyoqXG4gKiBDbGFzcyByZXByZXNlbnRpbmcgYSBiYXNlIGZvciBhbGwgdHJhbnNhY3Rpb25zLlxuICovXG5leHBvcnQgY2xhc3MgQmFzZVR4ICBleHRlbmRzIFN0YW5kYXJkQmFzZVR4PEtleVBhaXIsIEtleUNoYWluPntcbiAgcHJvdGVjdGVkIF90eXBlTmFtZSA9IFwiQmFzZVR4XCI7XG4gIHByb3RlY3RlZCBfY29kZWNJRCA9IEFWTUNvbnN0YW50cy5MQVRFU1RDT0RFQztcbiAgcHJvdGVjdGVkIF90eXBlSUQgPSB0aGlzLl9jb2RlY0lEID09PSAwID8gQVZNQ29uc3RhbnRzLkJBU0VUWCA6IEFWTUNvbnN0YW50cy5CQVNFVFhfQ09ERUNPTkU7XG5cbiAgLy9zZXJpYWxpemUgaXMgaW5oZXJpdGVkXG5cbiAgZGVzZXJpYWxpemUoZmllbGRzOm9iamVjdCwgZW5jb2Rpbmc6U2VyaWFsaXplZEVuY29kaW5nID0gXCJoZXhcIikge1xuICAgIHN1cGVyLmRlc2VyaWFsaXplKGZpZWxkcywgZW5jb2RpbmcpO1xuICAgIHRoaXMub3V0cyA9IGZpZWxkc1tcIm91dHNcIl0ubWFwKChvOlRyYW5zZmVyYWJsZU91dHB1dCkgPT4ge1xuICAgICAgbGV0IG5ld091dDpUcmFuc2ZlcmFibGVPdXRwdXQgPSBuZXcgVHJhbnNmZXJhYmxlT3V0cHV0KCk7XG4gICAgICBuZXdPdXQuZGVzZXJpYWxpemUobywgZW5jb2RpbmcpO1xuICAgICAgcmV0dXJuIG5ld091dDtcbiAgICB9KTtcbiAgICB0aGlzLmlucyA9IGZpZWxkc1tcImluc1wiXS5tYXAoKGk6VHJhbnNmZXJhYmxlSW5wdXQpID0+IHtcbiAgICAgIGxldCBuZXdJbjpUcmFuc2ZlcmFibGVJbnB1dCA9IG5ldyBUcmFuc2ZlcmFibGVJbnB1dCgpO1xuICAgICAgbmV3SW4uZGVzZXJpYWxpemUoaSwgZW5jb2RpbmcpO1xuICAgICAgcmV0dXJuIG5ld0luO1xuICAgIH0pO1xuICAgIHRoaXMubnVtb3V0cyA9IHNlcmlhbGl6ZXIuZGVjb2Rlcih0aGlzLm91dHMubGVuZ3RoLnRvU3RyaW5nKCksIFwiZGlzcGxheVwiLCBcImRlY2ltYWxTdHJpbmdcIiwgXCJCdWZmZXJcIiwgNCk7XG4gICAgdGhpcy5udW1pbnMgPSBzZXJpYWxpemVyLmRlY29kZXIodGhpcy5pbnMubGVuZ3RoLnRvU3RyaW5nKCksIFwiZGlzcGxheVwiLCBcImRlY2ltYWxTdHJpbmdcIiwgXCJCdWZmZXJcIiwgNCk7XG4gIH1cblxuICBnZXRPdXRzKCk6QXJyYXk8VHJhbnNmZXJhYmxlT3V0cHV0PiB7XG4gICAgcmV0dXJuIHRoaXMub3V0cyBhcyBBcnJheTxUcmFuc2ZlcmFibGVPdXRwdXQ+O1xuICB9XG5cbiAgZ2V0SW5zKCk6QXJyYXk8VHJhbnNmZXJhYmxlSW5wdXQ+IHtcbiAgICByZXR1cm4gdGhpcy5pbnMgYXMgQXJyYXk8VHJhbnNmZXJhYmxlSW5wdXQ+O1xuICB9XG5cbiAgZ2V0VG90YWxPdXRzKCk6QXJyYXk8VHJhbnNmZXJhYmxlT3V0cHV0PiB7XG4gICAgcmV0dXJuIHRoaXMuZ2V0T3V0cygpIGFzIEFycmF5PFRyYW5zZmVyYWJsZU91dHB1dD47XG4gIH1cblxuICBzZXRDb2RlY0lEKGNvZGVjSUQ6IG51bWJlcik6IHZvaWQge1xuICAgIGlmKGNvZGVjSUQgIT09IDAgJiYgY29kZWNJRCAhPT0gMSkge1xuICAgICAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiRXJyb3IgLSBCYXNlVHguc2V0Q29kZWNJRDogaW52YWxpZCBjb2RlY0lELiBWYWxpZCBjb2RlY0lEcyBhcmUgMCBhbmQgMS5cIik7XG4gICAgfVxuICAgIHRoaXMuX2NvZGVjSUQgPSBjb2RlY0lEO1xuICAgIHRoaXMuX3R5cGVJRCA9IHRoaXMuX2NvZGVjSUQgPT09IDAgPyBBVk1Db25zdGFudHMuQkFTRVRYIDogQVZNQ29uc3RhbnRzLkJBU0VUWF9DT0RFQ09ORTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSBpZCBvZiB0aGUgW1tCYXNlVHhdXVxuICAgKi9cbiAgZ2V0VHhUeXBlID0gKCk6bnVtYmVyID0+IHtcbiAgICByZXR1cm4gdGhpcy5fdHlwZUlEO1xuICB9XG5cbiAgLyoqXG4gICAqIFRha2VzIGEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0gY29udGFpbmluZyBhbiBbW0Jhc2VUeF1dLCBwYXJzZXMgaXQsIHBvcHVsYXRlcyB0aGUgY2xhc3MsIGFuZCByZXR1cm5zIHRoZSBsZW5ndGggb2YgdGhlIEJhc2VUeCBpbiBieXRlcy5cbiAgICpcbiAgICogQHBhcmFtIGJ5dGVzIEEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0gY29udGFpbmluZyBhIHJhdyBbW0Jhc2VUeF1dXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSBsZW5ndGggb2YgdGhlIHJhdyBbW0Jhc2VUeF1dXG4gICAqXG4gICAqIEByZW1hcmtzIGFzc3VtZSBub3QtY2hlY2tzdW1tZWRcbiAgICovXG4gIGZyb21CdWZmZXIoYnl0ZXM6QnVmZmVyLCBvZmZzZXQ6bnVtYmVyID0gMCk6bnVtYmVyIHtcbiAgICB0aGlzLm5ldHdvcmtpZCA9IGJpbnRvb2xzLmNvcHlGcm9tKGJ5dGVzLCBvZmZzZXQsIG9mZnNldCArIDQpO1xuICAgIG9mZnNldCArPSA0O1xuICAgIHRoaXMuYmxvY2tjaGFpbmlkID0gYmludG9vbHMuY29weUZyb20oYnl0ZXMsIG9mZnNldCwgb2Zmc2V0ICsgMzIpO1xuICAgIG9mZnNldCArPSAzMjtcbiAgICB0aGlzLm51bW91dHMgPSBiaW50b29scy5jb3B5RnJvbShieXRlcywgb2Zmc2V0LCBvZmZzZXQgKyA0KTtcbiAgICBvZmZzZXQgKz0gNDtcbiAgICBjb25zdCBvdXRjb3VudDpudW1iZXIgPSB0aGlzLm51bW91dHMucmVhZFVJbnQzMkJFKDApO1xuICAgIHRoaXMub3V0cyA9IFtdO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgb3V0Y291bnQ7IGkrKykge1xuICAgICAgY29uc3QgeGZlcm91dDpUcmFuc2ZlcmFibGVPdXRwdXQgPSBuZXcgVHJhbnNmZXJhYmxlT3V0cHV0KCk7XG4gICAgICBvZmZzZXQgPSB4ZmVyb3V0LmZyb21CdWZmZXIoYnl0ZXMsIG9mZnNldCk7XG4gICAgICB0aGlzLm91dHMucHVzaCh4ZmVyb3V0KTtcbiAgICB9XG5cbiAgICB0aGlzLm51bWlucyA9IGJpbnRvb2xzLmNvcHlGcm9tKGJ5dGVzLCBvZmZzZXQsIG9mZnNldCArIDQpO1xuICAgIG9mZnNldCArPSA0O1xuICAgIGNvbnN0IGluY291bnQ6bnVtYmVyID0gdGhpcy5udW1pbnMucmVhZFVJbnQzMkJFKDApO1xuICAgIHRoaXMuaW5zID0gW107XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBpbmNvdW50OyBpKyspIHtcbiAgICAgIGNvbnN0IHhmZXJpbjpUcmFuc2ZlcmFibGVJbnB1dCA9IG5ldyBUcmFuc2ZlcmFibGVJbnB1dCgpO1xuICAgICAgb2Zmc2V0ID0geGZlcmluLmZyb21CdWZmZXIoYnl0ZXMsIG9mZnNldCk7XG4gICAgICB0aGlzLmlucy5wdXNoKHhmZXJpbik7XG4gICAgfVxuICAgIGxldCBtZW1vbGVuOm51bWJlciA9IGJpbnRvb2xzLmNvcHlGcm9tKGJ5dGVzLCBvZmZzZXQsIG9mZnNldCArIDQpLnJlYWRVSW50MzJCRSgwKTtcbiAgICBvZmZzZXQgKz0gNDtcbiAgICB0aGlzLm1lbW8gPSBiaW50b29scy5jb3B5RnJvbShieXRlcywgb2Zmc2V0LCBvZmZzZXQgKyBtZW1vbGVuKTtcbiAgICBvZmZzZXQgKz0gbWVtb2xlbjtcbiAgICByZXR1cm4gb2Zmc2V0O1xuICB9XG5cbiAgLyoqXG4gICAqIFRha2VzIHRoZSBieXRlcyBvZiBhbiBbW1Vuc2lnbmVkVHhdXSBhbmQgcmV0dXJucyBhbiBhcnJheSBvZiBbW0NyZWRlbnRpYWxdXXNcbiAgICpcbiAgICogQHBhcmFtIG1zZyBBIEJ1ZmZlciBmb3IgdGhlIFtbVW5zaWduZWRUeF1dXG4gICAqIEBwYXJhbSBrYyBBbiBbW0tleUNoYWluXV0gdXNlZCBpbiBzaWduaW5nXG4gICAqXG4gICAqIEByZXR1cm5zIEFuIGFycmF5IG9mIFtbQ3JlZGVudGlhbF1dc1xuICAgKi9cbiAgc2lnbihtc2c6QnVmZmVyLCBrYzpLZXlDaGFpbik6QXJyYXk8Q3JlZGVudGlhbD4ge1xuICAgIGNvbnN0IHNpZ3M6QXJyYXk8Q3JlZGVudGlhbD4gPSBbXTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMuaW5zLmxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCBjcmVkOkNyZWRlbnRpYWwgPSBTZWxlY3RDcmVkZW50aWFsQ2xhc3ModGhpcy5pbnNbaV0uZ2V0SW5wdXQoKS5nZXRDcmVkZW50aWFsSUQoKSk7XG4gICAgICBjb25zdCBzaWdpZHhzOkFycmF5PFNpZ0lkeD4gPSB0aGlzLmluc1tpXS5nZXRJbnB1dCgpLmdldFNpZ0lkeHMoKTtcbiAgICAgIGZvciAobGV0IGogPSAwOyBqIDwgc2lnaWR4cy5sZW5ndGg7IGorKykge1xuICAgICAgICBjb25zdCBrZXlwYWlyOktleVBhaXIgPSBrYy5nZXRLZXkoc2lnaWR4c1tqXS5nZXRTb3VyY2UoKSk7XG4gICAgICAgIGNvbnN0IHNpZ252YWw6QnVmZmVyID0ga2V5cGFpci5zaWduKG1zZyk7XG4gICAgICAgIGNvbnN0IHNpZzpTaWduYXR1cmUgPSBuZXcgU2lnbmF0dXJlKCk7XG4gICAgICAgIHNpZy5mcm9tQnVmZmVyKHNpZ252YWwpO1xuICAgICAgICBjcmVkLmFkZFNpZ25hdHVyZShzaWcpO1xuICAgICAgfVxuICAgICAgc2lncy5wdXNoKGNyZWQpO1xuICAgIH1cbiAgICByZXR1cm4gc2lncztcbiAgfVxuXG4gIGNsb25lKCk6dGhpcyB7XG4gICAgbGV0IG5ld2Jhc2U6QmFzZVR4ID0gbmV3IEJhc2VUeCgpO1xuICAgIG5ld2Jhc2UuZnJvbUJ1ZmZlcih0aGlzLnRvQnVmZmVyKCkpO1xuICAgIHJldHVybiBuZXdiYXNlIGFzIHRoaXM7XG4gIH1cblxuICBjcmVhdGUoLi4uYXJnczphbnlbXSk6dGhpcyB7XG4gICAgcmV0dXJuIG5ldyBCYXNlVHgoLi4uYXJncykgYXMgdGhpcztcbiAgfVxuXG4gIHNlbGVjdChpZDpudW1iZXIsIC4uLmFyZ3M6YW55W10pOnRoaXMge1xuICAgIGxldCBuZXdiYXNldHg6QmFzZVR4ID0gU2VsZWN0VHhDbGFzcyhpZCwgLi4uYXJncyk7XG4gICAgcmV0dXJuIG5ld2Jhc2V0eCBhcyB0aGlzO1xuICB9XG5cbiAgLyoqXG4gICAqIENsYXNzIHJlcHJlc2VudGluZyBhIEJhc2VUeCB3aGljaCBpcyB0aGUgZm91bmRhdGlvbiBmb3IgYWxsIHRyYW5zYWN0aW9ucy5cbiAgICpcbiAgICogQHBhcmFtIG5ldHdvcmtpZCBPcHRpb25hbCBuZXR3b3JraWQsIFtbRGVmYXVsdE5ldHdvcmtJRF1dXG4gICAqIEBwYXJhbSBibG9ja2NoYWluaWQgT3B0aW9uYWwgYmxvY2tjaGFpbmlkLCBkZWZhdWx0IEJ1ZmZlci5hbGxvYygzMiwgMTYpXG4gICAqIEBwYXJhbSBvdXRzIE9wdGlvbmFsIGFycmF5IG9mIHRoZSBbW1RyYW5zZmVyYWJsZU91dHB1dF1dc1xuICAgKiBAcGFyYW0gaW5zIE9wdGlvbmFsIGFycmF5IG9mIHRoZSBbW1RyYW5zZmVyYWJsZUlucHV0XV1zXG4gICAqIEBwYXJhbSBtZW1vIE9wdGlvbmFsIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IGZvciB0aGUgbWVtbyBmaWVsZFxuICAgKi9cbiAgY29uc3RydWN0b3IobmV0d29ya2lkOm51bWJlciA9IERlZmF1bHROZXR3b3JrSUQsIGJsb2NrY2hhaW5pZDpCdWZmZXIgPSBCdWZmZXIuYWxsb2MoMzIsIDE2KSwgb3V0czpBcnJheTxUcmFuc2ZlcmFibGVPdXRwdXQ+ID0gdW5kZWZpbmVkLCBpbnM6QXJyYXk8VHJhbnNmZXJhYmxlSW5wdXQ+ID0gdW5kZWZpbmVkLCBtZW1vOkJ1ZmZlciA9IHVuZGVmaW5lZCkge1xuICAgIHN1cGVyKG5ldHdvcmtpZCwgYmxvY2tjaGFpbmlkLCBvdXRzLCBpbnMsIG1lbW8pO1xuICB9XG59Il19