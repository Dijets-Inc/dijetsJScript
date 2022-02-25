"use strict";
/**
 * @packageDocumentation
 * @module API-EVM
 */
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
exports.EVMAPI = void 0;
const buffer_1 = require("buffer/");
const bn_js_1 = __importDefault(require("bn.js"));
const jrpcapi_1 = require("../../common/jrpcapi");
const bintools_1 = __importDefault(require("../../utils/bintools"));
const utxos_1 = require("./utxos");
const keychain_1 = require("./keychain");
const constants_1 = require("../../utils/constants");
const tx_1 = require("./tx");
const constants_2 = require("./constants");
const inputs_1 = require("./inputs");
const outputs_1 = require("./outputs");
const exporttx_1 = require("./exporttx");
/**
 * @ignore
 */
const bintools = bintools_1.default.getInstance();
/**
 * Class for interacting with a node's EVMAPI
 *
 * @category RPCAPIs
 *
 * @remarks This extends the [[JRPCAPI]] class. This class should not be directly called. Instead, use the [[Dijets.addAPI]] function to register this interface with Dijets.
 */
class EVMAPI extends jrpcapi_1.JRPCAPI {
    /**
     * This class should not be instantiated directly.
     * Instead use the [[Dijets.addAPI]] method.
     *
     * @param core A reference to the Dijets class
     * @param baseurl Defaults to the string "/ext/bc/C/djtx" as the path to blockchain's baseurl
     * @param blockchainID The Blockchain's ID. Defaults to an empty string: ''
     */
    constructor(core, baseurl = '/ext/bc/C/djtx', blockchainID = '') {
        super(core, baseurl);
        /**
         * @ignore
         */
        this.keychain = new keychain_1.KeyChain('', '');
        this.blockchainID = '';
        this.blockchainAlias = undefined;
        this.DJTXAssetID = undefined;
        this.txFee = undefined;
        /**
         * Gets the alias for the blockchainID if it exists, otherwise returns `undefined`.
         *
         * @returns The alias for the blockchainID
         */
        this.getBlockchainAlias = () => {
            if (typeof this.blockchainAlias === "undefined") {
                const netID = this.core.getNetworkID();
                if (netID in constants_1.Defaults.network && this.blockchainID in constants_1.Defaults.network[netID]) {
                    this.blockchainAlias = constants_1.Defaults.network[netID][this.blockchainID].alias;
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
         * @returns A boolean if the blockchainID was successfully refreshed.
         */
        this.refreshBlockchainID = (blockchainID = undefined) => {
            const netID = this.core.getNetworkID();
            if (typeof blockchainID === 'undefined' && typeof constants_1.Defaults.network[netID] !== "undefined") {
                this.blockchainID = constants_1.Defaults.network[netID].C.blockchainID; //default to C-Chain
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
            return bintools.parseAddress(addr, blockchainID, alias, constants_2.EVMConstants.ADDRESSLENGTH);
        };
        this.addressFromBuffer = (address) => {
            const chainID = this.getBlockchainAlias() ? this.getBlockchainAlias() : this.getBlockchainID();
            return bintools.addressToString(this.core.getHRP(), chainID, address);
        };
        /**
           * Retrieves an assets name and symbol.
           *
           * @param assetID Either a {@link https://github.com/feross/buffer|Buffer} or an b58 serialized string for the AssetID or its alias.
           *
           * @returns Returns a Promise<Asset> with keys "name", "symbol", "assetID" and "denomination".
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
            const tmpBaseURL = this.getBaseURL();
            // set base url to get asset description
            this.setBaseURL("/ext/bc/X");
            const response = yield this.callMethod('avm.getAssetDescription', params);
            // set base url back what it originally was
            this.setBaseURL(tmpBaseURL);
            return {
                name: response.data.result.name,
                symbol: response.data.result.symbol,
                assetID: bintools.cb58Decode(response.data.result.assetID),
                denomination: parseInt(response.data.result.denomination, 10),
            };
        });
        /**
         * Fetches the DJTX AssetID and returns it in a Promise.
         *
         * @param refresh This function caches the response. Refresh = true will bust the cache.
         *
         * @returns The the provided string representing the DJTX AssetID
         */
        this.getDJTXAssetID = (refresh = false) => __awaiter(this, void 0, void 0, function* () {
            if (typeof this.DJTXAssetID === 'undefined' || refresh) {
                const asset = yield this.getAssetDescription(constants_1.PrimaryAssetAlias);
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
            return this.core.getNetworkID() in constants_1.Defaults.network ? new bn_js_1.default(constants_1.Defaults.network[this.core.getNetworkID()]["C"]["txFee"]) : new bn_js_1.default(0);
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
         * Send ANT (Dijets Native Token) assets including DJTX from the C-Chain to an account on the X-Chain.
          *
          * After calling this method, you must call the X-Chain’s import method to complete the transfer.
          *
          * @param username The Keystore user that controls the X-Chain account specified in `to`
          * @param password The password of the Keystore user
          * @param to The account on the X-Chain to send the DJTX to.
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
            return this.callMethod('djtx.export', params).then((response) => response.data.result.txID);
        });
        /**
         * Send DJTX from the C-Chain to an account on the X-Chain.
          *
          * After calling this method, you must call the X-Chain’s importDJTX method to complete the transfer.
          *
          * @param username The Keystore user that controls the X-Chain account specified in `to`
          * @param password The password of the Keystore user
          * @param to The account on the X-Chain to send the DJTX to.
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
            return this.callMethod('djtx.exportDJTX', params).then((response) => response.data.result.txID);
        });
        /**
         * Retrieves the UTXOs related to the addresses provided from the node's `getUTXOs` method.
         *
         * @param addresses An array of addresses as cb58 strings or addresses as {@link https://github.com/feross/buffer|Buffer}s
         * @param sourceChain A string for the chain to look for the UTXO's. Default is to use this chain, but if exported UTXOs exist
         * from other chains, this can used to pull them instead.
         * @param limit Optional. Returns at most [limit] addresses. If [limit] == 0 or > [maxUTXOsToFetch], fetches up to [maxUTXOsToFetch].
         * @param startIndex Optional. [StartIndex] defines where to start fetching UTXOs (for pagination.)
         * UTXOs fetched are from addresses equal to or greater than [StartIndex.Address]
         * For address [StartIndex.Address], only UTXOs with IDs greater than [StartIndex.Utxo] will be returned.
         */
        this.getUTXOs = (addresses, sourceChain = undefined, limit = 0, startIndex = undefined) => __awaiter(this, void 0, void 0, function* () {
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
            return this.callMethod('djtx.getUTXOs', params).then((response) => {
                const utxos = new utxos_1.UTXOSet();
                let data = response.data.result.utxos;
                utxos.addArray(data, false);
                response.data.result.utxos = utxos;
                return response.data.result;
            });
        });
        /**
         * Send ANT (Dijets Native Token) assets including DJTX from an account on the X-Chain to an address on the C-Chain. This transaction
         * must be signed with the key of the account that the asset is sent from and which pays
         * the transaction fee.
         *
         * @param username The Keystore user that controls the account specified in `to`
         * @param password The password of the Keystore user
         * @param to The address of the account the asset is sent to.
         * @param sourceChain The chainID where the funds are coming from. Ex: "X"
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
            return this.callMethod('djtx.import', params)
                .then((response) => response.data.result.txID);
        });
        /**
         * Send DJTX from an account on the X-Chain to an address on the C-Chain. This transaction
         * must be signed with the key of the account that the DJTX is sent from and which pays
         * the transaction fee.
         *
         * @param username The Keystore user that controls the account specified in `to`
         * @param password The password of the Keystore user
         * @param to The address of the account the DJTX is sent to. This must be the same as the to
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
            return this.callMethod('djtx.importDJTX', params)
                .then((response) => response.data.result.txID);
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
            return this.callMethod('djtx.importKey', params).then((response) => response.data.result.address);
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
                throw new Error('Error - djtx.issueTx: provided tx is not expected type of string, Buffer, or Tx');
            }
            const params = {
                tx: Transaction.toString(),
            };
            return this.callMethod('djtx.issueTx', params).then((response) => response.data.result.txID);
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
            return this.callMethod('djtx.exportKey', params).then((response) => response.data.result.privateKey);
        });
        /**
         * Helper function which creates an unsigned Import Tx. For more granular control, you may create your own
         * [[UnsignedTx]] manually (with their corresponding [[TransferableInput]]s, [[TransferableOutput]]s).
         *
         * @param utxoset A set of UTXOs that the transaction is built on
         * @param toAddress The address to send the funds
         * @param ownerAddresses The addresses being used to import
         * @param sourceChain The chainid for where the import is coming from
         * @param fromAddresses The addresses being used to send the funds from the UTXOs provided
         *
         * @returns An unsigned transaction ([[UnsignedTx]]) which contains a [[ImportTx]].
         *
         * @remarks
         * This helper exists because the endpoint API should be the primary point of entry for most functionality.
         */
        this.buildImportTx = (utxoset, toAddress, ownerAddresses, sourceChain, fromAddresses) => __awaiter(this, void 0, void 0, function* () {
            const from = this._cleanAddressArray(fromAddresses, 'buildImportTx').map((a) => bintools.stringToAddress(a));
            let srcChain = undefined;
            if (typeof sourceChain === "string") {
                // if there is a sourceChain passed in and it's a string then save the string value and cast the original
                // variable from a string to a Buffer
                srcChain = sourceChain;
                sourceChain = bintools.cb58Decode(sourceChain);
            }
            else if (typeof sourceChain === "undefined" || !(sourceChain instanceof buffer_1.Buffer)) {
                // if there is no sourceChain passed in or the sourceChain is any data type other than a Buffer then throw an error
                throw new Error('Error - EVMAPI.buildImportTx: sourceChain is undefined or invalid sourceChain type.');
            }
            const utxoResponse = yield this.getUTXOs(ownerAddresses, srcChain, 0, undefined);
            const atomicUTXOs = utxoResponse.utxos;
            const djtxAssetID = yield this.getDJTXAssetID();
            const atomics = atomicUTXOs.getAllUTXOs();
            if (atomics.length === 0) {
                throw new Error("Error - EVMAPI.buildImportTx: no atomic utxos to import");
            }
            const builtUnsignedTx = utxoset.buildImportTx(this.core.getNetworkID(), bintools.cb58Decode(this.blockchainID), [toAddress], from, atomics, sourceChain, this.getTxFee(), djtxAssetID);
            return builtUnsignedTx;
        });
        /**
         * Helper function which creates an unsigned Export Tx. For more granular control, you may create your own
         * [[UnsignedTx]] manually (with their corresponding [[TransferableInput]]s, [[TransferableOutput]]s).
         *
         * @param amount The amount being exported as a {@link https://github.com/indutny/bn.js/|BN}
         * @param assetID The asset id which is being sent
         * @param destinationChain The chainid for where the assets will be sent.
         * @param toAddresses The addresses to send the funds
         * @param fromAddresses The addresses being used to send the funds from the UTXOs provided
         * @param changeAddresses The addresses that can spend the change remaining from the spent UTXOs
         * @param asOf Optional. The timestamp to verify the transaction against as a {@link https://github.com/indutny/bn.js/|BN}
         * @param locktime Optional. The locktime field created in the resulting outputs
         * @param threshold Optional. The number of signatures required to spend the funds in the resultant UTXO
         *
         * @returns An unsigned transaction ([[UnsignedTx]]) which contains an [[ExportTx]].
         */
        this.buildExportTx = (amount, assetID, destinationChain, fromAddressHex, fromAddressBech, toAddresses, nonce = 0, locktime = new bn_js_1.default(0), threshold = 1) => __awaiter(this, void 0, void 0, function* () {
            let prefixes = {};
            toAddresses.map((address) => {
                prefixes[address.split("-")[0]] = true;
            });
            if (Object.keys(prefixes).length !== 1) {
                throw new Error("Error - EVMAPI.buildExportTx: To addresses must have the same chainID prefix.");
            }
            if (typeof destinationChain === "undefined") {
                throw new Error("Error - EVMAPI.buildExportTx: Destination ChainID is undefined.");
            }
            else if (typeof destinationChain === "string") {
                destinationChain = bintools.cb58Decode(destinationChain);
            }
            else if (!(destinationChain instanceof buffer_1.Buffer)) {
                throw new Error("Error - EVMAPI.buildExportTx: Invalid destinationChain type");
            }
            if (destinationChain.length !== 32) {
                throw new Error("Error - EVMAPI.buildExportTx: Destination ChainID must be 32 bytes in length.");
            }
            const fee = this.getTxFee();
            const assetDescription = yield this.getAssetDescription("DJTX");
            const evmInputs = [];
            if (bintools.cb58Encode(assetDescription.assetID) === assetID) {
                const evmInput = new inputs_1.EVMInput(fromAddressHex, amount.add(fee), assetID, nonce);
                evmInput.addSignatureIdx(0, bintools.stringToAddress(fromAddressBech));
                evmInputs.push(evmInput);
            }
            else {
                // if asset id isn't DJTX asset id then create 2 inputs
                // first input will be DJTX and will be for the amount of the fee
                // second input will be the ANT
                const evmDJTXInput = new inputs_1.EVMInput(fromAddressHex, fee, assetDescription.assetID, nonce);
                evmDJTXInput.addSignatureIdx(0, bintools.stringToAddress(fromAddressBech));
                evmInputs.push(evmDJTXInput);
                const evmANTInput = new inputs_1.EVMInput(fromAddressHex, amount, assetID, nonce);
                evmANTInput.addSignatureIdx(0, bintools.stringToAddress(fromAddressBech));
                evmInputs.push(evmANTInput);
            }
            const to = [];
            toAddresses.map((address) => {
                to.push(bintools.stringToAddress(address));
            });
            let exportedOuts = [];
            const secpTransferOutput = new outputs_1.SECPTransferOutput(amount, to, locktime, threshold);
            const transferableOutput = new outputs_1.TransferableOutput(bintools.cb58Decode(assetID), secpTransferOutput);
            exportedOuts.push(transferableOutput);
            // lexicographically sort array
            exportedOuts = exportedOuts.sort(outputs_1.TransferableOutput.comparator());
            const exportTx = new exporttx_1.ExportTx(this.core.getNetworkID(), bintools.cb58Decode(this.blockchainID), destinationChain, evmInputs, exportedOuts);
            const unsignedTx = new tx_1.UnsignedTx(exportTx);
            return unsignedTx;
        });
        /**
         * Gets a reference to the keychain for this class.
         *
         * @returns The instance of [[KeyChain]] for this class
         */
        this.keyChain = () => this.keychain;
        this.blockchainID = blockchainID;
        const netID = core.getNetworkID();
        if (netID in constants_1.Defaults.network && blockchainID in constants_1.Defaults.network[netID]) {
            const { alias } = constants_1.Defaults.network[netID][blockchainID];
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
            addresses.forEach((address) => {
                if (typeof address === 'string') {
                    if (typeof this.parseAddress(address) === 'undefined') {
                        /* istanbul ignore next */
                        throw new Error("Error - Invalid address format");
                    }
                    addrs.push(address);
                }
                else {
                    addrs.push(bintools.addressToString(this.core.getHRP(), chainid, address));
                }
            });
        }
        return addrs;
    }
}
exports.EVMAPI = EVMAPI;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBpLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vc3JjL2FwaXMvZXZtL2FwaS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7OztHQUdHOzs7Ozs7Ozs7Ozs7Ozs7QUFFSCxvQ0FBaUM7QUFDakMsa0RBQXVCO0FBRXZCLGtEQUErQztBQUUvQyxvRUFBNEM7QUFDNUMsbUNBR2lCO0FBQ2pCLHlDQUFzQztBQUN0QyxxREFHK0I7QUFDL0IsNkJBQXNDO0FBQ3RDLDJDQUEyQztBQU0zQyxxQ0FBb0M7QUFDcEMsdUNBR21CO0FBQ25CLHlDQUFzQztBQUV0Qzs7R0FFRztBQUNILE1BQU0sUUFBUSxHQUFhLGtCQUFRLENBQUMsV0FBVyxFQUFFLENBQUM7QUFFbEQ7Ozs7OztHQU1HO0FBQ0gsTUFBYSxNQUFPLFNBQVEsaUJBQU87SUE2bUJqQzs7Ozs7OztPQU9HO0lBQ0gsWUFBWSxJQUFtQixFQUFFLFVBQWtCLGdCQUFnQixFQUFFLGVBQXVCLEVBQUU7UUFDNUYsS0FBSyxDQUFDLElBQUksRUFBRSxPQUFPLENBQUMsQ0FBQztRQXJuQnZCOztXQUVHO1FBQ08sYUFBUSxHQUFhLElBQUksbUJBQVEsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUM7UUFFMUMsaUJBQVksR0FBVyxFQUFFLENBQUM7UUFFMUIsb0JBQWUsR0FBVyxTQUFTLENBQUM7UUFFcEMsZ0JBQVcsR0FBVSxTQUFTLENBQUM7UUFFL0IsVUFBSyxHQUFNLFNBQVMsQ0FBQztRQUUvQjs7OztXQUlHO1FBQ0gsdUJBQWtCLEdBQUcsR0FBVyxFQUFFO1lBQ2hDLElBQUcsT0FBTyxJQUFJLENBQUMsZUFBZSxLQUFLLFdBQVcsRUFBQztnQkFDN0MsTUFBTSxLQUFLLEdBQVcsSUFBSSxDQUFDLElBQUksQ0FBQyxZQUFZLEVBQUUsQ0FBQztnQkFDL0MsSUFBSSxLQUFLLElBQUksb0JBQVEsQ0FBQyxPQUFPLElBQUksSUFBSSxDQUFDLFlBQVksSUFBSSxvQkFBUSxDQUFD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WSxDQUFDLENBQUM7U0FDaEU7SUFDSCxDQUFDO0lBeENEOztPQUVHO0lBQ08sa0JBQWtCLENBQUMsU0FBOEIsRUFBRSxNQUFjO1FBQ3pFLE1BQU0sS0FBSyxHQUFhLEVBQUUsQ0FBQztRQUMzQixNQUFNLE9BQU8sR0FBVyxJQUFJLENBQUMsa0JBQWtCLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLGtCQUFrQixFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxlQUFlLEVBQUUsQ0FBQztRQUN2RyxJQUFJLFNBQVMsSUFBSSxTQUFTLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRTtZQUNyQyxTQUFTLENBQUMsT0FBTyxDQUFDLENBQUMsT0FBd0IsRUFBRSxFQUFFO2dCQUM3QyxJQUFJLE9BQU8sT0FBTyxLQUFLLFFBQVEsRUFBRTtvQkFDL0IsSUFBSSxPQUFPLElBQUksQ0FBQyxZQUFZLENBQUMsT0FBaUIsQ0FBQyxLQUFLLFdBQVcsRUFBRTt3QkFDL0QsMEJBQTBCO3dCQUMxQixNQUFNLElBQUksS0FBSyxDQUFDLGdDQUFnQyxDQUFDLENBQUM7cUJBQ25EO29CQUNELEtBQUssQ0FBQyxJQUFJLENBQUMsT0FBaUIsQ0FBQyxDQUFDO2lCQUMvQjtxQkFBTTtvQkFDTCxLQUFLLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxlQUFlLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsRUFBRSxPQUFPLEVBQUUsT0FBaUIsQ0FBQyxDQUFDLENBQUM7aUJBQ3RGO1lBQ0gsQ0FBQyxDQUFDLENBQUM7U0FDSjtRQUNELE9BQU8sS0FBSyxDQUFDO0lBQ2YsQ0FBQztDQXFCRjtBQWhvQkQsd0JBZ29CQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQHBhY2thZ2VEb2N1bWVudGF0aW9uXG4gKiBAbW9kdWxlIEFQSS1FVk1cbiAqL1xuXG5pbXBvcnQgeyBCdWZmZXIgfSBmcm9tICdidWZmZXIvJztcbmltcG9ydCBCTiBmcm9tICdibi5qcyc7XG5pbXBvcnQgQXZhbGFuY2hlQ29yZSBmcm9tICcuLi8uLi9hdmFsYW5jaGUnO1xuaW1wb3J0IHsgSlJQQ0FQSSB9IGZyb20gJy4uLy4uL2NvbW1vbi9qcnBjYXBpJztcbmltcG9ydCB7IFJlcXVlc3RSZXNwb25zZURhdGEgfSBmcm9tICcuLi8uLi9jb21tb24vYXBpYmFzZSc7XG5pbXBvcnQgQmluVG9vbHMgZnJvbSAnLi4vLi4vdXRpbHMvYmludG9vbHMnO1xuaW1wb3J0IHsgXG4gIFVUWE9TZXQsXG4gIFVUWE8gXG59IGZyb20gJy4vdXR4b3MnO1xuaW1wb3J0IHsgS2V5Q2hhaW4gfSBmcm9tICcuL2tleWNoYWluJztcbmltcG9ydCB7IFxuICBEZWZhdWx0cywgXG4gIFByaW1hcnlBc3NldEFsaWFzIFxufSBmcm9tICcuLi8uLi91dGlscy9jb25zdGFudHMnO1xuaW1wb3J0IHsgVHgsIFVuc2lnbmVkVHggfSBmcm9tICcuL3R4JztcbmltcG9ydCB7IEVWTUNvbnN0YW50cyB9IGZyb20gJy4vY29uc3RhbnRzJztcbmltcG9ydCB7IFxuICBBc3NldCxcbiAgSW5kZXgsIFxuICBVVFhPUmVzcG9uc2UgXG59IGZyb20gJy4vLi4vLi4vY29tbW9uL2ludGVyZmFjZXMnXG5pbXBvcnQgeyBFVk1JbnB1dCB9IGZyb20gJy4vaW5wdXRzJztcbmltcG9ydCB7IFxuICBTRUNQVHJhbnNmZXJPdXRwdXQsIFxuICBUcmFuc2ZlcmFibGVPdXRwdXQgXG59IGZyb20gJy4vb3V0cHV0cyc7XG5pbXBvcnQgeyBFeHBvcnRUeCB9IGZyb20gJy4vZXhwb3J0dHgnO1xuXG4vKipcbiAqIEBpZ25vcmVcbiAqL1xuY29uc3QgYmludG9vbHM6IEJpblRvb2xzID0gQmluVG9vbHMuZ2V0SW5zdGFuY2UoKTtcblxuLyoqXG4gKiBDbGFzcyBmb3IgaW50ZXJhY3Rpbmcgd2l0aCBhIG5vZGUncyBFVk1BUEkgXG4gKlxuICogQGNhdGVnb3J5IFJQQ0FQSXNcbiAqXG4gKiBAcmVtYXJrcyBUaGlzIGV4dGVuZHMgdGhlIFtbSlJQQ0FQSV1dIGNsYXNzLiBUaGlzIGNsYXNzIHNob3VsZCBub3QgYmUgZGlyZWN0bHkgY2FsbGVkLiBJbnN0ZWFkLCB1c2UgdGhlIFtbQXZhbGFuY2hlLmFkZEFQSV1dIGZ1bmN0aW9uIHRvIHJlZ2lzdGVyIHRoaXMgaW50ZXJmYWNlIHdpdGggQXZhbGFuY2hlLlxuICovXG5leHBvcnQgY2xhc3MgRVZNQVBJIGV4dGVuZHMgSlJQQ0FQSSB7XG4gIC8qKlxuICAgKiBAaWdub3JlXG4gICAqL1xuICBwcm90ZWN0ZWQga2V5Y2hhaW46IEtleUNoYWluID0gbmV3IEtleUNoYWluKCcnLCAnJyk7XG5cbiAgcHJvdGVjdGVkIGJsb2NrY2hhaW5JRDogc3RyaW5nID0gJyc7XG5cbiAgcHJvdGVjdGVkIGJsb2NrY2hhaW5BbGlhczogc3RyaW5nID0gdW5kZWZpbmVkO1xuXG4gIHByb3RlY3RlZCBBVkFYQXNzZXRJRDpCdWZmZXIgPSB1bmRlZmluZWQ7XG5cbiAgcHJvdGVjdGVkIHR4RmVlOkJOID0gdW5kZWZpbmVkO1xuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBhbGlhcyBmb3IgdGhlIGJsb2NrY2hhaW5JRCBpZiBpdCBleGlzdHMsIG90aGVyd2lzZSByZXR1cm5zIGB1bmRlZmluZWRgLlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgYWxpYXMgZm9yIHRoZSBibG9ja2NoYWluSURcbiAgICovXG4gIGdldEJsb2NrY2hhaW5BbGlhcyA9ICgpOiBzdHJpbmcgPT4ge1xuICAgIGlmKHR5cGVvZiB0aGlzLmJsb2NrY2hhaW5BbGlhcyA9PT0gXCJ1bmRlZmluZWRcIil7XG4gICAgICBjb25zdCBuZXRJRDogbnVtYmVyID0gdGhpcy5jb3JlLmdldE5ldHdvcmtJRCgpO1xuICAgICAgaWYgKG5ldElEIGluIERlZmF1bHRzLm5ldHdvcmsgJiYgdGhpcy5ibG9ja2NoYWluSUQgaW4gRGVmYXVsdHMubmV0d29ya1tuZXRJRF0pIHtcbiAgICAgICAgdGhpcy5ibG9ja2NoYWluQWxpYXMgPSBEZWZhdWx0cy5uZXR3b3JrW25ldElEXVt0aGlzLmJsb2NrY2hhaW5JRF0uYWxpYXM7XG4gICAgICAgIHJldHVybiB0aGlzLmJsb2NrY2hhaW5BbGlhcztcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXG4gICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgICB9XG4gICAgfSBcbiAgICByZXR1cm4gdGhpcy5ibG9ja2NoYWluQWxpYXM7XG4gIH07XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIGFsaWFzIGZvciB0aGUgYmxvY2tjaGFpbklELlxuICAgKiBcbiAgICogQHBhcmFtIGFsaWFzIFRoZSBhbGlhcyBmb3IgdGhlIGJsb2NrY2hhaW5JRC5cbiAgICogXG4gICAqL1xuICBzZXRCbG9ja2NoYWluQWxpYXMgPSAoYWxpYXM6IHN0cmluZyk6IHN0cmluZyA9PiB7XG4gICAgdGhpcy5ibG9ja2NoYWluQWxpYXMgPSBhbGlhcztcbiAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xuICAgIHJldHVybiB1bmRlZmluZWQ7XG4gIH07XG5cblxuICAvKipcbiAgICogR2V0cyB0aGUgYmxvY2tjaGFpbklEIGFuZCByZXR1cm5zIGl0LlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgYmxvY2tjaGFpbklEXG4gICAqL1xuICBnZXRCbG9ja2NoYWluSUQgPSAoKTogc3RyaW5nID0+IHRoaXMuYmxvY2tjaGFpbklEO1xuXG4gIC8qKlxuICAgKiBSZWZyZXNoIGJsb2NrY2hhaW5JRCwgYW5kIGlmIGEgYmxvY2tjaGFpbklEIGlzIHBhc3NlZCBpbiwgdXNlIHRoYXQuXG4gICAqXG4gICAqIEBwYXJhbSBPcHRpb25hbC4gQmxvY2tjaGFpbklEIHRvIGFzc2lnbiwgaWYgbm9uZSwgdXNlcyB0aGUgZGVmYXVsdCBiYXNlZCBvbiBuZXR3b3JrSUQuXG4gICAqXG4gICAqIEByZXR1cm5zIEEgYm9vbGVhbiBpZiB0aGUgYmxvY2tjaGFpbklEIHdhcyBzdWNjZXNzZnVsbHkgcmVmcmVzaGVkLlxuICAgKi9cbiAgcmVmcmVzaEJsb2NrY2hhaW5JRCA9IChibG9ja2NoYWluSUQ6IHN0cmluZyA9IHVuZGVmaW5lZCk6IGJvb2xlYW4gPT4ge1xuICAgIGNvbnN0IG5ldElEOiBudW1iZXIgPSB0aGlzLmNvcmUuZ2V0TmV0d29ya0lEKCk7XG4gICAgaWYgKHR5cGVvZiBibG9ja2NoYWluSUQgPT09ICd1bmRlZmluZWQnICYmIHR5cGVvZiBEZWZhdWx0cy5uZXR3b3JrW25ldElEXSAhPT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgdGhpcy5ibG9ja2NoYWluSUQgPSBEZWZhdWx0cy5uZXR3b3JrW25ldElEXS5DLmJsb2NrY2hhaW5JRDsgLy9kZWZhdWx0IHRvIEMtQ2hhaW5cbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH0gXG4gICAgXG4gICAgaWYgKHR5cGVvZiBibG9ja2NoYWluSUQgPT09ICdzdHJpbmcnKSB7XG4gICAgICB0aGlzLmJsb2NrY2hhaW5JRCA9IGJsb2NrY2hhaW5JRDtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cblxuICAgIHJldHVybiBmYWxzZTtcbiAgfTtcblxuICAvKipcbiAgICogVGFrZXMgYW4gYWRkcmVzcyBzdHJpbmcgYW5kIHJldHVybnMgaXRzIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IHJlcHJlc2VudGF0aW9uIGlmIHZhbGlkLlxuICAgKlxuICAgKiBAcmV0dXJucyBBIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IGZvciB0aGUgYWRkcmVzcyBpZiB2YWxpZCwgdW5kZWZpbmVkIGlmIG5vdCB2YWxpZC5cbiAgICovXG4gIHBhcnNlQWRkcmVzcyA9IChhZGRyOiBzdHJpbmcpOiBCdWZmZXIgPT4ge1xuICAgIGNvbnN0IGFsaWFzOiBzdHJpbmcgPSB0aGlzLmdldEJsb2NrY2hhaW5BbGlhcygpO1xuICAgIGNvbnN0IGJsb2NrY2hhaW5JRDogc3RyaW5nID0gdGhpcy5nZXRCbG9ja2NoYWluSUQoKTtcbiAgICByZXR1cm4gYmludG9vbHMucGFyc2VBZGRyZXNzKGFkZHIsIGJsb2NrY2hhaW5JRCwgYWxpYXMsIEVWTUNvbnN0YW50cy5BRERSRVNTTEVOR1RIKTtcbiAgfTtcblxuICBhZGRyZXNzRnJvbUJ1ZmZlciA9IChhZGRyZXNzOiBCdWZmZXIpOiBzdHJpbmcgPT4ge1xuICAgIGNvbnN0IGNoYWluSUQ6IHN0cmluZyA9IHRoaXMuZ2V0QmxvY2tjaGFpbkFsaWFzKCkgPyB0aGlzLmdldEJsb2NrY2hhaW5BbGlhcygpIDogdGhpcy5nZXRCbG9ja2NoYWluSUQoKTtcbiAgICByZXR1cm4gYmludG9vbHMuYWRkcmVzc1RvU3RyaW5nKHRoaXMuY29yZS5nZXRIUlAoKSwgY2hhaW5JRCwgYWRkcmVzcyk7XG4gIH07XG5cbiAgLyoqXG4gICAgICogUmV0cmlldmVzIGFuIGFzc2V0cyBuYW1lIGFuZCBzeW1ib2wuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gYXNzZXRJRCBFaXRoZXIgYSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSBvciBhbiBiNTggc2VyaWFsaXplZCBzdHJpbmcgZm9yIHRoZSBBc3NldElEIG9yIGl0cyBhbGlhcy5cbiAgICAgKlxuICAgICAqIEByZXR1cm5zIFJldHVybnMgYSBQcm9taXNlPEFzc2V0PiB3aXRoIGtleXMgXCJuYW1lXCIsIFwic3ltYm9sXCIsIFwiYXNzZXRJRFwiIGFuZCBcImRlbm9taW5hdGlvblwiLlxuICAgICAqL1xuICBnZXRBc3NldERlc2NyaXB0aW9uID0gYXN5bmMgKGFzc2V0SUQ6IEJ1ZmZlciB8IHN0cmluZyk6IFByb21pc2U8YW55PiA9PiB7XG4gICAgbGV0IGFzc2V0OiBzdHJpbmc7XG4gICAgaWYgKHR5cGVvZiBhc3NldElEICE9PSAnc3RyaW5nJykge1xuICAgICAgYXNzZXQgPSBiaW50b29scy5jYjU4RW5jb2RlKGFzc2V0SUQpO1xuICAgIH0gZWxzZSB7XG4gICAgICBhc3NldCA9IGFzc2V0SUQ7XG4gICAgfVxuXG4gICAgY29uc3QgcGFyYW1zOiB7XG4gICAgICBhc3NldElEOiBCdWZmZXIgfCBzdHJpbmdcbiAgICB9ID0ge1xuICAgICAgYXNzZXRJRDogYXNzZXQsXG4gICAgfTtcblxuICAgIGNvbnN0IHRtcEJhc2VVUkw6IHN0cmluZyA9IHRoaXMuZ2V0QmFzZVVSTCgpO1xuXG4gICAgLy8gc2V0IGJhc2UgdXJsIHRvIGdldCBhc3NldCBkZXNjcmlwdGlvblxuICAgIHRoaXMuc2V0QmFzZVVSTChcIi9leHQvYmMvWFwiKTtcbiAgICBjb25zdCByZXNwb25zZTogUmVxdWVzdFJlc3BvbnNlRGF0YSA9IGF3YWl0IHRoaXMuY2FsbE1ldGhvZCgnYXZtLmdldEFzc2V0RGVzY3JpcHRpb24nLCBwYXJhbXMpO1xuXG4gICAgLy8gc2V0IGJhc2UgdXJsIGJhY2sgd2hhdCBpdCBvcmlnaW5hbGx5IHdhc1xuICAgIHRoaXMuc2V0QmFzZVVSTCh0bXBCYXNlVVJMKTtcbiAgICByZXR1cm4ge1xuICAgICAgbmFtZTogcmVzcG9uc2UuZGF0YS5yZXN1bHQubmFtZSxcbiAgICAgIHN5bWJvbDogcmVzcG9uc2UuZGF0YS5yZXN1bHQuc3ltYm9sLFxuICAgICAgYXNzZXRJRDogYmludG9vbHMuY2I1OERlY29kZShyZXNwb25zZS5kYXRhLnJlc3VsdC5hc3NldElEKSxcbiAgICAgIGRlbm9taW5hdGlvbjogcGFyc2VJbnQocmVzcG9uc2UuZGF0YS5yZXN1bHQuZGVub21pbmF0aW9uLCAxMCksXG4gICAgfVxuICB9O1xuICBcbiAgLyoqXG4gICAqIEZldGNoZXMgdGhlIEFWQVggQXNzZXRJRCBhbmQgcmV0dXJucyBpdCBpbiBhIFByb21pc2UuXG4gICAqXG4gICAqIEBwYXJhbSByZWZyZXNoIFRoaXMgZnVuY3Rpb24gY2FjaGVzIHRoZSByZXNwb25zZS4gUmVmcmVzaCA9IHRydWUgd2lsbCBidXN0IHRoZSBjYWNoZS5cbiAgICogXG4gICAqIEByZXR1cm5zIFRoZSB0aGUgcHJvdmlkZWQgc3RyaW5nIHJlcHJlc2VudGluZyB0aGUgQVZBWCBBc3NldElEXG4gICAqL1xuICBnZXRBVkFYQXNzZXRJRCA9IGFzeW5jIChyZWZyZXNoOiBib29sZWFuID0gZmFsc2UpOiBQcm9taXNlPEJ1ZmZlcj4gPT4ge1xuICAgIGlmICh0eXBlb2YgdGhpcy5BVkFYQXNzZXRJRCA9PT0gJ3VuZGVmaW5lZCcgfHwgcmVmcmVzaCkge1xuICAgICAgY29uc3QgYXNzZXQ6IEFzc2V0ID0gYXdhaXQgdGhpcy5nZXRBc3NldERlc2NyaXB0aW9uKFByaW1hcnlBc3NldEFsaWFzKTtcbiAgICAgIHRoaXMuQVZBWEFzc2V0SUQgPSBhc3NldC5hc3NldElEO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5BVkFYQXNzZXRJRDtcbiAgfTtcbiAgXG4gIC8qKlxuICAgKiBPdmVycmlkZXMgdGhlIGRlZmF1bHRzIGFuZCBzZXRzIHRoZSBjYWNoZSB0byBhIHNwZWNpZmljIEFWQVggQXNzZXRJRFxuICAgKiBcbiAgICogQHBhcmFtIGF2YXhBc3NldElEIEEgY2I1OCBzdHJpbmcgb3IgQnVmZmVyIHJlcHJlc2VudGluZyB0aGUgQVZBWCBBc3NldElEXG4gICAqIFxuICAgKiBAcmV0dXJucyBUaGUgdGhlIHByb3ZpZGVkIHN0cmluZyByZXByZXNlbnRpbmcgdGhlIEFWQVggQXNzZXRJRFxuICAgKi9cbiAgc2V0QVZBWEFzc2V0SUQgPSAoYXZheEFzc2V0SUQ6IHN0cmluZyB8IEJ1ZmZlcikgPT4ge1xuICAgIGlmKHR5cGVvZiBhdmF4QXNzZXRJRCA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgYXZheEFzc2V0SUQgPSBiaW50b29scy5jYjU4RGVjb2RlKGF2YXhBc3NldElEKTtcbiAgICB9XG4gICAgdGhpcy5BVkFYQXNzZXRJRCA9IGF2YXhBc3NldElEO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIGRlZmF1bHQgdHggZmVlIGZvciB0aGlzIGNoYWluLlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgZGVmYXVsdCB0eCBmZWUgYXMgYSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2luZHV0bnkvYm4uanMvfEJOfVxuICAgKi9cbiAgZ2V0RGVmYXVsdFR4RmVlID0gKCk6IEJOID0+IHtcbiAgICByZXR1cm4gdGhpcy5jb3JlLmdldE5ldHdvcmtJRCgpIGluIERlZmF1bHRzLm5ldHdvcmsgPyBuZXcgQk4oRGVmYXVsdHMubmV0d29ya1t0aGlzLmNvcmUuZ2V0TmV0d29ya0lEKCldW1wiQ1wiXVtcInR4RmVlXCJdKSA6IG5ldyBCTigwKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSB0eCBmZWUgZm9yIHRoaXMgY2hhaW4uXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSB0eCBmZWUgYXMgYSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2luZHV0bnkvYm4uanMvfEJOfVxuICAgKi9cbiAgZ2V0VHhGZWUgPSAoKTogQk4gPT4ge1xuICAgIGlmKHR5cGVvZiB0aGlzLnR4RmVlID09PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICB0aGlzLnR4RmVlID0gdGhpcy5nZXREZWZhdWx0VHhGZWUoKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMudHhGZWU7XG4gIH1cblxuICAvKipcbiAgICogU2VuZCBBTlQgKEF2YWxhbmNoZSBOYXRpdmUgVG9rZW4pIGFzc2V0cyBpbmNsdWRpbmcgQVZBWCBmcm9tIHRoZSBDLUNoYWluIHRvIGFuIGFjY291bnQgb24gdGhlIFgtQ2hhaW4uXG4gICAgKlxuICAgICogQWZ0ZXIgY2FsbGluZyB0aGlzIG1ldGhvZCwgeW91IG11c3QgY2FsbCB0aGUgWC1DaGFpbuKAmXMgaW1wb3J0IG1ldGhvZCB0byBjb21wbGV0ZSB0aGUgdHJhbnNmZXIuXG4gICAgKlxuICAgICogQHBhcmFtIHVzZXJuYW1lIFRoZSBLZXlzdG9yZSB1c2VyIHRoYXQgY29udHJvbHMgdGhlIFgtQ2hhaW4gYWNjb3VudCBzcGVjaWZpZWQgaW4gYHRvYFxuICAgICogQHBhcmFtIHBhc3N3b3JkIFRoZSBwYXNzd29yZCBvZiB0aGUgS2V5c3RvcmUgdXNlclxuICAgICogQHBhcmFtIHRvIFRoZSBhY2NvdW50IG9uIHRoZSBYLUNoYWluIHRvIHNlbmQgdGhlIEFWQVggdG8uIFxuICAgICogQHBhcmFtIGFtb3VudCBBbW91bnQgb2YgYXNzZXQgdG8gZXhwb3J0IGFzIGEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9pbmR1dG55L2JuLmpzL3xCTn1cbiAgICAqIEBwYXJhbSBhc3NldElEIFRoZSBhc3NldCBpZCB3aGljaCBpcyBiZWluZyBzZW50XG4gICAgKlxuICAgICogQHJldHVybnMgU3RyaW5nIHJlcHJlc2VudGluZyB0aGUgdHJhbnNhY3Rpb24gaWRcbiAgICAqL1xuICBleHBvcnQgPSBhc3luYyAoXG4gICAgdXNlcm5hbWU6IHN0cmluZywgXG4gICAgcGFzc3dvcmQ6IHN0cmluZywgXG4gICAgdG86IHN0cmluZywgXG4gICAgYW1vdW50OiBCTiwgXG4gICAgYXNzZXRJRDogc3RyaW5nXG4gICk6UHJvbWlzZTxzdHJpbmc+ID0+IHtcbiAgICBjb25zdCBwYXJhbXM6IHtcbiAgICAgIHVzZXJuYW1lOiBzdHJpbmcsIFxuICAgICAgcGFzc3dvcmQ6IHN0cmluZywgXG4gICAgICB0bzogc3RyaW5nLCBcbiAgICAgIGFtb3VudDogc3RyaW5nLCBcbiAgICAgIGFzc2V0SUQ6IHN0cmluZ1xuICAgIH0gPSB7XG4gICAgICB0byxcbiAgICAgIGFtb3VudDogYW1vdW50LnRvU3RyaW5nKDEwKSxcbiAgICAgIHVzZXJuYW1lLFxuICAgICAgcGFzc3dvcmQsXG4gICAgICBhc3NldElEXG4gICAgfTtcbiAgICByZXR1cm4gdGhpcy5jYWxsTWV0aG9kKCdhdmF4LmV4cG9ydCcsIHBhcmFtcykudGhlbigocmVzcG9uc2U6IFJlcXVlc3RSZXNwb25zZURhdGEpID0+IHJlc3BvbnNlLmRhdGEucmVzdWx0LnR4SUQpO1xuICB9O1xuXG4gIC8qKlxuICAgKiBTZW5kIEFWQVggZnJvbSB0aGUgQy1DaGFpbiB0byBhbiBhY2NvdW50IG9uIHRoZSBYLUNoYWluLlxuICAgICpcbiAgICAqIEFmdGVyIGNhbGxpbmcgdGhpcyBtZXRob2QsIHlvdSBtdXN0IGNhbGwgdGhlIFgtQ2hhaW7igJlzIGltcG9ydEFWQVggbWV0aG9kIHRvIGNvbXBsZXRlIHRoZSB0cmFuc2Zlci5cbiAgICAqXG4gICAgKiBAcGFyYW0gdXNlcm5hbWUgVGhlIEtleXN0b3JlIHVzZXIgdGhhdCBjb250cm9scyB0aGUgWC1DaGFpbiBhY2NvdW50IHNwZWNpZmllZCBpbiBgdG9gXG4gICAgKiBAcGFyYW0gcGFzc3dvcmQgVGhlIHBhc3N3b3JkIG9mIHRoZSBLZXlzdG9yZSB1c2VyXG4gICAgKiBAcGFyYW0gdG8gVGhlIGFjY291bnQgb24gdGhlIFgtQ2hhaW4gdG8gc2VuZCB0aGUgQVZBWCB0by5cbiAgICAqIEBwYXJhbSBhbW91bnQgQW1vdW50IG9mIEFWQVggdG8gZXhwb3J0IGFzIGEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9pbmR1dG55L2JuLmpzL3xCTn1cbiAgICAqXG4gICAgKiBAcmV0dXJucyBTdHJpbmcgcmVwcmVzZW50aW5nIHRoZSB0cmFuc2FjdGlvbiBpZFxuICAgICovXG4gIGV4cG9ydEFWQVggPSBhc3luYyAoXG4gICAgdXNlcm5hbWU6IHN0cmluZywgXG4gICAgcGFzc3dvcmQ6IHN0cmluZywgXG4gICAgdG86IHN0cmluZywgXG4gICAgYW1vdW50OiBCTlxuICApOiBQcm9taXNlPHN0cmluZz4gPT4ge1xuICAgIGNvbnN0IHBhcmFtczoge1xuICAgICAgdXNlcm5hbWU6IHN0cmluZywgXG4gICAgICBwYXNzd29yZDogc3RyaW5nLCBcbiAgICAgIHRvOiBzdHJpbmcsIFxuICAgICAgYW1vdW50OiBzdHJpbmdcbiAgICB9ID0ge1xuICAgICAgdG8sXG4gICAgICBhbW91bnQ6IGFtb3VudC50b1N0cmluZygxMCksXG4gICAgICB1c2VybmFtZSxcbiAgICAgIHBhc3N3b3JkLFxuICAgIH07XG4gICAgcmV0dXJuIHRoaXMuY2FsbE1ldGhvZCgnYXZheC5leHBvcnRBVkFYJywgcGFyYW1zKS50aGVuKChyZXNwb25zZTogUmVxdWVzdFJlc3BvbnNlRGF0YSkgPT4gcmVzcG9uc2UuZGF0YS5yZXN1bHQudHhJRCk7XG4gIH07XG5cbiAgLyoqXG4gICAqIFJldHJpZXZlcyB0aGUgVVRYT3MgcmVsYXRlZCB0byB0aGUgYWRkcmVzc2VzIHByb3ZpZGVkIGZyb20gdGhlIG5vZGUncyBgZ2V0VVRYT3NgIG1ldGhvZC5cbiAgICpcbiAgICogQHBhcmFtIGFkZHJlc3NlcyBBbiBhcnJheSBvZiBhZGRyZXNzZXMgYXMgY2I1OCBzdHJpbmdzIG9yIGFkZHJlc3NlcyBhcyB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfXNcbiAgICogQHBhcmFtIHNvdXJjZUNoYWluIEEgc3RyaW5nIGZvciB0aGUgY2hhaW4gdG8gbG9vayBmb3IgdGhlIFVUWE8ncy4gRGVmYXVsdCBpcyB0byB1c2UgdGhpcyBjaGFpbiwgYnV0IGlmIGV4cG9ydGVkIFVUWE9zIGV4aXN0IFxuICAgKiBmcm9tIG90aGVyIGNoYWlucywgdGhpcyBjYW4gdXNlZCB0byBwdWxsIHRoZW0gaW5zdGVhZC5cbiAgICogQHBhcmFtIGxpbWl0IE9wdGlvbmFsLiBSZXR1cm5zIGF0IG1vc3QgW2xpbWl0XSBhZGRyZXNzZXMuIElmIFtsaW1pdF0gPT0gMCBvciA+IFttYXhVVFhPc1RvRmV0Y2hdLCBmZXRjaGVzIHVwIHRvIFttYXhVVFhPc1RvRmV0Y2hdLlxuICAgKiBAcGFyYW0gc3RhcnRJbmRleCBPcHRpb25hbC4gW1N0YXJ0SW5kZXhdIGRlZmluZXMgd2hlcmUgdG8gc3RhcnQgZmV0Y2hpbmcgVVRYT3MgKGZvciBwYWdpbmF0aW9uLilcbiAgICogVVRYT3MgZmV0Y2hlZCBhcmUgZnJvbSBhZGRyZXNzZXMgZXF1YWwgdG8gb3IgZ3JlYXRlciB0aGFuIFtTdGFydEluZGV4LkFkZHJlc3NdXG4gICAqIEZvciBhZGRyZXNzIFtTdGFydEluZGV4LkFkZHJlc3NdLCBvbmx5IFVUWE9zIHdpdGggSURzIGdyZWF0ZXIgdGhhbiBbU3RhcnRJbmRleC5VdHhvXSB3aWxsIGJlIHJldHVybmVkLlxuICAgKi9cbiAgZ2V0VVRYT3MgPSBhc3luYyAoXG4gICAgYWRkcmVzc2VzOiBzdHJpbmdbXSB8IHN0cmluZyxcbiAgICBzb3VyY2VDaGFpbjogc3RyaW5nID0gdW5kZWZpbmVkLFxuICAgIGxpbWl0OiBudW1iZXIgPSAwLFxuICAgIHN0YXJ0SW5kZXg6IEluZGV4ID0gdW5kZWZpbmVkXG4gICk6IFByb21pc2U8e1xuICAgIG51bUZldGNoZWQ6bnVtYmVyLFxuICAgIHV0eG9zLFxuICAgIGVuZEluZGV4OiBJbmRleFxuICB9PiA9PiB7XG4gICAgaWYodHlwZW9mIGFkZHJlc3NlcyA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgYWRkcmVzc2VzID0gW2FkZHJlc3Nlc107XG4gICAgfVxuXG4gICAgY29uc3QgcGFyYW1zOiBhbnkgPSB7XG4gICAgICBhZGRyZXNzZXM6IGFkZHJlc3NlcyxcbiAgICAgIGxpbWl0XG4gICAgfTtcbiAgICBpZih0eXBlb2Ygc3RhcnRJbmRleCAhPT0gXCJ1bmRlZmluZWRcIiAmJiBzdGFydEluZGV4KSB7XG4gICAgICBwYXJhbXMuc3RhcnRJbmRleCA9IHN0YXJ0SW5kZXg7XG4gICAgfVxuXG4gICAgaWYodHlwZW9mIHNvdXJjZUNoYWluICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICBwYXJhbXMuc291cmNlQ2hhaW4gPSBzb3VyY2VDaGFpbjtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy5jYWxsTWV0aG9kKCdhdmF4LmdldFVUWE9zJywgcGFyYW1zKS50aGVuKChyZXNwb25zZTogUmVxdWVzdFJlc3BvbnNlRGF0YSkgPT4ge1xuICAgICAgY29uc3QgdXR4b3M6IFVUWE9TZXQgPSBuZXcgVVRYT1NldCgpO1xuICAgICAgbGV0IGRhdGE6IGFueSA9IHJlc3BvbnNlLmRhdGEucmVzdWx0LnV0eG9zO1xuICAgICAgdXR4b3MuYWRkQXJyYXkoZGF0YSwgZmFsc2UpO1xuICAgICAgcmVzcG9uc2UuZGF0YS5yZXN1bHQudXR4b3MgPSB1dHhvcztcbiAgICAgIHJldHVybiByZXNwb25zZS5kYXRhLnJlc3VsdDtcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZW5kIEFOVCAoQXZhbGFuY2hlIE5hdGl2ZSBUb2tlbikgYXNzZXRzIGluY2x1ZGluZyBBVkFYIGZyb20gYW4gYWNjb3VudCBvbiB0aGUgWC1DaGFpbiB0byBhbiBhZGRyZXNzIG9uIHRoZSBDLUNoYWluLiBUaGlzIHRyYW5zYWN0aW9uXG4gICAqIG11c3QgYmUgc2lnbmVkIHdpdGggdGhlIGtleSBvZiB0aGUgYWNjb3VudCB0aGF0IHRoZSBhc3NldCBpcyBzZW50IGZyb20gYW5kIHdoaWNoIHBheXNcbiAgICogdGhlIHRyYW5zYWN0aW9uIGZlZS5cbiAgICpcbiAgICogQHBhcmFtIHVzZXJuYW1lIFRoZSBLZXlzdG9yZSB1c2VyIHRoYXQgY29udHJvbHMgdGhlIGFjY291bnQgc3BlY2lmaWVkIGluIGB0b2BcbiAgICogQHBhcmFtIHBhc3N3b3JkIFRoZSBwYXNzd29yZCBvZiB0aGUgS2V5c3RvcmUgdXNlclxuICAgKiBAcGFyYW0gdG8gVGhlIGFkZHJlc3Mgb2YgdGhlIGFjY291bnQgdGhlIGFzc2V0IGlzIHNlbnQgdG8uIFxuICAgKiBAcGFyYW0gc291cmNlQ2hhaW4gVGhlIGNoYWluSUQgd2hlcmUgdGhlIGZ1bmRzIGFyZSBjb21pbmcgZnJvbS4gRXg6IFwiWFwiXG4gICAqXG4gICAqIEByZXR1cm5zIFByb21pc2UgZm9yIGEgc3RyaW5nIGZvciB0aGUgdHJhbnNhY3Rpb24sIHdoaWNoIHNob3VsZCBiZSBzZW50IHRvIHRoZSBuZXR3b3JrXG4gICAqIGJ5IGNhbGxpbmcgaXNzdWVUeC5cbiAgICovXG4gIGltcG9ydCA9IGFzeW5jIChcbiAgICB1c2VybmFtZTogc3RyaW5nLCBcbiAgICBwYXNzd29yZDogc3RyaW5nLCBcbiAgICB0bzogc3RyaW5nLCBcbiAgICBzb3VyY2VDaGFpbjogc3RyaW5nXG4gIClcbiAgOiBQcm9taXNlPHN0cmluZz4gPT4ge1xuICAgIGNvbnN0IHBhcmFtczoge1xuICAgICAgdXNlcm5hbWU6IHN0cmluZywgXG4gICAgICBwYXNzd29yZDogc3RyaW5nLCBcbiAgICAgIHRvOiBzdHJpbmcsIFxuICAgICAgc291cmNlQ2hhaW46IHN0cmluZ1xuICAgIH0gPSB7XG4gICAgICB0byxcbiAgICAgIHNvdXJjZUNoYWluLFxuICAgICAgdXNlcm5hbWUsXG4gICAgICBwYXNzd29yZCxcbiAgICB9O1xuICAgIHJldHVybiB0aGlzLmNhbGxNZXRob2QoJ2F2YXguaW1wb3J0JywgcGFyYW1zKVxuICAgICAgLnRoZW4oKHJlc3BvbnNlOiBSZXF1ZXN0UmVzcG9uc2VEYXRhKSA9PiByZXNwb25zZS5kYXRhLnJlc3VsdC50eElEKTtcbiAgfTtcblxuICAvKipcbiAgICogU2VuZCBBVkFYIGZyb20gYW4gYWNjb3VudCBvbiB0aGUgWC1DaGFpbiB0byBhbiBhZGRyZXNzIG9uIHRoZSBDLUNoYWluLiBUaGlzIHRyYW5zYWN0aW9uXG4gICAqIG11c3QgYmUgc2lnbmVkIHdpdGggdGhlIGtleSBvZiB0aGUgYWNjb3VudCB0aGF0IHRoZSBBVkFYIGlzIHNlbnQgZnJvbSBhbmQgd2hpY2ggcGF5c1xuICAgKiB0aGUgdHJhbnNhY3Rpb24gZmVlLlxuICAgKlxuICAgKiBAcGFyYW0gdXNlcm5hbWUgVGhlIEtleXN0b3JlIHVzZXIgdGhhdCBjb250cm9scyB0aGUgYWNjb3VudCBzcGVjaWZpZWQgaW4gYHRvYFxuICAgKiBAcGFyYW0gcGFzc3dvcmQgVGhlIHBhc3N3b3JkIG9mIHRoZSBLZXlzdG9yZSB1c2VyXG4gICAqIEBwYXJhbSB0byBUaGUgYWRkcmVzcyBvZiB0aGUgYWNjb3VudCB0aGUgQVZBWCBpcyBzZW50IHRvLiBUaGlzIG11c3QgYmUgdGhlIHNhbWUgYXMgdGhlIHRvXG4gICAqIGFyZ3VtZW50IGluIHRoZSBjb3JyZXNwb25kaW5nIGNhbGwgdG8gdGhlIFgtQ2hhaW7igJlzIGV4cG9ydEFWQVhcbiAgICogQHBhcmFtIHNvdXJjZUNoYWluIFRoZSBjaGFpbklEIHdoZXJlIHRoZSBmdW5kcyBhcmUgY29taW5nIGZyb20uXG4gICAqXG4gICAqIEByZXR1cm5zIFByb21pc2UgZm9yIGEgc3RyaW5nIGZvciB0aGUgdHJhbnNhY3Rpb24sIHdoaWNoIHNob3VsZCBiZSBzZW50IHRvIHRoZSBuZXR3b3JrXG4gICAqIGJ5IGNhbGxpbmcgaXNzdWVUeC5cbiAgICovXG4gIGltcG9ydEFWQVggPSBhc3luYyAoXG4gICAgdXNlcm5hbWU6IHN0cmluZywgXG4gICAgcGFzc3dvcmQ6IHN0cmluZywgXG4gICAgdG86IHN0cmluZywgXG4gICAgc291cmNlQ2hhaW46IHN0cmluZykgOiBcbiAgUHJvbWlzZTxzdHJpbmc+ID0+IHtcbiAgICBjb25zdCBwYXJhbXM6IHtcbiAgICAgIHVzZXJuYW1lOiBzdHJpbmcsIFxuICAgICAgcGFzc3dvcmQ6IHN0cmluZywgXG4gICAgICB0bzogc3RyaW5nLCBcbiAgICAgIHNvdXJjZUNoYWluOiBzdHJpbmdcbiAgICB9ID0ge1xuICAgICAgdG8sXG4gICAgICBzb3VyY2VDaGFpbixcbiAgICAgIHVzZXJuYW1lLFxuICAgICAgcGFzc3dvcmQsXG4gICAgfTtcbiAgICByZXR1cm4gdGhpcy5jYWxsTWV0aG9kKCdhdmF4LmltcG9ydEFWQVgnLCBwYXJhbXMpXG4gICAgICAudGhlbigocmVzcG9uc2U6IFJlcXVlc3RSZXNwb25zZURhdGEpID0+IHJlc3BvbnNlLmRhdGEucmVzdWx0LnR4SUQpO1xuICB9O1xuXG4gIC8qKlxuICAgKiBHaXZlIGEgdXNlciBjb250cm9sIG92ZXIgYW4gYWRkcmVzcyBieSBwcm92aWRpbmcgdGhlIHByaXZhdGUga2V5IHRoYXQgY29udHJvbHMgdGhlIGFkZHJlc3MuXG4gICAqXG4gICAqIEBwYXJhbSB1c2VybmFtZSBUaGUgbmFtZSBvZiB0aGUgdXNlciB0byBzdG9yZSB0aGUgcHJpdmF0ZSBrZXlcbiAgICogQHBhcmFtIHBhc3N3b3JkIFRoZSBwYXNzd29yZCB0aGF0IHVubG9ja3MgdGhlIHVzZXJcbiAgICogQHBhcmFtIHByaXZhdGVLZXkgQSBzdHJpbmcgcmVwcmVzZW50aW5nIHRoZSBwcml2YXRlIGtleSBpbiB0aGUgdm0ncyBmb3JtYXRcbiAgICpcbiAgICogQHJldHVybnMgVGhlIGFkZHJlc3MgZm9yIHRoZSBpbXBvcnRlZCBwcml2YXRlIGtleS5cbiAgICovXG4gIGltcG9ydEtleSA9IGFzeW5jIChcbiAgICB1c2VybmFtZTogc3RyaW5nLCBcbiAgICBwYXNzd29yZDogc3RyaW5nLCBcbiAgICBwcml2YXRlS2V5OiBzdHJpbmdcbiAgKTogUHJvbWlzZTxzdHJpbmc+ID0+IHtcbiAgICBjb25zdCBwYXJhbXM6IHtcbiAgICAgIHVzZXJuYW1lOiBzdHJpbmcsIFxuICAgICAgcGFzc3dvcmQ6IHN0cmluZywgXG4gICAgICBwcml2YXRlS2V5OiBzdHJpbmdcbiAgICB9ID0ge1xuICAgICAgdXNlcm5hbWUsXG4gICAgICBwYXNzd29yZCxcbiAgICAgIHByaXZhdGVLZXksXG4gICAgfTtcbiAgICByZXR1cm4gdGhpcy5jYWxsTWV0aG9kKCdhdmF4LmltcG9ydEtleScsIHBhcmFtcykudGhlbigocmVzcG9uc2U6IFJlcXVlc3RSZXNwb25zZURhdGEpID0+IHJlc3BvbnNlLmRhdGEucmVzdWx0LmFkZHJlc3MpO1xuICB9O1xuXG4gIC8qKlxuICAgKiBDYWxscyB0aGUgbm9kZSdzIGlzc3VlVHggbWV0aG9kIGZyb20gdGhlIEFQSSBhbmQgcmV0dXJucyB0aGUgcmVzdWx0aW5nIHRyYW5zYWN0aW9uIElEIGFzIGEgc3RyaW5nLlxuICAgKlxuICAgKiBAcGFyYW0gdHggQSBzdHJpbmcsIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9LCBvciBbW1R4XV0gcmVwcmVzZW50aW5nIGEgdHJhbnNhY3Rpb25cbiAgICpcbiAgICogQHJldHVybnMgQSBQcm9taXNlPHN0cmluZz4gcmVwcmVzZW50aW5nIHRoZSB0cmFuc2FjdGlvbiBJRCBvZiB0aGUgcG9zdGVkIHRyYW5zYWN0aW9uLlxuICAgKi9cbiAgaXNzdWVUeCA9IGFzeW5jICh0eDogc3RyaW5nIHwgQnVmZmVyIHwgVHgpOiBQcm9taXNlPHN0cmluZz4gPT4ge1xuICAgIGxldCBUcmFuc2FjdGlvbjogc3RyaW5nID0gJyc7XG4gICAgaWYgKHR5cGVvZiB0eCA9PT0gJ3N0cmluZycpIHtcbiAgICAgIFRyYW5zYWN0aW9uID0gdHg7XG4gICAgfSBlbHNlIGlmICh0eCBpbnN0YW5jZW9mIEJ1ZmZlcikge1xuICAgICAgY29uc3QgdHhvYmo6VHggPSBuZXcgVHgoKTtcbiAgICAgIHR4b2JqLmZyb21CdWZmZXIodHgpO1xuICAgICAgVHJhbnNhY3Rpb24gPSB0eG9iai50b1N0cmluZygpO1xuICAgIH0gZWxzZSBpZiAodHggaW5zdGFuY2VvZiBUeCkge1xuICAgICAgVHJhbnNhY3Rpb24gPSB0eC50b1N0cmluZygpO1xuICAgIH0gZWxzZSB7XG4gICAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdFcnJvciAtIGF2YXguaXNzdWVUeDogcHJvdmlkZWQgdHggaXMgbm90IGV4cGVjdGVkIHR5cGUgb2Ygc3RyaW5nLCBCdWZmZXIsIG9yIFR4Jyk7XG4gICAgfVxuICAgIGNvbnN0IHBhcmFtczoge1xuICAgICAgdHg6IHN0cmluZ1xuICAgIH0gPSB7XG4gICAgICB0eDogVHJhbnNhY3Rpb24udG9TdHJpbmcoKSxcbiAgICB9O1xuICAgIHJldHVybiB0aGlzLmNhbGxNZXRob2QoJ2F2YXguaXNzdWVUeCcsIHBhcmFtcykudGhlbigocmVzcG9uc2U6IFJlcXVlc3RSZXNwb25zZURhdGEpID0+IHJlc3BvbnNlLmRhdGEucmVzdWx0LnR4SUQpO1xuICB9O1xuXG4gIC8qKlxuICAgKiBFeHBvcnRzIHRoZSBwcml2YXRlIGtleSBmb3IgYW4gYWRkcmVzcy5cbiAgICpcbiAgICogQHBhcmFtIHVzZXJuYW1lIFRoZSBuYW1lIG9mIHRoZSB1c2VyIHdpdGggdGhlIHByaXZhdGUga2V5XG4gICAqIEBwYXJhbSBwYXNzd29yZCBUaGUgcGFzc3dvcmQgdXNlZCB0byBkZWNyeXB0IHRoZSBwcml2YXRlIGtleVxuICAgKiBAcGFyYW0gYWRkcmVzcyBUaGUgYWRkcmVzcyB3aG9zZSBwcml2YXRlIGtleSBzaG91bGQgYmUgZXhwb3J0ZWRcbiAgICpcbiAgICogQHJldHVybnMgUHJvbWlzZSB3aXRoIHRoZSBkZWNyeXB0ZWQgcHJpdmF0ZSBrZXkgYXMgc3RvcmUgaW4gdGhlIGRhdGFiYXNlXG4gICAqL1xuICBleHBvcnRLZXkgPSBhc3luYyAoXG4gICAgdXNlcm5hbWU6IHN0cmluZywgXG4gICAgcGFzc3dvcmQ6IHN0cmluZywgXG4gICAgYWRkcmVzczogc3RyaW5nXG4gICk6IFByb21pc2U8c3RyaW5nPiA9PiB7XG4gICAgY29uc3QgcGFyYW1zOiB7XG4gICAgICB1c2VybmFtZTogc3RyaW5nLCBcbiAgICAgIHBhc3N3b3JkOiBzdHJpbmcsIFxuICAgICAgYWRkcmVzczogc3RyaW5nXG4gICAgfSA9IHtcbiAgICAgIHVzZXJuYW1lLFxuICAgICAgcGFzc3dvcmQsXG4gICAgICBhZGRyZXNzLFxuICAgIH07XG4gICAgcmV0dXJuIHRoaXMuY2FsbE1ldGhvZCgnYXZheC5leHBvcnRLZXknLCBwYXJhbXMpLnRoZW4oKHJlc3BvbnNlOiBSZXF1ZXN0UmVzcG9uc2VEYXRhKSA9PiByZXNwb25zZS5kYXRhLnJlc3VsdC5wcml2YXRlS2V5KTtcbiAgfTtcblxuICAvKipcbiAgICogSGVscGVyIGZ1bmN0aW9uIHdoaWNoIGNyZWF0ZXMgYW4gdW5zaWduZWQgSW1wb3J0IFR4LiBGb3IgbW9yZSBncmFudWxhciBjb250cm9sLCB5b3UgbWF5IGNyZWF0ZSB5b3VyIG93blxuICAgKiBbW1Vuc2lnbmVkVHhdXSBtYW51YWxseSAod2l0aCB0aGVpciBjb3JyZXNwb25kaW5nIFtbVHJhbnNmZXJhYmxlSW5wdXRdXXMsIFtbVHJhbnNmZXJhYmxlT3V0cHV0XV1zKS5cbiAgICpcbiAgICogQHBhcmFtIHV0eG9zZXQgQSBzZXQgb2YgVVRYT3MgdGhhdCB0aGUgdHJhbnNhY3Rpb24gaXMgYnVpbHQgb25cbiAgICogQHBhcmFtIHRvQWRkcmVzcyBUaGUgYWRkcmVzcyB0byBzZW5kIHRoZSBmdW5kc1xuICAgKiBAcGFyYW0gb3duZXJBZGRyZXNzZXMgVGhlIGFkZHJlc3NlcyBiZWluZyB1c2VkIHRvIGltcG9ydFxuICAgKiBAcGFyYW0gc291cmNlQ2hhaW4gVGhlIGNoYWluaWQgZm9yIHdoZXJlIHRoZSBpbXBvcnQgaXMgY29taW5nIGZyb21cbiAgICogQHBhcmFtIGZyb21BZGRyZXNzZXMgVGhlIGFkZHJlc3NlcyBiZWluZyB1c2VkIHRvIHNlbmQgdGhlIGZ1bmRzIGZyb20gdGhlIFVUWE9zIHByb3ZpZGVkXG4gICAqXG4gICAqIEByZXR1cm5zIEFuIHVuc2lnbmVkIHRyYW5zYWN0aW9uIChbW1Vuc2lnbmVkVHhdXSkgd2hpY2ggY29udGFpbnMgYSBbW0ltcG9ydFR4XV0uXG4gICAqXG4gICAqIEByZW1hcmtzXG4gICAqIFRoaXMgaGVscGVyIGV4aXN0cyBiZWNhdXNlIHRoZSBlbmRwb2ludCBBUEkgc2hvdWxkIGJlIHRoZSBwcmltYXJ5IHBvaW50IG9mIGVudHJ5IGZvciBtb3N0IGZ1bmN0aW9uYWxpdHkuXG4gICAqL1xuICBidWlsZEltcG9ydFR4ID0gYXN5bmMgKFxuICAgIHV0eG9zZXQ6IFVUWE9TZXQsIFxuICAgIHRvQWRkcmVzczogc3RyaW5nLFxuICAgIG93bmVyQWRkcmVzc2VzOiBzdHJpbmdbXSxcbiAgICBzb3VyY2VDaGFpbjogQnVmZmVyIHwgc3RyaW5nLFxuICAgIGZyb21BZGRyZXNzZXM6IHN0cmluZ1tdXG4gICk6IFByb21pc2U8VW5zaWduZWRUeD4gPT4ge1xuICAgIGNvbnN0IGZyb206IEJ1ZmZlcltdID0gdGhpcy5fY2xlYW5BZGRyZXNzQXJyYXkoZnJvbUFkZHJlc3NlcywgJ2J1aWxkSW1wb3J0VHgnKS5tYXAoKGEpID0+IGJpbnRvb2xzLnN0cmluZ1RvQWRkcmVzcyhhKSk7XG4gICAgbGV0IHNyY0NoYWluOiBzdHJpbmcgPSB1bmRlZmluZWQ7XG5cbiAgICBpZih0eXBlb2Ygc291cmNlQ2hhaW4gPT09IFwic3RyaW5nXCIpIHtcbiAgICAgIC8vIGlmIHRoZXJlIGlzIGEgc291cmNlQ2hhaW4gcGFzc2VkIGluIGFuZCBpdCdzIGEgc3RyaW5nIHRoZW4gc2F2ZSB0aGUgc3RyaW5nIHZhbHVlIGFuZCBjYXN0IHRoZSBvcmlnaW5hbFxuICAgICAgLy8gdmFyaWFibGUgZnJvbSBhIHN0cmluZyB0byBhIEJ1ZmZlclxuICAgICAgc3JjQ2hhaW4gPSBzb3VyY2VDaGFpbjtcbiAgICAgIHNvdXJjZUNoYWluID0gYmludG9vbHMuY2I1OERlY29kZShzb3VyY2VDaGFpbik7XG4gICAgfSBlbHNlIGlmKHR5cGVvZiBzb3VyY2VDaGFpbiA9PT0gXCJ1bmRlZmluZWRcIiB8fCAhKHNvdXJjZUNoYWluIGluc3RhbmNlb2YgQnVmZmVyKSkge1xuICAgICAgLy8gaWYgdGhlcmUgaXMgbm8gc291cmNlQ2hhaW4gcGFzc2VkIGluIG9yIHRoZSBzb3VyY2VDaGFpbiBpcyBhbnkgZGF0YSB0eXBlIG90aGVyIHRoYW4gYSBCdWZmZXIgdGhlbiB0aHJvdyBhbiBlcnJvclxuICAgICAgdGhyb3cgbmV3IEVycm9yKCdFcnJvciAtIEVWTUFQSS5idWlsZEltcG9ydFR4OiBzb3VyY2VDaGFpbiBpcyB1bmRlZmluZWQgb3IgaW52YWxpZCBzb3VyY2VDaGFpbiB0eXBlLicpO1xuICAgIH1cbiAgICBjb25zdCB1dHhvUmVzcG9uc2U6IFVUWE9SZXNwb25zZSA9IGF3YWl0IHRoaXMuZ2V0VVRYT3Mob3duZXJBZGRyZXNzZXMsIHNyY0NoYWluLCAwLCB1bmRlZmluZWQpO1xuICAgIGNvbnN0IGF0b21pY1VUWE9zOiBVVFhPU2V0ID0gdXR4b1Jlc3BvbnNlLnV0eG9zO1xuICAgIGNvbnN0IGF2YXhBc3NldElEOiBCdWZmZXIgPSBhd2FpdCB0aGlzLmdldEFWQVhBc3NldElEKCk7XG4gICAgY29uc3QgYXRvbWljczogVVRYT1tdID0gYXRvbWljVVRYT3MuZ2V0QWxsVVRYT3MoKTtcblxuICAgIGlmKGF0b21pY3MubGVuZ3RoID09PSAwKXtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIkVycm9yIC0gRVZNQVBJLmJ1aWxkSW1wb3J0VHg6IG5vIGF0b21pYyB1dHhvcyB0byBpbXBvcnRcIik7XG4gICAgfVxuXG4gICAgY29uc3QgYnVpbHRVbnNpZ25lZFR4OiBVbnNpZ25lZFR4ID0gdXR4b3NldC5idWlsZEltcG9ydFR4KFxuICAgICAgdGhpcy5jb3JlLmdldE5ldHdvcmtJRCgpLFxuICAgICAgYmludG9vbHMuY2I1OERlY29kZSh0aGlzLmJsb2NrY2hhaW5JRCksIFxuICAgICAgW3RvQWRkcmVzc10sXG4gICAgICBmcm9tLFxuICAgICAgYXRvbWljcyxcbiAgICAgIHNvdXJjZUNoYWluLFxuICAgICAgdGhpcy5nZXRUeEZlZSgpLFxuICAgICAgYXZheEFzc2V0SURcbiAgICApO1xuXG4gICAgcmV0dXJuIGJ1aWx0VW5zaWduZWRUeDtcbiAgfTtcblxuICAvKipcbiAgICogSGVscGVyIGZ1bmN0aW9uIHdoaWNoIGNyZWF0ZXMgYW4gdW5zaWduZWQgRXhwb3J0IFR4LiBGb3IgbW9yZSBncmFudWxhciBjb250cm9sLCB5b3UgbWF5IGNyZWF0ZSB5b3VyIG93blxuICAgKiBbW1Vuc2lnbmVkVHhdXSBtYW51YWxseSAod2l0aCB0aGVpciBjb3JyZXNwb25kaW5nIFtbVHJhbnNmZXJhYmxlSW5wdXRdXXMsIFtbVHJhbnNmZXJhYmxlT3V0cHV0XV1zKS5cbiAgICpcbiAgICogQHBhcmFtIGFtb3VudCBUaGUgYW1vdW50IGJlaW5nIGV4cG9ydGVkIGFzIGEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9pbmR1dG55L2JuLmpzL3xCTn1cbiAgICogQHBhcmFtIGFzc2V0SUQgVGhlIGFzc2V0IGlkIHdoaWNoIGlzIGJlaW5nIHNlbnRcbiAgICogQHBhcmFtIGRlc3RpbmF0aW9uQ2hhaW4gVGhlIGNoYWluaWQgZm9yIHdoZXJlIHRoZSBhc3NldHMgd2lsbCBiZSBzZW50LlxuICAgKiBAcGFyYW0gdG9BZGRyZXNzZXMgVGhlIGFkZHJlc3NlcyB0byBzZW5kIHRoZSBmdW5kc1xuICAgKiBAcGFyYW0gZnJvbUFkZHJlc3NlcyBUaGUgYWRkcmVzc2VzIGJlaW5nIHVzZWQgdG8gc2VuZCB0aGUgZnVuZHMgZnJvbSB0aGUgVVRYT3MgcHJvdmlkZWRcbiAgICogQHBhcmFtIGNoYW5nZUFkZHJlc3NlcyBUaGUgYWRkcmVzc2VzIHRoYXQgY2FuIHNwZW5kIHRoZSBjaGFuZ2UgcmVtYWluaW5nIGZyb20gdGhlIHNwZW50IFVUWE9zXG4gICAqIEBwYXJhbSBhc09mIE9wdGlvbmFsLiBUaGUgdGltZXN0YW1wIHRvIHZlcmlmeSB0aGUgdHJhbnNhY3Rpb24gYWdhaW5zdCBhcyBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vaW5kdXRueS9ibi5qcy98Qk59XG4gICAqIEBwYXJhbSBsb2NrdGltZSBPcHRpb25hbC4gVGhlIGxvY2t0aW1lIGZpZWxkIGNyZWF0ZWQgaW4gdGhlIHJlc3VsdGluZyBvdXRwdXRzXG4gICAqIEBwYXJhbSB0aHJlc2hvbGQgT3B0aW9uYWwuIFRoZSBudW1iZXIgb2Ygc2lnbmF0dXJlcyByZXF1aXJlZCB0byBzcGVuZCB0aGUgZnVuZHMgaW4gdGhlIHJlc3VsdGFudCBVVFhPXG4gICAqXG4gICAqIEByZXR1cm5zIEFuIHVuc2lnbmVkIHRyYW5zYWN0aW9uIChbW1Vuc2lnbmVkVHhdXSkgd2hpY2ggY29udGFpbnMgYW4gW1tFeHBvcnRUeF1dLlxuICAgKi9cbiAgYnVpbGRFeHBvcnRUeCA9IGFzeW5jIChcbiAgICBhbW91bnQ6IEJOLFxuICAgIGFzc2V0SUQ6IEJ1ZmZlciB8IHN0cmluZyxcbiAgICBkZXN0aW5hdGlvbkNoYWluOiBCdWZmZXIgfCBzdHJpbmcsXG4gICAgZnJvbUFkZHJlc3NIZXg6IHN0cmluZywgXG4gICAgZnJvbUFkZHJlc3NCZWNoOiBzdHJpbmcsIFxuICAgIHRvQWRkcmVzc2VzOiBzdHJpbmdbXSxcbiAgICBub25jZTogbnVtYmVyID0gMCxcbiAgICBsb2NrdGltZTogQk4gPSBuZXcgQk4oMCksIFxuICAgIHRocmVzaG9sZDogbnVtYmVyID0gMVxuICApOiBQcm9taXNlPFVuc2lnbmVkVHg+ID0+IHsgXG5cbiAgICBsZXQgcHJlZml4ZXM6IG9iamVjdCA9IHt9O1xuICAgIHRvQWRkcmVzc2VzLm1hcCgoYWRkcmVzczogc3RyaW5nKSA9PiB7XG4gICAgICBwcmVmaXhlc1thZGRyZXNzLnNwbGl0KFwiLVwiKVswXV0gPSB0cnVlO1xuICAgIH0pO1xuICAgIGlmKE9iamVjdC5rZXlzKHByZWZpeGVzKS5sZW5ndGggIT09IDEpe1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiRXJyb3IgLSBFVk1BUEkuYnVpbGRFeHBvcnRUeDogVG8gYWRkcmVzc2VzIG11c3QgaGF2ZSB0aGUgc2FtZSBjaGFpbklEIHByZWZpeC5cIik7XG4gICAgfVxuICAgIFxuICAgIGlmKHR5cGVvZiBkZXN0aW5hdGlvbkNoYWluID09PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJFcnJvciAtIEVWTUFQSS5idWlsZEV4cG9ydFR4OiBEZXN0aW5hdGlvbiBDaGFpbklEIGlzIHVuZGVmaW5lZC5cIik7XG4gICAgfSBlbHNlIGlmICh0eXBlb2YgZGVzdGluYXRpb25DaGFpbiA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgZGVzdGluYXRpb25DaGFpbiA9IGJpbnRvb2xzLmNiNThEZWNvZGUoZGVzdGluYXRpb25DaGFpbik7IFxuICAgIH0gZWxzZSBpZighKGRlc3RpbmF0aW9uQ2hhaW4gaW5zdGFuY2VvZiBCdWZmZXIpKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJFcnJvciAtIEVWTUFQSS5idWlsZEV4cG9ydFR4OiBJbnZhbGlkIGRlc3RpbmF0aW9uQ2hhaW4gdHlwZVwiKTtcbiAgICB9XG4gICAgaWYoZGVzdGluYXRpb25DaGFpbi5sZW5ndGggIT09IDMyKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJFcnJvciAtIEVWTUFQSS5idWlsZEV4cG9ydFR4OiBEZXN0aW5hdGlvbiBDaGFpbklEIG11c3QgYmUgMzIgYnl0ZXMgaW4gbGVuZ3RoLlwiKTtcbiAgICB9XG4gICAgY29uc3QgZmVlOiBCTiA9IHRoaXMuZ2V0VHhGZWUoKTtcblxuICAgIGNvbnN0IGFzc2V0RGVzY3JpcHRpb246IGFueSA9IGF3YWl0IHRoaXMuZ2V0QXNzZXREZXNjcmlwdGlvbihcIkFWQVhcIik7XG4gICAgY29uc3QgZXZtSW5wdXRzOiBFVk1JbnB1dFtdID0gW107XG4gICAgaWYoYmludG9vbHMuY2I1OEVuY29kZShhc3NldERlc2NyaXB0aW9uLmFzc2V0SUQpID09PSBhc3NldElEKSB7XG4gICAgICBjb25zdCBldm1JbnB1dDogRVZNSW5wdXQgPSBuZXcgRVZNSW5wdXQoZnJvbUFkZHJlc3NIZXgsIGFtb3VudC5hZGQoZmVlKSwgYXNzZXRJRCwgbm9uY2UpO1xuICAgICAgZXZtSW5wdXQuYWRkU2lnbmF0dXJlSWR4KDAsIGJpbnRvb2xzLnN0cmluZ1RvQWRkcmVzcyhmcm9tQWRkcmVzc0JlY2gpKTtcbiAgICAgIGV2bUlucHV0cy5wdXNoKGV2bUlucHV0KTtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gaWYgYXNzZXQgaWQgaXNuJ3QgQVZBWCBhc3NldCBpZCB0aGVuIGNyZWF0ZSAyIGlucHV0c1xuICAgICAgLy8gZmlyc3QgaW5wdXQgd2lsbCBiZSBBVkFYIGFuZCB3aWxsIGJlIGZvciB0aGUgYW1vdW50IG9mIHRoZSBmZWVcbiAgICAgIC8vIHNlY29uZCBpbnB1dCB3aWxsIGJlIHRoZSBBTlRcbiAgICAgIGNvbnN0IGV2bUFWQVhJbnB1dDogRVZNSW5wdXQgPSBuZXcgRVZNSW5wdXQoZnJvbUFkZHJlc3NIZXgsIGZlZSwgYXNzZXREZXNjcmlwdGlvbi5hc3NldElELCBub25jZSk7XG4gICAgICBldm1BVkFYSW5wdXQuYWRkU2lnbmF0dXJlSWR4KDAsIGJpbnRvb2xzLnN0cmluZ1RvQWRkcmVzcyhmcm9tQWRkcmVzc0JlY2gpKTtcbiAgICAgIGV2bUlucHV0cy5wdXNoKGV2bUFWQVhJbnB1dCk7XG5cbiAgICAgIGNvbnN0IGV2bUFOVElucHV0OiBFVk1JbnB1dCA9IG5ldyBFVk1JbnB1dChmcm9tQWRkcmVzc0hleCwgYW1vdW50LCBhc3NldElELCBub25jZSk7XG4gICAgICBldm1BTlRJbnB1dC5hZGRTaWduYXR1cmVJZHgoMCwgYmludG9vbHMuc3RyaW5nVG9BZGRyZXNzKGZyb21BZGRyZXNzQmVjaCkpO1xuICAgICAgZXZtSW5wdXRzLnB1c2goZXZtQU5USW5wdXQpO1xuICAgIH1cblxuICAgIGNvbnN0IHRvOiBCdWZmZXJbXSA9IFtdO1xuICAgIHRvQWRkcmVzc2VzLm1hcCgoYWRkcmVzczogc3RyaW5nKSA9PiB7XG4gICAgICB0by5wdXNoKGJpbnRvb2xzLnN0cmluZ1RvQWRkcmVzcyhhZGRyZXNzKSk7XG4gICAgfSk7XG5cbiAgICBsZXQgZXhwb3J0ZWRPdXRzOiBUcmFuc2ZlcmFibGVPdXRwdXRbXSA9IFtdO1xuICAgIGNvbnN0IHNlY3BUcmFuc2Zlck91dHB1dDogU0VDUFRyYW5zZmVyT3V0cHV0ID0gbmV3IFNFQ1BUcmFuc2Zlck91dHB1dChhbW91bnQsIHRvLCBsb2NrdGltZSwgdGhyZXNob2xkKTtcbiAgICBjb25zdCB0cmFuc2ZlcmFibGVPdXRwdXQ6IFRyYW5zZmVyYWJsZU91dHB1dCA9IG5ldyBUcmFuc2ZlcmFibGVPdXRwdXQoYmludG9vbHMuY2I1OERlY29kZShhc3NldElEKSwgc2VjcFRyYW5zZmVyT3V0cHV0KTtcbiAgICBleHBvcnRlZE91dHMucHVzaCh0cmFuc2ZlcmFibGVPdXRwdXQpO1xuXG4gICAgLy8gbGV4aWNvZ3JhcGhpY2FsbHkgc29ydCBhcnJheVxuICAgIGV4cG9ydGVkT3V0cyA9IGV4cG9ydGVkT3V0cy5zb3J0KFRyYW5zZmVyYWJsZU91dHB1dC5jb21wYXJhdG9yKCkpO1xuXG4gICAgY29uc3QgZXhwb3J0VHg6IEV4cG9ydFR4ID0gbmV3IEV4cG9ydFR4KFxuICAgICAgdGhpcy5jb3JlLmdldE5ldHdvcmtJRCgpLCBcbiAgICAgIGJpbnRvb2xzLmNiNThEZWNvZGUodGhpcy5ibG9ja2NoYWluSUQpLCBcbiAgICAgIGRlc3RpbmF0aW9uQ2hhaW4sXG4gICAgICBldm1JbnB1dHMsXG4gICAgICBleHBvcnRlZE91dHNcbiAgICApO1xuXG4gICAgY29uc3QgdW5zaWduZWRUeDogVW5zaWduZWRUeCA9IG5ldyBVbnNpZ25lZFR4KGV4cG9ydFR4KTtcbiAgICByZXR1cm4gdW5zaWduZWRUeDtcbiAgfTtcblxuICAvKipcbiAgICogR2V0cyBhIHJlZmVyZW5jZSB0byB0aGUga2V5Y2hhaW4gZm9yIHRoaXMgY2xhc3MuXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSBpbnN0YW5jZSBvZiBbW0tleUNoYWluXV0gZm9yIHRoaXMgY2xhc3NcbiAgICovXG4gIGtleUNoYWluID0gKCk6IEtleUNoYWluID0+IHRoaXMua2V5Y2hhaW47XG5cbiAgLyoqXG4gICAqIEBpZ25vcmVcbiAgICovXG4gIHByb3RlY3RlZCBfY2xlYW5BZGRyZXNzQXJyYXkoYWRkcmVzc2VzOiBzdHJpbmdbXSB8IEJ1ZmZlcltdLCBjYWxsZXI6IHN0cmluZyk6IHN0cmluZ1tdIHtcbiAgICBjb25zdCBhZGRyczogc3RyaW5nW10gPSBbXTtcbiAgICBjb25zdCBjaGFpbmlkOiBzdHJpbmcgPSB0aGlzLmdldEJsb2NrY2hhaW5BbGlhcygpID8gdGhpcy5nZXRCbG9ja2NoYWluQWxpYXMoKSA6IHRoaXMuZ2V0QmxvY2tjaGFpbklEKCk7XG4gICAgaWYgKGFkZHJlc3NlcyAmJiBhZGRyZXNzZXMubGVuZ3RoID4gMCkge1xuICAgICAgYWRkcmVzc2VzLmZvckVhY2goKGFkZHJlc3M6IHN0cmluZyB8IEJ1ZmZlcikgPT4ge1xuICAgICAgICBpZiAodHlwZW9mIGFkZHJlc3MgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgaWYgKHR5cGVvZiB0aGlzLnBhcnNlQWRkcmVzcyhhZGRyZXNzIGFzIHN0cmluZykgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiRXJyb3IgLSBJbnZhbGlkIGFkZHJlc3MgZm9ybWF0XCIpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBhZGRycy5wdXNoKGFkZHJlc3MgYXMgc3RyaW5nKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBhZGRycy5wdXNoKGJpbnRvb2xzLmFkZHJlc3NUb1N0cmluZyh0aGlzLmNvcmUuZ2V0SFJQKCksIGNoYWluaWQsIGFkZHJlc3MgYXMgQnVmZmVyKSk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cbiAgICByZXR1cm4gYWRkcnM7XG4gIH1cblxuICAvKipcbiAgICogVGhpcyBjbGFzcyBzaG91bGQgbm90IGJlIGluc3RhbnRpYXRlZCBkaXJlY3RseS5cbiAgICogSW5zdGVhZCB1c2UgdGhlIFtbQXZhbGFuY2hlLmFkZEFQSV1dIG1ldGhvZC5cbiAgICpcbiAgICogQHBhcmFtIGNvcmUgQSByZWZlcmVuY2UgdG8gdGhlIEF2YWxhbmNoZSBjbGFzc1xuICAgKiBAcGFyYW0gYmFzZXVybCBEZWZhdWx0cyB0byB0aGUgc3RyaW5nIFwiL2V4dC9iYy9DL2F2YXhcIiBhcyB0aGUgcGF0aCB0byBibG9ja2NoYWluJ3MgYmFzZXVybFxuICAgKiBAcGFyYW0gYmxvY2tjaGFpbklEIFRoZSBCbG9ja2NoYWluJ3MgSUQuIERlZmF1bHRzIHRvIGFuIGVtcHR5IHN0cmluZzogJydcbiAgICovXG4gIGNvbnN0cnVjdG9yKGNvcmU6IEF2YWxhbmNoZUNvcmUsIGJhc2V1cmw6IHN0cmluZyA9ICcvZXh0L2JjL0MvYXZheCcsIGJsb2NrY2hhaW5JRDogc3RyaW5nID0gJycpIHsgXG4gICAgc3VwZXIoY29yZSwgYmFzZXVybCk7IFxuICAgIHRoaXMuYmxvY2tjaGFpbklEID0gYmxvY2tjaGFpbklEO1xuICAgIGNvbnN0IG5ldElEOiBudW1iZXIgPSBjb3JlLmdldE5ldHdvcmtJRCgpO1xuICAgIGlmIChuZXRJRCBpbiBEZWZhdWx0cy5uZXR3b3JrICYmIGJsb2NrY2hhaW5JRCBpbiBEZWZhdWx0cy5uZXR3b3JrW25ldElEXSkge1xuICAgICAgY29uc3QgeyBhbGlhcyB9ID0gRGVmYXVsdHMubmV0d29ya1tuZXRJRF1bYmxvY2tjaGFpbklEXTtcbiAgICAgIHRoaXMua2V5Y2hhaW4gPSBuZXcgS2V5Q2hhaW4odGhpcy5jb3JlLmdldEhSUCgpLCBhbGlhcyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMua2V5Y2hhaW4gPSBuZXcgS2V5Q2hhaW4odGhpcy5jb3JlLmdldEhSUCgpLCBibG9ja2NoYWluSUQpO1xuICAgIH1cbiAgfVxufVxuIl19