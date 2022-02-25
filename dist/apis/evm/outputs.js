"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EVMOutput = exports.SECPTransferOutput = exports.AmountOutput = exports.TransferableOutput = exports.SelectOutputClass = void 0;
/**
 * @packageDocumentation
 * @module API-EVM-Outputs
 */
const buffer_1 = require("buffer/");
const bn_js_1 = __importDefault(require("bn.js"));
const bintools_1 = __importDefault(require("../../utils/bintools"));
const constants_1 = require("./constants");
const output_1 = require("../../common/output");
const bintools = bintools_1.default.getInstance();
/**
 * Takes a buffer representing the output and returns the proper Output instance.
 *
 * @param outputID A number representing the outputID parsed prior to the bytes passed in
 *
 * @returns An instance of an [[Output]]-extended class.
 */
exports.SelectOutputClass = (outputID, ...args) => {
    if (outputID == constants_1.EVMConstants.SECPXFEROUTPUTID) {
        return new SECPTransferOutput(...args);
    }
    throw new Error("Error - SelectOutputClass: unknown outputID");
};
class TransferableOutput extends output_1.StandardTransferableOutput {
    constructor() {
        super(...arguments);
        this._typeName = "TransferableOutput";
        this._typeID = undefined;
    }
    //serialize is inherited
    deserialize(fields, encoding = "hex") {
        super.deserialize(fields, encoding);
        this.output = exports.SelectOutputClass(fields["output"]["_typeID"]);
        this.output.deserialize(fields["output"], encoding);
    }
    fromBuffer(bytes, offset = 0) {
        this.assetID = bintools.copyFrom(bytes, offset, offset + constants_1.EVMConstants.ASSETIDLEN);
        offset += constants_1.EVMConstants.ASSETIDLEN;
        const outputid = bintools.copyFrom(bytes, offset, offset + 4).readUInt32BE(0);
        offset += 4;
        this.output = exports.SelectOutputClass(outputid);
        return this.output.fromBuffer(bytes, offset);
    }
}
exports.TransferableOutput = TransferableOutput;
class AmountOutput extends output_1.StandardAmountOutput {
    constructor() {
        super(...arguments);
        this._typeName = "AmountOutput";
        this._typeID = undefined;
    }
    //serialize and deserialize both are inherited
    /**
     *
     * @param assetID An assetID which is wrapped around the Buffer of the Output
     */
    makeTransferable(assetID) {
        return new TransferableOutput(assetID, this);
    }
    select(id, ...args) {
        return exports.SelectOutputClass(id, ...args);
    }
}
exports.AmountOutput = AmountOutput;
/**
 * An [[Output]] class which specifies an Output that carries an ammount for an assetID and uses secp256k1 signature scheme.
 */
class SECPTransferOutput extends AmountOutput {
    constructor() {
        super(...arguments);
        this._typeName = "SECPTransferOutput";
        this._typeID = constants_1.EVMConstants.SECPXFEROUTPUTID;
    }
    //serialize and deserialize both are inherited
    /**
       * Returns the outputID for this output
       */
    getOutputID() {
        return this._typeID;
    }
    create(...args) {
        return new SECPTransferOutput(...args);
    }
    clone() {
        const newout = this.create();
        newout.fromBuffer(this.toBuffer());
        return newout;
    }
}
exports.SECPTransferOutput = SECPTransferOutput;
class EVMOutput {
    /**
     * An [[EVMOutput]] class which contains address, amount, and assetID.
     *
     * @param address The address recieving the asset as a {@link https://github.com/feross/buffer|Buffer} or a string.
     * @param amount A {@link https://github.com/indutny/bn.js/|BN} or number representing the amount.
     * @param assetID The assetID which is being sent as a {@link https://github.com/feross/buffer|Buffer} or a string.
     */
    constructor(address = undefined, amount = undefined, assetID = undefined) {
        this.address = buffer_1.Buffer.alloc(20);
        this.amount = buffer_1.Buffer.alloc(8);
        this.amountValue = new bn_js_1.default(0);
        this.assetID = buffer_1.Buffer.alloc(32);
        /**
         * Returns the address of the input as {@link https://github.com/feross/buffer|Buffer}
         */
        this.getAddress = () => this.address;
        /**
         * Returns the address as a bech32 encoded string.
         */
        this.getAddressString = () => this.address.toString('hex');
        /**
         * Returns the amount as a {@link https://github.com/indutny/bn.js/|BN}.
         */
        this.getAmount = () => this.amountValue.clone();
        /**
         * Returns the assetid of the input as {@link https://github.com/feross/buffer|Buffer}
         */
        this.getAssetID = () => this.assetID;
        if (typeof address !== 'undefined' && typeof amount !== 'undefined' && typeof assetID !== 'undefined') {
            if (typeof address === 'string') {
                // if present then remove `0x` prefix
                let prefix = address.substring(0, 2);
                if (prefix === '0x') {
                    address = address.split('x')[1];
                }
                address = buffer_1.Buffer.from(address, 'hex');
            }
            // convert number amount to BN
            let amnt;
            if (typeof amount === 'number') {
                amnt = new bn_js_1.default(amount);
            }
            else {
                amnt = amount;
            }
            // convert string assetID to Buffer
            if (!(assetID instanceof buffer_1.Buffer)) {
                assetID = bintools.cb58Decode(assetID);
            }
            this.address = address;
            this.amountValue = amnt.clone();
            this.amount = bintools.fromBNToBuffer(amnt, 8);
            this.assetID = assetID;
        }
    }
    /**
     * Returns a {@link https://github.com/feross/buffer|Buffer} representation of the [[EVMOutput]].
     */
    toBuffer() {
        const bsize = this.address.length + this.amount.length + this.assetID.length;
        const barr = [this.address, this.amount, this.assetID];
        const buff = buffer_1.Buffer.concat(barr, bsize);
        return buff;
    }
    /**
     * Decodes the [[EVMOutput]] as a {@link https://github.com/feross/buffer|Buffer} and returns the size.
     */
    fromBuffer(bytes, offset = 0) {
        this.address = bintools.copyFrom(bytes, offset, offset + 20);
        offset += 20;
        this.amount = bintools.copyFrom(bytes, offset, offset + 8);
        offset += 8;
        this.assetID = bintools.copyFrom(bytes, offset, offset + 32);
        offset += 32;
        return offset;
    }
    /**
     * Returns a base-58 representation of the [[EVMOutput]].
     */
    toString() {
        return bintools.bufferToB58(this.toBuffer());
    }
    create(...args) {
        return new EVMOutput(...args);
    }
    clone() {
        const newEVMOutput = this.create();
        newEVMOutput.fromBuffer(this.toBuffer());
        return newEVMOutput;
    }
}
exports.EVMOutput = EVMOutput;
/**
* Returns a function used to sort an array of [[EVMOutput]]s
*/
EVMOutput.comparator = () => (a, b) => {
    // primarily sort by address
    let sorta = a.getAddress();
    let sortb = b.getAddress();
    // secondarily sort by assetID
    if (sorta.equals(sortb)) {
        sorta = a.getAssetID();
        sortb = b.getAssetID();
    }
    return buffer_1.Buffer.compare(sorta, sortb);
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib3V0cHV0cy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9hcGlzL2V2bS9vdXRwdXRzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBOzs7R0FHRztBQUNILG9DQUFpQztBQUNqQyxrREFBdUI7QUFDdkIsb0VBQTRDO0FBQzVDLDJDQUEyQztBQUMzQyxnREFBK0Y7QUFJL0YsTUFBTSxRQUFRLEdBQWEsa0JBQVEsQ0FBQyxXQUFXLEVBQUUsQ0FBQztBQUVsRDs7Ozs7O0dBTUc7QUFDVSxRQUFBLGlCQUFpQixHQUFHLENBQUMsUUFBZ0IsRUFBRSxHQUFHLElBQVcsRUFBVSxFQUFFO0lBQzVFLElBQUcsUUFBUSxJQUFJLHdCQUFZLENBQUMsZ0JBQWdCLEVBQUM7UUFDM0MsT0FBTyxJQUFJLGtCQUFrQixDQUFFLEdBQUcsSUFBSSxDQUFDLENBQUM7S0FDekM7SUFDRCxNQUFNLElBQUksS0FBSyxDQUFDLDZDQUE2QyxDQUFDLENBQUM7QUFDakUsQ0FBQyxDQUFBO0FBRUQsTUFBYSxrQkFBbUIsU0FBUSxtQ0FBMEI7SUFBbEU7O1FBQ1ksY0FBUyxHQUFHLG9CQUFvQixDQUFDO1FBQ2pDLFlBQU8sR0FBRyxTQUFTLENBQUM7SUFrQmhDLENBQUM7SUFoQkMsd0JBQXdCO0lBRXhCLFdBQVcsQ0FBQyxNQUFjLEVBQUUsV0FBK0IsS0FBSztRQUM5RCxLQUFLLENBQUMsV0FBVyxDQUFDLE1BQU0sRUFBRSxRQUFRLENBQUMsQ0FBQztRQUNwQyxJQUFJLENBQUMsTUFBTSxHQUFHLHlCQUFpQixDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDO1FBQzdELElBQUksQ0FBQyxNQUFNLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsRUFBRSxRQUFRLENBQUMsQ0FBQztJQUN0RCxDQUFDO0lBRUQsVUFBVSxDQUFDLEtBQWEsRUFBRSxTQUFpQixDQUFDO1FBQzFDLElBQUks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OUMsWUFBWSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQztRQUN6QyxPQUFPLFlBQW9CLENBQUM7SUFDOUIsQ0FBQzs7QUEvRUgsOEJBMEhDO0FBcEhDOztFQUVFO0FBQ0ssb0JBQVUsR0FBRyxHQUFtRSxFQUFFLENBQUMsQ0FBQyxDQUF1QixFQUFFLENBQXVCLEVBQVksRUFBRTtJQUN2Siw0QkFBNEI7SUFDNUIsSUFBSSxLQUFLLEdBQVcsQ0FBQyxDQUFDLFVBQVUsRUFBRSxDQUFDO0lBQ25DLElBQUksS0FBSyxHQUFXLENBQUMsQ0FBQyxVQUFVLEVBQUUsQ0FBQztJQUNuQyw4QkFBOEI7SUFDOUIsSUFBRyxLQUFLLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxFQUFFO1FBQ3RCLEtBQUssR0FBRyxDQUFDLENBQUMsVUFBVSxFQUFFLENBQUM7UUFDdkIsS0FBSyxHQUFHLENBQUMsQ0FBQyxVQUFVLEVBQUUsQ0FBQztLQUN4QjtJQUNELE9BQU8sZUFBTSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsS0FBSyxDQUFhLENBQUM7QUFDbEQsQ0FBQyxDQUFBIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAcGFja2FnZURvY3VtZW50YXRpb25cbiAqIEBtb2R1bGUgQVBJLUVWTS1PdXRwdXRzXG4gKi9cbmltcG9ydCB7IEJ1ZmZlciB9IGZyb20gJ2J1ZmZlci8nO1xuaW1wb3J0IEJOIGZyb20gJ2JuLmpzJztcbmltcG9ydCBCaW5Ub29scyBmcm9tICcuLi8uLi91dGlscy9iaW50b29scyc7XG5pbXBvcnQgeyBFVk1Db25zdGFudHMgfSBmcm9tICcuL2NvbnN0YW50cyc7XG5pbXBvcnQgeyBPdXRwdXQsIFN0YW5kYXJkQW1vdW50T3V0cHV0LCBTdGFuZGFyZFRyYW5zZmVyYWJsZU91dHB1dCB9IGZyb20gJy4uLy4uL2NvbW1vbi9vdXRwdXQnO1xuaW1wb3J0IHsgU2VyaWFsaXplZEVuY29kaW5nIH0gZnJvbSAnLi4vLi4vdXRpbHMvc2VyaWFsaXphdGlvbic7XG5pbXBvcnQgeyBFVk1JbnB1dCB9IGZyb20gJy4vaW5wdXRzJztcblxuY29uc3QgYmludG9vbHM6IEJpblRvb2xzID0gQmluVG9vbHMuZ2V0SW5zdGFuY2UoKTtcblxuLyoqXG4gKiBUYWtlcyBhIGJ1ZmZlciByZXByZXNlbnRpbmcgdGhlIG91dHB1dCBhbmQgcmV0dXJucyB0aGUgcHJvcGVyIE91dHB1dCBpbnN0YW5jZS5cbiAqXG4gKiBAcGFyYW0gb3V0cHV0SUQgQSBudW1iZXIgcmVwcmVzZW50aW5nIHRoZSBvdXRwdXRJRCBwYXJzZWQgcHJpb3IgdG8gdGhlIGJ5dGVzIHBhc3NlZCBpblxuICpcbiAqIEByZXR1cm5zIEFuIGluc3RhbmNlIG9mIGFuIFtbT3V0cHV0XV0tZXh0ZW5kZWQgY2xhc3MuXG4gKi9cbmV4cG9ydCBjb25zdCBTZWxlY3RPdXRwdXRDbGFzcyA9IChvdXRwdXRJRDogbnVtYmVyLCAuLi5hcmdzOiBhbnlbXSk6IE91dHB1dCA9PiB7XG4gIGlmKG91dHB1dElEID09IEVWTUNvbnN0YW50cy5TRUNQWEZFUk9VVFBVVElEKXtcbiAgICByZXR1cm4gbmV3IFNFQ1BUcmFuc2Zlck91dHB1dCggLi4uYXJncyk7XG4gIH1cbiAgdGhyb3cgbmV3IEVycm9yKFwiRXJyb3IgLSBTZWxlY3RPdXRwdXRDbGFzczogdW5rbm93biBvdXRwdXRJRFwiKTtcbn1cblxuZXhwb3J0IGNsYXNzIFRyYW5zZmVyYWJsZU91dHB1dCBleHRlbmRzIFN0YW5kYXJkVHJhbnNmZXJhYmxlT3V0cHV0e1xuICBwcm90ZWN0ZWQgX3R5cGVOYW1lID0gXCJUcmFuc2ZlcmFibGVPdXRwdXRcIjtcbiAgcHJvdGVjdGVkIF90eXBlSUQgPSB1bmRlZmluZWQ7XG5cbiAgLy9zZXJpYWxpemUgaXMgaW5oZXJpdGVkXG5cbiAgZGVzZXJpYWxpemUoZmllbGRzOiBvYmplY3QsIGVuY29kaW5nOiBTZXJpYWxpemVkRW5jb2RpbmcgPSBcImhleFwiKSB7XG4gICAgc3VwZXIuZGVzZXJpYWxpemUoZmllbGRzLCBlbmNvZGluZyk7XG4gICAgdGhpcy5vdXRwdXQgPSBTZWxlY3RPdXRwdXRDbGFzcyhmaWVsZHNbXCJvdXRwdXRcIl1bXCJfdHlwZUlEXCJdKTtcbiAgICB0aGlzLm91dHB1dC5kZXNlcmlhbGl6ZShmaWVsZHNbXCJvdXRwdXRcIl0sIGVuY29kaW5nKTtcbiAgfVxuXG4gIGZyb21CdWZmZXIoYnl0ZXM6IEJ1ZmZlciwgb2Zmc2V0OiBudW1iZXIgPSAwKTogbnVtYmVyIHtcbiAgICB0aGlzLmFzc2V0SUQgPSBiaW50b29scy5jb3B5RnJvbShieXRlcywgb2Zmc2V0LCBvZmZzZXQgKyBFVk1Db25zdGFudHMuQVNTRVRJRExFTik7XG4gICAgb2Zmc2V0ICs9IEVWTUNvbnN0YW50cy5BU1NFVElETEVOO1xuICAgIGNvbnN0IG91dHB1dGlkOm51bWJlciA9IGJpbnRvb2xzLmNvcHlGcm9tKGJ5dGVzLCBvZmZzZXQsIG9mZnNldCArIDQpLnJlYWRVSW50MzJCRSgwKTtcbiAgICBvZmZzZXQgKz0gNDtcbiAgICB0aGlzLm91dHB1dCA9IFNlbGVjdE91dHB1dENsYXNzKG91dHB1dGlkKTtcbiAgICByZXR1cm4gdGhpcy5vdXRwdXQuZnJvbUJ1ZmZlcihieXRlcywgb2Zmc2V0KTtcbiAgfVxufVxuXG5leHBvcnQgYWJzdHJhY3QgY2xhc3MgQW1vdW50T3V0cHV0IGV4dGVuZHMgU3RhbmRhcmRBbW91bnRPdXRwdXQge1xuICBwcm90ZWN0ZWQgX3R5cGVOYW1lID0gXCJBbW91bnRPdXRwdXRcIjtcbiAgcHJvdGVjdGVkIF90eXBlSUQgPSB1bmRlZmluZWQ7XG5cbiAgLy9zZXJpYWxpemUgYW5kIGRlc2VyaWFsaXplIGJvdGggYXJlIGluaGVyaXRlZFxuICBcbiAgLyoqXG4gICAqIFxuICAgKiBAcGFyYW0gYXNzZXRJRCBBbiBhc3NldElEIHdoaWNoIGlzIHdyYXBwZWQgYXJvdW5kIHRoZSBCdWZmZXIgb2YgdGhlIE91dHB1dFxuICAgKi9cbiAgbWFrZVRyYW5zZmVyYWJsZShhc3NldElEOiBCdWZmZXIpOiBUcmFuc2ZlcmFibGVPdXRwdXQge1xuICAgIHJldHVybiBuZXcgVHJhbnNmZXJhYmxlT3V0cHV0KGFzc2V0SUQsIHRoaXMpO1xuICB9XG5cbiAgc2VsZWN0KGlkOiBudW1iZXIsIC4uLmFyZ3M6IGFueVtdKTogT3V0cHV0IHtcbiAgICByZXR1cm4gU2VsZWN0T3V0cHV0Q2xhc3MoaWQsIC4uLmFyZ3MpO1xuICB9XG59XG5cbi8qKlxuICogQW4gW1tPdXRwdXRdXSBjbGFzcyB3aGljaCBzcGVjaWZpZXMgYW4gT3V0cHV0IHRoYXQgY2FycmllcyBhbiBhbW1vdW50IGZvciBhbiBhc3NldElEIGFuZCB1c2VzIHNlY3AyNTZrMSBzaWduYXR1cmUgc2NoZW1lLlxuICovXG5leHBvcnQgY2xhc3MgU0VDUFRyYW5zZmVyT3V0cHV0IGV4dGVuZHMgQW1vdW50T3V0cHV0IHtcbiAgcHJvdGVjdGVkIF90eXBlTmFtZSA9IFwiU0VDUFRyYW5zZmVyT3V0cHV0XCI7XG4gIHByb3RlY3RlZCBfdHlwZUlEID0gRVZNQ29uc3RhbnRzLlNFQ1BYRkVST1VUUFVUSUQ7XG5cbiAgLy9zZXJpYWxpemUgYW5kIGRlc2VyaWFsaXplIGJvdGggYXJlIGluaGVyaXRlZFxuXG4gIC8qKlxuICAgICAqIFJldHVybnMgdGhlIG91dHB1dElEIGZvciB0aGlzIG91dHB1dFxuICAgICAqL1xuICBnZXRPdXRwdXRJRCgpOiBudW1iZXIge1xuICAgIHJldHVybiB0aGlzLl90eXBlSUQ7XG4gIH1cblxuICBjcmVhdGUoLi4uYXJnczogYW55W10pOiB0aGlze1xuICAgIHJldHVybiBuZXcgU0VDUFRyYW5zZmVyT3V0cHV0KC4uLmFyZ3MpIGFzIHRoaXM7XG4gIH1cblxuICBjbG9uZSgpOiB0aGlzIHtcbiAgICBjb25zdCBuZXdvdXQ6IFNFQ1BUcmFuc2Zlck91dHB1dCA9IHRoaXMuY3JlYXRlKClcbiAgICBuZXdvdXQuZnJvbUJ1ZmZlcih0aGlzLnRvQnVmZmVyKCkpO1xuICAgIHJldHVybiBuZXdvdXQgYXMgdGhpcztcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgRVZNT3V0cHV0IHtcbiAgcHJvdGVjdGVkIGFkZHJlc3M6IEJ1ZmZlciA9IEJ1ZmZlci5hbGxvYygyMCk7IFxuICBwcm90ZWN0ZWQgYW1vdW50OiBCdWZmZXIgPSBCdWZmZXIuYWxsb2MoOCk7XG4gIHByb3RlY3RlZCBhbW91bnRWYWx1ZTogQk4gPSBuZXcgQk4oMCk7XG4gIHByb3RlY3RlZCBhc3NldElEOiBCdWZmZXIgPSBCdWZmZXIuYWxsb2MoMzIpO1xuXG4gIC8qKlxuICAqIFJldHVybnMgYSBmdW5jdGlvbiB1c2VkIHRvIHNvcnQgYW4gYXJyYXkgb2YgW1tFVk1PdXRwdXRdXXNcbiAgKi9cbiAgc3RhdGljIGNvbXBhcmF0b3IgPSAoKTogKGE6IEVWTU91dHB1dCB8IEVWTUlucHV0LCBiOiBFVk1PdXRwdXQgfCBFVk1JbnB1dCkgPT4gKDF8LTF8MCkgPT4gKGE6IEVWTU91dHB1dCB8IEVWTUlucHV0LCBiOiBFVk1PdXRwdXQgfCBFVk1JbnB1dCk6ICgxfC0xfDApID0+IHtcbiAgICAvLyBwcmltYXJpbHkgc29ydCBieSBhZGRyZXNzXG4gICAgbGV0IHNvcnRhOiBCdWZmZXIgPSBhLmdldEFkZHJlc3MoKTtcbiAgICBsZXQgc29ydGI6IEJ1ZmZlciA9IGIuZ2V0QWRkcmVzcygpO1xuICAgIC8vIHNlY29uZGFyaWx5IHNvcnQgYnkgYXNzZXRJRFxuICAgIGlmKHNvcnRhLmVxdWFscyhzb3J0YikpIHtcbiAgICAgIHNvcnRhID0gYS5nZXRBc3NldElEKCk7XG4gICAgICBzb3J0YiA9IGIuZ2V0QXNzZXRJRCgpO1xuICAgIH1cbiAgICByZXR1cm4gQnVmZmVyLmNvbXBhcmUoc29ydGEsIHNvcnRiKSBhcyAoMXwtMXwwKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSBhZGRyZXNzIG9mIHRoZSBpbnB1dCBhcyB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfVxuICAgKi9cbiAgZ2V0QWRkcmVzcyA9ICgpOiBCdWZmZXIgPT4gdGhpcy5hZGRyZXNzO1xuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSBhZGRyZXNzIGFzIGEgYmVjaDMyIGVuY29kZWQgc3RyaW5nLlxuICAgKi9cbiAgZ2V0QWRkcmVzc1N0cmluZyA9ICgpOiBzdHJpbmcgPT4gdGhpcy5hZGRyZXNzLnRvU3RyaW5nKCdoZXgnKTtcblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgYW1vdW50IGFzIGEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9pbmR1dG55L2JuLmpzL3xCTn0uXG4gICAqL1xuICBnZXRBbW91bnQgPSAoKTogQk4gPT4gdGhpcy5hbW91bnRWYWx1ZS5jbG9uZSgpO1xuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSBhc3NldGlkIG9mIHRoZSBpbnB1dCBhcyB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfVxuICAgKi8gXG4gIGdldEFzc2V0SUQgPSAoKTogQnVmZmVyID0+IHRoaXMuYXNzZXRJRDtcbiBcbiAgLyoqXG4gICAqIFJldHVybnMgYSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSByZXByZXNlbnRhdGlvbiBvZiB0aGUgW1tFVk1PdXRwdXRdXS5cbiAgICovXG4gIHRvQnVmZmVyKCk6QnVmZmVyIHtcbiAgICBjb25zdCBic2l6ZTogbnVtYmVyID0gdGhpcy5hZGRyZXNzLmxlbmd0aCArIHRoaXMuYW1vdW50Lmxlbmd0aCArIHRoaXMuYXNzZXRJRC5sZW5ndGg7XG4gICAgY29uc3QgYmFycjogQnVmZmVyW10gPSBbdGhpcy5hZGRyZXNzLCB0aGlzLmFtb3VudCwgdGhpcy5hc3NldElEXTtcbiAgICBjb25zdCBidWZmOiBCdWZmZXIgPSBCdWZmZXIuY29uY2F0KGJhcnIsIGJzaXplKTtcbiAgICByZXR1cm4gYnVmZjtcbiAgfVxuXG4gIC8qKlxuICAgKiBEZWNvZGVzIHRoZSBbW0VWTU91dHB1dF1dIGFzIGEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0gYW5kIHJldHVybnMgdGhlIHNpemUuXG4gICAqL1xuICBmcm9tQnVmZmVyKGJ5dGVzOiBCdWZmZXIsIG9mZnNldDogbnVtYmVyID0gMCk6IG51bWJlciB7XG4gICAgdGhpcy5hZGRyZXNzID0gYmludG9vbHMuY29weUZyb20oYnl0ZXMsIG9mZnNldCwgb2Zmc2V0ICsgMjApO1xuICAgIG9mZnNldCArPSAyMDtcbiAgICB0aGlzLmFtb3VudCA9IGJpbnRvb2xzLmNvcHlGcm9tKGJ5dGVzLCBvZmZzZXQsIG9mZnNldCArIDgpO1xuICAgIG9mZnNldCArPSA4O1xuICAgIHRoaXMuYXNzZXRJRCA9IGJpbnRvb2xzLmNvcHlGcm9tKGJ5dGVzLCBvZmZzZXQsIG9mZnNldCArIDMyKTtcbiAgICBvZmZzZXQgKz0gMzI7XG4gICAgcmV0dXJuIG9mZnNldDtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIGEgYmFzZS01OCByZXByZXNlbnRhdGlvbiBvZiB0aGUgW1tFVk1PdXRwdXRdXS5cbiAgICovXG4gIHRvU3RyaW5nKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIGJpbnRvb2xzLmJ1ZmZlclRvQjU4KHRoaXMudG9CdWZmZXIoKSk7XG4gIH1cblxuICBjcmVhdGUoLi4uYXJnczogYW55W10pOiB0aGlze1xuICAgIHJldHVybiBuZXcgRVZNT3V0cHV0KC4uLmFyZ3MpIGFzIHRoaXM7XG4gIH1cblxuICBjbG9uZSgpOiB0aGlzIHtcbiAgICBjb25zdCBuZXdFVk1PdXRwdXQ6IEVWTU91dHB1dCA9IHRoaXMuY3JlYXRlKCk7XG4gICAgbmV3RVZNT3V0cHV0LmZyb21CdWZmZXIodGhpcy50b0J1ZmZlcigpKTtcbiAgICByZXR1cm4gbmV3RVZNT3V0cHV0IGFzIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogQW4gW1tFVk1PdXRwdXRdXSBjbGFzcyB3aGljaCBjb250YWlucyBhZGRyZXNzLCBhbW91bnQsIGFuZCBhc3NldElELlxuICAgKlxuICAgKiBAcGFyYW0gYWRkcmVzcyBUaGUgYWRkcmVzcyByZWNpZXZpbmcgdGhlIGFzc2V0IGFzIGEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0gb3IgYSBzdHJpbmcuXG4gICAqIEBwYXJhbSBhbW91bnQgQSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2luZHV0bnkvYm4uanMvfEJOfSBvciBudW1iZXIgcmVwcmVzZW50aW5nIHRoZSBhbW91bnQuXG4gICAqIEBwYXJhbSBhc3NldElEIFRoZSBhc3NldElEIHdoaWNoIGlzIGJlaW5nIHNlbnQgYXMgYSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSBvciBhIHN0cmluZy5cbiAgICovXG4gIGNvbnN0cnVjdG9yKFxuICAgIGFkZHJlc3M6IEJ1ZmZlciB8IHN0cmluZyA9IHVuZGVmaW5lZCwgXG4gICAgYW1vdW50OiBCTiB8IG51bWJlciA9IHVuZGVmaW5lZCwgXG4gICAgYXNzZXRJRDogQnVmZmVyIHwgc3RyaW5nID0gdW5kZWZpbmVkXG4gICkge1xuICAgIGlmICh0eXBlb2YgYWRkcmVzcyAhPT0gJ3VuZGVmaW5lZCcgJiYgdHlwZW9mIGFtb3VudCAhPT0gJ3VuZGVmaW5lZCcgJiYgdHlwZW9mIGFzc2V0SUQgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICBpZih0eXBlb2YgYWRkcmVzcyA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgLy8gaWYgcHJlc2VudCB0aGVuIHJlbW92ZSBgMHhgIHByZWZpeFxuICAgICAgICBsZXQgcHJlZml4OiBzdHJpbmcgPSBhZGRyZXNzLnN1YnN0cmluZygwLCAyKTtcbiAgICAgICAgaWYocHJlZml4ID09PSAnMHgnKSB7XG4gICAgICAgICAgYWRkcmVzcyA9IGFkZHJlc3Muc3BsaXQoJ3gnKVsxXTtcbiAgICAgICAgfVxuICAgICAgICBhZGRyZXNzID0gQnVmZmVyLmZyb20oYWRkcmVzcywgJ2hleCcpO1xuICAgICAgfVxuXG4gICAgICAvLyBjb252ZXJ0IG51bWJlciBhbW91bnQgdG8gQk5cbiAgICAgIGxldCBhbW50OiBCTjtcbiAgICAgIGlmICh0eXBlb2YgYW1vdW50ID09PSAnbnVtYmVyJykge1xuICAgICAgICBhbW50ID0gbmV3IEJOKGFtb3VudCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBhbW50ID0gYW1vdW50O1xuICAgICAgfVxuXG4gICAgICAvLyBjb252ZXJ0IHN0cmluZyBhc3NldElEIHRvIEJ1ZmZlclxuICAgICAgaWYoIShhc3NldElEIGluc3RhbmNlb2YgQnVmZmVyKSkge1xuICAgICAgICBhc3NldElEID0gYmludG9vbHMuY2I1OERlY29kZShhc3NldElEKTtcbiAgICAgIH1cblxuICAgICAgdGhpcy5hZGRyZXNzID0gYWRkcmVzcztcbiAgICAgIHRoaXMuYW1vdW50VmFsdWUgPSBhbW50LmNsb25lKCk7XG4gICAgICB0aGlzLmFtb3VudCA9IGJpbnRvb2xzLmZyb21CTlRvQnVmZmVyKGFtbnQsIDgpO1xuICAgICAgdGhpcy5hc3NldElEID0gYXNzZXRJRDtcbiAgICB9XG4gIH1cbn0gICJdfQ==