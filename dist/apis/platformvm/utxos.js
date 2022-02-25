"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UTXOSet = exports.AssetAmountDestination = exports.UTXO = void 0;
/**
 * @packageDocumentation
 * @module API-PlatformVM-UTXOs
 */
const buffer_1 = require("buffer/");
const bintools_1 = __importDefault(require("../../utils/bintools"));
const bn_js_1 = __importDefault(require("bn.js"));
const outputs_1 = require("./outputs");
const inputs_1 = require("./inputs");
const helperfunctions_1 = require("../../utils/helperfunctions");
const utxos_1 = require("../../common/utxos");
const constants_1 = require("./constants");
const tx_1 = require("./tx");
const exporttx_1 = require("../platformvm/exporttx");
const constants_2 = require("../../utils/constants");
const importtx_1 = require("../platformvm/importtx");
const basetx_1 = require("../platformvm/basetx");
const assetamount_1 = require("../../common/assetamount");
const validationtx_1 = require("./validationtx");
const createsubnettx_1 = require("./createsubnettx");
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
    create(codecID = constants_1.PlatformVMConstants.LATESTCODEC, txid = undefined, outputidx = undefined, assetid = undefined, output = undefined) {
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
        this.getConsumableUXTO = (asOf = helperfunctions_1.UnixNow(), stakeable = false) => {
            return this.getAllUTXOs().filter((utxo) => {
                if (stakeable) {
                    // stakeable transactions can consume any UTXO.
                    return true;
                }
                const output = utxo.getOutput();
                if (!(output instanceof outputs_1.StakeableLockOut)) {
                    // non-stakeable transactions can consume any UTXO that isn't locked.
                    return true;
                }
                const stakeableOutput = output;
                if (stakeableOutput.getStakeableLocktime().lt(asOf)) {
                    // If the stakeable outputs locktime has ended, then this UTXO can still
                    // be consumed by a non-stakeable transaction.
                    return true;
                }
                // This output is locked and can't be consumed by a non-stakeable
                // transaction.
                return false;
            });
        };
        this.getMinimumSpendable = (aad, asOf = helperfunctions_1.UnixNow(), locktime = new bn_js_1.default(0), threshold = 1, stakeable = false) => {
            let utxoArray = this.getConsumableUXTO(asOf, stakeable);
            let tmpUTXOArray = [];
            if (stakeable) {
                // If this is a stakeable transaction then have StakeableLockOut come before SECPTransferOutput
                // so that users first stake locked tokens before staking unlocked tokens
                utxoArray.forEach((utxo) => {
                    // StakeableLockOuts
                    if (utxo.getOutput().getTypeID() === 22) {
                        tmpUTXOArray.push(utxo);
                    }
                });
                // Sort the StakeableLockOuts by StakeableLocktime so that the greatest StakeableLocktime are spent first
                tmpUTXOArray.sort((a, b) => {
                    let stakeableLockOut1 = a.getOutput();
                    let stakeableLockOut2 = b.getOutput();
                    return stakeableLockOut2.getStakeableLocktime().toNumber() - stakeableLockOut1.getStakeableLocktime().toNumber();
                });
                utxoArray.forEach((utxo) => {
                    // SECPTransferOutputs
                    if (utxo.getOutput().getTypeID() === 7) {
                        tmpUTXOArray.push(utxo);
                    }
                });
                utxoArray = tmpUTXOArray;
            }
            // outs is a map from assetID to a tuple of (lockedStakeable, unlocked)
            // which are arrays of outputs.
            const outs = {};
            // We only need to iterate over UTXOs until we have spent sufficient funds
            // to met the requested amounts.
            utxoArray.forEach((utxo, index) => {
                const assetID = utxo.getAssetID();
                const assetKey = assetID.toString("hex");
                const fromAddresses = aad.getSenders();
                const output = utxo.getOutput();
                if (!(output instanceof outputs_1.AmountOutput) || !aad.assetExists(assetKey) || !output.meetsThreshold(fromAddresses, asOf)) {
                    // We should only try to spend fungible assets.
                    // We should only spend {{ assetKey }}.
                    // We need to be able to spend the output.
                    return;
                }
                const assetAmount = aad.getAssetAmount(assetKey);
                if (assetAmount.isFinished()) {
                    // We've already spent the needed UTXOs for this assetID.
                    return;
                }
                if (!(assetKey in outs)) {
                    // If this is the first time spending this assetID, we need to
                    // initialize the outs object correctly.
                    outs[assetKey] = {
                        lockedStakeable: [],
                        unlocked: [],
                    };
                }
                const amountOutput = output;
                // amount is the amount of funds available from this UTXO.
                const amount = amountOutput.getAmount();
                // Set up the SECP input with the same amount as the output.
                let input = new inputs_1.SECPTransferInput(amount);
                let locked = false;
                if (amountOutput instanceof outputs_1.StakeableLockOut) {
                    const stakeableOutput = amountOutput;
                    const stakeableLocktime = stakeableOutput.getStakeableLocktime();
                    if (stakeableLocktime.gt(asOf)) {
                        // Add a new input and mark it as being locked.
                        input = new inputs_1.StakeableLockIn(amount, stakeableLocktime, new inputs_1.ParseableInput(input));
                        // Mark this UTXO as having been re-locked.
                        locked = true;
                    }
                }
                assetAmount.spendAmount(amount, locked);
                if (locked) {
                    // Track the UTXO as locked.
                    outs[assetKey].lockedStakeable.push(amountOutput);
                }
                else {
                    // Track the UTXO as unlocked.
                    outs[assetKey].unlocked.push(amountOutput);
                }
                // Get the indices of the outputs that should be used to authorize the
                // spending of this input.
                // TODO: getSpenders should return an array of indices rather than an
                // array of addresses.
                const spenders = amountOutput.getSpenders(fromAddresses, asOf);
                spenders.forEach((spender) => {
                    const idx = amountOutput.getAddressIdx(spender);
                    if (idx === -1) {
                        // This should never happen, which is why the error is thrown rather
                        // than being returned. If this were to ever happen this would be an
                        // error in the internal logic rather having called this function with
                        // invalid arguments.
                        /* istanbul ignore next */
                        throw new Error('Error - UTXOSet.getMinimumSpendable: no such '
                            + `address in output: ${spender}`);
                    }
                    input.addSignatureIdx(idx, spender);
                });
                const txID = utxo.getTxID();
                const outputIdx = utxo.getOutputIdx();
                const transferInput = new inputs_1.TransferableInput(txID, outputIdx, assetID, input);
                aad.addInput(transferInput);
            });
            if (!aad.canComplete()) {
                // After running through all the UTXOs, we still weren't able to get all
                // the necessary funds, so this transaction can't be made.
                return new Error('Error - UTXOSet.getMinimumSpendable: insufficient '
                    + 'funds to create the transaction');
            }
            // TODO: We should separate the above functionality into a single function
            // that just selects the UTXOs to consume.
            const zero = new bn_js_1.default(0);
            // assetAmounts is an array of asset descriptions and how much is left to
            // spend for them.
            const assetAmounts = aad.getAmounts();
            assetAmounts.forEach((assetAmount) => {
                // change is the amount that should be returned back to the source of the
                // funds.
                const change = assetAmount.getChange();
                // isStakeableLockChange is if the change is locked or not.
                const isStakeableLockChange = assetAmount.getStakeableLockChange();
                // lockedChange is the amount of locked change that should be returned to
                // the sender
                const lockedChange = isStakeableLockChange ? change : zero.clone();
                const assetID = assetAmount.getAssetID();
                const assetKey = assetAmount.getAssetIDString();
                const lockedOutputs = outs[assetKey].lockedStakeable;
                lockedOutputs.forEach((lockedOutput, i) => {
                    const stakeableLocktime = lockedOutput.getStakeableLocktime();
                    const parseableOutput = lockedOutput.getTransferableOutput();
                    // We know that parseableOutput contains an AmountOutput because the
                    // first loop filters for fungible assets.
                    const output = parseableOutput.getOutput();
                    let outputAmountRemaining = output.getAmount();
                    // The only output that could generate change is the last output.
                    // Otherwise, any further UTXOs wouldn't have needed to be spent.
                    if (i == lockedOutputs.length - 1 && lockedChange.gt(zero)) {
                        // update outputAmountRemaining to no longer hold the change that we
                        // are returning.
                        outputAmountRemaining = outputAmountRemaining.sub(lockedChange);
                        // Create the inner output.
                        const newChangeOutput = outputs_1.SelectOutputClass(output.getOutputID(), lockedChange, output.getAddresses(), output.getLocktime(), output.getThreshold());
                        // Wrap the inner output in the StakeableLockOut wrapper.
                        let newLockedChangeOutput = outputs_1.SelectOutputClass(lockedOutput.getOutputID(), lockedChange, output.getAddresses(), output.getLocktime(), output.getThreshold(), stakeableLocktime, new outputs_1.ParseableOutput(newChangeOutput));
                        const transferOutput = new outputs_1.TransferableOutput(assetID, newLockedChangeOutput);
                        aad.addChange(transferOutput);
                    }
                    // We know that outputAmountRemaining > 0. Otherwise, we would never
                    // have consumed this UTXO, as it would be only change.
                    // Create the inner output.
                    const newOutput = outputs_1.SelectOutputClass(output.getOutputID(), outputAmountRemaining, output.getAddresses(), output.getLocktime(), output.getThreshold());
                    // Wrap the inner output in the StakeableLockOut wrapper.
                    const newLockedOutput = outputs_1.SelectOutputClass(lockedOutput.getOutputID(), outputAmountRemaining, output.getAddresses(), output.getLocktime(), output.getThreshold(), stakeableLocktime, new outputs_1.ParseableOutput(newOutput));
                    const transferOutput = new outputs_1.TransferableOutput(assetID, newLockedOutput);
                    aad.addOutput(transferOutput);
                });
                // unlockedChange is the amount of unlocked change that should be returned
                // to the sender
                const unlockedChange = isStakeableLockChange ? zero.clone() : change;
                if (unlockedChange.gt(zero)) {
                    const newChangeOutput = new outputs_1.SECPTransferOutput(unlockedChange, aad.getChangeAddresses(), zero.clone(), // make sure that we don't lock the change output.
                    1);
                    const transferOutput = new outputs_1.TransferableOutput(assetID, newChangeOutput);
                    aad.addChange(transferOutput);
                }
                // totalAmountSpent is the total amount of tokens consumed.
                const totalAmountSpent = assetAmount.getSpent();
                // stakeableLockedAmount is the total amount of locked tokens consumed.
                const stakeableLockedAmount = assetAmount.getStakeableLockSpent();
                // totalUnlockedSpent is the total amount of unlocked tokens consumed.
                const totalUnlockedSpent = totalAmountSpent.sub(stakeableLockedAmount);
                // amountBurnt is the amount of unlocked tokens that must be burn.
                const amountBurnt = assetAmount.getBurn();
                // totalUnlockedAvailable is the total amount of unlocked tokens available
                // to be produced.
                const totalUnlockedAvailable = totalUnlockedSpent.sub(amountBurnt);
                // unlockedAmount is the amount of unlocked tokens that should be sent.
                const unlockedAmount = totalUnlockedAvailable.sub(unlockedChange);
                if (unlockedAmount.gt(zero)) {
                    const newOutput = new outputs_1.SECPTransferOutput(unlockedAmount, aad.getDestinations(), locktime, threshold);
                    const transferOutput = new outputs_1.TransferableOutput(assetID, newOutput);
                    aad.addOutput(transferOutput);
                }
            });
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
            const minSpendableErr = this.getMinimumSpendable(aad, asOf, locktime, threshold);
            if (typeof minSpendableErr === "undefined") {
                ins = aad.getInputs();
                outs = aad.getAllOutputs();
            }
            else {
                throw minSpendableErr;
            }
            const baseTx = new basetx_1.BaseTx(networkid, blockchainid, outs, ins, memo);
            return new tx_1.UnsignedTx(baseTx);
        };
        /**
          * Creates an unsigned ImportTx transaction.
          *
          * @param networkid The number representing NetworkID of the node
          * @param blockchainid The {@link https://github.com/feross/buffer|Buffer} representing the BlockchainID for the transaction
          * @param toAddresses The addresses to send the funds
          * @param fromAddresses The addresses being used to send the funds from the UTXOs {@link https://github.com/feross/buffer|Buffer}
          * @param changeAddresses Optional. The addresses that can spend the change remaining from the spent UTXOs. Default: toAddresses
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
                    if (feepaid.gte(fee)) {
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
                const minSpendableErr = this.getMinimumSpendable(aad, asOf, locktime, threshold);
                if (typeof minSpendableErr === "undefined") {
                    ins = aad.getInputs();
                    outs = aad.getAllOutputs();
                }
                else {
                    throw minSpendableErr;
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
          * @param changeAddresses An array of addresses as {@link https://github.com/feross/buffer|Buffer} who gets the change leftover of the DJTX
          * @param destinationChain Optional. A {@link https://github.com/feross/buffer|Buffer} for the chainid where to send the asset.
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
        this.buildExportTx = (networkid, blockchainid, amount, djtxAssetID, // TODO: rename this to amountAssetID
        toAddresses, fromAddresses, changeAddresses = undefined, destinationChain = undefined, fee = undefined, feeAssetID = undefined, memo = undefined, asOf = helperfunctions_1.UnixNow(), locktime = new bn_js_1.default(0), threshold = 1) => {
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
                feeAssetID = djtxAssetID;
            }
            else if (feeAssetID.toString("hex") !== djtxAssetID.toString("hex")) {
                /* istanbul ignore next */
                throw new Error('Error - UTXOSet.buildExportTx: '
                    + `feeAssetID must match djtxAssetID`);
            }
            if (typeof destinationChain === "undefined") {
                destinationChain = bintools.cb58Decode(constants_2.Defaults.network[networkid].X["blockchainID"]);
            }
            const aad = new AssetAmountDestination(toAddresses, fromAddresses, changeAddresses);
            if (djtxAssetID.toString("hex") === feeAssetID.toString("hex")) {
                aad.addAssetAmount(djtxAssetID, amount, fee);
            }
            else {
                aad.addAssetAmount(djtxAssetID, amount, zero);
                if (this._feeCheck(fee, feeAssetID)) {
                    aad.addAssetAmount(feeAssetID, zero, fee);
                }
            }
            const minSpendableErr = this.getMinimumSpendable(aad, asOf, locktime, threshold);
            if (typeof minSpendableErr === "undefined") {
                ins = aad.getInputs();
                outs = aad.getChangeOutputs();
                exportouts = aad.getOutputs();
            }
            else {
                throw minSpendableErr;
            }
            const exportTx = new exporttx_1.ExportTx(networkid, blockchainid, outs, ins, memo, destinationChain, exportouts);
            return new tx_1.UnsignedTx(exportTx);
        };
        /**
        * Class representing an unsigned [[AddSubnetValidatorTx]] transaction.
        *
        * @param networkid Networkid, [[DefaultNetworkID]]
        * @param blockchainid Blockchainid, default undefined
        * @param fromAddresses An array of addresses as {@link https://github.com/feross/buffer|Buffer} who pays the fees in DJTX
        * @param changeAddresses An array of addresses as {@link https://github.com/feross/buffer|Buffer} who gets the change leftover from the fee payment
        * @param nodeID The node ID of the validator being added.
        * @param startTime The Unix time when the validator starts validating the Primary Network.
        * @param endTime The Unix time when the validator stops validating the Primary Network (and staked DJTX is returned).
        * @param weight The amount of weight for this subnet validator.
        * @param fee Optional. The amount of fees to burn in its smallest denomination, represented as {@link https://github.com/indutny/bn.js/|BN}
        * @param feeAssetID Optional. The assetID of the fees being burned.
        * @param memo Optional contains arbitrary bytes, up to 256 bytes
        * @param asOf Optional. The timestamp to verify the transaction against as a {@link https://github.com/indutny/bn.js/|BN}
        * @param locktime Optional. The locktime field created in the resulting outputs
        * @param threshold Optional. The number of signatures required to spend the funds in the resultant UTXO
        *
        * @returns An unsigned transaction created from the passed in parameters.
        */
        /* must implement later once the transaction format signing process is clearer
        buildAddSubnetValidatorTx = (
          networkid:number = DefaultNetworkID,
          blockchainid:Buffer,
          fromAddresses:Array<Buffer>,
          changeAddresses:Array<Buffer>,
          nodeID:Buffer,
          startTime:BN,
          endTime:BN,
          weight:BN,
          fee:BN = undefined,
          feeAssetID:Buffer = undefined,
          memo:Buffer = undefined,
          asOf:BN = UnixNow()
        ):UnsignedTx => {
          let ins:Array<TransferableInput> = [];
          let outs:Array<TransferableOutput> = [];
          //let stakeOuts:Array<TransferableOutput> = [];
          
          const zero:BN = new BN(0);
          const now:BN = UnixNow();
          if (startTime.lt(now) || endTime.lte(startTime)) {
            throw new Error("UTXOSet.buildAddSubnetValidatorTx -- startTime must be in the future and endTime must come after startTime");
          }
         
          // Not implemented: Fees can be paid from importIns
          if(this._feeCheck(fee, feeAssetID)) {
            const aad:AssetAmountDestination = new AssetAmountDestination(fromAddresses, fromAddresses, changeAddresses);
            aad.addAssetAmount(feeAssetID, zero, fee);
            const success:Error = this.getMinimumSpendable(aad, asOf);
            if(typeof success === "undefined") {
              ins = aad.getInputs();
              outs = aad.getAllOutputs();
            } else {
              throw success;
            }
          }
         
          const UTx:AddSubnetValidatorTx = new AddSubnetValidatorTx(networkid, blockchainid, outs, ins, memo, nodeID, startTime, endTime, weight);
          return new UnsignedTx(UTx);
        }
        */
        /**
        * Class representing an unsigned [[AddDelegatorTx]] transaction.
        *
        * @param networkid Networkid, [[DefaultNetworkID]]
        * @param blockchainid Blockchainid, default undefined
        * @param djtxAssetID {@link https://github.com/feross/buffer|Buffer} of the asset ID for DJTX
        * @param toAddresses An array of addresses as {@link https://github.com/feross/buffer|Buffer} recieves the stake at the end of the staking period
        * @param fromAddresses An array of addresses as {@link https://github.com/feross/buffer|Buffer} who pays the fees and the stake
        * @param changeAddresses An array of addresses as {@link https://github.com/feross/buffer|Buffer} who gets the change leftover from the staking payment
        * @param nodeID The node ID of the validator being added.
        * @param startTime The Unix time when the validator starts validating the Primary Network.
        * @param endTime The Unix time when the validator stops validating the Primary Network (and staked DJTX is returned).
        * @param stakeAmount A {@link https://github.com/indutny/bn.js/|BN} for the amount of stake to be delegated in nDJTX.
        * @param rewardLocktime The locktime field created in the resulting reward outputs
        * @param rewardThreshold The number of signatures required to spend the funds in the resultant reward UTXO
        * @param rewardAddresses The addresses the validator reward goes.
        * @param fee Optional. The amount of fees to burn in its smallest denomination, represented as {@link https://github.com/indutny/bn.js/|BN}
        * @param feeAssetID Optional. The assetID of the fees being burned.
        * @param memo Optional contains arbitrary bytes, up to 256 bytes
        * @param asOf Optional. The timestamp to verify the transaction against as a {@link https://github.com/indutny/bn.js/|BN}
        *
        * @returns An unsigned transaction created from the passed in parameters.
        */
        this.buildAddDelegatorTx = (networkid = constants_2.DefaultNetworkID, blockchainid, djtxAssetID, toAddresses, fromAddresses, changeAddresses, nodeID, startTime, endTime, stakeAmount, rewardLocktime, rewardThreshold, rewardAddresses, fee = undefined, feeAssetID = undefined, memo = undefined, asOf = helperfunctions_1.UnixNow()) => {
            let ins = [];
            let outs = [];
            let stakeOuts = [];
            const zero = new bn_js_1.default(0);
            const now = helperfunctions_1.UnixNow();
            if (startTime.lt(now) || endTime.lte(startTime)) {
                throw new Error("UTXOSet.buildAddDelegatorTx -- startTime must be in the future and endTime must come after startTime");
            }
            const aad = new AssetAmountDestination(toAddresses, fromAddresses, changeAddresses);
            if (djtxAssetID.toString("hex") === feeAssetID.toString("hex")) {
                aad.addAssetAmount(djtxAssetID, stakeAmount, fee);
            }
            else {
                aad.addAssetAmount(djtxAssetID, stakeAmount, zero);
                if (this._feeCheck(fee, feeAssetID)) {
                    aad.addAssetAmount(feeAssetID, zero, fee);
                }
            }
            const minSpendableErr = this.getMinimumSpendable(aad, asOf, undefined, undefined, true);
            if (typeof minSpendableErr === "undefined") {
                ins = aad.getInputs();
                outs = aad.getChangeOutputs();
                stakeOuts = aad.getOutputs();
            }
            else {
                throw minSpendableErr;
            }
            const rewardOutputOwners = new outputs_1.SECPOwnerOutput(rewardAddresses, rewardLocktime, rewardThreshold);
            const UTx = new validationtx_1.AddDelegatorTx(networkid, blockchainid, outs, ins, memo, nodeID, startTime, endTime, stakeAmount, stakeOuts, new outputs_1.ParseableOutput(rewardOutputOwners));
            return new tx_1.UnsignedTx(UTx);
        };
        /**
          * Class representing an unsigned [[AddValidatorTx]] transaction.
          *
          * @param networkid Networkid, [[DefaultNetworkID]]
          * @param blockchainid Blockchainid, default undefined
          * @param djtxAssetID {@link https://github.com/feross/buffer|Buffer} of the asset ID for DJTX
          * @param toAddresses An array of addresses as {@link https://github.com/feross/buffer|Buffer} recieves the stake at the end of the staking period
          * @param fromAddresses An array of addresses as {@link https://github.com/feross/buffer|Buffer} who pays the fees and the stake
          * @param changeAddresses An array of addresses as {@link https://github.com/feross/buffer|Buffer} who gets the change leftover from the staking payment
          * @param nodeID The node ID of the validator being added.
          * @param startTime The Unix time when the validator starts validating the Primary Network.
          * @param endTime The Unix time when the validator stops validating the Primary Network (and staked DJTX is returned).
          * @param stakeAmount A {@link https://github.com/indutny/bn.js/|BN} for the amount of stake to be delegated in nDJTX.
          * @param rewardLocktime The locktime field created in the resulting reward outputs
          * @param rewardThreshold The number of signatures required to spend the funds in the resultant reward UTXO
          * @param rewardAddresses The addresses the validator reward goes.
          * @param delegationFee A number for the percentage of reward to be given to the validator when someone delegates to them. Must be between 0 and 100.
          * @param minStake A {@link https://github.com/indutny/bn.js/|BN} representing the minimum stake required to validate on this network.
          * @param fee Optional. The amount of fees to burn in its smallest denomination, represented as {@link https://github.com/indutny/bn.js/|BN}
          * @param feeAssetID Optional. The assetID of the fees being burned.
          * @param memo Optional contains arbitrary bytes, up to 256 bytes
          * @param asOf Optional. The timestamp to verify the transaction against as a {@link https://github.com/indutny/bn.js/|BN}
          *
          * @returns An unsigned transaction created from the passed in parameters.
          */
        this.buildAddValidatorTx = (networkid = constants_2.DefaultNetworkID, blockchainid, djtxAssetID, toAddresses, fromAddresses, changeAddresses, nodeID, startTime, endTime, stakeAmount, rewardLocktime, rewardThreshold, rewardAddresses, delegationFee, fee = undefined, feeAssetID = undefined, memo = undefined, asOf = helperfunctions_1.UnixNow()) => {
            let ins = [];
            let outs = [];
            let stakeOuts = [];
            const zero = new bn_js_1.default(0);
            const now = helperfunctions_1.UnixNow();
            if (startTime.lt(now) || endTime.lte(startTime)) {
                throw new Error("UTXOSet.buildAddValidatorTx -- startTime must be in the future and endTime must come after startTime");
            }
            if (delegationFee > 100 || delegationFee < 0) {
                throw new Error("UTXOSet.buildAddValidatorTx -- startTime must be in the range of 0 to 100, inclusively");
            }
            const aad = new AssetAmountDestination(toAddresses, fromAddresses, changeAddresses);
            if (djtxAssetID.toString("hex") === feeAssetID.toString("hex")) {
                aad.addAssetAmount(djtxAssetID, stakeAmount, fee);
            }
            else {
                aad.addAssetAmount(djtxAssetID, stakeAmount, zero);
                if (this._feeCheck(fee, feeAssetID)) {
                    aad.addAssetAmount(feeAssetID, zero, fee);
                }
            }
            const minSpendableErr = this.getMinimumSpendable(aad, asOf, undefined, undefined, true);
            if (typeof minSpendableErr === "undefined") {
                ins = aad.getInputs();
                outs = aad.getChangeOutputs();
                stakeOuts = aad.getOutputs();
            }
            else {
                throw minSpendableErr;
            }
            const rewardOutputOwners = new outputs_1.SECPOwnerOutput(rewardAddresses, rewardLocktime, rewardThreshold);
            const UTx = new validationtx_1.AddValidatorTx(networkid, blockchainid, outs, ins, memo, nodeID, startTime, endTime, stakeAmount, stakeOuts, new outputs_1.ParseableOutput(rewardOutputOwners), delegationFee);
            return new tx_1.UnsignedTx(UTx);
        };
        /**
          * Class representing an unsigned [[CreateSubnetTx]] transaction.
          *
          * @param networkid Networkid, [[DefaultNetworkID]]
          * @param blockchainid Blockchainid, default undefined
          * @param fromAddresses The addresses being used to send the funds from the UTXOs {@link https://github.com/feross/buffer|Buffer}
          * @param changeAddresses The addresses that can spend the change remaining from the spent UTXOs.
          * @param subnetOwnerAddresses An array of {@link https://github.com/feross/buffer|Buffer} for the addresses to add to a subnet
          * @param subnetOwnerThreshold The number of owners's signatures required to add a validator to the network
          * @param fee Optional. The amount of fees to burn in its smallest denomination, represented as {@link https://github.com/indutny/bn.js/|BN}
          * @param feeAssetID Optional. The assetID of the fees being burned
          * @param memo Optional contains arbitrary bytes, up to 256 bytes
          * @param asOf Optional. The timestamp to verify the transaction against as a {@link https://github.com/indutny/bn.js/|BN}
          *
          * @returns An unsigned transaction created from the passed in parameters.
          */
        this.buildCreateSubnetTx = (networkid = constants_2.DefaultNetworkID, blockchainid, fromAddresses, changeAddresses, subnetOwnerAddresses, subnetOwnerThreshold, fee = undefined, feeAssetID = undefined, memo = undefined, asOf = helperfunctions_1.UnixNow()) => {
            const zero = new bn_js_1.default(0);
            let ins = [];
            let outs = [];
            if (this._feeCheck(fee, feeAssetID)) {
                const aad = new AssetAmountDestination(fromAddresses, fromAddresses, changeAddresses);
                aad.addAssetAmount(feeAssetID, zero, fee);
                const minSpendableErr = this.getMinimumSpendable(aad, asOf, undefined, undefined);
                if (typeof minSpendableErr === "undefined") {
                    ins = aad.getInputs();
                    outs = aad.getAllOutputs();
                }
                else {
                    throw minSpendableErr;
                }
            }
            const locktime = new bn_js_1.default(0);
            const UTx = new createsubnettx_1.CreateSubnetTx(networkid, blockchainid, outs, ins, memo, new outputs_1.SECPOwnerOutput(subnetOwnerAddresses, locktime, subnetOwnerThreshold));
            return new tx_1.UnsignedTx(UTx);
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
        else if (utxo instanceof utxos_1.StandardUTXO) {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXR4b3MuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9zcmMvYXBpcy9wbGF0Zm9ybXZtL3V0eG9zLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBOzs7R0FHRztBQUNILG9DQUFpQztBQUNqQyxvRUFBNEM7QUFDNUMsa0RBQXVCO0FBQ3ZCLHVDQUF3SjtBQUN4SixxQ0FBOEc7QUFDOUcsaUVBQXNEO0FBQ3RELDhDQUFtRTtBQUNuRSwyQ0FBa0Q7QUFDbEQsNkJBQWtDO0FBQ2xDLHFEQUFrRDtBQUNsRCxxREFBbUU7QUFDbkUscURBQWtEO0FBQ2xELGlEQUE4QztBQUM5QywwREFBdUY7QUFFdkYsaURBQWdFO0FBQ2hFLHFEQUFrRDtBQUNsRCw2REFBOEU7QUFFOUU7O0dBRUc7QUFDSCxNQUFNLFFBQVEsR0FBRyxrQkFBUSxDQUFDLFdBQVcsRUFBRSxDQUFDO0FBQ3hDLE1BQU0sVUFBVSxHQUFHLDZCQUFhLENBQUMsV0FBVyxFQUFFLENBQUM7QUFFL0M7O0dBRUc7QUFDSCxNQUFhLElBQUssU0FBUSxvQkFBWTtJQUF0Qzs7UUFDWSxjQUFTLEdBQUcsTUFBTSxDQUFDO1FBQ25CLFlBQU8sR0FBRyxTQUFTLENBQUM7SUFrRWhDLENBQUM7SUFoRUMsd0JBQXdCO0lBRXhCLFdBQVcsQ0FBQyxNQUFjLEVBQUUsV0FBK0IsS0FBSztRQUM5RCxLQUFLLENBQUMsV0FBVyxDQUFDLE1BQU0sRUFBRSxRQUFRLENBQUMsQ0FBQztRQUNwQyxJQUFJLENBQUMsTUFBTSxHQUFHLDJCQUFpQixDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDO1FBQzdELElBQUksQ0FBQyxNQUFNLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsRUFBRSxRQUFRLENBQUMsQ0FBQztJQUN0RCxDQUFDO0lBRUQsVUFBVSxDQUFDLEtBQWEsRUFBRSxTQUFpQixDQUFDO1FBQzFDLElBQUksQ0FBQyxP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QUM7Q0E0MEJGO0FBdDRCRCwwQkFzNEJDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAcGFja2FnZURvY3VtZW50YXRpb25cbiAqIEBtb2R1bGUgQVBJLVBsYXRmb3JtVk0tVVRYT3NcbiAqL1xuaW1wb3J0IHsgQnVmZmVyIH0gZnJvbSAnYnVmZmVyLyc7XG5pbXBvcnQgQmluVG9vbHMgZnJvbSAnLi4vLi4vdXRpbHMvYmludG9vbHMnO1xuaW1wb3J0IEJOIGZyb20gXCJibi5qc1wiO1xuaW1wb3J0IHsgQW1vdW50T3V0cHV0LCBTZWxlY3RPdXRwdXRDbGFzcywgVHJhbnNmZXJhYmxlT3V0cHV0LCBTRUNQT3duZXJPdXRwdXQsIFBhcnNlYWJsZU91dHB1dCwgU3Rha2VhYmxlTG9ja091dCwgU0VDUFRyYW5zZmVyT3V0cHV0IH0gZnJvbSAnLi9vdXRwdXRzJztcbmltcG9ydCB7IEFtb3VudElucHV0LCBTRUNQVHJhbnNmZXJJbnB1dCwgU3Rha2VhYmxlTG9ja0luLCBUcmFuc2ZlcmFibGVJbnB1dCwgUGFyc2VhYmxlSW5wdXQgfSBmcm9tICcuL2lucHV0cyc7XG5pbXBvcnQgeyBVbml4Tm93IH0gZnJvbSAnLi4vLi4vdXRpbHMvaGVscGVyZnVuY3Rpb25zJztcbmltcG9ydCB7IFN0YW5kYXJkVVRYTywgU3RhbmRhcmRVVFhPU2V0IH0gZnJvbSAnLi4vLi4vY29tbW9uL3V0eG9zJztcbmltcG9ydCB7IFBsYXRmb3JtVk1Db25zdGFudHMgfSBmcm9tICcuL2NvbnN0YW50cyc7XG5pbXBvcnQgeyBVbnNpZ25lZFR4IH0gZnJvbSAnLi90eCc7XG5pbXBvcnQgeyBFeHBvcnRUeCB9IGZyb20gJy4uL3BsYXRmb3Jtdm0vZXhwb3J0dHgnO1xuaW1wb3J0IHsgRGVmYXVsdE5ldHdvcmtJRCwgRGVmYXVsdHMgfSBmcm9tICcuLi8uLi91dGlscy9jb25zdGFudHMnO1xuaW1wb3J0IHsgSW1wb3J0VHggfSBmcm9tICcuLi9wbGF0Zm9ybXZtL2ltcG9ydHR4JztcbmltcG9ydCB7IEJhc2VUeCB9IGZyb20gJy4uL3BsYXRmb3Jtdm0vYmFzZXR4JztcbmltcG9ydCB7IFN0YW5kYXJkQXNzZXRBbW91bnREZXN0aW5hdGlvbiwgQXNzZXRBbW91bnQgfSBmcm9tICcuLi8uLi9jb21tb24vYXNzZXRhbW91bnQnO1xuaW1wb3J0IHsgT3V0cHV0IH0gZnJvbSAnLi4vLi4vY29tbW9uL291dHB1dCc7XG5pbXBvcnQgeyBBZGREZWxlZ2F0b3JUeCwgQWRkVmFsaWRhdG9yVHggfSBmcm9tICcuL3ZhbGlkYXRpb250eCc7XG5pbXBvcnQgeyBDcmVhdGVTdWJuZXRUeCB9IGZyb20gJy4vY3JlYXRlc3VibmV0dHgnO1xuaW1wb3J0IHsgU2VyaWFsaXphdGlvbiwgU2VyaWFsaXplZEVuY29kaW5nIH0gZnJvbSAnLi4vLi4vdXRpbHMvc2VyaWFsaXphdGlvbic7XG5cbi8qKlxuICogQGlnbm9yZVxuICovXG5jb25zdCBiaW50b29scyA9IEJpblRvb2xzLmdldEluc3RhbmNlKCk7XG5jb25zdCBzZXJpYWxpemVyID0gU2VyaWFsaXphdGlvbi5nZXRJbnN0YW5jZSgpO1xuXG4vKipcbiAqIENsYXNzIGZvciByZXByZXNlbnRpbmcgYSBzaW5nbGUgVVRYTy5cbiAqL1xuZXhwb3J0IGNsYXNzIFVUWE8gZXh0ZW5kcyBTdGFuZGFyZFVUWE8ge1xuICBwcm90ZWN0ZWQgX3R5cGVOYW1lID0gXCJVVFhPXCI7XG4gIHByb3RlY3RlZCBfdHlwZUlEID0gdW5kZWZpbmVkO1xuXG4gIC8vc2VyaWFsaXplIGlzIGluaGVyaXRlZFxuXG4gIGRlc2VyaWFsaXplKGZpZWxkczogb2JqZWN0LCBlbmNvZGluZzogU2VyaWFsaXplZEVuY29kaW5nID0gXCJoZXhcIikge1xuICAgIHN1cGVyLmRlc2VyaWFsaXplKGZpZWxkcywgZW5jb2RpbmcpO1xuICAgIHRoaXMub3V0cHV0ID0gU2VsZWN0T3V0cHV0Q2xhc3MoZmllbGRzW1wib3V0cHV0XCJdW1wiX3R5cGVJRFwiXSk7XG4gICAgdGhpcy5vdXRwdXQuZGVzZXJpYWxpemUoZmllbGRzW1wib3V0cHV0XCJdLCBlbmNvZGluZyk7XG4gIH1cblxuICBmcm9tQnVmZmVyKGJ5dGVzOiBCdWZmZXIsIG9mZnNldDogbnVtYmVyID0gMCk6IG51bWJlciB7XG4gICAgdGhpcy5jb2RlY2lkID0gYmludG9vbHMuY29weUZyb20oYnl0ZXMsIG9mZnNldCwgb2Zmc2V0ICsgMik7XG4gICAgb2Zmc2V0ICs9IDI7XG4gICAgdGhpcy50eGlkID0gYmludG9vbHMuY29weUZyb20oYnl0ZXMsIG9mZnNldCwgb2Zmc2V0ICsgMzIpO1xuICAgIG9mZnNldCArPSAzMjtcbiAgICB0aGlzLm91dHB1dGlkeCA9IGJpbnRvb2xzLmNvcHlGcm9tKGJ5dGVzLCBvZmZzZXQsIG9mZnNldCArIDQpO1xuICAgIG9mZnNldCArPSA0O1xuICAgIHRoaXMuYXNzZXRpZCA9IGJpbnRvb2xzLmNvcHlGcm9tKGJ5dGVzLCBvZmZzZXQsIG9mZnNldCArIDMyKTtcbiAgICBvZmZzZXQgKz0gMzI7XG4gICAgY29uc3Qgb3V0cHV0aWQ6IG51bWJlciA9IGJpbnRvb2xzLmNvcHlGcm9tKGJ5dGVzLCBvZmZzZXQsIG9mZnNldCArIDQpLnJlYWRVSW50MzJCRSgwKTtcbiAgICBvZmZzZXQgKz0gNDtcbiAgICB0aGlzLm91dHB1dCA9IFNlbGVjdE91dHB1dENsYXNzKG91dHB1dGlkKTtcbiAgICByZXR1cm4gdGhpcy5vdXRwdXQuZnJvbUJ1ZmZlcihieXRlcywgb2Zmc2V0KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBUYWtlcyBhIGJhc2UtNTggc3RyaW5nIGNvbnRhaW5pbmcgYSBbW1VUWE9dXSwgcGFyc2VzIGl0LCBwb3B1bGF0ZXMgdGhlIGNsYXNzLCBhbmQgcmV0dXJucyB0aGUgbGVuZ3RoIG9mIHRoZSBTdGFuZGFyZFVUWE8gaW4gYnl0ZXMuXG4gICAqXG4gICAqIEBwYXJhbSBzZXJpYWxpemVkIEEgYmFzZS01OCBzdHJpbmcgY29udGFpbmluZyBhIHJhdyBbW1VUWE9dXVxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgbGVuZ3RoIG9mIHRoZSByYXcgW1tVVFhPXV1cbiAgICpcbiAgICogQHJlbWFya3NcbiAgICogdW5saWtlIG1vc3QgZnJvbVN0cmluZ3MsIGl0IGV4cGVjdHMgdGhlIHN0cmluZyB0byBiZSBzZXJpYWxpemVkIGluIGNiNTggZm9ybWF0XG4gICAqL1xuICBmcm9tU3RyaW5nKHNlcmlhbGl6ZWQ6IHN0cmluZyk6IG51bWJlciB7XG4gICAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cbiAgICByZXR1cm4gdGhpcy5mcm9tQnVmZmVyKGJpbnRvb2xzLmNiNThEZWNvZGUoc2VyaWFsaXplZCkpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgYSBiYXNlLTU4IHJlcHJlc2VudGF0aW9uIG9mIHRoZSBbW1VUWE9dXS5cbiAgICpcbiAgICogQHJlbWFya3NcbiAgICogdW5saWtlIG1vc3QgdG9TdHJpbmdzLCB0aGlzIHJldHVybnMgaW4gY2I1OCBzZXJpYWxpemF0aW9uIGZvcm1hdFxuICAgKi9cbiAgdG9TdHJpbmcoKTogc3RyaW5nIHtcbiAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xuICAgIHJldHVybiBiaW50b29scy5jYjU4RW5jb2RlKHRoaXMudG9CdWZmZXIoKSk7XG4gIH1cblxuICBjbG9uZSgpOiB0aGlzIHtcbiAgICBjb25zdCB1dHhvOiBVVFhPID0gbmV3IFVUWE8oKTtcbiAgICB1dHhvLmZyb21CdWZmZXIodGhpcy50b0J1ZmZlcigpKTtcbiAgICByZXR1cm4gdXR4byBhcyB0aGlzO1xuICB9XG5cbiAgY3JlYXRlKFxuICAgIGNvZGVjSUQ6IG51bWJlciA9IFBsYXRmb3JtVk1Db25zdGFudHMuTEFURVNUQ09ERUMsXG4gICAgdHhpZDogQnVmZmVyID0gdW5kZWZpbmVkLFxuICAgIG91dHB1dGlkeDogQnVmZmVyIHwgbnVtYmVyID0gdW5kZWZpbmVkLFxuICAgIGFzc2V0aWQ6IEJ1ZmZlciA9IHVuZGVmaW5lZCxcbiAgICBvdXRwdXQ6IE91dHB1dCA9IHVuZGVmaW5lZCk6IHRoaXMge1xuICAgIHJldHVybiBuZXcgVVRYTyhjb2RlY0lELCB0eGlkLCBvdXRwdXRpZHgsIGFzc2V0aWQsIG91dHB1dCkgYXMgdGhpcztcbiAgfVxuXG59XG5cbmV4cG9ydCBjbGFzcyBBc3NldEFtb3VudERlc3RpbmF0aW9uIGV4dGVuZHMgU3RhbmRhcmRBc3NldEFtb3VudERlc3RpbmF0aW9uPFRyYW5zZmVyYWJsZU91dHB1dCwgVHJhbnNmZXJhYmxlSW5wdXQ+IHsgfVxuXG4vKipcbiAqIENsYXNzIHJlcHJlc2VudGluZyBhIHNldCBvZiBbW1VUWE9dXXMuXG4gKi9cbmV4cG9ydCBjbGFzcyBVVFhPU2V0IGV4dGVuZHMgU3RhbmRhcmRVVFhPU2V0PFVUWE8+e1xuICBwcm90ZWN0ZWQgX3R5cGVOYW1lID0gXCJVVFhPU2V0XCI7XG4gIHByb3RlY3RlZCBfdHlwZUlEID0gdW5kZWZpbmVkO1xuXG4gIC8vc2VyaWFsaXplIGlzIGluaGVyaXRlZFxuXG4gIGRlc2VyaWFsaXplKGZpZWxkczogb2JqZWN0LCBlbmNvZGluZzogU2VyaWFsaXplZEVuY29kaW5nID0gXCJoZXhcIikge1xuICAgIHN1cGVyLmRlc2VyaWFsaXplKGZpZWxkcywgZW5jb2RpbmcpO1xuICAgIGxldCB1dHhvcyA9IHt9O1xuICAgIGZvciAobGV0IHV0eG9pZCBpbiBmaWVsZHNbXCJ1dHhvc1wiXSkge1xuICAgICAgbGV0IHV0eG9pZENsZWFuZWQ6IHN0cmluZyA9IHNlcmlhbGl6ZXIuZGVjb2Rlcih1dHhvaWQsIGVuY29kaW5nLCBcImJhc2U1OFwiLCBcImJhc2U1OFwiKTtcbiAgICAgIHV0eG9zW3V0eG9pZENsZWFuZWRdID0gbmV3IFVUWE8oKTtcbiAgICAgIHV0eG9zW3V0eG9pZENsZWFuZWRdLmRlc2VyaWFsaXplKGZpZWxkc1tcInV0eG9zXCJdW3V0eG9pZF0sIGVuY29kaW5nKTtcbiAgICB9XG4gICAgbGV0IGFkZHJlc3NVVFhPcyA9IHt9O1xuICAgIGZvciAobGV0IGFkZHJlc3MgaW4gZmllbGRzW1wiYWRkcmVzc1VUWE9zXCJdKSB7XG4gICAgICBsZXQgYWRkcmVzc0NsZWFuZWQ6IHN0cmluZyA9IHNlcmlhbGl6ZXIuZGVjb2RlcihhZGRyZXNzLCBlbmNvZGluZywgXCJjYjU4XCIsIFwiaGV4XCIpO1xuICAgICAgbGV0IHV0eG9iYWxhbmNlID0ge307XG4gICAgICBmb3IgKGxldCB1dHhvaWQgaW4gZmllbGRzW1wiYWRkcmVzc1VUWE9zXCJdW2FkZHJlc3NdKSB7XG4gICAgICAgIGxldCB1dHhvaWRDbGVhbmVkOiBzdHJpbmcgPSBzZXJpYWxpemVyLmRlY29kZXIodXR4b2lkLCBlbmNvZGluZywgXCJiYXNlNThcIiwgXCJiYXNlNThcIik7XG4gICAgICAgIHV0eG9iYWxhbmNlW3V0eG9pZENsZWFuZWRdID0gc2VyaWFsaXplci5kZWNvZGVyKGZpZWxkc1tcImFkZHJlc3NVVFhPc1wiXVthZGRyZXNzXVt1dHhvaWRdLCBlbmNvZGluZywgXCJkZWNpbWFsU3RyaW5nXCIsIFwiQk5cIik7XG4gICAgICB9XG4gICAgICBhZGRyZXNzVVRYT3NbYWRkcmVzc0NsZWFuZWRdID0gdXR4b2JhbGFuY2U7XG4gICAgfVxuICAgIHRoaXMudXR4b3MgPSB1dHhvcztcbiAgICB0aGlzLmFkZHJlc3NVVFhPcyA9IGFkZHJlc3NVVFhPcztcbiAgfVxuXG4gIHBhcnNlVVRYTyh1dHhvOiBVVFhPIHwgc3RyaW5nKTogVVRYTyB7XG4gICAgY29uc3QgdXR4b3ZhcjogVVRYTyA9IG5ldyBVVFhPKCk7XG4gICAgLy8gZm9yY2UgYSBjb3B5XG4gICAgaWYgKHR5cGVvZiB1dHhvID09PSAnc3RyaW5nJykge1xuICAgICAgdXR4b3Zhci5mcm9tQnVmZmVyKGJpbnRvb2xzLmNiNThEZWNvZGUodXR4bykpO1xuICAgIH0gZWxzZSBpZiAodXR4byBpbnN0YW5jZW9mIFN0YW5kYXJkVVRYTykge1xuICAgICAgdXR4b3Zhci5mcm9tQnVmZmVyKHV0eG8udG9CdWZmZXIoKSk7IC8vIGZvcmNlcyBhIGNvcHlcbiAgICB9IGVsc2Uge1xuICAgICAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cbiAgICAgIHRocm93IG5ldyBFcnJvcihcIkVycm9yIC0gVVRYTy5wYXJzZVVUWE86IHV0eG8gcGFyYW1ldGVyIGlzIG5vdCBhIFVUWE8gb3Igc3RyaW5nXCIpO1xuICAgIH1cbiAgICByZXR1cm4gdXR4b3ZhclxuICB9XG5cbiAgY3JlYXRlKC4uLmFyZ3M6IGFueVtdKTogdGhpcyB7XG4gICAgcmV0dXJuIG5ldyBVVFhPU2V0KCkgYXMgdGhpcztcbiAgfVxuXG4gIGNsb25lKCk6IHRoaXMge1xuICAgIGNvbnN0IG5ld3NldDogVVRYT1NldCA9IHRoaXMuY3JlYXRlKCk7XG4gICAgY29uc3QgYWxsVVRYT3M6IEFycmF5PFVUWE8+ID0gdGhpcy5nZXRBbGxVVFhPcygpO1xuICAgIG5ld3NldC5hZGRBcnJheShhbGxVVFhPcylcbiAgICByZXR1cm4gbmV3c2V0IGFzIHRoaXM7XG4gIH1cblxuICBfZmVlQ2hlY2soZmVlOiBCTiwgZmVlQXNzZXRJRDogQnVmZmVyKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuICh0eXBlb2YgZmVlICE9PSBcInVuZGVmaW5lZFwiICYmXG4gICAgICB0eXBlb2YgZmVlQXNzZXRJRCAhPT0gXCJ1bmRlZmluZWRcIiAmJlxuICAgICAgZmVlLmd0KG5ldyBCTigwKSkgJiYgZmVlQXNzZXRJRCBpbnN0YW5jZW9mIEJ1ZmZlclxuICAgICk7XG4gIH1cblxuICBnZXRDb25zdW1hYmxlVVhUTyA9IChhc09mOiBCTiA9IFVuaXhOb3coKSwgc3Rha2VhYmxlOiBib29sZWFuID0gZmFsc2UpOiBVVFhPW10gPT4ge1xuICAgIHJldHVybiB0aGlzLmdldEFsbFVUWE9zKCkuZmlsdGVyKCh1dHhvOiBVVFhPKSA9PiB7XG4gICAgICBpZiAoc3Rha2VhYmxlKSB7XG4gICAgICAgIC8vIHN0YWtlYWJsZSB0cmFuc2FjdGlvbnMgY2FuIGNvbnN1bWUgYW55IFVUWE8uXG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfVxuICAgICAgY29uc3Qgb3V0cHV0OiBPdXRwdXQgPSB1dHhvLmdldE91dHB1dCgpO1xuICAgICAgaWYgKCEob3V0cHV0IGluc3RhbmNlb2YgU3Rha2VhYmxlTG9ja091dCkpIHtcbiAgICAgICAgLy8gbm9uLXN0YWtlYWJsZSB0cmFuc2FjdGlvbnMgY2FuIGNvbnN1bWUgYW55IFVUWE8gdGhhdCBpc24ndCBsb2NrZWQuXG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfVxuICAgICAgY29uc3Qgc3Rha2VhYmxlT3V0cHV0OiBTdGFrZWFibGVMb2NrT3V0ID0gb3V0cHV0IGFzIFN0YWtlYWJsZUxvY2tPdXQ7XG4gICAgICBpZiAoc3Rha2VhYmxlT3V0cHV0LmdldFN0YWtlYWJsZUxvY2t0aW1lKCkubHQoYXNPZikpIHtcbiAgICAgICAgLy8gSWYgdGhlIHN0YWtlYWJsZSBvdXRwdXRzIGxvY2t0aW1lIGhhcyBlbmRlZCwgdGhlbiB0aGlzIFVUWE8gY2FuIHN0aWxsXG4gICAgICAgIC8vIGJlIGNvbnN1bWVkIGJ5IGEgbm9uLXN0YWtlYWJsZSB0cmFuc2FjdGlvbi5cbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9XG4gICAgICAvLyBUaGlzIG91dHB1dCBpcyBsb2NrZWQgYW5kIGNhbid0IGJlIGNvbnN1bWVkIGJ5IGEgbm9uLXN0YWtlYWJsZVxuICAgICAgLy8gdHJhbnNhY3Rpb24uXG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfSk7XG4gIH1cblxuICBnZXRNaW5pbXVtU3BlbmRhYmxlID0gKFxuICAgIGFhZDogQXNzZXRBbW91bnREZXN0aW5hdGlvbixcbiAgICBhc09mOiBCTiA9IFVuaXhOb3coKSxcbiAgICBsb2NrdGltZTogQk4gPSBuZXcgQk4oMCksXG4gICAgdGhyZXNob2xkOiBudW1iZXIgPSAxLFxuICAgIHN0YWtlYWJsZTogYm9vbGVhbiA9IGZhbHNlLFxuICApOiBFcnJvciA9PiB7XG4gICAgbGV0IHV0eG9BcnJheTogVVRYT1tdID0gdGhpcy5nZXRDb25zdW1hYmxlVVhUTyhhc09mLCBzdGFrZWFibGUpO1xuICAgIGxldCB0bXBVVFhPQXJyYXk6IFVUWE9bXSA9IFtdO1xuICAgIGlmKHN0YWtlYWJsZSkge1xuICAgICAgLy8gSWYgdGhpcyBpcyBhIHN0YWtlYWJsZSB0cmFuc2FjdGlvbiB0aGVuIGhhdmUgU3Rha2VhYmxlTG9ja091dCBjb21lIGJlZm9yZSBTRUNQVHJhbnNmZXJPdXRwdXRcbiAgICAgIC8vIHNvIHRoYXQgdXNlcnMgZmlyc3Qgc3Rha2UgbG9ja2VkIHRva2VucyBiZWZvcmUgc3Rha2luZyB1bmxvY2tlZCB0b2tlbnNcbiAgICAgIHV0eG9BcnJheS5mb3JFYWNoKCh1dHhvOiBVVFhPKSA9PiB7XG4gICAgICAgIC8vIFN0YWtlYWJsZUxvY2tPdXRzXG4gICAgICAgIGlmKHV0eG8uZ2V0T3V0cHV0KCkuZ2V0VHlwZUlEKCkgPT09IDIyKSB7XG4gICAgICAgICAgdG1wVVRYT0FycmF5LnB1c2godXR4byk7XG4gICAgICAgIH1cbiAgICAgIH0pXG5cbiAgICAgIC8vIFNvcnQgdGhlIFN0YWtlYWJsZUxvY2tPdXRzIGJ5IFN0YWtlYWJsZUxvY2t0aW1lIHNvIHRoYXQgdGhlIGdyZWF0ZXN0IFN0YWtlYWJsZUxvY2t0aW1lIGFyZSBzcGVudCBmaXJzdFxuICAgICAgdG1wVVRYT0FycmF5LnNvcnQoKGE6IFVUWE8sIGI6IFVUWE8pID0+IHtcbiAgICAgICAgbGV0IHN0YWtlYWJsZUxvY2tPdXQxID0gYS5nZXRPdXRwdXQoKSBhcyBTdGFrZWFibGVMb2NrT3V0O1xuICAgICAgICBsZXQgc3Rha2VhYmxlTG9ja091dDIgPSBiLmdldE91dHB1dCgpIGFzIFN0YWtlYWJsZUxvY2tPdXQ7XG4gICAgICAgIHJldHVybiBzdGFrZWFibGVMb2NrT3V0Mi5nZXRTdGFrZWFibGVMb2NrdGltZSgpLnRvTnVtYmVyKCkgLSBzdGFrZWFibGVMb2NrT3V0MS5nZXRTdGFrZWFibGVMb2NrdGltZSgpLnRvTnVtYmVyKClcbiAgICAgIH0pXG5cbiAgICAgIHV0eG9BcnJheS5mb3JFYWNoKCh1dHhvOiBVVFhPKSA9PiB7XG4gICAgICAgIC8vIFNFQ1BUcmFuc2Zlck91dHB1dHNcbiAgICAgICAgaWYodXR4by5nZXRPdXRwdXQoKS5nZXRUeXBlSUQoKSA9PT0gNykge1xuICAgICAgICAgIHRtcFVUWE9BcnJheS5wdXNoKHV0eG8pO1xuICAgICAgICB9XG4gICAgICB9KVxuICAgICAgdXR4b0FycmF5ID0gdG1wVVRYT0FycmF5O1xuICAgIH1cblxuICAgIC8vIG91dHMgaXMgYSBtYXAgZnJvbSBhc3NldElEIHRvIGEgdHVwbGUgb2YgKGxvY2tlZFN0YWtlYWJsZSwgdW5sb2NrZWQpXG4gICAgLy8gd2hpY2ggYXJlIGFycmF5cyBvZiBvdXRwdXRzLlxuICAgIGNvbnN0IG91dHM6IG9iamVjdCA9IHt9O1xuXG4gICAgLy8gV2Ugb25seSBuZWVkIHRvIGl0ZXJhdGUgb3ZlciBVVFhPcyB1bnRpbCB3ZSBoYXZlIHNwZW50IHN1ZmZpY2llbnQgZnVuZHNcbiAgICAvLyB0byBtZXQgdGhlIHJlcXVlc3RlZCBhbW91bnRzLlxuICAgIHV0eG9BcnJheS5mb3JFYWNoKCh1dHhvOiBVVFhPLCBpbmRleDogbnVtYmVyKSA9PiB7XG4gICAgICBjb25zdCBhc3NldElEOiBCdWZmZXIgPSB1dHhvLmdldEFzc2V0SUQoKTtcbiAgICAgIGNvbnN0IGFzc2V0S2V5OiBzdHJpbmcgPSBhc3NldElELnRvU3RyaW5nKFwiaGV4XCIpO1xuICAgICAgY29uc3QgZnJvbUFkZHJlc3NlczogQnVmZmVyW10gPSBhYWQuZ2V0U2VuZGVycygpO1xuICAgICAgY29uc3Qgb3V0cHV0OiBPdXRwdXQgPSB1dHhvLmdldE91dHB1dCgpO1xuICAgICAgaWYgKCEob3V0cHV0IGluc3RhbmNlb2YgQW1vdW50T3V0cHV0KSB8fCAhYWFkLmFzc2V0RXhpc3RzKGFzc2V0S2V5KSB8fCAhb3V0cHV0Lm1lZXRzVGhyZXNob2xkKGZyb21BZGRyZXNzZXMsIGFzT2YpKSB7XG4gICAgICAgIC8vIFdlIHNob3VsZCBvbmx5IHRyeSB0byBzcGVuZCBmdW5naWJsZSBhc3NldHMuXG4gICAgICAgIC8vIFdlIHNob3VsZCBvbmx5IHNwZW5kIHt7IGFzc2V0S2V5IH19LlxuICAgICAgICAvLyBXZSBuZWVkIHRvIGJlIGFibGUgdG8gc3BlbmQgdGhlIG91dHB1dC5cbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBjb25zdCBhc3NldEFtb3VudDogQXNzZXRBbW91bnQgPSBhYWQuZ2V0QXNzZXRBbW91bnQoYXNzZXRLZXkpO1xuICAgICAgaWYgKGFzc2V0QW1vdW50LmlzRmluaXNoZWQoKSkge1xuICAgICAgICAvLyBXZSd2ZSBhbHJlYWR5IHNwZW50IHRoZSBuZWVkZWQgVVRYT3MgZm9yIHRoaXMgYXNzZXRJRC5cbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBpZiAoIShhc3NldEtleSBpbiBvdXRzKSkge1xuICAgICAgICAvLyBJZiB0aGlzIGlzIHRoZSBmaXJzdCB0aW1lIHNwZW5kaW5nIHRoaXMgYXNzZXRJRCwgd2UgbmVlZCB0b1xuICAgICAgICAvLyBpbml0aWFsaXplIHRoZSBvdXRzIG9iamVjdCBjb3JyZWN0bHkuXG4gICAgICAgIG91dHNbYXNzZXRLZXldID0ge1xuICAgICAgICAgIGxvY2tlZFN0YWtlYWJsZTogW10sXG4gICAgICAgICAgdW5sb2NrZWQ6IFtdLFxuICAgICAgICB9O1xuICAgICAgfVxuXG4gICAgICBjb25zdCBhbW91bnRPdXRwdXQ6IEFtb3VudE91dHB1dCA9IG91dHB1dCBhcyBBbW91bnRPdXRwdXQ7XG4gICAgICAvLyBhbW91bnQgaXMgdGhlIGFtb3VudCBvZiBmdW5kcyBhdmFpbGFibGUgZnJvbSB0aGlzIFVUWE8uXG4gICAgICBjb25zdCBhbW91bnQgPSBhbW91bnRPdXRwdXQuZ2V0QW1vdW50KCk7XG5cbiAgICAgIC8vIFNldCB1cCB0aGUgU0VDUCBpbnB1dCB3aXRoIHRoZSBzYW1lIGFtb3VudCBhcyB0aGUgb3V0cHV0LlxuICAgICAgbGV0IGlucHV0OiBBbW91bnRJbnB1dCA9IG5ldyBTRUNQVHJhbnNmZXJJbnB1dChhbW91bnQpO1xuXG4gICAgICBsZXQgbG9ja2VkOiBib29sZWFuID0gZmFsc2U7XG4gICAgICBpZiAoYW1vdW50T3V0cHV0IGluc3RhbmNlb2YgU3Rha2VhYmxlTG9ja091dCkge1xuICAgICAgICBjb25zdCBzdGFrZWFibGVPdXRwdXQ6IFN0YWtlYWJsZUxvY2tPdXQgPSBhbW91bnRPdXRwdXQgYXMgU3Rha2VhYmxlTG9ja091dDtcbiAgICAgICAgY29uc3Qgc3Rha2VhYmxlTG9ja3RpbWU6IEJOID0gc3Rha2VhYmxlT3V0cHV0LmdldFN0YWtlYWJsZUxvY2t0aW1lKCk7XG5cbiAgICAgICAgaWYgKHN0YWtlYWJsZUxvY2t0aW1lLmd0KGFzT2YpKSB7XG4gICAgICAgICAgLy8gQWRkIGEgbmV3IGlucHV0IGFuZCBtYXJrIGl0IGFzIGJlaW5nIGxvY2tlZC5cbiAgICAgICAgICBpbnB1dCA9IG5ldyBTdGFrZWFibGVMb2NrSW4oXG4gICAgICAgICAgICBhbW91bnQsXG4gICAgICAgICAgICBzdGFrZWFibGVMb2NrdGltZSxcbiAgICAgICAgICAgIG5ldyBQYXJzZWFibGVJbnB1dChpbnB1dCksXG4gICAgICAgICAgKTtcblxuICAgICAgICAgIC8vIE1hcmsgdGhpcyBVVFhPIGFzIGhhdmluZyBiZWVuIHJlLWxvY2tlZC5cbiAgICAgICAgICBsb2NrZWQgPSB0cnVlO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGFzc2V0QW1vdW50LnNwZW5kQW1vdW50KGFtb3VudCwgbG9ja2VkKTtcbiAgICAgIGlmIChsb2NrZWQpIHtcbiAgICAgICAgLy8gVHJhY2sgdGhlIFVUWE8gYXMgbG9ja2VkLlxuICAgICAgICBvdXRzW2Fzc2V0S2V5XS5sb2NrZWRTdGFrZWFibGUucHVzaChhbW91bnRPdXRwdXQpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gVHJhY2sgdGhlIFVUWE8gYXMgdW5sb2NrZWQuXG4gICAgICAgIG91dHNbYXNzZXRLZXldLnVubG9ja2VkLnB1c2goYW1vdW50T3V0cHV0KTtcbiAgICAgIH1cblxuICAgICAgLy8gR2V0IHRoZSBpbmRpY2VzIG9mIHRoZSBvdXRwdXRzIHRoYXQgc2hvdWxkIGJlIHVzZWQgdG8gYXV0aG9yaXplIHRoZVxuICAgICAgLy8gc3BlbmRpbmcgb2YgdGhpcyBpbnB1dC5cblxuICAgICAgLy8gVE9ETzogZ2V0U3BlbmRlcnMgc2hvdWxkIHJldHVybiBhbiBhcnJheSBvZiBpbmRpY2VzIHJhdGhlciB0aGFuIGFuXG4gICAgICAvLyBhcnJheSBvZiBhZGRyZXNzZXMuXG4gICAgICBjb25zdCBzcGVuZGVyczogQXJyYXk8QnVmZmVyPiA9IGFtb3VudE91dHB1dC5nZXRTcGVuZGVycyhmcm9tQWRkcmVzc2VzLCBhc09mKTtcbiAgICAgIHNwZW5kZXJzLmZvckVhY2goKHNwZW5kZXI6IEJ1ZmZlcikgPT4ge1xuICAgICAgICBjb25zdCBpZHg6IG51bWJlciA9IGFtb3VudE91dHB1dC5nZXRBZGRyZXNzSWR4KHNwZW5kZXIpO1xuICAgICAgICBpZiAoaWR4ID09PSAtMSkge1xuICAgICAgICAgIC8vIFRoaXMgc2hvdWxkIG5ldmVyIGhhcHBlbiwgd2hpY2ggaXMgd2h5IHRoZSBlcnJvciBpcyB0aHJvd24gcmF0aGVyXG4gICAgICAgICAgLy8gdGhhbiBiZWluZyByZXR1cm5lZC4gSWYgdGhpcyB3ZXJlIHRvIGV2ZXIgaGFwcGVuIHRoaXMgd291bGQgYmUgYW5cbiAgICAgICAgICAvLyBlcnJvciBpbiB0aGUgaW50ZXJuYWwgbG9naWMgcmF0aGVyIGhhdmluZyBjYWxsZWQgdGhpcyBmdW5jdGlvbiB3aXRoXG4gICAgICAgICAgLy8gaW52YWxpZCBhcmd1bWVudHMuXG5cbiAgICAgICAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvcignRXJyb3IgLSBVVFhPU2V0LmdldE1pbmltdW1TcGVuZGFibGU6IG5vIHN1Y2ggJ1xuICAgICAgICAgICAgKyBgYWRkcmVzcyBpbiBvdXRwdXQ6ICR7c3BlbmRlcn1gKTtcbiAgICAgICAgfVxuICAgICAgICBpbnB1dC5hZGRTaWduYXR1cmVJZHgoaWR4LCBzcGVuZGVyKTtcbiAgICAgIH0pXG5cbiAgICAgIGNvbnN0IHR4SUQ6IEJ1ZmZlciA9IHV0eG8uZ2V0VHhJRCgpO1xuICAgICAgY29uc3Qgb3V0cHV0SWR4OiBCdWZmZXIgPSB1dHhvLmdldE91dHB1dElkeCgpO1xuICAgICAgY29uc3QgdHJhbnNmZXJJbnB1dDogVHJhbnNmZXJhYmxlSW5wdXQgPSBuZXcgVHJhbnNmZXJhYmxlSW5wdXQoXG4gICAgICAgIHR4SUQsXG4gICAgICAgIG91dHB1dElkeCxcbiAgICAgICAgYXNzZXRJRCxcbiAgICAgICAgaW5wdXQsXG4gICAgICApO1xuICAgICAgYWFkLmFkZElucHV0KHRyYW5zZmVySW5wdXQpO1xuICAgIH0pO1xuXG4gICAgaWYgKCFhYWQuY2FuQ29tcGxldGUoKSkge1xuICAgICAgLy8gQWZ0ZXIgcnVubmluZyB0aHJvdWdoIGFsbCB0aGUgVVRYT3MsIHdlIHN0aWxsIHdlcmVuJ3QgYWJsZSB0byBnZXQgYWxsXG4gICAgICAvLyB0aGUgbmVjZXNzYXJ5IGZ1bmRzLCBzbyB0aGlzIHRyYW5zYWN0aW9uIGNhbid0IGJlIG1hZGUuXG4gICAgICByZXR1cm4gbmV3IEVycm9yKCdFcnJvciAtIFVUWE9TZXQuZ2V0TWluaW11bVNwZW5kYWJsZTogaW5zdWZmaWNpZW50ICdcbiAgICAgICAgKyAnZnVuZHMgdG8gY3JlYXRlIHRoZSB0cmFuc2FjdGlvbicpO1xuICAgIH1cblxuICAgIC8vIFRPRE86IFdlIHNob3VsZCBzZXBhcmF0ZSB0aGUgYWJvdmUgZnVuY3Rpb25hbGl0eSBpbnRvIGEgc2luZ2xlIGZ1bmN0aW9uXG4gICAgLy8gdGhhdCBqdXN0IHNlbGVjdHMgdGhlIFVUWE9zIHRvIGNvbnN1bWUuXG5cbiAgICBjb25zdCB6ZXJvOiBCTiA9IG5ldyBCTigwKTtcblxuICAgIC8vIGFzc2V0QW1vdW50cyBpcyBhbiBhcnJheSBvZiBhc3NldCBkZXNjcmlwdGlvbnMgYW5kIGhvdyBtdWNoIGlzIGxlZnQgdG9cbiAgICAvLyBzcGVuZCBmb3IgdGhlbS5cbiAgICBjb25zdCBhc3NldEFtb3VudHM6IEFycmF5PEFzc2V0QW1vdW50PiA9IGFhZC5nZXRBbW91bnRzKCk7XG4gICAgYXNzZXRBbW91bnRzLmZvckVhY2goKGFzc2V0QW1vdW50OiBBc3NldEFtb3VudCkgPT4ge1xuICAgICAgLy8gY2hhbmdlIGlzIHRoZSBhbW91bnQgdGhhdCBzaG91bGQgYmUgcmV0dXJuZWQgYmFjayB0byB0aGUgc291cmNlIG9mIHRoZVxuICAgICAgLy8gZnVuZHMuXG4gICAgICBjb25zdCBjaGFuZ2U6IEJOID0gYXNzZXRBbW91bnQuZ2V0Q2hhbmdlKCk7XG4gICAgICAvLyBpc1N0YWtlYWJsZUxvY2tDaGFuZ2UgaXMgaWYgdGhlIGNoYW5nZSBpcyBsb2NrZWQgb3Igbm90LlxuICAgICAgY29uc3QgaXNTdGFrZWFibGVMb2NrQ2hhbmdlOiBib29sZWFuID0gYXNzZXRBbW91bnQuZ2V0U3Rha2VhYmxlTG9ja0NoYW5nZSgpO1xuICAgICAgLy8gbG9ja2VkQ2hhbmdlIGlzIHRoZSBhbW91bnQgb2YgbG9ja2VkIGNoYW5nZSB0aGF0IHNob3VsZCBiZSByZXR1cm5lZCB0b1xuICAgICAgLy8gdGhlIHNlbmRlclxuICAgICAgY29uc3QgbG9ja2VkQ2hhbmdlOiBCTiA9IGlzU3Rha2VhYmxlTG9ja0NoYW5nZSA/IGNoYW5nZSA6IHplcm8uY2xvbmUoKTtcblxuICAgICAgY29uc3QgYXNzZXRJRDogQnVmZmVyID0gYXNzZXRBbW91bnQuZ2V0QXNzZXRJRCgpO1xuICAgICAgY29uc3QgYXNzZXRLZXk6IHN0cmluZyA9IGFzc2V0QW1vdW50LmdldEFzc2V0SURTdHJpbmcoKTtcbiAgICAgIGNvbnN0IGxvY2tlZE91dHB1dHM6IEFycmF5PFN0YWtlYWJsZUxvY2tPdXQ+ID0gb3V0c1thc3NldEtleV0ubG9ja2VkU3Rha2VhYmxlO1xuICAgICAgbG9ja2VkT3V0cHV0cy5mb3JFYWNoKChsb2NrZWRPdXRwdXQ6IFN0YWtlYWJsZUxvY2tPdXQsIGk6IG51bWJlcikgPT4ge1xuICAgICAgICBjb25zdCBzdGFrZWFibGVMb2NrdGltZTogQk4gPSBsb2NrZWRPdXRwdXQuZ2V0U3Rha2VhYmxlTG9ja3RpbWUoKTtcbiAgICAgICAgY29uc3QgcGFyc2VhYmxlT3V0cHV0OiBQYXJzZWFibGVPdXRwdXQgPSBsb2NrZWRPdXRwdXQuZ2V0VHJhbnNmZXJhYmxlT3V0cHV0KCk7XG5cbiAgICAgICAgLy8gV2Uga25vdyB0aGF0IHBhcnNlYWJsZU91dHB1dCBjb250YWlucyBhbiBBbW91bnRPdXRwdXQgYmVjYXVzZSB0aGVcbiAgICAgICAgLy8gZmlyc3QgbG9vcCBmaWx0ZXJzIGZvciBmdW5naWJsZSBhc3NldHMuXG4gICAgICAgIGNvbnN0IG91dHB1dDogQW1vdW50T3V0cHV0ID0gcGFyc2VhYmxlT3V0cHV0LmdldE91dHB1dCgpIGFzIEFtb3VudE91dHB1dDtcblxuICAgICAgICBsZXQgb3V0cHV0QW1vdW50UmVtYWluaW5nOiBCTiA9IG91dHB1dC5nZXRBbW91bnQoKTtcbiAgICAgICAgLy8gVGhlIG9ubHkgb3V0cHV0IHRoYXQgY291bGQgZ2VuZXJhdGUgY2hhbmdlIGlzIHRoZSBsYXN0IG91dHB1dC5cbiAgICAgICAgLy8gT3RoZXJ3aXNlLCBhbnkgZnVydGhlciBVVFhPcyB3b3VsZG4ndCBoYXZlIG5lZWRlZCB0byBiZSBzcGVudC5cbiAgICAgICAgaWYgKGkgPT0gbG9ja2VkT3V0cHV0cy5sZW5ndGggLSAxICYmIGxvY2tlZENoYW5nZS5ndCh6ZXJvKSkge1xuICAgICAgICAgIC8vIHVwZGF0ZSBvdXRwdXRBbW91bnRSZW1haW5pbmcgdG8gbm8gbG9uZ2VyIGhvbGQgdGhlIGNoYW5nZSB0aGF0IHdlXG4gICAgICAgICAgLy8gYXJlIHJldHVybmluZy5cbiAgICAgICAgICBvdXRwdXRBbW91bnRSZW1haW5pbmcgPSBvdXRwdXRBbW91bnRSZW1haW5pbmcuc3ViKGxvY2tlZENoYW5nZSk7XG4gICAgICAgICAgLy8gQ3JlYXRlIHRoZSBpbm5lciBvdXRwdXQuXG4gICAgICAgICAgY29uc3QgbmV3Q2hhbmdlT3V0cHV0OiBBbW91bnRPdXRwdXQgPSBTZWxlY3RPdXRwdXRDbGFzcyhcbiAgICAgICAgICAgIG91dHB1dC5nZXRPdXRwdXRJRCgpLFxuICAgICAgICAgICAgbG9ja2VkQ2hhbmdlLFxuICAgICAgICAgICAgb3V0cHV0LmdldEFkZHJlc3NlcygpLFxuICAgICAgICAgICAgb3V0cHV0LmdldExvY2t0aW1lKCksXG4gICAgICAgICAgICBvdXRwdXQuZ2V0VGhyZXNob2xkKCksXG4gICAgICAgICAgKSBhcyBBbW91bnRPdXRwdXQ7XG4gICAgICAgICAgLy8gV3JhcCB0aGUgaW5uZXIgb3V0cHV0IGluIHRoZSBTdGFrZWFibGVMb2NrT3V0IHdyYXBwZXIuXG4gICAgICAgICAgbGV0IG5ld0xvY2tlZENoYW5nZU91dHB1dDogU3Rha2VhYmxlTG9ja091dCA9IFNlbGVjdE91dHB1dENsYXNzKFxuICAgICAgICAgICAgbG9ja2VkT3V0cHV0LmdldE91dHB1dElEKCksXG4gICAgICAgICAgICBsb2NrZWRDaGFuZ2UsXG4gICAgICAgICAgICBvdXRwdXQuZ2V0QWRkcmVzc2VzKCksXG4gICAgICAgICAgICBvdXRwdXQuZ2V0TG9ja3RpbWUoKSxcbiAgICAgICAgICAgIG91dHB1dC5nZXRUaHJlc2hvbGQoKSxcbiAgICAgICAgICAgIHN0YWtlYWJsZUxvY2t0aW1lLFxuICAgICAgICAgICAgbmV3IFBhcnNlYWJsZU91dHB1dChuZXdDaGFuZ2VPdXRwdXQpLFxuICAgICAgICAgICkgYXMgU3Rha2VhYmxlTG9ja091dDtcbiAgICAgICAgICBjb25zdCB0cmFuc2Zlck91dHB1dDogVHJhbnNmZXJhYmxlT3V0cHV0ID0gbmV3IFRyYW5zZmVyYWJsZU91dHB1dChhc3NldElELCBuZXdMb2NrZWRDaGFuZ2VPdXRwdXQpO1xuICAgICAgICAgIGFhZC5hZGRDaGFuZ2UodHJhbnNmZXJPdXRwdXQpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gV2Uga25vdyB0aGF0IG91dHB1dEFtb3VudFJlbWFpbmluZyA+IDAuIE90aGVyd2lzZSwgd2Ugd291bGQgbmV2ZXJcbiAgICAgICAgLy8gaGF2ZSBjb25zdW1lZCB0aGlzIFVUWE8sIGFzIGl0IHdvdWxkIGJlIG9ubHkgY2hhbmdlLlxuXG4gICAgICAgIC8vIENyZWF0ZSB0aGUgaW5uZXIgb3V0cHV0LlxuICAgICAgICBjb25zdCBuZXdPdXRwdXQ6IEFtb3VudE91dHB1dCA9IFNlbGVjdE91dHB1dENsYXNzKFxuICAgICAgICAgIG91dHB1dC5nZXRPdXRwdXRJRCgpLFxuICAgICAgICAgIG91dHB1dEFtb3VudFJlbWFpbmluZyxcbiAgICAgICAgICBvdXRwdXQuZ2V0QWRkcmVzc2VzKCksXG4gICAgICAgICAgb3V0cHV0LmdldExvY2t0aW1lKCksXG4gICAgICAgICAgb3V0cHV0LmdldFRocmVzaG9sZCgpLFxuICAgICAgICApIGFzIEFtb3VudE91dHB1dDtcbiAgICAgICAgLy8gV3JhcCB0aGUgaW5uZXIgb3V0cHV0IGluIHRoZSBTdGFrZWFibGVMb2NrT3V0IHdyYXBwZXIuXG4gICAgICAgIGNvbnN0IG5ld0xvY2tlZE91dHB1dDogU3Rha2VhYmxlTG9ja091dCA9IFNlbGVjdE91dHB1dENsYXNzKFxuICAgICAgICAgIGxvY2tlZE91dHB1dC5nZXRPdXRwdXRJRCgpLFxuICAgICAgICAgIG91dHB1dEFtb3VudFJlbWFpbmluZyxcbiAgICAgICAgICBvdXRwdXQuZ2V0QWRkcmVzc2VzKCksXG4gICAgICAgICAgb3V0cHV0LmdldExvY2t0aW1lKCksXG4gICAgICAgICAgb3V0cHV0LmdldFRocmVzaG9sZCgpLFxuICAgICAgICAgIHN0YWtlYWJsZUxvY2t0aW1lLFxuICAgICAgICAgIG5ldyBQYXJzZWFibGVPdXRwdXQobmV3T3V0cHV0KSxcbiAgICAgICAgKSBhcyBTdGFrZWFibGVMb2NrT3V0O1xuICAgICAgICBjb25zdCB0cmFuc2Zlck91dHB1dDogVHJhbnNmZXJhYmxlT3V0cHV0ID0gbmV3IFRyYW5zZmVyYWJsZU91dHB1dChhc3NldElELCBuZXdMb2NrZWRPdXRwdXQpO1xuICAgICAgICBhYWQuYWRkT3V0cHV0KHRyYW5zZmVyT3V0cHV0KTtcbiAgICAgIH0pO1xuXG4gICAgICAvLyB1bmxvY2tlZENoYW5nZSBpcyB0aGUgYW1vdW50IG9mIHVubG9ja2VkIGNoYW5nZSB0aGF0IHNob3VsZCBiZSByZXR1cm5lZFxuICAgICAgLy8gdG8gdGhlIHNlbmRlclxuICAgICAgY29uc3QgdW5sb2NrZWRDaGFuZ2U6IEJOID0gaXNTdGFrZWFibGVMb2NrQ2hhbmdlID8gemVyby5jbG9uZSgpIDogY2hhbmdlO1xuICAgICAgaWYgKHVubG9ja2VkQ2hhbmdlLmd0KHplcm8pKSB7XG4gICAgICAgIGNvbnN0IG5ld0NoYW5nZU91dHB1dDogQW1vdW50T3V0cHV0ID0gbmV3IFNFQ1BUcmFuc2Zlck91dHB1dChcbiAgICAgICAgICB1bmxvY2tlZENoYW5nZSxcbiAgICAgICAgICBhYWQuZ2V0Q2hhbmdlQWRkcmVzc2VzKCksXG4gICAgICAgICAgemVyby5jbG9uZSgpLCAvLyBtYWtlIHN1cmUgdGhhdCB3ZSBkb24ndCBsb2NrIHRoZSBjaGFuZ2Ugb3V0cHV0LlxuICAgICAgICAgIDEsIC8vIG9ubHkgcmVxdWlyZSBvbmUgb2YgdGhlIGNoYW5nZXMgYWRkcmVzc2VzIHRvIHNwZW5kIHRoaXMgb3V0cHV0LlxuICAgICAgICApIGFzIEFtb3VudE91dHB1dDtcbiAgICAgICAgY29uc3QgdHJhbnNmZXJPdXRwdXQ6IFRyYW5zZmVyYWJsZU91dHB1dCA9IG5ldyBUcmFuc2ZlcmFibGVPdXRwdXQoYXNzZXRJRCwgbmV3Q2hhbmdlT3V0cHV0KTtcbiAgICAgICAgYWFkLmFkZENoYW5nZSh0cmFuc2Zlck91dHB1dCk7XG4gICAgICB9XG5cbiAgICAgIC8vIHRvdGFsQW1vdW50U3BlbnQgaXMgdGhlIHRvdGFsIGFtb3VudCBvZiB0b2tlbnMgY29uc3VtZWQuXG4gICAgICBjb25zdCB0b3RhbEFtb3VudFNwZW50OiBCTiA9IGFzc2V0QW1vdW50LmdldFNwZW50KCk7XG4gICAgICAvLyBzdGFrZWFibGVMb2NrZWRBbW91bnQgaXMgdGhlIHRvdGFsIGFtb3VudCBvZiBsb2NrZWQgdG9rZW5zIGNvbnN1bWVkLlxuICAgICAgY29uc3Qgc3Rha2VhYmxlTG9ja2VkQW1vdW50OiBCTiA9IGFzc2V0QW1vdW50LmdldFN0YWtlYWJsZUxvY2tTcGVudCgpO1xuICAgICAgLy8gdG90YWxVbmxvY2tlZFNwZW50IGlzIHRoZSB0b3RhbCBhbW91bnQgb2YgdW5sb2NrZWQgdG9rZW5zIGNvbnN1bWVkLlxuICAgICAgY29uc3QgdG90YWxVbmxvY2tlZFNwZW50OiBCTiA9IHRvdGFsQW1vdW50U3BlbnQuc3ViKHN0YWtlYWJsZUxvY2tlZEFtb3VudCk7XG4gICAgICAvLyBhbW91bnRCdXJudCBpcyB0aGUgYW1vdW50IG9mIHVubG9ja2VkIHRva2VucyB0aGF0IG11c3QgYmUgYnVybi5cbiAgICAgIGNvbnN0IGFtb3VudEJ1cm50OiBCTiA9IGFzc2V0QW1vdW50LmdldEJ1cm4oKTtcbiAgICAgIC8vIHRvdGFsVW5sb2NrZWRBdmFpbGFibGUgaXMgdGhlIHRvdGFsIGFtb3VudCBvZiB1bmxvY2tlZCB0b2tlbnMgYXZhaWxhYmxlXG4gICAgICAvLyB0byBiZSBwcm9kdWNlZC5cbiAgICAgIGNvbnN0IHRvdGFsVW5sb2NrZWRBdmFpbGFibGU6IEJOID0gdG90YWxVbmxvY2tlZFNwZW50LnN1YihhbW91bnRCdXJudCk7XG4gICAgICAvLyB1bmxvY2tlZEFtb3VudCBpcyB0aGUgYW1vdW50IG9mIHVubG9ja2VkIHRva2VucyB0aGF0IHNob3VsZCBiZSBzZW50LlxuICAgICAgY29uc3QgdW5sb2NrZWRBbW91bnQ6IEJOID0gdG90YWxVbmxvY2tlZEF2YWlsYWJsZS5zdWIodW5sb2NrZWRDaGFuZ2UpO1xuICAgICAgaWYgKHVubG9ja2VkQW1vdW50Lmd0KHplcm8pKSB7XG4gICAgICAgIGNvbnN0IG5ld091dHB1dDogQW1vdW50T3V0cHV0ID0gbmV3IFNFQ1BUcmFuc2Zlck91dHB1dChcbiAgICAgICAgICB1bmxvY2tlZEFtb3VudCxcbiAgICAgICAgICBhYWQuZ2V0RGVzdGluYXRpb25zKCksXG4gICAgICAgICAgbG9ja3RpbWUsXG4gICAgICAgICAgdGhyZXNob2xkLFxuICAgICAgICApIGFzIEFtb3VudE91dHB1dDtcbiAgICAgICAgY29uc3QgdHJhbnNmZXJPdXRwdXQ6IFRyYW5zZmVyYWJsZU91dHB1dCA9IG5ldyBUcmFuc2ZlcmFibGVPdXRwdXQoYXNzZXRJRCwgbmV3T3V0cHV0KTtcbiAgICAgICAgYWFkLmFkZE91dHB1dCh0cmFuc2Zlck91dHB1dCk7XG4gICAgICB9XG4gICAgfSlcbiAgICByZXR1cm4gdW5kZWZpbmVkO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYW4gW1tVbnNpZ25lZFR4XV0gd3JhcHBpbmcgYSBbW0Jhc2VUeF1dLiBGb3IgbW9yZSBncmFudWxhciBjb250cm9sLCB5b3UgbWF5IGNyZWF0ZSB5b3VyIG93blxuICAgKiBbW1Vuc2lnbmVkVHhdXSB3cmFwcGluZyBhIFtbQmFzZVR4XV0gbWFudWFsbHkgKHdpdGggdGhlaXIgY29ycmVzcG9uZGluZyBbW1RyYW5zZmVyYWJsZUlucHV0XV1zIGFuZCBbW1RyYW5zZmVyYWJsZU91dHB1dF1dcykuXG4gICAqXG4gICAqIEBwYXJhbSBuZXR3b3JraWQgVGhlIG51bWJlciByZXByZXNlbnRpbmcgTmV0d29ya0lEIG9mIHRoZSBub2RlXG4gICAqIEBwYXJhbSBibG9ja2NoYWluaWQgVGhlIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IHJlcHJlc2VudGluZyB0aGUgQmxvY2tjaGFpbklEIGZvciB0aGUgdHJhbnNhY3Rpb25cbiAgICogQHBhcmFtIGFtb3VudCBUaGUgYW1vdW50IG9mIHRoZSBhc3NldCB0byBiZSBzcGVudCBpbiBpdHMgc21hbGxlc3QgZGVub21pbmF0aW9uLCByZXByZXNlbnRlZCBhcyB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2luZHV0bnkvYm4uanMvfEJOfS5cbiAgICogQHBhcmFtIGFzc2V0SUQge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0gb2YgdGhlIGFzc2V0IElEIGZvciB0aGUgVVRYT1xuICAgKiBAcGFyYW0gdG9BZGRyZXNzZXMgVGhlIGFkZHJlc3NlcyB0byBzZW5kIHRoZSBmdW5kc1xuICAgKiBAcGFyYW0gZnJvbUFkZHJlc3NlcyBUaGUgYWRkcmVzc2VzIGJlaW5nIHVzZWQgdG8gc2VuZCB0aGUgZnVuZHMgZnJvbSB0aGUgVVRYT3Mge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn1cbiAgICogQHBhcmFtIGNoYW5nZUFkZHJlc3NlcyBPcHRpb25hbC4gVGhlIGFkZHJlc3NlcyB0aGF0IGNhbiBzcGVuZCB0aGUgY2hhbmdlIHJlbWFpbmluZyBmcm9tIHRoZSBzcGVudCBVVFhPcy4gRGVmYXVsdDogdG9BZGRyZXNzZXNcbiAgICogQHBhcmFtIGZlZSBPcHRpb25hbC4gVGhlIGFtb3VudCBvZiBmZWVzIHRvIGJ1cm4gaW4gaXRzIHNtYWxsZXN0IGRlbm9taW5hdGlvbiwgcmVwcmVzZW50ZWQgYXMge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9pbmR1dG55L2JuLmpzL3xCTn1cbiAgICogQHBhcmFtIGZlZUFzc2V0SUQgT3B0aW9uYWwuIFRoZSBhc3NldElEIG9mIHRoZSBmZWVzIGJlaW5nIGJ1cm5lZC4gRGVmYXVsdDogYXNzZXRJRFxuICAgKiBAcGFyYW0gbWVtbyBPcHRpb25hbC4gQ29udGFpbnMgYXJiaXRyYXJ5IGRhdGEsIHVwIHRvIDI1NiBieXRlc1xuICAgKiBAcGFyYW0gYXNPZiBPcHRpb25hbC4gVGhlIHRpbWVzdGFtcCB0byB2ZXJpZnkgdGhlIHRyYW5zYWN0aW9uIGFnYWluc3QgYXMgYSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2luZHV0bnkvYm4uanMvfEJOfVxuICAgKiBAcGFyYW0gbG9ja3RpbWUgT3B0aW9uYWwuIFRoZSBsb2NrdGltZSBmaWVsZCBjcmVhdGVkIGluIHRoZSByZXN1bHRpbmcgb3V0cHV0c1xuICAgKiBAcGFyYW0gdGhyZXNob2xkIE9wdGlvbmFsLiBUaGUgbnVtYmVyIG9mIHNpZ25hdHVyZXMgcmVxdWlyZWQgdG8gc3BlbmQgdGhlIGZ1bmRzIGluIHRoZSByZXN1bHRhbnQgVVRYT1xuICAgKiBcbiAgICogQHJldHVybnMgQW4gdW5zaWduZWQgdHJhbnNhY3Rpb24gY3JlYXRlZCBmcm9tIHRoZSBwYXNzZWQgaW4gcGFyYW1ldGVycy5cbiAgICpcbiAgICovXG4gIGJ1aWxkQmFzZVR4ID0gKFxuICAgIG5ldHdvcmtpZDogbnVtYmVyLFxuICAgIGJsb2NrY2hhaW5pZDogQnVmZmVyLFxuICAgIGFtb3VudDogQk4sXG4gICAgYXNzZXRJRDogQnVmZmVyLFxuICAgIHRvQWRkcmVzc2VzOiBBcnJheTxCdWZmZXI+LFxuICAgIGZyb21BZGRyZXNzZXM6IEFycmF5PEJ1ZmZlcj4sXG4gICAgY2hhbmdlQWRkcmVzc2VzOiBBcnJheTxCdWZmZXI+ID0gdW5kZWZpbmVkLFxuICAgIGZlZTogQk4gPSB1bmRlZmluZWQsXG4gICAgZmVlQXNzZXRJRDogQnVmZmVyID0gdW5kZWZpbmVkLFxuICAgIG1lbW86IEJ1ZmZlciA9IHVuZGVmaW5lZCxcbiAgICBhc09mOiBCTiA9IFVuaXhOb3coKSxcbiAgICBsb2NrdGltZTogQk4gPSBuZXcgQk4oMCksXG4gICAgdGhyZXNob2xkOiBudW1iZXIgPSAxXG4gICk6IFVuc2lnbmVkVHggPT4ge1xuXG4gICAgaWYgKHRocmVzaG9sZCA+IHRvQWRkcmVzc2VzLmxlbmd0aCkge1xuICAgICAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cbiAgICAgIHRocm93IG5ldyBFcnJvcihcIkVycm9yIC0gVVRYT1NldC5idWlsZEJhc2VUeDogdGhyZXNob2xkIGlzIGdyZWF0ZXIgdGhhbiBudW1iZXIgb2YgYWRkcmVzc2VzXCIpO1xuICAgIH1cblxuICAgIGlmICh0eXBlb2YgY2hhbmdlQWRkcmVzc2VzID09PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICBjaGFuZ2VBZGRyZXNzZXMgPSB0b0FkZHJlc3NlcztcbiAgICB9XG5cbiAgICBpZiAodHlwZW9mIGZlZUFzc2V0SUQgPT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgIGZlZUFzc2V0SUQgPSBhc3NldElEO1xuICAgIH1cblxuICAgIGNvbnN0IHplcm86IEJOID0gbmV3IEJOKDApO1xuXG4gICAgaWYgKGFtb3VudC5lcSh6ZXJvKSkge1xuICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICB9XG5cbiAgICBjb25zdCBhYWQ6IEFzc2V0QW1vdW50RGVzdGluYXRpb24gPSBuZXcgQXNzZXRBbW91bnREZXN0aW5hdGlvbih0b0FkZHJlc3NlcywgZnJvbUFkZHJlc3NlcywgY2hhbmdlQWRkcmVzc2VzKTtcbiAgICBpZiAoYXNzZXRJRC50b1N0cmluZyhcImhleFwiKSA9PT0gZmVlQXNzZXRJRC50b1N0cmluZyhcImhleFwiKSkge1xuICAgICAgYWFkLmFkZEFzc2V0QW1vdW50KGFzc2V0SUQsIGFtb3VudCwgZmVlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgYWFkLmFkZEFzc2V0QW1vdW50KGFzc2V0SUQsIGFtb3VudCwgemVybyk7XG4gICAgICBpZiAodGhpcy5fZmVlQ2hlY2soZmVlLCBmZWVBc3NldElEKSkge1xuICAgICAgICBhYWQuYWRkQXNzZXRBbW91bnQoZmVlQXNzZXRJRCwgemVybywgZmVlKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBsZXQgaW5zOiBBcnJheTxUcmFuc2ZlcmFibGVJbnB1dD4gPSBbXTtcbiAgICBsZXQgb3V0czogQXJyYXk8VHJhbnNmZXJhYmxlT3V0cHV0PiA9IFtdO1xuXG4gICAgY29uc3QgbWluU3BlbmRhYmxlRXJyOiBFcnJvciA9IHRoaXMuZ2V0TWluaW11bVNwZW5kYWJsZShhYWQsIGFzT2YsIGxvY2t0aW1lLCB0aHJlc2hvbGQpO1xuICAgIGlmICh0eXBlb2YgbWluU3BlbmRhYmxlRXJyID09PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICBpbnMgPSBhYWQuZ2V0SW5wdXRzKCk7XG4gICAgICBvdXRzID0gYWFkLmdldEFsbE91dHB1dHMoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhyb3cgbWluU3BlbmRhYmxlRXJyO1xuICAgIH1cblxuICAgIGNvbnN0IGJhc2VUeDogQmFzZVR4ID0gbmV3IEJhc2VUeChuZXR3b3JraWQsIGJsb2NrY2hhaW5pZCwgb3V0cywgaW5zLCBtZW1vKTtcbiAgICByZXR1cm4gbmV3IFVuc2lnbmVkVHgoYmFzZVR4KTtcblxuICB9O1xuXG4gIC8qKlxuICAgICogQ3JlYXRlcyBhbiB1bnNpZ25lZCBJbXBvcnRUeCB0cmFuc2FjdGlvbi5cbiAgICAqXG4gICAgKiBAcGFyYW0gbmV0d29ya2lkIFRoZSBudW1iZXIgcmVwcmVzZW50aW5nIE5ldHdvcmtJRCBvZiB0aGUgbm9kZVxuICAgICogQHBhcmFtIGJsb2NrY2hhaW5pZCBUaGUge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0gcmVwcmVzZW50aW5nIHRoZSBCbG9ja2NoYWluSUQgZm9yIHRoZSB0cmFuc2FjdGlvblxuICAgICogQHBhcmFtIHRvQWRkcmVzc2VzIFRoZSBhZGRyZXNzZXMgdG8gc2VuZCB0aGUgZnVuZHNcbiAgICAqIEBwYXJhbSBmcm9tQWRkcmVzc2VzIFRoZSBhZGRyZXNzZXMgYmVpbmcgdXNlZCB0byBzZW5kIHRoZSBmdW5kcyBmcm9tIHRoZSBVVFhPcyB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfVxuICAgICogQHBhcmFtIGNoYW5nZUFkZHJlc3NlcyBPcHRpb25hbC4gVGhlIGFkZHJlc3NlcyB0aGF0IGNhbiBzcGVuZCB0aGUgY2hhbmdlIHJlbWFpbmluZyBmcm9tIHRoZSBzcGVudCBVVFhPcy4gRGVmYXVsdDogdG9BZGRyZXNzZXNcbiAgICAqIEBwYXJhbSBpbXBvcnRJbnMgQW4gYXJyYXkgb2YgW1tUcmFuc2ZlcmFibGVJbnB1dF1dcyBiZWluZyBpbXBvcnRlZFxuICAgICogQHBhcmFtIHNvdXJjZUNoYWluIEEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0gZm9yIHRoZSBjaGFpbmlkIHdoZXJlIHRoZSBpbXBvcnRzIGFyZSBjb21pbmcgZnJvbS5cbiAgICAqIEBwYXJhbSBmZWUgT3B0aW9uYWwuIFRoZSBhbW91bnQgb2YgZmVlcyB0byBidXJuIGluIGl0cyBzbWFsbGVzdCBkZW5vbWluYXRpb24sIHJlcHJlc2VudGVkIGFzIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vaW5kdXRueS9ibi5qcy98Qk59LiBGZWUgd2lsbCBjb21lIGZyb20gdGhlIGlucHV0cyBmaXJzdCwgaWYgdGhleSBjYW4uXG4gICAgKiBAcGFyYW0gZmVlQXNzZXRJRCBPcHRpb25hbC4gVGhlIGFzc2V0SUQgb2YgdGhlIGZlZXMgYmVpbmcgYnVybmVkLiBcbiAgICAqIEBwYXJhbSBtZW1vIE9wdGlvbmFsIGNvbnRhaW5zIGFyYml0cmFyeSBieXRlcywgdXAgdG8gMjU2IGJ5dGVzXG4gICAgKiBAcGFyYW0gYXNPZiBPcHRpb25hbC4gVGhlIHRpbWVzdGFtcCB0byB2ZXJpZnkgdGhlIHRyYW5zYWN0aW9uIGFnYWluc3QgYXMgYSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2luZHV0bnkvYm4uanMvfEJOfVxuICAgICogQHBhcmFtIGxvY2t0aW1lIE9wdGlvbmFsLiBUaGUgbG9ja3RpbWUgZmllbGQgY3JlYXRlZCBpbiB0aGUgcmVzdWx0aW5nIG91dHB1dHNcbiAgICAqIEBwYXJhbSB0aHJlc2hvbGQgT3B0aW9uYWwuIFRoZSBudW1iZXIgb2Ygc2lnbmF0dXJlcyByZXF1aXJlZCB0byBzcGVuZCB0aGUgZnVuZHMgaW4gdGhlIHJlc3VsdGFudCBVVFhPXG4gICAgKiBAcmV0dXJucyBBbiB1bnNpZ25lZCB0cmFuc2FjdGlvbiBjcmVhdGVkIGZyb20gdGhlIHBhc3NlZCBpbiBwYXJhbWV0ZXJzLlxuICAgICpcbiAgICAqL1xuICBidWlsZEltcG9ydFR4ID0gKFxuICAgIG5ldHdvcmtpZDogbnVtYmVyLFxuICAgIGJsb2NrY2hhaW5pZDogQnVmZmVyLFxuICAgIHRvQWRkcmVzc2VzOiBBcnJheTxCdWZmZXI+LFxuICAgIGZyb21BZGRyZXNzZXM6IEFycmF5PEJ1ZmZlcj4sXG4gICAgY2hhbmdlQWRkcmVzc2VzOiBBcnJheTxCdWZmZXI+LFxuICAgIGF0b21pY3M6IEFycmF5PFVUWE8+LFxuICAgIHNvdXJjZUNoYWluOiBCdWZmZXIgPSB1bmRlZmluZWQsXG4gICAgZmVlOiBCTiA9IHVuZGVmaW5lZCxcbiAgICBmZWVBc3NldElEOiBCdWZmZXIgPSB1bmRlZmluZWQsXG4gICAgbWVtbzogQnVmZmVyID0gdW5kZWZpbmVkLFxuICAgIGFzT2Y6IEJOID0gVW5peE5vdygpLFxuICAgIGxvY2t0aW1lOiBCTiA9IG5ldyBCTigwKSxcbiAgICB0aHJlc2hvbGQ6IG51bWJlciA9IDFcbiAgKTogVW5zaWduZWRUeCA9PiB7XG4gICAgY29uc3QgemVybzogQk4gPSBuZXcgQk4oMCk7XG4gICAgbGV0IGluczogQXJyYXk8VHJhbnNmZXJhYmxlSW5wdXQ+ID0gW107XG4gICAgbGV0IG91dHM6IEFycmF5PFRyYW5zZmVyYWJsZU91dHB1dD4gPSBbXTtcbiAgICBpZiAodHlwZW9mIGZlZSA9PT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgZmVlID0gemVyby5jbG9uZSgpO1xuICAgIH1cblxuICAgIGNvbnN0IGltcG9ydEluczogQXJyYXk8VHJhbnNmZXJhYmxlSW5wdXQ+ID0gW107XG4gICAgbGV0IGZlZXBhaWQ6IEJOID0gbmV3IEJOKDApO1xuICAgIGxldCBmZWVBc3NldFN0cjogc3RyaW5nID0gZmVlQXNzZXRJRC50b1N0cmluZyhcImhleFwiKTtcbiAgICBmb3IgKGxldCBpOiBudW1iZXIgPSAwOyBpIDwgYXRvbWljcy5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3QgdXR4bzogVVRYTyA9IGF0b21pY3NbaV07XG4gICAgICBjb25zdCBhc3NldElEOiBCdWZmZXIgPSB1dHhvLmdldEFzc2V0SUQoKTtcbiAgICAgIGNvbnN0IG91dHB1dDogQW1vdW50T3V0cHV0ID0gdXR4by5nZXRPdXRwdXQoKSBhcyBBbW91bnRPdXRwdXQ7XG4gICAgICBsZXQgYW10OiBCTiA9IG91dHB1dC5nZXRBbW91bnQoKS5jbG9uZSgpO1xuXG4gICAgICBsZXQgaW5mZWVhbW91bnQgPSBhbXQuY2xvbmUoKTtcbiAgICAgIGxldCBhc3NldFN0cjogc3RyaW5nID0gYXNzZXRJRC50b1N0cmluZyhcImhleFwiKTtcbiAgICAgIGlmIChcbiAgICAgICAgdHlwZW9mIGZlZUFzc2V0SUQgIT09IFwidW5kZWZpbmVkXCIgJiZcbiAgICAgICAgZmVlLmd0KHplcm8pICYmXG4gICAgICAgIGZlZXBhaWQubHQoZmVlKSAmJlxuICAgICAgICBhc3NldFN0ciA9PT0gZmVlQXNzZXRTdHJcbiAgICAgICkge1xuICAgICAgICBmZWVwYWlkID0gZmVlcGFpZC5hZGQoaW5mZWVhbW91bnQpO1xuICAgICAgICBpZiAoZmVlcGFpZC5ndGUoZmVlKSkge1xuICAgICAgICAgIGluZmVlYW1vdW50ID0gZmVlcGFpZC5zdWIoZmVlKTtcbiAgICAgICAgICBmZWVwYWlkID0gZmVlLmNsb25lKCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgaW5mZWVhbW91bnQgPSB6ZXJvLmNsb25lKCk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgY29uc3QgdHhpZDogQnVmZmVyID0gdXR4by5nZXRUeElEKCk7XG4gICAgICBjb25zdCBvdXRwdXRpZHg6IEJ1ZmZlciA9IHV0eG8uZ2V0T3V0cHV0SWR4KCk7XG4gICAgICBjb25zdCBpbnB1dDogU0VDUFRyYW5zZmVySW5wdXQgPSBuZXcgU0VDUFRyYW5zZmVySW5wdXQoYW10KTtcbiAgICAgIGNvbnN0IHhmZXJpbjogVHJhbnNmZXJhYmxlSW5wdXQgPSBuZXcgVHJhbnNmZXJhYmxlSW5wdXQodHhpZCwgb3V0cHV0aWR4LCBhc3NldElELCBpbnB1dCk7XG4gICAgICBjb25zdCBmcm9tOiBBcnJheTxCdWZmZXI+ID0gb3V0cHV0LmdldEFkZHJlc3NlcygpO1xuICAgICAgY29uc3Qgc3BlbmRlcnM6IEFycmF5PEJ1ZmZlcj4gPSBvdXRwdXQuZ2V0U3BlbmRlcnMoZnJvbSwgYXNPZik7XG4gICAgICBmb3IgKGxldCBqID0gMDsgaiA8IHNwZW5kZXJzLmxlbmd0aDsgaisrKSB7XG4gICAgICAgIGNvbnN0IGlkeDogbnVtYmVyID0gb3V0cHV0LmdldEFkZHJlc3NJZHgoc3BlbmRlcnNbal0pO1xuICAgICAgICBpZiAoaWR4ID09PSAtMSkge1xuICAgICAgICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdFcnJvciAtIFVUWE9TZXQuYnVpbGRJbXBvcnRUeDogbm8gc3VjaCAnXG4gICAgICAgICAgICArIGBhZGRyZXNzIGluIG91dHB1dDogJHtzcGVuZGVyc1tqXX1gKTtcbiAgICAgICAgfVxuICAgICAgICB4ZmVyaW4uZ2V0SW5wdXQoKS5hZGRTaWduYXR1cmVJZHgoaWR4LCBzcGVuZGVyc1tqXSk7XG4gICAgICB9XG4gICAgICBpbXBvcnRJbnMucHVzaCh4ZmVyaW4pO1xuICAgICAgLy9hZGQgZXh0cmEgb3V0cHV0cyBmb3IgZWFjaCBhbW91bnQgKGNhbGN1bGF0ZWQgZnJvbSB0aGUgaW1wb3J0ZWQgaW5wdXRzKSwgbWludXMgZmVlc1xuICAgICAgaWYgKGluZmVlYW1vdW50Lmd0KHplcm8pKSB7XG4gICAgICAgIGNvbnN0IHNwZW5kb3V0OiBBbW91bnRPdXRwdXQgPSBTZWxlY3RPdXRwdXRDbGFzcyhvdXRwdXQuZ2V0T3V0cHV0SUQoKSxcbiAgICAgICAgICBpbmZlZWFtb3VudCwgdG9BZGRyZXNzZXMsIGxvY2t0aW1lLCB0aHJlc2hvbGQpIGFzIEFtb3VudE91dHB1dDtcbiAgICAgICAgY29uc3QgeGZlcm91dDogVHJhbnNmZXJhYmxlT3V0cHV0ID0gbmV3IFRyYW5zZmVyYWJsZU91dHB1dChhc3NldElELCBzcGVuZG91dCk7XG4gICAgICAgIG91dHMucHVzaCh4ZmVyb3V0KTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBnZXQgcmVtYWluaW5nIGZlZXMgZnJvbSB0aGUgcHJvdmlkZWQgYWRkcmVzc2VzXG4gICAgbGV0IGZlZVJlbWFpbmluZzogQk4gPSBmZWUuc3ViKGZlZXBhaWQpO1xuICAgIGlmIChmZWVSZW1haW5pbmcuZ3QoemVybykgJiYgdGhpcy5fZmVlQ2hlY2soZmVlUmVtYWluaW5nLCBmZWVBc3NldElEKSkge1xuICAgICAgY29uc3QgYWFkOiBBc3NldEFtb3VudERlc3RpbmF0aW9uID0gbmV3IEFzc2V0QW1vdW50RGVzdGluYXRpb24odG9BZGRyZXNzZXMsIGZyb21BZGRyZXNzZXMsIGNoYW5nZUFkZHJlc3Nlcyk7XG4gICAgICBhYWQuYWRkQXNzZXRBbW91bnQoZmVlQXNzZXRJRCwgemVybywgZmVlUmVtYWluaW5nKTtcbiAgICAgIGNvbnN0IG1pblNwZW5kYWJsZUVycjogRXJyb3IgPSB0aGlzLmdldE1pbmltdW1TcGVuZGFibGUoYWFkLCBhc09mLCBsb2NrdGltZSwgdGhyZXNob2xkKTtcbiAgICAgIGlmICh0eXBlb2YgbWluU3BlbmRhYmxlRXJyID09PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICAgIGlucyA9IGFhZC5nZXRJbnB1dHMoKTtcbiAgICAgICAgb3V0cyA9IGFhZC5nZXRBbGxPdXRwdXRzKCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aHJvdyBtaW5TcGVuZGFibGVFcnI7XG4gICAgICB9XG4gICAgfVxuXG4gICAgY29uc3QgaW1wb3J0VHg6IEltcG9ydFR4ID0gbmV3IEltcG9ydFR4KG5ldHdvcmtpZCwgYmxvY2tjaGFpbmlkLCBvdXRzLCBpbnMsIG1lbW8sIHNvdXJjZUNoYWluLCBpbXBvcnRJbnMpO1xuICAgIHJldHVybiBuZXcgVW5zaWduZWRUeChpbXBvcnRUeCk7XG4gIH07XG5cbiAgLyoqXG4gICAgKiBDcmVhdGVzIGFuIHVuc2lnbmVkIEV4cG9ydFR4IHRyYW5zYWN0aW9uLiBcbiAgICAqXG4gICAgKiBAcGFyYW0gbmV0d29ya2lkIFRoZSBudW1iZXIgcmVwcmVzZW50aW5nIE5ldHdvcmtJRCBvZiB0aGUgbm9kZVxuICAgICogQHBhcmFtIGJsb2NrY2hhaW5pZCBUaGUge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0gcmVwcmVzZW50aW5nIHRoZSBCbG9ja2NoYWluSUQgZm9yIHRoZSB0cmFuc2FjdGlvblxuICAgICogQHBhcmFtIGFtb3VudCBUaGUgYW1vdW50IGJlaW5nIGV4cG9ydGVkIGFzIGEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9pbmR1dG55L2JuLmpzL3xCTn1cbiAgICAqIEBwYXJhbSBhdmF4QXNzZXRJRCB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSBvZiB0aGUgYXNzZXQgSUQgZm9yIEFWQVhcbiAgICAqIEBwYXJhbSB0b0FkZHJlc3NlcyBBbiBhcnJheSBvZiBhZGRyZXNzZXMgYXMge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0gd2hvIHJlY2lldmVzIHRoZSBBVkFYXG4gICAgKiBAcGFyYW0gZnJvbUFkZHJlc3NlcyBBbiBhcnJheSBvZiBhZGRyZXNzZXMgYXMge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0gd2hvIG93bnMgdGhlIEFWQVhcbiAgICAqIEBwYXJhbSBjaGFuZ2VBZGRyZXNzZXMgQW4gYXJyYXkgb2YgYWRkcmVzc2VzIGFzIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IHdobyBnZXRzIHRoZSBjaGFuZ2UgbGVmdG92ZXIgb2YgdGhlIEFWQVhcbiAgICAqIEBwYXJhbSBkZXN0aW5hdGlvbkNoYWluIE9wdGlvbmFsLiBBIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IGZvciB0aGUgY2hhaW5pZCB3aGVyZSB0byBzZW5kIHRoZSBhc3NldC5cbiAgICAqIEBwYXJhbSBmZWUgT3B0aW9uYWwuIFRoZSBhbW91bnQgb2YgZmVlcyB0byBidXJuIGluIGl0cyBzbWFsbGVzdCBkZW5vbWluYXRpb24sIHJlcHJlc2VudGVkIGFzIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vaW5kdXRueS9ibi5qcy98Qk59XG4gICAgKiBAcGFyYW0gZmVlQXNzZXRJRCBPcHRpb25hbC4gVGhlIGFzc2V0SUQgb2YgdGhlIGZlZXMgYmVpbmcgYnVybmVkLiBcbiAgICAqIEBwYXJhbSBtZW1vIE9wdGlvbmFsIGNvbnRhaW5zIGFyYml0cmFyeSBieXRlcywgdXAgdG8gMjU2IGJ5dGVzXG4gICAgKiBAcGFyYW0gYXNPZiBPcHRpb25hbC4gVGhlIHRpbWVzdGFtcCB0byB2ZXJpZnkgdGhlIHRyYW5zYWN0aW9uIGFnYWluc3QgYXMgYSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2luZHV0bnkvYm4uanMvfEJOfVxuICAgICogQHBhcmFtIGxvY2t0aW1lIE9wdGlvbmFsLiBUaGUgbG9ja3RpbWUgZmllbGQgY3JlYXRlZCBpbiB0aGUgcmVzdWx0aW5nIG91dHB1dHNcbiAgICAqIEBwYXJhbSB0aHJlc2hvbGQgT3B0aW9uYWwuIFRoZSBudW1iZXIgb2Ygc2lnbmF0dXJlcyByZXF1aXJlZCB0byBzcGVuZCB0aGUgZnVuZHMgaW4gdGhlIHJlc3VsdGFudCBVVFhPXG4gICAgKiBcbiAgICAqIEByZXR1cm5zIEFuIHVuc2lnbmVkIHRyYW5zYWN0aW9uIGNyZWF0ZWQgZnJvbSB0aGUgcGFzc2VkIGluIHBhcmFtZXRlcnMuXG4gICAgKlxuICAgICovXG4gIGJ1aWxkRXhwb3J0VHggPSAoXG4gICAgbmV0d29ya2lkOiBudW1iZXIsXG4gICAgYmxvY2tjaGFpbmlkOiBCdWZmZXIsXG4gICAgYW1vdW50OiBCTixcbiAgICBhdmF4QXNzZXRJRDogQnVmZmVyLCAvLyBUT0RPOiByZW5hbWUgdGhpcyB0byBhbW91bnRBc3NldElEXG4gICAgdG9BZGRyZXNzZXM6IEFycmF5PEJ1ZmZlcj4sXG4gICAgZnJvbUFkZHJlc3NlczogQXJyYXk8QnVmZmVyPixcbiAgICBjaGFuZ2VBZGRyZXNzZXM6IEFycmF5PEJ1ZmZlcj4gPSB1bmRlZmluZWQsXG4gICAgZGVzdGluYXRpb25DaGFpbjogQnVmZmVyID0gdW5kZWZpbmVkLFxuICAgIGZlZTogQk4gPSB1bmRlZmluZWQsXG4gICAgZmVlQXNzZXRJRDogQnVmZmVyID0gdW5kZWZpbmVkLFxuICAgIG1lbW86IEJ1ZmZlciA9IHVuZGVmaW5lZCxcbiAgICBhc09mOiBCTiA9IFVuaXhOb3coKSxcbiAgICBsb2NrdGltZTogQk4gPSBuZXcgQk4oMCksXG4gICAgdGhyZXNob2xkOiBudW1iZXIgPSAxLFxuICApOiBVbnNpZ25lZFR4ID0+IHtcbiAgICBsZXQgaW5zOiBBcnJheTxUcmFuc2ZlcmFibGVJbnB1dD4gPSBbXTtcbiAgICBsZXQgb3V0czogQXJyYXk8VHJhbnNmZXJhYmxlT3V0cHV0PiA9IFtdO1xuICAgIGxldCBleHBvcnRvdXRzOiBBcnJheTxUcmFuc2ZlcmFibGVPdXRwdXQ+ID0gW107XG5cbiAgICBpZiAodHlwZW9mIGNoYW5nZUFkZHJlc3NlcyA9PT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgY2hhbmdlQWRkcmVzc2VzID0gdG9BZGRyZXNzZXM7XG4gICAgfVxuXG4gICAgY29uc3QgemVybzogQk4gPSBuZXcgQk4oMCk7XG5cbiAgICBpZiAoYW1vdW50LmVxKHplcm8pKSB7XG4gICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgIH1cblxuICAgIGlmICh0eXBlb2YgZmVlQXNzZXRJRCA9PT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgZmVlQXNzZXRJRCA9IGF2YXhBc3NldElEO1xuICAgIH0gZWxzZSBpZiAoZmVlQXNzZXRJRC50b1N0cmluZyhcImhleFwiKSAhPT0gYXZheEFzc2V0SUQudG9TdHJpbmcoXCJoZXhcIikpIHtcbiAgICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0Vycm9yIC0gVVRYT1NldC5idWlsZEV4cG9ydFR4OiAnXG4gICAgICAgICsgYGZlZUFzc2V0SUQgbXVzdCBtYXRjaCBhdmF4QXNzZXRJRGApO1xuICAgIH1cblxuICAgIGlmICh0eXBlb2YgZGVzdGluYXRpb25DaGFpbiA9PT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgZGVzdGluYXRpb25DaGFpbiA9IGJpbnRvb2xzLmNiNThEZWNvZGUoRGVmYXVsdHMubmV0d29ya1tuZXR3b3JraWRdLlhbXCJibG9ja2NoYWluSURcIl0pO1xuICAgIH1cblxuICAgIGNvbnN0IGFhZDogQXNzZXRBbW91bnREZXN0aW5hdGlvbiA9IG5ldyBBc3NldEFtb3VudERlc3RpbmF0aW9uKHRvQWRkcmVzc2VzLCBmcm9tQWRkcmVzc2VzLCBjaGFuZ2VBZGRyZXNzZXMpO1xuICAgIGlmIChhdmF4QXNzZXRJRC50b1N0cmluZyhcImhleFwiKSA9PT0gZmVlQXNzZXRJRC50b1N0cmluZyhcImhleFwiKSkge1xuICAgICAgYWFkLmFkZEFzc2V0QW1vdW50KGF2YXhBc3NldElELCBhbW91bnQsIGZlZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGFhZC5hZGRBc3NldEFtb3VudChhdmF4QXNzZXRJRCwgYW1vdW50LCB6ZXJvKTtcbiAgICAgIGlmICh0aGlzLl9mZWVDaGVjayhmZWUsIGZlZUFzc2V0SUQpKSB7XG4gICAgICAgIGFhZC5hZGRBc3NldEFtb3VudChmZWVBc3NldElELCB6ZXJvLCBmZWUpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGNvbnN0IG1pblNwZW5kYWJsZUVycjogRXJyb3IgPSB0aGlzLmdldE1pbmltdW1TcGVuZGFibGUoYWFkLCBhc09mLCBsb2NrdGltZSwgdGhyZXNob2xkKTtcbiAgICBpZiAodHlwZW9mIG1pblNwZW5kYWJsZUVyciA9PT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgaW5zID0gYWFkLmdldElucHV0cygpO1xuICAgICAgb3V0cyA9IGFhZC5nZXRDaGFuZ2VPdXRwdXRzKCk7XG4gICAgICBleHBvcnRvdXRzID0gYWFkLmdldE91dHB1dHMoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhyb3cgbWluU3BlbmRhYmxlRXJyO1xuICAgIH1cblxuICAgIGNvbnN0IGV4cG9ydFR4OiBFeHBvcnRUeCA9IG5ldyBFeHBvcnRUeChuZXR3b3JraWQsIGJsb2NrY2hhaW5pZCwgb3V0cywgaW5zLCBtZW1vLCBkZXN0aW5hdGlvbkNoYWluLCBleHBvcnRvdXRzKTtcblxuICAgIHJldHVybiBuZXcgVW5zaWduZWRUeChleHBvcnRUeCk7XG4gIH07XG5cblxuICAvKipcbiAgKiBDbGFzcyByZXByZXNlbnRpbmcgYW4gdW5zaWduZWQgW1tBZGRTdWJuZXRWYWxpZGF0b3JUeF1dIHRyYW5zYWN0aW9uLlxuICAqXG4gICogQHBhcmFtIG5ldHdvcmtpZCBOZXR3b3JraWQsIFtbRGVmYXVsdE5ldHdvcmtJRF1dXG4gICogQHBhcmFtIGJsb2NrY2hhaW5pZCBCbG9ja2NoYWluaWQsIGRlZmF1bHQgdW5kZWZpbmVkXG4gICogQHBhcmFtIGZyb21BZGRyZXNzZXMgQW4gYXJyYXkgb2YgYWRkcmVzc2VzIGFzIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IHdobyBwYXlzIHRoZSBmZWVzIGluIEFWQVhcbiAgKiBAcGFyYW0gY2hhbmdlQWRkcmVzc2VzIEFuIGFycmF5IG9mIGFkZHJlc3NlcyBhcyB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSB3aG8gZ2V0cyB0aGUgY2hhbmdlIGxlZnRvdmVyIGZyb20gdGhlIGZlZSBwYXltZW50XG4gICogQHBhcmFtIG5vZGVJRCBUaGUgbm9kZSBJRCBvZiB0aGUgdmFsaWRhdG9yIGJlaW5nIGFkZGVkLlxuICAqIEBwYXJhbSBzdGFydFRpbWUgVGhlIFVuaXggdGltZSB3aGVuIHRoZSB2YWxpZGF0b3Igc3RhcnRzIHZhbGlkYXRpbmcgdGhlIFByaW1hcnkgTmV0d29yay5cbiAgKiBAcGFyYW0gZW5kVGltZSBUaGUgVW5peCB0aW1lIHdoZW4gdGhlIHZhbGlkYXRvciBzdG9wcyB2YWxpZGF0aW5nIHRoZSBQcmltYXJ5IE5ldHdvcmsgKGFuZCBzdGFrZWQgQVZBWCBpcyByZXR1cm5lZCkuXG4gICogQHBhcmFtIHdlaWdodCBUaGUgYW1vdW50IG9mIHdlaWdodCBmb3IgdGhpcyBzdWJuZXQgdmFsaWRhdG9yLlxuICAqIEBwYXJhbSBmZWUgT3B0aW9uYWwuIFRoZSBhbW91bnQgb2YgZmVlcyB0byBidXJuIGluIGl0cyBzbWFsbGVzdCBkZW5vbWluYXRpb24sIHJlcHJlc2VudGVkIGFzIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vaW5kdXRueS9ibi5qcy98Qk59XG4gICogQHBhcmFtIGZlZUFzc2V0SUQgT3B0aW9uYWwuIFRoZSBhc3NldElEIG9mIHRoZSBmZWVzIGJlaW5nIGJ1cm5lZC4gXG4gICogQHBhcmFtIG1lbW8gT3B0aW9uYWwgY29udGFpbnMgYXJiaXRyYXJ5IGJ5dGVzLCB1cCB0byAyNTYgYnl0ZXNcbiAgKiBAcGFyYW0gYXNPZiBPcHRpb25hbC4gVGhlIHRpbWVzdGFtcCB0byB2ZXJpZnkgdGhlIHRyYW5zYWN0aW9uIGFnYWluc3QgYXMgYSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2luZHV0bnkvYm4uanMvfEJOfVxuICAqIEBwYXJhbSBsb2NrdGltZSBPcHRpb25hbC4gVGhlIGxvY2t0aW1lIGZpZWxkIGNyZWF0ZWQgaW4gdGhlIHJlc3VsdGluZyBvdXRwdXRzXG4gICogQHBhcmFtIHRocmVzaG9sZCBPcHRpb25hbC4gVGhlIG51bWJlciBvZiBzaWduYXR1cmVzIHJlcXVpcmVkIHRvIHNwZW5kIHRoZSBmdW5kcyBpbiB0aGUgcmVzdWx0YW50IFVUWE9cbiAgKiBcbiAgKiBAcmV0dXJucyBBbiB1bnNpZ25lZCB0cmFuc2FjdGlvbiBjcmVhdGVkIGZyb20gdGhlIHBhc3NlZCBpbiBwYXJhbWV0ZXJzLlxuICAqL1xuXG4gIC8qIG11c3QgaW1wbGVtZW50IGxhdGVyIG9uY2UgdGhlIHRyYW5zYWN0aW9uIGZvcm1hdCBzaWduaW5nIHByb2Nlc3MgaXMgY2xlYXJlclxuICBidWlsZEFkZFN1Ym5ldFZhbGlkYXRvclR4ID0gKFxuICAgIG5ldHdvcmtpZDpudW1iZXIgPSBEZWZhdWx0TmV0d29ya0lELCBcbiAgICBibG9ja2NoYWluaWQ6QnVmZmVyLFxuICAgIGZyb21BZGRyZXNzZXM6QXJyYXk8QnVmZmVyPixcbiAgICBjaGFuZ2VBZGRyZXNzZXM6QXJyYXk8QnVmZmVyPixcbiAgICBub2RlSUQ6QnVmZmVyLCBcbiAgICBzdGFydFRpbWU6Qk4sIFxuICAgIGVuZFRpbWU6Qk4sXG4gICAgd2VpZ2h0OkJOLFxuICAgIGZlZTpCTiA9IHVuZGVmaW5lZCxcbiAgICBmZWVBc3NldElEOkJ1ZmZlciA9IHVuZGVmaW5lZCwgXG4gICAgbWVtbzpCdWZmZXIgPSB1bmRlZmluZWQsIFxuICAgIGFzT2Y6Qk4gPSBVbml4Tm93KClcbiAgKTpVbnNpZ25lZFR4ID0+IHtcbiAgICBsZXQgaW5zOkFycmF5PFRyYW5zZmVyYWJsZUlucHV0PiA9IFtdO1xuICAgIGxldCBvdXRzOkFycmF5PFRyYW5zZmVyYWJsZU91dHB1dD4gPSBbXTtcbiAgICAvL2xldCBzdGFrZU91dHM6QXJyYXk8VHJhbnNmZXJhYmxlT3V0cHV0PiA9IFtdO1xuICAgIFxuICAgIGNvbnN0IHplcm86Qk4gPSBuZXcgQk4oMCk7XG4gICAgY29uc3Qgbm93OkJOID0gVW5peE5vdygpO1xuICAgIGlmIChzdGFydFRpbWUubHQobm93KSB8fCBlbmRUaW1lLmx0ZShzdGFydFRpbWUpKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJVVFhPU2V0LmJ1aWxkQWRkU3VibmV0VmFsaWRhdG9yVHggLS0gc3RhcnRUaW1lIG11c3QgYmUgaW4gdGhlIGZ1dHVyZSBhbmQgZW5kVGltZSBtdXN0IGNvbWUgYWZ0ZXIgc3RhcnRUaW1lXCIpO1xuICAgIH1cbiAgIFxuICAgIC8vIE5vdCBpbXBsZW1lbnRlZDogRmVlcyBjYW4gYmUgcGFpZCBmcm9tIGltcG9ydEluc1xuICAgIGlmKHRoaXMuX2ZlZUNoZWNrKGZlZSwgZmVlQXNzZXRJRCkpIHtcbiAgICAgIGNvbnN0IGFhZDpBc3NldEFtb3VudERlc3RpbmF0aW9uID0gbmV3IEFzc2V0QW1vdW50RGVzdGluYXRpb24oZnJvbUFkZHJlc3NlcywgZnJvbUFkZHJlc3NlcywgY2hhbmdlQWRkcmVzc2VzKTtcbiAgICAgIGFhZC5hZGRBc3NldEFtb3VudChmZWVBc3NldElELCB6ZXJvLCBmZWUpO1xuICAgICAgY29uc3Qgc3VjY2VzczpFcnJvciA9IHRoaXMuZ2V0TWluaW11bVNwZW5kYWJsZShhYWQsIGFzT2YpO1xuICAgICAgaWYodHlwZW9mIHN1Y2Nlc3MgPT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgICAgaW5zID0gYWFkLmdldElucHV0cygpO1xuICAgICAgICBvdXRzID0gYWFkLmdldEFsbE91dHB1dHMoKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRocm93IHN1Y2Nlc3M7XG4gICAgICB9XG4gICAgfVxuICAgXG4gICAgY29uc3QgVVR4OkFkZFN1Ym5ldFZhbGlkYXRvclR4ID0gbmV3IEFkZFN1Ym5ldFZhbGlkYXRvclR4KG5ldHdvcmtpZCwgYmxvY2tjaGFpbmlkLCBvdXRzLCBpbnMsIG1lbW8sIG5vZGVJRCwgc3RhcnRUaW1lLCBlbmRUaW1lLCB3ZWlnaHQpO1xuICAgIHJldHVybiBuZXcgVW5zaWduZWRUeChVVHgpO1xuICB9XG4gICovXG5cbiAgLyoqXG4gICogQ2xhc3MgcmVwcmVzZW50aW5nIGFuIHVuc2lnbmVkIFtbQWRkRGVsZWdhdG9yVHhdXSB0cmFuc2FjdGlvbi5cbiAgKlxuICAqIEBwYXJhbSBuZXR3b3JraWQgTmV0d29ya2lkLCBbW0RlZmF1bHROZXR3b3JrSURdXVxuICAqIEBwYXJhbSBibG9ja2NoYWluaWQgQmxvY2tjaGFpbmlkLCBkZWZhdWx0IHVuZGVmaW5lZFxuICAqIEBwYXJhbSBhdmF4QXNzZXRJRCB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSBvZiB0aGUgYXNzZXQgSUQgZm9yIEFWQVhcbiAgKiBAcGFyYW0gdG9BZGRyZXNzZXMgQW4gYXJyYXkgb2YgYWRkcmVzc2VzIGFzIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IHJlY2lldmVzIHRoZSBzdGFrZSBhdCB0aGUgZW5kIG9mIHRoZSBzdGFraW5nIHBlcmlvZFxuICAqIEBwYXJhbSBmcm9tQWRkcmVzc2VzIEFuIGFycmF5IG9mIGFkZHJlc3NlcyBhcyB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSB3aG8gcGF5cyB0aGUgZmVlcyBhbmQgdGhlIHN0YWtlXG4gICogQHBhcmFtIGNoYW5nZUFkZHJlc3NlcyBBbiBhcnJheSBvZiBhZGRyZXNzZXMgYXMge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0gd2hvIGdldHMgdGhlIGNoYW5nZSBsZWZ0b3ZlciBmcm9tIHRoZSBzdGFraW5nIHBheW1lbnRcbiAgKiBAcGFyYW0gbm9kZUlEIFRoZSBub2RlIElEIG9mIHRoZSB2YWxpZGF0b3IgYmVpbmcgYWRkZWQuXG4gICogQHBhcmFtIHN0YXJ0VGltZSBUaGUgVW5peCB0aW1lIHdoZW4gdGhlIHZhbGlkYXRvciBzdGFydHMgdmFsaWRhdGluZyB0aGUgUHJpbWFyeSBOZXR3b3JrLlxuICAqIEBwYXJhbSBlbmRUaW1lIFRoZSBVbml4IHRpbWUgd2hlbiB0aGUgdmFsaWRhdG9yIHN0b3BzIHZhbGlkYXRpbmcgdGhlIFByaW1hcnkgTmV0d29yayAoYW5kIHN0YWtlZCBBVkFYIGlzIHJldHVybmVkKS5cbiAgKiBAcGFyYW0gc3Rha2VBbW91bnQgQSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2luZHV0bnkvYm4uanMvfEJOfSBmb3IgdGhlIGFtb3VudCBvZiBzdGFrZSB0byBiZSBkZWxlZ2F0ZWQgaW4gbkFWQVguXG4gICogQHBhcmFtIHJld2FyZExvY2t0aW1lIFRoZSBsb2NrdGltZSBmaWVsZCBjcmVhdGVkIGluIHRoZSByZXN1bHRpbmcgcmV3YXJkIG91dHB1dHNcbiAgKiBAcGFyYW0gcmV3YXJkVGhyZXNob2xkIFRoZSBudW1iZXIgb2Ygc2lnbmF0dXJlcyByZXF1aXJlZCB0byBzcGVuZCB0aGUgZnVuZHMgaW4gdGhlIHJlc3VsdGFudCByZXdhcmQgVVRYT1xuICAqIEBwYXJhbSByZXdhcmRBZGRyZXNzZXMgVGhlIGFkZHJlc3NlcyB0aGUgdmFsaWRhdG9yIHJld2FyZCBnb2VzLlxuICAqIEBwYXJhbSBmZWUgT3B0aW9uYWwuIFRoZSBhbW91bnQgb2YgZmVlcyB0byBidXJuIGluIGl0cyBzbWFsbGVzdCBkZW5vbWluYXRpb24sIHJlcHJlc2VudGVkIGFzIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vaW5kdXRueS9ibi5qcy98Qk59XG4gICogQHBhcmFtIGZlZUFzc2V0SUQgT3B0aW9uYWwuIFRoZSBhc3NldElEIG9mIHRoZSBmZWVzIGJlaW5nIGJ1cm5lZC4gXG4gICogQHBhcmFtIG1lbW8gT3B0aW9uYWwgY29udGFpbnMgYXJiaXRyYXJ5IGJ5dGVzLCB1cCB0byAyNTYgYnl0ZXNcbiAgKiBAcGFyYW0gYXNPZiBPcHRpb25hbC4gVGhlIHRpbWVzdGFtcCB0byB2ZXJpZnkgdGhlIHRyYW5zYWN0aW9uIGFnYWluc3QgYXMgYSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2luZHV0bnkvYm4uanMvfEJOfVxuICAqIFxuICAqIEByZXR1cm5zIEFuIHVuc2lnbmVkIHRyYW5zYWN0aW9uIGNyZWF0ZWQgZnJvbSB0aGUgcGFzc2VkIGluIHBhcmFtZXRlcnMuXG4gICovXG4gIGJ1aWxkQWRkRGVsZWdhdG9yVHggPSAoXG4gICAgbmV0d29ya2lkOiBudW1iZXIgPSBEZWZhdWx0TmV0d29ya0lELFxuICAgIGJsb2NrY2hhaW5pZDogQnVmZmVyLFxuICAgIGF2YXhBc3NldElEOiBCdWZmZXIsXG4gICAgdG9BZGRyZXNzZXM6IEFycmF5PEJ1ZmZlcj4sXG4gICAgZnJvbUFkZHJlc3NlczogQXJyYXk8QnVmZmVyPixcbiAgICBjaGFuZ2VBZGRyZXNzZXM6IEFycmF5PEJ1ZmZlcj4sXG4gICAgbm9kZUlEOiBCdWZmZXIsXG4gICAgc3RhcnRUaW1lOiBCTixcbiAgICBlbmRUaW1lOiBCTixcbiAgICBzdGFrZUFtb3VudDogQk4sXG4gICAgcmV3YXJkTG9ja3RpbWU6IEJOLFxuICAgIHJld2FyZFRocmVzaG9sZDogbnVtYmVyLFxuICAgIHJld2FyZEFkZHJlc3NlczogQXJyYXk8QnVmZmVyPixcbiAgICBmZWU6IEJOID0gdW5kZWZpbmVkLFxuICAgIGZlZUFzc2V0SUQ6IEJ1ZmZlciA9IHVuZGVmaW5lZCxcbiAgICBtZW1vOiBCdWZmZXIgPSB1bmRlZmluZWQsXG4gICAgYXNPZjogQk4gPSBVbml4Tm93KCksXG4gICk6IFVuc2lnbmVkVHggPT4ge1xuICAgIGxldCBpbnM6IEFycmF5PFRyYW5zZmVyYWJsZUlucHV0PiA9IFtdO1xuICAgIGxldCBvdXRzOiBBcnJheTxUcmFuc2ZlcmFibGVPdXRwdXQ+ID0gW107XG4gICAgbGV0IHN0YWtlT3V0czogQXJyYXk8VHJhbnNmZXJhYmxlT3V0cHV0PiA9IFtdO1xuXG4gICAgY29uc3QgemVybzogQk4gPSBuZXcgQk4oMCk7XG4gICAgY29uc3Qgbm93OiBCTiA9IFVuaXhOb3coKTtcbiAgICBpZiAoc3RhcnRUaW1lLmx0KG5vdykgfHwgZW5kVGltZS5sdGUoc3RhcnRUaW1lKSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiVVRYT1NldC5idWlsZEFkZERlbGVnYXRvclR4IC0tIHN0YXJ0VGltZSBtdXN0IGJlIGluIHRoZSBmdXR1cmUgYW5kIGVuZFRpbWUgbXVzdCBjb21lIGFmdGVyIHN0YXJ0VGltZVwiKTtcbiAgICB9XG5cbiAgICBjb25zdCBhYWQ6IEFzc2V0QW1vdW50RGVzdGluYXRpb24gPSBuZXcgQXNzZXRBbW91bnREZXN0aW5hdGlvbih0b0FkZHJlc3NlcywgZnJvbUFkZHJlc3NlcywgY2hhbmdlQWRkcmVzc2VzKTtcbiAgICBpZiAoYXZheEFzc2V0SUQudG9TdHJpbmcoXCJoZXhcIikgPT09IGZlZUFzc2V0SUQudG9TdHJpbmcoXCJoZXhcIikpIHtcbiAgICAgIGFhZC5hZGRBc3NldEFtb3VudChhdmF4QXNzZXRJRCwgc3Rha2VBbW91bnQsIGZlZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGFhZC5hZGRBc3NldEFtb3VudChhdmF4QXNzZXRJRCwgc3Rha2VBbW91bnQsIHplcm8pO1xuICAgICAgaWYgKHRoaXMuX2ZlZUNoZWNrKGZlZSwgZmVlQXNzZXRJRCkpIHtcbiAgICAgICAgYWFkLmFkZEFzc2V0QW1vdW50KGZlZUFzc2V0SUQsIHplcm8sIGZlZSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgY29uc3QgbWluU3BlbmRhYmxlRXJyOiBFcnJvciA9IHRoaXMuZ2V0TWluaW11bVNwZW5kYWJsZShhYWQsIGFzT2YsIHVuZGVmaW5lZCwgdW5kZWZpbmVkLCB0cnVlKTtcbiAgICBpZiAodHlwZW9mIG1pblNwZW5kYWJsZUVyciA9PT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgaW5zID0gYWFkLmdldElucHV0cygpO1xuICAgICAgb3V0cyA9IGFhZC5nZXRDaGFuZ2VPdXRwdXRzKCk7XG4gICAgICBzdGFrZU91dHMgPSBhYWQuZ2V0T3V0cHV0cygpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aHJvdyBtaW5TcGVuZGFibGVFcnI7XG4gICAgfVxuXG4gICAgY29uc3QgcmV3YXJkT3V0cHV0T3duZXJzOiBTRUNQT3duZXJPdXRwdXQgPSBuZXcgU0VDUE93bmVyT3V0cHV0KHJld2FyZEFkZHJlc3NlcywgcmV3YXJkTG9ja3RpbWUsIHJld2FyZFRocmVzaG9sZCk7XG5cbiAgICBjb25zdCBVVHg6IEFkZERlbGVnYXRvclR4ID0gbmV3IEFkZERlbGVnYXRvclR4KG5ldHdvcmtpZCwgYmxvY2tjaGFpbmlkLCBvdXRzLCBpbnMsIG1lbW8sIG5vZGVJRCwgc3RhcnRUaW1lLCBlbmRUaW1lLCBzdGFrZUFtb3VudCwgc3Rha2VPdXRzLCBuZXcgUGFyc2VhYmxlT3V0cHV0KHJld2FyZE91dHB1dE93bmVycykpO1xuICAgIHJldHVybiBuZXcgVW5zaWduZWRUeChVVHgpO1xuICB9XG5cbiAgLyoqXG4gICAgKiBDbGFzcyByZXByZXNlbnRpbmcgYW4gdW5zaWduZWQgW1tBZGRWYWxpZGF0b3JUeF1dIHRyYW5zYWN0aW9uLlxuICAgICpcbiAgICAqIEBwYXJhbSBuZXR3b3JraWQgTmV0d29ya2lkLCBbW0RlZmF1bHROZXR3b3JrSURdXVxuICAgICogQHBhcmFtIGJsb2NrY2hhaW5pZCBCbG9ja2NoYWluaWQsIGRlZmF1bHQgdW5kZWZpbmVkXG4gICAgKiBAcGFyYW0gYXZheEFzc2V0SUQge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0gb2YgdGhlIGFzc2V0IElEIGZvciBBVkFYXG4gICAgKiBAcGFyYW0gdG9BZGRyZXNzZXMgQW4gYXJyYXkgb2YgYWRkcmVzc2VzIGFzIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IHJlY2lldmVzIHRoZSBzdGFrZSBhdCB0aGUgZW5kIG9mIHRoZSBzdGFraW5nIHBlcmlvZFxuICAgICogQHBhcmFtIGZyb21BZGRyZXNzZXMgQW4gYXJyYXkgb2YgYWRkcmVzc2VzIGFzIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IHdobyBwYXlzIHRoZSBmZWVzIGFuZCB0aGUgc3Rha2VcbiAgICAqIEBwYXJhbSBjaGFuZ2VBZGRyZXNzZXMgQW4gYXJyYXkgb2YgYWRkcmVzc2VzIGFzIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IHdobyBnZXRzIHRoZSBjaGFuZ2UgbGVmdG92ZXIgZnJvbSB0aGUgc3Rha2luZyBwYXltZW50XG4gICAgKiBAcGFyYW0gbm9kZUlEIFRoZSBub2RlIElEIG9mIHRoZSB2YWxpZGF0b3IgYmVpbmcgYWRkZWQuXG4gICAgKiBAcGFyYW0gc3RhcnRUaW1lIFRoZSBVbml4IHRpbWUgd2hlbiB0aGUgdmFsaWRhdG9yIHN0YXJ0cyB2YWxpZGF0aW5nIHRoZSBQcmltYXJ5IE5ldHdvcmsuXG4gICAgKiBAcGFyYW0gZW5kVGltZSBUaGUgVW5peCB0aW1lIHdoZW4gdGhlIHZhbGlkYXRvciBzdG9wcyB2YWxpZGF0aW5nIHRoZSBQcmltYXJ5IE5ldHdvcmsgKGFuZCBzdGFrZWQgQVZBWCBpcyByZXR1cm5lZCkuXG4gICAgKiBAcGFyYW0gc3Rha2VBbW91bnQgQSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2luZHV0bnkvYm4uanMvfEJOfSBmb3IgdGhlIGFtb3VudCBvZiBzdGFrZSB0byBiZSBkZWxlZ2F0ZWQgaW4gbkFWQVguXG4gICAgKiBAcGFyYW0gcmV3YXJkTG9ja3RpbWUgVGhlIGxvY2t0aW1lIGZpZWxkIGNyZWF0ZWQgaW4gdGhlIHJlc3VsdGluZyByZXdhcmQgb3V0cHV0c1xuICAgICogQHBhcmFtIHJld2FyZFRocmVzaG9sZCBUaGUgbnVtYmVyIG9mIHNpZ25hdHVyZXMgcmVxdWlyZWQgdG8gc3BlbmQgdGhlIGZ1bmRzIGluIHRoZSByZXN1bHRhbnQgcmV3YXJkIFVUWE9cbiAgICAqIEBwYXJhbSByZXdhcmRBZGRyZXNzZXMgVGhlIGFkZHJlc3NlcyB0aGUgdmFsaWRhdG9yIHJld2FyZCBnb2VzLlxuICAgICogQHBhcmFtIGRlbGVnYXRpb25GZWUgQSBudW1iZXIgZm9yIHRoZSBwZXJjZW50YWdlIG9mIHJld2FyZCB0byBiZSBnaXZlbiB0byB0aGUgdmFsaWRhdG9yIHdoZW4gc29tZW9uZSBkZWxlZ2F0ZXMgdG8gdGhlbS4gTXVzdCBiZSBiZXR3ZWVuIDAgYW5kIDEwMC4gXG4gICAgKiBAcGFyYW0gbWluU3Rha2UgQSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2luZHV0bnkvYm4uanMvfEJOfSByZXByZXNlbnRpbmcgdGhlIG1pbmltdW0gc3Rha2UgcmVxdWlyZWQgdG8gdmFsaWRhdGUgb24gdGhpcyBuZXR3b3JrLlxuICAgICogQHBhcmFtIGZlZSBPcHRpb25hbC4gVGhlIGFtb3VudCBvZiBmZWVzIHRvIGJ1cm4gaW4gaXRzIHNtYWxsZXN0IGRlbm9taW5hdGlvbiwgcmVwcmVzZW50ZWQgYXMge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9pbmR1dG55L2JuLmpzL3xCTn1cbiAgICAqIEBwYXJhbSBmZWVBc3NldElEIE9wdGlvbmFsLiBUaGUgYXNzZXRJRCBvZiB0aGUgZmVlcyBiZWluZyBidXJuZWQuIFxuICAgICogQHBhcmFtIG1lbW8gT3B0aW9uYWwgY29udGFpbnMgYXJiaXRyYXJ5IGJ5dGVzLCB1cCB0byAyNTYgYnl0ZXNcbiAgICAqIEBwYXJhbSBhc09mIE9wdGlvbmFsLiBUaGUgdGltZXN0YW1wIHRvIHZlcmlmeSB0aGUgdHJhbnNhY3Rpb24gYWdhaW5zdCBhcyBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vaW5kdXRueS9ibi5qcy98Qk59XG4gICAgKiBcbiAgICAqIEByZXR1cm5zIEFuIHVuc2lnbmVkIHRyYW5zYWN0aW9uIGNyZWF0ZWQgZnJvbSB0aGUgcGFzc2VkIGluIHBhcmFtZXRlcnMuXG4gICAgKi9cbiAgYnVpbGRBZGRWYWxpZGF0b3JUeCA9IChcbiAgICBuZXR3b3JraWQ6IG51bWJlciA9IERlZmF1bHROZXR3b3JrSUQsXG4gICAgYmxvY2tjaGFpbmlkOiBCdWZmZXIsXG4gICAgYXZheEFzc2V0SUQ6IEJ1ZmZlcixcbiAgICB0b0FkZHJlc3NlczogQXJyYXk8QnVmZmVyPixcbiAgICBmcm9tQWRkcmVzc2VzOiBBcnJheTxCdWZmZXI+LFxuICAgIGNoYW5nZUFkZHJlc3NlczogQXJyYXk8QnVmZmVyPixcbiAgICBub2RlSUQ6IEJ1ZmZlcixcbiAgICBzdGFydFRpbWU6IEJOLFxuICAgIGVuZFRpbWU6IEJOLFxuICAgIHN0YWtlQW1vdW50OiBCTixcbiAgICByZXdhcmRMb2NrdGltZTogQk4sXG4gICAgcmV3YXJkVGhyZXNob2xkOiBudW1iZXIsXG4gICAgcmV3YXJkQWRkcmVzc2VzOiBBcnJheTxCdWZmZXI+LFxuICAgIGRlbGVnYXRpb25GZWU6IG51bWJlcixcbiAgICBmZWU6IEJOID0gdW5kZWZpbmVkLFxuICAgIGZlZUFzc2V0SUQ6IEJ1ZmZlciA9IHVuZGVmaW5lZCxcbiAgICBtZW1vOiBCdWZmZXIgPSB1bmRlZmluZWQsXG4gICAgYXNPZjogQk4gPSBVbml4Tm93KCksXG4gICk6IFVuc2lnbmVkVHggPT4ge1xuICAgIGxldCBpbnM6IEFycmF5PFRyYW5zZmVyYWJsZUlucHV0PiA9IFtdO1xuICAgIGxldCBvdXRzOiBBcnJheTxUcmFuc2ZlcmFibGVPdXRwdXQ+ID0gW107XG4gICAgbGV0IHN0YWtlT3V0czogQXJyYXk8VHJhbnNmZXJhYmxlT3V0cHV0PiA9IFtdO1xuXG4gICAgY29uc3QgemVybzogQk4gPSBuZXcgQk4oMCk7XG4gICAgY29uc3Qgbm93OiBCTiA9IFVuaXhOb3coKTtcbiAgICBpZiAoc3RhcnRUaW1lLmx0KG5vdykgfHwgZW5kVGltZS5sdGUoc3RhcnRUaW1lKSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiVVRYT1NldC5idWlsZEFkZFZhbGlkYXRvclR4IC0tIHN0YXJ0VGltZSBtdXN0IGJlIGluIHRoZSBmdXR1cmUgYW5kIGVuZFRpbWUgbXVzdCBjb21lIGFmdGVyIHN0YXJ0VGltZVwiKTtcbiAgICB9XG5cbiAgICBpZiAoZGVsZWdhdGlvbkZlZSA+IDEwMCB8fCBkZWxlZ2F0aW9uRmVlIDwgMCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiVVRYT1NldC5idWlsZEFkZFZhbGlkYXRvclR4IC0tIHN0YXJ0VGltZSBtdXN0IGJlIGluIHRoZSByYW5nZSBvZiAwIHRvIDEwMCwgaW5jbHVzaXZlbHlcIik7XG4gICAgfVxuXG4gICAgY29uc3QgYWFkOiBBc3NldEFtb3VudERlc3RpbmF0aW9uID0gbmV3IEFzc2V0QW1vdW50RGVzdGluYXRpb24odG9BZGRyZXNzZXMsIGZyb21BZGRyZXNzZXMsIGNoYW5nZUFkZHJlc3Nlcyk7XG4gICAgaWYgKGF2YXhBc3NldElELnRvU3RyaW5nKFwiaGV4XCIpID09PSBmZWVBc3NldElELnRvU3RyaW5nKFwiaGV4XCIpKSB7XG4gICAgICBhYWQuYWRkQXNzZXRBbW91bnQoYXZheEFzc2V0SUQsIHN0YWtlQW1vdW50LCBmZWUpO1xuICAgIH0gZWxzZSB7XG4gICAgICBhYWQuYWRkQXNzZXRBbW91bnQoYXZheEFzc2V0SUQsIHN0YWtlQW1vdW50LCB6ZXJvKTtcbiAgICAgIGlmICh0aGlzLl9mZWVDaGVjayhmZWUsIGZlZUFzc2V0SUQpKSB7XG4gICAgICAgIGFhZC5hZGRBc3NldEFtb3VudChmZWVBc3NldElELCB6ZXJvLCBmZWUpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGNvbnN0IG1pblNwZW5kYWJsZUVycjogRXJyb3IgPSB0aGlzLmdldE1pbmltdW1TcGVuZGFibGUoYWFkLCBhc09mLCB1bmRlZmluZWQsIHVuZGVmaW5lZCwgdHJ1ZSk7XG4gICAgaWYgKHR5cGVvZiBtaW5TcGVuZGFibGVFcnIgPT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgIGlucyA9IGFhZC5nZXRJbnB1dHMoKTtcbiAgICAgIG91dHMgPSBhYWQuZ2V0Q2hhbmdlT3V0cHV0cygpO1xuICAgICAgc3Rha2VPdXRzID0gYWFkLmdldE91dHB1dHMoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhyb3cgbWluU3BlbmRhYmxlRXJyO1xuICAgIH1cblxuICAgIGNvbnN0IHJld2FyZE91dHB1dE93bmVyczogU0VDUE93bmVyT3V0cHV0ID0gbmV3IFNFQ1BPd25lck91dHB1dChyZXdhcmRBZGRyZXNzZXMsIHJld2FyZExvY2t0aW1lLCByZXdhcmRUaHJlc2hvbGQpO1xuXG4gICAgY29uc3QgVVR4OiBBZGRWYWxpZGF0b3JUeCA9IG5ldyBBZGRWYWxpZGF0b3JUeChuZXR3b3JraWQsIGJsb2NrY2hhaW5pZCwgb3V0cywgaW5zLCBtZW1vLCBub2RlSUQsIHN0YXJ0VGltZSwgZW5kVGltZSwgc3Rha2VBbW91bnQsIHN0YWtlT3V0cywgbmV3IFBhcnNlYWJsZU91dHB1dChyZXdhcmRPdXRwdXRPd25lcnMpLCBkZWxlZ2F0aW9uRmVlKTtcbiAgICByZXR1cm4gbmV3IFVuc2lnbmVkVHgoVVR4KTtcbiAgfVxuXG4gIC8qKlxuICAgICogQ2xhc3MgcmVwcmVzZW50aW5nIGFuIHVuc2lnbmVkIFtbQ3JlYXRlU3VibmV0VHhdXSB0cmFuc2FjdGlvbi5cbiAgICAqXG4gICAgKiBAcGFyYW0gbmV0d29ya2lkIE5ldHdvcmtpZCwgW1tEZWZhdWx0TmV0d29ya0lEXV1cbiAgICAqIEBwYXJhbSBibG9ja2NoYWluaWQgQmxvY2tjaGFpbmlkLCBkZWZhdWx0IHVuZGVmaW5lZFxuICAgICogQHBhcmFtIGZyb21BZGRyZXNzZXMgVGhlIGFkZHJlc3NlcyBiZWluZyB1c2VkIHRvIHNlbmQgdGhlIGZ1bmRzIGZyb20gdGhlIFVUWE9zIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9XG4gICAgKiBAcGFyYW0gY2hhbmdlQWRkcmVzc2VzIFRoZSBhZGRyZXNzZXMgdGhhdCBjYW4gc3BlbmQgdGhlIGNoYW5nZSByZW1haW5pbmcgZnJvbSB0aGUgc3BlbnQgVVRYT3MuXG4gICAgKiBAcGFyYW0gc3VibmV0T3duZXJBZGRyZXNzZXMgQW4gYXJyYXkgb2Yge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0gZm9yIHRoZSBhZGRyZXNzZXMgdG8gYWRkIHRvIGEgc3VibmV0XG4gICAgKiBAcGFyYW0gc3VibmV0T3duZXJUaHJlc2hvbGQgVGhlIG51bWJlciBvZiBvd25lcnMncyBzaWduYXR1cmVzIHJlcXVpcmVkIHRvIGFkZCBhIHZhbGlkYXRvciB0byB0aGUgbmV0d29ya1xuICAgICogQHBhcmFtIGZlZSBPcHRpb25hbC4gVGhlIGFtb3VudCBvZiBmZWVzIHRvIGJ1cm4gaW4gaXRzIHNtYWxsZXN0IGRlbm9taW5hdGlvbiwgcmVwcmVzZW50ZWQgYXMge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9pbmR1dG55L2JuLmpzL3xCTn1cbiAgICAqIEBwYXJhbSBmZWVBc3NldElEIE9wdGlvbmFsLiBUaGUgYXNzZXRJRCBvZiB0aGUgZmVlcyBiZWluZyBidXJuZWRcbiAgICAqIEBwYXJhbSBtZW1vIE9wdGlvbmFsIGNvbnRhaW5zIGFyYml0cmFyeSBieXRlcywgdXAgdG8gMjU2IGJ5dGVzXG4gICAgKiBAcGFyYW0gYXNPZiBPcHRpb25hbC4gVGhlIHRpbWVzdGFtcCB0byB2ZXJpZnkgdGhlIHRyYW5zYWN0aW9uIGFnYWluc3QgYXMgYSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2luZHV0bnkvYm4uanMvfEJOfVxuICAgICogXG4gICAgKiBAcmV0dXJucyBBbiB1bnNpZ25lZCB0cmFuc2FjdGlvbiBjcmVhdGVkIGZyb20gdGhlIHBhc3NlZCBpbiBwYXJhbWV0ZXJzLlxuICAgICovXG4gIGJ1aWxkQ3JlYXRlU3VibmV0VHggPSAoXG4gICAgbmV0d29ya2lkOiBudW1iZXIgPSBEZWZhdWx0TmV0d29ya0lELFxuICAgIGJsb2NrY2hhaW5pZDogQnVmZmVyLFxuICAgIGZyb21BZGRyZXNzZXM6IEFycmF5PEJ1ZmZlcj4sXG4gICAgY2hhbmdlQWRkcmVzc2VzOiBBcnJheTxCdWZmZXI+LFxuICAgIHN1Ym5ldE93bmVyQWRkcmVzc2VzOiBBcnJheTxCdWZmZXI+LFxuICAgIHN1Ym5ldE93bmVyVGhyZXNob2xkOiBudW1iZXIsXG4gICAgZmVlOiBCTiA9IHVuZGVmaW5lZCxcbiAgICBmZWVBc3NldElEOiBCdWZmZXIgPSB1bmRlZmluZWQsXG4gICAgbWVtbzogQnVmZmVyID0gdW5kZWZpbmVkLFxuICAgIGFzT2Y6IEJOID0gVW5peE5vdygpLFxuICApOiBVbnNpZ25lZFR4ID0+IHtcbiAgICBjb25zdCB6ZXJvOiBCTiA9IG5ldyBCTigwKTtcbiAgICBsZXQgaW5zOiBBcnJheTxUcmFuc2ZlcmFibGVJbnB1dD4gPSBbXTtcbiAgICBsZXQgb3V0czogQXJyYXk8VHJhbnNmZXJhYmxlT3V0cHV0PiA9IFtdO1xuXG4gICAgaWYgKHRoaXMuX2ZlZUNoZWNrKGZlZSwgZmVlQXNzZXRJRCkpIHtcbiAgICAgIGNvbnN0IGFhZDogQXNzZXRBbW91bnREZXN0aW5hdGlvbiA9IG5ldyBBc3NldEFtb3VudERlc3RpbmF0aW9uKGZyb21BZGRyZXNzZXMsIGZyb21BZGRyZXNzZXMsIGNoYW5nZUFkZHJlc3Nlcyk7XG4gICAgICBhYWQuYWRkQXNzZXRBbW91bnQoZmVlQXNzZXRJRCwgemVybywgZmVlKTtcbiAgICAgIGNvbnN0IG1pblNwZW5kYWJsZUVycjogRXJyb3IgPSB0aGlzLmdldE1pbmltdW1TcGVuZGFibGUoYWFkLCBhc09mLCB1bmRlZmluZWQsIHVuZGVmaW5lZCk7XG4gICAgICBpZiAodHlwZW9mIG1pblNwZW5kYWJsZUVyciA9PT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgICBpbnMgPSBhYWQuZ2V0SW5wdXRzKCk7XG4gICAgICAgIG91dHMgPSBhYWQuZ2V0QWxsT3V0cHV0cygpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhyb3cgbWluU3BlbmRhYmxlRXJyO1xuICAgICAgfVxuICAgIH1cblxuICAgIGNvbnN0IGxvY2t0aW1lOiBCTiA9IG5ldyBCTigwKVxuICAgIGNvbnN0IFVUeDogQ3JlYXRlU3VibmV0VHggPSBuZXcgQ3JlYXRlU3VibmV0VHgobmV0d29ya2lkLCBibG9ja2NoYWluaWQsIG91dHMsIGlucywgbWVtbywgbmV3IFNFQ1BPd25lck91dHB1dChzdWJuZXRPd25lckFkZHJlc3NlcywgbG9ja3RpbWUsIHN1Ym5ldE93bmVyVGhyZXNob2xkKSk7XG4gICAgcmV0dXJuIG5ldyBVbnNpZ25lZFR4KFVUeCk7XG4gIH1cblxufVxuIl19