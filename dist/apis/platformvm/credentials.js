"use strict";
/**
 * @packageDocumentation
 * @module API-PlatformVM-Credentials
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SECPCredential = exports.SelectCredentialClass = void 0;
const constants_1 = require("./constants");
const credentials_1 = require("../../common/credentials");
/**
 * Takes a buffer representing the credential and returns the proper [[Credential]] instance.
 *
 * @param credid A number representing the credential ID parsed prior to the bytes passed in
 *
 * @returns An instance of an [[Credential]]-extended class.
 */
exports.SelectCredentialClass = (credid, ...args) => {
    if (credid === constants_1.PlatformVMConstants.SECPCREDENTIAL) {
        return new SECPCredential(...args);
    }
    /* istanbul ignore next */
    throw new Error("Error - SelectCredentialClass: unknown credid");
};
class SECPCredential extends credentials_1.Credential {
    constructor() {
        super(...arguments);
        this._typeName = "SECPCredential";
        this._typeID = constants_1.PlatformVMConstants.SECPCREDENTIAL;
    }
    //serialize and deserialize both are inherited
    getCredentialID() {
        return this._typeID;
    }
    clone() {
        let newbase = new SECPCredential();
        newbase.fromBuffer(this.toBuffer());
        return newbase;
    }
    create(...args) {
        return new SECPCredential(...args);
    }
    select(id, ...args) {
        let newbasetx = exports.SelectCredentialClass(id, ...args);
        return newbasetx;
    }
}
exports.SECPCredential = SECPCredential;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY3JlZGVudGlhbHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9zcmMvYXBpcy9wbGF0Zm9ybXZtL2NyZWRlbnRpYWxzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7O0dBR0c7OztBQUVILDJDQUFrRDtBQUNsRCwwREFBc0Q7QUFFdEQ7Ozs7OztHQU1HO0FBQ1UsUUFBQSxxQkFBcUIsR0FBRyxDQUFDLE1BQWEsRUFBRSxHQUFHLElBQWUsRUFBYSxFQUFFO0lBQ3BGLElBQUksTUFBTSxLQUFLLCtCQUFtQixDQUFDLGNBQWMsRUFBRTtRQUNqRCxPQUFPLElBQUksY0FBYyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUM7S0FDcEM7SUFDRCwwQkFBMEI7SUFDMUIsTUFBTSxJQUFJLEtBQUssQ0FBQywrQ0FBK0MsQ0FBQyxDQUFDO0FBQ25FLENBQUMsQ0FBQztBQUVGLE1BQWEsY0FBZSxTQUFRLHdCQUFVO0lBQTlDOztRQUNZLGNBQVMsR0FBRyxnQkFBZ0IsQ0FBQztRQUM3QixZQUFPLEdBQUcsK0JBQW1CLENBQUMsY0FBYyxDQUFDO0lBdUJ6RCxDQUFDO0lBckJDLDhDQUE4QztJQUU5QyxlQUFlO1FBQ2IsT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDO0lBQ3RCLENBQUM7SUFHRCxLQUFLO1FBQ0gsSUFBSSxPQUFPLEdBQWtCLElBQUksY0FBYyxFQUFFLENBQUM7UUFDbEQsT0FBTyxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQztRQUNwQyxPQUFPLE9BQWUsQ0FBQztJQUN6QixDQUFDO0lBRUQsTUFBTSxDQUFDLEdBQUcsSUFBVTtRQUNsQixPQUFPLElBQUksY0FBYyxDQUFDLEdBQUcsSUFBSSxDQUFTLENBQUM7SUFDN0MsQ0FBQztJQUVELE1BQU0sQ0FBQyxFQUFTLEVBQUUsR0FBRyxJQUFVO1FBQzdCLElBQUksU0FBUyxHQUFjLDZCQUFxQixDQUFDLEVBQUUsRUFBRSxHQUFHLElBQUksQ0FBQyxDQUFDO1FBQzlELE9BQU8sU0FBUyxDQUFDO0lBQ25CLENBQUM7Q0FDRjtBQXpCRCx3Q0F5QkMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBwYWNrYWdlRG9jdW1lbnRhdGlvblxuICogQG1vZHVsZSBBUEktUGxhdGZvcm1WTS1DcmVkZW50aWFsc1xuICovXG5cbmltcG9ydCB7IFBsYXRmb3JtVk1Db25zdGFudHMgfSBmcm9tICcuL2NvbnN0YW50cyc7XG5pbXBvcnQgeyBDcmVkZW50aWFsIH0gZnJvbSAnLi4vLi4vY29tbW9uL2NyZWRlbnRpYWxzJztcblxuLyoqXG4gKiBUYWtlcyBhIGJ1ZmZlciByZXByZXNlbnRpbmcgdGhlIGNyZWRlbnRpYWwgYW5kIHJldHVybnMgdGhlIHByb3BlciBbW0NyZWRlbnRpYWxdXSBpbnN0YW5jZS5cbiAqXG4gKiBAcGFyYW0gY3JlZGlkIEEgbnVtYmVyIHJlcHJlc2VudGluZyB0aGUgY3JlZGVudGlhbCBJRCBwYXJzZWQgcHJpb3IgdG8gdGhlIGJ5dGVzIHBhc3NlZCBpblxuICpcbiAqIEByZXR1cm5zIEFuIGluc3RhbmNlIG9mIGFuIFtbQ3JlZGVudGlhbF1dLWV4dGVuZGVkIGNsYXNzLlxuICovXG5leHBvcnQgY29uc3QgU2VsZWN0Q3JlZGVudGlhbENsYXNzID0gKGNyZWRpZDpudW1iZXIsIC4uLmFyZ3M6QXJyYXk8YW55Pik6Q3JlZGVudGlhbCA9PiB7XG4gIGlmIChjcmVkaWQgPT09IFBsYXRmb3JtVk1Db25zdGFudHMuU0VDUENSRURFTlRJQUwpIHtcbiAgICByZXR1cm4gbmV3IFNFQ1BDcmVkZW50aWFsKC4uLmFyZ3MpO1xuICB9XG4gIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXG4gIHRocm93IG5ldyBFcnJvcihcIkVycm9yIC0gU2VsZWN0Q3JlZGVudGlhbENsYXNzOiB1bmtub3duIGNyZWRpZFwiKTtcbn07XG5cbmV4cG9ydCBjbGFzcyBTRUNQQ3JlZGVudGlhbCBleHRlbmRzIENyZWRlbnRpYWwge1xuICBwcm90ZWN0ZWQgX3R5cGVOYW1lID0gXCJTRUNQQ3JlZGVudGlhbFwiO1xuICBwcm90ZWN0ZWQgX3R5cGVJRCA9IFBsYXRmb3JtVk1Db25zdGFudHMuU0VDUENSRURFTlRJQUw7XG5cbiAgLy9zZXJpYWxpemUgYW5kIGRlc2VyaWFsaXplIGJvdGggYXJlIGluaGVyaXRlZFxuXG4gIGdldENyZWRlbnRpYWxJRCgpOm51bWJlciB7XG4gICAgcmV0dXJuIHRoaXMuX3R5cGVJRDtcbiAgfVxuXG5cbiAgY2xvbmUoKTp0aGlzIHtcbiAgICBsZXQgbmV3YmFzZTpTRUNQQ3JlZGVudGlhbCA9IG5ldyBTRUNQQ3JlZGVudGlhbCgpO1xuICAgIG5ld2Jhc2UuZnJvbUJ1ZmZlcih0aGlzLnRvQnVmZmVyKCkpO1xuICAgIHJldHVybiBuZXdiYXNlIGFzIHRoaXM7XG4gIH1cblxuICBjcmVhdGUoLi4uYXJnczphbnlbXSk6dGhpcyB7XG4gICAgcmV0dXJuIG5ldyBTRUNQQ3JlZGVudGlhbCguLi5hcmdzKSBhcyB0aGlzO1xuICB9XG5cbiAgc2VsZWN0KGlkOm51bWJlciwgLi4uYXJnczphbnlbXSk6Q3JlZGVudGlhbCB7XG4gICAgbGV0IG5ld2Jhc2V0eDpDcmVkZW50aWFsID0gU2VsZWN0Q3JlZGVudGlhbENsYXNzKGlkLCAuLi5hcmdzKTtcbiAgICByZXR1cm4gbmV3YmFzZXR4O1xuICB9XG59XG5cbiJdfQ==