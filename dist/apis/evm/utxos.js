"use strict";
/**
 * @packageDocumentation
 * @module API-EVM-UTXOs
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UTXOSet = exports.AssetAmountDestination = exports.UTXO = void 0;
const buffer_1 = require("buffer/");
const bintools_1 = __importDefault(require("../../utils/bintools"));
const bn_js_1 = __importDefault(require("bn.js"));
const outputs_1 = require("./outputs");
const constants_1 = require("./constants");
const inputs_1 = require("./inputs");
const helperfunctions_1 = require("../../utils/helperfunctions");
const utxos_1 = require("../../common/utxos");
const constants_2 = require("../../utils/constants");
const assetamount_1 = require("../../common/assetamount");
const serialization_1 = require("../../utils/serialization");
const tx_1 = require("./tx");
const importtx_1 = require("./importtx");
const exporttx_1 = require("./exporttx");
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
    create(codecID = constants_1.EVMConstants.LATESTCODEC, txID = undefined, outputidx = undefined, assetID = undefined, output = undefined) {
        return new UTXO(codecID, txID, outputidx, assetID, output);
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
                        spenders.forEach((spender) => {
                            const idx = uout.getAddressIdx(spender);
                            if (idx === -1) {
                                /* istanbul ignore next */
                                throw new Error("Error - UTXOSet.getMinimumSpendable: no such address in output");
                            }
                            xferin.getInput().addSignatureIdx(idx, spender);
                        });
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
                return new Error(`Error - UTXOSet.getMinimumSpendable: insufficient funds to create the transaction`);
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
          * Creates an unsigned ImportTx transaction.
          *
          * @param networkID The number representing NetworkID of the node
          * @param blockchainID The {@link https://github.com/feross/buffer|Buffer} representing the BlockchainID for the transaction
          * @param toAddresses The addresses to send the funds
          * @param fromAddresses The addresses being used to send the funds from the UTXOs {@link https://github.com/feross/buffer|Buffer}
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
        this.buildImportTx = (networkID, blockchainID, toAddresses, fromAddresses, atomics, sourceChain = undefined, fee = undefined, feeAssetID = undefined) => {
            const zero = new bn_js_1.default(0);
            let ins = [];
            const outs = [];
            if (typeof fee === "undefined") {
                fee = zero.clone();
            }
            let feepaid = new bn_js_1.default(0);
            const feeAssetStr = feeAssetID.toString("hex");
            atomics.forEach((atomic) => {
                const assetID = atomic.getAssetID();
                const output = atomic.getOutput();
                const amt = output.getAmount().clone();
                let infeeamount = amt.clone();
                const assetStr = assetID.toString("hex");
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
                const txid = atomic.getTxID();
                const outputidx = atomic.getOutputIdx();
                const input = new inputs_1.SECPTransferInput(amt);
                const xferin = new inputs_1.TransferableInput(txid, outputidx, assetID, input);
                const from = output.getAddresses();
                const spenders = output.getSpenders(from);
                spenders.forEach((spender) => {
                    const idx = output.getAddressIdx(spender);
                    if (idx === -1) {
                        /* istanbul ignore next */
                        throw new Error("Error - UTXOSet.buildImportTx: no such address in output");
                    }
                    xferin.getInput().addSignatureIdx(idx, spender);
                });
                ins.push(xferin);
                // lexicographically sort array
                ins = ins.sort(inputs_1.TransferableInput.comparator());
                // add extra outputs for each amount (calculated from the imported inputs), minus fees
                if (infeeamount.gt(zero)) {
                    const evmOutput = new outputs_1.EVMOutput(toAddresses[0], amt, assetID);
                    outs.push(evmOutput);
                }
            });
            const importTx = new importtx_1.ImportTx(networkID, blockchainID, sourceChain, ins, outs);
            return new tx_1.UnsignedTx(importTx);
        };
        /**
        * Creates an unsigned ExportTx transaction.
        *
        * @param networkID The number representing NetworkID of the node
        * @param blockchainID The {@link https://github.com/feross/buffer|Buffer} representing the BlockchainID for the transaction
        * @param amount The amount being exported as a {@link https://github.com/indutny/bn.js/|BN}
        * @param djtxAssetID {@link https://github.com/feross/buffer|Buffer} of the AssetID for DJTX
        * @param toAddresses An array of addresses as {@link https://github.com/feross/buffer|Buffer} who recieves the DJTX
        * @param fromAddresses An array of addresses as {@link https://github.com/feross/buffer|Buffer} who owns the DJTX
        * @param changeAddresses Optional. The addresses that can spend the change remaining from the spent UTXOs.
        * @param destinationChain Optional. A {@link https://github.com/feross/buffer|Buffer} for the chainid where to send the asset.
        * @param fee Optional. The amount of fees to burn in its smallest denomination, represented as {@link https://github.com/indutny/bn.js/|BN}
        * @param feeAssetID Optional. The assetID of the fees being burned.
        * @param asOf Optional. The timestamp to verify the transaction against as a {@link https://github.com/indutny/bn.js/|BN}
        * @param locktime Optional. The locktime field created in the resulting outputs
        * @param threshold Optional. The number of signatures required to spend the funds in the resultant UTXO
        * @returns An unsigned transaction created from the passed in parameters.
        *
        */
        this.buildExportTx = (networkID, blockchainID, amount, djtxAssetID, toAddresses, fromAddresses, changeAddresses = undefined, destinationChain = undefined, fee = undefined, feeAssetID = undefined, asOf = helperfunctions_1.UnixNow(), locktime = new bn_js_1.default(0), threshold = 1) => {
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
            if (typeof feeAssetID === 'undefined') {
                feeAssetID = djtxAssetID;
            }
            else if (feeAssetID.toString('hex') !== djtxAssetID.toString('hex')) {
                /* istanbul ignore next */
                throw new Error('Error - UTXOSet.buildExportTx: feeAssetID must match djtxAssetID');
            }
            if (typeof destinationChain === 'undefined') {
                destinationChain = bintools.cb58Decode(constants_2.PlatformChainID);
            }
            const aad = new AssetAmountDestination(toAddresses, fromAddresses, changeAddresses);
            if (djtxAssetID.toString('hex') === feeAssetID.toString('hex')) {
                aad.addAssetAmount(djtxAssetID, amount, fee);
            }
            else {
                aad.addAssetAmount(djtxAssetID, amount, zero);
                if (this._feeCheck(fee, feeAssetID)) {
                    aad.addAssetAmount(feeAssetID, zero, fee);
                }
            }
            const success = this.getMinimumSpendable(aad, asOf, locktime, threshold);
            if (typeof success === 'undefined') {
                outs = aad.getChangeOutputs();
                exportouts = aad.getOutputs();
            }
            else {
                throw success;
            }
            const exportTx = new exporttx_1.ExportTx(networkID, blockchainID, destinationChain, ins, exportouts);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXR4b3MuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9zcmMvYXBpcy9ldm0vdXR4b3MudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7R0FHRzs7Ozs7O0FBRUgsb0NBQWlDO0FBQ2pDLG9FQUE0QztBQUM1QyxrREFBdUI7QUFDdkIsdUNBS21CO0FBQ25CLDJDQUEyQztBQUMzQyxxQ0FJa0I7QUFFbEIsaUVBQXNEO0FBQ3RELDhDQUc0QjtBQUM1QixxREFBd0Q7QUFDeEQsMERBR2tDO0FBQ2xDLDZEQUdtQztBQUNuQyw2QkFBa0M7QUFDbEMseUNBQXNDO0FBQ3RDLHlDQUFzQztBQUVyQzs7R0FFRztBQUNILE1BQU0sUUFBUSxHQUFhLGtCQUFRLENBQUMsV0FBVyxFQUFFLENBQUM7QUFDbEQsTUFBTSxVQUFVLEdBQWtCLDZCQUFhLENBQUMsV0FBVyxFQUFFLENBQUM7QUFFOUQ7O0dBRUc7QUFDSCxNQUFhLElBQUssU0FBUSxvQkFBWTtJQUF0Qzs7UUFDWSxjQUFTLEdBQUcsTUFBTSxDQUFDO1FBQ25CLFlBQU8sR0FBRyxTQUFTLENBQUM7SUFtRWhDLENBQUM7SUFqRUMsd0JBQXdCO0lBRXhCLFdBQVcsQ0FBQyxNQUFjLEVBQUUsV0FBK0IsS0FBSztRQUM5RCxLQUFLLENBQUMsV0FBVyxDQUFDLE1BQU0sRUFBRSxRQUFRLENBQUMsQ0FBQztRQUNwQyxJQUFJLENBQUMsTUFBTSxHQUFHLDJCQUFpQixDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDO1FBQzdELElBQUksQ0FBQyxNQUFNLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsRUFBRSxRQUFRLENBQUMsQ0FBQztJQUN0RCxDQUFDO0lBRUQsVUFBVSxDQUFDLEtBQWEsRUFBRSxTQUFpQixDQUFDO1FBQzFDLElBQUksQ0FBQyxPQUFPLEdBQUcsUUFBUSxDQUFDLFFBQVEsQ0FBQyxLQUFLLEVBQUUsTUFBTSxF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RSxVQUFrQjtRQUNuQyxPQUFPLENBQUMsT0FBTyxHQUFHLEtBQUssV0FBVztZQUNsQyxPQUFPLFVBQVUsS0FBSyxXQUFXO1lBQ2pDLEdBQUcsQ0FBQyxFQUFFLENBQUMsSUFBSSxlQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxVQUFVLFlBQVksZUFBTSxDQUFDLENBQUM7SUFDckQsQ0FBQztDQXlQRjtBQWxURCwwQkFrVEMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBwYWNrYWdlRG9jdW1lbnRhdGlvblxuICogQG1vZHVsZSBBUEktRVZNLVVUWE9zXG4gKi9cblxuaW1wb3J0IHsgQnVmZmVyIH0gZnJvbSAnYnVmZmVyLyc7XG5pbXBvcnQgQmluVG9vbHMgZnJvbSAnLi4vLi4vdXRpbHMvYmludG9vbHMnO1xuaW1wb3J0IEJOIGZyb20gXCJibi5qc1wiO1xuaW1wb3J0IHsgXG4gIEFtb3VudE91dHB1dCwgXG4gIFNlbGVjdE91dHB1dENsYXNzLCBcbiAgVHJhbnNmZXJhYmxlT3V0cHV0LCBcbiAgRVZNT3V0cHV0IFxufSBmcm9tICcuL291dHB1dHMnO1xuaW1wb3J0IHsgRVZNQ29uc3RhbnRzIH0gZnJvbSAnLi9jb25zdGFudHMnO1xuaW1wb3J0IHsgXG4gIEVWTUlucHV0LCBcbiAgU0VDUFRyYW5zZmVySW5wdXQsIFxuICBUcmFuc2ZlcmFibGVJbnB1dCBcbn0gZnJvbSAnLi9pbnB1dHMnO1xuaW1wb3J0IHsgT3V0cHV0IH0gZnJvbSAnLi4vLi4vY29tbW9uL291dHB1dCc7XG5pbXBvcnQgeyBVbml4Tm93IH0gZnJvbSAnLi4vLi4vdXRpbHMvaGVscGVyZnVuY3Rpb25zJztcbmltcG9ydCB7IFxuICBTdGFuZGFyZFVUWE8sIFxuICBTdGFuZGFyZFVUWE9TZXQgXG59IGZyb20gJy4uLy4uL2NvbW1vbi91dHhvcyc7XG5pbXBvcnQgeyBQbGF0Zm9ybUNoYWluSUQgfSBmcm9tICcuLi8uLi91dGlscy9jb25zdGFudHMnO1xuaW1wb3J0IHsgXG4gIFN0YW5kYXJkQXNzZXRBbW91bnREZXN0aW5hdGlvbiwgXG4gIEFzc2V0QW1vdW50IFxufSBmcm9tICcuLi8uLi9jb21tb24vYXNzZXRhbW91bnQnO1xuaW1wb3J0IHsgXG4gIFNlcmlhbGl6YXRpb24sIFxuICBTZXJpYWxpemVkRW5jb2RpbmcgXG59IGZyb20gJy4uLy4uL3V0aWxzL3NlcmlhbGl6YXRpb24nO1xuaW1wb3J0IHsgVW5zaWduZWRUeCB9IGZyb20gJy4vdHgnO1xuaW1wb3J0IHsgSW1wb3J0VHggfSBmcm9tICcuL2ltcG9ydHR4JztcbmltcG9ydCB7IEV4cG9ydFR4IH0gZnJvbSAnLi9leHBvcnR0eCc7XG4gXG4gLyoqXG4gICogQGlnbm9yZVxuICAqL1xuIGNvbnN0IGJpbnRvb2xzOiBCaW5Ub29scyA9IEJpblRvb2xzLmdldEluc3RhbmNlKCk7XG4gY29uc3Qgc2VyaWFsaXplcjogU2VyaWFsaXphdGlvbiA9IFNlcmlhbGl6YXRpb24uZ2V0SW5zdGFuY2UoKTtcbiBcbiAvKipcbiAgKiBDbGFzcyBmb3IgcmVwcmVzZW50aW5nIGEgc2luZ2xlIFVUWE8uXG4gICovXG4gZXhwb3J0IGNsYXNzIFVUWE8gZXh0ZW5kcyBTdGFuZGFyZFVUWE8ge1xuICAgcHJvdGVjdGVkIF90eXBlTmFtZSA9IFwiVVRYT1wiO1xuICAgcHJvdGVjdGVkIF90eXBlSUQgPSB1bmRlZmluZWQ7XG4gXG4gICAvL3NlcmlhbGl6ZSBpcyBpbmhlcml0ZWRcbiBcbiAgIGRlc2VyaWFsaXplKGZpZWxkczogb2JqZWN0LCBlbmNvZGluZzogU2VyaWFsaXplZEVuY29kaW5nID0gXCJoZXhcIikge1xuICAgICBzdXBlci5kZXNlcmlhbGl6ZShmaWVsZHMsIGVuY29kaW5nKTtcbiAgICAgdGhpcy5vdXRwdXQgPSBTZWxlY3RPdXRwdXRDbGFzcyhmaWVsZHNbXCJvdXRwdXRcIl1bXCJfdHlwZUlEXCJdKTtcbiAgICAgdGhpcy5vdXRwdXQuZGVzZXJpYWxpemUoZmllbGRzW1wib3V0cHV0XCJdLCBlbmNvZGluZyk7XG4gICB9XG4gXG4gICBmcm9tQnVmZmVyKGJ5dGVzOiBCdWZmZXIsIG9mZnNldDogbnVtYmVyID0gMCk6bnVtYmVyIHtcbiAgICAgdGhpcy5jb2RlY2lkID0gYmludG9vbHMuY29weUZyb20oYnl0ZXMsIG9mZnNldCwgb2Zmc2V0ICsgMik7XG4gICAgIG9mZnNldCArPSAyO1xuICAgICB0aGlzLnR4aWQgPSBiaW50b29scy5jb3B5RnJvbShieXRlcywgb2Zmc2V0LCBvZmZzZXQgKyAzMik7XG4gICAgIG9mZnNldCArPSAzMjtcbiAgICAgdGhpcy5vdXRwdXRpZHggPSBiaW50b29scy5jb3B5RnJvbShieXRlcywgb2Zmc2V0LCBvZmZzZXQgKyA0KTtcbiAgICAgb2Zmc2V0ICs9IDQ7XG4gICAgIHRoaXMuYXNzZXRpZCA9IGJpbnRvb2xzLmNvcHlGcm9tKGJ5dGVzLCBvZmZzZXQsIG9mZnNldCArIDMyKTtcbiAgICAgb2Zmc2V0ICs9IDMyO1xuICAgICBjb25zdCBvdXRwdXRpZDogbnVtYmVyID0gYmludG9vbHMuY29weUZyb20oYnl0ZXMsIG9mZnNldCwgb2Zmc2V0ICsgNCkucmVhZFVJbnQzMkJFKDApO1xuICAgICBvZmZzZXQgKz0gNDtcbiAgICAgdGhpcy5vdXRwdXQgPSBTZWxlY3RPdXRwdXRDbGFzcyhvdXRwdXRpZCk7XG4gICAgIHJldHVybiB0aGlzLm91dHB1dC5mcm9tQnVmZmVyKGJ5dGVzLCBvZmZzZXQpO1xuICAgfVxuIFxuICAgLyoqXG4gICAgKiBUYWtlcyBhIGJhc2UtNTggc3RyaW5nIGNvbnRhaW5pbmcgYSBbW1VUWE9dXSwgcGFyc2VzIGl0LCBwb3B1bGF0ZXMgdGhlIGNsYXNzLCBhbmQgcmV0dXJucyB0aGUgbGVuZ3RoIG9mIHRoZSBTdGFuZGFyZFVUWE8gaW4gYnl0ZXMuXG4gICAgKlxuICAgICogQHBhcmFtIHNlcmlhbGl6ZWQgQSBiYXNlLTU4IHN0cmluZyBjb250YWluaW5nIGEgcmF3IFtbVVRYT11dXG4gICAgKlxuICAgICogQHJldHVybnMgVGhlIGxlbmd0aCBvZiB0aGUgcmF3IFtbVVRYT11dXG4gICAgKlxuICAgICogQHJlbWFya3NcbiAgICAqIHVubGlrZSBtb3N0IGZyb21TdHJpbmdzLCBpdCBleHBlY3RzIHRoZSBzdHJpbmcgdG8gYmUgc2VyaWFsaXplZCBpbiBjYjU4IGZvcm1hdFxuICAgICovXG4gICBmcm9tU3RyaW5nKHNlcmlhbGl6ZWQ6IHN0cmluZyk6IG51bWJlciB7XG4gICAgICAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cbiAgICAgICByZXR1cm4gdGhpcy5mcm9tQnVmZmVyKGJpbnRvb2xzLmNiNThEZWNvZGUoc2VyaWFsaXplZCkpO1xuICAgfVxuIFxuICAgLyoqXG4gICAgKiBSZXR1cm5zIGEgYmFzZS01OCByZXByZXNlbnRhdGlvbiBvZiB0aGUgW1tVVFhPXV0uXG4gICAgKlxuICAgICogQHJlbWFya3NcbiAgICAqIHVubGlrZSBtb3N0IHRvU3RyaW5ncywgdGhpcyByZXR1cm5zIGluIGNiNTggc2VyaWFsaXphdGlvbiBmb3JtYXRcbiAgICAqL1xuICAgdG9TdHJpbmcoKTogc3RyaW5nIHtcbiAgICAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cbiAgICAgcmV0dXJuIGJpbnRvb2xzLmNiNThFbmNvZGUodGhpcy50b0J1ZmZlcigpKTtcbiAgIH1cbiBcbiAgIGNsb25lKCk6IHRoaXMge1xuICAgICBjb25zdCB1dHhvOiBVVFhPID0gbmV3IFVUWE8oKTtcbiAgICAgdXR4by5mcm9tQnVmZmVyKHRoaXMudG9CdWZmZXIoKSk7XG4gICAgIHJldHVybiB1dHhvIGFzIHRoaXM7XG4gICB9XG4gXG4gICBjcmVhdGUoXG4gICAgIGNvZGVjSUQ6IG51bWJlciA9IEVWTUNvbnN0YW50cy5MQVRFU1RDT0RFQywgXG4gICAgIHR4SUQ6IEJ1ZmZlciA9IHVuZGVmaW5lZCxcbiAgICAgb3V0cHV0aWR4OiBCdWZmZXIgfCBudW1iZXIgPSB1bmRlZmluZWQsXG4gICAgIGFzc2V0SUQ6IEJ1ZmZlciA9IHVuZGVmaW5lZCxcbiAgICAgb3V0cHV0OiBPdXRwdXQgPSB1bmRlZmluZWQpOnRoaXMgXG4gICB7XG4gICAgIHJldHVybiBuZXcgVVRYTyhjb2RlY0lELCB0eElELCBvdXRwdXRpZHgsIGFzc2V0SUQsIG91dHB1dCkgYXMgdGhpcztcbiAgIH1cbiBcbiB9XG4gXG4gZXhwb3J0IGNsYXNzIEFzc2V0QW1vdW50RGVzdGluYXRpb24gZXh0ZW5kcyBTdGFuZGFyZEFzc2V0QW1vdW50RGVzdGluYXRpb248VHJhbnNmZXJhYmxlT3V0cHV0LCBUcmFuc2ZlcmFibGVJbnB1dD4ge31cbiBcbiAvKipcbiAgKiBDbGFzcyByZXByZXNlbnRpbmcgYSBzZXQgb2YgW1tVVFhPXV1zLlxuICAqL1xuIGV4cG9ydCBjbGFzcyBVVFhPU2V0IGV4dGVuZHMgU3RhbmRhcmRVVFhPU2V0PFVUWE8+e1xuICAgcHJvdGVjdGVkIF90eXBlTmFtZSA9IFwiVVRYT1NldFwiO1xuICAgcHJvdGVjdGVkIF90eXBlSUQgPSB1bmRlZmluZWQ7XG4gICBcbiAgIC8vc2VyaWFsaXplIGlzIGluaGVyaXRlZFxuIFxuICAgZGVzZXJpYWxpemUoZmllbGRzOiBvYmplY3QsIGVuY29kaW5nOiBTZXJpYWxpemVkRW5jb2RpbmcgPSBcImhleFwiKSB7XG4gICAgIHN1cGVyLmRlc2VyaWFsaXplKGZpZWxkcywgZW5jb2RpbmcpO1xuICAgICBsZXQgdXR4b3MgPSB7fTtcbiAgICAgZm9yKGxldCB1dHhvaWQgaW4gZmllbGRzW1widXR4b3NcIl0pe1xuICAgICAgIGxldCB1dHhvaWRDbGVhbmVkOiBzdHJpbmcgPSBzZXJpYWxpemVyLmRlY29kZXIodXR4b2lkLCBlbmNvZGluZywgXCJiYXNlNThcIiwgXCJiYXNlNThcIik7XG4gICAgICAgdXR4b3NbdXR4b2lkQ2xlYW5lZF0gPSBuZXcgVVRYTygpO1xuICAgICAgIHV0eG9zW3V0eG9pZENsZWFuZWRdLmRlc2VyaWFsaXplKGZpZWxkc1tcInV0eG9zXCJdW3V0eG9pZF0sIGVuY29kaW5nKTtcbiAgICAgfVxuICAgICBsZXQgYWRkcmVzc1VUWE9zID0ge307XG4gICAgIGZvcihsZXQgYWRkcmVzcyBpbiBmaWVsZHNbXCJhZGRyZXNzVVRYT3NcIl0pe1xuICAgICAgIGxldCBhZGRyZXNzQ2xlYW5lZDogc3RyaW5nID0gc2VyaWFsaXplci5kZWNvZGVyKGFkZHJlc3MsIGVuY29kaW5nLCBcImNiNThcIiwgXCJoZXhcIik7XG4gICAgICAgbGV0IHV0eG9iYWxhbmNlID0ge307XG4gICAgICAgZm9yKGxldCB1dHhvaWQgaW4gZmllbGRzW1wiYWRkcmVzc1VUWE9zXCJdW2FkZHJlc3NdKXtcbiAgICAgICAgIGxldCB1dHhvaWRDbGVhbmVkOiBzdHJpbmcgPSBzZXJpYWxpemVyLmRlY29kZXIodXR4b2lkLCBlbmNvZGluZywgXCJiYXNlNThcIiwgXCJiYXNlNThcIik7XG4gICAgICAgICB1dHhvYmFsYW5jZVt1dHhvaWRDbGVhbmVkXSA9IHNlcmlhbGl6ZXIuZGVjb2RlcihmaWVsZHNbXCJhZGRyZXNzVVRYT3NcIl1bYWRkcmVzc11bdXR4b2lkXSwgZW5jb2RpbmcsIFwiZGVjaW1hbFN0cmluZ1wiLCBcIkJOXCIpO1xuICAgICAgIH1cbiAgICAgICBhZGRyZXNzVVRYT3NbYWRkcmVzc0NsZWFuZWRdID0gdXR4b2JhbGFuY2U7XG4gICAgIH1cbiAgICAgdGhpcy51dHhvcyA9IHV0eG9zO1xuICAgICB0aGlzLmFkZHJlc3NVVFhPcyA9IGFkZHJlc3NVVFhPcztcbiAgIH1cbiBcbiAgIHBhcnNlVVRYTyh1dHhvOiBVVFhPIHwgc3RyaW5nKTogVVRYTyB7XG4gICAgIGNvbnN0IHV0eG92YXI6IFVUWE8gPSBuZXcgVVRYTygpO1xuICAgICAvLyBmb3JjZSBhIGNvcHlcbiAgICAgaWYgKHR5cGVvZiB1dHhvID09PSAnc3RyaW5nJykge1xuICAgICAgIHV0eG92YXIuZnJvbUJ1ZmZlcihiaW50b29scy5jYjU4RGVjb2RlKHV0eG8pKTtcbiAgICAgfSBlbHNlIGlmICh1dHhvIGluc3RhbmNlb2YgVVRYTykge1xuICAgICAgIHV0eG92YXIuZnJvbUJ1ZmZlcih1dHhvLnRvQnVmZmVyKCkpOyAvLyBmb3JjZXMgYSBjb3B5XG4gICAgIH0gZWxzZSB7XG4gICAgICAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cbiAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJFcnJvciAtIFVUWE8ucGFyc2VVVFhPOiB1dHhvIHBhcmFtZXRlciBpcyBub3QgYSBVVFhPIG9yIHN0cmluZ1wiKTtcbiAgICAgfVxuICAgICByZXR1cm4gdXR4b3ZhclxuICAgfVxuIFxuICAgY3JlYXRlKC4uLmFyZ3M6IGFueVtdKTogdGhpc3tcbiAgICAgcmV0dXJuIG5ldyBVVFhPU2V0KCkgYXMgdGhpcztcbiAgIH1cbiBcbiAgIGNsb25lKCk6IHRoaXMge1xuICAgICBjb25zdCBuZXdzZXQ6IFVUWE9TZXQgPSB0aGlzLmNyZWF0ZSgpO1xuICAgICBjb25zdCBhbGxVVFhPczogVVRYT1tdID0gdGhpcy5nZXRBbGxVVFhPcygpO1xuICAgICBuZXdzZXQuYWRkQXJyYXkoYWxsVVRYT3MpXG4gICAgIHJldHVybiBuZXdzZXQgYXMgdGhpcztcbiAgIH1cbiBcbiAgIF9mZWVDaGVjayhmZWU6IEJOLCBmZWVBc3NldElEOiBCdWZmZXIpOiBib29sZWFuIHtcbiAgICAgcmV0dXJuICh0eXBlb2YgZmVlICE9PSBcInVuZGVmaW5lZFwiICYmIFxuICAgICB0eXBlb2YgZmVlQXNzZXRJRCAhPT0gXCJ1bmRlZmluZWRcIiAmJlxuICAgICBmZWUuZ3QobmV3IEJOKDApKSAmJiBmZWVBc3NldElEIGluc3RhbmNlb2YgQnVmZmVyKTtcbiAgIH1cbiBcbiAgIGdldE1pbmltdW1TcGVuZGFibGUgPSAoXG4gICAgIGFhZDpBc3NldEFtb3VudERlc3RpbmF0aW9uLCBcbiAgICAgYXNPZjpCTiA9IFVuaXhOb3coKSwgXG4gICAgIGxvY2t0aW1lOkJOID0gbmV3IEJOKDApLCBcbiAgICAgdGhyZXNob2xkOm51bWJlciA9IDFcbiAgICApOkVycm9yID0+IHtcbiAgICAgY29uc3QgdXR4b0FycmF5OiBVVFhPW10gPSB0aGlzLmdldEFsbFVUWE9zKCk7XG4gICAgIGNvbnN0IG91dGlkczogb2JqZWN0ID0ge307XG4gICAgIGZvcihsZXQgaTogbnVtYmVyID0gMDsgaSA8IHV0eG9BcnJheS5sZW5ndGggJiYgIWFhZC5jYW5Db21wbGV0ZSgpOyBpKyspIHtcbiAgICAgICBjb25zdCB1OiBVVFhPID0gdXR4b0FycmF5W2ldO1xuICAgICAgIGNvbnN0IGFzc2V0S2V5OiBzdHJpbmcgPSB1LmdldEFzc2V0SUQoKS50b1N0cmluZyhcImhleFwiKTtcbiAgICAgICBjb25zdCBmcm9tQWRkcmVzc2VzOiBCdWZmZXJbXSA9IGFhZC5nZXRTZW5kZXJzKCk7XG4gICAgICAgaWYodS5nZXRPdXRwdXQoKSBpbnN0YW5jZW9mIEFtb3VudE91dHB1dCAmJiBhYWQuYXNzZXRFeGlzdHMoYXNzZXRLZXkpICYmIHUuZ2V0T3V0cHV0KCkubWVldHNUaHJlc2hvbGQoZnJvbUFkZHJlc3NlcywgYXNPZikpIHtcbiAgICAgICAgIGNvbnN0IGFtOiBBc3NldEFtb3VudCA9IGFhZC5nZXRBc3NldEFtb3VudChhc3NldEtleSk7XG4gICAgICAgICBpZighYW0uaXNGaW5pc2hlZCgpKXtcbiAgICAgICAgICAgY29uc3QgdW91dDogQW1vdW50T3V0cHV0ID0gdS5nZXRPdXRwdXQoKSBhcyBBbW91bnRPdXRwdXQ7XG4gICAgICAgICAgIG91dGlkc1thc3NldEtleV0gPSB1b3V0LmdldE91dHB1dElEKCk7XG4gICAgICAgICAgIGNvbnN0IGFtb3VudCA9IHVvdXQuZ2V0QW1vdW50KCk7XG4gICAgICAgICAgIGFtLnNwZW5kQW1vdW50KGFtb3VudCk7XG4gICAgICAgICAgIGNvbnN0IHR4aWQ6IEJ1ZmZlciA9IHUuZ2V0VHhJRCgpO1xuICAgICAgICAgICBjb25zdCBvdXRwdXRpZHg6IEJ1ZmZlciA9IHUuZ2V0T3V0cHV0SWR4KCk7XG4gICAgICAgICAgIGNvbnN0IGlucHV0OiBTRUNQVHJhbnNmZXJJbnB1dCA9IG5ldyBTRUNQVHJhbnNmZXJJbnB1dChhbW91bnQpO1xuICAgICAgICAgICBjb25zdCB4ZmVyaW46IFRyYW5zZmVyYWJsZUlucHV0ID0gbmV3IFRyYW5zZmVyYWJsZUlucHV0KHR4aWQsIG91dHB1dGlkeCwgdS5nZXRBc3NldElEKCksIGlucHV0KTtcbiAgICAgICAgICAgY29uc3Qgc3BlbmRlcnM6IEJ1ZmZlcltdID0gdW91dC5nZXRTcGVuZGVycyhmcm9tQWRkcmVzc2VzLCBhc09mKTtcbiAgICAgICAgICAgc3BlbmRlcnMuZm9yRWFjaCgoc3BlbmRlcjogQnVmZmVyKSA9PiB7XG4gICAgICAgICAgICAgY29uc3QgaWR4OiBudW1iZXIgPSB1b3V0LmdldEFkZHJlc3NJZHgoc3BlbmRlcik7XG4gICAgICAgICAgICAgaWYgKGlkeCA9PT0gLTEpIHtcbiAgICAgICAgICAgICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXG4gICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJFcnJvciAtIFVUWE9TZXQuZ2V0TWluaW11bVNwZW5kYWJsZTogbm8gc3VjaCBhZGRyZXNzIGluIG91dHB1dFwiKTtcbiAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgeGZlcmluLmdldElucHV0KCkuYWRkU2lnbmF0dXJlSWR4KGlkeCwgc3BlbmRlcik7XG4gICAgICAgICAgIH0pO1xuICAgICAgICAgICBhYWQuYWRkSW5wdXQoeGZlcmluKTtcbiAgICAgICAgIH0gZWxzZSBpZihhYWQuYXNzZXRFeGlzdHMoYXNzZXRLZXkpICYmICEodS5nZXRPdXRwdXQoKSBpbnN0YW5jZW9mIEFtb3VudE91dHB1dCkpe1xuICAgICAgICAgICAvKipcbiAgICAgICAgICAgICogTGVhdmluZyB0aGUgYmVsb3cgbGluZXMsIG5vdCBzaW1wbHkgZm9yIHBvc3Rlcml0eSwgYnV0IGZvciBjbGFyaWZpY2F0aW9uLlxuICAgICAgICAgICAgKiBBc3NldElEcyBtYXkgaGF2ZSBtaXhlZCBPdXRwdXRUeXBlcy4gXG4gICAgICAgICAgICAqIFNvbWUgb2YgdGhvc2UgT3V0cHV0VHlwZXMgbWF5IGltcGxlbWVudCBBbW91bnRPdXRwdXQuXG4gICAgICAgICAgICAqIE90aGVycyBtYXkgbm90LlxuICAgICAgICAgICAgKiBTaW1wbHkgY29udGludWUgaW4gdGhpcyBjb25kaXRpb24uXG4gICAgICAgICAgICAqL1xuICAgICAgICAgICAvKnJldHVybiBuZXcgRXJyb3IoJ0Vycm9yIC0gVVRYT1NldC5nZXRNaW5pbXVtU3BlbmRhYmxlOiBvdXRwdXRJRCBkb2VzIG5vdCAnXG4gICAgICAgICAgICAgKyBgaW1wbGVtZW50IEFtb3VudE91dHB1dDogJHt1LmdldE91dHB1dCgpLmdldE91dHB1dElEfWApOyovXG4gICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICB9XG4gICAgICAgfVxuICAgICB9XG4gICAgIGlmKCFhYWQuY2FuQ29tcGxldGUoKSkge1xuICAgICAgIHJldHVybiBuZXcgRXJyb3IoYEVycm9yIC0gVVRYT1NldC5nZXRNaW5pbXVtU3BlbmRhYmxlOiBpbnN1ZmZpY2llbnQgZnVuZHMgdG8gY3JlYXRlIHRoZSB0cmFuc2FjdGlvbmApO1xuICAgICB9XG4gICAgIGNvbnN0IGFtb3VudHM6IEFzc2V0QW1vdW50W10gPSBhYWQuZ2V0QW1vdW50cygpO1xuICAgICBjb25zdCB6ZXJvOiBCTiA9IG5ldyBCTigwKTtcbiAgICAgZm9yKGxldCBpOiBudW1iZXIgPSAwOyBpIDwgYW1vdW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgIGNvbnN0IGFzc2V0S2V5OiBzdHJpbmcgPSBhbW91bnRzW2ldLmdldEFzc2V0SURTdHJpbmcoKTtcbiAgICAgICBjb25zdCBhbW91bnQ6IEJOID0gYW1vdW50c1tpXS5nZXRBbW91bnQoKTtcbiAgICAgICBpZiAoYW1vdW50Lmd0KHplcm8pKSB7XG4gICAgICAgICBjb25zdCBzcGVuZG91dDogQW1vdW50T3V0cHV0ID0gU2VsZWN0T3V0cHV0Q2xhc3Mob3V0aWRzW2Fzc2V0S2V5XSxcbiAgICAgICAgICAgYW1vdW50LCBhYWQuZ2V0RGVzdGluYXRpb25zKCksIGxvY2t0aW1lLCB0aHJlc2hvbGQpIGFzIEFtb3VudE91dHB1dDtcbiAgICAgICAgIGNvbnN0IHhmZXJvdXQ6IFRyYW5zZmVyYWJsZU91dHB1dCA9IG5ldyBUcmFuc2ZlcmFibGVPdXRwdXQoYW1vdW50c1tpXS5nZXRBc3NldElEKCksIHNwZW5kb3V0KTtcbiAgICAgICAgIGFhZC5hZGRPdXRwdXQoeGZlcm91dCk7XG4gICAgICAgfVxuICAgICAgIGNvbnN0IGNoYW5nZTogQk4gPSBhbW91bnRzW2ldLmdldENoYW5nZSgpO1xuICAgICAgIGlmIChjaGFuZ2UuZ3QoemVybykpIHtcbiAgICAgICAgIGNvbnN0IGNoYW5nZW91dDogQW1vdW50T3V0cHV0ID0gU2VsZWN0T3V0cHV0Q2xhc3Mob3V0aWRzW2Fzc2V0S2V5XSxcbiAgICAgICAgICAgY2hhbmdlLCBhYWQuZ2V0Q2hhbmdlQWRkcmVzc2VzKCkpIGFzIEFtb3VudE91dHB1dDtcbiAgICAgICAgIGNvbnN0IGNoZ3hmZXJvdXQ6IFRyYW5zZmVyYWJsZU91dHB1dCA9IG5ldyBUcmFuc2ZlcmFibGVPdXRwdXQoYW1vdW50c1tpXS5nZXRBc3NldElEKCksIGNoYW5nZW91dCk7XG4gICAgICAgICBhYWQuYWRkQ2hhbmdlKGNoZ3hmZXJvdXQpO1xuICAgICAgIH1cbiAgICAgfVxuICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgfVxuIFxuICAgLyoqXG4gICAgICogQ3JlYXRlcyBhbiB1bnNpZ25lZCBJbXBvcnRUeCB0cmFuc2FjdGlvbi5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBuZXR3b3JrSUQgVGhlIG51bWJlciByZXByZXNlbnRpbmcgTmV0d29ya0lEIG9mIHRoZSBub2RlXG4gICAgICogQHBhcmFtIGJsb2NrY2hhaW5JRCBUaGUge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0gcmVwcmVzZW50aW5nIHRoZSBCbG9ja2NoYWluSUQgZm9yIHRoZSB0cmFuc2FjdGlvblxuICAgICAqIEBwYXJhbSB0b0FkZHJlc3NlcyBUaGUgYWRkcmVzc2VzIHRvIHNlbmQgdGhlIGZ1bmRzXG4gICAgICogQHBhcmFtIGZyb21BZGRyZXNzZXMgVGhlIGFkZHJlc3NlcyBiZWluZyB1c2VkIHRvIHNlbmQgdGhlIGZ1bmRzIGZyb20gdGhlIFVUWE9zIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9XG4gICAgICogQHBhcmFtIGltcG9ydElucyBBbiBhcnJheSBvZiBbW1RyYW5zZmVyYWJsZUlucHV0XV1zIGJlaW5nIGltcG9ydGVkXG4gICAgICogQHBhcmFtIHNvdXJjZUNoYWluIEEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0gZm9yIHRoZSBjaGFpbmlkIHdoZXJlIHRoZSBpbXBvcnRzIGFyZSBjb21pbmcgZnJvbS5cbiAgICAgKiBAcGFyYW0gZmVlIE9wdGlvbmFsLiBUaGUgYW1vdW50IG9mIGZlZXMgdG8gYnVybiBpbiBpdHMgc21hbGxlc3QgZGVub21pbmF0aW9uLCByZXByZXNlbnRlZCBhcyB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2luZHV0bnkvYm4uanMvfEJOfS4gRmVlIHdpbGwgY29tZSBmcm9tIHRoZSBpbnB1dHMgZmlyc3QsIGlmIHRoZXkgY2FuLlxuICAgICAqIEBwYXJhbSBmZWVBc3NldElEIE9wdGlvbmFsLiBUaGUgYXNzZXRJRCBvZiB0aGUgZmVlcyBiZWluZyBidXJuZWQuIFxuICAgICAqIEBwYXJhbSBtZW1vIE9wdGlvbmFsIGNvbnRhaW5zIGFyYml0cmFyeSBieXRlcywgdXAgdG8gMjU2IGJ5dGVzXG4gICAgICogQHBhcmFtIGFzT2YgT3B0aW9uYWwuIFRoZSB0aW1lc3RhbXAgdG8gdmVyaWZ5IHRoZSB0cmFuc2FjdGlvbiBhZ2FpbnN0IGFzIGEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9pbmR1dG55L2JuLmpzL3xCTn1cbiAgICAgKiBAcGFyYW0gbG9ja3RpbWUgT3B0aW9uYWwuIFRoZSBsb2NrdGltZSBmaWVsZCBjcmVhdGVkIGluIHRoZSByZXN1bHRpbmcgb3V0cHV0c1xuICAgICAqIEBwYXJhbSB0aHJlc2hvbGQgT3B0aW9uYWwuIFRoZSBudW1iZXIgb2Ygc2lnbmF0dXJlcyByZXF1aXJlZCB0byBzcGVuZCB0aGUgZnVuZHMgaW4gdGhlIHJlc3VsdGFudCBVVFhPXG4gICAgICogQHJldHVybnMgQW4gdW5zaWduZWQgdHJhbnNhY3Rpb24gY3JlYXRlZCBmcm9tIHRoZSBwYXNzZWQgaW4gcGFyYW1ldGVycy5cbiAgICAgKlxuICAgICAqL1xuICAgIGJ1aWxkSW1wb3J0VHggPSAoXG4gICAgIG5ldHdvcmtJRDogbnVtYmVyLCBcbiAgICAgYmxvY2tjaGFpbklEOiBCdWZmZXIsXG4gICAgIHRvQWRkcmVzc2VzOiBzdHJpbmdbXSxcbiAgICAgZnJvbUFkZHJlc3NlczogQnVmZmVyW10sXG4gICAgIGF0b21pY3M6IFVUWE9bXSxcbiAgICAgc291cmNlQ2hhaW46IEJ1ZmZlciA9IHVuZGVmaW5lZCwgXG4gICAgIGZlZTogQk4gPSB1bmRlZmluZWQsXG4gICAgIGZlZUFzc2V0SUQ6IEJ1ZmZlciA9IHVuZGVmaW5lZFxuICAgKTogVW5zaWduZWRUeCA9PiB7XG5cbiAgICAgY29uc3QgemVybzogQk4gPSBuZXcgQk4oMCk7XG4gICAgIGxldCBpbnM6IFRyYW5zZmVyYWJsZUlucHV0W10gPSBbXTtcbiAgICAgY29uc3Qgb3V0czogRVZNT3V0cHV0W10gPSBbXTtcblxuICAgICBpZih0eXBlb2YgZmVlID09PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICAgZmVlID0gemVyby5jbG9uZSgpO1xuICAgICB9XG4gXG4gICAgIGxldCBmZWVwYWlkOiBCTiA9IG5ldyBCTigwKTtcbiAgICAgY29uc3QgZmVlQXNzZXRTdHI6IHN0cmluZyA9IGZlZUFzc2V0SUQudG9TdHJpbmcoXCJoZXhcIik7XG4gICAgIGF0b21pY3MuZm9yRWFjaCgoYXRvbWljOiBVVFhPKSA9PiB7XG4gICAgICAgY29uc3QgYXNzZXRJRDogQnVmZmVyID0gYXRvbWljLmdldEFzc2V0SUQoKTsgXG4gICAgICAgY29uc3Qgb3V0cHV0OiBBbW91bnRPdXRwdXQgPSBhdG9taWMuZ2V0T3V0cHV0KCkgYXMgQW1vdW50T3V0cHV0O1xuICAgICAgIGNvbnN0IGFtdDogQk4gPSBvdXRwdXQuZ2V0QW1vdW50KCkuY2xvbmUoKTtcbiBcbiAgICAgICBsZXQgaW5mZWVhbW91bnQ6IEJOID0gYW10LmNsb25lKCk7XG4gICAgICAgY29uc3QgYXNzZXRTdHI6IHN0cmluZyA9IGFzc2V0SUQudG9TdHJpbmcoXCJoZXhcIik7XG4gICAgICAgaWYoXG4gICAgICAgICB0eXBlb2YgZmVlQXNzZXRJRCAhPT0gXCJ1bmRlZmluZWRcIiAmJiBcbiAgICAgICAgIGZlZS5ndCh6ZXJvKSAmJiBcbiAgICAgICAgIGZlZXBhaWQubHQoZmVlKSAmJiBcbiAgICAgICAgIGFzc2V0U3RyID09PSBmZWVBc3NldFN0clxuICAgICAgICkgXG4gICAgICAge1xuICAgICAgICAgZmVlcGFpZCA9IGZlZXBhaWQuYWRkKGluZmVlYW1vdW50KTtcbiAgICAgICAgIGlmKGZlZXBhaWQuZ3QoZmVlKSkge1xuICAgICAgICAgICBpbmZlZWFtb3VudCA9IGZlZXBhaWQuc3ViKGZlZSk7XG4gICAgICAgICAgIGZlZXBhaWQgPSBmZWUuY2xvbmUoKTtcbiAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgIGluZmVlYW1vdW50ID0gIHplcm8uY2xvbmUoKTtcbiAgICAgICAgIH1cbiAgICAgICB9XG4gXG4gICAgICAgY29uc3QgdHhpZDogQnVmZmVyID0gYXRvbWljLmdldFR4SUQoKTtcbiAgICAgICBjb25zdCBvdXRwdXRpZHg6IEJ1ZmZlciA9IGF0b21pYy5nZXRPdXRwdXRJZHgoKTtcbiAgICAgICBjb25zdCBpbnB1dDogU0VDUFRyYW5zZmVySW5wdXQgPSBuZXcgU0VDUFRyYW5zZmVySW5wdXQoYW10KTtcbiAgICAgICBjb25zdCB4ZmVyaW46IFRyYW5zZmVyYWJsZUlucHV0ID0gbmV3IFRyYW5zZmVyYWJsZUlucHV0KHR4aWQsIG91dHB1dGlkeCwgYXNzZXRJRCwgaW5wdXQpO1xuICAgICAgIGNvbnN0IGZyb206IEJ1ZmZlcltdID0gb3V0cHV0LmdldEFkZHJlc3NlcygpOyBcbiAgICAgICBjb25zdCBzcGVuZGVyczogQnVmZmVyW10gPSBvdXRwdXQuZ2V0U3BlbmRlcnMoZnJvbSk7XG4gICAgICAgc3BlbmRlcnMuZm9yRWFjaCgoc3BlbmRlcjogQnVmZmVyKSA9PiB7XG4gICAgICAgICBjb25zdCBpZHg6IG51bWJlciA9IG91dHB1dC5nZXRBZGRyZXNzSWR4KHNwZW5kZXIpO1xuICAgICAgICAgaWYgKGlkeCA9PT0gLTEpIHtcbiAgICAgICAgICAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cbiAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiRXJyb3IgLSBVVFhPU2V0LmJ1aWxkSW1wb3J0VHg6IG5vIHN1Y2ggYWRkcmVzcyBpbiBvdXRwdXRcIik7XG4gICAgICAgICB9XG4gICAgICAgICB4ZmVyaW4uZ2V0SW5wdXQoKS5hZGRTaWduYXR1cmVJZHgoaWR4LCBzcGVuZGVyKTtcbiAgICAgICB9KTtcbiAgICAgICBpbnMucHVzaCh4ZmVyaW4pO1xuXG4gICAgICAgLy8gbGV4aWNvZ3JhcGhpY2FsbHkgc29ydCBhcnJheVxuICAgICAgIGlucyA9IGlucy5zb3J0KFRyYW5zZmVyYWJsZUlucHV0LmNvbXBhcmF0b3IoKSk7XG5cbiAgICAgICAvLyBhZGQgZXh0cmEgb3V0cHV0cyBmb3IgZWFjaCBhbW91bnQgKGNhbGN1bGF0ZWQgZnJvbSB0aGUgaW1wb3J0ZWQgaW5wdXRzKSwgbWludXMgZmVlc1xuICAgICAgIGlmKGluZmVlYW1vdW50Lmd0KHplcm8pKSB7XG4gICAgICAgICBjb25zdCBldm1PdXRwdXQ6IEVWTU91dHB1dCA9IG5ldyBFVk1PdXRwdXQoXG4gICAgICAgICAgIHRvQWRkcmVzc2VzWzBdLFxuICAgICAgICAgICBhbXQsXG4gICAgICAgICAgIGFzc2V0SURcbiAgICAgICAgICk7XG4gICAgICAgICBvdXRzLnB1c2goZXZtT3V0cHV0KTtcbiAgICAgICB9XG4gICAgIH0pO1xuXG4gICAgIGNvbnN0IGltcG9ydFR4OiBJbXBvcnRUeCA9IG5ldyBJbXBvcnRUeChuZXR3b3JrSUQsIGJsb2NrY2hhaW5JRCwgc291cmNlQ2hhaW4sIGlucywgb3V0cyk7XG4gICAgIHJldHVybiBuZXcgVW5zaWduZWRUeChpbXBvcnRUeCk7XG4gICB9O1xuIFxuICAgLyoqXG4gICAqIENyZWF0ZXMgYW4gdW5zaWduZWQgRXhwb3J0VHggdHJhbnNhY3Rpb24uIFxuICAgKlxuICAgKiBAcGFyYW0gbmV0d29ya0lEIFRoZSBudW1iZXIgcmVwcmVzZW50aW5nIE5ldHdvcmtJRCBvZiB0aGUgbm9kZVxuICAgKiBAcGFyYW0gYmxvY2tjaGFpbklEIFRoZSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSByZXByZXNlbnRpbmcgdGhlIEJsb2NrY2hhaW5JRCBmb3IgdGhlIHRyYW5zYWN0aW9uXG4gICAqIEBwYXJhbSBhbW91bnQgVGhlIGFtb3VudCBiZWluZyBleHBvcnRlZCBhcyBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vaW5kdXRueS9ibi5qcy98Qk59XG4gICAqIEBwYXJhbSBhdmF4QXNzZXRJRCB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSBvZiB0aGUgQXNzZXRJRCBmb3IgQVZBWFxuICAgKiBAcGFyYW0gdG9BZGRyZXNzZXMgQW4gYXJyYXkgb2YgYWRkcmVzc2VzIGFzIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IHdobyByZWNpZXZlcyB0aGUgQVZBWFxuICAgKiBAcGFyYW0gZnJvbUFkZHJlc3NlcyBBbiBhcnJheSBvZiBhZGRyZXNzZXMgYXMge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0gd2hvIG93bnMgdGhlIEFWQVhcbiAgICogQHBhcmFtIGNoYW5nZUFkZHJlc3NlcyBPcHRpb25hbC4gVGhlIGFkZHJlc3NlcyB0aGF0IGNhbiBzcGVuZCB0aGUgY2hhbmdlIHJlbWFpbmluZyBmcm9tIHRoZSBzcGVudCBVVFhPcy5cbiAgICogQHBhcmFtIGRlc3RpbmF0aW9uQ2hhaW4gT3B0aW9uYWwuIEEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0gZm9yIHRoZSBjaGFpbmlkIHdoZXJlIHRvIHNlbmQgdGhlIGFzc2V0LlxuICAgKiBAcGFyYW0gZmVlIE9wdGlvbmFsLiBUaGUgYW1vdW50IG9mIGZlZXMgdG8gYnVybiBpbiBpdHMgc21hbGxlc3QgZGVub21pbmF0aW9uLCByZXByZXNlbnRlZCBhcyB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2luZHV0bnkvYm4uanMvfEJOfVxuICAgKiBAcGFyYW0gZmVlQXNzZXRJRCBPcHRpb25hbC4gVGhlIGFzc2V0SUQgb2YgdGhlIGZlZXMgYmVpbmcgYnVybmVkLiBcbiAgICogQHBhcmFtIGFzT2YgT3B0aW9uYWwuIFRoZSB0aW1lc3RhbXAgdG8gdmVyaWZ5IHRoZSB0cmFuc2FjdGlvbiBhZ2FpbnN0IGFzIGEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9pbmR1dG55L2JuLmpzL3xCTn1cbiAgICogQHBhcmFtIGxvY2t0aW1lIE9wdGlvbmFsLiBUaGUgbG9ja3RpbWUgZmllbGQgY3JlYXRlZCBpbiB0aGUgcmVzdWx0aW5nIG91dHB1dHNcbiAgICogQHBhcmFtIHRocmVzaG9sZCBPcHRpb25hbC4gVGhlIG51bWJlciBvZiBzaWduYXR1cmVzIHJlcXVpcmVkIHRvIHNwZW5kIHRoZSBmdW5kcyBpbiB0aGUgcmVzdWx0YW50IFVUWE9cbiAgICogQHJldHVybnMgQW4gdW5zaWduZWQgdHJhbnNhY3Rpb24gY3JlYXRlZCBmcm9tIHRoZSBwYXNzZWQgaW4gcGFyYW1ldGVycy5cbiAgICpcbiAgICovXG4gICBidWlsZEV4cG9ydFR4ID0gKFxuICAgIG5ldHdvcmtJRDogbnVtYmVyLCBcbiAgICBibG9ja2NoYWluSUQ6IEJ1ZmZlcixcbiAgICBhbW91bnQ6IEJOLFxuICAgIGF2YXhBc3NldElEOiBCdWZmZXIsXG4gICAgdG9BZGRyZXNzZXM6IEJ1ZmZlcltdLFxuICAgIGZyb21BZGRyZXNzZXM6IEJ1ZmZlcltdLFxuICAgIGNoYW5nZUFkZHJlc3NlczogQnVmZmVyW10gPSB1bmRlZmluZWQsXG4gICAgZGVzdGluYXRpb25DaGFpbjogQnVmZmVyID0gdW5kZWZpbmVkLFxuICAgIGZlZTogQk4gPSB1bmRlZmluZWQsXG4gICAgZmVlQXNzZXRJRDogQnVmZmVyID0gdW5kZWZpbmVkLCBcbiAgICBhc09mOiBCTiA9IFVuaXhOb3coKSxcbiAgICBsb2NrdGltZTogQk4gPSBuZXcgQk4oMCksIFxuICAgIHRocmVzaG9sZDogbnVtYmVyID0gMVxuICApOiBVbnNpZ25lZFR4ID0+IHtcbiAgICBsZXQgaW5zOiBFVk1JbnB1dFtdID0gW107XG4gICAgbGV0IG91dHM6IFRyYW5zZmVyYWJsZU91dHB1dFtdID0gW107XG4gICAgbGV0IGV4cG9ydG91dHM6IFRyYW5zZmVyYWJsZU91dHB1dFtdID0gW107XG4gICAgXG4gICAgaWYodHlwZW9mIGNoYW5nZUFkZHJlc3NlcyA9PT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgY2hhbmdlQWRkcmVzc2VzID0gdG9BZGRyZXNzZXM7XG4gICAgfVxuXG4gICAgY29uc3QgemVybzogQk4gPSBuZXcgQk4oMCk7XG4gICAgXG4gICAgaWYgKGFtb3VudC5lcSh6ZXJvKSkge1xuICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICB9XG5cbiAgICBpZih0eXBlb2YgZmVlQXNzZXRJRCA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgIGZlZUFzc2V0SUQgPSBhdmF4QXNzZXRJRDtcbiAgICB9IGVsc2UgaWYgKGZlZUFzc2V0SUQudG9TdHJpbmcoJ2hleCcpICE9PSBhdmF4QXNzZXRJRC50b1N0cmluZygnaGV4JykpIHtcbiAgICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0Vycm9yIC0gVVRYT1NldC5idWlsZEV4cG9ydFR4OiBmZWVBc3NldElEIG11c3QgbWF0Y2ggYXZheEFzc2V0SUQnKTtcbiAgICB9XG5cbiAgICBpZih0eXBlb2YgZGVzdGluYXRpb25DaGFpbiA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgIGRlc3RpbmF0aW9uQ2hhaW4gPSBiaW50b29scy5jYjU4RGVjb2RlKFBsYXRmb3JtQ2hhaW5JRCk7XG4gICAgfVxuXG4gICAgY29uc3QgYWFkOiBBc3NldEFtb3VudERlc3RpbmF0aW9uID0gbmV3IEFzc2V0QW1vdW50RGVzdGluYXRpb24odG9BZGRyZXNzZXMsIGZyb21BZGRyZXNzZXMsIGNoYW5nZUFkZHJlc3Nlcyk7XG4gICAgaWYoYXZheEFzc2V0SUQudG9TdHJpbmcoJ2hleCcpID09PSBmZWVBc3NldElELnRvU3RyaW5nKCdoZXgnKSl7XG4gICAgICBhYWQuYWRkQXNzZXRBbW91bnQoYXZheEFzc2V0SUQsIGFtb3VudCwgZmVlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgYWFkLmFkZEFzc2V0QW1vdW50KGF2YXhBc3NldElELCBhbW91bnQsIHplcm8pO1xuICAgICAgaWYodGhpcy5fZmVlQ2hlY2soZmVlLCBmZWVBc3NldElEKSl7XG4gICAgICAgIGFhZC5hZGRBc3NldEFtb3VudChmZWVBc3NldElELCB6ZXJvLCBmZWUpO1xuICAgICAgfVxuICAgIH1cbiAgICBjb25zdCBzdWNjZXNzOiBFcnJvciA9IHRoaXMuZ2V0TWluaW11bVNwZW5kYWJsZShhYWQsIGFzT2YsIGxvY2t0aW1lLCB0aHJlc2hvbGQpO1xuICAgIGlmKHR5cGVvZiBzdWNjZXNzID09PSAndW5kZWZpbmVkJykge1xuICAgICAgb3V0cyA9IGFhZC5nZXRDaGFuZ2VPdXRwdXRzKCk7XG4gICAgICBleHBvcnRvdXRzID0gYWFkLmdldE91dHB1dHMoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhyb3cgc3VjY2VzcztcbiAgICB9XG5cbiAgICBjb25zdCBleHBvcnRUeDogRXhwb3J0VHggPSBuZXcgRXhwb3J0VHgobmV0d29ya0lELCBibG9ja2NoYWluSUQsIGRlc3RpbmF0aW9uQ2hhaW4sIGlucywgZXhwb3J0b3V0cyk7XG4gICAgcmV0dXJuIG5ldyBVbnNpZ25lZFR4KGV4cG9ydFR4KTtcbiAgfTtcbiB9XG4gIl19