"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @packageDocumentation
 * @module DijetsCore
 */
const axios_1 = __importDefault(require("axios"));
const apibase_1 = require("./common/apibase");
const helperfunctions_1 = require("./utils/helperfunctions");
/**
 * DijetsCore is middleware for interacting with Dijets node RPC APIs.
 *
 * Example usage:
 * ```js
 * let dijets = new DijetsCore("127.0.0.1", 9650, "https");
 * ```
 *
 */
class DijetsCore {
    /**
     * Creates a new Dijets instance. Sets the address and port of the main Dijets Client.
     *
     * @param ip The hostname to resolve to reach the Dijets Client APIs
     * @param port The port to resolve to reach the Dijets Client APIs
     * @param protocol The protocol string to use before a "://" in a request, ex: "http", "https", "git", "ws", etc ...
     */
    constructor(ip, port, protocol = 'http') {
        this.networkID = 0;
        this.hrp = '';
        this.auth = undefined;
        this.headers = {};
        this.requestConfig = {};
        this.apis = {};
        /**
           * Sets the address and port of the main Dijets Client.
           *
           * @param ip The hostname to resolve to reach the Dijets Client RPC APIs
           * @param port The port to resolve to reach the Dijets Client RPC APIs
           * @param protocol The protocol string to use before a "://" in a request,
           * ex: "http", "https", "git", "ws", etc ...
           */
        this.setAddress = (ip, port, protocol = 'http') => {
            this.ip = ip;
            this.port = port;
            this.protocol = protocol;
            let url = `${protocol}://${ip}`;
            if (port != undefined && typeof port === 'number' && port >= 0) {
                url = `${url}:${port}`;
            }
            this.url = url;
        };
        /**
           * Returns the protocol such as "http", "https", "git", "ws", etc.
           */
        this.getProtocol = () => this.protocol;
        /**
           * Returns the IP for the Dijets node.
           */
        this.getIP = () => this.ip;
        /**
           * Returns the port for the Dijets node.
           */
        this.getPort = () => this.port;
        /**
           * Returns the URL of the Dijets node (ip + port);
           */
        this.getURL = () => this.url;
        /**
         * Returns the custom headers
         */
        this.getHeaders = () => this.headers;
        /**
         * Returns the custom request config
         */
        this.getRequestConfig = () => this.requestConfig;
        /**
           * Returns the networkID;
           */
        this.getNetworkID = () => this.networkID;
        /**
           * Sets the networkID
           */
        this.setNetworkID = (netid) => {
            this.networkID = netid;
            this.hrp = helperfunctions_1.getPreferredHRP(this.networkID);
        };
        /**
         * Returns the Human-Readable-Part of the network associated with this key.
         *
         * @returns The [[KeyPair]]'s Human-Readable-Part of the network's Bech32 addressing scheme
         */
        this.getHRP = () => this.hrp;
        /**
         * Sets the the Human-Readable-Part of the network associated with this key.
         *
         * @param hrp String for the Human-Readable-Part of Bech32 addresses
         */
        this.setHRP = (hrp) => {
            this.hrp = hrp;
        };
        /**
         * Adds a new custom header to be included with all requests.
         *
         * @param key Header name
         * @param value Header value
         */
        this.setHeader = (key, value) => {
            this.headers[key] = value;
        };
        /**
         * Removes a previously added custom header.
         *
         * @param key Header name
         */
        this.removeHeader = (key) => {
            delete this.headers[key];
        };
        /**
         * Removes all headers.
         */
        this.removeAllHeaders = () => {
            for (let prop in this.headers) {
                if (Object.prototype.hasOwnProperty.call(this.headers, prop)) {
                    delete this.headers[prop];
                }
            }
        };
        /**
         * Adds a new custom config value to be included with all requests.
         *
         * @param key Config name
         * @param value Config value
         */
        this.setRequestConfig = (key, value) => {
            this.requestConfig[key] = value;
        };
        /**
         * Removes a previously added request config.
         *
         * @param key Header name
         */
        this.removeRequestConfig = (key) => {
            delete this.requestConfig[key];
        };
        /**
         * Removes all request configs.
         */
        this.removeAllRequestConfigs = () => {
            for (let prop in this.requestConfig) {
                if (Object.prototype.hasOwnProperty.call(this.requestConfig, prop)) {
                    delete this.requestConfig[prop];
                }
            }
        };
        /**
         * Sets the temporary auth token used for communicating with the node.
         *
         * @param auth A temporary token provided by the node enabling access to the endpoints on the node.
         */
        this.setAuthToken = (auth) => {
            this.auth = auth;
        };
        this._setHeaders = (headers) => {
            if (typeof this.headers === "object") {
                for (const [key, value] of Object.entries(this.headers)) {
                    headers[key] = value;
                }
            }
            if (typeof this.auth === "string") {
                headers["Authorization"] = "Bearer " + this.auth;
            }
            return headers;
        };
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
        this.addAPI = (apiName, ConstructorFN, baseurl = undefined, ...args) => {
            if (typeof baseurl === 'undefined') {
                this.apis[apiName] = new ConstructorFN(this, undefined, ...args);
            }
            else {
                this.apis[apiName] = new ConstructorFN(this, baseurl, ...args);
            }
        };
        /**
         * Retrieves a reference to an API by its apiName label.
         *
         * @param apiName Name of the API to return
         */
        this.api = (apiName) => this.apis[apiName];
        /**
         * @ignore
         */
        this._request = (xhrmethod, baseurl, getdata, postdata, headers = {}, axiosConfig = undefined) => __awaiter(this, void 0, void 0, function* () {
            let config;
            if (axiosConfig) {
                config = Object.assign(Object.assign({}, axiosConfig), this.requestConfig);
            }
            else {
                config = Object.assign({ baseURL: `${this.protocol}://${this.ip}:${this.port}`, responseType: 'text' }, this.requestConfig);
            }
            config.url = baseurl;
            config.method = xhrmethod;
            config.headers = headers;
            config.data = postdata;
            config.params = getdata;
            return axios_1.default.request(config).then((resp) => {
                // purging all that is axios
                const xhrdata = new apibase_1.RequestResponseData();
                xhrdata.data = resp.data;
                xhrdata.headers = resp.headers;
                xhrdata.request = resp.request;
                xhrdata.status = resp.status;
                xhrdata.statusText = resp.statusText;
                return xhrdata;
            });
        });
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
        this.get = (baseurl, getdata, headers = {}, axiosConfig = undefined) => this._request('GET', baseurl, getdata, {}, this._setHeaders(headers), axiosConfig);
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
        this.delete = (baseurl, getdata, headers = {}, axiosConfig = undefined) => this._request('DELETE', baseurl, getdata, {}, this._setHeaders(headers), axiosConfig);
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
        this.post = (baseurl, getdata, postdata, headers = {}, axiosConfig = undefined) => this._request('POST', baseurl, getdata, postdata, this._setHeaders(headers), axiosConfig);
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
        this.put = (baseurl, getdata, postdata, headers = {}, axiosConfig = undefined) => this._request('PUT', baseurl, getdata, postdata, this._setHeaders(headers), axiosConfig);
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
        this.patch = (baseurl, getdata, postdata, headers = {}, axiosConfig = undefined) => this._request('PATCH', baseurl, getdata, postdata, this._setHeaders(headers), axiosConfig);
        this.setAddress(ip, port, protocol);
    }
}
exports.default = DijetsCore;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXZhbGFuY2hlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2F2YWxhbmNoZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7OztBQUFBOzs7R0FHRztBQUNILGtEQUF5RTtBQUN6RSw4Q0FBZ0U7QUFDaEUsNkRBQTBEO0FBRTFEOzs7Ozs7OztHQVFHO0FBQ0gsTUFBcUIsYUFBYTtJQTBYaEM7Ozs7OztPQU1HO0lBQ0gsWUFBWSxFQUFTLEVBQUUsSUFBVyxFQUFFLFdBQWtCLE1BQU07UUFoWWxELGNBQVMsR0FBVSxDQUFDLENBQUM7UUFFckIsUUFBRyxHQUFVLEVBQUUsQ0FBQztRQVVoQixTQUFJLEdBQVUsU0FBUyxDQUFDO1FBRXhCLFlBQU8sR0FBMkIsRUFBRSxDQUFDO1FBRXJDLGtCQUFhLEdBQXVCLEVBQUUsQ0FBQztRQUV2QyxTQUFJLEdBQTRCLEVBQUUsQ0FBQztRQUU3Qzs7Ozs7OzthQU9LO1FBQ0wsZUFBVSxHQUFHLENBQUMsRUFBUyxFQUFFLElBQVcsRUFBRSxXQUFrQixNQUFNLEVBQUUsRUFBRTtZQUNoRSxJQUFJLENBQUMsRUFBRSxHQUFHLEVBQUUsQ0FBQztZQUNiLElBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDO1lBQ2pCLElBQUksQ0FBQyxRQUFRLEdBQUcsUUFBUSxDQUFDO1lBQ3pCLElBQUksR0FBRyxHQUFZLEdBQUcsUUFBUSxNQUFNLEVBQUUsRUFBRSxDQUFDO1lBQ3pDLElBQUcsSUFBSSxJQUFJLFNBQVMsSUFBSSxPQUFPLElBQUksS0FBSyxRQUFRLElBQUksSUFBSSxJQUFJLENBQUMsRUFBRTtnQkFDN0QsR0FBRyxHQUFHLEdBQUcsR0FBRyxJQUFJLElBQUksRUFBRSxDQUFDO2FBQ3hCO1lBQ0QsSUFBSSxDQUFDLEdBQUcsR0FBRyxHQUFHLENBQUM7UUFDakIsQ0FBQyxDQUFDO1FBRUY7O2FBRUs7UUFDTCxnQkFBVyxHQUFHLEdBQVUsRUFBRSxDQUFDLElBQUksQ0FBQyxRQUFR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Ozs7Ozs7V0FZRztRQUNILFVBQUssR0FBRyxDQUFDLE9BQWMsRUFDckIsT0FBYyxFQUNkLFFBQXdELEVBQ3hELFVBQWlCLEVBQUUsRUFDbkIsY0FBaUMsU0FBUyxFQUNiLEVBQUUsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLE9BQU8sRUFDckQsT0FBTyxFQUNQLE9BQU8sRUFDUCxRQUFRLEVBQ1IsSUFBSSxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsRUFDekIsV0FBVyxDQUFDLENBQUM7UUFVYixJQUFJLENBQUMsVUFBVSxDQUFDLEVBQUUsRUFBRSxJQUFJLEVBQUUsUUFBUSxDQUFDLENBQUM7SUFDdEMsQ0FBQztDQUNGO0FBcFlELGdDQW9ZQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQHBhY2thZ2VEb2N1bWVudGF0aW9uXG4gKiBAbW9kdWxlIEF2YWxhbmNoZUNvcmVcbiAqL1xuaW1wb3J0IGF4aW9zLCB7IEF4aW9zUmVxdWVzdENvbmZpZywgQXhpb3NSZXNwb25zZSwgTWV0aG9kIH0gZnJvbSAnYXhpb3MnO1xuaW1wb3J0IHsgQVBJQmFzZSwgUmVxdWVzdFJlc3BvbnNlRGF0YSB9IGZyb20gJy4vY29tbW9uL2FwaWJhc2UnO1xuaW1wb3J0IHsgZ2V0UHJlZmVycmVkSFJQIH0gZnJvbSAnLi91dGlscy9oZWxwZXJmdW5jdGlvbnMnO1xuXG4vKipcbiAqIEF2YWxhbmNoZUNvcmUgaXMgbWlkZGxld2FyZSBmb3IgaW50ZXJhY3Rpbmcgd2l0aCBBdmFsYW5jaGUgbm9kZSBSUEMgQVBJcy5cbiAqXG4gKiBFeGFtcGxlIHVzYWdlOlxuICogYGBganNcbiAqIGxldCBhdmFsYW5jaGUgPSBuZXcgQXZhbGFuY2hlQ29yZShcIjEyNy4wLjAuMVwiLCA5NjUwLCBcImh0dHBzXCIpO1xuICogYGBgXG4gKlxuICovXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBBdmFsYW5jaGVDb3JlIHtcbiAgcHJvdGVjdGVkIG5ldHdvcmtJRDpudW1iZXIgPSAwO1xuXG4gIHByb3RlY3RlZCBocnA6c3RyaW5nID0gJyc7XG5cbiAgcHJvdGVjdGVkIHByb3RvY29sOnN0cmluZztcblxuICBwcm90ZWN0ZWQgaXA6c3RyaW5nO1xuXG4gIHByb3RlY3RlZCBwb3J0Om51bWJlcjtcblxuICBwcm90ZWN0ZWQgdXJsOnN0cmluZztcblxuICBwcm90ZWN0ZWQgYXV0aDpzdHJpbmcgPSB1bmRlZmluZWQ7XG5cbiAgcHJvdGVjdGVkIGhlYWRlcnM6eyBbazogc3RyaW5nXTogc3RyaW5nIH0gPSB7fTtcblxuICBwcm90ZWN0ZWQgcmVxdWVzdENvbmZpZzogQXhpb3NSZXF1ZXN0Q29uZmlnID0ge307XG5cbiAgcHJvdGVjdGVkIGFwaXM6eyBbazogc3RyaW5nXTogQVBJQmFzZSB9ID0ge307XG5cbiAgLyoqXG4gICAgICogU2V0cyB0aGUgYWRkcmVzcyBhbmQgcG9ydCBvZiB0aGUgbWFpbiBBdmFsYW5jaGUgQ2xpZW50LlxuICAgICAqXG4gICAgICogQHBhcmFtIGlwIFRoZSBob3N0bmFtZSB0byByZXNvbHZlIHRvIHJlYWNoIHRoZSBBdmFsYW5jaGUgQ2xpZW50IFJQQyBBUElzXG4gICAgICogQHBhcmFtIHBvcnQgVGhlIHBvcnQgdG8gcmVzb2x2ZSB0byByZWFjaCB0aGUgQXZhbGFuY2hlIENsaWVudCBSUEMgQVBJc1xuICAgICAqIEBwYXJhbSBwcm90b2NvbCBUaGUgcHJvdG9jb2wgc3RyaW5nIHRvIHVzZSBiZWZvcmUgYSBcIjovL1wiIGluIGEgcmVxdWVzdCxcbiAgICAgKiBleDogXCJodHRwXCIsIFwiaHR0cHNcIiwgXCJnaXRcIiwgXCJ3c1wiLCBldGMgLi4uXG4gICAgICovXG4gIHNldEFkZHJlc3MgPSAoaXA6c3RyaW5nLCBwb3J0Om51bWJlciwgcHJvdG9jb2w6c3RyaW5nID0gJ2h0dHAnKSA9PiB7XG4gICAgdGhpcy5pcCA9IGlwO1xuICAgIHRoaXMucG9ydCA9IHBvcnQ7XG4gICAgdGhpcy5wcm90b2NvbCA9IHByb3RvY29sO1xuICAgIGxldCB1cmwgOiBzdHJpbmcgPSBgJHtwcm90b2NvbH06Ly8ke2lwfWA7XG4gICAgaWYocG9ydCAhPSB1bmRlZmluZWQgJiYgdHlwZW9mIHBvcnQgPT09ICdudW1iZXInICYmIHBvcnQgPj0gMCkge1xuICAgICAgdXJsID0gYCR7dXJsfToke3BvcnR9YDtcbiAgICB9XG4gICAgdGhpcy51cmwgPSB1cmw7XG4gIH07XG5cbiAgLyoqXG4gICAgICogUmV0dXJucyB0aGUgcHJvdG9jb2wgc3VjaCBhcyBcImh0dHBcIiwgXCJodHRwc1wiLCBcImdpdFwiLCBcIndzXCIsIGV0Yy5cbiAgICAgKi9cbiAgZ2V0UHJvdG9jb2wgPSAoKTpzdHJpbmcgPT4gdGhpcy5wcm90b2NvbDtcblxuICAvKipcbiAgICAgKiBSZXR1cm5zIHRoZSBJUCBmb3IgdGhlIEF2YWxhbmNoZSBub2RlLlxuICAgICAqL1xuICBnZXRJUCA9ICgpOnN0cmluZyA9PiB0aGlzLmlwO1xuXG4gIC8qKlxuICAgICAqIFJldHVybnMgdGhlIHBvcnQgZm9yIHRoZSBBdmFsYW5jaGUgbm9kZS5cbiAgICAgKi9cbiAgZ2V0UG9ydCA9ICgpOm51bWJlciA9PiB0aGlzLnBvcnQ7XG5cbiAgLyoqXG4gICAgICogUmV0dXJucyB0aGUgVVJMIG9mIHRoZSBBdmFsYW5jaGUgbm9kZSAoaXAgKyBwb3J0KTtcbiAgICAgKi9cbiAgZ2V0VVJMID0gKCk6c3RyaW5nID0+IHRoaXMudXJsO1xuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSBjdXN0b20gaGVhZGVyc1xuICAgKi9cbiAgZ2V0SGVhZGVycyA9ICgpOm9iamVjdCA9PiB0aGlzLmhlYWRlcnM7XG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIGN1c3RvbSByZXF1ZXN0IGNvbmZpZ1xuICAgKi9cbiAgZ2V0UmVxdWVzdENvbmZpZyA9ICgpOiBBeGlvc1JlcXVlc3RDb25maWcgPT4gdGhpcy5yZXF1ZXN0Q29uZmlnO1xuXG4gIC8qKlxuICAgICAqIFJldHVybnMgdGhlIG5ldHdvcmtJRDtcbiAgICAgKi9cbiAgZ2V0TmV0d29ya0lEID0gKCk6bnVtYmVyID0+IHRoaXMubmV0d29ya0lEO1xuXG4gIC8qKlxuICAgICAqIFNldHMgdGhlIG5ldHdvcmtJRFxuICAgICAqL1xuICBzZXROZXR3b3JrSUQgPSAobmV0aWQ6bnVtYmVyKSA9PiB7XG4gICAgdGhpcy5uZXR3b3JrSUQgPSBuZXRpZDtcbiAgICB0aGlzLmhycCA9IGdldFByZWZlcnJlZEhSUCh0aGlzLm5ldHdvcmtJRCk7XG4gIH07XG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIEh1bWFuLVJlYWRhYmxlLVBhcnQgb2YgdGhlIG5ldHdvcmsgYXNzb2NpYXRlZCB3aXRoIHRoaXMga2V5LlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgW1tLZXlQYWlyXV0ncyBIdW1hbi1SZWFkYWJsZS1QYXJ0IG9mIHRoZSBuZXR3b3JrJ3MgQmVjaDMyIGFkZHJlc3Npbmcgc2NoZW1lXG4gICAqL1xuICBnZXRIUlAgPSAoKTpzdHJpbmcgPT4gdGhpcy5ocnA7XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIHRoZSBIdW1hbi1SZWFkYWJsZS1QYXJ0IG9mIHRoZSBuZXR3b3JrIGFzc29jaWF0ZWQgd2l0aCB0aGlzIGtleS5cbiAgICpcbiAgICogQHBhcmFtIGhycCBTdHJpbmcgZm9yIHRoZSBIdW1hbi1SZWFkYWJsZS1QYXJ0IG9mIEJlY2gzMiBhZGRyZXNzZXNcbiAgICovXG4gIHNldEhSUCA9IChocnA6c3RyaW5nKTp2b2lkID0+IHtcbiAgICB0aGlzLmhycCA9IGhycDtcbiAgfTtcblxuICAvKipcbiAgICogQWRkcyBhIG5ldyBjdXN0b20gaGVhZGVyIHRvIGJlIGluY2x1ZGVkIHdpdGggYWxsIHJlcXVlc3RzLlxuICAgKiBcbiAgICogQHBhcmFtIGtleSBIZWFkZXIgbmFtZVxuICAgKiBAcGFyYW0gdmFsdWUgSGVhZGVyIHZhbHVlXG4gICAqL1xuICBzZXRIZWFkZXIgPSAoa2V5OnN0cmluZyx2YWx1ZTpzdHJpbmcpOnZvaWQgPT4ge1xuICAgIHRoaXMuaGVhZGVyc1trZXldID0gdmFsdWU7XG4gIH1cblxuICAvKipcbiAgICogUmVtb3ZlcyBhIHByZXZpb3VzbHkgYWRkZWQgY3VzdG9tIGhlYWRlci5cbiAgICogXG4gICAqIEBwYXJhbSBrZXkgSGVhZGVyIG5hbWVcbiAgICovXG4gIHJlbW92ZUhlYWRlciA9IChrZXk6IHN0cmluZyk6dm9pZCA9PiB7XG4gICAgZGVsZXRlIHRoaXMuaGVhZGVyc1trZXldO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlbW92ZXMgYWxsIGhlYWRlcnMuXG4gICAqL1xuICByZW1vdmVBbGxIZWFkZXJzID0gKCk6dm9pZCA9PiB7XG4gICAgZm9yIChsZXQgcHJvcCBpbiB0aGlzLmhlYWRlcnMpIHtcbiAgICAgIGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwodGhpcy5oZWFkZXJzLCBwcm9wKSkge1xuICAgICAgICBkZWxldGUgdGhpcy5oZWFkZXJzW3Byb3BdO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBBZGRzIGEgbmV3IGN1c3RvbSBjb25maWcgdmFsdWUgdG8gYmUgaW5jbHVkZWQgd2l0aCBhbGwgcmVxdWVzdHMuXG4gICAqXG4gICAqIEBwYXJhbSBrZXkgQ29uZmlnIG5hbWVcbiAgICogQHBhcmFtIHZhbHVlIENvbmZpZyB2YWx1ZVxuICAgKi9cbiAgc2V0UmVxdWVzdENvbmZpZyA9IChrZXk6IHN0cmluZywgdmFsdWU6IHN0cmluZ3xib29sZWFuKTogdm9pZCA9PiB7XG4gICAgdGhpcy5yZXF1ZXN0Q29uZmlnW2tleV0gPSB2YWx1ZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZW1vdmVzIGEgcHJldmlvdXNseSBhZGRlZCByZXF1ZXN0IGNvbmZpZy5cbiAgICogXG4gICAqIEBwYXJhbSBrZXkgSGVhZGVyIG5hbWVcbiAgICovXG4gIHJlbW92ZVJlcXVlc3RDb25maWcgPSAoa2V5OiBzdHJpbmcpOnZvaWQgPT4ge1xuICAgIGRlbGV0ZSB0aGlzLnJlcXVlc3RDb25maWdba2V5XTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZW1vdmVzIGFsbCByZXF1ZXN0IGNvbmZpZ3MuXG4gICAqL1xuICByZW1vdmVBbGxSZXF1ZXN0Q29uZmlncyA9ICgpOnZvaWQgPT4ge1xuICAgIGZvciAobGV0IHByb3AgaW4gdGhpcy5yZXF1ZXN0Q29uZmlnKSB7XG4gICAgICBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKHRoaXMucmVxdWVzdENvbmZpZywgcHJvcCkpIHtcbiAgICAgICAgZGVsZXRlIHRoaXMucmVxdWVzdENvbmZpZ1twcm9wXTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgdGVtcG9yYXJ5IGF1dGggdG9rZW4gdXNlZCBmb3IgY29tbXVuaWNhdGluZyB3aXRoIHRoZSBub2RlLlxuICAgKlxuICAgKiBAcGFyYW0gYXV0aCBBIHRlbXBvcmFyeSB0b2tlbiBwcm92aWRlZCBieSB0aGUgbm9kZSBlbmFibGluZyBhY2Nlc3MgdG8gdGhlIGVuZHBvaW50cyBvbiB0aGUgbm9kZS5cbiAgICovXG4gIHNldEF1dGhUb2tlbiA9IChhdXRoOnN0cmluZyk6dm9pZCA9PiB7XG4gICAgdGhpcy5hdXRoID0gYXV0aDtcbiAgfVxuXG4gIHByb3RlY3RlZCBfc2V0SGVhZGVycyA9IChoZWFkZXJzOm9iamVjdCk6b2JqZWN0ID0+IHtcbiAgICBpZiAodHlwZW9mIHRoaXMuaGVhZGVycyA9PT0gXCJvYmplY3RcIikge1xuICAgICAgZm9yIChjb25zdCBba2V5LCB2YWx1ZV0gb2YgT2JqZWN0LmVudHJpZXModGhpcy5oZWFkZXJzKSkge1xuICAgICAgICBoZWFkZXJzW2tleV0gPSB2YWx1ZTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZih0eXBlb2YgdGhpcy5hdXRoID09PSBcInN0cmluZ1wiKXtcbiAgICAgIGhlYWRlcnNbXCJBdXRob3JpemF0aW9uXCJdID0gXCJCZWFyZXIgXCIgKyB0aGlzLmF1dGg7XG4gICAgfVxuICAgIHJldHVybiBoZWFkZXJzO1xuICB9XG5cbiAgLyoqXG4gICAqIEFkZHMgYW4gQVBJIHRvIHRoZSBtaWRkbGV3YXJlLiBUaGUgQVBJIHJlc29sdmVzIHRvIGEgcmVnaXN0ZXJlZCBibG9ja2NoYWluJ3MgUlBDLlxuICAgKlxuICAgKiBJbiBUeXBlU2NyaXB0OlxuICAgKiBgYGBqc1xuICAgKiBhdmFsYW5jaGUuYWRkQVBJPE15Vk1DbGFzcz4oXCJteWNoYWluXCIsIE15Vk1DbGFzcywgXCIvZXh0L2JjL215Y2hhaW5cIik7XG4gICAqIGBgYFxuICAgKlxuICAgKiBJbiBKYXZhc2NyaXB0OlxuICAgKiBgYGBqc1xuICAgKiBhdmFsYW5jaGUuYWRkQVBJKFwibXljaGFpblwiLCBNeVZNQ2xhc3MsIFwiL2V4dC9iYy9teWNoYWluXCIpO1xuICAgKiBgYGBcbiAgICpcbiAgICogQHR5cGVwYXJhbSBHQSBDbGFzcyBvZiB0aGUgQVBJIGJlaW5nIGFkZGVkXG4gICAqIEBwYXJhbSBhcGlOYW1lIEEgbGFiZWwgZm9yIHJlZmVyZW5jaW5nIHRoZSBBUEkgaW4gdGhlIGZ1dHVyZVxuICAgKiBAcGFyYW0gQ29uc3RydWN0b3JGTiBBIHJlZmVyZW5jZSB0byB0aGUgY2xhc3Mgd2hpY2ggaW5zdGFudGlhdGVzIHRoZSBBUElcbiAgICogQHBhcmFtIGJhc2V1cmwgUGF0aCB0byByZXNvbHZlIHRvIHJlYWNoIHRoZSBBUElcbiAgICpcbiAgICovXG4gIGFkZEFQSSA9IDxHQSBleHRlbmRzIEFQSUJhc2U+KGFwaU5hbWU6c3RyaW5nLFxuICAgIENvbnN0cnVjdG9yRk46IG5ldyhhdmF4OkF2YWxhbmNoZUNvcmUsIGJhc2V1cmw/OnN0cmluZywgLi4uYXJnczpBcnJheTxhbnk+KSA9PiBHQSxcbiAgICBiYXNldXJsOnN0cmluZyA9IHVuZGVmaW5lZCxcbiAgICAuLi5hcmdzOkFycmF5PGFueT4pID0+IHtcbiAgICBpZiAodHlwZW9mIGJhc2V1cmwgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICB0aGlzLmFwaXNbYXBpTmFtZV0gPSBuZXcgQ29uc3RydWN0b3JGTih0aGlzLCB1bmRlZmluZWQsIC4uLmFyZ3MpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmFwaXNbYXBpTmFtZV0gPSBuZXcgQ29uc3RydWN0b3JGTih0aGlzLCBiYXNldXJsLCAuLi5hcmdzKTtcbiAgICB9XG4gIH07XG5cbiAgLyoqXG4gICAqIFJldHJpZXZlcyBhIHJlZmVyZW5jZSB0byBhbiBBUEkgYnkgaXRzIGFwaU5hbWUgbGFiZWwuXG4gICAqXG4gICAqIEBwYXJhbSBhcGlOYW1lIE5hbWUgb2YgdGhlIEFQSSB0byByZXR1cm5cbiAgICovXG4gIGFwaSA9IDxHQSBleHRlbmRzIEFQSUJhc2U+KGFwaU5hbWU6c3RyaW5nKTogR0EgPT4gdGhpcy5hcGlzW2FwaU5hbWVdIGFzIEdBO1xuXG4gIC8qKlxuICAgKiBAaWdub3JlXG4gICAqL1xuICBwcm90ZWN0ZWQgX3JlcXVlc3QgPSBhc3luYyAoeGhybWV0aG9kOk1ldGhvZCxcbiAgICBiYXNldXJsOnN0cmluZyxcbiAgICBnZXRkYXRhOm9iamVjdCxcbiAgICBwb3N0ZGF0YTpzdHJpbmcgfCBvYmplY3QgfCBBcnJheUJ1ZmZlciB8IEFycmF5QnVmZmVyVmlldyxcbiAgICBoZWFkZXJzOm9iamVjdCA9IHt9LFxuICAgIGF4aW9zQ29uZmlnOkF4aW9zUmVxdWVzdENvbmZpZyA9IHVuZGVmaW5lZCk6IFByb21pc2U8UmVxdWVzdFJlc3BvbnNlRGF0YT4gPT4ge1xuICAgIGxldCBjb25maWc6QXhpb3NSZXF1ZXN0Q29uZmlnO1xuICAgIGlmIChheGlvc0NvbmZpZykge1xuICAgICAgY29uZmlnID0ge1xuICAgICAgICAuLi5heGlvc0NvbmZpZyxcbiAgICAgICAgLi4udGhpcy5yZXF1ZXN0Q29uZmlnXG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbmZpZyA9IHtcbiAgICAgICAgYmFzZVVSTDogYCR7dGhpcy5wcm90b2NvbH06Ly8ke3RoaXMuaXB9OiR7dGhpcy5wb3J0fWAsXG4gICAgICAgIHJlc3BvbnNlVHlwZTogJ3RleHQnLFxuICAgICAgICAuLi50aGlzLnJlcXVlc3RDb25maWdcbiAgICAgIH07XG4gICAgfVxuICAgIGNvbmZpZy51cmwgPSBiYXNldXJsO1xuICAgIGNvbmZpZy5tZXRob2QgPSB4aHJtZXRob2Q7XG4gICAgY29uZmlnLmhlYWRlcnMgPSBoZWFkZXJzO1xuICAgIGNvbmZpZy5kYXRhID0gcG9zdGRhdGE7XG4gICAgY29uZmlnLnBhcmFtcyA9IGdldGRhdGE7XG4gICAgcmV0dXJuIGF4aW9zLnJlcXVlc3QoY29uZmlnKS50aGVuKChyZXNwOkF4aW9zUmVzcG9uc2U8YW55PikgPT4ge1xuICAgICAgLy8gcHVyZ2luZyBhbGwgdGhhdCBpcyBheGlvc1xuICAgICAgY29uc3QgeGhyZGF0YTpSZXF1ZXN0UmVzcG9uc2VEYXRhID0gbmV3IFJlcXVlc3RSZXNwb25zZURhdGEoKTtcbiAgICAgIHhocmRhdGEuZGF0YSA9IHJlc3AuZGF0YTtcbiAgICAgIHhocmRhdGEuaGVhZGVycyA9IHJlc3AuaGVhZGVycztcbiAgICAgIHhocmRhdGEucmVxdWVzdCA9IHJlc3AucmVxdWVzdDtcbiAgICAgIHhocmRhdGEuc3RhdHVzID0gcmVzcC5zdGF0dXM7XG4gICAgICB4aHJkYXRhLnN0YXR1c1RleHQgPSByZXNwLnN0YXR1c1RleHQ7XG4gICAgICByZXR1cm4geGhyZGF0YTtcbiAgICB9KTtcbiAgfTtcblxuICAvKipcbiAgICogTWFrZXMgYSBHRVQgY2FsbCB0byBhbiBBUEkuXG4gICAqXG4gICAqIEBwYXJhbSBiYXNldXJsIFBhdGggdG8gdGhlIGFwaVxuICAgKiBAcGFyYW0gZ2V0ZGF0YSBPYmplY3QgY29udGFpbmluZyB0aGUga2V5IHZhbHVlIHBhaXJzIHNlbnQgaW4gR0VUXG4gICAqIEBwYXJhbSBwYXJhbWV0ZXJzIE9iamVjdCBjb250YWluaW5nIHRoZSBwYXJhbWV0ZXJzIG9mIHRoZSBBUEkgY2FsbFxuICAgKiBAcGFyYW0gaGVhZGVycyBBbiBhcnJheSBIVFRQIFJlcXVlc3QgSGVhZGVyc1xuICAgKiBAcGFyYW0gYXhpb3NDb25maWcgQ29uZmlndXJhdGlvbiBmb3IgdGhlIGF4aW9zIGphdmFzY3JpcHQgbGlicmFyeSB0aGF0IHdpbGwgYmUgdGhlXG4gICAqIGZvdW5kYXRpb24gZm9yIHRoZSByZXN0IG9mIHRoZSBwYXJhbWV0ZXJzXG4gICAqXG4gICAqIEByZXR1cm5zIEEgcHJvbWlzZSBmb3IgW1tSZXF1ZXN0UmVzcG9uc2VEYXRhXV1cbiAgICovXG4gIGdldCA9IChiYXNldXJsOnN0cmluZyxcbiAgICBnZXRkYXRhOm9iamVjdCxcbiAgICBoZWFkZXJzOm9iamVjdCA9IHt9LFxuICAgIGF4aW9zQ29uZmlnOkF4aW9zUmVxdWVzdENvbmZpZyA9IHVuZGVmaW5lZClcbiAgOiBQcm9taXNlPFJlcXVlc3RSZXNwb25zZURhdGE+ID0+ICB0aGlzLl9yZXF1ZXN0KCdHRVQnLFxuICAgICAgYmFzZXVybCxcbiAgICAgIGdldGRhdGEsXG4gICAgICB7fSxcbiAgICAgIHRoaXMuX3NldEhlYWRlcnMoaGVhZGVycyksXG4gICAgICBheGlvc0NvbmZpZyk7XG5cbiAgLyoqXG4gICAqIE1ha2VzIGEgREVMRVRFIGNhbGwgdG8gYW4gQVBJLlxuICAgKlxuICAgKiBAcGFyYW0gYmFzZXVybCBQYXRoIHRvIHRoZSBBUElcbiAgICogQHBhcmFtIGdldGRhdGEgT2JqZWN0IGNvbnRhaW5pbmcgdGhlIGtleSB2YWx1ZSBwYWlycyBzZW50IGluIERFTEVURVxuICAgKiBAcGFyYW0gcGFyYW1ldGVycyBPYmplY3QgY29udGFpbmluZyB0aGUgcGFyYW1ldGVycyBvZiB0aGUgQVBJIGNhbGxcbiAgICogQHBhcmFtIGhlYWRlcnMgQW4gYXJyYXkgSFRUUCBSZXF1ZXN0IEhlYWRlcnNcbiAgICogQHBhcmFtIGF4aW9zQ29uZmlnIENvbmZpZ3VyYXRpb24gZm9yIHRoZSBheGlvcyBqYXZhc2NyaXB0IGxpYnJhcnkgdGhhdCB3aWxsIGJlIHRoZVxuICAgKiBmb3VuZGF0aW9uIGZvciB0aGUgcmVzdCBvZiB0aGUgcGFyYW1ldGVyc1xuICAgKlxuICAgKiBAcmV0dXJucyBBIHByb21pc2UgZm9yIFtbUmVxdWVzdFJlc3BvbnNlRGF0YV1dXG4gICAqL1xuICBkZWxldGUgPSAoYmFzZXVybDpzdHJpbmcsXG4gICAgZ2V0ZGF0YTpvYmplY3QsXG4gICAgaGVhZGVyczpvYmplY3QgPSB7fSxcbiAgICBheGlvc0NvbmZpZzpBeGlvc1JlcXVlc3RDb25maWcgPSB1bmRlZmluZWQpXG4gIDogUHJvbWlzZTxSZXF1ZXN0UmVzcG9uc2VEYXRhPiA9PiB0aGlzLl9yZXF1ZXN0KCdERUxFVEUnLFxuICAgIGJhc2V1cmwsXG4gICAgZ2V0ZGF0YSxcbiAgICB7fSxcbiAgICB0aGlzLl9zZXRIZWFkZXJzKGhlYWRlcnMpLFxuICAgIGF4aW9zQ29uZmlnKTtcblxuICAvKipcbiAgICogTWFrZXMgYSBQT1NUIGNhbGwgdG8gYW4gQVBJLlxuICAgKlxuICAgKiBAcGFyYW0gYmFzZXVybCBQYXRoIHRvIHRoZSBBUElcbiAgICogQHBhcmFtIGdldGRhdGEgT2JqZWN0IGNvbnRhaW5pbmcgdGhlIGtleSB2YWx1ZSBwYWlycyBzZW50IGluIFBPU1RcbiAgICogQHBhcmFtIHBvc3RkYXRhIE9iamVjdCBjb250YWluaW5nIHRoZSBrZXkgdmFsdWUgcGFpcnMgc2VudCBpbiBQT1NUXG4gICAqIEBwYXJhbSBwYXJhbWV0ZXJzIE9iamVjdCBjb250YWluaW5nIHRoZSBwYXJhbWV0ZXJzIG9mIHRoZSBBUEkgY2FsbFxuICAgKiBAcGFyYW0gaGVhZGVycyBBbiBhcnJheSBIVFRQIFJlcXVlc3QgSGVhZGVyc1xuICAgKiBAcGFyYW0gYXhpb3NDb25maWcgQ29uZmlndXJhdGlvbiBmb3IgdGhlIGF4aW9zIGphdmFzY3JpcHQgbGlicmFyeSB0aGF0IHdpbGwgYmUgdGhlXG4gICAqIGZvdW5kYXRpb24gZm9yIHRoZSByZXN0IG9mIHRoZSBwYXJhbWV0ZXJzXG4gICAqXG4gICAqIEByZXR1cm5zIEEgcHJvbWlzZSBmb3IgW1tSZXF1ZXN0UmVzcG9uc2VEYXRhXV1cbiAgICovXG4gIHBvc3QgPSAoYmFzZXVybDpzdHJpbmcsXG4gICAgZ2V0ZGF0YTpvYmplY3QsXG4gICAgcG9zdGRhdGE6c3RyaW5nIHwgb2JqZWN0IHwgQXJyYXlCdWZmZXIgfCBBcnJheUJ1ZmZlclZpZXcsXG4gICAgaGVhZGVyczpvYmplY3QgPSB7fSxcbiAgICBheGlvc0NvbmZpZzpBeGlvc1JlcXVlc3RDb25maWcgPSB1bmRlZmluZWQpXG4gIDogUHJvbWlzZTxSZXF1ZXN0UmVzcG9uc2VEYXRhPiA9PiB0aGlzLl9yZXF1ZXN0KCdQT1NUJyxcbiAgICBiYXNldXJsLFxuICAgIGdldGRhdGEsXG4gICAgcG9zdGRhdGEsXG4gICAgdGhpcy5fc2V0SGVhZGVycyhoZWFkZXJzKSxcbiAgICBheGlvc0NvbmZpZyk7XG5cbiAgLyoqXG4gICAqIE1ha2VzIGEgUFVUIGNhbGwgdG8gYW4gQVBJLlxuICAgKlxuICAgKiBAcGFyYW0gYmFzZXVybCBQYXRoIHRvIHRoZSBiYXNldXJsXG4gICAqIEBwYXJhbSBnZXRkYXRhIE9iamVjdCBjb250YWluaW5nIHRoZSBrZXkgdmFsdWUgcGFpcnMgc2VudCBpbiBQVVRcbiAgICogQHBhcmFtIHBvc3RkYXRhIE9iamVjdCBjb250YWluaW5nIHRoZSBrZXkgdmFsdWUgcGFpcnMgc2VudCBpbiBQVVRcbiAgICogQHBhcmFtIHBhcmFtZXRlcnMgT2JqZWN0IGNvbnRhaW5pbmcgdGhlIHBhcmFtZXRlcnMgb2YgdGhlIEFQSSBjYWxsXG4gICAqIEBwYXJhbSBoZWFkZXJzIEFuIGFycmF5IEhUVFAgUmVxdWVzdCBIZWFkZXJzXG4gICAqIEBwYXJhbSBheGlvc0NvbmZpZyBDb25maWd1cmF0aW9uIGZvciB0aGUgYXhpb3MgamF2YXNjcmlwdCBsaWJyYXJ5IHRoYXQgd2lsbCBiZSB0aGVcbiAgICogZm91bmRhdGlvbiBmb3IgdGhlIHJlc3Qgb2YgdGhlIHBhcmFtZXRlcnNcbiAgICpcbiAgICogQHJldHVybnMgQSBwcm9taXNlIGZvciBbW1JlcXVlc3RSZXNwb25zZURhdGFdXVxuICAgKi9cbiAgcHV0ID0gKGJhc2V1cmw6c3RyaW5nLFxuICAgIGdldGRhdGE6b2JqZWN0LFxuICAgIHBvc3RkYXRhOnN0cmluZyB8IG9iamVjdCB8IEFycmF5QnVmZmVyIHwgQXJyYXlCdWZmZXJWaWV3LFxuICAgIGhlYWRlcnM6b2JqZWN0ID0ge30sXG4gICAgYXhpb3NDb25maWc6QXhpb3NSZXF1ZXN0Q29uZmlnID0gdW5kZWZpbmVkKVxuICA6IFByb21pc2U8UmVxdWVzdFJlc3BvbnNlRGF0YT4gPT4gdGhpcy5fcmVxdWVzdCgnUFVUJyxcbiAgICBiYXNldXJsLFxuICAgIGdldGRhdGEsXG4gICAgcG9zdGRhdGEsXG4gICAgdGhpcy5fc2V0SGVhZGVycyhoZWFkZXJzKSxcbiAgICBheGlvc0NvbmZpZyk7XG5cbiAgLyoqXG4gICAqIE1ha2VzIGEgUEFUQ0ggY2FsbCB0byBhbiBBUEkuXG4gICAqXG4gICAqIEBwYXJhbSBiYXNldXJsIFBhdGggdG8gdGhlIGJhc2V1cmxcbiAgICogQHBhcmFtIGdldGRhdGEgT2JqZWN0IGNvbnRhaW5pbmcgdGhlIGtleSB2YWx1ZSBwYWlycyBzZW50IGluIFBBVENIXG4gICAqIEBwYXJhbSBwb3N0ZGF0YSBPYmplY3QgY29udGFpbmluZyB0aGUga2V5IHZhbHVlIHBhaXJzIHNlbnQgaW4gUEFUQ0hcbiAgICogQHBhcmFtIHBhcmFtZXRlcnMgT2JqZWN0IGNvbnRhaW5pbmcgdGhlIHBhcmFtZXRlcnMgb2YgdGhlIEFQSSBjYWxsXG4gICAqIEBwYXJhbSBoZWFkZXJzIEFuIGFycmF5IEhUVFAgUmVxdWVzdCBIZWFkZXJzXG4gICAqIEBwYXJhbSBheGlvc0NvbmZpZyBDb25maWd1cmF0aW9uIGZvciB0aGUgYXhpb3MgamF2YXNjcmlwdCBsaWJyYXJ5IHRoYXQgd2lsbCBiZSB0aGVcbiAgICogZm91bmRhdGlvbiBmb3IgdGhlIHJlc3Qgb2YgdGhlIHBhcmFtZXRlcnNcbiAgICpcbiAgICogQHJldHVybnMgQSBwcm9taXNlIGZvciBbW1JlcXVlc3RSZXNwb25zZURhdGFdXVxuICAgKi9cbiAgcGF0Y2ggPSAoYmFzZXVybDpzdHJpbmcsXG4gICAgZ2V0ZGF0YTpvYmplY3QsXG4gICAgcG9zdGRhdGE6c3RyaW5nIHwgb2JqZWN0IHwgQXJyYXlCdWZmZXIgfCBBcnJheUJ1ZmZlclZpZXcsXG4gICAgaGVhZGVyczpvYmplY3QgPSB7fSxcbiAgICBheGlvc0NvbmZpZzpBeGlvc1JlcXVlc3RDb25maWcgPSB1bmRlZmluZWQpXG4gIDogUHJvbWlzZTxSZXF1ZXN0UmVzcG9uc2VEYXRhPiA9PiB0aGlzLl9yZXF1ZXN0KCdQQVRDSCcsXG4gICAgYmFzZXVybCxcbiAgICBnZXRkYXRhLFxuICAgIHBvc3RkYXRhLFxuICAgIHRoaXMuX3NldEhlYWRlcnMoaGVhZGVycyksXG4gICAgYXhpb3NDb25maWcpO1xuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgbmV3IEF2YWxhbmNoZSBpbnN0YW5jZS4gU2V0cyB0aGUgYWRkcmVzcyBhbmQgcG9ydCBvZiB0aGUgbWFpbiBBdmFsYW5jaGUgQ2xpZW50LlxuICAgKlxuICAgKiBAcGFyYW0gaXAgVGhlIGhvc3RuYW1lIHRvIHJlc29sdmUgdG8gcmVhY2ggdGhlIEF2YWxhbmNoZSBDbGllbnQgQVBJc1xuICAgKiBAcGFyYW0gcG9ydCBUaGUgcG9ydCB0byByZXNvbHZlIHRvIHJlYWNoIHRoZSBBdmFsYW5jaGUgQ2xpZW50IEFQSXNcbiAgICogQHBhcmFtIHByb3RvY29sIFRoZSBwcm90b2NvbCBzdHJpbmcgdG8gdXNlIGJlZm9yZSBhIFwiOi8vXCIgaW4gYSByZXF1ZXN0LCBleDogXCJodHRwXCIsIFwiaHR0cHNcIiwgXCJnaXRcIiwgXCJ3c1wiLCBldGMgLi4uXG4gICAqL1xuICBjb25zdHJ1Y3RvcihpcDpzdHJpbmcsIHBvcnQ6bnVtYmVyLCBwcm90b2NvbDpzdHJpbmcgPSAnaHR0cCcpIHtcbiAgICB0aGlzLnNldEFkZHJlc3MoaXAsIHBvcnQsIHByb3RvY29sKTtcbiAgfVxufVxuIl19