"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StandardUTXOSet = exports.StandardUTXO = void 0;
/**
 * @packageDocumentation
 * @module Common-UTXOs
 */
const buffer_1 = require("buffer/");
const bintools_1 = __importDefault(require("../utils/bintools"));
const bn_js_1 = __importDefault(require("bn.js"));
const output_1 = require("./output");
const helperfunctions_1 = require("../utils/helperfunctions");
const serialization_1 = require("../utils/serialization");
/**
 * @ignore
 */
const bintools = bintools_1.default.getInstance();
const serializer = serialization_1.Serialization.getInstance();
/**
 * Class for representing a single StandardUTXO.
 */
class StandardUTXO extends serialization_1.Serializable {
    /**
       * Class for representing a single StandardUTXO.
       *
       * @param codecID Optional number which specifies the codeID of the UTXO. Default 1
       * @param txid Optional {@link https://github.com/feross/buffer|Buffer} of transaction ID for the StandardUTXO
       * @param txidx Optional {@link https://github.com/feross/buffer|Buffer} or number for the index of the transaction's [[Output]]
       * @param assetid Optional {@link https://github.com/feross/buffer|Buffer} of the asset ID for the StandardUTXO
       * @param outputid Optional {@link https://github.com/feross/buffer|Buffer} or number of the output ID for the StandardUTXO
       */
    constructor(codecID = 0, txid = undefined, outputidx = undefined, assetid = undefined, output = undefined) {
        super();
        this._typeName = "StandardUTXO";
        this._typeID = undefined;
        this.codecid = buffer_1.Buffer.alloc(2);
        this.txid = buffer_1.Buffer.alloc(32);
        this.outputidx = buffer_1.Buffer.alloc(4);
        this.assetid = buffer_1.Buffer.alloc(32);
        this.output = undefined;
        /**
           * Returns the numeric representation of the CodecID.
           */
        this.getCodecID = () => this.codecid.readUInt8(0);
        /**
         * Returns the {@link https://github.com/feross/buffer|Buffer} representation of the CodecID
          */
        this.getCodecIDBuffer = () => this.codecid;
        /**
           * Returns a {@link https://github.com/feross/buffer|Buffer} of the TxID.
           */
        this.getTxID = () => this.txid;
        /**
           * Returns a {@link https://github.com/feross/buffer|Buffer}  of the OutputIdx.
           */
        this.getOutputIdx = () => this.outputidx;
        /**
           * Returns the assetID as a {@link https://github.com/feross/buffer|Buffer}.
           */
        this.getAssetID = () => this.assetid;
        /**
           * Returns the UTXOID as a base-58 string (UTXOID is a string )
           */
        this.getUTXOID = () => bintools.bufferToB58(buffer_1.Buffer.concat([this.getTxID(), this.getOutputIdx()]));
        /**
         * Returns a reference to the output;
        */
        this.getOutput = () => this.output;
        if (typeof codecID !== 'undefined') {
            this.codecid.writeUInt8(codecID, 0);
        }
        if (typeof txid !== 'undefined') {
            this.txid = txid;
        }
        if (typeof outputidx === 'number') {
            this.outputidx.writeUInt32BE(outputidx, 0);
        }
        else if (outputidx instanceof buffer_1.Buffer) {
            this.outputidx = outputidx;
        }
        if (typeof assetid !== 'undefined') {
            this.assetid = assetid;
        }
        if (typeof output !== 'undefined') {
            this.output = output;
        }
    }
    serialize(encoding = "hex") {
        let fields = super.serialize(encoding);
        return Object.assign(Object.assign({}, fields), { "codecid": serializer.encoder(this.codecid, encoding, "Buffer", "decimalString"), "txid": serializer.encoder(this.txid, encoding, "Buffer", "cb58"), "outputidx": serializer.encoder(this.outputidx, encoding, "Buffer", "decimalString"), "assetid": serializer.encoder(this.assetid, encoding, "Buffer", "cb58"), "output": this.output.serialize(encoding) });
    }
    ;
    deserialize(fields, encoding = "hex") {
        super.deserialize(fields, encoding);
        this.codecid = serializer.decoder(fields["codecid"], encoding, "decimalString", "Buffer", 2);
        this.txid = serializer.decoder(fields["txid"], encoding, "cb58", "Buffer", 32);
        this.outputidx = serializer.decoder(fields["outputidx"], encoding, "decimalString", "Buffer", 4);
        this.assetid = serializer.decoder(fields["assetid"], encoding, "cb58", "Buffer", 32);
    }
    /**
       * Returns a {@link https://github.com/feross/buffer|Buffer} representation of the [[StandardUTXO]].
       */
    toBuffer() {
        const outbuff = this.output.toBuffer();
        const outputidbuffer = buffer_1.Buffer.alloc(4);
        outputidbuffer.writeUInt32BE(this.output.getOutputID(), 0);
        const barr = [this.codecid, this.txid, this.outputidx, this.assetid, outputidbuffer, outbuff];
        return buffer_1.Buffer.concat(barr, this.codecid.length + this.txid.length
            + this.outputidx.length + this.assetid.length
            + outputidbuffer.length + outbuff.length);
    }
}
exports.StandardUTXO = StandardUTXO;
/**
 * Class representing a set of [[StandardUTXO]]s.
 */
class StandardUTXOSet extends serialization_1.Serializable {
    constructor() {
        super(...arguments);
        this._typeName = "StandardUTXOSet";
        this._typeID = undefined;
        this.utxos = {};
        this.addressUTXOs = {}; // maps address to utxoids:locktime
        /**
         * Returns true if the [[StandardUTXO]] is in the StandardUTXOSet.
         *
         * @param utxo Either a [[StandardUTXO]] a cb58 serialized string representing a StandardUTXO
         */
        this.includes = (utxo) => {
            let utxoX = undefined;
            let utxoid = undefined;
            try {
                utxoX = this.parseUTXO(utxo);
                utxoid = utxoX.getUTXOID();
            }
            catch (e) {
                if (e instanceof Error) {
                    console.log(e.message);
                }
                else {
                    console.log(e);
                }
                return false;
            }
            return (utxoid in this.utxos);
        };
        /**
           * Removes a [[StandardUTXO]] from the [[StandardUTXOSet]] if it exists.
           *
           * @param utxo Either a [[StandardUTXO]] an cb58 serialized string representing a StandardUTXO
           *
           * @returns A [[StandardUTXO]] if it was removed and undefined if nothing was removed.
           */
        this.remove = (utxo) => {
            let utxovar = undefined;
            try {
                utxovar = this.parseUTXO(utxo);
            }
            catch (e) {
                if (e instanceof Error) {
                    console.log(e.message);
                }
                else {
                    console.log(e);
                }
                return undefined;
            }
            const utxoid = utxovar.getUTXOID();
            if (!(utxoid in this.utxos)) {
                return undefined;
            }
            delete this.utxos[utxoid];
            const addresses = Object.keys(this.addressUTXOs);
            for (let i = 0; i < addresses.length; i++) {
                if (utxoid in this.addressUTXOs[addresses[i]]) {
                    delete this.addressUTXOs[addresses[i]][utxoid];
                }
            }
            return utxovar;
        };
        /**
           * Removes an array of [[StandardUTXO]]s to the [[StandardUTXOSet]].
           *
           * @param utxo Either a [[StandardUTXO]] an cb58 serialized string representing a StandardUTXO
           * @param overwrite If true, if the UTXOID already exists, overwrite it... default false
           *
           * @returns An array of UTXOs which were removed.
           */
        this.removeArray = (utxos) => {
            const removed = [];
            for (let i = 0; i < utxos.length; i++) {
                const result = this.remove(utxos[i]);
                if (typeof result !== 'undefined') {
                    removed.push(result);
                }
            }
            return removed;
        };
        /**
           * Gets a [[StandardUTXO]] from the [[StandardUTXOSet]] by its UTXOID.
           *
           * @param utxoid String representing the UTXOID
           *
           * @returns A [[StandardUTXO]] if it exists in the set.
           */
        this.getUTXO = (utxoid) => this.utxos[utxoid];
        /**
           * Gets all the [[StandardUTXO]]s, optionally that match with UTXOIDs in an array
           *
           * @param utxoids An optional array of UTXOIDs, returns all [[StandardUTXO]]s if not provided
           *
           * @returns An array of [[StandardUTXO]]s.
           */
        this.getAllUTXOs = (utxoids = undefined) => {
            let results = [];
            if (typeof utxoids !== 'undefined' && Array.isArray(utxoids)) {
                for (let i = 0; i < utxoids.length; i++) {
                    if (utxoids[i] in this.utxos && !(utxoids[i] in results)) {
                        results.push(this.utxos[utxoids[i]]);
                    }
                }
            }
            else {
                results = Object.values(this.utxos);
            }
            return results;
        };
        /**
           * Gets all the [[StandardUTXO]]s as strings, optionally that match with UTXOIDs in an array.
           *
           * @param utxoids An optional array of UTXOIDs, returns all [[StandardUTXO]]s if not provided
           *
           * @returns An array of [[StandardUTXO]]s as cb58 serialized strings.
           */
        this.getAllUTXOStrings = (utxoids = undefined) => {
            const results = [];
            const utxos = Object.keys(this.utxos);
            if (typeof utxoids !== 'undefined' && Array.isArray(utxoids)) {
                for (let i = 0; i < utxoids.length; i++) {
                    if (utxoids[i] in this.utxos) {
                        results.push(this.utxos[utxoids[i]].toString());
                    }
                }
            }
            else {
                for (const u of utxos) {
                    results.push(this.utxos[u].toString());
                }
            }
            return results;
        };
        /**
           * Given an address or array of addresses, returns all the UTXOIDs for those addresses
           *
           * @param address An array of address {@link https://github.com/feross/buffer|Buffer}s
           * @param spendable If true, only retrieves UTXOIDs whose locktime has passed
           *
           * @returns An array of addresses.
           */
        this.getUTXOIDs = (addresses = undefined, spendable = true) => {
            if (typeof addresses !== 'undefined') {
                const results = [];
                const now = helperfunctions_1.UnixNow();
                for (let i = 0; i < addresses.length; i++) {
                    if (addresses[i].toString('hex') in this.addressUTXOs) {
                        const entries = Object.entries(this.addressUTXOs[addresses[i].toString('hex')]);
                        for (const [utxoid, locktime] of entries) {
                            if ((results.indexOf(utxoid) === -1
                                && (spendable && locktime.lte(now)))
                                || !spendable) {
                                results.push(utxoid);
                            }
                        }
                    }
                }
                return results;
            }
            return Object.keys(this.utxos);
        };
        /**
           * Gets the addresses in the [[StandardUTXOSet]] and returns an array of {@link https://github.com/feross/buffer|Buffer}.
           */
        this.getAddresses = () => Object.keys(this.addressUTXOs)
            .map((k) => buffer_1.Buffer.from(k, 'hex'));
        /**
           * Returns the balance of a set of addresses in the StandardUTXOSet.
           *
           * @param addresses An array of addresses
           * @param assetID Either a {@link https://github.com/feross/buffer|Buffer} or an cb58 serialized representation of an AssetID
           * @param asOf The timestamp to verify the transaction against as a {@link https://github.com/indutny/bn.js/|BN}
           *
           * @returns Returns the total balance as a {@link https://github.com/indutny/bn.js/|BN}.
           */
        this.getBalance = (addresses, assetID, asOf = undefined) => {
            const utxoids = this.getUTXOIDs(addresses);
            const utxos = this.getAllUTXOs(utxoids);
            let spend = new bn_js_1.default(0);
            let asset;
            if (typeof assetID === 'string') {
                asset = bintools.cb58Decode(assetID);
            }
            else {
                asset = assetID;
            }
            for (let i = 0; i < utxos.length; i++) {
                if (utxos[i].getOutput() instanceof output_1.StandardAmountOutput
                    && utxos[i].getAssetID().toString('hex') === asset.toString('hex')
                    && utxos[i].getOutput().meetsThreshold(addresses, asOf)) {
                    spend = spend.add(utxos[i].getOutput().getAmount());
                }
            }
            return spend;
        };
        /**
           * Gets all the Asset IDs, optionally that match with Asset IDs in an array
           *
           * @param utxoids An optional array of Addresses as string or Buffer, returns all Asset IDs if not provided
           *
           * @returns An array of {@link https://github.com/feross/buffer|Buffer} representing the Asset IDs.
           */
        this.getAssetIDs = (addresses = undefined) => {
            const results = new Set();
            let utxoids = [];
            if (typeof addresses !== 'undefined') {
                utxoids = this.getUTXOIDs(addresses);
            }
            else {
                utxoids = this.getUTXOIDs();
            }
            for (let i = 0; i < utxoids.length; i++) {
                if (utxoids[i] in this.utxos && !(utxoids[i] in results)) {
                    results.add(this.utxos[utxoids[i]].getAssetID());
                }
            }
            return [...results];
        };
        /**
           * Returns a new set with copy of UTXOs in this and set parameter.
           *
           * @param utxoset The [[StandardUTXOSet]] to merge with this one
           * @param hasUTXOIDs Will subselect a set of [[StandardUTXO]]s which have the UTXOIDs provided in this array, defults to all UTXOs
           *
           * @returns A new StandardUTXOSet that contains all the filtered elements.
           */
        this.merge = (utxoset, hasUTXOIDs = undefined) => {
            const results = this.create();
            const utxos1 = this.getAllUTXOs(hasUTXOIDs);
            const utxos2 = utxoset.getAllUTXOs(hasUTXOIDs);
            const process = (utxo) => {
                results.add(utxo);
            };
            utxos1.forEach(process);
            utxos2.forEach(process);
            return results;
        };
        /**
           * Set intersetion between this set and a parameter.
           *
           * @param utxoset The set to intersect
           *
           * @returns A new StandardUTXOSet containing the intersection
           */
        this.intersection = (utxoset) => {
            const us1 = this.getUTXOIDs();
            const us2 = utxoset.getUTXOIDs();
            const results = us1.filter((utxoid) => us2.includes(utxoid));
            return this.merge(utxoset, results);
        };
        /**
           * Set difference between this set and a parameter.
           *
           * @param utxoset The set to difference
           *
           * @returns A new StandardUTXOSet containing the difference
           */
        this.difference = (utxoset) => {
            const us1 = this.getUTXOIDs();
            const us2 = utxoset.getUTXOIDs();
            const results = us1.filter((utxoid) => !us2.includes(utxoid));
            return this.merge(utxoset, results);
        };
        /**
           * Set symmetrical difference between this set and a parameter.
           *
           * @param utxoset The set to symmetrical difference
           *
           * @returns A new StandardUTXOSet containing the symmetrical difference
           */
        this.symDifference = (utxoset) => {
            const us1 = this.getUTXOIDs();
            const us2 = utxoset.getUTXOIDs();
            const results = us1.filter((utxoid) => !us2.includes(utxoid))
                .concat(us2.filter((utxoid) => !us1.includes(utxoid)));
            return this.merge(utxoset, results);
        };
        /**
           * Set union between this set and a parameter.
           *
           * @param utxoset The set to union
           *
           * @returns A new StandardUTXOSet containing the union
           */
        this.union = (utxoset) => this.merge(utxoset);
        /**
           * Merges a set by the rule provided.
           *
           * @param utxoset The set to merge by the MergeRule
           * @param mergeRule The [[MergeRule]] to apply
           *
           * @returns A new StandardUTXOSet containing the merged data
           *
           * @remarks
           * The merge rules are as follows:
           *   * "intersection" - the intersection of the set
           *   * "differenceSelf" - the difference between the existing data and new set
           *   * "differenceNew" - the difference between the new data and the existing set
           *   * "symDifference" - the union of the differences between both sets of data
           *   * "union" - the unique set of all elements contained in both sets
           *   * "unionMinusNew" - the unique set of all elements contained in both sets, excluding values only found in the new set
           *   * "unionMinusSelf" - the unique set of all elements contained in both sets, excluding values only found in the existing set
           */
        this.mergeByRule = (utxoset, mergeRule) => {
            let uSet;
            switch (mergeRule) {
                case 'intersection':
                    return this.intersection(utxoset);
                case 'differenceSelf':
                    return this.difference(utxoset);
                case 'differenceNew':
                    return utxoset.difference(this);
                case 'symDifference':
                    return this.symDifference(utxoset);
                case 'union':
                    return this.union(utxoset);
                case 'unionMinusNew':
                    uSet = this.union(utxoset);
                    return uSet.difference(utxoset);
                case 'unionMinusSelf':
                    uSet = this.union(utxoset);
                    return uSet.difference(this);
                default:
                    throw new Error("Error - StandardUTXOSet.mergeByRule: bad MergeRule");
            }
        };
    }
    serialize(encoding = "hex") {
        let fields = super.serialize(encoding);
        let utxos = {};
        for (let utxoid in this.utxos) {
            let utxoidCleaned = serializer.encoder(utxoid, encoding, "base58", "base58");
            utxos[utxoidCleaned] = this.utxos[utxoid].serialize(encoding);
        }
        let addressUTXOs = {};
        for (let address in this.addressUTXOs) {
            let addressCleaned = serializer.encoder(address, encoding, "hex", "cb58");
            let utxobalance = {};
            for (let utxoid in this.addressUTXOs[address]) {
                let utxoidCleaned = serializer.encoder(utxoid, encoding, "base58", "base58");
                utxobalance[utxoidCleaned] = serializer.encoder(this.addressUTXOs[address][utxoid], encoding, "BN", "decimalString");
            }
            addressUTXOs[addressCleaned] = utxobalance;
        }
        return Object.assign(Object.assign({}, fields), { utxos,
            addressUTXOs });
    }
    ;
    /**
       * Adds a [[StandardUTXO]] to the StandardUTXOSet.
       *
       * @param utxo Either a [[StandardUTXO]] an cb58 serialized string representing a StandardUTXO
       * @param overwrite If true, if the UTXOID already exists, overwrite it... default false
       *
       * @returns A [[StandardUTXO]] if one was added and undefined if nothing was added.
       */
    add(utxo, overwrite = false) {
        let utxovar = undefined;
        try {
            utxovar = this.parseUTXO(utxo);
        }
        catch (e) {
            if (e instanceof Error) {
                console.log(e.message);
            }
            else {
                console.log(e);
            }
            return undefined;
        }
        const utxoid = utxovar.getUTXOID();
        if (!(utxoid in this.utxos) || overwrite === true) {
            this.utxos[utxoid] = utxovar;
            const addresses = utxovar.getOutput().getAddresses();
            const locktime = utxovar.getOutput().getLocktime();
            for (let i = 0; i < addresses.length; i++) {
                const address = addresses[i].toString('hex');
                if (!(address in this.addressUTXOs)) {
                    this.addressUTXOs[address] = {};
                }
                this.addressUTXOs[address][utxoid] = locktime;
            }
            return utxovar;
        }
        return undefined;
    }
    ;
    /**
       * Adds an array of [[StandardUTXO]]s to the [[StandardUTXOSet]].
       *
       * @param utxo Either a [[StandardUTXO]] an cb58 serialized string representing a StandardUTXO
       * @param overwrite If true, if the UTXOID already exists, overwrite it... default false
       *
       * @returns An array of StandardUTXOs which were added.
       */
    addArray(utxos, overwrite = false) {
        const added = [];
        for (let i = 0; i < utxos.length; i++) {
            let result = this.add(utxos[i], overwrite);
            if (typeof result !== 'undefined') {
                added.push(result);
            }
        }
        return added;
    }
    ;
    filter(args, lambda) {
        let newset = this.clone();
        let utxos = this.getAllUTXOs();
        for (let i = 0; i < utxos.length; i++) {
            if (lambda(utxos[i], ...args) === false) {
                newset.remove(utxos[i]);
            }
        }
        return newset;
    }
}
exports.StandardUTXOSet = StandardUTXOSet;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXR4b3MuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvY29tbW9uL3V0eG9zLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBOzs7R0FHRztBQUNILG9DQUFpQztBQUNqQyxpRUFBeUM7QUFDekMsa0RBQXVCO0FBQ3ZCLHFDQUF3RDtBQUN4RCw4REFBbUQ7QUFFbkQsMERBQXlGO0FBRXpGOztHQUVHO0FBQ0gsTUFBTSxRQUFRLEdBQUcsa0JBQVEsQ0FBQyxXQUFXLEVBQUUsQ0FBQztBQUN4QyxNQUFNLFVBQVUsR0FBRyw2QkFBYSxDQUFDLFdBQVcsRUFBRSxDQUFDO0FBRS9DOztHQUVHO0FBQ0gsTUFBc0IsWUFBYSxTQUFRLDRCQUFZO0lBd0dyRDs7Ozs7Ozs7U0FRSztJQUNMLFlBQVksVUFBaUIsQ0FBQyxFQUFFLE9BQWMsU0FBUyxFQUNyRCxZQUE0QixTQUFTLEVBQ3JDLFVBQWlCLFNBQVMsRUFDMUIsU0FBZ0IsU0FBUztRQUN6QixLQUFLLEVBQUUsQ0FBQztRQXBIQSxjQUFTLEdBQUcsY0FBYyxDQUFDO1FBQzNCLFlBQU8sR0FBRyxTQUFTLENBQUM7UUFxQnBCLFlBQU8sR0FBVSxlQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ2pDLFNBQUksR0FBVSxlQUFNLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxDQUFDO1FBQy9CLGNBQVMsR0FBVSxlQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ25DLFlBQU8sR0FBVSxlQUFNLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxDQUFDO1FBQ2xDLFdBQU0sR0FBVSxTQUFTLENBQUM7UUFFcEM7O2FBRUs7UUFDTCxlQUFVLEdBQUcsR0FFTCxFQUFFLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFFckM7O1lBRUk7UUFDSixxQkFBZ0IsR0FBRyxHQUFVLEVBQUUsQ0FBQyxJQUFJLENB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QUM7SUFDbkIsQ0FBQztJQUFBLENBQUM7SUFFRjs7Ozs7OztTQU9LO0lBQ0wsUUFBUSxDQUFDLEtBQStCLEVBQUUsWUFBb0IsS0FBSztRQUNqRSxNQUFNLEtBQUssR0FBb0IsRUFBRSxDQUFDO1FBQ2xDLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxLQUFLLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFO1lBQ3JDLElBQUksTUFBTSxHQUFhLElBQUksQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFFLFNBQVMsQ0FBQyxDQUFDO1lBQ3JELElBQUksT0FBTyxNQUFNLEtBQUssV0FBVyxFQUFFO2dCQUMvQixLQUFLLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO2FBQ3RCO1NBQ0Y7UUFDRCxPQUFPLEtBQUssQ0FBQztJQUNmLENBQUM7SUFBQSxDQUFDO0lBME1GLE1BQU0sQ0FBQyxJQUFVLEVBQUUsTUFBa0Q7UUFDbkUsSUFBSSxNQUFNLEdBQVEsSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO1FBQy9CLElBQUksS0FBSyxHQUFvQixJQUFJLENBQUMsV0FBVyxFQUFFLENBQUM7UUFDaEQsS0FBSSxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEtBQUssQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUM7WUFDbkMsSUFBRyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFFLEdBQUcsSUFBSSxDQUFDLEtBQUssS0FBSyxFQUFFO2dCQUN0QyxNQUFNLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO2FBQ3pCO1NBQ0Y7UUFDRCxPQUFPLE1BQU0sQ0FBQztJQUNoQixDQUFDO0NBbUhGO0FBcGJELDBDQW9iQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQHBhY2thZ2VEb2N1bWVudGF0aW9uXG4gKiBAbW9kdWxlIENvbW1vbi1VVFhPc1xuICovXG5pbXBvcnQgeyBCdWZmZXIgfSBmcm9tICdidWZmZXIvJztcbmltcG9ydCBCaW5Ub29scyBmcm9tICcuLi91dGlscy9iaW50b29scyc7XG5pbXBvcnQgQk4gZnJvbSBcImJuLmpzXCI7XG5pbXBvcnQgeyBPdXRwdXQsIFN0YW5kYXJkQW1vdW50T3V0cHV0IH0gZnJvbSAnLi9vdXRwdXQnO1xuaW1wb3J0IHsgVW5peE5vdyB9IGZyb20gJy4uL3V0aWxzL2hlbHBlcmZ1bmN0aW9ucyc7XG5pbXBvcnQgeyBNZXJnZVJ1bGUgfSBmcm9tICcuLi91dGlscy9jb25zdGFudHMnO1xuaW1wb3J0IHsgU2VyaWFsaXphYmxlLCBTZXJpYWxpemF0aW9uLCBTZXJpYWxpemVkRW5jb2RpbmcgfSBmcm9tICcuLi91dGlscy9zZXJpYWxpemF0aW9uJztcblxuLyoqXG4gKiBAaWdub3JlXG4gKi9cbmNvbnN0IGJpbnRvb2xzID0gQmluVG9vbHMuZ2V0SW5zdGFuY2UoKTtcbmNvbnN0IHNlcmlhbGl6ZXIgPSBTZXJpYWxpemF0aW9uLmdldEluc3RhbmNlKCk7XG5cbi8qKlxuICogQ2xhc3MgZm9yIHJlcHJlc2VudGluZyBhIHNpbmdsZSBTdGFuZGFyZFVUWE8uXG4gKi9cbmV4cG9ydCBhYnN0cmFjdCBjbGFzcyBTdGFuZGFyZFVUWE8gZXh0ZW5kcyBTZXJpYWxpemFibGV7XG4gIHByb3RlY3RlZCBfdHlwZU5hbWUgPSBcIlN0YW5kYXJkVVRYT1wiO1xuICBwcm90ZWN0ZWQgX3R5cGVJRCA9IHVuZGVmaW5lZDtcblxuICBzZXJpYWxpemUoZW5jb2Rpbmc6U2VyaWFsaXplZEVuY29kaW5nID0gXCJoZXhcIik6b2JqZWN0IHtcbiAgICBsZXQgZmllbGRzOm9iamVjdCA9IHN1cGVyLnNlcmlhbGl6ZShlbmNvZGluZyk7XG4gICAgcmV0dXJuIHtcbiAgICAgIC4uLmZpZWxkcyxcbiAgICAgIFwiY29kZWNpZFwiOiBzZXJpYWxpemVyLmVuY29kZXIodGhpcy5jb2RlY2lkLCBlbmNvZGluZywgXCJCdWZmZXJcIiwgXCJkZWNpbWFsU3RyaW5nXCIpLFxuICAgICAgXCJ0eGlkXCI6IHNlcmlhbGl6ZXIuZW5jb2Rlcih0aGlzLnR4aWQsIGVuY29kaW5nLCBcIkJ1ZmZlclwiLCBcImNiNThcIiksXG4gICAgICBcIm91dHB1dGlkeFwiOiBzZXJpYWxpemVyLmVuY29kZXIodGhpcy5vdXRwdXRpZHgsIGVuY29kaW5nLCBcIkJ1ZmZlclwiLCBcImRlY2ltYWxTdHJpbmdcIiksXG4gICAgICBcImFzc2V0aWRcIjogc2VyaWFsaXplci5lbmNvZGVyKHRoaXMuYXNzZXRpZCwgZW5jb2RpbmcsIFwiQnVmZmVyXCIsIFwiY2I1OFwiKSxcbiAgICAgIFwib3V0cHV0XCI6IHRoaXMub3V0cHV0LnNlcmlhbGl6ZShlbmNvZGluZylcbiAgICB9XG4gIH07XG4gIGRlc2VyaWFsaXplKGZpZWxkczpvYmplY3QsIGVuY29kaW5nOlNlcmlhbGl6ZWRFbmNvZGluZyA9IFwiaGV4XCIpIHtcbiAgICBzdXBlci5kZXNlcmlhbGl6ZShmaWVsZHMsIGVuY29kaW5nKTtcbiAgICB0aGlzLmNvZGVjaWQgPSBzZXJpYWxpemVyLmRlY29kZXIoZmllbGRzW1wiY29kZWNpZFwiXSwgZW5jb2RpbmcsIFwiZGVjaW1hbFN0cmluZ1wiLCBcIkJ1ZmZlclwiLCAyKTtcbiAgICB0aGlzLnR4aWQgPSBzZXJpYWxpemVyLmRlY29kZXIoZmllbGRzW1widHhpZFwiXSwgZW5jb2RpbmcsIFwiY2I1OFwiLCBcIkJ1ZmZlclwiLCAzMik7XG4gICAgdGhpcy5vdXRwdXRpZHggPSBzZXJpYWxpemVyLmRlY29kZXIoZmllbGRzW1wib3V0cHV0aWR4XCJdLCBlbmNvZGluZywgXCJkZWNpbWFsU3RyaW5nXCIsIFwiQnVmZmVyXCIsIDQpO1xuICAgIHRoaXMuYXNzZXRpZCA9IHNlcmlhbGl6ZXIuZGVjb2RlcihmaWVsZHNbXCJhc3NldGlkXCJdLCBlbmNvZGluZywgXCJjYjU4XCIsIFwiQnVmZmVyXCIsIDMyKTtcbiAgfVxuXG4gIHByb3RlY3RlZCBjb2RlY2lkOkJ1ZmZlciA9IEJ1ZmZlci5hbGxvYygyKTtcbiAgcHJvdGVjdGVkIHR4aWQ6QnVmZmVyID0gQnVmZmVyLmFsbG9jKDMyKTtcbiAgcHJvdGVjdGVkIG91dHB1dGlkeDpCdWZmZXIgPSBCdWZmZXIuYWxsb2MoNCk7XG4gIHByb3RlY3RlZCBhc3NldGlkOkJ1ZmZlciA9IEJ1ZmZlci5hbGxvYygzMik7XG4gIHByb3RlY3RlZCBvdXRwdXQ6T3V0cHV0ID0gdW5kZWZpbmVkO1xuXG4gIC8qKlxuICAgICAqIFJldHVybnMgdGhlIG51bWVyaWMgcmVwcmVzZW50YXRpb24gb2YgdGhlIENvZGVjSUQuXG4gICAgICovXG4gIGdldENvZGVjSUQgPSAoKVxuICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xuICA6bnVtYmVyID0+IHRoaXMuY29kZWNpZC5yZWFkVUludDgoMCk7XG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IHJlcHJlc2VudGF0aW9uIG9mIHRoZSBDb2RlY0lEXG4gICAgKi9cbiAgZ2V0Q29kZWNJREJ1ZmZlciA9ICgpOkJ1ZmZlciA9PiB0aGlzLmNvZGVjaWQ7XG5cbiAgLyoqXG4gICAgICogUmV0dXJucyBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IG9mIHRoZSBUeElELlxuICAgICAqL1xuICBnZXRUeElEID0gKClcbiAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cbiAgOkJ1ZmZlciA9PiB0aGlzLnR4aWQ7XG5cbiAgLyoqXG4gICAgICogUmV0dXJucyBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9ICBvZiB0aGUgT3V0cHV0SWR4LlxuICAgICAqL1xuICBnZXRPdXRwdXRJZHggPSAoKVxuICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xuICA6QnVmZmVyID0+IHRoaXMub3V0cHV0aWR4O1xuXG4gIC8qKlxuICAgICAqIFJldHVybnMgdGhlIGFzc2V0SUQgYXMgYSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfS5cbiAgICAgKi9cbiAgZ2V0QXNzZXRJRCA9ICgpOkJ1ZmZlciA9PiB0aGlzLmFzc2V0aWQ7XG5cbiAgLyoqXG4gICAgICogUmV0dXJucyB0aGUgVVRYT0lEIGFzIGEgYmFzZS01OCBzdHJpbmcgKFVUWE9JRCBpcyBhIHN0cmluZyApXG4gICAgICovXG4gIGdldFVUWE9JRCA9ICgpXG4gIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXG4gIDpzdHJpbmcgPT4gYmludG9vbHMuYnVmZmVyVG9CNTgoQnVmZmVyLmNvbmNhdChbdGhpcy5nZXRUeElEKCksIHRoaXMuZ2V0T3V0cHV0SWR4KCldKSk7XG5cbiAgLyoqXG4gICAqIFJldHVybnMgYSByZWZlcmVuY2UgdG8gdGhlIG91dHB1dDtcbiAgKi9cbiAgZ2V0T3V0cHV0ID0gKCk6T3V0cHV0ID0+IHRoaXMub3V0cHV0O1xuXG4gIC8qKlxuICAgKiBUYWtlcyBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IGNvbnRhaW5pbmcgYW4gW1tTdGFuZGFyZFVUWE9dXSwgcGFyc2VzIGl0LCBwb3B1bGF0ZXMgdGhlIGNsYXNzLCBhbmQgcmV0dXJucyB0aGUgbGVuZ3RoIG9mIHRoZSBTdGFuZGFyZFVUWE8gaW4gYnl0ZXMuXG4gICAqXG4gICAqIEBwYXJhbSBieXRlcyBBIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IGNvbnRhaW5pbmcgYSByYXcgW1tTdGFuZGFyZFVUWE9dXVxuICAgKi9cbiAgYWJzdHJhY3QgZnJvbUJ1ZmZlcihieXRlczpCdWZmZXIsIG9mZnNldD86bnVtYmVyKTpudW1iZXI7XG5cbiAgLyoqXG4gICAgICogUmV0dXJucyBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IHJlcHJlc2VudGF0aW9uIG9mIHRoZSBbW1N0YW5kYXJkVVRYT11dLlxuICAgICAqL1xuICB0b0J1ZmZlcigpOkJ1ZmZlciB7XG4gICAgY29uc3Qgb3V0YnVmZjpCdWZmZXIgPSB0aGlzLm91dHB1dC50b0J1ZmZlcigpO1xuICAgIGNvbnN0IG91dHB1dGlkYnVmZmVyOkJ1ZmZlciA9IEJ1ZmZlci5hbGxvYyg0KTtcbiAgICBvdXRwdXRpZGJ1ZmZlci53cml0ZVVJbnQzMkJFKHRoaXMub3V0cHV0LmdldE91dHB1dElEKCksIDApO1xuICAgIGNvbnN0IGJhcnI6QXJyYXk8QnVmZmVyPiA9IFt0aGlzLmNvZGVjaWQsIHRoaXMudHhpZCwgdGhpcy5vdXRwdXRpZHgsIHRoaXMuYXNzZXRpZCwgb3V0cHV0aWRidWZmZXIsIG91dGJ1ZmZdO1xuICAgIHJldHVybiBCdWZmZXIuY29uY2F0KGJhcnIsIFxuICAgICAgdGhpcy5jb2RlY2lkLmxlbmd0aCArIHRoaXMudHhpZC5sZW5ndGggXG4gICAgICArIHRoaXMub3V0cHV0aWR4Lmxlbmd0aCArIHRoaXMuYXNzZXRpZC5sZW5ndGhcbiAgICAgICsgb3V0cHV0aWRidWZmZXIubGVuZ3RoICsgb3V0YnVmZi5sZW5ndGgpO1xuICB9XG5cbiAgYWJzdHJhY3QgZnJvbVN0cmluZyhzZXJpYWxpemVkOnN0cmluZyk6bnVtYmVyO1xuXG4gIGFic3RyYWN0IHRvU3RyaW5nKCk6c3RyaW5nO1xuXG4gIGFic3RyYWN0IGNsb25lKCk6dGhpcztcblxuICBhYnN0cmFjdCBjcmVhdGUoY29kZWNJRD86bnVtYmVyLCB0eGlkPzpCdWZmZXIsXG4gICAgb3V0cHV0aWR4PzpCdWZmZXIgfCBudW1iZXIsXG4gICAgYXNzZXRpZD86QnVmZmVyLFxuICAgIG91dHB1dD86T3V0cHV0KTp0aGlzO1xuXG4gIC8qKlxuICAgICAqIENsYXNzIGZvciByZXByZXNlbnRpbmcgYSBzaW5nbGUgU3RhbmRhcmRVVFhPLlxuICAgICAqXG4gICAgICogQHBhcmFtIGNvZGVjSUQgT3B0aW9uYWwgbnVtYmVyIHdoaWNoIHNwZWNpZmllcyB0aGUgY29kZUlEIG9mIHRoZSBVVFhPLiBEZWZhdWx0IDFcbiAgICAgKiBAcGFyYW0gdHhpZCBPcHRpb25hbCB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSBvZiB0cmFuc2FjdGlvbiBJRCBmb3IgdGhlIFN0YW5kYXJkVVRYT1xuICAgICAqIEBwYXJhbSB0eGlkeCBPcHRpb25hbCB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSBvciBudW1iZXIgZm9yIHRoZSBpbmRleCBvZiB0aGUgdHJhbnNhY3Rpb24ncyBbW091dHB1dF1dXG4gICAgICogQHBhcmFtIGFzc2V0aWQgT3B0aW9uYWwge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0gb2YgdGhlIGFzc2V0IElEIGZvciB0aGUgU3RhbmRhcmRVVFhPXG4gICAgICogQHBhcmFtIG91dHB1dGlkIE9wdGlvbmFsIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IG9yIG51bWJlciBvZiB0aGUgb3V0cHV0IElEIGZvciB0aGUgU3RhbmRhcmRVVFhPXG4gICAgICovXG4gIGNvbnN0cnVjdG9yKGNvZGVjSUQ6bnVtYmVyID0gMCwgdHhpZDpCdWZmZXIgPSB1bmRlZmluZWQsXG4gICAgb3V0cHV0aWR4OkJ1ZmZlciB8IG51bWJlciA9IHVuZGVmaW5lZCxcbiAgICBhc3NldGlkOkJ1ZmZlciA9IHVuZGVmaW5lZCxcbiAgICBvdXRwdXQ6T3V0cHV0ID0gdW5kZWZpbmVkKXtcbiAgICBzdXBlcigpO1xuICAgIGlmICh0eXBlb2YgY29kZWNJRCAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgIHRoaXMuY29kZWNpZCAud3JpdGVVSW50OChjb2RlY0lELCAwKTtcbiAgICB9XG4gICAgaWYodHlwZW9mIHR4aWQgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICB0aGlzLnR4aWQgPSB0eGlkO1xuICAgIH1cbiAgICBpZiAodHlwZW9mIG91dHB1dGlkeCA9PT0gJ251bWJlcicpIHtcbiAgICAgIHRoaXMub3V0cHV0aWR4LndyaXRlVUludDMyQkUob3V0cHV0aWR4LCAwKTtcbiAgICB9IGVsc2UgaWYgKG91dHB1dGlkeCBpbnN0YW5jZW9mIEJ1ZmZlcikge1xuICAgICAgdGhpcy5vdXRwdXRpZHggPSBvdXRwdXRpZHg7XG4gICAgfSBcblxuICAgIGlmKHR5cGVvZiBhc3NldGlkICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgdGhpcy5hc3NldGlkID0gYXNzZXRpZDtcbiAgICB9XG4gICAgaWYodHlwZW9mIG91dHB1dCAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgIHRoaXMub3V0cHV0ID0gb3V0cHV0O1xuICAgIH1cbiAgICAgIFxuICB9XG59XG4vKipcbiAqIENsYXNzIHJlcHJlc2VudGluZyBhIHNldCBvZiBbW1N0YW5kYXJkVVRYT11dcy5cbiAqL1xuZXhwb3J0IGFic3RyYWN0IGNsYXNzIFN0YW5kYXJkVVRYT1NldDxVVFhPQ2xhc3MgZXh0ZW5kcyBTdGFuZGFyZFVUWE8+IGV4dGVuZHMgU2VyaWFsaXphYmxle1xuICBwcm90ZWN0ZWQgX3R5cGVOYW1lID0gXCJTdGFuZGFyZFVUWE9TZXRcIjtcbiAgcHJvdGVjdGVkIF90eXBlSUQgPSB1bmRlZmluZWQ7XG5cbiAgc2VyaWFsaXplKGVuY29kaW5nOlNlcmlhbGl6ZWRFbmNvZGluZyA9IFwiaGV4XCIpOm9iamVjdCB7XG4gICAgbGV0IGZpZWxkczpvYmplY3QgPSBzdXBlci5zZXJpYWxpemUoZW5jb2RpbmcpO1xuICAgIGxldCB1dHhvcyA9IHt9O1xuICAgIGZvcihsZXQgdXR4b2lkIGluIHRoaXMudXR4b3MpIHtcbiAgICAgIGxldCB1dHhvaWRDbGVhbmVkOnN0cmluZyA9IHNlcmlhbGl6ZXIuZW5jb2Rlcih1dHhvaWQsIGVuY29kaW5nLCBcImJhc2U1OFwiLCBcImJhc2U1OFwiKTtcbiAgICAgIHV0eG9zW3V0eG9pZENsZWFuZWRdID0gdGhpcy51dHhvc1t1dHhvaWRdLnNlcmlhbGl6ZShlbmNvZGluZyk7XG4gICAgfVxuICAgIGxldCBhZGRyZXNzVVRYT3MgPSB7fTtcbiAgICBmb3IobGV0IGFkZHJlc3MgaW4gdGhpcy5hZGRyZXNzVVRYT3MpIHtcbiAgICAgIGxldCBhZGRyZXNzQ2xlYW5lZDpzdHJpbmcgPSBzZXJpYWxpemVyLmVuY29kZXIoYWRkcmVzcywgZW5jb2RpbmcsIFwiaGV4XCIsIFwiY2I1OFwiKTtcbiAgICAgIGxldCB1dHhvYmFsYW5jZSA9IHt9O1xuICAgICAgZm9yKGxldCB1dHhvaWQgaW4gdGhpcy5hZGRyZXNzVVRYT3NbYWRkcmVzc10pe1xuICAgICAgICBsZXQgdXR4b2lkQ2xlYW5lZDpzdHJpbmcgPSBzZXJpYWxpemVyLmVuY29kZXIodXR4b2lkLCBlbmNvZGluZywgXCJiYXNlNThcIiwgXCJiYXNlNThcIik7XG4gICAgICAgIHV0eG9iYWxhbmNlW3V0eG9pZENsZWFuZWRdID0gc2VyaWFsaXplci5lbmNvZGVyKHRoaXMuYWRkcmVzc1VUWE9zW2FkZHJlc3NdW3V0eG9pZF0sIGVuY29kaW5nLCBcIkJOXCIsIFwiZGVjaW1hbFN0cmluZ1wiKTtcbiAgICAgIH1cbiAgICAgIGFkZHJlc3NVVFhPc1thZGRyZXNzQ2xlYW5lZF0gPSB1dHhvYmFsYW5jZTtcbiAgICB9XG4gICAgcmV0dXJuIHtcbiAgICAgIC4uLmZpZWxkcyxcbiAgICAgIHV0eG9zLFxuICAgICAgYWRkcmVzc1VUWE9zXG4gICAgfVxuICB9O1xuXG4gIHByb3RlY3RlZCB1dHhvczp7W3V0eG9pZDogc3RyaW5nXTogVVRYT0NsYXNzIH0gPSB7fTtcbiAgcHJvdGVjdGVkIGFkZHJlc3NVVFhPczp7W2FkZHJlc3M6IHN0cmluZ106IHtbdXR4b2lkOiBzdHJpbmddOiBCTn19ID0ge307IC8vIG1hcHMgYWRkcmVzcyB0byB1dHhvaWRzOmxvY2t0aW1lXG5cbiAgYWJzdHJhY3QgcGFyc2VVVFhPKHV0eG86VVRYT0NsYXNzIHwgc3RyaW5nKTpVVFhPQ2xhc3M7XG5cbiAgLyoqXG4gICAqIFJldHVybnMgdHJ1ZSBpZiB0aGUgW1tTdGFuZGFyZFVUWE9dXSBpcyBpbiB0aGUgU3RhbmRhcmRVVFhPU2V0LlxuICAgKlxuICAgKiBAcGFyYW0gdXR4byBFaXRoZXIgYSBbW1N0YW5kYXJkVVRYT11dIGEgY2I1OCBzZXJpYWxpemVkIHN0cmluZyByZXByZXNlbnRpbmcgYSBTdGFuZGFyZFVUWE9cbiAgICovXG4gIGluY2x1ZGVzID0gKHV0eG86VVRYT0NsYXNzIHwgc3RyaW5nKTpib29sZWFuID0+IHtcbiAgICBsZXQgdXR4b1g6VVRYT0NsYXNzID0gdW5kZWZpbmVkO1xuICAgIGxldCB1dHhvaWQ6c3RyaW5nID0gdW5kZWZpbmVkO1xuICAgIHRyeSB7XG4gICAgICB1dHhvWCA9IHRoaXMucGFyc2VVVFhPKHV0eG8pO1xuICAgICAgdXR4b2lkID0gdXR4b1guZ2V0VVRYT0lEKCk7XG4gICAgfSBjYXRjaChlKSB7XG4gICAgICBpZihlIGluc3RhbmNlb2YgRXJyb3Ipe1xuICAgICAgICBjb25zb2xlLmxvZyhlLm1lc3NhZ2UpO1xuICAgICAgfSBlbHNleyBcbiAgICAgICAgY29uc29sZS5sb2coZSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIHJldHVybiAodXR4b2lkIGluIHRoaXMudXR4b3MpO1xuICB9O1xuXG4gIC8qKlxuICAgICAqIEFkZHMgYSBbW1N0YW5kYXJkVVRYT11dIHRvIHRoZSBTdGFuZGFyZFVUWE9TZXQuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gdXR4byBFaXRoZXIgYSBbW1N0YW5kYXJkVVRYT11dIGFuIGNiNTggc2VyaWFsaXplZCBzdHJpbmcgcmVwcmVzZW50aW5nIGEgU3RhbmRhcmRVVFhPXG4gICAgICogQHBhcmFtIG92ZXJ3cml0ZSBJZiB0cnVlLCBpZiB0aGUgVVRYT0lEIGFscmVhZHkgZXhpc3RzLCBvdmVyd3JpdGUgaXQuLi4gZGVmYXVsdCBmYWxzZVxuICAgICAqXG4gICAgICogQHJldHVybnMgQSBbW1N0YW5kYXJkVVRYT11dIGlmIG9uZSB3YXMgYWRkZWQgYW5kIHVuZGVmaW5lZCBpZiBub3RoaW5nIHdhcyBhZGRlZC5cbiAgICAgKi9cbiAgYWRkKHV0eG86VVRYT0NsYXNzIHwgc3RyaW5nLCBvdmVyd3JpdGU6Ym9vbGVhbiA9IGZhbHNlKTpVVFhPQ2xhc3Mge1xuICAgIGxldCB1dHhvdmFyOlVUWE9DbGFzcyA9IHVuZGVmaW5lZDtcbiAgICB0cnkge1xuICAgICAgdXR4b3ZhciA9IHRoaXMucGFyc2VVVFhPKHV0eG8pO1xuICAgIH0gY2F0Y2goZSkge1xuICAgICAgaWYoZSBpbnN0YW5jZW9mIEVycm9yKXtcbiAgICAgICAgY29uc29sZS5sb2coZS5tZXNzYWdlKTtcbiAgICAgIH0gZWxzZXsgXG4gICAgICAgIGNvbnNvbGUubG9nKGUpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHVuZGVmaW5lZDsgXG4gICAgfVxuXG4gICAgY29uc3QgdXR4b2lkOnN0cmluZyA9IHV0eG92YXIuZ2V0VVRYT0lEKCk7XG4gICAgaWYgKCEodXR4b2lkIGluIHRoaXMudXR4b3MpIHx8IG92ZXJ3cml0ZSA9PT0gdHJ1ZSkge1xuICAgICAgdGhpcy51dHhvc1t1dHhvaWRdID0gdXR4b3ZhcjtcbiAgICAgIGNvbnN0IGFkZHJlc3NlczpBcnJheTxCdWZmZXI+ID0gdXR4b3Zhci5nZXRPdXRwdXQoKS5nZXRBZGRyZXNzZXMoKTtcbiAgICAgIGNvbnN0IGxvY2t0aW1lOkJOID0gdXR4b3Zhci5nZXRPdXRwdXQoKS5nZXRMb2NrdGltZSgpO1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBhZGRyZXNzZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgY29uc3QgYWRkcmVzczpzdHJpbmcgPSBhZGRyZXNzZXNbaV0udG9TdHJpbmcoJ2hleCcpO1xuICAgICAgICBpZiAoIShhZGRyZXNzIGluIHRoaXMuYWRkcmVzc1VUWE9zKSkge1xuICAgICAgICAgIHRoaXMuYWRkcmVzc1VUWE9zW2FkZHJlc3NdID0ge307XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5hZGRyZXNzVVRYT3NbYWRkcmVzc11bdXR4b2lkXSA9IGxvY2t0aW1lO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHV0eG92YXI7XG4gICAgfVxuICAgIHJldHVybiB1bmRlZmluZWQ7XG4gIH07XG5cbiAgLyoqXG4gICAgICogQWRkcyBhbiBhcnJheSBvZiBbW1N0YW5kYXJkVVRYT11dcyB0byB0aGUgW1tTdGFuZGFyZFVUWE9TZXRdXS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB1dHhvIEVpdGhlciBhIFtbU3RhbmRhcmRVVFhPXV0gYW4gY2I1OCBzZXJpYWxpemVkIHN0cmluZyByZXByZXNlbnRpbmcgYSBTdGFuZGFyZFVUWE9cbiAgICAgKiBAcGFyYW0gb3ZlcndyaXRlIElmIHRydWUsIGlmIHRoZSBVVFhPSUQgYWxyZWFkeSBleGlzdHMsIG92ZXJ3cml0ZSBpdC4uLiBkZWZhdWx0IGZhbHNlXG4gICAgICpcbiAgICAgKiBAcmV0dXJucyBBbiBhcnJheSBvZiBTdGFuZGFyZFVUWE9zIHdoaWNoIHdlcmUgYWRkZWQuXG4gICAgICovXG4gIGFkZEFycmF5KHV0eG9zOkFycmF5PHN0cmluZyB8IFVUWE9DbGFzcz4sIG92ZXJ3cml0ZTpib29sZWFuID0gZmFsc2UpOkFycmF5PFN0YW5kYXJkVVRYTz4ge1xuICAgIGNvbnN0IGFkZGVkOkFycmF5PFVUWE9DbGFzcz4gPSBbXTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHV0eG9zLmxlbmd0aDsgaSsrKSB7XG4gICAgICBsZXQgcmVzdWx0OlVUWE9DbGFzcyA9IHRoaXMuYWRkKHV0eG9zW2ldLCBvdmVyd3JpdGUpO1xuICAgICAgaWYgKHR5cGVvZiByZXN1bHQgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgYWRkZWQucHVzaChyZXN1bHQpO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gYWRkZWQ7XG4gIH07XG5cbiAgLyoqXG4gICAgICogUmVtb3ZlcyBhIFtbU3RhbmRhcmRVVFhPXV0gZnJvbSB0aGUgW1tTdGFuZGFyZFVUWE9TZXRdXSBpZiBpdCBleGlzdHMuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gdXR4byBFaXRoZXIgYSBbW1N0YW5kYXJkVVRYT11dIGFuIGNiNTggc2VyaWFsaXplZCBzdHJpbmcgcmVwcmVzZW50aW5nIGEgU3RhbmRhcmRVVFhPXG4gICAgICpcbiAgICAgKiBAcmV0dXJucyBBIFtbU3RhbmRhcmRVVFhPXV0gaWYgaXQgd2FzIHJlbW92ZWQgYW5kIHVuZGVmaW5lZCBpZiBub3RoaW5nIHdhcyByZW1vdmVkLlxuICAgICAqL1xuICByZW1vdmUgPSAodXR4bzpVVFhPQ2xhc3MgfCBzdHJpbmcpOlVUWE9DbGFzcyA9PiB7XG4gICAgbGV0IHV0eG92YXI6VVRYT0NsYXNzID0gdW5kZWZpbmVkO1xuICAgIHRyeSB7XG4gICAgICB1dHhvdmFyID0gdGhpcy5wYXJzZVVUWE8odXR4byk7XG4gICAgfSBjYXRjaChlKSB7XG4gICAgICBpZihlIGluc3RhbmNlb2YgRXJyb3Ipe1xuICAgICAgICBjb25zb2xlLmxvZyhlLm1lc3NhZ2UpO1xuICAgICAgfSBlbHNleyBcbiAgICAgICAgY29uc29sZS5sb2coZSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gdW5kZWZpbmVkOyBcbiAgICB9XG5cbiAgICBjb25zdCB1dHhvaWQ6c3RyaW5nID0gdXR4b3Zhci5nZXRVVFhPSUQoKTtcbiAgICBpZiAoISh1dHhvaWQgaW4gdGhpcy51dHhvcykpIHtcbiAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgfVxuICAgIGRlbGV0ZSB0aGlzLnV0eG9zW3V0eG9pZF07XG4gICAgY29uc3QgYWRkcmVzc2VzID0gT2JqZWN0LmtleXModGhpcy5hZGRyZXNzVVRYT3MpO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgYWRkcmVzc2VzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBpZiAodXR4b2lkIGluIHRoaXMuYWRkcmVzc1VUWE9zW2FkZHJlc3Nlc1tpXV0pIHtcbiAgICAgICAgZGVsZXRlIHRoaXMuYWRkcmVzc1VUWE9zW2FkZHJlc3Nlc1tpXV1bdXR4b2lkXTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHV0eG92YXI7XG4gIH07XG5cbiAgLyoqXG4gICAgICogUmVtb3ZlcyBhbiBhcnJheSBvZiBbW1N0YW5kYXJkVVRYT11dcyB0byB0aGUgW1tTdGFuZGFyZFVUWE9TZXRdXS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB1dHhvIEVpdGhlciBhIFtbU3RhbmRhcmRVVFhPXV0gYW4gY2I1OCBzZXJpYWxpemVkIHN0cmluZyByZXByZXNlbnRpbmcgYSBTdGFuZGFyZFVUWE9cbiAgICAgKiBAcGFyYW0gb3ZlcndyaXRlIElmIHRydWUsIGlmIHRoZSBVVFhPSUQgYWxyZWFkeSBleGlzdHMsIG92ZXJ3cml0ZSBpdC4uLiBkZWZhdWx0IGZhbHNlXG4gICAgICpcbiAgICAgKiBAcmV0dXJucyBBbiBhcnJheSBvZiBVVFhPcyB3aGljaCB3ZXJlIHJlbW92ZWQuXG4gICAgICovXG4gIHJlbW92ZUFycmF5ID0gKHV0eG9zOkFycmF5PHN0cmluZyB8IFVUWE9DbGFzcz4pOkFycmF5PFVUWE9DbGFzcz4gPT4ge1xuICAgIGNvbnN0IHJlbW92ZWQ6QXJyYXk8VVRYT0NsYXNzPiA9IFtdO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdXR4b3MubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IHJlc3VsdDpVVFhPQ2xhc3MgPSB0aGlzLnJlbW92ZSh1dHhvc1tpXSk7XG4gICAgICBpZiAodHlwZW9mIHJlc3VsdCAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgcmVtb3ZlZC5wdXNoKHJlc3VsdCk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiByZW1vdmVkO1xuICB9O1xuXG4gIC8qKlxuICAgICAqIEdldHMgYSBbW1N0YW5kYXJkVVRYT11dIGZyb20gdGhlIFtbU3RhbmRhcmRVVFhPU2V0XV0gYnkgaXRzIFVUWE9JRC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB1dHhvaWQgU3RyaW5nIHJlcHJlc2VudGluZyB0aGUgVVRYT0lEXG4gICAgICpcbiAgICAgKiBAcmV0dXJucyBBIFtbU3RhbmRhcmRVVFhPXV0gaWYgaXQgZXhpc3RzIGluIHRoZSBzZXQuXG4gICAgICovXG4gIGdldFVUWE8gPSAodXR4b2lkOnN0cmluZyk6VVRYT0NsYXNzID0+IHRoaXMudXR4b3NbdXR4b2lkXTtcblxuICAvKipcbiAgICAgKiBHZXRzIGFsbCB0aGUgW1tTdGFuZGFyZFVUWE9dXXMsIG9wdGlvbmFsbHkgdGhhdCBtYXRjaCB3aXRoIFVUWE9JRHMgaW4gYW4gYXJyYXlcbiAgICAgKlxuICAgICAqIEBwYXJhbSB1dHhvaWRzIEFuIG9wdGlvbmFsIGFycmF5IG9mIFVUWE9JRHMsIHJldHVybnMgYWxsIFtbU3RhbmRhcmRVVFhPXV1zIGlmIG5vdCBwcm92aWRlZFxuICAgICAqXG4gICAgICogQHJldHVybnMgQW4gYXJyYXkgb2YgW1tTdGFuZGFyZFVUWE9dXXMuXG4gICAgICovXG4gIGdldEFsbFVUWE9zID0gKHV0eG9pZHM6QXJyYXk8c3RyaW5nPiA9IHVuZGVmaW5lZCk6QXJyYXk8VVRYT0NsYXNzPiA9PiB7XG4gICAgbGV0IHJlc3VsdHM6QXJyYXk8VVRYT0NsYXNzPiA9IFtdO1xuICAgIGlmICh0eXBlb2YgdXR4b2lkcyAhPT0gJ3VuZGVmaW5lZCcgJiYgQXJyYXkuaXNBcnJheSh1dHhvaWRzKSkge1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB1dHhvaWRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGlmICh1dHhvaWRzW2ldIGluIHRoaXMudXR4b3MgJiYgISh1dHhvaWRzW2ldIGluIHJlc3VsdHMpKSB7XG4gICAgICAgICAgcmVzdWx0cy5wdXNoKHRoaXMudXR4b3NbdXR4b2lkc1tpXV0pO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHJlc3VsdHMgPSBPYmplY3QudmFsdWVzKHRoaXMudXR4b3MpO1xuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0cztcbiAgfTtcblxuICAvKipcbiAgICAgKiBHZXRzIGFsbCB0aGUgW1tTdGFuZGFyZFVUWE9dXXMgYXMgc3RyaW5ncywgb3B0aW9uYWxseSB0aGF0IG1hdGNoIHdpdGggVVRYT0lEcyBpbiBhbiBhcnJheS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB1dHhvaWRzIEFuIG9wdGlvbmFsIGFycmF5IG9mIFVUWE9JRHMsIHJldHVybnMgYWxsIFtbU3RhbmRhcmRVVFhPXV1zIGlmIG5vdCBwcm92aWRlZFxuICAgICAqXG4gICAgICogQHJldHVybnMgQW4gYXJyYXkgb2YgW1tTdGFuZGFyZFVUWE9dXXMgYXMgY2I1OCBzZXJpYWxpemVkIHN0cmluZ3MuXG4gICAgICovXG4gIGdldEFsbFVUWE9TdHJpbmdzID0gKHV0eG9pZHM6QXJyYXk8c3RyaW5nPiA9IHVuZGVmaW5lZCk6QXJyYXk8c3RyaW5nPiA9PiB7XG4gICAgY29uc3QgcmVzdWx0czpBcnJheTxzdHJpbmc+ID0gW107XG4gICAgY29uc3QgdXR4b3MgPSBPYmplY3Qua2V5cyh0aGlzLnV0eG9zKTtcbiAgICBpZiAodHlwZW9mIHV0eG9pZHMgIT09ICd1bmRlZmluZWQnICYmIEFycmF5LmlzQXJyYXkodXR4b2lkcykpIHtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdXR4b2lkcy5sZW5ndGg7IGkrKykge1xuICAgICAgICBpZiAodXR4b2lkc1tpXSBpbiB0aGlzLnV0eG9zKSB7XG4gICAgICAgICAgcmVzdWx0cy5wdXNoKHRoaXMudXR4b3NbdXR4b2lkc1tpXV0udG9TdHJpbmcoKSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgZm9yIChjb25zdCB1IG9mIHV0eG9zKSB7XG4gICAgICAgIHJlc3VsdHMucHVzaCh0aGlzLnV0eG9zW3VdLnRvU3RyaW5nKCkpO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0cztcbiAgfTtcblxuICAvKipcbiAgICAgKiBHaXZlbiBhbiBhZGRyZXNzIG9yIGFycmF5IG9mIGFkZHJlc3NlcywgcmV0dXJucyBhbGwgdGhlIFVUWE9JRHMgZm9yIHRob3NlIGFkZHJlc3Nlc1xuICAgICAqXG4gICAgICogQHBhcmFtIGFkZHJlc3MgQW4gYXJyYXkgb2YgYWRkcmVzcyB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfXNcbiAgICAgKiBAcGFyYW0gc3BlbmRhYmxlIElmIHRydWUsIG9ubHkgcmV0cmlldmVzIFVUWE9JRHMgd2hvc2UgbG9ja3RpbWUgaGFzIHBhc3NlZFxuICAgICAqXG4gICAgICogQHJldHVybnMgQW4gYXJyYXkgb2YgYWRkcmVzc2VzLlxuICAgICAqL1xuICBnZXRVVFhPSURzID0gKGFkZHJlc3NlczpBcnJheTxCdWZmZXI+ID0gdW5kZWZpbmVkLCBzcGVuZGFibGU6Ym9vbGVhbiA9IHRydWUpOkFycmF5PHN0cmluZz4gPT4ge1xuICAgIGlmICh0eXBlb2YgYWRkcmVzc2VzICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgY29uc3QgcmVzdWx0czpBcnJheTxzdHJpbmc+ID0gW107XG4gICAgICBjb25zdCBub3c6Qk4gPSBVbml4Tm93KCk7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGFkZHJlc3Nlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICBpZiAoYWRkcmVzc2VzW2ldLnRvU3RyaW5nKCdoZXgnKSBpbiB0aGlzLmFkZHJlc3NVVFhPcykge1xuICAgICAgICAgIGNvbnN0IGVudHJpZXMgPSBPYmplY3QuZW50cmllcyh0aGlzLmFkZHJlc3NVVFhPc1thZGRyZXNzZXNbaV0udG9TdHJpbmcoJ2hleCcpXSk7XG4gICAgICAgICAgZm9yIChjb25zdCBbdXR4b2lkLCBsb2NrdGltZV0gb2YgZW50cmllcykge1xuICAgICAgICAgICAgaWYgKChyZXN1bHRzLmluZGV4T2YodXR4b2lkKSA9PT0gLTFcbiAgICAgICAgICAgICYmIChzcGVuZGFibGUgJiYgbG9ja3RpbWUubHRlKG5vdykpKVxuICAgICAgICAgICAgfHwgIXNwZW5kYWJsZSkge1xuICAgICAgICAgICAgICByZXN1bHRzLnB1c2godXR4b2lkKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiByZXN1bHRzO1xuICAgIH1cbiAgICByZXR1cm4gT2JqZWN0LmtleXModGhpcy51dHhvcyk7XG4gIH07XG5cbiAgLyoqXG4gICAgICogR2V0cyB0aGUgYWRkcmVzc2VzIGluIHRoZSBbW1N0YW5kYXJkVVRYT1NldF1dIGFuZCByZXR1cm5zIGFuIGFycmF5IG9mIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9LlxuICAgICAqL1xuICBnZXRBZGRyZXNzZXMgPSAoKTpBcnJheTxCdWZmZXI+ID0+IE9iamVjdC5rZXlzKHRoaXMuYWRkcmVzc1VUWE9zKVxuICAgIC5tYXAoKGspID0+IEJ1ZmZlci5mcm9tKGssICdoZXgnKSk7XG5cbiAgLyoqXG4gICAgICogUmV0dXJucyB0aGUgYmFsYW5jZSBvZiBhIHNldCBvZiBhZGRyZXNzZXMgaW4gdGhlIFN0YW5kYXJkVVRYT1NldC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBhZGRyZXNzZXMgQW4gYXJyYXkgb2YgYWRkcmVzc2VzXG4gICAgICogQHBhcmFtIGFzc2V0SUQgRWl0aGVyIGEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0gb3IgYW4gY2I1OCBzZXJpYWxpemVkIHJlcHJlc2VudGF0aW9uIG9mIGFuIEFzc2V0SURcbiAgICAgKiBAcGFyYW0gYXNPZiBUaGUgdGltZXN0YW1wIHRvIHZlcmlmeSB0aGUgdHJhbnNhY3Rpb24gYWdhaW5zdCBhcyBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vaW5kdXRueS9ibi5qcy98Qk59XG4gICAgICpcbiAgICAgKiBAcmV0dXJucyBSZXR1cm5zIHRoZSB0b3RhbCBiYWxhbmNlIGFzIGEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9pbmR1dG55L2JuLmpzL3xCTn0uXG4gICAgICovXG4gIGdldEJhbGFuY2UgPSAoYWRkcmVzc2VzOkFycmF5PEJ1ZmZlcj4sIGFzc2V0SUQ6QnVmZmVyfHN0cmluZywgYXNPZjpCTiA9IHVuZGVmaW5lZCk6Qk4gPT4ge1xuICAgIGNvbnN0IHV0eG9pZHM6QXJyYXk8c3RyaW5nPiA9IHRoaXMuZ2V0VVRYT0lEcyhhZGRyZXNzZXMpO1xuICAgIGNvbnN0IHV0eG9zOkFycmF5PFN0YW5kYXJkVVRYTz4gPSB0aGlzLmdldEFsbFVUWE9zKHV0eG9pZHMpO1xuICAgIGxldCBzcGVuZDpCTiA9IG5ldyBCTigwKTtcbiAgICBsZXQgYXNzZXQ6QnVmZmVyO1xuICAgIGlmICh0eXBlb2YgYXNzZXRJRCA9PT0gJ3N0cmluZycpIHtcbiAgICAgIGFzc2V0ID0gYmludG9vbHMuY2I1OERlY29kZShhc3NldElEKTtcbiAgICB9IGVsc2Uge1xuICAgICAgYXNzZXQgPSBhc3NldElEO1xuICAgIH1cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHV0eG9zLmxlbmd0aDsgaSsrKSB7XG4gICAgICBpZiAodXR4b3NbaV0uZ2V0T3V0cHV0KCkgaW5zdGFuY2VvZiBTdGFuZGFyZEFtb3VudE91dHB1dFxuICAgICAgJiYgdXR4b3NbaV0uZ2V0QXNzZXRJRCgpLnRvU3RyaW5nKCdoZXgnKSA9PT0gYXNzZXQudG9TdHJpbmcoJ2hleCcpXG4gICAgICAmJiB1dHhvc1tpXS5nZXRPdXRwdXQoKS5tZWV0c1RocmVzaG9sZChhZGRyZXNzZXMsIGFzT2YpKSB7XG4gICAgICAgIHNwZW5kID0gc3BlbmQuYWRkKCh1dHhvc1tpXS5nZXRPdXRwdXQoKSBhcyBTdGFuZGFyZEFtb3VudE91dHB1dCkuZ2V0QW1vdW50KCkpO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gc3BlbmQ7XG4gIH07XG5cbiAgLyoqXG4gICAgICogR2V0cyBhbGwgdGhlIEFzc2V0IElEcywgb3B0aW9uYWxseSB0aGF0IG1hdGNoIHdpdGggQXNzZXQgSURzIGluIGFuIGFycmF5XG4gICAgICpcbiAgICAgKiBAcGFyYW0gdXR4b2lkcyBBbiBvcHRpb25hbCBhcnJheSBvZiBBZGRyZXNzZXMgYXMgc3RyaW5nIG9yIEJ1ZmZlciwgcmV0dXJucyBhbGwgQXNzZXQgSURzIGlmIG5vdCBwcm92aWRlZFxuICAgICAqXG4gICAgICogQHJldHVybnMgQW4gYXJyYXkgb2Yge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0gcmVwcmVzZW50aW5nIHRoZSBBc3NldCBJRHMuXG4gICAgICovXG4gIGdldEFzc2V0SURzID0gKGFkZHJlc3NlczpBcnJheTxCdWZmZXI+ID0gdW5kZWZpbmVkKTpBcnJheTxCdWZmZXI+ID0+IHtcbiAgICBjb25zdCByZXN1bHRzOlNldDxCdWZmZXI+ID0gbmV3IFNldCgpO1xuICAgIGxldCB1dHhvaWRzOkFycmF5PHN0cmluZz4gPSBbXTtcbiAgICBpZiAodHlwZW9mIGFkZHJlc3NlcyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgIHV0eG9pZHMgPSB0aGlzLmdldFVUWE9JRHMoYWRkcmVzc2VzKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdXR4b2lkcyA9IHRoaXMuZ2V0VVRYT0lEcygpO1xuICAgIH1cblxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdXR4b2lkcy5sZW5ndGg7IGkrKykge1xuICAgICAgaWYgKHV0eG9pZHNbaV0gaW4gdGhpcy51dHhvcyAmJiAhKHV0eG9pZHNbaV0gaW4gcmVzdWx0cykpIHtcbiAgICAgICAgcmVzdWx0cy5hZGQodGhpcy51dHhvc1t1dHhvaWRzW2ldXS5nZXRBc3NldElEKCkpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBbLi4ucmVzdWx0c107XG4gIH07XG5cbiAgYWJzdHJhY3QgY2xvbmUoKTp0aGlzO1xuXG4gIGFic3RyYWN0IGNyZWF0ZSguLi5hcmdzOmFueVtdKTp0aGlzO1xuXG4gIGZpbHRlcihhcmdzOmFueVtdLCBsYW1iZGE6KHV0eG86VVRYT0NsYXNzLCAuLi5sYXJnczphbnlbXSkgPT4gYm9vbGVhbik6dGhpcyB7XG4gICAgbGV0IG5ld3NldDp0aGlzID0gdGhpcy5jbG9uZSgpO1xuICAgIGxldCB1dHhvczpBcnJheTxVVFhPQ2xhc3M+ID0gdGhpcy5nZXRBbGxVVFhPcygpO1xuICAgIGZvcihsZXQgaSA9IDA7IGkgPCB1dHhvcy5sZW5ndGg7IGkrKyl7XG4gICAgICBpZihsYW1iZGEodXR4b3NbaV0sIC4uLmFyZ3MpID09PSBmYWxzZSkge1xuICAgICAgICBuZXdzZXQucmVtb3ZlKHV0eG9zW2ldKTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIG5ld3NldDtcbiAgfVxuXG4gIC8qKlxuICAgICAqIFJldHVybnMgYSBuZXcgc2V0IHdpdGggY29weSBvZiBVVFhPcyBpbiB0aGlzIGFuZCBzZXQgcGFyYW1ldGVyLlxuICAgICAqXG4gICAgICogQHBhcmFtIHV0eG9zZXQgVGhlIFtbU3RhbmRhcmRVVFhPU2V0XV0gdG8gbWVyZ2Ugd2l0aCB0aGlzIG9uZVxuICAgICAqIEBwYXJhbSBoYXNVVFhPSURzIFdpbGwgc3Vic2VsZWN0IGEgc2V0IG9mIFtbU3RhbmRhcmRVVFhPXV1zIHdoaWNoIGhhdmUgdGhlIFVUWE9JRHMgcHJvdmlkZWQgaW4gdGhpcyBhcnJheSwgZGVmdWx0cyB0byBhbGwgVVRYT3NcbiAgICAgKlxuICAgICAqIEByZXR1cm5zIEEgbmV3IFN0YW5kYXJkVVRYT1NldCB0aGF0IGNvbnRhaW5zIGFsbCB0aGUgZmlsdGVyZWQgZWxlbWVudHMuXG4gICAgICovXG4gIG1lcmdlID0gKHV0eG9zZXQ6dGhpcywgaGFzVVRYT0lEczpBcnJheTxzdHJpbmc+ID0gdW5kZWZpbmVkKTp0aGlzID0+IHtcbiAgICBjb25zdCByZXN1bHRzOnRoaXMgPSB0aGlzLmNyZWF0ZSgpO1xuICAgIGNvbnN0IHV0eG9zMTpBcnJheTxVVFhPQ2xhc3M+ID0gdGhpcy5nZXRBbGxVVFhPcyhoYXNVVFhPSURzKTtcbiAgICBjb25zdCB1dHhvczI6QXJyYXk8VVRYT0NsYXNzPiA9IHV0eG9zZXQuZ2V0QWxsVVRYT3MoaGFzVVRYT0lEcyk7XG4gICAgY29uc3QgcHJvY2VzcyA9ICh1dHhvOlVUWE9DbGFzcykgPT4ge1xuICAgICAgcmVzdWx0cy5hZGQodXR4byk7XG4gICAgfTtcbiAgICB1dHhvczEuZm9yRWFjaChwcm9jZXNzKTtcbiAgICB1dHhvczIuZm9yRWFjaChwcm9jZXNzKTtcbiAgICByZXR1cm4gcmVzdWx0cyBhcyB0aGlzO1xuICB9O1xuXG4gIC8qKlxuICAgICAqIFNldCBpbnRlcnNldGlvbiBiZXR3ZWVuIHRoaXMgc2V0IGFuZCBhIHBhcmFtZXRlci5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB1dHhvc2V0IFRoZSBzZXQgdG8gaW50ZXJzZWN0XG4gICAgICpcbiAgICAgKiBAcmV0dXJucyBBIG5ldyBTdGFuZGFyZFVUWE9TZXQgY29udGFpbmluZyB0aGUgaW50ZXJzZWN0aW9uXG4gICAgICovXG4gIGludGVyc2VjdGlvbiA9ICh1dHhvc2V0OnRoaXMpOnRoaXMgPT4ge1xuICAgIGNvbnN0IHVzMTpBcnJheTxzdHJpbmc+ID0gdGhpcy5nZXRVVFhPSURzKCk7XG4gICAgY29uc3QgdXMyOkFycmF5PHN0cmluZz4gPSB1dHhvc2V0LmdldFVUWE9JRHMoKTtcbiAgICBjb25zdCByZXN1bHRzOkFycmF5PHN0cmluZz4gPSB1czEuZmlsdGVyKCh1dHhvaWQpID0+IHVzMi5pbmNsdWRlcyh1dHhvaWQpKTtcbiAgICByZXR1cm4gdGhpcy5tZXJnZSh1dHhvc2V0LCByZXN1bHRzKSBhcyB0aGlzO1xuICB9O1xuXG4gIC8qKlxuICAgICAqIFNldCBkaWZmZXJlbmNlIGJldHdlZW4gdGhpcyBzZXQgYW5kIGEgcGFyYW1ldGVyLlxuICAgICAqXG4gICAgICogQHBhcmFtIHV0eG9zZXQgVGhlIHNldCB0byBkaWZmZXJlbmNlXG4gICAgICpcbiAgICAgKiBAcmV0dXJucyBBIG5ldyBTdGFuZGFyZFVUWE9TZXQgY29udGFpbmluZyB0aGUgZGlmZmVyZW5jZVxuICAgICAqL1xuICBkaWZmZXJlbmNlID0gKHV0eG9zZXQ6dGhpcyk6dGhpcyA9PiB7XG4gICAgY29uc3QgdXMxOkFycmF5PHN0cmluZz4gPSB0aGlzLmdldFVUWE9JRHMoKTtcbiAgICBjb25zdCB1czI6QXJyYXk8c3RyaW5nPiA9IHV0eG9zZXQuZ2V0VVRYT0lEcygpO1xuICAgIGNvbnN0IHJlc3VsdHM6QXJyYXk8c3RyaW5nPiA9IHVzMS5maWx0ZXIoKHV0eG9pZCkgPT4gIXVzMi5pbmNsdWRlcyh1dHhvaWQpKTtcbiAgICByZXR1cm4gdGhpcy5tZXJnZSh1dHhvc2V0LCByZXN1bHRzKSBhcyB0aGlzO1xuICB9O1xuXG4gIC8qKlxuICAgICAqIFNldCBzeW1tZXRyaWNhbCBkaWZmZXJlbmNlIGJldHdlZW4gdGhpcyBzZXQgYW5kIGEgcGFyYW1ldGVyLlxuICAgICAqXG4gICAgICogQHBhcmFtIHV0eG9zZXQgVGhlIHNldCB0byBzeW1tZXRyaWNhbCBkaWZmZXJlbmNlXG4gICAgICpcbiAgICAgKiBAcmV0dXJucyBBIG5ldyBTdGFuZGFyZFVUWE9TZXQgY29udGFpbmluZyB0aGUgc3ltbWV0cmljYWwgZGlmZmVyZW5jZVxuICAgICAqL1xuICBzeW1EaWZmZXJlbmNlID0gKHV0eG9zZXQ6dGhpcyk6dGhpcyA9PiB7XG4gICAgY29uc3QgdXMxOkFycmF5PHN0cmluZz4gPSB0aGlzLmdldFVUWE9JRHMoKTtcbiAgICBjb25zdCB1czI6QXJyYXk8c3RyaW5nPiA9IHV0eG9zZXQuZ2V0VVRYT0lEcygpO1xuICAgIGNvbnN0IHJlc3VsdHM6QXJyYXk8c3RyaW5nPiA9IHVzMS5maWx0ZXIoKHV0eG9pZCkgPT4gIXVzMi5pbmNsdWRlcyh1dHhvaWQpKVxuICAgICAgLmNvbmNhdCh1czIuZmlsdGVyKCh1dHhvaWQpID0+ICF1czEuaW5jbHVkZXModXR4b2lkKSkpO1xuICAgIHJldHVybiB0aGlzLm1lcmdlKHV0eG9zZXQsIHJlc3VsdHMpIGFzIHRoaXM7XG4gIH07XG5cbiAgLyoqXG4gICAgICogU2V0IHVuaW9uIGJldHdlZW4gdGhpcyBzZXQgYW5kIGEgcGFyYW1ldGVyLlxuICAgICAqXG4gICAgICogQHBhcmFtIHV0eG9zZXQgVGhlIHNldCB0byB1bmlvblxuICAgICAqXG4gICAgICogQHJldHVybnMgQSBuZXcgU3RhbmRhcmRVVFhPU2V0IGNvbnRhaW5pbmcgdGhlIHVuaW9uXG4gICAgICovXG4gIHVuaW9uID0gKHV0eG9zZXQ6dGhpcyk6dGhpcyA9PiB0aGlzLm1lcmdlKHV0eG9zZXQpIGFzIHRoaXM7XG5cbiAgLyoqXG4gICAgICogTWVyZ2VzIGEgc2V0IGJ5IHRoZSBydWxlIHByb3ZpZGVkLlxuICAgICAqXG4gICAgICogQHBhcmFtIHV0eG9zZXQgVGhlIHNldCB0byBtZXJnZSBieSB0aGUgTWVyZ2VSdWxlXG4gICAgICogQHBhcmFtIG1lcmdlUnVsZSBUaGUgW1tNZXJnZVJ1bGVdXSB0byBhcHBseVxuICAgICAqXG4gICAgICogQHJldHVybnMgQSBuZXcgU3RhbmRhcmRVVFhPU2V0IGNvbnRhaW5pbmcgdGhlIG1lcmdlZCBkYXRhXG4gICAgICpcbiAgICAgKiBAcmVtYXJrc1xuICAgICAqIFRoZSBtZXJnZSBydWxlcyBhcmUgYXMgZm9sbG93czpcbiAgICAgKiAgICogXCJpbnRlcnNlY3Rpb25cIiAtIHRoZSBpbnRlcnNlY3Rpb24gb2YgdGhlIHNldFxuICAgICAqICAgKiBcImRpZmZlcmVuY2VTZWxmXCIgLSB0aGUgZGlmZmVyZW5jZSBiZXR3ZWVuIHRoZSBleGlzdGluZyBkYXRhIGFuZCBuZXcgc2V0XG4gICAgICogICAqIFwiZGlmZmVyZW5jZU5ld1wiIC0gdGhlIGRpZmZlcmVuY2UgYmV0d2VlbiB0aGUgbmV3IGRhdGEgYW5kIHRoZSBleGlzdGluZyBzZXRcbiAgICAgKiAgICogXCJzeW1EaWZmZXJlbmNlXCIgLSB0aGUgdW5pb24gb2YgdGhlIGRpZmZlcmVuY2VzIGJldHdlZW4gYm90aCBzZXRzIG9mIGRhdGFcbiAgICAgKiAgICogXCJ1bmlvblwiIC0gdGhlIHVuaXF1ZSBzZXQgb2YgYWxsIGVsZW1lbnRzIGNvbnRhaW5lZCBpbiBib3RoIHNldHNcbiAgICAgKiAgICogXCJ1bmlvbk1pbnVzTmV3XCIgLSB0aGUgdW5pcXVlIHNldCBvZiBhbGwgZWxlbWVudHMgY29udGFpbmVkIGluIGJvdGggc2V0cywgZXhjbHVkaW5nIHZhbHVlcyBvbmx5IGZvdW5kIGluIHRoZSBuZXcgc2V0XG4gICAgICogICAqIFwidW5pb25NaW51c1NlbGZcIiAtIHRoZSB1bmlxdWUgc2V0IG9mIGFsbCBlbGVtZW50cyBjb250YWluZWQgaW4gYm90aCBzZXRzLCBleGNsdWRpbmcgdmFsdWVzIG9ubHkgZm91bmQgaW4gdGhlIGV4aXN0aW5nIHNldFxuICAgICAqL1xuICBtZXJnZUJ5UnVsZSA9ICh1dHhvc2V0OnRoaXMsIG1lcmdlUnVsZTpNZXJnZVJ1bGUpOnRoaXMgPT4ge1xuICAgIGxldCB1U2V0OnRoaXM7XG4gICAgc3dpdGNoIChtZXJnZVJ1bGUpIHtcbiAgICAgIGNhc2UgJ2ludGVyc2VjdGlvbic6XG4gICAgICAgIHJldHVybiB0aGlzLmludGVyc2VjdGlvbih1dHhvc2V0KTtcbiAgICAgIGNhc2UgJ2RpZmZlcmVuY2VTZWxmJzpcbiAgICAgICAgcmV0dXJuIHRoaXMuZGlmZmVyZW5jZSh1dHhvc2V0KTtcbiAgICAgIGNhc2UgJ2RpZmZlcmVuY2VOZXcnOlxuICAgICAgICByZXR1cm4gdXR4b3NldC5kaWZmZXJlbmNlKHRoaXMpIGFzIHRoaXM7XG4gICAgICBjYXNlICdzeW1EaWZmZXJlbmNlJzpcbiAgICAgICAgcmV0dXJuIHRoaXMuc3ltRGlmZmVyZW5jZSh1dHhvc2V0KTtcbiAgICAgIGNhc2UgJ3VuaW9uJzpcbiAgICAgICAgcmV0dXJuIHRoaXMudW5pb24odXR4b3NldCk7XG4gICAgICBjYXNlICd1bmlvbk1pbnVzTmV3JzpcbiAgICAgICAgdVNldCA9IHRoaXMudW5pb24odXR4b3NldCk7XG4gICAgICAgIHJldHVybiB1U2V0LmRpZmZlcmVuY2UodXR4b3NldCkgYXMgdGhpcztcbiAgICAgIGNhc2UgJ3VuaW9uTWludXNTZWxmJzpcbiAgICAgICAgdVNldCA9IHRoaXMudW5pb24odXR4b3NldCk7XG4gICAgICAgIHJldHVybiB1U2V0LmRpZmZlcmVuY2UodGhpcykgYXMgdGhpcztcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIkVycm9yIC0gU3RhbmRhcmRVVFhPU2V0Lm1lcmdlQnlSdWxlOiBiYWQgTWVyZ2VSdWxlXCIpO1xuICAgIH1cbiAgfTtcbn1cbiJdfQ==