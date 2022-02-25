import mockAxios from 'jest-mock-axios';
import { Dijets } from "src";
import { AVMAPI } from "src/apis/avm/api";
import { AdminAPI } from "src/apis/admin/api";
import { HealthAPI } from 'src/apis/health/api';
import { InfoAPI } from "src/apis/info/api";
import { KeystoreAPI } from "src/apis/keystore/api";
import { MetricsAPI } from "src/apis/metrics/api";
import { PlatformVMAPI }  from "src/apis/platformvm/api";
import { TestAPI } from './testlib';
import { AxiosRequestConfig } from 'axios';

describe('Dijets', () => {
    const blockchainid:string = "6h2s5de1VC65meajE1L2PjvZ1MXvHc3F6eqPCGKuDt4MxiweF";
    const ip = '127.0.0.1';
    const port = 9650;
    const protocol = "https";
    let dijets:Dijets;
    beforeAll(() => {
        dijets = new Dijets(ip, port, protocol, 12345, undefined, undefined, undefined, true);
        dijets.addAPI("admin", AdminAPI);
        dijets.addAPI("xchain", AVMAPI, "/ext/subnet/avm", blockchainid)
        dijets.addAPI("health", HealthAPI);
        dijets.addAPI("info", InfoAPI);
        dijets.addAPI("keystore", KeystoreAPI);
        dijets.addAPI("metrics", MetricsAPI);
        dijets.addAPI("pchain", PlatformVMAPI);
    });
    test('Can initialize without port', () => {
        const a = new Dijets(ip, undefined, protocol, 12345);
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
        expect(dijets.Admin()).not.toBeInstanceOf(AVMAPI);
        expect(dijets.Admin()).toBeInstanceOf(AdminAPI);
        
        expect(dijets.XChain()).not.toBeInstanceOf(AdminAPI);
        expect(dijets.XChain()).toBeInstanceOf(AVMAPI);

        expect(dijets.Health()).not.toBeInstanceOf(KeystoreAPI);
        expect(dijets.Health()).toBeInstanceOf(HealthAPI);

        expect(dijets.Info()).not.toBeInstanceOf(KeystoreAPI);
        expect(dijets.Info()).toBeInstanceOf(InfoAPI);
        
        expect(dijets.PChain()).not.toBeInstanceOf(KeystoreAPI);
        expect(dijets.PChain()).toBeInstanceOf(PlatformVMAPI);

        expect(dijets.NodeKeys()).not.toBeInstanceOf(PlatformVMAPI);
        expect(dijets.NodeKeys()).toBeInstanceOf(KeystoreAPI);

        expect(dijets.Metrics()).not.toBeInstanceOf(KeystoreAPI);
        expect(dijets.Metrics()).toBeInstanceOf(MetricsAPI);

        expect(dijets.Admin().getRPCID()).toBe(1);
        expect(dijets.XChain().getRPCID()).toBe(1);
        expect(dijets.PChain().getRPCID()).toBe(1);
        expect(dijets.NodeKeys().getRPCID()).toBe(1);
    });

    test('Create new API', () => {
        dijets.addAPI("avm2", AVMAPI);
        expect(dijets.api("avm2")).toBeInstanceOf(AVMAPI);

        dijets.addAPI("keystore2", KeystoreAPI, "/ext/keystore2");
        expect(dijets.api("keystore2")).toBeInstanceOf(KeystoreAPI);

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
      dijets.setRequestConfig("withCredentials", true)
      dijets.setRequestConfig("withFoo", "Foo")
      dijets.setRequestConfig("withBar", "Bar")
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
  let dijets:Dijets;
  beforeAll(() => {
    dijets = new Dijets(ip, port, protocol, 12345, undefined, undefined, undefined, true);
    dijets.addAPI('testingrequests', TestAPI, path);
  });

  afterEach(() => {
    mockAxios.reset();
  });

  test('GET works', async () => {
    const input:string = 'TestGET';
    const api:TestAPI = dijets.api('testingrequests');
    const result:Promise<object> = api.TestGET(input, `/${input}`);
    const payload:object = {
      result: {
        output: input,
      },
    };
    const responseObj = {
      data: payload,
    };
    mockAxios.mockResponse(responseObj);
    const response:any = await result;
    expect(mockAxios.request).toHaveBeenCalledTimes(1);
    expect(response.output).toBe(input);
  });

  test('DELETE works', async () => {
    const input:string = 'TestDELETE';
    const api:TestAPI = dijets.api('testingrequests');
    const axiosConfig:AxiosRequestConfig = {
      baseURL: `${protocol}://${ip}:${port}`,
      responseType: 'text',
    };
    const result:Promise<object> = api.TestDELETE(input, `/${input}`, axiosConfig);
    const payload:object = {
      result: {
        output: input,
      },
    };
    const responseObj = {
      data: payload,
    };
    mockAxios.mockResponse(responseObj);
    const response:any = await result;
    expect(mockAxios.request).toHaveBeenCalledTimes(1);
    expect(response.output).toBe(input);
  });

  test('POST works', async () => {
    const input:string = 'TestPOST';
    const api:TestAPI = dijets.api('testingrequests');
    const result:Promise<object> = api.TestPOST(input, `/${input}`);
    const payload:object = {
      result: {
        output: input,
      },
    };
    const responseObj = {
      data: payload,
    };
    mockAxios.mockResponse(responseObj);
    const response:any = await result;
    expect(mockAxios.request).toHaveBeenCalledTimes(1);
    expect(response.output).toBe(input);
  });

  test('PUT works', async () => {
    const input:string = 'TestPUT';
    const api:TestAPI = dijets.api('testingrequests');
    const result:Promise<object> = api.TestPUT(input, `/${input}`);
    const payload:object = {
      result: {
        output: input,
      },
    };
    const responseObj = {
      data: payload,
    };
    mockAxios.mockResponse(responseObj);
    const response:any = await result;
    expect(mockAxios.request).toHaveBeenCalledTimes(1);
    expect(response.output).toBe(input);
  });

  test('PATCH works', async () => {
    const input:string = 'TestPATCH';
    const api:TestAPI = dijets.api('testingrequests');
    const result:Promise<object> = api.TestPATCH(input, `/${input}`);
    const payload:object = {
      result: {
        output: input,
      },
    };
    const responseObj = {
      data: payload,
    };
    mockAxios.mockResponse(responseObj);
    const response:any = await result;
    expect(mockAxios.request).toHaveBeenCalledTimes(1);
    expect(response.output).toBe(input);
  });
});
