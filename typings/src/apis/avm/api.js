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
exports.AVMAPI = void 0;
/**
 * @packageDocumentation
 * @module API-AVM
 */
const bn_js_1 = __importDefault(require("bn.js"));
const buffer_1 = require("buffer/");
const bintools_1 = __importDefault(require("../../utils/bintools"));
const utxos_1 = require("./utxos");
const constants_1 = require("./constants");
const keychain_1 = require("./keychain");
const tx_1 = require("./tx");
const payload_1 = require("../../utils/payload");
const helperfunctions_1 = require("../../utils/helperfunctions");
const jrpcapi_1 = require("../../common/jrpcapi");
const constants_2 = require("../../utils/constants");
const output_1 = require("../../common/output");
/**
 * @ignore
 */
const bintools = bintools_1.default.getInstance();
/**
 * Class for interacting with a node endpoint that is using the AVM.
 *
 * @category RPCAPIs
 *
 * @remarks This extends the [[JRPCAPI]] class. This class should not be directly called. Instead, use the [[Dijets.addAPI]] function to register this interface with Dijets.
 */
class AVMAPI extends jrpcapi_1.JRPCAPI {
    /**
     * This class should not be instantiated directly. Instead use the [[Dijets.addAPI]] method.
     *
     * @param core A reference to the Dijets class
     * @param baseurl Defaults to the string "/ext/bc/X" as the path to blockchain's baseurl
     * @param blockchainID The Blockchain's ID. Defaults to an empty string: ''
     */
    constructor(core, baseurl = '/ext/bc/X', blockchainID = '') {
        super(core, baseurl);
        /**
         * @ignore
         */
        this.keychain = new keychain_1.KeyChain('', '');
        this.blockchainID = '';
        this.blockchainAlias = undefined;
        this.DJTXAssetID = undefined;
        this.txFee = undefined;
        this.creationTxFee = undefined;
        /**
         * Gets the alias for the blockchainID if it exists, otherwise returns `undefined`.
         *
         * @returns The alias for the blockchainID
         */
        this.getBlockchainAlias = () => {
            if (typeof this.blockchainAlias === "undefined") {
                const netid = this.core.getNetworkID();
                if (netid in constants_2.Defaults.network && this.blockchainID in constants_2.Defaults.network[netid]) {
                    this.blockchainAlias = constants_2.Defaults.network[netid][this.blockchainID].alias;
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
            if (typeof blockchainID === 'undefined' && typeof constants_2.Defaults.network[netid] !== "undefined") {
                this.blockchainID = constants_2.Defaults.network[netid].X.blockchainID; //default to X-Chain
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
            return bintools.parseAddress(addr, blockchainID, alias, constants_1.AVMConstants.ADDRESSLENGTH);
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
                const asset = yield this.getAssetDescription(constants_2.PrimaryAssetAlias);
                this.DJTXAssetID = asset.assetID;
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
            return this.core.getNetworkID() in constants_2.Defaults.network ? new bn_js_1.default(constants_2.Defaults.network[this.core.getNetworkID()]["X"]["txFee"]) : new bn_js_1.default(0);
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
            return this.core.getNetworkID() in constants_2.Defaults.network ? new bn_js_1.default(constants_2.Defaults.network[this.core.getNetworkID()]["X"]["creationTxFee"]) : new bn_js_1.default(0);
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
         * @returns The instance of [[KeyChain]] for this class
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
            if (fee.lte(constants_2.ONEDJTX.mul(new bn_js_1.default(10))) || fee.lte(outputTotal)) {
                return true;
            }
            else {
                return false;
            }
        });
        /**
           * Gets the balance of a particular asset on a blockchain.
           *
           * @param address The address to pull the asset balance from
           * @param assetID The assetID to pull the balance from
           *
           * @returns Promise with the balance of the assetID as a {@link https://github.com/indutny/bn.js/|BN} on the provided address for the blockchain.
           */
        this.getBalance = (address, assetID) => __awaiter(this, void 0, void 0, function* () {
            if (typeof this.parseAddress(address) === 'undefined') {
                /* istanbul ignore next */
                throw new Error("Error - AVMAPI.getBalance: Invalid address format");
            }
            const params = {
                address,
                assetID,
            };
            return this.callMethod('avm.getBalance', params).then((response) => response.data.result);
        });
        /**
           * Creates an address (and associated private keys) on a user on a blockchain.
           *
           * @param username Name of the user to create the address under
           * @param password Password to unlock the user and encrypt the private key
           *
           * @returns Promise for a string representing the address created by the vm.
           */
        this.createAddress = (username, password) => __awaiter(this, void 0, void 0, function* () {
            const params = {
                username,
                password,
            };
            return this.callMethod('avm.createAddress', params).then((response) => response.data.result.address);
        });
        /**
         * Create a new fixed-cap, fungible asset. A quantity of it is created at initialization and there no more is ever created.
         *
         * @param username The user paying the transaction fee (in $DJTX) for asset creation
         * @param password The password for the user paying the transaction fee (in $DJTX) for asset creation
         * @param name The human-readable name for the asset
         * @param symbol Optional. The shorthand symbol for the asset. Between 0 and 4 characters
         * @param denomination Optional. Determines how balances of this asset are displayed by user interfaces. Default is 0
         * @param initialHolders An array of objects containing the field "address" and "amount" to establish the genesis values for the new asset
         *
         * ```js
         * Example initialHolders:
         * [
         *     {
         *         "address": "X-djtx1kj06lhgx84h39snsljcey3tpc046ze68mek3g5",
         *         "amount": 10000
         *     },
         *     {
         *         "address": "X-djtx1am4w6hfrvmh3akduzkjthrtgtqafalce6an8cr",
         *         "amount": 50000
         *     }
         * ]
         * ```
         *
         * @returns Returns a Promise<string> containing the base 58 string representation of the ID of the newly created asset.
         */
        this.createFixedCapAsset = (username, password, name, symbol, denomination, initialHolders) => __awaiter(this, void 0, void 0, function* () {
            const params = {
                name,
                symbol,
                denomination,
                username,
                password,
                initialHolders,
            };
            return this.callMethod('avm.createFixedCapAsset', params).then((response) => response.data.result.assetID);
        });
        /**
           * Create a new variable-cap, fungible asset. No units of the asset exist at initialization. Minters can mint units of this asset using createMintTx, signMintTx and sendMintTx.
           *
           * @param username The user paying the transaction fee (in $DJTX) for asset creation
           * @param password The password for the user paying the transaction fee (in $DJTX) for asset creation
           * @param name The human-readable name for the asset
           * @param symbol Optional. The shorthand symbol for the asset -- between 0 and 4 characters
           * @param denomination Optional. Determines how balances of this asset are displayed by user interfaces. Default is 0
           * @param minterSets is a list where each element specifies that threshold of the addresses in minters may together mint more of the asset by signing a minting transaction
           *
           * ```js
           * Example minterSets:
           * [
           *      {
           *          "minters":[
           *              "X-djtx1am4w6hfrvmh3akduzkjthrtgtqafalce6an8cr"
           *          ],
           *          "threshold": 1
           *      },
           *      {
           *          "minters": [
           *              "X-djtx1am4w6hfrvmh3akduzkjthrtgtqafalce6an8cr",
           *              "X-djtx1kj06lhgx84h39snsljcey3tpc046ze68mek3g5",
           *              "X-djtx1yell3e4nln0m39cfpdhgqprsd87jkh4qnakklx"
           *          ],
           *          "threshold": 2
           *      }
           * ]
           * ```
           *
           * @returns Returns a Promise<string> containing the base 58 string representation of the ID of the newly created asset.
           */
        this.createVariableCapAsset = (username, password, name, symbol, denomination, minterSets) => __awaiter(this, void 0, void 0, function* () {
            const params = {
                name,
                symbol,
                denomination,
                username,
                password,
                minterSets,
            };
            return this.callMethod('avm.createVariableCapAsset', params).then((response) => response.data.result.assetID);
        });
        /**
           * Create an unsigned transaction to mint more of an asset.
           *
           * @param amount The units of the asset to mint
           * @param assetID The ID of the asset to mint
           * @param to The address to assign the units of the minted asset
           * @param minters Addresses of the minters responsible for signing the transaction
           *
           * @returns Returns a Promise<string> containing the base 58 string representation of the unsigned transaction.
           */
        this.mint = (username, password, amount, assetID, to, minters) => __awaiter(this, void 0, void 0, function* () {
            let asset;
            let amnt;
            if (typeof assetID !== 'string') {
                asset = bintools.cb58Encode(assetID);
            }
            else {
                asset = assetID;
            }
            if (typeof amount === 'number') {
                amnt = new bn_js_1.default(amount);
            }
            else {
                amnt = amount;
            }
            const params = {
                username: username,
                password: password,
                amount: amnt.toString(10),
                assetID: asset,
                to,
                minters
            };
            return this.callMethod('avm.mint', params).then((response) => response.data.result.txID);
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
            if (typeof this.parseAddress(address) === 'undefined') {
                /* istanbul ignore next */
                throw new Error("Error - AVMAPI.exportKey: Invalid address format");
            }
            const params = {
                username,
                password,
                address,
            };
            return this.callMethod('avm.exportKey', params).then((response) => response.data.result.privateKey);
        });
        /**
           * Imports a private key into the node's keystore under an user and for a blockchain.
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
            return this.callMethod('avm.importKey', params).then((response) => response.data.result.address);
        });
        /**
          * Send ANT (Dijets Native Token) assets including DJTX from the X-Chain to an account on the P-Chain or C-Chain.
          *
          * After calling this method, you must call the P-Chain's `importDJTX` or the C-Chain’s `import` method to complete the transfer.
          *
          * @param username The Keystore user that controls the P-Chain or C-Chain account specified in `to`
          * @param password The password of the Keystore user
          * @param to The account on the P-Chain or C-Chain to send the asset to.
          * @param amount Amount of asset to export as a {@link https://github.com/indutny/bn.js/|BN}
          * @param assetID The asset id which is being sent
          *
          * @returns String representing the transaction id
          */
        this.export = (username, password, to, amount, assetID) => __awaiter(this, void 0, void 0, function* () {
            const params = {
                to,
                amount: amount.toString(10),
                username,
                password,
                assetID
            };
            return this.callMethod('avm.export', params).then((response) => response.data.result.txID);
        });
        /**
           * Send DJTX from the X-Chain to an account on the P-Chain or C-Chain.
           *
           * After calling this method, you must call the P-Chain’s or C-Chain's importDJTX method to complete the transfer.
           *
           * @param username The Keystore user that controls the P-Chain account specified in `to`
           * @param password The password of the Keystore user
           * @param to The account on the P-Chain or C-Chain to send the DJTX to.
           * @param amount Amount of DJTX to export as a {@link https://github.com/indutny/bn.js/|BN}
           *
           * @returns String representing the transaction id
           */
        this.exportDJTX = (username, password, to, amount) => __awaiter(this, void 0, void 0, function* () {
            const params = {
                to,
                amount: amount.toString(10),
                username,
                password,
            };
            return this.callMethod('avm.exportDJTX', params).then((response) => response.data.result.txID);
        });
        /**
         * Send ANT (Dijets Native Token) assets including DJTX from an account on the P-Chain or C-Chain to an address on the X-Chain. This transaction
         * must be signed with the key of the account that the asset is sent from and which pays
         * the transaction fee.
         *
         * @param username The Keystore user that controls the account specified in `to`
         * @param password The password of the Keystore user
         * @param to The address of the account the asset is sent to.
         * @param sourceChain The chainID where the funds are coming from. Ex: "C"
         *
         * @returns Promise for a string for the transaction, which should be sent to the network
         * by calling issueTx.
         */
        this.import = (username, password, to, sourceChain) => __awaiter(this, void 0, void 0, function* () {
            const params = {
                to,
                sourceChain,
                username,
                password,
            };
            return this.callMethod('avm.import', params)
                .then((response) => response.data.result.txID);
        });
        /**
           * Finalize a transfer of DJTX from the P-Chain to the X-Chain.
           *
           * Before this method is called, you must call the P-Chain’s `exportDJTX` method to initiate the transfer.
           * @param username The Keystore user that controls the address specified in `to`
           * @param password The password of the Keystore user
           * @param to The address the DJTX is sent to. This must be the same as the to argument in the corresponding call to the P-Chain’s exportDJTX, except that the prepended X- should be included in this argument
           * @param sourceChain Chain the funds are coming from.
           *
           * @returns String representing the transaction id
           */
        this.importDJTX = (username, password, to, sourceChain) => __awaiter(this, void 0, void 0, function* () {
            const params = {
                to,
                sourceChain,
                username,
                password,
            };
            return this.callMethod('avm.importDJTX', params).then((response) => response.data.result.txID);
        });
        /**
           * Lists all the addresses under a user.
           *
           * @param username The user to list addresses
           * @param password The password of the user to list the addresses
           *
           * @returns Promise of an array of address strings in the format specified by the blockchain.
           */
        this.listAddresses = (username, password) => __awaiter(this, void 0, void 0, function* () {
            const params = {
                username,
                password,
            };
            return this.callMethod('avm.listAddresses', params).then((response) => response.data.result.addresses);
        });
        /**
           * Retrieves all assets for an address on a server and their associated balances.
           *
           * @param address The address to get a list of assets
           *
           * @returns Promise of an object mapping assetID strings with {@link https://github.com/indutny/bn.js/|BN} balance for the address on the blockchain.
           */
        this.getAllBalances = (address) => __awaiter(this, void 0, void 0, function* () {
            if (typeof this.parseAddress(address) === 'undefined') {
                /* istanbul ignore next */
                throw new Error("Error - AVMAPI.getAllBalances: Invalid address format");
            }
            const params = {
                address,
            };
            return this.callMethod('avm.getAllBalances', params).then((response) => response.data.result.balances);
        });
        /**
           * Retrieves an assets name and symbol.
           *
           * @param assetID Either a {@link https://github.com/feross/buffer|Buffer} or an b58 serialized string for the AssetID or its alias.
           *
           * @returns Returns a Promise<object> with keys "name" and "symbol".
           */
        this.getAssetDescription = (assetID) => __awaiter(this, void 0, void 0, function* () {
            let asset;
            if (typeof assetID !== 'string') {
                asset = bintools.cb58Encode(assetID);
            }
            else {
                asset = assetID;
            }
            const params = {
                assetID: asset,
            };
            return this.callMethod('avm.getAssetDescription', params).then((response) => ({
                name: response.data.result.name,
                symbol: response.data.result.symbol,
                assetID: bintools.cb58Decode(response.data.result.assetID),
                denomination: parseInt(response.data.result.denomination, 10),
            }));
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
            return this.callMethod('avm.getTx', params).then((response) => response.data.result.tx);
        });
        /**
         * Returns the status of a provided transaction ID by calling the node's `getTxStatus` method.
         *
         * @param txid The string representation of the transaction ID
         *
         * @returns Returns a Promise<string> containing the status retrieved from the node
         */
        this.getTxStatus = (txid) => __awaiter(this, void 0, void 0, function* () {
            const params = {
                txID: txid,
            };
            return this.callMethod('avm.getTxStatus', params).then((response) => response.data.result.status);
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
            return this.callMethod('avm.getUTXOs', params).then((response) => {
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
                return response.data.result;
            });
        });
        /**
         * Helper function which creates an unsigned transaction. For more granular control, you may create your own
         * [[UnsignedTx]] manually (with their corresponding [[TransferableInput]]s, [[TransferableOutput]]s, and [[TransferOperation]]s).
         *
         * @param utxoset A set of UTXOs that the transaction is built on
         * @param amount The amount of AssetID to be spent in its smallest denomination, represented as {@link https://github.com/indutny/bn.js/|BN}.
         * @param assetID The assetID of the value being sent
         * @param toAddresses The addresses to send the funds
         * @param fromAddresses The addresses being used to send the funds from the UTXOs provided
         * @param changeAddresses The addresses that can spend the change remaining from the spent UTXOs
         * @param memo Optional CB58 Buffer or String which contains arbitrary bytes, up to 256 bytes
         * @param asOf Optional. The timestamp to verify the transaction against as a {@link https://github.com/indutny/bn.js/|BN}
         * @param locktime Optional. The locktime field created in the resulting outputs
         * @param threshold Optional. The number of signatures required to spend the funds in the resultant UTXO
         *
         * @returns An unsigned transaction ([[UnsignedTx]]) which contains a [[BaseTx]].
         *
         * @remarks
         * This helper exists because the endpoint API should be the primary point of entry for most functionality.
         */
        this.buildBaseTx = (utxoset, amount, assetID = undefined, toAddresses, fromAddresses, changeAddresses, memo = undefined, asOf = helperfunctions_1.UnixNow(), locktime = new bn_js_1.default(0), threshold = 1) => __awaiter(this, void 0, void 0, function* () {
            const to = this._cleanAddressArray(toAddresses, 'buildBaseTx').map((a) => bintools.stringToAddress(a));
            const from = this._cleanAddressArray(fromAddresses, 'buildBaseTx').map((a) => bintools.stringToAddress(a));
            const change = this._cleanAddressArray(changeAddresses, 'buildBaseTx').map((a) => bintools.stringToAddress(a));
            if (typeof assetID === 'string') {
                assetID = bintools.cb58Decode(assetID);
            }
            if (memo instanceof payload_1.PayloadBase) {
                memo = memo.getPayload();
            }
            const builtUnsignedTx = utxoset.buildBaseTx(this.core.getNetworkID(), bintools.cb58Decode(this.blockchainID), amount, assetID, to, from, change, this.getTxFee(), yield this.getDJTXAssetID(), memo, asOf, locktime, threshold);
            if (!(yield this.checkGooseEgg(builtUnsignedTx))) {
                /* istanbul ignore next */
                throw new Error("Failed Goose Egg Check");
            }
            return builtUnsignedTx;
        });
        /**
         * Helper function which creates an unsigned NFT Transfer. For more granular control, you may create your own
         * [[UnsignedTx]] manually (with their corresponding [[TransferableInput]]s, [[TransferableOutput]]s, and [[TransferOperation]]s).
         *
         * @param utxoset  A set of UTXOs that the transaction is built on
         * @param toAddresses The addresses to send the NFT
         * @param fromAddresses The addresses being used to send the NFT from the utxoID provided
         * @param changeAddresses The addresses that can spend the change remaining from the spent UTXOs
         * @param utxoid A base58 utxoID or an array of base58 utxoIDs for the nfts this transaction is sending
         * @param memo Optional CB58 Buffer or String which contains arbitrary bytes, up to 256 bytes
         * @param asOf Optional. The timestamp to verify the transaction against as a {@link https://github.com/indutny/bn.js/|BN}
         * @param locktime Optional. The locktime field created in the resulting outputs
         * @param threshold Optional. The number of signatures required to spend the funds in the resultant UTXO
         *
         * @returns An unsigned transaction ([[UnsignedTx]]) which contains a [[NFTTransferTx]].
         *
         * @remarks
         * This helper exists because the endpoint API should be the primary point of entry for most functionality.
         */
        this.buildNFTTransferTx = (utxoset, toAddresses, fromAddresses, changeAddresses, utxoid, memo = undefined, asOf = helperfunctions_1.UnixNow(), locktime = new bn_js_1.default(0), threshold = 1) => __awaiter(this, void 0, void 0, function* () {
            const to = this._cleanAddressArray(toAddresses, 'buildNFTTransferTx').map((a) => bintools.stringToAddress(a));
            const from = this._cleanAddressArray(fromAddresses, 'buildNFTTransferTx').map((a) => bintools.stringToAddress(a));
            const change = this._cleanAddressArray(changeAddresses, "buildCreateNFTAssetTx").map(a => bintools.stringToAddress(a));
            if (memo instanceof payload_1.PayloadBase) {
                memo = memo.getPayload();
            }
            const djtxAssetID = yield this.getDJTXAssetID();
            let utxoidArray = [];
            if (typeof utxoid === 'string') {
                utxoidArray = [utxoid];
            }
            else if (Array.isArray(utxoid)) {
                utxoidArray = utxoid;
            }
            const builtUnsignedTx = utxoset.buildNFTTransferTx(this.core.getNetworkID(), bintools.cb58Decode(this.blockchainID), to, from, change, utxoidArray, this.getTxFee(), djtxAssetID, memo, asOf, locktime, threshold);
            if (!(yield this.checkGooseEgg(builtUnsignedTx))) {
                /* istanbul ignore next */
                throw new Error("Failed Goose Egg Check");
            }
            return builtUnsignedTx;
        });
        /**
         * Helper function which creates an unsigned Import Tx. For more granular control, you may create your own
         * [[UnsignedTx]] manually (with their corresponding [[TransferableInput]]s, [[TransferableOutput]]s, and [[TransferOperation]]s).
         *
         * @param utxoset  A set of UTXOs that the transaction is built on
         * @param ownerAddresses The addresses being used to import
         * @param sourceChain The chainid for where the import is coming from
         * @param toAddresses The addresses to send the funds
         * @param fromAddresses The addresses being used to send the funds from the UTXOs provided
         * @param changeAddresses The addresses that can spend the change remaining from the spent UTXOs
         * @param memo Optional CB58 Buffer or String which contains arbitrary bytes, up to 256 bytes
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
            const to = this._cleanAddressArray(toAddresses, 'buildImportTx').map((a) => bintools.stringToAddress(a));
            const from = this._cleanAddressArray(fromAddresses, 'buildImportTx').map((a) => bintools.stringToAddress(a));
            const change = this._cleanAddressArray(changeAddresses, 'buildImportTx').map((a) => bintools.stringToAddress(a));
            let srcChain = undefined;
            if (typeof sourceChain === "undefined") {
                throw new Error("Error - AVMAPI.buildImportTx: Source ChainID is undefined.");
            }
            else if (typeof sourceChain === "string") {
                srcChain = sourceChain;
                sourceChain = bintools.cb58Decode(sourceChain);
            }
            else if (!(sourceChain instanceof buffer_1.Buffer)) {
                srcChain = bintools.cb58Encode(sourceChain);
                throw new Error("Error - AVMAPI.buildImportTx: Invalid destinationChain type: " + (typeof sourceChain));
            }
            const atomicUTXOs = yield (yield this.getUTXOs(ownerAddresses, srcChain, 0, undefined)).utxos;
            const djtxAssetID = yield this.getDJTXAssetID();
            const atomics = atomicUTXOs.getAllUTXOs();
            if (atomics.length === 0) {
                throw new Error("Error - AVMAPI.buildImportTx: No atomic UTXOs to import from " + srcChain + " using addresses: " + ownerAddresses.join(", "));
            }
            if (memo instanceof payload_1.PayloadBase) {
                memo = memo.getPayload();
            }
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
         * @param memo Optional CB58 Buffer or String which contains arbitrary bytes, up to 256 bytes
         * @param asOf Optional. The timestamp to verify the transaction against as a {@link https://github.com/indutny/bn.js/|BN}
         * @param locktime Optional. The locktime field created in the resulting outputs
         * @param threshold Optional. The number of signatures required to spend the funds in the resultant UTXO
         * @param assetID Optional. The assetID of the asset to send. Defaults to DJTX assetID.
         * Regardless of the asset which you're exporting, all fees are paid in DJTX.
         *
         * @returns An unsigned transaction ([[UnsignedTx]]) which contains an [[ExportTx]].
         */
        this.buildExportTx = (utxoset, amount, destinationChain, toAddresses, fromAddresses, changeAddresses = undefined, memo = undefined, asOf = helperfunctions_1.UnixNow(), locktime = new bn_js_1.default(0), threshold = 1, assetID = undefined) => __awaiter(this, void 0, void 0, function* () {
            let prefixes = {};
            toAddresses.map((a) => {
                prefixes[a.split("-")[0]] = true;
            });
            if (Object.keys(prefixes).length !== 1) {
                throw new Error("Error - AVMAPI.buildExportTx: To addresses must have the same chainID prefix.");
            }
            if (typeof destinationChain === "undefined") {
                throw new Error("Error - AVMAPI.buildExportTx: Destination ChainID is undefined.");
            }
            else if (typeof destinationChain === "string") {
                destinationChain = bintools.cb58Decode(destinationChain); //
            }
            else if (!(destinationChain instanceof buffer_1.Buffer)) {
                throw new Error("Error - AVMAPI.buildExportTx: Invalid destinationChain type: " + (typeof destinationChain));
            }
            if (destinationChain.length !== 32) {
                throw new Error("Error - AVMAPI.buildExportTx: Destination ChainID must be 32 bytes in length.");
            }
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
            if (typeof assetID === "undefined") {
                assetID = bintools.cb58Encode(djtxAssetID);
            }
            const builtUnsignedTx = utxoset.buildExportTx(this.core.getNetworkID(), bintools.cb58Decode(this.blockchainID), amount, bintools.cb58Decode(assetID), to, from, change, destinationChain, this.getTxFee(), djtxAssetID, memo, asOf, locktime, threshold);
            if (!(yield this.checkGooseEgg(builtUnsignedTx))) {
                /* istanbul ignore next */
                throw new Error("Failed Goose Egg Check");
            }
            return builtUnsignedTx;
        });
        /**
         * Creates an unsigned transaction. For more granular control, you may create your own
         * [[UnsignedTx]] manually (with their corresponding [[TransferableInput]]s, [[TransferableOutput]]s, and [[TransferOperation]]s).
         *
         * @param utxoset A set of UTXOs that the transaction is built on
         * @param fromAddresses The addresses being used to send the funds from the UTXOs {@link https://github.com/feross/buffer|Buffer}
         * @param changeAddresses The addresses that can spend the change remaining from the spent UTXOs
         * @param initialState The [[InitialStates]] that represent the intial state of a created asset
         * @param name String for the descriptive name of the asset
         * @param symbol String for the ticker symbol of the asset
         * @param denomination Number for the denomination which is 10^D. D must be >= 0 and <= 32. Ex: $1 DJTX = 10^9 $nDJTX
         * @param mintOutputs Optional. Array of [[SECPMintOutput]]s to be included in the transaction. These outputs can be spent to mint more tokens.
         * @param memo Optional CB58 Buffer or String which contains arbitrary bytes, up to 256 bytes
         * @param asOf Optional. The timestamp to verify the transaction against as a {@link https://github.com/indutny/bn.js/|BN}
         *
         * @returns An unsigned transaction ([[UnsignedTx]]) which contains a [[CreateAssetTx]].
         *
         */
        this.buildCreateAssetTx = (utxoset, fromAddresses, changeAddresses, initialStates, name, symbol, denomination, mintOutputs = undefined, memo = undefined, asOf = helperfunctions_1.UnixNow()) => __awaiter(this, void 0, void 0, function* () {
            let from = this._cleanAddressArray(fromAddresses, "buildCreateAssetTx").map(a => bintools.stringToAddress(a));
            let change = this._cleanAddressArray(changeAddresses, "buildCreateNFTAssetTx").map(a => bintools.stringToAddress(a));
            if (memo instanceof payload_1.PayloadBase) {
                memo = memo.getPayload();
            }
            /* istanbul ignore next */
            if (symbol.length > constants_1.AVMConstants.SYMBOLMAXLEN) {
                /* istanbul ignore next */
                throw new Error("Error - AVMAPI.buildCreateAssetTx: Symbols may not exceed length of " + constants_1.AVMConstants.SYMBOLMAXLEN);
            }
            /* istanbul ignore next */
            if (name.length > constants_1.AVMConstants.ASSETNAMELEN) {
                /* istanbul ignore next */
                throw new Error("Error - AVMAPI.buildCreateAssetTx: Names may not exceed length of " + constants_1.AVMConstants.ASSETNAMELEN);
            }
            const djtxAssetID = yield this.getDJTXAssetID();
            const builtUnsignedTx = utxoset.buildCreateAssetTx(this.core.getNetworkID(), bintools.cb58Decode(this.blockchainID), from, change, initialStates, name, symbol, denomination, mintOutputs, this.getCreationTxFee(), djtxAssetID, memo, asOf);
            if (!(yield this.checkGooseEgg(builtUnsignedTx, this.getCreationTxFee()))) {
                /* istanbul ignore next */
                throw new Error("Failed Goose Egg Check");
            }
            return builtUnsignedTx;
        });
        this.buildSECPMintTx = (utxoset, mintOwner, transferOwner, fromAddresses, changeAddresses, mintUTXOID, memo = undefined, asOf = helperfunctions_1.UnixNow()) => __awaiter(this, void 0, void 0, function* () {
            let from = this._cleanAddressArray(fromAddresses, "buildSECPMintTx").map(a => bintools.stringToAddress(a));
            let change = this._cleanAddressArray(changeAddresses, "buildSECPMintTx").map(a => bintools.stringToAddress(a));
            if (memo instanceof payload_1.PayloadBase) {
                memo = memo.getPayload();
            }
            let djtxAssetID = yield this.getDJTXAssetID();
            const builtUnsignedTx = utxoset.buildSECPMintTx(this.core.getNetworkID(), bintools.cb58Decode(this.blockchainID), mintOwner, transferOwner, from, change, mintUTXOID, this.getTxFee(), djtxAssetID, memo, asOf);
            if (!(yield this.checkGooseEgg(builtUnsignedTx))) {
                /* istanbul ignore next */
                throw new Error("Failed Goose Egg Check");
            }
            return builtUnsignedTx;
        });
        /**
        * Creates an unsigned transaction. For more granular control, you may create your own
        * [[UnsignedTx]] manually (with their corresponding [[TransferableInput]]s, [[TransferableOutput]]s, and [[TransferOperation]]s).
        *
        * @param utxoset A set of UTXOs that the transaction is built on
        * @param fromAddresses The addresses being used to send the funds from the UTXOs {@link https://github.com/feross/buffer|Buffer}
        * @param changeAddresses The addresses that can spend the change remaining from the spent UTXOs
        * @param minterSets is a list where each element specifies that threshold of the addresses in minters may together mint more of the asset by signing a minting transaction
        * @param name String for the descriptive name of the asset
        * @param symbol String for the ticker symbol of the asset
        * @param memo Optional CB58 Buffer or String which contains arbitrary bytes, up to 256 bytes
        * @param asOf Optional. The timestamp to verify the transaction against as a {@link https://github.com/indutny/bn.js/|BN}
        * @param locktime Optional. The locktime field created in the resulting mint output
        *
        * ```js
        * Example minterSets:
        * [
        *      {
        *          "minters":[
        *              "X-djtx1ghstjukrtw8935lryqtnh643xe9a94u3tc75c7"
        *          ],
        *          "threshold": 1
        *      },
        *      {
        *          "minters": [
        *              "X-djtx1yell3e4nln0m39cfpdhgqprsd87jkh4qnakklx",
        *              "X-djtx1k4nr26c80jaquzm9369j5a4shmwcjn0vmemcjz",
        *              "X-djtx1ztkzsrjnkn0cek5ryvhqswdtcg23nhge3nnr5e"
        *          ],
        *          "threshold": 2
        *      }
        * ]
        * ```
        *
        * @returns An unsigned transaction ([[UnsignedTx]]) which contains a [[CreateAssetTx]].
        *
        */
        this.buildCreateNFTAssetTx = (utxoset, fromAddresses, changeAddresses, minterSets, name, symbol, memo = undefined, asOf = helperfunctions_1.UnixNow(), locktime = new bn_js_1.default(0)) => __awaiter(this, void 0, void 0, function* () {
            let from = this._cleanAddressArray(fromAddresses, "buildCreateNFTAssetTx").map(a => bintools.stringToAddress(a));
            let change = this._cleanAddressArray(changeAddresses, "buildCreateNFTAssetTx").map(a => bintools.stringToAddress(a));
            if (memo instanceof payload_1.PayloadBase) {
                memo = memo.getPayload();
            }
            if (name.length > constants_1.AVMConstants.ASSETNAMELEN) {
                /* istanbul ignore next */
                throw new Error("Error - AVMAPI.buildCreateNFTAssetTx: Names may not exceed length of " + constants_1.AVMConstants.ASSETNAMELEN);
            }
            if (symbol.length > constants_1.AVMConstants.SYMBOLMAXLEN) {
                /* istanbul ignore next */
                throw new Error("Error - AVMAPI.buildCreateNFTAssetTx: Symbols may not exceed length of " + constants_1.AVMConstants.SYMBOLMAXLEN);
            }
            let djtxAssetID = yield this.getDJTXAssetID();
            const builtUnsignedTx = utxoset.buildCreateNFTAssetTx(this.core.getNetworkID(), bintools.cb58Decode(this.blockchainID), from, change, minterSets, name, symbol, this.getCreationTxFee(), djtxAssetID, memo, asOf, locktime);
            if (!(yield this.checkGooseEgg(builtUnsignedTx, this.getCreationTxFee()))) {
                /* istanbul ignore next */
                throw new Error("Failed Goose Egg Check");
            }
            return builtUnsignedTx;
        });
        /**
        * Creates an unsigned transaction. For more granular control, you may create your own
        * [[UnsignedTx]] manually (with their corresponding [[TransferableInput]]s, [[TransferableOutput]]s, and [[TransferOperation]]s).
        *
        * @param utxoset  A set of UTXOs that the transaction is built on
        * @param owners Either a single or an array of [[OutputOwners]] to send the nft output
        * @param fromAddresses The addresses being used to send the NFT from the utxoID provided
        * @param changeAddresses The addresses that can spend the change remaining from the spent UTXOs
        * @param utxoid A base58 utxoID or an array of base58 utxoIDs for the nft mint output this transaction is sending
        * @param groupID Optional. The group this NFT is issued to.
        * @param payload Optional. Data for NFT Payload as either a [[PayloadBase]] or a {@link https://github.com/feross/buffer|Buffer}
        * @param memo Optional CB58 Buffer or String which contains arbitrary bytes, up to 256 bytes
        * @param asOf Optional. The timestamp to verify the transaction against as a {@link https://github.com/indutny/bn.js/|BN}
        *
        * @returns An unsigned transaction ([[UnsignedTx]]) which contains an [[OperationTx]].
        *
        */
        this.buildCreateNFTMintTx = (utxoset, owners, fromAddresses, changeAddresses, utxoid, groupID = 0, payload = undefined, memo = undefined, asOf = helperfunctions_1.UnixNow()) => __awaiter(this, void 0, void 0, function* () {
            let from = this._cleanAddressArray(fromAddresses, "buildCreateNFTMintTx").map(a => bintools.stringToAddress(a));
            let change = this._cleanAddressArray(changeAddresses, "buildCreateNFTMintTx").map(a => bintools.stringToAddress(a));
            if (memo instanceof payload_1.PayloadBase) {
                memo = memo.getPayload();
            }
            if (payload instanceof payload_1.PayloadBase) {
                payload = payload.getPayload();
            }
            if (typeof utxoid === 'string') {
                utxoid = [utxoid];
            }
            let djtxAssetID = yield this.getDJTXAssetID();
            if (owners instanceof output_1.OutputOwners) {
                owners = [owners];
            }
            const builtUnsignedTx = utxoset.buildCreateNFTMintTx(this.core.getNetworkID(), bintools.cb58Decode(this.blockchainID), owners, from, change, utxoid, groupID, payload, this.getTxFee(), djtxAssetID, memo, asOf);
            if (!(yield this.checkGooseEgg(builtUnsignedTx))) {
                /* istanbul ignore next */
                throw new Error("Failed Goose Egg Check");
            }
            return builtUnsignedTx;
        });
        /**
         * Helper function which takes an unsigned transaction and signs it, returning the resulting [[Tx]].
        *
        * @param utx The unsigned transaction of type [[UnsignedTx]]
        *
        * @returns A signed transaction of type [[Tx]]
        */
        this.signTx = (utx) => utx.sign(this.keychain);
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
                throw new Error('Error - avm.issueTx: provided tx is not expected type of string, Buffer, or Tx');
            }
            const params = {
                tx: Transaction.toString(),
            };
            return this.callMethod('avm.issueTx', params).then((response) => response.data.result.txID);
        });
        /**
         * Sends an amount of assetID to the specified address from a list of owned of addresses.
         *
         * @param username The user that owns the private keys associated with the `from` addresses
         * @param password The password unlocking the user
         * @param assetID The assetID of the asset to send
         * @param amount The amount of the asset to be sent
         * @param to The address of the recipient
         * @param from Optional. An array of addresses managed by the node's keystore for this blockchain which will fund this transaction
         * @param changeAddr Optional. An address to send the change
         * @param memo Optional. CB58 Buffer or String which contains arbitrary bytes, up to 256 bytes
         *
         * @returns Promise for the string representing the transaction's ID.
         */
        this.send = (username, password, assetID, amount, to, from = undefined, changeAddr = undefined, memo = undefined) => __awaiter(this, void 0, void 0, function* () {
            let asset;
            let amnt;
            if (typeof this.parseAddress(to) === 'undefined') {
                /* istanbul ignore next */
                throw new Error("Error - AVMAPI.send: Invalid address format");
            }
            if (typeof assetID !== 'string') {
                asset = bintools.cb58Encode(assetID);
            }
            else {
                asset = assetID;
            }
            if (typeof amount === 'number') {
                amnt = new bn_js_1.default(amount);
            }
            else {
                amnt = amount;
            }
            const params = {
                username: username,
                password: password,
                assetID: asset,
                amount: amnt.toString(10),
                to: to
            };
            from = this._cleanAddressArray(from, 'send');
            if (typeof from !== "undefined") {
                params["from"] = from;
            }
            if (typeof changeAddr !== 'undefined') {
                if (typeof this.parseAddress(changeAddr) === 'undefined') {
                    /* istanbul ignore next */
                    throw new Error("Error - AVMAPI.send: Invalid address format");
                }
                params["changeAddr"] = changeAddr;
            }
            if (typeof memo !== "undefined") {
                if (typeof memo !== 'string') {
                    params["memo"] = bintools.cb58Encode(memo);
                }
                else {
                    params["memo"] = memo;
                }
            }
            return this.callMethod('avm.send', params).then((response) => response.data.result);
        });
        /**
         * Sends an amount of assetID to an array of specified addresses from a list of owned of addresses.
         *
         * @param username The user that owns the private keys associated with the `from` addresses
         * @param password The password unlocking the user
         * @param sendOutputs The array of SendOutputs. A SendOutput is an object literal which contains an assetID, amount, and to.
         * @param from Optional. An array of addresses managed by the node's keystore for this blockchain which will fund this transaction
         * @param changeAddr Optional. An address to send the change
         * @param memo Optional. CB58 Buffer or String which contains arbitrary bytes, up to 256 bytes
         *
         * @returns Promise for the string representing the transaction's ID.
         */
        this.sendMultiple = (username, password, sendOutputs, from = undefined, changeAddr = undefined, memo = undefined) => __awaiter(this, void 0, void 0, function* () {
            let asset;
            let amnt;
            let sOutputs = [];
            sendOutputs.forEach((output) => {
                if (typeof this.parseAddress(output.to) === 'undefined') {
                    /* istanbul ignore next */
                    throw new Error("Error - AVMAPI.sendMultiple: Invalid address format");
                }
                if (typeof output.assetID !== 'string') {
                    asset = bintools.cb58Encode(output.assetID);
                }
                else {
                    asset = output.assetID;
                }
                if (typeof output.amount === 'number') {
                    amnt = new bn_js_1.default(output.amount);
                }
                else {
                    amnt = output.amount;
                }
                sOutputs.push({ to: output.to, assetID: asset, amount: amnt.toString(10) });
            });
            const params = {
                username: username,
                password: password,
                outputs: sOutputs,
            };
            from = this._cleanAddressArray(from, 'send');
            if (typeof from !== "undefined") {
                params["from"] = from;
            }
            if (typeof changeAddr !== 'undefined') {
                if (typeof this.parseAddress(changeAddr) === 'undefined') {
                    /* istanbul ignore next */
                    throw new Error("Error - AVMAPI.send: Invalid address format");
                }
                params["changeAddr"] = changeAddr;
            }
            if (typeof memo !== "undefined") {
                if (typeof memo !== 'string') {
                    params["memo"] = bintools.cb58Encode(memo);
                }
                else {
                    params["memo"] = memo;
                }
            }
            return this.callMethod('avm.sendMultiple', params).then((response) => response.data.result);
        });
        /**
         * Given a JSON representation of this Virtual Machine’s genesis state, create the byte representation of that state.
         *
         * @param genesisData The blockchain's genesis data object
         *
         * @returns Promise of a string of bytes
         */
        this.buildGenesis = (genesisData) => __awaiter(this, void 0, void 0, function* () {
            const params = {
                genesisData,
            };
            return this.callMethod('avm.buildGenesis', params).then((response) => {
                const r = response.data.result.bytes;
                return r;
            });
        });
        this.blockchainID = blockchainID;
        const netid = core.getNetworkID();
        if (netid in constants_2.Defaults.network && blockchainID in constants_2.Defaults.network[netid]) {
            const { alias } = constants_2.Defaults.network[netid][blockchainID];
            this.keychain = new keychain_1.KeyChain(this.core.getHRP(), alias);
        }
        else {
            this.keychain = new keychain_1.KeyChain(this.core.getHRP(), blockchainID);
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
                        throw new Error("Error - AVMAPI.${caller}: Invalid address format");
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
exports.AVMAPI = AVMAPI;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBpLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vc3JjL2FwaXMvYXZtL2FwaS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7QUFBQTs7O0dBR0c7QUFDSCxrREFBdUI7QUFDdkIsb0NBQWlDO0FBRWpDLG9FQUE0QztBQUM1QyxtQ0FBa0M7QUFDbEMsMkNBQTJDO0FBQzNDLHlDQUFzQztBQUN0Qyw2QkFBc0M7QUFDdEMsaURBQWtEO0FBR2xELGlFQUFzRDtBQUN0RCxrREFBK0M7QUFFL0MscURBQThGO0FBRzlGLGdEQUFtRDtBQUduRDs7R0FFRztBQUNILE1BQU0sUUFBUSxHQUFHLGtCQUFRLENBQUMsV0FBVyxFQUFFLENBQUM7QUFHeEM7Ozs7OztHQU1HO0FBQ0gsTUFBYSxNQUFPLFNBQVEsaUJBQU87SUE2NUNqQzs7Ozs7O09BTUc7SUFDSCxZQUFZLElBQWtCLEVBQUUsVUFBaUIsV0FBVyxFQUFFLGVBQXNCLEVBQUU7UUFDcEYsS0FBSyxDQUFDLElBQUksRUFBRSxPQUFPLENBQUMsQ0FBQztRQXA2Q3ZCOztXQUVHO1FBQ08sYUFBUSxHQUFZLElBQUksbUJBQVEsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUM7UUFFekMsaUJBQVksR0FBVSxFQUFFLENBQUM7UUFFekIsb0JBQWUsR0FBVSxTQUFTLENBQUM7UUFFbkMsZ0JBQVcsR0FBVSxTQUFTLENBQUM7UUFFL0IsVUFBSyxHQUFNLFNBQVMsQ0FBQztRQUVyQixrQkFBYSxHQUFNLFNBQVMsQ0FBQztRQUd2Qzs7OztXQUlHO1FBQ0gsdUJBQWtCLEdBQUcsR0FBVSxFQUFFO1lBQy9CLElBQUcsT0FBTyxJQUFJLENBQUMsZUFBZSxLQUFLLFdBQVcsRUFBQztnQkFDN0MsTUFBTSxLQUFLLEdBQVUsSUFBSSxDQUFDLElBQUksQ0FBQyxZQUFZLEVBQUUsQ0FBQztnQkFDOUMsSUFBSSxLQUFLLElBQUksb0JBQVEsQ0FBQyxPQUFPLElBQUksSUFBSSxD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QVUsSUFBSSxDQUFDLGtCQUFrQixFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxrQkFBa0IsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsZUFBZSxFQUFFLENBQUM7UUFDdEcsSUFBSSxTQUFTLElBQUksU0FBUyxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUU7WUFDckMsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLFNBQVMsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUU7Z0JBQ3pDLElBQUksT0FBTyxTQUFTLENBQUMsQ0FBQyxDQUFDLEtBQUssUUFBUSxFQUFFO29CQUNwQyxJQUFJLE9BQU8sSUFBSSxDQUFDLFlBQVksQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFXLENBQUMsS0FBSyxXQUFXLEVBQUU7d0JBQ3BFLDBCQUEwQjt3QkFDMUIsTUFBTSxJQUFJLEtBQUssQ0FBQyxrREFBa0QsQ0FBQyxDQUFDO3FCQUNyRTtvQkFDRCxLQUFLLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQVcsQ0FBQyxDQUFDO2lCQUNwQztxQkFBTTtvQkFDTCxLQUFLLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxlQUFlLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsRUFBRSxPQUFPLEVBQUUsU0FBUyxDQUFDLENBQUMsQ0FBVyxDQUFDLENBQUMsQ0FBQztpQkFDM0Y7YUFDRjtTQUNGO1FBQ0QsT0FBTyxLQUFLLENBQUM7SUFDZixDQUFDO0NBb0JGO0FBLzZDRCx3QkErNkNDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAcGFja2FnZURvY3VtZW50YXRpb25cbiAqIEBtb2R1bGUgQVBJLUFWTVxuICovXG5pbXBvcnQgQk4gZnJvbSAnYm4uanMnO1xuaW1wb3J0IHsgQnVmZmVyIH0gZnJvbSAnYnVmZmVyLyc7XG5pbXBvcnQgQXZhbGFuY2hlQ29yZSBmcm9tICcuLi8uLi9hdmFsYW5jaGUnO1xuaW1wb3J0IEJpblRvb2xzIGZyb20gJy4uLy4uL3V0aWxzL2JpbnRvb2xzJztcbmltcG9ydCB7IFVUWE9TZXQgfSBmcm9tICcuL3V0eG9zJztcbmltcG9ydCB7IEFWTUNvbnN0YW50cyB9IGZyb20gJy4vY29uc3RhbnRzJztcbmltcG9ydCB7IEtleUNoYWluIH0gZnJvbSAnLi9rZXljaGFpbic7XG5pbXBvcnQgeyBUeCwgVW5zaWduZWRUeCB9IGZyb20gJy4vdHgnO1xuaW1wb3J0IHsgUGF5bG9hZEJhc2UgfSBmcm9tICcuLi8uLi91dGlscy9wYXlsb2FkJztcbmltcG9ydCB7IFNFQ1BNaW50T3V0cHV0IH0gZnJvbSAnLi9vdXRwdXRzJztcbmltcG9ydCB7IEluaXRpYWxTdGF0ZXMgfSBmcm9tICcuL2luaXRpYWxzdGF0ZXMnO1xuaW1wb3J0IHsgVW5peE5vdyB9IGZyb20gJy4uLy4uL3V0aWxzL2hlbHBlcmZ1bmN0aW9ucyc7XG5pbXBvcnQgeyBKUlBDQVBJIH0gZnJvbSAnLi4vLi4vY29tbW9uL2pycGNhcGknO1xuaW1wb3J0IHsgUmVxdWVzdFJlc3BvbnNlRGF0YSB9IGZyb20gJy4uLy4uL2NvbW1vbi9hcGliYXNlJztcbmltcG9ydCB7IERlZmF1bHRzLCBQbGF0Zm9ybUNoYWluSUQsIFByaW1hcnlBc3NldEFsaWFzLCBPTkVBVkFYIH0gZnJvbSAnLi4vLi4vdXRpbHMvY29uc3RhbnRzJztcbmltcG9ydCB7IE1pbnRlclNldCB9IGZyb20gJy4vbWludGVyc2V0JztcbmltcG9ydCB7IFBlcnNpc3RhbmNlT3B0aW9ucyB9IGZyb20gJy4uLy4uL3V0aWxzL3BlcnNpc3RlbmNlb3B0aW9ucyc7XG5pbXBvcnQgeyBPdXRwdXRPd25lcnMgfSBmcm9tICcuLi8uLi9jb21tb24vb3V0cHV0JztcbmltcG9ydCB7IFNFQ1BUcmFuc2Zlck91dHB1dCB9IGZyb20gJy4vb3V0cHV0cyc7XG5cbi8qKlxuICogQGlnbm9yZVxuICovXG5jb25zdCBiaW50b29scyA9IEJpblRvb2xzLmdldEluc3RhbmNlKCk7XG5cblxuLyoqXG4gKiBDbGFzcyBmb3IgaW50ZXJhY3Rpbmcgd2l0aCBhIG5vZGUgZW5kcG9pbnQgdGhhdCBpcyB1c2luZyB0aGUgQVZNLlxuICpcbiAqIEBjYXRlZ29yeSBSUENBUElzXG4gKlxuICogQHJlbWFya3MgVGhpcyBleHRlbmRzIHRoZSBbW0pSUENBUEldXSBjbGFzcy4gVGhpcyBjbGFzcyBzaG91bGQgbm90IGJlIGRpcmVjdGx5IGNhbGxlZC4gSW5zdGVhZCwgdXNlIHRoZSBbW0F2YWxhbmNoZS5hZGRBUEldXSBmdW5jdGlvbiB0byByZWdpc3RlciB0aGlzIGludGVyZmFjZSB3aXRoIEF2YWxhbmNoZS5cbiAqL1xuZXhwb3J0IGNsYXNzIEFWTUFQSSBleHRlbmRzIEpSUENBUEkge1xuICAvKipcbiAgICogQGlnbm9yZVxuICAgKi9cbiAgcHJvdGVjdGVkIGtleWNoYWluOktleUNoYWluID0gbmV3IEtleUNoYWluKCcnLCAnJyk7XG5cbiAgcHJvdGVjdGVkIGJsb2NrY2hhaW5JRDpzdHJpbmcgPSAnJztcblxuICBwcm90ZWN0ZWQgYmxvY2tjaGFpbkFsaWFzOnN0cmluZyA9IHVuZGVmaW5lZDtcblxuICBwcm90ZWN0ZWQgQVZBWEFzc2V0SUQ6QnVmZmVyID0gdW5kZWZpbmVkO1xuXG4gIHByb3RlY3RlZCB0eEZlZTpCTiA9IHVuZGVmaW5lZDtcblxuICBwcm90ZWN0ZWQgY3JlYXRpb25UeEZlZTpCTiA9IHVuZGVmaW5lZDtcblxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBhbGlhcyBmb3IgdGhlIGJsb2NrY2hhaW5JRCBpZiBpdCBleGlzdHMsIG90aGVyd2lzZSByZXR1cm5zIGB1bmRlZmluZWRgLlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgYWxpYXMgZm9yIHRoZSBibG9ja2NoYWluSURcbiAgICovXG4gIGdldEJsb2NrY2hhaW5BbGlhcyA9ICgpOnN0cmluZyA9PiB7XG4gICAgaWYodHlwZW9mIHRoaXMuYmxvY2tjaGFpbkFsaWFzID09PSBcInVuZGVmaW5lZFwiKXtcbiAgICAgIGNvbnN0IG5ldGlkOm51bWJlciA9IHRoaXMuY29yZS5nZXROZXR3b3JrSUQoKTtcbiAgICAgIGlmIChuZXRpZCBpbiBEZWZhdWx0cy5uZXR3b3JrICYmIHRoaXMuYmxvY2tjaGFpbklEIGluIERlZmF1bHRzLm5ldHdvcmtbbmV0aWRdKSB7XG4gICAgICAgIHRoaXMuYmxvY2tjaGFpbkFsaWFzID0gRGVmYXVsdHMubmV0d29ya1tuZXRpZF1bdGhpcy5ibG9ja2NoYWluSURdLmFsaWFzO1xuICAgICAgICByZXR1cm4gdGhpcy5ibG9ja2NoYWluQWxpYXM7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xuICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgfVxuICAgIH0gXG4gICAgcmV0dXJuIHRoaXMuYmxvY2tjaGFpbkFsaWFzO1xuICB9O1xuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSBhbGlhcyBmb3IgdGhlIGJsb2NrY2hhaW5JRC5cbiAgICogXG4gICAqIEBwYXJhbSBhbGlhcyBUaGUgYWxpYXMgZm9yIHRoZSBibG9ja2NoYWluSUQuXG4gICAqIFxuICAgKi9cbiAgc2V0QmxvY2tjaGFpbkFsaWFzID0gKGFsaWFzOnN0cmluZyk6c3RyaW5nID0+IHtcbiAgICB0aGlzLmJsb2NrY2hhaW5BbGlhcyA9IGFsaWFzO1xuICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgfTtcblxuICAvKipcbiAgICogR2V0cyB0aGUgYmxvY2tjaGFpbklEIGFuZCByZXR1cm5zIGl0LlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgYmxvY2tjaGFpbklEXG4gICAqL1xuICBnZXRCbG9ja2NoYWluSUQgPSAoKTpzdHJpbmcgPT4gdGhpcy5ibG9ja2NoYWluSUQ7XG5cbiAgLyoqXG4gICAqIFJlZnJlc2ggYmxvY2tjaGFpbklELCBhbmQgaWYgYSBibG9ja2NoYWluSUQgaXMgcGFzc2VkIGluLCB1c2UgdGhhdC5cbiAgICpcbiAgICogQHBhcmFtIE9wdGlvbmFsLiBCbG9ja2NoYWluSUQgdG8gYXNzaWduLCBpZiBub25lLCB1c2VzIHRoZSBkZWZhdWx0IGJhc2VkIG9uIG5ldHdvcmtJRC5cbiAgICpcbiAgICogQHJldHVybnMgVGhlIGJsb2NrY2hhaW5JRFxuICAgKi9cbiAgcmVmcmVzaEJsb2NrY2hhaW5JRCA9IChibG9ja2NoYWluSUQ6c3RyaW5nID0gdW5kZWZpbmVkKTpib29sZWFuID0+IHtcbiAgICBjb25zdCBuZXRpZDpudW1iZXIgPSB0aGlzLmNvcmUuZ2V0TmV0d29ya0lEKCk7XG4gICAgaWYgKHR5cGVvZiBibG9ja2NoYWluSUQgPT09ICd1bmRlZmluZWQnICYmIHR5cGVvZiBEZWZhdWx0cy5uZXR3b3JrW25ldGlkXSAhPT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgdGhpcy5ibG9ja2NoYWluSUQgPSBEZWZhdWx0cy5uZXR3b3JrW25ldGlkXS5YLmJsb2NrY2hhaW5JRDsgLy9kZWZhdWx0IHRvIFgtQ2hhaW5cbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH0gaWYgKHR5cGVvZiBibG9ja2NoYWluSUQgPT09ICdzdHJpbmcnKSB7XG4gICAgICB0aGlzLmJsb2NrY2hhaW5JRCA9IGJsb2NrY2hhaW5JRDtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG4gIH07XG5cbiAgLyoqXG4gICAqIFRha2VzIGFuIGFkZHJlc3Mgc3RyaW5nIGFuZCByZXR1cm5zIGl0cyB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSByZXByZXNlbnRhdGlvbiBpZiB2YWxpZC5cbiAgICpcbiAgICogQHJldHVybnMgQSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSBmb3IgdGhlIGFkZHJlc3MgaWYgdmFsaWQsIHVuZGVmaW5lZCBpZiBub3QgdmFsaWQuXG4gICAqL1xuICBwYXJzZUFkZHJlc3MgPSAoYWRkcjpzdHJpbmcpOkJ1ZmZlciA9PiB7XG4gICAgY29uc3QgYWxpYXM6c3RyaW5nID0gdGhpcy5nZXRCbG9ja2NoYWluQWxpYXMoKTtcbiAgICBjb25zdCBibG9ja2NoYWluSUQ6c3RyaW5nID0gdGhpcy5nZXRCbG9ja2NoYWluSUQoKTtcbiAgICByZXR1cm4gYmludG9vbHMucGFyc2VBZGRyZXNzKGFkZHIsIGJsb2NrY2hhaW5JRCwgYWxpYXMsIEFWTUNvbnN0YW50cy5BRERSRVNTTEVOR1RIKTtcbiAgfTtcblxuICBhZGRyZXNzRnJvbUJ1ZmZlciA9IChhZGRyZXNzOkJ1ZmZlcik6c3RyaW5nID0+IHtcbiAgICBjb25zdCBjaGFpbmlkOnN0cmluZyA9IHRoaXMuZ2V0QmxvY2tjaGFpbkFsaWFzKCkgPyB0aGlzLmdldEJsb2NrY2hhaW5BbGlhcygpIDogdGhpcy5nZXRCbG9ja2NoYWluSUQoKTtcbiAgICByZXR1cm4gYmludG9vbHMuYWRkcmVzc1RvU3RyaW5nKHRoaXMuY29yZS5nZXRIUlAoKSwgY2hhaW5pZCwgYWRkcmVzcyk7XG4gIH07XG5cbiAgLyoqXG4gICAqIEZldGNoZXMgdGhlIEFWQVggQXNzZXRJRCBhbmQgcmV0dXJucyBpdCBpbiBhIFByb21pc2UuXG4gICAqXG4gICAqIEBwYXJhbSByZWZyZXNoIFRoaXMgZnVuY3Rpb24gY2FjaGVzIHRoZSByZXNwb25zZS4gUmVmcmVzaCA9IHRydWUgd2lsbCBidXN0IHRoZSBjYWNoZS5cbiAgICogXG4gICAqIEByZXR1cm5zIFRoZSB0aGUgcHJvdmlkZWQgc3RyaW5nIHJlcHJlc2VudGluZyB0aGUgQVZBWCBBc3NldElEXG4gICAqL1xuICBnZXRBVkFYQXNzZXRJRCA9IGFzeW5jIChyZWZyZXNoOmJvb2xlYW4gPSBmYWxzZSk6UHJvbWlzZTxCdWZmZXI+ID0+IHtcbiAgICBpZiAodHlwZW9mIHRoaXMuQVZBWEFzc2V0SUQgPT09ICd1bmRlZmluZWQnIHx8IHJlZnJlc2gpIHtcbiAgICAgIGNvbnN0IGFzc2V0OntcbiAgICAgICAgbmFtZTogc3RyaW5nO1xuICAgICAgICBzeW1ib2w6IHN0cmluZztcbiAgICAgICAgYXNzZXRJRDogQnVmZmVyO1xuICAgICAgICBkZW5vbWluYXRpb246IG51bWJlcjtcbiAgICAgIH0gPSBhd2FpdCB0aGlzLmdldEFzc2V0RGVzY3JpcHRpb24oUHJpbWFyeUFzc2V0QWxpYXMpO1xuICAgICAgdGhpcy5BVkFYQXNzZXRJRCA9IGFzc2V0LmFzc2V0SUQ7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLkFWQVhBc3NldElEO1xuICB9O1xuICBcbiAgLyoqXG4gICAqIE92ZXJyaWRlcyB0aGUgZGVmYXVsdHMgYW5kIHNldHMgdGhlIGNhY2hlIHRvIGEgc3BlY2lmaWMgQVZBWCBBc3NldElEXG4gICAqIFxuICAgKiBAcGFyYW0gYXZheEFzc2V0SUQgQSBjYjU4IHN0cmluZyBvciBCdWZmZXIgcmVwcmVzZW50aW5nIHRoZSBBVkFYIEFzc2V0SURcbiAgICogXG4gICAqIEByZXR1cm5zIFRoZSB0aGUgcHJvdmlkZWQgc3RyaW5nIHJlcHJlc2VudGluZyB0aGUgQVZBWCBBc3NldElEXG4gICAqL1xuICBzZXRBVkFYQXNzZXRJRCA9IChhdmF4QXNzZXRJRDpzdHJpbmcgfCBCdWZmZXIpID0+IHtcbiAgICBpZih0eXBlb2YgYXZheEFzc2V0SUQgPT09IFwic3RyaW5nXCIpIHtcbiAgICAgIGF2YXhBc3NldElEID0gYmludG9vbHMuY2I1OERlY29kZShhdmF4QXNzZXRJRCk7XG4gICAgfVxuICAgIHRoaXMuQVZBWEFzc2V0SUQgPSBhdmF4QXNzZXRJRDtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBkZWZhdWx0IHR4IGZlZSBmb3IgdGhpcyBjaGFpbi5cbiAgICpcbiAgICogQHJldHVybnMgVGhlIGRlZmF1bHQgdHggZmVlIGFzIGEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9pbmR1dG55L2JuLmpzL3xCTn1cbiAgICovXG4gIGdldERlZmF1bHRUeEZlZSA9ICAoKTpCTiA9PiB7XG4gICAgcmV0dXJuIHRoaXMuY29yZS5nZXROZXR3b3JrSUQoKSBpbiBEZWZhdWx0cy5uZXR3b3JrID8gbmV3IEJOKERlZmF1bHRzLm5ldHdvcmtbdGhpcy5jb3JlLmdldE5ldHdvcmtJRCgpXVtcIlhcIl1bXCJ0eEZlZVwiXSkgOiBuZXcgQk4oMCk7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgdHggZmVlIGZvciB0aGlzIGNoYWluLlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgdHggZmVlIGFzIGEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9pbmR1dG55L2JuLmpzL3xCTn1cbiAgICovXG4gIGdldFR4RmVlID0gKCk6Qk4gPT4ge1xuICAgIGlmKHR5cGVvZiB0aGlzLnR4RmVlID09PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICB0aGlzLnR4RmVlID0gdGhpcy5nZXREZWZhdWx0VHhGZWUoKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMudHhGZWU7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgdHggZmVlIGZvciB0aGlzIGNoYWluLlxuICAgKlxuICAgKiBAcGFyYW0gZmVlIFRoZSB0eCBmZWUgYW1vdW50IHRvIHNldCBhcyB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2luZHV0bnkvYm4uanMvfEJOfVxuICAgKi9cbiAgc2V0VHhGZWUgPSAoZmVlOkJOKSA9PiB7XG4gICAgdGhpcy50eEZlZSA9IGZlZTtcbiAgfVxuXG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIGRlZmF1bHQgY3JlYXRpb24gZmVlIGZvciB0aGlzIGNoYWluLlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgZGVmYXVsdCBjcmVhdGlvbiBmZWUgYXMgYSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2luZHV0bnkvYm4uanMvfEJOfVxuICAgKi9cbiAgZ2V0RGVmYXVsdENyZWF0aW9uVHhGZWUgPSAgKCk6Qk4gPT4ge1xuICAgIHJldHVybiB0aGlzLmNvcmUuZ2V0TmV0d29ya0lEKCkgaW4gRGVmYXVsdHMubmV0d29yayA/IG5ldyBCTihEZWZhdWx0cy5uZXR3b3JrW3RoaXMuY29yZS5nZXROZXR3b3JrSUQoKV1bXCJYXCJdW1wiY3JlYXRpb25UeEZlZVwiXSkgOiBuZXcgQk4oMCk7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgY3JlYXRpb24gZmVlIGZvciB0aGlzIGNoYWluLlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgY3JlYXRpb24gZmVlIGFzIGEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9pbmR1dG55L2JuLmpzL3xCTn1cbiAgICovXG4gIGdldENyZWF0aW9uVHhGZWUgPSAoKTpCTiA9PiB7XG4gICAgaWYodHlwZW9mIHRoaXMuY3JlYXRpb25UeEZlZSA9PT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgdGhpcy5jcmVhdGlvblR4RmVlID0gdGhpcy5nZXREZWZhdWx0Q3JlYXRpb25UeEZlZSgpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5jcmVhdGlvblR4RmVlO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIGNyZWF0aW9uIGZlZSBmb3IgdGhpcyBjaGFpbi5cbiAgICpcbiAgICogQHBhcmFtIGZlZSBUaGUgY3JlYXRpb24gZmVlIGFtb3VudCB0byBzZXQgYXMge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9pbmR1dG55L2JuLmpzL3xCTn1cbiAgICovXG4gIHNldENyZWF0aW9uVHhGZWUgPSAoZmVlOkJOKSA9PiB7XG4gICAgdGhpcy5jcmVhdGlvblR4RmVlID0gZmVlO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgYSByZWZlcmVuY2UgdG8gdGhlIGtleWNoYWluIGZvciB0aGlzIGNsYXNzLlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgaW5zdGFuY2Ugb2YgW1tLZXlDaGFpbl1dIGZvciB0aGlzIGNsYXNzXG4gICAqL1xuICBrZXlDaGFpbiA9ICgpOktleUNoYWluID0+IHRoaXMua2V5Y2hhaW47XG5cbiAgLyoqXG4gICAqIEBpZ25vcmVcbiAgICovXG4gIG5ld0tleUNoYWluID0gKCk6S2V5Q2hhaW4gPT4ge1xuICAgIC8vIHdhcm5pbmcsIG92ZXJ3cml0ZXMgdGhlIG9sZCBrZXljaGFpblxuICAgIGNvbnN0IGFsaWFzID0gdGhpcy5nZXRCbG9ja2NoYWluQWxpYXMoKTtcbiAgICBpZiAoYWxpYXMpIHtcbiAgICAgIHRoaXMua2V5Y2hhaW4gPSBuZXcgS2V5Q2hhaW4odGhpcy5jb3JlLmdldEhSUCgpLCBhbGlhcyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMua2V5Y2hhaW4gPSBuZXcgS2V5Q2hhaW4odGhpcy5jb3JlLmdldEhSUCgpLCB0aGlzLmJsb2NrY2hhaW5JRCk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLmtleWNoYWluO1xuICB9O1xuXG4gIC8qKlxuICAgKiBIZWxwZXIgZnVuY3Rpb24gd2hpY2ggZGV0ZXJtaW5lcyBpZiBhIHR4IGlzIGEgZ29vc2UgZWdnIHRyYW5zYWN0aW9uLiBcbiAgICpcbiAgICogQHBhcmFtIHV0eCBBbiBVbnNpZ25lZFR4XG4gICAqXG4gICAqIEByZXR1cm5zIGJvb2xlYW4gdHJ1ZSBpZiBwYXNzZXMgZ29vc2UgZWdnIHRlc3QgYW5kIGZhbHNlIGlmIGZhaWxzLlxuICAgKlxuICAgKiBAcmVtYXJrc1xuICAgKiBBIFwiR29vc2UgRWdnIFRyYW5zYWN0aW9uXCIgaXMgd2hlbiB0aGUgZmVlIGZhciBleGNlZWRzIGEgcmVhc29uYWJsZSBhbW91bnRcbiAgICovXG4gIGNoZWNrR29vc2VFZ2cgPSBhc3luYyAodXR4OlVuc2lnbmVkVHgsIG91dFRvdGFsOkJOID0gbmV3IEJOKDApKTogUHJvbWlzZTxib29sZWFuPiA9PiB7XG4gICAgY29uc3QgYXZheEFzc2V0SUQ6QnVmZmVyID0gYXdhaXQgdGhpcy5nZXRBVkFYQXNzZXRJRCgpO1xuICAgIGxldCBvdXRwdXRUb3RhbDpCTiA9IG91dFRvdGFsLmd0KG5ldyBCTigwKSkgPyBvdXRUb3RhbCA6IHV0eC5nZXRPdXRwdXRUb3RhbChhdmF4QXNzZXRJRCk7XG4gICAgY29uc3QgZmVlOkJOID0gdXR4LmdldEJ1cm4oYXZheEFzc2V0SUQpO1xuICAgIGlmKGZlZS5sdGUoT05FQVZBWC5tdWwobmV3IEJOKDEwKSkpIHx8IGZlZS5sdGUob3V0cHV0VG90YWwpKSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgICAqIEdldHMgdGhlIGJhbGFuY2Ugb2YgYSBwYXJ0aWN1bGFyIGFzc2V0IG9uIGEgYmxvY2tjaGFpbi5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBhZGRyZXNzIFRoZSBhZGRyZXNzIHRvIHB1bGwgdGhlIGFzc2V0IGJhbGFuY2UgZnJvbVxuICAgICAqIEBwYXJhbSBhc3NldElEIFRoZSBhc3NldElEIHRvIHB1bGwgdGhlIGJhbGFuY2UgZnJvbVxuICAgICAqXG4gICAgICogQHJldHVybnMgUHJvbWlzZSB3aXRoIHRoZSBiYWxhbmNlIG9mIHRoZSBhc3NldElEIGFzIGEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9pbmR1dG55L2JuLmpzL3xCTn0gb24gdGhlIHByb3ZpZGVkIGFkZHJlc3MgZm9yIHRoZSBibG9ja2NoYWluLlxuICAgICAqL1xuICBnZXRCYWxhbmNlID0gYXN5bmMgKGFkZHJlc3M6c3RyaW5nLCBhc3NldElEOnN0cmluZyk6UHJvbWlzZTxvYmplY3Q+ID0+IHtcbiAgICBpZiAodHlwZW9mIHRoaXMucGFyc2VBZGRyZXNzKGFkZHJlc3MpID09PSAndW5kZWZpbmVkJykge1xuICAgICAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cbiAgICAgIHRocm93IG5ldyBFcnJvcihcIkVycm9yIC0gQVZNQVBJLmdldEJhbGFuY2U6IEludmFsaWQgYWRkcmVzcyBmb3JtYXRcIik7XG4gICAgfVxuICAgIGNvbnN0IHBhcmFtczphbnkgPSB7XG4gICAgICBhZGRyZXNzLFxuICAgICAgYXNzZXRJRCxcbiAgICB9O1xuICAgIHJldHVybiB0aGlzLmNhbGxNZXRob2QoJ2F2bS5nZXRCYWxhbmNlJywgcGFyYW1zKS50aGVuKChyZXNwb25zZTpSZXF1ZXN0UmVzcG9uc2VEYXRhKSA9PiByZXNwb25zZS5kYXRhLnJlc3VsdCk7XG4gIH07XG5cbiAgLyoqXG4gICAgICogQ3JlYXRlcyBhbiBhZGRyZXNzIChhbmQgYXNzb2NpYXRlZCBwcml2YXRlIGtleXMpIG9uIGEgdXNlciBvbiBhIGJsb2NrY2hhaW4uXG4gICAgICpcbiAgICAgKiBAcGFyYW0gdXNlcm5hbWUgTmFtZSBvZiB0aGUgdXNlciB0byBjcmVhdGUgdGhlIGFkZHJlc3MgdW5kZXJcbiAgICAgKiBAcGFyYW0gcGFzc3dvcmQgUGFzc3dvcmQgdG8gdW5sb2NrIHRoZSB1c2VyIGFuZCBlbmNyeXB0IHRoZSBwcml2YXRlIGtleVxuICAgICAqXG4gICAgICogQHJldHVybnMgUHJvbWlzZSBmb3IgYSBzdHJpbmcgcmVwcmVzZW50aW5nIHRoZSBhZGRyZXNzIGNyZWF0ZWQgYnkgdGhlIHZtLlxuICAgICAqL1xuICBjcmVhdGVBZGRyZXNzID0gYXN5bmMgKHVzZXJuYW1lOnN0cmluZywgcGFzc3dvcmQ6c3RyaW5nKTpQcm9taXNlPHN0cmluZz4gPT4ge1xuICAgIGNvbnN0IHBhcmFtczphbnkgPSB7XG4gICAgICB1c2VybmFtZSxcbiAgICAgIHBhc3N3b3JkLFxuICAgIH07XG4gICAgcmV0dXJuIHRoaXMuY2FsbE1ldGhvZCgnYXZtLmNyZWF0ZUFkZHJlc3MnLCBwYXJhbXMpLnRoZW4oKHJlc3BvbnNlOlJlcXVlc3RSZXNwb25zZURhdGEpID0+IHJlc3BvbnNlLmRhdGEucmVzdWx0LmFkZHJlc3MpO1xuICB9O1xuXG4gIC8qKlxuICAgKiBDcmVhdGUgYSBuZXcgZml4ZWQtY2FwLCBmdW5naWJsZSBhc3NldC4gQSBxdWFudGl0eSBvZiBpdCBpcyBjcmVhdGVkIGF0IGluaXRpYWxpemF0aW9uIGFuZCB0aGVyZSBubyBtb3JlIGlzIGV2ZXIgY3JlYXRlZC5cbiAgICpcbiAgICogQHBhcmFtIHVzZXJuYW1lIFRoZSB1c2VyIHBheWluZyB0aGUgdHJhbnNhY3Rpb24gZmVlIChpbiAkQVZBWCkgZm9yIGFzc2V0IGNyZWF0aW9uXG4gICAqIEBwYXJhbSBwYXNzd29yZCBUaGUgcGFzc3dvcmQgZm9yIHRoZSB1c2VyIHBheWluZyB0aGUgdHJhbnNhY3Rpb24gZmVlIChpbiAkQVZBWCkgZm9yIGFzc2V0IGNyZWF0aW9uXG4gICAqIEBwYXJhbSBuYW1lIFRoZSBodW1hbi1yZWFkYWJsZSBuYW1lIGZvciB0aGUgYXNzZXRcbiAgICogQHBhcmFtIHN5bWJvbCBPcHRpb25hbC4gVGhlIHNob3J0aGFuZCBzeW1ib2wgZm9yIHRoZSBhc3NldC4gQmV0d2VlbiAwIGFuZCA0IGNoYXJhY3RlcnNcbiAgICogQHBhcmFtIGRlbm9taW5hdGlvbiBPcHRpb25hbC4gRGV0ZXJtaW5lcyBob3cgYmFsYW5jZXMgb2YgdGhpcyBhc3NldCBhcmUgZGlzcGxheWVkIGJ5IHVzZXIgaW50ZXJmYWNlcy4gRGVmYXVsdCBpcyAwXG4gICAqIEBwYXJhbSBpbml0aWFsSG9sZGVycyBBbiBhcnJheSBvZiBvYmplY3RzIGNvbnRhaW5pbmcgdGhlIGZpZWxkIFwiYWRkcmVzc1wiIGFuZCBcImFtb3VudFwiIHRvIGVzdGFibGlzaCB0aGUgZ2VuZXNpcyB2YWx1ZXMgZm9yIHRoZSBuZXcgYXNzZXRcbiAgICpcbiAgICogYGBganNcbiAgICogRXhhbXBsZSBpbml0aWFsSG9sZGVyczpcbiAgICogW1xuICAgKiAgICAge1xuICAgKiAgICAgICAgIFwiYWRkcmVzc1wiOiBcIlgtYXZheDFrajA2bGhneDg0aDM5c25zbGpjZXkzdHBjMDQ2emU2OG1lazNnNVwiLFxuICAgKiAgICAgICAgIFwiYW1vdW50XCI6IDEwMDAwXG4gICAqICAgICB9LFxuICAgKiAgICAge1xuICAgKiAgICAgICAgIFwiYWRkcmVzc1wiOiBcIlgtYXZheDFhbTR3NmhmcnZtaDNha2R1emtqdGhydGd0cWFmYWxjZTZhbjhjclwiLFxuICAgKiAgICAgICAgIFwiYW1vdW50XCI6IDUwMDAwXG4gICAqICAgICB9XG4gICAqIF1cbiAgICogYGBgXG4gICAqXG4gICAqIEByZXR1cm5zIFJldHVybnMgYSBQcm9taXNlPHN0cmluZz4gY29udGFpbmluZyB0aGUgYmFzZSA1OCBzdHJpbmcgcmVwcmVzZW50YXRpb24gb2YgdGhlIElEIG9mIHRoZSBuZXdseSBjcmVhdGVkIGFzc2V0LlxuICAgKi9cbiAgY3JlYXRlRml4ZWRDYXBBc3NldCA9IGFzeW5jICh1c2VybmFtZTpzdHJpbmcsIHBhc3N3b3JkOnN0cmluZywgbmFtZTpzdHJpbmcsIHN5bWJvbDpzdHJpbmcsIGRlbm9taW5hdGlvbjpudW1iZXIsIGluaXRpYWxIb2xkZXJzOkFycmF5PG9iamVjdD4pOlByb21pc2U8c3RyaW5nPiA9PiB7XG4gICAgY29uc3QgcGFyYW1zOmFueSA9IHtcbiAgICAgIG5hbWUsXG4gICAgICBzeW1ib2wsXG4gICAgICBkZW5vbWluYXRpb24sXG4gICAgICB1c2VybmFtZSxcbiAgICAgIHBhc3N3b3JkLFxuICAgICAgaW5pdGlhbEhvbGRlcnMsXG4gICAgfTtcbiAgICByZXR1cm4gdGhpcy5jYWxsTWV0aG9kKCdhdm0uY3JlYXRlRml4ZWRDYXBBc3NldCcsIHBhcmFtcykudGhlbigocmVzcG9uc2U6UmVxdWVzdFJlc3BvbnNlRGF0YSkgPT4gcmVzcG9uc2UuZGF0YS5yZXN1bHQuYXNzZXRJRCk7XG4gIH07XG5cbiAgLyoqXG4gICAgICogQ3JlYXRlIGEgbmV3IHZhcmlhYmxlLWNhcCwgZnVuZ2libGUgYXNzZXQuIE5vIHVuaXRzIG9mIHRoZSBhc3NldCBleGlzdCBhdCBpbml0aWFsaXphdGlvbi4gTWludGVycyBjYW4gbWludCB1bml0cyBvZiB0aGlzIGFzc2V0IHVzaW5nIGNyZWF0ZU1pbnRUeCwgc2lnbk1pbnRUeCBhbmQgc2VuZE1pbnRUeC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB1c2VybmFtZSBUaGUgdXNlciBwYXlpbmcgdGhlIHRyYW5zYWN0aW9uIGZlZSAoaW4gJEFWQVgpIGZvciBhc3NldCBjcmVhdGlvblxuICAgICAqIEBwYXJhbSBwYXNzd29yZCBUaGUgcGFzc3dvcmQgZm9yIHRoZSB1c2VyIHBheWluZyB0aGUgdHJhbnNhY3Rpb24gZmVlIChpbiAkQVZBWCkgZm9yIGFzc2V0IGNyZWF0aW9uXG4gICAgICogQHBhcmFtIG5hbWUgVGhlIGh1bWFuLXJlYWRhYmxlIG5hbWUgZm9yIHRoZSBhc3NldFxuICAgICAqIEBwYXJhbSBzeW1ib2wgT3B0aW9uYWwuIFRoZSBzaG9ydGhhbmQgc3ltYm9sIGZvciB0aGUgYXNzZXQgLS0gYmV0d2VlbiAwIGFuZCA0IGNoYXJhY3RlcnNcbiAgICAgKiBAcGFyYW0gZGVub21pbmF0aW9uIE9wdGlvbmFsLiBEZXRlcm1pbmVzIGhvdyBiYWxhbmNlcyBvZiB0aGlzIGFzc2V0IGFyZSBkaXNwbGF5ZWQgYnkgdXNlciBpbnRlcmZhY2VzLiBEZWZhdWx0IGlzIDBcbiAgICAgKiBAcGFyYW0gbWludGVyU2V0cyBpcyBhIGxpc3Qgd2hlcmUgZWFjaCBlbGVtZW50IHNwZWNpZmllcyB0aGF0IHRocmVzaG9sZCBvZiB0aGUgYWRkcmVzc2VzIGluIG1pbnRlcnMgbWF5IHRvZ2V0aGVyIG1pbnQgbW9yZSBvZiB0aGUgYXNzZXQgYnkgc2lnbmluZyBhIG1pbnRpbmcgdHJhbnNhY3Rpb25cbiAgICAgKiBcbiAgICAgKiBgYGBqc1xuICAgICAqIEV4YW1wbGUgbWludGVyU2V0czpcbiAgICAgKiBbXG4gICAgICogICAgICB7XG4gICAgICogICAgICAgICAgXCJtaW50ZXJzXCI6W1xuICAgICAqICAgICAgICAgICAgICBcIlgtYXZheDFhbTR3NmhmcnZtaDNha2R1emtqdGhydGd0cWFmYWxjZTZhbjhjclwiXG4gICAgICogICAgICAgICAgXSxcbiAgICAgKiAgICAgICAgICBcInRocmVzaG9sZFwiOiAxXG4gICAgICogICAgICB9LFxuICAgICAqICAgICAge1xuICAgICAqICAgICAgICAgIFwibWludGVyc1wiOiBbXG4gICAgICogICAgICAgICAgICAgIFwiWC1hdmF4MWFtNHc2aGZydm1oM2FrZHV6a2p0aHJ0Z3RxYWZhbGNlNmFuOGNyXCIsXG4gICAgICogICAgICAgICAgICAgIFwiWC1hdmF4MWtqMDZsaGd4ODRoMzlzbnNsamNleTN0cGMwNDZ6ZTY4bWVrM2c1XCIsXG4gICAgICogICAgICAgICAgICAgIFwiWC1hdmF4MXllbGwzZTRubG4wbTM5Y2ZwZGhncXByc2Q4N2praDRxbmFra2x4XCJcbiAgICAgKiAgICAgICAgICBdLFxuICAgICAqICAgICAgICAgIFwidGhyZXNob2xkXCI6IDJcbiAgICAgKiAgICAgIH1cbiAgICAgKiBdXG4gICAgICogYGBgXG4gICAgICpcbiAgICAgKiBAcmV0dXJucyBSZXR1cm5zIGEgUHJvbWlzZTxzdHJpbmc+IGNvbnRhaW5pbmcgdGhlIGJhc2UgNTggc3RyaW5nIHJlcHJlc2VudGF0aW9uIG9mIHRoZSBJRCBvZiB0aGUgbmV3bHkgY3JlYXRlZCBhc3NldC5cbiAgICAgKi9cbiAgY3JlYXRlVmFyaWFibGVDYXBBc3NldCA9IGFzeW5jICh1c2VybmFtZTpzdHJpbmcsIHBhc3N3b3JkOnN0cmluZywgbmFtZTpzdHJpbmcsIHN5bWJvbDpzdHJpbmcsIGRlbm9taW5hdGlvbjpudW1iZXIsIG1pbnRlclNldHM6QXJyYXk8b2JqZWN0Pik6UHJvbWlzZTxzdHJpbmc+ID0+IHtcbiAgICBjb25zdCBwYXJhbXM6YW55ID0ge1xuICAgICAgbmFtZSxcbiAgICAgIHN5bWJvbCxcbiAgICAgIGRlbm9taW5hdGlvbixcbiAgICAgIHVzZXJuYW1lLFxuICAgICAgcGFzc3dvcmQsXG4gICAgICBtaW50ZXJTZXRzLFxuICAgIH07XG4gICAgcmV0dXJuIHRoaXMuY2FsbE1ldGhvZCgnYXZtLmNyZWF0ZVZhcmlhYmxlQ2FwQXNzZXQnLCBwYXJhbXMpLnRoZW4oKHJlc3BvbnNlOlJlcXVlc3RSZXNwb25zZURhdGEpID0+IHJlc3BvbnNlLmRhdGEucmVzdWx0LmFzc2V0SUQpO1xuICB9O1xuXG4gIC8qKlxuICAgICAqIENyZWF0ZSBhbiB1bnNpZ25lZCB0cmFuc2FjdGlvbiB0byBtaW50IG1vcmUgb2YgYW4gYXNzZXQuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gYW1vdW50IFRoZSB1bml0cyBvZiB0aGUgYXNzZXQgdG8gbWludFxuICAgICAqIEBwYXJhbSBhc3NldElEIFRoZSBJRCBvZiB0aGUgYXNzZXQgdG8gbWludFxuICAgICAqIEBwYXJhbSB0byBUaGUgYWRkcmVzcyB0byBhc3NpZ24gdGhlIHVuaXRzIG9mIHRoZSBtaW50ZWQgYXNzZXRcbiAgICAgKiBAcGFyYW0gbWludGVycyBBZGRyZXNzZXMgb2YgdGhlIG1pbnRlcnMgcmVzcG9uc2libGUgZm9yIHNpZ25pbmcgdGhlIHRyYW5zYWN0aW9uXG4gICAgICpcbiAgICAgKiBAcmV0dXJucyBSZXR1cm5zIGEgUHJvbWlzZTxzdHJpbmc+IGNvbnRhaW5pbmcgdGhlIGJhc2UgNTggc3RyaW5nIHJlcHJlc2VudGF0aW9uIG9mIHRoZSB1bnNpZ25lZCB0cmFuc2FjdGlvbi5cbiAgICAgKi9cbiAgbWludCA9IGFzeW5jICh1c2VybmFtZTpzdHJpbmcsIHBhc3N3b3JkOnN0cmluZywgYW1vdW50Om51bWJlciB8IEJOLCBhc3NldElEOkJ1ZmZlciB8IHN0cmluZywgdG86c3RyaW5nLCBtaW50ZXJzOkFycmF5PHN0cmluZz4pOlByb21pc2U8c3RyaW5nPiA9PiB7XG4gICAgbGV0IGFzc2V0OnN0cmluZztcbiAgICBsZXQgYW1udDpCTjtcbiAgICBpZiAodHlwZW9mIGFzc2V0SUQgIT09ICdzdHJpbmcnKSB7XG4gICAgICBhc3NldCA9IGJpbnRvb2xzLmNiNThFbmNvZGUoYXNzZXRJRCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGFzc2V0ID0gYXNzZXRJRDtcbiAgICB9XG4gICAgaWYgKHR5cGVvZiBhbW91bnQgPT09ICdudW1iZXInKSB7XG4gICAgICBhbW50ID0gbmV3IEJOKGFtb3VudCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGFtbnQgPSBhbW91bnQ7XG4gICAgfVxuICAgIGNvbnN0IHBhcmFtczphbnkgPSB7XG4gICAgICB1c2VybmFtZTogdXNlcm5hbWUsXG4gICAgICBwYXNzd29yZDogcGFzc3dvcmQsXG4gICAgICBhbW91bnQ6IGFtbnQudG9TdHJpbmcoMTApLFxuICAgICAgYXNzZXRJRDogYXNzZXQsXG4gICAgICB0byxcbiAgICAgIG1pbnRlcnNcbiAgICB9O1xuICAgIHJldHVybiB0aGlzLmNhbGxNZXRob2QoJ2F2bS5taW50JywgcGFyYW1zKS50aGVuKChyZXNwb25zZTpSZXF1ZXN0UmVzcG9uc2VEYXRhKSA9PiByZXNwb25zZS5kYXRhLnJlc3VsdC50eElEKTtcbiAgfTtcblxuICAvKipcbiAgICAgKiBFeHBvcnRzIHRoZSBwcml2YXRlIGtleSBmb3IgYW4gYWRkcmVzcy5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB1c2VybmFtZSBUaGUgbmFtZSBvZiB0aGUgdXNlciB3aXRoIHRoZSBwcml2YXRlIGtleVxuICAgICAqIEBwYXJhbSBwYXNzd29yZCBUaGUgcGFzc3dvcmQgdXNlZCB0byBkZWNyeXB0IHRoZSBwcml2YXRlIGtleVxuICAgICAqIEBwYXJhbSBhZGRyZXNzIFRoZSBhZGRyZXNzIHdob3NlIHByaXZhdGUga2V5IHNob3VsZCBiZSBleHBvcnRlZFxuICAgICAqXG4gICAgICogQHJldHVybnMgUHJvbWlzZSB3aXRoIHRoZSBkZWNyeXB0ZWQgcHJpdmF0ZSBrZXkgYXMgc3RvcmUgaW4gdGhlIGRhdGFiYXNlXG4gICAgICovXG4gIGV4cG9ydEtleSA9IGFzeW5jICh1c2VybmFtZTpzdHJpbmcsIHBhc3N3b3JkOnN0cmluZywgYWRkcmVzczpzdHJpbmcpOlByb21pc2U8c3RyaW5nPiA9PiB7XG4gICAgaWYgKHR5cGVvZiB0aGlzLnBhcnNlQWRkcmVzcyhhZGRyZXNzKSA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJFcnJvciAtIEFWTUFQSS5leHBvcnRLZXk6IEludmFsaWQgYWRkcmVzcyBmb3JtYXRcIik7XG4gICAgfVxuICAgIGNvbnN0IHBhcmFtczphbnkgPSB7XG4gICAgICB1c2VybmFtZSxcbiAgICAgIHBhc3N3b3JkLFxuICAgICAgYWRkcmVzcyxcbiAgICB9O1xuICAgIHJldHVybiB0aGlzLmNhbGxNZXRob2QoJ2F2bS5leHBvcnRLZXknLCBwYXJhbXMpLnRoZW4oKHJlc3BvbnNlOlJlcXVlc3RSZXNwb25zZURhdGEpID0+IHJlc3BvbnNlLmRhdGEucmVzdWx0LnByaXZhdGVLZXkpO1xuICB9O1xuXG4gIC8qKlxuICAgICAqIEltcG9ydHMgYSBwcml2YXRlIGtleSBpbnRvIHRoZSBub2RlJ3Mga2V5c3RvcmUgdW5kZXIgYW4gdXNlciBhbmQgZm9yIGEgYmxvY2tjaGFpbi5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB1c2VybmFtZSBUaGUgbmFtZSBvZiB0aGUgdXNlciB0byBzdG9yZSB0aGUgcHJpdmF0ZSBrZXlcbiAgICAgKiBAcGFyYW0gcGFzc3dvcmQgVGhlIHBhc3N3b3JkIHRoYXQgdW5sb2NrcyB0aGUgdXNlclxuICAgICAqIEBwYXJhbSBwcml2YXRlS2V5IEEgc3RyaW5nIHJlcHJlc2VudGluZyB0aGUgcHJpdmF0ZSBrZXkgaW4gdGhlIHZtJ3MgZm9ybWF0XG4gICAgICpcbiAgICAgKiBAcmV0dXJucyBUaGUgYWRkcmVzcyBmb3IgdGhlIGltcG9ydGVkIHByaXZhdGUga2V5LlxuICAgICAqL1xuICBpbXBvcnRLZXkgPSBhc3luYyAodXNlcm5hbWU6c3RyaW5nLCBwYXNzd29yZDpzdHJpbmcsIHByaXZhdGVLZXk6c3RyaW5nKTpQcm9taXNlPHN0cmluZz4gPT4ge1xuICAgIGNvbnN0IHBhcmFtczphbnkgPSB7XG4gICAgICB1c2VybmFtZSxcbiAgICAgIHBhc3N3b3JkLFxuICAgICAgcHJpdmF0ZUtleSxcbiAgICB9O1xuICAgIHJldHVybiB0aGlzLmNhbGxNZXRob2QoJ2F2bS5pbXBvcnRLZXknLCBwYXJhbXMpLnRoZW4oKHJlc3BvbnNlOlJlcXVlc3RSZXNwb25zZURhdGEpID0+IHJlc3BvbnNlLmRhdGEucmVzdWx0LmFkZHJlc3MpO1xuICB9O1xuXG4gIC8qKlxuICAgICogU2VuZCBBTlQgKEF2YWxhbmNoZSBOYXRpdmUgVG9rZW4pIGFzc2V0cyBpbmNsdWRpbmcgQVZBWCBmcm9tIHRoZSBYLUNoYWluIHRvIGFuIGFjY291bnQgb24gdGhlIFAtQ2hhaW4gb3IgQy1DaGFpbi5cbiAgICAqXG4gICAgKiBBZnRlciBjYWxsaW5nIHRoaXMgbWV0aG9kLCB5b3UgbXVzdCBjYWxsIHRoZSBQLUNoYWluJ3MgYGltcG9ydEFWQVhgIG9yIHRoZSBDLUNoYWlu4oCZcyBgaW1wb3J0YCBtZXRob2QgdG8gY29tcGxldGUgdGhlIHRyYW5zZmVyLlxuICAgICpcbiAgICAqIEBwYXJhbSB1c2VybmFtZSBUaGUgS2V5c3RvcmUgdXNlciB0aGF0IGNvbnRyb2xzIHRoZSBQLUNoYWluIG9yIEMtQ2hhaW4gYWNjb3VudCBzcGVjaWZpZWQgaW4gYHRvYFxuICAgICogQHBhcmFtIHBhc3N3b3JkIFRoZSBwYXNzd29yZCBvZiB0aGUgS2V5c3RvcmUgdXNlclxuICAgICogQHBhcmFtIHRvIFRoZSBhY2NvdW50IG9uIHRoZSBQLUNoYWluIG9yIEMtQ2hhaW4gdG8gc2VuZCB0aGUgYXNzZXQgdG8uIFxuICAgICogQHBhcmFtIGFtb3VudCBBbW91bnQgb2YgYXNzZXQgdG8gZXhwb3J0IGFzIGEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9pbmR1dG55L2JuLmpzL3xCTn1cbiAgICAqIEBwYXJhbSBhc3NldElEIFRoZSBhc3NldCBpZCB3aGljaCBpcyBiZWluZyBzZW50XG4gICAgKlxuICAgICogQHJldHVybnMgU3RyaW5nIHJlcHJlc2VudGluZyB0aGUgdHJhbnNhY3Rpb24gaWRcbiAgICAqL1xuICBleHBvcnQgPSBhc3luYyAodXNlcm5hbWU6IHN0cmluZywgcGFzc3dvcmQ6IHN0cmluZywgdG86IHN0cmluZywgYW1vdW50OiBCTiwgYXNzZXRJRDogc3RyaW5nKTpQcm9taXNlPHN0cmluZz4gPT4ge1xuICAgIGNvbnN0IHBhcmFtczogYW55ID0ge1xuICAgICAgdG8sXG4gICAgICBhbW91bnQ6IGFtb3VudC50b1N0cmluZygxMCksXG4gICAgICB1c2VybmFtZSxcbiAgICAgIHBhc3N3b3JkLFxuICAgICAgYXNzZXRJRFxuICAgIH07XG4gICAgcmV0dXJuIHRoaXMuY2FsbE1ldGhvZCgnYXZtLmV4cG9ydCcsIHBhcmFtcykudGhlbigocmVzcG9uc2U6IFJlcXVlc3RSZXNwb25zZURhdGEpID0+IHJlc3BvbnNlLmRhdGEucmVzdWx0LnR4SUQpO1xuICB9O1xuXG4gIC8qKlxuICAgICAqIFNlbmQgQVZBWCBmcm9tIHRoZSBYLUNoYWluIHRvIGFuIGFjY291bnQgb24gdGhlIFAtQ2hhaW4gb3IgQy1DaGFpbi5cbiAgICAgKlxuICAgICAqIEFmdGVyIGNhbGxpbmcgdGhpcyBtZXRob2QsIHlvdSBtdXN0IGNhbGwgdGhlIFAtQ2hhaW7igJlzIG9yIEMtQ2hhaW4ncyBpbXBvcnRBVkFYIG1ldGhvZCB0byBjb21wbGV0ZSB0aGUgdHJhbnNmZXIuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gdXNlcm5hbWUgVGhlIEtleXN0b3JlIHVzZXIgdGhhdCBjb250cm9scyB0aGUgUC1DaGFpbiBhY2NvdW50IHNwZWNpZmllZCBpbiBgdG9gXG4gICAgICogQHBhcmFtIHBhc3N3b3JkIFRoZSBwYXNzd29yZCBvZiB0aGUgS2V5c3RvcmUgdXNlclxuICAgICAqIEBwYXJhbSB0byBUaGUgYWNjb3VudCBvbiB0aGUgUC1DaGFpbiBvciBDLUNoYWluIHRvIHNlbmQgdGhlIEFWQVggdG8uXG4gICAgICogQHBhcmFtIGFtb3VudCBBbW91bnQgb2YgQVZBWCB0byBleHBvcnQgYXMgYSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2luZHV0bnkvYm4uanMvfEJOfVxuICAgICAqXG4gICAgICogQHJldHVybnMgU3RyaW5nIHJlcHJlc2VudGluZyB0aGUgdHJhbnNhY3Rpb24gaWRcbiAgICAgKi9cbiAgZXhwb3J0QVZBWCA9IGFzeW5jICh1c2VybmFtZTpzdHJpbmcsIHBhc3N3b3JkOnN0cmluZywgdG86c3RyaW5nLCBhbW91bnQ6Qk4pOlByb21pc2U8c3RyaW5nPiA9PiB7XG4gICAgY29uc3QgcGFyYW1zOmFueSA9IHtcbiAgICAgIHRvLFxuICAgICAgYW1vdW50OiBhbW91bnQudG9TdHJpbmcoMTApLFxuICAgICAgdXNlcm5hbWUsXG4gICAgICBwYXNzd29yZCxcbiAgICB9O1xuICAgIHJldHVybiB0aGlzLmNhbGxNZXRob2QoJ2F2bS5leHBvcnRBVkFYJywgcGFyYW1zKS50aGVuKChyZXNwb25zZTpSZXF1ZXN0UmVzcG9uc2VEYXRhKSA9PiByZXNwb25zZS5kYXRhLnJlc3VsdC50eElEKTtcbiAgfTtcblxuICAvKipcbiAgICogU2VuZCBBTlQgKEF2YWxhbmNoZSBOYXRpdmUgVG9rZW4pIGFzc2V0cyBpbmNsdWRpbmcgQVZBWCBmcm9tIGFuIGFjY291bnQgb24gdGhlIFAtQ2hhaW4gb3IgQy1DaGFpbiB0byBhbiBhZGRyZXNzIG9uIHRoZSBYLUNoYWluLiBUaGlzIHRyYW5zYWN0aW9uXG4gICAqIG11c3QgYmUgc2lnbmVkIHdpdGggdGhlIGtleSBvZiB0aGUgYWNjb3VudCB0aGF0IHRoZSBhc3NldCBpcyBzZW50IGZyb20gYW5kIHdoaWNoIHBheXNcbiAgICogdGhlIHRyYW5zYWN0aW9uIGZlZS5cbiAgICpcbiAgICogQHBhcmFtIHVzZXJuYW1lIFRoZSBLZXlzdG9yZSB1c2VyIHRoYXQgY29udHJvbHMgdGhlIGFjY291bnQgc3BlY2lmaWVkIGluIGB0b2BcbiAgICogQHBhcmFtIHBhc3N3b3JkIFRoZSBwYXNzd29yZCBvZiB0aGUgS2V5c3RvcmUgdXNlclxuICAgKiBAcGFyYW0gdG8gVGhlIGFkZHJlc3Mgb2YgdGhlIGFjY291bnQgdGhlIGFzc2V0IGlzIHNlbnQgdG8uXG4gICAqIEBwYXJhbSBzb3VyY2VDaGFpbiBUaGUgY2hhaW5JRCB3aGVyZSB0aGUgZnVuZHMgYXJlIGNvbWluZyBmcm9tLiBFeDogXCJDXCJcbiAgICpcbiAgICogQHJldHVybnMgUHJvbWlzZSBmb3IgYSBzdHJpbmcgZm9yIHRoZSB0cmFuc2FjdGlvbiwgd2hpY2ggc2hvdWxkIGJlIHNlbnQgdG8gdGhlIG5ldHdvcmtcbiAgICogYnkgY2FsbGluZyBpc3N1ZVR4LlxuICAgKi9cbiAgaW1wb3J0ID0gYXN5bmMgKHVzZXJuYW1lOiBzdHJpbmcsIHBhc3N3b3JkOnN0cmluZywgdG86c3RyaW5nLCBzb3VyY2VDaGFpbjpzdHJpbmcpXG4gIDpQcm9taXNlPHN0cmluZz4gPT4ge1xuICAgIGNvbnN0IHBhcmFtczphbnkgPSB7XG4gICAgICB0byxcbiAgICAgIHNvdXJjZUNoYWluLFxuICAgICAgdXNlcm5hbWUsXG4gICAgICBwYXNzd29yZCxcbiAgICB9O1xuICAgIHJldHVybiB0aGlzLmNhbGxNZXRob2QoJ2F2bS5pbXBvcnQnLCBwYXJhbXMpXG4gICAgICAudGhlbigocmVzcG9uc2U6UmVxdWVzdFJlc3BvbnNlRGF0YSkgPT4gcmVzcG9uc2UuZGF0YS5yZXN1bHQudHhJRCk7XG4gIH07XG5cbiAgLyoqXG4gICAgICogRmluYWxpemUgYSB0cmFuc2ZlciBvZiBBVkFYIGZyb20gdGhlIFAtQ2hhaW4gdG8gdGhlIFgtQ2hhaW4uXG4gICAgICpcbiAgICAgKiBCZWZvcmUgdGhpcyBtZXRob2QgaXMgY2FsbGVkLCB5b3UgbXVzdCBjYWxsIHRoZSBQLUNoYWlu4oCZcyBgZXhwb3J0QVZBWGAgbWV0aG9kIHRvIGluaXRpYXRlIHRoZSB0cmFuc2Zlci5cbiAgICAgKiBAcGFyYW0gdXNlcm5hbWUgVGhlIEtleXN0b3JlIHVzZXIgdGhhdCBjb250cm9scyB0aGUgYWRkcmVzcyBzcGVjaWZpZWQgaW4gYHRvYFxuICAgICAqIEBwYXJhbSBwYXNzd29yZCBUaGUgcGFzc3dvcmQgb2YgdGhlIEtleXN0b3JlIHVzZXJcbiAgICAgKiBAcGFyYW0gdG8gVGhlIGFkZHJlc3MgdGhlIEFWQVggaXMgc2VudCB0by4gVGhpcyBtdXN0IGJlIHRoZSBzYW1lIGFzIHRoZSB0byBhcmd1bWVudCBpbiB0aGUgY29ycmVzcG9uZGluZyBjYWxsIHRvIHRoZSBQLUNoYWlu4oCZcyBleHBvcnRBVkFYLCBleGNlcHQgdGhhdCB0aGUgcHJlcGVuZGVkIFgtIHNob3VsZCBiZSBpbmNsdWRlZCBpbiB0aGlzIGFyZ3VtZW50XG4gICAgICogQHBhcmFtIHNvdXJjZUNoYWluIENoYWluIHRoZSBmdW5kcyBhcmUgY29taW5nIGZyb20uXG4gICAgICpcbiAgICAgKiBAcmV0dXJucyBTdHJpbmcgcmVwcmVzZW50aW5nIHRoZSB0cmFuc2FjdGlvbiBpZFxuICAgICAqL1xuICBpbXBvcnRBVkFYID0gYXN5bmMgKHVzZXJuYW1lOnN0cmluZywgcGFzc3dvcmQ6c3RyaW5nLCB0bzpzdHJpbmcsIHNvdXJjZUNoYWluOnN0cmluZyk6UHJvbWlzZTxzdHJpbmc+ID0+IHtcbiAgICBjb25zdCBwYXJhbXM6YW55ID0ge1xuICAgICAgdG8sXG4gICAgICBzb3VyY2VDaGFpbixcbiAgICAgIHVzZXJuYW1lLFxuICAgICAgcGFzc3dvcmQsXG4gICAgfTtcbiAgICByZXR1cm4gdGhpcy5jYWxsTWV0aG9kKCdhdm0uaW1wb3J0QVZBWCcsIHBhcmFtcykudGhlbigocmVzcG9uc2U6UmVxdWVzdFJlc3BvbnNlRGF0YSkgPT4gcmVzcG9uc2UuZGF0YS5yZXN1bHQudHhJRCk7XG4gIH07XG5cbiAgLyoqXG4gICAgICogTGlzdHMgYWxsIHRoZSBhZGRyZXNzZXMgdW5kZXIgYSB1c2VyLlxuICAgICAqXG4gICAgICogQHBhcmFtIHVzZXJuYW1lIFRoZSB1c2VyIHRvIGxpc3QgYWRkcmVzc2VzXG4gICAgICogQHBhcmFtIHBhc3N3b3JkIFRoZSBwYXNzd29yZCBvZiB0aGUgdXNlciB0byBsaXN0IHRoZSBhZGRyZXNzZXNcbiAgICAgKlxuICAgICAqIEByZXR1cm5zIFByb21pc2Ugb2YgYW4gYXJyYXkgb2YgYWRkcmVzcyBzdHJpbmdzIGluIHRoZSBmb3JtYXQgc3BlY2lmaWVkIGJ5IHRoZSBibG9ja2NoYWluLlxuICAgICAqL1xuICBsaXN0QWRkcmVzc2VzID0gYXN5bmMgKHVzZXJuYW1lOnN0cmluZywgcGFzc3dvcmQ6c3RyaW5nKTogUHJvbWlzZTxBcnJheTxzdHJpbmc+PiA9PiB7XG4gICAgY29uc3QgcGFyYW1zOmFueSA9IHtcbiAgICAgIHVzZXJuYW1lLFxuICAgICAgcGFzc3dvcmQsXG4gICAgfTtcbiAgICByZXR1cm4gdGhpcy5jYWxsTWV0aG9kKCdhdm0ubGlzdEFkZHJlc3NlcycsIHBhcmFtcykudGhlbigocmVzcG9uc2U6UmVxdWVzdFJlc3BvbnNlRGF0YSkgPT4gcmVzcG9uc2UuZGF0YS5yZXN1bHQuYWRkcmVzc2VzKTtcbiAgfTtcblxuICAvKipcbiAgICAgKiBSZXRyaWV2ZXMgYWxsIGFzc2V0cyBmb3IgYW4gYWRkcmVzcyBvbiBhIHNlcnZlciBhbmQgdGhlaXIgYXNzb2NpYXRlZCBiYWxhbmNlcy5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBhZGRyZXNzIFRoZSBhZGRyZXNzIHRvIGdldCBhIGxpc3Qgb2YgYXNzZXRzXG4gICAgICpcbiAgICAgKiBAcmV0dXJucyBQcm9taXNlIG9mIGFuIG9iamVjdCBtYXBwaW5nIGFzc2V0SUQgc3RyaW5ncyB3aXRoIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vaW5kdXRueS9ibi5qcy98Qk59IGJhbGFuY2UgZm9yIHRoZSBhZGRyZXNzIG9uIHRoZSBibG9ja2NoYWluLlxuICAgICAqL1xuICBnZXRBbGxCYWxhbmNlcyA9IGFzeW5jIChhZGRyZXNzOnN0cmluZyk6UHJvbWlzZTxBcnJheTxvYmplY3Q+PiA9PiB7XG4gICAgaWYgKHR5cGVvZiB0aGlzLnBhcnNlQWRkcmVzcyhhZGRyZXNzKSA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJFcnJvciAtIEFWTUFQSS5nZXRBbGxCYWxhbmNlczogSW52YWxpZCBhZGRyZXNzIGZvcm1hdFwiKTtcbiAgICB9XG4gICAgY29uc3QgcGFyYW1zOmFueSA9IHtcbiAgICAgIGFkZHJlc3MsXG4gICAgfTtcbiAgICByZXR1cm4gdGhpcy5jYWxsTWV0aG9kKCdhdm0uZ2V0QWxsQmFsYW5jZXMnLCBwYXJhbXMpLnRoZW4oKHJlc3BvbnNlOlJlcXVlc3RSZXNwb25zZURhdGEpID0+IHJlc3BvbnNlLmRhdGEucmVzdWx0LmJhbGFuY2VzKTtcbiAgfTtcblxuICAvKipcbiAgICAgKiBSZXRyaWV2ZXMgYW4gYXNzZXRzIG5hbWUgYW5kIHN5bWJvbC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBhc3NldElEIEVpdGhlciBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IG9yIGFuIGI1OCBzZXJpYWxpemVkIHN0cmluZyBmb3IgdGhlIEFzc2V0SUQgb3IgaXRzIGFsaWFzLlxuICAgICAqXG4gICAgICogQHJldHVybnMgUmV0dXJucyBhIFByb21pc2U8b2JqZWN0PiB3aXRoIGtleXMgXCJuYW1lXCIgYW5kIFwic3ltYm9sXCIuXG4gICAgICovXG4gIGdldEFzc2V0RGVzY3JpcHRpb24gPSBhc3luYyAoYXNzZXRJRDpCdWZmZXIgfCBzdHJpbmcpOlByb21pc2U8e25hbWU6c3RyaW5nO3N5bWJvbDpzdHJpbmc7YXNzZXRJRDpCdWZmZXI7ZGVub21pbmF0aW9uOm51bWJlcn0+ID0+IHtcbiAgICBsZXQgYXNzZXQ6c3RyaW5nO1xuICAgIGlmICh0eXBlb2YgYXNzZXRJRCAhPT0gJ3N0cmluZycpIHtcbiAgICAgIGFzc2V0ID0gYmludG9vbHMuY2I1OEVuY29kZShhc3NldElEKTtcbiAgICB9IGVsc2Uge1xuICAgICAgYXNzZXQgPSBhc3NldElEO1xuICAgIH1cbiAgICBjb25zdCBwYXJhbXM6YW55ID0ge1xuICAgICAgYXNzZXRJRDogYXNzZXQsXG4gICAgfTtcbiAgICByZXR1cm4gdGhpcy5jYWxsTWV0aG9kKCdhdm0uZ2V0QXNzZXREZXNjcmlwdGlvbicsIHBhcmFtcykudGhlbigocmVzcG9uc2U6UmVxdWVzdFJlc3BvbnNlRGF0YSkgPT4gKHtcbiAgICAgIG5hbWU6IHJlc3BvbnNlLmRhdGEucmVzdWx0Lm5hbWUsXG4gICAgICBzeW1ib2w6IHJlc3BvbnNlLmRhdGEucmVzdWx0LnN5bWJvbCxcbiAgICAgIGFzc2V0SUQ6IGJpbnRvb2xzLmNiNThEZWNvZGUocmVzcG9uc2UuZGF0YS5yZXN1bHQuYXNzZXRJRCksXG4gICAgICBkZW5vbWluYXRpb246IHBhcnNlSW50KHJlc3BvbnNlLmRhdGEucmVzdWx0LmRlbm9taW5hdGlvbiwgMTApLFxuICAgIH0pKTtcbiAgfTtcblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgdHJlYW5zYWN0aW9uIGRhdGEgb2YgYSBwcm92aWRlZCB0cmFuc2FjdGlvbiBJRCBieSBjYWxsaW5nIHRoZSBub2RlJ3MgYGdldFR4YCBtZXRob2QuXG4gICAqXG4gICAqIEBwYXJhbSB0eGlkIFRoZSBzdHJpbmcgcmVwcmVzZW50YXRpb24gb2YgdGhlIHRyYW5zYWN0aW9uIElEXG4gICAqXG4gICAqIEByZXR1cm5zIFJldHVybnMgYSBQcm9taXNlPHN0cmluZz4gY29udGFpbmluZyB0aGUgYnl0ZXMgcmV0cmlldmVkIGZyb20gdGhlIG5vZGVcbiAgICovXG4gIGdldFR4ID0gYXN5bmMgKHR4aWQ6c3RyaW5nKTpQcm9taXNlPHN0cmluZz4gPT4ge1xuICAgIGNvbnN0IHBhcmFtczphbnkgPSB7XG4gICAgICB0eElEOiB0eGlkLFxuICAgIH07XG4gICAgcmV0dXJuIHRoaXMuY2FsbE1ldGhvZCgnYXZtLmdldFR4JywgcGFyYW1zKS50aGVuKChyZXNwb25zZTpSZXF1ZXN0UmVzcG9uc2VEYXRhKSA9PiByZXNwb25zZS5kYXRhLnJlc3VsdC50eCk7XG4gIH07XG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIHN0YXR1cyBvZiBhIHByb3ZpZGVkIHRyYW5zYWN0aW9uIElEIGJ5IGNhbGxpbmcgdGhlIG5vZGUncyBgZ2V0VHhTdGF0dXNgIG1ldGhvZC5cbiAgICpcbiAgICogQHBhcmFtIHR4aWQgVGhlIHN0cmluZyByZXByZXNlbnRhdGlvbiBvZiB0aGUgdHJhbnNhY3Rpb24gSURcbiAgICpcbiAgICogQHJldHVybnMgUmV0dXJucyBhIFByb21pc2U8c3RyaW5nPiBjb250YWluaW5nIHRoZSBzdGF0dXMgcmV0cmlldmVkIGZyb20gdGhlIG5vZGVcbiAgICovXG4gIGdldFR4U3RhdHVzID0gYXN5bmMgKHR4aWQ6c3RyaW5nKTpQcm9taXNlPHN0cmluZz4gPT4ge1xuICAgIGNvbnN0IHBhcmFtczphbnkgPSB7XG4gICAgICB0eElEOiB0eGlkLFxuICAgIH07XG4gICAgcmV0dXJuIHRoaXMuY2FsbE1ldGhvZCgnYXZtLmdldFR4U3RhdHVzJywgcGFyYW1zKS50aGVuKChyZXNwb25zZTpSZXF1ZXN0UmVzcG9uc2VEYXRhKSA9PiByZXNwb25zZS5kYXRhLnJlc3VsdC5zdGF0dXMpO1xuICB9O1xuXG4gIC8qKlxuICAgKiBSZXRyaWV2ZXMgdGhlIFVUWE9zIHJlbGF0ZWQgdG8gdGhlIGFkZHJlc3NlcyBwcm92aWRlZCBmcm9tIHRoZSBub2RlJ3MgYGdldFVUWE9zYCBtZXRob2QuXG4gICAqXG4gICAqIEBwYXJhbSBhZGRyZXNzZXMgQW4gYXJyYXkgb2YgYWRkcmVzc2VzIGFzIGNiNTggc3RyaW5ncyBvciBhZGRyZXNzZXMgYXMge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn1zXG4gICAqIEBwYXJhbSBzb3VyY2VDaGFpbiBBIHN0cmluZyBmb3IgdGhlIGNoYWluIHRvIGxvb2sgZm9yIHRoZSBVVFhPJ3MuIERlZmF1bHQgaXMgdG8gdXNlIHRoaXMgY2hhaW4sIGJ1dCBpZiBleHBvcnRlZCBVVFhPcyBleGlzdCBmcm9tIG90aGVyIGNoYWlucywgdGhpcyBjYW4gdXNlZCB0byBwdWxsIHRoZW0gaW5zdGVhZC5cbiAgICogQHBhcmFtIGxpbWl0IE9wdGlvbmFsLiBSZXR1cm5zIGF0IG1vc3QgW2xpbWl0XSBhZGRyZXNzZXMuIElmIFtsaW1pdF0gPT0gMCBvciA+IFttYXhVVFhPc1RvRmV0Y2hdLCBmZXRjaGVzIHVwIHRvIFttYXhVVFhPc1RvRmV0Y2hdLlxuICAgKiBAcGFyYW0gc3RhcnRJbmRleCBPcHRpb25hbC4gW1N0YXJ0SW5kZXhdIGRlZmluZXMgd2hlcmUgdG8gc3RhcnQgZmV0Y2hpbmcgVVRYT3MgKGZvciBwYWdpbmF0aW9uLilcbiAgICogVVRYT3MgZmV0Y2hlZCBhcmUgZnJvbSBhZGRyZXNzZXMgZXF1YWwgdG8gb3IgZ3JlYXRlciB0aGFuIFtTdGFydEluZGV4LkFkZHJlc3NdXG4gICAqIEZvciBhZGRyZXNzIFtTdGFydEluZGV4LkFkZHJlc3NdLCBvbmx5IFVUWE9zIHdpdGggSURzIGdyZWF0ZXIgdGhhbiBbU3RhcnRJbmRleC5VdHhvXSB3aWxsIGJlIHJldHVybmVkLlxuICAgKiBAcGFyYW0gcGVyc2lzdE9wdHMgT3B0aW9ucyBhdmFpbGFibGUgdG8gcGVyc2lzdCB0aGVzZSBVVFhPcyBpbiBsb2NhbCBzdG9yYWdlXG4gICAqXG4gICAqIEByZW1hcmtzXG4gICAqIHBlcnNpc3RPcHRzIGlzIG9wdGlvbmFsIGFuZCBtdXN0IGJlIG9mIHR5cGUgW1tQZXJzaXN0YW5jZU9wdGlvbnNdXVxuICAgKlxuICAgKi9cbiAgZ2V0VVRYT3MgPSBhc3luYyAoXG4gICAgYWRkcmVzc2VzOkFycmF5PHN0cmluZz4gfCBzdHJpbmcsXG4gICAgc291cmNlQ2hhaW46c3RyaW5nID0gdW5kZWZpbmVkLFxuICAgIGxpbWl0Om51bWJlciA9IDAsXG4gICAgc3RhcnRJbmRleDp7YWRkcmVzczpzdHJpbmcsIHV0eG86c3RyaW5nfSA9IHVuZGVmaW5lZCxcbiAgICBwZXJzaXN0T3B0czpQZXJzaXN0YW5jZU9wdGlvbnMgPSB1bmRlZmluZWRcbiAgKTpQcm9taXNlPHtcbiAgICBudW1GZXRjaGVkOm51bWJlcixcbiAgICB1dHhvczpVVFhPU2V0LFxuICAgIGVuZEluZGV4OnthZGRyZXNzOnN0cmluZywgdXR4bzpzdHJpbmd9XG4gIH0+ID0+IHtcbiAgICBcbiAgICBpZih0eXBlb2YgYWRkcmVzc2VzID09PSBcInN0cmluZ1wiKSB7XG4gICAgICBhZGRyZXNzZXMgPSBbYWRkcmVzc2VzXTtcbiAgICB9XG5cbiAgICBjb25zdCBwYXJhbXM6YW55ID0ge1xuICAgICAgYWRkcmVzc2VzOiBhZGRyZXNzZXMsXG4gICAgICBsaW1pdFxuICAgIH07XG4gICAgaWYodHlwZW9mIHN0YXJ0SW5kZXggIT09IFwidW5kZWZpbmVkXCIgJiYgc3RhcnRJbmRleCkge1xuICAgICAgcGFyYW1zLnN0YXJ0SW5kZXggPSBzdGFydEluZGV4O1xuICAgIH1cblxuICAgIGlmKHR5cGVvZiBzb3VyY2VDaGFpbiAhPT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgcGFyYW1zLnNvdXJjZUNoYWluID0gc291cmNlQ2hhaW47XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXMuY2FsbE1ldGhvZCgnYXZtLmdldFVUWE9zJywgcGFyYW1zKS50aGVuKChyZXNwb25zZTpSZXF1ZXN0UmVzcG9uc2VEYXRhKSA9PiB7XG5cbiAgICAgIGNvbnN0IHV0eG9zOlVUWE9TZXQgPSBuZXcgVVRYT1NldCgpO1xuICAgICAgbGV0IGRhdGEgPSByZXNwb25zZS5kYXRhLnJlc3VsdC51dHhvcztcbiAgICAgIGlmIChwZXJzaXN0T3B0cyAmJiB0eXBlb2YgcGVyc2lzdE9wdHMgPT09ICdvYmplY3QnKSB7XG4gICAgICAgIGlmICh0aGlzLmRiLmhhcyhwZXJzaXN0T3B0cy5nZXROYW1lKCkpKSB7XG4gICAgICAgICAgY29uc3Qgc2VsZkFycmF5OkFycmF5PHN0cmluZz4gPSB0aGlzLmRiLmdldChwZXJzaXN0T3B0cy5nZXROYW1lKCkpO1xuICAgICAgICAgIGlmIChBcnJheS5pc0FycmF5KHNlbGZBcnJheSkpIHtcbiAgICAgICAgICAgIHV0eG9zLmFkZEFycmF5KGRhdGEpO1xuICAgICAgICAgICAgY29uc3Qgc2VsZjpVVFhPU2V0ID0gbmV3IFVUWE9TZXQoKTtcbiAgICAgICAgICAgIHNlbGYuYWRkQXJyYXkoc2VsZkFycmF5KTtcbiAgICAgICAgICAgIHNlbGYubWVyZ2VCeVJ1bGUodXR4b3MsIHBlcnNpc3RPcHRzLmdldE1lcmdlUnVsZSgpKTtcbiAgICAgICAgICAgIGRhdGEgPSBzZWxmLmdldEFsbFVUWE9TdHJpbmdzKCk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHRoaXMuZGIuc2V0KHBlcnNpc3RPcHRzLmdldE5hbWUoKSwgZGF0YSwgcGVyc2lzdE9wdHMuZ2V0T3ZlcndyaXRlKCkpO1xuICAgICAgfVxuICAgICAgdXR4b3MuYWRkQXJyYXkoZGF0YSwgZmFsc2UpO1xuICAgICAgcmVzcG9uc2UuZGF0YS5yZXN1bHQudXR4b3MgPSB1dHhvcztcbiAgICAgIHJldHVybiByZXNwb25zZS5kYXRhLnJlc3VsdDtcbiAgICB9KTtcbiAgfTtcblxuICAvKipcbiAgICogSGVscGVyIGZ1bmN0aW9uIHdoaWNoIGNyZWF0ZXMgYW4gdW5zaWduZWQgdHJhbnNhY3Rpb24uIEZvciBtb3JlIGdyYW51bGFyIGNvbnRyb2wsIHlvdSBtYXkgY3JlYXRlIHlvdXIgb3duXG4gICAqIFtbVW5zaWduZWRUeF1dIG1hbnVhbGx5ICh3aXRoIHRoZWlyIGNvcnJlc3BvbmRpbmcgW1tUcmFuc2ZlcmFibGVJbnB1dF1dcywgW1tUcmFuc2ZlcmFibGVPdXRwdXRdXXMsIGFuZCBbW1RyYW5zZmVyT3BlcmF0aW9uXV1zKS5cbiAgICpcbiAgICogQHBhcmFtIHV0eG9zZXQgQSBzZXQgb2YgVVRYT3MgdGhhdCB0aGUgdHJhbnNhY3Rpb24gaXMgYnVpbHQgb25cbiAgICogQHBhcmFtIGFtb3VudCBUaGUgYW1vdW50IG9mIEFzc2V0SUQgdG8gYmUgc3BlbnQgaW4gaXRzIHNtYWxsZXN0IGRlbm9taW5hdGlvbiwgcmVwcmVzZW50ZWQgYXMge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9pbmR1dG55L2JuLmpzL3xCTn0uXG4gICAqIEBwYXJhbSBhc3NldElEIFRoZSBhc3NldElEIG9mIHRoZSB2YWx1ZSBiZWluZyBzZW50XG4gICAqIEBwYXJhbSB0b0FkZHJlc3NlcyBUaGUgYWRkcmVzc2VzIHRvIHNlbmQgdGhlIGZ1bmRzXG4gICAqIEBwYXJhbSBmcm9tQWRkcmVzc2VzIFRoZSBhZGRyZXNzZXMgYmVpbmcgdXNlZCB0byBzZW5kIHRoZSBmdW5kcyBmcm9tIHRoZSBVVFhPcyBwcm92aWRlZFxuICAgKiBAcGFyYW0gY2hhbmdlQWRkcmVzc2VzIFRoZSBhZGRyZXNzZXMgdGhhdCBjYW4gc3BlbmQgdGhlIGNoYW5nZSByZW1haW5pbmcgZnJvbSB0aGUgc3BlbnQgVVRYT3NcbiAgICogQHBhcmFtIG1lbW8gT3B0aW9uYWwgQ0I1OCBCdWZmZXIgb3IgU3RyaW5nIHdoaWNoIGNvbnRhaW5zIGFyYml0cmFyeSBieXRlcywgdXAgdG8gMjU2IGJ5dGVzXG4gICAqIEBwYXJhbSBhc09mIE9wdGlvbmFsLiBUaGUgdGltZXN0YW1wIHRvIHZlcmlmeSB0aGUgdHJhbnNhY3Rpb24gYWdhaW5zdCBhcyBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vaW5kdXRueS9ibi5qcy98Qk59XG4gICAqIEBwYXJhbSBsb2NrdGltZSBPcHRpb25hbC4gVGhlIGxvY2t0aW1lIGZpZWxkIGNyZWF0ZWQgaW4gdGhlIHJlc3VsdGluZyBvdXRwdXRzXG4gICAqIEBwYXJhbSB0aHJlc2hvbGQgT3B0aW9uYWwuIFRoZSBudW1iZXIgb2Ygc2lnbmF0dXJlcyByZXF1aXJlZCB0byBzcGVuZCB0aGUgZnVuZHMgaW4gdGhlIHJlc3VsdGFudCBVVFhPXG4gICAqXG4gICAqIEByZXR1cm5zIEFuIHVuc2lnbmVkIHRyYW5zYWN0aW9uIChbW1Vuc2lnbmVkVHhdXSkgd2hpY2ggY29udGFpbnMgYSBbW0Jhc2VUeF1dLlxuICAgKlxuICAgKiBAcmVtYXJrc1xuICAgKiBUaGlzIGhlbHBlciBleGlzdHMgYmVjYXVzZSB0aGUgZW5kcG9pbnQgQVBJIHNob3VsZCBiZSB0aGUgcHJpbWFyeSBwb2ludCBvZiBlbnRyeSBmb3IgbW9zdCBmdW5jdGlvbmFsaXR5LlxuICAgKi9cbiAgYnVpbGRCYXNlVHggPSBhc3luYyAoXG4gICAgdXR4b3NldDpVVFhPU2V0LCBcbiAgICBhbW91bnQ6Qk4sIFxuICAgIGFzc2V0SUQ6QnVmZmVyIHwgc3RyaW5nID0gdW5kZWZpbmVkLCBcbiAgICB0b0FkZHJlc3NlczpBcnJheTxzdHJpbmc+LCBcbiAgICBmcm9tQWRkcmVzc2VzOkFycmF5PHN0cmluZz4sXG4gICAgY2hhbmdlQWRkcmVzc2VzOkFycmF5PHN0cmluZz4sIFxuICAgIG1lbW86UGF5bG9hZEJhc2V8QnVmZmVyID0gdW5kZWZpbmVkLCBcbiAgICBhc09mOkJOID0gVW5peE5vdygpLFxuICAgIGxvY2t0aW1lOkJOID0gbmV3IEJOKDApLCBcbiAgICB0aHJlc2hvbGQ6bnVtYmVyID0gMVxuICApOlByb21pc2U8VW5zaWduZWRUeD4gPT4ge1xuICAgIGNvbnN0IHRvOkFycmF5PEJ1ZmZlcj4gPSB0aGlzLl9jbGVhbkFkZHJlc3NBcnJheSh0b0FkZHJlc3NlcywgJ2J1aWxkQmFzZVR4JykubWFwKChhKSA9PiBiaW50b29scy5zdHJpbmdUb0FkZHJlc3MoYSkpO1xuICAgIGNvbnN0IGZyb206QXJyYXk8QnVmZmVyPiA9IHRoaXMuX2NsZWFuQWRkcmVzc0FycmF5KGZyb21BZGRyZXNzZXMsICdidWlsZEJhc2VUeCcpLm1hcCgoYSkgPT4gYmludG9vbHMuc3RyaW5nVG9BZGRyZXNzKGEpKTtcbiAgICBjb25zdCBjaGFuZ2U6QXJyYXk8QnVmZmVyPiA9IHRoaXMuX2NsZWFuQWRkcmVzc0FycmF5KGNoYW5nZUFkZHJlc3NlcywgJ2J1aWxkQmFzZVR4JykubWFwKChhKSA9PiBiaW50b29scy5zdHJpbmdUb0FkZHJlc3MoYSkpO1xuXG4gICAgaWYgKHR5cGVvZiBhc3NldElEID09PSAnc3RyaW5nJykge1xuICAgICAgYXNzZXRJRCA9IGJpbnRvb2xzLmNiNThEZWNvZGUoYXNzZXRJRCk7XG4gICAgfVxuXG4gICAgaWYoIG1lbW8gaW5zdGFuY2VvZiBQYXlsb2FkQmFzZSkge1xuICAgICAgbWVtbyA9IG1lbW8uZ2V0UGF5bG9hZCgpO1xuICAgIH1cblxuICAgIGNvbnN0IGJ1aWx0VW5zaWduZWRUeDpVbnNpZ25lZFR4ID0gdXR4b3NldC5idWlsZEJhc2VUeChcbiAgICAgIHRoaXMuY29yZS5nZXROZXR3b3JrSUQoKSwgXG4gICAgICBiaW50b29scy5jYjU4RGVjb2RlKHRoaXMuYmxvY2tjaGFpbklEKSxcbiAgICAgIGFtb3VudCwgXG4gICAgICBhc3NldElELCBcbiAgICAgIHRvLCBcbiAgICAgIGZyb20sIFxuICAgICAgY2hhbmdlLCBcbiAgICAgIHRoaXMuZ2V0VHhGZWUoKSwgXG4gICAgICBhd2FpdCB0aGlzLmdldEFWQVhBc3NldElEKCksXG4gICAgICBtZW1vLCBhc09mLCBsb2NrdGltZSwgdGhyZXNob2xkLFxuICAgICk7XG5cbiAgICBpZighIGF3YWl0IHRoaXMuY2hlY2tHb29zZUVnZyhidWlsdFVuc2lnbmVkVHgpKSB7XG4gICAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiRmFpbGVkIEdvb3NlIEVnZyBDaGVja1wiKTtcbiAgICB9XG5cbiAgICByZXR1cm4gYnVpbHRVbnNpZ25lZFR4O1xuICB9O1xuXG4gIC8qKlxuICAgKiBIZWxwZXIgZnVuY3Rpb24gd2hpY2ggY3JlYXRlcyBhbiB1bnNpZ25lZCBORlQgVHJhbnNmZXIuIEZvciBtb3JlIGdyYW51bGFyIGNvbnRyb2wsIHlvdSBtYXkgY3JlYXRlIHlvdXIgb3duXG4gICAqIFtbVW5zaWduZWRUeF1dIG1hbnVhbGx5ICh3aXRoIHRoZWlyIGNvcnJlc3BvbmRpbmcgW1tUcmFuc2ZlcmFibGVJbnB1dF1dcywgW1tUcmFuc2ZlcmFibGVPdXRwdXRdXXMsIGFuZCBbW1RyYW5zZmVyT3BlcmF0aW9uXV1zKS5cbiAgICpcbiAgICogQHBhcmFtIHV0eG9zZXQgIEEgc2V0IG9mIFVUWE9zIHRoYXQgdGhlIHRyYW5zYWN0aW9uIGlzIGJ1aWx0IG9uXG4gICAqIEBwYXJhbSB0b0FkZHJlc3NlcyBUaGUgYWRkcmVzc2VzIHRvIHNlbmQgdGhlIE5GVFxuICAgKiBAcGFyYW0gZnJvbUFkZHJlc3NlcyBUaGUgYWRkcmVzc2VzIGJlaW5nIHVzZWQgdG8gc2VuZCB0aGUgTkZUIGZyb20gdGhlIHV0eG9JRCBwcm92aWRlZFxuICAgKiBAcGFyYW0gY2hhbmdlQWRkcmVzc2VzIFRoZSBhZGRyZXNzZXMgdGhhdCBjYW4gc3BlbmQgdGhlIGNoYW5nZSByZW1haW5pbmcgZnJvbSB0aGUgc3BlbnQgVVRYT3NcbiAgICogQHBhcmFtIHV0eG9pZCBBIGJhc2U1OCB1dHhvSUQgb3IgYW4gYXJyYXkgb2YgYmFzZTU4IHV0eG9JRHMgZm9yIHRoZSBuZnRzIHRoaXMgdHJhbnNhY3Rpb24gaXMgc2VuZGluZ1xuICAgKiBAcGFyYW0gbWVtbyBPcHRpb25hbCBDQjU4IEJ1ZmZlciBvciBTdHJpbmcgd2hpY2ggY29udGFpbnMgYXJiaXRyYXJ5IGJ5dGVzLCB1cCB0byAyNTYgYnl0ZXNcbiAgICogQHBhcmFtIGFzT2YgT3B0aW9uYWwuIFRoZSB0aW1lc3RhbXAgdG8gdmVyaWZ5IHRoZSB0cmFuc2FjdGlvbiBhZ2FpbnN0IGFzIGEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9pbmR1dG55L2JuLmpzL3xCTn1cbiAgICogQHBhcmFtIGxvY2t0aW1lIE9wdGlvbmFsLiBUaGUgbG9ja3RpbWUgZmllbGQgY3JlYXRlZCBpbiB0aGUgcmVzdWx0aW5nIG91dHB1dHNcbiAgICogQHBhcmFtIHRocmVzaG9sZCBPcHRpb25hbC4gVGhlIG51bWJlciBvZiBzaWduYXR1cmVzIHJlcXVpcmVkIHRvIHNwZW5kIHRoZSBmdW5kcyBpbiB0aGUgcmVzdWx0YW50IFVUWE9cbiAgICpcbiAgICogQHJldHVybnMgQW4gdW5zaWduZWQgdHJhbnNhY3Rpb24gKFtbVW5zaWduZWRUeF1dKSB3aGljaCBjb250YWlucyBhIFtbTkZUVHJhbnNmZXJUeF1dLlxuICAgKlxuICAgKiBAcmVtYXJrc1xuICAgKiBUaGlzIGhlbHBlciBleGlzdHMgYmVjYXVzZSB0aGUgZW5kcG9pbnQgQVBJIHNob3VsZCBiZSB0aGUgcHJpbWFyeSBwb2ludCBvZiBlbnRyeSBmb3IgbW9zdCBmdW5jdGlvbmFsaXR5LlxuICAgKi9cbiAgYnVpbGRORlRUcmFuc2ZlclR4ID0gYXN5bmMgKFxuICAgIHV0eG9zZXQ6VVRYT1NldCwgXG4gICAgdG9BZGRyZXNzZXM6QXJyYXk8c3RyaW5nPiwgXG4gICAgZnJvbUFkZHJlc3NlczpBcnJheTxzdHJpbmc+LCBcbiAgICBjaGFuZ2VBZGRyZXNzZXM6QXJyYXk8c3RyaW5nPiwgXG4gICAgdXR4b2lkOnN0cmluZyB8IEFycmF5PHN0cmluZz4sIFxuICAgIG1lbW86UGF5bG9hZEJhc2V8QnVmZmVyID0gdW5kZWZpbmVkLCBcbiAgICBhc09mOkJOID0gVW5peE5vdygpLCBcbiAgICBsb2NrdGltZTpCTiA9IG5ldyBCTigwKSwgXG4gICAgdGhyZXNob2xkOm51bWJlciA9IDEsXG4gICk6UHJvbWlzZTxVbnNpZ25lZFR4PiA9PiB7XG4gICAgY29uc3QgdG86QXJyYXk8QnVmZmVyPiA9IHRoaXMuX2NsZWFuQWRkcmVzc0FycmF5KHRvQWRkcmVzc2VzLCAnYnVpbGRORlRUcmFuc2ZlclR4JykubWFwKChhKSA9PiBiaW50b29scy5zdHJpbmdUb0FkZHJlc3MoYSkpO1xuICAgIGNvbnN0IGZyb206QXJyYXk8QnVmZmVyPiA9IHRoaXMuX2NsZWFuQWRkcmVzc0FycmF5KGZyb21BZGRyZXNzZXMsICdidWlsZE5GVFRyYW5zZmVyVHgnKS5tYXAoKGEpID0+IGJpbnRvb2xzLnN0cmluZ1RvQWRkcmVzcyhhKSk7XG4gICAgY29uc3QgY2hhbmdlOkFycmF5PEJ1ZmZlcj4gPSB0aGlzLl9jbGVhbkFkZHJlc3NBcnJheShjaGFuZ2VBZGRyZXNzZXMsIFwiYnVpbGRDcmVhdGVORlRBc3NldFR4XCIpLm1hcChhID0+IGJpbnRvb2xzLnN0cmluZ1RvQWRkcmVzcyhhKSk7XG5cbiAgICBpZiggbWVtbyBpbnN0YW5jZW9mIFBheWxvYWRCYXNlKSB7XG4gICAgICBtZW1vID0gbWVtby5nZXRQYXlsb2FkKCk7XG4gICAgfVxuICAgIGNvbnN0IGF2YXhBc3NldElEOkJ1ZmZlciA9IGF3YWl0IHRoaXMuZ2V0QVZBWEFzc2V0SUQoKTtcblxuICAgIGxldCB1dHhvaWRBcnJheTpBcnJheTxzdHJpbmc+ID0gW107XG4gICAgaWYgKHR5cGVvZiB1dHhvaWQgPT09ICdzdHJpbmcnKSB7XG4gICAgICB1dHhvaWRBcnJheSA9IFt1dHhvaWRdO1xuICAgIH0gZWxzZSBpZiAoQXJyYXkuaXNBcnJheSh1dHhvaWQpKSB7XG4gICAgICB1dHhvaWRBcnJheSA9IHV0eG9pZDtcbiAgICB9XG5cbiAgICBjb25zdCBidWlsdFVuc2lnbmVkVHg6VW5zaWduZWRUeCA9IHV0eG9zZXQuYnVpbGRORlRUcmFuc2ZlclR4KFxuICAgICAgdGhpcy5jb3JlLmdldE5ldHdvcmtJRCgpLCBcbiAgICAgIGJpbnRvb2xzLmNiNThEZWNvZGUodGhpcy5ibG9ja2NoYWluSUQpLCBcbiAgICAgIHRvLCBcbiAgICAgIGZyb20sXG4gICAgICBjaGFuZ2UsXG4gICAgICB1dHhvaWRBcnJheSwgXG4gICAgICB0aGlzLmdldFR4RmVlKCksXG4gICAgICBhdmF4QXNzZXRJRCwgXG4gICAgICBtZW1vLCBhc09mLCBsb2NrdGltZSwgdGhyZXNob2xkLFxuICAgICk7XG5cbiAgICBpZighIGF3YWl0IHRoaXMuY2hlY2tHb29zZUVnZyhidWlsdFVuc2lnbmVkVHgpKSB7XG4gICAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiRmFpbGVkIEdvb3NlIEVnZyBDaGVja1wiKTtcbiAgICB9XG5cbiAgICByZXR1cm4gYnVpbHRVbnNpZ25lZFR4O1xuICB9O1xuXG4gIC8qKlxuICAgKiBIZWxwZXIgZnVuY3Rpb24gd2hpY2ggY3JlYXRlcyBhbiB1bnNpZ25lZCBJbXBvcnQgVHguIEZvciBtb3JlIGdyYW51bGFyIGNvbnRyb2wsIHlvdSBtYXkgY3JlYXRlIHlvdXIgb3duXG4gICAqIFtbVW5zaWduZWRUeF1dIG1hbnVhbGx5ICh3aXRoIHRoZWlyIGNvcnJlc3BvbmRpbmcgW1tUcmFuc2ZlcmFibGVJbnB1dF1dcywgW1tUcmFuc2ZlcmFibGVPdXRwdXRdXXMsIGFuZCBbW1RyYW5zZmVyT3BlcmF0aW9uXV1zKS5cbiAgICpcbiAgICogQHBhcmFtIHV0eG9zZXQgIEEgc2V0IG9mIFVUWE9zIHRoYXQgdGhlIHRyYW5zYWN0aW9uIGlzIGJ1aWx0IG9uXG4gICAqIEBwYXJhbSBvd25lckFkZHJlc3NlcyBUaGUgYWRkcmVzc2VzIGJlaW5nIHVzZWQgdG8gaW1wb3J0XG4gICAqIEBwYXJhbSBzb3VyY2VDaGFpbiBUaGUgY2hhaW5pZCBmb3Igd2hlcmUgdGhlIGltcG9ydCBpcyBjb21pbmcgZnJvbVxuICAgKiBAcGFyYW0gdG9BZGRyZXNzZXMgVGhlIGFkZHJlc3NlcyB0byBzZW5kIHRoZSBmdW5kc1xuICAgKiBAcGFyYW0gZnJvbUFkZHJlc3NlcyBUaGUgYWRkcmVzc2VzIGJlaW5nIHVzZWQgdG8gc2VuZCB0aGUgZnVuZHMgZnJvbSB0aGUgVVRYT3MgcHJvdmlkZWRcbiAgICogQHBhcmFtIGNoYW5nZUFkZHJlc3NlcyBUaGUgYWRkcmVzc2VzIHRoYXQgY2FuIHNwZW5kIHRoZSBjaGFuZ2UgcmVtYWluaW5nIGZyb20gdGhlIHNwZW50IFVUWE9zXG4gICAqIEBwYXJhbSBtZW1vIE9wdGlvbmFsIENCNTggQnVmZmVyIG9yIFN0cmluZyB3aGljaCBjb250YWlucyBhcmJpdHJhcnkgYnl0ZXMsIHVwIHRvIDI1NiBieXRlc1xuICAgKiBAcGFyYW0gYXNPZiBPcHRpb25hbC4gVGhlIHRpbWVzdGFtcCB0byB2ZXJpZnkgdGhlIHRyYW5zYWN0aW9uIGFnYWluc3QgYXMgYSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2luZHV0bnkvYm4uanMvfEJOfVxuICAgKiBAcGFyYW0gbG9ja3RpbWUgT3B0aW9uYWwuIFRoZSBsb2NrdGltZSBmaWVsZCBjcmVhdGVkIGluIHRoZSByZXN1bHRpbmcgb3V0cHV0c1xuICAgKiBAcGFyYW0gdGhyZXNob2xkIE9wdGlvbmFsLiBUaGUgbnVtYmVyIG9mIHNpZ25hdHVyZXMgcmVxdWlyZWQgdG8gc3BlbmQgdGhlIGZ1bmRzIGluIHRoZSByZXN1bHRhbnQgVVRYT1xuICAgKlxuICAgKiBAcmV0dXJucyBBbiB1bnNpZ25lZCB0cmFuc2FjdGlvbiAoW1tVbnNpZ25lZFR4XV0pIHdoaWNoIGNvbnRhaW5zIGEgW1tJbXBvcnRUeF1dLlxuICAgKlxuICAgKiBAcmVtYXJrc1xuICAgKiBUaGlzIGhlbHBlciBleGlzdHMgYmVjYXVzZSB0aGUgZW5kcG9pbnQgQVBJIHNob3VsZCBiZSB0aGUgcHJpbWFyeSBwb2ludCBvZiBlbnRyeSBmb3IgbW9zdCBmdW5jdGlvbmFsaXR5LlxuICAgKi9cbiAgYnVpbGRJbXBvcnRUeCA9IGFzeW5jIChcbiAgICB1dHhvc2V0OlVUWE9TZXQsIFxuICAgIG93bmVyQWRkcmVzc2VzOkFycmF5PHN0cmluZz4sXG4gICAgc291cmNlQ2hhaW46QnVmZmVyIHwgc3RyaW5nLFxuICAgIHRvQWRkcmVzc2VzOkFycmF5PHN0cmluZz4sIFxuICAgIGZyb21BZGRyZXNzZXM6QXJyYXk8c3RyaW5nPixcbiAgICBjaGFuZ2VBZGRyZXNzZXM6QXJyYXk8c3RyaW5nPiA9IHVuZGVmaW5lZCxcbiAgICBtZW1vOlBheWxvYWRCYXNlfEJ1ZmZlciA9IHVuZGVmaW5lZCwgXG4gICAgYXNPZjpCTiA9IFVuaXhOb3coKSwgXG4gICAgbG9ja3RpbWU6Qk4gPSBuZXcgQk4oMCksIFxuICAgIHRocmVzaG9sZDpudW1iZXIgPSAxXG4gICk6UHJvbWlzZTxVbnNpZ25lZFR4PiA9PiB7XG4gICAgY29uc3QgdG86QXJyYXk8QnVmZmVyPiA9IHRoaXMuX2NsZWFuQWRkcmVzc0FycmF5KHRvQWRkcmVzc2VzLCAnYnVpbGRJbXBvcnRUeCcpLm1hcCgoYSkgPT4gYmludG9vbHMuc3RyaW5nVG9BZGRyZXNzKGEpKTtcbiAgICBjb25zdCBmcm9tOkFycmF5PEJ1ZmZlcj4gPSB0aGlzLl9jbGVhbkFkZHJlc3NBcnJheShmcm9tQWRkcmVzc2VzLCAnYnVpbGRJbXBvcnRUeCcpLm1hcCgoYSkgPT4gYmludG9vbHMuc3RyaW5nVG9BZGRyZXNzKGEpKTtcbiAgICBjb25zdCBjaGFuZ2U6QXJyYXk8QnVmZmVyPiA9IHRoaXMuX2NsZWFuQWRkcmVzc0FycmF5KGNoYW5nZUFkZHJlc3NlcywgJ2J1aWxkSW1wb3J0VHgnKS5tYXAoKGEpID0+IGJpbnRvb2xzLnN0cmluZ1RvQWRkcmVzcyhhKSk7XG5cbiAgICBsZXQgc3JjQ2hhaW46c3RyaW5nID0gdW5kZWZpbmVkO1xuXG4gICAgaWYodHlwZW9mIHNvdXJjZUNoYWluID09PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJFcnJvciAtIEFWTUFQSS5idWlsZEltcG9ydFR4OiBTb3VyY2UgQ2hhaW5JRCBpcyB1bmRlZmluZWQuXCIpO1xuICAgIH0gZWxzZSBpZiAodHlwZW9mIHNvdXJjZUNoYWluID09PSBcInN0cmluZ1wiKSB7XG4gICAgICBzcmNDaGFpbiA9IHNvdXJjZUNoYWluO1xuICAgICAgc291cmNlQ2hhaW4gPSBiaW50b29scy5jYjU4RGVjb2RlKHNvdXJjZUNoYWluKTtcbiAgICB9IGVsc2UgaWYoIShzb3VyY2VDaGFpbiBpbnN0YW5jZW9mIEJ1ZmZlcikpIHtcbiAgICBzcmNDaGFpbiA9IGJpbnRvb2xzLmNiNThFbmNvZGUoc291cmNlQ2hhaW4pO1xuICAgIHRocm93IG5ldyBFcnJvcihcIkVycm9yIC0gQVZNQVBJLmJ1aWxkSW1wb3J0VHg6IEludmFsaWQgZGVzdGluYXRpb25DaGFpbiB0eXBlOiBcIiArICh0eXBlb2Ygc291cmNlQ2hhaW4pICk7XG4gIH1cbiAgXG4gIGNvbnN0IGF0b21pY1VUWE9zOlVUWE9TZXQgPSBhd2FpdCAoYXdhaXQgdGhpcy5nZXRVVFhPcyhvd25lckFkZHJlc3Nlcywgc3JjQ2hhaW4sIDAsIHVuZGVmaW5lZCkpLnV0eG9zO1xuICBjb25zdCBhdmF4QXNzZXRJRDpCdWZmZXIgPSBhd2FpdCB0aGlzLmdldEFWQVhBc3NldElEKCk7XG5cbiAgY29uc3QgYXRvbWljcyA9IGF0b21pY1VUWE9zLmdldEFsbFVUWE9zKCk7XG5cbiAgaWYoYXRvbWljcy5sZW5ndGggPT09IDApe1xuICAgIHRocm93IG5ldyBFcnJvcihcIkVycm9yIC0gQVZNQVBJLmJ1aWxkSW1wb3J0VHg6IE5vIGF0b21pYyBVVFhPcyB0byBpbXBvcnQgZnJvbSBcIiArIHNyY0NoYWluICsgXCIgdXNpbmcgYWRkcmVzc2VzOiBcIiArIG93bmVyQWRkcmVzc2VzLmpvaW4oXCIsIFwiKSApO1xuICB9XG5cbiAgaWYoIG1lbW8gaW5zdGFuY2VvZiBQYXlsb2FkQmFzZSkge1xuICAgIG1lbW8gPSBtZW1vLmdldFBheWxvYWQoKTtcbiAgfVxuXG4gIGNvbnN0IGJ1aWx0VW5zaWduZWRUeDpVbnNpZ25lZFR4ID0gdXR4b3NldC5idWlsZEltcG9ydFR4KFxuICAgIHRoaXMuY29yZS5nZXROZXR3b3JrSUQoKSwgXG4gICAgYmludG9vbHMuY2I1OERlY29kZSh0aGlzLmJsb2NrY2hhaW5JRCksIFxuICAgIHRvLFxuICAgIGZyb20sXG4gICAgY2hhbmdlLFxuICAgIGF0b21pY3MsIFxuICAgIHNvdXJjZUNoYWluLFxuICAgIHRoaXMuZ2V0VHhGZWUoKSwgXG4gICAgYXZheEFzc2V0SUQsIFxuICAgIG1lbW8sIGFzT2YsIGxvY2t0aW1lLCB0aHJlc2hvbGRcbiAgKTtcblxuICAgIGlmKCEgYXdhaXQgdGhpcy5jaGVja0dvb3NlRWdnKGJ1aWx0VW5zaWduZWRUeCkpIHtcbiAgICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJGYWlsZWQgR29vc2UgRWdnIENoZWNrXCIpO1xuICAgIH1cblxuICAgIHJldHVybiBidWlsdFVuc2lnbmVkVHg7XG4gIH07XG5cbiAgLyoqXG4gICAqIEhlbHBlciBmdW5jdGlvbiB3aGljaCBjcmVhdGVzIGFuIHVuc2lnbmVkIEV4cG9ydCBUeC4gRm9yIG1vcmUgZ3JhbnVsYXIgY29udHJvbCwgeW91IG1heSBjcmVhdGUgeW91ciBvd25cbiAgICogW1tVbnNpZ25lZFR4XV0gbWFudWFsbHkgKHdpdGggdGhlaXIgY29ycmVzcG9uZGluZyBbW1RyYW5zZmVyYWJsZUlucHV0XV1zLCBbW1RyYW5zZmVyYWJsZU91dHB1dF1dcywgYW5kIFtbVHJhbnNmZXJPcGVyYXRpb25dXXMpLlxuICAgKlxuICAgKiBAcGFyYW0gdXR4b3NldCBBIHNldCBvZiBVVFhPcyB0aGF0IHRoZSB0cmFuc2FjdGlvbiBpcyBidWlsdCBvblxuICAgKiBAcGFyYW0gYW1vdW50IFRoZSBhbW91bnQgYmVpbmcgZXhwb3J0ZWQgYXMgYSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2luZHV0bnkvYm4uanMvfEJOfVxuICAgKiBAcGFyYW0gZGVzdGluYXRpb25DaGFpbiBUaGUgY2hhaW5pZCBmb3Igd2hlcmUgdGhlIGFzc2V0cyB3aWxsIGJlIHNlbnQuXG4gICAqIEBwYXJhbSB0b0FkZHJlc3NlcyBUaGUgYWRkcmVzc2VzIHRvIHNlbmQgdGhlIGZ1bmRzXG4gICAqIEBwYXJhbSBmcm9tQWRkcmVzc2VzIFRoZSBhZGRyZXNzZXMgYmVpbmcgdXNlZCB0byBzZW5kIHRoZSBmdW5kcyBmcm9tIHRoZSBVVFhPcyBwcm92aWRlZFxuICAgKiBAcGFyYW0gY2hhbmdlQWRkcmVzc2VzIFRoZSBhZGRyZXNzZXMgdGhhdCBjYW4gc3BlbmQgdGhlIGNoYW5nZSByZW1haW5pbmcgZnJvbSB0aGUgc3BlbnQgVVRYT3NcbiAgICogQHBhcmFtIG1lbW8gT3B0aW9uYWwgQ0I1OCBCdWZmZXIgb3IgU3RyaW5nIHdoaWNoIGNvbnRhaW5zIGFyYml0cmFyeSBieXRlcywgdXAgdG8gMjU2IGJ5dGVzXG4gICAqIEBwYXJhbSBhc09mIE9wdGlvbmFsLiBUaGUgdGltZXN0YW1wIHRvIHZlcmlmeSB0aGUgdHJhbnNhY3Rpb24gYWdhaW5zdCBhcyBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vaW5kdXRueS9ibi5qcy98Qk59XG4gICAqIEBwYXJhbSBsb2NrdGltZSBPcHRpb25hbC4gVGhlIGxvY2t0aW1lIGZpZWxkIGNyZWF0ZWQgaW4gdGhlIHJlc3VsdGluZyBvdXRwdXRzXG4gICAqIEBwYXJhbSB0aHJlc2hvbGQgT3B0aW9uYWwuIFRoZSBudW1iZXIgb2Ygc2lnbmF0dXJlcyByZXF1aXJlZCB0byBzcGVuZCB0aGUgZnVuZHMgaW4gdGhlIHJlc3VsdGFudCBVVFhPXG4gICAqIEBwYXJhbSBhc3NldElEIE9wdGlvbmFsLiBUaGUgYXNzZXRJRCBvZiB0aGUgYXNzZXQgdG8gc2VuZC4gRGVmYXVsdHMgdG8gQVZBWCBhc3NldElELiBcbiAgICogUmVnYXJkbGVzcyBvZiB0aGUgYXNzZXQgd2hpY2ggeW91J3JlIGV4cG9ydGluZywgYWxsIGZlZXMgYXJlIHBhaWQgaW4gQVZBWC5cbiAgICpcbiAgICogQHJldHVybnMgQW4gdW5zaWduZWQgdHJhbnNhY3Rpb24gKFtbVW5zaWduZWRUeF1dKSB3aGljaCBjb250YWlucyBhbiBbW0V4cG9ydFR4XV0uXG4gICAqL1xuICBidWlsZEV4cG9ydFR4ID0gYXN5bmMgKFxuICAgIHV0eG9zZXQ6VVRYT1NldCwgXG4gICAgYW1vdW50OkJOLFxuICAgIGRlc3RpbmF0aW9uQ2hhaW46QnVmZmVyIHwgc3RyaW5nLFxuICAgIHRvQWRkcmVzc2VzOkFycmF5PHN0cmluZz4sIFxuICAgIGZyb21BZGRyZXNzZXM6QXJyYXk8c3RyaW5nPixcbiAgICBjaGFuZ2VBZGRyZXNzZXM6QXJyYXk8c3RyaW5nPiA9IHVuZGVmaW5lZCxcbiAgICBtZW1vOlBheWxvYWRCYXNlfEJ1ZmZlciA9IHVuZGVmaW5lZCwgXG4gICAgYXNPZjpCTiA9IFVuaXhOb3coKSxcbiAgICBsb2NrdGltZTpCTiA9IG5ldyBCTigwKSwgXG4gICAgdGhyZXNob2xkOm51bWJlciA9IDEsXG4gICAgYXNzZXRJRDpzdHJpbmcgPSB1bmRlZmluZWRcbiAgKTpQcm9taXNlPFVuc2lnbmVkVHg+ID0+IHtcbiAgICBcbiAgICBsZXQgcHJlZml4ZXM6b2JqZWN0ID0ge307XG4gICAgdG9BZGRyZXNzZXMubWFwKChhKSA9PiB7XG4gICAgICBwcmVmaXhlc1thLnNwbGl0KFwiLVwiKVswXV0gPSB0cnVlO1xuICAgIH0pO1xuICAgIGlmKE9iamVjdC5rZXlzKHByZWZpeGVzKS5sZW5ndGggIT09IDEpe1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiRXJyb3IgLSBBVk1BUEkuYnVpbGRFeHBvcnRUeDogVG8gYWRkcmVzc2VzIG11c3QgaGF2ZSB0aGUgc2FtZSBjaGFpbklEIHByZWZpeC5cIik7XG4gICAgfVxuICAgIFxuICAgIGlmKHR5cGVvZiBkZXN0aW5hdGlvbkNoYWluID09PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJFcnJvciAtIEFWTUFQSS5idWlsZEV4cG9ydFR4OiBEZXN0aW5hdGlvbiBDaGFpbklEIGlzIHVuZGVmaW5lZC5cIik7XG4gICAgfSBlbHNlIGlmICh0eXBlb2YgZGVzdGluYXRpb25DaGFpbiA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgZGVzdGluYXRpb25DaGFpbiA9IGJpbnRvb2xzLmNiNThEZWNvZGUoZGVzdGluYXRpb25DaGFpbik7IC8vXG4gICAgfSBlbHNlIGlmKCEoZGVzdGluYXRpb25DaGFpbiBpbnN0YW5jZW9mIEJ1ZmZlcikpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIkVycm9yIC0gQVZNQVBJLmJ1aWxkRXhwb3J0VHg6IEludmFsaWQgZGVzdGluYXRpb25DaGFpbiB0eXBlOiBcIiArICh0eXBlb2YgZGVzdGluYXRpb25DaGFpbikgKTtcbiAgICB9XG4gICAgaWYoZGVzdGluYXRpb25DaGFpbi5sZW5ndGggIT09IDMyKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJFcnJvciAtIEFWTUFQSS5idWlsZEV4cG9ydFR4OiBEZXN0aW5hdGlvbiBDaGFpbklEIG11c3QgYmUgMzIgYnl0ZXMgaW4gbGVuZ3RoLlwiKTtcbiAgICB9XG5cbiAgICBsZXQgdG86QXJyYXk8QnVmZmVyPiA9IFtdO1xuICAgIHRvQWRkcmVzc2VzLm1hcCgoYSkgPT4ge1xuICAgICAgdG8ucHVzaChiaW50b29scy5zdHJpbmdUb0FkZHJlc3MoYSkpO1xuICAgIH0pO1xuXG4gICAgY29uc3QgZnJvbTpBcnJheTxCdWZmZXI+ID0gdGhpcy5fY2xlYW5BZGRyZXNzQXJyYXkoZnJvbUFkZHJlc3NlcywgJ2J1aWxkRXhwb3J0VHgnKS5tYXAoKGEpID0+IGJpbnRvb2xzLnN0cmluZ1RvQWRkcmVzcyhhKSk7XG4gICAgY29uc3QgY2hhbmdlOkFycmF5PEJ1ZmZlcj4gPSB0aGlzLl9jbGVhbkFkZHJlc3NBcnJheShjaGFuZ2VBZGRyZXNzZXMsICdidWlsZEV4cG9ydFR4JykubWFwKChhKSA9PiBiaW50b29scy5zdHJpbmdUb0FkZHJlc3MoYSkpO1xuXG4gICAgaWYoIG1lbW8gaW5zdGFuY2VvZiBQYXlsb2FkQmFzZSkge1xuICAgICAgbWVtbyA9IG1lbW8uZ2V0UGF5bG9hZCgpO1xuICAgIH1cblxuICAgIGNvbnN0IGF2YXhBc3NldElEOkJ1ZmZlciA9IGF3YWl0IHRoaXMuZ2V0QVZBWEFzc2V0SUQoKTtcbiAgICBpZih0eXBlb2YgYXNzZXRJRCA9PT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgYXNzZXRJRCA9IGJpbnRvb2xzLmNiNThFbmNvZGUoYXZheEFzc2V0SUQpO1xuICAgIH1cblxuICAgIGNvbnN0IGJ1aWx0VW5zaWduZWRUeDpVbnNpZ25lZFR4ID0gdXR4b3NldC5idWlsZEV4cG9ydFR4KFxuICAgICAgdGhpcy5jb3JlLmdldE5ldHdvcmtJRCgpLCBcbiAgICAgIGJpbnRvb2xzLmNiNThEZWNvZGUodGhpcy5ibG9ja2NoYWluSUQpLCBcbiAgICAgIGFtb3VudCxcbiAgICAgIGJpbnRvb2xzLmNiNThEZWNvZGUoYXNzZXRJRCksIFxuICAgICAgdG8sXG4gICAgICBmcm9tLFxuICAgICAgY2hhbmdlLFxuICAgICAgZGVzdGluYXRpb25DaGFpbixcbiAgICAgIHRoaXMuZ2V0VHhGZWUoKSwgXG4gICAgICBhdmF4QXNzZXRJRCxcbiAgICAgIG1lbW8sIGFzT2YsIGxvY2t0aW1lLCB0aHJlc2hvbGRcbiAgICApO1xuXG4gICAgaWYoISBhd2FpdCB0aGlzLmNoZWNrR29vc2VFZ2coYnVpbHRVbnNpZ25lZFR4KSkge1xuICAgICAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cbiAgICAgIHRocm93IG5ldyBFcnJvcihcIkZhaWxlZCBHb29zZSBFZ2cgQ2hlY2tcIik7XG4gICAgfVxuXG4gICAgcmV0dXJuIGJ1aWx0VW5zaWduZWRUeDtcbiAgfTtcblxuICAvKipcbiAgICogQ3JlYXRlcyBhbiB1bnNpZ25lZCB0cmFuc2FjdGlvbi4gRm9yIG1vcmUgZ3JhbnVsYXIgY29udHJvbCwgeW91IG1heSBjcmVhdGUgeW91ciBvd25cbiAgICogW1tVbnNpZ25lZFR4XV0gbWFudWFsbHkgKHdpdGggdGhlaXIgY29ycmVzcG9uZGluZyBbW1RyYW5zZmVyYWJsZUlucHV0XV1zLCBbW1RyYW5zZmVyYWJsZU91dHB1dF1dcywgYW5kIFtbVHJhbnNmZXJPcGVyYXRpb25dXXMpLlxuICAgKlxuICAgKiBAcGFyYW0gdXR4b3NldCBBIHNldCBvZiBVVFhPcyB0aGF0IHRoZSB0cmFuc2FjdGlvbiBpcyBidWlsdCBvblxuICAgKiBAcGFyYW0gZnJvbUFkZHJlc3NlcyBUaGUgYWRkcmVzc2VzIGJlaW5nIHVzZWQgdG8gc2VuZCB0aGUgZnVuZHMgZnJvbSB0aGUgVVRYT3Mge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn1cbiAgICogQHBhcmFtIGNoYW5nZUFkZHJlc3NlcyBUaGUgYWRkcmVzc2VzIHRoYXQgY2FuIHNwZW5kIHRoZSBjaGFuZ2UgcmVtYWluaW5nIGZyb20gdGhlIHNwZW50IFVUWE9zXG4gICAqIEBwYXJhbSBpbml0aWFsU3RhdGUgVGhlIFtbSW5pdGlhbFN0YXRlc11dIHRoYXQgcmVwcmVzZW50IHRoZSBpbnRpYWwgc3RhdGUgb2YgYSBjcmVhdGVkIGFzc2V0XG4gICAqIEBwYXJhbSBuYW1lIFN0cmluZyBmb3IgdGhlIGRlc2NyaXB0aXZlIG5hbWUgb2YgdGhlIGFzc2V0XG4gICAqIEBwYXJhbSBzeW1ib2wgU3RyaW5nIGZvciB0aGUgdGlja2VyIHN5bWJvbCBvZiB0aGUgYXNzZXRcbiAgICogQHBhcmFtIGRlbm9taW5hdGlvbiBOdW1iZXIgZm9yIHRoZSBkZW5vbWluYXRpb24gd2hpY2ggaXMgMTBeRC4gRCBtdXN0IGJlID49IDAgYW5kIDw9IDMyLiBFeDogJDEgQVZBWCA9IDEwXjkgJG5BVkFYXG4gICAqIEBwYXJhbSBtaW50T3V0cHV0cyBPcHRpb25hbC4gQXJyYXkgb2YgW1tTRUNQTWludE91dHB1dF1dcyB0byBiZSBpbmNsdWRlZCBpbiB0aGUgdHJhbnNhY3Rpb24uIFRoZXNlIG91dHB1dHMgY2FuIGJlIHNwZW50IHRvIG1pbnQgbW9yZSB0b2tlbnMuXG4gICAqIEBwYXJhbSBtZW1vIE9wdGlvbmFsIENCNTggQnVmZmVyIG9yIFN0cmluZyB3aGljaCBjb250YWlucyBhcmJpdHJhcnkgYnl0ZXMsIHVwIHRvIDI1NiBieXRlc1xuICAgKiBAcGFyYW0gYXNPZiBPcHRpb25hbC4gVGhlIHRpbWVzdGFtcCB0byB2ZXJpZnkgdGhlIHRyYW5zYWN0aW9uIGFnYWluc3QgYXMgYSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2luZHV0bnkvYm4uanMvfEJOfVxuICAgKlxuICAgKiBAcmV0dXJucyBBbiB1bnNpZ25lZCB0cmFuc2FjdGlvbiAoW1tVbnNpZ25lZFR4XV0pIHdoaWNoIGNvbnRhaW5zIGEgW1tDcmVhdGVBc3NldFR4XV0uXG4gICAqIFxuICAgKi9cbiAgYnVpbGRDcmVhdGVBc3NldFR4ID0gYXN5bmMgKFxuICAgICAgdXR4b3NldDpVVFhPU2V0LCBcbiAgICAgIGZyb21BZGRyZXNzZXM6QXJyYXk8c3RyaW5nPiwgXG4gICAgICBjaGFuZ2VBZGRyZXNzZXM6QXJyYXk8c3RyaW5nPiAsXG4gICAgICBpbml0aWFsU3RhdGVzOkluaXRpYWxTdGF0ZXMsIFxuICAgICAgbmFtZTpzdHJpbmcsIFxuICAgICAgc3ltYm9sOnN0cmluZywgXG4gICAgICBkZW5vbWluYXRpb246bnVtYmVyLCBcbiAgICAgIG1pbnRPdXRwdXRzOkFycmF5PFNFQ1BNaW50T3V0cHV0PiA9IHVuZGVmaW5lZCxcbiAgICAgIG1lbW86UGF5bG9hZEJhc2V8QnVmZmVyID0gdW5kZWZpbmVkLCBcbiAgICAgIGFzT2Y6Qk4gPSBVbml4Tm93KClcbiAgKTpQcm9taXNlPFVuc2lnbmVkVHg+ID0+IHtcbiAgICBsZXQgZnJvbTpBcnJheTxCdWZmZXI+ID0gdGhpcy5fY2xlYW5BZGRyZXNzQXJyYXkoZnJvbUFkZHJlc3NlcywgXCJidWlsZENyZWF0ZUFzc2V0VHhcIikubWFwKGEgPT4gYmludG9vbHMuc3RyaW5nVG9BZGRyZXNzKGEpKTtcbiAgICBsZXQgY2hhbmdlOkFycmF5PEJ1ZmZlcj4gPSB0aGlzLl9jbGVhbkFkZHJlc3NBcnJheShjaGFuZ2VBZGRyZXNzZXMsIFwiYnVpbGRDcmVhdGVORlRBc3NldFR4XCIpLm1hcChhID0+IGJpbnRvb2xzLnN0cmluZ1RvQWRkcmVzcyhhKSk7XG5cbiAgICBpZiggbWVtbyBpbnN0YW5jZW9mIFBheWxvYWRCYXNlKSB7XG4gICAgICBtZW1vID0gbWVtby5nZXRQYXlsb2FkKCk7XG4gICAgfVxuXG4gICAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cbiAgICBpZihzeW1ib2wubGVuZ3RoID4gQVZNQ29uc3RhbnRzLlNZTUJPTE1BWExFTil7XG4gICAgICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIkVycm9yIC0gQVZNQVBJLmJ1aWxkQ3JlYXRlQXNzZXRUeDogU3ltYm9scyBtYXkgbm90IGV4Y2VlZCBsZW5ndGggb2YgXCIgKyBBVk1Db25zdGFudHMuU1lNQk9MTUFYTEVOKTtcbiAgICB9XG4gICAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cbiAgICBpZihuYW1lLmxlbmd0aCA+IEFWTUNvbnN0YW50cy5BU1NFVE5BTUVMRU4pIHtcbiAgICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJFcnJvciAtIEFWTUFQSS5idWlsZENyZWF0ZUFzc2V0VHg6IE5hbWVzIG1heSBub3QgZXhjZWVkIGxlbmd0aCBvZiBcIiArIEFWTUNvbnN0YW50cy5BU1NFVE5BTUVMRU4pO1xuICAgIH1cblxuICAgIGNvbnN0IGF2YXhBc3NldElEOkJ1ZmZlciA9IGF3YWl0IHRoaXMuZ2V0QVZBWEFzc2V0SUQoKTtcbiAgICBjb25zdCBidWlsdFVuc2lnbmVkVHg6VW5zaWduZWRUeCA9IHV0eG9zZXQuYnVpbGRDcmVhdGVBc3NldFR4KFxuICAgICAgdGhpcy5jb3JlLmdldE5ldHdvcmtJRCgpLCBcbiAgICAgIGJpbnRvb2xzLmNiNThEZWNvZGUodGhpcy5ibG9ja2NoYWluSUQpLCBcbiAgICAgIGZyb20sXG4gICAgICBjaGFuZ2UsXG4gICAgICBpbml0aWFsU3RhdGVzLFxuICAgICAgbmFtZSwgXG4gICAgICBzeW1ib2wsIFxuICAgICAgZGVub21pbmF0aW9uLCBcbiAgICAgIG1pbnRPdXRwdXRzLFxuICAgICAgdGhpcy5nZXRDcmVhdGlvblR4RmVlKCksIFxuICAgICAgYXZheEFzc2V0SUQsXG4gICAgICBtZW1vLCBhc09mXG4gICAgKTtcblxuICAgIGlmKCEgYXdhaXQgdGhpcy5jaGVja0dvb3NlRWdnKGJ1aWx0VW5zaWduZWRUeCwgdGhpcy5nZXRDcmVhdGlvblR4RmVlKCkpKSB7XG4gICAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiRmFpbGVkIEdvb3NlIEVnZyBDaGVja1wiKTtcbiAgICB9XG5cbiAgICByZXR1cm4gYnVpbHRVbnNpZ25lZFR4O1xuICB9O1xuXG4gIGJ1aWxkU0VDUE1pbnRUeCA9IGFzeW5jIChcbiAgICB1dHhvc2V0OlVUWE9TZXQsICBcbiAgICBtaW50T3duZXI6U0VDUE1pbnRPdXRwdXQsXG4gICAgdHJhbnNmZXJPd25lcjpTRUNQVHJhbnNmZXJPdXRwdXQsXG4gICAgZnJvbUFkZHJlc3NlczpBcnJheTxzdHJpbmc+LFxuICAgIGNoYW5nZUFkZHJlc3NlczpBcnJheTxzdHJpbmc+LFxuICAgIG1pbnRVVFhPSUQ6c3RyaW5nLFxuICAgIG1lbW86UGF5bG9hZEJhc2V8QnVmZmVyID0gdW5kZWZpbmVkLCBhc09mOkJOID0gVW5peE5vdygpXG4gICk6IFByb21pc2U8YW55PiA9PiB7XG4gICAgbGV0IGZyb206QXJyYXk8QnVmZmVyPiA9IHRoaXMuX2NsZWFuQWRkcmVzc0FycmF5KGZyb21BZGRyZXNzZXMsIFwiYnVpbGRTRUNQTWludFR4XCIpLm1hcChhID0+IGJpbnRvb2xzLnN0cmluZ1RvQWRkcmVzcyhhKSk7XG4gICAgbGV0IGNoYW5nZTpBcnJheTxCdWZmZXI+ID0gdGhpcy5fY2xlYW5BZGRyZXNzQXJyYXkoY2hhbmdlQWRkcmVzc2VzLCBcImJ1aWxkU0VDUE1pbnRUeFwiKS5tYXAoYSA9PiBiaW50b29scy5zdHJpbmdUb0FkZHJlc3MoYSkpO1xuICAgIFxuICAgIGlmKCBtZW1vIGluc3RhbmNlb2YgUGF5bG9hZEJhc2UpIHtcbiAgICAgIG1lbW8gPSBtZW1vLmdldFBheWxvYWQoKTtcbiAgICB9XG5cbiAgICBsZXQgYXZheEFzc2V0SUQ6QnVmZmVyID0gYXdhaXQgdGhpcy5nZXRBVkFYQXNzZXRJRCgpO1xuXG4gICAgY29uc3QgYnVpbHRVbnNpZ25lZFR4OlVuc2lnbmVkVHggPSB1dHhvc2V0LmJ1aWxkU0VDUE1pbnRUeChcbiAgICAgICAgdGhpcy5jb3JlLmdldE5ldHdvcmtJRCgpLFxuICAgICAgICBiaW50b29scy5jYjU4RGVjb2RlKHRoaXMuYmxvY2tjaGFpbklEKSxcbiAgICAgICAgbWludE93bmVyLFxuICAgICAgICB0cmFuc2Zlck93bmVyLFxuICAgICAgICBmcm9tLFxuICAgICAgICBjaGFuZ2UsXG4gICAgICAgIG1pbnRVVFhPSUQsXG4gICAgICAgIHRoaXMuZ2V0VHhGZWUoKSxcbiAgICAgICAgYXZheEFzc2V0SUQsXG4gICAgICAgIG1lbW8sIGFzT2ZcbiAgICApO1xuICAgIGlmKCEgYXdhaXQgdGhpcy5jaGVja0dvb3NlRWdnKGJ1aWx0VW5zaWduZWRUeCkpIHtcbiAgICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJGYWlsZWQgR29vc2UgRWdnIENoZWNrXCIpO1xuICAgIH1cbiAgICByZXR1cm4gYnVpbHRVbnNpZ25lZFR4O1xuICB9XG5cbiAgLyoqXG4gICogQ3JlYXRlcyBhbiB1bnNpZ25lZCB0cmFuc2FjdGlvbi4gRm9yIG1vcmUgZ3JhbnVsYXIgY29udHJvbCwgeW91IG1heSBjcmVhdGUgeW91ciBvd25cbiAgKiBbW1Vuc2lnbmVkVHhdXSBtYW51YWxseSAod2l0aCB0aGVpciBjb3JyZXNwb25kaW5nIFtbVHJhbnNmZXJhYmxlSW5wdXRdXXMsIFtbVHJhbnNmZXJhYmxlT3V0cHV0XV1zLCBhbmQgW1tUcmFuc2Zlck9wZXJhdGlvbl1dcykuXG4gICogXG4gICogQHBhcmFtIHV0eG9zZXQgQSBzZXQgb2YgVVRYT3MgdGhhdCB0aGUgdHJhbnNhY3Rpb24gaXMgYnVpbHQgb25cbiAgKiBAcGFyYW0gZnJvbUFkZHJlc3NlcyBUaGUgYWRkcmVzc2VzIGJlaW5nIHVzZWQgdG8gc2VuZCB0aGUgZnVuZHMgZnJvbSB0aGUgVVRYT3Mge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn1cbiAgKiBAcGFyYW0gY2hhbmdlQWRkcmVzc2VzIFRoZSBhZGRyZXNzZXMgdGhhdCBjYW4gc3BlbmQgdGhlIGNoYW5nZSByZW1haW5pbmcgZnJvbSB0aGUgc3BlbnQgVVRYT3NcbiAgKiBAcGFyYW0gbWludGVyU2V0cyBpcyBhIGxpc3Qgd2hlcmUgZWFjaCBlbGVtZW50IHNwZWNpZmllcyB0aGF0IHRocmVzaG9sZCBvZiB0aGUgYWRkcmVzc2VzIGluIG1pbnRlcnMgbWF5IHRvZ2V0aGVyIG1pbnQgbW9yZSBvZiB0aGUgYXNzZXQgYnkgc2lnbmluZyBhIG1pbnRpbmcgdHJhbnNhY3Rpb25cbiAgKiBAcGFyYW0gbmFtZSBTdHJpbmcgZm9yIHRoZSBkZXNjcmlwdGl2ZSBuYW1lIG9mIHRoZSBhc3NldFxuICAqIEBwYXJhbSBzeW1ib2wgU3RyaW5nIGZvciB0aGUgdGlja2VyIHN5bWJvbCBvZiB0aGUgYXNzZXRcbiAgKiBAcGFyYW0gbWVtbyBPcHRpb25hbCBDQjU4IEJ1ZmZlciBvciBTdHJpbmcgd2hpY2ggY29udGFpbnMgYXJiaXRyYXJ5IGJ5dGVzLCB1cCB0byAyNTYgYnl0ZXNcbiAgKiBAcGFyYW0gYXNPZiBPcHRpb25hbC4gVGhlIHRpbWVzdGFtcCB0byB2ZXJpZnkgdGhlIHRyYW5zYWN0aW9uIGFnYWluc3QgYXMgYSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2luZHV0bnkvYm4uanMvfEJOfVxuICAqIEBwYXJhbSBsb2NrdGltZSBPcHRpb25hbC4gVGhlIGxvY2t0aW1lIGZpZWxkIGNyZWF0ZWQgaW4gdGhlIHJlc3VsdGluZyBtaW50IG91dHB1dFxuICAqIFxuICAqIGBgYGpzXG4gICogRXhhbXBsZSBtaW50ZXJTZXRzOlxuICAqIFtcbiAgKiAgICAgIHtcbiAgKiAgICAgICAgICBcIm1pbnRlcnNcIjpbXG4gICogICAgICAgICAgICAgIFwiWC1hdmF4MWdoc3RqdWtydHc4OTM1bHJ5cXRuaDY0M3hlOWE5NHUzdGM3NWM3XCJcbiAgKiAgICAgICAgICBdLFxuICAqICAgICAgICAgIFwidGhyZXNob2xkXCI6IDFcbiAgKiAgICAgIH0sXG4gICogICAgICB7XG4gICogICAgICAgICAgXCJtaW50ZXJzXCI6IFtcbiAgKiAgICAgICAgICAgICAgXCJYLWF2YXgxeWVsbDNlNG5sbjBtMzljZnBkaGdxcHJzZDg3amtoNHFuYWtrbHhcIixcbiAgKiAgICAgICAgICAgICAgXCJYLWF2YXgxazRucjI2YzgwamFxdXptOTM2OWo1YTRzaG13Y2puMHZtZW1janpcIixcbiAgKiAgICAgICAgICAgICAgXCJYLWF2YXgxenRrenNyam5rbjBjZWs1cnl2aHFzd2R0Y2cyM25oZ2Uzbm5yNWVcIlxuICAqICAgICAgICAgIF0sXG4gICogICAgICAgICAgXCJ0aHJlc2hvbGRcIjogMlxuICAqICAgICAgfVxuICAqIF1cbiAgKiBgYGBcbiAgKiBcbiAgKiBAcmV0dXJucyBBbiB1bnNpZ25lZCB0cmFuc2FjdGlvbiAoW1tVbnNpZ25lZFR4XV0pIHdoaWNoIGNvbnRhaW5zIGEgW1tDcmVhdGVBc3NldFR4XV0uXG4gICogXG4gICovXG4gIGJ1aWxkQ3JlYXRlTkZUQXNzZXRUeCA9IGFzeW5jIChcbiAgICB1dHhvc2V0OlVUWE9TZXQsIFxuICAgIGZyb21BZGRyZXNzZXM6QXJyYXk8c3RyaW5nPixcbiAgICBjaGFuZ2VBZGRyZXNzZXM6QXJyYXk8c3RyaW5nPixcbiAgICBtaW50ZXJTZXRzOk1pbnRlclNldFtdLCBcbiAgICBuYW1lOnN0cmluZywgXG4gICAgc3ltYm9sOnN0cmluZywgXG4gICAgbWVtbzpQYXlsb2FkQmFzZXxCdWZmZXIgPSB1bmRlZmluZWQsIGFzT2Y6Qk4gPSBVbml4Tm93KCksIGxvY2t0aW1lOkJOID0gbmV3IEJOKDApXG4gICk6IFByb21pc2U8VW5zaWduZWRUeD4gPT4ge1xuICAgIGxldCBmcm9tOkFycmF5PEJ1ZmZlcj4gPSB0aGlzLl9jbGVhbkFkZHJlc3NBcnJheShmcm9tQWRkcmVzc2VzLCBcImJ1aWxkQ3JlYXRlTkZUQXNzZXRUeFwiKS5tYXAoYSA9PiBiaW50b29scy5zdHJpbmdUb0FkZHJlc3MoYSkpO1xuICAgIGxldCBjaGFuZ2U6QXJyYXk8QnVmZmVyPiA9IHRoaXMuX2NsZWFuQWRkcmVzc0FycmF5KGNoYW5nZUFkZHJlc3NlcywgXCJidWlsZENyZWF0ZU5GVEFzc2V0VHhcIikubWFwKGEgPT4gYmludG9vbHMuc3RyaW5nVG9BZGRyZXNzKGEpKTtcbiAgICBcbiAgICBpZiggbWVtbyBpbnN0YW5jZW9mIFBheWxvYWRCYXNlKSB7XG4gICAgICBtZW1vID0gbWVtby5nZXRQYXlsb2FkKCk7XG4gICAgfVxuXG4gICAgaWYobmFtZS5sZW5ndGggPiBBVk1Db25zdGFudHMuQVNTRVROQU1FTEVOKSB7XG4gICAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJFcnJvciAtIEFWTUFQSS5idWlsZENyZWF0ZU5GVEFzc2V0VHg6IE5hbWVzIG1heSBub3QgZXhjZWVkIGxlbmd0aCBvZiBcIiArIEFWTUNvbnN0YW50cy5BU1NFVE5BTUVMRU4pO1xuICAgIH1cbiAgICBpZihzeW1ib2wubGVuZ3RoID4gQVZNQ29uc3RhbnRzLlNZTUJPTE1BWExFTil7XG4gICAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJFcnJvciAtIEFWTUFQSS5idWlsZENyZWF0ZU5GVEFzc2V0VHg6IFN5bWJvbHMgbWF5IG5vdCBleGNlZWQgbGVuZ3RoIG9mIFwiICsgQVZNQ29uc3RhbnRzLlNZTUJPTE1BWExFTik7XG4gICAgfVxuICAgIGxldCBhdmF4QXNzZXRJRDpCdWZmZXIgPSBhd2FpdCB0aGlzLmdldEFWQVhBc3NldElEKCk7XG4gICAgY29uc3QgYnVpbHRVbnNpZ25lZFR4OlVuc2lnbmVkVHggPSB1dHhvc2V0LmJ1aWxkQ3JlYXRlTkZUQXNzZXRUeChcbiAgICAgICAgdGhpcy5jb3JlLmdldE5ldHdvcmtJRCgpLCBcbiAgICAgICAgYmludG9vbHMuY2I1OERlY29kZSh0aGlzLmJsb2NrY2hhaW5JRCksXG4gICAgICAgIGZyb20sXG4gICAgICAgIGNoYW5nZSxcbiAgICAgICAgbWludGVyU2V0cyxcbiAgICAgICAgbmFtZSwgXG4gICAgICAgIHN5bWJvbCxcbiAgICAgICAgdGhpcy5nZXRDcmVhdGlvblR4RmVlKCksIFxuICAgICAgICBhdmF4QXNzZXRJRCxcbiAgICAgICAgbWVtbywgYXNPZiwgbG9ja3RpbWVcbiAgICApO1xuICAgIGlmKCEgYXdhaXQgdGhpcy5jaGVja0dvb3NlRWdnKGJ1aWx0VW5zaWduZWRUeCwgdGhpcy5nZXRDcmVhdGlvblR4RmVlKCkpKSB7XG4gICAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiRmFpbGVkIEdvb3NlIEVnZyBDaGVja1wiKTtcbiAgICB9XG4gICAgcmV0dXJuIGJ1aWx0VW5zaWduZWRUeDtcbiAgfVxuXG4gIC8qKlxuICAqIENyZWF0ZXMgYW4gdW5zaWduZWQgdHJhbnNhY3Rpb24uIEZvciBtb3JlIGdyYW51bGFyIGNvbnRyb2wsIHlvdSBtYXkgY3JlYXRlIHlvdXIgb3duXG4gICogW1tVbnNpZ25lZFR4XV0gbWFudWFsbHkgKHdpdGggdGhlaXIgY29ycmVzcG9uZGluZyBbW1RyYW5zZmVyYWJsZUlucHV0XV1zLCBbW1RyYW5zZmVyYWJsZU91dHB1dF1dcywgYW5kIFtbVHJhbnNmZXJPcGVyYXRpb25dXXMpLlxuICAqIFxuICAqIEBwYXJhbSB1dHhvc2V0ICBBIHNldCBvZiBVVFhPcyB0aGF0IHRoZSB0cmFuc2FjdGlvbiBpcyBidWlsdCBvblxuICAqIEBwYXJhbSBvd25lcnMgRWl0aGVyIGEgc2luZ2xlIG9yIGFuIGFycmF5IG9mIFtbT3V0cHV0T3duZXJzXV0gdG8gc2VuZCB0aGUgbmZ0IG91dHB1dFxuICAqIEBwYXJhbSBmcm9tQWRkcmVzc2VzIFRoZSBhZGRyZXNzZXMgYmVpbmcgdXNlZCB0byBzZW5kIHRoZSBORlQgZnJvbSB0aGUgdXR4b0lEIHByb3ZpZGVkXG4gICogQHBhcmFtIGNoYW5nZUFkZHJlc3NlcyBUaGUgYWRkcmVzc2VzIHRoYXQgY2FuIHNwZW5kIHRoZSBjaGFuZ2UgcmVtYWluaW5nIGZyb20gdGhlIHNwZW50IFVUWE9zXG4gICogQHBhcmFtIHV0eG9pZCBBIGJhc2U1OCB1dHhvSUQgb3IgYW4gYXJyYXkgb2YgYmFzZTU4IHV0eG9JRHMgZm9yIHRoZSBuZnQgbWludCBvdXRwdXQgdGhpcyB0cmFuc2FjdGlvbiBpcyBzZW5kaW5nXG4gICogQHBhcmFtIGdyb3VwSUQgT3B0aW9uYWwuIFRoZSBncm91cCB0aGlzIE5GVCBpcyBpc3N1ZWQgdG8uXG4gICogQHBhcmFtIHBheWxvYWQgT3B0aW9uYWwuIERhdGEgZm9yIE5GVCBQYXlsb2FkIGFzIGVpdGhlciBhIFtbUGF5bG9hZEJhc2VdXSBvciBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9XG4gICogQHBhcmFtIG1lbW8gT3B0aW9uYWwgQ0I1OCBCdWZmZXIgb3IgU3RyaW5nIHdoaWNoIGNvbnRhaW5zIGFyYml0cmFyeSBieXRlcywgdXAgdG8gMjU2IGJ5dGVzXG4gICogQHBhcmFtIGFzT2YgT3B0aW9uYWwuIFRoZSB0aW1lc3RhbXAgdG8gdmVyaWZ5IHRoZSB0cmFuc2FjdGlvbiBhZ2FpbnN0IGFzIGEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9pbmR1dG55L2JuLmpzL3xCTn1cbiAgKiBcbiAgKiBAcmV0dXJucyBBbiB1bnNpZ25lZCB0cmFuc2FjdGlvbiAoW1tVbnNpZ25lZFR4XV0pIHdoaWNoIGNvbnRhaW5zIGFuIFtbT3BlcmF0aW9uVHhdXS5cbiAgKiBcbiAgKi9cbiAgYnVpbGRDcmVhdGVORlRNaW50VHggPSBhc3luYyAoXG4gICAgdXR4b3NldDpVVFhPU2V0LCAgXG4gICAgb3duZXJzOkFycmF5PE91dHB1dE93bmVycz58T3V0cHV0T3duZXJzLCBcbiAgICBmcm9tQWRkcmVzc2VzOkFycmF5PHN0cmluZz4sXG4gICAgY2hhbmdlQWRkcmVzc2VzOkFycmF5PHN0cmluZz4sXG4gICAgdXR4b2lkOnN0cmluZ3xBcnJheTxzdHJpbmc+LFxuICAgIGdyb3VwSUQ6bnVtYmVyID0gMCwgXG4gICAgcGF5bG9hZDpQYXlsb2FkQmFzZXxCdWZmZXIgPSB1bmRlZmluZWQsIFxuICAgIG1lbW86UGF5bG9hZEJhc2V8QnVmZmVyID0gdW5kZWZpbmVkLCBhc09mOkJOID0gVW5peE5vdygpXG4gICk6IFByb21pc2U8YW55PiA9PiB7XG4gICAgbGV0IGZyb206QXJyYXk8QnVmZmVyPiA9IHRoaXMuX2NsZWFuQWRkcmVzc0FycmF5KGZyb21BZGRyZXNzZXMsIFwiYnVpbGRDcmVhdGVORlRNaW50VHhcIikubWFwKGEgPT4gYmludG9vbHMuc3RyaW5nVG9BZGRyZXNzKGEpKTtcbiAgICBsZXQgY2hhbmdlOkFycmF5PEJ1ZmZlcj4gPSB0aGlzLl9jbGVhbkFkZHJlc3NBcnJheShjaGFuZ2VBZGRyZXNzZXMsIFwiYnVpbGRDcmVhdGVORlRNaW50VHhcIikubWFwKGEgPT4gYmludG9vbHMuc3RyaW5nVG9BZGRyZXNzKGEpKTtcbiAgICBcbiAgICBpZiggbWVtbyBpbnN0YW5jZW9mIFBheWxvYWRCYXNlKSB7XG4gICAgICBtZW1vID0gbWVtby5nZXRQYXlsb2FkKCk7XG4gICAgfVxuXG4gICAgaWYocGF5bG9hZCBpbnN0YW5jZW9mIFBheWxvYWRCYXNlKXtcbiAgICAgIHBheWxvYWQgPSBwYXlsb2FkLmdldFBheWxvYWQoKTtcbiAgICB9XG5cbiAgICBpZih0eXBlb2YgdXR4b2lkID09PSAnc3RyaW5nJykge1xuICAgICAgICB1dHhvaWQgPSBbdXR4b2lkXTtcbiAgICB9XG5cbiAgICBsZXQgYXZheEFzc2V0SUQ6QnVmZmVyID0gYXdhaXQgdGhpcy5nZXRBVkFYQXNzZXRJRCgpO1xuXG4gICAgaWYob3duZXJzIGluc3RhbmNlb2YgT3V0cHV0T3duZXJzKSB7XG4gICAgICBvd25lcnMgPSBbb3duZXJzXTtcbiAgICB9XG5cbiAgICBjb25zdCBidWlsdFVuc2lnbmVkVHg6VW5zaWduZWRUeCA9IHV0eG9zZXQuYnVpbGRDcmVhdGVORlRNaW50VHgoXG4gICAgICAgIHRoaXMuY29yZS5nZXROZXR3b3JrSUQoKSxcbiAgICAgICAgYmludG9vbHMuY2I1OERlY29kZSh0aGlzLmJsb2NrY2hhaW5JRCksXG4gICAgICAgIG93bmVycyxcbiAgICAgICAgZnJvbSxcbiAgICAgICAgY2hhbmdlLFxuICAgICAgICB1dHhvaWQsXG4gICAgICAgIGdyb3VwSUQsXG4gICAgICAgIHBheWxvYWQsXG4gICAgICAgIHRoaXMuZ2V0VHhGZWUoKSxcbiAgICAgICAgYXZheEFzc2V0SUQsXG4gICAgICAgIG1lbW8sIGFzT2ZcbiAgICApO1xuICAgIGlmKCEgYXdhaXQgdGhpcy5jaGVja0dvb3NlRWdnKGJ1aWx0VW5zaWduZWRUeCkpIHtcbiAgICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJGYWlsZWQgR29vc2UgRWdnIENoZWNrXCIpO1xuICAgIH1cbiAgICByZXR1cm4gYnVpbHRVbnNpZ25lZFR4O1xuICB9XG5cbiAgLyoqXG4gICAqIEhlbHBlciBmdW5jdGlvbiB3aGljaCB0YWtlcyBhbiB1bnNpZ25lZCB0cmFuc2FjdGlvbiBhbmQgc2lnbnMgaXQsIHJldHVybmluZyB0aGUgcmVzdWx0aW5nIFtbVHhdXS5cbiAgKlxuICAqIEBwYXJhbSB1dHggVGhlIHVuc2lnbmVkIHRyYW5zYWN0aW9uIG9mIHR5cGUgW1tVbnNpZ25lZFR4XV1cbiAgKlxuICAqIEByZXR1cm5zIEEgc2lnbmVkIHRyYW5zYWN0aW9uIG9mIHR5cGUgW1tUeF1dXG4gICovXG4gIHNpZ25UeCA9ICh1dHg6VW5zaWduZWRUeCk6VHggPT4gdXR4LnNpZ24odGhpcy5rZXljaGFpbik7XG5cbiAgLyoqXG4gICAqIENhbGxzIHRoZSBub2RlJ3MgaXNzdWVUeCBtZXRob2QgZnJvbSB0aGUgQVBJIGFuZCByZXR1cm5zIHRoZSByZXN1bHRpbmcgdHJhbnNhY3Rpb24gSUQgYXMgYSBzdHJpbmcuXG4gICAqXG4gICAqIEBwYXJhbSB0eCBBIHN0cmluZywge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0sIG9yIFtbVHhdXSByZXByZXNlbnRpbmcgYSB0cmFuc2FjdGlvblxuICAgKlxuICAgKiBAcmV0dXJucyBBIFByb21pc2U8c3RyaW5nPiByZXByZXNlbnRpbmcgdGhlIHRyYW5zYWN0aW9uIElEIG9mIHRoZSBwb3N0ZWQgdHJhbnNhY3Rpb24uXG4gICAqL1xuICBpc3N1ZVR4ID0gYXN5bmMgKHR4OnN0cmluZyB8IEJ1ZmZlciB8IFR4KTpQcm9taXNlPHN0cmluZz4gPT4ge1xuICAgIGxldCBUcmFuc2FjdGlvbiA9ICcnO1xuICAgIGlmICh0eXBlb2YgdHggPT09ICdzdHJpbmcnKSB7XG4gICAgICBUcmFuc2FjdGlvbiA9IHR4O1xuICAgIH0gZWxzZSBpZiAodHggaW5zdGFuY2VvZiBCdWZmZXIpIHtcbiAgICAgIGNvbnN0IHR4b2JqOlR4ID0gbmV3IFR4KCk7XG4gICAgICB0eG9iai5mcm9tQnVmZmVyKHR4KTtcbiAgICAgIFRyYW5zYWN0aW9uID0gdHhvYmoudG9TdHJpbmcoKTtcbiAgICB9IGVsc2UgaWYgKHR4IGluc3RhbmNlb2YgVHgpIHtcbiAgICAgIFRyYW5zYWN0aW9uID0gdHgudG9TdHJpbmcoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cbiAgICAgIHRocm93IG5ldyBFcnJvcignRXJyb3IgLSBhdm0uaXNzdWVUeDogcHJvdmlkZWQgdHggaXMgbm90IGV4cGVjdGVkIHR5cGUgb2Ygc3RyaW5nLCBCdWZmZXIsIG9yIFR4Jyk7XG4gICAgfVxuICAgIGNvbnN0IHBhcmFtczphbnkgPSB7XG4gICAgICB0eDogVHJhbnNhY3Rpb24udG9TdHJpbmcoKSxcbiAgICB9O1xuICAgIHJldHVybiB0aGlzLmNhbGxNZXRob2QoJ2F2bS5pc3N1ZVR4JywgcGFyYW1zKS50aGVuKChyZXNwb25zZTpSZXF1ZXN0UmVzcG9uc2VEYXRhKSA9PiByZXNwb25zZS5kYXRhLnJlc3VsdC50eElEKTtcbiAgfTtcblxuICAvKipcbiAgICogU2VuZHMgYW4gYW1vdW50IG9mIGFzc2V0SUQgdG8gdGhlIHNwZWNpZmllZCBhZGRyZXNzIGZyb20gYSBsaXN0IG9mIG93bmVkIG9mIGFkZHJlc3Nlcy5cbiAgICpcbiAgICogQHBhcmFtIHVzZXJuYW1lIFRoZSB1c2VyIHRoYXQgb3ducyB0aGUgcHJpdmF0ZSBrZXlzIGFzc29jaWF0ZWQgd2l0aCB0aGUgYGZyb21gIGFkZHJlc3Nlc1xuICAgKiBAcGFyYW0gcGFzc3dvcmQgVGhlIHBhc3N3b3JkIHVubG9ja2luZyB0aGUgdXNlclxuICAgKiBAcGFyYW0gYXNzZXRJRCBUaGUgYXNzZXRJRCBvZiB0aGUgYXNzZXQgdG8gc2VuZFxuICAgKiBAcGFyYW0gYW1vdW50IFRoZSBhbW91bnQgb2YgdGhlIGFzc2V0IHRvIGJlIHNlbnRcbiAgICogQHBhcmFtIHRvIFRoZSBhZGRyZXNzIG9mIHRoZSByZWNpcGllbnRcbiAgICogQHBhcmFtIGZyb20gT3B0aW9uYWwuIEFuIGFycmF5IG9mIGFkZHJlc3NlcyBtYW5hZ2VkIGJ5IHRoZSBub2RlJ3Mga2V5c3RvcmUgZm9yIHRoaXMgYmxvY2tjaGFpbiB3aGljaCB3aWxsIGZ1bmQgdGhpcyB0cmFuc2FjdGlvblxuICAgKiBAcGFyYW0gY2hhbmdlQWRkciBPcHRpb25hbC4gQW4gYWRkcmVzcyB0byBzZW5kIHRoZSBjaGFuZ2VcbiAgICogQHBhcmFtIG1lbW8gT3B0aW9uYWwuIENCNTggQnVmZmVyIG9yIFN0cmluZyB3aGljaCBjb250YWlucyBhcmJpdHJhcnkgYnl0ZXMsIHVwIHRvIDI1NiBieXRlc1xuICAgKlxuICAgKiBAcmV0dXJucyBQcm9taXNlIGZvciB0aGUgc3RyaW5nIHJlcHJlc2VudGluZyB0aGUgdHJhbnNhY3Rpb24ncyBJRC5cbiAgICovXG4gIHNlbmQgPSBhc3luYyAodXNlcm5hbWU6c3RyaW5nLCBwYXNzd29yZDpzdHJpbmcsIGFzc2V0SUQ6c3RyaW5nIHwgQnVmZmVyLCBhbW91bnQ6bnVtYmVyIHwgQk4sIHRvOnN0cmluZywgZnJvbTpBcnJheTxzdHJpbmc+IHwgQXJyYXk8QnVmZmVyPiA9IHVuZGVmaW5lZCwgY2hhbmdlQWRkcjpzdHJpbmcgPSB1bmRlZmluZWQsIG1lbW86c3RyaW5nIHwgQnVmZmVyID0gdW5kZWZpbmVkKTpQcm9taXNlPHt0eElEOiBzdHJpbmcsIGNoYW5nZUFkZHI6IHN0cmluZ30+ID0+IHtcbiAgICBsZXQgYXNzZXQ6c3RyaW5nO1xuICAgIGxldCBhbW50OkJOO1xuXG4gICAgaWYgKHR5cGVvZiB0aGlzLnBhcnNlQWRkcmVzcyh0bykgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiRXJyb3IgLSBBVk1BUEkuc2VuZDogSW52YWxpZCBhZGRyZXNzIGZvcm1hdFwiKTtcbiAgICB9XG5cbiAgICBpZiAodHlwZW9mIGFzc2V0SUQgIT09ICdzdHJpbmcnKSB7XG4gICAgICBhc3NldCA9IGJpbnRvb2xzLmNiNThFbmNvZGUoYXNzZXRJRCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGFzc2V0ID0gYXNzZXRJRDtcbiAgICB9XG4gICAgaWYgKHR5cGVvZiBhbW91bnQgPT09ICdudW1iZXInKSB7XG4gICAgICBhbW50ID0gbmV3IEJOKGFtb3VudCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGFtbnQgPSBhbW91bnQ7XG4gICAgfVxuXG4gICAgY29uc3QgcGFyYW1zOmFueSA9IHtcbiAgICAgIHVzZXJuYW1lOiB1c2VybmFtZSxcbiAgICAgIHBhc3N3b3JkOiBwYXNzd29yZCxcbiAgICAgIGFzc2V0SUQ6IGFzc2V0LFxuICAgICAgYW1vdW50OiBhbW50LnRvU3RyaW5nKDEwKSxcbiAgICAgIHRvOiB0b1xuICAgIH07XG5cbiAgICBmcm9tID0gdGhpcy5fY2xlYW5BZGRyZXNzQXJyYXkoZnJvbSwgJ3NlbmQnKTtcbiAgICBpZih0eXBlb2YgZnJvbSAhPT0gXCJ1bmRlZmluZWRcIil7XG4gICAgICBwYXJhbXNbXCJmcm9tXCJdID0gZnJvbTtcbiAgICB9XG5cbiAgICBpZiAodHlwZW9mIGNoYW5nZUFkZHIgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICBpZih0eXBlb2YgdGhpcy5wYXJzZUFkZHJlc3MoY2hhbmdlQWRkcikgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIkVycm9yIC0gQVZNQVBJLnNlbmQ6IEludmFsaWQgYWRkcmVzcyBmb3JtYXRcIik7XG4gICAgICB9XG4gICAgICBwYXJhbXNbXCJjaGFuZ2VBZGRyXCJdID0gY2hhbmdlQWRkcjtcbiAgICB9IFxuXG4gICAgaWYodHlwZW9mIG1lbW8gIT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgIGlmKHR5cGVvZiBtZW1vICE9PSAnc3RyaW5nJykge1xuICAgICAgICBwYXJhbXNbXCJtZW1vXCJdID0gYmludG9vbHMuY2I1OEVuY29kZShtZW1vKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHBhcmFtc1tcIm1lbW9cIl0gPSBtZW1vO1xuICAgICAgfVxuICAgIH1cbiAgICBcbiAgICByZXR1cm4gdGhpcy5jYWxsTWV0aG9kKCdhdm0uc2VuZCcsIHBhcmFtcykudGhlbigocmVzcG9uc2U6UmVxdWVzdFJlc3BvbnNlRGF0YSkgPT4gcmVzcG9uc2UuZGF0YS5yZXN1bHQpO1xuICB9O1xuXG4gIC8qKlxuICAgKiBTZW5kcyBhbiBhbW91bnQgb2YgYXNzZXRJRCB0byBhbiBhcnJheSBvZiBzcGVjaWZpZWQgYWRkcmVzc2VzIGZyb20gYSBsaXN0IG9mIG93bmVkIG9mIGFkZHJlc3Nlcy5cbiAgICpcbiAgICogQHBhcmFtIHVzZXJuYW1lIFRoZSB1c2VyIHRoYXQgb3ducyB0aGUgcHJpdmF0ZSBrZXlzIGFzc29jaWF0ZWQgd2l0aCB0aGUgYGZyb21gIGFkZHJlc3Nlc1xuICAgKiBAcGFyYW0gcGFzc3dvcmQgVGhlIHBhc3N3b3JkIHVubG9ja2luZyB0aGUgdXNlclxuICAgKiBAcGFyYW0gc2VuZE91dHB1dHMgVGhlIGFycmF5IG9mIFNlbmRPdXRwdXRzLiBBIFNlbmRPdXRwdXQgaXMgYW4gb2JqZWN0IGxpdGVyYWwgd2hpY2ggY29udGFpbnMgYW4gYXNzZXRJRCwgYW1vdW50LCBhbmQgdG8uXG4gICAqIEBwYXJhbSBmcm9tIE9wdGlvbmFsLiBBbiBhcnJheSBvZiBhZGRyZXNzZXMgbWFuYWdlZCBieSB0aGUgbm9kZSdzIGtleXN0b3JlIGZvciB0aGlzIGJsb2NrY2hhaW4gd2hpY2ggd2lsbCBmdW5kIHRoaXMgdHJhbnNhY3Rpb25cbiAgICogQHBhcmFtIGNoYW5nZUFkZHIgT3B0aW9uYWwuIEFuIGFkZHJlc3MgdG8gc2VuZCB0aGUgY2hhbmdlXG4gICAqIEBwYXJhbSBtZW1vIE9wdGlvbmFsLiBDQjU4IEJ1ZmZlciBvciBTdHJpbmcgd2hpY2ggY29udGFpbnMgYXJiaXRyYXJ5IGJ5dGVzLCB1cCB0byAyNTYgYnl0ZXNcbiAgICpcbiAgICogQHJldHVybnMgUHJvbWlzZSBmb3IgdGhlIHN0cmluZyByZXByZXNlbnRpbmcgdGhlIHRyYW5zYWN0aW9uJ3MgSUQuXG4gICAqL1xuICBzZW5kTXVsdGlwbGUgPSBhc3luYyAodXNlcm5hbWU6c3RyaW5nLCBwYXNzd29yZDpzdHJpbmcsIFxuICAgICAgc2VuZE91dHB1dHM6QXJyYXk8e2Fzc2V0SUQ6c3RyaW5nIHwgQnVmZmVyLCBhbW91bnQ6bnVtYmVyIHwgQk4sIHRvOnN0cmluZ30+LCBcbiAgICAgIGZyb206QXJyYXk8c3RyaW5nPiB8IEFycmF5PEJ1ZmZlcj4gPSB1bmRlZmluZWQsIFxuICAgICAgY2hhbmdlQWRkcjpzdHJpbmcgPSB1bmRlZmluZWQsIFxuICAgICAgbWVtbzpzdHJpbmcgfCBCdWZmZXIgPSB1bmRlZmluZWRcbiAgICApOlByb21pc2U8e3R4SUQ6IHN0cmluZywgY2hhbmdlQWRkcjogc3RyaW5nfT4gPT4ge1xuICAgIGxldCBhc3NldDpzdHJpbmc7XG4gICAgbGV0IGFtbnQ6Qk47XG4gICAgbGV0IHNPdXRwdXRzOkFycmF5PHthc3NldElEOnN0cmluZywgYW1vdW50OnN0cmluZywgdG86c3RyaW5nfT4gPSBbXTtcblxuICAgIHNlbmRPdXRwdXRzLmZvckVhY2goKG91dHB1dCkgPT4ge1xuICAgICAgaWYgKHR5cGVvZiB0aGlzLnBhcnNlQWRkcmVzcyhvdXRwdXQudG8pID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJFcnJvciAtIEFWTUFQSS5zZW5kTXVsdGlwbGU6IEludmFsaWQgYWRkcmVzcyBmb3JtYXRcIik7XG4gICAgICB9XG4gICAgICBpZiAodHlwZW9mIG91dHB1dC5hc3NldElEICE9PSAnc3RyaW5nJykge1xuICAgICAgICBhc3NldCA9IGJpbnRvb2xzLmNiNThFbmNvZGUob3V0cHV0LmFzc2V0SUQpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgYXNzZXQgPSBvdXRwdXQuYXNzZXRJRDtcbiAgICAgIH1cbiAgICAgIGlmICh0eXBlb2Ygb3V0cHV0LmFtb3VudCA9PT0gJ251bWJlcicpIHtcbiAgICAgICAgYW1udCA9IG5ldyBCTihvdXRwdXQuYW1vdW50KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGFtbnQgPSBvdXRwdXQuYW1vdW50O1xuICAgICAgfVxuICAgICAgc091dHB1dHMucHVzaCh7dG86IG91dHB1dC50bywgYXNzZXRJRDogYXNzZXQsIGFtb3VudDogYW1udC50b1N0cmluZygxMCl9KVxuICAgIH0pO1xuXG4gICAgY29uc3QgcGFyYW1zOmFueSA9IHtcbiAgICAgIHVzZXJuYW1lOiB1c2VybmFtZSxcbiAgICAgIHBhc3N3b3JkOiBwYXNzd29yZCxcbiAgICAgIG91dHB1dHM6IHNPdXRwdXRzLFxuICAgIH07XG5cbiAgICBmcm9tID0gdGhpcy5fY2xlYW5BZGRyZXNzQXJyYXkoZnJvbSwgJ3NlbmQnKTtcbiAgICBpZih0eXBlb2YgZnJvbSAhPT0gXCJ1bmRlZmluZWRcIil7XG4gICAgICBwYXJhbXNbXCJmcm9tXCJdID0gZnJvbTtcbiAgICB9XG5cbiAgICBpZiAodHlwZW9mIGNoYW5nZUFkZHIgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICBpZih0eXBlb2YgdGhpcy5wYXJzZUFkZHJlc3MoY2hhbmdlQWRkcikgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIkVycm9yIC0gQVZNQVBJLnNlbmQ6IEludmFsaWQgYWRkcmVzcyBmb3JtYXRcIik7XG4gICAgICB9XG4gICAgICBwYXJhbXNbXCJjaGFuZ2VBZGRyXCJdID0gY2hhbmdlQWRkcjtcbiAgICB9IFxuXG4gICAgaWYodHlwZW9mIG1lbW8gIT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgIGlmKHR5cGVvZiBtZW1vICE9PSAnc3RyaW5nJykge1xuICAgICAgICBwYXJhbXNbXCJtZW1vXCJdID0gYmludG9vbHMuY2I1OEVuY29kZShtZW1vKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHBhcmFtc1tcIm1lbW9cIl0gPSBtZW1vO1xuICAgICAgfVxuICAgIH1cbiAgICBcbiAgICByZXR1cm4gdGhpcy5jYWxsTWV0aG9kKCdhdm0uc2VuZE11bHRpcGxlJywgcGFyYW1zKS50aGVuKChyZXNwb25zZTpSZXF1ZXN0UmVzcG9uc2VEYXRhKSA9PiByZXNwb25zZS5kYXRhLnJlc3VsdCk7XG4gIH07XG5cbiAgLyoqXG4gICAqIEdpdmVuIGEgSlNPTiByZXByZXNlbnRhdGlvbiBvZiB0aGlzIFZpcnR1YWwgTWFjaGluZeKAmXMgZ2VuZXNpcyBzdGF0ZSwgY3JlYXRlIHRoZSBieXRlIHJlcHJlc2VudGF0aW9uIG9mIHRoYXQgc3RhdGUuXG4gICAqXG4gICAqIEBwYXJhbSBnZW5lc2lzRGF0YSBUaGUgYmxvY2tjaGFpbidzIGdlbmVzaXMgZGF0YSBvYmplY3RcbiAgICpcbiAgICogQHJldHVybnMgUHJvbWlzZSBvZiBhIHN0cmluZyBvZiBieXRlc1xuICAgKi9cbiAgYnVpbGRHZW5lc2lzID0gYXN5bmMgKGdlbmVzaXNEYXRhOm9iamVjdCk6UHJvbWlzZTxzdHJpbmc+ID0+IHtcbiAgICBjb25zdCBwYXJhbXM6YW55ID0ge1xuICAgICAgZ2VuZXNpc0RhdGEsXG4gICAgfTtcbiAgICByZXR1cm4gdGhpcy5jYWxsTWV0aG9kKCdhdm0uYnVpbGRHZW5lc2lzJywgcGFyYW1zKS50aGVuKChyZXNwb25zZTpSZXF1ZXN0UmVzcG9uc2VEYXRhKSA9PiB7XG4gICAgICBjb25zdCByID0gcmVzcG9uc2UuZGF0YS5yZXN1bHQuYnl0ZXM7XG4gICAgICByZXR1cm4gcjtcbiAgICB9KTtcbiAgfTtcblxuICAvKipcbiAgICogQGlnbm9yZVxuICAgKi9cbiAgcHJvdGVjdGVkIF9jbGVhbkFkZHJlc3NBcnJheShhZGRyZXNzZXM6QXJyYXk8c3RyaW5nPiB8IEFycmF5PEJ1ZmZlcj4sIGNhbGxlcjpzdHJpbmcpOkFycmF5PHN0cmluZz4ge1xuICAgIGNvbnN0IGFkZHJzOkFycmF5PHN0cmluZz4gPSBbXTtcbiAgICBjb25zdCBjaGFpbmlkOnN0cmluZyA9IHRoaXMuZ2V0QmxvY2tjaGFpbkFsaWFzKCkgPyB0aGlzLmdldEJsb2NrY2hhaW5BbGlhcygpIDogdGhpcy5nZXRCbG9ja2NoYWluSUQoKTtcbiAgICBpZiAoYWRkcmVzc2VzICYmIGFkZHJlc3Nlcy5sZW5ndGggPiAwKSB7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGFkZHJlc3Nlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICBpZiAodHlwZW9mIGFkZHJlc3Nlc1tpXSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICBpZiAodHlwZW9mIHRoaXMucGFyc2VBZGRyZXNzKGFkZHJlc3Nlc1tpXSBhcyBzdHJpbmcpID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIkVycm9yIC0gQVZNQVBJLiR7Y2FsbGVyfTogSW52YWxpZCBhZGRyZXNzIGZvcm1hdFwiKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgYWRkcnMucHVzaChhZGRyZXNzZXNbaV0gYXMgc3RyaW5nKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBhZGRycy5wdXNoKGJpbnRvb2xzLmFkZHJlc3NUb1N0cmluZyh0aGlzLmNvcmUuZ2V0SFJQKCksIGNoYWluaWQsIGFkZHJlc3Nlc1tpXSBhcyBCdWZmZXIpKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gYWRkcnM7XG4gIH1cblxuICAvKipcbiAgICogVGhpcyBjbGFzcyBzaG91bGQgbm90IGJlIGluc3RhbnRpYXRlZCBkaXJlY3RseS4gSW5zdGVhZCB1c2UgdGhlIFtbQXZhbGFuY2hlLmFkZEFQSV1dIG1ldGhvZC5cbiAgICpcbiAgICogQHBhcmFtIGNvcmUgQSByZWZlcmVuY2UgdG8gdGhlIEF2YWxhbmNoZSBjbGFzc1xuICAgKiBAcGFyYW0gYmFzZXVybCBEZWZhdWx0cyB0byB0aGUgc3RyaW5nIFwiL2V4dC9iYy9YXCIgYXMgdGhlIHBhdGggdG8gYmxvY2tjaGFpbidzIGJhc2V1cmxcbiAgICogQHBhcmFtIGJsb2NrY2hhaW5JRCBUaGUgQmxvY2tjaGFpbidzIElELiBEZWZhdWx0cyB0byBhbiBlbXB0eSBzdHJpbmc6ICcnXG4gICAqL1xuICBjb25zdHJ1Y3Rvcihjb3JlOkF2YWxhbmNoZUNvcmUsIGJhc2V1cmw6c3RyaW5nID0gJy9leHQvYmMvWCcsIGJsb2NrY2hhaW5JRDpzdHJpbmcgPSAnJykge1xuICAgIHN1cGVyKGNvcmUsIGJhc2V1cmwpO1xuICAgIHRoaXMuYmxvY2tjaGFpbklEID0gYmxvY2tjaGFpbklEO1xuICAgIGNvbnN0IG5ldGlkOm51bWJlciA9IGNvcmUuZ2V0TmV0d29ya0lEKCk7XG4gICAgaWYgKG5ldGlkIGluIERlZmF1bHRzLm5ldHdvcmsgJiYgYmxvY2tjaGFpbklEIGluIERlZmF1bHRzLm5ldHdvcmtbbmV0aWRdKSB7XG4gICAgICBjb25zdCB7IGFsaWFzIH0gPSBEZWZhdWx0cy5uZXR3b3JrW25ldGlkXVtibG9ja2NoYWluSURdO1xuICAgICAgdGhpcy5rZXljaGFpbiA9IG5ldyBLZXlDaGFpbih0aGlzLmNvcmUuZ2V0SFJQKCksIGFsaWFzKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5rZXljaGFpbiA9IG5ldyBLZXlDaGFpbih0aGlzLmNvcmUuZ2V0SFJQKCksIGJsb2NrY2hhaW5JRCk7XG4gICAgfVxuICB9XG59XG4iXX0=