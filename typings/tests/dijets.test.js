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
const jest_mock_axios_1 = __importDefault(require("jest-mock-axios"));
const src_1 = require("src");
const api_1 = require("src/apis/avm/api");
const api_2 = require("src/apis/admin/api");
const api_3 = require("src/apis/health/api");
const api_4 = require("src/apis/info/api");
const api_5 = require("src/apis/keystore/api");
const api_6 = require("src/apis/metrics/api");
const api_7 = require("src/apis/platformvm/api");
const testlib_1 = require("./testlib");
describe('Dijets', () => {
    const blockchainid = "6h2s5de1VC65meajE1L2PjvZ1MXvHc3F6eqPCGKuDt4MxiweF";
    const ip = '127.0.0.1';
    const port = 9650;
    const protocol = "https";
    let dijets;
    beforeAll(() => {
        dijets = new src_1.Dijets(ip, port, protocol, 12345, undefined, undefined, undefined, true);
        dijets.addAPI("admin", api_2.AdminAPI);
        dijets.addAPI("xchain", api_1.AVMAPI, "/ext/subnet/avm", blockchainid);
        dijets.addAPI("health", api_3.HealthAPI);
        dijets.addAPI("info", api_4.InfoAPI);
        dijets.addAPI("keystore", api_5.KeystoreAPI);
        dijets.addAPI("metrics", api_6.MetricsAPI);
        dijets.addAPI("pchain", api_7.PlatformVMAPI);
    });
    test('Can initialize without port', () => {
        const a = new src_1.Dijets(ip, undefined, protocol, 12345);
        expect(a.getPort()).toBe(undefined);
        expect(a.getURL()).toBe(`${protocol}://${ip}`);
    });
    test('Can initialize with port', () => {
        expect(dijets.getIP()).toBe(ip);
        expect(dijets.getPort()).toBe(port);
        expect(dijets.getProtocol()).toBe(protocol);
        expect(dijets.getURL()).toBe(`${protocol}://${ip}:${port}`);
        expect(dijets.getNetworkID()).toBe(12345);
        expect(dijets.getHeaders()).toStrictEqual({});
        dijets.setNetworkID(50);
        expect(dijets.getNetworkID()).toBe(50);
        dijets.setNetworkID(12345);
        expect(dijets.getNetworkID()).toBe(12345);
    });
    test('Endpoints correct', () => {
        expect(dijets.Admin()).not.toBeInstanceOf(api_1.AVMAPI);
        expect(dijets.Admin()).toBeInstanceOf(api_2.AdminAPI);
        expect(dijets.XChain()).not.toBeInstanceOf(api_2.AdminAPI);
        expect(dijets.XChain()).toBeInstanceOf(api_1.AVMAPI);
        expect(dijets.Health()).not.toBeInstanceOf(api_5.KeystoreAPI);
        expect(dijets.Health()).toBeInstanceOf(api_3.HealthAPI);
        expect(dijets.Info()).not.toBeInstanceOf(api_5.KeystoreAPI);
        expect(dijets.Info()).toBeInstanceOf(api_4.InfoAPI);
        expect(dijets.PChain()).not.toBeInstanceOf(api_5.KeystoreAPI);
        expect(dijets.PChain()).toBeInstanceOf(api_7.PlatformVMAPI);
        expect(dijets.NodeKeys()).not.toBeInstanceOf(api_7.PlatformVMAPI);
        expect(dijets.NodeKeys()).toBeInstanceOf(api_5.KeystoreAPI);
        expect(dijets.Metrics()).not.toBeInstanceOf(api_5.KeystoreAPI);
        expect(dijets.Metrics()).toBeInstanceOf(api_6.MetricsAPI);
        expect(dijets.Admin().getRPCID()).toBe(1);
        expect(dijets.XChain().getRPCID()).toBe(1);
        expect(dijets.PChain().getRPCID()).toBe(1);
        expect(dijets.NodeKeys().getRPCID()).toBe(1);
    });
    test('Create new API', () => {
        dijets.addAPI("avm2", api_1.AVMAPI);
        expect(dijets.api("avm2")).toBeInstanceOf(api_1.AVMAPI);
        dijets.addAPI("keystore2", api_5.KeystoreAPI, "/ext/keystore2");
        expect(dijets.api("keystore2")).toBeInstanceOf(api_5.KeystoreAPI);
        dijets.api("keystore2").setBaseURL("/ext/keystore3");
        expect(dijets.api("keystore2").getBaseURL()).toBe("/ext/keystore3");
        expect(dijets.api("keystore2").getDB()).toHaveProperty("namespace");
    });
    test("Customize headers", () => {
        dijets.setHeader("X-Custom-Header", "example");
        dijets.setHeader("X-Foo", "Foo");
        dijets.setHeader("X-Bar", "Bar");
        expect(dijets.getHeaders()).toStrictEqual({
            "X-Custom-Header": "example",
            "X-Foo": "Foo",
            "X-Bar": "Bar",
        });
        dijets.removeHeader("X-Foo");
        expect(dijets.getHeaders()).toStrictEqual({
            "X-Custom-Header": "example",
            "X-Bar": "Bar",
        });
        dijets.removeAllHeaders();
        expect(dijets.getHeaders()).toStrictEqual({});
    });
    test("Customize request config", () => {
        expect(dijets.getRequestConfig()).toStrictEqual({});
        dijets.setRequestConfig("withCredentials", true);
        dijets.setRequestConfig("withFoo", "Foo");
        dijets.setRequestConfig("withBar", "Bar");
        expect(dijets.getRequestConfig()).toStrictEqual({
            withCredentials: true,
            withFoo: "Foo",
            withBar: "Bar"
        });
        dijets.removeRequestConfig("withFoo");
        expect(dijets.getRequestConfig()).toStrictEqual({
            withCredentials: true,
            withBar: "Bar"
        });
        dijets.removeAllRequestConfigs();
        expect(dijets.getRequestConfig()).toStrictEqual({});
    });
});
describe('HTTP Operations', () => {
    const ip = '127.0.0.1';
    const port = 8080;
    const protocol = 'http';
    const path = '/ext/testingrequests';
    let dijets;
    beforeAll(() => {
        dijets = new src_1.Dijets(ip, port, protocol, 12345, undefined, undefined, undefined, true);
        dijets.addAPI('testingrequests', testlib_1.TestAPI, path);
    });
    afterEach(() => {
        jest_mock_axios_1.default.reset();
    });
    test('GET works', () => __awaiter(void 0, void 0, void 0, function* () {
        const input = 'TestGET';
        const api = dijets.api('testingrequests');
        const result = api.TestGET(input, `/${input}`);
        const payload = {
            result: {
                output: input,
            },
        };
        const responseObj = {
            data: payload,
        };
        jest_mock_axios_1.default.mockResponse(responseObj);
        const response = yield result;
        expect(jest_mock_axios_1.default.request).toHaveBeenCalledTimes(1);
        expect(response.output).toBe(input);
    }));
    test('DELETE works', () => __awaiter(void 0, void 0, void 0, function* () {
        const input = 'TestDELETE';
        const api = dijets.api('testingrequests');
        const axiosConfig = {
            baseURL: `${protocol}://${ip}:${port}`,
            responseType: 'text',
        };
        const result = api.TestDELETE(input, `/${input}`, axiosConfig);
        const payload = {
            result: {
                output: input,
            },
        };
        const responseObj = {
            data: payload,
        };
        jest_mock_axios_1.default.mockResponse(responseObj);
        const response = yield result;
        expect(jest_mock_axios_1.default.request).toHaveBeenCalledTimes(1);
        expect(response.output).toBe(input);
    }));
    test('POST works', () => __awaiter(void 0, void 0, void 0, function* () {
        const input = 'TestPOST';
        const api = dijets.api('testingrequests');
        const result = api.TestPOST(input, `/${input}`);
        const payload = {
            result: {
                output: input,
            },
        };
        const responseObj = {
            data: payload,
        };
        jest_mock_axios_1.default.mockResponse(responseObj);
        const response = yield result;
        expect(jest_mock_axios_1.default.request).toHaveBeenCalledTimes(1);
        expect(response.output).toBe(input);
    }));
    test('PUT works', () => __awaiter(void 0, void 0, void 0, function* () {
        const input = 'TestPUT';
        const api = dijets.api('testingrequests');
        const result = api.TestPUT(input, `/${input}`);
        const payload = {
            result: {
                output: input,
            },
        };
        const responseObj = {
            data: payload,
        };
        jest_mock_axios_1.default.mockResponse(responseObj);
        const response = yield result;
        expect(jest_mock_axios_1.default.request).toHaveBeenCalledTimes(1);
        expect(response.output).toBe(input);
    }));
    test('PATCH works', () => __awaiter(void 0, void 0, void 0, function* () {
        const input = 'TestPATCH';
        const api = dijets.api('testingrequests');
        const result = api.TestPATCH(input, `/${input}`);
        const payload = {
            result: {
                output: input,
            },
        };
        const responseObj = {
            data: payload,
        };
        jest_mock_axios_1.default.mockResponse(responseObj);
        const response = yield result;
        expect(jest_mock_axios_1.default.request).toHaveBeenCalledTimes(1);
        expect(response.output).toBe(input);
    }));
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXZhbGFuY2hlLnRlc3QuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi90ZXN0cy9hdmFsYW5jaGUudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7OztBQUFBLHNFQUF3QztBQUN4Qyw2QkFBZ0M7QUFDaEMsMENBQTBDO0FBQzFDLDRDQUE4QztBQUM5Qyw2Q0FBZ0Q7QUFDaEQsMkNBQTRDO0FBQzVDLCtDQUFvRDtBQUNwRCw4Q0FBa0Q7QUFDbEQsaURBQXlEO0FBQ3pELHVDQUFvQztBQUdwQyxRQUFRLENBQUMsV0FBVyxFQUFFLEdBQUcsRUFBRTtJQUN2QixNQUFNLFlBQVksR0FBVSxtREFBbUQsQ0FBQztJQUNoRixNQUFNLEVBQUUsR0FBRyxXQUFXLENBQUM7SUFDdkIsTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDO0lBQ2xCLE1BQU0sUUFBUSxHQUFHLE9BQU8sQ0FBQztJQUN6QixJQUFJLFNBQW1CLENBQUM7SUFDeEIsU0FBUyxDQUFDLEdBQUcsRUFBRTtRQUNYLFNBQVMsR0FBRyxJQUFJLGVBQVMsQ0FBQyxFQUFFLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRSxLQUFLLEVBQUUsU0FBUyxFQUFFLFNBQVMsRUFBRSxTQUFTLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFDNUYsU0FBUyxDQUFDLE1BQU0sQ0FBQyxPQUFPLEVBQUUsY0FBUSxDQUFDLENBQUM7UUFDcEMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxRQUFRLEVBQUUsWUFBTSxFQUFFLGlCQUFpQixFQUFFLFlBQVksQ0FBQyxDQUFBO1FBQ25FLFNBQVMsQ0FBQyxNQUFNLENBQUMsUUFBUSxFQUFFLGVBQVMsQ0FBQyxDQUFDO1FBQ3RDLFNBQVMsQ0FBQyxNQUFNLENBQUMsTUFBTSxFQUFFLGFBQU8sQ0FBQyxDQUFDO1FBQ2xDLFNBQVMsQ0FBQyxNQUFNLENBQUMsVUFBVSxFQUFFLGlCQUFXLENBQUMsQ0FBQztRQUMxQyxTQUFTLENBQUMsTUFBTSxDQUFDLFNBQVMs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QU0sTUFBTSxDQUFDO1FBQ2xDLE1BQU0sQ0FBQyx5QkFBUyxDQUFDLE9BQU8sQ0FBQyxDQUFDLHFCQUFxQixDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ25ELE1BQU0sQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQ3RDLENBQUMsQ0FBQSxDQUFDLENBQUM7SUFFSCxJQUFJLENBQUMsYUFBYSxFQUFFLEdBQVMsRUFBRTtRQUM3QixNQUFNLEtBQUssR0FBVSxXQUFXLENBQUM7UUFDakMsTUFBTSxHQUFHLEdBQVcsU0FBUyxDQUFDLEdBQUcsQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO1FBQ3JELE1BQU0sTUFBTSxHQUFtQixHQUFHLENBQUMsU0FBUyxDQUFDLEtBQUssRUFBRSxJQUFJLEtBQUssRUFBRSxDQUFDLENBQUM7UUFDakUsTUFBTSxPQUFPLEdBQVU7WUFDckIsTUFBTSxFQUFFO2dCQUNOLE1BQU0sRUFBRSxLQUFLO2FBQ2Q7U0FDRixDQUFDO1FBQ0YsTUFBTSxXQUFXLEdBQUc7WUFDbEIsSUFBSSxFQUFFLE9BQU87U0FDZCxDQUFDO1FBQ0YseUJBQVMsQ0FBQyxZQUFZLENBQUMsV0FBVyxDQUFDLENBQUM7UUFDcEMsTUFBTSxRQUFRLEdBQU8sTUFBTSxNQUFNLENBQUM7UUFDbEMsTUFBTSxDQUFDLHlCQUFTLENBQUMsT0FBTyxDQUFDLENBQUMscUJBQXFCLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDbkQsTUFBTSxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDdEMsQ0FBQyxDQUFBLENBQUMsQ0FBQztBQUNMLENBQUMsQ0FBQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IG1vY2tBeGlvcyBmcm9tICdqZXN0LW1vY2stYXhpb3MnO1xuaW1wb3J0IHsgQXZhbGFuY2hlIH0gZnJvbSBcInNyY1wiO1xuaW1wb3J0IHsgQVZNQVBJIH0gZnJvbSBcInNyYy9hcGlzL2F2bS9hcGlcIjtcbmltcG9ydCB7IEFkbWluQVBJIH0gZnJvbSBcInNyYy9hcGlzL2FkbWluL2FwaVwiO1xuaW1wb3J0IHsgSGVhbHRoQVBJIH0gZnJvbSAnc3JjL2FwaXMvaGVhbHRoL2FwaSc7XG5pbXBvcnQgeyBJbmZvQVBJIH0gZnJvbSBcInNyYy9hcGlzL2luZm8vYXBpXCI7XG5pbXBvcnQgeyBLZXlzdG9yZUFQSSB9IGZyb20gXCJzcmMvYXBpcy9rZXlzdG9yZS9hcGlcIjtcbmltcG9ydCB7IE1ldHJpY3NBUEkgfSBmcm9tIFwic3JjL2FwaXMvbWV0cmljcy9hcGlcIjtcbmltcG9ydCB7IFBsYXRmb3JtVk1BUEkgfSAgZnJvbSBcInNyYy9hcGlzL3BsYXRmb3Jtdm0vYXBpXCI7XG5pbXBvcnQgeyBUZXN0QVBJIH0gZnJvbSAnLi90ZXN0bGliJztcbmltcG9ydCB7IEF4aW9zUmVxdWVzdENvbmZpZyB9IGZyb20gJ2F4aW9zJztcblxuZGVzY3JpYmUoJ0F2YWxhbmNoZScsICgpID0+IHtcbiAgICBjb25zdCBibG9ja2NoYWluaWQ6c3RyaW5nID0gXCI2aDJzNWRlMVZDNjVtZWFqRTFMMlBqdloxTVh2SGMzRjZlcVBDR0t1RHQ0TXhpd2VGXCI7XG4gICAgY29uc3QgaXAgPSAnMTI3LjAuMC4xJztcbiAgICBjb25zdCBwb3J0ID0gOTY1MDtcbiAgICBjb25zdCBwcm90b2NvbCA9IFwiaHR0cHNcIjtcbiAgICBsZXQgYXZhbGFuY2hlOkF2YWxhbmNoZTtcbiAgICBiZWZvcmVBbGwoKCkgPT4ge1xuICAgICAgICBhdmFsYW5jaGUgPSBuZXcgQXZhbGFuY2hlKGlwLCBwb3J0LCBwcm90b2NvbCwgMTIzNDUsIHVuZGVmaW5lZCwgdW5kZWZpbmVkLCB1bmRlZmluZWQsIHRydWUpO1xuICAgICAgICBhdmFsYW5jaGUuYWRkQVBJKFwiYWRtaW5cIiwgQWRtaW5BUEkpO1xuICAgICAgICBhdmFsYW5jaGUuYWRkQVBJKFwieGNoYWluXCIsIEFWTUFQSSwgXCIvZXh0L3N1Ym5ldC9hdm1cIiwgYmxvY2tjaGFpbmlkKVxuICAgICAgICBhdmFsYW5jaGUuYWRkQVBJKFwiaGVhbHRoXCIsIEhlYWx0aEFQSSk7XG4gICAgICAgIGF2YWxhbmNoZS5hZGRBUEkoXCJpbmZvXCIsIEluZm9BUEkpO1xuICAgICAgICBhdmFsYW5jaGUuYWRkQVBJKFwia2V5c3RvcmVcIiwgS2V5c3RvcmVBUEkpO1xuICAgICAgICBhdmFsYW5jaGUuYWRkQVBJKFwibWV0cmljc1wiLCBNZXRyaWNzQVBJKTtcbiAgICAgICAgYXZhbGFuY2hlLmFkZEFQSShcInBjaGFpblwiLCBQbGF0Zm9ybVZNQVBJKTtcbiAgICB9KTtcbiAgICB0ZXN0KCdDYW4gaW5pdGlhbGl6ZSB3aXRob3V0IHBvcnQnLCAoKSA9PiB7XG4gICAgICAgIGNvbnN0IGEgPSBuZXcgQXZhbGFuY2hlKGlwLCB1bmRlZmluZWQsIHByb3RvY29sLCAxMjM0NSk7XG4gICAgICAgIGV4cGVjdChhLmdldFBvcnQoKSkudG9CZSh1bmRlZmluZWQpO1xuICAgICAgICBleHBlY3QoYS5nZXRVUkwoKSkudG9CZShgJHtwcm90b2NvbH06Ly8ke2lwfWApO1xuICAgIH0pO1xuICAgIHRlc3QoJ0NhbiBpbml0aWFsaXplIHdpdGggcG9ydCcsICgpID0+IHtcbiAgICAgICAgZXhwZWN0KGF2YWxhbmNoZS5nZXRJUCgpKS50b0JlKGlwKTtcbiAgICAgICAgZXhwZWN0KGF2YWxhbmNoZS5nZXRQb3J0KCkpLnRvQmUocG9ydCk7XG4gICAgICAgIGV4cGVjdChhdmFsYW5jaGUuZ2V0UHJvdG9jb2woKSkudG9CZShwcm90b2NvbCk7XG4gICAgICAgIGV4cGVjdChhdmFsYW5jaGUuZ2V0VVJMKCkpLnRvQmUoYCR7cHJvdG9jb2x9Oi8vJHtpcH06JHtwb3J0fWApO1xuICAgICAgICBleHBlY3QoYXZhbGFuY2hlLmdldE5ldHdvcmtJRCgpKS50b0JlKDEyMzQ1KTtcbiAgICAgICAgZXhwZWN0KGF2YWxhbmNoZS5nZXRIZWFkZXJzKCkpLnRvU3RyaWN0RXF1YWwoe30pO1xuICAgICAgICBhdmFsYW5jaGUuc2V0TmV0d29ya0lEKDUwKTtcbiAgICAgICAgZXhwZWN0KGF2YWxhbmNoZS5nZXROZXR3b3JrSUQoKSkudG9CZSg1MCk7XG4gICAgICAgIGF2YWxhbmNoZS5zZXROZXR3b3JrSUQoMTIzNDUpO1xuICAgICAgICBleHBlY3QoYXZhbGFuY2hlLmdldE5ldHdvcmtJRCgpKS50b0JlKDEyMzQ1KTtcbiAgICB9KTtcblxuICAgIHRlc3QoJ0VuZHBvaW50cyBjb3JyZWN0JywgKCkgPT4ge1xuICAgICAgICBleHBlY3QoYXZhbGFuY2hlLkFkbWluKCkpLm5vdC50b0JlSW5zdGFuY2VPZihBVk1BUEkpO1xuICAgICAgICBleHBlY3QoYXZhbGFuY2hlLkFkbWluKCkpLnRvQmVJbnN0YW5jZU9mKEFkbWluQVBJKTtcbiAgICAgICAgXG4gICAgICAgIGV4cGVjdChhdmFsYW5jaGUuWENoYWluKCkpLm5vdC50b0JlSW5zdGFuY2VPZihBZG1pbkFQSSk7XG4gICAgICAgIGV4cGVjdChhdmFsYW5jaGUuWENoYWluKCkpLnRvQmVJbnN0YW5jZU9mKEFWTUFQSSk7XG5cbiAgICAgICAgZXhwZWN0KGF2YWxhbmNoZS5IZWFsdGgoKSkubm90LnRvQmVJbnN0YW5jZU9mKEtleXN0b3JlQVBJKTtcbiAgICAgICAgZXhwZWN0KGF2YWxhbmNoZS5IZWFsdGgoKSkudG9CZUluc3RhbmNlT2YoSGVhbHRoQVBJKTtcblxuICAgICAgICBleHBlY3QoYXZhbGFuY2hlLkluZm8oKSkubm90LnRvQmVJbnN0YW5jZU9mKEtleXN0b3JlQVBJKTtcbiAgICAgICAgZXhwZWN0KGF2YWxhbmNoZS5JbmZvKCkpLnRvQmVJbnN0YW5jZU9mKEluZm9BUEkpO1xuICAgICAgICBcbiAgICAgICAgZXhwZWN0KGF2YWxhbmNoZS5QQ2hhaW4oKSkubm90LnRvQmVJbnN0YW5jZU9mKEtleXN0b3JlQVBJKTtcbiAgICAgICAgZXhwZWN0KGF2YWxhbmNoZS5QQ2hhaW4oKSkudG9CZUluc3RhbmNlT2YoUGxhdGZvcm1WTUFQSSk7XG5cbiAgICAgICAgZXhwZWN0KGF2YWxhbmNoZS5Ob2RlS2V5cygpKS5ub3QudG9CZUluc3RhbmNlT2YoUGxhdGZvcm1WTUFQSSk7XG4gICAgICAgIGV4cGVjdChhdmFsYW5jaGUuTm9kZUtleXMoKSkudG9CZUluc3RhbmNlT2YoS2V5c3RvcmVBUEkpO1xuXG4gICAgICAgIGV4cGVjdChhdmFsYW5jaGUuTWV0cmljcygpKS5ub3QudG9CZUluc3RhbmNlT2YoS2V5c3RvcmVBUEkpO1xuICAgICAgICBleHBlY3QoYXZhbGFuY2hlLk1ldHJpY3MoKSkudG9CZUluc3RhbmNlT2YoTWV0cmljc0FQSSk7XG5cbiAgICAgICAgZXhwZWN0KGF2YWxhbmNoZS5BZG1pbigpLmdldFJQQ0lEKCkpLnRvQmUoMSk7XG4gICAgICAgIGV4cGVjdChhdmFsYW5jaGUuWENoYWluKCkuZ2V0UlBDSUQoKSkudG9CZSgxKTtcbiAgICAgICAgZXhwZWN0KGF2YWxhbmNoZS5QQ2hhaW4oKS5nZXRSUENJRCgpKS50b0JlKDEpO1xuICAgICAgICBleHBlY3QoYXZhbGFuY2hlLk5vZGVLZXlzKCkuZ2V0UlBDSUQoKSkudG9CZSgxKTtcbiAgICB9KTtcblxuICAgIHRlc3QoJ0NyZWF0ZSBuZXcgQVBJJywgKCkgPT4ge1xuICAgICAgICBhdmFsYW5jaGUuYWRkQVBJKFwiYXZtMlwiLCBBVk1BUEkpO1xuICAgICAgICBleHBlY3QoYXZhbGFuY2hlLmFwaShcImF2bTJcIikpLnRvQmVJbnN0YW5jZU9mKEFWTUFQSSk7XG5cbiAgICAgICAgYXZhbGFuY2hlLmFkZEFQSShcImtleXN0b3JlMlwiLCBLZXlzdG9yZUFQSSwgXCIvZXh0L2tleXN0b3JlMlwiKTtcbiAgICAgICAgZXhwZWN0KGF2YWxhbmNoZS5hcGkoXCJrZXlzdG9yZTJcIikpLnRvQmVJbnN0YW5jZU9mKEtleXN0b3JlQVBJKTtcblxuICAgICAgICBhdmFsYW5jaGUuYXBpKFwia2V5c3RvcmUyXCIpLnNldEJhc2VVUkwoXCIvZXh0L2tleXN0b3JlM1wiKTtcbiAgICAgICAgZXhwZWN0KGF2YWxhbmNoZS5hcGkoXCJrZXlzdG9yZTJcIikuZ2V0QmFzZVVSTCgpKS50b0JlKFwiL2V4dC9rZXlzdG9yZTNcIik7XG5cbiAgICAgICAgZXhwZWN0KGF2YWxhbmNoZS5hcGkoXCJrZXlzdG9yZTJcIikuZ2V0REIoKSkudG9IYXZlUHJvcGVydHkoXCJuYW1lc3BhY2VcIik7XG4gICAgfSk7XG5cbiAgICB0ZXN0KFwiQ3VzdG9taXplIGhlYWRlcnNcIiwgKCkgPT4ge1xuICAgICAgYXZhbGFuY2hlLnNldEhlYWRlcihcIlgtQ3VzdG9tLUhlYWRlclwiLCBcImV4YW1wbGVcIik7XG4gICAgICBhdmFsYW5jaGUuc2V0SGVhZGVyKFwiWC1Gb29cIiwgXCJGb29cIik7XG4gICAgICBhdmFsYW5jaGUuc2V0SGVhZGVyKFwiWC1CYXJcIiwgXCJCYXJcIik7XG4gICAgICBleHBlY3QoYXZhbGFuY2hlLmdldEhlYWRlcnMoKSkudG9TdHJpY3RFcXVhbCh7XG4gICAgICAgIFwiWC1DdXN0b20tSGVhZGVyXCI6IFwiZXhhbXBsZVwiLFxuICAgICAgICBcIlgtRm9vXCI6IFwiRm9vXCIsXG4gICAgICAgIFwiWC1CYXJcIjogXCJCYXJcIixcbiAgICAgIH0pO1xuICAgICAgYXZhbGFuY2hlLnJlbW92ZUhlYWRlcihcIlgtRm9vXCIpO1xuICAgICAgZXhwZWN0KGF2YWxhbmNoZS5nZXRIZWFkZXJzKCkpLnRvU3RyaWN0RXF1YWwoe1xuICAgICAgICBcIlgtQ3VzdG9tLUhlYWRlclwiOiBcImV4YW1wbGVcIixcbiAgICAgICAgXCJYLUJhclwiOiBcIkJhclwiLFxuICAgICAgfSk7XG4gICAgICBhdmFsYW5jaGUucmVtb3ZlQWxsSGVhZGVycygpO1xuICAgICAgZXhwZWN0KGF2YWxhbmNoZS5nZXRIZWFkZXJzKCkpLnRvU3RyaWN0RXF1YWwoe30pO1xuICAgIH0pO1xuXG4gICAgdGVzdChcIkN1c3RvbWl6ZSByZXF1ZXN0IGNvbmZpZ1wiLCAoKSA9PiB7XG4gICAgICBleHBlY3QoYXZhbGFuY2hlLmdldFJlcXVlc3RDb25maWcoKSkudG9TdHJpY3RFcXVhbCh7fSk7XG4gICAgICBhdmFsYW5jaGUuc2V0UmVxdWVzdENvbmZpZyhcIndpdGhDcmVkZW50aWFsc1wiLCB0cnVlKVxuICAgICAgYXZhbGFuY2hlLnNldFJlcXVlc3RDb25maWcoXCJ3aXRoRm9vXCIsIFwiRm9vXCIpXG4gICAgICBhdmFsYW5jaGUuc2V0UmVxdWVzdENvbmZpZyhcIndpdGhCYXJcIiwgXCJCYXJcIilcbiAgICAgIGV4cGVjdChhdmFsYW5jaGUuZ2V0UmVxdWVzdENvbmZpZygpKS50b1N0cmljdEVxdWFsKHtcbiAgICAgICAgd2l0aENyZWRlbnRpYWxzOiB0cnVlLFxuICAgICAgICB3aXRoRm9vOiBcIkZvb1wiLFxuICAgICAgICB3aXRoQmFyOiBcIkJhclwiXG4gICAgICB9KTtcbiAgICAgIGF2YWxhbmNoZS5yZW1vdmVSZXF1ZXN0Q29uZmlnKFwid2l0aEZvb1wiKTtcbiAgICAgIGV4cGVjdChhdmFsYW5jaGUuZ2V0UmVxdWVzdENvbmZpZygpKS50b1N0cmljdEVxdWFsKHtcbiAgICAgICAgd2l0aENyZWRlbnRpYWxzOiB0cnVlLFxuICAgICAgICB3aXRoQmFyOiBcIkJhclwiXG4gICAgICB9KTtcbiAgICAgIGF2YWxhbmNoZS5yZW1vdmVBbGxSZXF1ZXN0Q29uZmlncygpO1xuICAgICAgZXhwZWN0KGF2YWxhbmNoZS5nZXRSZXF1ZXN0Q29uZmlnKCkpLnRvU3RyaWN0RXF1YWwoe30pO1xuICAgIH0pO1xufSk7XG5cbmRlc2NyaWJlKCdIVFRQIE9wZXJhdGlvbnMnLCAoKSA9PiB7XG4gIGNvbnN0IGlwID0gJzEyNy4wLjAuMSc7XG4gIGNvbnN0IHBvcnQgPSA4MDgwO1xuICBjb25zdCBwcm90b2NvbCA9ICdodHRwJztcbiAgY29uc3QgcGF0aCA9ICcvZXh0L3Rlc3RpbmdyZXF1ZXN0cyc7XG4gIGxldCBhdmFsYW5jaGU6QXZhbGFuY2hlO1xuICBiZWZvcmVBbGwoKCkgPT4ge1xuICAgIGF2YWxhbmNoZSA9IG5ldyBBdmFsYW5jaGUoaXAsIHBvcnQsIHByb3RvY29sLCAxMjM0NSwgdW5kZWZpbmVkLCB1bmRlZmluZWQsIHVuZGVmaW5lZCwgdHJ1ZSk7XG4gICAgYXZhbGFuY2hlLmFkZEFQSSgndGVzdGluZ3JlcXVlc3RzJywgVGVzdEFQSSwgcGF0aCk7XG4gIH0pO1xuXG4gIGFmdGVyRWFjaCgoKSA9PiB7XG4gICAgbW9ja0F4aW9zLnJlc2V0KCk7XG4gIH0pO1xuXG4gIHRlc3QoJ0dFVCB3b3JrcycsIGFzeW5jICgpID0+IHtcbiAgICBjb25zdCBpbnB1dDpzdHJpbmcgPSAnVGVzdEdFVCc7XG4gICAgY29uc3QgYXBpOlRlc3RBUEkgPSBhdmFsYW5jaGUuYXBpKCd0ZXN0aW5ncmVxdWVzdHMnKTtcbiAgICBjb25zdCByZXN1bHQ6UHJvbWlzZTxvYmplY3Q+ID0gYXBpLlRlc3RHRVQoaW5wdXQsIGAvJHtpbnB1dH1gKTtcbiAgICBjb25zdCBwYXlsb2FkOm9iamVjdCA9IHtcbiAgICAgIHJlc3VsdDoge1xuICAgICAgICBvdXRwdXQ6IGlucHV0LFxuICAgICAgfSxcbiAgICB9O1xuICAgIGNvbnN0IHJlc3BvbnNlT2JqID0ge1xuICAgICAgZGF0YTogcGF5bG9hZCxcbiAgICB9O1xuICAgIG1vY2tBeGlvcy5tb2NrUmVzcG9uc2UocmVzcG9uc2VPYmopO1xuICAgIGNvbnN0IHJlc3BvbnNlOmFueSA9IGF3YWl0IHJlc3VsdDtcbiAgICBleHBlY3QobW9ja0F4aW9zLnJlcXVlc3QpLnRvSGF2ZUJlZW5DYWxsZWRUaW1lcygxKTtcbiAgICBleHBlY3QocmVzcG9uc2Uub3V0cHV0KS50b0JlKGlucHV0KTtcbiAgfSk7XG5cbiAgdGVzdCgnREVMRVRFIHdvcmtzJywgYXN5bmMgKCkgPT4ge1xuICAgIGNvbnN0IGlucHV0OnN0cmluZyA9ICdUZXN0REVMRVRFJztcbiAgICBjb25zdCBhcGk6VGVzdEFQSSA9IGF2YWxhbmNoZS5hcGkoJ3Rlc3RpbmdyZXF1ZXN0cycpO1xuICAgIGNvbnN0IGF4aW9zQ29uZmlnOkF4aW9zUmVxdWVzdENvbmZpZyA9IHtcbiAgICAgIGJhc2VVUkw6IGAke3Byb3RvY29sfTovLyR7aXB9OiR7cG9ydH1gLFxuICAgICAgcmVzcG9uc2VUeXBlOiAndGV4dCcsXG4gICAgfTtcbiAgICBjb25zdCByZXN1bHQ6UHJvbWlzZTxvYmplY3Q+ID0gYXBpLlRlc3RERUxFVEUoaW5wdXQsIGAvJHtpbnB1dH1gLCBheGlvc0NvbmZpZyk7XG4gICAgY29uc3QgcGF5bG9hZDpvYmplY3QgPSB7XG4gICAgICByZXN1bHQ6IHtcbiAgICAgICAgb3V0cHV0OiBpbnB1dCxcbiAgICAgIH0sXG4gICAgfTtcbiAgICBjb25zdCByZXNwb25zZU9iaiA9IHtcbiAgICAgIGRhdGE6IHBheWxvYWQsXG4gICAgfTtcbiAgICBtb2NrQXhpb3MubW9ja1Jlc3BvbnNlKHJlc3BvbnNlT2JqKTtcbiAgICBjb25zdCByZXNwb25zZTphbnkgPSBhd2FpdCByZXN1bHQ7XG4gICAgZXhwZWN0KG1vY2tBeGlvcy5yZXF1ZXN0KS50b0hhdmVCZWVuQ2FsbGVkVGltZXMoMSk7XG4gICAgZXhwZWN0KHJlc3BvbnNlLm91dHB1dCkudG9CZShpbnB1dCk7XG4gIH0pO1xuXG4gIHRlc3QoJ1BPU1Qgd29ya3MnLCBhc3luYyAoKSA9PiB7XG4gICAgY29uc3QgaW5wdXQ6c3RyaW5nID0gJ1Rlc3RQT1NUJztcbiAgICBjb25zdCBhcGk6VGVzdEFQSSA9IGF2YWxhbmNoZS5hcGkoJ3Rlc3RpbmdyZXF1ZXN0cycpO1xuICAgIGNvbnN0IHJlc3VsdDpQcm9taXNlPG9iamVjdD4gPSBhcGkuVGVzdFBPU1QoaW5wdXQsIGAvJHtpbnB1dH1gKTtcbiAgICBjb25zdCBwYXlsb2FkOm9iamVjdCA9IHtcbiAgICAgIHJlc3VsdDoge1xuICAgICAgICBvdXRwdXQ6IGlucHV0LFxuICAgICAgfSxcbiAgICB9O1xuICAgIGNvbnN0IHJlc3BvbnNlT2JqID0ge1xuICAgICAgZGF0YTogcGF5bG9hZCxcbiAgICB9O1xuICAgIG1vY2tBeGlvcy5tb2NrUmVzcG9uc2UocmVzcG9uc2VPYmopO1xuICAgIGNvbnN0IHJlc3BvbnNlOmFueSA9IGF3YWl0IHJlc3VsdDtcbiAgICBleHBlY3QobW9ja0F4aW9zLnJlcXVlc3QpLnRvSGF2ZUJlZW5DYWxsZWRUaW1lcygxKTtcbiAgICBleHBlY3QocmVzcG9uc2Uub3V0cHV0KS50b0JlKGlucHV0KTtcbiAgfSk7XG5cbiAgdGVzdCgnUFVUIHdvcmtzJywgYXN5bmMgKCkgPT4ge1xuICAgIGNvbnN0IGlucHV0OnN0cmluZyA9ICdUZXN0UFVUJztcbiAgICBjb25zdCBhcGk6VGVzdEFQSSA9IGF2YWxhbmNoZS5hcGkoJ3Rlc3RpbmdyZXF1ZXN0cycpO1xuICAgIGNvbnN0IHJlc3VsdDpQcm9taXNlPG9iamVjdD4gPSBhcGkuVGVzdFBVVChpbnB1dCwgYC8ke2lucHV0fWApO1xuICAgIGNvbnN0IHBheWxvYWQ6b2JqZWN0ID0ge1xuICAgICAgcmVzdWx0OiB7XG4gICAgICAgIG91dHB1dDogaW5wdXQsXG4gICAgICB9LFxuICAgIH07XG4gICAgY29uc3QgcmVzcG9uc2VPYmogPSB7XG4gICAgICBkYXRhOiBwYXlsb2FkLFxuICAgIH07XG4gICAgbW9ja0F4aW9zLm1vY2tSZXNwb25zZShyZXNwb25zZU9iaik7XG4gICAgY29uc3QgcmVzcG9uc2U6YW55ID0gYXdhaXQgcmVzdWx0O1xuICAgIGV4cGVjdChtb2NrQXhpb3MucmVxdWVzdCkudG9IYXZlQmVlbkNhbGxlZFRpbWVzKDEpO1xuICAgIGV4cGVjdChyZXNwb25zZS5vdXRwdXQpLnRvQmUoaW5wdXQpO1xuICB9KTtcblxuICB0ZXN0KCdQQVRDSCB3b3JrcycsIGFzeW5jICgpID0+IHtcbiAgICBjb25zdCBpbnB1dDpzdHJpbmcgPSAnVGVzdFBBVENIJztcbiAgICBjb25zdCBhcGk6VGVzdEFQSSA9IGF2YWxhbmNoZS5hcGkoJ3Rlc3RpbmdyZXF1ZXN0cycpO1xuICAgIGNvbnN0IHJlc3VsdDpQcm9taXNlPG9iamVjdD4gPSBhcGkuVGVzdFBBVENIKGlucHV0LCBgLyR7aW5wdXR9YCk7XG4gICAgY29uc3QgcGF5bG9hZDpvYmplY3QgPSB7XG4gICAgICByZXN1bHQ6IHtcbiAgICAgICAgb3V0cHV0OiBpbnB1dCxcbiAgICAgIH0sXG4gICAgfTtcbiAgICBjb25zdCByZXNwb25zZU9iaiA9IHtcbiAgICAgIGRhdGE6IHBheWxvYWQsXG4gICAgfTtcbiAgICBtb2NrQXhpb3MubW9ja1Jlc3BvbnNlKHJlc3BvbnNlT2JqKTtcbiAgICBjb25zdCByZXNwb25zZTphbnkgPSBhd2FpdCByZXN1bHQ7XG4gICAgZXhwZWN0KG1vY2tBeGlvcy5yZXF1ZXN0KS50b0hhdmVCZWVuQ2FsbGVkVGltZXMoMSk7XG4gICAgZXhwZWN0KHJlc3BvbnNlLm91dHB1dCkudG9CZShpbnB1dCk7XG4gIH0pO1xufSk7XG4iXX0=