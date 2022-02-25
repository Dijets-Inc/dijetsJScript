/**
 * @packageDocumentation
 * @module Common-JRPCAPI
 */
import DijetsCore from '../dijets';
import { APIBase, RequestResponseData } from './apibase';
export declare class JRPCAPI extends APIBase {
    protected jrpcVersion: string;
    protected rpcid: number;
    callMethod: (method: string, params?: Array<object> | object, baseurl?: string, headers?: object) => Promise<RequestResponseData>;
    /**
       * Returns the rpcid, a strictly-increasing number, starting from 1, indicating the next
       * request ID that will be sent.
       */
    getRPCID: () => number;
    /**
       *
       * @param core Reference to the Dijets instance using this endpoint
       * @param baseurl Path of the APIs baseurl - ex: "/ext/bc/avm"
       * @param jrpcVersion The jrpc version to use, default "2.0".
       */
    constructor(core: DijetsCore, baseurl: string, jrpcVersion?: string);
}
//# sourceMappingURL=jrpcapi.d.ts.map