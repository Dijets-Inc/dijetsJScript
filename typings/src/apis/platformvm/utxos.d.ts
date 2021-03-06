/**
 * @packageDocumentation
 * @module API-PlatformVM-UTXOs
 */
import { Buffer } from 'buffer/';
import BN from "bn.js";
import { TransferableOutput } from './outputs';
import { TransferableInput } from './inputs';
import { StandardUTXO, StandardUTXOSet } from '../../common/utxos';
import { UnsignedTx } from './tx';
import { StandardAssetAmountDestination } from '../../common/assetamount';
import { Output } from '../../common/output';
import { SerializedEncoding } from '../../utils/serialization';
/**
 * Class for representing a single UTXO.
 */
export declare class UTXO extends StandardUTXO {
    protected _typeName: string;
    protected _typeID: any;
    deserialize(fields: object, encoding?: SerializedEncoding): void;
    fromBuffer(bytes: Buffer, offset?: number): number;
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
    fromString(serialized: string): number;
    /**
     * Returns a base-58 representation of the [[UTXO]].
     *
     * @remarks
     * unlike most toStrings, this returns in cb58 serialization format
     */
    toString(): string;
    clone(): this;
    create(codecID?: number, txid?: Buffer, outputidx?: Buffer | number, assetid?: Buffer, output?: Output): this;
}
export declare class AssetAmountDestination extends StandardAssetAmountDestination<TransferableOutput, TransferableInput> {
}
/**
 * Class representing a set of [[UTXO]]s.
 */
export declare class UTXOSet extends StandardUTXOSet<UTXO> {
    protected _typeName: string;
    protected _typeID: any;
    deserialize(fields: object, encoding?: SerializedEncoding): void;
    parseUTXO(utxo: UTXO | string): UTXO;
    create(...args: any[]): this;
    clone(): this;
    _feeCheck(fee: BN, feeAssetID: Buffer): boolean;
    getConsumableUXTO: (asOf?: BN, stakeable?: boolean) => UTXO[];
    getMinimumSpendable: (aad: AssetAmountDestination, asOf?: BN, locktime?: BN, threshold?: number, stakeable?: boolean) => Error;
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
    buildBaseTx: (networkid: number, blockchainid: Buffer, amount: BN, assetID: Buffer, toAddresses: Array<Buffer>, fromAddresses: Array<Buffer>, changeAddresses?: Array<Buffer>, fee?: BN, feeAssetID?: Buffer, memo?: Buffer, asOf?: BN, locktime?: BN, threshold?: number) => UnsignedTx;
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
    buildImportTx: (networkid: number, blockchainid: Buffer, toAddresses: Array<Buffer>, fromAddresses: Array<Buffer>, changeAddresses: Array<Buffer>, atomics: Array<UTXO>, sourceChain?: Buffer, fee?: BN, feeAssetID?: Buffer, memo?: Buffer, asOf?: BN, locktime?: BN, threshold?: number) => UnsignedTx;
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
    buildExportTx: (networkid: number, blockchainid: Buffer, amount: BN, djtxAssetID: Buffer, toAddresses: Array<Buffer>, fromAddresses: Array<Buffer>, changeAddresses?: Array<Buffer>, destinationChain?: Buffer, fee?: BN, feeAssetID?: Buffer, memo?: Buffer, asOf?: BN, locktime?: BN, threshold?: number) => UnsignedTx;
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
    buildAddDelegatorTx: (networkid: number, blockchainid: Buffer, djtxAssetID: Buffer, toAddresses: Array<Buffer>, fromAddresses: Array<Buffer>, changeAddresses: Array<Buffer>, nodeID: Buffer, startTime: BN, endTime: BN, stakeAmount: BN, rewardLocktime: BN, rewardThreshold: number, rewardAddresses: Array<Buffer>, fee?: BN, feeAssetID?: Buffer, memo?: Buffer, asOf?: BN) => UnsignedTx;
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
    buildAddValidatorTx: (networkid: number, blockchainid: Buffer, djtxAssetID: Buffer, toAddresses: Array<Buffer>, fromAddresses: Array<Buffer>, changeAddresses: Array<Buffer>, nodeID: Buffer, startTime: BN, endTime: BN, stakeAmount: BN, rewardLocktime: BN, rewardThreshold: number, rewardAddresses: Array<Buffer>, delegationFee: number, fee?: BN, feeAssetID?: Buffer, memo?: Buffer, asOf?: BN) => UnsignedTx;
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
    buildCreateSubnetTx: (networkid: number, blockchainid: Buffer, fromAddresses: Array<Buffer>, changeAddresses: Array<Buffer>, subnetOwnerAddresses: Array<Buffer>, subnetOwnerThreshold: number, fee?: BN, feeAssetID?: Buffer, memo?: Buffer, asOf?: BN) => UnsignedTx;
}
//# sourceMappingURL=utxos.d.ts.map