"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlatformVMAPI = void 0;
/**
 * @packageDocumentation
 * @module API-PlatformVM
 */
const buffer_1 = require("buffer/");
const bn_js_1 = __importDefault(require("bn.js"));
const jrpcapi_1 = require("../../common/jrpcapi");
const bintools_1 = __importDefault(require("../../utils/bintools"));
const keychain_1 = require("./keychain");
const constants_1 = require("../../utils/constants");
const constants_2 = require("./constants");
const tx_1 = require("./tx");
const payload_1 = require("../../utils/payload");
const helperfunctions_1 = require("../../utils/helperfunctions");
const utxos_1 = require("../platformvm/utxos");
/**
 * @ignore
 */
const bintools = bintools_1.default.getInstance();
/**
 * Class for interacting with a node's PlatformVMAPI
 *
 * @category RPCAPIs
 *
 * @remarks This extends the [[JRPCAPI]] class. This class should not be directly called. Instead, use the [[Dijets.addAPI]] function to register this interface with Dijets.
 */
class PlatformVMAPI extends jrpcapi_1.JRPCAPI {
    /**
     * This class should not be instantiated directly.
     * Instead use the [[Dijets.addAPI]] method.
     *
     * @param core A reference to the Dijets class
     * @param baseurl Defaults to the string "/ext/P" as the path to blockchain's baseurl
     */
    constructor(core, baseurl = '/ext/bc/P') {
        super(core, baseurl);
        /**
         * @ignore
         */
        this.keychain = new keychain_1.KeyChain('', '');
        this.blockchainID = constants_1.PlatformChainID;
        this.blockchainAlias = undefined;
        this.DJTXAssetID = undefined;
        this.txFee = undefined;
        this.creationTxFee = undefined;
        this.minValidatorStake = undefined;
        this.minDelegatorStake = undefined;
        /**
         * Gets the alias for the blockchainID if it exists, otherwise returns `undefined`.
         *
         * @returns The alias for the blockchainID
         */
        this.getBlockchainAlias = () => {
            if (typeof this.blockchainAlias === "undefined") {
                const netid = this.core.getNetworkID();
                if (netid in constants_1.Defaults.network && this.blockchainID in constants_1.Defaults.network[netid]) {
                    this.blockchainAlias = constants_1.Defaults.network[netid][this.blockchainID].alias;
                    return this.blockchainAlias;
                }
                else {
                    /* istanbul ignore next */
                    return undefined;
                }
            }
            return this.blockchainAlias;
        };
        /**
         * Sets the alias for the blockchainID.
         *
         * @param alias The alias for the blockchainID.
         *
         */
        this.setBlockchainAlias = (alias) => {
            this.blockchainAlias = alias;
            /* istanbul ignore next */
            return undefined;
        };
        /**
         * Gets the blockchainID and returns it.
         *
         * @returns The blockchainID
         */
        this.getBlockchainID = () => this.blockchainID;
        /**
         * Refresh blockchainID, and if a blockchainID is passed in, use that.
         *
         * @param Optional. BlockchainID to assign, if none, uses the default based on networkID.
         *
         * @returns The blockchainID
         */
        this.refreshBlockchainID = (blockchainID = undefined) => {
            const netid = this.core.getNetworkID();
            if (typeof blockchainID === 'undefined' && typeof constants_1.Defaults.network[netid] !== "undefined") {
                this.blockchainID = constants_1.PlatformChainID; //default to P-Chain
                return true;
            }
            if (typeof blockchainID === 'string') {
                this.blockchainID = blockchainID;
                return true;
            }
            return false;
        };
        /**
         * Takes an address string and returns its {@link https://github.com/feross/buffer|Buffer} representation if valid.
         *
         * @returns A {@link https://github.com/feross/buffer|Buffer} for the address if valid, undefined if not valid.
         */
        this.parseAddress = (addr) => {
            const alias = this.getBlockchainAlias();
            const blockchainID = this.getBlockchainID();
            return bintools.parseAddress(addr, blockchainID, alias, constants_2.PlatformVMConstants.ADDRESSLENGTH);
        };
        this.addressFromBuffer = (address) => {
            const chainid = this.getBlockchainAlias() ? this.getBlockchainAlias() : this.getBlockchainID();
            return bintools.addressToString(this.core.getHRP(), chainid, address);
        };
        /**
         * Fetches the DJTX AssetID and returns it in a Promise.
         *
         * @param refresh This function caches the response. Refresh = true will bust the cache.
         *
         * @returns The the provided string representing the DJTX AssetID
         */
        this.getDJTXAssetID = (refresh = false) => __awaiter(this, void 0, void 0, function* () {
            if (typeof this.DJTXAssetID === 'undefined' || refresh) {
                const assetID = yield this.getStakingAssetID();
                this.DJTXAssetID = bintools.cb58Decode(assetID);
            }
            return this.DJTXAssetID;
        });
        /**
         * Overrides the defaults and sets the cache to a specific DJTX AssetID
         *
         * @param djtxAssetID A cb58 string or Buffer representing the DJTX AssetID
         *
         * @returns The the provided string representing the DJTX AssetID
         */
        this.setDJTXAssetID = (djtxAssetID) => {
            if (typeof djtxAssetID === "string") {
                djtxAssetID = bintools.cb58Decode(djtxAssetID);
            }
            this.DJTXAssetID = djtxAssetID;
        };
        /**
         * Gets the default tx fee for this chain.
         *
         * @returns The default tx fee as a {@link https://github.com/indutny/bn.js/|BN}
         */
        this.getDefaultTxFee = () => {
            return this.core.getNetworkID() in constants_1.Defaults.network ? new bn_js_1.default(constants_1.Defaults.network[this.core.getNetworkID()]["P"]["txFee"]) : new bn_js_1.default(0);
        };
        /**
         * Gets the tx fee for this chain.
         *
         * @returns The tx fee as a {@link https://github.com/indutny/bn.js/|BN}
         */
        this.getTxFee = () => {
            if (typeof this.txFee === "undefined") {
                this.txFee = this.getDefaultTxFee();
            }
            return this.txFee;
        };
        /**
         * Sets the tx fee for this chain.
         *
         * @param fee The tx fee amount to set as {@link https://github.com/indutny/bn.js/|BN}
         */
        this.setTxFee = (fee) => {
            this.txFee = fee;
        };
        /**
         * Gets the default creation fee for this chain.
         *
         * @returns The default creation fee as a {@link https://github.com/indutny/bn.js/|BN}
         */
        this.getDefaultCreationTxFee = () => {
            return this.core.getNetworkID() in constants_1.Defaults.network ? new bn_js_1.default(constants_1.Defaults.network[this.core.getNetworkID()]["P"]["creationTxFee"]) : new bn_js_1.default(0);
        };
        /**
         * Gets the creation fee for this chain.
         *
         * @returns The creation fee as a {@link https://github.com/indutny/bn.js/|BN}
         */
        this.getCreationTxFee = () => {
            if (typeof this.creationTxFee === "undefined") {
                this.creationTxFee = this.getDefaultCreationTxFee();
            }
            return this.creationTxFee;
        };
        /**
         * Sets the creation fee for this chain.
         *
         * @param fee The creation fee amount to set as {@link https://github.com/indutny/bn.js/|BN}
         */
        this.setCreationTxFee = (fee) => {
            this.creationTxFee = fee;
        };
        /**
         * Gets a reference to the keychain for this class.
         *
         * @returns The instance of [[]] for this class
         */
        this.keyChain = () => this.keychain;
        /**
         * @ignore
         */
        this.newKeyChain = () => {
            // warning, overwrites the old keychain
            const alias = this.getBlockchainAlias();
            if (alias) {
                this.keychain = new keychain_1.KeyChain(this.core.getHRP(), alias);
            }
            else {
                this.keychain = new keychain_1.KeyChain(this.core.getHRP(), this.blockchainID);
            }
            return this.keychain;
        };
        /**
         * Helper function which determines if a tx is a goose egg transaction.
         *
         * @param utx An UnsignedTx
         *
         * @returns boolean true if passes goose egg test and false if fails.
         *
         * @remarks
         * A "Goose Egg Transaction" is when the fee far exceeds a reasonable amount
         */
        this.checkGooseEgg = (utx, outTotal = new bn_js_1.default(0)) => __awaiter(this, void 0, void 0, function* () {
            const djtxAssetID = yield this.getDJTXAssetID();
            let outputTotal = outTotal.gt(new bn_js_1.default(0)) ? outTotal : utx.getOutputTotal(djtxAssetID);
            const fee = utx.getBurn(djtxAssetID);
            if (fee.lte(constants_1.ONEDJTX.mul(new bn_js_1.default(10))) || fee.lte(outputTotal)) {
                return true;
            }
            else {
                return false;
            }
        });
        /**
         * Retrieves an assetID for a subnet's staking assset.
         *
         * @returns Returns a Promise<string> with cb58 encoded value of the assetID.
         */
        this.getStakingAssetID = () => __awaiter(this, void 0, void 0, function* () {
            const params = {};
            return this.callMethod('platform.getStakingAssetID', params).then((response) => (response.data.result.assetID));
        });
        /**
         * Creates a new blockchain.
         *
         * @param username The username of the Keystore user that controls the new account
         * @param password The password of the Keystore user that controls the new account
         * @param subnetID Optional. Either a {@link https://github.com/feross/buffer|Buffer} or an cb58 serialized string for the SubnetID or its alias.
         * @param vmID The ID of the Virtual Machine the blockchain runs. Can also be an alias of the Virtual Machine.
         * @param FXIDs The ids of the FXs the VM is running.
         * @param name A human-readable name for the new blockchain
         * @param genesis The base 58 (with checksum) representation of the genesis state of the new blockchain. Virtual Machines should have a static API method named buildGenesis that can be used to generate genesisData.
         *
         * @returns Promise for the unsigned transaction to create this blockchain. Must be signed by a sufficient number of the Subnet’s control keys and by the account paying the transaction fee.
         */
        this.createBlockchain = (username, password, subnetID = undefined, vmID, fxIDs, name, genesis) => __awaiter(this, void 0, void 0, function* () {
            const params = {
                username,
                password,
                fxIDs,
                vmID,
                name,
                genesisData: genesis,
            };
            if (typeof subnetID === 'string') {
                params.subnetID = subnetID;
            }
            else if (typeof subnetID !== 'undefined') {
                params.subnetID = bintools.cb58Encode(subnetID);
            }
            return this.callMethod('platform.createBlockchain', params)
                .then((response) => response.data.result.txID);
        });
        /**
         * Gets the status of a blockchain.
         *
         * @param blockchainID The blockchainID requesting a status update
         *
         * @returns Promise for a string of one of: "Validating", "Created", "Preferred", "Unknown".
         */
        this.getBlockchainStatus = (blockchainID) => __awaiter(this, void 0, void 0, function* () {
            const params = {
                blockchainID,
            };
            return this.callMethod('platform.getBlockchainStatus', params)
                .then((response) => response.data.result.status);
        });
        /**
         * Create an address in the node's keystore.
         *
         * @param username The username of the Keystore user that controls the new account
         * @param password The password of the Keystore user that controls the new account
         *
         * @returns Promise for a string of the newly created account address.
         */
        this.createAddress = (username, password) => __awaiter(this, void 0, void 0, function* () {
            const params = {
                username,
                password,
            };
            return this.callMethod('platform.createAddress', params)
                .then((response) => response.data.result.address);
        });
        /**
         * Gets the balance of a particular asset.
         *
         * @param address The address to pull the asset balance from
         *
         * @returns Promise with the balance as a {@link https://github.com/indutny/bn.js/|BN} on the provided address.
         */
        this.getBalance = (address) => __awaiter(this, void 0, void 0, function* () {
            if (typeof this.parseAddress(address) === 'undefined') {
                /* istanbul ignore next */
                throw new Error("Error - PlatformVMAPI.getBalance: Invalid address format");
            }
            const params = {
                address
            };
            return this.callMethod('platform.getBalance', params).then((response) => response.data.result);
        });
        /**
         * List the addresses controlled by the user.
         *
         * @param username The username of the Keystore user
         * @param password The password of the Keystore user
         *
         * @returns Promise for an array of addresses.
         */
        this.listAddresses = (username, password) => __awaiter(this, void 0, void 0, function* () {
            const params = {
                username,
                password,
            };
            return this.callMethod('platform.listAddresses', params)
                .then((response) => response.data.result.addresses);
        });
        /**
         * Lists the set of current validators.
         *
         * @param subnetID Optional. Either a {@link https://github.com/feross/buffer|Buffer} or an
         * cb58 serialized string for the SubnetID or its alias.
         *
         * @returns Promise for an array of validators that are currently staking, see: {@link https://docs.djtx.network/v1.0/en/api/platform/#platformgetcurrentvalidators|platform.getCurrentValidators documentation}.
         *
         */
        this.getCurrentValidators = (subnetID = undefined) => __awaiter(this, void 0, void 0, function* () {
            const params = {};
            if (typeof subnetID === 'string') {
                params.subnetID = subnetID;
            }
            else if (typeof subnetID !== 'undefined') {
                params.subnetID = bintools.cb58Encode(subnetID);
            }
            return this.callMethod('platform.getCurrentValidators', params)
                .then((response) => response.data.result);
        });
        /**
         * Lists the set of pending validators.
         *
         * @param subnetID Optional. Either a {@link https://github.com/feross/buffer|Buffer}
         * or a cb58 serialized string for the SubnetID or its alias.
         *
         * @returns Promise for an array of validators that are pending staking, see: {@link https://docs.djtx.network/v1.0/en/api/platform/#platformgetpendingvalidators|platform.getPendingValidators documentation}.
         *
         */
        this.getPendingValidators = (subnetID = undefined) => __awaiter(this, void 0, void 0, function* () {
            const params = {};
            if (typeof subnetID === 'string') {
                params.subnetID = subnetID;
            }
            else if (typeof subnetID !== 'undefined') {
                params.subnetID = bintools.cb58Encode(subnetID);
            }
            return this.callMethod('platform.getPendingValidators', params)
                .then((response) => response.data.result);
        });
        /**
         * Samples `Size` validators from the current validator set.
         *
         * @param sampleSize Of the total universe of validators, select this many at random
         * @param subnetID Optional. Either a {@link https://github.com/feross/buffer|Buffer} or an
         * cb58 serialized string for the SubnetID or its alias.
         *
         * @returns Promise for an array of validator's stakingIDs.
         */
        this.sampleValidators = (sampleSize, subnetID = undefined) => __awaiter(this, void 0, void 0, function* () {
            const params = {
                size: sampleSize.toString(),
            };
            if (typeof subnetID === 'string') {
                params.subnetID = subnetID;
            }
            else if (typeof subnetID !== 'undefined') {
                params.subnetID = bintools.cb58Encode(subnetID);
            }
            return this.callMethod('platform.sampleValidators', params)
                .then((response) => response.data.result.validators);
        });
        /**
         * Add a validator to the Primary Network.
         *
         * @param username The username of the Keystore user
         * @param password The password of the Keystore user
         * @param nodeID The node ID of the validator
         * @param startTime Javascript Date object for the start time to validate
         * @param endTime Javascript Date object for the end time to validate
         * @param stakeAmount The amount of nDJTX the validator is staking as
         * a {@link https://github.com/indutny/bn.js/|BN}
         * @param rewardAddress The address the validator reward will go to, if there is one.
         * @param delegationFeeRate Optional. A {@link https://github.com/indutny/bn.js/|BN} for the percent fee this validator
         * charges when others delegate stake to them. Up to 4 decimal places allowed; additional decimal places are ignored.
         * Must be between 0 and 100, inclusive. For example, if delegationFeeRate is 1.2345 and someone delegates to this
         * validator, then when the delegation period is over, 1.2345% of the reward goes to the validator and the rest goes
         * to the delegator.
         *
         * @returns Promise for a base58 string of the unsigned transaction.
         */
        this.addValidator = (username, password, nodeID, startTime, endTime, stakeAmount, rewardAddress, delegationFeeRate = undefined) => __awaiter(this, void 0, void 0, function* () {
            const params = {
                username,
                password,
                nodeID,
                startTime: startTime.getTime() / 1000,
                endTime: endTime.getTime() / 1000,
                stakeAmount: stakeAmount.toString(10),
                rewardAddress,
            };
            if (typeof delegationFeeRate !== 'undefined') {
                params.delegationFeeRate = delegationFeeRate.toString(10);
            }
            return this.callMethod('platform.addValidator', params)
                .then((response) => response.data.result.txID);
        });
        /**
         * Add a validator to a Subnet other than the Primary Network. The validator must validate the Primary Network for the entire duration they validate this Subnet.
         *
         * @param username The username of the Keystore user
         * @param password The password of the Keystore user
         * @param nodeID The node ID of the validator
         * @param subnetID Either a {@link https://github.com/feross/buffer|Buffer} or a cb58 serialized string for the SubnetID or its alias.
         * @param startTime Javascript Date object for the start time to validate
         * @param endTime Javascript Date object for the end time to validate
         * @param weight The validator’s weight used for sampling
         *
         * @returns Promise for the unsigned transaction. It must be signed (using sign) by the proper number of the Subnet’s control keys and by the key of the account paying the transaction fee before it can be issued.
         */
        this.addSubnetValidator = (username, password, nodeID, subnetID, startTime, endTime, weight) => __awaiter(this, void 0, void 0, function* () {
            const params = {
                username,
                password,
                nodeID,
                startTime: startTime.getTime() / 1000,
                endTime: endTime.getTime() / 1000,
                weight
            };
            if (typeof subnetID === 'string') {
                params.subnetID = subnetID;
            }
            else if (typeof subnetID !== 'undefined') {
                params.subnetID = bintools.cb58Encode(subnetID);
            }
            return this.callMethod('platform.addSubnetValidator', params)
                .then((response) => response.data.result.txID);
        });
        /**
         * Add a delegator to the Primary Network.
         *
         * @param username The username of the Keystore user
         * @param password The password of the Keystore user
         * @param nodeID The node ID of the delegatee
         * @param startTime Javascript Date object for when the delegator starts delegating
         * @param endTime Javascript Date object for when the delegator starts delegating
         * @param stakeAmount The amount of nDJTX the delegator is staking as
         * a {@link https://github.com/indutny/bn.js/|BN}
         * @param rewardAddress The address of the account the staked DJTX and validation reward
         * (if applicable) are sent to at endTime
         *
         * @returns Promise for an array of validator's stakingIDs.
         */
        this.addDelegator = (username, password, nodeID, startTime, endTime, stakeAmount, rewardAddress) => __awaiter(this, void 0, void 0, function* () {
            const params = {
                username,
                password,
                nodeID,
                startTime: startTime.getTime() / 1000,
                endTime: endTime.getTime() / 1000,
                stakeAmount: stakeAmount.toString(10),
                rewardAddress,
            };
            return this.callMethod('platform.addDelegator', params)
                .then((response) => response.data.result.txID);
        });
        /**
         * Create an unsigned transaction to create a new Subnet. The unsigned transaction must be
         * signed with the key of the account paying the transaction fee. The Subnet’s ID is the ID of the transaction that creates it (ie the response from issueTx when issuing the signed transaction).
         *
         * @param username The username of the Keystore user
         * @param password The password of the Keystore user
         * @param controlKeys Array of platform addresses as strings
         * @param threshold To add a validator to this Subnet, a transaction must have threshold
         * signatures, where each signature is from a key whose address is an element of `controlKeys`
         *
         * @returns Promise for a string with the unsigned transaction encoded as base58.
         */
        this.createSubnet = (username, password, controlKeys, threshold) => __awaiter(this, void 0, void 0, function* () {
            const params = {
                username,
                password,
                controlKeys,
                threshold
            };
            return this.callMethod('platform.createSubnet', params)
                .then((response) => response.data.result.txID);
        });
        /**
         * Get the Subnet that validates a given blockchain.
         *
         * @param blockchainID Either a {@link https://github.com/feross/buffer|Buffer} or a cb58
         * encoded string for the blockchainID or its alias.
         *
         * @returns Promise for a string of the subnetID that validates the blockchain.
         */
        this.validatedBy = (blockchainID) => __awaiter(this, void 0, void 0, function* () {
            const params = {
                blockchainID,
            };
            return this.callMethod('platform.validatedBy', params)
                .then((response) => response.data.result.subnetID);
        });
        /**
         * Get the IDs of the blockchains a Subnet validates.
         *
         * @param subnetID Either a {@link https://github.com/feross/buffer|Buffer} or an DJTX
         * serialized string for the SubnetID or its alias.
         *
         * @returns Promise for an array of blockchainIDs the subnet validates.
         */
        this.validates = (subnetID) => __awaiter(this, void 0, void 0, function* () {
            const params = {
                subnetID,
            };
            if (typeof subnetID === 'string') {
                params.subnetID = subnetID;
            }
            else if (typeof subnetID !== 'undefined') {
                params.subnetID = bintools.cb58Encode(subnetID);
            }
            return this.callMethod('platform.validates', params)
                .then((response) => response.data.result.blockchainIDs);
        });
        /**
         * Get all the blockchains that exist (excluding the P-Chain).
         *
         * @returns Promise for an array of objects containing fields "id", "subnetID", and "vmID".
         */
        this.getBlockchains = () => __awaiter(this, void 0, void 0, function* () {
            const params = {};
            return this.callMethod('platform.getBlockchains', params)
                .then((response) => response.data.result.blockchains);
        });
        /**
         * Send DJTX from an account on the P-Chain to an address on the X-Chain. This transaction
         * must be signed with the key of the account that the DJTX is sent from and which pays the
         * transaction fee. After issuing this transaction, you must call the X-Chain’s importDJTX
         * method to complete the transfer.
         *
         * @param username The Keystore user that controls the account specified in `to`
         * @param password The password of the Keystore user
         * @param to The address on the X-Chain to send the DJTX to. Do not include X- in the address
         * @param amount Amount of DJTX to export as a {@link https://github.com/indutny/bn.js/|BN}
         *
         * @returns Promise for an unsigned transaction to be signed by the account the the DJTX is
         * sent from and pays the transaction fee.
         */
        this.exportDJTX = (username, password, amount, to) => __awaiter(this, void 0, void 0, function* () {
            const params = {
                username,
                password,
                to,
                amount: amount.toString(10)
            };
            return this.callMethod('platform.exportDJTX', params)
                .then((response) => response.data.result.txID);
        });
        /**
         * Send DJTX from an account on the P-Chain to an address on the X-Chain. This transaction
         * must be signed with the key of the account that the DJTX is sent from and which pays
         * the transaction fee. After issuing this transaction, you must call the X-Chain’s
         * importDJTX method to complete the transfer.
         *
         * @param username The Keystore user that controls the account specified in `to`
         * @param password The password of the Keystore user
         * @param to The ID of the account the DJTX is sent to. This must be the same as the to
         * argument in the corresponding call to the X-Chain’s exportDJTX
         * @param sourceChain The chainID where the funds are coming from.
         *
         * @returns Promise for a string for the transaction, which should be sent to the network
         * by calling issueTx.
         */
        this.importDJTX = (username, password, to, sourceChain) => __awaiter(this, void 0, void 0, function* () {
            const params = {
                to,
                sourceChain,
                username,
                password,
            };
            return this.callMethod('platform.importDJTX', params)
                .then((response) => response.data.result.txID);
        });
        /**
         * Calls the node's issueTx method from the API and returns the resulting transaction ID as a string.
         *
         * @param tx A string, {@link https://github.com/feross/buffer|Buffer}, or [[Tx]] representing a transaction
         *
         * @returns A Promise<string> representing the transaction ID of the posted transaction.
         */
        this.issueTx = (tx) => __awaiter(this, void 0, void 0, function* () {
            let Transaction = '';
            if (typeof tx === 'string') {
                Transaction = tx;
            }
            else if (tx instanceof buffer_1.Buffer) {
                const txobj = new tx_1.Tx();
                txobj.fromBuffer(tx);
                Transaction = txobj.toString();
            }
            else if (tx instanceof tx_1.Tx) {
                Transaction = tx.toString();
            }
            else {
                /* istanbul ignore next */
                throw new Error('Error - platform.issueTx: provided tx is not expected type of string, Buffer, or Tx');
            }
            const params = {
                tx: Transaction.toString(),
            };
            return this.callMethod('platform.issueTx', params).then((response) => response.data.result.txID);
        });
        /**
         * Returns an upper bound on the amount of tokens that exist. Not monotonically increasing because this number can go down if a staker's reward is denied.
         */
        this.getCurrentSupply = () => __awaiter(this, void 0, void 0, function* () {
            const params = {};
            return this.callMethod('platform.getCurrentSupply', params)
                .then((response) => new bn_js_1.default(response.data.result.supply, 10));
        });
        /**
         * Returns the height of the platform chain.
         */
        this.getHeight = () => __awaiter(this, void 0, void 0, function* () {
            const params = {};
            return this.callMethod('platform.getHeight', params)
                .then((response) => new bn_js_1.default(response.data.result.height, 10));
        });
        /**
         * Gets the minimum staking amount.
         *
         * @param refresh A boolean to bypass the local cached value of Minimum Stake Amount, polling the node instead.
         */
        this.getMinStake = (refresh = false) => __awaiter(this, void 0, void 0, function* () {
            if (refresh !== true && typeof this.minValidatorStake !== "undefined" && typeof this.minDelegatorStake !== "undefined") {
                return {
                    minValidatorStake: this.minValidatorStake,
                    minDelegatorStake: this.minDelegatorStake
                };
            }
            const params = {};
            return this.callMethod('platform.getMinStake', params)
                .then((response) => {
                this.minValidatorStake = new bn_js_1.default(response.data.result.minValidatorStake, 10);
                this.minDelegatorStake = new bn_js_1.default(response.data.result.minDelegatorStake, 10);
                return {
                    minValidatorStake: this.minValidatorStake,
                    minDelegatorStake: this.minDelegatorStake
                };
            });
        });
        /**
         * Sets the minimum stake cached in this class.
         * @param minValidatorStake A {@link https://github.com/indutny/bn.js/|BN} to set the minimum stake amount cached in this class.
         * @param minDelegatorStake A {@link https://github.com/indutny/bn.js/|BN} to set the minimum delegation amount cached in this class.
         */
        this.setMinStake = (minValidatorStake = undefined, minDelegatorStake = undefined) => {
            if (typeof minValidatorStake !== "undefined") {
                this.minValidatorStake = minValidatorStake;
            }
            if (typeof minDelegatorStake !== "undefined") {
                this.minDelegatorStake = minDelegatorStake;
            }
        };
        /**
         * Gets the total amount staked for an array of addresses.
         */
        this.getStake = (addresses) => __awaiter(this, void 0, void 0, function* () {
            const params = {
                addresses
            };
            return this.callMethod('platform.getStake', params)
                .then((response) => new bn_js_1.default(response.data.result.staked, 10));
        });
        /**
         * Get all the subnets that exist.
         *
         * @param ids IDs of the subnets to retrieve information about. If omitted, gets all subnets
         *
         * @returns Promise for an array of objects containing fields "id",
         * "controlKeys", and "threshold".
         */
        this.getSubnets = (ids = undefined) => __awaiter(this, void 0, void 0, function* () {
            const params = {};
            if (typeof ids !== undefined) {
                params.ids = ids;
            }
            return this.callMethod('platform.getSubnets', params)
                .then((response) => response.data.result.subnets);
        });
        /**
         * Exports the private key for an address.
         *
         * @param username The name of the user with the private key
         * @param password The password used to decrypt the private key
         * @param address The address whose private key should be exported
         *
         * @returns Promise with the decrypted private key as store in the database
         */
        this.exportKey = (username, password, address) => __awaiter(this, void 0, void 0, function* () {
            const params = {
                username,
                password,
                address,
            };
            return this.callMethod('platform.exportKey', params)
                .then((response) => response.data.result.privateKey);
        });
        /**
         * Give a user control over an address by providing the private key that controls the address.
         *
         * @param username The name of the user to store the private key
         * @param password The password that unlocks the user
         * @param privateKey A string representing the private key in the vm's format
         *
         * @returns The address for the imported private key.
         */
        this.importKey = (username, password, privateKey) => __awaiter(this, void 0, void 0, function* () {
            const params = {
                username,
                password,
                privateKey,
            };
            return this.callMethod('platform.importKey', params)
                .then((response) => response.data.result.address);
        });
        /**
         * Returns the treansaction data of a provided transaction ID by calling the node's `getTx` method.
         *
         * @param txid The string representation of the transaction ID
         *
         * @returns Returns a Promise<string> containing the bytes retrieved from the node
         */
        this.getTx = (txid) => __awaiter(this, void 0, void 0, function* () {
            const params = {
                txID: txid,
            };
            return this.callMethod('platform.getTx', params).then((response) => response.data.result.tx);
        });
        /**
         * Returns the status of a provided transaction ID by calling the node's `getTxStatus` method.
         *
         * @param txid The string representation of the transaction ID
         * @param includeReason Return the reason tx was dropped, if applicable. Defaults to true
         *
         * @returns Returns a Promise<string> containing the status retrieved from the node and the reason a tx was dropped, if applicable.
         */
        this.getTxStatus = (txid, includeReason = true) => __awaiter(this, void 0, void 0, function* () {
            const params = {
                txID: txid,
                includeReason: includeReason
            };
            return this.callMethod('platform.getTxStatus', params).then((response) => response.data.result);
        });
        /**
         * Retrieves the UTXOs related to the addresses provided from the node's `getUTXOs` method.
         *
         * @param addresses An array of addresses as cb58 strings or addresses as {@link https://github.com/feross/buffer|Buffer}s
         * @param sourceChain A string for the chain to look for the UTXO's. Default is to use this chain, but if exported UTXOs exist from other chains, this can used to pull them instead.
         * @param limit Optional. Returns at most [limit] addresses. If [limit] == 0 or > [maxUTXOsToFetch], fetches up to [maxUTXOsToFetch].
         * @param startIndex Optional. [StartIndex] defines where to start fetching UTXOs (for pagination.)
         * UTXOs fetched are from addresses equal to or greater than [StartIndex.Address]
         * For address [StartIndex.Address], only UTXOs with IDs greater than [StartIndex.Utxo] will be returned.
         * @param persistOpts Options available to persist these UTXOs in local storage
         *
         * @remarks
         * persistOpts is optional and must be of type [[PersistanceOptions]]
         *
         */
        this.getUTXOs = (addresses, sourceChain = undefined, limit = 0, startIndex = undefined, persistOpts = undefined) => __awaiter(this, void 0, void 0, function* () {
            if (typeof addresses === "string") {
                addresses = [addresses];
            }
            const params = {
                addresses: addresses,
                limit
            };
            if (typeof startIndex !== "undefined" && startIndex) {
                params.startIndex = startIndex;
            }
            if (typeof sourceChain !== "undefined") {
                params.sourceChain = sourceChain;
            }
            return this.callMethod('platform.getUTXOs', params).then((response) => {
                const utxos = new utxos_1.UTXOSet();
                let data = response.data.result.utxos;
                if (persistOpts && typeof persistOpts === 'object') {
                    if (this.db.has(persistOpts.getName())) {
                        const selfArray = this.db.get(persistOpts.getName());
                        if (Array.isArray(selfArray)) {
                            utxos.addArray(data);
                            const self = new utxos_1.UTXOSet();
                            self.addArray(selfArray);
                            self.mergeByRule(utxos, persistOpts.getMergeRule());
                            data = self.getAllUTXOStrings();
                        }
                    }
                    this.db.set(persistOpts.getName(), data, persistOpts.getOverwrite());
                }
                utxos.addArray(data, false);
                response.data.result.utxos = utxos;
                response.data.result.numFetched = parseInt(response.data.result.numFetched);
                return response.data.result;
            });
        });
        /**
         * Helper function which creates an unsigned Import Tx. For more granular control, you may create your own
         * [[UnsignedTx]] manually (with their corresponding [[TransferableInput]]s, [[TransferableOutput]]s, and [[TransferOperation]]s).
         *
         * @param utxoset A set of UTXOs that the transaction is built on
         * @param ownerAddresses The addresses being used to import
         * @param sourceChain The chainid for where the import is coming from.
         * @param toAddresses The addresses to send the funds
         * @param fromAddresses The addresses being used to send the funds from the UTXOs provided
         * @param changeAddresses The addresses that can spend the change remaining from the spent UTXOs
         * @param memo Optional contains arbitrary bytes, up to 256 bytes
         * @param asOf Optional. The timestamp to verify the transaction against as a {@link https://github.com/indutny/bn.js/|BN}
         * @param locktime Optional. The locktime field created in the resulting outputs
         * @param threshold Optional. The number of signatures required to spend the funds in the resultant UTXO
         *
         * @returns An unsigned transaction ([[UnsignedTx]]) which contains a [[ImportTx]].
         *
         * @remarks
         * This helper exists because the endpoint API should be the primary point of entry for most functionality.
         */
        this.buildImportTx = (utxoset, ownerAddresses, sourceChain, toAddresses, fromAddresses, changeAddresses = undefined, memo = undefined, asOf = helperfunctions_1.UnixNow(), locktime = new bn_js_1.default(0), threshold = 1) => __awaiter(this, void 0, void 0, function* () {
            const to = this._cleanAddressArray(toAddresses, 'buildBaseTx').map((a) => bintools.stringToAddress(a));
            const from = this._cleanAddressArray(fromAddresses, 'buildBaseTx').map((a) => bintools.stringToAddress(a));
            const change = this._cleanAddressArray(changeAddresses, 'buildBaseTx').map((a) => bintools.stringToAddress(a));
            let srcChain = undefined;
            if (typeof sourceChain === "undefined") {
                throw new Error("Error - PlatformVMAPI.buildImportTx: Source ChainID is undefined.");
            }
            else if (typeof sourceChain === "string") {
                srcChain = sourceChain;
                sourceChain = bintools.cb58Decode(sourceChain);
            }
            else if (!(sourceChain instanceof buffer_1.Buffer)) {
                srcChain = bintools.cb58Encode(sourceChain);
                throw new Error("Error - PlatformVMAPI.buildImportTx: Invalid destinationChain type: " + (typeof sourceChain));
            }
            const atomicUTXOs = yield (yield this.getUTXOs(ownerAddresses, srcChain, 0, undefined)).utxos;
            const djtxAssetID = yield this.getDJTXAssetID();
            if (memo instanceof payload_1.PayloadBase) {
                memo = memo.getPayload();
            }
            const atomics = atomicUTXOs.getAllUTXOs();
            const builtUnsignedTx = utxoset.buildImportTx(this.core.getNetworkID(), bintools.cb58Decode(this.blockchainID), to, from, change, atomics, sourceChain, this.getTxFee(), djtxAssetID, memo, asOf, locktime, threshold);
            if (!(yield this.checkGooseEgg(builtUnsignedTx))) {
                /* istanbul ignore next */
                throw new Error("Failed Goose Egg Check");
            }
            return builtUnsignedTx;
        });
        /**
         * Helper function which creates an unsigned Export Tx. For more granular control, you may create your own
         * [[UnsignedTx]] manually (with their corresponding [[TransferableInput]]s, [[TransferableOutput]]s, and [[TransferOperation]]s).
         *
         * @param utxoset A set of UTXOs that the transaction is built on
         * @param amount The amount being exported as a {@link https://github.com/indutny/bn.js/|BN}
         * @param destinationChain The chainid for where the assets will be sent.
         * @param toAddresses The addresses to send the funds
         * @param fromAddresses The addresses being used to send the funds from the UTXOs provided
         * @param changeAddresses The addresses that can spend the change remaining from the spent UTXOs
         * @param memo Optional contains arbitrary bytes, up to 256 bytes
         * @param asOf Optional. The timestamp to verify the transaction against as a {@link https://github.com/indutny/bn.js/|BN}
         * @param locktime Optional. The locktime field created in the resulting outputs
         * @param threshold Optional. The number of signatures required to spend the funds in the resultant UTXO
         *
         * @returns An unsigned transaction ([[UnsignedTx]]) which contains an [[ExportTx]].
         */
        this.buildExportTx = (utxoset, amount, destinationChain, toAddresses, fromAddresses, changeAddresses = undefined, memo = undefined, asOf = helperfunctions_1.UnixNow(), locktime = new bn_js_1.default(0), threshold = 1) => __awaiter(this, void 0, void 0, function* () {
            let prefixes = {};
            toAddresses.map((a) => {
                prefixes[a.split("-")[0]] = true;
            });
            if (Object.keys(prefixes).length !== 1) {
                throw new Error("Error - PlatformVMAPI.buildExportTx: To addresses must have the same chainID prefix.");
            }
            if (typeof destinationChain === "undefined") {
                throw new Error("Error - PlatformVMAPI.buildExportTx: Destination ChainID is undefined.");
            }
            else if (typeof destinationChain === "string") {
                destinationChain = bintools.cb58Decode(destinationChain); //
            }
            else if (!(destinationChain instanceof buffer_1.Buffer)) {
                throw new Error("Error - PlatformVMAPI.buildExportTx: Invalid destinationChain type: " + (typeof destinationChain));
            }
            if (destinationChain.length !== 32) {
                throw new Error("Error - PlatformVMAPI.buildExportTx: Destination ChainID must be 32 bytes in length.");
            }
            /*
            if(bintools.cb58Encode(destinationChain) !== Defaults.network[this.core.getNetworkID()].X["blockchainID"]) {
              throw new Error("Error - PlatformVMAPI.buildExportTx: Destination ChainID must The X-Chain ID in the current version of DijetsJS.");
            }*/
            let to = [];
            toAddresses.map((a) => {
                to.push(bintools.stringToAddress(a));
            });
            const from = this._cleanAddressArray(fromAddresses, 'buildExportTx').map((a) => bintools.stringToAddress(a));
            const change = this._cleanAddressArray(changeAddresses, 'buildExportTx').map((a) => bintools.stringToAddress(a));
            if (memo instanceof payload_1.PayloadBase) {
                memo = memo.getPayload();
            }
            const djtxAssetID = yield this.getDJTXAssetID();
            const builtUnsignedTx = utxoset.buildExportTx(this.core.getNetworkID(), bintools.cb58Decode(this.blockchainID), amount, djtxAssetID, to, from, change, destinationChain, this.getTxFee(), djtxAssetID, memo, asOf, locktime, threshold);
            if (!(yield this.checkGooseEgg(builtUnsignedTx))) {
                /* istanbul ignore next */
                throw new Error("Failed Goose Egg Check");
            }
            return builtUnsignedTx;
        });
        /**
        * Helper function which creates an unsigned [[AddSubnetValidatorTx]]. For more granular control, you may create your own
        * [[UnsignedTx]] manually and import the [[AddSubnetValidatorTx]] class directly.
        *
        * @param utxoset A set of UTXOs that the transaction is built on.
        * @param fromAddresses An array of addresses as {@link https://github.com/feross/buffer|Buffer} who pays the fees in DJTX
        * @param changeAddresses An array of addresses as {@link https://github.com/feross/buffer|Buffer} who gets the change leftover from the fee payment
        * @param nodeID The node ID of the validator being added.
        * @param startTime The Unix time when the validator starts validating the Primary Network.
        * @param endTime The Unix time when the validator stops validating the Primary Network (and staked DJTX is returned).
        * @param weight The amount of weight for this subnet validator.
        * @param memo Optional contains arbitrary bytes, up to 256 bytes
        * @param asOf Optional. The timestamp to verify the transaction against as a {@link https://github.com/indutny/bn.js/|BN}
        *
        * @returns An unsigned transaction created from the passed in parameters.
        */
        /* Re-implement when subnetValidator signing process is clearer
        buildAddSubnetValidatorTx = async (
          utxoset:UTXOSet,
          fromAddresses:Array<string>,
          changeAddresses:Array<string>,
          nodeID:string,
          startTime:BN,
          endTime:BN,
          weight:BN,
          memo:PayloadBase|Buffer = undefined,
          asOf:BN = UnixNow()
        ):Promise<UnsignedTx> => {
          const from:Array<Buffer> = this._cleanAddressArray(fromAddresses, 'buildAddSubnetValidatorTx').map((a) => bintools.stringToAddress(a));
          const change:Array<Buffer> = this._cleanAddressArray(changeAddresses, 'buildAddSubnetValidatorTx').map((a) => bintools.stringToAddress(a));
      
          if( memo instanceof PayloadBase) {
            memo = memo.getPayload();
          }
      
          const djtxAssetID:Buffer = await this.getDJTXAssetID();
          
          const now:BN = UnixNow();
          if (startTime.lt(now) || endTime.lte(startTime)) {
            throw new Error("PlatformVMAPI.buildAddSubnetValidatorTx -- startTime must be in the future and endTime must come after startTime");
          }
      
          const builtUnsignedTx:UnsignedTx = utxoset.buildAddSubnetValidatorTx(
            this.core.getNetworkID(),
            bintools.cb58Decode(this.blockchainID),
            from,
            change,
            NodeIDStringToBuffer(nodeID),
            startTime, endTime,
            weight,
            this.getFee(),
            djtxAssetID,
            memo, asOf
          );
      
          if(! await this.checkGooseEgg(builtUnsignedTx)) {
            /* istanbul ignore next */ /*
        throw new Error("Failed Goose Egg Check");
      }
  
      return builtUnsignedTx;
    }
  
    */
        /**
        * Helper function which creates an unsigned [[AddDelegatorTx]]. For more granular control, you may create your own
        * [[UnsignedTx]] manually and import the [[AddDelegatorTx]] class directly.
        *
        * @param utxoset A set of UTXOs that the transaction is built on
        * @param toAddresses An array of addresses as {@link https://github.com/feross/buffer|Buffer} who recieved the staked tokens at the end of the staking period
        * @param fromAddresses An array of addresses as {@link https://github.com/feross/buffer|Buffer} who own the staking UTXOs the fees in DJTX
        * @param changeAddresses An array of addresses as {@link https://github.com/feross/buffer|Buffer} who gets the change leftover from the fee payment
        * @param nodeID The node ID of the validator being added.
        * @param startTime The Unix time when the validator starts validating the Primary Network.
        * @param endTime The Unix time when the validator stops validating the Primary Network (and staked DJTX is returned).
        * @param stakeAmount The amount being delegated as a {@link https://github.com/indutny/bn.js/|BN}
        * @param rewardAddresses The addresses which will recieve the rewards from the delegated stake.
        * @param rewardLocktime Optional. The locktime field created in the resulting reward outputs
        * @param rewardThreshold Opional. The number of signatures required to spend the funds in the resultant reward UTXO. Default 1.
        * @param memo Optional contains arbitrary bytes, up to 256 bytes
        * @param asOf Optional. The timestamp to verify the transaction against as a {@link https://github.com/indutny/bn.js/|BN}
        *
        * @returns An unsigned transaction created from the passed in parameters.
        */
        this.buildAddDelegatorTx = (utxoset, toAddresses, fromAddresses, changeAddresses, nodeID, startTime, endTime, stakeAmount, rewardAddresses, rewardLocktime = new bn_js_1.default(0), rewardThreshold = 1, memo = undefined, asOf = helperfunctions_1.UnixNow()) => __awaiter(this, void 0, void 0, function* () {
            const to = this._cleanAddressArray(toAddresses, 'buildAddDelegatorTx').map((a) => bintools.stringToAddress(a));
            const from = this._cleanAddressArray(fromAddresses, 'buildAddDelegatorTx').map((a) => bintools.stringToAddress(a));
            const change = this._cleanAddressArray(changeAddresses, 'buildAddDelegatorTx').map((a) => bintools.stringToAddress(a));
            const rewards = this._cleanAddressArray(rewardAddresses, 'buildAddValidatorTx').map((a) => bintools.stringToAddress(a));
            if (memo instanceof payload_1.PayloadBase) {
                memo = memo.getPayload();
            }
            const minStake = (yield this.getMinStake())["minDelegatorStake"];
            if (stakeAmount.lt(minStake)) {
                throw new Error("PlatformVMAPI.buildAddDelegatorTx -- stake amount must be at least " + minStake.toString(10));
            }
            const djtxAssetID = yield this.getDJTXAssetID();
            const now = helperfunctions_1.UnixNow();
            if (startTime.lt(now) || endTime.lte(startTime)) {
                throw new Error("PlatformVMAPI.buildAddDelegatorTx -- startTime must be in the future and endTime must come after startTime");
            }
            const builtUnsignedTx = utxoset.buildAddDelegatorTx(this.core.getNetworkID(), bintools.cb58Decode(this.blockchainID), djtxAssetID, to, from, change, helperfunctions_1.NodeIDStringToBuffer(nodeID), startTime, endTime, stakeAmount, rewardLocktime, rewardThreshold, rewards, new bn_js_1.default(0), djtxAssetID, memo, asOf);
            if (!(yield this.checkGooseEgg(builtUnsignedTx))) {
                /* istanbul ignore next */
                throw new Error("Failed Goose Egg Check");
            }
            return builtUnsignedTx;
        });
        /**
        * Helper function which creates an unsigned [[AddValidatorTx]]. For more granular control, you may create your own
        * [[UnsignedTx]] manually and import the [[AddValidatorTx]] class directly.
        *
        * @param utxoset A set of UTXOs that the transaction is built on
        * @param toAddresses An array of addresses as {@link https://github.com/feross/buffer|Buffer} who recieved the staked tokens at the end of the staking period
        * @param fromAddresses An array of addresses as {@link https://github.com/feross/buffer|Buffer} who own the staking UTXOs the fees in DJTX
        * @param changeAddresses An array of addresses as {@link https://github.com/feross/buffer|Buffer} who gets the change leftover from the fee payment
        * @param nodeID The node ID of the validator being added.
        * @param startTime The Unix time when the validator starts validating the Primary Network.
        * @param endTime The Unix time when the validator stops validating the Primary Network (and staked DJTX is returned).
        * @param stakeAmount The amount being delegated as a {@link https://github.com/indutny/bn.js/|BN}
        * @param rewardAddresses The addresses which will recieve the rewards from the delegated stake.
        * @param delegationFee A number for the percentage of reward to be given to the validator when someone delegates to them. Must be between 0 and 100.
        * @param rewardLocktime Optional. The locktime field created in the resulting reward outputs
        * @param rewardThreshold Opional. The number of signatures required to spend the funds in the resultant reward UTXO. Default 1.
        * @param memo Optional contains arbitrary bytes, up to 256 bytes
        * @param asOf Optional. The timestamp to verify the transaction against as a {@link https://github.com/indutny/bn.js/|BN}
        *
        * @returns An unsigned transaction created from the passed in parameters.
        */
        this.buildAddValidatorTx = (utxoset, toAddresses, fromAddresses, changeAddresses, nodeID, startTime, endTime, stakeAmount, rewardAddresses, delegationFee, rewardLocktime = new bn_js_1.default(0), rewardThreshold = 1, memo = undefined, asOf = helperfunctions_1.UnixNow()) => __awaiter(this, void 0, void 0, function* () {
            const to = this._cleanAddressArray(toAddresses, 'buildAddValidatorTx').map((a) => bintools.stringToAddress(a));
            const from = this._cleanAddressArray(fromAddresses, 'buildAddValidatorTx').map((a) => bintools.stringToAddress(a));
            const change = this._cleanAddressArray(changeAddresses, 'buildAddValidatorTx').map((a) => bintools.stringToAddress(a));
            const rewards = this._cleanAddressArray(rewardAddresses, 'buildAddValidatorTx').map((a) => bintools.stringToAddress(a));
            if (memo instanceof payload_1.PayloadBase) {
                memo = memo.getPayload();
            }
            const minStake = (yield this.getMinStake())["minValidatorStake"];
            if (stakeAmount.lt(minStake)) {
                throw new Error("PlatformVMAPI.buildAddValidatorTx -- stake amount must be at least " + minStake.toString(10));
            }
            if (typeof delegationFee !== "number" || delegationFee > 100 || delegationFee < 0) {
                throw new Error("PlatformVMAPI.buildAddValidatorTx -- delegationFee must be a number between 0 and 100");
            }
            const djtxAssetID = yield this.getDJTXAssetID();
            const now = helperfunctions_1.UnixNow();
            if (startTime.lt(now) || endTime.lte(startTime)) {
                throw new Error("PlatformVMAPI.buildAddValidatorTx -- startTime must be in the future and endTime must come after startTime");
            }
            const builtUnsignedTx = utxoset.buildAddValidatorTx(this.core.getNetworkID(), bintools.cb58Decode(this.blockchainID), djtxAssetID, to, from, change, helperfunctions_1.NodeIDStringToBuffer(nodeID), startTime, endTime, stakeAmount, rewardLocktime, rewardThreshold, rewards, delegationFee, new bn_js_1.default(0), djtxAssetID, memo, asOf);
            if (!(yield this.checkGooseEgg(builtUnsignedTx))) {
                /* istanbul ignore next */
                throw new Error("Failed Goose Egg Check");
            }
            return builtUnsignedTx;
        });
        /**
          * Class representing an unsigned [[CreateSubnetTx]] transaction.
          *
          * @param utxoset A set of UTXOs that the transaction is built on
          * @param fromAddresses The addresses being used to send the funds from the UTXOs {@link https://github.com/feross/buffer|Buffer}
          * @param changeAddresses The addresses that can spend the change remaining from the spent UTXOs
          * @param subnetOwnerAddresses An array of addresses for owners of the new subnet
          * @param subnetOwnerThreshold A number indicating the amount of signatures required to add validators to a subnet
          * @param memo Optional contains arbitrary bytes, up to 256 bytes
          * @param asOf Optional. The timestamp to verify the transaction against as a {@link https://github.com/indutny/bn.js/|BN}
          *
          * @returns An unsigned transaction created from the passed in parameters.
          */
        this.buildCreateSubnetTx = (utxoset, fromAddresses, changeAddresses, subnetOwnerAddresses, subnetOwnerThreshold, memo = undefined, asOf = helperfunctions_1.UnixNow()) => __awaiter(this, void 0, void 0, function* () {
            const from = this._cleanAddressArray(fromAddresses, 'buildCreateSubnetTx').map((a) => bintools.stringToAddress(a));
            const change = this._cleanAddressArray(changeAddresses, 'buildCreateSubnetTx').map((a) => bintools.stringToAddress(a));
            const owners = this._cleanAddressArray(subnetOwnerAddresses, 'buildCreateSubnetTx').map((a) => bintools.stringToAddress(a));
            if (memo instanceof payload_1.PayloadBase) {
                memo = memo.getPayload();
            }
            const djtxAssetID = yield this.getDJTXAssetID();
            const builtUnsignedTx = utxoset.buildCreateSubnetTx(this.core.getNetworkID(), bintools.cb58Decode(this.blockchainID), from, change, owners, subnetOwnerThreshold, this.getCreationTxFee(), djtxAssetID, memo, asOf);
            if (!(yield this.checkGooseEgg(builtUnsignedTx, this.getCreationTxFee()))) {
                /* istanbul ignore next */
                throw new Error("Failed Goose Egg Check");
            }
            return builtUnsignedTx;
        });
        this.blockchainID = constants_1.PlatformChainID;
        const netid = core.getNetworkID();
        if (netid in constants_1.Defaults.network && this.blockchainID in constants_1.Defaults.network[netid]) {
            const { alias } = constants_1.Defaults.network[netid][this.blockchainID];
            this.keychain = new keychain_1.KeyChain(this.core.getHRP(), alias);
        }
        else {
            this.keychain = new keychain_1.KeyChain(this.core.getHRP(), this.blockchainID);
        }
    }
    /**
     * @ignore
     */
    _cleanAddressArray(addresses, caller) {
        const addrs = [];
        const chainid = this.getBlockchainAlias() ? this.getBlockchainAlias() : this.getBlockchainID();
        if (addresses && addresses.length > 0) {
            for (let i = 0; i < addresses.length; i++) {
                if (typeof addresses[i] === 'string') {
                    if (typeof this.parseAddress(addresses[i]) === 'undefined') {
                        /* istanbul ignore next */
                        throw new Error("Error - Invalid address format");
                    }
                    addrs.push(addresses[i]);
                }
                else {
                    addrs.push(bintools.addressToString(this.core.getHRP(), chainid, addresses[i]));
                }
            }
        }
        return addrs;
    }
}
exports.PlatformVMAPI = PlatformVMAPI;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBpLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vc3JjL2FwaXMvcGxhdGZvcm12bS9hcGkudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7O0FBQUE7OztHQUdHO0FBQ0gsb0NBQWlDO0FBQ2pDLGtEQUF1QjtBQUV2QixrREFBK0M7QUFFL0Msb0VBQTRDO0FBQzVDLHlDQUFzQztBQUN0QyxxREFBMkU7QUFDM0UsMkNBQWtEO0FBQ2xELDZCQUFzQztBQUN0QyxpREFBa0Q7QUFDbEQsaUVBQTRFO0FBQzVFLCtDQUE4QztBQUc5Qzs7R0FFRztBQUNILE1BQU0sUUFBUSxHQUFZLGtCQUFRLENBQUMsV0FBVyxFQUFFLENBQUM7QUFFakQ7Ozs7OztHQU1HO0FBQ0gsTUFBYSxhQUFjLFNBQVEsaUJBQU87SUEyMkN4Qzs7Ozs7O09BTUc7SUFDSCxZQUFZLElBQWtCLEVBQUUsVUFBaUIsV0FBVztRQUMxRCxLQUFLLENBQUMsSUFBSSxFQUFFLE9BQU8sQ0FBQyxDQUFDO1FBajNDdkI7O1dBRUc7UUFDTyxhQUFRLEdBQVksSUFBSSxtQkFBUSxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQztRQUV6QyxpQkFBWSxHQUFVLDJCQUFlLENBQUM7UUFFdEMsb0JBQWUsR0FBVSxTQUFTLENBQUM7UUFFbkMsZ0JBQVcsR0FBVSxTQUFTLENBQUM7UUFFL0IsVUFBSyxHQUFNLFNBQVMsQ0FBQztRQUVyQixrQkFBYSxHQUFNLFNBQVMsQ0FBQztRQUU3QixzQkFBaUIsR0FBTSxTQUFTLENBQUM7UUFFakMsc0JBQWlCLEdBQU0sU0FBUyxDQUFDO1FBRTNDOzs7O1dBSUc7UUFDSCx1QkFBa0IsR0FBRyxHQUFVLEVBQUU7WUFDL0IsSUFBRyxPQUFPLElBQUksQ0FBQyxlQUFlLEtBQUssV0FBVyxFQUFDO2dCQUM3QyxNQUFNLEtBQUssR0FBVSxJQUFJLENBQUMsSUFBSSxDQUFDLFlBQVksRUFBRSxDQUFDO2dCQUM5QyxJQUFJLEtB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QUMsTUFBTSxHQUFHLENBQUMsRUFBRTtZQUNyQyxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsU0FBUyxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRTtnQkFDekMsSUFBSSxPQUFPLFNBQVMsQ0FBQyxDQUFDLENBQUMsS0FBSyxRQUFRLEVBQUU7b0JBQ3BDLElBQUksT0FBTyxJQUFJLENBQUMsWUFBWSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQVcsQ0FBQyxLQUFLLFdBQVcsRUFBRTt3QkFDcEUsMEJBQTBCO3dCQUMxQixNQUFNLElBQUksS0FBSyxDQUFDLGdDQUFnQyxDQUFDLENBQUM7cUJBQ25EO29CQUNELEtBQUssQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBVyxDQUFDLENBQUM7aUJBQ3BDO3FCQUFNO29CQUNMLEtBQUssQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLGVBQWUsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxFQUFFLE9BQU8sRUFBRSxTQUFTLENBQUMsQ0FBQyxDQUFXLENBQUMsQ0FBQyxDQUFDO2lCQUMzRjthQUNGO1NBQ0Y7UUFDRCxPQUFPLEtBQUssQ0FBQztJQUNmLENBQUM7Q0FvQkY7QUE3M0NELHNDQTYzQ0MiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBwYWNrYWdlRG9jdW1lbnRhdGlvblxuICogQG1vZHVsZSBBUEktUGxhdGZvcm1WTVxuICovXG5pbXBvcnQgeyBCdWZmZXIgfSBmcm9tICdidWZmZXIvJztcbmltcG9ydCBCTiBmcm9tICdibi5qcyc7XG5pbXBvcnQgQXZhbGFuY2hlQ29yZSBmcm9tICcuLi8uLi9hdmFsYW5jaGUnO1xuaW1wb3J0IHsgSlJQQ0FQSSB9IGZyb20gJy4uLy4uL2NvbW1vbi9qcnBjYXBpJztcbmltcG9ydCB7IFJlcXVlc3RSZXNwb25zZURhdGEgfSBmcm9tICcuLi8uLi9jb21tb24vYXBpYmFzZSc7XG5pbXBvcnQgQmluVG9vbHMgZnJvbSAnLi4vLi4vdXRpbHMvYmludG9vbHMnO1xuaW1wb3J0IHsgS2V5Q2hhaW4gfSBmcm9tICcuL2tleWNoYWluJztcbmltcG9ydCB7IERlZmF1bHRzLCBQbGF0Zm9ybUNoYWluSUQsIE9ORUFWQVggfSBmcm9tICcuLi8uLi91dGlscy9jb25zdGFudHMnO1xuaW1wb3J0IHsgUGxhdGZvcm1WTUNvbnN0YW50cyB9IGZyb20gJy4vY29uc3RhbnRzJztcbmltcG9ydCB7IFVuc2lnbmVkVHgsIFR4IH0gZnJvbSAnLi90eCc7XG5pbXBvcnQgeyBQYXlsb2FkQmFzZSB9IGZyb20gJy4uLy4uL3V0aWxzL3BheWxvYWQnO1xuaW1wb3J0IHsgVW5peE5vdywgTm9kZUlEU3RyaW5nVG9CdWZmZXIgfSBmcm9tICcuLi8uLi91dGlscy9oZWxwZXJmdW5jdGlvbnMnO1xuaW1wb3J0IHsgVVRYT1NldCB9IGZyb20gJy4uL3BsYXRmb3Jtdm0vdXR4b3MnO1xuaW1wb3J0IHsgUGVyc2lzdGFuY2VPcHRpb25zIH0gZnJvbSAnLi4vLi4vdXRpbHMvcGVyc2lzdGVuY2VvcHRpb25zJztcblxuLyoqXG4gKiBAaWdub3JlXG4gKi9cbmNvbnN0IGJpbnRvb2xzOkJpblRvb2xzID0gQmluVG9vbHMuZ2V0SW5zdGFuY2UoKTtcblxuLyoqXG4gKiBDbGFzcyBmb3IgaW50ZXJhY3Rpbmcgd2l0aCBhIG5vZGUncyBQbGF0Zm9ybVZNQVBJXG4gKlxuICogQGNhdGVnb3J5IFJQQ0FQSXNcbiAqXG4gKiBAcmVtYXJrcyBUaGlzIGV4dGVuZHMgdGhlIFtbSlJQQ0FQSV1dIGNsYXNzLiBUaGlzIGNsYXNzIHNob3VsZCBub3QgYmUgZGlyZWN0bHkgY2FsbGVkLiBJbnN0ZWFkLCB1c2UgdGhlIFtbQXZhbGFuY2hlLmFkZEFQSV1dIGZ1bmN0aW9uIHRvIHJlZ2lzdGVyIHRoaXMgaW50ZXJmYWNlIHdpdGggQXZhbGFuY2hlLlxuICovXG5leHBvcnQgY2xhc3MgUGxhdGZvcm1WTUFQSSBleHRlbmRzIEpSUENBUEkge1xuXG4gIC8qKlxuICAgKiBAaWdub3JlXG4gICAqL1xuICBwcm90ZWN0ZWQga2V5Y2hhaW46S2V5Q2hhaW4gPSBuZXcgS2V5Q2hhaW4oJycsICcnKTtcblxuICBwcm90ZWN0ZWQgYmxvY2tjaGFpbklEOnN0cmluZyA9IFBsYXRmb3JtQ2hhaW5JRDtcblxuICBwcm90ZWN0ZWQgYmxvY2tjaGFpbkFsaWFzOnN0cmluZyA9IHVuZGVmaW5lZDtcblxuICBwcm90ZWN0ZWQgQVZBWEFzc2V0SUQ6QnVmZmVyID0gdW5kZWZpbmVkO1xuXG4gIHByb3RlY3RlZCB0eEZlZTpCTiA9IHVuZGVmaW5lZDtcblxuICBwcm90ZWN0ZWQgY3JlYXRpb25UeEZlZTpCTiA9IHVuZGVmaW5lZDtcblxuICBwcm90ZWN0ZWQgbWluVmFsaWRhdG9yU3Rha2U6Qk4gPSB1bmRlZmluZWQ7XG5cbiAgcHJvdGVjdGVkIG1pbkRlbGVnYXRvclN0YWtlOkJOID0gdW5kZWZpbmVkO1xuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBhbGlhcyBmb3IgdGhlIGJsb2NrY2hhaW5JRCBpZiBpdCBleGlzdHMsIG90aGVyd2lzZSByZXR1cm5zIGB1bmRlZmluZWRgLlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgYWxpYXMgZm9yIHRoZSBibG9ja2NoYWluSURcbiAgICovXG4gIGdldEJsb2NrY2hhaW5BbGlhcyA9ICgpOnN0cmluZyA9PiB7XG4gICAgaWYodHlwZW9mIHRoaXMuYmxvY2tjaGFpbkFsaWFzID09PSBcInVuZGVmaW5lZFwiKXtcbiAgICAgIGNvbnN0IG5ldGlkOm51bWJlciA9IHRoaXMuY29yZS5nZXROZXR3b3JrSUQoKTtcbiAgICAgIGlmIChuZXRpZCBpbiBEZWZhdWx0cy5uZXR3b3JrICYmIHRoaXMuYmxvY2tjaGFpbklEIGluIERlZmF1bHRzLm5ldHdvcmtbbmV0aWRdKSB7XG4gICAgICAgIHRoaXMuYmxvY2tjaGFpbkFsaWFzID0gRGVmYXVsdHMubmV0d29ya1tuZXRpZF1bdGhpcy5ibG9ja2NoYWluSURdLmFsaWFzO1xuICAgICAgICByZXR1cm4gdGhpcy5ibG9ja2NoYWluQWxpYXM7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xuICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgfVxuICAgIH0gXG4gICAgcmV0dXJuIHRoaXMuYmxvY2tjaGFpbkFsaWFzO1xuICB9O1xuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSBhbGlhcyBmb3IgdGhlIGJsb2NrY2hhaW5JRC5cbiAgICogXG4gICAqIEBwYXJhbSBhbGlhcyBUaGUgYWxpYXMgZm9yIHRoZSBibG9ja2NoYWluSUQuXG4gICAqIFxuICAgKi9cbiAgc2V0QmxvY2tjaGFpbkFsaWFzID0gKGFsaWFzOnN0cmluZyk6c3RyaW5nID0+IHtcbiAgICB0aGlzLmJsb2NrY2hhaW5BbGlhcyA9IGFsaWFzO1xuICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgfTtcblxuICAvKipcbiAgICogR2V0cyB0aGUgYmxvY2tjaGFpbklEIGFuZCByZXR1cm5zIGl0LlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgYmxvY2tjaGFpbklEXG4gICAqL1xuICBnZXRCbG9ja2NoYWluSUQgPSAoKTpzdHJpbmcgPT4gdGhpcy5ibG9ja2NoYWluSUQ7XG5cbiAgLyoqXG4gICAqIFJlZnJlc2ggYmxvY2tjaGFpbklELCBhbmQgaWYgYSBibG9ja2NoYWluSUQgaXMgcGFzc2VkIGluLCB1c2UgdGhhdC5cbiAgICpcbiAgICogQHBhcmFtIE9wdGlvbmFsLiBCbG9ja2NoYWluSUQgdG8gYXNzaWduLCBpZiBub25lLCB1c2VzIHRoZSBkZWZhdWx0IGJhc2VkIG9uIG5ldHdvcmtJRC5cbiAgICpcbiAgICogQHJldHVybnMgVGhlIGJsb2NrY2hhaW5JRFxuICAgKi9cbiAgcmVmcmVzaEJsb2NrY2hhaW5JRCA9IChibG9ja2NoYWluSUQ6c3RyaW5nID0gdW5kZWZpbmVkKTpib29sZWFuID0+IHtcbiAgICBjb25zdCBuZXRpZDpudW1iZXIgPSB0aGlzLmNvcmUuZ2V0TmV0d29ya0lEKCk7XG4gICAgaWYgKHR5cGVvZiBibG9ja2NoYWluSUQgPT09ICd1bmRlZmluZWQnICYmIHR5cGVvZiBEZWZhdWx0cy5uZXR3b3JrW25ldGlkXSAhPT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgdGhpcy5ibG9ja2NoYWluSUQgPSBQbGF0Zm9ybUNoYWluSUQ7IC8vZGVmYXVsdCB0byBQLUNoYWluXG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9IGlmICh0eXBlb2YgYmxvY2tjaGFpbklEID09PSAnc3RyaW5nJykge1xuICAgICAgdGhpcy5ibG9ja2NoYWluSUQgPSBibG9ja2NoYWluSUQ7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9O1xuXG4gIC8qKlxuICAgKiBUYWtlcyBhbiBhZGRyZXNzIHN0cmluZyBhbmQgcmV0dXJucyBpdHMge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0gcmVwcmVzZW50YXRpb24gaWYgdmFsaWQuXG4gICAqXG4gICAqIEByZXR1cm5zIEEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0gZm9yIHRoZSBhZGRyZXNzIGlmIHZhbGlkLCB1bmRlZmluZWQgaWYgbm90IHZhbGlkLlxuICAgKi9cbiAgcGFyc2VBZGRyZXNzID0gKGFkZHI6c3RyaW5nKTpCdWZmZXIgPT4ge1xuICAgIGNvbnN0IGFsaWFzOnN0cmluZyA9IHRoaXMuZ2V0QmxvY2tjaGFpbkFsaWFzKCk7XG4gICAgY29uc3QgYmxvY2tjaGFpbklEOnN0cmluZyA9IHRoaXMuZ2V0QmxvY2tjaGFpbklEKCk7XG4gICAgcmV0dXJuIGJpbnRvb2xzLnBhcnNlQWRkcmVzcyhhZGRyLCBibG9ja2NoYWluSUQsIGFsaWFzLCBQbGF0Zm9ybVZNQ29uc3RhbnRzLkFERFJFU1NMRU5HVEgpO1xuICB9O1xuXG4gIGFkZHJlc3NGcm9tQnVmZmVyID0gKGFkZHJlc3M6QnVmZmVyKTpzdHJpbmcgPT4ge1xuICAgIGNvbnN0IGNoYWluaWQ6c3RyaW5nID0gdGhpcy5nZXRCbG9ja2NoYWluQWxpYXMoKSA/IHRoaXMuZ2V0QmxvY2tjaGFpbkFsaWFzKCkgOiB0aGlzLmdldEJsb2NrY2hhaW5JRCgpO1xuICAgIHJldHVybiBiaW50b29scy5hZGRyZXNzVG9TdHJpbmcodGhpcy5jb3JlLmdldEhSUCgpLCBjaGFpbmlkLCBhZGRyZXNzKTtcbiAgfTtcblxuICAvKipcbiAgICogRmV0Y2hlcyB0aGUgQVZBWCBBc3NldElEIGFuZCByZXR1cm5zIGl0IGluIGEgUHJvbWlzZS5cbiAgICpcbiAgICogQHBhcmFtIHJlZnJlc2ggVGhpcyBmdW5jdGlvbiBjYWNoZXMgdGhlIHJlc3BvbnNlLiBSZWZyZXNoID0gdHJ1ZSB3aWxsIGJ1c3QgdGhlIGNhY2hlLlxuICAgKiBcbiAgICogQHJldHVybnMgVGhlIHRoZSBwcm92aWRlZCBzdHJpbmcgcmVwcmVzZW50aW5nIHRoZSBBVkFYIEFzc2V0SURcbiAgICovXG4gIGdldEFWQVhBc3NldElEID0gYXN5bmMgKHJlZnJlc2g6Ym9vbGVhbiA9IGZhbHNlKTpQcm9taXNlPEJ1ZmZlcj4gPT4ge1xuICAgIGlmICh0eXBlb2YgdGhpcy5BVkFYQXNzZXRJRCA9PT0gJ3VuZGVmaW5lZCcgfHwgcmVmcmVzaCkge1xuICAgICAgY29uc3QgYXNzZXRJRDpzdHJpbmcgPSBhd2FpdCB0aGlzLmdldFN0YWtpbmdBc3NldElEKCk7XG4gICAgICB0aGlzLkFWQVhBc3NldElEID0gYmludG9vbHMuY2I1OERlY29kZShhc3NldElEKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuQVZBWEFzc2V0SUQ7XG4gIH07XG4gIFxuICAvKipcbiAgICogT3ZlcnJpZGVzIHRoZSBkZWZhdWx0cyBhbmQgc2V0cyB0aGUgY2FjaGUgdG8gYSBzcGVjaWZpYyBBVkFYIEFzc2V0SURcbiAgICogXG4gICAqIEBwYXJhbSBhdmF4QXNzZXRJRCBBIGNiNTggc3RyaW5nIG9yIEJ1ZmZlciByZXByZXNlbnRpbmcgdGhlIEFWQVggQXNzZXRJRFxuICAgKiBcbiAgICogQHJldHVybnMgVGhlIHRoZSBwcm92aWRlZCBzdHJpbmcgcmVwcmVzZW50aW5nIHRoZSBBVkFYIEFzc2V0SURcbiAgICovXG4gIHNldEFWQVhBc3NldElEID0gKGF2YXhBc3NldElEOnN0cmluZyB8IEJ1ZmZlcikgPT4ge1xuICAgIGlmKHR5cGVvZiBhdmF4QXNzZXRJRCA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgYXZheEFzc2V0SUQgPSBiaW50b29scy5jYjU4RGVjb2RlKGF2YXhBc3NldElEKTtcbiAgICB9XG4gICAgdGhpcy5BVkFYQXNzZXRJRCA9IGF2YXhBc3NldElEO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIGRlZmF1bHQgdHggZmVlIGZvciB0aGlzIGNoYWluLlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgZGVmYXVsdCB0eCBmZWUgYXMgYSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2luZHV0bnkvYm4uanMvfEJOfVxuICAgKi9cbiAgZ2V0RGVmYXVsdFR4RmVlID0gICgpOkJOID0+IHtcbiAgICByZXR1cm4gdGhpcy5jb3JlLmdldE5ldHdvcmtJRCgpIGluIERlZmF1bHRzLm5ldHdvcmsgPyBuZXcgQk4oRGVmYXVsdHMubmV0d29ya1t0aGlzLmNvcmUuZ2V0TmV0d29ya0lEKCldW1wiUFwiXVtcInR4RmVlXCJdKSA6IG5ldyBCTigwKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSB0eCBmZWUgZm9yIHRoaXMgY2hhaW4uXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSB0eCBmZWUgYXMgYSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2luZHV0bnkvYm4uanMvfEJOfVxuICAgKi9cbiAgZ2V0VHhGZWUgPSAoKTpCTiA9PiB7XG4gICAgaWYodHlwZW9mIHRoaXMudHhGZWUgPT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgIHRoaXMudHhGZWUgPSB0aGlzLmdldERlZmF1bHRUeEZlZSgpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy50eEZlZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSB0eCBmZWUgZm9yIHRoaXMgY2hhaW4uXG4gICAqXG4gICAqIEBwYXJhbSBmZWUgVGhlIHR4IGZlZSBhbW91bnQgdG8gc2V0IGFzIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vaW5kdXRueS9ibi5qcy98Qk59XG4gICAqL1xuICBzZXRUeEZlZSA9IChmZWU6Qk4pID0+IHtcbiAgICB0aGlzLnR4RmVlID0gZmVlO1xuICB9XG5cblxuICAvKipcbiAgICogR2V0cyB0aGUgZGVmYXVsdCBjcmVhdGlvbiBmZWUgZm9yIHRoaXMgY2hhaW4uXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSBkZWZhdWx0IGNyZWF0aW9uIGZlZSBhcyBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vaW5kdXRueS9ibi5qcy98Qk59XG4gICAqL1xuICBnZXREZWZhdWx0Q3JlYXRpb25UeEZlZSA9ICAoKTpCTiA9PiB7XG4gICAgcmV0dXJuIHRoaXMuY29yZS5nZXROZXR3b3JrSUQoKSBpbiBEZWZhdWx0cy5uZXR3b3JrID8gbmV3IEJOKERlZmF1bHRzLm5ldHdvcmtbdGhpcy5jb3JlLmdldE5ldHdvcmtJRCgpXVtcIlBcIl1bXCJjcmVhdGlvblR4RmVlXCJdKSA6IG5ldyBCTigwKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBjcmVhdGlvbiBmZWUgZm9yIHRoaXMgY2hhaW4uXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSBjcmVhdGlvbiBmZWUgYXMgYSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2luZHV0bnkvYm4uanMvfEJOfVxuICAgKi9cbiAgZ2V0Q3JlYXRpb25UeEZlZSA9ICgpOkJOID0+IHtcbiAgICBpZih0eXBlb2YgdGhpcy5jcmVhdGlvblR4RmVlID09PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICB0aGlzLmNyZWF0aW9uVHhGZWUgPSB0aGlzLmdldERlZmF1bHRDcmVhdGlvblR4RmVlKCk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLmNyZWF0aW9uVHhGZWU7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgY3JlYXRpb24gZmVlIGZvciB0aGlzIGNoYWluLlxuICAgKlxuICAgKiBAcGFyYW0gZmVlIFRoZSBjcmVhdGlvbiBmZWUgYW1vdW50IHRvIHNldCBhcyB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2luZHV0bnkvYm4uanMvfEJOfVxuICAgKi9cbiAgc2V0Q3JlYXRpb25UeEZlZSA9IChmZWU6Qk4pID0+IHtcbiAgICB0aGlzLmNyZWF0aW9uVHhGZWUgPSBmZWU7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyBhIHJlZmVyZW5jZSB0byB0aGUga2V5Y2hhaW4gZm9yIHRoaXMgY2xhc3MuXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSBpbnN0YW5jZSBvZiBbW11dIGZvciB0aGlzIGNsYXNzXG4gICAqL1xuICBrZXlDaGFpbiA9ICgpOktleUNoYWluID0+IHRoaXMua2V5Y2hhaW47XG5cbiAgLyoqXG4gICAqIEBpZ25vcmVcbiAgICovXG4gIG5ld0tleUNoYWluID0gKCk6S2V5Q2hhaW4gPT4ge1xuICAgIC8vIHdhcm5pbmcsIG92ZXJ3cml0ZXMgdGhlIG9sZCBrZXljaGFpblxuICAgIGNvbnN0IGFsaWFzID0gdGhpcy5nZXRCbG9ja2NoYWluQWxpYXMoKTtcbiAgICBpZiAoYWxpYXMpIHtcbiAgICAgIHRoaXMua2V5Y2hhaW4gPSBuZXcgS2V5Q2hhaW4odGhpcy5jb3JlLmdldEhSUCgpLCBhbGlhcyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMua2V5Y2hhaW4gPSBuZXcgS2V5Q2hhaW4odGhpcy5jb3JlLmdldEhSUCgpLCB0aGlzLmJsb2NrY2hhaW5JRCk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLmtleWNoYWluO1xuICB9O1xuXG4gIC8qKlxuICAgKiBIZWxwZXIgZnVuY3Rpb24gd2hpY2ggZGV0ZXJtaW5lcyBpZiBhIHR4IGlzIGEgZ29vc2UgZWdnIHRyYW5zYWN0aW9uLiBcbiAgICpcbiAgICogQHBhcmFtIHV0eCBBbiBVbnNpZ25lZFR4XG4gICAqXG4gICAqIEByZXR1cm5zIGJvb2xlYW4gdHJ1ZSBpZiBwYXNzZXMgZ29vc2UgZWdnIHRlc3QgYW5kIGZhbHNlIGlmIGZhaWxzLlxuICAgKlxuICAgKiBAcmVtYXJrc1xuICAgKiBBIFwiR29vc2UgRWdnIFRyYW5zYWN0aW9uXCIgaXMgd2hlbiB0aGUgZmVlIGZhciBleGNlZWRzIGEgcmVhc29uYWJsZSBhbW91bnRcbiAgICovXG4gIGNoZWNrR29vc2VFZ2cgPSBhc3luYyAodXR4OlVuc2lnbmVkVHgsIG91dFRvdGFsOkJOID0gbmV3IEJOKDApKTogUHJvbWlzZTxib29sZWFuPiA9PiB7XG4gICAgY29uc3QgYXZheEFzc2V0SUQ6QnVmZmVyID0gYXdhaXQgdGhpcy5nZXRBVkFYQXNzZXRJRCgpO1xuICAgIGxldCBvdXRwdXRUb3RhbDpCTiA9IG91dFRvdGFsLmd0KG5ldyBCTigwKSkgPyBvdXRUb3RhbCA6IHV0eC5nZXRPdXRwdXRUb3RhbChhdmF4QXNzZXRJRCk7XG4gICAgY29uc3QgZmVlOkJOID0gdXR4LmdldEJ1cm4oYXZheEFzc2V0SUQpO1xuICAgIGlmKGZlZS5sdGUoT05FQVZBWC5tdWwobmV3IEJOKDEwKSkpIHx8IGZlZS5sdGUob3V0cHV0VG90YWwpKSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBSZXRyaWV2ZXMgYW4gYXNzZXRJRCBmb3IgYSBzdWJuZXQncyBzdGFraW5nIGFzc3NldC5cbiAgICpcbiAgICogQHJldHVybnMgUmV0dXJucyBhIFByb21pc2U8c3RyaW5nPiB3aXRoIGNiNTggZW5jb2RlZCB2YWx1ZSBvZiB0aGUgYXNzZXRJRC5cbiAgICovXG4gIGdldFN0YWtpbmdBc3NldElEID0gYXN5bmMgKCk6UHJvbWlzZTxzdHJpbmc+ID0+IHtcbiAgICBjb25zdCBwYXJhbXM6YW55ID0ge307XG4gICAgcmV0dXJuIHRoaXMuY2FsbE1ldGhvZCgncGxhdGZvcm0uZ2V0U3Rha2luZ0Fzc2V0SUQnLCBwYXJhbXMpLnRoZW4oKHJlc3BvbnNlOlJlcXVlc3RSZXNwb25zZURhdGEpID0+IChyZXNwb25zZS5kYXRhLnJlc3VsdC5hc3NldElEKSk7XG4gIH07XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBuZXcgYmxvY2tjaGFpbi5cbiAgICpcbiAgICogQHBhcmFtIHVzZXJuYW1lIFRoZSB1c2VybmFtZSBvZiB0aGUgS2V5c3RvcmUgdXNlciB0aGF0IGNvbnRyb2xzIHRoZSBuZXcgYWNjb3VudFxuICAgKiBAcGFyYW0gcGFzc3dvcmQgVGhlIHBhc3N3b3JkIG9mIHRoZSBLZXlzdG9yZSB1c2VyIHRoYXQgY29udHJvbHMgdGhlIG5ldyBhY2NvdW50XG4gICAqIEBwYXJhbSBzdWJuZXRJRCBPcHRpb25hbC4gRWl0aGVyIGEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0gb3IgYW4gY2I1OCBzZXJpYWxpemVkIHN0cmluZyBmb3IgdGhlIFN1Ym5ldElEIG9yIGl0cyBhbGlhcy5cbiAgICogQHBhcmFtIHZtSUQgVGhlIElEIG9mIHRoZSBWaXJ0dWFsIE1hY2hpbmUgdGhlIGJsb2NrY2hhaW4gcnVucy4gQ2FuIGFsc28gYmUgYW4gYWxpYXMgb2YgdGhlIFZpcnR1YWwgTWFjaGluZS5cbiAgICogQHBhcmFtIEZYSURzIFRoZSBpZHMgb2YgdGhlIEZYcyB0aGUgVk0gaXMgcnVubmluZy5cbiAgICogQHBhcmFtIG5hbWUgQSBodW1hbi1yZWFkYWJsZSBuYW1lIGZvciB0aGUgbmV3IGJsb2NrY2hhaW5cbiAgICogQHBhcmFtIGdlbmVzaXMgVGhlIGJhc2UgNTggKHdpdGggY2hlY2tzdW0pIHJlcHJlc2VudGF0aW9uIG9mIHRoZSBnZW5lc2lzIHN0YXRlIG9mIHRoZSBuZXcgYmxvY2tjaGFpbi4gVmlydHVhbCBNYWNoaW5lcyBzaG91bGQgaGF2ZSBhIHN0YXRpYyBBUEkgbWV0aG9kIG5hbWVkIGJ1aWxkR2VuZXNpcyB0aGF0IGNhbiBiZSB1c2VkIHRvIGdlbmVyYXRlIGdlbmVzaXNEYXRhLlxuICAgKlxuICAgKiBAcmV0dXJucyBQcm9taXNlIGZvciB0aGUgdW5zaWduZWQgdHJhbnNhY3Rpb24gdG8gY3JlYXRlIHRoaXMgYmxvY2tjaGFpbi4gTXVzdCBiZSBzaWduZWQgYnkgYSBzdWZmaWNpZW50IG51bWJlciBvZiB0aGUgU3VibmV04oCZcyBjb250cm9sIGtleXMgYW5kIGJ5IHRoZSBhY2NvdW50IHBheWluZyB0aGUgdHJhbnNhY3Rpb24gZmVlLlxuICAgKi9cbiAgY3JlYXRlQmxvY2tjaGFpbiA9IGFzeW5jIChcbiAgICB1c2VybmFtZTogc3RyaW5nLFxuICAgIHBhc3N3b3JkOnN0cmluZyxcbiAgICBzdWJuZXRJRDpCdWZmZXIgfCBzdHJpbmcgPSB1bmRlZmluZWQsXG4gICAgdm1JRDpzdHJpbmcsXG4gICAgZnhJRHM6IEFycmF5PG51bWJlcj4sXG4gICAgbmFtZTpzdHJpbmcsXG4gICAgZ2VuZXNpczpzdHJpbmcsXG4gICAgKVxuICA6UHJvbWlzZTxzdHJpbmc+ID0+IHtcbiAgICBjb25zdCBwYXJhbXM6YW55ID0ge1xuICAgICAgdXNlcm5hbWUsIFxuICAgICAgcGFzc3dvcmQsXG4gICAgICBmeElEcyxcbiAgICAgIHZtSUQsXG4gICAgICBuYW1lLFxuICAgICAgZ2VuZXNpc0RhdGE6IGdlbmVzaXMsXG4gICAgfTtcbiAgICBpZiAodHlwZW9mIHN1Ym5ldElEID09PSAnc3RyaW5nJykge1xuICAgICAgcGFyYW1zLnN1Ym5ldElEID0gc3VibmV0SUQ7XG4gICAgfSBlbHNlIGlmICh0eXBlb2Ygc3VibmV0SUQgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICBwYXJhbXMuc3VibmV0SUQgPSBiaW50b29scy5jYjU4RW5jb2RlKHN1Ym5ldElEKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuY2FsbE1ldGhvZCgncGxhdGZvcm0uY3JlYXRlQmxvY2tjaGFpbicsIHBhcmFtcylcbiAgICAgIC50aGVuKChyZXNwb25zZTpSZXF1ZXN0UmVzcG9uc2VEYXRhKSA9PiByZXNwb25zZS5kYXRhLnJlc3VsdC50eElEKTtcbiAgfTtcblxuICAvKipcbiAgICogR2V0cyB0aGUgc3RhdHVzIG9mIGEgYmxvY2tjaGFpbi5cbiAgICpcbiAgICogQHBhcmFtIGJsb2NrY2hhaW5JRCBUaGUgYmxvY2tjaGFpbklEIHJlcXVlc3RpbmcgYSBzdGF0dXMgdXBkYXRlXG4gICAqXG4gICAqIEByZXR1cm5zIFByb21pc2UgZm9yIGEgc3RyaW5nIG9mIG9uZSBvZjogXCJWYWxpZGF0aW5nXCIsIFwiQ3JlYXRlZFwiLCBcIlByZWZlcnJlZFwiLCBcIlVua25vd25cIi5cbiAgICovXG4gIGdldEJsb2NrY2hhaW5TdGF0dXMgPSBhc3luYyAoYmxvY2tjaGFpbklEOiBzdHJpbmcpOlByb21pc2U8c3RyaW5nPiA9PiB7XG4gICAgY29uc3QgcGFyYW1zOmFueSA9IHtcbiAgICAgIGJsb2NrY2hhaW5JRCxcbiAgICB9O1xuICAgIHJldHVybiB0aGlzLmNhbGxNZXRob2QoJ3BsYXRmb3JtLmdldEJsb2NrY2hhaW5TdGF0dXMnLCBwYXJhbXMpXG4gICAgICAudGhlbigocmVzcG9uc2U6UmVxdWVzdFJlc3BvbnNlRGF0YSkgPT4gcmVzcG9uc2UuZGF0YS5yZXN1bHQuc3RhdHVzKTtcbiAgfTtcblxuICAvKipcbiAgICogQ3JlYXRlIGFuIGFkZHJlc3MgaW4gdGhlIG5vZGUncyBrZXlzdG9yZS5cbiAgICpcbiAgICogQHBhcmFtIHVzZXJuYW1lIFRoZSB1c2VybmFtZSBvZiB0aGUgS2V5c3RvcmUgdXNlciB0aGF0IGNvbnRyb2xzIHRoZSBuZXcgYWNjb3VudFxuICAgKiBAcGFyYW0gcGFzc3dvcmQgVGhlIHBhc3N3b3JkIG9mIHRoZSBLZXlzdG9yZSB1c2VyIHRoYXQgY29udHJvbHMgdGhlIG5ldyBhY2NvdW50XG4gICAqXG4gICAqIEByZXR1cm5zIFByb21pc2UgZm9yIGEgc3RyaW5nIG9mIHRoZSBuZXdseSBjcmVhdGVkIGFjY291bnQgYWRkcmVzcy5cbiAgICovXG4gIGNyZWF0ZUFkZHJlc3MgPSBhc3luYyAoXG4gICAgdXNlcm5hbWU6IHN0cmluZyxcbiAgICBwYXNzd29yZDpzdHJpbmdcbiAgKVxuICA6UHJvbWlzZTxzdHJpbmc+ID0+IHtcbiAgICBjb25zdCBwYXJhbXM6YW55ID0ge1xuICAgICAgdXNlcm5hbWUsXG4gICAgICBwYXNzd29yZCxcbiAgICB9O1xuICAgIHJldHVybiB0aGlzLmNhbGxNZXRob2QoJ3BsYXRmb3JtLmNyZWF0ZUFkZHJlc3MnLCBwYXJhbXMpXG4gICAgICAudGhlbigocmVzcG9uc2U6UmVxdWVzdFJlc3BvbnNlRGF0YSkgPT4gcmVzcG9uc2UuZGF0YS5yZXN1bHQuYWRkcmVzcyk7XG4gIH07XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIGJhbGFuY2Ugb2YgYSBwYXJ0aWN1bGFyIGFzc2V0LlxuICAgKlxuICAgKiBAcGFyYW0gYWRkcmVzcyBUaGUgYWRkcmVzcyB0byBwdWxsIHRoZSBhc3NldCBiYWxhbmNlIGZyb21cbiAgICpcbiAgICogQHJldHVybnMgUHJvbWlzZSB3aXRoIHRoZSBiYWxhbmNlIGFzIGEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9pbmR1dG55L2JuLmpzL3xCTn0gb24gdGhlIHByb3ZpZGVkIGFkZHJlc3MuXG4gICAqL1xuICBnZXRCYWxhbmNlID0gYXN5bmMgKGFkZHJlc3M6c3RyaW5nKTpQcm9taXNlPG9iamVjdD4gPT4ge1xuICAgIGlmICh0eXBlb2YgdGhpcy5wYXJzZUFkZHJlc3MoYWRkcmVzcykgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiRXJyb3IgLSBQbGF0Zm9ybVZNQVBJLmdldEJhbGFuY2U6IEludmFsaWQgYWRkcmVzcyBmb3JtYXRcIik7XG4gICAgfVxuICAgIGNvbnN0IHBhcmFtczphbnkgPSB7XG4gICAgICBhZGRyZXNzXG4gICAgfTtcbiAgICByZXR1cm4gIHRoaXMuY2FsbE1ldGhvZCgncGxhdGZvcm0uZ2V0QmFsYW5jZScsIHBhcmFtcykudGhlbigocmVzcG9uc2U6UmVxdWVzdFJlc3BvbnNlRGF0YSkgPT4gcmVzcG9uc2UuZGF0YS5yZXN1bHQpO1xuICB9O1xuICBcbiAgLyoqXG4gICAqIExpc3QgdGhlIGFkZHJlc3NlcyBjb250cm9sbGVkIGJ5IHRoZSB1c2VyLlxuICAgKlxuICAgKiBAcGFyYW0gdXNlcm5hbWUgVGhlIHVzZXJuYW1lIG9mIHRoZSBLZXlzdG9yZSB1c2VyXG4gICAqIEBwYXJhbSBwYXNzd29yZCBUaGUgcGFzc3dvcmQgb2YgdGhlIEtleXN0b3JlIHVzZXJcbiAgICpcbiAgICogQHJldHVybnMgUHJvbWlzZSBmb3IgYW4gYXJyYXkgb2YgYWRkcmVzc2VzLlxuICAgKi9cbiAgbGlzdEFkZHJlc3NlcyA9IGFzeW5jICh1c2VybmFtZTogc3RyaW5nLCBwYXNzd29yZDpzdHJpbmcpOlByb21pc2U8QXJyYXk8c3RyaW5nPj4gPT4ge1xuICAgIGNvbnN0IHBhcmFtczphbnkgPSB7XG4gICAgICB1c2VybmFtZSxcbiAgICAgIHBhc3N3b3JkLFxuICAgIH07XG4gICAgcmV0dXJuIHRoaXMuY2FsbE1ldGhvZCgncGxhdGZvcm0ubGlzdEFkZHJlc3NlcycsIHBhcmFtcylcbiAgICAgIC50aGVuKChyZXNwb25zZTpSZXF1ZXN0UmVzcG9uc2VEYXRhKSA9PiByZXNwb25zZS5kYXRhLnJlc3VsdC5hZGRyZXNzZXMpO1xuICB9O1xuXG4gIC8qKlxuICAgKiBMaXN0cyB0aGUgc2V0IG9mIGN1cnJlbnQgdmFsaWRhdG9ycy5cbiAgICpcbiAgICogQHBhcmFtIHN1Ym5ldElEIE9wdGlvbmFsLiBFaXRoZXIgYSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSBvciBhblxuICAgKiBjYjU4IHNlcmlhbGl6ZWQgc3RyaW5nIGZvciB0aGUgU3VibmV0SUQgb3IgaXRzIGFsaWFzLlxuICAgKlxuICAgKiBAcmV0dXJucyBQcm9taXNlIGZvciBhbiBhcnJheSBvZiB2YWxpZGF0b3JzIHRoYXQgYXJlIGN1cnJlbnRseSBzdGFraW5nLCBzZWU6IHtAbGluayBodHRwczovL2RvY3MuYXZheC5uZXR3b3JrL3YxLjAvZW4vYXBpL3BsYXRmb3JtLyNwbGF0Zm9ybWdldGN1cnJlbnR2YWxpZGF0b3JzfHBsYXRmb3JtLmdldEN1cnJlbnRWYWxpZGF0b3JzIGRvY3VtZW50YXRpb259LlxuICAgKlxuICAgKi9cbiAgZ2V0Q3VycmVudFZhbGlkYXRvcnMgPSBhc3luYyAoc3VibmV0SUQ6QnVmZmVyIHwgc3RyaW5nID0gdW5kZWZpbmVkKTpQcm9taXNlPG9iamVjdD4gPT4ge1xuICAgIGNvbnN0IHBhcmFtczphbnkgPSB7fTtcbiAgICBpZiAodHlwZW9mIHN1Ym5ldElEID09PSAnc3RyaW5nJykge1xuICAgICAgcGFyYW1zLnN1Ym5ldElEID0gc3VibmV0SUQ7XG4gICAgfSBlbHNlIGlmICh0eXBlb2Ygc3VibmV0SUQgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICBwYXJhbXMuc3VibmV0SUQgPSBiaW50b29scy5jYjU4RW5jb2RlKHN1Ym5ldElEKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuY2FsbE1ldGhvZCgncGxhdGZvcm0uZ2V0Q3VycmVudFZhbGlkYXRvcnMnLCBwYXJhbXMpXG4gICAgICAudGhlbigocmVzcG9uc2U6UmVxdWVzdFJlc3BvbnNlRGF0YSkgPT4gcmVzcG9uc2UuZGF0YS5yZXN1bHQpO1xuICB9O1xuXG4gIC8qKlxuICAgKiBMaXN0cyB0aGUgc2V0IG9mIHBlbmRpbmcgdmFsaWRhdG9ycy5cbiAgICpcbiAgICogQHBhcmFtIHN1Ym5ldElEIE9wdGlvbmFsLiBFaXRoZXIgYSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfVxuICAgKiBvciBhIGNiNTggc2VyaWFsaXplZCBzdHJpbmcgZm9yIHRoZSBTdWJuZXRJRCBvciBpdHMgYWxpYXMuXG4gICAqXG4gICAqIEByZXR1cm5zIFByb21pc2UgZm9yIGFuIGFycmF5IG9mIHZhbGlkYXRvcnMgdGhhdCBhcmUgcGVuZGluZyBzdGFraW5nLCBzZWU6IHtAbGluayBodHRwczovL2RvY3MuYXZheC5uZXR3b3JrL3YxLjAvZW4vYXBpL3BsYXRmb3JtLyNwbGF0Zm9ybWdldHBlbmRpbmd2YWxpZGF0b3JzfHBsYXRmb3JtLmdldFBlbmRpbmdWYWxpZGF0b3JzIGRvY3VtZW50YXRpb259LlxuICAgKlxuICAgKi9cbiAgZ2V0UGVuZGluZ1ZhbGlkYXRvcnMgPSBhc3luYyAoc3VibmV0SUQ6QnVmZmVyIHwgc3RyaW5nID0gdW5kZWZpbmVkKTpQcm9taXNlPG9iamVjdD4gPT4ge1xuICAgIGNvbnN0IHBhcmFtczphbnkgPSB7fTtcbiAgICBpZiAodHlwZW9mIHN1Ym5ldElEID09PSAnc3RyaW5nJykge1xuICAgICAgcGFyYW1zLnN1Ym5ldElEID0gc3VibmV0SUQ7XG4gICAgfSBlbHNlIGlmICh0eXBlb2Ygc3VibmV0SUQgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICBwYXJhbXMuc3VibmV0SUQgPSBiaW50b29scy5jYjU4RW5jb2RlKHN1Ym5ldElEKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy5jYWxsTWV0aG9kKCdwbGF0Zm9ybS5nZXRQZW5kaW5nVmFsaWRhdG9ycycsIHBhcmFtcylcbiAgICAgIC50aGVuKChyZXNwb25zZTpSZXF1ZXN0UmVzcG9uc2VEYXRhKSA9PiByZXNwb25zZS5kYXRhLnJlc3VsdCk7XG4gIH07XG5cbiAgLyoqXG4gICAqIFNhbXBsZXMgYFNpemVgIHZhbGlkYXRvcnMgZnJvbSB0aGUgY3VycmVudCB2YWxpZGF0b3Igc2V0LlxuICAgKlxuICAgKiBAcGFyYW0gc2FtcGxlU2l6ZSBPZiB0aGUgdG90YWwgdW5pdmVyc2Ugb2YgdmFsaWRhdG9ycywgc2VsZWN0IHRoaXMgbWFueSBhdCByYW5kb21cbiAgICogQHBhcmFtIHN1Ym5ldElEIE9wdGlvbmFsLiBFaXRoZXIgYSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSBvciBhblxuICAgKiBjYjU4IHNlcmlhbGl6ZWQgc3RyaW5nIGZvciB0aGUgU3VibmV0SUQgb3IgaXRzIGFsaWFzLlxuICAgKlxuICAgKiBAcmV0dXJucyBQcm9taXNlIGZvciBhbiBhcnJheSBvZiB2YWxpZGF0b3IncyBzdGFraW5nSURzLlxuICAgKi9cbiAgc2FtcGxlVmFsaWRhdG9ycyA9IGFzeW5jIChzYW1wbGVTaXplOm51bWJlcixcbiAgICBzdWJuZXRJRDpCdWZmZXIgfCBzdHJpbmcgPSB1bmRlZmluZWQpXG4gIDpQcm9taXNlPEFycmF5PHN0cmluZz4+ID0+IHtcbiAgICBjb25zdCBwYXJhbXM6YW55ID0ge1xuICAgICAgc2l6ZTogc2FtcGxlU2l6ZS50b1N0cmluZygpLFxuICAgIH07XG4gICAgaWYgKHR5cGVvZiBzdWJuZXRJRCA9PT0gJ3N0cmluZycpIHtcbiAgICAgIHBhcmFtcy5zdWJuZXRJRCA9IHN1Ym5ldElEO1xuICAgIH0gZWxzZSBpZiAodHlwZW9mIHN1Ym5ldElEICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgcGFyYW1zLnN1Ym5ldElEID0gYmludG9vbHMuY2I1OEVuY29kZShzdWJuZXRJRCk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLmNhbGxNZXRob2QoJ3BsYXRmb3JtLnNhbXBsZVZhbGlkYXRvcnMnLCBwYXJhbXMpXG4gICAgICAudGhlbigocmVzcG9uc2U6UmVxdWVzdFJlc3BvbnNlRGF0YSkgPT4gcmVzcG9uc2UuZGF0YS5yZXN1bHQudmFsaWRhdG9ycyk7XG4gIH07XG5cbiAgLyoqXG4gICAqIEFkZCBhIHZhbGlkYXRvciB0byB0aGUgUHJpbWFyeSBOZXR3b3JrLlxuICAgKlxuICAgKiBAcGFyYW0gdXNlcm5hbWUgVGhlIHVzZXJuYW1lIG9mIHRoZSBLZXlzdG9yZSB1c2VyXG4gICAqIEBwYXJhbSBwYXNzd29yZCBUaGUgcGFzc3dvcmQgb2YgdGhlIEtleXN0b3JlIHVzZXJcbiAgICogQHBhcmFtIG5vZGVJRCBUaGUgbm9kZSBJRCBvZiB0aGUgdmFsaWRhdG9yXG4gICAqIEBwYXJhbSBzdGFydFRpbWUgSmF2YXNjcmlwdCBEYXRlIG9iamVjdCBmb3IgdGhlIHN0YXJ0IHRpbWUgdG8gdmFsaWRhdGVcbiAgICogQHBhcmFtIGVuZFRpbWUgSmF2YXNjcmlwdCBEYXRlIG9iamVjdCBmb3IgdGhlIGVuZCB0aW1lIHRvIHZhbGlkYXRlXG4gICAqIEBwYXJhbSBzdGFrZUFtb3VudCBUaGUgYW1vdW50IG9mIG5BVkFYIHRoZSB2YWxpZGF0b3IgaXMgc3Rha2luZyBhc1xuICAgKiBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vaW5kdXRueS9ibi5qcy98Qk59XG4gICAqIEBwYXJhbSByZXdhcmRBZGRyZXNzIFRoZSBhZGRyZXNzIHRoZSB2YWxpZGF0b3IgcmV3YXJkIHdpbGwgZ28gdG8sIGlmIHRoZXJlIGlzIG9uZS5cbiAgICogQHBhcmFtIGRlbGVnYXRpb25GZWVSYXRlIE9wdGlvbmFsLiBBIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vaW5kdXRueS9ibi5qcy98Qk59IGZvciB0aGUgcGVyY2VudCBmZWUgdGhpcyB2YWxpZGF0b3IgXG4gICAqIGNoYXJnZXMgd2hlbiBvdGhlcnMgZGVsZWdhdGUgc3Rha2UgdG8gdGhlbS4gVXAgdG8gNCBkZWNpbWFsIHBsYWNlcyBhbGxvd2VkOyBhZGRpdGlvbmFsIGRlY2ltYWwgcGxhY2VzIGFyZSBpZ25vcmVkLiBcbiAgICogTXVzdCBiZSBiZXR3ZWVuIDAgYW5kIDEwMCwgaW5jbHVzaXZlLiBGb3IgZXhhbXBsZSwgaWYgZGVsZWdhdGlvbkZlZVJhdGUgaXMgMS4yMzQ1IGFuZCBzb21lb25lIGRlbGVnYXRlcyB0byB0aGlzIFxuICAgKiB2YWxpZGF0b3IsIHRoZW4gd2hlbiB0aGUgZGVsZWdhdGlvbiBwZXJpb2QgaXMgb3ZlciwgMS4yMzQ1JSBvZiB0aGUgcmV3YXJkIGdvZXMgdG8gdGhlIHZhbGlkYXRvciBhbmQgdGhlIHJlc3QgZ29lcyBcbiAgICogdG8gdGhlIGRlbGVnYXRvci5cbiAgICpcbiAgICogQHJldHVybnMgUHJvbWlzZSBmb3IgYSBiYXNlNTggc3RyaW5nIG9mIHRoZSB1bnNpZ25lZCB0cmFuc2FjdGlvbi5cbiAgICovXG4gIGFkZFZhbGlkYXRvciA9IGFzeW5jIChcbiAgICB1c2VybmFtZTpzdHJpbmcsXG4gICAgcGFzc3dvcmQ6c3RyaW5nLFxuICAgIG5vZGVJRDpzdHJpbmcsXG4gICAgc3RhcnRUaW1lOkRhdGUsXG4gICAgZW5kVGltZTpEYXRlLFxuICAgIHN0YWtlQW1vdW50OkJOLFxuICAgIHJld2FyZEFkZHJlc3M6c3RyaW5nLFxuICAgIGRlbGVnYXRpb25GZWVSYXRlOkJOID0gdW5kZWZpbmVkXG4gICk6UHJvbWlzZTxzdHJpbmc+ID0+IHtcbiAgICBjb25zdCBwYXJhbXM6YW55ID0ge1xuICAgICAgdXNlcm5hbWUsXG4gICAgICBwYXNzd29yZCxcbiAgICAgIG5vZGVJRCxcbiAgICAgIHN0YXJ0VGltZTogc3RhcnRUaW1lLmdldFRpbWUoKSAvIDEwMDAsXG4gICAgICBlbmRUaW1lOiBlbmRUaW1lLmdldFRpbWUoKSAvIDEwMDAsXG4gICAgICBzdGFrZUFtb3VudDogc3Rha2VBbW91bnQudG9TdHJpbmcoMTApLFxuICAgICAgcmV3YXJkQWRkcmVzcyxcbiAgICB9O1xuICAgIGlmICh0eXBlb2YgZGVsZWdhdGlvbkZlZVJhdGUgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICBwYXJhbXMuZGVsZWdhdGlvbkZlZVJhdGUgPSBkZWxlZ2F0aW9uRmVlUmF0ZS50b1N0cmluZygxMCk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLmNhbGxNZXRob2QoJ3BsYXRmb3JtLmFkZFZhbGlkYXRvcicsIHBhcmFtcylcbiAgICAgIC50aGVuKChyZXNwb25zZTpSZXF1ZXN0UmVzcG9uc2VEYXRhKSA9PiByZXNwb25zZS5kYXRhLnJlc3VsdC50eElEKTtcbiAgfTtcblxuICAvKipcbiAgICogQWRkIGEgdmFsaWRhdG9yIHRvIGEgU3VibmV0IG90aGVyIHRoYW4gdGhlIFByaW1hcnkgTmV0d29yay4gVGhlIHZhbGlkYXRvciBtdXN0IHZhbGlkYXRlIHRoZSBQcmltYXJ5IE5ldHdvcmsgZm9yIHRoZSBlbnRpcmUgZHVyYXRpb24gdGhleSB2YWxpZGF0ZSB0aGlzIFN1Ym5ldC5cbiAgICpcbiAgICogQHBhcmFtIHVzZXJuYW1lIFRoZSB1c2VybmFtZSBvZiB0aGUgS2V5c3RvcmUgdXNlclxuICAgKiBAcGFyYW0gcGFzc3dvcmQgVGhlIHBhc3N3b3JkIG9mIHRoZSBLZXlzdG9yZSB1c2VyXG4gICAqIEBwYXJhbSBub2RlSUQgVGhlIG5vZGUgSUQgb2YgdGhlIHZhbGlkYXRvclxuICAgKiBAcGFyYW0gc3VibmV0SUQgRWl0aGVyIGEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0gb3IgYSBjYjU4IHNlcmlhbGl6ZWQgc3RyaW5nIGZvciB0aGUgU3VibmV0SUQgb3IgaXRzIGFsaWFzLlxuICAgKiBAcGFyYW0gc3RhcnRUaW1lIEphdmFzY3JpcHQgRGF0ZSBvYmplY3QgZm9yIHRoZSBzdGFydCB0aW1lIHRvIHZhbGlkYXRlXG4gICAqIEBwYXJhbSBlbmRUaW1lIEphdmFzY3JpcHQgRGF0ZSBvYmplY3QgZm9yIHRoZSBlbmQgdGltZSB0byB2YWxpZGF0ZVxuICAgKiBAcGFyYW0gd2VpZ2h0IFRoZSB2YWxpZGF0b3LigJlzIHdlaWdodCB1c2VkIGZvciBzYW1wbGluZ1xuICAgKlxuICAgKiBAcmV0dXJucyBQcm9taXNlIGZvciB0aGUgdW5zaWduZWQgdHJhbnNhY3Rpb24uIEl0IG11c3QgYmUgc2lnbmVkICh1c2luZyBzaWduKSBieSB0aGUgcHJvcGVyIG51bWJlciBvZiB0aGUgU3VibmV04oCZcyBjb250cm9sIGtleXMgYW5kIGJ5IHRoZSBrZXkgb2YgdGhlIGFjY291bnQgcGF5aW5nIHRoZSB0cmFuc2FjdGlvbiBmZWUgYmVmb3JlIGl0IGNhbiBiZSBpc3N1ZWQuXG4gICAqL1xuICBhZGRTdWJuZXRWYWxpZGF0b3IgPSBhc3luYyAoXG4gICAgdXNlcm5hbWU6c3RyaW5nLFxuICAgIHBhc3N3b3JkOnN0cmluZyxcbiAgICBub2RlSUQ6c3RyaW5nLFxuICAgIHN1Ym5ldElEOkJ1ZmZlciB8IHN0cmluZyxcbiAgICBzdGFydFRpbWU6RGF0ZSxcbiAgICBlbmRUaW1lOkRhdGUsXG4gICAgd2VpZ2h0Om51bWJlclxuICAgIClcbiAgOlByb21pc2U8c3RyaW5nPiA9PiB7XG4gICAgY29uc3QgcGFyYW1zOmFueSA9IHtcbiAgICAgIHVzZXJuYW1lLFxuICAgICAgcGFzc3dvcmQsXG4gICAgICBub2RlSUQsXG4gICAgICBzdGFydFRpbWU6IHN0YXJ0VGltZS5nZXRUaW1lKCkgLyAxMDAwLFxuICAgICAgZW5kVGltZTogZW5kVGltZS5nZXRUaW1lKCkgLyAxMDAwLFxuICAgICAgd2VpZ2h0XG4gICAgfTtcbiAgICBpZiAodHlwZW9mIHN1Ym5ldElEID09PSAnc3RyaW5nJykge1xuICAgICAgcGFyYW1zLnN1Ym5ldElEID0gc3VibmV0SUQ7XG4gICAgfSBlbHNlIGlmICh0eXBlb2Ygc3VibmV0SUQgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICBwYXJhbXMuc3VibmV0SUQgPSBiaW50b29scy5jYjU4RW5jb2RlKHN1Ym5ldElEKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuY2FsbE1ldGhvZCgncGxhdGZvcm0uYWRkU3VibmV0VmFsaWRhdG9yJywgcGFyYW1zKVxuICAgICAgLnRoZW4oKHJlc3BvbnNlOlJlcXVlc3RSZXNwb25zZURhdGEpID0+IHJlc3BvbnNlLmRhdGEucmVzdWx0LnR4SUQpO1xuICB9O1xuXG4gIC8qKlxuICAgKiBBZGQgYSBkZWxlZ2F0b3IgdG8gdGhlIFByaW1hcnkgTmV0d29yay5cbiAgICpcbiAgICogQHBhcmFtIHVzZXJuYW1lIFRoZSB1c2VybmFtZSBvZiB0aGUgS2V5c3RvcmUgdXNlclxuICAgKiBAcGFyYW0gcGFzc3dvcmQgVGhlIHBhc3N3b3JkIG9mIHRoZSBLZXlzdG9yZSB1c2VyXG4gICAqIEBwYXJhbSBub2RlSUQgVGhlIG5vZGUgSUQgb2YgdGhlIGRlbGVnYXRlZVxuICAgKiBAcGFyYW0gc3RhcnRUaW1lIEphdmFzY3JpcHQgRGF0ZSBvYmplY3QgZm9yIHdoZW4gdGhlIGRlbGVnYXRvciBzdGFydHMgZGVsZWdhdGluZ1xuICAgKiBAcGFyYW0gZW5kVGltZSBKYXZhc2NyaXB0IERhdGUgb2JqZWN0IGZvciB3aGVuIHRoZSBkZWxlZ2F0b3Igc3RhcnRzIGRlbGVnYXRpbmdcbiAgICogQHBhcmFtIHN0YWtlQW1vdW50IFRoZSBhbW91bnQgb2YgbkFWQVggdGhlIGRlbGVnYXRvciBpcyBzdGFraW5nIGFzXG4gICAqIGEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9pbmR1dG55L2JuLmpzL3xCTn1cbiAgICogQHBhcmFtIHJld2FyZEFkZHJlc3MgVGhlIGFkZHJlc3Mgb2YgdGhlIGFjY291bnQgdGhlIHN0YWtlZCBBVkFYIGFuZCB2YWxpZGF0aW9uIHJld2FyZFxuICAgKiAoaWYgYXBwbGljYWJsZSkgYXJlIHNlbnQgdG8gYXQgZW5kVGltZVxuICAgKlxuICAgKiBAcmV0dXJucyBQcm9taXNlIGZvciBhbiBhcnJheSBvZiB2YWxpZGF0b3IncyBzdGFraW5nSURzLlxuICAgKi9cbiAgYWRkRGVsZWdhdG9yID0gYXN5bmMgKFxuICAgIHVzZXJuYW1lOnN0cmluZyxcbiAgICBwYXNzd29yZDpzdHJpbmcsXG4gICAgbm9kZUlEOnN0cmluZyxcbiAgICBzdGFydFRpbWU6RGF0ZSxcbiAgICBlbmRUaW1lOkRhdGUsXG4gICAgc3Rha2VBbW91bnQ6Qk4sXG4gICAgcmV3YXJkQWRkcmVzczpzdHJpbmcpXG4gIDpQcm9taXNlPHN0cmluZz4gPT4ge1xuICAgIGNvbnN0IHBhcmFtczphbnkgPSB7XG4gICAgICB1c2VybmFtZSxcbiAgICAgIHBhc3N3b3JkLFxuICAgICAgbm9kZUlELFxuICAgICAgc3RhcnRUaW1lOiBzdGFydFRpbWUuZ2V0VGltZSgpIC8gMTAwMCxcbiAgICAgIGVuZFRpbWU6IGVuZFRpbWUuZ2V0VGltZSgpIC8gMTAwMCxcbiAgICAgIHN0YWtlQW1vdW50OiBzdGFrZUFtb3VudC50b1N0cmluZygxMCksXG4gICAgICByZXdhcmRBZGRyZXNzLFxuICAgIH07XG4gICAgcmV0dXJuIHRoaXMuY2FsbE1ldGhvZCgncGxhdGZvcm0uYWRkRGVsZWdhdG9yJywgcGFyYW1zKVxuICAgICAgLnRoZW4oKHJlc3BvbnNlOlJlcXVlc3RSZXNwb25zZURhdGEpID0+IHJlc3BvbnNlLmRhdGEucmVzdWx0LnR4SUQpO1xuICB9O1xuXG4gIC8qKlxuICAgKiBDcmVhdGUgYW4gdW5zaWduZWQgdHJhbnNhY3Rpb24gdG8gY3JlYXRlIGEgbmV3IFN1Ym5ldC4gVGhlIHVuc2lnbmVkIHRyYW5zYWN0aW9uIG11c3QgYmVcbiAgICogc2lnbmVkIHdpdGggdGhlIGtleSBvZiB0aGUgYWNjb3VudCBwYXlpbmcgdGhlIHRyYW5zYWN0aW9uIGZlZS4gVGhlIFN1Ym5ldOKAmXMgSUQgaXMgdGhlIElEIG9mIHRoZSB0cmFuc2FjdGlvbiB0aGF0IGNyZWF0ZXMgaXQgKGllIHRoZSByZXNwb25zZSBmcm9tIGlzc3VlVHggd2hlbiBpc3N1aW5nIHRoZSBzaWduZWQgdHJhbnNhY3Rpb24pLlxuICAgKlxuICAgKiBAcGFyYW0gdXNlcm5hbWUgVGhlIHVzZXJuYW1lIG9mIHRoZSBLZXlzdG9yZSB1c2VyXG4gICAqIEBwYXJhbSBwYXNzd29yZCBUaGUgcGFzc3dvcmQgb2YgdGhlIEtleXN0b3JlIHVzZXJcbiAgICogQHBhcmFtIGNvbnRyb2xLZXlzIEFycmF5IG9mIHBsYXRmb3JtIGFkZHJlc3NlcyBhcyBzdHJpbmdzXG4gICAqIEBwYXJhbSB0aHJlc2hvbGQgVG8gYWRkIGEgdmFsaWRhdG9yIHRvIHRoaXMgU3VibmV0LCBhIHRyYW5zYWN0aW9uIG11c3QgaGF2ZSB0aHJlc2hvbGRcbiAgICogc2lnbmF0dXJlcywgd2hlcmUgZWFjaCBzaWduYXR1cmUgaXMgZnJvbSBhIGtleSB3aG9zZSBhZGRyZXNzIGlzIGFuIGVsZW1lbnQgb2YgYGNvbnRyb2xLZXlzYFxuICAgKlxuICAgKiBAcmV0dXJucyBQcm9taXNlIGZvciBhIHN0cmluZyB3aXRoIHRoZSB1bnNpZ25lZCB0cmFuc2FjdGlvbiBlbmNvZGVkIGFzIGJhc2U1OC5cbiAgICovXG4gIGNyZWF0ZVN1Ym5ldCA9IGFzeW5jIChcbiAgICB1c2VybmFtZTogc3RyaW5nLCBcbiAgICBwYXNzd29yZDpzdHJpbmcsXG4gICAgY29udHJvbEtleXM6QXJyYXk8c3RyaW5nPiwgXG4gICAgdGhyZXNob2xkOm51bWJlclxuICApXG4gIDpQcm9taXNlPHN0cmluZz4gPT4ge1xuICAgIGNvbnN0IHBhcmFtczphbnkgPSB7XG4gICAgICB1c2VybmFtZSxcbiAgICAgIHBhc3N3b3JkLFxuICAgICAgY29udHJvbEtleXMsXG4gICAgICB0aHJlc2hvbGRcbiAgICB9O1xuICAgIHJldHVybiB0aGlzLmNhbGxNZXRob2QoJ3BsYXRmb3JtLmNyZWF0ZVN1Ym5ldCcsIHBhcmFtcylcbiAgICAgIC50aGVuKChyZXNwb25zZTpSZXF1ZXN0UmVzcG9uc2VEYXRhKSA9PiByZXNwb25zZS5kYXRhLnJlc3VsdC50eElEKTtcbiAgfTtcblxuICAvKipcbiAgICogR2V0IHRoZSBTdWJuZXQgdGhhdCB2YWxpZGF0ZXMgYSBnaXZlbiBibG9ja2NoYWluLlxuICAgKlxuICAgKiBAcGFyYW0gYmxvY2tjaGFpbklEIEVpdGhlciBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IG9yIGEgY2I1OCBcbiAgICogZW5jb2RlZCBzdHJpbmcgZm9yIHRoZSBibG9ja2NoYWluSUQgb3IgaXRzIGFsaWFzLlxuICAgKlxuICAgKiBAcmV0dXJucyBQcm9taXNlIGZvciBhIHN0cmluZyBvZiB0aGUgc3VibmV0SUQgdGhhdCB2YWxpZGF0ZXMgdGhlIGJsb2NrY2hhaW4uXG4gICAqL1xuICB2YWxpZGF0ZWRCeSA9IGFzeW5jIChibG9ja2NoYWluSUQ6c3RyaW5nKTpQcm9taXNlPHN0cmluZz4gPT4ge1xuICAgIGNvbnN0IHBhcmFtczphbnkgPSB7XG4gICAgICBibG9ja2NoYWluSUQsXG4gICAgfTtcbiAgICByZXR1cm4gdGhpcy5jYWxsTWV0aG9kKCdwbGF0Zm9ybS52YWxpZGF0ZWRCeScsIHBhcmFtcylcbiAgICAgIC50aGVuKChyZXNwb25zZTpSZXF1ZXN0UmVzcG9uc2VEYXRhKSA9PiByZXNwb25zZS5kYXRhLnJlc3VsdC5zdWJuZXRJRCk7XG4gIH07XG5cbiAgLyoqXG4gICAqIEdldCB0aGUgSURzIG9mIHRoZSBibG9ja2NoYWlucyBhIFN1Ym5ldCB2YWxpZGF0ZXMuXG4gICAqXG4gICAqIEBwYXJhbSBzdWJuZXRJRCBFaXRoZXIgYSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSBvciBhbiBBVkFYXG4gICAqIHNlcmlhbGl6ZWQgc3RyaW5nIGZvciB0aGUgU3VibmV0SUQgb3IgaXRzIGFsaWFzLlxuICAgKlxuICAgKiBAcmV0dXJucyBQcm9taXNlIGZvciBhbiBhcnJheSBvZiBibG9ja2NoYWluSURzIHRoZSBzdWJuZXQgdmFsaWRhdGVzLlxuICAgKi9cbiAgdmFsaWRhdGVzID0gYXN5bmMgKHN1Ym5ldElEOkJ1ZmZlciB8IHN0cmluZyk6UHJvbWlzZTxBcnJheTxzdHJpbmc+PiA9PiB7XG4gICAgY29uc3QgcGFyYW1zOmFueSA9IHtcbiAgICAgIHN1Ym5ldElELFxuICAgIH07XG4gICAgaWYgKHR5cGVvZiBzdWJuZXRJRCA9PT0gJ3N0cmluZycpIHtcbiAgICAgIHBhcmFtcy5zdWJuZXRJRCA9IHN1Ym5ldElEO1xuICAgIH0gZWxzZSBpZiAodHlwZW9mIHN1Ym5ldElEICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgcGFyYW1zLnN1Ym5ldElEID0gYmludG9vbHMuY2I1OEVuY29kZShzdWJuZXRJRCk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLmNhbGxNZXRob2QoJ3BsYXRmb3JtLnZhbGlkYXRlcycsIHBhcmFtcylcbiAgICAgIC50aGVuKChyZXNwb25zZTpSZXF1ZXN0UmVzcG9uc2VEYXRhKSA9PiByZXNwb25zZS5kYXRhLnJlc3VsdC5ibG9ja2NoYWluSURzKTtcbiAgfTtcblxuICAvKipcbiAgICogR2V0IGFsbCB0aGUgYmxvY2tjaGFpbnMgdGhhdCBleGlzdCAoZXhjbHVkaW5nIHRoZSBQLUNoYWluKS5cbiAgICpcbiAgICogQHJldHVybnMgUHJvbWlzZSBmb3IgYW4gYXJyYXkgb2Ygb2JqZWN0cyBjb250YWluaW5nIGZpZWxkcyBcImlkXCIsIFwic3VibmV0SURcIiwgYW5kIFwidm1JRFwiLlxuICAgKi9cbiAgZ2V0QmxvY2tjaGFpbnMgPSBhc3luYyAoKTpQcm9taXNlPEFycmF5PG9iamVjdD4+ID0+IHtcbiAgICBjb25zdCBwYXJhbXM6YW55ID0ge307XG4gICAgcmV0dXJuIHRoaXMuY2FsbE1ldGhvZCgncGxhdGZvcm0uZ2V0QmxvY2tjaGFpbnMnLCBwYXJhbXMpXG4gICAgICAudGhlbigocmVzcG9uc2U6UmVxdWVzdFJlc3BvbnNlRGF0YSkgPT4gcmVzcG9uc2UuZGF0YS5yZXN1bHQuYmxvY2tjaGFpbnMpO1xuICB9O1xuXG4gIC8qKlxuICAgKiBTZW5kIEFWQVggZnJvbSBhbiBhY2NvdW50IG9uIHRoZSBQLUNoYWluIHRvIGFuIGFkZHJlc3Mgb24gdGhlIFgtQ2hhaW4uIFRoaXMgdHJhbnNhY3Rpb25cbiAgICogbXVzdCBiZSBzaWduZWQgd2l0aCB0aGUga2V5IG9mIHRoZSBhY2NvdW50IHRoYXQgdGhlIEFWQVggaXMgc2VudCBmcm9tIGFuZCB3aGljaCBwYXlzIHRoZVxuICAgKiB0cmFuc2FjdGlvbiBmZWUuIEFmdGVyIGlzc3VpbmcgdGhpcyB0cmFuc2FjdGlvbiwgeW91IG11c3QgY2FsbCB0aGUgWC1DaGFpbuKAmXMgaW1wb3J0QVZBWFxuICAgKiBtZXRob2QgdG8gY29tcGxldGUgdGhlIHRyYW5zZmVyLlxuICAgKlxuICAgKiBAcGFyYW0gdXNlcm5hbWUgVGhlIEtleXN0b3JlIHVzZXIgdGhhdCBjb250cm9scyB0aGUgYWNjb3VudCBzcGVjaWZpZWQgaW4gYHRvYFxuICAgKiBAcGFyYW0gcGFzc3dvcmQgVGhlIHBhc3N3b3JkIG9mIHRoZSBLZXlzdG9yZSB1c2VyXG4gICAqIEBwYXJhbSB0byBUaGUgYWRkcmVzcyBvbiB0aGUgWC1DaGFpbiB0byBzZW5kIHRoZSBBVkFYIHRvLiBEbyBub3QgaW5jbHVkZSBYLSBpbiB0aGUgYWRkcmVzc1xuICAgKiBAcGFyYW0gYW1vdW50IEFtb3VudCBvZiBBVkFYIHRvIGV4cG9ydCBhcyBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vaW5kdXRueS9ibi5qcy98Qk59XG4gICAqXG4gICAqIEByZXR1cm5zIFByb21pc2UgZm9yIGFuIHVuc2lnbmVkIHRyYW5zYWN0aW9uIHRvIGJlIHNpZ25lZCBieSB0aGUgYWNjb3VudCB0aGUgdGhlIEFWQVggaXNcbiAgICogc2VudCBmcm9tIGFuZCBwYXlzIHRoZSB0cmFuc2FjdGlvbiBmZWUuXG4gICAqL1xuICBleHBvcnRBVkFYID0gYXN5bmMgKHVzZXJuYW1lOiBzdHJpbmcsIHBhc3N3b3JkOnN0cmluZywgYW1vdW50OkJOLCB0bzpzdHJpbmcsKTpQcm9taXNlPHN0cmluZz4gPT4ge1xuICAgIGNvbnN0IHBhcmFtczphbnkgPSB7XG4gICAgICB1c2VybmFtZSxcbiAgICAgIHBhc3N3b3JkLFxuICAgICAgdG8sXG4gICAgICBhbW91bnQ6IGFtb3VudC50b1N0cmluZygxMClcbiAgICB9O1xuICAgIHJldHVybiB0aGlzLmNhbGxNZXRob2QoJ3BsYXRmb3JtLmV4cG9ydEFWQVgnLCBwYXJhbXMpXG4gICAgICAudGhlbigocmVzcG9uc2U6UmVxdWVzdFJlc3BvbnNlRGF0YSkgPT4gcmVzcG9uc2UuZGF0YS5yZXN1bHQudHhJRCk7XG4gIH07XG5cbiAgLyoqXG4gICAqIFNlbmQgQVZBWCBmcm9tIGFuIGFjY291bnQgb24gdGhlIFAtQ2hhaW4gdG8gYW4gYWRkcmVzcyBvbiB0aGUgWC1DaGFpbi4gVGhpcyB0cmFuc2FjdGlvblxuICAgKiBtdXN0IGJlIHNpZ25lZCB3aXRoIHRoZSBrZXkgb2YgdGhlIGFjY291bnQgdGhhdCB0aGUgQVZBWCBpcyBzZW50IGZyb20gYW5kIHdoaWNoIHBheXNcbiAgICogdGhlIHRyYW5zYWN0aW9uIGZlZS4gQWZ0ZXIgaXNzdWluZyB0aGlzIHRyYW5zYWN0aW9uLCB5b3UgbXVzdCBjYWxsIHRoZSBYLUNoYWlu4oCZc1xuICAgKiBpbXBvcnRBVkFYIG1ldGhvZCB0byBjb21wbGV0ZSB0aGUgdHJhbnNmZXIuXG4gICAqXG4gICAqIEBwYXJhbSB1c2VybmFtZSBUaGUgS2V5c3RvcmUgdXNlciB0aGF0IGNvbnRyb2xzIHRoZSBhY2NvdW50IHNwZWNpZmllZCBpbiBgdG9gXG4gICAqIEBwYXJhbSBwYXNzd29yZCBUaGUgcGFzc3dvcmQgb2YgdGhlIEtleXN0b3JlIHVzZXJcbiAgICogQHBhcmFtIHRvIFRoZSBJRCBvZiB0aGUgYWNjb3VudCB0aGUgQVZBWCBpcyBzZW50IHRvLiBUaGlzIG11c3QgYmUgdGhlIHNhbWUgYXMgdGhlIHRvXG4gICAqIGFyZ3VtZW50IGluIHRoZSBjb3JyZXNwb25kaW5nIGNhbGwgdG8gdGhlIFgtQ2hhaW7igJlzIGV4cG9ydEFWQVhcbiAgICogQHBhcmFtIHNvdXJjZUNoYWluIFRoZSBjaGFpbklEIHdoZXJlIHRoZSBmdW5kcyBhcmUgY29taW5nIGZyb20uXG4gICAqXG4gICAqIEByZXR1cm5zIFByb21pc2UgZm9yIGEgc3RyaW5nIGZvciB0aGUgdHJhbnNhY3Rpb24sIHdoaWNoIHNob3VsZCBiZSBzZW50IHRvIHRoZSBuZXR3b3JrXG4gICAqIGJ5IGNhbGxpbmcgaXNzdWVUeC5cbiAgICovXG4gIGltcG9ydEFWQVggPSBhc3luYyAodXNlcm5hbWU6IHN0cmluZywgcGFzc3dvcmQ6c3RyaW5nLCB0bzpzdHJpbmcsIHNvdXJjZUNoYWluOnN0cmluZylcbiAgOlByb21pc2U8c3RyaW5nPiA9PiB7XG4gICAgY29uc3QgcGFyYW1zOmFueSA9IHtcbiAgICAgIHRvLFxuICAgICAgc291cmNlQ2hhaW4sXG4gICAgICB1c2VybmFtZSxcbiAgICAgIHBhc3N3b3JkLFxuICAgIH07XG4gICAgcmV0dXJuIHRoaXMuY2FsbE1ldGhvZCgncGxhdGZvcm0uaW1wb3J0QVZBWCcsIHBhcmFtcylcbiAgICAgIC50aGVuKChyZXNwb25zZTpSZXF1ZXN0UmVzcG9uc2VEYXRhKSA9PiByZXNwb25zZS5kYXRhLnJlc3VsdC50eElEKTtcbiAgfTtcblxuICAvKipcbiAgICogQ2FsbHMgdGhlIG5vZGUncyBpc3N1ZVR4IG1ldGhvZCBmcm9tIHRoZSBBUEkgYW5kIHJldHVybnMgdGhlIHJlc3VsdGluZyB0cmFuc2FjdGlvbiBJRCBhcyBhIHN0cmluZy5cbiAgICpcbiAgICogQHBhcmFtIHR4IEEgc3RyaW5nLCB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSwgb3IgW1tUeF1dIHJlcHJlc2VudGluZyBhIHRyYW5zYWN0aW9uXG4gICAqXG4gICAqIEByZXR1cm5zIEEgUHJvbWlzZTxzdHJpbmc+IHJlcHJlc2VudGluZyB0aGUgdHJhbnNhY3Rpb24gSUQgb2YgdGhlIHBvc3RlZCB0cmFuc2FjdGlvbi5cbiAgICovXG4gIGlzc3VlVHggPSBhc3luYyAodHg6c3RyaW5nIHwgQnVmZmVyIHwgVHgpOlByb21pc2U8c3RyaW5nPiA9PiB7XG4gICAgbGV0IFRyYW5zYWN0aW9uID0gJyc7XG4gICAgaWYgKHR5cGVvZiB0eCA9PT0gJ3N0cmluZycpIHtcbiAgICAgIFRyYW5zYWN0aW9uID0gdHg7XG4gICAgfSBlbHNlIGlmICh0eCBpbnN0YW5jZW9mIEJ1ZmZlcikge1xuICAgICAgY29uc3QgdHhvYmo6VHggPSBuZXcgVHgoKTtcbiAgICAgIHR4b2JqLmZyb21CdWZmZXIodHgpO1xuICAgICAgVHJhbnNhY3Rpb24gPSB0eG9iai50b1N0cmluZygpO1xuICAgIH0gZWxzZSBpZiAodHggaW5zdGFuY2VvZiBUeCkge1xuICAgICAgVHJhbnNhY3Rpb24gPSB0eC50b1N0cmluZygpO1xuICAgIH0gZWxzZSB7XG4gICAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdFcnJvciAtIHBsYXRmb3JtLmlzc3VlVHg6IHByb3ZpZGVkIHR4IGlzIG5vdCBleHBlY3RlZCB0eXBlIG9mIHN0cmluZywgQnVmZmVyLCBvciBUeCcpO1xuICAgIH1cbiAgICBjb25zdCBwYXJhbXM6YW55ID0ge1xuICAgICAgdHg6IFRyYW5zYWN0aW9uLnRvU3RyaW5nKCksXG4gICAgfTtcbiAgICByZXR1cm4gdGhpcy5jYWxsTWV0aG9kKCdwbGF0Zm9ybS5pc3N1ZVR4JywgcGFyYW1zKS50aGVuKChyZXNwb25zZTpSZXF1ZXN0UmVzcG9uc2VEYXRhKSA9PiByZXNwb25zZS5kYXRhLnJlc3VsdC50eElEKTtcbiAgfTtcblxuICAvKipcbiAgICogUmV0dXJucyBhbiB1cHBlciBib3VuZCBvbiB0aGUgYW1vdW50IG9mIHRva2VucyB0aGF0IGV4aXN0LiBOb3QgbW9ub3RvbmljYWxseSBpbmNyZWFzaW5nIGJlY2F1c2UgdGhpcyBudW1iZXIgY2FuIGdvIGRvd24gaWYgYSBzdGFrZXIncyByZXdhcmQgaXMgZGVuaWVkLlxuICAgKi9cbiAgZ2V0Q3VycmVudFN1cHBseSA9IGFzeW5jICgpOlByb21pc2U8Qk4+ID0+IHtcbiAgICBjb25zdCBwYXJhbXM6YW55ID0ge307XG4gICAgcmV0dXJuIHRoaXMuY2FsbE1ldGhvZCgncGxhdGZvcm0uZ2V0Q3VycmVudFN1cHBseScsIHBhcmFtcylcbiAgICAgIC50aGVuKChyZXNwb25zZTpSZXF1ZXN0UmVzcG9uc2VEYXRhKSA9PiBuZXcgQk4ocmVzcG9uc2UuZGF0YS5yZXN1bHQuc3VwcGx5LCAxMCkpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIGhlaWdodCBvZiB0aGUgcGxhdGZvcm0gY2hhaW4uXG4gICAqL1xuICBnZXRIZWlnaHQgPSBhc3luYyAoKTpQcm9taXNlPEJOPiA9PiB7XG4gICAgY29uc3QgcGFyYW1zOmFueSA9IHt9O1xuICAgIHJldHVybiB0aGlzLmNhbGxNZXRob2QoJ3BsYXRmb3JtLmdldEhlaWdodCcsIHBhcmFtcylcbiAgICAgIC50aGVuKChyZXNwb25zZTpSZXF1ZXN0UmVzcG9uc2VEYXRhKSA9PiBuZXcgQk4ocmVzcG9uc2UuZGF0YS5yZXN1bHQuaGVpZ2h0LCAxMCkpO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIG1pbmltdW0gc3Rha2luZyBhbW91bnQuXG4gICAqIFxuICAgKiBAcGFyYW0gcmVmcmVzaCBBIGJvb2xlYW4gdG8gYnlwYXNzIHRoZSBsb2NhbCBjYWNoZWQgdmFsdWUgb2YgTWluaW11bSBTdGFrZSBBbW91bnQsIHBvbGxpbmcgdGhlIG5vZGUgaW5zdGVhZC5cbiAgICovXG4gIGdldE1pblN0YWtlID0gYXN5bmMgKHJlZnJlc2g6Ym9vbGVhbiA9IGZhbHNlKTpQcm9taXNlPHttaW5WYWxpZGF0b3JTdGFrZTpCTiwgbWluRGVsZWdhdG9yU3Rha2U6Qk59PiA9PiB7XG4gICAgaWYocmVmcmVzaCAhPT0gdHJ1ZSAmJiB0eXBlb2YgdGhpcy5taW5WYWxpZGF0b3JTdGFrZSAhPT0gXCJ1bmRlZmluZWRcIiAmJiB0eXBlb2YgdGhpcy5taW5EZWxlZ2F0b3JTdGFrZSAhPT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgbWluVmFsaWRhdG9yU3Rha2U6IHRoaXMubWluVmFsaWRhdG9yU3Rha2UsXG4gICAgICAgIG1pbkRlbGVnYXRvclN0YWtlOiB0aGlzLm1pbkRlbGVnYXRvclN0YWtlXG4gICAgICB9O1xuICAgIH1cbiAgICBjb25zdCBwYXJhbXM6YW55ID0ge307XG4gICAgcmV0dXJuIHRoaXMuY2FsbE1ldGhvZCgncGxhdGZvcm0uZ2V0TWluU3Rha2UnLCBwYXJhbXMpXG4gICAgICAudGhlbigocmVzcG9uc2U6UmVxdWVzdFJlc3BvbnNlRGF0YSkgPT4ge1xuICAgICAgICB0aGlzLm1pblZhbGlkYXRvclN0YWtlID0gbmV3IEJOKHJlc3BvbnNlLmRhdGEucmVzdWx0Lm1pblZhbGlkYXRvclN0YWtlLCAxMCk7XG4gICAgICAgIHRoaXMubWluRGVsZWdhdG9yU3Rha2UgPSBuZXcgQk4ocmVzcG9uc2UuZGF0YS5yZXN1bHQubWluRGVsZWdhdG9yU3Rha2UsIDEwKTtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICBtaW5WYWxpZGF0b3JTdGFrZTogdGhpcy5taW5WYWxpZGF0b3JTdGFrZSxcbiAgICAgICAgICBtaW5EZWxlZ2F0b3JTdGFrZTogdGhpcy5taW5EZWxlZ2F0b3JTdGFrZVxuICAgICAgICB9O1xuICAgICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgbWluaW11bSBzdGFrZSBjYWNoZWQgaW4gdGhpcyBjbGFzcy5cbiAgICogQHBhcmFtIG1pblZhbGlkYXRvclN0YWtlIEEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9pbmR1dG55L2JuLmpzL3xCTn0gdG8gc2V0IHRoZSBtaW5pbXVtIHN0YWtlIGFtb3VudCBjYWNoZWQgaW4gdGhpcyBjbGFzcy5cbiAgICogQHBhcmFtIG1pbkRlbGVnYXRvclN0YWtlIEEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9pbmR1dG55L2JuLmpzL3xCTn0gdG8gc2V0IHRoZSBtaW5pbXVtIGRlbGVnYXRpb24gYW1vdW50IGNhY2hlZCBpbiB0aGlzIGNsYXNzLlxuICAgKi9cbiAgc2V0TWluU3Rha2UgPSAobWluVmFsaWRhdG9yU3Rha2U6Qk4gPSB1bmRlZmluZWQsIG1pbkRlbGVnYXRvclN0YWtlOkJOID0gdW5kZWZpbmVkKTp2b2lkID0+IHtcbiAgICBpZih0eXBlb2YgbWluVmFsaWRhdG9yU3Rha2UgIT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgIHRoaXMubWluVmFsaWRhdG9yU3Rha2UgPSBtaW5WYWxpZGF0b3JTdGFrZTtcbiAgICB9XG4gICAgaWYodHlwZW9mIG1pbkRlbGVnYXRvclN0YWtlICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICB0aGlzLm1pbkRlbGVnYXRvclN0YWtlID0gbWluRGVsZWdhdG9yU3Rha2U7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIHRvdGFsIGFtb3VudCBzdGFrZWQgZm9yIGFuIGFycmF5IG9mIGFkZHJlc3Nlcy5cbiAgICovXG4gIGdldFN0YWtlID0gYXN5bmMgKGFkZHJlc3NlczpBcnJheTxzdHJpbmc+KTpQcm9taXNlPEJOPiA9PiB7XG4gICAgY29uc3QgcGFyYW1zOmFueSA9IHtcbiAgICAgIGFkZHJlc3Nlc1xuICAgIH07XG4gICAgcmV0dXJuIHRoaXMuY2FsbE1ldGhvZCgncGxhdGZvcm0uZ2V0U3Rha2UnLCBwYXJhbXMpXG4gICAgICAudGhlbigocmVzcG9uc2U6UmVxdWVzdFJlc3BvbnNlRGF0YSkgPT4gbmV3IEJOKHJlc3BvbnNlLmRhdGEucmVzdWx0LnN0YWtlZCwgMTApKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgYWxsIHRoZSBzdWJuZXRzIHRoYXQgZXhpc3QuXG4gICAqXG4gICAqIEBwYXJhbSBpZHMgSURzIG9mIHRoZSBzdWJuZXRzIHRvIHJldHJpZXZlIGluZm9ybWF0aW9uIGFib3V0LiBJZiBvbWl0dGVkLCBnZXRzIGFsbCBzdWJuZXRzXG4gICAqIFxuICAgKiBAcmV0dXJucyBQcm9taXNlIGZvciBhbiBhcnJheSBvZiBvYmplY3RzIGNvbnRhaW5pbmcgZmllbGRzIFwiaWRcIixcbiAgICogXCJjb250cm9sS2V5c1wiLCBhbmQgXCJ0aHJlc2hvbGRcIi5cbiAgICovXG4gIGdldFN1Ym5ldHMgPSBhc3luYyAoaWRzOkFycmF5PHN0cmluZz4gPSB1bmRlZmluZWQpOlByb21pc2U8QXJyYXk8b2JqZWN0Pj4gPT4ge1xuICAgIGNvbnN0IHBhcmFtczphbnkgPSB7fTtcbiAgICBpZih0eXBlb2YgaWRzICE9PSB1bmRlZmluZWQpe1xuICAgICAgcGFyYW1zLmlkcyA9IGlkcztcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuY2FsbE1ldGhvZCgncGxhdGZvcm0uZ2V0U3VibmV0cycsIHBhcmFtcylcbiAgICAgIC50aGVuKChyZXNwb25zZTpSZXF1ZXN0UmVzcG9uc2VEYXRhKSA9PiByZXNwb25zZS5kYXRhLnJlc3VsdC5zdWJuZXRzKTtcbiAgfTtcblxuICAvKipcbiAgICogRXhwb3J0cyB0aGUgcHJpdmF0ZSBrZXkgZm9yIGFuIGFkZHJlc3MuXG4gICAqXG4gICAqIEBwYXJhbSB1c2VybmFtZSBUaGUgbmFtZSBvZiB0aGUgdXNlciB3aXRoIHRoZSBwcml2YXRlIGtleVxuICAgKiBAcGFyYW0gcGFzc3dvcmQgVGhlIHBhc3N3b3JkIHVzZWQgdG8gZGVjcnlwdCB0aGUgcHJpdmF0ZSBrZXlcbiAgICogQHBhcmFtIGFkZHJlc3MgVGhlIGFkZHJlc3Mgd2hvc2UgcHJpdmF0ZSBrZXkgc2hvdWxkIGJlIGV4cG9ydGVkXG4gICAqXG4gICAqIEByZXR1cm5zIFByb21pc2Ugd2l0aCB0aGUgZGVjcnlwdGVkIHByaXZhdGUga2V5IGFzIHN0b3JlIGluIHRoZSBkYXRhYmFzZVxuICAgKi9cbiAgZXhwb3J0S2V5ID0gYXN5bmMgKHVzZXJuYW1lOnN0cmluZywgcGFzc3dvcmQ6c3RyaW5nLCBhZGRyZXNzOnN0cmluZyk6UHJvbWlzZTxzdHJpbmc+ID0+IHtcbiAgICBjb25zdCBwYXJhbXM6YW55ID0ge1xuICAgICAgdXNlcm5hbWUsXG4gICAgICBwYXNzd29yZCxcbiAgICAgIGFkZHJlc3MsXG4gICAgfTtcbiAgICByZXR1cm4gdGhpcy5jYWxsTWV0aG9kKCdwbGF0Zm9ybS5leHBvcnRLZXknLCBwYXJhbXMpXG4gICAgICAudGhlbigocmVzcG9uc2U6UmVxdWVzdFJlc3BvbnNlRGF0YSkgPT4gcmVzcG9uc2UuZGF0YS5yZXN1bHQucHJpdmF0ZUtleSk7XG4gIH07XG5cbiAgLyoqXG4gICAqIEdpdmUgYSB1c2VyIGNvbnRyb2wgb3ZlciBhbiBhZGRyZXNzIGJ5IHByb3ZpZGluZyB0aGUgcHJpdmF0ZSBrZXkgdGhhdCBjb250cm9scyB0aGUgYWRkcmVzcy5cbiAgICpcbiAgICogQHBhcmFtIHVzZXJuYW1lIFRoZSBuYW1lIG9mIHRoZSB1c2VyIHRvIHN0b3JlIHRoZSBwcml2YXRlIGtleVxuICAgKiBAcGFyYW0gcGFzc3dvcmQgVGhlIHBhc3N3b3JkIHRoYXQgdW5sb2NrcyB0aGUgdXNlclxuICAgKiBAcGFyYW0gcHJpdmF0ZUtleSBBIHN0cmluZyByZXByZXNlbnRpbmcgdGhlIHByaXZhdGUga2V5IGluIHRoZSB2bSdzIGZvcm1hdFxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgYWRkcmVzcyBmb3IgdGhlIGltcG9ydGVkIHByaXZhdGUga2V5LlxuICAgKi9cbiAgaW1wb3J0S2V5ID0gYXN5bmMgKHVzZXJuYW1lOnN0cmluZywgcGFzc3dvcmQ6c3RyaW5nLCBwcml2YXRlS2V5OnN0cmluZyk6UHJvbWlzZTxzdHJpbmc+ID0+IHtcbiAgICBjb25zdCBwYXJhbXM6YW55ID0ge1xuICAgICAgdXNlcm5hbWUsXG4gICAgICBwYXNzd29yZCxcbiAgICAgIHByaXZhdGVLZXksXG4gICAgfTtcbiAgICByZXR1cm4gdGhpcy5jYWxsTWV0aG9kKCdwbGF0Zm9ybS5pbXBvcnRLZXknLCBwYXJhbXMpXG4gICAgICAudGhlbigocmVzcG9uc2U6UmVxdWVzdFJlc3BvbnNlRGF0YSkgPT4gcmVzcG9uc2UuZGF0YS5yZXN1bHQuYWRkcmVzcyk7XG4gIH07XG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIHRyZWFuc2FjdGlvbiBkYXRhIG9mIGEgcHJvdmlkZWQgdHJhbnNhY3Rpb24gSUQgYnkgY2FsbGluZyB0aGUgbm9kZSdzIGBnZXRUeGAgbWV0aG9kLlxuICAgKlxuICAgKiBAcGFyYW0gdHhpZCBUaGUgc3RyaW5nIHJlcHJlc2VudGF0aW9uIG9mIHRoZSB0cmFuc2FjdGlvbiBJRFxuICAgKlxuICAgKiBAcmV0dXJucyBSZXR1cm5zIGEgUHJvbWlzZTxzdHJpbmc+IGNvbnRhaW5pbmcgdGhlIGJ5dGVzIHJldHJpZXZlZCBmcm9tIHRoZSBub2RlXG4gICAqL1xuICBnZXRUeCA9IGFzeW5jICh0eGlkOnN0cmluZyk6UHJvbWlzZTxzdHJpbmc+ID0+IHtcbiAgICBjb25zdCBwYXJhbXM6YW55ID0ge1xuICAgICAgdHhJRDogdHhpZCxcbiAgICB9O1xuICAgIHJldHVybiB0aGlzLmNhbGxNZXRob2QoJ3BsYXRmb3JtLmdldFR4JywgcGFyYW1zKS50aGVuKChyZXNwb25zZTpSZXF1ZXN0UmVzcG9uc2VEYXRhKSA9PiByZXNwb25zZS5kYXRhLnJlc3VsdC50eCk7XG4gIH07XG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIHN0YXR1cyBvZiBhIHByb3ZpZGVkIHRyYW5zYWN0aW9uIElEIGJ5IGNhbGxpbmcgdGhlIG5vZGUncyBgZ2V0VHhTdGF0dXNgIG1ldGhvZC5cbiAgICpcbiAgICogQHBhcmFtIHR4aWQgVGhlIHN0cmluZyByZXByZXNlbnRhdGlvbiBvZiB0aGUgdHJhbnNhY3Rpb24gSURcbiAgICogQHBhcmFtIGluY2x1ZGVSZWFzb24gUmV0dXJuIHRoZSByZWFzb24gdHggd2FzIGRyb3BwZWQsIGlmIGFwcGxpY2FibGUuIERlZmF1bHRzIHRvIHRydWVcbiAgICpcbiAgICogQHJldHVybnMgUmV0dXJucyBhIFByb21pc2U8c3RyaW5nPiBjb250YWluaW5nIHRoZSBzdGF0dXMgcmV0cmlldmVkIGZyb20gdGhlIG5vZGUgYW5kIHRoZSByZWFzb24gYSB0eCB3YXMgZHJvcHBlZCwgaWYgYXBwbGljYWJsZS5cbiAgICovXG4gIGdldFR4U3RhdHVzID0gYXN5bmMgKHR4aWQ6c3RyaW5nLCBpbmNsdWRlUmVhc29uOmJvb2xlYW4gPSB0cnVlKTpQcm9taXNlPHN0cmluZ3x7c3RhdHVzOnN0cmluZywgcmVhc29uOnN0cmluZ30+ID0+IHtcbiAgICBjb25zdCBwYXJhbXM6YW55ID0ge1xuICAgICAgdHhJRDogdHhpZCxcbiAgICAgIGluY2x1ZGVSZWFzb246IGluY2x1ZGVSZWFzb25cbiAgICB9O1xuICAgIHJldHVybiB0aGlzLmNhbGxNZXRob2QoJ3BsYXRmb3JtLmdldFR4U3RhdHVzJywgcGFyYW1zKS50aGVuKChyZXNwb25zZTpSZXF1ZXN0UmVzcG9uc2VEYXRhKSA9PiByZXNwb25zZS5kYXRhLnJlc3VsdCk7XG4gIH07XG5cbiAgLyoqXG4gICAqIFJldHJpZXZlcyB0aGUgVVRYT3MgcmVsYXRlZCB0byB0aGUgYWRkcmVzc2VzIHByb3ZpZGVkIGZyb20gdGhlIG5vZGUncyBgZ2V0VVRYT3NgIG1ldGhvZC5cbiAgICpcbiAgICogQHBhcmFtIGFkZHJlc3NlcyBBbiBhcnJheSBvZiBhZGRyZXNzZXMgYXMgY2I1OCBzdHJpbmdzIG9yIGFkZHJlc3NlcyBhcyB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfXNcbiAgICogQHBhcmFtIHNvdXJjZUNoYWluIEEgc3RyaW5nIGZvciB0aGUgY2hhaW4gdG8gbG9vayBmb3IgdGhlIFVUWE8ncy4gRGVmYXVsdCBpcyB0byB1c2UgdGhpcyBjaGFpbiwgYnV0IGlmIGV4cG9ydGVkIFVUWE9zIGV4aXN0IGZyb20gb3RoZXIgY2hhaW5zLCB0aGlzIGNhbiB1c2VkIHRvIHB1bGwgdGhlbSBpbnN0ZWFkLlxuICAgKiBAcGFyYW0gbGltaXQgT3B0aW9uYWwuIFJldHVybnMgYXQgbW9zdCBbbGltaXRdIGFkZHJlc3Nlcy4gSWYgW2xpbWl0XSA9PSAwIG9yID4gW21heFVUWE9zVG9GZXRjaF0sIGZldGNoZXMgdXAgdG8gW21heFVUWE9zVG9GZXRjaF0uXG4gICAqIEBwYXJhbSBzdGFydEluZGV4IE9wdGlvbmFsLiBbU3RhcnRJbmRleF0gZGVmaW5lcyB3aGVyZSB0byBzdGFydCBmZXRjaGluZyBVVFhPcyAoZm9yIHBhZ2luYXRpb24uKVxuICAgKiBVVFhPcyBmZXRjaGVkIGFyZSBmcm9tIGFkZHJlc3NlcyBlcXVhbCB0byBvciBncmVhdGVyIHRoYW4gW1N0YXJ0SW5kZXguQWRkcmVzc11cbiAgICogRm9yIGFkZHJlc3MgW1N0YXJ0SW5kZXguQWRkcmVzc10sIG9ubHkgVVRYT3Mgd2l0aCBJRHMgZ3JlYXRlciB0aGFuIFtTdGFydEluZGV4LlV0eG9dIHdpbGwgYmUgcmV0dXJuZWQuXG4gICAqIEBwYXJhbSBwZXJzaXN0T3B0cyBPcHRpb25zIGF2YWlsYWJsZSB0byBwZXJzaXN0IHRoZXNlIFVUWE9zIGluIGxvY2FsIHN0b3JhZ2VcbiAgICpcbiAgICogQHJlbWFya3NcbiAgICogcGVyc2lzdE9wdHMgaXMgb3B0aW9uYWwgYW5kIG11c3QgYmUgb2YgdHlwZSBbW1BlcnNpc3RhbmNlT3B0aW9uc11dXG4gICAqXG4gICAqL1xuICBnZXRVVFhPcyA9IGFzeW5jIChcbiAgICBhZGRyZXNzZXM6QXJyYXk8c3RyaW5nPiB8IHN0cmluZyxcbiAgICBzb3VyY2VDaGFpbjpzdHJpbmcgPSB1bmRlZmluZWQsXG4gICAgbGltaXQ6bnVtYmVyID0gMCxcbiAgICBzdGFydEluZGV4OnthZGRyZXNzOnN0cmluZywgdXR4bzpzdHJpbmd9ID0gdW5kZWZpbmVkLFxuICAgIHBlcnNpc3RPcHRzOlBlcnNpc3RhbmNlT3B0aW9ucyA9IHVuZGVmaW5lZFxuICApOlByb21pc2U8e1xuICAgIG51bUZldGNoZWQ6bnVtYmVyLFxuICAgIHV0eG9zOlVUWE9TZXQsXG4gICAgZW5kSW5kZXg6e2FkZHJlc3M6c3RyaW5nLCB1dHhvOnN0cmluZ31cbiAgfT4gPT4ge1xuICAgIFxuICAgIGlmKHR5cGVvZiBhZGRyZXNzZXMgPT09IFwic3RyaW5nXCIpIHtcbiAgICAgIGFkZHJlc3NlcyA9IFthZGRyZXNzZXNdO1xuICAgIH1cblxuICAgIGNvbnN0IHBhcmFtczphbnkgPSB7XG4gICAgICBhZGRyZXNzZXM6IGFkZHJlc3NlcyxcbiAgICAgIGxpbWl0XG4gICAgfTtcbiAgICBpZih0eXBlb2Ygc3RhcnRJbmRleCAhPT0gXCJ1bmRlZmluZWRcIiAmJiBzdGFydEluZGV4KSB7XG4gICAgICBwYXJhbXMuc3RhcnRJbmRleCA9IHN0YXJ0SW5kZXg7XG4gICAgfVxuXG4gICAgaWYodHlwZW9mIHNvdXJjZUNoYWluICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICBwYXJhbXMuc291cmNlQ2hhaW4gPSBzb3VyY2VDaGFpbjtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy5jYWxsTWV0aG9kKCdwbGF0Zm9ybS5nZXRVVFhPcycsIHBhcmFtcykudGhlbigocmVzcG9uc2U6UmVxdWVzdFJlc3BvbnNlRGF0YSkgPT4ge1xuXG4gICAgICBjb25zdCB1dHhvczpVVFhPU2V0ID0gbmV3IFVUWE9TZXQoKTtcbiAgICAgIGxldCBkYXRhID0gcmVzcG9uc2UuZGF0YS5yZXN1bHQudXR4b3M7XG4gICAgICBpZiAocGVyc2lzdE9wdHMgJiYgdHlwZW9mIHBlcnNpc3RPcHRzID09PSAnb2JqZWN0Jykge1xuICAgICAgICBpZiAodGhpcy5kYi5oYXMocGVyc2lzdE9wdHMuZ2V0TmFtZSgpKSkge1xuICAgICAgICAgIGNvbnN0IHNlbGZBcnJheTpBcnJheTxzdHJpbmc+ID0gdGhpcy5kYi5nZXQocGVyc2lzdE9wdHMuZ2V0TmFtZSgpKTtcbiAgICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShzZWxmQXJyYXkpKSB7XG4gICAgICAgICAgICB1dHhvcy5hZGRBcnJheShkYXRhKTtcbiAgICAgICAgICAgIGNvbnN0IHNlbGY6VVRYT1NldCA9IG5ldyBVVFhPU2V0KCk7XG4gICAgICAgICAgICBzZWxmLmFkZEFycmF5KHNlbGZBcnJheSk7XG4gICAgICAgICAgICBzZWxmLm1lcmdlQnlSdWxlKHV0eG9zLCBwZXJzaXN0T3B0cy5nZXRNZXJnZVJ1bGUoKSk7XG4gICAgICAgICAgICBkYXRhID0gc2VsZi5nZXRBbGxVVFhPU3RyaW5ncygpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB0aGlzLmRiLnNldChwZXJzaXN0T3B0cy5nZXROYW1lKCksIGRhdGEsIHBlcnNpc3RPcHRzLmdldE92ZXJ3cml0ZSgpKTtcbiAgICAgIH1cbiAgICAgIHV0eG9zLmFkZEFycmF5KGRhdGEsIGZhbHNlKTtcbiAgICAgIHJlc3BvbnNlLmRhdGEucmVzdWx0LnV0eG9zID0gdXR4b3M7XG4gICAgICByZXNwb25zZS5kYXRhLnJlc3VsdC5udW1GZXRjaGVkID0gcGFyc2VJbnQocmVzcG9uc2UuZGF0YS5yZXN1bHQubnVtRmV0Y2hlZClcbiAgICAgIHJldHVybiByZXNwb25zZS5kYXRhLnJlc3VsdDtcbiAgICB9KTtcbiAgfTtcblxuXG4vKipcbiAqIEhlbHBlciBmdW5jdGlvbiB3aGljaCBjcmVhdGVzIGFuIHVuc2lnbmVkIEltcG9ydCBUeC4gRm9yIG1vcmUgZ3JhbnVsYXIgY29udHJvbCwgeW91IG1heSBjcmVhdGUgeW91ciBvd25cbiAqIFtbVW5zaWduZWRUeF1dIG1hbnVhbGx5ICh3aXRoIHRoZWlyIGNvcnJlc3BvbmRpbmcgW1tUcmFuc2ZlcmFibGVJbnB1dF1dcywgW1tUcmFuc2ZlcmFibGVPdXRwdXRdXXMsIGFuZCBbW1RyYW5zZmVyT3BlcmF0aW9uXV1zKS5cbiAqXG4gKiBAcGFyYW0gdXR4b3NldCBBIHNldCBvZiBVVFhPcyB0aGF0IHRoZSB0cmFuc2FjdGlvbiBpcyBidWlsdCBvblxuICogQHBhcmFtIG93bmVyQWRkcmVzc2VzIFRoZSBhZGRyZXNzZXMgYmVpbmcgdXNlZCB0byBpbXBvcnRcbiAqIEBwYXJhbSBzb3VyY2VDaGFpbiBUaGUgY2hhaW5pZCBmb3Igd2hlcmUgdGhlIGltcG9ydCBpcyBjb21pbmcgZnJvbS5cbiAqIEBwYXJhbSB0b0FkZHJlc3NlcyBUaGUgYWRkcmVzc2VzIHRvIHNlbmQgdGhlIGZ1bmRzXG4gKiBAcGFyYW0gZnJvbUFkZHJlc3NlcyBUaGUgYWRkcmVzc2VzIGJlaW5nIHVzZWQgdG8gc2VuZCB0aGUgZnVuZHMgZnJvbSB0aGUgVVRYT3MgcHJvdmlkZWRcbiAqIEBwYXJhbSBjaGFuZ2VBZGRyZXNzZXMgVGhlIGFkZHJlc3NlcyB0aGF0IGNhbiBzcGVuZCB0aGUgY2hhbmdlIHJlbWFpbmluZyBmcm9tIHRoZSBzcGVudCBVVFhPc1xuICogQHBhcmFtIG1lbW8gT3B0aW9uYWwgY29udGFpbnMgYXJiaXRyYXJ5IGJ5dGVzLCB1cCB0byAyNTYgYnl0ZXNcbiAqIEBwYXJhbSBhc09mIE9wdGlvbmFsLiBUaGUgdGltZXN0YW1wIHRvIHZlcmlmeSB0aGUgdHJhbnNhY3Rpb24gYWdhaW5zdCBhcyBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vaW5kdXRueS9ibi5qcy98Qk59XG4gKiBAcGFyYW0gbG9ja3RpbWUgT3B0aW9uYWwuIFRoZSBsb2NrdGltZSBmaWVsZCBjcmVhdGVkIGluIHRoZSByZXN1bHRpbmcgb3V0cHV0c1xuICogQHBhcmFtIHRocmVzaG9sZCBPcHRpb25hbC4gVGhlIG51bWJlciBvZiBzaWduYXR1cmVzIHJlcXVpcmVkIHRvIHNwZW5kIHRoZSBmdW5kcyBpbiB0aGUgcmVzdWx0YW50IFVUWE9cbiAqXG4gKiBAcmV0dXJucyBBbiB1bnNpZ25lZCB0cmFuc2FjdGlvbiAoW1tVbnNpZ25lZFR4XV0pIHdoaWNoIGNvbnRhaW5zIGEgW1tJbXBvcnRUeF1dLlxuICpcbiAqIEByZW1hcmtzXG4gKiBUaGlzIGhlbHBlciBleGlzdHMgYmVjYXVzZSB0aGUgZW5kcG9pbnQgQVBJIHNob3VsZCBiZSB0aGUgcHJpbWFyeSBwb2ludCBvZiBlbnRyeSBmb3IgbW9zdCBmdW5jdGlvbmFsaXR5LlxuICovXG4gIGJ1aWxkSW1wb3J0VHggPSBhc3luYyAoXG4gICAgdXR4b3NldDpVVFhPU2V0LCBcbiAgICBvd25lckFkZHJlc3NlczpBcnJheTxzdHJpbmc+LFxuICAgIHNvdXJjZUNoYWluOkJ1ZmZlciB8IHN0cmluZyxcbiAgICB0b0FkZHJlc3NlczpBcnJheTxzdHJpbmc+LCBcbiAgICBmcm9tQWRkcmVzc2VzOkFycmF5PHN0cmluZz4sXG4gICAgY2hhbmdlQWRkcmVzc2VzOkFycmF5PHN0cmluZz4gPSB1bmRlZmluZWQsXG4gICAgbWVtbzpQYXlsb2FkQmFzZXxCdWZmZXIgPSB1bmRlZmluZWQsIFxuICAgIGFzT2Y6Qk4gPSBVbml4Tm93KCksIFxuICAgIGxvY2t0aW1lOkJOID0gbmV3IEJOKDApLCBcbiAgICB0aHJlc2hvbGQ6bnVtYmVyID0gMVxuICApOlByb21pc2U8VW5zaWduZWRUeD4gPT4ge1xuICAgIGNvbnN0IHRvOkFycmF5PEJ1ZmZlcj4gPSB0aGlzLl9jbGVhbkFkZHJlc3NBcnJheSh0b0FkZHJlc3NlcywgJ2J1aWxkQmFzZVR4JykubWFwKChhKSA9PiBiaW50b29scy5zdHJpbmdUb0FkZHJlc3MoYSkpO1xuICAgIGNvbnN0IGZyb206QXJyYXk8QnVmZmVyPiA9IHRoaXMuX2NsZWFuQWRkcmVzc0FycmF5KGZyb21BZGRyZXNzZXMsICdidWlsZEJhc2VUeCcpLm1hcCgoYSkgPT4gYmludG9vbHMuc3RyaW5nVG9BZGRyZXNzKGEpKTtcbiAgICBjb25zdCBjaGFuZ2U6QXJyYXk8QnVmZmVyPiA9IHRoaXMuX2NsZWFuQWRkcmVzc0FycmF5KGNoYW5nZUFkZHJlc3NlcywgJ2J1aWxkQmFzZVR4JykubWFwKChhKSA9PiBiaW50b29scy5zdHJpbmdUb0FkZHJlc3MoYSkpO1xuXG4gICAgbGV0IHNyY0NoYWluOnN0cmluZyA9IHVuZGVmaW5lZDtcblxuICAgIGlmKHR5cGVvZiBzb3VyY2VDaGFpbiA9PT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiRXJyb3IgLSBQbGF0Zm9ybVZNQVBJLmJ1aWxkSW1wb3J0VHg6IFNvdXJjZSBDaGFpbklEIGlzIHVuZGVmaW5lZC5cIik7XG4gICAgfSBlbHNlIGlmICh0eXBlb2Ygc291cmNlQ2hhaW4gPT09IFwic3RyaW5nXCIpIHtcbiAgICAgIHNyY0NoYWluID0gc291cmNlQ2hhaW47XG4gICAgICBzb3VyY2VDaGFpbiA9IGJpbnRvb2xzLmNiNThEZWNvZGUoc291cmNlQ2hhaW4pO1xuICAgIH0gZWxzZSBpZighKHNvdXJjZUNoYWluIGluc3RhbmNlb2YgQnVmZmVyKSkge1xuICAgICAgc3JjQ2hhaW4gPSBiaW50b29scy5jYjU4RW5jb2RlKHNvdXJjZUNoYWluKTtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIkVycm9yIC0gUGxhdGZvcm1WTUFQSS5idWlsZEltcG9ydFR4OiBJbnZhbGlkIGRlc3RpbmF0aW9uQ2hhaW4gdHlwZTogXCIgKyAodHlwZW9mIHNvdXJjZUNoYWluKSApO1xuICAgIH1cbiAgICBjb25zdCBhdG9taWNVVFhPczpVVFhPU2V0ID0gYXdhaXQgKGF3YWl0IHRoaXMuZ2V0VVRYT3Mob3duZXJBZGRyZXNzZXMsIHNyY0NoYWluLCAwLCB1bmRlZmluZWQpKS51dHhvcztcbiAgICBjb25zdCBhdmF4QXNzZXRJRDpCdWZmZXIgPSBhd2FpdCB0aGlzLmdldEFWQVhBc3NldElEKCk7XG5cbiAgICBpZiggbWVtbyBpbnN0YW5jZW9mIFBheWxvYWRCYXNlKSB7XG4gICAgICBtZW1vID0gbWVtby5nZXRQYXlsb2FkKCk7XG4gICAgfVxuXG4gICAgY29uc3QgYXRvbWljcyA9IGF0b21pY1VUWE9zLmdldEFsbFVUWE9zKCk7XG5cbiAgICBjb25zdCBidWlsdFVuc2lnbmVkVHg6VW5zaWduZWRUeCA9IHV0eG9zZXQuYnVpbGRJbXBvcnRUeChcbiAgICAgIHRoaXMuY29yZS5nZXROZXR3b3JrSUQoKSwgXG4gICAgICBiaW50b29scy5jYjU4RGVjb2RlKHRoaXMuYmxvY2tjaGFpbklEKSwgXG4gICAgICB0byxcbiAgICAgIGZyb20sXG4gICAgICBjaGFuZ2UsXG4gICAgICBhdG9taWNzLCBcbiAgICAgIHNvdXJjZUNoYWluLFxuICAgICAgdGhpcy5nZXRUeEZlZSgpLCBcbiAgICAgIGF2YXhBc3NldElELCBcbiAgICAgIG1lbW8sIGFzT2YsIGxvY2t0aW1lLCB0aHJlc2hvbGRcbiAgICApO1xuXG4gICAgaWYoISBhd2FpdCB0aGlzLmNoZWNrR29vc2VFZ2coYnVpbHRVbnNpZ25lZFR4KSkge1xuICAgICAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cbiAgICAgIHRocm93IG5ldyBFcnJvcihcIkZhaWxlZCBHb29zZSBFZ2cgQ2hlY2tcIik7XG4gICAgfVxuXG4gICAgcmV0dXJuIGJ1aWx0VW5zaWduZWRUeDtcbiAgfTtcblxuICAvKipcbiAgICogSGVscGVyIGZ1bmN0aW9uIHdoaWNoIGNyZWF0ZXMgYW4gdW5zaWduZWQgRXhwb3J0IFR4LiBGb3IgbW9yZSBncmFudWxhciBjb250cm9sLCB5b3UgbWF5IGNyZWF0ZSB5b3VyIG93blxuICAgKiBbW1Vuc2lnbmVkVHhdXSBtYW51YWxseSAod2l0aCB0aGVpciBjb3JyZXNwb25kaW5nIFtbVHJhbnNmZXJhYmxlSW5wdXRdXXMsIFtbVHJhbnNmZXJhYmxlT3V0cHV0XV1zLCBhbmQgW1tUcmFuc2Zlck9wZXJhdGlvbl1dcykuXG4gICAqXG4gICAqIEBwYXJhbSB1dHhvc2V0IEEgc2V0IG9mIFVUWE9zIHRoYXQgdGhlIHRyYW5zYWN0aW9uIGlzIGJ1aWx0IG9uXG4gICAqIEBwYXJhbSBhbW91bnQgVGhlIGFtb3VudCBiZWluZyBleHBvcnRlZCBhcyBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vaW5kdXRueS9ibi5qcy98Qk59XG4gICAqIEBwYXJhbSBkZXN0aW5hdGlvbkNoYWluIFRoZSBjaGFpbmlkIGZvciB3aGVyZSB0aGUgYXNzZXRzIHdpbGwgYmUgc2VudC5cbiAgICogQHBhcmFtIHRvQWRkcmVzc2VzIFRoZSBhZGRyZXNzZXMgdG8gc2VuZCB0aGUgZnVuZHNcbiAgICogQHBhcmFtIGZyb21BZGRyZXNzZXMgVGhlIGFkZHJlc3NlcyBiZWluZyB1c2VkIHRvIHNlbmQgdGhlIGZ1bmRzIGZyb20gdGhlIFVUWE9zIHByb3ZpZGVkXG4gICAqIEBwYXJhbSBjaGFuZ2VBZGRyZXNzZXMgVGhlIGFkZHJlc3NlcyB0aGF0IGNhbiBzcGVuZCB0aGUgY2hhbmdlIHJlbWFpbmluZyBmcm9tIHRoZSBzcGVudCBVVFhPc1xuICAgKiBAcGFyYW0gbWVtbyBPcHRpb25hbCBjb250YWlucyBhcmJpdHJhcnkgYnl0ZXMsIHVwIHRvIDI1NiBieXRlc1xuICAgKiBAcGFyYW0gYXNPZiBPcHRpb25hbC4gVGhlIHRpbWVzdGFtcCB0byB2ZXJpZnkgdGhlIHRyYW5zYWN0aW9uIGFnYWluc3QgYXMgYSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2luZHV0bnkvYm4uanMvfEJOfVxuICAgKiBAcGFyYW0gbG9ja3RpbWUgT3B0aW9uYWwuIFRoZSBsb2NrdGltZSBmaWVsZCBjcmVhdGVkIGluIHRoZSByZXN1bHRpbmcgb3V0cHV0c1xuICAgKiBAcGFyYW0gdGhyZXNob2xkIE9wdGlvbmFsLiBUaGUgbnVtYmVyIG9mIHNpZ25hdHVyZXMgcmVxdWlyZWQgdG8gc3BlbmQgdGhlIGZ1bmRzIGluIHRoZSByZXN1bHRhbnQgVVRYT1xuICAgKlxuICAgKiBAcmV0dXJucyBBbiB1bnNpZ25lZCB0cmFuc2FjdGlvbiAoW1tVbnNpZ25lZFR4XV0pIHdoaWNoIGNvbnRhaW5zIGFuIFtbRXhwb3J0VHhdXS5cbiAgICovXG4gIGJ1aWxkRXhwb3J0VHggPSBhc3luYyAoXG4gICAgdXR4b3NldDpVVFhPU2V0LCBcbiAgICBhbW91bnQ6Qk4sXG4gICAgZGVzdGluYXRpb25DaGFpbjpCdWZmZXIgfCBzdHJpbmcsXG4gICAgdG9BZGRyZXNzZXM6QXJyYXk8c3RyaW5nPiwgXG4gICAgZnJvbUFkZHJlc3NlczpBcnJheTxzdHJpbmc+LFxuICAgIGNoYW5nZUFkZHJlc3NlczpBcnJheTxzdHJpbmc+ID0gdW5kZWZpbmVkLFxuICAgIG1lbW86UGF5bG9hZEJhc2V8QnVmZmVyID0gdW5kZWZpbmVkLCBcbiAgICBhc09mOkJOID0gVW5peE5vdygpLFxuICAgIGxvY2t0aW1lOkJOID0gbmV3IEJOKDApLCBcbiAgICB0aHJlc2hvbGQ6bnVtYmVyID0gMVxuICApOlByb21pc2U8VW5zaWduZWRUeD4gPT4ge1xuICAgIFxuICAgIGxldCBwcmVmaXhlczpvYmplY3QgPSB7fTtcbiAgICB0b0FkZHJlc3Nlcy5tYXAoKGEpID0+IHtcbiAgICAgIHByZWZpeGVzW2Euc3BsaXQoXCItXCIpWzBdXSA9IHRydWU7XG4gICAgfSk7XG4gICAgaWYoT2JqZWN0LmtleXMocHJlZml4ZXMpLmxlbmd0aCAhPT0gMSl7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJFcnJvciAtIFBsYXRmb3JtVk1BUEkuYnVpbGRFeHBvcnRUeDogVG8gYWRkcmVzc2VzIG11c3QgaGF2ZSB0aGUgc2FtZSBjaGFpbklEIHByZWZpeC5cIik7XG4gICAgfVxuXG4gICAgaWYodHlwZW9mIGRlc3RpbmF0aW9uQ2hhaW4gPT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIkVycm9yIC0gUGxhdGZvcm1WTUFQSS5idWlsZEV4cG9ydFR4OiBEZXN0aW5hdGlvbiBDaGFpbklEIGlzIHVuZGVmaW5lZC5cIik7XG4gICAgfSBlbHNlIGlmICh0eXBlb2YgZGVzdGluYXRpb25DaGFpbiA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgZGVzdGluYXRpb25DaGFpbiA9IGJpbnRvb2xzLmNiNThEZWNvZGUoZGVzdGluYXRpb25DaGFpbik7IC8vXG4gICAgfSBlbHNlIGlmKCEoZGVzdGluYXRpb25DaGFpbiBpbnN0YW5jZW9mIEJ1ZmZlcikpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIkVycm9yIC0gUGxhdGZvcm1WTUFQSS5idWlsZEV4cG9ydFR4OiBJbnZhbGlkIGRlc3RpbmF0aW9uQ2hhaW4gdHlwZTogXCIgKyAodHlwZW9mIGRlc3RpbmF0aW9uQ2hhaW4pICk7XG4gICAgfVxuICAgIGlmKGRlc3RpbmF0aW9uQ2hhaW4ubGVuZ3RoICE9PSAzMikge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiRXJyb3IgLSBQbGF0Zm9ybVZNQVBJLmJ1aWxkRXhwb3J0VHg6IERlc3RpbmF0aW9uIENoYWluSUQgbXVzdCBiZSAzMiBieXRlcyBpbiBsZW5ndGguXCIpO1xuICAgIH1cbiAgICAvKlxuICAgIGlmKGJpbnRvb2xzLmNiNThFbmNvZGUoZGVzdGluYXRpb25DaGFpbikgIT09IERlZmF1bHRzLm5ldHdvcmtbdGhpcy5jb3JlLmdldE5ldHdvcmtJRCgpXS5YW1wiYmxvY2tjaGFpbklEXCJdKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJFcnJvciAtIFBsYXRmb3JtVk1BUEkuYnVpbGRFeHBvcnRUeDogRGVzdGluYXRpb24gQ2hhaW5JRCBtdXN0IFRoZSBYLUNoYWluIElEIGluIHRoZSBjdXJyZW50IHZlcnNpb24gb2YgQXZhbGFuY2hlSlMuXCIpO1xuICAgIH0qL1xuXG4gICAgbGV0IHRvOkFycmF5PEJ1ZmZlcj4gPSBbXTtcbiAgICB0b0FkZHJlc3Nlcy5tYXAoKGEpID0+IHtcbiAgICAgIHRvLnB1c2goYmludG9vbHMuc3RyaW5nVG9BZGRyZXNzKGEpKTtcbiAgICB9KTtcbiAgICBjb25zdCBmcm9tOkFycmF5PEJ1ZmZlcj4gPSB0aGlzLl9jbGVhbkFkZHJlc3NBcnJheShmcm9tQWRkcmVzc2VzLCAnYnVpbGRFeHBvcnRUeCcpLm1hcCgoYSkgPT4gYmludG9vbHMuc3RyaW5nVG9BZGRyZXNzKGEpKTtcbiAgICBjb25zdCBjaGFuZ2U6QXJyYXk8QnVmZmVyPiA9IHRoaXMuX2NsZWFuQWRkcmVzc0FycmF5KGNoYW5nZUFkZHJlc3NlcywgJ2J1aWxkRXhwb3J0VHgnKS5tYXAoKGEpID0+IGJpbnRvb2xzLnN0cmluZ1RvQWRkcmVzcyhhKSk7XG5cbiAgICBpZiggbWVtbyBpbnN0YW5jZW9mIFBheWxvYWRCYXNlKSB7XG4gICAgICBtZW1vID0gbWVtby5nZXRQYXlsb2FkKCk7XG4gICAgfVxuXG4gICAgY29uc3QgYXZheEFzc2V0SUQ6QnVmZmVyID0gYXdhaXQgdGhpcy5nZXRBVkFYQXNzZXRJRCgpO1xuXG4gICAgY29uc3QgYnVpbHRVbnNpZ25lZFR4OlVuc2lnbmVkVHggPSB1dHhvc2V0LmJ1aWxkRXhwb3J0VHgoXG4gICAgICB0aGlzLmNvcmUuZ2V0TmV0d29ya0lEKCksIFxuICAgICAgYmludG9vbHMuY2I1OERlY29kZSh0aGlzLmJsb2NrY2hhaW5JRCksIFxuICAgICAgYW1vdW50LFxuICAgICAgYXZheEFzc2V0SUQsIFxuICAgICAgdG8sXG4gICAgICBmcm9tLFxuICAgICAgY2hhbmdlLFxuICAgICAgZGVzdGluYXRpb25DaGFpbixcbiAgICAgIHRoaXMuZ2V0VHhGZWUoKSwgXG4gICAgICBhdmF4QXNzZXRJRCxcbiAgICAgIG1lbW8sIGFzT2YsIGxvY2t0aW1lLCB0aHJlc2hvbGRcbiAgICApO1xuXG4gICAgaWYoISBhd2FpdCB0aGlzLmNoZWNrR29vc2VFZ2coYnVpbHRVbnNpZ25lZFR4KSkge1xuICAgICAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cbiAgICAgIHRocm93IG5ldyBFcnJvcihcIkZhaWxlZCBHb29zZSBFZ2cgQ2hlY2tcIik7XG4gICAgfVxuXG4gICAgcmV0dXJuIGJ1aWx0VW5zaWduZWRUeDtcbiAgfTtcblxuICAvKipcbiAgKiBIZWxwZXIgZnVuY3Rpb24gd2hpY2ggY3JlYXRlcyBhbiB1bnNpZ25lZCBbW0FkZFN1Ym5ldFZhbGlkYXRvclR4XV0uIEZvciBtb3JlIGdyYW51bGFyIGNvbnRyb2wsIHlvdSBtYXkgY3JlYXRlIHlvdXIgb3duXG4gICogW1tVbnNpZ25lZFR4XV0gbWFudWFsbHkgYW5kIGltcG9ydCB0aGUgW1tBZGRTdWJuZXRWYWxpZGF0b3JUeF1dIGNsYXNzIGRpcmVjdGx5LlxuICAqXG4gICogQHBhcmFtIHV0eG9zZXQgQSBzZXQgb2YgVVRYT3MgdGhhdCB0aGUgdHJhbnNhY3Rpb24gaXMgYnVpbHQgb24uXG4gICogQHBhcmFtIGZyb21BZGRyZXNzZXMgQW4gYXJyYXkgb2YgYWRkcmVzc2VzIGFzIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IHdobyBwYXlzIHRoZSBmZWVzIGluIEFWQVhcbiAgKiBAcGFyYW0gY2hhbmdlQWRkcmVzc2VzIEFuIGFycmF5IG9mIGFkZHJlc3NlcyBhcyB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSB3aG8gZ2V0cyB0aGUgY2hhbmdlIGxlZnRvdmVyIGZyb20gdGhlIGZlZSBwYXltZW50XG4gICogQHBhcmFtIG5vZGVJRCBUaGUgbm9kZSBJRCBvZiB0aGUgdmFsaWRhdG9yIGJlaW5nIGFkZGVkLlxuICAqIEBwYXJhbSBzdGFydFRpbWUgVGhlIFVuaXggdGltZSB3aGVuIHRoZSB2YWxpZGF0b3Igc3RhcnRzIHZhbGlkYXRpbmcgdGhlIFByaW1hcnkgTmV0d29yay5cbiAgKiBAcGFyYW0gZW5kVGltZSBUaGUgVW5peCB0aW1lIHdoZW4gdGhlIHZhbGlkYXRvciBzdG9wcyB2YWxpZGF0aW5nIHRoZSBQcmltYXJ5IE5ldHdvcmsgKGFuZCBzdGFrZWQgQVZBWCBpcyByZXR1cm5lZCkuXG4gICogQHBhcmFtIHdlaWdodCBUaGUgYW1vdW50IG9mIHdlaWdodCBmb3IgdGhpcyBzdWJuZXQgdmFsaWRhdG9yLlxuICAqIEBwYXJhbSBtZW1vIE9wdGlvbmFsIGNvbnRhaW5zIGFyYml0cmFyeSBieXRlcywgdXAgdG8gMjU2IGJ5dGVzXG4gICogQHBhcmFtIGFzT2YgT3B0aW9uYWwuIFRoZSB0aW1lc3RhbXAgdG8gdmVyaWZ5IHRoZSB0cmFuc2FjdGlvbiBhZ2FpbnN0IGFzIGEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9pbmR1dG55L2JuLmpzL3xCTn1cbiAgKiAgXG4gICogQHJldHVybnMgQW4gdW5zaWduZWQgdHJhbnNhY3Rpb24gY3JlYXRlZCBmcm9tIHRoZSBwYXNzZWQgaW4gcGFyYW1ldGVycy5cbiAgKi9cblxuICAvKiBSZS1pbXBsZW1lbnQgd2hlbiBzdWJuZXRWYWxpZGF0b3Igc2lnbmluZyBwcm9jZXNzIGlzIGNsZWFyZXJcbiAgYnVpbGRBZGRTdWJuZXRWYWxpZGF0b3JUeCA9IGFzeW5jIChcbiAgICB1dHhvc2V0OlVUWE9TZXQsIFxuICAgIGZyb21BZGRyZXNzZXM6QXJyYXk8c3RyaW5nPixcbiAgICBjaGFuZ2VBZGRyZXNzZXM6QXJyYXk8c3RyaW5nPixcbiAgICBub2RlSUQ6c3RyaW5nLCBcbiAgICBzdGFydFRpbWU6Qk4sIFxuICAgIGVuZFRpbWU6Qk4sXG4gICAgd2VpZ2h0OkJOLFxuICAgIG1lbW86UGF5bG9hZEJhc2V8QnVmZmVyID0gdW5kZWZpbmVkLCBcbiAgICBhc09mOkJOID0gVW5peE5vdygpXG4gICk6UHJvbWlzZTxVbnNpZ25lZFR4PiA9PiB7XG4gICAgY29uc3QgZnJvbTpBcnJheTxCdWZmZXI+ID0gdGhpcy5fY2xlYW5BZGRyZXNzQXJyYXkoZnJvbUFkZHJlc3NlcywgJ2J1aWxkQWRkU3VibmV0VmFsaWRhdG9yVHgnKS5tYXAoKGEpID0+IGJpbnRvb2xzLnN0cmluZ1RvQWRkcmVzcyhhKSk7XG4gICAgY29uc3QgY2hhbmdlOkFycmF5PEJ1ZmZlcj4gPSB0aGlzLl9jbGVhbkFkZHJlc3NBcnJheShjaGFuZ2VBZGRyZXNzZXMsICdidWlsZEFkZFN1Ym5ldFZhbGlkYXRvclR4JykubWFwKChhKSA9PiBiaW50b29scy5zdHJpbmdUb0FkZHJlc3MoYSkpO1xuXG4gICAgaWYoIG1lbW8gaW5zdGFuY2VvZiBQYXlsb2FkQmFzZSkge1xuICAgICAgbWVtbyA9IG1lbW8uZ2V0UGF5bG9hZCgpO1xuICAgIH1cblxuICAgIGNvbnN0IGF2YXhBc3NldElEOkJ1ZmZlciA9IGF3YWl0IHRoaXMuZ2V0QVZBWEFzc2V0SUQoKTtcbiAgICBcbiAgICBjb25zdCBub3c6Qk4gPSBVbml4Tm93KCk7XG4gICAgaWYgKHN0YXJ0VGltZS5sdChub3cpIHx8IGVuZFRpbWUubHRlKHN0YXJ0VGltZSkpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIlBsYXRmb3JtVk1BUEkuYnVpbGRBZGRTdWJuZXRWYWxpZGF0b3JUeCAtLSBzdGFydFRpbWUgbXVzdCBiZSBpbiB0aGUgZnV0dXJlIGFuZCBlbmRUaW1lIG11c3QgY29tZSBhZnRlciBzdGFydFRpbWVcIik7XG4gICAgfVxuXG4gICAgY29uc3QgYnVpbHRVbnNpZ25lZFR4OlVuc2lnbmVkVHggPSB1dHhvc2V0LmJ1aWxkQWRkU3VibmV0VmFsaWRhdG9yVHgoXG4gICAgICB0aGlzLmNvcmUuZ2V0TmV0d29ya0lEKCksIFxuICAgICAgYmludG9vbHMuY2I1OERlY29kZSh0aGlzLmJsb2NrY2hhaW5JRCksIFxuICAgICAgZnJvbSxcbiAgICAgIGNoYW5nZSxcbiAgICAgIE5vZGVJRFN0cmluZ1RvQnVmZmVyKG5vZGVJRCksXG4gICAgICBzdGFydFRpbWUsIGVuZFRpbWUsXG4gICAgICB3ZWlnaHQsIFxuICAgICAgdGhpcy5nZXRGZWUoKSwgXG4gICAgICBhdmF4QXNzZXRJRCxcbiAgICAgIG1lbW8sIGFzT2ZcbiAgICApO1xuXG4gICAgaWYoISBhd2FpdCB0aGlzLmNoZWNrR29vc2VFZ2coYnVpbHRVbnNpZ25lZFR4KSkge1xuICAgICAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi8vKlxuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiRmFpbGVkIEdvb3NlIEVnZyBDaGVja1wiKTtcbiAgICB9XG5cbiAgICByZXR1cm4gYnVpbHRVbnNpZ25lZFR4O1xuICB9XG5cbiAgKi9cblxuICAvKipcbiAgKiBIZWxwZXIgZnVuY3Rpb24gd2hpY2ggY3JlYXRlcyBhbiB1bnNpZ25lZCBbW0FkZERlbGVnYXRvclR4XV0uIEZvciBtb3JlIGdyYW51bGFyIGNvbnRyb2wsIHlvdSBtYXkgY3JlYXRlIHlvdXIgb3duXG4gICogW1tVbnNpZ25lZFR4XV0gbWFudWFsbHkgYW5kIGltcG9ydCB0aGUgW1tBZGREZWxlZ2F0b3JUeF1dIGNsYXNzIGRpcmVjdGx5LlxuICAqXG4gICogQHBhcmFtIHV0eG9zZXQgQSBzZXQgb2YgVVRYT3MgdGhhdCB0aGUgdHJhbnNhY3Rpb24gaXMgYnVpbHQgb25cbiAgKiBAcGFyYW0gdG9BZGRyZXNzZXMgQW4gYXJyYXkgb2YgYWRkcmVzc2VzIGFzIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IHdobyByZWNpZXZlZCB0aGUgc3Rha2VkIHRva2VucyBhdCB0aGUgZW5kIG9mIHRoZSBzdGFraW5nIHBlcmlvZFxuICAqIEBwYXJhbSBmcm9tQWRkcmVzc2VzIEFuIGFycmF5IG9mIGFkZHJlc3NlcyBhcyB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSB3aG8gb3duIHRoZSBzdGFraW5nIFVUWE9zIHRoZSBmZWVzIGluIEFWQVhcbiAgKiBAcGFyYW0gY2hhbmdlQWRkcmVzc2VzIEFuIGFycmF5IG9mIGFkZHJlc3NlcyBhcyB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSB3aG8gZ2V0cyB0aGUgY2hhbmdlIGxlZnRvdmVyIGZyb20gdGhlIGZlZSBwYXltZW50XG4gICogQHBhcmFtIG5vZGVJRCBUaGUgbm9kZSBJRCBvZiB0aGUgdmFsaWRhdG9yIGJlaW5nIGFkZGVkLlxuICAqIEBwYXJhbSBzdGFydFRpbWUgVGhlIFVuaXggdGltZSB3aGVuIHRoZSB2YWxpZGF0b3Igc3RhcnRzIHZhbGlkYXRpbmcgdGhlIFByaW1hcnkgTmV0d29yay5cbiAgKiBAcGFyYW0gZW5kVGltZSBUaGUgVW5peCB0aW1lIHdoZW4gdGhlIHZhbGlkYXRvciBzdG9wcyB2YWxpZGF0aW5nIHRoZSBQcmltYXJ5IE5ldHdvcmsgKGFuZCBzdGFrZWQgQVZBWCBpcyByZXR1cm5lZCkuXG4gICogQHBhcmFtIHN0YWtlQW1vdW50IFRoZSBhbW91bnQgYmVpbmcgZGVsZWdhdGVkIGFzIGEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9pbmR1dG55L2JuLmpzL3xCTn1cbiAgKiBAcGFyYW0gcmV3YXJkQWRkcmVzc2VzIFRoZSBhZGRyZXNzZXMgd2hpY2ggd2lsbCByZWNpZXZlIHRoZSByZXdhcmRzIGZyb20gdGhlIGRlbGVnYXRlZCBzdGFrZS5cbiAgKiBAcGFyYW0gcmV3YXJkTG9ja3RpbWUgT3B0aW9uYWwuIFRoZSBsb2NrdGltZSBmaWVsZCBjcmVhdGVkIGluIHRoZSByZXN1bHRpbmcgcmV3YXJkIG91dHB1dHNcbiAgKiBAcGFyYW0gcmV3YXJkVGhyZXNob2xkIE9waW9uYWwuIFRoZSBudW1iZXIgb2Ygc2lnbmF0dXJlcyByZXF1aXJlZCB0byBzcGVuZCB0aGUgZnVuZHMgaW4gdGhlIHJlc3VsdGFudCByZXdhcmQgVVRYTy4gRGVmYXVsdCAxLlxuICAqIEBwYXJhbSBtZW1vIE9wdGlvbmFsIGNvbnRhaW5zIGFyYml0cmFyeSBieXRlcywgdXAgdG8gMjU2IGJ5dGVzXG4gICogQHBhcmFtIGFzT2YgT3B0aW9uYWwuIFRoZSB0aW1lc3RhbXAgdG8gdmVyaWZ5IHRoZSB0cmFuc2FjdGlvbiBhZ2FpbnN0IGFzIGEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9pbmR1dG55L2JuLmpzL3xCTn1cbiAgKiAgXG4gICogQHJldHVybnMgQW4gdW5zaWduZWQgdHJhbnNhY3Rpb24gY3JlYXRlZCBmcm9tIHRoZSBwYXNzZWQgaW4gcGFyYW1ldGVycy5cbiAgKi9cbiAgYnVpbGRBZGREZWxlZ2F0b3JUeCA9IGFzeW5jIChcbiAgICB1dHhvc2V0OlVUWE9TZXQsIFxuICAgIHRvQWRkcmVzc2VzOkFycmF5PHN0cmluZz4sXG4gICAgZnJvbUFkZHJlc3NlczpBcnJheTxzdHJpbmc+LFxuICAgIGNoYW5nZUFkZHJlc3NlczpBcnJheTxzdHJpbmc+LFxuICAgIG5vZGVJRDpzdHJpbmcsIFxuICAgIHN0YXJ0VGltZTpCTiwgXG4gICAgZW5kVGltZTpCTixcbiAgICBzdGFrZUFtb3VudDpCTixcbiAgICByZXdhcmRBZGRyZXNzZXM6QXJyYXk8c3RyaW5nPixcbiAgICByZXdhcmRMb2NrdGltZTpCTiA9IG5ldyBCTigwKSxcbiAgICByZXdhcmRUaHJlc2hvbGQ6bnVtYmVyID0gMSxcbiAgICBtZW1vOlBheWxvYWRCYXNlfEJ1ZmZlciA9IHVuZGVmaW5lZCwgXG4gICAgYXNPZjpCTiA9IFVuaXhOb3coKVxuICApOlByb21pc2U8VW5zaWduZWRUeD4gPT4ge1xuICAgIGNvbnN0IHRvOkFycmF5PEJ1ZmZlcj4gPSB0aGlzLl9jbGVhbkFkZHJlc3NBcnJheSh0b0FkZHJlc3NlcywgJ2J1aWxkQWRkRGVsZWdhdG9yVHgnKS5tYXAoKGEpID0+IGJpbnRvb2xzLnN0cmluZ1RvQWRkcmVzcyhhKSk7XG4gICAgY29uc3QgZnJvbTpBcnJheTxCdWZmZXI+ID0gdGhpcy5fY2xlYW5BZGRyZXNzQXJyYXkoZnJvbUFkZHJlc3NlcywgJ2J1aWxkQWRkRGVsZWdhdG9yVHgnKS5tYXAoKGEpID0+IGJpbnRvb2xzLnN0cmluZ1RvQWRkcmVzcyhhKSk7XG4gICAgY29uc3QgY2hhbmdlOkFycmF5PEJ1ZmZlcj4gPSB0aGlzLl9jbGVhbkFkZHJlc3NBcnJheShjaGFuZ2VBZGRyZXNzZXMsICdidWlsZEFkZERlbGVnYXRvclR4JykubWFwKChhKSA9PiBiaW50b29scy5zdHJpbmdUb0FkZHJlc3MoYSkpO1xuICAgIGNvbnN0IHJld2FyZHM6QXJyYXk8QnVmZmVyPiA9IHRoaXMuX2NsZWFuQWRkcmVzc0FycmF5KHJld2FyZEFkZHJlc3NlcywgJ2J1aWxkQWRkVmFsaWRhdG9yVHgnKS5tYXAoKGEpID0+IGJpbnRvb2xzLnN0cmluZ1RvQWRkcmVzcyhhKSk7XG5cbiAgICBpZiggbWVtbyBpbnN0YW5jZW9mIFBheWxvYWRCYXNlKSB7XG4gICAgICBtZW1vID0gbWVtby5nZXRQYXlsb2FkKCk7XG4gICAgfVxuXG4gICAgY29uc3QgbWluU3Rha2U6Qk4gPSAoYXdhaXQgdGhpcy5nZXRNaW5TdGFrZSgpKVtcIm1pbkRlbGVnYXRvclN0YWtlXCJdO1xuICAgIGlmKHN0YWtlQW1vdW50Lmx0KG1pblN0YWtlKSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiUGxhdGZvcm1WTUFQSS5idWlsZEFkZERlbGVnYXRvclR4IC0tIHN0YWtlIGFtb3VudCBtdXN0IGJlIGF0IGxlYXN0IFwiICsgbWluU3Rha2UudG9TdHJpbmcoMTApKTtcbiAgICB9XG5cbiAgICBjb25zdCBhdmF4QXNzZXRJRDpCdWZmZXIgPSBhd2FpdCB0aGlzLmdldEFWQVhBc3NldElEKCk7XG4gICAgXG4gICAgY29uc3Qgbm93OkJOID0gVW5peE5vdygpO1xuICAgIGlmIChzdGFydFRpbWUubHQobm93KSB8fCBlbmRUaW1lLmx0ZShzdGFydFRpbWUpKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJQbGF0Zm9ybVZNQVBJLmJ1aWxkQWRkRGVsZWdhdG9yVHggLS0gc3RhcnRUaW1lIG11c3QgYmUgaW4gdGhlIGZ1dHVyZSBhbmQgZW5kVGltZSBtdXN0IGNvbWUgYWZ0ZXIgc3RhcnRUaW1lXCIpO1xuICAgIH1cblxuICAgIGNvbnN0IGJ1aWx0VW5zaWduZWRUeDpVbnNpZ25lZFR4ID0gdXR4b3NldC5idWlsZEFkZERlbGVnYXRvclR4KFxuICAgICAgdGhpcy5jb3JlLmdldE5ldHdvcmtJRCgpLCBcbiAgICAgIGJpbnRvb2xzLmNiNThEZWNvZGUodGhpcy5ibG9ja2NoYWluSUQpLCBcbiAgICAgIGF2YXhBc3NldElELFxuICAgICAgdG8sXG4gICAgICBmcm9tLFxuICAgICAgY2hhbmdlLFxuICAgICAgTm9kZUlEU3RyaW5nVG9CdWZmZXIobm9kZUlEKSxcbiAgICAgIHN0YXJ0VGltZSwgZW5kVGltZSxcbiAgICAgIHN0YWtlQW1vdW50LFxuICAgICAgcmV3YXJkTG9ja3RpbWUsXG4gICAgICByZXdhcmRUaHJlc2hvbGQsXG4gICAgICByZXdhcmRzLFxuICAgICAgbmV3IEJOKDApLCBcbiAgICAgIGF2YXhBc3NldElELFxuICAgICAgbWVtbywgYXNPZlxuICAgICk7XG5cbiAgICBpZighYXdhaXQgdGhpcy5jaGVja0dvb3NlRWdnKGJ1aWx0VW5zaWduZWRUeCkpIHtcbiAgICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJGYWlsZWQgR29vc2UgRWdnIENoZWNrXCIpO1xuICAgIH1cblxuICAgIHJldHVybiBidWlsdFVuc2lnbmVkVHg7XG4gIH1cblxuXG4gIC8qKlxuICAqIEhlbHBlciBmdW5jdGlvbiB3aGljaCBjcmVhdGVzIGFuIHVuc2lnbmVkIFtbQWRkVmFsaWRhdG9yVHhdXS4gRm9yIG1vcmUgZ3JhbnVsYXIgY29udHJvbCwgeW91IG1heSBjcmVhdGUgeW91ciBvd25cbiAgKiBbW1Vuc2lnbmVkVHhdXSBtYW51YWxseSBhbmQgaW1wb3J0IHRoZSBbW0FkZFZhbGlkYXRvclR4XV0gY2xhc3MgZGlyZWN0bHkuXG4gICpcbiAgKiBAcGFyYW0gdXR4b3NldCBBIHNldCBvZiBVVFhPcyB0aGF0IHRoZSB0cmFuc2FjdGlvbiBpcyBidWlsdCBvblxuICAqIEBwYXJhbSB0b0FkZHJlc3NlcyBBbiBhcnJheSBvZiBhZGRyZXNzZXMgYXMge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0gd2hvIHJlY2lldmVkIHRoZSBzdGFrZWQgdG9rZW5zIGF0IHRoZSBlbmQgb2YgdGhlIHN0YWtpbmcgcGVyaW9kXG4gICogQHBhcmFtIGZyb21BZGRyZXNzZXMgQW4gYXJyYXkgb2YgYWRkcmVzc2VzIGFzIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IHdobyBvd24gdGhlIHN0YWtpbmcgVVRYT3MgdGhlIGZlZXMgaW4gQVZBWFxuICAqIEBwYXJhbSBjaGFuZ2VBZGRyZXNzZXMgQW4gYXJyYXkgb2YgYWRkcmVzc2VzIGFzIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IHdobyBnZXRzIHRoZSBjaGFuZ2UgbGVmdG92ZXIgZnJvbSB0aGUgZmVlIHBheW1lbnRcbiAgKiBAcGFyYW0gbm9kZUlEIFRoZSBub2RlIElEIG9mIHRoZSB2YWxpZGF0b3IgYmVpbmcgYWRkZWQuXG4gICogQHBhcmFtIHN0YXJ0VGltZSBUaGUgVW5peCB0aW1lIHdoZW4gdGhlIHZhbGlkYXRvciBzdGFydHMgdmFsaWRhdGluZyB0aGUgUHJpbWFyeSBOZXR3b3JrLlxuICAqIEBwYXJhbSBlbmRUaW1lIFRoZSBVbml4IHRpbWUgd2hlbiB0aGUgdmFsaWRhdG9yIHN0b3BzIHZhbGlkYXRpbmcgdGhlIFByaW1hcnkgTmV0d29yayAoYW5kIHN0YWtlZCBBVkFYIGlzIHJldHVybmVkKS5cbiAgKiBAcGFyYW0gc3Rha2VBbW91bnQgVGhlIGFtb3VudCBiZWluZyBkZWxlZ2F0ZWQgYXMgYSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2luZHV0bnkvYm4uanMvfEJOfVxuICAqIEBwYXJhbSByZXdhcmRBZGRyZXNzZXMgVGhlIGFkZHJlc3NlcyB3aGljaCB3aWxsIHJlY2lldmUgdGhlIHJld2FyZHMgZnJvbSB0aGUgZGVsZWdhdGVkIHN0YWtlLlxuICAqIEBwYXJhbSBkZWxlZ2F0aW9uRmVlIEEgbnVtYmVyIGZvciB0aGUgcGVyY2VudGFnZSBvZiByZXdhcmQgdG8gYmUgZ2l2ZW4gdG8gdGhlIHZhbGlkYXRvciB3aGVuIHNvbWVvbmUgZGVsZWdhdGVzIHRvIHRoZW0uIE11c3QgYmUgYmV0d2VlbiAwIGFuZCAxMDAuIFxuICAqIEBwYXJhbSByZXdhcmRMb2NrdGltZSBPcHRpb25hbC4gVGhlIGxvY2t0aW1lIGZpZWxkIGNyZWF0ZWQgaW4gdGhlIHJlc3VsdGluZyByZXdhcmQgb3V0cHV0c1xuICAqIEBwYXJhbSByZXdhcmRUaHJlc2hvbGQgT3Bpb25hbC4gVGhlIG51bWJlciBvZiBzaWduYXR1cmVzIHJlcXVpcmVkIHRvIHNwZW5kIHRoZSBmdW5kcyBpbiB0aGUgcmVzdWx0YW50IHJld2FyZCBVVFhPLiBEZWZhdWx0IDEuXG4gICogQHBhcmFtIG1lbW8gT3B0aW9uYWwgY29udGFpbnMgYXJiaXRyYXJ5IGJ5dGVzLCB1cCB0byAyNTYgYnl0ZXNcbiAgKiBAcGFyYW0gYXNPZiBPcHRpb25hbC4gVGhlIHRpbWVzdGFtcCB0byB2ZXJpZnkgdGhlIHRyYW5zYWN0aW9uIGFnYWluc3QgYXMgYSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2luZHV0bnkvYm4uanMvfEJOfVxuICAqICBcbiAgKiBAcmV0dXJucyBBbiB1bnNpZ25lZCB0cmFuc2FjdGlvbiBjcmVhdGVkIGZyb20gdGhlIHBhc3NlZCBpbiBwYXJhbWV0ZXJzLlxuICAqL1xuICBidWlsZEFkZFZhbGlkYXRvclR4ID0gYXN5bmMgKFxuICAgIHV0eG9zZXQ6VVRYT1NldCwgXG4gICAgdG9BZGRyZXNzZXM6QXJyYXk8c3RyaW5nPixcbiAgICBmcm9tQWRkcmVzc2VzOkFycmF5PHN0cmluZz4sXG4gICAgY2hhbmdlQWRkcmVzc2VzOkFycmF5PHN0cmluZz4sXG4gICAgbm9kZUlEOnN0cmluZywgXG4gICAgc3RhcnRUaW1lOkJOLCBcbiAgICBlbmRUaW1lOkJOLFxuICAgIHN0YWtlQW1vdW50OkJOLFxuICAgIHJld2FyZEFkZHJlc3NlczpBcnJheTxzdHJpbmc+LFxuICAgIGRlbGVnYXRpb25GZWU6bnVtYmVyLFxuICAgIHJld2FyZExvY2t0aW1lOkJOID0gbmV3IEJOKDApLFxuICAgIHJld2FyZFRocmVzaG9sZDpudW1iZXIgPSAxLFxuICAgIG1lbW86UGF5bG9hZEJhc2V8QnVmZmVyID0gdW5kZWZpbmVkLCBcbiAgICBhc09mOkJOID0gVW5peE5vdygpXG4gICk6UHJvbWlzZTxVbnNpZ25lZFR4PiA9PiB7XG4gICAgY29uc3QgdG86QXJyYXk8QnVmZmVyPiA9IHRoaXMuX2NsZWFuQWRkcmVzc0FycmF5KHRvQWRkcmVzc2VzLCAnYnVpbGRBZGRWYWxpZGF0b3JUeCcpLm1hcCgoYSkgPT4gYmludG9vbHMuc3RyaW5nVG9BZGRyZXNzKGEpKTtcbiAgICBjb25zdCBmcm9tOkFycmF5PEJ1ZmZlcj4gPSB0aGlzLl9jbGVhbkFkZHJlc3NBcnJheShmcm9tQWRkcmVzc2VzLCAnYnVpbGRBZGRWYWxpZGF0b3JUeCcpLm1hcCgoYSkgPT4gYmludG9vbHMuc3RyaW5nVG9BZGRyZXNzKGEpKTtcbiAgICBjb25zdCBjaGFuZ2U6QXJyYXk8QnVmZmVyPiA9IHRoaXMuX2NsZWFuQWRkcmVzc0FycmF5KGNoYW5nZUFkZHJlc3NlcywgJ2J1aWxkQWRkVmFsaWRhdG9yVHgnKS5tYXAoKGEpID0+IGJpbnRvb2xzLnN0cmluZ1RvQWRkcmVzcyhhKSk7XG4gICAgY29uc3QgcmV3YXJkczpBcnJheTxCdWZmZXI+ID0gdGhpcy5fY2xlYW5BZGRyZXNzQXJyYXkocmV3YXJkQWRkcmVzc2VzLCAnYnVpbGRBZGRWYWxpZGF0b3JUeCcpLm1hcCgoYSkgPT4gYmludG9vbHMuc3RyaW5nVG9BZGRyZXNzKGEpKTtcblxuICAgIGlmKCBtZW1vIGluc3RhbmNlb2YgUGF5bG9hZEJhc2UpIHtcbiAgICAgIG1lbW8gPSBtZW1vLmdldFBheWxvYWQoKTtcbiAgICB9XG5cbiAgICBjb25zdCBtaW5TdGFrZTpCTiA9IChhd2FpdCB0aGlzLmdldE1pblN0YWtlKCkpW1wibWluVmFsaWRhdG9yU3Rha2VcIl07XG4gICAgaWYoc3Rha2VBbW91bnQubHQobWluU3Rha2UpKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJQbGF0Zm9ybVZNQVBJLmJ1aWxkQWRkVmFsaWRhdG9yVHggLS0gc3Rha2UgYW1vdW50IG11c3QgYmUgYXQgbGVhc3QgXCIgKyBtaW5TdGFrZS50b1N0cmluZygxMCkpO1xuICAgIH1cblxuICAgIGlmKHR5cGVvZiBkZWxlZ2F0aW9uRmVlICE9PSBcIm51bWJlclwiIHx8IGRlbGVnYXRpb25GZWUgPiAxMDAgfHwgZGVsZWdhdGlvbkZlZSA8IDApe1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiUGxhdGZvcm1WTUFQSS5idWlsZEFkZFZhbGlkYXRvclR4IC0tIGRlbGVnYXRpb25GZWUgbXVzdCBiZSBhIG51bWJlciBiZXR3ZWVuIDAgYW5kIDEwMFwiKTtcbiAgICB9XG5cbiAgICBjb25zdCBhdmF4QXNzZXRJRDpCdWZmZXIgPSBhd2FpdCB0aGlzLmdldEFWQVhBc3NldElEKCk7XG4gICAgXG4gICAgY29uc3Qgbm93OkJOID0gVW5peE5vdygpO1xuICAgIGlmIChzdGFydFRpbWUubHQobm93KSB8fCBlbmRUaW1lLmx0ZShzdGFydFRpbWUpKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJQbGF0Zm9ybVZNQVBJLmJ1aWxkQWRkVmFsaWRhdG9yVHggLS0gc3RhcnRUaW1lIG11c3QgYmUgaW4gdGhlIGZ1dHVyZSBhbmQgZW5kVGltZSBtdXN0IGNvbWUgYWZ0ZXIgc3RhcnRUaW1lXCIpO1xuICAgIH1cblxuICAgIGNvbnN0IGJ1aWx0VW5zaWduZWRUeDpVbnNpZ25lZFR4ID0gdXR4b3NldC5idWlsZEFkZFZhbGlkYXRvclR4KFxuICAgICAgdGhpcy5jb3JlLmdldE5ldHdvcmtJRCgpLCBcbiAgICAgIGJpbnRvb2xzLmNiNThEZWNvZGUodGhpcy5ibG9ja2NoYWluSUQpLCBcbiAgICAgIGF2YXhBc3NldElELFxuICAgICAgdG8sXG4gICAgICBmcm9tLFxuICAgICAgY2hhbmdlLFxuICAgICAgTm9kZUlEU3RyaW5nVG9CdWZmZXIobm9kZUlEKSxcbiAgICAgIHN0YXJ0VGltZSwgZW5kVGltZSxcbiAgICAgIHN0YWtlQW1vdW50LFxuICAgICAgcmV3YXJkTG9ja3RpbWUsXG4gICAgICByZXdhcmRUaHJlc2hvbGQsXG4gICAgICByZXdhcmRzLFxuICAgICAgZGVsZWdhdGlvbkZlZSxcbiAgICAgIG5ldyBCTigwKSwgXG4gICAgICBhdmF4QXNzZXRJRCxcbiAgICAgIG1lbW8sIGFzT2ZcbiAgICApO1xuXG4gICAgaWYoISBhd2FpdCB0aGlzLmNoZWNrR29vc2VFZ2coYnVpbHRVbnNpZ25lZFR4KSkge1xuICAgICAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cbiAgICAgIHRocm93IG5ldyBFcnJvcihcIkZhaWxlZCBHb29zZSBFZ2cgQ2hlY2tcIik7XG4gICAgfVxuXG4gICAgcmV0dXJuIGJ1aWx0VW5zaWduZWRUeDtcbiAgfVxuXG4gIC8qKlxuICAgICogQ2xhc3MgcmVwcmVzZW50aW5nIGFuIHVuc2lnbmVkIFtbQ3JlYXRlU3VibmV0VHhdXSB0cmFuc2FjdGlvbi5cbiAgICAqXG4gICAgKiBAcGFyYW0gdXR4b3NldCBBIHNldCBvZiBVVFhPcyB0aGF0IHRoZSB0cmFuc2FjdGlvbiBpcyBidWlsdCBvblxuICAgICogQHBhcmFtIGZyb21BZGRyZXNzZXMgVGhlIGFkZHJlc3NlcyBiZWluZyB1c2VkIHRvIHNlbmQgdGhlIGZ1bmRzIGZyb20gdGhlIFVUWE9zIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9XG4gICAgKiBAcGFyYW0gY2hhbmdlQWRkcmVzc2VzIFRoZSBhZGRyZXNzZXMgdGhhdCBjYW4gc3BlbmQgdGhlIGNoYW5nZSByZW1haW5pbmcgZnJvbSB0aGUgc3BlbnQgVVRYT3NcbiAgICAqIEBwYXJhbSBzdWJuZXRPd25lckFkZHJlc3NlcyBBbiBhcnJheSBvZiBhZGRyZXNzZXMgZm9yIG93bmVycyBvZiB0aGUgbmV3IHN1Ym5ldFxuICAgICogQHBhcmFtIHN1Ym5ldE93bmVyVGhyZXNob2xkIEEgbnVtYmVyIGluZGljYXRpbmcgdGhlIGFtb3VudCBvZiBzaWduYXR1cmVzIHJlcXVpcmVkIHRvIGFkZCB2YWxpZGF0b3JzIHRvIGEgc3VibmV0XG4gICAgKiBAcGFyYW0gbWVtbyBPcHRpb25hbCBjb250YWlucyBhcmJpdHJhcnkgYnl0ZXMsIHVwIHRvIDI1NiBieXRlc1xuICAgICogQHBhcmFtIGFzT2YgT3B0aW9uYWwuIFRoZSB0aW1lc3RhbXAgdG8gdmVyaWZ5IHRoZSB0cmFuc2FjdGlvbiBhZ2FpbnN0IGFzIGEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9pbmR1dG55L2JuLmpzL3xCTn1cbiAgICAqIFxuICAgICogQHJldHVybnMgQW4gdW5zaWduZWQgdHJhbnNhY3Rpb24gY3JlYXRlZCBmcm9tIHRoZSBwYXNzZWQgaW4gcGFyYW1ldGVycy5cbiAgICAqL1xuICBidWlsZENyZWF0ZVN1Ym5ldFR4ID0gYXN5bmMgKFxuICAgIHV0eG9zZXQ6VVRYT1NldCwgXG4gICAgZnJvbUFkZHJlc3NlczpBcnJheTxzdHJpbmc+LFxuICAgIGNoYW5nZUFkZHJlc3NlczpBcnJheTxzdHJpbmc+LFxuICAgIHN1Ym5ldE93bmVyQWRkcmVzc2VzOkFycmF5PHN0cmluZz4sXG4gICAgc3VibmV0T3duZXJUaHJlc2hvbGQ6bnVtYmVyLCBcbiAgICBtZW1vOlBheWxvYWRCYXNlfEJ1ZmZlciA9IHVuZGVmaW5lZCwgXG4gICAgYXNPZjpCTiA9IFVuaXhOb3coKVxuICApOlByb21pc2U8VW5zaWduZWRUeD4gPT4ge1xuICAgIGNvbnN0IGZyb206QXJyYXk8QnVmZmVyPiA9IHRoaXMuX2NsZWFuQWRkcmVzc0FycmF5KGZyb21BZGRyZXNzZXMsICdidWlsZENyZWF0ZVN1Ym5ldFR4JykubWFwKChhKSA9PiBiaW50b29scy5zdHJpbmdUb0FkZHJlc3MoYSkpO1xuICAgIGNvbnN0IGNoYW5nZTpBcnJheTxCdWZmZXI+ID0gdGhpcy5fY2xlYW5BZGRyZXNzQXJyYXkoY2hhbmdlQWRkcmVzc2VzLCAnYnVpbGRDcmVhdGVTdWJuZXRUeCcpLm1hcCgoYSkgPT4gYmludG9vbHMuc3RyaW5nVG9BZGRyZXNzKGEpKTtcbiAgICBjb25zdCBvd25lcnM6QXJyYXk8QnVmZmVyPiA9IHRoaXMuX2NsZWFuQWRkcmVzc0FycmF5KHN1Ym5ldE93bmVyQWRkcmVzc2VzLCAnYnVpbGRDcmVhdGVTdWJuZXRUeCcpLm1hcCgoYSkgPT4gYmludG9vbHMuc3RyaW5nVG9BZGRyZXNzKGEpKTtcblxuICAgIGlmKCBtZW1vIGluc3RhbmNlb2YgUGF5bG9hZEJhc2UpIHtcbiAgICAgIG1lbW8gPSBtZW1vLmdldFBheWxvYWQoKTtcbiAgICB9XG5cbiAgICBjb25zdCBhdmF4QXNzZXRJRDpCdWZmZXIgPSBhd2FpdCB0aGlzLmdldEFWQVhBc3NldElEKCk7XG5cbiAgICBjb25zdCBidWlsdFVuc2lnbmVkVHg6VW5zaWduZWRUeCA9IHV0eG9zZXQuYnVpbGRDcmVhdGVTdWJuZXRUeChcbiAgICAgIHRoaXMuY29yZS5nZXROZXR3b3JrSUQoKSwgXG4gICAgICBiaW50b29scy5jYjU4RGVjb2RlKHRoaXMuYmxvY2tjaGFpbklEKSwgXG4gICAgICBmcm9tLFxuICAgICAgY2hhbmdlLFxuICAgICAgb3duZXJzLFxuICAgICAgc3VibmV0T3duZXJUaHJlc2hvbGQsXG4gICAgICB0aGlzLmdldENyZWF0aW9uVHhGZWUoKSwgXG4gICAgICBhdmF4QXNzZXRJRCxcbiAgICAgIG1lbW8sIGFzT2ZcbiAgICApO1xuXG4gICAgaWYoISBhd2FpdCB0aGlzLmNoZWNrR29vc2VFZ2coYnVpbHRVbnNpZ25lZFR4LCB0aGlzLmdldENyZWF0aW9uVHhGZWUoKSkpIHtcbiAgICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJGYWlsZWQgR29vc2UgRWdnIENoZWNrXCIpO1xuICAgIH1cblxuICAgIHJldHVybiBidWlsdFVuc2lnbmVkVHg7XG4gIH1cblxuICAvKipcbiAgICogQGlnbm9yZVxuICAgKi9cbiAgcHJvdGVjdGVkIF9jbGVhbkFkZHJlc3NBcnJheShhZGRyZXNzZXM6QXJyYXk8c3RyaW5nPiB8IEFycmF5PEJ1ZmZlcj4sIGNhbGxlcjpzdHJpbmcpOkFycmF5PHN0cmluZz4ge1xuICAgIGNvbnN0IGFkZHJzOkFycmF5PHN0cmluZz4gPSBbXTtcbiAgICBjb25zdCBjaGFpbmlkOnN0cmluZyA9IHRoaXMuZ2V0QmxvY2tjaGFpbkFsaWFzKCkgPyB0aGlzLmdldEJsb2NrY2hhaW5BbGlhcygpIDogdGhpcy5nZXRCbG9ja2NoYWluSUQoKTtcbiAgICBpZiAoYWRkcmVzc2VzICYmIGFkZHJlc3Nlcy5sZW5ndGggPiAwKSB7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGFkZHJlc3Nlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICBpZiAodHlwZW9mIGFkZHJlc3Nlc1tpXSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICBpZiAodHlwZW9mIHRoaXMucGFyc2VBZGRyZXNzKGFkZHJlc3Nlc1tpXSBhcyBzdHJpbmcpID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIkVycm9yIC0gSW52YWxpZCBhZGRyZXNzIGZvcm1hdFwiKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgYWRkcnMucHVzaChhZGRyZXNzZXNbaV0gYXMgc3RyaW5nKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBhZGRycy5wdXNoKGJpbnRvb2xzLmFkZHJlc3NUb1N0cmluZyh0aGlzLmNvcmUuZ2V0SFJQKCksIGNoYWluaWQsIGFkZHJlc3Nlc1tpXSBhcyBCdWZmZXIpKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gYWRkcnM7XG4gIH1cblxuICAvKipcbiAgICogVGhpcyBjbGFzcyBzaG91bGQgbm90IGJlIGluc3RhbnRpYXRlZCBkaXJlY3RseS5cbiAgICogSW5zdGVhZCB1c2UgdGhlIFtbQXZhbGFuY2hlLmFkZEFQSV1dIG1ldGhvZC5cbiAgICpcbiAgICogQHBhcmFtIGNvcmUgQSByZWZlcmVuY2UgdG8gdGhlIEF2YWxhbmNoZSBjbGFzc1xuICAgKiBAcGFyYW0gYmFzZXVybCBEZWZhdWx0cyB0byB0aGUgc3RyaW5nIFwiL2V4dC9QXCIgYXMgdGhlIHBhdGggdG8gYmxvY2tjaGFpbidzIGJhc2V1cmxcbiAgICovXG4gIGNvbnN0cnVjdG9yKGNvcmU6QXZhbGFuY2hlQ29yZSwgYmFzZXVybDpzdHJpbmcgPSAnL2V4dC9iYy9QJykgeyBcbiAgICBzdXBlcihjb3JlLCBiYXNldXJsKTsgXG4gICAgdGhpcy5ibG9ja2NoYWluSUQgPSBQbGF0Zm9ybUNoYWluSUQ7XG4gICAgY29uc3QgbmV0aWQ6bnVtYmVyID0gY29yZS5nZXROZXR3b3JrSUQoKTtcbiAgICBpZiAobmV0aWQgaW4gRGVmYXVsdHMubmV0d29yayAmJiB0aGlzLmJsb2NrY2hhaW5JRCBpbiBEZWZhdWx0cy5uZXR3b3JrW25ldGlkXSkge1xuICAgICAgY29uc3QgeyBhbGlhcyB9ID0gRGVmYXVsdHMubmV0d29ya1tuZXRpZF1bdGhpcy5ibG9ja2NoYWluSURdO1xuICAgICAgdGhpcy5rZXljaGFpbiA9IG5ldyBLZXlDaGFpbih0aGlzLmNvcmUuZ2V0SFJQKCksIGFsaWFzKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5rZXljaGFpbiA9IG5ldyBLZXlDaGFpbih0aGlzLmNvcmUuZ2V0SFJQKCksIHRoaXMuYmxvY2tjaGFpbklEKTtcbiAgICB9XG4gIH1cbn1cblxuIl19