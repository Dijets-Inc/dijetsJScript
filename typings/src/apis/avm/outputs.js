"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NFTTransferOutput = exports.NFTMintOutput = exports.SECPMintOutput = exports.SECPTransferOutput = exports.NFTOutput = exports.AmountOutput = exports.TransferableOutput = exports.SelectOutputClass = void 0;
/**
 * @packageDocumentation
 * @module API-AVM-Outputs
 */
const buffer_1 = require("buffer/");
const bintools_1 = __importDefault(require("../../utils/bintools"));
const constants_1 = require("./constants");
const output_1 = require("../../common/output");
const serialization_1 = require("../../utils/serialization");
const bintools = bintools_1.default.getInstance();
const serializer = serialization_1.Serialization.getInstance();
/**
 * Takes a buffer representing the output and returns the proper Output instance.
 *
 * @param outputid A number representing the inputID parsed prior to the bytes passed in
 *
 * @returns An instance of an [[Output]]-extended class.
 */
exports.SelectOutputClass = (outputid, ...args) => {
    if (outputid === constants_1.AVMConstants.SECPXFEROUTPUTID || outputid === constants_1.AVMConstants.SECPXFEROUTPUTID_CODECONE) {
        return new SECPTransferOutput(...args);
    }
    else if (outputid === constants_1.AVMConstants.SECPMINTOUTPUTID || outputid === constants_1.AVMConstants.SECPMINTOUTPUTID_CODECONE) {
        return new SECPMintOutput(...args);
    }
    else if (outputid === constants_1.AVMConstants.NFTMINTOUTPUTID || outputid === constants_1.AVMConstants.NFTMINTOUTPUTID_CODECONE) {
        return new NFTMintOutput(...args);
    }
    else if (outputid === constants_1.AVMConstants.NFTXFEROUTPUTID || outputid === constants_1.AVMConstants.NFTXFEROUTPUTID_CODECONE) {
        return new NFTTransferOutput(...args);
    }
    throw new Error("Error - SelectOutputClass: unknown outputid " + outputid);
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
        this.assetID = bintools.copyFrom(bytes, offset, offset + constants_1.AVMConstants.ASSETIDLEN);
        offset += constants_1.AVMConstants.ASSETIDLEN;
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
class NFTOutput extends output_1.BaseNFTOutput {
    constructor() {
        super(...arguments);
        this._typeName = "NFTOutput";
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
exports.NFTOutput = NFTOutput;
/**
 * An [[Output]] class which specifies an Output that carries an ammount for an assetID and uses secp256k1 signature scheme.
 */
class SECPTransferOutput extends AmountOutput {
    constructor() {
        super(...arguments);
        this._typeName = "SECPTransferOutput";
        this._codecID = constants_1.AVMConstants.LATESTCODEC;
        this._typeID = this._codecID === 0 ? constants_1.AVMConstants.SECPXFEROUTPUTID : constants_1.AVMConstants.SECPXFEROUTPUTID_CODECONE;
    }
    //serialize and deserialize both are inherited
    setCodecID(codecID) {
        if (codecID !== 0 && codecID !== 1) {
            /* istanbul ignore next */
            throw new Error("Error - SECPTransferOutput.setCodecID: invalid codecID. Valid codecIDs are 0 and 1.");
        }
        this._codecID = codecID;
        this._typeID = this._codecID === 0 ? constants_1.AVMConstants.SECPXFEROUTPUTID : constants_1.AVMConstants.SECPXFEROUTPUTID_CODECONE;
    }
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
/**
 * An [[Output]] class which specifies an Output that carries an ammount for an assetID and uses secp256k1 signature scheme.
 */
class SECPMintOutput extends output_1.Output {
    constructor() {
        super(...arguments);
        this._typeName = "SECPMintOutput";
        this._codecID = constants_1.AVMConstants.LATESTCODEC;
        this._typeID = this._codecID === 0 ? constants_1.AVMConstants.SECPMINTOUTPUTID : constants_1.AVMConstants.SECPMINTOUTPUTID_CODECONE;
    }
    //serialize and deserialize both are inherited
    setCodecID(codecID) {
        if (codecID !== 0 && codecID !== 1) {
            /* istanbul ignore next */
            throw new Error("Error - SECPMintOutput.setCodecID: invalid codecID. Valid codecIDs are 0 and 1.");
        }
        this._codecID = codecID;
        this._typeID = this._codecID === 0 ? constants_1.AVMConstants.SECPMINTOUTPUTID : constants_1.AVMConstants.SECPMINTOUTPUTID_CODECONE;
    }
    /**
     * Returns the outputID for this output
     */
    getOutputID() {
        return this._typeID;
    }
    /**
     *
     * @param assetID An assetID which is wrapped around the Buffer of the Output
     */
    makeTransferable(assetID) {
        return new TransferableOutput(assetID, this);
    }
    create(...args) {
        return new SECPMintOutput(...args);
    }
    clone() {
        const newout = this.create();
        newout.fromBuffer(this.toBuffer());
        return newout;
    }
    select(id, ...args) {
        return exports.SelectOutputClass(id, ...args);
    }
}
exports.SECPMintOutput = SECPMintOutput;
/**
 * An [[Output]] class which specifies an Output that carries an NFT Mint and uses secp256k1 signature scheme.
 */
class NFTMintOutput extends NFTOutput {
    /**
     * An [[Output]] class which contains an NFT mint for an assetID.
     *
     * @param groupID A number specifies the group this NFT is issued to
     * @param locktime A {@link https://github.com/indutny/bn.js/|BN} representing the locktime
     * @param threshold A number representing the the threshold number of signers required to sign the transaction
     * @param addresses An array of {@link https://github.com/feross/buffer|Buffer}s representing addresses
     */
    constructor(groupID = undefined, addresses = undefined, locktime = undefined, threshold = undefined) {
        super(addresses, locktime, threshold);
        this._typeName = "NFTMintOutput";
        this._codecID = constants_1.AVMConstants.LATESTCODEC;
        this._typeID = this._codecID === 0 ? constants_1.AVMConstants.NFTMINTOUTPUTID : constants_1.AVMConstants.NFTMINTOUTPUTID_CODECONE;
        if (typeof groupID !== 'undefined') {
            this.groupID.writeUInt32BE(groupID, 0);
        }
    }
    ;
    //serialize and deserialize both are inherited
    setCodecID(codecID) {
        if (codecID !== 0 && codecID !== 1) {
            /* istanbul ignore next */
            throw new Error("Error - NFTMintOutput.setCodecID: invalid codecID. Valid codecIDs are 0 and 1.");
        }
        this._codecID = codecID;
        this._typeID = this._codecID === 0 ? constants_1.AVMConstants.NFTMINTOUTPUTID : constants_1.AVMConstants.NFTMINTOUTPUTID_CODECONE;
    }
    /**
     * Returns the outputID for this output
     */
    getOutputID() {
        return this._typeID;
    }
    /**
     * Popuates the instance from a {@link https://github.com/feross/buffer|Buffer} representing the [[NFTMintOutput]] and returns the size of the output.
     */
    fromBuffer(utxobuff, offset = 0) {
        this.groupID = bintools.copyFrom(utxobuff, offset, offset + 4);
        offset += 4;
        return super.fromBuffer(utxobuff, offset);
    }
    /**
     * Returns the buffer representing the [[NFTMintOutput]] instance.
     */
    toBuffer() {
        let superbuff = super.toBuffer();
        let bsize = this.groupID.length + superbuff.length;
        let barr = [this.groupID, superbuff];
        return buffer_1.Buffer.concat(barr, bsize);
    }
    create(...args) {
        return new NFTMintOutput(...args);
    }
    clone() {
        const newout = this.create();
        newout.fromBuffer(this.toBuffer());
        return newout;
    }
}
exports.NFTMintOutput = NFTMintOutput;
/**
 * An [[Output]] class which specifies an Output that carries an NFT and uses secp256k1 signature scheme.
 */
class NFTTransferOutput extends NFTOutput {
    /**
       * An [[Output]] class which contains an NFT on an assetID.
       *
       * @param groupID A number representing the amount in the output
       * @param payload A {@link https://github.com/feross/buffer|Buffer} of max length 1024
       * @param addresses An array of {@link https://github.com/feross/buffer|Buffer}s representing addresses
       * @param locktime A {@link https://github.com/indutny/bn.js/|BN} representing the locktime
       * @param threshold A number representing the the threshold number of signers required to sign the transaction
  
       */
    constructor(groupID = undefined, payload = undefined, addresses = undefined, locktime = undefined, threshold = undefined) {
        super(addresses, locktime, threshold);
        this._typeName = "NFTTransferOutput";
        this._codecID = constants_1.AVMConstants.LATESTCODEC;
        this._typeID = this._codecID === 0 ? constants_1.AVMConstants.NFTXFEROUTPUTID : constants_1.AVMConstants.NFTXFEROUTPUTID_CODECONE;
        this.sizePayload = buffer_1.Buffer.alloc(4);
        /**
         * Returns the payload as a {@link https://github.com/feross/buffer|Buffer} with content only.
         */
        this.getPayload = () => bintools.copyFrom(this.payload);
        /**
         * Returns the payload as a {@link https://github.com/feross/buffer|Buffer} with length of payload prepended.
         */
        this.getPayloadBuffer = () => buffer_1.Buffer.concat([bintools.copyFrom(this.sizePayload), bintools.copyFrom(this.payload)]);
        if (typeof groupID !== 'undefined' && typeof payload !== 'undefined') {
            this.groupID.writeUInt32BE(groupID, 0);
            this.sizePayload.writeUInt32BE(payload.length, 0);
            this.payload = bintools.copyFrom(payload, 0, payload.length);
        }
    }
    serialize(encoding = "hex") {
        let fields = super.serialize(encoding);
        return Object.assign(Object.assign({}, fields), { "payload": serializer.encoder(this.payload, encoding, "Buffer", "hex", this.payload.length) });
    }
    ;
    deserialize(fields, encoding = "hex") {
        super.deserialize(fields, encoding);
        this.payload = serializer.decoder(fields["payload"], encoding, "hex", "Buffer");
        this.sizePayload = buffer_1.Buffer.alloc(4);
        this.sizePayload.writeUInt32BE(this.payload.length, 0);
    }
    setCodecID(codecID) {
        if (codecID !== 0 && codecID !== 1) {
            /* istanbul ignore next */
            throw new Error("Error - NFTTransferOutput.setCodecID: invalid codecID. Valid codecIDs are 0 and 1.");
        }
        this._codecID = codecID;
        this._typeID = this._codecID === 0 ? constants_1.AVMConstants.NFTXFEROUTPUTID : constants_1.AVMConstants.NFTXFEROUTPUTID_CODECONE;
    }
    /**
     * Returns the outputID for this output
     */
    getOutputID() {
        return this._typeID;
    }
    /**
     * Popuates the instance from a {@link https://github.com/feross/buffer|Buffer} representing the [[NFTTransferOutput]] and returns the size of the output.
     */
    fromBuffer(utxobuff, offset = 0) {
        this.groupID = bintools.copyFrom(utxobuff, offset, offset + 4);
        offset += 4;
        this.sizePayload = bintools.copyFrom(utxobuff, offset, offset + 4);
        let psize = this.sizePayload.readUInt32BE(0);
        offset += 4;
        this.payload = bintools.copyFrom(utxobuff, offset, offset + psize);
        offset = offset + psize;
        return super.fromBuffer(utxobuff, offset);
    }
    /**
     * Returns the buffer representing the [[NFTTransferOutput]] instance.
     */
    toBuffer() {
        const superbuff = super.toBuffer();
        const bsize = this.groupID.length + this.sizePayload.length + this.payload.length + superbuff.length;
        this.sizePayload.writeUInt32BE(this.payload.length, 0);
        const barr = [this.groupID, this.sizePayload, this.payload, superbuff];
        return buffer_1.Buffer.concat(barr, bsize);
    }
    create(...args) {
        return new NFTTransferOutput(...args);
    }
    clone() {
        const newout = this.create();
        newout.fromBuffer(this.toBuffer());
        return newout;
    }
}
exports.NFTTransferOutput = NFTTransferOutput;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib3V0cHV0cy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9hcGlzL2F2bS9vdXRwdXRzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBOzs7R0FHRztBQUNILG9DQUFpQztBQUVqQyxvRUFBNEM7QUFDNUMsMkNBQTJDO0FBQzNDLGdEQUE4RztBQUM5Ryw2REFBOEU7QUFFOUUsTUFBTSxRQUFRLEdBQUcsa0JBQVEsQ0FBQyxXQUFXLEVBQUUsQ0FBQztBQUN4QyxNQUFNLFVBQVUsR0FBRyw2QkFBYSxDQUFDLFdBQVcsRUFBRSxDQUFDO0FBRS9DOzs7Ozs7R0FNRztBQUNVLFFBQUEsaUJBQWlCLEdBQUcsQ0FBQyxRQUFlLEVBQUUsR0FBRyxJQUFlLEVBQVMsRUFBRTtJQUM1RSxJQUFHLFFBQVEsS0FBSyx3QkFBWSxDQUFDLGdCQUFnQixJQUFJLFFBQVEsS0FBSyx3QkFBWSxDQUFDLHlCQUF5QixFQUFDO1FBQ25HLE9BQU8sSUFBSSxrQkFBa0IsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDO0tBQ3hDO1NBQU0sSUFBRyxRQUFRLEtBQUssd0JBQVksQ0FBQyxnQkFBZ0IsSUFBSSxRQUFRLEtBQUssd0JBQVksQ0FBQyx5QkFBeUIsRUFBQztRQUMxRyxPQUFPLElBQUksY0FBYyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUM7S0FDcEM7U0FBTSxJQUFHLFFBQVEsS0FBSyx3QkFBWSxDQUFDLGVBQWUsSUFBSSxRQUFRLEtBQUssd0JBQVksQ0FBQyx3QkFBd0IsRUFBQztRQUN4RyxPQUFPLElBQUksYUFBYSxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUM7S0FDbkM7U0FBTSxJQUFHLFFBQVEsS0FBSyx3QkFBWSxDQUFDLGVBQWUsSUFBSSxRQUFRLEtBQUssd0JBQVksQ0FBQyx3QkFBd0IsRUFBQztRQUN4RyxPQUFPLElBQUksaUJBQWlCLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQztLQUN2QztJQUNELE1BQU0sSUFBSSxL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VSxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDO1FBQ25DLE9BQU8sTUFBYyxDQUFDO0lBQ3hCLENBQUM7Q0FvQkY7QUF2R0QsOENBdUdDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAcGFja2FnZURvY3VtZW50YXRpb25cbiAqIEBtb2R1bGUgQVBJLUFWTS1PdXRwdXRzXG4gKi9cbmltcG9ydCB7IEJ1ZmZlciB9IGZyb20gJ2J1ZmZlci8nO1xuaW1wb3J0IEJOIGZyb20gJ2JuLmpzJztcbmltcG9ydCBCaW5Ub29scyBmcm9tICcuLi8uLi91dGlscy9iaW50b29scyc7XG5pbXBvcnQgeyBBVk1Db25zdGFudHMgfSBmcm9tICcuL2NvbnN0YW50cyc7XG5pbXBvcnQgeyBPdXRwdXQsIFN0YW5kYXJkQW1vdW50T3V0cHV0LCBTdGFuZGFyZFRyYW5zZmVyYWJsZU91dHB1dCwgQmFzZU5GVE91dHB1dCB9IGZyb20gJy4uLy4uL2NvbW1vbi9vdXRwdXQnO1xuaW1wb3J0IHsgU2VyaWFsaXphdGlvbiwgU2VyaWFsaXplZEVuY29kaW5nIH0gZnJvbSAnLi4vLi4vdXRpbHMvc2VyaWFsaXphdGlvbic7XG5cbmNvbnN0IGJpbnRvb2xzID0gQmluVG9vbHMuZ2V0SW5zdGFuY2UoKTtcbmNvbnN0IHNlcmlhbGl6ZXIgPSBTZXJpYWxpemF0aW9uLmdldEluc3RhbmNlKCk7XG5cbi8qKlxuICogVGFrZXMgYSBidWZmZXIgcmVwcmVzZW50aW5nIHRoZSBvdXRwdXQgYW5kIHJldHVybnMgdGhlIHByb3BlciBPdXRwdXQgaW5zdGFuY2UuXG4gKlxuICogQHBhcmFtIG91dHB1dGlkIEEgbnVtYmVyIHJlcHJlc2VudGluZyB0aGUgaW5wdXRJRCBwYXJzZWQgcHJpb3IgdG8gdGhlIGJ5dGVzIHBhc3NlZCBpblxuICpcbiAqIEByZXR1cm5zIEFuIGluc3RhbmNlIG9mIGFuIFtbT3V0cHV0XV0tZXh0ZW5kZWQgY2xhc3MuXG4gKi9cbmV4cG9ydCBjb25zdCBTZWxlY3RPdXRwdXRDbGFzcyA9IChvdXRwdXRpZDpudW1iZXIsIC4uLmFyZ3M6QXJyYXk8YW55Pik6T3V0cHV0ID0+IHtcbiAgICBpZihvdXRwdXRpZCA9PT0gQVZNQ29uc3RhbnRzLlNFQ1BYRkVST1VUUFVUSUQgfHwgb3V0cHV0aWQgPT09IEFWTUNvbnN0YW50cy5TRUNQWEZFUk9VVFBVVElEX0NPREVDT05FKXtcbiAgICAgIHJldHVybiBuZXcgU0VDUFRyYW5zZmVyT3V0cHV0KC4uLmFyZ3MpO1xuICAgIH0gZWxzZSBpZihvdXRwdXRpZCA9PT0gQVZNQ29uc3RhbnRzLlNFQ1BNSU5UT1VUUFVUSUQgfHwgb3V0cHV0aWQgPT09IEFWTUNvbnN0YW50cy5TRUNQTUlOVE9VVFBVVElEX0NPREVDT05FKXtcbiAgICAgIHJldHVybiBuZXcgU0VDUE1pbnRPdXRwdXQoLi4uYXJncyk7XG4gICAgfSBlbHNlIGlmKG91dHB1dGlkID09PSBBVk1Db25zdGFudHMuTkZUTUlOVE9VVFBVVElEIHx8IG91dHB1dGlkID09PSBBVk1Db25zdGFudHMuTkZUTUlOVE9VVFBVVElEX0NPREVDT05FKXtcbiAgICAgIHJldHVybiBuZXcgTkZUTWludE91dHB1dCguLi5hcmdzKTtcbiAgICB9IGVsc2UgaWYob3V0cHV0aWQgPT09IEFWTUNvbnN0YW50cy5ORlRYRkVST1VUUFVUSUQgfHwgb3V0cHV0aWQgPT09IEFWTUNvbnN0YW50cy5ORlRYRkVST1VUUFVUSURfQ09ERUNPTkUpe1xuICAgICAgcmV0dXJuIG5ldyBORlRUcmFuc2Zlck91dHB1dCguLi5hcmdzKTtcbiAgICB9XG4gICAgdGhyb3cgbmV3IEVycm9yKFwiRXJyb3IgLSBTZWxlY3RPdXRwdXRDbGFzczogdW5rbm93biBvdXRwdXRpZCBcIiArIG91dHB1dGlkKTtcbn1cblxuZXhwb3J0IGNsYXNzIFRyYW5zZmVyYWJsZU91dHB1dCBleHRlbmRzIFN0YW5kYXJkVHJhbnNmZXJhYmxlT3V0cHV0e1xuICBwcm90ZWN0ZWQgX3R5cGVOYW1lID0gXCJUcmFuc2ZlcmFibGVPdXRwdXRcIjtcbiAgcHJvdGVjdGVkIF90eXBlSUQgPSB1bmRlZmluZWQ7XG5cbiAgLy9zZXJpYWxpemUgaXMgaW5oZXJpdGVkXG5cbiAgZGVzZXJpYWxpemUoZmllbGRzOm9iamVjdCwgZW5jb2Rpbmc6U2VyaWFsaXplZEVuY29kaW5nID0gXCJoZXhcIikge1xuICAgIHN1cGVyLmRlc2VyaWFsaXplKGZpZWxkcywgZW5jb2RpbmcpO1xuICAgIHRoaXMub3V0cHV0ID0gU2VsZWN0T3V0cHV0Q2xhc3MoZmllbGRzW1wib3V0cHV0XCJdW1wiX3R5cGVJRFwiXSk7XG4gICAgdGhpcy5vdXRwdXQuZGVzZXJpYWxpemUoZmllbGRzW1wib3V0cHV0XCJdLCBlbmNvZGluZyk7XG4gIH1cblxuICBmcm9tQnVmZmVyKGJ5dGVzOkJ1ZmZlciwgb2Zmc2V0Om51bWJlciA9IDApOm51bWJlciB7XG4gICAgdGhpcy5hc3NldElEID0gYmludG9vbHMuY29weUZyb20oYnl0ZXMsIG9mZnNldCwgb2Zmc2V0ICsgQVZNQ29uc3RhbnRzLkFTU0VUSURMRU4pO1xuICAgIG9mZnNldCArPSBBVk1Db25zdGFudHMuQVNTRVRJRExFTjtcbiAgICBjb25zdCBvdXRwdXRpZDpudW1iZXIgPSBiaW50b29scy5jb3B5RnJvbShieXRlcywgb2Zmc2V0LCBvZmZzZXQgKyA0KS5yZWFkVUludDMyQkUoMCk7XG4gICAgb2Zmc2V0ICs9IDQ7XG4gICAgdGhpcy5vdXRwdXQgPSBTZWxlY3RPdXRwdXRDbGFzcyhvdXRwdXRpZCk7XG4gICAgcmV0dXJuIHRoaXMub3V0cHV0LmZyb21CdWZmZXIoYnl0ZXMsIG9mZnNldCk7XG4gIH1cblxufVxuXG5leHBvcnQgYWJzdHJhY3QgY2xhc3MgQW1vdW50T3V0cHV0IGV4dGVuZHMgU3RhbmRhcmRBbW91bnRPdXRwdXQge1xuICBwcm90ZWN0ZWQgX3R5cGVOYW1lID0gXCJBbW91bnRPdXRwdXRcIjtcbiAgcHJvdGVjdGVkIF90eXBlSUQgPSB1bmRlZmluZWQ7XG5cbiAgLy9zZXJpYWxpemUgYW5kIGRlc2VyaWFsaXplIGJvdGggYXJlIGluaGVyaXRlZFxuICBcbiAgLyoqXG4gICAqIFxuICAgKiBAcGFyYW0gYXNzZXRJRCBBbiBhc3NldElEIHdoaWNoIGlzIHdyYXBwZWQgYXJvdW5kIHRoZSBCdWZmZXIgb2YgdGhlIE91dHB1dFxuICAgKi9cbiAgbWFrZVRyYW5zZmVyYWJsZShhc3NldElEOkJ1ZmZlcik6VHJhbnNmZXJhYmxlT3V0cHV0IHtcbiAgICAgIHJldHVybiBuZXcgVHJhbnNmZXJhYmxlT3V0cHV0KGFzc2V0SUQsIHRoaXMpO1xuICB9XG5cbiAgc2VsZWN0KGlkOm51bWJlciwgLi4uYXJnczogYW55W10pOk91dHB1dCB7XG4gICAgICByZXR1cm4gU2VsZWN0T3V0cHV0Q2xhc3MoaWQsIC4uLmFyZ3MpO1xuICB9XG5cbn1cblxuZXhwb3J0IGFic3RyYWN0IGNsYXNzIE5GVE91dHB1dCBleHRlbmRzIEJhc2VORlRPdXRwdXQge1xuICBwcm90ZWN0ZWQgX3R5cGVOYW1lID0gXCJORlRPdXRwdXRcIjtcbiAgcHJvdGVjdGVkIF90eXBlSUQgPSB1bmRlZmluZWQ7XG5cbiAgLy9zZXJpYWxpemUgYW5kIGRlc2VyaWFsaXplIGJvdGggYXJlIGluaGVyaXRlZFxuXG4gIC8qKlxuICAgKiBcbiAgICogQHBhcmFtIGFzc2V0SUQgQW4gYXNzZXRJRCB3aGljaCBpcyB3cmFwcGVkIGFyb3VuZCB0aGUgQnVmZmVyIG9mIHRoZSBPdXRwdXRcbiAgICovXG4gIG1ha2VUcmFuc2ZlcmFibGUoYXNzZXRJRDpCdWZmZXIpOlRyYW5zZmVyYWJsZU91dHB1dCB7XG4gICAgICByZXR1cm4gbmV3IFRyYW5zZmVyYWJsZU91dHB1dChhc3NldElELCB0aGlzKTtcbiAgfVxuXG4gIHNlbGVjdChpZDpudW1iZXIsIC4uLmFyZ3M6IGFueVtdKTpPdXRwdXQge1xuICAgICAgcmV0dXJuIFNlbGVjdE91dHB1dENsYXNzKGlkLCAuLi5hcmdzKTtcbiAgfVxufVxuXG4vKipcbiAqIEFuIFtbT3V0cHV0XV0gY2xhc3Mgd2hpY2ggc3BlY2lmaWVzIGFuIE91dHB1dCB0aGF0IGNhcnJpZXMgYW4gYW1tb3VudCBmb3IgYW4gYXNzZXRJRCBhbmQgdXNlcyBzZWNwMjU2azEgc2lnbmF0dXJlIHNjaGVtZS5cbiAqL1xuZXhwb3J0IGNsYXNzIFNFQ1BUcmFuc2Zlck91dHB1dCBleHRlbmRzIEFtb3VudE91dHB1dCB7XG4gIHByb3RlY3RlZCBfdHlwZU5hbWUgPSBcIlNFQ1BUcmFuc2Zlck91dHB1dFwiO1xuICBwcm90ZWN0ZWQgX2NvZGVjSUQgPSBBVk1Db25zdGFudHMuTEFURVNUQ09ERUM7XG4gIHByb3RlY3RlZCBfdHlwZUlEID0gdGhpcy5fY29kZWNJRCA9PT0gMCA/IEFWTUNvbnN0YW50cy5TRUNQWEZFUk9VVFBVVElEIDogQVZNQ29uc3RhbnRzLlNFQ1BYRkVST1VUUFVUSURfQ09ERUNPTkU7XG5cbiAgLy9zZXJpYWxpemUgYW5kIGRlc2VyaWFsaXplIGJvdGggYXJlIGluaGVyaXRlZFxuXG4gIHNldENvZGVjSUQoY29kZWNJRDogbnVtYmVyKTogdm9pZCB7XG4gICAgaWYoY29kZWNJRCAhPT0gMCAmJiBjb2RlY0lEICE9PSAxKSB7XG4gICAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJFcnJvciAtIFNFQ1BUcmFuc2Zlck91dHB1dC5zZXRDb2RlY0lEOiBpbnZhbGlkIGNvZGVjSUQuIFZhbGlkIGNvZGVjSURzIGFyZSAwIGFuZCAxLlwiKTtcbiAgICB9XG4gICAgdGhpcy5fY29kZWNJRCA9IGNvZGVjSUQ7XG4gICAgdGhpcy5fdHlwZUlEID0gdGhpcy5fY29kZWNJRCA9PT0gMCA/IEFWTUNvbnN0YW50cy5TRUNQWEZFUk9VVFBVVElEIDogQVZNQ29uc3RhbnRzLlNFQ1BYRkVST1VUUFVUSURfQ09ERUNPTkU7XG4gIH1cblxuICAvKipcbiAgICAgKiBSZXR1cm5zIHRoZSBvdXRwdXRJRCBmb3IgdGhpcyBvdXRwdXRcbiAgICAgKi9cbiAgZ2V0T3V0cHV0SUQoKTpudW1iZXIge1xuICAgIHJldHVybiB0aGlzLl90eXBlSUQ7XG4gIH1cblxuICBjcmVhdGUoLi4uYXJnczphbnlbXSk6dGhpc3tcbiAgICByZXR1cm4gbmV3IFNFQ1BUcmFuc2Zlck91dHB1dCguLi5hcmdzKSBhcyB0aGlzO1xuICB9XG5cbiAgY2xvbmUoKTp0aGlzIHtcbiAgICBjb25zdCBuZXdvdXQ6U0VDUFRyYW5zZmVyT3V0cHV0ID0gdGhpcy5jcmVhdGUoKVxuICAgIG5ld291dC5mcm9tQnVmZmVyKHRoaXMudG9CdWZmZXIoKSk7XG4gICAgcmV0dXJuIG5ld291dCBhcyB0aGlzO1xuICB9XG5cbn1cblxuLyoqXG4gKiBBbiBbW091dHB1dF1dIGNsYXNzIHdoaWNoIHNwZWNpZmllcyBhbiBPdXRwdXQgdGhhdCBjYXJyaWVzIGFuIGFtbW91bnQgZm9yIGFuIGFzc2V0SUQgYW5kIHVzZXMgc2VjcDI1NmsxIHNpZ25hdHVyZSBzY2hlbWUuXG4gKi9cbmV4cG9ydCBjbGFzcyBTRUNQTWludE91dHB1dCBleHRlbmRzIE91dHB1dCB7XG4gIHByb3RlY3RlZCBfdHlwZU5hbWUgPSBcIlNFQ1BNaW50T3V0cHV0XCI7XG4gIHByb3RlY3RlZCBfY29kZWNJRCA9IEFWTUNvbnN0YW50cy5MQVRFU1RDT0RFQztcbiAgcHJvdGVjdGVkIF90eXBlSUQgPSB0aGlzLl9jb2RlY0lEID09PSAwID8gQVZNQ29uc3RhbnRzLlNFQ1BNSU5UT1VUUFVUSUQgOiBBVk1Db25zdGFudHMuU0VDUE1JTlRPVVRQVVRJRF9DT0RFQ09ORTtcblxuICAvL3NlcmlhbGl6ZSBhbmQgZGVzZXJpYWxpemUgYm90aCBhcmUgaW5oZXJpdGVkXG5cbiAgc2V0Q29kZWNJRChjb2RlY0lEOiBudW1iZXIpOiB2b2lkIHtcbiAgICBpZihjb2RlY0lEICE9PSAwICYmIGNvZGVjSUQgIT09IDEpIHtcbiAgICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIkVycm9yIC0gU0VDUE1pbnRPdXRwdXQuc2V0Q29kZWNJRDogaW52YWxpZCBjb2RlY0lELiBWYWxpZCBjb2RlY0lEcyBhcmUgMCBhbmQgMS5cIik7XG4gICAgfVxuICAgIHRoaXMuX2NvZGVjSUQgPSBjb2RlY0lEO1xuICAgIHRoaXMuX3R5cGVJRCA9IHRoaXMuX2NvZGVjSUQgPT09IDAgPyBBVk1Db25zdGFudHMuU0VDUE1JTlRPVVRQVVRJRCA6IEFWTUNvbnN0YW50cy5TRUNQTUlOVE9VVFBVVElEX0NPREVDT05FO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIG91dHB1dElEIGZvciB0aGlzIG91dHB1dFxuICAgKi9cbiAgZ2V0T3V0cHV0SUQoKTpudW1iZXIge1xuICAgIHJldHVybiB0aGlzLl90eXBlSUQ7XG4gIH1cblxuICAvKipcbiAgICogXG4gICAqIEBwYXJhbSBhc3NldElEIEFuIGFzc2V0SUQgd2hpY2ggaXMgd3JhcHBlZCBhcm91bmQgdGhlIEJ1ZmZlciBvZiB0aGUgT3V0cHV0XG4gICAqL1xuICBtYWtlVHJhbnNmZXJhYmxlKGFzc2V0SUQ6QnVmZmVyKTpUcmFuc2ZlcmFibGVPdXRwdXQge1xuICAgIHJldHVybiBuZXcgVHJhbnNmZXJhYmxlT3V0cHV0KGFzc2V0SUQsIHRoaXMpO1xuICB9XG5cbiAgY3JlYXRlKC4uLmFyZ3M6YW55W10pOnRoaXN7XG4gICAgcmV0dXJuIG5ldyBTRUNQTWludE91dHB1dCguLi5hcmdzKSBhcyB0aGlzO1xuICB9XG5cbiAgY2xvbmUoKTp0aGlzIHtcbiAgICBjb25zdCBuZXdvdXQ6U0VDUE1pbnRPdXRwdXQgPSB0aGlzLmNyZWF0ZSgpXG4gICAgbmV3b3V0LmZyb21CdWZmZXIodGhpcy50b0J1ZmZlcigpKTtcbiAgICByZXR1cm4gbmV3b3V0IGFzIHRoaXM7XG4gIH1cblxuICBzZWxlY3QoaWQ6bnVtYmVyLCAuLi5hcmdzOiBhbnlbXSk6T3V0cHV0IHtcbiAgICByZXR1cm4gU2VsZWN0T3V0cHV0Q2xhc3MoaWQsIC4uLmFyZ3MpO1xuICB9XG5cbn1cblxuLyoqXG4gKiBBbiBbW091dHB1dF1dIGNsYXNzIHdoaWNoIHNwZWNpZmllcyBhbiBPdXRwdXQgdGhhdCBjYXJyaWVzIGFuIE5GVCBNaW50IGFuZCB1c2VzIHNlY3AyNTZrMSBzaWduYXR1cmUgc2NoZW1lLlxuICovXG5leHBvcnQgY2xhc3MgTkZUTWludE91dHB1dCBleHRlbmRzIE5GVE91dHB1dCB7XG4gIHByb3RlY3RlZCBfdHlwZU5hbWUgPSBcIk5GVE1pbnRPdXRwdXRcIjtcbiAgcHJvdGVjdGVkIF9jb2RlY0lEID0gQVZNQ29uc3RhbnRzLkxBVEVTVENPREVDO1xuICBwcm90ZWN0ZWQgX3R5cGVJRCA9IHRoaXMuX2NvZGVjSUQgPT09IDAgPyBBVk1Db25zdGFudHMuTkZUTUlOVE9VVFBVVElEIDogQVZNQ29uc3RhbnRzLk5GVE1JTlRPVVRQVVRJRF9DT0RFQ09ORTs7XG5cbiAgLy9zZXJpYWxpemUgYW5kIGRlc2VyaWFsaXplIGJvdGggYXJlIGluaGVyaXRlZFxuXG4gIHNldENvZGVjSUQoY29kZWNJRDogbnVtYmVyKTogdm9pZCB7XG4gICAgaWYoY29kZWNJRCAhPT0gMCAmJiBjb2RlY0lEICE9PSAxKSB7XG4gICAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJFcnJvciAtIE5GVE1pbnRPdXRwdXQuc2V0Q29kZWNJRDogaW52YWxpZCBjb2RlY0lELiBWYWxpZCBjb2RlY0lEcyBhcmUgMCBhbmQgMS5cIik7XG4gICAgfVxuICAgIHRoaXMuX2NvZGVjSUQgPSBjb2RlY0lEO1xuICAgIHRoaXMuX3R5cGVJRCA9IHRoaXMuX2NvZGVjSUQgPT09IDAgPyBBVk1Db25zdGFudHMuTkZUTUlOVE9VVFBVVElEIDogQVZNQ29uc3RhbnRzLk5GVE1JTlRPVVRQVVRJRF9DT0RFQ09ORTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSBvdXRwdXRJRCBmb3IgdGhpcyBvdXRwdXRcbiAgICovXG4gIGdldE91dHB1dElEKCk6bnVtYmVyIHtcbiAgICAgIHJldHVybiB0aGlzLl90eXBlSUQ7XG4gIH1cblxuICAvKipcbiAgICogUG9wdWF0ZXMgdGhlIGluc3RhbmNlIGZyb20gYSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSByZXByZXNlbnRpbmcgdGhlIFtbTkZUTWludE91dHB1dF1dIGFuZCByZXR1cm5zIHRoZSBzaXplIG9mIHRoZSBvdXRwdXQuXG4gICAqL1xuICBmcm9tQnVmZmVyKHV0eG9idWZmOkJ1ZmZlciwgb2Zmc2V0Om51bWJlciA9IDApOm51bWJlciB7XG4gICAgICB0aGlzLmdyb3VwSUQgPSBiaW50b29scy5jb3B5RnJvbSh1dHhvYnVmZiwgb2Zmc2V0LCBvZmZzZXQgKyA0KTtcbiAgICAgIG9mZnNldCArPSA0O1xuICAgICAgcmV0dXJuIHN1cGVyLmZyb21CdWZmZXIodXR4b2J1ZmYsIG9mZnNldCk7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgYnVmZmVyIHJlcHJlc2VudGluZyB0aGUgW1tORlRNaW50T3V0cHV0XV0gaW5zdGFuY2UuXG4gICAqL1xuICB0b0J1ZmZlcigpOkJ1ZmZlciB7XG4gICAgICBsZXQgc3VwZXJidWZmOkJ1ZmZlciA9IHN1cGVyLnRvQnVmZmVyKCk7XG4gICAgICBsZXQgYnNpemU6bnVtYmVyID0gdGhpcy5ncm91cElELmxlbmd0aCArIHN1cGVyYnVmZi5sZW5ndGg7XG4gICAgICBsZXQgYmFycjpBcnJheTxCdWZmZXI+ID0gW3RoaXMuZ3JvdXBJRCwgc3VwZXJidWZmXTtcbiAgICAgIHJldHVybiBCdWZmZXIuY29uY2F0KGJhcnIsYnNpemUpO1xuICB9XG5cbiAgY3JlYXRlKC4uLmFyZ3M6YW55W10pOnRoaXN7XG4gICAgICByZXR1cm4gbmV3IE5GVE1pbnRPdXRwdXQoLi4uYXJncykgYXMgdGhpcztcbiAgfVxuXG4gIGNsb25lKCk6dGhpcyB7XG4gICAgICBjb25zdCBuZXdvdXQ6TkZUTWludE91dHB1dCA9IHRoaXMuY3JlYXRlKCk7XG4gICAgICBuZXdvdXQuZnJvbUJ1ZmZlcih0aGlzLnRvQnVmZmVyKCkpO1xuICAgICAgcmV0dXJuIG5ld291dCBhcyB0aGlzO1xuICB9XG5cbiAgLyoqXG4gICAqIEFuIFtbT3V0cHV0XV0gY2xhc3Mgd2hpY2ggY29udGFpbnMgYW4gTkZUIG1pbnQgZm9yIGFuIGFzc2V0SUQuXG4gICAqIFxuICAgKiBAcGFyYW0gZ3JvdXBJRCBBIG51bWJlciBzcGVjaWZpZXMgdGhlIGdyb3VwIHRoaXMgTkZUIGlzIGlzc3VlZCB0b1xuICAgKiBAcGFyYW0gbG9ja3RpbWUgQSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2luZHV0bnkvYm4uanMvfEJOfSByZXByZXNlbnRpbmcgdGhlIGxvY2t0aW1lXG4gICAqIEBwYXJhbSB0aHJlc2hvbGQgQSBudW1iZXIgcmVwcmVzZW50aW5nIHRoZSB0aGUgdGhyZXNob2xkIG51bWJlciBvZiBzaWduZXJzIHJlcXVpcmVkIHRvIHNpZ24gdGhlIHRyYW5zYWN0aW9uXG4gICAqIEBwYXJhbSBhZGRyZXNzZXMgQW4gYXJyYXkgb2Yge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn1zIHJlcHJlc2VudGluZyBhZGRyZXNzZXNcbiAgICovXG4gIGNvbnN0cnVjdG9yKGdyb3VwSUQ6bnVtYmVyID0gdW5kZWZpbmVkLCBhZGRyZXNzZXM6QXJyYXk8QnVmZmVyPiA9IHVuZGVmaW5lZCwgbG9ja3RpbWU6Qk4gPSB1bmRlZmluZWQsIHRocmVzaG9sZDpudW1iZXIgPSB1bmRlZmluZWQpe1xuICAgICAgc3VwZXIoYWRkcmVzc2VzLCBsb2NrdGltZSwgdGhyZXNob2xkKTtcbiAgICAgIGlmKHR5cGVvZiBncm91cElEICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgIHRoaXMuZ3JvdXBJRC53cml0ZVVJbnQzMkJFKGdyb3VwSUQsIDApO1xuICAgICAgfVxuICB9XG59XG5cbi8qKlxuICogQW4gW1tPdXRwdXRdXSBjbGFzcyB3aGljaCBzcGVjaWZpZXMgYW4gT3V0cHV0IHRoYXQgY2FycmllcyBhbiBORlQgYW5kIHVzZXMgc2VjcDI1NmsxIHNpZ25hdHVyZSBzY2hlbWUuXG4gKi9cbmV4cG9ydCBjbGFzcyBORlRUcmFuc2Zlck91dHB1dCBleHRlbmRzIE5GVE91dHB1dCB7XG4gIHByb3RlY3RlZCBfdHlwZU5hbWUgPSBcIk5GVFRyYW5zZmVyT3V0cHV0XCI7XG4gIHByb3RlY3RlZCBfY29kZWNJRCA9IEFWTUNvbnN0YW50cy5MQVRFU1RDT0RFQztcbiAgcHJvdGVjdGVkIF90eXBlSUQgPSB0aGlzLl9jb2RlY0lEID09PSAwID8gQVZNQ29uc3RhbnRzLk5GVFhGRVJPVVRQVVRJRCA6IEFWTUNvbnN0YW50cy5ORlRYRkVST1VUUFVUSURfQ09ERUNPTkU7XG5cbiAgc2VyaWFsaXplKGVuY29kaW5nOlNlcmlhbGl6ZWRFbmNvZGluZyA9IFwiaGV4XCIpOm9iamVjdCB7XG4gICAgbGV0IGZpZWxkczpvYmplY3QgPSBzdXBlci5zZXJpYWxpemUoZW5jb2RpbmcpO1xuICAgIHJldHVybiB7XG4gICAgICAuLi5maWVsZHMsXG4gICAgICBcInBheWxvYWRcIjogc2VyaWFsaXplci5lbmNvZGVyKHRoaXMucGF5bG9hZCwgZW5jb2RpbmcsIFwiQnVmZmVyXCIsIFwiaGV4XCIsIHRoaXMucGF5bG9hZC5sZW5ndGgpXG4gICAgfVxuICB9O1xuICBkZXNlcmlhbGl6ZShmaWVsZHM6b2JqZWN0LCBlbmNvZGluZzpTZXJpYWxpemVkRW5jb2RpbmcgPSBcImhleFwiKSB7XG4gICAgc3VwZXIuZGVzZXJpYWxpemUoZmllbGRzLCBlbmNvZGluZyk7XG4gICAgdGhpcy5wYXlsb2FkID0gc2VyaWFsaXplci5kZWNvZGVyKGZpZWxkc1tcInBheWxvYWRcIl0sIGVuY29kaW5nLCBcImhleFwiLCBcIkJ1ZmZlclwiKTtcbiAgICB0aGlzLnNpemVQYXlsb2FkID0gQnVmZmVyLmFsbG9jKDQpO1xuICAgIHRoaXMuc2l6ZVBheWxvYWQud3JpdGVVSW50MzJCRSh0aGlzLnBheWxvYWQubGVuZ3RoLCAwKTtcbiAgfVxuXG4gIHByb3RlY3RlZCBzaXplUGF5bG9hZDpCdWZmZXIgPSBCdWZmZXIuYWxsb2MoNCk7XG4gIHByb3RlY3RlZCBwYXlsb2FkOkJ1ZmZlcjtcblxuICBzZXRDb2RlY0lEKGNvZGVjSUQ6IG51bWJlcik6IHZvaWQge1xuICAgIGlmKGNvZGVjSUQgIT09IDAgJiYgY29kZWNJRCAhPT0gMSkge1xuICAgICAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiRXJyb3IgLSBORlRUcmFuc2Zlck91dHB1dC5zZXRDb2RlY0lEOiBpbnZhbGlkIGNvZGVjSUQuIFZhbGlkIGNvZGVjSURzIGFyZSAwIGFuZCAxLlwiKTtcbiAgICB9XG4gICAgdGhpcy5fY29kZWNJRCA9IGNvZGVjSUQ7XG4gICAgdGhpcy5fdHlwZUlEID0gdGhpcy5fY29kZWNJRCA9PT0gMCA/IEFWTUNvbnN0YW50cy5ORlRYRkVST1VUUFVUSUQgOiBBVk1Db25zdGFudHMuTkZUWEZFUk9VVFBVVElEX0NPREVDT05FO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIG91dHB1dElEIGZvciB0aGlzIG91dHB1dFxuICAgKi9cbiAgZ2V0T3V0cHV0SUQoKTpudW1iZXIge1xuICAgICAgcmV0dXJuIHRoaXMuX3R5cGVJRDtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSBwYXlsb2FkIGFzIGEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0gd2l0aCBjb250ZW50IG9ubHkuXG4gICAqL1xuICBnZXRQYXlsb2FkID0gKCk6QnVmZmVyID0+ICBiaW50b29scy5jb3B5RnJvbSh0aGlzLnBheWxvYWQpO1xuXG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIHBheWxvYWQgYXMgYSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSB3aXRoIGxlbmd0aCBvZiBwYXlsb2FkIHByZXBlbmRlZC5cbiAgICovXG4gIGdldFBheWxvYWRCdWZmZXIgPSAoKTpCdWZmZXIgPT4gQnVmZmVyLmNvbmNhdChbYmludG9vbHMuY29weUZyb20odGhpcy5zaXplUGF5bG9hZCksIGJpbnRvb2xzLmNvcHlGcm9tKHRoaXMucGF5bG9hZCldKTtcblxuXG4gIC8qKlxuICAgKiBQb3B1YXRlcyB0aGUgaW5zdGFuY2UgZnJvbSBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IHJlcHJlc2VudGluZyB0aGUgW1tORlRUcmFuc2Zlck91dHB1dF1dIGFuZCByZXR1cm5zIHRoZSBzaXplIG9mIHRoZSBvdXRwdXQuXG4gICAqL1xuICBmcm9tQnVmZmVyKHV0eG9idWZmOkJ1ZmZlciwgb2Zmc2V0Om51bWJlciA9IDApOm51bWJlciB7XG4gICAgICB0aGlzLmdyb3VwSUQgPSBiaW50b29scy5jb3B5RnJvbSh1dHhvYnVmZiwgb2Zmc2V0LCBvZmZzZXQgKyA0KTtcbiAgICAgIG9mZnNldCArPSA0O1xuICAgICAgdGhpcy5zaXplUGF5bG9hZCA9IGJpbnRvb2xzLmNvcHlGcm9tKHV0eG9idWZmLCBvZmZzZXQsIG9mZnNldCArIDQpO1xuICAgICAgbGV0IHBzaXplOm51bWJlciA9IHRoaXMuc2l6ZVBheWxvYWQucmVhZFVJbnQzMkJFKDApO1xuICAgICAgb2Zmc2V0ICs9IDQ7XG4gICAgICB0aGlzLnBheWxvYWQgPSBiaW50b29scy5jb3B5RnJvbSh1dHhvYnVmZiwgb2Zmc2V0LCBvZmZzZXQgKyBwc2l6ZSk7XG4gICAgICBvZmZzZXQgPSBvZmZzZXQgKyBwc2l6ZTtcbiAgICAgIHJldHVybiBzdXBlci5mcm9tQnVmZmVyKHV0eG9idWZmLCBvZmZzZXQpO1xuICB9XG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIHRoZSBidWZmZXIgcmVwcmVzZW50aW5nIHRoZSBbW05GVFRyYW5zZmVyT3V0cHV0XV0gaW5zdGFuY2UuXG4gICAgICovXG4gIHRvQnVmZmVyKCk6QnVmZmVyIHtcbiAgICBjb25zdCBzdXBlcmJ1ZmY6QnVmZmVyID0gc3VwZXIudG9CdWZmZXIoKTtcbiAgICBjb25zdCBic2l6ZTpudW1iZXIgPSB0aGlzLmdyb3VwSUQubGVuZ3RoICsgdGhpcy5zaXplUGF5bG9hZC5sZW5ndGggKyB0aGlzLnBheWxvYWQubGVuZ3RoICsgc3VwZXJidWZmLmxlbmd0aDtcbiAgICB0aGlzLnNpemVQYXlsb2FkLndyaXRlVUludDMyQkUodGhpcy5wYXlsb2FkLmxlbmd0aCwgMCk7XG4gICAgY29uc3QgYmFycjpBcnJheTxCdWZmZXI+ID0gW3RoaXMuZ3JvdXBJRCwgdGhpcy5zaXplUGF5bG9hZCwgdGhpcy5wYXlsb2FkLCBzdXBlcmJ1ZmZdO1xuICAgIHJldHVybiBCdWZmZXIuY29uY2F0KGJhcnIsIGJzaXplKTtcbiAgfVxuXG4gIGNyZWF0ZSguLi5hcmdzOmFueVtdKTp0aGlze1xuICAgIHJldHVybiBuZXcgTkZUVHJhbnNmZXJPdXRwdXQoLi4uYXJncykgYXMgdGhpcztcbiAgfVxuXG4gIGNsb25lKCk6dGhpcyB7XG4gICAgY29uc3QgbmV3b3V0Ok5GVFRyYW5zZmVyT3V0cHV0ID0gdGhpcy5jcmVhdGUoKVxuICAgIG5ld291dC5mcm9tQnVmZmVyKHRoaXMudG9CdWZmZXIoKSk7XG4gICAgcmV0dXJuIG5ld291dCBhcyB0aGlzO1xuICB9XG5cbiAgLyoqXG4gICAgICogQW4gW1tPdXRwdXRdXSBjbGFzcyB3aGljaCBjb250YWlucyBhbiBORlQgb24gYW4gYXNzZXRJRC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBncm91cElEIEEgbnVtYmVyIHJlcHJlc2VudGluZyB0aGUgYW1vdW50IGluIHRoZSBvdXRwdXRcbiAgICAgKiBAcGFyYW0gcGF5bG9hZCBBIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IG9mIG1heCBsZW5ndGggMTAyNCBcbiAgICAgKiBAcGFyYW0gYWRkcmVzc2VzIEFuIGFycmF5IG9mIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9cyByZXByZXNlbnRpbmcgYWRkcmVzc2VzXG4gICAgICogQHBhcmFtIGxvY2t0aW1lIEEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9pbmR1dG55L2JuLmpzL3xCTn0gcmVwcmVzZW50aW5nIHRoZSBsb2NrdGltZVxuICAgICAqIEBwYXJhbSB0aHJlc2hvbGQgQSBudW1iZXIgcmVwcmVzZW50aW5nIHRoZSB0aGUgdGhyZXNob2xkIG51bWJlciBvZiBzaWduZXJzIHJlcXVpcmVkIHRvIHNpZ24gdGhlIHRyYW5zYWN0aW9uXG5cbiAgICAgKi9cbiAgY29uc3RydWN0b3IoZ3JvdXBJRDpudW1iZXIgPSB1bmRlZmluZWQsIHBheWxvYWQ6QnVmZmVyID0gdW5kZWZpbmVkLCBhZGRyZXNzZXM6QXJyYXk8QnVmZmVyPiA9IHVuZGVmaW5lZCwgbG9ja3RpbWU6Qk4gPSB1bmRlZmluZWQsIHRocmVzaG9sZDpudW1iZXIgPSB1bmRlZmluZWQsICkge1xuICAgIHN1cGVyKGFkZHJlc3NlcywgbG9ja3RpbWUsIHRocmVzaG9sZCk7XG4gICAgaWYgKHR5cGVvZiBncm91cElEICE9PSAndW5kZWZpbmVkJyAmJiB0eXBlb2YgcGF5bG9hZCAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgIHRoaXMuZ3JvdXBJRC53cml0ZVVJbnQzMkJFKGdyb3VwSUQsIDApO1xuICAgICAgdGhpcy5zaXplUGF5bG9hZC53cml0ZVVJbnQzMkJFKHBheWxvYWQubGVuZ3RoLCAwKTtcbiAgICAgIHRoaXMucGF5bG9hZCA9IGJpbnRvb2xzLmNvcHlGcm9tKHBheWxvYWQsIDAsIHBheWxvYWQubGVuZ3RoKTtcbiAgICB9XG4gIH1cbn1cbiJdfQ==