"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateAssetTx = void 0;
/**
 * @packageDocumentation
 * @module API-AVM-CreateAssetTx
 */
const buffer_1 = require("buffer/");
const bintools_1 = __importDefault(require("../../utils/bintools"));
const constants_1 = require("./constants");
const initialstates_1 = require("./initialstates");
const basetx_1 = require("./basetx");
const constants_2 = require("../../utils/constants");
const serialization_1 = require("../../utils/serialization");
/**
 * @ignore
 */
const bintools = bintools_1.default.getInstance();
const serializer = serialization_1.Serialization.getInstance();
class CreateAssetTx extends basetx_1.BaseTx {
    /**
     * Class representing an unsigned Create Asset transaction.
     *
     * @param networkid Optional networkid, [[DefaultNetworkID]]
     * @param blockchainid Optional blockchainid, default Buffer.alloc(32, 16)
     * @param outs Optional array of the [[TransferableOutput]]s
     * @param ins Optional array of the [[TransferableInput]]s
     * @param memo Optional {@link https://github.com/feross/buffer|Buffer} for the memo field
     * @param name String for the descriptive name of the asset
     * @param symbol String for the ticker symbol of the asset
     * @param denomination Optional number for the denomination which is 10^D. D must be >= 0 and <= 32. Ex: $1 DJTX = 10^9 $nDJTX
     * @param initialstate Optional [[InitialStates]] that represent the intial state of a created asset
     */
    constructor(networkid = constants_2.DefaultNetworkID, blockchainid = buffer_1.Buffer.alloc(32, 16), outs = undefined, ins = undefined, memo = undefined, name = undefined, symbol = undefined, denomination = undefined, initialstate = undefined) {
        super(networkid, blockchainid, outs, ins, memo);
        this._typeName = "CreateAssetTx";
        this._codecID = constants_1.AVMConstants.LATESTCODEC;
        this._typeID = this._codecID === 0 ? constants_1.AVMConstants.CREATEASSETTX : constants_1.AVMConstants.CREATEASSETTX_CODECONE;
        this.name = '';
        this.symbol = '';
        this.denomination = buffer_1.Buffer.alloc(1);
        this.initialstate = new initialstates_1.InitialStates();
        /**
         * Returns the id of the [[CreateAssetTx]]
         */
        this.getTxType = () => {
            return this._typeID;
        };
        /**
         * Returns the array of array of [[Output]]s for the initial state
         */
        this.getInitialStates = () => this.initialstate;
        /**
         * Returns the string representation of the name
         */
        this.getName = () => this.name;
        /**
         * Returns the string representation of the symbol
         */
        this.getSymbol = () => this.symbol;
        /**
         * Returns the numeric representation of the denomination
         */
        this.getDenomination = () => this.denomination.readUInt8(0);
        /**
         * Returns the {@link https://github.com/feross/buffer|Buffer} representation of the denomination
         */
        this.getDenominationBuffer = () => {
            return this.denomination;
        };
        if (typeof name === 'string' && typeof symbol === 'string' && typeof denomination === 'number'
            && denomination >= 0 && denomination <= 32 && typeof initialstate !== 'undefined') {
            this.initialstate = initialstate;
            this.name = name;
            this.symbol = symbol;
            this.denomination.writeUInt8(denomination, 0);
        }
    }
    serialize(encoding = "hex") {
        let fields = super.serialize(encoding);
        return Object.assign(Object.assign({}, fields), { "name": serializer.encoder(this.name, encoding, "utf8", "utf8"), "symbol": serializer.encoder(this.symbol, encoding, "utf8", "utf8"), "denomination": serializer.encoder(this.denomination, encoding, "Buffer", "decimalString", 1), "initialstate": this.initialstate.serialize(encoding) });
    }
    ;
    deserialize(fields, encoding = "hex") {
        super.deserialize(fields, encoding);
        this.name = serializer.decoder(fields["name"], encoding, "utf8", "utf8");
        this.symbol = serializer.decoder(fields["symbol"], encoding, "utf8", "utf8");
        this.denomination = serializer.decoder(fields["denomination"], encoding, "decimalString", "Buffer", 1);
        this.initialstate = new initialstates_1.InitialStates();
        this.initialstate.deserialize(fields["initialstate"], encoding);
    }
    setCodecID(codecID) {
        if (codecID !== 0 && codecID !== 1) {
            /* istanbul ignore next */
            throw new Error("Error - CreateAssetTx.setCodecID: invalid codecID. Valid codecIDs are 0 and 1.");
        }
        this._codecID = codecID;
        this._typeID = this._codecID === 0 ? constants_1.AVMConstants.CREATEASSETTX : constants_1.AVMConstants.CREATEASSETTX_CODECONE;
    }
    /**
     * Takes a {@link https://github.com/feross/buffer|Buffer} containing an [[CreateAssetTx]], parses it, populates the class, and returns the length of the [[CreateAssetTx]] in bytes.
     *
     * @param bytes A {@link https://github.com/feross/buffer|Buffer} containing a raw [[CreateAssetTx]]
     *
     * @returns The length of the raw [[CreateAssetTx]]
     *
     * @remarks assume not-checksummed
     */
    fromBuffer(bytes, offset = 0) {
        offset = super.fromBuffer(bytes, offset);
        const namesize = bintools.copyFrom(bytes, offset, offset + 2).readUInt16BE(0);
        offset += 2;
        this.name = bintools.copyFrom(bytes, offset, offset + namesize).toString('utf8');
        offset += namesize;
        const symsize = bintools.copyFrom(bytes, offset, offset + 2).readUInt16BE(0);
        offset += 2;
        this.symbol = bintools.copyFrom(bytes, offset, offset + symsize).toString('utf8');
        offset += symsize;
        this.denomination = bintools.copyFrom(bytes, offset, offset + 1);
        offset += 1;
        const inits = new initialstates_1.InitialStates();
        offset = inits.fromBuffer(bytes, offset);
        this.initialstate = inits;
        return offset;
    }
    /**
       * Returns a {@link https://github.com/feross/buffer|Buffer} representation of the [[CreateAssetTx]].
       */
    toBuffer() {
        const superbuff = super.toBuffer();
        const initstatebuff = this.initialstate.toBuffer();
        const namebuff = buffer_1.Buffer.alloc(this.name.length);
        namebuff.write(this.name, 0, this.name.length, 'utf8');
        const namesize = buffer_1.Buffer.alloc(2);
        namesize.writeUInt16BE(this.name.length, 0);
        const symbuff = buffer_1.Buffer.alloc(this.symbol.length);
        symbuff.write(this.symbol, 0, this.symbol.length, 'utf8');
        const symsize = buffer_1.Buffer.alloc(2);
        symsize.writeUInt16BE(this.symbol.length, 0);
        const bsize = superbuff.length + namesize.length + namebuff.length + symsize.length + symbuff.length + this.denomination.length + initstatebuff.length;
        const barr = [superbuff, namesize, namebuff, symsize, symbuff, this.denomination, initstatebuff];
        return buffer_1.Buffer.concat(barr, bsize);
    }
    clone() {
        let newbase = new CreateAssetTx();
        newbase.fromBuffer(this.toBuffer());
        return newbase;
    }
    create(...args) {
        return new CreateAssetTx(...args);
    }
}
exports.CreateAssetTx = CreateAssetTx;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY3JlYXRlYXNzZXR0eC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9hcGlzL2F2bS9jcmVhdGVhc3NldHR4LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBOzs7R0FHRztBQUNILG9DQUFpQztBQUNqQyxvRUFBNEM7QUFDNUMsMkNBQTJDO0FBRzNDLG1EQUFnRDtBQUNoRCxxQ0FBa0M7QUFDbEMscURBQXlEO0FBQ3pELDZEQUE4RTtBQUU5RTs7R0FFRztBQUNILE1BQU0sUUFBUSxHQUFHLGtCQUFRLENBQUMsV0FBVyxFQUFFLENBQUM7QUFDeEMsTUFBTSxVQUFVLEdBQUcsNkJBQWEsQ0FBQyxXQUFXLEVBQUUsQ0FBQztBQUUvQyxNQUFhLGFBQWMsU0FBUSxlQUFNO0lBd0l2Qzs7Ozs7Ozs7Ozs7O09BWUc7SUFDSCxZQUNFLFlBQW1CLDRCQUFnQixFQUFFLGVBQXNCLGVBQU0sQ0FBQyxLQUFLLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUMvRSxPQUFpQyxTQUFTLEVBQUUsTUFBK0IsU0FBUyxFQUNwRixPQUFjLFNBQVMsRUFBRSxPQUFjLFNBQVMsRUFBRSxTQUFnQixTQUFTLEVBQUUsZUFBc0IsU0FBUyxFQUM1RyxlQUE2QixTQUFTO1FBRXRDLEtBQUssQ0FBQyxTQUFTLEVBQUUsWUFBWSxFQUFFLElBQUksRUFBRSxHQUFHLEVBQUUsSUFBSSxDQUFDLENBQUM7UUExSnhDLGNBQVMsR0FBRyxlQUFlLENBQUM7UUFDNUIsYUFBUSxHQUFHLHdCQUFZLENBQUMsV0FBVyxDQUFDO1FBQ3BDLFlBQU8sR0FBRyxJQUFJLENBQUMsUUFBUSxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsd0JBQVksQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDLHdCQUFZLENBQUMsc0JBQXNCLENBQUM7UUFxQmpHLFNBQUksR0FBVSxFQUFFLENBQUM7UUFDakIsV0FBTSxHQUFVLEVBQUUsQ0FBQztRQUNuQixpQkFBWSxHQUFVLGVB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QU0sQ0FBQyxDQUFDO1FBQ3hELE9BQU8sQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLEVBQUUsTUFBTSxDQUFDLENBQUM7UUFDMUQsTUFBTSxPQUFPLEdBQVUsZUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUN2QyxPQUFPLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBRTdDLE1BQU0sS0FBSyxHQUFVLFNBQVMsQ0FBQyxNQUFNLEdBQUcsUUFBUSxDQUFDLE1BQU0sR0FBRyxRQUFRLENBQUMsTUFBTSxHQUFHLE9BQU8sQ0FBQyxNQUFNLEdBQUcsT0FBTyxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDLE1BQU0sR0FBRyxhQUFhLENBQUMsTUFBTSxDQUFDO1FBQzlKLE1BQU0sSUFBSSxHQUFpQixDQUFDLFNBQVMsRUFBRSxRQUFRLEVBQUUsUUFBUSxFQUFFLE9BQU8sRUFBRSxPQUFPLEVBQUUsSUFBSSxDQUFDLFlBQVksRUFBRSxhQUFhLENBQUMsQ0FBQztRQUMvRyxPQUFPLGVBQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxFQUFFLEtBQUssQ0FBQyxDQUFDO0lBQ3BDLENBQUM7SUFFRCxLQUFLO1FBQ0gsSUFBSSxPQUFPLEdBQWlCLElBQUksYUFBYSxFQUFFLENBQUM7UUFDaEQsT0FBTyxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQztRQUNwQyxPQUFPLE9BQWUsQ0FBQztJQUN6QixDQUFDO0lBRUQsTUFBTSxDQUFDLEdBQUcsSUFBVTtRQUNoQixPQUFPLElBQUksYUFBYSxDQUFDLEdBQUcsSUFBSSxDQUFTLENBQUM7SUFDOUMsQ0FBQztDQWdDRjtBQXRLRCxzQ0FzS0MiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBwYWNrYWdlRG9jdW1lbnRhdGlvblxuICogQG1vZHVsZSBBUEktQVZNLUNyZWF0ZUFzc2V0VHhcbiAqL1xuaW1wb3J0IHsgQnVmZmVyIH0gZnJvbSAnYnVmZmVyLyc7XG5pbXBvcnQgQmluVG9vbHMgZnJvbSAnLi4vLi4vdXRpbHMvYmludG9vbHMnO1xuaW1wb3J0IHsgQVZNQ29uc3RhbnRzIH0gZnJvbSAnLi9jb25zdGFudHMnO1xuaW1wb3J0IHsgVHJhbnNmZXJhYmxlT3V0cHV0IH0gZnJvbSAnLi9vdXRwdXRzJztcbmltcG9ydCB7IFRyYW5zZmVyYWJsZUlucHV0IH0gZnJvbSAnLi9pbnB1dHMnO1xuaW1wb3J0IHsgSW5pdGlhbFN0YXRlcyB9IGZyb20gJy4vaW5pdGlhbHN0YXRlcyc7XG5pbXBvcnQgeyBCYXNlVHggfSBmcm9tICcuL2Jhc2V0eCc7XG5pbXBvcnQgeyBEZWZhdWx0TmV0d29ya0lEIH0gZnJvbSAnLi4vLi4vdXRpbHMvY29uc3RhbnRzJztcbmltcG9ydCB7IFNlcmlhbGl6YXRpb24sIFNlcmlhbGl6ZWRFbmNvZGluZyB9IGZyb20gJy4uLy4uL3V0aWxzL3NlcmlhbGl6YXRpb24nO1xuXG4vKipcbiAqIEBpZ25vcmVcbiAqL1xuY29uc3QgYmludG9vbHMgPSBCaW5Ub29scy5nZXRJbnN0YW5jZSgpO1xuY29uc3Qgc2VyaWFsaXplciA9IFNlcmlhbGl6YXRpb24uZ2V0SW5zdGFuY2UoKTtcblxuZXhwb3J0IGNsYXNzIENyZWF0ZUFzc2V0VHggZXh0ZW5kcyBCYXNlVHgge1xuICBwcm90ZWN0ZWQgX3R5cGVOYW1lID0gXCJDcmVhdGVBc3NldFR4XCI7XG4gIHByb3RlY3RlZCBfY29kZWNJRCA9IEFWTUNvbnN0YW50cy5MQVRFU1RDT0RFQztcbiAgcHJvdGVjdGVkIF90eXBlSUQgPSB0aGlzLl9jb2RlY0lEID09PSAwID8gQVZNQ29uc3RhbnRzLkNSRUFURUFTU0VUVFggOiBBVk1Db25zdGFudHMuQ1JFQVRFQVNTRVRUWF9DT0RFQ09ORTtcblxuICBzZXJpYWxpemUoZW5jb2Rpbmc6U2VyaWFsaXplZEVuY29kaW5nID0gXCJoZXhcIik6b2JqZWN0IHtcbiAgICBsZXQgZmllbGRzOm9iamVjdCA9IHN1cGVyLnNlcmlhbGl6ZShlbmNvZGluZyk7XG4gICAgcmV0dXJuIHtcbiAgICAgIC4uLmZpZWxkcyxcbiAgICAgIFwibmFtZVwiOiBzZXJpYWxpemVyLmVuY29kZXIodGhpcy5uYW1lLCBlbmNvZGluZywgXCJ1dGY4XCIsIFwidXRmOFwiKSxcbiAgICAgIFwic3ltYm9sXCI6IHNlcmlhbGl6ZXIuZW5jb2Rlcih0aGlzLnN5bWJvbCwgZW5jb2RpbmcsIFwidXRmOFwiLCBcInV0ZjhcIiksXG4gICAgICBcImRlbm9taW5hdGlvblwiOiBzZXJpYWxpemVyLmVuY29kZXIodGhpcy5kZW5vbWluYXRpb24sIGVuY29kaW5nLCBcIkJ1ZmZlclwiLCBcImRlY2ltYWxTdHJpbmdcIiwgMSksXG4gICAgICBcImluaXRpYWxzdGF0ZVwiOiB0aGlzLmluaXRpYWxzdGF0ZS5zZXJpYWxpemUoZW5jb2RpbmcpXG4gICAgfVxuICB9O1xuICBkZXNlcmlhbGl6ZShmaWVsZHM6b2JqZWN0LCBlbmNvZGluZzpTZXJpYWxpemVkRW5jb2RpbmcgPSBcImhleFwiKSB7XG4gICAgc3VwZXIuZGVzZXJpYWxpemUoZmllbGRzLCBlbmNvZGluZyk7XG4gICAgdGhpcy5uYW1lID0gc2VyaWFsaXplci5kZWNvZGVyKGZpZWxkc1tcIm5hbWVcIl0sIGVuY29kaW5nLCBcInV0ZjhcIiwgXCJ1dGY4XCIpO1xuICAgIHRoaXMuc3ltYm9sID0gc2VyaWFsaXplci5kZWNvZGVyKGZpZWxkc1tcInN5bWJvbFwiXSwgZW5jb2RpbmcsIFwidXRmOFwiLCBcInV0ZjhcIik7XG4gICAgdGhpcy5kZW5vbWluYXRpb24gPSBzZXJpYWxpemVyLmRlY29kZXIoZmllbGRzW1wiZGVub21pbmF0aW9uXCJdLCBlbmNvZGluZywgXCJkZWNpbWFsU3RyaW5nXCIsIFwiQnVmZmVyXCIsIDEpO1xuICAgIHRoaXMuaW5pdGlhbHN0YXRlID0gbmV3IEluaXRpYWxTdGF0ZXMoKTtcbiAgICB0aGlzLmluaXRpYWxzdGF0ZS5kZXNlcmlhbGl6ZShmaWVsZHNbXCJpbml0aWFsc3RhdGVcIl0sIGVuY29kaW5nKTtcbiAgfVxuXG4gIHByb3RlY3RlZCBuYW1lOnN0cmluZyA9ICcnO1xuICBwcm90ZWN0ZWQgc3ltYm9sOnN0cmluZyA9ICcnO1xuICBwcm90ZWN0ZWQgZGVub21pbmF0aW9uOkJ1ZmZlciA9IEJ1ZmZlci5hbGxvYygxKTtcbiAgcHJvdGVjdGVkIGluaXRpYWxzdGF0ZTpJbml0aWFsU3RhdGVzID0gbmV3IEluaXRpYWxTdGF0ZXMoKTtcblxuICBzZXRDb2RlY0lEKGNvZGVjSUQ6IG51bWJlcik6IHZvaWQge1xuICAgIGlmKGNvZGVjSUQgIT09IDAgJiYgY29kZWNJRCAhPT0gMSkge1xuICAgICAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiRXJyb3IgLSBDcmVhdGVBc3NldFR4LnNldENvZGVjSUQ6IGludmFsaWQgY29kZWNJRC4gVmFsaWQgY29kZWNJRHMgYXJlIDAgYW5kIDEuXCIpO1xuICAgIH1cbiAgICB0aGlzLl9jb2RlY0lEID0gY29kZWNJRDtcbiAgICB0aGlzLl90eXBlSUQgPSB0aGlzLl9jb2RlY0lEID09PSAwID8gQVZNQ29uc3RhbnRzLkNSRUFURUFTU0VUVFggOiBBVk1Db25zdGFudHMuQ1JFQVRFQVNTRVRUWF9DT0RFQ09ORTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSBpZCBvZiB0aGUgW1tDcmVhdGVBc3NldFR4XV1cbiAgICovXG4gIGdldFR4VHlwZSA9ICgpOm51bWJlciA9PiB7XG4gICAgcmV0dXJuIHRoaXMuX3R5cGVJRDtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSBhcnJheSBvZiBhcnJheSBvZiBbW091dHB1dF1dcyBmb3IgdGhlIGluaXRpYWwgc3RhdGVcbiAgICovXG4gIGdldEluaXRpYWxTdGF0ZXMgPSAoKTpJbml0aWFsU3RhdGVzID0+IHRoaXMuaW5pdGlhbHN0YXRlO1xuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSBzdHJpbmcgcmVwcmVzZW50YXRpb24gb2YgdGhlIG5hbWVcbiAgICovXG4gIGdldE5hbWUgPSAoKTpzdHJpbmcgPT4gdGhpcy5uYW1lO1xuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSBzdHJpbmcgcmVwcmVzZW50YXRpb24gb2YgdGhlIHN5bWJvbFxuICAgKi9cbiAgZ2V0U3ltYm9sID0gKCk6c3RyaW5nID0+IHRoaXMuc3ltYm9sO1xuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSBudW1lcmljIHJlcHJlc2VudGF0aW9uIG9mIHRoZSBkZW5vbWluYXRpb25cbiAgICovXG4gIGdldERlbm9taW5hdGlvbiA9ICgpOm51bWJlciA9PiB0aGlzLmRlbm9taW5hdGlvbi5yZWFkVUludDgoMCk7XG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IHJlcHJlc2VudGF0aW9uIG9mIHRoZSBkZW5vbWluYXRpb25cbiAgICovXG4gIGdldERlbm9taW5hdGlvbkJ1ZmZlciA9ICgpOkJ1ZmZlciA9PiB7XG4gICAgICByZXR1cm4gdGhpcy5kZW5vbWluYXRpb247XG4gIH1cblxuICAvKipcbiAgICogVGFrZXMgYSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSBjb250YWluaW5nIGFuIFtbQ3JlYXRlQXNzZXRUeF1dLCBwYXJzZXMgaXQsIHBvcHVsYXRlcyB0aGUgY2xhc3MsIGFuZCByZXR1cm5zIHRoZSBsZW5ndGggb2YgdGhlIFtbQ3JlYXRlQXNzZXRUeF1dIGluIGJ5dGVzLlxuICAgKlxuICAgKiBAcGFyYW0gYnl0ZXMgQSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSBjb250YWluaW5nIGEgcmF3IFtbQ3JlYXRlQXNzZXRUeF1dXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSBsZW5ndGggb2YgdGhlIHJhdyBbW0NyZWF0ZUFzc2V0VHhdXVxuICAgKlxuICAgKiBAcmVtYXJrcyBhc3N1bWUgbm90LWNoZWNrc3VtbWVkXG4gICAqL1xuICBmcm9tQnVmZmVyKGJ5dGVzOkJ1ZmZlciwgb2Zmc2V0Om51bWJlciA9IDApOm51bWJlciB7XG4gICAgb2Zmc2V0ID0gc3VwZXIuZnJvbUJ1ZmZlcihieXRlcywgb2Zmc2V0KTtcblxuICAgIGNvbnN0IG5hbWVzaXplOm51bWJlciA9IGJpbnRvb2xzLmNvcHlGcm9tKGJ5dGVzLCBvZmZzZXQsIG9mZnNldCArIDIpLnJlYWRVSW50MTZCRSgwKTtcbiAgICBvZmZzZXQgKz0gMjtcbiAgICB0aGlzLm5hbWUgPSBiaW50b29scy5jb3B5RnJvbShieXRlcywgb2Zmc2V0LCBvZmZzZXQgKyBuYW1lc2l6ZSkudG9TdHJpbmcoJ3V0ZjgnKTtcbiAgICBvZmZzZXQgKz0gbmFtZXNpemU7XG5cbiAgICBjb25zdCBzeW1zaXplOm51bWJlciA9IGJpbnRvb2xzLmNvcHlGcm9tKGJ5dGVzLCBvZmZzZXQsIG9mZnNldCArIDIpLnJlYWRVSW50MTZCRSgwKTtcbiAgICBvZmZzZXQgKz0gMjtcbiAgICB0aGlzLnN5bWJvbCA9IGJpbnRvb2xzLmNvcHlGcm9tKGJ5dGVzLCBvZmZzZXQsIG9mZnNldCArIHN5bXNpemUpLnRvU3RyaW5nKCd1dGY4Jyk7XG4gICAgb2Zmc2V0ICs9IHN5bXNpemU7XG5cbiAgICB0aGlzLmRlbm9taW5hdGlvbiA9IGJpbnRvb2xzLmNvcHlGcm9tKGJ5dGVzLCBvZmZzZXQsIG9mZnNldCArIDEpO1xuICAgIG9mZnNldCArPSAxO1xuXG4gICAgY29uc3QgaW5pdHM6SW5pdGlhbFN0YXRlcyA9IG5ldyBJbml0aWFsU3RhdGVzKCk7XG4gICAgb2Zmc2V0ID0gaW5pdHMuZnJvbUJ1ZmZlcihieXRlcywgb2Zmc2V0KTtcbiAgICB0aGlzLmluaXRpYWxzdGF0ZSA9IGluaXRzO1xuXG4gICAgcmV0dXJuIG9mZnNldDtcbiAgfVxuXG4gIC8qKlxuICAgICAqIFJldHVybnMgYSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSByZXByZXNlbnRhdGlvbiBvZiB0aGUgW1tDcmVhdGVBc3NldFR4XV0uXG4gICAgICovXG4gIHRvQnVmZmVyKCk6QnVmZmVyIHtcbiAgICBjb25zdCBzdXBlcmJ1ZmY6QnVmZmVyID0gc3VwZXIudG9CdWZmZXIoKTtcbiAgICBjb25zdCBpbml0c3RhdGVidWZmOkJ1ZmZlciA9IHRoaXMuaW5pdGlhbHN0YXRlLnRvQnVmZmVyKCk7XG5cbiAgICBjb25zdCBuYW1lYnVmZjpCdWZmZXIgPSBCdWZmZXIuYWxsb2ModGhpcy5uYW1lLmxlbmd0aCk7XG4gICAgbmFtZWJ1ZmYud3JpdGUodGhpcy5uYW1lLCAwLCB0aGlzLm5hbWUubGVuZ3RoLCAndXRmOCcpO1xuICAgIGNvbnN0IG5hbWVzaXplOkJ1ZmZlciA9IEJ1ZmZlci5hbGxvYygyKTtcbiAgICBuYW1lc2l6ZS53cml0ZVVJbnQxNkJFKHRoaXMubmFtZS5sZW5ndGgsIDApO1xuXG4gICAgY29uc3Qgc3ltYnVmZjpCdWZmZXIgPSBCdWZmZXIuYWxsb2ModGhpcy5zeW1ib2wubGVuZ3RoKTtcbiAgICBzeW1idWZmLndyaXRlKHRoaXMuc3ltYm9sLCAwLCB0aGlzLnN5bWJvbC5sZW5ndGgsICd1dGY4Jyk7XG4gICAgY29uc3Qgc3ltc2l6ZTpCdWZmZXIgPSBCdWZmZXIuYWxsb2MoMik7XG4gICAgc3ltc2l6ZS53cml0ZVVJbnQxNkJFKHRoaXMuc3ltYm9sLmxlbmd0aCwgMCk7XG5cbiAgICBjb25zdCBic2l6ZTpudW1iZXIgPSBzdXBlcmJ1ZmYubGVuZ3RoICsgbmFtZXNpemUubGVuZ3RoICsgbmFtZWJ1ZmYubGVuZ3RoICsgc3ltc2l6ZS5sZW5ndGggKyBzeW1idWZmLmxlbmd0aCArIHRoaXMuZGVub21pbmF0aW9uLmxlbmd0aCArIGluaXRzdGF0ZWJ1ZmYubGVuZ3RoO1xuICAgIGNvbnN0IGJhcnI6QXJyYXk8QnVmZmVyPiA9IFtzdXBlcmJ1ZmYsIG5hbWVzaXplLCBuYW1lYnVmZiwgc3ltc2l6ZSwgc3ltYnVmZiwgdGhpcy5kZW5vbWluYXRpb24sIGluaXRzdGF0ZWJ1ZmZdO1xuICAgIHJldHVybiBCdWZmZXIuY29uY2F0KGJhcnIsIGJzaXplKTtcbiAgfVxuXG4gIGNsb25lKCk6dGhpcyB7XG4gICAgbGV0IG5ld2Jhc2U6Q3JlYXRlQXNzZXRUeCA9IG5ldyBDcmVhdGVBc3NldFR4KCk7XG4gICAgbmV3YmFzZS5mcm9tQnVmZmVyKHRoaXMudG9CdWZmZXIoKSk7XG4gICAgcmV0dXJuIG5ld2Jhc2UgYXMgdGhpcztcbiAgfVxuXG4gIGNyZWF0ZSguLi5hcmdzOmFueVtdKTp0aGlzIHtcbiAgICAgIHJldHVybiBuZXcgQ3JlYXRlQXNzZXRUeCguLi5hcmdzKSBhcyB0aGlzO1xuICB9XG5cbiAgLyoqXG4gICAqIENsYXNzIHJlcHJlc2VudGluZyBhbiB1bnNpZ25lZCBDcmVhdGUgQXNzZXQgdHJhbnNhY3Rpb24uXG4gICAqXG4gICAqIEBwYXJhbSBuZXR3b3JraWQgT3B0aW9uYWwgbmV0d29ya2lkLCBbW0RlZmF1bHROZXR3b3JrSURdXVxuICAgKiBAcGFyYW0gYmxvY2tjaGFpbmlkIE9wdGlvbmFsIGJsb2NrY2hhaW5pZCwgZGVmYXVsdCBCdWZmZXIuYWxsb2MoMzIsIDE2KVxuICAgKiBAcGFyYW0gb3V0cyBPcHRpb25hbCBhcnJheSBvZiB0aGUgW1tUcmFuc2ZlcmFibGVPdXRwdXRdXXNcbiAgICogQHBhcmFtIGlucyBPcHRpb25hbCBhcnJheSBvZiB0aGUgW1tUcmFuc2ZlcmFibGVJbnB1dF1dc1xuICAgKiBAcGFyYW0gbWVtbyBPcHRpb25hbCB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSBmb3IgdGhlIG1lbW8gZmllbGRcbiAgICogQHBhcmFtIG5hbWUgU3RyaW5nIGZvciB0aGUgZGVzY3JpcHRpdmUgbmFtZSBvZiB0aGUgYXNzZXRcbiAgICogQHBhcmFtIHN5bWJvbCBTdHJpbmcgZm9yIHRoZSB0aWNrZXIgc3ltYm9sIG9mIHRoZSBhc3NldFxuICAgKiBAcGFyYW0gZGVub21pbmF0aW9uIE9wdGlvbmFsIG51bWJlciBmb3IgdGhlIGRlbm9taW5hdGlvbiB3aGljaCBpcyAxMF5ELiBEIG11c3QgYmUgPj0gMCBhbmQgPD0gMzIuIEV4OiAkMSBBVkFYID0gMTBeOSAkbkFWQVhcbiAgICogQHBhcmFtIGluaXRpYWxzdGF0ZSBPcHRpb25hbCBbW0luaXRpYWxTdGF0ZXNdXSB0aGF0IHJlcHJlc2VudCB0aGUgaW50aWFsIHN0YXRlIG9mIGEgY3JlYXRlZCBhc3NldFxuICAgKi9cbiAgY29uc3RydWN0b3IoXG4gICAgbmV0d29ya2lkOm51bWJlciA9IERlZmF1bHROZXR3b3JrSUQsIGJsb2NrY2hhaW5pZDpCdWZmZXIgPSBCdWZmZXIuYWxsb2MoMzIsIDE2KSxcbiAgICBvdXRzOkFycmF5PFRyYW5zZmVyYWJsZU91dHB1dD4gPSB1bmRlZmluZWQsIGluczpBcnJheTxUcmFuc2ZlcmFibGVJbnB1dD4gPSB1bmRlZmluZWQsXG4gICAgbWVtbzpCdWZmZXIgPSB1bmRlZmluZWQsIG5hbWU6c3RyaW5nID0gdW5kZWZpbmVkLCBzeW1ib2w6c3RyaW5nID0gdW5kZWZpbmVkLCBkZW5vbWluYXRpb246bnVtYmVyID0gdW5kZWZpbmVkLFxuICAgIGluaXRpYWxzdGF0ZTpJbml0aWFsU3RhdGVzID0gdW5kZWZpbmVkXG4gICkge1xuICAgIHN1cGVyKG5ldHdvcmtpZCwgYmxvY2tjaGFpbmlkLCBvdXRzLCBpbnMsIG1lbW8pO1xuICAgIGlmIChcbiAgICAgIHR5cGVvZiBuYW1lID09PSAnc3RyaW5nJyAmJiB0eXBlb2Ygc3ltYm9sID09PSAnc3RyaW5nJyAmJiB0eXBlb2YgZGVub21pbmF0aW9uID09PSAnbnVtYmVyJ1xuICAgICAgICAgICAgJiYgZGVub21pbmF0aW9uID49IDAgJiYgZGVub21pbmF0aW9uIDw9IDMyICYmIHR5cGVvZiBpbml0aWFsc3RhdGUgIT09ICd1bmRlZmluZWQnXG4gICAgKSB7XG4gICAgICB0aGlzLmluaXRpYWxzdGF0ZSA9IGluaXRpYWxzdGF0ZTtcbiAgICAgIHRoaXMubmFtZSA9IG5hbWU7XG4gICAgICB0aGlzLnN5bWJvbCA9IHN5bWJvbDtcbiAgICAgIHRoaXMuZGVub21pbmF0aW9uLndyaXRlVUludDgoZGVub21pbmF0aW9uLCAwKTtcbiAgICB9XG4gIH1cbn0iXX0=