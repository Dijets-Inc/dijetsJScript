/**
 * @packageDocumentation
 * @module DijetsCore
 */
import { AxiosRequestConfig, Method } from 'axios';
import { APIBase, RequestResponseData } from './common/apibase';
/**
 * DijetsCore is middleware for interacting with Dijets node RPC APIs.
 *
 * Example usage:
 * ```js
 * let dijets = new DijetsCore("127.0.0.1", 9650, "https");
 * ```
 *
 */
export default class DijetsCore {
    protected networkID: number;
    protected hrp: string;
    protected protocol: string;
    protected ip: string;
    protected port: number;
    protected url: string;
    protected auth: string;
    protected headers: {
        [k: string]: string;
    };
    protected requestConfig: AxiosRequestConfig;
    protected apis: {
        [k: string]: APIBase;
    };
    /**
       * Sets the address and port of the main Dijets Client.
       *
       * @param ip The hostname to resolve to reach the Dijets Client RPC APIs
       * @param port The port to resolve to reach the Dijets Client RPC APIs
       * @param protocol The protocol string to use before a "://" in a request,
       * ex: "http", "https", "git", "ws", etc ...
       */
    setAddress: (ip: string, port: number, protocol?: string) => void;
    /**
       * Returns the protocol such as "http", "https", "git", "ws", etc.
       */
    getProtocol: () => string;
    /**
       * Returns the IP for the Dijets node.
       */
    getIP: () => string;
    /**
       * Returns the port for the Dijets node.
       */
    getPort: () => number;
    /**
       * Returns the URL of the Dijets node (ip + port);
       */
    getURL: () => string;
    /**
     * Returns the custom headers
     */
    getHeaders: () => object;
    /**
     * Returns the custom request config
     */
    getRequestConfig: () => AxiosRequestConfig;
    /**
       * Returns the networkID;
       */
    getNetworkID: () => number;
    /**
       * Sets the networkID
       */
    setNetworkID: (netid: number) => void;
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
    /**
     * Adds a new custom header to be included with all requests.
     *
     * @param key Header name
     * @param value Header value
     */
    setHeader: (key: string, value: string) => void;
    /**
     * Removes a previously added custom header.
     *
     * @param key Header name
     */
    removeHeader: (key: string) => void;
    /**
     * Removes all headers.
     */
    removeAllHeaders: () => void;
    /**
     * Adds a new custom config value to be included with all requests.
     *
     * @param key Config name
     * @param value Config value
     */
    setRequestConfig: (key: string, value: string | boolean) => void;
    /**
     * Removes a previously added request config.
     *
     * @param key Header name
     */
    removeRequestConfig: (key: string) => void;
    /**
     * Removes all request configs.
     */
    removeAllRequestConfigs: () => void;
    /**
     * Sets the temporary auth token used for communicating with the node.
     *
     * @param auth A temporary token provided by the node enabling access to the endpoints on the node.
     */
    setAuthToken: (auth: string) => void;
    protected _setHeaders: (headers: object) => object;
    /**
     * Adds an API to the middleware. The API resolves to a registered blockchain's RPC.
     *
     * In TypeScript:
     * ```js
     * dijets.addAPI<MyVMClass>("mychain", MyVMClass, "/ext/bc/mychain");
     * ```
     *
     * In Javascript:
     * ```js
     * dijets.addAPI("mychain", MyVMClass, "/ext/bc/mychain");
     * ```
     *
     * @typeparam GA Class of the API being added
     * @param apiName A label for referencing the API in the future
     * @param ConstructorFN A reference to the class which instantiates the API
     * @param baseurl Path to resolve to reach the API
     *
     */
    addAPI: <GA extends APIBase>(apiName: string, ConstructorFN: new (djtx: DijetsCore, baseurl?: string, ...args: Array<any>) => GA, baseurl?: string, ...args: Array<any>) => void;
    /**
     * Retrieves a reference to an API by its apiName label.
     *
     * @param apiName Name of the API to return
     */
    api: <GA extends APIBase>(apiName: string) => GA;
    /**
     * @ignore
     */
    protected _request: (xhrmethod: Method, baseurl: string, getdata: object, postdata: string | object | ArrayBuffer | ArrayBufferView, headers?: object, axiosConfig?: AxiosRequestConfig) => Promise<RequestResponseData>;
    /**
     * Makes a GET call to an API.
     *
     * @param baseurl Path to the api
     * @param getdata Object containing the key value pairs sent in GET
     * @param parameters Object containing the parameters of the API call
     * @param headers An array HTTP Request Headers
     * @param axiosConfig Configuration for the axios javascript library that will be the
     * foundation for the rest of the parameters
     *
     * @returns A promise for [[RequestResponseData]]
     */
    get: (baseurl: string, getdata: object, headers?: object, axiosConfig?: AxiosRequestConfig) => Promise<RequestResponseData>;
    /**
     * Makes a DELETE call to an API.
     *
     * @param baseurl Path to the API
     * @param getdata Object containing the key value pairs sent in DELETE
     * @param parameters Object containing the parameters of the API call
     * @param headers An array HTTP Request Headers
     * @param axiosConfig Configuration for the axios javascript library that will be the
     * foundation for the rest of the parameters
     *
     * @returns A promise for [[RequestResponseData]]
     */
    delete: (baseurl: string, getdata: object, headers?: object, axiosConfig?: AxiosRequestConfig) => Promise<RequestResponseData>;
    /**
     * Makes a POST call to an API.
     *
     * @param baseurl Path to the API
     * @param getdata Object containing the key value pairs sent in POST
     * @param postdata Object containing the key value pairs sent in POST
     * @param parameters Object containing the parameters of the API call
     * @param headers An array HTTP Request Headers
     * @param axiosConfig Configuration for the axios javascript library that will be the
     * foundation for the rest of the parameters
     *
     * @returns A promise for [[RequestResponseData]]
     */
    post: (baseurl: string, getdata: object, postdata: string | object | ArrayBuffer | ArrayBufferView, headers?: object, axiosConfig?: AxiosRequestConfig) => Promise<RequestResponseData>;
    /**
     * Makes a PUT call to an API.
     *
     * @param baseurl Path to the baseurl
     * @param getdata Object containing the key value pairs sent in PUT
     * @param postdata Object containing the key value pairs sent in PUT
     * @param parameters Object containing the parameters of the API call
     * @param headers An array HTTP Request Headers
     * @param axiosConfig Configuration for the axios javascript library that will be the
     * foundation for the rest of the parameters
     *
     * @returns A promise for [[RequestResponseData]]
     */
    put: (baseurl: string, getdata: object, postdata: string | object | ArrayBuffer | ArrayBufferView, headers?: object, axiosConfig?: AxiosRequestConfig) => Promise<RequestResponseData>;
    /**
     * Makes a PATCH call to an API.
     *
     * @param baseurl Path to the baseurl
     * @param getdata Object containing the key value pairs sent in PATCH
     * @param postdata Object containing the key value pairs sent in PATCH
     * @param parameters Object containing the parameters of the API call
     * @param headers An array HTTP Request Headers
     * @param axiosConfig Configuration for the axios javascript library that will be the
     * foundation for the rest of the parameters
     *
     * @returns A promise for [[RequestResponseData]]
     */
    patch: (baseurl: string, getdata: object, postdata: string | object | ArrayBuffer | ArrayBufferView, headers?: object, axiosConfig?: AxiosRequestConfig) => Promise<RequestResponseData>;
    /**
     * Creates a new Dijets instance. Sets the address and port of the main Dijets Client.
     *
     * @param ip The hostname to resolve to reach the Dijets Client APIs
     * @param port The port to resolve to reach the Dijets Client APIs
     * @param protocol The protocol string to use before a "://" in a request, ex: "http", "https", "git", "ws", etc ...
     */
    constructor(ip: string, port: number, protocol?: string);
}
//# sourceMappingURL=dijets.d.ts.map