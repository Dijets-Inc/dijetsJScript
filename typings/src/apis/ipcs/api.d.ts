/**
 * @packageDocumentation
 * @module API-Info
 */
import DijetsCore from "../../dijets";
import { JRPCAPI } from "../../common/jrpcapi";
import { iPublishBlockchainResponse } from "./interfaces";
/**
 * Class for interacting with a node's IPCSAPI.
 *
 * @category RPCAPIs
 *
 * @remarks This extends the [[JRPCAPI]] class. This class should not be directly called. Instead, use the [[Dijets.addAPI]] function to register this interface with Dijets.
 */
export declare class IPCSAPI extends JRPCAPI {
    /**
     * Register a blockchain so it publishes accepted vertices to a Unix domain socket.
     *
     * @param blockchainID the blockchain that will publish accepted vertices.
     *
     * @returns Returns a Promise<iPublishBlockchainResponse> containing the consensusURL and decisionsURL.
     */
    publishBlockchain: (blockchainID: string) => Promise<iPublishBlockchainResponse>;
    /**
     * Deregister a blockchain so that it no longer publishes to a Unix domain socket.
     *
     * @param blockchainID the blockchain that will publish accepted vertices.
     *
     * @returns Returns a Promise<iPublishBlockchainResponse> containing the consensusURL and decisionsURL.
     */
    unpublishBlockchain: (blockchainID: string) => Promise<boolean>;
    constructor(core: DijetsCore, baseurl?: string);
}
//# sourceMappingURL=api.d.ts.map