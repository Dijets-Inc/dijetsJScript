/**
 * @packageDocumentation
 * @module API-AVM-KeyChain
 */
import { Buffer } from 'buffer/';
import { SECP256k1KeyChain, SECP256k1KeyPair } from '../../common/secp256k1';
/**
 * Class for representing a private and public keypair on an AVM Chain.
 */
export declare class KeyPair extends SECP256k1KeyPair {
    protected chainid: string;
    protected hrp: string;
    /**
     * Returns the address's string representation.
     *
     * @returns A string representation of the address
     */
    getAddressString: () => string;
    /**
       * Returns the chainID associated with this key.
       *
       * @returns The [[KeyPair]]'s chainID
       */
    getChainID: () => string;
    /**
     * Sets the the chainID associated with this key.
     *
     * @param chainid String for the chainID
     */
    setChainID: (chainid: string) => void;
    /**
     * Returns the Human-Readable-Part of the network associated with this key.
     *
     * @returns The [[KeyPair]]'s Human-Readable-Part of the network's Bech32 addressing scheme
     */
    getHRP: () => string;
    /**
     * Sets the the Human-Readable-Part of the network associated with this key.
     *
     * @param hrp String for the Human-Readable-Part of Bech32 addresses
     */
    setHRP: (hrp: string) => void;
    clone(): this;
    create(...args: any[]): this;
    constructor(hrp: string, chainid: string);
}
/**
 * Class for representing a key chain in Dijets.
 *
 * @typeparam KeyPair Class extending [[SECP256k1KeyChain]] which is used as the key in [[KeyChain]]
 */
export declare class KeyChain extends SECP256k1KeyChain<KeyPair> {
    hrp: string;
    chainid: string;
    /**
     * Makes a new key pair, returns the address.
     *
     * @returns The new key pair
     */
    makeKey: () => KeyPair;
    addKey: (newKey: KeyPair) => void;
    /**
     * Given a private key, makes a new key pair, returns the address.
     *
     * @param privk A {@link https://github.com/feross/buffer|Buffer} or cb58 serialized string representing the private key
     *
     * @returns The new key pair
     */
    importKey: (privk: Buffer | string) => KeyPair;
    create(...args: any[]): this;
    clone(): this;
    union(kc: this): this;
    /**
     * Returns instance of KeyChain.
     */
    constructor(hrp: string, chainid: string);
}
//# sourceMappingURL=keychain.d.ts.map