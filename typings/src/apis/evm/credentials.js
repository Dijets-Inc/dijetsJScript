"use strict";
/**
 * @packageDocumentation
 * @module API-EVM-Credentials
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
    if (credid === constants_1.EVMConstants.SECPCREDENTIAL) {
        return new SECPCredential(...args);
    }
    /* istanbul ignore next */
    throw new Error("Error - SelectCredentialClass: unknown credid");
};
class SECPCredential extends credentials_1.Credential {
    constructor() {
        super(...arguments);
        this._typeName = "SECPCredential";
        this._typeID = constants_1.EVMConstants.SECPCREDENTIAL;
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
        let credential = exports.SelectCredentialClass(id, ...args);
        return credential;
    }
}
exports.SECPCredential = SECPCredential;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY3JlZGVudGlhbHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9zcmMvYXBpcy9ldm0vY3JlZGVudGlhbHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7R0FHRzs7O0FBRUgsMkNBQTJDO0FBQzNDLDBEQUFzRDtBQUV0RDs7Ozs7O0dBTUc7QUFDVSxRQUFBLHFCQUFxQixHQUFHLENBQUMsTUFBYyxFQUFFLEdBQUcsSUFBVyxFQUFjLEVBQUU7SUFDbEYsSUFBSSxNQUFNLEtBQUssd0JBQVksQ0FBQyxjQUFjLEVBQUU7UUFDMUMsT0FBTyxJQUFJLGNBQWMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDO0tBQ3BDO0lBQ0QsMEJBQTBCO0lBQzFCLE1BQU0sSUFBSSxLQUFLLENBQUMsK0NBQStDLENBQUMsQ0FBQztBQUNuRSxDQUFDLENBQUM7QUFFRixNQUFhLGNBQWUsU0FBUSx3QkFBVTtJQUE5Qzs7UUFDWSxjQUFTLEdBQVcsZ0JBQWdCLENBQUM7UUFDckMsWUFBTyxHQUFXLHdCQUFZLENBQUMsY0FBYyxDQUFDO0lBc0IxRCxDQUFDO0lBcEJDLDhDQUE4QztJQUU5QyxlQUFlO1FBQ2IsT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDO0lBQ3RCLENBQUM7SUFFRCxLQUFLO1FBQ0gsSUFBSSxPQUFPLEdBQW1CLElBQUksY0FBYyxFQUFFLENBQUM7UUFDbkQsT0FBTyxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQztRQUNwQyxPQUFPLE9BQWUsQ0FBQztJQUN6QixDQUFDO0lBRUQsTUFBTSxDQUFDLEdBQUcsSUFBVztRQUNuQixPQUFPLElBQUksY0FBYyxDQUFDLEdBQUcsSUFBSSxDQUFTLENBQUM7SUFDN0MsQ0FBQztJQUVELE1BQU0sQ0FBQyxFQUFVLEVBQUUsR0FBRyxJQUFXO1FBQy9CLElBQUksVUFBVSxHQUFlLDZCQUFxQixDQUFDLEVBQUUsRUFBRSxHQUFHLElBQUksQ0FBQyxDQUFDO1FBQ2hFLE9BQU8sVUFBVSxDQUFDO0lBQ3BCLENBQUM7Q0FDRjtBQXhCRCx3Q0F3QkMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBwYWNrYWdlRG9jdW1lbnRhdGlvblxuICogQG1vZHVsZSBBUEktRVZNLUNyZWRlbnRpYWxzXG4gKi9cblxuaW1wb3J0IHsgRVZNQ29uc3RhbnRzIH0gZnJvbSAnLi9jb25zdGFudHMnO1xuaW1wb3J0IHsgQ3JlZGVudGlhbCB9IGZyb20gJy4uLy4uL2NvbW1vbi9jcmVkZW50aWFscyc7XG5cbi8qKlxuICogVGFrZXMgYSBidWZmZXIgcmVwcmVzZW50aW5nIHRoZSBjcmVkZW50aWFsIGFuZCByZXR1cm5zIHRoZSBwcm9wZXIgW1tDcmVkZW50aWFsXV0gaW5zdGFuY2UuXG4gKlxuICogQHBhcmFtIGNyZWRpZCBBIG51bWJlciByZXByZXNlbnRpbmcgdGhlIGNyZWRlbnRpYWwgSUQgcGFyc2VkIHByaW9yIHRvIHRoZSBieXRlcyBwYXNzZWQgaW5cbiAqXG4gKiBAcmV0dXJucyBBbiBpbnN0YW5jZSBvZiBhbiBbW0NyZWRlbnRpYWxdXS1leHRlbmRlZCBjbGFzcy5cbiAqL1xuZXhwb3J0IGNvbnN0IFNlbGVjdENyZWRlbnRpYWxDbGFzcyA9IChjcmVkaWQ6IG51bWJlciwgLi4uYXJnczogYW55W10pOiBDcmVkZW50aWFsID0+IHtcbiAgaWYgKGNyZWRpZCA9PT0gRVZNQ29uc3RhbnRzLlNFQ1BDUkVERU5USUFMKSB7XG4gICAgcmV0dXJuIG5ldyBTRUNQQ3JlZGVudGlhbCguLi5hcmdzKTtcbiAgfVxuICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xuICB0aHJvdyBuZXcgRXJyb3IoXCJFcnJvciAtIFNlbGVjdENyZWRlbnRpYWxDbGFzczogdW5rbm93biBjcmVkaWRcIik7XG59O1xuXG5leHBvcnQgY2xhc3MgU0VDUENyZWRlbnRpYWwgZXh0ZW5kcyBDcmVkZW50aWFsIHtcbiAgcHJvdGVjdGVkIF90eXBlTmFtZTogc3RyaW5nID0gXCJTRUNQQ3JlZGVudGlhbFwiO1xuICBwcm90ZWN0ZWQgX3R5cGVJRDogbnVtYmVyID0gRVZNQ29uc3RhbnRzLlNFQ1BDUkVERU5USUFMO1xuXG4gIC8vc2VyaWFsaXplIGFuZCBkZXNlcmlhbGl6ZSBib3RoIGFyZSBpbmhlcml0ZWRcblxuICBnZXRDcmVkZW50aWFsSUQoKTogbnVtYmVyIHtcbiAgICByZXR1cm4gdGhpcy5fdHlwZUlEO1xuICB9XG5cbiAgY2xvbmUoKTogdGhpcyB7XG4gICAgbGV0IG5ld2Jhc2U6IFNFQ1BDcmVkZW50aWFsID0gbmV3IFNFQ1BDcmVkZW50aWFsKCk7XG4gICAgbmV3YmFzZS5mcm9tQnVmZmVyKHRoaXMudG9CdWZmZXIoKSk7XG4gICAgcmV0dXJuIG5ld2Jhc2UgYXMgdGhpcztcbiAgfVxuXG4gIGNyZWF0ZSguLi5hcmdzOiBhbnlbXSk6IHRoaXMge1xuICAgIHJldHVybiBuZXcgU0VDUENyZWRlbnRpYWwoLi4uYXJncykgYXMgdGhpcztcbiAgfVxuXG4gIHNlbGVjdChpZDogbnVtYmVyLCAuLi5hcmdzOiBhbnlbXSk6IENyZWRlbnRpYWwge1xuICAgIGxldCBjcmVkZW50aWFsOiBDcmVkZW50aWFsID0gU2VsZWN0Q3JlZGVudGlhbENsYXNzKGlkLCAuLi5hcmdzKTtcbiAgICByZXR1cm4gY3JlZGVudGlhbDtcbiAgfVxufVxuXG4iXX0=