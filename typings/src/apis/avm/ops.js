"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UTXOID = exports.NFTTransferOperation = exports.NFTMintOperation = exports.SECPMintOperation = exports.TransferableOperation = exports.Operation = exports.SelectOperationClass = void 0;
/**
 * @packageDocumentation
 * @module API-AVM-Operations
 */
const buffer_1 = require("buffer/");
const bintools_1 = __importDefault(require("../../utils/bintools"));
const constants_1 = require("./constants");
const outputs_1 = require("./outputs");
const nbytes_1 = require("../../common/nbytes");
const credentials_1 = require("../../common/credentials");
const output_1 = require("../../common/output");
const serialization_1 = require("../../utils/serialization");
const bintools = bintools_1.default.getInstance();
const serializer = serialization_1.Serialization.getInstance();
/**
 * Takes a buffer representing the output and returns the proper [[Operation]] instance.
 *
 * @param opid A number representing the operation ID parsed prior to the bytes passed in
 *
 * @returns An instance of an [[Operation]]-extended class.
 */
exports.SelectOperationClass = (opid, ...args) => {
    if (opid === constants_1.AVMConstants.SECPMINTOPID || opid === constants_1.AVMConstants.SECPMINTOPID_CODECONE) {
        return new SECPMintOperation(...args);
    }
    else if (opid === constants_1.AVMConstants.NFTMINTOPID || opid === constants_1.AVMConstants.NFTMINTOPID_CODECONE) {
        return new NFTMintOperation(...args);
    }
    else if (opid === constants_1.AVMConstants.NFTXFEROPID || opid === constants_1.AVMConstants.NFTXFEROPID_CODECONE) {
        return new NFTTransferOperation(...args);
    }
    /* istanbul ignore next */
    throw new Error("Error - SelectOperationClass: unknown opid " + opid);
};
/**
 * A class representing an operation. All operation types must extend on this class.
 */
class Operation extends serialization_1.Serializable {
    constructor() {
        super(...arguments);
        this._typeName = "Operation";
        this._typeID = undefined;
        this.sigCount = buffer_1.Buffer.alloc(4);
        this.sigIdxs = []; // idxs of signers from utxo
        /**
           * Returns the array of [[SigIdx]] for this [[Operation]]
           */
        this.getSigIdxs = () => this.sigIdxs;
        /**
           * Creates and adds a [[SigIdx]] to the [[Operation]].
           *
           * @param addressIdx The index of the address to reference in the signatures
           * @param address The address of the source of the signature
           */
        this.addSignatureIdx = (addressIdx, address) => {
            const sigidx = new credentials_1.SigIdx();
            const b = buffer_1.Buffer.alloc(4);
            b.writeUInt32BE(addressIdx, 0);
            sigidx.fromBuffer(b);
            sigidx.setSource(address);
            this.sigIdxs.push(sigidx);
            this.sigCount.writeUInt32BE(this.sigIdxs.length, 0);
        };
    }
    serialize(encoding = "hex") {
        let fields = super.serialize(encoding);
        return Object.assign(Object.assign({}, fields), { "sigIdxs": this.sigIdxs.map((s) => s.serialize(encoding)) });
    }
    ;
    deserialize(fields, encoding = "hex") {
        super.deserialize(fields, encoding);
        this.sigIdxs = fields["sigIdxs"].map((s) => {
            let sidx = new credentials_1.SigIdx();
            sidx.deserialize(s, encoding);
            return sidx;
        });
        this.sigCount.writeUInt32BE(this.sigIdxs.length, 0);
    }
    fromBuffer(bytes, offset = 0) {
        this.sigCount = bintools.copyFrom(bytes, offset, offset + 4);
        offset += 4;
        const sigCount = this.sigCount.readUInt32BE(0);
        this.sigIdxs = [];
        for (let i = 0; i < sigCount; i++) {
            const sigidx = new credentials_1.SigIdx();
            const sigbuff = bintools.copyFrom(bytes, offset, offset + 4);
            sigidx.fromBuffer(sigbuff);
            offset += 4;
            this.sigIdxs.push(sigidx);
        }
        return offset;
    }
    toBuffer() {
        this.sigCount.writeUInt32BE(this.sigIdxs.length, 0);
        let bsize = this.sigCount.length;
        const barr = [this.sigCount];
        for (let i = 0; i < this.sigIdxs.length; i++) {
            const b = this.sigIdxs[i].toBuffer();
            barr.push(b);
            bsize += b.length;
        }
        return buffer_1.Buffer.concat(barr, bsize);
    }
    /**
     * Returns a base-58 string representing the [[NFTMintOperation]].
     */
    toString() {
        return bintools.bufferToB58(this.toBuffer());
    }
}
exports.Operation = Operation;
Operation.comparator = () => (a, b) => {
    const aoutid = buffer_1.Buffer.alloc(4);
    aoutid.writeUInt32BE(a.getOperationID(), 0);
    const abuff = a.toBuffer();
    const boutid = buffer_1.Buffer.alloc(4);
    boutid.writeUInt32BE(b.getOperationID(), 0);
    const bbuff = b.toBuffer();
    const asort = buffer_1.Buffer.concat([aoutid, abuff], aoutid.length + abuff.length);
    const bsort = buffer_1.Buffer.concat([boutid, bbuff], boutid.length + bbuff.length);
    return buffer_1.Buffer.compare(asort, bsort);
};
/**
 * A class which contains an [[Operation]] for transfers.
 *
 */
class TransferableOperation extends serialization_1.Serializable {
    constructor(assetid = undefined, utxoids = undefined, operation = undefined) {
        super();
        this._typeName = "TransferableOperation";
        this._typeID = undefined;
        this.assetid = buffer_1.Buffer.alloc(32);
        this.utxoIDs = [];
        /**
         * Returns the assetID as a {@link https://github.com/feross/buffer|Buffer}.
         */
        this.getAssetID = () => this.assetid;
        /**
         * Returns an array of UTXOIDs in this operation.
         */
        this.getUTXOIDs = () => this.utxoIDs;
        /**
         * Returns the operation
         */
        this.getOperation = () => this.operation;
        if (typeof assetid !== 'undefined' && assetid.length === constants_1.AVMConstants.ASSETIDLEN
            && operation instanceof Operation && typeof utxoids !== 'undefined'
            && Array.isArray(utxoids)) {
            this.assetid = assetid;
            this.operation = operation;
            for (let i = 0; i < utxoids.length; i++) {
                const utxoid = new UTXOID();
                if (typeof utxoids[i] === 'string') {
                    utxoid.fromString(utxoids[i]);
                }
                else if (utxoids[i] instanceof buffer_1.Buffer) {
                    utxoid.fromBuffer(utxoids[i]);
                }
                else if (utxoids[i] instanceof UTXOID) {
                    utxoid.fromString(utxoids[i].toString()); // clone
                }
                this.utxoIDs.push(utxoid);
            }
        }
    }
    serialize(encoding = "hex") {
        let fields = super.serialize(encoding);
        return Object.assign(Object.assign({}, fields), { "assetid": serializer.encoder(this.assetid, encoding, "Buffer", "cb58", 32), "utxoIDs": this.utxoIDs.map((u) => u.serialize(encoding)), "operation": this.operation.serialize(encoding) });
    }
    ;
    deserialize(fields, encoding = "hex") {
        super.deserialize(fields, encoding);
        this.assetid = serializer.decoder(fields["assetid"], encoding, "cb58", "Buffer", 32);
        this.utxoIDs = fields["utxoIDs"].map((u) => {
            let utxoid = new UTXOID();
            utxoid.deserialize(u, encoding);
            return utxoid;
        });
        this.operation = exports.SelectOperationClass(fields["operation"]["_typeID"]);
        this.operation.deserialize(fields["operation"], encoding);
    }
    fromBuffer(bytes, offset = 0) {
        this.assetid = bintools.copyFrom(bytes, offset, offset + 32);
        offset += 32;
        const numutxoIDs = bintools.copyFrom(bytes, offset, offset + 4).readUInt32BE(0);
        offset += 4;
        this.utxoIDs = [];
        for (let i = 0; i < numutxoIDs; i++) {
            const utxoid = new UTXOID();
            offset = utxoid.fromBuffer(bytes, offset);
            this.utxoIDs.push(utxoid);
        }
        const opid = bintools.copyFrom(bytes, offset, offset + 4).readUInt32BE(0);
        offset += 4;
        this.operation = exports.SelectOperationClass(opid);
        return this.operation.fromBuffer(bytes, offset);
    }
    toBuffer() {
        const numutxoIDs = buffer_1.Buffer.alloc(4);
        numutxoIDs.writeUInt32BE(this.utxoIDs.length, 0);
        let bsize = this.assetid.length + numutxoIDs.length;
        const barr = [this.assetid, numutxoIDs];
        this.utxoIDs = this.utxoIDs.sort(UTXOID.comparator());
        for (let i = 0; i < this.utxoIDs.length; i++) {
            const b = this.utxoIDs[i].toBuffer();
            barr.push(b);
            bsize += b.length;
        }
        const opid = buffer_1.Buffer.alloc(4);
        opid.writeUInt32BE(this.operation.getOperationID(), 0);
        barr.push(opid);
        bsize += opid.length;
        const b = this.operation.toBuffer();
        bsize += b.length;
        barr.push(b);
        return buffer_1.Buffer.concat(barr, bsize);
    }
}
exports.TransferableOperation = TransferableOperation;
/**
 * Returns a function used to sort an array of [[TransferableOperation]]s
 */
TransferableOperation.comparator = () => {
    return function (a, b) {
        return buffer_1.Buffer.compare(a.toBuffer(), b.toBuffer());
    };
};
/**
 * An [[Operation]] class which specifies a SECP256k1 Mint Op.
 */
class SECPMintOperation extends Operation {
    /**
     * An [[Operation]] class which mints new tokens on an assetID.
     *
     * @param mintOutput The [[SECPMintOutput]] that will be produced by this transaction.
     * @param transferOutput A [[SECPTransferOutput]] that will be produced from this minting operation.
     */
    constructor(mintOutput = undefined, transferOutput = undefined) {
        super();
        this._typeName = "SECPMintOperation";
        this._codecID = constants_1.AVMConstants.LATESTCODEC;
        this._typeID = this._codecID === 0 ? constants_1.AVMConstants.SECPMINTOPID : constants_1.AVMConstants.SECPMINTOPID_CODECONE;
        this.mintOutput = undefined;
        this.transferOutput = undefined;
        if (typeof mintOutput !== 'undefined') {
            this.mintOutput = mintOutput;
        }
        if (typeof transferOutput !== 'undefined') {
            this.transferOutput = transferOutput;
        }
    }
    serialize(encoding = "hex") {
        let fields = super.serialize(encoding);
        return Object.assign(Object.assign({}, fields), { "mintOutput": this.mintOutput.serialize(encoding), "transferOutputs": this.transferOutput.serialize(encoding) });
    }
    ;
    deserialize(fields, encoding = "hex") {
        super.deserialize(fields, encoding);
        this.mintOutput = new outputs_1.SECPMintOutput();
        this.mintOutput.deserialize(fields["mintOutput"], encoding);
        this.transferOutput = new outputs_1.SECPTransferOutput();
        this.transferOutput.deserialize(fields["transferOutputs"], encoding);
    }
    setCodecID(codecID) {
        if (codecID !== 0 && codecID !== 1) {
            /* istanbul ignore next */
            throw new Error("Error - SECPMintOperation.setCodecID: invalid codecID. Valid codecIDs are 0 and 1.");
        }
        this._codecID = codecID;
        this._typeID = this._codecID === 0 ? constants_1.AVMConstants.SECPMINTOPID : constants_1.AVMConstants.SECPMINTOPID_CODECONE;
    }
    /**
     * Returns the operation ID.
     */
    getOperationID() {
        return this._typeID;
    }
    /**
     * Returns the credential ID.
     */
    getCredentialID() {
        if (this._codecID === 0) {
            return constants_1.AVMConstants.SECPCREDENTIAL;
        }
        else if (this._codecID === 1) {
            return constants_1.AVMConstants.SECPCREDENTIAL_CODECONE;
        }
    }
    /**
     * Returns the [[SECPMintOutput]] to be produced by this operation.
     */
    getMintOutput() {
        return this.mintOutput;
    }
    /**
     * Returns [[SECPTransferOutput]] to be produced by this operation.
     */
    getTransferOutput() {
        return this.transferOutput;
    }
    /**
     * Popuates the instance from a {@link https://github.com/feross/buffer|Buffer} representing the [[SECPMintOperation]] and returns the updated offset.
     */
    fromBuffer(bytes, offset = 0) {
        offset = super.fromBuffer(bytes, offset);
        this.mintOutput = new outputs_1.SECPMintOutput();
        offset = this.mintOutput.fromBuffer(bytes, offset);
        this.transferOutput = new outputs_1.SECPTransferOutput();
        offset = this.transferOutput.fromBuffer(bytes, offset);
        return offset;
    }
    /**
     * Returns the buffer representing the [[SECPMintOperation]] instance.
     */
    toBuffer() {
        let superbuff = super.toBuffer();
        let mintoutBuff = this.mintOutput.toBuffer();
        let transferOutBuff = this.transferOutput.toBuffer();
        let bsize = superbuff.length +
            mintoutBuff.length +
            transferOutBuff.length;
        let barr = [
            superbuff,
            mintoutBuff,
            transferOutBuff
        ];
        return buffer_1.Buffer.concat(barr, bsize);
    }
}
exports.SECPMintOperation = SECPMintOperation;
/**
 * An [[Operation]] class which specifies a NFT Mint Op.
 */
class NFTMintOperation extends Operation {
    /**
     * An [[Operation]] class which contains an NFT on an assetID.
     *
     * @param groupID The group to which to issue the NFT Output
     * @param payload A {@link https://github.com/feross/buffer|Buffer} of the NFT payload
     * @param outputOwners An array of outputOwners
     */
    constructor(groupID = undefined, payload = undefined, outputOwners = undefined) {
        super();
        this._typeName = "NFTMintOperation";
        this._codecID = constants_1.AVMConstants.LATESTCODEC;
        this._typeID = this._codecID === 0 ? constants_1.AVMConstants.NFTMINTOPID : constants_1.AVMConstants.NFTMINTOPID_CODECONE;
        this.groupID = buffer_1.Buffer.alloc(4);
        this.outputOwners = [];
        /**
         * Returns the credential ID.
         */
        this.getCredentialID = () => {
            if (this._codecID === 0) {
                return constants_1.AVMConstants.NFTCREDENTIAL;
            }
            else if (this._codecID === 1) {
                return constants_1.AVMConstants.NFTCREDENTIAL_CODECONE;
            }
        };
        /**
         * Returns the payload.
         */
        this.getPayload = () => {
            return bintools.copyFrom(this.payload, 0);
        };
        /**
         * Returns the payload's raw {@link https://github.com/feross/buffer|Buffer} with length prepended, for use with [[PayloadBase]]'s fromBuffer
         */
        this.getPayloadBuffer = () => {
            let payloadlen = buffer_1.Buffer.alloc(4);
            payloadlen.writeUInt32BE(this.payload.length, 0);
            return buffer_1.Buffer.concat([payloadlen, bintools.copyFrom(this.payload, 0)]);
        };
        /**
         * Returns the outputOwners.
         */
        this.getOutputOwners = () => {
            return this.outputOwners;
        };
        if (typeof groupID !== 'undefined' && typeof payload !== 'undefined' && outputOwners.length) {
            this.groupID.writeUInt32BE((groupID ? groupID : 0), 0);
            this.payload = payload;
            this.outputOwners = outputOwners;
        }
    }
    serialize(encoding = "hex") {
        let fields = super.serialize(encoding);
        return Object.assign(Object.assign({}, fields), { "groupID": serializer.encoder(this.groupID, encoding, "Buffer", "decimalString", 4), "payload": serializer.encoder(this.payload, encoding, "Buffer", "hex"), "outputOwners": this.outputOwners.map((o) => o.serialize(encoding)) });
    }
    ;
    deserialize(fields, encoding = "hex") {
        super.deserialize(fields, encoding);
        this.groupID = serializer.decoder(fields["groupID"], encoding, "decimalString", "Buffer", 4);
        this.payload = serializer.decoder(fields["payload"], encoding, "hex", "Buffer");
        this.outputOwners = fields["outputOwners"].map((o) => {
            let oo = new output_1.OutputOwners();
            oo.deserialize(o, encoding);
            return oo;
        });
    }
    setCodecID(codecID) {
        if (codecID !== 0 && codecID !== 1) {
            /* istanbul ignore next */
            throw new Error("Error - NFTMintOperation.setCodecID: invalid codecID. Valid codecIDs are 0 and 1.");
        }
        this._codecID = codecID;
        this._typeID = this._codecID === 0 ? constants_1.AVMConstants.NFTMINTOPID : constants_1.AVMConstants.NFTMINTOPID_CODECONE;
    }
    /**
     * Returns the operation ID.
     */
    getOperationID() {
        return this._typeID;
    }
    /**
     * Popuates the instance from a {@link https://github.com/feross/buffer|Buffer} representing the [[NFTMintOperation]] and returns the updated offset.
     */
    fromBuffer(bytes, offset = 0) {
        offset = super.fromBuffer(bytes, offset);
        this.groupID = bintools.copyFrom(bytes, offset, offset + 4);
        offset += 4;
        let payloadLen = bintools.copyFrom(bytes, offset, offset + 4).readUInt32BE(0);
        offset += 4;
        this.payload = bintools.copyFrom(bytes, offset, offset + payloadLen);
        offset += payloadLen;
        let numoutputs = bintools.copyFrom(bytes, offset, offset + 4).readUInt32BE(0);
        offset += 4;
        this.outputOwners = [];
        for (let i = 0; i < numoutputs; i++) {
            let outputOwner = new output_1.OutputOwners();
            offset = outputOwner.fromBuffer(bytes, offset);
            this.outputOwners.push(outputOwner);
        }
        return offset;
    }
    /**
     * Returns the buffer representing the [[NFTMintOperation]] instance.
     */
    toBuffer() {
        let superbuff = super.toBuffer();
        let payloadlen = buffer_1.Buffer.alloc(4);
        payloadlen.writeUInt32BE(this.payload.length, 0);
        let outputownerslen = buffer_1.Buffer.alloc(4);
        outputownerslen.writeUInt32BE(this.outputOwners.length, 0);
        let bsize = superbuff.length +
            this.groupID.length +
            payloadlen.length +
            this.payload.length +
            outputownerslen.length;
        let barr = [
            superbuff,
            this.groupID,
            payloadlen,
            this.payload,
            outputownerslen
        ];
        for (let i = 0; i < this.outputOwners.length; i++) {
            let b = this.outputOwners[i].toBuffer();
            barr.push(b);
            bsize += b.length;
        }
        return buffer_1.Buffer.concat(barr, bsize);
    }
    /**
     * Returns a base-58 string representing the [[NFTMintOperation]].
     */
    toString() {
        return bintools.bufferToB58(this.toBuffer());
    }
}
exports.NFTMintOperation = NFTMintOperation;
/**
 * A [[Operation]] class which specifies a NFT Transfer Op.
 */
class NFTTransferOperation extends Operation {
    /**
       * An [[Operation]] class which contains an NFT on an assetID.
       *
       * @param output An [[NFTTransferOutput]]
       */
    constructor(output = undefined) {
        super();
        this._typeName = "NFTTransferOperation";
        this._codecID = constants_1.AVMConstants.LATESTCODEC;
        this._typeID = this._codecID === 0 ? constants_1.AVMConstants.NFTXFEROPID : constants_1.AVMConstants.NFTXFEROPID_CODECONE;
        this.getOutput = () => this.output;
        if (typeof output !== 'undefined') {
            this.output = output;
        }
    }
    serialize(encoding = "hex") {
        let fields = super.serialize(encoding);
        return Object.assign(Object.assign({}, fields), { "output": this.output.serialize(encoding) });
    }
    ;
    deserialize(fields, encoding = "hex") {
        super.deserialize(fields, encoding);
        this.output = new outputs_1.NFTTransferOutput();
        this.output.deserialize(fields["output"], encoding);
    }
    setCodecID(codecID) {
        if (codecID !== 0 && codecID !== 1) {
            /* istanbul ignore next */
            throw new Error("Error - NFTTransferOperation.setCodecID: invalid codecID. Valid codecIDs are 0 and 1.");
        }
        this._codecID = codecID;
        this._typeID = this._codecID === 0 ? constants_1.AVMConstants.NFTXFEROPID : constants_1.AVMConstants.NFTXFEROPID_CODECONE;
    }
    /**
     * Returns the operation ID.
     */
    getOperationID() {
        return this._typeID;
    }
    /**
     * Returns the credential ID.
     */
    getCredentialID() {
        if (this._codecID === 0) {
            return constants_1.AVMConstants.NFTCREDENTIAL;
        }
        else if (this._codecID === 1) {
            return constants_1.AVMConstants.NFTCREDENTIAL_CODECONE;
        }
    }
    /**
       * Popuates the instance from a {@link https://github.com/feross/buffer|Buffer} representing the [[NFTTransferOperation]] and returns the updated offset.
       */
    fromBuffer(bytes, offset = 0) {
        offset = super.fromBuffer(bytes, offset);
        this.output = new outputs_1.NFTTransferOutput();
        return this.output.fromBuffer(bytes, offset);
    }
    /**
       * Returns the buffer representing the [[NFTTransferOperation]] instance.
       */
    toBuffer() {
        const superbuff = super.toBuffer();
        const outbuff = this.output.toBuffer();
        const bsize = superbuff.length + outbuff.length;
        const barr = [superbuff, outbuff];
        return buffer_1.Buffer.concat(barr, bsize);
    }
    /**
       * Returns a base-58 string representing the [[NFTTransferOperation]].
       */
    toString() {
        return bintools.bufferToB58(this.toBuffer());
    }
}
exports.NFTTransferOperation = NFTTransferOperation;
/**
 * CKC - Make generic, use everywhere.
 */
/**
 * Class for representing a UTXOID used in [[TransferableOp]] types
 */
class UTXOID extends nbytes_1.NBytes {
    /**
       * Class for representing a UTXOID used in [[TransferableOp]] types
       */
    constructor() {
        super();
        this._typeName = "UTXOID";
        this._typeID = undefined;
        //serialize and deserialize both are inherited
        this.bytes = buffer_1.Buffer.alloc(36);
        this.bsize = 36;
    }
    /**
       * Returns a base-58 representation of the [[UTXOID]].
       */
    toString() {
        return bintools.cb58Encode(this.toBuffer());
    }
    /**
       * Takes a base-58 string containing an [[UTXOID]], parses it, populates the class, and returns the length of the UTXOID in bytes.
       *
       * @param bytes A base-58 string containing a raw [[UTXOID]]
       *
       * @returns The length of the raw [[UTXOID]]
       */
    fromString(utxoid) {
        const utxoidbuff = bintools.b58ToBuffer(utxoid);
        if (utxoidbuff.length === 40 && bintools.validateChecksum(utxoidbuff)) {
            const newbuff = bintools.copyFrom(utxoidbuff, 0, utxoidbuff.length - 4);
            if (newbuff.length === 36) {
                this.bytes = newbuff;
            }
        }
        else if (utxoidbuff.length === 40) {
            throw new Error('Error - UTXOID.fromString: invalid checksum on address');
        }
        else if (utxoidbuff.length === 36) {
            this.bytes = utxoidbuff;
        }
        else {
            /* istanbul ignore next */
            throw new Error('Error - UTXOID.fromString: invalid address');
        }
        return this.getSize();
    }
    clone() {
        let newbase = new UTXOID();
        newbase.fromBuffer(this.toBuffer());
        return newbase;
    }
    create(...args) {
        return new UTXOID();
    }
}
exports.UTXOID = UTXOID;
/**
   * Returns a function used to sort an array of [[UTXOID]]s
   */
UTXOID.comparator = () => (a, b) => buffer_1.Buffer.compare(a.toBuffer(), b.toBuffer());
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib3BzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vc3JjL2FwaXMvYXZtL29wcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQTs7O0dBR0c7QUFDSCxvQ0FBaUM7QUFDakMsb0VBQTRDO0FBQzVDLDJDQUEyQztBQUMzQyx1Q0FBa0Y7QUFDbEYsZ0RBQTZDO0FBQzdDLDBEQUFrRDtBQUNsRCxnREFBbUQ7QUFDbkQsNkRBQTRGO0FBRzVGLE1BQU0sUUFBUSxHQUFHLGtCQUFRLENBQUMsV0FBVyxFQUFFLENBQUM7QUFDeEMsTUFBTSxVQUFVLEdBQUcsNkJBQWEsQ0FBQyxXQUFXLEVBQUUsQ0FBQztBQUUvQzs7Ozs7O0dBTUc7QUFDVSxRQUFBLG9CQUFvQixHQUFHLENBQUMsSUFBVyxFQUFFLEdBQUcsSUFBZSxFQUFZLEVBQUU7SUFDOUUsSUFBRyxJQUFJLEtBQUssd0JBQVksQ0FBQyxZQUFZLElBQUksSUFBSSxLQUFLLHdCQUFZLENBQUMscUJBQXFCLEVBQUU7UUFDcEYsT0FBTyxJQUFJLGlCQUFpQixDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUM7S0FDdkM7U0FBTSxJQUFHLElBQUksS0FBSyx3QkFBWSxDQUFDLFdBQVcsSUFBSSxJQUFJLEtBQUssd0JBQVksQ0FBQyxvQkFBb0IsRUFBQztRQUN4RixPQUFPLElBQUksZ0JBQWdCLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQztLQUN0QztTQUFNLElBQUcsSUFBSSxLQUFLLHdCQUFZLENBQUMsV0FBVyxJQUFJLElBQUksS0FBSyx3QkFBWSxDQUFDLG9CQUFvQixFQUFDO1FBQ3hGLE9BQU8sSUFBSSxvQkFBb0IsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDO0tBQzFDO0lBQ0QsMEJBQTBCO0lBQzFCLE1BQU0sSUFBSSxLQUFLLENBQUMsNkNBQTZDLEdBQUcsSUFBSSxDQUFDLENBQUM7QUFDMUUsQ0FBQyxDQUFBO0FBRUQ7O0dBRUc7QUFDSCxNQUFzQixTQUFVLFNBQVEsNEJBQVk7SUFBcEQ7O1FBQ1ksY0FBUyxHQUFHLFdBQVcsQ0FBQztRQUN4QixZQUFPLEdBQUcsU0FBUyxDQUFDO1FBbUJwQixhQUFRLEdBQVUsZUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNsQyxZQUFPLEdBQWlCLEVBQUUsQ0FBQyxDQUFDLDRCQUE0QjtRQWtCbEU7O2FBRUs7UUFDTCxlQUFVLEdBQUcsR0FBaUIsRUFBRSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUM7UUFPOUM7Ozs7O2FBS0s7UUFDTCxvQkFBZSxHQUFHLENBQUMsVUFBaUIsRUFBRSxPQUFjLEVBQUUsRUFBRTtZQUN0RCxNQUFNLE1BQU0sR0FBVSxJQUFJLG9CQUFNLEVBQUUsQ0FBQztZQUNuQyxNQUFNLENBQUMsR0FBVSxlQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ2pDLENBQUMsQ0FBQyxhQUFhLENBQUMsVUFBVSxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQy9CLE1BQU0sQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDckIsTUFBTSxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUMxQixJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUMxQixJQUFJLENBQUMsUUFBUSxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsQ0FBQztRQUN0RCxDQUFDLENBQUM7SUFvQ0osQ0FBQztJQWhHQyxTQUFTLENBQUMsV0FBOEIsS0FBSztRQUMzQyxJQUFJLE1BQU0sR0FBVSxLQUFLLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQzlDLHVDQUNLLE1BQU0sS0FDVCxTQUFTLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUFDLENBQUMsSUFDMUQ7SUFDSCxDQUFDO0lBQUEsQ0FBQztJQUNGLFdBQVcsQ0FBQyxNQUFhLEVBQUUsV0FBOEIsS0FBSztRQUM1RCxLQUFLLENBQUMsV0FBVyxDQUFDLE1BQU0sRUFBRSxRQUFRLENBQUMsQ0FBQztRQUNwQyxJQUFJLENBQUMsT0FBTyxHQUFHLE1BQU0sQ0FBQyxTQUFTLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFRLEVBQUUsRUFBRTtZQUNoRCxJQUFJLElBQUksR0FBVSxJQUFJLG9CQUFNLEVBQUUsQ0FBQztZQUMvQixJQUFJLENBQUMsV0FBVyxDQUFDLENBQUMsRUFBRSxRQUFRLENBQUMsQ0FBQztZQUM5QixPQUFPLElBQUksQ0FBQztRQUNkLENBQUMsQ0FBQyxDQUFDO1FBQ0gsSUFBSSxDQUFDLFFBQVEsQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLENBQUM7SUFDdEQsQ0FBQztJQStDRCxVQUFVLENBQUMsS0FBWSxFQUFFLFNBQWdCLENBQUM7UUFDeEMsSUFBSSxDQUFDLFFBQVEsR0FBRyxRQUFRLENBQUMsUUFBUSxDQUFDLEtBQUssRUFBRSxNQUFNLEVBQUUsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDO1FBQzdELE1BQU0sSUFBSSxDQUFDLENBQUM7UUFDWixNQUFNLFFBQVEsR0FBVSxJQUFJLENBQUMsUUFBUSxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUN0RCxJQUFJLENBQUMsT0FBTyxHQUFHLEVBQUUsQ0FBQztRQUNsQixLQUFLLElBQUksQ0FBQyxHQUFVLENBQUMsRUFBRSxDQUFDLEdBQUcsUUFBUSxFQUFFLENBQUMsRUFBRSxFQUFFO1lBQ3hDLE1BQU0sTUFBTSxHQUFVLElBQUksb0JBQU0sRUFBRSxDQUFDO1lBQ25DLE1BQU0sT0FBTyxHQUFVLFFBQVEsQ0FBQyxRQUFRLENBQUMsS0FBSyxFQUFFLE1BQU0sRUFBRSxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUM7WUFDcEUsTUFBTSxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUMzQixNQUFNLElBQUksQ0FBQyxDQUFDO1lBQ1osSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7U0FDM0I7UUFDRCxPQUFPLE1BQU0sQ0FBQztJQUNoQixDQUFDO0lBRUQsUUFBUTtRQUNOLElBQUksQ0FBQyxRQUFRLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQ3BELElBQUksS0FBSyxHQUFVLElBQUksQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDO1FBQ3hDLE1BQU0sSUFBSSxHQUFpQixDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUMzQyxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUU7WUFDNUMsTUFBTSxDQUFDLEdBQVUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLEVBQUUsQ0FBQztZQUM1QyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ2IsS0FBSyxJQUFJLENBQUMsQ0FBQyxNQUFNLENBQUM7U0FDbkI7UUFDRCxPQUFPLGVBQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxFQUFFLEtBQUssQ0FBQyxDQUFDO0lBQ3BDLENBQUM7SUFFRDs7T0FFRztJQUNILFFBQVE7UUFDTixPQUFPLFFBQVEsQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUM7SUFDL0MsQ0FBQzs7QUFsR0gsOEJBb0dDO0FBNUVRLG9CQUFVLEdBQUcsR0FBMEMsRUFBRSxDQUFDLENBQUMsQ0FBVyxFQUFFLENBQVcsRUFBVyxFQUFFO0lBQ3JHLE1BQU0sTUFBTSxHQUFVLGVBQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDdEMsTUFBTSxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUMsY0FBYyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUM7SUFDNUMsTUFBTSxLQUFLLEdBQVUsQ0FBQyxDQUFDLFFBQVEsRUFBRSxDQUFDO0lBRWxDLE1BQU0sTUFBTSxHQUFVLGVBQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDdEMsTUFBTSxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUMsY0FBYyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUM7SUFDNUMsTUFBTSxLQUFLLEdBQVUsQ0FBQyxDQUFDLFFBQVEsRUFBRSxDQUFDO0lBRWxDLE1BQU0sS0FBSyxHQUFVLGVBQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQyxNQUFNLEVBQUUsS0FBSyxDQUFDLEVBQUUsTUFBTSxDQUFDLE1BQU0sR0FBRyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUM7SUFDbEYsTUFBTSxLQUFLLEdBQVUsZUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDLE1BQU0sRUFBRSxLQUFLLENBQUMsRUFBRSxNQUFNLENBQUMsTUFBTSxHQUFHLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUNsRixPQUFPLGVBQU0sQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBYSxDQUFDO0FBQ2xELENBQUMsQ0FBQztBQWtFSjs7O0dBR0c7QUFDSCxNQUFhLHFCQUFzQixTQUFRLDRCQUFZO0lBMEZyRCxZQUFZLFVBQWlCLFNBQVMsRUFBRSxVQUFzQyxTQUFTLEVBQUUsWUFBc0IsU0FBUztRQUN0SCxLQUFLLEVBQUUsQ0FBQztRQTFGQSxjQUFTLEdBQUcsdUJBQXVCLENBQUM7UUFDcEMsWUFBTyxHQUFHLFNBQVMsQ0FBQztRQXVCcEIsWUFBTyxHQUFVLGVBQU0sQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLENBQUM7UUFDbEMsWUFBTyxHQUFpQixFQUFFLENBQUM7UUFXckM7O1dBRUc7UUFDSCxlQUFVLEdBQUcsR0FBVSxFQUFFLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQztRQUV2Qzs7V0FFRztRQUNILGVBQVUsR0FBRyxHQUFpQixFQUFFLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQztRQUU5Qzs7V0FFRztRQUNILGlCQUFZLEdBQUcsR0FBYSxFQUFFLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQztRQTBDNUMsSUFDRSxPQUFPLE9BQU8sS0FBSyxXQUFXLElBQUksT0FBTyxDQUFDLE1BQU0sS0FBSyx3QkFBWSxDQUFDLFVBQVU7ZUFDbkUsU0FBUyxZQUFZLFNBQVMsSUFBSSxPQUFPLE9BQU8sS0FBSyxXQUFXO2VBQ2hFLEtBQUssQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLEVBQy9CO1lBQ0EsSUFBSSxDQUFDLE9BQU8sR0FBRyxPQUFPLENBQUM7WUFDdkIsSUFBSSxDQUFDLFNBQVMsR0FBRyxTQUFTLENBQUM7WUFDM0IsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLE9BQU8sQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUU7Z0JBQ3ZDLE1BQU0sTUFBTSxHQUFVLElBQUksTUFBTSxFQUFFLENBQUM7Z0JBQ25DLElBQUksT0FBTyxPQUFPLENBQUMsQ0FBQyxDQUFDLEtBQUssUUFBUSxFQUFFO29CQUNsQyxNQUFNLENBQUMsVUFBVSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQVcsQ0FBQyxDQUFDO2lCQUN6QztxQkFBTSxJQUFJLE9BQU8sQ0FBQyxDQUFDLENBQUMsWUFBWSxlQUFNLEVBQUU7b0JBQ3ZDLE1BQU0sQ0FBQyxVQUFVLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBVyxDQUFDLENBQUM7aUJBQ3pDO3FCQUFNLElBQUksT0FBTyxDQUFDLENBQUMsQ0FBQyxZQUFZLE1BQU0sRUFBRTtvQkFDdkMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQyxDQUFDLFFBQVE7aUJBQ25EO2dCQUNELElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO2FBQzNCO1NBQ0Y7SUFDSCxDQUFDO0lBM0dELFNBQVMsQ0FBQyxXQUE4QixLQUFLO1FBQzNDLElBQUksTUFBTSxHQUFVLEtBQUssQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDOUMsdUNBQ0ssTUFBTSxLQUNULFNBQVMsRUFBRSxVQUFVLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsUUFBUSxFQUFFLFFBQVEsRUFBRSxNQUFNLEVBQUUsRUFBRSxDQUFDLEVBQzNFLFNBQVMsRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxFQUN6RCxXQUFXLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUFDLElBQ2hEO0lBQ0gsQ0FBQztJQUFBLENBQUM7SUFDRixXQUFXLENBQUMsTUFBYSxFQUFFLFdBQThCLEtBQUs7UUFDNUQsS0FBSyxDQUFDLFdBQVcsQ0FBQyxNQUFNLEVBQUUsUUFBUSxDQUFDLENBQUM7UUFDcEMsSUFBSSxDQUFDLE9BQU8sR0FBRyxVQUFVLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsRUFBRSxRQUFRLEVBQUUsTUFBTSxFQUFFLFFBQVEsRUFBRSxFQUFFLENBQUMsQ0FBQztRQUNyRixJQUFJLENBQUMsT0FBTyxHQUFHLE1BQU0sQ0FBQyxTQUFTLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFRLEVBQUUsRUFBRTtZQUNoRCxJQUFJLE1BQU0sR0FBVSxJQUFJLE1BQU0sRUFBRSxDQUFDO1lBQ2pDLE1BQU0sQ0FBQyxXQUFXLENBQUMsQ0FBQyxFQUFFLFFBQVEsQ0FBQyxDQUFDO1lBQ2hDLE9BQU8sTUFBTSxDQUFDO1FBQ2hCLENBQUMsQ0FBQyxDQUFDO1FBQ0gsSUFBSSxDQUFDLFNBQVMsR0FBRyw0QkFBb0IsQ0FBQyxNQUFNLENBQUMsV0FBVyxDQUFDLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQztRQUN0RSxJQUFJLENBQUMsU0FBUyxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsV0FBVyxDQUFDLEVBQUUsUUFBUSxDQUFDLENBQUM7SUFDNUQsQ0FBQztJQTZCRCxVQUFVLENBQUMsS0FBWSxFQUFFLFNBQWdCLENBQUM7UUFDeEMsSUFBSSxDQUFDLE9BQU8sR0FBRyxRQUFRLENBQUMsUUFBUSxDQUFDLEtBQUssRUFBRSxNQUFNLEVBQUUsTUFBTSxHQUFHLEVBQUUsQ0FBQyxDQUFDO1FBQzdELE1BQU0sSUFBSSxFQUFFLENBQUM7UUFDYixNQUFNLFVBQVUsR0FBVSxRQUFRLENBQUMsUUFBUSxDQUFDLEtBQUssRUFBRSxNQUFNLEVBQUUsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUN2RixNQUFNLElBQUksQ0FBQyxDQUFDO1FBQ1osSUFBSSxDQUFDLE9BQU8sR0FBRyxFQUFFLENBQUM7UUFDbEIsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLFVBQVUsRUFBRSxDQUFDLEVBQUUsRUFBRTtZQUNuQyxNQUFNLE1BQU0sR0FBVSxJQUFJLE1BQU0sRUFBRSxDQUFDO1lBQ25DLE1BQU0sR0FBRyxNQUFNLENBQUMsVUFBVSxDQUFDLEtBQUssRUFBRSxNQUFNLENBQUMsQ0FBQztZQUMxQyxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztTQUMzQjtRQUNELE1BQU0sSUFBSSxHQUFVLFFBQVEsQ0FBQyxRQUFRLENBQUMsS0FBSyxFQUFFLE1BQU0sRUFBRSxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ2pGLE1BQU0sSUFBSSxDQUFDLENBQUM7UUFDWixJQUFJLENBQUMsU0FBUyxHQUFHLDRCQUFvQixDQUFDLElBQUksQ0FBQyxDQUFDO1FBQzVDLE9BQU8sSUFBSSxDQUFDLFNBQVMsQ0FBQyxVQUFVLENBQUMsS0FBSyxFQUFFLE1BQU0sQ0FBQyxDQUFDO0lBQ2xELENBQUM7SUFFRCxRQUFRO1FBQ04sTUFBTSxVQUFVLEdBQUcsZUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNuQyxVQUFVLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQ2pELElBQUksS0FBSyxHQUFVLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxHQUFHLFVBQVUsQ0FBQyxNQUFNLENBQUM7UUFDM0QsTUFBTSxJQUFJLEdBQWlCLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxVQUFVLENBQUMsQ0FBQztRQUN0RCxJQUFJLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxVQUFVLEVBQUUsQ0FBQyxDQUFDO1FBQ3RELEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRTtZQUM1QyxNQUFNLENBQUMsR0FBVSxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsRUFBRSxDQUFDO1lBQzVDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDYixLQUFLLElBQUksQ0FBQyxDQUFDLE1BQU0sQ0FBQztTQUNuQjtRQUNELE1BQU0sSUFBSSxHQUFVLGVBQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDcEMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLGNBQWMsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQ3ZELElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDaEIsS0FBSyxJQUFJLElBQUksQ0FBQyxNQUFNLENBQUM7UUFDckIsTUFBTSxDQUFDLEdBQVUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxRQUFRLEVBQUUsQ0FBQztRQUMzQyxLQUFLLElBQUksQ0FBQyxDQUFDLE1BQU0sQ0FBQztRQUNsQixJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ2IsT0FBTyxlQUFNLENBQUMsTUFBTSxDQUFDLElBQUksRUFBRSxLQUFLLENBQUMsQ0FBQztJQUNwQyxDQUFDOztBQXhGSCxzREFnSEM7QUFuRkM7O0dBRUc7QUFDSSxnQ0FBVSxHQUFHLEdBQWtFLEVBQUU7SUFDcEYsT0FBTyxVQUFTLENBQXVCLEVBQUUsQ0FBdUI7UUFDNUQsT0FBTyxlQUFNLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxRQUFRLEVBQUUsRUFBRSxDQUFDLENBQUMsUUFBUSxFQUFFLENBQWEsQ0FBQztJQUNsRSxDQUFDLENBQUE7QUFDTCxDQUFDLENBQUE7QUE4RUg7O0dBRUc7QUFDSCxNQUFhLGlCQUFrQixTQUFRLFNBQVM7SUFrRzlDOzs7OztPQUtHO0lBQ0gsWUFBWSxhQUE0QixTQUFTLEVBQUUsaUJBQW9DLFNBQVM7UUFDOUYsS0FBSyxFQUFFLENBQUM7UUF4R0EsY0FBUyxHQUFHLG1CQUFtQixDQUFDO1FBQ2hDLGFBQVEsR0FBRyx3QkFBWSxDQUFDLFdBQVcsQ0FBQztRQUNwQyxZQUFPLEdBQUcsSUFBSSxDQUFDLFFBQVEsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLHdCQUFZLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQyx3QkFBWSxDQUFDLHFCQUFxQixDQUFDO1FBa0IvRixlQUFVLEdBQWtCLFNBQVMsQ0FBQztRQUN0QyxtQkFBYyxHQUFzQixTQUFTLENBQUM7UUFvRnRELElBQUcsT0FBTyxVQUFVLEtBQUssV0FBVyxFQUFFO1lBQ3BDLElBQUksQ0FBQyxVQUFVLEdBQUcsVUFBVSxDQUFDO1NBQzlCO1FBQ0QsSUFBRyxPQUFPLGNBQWMsS0FBSyxXQUFXLEVBQUU7WUFDdEMsSUFBSSxDQUFDLGNBQWMsR0FBRyxjQUFjLENBQUM7U0FDeEM7SUFDSCxDQUFDO0lBM0dELFNBQVMsQ0FBQyxXQUE4QixLQUFLO1FBQzNDLElBQUksTUFBTSxHQUFVLEtBQUssQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDOUMsdUNBQ0ssTUFBTSxLQUNULFlBQVksRUFBRSxJQUFJLENBQUMsVUFBVSxDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUMsRUFDakQsaUJBQWlCLEVBQUUsSUFBSSxDQUFDLGNBQWMsQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUFDLElBQzNEO0lBQ0gsQ0FBQztJQUFBLENBQUM7SUFDRixXQUFXLENBQUMsTUFBYSxFQUFFLFdBQThCLEtBQUs7UUFDNUQsS0FBSyxDQUFDLFdBQVcsQ0FBQyxNQUFNLEVBQUUsUUFBUSxDQUFDLENBQUM7UUFDcEMsSUFBSSxDQUFDLFVBQVUsR0FBRyxJQUFJLHdCQUFjLEVBQUUsQ0FBQztRQUN2QyxJQUFJLENBQUMsVUFBVSxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsWUFBWSxDQUFDLEVBQUUsUUFBUSxDQUFDLENBQUM7UUFDNUQsSUFBSSxDQUFDLGNBQWMsR0FBRyxJQUFJLDRCQUFrQixFQUFFLENBQUM7UUFDL0MsSUFBSSxDQUFDLGNBQWMsQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLGlCQUFpQixDQUFDLEVBQUUsUUFBUSxDQUFDLENBQUM7SUFDdkUsQ0FBQztJQUtELFVBQVUsQ0FBQyxPQUFlO1FBQ3hCLElBQUcsT0FBTyxLQUFLLENBQUMsSUFBSSxPQUFPLEtBQUssQ0FBQyxFQUFFO1lBQ2pDLDBCQUEwQjtZQUN4QixNQUFNLElBQUksS0FBSyxDQUFDLG9GQUFvRixDQUFDLENBQUM7U0FDekc7UUFDRCxJQUFJLENBQUMsUUFBUSxHQUFHLE9BQU8sQ0FBQztRQUN4QixJQUFJLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQyxRQUFRLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyx3QkFBWSxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUMsd0JBQVksQ0FBQyxxQkFBcUIsQ0FBQztJQUN0RyxDQUFDO0lBRUQ7O09BRUc7SUFDSCxjQUFjO1FBQ1osT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDO0lBQ3RCLENBQUM7SUFFRDs7T0FFRztJQUNILGVBQWU7UUFDYixJQUFHLElBQUksQ0FBQyxRQUFRLEtBQUssQ0FBQyxFQUFFO1lBQ3RCLE9BQU8sd0JBQVksQ0FBQyxjQUFjLENBQUM7U0FDcEM7YUFBTSxJQUFJLElBQUksQ0FBQyxRQUFRLEtBQUssQ0FBQyxFQUFFO1lBQzlCLE9BQU8sd0JBQVksQ0FBQyx1QkFBdUIsQ0FBQztTQUM3QztJQUNILENBQUM7SUFFRDs7T0FFRztJQUNILGFBQWE7UUFDWCxPQUFPLElBQUksQ0FBQyxVQUFVLENBQUM7SUFDekIsQ0FBQztJQUVEOztPQUVHO0lBQ0gsaUJBQWlCO1FBQ2YsT0FBTyxJQUFJLENBQUMsY0FBYyxDQUFDO0lBQzdCLENBQUM7SUFFRDs7T0FFRztJQUNILFVBQVUsQ0FBQyxLQUFZLEVBQUUsU0FBZ0IsQ0FBQztRQUN4QyxNQUFNLEdBQUcsS0FBSyxDQUFDLFVBQVUsQ0FBQyxLQUFLLEVBQUUsTUFBTSxDQUFDLENBQUM7UUFDekMsSUFBSSxDQUFDLFVBQVUsR0FBRyxJQUFJLHdCQUFjLEVBQUUsQ0FBQztRQUN2QyxNQUFNLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQyxVQUFVLENBQUMsS0FBSyxFQUFFLE1BQU0sQ0FBQyxDQUFDO1FBQ25ELElBQUksQ0FBQyxjQUFjLEdBQUcsSUFBSSw0QkFBa0IsRUFBRSxDQUFDO1FBQy9DLE1BQU0sR0FBRyxJQUFJLENBQUMsY0FBYyxDQUFDLFVBQVUsQ0FBQyxLQUFLLEVBQUUsTUFBTSxDQUFDLENBQUM7UUFDdkQsT0FBTyxNQUFNLENBQUM7SUFDaEIsQ0FBQztJQUVEOztPQUVHO0lBQ0gsUUFBUTtRQUNOLElBQUksU0FBUyxHQUFVLEtBQUssQ0FBQyxRQUFRLEVBQUUsQ0FBQztRQUN4QyxJQUFJLFdBQVcsR0FBVSxJQUFJLENBQUMsVUFBVSxDQUFDLFFBQVEsRUFBRSxDQUFDO1FBQ3BELElBQUksZUFBZSxHQUFVLElBQUksQ0FBQyxjQUFjLENBQUMsUUFBUSxFQUFFLENBQUM7UUFDNUQsSUFBSSxLQUFLLEdBQ1AsU0FBUyxDQUFDLE1BQU07WUFDaEIsV0FBVyxDQUFDLE1BQU07WUFDbEIsZUFBZSxDQUFDLE1BQU0sQ0FBQztRQUV6QixJQUFJLElBQUksR0FBaUI7WUFDdkIsU0FBUztZQUNULFdBQVc7WUFDWCxlQUFlO1NBQ2hCLENBQUM7UUFFRixPQUFPLGVBQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxFQUFDLEtBQUssQ0FBQyxDQUFDO0lBQ25DLENBQUM7Q0FrQkY7QUFsSEQsOENBa0hDO0FBRUQ7O0dBRUc7QUFDSCxNQUFhLGdCQUFpQixTQUFRLFNBQVM7SUErSTdDOzs7Ozs7T0FNRztJQUNILFlBQVksVUFBaUIsU0FBUyxFQUFFLFVBQWlCLFNBQVMsRUFBRSxlQUFtQyxTQUFTO1FBQzlHLEtBQUssRUFBRSxDQUFDO1FBdEpBLGNBQVMsR0FBRyxrQkFBa0IsQ0FBQztRQUMvQixhQUFRLEdBQUcsd0JBQVksQ0FBQyxXQUFXLENBQUM7UUFDcEMsWUFBTyxHQUFHLElBQUksQ0FBQyxRQUFRLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyx3QkFBWSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsd0JBQVksQ0FBQyxvQkFBb0IsQ0FBQztRQXNCN0YsWUFBTyxHQUFVLGVBQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFFakMsaUJBQVksR0FBdUIsRUFBRSxDQUFDO1FBa0JoRDs7V0FFRztRQUNILG9CQUFlLEdBQUcsR0FBVyxFQUFFO1lBQzdCLElBQUcsSUFBSSxDQUFDLFFBQVEsS0FBSyxDQUFDLEVBQUU7Z0JBQ3RCLE9BQU8sd0JBQVksQ0FBQyxhQUFhLENBQUM7YUFDbkM7aUJBQU0sSUFBSSxJQUFJLENBQUMsUUFBUSxLQUFLLENBQUMsRUFBRTtnQkFDOUIsT0FBTyx3QkFBWSxDQUFDLHNCQUFzQixDQUFDO2FBQzVDO1FBQ0gsQ0FBQyxDQUFBO1FBRUQ7O1dBRUc7UUFDSCxlQUFVLEdBQUcsR0FBVSxFQUFFO1lBQ3ZCLE9BQU8sUUFBUSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQzVDLENBQUMsQ0FBQTtRQUVEOztXQUVHO1FBQ0gscUJBQWdCLEdBQUcsR0FBVSxFQUFFO1lBQzdCLElBQUksVUFBVSxHQUFVLGVBQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDeEMsVUFBVSxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsQ0FBQztZQUNqRCxPQUFPLGVBQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQyxVQUFVLEVBQUUsUUFBUSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUN6RSxDQUFDLENBQUE7UUFFRDs7V0FFRztRQUNILG9CQUFlLEdBQUcsR0FBdUIsRUFBRTtZQUN6QyxPQUFPLElBQUksQ0FBQyxZQUFZLENBQUM7UUFDM0IsQ0FBQyxDQUFBO1FBMkVDLElBQUcsT0FBTyxPQUFPLEtBQUssV0FBVyxJQUFJLE9BQU8sT0FBTyxLQUFLLFdBQVcsSUFBSSxZQUFZLENBQUMsTUFBTSxFQUFFO1lBQzFGLElBQUksQ0FBQyxPQUFPLENBQUMsYUFBYSxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ3ZELElBQUksQ0FBQyxPQUFPLEdBQUcsT0FBTyxDQUFDO1lBQ3ZCLElBQUksQ0FBQyxZQUFZLEdBQUcsWUFBWSxDQUFDO1NBQ2xDO0lBQ0gsQ0FBQztJQXhKRCxTQUFTLENBQUMsV0FBOEIsS0FBSztRQUMzQyxJQUFJLE1BQU0sR0FBVSxLQUFLLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQzlDLHVDQUNLLE1BQU0sS0FDVCxTQUFTLEVBQUUsVUFBVSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLFFBQVEsRUFBRSxRQUFRLEVBQUUsZUFBZSxFQUFFLENBQUMsQ0FBQyxFQUNuRixTQUFTLEVBQUUsVUFBVSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLFFBQVEsRUFBRSxRQUFRLEVBQUUsS0FBSyxDQUFDLEVBQ3RFLGNBQWMsRUFBRSxJQUFJLENBQUMsWUFBWSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxJQUNwRTtJQUNILENBQUM7SUFBQSxDQUFDO0lBQ0YsV0FBVyxDQUFDLE1BQWEsRUFBRSxXQUE4QixLQUFLO1FBQzVELEtBQUssQ0FBQyxXQUFXLENBQUMsTUFBTSxFQUFFLFFBQVEsQ0FBQyxDQUFDO1FBQ3BDLElBQUksQ0FBQyxPQUFPLEdBQUcsVUFBVSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLEVBQUUsUUFBUSxFQUFFLGVBQWUsRUFBRSxRQUFRLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDN0YsSUFBSSxDQUFDLE9BQU8sR0FBRyxVQUFVLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsRUFBRSxRQUFRLEVBQUUsS0FBSyxFQUFFLFFBQVEsQ0FBQyxDQUFDO1FBQ2hGLElBQUksQ0FBQyxZQUFZLEdBQUcsTUFBTSxDQUFDLGNBQWMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQVEsRUFBRSxFQUFFO1lBQzFELElBQUksRUFBRSxHQUFnQixJQUFJLHFCQUFZLEVBQUUsQ0FBQztZQUN6QyxFQUFFLENBQUMsV0FBVyxDQUFDLENBQUMsRUFBRSxRQUFRLENBQUMsQ0FBQztZQUM1QixPQUFPLEVBQUUsQ0FBQztRQUNaLENBQUMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztJQU1ELFVBQVUsQ0FBQyxPQUFlO1FBQ3hCLElBQUcsT0FBTyxLQUFLLENBQUMsSUFBSSxPQUFPLEtBQUssQ0FBQyxFQUFFO1lBQ2pDLDBCQUEwQjtZQUN4QixNQUFNLElBQUksS0FBSyxDQUFDLG1GQUFtRixDQUFDLENBQUM7U0FDeEc7UUFDRCxJQUFJLENBQUMsUUFBUSxHQUFHLE9BQU8sQ0FBQztRQUN4QixJQUFJLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQyxRQUFRLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyx3QkFBWSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsd0JBQVksQ0FBQyxvQkFBb0IsQ0FBQztJQUNwRyxDQUFDO0lBRUQ7O09BRUc7SUFDSCxjQUFjO1FBQ1osT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDO0lBQ3RCLENBQUM7SUFvQ0Q7O09BRUc7SUFDSCxVQUFVLENBQUMsS0FBWSxFQUFFLFNBQWdCLENBQUM7UUFDeEMsTUFBTSxHQUFHLEtBQUssQ0FBQyxVQUFVLENBQUMsS0FBSyxFQUFFLE1BQU0sQ0FBQyxDQUFDO1FBQ3pDLElBQUksQ0FBQyxPQUFPLEdBQUcsUUFBUSxDQUFDLFFBQVEsQ0FBQyxLQUFLLEVBQUUsTUFBTSxFQUFFLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQztRQUM1RCxNQUFNLElBQUksQ0FBQyxDQUFDO1FBQ1osSUFBSSxVQUFVLEdBQVUsUUFBUSxDQUFDLFFBQVEsQ0FBQyxLQUFLLEVBQUUsTUFBTSxFQUFFLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDckYsTUFBTSxJQUFJLENBQUMsQ0FBQztRQUNaLElBQUksQ0FBQyxPQUFPLEdBQUcsUUFBUSxDQUFDLFFBQVEsQ0FBQyxLQUFLLEVBQUUsTUFBTSxFQUFFLE1BQU0sR0FBRyxVQUFVLENBQUMsQ0FBQztRQUNyRSxNQUFNLElBQUksVUFBVSxDQUFDO1FBQ3JCLElBQUksVUFBVSxHQUFVLFFBQVEsQ0FBQyxRQUFRLENBQUMsS0FBSyxFQUFFLE1BQU0sRUFBRSxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ3JGLE1BQU0sSUFBSSxDQUFDLENBQUM7UUFDWixJQUFJLENBQUMsWUFBWSxHQUFHLEVBQUUsQ0FBQztRQUN2QixLQUFJLElBQUksQ0FBQyxHQUFVLENBQUMsRUFBRSxDQUFDLEdBQUcsVUFBVSxFQUFFLENBQUMsRUFBRSxFQUFFO1lBQ3pDLElBQUksV0FBVyxHQUFnQixJQUFJLHFCQUFZLEVBQUUsQ0FBQztZQUNsRCxNQUFNLEdBQUcsV0FBVyxDQUFDLFVBQVUsQ0FBQyxLQUFLLEVBQUUsTUFBTSxDQUFDLENBQUM7WUFDL0MsSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUM7U0FDckM7UUFDRCxPQUFPLE1BQU0sQ0FBQztJQUNoQixDQUFDO0lBRUQ7O09BRUc7SUFDSCxRQUFRO1FBQ04sSUFBSSxTQUFTLEdBQVUsS0FBSyxDQUFDLFFBQVEsRUFBRSxDQUFDO1FBQ3hDLElBQUksVUFBVSxHQUFVLGVBQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDeEMsVUFBVSxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsQ0FBQztRQUVqRCxJQUFJLGVBQWUsR0FBVSxlQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQzdDLGVBQWUsQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFFM0QsSUFBSSxLQUFLLEdBQ1AsU0FBUyxDQUFDLE1BQU07WUFDaEIsSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNO1lBQ25CLFVBQVUsQ0FBQyxNQUFNO1lBQ2pCLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTTtZQUNuQixlQUFlLENBQUMsTUFBTSxDQUFDO1FBRXpCLElBQUksSUFBSSxHQUFpQjtZQUN2QixTQUFTO1lBQ1QsSUFBSSxDQUFDLE9BQU87WUFDWixVQUFVO1lBQ1YsSUFBSSxDQUFDLE9BQU87WUFDWixlQUFlO1NBQ2hCLENBQUM7UUFFRixLQUFJLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUU7WUFDaEQsSUFBSSxDQUFDLEdBQVUsSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLEVBQUUsQ0FBQztZQUMvQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ2IsS0FBSyxJQUFJLENBQUMsQ0FBQyxNQUFNLENBQUM7U0FDbkI7UUFFRCxPQUFPLGVBQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxFQUFDLEtBQUssQ0FBQyxDQUFDO0lBQ25DLENBQUM7SUFFRDs7T0FFRztJQUNILFFBQVE7UUFDTixPQUFPLFFBQVEsQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUM7SUFDL0MsQ0FBQztDQWlCRjtBQTlKRCw0Q0E4SkM7QUFFRDs7R0FFRztBQUNILE1BQWEsb0JBQXFCLFNBQVEsU0FBUztJQTRFakQ7Ozs7U0FJSztJQUNMLFlBQVksU0FBMkIsU0FBUztRQUM5QyxLQUFLLEVBQUUsQ0FBQztRQWpGQSxjQUFTLEdBQUcsc0JBQXNCLENBQUM7UUFDbkMsYUFBUSxHQUFHLHdCQUFZLENBQUMsV0FBVyxDQUFDO1FBQ3BDLFlBQU8sR0FBRyxJQUFJLENBQUMsUUFBUSxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsd0JBQVksQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLHdCQUFZLENBQUMsb0JBQW9CLENBQUM7UUE0Q3ZHLGNBQVMsR0FBRyxHQUFxQixFQUFFLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQztRQW9DOUMsSUFBSSxPQUFPLE1BQU0sS0FBSyxXQUFXLEVBQUU7WUFDakMsSUFBSSxDQUFDLE1BQU0sR0FBRyxNQUFNLENBQUM7U0FDdEI7SUFDSCxDQUFDO0lBakZELFNBQVMsQ0FBQyxXQUE4QixLQUFLO1FBQzNDLElBQUksTUFBTSxHQUFVLEtBQUssQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDOUMsdUNBQ0ssTUFBTSxLQUNULFFBQVEsRUFBRSxJQUFJLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUMsSUFDMUM7SUFDSCxDQUFDO0lBQUEsQ0FBQztJQUNGLFdBQVcsQ0FBQyxNQUFhLEVBQUUsV0FBOEIsS0FBSztRQUM1RCxLQUFLLENBQUMsV0FBVyxDQUFDLE1BQU0sRUFBRSxRQUFRLENBQUMsQ0FBQztRQUNwQyxJQUFJLENBQUMsTUFBTSxHQUFHLElBQUksMkJBQWlCLEVBQUUsQ0FBQztRQUN0QyxJQUFJLENBQUMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLEVBQUUsUUFBUSxDQUFDLENBQUM7SUFDdEQsQ0FBQztJQUlELFVBQVUsQ0FBQyxPQUFlO1FBQ3hCLElBQUcsT0FBTyxLQUFLLENBQUMsSUFBSSxPQUFPLEtBQUssQ0FBQyxFQUFFO1lBQ2pDLDBCQUEwQjtZQUN4QixNQUFNLElBQUksS0FBSyxDQUFDLHVGQUF1RixDQUFDLENBQUM7U0FDNUc7UUFDRCxJQUFJLENBQUMsUUFBUSxHQUFHLE9BQU8sQ0FBQztRQUN4QixJQUFJLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQyxRQUFRLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyx3QkFBWSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsd0JBQVksQ0FBQyxvQkFBb0IsQ0FBQztJQUNwRyxDQUFDO0lBRUQ7O09BRUc7SUFDSCxjQUFjO1FBQ1osT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDO0lBQ3RCLENBQUM7SUFFRDs7T0FFRztJQUNILGVBQWU7UUFDYixJQUFHLElBQUksQ0FBQyxRQUFRLEtBQUssQ0FBQyxFQUFFO1lBQ3RCLE9BQU8sd0JBQVksQ0FBQyxhQUFhLENBQUM7U0FDbkM7YUFBTSxJQUFJLElBQUksQ0FBQyxRQUFRLEtBQUssQ0FBQyxFQUFFO1lBQzlCLE9BQU8sd0JBQVksQ0FBQyxzQkFBc0IsQ0FBQztTQUM1QztJQUNILENBQUM7SUFJRDs7U0FFSztJQUNMLFVBQVUsQ0FBQyxLQUFZLEVBQUUsU0FBZ0IsQ0FBQztRQUN4QyxNQUFNLEdBQUcsS0FBSyxDQUFDLFVBQVUsQ0FBQyxLQUFLLEVBQUUsTUFBTSxDQUFDLENBQUM7UUFDekMsSUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLDJCQUFpQixFQUFFLENBQUM7UUFDdEMsT0FBTyxJQUFJLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxLQUFLLEVBQUUsTUFBTSxDQUFDLENBQUM7SUFDL0MsQ0FBQztJQUVEOztTQUVLO0lBQ0wsUUFBUTtRQUNOLE1BQU0sU0FBUyxHQUFVLEtBQUssQ0FBQyxRQUFRLEVBQUUsQ0FBQztRQUMxQyxNQUFNLE9BQU8sR0FBVSxJQUFJLENBQUMsTUFBTSxDQUFDLFFBQVEsRUFBRSxDQUFDO1FBQzlDLE1BQU0sS0FBSyxHQUFVLFNBQVMsQ0FBQyxNQUFNLEdBQUcsT0FBTyxDQUFDLE1BQU0sQ0FBQztRQUN2RCxNQUFNLElBQUksR0FBaUIsQ0FBQyxTQUFTLEVBQUUsT0FBTyxDQUFDLENBQUM7UUFDaEQsT0FBTyxlQUFNLENBQUMsTUFBTSxDQUFDLElBQUksRUFBRSxLQUFLLENBQUMsQ0FBQztJQUNwQyxDQUFDO0lBRUQ7O1NBRUs7SUFDTCxRQUFRO1FBQ04sT0FBTyxRQUFRLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDO0lBQy9DLENBQUM7Q0FhRjtBQXZGRCxvREF1RkM7QUFFRDs7R0FFRztBQUVIOztHQUVHO0FBQ0gsTUFBYSxNQUFPLFNBQVEsZUFBTTtJQTBEaEM7O1NBRUs7SUFDTDtRQUNFLEtBQUssRUFBRSxDQUFDO1FBN0RBLGNBQVMsR0FBRyxRQUFRLENBQUM7UUFDckIsWUFBTyxHQUFHLFNBQVMsQ0FBQztRQUU5Qiw4Q0FBOEM7UUFFcEMsVUFBSyxHQUFHLGVBQU0sQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLENBQUM7UUFDekIsVUFBSyxHQUFHLEVBQUUsQ0FBQztJQXdEckIsQ0FBQztJQWhERDs7U0FFSztJQUNMLFFBQVE7UUFDTixPQUFPLFFBQVEsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUM7SUFDOUMsQ0FBQztJQUVEOzs7Ozs7U0FNSztJQUNMLFVBQVUsQ0FBQyxNQUFhO1FBQ3RCLE1BQU0sVUFBVSxHQUFVLFFBQVEsQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDdkQsSUFBSSxVQUFVLENBQUMsTUFBTSxLQUFLLEVBQUUsSUFBSSxRQUFRLENBQUMsZ0JBQWdCLENBQUMsVUFBVSxDQUFDLEVBQUU7WUFDckUsTUFBTSxPQUFPLEdBQVUsUUFBUSxDQUFDLFFBQVEsQ0FBQyxVQUFVLEVBQUUsQ0FBQyxFQUFFLFVBQVUsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUM7WUFDL0UsSUFBSSxPQUFPLENBQUMsTUFBTSxLQUFLLEVBQUUsRUFBRTtnQkFDekIsSUFBSSxDQUFDLEtBQUssR0FBRyxPQUFPLENBQUM7YUFDdEI7U0FDRjthQUFNLElBQUksVUFBVSxDQUFDLE1BQU0sS0FBSyxFQUFFLEVBQUU7WUFDbkMsTUFBTSxJQUFJLEtBQUssQ0FBQyx3REFBd0QsQ0FBQyxDQUFDO1NBQzNFO2FBQU0sSUFBSSxVQUFVLENBQUMsTUFBTSxLQUFLLEVBQUUsRUFBRTtZQUNuQyxJQUFJLENBQUMsS0FBSyxHQUFHLFVBQVUsQ0FBQztTQUN6QjthQUFNO1lBQ0wsMEJBQTBCO1lBQzFCLE1BQU0sSUFBSSxLQUFLLENBQUMsNENBQTRDLENBQUMsQ0FBQztTQUMvRDtRQUNELE9BQU8sSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO0lBRXhCLENBQUM7SUFFRCxLQUFLO1FBQ0gsSUFBSSxPQUFPLEdBQVUsSUFBSSxNQUFNLEVBQUUsQ0FBQztRQUNsQyxPQUFPLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDO1FBQ3BDLE9BQU8sT0FBZSxDQUFDO0lBQ3pCLENBQUM7SUFFRCxNQUFNLENBQUMsR0FBRyxJQUFVO1FBQ2xCLE9BQU8sSUFBSSxNQUFNLEVBQVUsQ0FBQztJQUM5QixDQUFDOztBQXhESCx3QkFnRUM7QUF2REM7O0tBRUs7QUFDRSxpQkFBVSxHQUFHLEdBQW9DLEVBQUUsQ0FBQyxDQUFDLENBQVEsRUFBRSxDQUFRLEVBQ2xFLEVBQUUsQ0FBQyxlQUFNLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxRQUFRLEVBQUUsRUFBRSxDQUFDLENBQUMsUUFBUSxFQUFFLENBQWEsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQHBhY2thZ2VEb2N1bWVudGF0aW9uXG4gKiBAbW9kdWxlIEFQSS1BVk0tT3BlcmF0aW9uc1xuICovXG5pbXBvcnQgeyBCdWZmZXIgfSBmcm9tICdidWZmZXIvJztcbmltcG9ydCBCaW5Ub29scyBmcm9tICcuLi8uLi91dGlscy9iaW50b29scyc7XG5pbXBvcnQgeyBBVk1Db25zdGFudHMgfSBmcm9tICcuL2NvbnN0YW50cyc7XG5pbXBvcnQgeyBORlRUcmFuc2Zlck91dHB1dCwgU0VDUE1pbnRPdXRwdXQsIFNFQ1BUcmFuc2Zlck91dHB1dCB9IGZyb20gJy4vb3V0cHV0cyc7XG5pbXBvcnQgeyBOQnl0ZXMgfSBmcm9tICcuLi8uLi9jb21tb24vbmJ5dGVzJztcbmltcG9ydCB7IFNpZ0lkeCB9IGZyb20gJy4uLy4uL2NvbW1vbi9jcmVkZW50aWFscyc7XG5pbXBvcnQgeyBPdXRwdXRPd25lcnMgfSBmcm9tICcuLi8uLi9jb21tb24vb3V0cHV0JztcbmltcG9ydCB7IFNlcmlhbGl6YWJsZSwgU2VyaWFsaXphdGlvbiwgU2VyaWFsaXplZEVuY29kaW5nIH0gZnJvbSAnLi4vLi4vdXRpbHMvc2VyaWFsaXphdGlvbic7XG5pbXBvcnQgeyBvZmYgfSBmcm9tICdwcm9jZXNzJztcblxuY29uc3QgYmludG9vbHMgPSBCaW5Ub29scy5nZXRJbnN0YW5jZSgpO1xuY29uc3Qgc2VyaWFsaXplciA9IFNlcmlhbGl6YXRpb24uZ2V0SW5zdGFuY2UoKTtcblxuLyoqXG4gKiBUYWtlcyBhIGJ1ZmZlciByZXByZXNlbnRpbmcgdGhlIG91dHB1dCBhbmQgcmV0dXJucyB0aGUgcHJvcGVyIFtbT3BlcmF0aW9uXV0gaW5zdGFuY2UuXG4gKlxuICogQHBhcmFtIG9waWQgQSBudW1iZXIgcmVwcmVzZW50aW5nIHRoZSBvcGVyYXRpb24gSUQgcGFyc2VkIHByaW9yIHRvIHRoZSBieXRlcyBwYXNzZWQgaW5cbiAqXG4gKiBAcmV0dXJucyBBbiBpbnN0YW5jZSBvZiBhbiBbW09wZXJhdGlvbl1dLWV4dGVuZGVkIGNsYXNzLlxuICovXG5leHBvcnQgY29uc3QgU2VsZWN0T3BlcmF0aW9uQ2xhc3MgPSAob3BpZDpudW1iZXIsIC4uLmFyZ3M6QXJyYXk8YW55Pik6T3BlcmF0aW9uID0+IHtcbiAgICBpZihvcGlkID09PSBBVk1Db25zdGFudHMuU0VDUE1JTlRPUElEIHx8IG9waWQgPT09IEFWTUNvbnN0YW50cy5TRUNQTUlOVE9QSURfQ09ERUNPTkUpIHtcbiAgICAgIHJldHVybiBuZXcgU0VDUE1pbnRPcGVyYXRpb24oLi4uYXJncyk7XG4gICAgfSBlbHNlIGlmKG9waWQgPT09IEFWTUNvbnN0YW50cy5ORlRNSU5UT1BJRCB8fCBvcGlkID09PSBBVk1Db25zdGFudHMuTkZUTUlOVE9QSURfQ09ERUNPTkUpe1xuICAgICAgcmV0dXJuIG5ldyBORlRNaW50T3BlcmF0aW9uKC4uLmFyZ3MpO1xuICAgIH0gZWxzZSBpZihvcGlkID09PSBBVk1Db25zdGFudHMuTkZUWEZFUk9QSUQgfHwgb3BpZCA9PT0gQVZNQ29uc3RhbnRzLk5GVFhGRVJPUElEX0NPREVDT05FKXtcbiAgICAgIHJldHVybiBuZXcgTkZUVHJhbnNmZXJPcGVyYXRpb24oLi4uYXJncyk7XG4gICAgfVxuICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXG4gICAgdGhyb3cgbmV3IEVycm9yKFwiRXJyb3IgLSBTZWxlY3RPcGVyYXRpb25DbGFzczogdW5rbm93biBvcGlkIFwiICsgb3BpZCk7XG59XG5cbi8qKlxuICogQSBjbGFzcyByZXByZXNlbnRpbmcgYW4gb3BlcmF0aW9uLiBBbGwgb3BlcmF0aW9uIHR5cGVzIG11c3QgZXh0ZW5kIG9uIHRoaXMgY2xhc3MuXG4gKi9cbmV4cG9ydCBhYnN0cmFjdCBjbGFzcyBPcGVyYXRpb24gZXh0ZW5kcyBTZXJpYWxpemFibGV7XG4gIHByb3RlY3RlZCBfdHlwZU5hbWUgPSBcIk9wZXJhdGlvblwiO1xuICBwcm90ZWN0ZWQgX3R5cGVJRCA9IHVuZGVmaW5lZDtcblxuICBzZXJpYWxpemUoZW5jb2Rpbmc6U2VyaWFsaXplZEVuY29kaW5nID0gXCJoZXhcIik6b2JqZWN0IHtcbiAgICBsZXQgZmllbGRzOm9iamVjdCA9IHN1cGVyLnNlcmlhbGl6ZShlbmNvZGluZyk7XG4gICAgcmV0dXJuIHtcbiAgICAgIC4uLmZpZWxkcyxcbiAgICAgIFwic2lnSWR4c1wiOiB0aGlzLnNpZ0lkeHMubWFwKChzKSA9PiBzLnNlcmlhbGl6ZShlbmNvZGluZykpXG4gICAgfVxuICB9O1xuICBkZXNlcmlhbGl6ZShmaWVsZHM6b2JqZWN0LCBlbmNvZGluZzpTZXJpYWxpemVkRW5jb2RpbmcgPSBcImhleFwiKSB7XG4gICAgc3VwZXIuZGVzZXJpYWxpemUoZmllbGRzLCBlbmNvZGluZyk7XG4gICAgdGhpcy5zaWdJZHhzID0gZmllbGRzW1wic2lnSWR4c1wiXS5tYXAoKHM6b2JqZWN0KSA9PiB7XG4gICAgICBsZXQgc2lkeDpTaWdJZHggPSBuZXcgU2lnSWR4KCk7XG4gICAgICBzaWR4LmRlc2VyaWFsaXplKHMsIGVuY29kaW5nKTtcbiAgICAgIHJldHVybiBzaWR4O1xuICAgIH0pO1xuICAgIHRoaXMuc2lnQ291bnQud3JpdGVVSW50MzJCRSh0aGlzLnNpZ0lkeHMubGVuZ3RoLCAwKTtcbiAgfVxuXG4gIHByb3RlY3RlZCBzaWdDb3VudDpCdWZmZXIgPSBCdWZmZXIuYWxsb2MoNCk7XG4gIHByb3RlY3RlZCBzaWdJZHhzOkFycmF5PFNpZ0lkeD4gPSBbXTsgLy8gaWR4cyBvZiBzaWduZXJzIGZyb20gdXR4b1xuXG4gIHN0YXRpYyBjb21wYXJhdG9yID0gKCk6KGE6T3BlcmF0aW9uLCBiOk9wZXJhdGlvbikgPT4gKDF8LTF8MCkgPT4gKGE6T3BlcmF0aW9uLCBiOk9wZXJhdGlvbik6KDF8LTF8MCkgPT4ge1xuICAgIGNvbnN0IGFvdXRpZDpCdWZmZXIgPSBCdWZmZXIuYWxsb2MoNCk7XG4gICAgYW91dGlkLndyaXRlVUludDMyQkUoYS5nZXRPcGVyYXRpb25JRCgpLCAwKTtcbiAgICBjb25zdCBhYnVmZjpCdWZmZXIgPSBhLnRvQnVmZmVyKCk7XG5cbiAgICBjb25zdCBib3V0aWQ6QnVmZmVyID0gQnVmZmVyLmFsbG9jKDQpO1xuICAgIGJvdXRpZC53cml0ZVVJbnQzMkJFKGIuZ2V0T3BlcmF0aW9uSUQoKSwgMCk7XG4gICAgY29uc3QgYmJ1ZmY6QnVmZmVyID0gYi50b0J1ZmZlcigpO1xuXG4gICAgY29uc3QgYXNvcnQ6QnVmZmVyID0gQnVmZmVyLmNvbmNhdChbYW91dGlkLCBhYnVmZl0sIGFvdXRpZC5sZW5ndGggKyBhYnVmZi5sZW5ndGgpO1xuICAgIGNvbnN0IGJzb3J0OkJ1ZmZlciA9IEJ1ZmZlci5jb25jYXQoW2JvdXRpZCwgYmJ1ZmZdLCBib3V0aWQubGVuZ3RoICsgYmJ1ZmYubGVuZ3RoKTtcbiAgICByZXR1cm4gQnVmZmVyLmNvbXBhcmUoYXNvcnQsIGJzb3J0KSBhcyAoMXwtMXwwKTtcbiAgfTtcblxuICBhYnN0cmFjdCBnZXRPcGVyYXRpb25JRCgpOm51bWJlcjtcblxuICAvKipcbiAgICAgKiBSZXR1cm5zIHRoZSBhcnJheSBvZiBbW1NpZ0lkeF1dIGZvciB0aGlzIFtbT3BlcmF0aW9uXV1cbiAgICAgKi9cbiAgZ2V0U2lnSWR4cyA9ICgpOkFycmF5PFNpZ0lkeD4gPT4gdGhpcy5zaWdJZHhzO1xuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSBjcmVkZW50aWFsIElELlxuICAgKi9cbiAgYWJzdHJhY3QgZ2V0Q3JlZGVudGlhbElEKCk6bnVtYmVyO1xuXG4gIC8qKlxuICAgICAqIENyZWF0ZXMgYW5kIGFkZHMgYSBbW1NpZ0lkeF1dIHRvIHRoZSBbW09wZXJhdGlvbl1dLlxuICAgICAqXG4gICAgICogQHBhcmFtIGFkZHJlc3NJZHggVGhlIGluZGV4IG9mIHRoZSBhZGRyZXNzIHRvIHJlZmVyZW5jZSBpbiB0aGUgc2lnbmF0dXJlc1xuICAgICAqIEBwYXJhbSBhZGRyZXNzIFRoZSBhZGRyZXNzIG9mIHRoZSBzb3VyY2Ugb2YgdGhlIHNpZ25hdHVyZVxuICAgICAqL1xuICBhZGRTaWduYXR1cmVJZHggPSAoYWRkcmVzc0lkeDpudW1iZXIsIGFkZHJlc3M6QnVmZmVyKSA9PiB7XG4gICAgY29uc3Qgc2lnaWR4OlNpZ0lkeCA9IG5ldyBTaWdJZHgoKTtcbiAgICBjb25zdCBiOkJ1ZmZlciA9IEJ1ZmZlci5hbGxvYyg0KTtcbiAgICBiLndyaXRlVUludDMyQkUoYWRkcmVzc0lkeCwgMCk7XG4gICAgc2lnaWR4LmZyb21CdWZmZXIoYik7XG4gICAgc2lnaWR4LnNldFNvdXJjZShhZGRyZXNzKTtcbiAgICB0aGlzLnNpZ0lkeHMucHVzaChzaWdpZHgpO1xuICAgIHRoaXMuc2lnQ291bnQud3JpdGVVSW50MzJCRSh0aGlzLnNpZ0lkeHMubGVuZ3RoLCAwKTtcbiAgfTtcblxuICBmcm9tQnVmZmVyKGJ5dGVzOkJ1ZmZlciwgb2Zmc2V0Om51bWJlciA9IDApOm51bWJlciB7XG4gICAgdGhpcy5zaWdDb3VudCA9IGJpbnRvb2xzLmNvcHlGcm9tKGJ5dGVzLCBvZmZzZXQsIG9mZnNldCArIDQpO1xuICAgIG9mZnNldCArPSA0O1xuICAgIGNvbnN0IHNpZ0NvdW50Om51bWJlciA9IHRoaXMuc2lnQ291bnQucmVhZFVJbnQzMkJFKDApO1xuICAgIHRoaXMuc2lnSWR4cyA9IFtdO1xuICAgIGZvciAobGV0IGk6bnVtYmVyID0gMDsgaSA8IHNpZ0NvdW50OyBpKyspIHtcbiAgICAgIGNvbnN0IHNpZ2lkeDpTaWdJZHggPSBuZXcgU2lnSWR4KCk7XG4gICAgICBjb25zdCBzaWdidWZmOkJ1ZmZlciA9IGJpbnRvb2xzLmNvcHlGcm9tKGJ5dGVzLCBvZmZzZXQsIG9mZnNldCArIDQpO1xuICAgICAgc2lnaWR4LmZyb21CdWZmZXIoc2lnYnVmZik7XG4gICAgICBvZmZzZXQgKz0gNDtcbiAgICAgIHRoaXMuc2lnSWR4cy5wdXNoKHNpZ2lkeCk7XG4gICAgfVxuICAgIHJldHVybiBvZmZzZXQ7XG4gIH1cblxuICB0b0J1ZmZlcigpOkJ1ZmZlciB7XG4gICAgdGhpcy5zaWdDb3VudC53cml0ZVVJbnQzMkJFKHRoaXMuc2lnSWR4cy5sZW5ndGgsIDApO1xuICAgIGxldCBic2l6ZTpudW1iZXIgPSB0aGlzLnNpZ0NvdW50Lmxlbmd0aDtcbiAgICBjb25zdCBiYXJyOkFycmF5PEJ1ZmZlcj4gPSBbdGhpcy5zaWdDb3VudF07XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLnNpZ0lkeHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IGI6QnVmZmVyID0gdGhpcy5zaWdJZHhzW2ldLnRvQnVmZmVyKCk7XG4gICAgICBiYXJyLnB1c2goYik7XG4gICAgICBic2l6ZSArPSBiLmxlbmd0aDtcbiAgICB9XG4gICAgcmV0dXJuIEJ1ZmZlci5jb25jYXQoYmFyciwgYnNpemUpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgYSBiYXNlLTU4IHN0cmluZyByZXByZXNlbnRpbmcgdGhlIFtbTkZUTWludE9wZXJhdGlvbl1dLlxuICAgKi9cbiAgdG9TdHJpbmcoKTpzdHJpbmcge1xuICAgIHJldHVybiBiaW50b29scy5idWZmZXJUb0I1OCh0aGlzLnRvQnVmZmVyKCkpO1xuICB9XG5cbn1cblxuLyoqXG4gKiBBIGNsYXNzIHdoaWNoIGNvbnRhaW5zIGFuIFtbT3BlcmF0aW9uXV0gZm9yIHRyYW5zZmVycy5cbiAqXG4gKi9cbmV4cG9ydCBjbGFzcyBUcmFuc2ZlcmFibGVPcGVyYXRpb24gZXh0ZW5kcyBTZXJpYWxpemFibGUge1xuICBwcm90ZWN0ZWQgX3R5cGVOYW1lID0gXCJUcmFuc2ZlcmFibGVPcGVyYXRpb25cIjtcbiAgcHJvdGVjdGVkIF90eXBlSUQgPSB1bmRlZmluZWQ7XG5cbiAgc2VyaWFsaXplKGVuY29kaW5nOlNlcmlhbGl6ZWRFbmNvZGluZyA9IFwiaGV4XCIpOm9iamVjdCB7XG4gICAgbGV0IGZpZWxkczpvYmplY3QgPSBzdXBlci5zZXJpYWxpemUoZW5jb2RpbmcpO1xuICAgIHJldHVybiB7XG4gICAgICAuLi5maWVsZHMsXG4gICAgICBcImFzc2V0aWRcIjogc2VyaWFsaXplci5lbmNvZGVyKHRoaXMuYXNzZXRpZCwgZW5jb2RpbmcsIFwiQnVmZmVyXCIsIFwiY2I1OFwiLCAzMiksXG4gICAgICBcInV0eG9JRHNcIjogdGhpcy51dHhvSURzLm1hcCgodSkgPT4gdS5zZXJpYWxpemUoZW5jb2RpbmcpKSxcbiAgICAgIFwib3BlcmF0aW9uXCI6IHRoaXMub3BlcmF0aW9uLnNlcmlhbGl6ZShlbmNvZGluZylcbiAgICB9XG4gIH07XG4gIGRlc2VyaWFsaXplKGZpZWxkczpvYmplY3QsIGVuY29kaW5nOlNlcmlhbGl6ZWRFbmNvZGluZyA9IFwiaGV4XCIpIHtcbiAgICBzdXBlci5kZXNlcmlhbGl6ZShmaWVsZHMsIGVuY29kaW5nKTtcbiAgICB0aGlzLmFzc2V0aWQgPSBzZXJpYWxpemVyLmRlY29kZXIoZmllbGRzW1wiYXNzZXRpZFwiXSwgZW5jb2RpbmcsIFwiY2I1OFwiLCBcIkJ1ZmZlclwiLCAzMik7XG4gICAgdGhpcy51dHhvSURzID0gZmllbGRzW1widXR4b0lEc1wiXS5tYXAoKHU6b2JqZWN0KSA9PiB7XG4gICAgICBsZXQgdXR4b2lkOlVUWE9JRCA9IG5ldyBVVFhPSUQoKTtcbiAgICAgIHV0eG9pZC5kZXNlcmlhbGl6ZSh1LCBlbmNvZGluZyk7XG4gICAgICByZXR1cm4gdXR4b2lkO1xuICAgIH0pO1xuICAgIHRoaXMub3BlcmF0aW9uID0gU2VsZWN0T3BlcmF0aW9uQ2xhc3MoZmllbGRzW1wib3BlcmF0aW9uXCJdW1wiX3R5cGVJRFwiXSk7XG4gICAgdGhpcy5vcGVyYXRpb24uZGVzZXJpYWxpemUoZmllbGRzW1wib3BlcmF0aW9uXCJdLCBlbmNvZGluZyk7XG4gIH1cblxuICBwcm90ZWN0ZWQgYXNzZXRpZDpCdWZmZXIgPSBCdWZmZXIuYWxsb2MoMzIpO1xuICBwcm90ZWN0ZWQgdXR4b0lEczpBcnJheTxVVFhPSUQ+ID0gW107XG4gIHByb3RlY3RlZCBvcGVyYXRpb246T3BlcmF0aW9uO1xuXG4gIC8qKlxuICAgKiBSZXR1cm5zIGEgZnVuY3Rpb24gdXNlZCB0byBzb3J0IGFuIGFycmF5IG9mIFtbVHJhbnNmZXJhYmxlT3BlcmF0aW9uXV1zXG4gICAqL1xuICBzdGF0aWMgY29tcGFyYXRvciA9ICgpOihhOlRyYW5zZmVyYWJsZU9wZXJhdGlvbiwgYjpUcmFuc2ZlcmFibGVPcGVyYXRpb24pID0+ICgxfC0xfDApID0+IHtcbiAgICAgIHJldHVybiBmdW5jdGlvbihhOlRyYW5zZmVyYWJsZU9wZXJhdGlvbiwgYjpUcmFuc2ZlcmFibGVPcGVyYXRpb24pOigxfC0xfDApIHsgXG4gICAgICAgICAgcmV0dXJuIEJ1ZmZlci5jb21wYXJlKGEudG9CdWZmZXIoKSwgYi50b0J1ZmZlcigpKSBhcyAoMXwtMXwwKTtcbiAgICAgIH1cbiAgfVxuICAvKipcbiAgICogUmV0dXJucyB0aGUgYXNzZXRJRCBhcyBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9LlxuICAgKi9cbiAgZ2V0QXNzZXRJRCA9ICgpOkJ1ZmZlciA9PiB0aGlzLmFzc2V0aWQ7XG5cbiAgLyoqXG4gICAqIFJldHVybnMgYW4gYXJyYXkgb2YgVVRYT0lEcyBpbiB0aGlzIG9wZXJhdGlvbi5cbiAgICovXG4gIGdldFVUWE9JRHMgPSAoKTpBcnJheTxVVFhPSUQ+ID0+IHRoaXMudXR4b0lEcztcblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgb3BlcmF0aW9uXG4gICAqL1xuICBnZXRPcGVyYXRpb24gPSAoKTpPcGVyYXRpb24gPT4gdGhpcy5vcGVyYXRpb247XG5cbiAgZnJvbUJ1ZmZlcihieXRlczpCdWZmZXIsIG9mZnNldDpudW1iZXIgPSAwKTpudW1iZXIge1xuICAgIHRoaXMuYXNzZXRpZCA9IGJpbnRvb2xzLmNvcHlGcm9tKGJ5dGVzLCBvZmZzZXQsIG9mZnNldCArIDMyKTtcbiAgICBvZmZzZXQgKz0gMzI7XG4gICAgY29uc3QgbnVtdXR4b0lEczpudW1iZXIgPSBiaW50b29scy5jb3B5RnJvbShieXRlcywgb2Zmc2V0LCBvZmZzZXQgKyA0KS5yZWFkVUludDMyQkUoMCk7XG4gICAgb2Zmc2V0ICs9IDQ7XG4gICAgdGhpcy51dHhvSURzID0gW107XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBudW11dHhvSURzOyBpKyspIHtcbiAgICAgIGNvbnN0IHV0eG9pZDpVVFhPSUQgPSBuZXcgVVRYT0lEKCk7XG4gICAgICBvZmZzZXQgPSB1dHhvaWQuZnJvbUJ1ZmZlcihieXRlcywgb2Zmc2V0KTtcbiAgICAgIHRoaXMudXR4b0lEcy5wdXNoKHV0eG9pZCk7XG4gICAgfVxuICAgIGNvbnN0IG9waWQ6bnVtYmVyID0gYmludG9vbHMuY29weUZyb20oYnl0ZXMsIG9mZnNldCwgb2Zmc2V0ICsgNCkucmVhZFVJbnQzMkJFKDApO1xuICAgIG9mZnNldCArPSA0O1xuICAgIHRoaXMub3BlcmF0aW9uID0gU2VsZWN0T3BlcmF0aW9uQ2xhc3Mob3BpZCk7XG4gICAgcmV0dXJuIHRoaXMub3BlcmF0aW9uLmZyb21CdWZmZXIoYnl0ZXMsIG9mZnNldCk7XG4gIH1cblxuICB0b0J1ZmZlcigpOkJ1ZmZlciB7XG4gICAgY29uc3QgbnVtdXR4b0lEcyA9IEJ1ZmZlci5hbGxvYyg0KTtcbiAgICBudW11dHhvSURzLndyaXRlVUludDMyQkUodGhpcy51dHhvSURzLmxlbmd0aCwgMCk7XG4gICAgbGV0IGJzaXplOm51bWJlciA9IHRoaXMuYXNzZXRpZC5sZW5ndGggKyBudW11dHhvSURzLmxlbmd0aDtcbiAgICBjb25zdCBiYXJyOkFycmF5PEJ1ZmZlcj4gPSBbdGhpcy5hc3NldGlkLCBudW11dHhvSURzXTtcbiAgICB0aGlzLnV0eG9JRHMgPSB0aGlzLnV0eG9JRHMuc29ydChVVFhPSUQuY29tcGFyYXRvcigpKTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMudXR4b0lEcy5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3QgYjpCdWZmZXIgPSB0aGlzLnV0eG9JRHNbaV0udG9CdWZmZXIoKTtcbiAgICAgIGJhcnIucHVzaChiKTtcbiAgICAgIGJzaXplICs9IGIubGVuZ3RoO1xuICAgIH1cbiAgICBjb25zdCBvcGlkOkJ1ZmZlciA9IEJ1ZmZlci5hbGxvYyg0KTtcbiAgICBvcGlkLndyaXRlVUludDMyQkUodGhpcy5vcGVyYXRpb24uZ2V0T3BlcmF0aW9uSUQoKSwgMCk7XG4gICAgYmFyci5wdXNoKG9waWQpO1xuICAgIGJzaXplICs9IG9waWQubGVuZ3RoO1xuICAgIGNvbnN0IGI6QnVmZmVyID0gdGhpcy5vcGVyYXRpb24udG9CdWZmZXIoKTtcbiAgICBic2l6ZSArPSBiLmxlbmd0aDtcbiAgICBiYXJyLnB1c2goYik7XG4gICAgcmV0dXJuIEJ1ZmZlci5jb25jYXQoYmFyciwgYnNpemUpO1xuICB9XG5cbiAgY29uc3RydWN0b3IoYXNzZXRpZDpCdWZmZXIgPSB1bmRlZmluZWQsIHV0eG9pZHM6QXJyYXk8VVRYT0lEfHN0cmluZ3xCdWZmZXI+ID0gdW5kZWZpbmVkLCBvcGVyYXRpb246T3BlcmF0aW9uID0gdW5kZWZpbmVkKSB7XG4gICAgc3VwZXIoKTtcbiAgICBpZiAoXG4gICAgICB0eXBlb2YgYXNzZXRpZCAhPT0gJ3VuZGVmaW5lZCcgJiYgYXNzZXRpZC5sZW5ndGggPT09IEFWTUNvbnN0YW50cy5BU1NFVElETEVOXG4gICAgICAgICAgICAmJiBvcGVyYXRpb24gaW5zdGFuY2VvZiBPcGVyYXRpb24gJiYgdHlwZW9mIHV0eG9pZHMgIT09ICd1bmRlZmluZWQnXG4gICAgICAgICAgICAmJiBBcnJheS5pc0FycmF5KHV0eG9pZHMpXG4gICAgKSB7XG4gICAgICB0aGlzLmFzc2V0aWQgPSBhc3NldGlkO1xuICAgICAgdGhpcy5vcGVyYXRpb24gPSBvcGVyYXRpb247XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHV0eG9pZHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgY29uc3QgdXR4b2lkOlVUWE9JRCA9IG5ldyBVVFhPSUQoKTtcbiAgICAgICAgaWYgKHR5cGVvZiB1dHhvaWRzW2ldID09PSAnc3RyaW5nJykge1xuICAgICAgICAgIHV0eG9pZC5mcm9tU3RyaW5nKHV0eG9pZHNbaV0gYXMgc3RyaW5nKTtcbiAgICAgICAgfSBlbHNlIGlmICh1dHhvaWRzW2ldIGluc3RhbmNlb2YgQnVmZmVyKSB7XG4gICAgICAgICAgdXR4b2lkLmZyb21CdWZmZXIodXR4b2lkc1tpXSBhcyBCdWZmZXIpO1xuICAgICAgICB9IGVsc2UgaWYgKHV0eG9pZHNbaV0gaW5zdGFuY2VvZiBVVFhPSUQpIHtcbiAgICAgICAgICB1dHhvaWQuZnJvbVN0cmluZyh1dHhvaWRzW2ldLnRvU3RyaW5nKCkpOyAvLyBjbG9uZVxuICAgICAgICB9XG4gICAgICAgIHRoaXMudXR4b0lEcy5wdXNoKHV0eG9pZCk7XG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogQW4gW1tPcGVyYXRpb25dXSBjbGFzcyB3aGljaCBzcGVjaWZpZXMgYSBTRUNQMjU2azEgTWludCBPcC5cbiAqL1xuZXhwb3J0IGNsYXNzIFNFQ1BNaW50T3BlcmF0aW9uIGV4dGVuZHMgT3BlcmF0aW9uIHtcbiAgcHJvdGVjdGVkIF90eXBlTmFtZSA9IFwiU0VDUE1pbnRPcGVyYXRpb25cIjtcbiAgcHJvdGVjdGVkIF9jb2RlY0lEID0gQVZNQ29uc3RhbnRzLkxBVEVTVENPREVDO1xuICBwcm90ZWN0ZWQgX3R5cGVJRCA9IHRoaXMuX2NvZGVjSUQgPT09IDAgPyBBVk1Db25zdGFudHMuU0VDUE1JTlRPUElEIDogQVZNQ29uc3RhbnRzLlNFQ1BNSU5UT1BJRF9DT0RFQ09ORTtcblxuICBzZXJpYWxpemUoZW5jb2Rpbmc6U2VyaWFsaXplZEVuY29kaW5nID0gXCJoZXhcIik6b2JqZWN0IHtcbiAgICBsZXQgZmllbGRzOm9iamVjdCA9IHN1cGVyLnNlcmlhbGl6ZShlbmNvZGluZyk7XG4gICAgcmV0dXJuIHtcbiAgICAgIC4uLmZpZWxkcyxcbiAgICAgIFwibWludE91dHB1dFwiOiB0aGlzLm1pbnRPdXRwdXQuc2VyaWFsaXplKGVuY29kaW5nKSxcbiAgICAgIFwidHJhbnNmZXJPdXRwdXRzXCI6IHRoaXMudHJhbnNmZXJPdXRwdXQuc2VyaWFsaXplKGVuY29kaW5nKVxuICAgIH1cbiAgfTtcbiAgZGVzZXJpYWxpemUoZmllbGRzOm9iamVjdCwgZW5jb2Rpbmc6U2VyaWFsaXplZEVuY29kaW5nID0gXCJoZXhcIikge1xuICAgIHN1cGVyLmRlc2VyaWFsaXplKGZpZWxkcywgZW5jb2RpbmcpO1xuICAgIHRoaXMubWludE91dHB1dCA9IG5ldyBTRUNQTWludE91dHB1dCgpO1xuICAgIHRoaXMubWludE91dHB1dC5kZXNlcmlhbGl6ZShmaWVsZHNbXCJtaW50T3V0cHV0XCJdLCBlbmNvZGluZyk7XG4gICAgdGhpcy50cmFuc2Zlck91dHB1dCA9IG5ldyBTRUNQVHJhbnNmZXJPdXRwdXQoKTtcbiAgICB0aGlzLnRyYW5zZmVyT3V0cHV0LmRlc2VyaWFsaXplKGZpZWxkc1tcInRyYW5zZmVyT3V0cHV0c1wiXSwgZW5jb2RpbmcpO1xuICB9XG5cbiAgcHJvdGVjdGVkIG1pbnRPdXRwdXQ6U0VDUE1pbnRPdXRwdXQgPSB1bmRlZmluZWQ7XG4gIHByb3RlY3RlZCB0cmFuc2Zlck91dHB1dDpTRUNQVHJhbnNmZXJPdXRwdXQgPSB1bmRlZmluZWQ7XG5cbiAgc2V0Q29kZWNJRChjb2RlY0lEOiBudW1iZXIpOiB2b2lkIHtcbiAgICBpZihjb2RlY0lEICE9PSAwICYmIGNvZGVjSUQgIT09IDEpIHtcbiAgICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIkVycm9yIC0gU0VDUE1pbnRPcGVyYXRpb24uc2V0Q29kZWNJRDogaW52YWxpZCBjb2RlY0lELiBWYWxpZCBjb2RlY0lEcyBhcmUgMCBhbmQgMS5cIik7XG4gICAgfVxuICAgIHRoaXMuX2NvZGVjSUQgPSBjb2RlY0lEO1xuICAgIHRoaXMuX3R5cGVJRCA9IHRoaXMuX2NvZGVjSUQgPT09IDAgPyBBVk1Db25zdGFudHMuU0VDUE1JTlRPUElEIDogQVZNQ29uc3RhbnRzLlNFQ1BNSU5UT1BJRF9DT0RFQ09ORTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSBvcGVyYXRpb24gSUQuXG4gICAqL1xuICBnZXRPcGVyYXRpb25JRCgpOm51bWJlciB7XG4gICAgcmV0dXJuIHRoaXMuX3R5cGVJRDtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSBjcmVkZW50aWFsIElELlxuICAgKi9cbiAgZ2V0Q3JlZGVudGlhbElEICgpOiBudW1iZXIge1xuICAgIGlmKHRoaXMuX2NvZGVjSUQgPT09IDApIHtcbiAgICAgIHJldHVybiBBVk1Db25zdGFudHMuU0VDUENSRURFTlRJQUw7XG4gICAgfSBlbHNlIGlmICh0aGlzLl9jb2RlY0lEID09PSAxKSB7XG4gICAgICByZXR1cm4gQVZNQ29uc3RhbnRzLlNFQ1BDUkVERU5USUFMX0NPREVDT05FO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSBbW1NFQ1BNaW50T3V0cHV0XV0gdG8gYmUgcHJvZHVjZWQgYnkgdGhpcyBvcGVyYXRpb24uXG4gICAqL1xuICBnZXRNaW50T3V0cHV0KCk6U0VDUE1pbnRPdXRwdXQge1xuICAgIHJldHVybiB0aGlzLm1pbnRPdXRwdXQ7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyBbW1NFQ1BUcmFuc2Zlck91dHB1dF1dIHRvIGJlIHByb2R1Y2VkIGJ5IHRoaXMgb3BlcmF0aW9uLlxuICAgKi9cbiAgZ2V0VHJhbnNmZXJPdXRwdXQoKTpTRUNQVHJhbnNmZXJPdXRwdXQge1xuICAgIHJldHVybiB0aGlzLnRyYW5zZmVyT3V0cHV0O1xuICB9XG5cbiAgLyoqXG4gICAqIFBvcHVhdGVzIHRoZSBpbnN0YW5jZSBmcm9tIGEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0gcmVwcmVzZW50aW5nIHRoZSBbW1NFQ1BNaW50T3BlcmF0aW9uXV0gYW5kIHJldHVybnMgdGhlIHVwZGF0ZWQgb2Zmc2V0LlxuICAgKi9cbiAgZnJvbUJ1ZmZlcihieXRlczpCdWZmZXIsIG9mZnNldDpudW1iZXIgPSAwKTpudW1iZXIge1xuICAgIG9mZnNldCA9IHN1cGVyLmZyb21CdWZmZXIoYnl0ZXMsIG9mZnNldCk7XG4gICAgdGhpcy5taW50T3V0cHV0ID0gbmV3IFNFQ1BNaW50T3V0cHV0KCk7XG4gICAgb2Zmc2V0ID0gdGhpcy5taW50T3V0cHV0LmZyb21CdWZmZXIoYnl0ZXMsIG9mZnNldCk7XG4gICAgdGhpcy50cmFuc2Zlck91dHB1dCA9IG5ldyBTRUNQVHJhbnNmZXJPdXRwdXQoKTtcbiAgICBvZmZzZXQgPSB0aGlzLnRyYW5zZmVyT3V0cHV0LmZyb21CdWZmZXIoYnl0ZXMsIG9mZnNldCk7XG4gICAgcmV0dXJuIG9mZnNldDtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSBidWZmZXIgcmVwcmVzZW50aW5nIHRoZSBbW1NFQ1BNaW50T3BlcmF0aW9uXV0gaW5zdGFuY2UuXG4gICAqL1xuICB0b0J1ZmZlcigpOkJ1ZmZlciB7XG4gICAgbGV0IHN1cGVyYnVmZjpCdWZmZXIgPSBzdXBlci50b0J1ZmZlcigpO1xuICAgIGxldCBtaW50b3V0QnVmZjpCdWZmZXIgPSB0aGlzLm1pbnRPdXRwdXQudG9CdWZmZXIoKTtcbiAgICBsZXQgdHJhbnNmZXJPdXRCdWZmOkJ1ZmZlciA9IHRoaXMudHJhbnNmZXJPdXRwdXQudG9CdWZmZXIoKTtcbiAgICBsZXQgYnNpemU6bnVtYmVyID0gXG4gICAgICBzdXBlcmJ1ZmYubGVuZ3RoICsgXG4gICAgICBtaW50b3V0QnVmZi5sZW5ndGggKyBcbiAgICAgIHRyYW5zZmVyT3V0QnVmZi5sZW5ndGg7IFxuXG4gICAgbGV0IGJhcnI6QXJyYXk8QnVmZmVyPiA9IFtcbiAgICAgIHN1cGVyYnVmZiwgXG4gICAgICBtaW50b3V0QnVmZixcbiAgICAgIHRyYW5zZmVyT3V0QnVmZlxuICAgIF07XG5cbiAgICByZXR1cm4gQnVmZmVyLmNvbmNhdChiYXJyLGJzaXplKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBbiBbW09wZXJhdGlvbl1dIGNsYXNzIHdoaWNoIG1pbnRzIG5ldyB0b2tlbnMgb24gYW4gYXNzZXRJRC5cbiAgICogXG4gICAqIEBwYXJhbSBtaW50T3V0cHV0IFRoZSBbW1NFQ1BNaW50T3V0cHV0XV0gdGhhdCB3aWxsIGJlIHByb2R1Y2VkIGJ5IHRoaXMgdHJhbnNhY3Rpb24uXG4gICAqIEBwYXJhbSB0cmFuc2Zlck91dHB1dCBBIFtbU0VDUFRyYW5zZmVyT3V0cHV0XV0gdGhhdCB3aWxsIGJlIHByb2R1Y2VkIGZyb20gdGhpcyBtaW50aW5nIG9wZXJhdGlvbi5cbiAgICovXG4gIGNvbnN0cnVjdG9yKG1pbnRPdXRwdXQ6U0VDUE1pbnRPdXRwdXQgPSB1bmRlZmluZWQsIHRyYW5zZmVyT3V0cHV0OlNFQ1BUcmFuc2Zlck91dHB1dCA9IHVuZGVmaW5lZCl7XG4gICAgc3VwZXIoKTtcbiAgICBpZih0eXBlb2YgbWludE91dHB1dCAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgIHRoaXMubWludE91dHB1dCA9IG1pbnRPdXRwdXQ7XG4gICAgfSBcbiAgICBpZih0eXBlb2YgdHJhbnNmZXJPdXRwdXQgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIHRoaXMudHJhbnNmZXJPdXRwdXQgPSB0cmFuc2Zlck91dHB1dDtcbiAgICB9XG4gIH1cblxufVxuXG4vKipcbiAqIEFuIFtbT3BlcmF0aW9uXV0gY2xhc3Mgd2hpY2ggc3BlY2lmaWVzIGEgTkZUIE1pbnQgT3AuXG4gKi9cbmV4cG9ydCBjbGFzcyBORlRNaW50T3BlcmF0aW9uIGV4dGVuZHMgT3BlcmF0aW9uIHtcbiAgcHJvdGVjdGVkIF90eXBlTmFtZSA9IFwiTkZUTWludE9wZXJhdGlvblwiO1xuICBwcm90ZWN0ZWQgX2NvZGVjSUQgPSBBVk1Db25zdGFudHMuTEFURVNUQ09ERUM7XG4gIHByb3RlY3RlZCBfdHlwZUlEID0gdGhpcy5fY29kZWNJRCA9PT0gMCA/IEFWTUNvbnN0YW50cy5ORlRNSU5UT1BJRCA6IEFWTUNvbnN0YW50cy5ORlRNSU5UT1BJRF9DT0RFQ09ORTtcblxuICBzZXJpYWxpemUoZW5jb2Rpbmc6U2VyaWFsaXplZEVuY29kaW5nID0gXCJoZXhcIik6b2JqZWN0IHtcbiAgICBsZXQgZmllbGRzOm9iamVjdCA9IHN1cGVyLnNlcmlhbGl6ZShlbmNvZGluZyk7XG4gICAgcmV0dXJuIHtcbiAgICAgIC4uLmZpZWxkcyxcbiAgICAgIFwiZ3JvdXBJRFwiOiBzZXJpYWxpemVyLmVuY29kZXIodGhpcy5ncm91cElELCBlbmNvZGluZywgXCJCdWZmZXJcIiwgXCJkZWNpbWFsU3RyaW5nXCIsIDQpLFxuICAgICAgXCJwYXlsb2FkXCI6IHNlcmlhbGl6ZXIuZW5jb2Rlcih0aGlzLnBheWxvYWQsIGVuY29kaW5nLCBcIkJ1ZmZlclwiLCBcImhleFwiKSxcbiAgICAgIFwib3V0cHV0T3duZXJzXCI6IHRoaXMub3V0cHV0T3duZXJzLm1hcCgobykgPT4gby5zZXJpYWxpemUoZW5jb2RpbmcpKVxuICAgIH1cbiAgfTtcbiAgZGVzZXJpYWxpemUoZmllbGRzOm9iamVjdCwgZW5jb2Rpbmc6U2VyaWFsaXplZEVuY29kaW5nID0gXCJoZXhcIikge1xuICAgIHN1cGVyLmRlc2VyaWFsaXplKGZpZWxkcywgZW5jb2RpbmcpO1xuICAgIHRoaXMuZ3JvdXBJRCA9IHNlcmlhbGl6ZXIuZGVjb2RlcihmaWVsZHNbXCJncm91cElEXCJdLCBlbmNvZGluZywgXCJkZWNpbWFsU3RyaW5nXCIsIFwiQnVmZmVyXCIsIDQpO1xuICAgIHRoaXMucGF5bG9hZCA9IHNlcmlhbGl6ZXIuZGVjb2RlcihmaWVsZHNbXCJwYXlsb2FkXCJdLCBlbmNvZGluZywgXCJoZXhcIiwgXCJCdWZmZXJcIik7XG4gICAgdGhpcy5vdXRwdXRPd25lcnMgPSBmaWVsZHNbXCJvdXRwdXRPd25lcnNcIl0ubWFwKChvOm9iamVjdCkgPT4ge1xuICAgICAgbGV0IG9vOk91dHB1dE93bmVycyA9IG5ldyBPdXRwdXRPd25lcnMoKTtcbiAgICAgIG9vLmRlc2VyaWFsaXplKG8sIGVuY29kaW5nKTtcbiAgICAgIHJldHVybiBvbztcbiAgICB9KTtcbiAgfVxuXG4gIHByb3RlY3RlZCBncm91cElEOkJ1ZmZlciA9IEJ1ZmZlci5hbGxvYyg0KTtcbiAgcHJvdGVjdGVkIHBheWxvYWQ6QnVmZmVyO1xuICBwcm90ZWN0ZWQgb3V0cHV0T3duZXJzOkFycmF5PE91dHB1dE93bmVycz4gPSBbXTtcblxuICBzZXRDb2RlY0lEKGNvZGVjSUQ6IG51bWJlcik6IHZvaWQge1xuICAgIGlmKGNvZGVjSUQgIT09IDAgJiYgY29kZWNJRCAhPT0gMSkge1xuICAgICAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiRXJyb3IgLSBORlRNaW50T3BlcmF0aW9uLnNldENvZGVjSUQ6IGludmFsaWQgY29kZWNJRC4gVmFsaWQgY29kZWNJRHMgYXJlIDAgYW5kIDEuXCIpO1xuICAgIH1cbiAgICB0aGlzLl9jb2RlY0lEID0gY29kZWNJRDtcbiAgICB0aGlzLl90eXBlSUQgPSB0aGlzLl9jb2RlY0lEID09PSAwID8gQVZNQ29uc3RhbnRzLk5GVE1JTlRPUElEIDogQVZNQ29uc3RhbnRzLk5GVE1JTlRPUElEX0NPREVDT05FO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIG9wZXJhdGlvbiBJRC5cbiAgICovXG4gIGdldE9wZXJhdGlvbklEKCk6bnVtYmVyIHtcbiAgICByZXR1cm4gdGhpcy5fdHlwZUlEO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIGNyZWRlbnRpYWwgSUQuXG4gICAqL1xuICBnZXRDcmVkZW50aWFsSUQgPSAoKTogbnVtYmVyID0+IHtcbiAgICBpZih0aGlzLl9jb2RlY0lEID09PSAwKSB7XG4gICAgICByZXR1cm4gQVZNQ29uc3RhbnRzLk5GVENSRURFTlRJQUw7XG4gICAgfSBlbHNlIGlmICh0aGlzLl9jb2RlY0lEID09PSAxKSB7XG4gICAgICByZXR1cm4gQVZNQ29uc3RhbnRzLk5GVENSRURFTlRJQUxfQ09ERUNPTkU7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIHBheWxvYWQuXG4gICAqL1xuICBnZXRQYXlsb2FkID0gKCk6QnVmZmVyID0+IHtcbiAgICByZXR1cm4gYmludG9vbHMuY29weUZyb20odGhpcy5wYXlsb2FkLCAwKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSBwYXlsb2FkJ3MgcmF3IHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IHdpdGggbGVuZ3RoIHByZXBlbmRlZCwgZm9yIHVzZSB3aXRoIFtbUGF5bG9hZEJhc2VdXSdzIGZyb21CdWZmZXJcbiAgICovXG4gIGdldFBheWxvYWRCdWZmZXIgPSAoKTpCdWZmZXIgPT4ge1xuICAgIGxldCBwYXlsb2FkbGVuOkJ1ZmZlciA9IEJ1ZmZlci5hbGxvYyg0KTtcbiAgICBwYXlsb2FkbGVuLndyaXRlVUludDMyQkUodGhpcy5wYXlsb2FkLmxlbmd0aCwgMCk7XG4gICAgcmV0dXJuIEJ1ZmZlci5jb25jYXQoW3BheWxvYWRsZW4sIGJpbnRvb2xzLmNvcHlGcm9tKHRoaXMucGF5bG9hZCwgMCldKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSBvdXRwdXRPd25lcnMuXG4gICAqL1xuICBnZXRPdXRwdXRPd25lcnMgPSAoKTpBcnJheTxPdXRwdXRPd25lcnM+ID0+IHtcbiAgICByZXR1cm4gdGhpcy5vdXRwdXRPd25lcnM7XG4gIH1cblxuICAvKipcbiAgICogUG9wdWF0ZXMgdGhlIGluc3RhbmNlIGZyb20gYSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSByZXByZXNlbnRpbmcgdGhlIFtbTkZUTWludE9wZXJhdGlvbl1dIGFuZCByZXR1cm5zIHRoZSB1cGRhdGVkIG9mZnNldC5cbiAgICovXG4gIGZyb21CdWZmZXIoYnl0ZXM6QnVmZmVyLCBvZmZzZXQ6bnVtYmVyID0gMCk6bnVtYmVyIHtcbiAgICBvZmZzZXQgPSBzdXBlci5mcm9tQnVmZmVyKGJ5dGVzLCBvZmZzZXQpO1xuICAgIHRoaXMuZ3JvdXBJRCA9IGJpbnRvb2xzLmNvcHlGcm9tKGJ5dGVzLCBvZmZzZXQsIG9mZnNldCArIDQpO1xuICAgIG9mZnNldCArPSA0O1xuICAgIGxldCBwYXlsb2FkTGVuOm51bWJlciA9IGJpbnRvb2xzLmNvcHlGcm9tKGJ5dGVzLCBvZmZzZXQsIG9mZnNldCArIDQpLnJlYWRVSW50MzJCRSgwKTtcbiAgICBvZmZzZXQgKz0gNDtcbiAgICB0aGlzLnBheWxvYWQgPSBiaW50b29scy5jb3B5RnJvbShieXRlcywgb2Zmc2V0LCBvZmZzZXQgKyBwYXlsb2FkTGVuKTtcbiAgICBvZmZzZXQgKz0gcGF5bG9hZExlbjtcbiAgICBsZXQgbnVtb3V0cHV0czpudW1iZXIgPSBiaW50b29scy5jb3B5RnJvbShieXRlcywgb2Zmc2V0LCBvZmZzZXQgKyA0KS5yZWFkVUludDMyQkUoMCk7XG4gICAgb2Zmc2V0ICs9IDQ7XG4gICAgdGhpcy5vdXRwdXRPd25lcnMgPSBbXTtcbiAgICBmb3IobGV0IGk6bnVtYmVyID0gMDsgaSA8IG51bW91dHB1dHM7IGkrKykge1xuICAgICAgbGV0IG91dHB1dE93bmVyOk91dHB1dE93bmVycyA9IG5ldyBPdXRwdXRPd25lcnMoKTtcbiAgICAgIG9mZnNldCA9IG91dHB1dE93bmVyLmZyb21CdWZmZXIoYnl0ZXMsIG9mZnNldCk7XG4gICAgICB0aGlzLm91dHB1dE93bmVycy5wdXNoKG91dHB1dE93bmVyKTtcbiAgICB9XG4gICAgcmV0dXJuIG9mZnNldDtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSBidWZmZXIgcmVwcmVzZW50aW5nIHRoZSBbW05GVE1pbnRPcGVyYXRpb25dXSBpbnN0YW5jZS5cbiAgICovXG4gIHRvQnVmZmVyKCk6QnVmZmVyIHtcbiAgICBsZXQgc3VwZXJidWZmOkJ1ZmZlciA9IHN1cGVyLnRvQnVmZmVyKCk7XG4gICAgbGV0IHBheWxvYWRsZW46QnVmZmVyID0gQnVmZmVyLmFsbG9jKDQpO1xuICAgIHBheWxvYWRsZW4ud3JpdGVVSW50MzJCRSh0aGlzLnBheWxvYWQubGVuZ3RoLCAwKTtcblxuICAgIGxldCBvdXRwdXRvd25lcnNsZW46QnVmZmVyID0gQnVmZmVyLmFsbG9jKDQpO1xuICAgIG91dHB1dG93bmVyc2xlbi53cml0ZVVJbnQzMkJFKHRoaXMub3V0cHV0T3duZXJzLmxlbmd0aCwgMCk7XG5cbiAgICBsZXQgYnNpemU6bnVtYmVyID0gXG4gICAgICBzdXBlcmJ1ZmYubGVuZ3RoICsgXG4gICAgICB0aGlzLmdyb3VwSUQubGVuZ3RoICsgXG4gICAgICBwYXlsb2FkbGVuLmxlbmd0aCArIFxuICAgICAgdGhpcy5wYXlsb2FkLmxlbmd0aCArXG4gICAgICBvdXRwdXRvd25lcnNsZW4ubGVuZ3RoOyBcblxuICAgIGxldCBiYXJyOkFycmF5PEJ1ZmZlcj4gPSBbXG4gICAgICBzdXBlcmJ1ZmYsIFxuICAgICAgdGhpcy5ncm91cElELFxuICAgICAgcGF5bG9hZGxlbixcbiAgICAgIHRoaXMucGF5bG9hZCwgXG4gICAgICBvdXRwdXRvd25lcnNsZW5cbiAgICBdO1xuXG4gICAgZm9yKGxldCBpID0gMDsgaSA8IHRoaXMub3V0cHV0T3duZXJzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBsZXQgYjpCdWZmZXIgPSB0aGlzLm91dHB1dE93bmVyc1tpXS50b0J1ZmZlcigpO1xuICAgICAgYmFyci5wdXNoKGIpO1xuICAgICAgYnNpemUgKz0gYi5sZW5ndGg7XG4gICAgfVxuXG4gICAgcmV0dXJuIEJ1ZmZlci5jb25jYXQoYmFycixic2l6ZSk7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyBhIGJhc2UtNTggc3RyaW5nIHJlcHJlc2VudGluZyB0aGUgW1tORlRNaW50T3BlcmF0aW9uXV0uXG4gICAqL1xuICB0b1N0cmluZygpOnN0cmluZyB7XG4gICAgcmV0dXJuIGJpbnRvb2xzLmJ1ZmZlclRvQjU4KHRoaXMudG9CdWZmZXIoKSk7XG4gIH1cblxuICAvKipcbiAgICogQW4gW1tPcGVyYXRpb25dXSBjbGFzcyB3aGljaCBjb250YWlucyBhbiBORlQgb24gYW4gYXNzZXRJRC5cbiAgICogXG4gICAqIEBwYXJhbSBncm91cElEIFRoZSBncm91cCB0byB3aGljaCB0byBpc3N1ZSB0aGUgTkZUIE91dHB1dFxuICAgKiBAcGFyYW0gcGF5bG9hZCBBIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IG9mIHRoZSBORlQgcGF5bG9hZFxuICAgKiBAcGFyYW0gb3V0cHV0T3duZXJzIEFuIGFycmF5IG9mIG91dHB1dE93bmVyc1xuICAgKi9cbiAgY29uc3RydWN0b3IoZ3JvdXBJRDpudW1iZXIgPSB1bmRlZmluZWQsIHBheWxvYWQ6QnVmZmVyID0gdW5kZWZpbmVkLCBvdXRwdXRPd25lcnM6QXJyYXk8T3V0cHV0T3duZXJzPiA9IHVuZGVmaW5lZCl7XG4gICAgc3VwZXIoKTtcbiAgICBpZih0eXBlb2YgZ3JvdXBJRCAhPT0gJ3VuZGVmaW5lZCcgJiYgdHlwZW9mIHBheWxvYWQgIT09ICd1bmRlZmluZWQnICYmIG91dHB1dE93bmVycy5sZW5ndGgpIHtcbiAgICAgIHRoaXMuZ3JvdXBJRC53cml0ZVVJbnQzMkJFKChncm91cElEID8gZ3JvdXBJRCA6IDApLCAwKTtcbiAgICAgIHRoaXMucGF5bG9hZCA9IHBheWxvYWQ7XG4gICAgICB0aGlzLm91dHB1dE93bmVycyA9IG91dHB1dE93bmVycztcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBBIFtbT3BlcmF0aW9uXV0gY2xhc3Mgd2hpY2ggc3BlY2lmaWVzIGEgTkZUIFRyYW5zZmVyIE9wLlxuICovXG5leHBvcnQgY2xhc3MgTkZUVHJhbnNmZXJPcGVyYXRpb24gZXh0ZW5kcyBPcGVyYXRpb24ge1xuICBwcm90ZWN0ZWQgX3R5cGVOYW1lID0gXCJORlRUcmFuc2Zlck9wZXJhdGlvblwiO1xuICBwcm90ZWN0ZWQgX2NvZGVjSUQgPSBBVk1Db25zdGFudHMuTEFURVNUQ09ERUM7XG4gIHByb3RlY3RlZCBfdHlwZUlEID0gdGhpcy5fY29kZWNJRCA9PT0gMCA/IEFWTUNvbnN0YW50cy5ORlRYRkVST1BJRCA6IEFWTUNvbnN0YW50cy5ORlRYRkVST1BJRF9DT0RFQ09ORTtcblxuICBzZXJpYWxpemUoZW5jb2Rpbmc6U2VyaWFsaXplZEVuY29kaW5nID0gXCJoZXhcIik6b2JqZWN0IHtcbiAgICBsZXQgZmllbGRzOm9iamVjdCA9IHN1cGVyLnNlcmlhbGl6ZShlbmNvZGluZyk7XG4gICAgcmV0dXJuIHtcbiAgICAgIC4uLmZpZWxkcyxcbiAgICAgIFwib3V0cHV0XCI6IHRoaXMub3V0cHV0LnNlcmlhbGl6ZShlbmNvZGluZylcbiAgICB9XG4gIH07XG4gIGRlc2VyaWFsaXplKGZpZWxkczpvYmplY3QsIGVuY29kaW5nOlNlcmlhbGl6ZWRFbmNvZGluZyA9IFwiaGV4XCIpIHtcbiAgICBzdXBlci5kZXNlcmlhbGl6ZShmaWVsZHMsIGVuY29kaW5nKTtcbiAgICB0aGlzLm91dHB1dCA9IG5ldyBORlRUcmFuc2Zlck91dHB1dCgpO1xuICAgIHRoaXMub3V0cHV0LmRlc2VyaWFsaXplKGZpZWxkc1tcIm91dHB1dFwiXSwgZW5jb2RpbmcpO1xuICB9XG5cbiAgcHJvdGVjdGVkIG91dHB1dDpORlRUcmFuc2Zlck91dHB1dDtcblxuICBzZXRDb2RlY0lEKGNvZGVjSUQ6IG51bWJlcik6IHZvaWQge1xuICAgIGlmKGNvZGVjSUQgIT09IDAgJiYgY29kZWNJRCAhPT0gMSkge1xuICAgICAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiRXJyb3IgLSBORlRUcmFuc2Zlck9wZXJhdGlvbi5zZXRDb2RlY0lEOiBpbnZhbGlkIGNvZGVjSUQuIFZhbGlkIGNvZGVjSURzIGFyZSAwIGFuZCAxLlwiKTtcbiAgICB9XG4gICAgdGhpcy5fY29kZWNJRCA9IGNvZGVjSUQ7XG4gICAgdGhpcy5fdHlwZUlEID0gdGhpcy5fY29kZWNJRCA9PT0gMCA/IEFWTUNvbnN0YW50cy5ORlRYRkVST1BJRCA6IEFWTUNvbnN0YW50cy5ORlRYRkVST1BJRF9DT0RFQ09ORTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSBvcGVyYXRpb24gSUQuXG4gICAqL1xuICBnZXRPcGVyYXRpb25JRCgpOm51bWJlciB7XG4gICAgcmV0dXJuIHRoaXMuX3R5cGVJRDtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSBjcmVkZW50aWFsIElELlxuICAgKi9cbiAgZ2V0Q3JlZGVudGlhbElEICgpOiBudW1iZXIge1xuICAgIGlmKHRoaXMuX2NvZGVjSUQgPT09IDApIHtcbiAgICAgIHJldHVybiBBVk1Db25zdGFudHMuTkZUQ1JFREVOVElBTDtcbiAgICB9IGVsc2UgaWYgKHRoaXMuX2NvZGVjSUQgPT09IDEpIHtcbiAgICAgIHJldHVybiBBVk1Db25zdGFudHMuTkZUQ1JFREVOVElBTF9DT0RFQ09ORTtcbiAgICB9XG4gIH1cblxuICBnZXRPdXRwdXQgPSAoKTpORlRUcmFuc2Zlck91dHB1dCA9PiB0aGlzLm91dHB1dDtcblxuICAvKipcbiAgICAgKiBQb3B1YXRlcyB0aGUgaW5zdGFuY2UgZnJvbSBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IHJlcHJlc2VudGluZyB0aGUgW1tORlRUcmFuc2Zlck9wZXJhdGlvbl1dIGFuZCByZXR1cm5zIHRoZSB1cGRhdGVkIG9mZnNldC5cbiAgICAgKi9cbiAgZnJvbUJ1ZmZlcihieXRlczpCdWZmZXIsIG9mZnNldDpudW1iZXIgPSAwKTpudW1iZXIge1xuICAgIG9mZnNldCA9IHN1cGVyLmZyb21CdWZmZXIoYnl0ZXMsIG9mZnNldCk7XG4gICAgdGhpcy5vdXRwdXQgPSBuZXcgTkZUVHJhbnNmZXJPdXRwdXQoKTtcbiAgICByZXR1cm4gdGhpcy5vdXRwdXQuZnJvbUJ1ZmZlcihieXRlcywgb2Zmc2V0KTtcbiAgfVxuXG4gIC8qKlxuICAgICAqIFJldHVybnMgdGhlIGJ1ZmZlciByZXByZXNlbnRpbmcgdGhlIFtbTkZUVHJhbnNmZXJPcGVyYXRpb25dXSBpbnN0YW5jZS5cbiAgICAgKi9cbiAgdG9CdWZmZXIoKTpCdWZmZXIge1xuICAgIGNvbnN0IHN1cGVyYnVmZjpCdWZmZXIgPSBzdXBlci50b0J1ZmZlcigpO1xuICAgIGNvbnN0IG91dGJ1ZmY6QnVmZmVyID0gdGhpcy5vdXRwdXQudG9CdWZmZXIoKTtcbiAgICBjb25zdCBic2l6ZTpudW1iZXIgPSBzdXBlcmJ1ZmYubGVuZ3RoICsgb3V0YnVmZi5sZW5ndGg7XG4gICAgY29uc3QgYmFycjpBcnJheTxCdWZmZXI+ID0gW3N1cGVyYnVmZiwgb3V0YnVmZl07XG4gICAgcmV0dXJuIEJ1ZmZlci5jb25jYXQoYmFyciwgYnNpemUpO1xuICB9XG5cbiAgLyoqXG4gICAgICogUmV0dXJucyBhIGJhc2UtNTggc3RyaW5nIHJlcHJlc2VudGluZyB0aGUgW1tORlRUcmFuc2Zlck9wZXJhdGlvbl1dLlxuICAgICAqL1xuICB0b1N0cmluZygpOnN0cmluZyB7XG4gICAgcmV0dXJuIGJpbnRvb2xzLmJ1ZmZlclRvQjU4KHRoaXMudG9CdWZmZXIoKSk7XG4gIH1cblxuICAvKipcbiAgICAgKiBBbiBbW09wZXJhdGlvbl1dIGNsYXNzIHdoaWNoIGNvbnRhaW5zIGFuIE5GVCBvbiBhbiBhc3NldElELlxuICAgICAqXG4gICAgICogQHBhcmFtIG91dHB1dCBBbiBbW05GVFRyYW5zZmVyT3V0cHV0XV1cbiAgICAgKi9cbiAgY29uc3RydWN0b3Iob3V0cHV0Ok5GVFRyYW5zZmVyT3V0cHV0ID0gdW5kZWZpbmVkKSB7XG4gICAgc3VwZXIoKTtcbiAgICBpZiAodHlwZW9mIG91dHB1dCAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgIHRoaXMub3V0cHV0ID0gb3V0cHV0O1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIENLQyAtIE1ha2UgZ2VuZXJpYywgdXNlIGV2ZXJ5d2hlcmUuXG4gKi9cblxuLyoqXG4gKiBDbGFzcyBmb3IgcmVwcmVzZW50aW5nIGEgVVRYT0lEIHVzZWQgaW4gW1tUcmFuc2ZlcmFibGVPcF1dIHR5cGVzXG4gKi9cbmV4cG9ydCBjbGFzcyBVVFhPSUQgZXh0ZW5kcyBOQnl0ZXMge1xuICBwcm90ZWN0ZWQgX3R5cGVOYW1lID0gXCJVVFhPSURcIjtcbiAgcHJvdGVjdGVkIF90eXBlSUQgPSB1bmRlZmluZWQ7XG5cbiAgLy9zZXJpYWxpemUgYW5kIGRlc2VyaWFsaXplIGJvdGggYXJlIGluaGVyaXRlZFxuXG4gIHByb3RlY3RlZCBieXRlcyA9IEJ1ZmZlci5hbGxvYygzNik7XG4gIHByb3RlY3RlZCBic2l6ZSA9IDM2O1xuXG4gIC8qKlxuICAgICAqIFJldHVybnMgYSBmdW5jdGlvbiB1c2VkIHRvIHNvcnQgYW4gYXJyYXkgb2YgW1tVVFhPSURdXXNcbiAgICAgKi9cbiAgc3RhdGljIGNvbXBhcmF0b3IgPSAoKTooYTpVVFhPSUQsIGI6VVRYT0lEKSA9PiAoMXwtMXwwKSA9PiAoYTpVVFhPSUQsIGI6VVRYT0lEKVxuICAgIDooMXwtMXwwKSA9PiBCdWZmZXIuY29tcGFyZShhLnRvQnVmZmVyKCksIGIudG9CdWZmZXIoKSkgYXMgKDF8LTF8MCk7XG5cbiAgLyoqXG4gICAgICogUmV0dXJucyBhIGJhc2UtNTggcmVwcmVzZW50YXRpb24gb2YgdGhlIFtbVVRYT0lEXV0uXG4gICAgICovXG4gIHRvU3RyaW5nKCk6c3RyaW5nIHtcbiAgICByZXR1cm4gYmludG9vbHMuY2I1OEVuY29kZSh0aGlzLnRvQnVmZmVyKCkpO1xuICB9XG5cbiAgLyoqXG4gICAgICogVGFrZXMgYSBiYXNlLTU4IHN0cmluZyBjb250YWluaW5nIGFuIFtbVVRYT0lEXV0sIHBhcnNlcyBpdCwgcG9wdWxhdGVzIHRoZSBjbGFzcywgYW5kIHJldHVybnMgdGhlIGxlbmd0aCBvZiB0aGUgVVRYT0lEIGluIGJ5dGVzLlxuICAgICAqXG4gICAgICogQHBhcmFtIGJ5dGVzIEEgYmFzZS01OCBzdHJpbmcgY29udGFpbmluZyBhIHJhdyBbW1VUWE9JRF1dXG4gICAgICpcbiAgICAgKiBAcmV0dXJucyBUaGUgbGVuZ3RoIG9mIHRoZSByYXcgW1tVVFhPSURdXVxuICAgICAqL1xuICBmcm9tU3RyaW5nKHV0eG9pZDpzdHJpbmcpOm51bWJlciB7XG4gICAgY29uc3QgdXR4b2lkYnVmZjpCdWZmZXIgPSBiaW50b29scy5iNThUb0J1ZmZlcih1dHhvaWQpO1xuICAgIGlmICh1dHhvaWRidWZmLmxlbmd0aCA9PT0gNDAgJiYgYmludG9vbHMudmFsaWRhdGVDaGVja3N1bSh1dHhvaWRidWZmKSkge1xuICAgICAgY29uc3QgbmV3YnVmZjpCdWZmZXIgPSBiaW50b29scy5jb3B5RnJvbSh1dHhvaWRidWZmLCAwLCB1dHhvaWRidWZmLmxlbmd0aCAtIDQpO1xuICAgICAgaWYgKG5ld2J1ZmYubGVuZ3RoID09PSAzNikge1xuICAgICAgICB0aGlzLmJ5dGVzID0gbmV3YnVmZjtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKHV0eG9pZGJ1ZmYubGVuZ3RoID09PSA0MCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdFcnJvciAtIFVUWE9JRC5mcm9tU3RyaW5nOiBpbnZhbGlkIGNoZWNrc3VtIG9uIGFkZHJlc3MnKTtcbiAgICB9IGVsc2UgaWYgKHV0eG9pZGJ1ZmYubGVuZ3RoID09PSAzNikge1xuICAgICAgdGhpcy5ieXRlcyA9IHV0eG9pZGJ1ZmY7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0Vycm9yIC0gVVRYT0lELmZyb21TdHJpbmc6IGludmFsaWQgYWRkcmVzcycpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5nZXRTaXplKCk7XG4gICAgXG4gIH1cblxuICBjbG9uZSgpOnRoaXMge1xuICAgIGxldCBuZXdiYXNlOlVUWE9JRCA9IG5ldyBVVFhPSUQoKTtcbiAgICBuZXdiYXNlLmZyb21CdWZmZXIodGhpcy50b0J1ZmZlcigpKTtcbiAgICByZXR1cm4gbmV3YmFzZSBhcyB0aGlzO1xuICB9XG5cbiAgY3JlYXRlKC4uLmFyZ3M6YW55W10pOnRoaXMge1xuICAgIHJldHVybiBuZXcgVVRYT0lEKCkgYXMgdGhpcztcbiAgfVxuXG4gIC8qKlxuICAgICAqIENsYXNzIGZvciByZXByZXNlbnRpbmcgYSBVVFhPSUQgdXNlZCBpbiBbW1RyYW5zZmVyYWJsZU9wXV0gdHlwZXNcbiAgICAgKi9cbiAgY29uc3RydWN0b3IoKSB7XG4gICAgc3VwZXIoKTtcbiAgfVxufSJdfQ==