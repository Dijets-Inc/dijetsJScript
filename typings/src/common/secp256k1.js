"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SECP256k1KeyChain = exports.SECP256k1KeyPair = void 0;
/**
 * @packageDocumentation
 * @module Common-SECP256k1KeyChain
 */
const buffer_1 = require("buffer/");
const elliptic = __importStar(require("elliptic"));
const create_hash_1 = __importDefault(require("create-hash"));
const bintools_1 = __importDefault(require("../utils/bintools"));
const keychain_1 = require("./keychain");
/**
 * @ignore
 */
const EC = elliptic.ec;
/**
 * @ignore
 */
const ec = new EC('secp256k1');
/**
 * @ignore
 */
const ecparams = ec.curve;
/**
 * @ignore
 */
const BN = ecparams.n.constructor;
/**
 * @ignore
 */
const bintools = bintools_1.default.getInstance();
/**
 * Class for representing a private and public keypair on the Platform Chain.
 */
class SECP256k1KeyPair extends keychain_1.StandardKeyPair {
    /**
     * Class for representing a private and public keypair in Dijets PlatformVM.
     */
    constructor() {
        super();
        /**
         * @ignore
         */
        this._sigFromSigBuffer = (sig) => {
            const r = new BN(bintools.copyFrom(sig, 0, 32));
            const s = new BN(bintools.copyFrom(sig, 32, 64));
            const recoveryParam = bintools.copyFrom(sig, 64, 65).readUIntBE(0, 1);
            const sigOpt = {
                r: r,
                s: s,
                recoveryParam: recoveryParam
            };
            return sigOpt;
        };
        /**
           * Generates a new keypair.
           */
        this.generateKey = () => {
            this.keypair = ec.genKeyPair();
            // doing hex translation to get Buffer class
            this.privk = buffer_1.Buffer.from(this.keypair.getPrivate('hex').padStart(64, '0'), 'hex');
            this.pubk = buffer_1.Buffer.from(this.keypair.getPublic(true, 'hex').padStart(66, '0'), 'hex');
        };
        /**
           * Imports a private key and generates the appropriate public key.
           *
           * @param privk A {@link https://github.com/feross/buffer|Buffer} representing the private key
           *
           * @returns true on success, false on failure
           */
        this.importKey = (privk) => {
            this.keypair = ec.keyFromPrivate(privk.toString('hex'), 'hex');
            // doing hex translation to get Buffer class
            this.privk = buffer_1.Buffer.from(this.keypair.getPrivate('hex').padStart(64, '0'), 'hex');
            this.pubk = buffer_1.Buffer.from(this.keypair.getPublic(true, 'hex').padStart(66, '0'), 'hex');
            return true; // silly I know, but the interface requires so it returns true on success, so if Buffer fails validation...
        };
        /**
         * Returns the address as a {@link https://github.com/feross/buffer|Buffer}.
         *
         * @returns A {@link https://github.com/feross/buffer|Buffer} representation of the address
         */
        this.getAddress = () => {
            return this.addressFromPublicKey(this.pubk);
        };
        /**
           * Returns an address given a public key.
           *
           * @param pubk A {@link https://github.com/feross/buffer|Buffer} representing the public key
           *
           * @returns A {@link https://github.com/feross/buffer|Buffer} for the address of the public key.
           */
        this.addressFromPublicKey = (pubk) => {
            if (pubk.length === 65) {
                /* istanbul ignore next */
                pubk = buffer_1.Buffer.from(ec.keyFromPublic(pubk).getPublic(true, 'hex').padStart(66, '0'), 'hex'); // make compact, stick back into buffer
            }
            if (pubk.length === 33) {
                const sha256 = buffer_1.Buffer.from(create_hash_1.default('sha256').update(pubk).digest());
                const ripesha = buffer_1.Buffer.from(create_hash_1.default('ripemd160').update(sha256).digest());
                return ripesha;
            }
            /* istanbul ignore next */
            throw new Error('Unable to make address.');
        };
        /**
         * Returns a string representation of the private key.
         *
         * @returns A cb58 serialized string representation of the private key
         */
        this.getPrivateKeyString = () => {
            return "PrivateKey-" + bintools.cb58Encode(this.privk);
        };
        /**
         * Returns the public key.
         *
         * @returns A cb58 serialized string representation of the public key
         */
        this.getPublicKeyString = () => {
            return bintools.cb58Encode(this.pubk);
        };
        /**
         * Takes a message, signs it, and returns the signature.
         *
         * @param msg The message to sign, be sure to hash first if expected
         *
         * @returns A {@link https://github.com/feross/buffer|Buffer} containing the signature
         */
        this.sign = (msg) => {
            const sigObj = this.keypair.sign(msg, undefined, { canonical: true });
            const recovery = buffer_1.Buffer.alloc(1);
            recovery.writeUInt8(sigObj.recoveryParam, 0);
            const r = buffer_1.Buffer.from(sigObj.r.toArray("be", 32)); //we have to skip native Buffer class, so this is the way
            const s = buffer_1.Buffer.from(sigObj.s.toArray("be", 32)); //we have to skip native Buffer class, so this is the way
            const result = buffer_1.Buffer.concat([r, s, recovery], 65);
            return result;
        };
        /**
         * Verifies that the private key associated with the provided public key produces the signature associated with the given message.
         *
         * @param msg The message associated with the signature
         * @param sig The signature of the signed message
         *
         * @returns True on success, false on failure
         */
        this.verify = (msg, sig) => {
            const sigObj = this._sigFromSigBuffer(sig);
            return ec.verify(msg, sigObj, this.keypair);
        };
        /**
         * Recovers the public key of a message signer from a message and its associated signature.
         *
         * @param msg The message that's signed
         * @param sig The signature that's signed on the message
         *
         * @returns A {@link https://github.com/feross/buffer|Buffer} containing the public key of the signer
         */
        this.recover = (msg, sig) => {
            const sigObj = this._sigFromSigBuffer(sig);
            const pubk = ec.recoverPubKey(msg, sigObj, sigObj.recoveryParam);
            return buffer_1.Buffer.from(pubk.encodeCompressed());
        };
    }
}
exports.SECP256k1KeyPair = SECP256k1KeyPair;
/**
 * Class for representing a key chain in Dijets.
 *
 * @typeparam SECP256k1KeyPair Class extending [[StandardKeyPair]] which is used as the key in [[SECP256k1KeyChain]]
 */
class SECP256k1KeyChain extends keychain_1.StandardKeyChain {
    addKey(newKey) {
        super.addKey(newKey);
    }
}
exports.SECP256k1KeyChain = SECP256k1KeyChain;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VjcDI1NmsxLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL2NvbW1vbi9zZWNwMjU2azEudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBOzs7R0FHRztBQUNILG9DQUFpQztBQUNqQyxtREFBcUM7QUFDckMsOERBQXFDO0FBQ3JDLGlFQUF5QztBQUN6Qyx5Q0FBK0Q7QUFFL0Q7O0dBRUc7QUFDSCxNQUFNLEVBQUUsR0FBdUIsUUFBUSxDQUFDLEVBQUUsQ0FBQztBQUUzQzs7R0FFRztBQUNILE1BQU0sRUFBRSxHQUFnQixJQUFJLEVBQUUsQ0FBQyxXQUFXLENBQUMsQ0FBQztBQUU1Qzs7R0FFRztBQUNILE1BQU0sUUFBUSxHQUFHLEVBQUUsQ0FBQyxLQUFLLENBQUM7QUFFMUI7O0dBRUc7QUFDSCxNQUFNLEVBQUUsR0FBRyxRQUFRLENBQUMsQ0FBQyxDQUFDLFdBQVcsQ0FBQztBQUVsQzs7R0FFRztBQUNILE1BQU0sUUFBUSxHQUFhLGtCQUFRLENBQUMsV0FBVyxFQUFFLENBQUM7QUFHbEQ7O0dBRUc7QUFDSCxNQUFzQixnQkFBaUIsU0FBUSwwQkFBZTtJQWdKMUQ7O09BRUc7SUFDSDtRQUNJLEtBQUssRUFBRSxDQUFDO1FBakpaOztXQUVHO1FBQ08sc0JBQWlCLEdBQUcsQ0FBQyxHQUFVLEVBQStCLEVBQUU7WUFDdEUsTUFBTSxDQUFDLEdBQUcsSUFBSSxFQUFFLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDaEQsTUFBTSxDQUFDLEdBQUcsSUFBSSxFQUFFLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxHQUFHLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDakQsTUFBTSxhQUFhLEdBQVUsUUFBUSxDQUFDLFFBQVEsQ0FBQyxHQUFHLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FB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LENBQUE7UUFFRDs7Ozs7OztXQU9HO1FBQ0gsV0FBTSxHQUFHLENBQUMsR0FBVSxFQUFFLEdBQVUsRUFBVSxFQUFFO1lBQ3hDLE1BQU0sTUFBTSxHQUFnQyxJQUFJLENBQUMsaUJBQWlCLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDeEUsT0FBTyxFQUFFLENBQUMsTUFBTSxDQUFDLEdBQUcsRUFBRSxNQUFNLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQ2hELENBQUMsQ0FBQTtRQUVEOzs7Ozs7O1dBT0c7UUFDSCxZQUFPLEdBQUcsQ0FBQyxHQUFVLEVBQUUsR0FBVSxFQUFTLEVBQUU7WUFDeEMsTUFBTSxNQUFNLEdBQWdDLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUN4RSxNQUFNLElBQUksR0FBRyxFQUFFLENBQUMsYUFBYSxDQUFDLEdBQUcsRUFBRSxNQUFNLEVBQUUsTUFBTSxDQUFDLGFBQWEsQ0FBQyxDQUFDO1lBQ2pFLE9BQU8sZUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQyxDQUFDO1FBQ2hELENBQUMsQ0FBQTtJQU9ELENBQUM7Q0FFSjtBQXZKRCw0Q0F1SkM7QUFFRDs7OztHQUlHO0FBQ0gsTUFBc0IsaUJBQXdELFNBQVEsMkJBQTZCO0lBUy9HLE1BQU0sQ0FBQyxNQUFrQjtRQUNyQixLQUFLLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDO0lBQ3pCLENBQUM7Q0FXSjtBQXRCRCw4Q0FzQkMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBwYWNrYWdlRG9jdW1lbnRhdGlvblxuICogQG1vZHVsZSBDb21tb24tU0VDUDI1NmsxS2V5Q2hhaW5cbiAqL1xuaW1wb3J0IHsgQnVmZmVyIH0gZnJvbSBcImJ1ZmZlci9cIjtcbmltcG9ydCAqIGFzIGVsbGlwdGljIGZyb20gXCJlbGxpcHRpY1wiO1xuaW1wb3J0IGNyZWF0ZUhhc2ggZnJvbSBcImNyZWF0ZS1oYXNoXCI7XG5pbXBvcnQgQmluVG9vbHMgZnJvbSAnLi4vdXRpbHMvYmludG9vbHMnO1xuaW1wb3J0IHsgU3RhbmRhcmRLZXlQYWlyLCBTdGFuZGFyZEtleUNoYWluIH0gZnJvbSAnLi9rZXljaGFpbic7XG5cbi8qKlxuICogQGlnbm9yZVxuICovXG5jb25zdCBFQzogdHlwZW9mIGVsbGlwdGljLmVjID0gZWxsaXB0aWMuZWM7XG5cbi8qKlxuICogQGlnbm9yZVxuICovXG5jb25zdCBlYzogZWxsaXB0aWMuZWMgPSBuZXcgRUMoJ3NlY3AyNTZrMScpO1xuXG4vKipcbiAqIEBpZ25vcmVcbiAqL1xuY29uc3QgZWNwYXJhbXMgPSBlYy5jdXJ2ZTtcblxuLyoqXG4gKiBAaWdub3JlXG4gKi9cbmNvbnN0IEJOID0gZWNwYXJhbXMubi5jb25zdHJ1Y3RvcjtcblxuLyoqXG4gKiBAaWdub3JlXG4gKi9cbmNvbnN0IGJpbnRvb2xzOiBCaW5Ub29scyA9IEJpblRvb2xzLmdldEluc3RhbmNlKCk7XG5cblxuLyoqXG4gKiBDbGFzcyBmb3IgcmVwcmVzZW50aW5nIGEgcHJpdmF0ZSBhbmQgcHVibGljIGtleXBhaXIgb24gdGhlIFBsYXRmb3JtIENoYWluLiBcbiAqL1xuZXhwb3J0IGFic3RyYWN0IGNsYXNzIFNFQ1AyNTZrMUtleVBhaXIgZXh0ZW5kcyBTdGFuZGFyZEtleVBhaXIge1xuICAgIHByb3RlY3RlZCBrZXlwYWlyOmVsbGlwdGljLmVjLktleVBhaXJcblxuICAgIC8qKlxuICAgICAqIEBpZ25vcmVcbiAgICAgKi9cbiAgICBwcm90ZWN0ZWQgX3NpZ0Zyb21TaWdCdWZmZXIgPSAoc2lnOkJ1ZmZlcik6ZWxsaXB0aWMuZWMuU2lnbmF0dXJlT3B0aW9ucyA9PiB7XG4gICAgICAgIGNvbnN0IHIgPSBuZXcgQk4oYmludG9vbHMuY29weUZyb20oc2lnLCAwLCAzMikpO1xuICAgICAgICBjb25zdCBzID0gbmV3IEJOKGJpbnRvb2xzLmNvcHlGcm9tKHNpZywgMzIsIDY0KSk7XG4gICAgICAgIGNvbnN0IHJlY292ZXJ5UGFyYW06bnVtYmVyID0gYmludG9vbHMuY29weUZyb20oc2lnLCA2NCwgNjUpLnJlYWRVSW50QkUoMCwgMSk7XG4gICAgICAgIGNvbnN0IHNpZ09wdCA9IHtcbiAgICAgICAgICAgIHI6cixcbiAgICAgICAgICAgIHM6cyxcbiAgICAgICAgICAgIHJlY292ZXJ5UGFyYW06cmVjb3ZlcnlQYXJhbVxuICAgICAgICB9O1xuICAgICAgICByZXR1cm4gc2lnT3B0O1xuICAgIH1cblxuICAvKipcbiAgICAgKiBHZW5lcmF0ZXMgYSBuZXcga2V5cGFpci5cbiAgICAgKi9cbiAgICBnZW5lcmF0ZUtleSA9ICgpID0+IHtcbiAgICAgICAgdGhpcy5rZXlwYWlyID0gZWMuZ2VuS2V5UGFpcigpO1xuICAgIFxuICAgICAgICAvLyBkb2luZyBoZXggdHJhbnNsYXRpb24gdG8gZ2V0IEJ1ZmZlciBjbGFzc1xuICAgICAgICB0aGlzLnByaXZrID0gQnVmZmVyLmZyb20odGhpcy5rZXlwYWlyLmdldFByaXZhdGUoJ2hleCcpLnBhZFN0YXJ0KDY0LCAnMCcpLCAnaGV4Jyk7XG4gICAgICAgIHRoaXMucHViayA9IEJ1ZmZlci5mcm9tKHRoaXMua2V5cGFpci5nZXRQdWJsaWModHJ1ZSwgJ2hleCcpLnBhZFN0YXJ0KDY2LCAnMCcpLCAnaGV4Jyk7XG4gICAgICB9O1xuXG4gIC8qKlxuICAgICAqIEltcG9ydHMgYSBwcml2YXRlIGtleSBhbmQgZ2VuZXJhdGVzIHRoZSBhcHByb3ByaWF0ZSBwdWJsaWMga2V5LlxuICAgICAqXG4gICAgICogQHBhcmFtIHByaXZrIEEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0gcmVwcmVzZW50aW5nIHRoZSBwcml2YXRlIGtleVxuICAgICAqXG4gICAgICogQHJldHVybnMgdHJ1ZSBvbiBzdWNjZXNzLCBmYWxzZSBvbiBmYWlsdXJlXG4gICAgICovXG4gICAgaW1wb3J0S2V5ID0gKHByaXZrOkJ1ZmZlcik6Ym9vbGVhbiA9PiB7XG4gICAgICAgIHRoaXMua2V5cGFpciA9IGVjLmtleUZyb21Qcml2YXRlKHByaXZrLnRvU3RyaW5nKCdoZXgnKSwgJ2hleCcpO1xuICAgICAgICAvLyBkb2luZyBoZXggdHJhbnNsYXRpb24gdG8gZ2V0IEJ1ZmZlciBjbGFzc1xuICAgICAgICB0aGlzLnByaXZrID0gQnVmZmVyLmZyb20odGhpcy5rZXlwYWlyLmdldFByaXZhdGUoJ2hleCcpLnBhZFN0YXJ0KDY0LCAnMCcpLCAnaGV4Jyk7XG4gICAgICAgIHRoaXMucHViayA9IEJ1ZmZlci5mcm9tKHRoaXMua2V5cGFpci5nZXRQdWJsaWModHJ1ZSwgJ2hleCcpLnBhZFN0YXJ0KDY2LCAnMCcpLCAnaGV4Jyk7XG4gICAgICAgIHJldHVybiB0cnVlOyAvLyBzaWxseSBJIGtub3csIGJ1dCB0aGUgaW50ZXJmYWNlIHJlcXVpcmVzIHNvIGl0IHJldHVybnMgdHJ1ZSBvbiBzdWNjZXNzLCBzbyBpZiBCdWZmZXIgZmFpbHMgdmFsaWRhdGlvbi4uLlxuICAgICAgfTtcblxuICAgIC8qKlxuICAgICAqIFJldHVybnMgdGhlIGFkZHJlc3MgYXMgYSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfS5cbiAgICAgKiBcbiAgICAgKiBAcmV0dXJucyBBIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IHJlcHJlc2VudGF0aW9uIG9mIHRoZSBhZGRyZXNzXG4gICAgICovXG4gICAgZ2V0QWRkcmVzcyA9ICgpOkJ1ZmZlciA9PiB7XG4gICAgICAgIHJldHVybiB0aGlzLmFkZHJlc3NGcm9tUHVibGljS2V5KHRoaXMucHViayk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmV0dXJucyB0aGUgYWRkcmVzcydzIHN0cmluZyByZXByZXNlbnRhdGlvbi5cbiAgICAgKiBcbiAgICAgKiBAcmV0dXJucyBBIHN0cmluZyByZXByZXNlbnRhdGlvbiBvZiB0aGUgYWRkcmVzc1xuICAgICAqL1xuICAgIGdldEFkZHJlc3NTdHJpbmc6KCkgPT4gc3RyaW5nO1xuXG4gIC8qKlxuICAgICAqIFJldHVybnMgYW4gYWRkcmVzcyBnaXZlbiBhIHB1YmxpYyBrZXkuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gcHViayBBIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IHJlcHJlc2VudGluZyB0aGUgcHVibGljIGtleVxuICAgICAqXG4gICAgICogQHJldHVybnMgQSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSBmb3IgdGhlIGFkZHJlc3Mgb2YgdGhlIHB1YmxpYyBrZXkuXG4gICAgICovXG4gICAgYWRkcmVzc0Zyb21QdWJsaWNLZXkgPSAocHViazpCdWZmZXIpOiBCdWZmZXIgPT4ge1xuICAgICAgICBpZiAocHViay5sZW5ndGggPT09IDY1KSB7XG4gICAgICAgICAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cbiAgICAgICAgICBwdWJrID0gQnVmZmVyLmZyb20oZWMua2V5RnJvbVB1YmxpYyhwdWJrKS5nZXRQdWJsaWModHJ1ZSwgJ2hleCcpLnBhZFN0YXJ0KDY2LCAnMCcpLCAnaGV4Jyk7IC8vIG1ha2UgY29tcGFjdCwgc3RpY2sgYmFjayBpbnRvIGJ1ZmZlclxuICAgICAgICB9XG4gICAgICAgIGlmIChwdWJrLmxlbmd0aCA9PT0gMzMpIHtcbiAgICAgICAgICBjb25zdCBzaGEyNTY6QnVmZmVyID0gQnVmZmVyLmZyb20oY3JlYXRlSGFzaCgnc2hhMjU2JykudXBkYXRlKHB1YmspLmRpZ2VzdCgpKTtcbiAgICAgICAgICBjb25zdCByaXBlc2hhOkJ1ZmZlciA9IEJ1ZmZlci5mcm9tKGNyZWF0ZUhhc2goJ3JpcGVtZDE2MCcpLnVwZGF0ZShzaGEyNTYpLmRpZ2VzdCgpKTtcbiAgICAgICAgICByZXR1cm4gcmlwZXNoYTtcbiAgICAgICAgfVxuICAgICAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1VuYWJsZSB0byBtYWtlIGFkZHJlc3MuJyk7XG4gICAgICB9O1xuXG4gICAgLyoqXG4gICAgICogUmV0dXJucyBhIHN0cmluZyByZXByZXNlbnRhdGlvbiBvZiB0aGUgcHJpdmF0ZSBrZXkuXG4gICAgICogXG4gICAgICogQHJldHVybnMgQSBjYjU4IHNlcmlhbGl6ZWQgc3RyaW5nIHJlcHJlc2VudGF0aW9uIG9mIHRoZSBwcml2YXRlIGtleVxuICAgICAqL1xuICAgIGdldFByaXZhdGVLZXlTdHJpbmcgPSAoKTpzdHJpbmcgPT4ge1xuICAgICAgICByZXR1cm4gXCJQcml2YXRlS2V5LVwiICsgYmludG9vbHMuY2I1OEVuY29kZSh0aGlzLnByaXZrKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIHRoZSBwdWJsaWMga2V5LlxuICAgICAqIFxuICAgICAqIEByZXR1cm5zIEEgY2I1OCBzZXJpYWxpemVkIHN0cmluZyByZXByZXNlbnRhdGlvbiBvZiB0aGUgcHVibGljIGtleVxuICAgICAqL1xuICAgIGdldFB1YmxpY0tleVN0cmluZyA9ICgpOnN0cmluZyA9PiB7XG4gICAgICAgIHJldHVybiBiaW50b29scy5jYjU4RW5jb2RlKHRoaXMucHViayk7XG4gICAgfVxuXG5cbiAgICAvKipcbiAgICAgKiBUYWtlcyBhIG1lc3NhZ2UsIHNpZ25zIGl0LCBhbmQgcmV0dXJucyB0aGUgc2lnbmF0dXJlLlxuICAgICAqIFxuICAgICAqIEBwYXJhbSBtc2cgVGhlIG1lc3NhZ2UgdG8gc2lnbiwgYmUgc3VyZSB0byBoYXNoIGZpcnN0IGlmIGV4cGVjdGVkXG4gICAgICogXG4gICAgICogQHJldHVybnMgQSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSBjb250YWluaW5nIHRoZSBzaWduYXR1cmVcbiAgICAgKi9cbiAgICBzaWduID0gKG1zZzpCdWZmZXIpOkJ1ZmZlciA9PiB7XG4gICAgICAgIGNvbnN0IHNpZ09iaiA9IHRoaXMua2V5cGFpci5zaWduKG1zZywgdW5kZWZpbmVkLCB7IGNhbm9uaWNhbDogdHJ1ZSB9KTtcbiAgICAgICAgY29uc3QgcmVjb3Zlcnk6QnVmZmVyID0gQnVmZmVyLmFsbG9jKDEpO1xuICAgICAgICByZWNvdmVyeS53cml0ZVVJbnQ4KHNpZ09iai5yZWNvdmVyeVBhcmFtLCAwKTtcbiAgICAgICAgY29uc3QgcjpCdWZmZXIgPSBCdWZmZXIuZnJvbShzaWdPYmouci50b0FycmF5KFwiYmVcIiwgMzIpKTsgLy93ZSBoYXZlIHRvIHNraXAgbmF0aXZlIEJ1ZmZlciBjbGFzcywgc28gdGhpcyBpcyB0aGUgd2F5XG4gICAgICAgIGNvbnN0IHM6QnVmZmVyID0gQnVmZmVyLmZyb20oc2lnT2JqLnMudG9BcnJheShcImJlXCIsIDMyKSk7IC8vd2UgaGF2ZSB0byBza2lwIG5hdGl2ZSBCdWZmZXIgY2xhc3MsIHNvIHRoaXMgaXMgdGhlIHdheVxuICAgICAgICBjb25zdCByZXN1bHQ6QnVmZmVyID0gQnVmZmVyLmNvbmNhdChbcixzLCByZWNvdmVyeV0sIDY1KTtcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgICogVmVyaWZpZXMgdGhhdCB0aGUgcHJpdmF0ZSBrZXkgYXNzb2NpYXRlZCB3aXRoIHRoZSBwcm92aWRlZCBwdWJsaWMga2V5IHByb2R1Y2VzIHRoZSBzaWduYXR1cmUgYXNzb2NpYXRlZCB3aXRoIHRoZSBnaXZlbiBtZXNzYWdlLlxuICAgICAqIFxuICAgICAqIEBwYXJhbSBtc2cgVGhlIG1lc3NhZ2UgYXNzb2NpYXRlZCB3aXRoIHRoZSBzaWduYXR1cmVcbiAgICAgKiBAcGFyYW0gc2lnIFRoZSBzaWduYXR1cmUgb2YgdGhlIHNpZ25lZCBtZXNzYWdlXG4gICAgICogXG4gICAgICogQHJldHVybnMgVHJ1ZSBvbiBzdWNjZXNzLCBmYWxzZSBvbiBmYWlsdXJlXG4gICAgICovXG4gICAgdmVyaWZ5ID0gKG1zZzpCdWZmZXIsIHNpZzpCdWZmZXIpOmJvb2xlYW4gPT4geyBcbiAgICAgICAgY29uc3Qgc2lnT2JqOmVsbGlwdGljLmVjLlNpZ25hdHVyZU9wdGlvbnMgPSB0aGlzLl9zaWdGcm9tU2lnQnVmZmVyKHNpZyk7XG4gICAgICAgIHJldHVybiBlYy52ZXJpZnkobXNnLCBzaWdPYmosIHRoaXMua2V5cGFpcik7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmVjb3ZlcnMgdGhlIHB1YmxpYyBrZXkgb2YgYSBtZXNzYWdlIHNpZ25lciBmcm9tIGEgbWVzc2FnZSBhbmQgaXRzIGFzc29jaWF0ZWQgc2lnbmF0dXJlLlxuICAgICAqIFxuICAgICAqIEBwYXJhbSBtc2cgVGhlIG1lc3NhZ2UgdGhhdCdzIHNpZ25lZFxuICAgICAqIEBwYXJhbSBzaWcgVGhlIHNpZ25hdHVyZSB0aGF0J3Mgc2lnbmVkIG9uIHRoZSBtZXNzYWdlXG4gICAgICogXG4gICAgICogQHJldHVybnMgQSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSBjb250YWluaW5nIHRoZSBwdWJsaWMga2V5IG9mIHRoZSBzaWduZXJcbiAgICAgKi9cbiAgICByZWNvdmVyID0gKG1zZzpCdWZmZXIsIHNpZzpCdWZmZXIpOkJ1ZmZlciA9PiB7XG4gICAgICAgIGNvbnN0IHNpZ09iajplbGxpcHRpYy5lYy5TaWduYXR1cmVPcHRpb25zID0gdGhpcy5fc2lnRnJvbVNpZ0J1ZmZlcihzaWcpO1xuICAgICAgICBjb25zdCBwdWJrID0gZWMucmVjb3ZlclB1YktleShtc2csIHNpZ09iaiwgc2lnT2JqLnJlY292ZXJ5UGFyYW0pO1xuICAgICAgICByZXR1cm4gQnVmZmVyLmZyb20ocHViay5lbmNvZGVDb21wcmVzc2VkKCkpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENsYXNzIGZvciByZXByZXNlbnRpbmcgYSBwcml2YXRlIGFuZCBwdWJsaWMga2V5cGFpciBpbiBBdmFsYW5jaGUgUGxhdGZvcm1WTS4gXG4gICAgICovXG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHN1cGVyKCk7XG4gICAgfVxuICAgIFxufVxuXG4vKipcbiAqIENsYXNzIGZvciByZXByZXNlbnRpbmcgYSBrZXkgY2hhaW4gaW4gQXZhbGFuY2hlLiBcbiAqIFxuICogQHR5cGVwYXJhbSBTRUNQMjU2azFLZXlQYWlyIENsYXNzIGV4dGVuZGluZyBbW1N0YW5kYXJkS2V5UGFpcl1dIHdoaWNoIGlzIHVzZWQgYXMgdGhlIGtleSBpbiBbW1NFQ1AyNTZrMUtleUNoYWluXV1cbiAqL1xuZXhwb3J0IGFic3RyYWN0IGNsYXNzIFNFQ1AyNTZrMUtleUNoYWluPFNFQ1BLUENsYXNzIGV4dGVuZHMgU0VDUDI1NmsxS2V5UGFpcj4gZXh0ZW5kcyBTdGFuZGFyZEtleUNoYWluPFNFQ1BLUENsYXNzPiB7XG5cbiAgICAvKipcbiAgICAgKiBNYWtlcyBhIG5ldyBrZXkgcGFpciwgcmV0dXJucyB0aGUgYWRkcmVzcy5cbiAgICAgKiBcbiAgICAgKiBAcmV0dXJucyBBZGRyZXNzIG9mIHRoZSBuZXcga2V5IHBhaXJcbiAgICAgKi9cbiAgICBtYWtlS2V5OigpID0+IFNFQ1BLUENsYXNzOyBcblxuICAgIGFkZEtleShuZXdLZXk6U0VDUEtQQ2xhc3MpIHtcbiAgICAgICAgc3VwZXIuYWRkS2V5KG5ld0tleSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogR2l2ZW4gYSBwcml2YXRlIGtleSwgbWFrZXMgYSBuZXcga2V5IHBhaXIsIHJldHVybnMgdGhlIGFkZHJlc3MuXG4gICAgICogXG4gICAgICogQHBhcmFtIHByaXZrIEEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0gb3IgY2I1OCBzZXJpYWxpemVkIHN0cmluZyByZXByZXNlbnRpbmcgdGhlIHByaXZhdGUga2V5IFxuICAgICAqIFxuICAgICAqIEByZXR1cm5zIEFkZHJlc3Mgb2YgdGhlIG5ldyBrZXkgcGFpclxuICAgICAqL1xuICAgIGltcG9ydEtleToocHJpdms6QnVmZmVyIHwgc3RyaW5nKSA9PiBTRUNQS1BDbGFzcztcblxufVxuIl19