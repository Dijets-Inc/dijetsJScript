"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StakeableLockIn = exports.SECPTransferInput = exports.AmountInput = exports.TransferableInput = exports.ParseableInput = exports.SelectInputClass = void 0;
/**
 * @packageDocumentation
 * @module API-PlatformVM-Inputs
 */
const buffer_1 = require("buffer/");
const bintools_1 = __importDefault(require("../../utils/bintools"));
const constants_1 = require("./constants");
const input_1 = require("../../common/input");
const serialization_1 = require("../../utils/serialization");
/**
 * @ignore
 */
const bintools = bintools_1.default.getInstance();
const serializer = serialization_1.Serialization.getInstance();
/**
 * Takes a buffer representing the output and returns the proper [[Input]] instance.
 *
 * @param inputid A number representing the inputID parsed prior to the bytes passed in
 *
 * @returns An instance of an [[Input]]-extended class.
 */
exports.SelectInputClass = (inputid, ...args) => {
    if (inputid === constants_1.PlatformVMConstants.SECPINPUTID) {
        return new SECPTransferInput(...args);
    }
    else if (inputid === constants_1.PlatformVMConstants.STAKEABLELOCKINID) {
        return new StakeableLockIn(...args);
    }
    /* istanbul ignore next */
    throw new Error("Error - SelectInputClass: unknown inputid");
};
class ParseableInput extends input_1.StandardParseableInput {
    constructor() {
        super(...arguments);
        this._typeName = "ParseableInput";
        this._typeID = undefined;
    }
    //serialize is inherited
    deserialize(fields, encoding = "hex") {
        super.deserialize(fields, encoding);
        this.input = exports.SelectInputClass(fields["input"]["_typeID"]);
        this.input.deserialize(fields["input"], encoding);
    }
    fromBuffer(bytes, offset = 0) {
        const inputid = bintools.copyFrom(bytes, offset, offset + 4).readUInt32BE(0);
        offset += 4;
        this.input = exports.SelectInputClass(inputid);
        return this.input.fromBuffer(bytes, offset);
    }
}
exports.ParseableInput = ParseableInput;
class TransferableInput extends input_1.StandardTransferableInput {
    constructor() {
        super(...arguments);
        this._typeName = "TransferableInput";
        this._typeID = undefined;
    }
    //serialize is inherited
    deserialize(fields, encoding = "hex") {
        super.deserialize(fields, encoding);
        this.input = exports.SelectInputClass(fields["input"]["_typeID"]);
        this.input.deserialize(fields["input"], encoding);
    }
    /**
     * Takes a {@link https://github.com/feross/buffer|Buffer} containing a [[TransferableInput]], parses it, populates the class, and returns the length of the [[TransferableInput]] in bytes.
     *
     * @param bytes A {@link https://github.com/feross/buffer|Buffer} containing a raw [[TransferableInput]]
     *
     * @returns The length of the raw [[TransferableInput]]
     */
    fromBuffer(bytes, offset = 0) {
        this.txid = bintools.copyFrom(bytes, offset, offset + 32);
        offset += 32;
        this.outputidx = bintools.copyFrom(bytes, offset, offset + 4);
        offset += 4;
        this.assetid = bintools.copyFrom(bytes, offset, offset + constants_1.PlatformVMConstants.ASSETIDLEN);
        offset += 32;
        const inputid = bintools.copyFrom(bytes, offset, offset + 4).readUInt32BE(0);
        offset += 4;
        this.input = exports.SelectInputClass(inputid);
        return this.input.fromBuffer(bytes, offset);
    }
}
exports.TransferableInput = TransferableInput;
class AmountInput extends input_1.StandardAmountInput {
    constructor() {
        super(...arguments);
        this._typeName = "AmountInput";
        this._typeID = undefined;
    }
    //serialize and deserialize both are inherited
    select(id, ...args) {
        return exports.SelectInputClass(id, ...args);
    }
}
exports.AmountInput = AmountInput;
class SECPTransferInput extends AmountInput {
    constructor() {
        super(...arguments);
        this._typeName = "SECPTransferInput";
        this._typeID = constants_1.PlatformVMConstants.SECPINPUTID;
        this.getCredentialID = () => constants_1.PlatformVMConstants.SECPCREDENTIAL;
    }
    //serialize and deserialize both are inherited
    /**
     * Returns the inputID for this input
     */
    getInputID() {
        return this._typeID;
    }
    create(...args) {
        return new SECPTransferInput(...args);
    }
    clone() {
        const newout = this.create();
        newout.fromBuffer(this.toBuffer());
        return newout;
    }
}
exports.SECPTransferInput = SECPTransferInput;
/**
 * An [[Input]] class which specifies an input that has a locktime which can also enable staking of the value held, preventing transfers but not validation.
 */
class StakeableLockIn extends AmountInput {
    /**
     * A [[Output]] class which specifies an [[Input]] that has a locktime which can also enable staking of the value held, preventing transfers but not validation.
     *
     * @param amount A {@link https://github.com/indutny/bn.js/|BN} representing the amount in the input
     * @param stakeableLocktime A {@link https://github.com/indutny/bn.js/|BN} representing the stakeable locktime
     * @param transferableInput A [[ParseableInput]] which is embedded into this input.
     */
    constructor(amount = undefined, stakeableLocktime = undefined, transferableInput = undefined) {
        super(amount);
        this._typeName = "StakeableLockIn";
        this._typeID = constants_1.PlatformVMConstants.STAKEABLELOCKINID;
        this.getCredentialID = () => constants_1.PlatformVMConstants.SECPCREDENTIAL;
        if (typeof stakeableLocktime !== "undefined") {
            this.stakeableLocktime = bintools.fromBNToBuffer(stakeableLocktime, 8);
        }
        if (typeof transferableInput !== "undefined") {
            this.transferableInput = transferableInput;
            this.synchronize();
        }
    }
    //serialize and deserialize both are inherited
    serialize(encoding = "hex") {
        let fields = super.serialize(encoding);
        let outobj = Object.assign(Object.assign({}, fields), { "stakeableLocktime": serializer.encoder(this.stakeableLocktime, encoding, "Buffer", "decimalString", 8), "transferableInput": this.transferableInput.serialize(encoding) });
        delete outobj["sigIdxs"];
        delete outobj["sigCount"];
        delete outobj["amount"];
        return outobj;
    }
    ;
    deserialize(fields, encoding = "hex") {
        fields["sigIdxs"] = [];
        fields["sigCount"] = "0";
        fields["amount"] = "98";
        super.deserialize(fields, encoding);
        this.stakeableLocktime = serializer.decoder(fields["stakeableLocktime"], encoding, "decimalString", "Buffer", 8);
        this.transferableInput = new ParseableInput();
        this.transferableInput.deserialize(fields["transferableInput"], encoding);
        this.synchronize();
    }
    synchronize() {
        let input = this.transferableInput.getInput();
        this.sigIdxs = input.getSigIdxs();
        this.sigCount = buffer_1.Buffer.alloc(4);
        this.sigCount.writeUInt32BE(this.sigIdxs.length, 0);
        this.amount = bintools.fromBNToBuffer(input.getAmount(), 8);
        this.amountValue = input.getAmount();
    }
    getStakeableLocktime() {
        return bintools.fromBufferToBN(this.stakeableLocktime);
    }
    getTransferablInput() {
        return this.transferableInput;
    }
    /**
     * Returns the inputID for this input
     */
    getInputID() {
        return this._typeID;
    }
    /**
     * Popuates the instance from a {@link https://github.com/feross/buffer|Buffer} representing the [[StakeableLockIn]] and returns the size of the output.
     */
    fromBuffer(bytes, offset = 0) {
        this.stakeableLocktime = bintools.copyFrom(bytes, offset, offset + 8);
        offset += 8;
        this.transferableInput = new ParseableInput();
        offset = this.transferableInput.fromBuffer(bytes, offset);
        this.synchronize();
        return offset;
    }
    /**
     * Returns the buffer representing the [[StakeableLockIn]] instance.
     */
    toBuffer() {
        const xferinBuff = this.transferableInput.toBuffer();
        const bsize = this.stakeableLocktime.length + xferinBuff.length;
        const barr = [this.stakeableLocktime, xferinBuff];
        return buffer_1.Buffer.concat(barr, bsize);
    }
    create(...args) {
        return new StakeableLockIn(...args);
    }
    clone() {
        const newout = this.create();
        newout.fromBuffer(this.toBuffer());
        return newout;
    }
    select(id, ...args) {
        return exports.SelectInputClass(id, ...args);
    }
}
exports.StakeableLockIn = StakeableLockIn;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5wdXRzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vc3JjL2FwaXMvcGxhdGZvcm12bS9pbnB1dHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQUE7OztHQUdHO0FBQ0gsb0NBQWlDO0FBQ2pDLG9FQUE0QztBQUM1QywyQ0FBa0Q7QUFDbEQsOENBQW1IO0FBQ25ILDZEQUE4RTtBQUc5RTs7R0FFRztBQUNILE1BQU0sUUFBUSxHQUFHLGtCQUFRLENBQUMsV0FBVyxFQUFFLENBQUM7QUFDeEMsTUFBTSxVQUFVLEdBQUcsNkJBQWEsQ0FBQyxXQUFXLEVBQUUsQ0FBQztBQUUvQzs7Ozs7O0dBTUc7QUFDVSxRQUFBLGdCQUFnQixHQUFHLENBQUMsT0FBYyxFQUFFLEdBQUcsSUFBZSxFQUFRLEVBQUU7SUFDM0UsSUFBSSxPQUFPLEtBQUssK0JBQW1CLENBQUMsV0FBVyxFQUFFO1FBQy9DLE9BQU8sSUFBSSxpQkFBaUIsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDO0tBQ3ZDO1NBQU0sSUFBSSxPQUFPLEtBQUssK0JBQW1CLENBQUMsaUJBQWlCLEVBQUU7UUFDNUQsT0FBTyxJQUFJLGVBQWUsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDO0tBQ3JDO0lBQ0QsMEJBQTBCO0lBQzFCLE1BQU0sSUFBSSxLQUFLLENBQUMsMkNBQTJDLENBQUMsQ0FBQztBQUMvRCxDQUFDLENBQUM7QUFFRixNQUFhLGNBQWUsU0FBUSw4QkFBc0I7SUFBMUQ7O1FBQ1ksY0FBUyxHQUFHLGdCQUFnQixDQUFDO1FBQzdCLFlBQU8sR0FBRyxTQUFTLENBQUM7SUFnQmhDLENBQUM7SUFkQyx3QkFBd0I7SUFFeEIsV0FBVyxDQUFDLE1BQWEsRUFBRSxXQUE4QixLQUFLO1FBQzVELEtBQUssQ0FBQyxXQUFXLENBQUMsTUFBTSxFQUFFLFFBQVEsQ0FBQyxDQUFDO1FBQ3BDLElBQUksQ0FBQyxLQUFLLEdBQUcsd0JBQWdCLENBQUMsTUFBTSxDQUFDLE9B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QUFHLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxVQUFVLENBQUMsS0FBSyxFQUFFLE1BQU0sQ0FBQyxDQUFDO1FBQzFELElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQztRQUNuQixPQUFPLE1BQU0sQ0FBQztJQUNoQixDQUFDO0lBRUQ7O09BRUc7SUFDSCxRQUFRO1FBQ04sTUFBTSxVQUFVLEdBQVUsSUFBSSxDQUFDLGlCQUFpQixDQUFDLFFBQVEsRUFBRSxDQUFDO1FBQzVELE1BQU0sS0FBSyxHQUFVLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxNQUFNLEdBQUcsVUFBVSxDQUFDLE1BQU0sQ0FBQztRQUN2RSxNQUFNLElBQUksR0FBaUIsQ0FBQyxJQUFJLENBQUMsaUJBQWlCLEVBQUUsVUFBVSxDQUFDLENBQUM7UUFDaEUsT0FBTyxlQUFNLENBQUMsTUFBTSxDQUFDLElBQUksRUFBRSxLQUFLLENBQUMsQ0FBQztJQUNwQyxDQUFDO0lBRUQsTUFBTSxDQUFDLEdBQUcsSUFBVTtRQUNsQixPQUFPLElBQUksZUFBZSxDQUFDLEdBQUcsSUFBSSxDQUFTLENBQUM7SUFDOUMsQ0FBQztJQUVELEtBQUs7UUFDSCxNQUFNLE1BQU0sR0FBbUIsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFBO1FBQzVDLE1BQU0sQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUM7UUFDbkMsT0FBTyxNQUFjLENBQUM7SUFDeEIsQ0FBQztJQUVELE1BQU0sQ0FBQyxFQUFTLEVBQUUsR0FBRyxJQUFXO1FBQzlCLE9BQU8sd0JBQWdCLENBQUMsRUFBRSxFQUFFLEdBQUcsSUFBSSxDQUFDLENBQUM7SUFDdkMsQ0FBQztDQW1CRjtBQTlHRCwwQ0E4R0MiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBwYWNrYWdlRG9jdW1lbnRhdGlvblxuICogQG1vZHVsZSBBUEktUGxhdGZvcm1WTS1JbnB1dHNcbiAqL1xuaW1wb3J0IHsgQnVmZmVyIH0gZnJvbSAnYnVmZmVyLyc7XG5pbXBvcnQgQmluVG9vbHMgZnJvbSAnLi4vLi4vdXRpbHMvYmludG9vbHMnO1xuaW1wb3J0IHsgUGxhdGZvcm1WTUNvbnN0YW50cyB9IGZyb20gJy4vY29uc3RhbnRzJztcbmltcG9ydCB7IElucHV0LCBTdGFuZGFyZFRyYW5zZmVyYWJsZUlucHV0LCBTdGFuZGFyZEFtb3VudElucHV0LCBTdGFuZGFyZFBhcnNlYWJsZUlucHV0IH0gZnJvbSAnLi4vLi4vY29tbW9uL2lucHV0JztcbmltcG9ydCB7IFNlcmlhbGl6YXRpb24sIFNlcmlhbGl6ZWRFbmNvZGluZyB9IGZyb20gJy4uLy4uL3V0aWxzL3NlcmlhbGl6YXRpb24nO1xuaW1wb3J0IEJOIGZyb20gJ2JuLmpzJztcblxuLyoqXG4gKiBAaWdub3JlXG4gKi9cbmNvbnN0IGJpbnRvb2xzID0gQmluVG9vbHMuZ2V0SW5zdGFuY2UoKTtcbmNvbnN0IHNlcmlhbGl6ZXIgPSBTZXJpYWxpemF0aW9uLmdldEluc3RhbmNlKCk7XG5cbi8qKlxuICogVGFrZXMgYSBidWZmZXIgcmVwcmVzZW50aW5nIHRoZSBvdXRwdXQgYW5kIHJldHVybnMgdGhlIHByb3BlciBbW0lucHV0XV0gaW5zdGFuY2UuXG4gKlxuICogQHBhcmFtIGlucHV0aWQgQSBudW1iZXIgcmVwcmVzZW50aW5nIHRoZSBpbnB1dElEIHBhcnNlZCBwcmlvciB0byB0aGUgYnl0ZXMgcGFzc2VkIGluXG4gKlxuICogQHJldHVybnMgQW4gaW5zdGFuY2Ugb2YgYW4gW1tJbnB1dF1dLWV4dGVuZGVkIGNsYXNzLlxuICovXG5leHBvcnQgY29uc3QgU2VsZWN0SW5wdXRDbGFzcyA9IChpbnB1dGlkOm51bWJlciwgLi4uYXJnczpBcnJheTxhbnk+KTpJbnB1dCA9PiB7XG4gIGlmIChpbnB1dGlkID09PSBQbGF0Zm9ybVZNQ29uc3RhbnRzLlNFQ1BJTlBVVElEKSB7XG4gICAgcmV0dXJuIG5ldyBTRUNQVHJhbnNmZXJJbnB1dCguLi5hcmdzKTtcbiAgfSBlbHNlIGlmIChpbnB1dGlkID09PSBQbGF0Zm9ybVZNQ29uc3RhbnRzLlNUQUtFQUJMRUxPQ0tJTklEKSB7XG4gICAgcmV0dXJuIG5ldyBTdGFrZWFibGVMb2NrSW4oLi4uYXJncyk7XG4gIH1cbiAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cbiAgdGhyb3cgbmV3IEVycm9yKFwiRXJyb3IgLSBTZWxlY3RJbnB1dENsYXNzOiB1bmtub3duIGlucHV0aWRcIik7XG59O1xuXG5leHBvcnQgY2xhc3MgUGFyc2VhYmxlSW5wdXQgZXh0ZW5kcyBTdGFuZGFyZFBhcnNlYWJsZUlucHV0e1xuICBwcm90ZWN0ZWQgX3R5cGVOYW1lID0gXCJQYXJzZWFibGVJbnB1dFwiO1xuICBwcm90ZWN0ZWQgX3R5cGVJRCA9IHVuZGVmaW5lZDtcblxuICAvL3NlcmlhbGl6ZSBpcyBpbmhlcml0ZWRcblxuICBkZXNlcmlhbGl6ZShmaWVsZHM6b2JqZWN0LCBlbmNvZGluZzpTZXJpYWxpemVkRW5jb2RpbmcgPSBcImhleFwiKSB7XG4gICAgc3VwZXIuZGVzZXJpYWxpemUoZmllbGRzLCBlbmNvZGluZyk7XG4gICAgdGhpcy5pbnB1dCA9IFNlbGVjdElucHV0Q2xhc3MoZmllbGRzW1wiaW5wdXRcIl1bXCJfdHlwZUlEXCJdKTtcbiAgICB0aGlzLmlucHV0LmRlc2VyaWFsaXplKGZpZWxkc1tcImlucHV0XCJdLCBlbmNvZGluZyk7XG4gIH1cblxuICBmcm9tQnVmZmVyKGJ5dGVzOkJ1ZmZlciwgb2Zmc2V0Om51bWJlciA9IDApOm51bWJlciB7XG4gICAgY29uc3QgaW5wdXRpZDpudW1iZXIgPSBiaW50b29scy5jb3B5RnJvbShieXRlcywgb2Zmc2V0LCBvZmZzZXQgKyA0KS5yZWFkVUludDMyQkUoMCk7XG4gICAgb2Zmc2V0ICs9IDQ7XG4gICAgdGhpcy5pbnB1dCA9IFNlbGVjdElucHV0Q2xhc3MoaW5wdXRpZCk7XG4gICAgcmV0dXJuIHRoaXMuaW5wdXQuZnJvbUJ1ZmZlcihieXRlcywgb2Zmc2V0KTtcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgVHJhbnNmZXJhYmxlSW5wdXQgZXh0ZW5kcyBTdGFuZGFyZFRyYW5zZmVyYWJsZUlucHV0IHtcbiAgcHJvdGVjdGVkIF90eXBlTmFtZSA9IFwiVHJhbnNmZXJhYmxlSW5wdXRcIjtcbiAgcHJvdGVjdGVkIF90eXBlSUQgPSB1bmRlZmluZWQ7XG5cbiAgLy9zZXJpYWxpemUgaXMgaW5oZXJpdGVkXG5cbiAgZGVzZXJpYWxpemUoZmllbGRzOm9iamVjdCwgZW5jb2Rpbmc6U2VyaWFsaXplZEVuY29kaW5nID0gXCJoZXhcIikge1xuICAgIHN1cGVyLmRlc2VyaWFsaXplKGZpZWxkcywgZW5jb2RpbmcpO1xuICAgIHRoaXMuaW5wdXQgPSBTZWxlY3RJbnB1dENsYXNzKGZpZWxkc1tcImlucHV0XCJdW1wiX3R5cGVJRFwiXSk7XG4gICAgdGhpcy5pbnB1dC5kZXNlcmlhbGl6ZShmaWVsZHNbXCJpbnB1dFwiXSwgZW5jb2RpbmcpO1xuICB9XG5cbiAgLyoqXG4gICAqIFRha2VzIGEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0gY29udGFpbmluZyBhIFtbVHJhbnNmZXJhYmxlSW5wdXRdXSwgcGFyc2VzIGl0LCBwb3B1bGF0ZXMgdGhlIGNsYXNzLCBhbmQgcmV0dXJucyB0aGUgbGVuZ3RoIG9mIHRoZSBbW1RyYW5zZmVyYWJsZUlucHV0XV0gaW4gYnl0ZXMuXG4gICAqXG4gICAqIEBwYXJhbSBieXRlcyBBIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IGNvbnRhaW5pbmcgYSByYXcgW1tUcmFuc2ZlcmFibGVJbnB1dF1dXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSBsZW5ndGggb2YgdGhlIHJhdyBbW1RyYW5zZmVyYWJsZUlucHV0XV1cbiAgICovXG4gIGZyb21CdWZmZXIoYnl0ZXM6QnVmZmVyLCBvZmZzZXQ6bnVtYmVyID0gMCk6bnVtYmVyIHtcbiAgICB0aGlzLnR4aWQgPSBiaW50b29scy5jb3B5RnJvbShieXRlcywgb2Zmc2V0LCBvZmZzZXQgKyAzMik7XG4gICAgb2Zmc2V0ICs9IDMyO1xuICAgIHRoaXMub3V0cHV0aWR4ID0gYmludG9vbHMuY29weUZyb20oYnl0ZXMsIG9mZnNldCwgb2Zmc2V0ICsgNCk7XG4gICAgb2Zmc2V0ICs9IDQ7XG4gICAgdGhpcy5hc3NldGlkID0gYmludG9vbHMuY29weUZyb20oYnl0ZXMsIG9mZnNldCwgb2Zmc2V0ICsgUGxhdGZvcm1WTUNvbnN0YW50cy5BU1NFVElETEVOKTtcbiAgICBvZmZzZXQgKz0gMzI7XG4gICAgY29uc3QgaW5wdXRpZDpudW1iZXIgPSBiaW50b29scy5jb3B5RnJvbShieXRlcywgb2Zmc2V0LCBvZmZzZXQgKyA0KS5yZWFkVUludDMyQkUoMCk7XG4gICAgb2Zmc2V0ICs9IDQ7XG4gICAgdGhpcy5pbnB1dCA9IFNlbGVjdElucHV0Q2xhc3MoaW5wdXRpZCk7XG4gICAgcmV0dXJuIHRoaXMuaW5wdXQuZnJvbUJ1ZmZlcihieXRlcywgb2Zmc2V0KTtcbiAgfVxuXG59XG5cbmV4cG9ydCBhYnN0cmFjdCBjbGFzcyBBbW91bnRJbnB1dCBleHRlbmRzIFN0YW5kYXJkQW1vdW50SW5wdXQge1xuICBwcm90ZWN0ZWQgX3R5cGVOYW1lID0gXCJBbW91bnRJbnB1dFwiO1xuICBwcm90ZWN0ZWQgX3R5cGVJRCA9IHVuZGVmaW5lZDtcblxuICAvL3NlcmlhbGl6ZSBhbmQgZGVzZXJpYWxpemUgYm90aCBhcmUgaW5oZXJpdGVkXG5cbiAgc2VsZWN0KGlkOm51bWJlciwgLi4uYXJnczogYW55W10pOklucHV0IHtcbiAgICByZXR1cm4gU2VsZWN0SW5wdXRDbGFzcyhpZCwgLi4uYXJncyk7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIFNFQ1BUcmFuc2ZlcklucHV0IGV4dGVuZHMgQW1vdW50SW5wdXQge1xuICBwcm90ZWN0ZWQgX3R5cGVOYW1lID0gXCJTRUNQVHJhbnNmZXJJbnB1dFwiO1xuICBwcm90ZWN0ZWQgX3R5cGVJRCA9IFBsYXRmb3JtVk1Db25zdGFudHMuU0VDUElOUFVUSUQ7XG5cbiAgLy9zZXJpYWxpemUgYW5kIGRlc2VyaWFsaXplIGJvdGggYXJlIGluaGVyaXRlZFxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSBpbnB1dElEIGZvciB0aGlzIGlucHV0XG4gICAqL1xuICBnZXRJbnB1dElEKCk6bnVtYmVyIHtcbiAgICByZXR1cm4gdGhpcy5fdHlwZUlEO1xuICB9XG5cbiAgZ2V0Q3JlZGVudGlhbElEID0gKCk6bnVtYmVyID0+IFBsYXRmb3JtVk1Db25zdGFudHMuU0VDUENSRURFTlRJQUw7XG5cbiAgY3JlYXRlKC4uLmFyZ3M6YW55W10pOnRoaXN7XG4gICAgcmV0dXJuIG5ldyBTRUNQVHJhbnNmZXJJbnB1dCguLi5hcmdzKSBhcyB0aGlzO1xuICB9XG5cbiAgY2xvbmUoKTp0aGlzIHtcbiAgICBjb25zdCBuZXdvdXQ6U0VDUFRyYW5zZmVySW5wdXQgPSB0aGlzLmNyZWF0ZSgpXG4gICAgbmV3b3V0LmZyb21CdWZmZXIodGhpcy50b0J1ZmZlcigpKTtcbiAgICByZXR1cm4gbmV3b3V0IGFzIHRoaXM7XG4gIH1cblxufVxuXG4vKipcbiAqIEFuIFtbSW5wdXRdXSBjbGFzcyB3aGljaCBzcGVjaWZpZXMgYW4gaW5wdXQgdGhhdCBoYXMgYSBsb2NrdGltZSB3aGljaCBjYW4gYWxzbyBlbmFibGUgc3Rha2luZyBvZiB0aGUgdmFsdWUgaGVsZCwgcHJldmVudGluZyB0cmFuc2ZlcnMgYnV0IG5vdCB2YWxpZGF0aW9uLlxuICovXG5leHBvcnQgY2xhc3MgU3Rha2VhYmxlTG9ja0luIGV4dGVuZHMgQW1vdW50SW5wdXQge1xuICBwcm90ZWN0ZWQgX3R5cGVOYW1lID0gXCJTdGFrZWFibGVMb2NrSW5cIjtcbiAgcHJvdGVjdGVkIF90eXBlSUQgPSBQbGF0Zm9ybVZNQ29uc3RhbnRzLlNUQUtFQUJMRUxPQ0tJTklEO1xuXG4gIC8vc2VyaWFsaXplIGFuZCBkZXNlcmlhbGl6ZSBib3RoIGFyZSBpbmhlcml0ZWRcblxuICBzZXJpYWxpemUoZW5jb2Rpbmc6U2VyaWFsaXplZEVuY29kaW5nID0gXCJoZXhcIik6b2JqZWN0IHtcbiAgICBsZXQgZmllbGRzOm9iamVjdCA9IHN1cGVyLnNlcmlhbGl6ZShlbmNvZGluZyk7XG4gICAgbGV0IG91dG9iajpvYmplY3QgPSB7XG4gICAgICAuLi5maWVsZHMsXG4gICAgICBcInN0YWtlYWJsZUxvY2t0aW1lXCI6IHNlcmlhbGl6ZXIuZW5jb2Rlcih0aGlzLnN0YWtlYWJsZUxvY2t0aW1lLCBlbmNvZGluZywgXCJCdWZmZXJcIiwgXCJkZWNpbWFsU3RyaW5nXCIsIDgpLFxuICAgICAgXCJ0cmFuc2ZlcmFibGVJbnB1dFwiOiB0aGlzLnRyYW5zZmVyYWJsZUlucHV0LnNlcmlhbGl6ZShlbmNvZGluZylcbiAgICB9O1xuICAgIGRlbGV0ZSBvdXRvYmpbXCJzaWdJZHhzXCJdO1xuICAgIGRlbGV0ZSBvdXRvYmpbXCJzaWdDb3VudFwiXTtcbiAgICBkZWxldGUgb3V0b2JqW1wiYW1vdW50XCJdO1xuICAgIHJldHVybiBvdXRvYmo7XG4gIH07XG4gIGRlc2VyaWFsaXplKGZpZWxkczpvYmplY3QsIGVuY29kaW5nOlNlcmlhbGl6ZWRFbmNvZGluZyA9IFwiaGV4XCIpIHtcbiAgICBmaWVsZHNbXCJzaWdJZHhzXCJdID0gW107XG4gICAgZmllbGRzW1wic2lnQ291bnRcIl0gPSBcIjBcIjtcbiAgICBmaWVsZHNbXCJhbW91bnRcIl0gPSBcIjk4XCI7XG4gICAgc3VwZXIuZGVzZXJpYWxpemUoZmllbGRzLCBlbmNvZGluZyk7XG4gICAgdGhpcy5zdGFrZWFibGVMb2NrdGltZSA9IHNlcmlhbGl6ZXIuZGVjb2RlcihmaWVsZHNbXCJzdGFrZWFibGVMb2NrdGltZVwiXSwgZW5jb2RpbmcsIFwiZGVjaW1hbFN0cmluZ1wiLCBcIkJ1ZmZlclwiLCA4KTtcbiAgICB0aGlzLnRyYW5zZmVyYWJsZUlucHV0ID0gbmV3IFBhcnNlYWJsZUlucHV0KCk7XG4gICAgdGhpcy50cmFuc2ZlcmFibGVJbnB1dC5kZXNlcmlhbGl6ZShmaWVsZHNbXCJ0cmFuc2ZlcmFibGVJbnB1dFwiXSwgZW5jb2RpbmcpO1xuICAgIHRoaXMuc3luY2hyb25pemUoKTtcbiAgfVxuXG4gIHByb3RlY3RlZCBzdGFrZWFibGVMb2NrdGltZTpCdWZmZXI7XG4gIHByb3RlY3RlZCB0cmFuc2ZlcmFibGVJbnB1dDpQYXJzZWFibGVJbnB1dDtcblxuICBwcml2YXRlIHN5bmNocm9uaXplKCl7XG4gICAgbGV0IGlucHV0OkFtb3VudElucHV0ID0gdGhpcy50cmFuc2ZlcmFibGVJbnB1dC5nZXRJbnB1dCgpIGFzIEFtb3VudElucHV0O1xuICAgIHRoaXMuc2lnSWR4cyA9IGlucHV0LmdldFNpZ0lkeHMoKTtcbiAgICB0aGlzLnNpZ0NvdW50ID0gQnVmZmVyLmFsbG9jKDQpO1xuICAgIHRoaXMuc2lnQ291bnQud3JpdGVVSW50MzJCRSh0aGlzLnNpZ0lkeHMubGVuZ3RoLCAwKTtcbiAgICB0aGlzLmFtb3VudCA9IGJpbnRvb2xzLmZyb21CTlRvQnVmZmVyKGlucHV0LmdldEFtb3VudCgpLCA4KTtcbiAgICB0aGlzLmFtb3VudFZhbHVlID0gaW5wdXQuZ2V0QW1vdW50KCk7XG4gIH1cblxuICBnZXRTdGFrZWFibGVMb2NrdGltZSgpOkJOIHtcbiAgICByZXR1cm4gYmludG9vbHMuZnJvbUJ1ZmZlclRvQk4odGhpcy5zdGFrZWFibGVMb2NrdGltZSk7XG4gIH1cblxuICBnZXRUcmFuc2ZlcmFibElucHV0KCk6UGFyc2VhYmxlSW5wdXQge1xuICAgIHJldHVybiB0aGlzLnRyYW5zZmVyYWJsZUlucHV0O1xuICB9XG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSBpbnB1dElEIGZvciB0aGlzIGlucHV0XG4gICAqL1xuICBnZXRJbnB1dElEKCk6bnVtYmVyIHtcbiAgICByZXR1cm4gdGhpcy5fdHlwZUlEO1xuICB9XG5cbiAgZ2V0Q3JlZGVudGlhbElEID0gKCk6bnVtYmVyID0+IFBsYXRmb3JtVk1Db25zdGFudHMuU0VDUENSRURFTlRJQUw7XG5cbiAgLyoqXG4gICAqIFBvcHVhdGVzIHRoZSBpbnN0YW5jZSBmcm9tIGEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0gcmVwcmVzZW50aW5nIHRoZSBbW1N0YWtlYWJsZUxvY2tJbl1dIGFuZCByZXR1cm5zIHRoZSBzaXplIG9mIHRoZSBvdXRwdXQuXG4gICAqL1xuICBmcm9tQnVmZmVyKGJ5dGVzOkJ1ZmZlciwgb2Zmc2V0Om51bWJlciA9IDApOm51bWJlciB7XG4gICAgdGhpcy5zdGFrZWFibGVMb2NrdGltZSA9IGJpbnRvb2xzLmNvcHlGcm9tKGJ5dGVzLCBvZmZzZXQsIG9mZnNldCArIDgpO1xuICAgIG9mZnNldCArPSA4O1xuICAgIHRoaXMudHJhbnNmZXJhYmxlSW5wdXQgPSBuZXcgUGFyc2VhYmxlSW5wdXQoKTtcbiAgICBvZmZzZXQgPSB0aGlzLnRyYW5zZmVyYWJsZUlucHV0LmZyb21CdWZmZXIoYnl0ZXMsIG9mZnNldCk7XG4gICAgdGhpcy5zeW5jaHJvbml6ZSgpO1xuICAgIHJldHVybiBvZmZzZXQ7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgYnVmZmVyIHJlcHJlc2VudGluZyB0aGUgW1tTdGFrZWFibGVMb2NrSW5dXSBpbnN0YW5jZS5cbiAgICovXG4gIHRvQnVmZmVyKCk6QnVmZmVyIHtcbiAgICBjb25zdCB4ZmVyaW5CdWZmOkJ1ZmZlciA9IHRoaXMudHJhbnNmZXJhYmxlSW5wdXQudG9CdWZmZXIoKTtcbiAgICBjb25zdCBic2l6ZTpudW1iZXIgPSB0aGlzLnN0YWtlYWJsZUxvY2t0aW1lLmxlbmd0aCArIHhmZXJpbkJ1ZmYubGVuZ3RoO1xuICAgIGNvbnN0IGJhcnI6QXJyYXk8QnVmZmVyPiA9IFt0aGlzLnN0YWtlYWJsZUxvY2t0aW1lLCB4ZmVyaW5CdWZmXTtcbiAgICByZXR1cm4gQnVmZmVyLmNvbmNhdChiYXJyLCBic2l6ZSk7XG4gIH1cbiAgXG4gIGNyZWF0ZSguLi5hcmdzOmFueVtdKTp0aGlze1xuICAgIHJldHVybiBuZXcgU3Rha2VhYmxlTG9ja0luKC4uLmFyZ3MpIGFzIHRoaXM7XG4gIH1cblxuICBjbG9uZSgpOnRoaXMge1xuICAgIGNvbnN0IG5ld291dDpTdGFrZWFibGVMb2NrSW4gPSB0aGlzLmNyZWF0ZSgpXG4gICAgbmV3b3V0LmZyb21CdWZmZXIodGhpcy50b0J1ZmZlcigpKTtcbiAgICByZXR1cm4gbmV3b3V0IGFzIHRoaXM7XG4gIH1cblxuICBzZWxlY3QoaWQ6bnVtYmVyLCAuLi5hcmdzOiBhbnlbXSk6SW5wdXQge1xuICAgIHJldHVybiBTZWxlY3RJbnB1dENsYXNzKGlkLCAuLi5hcmdzKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBIFtbT3V0cHV0XV0gY2xhc3Mgd2hpY2ggc3BlY2lmaWVzIGFuIFtbSW5wdXRdXSB0aGF0IGhhcyBhIGxvY2t0aW1lIHdoaWNoIGNhbiBhbHNvIGVuYWJsZSBzdGFraW5nIG9mIHRoZSB2YWx1ZSBoZWxkLCBwcmV2ZW50aW5nIHRyYW5zZmVycyBidXQgbm90IHZhbGlkYXRpb24uXG4gICAqXG4gICAqIEBwYXJhbSBhbW91bnQgQSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2luZHV0bnkvYm4uanMvfEJOfSByZXByZXNlbnRpbmcgdGhlIGFtb3VudCBpbiB0aGUgaW5wdXRcbiAgICogQHBhcmFtIHN0YWtlYWJsZUxvY2t0aW1lIEEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9pbmR1dG55L2JuLmpzL3xCTn0gcmVwcmVzZW50aW5nIHRoZSBzdGFrZWFibGUgbG9ja3RpbWVcbiAgICogQHBhcmFtIHRyYW5zZmVyYWJsZUlucHV0IEEgW1tQYXJzZWFibGVJbnB1dF1dIHdoaWNoIGlzIGVtYmVkZGVkIGludG8gdGhpcyBpbnB1dC5cbiAgICovXG4gIGNvbnN0cnVjdG9yKGFtb3VudDpCTiA9IHVuZGVmaW5lZCwgc3Rha2VhYmxlTG9ja3RpbWU6Qk4gPSB1bmRlZmluZWQsIHRyYW5zZmVyYWJsZUlucHV0OlBhcnNlYWJsZUlucHV0ID0gdW5kZWZpbmVkKSB7XG4gICAgc3VwZXIoYW1vdW50KTtcbiAgICBpZiAodHlwZW9mIHN0YWtlYWJsZUxvY2t0aW1lICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICB0aGlzLnN0YWtlYWJsZUxvY2t0aW1lID0gYmludG9vbHMuZnJvbUJOVG9CdWZmZXIoc3Rha2VhYmxlTG9ja3RpbWUsIDgpO1xuICAgIH1cbiAgICBpZiAodHlwZW9mIHRyYW5zZmVyYWJsZUlucHV0ICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICB0aGlzLnRyYW5zZmVyYWJsZUlucHV0ID0gdHJhbnNmZXJhYmxlSW5wdXQ7XG4gICAgICB0aGlzLnN5bmNocm9uaXplKCk7XG4gICAgfVxuICB9XG59XG4iXX0=