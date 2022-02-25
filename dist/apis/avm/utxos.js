"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UTXOSet = exports.AssetAmountDestination = exports.UTXO = void 0;
/**
 * @packageDocumentation
 * @module API-AVM-UTXOs
  */
const buffer_1 = require("buffer/");
const bintools_1 = __importDefault(require("../../utils/bintools"));
const bn_js_1 = __importDefault(require("bn.js"));
const outputs_1 = require("./outputs");
const constants_1 = require("./constants");
const tx_1 = require("./tx");
const inputs_1 = require("./inputs");
const ops_1 = require("./ops");
const helperfunctions_1 = require("../../utils/helperfunctions");
const initialstates_1 = require("./initialstates");
const utxos_1 = require("../../common/utxos");
const createassettx_1 = require("./createassettx");
const operationtx_1 = require("./operationtx");
const basetx_1 = require("./basetx");
const exporttx_1 = require("./exporttx");
const importtx_1 = require("./importtx");
const constants_2 = require("../../utils/constants");
const assetamount_1 = require("../../common/assetamount");
const serialization_1 = require("../../utils/serialization");
/**
 * @ignore
 */
const bintools = bintools_1.default.getInstance();
const serializer = serialization_1.Serialization.getInstance();
/**
 * Class for representing a single UTXO.
 */
class UTXO extends utxos_1.StandardUTXO {
    constructor() {
        super(...arguments);
        this._typeName = "UTXO";
        this._typeID = undefined;
    }
    //serialize is inherited
    deserialize(fields, encoding = "hex") {
        super.deserialize(fields, encoding);
        this.output = outputs_1.SelectOutputClass(fields["output"]["_typeID"]);
        this.output.deserialize(fields["output"], encoding);
    }
    fromBuffer(bytes, offset = 0) {
        this.codecid = bintools.copyFrom(bytes, offset, offset + 2);
        offset += 2;
        this.txid = bintools.copyFrom(bytes, offset, offset + 32);
        offset += 32;
        this.outputidx = bintools.copyFrom(bytes, offset, offset + 4);
        offset += 4;
        this.assetid = bintools.copyFrom(bytes, offset, offset + 32);
        offset += 32;
        const outputid = bintools.copyFrom(bytes, offset, offset + 4).readUInt32BE(0);
        offset += 4;
        this.output = outputs_1.SelectOutputClass(outputid);
        return this.output.fromBuffer(bytes, offset);
    }
    /**
     * Takes a base-58 string containing a [[UTXO]], parses it, populates the class, and returns the length of the StandardUTXO in bytes.
     *
     * @param serialized A base-58 string containing a raw [[UTXO]]
     *
     * @returns The length of the raw [[UTXO]]
     *
     * @remarks
     * unlike most fromStrings, it expects the string to be serialized in cb58 format
     */
    fromString(serialized) {
        /* istanbul ignore next */
        return this.fromBuffer(bintools.cb58Decode(serialized));
    }
    /**
     * Returns a base-58 representation of the [[UTXO]].
     *
     * @remarks
     * unlike most toStrings, this returns in cb58 serialization format
     */
    toString() {
        /* istanbul ignore next */
        return bintools.cb58Encode(this.toBuffer());
    }
    clone() {
        const utxo = new UTXO();
        utxo.fromBuffer(this.toBuffer());
        return utxo;
    }
    create(codecID = constants_1.AVMConstants.LATESTCODEC, txid = undefined, outputidx = undefined, assetid = undefined, output = undefined) {
        return new UTXO(codecID, txid, outputidx, assetid, output);
    }
}
exports.UTXO = UTXO;
class AssetAmountDestination extends assetamount_1.StandardAssetAmountDestination {
}
exports.AssetAmountDestination = AssetAmountDestination;
/**
 * Class representing a set of [[UTXO]]s.
 */
class UTXOSet extends utxos_1.StandardUTXOSet {
    constructor() {
        super(...arguments);
        this._typeName = "UTXOSet";
        this._typeID = undefined;
        this.getMinimumSpendable = (aad, asOf = helperfunctions_1.UnixNow(), locktime = new bn_js_1.default(0), threshold = 1) => {
            const utxoArray = this.getAllUTXOs();
            const outids = {};
            for (let i = 0; i < utxoArray.length && !aad.canComplete(); i++) {
                const u = utxoArray[i];
                const assetKey = u.getAssetID().toString("hex");
                const fromAddresses = aad.getSenders();
                if (u.getOutput() instanceof outputs_1.AmountOutput && aad.assetExists(assetKey) && u.getOutput().meetsThreshold(fromAddresses, asOf)) {
                    const am = aad.getAssetAmount(assetKey);
                    if (!am.isFinished()) {
                        const uout = u.getOutput();
                        outids[assetKey] = uout.getOutputID();
                        const amount = uout.getAmount();
                        am.spendAmount(amount);
                        const txid = u.getTxID();
                        const outputidx = u.getOutputIdx();
                        const input = new inputs_1.SECPTransferInput(amount);
                        const xferin = new inputs_1.TransferableInput(txid, outputidx, u.getAssetID(), input);
                        const spenders = uout.getSpenders(fromAddresses, asOf);
                        for (let j = 0; j < spenders.length; j++) {
                            const idx = uout.getAddressIdx(spenders[j]);
                            if (idx === -1) {
                                /* istanbul ignore next */
                                throw new Error('Error - UTXOSet.getMinimumSpendable: no such '
                                    + `address in output: ${spenders[j]}`);
                            }
                            xferin.getInput().addSignatureIdx(idx, spenders[j]);
                        }
                        aad.addInput(xferin);
                    }
                    else if (aad.assetExists(assetKey) && !(u.getOutput() instanceof outputs_1.AmountOutput)) {
                        /**
                         * Leaving the below lines, not simply for posterity, but for clarification.
                         * AssetIDs may have mixed OutputTypes.
                         * Some of those OutputTypes may implement AmountOutput.
                         * Others may not.
                         * Simply continue in this condition.
                         */
                        /*return new Error('Error - UTXOSet.getMinimumSpendable: outputID does not '
                          + `implement AmountOutput: ${u.getOutput().getOutputID}`);*/
                        continue;
                    }
                }
            }
            if (!aad.canComplete()) {
                return new Error('Error - UTXOSet.getMinimumSpendable: insufficient '
                    + 'funds to create the transaction');
            }
            const amounts = aad.getAmounts();
            const zero = new bn_js_1.default(0);
            for (let i = 0; i < amounts.length; i++) {
                const assetKey = amounts[i].getAssetIDString();
                const amount = amounts[i].getAmount();
                if (amount.gt(zero)) {
                    const spendout = outputs_1.SelectOutputClass(outids[assetKey], amount, aad.getDestinations(), locktime, threshold);
                    const xferout = new outputs_1.TransferableOutput(amounts[i].getAssetID(), spendout);
                    aad.addOutput(xferout);
                }
                const change = amounts[i].getChange();
                if (change.gt(zero)) {
                    const changeout = outputs_1.SelectOutputClass(outids[assetKey], change, aad.getChangeAddresses());
                    const chgxferout = new outputs_1.TransferableOutput(amounts[i].getAssetID(), changeout);
                    aad.addChange(chgxferout);
                }
            }
            return undefined;
        };
        /**
         * Creates an [[UnsignedTx]] wrapping a [[BaseTx]]. For more granular control, you may create your own
         * [[UnsignedTx]] wrapping a [[BaseTx]] manually (with their corresponding [[TransferableInput]]s and [[TransferableOutput]]s).
         *
         * @param networkid The number representing NetworkID of the node
         * @param blockchainid The {@link https://github.com/feross/buffer|Buffer} representing the BlockchainID for the transaction
         * @param amount The amount of the asset to be spent in its smallest denomination, represented as {@link https://github.com/indutny/bn.js/|BN}.
         * @param assetID {@link https://github.com/feross/buffer|Buffer} of the asset ID for the UTXO
         * @param toAddresses The addresses to send the funds
         * @param fromAddresses The addresses being used to send the funds from the UTXOs {@link https://github.com/feross/buffer|Buffer}
         * @param changeAddresses Optional. The addresses that can spend the change remaining from the spent UTXOs. Default: toAddresses
         * @param fee Optional. The amount of fees to burn in its smallest denomination, represented as {@link https://github.com/indutny/bn.js/|BN}
         * @param feeAssetID Optional. The assetID of the fees being burned. Default: assetID
         * @param memo Optional. Contains arbitrary data, up to 256 bytes
         * @param asOf Optional. The timestamp to verify the transaction against as a {@link https://github.com/indutny/bn.js/|BN}
         * @param locktime Optional. The locktime field created in the resulting outputs
         * @param threshold Optional. The number of signatures required to spend the funds in the resultant UTXO
         *
         * @returns An unsigned transaction created from the passed in parameters.
         *
         */
        this.buildBaseTx = (networkid, blockchainid, amount, assetID, toAddresses, fromAddresses, changeAddresses = undefined, fee = undefined, feeAssetID = undefined, memo = undefined, asOf = helperfunctions_1.UnixNow(), locktime = new bn_js_1.default(0), threshold = 1) => {
            if (threshold > toAddresses.length) {
                /* istanbul ignore next */
                throw new Error("Error - UTXOSet.buildBaseTx: threshold is greater than number of addresses");
            }
            if (typeof changeAddresses === "undefined") {
                changeAddresses = toAddresses;
            }
            if (typeof feeAssetID === "undefined") {
                feeAssetID = assetID;
            }
            const zero = new bn_js_1.default(0);
            if (amount.eq(zero)) {
                return undefined;
            }
            const aad = new AssetAmountDestination(toAddresses, fromAddresses, changeAddresses);
            if (assetID.toString("hex") === feeAssetID.toString("hex")) {
                aad.addAssetAmount(assetID, amount, fee);
            }
            else {
                aad.addAssetAmount(assetID, amount, zero);
                if (this._feeCheck(fee, feeAssetID)) {
                    aad.addAssetAmount(feeAssetID, zero, fee);
                }
            }
            let ins = [];
            let outs = [];
            const success = this.getMinimumSpendable(aad, asOf, locktime, threshold);
            if (typeof success === "undefined") {
                ins = aad.getInputs();
                outs = aad.getAllOutputs();
            }
            else {
                throw success;
            }
            const baseTx = new basetx_1.BaseTx(networkid, blockchainid, outs, ins, memo);
            return new tx_1.UnsignedTx(baseTx);
        };
        /**
         * Creates an unsigned Create Asset transaction. For more granular control, you may create your own
         * [[CreateAssetTX]] manually (with their corresponding [[TransferableInput]]s, [[TransferableOutput]]s).
         *
         * @param networkid The number representing NetworkID of the node
         * @param blockchainid The {@link https://github.com/feross/buffer|Buffer} representing the BlockchainID for the transaction
         * @param fromAddresses The addresses being used to send the funds from the UTXOs {@link https://github.com/feross/buffer|Buffer}
         * @param changeAddresses Optional. The addresses that can spend the change remaining from the spent UTXOs
         * @param initialState The [[InitialStates]] that represent the intial state of a created asset
         * @param name String for the descriptive name of the asset
         * @param symbol String for the ticker symbol of the asset
         * @param denomination Optional number for the denomination which is 10^D. D must be >= 0 and <= 32. Ex: $1 DJTX = 10^9 $nDJTX
         * @param mintOutputs Optional. Array of [[SECPMintOutput]]s to be included in the transaction. These outputs can be spent to mint more tokens.
         * @param fee Optional. The amount of fees to burn in its smallest denomination, represented as {@link https://github.com/indutny/bn.js/|BN}
         * @param feeAssetID Optional. The assetID of the fees being burned.
         * @param memo Optional contains arbitrary bytes, up to 256 bytes
         * @param asOf Optional. The timestamp to verify the transaction against as a {@link https://github.com/indutny/bn.js/|BN}
         *
         * @returns An unsigned transaction created from the passed in parameters.
         *
         */
        this.buildCreateAssetTx = (networkid, blockchainid, fromAddresses, changeAddresses, initialState, name, symbol, denomination, mintOutputs = undefined, fee = undefined, feeAssetID = undefined, memo = undefined, asOf = helperfunctions_1.UnixNow()) => {
            const zero = new bn_js_1.default(0);
            let ins = [];
            let outs = [];
            if (this._feeCheck(fee, feeAssetID)) {
                const aad = new AssetAmountDestination(fromAddresses, fromAddresses, changeAddresses);
                aad.addAssetAmount(feeAssetID, zero, fee);
                const success = this.getMinimumSpendable(aad, asOf);
                if (typeof success === "undefined") {
                    ins = aad.getInputs();
                    outs = aad.getAllOutputs();
                }
                else {
                    throw success;
                }
            }
            if (typeof mintOutputs !== "undefined") {
                for (let i = 0; i < mintOutputs.length; i++) {
                    if (mintOutputs[i] instanceof outputs_1.SECPMintOutput) {
                        initialState.addOutput(mintOutputs[i]);
                    }
                    else {
                        throw new Error("Error - UTXOSet.buildCreateAssetTx: A submitted mintOutput was not of type SECPMintOutput");
                    }
                }
            }
            let CAtx = new createassettx_1.CreateAssetTx(networkid, blockchainid, outs, ins, memo, name, symbol, denomination, initialState);
            return new tx_1.UnsignedTx(CAtx);
        };
        /**
         * Creates an unsigned Secp mint transaction. For more granular control, you may create your own
         * [[OperationTx]] manually (with their corresponding [[TransferableInput]]s, [[TransferableOutput]]s, and [[TransferOperation]]s).
         *
         * @param networkid The number representing NetworkID of the node
         * @param blockchainid The {@link https://github.com/feross/buffer|Buffer} representing the BlockchainID for the transaction
         * @param mintOwner A [[SECPMintOutput]] which specifies the new set of minters
         * @param transferOwner A [[SECPTransferOutput]] which specifies where the minted tokens will go
         * @param fromAddresses The addresses being used to send the funds from the UTXOs {@link https://github.com/feross/buffer|Buffer}
         * @param changeAddresses The addresses that can spend the change remaining from the spent UTXOs
         * @param mintUTXOID The UTXOID for the [[SCPMintOutput]] being spent to produce more tokens
         * @param fee Optional. The amount of fees to burn in its smallest denomination, represented as {@link https://github.com/indutny/bn.js/|BN}
         * @param feeAssetID Optional. The assetID of the fees being burned.
         * @param memo Optional contains arbitrary bytes, up to 256 bytes
         * @param asOf Optional. The timestamp to verify the transaction against as a {@link https://github.com/indutny/bn.js/|BN}
         */
        this.buildSECPMintTx = (networkid, blockchainid, mintOwner, transferOwner, fromAddresses, changeAddresses, mintUTXOID, fee = undefined, feeAssetID = undefined, memo = undefined, asOf = helperfunctions_1.UnixNow()) => {
            const zero = new bn_js_1.default(0);
            let ins = [];
            let outs = [];
            if (this._feeCheck(fee, feeAssetID)) {
                const aad = new AssetAmountDestination(fromAddresses, fromAddresses, changeAddresses);
                aad.addAssetAmount(feeAssetID, zero, fee);
                const success = this.getMinimumSpendable(aad, asOf);
                if (typeof success === "undefined") {
                    ins = aad.getInputs();
                    outs = aad.getAllOutputs();
                }
                else {
                    throw success;
                }
            }
            let ops = [];
            let mintOp = new ops_1.SECPMintOperation(mintOwner, transferOwner);
            let utxo = this.getUTXO(mintUTXOID);
            if (typeof utxo === "undefined") {
                throw new Error("Error - UTXOSet.buildSECPMintTx: UTXOID not found");
            }
            if (utxo.getOutput().getOutputID() !== constants_1.AVMConstants.SECPMINTOUTPUTID) {
                throw new Error("Error - UTXOSet.buildSECPMintTx: UTXO is not a SECPMINTOUTPUTID");
            }
            let out = utxo.getOutput();
            let spenders = out.getSpenders(fromAddresses, asOf);
            for (let j = 0; j < spenders.length; j++) {
                let idx = out.getAddressIdx(spenders[j]);
                if (idx == -1) {
                    /* istanbul ignore next */
                    throw new Error("Error - UTXOSet.buildSECPMintTx: no such address in output");
                }
                mintOp.addSignatureIdx(idx, spenders[j]);
            }
            let transferableOperation = new ops_1.TransferableOperation(utxo.getAssetID(), [mintUTXOID], mintOp);
            ops.push(transferableOperation);
            let operationTx = new operationtx_1.OperationTx(networkid, blockchainid, outs, ins, memo, ops);
            return new tx_1.UnsignedTx(operationTx);
        };
        /**
        * Creates an unsigned Create Asset transaction. For more granular control, you may create your own
        * [[CreateAssetTX]] manually (with their corresponding [[TransferableInput]]s, [[TransferableOutput]]s).
        *
        * @param networkid The number representing NetworkID of the node
        * @param blockchainid The {@link https://github.com/feross/buffer|Buffer} representing the BlockchainID for the transaction
        * @param fromAddresses The addresses being used to send the funds from the UTXOs {@link https://github.com/feross/buffer|Buffer}
        * @param changeAddresses Optional. The addresses that can spend the change remaining from the spent UTXOs.
        * @param minterSets The minters and thresholds required to mint this nft asset
        * @param name String for the descriptive name of the nft asset
        * @param symbol String for the ticker symbol of the nft asset
        * @param fee Optional. The amount of fees to burn in its smallest denomination, represented as {@link https://github.com/indutny/bn.js/|BN}
        * @param feeAssetID Optional. The assetID of the fees being burned.
        * @param memo Optional contains arbitrary bytes, up to 256 bytes
        * @param asOf Optional. The timestamp to verify the transaction against as a {@link https://github.com/indutny/bn.js/|BN}
        * @param locktime Optional. The locktime field created in the resulting mint output
        *
        * @returns An unsigned transaction created from the passed in parameters.
        *
        */
        this.buildCreateNFTAssetTx = (networkid, blockchainid, fromAddresses, changeAddresses, minterSets, name, symbol, fee = undefined, feeAssetID = undefined, memo = undefined, asOf = helperfunctions_1.UnixNow(), locktime = undefined) => {
            const zero = new bn_js_1.default(0);
            let ins = [];
            let outs = [];
            if (this._feeCheck(fee, feeAssetID)) {
                const aad = new AssetAmountDestination(fromAddresses, fromAddresses, changeAddresses);
                aad.addAssetAmount(feeAssetID, zero, fee);
                const success = this.getMinimumSpendable(aad, asOf);
                if (typeof success === "undefined") {
                    ins = aad.getInputs();
                    outs = aad.getAllOutputs();
                }
                else {
                    throw success;
                }
            }
            let initialState = new initialstates_1.InitialStates();
            for (let i = 0; i < minterSets.length; i++) {
                let nftMintOutput = new outputs_1.NFTMintOutput(i, minterSets[i].getMinters(), locktime, minterSets[i].getThreshold());
                initialState.addOutput(nftMintOutput, constants_1.AVMConstants.NFTFXID);
            }
            let denomination = 0; // NFTs are non-fungible
            let CAtx = new createassettx_1.CreateAssetTx(networkid, blockchainid, outs, ins, memo, name, symbol, denomination, initialState);
            return new tx_1.UnsignedTx(CAtx);
        };
        /**
        * Creates an unsigned NFT mint transaction. For more granular control, you may create your own
        * [[OperationTx]] manually (with their corresponding [[TransferableInput]]s, [[TransferableOutput]]s, and [[TransferOperation]]s).
        *
        * @param networkid The number representing NetworkID of the node
        * @param blockchainid The {@link https://github.com/feross/buffer|Buffer} representing the BlockchainID for the transaction
        * @param owners An array of [[OutputOwners]] who will be given the NFTs.
        * @param fromAddresses The addresses being used to send the funds from the UTXOs
        * @param changeAddresses Optional. The addresses that can spend the change remaining from the spent UTXOs.
        * @param utxoids An array of strings for the NFTs being transferred
        * @param groupID Optional. The group this NFT is issued to.
        * @param payload Optional. Data for NFT Payload.
        * @param fee Optional. The amount of fees to burn in its smallest denomination, represented as {@link https://github.com/indutny/bn.js/|BN}
        * @param feeAssetID Optional. The assetID of the fees being burned.
        * @param memo Optional contains arbitrary bytes, up to 256 bytes
        * @param asOf Optional. The timestamp to verify the transaction against as a {@link https://github.com/indutny/bn.js/|BN}
        *
        * @returns An unsigned transaction created from the passed in parameters.
        *
        */
        this.buildCreateNFTMintTx = (networkid, blockchainid, owners, fromAddresses, changeAddresses, utxoids, groupID = 0, payload = undefined, fee = undefined, feeAssetID = undefined, memo = undefined, asOf = helperfunctions_1.UnixNow()) => {
            const zero = new bn_js_1.default(0);
            let ins = [];
            let outs = [];
            if (this._feeCheck(fee, feeAssetID)) {
                const aad = new AssetAmountDestination(fromAddresses, fromAddresses, changeAddresses);
                aad.addAssetAmount(feeAssetID, zero, fee);
                const success = this.getMinimumSpendable(aad, asOf);
                if (typeof success === "undefined") {
                    ins = aad.getInputs();
                    outs = aad.getAllOutputs();
                }
                else {
                    throw success;
                }
            }
            let ops = [];
            let nftMintOperation = new ops_1.NFTMintOperation(groupID, payload, owners);
            for (let i = 0; i < utxoids.length; i++) {
                let utxo = this.getUTXO(utxoids[i]);
                let out = utxo.getOutput();
                let spenders = out.getSpenders(fromAddresses, asOf);
                for (let j = 0; j < spenders.length; j++) {
                    let idx;
                    idx = out.getAddressIdx(spenders[j]);
                    if (idx == -1) {
                        /* istanbul ignore next */
                        throw new Error("Error - UTXOSet.buildCreateNFTMintTx: no such address in output");
                    }
                    nftMintOperation.addSignatureIdx(idx, spenders[j]);
                }
                let transferableOperation = new ops_1.TransferableOperation(utxo.getAssetID(), utxoids, nftMintOperation);
                ops.push(transferableOperation);
            }
            let operationTx = new operationtx_1.OperationTx(networkid, blockchainid, outs, ins, memo, ops);
            return new tx_1.UnsignedTx(operationTx);
        };
        /**
        * Creates an unsigned NFT transfer transaction. For more granular control, you may create your own
        * [[OperationTx]] manually (with their corresponding [[TransferableInput]]s, [[TransferableOutput]]s, and [[TransferOperation]]s).
        *
        * @param networkid The number representing NetworkID of the node
        * @param blockchainid The {@link https://github.com/feross/buffer|Buffer} representing the BlockchainID for the transaction
        * @param toAddresses An array of {@link https://github.com/feross/buffer|Buffer}s which indicate who recieves the NFT
        * @param fromAddresses An array for {@link https://github.com/feross/buffer|Buffer} who owns the NFT
        * @param changeAddresses Optional. The addresses that can spend the change remaining from the spent UTXOs.
        * @param utxoids An array of strings for the NFTs being transferred
        * @param fee Optional. The amount of fees to burn in its smallest denomination, represented as {@link https://github.com/indutny/bn.js/|BN}
        * @param feeAssetID Optional. The assetID of the fees being burned.
        * @param memo Optional contains arbitrary bytes, up to 256 bytes
        * @param asOf Optional. The timestamp to verify the transaction against as a {@link https://github.com/indutny/bn.js/|BN}
        * @param locktime Optional. The locktime field created in the resulting outputs
        * @param threshold Optional. The number of signatures required to spend the funds in the resultant UTXO
        *
        * @returns An unsigned transaction created from the passed in parameters.
        *
        */
        this.buildNFTTransferTx = (networkid, blockchainid, toAddresses, fromAddresses, changeAddresses, utxoids, fee = undefined, feeAssetID = undefined, memo = undefined, asOf = helperfunctions_1.UnixNow(), locktime = new bn_js_1.default(0), threshold = 1) => {
            const zero = new bn_js_1.default(0);
            let ins = [];
            let outs = [];
            if (this._feeCheck(fee, feeAssetID)) {
                const aad = new AssetAmountDestination(fromAddresses, fromAddresses, changeAddresses);
                aad.addAssetAmount(feeAssetID, zero, fee);
                const success = this.getMinimumSpendable(aad, asOf);
                if (typeof success === "undefined") {
                    ins = aad.getInputs();
                    outs = aad.getAllOutputs();
                }
                else {
                    throw success;
                }
            }
            const ops = [];
            for (let i = 0; i < utxoids.length; i++) {
                const utxo = this.getUTXO(utxoids[i]);
                const out = utxo.getOutput();
                const spenders = out.getSpenders(fromAddresses, asOf);
                const outbound = new outputs_1.NFTTransferOutput(out.getGroupID(), out.getPayload(), toAddresses, locktime, threshold);
                const op = new ops_1.NFTTransferOperation(outbound);
                for (let j = 0; j < spenders.length; j++) {
                    const idx = out.getAddressIdx(spenders[j]);
                    if (idx === -1) {
                        /* istanbul ignore next */
                        throw new Error('Error - UTXOSet.buildNFTTransferTx: '
                            + `no such address in output: ${spenders[j]}`);
                    }
                    op.addSignatureIdx(idx, spenders[j]);
                }
                const xferop = new ops_1.TransferableOperation(utxo.getAssetID(), [utxoids[i]], op);
                ops.push(xferop);
            }
            const OpTx = new operationtx_1.OperationTx(networkid, blockchainid, outs, ins, memo, ops);
            return new tx_1.UnsignedTx(OpTx);
        };
        /**
          * Creates an unsigned ImportTx transaction.
          *
          * @param networkid The number representing NetworkID of the node
          * @param blockchainid The {@link https://github.com/feross/buffer|Buffer} representing the BlockchainID for the transaction
          * @param toAddresses The addresses to send the funds
          * @param fromAddresses The addresses being used to send the funds from the UTXOs {@link https://github.com/feross/buffer|Buffer}
          * @param changeAddresses Optional. The addresses that can spend the change remaining from the spent UTXOs.
          * @param importIns An array of [[TransferableInput]]s being imported
          * @param sourceChain A {@link https://github.com/feross/buffer|Buffer} for the chainid where the imports are coming from.
          * @param fee Optional. The amount of fees to burn in its smallest denomination, represented as {@link https://github.com/indutny/bn.js/|BN}. Fee will come from the inputs first, if they can.
          * @param feeAssetID Optional. The assetID of the fees being burned.
          * @param memo Optional contains arbitrary bytes, up to 256 bytes
          * @param asOf Optional. The timestamp to verify the transaction against as a {@link https://github.com/indutny/bn.js/|BN}
          * @param locktime Optional. The locktime field created in the resulting outputs
          * @param threshold Optional. The number of signatures required to spend the funds in the resultant UTXO
          * @returns An unsigned transaction created from the passed in parameters.
          *
          */
        this.buildImportTx = (networkid, blockchainid, toAddresses, fromAddresses, changeAddresses, atomics, sourceChain = undefined, fee = undefined, feeAssetID = undefined, memo = undefined, asOf = helperfunctions_1.UnixNow(), locktime = new bn_js_1.default(0), threshold = 1) => {
            const zero = new bn_js_1.default(0);
            let ins = [];
            let outs = [];
            if (typeof fee === "undefined") {
                fee = zero.clone();
            }
            const importIns = [];
            let feepaid = new bn_js_1.default(0);
            let feeAssetStr = feeAssetID.toString("hex");
            for (let i = 0; i < atomics.length; i++) {
                const utxo = atomics[i];
                const assetID = utxo.getAssetID();
                const output = utxo.getOutput();
                let amt = output.getAmount().clone();
                let infeeamount = amt.clone();
                let assetStr = assetID.toString("hex");
                if (typeof feeAssetID !== "undefined" &&
                    fee.gt(zero) &&
                    feepaid.lt(fee) &&
                    assetStr === feeAssetStr) {
                    feepaid = feepaid.add(infeeamount);
                    if (feepaid.gt(fee)) {
                        infeeamount = feepaid.sub(fee);
                        feepaid = fee.clone();
                    }
                    else {
                        infeeamount = zero.clone();
                    }
                }
                const txid = utxo.getTxID();
                const outputidx = utxo.getOutputIdx();
                const input = new inputs_1.SECPTransferInput(amt);
                const xferin = new inputs_1.TransferableInput(txid, outputidx, assetID, input);
                const from = output.getAddresses();
                const spenders = output.getSpenders(from, asOf);
                for (let j = 0; j < spenders.length; j++) {
                    const idx = output.getAddressIdx(spenders[j]);
                    if (idx === -1) {
                        /* istanbul ignore next */
                        throw new Error('Error - UTXOSet.buildImportTx: no such '
                            + `address in output: ${spenders[j]}`);
                    }
                    xferin.getInput().addSignatureIdx(idx, spenders[j]);
                }
                importIns.push(xferin);
                //add extra outputs for each amount (calculated from the imported inputs), minus fees
                if (infeeamount.gt(zero)) {
                    const spendout = outputs_1.SelectOutputClass(output.getOutputID(), infeeamount, toAddresses, locktime, threshold);
                    const xferout = new outputs_1.TransferableOutput(assetID, spendout);
                    outs.push(xferout);
                }
            }
            // get remaining fees from the provided addresses
            let feeRemaining = fee.sub(feepaid);
            if (feeRemaining.gt(zero) && this._feeCheck(feeRemaining, feeAssetID)) {
                const aad = new AssetAmountDestination(toAddresses, fromAddresses, changeAddresses);
                aad.addAssetAmount(feeAssetID, zero, feeRemaining);
                const success = this.getMinimumSpendable(aad, asOf, locktime, threshold);
                if (typeof success === "undefined") {
                    ins = aad.getInputs();
                    outs = aad.getAllOutputs();
                }
                else {
                    throw success;
                }
            }
            const importTx = new importtx_1.ImportTx(networkid, blockchainid, outs, ins, memo, sourceChain, importIns);
            return new tx_1.UnsignedTx(importTx);
        };
        /**
        * Creates an unsigned ExportTx transaction.
        *
        * @param networkid The number representing NetworkID of the node
        * @param blockchainid The {@link https://github.com/feross/buffer|Buffer} representing the BlockchainID for the transaction
        * @param amount The amount being exported as a {@link https://github.com/indutny/bn.js/|BN}
        * @param djtxAssetID {@link https://github.com/feross/buffer|Buffer} of the asset ID for DJTX
        * @param toAddresses An array of addresses as {@link https://github.com/feross/buffer|Buffer} who recieves the DJTX
        * @param fromAddresses An array of addresses as {@link https://github.com/feross/buffer|Buffer} who owns the DJTX
        * @param changeAddresses Optional. The addresses that can spend the change remaining from the spent UTXOs.
        * @param fee Optional. The amount of fees to burn in its smallest denomination, represented as {@link https://github.com/indutny/bn.js/|BN}
        * @param destinationChain Optional. A {@link https://github.com/feross/buffer|Buffer} for the chainid where to send the asset.
        * @param feeAssetID Optional. The assetID of the fees being burned.
        * @param memo Optional contains arbitrary bytes, up to 256 bytes
        * @param asOf Optional. The timestamp to verify the transaction against as a {@link https://github.com/indutny/bn.js/|BN}
        * @param locktime Optional. The locktime field created in the resulting outputs
        * @param threshold Optional. The number of signatures required to spend the funds in the resultant UTXO
        * @returns An unsigned transaction created from the passed in parameters.
        *
        */
        this.buildExportTx = (networkid, blockchainid, amount, assetID, toAddresses, fromAddresses, changeAddresses = undefined, destinationChain = undefined, fee = undefined, feeAssetID = undefined, memo = undefined, asOf = helperfunctions_1.UnixNow(), locktime = new bn_js_1.default(0), threshold = 1) => {
            let ins = [];
            let outs = [];
            let exportouts = [];
            if (typeof changeAddresses === "undefined") {
                changeAddresses = toAddresses;
            }
            const zero = new bn_js_1.default(0);
            if (amount.eq(zero)) {
                return undefined;
            }
            if (typeof feeAssetID === "undefined") {
                feeAssetID = assetID;
            }
            if (typeof destinationChain === "undefined") {
                destinationChain = bintools.cb58Decode(constants_2.PlatformChainID);
            }
            const aad = new AssetAmountDestination(toAddresses, fromAddresses, changeAddresses);
            if (assetID.toString("hex") === feeAssetID.toString("hex")) {
                aad.addAssetAmount(assetID, amount, fee);
            }
            else {
                aad.addAssetAmount(assetID, amount, zero);
                if (this._feeCheck(fee, feeAssetID)) {
                    aad.addAssetAmount(feeAssetID, zero, fee);
                }
            }
            const success = this.getMinimumSpendable(aad, asOf, locktime, threshold);
            if (typeof success === "undefined") {
                ins = aad.getInputs();
                outs = aad.getChangeOutputs();
                exportouts = aad.getOutputs();
            }
            else {
                throw success;
            }
            const exportTx = new exporttx_1.ExportTx(networkid, blockchainid, outs, ins, memo, destinationChain, exportouts);
            return new tx_1.UnsignedTx(exportTx);
        };
    }
    //serialize is inherited
    deserialize(fields, encoding = "hex") {
        super.deserialize(fields, encoding);
        let utxos = {};
        for (let utxoid in fields["utxos"]) {
            let utxoidCleaned = serializer.decoder(utxoid, encoding, "base58", "base58");
            utxos[utxoidCleaned] = new UTXO();
            utxos[utxoidCleaned].deserialize(fields["utxos"][utxoid], encoding);
        }
        let addressUTXOs = {};
        for (let address in fields["addressUTXOs"]) {
            let addressCleaned = serializer.decoder(address, encoding, "cb58", "hex");
            let utxobalance = {};
            for (let utxoid in fields["addressUTXOs"][address]) {
                let utxoidCleaned = serializer.decoder(utxoid, encoding, "base58", "base58");
                utxobalance[utxoidCleaned] = serializer.decoder(fields["addressUTXOs"][address][utxoid], encoding, "decimalString", "BN");
            }
            addressUTXOs[addressCleaned] = utxobalance;
        }
        this.utxos = utxos;
        this.addressUTXOs = addressUTXOs;
    }
    parseUTXO(utxo) {
        const utxovar = new UTXO();
        // force a copy
        if (typeof utxo === 'string') {
            utxovar.fromBuffer(bintools.cb58Decode(utxo));
        }
        else if (utxo instanceof UTXO) {
            utxovar.fromBuffer(utxo.toBuffer()); // forces a copy
        }
        else {
            /* istanbul ignore next */
            throw new Error("Error - UTXO.parseUTXO: utxo parameter is not a UTXO or string");
        }
        return utxovar;
    }
    create(...args) {
        return new UTXOSet();
    }
    clone() {
        const newset = this.create();
        const allUTXOs = this.getAllUTXOs();
        newset.addArray(allUTXOs);
        return newset;
    }
    _feeCheck(fee, feeAssetID) {
        return (typeof fee !== "undefined" &&
            typeof feeAssetID !== "undefined" &&
            fee.gt(new bn_js_1.default(0)) && feeAssetID instanceof buffer_1.Buffer);
    }
}
exports.UTXOSet = UTXOSet;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXR4b3MuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9zcmMvYXBpcy9hdm0vdXR4b3MudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQUE7OztJQUdJO0FBQ0osb0NBQWlDO0FBQ2pDLG9FQUE0QztBQUM1QyxrREFBdUI7QUFDdkIsdUNBQXNKO0FBQ3RKLDJDQUEyQztBQUMzQyw2QkFBa0M7QUFDbEMscUNBQWdFO0FBQ2hFLCtCQUF5RztBQUV6RyxpRUFBc0Q7QUFDdEQsbURBQWdEO0FBRWhELDhDQUFtRTtBQUNuRSxtREFBZ0Q7QUFDaEQsK0NBQTRDO0FBQzVDLHFDQUFrQztBQUNsQyx5Q0FBc0M7QUFDdEMseUNBQXNDO0FBQ3RDLHFEQUF3RDtBQUN4RCwwREFBdUY7QUFDdkYsNkRBQThFO0FBRTlFOztHQUVHO0FBQ0gsTUFBTSxRQUFRLEdBQUcsa0JBQVEsQ0FBQyxXQUFXLEVBQUUsQ0FBQztBQUN4QyxNQUFNLFVBQVUsR0FBRyw2QkFBYSxDQUFDLFdBQVcsRUFBRSxDQUFDO0FBRS9DOztHQUVHO0FBQ0gsTUFBYSxJQUFLLFNBQVEsb0JBQVk7SUFBdEM7O1FBQ1ksY0FBUyxHQUFHLE1BQU0sQ0FBQztRQUNuQixZQUFPLEdBQUcsU0FBUyxDQUFDO0lBbUVoQyxDQUFDO0lBakVDLHdCQUF3QjtJQUV4QixXQUFXLENBQUMsTUFBYSxFQUFFLFdBQThCLEtBQUs7UUFDNUQsS0FBSyxDQUFDLFdBQVcsQ0FBQyxNQUFNLEVBQUUsUUFBUSxDQUFDLENBQUM7UUFDcEMsSUFBSSxDQUFDLE1BQU0sR0FBRywyQkFBaUIsQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQztRQUM3RCxJQUFJLENBQUMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLEVBQUUsUUFBUSxDQUFDLENBQUM7SUFDdEQsQ0FBQztJQUVELFVBQVUsQ0FBQyxLQUFZLEVBQUUsU0FBZ0IsQ0FB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QyxDQUFDLENBQUMsQ0FBQyxJQUFJLFVBQVUsWUFBWSxlQUFNLENBQUMsQ0FBQztJQUNyRCxDQUFDO0NBZ3NCRjtBQXp2QkQsMEJBeXZCQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQHBhY2thZ2VEb2N1bWVudGF0aW9uXG4gKiBAbW9kdWxlIEFQSS1BVk0tVVRYT3NcbiAgKi9cbmltcG9ydCB7IEJ1ZmZlciB9IGZyb20gJ2J1ZmZlci8nO1xuaW1wb3J0IEJpblRvb2xzIGZyb20gJy4uLy4uL3V0aWxzL2JpbnRvb2xzJztcbmltcG9ydCBCTiBmcm9tIFwiYm4uanNcIjtcbmltcG9ydCB7IEFtb3VudE91dHB1dCwgU2VsZWN0T3V0cHV0Q2xhc3MsIFRyYW5zZmVyYWJsZU91dHB1dCwgTkZUVHJhbnNmZXJPdXRwdXQsIE5GVE1pbnRPdXRwdXQsIFNFQ1BNaW50T3V0cHV0LCBTRUNQVHJhbnNmZXJPdXRwdXQgfSBmcm9tICcuL291dHB1dHMnO1xuaW1wb3J0IHsgQVZNQ29uc3RhbnRzIH0gZnJvbSAnLi9jb25zdGFudHMnO1xuaW1wb3J0IHsgVW5zaWduZWRUeCB9IGZyb20gJy4vdHgnO1xuaW1wb3J0IHsgU0VDUFRyYW5zZmVySW5wdXQsIFRyYW5zZmVyYWJsZUlucHV0IH0gZnJvbSAnLi9pbnB1dHMnO1xuaW1wb3J0IHsgTkZUVHJhbnNmZXJPcGVyYXRpb24sIFRyYW5zZmVyYWJsZU9wZXJhdGlvbiwgTkZUTWludE9wZXJhdGlvbiwgU0VDUE1pbnRPcGVyYXRpb24gfSBmcm9tICcuL29wcyc7XG5pbXBvcnQgeyBPdXRwdXQsIE91dHB1dE93bmVycyB9IGZyb20gJy4uLy4uL2NvbW1vbi9vdXRwdXQnO1xuaW1wb3J0IHsgVW5peE5vdyB9IGZyb20gJy4uLy4uL3V0aWxzL2hlbHBlcmZ1bmN0aW9ucyc7XG5pbXBvcnQgeyBJbml0aWFsU3RhdGVzIH0gZnJvbSAnLi9pbml0aWFsc3RhdGVzJztcbmltcG9ydCB7IE1pbnRlclNldCB9IGZyb20gJy4vbWludGVyc2V0JztcbmltcG9ydCB7IFN0YW5kYXJkVVRYTywgU3RhbmRhcmRVVFhPU2V0IH0gZnJvbSAnLi4vLi4vY29tbW9uL3V0eG9zJztcbmltcG9ydCB7IENyZWF0ZUFzc2V0VHggfSBmcm9tICcuL2NyZWF0ZWFzc2V0dHgnO1xuaW1wb3J0IHsgT3BlcmF0aW9uVHggfSBmcm9tICcuL29wZXJhdGlvbnR4JztcbmltcG9ydCB7IEJhc2VUeCB9IGZyb20gJy4vYmFzZXR4JztcbmltcG9ydCB7IEV4cG9ydFR4IH0gZnJvbSAnLi9leHBvcnR0eCc7XG5pbXBvcnQgeyBJbXBvcnRUeCB9IGZyb20gJy4vaW1wb3J0dHgnO1xuaW1wb3J0IHsgUGxhdGZvcm1DaGFpbklEIH0gZnJvbSAnLi4vLi4vdXRpbHMvY29uc3RhbnRzJztcbmltcG9ydCB7IFN0YW5kYXJkQXNzZXRBbW91bnREZXN0aW5hdGlvbiwgQXNzZXRBbW91bnQgfSBmcm9tICcuLi8uLi9jb21tb24vYXNzZXRhbW91bnQnO1xuaW1wb3J0IHsgU2VyaWFsaXphdGlvbiwgU2VyaWFsaXplZEVuY29kaW5nIH0gZnJvbSAnLi4vLi4vdXRpbHMvc2VyaWFsaXphdGlvbic7XG5cbi8qKlxuICogQGlnbm9yZVxuICovXG5jb25zdCBiaW50b29scyA9IEJpblRvb2xzLmdldEluc3RhbmNlKCk7XG5jb25zdCBzZXJpYWxpemVyID0gU2VyaWFsaXphdGlvbi5nZXRJbnN0YW5jZSgpO1xuXG4vKipcbiAqIENsYXNzIGZvciByZXByZXNlbnRpbmcgYSBzaW5nbGUgVVRYTy5cbiAqL1xuZXhwb3J0IGNsYXNzIFVUWE8gZXh0ZW5kcyBTdGFuZGFyZFVUWE8ge1xuICBwcm90ZWN0ZWQgX3R5cGVOYW1lID0gXCJVVFhPXCI7XG4gIHByb3RlY3RlZCBfdHlwZUlEID0gdW5kZWZpbmVkO1xuXG4gIC8vc2VyaWFsaXplIGlzIGluaGVyaXRlZFxuXG4gIGRlc2VyaWFsaXplKGZpZWxkczpvYmplY3QsIGVuY29kaW5nOlNlcmlhbGl6ZWRFbmNvZGluZyA9IFwiaGV4XCIpIHtcbiAgICBzdXBlci5kZXNlcmlhbGl6ZShmaWVsZHMsIGVuY29kaW5nKTtcbiAgICB0aGlzLm91dHB1dCA9IFNlbGVjdE91dHB1dENsYXNzKGZpZWxkc1tcIm91dHB1dFwiXVtcIl90eXBlSURcIl0pO1xuICAgIHRoaXMub3V0cHV0LmRlc2VyaWFsaXplKGZpZWxkc1tcIm91dHB1dFwiXSwgZW5jb2RpbmcpO1xuICB9XG5cbiAgZnJvbUJ1ZmZlcihieXRlczpCdWZmZXIsIG9mZnNldDpudW1iZXIgPSAwKTpudW1iZXIge1xuICAgIHRoaXMuY29kZWNpZCA9IGJpbnRvb2xzLmNvcHlGcm9tKGJ5dGVzLCBvZmZzZXQsIG9mZnNldCArIDIpO1xuICAgIG9mZnNldCArPSAyO1xuICAgIHRoaXMudHhpZCA9IGJpbnRvb2xzLmNvcHlGcm9tKGJ5dGVzLCBvZmZzZXQsIG9mZnNldCArIDMyKTtcbiAgICBvZmZzZXQgKz0gMzI7XG4gICAgdGhpcy5vdXRwdXRpZHggPSBiaW50b29scy5jb3B5RnJvbShieXRlcywgb2Zmc2V0LCBvZmZzZXQgKyA0KTtcbiAgICBvZmZzZXQgKz0gNDtcbiAgICB0aGlzLmFzc2V0aWQgPSBiaW50b29scy5jb3B5RnJvbShieXRlcywgb2Zmc2V0LCBvZmZzZXQgKyAzMik7XG4gICAgb2Zmc2V0ICs9IDMyO1xuICAgIGNvbnN0IG91dHB1dGlkOm51bWJlciA9IGJpbnRvb2xzLmNvcHlGcm9tKGJ5dGVzLCBvZmZzZXQsIG9mZnNldCArIDQpLnJlYWRVSW50MzJCRSgwKTtcbiAgICBvZmZzZXQgKz0gNDtcbiAgICB0aGlzLm91dHB1dCA9IFNlbGVjdE91dHB1dENsYXNzKG91dHB1dGlkKTtcbiAgICByZXR1cm4gdGhpcy5vdXRwdXQuZnJvbUJ1ZmZlcihieXRlcywgb2Zmc2V0KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBUYWtlcyBhIGJhc2UtNTggc3RyaW5nIGNvbnRhaW5pbmcgYSBbW1VUWE9dXSwgcGFyc2VzIGl0LCBwb3B1bGF0ZXMgdGhlIGNsYXNzLCBhbmQgcmV0dXJucyB0aGUgbGVuZ3RoIG9mIHRoZSBTdGFuZGFyZFVUWE8gaW4gYnl0ZXMuXG4gICAqXG4gICAqIEBwYXJhbSBzZXJpYWxpemVkIEEgYmFzZS01OCBzdHJpbmcgY29udGFpbmluZyBhIHJhdyBbW1VUWE9dXVxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgbGVuZ3RoIG9mIHRoZSByYXcgW1tVVFhPXV1cbiAgICpcbiAgICogQHJlbWFya3NcbiAgICogdW5saWtlIG1vc3QgZnJvbVN0cmluZ3MsIGl0IGV4cGVjdHMgdGhlIHN0cmluZyB0byBiZSBzZXJpYWxpemVkIGluIGNiNTggZm9ybWF0XG4gICAqL1xuICBmcm9tU3RyaW5nKHNlcmlhbGl6ZWQ6c3RyaW5nKTpudW1iZXIge1xuICAgICAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cbiAgICAgIHJldHVybiB0aGlzLmZyb21CdWZmZXIoYmludG9vbHMuY2I1OERlY29kZShzZXJpYWxpemVkKSk7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyBhIGJhc2UtNTggcmVwcmVzZW50YXRpb24gb2YgdGhlIFtbVVRYT11dLlxuICAgKlxuICAgKiBAcmVtYXJrc1xuICAgKiB1bmxpa2UgbW9zdCB0b1N0cmluZ3MsIHRoaXMgcmV0dXJucyBpbiBjYjU4IHNlcmlhbGl6YXRpb24gZm9ybWF0XG4gICAqL1xuICB0b1N0cmluZygpOnN0cmluZyB7XG4gICAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cbiAgICByZXR1cm4gYmludG9vbHMuY2I1OEVuY29kZSh0aGlzLnRvQnVmZmVyKCkpO1xuICB9XG5cbiAgY2xvbmUoKTp0aGlzIHtcbiAgICBjb25zdCB1dHhvOlVUWE8gPSBuZXcgVVRYTygpO1xuICAgIHV0eG8uZnJvbUJ1ZmZlcih0aGlzLnRvQnVmZmVyKCkpO1xuICAgIHJldHVybiB1dHhvIGFzIHRoaXM7XG4gIH1cblxuICBjcmVhdGUoXG4gICAgY29kZWNJRDpudW1iZXIgPSBBVk1Db25zdGFudHMuTEFURVNUQ09ERUMsIFxuICAgIHR4aWQ6QnVmZmVyID0gdW5kZWZpbmVkLFxuICAgIG91dHB1dGlkeDpCdWZmZXIgfCBudW1iZXIgPSB1bmRlZmluZWQsXG4gICAgYXNzZXRpZDpCdWZmZXIgPSB1bmRlZmluZWQsXG4gICAgb3V0cHV0Ok91dHB1dCA9IHVuZGVmaW5lZCk6dGhpcyBcbiAge1xuICAgIHJldHVybiBuZXcgVVRYTyhjb2RlY0lELCB0eGlkLCBvdXRwdXRpZHgsIGFzc2V0aWQsIG91dHB1dCkgYXMgdGhpcztcbiAgfVxuXG59XG5cbmV4cG9ydCBjbGFzcyBBc3NldEFtb3VudERlc3RpbmF0aW9uIGV4dGVuZHMgU3RhbmRhcmRBc3NldEFtb3VudERlc3RpbmF0aW9uPFRyYW5zZmVyYWJsZU91dHB1dCwgVHJhbnNmZXJhYmxlSW5wdXQ+IHt9XG5cbi8qKlxuICogQ2xhc3MgcmVwcmVzZW50aW5nIGEgc2V0IG9mIFtbVVRYT11dcy5cbiAqL1xuZXhwb3J0IGNsYXNzIFVUWE9TZXQgZXh0ZW5kcyBTdGFuZGFyZFVUWE9TZXQ8VVRYTz57XG4gIHByb3RlY3RlZCBfdHlwZU5hbWUgPSBcIlVUWE9TZXRcIjtcbiAgcHJvdGVjdGVkIF90eXBlSUQgPSB1bmRlZmluZWQ7XG4gIFxuICAvL3NlcmlhbGl6ZSBpcyBpbmhlcml0ZWRcblxuICBkZXNlcmlhbGl6ZShmaWVsZHM6b2JqZWN0LCBlbmNvZGluZzpTZXJpYWxpemVkRW5jb2RpbmcgPSBcImhleFwiKSB7XG4gICAgc3VwZXIuZGVzZXJpYWxpemUoZmllbGRzLCBlbmNvZGluZyk7XG4gICAgbGV0IHV0eG9zID0ge307XG4gICAgZm9yKGxldCB1dHhvaWQgaW4gZmllbGRzW1widXR4b3NcIl0pe1xuICAgICAgbGV0IHV0eG9pZENsZWFuZWQ6c3RyaW5nID0gc2VyaWFsaXplci5kZWNvZGVyKHV0eG9pZCwgZW5jb2RpbmcsIFwiYmFzZTU4XCIsIFwiYmFzZTU4XCIpO1xuICAgICAgdXR4b3NbdXR4b2lkQ2xlYW5lZF0gPSBuZXcgVVRYTygpO1xuICAgICAgdXR4b3NbdXR4b2lkQ2xlYW5lZF0uZGVzZXJpYWxpemUoZmllbGRzW1widXR4b3NcIl1bdXR4b2lkXSwgZW5jb2RpbmcpO1xuICAgIH1cbiAgICBsZXQgYWRkcmVzc1VUWE9zID0ge307XG4gICAgZm9yKGxldCBhZGRyZXNzIGluIGZpZWxkc1tcImFkZHJlc3NVVFhPc1wiXSl7XG4gICAgICBsZXQgYWRkcmVzc0NsZWFuZWQ6c3RyaW5nID0gc2VyaWFsaXplci5kZWNvZGVyKGFkZHJlc3MsIGVuY29kaW5nLCBcImNiNThcIiwgXCJoZXhcIik7XG4gICAgICBsZXQgdXR4b2JhbGFuY2UgPSB7fTtcbiAgICAgIGZvcihsZXQgdXR4b2lkIGluIGZpZWxkc1tcImFkZHJlc3NVVFhPc1wiXVthZGRyZXNzXSl7XG4gICAgICAgIGxldCB1dHhvaWRDbGVhbmVkOnN0cmluZyA9IHNlcmlhbGl6ZXIuZGVjb2Rlcih1dHhvaWQsIGVuY29kaW5nLCBcImJhc2U1OFwiLCBcImJhc2U1OFwiKTtcbiAgICAgICAgdXR4b2JhbGFuY2VbdXR4b2lkQ2xlYW5lZF0gPSBzZXJpYWxpemVyLmRlY29kZXIoZmllbGRzW1wiYWRkcmVzc1VUWE9zXCJdW2FkZHJlc3NdW3V0eG9pZF0sIGVuY29kaW5nLCBcImRlY2ltYWxTdHJpbmdcIiwgXCJCTlwiKTtcbiAgICAgIH1cbiAgICAgIGFkZHJlc3NVVFhPc1thZGRyZXNzQ2xlYW5lZF0gPSB1dHhvYmFsYW5jZTtcbiAgICB9XG4gICAgdGhpcy51dHhvcyA9IHV0eG9zO1xuICAgIHRoaXMuYWRkcmVzc1VUWE9zID0gYWRkcmVzc1VUWE9zO1xuICB9XG5cbiAgcGFyc2VVVFhPKHV0eG86VVRYTyB8IHN0cmluZyk6VVRYTyB7XG4gICAgY29uc3QgdXR4b3ZhcjpVVFhPID0gbmV3IFVUWE8oKTtcbiAgICAvLyBmb3JjZSBhIGNvcHlcbiAgICBpZiAodHlwZW9mIHV0eG8gPT09ICdzdHJpbmcnKSB7XG4gICAgICB1dHhvdmFyLmZyb21CdWZmZXIoYmludG9vbHMuY2I1OERlY29kZSh1dHhvKSk7XG4gICAgfSBlbHNlIGlmICh1dHhvIGluc3RhbmNlb2YgVVRYTykge1xuICAgICAgdXR4b3Zhci5mcm9tQnVmZmVyKHV0eG8udG9CdWZmZXIoKSk7IC8vIGZvcmNlcyBhIGNvcHlcbiAgICB9IGVsc2Uge1xuICAgICAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cbiAgICAgIHRocm93IG5ldyBFcnJvcihcIkVycm9yIC0gVVRYTy5wYXJzZVVUWE86IHV0eG8gcGFyYW1ldGVyIGlzIG5vdCBhIFVUWE8gb3Igc3RyaW5nXCIpO1xuICAgIH1cbiAgICByZXR1cm4gdXR4b3ZhclxuICB9XG5cbiAgY3JlYXRlKC4uLmFyZ3M6YW55W10pOnRoaXN7XG4gICAgcmV0dXJuIG5ldyBVVFhPU2V0KCkgYXMgdGhpcztcbiAgfVxuXG4gIGNsb25lKCk6dGhpcyB7XG4gICAgY29uc3QgbmV3c2V0OlVUWE9TZXQgPSB0aGlzLmNyZWF0ZSgpO1xuICAgIGNvbnN0IGFsbFVUWE9zOkFycmF5PFVUWE8+ID0gdGhpcy5nZXRBbGxVVFhPcygpO1xuICAgIG5ld3NldC5hZGRBcnJheShhbGxVVFhPcylcbiAgICByZXR1cm4gbmV3c2V0IGFzIHRoaXM7XG4gIH1cblxuICBfZmVlQ2hlY2soZmVlOkJOLCBmZWVBc3NldElEOkJ1ZmZlcik6Ym9vbGVhbiB7XG4gICAgcmV0dXJuICh0eXBlb2YgZmVlICE9PSBcInVuZGVmaW5lZFwiICYmIFxuICAgIHR5cGVvZiBmZWVBc3NldElEICE9PSBcInVuZGVmaW5lZFwiICYmXG4gICAgZmVlLmd0KG5ldyBCTigwKSkgJiYgZmVlQXNzZXRJRCBpbnN0YW5jZW9mIEJ1ZmZlcik7XG4gIH1cblxuICBnZXRNaW5pbXVtU3BlbmRhYmxlID0gKGFhZDpBc3NldEFtb3VudERlc3RpbmF0aW9uLCBhc09mOkJOID0gVW5peE5vdygpLCBsb2NrdGltZTpCTiA9IG5ldyBCTigwKSwgdGhyZXNob2xkOm51bWJlciA9IDEpOkVycm9yID0+IHtcbiAgICBjb25zdCB1dHhvQXJyYXk6QXJyYXk8VVRYTz4gPSB0aGlzLmdldEFsbFVUWE9zKCk7XG4gICAgY29uc3Qgb3V0aWRzOm9iamVjdCA9IHt9O1xuICAgIGZvcihsZXQgaSA9IDA7IGkgPCB1dHhvQXJyYXkubGVuZ3RoICYmICFhYWQuY2FuQ29tcGxldGUoKTsgaSsrKSB7XG4gICAgICBjb25zdCB1OlVUWE8gPSB1dHhvQXJyYXlbaV07XG4gICAgICBjb25zdCBhc3NldEtleTpzdHJpbmcgPSB1LmdldEFzc2V0SUQoKS50b1N0cmluZyhcImhleFwiKTtcbiAgICAgIGNvbnN0IGZyb21BZGRyZXNzZXM6QXJyYXk8QnVmZmVyPiA9IGFhZC5nZXRTZW5kZXJzKCk7XG4gICAgICBpZih1LmdldE91dHB1dCgpIGluc3RhbmNlb2YgQW1vdW50T3V0cHV0ICYmIGFhZC5hc3NldEV4aXN0cyhhc3NldEtleSkgJiYgdS5nZXRPdXRwdXQoKS5tZWV0c1RocmVzaG9sZChmcm9tQWRkcmVzc2VzLCBhc09mKSkge1xuICAgICAgICBjb25zdCBhbTpBc3NldEFtb3VudCA9IGFhZC5nZXRBc3NldEFtb3VudChhc3NldEtleSk7XG4gICAgICAgIGlmKCFhbS5pc0ZpbmlzaGVkKCkpe1xuICAgICAgICAgIGNvbnN0IHVvdXQ6QW1vdW50T3V0cHV0ID0gdS5nZXRPdXRwdXQoKSBhcyBBbW91bnRPdXRwdXQ7XG4gICAgICAgICAgb3V0aWRzW2Fzc2V0S2V5XSA9IHVvdXQuZ2V0T3V0cHV0SUQoKTtcbiAgICAgICAgICBjb25zdCBhbW91bnQgPSB1b3V0LmdldEFtb3VudCgpO1xuICAgICAgICAgIGFtLnNwZW5kQW1vdW50KGFtb3VudCk7XG4gICAgICAgICAgY29uc3QgdHhpZDpCdWZmZXIgPSB1LmdldFR4SUQoKTtcbiAgICAgICAgICBjb25zdCBvdXRwdXRpZHg6QnVmZmVyID0gdS5nZXRPdXRwdXRJZHgoKTtcbiAgICAgICAgICBjb25zdCBpbnB1dDpTRUNQVHJhbnNmZXJJbnB1dCA9IG5ldyBTRUNQVHJhbnNmZXJJbnB1dChhbW91bnQpO1xuICAgICAgICAgIGNvbnN0IHhmZXJpbjpUcmFuc2ZlcmFibGVJbnB1dCA9IG5ldyBUcmFuc2ZlcmFibGVJbnB1dCh0eGlkLCBvdXRwdXRpZHgsIHUuZ2V0QXNzZXRJRCgpLCBpbnB1dCk7XG4gICAgICAgICAgY29uc3Qgc3BlbmRlcnM6QXJyYXk8QnVmZmVyPiA9IHVvdXQuZ2V0U3BlbmRlcnMoZnJvbUFkZHJlc3NlcywgYXNPZik7XG4gICAgICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCBzcGVuZGVycy5sZW5ndGg7IGorKykge1xuICAgICAgICAgICAgY29uc3QgaWR4Om51bWJlciA9IHVvdXQuZ2V0QWRkcmVzc0lkeChzcGVuZGVyc1tqXSk7XG4gICAgICAgICAgICBpZiAoaWR4ID09PSAtMSkge1xuICAgICAgICAgICAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xuICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0Vycm9yIC0gVVRYT1NldC5nZXRNaW5pbXVtU3BlbmRhYmxlOiBubyBzdWNoICdcbiAgICAgICAgICAgICAgKyBgYWRkcmVzcyBpbiBvdXRwdXQ6ICR7c3BlbmRlcnNbal19YCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB4ZmVyaW4uZ2V0SW5wdXQoKS5hZGRTaWduYXR1cmVJZHgoaWR4LCBzcGVuZGVyc1tqXSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGFhZC5hZGRJbnB1dCh4ZmVyaW4pO1xuICAgICAgICB9IGVsc2UgaWYoYWFkLmFzc2V0RXhpc3RzKGFzc2V0S2V5KSAmJiAhKHUuZ2V0T3V0cHV0KCkgaW5zdGFuY2VvZiBBbW91bnRPdXRwdXQpKXtcbiAgICAgICAgICAvKipcbiAgICAgICAgICAgKiBMZWF2aW5nIHRoZSBiZWxvdyBsaW5lcywgbm90IHNpbXBseSBmb3IgcG9zdGVyaXR5LCBidXQgZm9yIGNsYXJpZmljYXRpb24uXG4gICAgICAgICAgICogQXNzZXRJRHMgbWF5IGhhdmUgbWl4ZWQgT3V0cHV0VHlwZXMuIFxuICAgICAgICAgICAqIFNvbWUgb2YgdGhvc2UgT3V0cHV0VHlwZXMgbWF5IGltcGxlbWVudCBBbW91bnRPdXRwdXQuXG4gICAgICAgICAgICogT3RoZXJzIG1heSBub3QuXG4gICAgICAgICAgICogU2ltcGx5IGNvbnRpbnVlIGluIHRoaXMgY29uZGl0aW9uLlxuICAgICAgICAgICAqL1xuICAgICAgICAgIC8qcmV0dXJuIG5ldyBFcnJvcignRXJyb3IgLSBVVFhPU2V0LmdldE1pbmltdW1TcGVuZGFibGU6IG91dHB1dElEIGRvZXMgbm90ICdcbiAgICAgICAgICAgICsgYGltcGxlbWVudCBBbW91bnRPdXRwdXQ6ICR7dS5nZXRPdXRwdXQoKS5nZXRPdXRwdXRJRH1gKTsqL1xuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgaWYoIWFhZC5jYW5Db21wbGV0ZSgpKSB7XG4gICAgICByZXR1cm4gbmV3IEVycm9yKCdFcnJvciAtIFVUWE9TZXQuZ2V0TWluaW11bVNwZW5kYWJsZTogaW5zdWZmaWNpZW50ICdcbiAgICAgICsgJ2Z1bmRzIHRvIGNyZWF0ZSB0aGUgdHJhbnNhY3Rpb24nKTtcbiAgICB9XG4gICAgY29uc3QgYW1vdW50czpBcnJheTxBc3NldEFtb3VudD4gPSBhYWQuZ2V0QW1vdW50cygpO1xuICAgIGNvbnN0IHplcm86Qk4gPSBuZXcgQk4oMCk7XG4gICAgZm9yKGxldCBpID0gMDsgaSA8IGFtb3VudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IGFzc2V0S2V5OnN0cmluZyA9IGFtb3VudHNbaV0uZ2V0QXNzZXRJRFN0cmluZygpO1xuICAgICAgY29uc3QgYW1vdW50OkJOID0gYW1vdW50c1tpXS5nZXRBbW91bnQoKTtcbiAgICAgIGlmIChhbW91bnQuZ3QoemVybykpIHtcbiAgICAgICAgY29uc3Qgc3BlbmRvdXQ6QW1vdW50T3V0cHV0ID0gU2VsZWN0T3V0cHV0Q2xhc3Mob3V0aWRzW2Fzc2V0S2V5XSxcbiAgICAgICAgICBhbW91bnQsIGFhZC5nZXREZXN0aW5hdGlvbnMoKSwgbG9ja3RpbWUsIHRocmVzaG9sZCkgYXMgQW1vdW50T3V0cHV0O1xuICAgICAgICBjb25zdCB4ZmVyb3V0OlRyYW5zZmVyYWJsZU91dHB1dCA9IG5ldyBUcmFuc2ZlcmFibGVPdXRwdXQoYW1vdW50c1tpXS5nZXRBc3NldElEKCksIHNwZW5kb3V0KTtcbiAgICAgICAgYWFkLmFkZE91dHB1dCh4ZmVyb3V0KTtcbiAgICAgIH1cbiAgICAgIGNvbnN0IGNoYW5nZTpCTiA9IGFtb3VudHNbaV0uZ2V0Q2hhbmdlKCk7XG4gICAgICBpZiAoY2hhbmdlLmd0KHplcm8pKSB7XG4gICAgICAgIGNvbnN0IGNoYW5nZW91dDpBbW91bnRPdXRwdXQgPSBTZWxlY3RPdXRwdXRDbGFzcyhvdXRpZHNbYXNzZXRLZXldLFxuICAgICAgICAgIGNoYW5nZSwgYWFkLmdldENoYW5nZUFkZHJlc3NlcygpKSBhcyBBbW91bnRPdXRwdXQ7XG4gICAgICAgIGNvbnN0IGNoZ3hmZXJvdXQ6VHJhbnNmZXJhYmxlT3V0cHV0ID0gbmV3IFRyYW5zZmVyYWJsZU91dHB1dChhbW91bnRzW2ldLmdldEFzc2V0SUQoKSwgY2hhbmdlb3V0KTtcbiAgICAgICAgYWFkLmFkZENoYW5nZShjaGd4ZmVyb3V0KTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGFuIFtbVW5zaWduZWRUeF1dIHdyYXBwaW5nIGEgW1tCYXNlVHhdXS4gRm9yIG1vcmUgZ3JhbnVsYXIgY29udHJvbCwgeW91IG1heSBjcmVhdGUgeW91ciBvd25cbiAgICogW1tVbnNpZ25lZFR4XV0gd3JhcHBpbmcgYSBbW0Jhc2VUeF1dIG1hbnVhbGx5ICh3aXRoIHRoZWlyIGNvcnJlc3BvbmRpbmcgW1tUcmFuc2ZlcmFibGVJbnB1dF1dcyBhbmQgW1tUcmFuc2ZlcmFibGVPdXRwdXRdXXMpLlxuICAgKlxuICAgKiBAcGFyYW0gbmV0d29ya2lkIFRoZSBudW1iZXIgcmVwcmVzZW50aW5nIE5ldHdvcmtJRCBvZiB0aGUgbm9kZVxuICAgKiBAcGFyYW0gYmxvY2tjaGFpbmlkIFRoZSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSByZXByZXNlbnRpbmcgdGhlIEJsb2NrY2hhaW5JRCBmb3IgdGhlIHRyYW5zYWN0aW9uXG4gICAqIEBwYXJhbSBhbW91bnQgVGhlIGFtb3VudCBvZiB0aGUgYXNzZXQgdG8gYmUgc3BlbnQgaW4gaXRzIHNtYWxsZXN0IGRlbm9taW5hdGlvbiwgcmVwcmVzZW50ZWQgYXMge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9pbmR1dG55L2JuLmpzL3xCTn0uXG4gICAqIEBwYXJhbSBhc3NldElEIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IG9mIHRoZSBhc3NldCBJRCBmb3IgdGhlIFVUWE9cbiAgICogQHBhcmFtIHRvQWRkcmVzc2VzIFRoZSBhZGRyZXNzZXMgdG8gc2VuZCB0aGUgZnVuZHNcbiAgICogQHBhcmFtIGZyb21BZGRyZXNzZXMgVGhlIGFkZHJlc3NlcyBiZWluZyB1c2VkIHRvIHNlbmQgdGhlIGZ1bmRzIGZyb20gdGhlIFVUWE9zIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9XG4gICAqIEBwYXJhbSBjaGFuZ2VBZGRyZXNzZXMgT3B0aW9uYWwuIFRoZSBhZGRyZXNzZXMgdGhhdCBjYW4gc3BlbmQgdGhlIGNoYW5nZSByZW1haW5pbmcgZnJvbSB0aGUgc3BlbnQgVVRYT3MuIERlZmF1bHQ6IHRvQWRkcmVzc2VzXG4gICAqIEBwYXJhbSBmZWUgT3B0aW9uYWwuIFRoZSBhbW91bnQgb2YgZmVlcyB0byBidXJuIGluIGl0cyBzbWFsbGVzdCBkZW5vbWluYXRpb24sIHJlcHJlc2VudGVkIGFzIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vaW5kdXRueS9ibi5qcy98Qk59XG4gICAqIEBwYXJhbSBmZWVBc3NldElEIE9wdGlvbmFsLiBUaGUgYXNzZXRJRCBvZiB0aGUgZmVlcyBiZWluZyBidXJuZWQuIERlZmF1bHQ6IGFzc2V0SURcbiAgICogQHBhcmFtIG1lbW8gT3B0aW9uYWwuIENvbnRhaW5zIGFyYml0cmFyeSBkYXRhLCB1cCB0byAyNTYgYnl0ZXNcbiAgICogQHBhcmFtIGFzT2YgT3B0aW9uYWwuIFRoZSB0aW1lc3RhbXAgdG8gdmVyaWZ5IHRoZSB0cmFuc2FjdGlvbiBhZ2FpbnN0IGFzIGEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9pbmR1dG55L2JuLmpzL3xCTn1cbiAgICogQHBhcmFtIGxvY2t0aW1lIE9wdGlvbmFsLiBUaGUgbG9ja3RpbWUgZmllbGQgY3JlYXRlZCBpbiB0aGUgcmVzdWx0aW5nIG91dHB1dHNcbiAgICogQHBhcmFtIHRocmVzaG9sZCBPcHRpb25hbC4gVGhlIG51bWJlciBvZiBzaWduYXR1cmVzIHJlcXVpcmVkIHRvIHNwZW5kIHRoZSBmdW5kcyBpbiB0aGUgcmVzdWx0YW50IFVUWE9cbiAgICogXG4gICAqIEByZXR1cm5zIEFuIHVuc2lnbmVkIHRyYW5zYWN0aW9uIGNyZWF0ZWQgZnJvbSB0aGUgcGFzc2VkIGluIHBhcmFtZXRlcnMuXG4gICAqXG4gICAqL1xuICBidWlsZEJhc2VUeCA9IChcbiAgICBuZXR3b3JraWQ6bnVtYmVyLFxuICAgIGJsb2NrY2hhaW5pZDpCdWZmZXIsXG4gICAgYW1vdW50OkJOLFxuICAgIGFzc2V0SUQ6QnVmZmVyLFxuICAgIHRvQWRkcmVzc2VzOkFycmF5PEJ1ZmZlcj4sXG4gICAgZnJvbUFkZHJlc3NlczpBcnJheTxCdWZmZXI+LFxuICAgIGNoYW5nZUFkZHJlc3NlczpBcnJheTxCdWZmZXI+ID0gdW5kZWZpbmVkLFxuICAgIGZlZTpCTiA9IHVuZGVmaW5lZCxcbiAgICBmZWVBc3NldElEOkJ1ZmZlciA9IHVuZGVmaW5lZCxcbiAgICBtZW1vOkJ1ZmZlciA9IHVuZGVmaW5lZCxcbiAgICBhc09mOkJOID0gVW5peE5vdygpLFxuICAgIGxvY2t0aW1lOkJOID0gbmV3IEJOKDApLFxuICAgIHRocmVzaG9sZDpudW1iZXIgPSAxXG4gICk6VW5zaWduZWRUeCA9PiB7XG5cbiAgICBpZih0aHJlc2hvbGQgPiB0b0FkZHJlc3Nlcy5sZW5ndGgpIHtcbiAgICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJFcnJvciAtIFVUWE9TZXQuYnVpbGRCYXNlVHg6IHRocmVzaG9sZCBpcyBncmVhdGVyIHRoYW4gbnVtYmVyIG9mIGFkZHJlc3Nlc1wiKTtcbiAgICB9XG5cbiAgICBpZih0eXBlb2YgY2hhbmdlQWRkcmVzc2VzID09PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICBjaGFuZ2VBZGRyZXNzZXMgPSB0b0FkZHJlc3NlcztcbiAgICB9XG5cbiAgICBpZih0eXBlb2YgZmVlQXNzZXRJRCA9PT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgZmVlQXNzZXRJRCA9IGFzc2V0SUQ7XG4gICAgfVxuXG4gICAgY29uc3QgemVybzpCTiA9IG5ldyBCTigwKTtcbiAgICBcbiAgICBpZiAoYW1vdW50LmVxKHplcm8pKSB7XG4gICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgIH1cblxuICAgIGNvbnN0IGFhZDpBc3NldEFtb3VudERlc3RpbmF0aW9uID0gbmV3IEFzc2V0QW1vdW50RGVzdGluYXRpb24odG9BZGRyZXNzZXMsIGZyb21BZGRyZXNzZXMsIGNoYW5nZUFkZHJlc3Nlcyk7XG4gICAgaWYoYXNzZXRJRC50b1N0cmluZyhcImhleFwiKSA9PT0gZmVlQXNzZXRJRC50b1N0cmluZyhcImhleFwiKSl7XG4gICAgICBhYWQuYWRkQXNzZXRBbW91bnQoYXNzZXRJRCwgYW1vdW50LCBmZWUpO1xuICAgIH0gZWxzZSB7XG4gICAgICBhYWQuYWRkQXNzZXRBbW91bnQoYXNzZXRJRCwgYW1vdW50LCB6ZXJvKTtcbiAgICAgIGlmKHRoaXMuX2ZlZUNoZWNrKGZlZSwgZmVlQXNzZXRJRCkpIHtcbiAgICAgICAgYWFkLmFkZEFzc2V0QW1vdW50KGZlZUFzc2V0SUQsIHplcm8sIGZlZSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgbGV0IGluczpBcnJheTxUcmFuc2ZlcmFibGVJbnB1dD4gPSBbXTtcbiAgICBsZXQgb3V0czpBcnJheTxUcmFuc2ZlcmFibGVPdXRwdXQ+ID0gW107XG4gICAgXG4gICAgY29uc3Qgc3VjY2VzczpFcnJvciA9IHRoaXMuZ2V0TWluaW11bVNwZW5kYWJsZShhYWQsIGFzT2YsIGxvY2t0aW1lLCB0aHJlc2hvbGQpO1xuICAgIGlmKHR5cGVvZiBzdWNjZXNzID09PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICBpbnMgPSBhYWQuZ2V0SW5wdXRzKCk7XG4gICAgICBvdXRzID0gYWFkLmdldEFsbE91dHB1dHMoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhyb3cgc3VjY2VzcztcbiAgICB9XG5cbiAgICBjb25zdCBiYXNlVHg6QmFzZVR4ID0gbmV3IEJhc2VUeChuZXR3b3JraWQsIGJsb2NrY2hhaW5pZCwgb3V0cywgaW5zLCBtZW1vKTtcbiAgICByZXR1cm4gbmV3IFVuc2lnbmVkVHgoYmFzZVR4KTtcblxuICB9O1xuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGFuIHVuc2lnbmVkIENyZWF0ZSBBc3NldCB0cmFuc2FjdGlvbi4gRm9yIG1vcmUgZ3JhbnVsYXIgY29udHJvbCwgeW91IG1heSBjcmVhdGUgeW91ciBvd25cbiAgICogW1tDcmVhdGVBc3NldFRYXV0gbWFudWFsbHkgKHdpdGggdGhlaXIgY29ycmVzcG9uZGluZyBbW1RyYW5zZmVyYWJsZUlucHV0XV1zLCBbW1RyYW5zZmVyYWJsZU91dHB1dF1dcykuXG4gICAqIFxuICAgKiBAcGFyYW0gbmV0d29ya2lkIFRoZSBudW1iZXIgcmVwcmVzZW50aW5nIE5ldHdvcmtJRCBvZiB0aGUgbm9kZVxuICAgKiBAcGFyYW0gYmxvY2tjaGFpbmlkIFRoZSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSByZXByZXNlbnRpbmcgdGhlIEJsb2NrY2hhaW5JRCBmb3IgdGhlIHRyYW5zYWN0aW9uXG4gICAqIEBwYXJhbSBmcm9tQWRkcmVzc2VzIFRoZSBhZGRyZXNzZXMgYmVpbmcgdXNlZCB0byBzZW5kIHRoZSBmdW5kcyBmcm9tIHRoZSBVVFhPcyB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfVxuICAgKiBAcGFyYW0gY2hhbmdlQWRkcmVzc2VzIE9wdGlvbmFsLiBUaGUgYWRkcmVzc2VzIHRoYXQgY2FuIHNwZW5kIHRoZSBjaGFuZ2UgcmVtYWluaW5nIGZyb20gdGhlIHNwZW50IFVUWE9zXG4gICAqIEBwYXJhbSBpbml0aWFsU3RhdGUgVGhlIFtbSW5pdGlhbFN0YXRlc11dIHRoYXQgcmVwcmVzZW50IHRoZSBpbnRpYWwgc3RhdGUgb2YgYSBjcmVhdGVkIGFzc2V0XG4gICAqIEBwYXJhbSBuYW1lIFN0cmluZyBmb3IgdGhlIGRlc2NyaXB0aXZlIG5hbWUgb2YgdGhlIGFzc2V0XG4gICAqIEBwYXJhbSBzeW1ib2wgU3RyaW5nIGZvciB0aGUgdGlja2VyIHN5bWJvbCBvZiB0aGUgYXNzZXRcbiAgICogQHBhcmFtIGRlbm9taW5hdGlvbiBPcHRpb25hbCBudW1iZXIgZm9yIHRoZSBkZW5vbWluYXRpb24gd2hpY2ggaXMgMTBeRC4gRCBtdXN0IGJlID49IDAgYW5kIDw9IDMyLiBFeDogJDEgQVZBWCA9IDEwXjkgJG5BVkFYXG4gICAqIEBwYXJhbSBtaW50T3V0cHV0cyBPcHRpb25hbC4gQXJyYXkgb2YgW1tTRUNQTWludE91dHB1dF1dcyB0byBiZSBpbmNsdWRlZCBpbiB0aGUgdHJhbnNhY3Rpb24uIFRoZXNlIG91dHB1dHMgY2FuIGJlIHNwZW50IHRvIG1pbnQgbW9yZSB0b2tlbnMuXG4gICAqIEBwYXJhbSBmZWUgT3B0aW9uYWwuIFRoZSBhbW91bnQgb2YgZmVlcyB0byBidXJuIGluIGl0cyBzbWFsbGVzdCBkZW5vbWluYXRpb24sIHJlcHJlc2VudGVkIGFzIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vaW5kdXRueS9ibi5qcy98Qk59XG4gICAqIEBwYXJhbSBmZWVBc3NldElEIE9wdGlvbmFsLiBUaGUgYXNzZXRJRCBvZiB0aGUgZmVlcyBiZWluZyBidXJuZWQuXG4gICAqIEBwYXJhbSBtZW1vIE9wdGlvbmFsIGNvbnRhaW5zIGFyYml0cmFyeSBieXRlcywgdXAgdG8gMjU2IGJ5dGVzXG4gICAqIEBwYXJhbSBhc09mIE9wdGlvbmFsLiBUaGUgdGltZXN0YW1wIHRvIHZlcmlmeSB0aGUgdHJhbnNhY3Rpb24gYWdhaW5zdCBhcyBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vaW5kdXRueS9ibi5qcy98Qk59XG4gICAqXG4gICAqIEByZXR1cm5zIEFuIHVuc2lnbmVkIHRyYW5zYWN0aW9uIGNyZWF0ZWQgZnJvbSB0aGUgcGFzc2VkIGluIHBhcmFtZXRlcnMuXG4gICAqXG4gICAqL1xuICBidWlsZENyZWF0ZUFzc2V0VHggPSAoXG4gICAgICBuZXR3b3JraWQ6bnVtYmVyLCBcbiAgICAgIGJsb2NrY2hhaW5pZDpCdWZmZXIsIFxuICAgICAgZnJvbUFkZHJlc3NlczpBcnJheTxCdWZmZXI+LFxuICAgICAgY2hhbmdlQWRkcmVzc2VzOkFycmF5PEJ1ZmZlcj4sXG4gICAgICBpbml0aWFsU3RhdGU6SW5pdGlhbFN0YXRlcywgXG4gICAgICBuYW1lOnN0cmluZywgXG4gICAgICBzeW1ib2w6c3RyaW5nLCBcbiAgICAgIGRlbm9taW5hdGlvbjpudW1iZXIsIFxuICAgICAgbWludE91dHB1dHM6QXJyYXk8U0VDUE1pbnRPdXRwdXQ+ID0gdW5kZWZpbmVkLFxuICAgICAgZmVlOkJOID0gdW5kZWZpbmVkLFxuICAgICAgZmVlQXNzZXRJRDpCdWZmZXIgPSB1bmRlZmluZWQsIFxuICAgICAgbWVtbzpCdWZmZXIgPSB1bmRlZmluZWQsIFxuICAgICAgYXNPZjpCTiA9IFVuaXhOb3coKVxuICApOlVuc2lnbmVkVHggPT4ge1xuICAgIGNvbnN0IHplcm86Qk4gPSBuZXcgQk4oMCk7XG4gICAgbGV0IGluczpBcnJheTxUcmFuc2ZlcmFibGVJbnB1dD4gPSBbXTtcbiAgICBsZXQgb3V0czpBcnJheTxUcmFuc2ZlcmFibGVPdXRwdXQ+ID0gW107XG4gICAgXG4gICAgaWYodGhpcy5fZmVlQ2hlY2soZmVlLCBmZWVBc3NldElEKSl7XG4gICAgICBjb25zdCBhYWQ6QXNzZXRBbW91bnREZXN0aW5hdGlvbiA9IG5ldyBBc3NldEFtb3VudERlc3RpbmF0aW9uKGZyb21BZGRyZXNzZXMsIGZyb21BZGRyZXNzZXMsIGNoYW5nZUFkZHJlc3Nlcyk7XG4gICAgICBhYWQuYWRkQXNzZXRBbW91bnQoZmVlQXNzZXRJRCwgemVybywgZmVlKTtcbiAgICAgIGNvbnN0IHN1Y2Nlc3M6RXJyb3IgPSB0aGlzLmdldE1pbmltdW1TcGVuZGFibGUoYWFkLCBhc09mKTtcbiAgICAgIGlmKHR5cGVvZiBzdWNjZXNzID09PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICAgIGlucyA9IGFhZC5nZXRJbnB1dHMoKTtcbiAgICAgICAgb3V0cyA9IGFhZC5nZXRBbGxPdXRwdXRzKCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aHJvdyBzdWNjZXNzO1xuICAgICAgfVxuICAgIH1cbiAgICBpZih0eXBlb2YgbWludE91dHB1dHMgIT09IFwidW5kZWZpbmVkXCIpe1xuICAgICAgZm9yKGxldCBpID0gMDsgaSA8IG1pbnRPdXRwdXRzLmxlbmd0aDsgaSsrKXtcbiAgICAgICAgaWYobWludE91dHB1dHNbaV0gaW5zdGFuY2VvZiBTRUNQTWludE91dHB1dCl7XG4gICAgICAgICAgaW5pdGlhbFN0YXRlLmFkZE91dHB1dChtaW50T3V0cHV0c1tpXSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiRXJyb3IgLSBVVFhPU2V0LmJ1aWxkQ3JlYXRlQXNzZXRUeDogQSBzdWJtaXR0ZWQgbWludE91dHB1dCB3YXMgbm90IG9mIHR5cGUgU0VDUE1pbnRPdXRwdXRcIik7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICBsZXQgQ0F0eDpDcmVhdGVBc3NldFR4ID0gbmV3IENyZWF0ZUFzc2V0VHgobmV0d29ya2lkLCBibG9ja2NoYWluaWQsIG91dHMsIGlucywgbWVtbywgbmFtZSwgc3ltYm9sLCBkZW5vbWluYXRpb24sIGluaXRpYWxTdGF0ZSk7XG4gICAgcmV0dXJuIG5ldyBVbnNpZ25lZFR4KENBdHgpO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYW4gdW5zaWduZWQgU2VjcCBtaW50IHRyYW5zYWN0aW9uLiBGb3IgbW9yZSBncmFudWxhciBjb250cm9sLCB5b3UgbWF5IGNyZWF0ZSB5b3VyIG93blxuICAgKiBbW09wZXJhdGlvblR4XV0gbWFudWFsbHkgKHdpdGggdGhlaXIgY29ycmVzcG9uZGluZyBbW1RyYW5zZmVyYWJsZUlucHV0XV1zLCBbW1RyYW5zZmVyYWJsZU91dHB1dF1dcywgYW5kIFtbVHJhbnNmZXJPcGVyYXRpb25dXXMpLlxuICAgKiBcbiAgICogQHBhcmFtIG5ldHdvcmtpZCBUaGUgbnVtYmVyIHJlcHJlc2VudGluZyBOZXR3b3JrSUQgb2YgdGhlIG5vZGVcbiAgICogQHBhcmFtIGJsb2NrY2hhaW5pZCBUaGUge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0gcmVwcmVzZW50aW5nIHRoZSBCbG9ja2NoYWluSUQgZm9yIHRoZSB0cmFuc2FjdGlvblxuICAgKiBAcGFyYW0gbWludE93bmVyIEEgW1tTRUNQTWludE91dHB1dF1dIHdoaWNoIHNwZWNpZmllcyB0aGUgbmV3IHNldCBvZiBtaW50ZXJzXG4gICAqIEBwYXJhbSB0cmFuc2Zlck93bmVyIEEgW1tTRUNQVHJhbnNmZXJPdXRwdXRdXSB3aGljaCBzcGVjaWZpZXMgd2hlcmUgdGhlIG1pbnRlZCB0b2tlbnMgd2lsbCBnb1xuICAgKiBAcGFyYW0gZnJvbUFkZHJlc3NlcyBUaGUgYWRkcmVzc2VzIGJlaW5nIHVzZWQgdG8gc2VuZCB0aGUgZnVuZHMgZnJvbSB0aGUgVVRYT3Mge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn1cbiAgICogQHBhcmFtIGNoYW5nZUFkZHJlc3NlcyBUaGUgYWRkcmVzc2VzIHRoYXQgY2FuIHNwZW5kIHRoZSBjaGFuZ2UgcmVtYWluaW5nIGZyb20gdGhlIHNwZW50IFVUWE9zXG4gICAqIEBwYXJhbSBtaW50VVRYT0lEIFRoZSBVVFhPSUQgZm9yIHRoZSBbW1NDUE1pbnRPdXRwdXRdXSBiZWluZyBzcGVudCB0byBwcm9kdWNlIG1vcmUgdG9rZW5zXG4gICAqIEBwYXJhbSBmZWUgT3B0aW9uYWwuIFRoZSBhbW91bnQgb2YgZmVlcyB0byBidXJuIGluIGl0cyBzbWFsbGVzdCBkZW5vbWluYXRpb24sIHJlcHJlc2VudGVkIGFzIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vaW5kdXRueS9ibi5qcy98Qk59XG4gICAqIEBwYXJhbSBmZWVBc3NldElEIE9wdGlvbmFsLiBUaGUgYXNzZXRJRCBvZiB0aGUgZmVlcyBiZWluZyBidXJuZWQuXG4gICAqIEBwYXJhbSBtZW1vIE9wdGlvbmFsIGNvbnRhaW5zIGFyYml0cmFyeSBieXRlcywgdXAgdG8gMjU2IGJ5dGVzXG4gICAqIEBwYXJhbSBhc09mIE9wdGlvbmFsLiBUaGUgdGltZXN0YW1wIHRvIHZlcmlmeSB0aGUgdHJhbnNhY3Rpb24gYWdhaW5zdCBhcyBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vaW5kdXRueS9ibi5qcy98Qk59XG4gICAqL1xuICBidWlsZFNFQ1BNaW50VHggPSAoXG4gICAgbmV0d29ya2lkOm51bWJlciwgXG4gICAgYmxvY2tjaGFpbmlkOkJ1ZmZlcixcbiAgICBtaW50T3duZXI6U0VDUE1pbnRPdXRwdXQsXG4gICAgdHJhbnNmZXJPd25lcjpTRUNQVHJhbnNmZXJPdXRwdXQsXG4gICAgZnJvbUFkZHJlc3NlczpBcnJheTxCdWZmZXI+LFxuICAgIGNoYW5nZUFkZHJlc3NlczpBcnJheTxCdWZmZXI+LFxuICAgIG1pbnRVVFhPSUQ6c3RyaW5nLFxuICAgIGZlZTpCTiA9IHVuZGVmaW5lZCxcbiAgICBmZWVBc3NldElEOkJ1ZmZlciA9IHVuZGVmaW5lZCwgIFxuICAgIG1lbW86QnVmZmVyID0gdW5kZWZpbmVkLCBcbiAgICBhc09mOkJOID0gVW5peE5vdygpXG4gICk6VW5zaWduZWRUeCA9PiB7XG4gICAgY29uc3QgemVybzpCTiA9IG5ldyBCTigwKTtcbiAgICBsZXQgaW5zOkFycmF5PFRyYW5zZmVyYWJsZUlucHV0PiA9IFtdO1xuICAgIGxldCBvdXRzOkFycmF5PFRyYW5zZmVyYWJsZU91dHB1dD4gPSBbXTtcblxuICAgIGlmKHRoaXMuX2ZlZUNoZWNrKGZlZSwgZmVlQXNzZXRJRCkpIHtcbiAgICAgIGNvbnN0IGFhZDpBc3NldEFtb3VudERlc3RpbmF0aW9uID0gbmV3IEFzc2V0QW1vdW50RGVzdGluYXRpb24oZnJvbUFkZHJlc3NlcywgZnJvbUFkZHJlc3NlcywgY2hhbmdlQWRkcmVzc2VzKTtcbiAgICAgIGFhZC5hZGRBc3NldEFtb3VudChmZWVBc3NldElELCB6ZXJvLCBmZWUpO1xuICAgICAgY29uc3Qgc3VjY2VzczpFcnJvciA9IHRoaXMuZ2V0TWluaW11bVNwZW5kYWJsZShhYWQsIGFzT2YpO1xuICAgICAgaWYodHlwZW9mIHN1Y2Nlc3MgPT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgICAgaW5zID0gYWFkLmdldElucHV0cygpO1xuICAgICAgICBvdXRzID0gYWFkLmdldEFsbE91dHB1dHMoKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRocm93IHN1Y2Nlc3M7XG4gICAgICB9XG4gICAgfVxuXG4gICAgbGV0IG9wczpBcnJheTxUcmFuc2ZlcmFibGVPcGVyYXRpb24+ID0gW107XG4gICAgbGV0IG1pbnRPcDpTRUNQTWludE9wZXJhdGlvbiA9ICBuZXcgU0VDUE1pbnRPcGVyYXRpb24obWludE93bmVyLCB0cmFuc2Zlck93bmVyKTtcbiAgICBcbiAgICBsZXQgdXR4bzpVVFhPID0gdGhpcy5nZXRVVFhPKG1pbnRVVFhPSUQpO1xuICAgIGlmKHR5cGVvZiB1dHhvID09PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJFcnJvciAtIFVUWE9TZXQuYnVpbGRTRUNQTWludFR4OiBVVFhPSUQgbm90IGZvdW5kXCIpO1xuICAgIH1cbiAgICBpZih1dHhvLmdldE91dHB1dCgpLmdldE91dHB1dElEKCkgIT09IEFWTUNvbnN0YW50cy5TRUNQTUlOVE9VVFBVVElEKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJFcnJvciAtIFVUWE9TZXQuYnVpbGRTRUNQTWludFR4OiBVVFhPIGlzIG5vdCBhIFNFQ1BNSU5UT1VUUFVUSURcIik7XG4gICAgfVxuICAgIGxldCBvdXQ6U0VDUE1pbnRPdXRwdXQgPSB1dHhvLmdldE91dHB1dCgpIGFzIFNFQ1BNaW50T3V0cHV0O1xuICAgIGxldCBzcGVuZGVyczpBcnJheTxCdWZmZXI+ID0gb3V0LmdldFNwZW5kZXJzKGZyb21BZGRyZXNzZXMsIGFzT2YpO1xuXG4gICAgZm9yKGxldCBqOm51bWJlciA9IDA7IGogPCBzcGVuZGVycy5sZW5ndGg7IGorKykge1xuICAgICAgbGV0IGlkeDpudW1iZXIgPSBvdXQuZ2V0QWRkcmVzc0lkeChzcGVuZGVyc1tqXSk7XG4gICAgICBpZihpZHggPT0gLTEpIHtcbiAgICAgICAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIkVycm9yIC0gVVRYT1NldC5idWlsZFNFQ1BNaW50VHg6IG5vIHN1Y2ggYWRkcmVzcyBpbiBvdXRwdXRcIik7XG4gICAgICB9XG4gICAgICBtaW50T3AuYWRkU2lnbmF0dXJlSWR4KGlkeCwgc3BlbmRlcnNbal0pO1xuICAgIH1cbiAgICAgIFxuICAgIGxldCB0cmFuc2ZlcmFibGVPcGVyYXRpb246VHJhbnNmZXJhYmxlT3BlcmF0aW9uID0gbmV3IFRyYW5zZmVyYWJsZU9wZXJhdGlvbih1dHhvLmdldEFzc2V0SUQoKSwgW21pbnRVVFhPSURdLCBtaW50T3ApO1xuICAgIG9wcy5wdXNoKHRyYW5zZmVyYWJsZU9wZXJhdGlvbik7XG5cbiAgICBsZXQgb3BlcmF0aW9uVHg6T3BlcmF0aW9uVHggPSBuZXcgT3BlcmF0aW9uVHgobmV0d29ya2lkLCBibG9ja2NoYWluaWQsIG91dHMsIGlucywgbWVtbywgb3BzKTtcbiAgICByZXR1cm4gbmV3IFVuc2lnbmVkVHgob3BlcmF0aW9uVHgpO1xuICB9XG5cbiAgLyoqXG4gICogQ3JlYXRlcyBhbiB1bnNpZ25lZCBDcmVhdGUgQXNzZXQgdHJhbnNhY3Rpb24uIEZvciBtb3JlIGdyYW51bGFyIGNvbnRyb2wsIHlvdSBtYXkgY3JlYXRlIHlvdXIgb3duXG4gICogW1tDcmVhdGVBc3NldFRYXV0gbWFudWFsbHkgKHdpdGggdGhlaXIgY29ycmVzcG9uZGluZyBbW1RyYW5zZmVyYWJsZUlucHV0XV1zLCBbW1RyYW5zZmVyYWJsZU91dHB1dF1dcykuXG4gICogXG4gICogQHBhcmFtIG5ldHdvcmtpZCBUaGUgbnVtYmVyIHJlcHJlc2VudGluZyBOZXR3b3JrSUQgb2YgdGhlIG5vZGVcbiAgKiBAcGFyYW0gYmxvY2tjaGFpbmlkIFRoZSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSByZXByZXNlbnRpbmcgdGhlIEJsb2NrY2hhaW5JRCBmb3IgdGhlIHRyYW5zYWN0aW9uXG4gICogQHBhcmFtIGZyb21BZGRyZXNzZXMgVGhlIGFkZHJlc3NlcyBiZWluZyB1c2VkIHRvIHNlbmQgdGhlIGZ1bmRzIGZyb20gdGhlIFVUWE9zIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9XG4gICogQHBhcmFtIGNoYW5nZUFkZHJlc3NlcyBPcHRpb25hbC4gVGhlIGFkZHJlc3NlcyB0aGF0IGNhbiBzcGVuZCB0aGUgY2hhbmdlIHJlbWFpbmluZyBmcm9tIHRoZSBzcGVudCBVVFhPcy5cbiAgKiBAcGFyYW0gbWludGVyU2V0cyBUaGUgbWludGVycyBhbmQgdGhyZXNob2xkcyByZXF1aXJlZCB0byBtaW50IHRoaXMgbmZ0IGFzc2V0XG4gICogQHBhcmFtIG5hbWUgU3RyaW5nIGZvciB0aGUgZGVzY3JpcHRpdmUgbmFtZSBvZiB0aGUgbmZ0IGFzc2V0XG4gICogQHBhcmFtIHN5bWJvbCBTdHJpbmcgZm9yIHRoZSB0aWNrZXIgc3ltYm9sIG9mIHRoZSBuZnQgYXNzZXRcbiAgKiBAcGFyYW0gZmVlIE9wdGlvbmFsLiBUaGUgYW1vdW50IG9mIGZlZXMgdG8gYnVybiBpbiBpdHMgc21hbGxlc3QgZGVub21pbmF0aW9uLCByZXByZXNlbnRlZCBhcyB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2luZHV0bnkvYm4uanMvfEJOfVxuICAqIEBwYXJhbSBmZWVBc3NldElEIE9wdGlvbmFsLiBUaGUgYXNzZXRJRCBvZiB0aGUgZmVlcyBiZWluZyBidXJuZWQuXG4gICogQHBhcmFtIG1lbW8gT3B0aW9uYWwgY29udGFpbnMgYXJiaXRyYXJ5IGJ5dGVzLCB1cCB0byAyNTYgYnl0ZXNcbiAgKiBAcGFyYW0gYXNPZiBPcHRpb25hbC4gVGhlIHRpbWVzdGFtcCB0byB2ZXJpZnkgdGhlIHRyYW5zYWN0aW9uIGFnYWluc3QgYXMgYSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2luZHV0bnkvYm4uanMvfEJOfVxuICAqIEBwYXJhbSBsb2NrdGltZSBPcHRpb25hbC4gVGhlIGxvY2t0aW1lIGZpZWxkIGNyZWF0ZWQgaW4gdGhlIHJlc3VsdGluZyBtaW50IG91dHB1dFxuICAqIFxuICAqIEByZXR1cm5zIEFuIHVuc2lnbmVkIHRyYW5zYWN0aW9uIGNyZWF0ZWQgZnJvbSB0aGUgcGFzc2VkIGluIHBhcmFtZXRlcnMuXG4gICogXG4gICovXG4gIGJ1aWxkQ3JlYXRlTkZUQXNzZXRUeCA9IChcbiAgICAgIG5ldHdvcmtpZDpudW1iZXIsIFxuICAgICAgYmxvY2tjaGFpbmlkOkJ1ZmZlciwgXG4gICAgICBmcm9tQWRkcmVzc2VzOkFycmF5PEJ1ZmZlcj4sXG4gICAgICBjaGFuZ2VBZGRyZXNzZXM6QXJyYXk8QnVmZmVyPixcbiAgICAgIG1pbnRlclNldHM6QXJyYXk8TWludGVyU2V0PixcbiAgICAgIG5hbWU6c3RyaW5nLCBcbiAgICAgIHN5bWJvbDpzdHJpbmcsXG4gICAgICBmZWU6Qk4gPSB1bmRlZmluZWQsXG4gICAgICBmZWVBc3NldElEOkJ1ZmZlciA9IHVuZGVmaW5lZCwgIFxuICAgICAgbWVtbzpCdWZmZXIgPSB1bmRlZmluZWQsIFxuICAgICAgYXNPZjpCTiA9IFVuaXhOb3coKSxcbiAgICAgIGxvY2t0aW1lOkJOID0gdW5kZWZpbmVkXG4gICk6VW5zaWduZWRUeCA9PiB7XG4gICAgY29uc3QgemVybzpCTiA9IG5ldyBCTigwKTtcbiAgICBsZXQgaW5zOkFycmF5PFRyYW5zZmVyYWJsZUlucHV0PiA9IFtdO1xuICAgIGxldCBvdXRzOkFycmF5PFRyYW5zZmVyYWJsZU91dHB1dD4gPSBbXTtcbiAgICBcbiAgICBpZih0aGlzLl9mZWVDaGVjayhmZWUsIGZlZUFzc2V0SUQpKSB7XG4gICAgICBjb25zdCBhYWQ6QXNzZXRBbW91bnREZXN0aW5hdGlvbiA9IG5ldyBBc3NldEFtb3VudERlc3RpbmF0aW9uKGZyb21BZGRyZXNzZXMsIGZyb21BZGRyZXNzZXMsIGNoYW5nZUFkZHJlc3Nlcyk7XG4gICAgICBhYWQuYWRkQXNzZXRBbW91bnQoZmVlQXNzZXRJRCwgemVybywgZmVlKTtcbiAgICAgIGNvbnN0IHN1Y2Nlc3M6RXJyb3IgPSB0aGlzLmdldE1pbmltdW1TcGVuZGFibGUoYWFkLCBhc09mKTtcbiAgICAgIGlmKHR5cGVvZiBzdWNjZXNzID09PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICAgIGlucyA9IGFhZC5nZXRJbnB1dHMoKTtcbiAgICAgICAgb3V0cyA9IGFhZC5nZXRBbGxPdXRwdXRzKCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aHJvdyBzdWNjZXNzO1xuICAgICAgfVxuICAgIH1cbiAgICBsZXQgaW5pdGlhbFN0YXRlOkluaXRpYWxTdGF0ZXMgPSBuZXcgSW5pdGlhbFN0YXRlcygpO1xuICAgIGZvcihsZXQgaTpudW1iZXIgPSAwOyBpIDwgbWludGVyU2V0cy5sZW5ndGg7IGkrKykge1xuICAgICAgbGV0IG5mdE1pbnRPdXRwdXQ6TkZUTWludE91dHB1dCA9IG5ldyBORlRNaW50T3V0cHV0KFxuICAgICAgICBpLFxuICAgICAgICBtaW50ZXJTZXRzW2ldLmdldE1pbnRlcnMoKSxcbiAgICAgICAgbG9ja3RpbWUsIFxuICAgICAgICBtaW50ZXJTZXRzW2ldLmdldFRocmVzaG9sZCgpXG4gICAgICAgICk7XG4gICAgICBpbml0aWFsU3RhdGUuYWRkT3V0cHV0KG5mdE1pbnRPdXRwdXQsIEFWTUNvbnN0YW50cy5ORlRGWElEKTtcbiAgICB9XG4gICAgbGV0IGRlbm9taW5hdGlvbjpudW1iZXIgPSAwOyAvLyBORlRzIGFyZSBub24tZnVuZ2libGVcbiAgICBsZXQgQ0F0eDpDcmVhdGVBc3NldFR4ID0gbmV3IENyZWF0ZUFzc2V0VHgobmV0d29ya2lkLCBibG9ja2NoYWluaWQsIG91dHMsIGlucywgbWVtbywgbmFtZSwgc3ltYm9sLCBkZW5vbWluYXRpb24sIGluaXRpYWxTdGF0ZSk7XG4gICAgcmV0dXJuIG5ldyBVbnNpZ25lZFR4KENBdHgpO1xuICB9XG5cbiAgLyoqXG4gICogQ3JlYXRlcyBhbiB1bnNpZ25lZCBORlQgbWludCB0cmFuc2FjdGlvbi4gRm9yIG1vcmUgZ3JhbnVsYXIgY29udHJvbCwgeW91IG1heSBjcmVhdGUgeW91ciBvd25cbiAgKiBbW09wZXJhdGlvblR4XV0gbWFudWFsbHkgKHdpdGggdGhlaXIgY29ycmVzcG9uZGluZyBbW1RyYW5zZmVyYWJsZUlucHV0XV1zLCBbW1RyYW5zZmVyYWJsZU91dHB1dF1dcywgYW5kIFtbVHJhbnNmZXJPcGVyYXRpb25dXXMpLlxuICAqIFxuICAqIEBwYXJhbSBuZXR3b3JraWQgVGhlIG51bWJlciByZXByZXNlbnRpbmcgTmV0d29ya0lEIG9mIHRoZSBub2RlXG4gICogQHBhcmFtIGJsb2NrY2hhaW5pZCBUaGUge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0gcmVwcmVzZW50aW5nIHRoZSBCbG9ja2NoYWluSUQgZm9yIHRoZSB0cmFuc2FjdGlvblxuICAqIEBwYXJhbSBvd25lcnMgQW4gYXJyYXkgb2YgW1tPdXRwdXRPd25lcnNdXSB3aG8gd2lsbCBiZSBnaXZlbiB0aGUgTkZUcy5cbiAgKiBAcGFyYW0gZnJvbUFkZHJlc3NlcyBUaGUgYWRkcmVzc2VzIGJlaW5nIHVzZWQgdG8gc2VuZCB0aGUgZnVuZHMgZnJvbSB0aGUgVVRYT3NcbiAgKiBAcGFyYW0gY2hhbmdlQWRkcmVzc2VzIE9wdGlvbmFsLiBUaGUgYWRkcmVzc2VzIHRoYXQgY2FuIHNwZW5kIHRoZSBjaGFuZ2UgcmVtYWluaW5nIGZyb20gdGhlIHNwZW50IFVUWE9zLlxuICAqIEBwYXJhbSB1dHhvaWRzIEFuIGFycmF5IG9mIHN0cmluZ3MgZm9yIHRoZSBORlRzIGJlaW5nIHRyYW5zZmVycmVkXG4gICogQHBhcmFtIGdyb3VwSUQgT3B0aW9uYWwuIFRoZSBncm91cCB0aGlzIE5GVCBpcyBpc3N1ZWQgdG8uXG4gICogQHBhcmFtIHBheWxvYWQgT3B0aW9uYWwuIERhdGEgZm9yIE5GVCBQYXlsb2FkLlxuICAqIEBwYXJhbSBmZWUgT3B0aW9uYWwuIFRoZSBhbW91bnQgb2YgZmVlcyB0byBidXJuIGluIGl0cyBzbWFsbGVzdCBkZW5vbWluYXRpb24sIHJlcHJlc2VudGVkIGFzIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vaW5kdXRueS9ibi5qcy98Qk59XG4gICogQHBhcmFtIGZlZUFzc2V0SUQgT3B0aW9uYWwuIFRoZSBhc3NldElEIG9mIHRoZSBmZWVzIGJlaW5nIGJ1cm5lZC4gXG4gICogQHBhcmFtIG1lbW8gT3B0aW9uYWwgY29udGFpbnMgYXJiaXRyYXJ5IGJ5dGVzLCB1cCB0byAyNTYgYnl0ZXNcbiAgKiBAcGFyYW0gYXNPZiBPcHRpb25hbC4gVGhlIHRpbWVzdGFtcCB0byB2ZXJpZnkgdGhlIHRyYW5zYWN0aW9uIGFnYWluc3QgYXMgYSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2luZHV0bnkvYm4uanMvfEJOfVxuICAqIFxuICAqIEByZXR1cm5zIEFuIHVuc2lnbmVkIHRyYW5zYWN0aW9uIGNyZWF0ZWQgZnJvbSB0aGUgcGFzc2VkIGluIHBhcmFtZXRlcnMuXG4gICogXG4gICovXG4gIGJ1aWxkQ3JlYXRlTkZUTWludFR4ID0gKFxuICAgIG5ldHdvcmtpZDpudW1iZXIsIFxuICAgIGJsb2NrY2hhaW5pZDpCdWZmZXIsIFxuICAgIG93bmVyczpBcnJheTxPdXRwdXRPd25lcnM+LFxuICAgIGZyb21BZGRyZXNzZXM6QXJyYXk8QnVmZmVyPixcbiAgICBjaGFuZ2VBZGRyZXNzZXM6QXJyYXk8QnVmZmVyPixcbiAgICB1dHhvaWRzOkFycmF5PHN0cmluZz4sIFxuICAgIGdyb3VwSUQ6bnVtYmVyID0gMCwgXG4gICAgcGF5bG9hZDpCdWZmZXIgPSB1bmRlZmluZWQsIFxuICAgIGZlZTpCTiA9IHVuZGVmaW5lZCxcbiAgICBmZWVBc3NldElEOkJ1ZmZlciA9IHVuZGVmaW5lZCwgIFxuICAgIG1lbW86QnVmZmVyID0gdW5kZWZpbmVkLFxuICAgIGFzT2Y6Qk4gPSBVbml4Tm93KClcbiAgKTpVbnNpZ25lZFR4ID0+IHtcblxuICAgIGNvbnN0IHplcm86Qk4gPSBuZXcgQk4oMCk7XG4gICAgbGV0IGluczpBcnJheTxUcmFuc2ZlcmFibGVJbnB1dD4gPSBbXTtcbiAgICBsZXQgb3V0czpBcnJheTxUcmFuc2ZlcmFibGVPdXRwdXQ+ID0gW107XG4gICAgXG4gICAgaWYodGhpcy5fZmVlQ2hlY2soZmVlLCBmZWVBc3NldElEKSkge1xuICAgICAgY29uc3QgYWFkOkFzc2V0QW1vdW50RGVzdGluYXRpb24gPSBuZXcgQXNzZXRBbW91bnREZXN0aW5hdGlvbihmcm9tQWRkcmVzc2VzLCBmcm9tQWRkcmVzc2VzLCBjaGFuZ2VBZGRyZXNzZXMpO1xuICAgICAgYWFkLmFkZEFzc2V0QW1vdW50KGZlZUFzc2V0SUQsIHplcm8sIGZlZSk7XG4gICAgICBjb25zdCBzdWNjZXNzOkVycm9yID0gdGhpcy5nZXRNaW5pbXVtU3BlbmRhYmxlKGFhZCwgYXNPZik7XG4gICAgICBpZih0eXBlb2Ygc3VjY2VzcyA9PT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgICBpbnMgPSBhYWQuZ2V0SW5wdXRzKCk7XG4gICAgICAgIG91dHMgPSBhYWQuZ2V0QWxsT3V0cHV0cygpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhyb3cgc3VjY2VzcztcbiAgICAgIH1cbiAgICB9XG4gICAgbGV0IG9wczpBcnJheTxUcmFuc2ZlcmFibGVPcGVyYXRpb24+ID0gW107XG5cbiAgICBsZXQgbmZ0TWludE9wZXJhdGlvbjogTkZUTWludE9wZXJhdGlvbiA9IG5ldyBORlRNaW50T3BlcmF0aW9uKGdyb3VwSUQsIHBheWxvYWQsIG93bmVycyk7XG5cbiAgICBmb3IobGV0IGk6bnVtYmVyID0gMDsgaSA8IHV0eG9pZHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgbGV0IHV0eG86VVRYTyA9IHRoaXMuZ2V0VVRYTyh1dHhvaWRzW2ldKTtcbiAgICAgICAgbGV0IG91dDpORlRUcmFuc2Zlck91dHB1dCA9IHV0eG8uZ2V0T3V0cHV0KCkgYXMgTkZUVHJhbnNmZXJPdXRwdXQ7XG4gICAgICAgIGxldCBzcGVuZGVyczpBcnJheTxCdWZmZXI+ID0gb3V0LmdldFNwZW5kZXJzKGZyb21BZGRyZXNzZXMsIGFzT2YpO1xuXG4gICAgICAgIGZvcihsZXQgajpudW1iZXIgPSAwOyBqIDwgc3BlbmRlcnMubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgICAgIGxldCBpZHg6bnVtYmVyO1xuICAgICAgICAgICAgaWR4ID0gb3V0LmdldEFkZHJlc3NJZHgoc3BlbmRlcnNbal0pO1xuICAgICAgICAgICAgaWYoaWR4ID09IC0xKXtcbiAgICAgICAgICAgICAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIkVycm9yIC0gVVRYT1NldC5idWlsZENyZWF0ZU5GVE1pbnRUeDogbm8gc3VjaCBhZGRyZXNzIGluIG91dHB1dFwiKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIG5mdE1pbnRPcGVyYXRpb24uYWRkU2lnbmF0dXJlSWR4KGlkeCwgc3BlbmRlcnNbal0pO1xuICAgICAgICB9XG4gICAgICAgICAgXG4gICAgICAgIGxldCB0cmFuc2ZlcmFibGVPcGVyYXRpb246VHJhbnNmZXJhYmxlT3BlcmF0aW9uID0gbmV3IFRyYW5zZmVyYWJsZU9wZXJhdGlvbih1dHhvLmdldEFzc2V0SUQoKSwgdXR4b2lkcywgbmZ0TWludE9wZXJhdGlvbik7XG4gICAgICAgIG9wcy5wdXNoKHRyYW5zZmVyYWJsZU9wZXJhdGlvbik7XG4gICAgfVxuXG4gICAgbGV0IG9wZXJhdGlvblR4Ok9wZXJhdGlvblR4ID0gbmV3IE9wZXJhdGlvblR4KG5ldHdvcmtpZCwgYmxvY2tjaGFpbmlkLCBvdXRzLCBpbnMsIG1lbW8sIG9wcyk7XG4gICAgcmV0dXJuIG5ldyBVbnNpZ25lZFR4KG9wZXJhdGlvblR4KTtcbiAgfVxuXG4gIC8qKlxuICAqIENyZWF0ZXMgYW4gdW5zaWduZWQgTkZUIHRyYW5zZmVyIHRyYW5zYWN0aW9uLiBGb3IgbW9yZSBncmFudWxhciBjb250cm9sLCB5b3UgbWF5IGNyZWF0ZSB5b3VyIG93blxuICAqIFtbT3BlcmF0aW9uVHhdXSBtYW51YWxseSAod2l0aCB0aGVpciBjb3JyZXNwb25kaW5nIFtbVHJhbnNmZXJhYmxlSW5wdXRdXXMsIFtbVHJhbnNmZXJhYmxlT3V0cHV0XV1zLCBhbmQgW1tUcmFuc2Zlck9wZXJhdGlvbl1dcykuXG4gICpcbiAgKiBAcGFyYW0gbmV0d29ya2lkIFRoZSBudW1iZXIgcmVwcmVzZW50aW5nIE5ldHdvcmtJRCBvZiB0aGUgbm9kZVxuICAqIEBwYXJhbSBibG9ja2NoYWluaWQgVGhlIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IHJlcHJlc2VudGluZyB0aGUgQmxvY2tjaGFpbklEIGZvciB0aGUgdHJhbnNhY3Rpb25cbiAgKiBAcGFyYW0gdG9BZGRyZXNzZXMgQW4gYXJyYXkgb2Yge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn1zIHdoaWNoIGluZGljYXRlIHdobyByZWNpZXZlcyB0aGUgTkZUXG4gICogQHBhcmFtIGZyb21BZGRyZXNzZXMgQW4gYXJyYXkgZm9yIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IHdobyBvd25zIHRoZSBORlRcbiAgKiBAcGFyYW0gY2hhbmdlQWRkcmVzc2VzIE9wdGlvbmFsLiBUaGUgYWRkcmVzc2VzIHRoYXQgY2FuIHNwZW5kIHRoZSBjaGFuZ2UgcmVtYWluaW5nIGZyb20gdGhlIHNwZW50IFVUWE9zLlxuICAqIEBwYXJhbSB1dHhvaWRzIEFuIGFycmF5IG9mIHN0cmluZ3MgZm9yIHRoZSBORlRzIGJlaW5nIHRyYW5zZmVycmVkXG4gICogQHBhcmFtIGZlZSBPcHRpb25hbC4gVGhlIGFtb3VudCBvZiBmZWVzIHRvIGJ1cm4gaW4gaXRzIHNtYWxsZXN0IGRlbm9taW5hdGlvbiwgcmVwcmVzZW50ZWQgYXMge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9pbmR1dG55L2JuLmpzL3xCTn1cbiAgKiBAcGFyYW0gZmVlQXNzZXRJRCBPcHRpb25hbC4gVGhlIGFzc2V0SUQgb2YgdGhlIGZlZXMgYmVpbmcgYnVybmVkLiBcbiAgKiBAcGFyYW0gbWVtbyBPcHRpb25hbCBjb250YWlucyBhcmJpdHJhcnkgYnl0ZXMsIHVwIHRvIDI1NiBieXRlc1xuICAqIEBwYXJhbSBhc09mIE9wdGlvbmFsLiBUaGUgdGltZXN0YW1wIHRvIHZlcmlmeSB0aGUgdHJhbnNhY3Rpb24gYWdhaW5zdCBhcyBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vaW5kdXRueS9ibi5qcy98Qk59XG4gICogQHBhcmFtIGxvY2t0aW1lIE9wdGlvbmFsLiBUaGUgbG9ja3RpbWUgZmllbGQgY3JlYXRlZCBpbiB0aGUgcmVzdWx0aW5nIG91dHB1dHNcbiAgKiBAcGFyYW0gdGhyZXNob2xkIE9wdGlvbmFsLiBUaGUgbnVtYmVyIG9mIHNpZ25hdHVyZXMgcmVxdWlyZWQgdG8gc3BlbmQgdGhlIGZ1bmRzIGluIHRoZSByZXN1bHRhbnQgVVRYT1xuICAqIFxuICAqIEByZXR1cm5zIEFuIHVuc2lnbmVkIHRyYW5zYWN0aW9uIGNyZWF0ZWQgZnJvbSB0aGUgcGFzc2VkIGluIHBhcmFtZXRlcnMuXG4gICpcbiAgKi9cbiAgYnVpbGRORlRUcmFuc2ZlclR4ID0gKFxuICAgIG5ldHdvcmtpZDpudW1iZXIsIFxuICAgIGJsb2NrY2hhaW5pZDpCdWZmZXIsIFxuICAgIHRvQWRkcmVzc2VzOkFycmF5PEJ1ZmZlcj4sIFxuICAgIGZyb21BZGRyZXNzZXM6QXJyYXk8QnVmZmVyPixcbiAgICBjaGFuZ2VBZGRyZXNzZXM6QXJyYXk8QnVmZmVyPixcbiAgICB1dHhvaWRzOkFycmF5PHN0cmluZz4sXG4gICAgZmVlOkJOID0gdW5kZWZpbmVkLFxuICAgIGZlZUFzc2V0SUQ6QnVmZmVyID0gdW5kZWZpbmVkLCBcbiAgICBtZW1vOkJ1ZmZlciA9IHVuZGVmaW5lZCwgXG4gICAgYXNPZjpCTiA9IFVuaXhOb3coKSxcbiAgICBsb2NrdGltZTpCTiA9IG5ldyBCTigwKSwgXG4gICAgdGhyZXNob2xkOm51bWJlciA9IDEsXG4gICk6VW5zaWduZWRUeCA9PiB7XG4gICAgY29uc3QgemVybzpCTiA9IG5ldyBCTigwKTtcbiAgICBsZXQgaW5zOkFycmF5PFRyYW5zZmVyYWJsZUlucHV0PiA9IFtdO1xuICAgIGxldCBvdXRzOkFycmF5PFRyYW5zZmVyYWJsZU91dHB1dD4gPSBbXTtcbiAgICBcbiAgICBpZih0aGlzLl9mZWVDaGVjayhmZWUsIGZlZUFzc2V0SUQpKSB7XG4gICAgICBjb25zdCBhYWQ6QXNzZXRBbW91bnREZXN0aW5hdGlvbiA9IG5ldyBBc3NldEFtb3VudERlc3RpbmF0aW9uKGZyb21BZGRyZXNzZXMsIGZyb21BZGRyZXNzZXMsIGNoYW5nZUFkZHJlc3Nlcyk7XG4gICAgICBhYWQuYWRkQXNzZXRBbW91bnQoZmVlQXNzZXRJRCwgemVybywgZmVlKTtcbiAgICAgIGNvbnN0IHN1Y2Nlc3M6RXJyb3IgPSB0aGlzLmdldE1pbmltdW1TcGVuZGFibGUoYWFkLCBhc09mKTtcbiAgICAgIGlmKHR5cGVvZiBzdWNjZXNzID09PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICAgIGlucyA9IGFhZC5nZXRJbnB1dHMoKTtcbiAgICAgICAgb3V0cyA9IGFhZC5nZXRBbGxPdXRwdXRzKCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aHJvdyBzdWNjZXNzO1xuICAgICAgfVxuICAgIH1cbiAgICBjb25zdCBvcHM6QXJyYXk8VHJhbnNmZXJhYmxlT3BlcmF0aW9uPiA9IFtdO1xuICAgIGZvciAobGV0IGk6bnVtYmVyID0gMDsgaSA8IHV0eG9pZHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IHV0eG86VVRYTyA9IHRoaXMuZ2V0VVRYTyh1dHhvaWRzW2ldKTtcbiAgXG4gICAgICBjb25zdCBvdXQ6TkZUVHJhbnNmZXJPdXRwdXQgPSB1dHhvLmdldE91dHB1dCgpIGFzIE5GVFRyYW5zZmVyT3V0cHV0O1xuICAgICAgY29uc3Qgc3BlbmRlcnM6QXJyYXk8QnVmZmVyPiA9IG91dC5nZXRTcGVuZGVycyhmcm9tQWRkcmVzc2VzLCBhc09mKTtcbiAgXG4gICAgICBjb25zdCBvdXRib3VuZDpORlRUcmFuc2Zlck91dHB1dCA9IG5ldyBORlRUcmFuc2Zlck91dHB1dChcbiAgICAgICAgb3V0LmdldEdyb3VwSUQoKSwgb3V0LmdldFBheWxvYWQoKSwgdG9BZGRyZXNzZXMsIGxvY2t0aW1lLCB0aHJlc2hvbGQsIFxuICAgICAgKTtcbiAgICAgIGNvbnN0IG9wOk5GVFRyYW5zZmVyT3BlcmF0aW9uID0gbmV3IE5GVFRyYW5zZmVyT3BlcmF0aW9uKG91dGJvdW5kKTtcbiAgXG4gICAgICBmb3IgKGxldCBqID0gMDsgaiA8IHNwZW5kZXJzLmxlbmd0aDsgaisrKSB7XG4gICAgICAgIGNvbnN0IGlkeDpudW1iZXIgPSBvdXQuZ2V0QWRkcmVzc0lkeChzcGVuZGVyc1tqXSk7XG4gICAgICAgIGlmIChpZHggPT09IC0xKSB7XG4gICAgICAgICAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0Vycm9yIC0gVVRYT1NldC5idWlsZE5GVFRyYW5zZmVyVHg6ICdcbiAgICAgICAgICArIGBubyBzdWNoIGFkZHJlc3MgaW4gb3V0cHV0OiAke3NwZW5kZXJzW2pdfWApO1xuICAgICAgICB9XG4gICAgICAgIG9wLmFkZFNpZ25hdHVyZUlkeChpZHgsIHNwZW5kZXJzW2pdKTtcbiAgICAgIH1cbiAgXG4gICAgICBjb25zdCB4ZmVyb3A6VHJhbnNmZXJhYmxlT3BlcmF0aW9uID0gbmV3IFRyYW5zZmVyYWJsZU9wZXJhdGlvbih1dHhvLmdldEFzc2V0SUQoKSxcbiAgICAgICAgW3V0eG9pZHNbaV1dLFxuICAgICAgICBvcCk7XG4gICAgICBvcHMucHVzaCh4ZmVyb3ApO1xuICAgIH1cbiAgICBjb25zdCBPcFR4Ok9wZXJhdGlvblR4ID0gbmV3IE9wZXJhdGlvblR4KG5ldHdvcmtpZCwgYmxvY2tjaGFpbmlkLCBvdXRzLCBpbnMsIG1lbW8sIG9wcyk7XG4gICAgcmV0dXJuIG5ldyBVbnNpZ25lZFR4KE9wVHgpO1xuICB9O1xuXG4gIC8qKlxuICAgICogQ3JlYXRlcyBhbiB1bnNpZ25lZCBJbXBvcnRUeCB0cmFuc2FjdGlvbi5cbiAgICAqXG4gICAgKiBAcGFyYW0gbmV0d29ya2lkIFRoZSBudW1iZXIgcmVwcmVzZW50aW5nIE5ldHdvcmtJRCBvZiB0aGUgbm9kZVxuICAgICogQHBhcmFtIGJsb2NrY2hhaW5pZCBUaGUge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0gcmVwcmVzZW50aW5nIHRoZSBCbG9ja2NoYWluSUQgZm9yIHRoZSB0cmFuc2FjdGlvblxuICAgICogQHBhcmFtIHRvQWRkcmVzc2VzIFRoZSBhZGRyZXNzZXMgdG8gc2VuZCB0aGUgZnVuZHNcbiAgICAqIEBwYXJhbSBmcm9tQWRkcmVzc2VzIFRoZSBhZGRyZXNzZXMgYmVpbmcgdXNlZCB0byBzZW5kIHRoZSBmdW5kcyBmcm9tIHRoZSBVVFhPcyB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfVxuICAgICogQHBhcmFtIGNoYW5nZUFkZHJlc3NlcyBPcHRpb25hbC4gVGhlIGFkZHJlc3NlcyB0aGF0IGNhbiBzcGVuZCB0aGUgY2hhbmdlIHJlbWFpbmluZyBmcm9tIHRoZSBzcGVudCBVVFhPcy5cbiAgICAqIEBwYXJhbSBpbXBvcnRJbnMgQW4gYXJyYXkgb2YgW1tUcmFuc2ZlcmFibGVJbnB1dF1dcyBiZWluZyBpbXBvcnRlZFxuICAgICogQHBhcmFtIHNvdXJjZUNoYWluIEEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0gZm9yIHRoZSBjaGFpbmlkIHdoZXJlIHRoZSBpbXBvcnRzIGFyZSBjb21pbmcgZnJvbS5cbiAgICAqIEBwYXJhbSBmZWUgT3B0aW9uYWwuIFRoZSBhbW91bnQgb2YgZmVlcyB0byBidXJuIGluIGl0cyBzbWFsbGVzdCBkZW5vbWluYXRpb24sIHJlcHJlc2VudGVkIGFzIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vaW5kdXRueS9ibi5qcy98Qk59LiBGZWUgd2lsbCBjb21lIGZyb20gdGhlIGlucHV0cyBmaXJzdCwgaWYgdGhleSBjYW4uXG4gICAgKiBAcGFyYW0gZmVlQXNzZXRJRCBPcHRpb25hbC4gVGhlIGFzc2V0SUQgb2YgdGhlIGZlZXMgYmVpbmcgYnVybmVkLiBcbiAgICAqIEBwYXJhbSBtZW1vIE9wdGlvbmFsIGNvbnRhaW5zIGFyYml0cmFyeSBieXRlcywgdXAgdG8gMjU2IGJ5dGVzXG4gICAgKiBAcGFyYW0gYXNPZiBPcHRpb25hbC4gVGhlIHRpbWVzdGFtcCB0byB2ZXJpZnkgdGhlIHRyYW5zYWN0aW9uIGFnYWluc3QgYXMgYSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2luZHV0bnkvYm4uanMvfEJOfVxuICAgICogQHBhcmFtIGxvY2t0aW1lIE9wdGlvbmFsLiBUaGUgbG9ja3RpbWUgZmllbGQgY3JlYXRlZCBpbiB0aGUgcmVzdWx0aW5nIG91dHB1dHNcbiAgICAqIEBwYXJhbSB0aHJlc2hvbGQgT3B0aW9uYWwuIFRoZSBudW1iZXIgb2Ygc2lnbmF0dXJlcyByZXF1aXJlZCB0byBzcGVuZCB0aGUgZnVuZHMgaW4gdGhlIHJlc3VsdGFudCBVVFhPXG4gICAgKiBAcmV0dXJucyBBbiB1bnNpZ25lZCB0cmFuc2FjdGlvbiBjcmVhdGVkIGZyb20gdGhlIHBhc3NlZCBpbiBwYXJhbWV0ZXJzLlxuICAgICpcbiAgICAqL1xuICAgYnVpbGRJbXBvcnRUeCA9IChcbiAgICBuZXR3b3JraWQ6bnVtYmVyLCBcbiAgICBibG9ja2NoYWluaWQ6QnVmZmVyLFxuICAgIHRvQWRkcmVzc2VzOkFycmF5PEJ1ZmZlcj4sXG4gICAgZnJvbUFkZHJlc3NlczpBcnJheTxCdWZmZXI+LFxuICAgIGNoYW5nZUFkZHJlc3NlczpBcnJheTxCdWZmZXI+LFxuICAgIGF0b21pY3M6QXJyYXk8VVRYTz4sXG4gICAgc291cmNlQ2hhaW46QnVmZmVyID0gdW5kZWZpbmVkLCBcbiAgICBmZWU6Qk4gPSB1bmRlZmluZWQsXG4gICAgZmVlQXNzZXRJRDpCdWZmZXIgPSB1bmRlZmluZWQsIFxuICAgIG1lbW86QnVmZmVyID0gdW5kZWZpbmVkLCBcbiAgICBhc09mOkJOID0gVW5peE5vdygpLFxuICAgIGxvY2t0aW1lOkJOID0gbmV3IEJOKDApLCBcbiAgICB0aHJlc2hvbGQ6bnVtYmVyID0gMVxuICApOlVuc2lnbmVkVHggPT4ge1xuICAgIGNvbnN0IHplcm86Qk4gPSBuZXcgQk4oMCk7XG4gICAgbGV0IGluczpBcnJheTxUcmFuc2ZlcmFibGVJbnB1dD4gPSBbXTtcbiAgICBsZXQgb3V0czpBcnJheTxUcmFuc2ZlcmFibGVPdXRwdXQ+ID0gW107XG4gICAgaWYodHlwZW9mIGZlZSA9PT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgZmVlID0gemVyby5jbG9uZSgpO1xuICAgIH1cblxuICAgIGNvbnN0IGltcG9ydEluczpBcnJheTxUcmFuc2ZlcmFibGVJbnB1dD4gPSBbXTtcbiAgICBsZXQgZmVlcGFpZDpCTiA9IG5ldyBCTigwKTtcbiAgICBsZXQgZmVlQXNzZXRTdHI6c3RyaW5nID0gZmVlQXNzZXRJRC50b1N0cmluZyhcImhleFwiKTtcbiAgICBmb3IobGV0IGk6bnVtYmVyID0gMDsgaSA8IGF0b21pY3MubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IHV0eG86VVRYTyA9IGF0b21pY3NbaV07XG4gICAgICBjb25zdCBhc3NldElEOkJ1ZmZlciA9IHV0eG8uZ2V0QXNzZXRJRCgpOyBcbiAgICAgIGNvbnN0IG91dHB1dDpBbW91bnRPdXRwdXQgPSB1dHhvLmdldE91dHB1dCgpIGFzIEFtb3VudE91dHB1dDtcbiAgICAgIGxldCBhbXQ6Qk4gPSBvdXRwdXQuZ2V0QW1vdW50KCkuY2xvbmUoKTtcblxuICAgICAgbGV0IGluZmVlYW1vdW50ID0gYW10LmNsb25lKCk7XG4gICAgICBsZXQgYXNzZXRTdHI6c3RyaW5nID0gYXNzZXRJRC50b1N0cmluZyhcImhleFwiKTtcbiAgICAgIGlmKFxuICAgICAgICB0eXBlb2YgZmVlQXNzZXRJRCAhPT0gXCJ1bmRlZmluZWRcIiAmJiBcbiAgICAgICAgZmVlLmd0KHplcm8pICYmIFxuICAgICAgICBmZWVwYWlkLmx0KGZlZSkgJiYgXG4gICAgICAgIGFzc2V0U3RyID09PSBmZWVBc3NldFN0clxuICAgICAgKSBcbiAgICAgIHtcbiAgICAgICAgZmVlcGFpZCA9IGZlZXBhaWQuYWRkKGluZmVlYW1vdW50KTtcbiAgICAgICAgaWYoZmVlcGFpZC5ndChmZWUpKSB7XG4gICAgICAgICAgaW5mZWVhbW91bnQgPSBmZWVwYWlkLnN1YihmZWUpO1xuICAgICAgICAgIGZlZXBhaWQgPSBmZWUuY2xvbmUoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBpbmZlZWFtb3VudCA9ICB6ZXJvLmNsb25lKCk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgY29uc3QgdHhpZDpCdWZmZXIgPSB1dHhvLmdldFR4SUQoKTtcbiAgICAgIGNvbnN0IG91dHB1dGlkeDpCdWZmZXIgPSB1dHhvLmdldE91dHB1dElkeCgpO1xuICAgICAgY29uc3QgaW5wdXQ6U0VDUFRyYW5zZmVySW5wdXQgPSBuZXcgU0VDUFRyYW5zZmVySW5wdXQoYW10KTtcbiAgICAgIGNvbnN0IHhmZXJpbjpUcmFuc2ZlcmFibGVJbnB1dCA9IG5ldyBUcmFuc2ZlcmFibGVJbnB1dCh0eGlkLCBvdXRwdXRpZHgsIGFzc2V0SUQsIGlucHV0KTtcbiAgICAgIGNvbnN0IGZyb206QXJyYXk8QnVmZmVyPiA9IG91dHB1dC5nZXRBZGRyZXNzZXMoKTsgXG4gICAgICBjb25zdCBzcGVuZGVyczpBcnJheTxCdWZmZXI+ID0gb3V0cHV0LmdldFNwZW5kZXJzKGZyb20sIGFzT2YpO1xuICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCBzcGVuZGVycy5sZW5ndGg7IGorKykge1xuICAgICAgICBjb25zdCBpZHg6bnVtYmVyID0gb3V0cHV0LmdldEFkZHJlc3NJZHgoc3BlbmRlcnNbal0pO1xuICAgICAgICBpZiAoaWR4ID09PSAtMSkge1xuICAgICAgICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdFcnJvciAtIFVUWE9TZXQuYnVpbGRJbXBvcnRUeDogbm8gc3VjaCAnXG4gICAgICAgICAgKyBgYWRkcmVzcyBpbiBvdXRwdXQ6ICR7c3BlbmRlcnNbal19YCk7XG4gICAgICAgIH1cbiAgICAgICAgeGZlcmluLmdldElucHV0KCkuYWRkU2lnbmF0dXJlSWR4KGlkeCwgc3BlbmRlcnNbal0pO1xuICAgICAgfVxuICAgICAgaW1wb3J0SW5zLnB1c2goeGZlcmluKTtcblxuICAgICAgLy9hZGQgZXh0cmEgb3V0cHV0cyBmb3IgZWFjaCBhbW91bnQgKGNhbGN1bGF0ZWQgZnJvbSB0aGUgaW1wb3J0ZWQgaW5wdXRzKSwgbWludXMgZmVlc1xuICAgICAgaWYoaW5mZWVhbW91bnQuZ3QoemVybykpIHtcbiAgICAgICAgY29uc3Qgc3BlbmRvdXQ6QW1vdW50T3V0cHV0ID0gU2VsZWN0T3V0cHV0Q2xhc3Mob3V0cHV0LmdldE91dHB1dElEKCksXG4gICAgICAgICAgaW5mZWVhbW91bnQsIHRvQWRkcmVzc2VzLCBsb2NrdGltZSwgdGhyZXNob2xkKSBhcyBBbW91bnRPdXRwdXQ7XG4gICAgICAgIGNvbnN0IHhmZXJvdXQ6VHJhbnNmZXJhYmxlT3V0cHV0ID0gbmV3IFRyYW5zZmVyYWJsZU91dHB1dChhc3NldElELCBzcGVuZG91dCk7XG4gICAgICAgIG91dHMucHVzaCh4ZmVyb3V0KTtcbiAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgLy8gZ2V0IHJlbWFpbmluZyBmZWVzIGZyb20gdGhlIHByb3ZpZGVkIGFkZHJlc3Nlc1xuICAgIGxldCBmZWVSZW1haW5pbmc6Qk4gPSBmZWUuc3ViKGZlZXBhaWQpO1xuICAgIGlmKGZlZVJlbWFpbmluZy5ndCh6ZXJvKSAmJiB0aGlzLl9mZWVDaGVjayhmZWVSZW1haW5pbmcsIGZlZUFzc2V0SUQpKSB7XG4gICAgICBjb25zdCBhYWQ6QXNzZXRBbW91bnREZXN0aW5hdGlvbiA9IG5ldyBBc3NldEFtb3VudERlc3RpbmF0aW9uKHRvQWRkcmVzc2VzLCBmcm9tQWRkcmVzc2VzLCBjaGFuZ2VBZGRyZXNzZXMpO1xuICAgICAgYWFkLmFkZEFzc2V0QW1vdW50KGZlZUFzc2V0SUQsIHplcm8sIGZlZVJlbWFpbmluZyk7XG4gICAgICBjb25zdCBzdWNjZXNzOkVycm9yID0gdGhpcy5nZXRNaW5pbXVtU3BlbmRhYmxlKGFhZCwgYXNPZiwgbG9ja3RpbWUsIHRocmVzaG9sZCk7XG4gICAgICBpZih0eXBlb2Ygc3VjY2VzcyA9PT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgICBpbnMgPSBhYWQuZ2V0SW5wdXRzKCk7XG4gICAgICAgIG91dHMgPSBhYWQuZ2V0QWxsT3V0cHV0cygpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhyb3cgc3VjY2VzcztcbiAgICAgIH1cbiAgICB9XG5cbiAgICBjb25zdCBpbXBvcnRUeDpJbXBvcnRUeCA9IG5ldyBJbXBvcnRUeChuZXR3b3JraWQsIGJsb2NrY2hhaW5pZCwgb3V0cywgaW5zLCBtZW1vLCBzb3VyY2VDaGFpbiwgaW1wb3J0SW5zKTtcbiAgICByZXR1cm4gbmV3IFVuc2lnbmVkVHgoaW1wb3J0VHgpO1xuICB9O1xuXG4gICAgLyoqXG4gICAgKiBDcmVhdGVzIGFuIHVuc2lnbmVkIEV4cG9ydFR4IHRyYW5zYWN0aW9uLiBcbiAgICAqXG4gICAgKiBAcGFyYW0gbmV0d29ya2lkIFRoZSBudW1iZXIgcmVwcmVzZW50aW5nIE5ldHdvcmtJRCBvZiB0aGUgbm9kZVxuICAgICogQHBhcmFtIGJsb2NrY2hhaW5pZCBUaGUge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0gcmVwcmVzZW50aW5nIHRoZSBCbG9ja2NoYWluSUQgZm9yIHRoZSB0cmFuc2FjdGlvblxuICAgICogQHBhcmFtIGFtb3VudCBUaGUgYW1vdW50IGJlaW5nIGV4cG9ydGVkIGFzIGEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9pbmR1dG55L2JuLmpzL3xCTn1cbiAgICAqIEBwYXJhbSBhdmF4QXNzZXRJRCB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSBvZiB0aGUgYXNzZXQgSUQgZm9yIEFWQVhcbiAgICAqIEBwYXJhbSB0b0FkZHJlc3NlcyBBbiBhcnJheSBvZiBhZGRyZXNzZXMgYXMge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0gd2hvIHJlY2lldmVzIHRoZSBBVkFYXG4gICAgKiBAcGFyYW0gZnJvbUFkZHJlc3NlcyBBbiBhcnJheSBvZiBhZGRyZXNzZXMgYXMge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0gd2hvIG93bnMgdGhlIEFWQVhcbiAgICAqIEBwYXJhbSBjaGFuZ2VBZGRyZXNzZXMgT3B0aW9uYWwuIFRoZSBhZGRyZXNzZXMgdGhhdCBjYW4gc3BlbmQgdGhlIGNoYW5nZSByZW1haW5pbmcgZnJvbSB0aGUgc3BlbnQgVVRYT3MuXG4gICAgKiBAcGFyYW0gZmVlIE9wdGlvbmFsLiBUaGUgYW1vdW50IG9mIGZlZXMgdG8gYnVybiBpbiBpdHMgc21hbGxlc3QgZGVub21pbmF0aW9uLCByZXByZXNlbnRlZCBhcyB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2luZHV0bnkvYm4uanMvfEJOfVxuICAgICogQHBhcmFtIGRlc3RpbmF0aW9uQ2hhaW4gT3B0aW9uYWwuIEEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0gZm9yIHRoZSBjaGFpbmlkIHdoZXJlIHRvIHNlbmQgdGhlIGFzc2V0LlxuICAgICogQHBhcmFtIGZlZUFzc2V0SUQgT3B0aW9uYWwuIFRoZSBhc3NldElEIG9mIHRoZSBmZWVzIGJlaW5nIGJ1cm5lZC4gXG4gICAgKiBAcGFyYW0gbWVtbyBPcHRpb25hbCBjb250YWlucyBhcmJpdHJhcnkgYnl0ZXMsIHVwIHRvIDI1NiBieXRlc1xuICAgICogQHBhcmFtIGFzT2YgT3B0aW9uYWwuIFRoZSB0aW1lc3RhbXAgdG8gdmVyaWZ5IHRoZSB0cmFuc2FjdGlvbiBhZ2FpbnN0IGFzIGEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9pbmR1dG55L2JuLmpzL3xCTn1cbiAgICAqIEBwYXJhbSBsb2NrdGltZSBPcHRpb25hbC4gVGhlIGxvY2t0aW1lIGZpZWxkIGNyZWF0ZWQgaW4gdGhlIHJlc3VsdGluZyBvdXRwdXRzXG4gICAgKiBAcGFyYW0gdGhyZXNob2xkIE9wdGlvbmFsLiBUaGUgbnVtYmVyIG9mIHNpZ25hdHVyZXMgcmVxdWlyZWQgdG8gc3BlbmQgdGhlIGZ1bmRzIGluIHRoZSByZXN1bHRhbnQgVVRYT1xuICAgICogQHJldHVybnMgQW4gdW5zaWduZWQgdHJhbnNhY3Rpb24gY3JlYXRlZCBmcm9tIHRoZSBwYXNzZWQgaW4gcGFyYW1ldGVycy5cbiAgICAqXG4gICAgKi9cbiAgIGJ1aWxkRXhwb3J0VHggPSAoXG4gICAgbmV0d29ya2lkOm51bWJlciwgXG4gICAgYmxvY2tjaGFpbmlkOkJ1ZmZlcixcbiAgICBhbW91bnQ6Qk4sXG4gICAgYXNzZXRJRDpCdWZmZXIsXG4gICAgdG9BZGRyZXNzZXM6QXJyYXk8QnVmZmVyPixcbiAgICBmcm9tQWRkcmVzc2VzOkFycmF5PEJ1ZmZlcj4sXG4gICAgY2hhbmdlQWRkcmVzc2VzOkFycmF5PEJ1ZmZlcj4gPSB1bmRlZmluZWQsXG4gICAgZGVzdGluYXRpb25DaGFpbjpCdWZmZXIgPSB1bmRlZmluZWQsXG4gICAgZmVlOkJOID0gdW5kZWZpbmVkLFxuICAgIGZlZUFzc2V0SUQ6QnVmZmVyID0gdW5kZWZpbmVkLCBcbiAgICBtZW1vOkJ1ZmZlciA9IHVuZGVmaW5lZCwgXG4gICAgYXNPZjpCTiA9IFVuaXhOb3coKSxcbiAgICBsb2NrdGltZTpCTiA9IG5ldyBCTigwKSwgXG4gICAgdGhyZXNob2xkOm51bWJlciA9IDFcbiAgKTpVbnNpZ25lZFR4ID0+IHtcbiAgICBsZXQgaW5zOkFycmF5PFRyYW5zZmVyYWJsZUlucHV0PiA9IFtdO1xuICAgIGxldCBvdXRzOkFycmF5PFRyYW5zZmVyYWJsZU91dHB1dD4gPSBbXTtcbiAgICBsZXQgZXhwb3J0b3V0czpBcnJheTxUcmFuc2ZlcmFibGVPdXRwdXQ+ID0gW107XG4gICAgXG4gICAgaWYodHlwZW9mIGNoYW5nZUFkZHJlc3NlcyA9PT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgY2hhbmdlQWRkcmVzc2VzID0gdG9BZGRyZXNzZXM7XG4gICAgfVxuXG4gICAgY29uc3QgemVybzpCTiA9IG5ldyBCTigwKTtcbiAgICBcbiAgICBpZiAoYW1vdW50LmVxKHplcm8pKSB7XG4gICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgIH1cblxuICAgIGlmKHR5cGVvZiBmZWVBc3NldElEID09PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICBmZWVBc3NldElEID0gYXNzZXRJRDtcbiAgICB9XG5cbiAgICBpZih0eXBlb2YgZGVzdGluYXRpb25DaGFpbiA9PT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgZGVzdGluYXRpb25DaGFpbiA9IGJpbnRvb2xzLmNiNThEZWNvZGUoUGxhdGZvcm1DaGFpbklEKTtcbiAgICB9XG5cbiAgICBjb25zdCBhYWQ6QXNzZXRBbW91bnREZXN0aW5hdGlvbiA9IG5ldyBBc3NldEFtb3VudERlc3RpbmF0aW9uKHRvQWRkcmVzc2VzLCBmcm9tQWRkcmVzc2VzLCBjaGFuZ2VBZGRyZXNzZXMpO1xuICAgIGlmKGFzc2V0SUQudG9TdHJpbmcoXCJoZXhcIikgPT09IGZlZUFzc2V0SUQudG9TdHJpbmcoXCJoZXhcIikpe1xuICAgICAgYWFkLmFkZEFzc2V0QW1vdW50KGFzc2V0SUQsIGFtb3VudCwgZmVlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgYWFkLmFkZEFzc2V0QW1vdW50KGFzc2V0SUQsIGFtb3VudCwgemVybyk7XG4gICAgICBpZih0aGlzLl9mZWVDaGVjayhmZWUsIGZlZUFzc2V0SUQpKXtcbiAgICAgICAgYWFkLmFkZEFzc2V0QW1vdW50KGZlZUFzc2V0SUQsIHplcm8sIGZlZSk7XG4gICAgICB9XG4gICAgfVxuICAgIGNvbnN0IHN1Y2Nlc3M6RXJyb3IgPSB0aGlzLmdldE1pbmltdW1TcGVuZGFibGUoYWFkLCBhc09mLCBsb2NrdGltZSwgdGhyZXNob2xkKTtcbiAgICBpZih0eXBlb2Ygc3VjY2VzcyA9PT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgaW5zID0gYWFkLmdldElucHV0cygpO1xuICAgICAgb3V0cyA9IGFhZC5nZXRDaGFuZ2VPdXRwdXRzKCk7XG4gICAgICBleHBvcnRvdXRzID0gYWFkLmdldE91dHB1dHMoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhyb3cgc3VjY2VzcztcbiAgICB9XG5cbiAgICBjb25zdCBleHBvcnRUeDpFeHBvcnRUeCA9IG5ldyBFeHBvcnRUeChuZXR3b3JraWQsIGJsb2NrY2hhaW5pZCwgb3V0cywgaW5zLCBtZW1vLCBkZXN0aW5hdGlvbkNoYWluLCBleHBvcnRvdXRzKTtcbiAgICByZXR1cm4gbmV3IFVuc2lnbmVkVHgoZXhwb3J0VHgpO1xuICB9O1xufVxuIl19