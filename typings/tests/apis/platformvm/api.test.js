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
const api_1 = require("src/apis/platformvm/api");
const buffer_1 = require("buffer/");
const bn_js_1 = __importDefault(require("bn.js"));
const bintools_1 = __importDefault(require("src/utils/bintools"));
const bech32 = __importStar(require("bech32"));
const constants_1 = require("src/utils/constants");
const utxos_1 = require("src/apis/platformvm/utxos");
const persistenceoptions_1 = require("src/utils/persistenceoptions");
const keychain_1 = require("src/apis/platformvm/keychain");
const outputs_1 = require("src/apis/platformvm/outputs");
const inputs_1 = require("src/apis/platformvm/inputs");
const utxos_2 = require("src/apis/platformvm/utxos");
const create_hash_1 = __importDefault(require("create-hash"));
const tx_1 = require("src/apis/platformvm/tx");
const helperfunctions_1 = require("src/utils/helperfunctions");
const payload_1 = require("src/utils/payload");
const helperfunctions_2 = require("src/utils/helperfunctions");
const constants_2 = require("src/utils/constants");
const serialization_1 = require("src/utils/serialization");
/**
 * @ignore
 */
const bintools = bintools_1.default.getInstance();
const serializer = serialization_1.Serialization.getInstance();
const dumpSerialization = false;
function serialzeit(aThing, name) {
    if (dumpSerialization) {
        console.log(JSON.stringify(serializer.serialize(aThing, "platformvm", "hex", name + " -- Hex Encoded")));
        console.log(JSON.stringify(serializer.serialize(aThing, "platformvm", "display", name + " -- Human-Readable")));
    }
}
describe('PlatformVMAPI', () => {
    const networkid = 12345;
    const blockchainid = constants_1.PlatformChainID;
    const ip = '127.0.0.1';
    const port = 9650;
    const protocol = 'https';
    const nodeID = "NodeID-B6D4v1VtPYLbiUvYXtW4Px8oE9imC2vGW";
    const startTime = helperfunctions_1.UnixNow().add(new bn_js_1.default(60 * 5));
    const endTime = startTime.add(new bn_js_1.default(1209600));
    const username = 'DijetsInc';
    const password = 'password';
    const dijets = new src_1.Dijets(ip, port, protocol, networkid, undefined, undefined, undefined, true);
    let api;
    let alias;
    const addrA = 'P-' + bech32.encode(dijets.getHRP(), bech32.toWords(bintools.cb58Decode("B6D4v1VtPYLbiUvYXtW4Px8oE9imC2vGW")));
    const addrB = 'P-' + bech32.encode(dijets.getHRP(), bech32.toWords(bintools.cb58Decode("P5wdRuZeaDt28eHMP5S3w9ZdoBfo7wuzF")));
    const addrC = 'P-' + bech32.encode(dijets.getHRP(), bech32.toWords(bintools.cb58Decode("6Y3kysjF9jnHnYkdS9yGAuoHyae2eNmeV")));
    beforeAll(() => {
        api = new api_1.PlatformVMAPI(dijets, '/ext/bc/P');
        alias = api.getBlockchainAlias();
    });
    afterEach(() => {
        jest_mock_axios_1.default.reset();
    });
    test('refreshBlockchainID', () => __awaiter(void 0, void 0, void 0, function* () {
        let n3bcID = constants_1.Defaults.network[3].P["blockchainID"];
        let testAPI = new api_1.PlatformVMAPI(dijets, '/ext/bc/P');
        let bc1 = testAPI.getBlockchainID();
        expect(bc1).toBe(constants_1.PlatformChainID);
        testAPI.refreshBlockchainID();
        let bc2 = testAPI.getBlockchainID();
        expect(bc2).toBe(constants_1.PlatformChainID);
        testAPI.refreshBlockchainID(n3bcID);
        let bc3 = testAPI.getBlockchainID();
        expect(bc3).toBe(n3bcID);
    }));
    test('listAddresses', () => __awaiter(void 0, void 0, void 0, function* () {
        const addresses = [addrA, addrB];
        const result = api.listAddresses(username, password);
        const payload = {
            result: {
                addresses,
            },
        };
        const responseObj = {
            data: payload,
        };
        jest_mock_axios_1.default.mockResponse(responseObj);
        const response = yield result;
        expect(jest_mock_axios_1.default.request).toHaveBeenCalledTimes(1);
        expect(response).toBe(addresses);
    }));
    test('importKey', () => __awaiter(void 0, void 0, void 0, function* () {
        const address = addrC;
        const result = api.importKey(username, password, 'key');
        const payload = {
            result: {
                address,
            },
        };
        const responseObj = {
            data: payload,
        };
        jest_mock_axios_1.default.mockResponse(responseObj);
        const response = yield result;
        expect(jest_mock_axios_1.default.request).toHaveBeenCalledTimes(1);
        expect(response).toBe(address);
    }));
    test('getBalance', () => __awaiter(void 0, void 0, void 0, function* () {
        const balance = new bn_js_1.default('100', 10);
        const respobj = {
            balance,
            utxoIDs: [
                {
                    "txID": "LUriB3W919F84LwPMMw4sm2fZ4Y76Wgb6msaauEY7i1tFNmtv",
                    "outputIndex": 0
                }
            ]
        };
        const result = api.getBalance(addrA);
        const payload = {
            result: respobj,
        };
        const responseObj = {
            data: payload,
        };
        jest_mock_axios_1.default.mockResponse(responseObj);
        const response = yield result;
        expect(jest_mock_axios_1.default.request).toHaveBeenCalledTimes(1);
        expect(JSON.stringify(response)).toBe(JSON.stringify(respobj));
    }));
    test('getCurrentSupply', () => __awaiter(void 0, void 0, void 0, function* () {
        const supply = new bn_js_1.default('1000000000000', 10);
        const result = api.getCurrentSupply();
        const payload = {
            result: {
                supply
            },
        };
        const responseObj = {
            data: payload,
        };
        jest_mock_axios_1.default.mockResponse(responseObj);
        const response = yield result;
        expect(jest_mock_axios_1.default.request).toHaveBeenCalledTimes(1);
        expect(response.toString(10)).toBe(supply.toString(10));
    }));
    test('getHeight', () => __awaiter(void 0, void 0, void 0, function* () {
        const height = new bn_js_1.default('100', 10);
        const result = api.getHeight();
        const payload = {
            result: {
                height
            },
        };
        const responseObj = {
            data: payload,
        };
        jest_mock_axios_1.default.mockResponse(responseObj);
        const response = yield result;
        expect(jest_mock_axios_1.default.request).toHaveBeenCalledTimes(1);
        expect(response.toString(10)).toBe(height.toString(10));
    }));
    test('getMinStake', () => __awaiter(void 0, void 0, void 0, function* () {
        const minStake = new bn_js_1.default("2000000000000", 10);
        const minDelegate = new bn_js_1.default("25000000000", 10);
        const result = api.getMinStake();
        const payload = {
            result: {
                minValidatorStake: "2000000000000",
                minDelegatorStake: "25000000000"
            },
        };
        const responseObj = {
            data: payload,
        };
        jest_mock_axios_1.default.mockResponse(responseObj);
        const response = yield result;
        expect(jest_mock_axios_1.default.request).toHaveBeenCalledTimes(1);
        expect(response["minValidatorStake"].toString(10)).toBe(minStake.toString(10));
        expect(response["minDelegatorStake"].toString(10)).toBe(minDelegate.toString(10));
    }));
    test('getStake', () => __awaiter(void 0, void 0, void 0, function* () {
        const staked = new bn_js_1.default('100', 10);
        const result = api.getStake([addrA]);
        const payload = {
            result: {
                staked
            },
        };
        const responseObj = {
            data: payload,
        };
        jest_mock_axios_1.default.mockResponse(responseObj);
        const response = yield result;
        expect(jest_mock_axios_1.default.request).toHaveBeenCalledTimes(1);
        expect(JSON.stringify(response)).toBe(JSON.stringify(staked));
    }));
    test('addSubnetValidator 1', () => __awaiter(void 0, void 0, void 0, function* () {
        const nodeID = 'abcdef';
        const subnetID = "4R5p2RXDGLqaifZE4hHWH9owe34pfoBULn1DrQTWivjg8o4aH";
        const startTime = new Date(1985, 5, 9, 12, 59, 43, 9);
        const endTime = new Date(1982, 3, 1, 12, 58, 33, 7);
        const weight = 13;
        const utx = 'valid';
        const result = api.addSubnetValidator(username, password, nodeID, subnetID, startTime, endTime, weight);
        const payload = {
            result: {
                txID: utx,
            },
        };
        const responseObj = {
            data: payload,
        };
        jest_mock_axios_1.default.mockResponse(responseObj);
        const response = yield result;
        expect(jest_mock_axios_1.default.request).toHaveBeenCalledTimes(1);
        expect(response).toBe(utx);
    }));
    test('addSubnetValidator', () => __awaiter(void 0, void 0, void 0, function* () {
        const nodeID = 'abcdef';
        const subnetID = buffer_1.Buffer.from('abcdef', 'hex');
        const startTime = new Date(1985, 5, 9, 12, 59, 43, 9);
        const endTime = new Date(1982, 3, 1, 12, 58, 33, 7);
        const weight = 13;
        const utx = 'valid';
        const result = api.addSubnetValidator(username, password, nodeID, subnetID, startTime, endTime, weight);
        const payload = {
            result: {
                txID: utx,
            },
        };
        const responseObj = {
            data: payload,
        };
        jest_mock_axios_1.default.mockResponse(responseObj);
        const response = yield result;
        expect(jest_mock_axios_1.default.request).toHaveBeenCalledTimes(1);
        expect(response).toBe(utx);
    }));
    test('addDelegator 1', () => __awaiter(void 0, void 0, void 0, function* () {
        const nodeID = 'abcdef';
        const startTime = new Date(1985, 5, 9, 12, 59, 43, 9);
        const endTime = new Date(1982, 3, 1, 12, 58, 33, 7);
        const stakeAmount = new bn_js_1.default(13);
        const rewardAddress = 'fedcba';
        const utx = 'valid';
        const result = api.addDelegator(username, password, nodeID, startTime, endTime, stakeAmount, rewardAddress);
        const payload = {
            result: {
                txID: utx,
            },
        };
        const responseObj = {
            data: payload,
        };
        jest_mock_axios_1.default.mockResponse(responseObj);
        const response = yield result;
        expect(jest_mock_axios_1.default.request).toHaveBeenCalledTimes(1);
        expect(response).toBe(utx);
    }));
    test('getBlockchains 1', () => __awaiter(void 0, void 0, void 0, function* () {
        const resp = [{
                id: 'nodeID',
                subnetID: 'subnetID',
                vmID: 'vmID',
            }];
        const result = api.getBlockchains();
        const payload = {
            result: {
                blockchains: resp,
            },
        };
        const responseObj = {
            data: payload,
        };
        jest_mock_axios_1.default.mockResponse(responseObj);
        const response = yield result;
        expect(jest_mock_axios_1.default.request).toHaveBeenCalledTimes(1);
        expect(response).toBe(resp);
    }));
    test('getSubnets 1', () => __awaiter(void 0, void 0, void 0, function* () {
        const resp = [{
                id: 'id',
                controlKeys: ['controlKeys'],
                threshold: 'threshold',
            }];
        const result = api.getSubnets();
        const payload = {
            result: {
                subnets: resp,
            },
        };
        const responseObj = {
            data: payload,
        };
        jest_mock_axios_1.default.mockResponse(responseObj);
        const response = yield result;
        expect(jest_mock_axios_1.default.request).toHaveBeenCalledTimes(1);
        expect(response).toEqual(resp);
    }));
    test('getCurrentValidators 1', () => __awaiter(void 0, void 0, void 0, function* () {
        const validators = ['val1', 'val2'];
        const result = api.getCurrentValidators();
        const payload = {
            result: {
                validators,
            },
        };
        const responseObj = {
            data: payload,
        };
        jest_mock_axios_1.default.mockResponse(responseObj);
        const response = yield result;
        expect(jest_mock_axios_1.default.request).toHaveBeenCalledTimes(1);
        expect(response).toStrictEqual({ validators });
    }));
    test('getCurrentValidators 2', () => __awaiter(void 0, void 0, void 0, function* () {
        const subnetID = 'abcdef';
        const validators = ['val1', 'val2'];
        const result = api.getCurrentValidators(subnetID);
        const payload = {
            result: {
                validators,
            },
        };
        const responseObj = {
            data: payload,
        };
        jest_mock_axios_1.default.mockResponse(responseObj);
        const response = yield result;
        expect(jest_mock_axios_1.default.request).toHaveBeenCalledTimes(1);
        expect(response).toStrictEqual({ validators });
    }));
    test('getCurrentValidators 3', () => __awaiter(void 0, void 0, void 0, function* () {
        const subnetID = buffer_1.Buffer.from('abcdef', 'hex');
        const validators = ['val1', 'val2'];
        const result = api.getCurrentValidators(subnetID);
        const payload = {
            result: {
                validators,
            },
        };
        const responseObj = {
            data: payload,
        };
        jest_mock_axios_1.default.mockResponse(responseObj);
        const response = yield result;
        expect(jest_mock_axios_1.default.request).toHaveBeenCalledTimes(1);
        expect(response).toStrictEqual({ validators });
    }));
    test('exportKey', () => __awaiter(void 0, void 0, void 0, function* () {
        const key = 'sdfglvlj2h3v45';
        const result = api.exportKey(username, password, addrA);
        const payload = {
            result: {
                privateKey: key,
            },
        };
        const responseObj = {
            data: payload,
        };
        jest_mock_axios_1.default.mockResponse(responseObj);
        const response = yield result;
        expect(jest_mock_axios_1.default.request).toHaveBeenCalledTimes(1);
        expect(response).toBe(key);
    }));
    test("exportDJTX", () => __awaiter(void 0, void 0, void 0, function* () {
        let amount = new bn_js_1.default(100);
        let to = "abcdef";
        let username = "Robert";
        let password = "Paulson";
        let txID = "valid";
        let result = api.exportDJTX(username, password, amount, to);
        let payload = {
            "result": {
                "txID": txID
            }
        };
        let responseObj = {
            data: payload
        };
        jest_mock_axios_1.default.mockResponse(responseObj);
        let response = yield result;
        expect(jest_mock_axios_1.default.request).toHaveBeenCalledTimes(1);
        expect(response).toBe(txID);
    }));
    test("importDJTX", () => __awaiter(void 0, void 0, void 0, function* () {
        let to = "abcdef";
        let username = "Robert";
        let password = "Paulson";
        let txID = "valid";
        let result = api.importDJTX(username, password, to, blockchainid);
        let payload = {
            "result": {
                "txID": txID
            }
        };
        let responseObj = {
            data: payload
        };
        jest_mock_axios_1.default.mockResponse(responseObj);
        let response = yield result;
        expect(jest_mock_axios_1.default.request).toHaveBeenCalledTimes(1);
        expect(response).toBe(txID);
    }));
    test('createBlockchain', () => __awaiter(void 0, void 0, void 0, function* () {
        const blockchainID = '7sik3Pr6r1FeLrvK1oWwECBS8iJ5VPuSh';
        const vmID = '7sik3Pr6r1FeLrvK1oWwECBS8iJ5VPuSh';
        const name = 'Some Blockchain';
        const genesis = '{ruh:"roh"}';
        const subnetID = buffer_1.Buffer.from('abcdef', 'hex');
        const result = api.createBlockchain(username, password, subnetID, vmID, [1, 2, 3], name, genesis);
        const payload = {
            result: {
                txID: blockchainID,
            },
        };
        const responseObj = {
            data: payload,
        };
        jest_mock_axios_1.default.mockResponse(responseObj);
        const response = yield result;
        expect(jest_mock_axios_1.default.request).toHaveBeenCalledTimes(1);
        expect(response).toBe(blockchainID);
    }));
    test('getBlockchainStatus', () => __awaiter(void 0, void 0, void 0, function* () {
        const blockchainID = '7sik3Pr6r1FeLrvK1oWwECBS8iJ5VPuSh';
        const result = api.getBlockchainStatus(blockchainID);
        const payload = {
            result: {
                status: 'Accepted',
            },
        };
        const responseObj = {
            data: payload,
        };
        jest_mock_axios_1.default.mockResponse(responseObj);
        const response = yield result;
        expect(jest_mock_axios_1.default.request).toHaveBeenCalledTimes(1);
        expect(response).toBe('Accepted');
    }));
    test('createAddress', () => __awaiter(void 0, void 0, void 0, function* () {
        const alias = 'randomalias';
        const result = api.createAddress(username, password);
        const payload = {
            result: {
                address: alias,
            },
        };
        const responseObj = {
            data: payload,
        };
        jest_mock_axios_1.default.mockResponse(responseObj);
        const response = yield result;
        expect(jest_mock_axios_1.default.request).toHaveBeenCalledTimes(1);
        expect(response).toBe(alias);
    }));
    test('createSubnet 1', () => __awaiter(void 0, void 0, void 0, function* () {
        const controlKeys = ['abcdef'];
        const threshold = 13;
        const utx = 'valid';
        const result = api.createSubnet(username, password, controlKeys, threshold);
        const payload = {
            result: {
                txID: utx,
            },
        };
        const responseObj = {
            data: payload,
        };
        jest_mock_axios_1.default.mockResponse(responseObj);
        const response = yield result;
        expect(jest_mock_axios_1.default.request).toHaveBeenCalledTimes(1);
        expect(response).toBe(utx);
    }));
    test('sampleValidators 1', () => __awaiter(void 0, void 0, void 0, function* () {
        let subnetID;
        const validators = ['val1', 'val2'];
        const result = api.sampleValidators(10, subnetID);
        const payload = {
            result: {
                validators,
            },
        };
        const responseObj = {
            data: payload,
        };
        jest_mock_axios_1.default.mockResponse(responseObj);
        const response = yield result;
        expect(jest_mock_axios_1.default.request).toHaveBeenCalledTimes(1);
        expect(response).toBe(validators);
    }));
    test('sampleValidators 2', () => __awaiter(void 0, void 0, void 0, function* () {
        const subnetID = 'abcdef';
        const validators = ['val1', 'val2'];
        const result = api.sampleValidators(10, subnetID);
        const payload = {
            result: {
                validators,
            },
        };
        const responseObj = {
            data: payload,
        };
        jest_mock_axios_1.default.mockResponse(responseObj);
        const response = yield result;
        expect(jest_mock_axios_1.default.request).toHaveBeenCalledTimes(1);
        expect(response).toBe(validators);
    }));
    test('sampleValidators 3', () => __awaiter(void 0, void 0, void 0, function* () {
        const subnetID = buffer_1.Buffer.from('abcdef', 'hex');
        const validators = ['val1', 'val2'];
        const result = api.sampleValidators(10, subnetID);
        const payload = {
            result: {
                validators,
            },
        };
        const responseObj = {
            data: payload,
        };
    }));
    test('validatedBy 1', () => __awaiter(void 0, void 0, void 0, function* () {
        const blockchainID = 'abcdef';
        const resp = 'valid';
        const result = api.validatedBy(blockchainID);
        const payload = {
            result: {
                subnetID: resp,
            },
        };
        const responseObj = {
            data: payload,
        };
        jest_mock_axios_1.default.mockResponse(responseObj);
        const response = yield result;
        expect(jest_mock_axios_1.default.request).toHaveBeenCalledTimes(1);
        expect(response).toBe(resp);
    }));
    test('validates 1', () => __awaiter(void 0, void 0, void 0, function* () {
        let subnetID;
        const resp = ['valid'];
        const result = api.validates(subnetID);
        const payload = {
            result: {
                blockchainIDs: resp,
            },
        };
        const responseObj = {
            data: payload,
        };
        jest_mock_axios_1.default.mockResponse(responseObj);
        const response = yield result;
        expect(jest_mock_axios_1.default.request).toHaveBeenCalledTimes(1);
        expect(response).toBe(resp);
    }));
    test('validates 2', () => __awaiter(void 0, void 0, void 0, function* () {
        const subnetID = 'deadbeef';
        const resp = ['valid'];
        const result = api.validates(subnetID);
        const payload = {
            result: {
                blockchainIDs: resp,
            },
        };
        const responseObj = {
            data: payload,
        };
        jest_mock_axios_1.default.mockResponse(responseObj);
        const response = yield result;
        expect(jest_mock_axios_1.default.request).toHaveBeenCalledTimes(1);
        expect(response).toBe(resp);
    }));
    test('validates 3', () => __awaiter(void 0, void 0, void 0, function* () {
        const subnetID = buffer_1.Buffer.from('abcdef', 'hex');
        const resp = ['valid'];
        const result = api.validates(subnetID);
        const payload = {
            result: {
                blockchainIDs: resp,
            },
        };
        const responseObj = {
            data: payload,
        };
        jest_mock_axios_1.default.mockResponse(responseObj);
        const response = yield result;
        expect(jest_mock_axios_1.default.request).toHaveBeenCalledTimes(1);
        expect(response).toBe(resp);
    }));
    test('getTx', () => __awaiter(void 0, void 0, void 0, function* () {
        const txid = 'f966750f438867c3c9828ddcdbe660e21ccdbb36a9276958f011ba472f75d4e7';
        const result = api.getTx(txid);
        const payload = {
            result: {
                tx: 'sometx',
            },
        };
        const responseObj = {
            data: payload,
        };
        jest_mock_axios_1.default.mockResponse(responseObj);
        const response = yield result;
        expect(jest_mock_axios_1.default.request).toHaveBeenCalledTimes(1);
        expect(response).toBe('sometx');
    }));
    test('getTxStatus', () => __awaiter(void 0, void 0, void 0, function* () {
        const txid = 'f966750f438867c3c9828ddcdbe660e21ccdbb36a9276958f011ba472f75d4e7';
        const result = api.getTxStatus(txid);
        const payload = {
            result: 'accepted'
        };
        const responseObj = {
            data: payload,
        };
        jest_mock_axios_1.default.mockResponse(responseObj);
        const response = yield result;
        expect(jest_mock_axios_1.default.request).toHaveBeenCalledTimes(1);
        expect(response).toBe('accepted');
    }));
    test('getUTXOs', () => __awaiter(void 0, void 0, void 0, function* () {
        // Payment
        const OPUTXOstr1 = bintools.cb58Encode(buffer_1.Buffer.from('000038d1b9f1138672da6fb6c35125539276a9acc2a668d63bea6ba3c795e2edb0f5000000013e07e38e2f23121be8756412c18db7246a16d26ee9936f3cba28be149cfd3558000000070000000000004dd500000000000000000000000100000001a36fd0c2dbcab311731dde7ef1514bd26fcdc74d', 'hex'));
        const OPUTXOstr2 = bintools.cb58Encode(buffer_1.Buffer.from('0000c3e4823571587fe2bdfc502689f5a8238b9d0ea7f3277124d16af9de0d2d9911000000003e07e38e2f23121be8756412c18db7246a16d26ee9936f3cba28be149cfd355800000007000000000000001900000000000000000000000100000001e1b6b6a4bad94d2e3f20730379b9bcd6f176318e', 'hex'));
        const OPUTXOstr3 = bintools.cb58Encode(buffer_1.Buffer.from('0000f29dba61fda8d57a911e7f8810f935bde810d3f8d495404685bdb8d9d8545e86000000003e07e38e2f23121be8756412c18db7246a16d26ee9936f3cba28be149cfd355800000007000000000000001900000000000000000000000100000001e1b6b6a4bad94d2e3f20730379b9bcd6f176318e', 'hex'));
        const set = new utxos_1.UTXOSet();
        set.add(OPUTXOstr1);
        set.addArray([OPUTXOstr2, OPUTXOstr3]);
        const persistOpts = new persistenceoptions_1.PersistanceOptions('test', true, 'union');
        expect(persistOpts.getMergeRule()).toBe('union');
        let addresses = set.getAddresses().map((a) => api.addressFromBuffer(a));
        let result = api.getUTXOs(addresses, api.getBlockchainID(), 0, undefined, persistOpts);
        const payload = {
            result: {
                numFetched: 3,
                utxos: [OPUTXOstr1, OPUTXOstr2, OPUTXOstr3],
                stopIndex: { address: "a", utxo: "b" }
            },
        };
        const responseObj = {
            data: payload,
        };
        jest_mock_axios_1.default.mockResponse(responseObj);
        let response = (yield result).utxos;
        expect(jest_mock_axios_1.default.request).toHaveBeenCalledTimes(1);
        expect(JSON.stringify(response.getAllUTXOStrings().sort())).toBe(JSON.stringify(set.getAllUTXOStrings().sort()));
        addresses = set.getAddresses().map((a) => api.addressFromBuffer(a));
        result = api.getUTXOs(addresses, api.getBlockchainID(), 0, undefined, persistOpts);
        jest_mock_axios_1.default.mockResponse(responseObj);
        response = (yield result).utxos;
        expect(jest_mock_axios_1.default.request).toHaveBeenCalledTimes(2);
        expect(JSON.stringify(response.getAllUTXOStrings().sort())).toBe(JSON.stringify(set.getAllUTXOStrings().sort()));
    }));
    describe('Transactions', () => {
        let set;
        let lset;
        let keymgr2;
        let keymgr3;
        let addrs1;
        let addrs2;
        let addrs3;
        let addressbuffs = [];
        let addresses = [];
        let utxos;
        let lutxos;
        let inputs;
        let outputs;
        const amnt = 10000;
        const assetID = buffer_1.Buffer.from(create_hash_1.default('sha256').update('mary had a little lamb').digest());
        const NFTassetID = buffer_1.Buffer.from(create_hash_1.default('sha256').update("I can't stand it, I know you planned it, I'mma set straight this Watergate.'").digest());
        let secpbase1;
        let secpbase2;
        let secpbase3;
        let fungutxoids = [];
        let platformvm;
        const fee = 10;
        const name = 'Mortycoin is the dumb as a sack of hammers.';
        const symbol = 'morT';
        const denomination = 8;
        beforeEach(() => __awaiter(void 0, void 0, void 0, function* () {
            platformvm = new api_1.PlatformVMAPI(dijets, "/ext/bc/P");
            const result = platformvm.getDJTXAssetID();
            const payload = {
                result: {
                    name,
                    symbol,
                    assetID: bintools.cb58Encode(assetID),
                    denomination: `${denomination}`,
                },
            };
            const responseObj = {
                data: payload,
            };
            jest_mock_axios_1.default.mockResponse(responseObj);
            yield result;
            set = new utxos_1.UTXOSet();
            lset = new utxos_1.UTXOSet;
            platformvm.newKeyChain();
            keymgr2 = new keychain_1.KeyChain(dijets.getHRP(), alias);
            keymgr3 = new keychain_1.KeyChain(dijets.getHRP(), alias);
            addrs1 = [];
            addrs2 = [];
            addrs3 = [];
            utxos = [];
            lutxos = [];
            inputs = [];
            outputs = [];
            fungutxoids = [];
            const pload = buffer_1.Buffer.alloc(1024);
            pload.write("All you Trekkies and TV addicts, Don't mean to diss don't mean to bring static.", 0, 1024, 'utf8');
            for (let i = 0; i < 3; i++) {
                addrs1.push(platformvm.addressFromBuffer(platformvm.keyChain().makeKey().getAddress()));
                addrs2.push(platformvm.addressFromBuffer(keymgr2.makeKey().getAddress()));
                addrs3.push(platformvm.addressFromBuffer(keymgr3.makeKey().getAddress()));
            }
            const amount = constants_2.ONEDJTX.mul(new bn_js_1.default(amnt));
            addressbuffs = platformvm.keyChain().getAddresses();
            addresses = addressbuffs.map((a) => platformvm.addressFromBuffer(a));
            const locktime = new bn_js_1.default(54321);
            const threshold = 3;
            for (let i = 0; i < 5; i++) {
                let txid = buffer_1.Buffer.from(create_hash_1.default('sha256').update(bintools.fromBNToBuffer(new bn_js_1.default(i), 32)).digest());
                let txidx = buffer_1.Buffer.alloc(4);
                txidx.writeUInt32BE(i, 0);
                const out = new outputs_1.SECPTransferOutput(amount, addressbuffs, locktime, threshold);
                const xferout = new outputs_1.TransferableOutput(assetID, out);
                outputs.push(xferout);
                const u = new utxos_2.UTXO();
                u.fromBuffer(buffer_1.Buffer.concat([u.getCodecIDBuffer(), txid, txidx, xferout.toBuffer()]));
                fungutxoids.push(u.getUTXOID());
                utxos.push(u);
                txid = u.getTxID();
                txidx = u.getOutputIdx();
                const asset = u.getAssetID();
                const input = new inputs_1.SECPTransferInput(amount);
                const xferinput = new inputs_1.TransferableInput(txid, txidx, asset, input);
                inputs.push(xferinput);
            }
            set.addArray(utxos);
            for (let i = 0; i < 4; i++) {
                let txid = buffer_1.Buffer.from(create_hash_1.default('sha256').update(bintools.fromBNToBuffer(new bn_js_1.default(i), 32)).digest());
                let txidx = buffer_1.Buffer.alloc(4);
                txidx.writeUInt32BE(i, 0);
                const out = new outputs_1.SECPTransferOutput(constants_2.ONEDJTX.mul(new bn_js_1.default(5)), addressbuffs, locktime, 1);
                const pout = new outputs_1.ParseableOutput(out);
                const lockout = new outputs_1.StakeableLockOut(constants_2.ONEDJTX.mul(new bn_js_1.default(5)), addressbuffs, locktime, 1, locktime.add(new bn_js_1.default(86400)), pout);
                const xferout = new outputs_1.TransferableOutput(assetID, lockout);
                const u = new utxos_2.UTXO();
                u.fromBuffer(buffer_1.Buffer.concat([u.getCodecIDBuffer(), txid, txidx, xferout.toBuffer()]));
                lutxos.push(u);
            }
            lset.addArray(lutxos);
            lset.addArray(set.getAllUTXOs());
            secpbase1 = new outputs_1.SECPTransferOutput(new bn_js_1.default(777), addrs3.map((a) => platformvm.parseAddress(a)), helperfunctions_1.UnixNow(), 1);
            secpbase2 = new outputs_1.SECPTransferOutput(new bn_js_1.default(888), addrs2.map((a) => platformvm.parseAddress(a)), helperfunctions_1.UnixNow(), 1);
            secpbase3 = new outputs_1.SECPTransferOutput(new bn_js_1.default(999), addrs2.map((a) => platformvm.parseAddress(a)), helperfunctions_1.UnixNow(), 1);
        }));
        test('signTx', () => __awaiter(void 0, void 0, void 0, function* () {
            const assetID = yield platformvm.getDJTXAssetID();
            const txu2 = set.buildBaseTx(networkid, bintools.cb58Decode(blockchainid), new bn_js_1.default(amnt), assetID, addrs3.map((a) => platformvm.parseAddress(a)), addrs1.map((a) => platformvm.parseAddress(a)), addrs1.map((a) => platformvm.parseAddress(a)), platformvm.getTxFee(), assetID, undefined, helperfunctions_1.UnixNow(), new bn_js_1.default(0), 1);
            const tx2 = txu2.sign(platformvm.keyChain());
        }));
        test('buildImportTx', () => __awaiter(void 0, void 0, void 0, function* () {
            let locktime = new bn_js_1.default(0);
            let threshold = 1;
            platformvm.setTxFee(new bn_js_1.default(fee));
            const addrbuff1 = addrs1.map((a) => platformvm.parseAddress(a));
            const addrbuff2 = addrs2.map((a) => platformvm.parseAddress(a));
            const addrbuff3 = addrs3.map((a) => platformvm.parseAddress(a));
            const fungutxo = set.getUTXO(fungutxoids[1]);
            const fungutxostr = fungutxo.toString();
            const result = platformvm.buildImportTx(set, addrs1, constants_1.PlatformChainID, addrs3, addrs1, addrs2, new payload_1.UTF8Payload("hello world"), helperfunctions_1.UnixNow(), locktime, threshold);
            const payload = {
                result: {
                    utxos: [fungutxostr]
                },
            };
            const responseObj = {
                data: payload,
            };
            jest_mock_axios_1.default.mockResponse(responseObj);
            const txu1 = yield result;
            const txu2 = set.buildImportTx(networkid, bintools.cb58Decode(blockchainid), addrbuff3, addrbuff1, addrbuff2, [fungutxo], bintools.cb58Decode(constants_1.PlatformChainID), platformvm.getTxFee(), yield platformvm.getDJTXAssetID(), new payload_1.UTF8Payload("hello world").getPayload(), helperfunctions_1.UnixNow(), locktime, threshold);
            expect(txu2.toBuffer().toString('hex')).toBe(txu1.toBuffer().toString('hex'));
            expect(txu2.toString()).toBe(txu1.toString());
            let tx1 = txu1.sign(platformvm.keyChain());
            let checkTx = tx1.toBuffer().toString("hex");
            let tx1obj = tx1.serialize("hex");
            let tx1str = JSON.stringify(tx1obj);
            let tx2newobj = JSON.parse(tx1str);
            let tx2 = new tx_1.Tx();
            tx2.deserialize(tx2newobj, "hex");
            expect(tx2.toBuffer().toString("hex")).toBe(checkTx);
            let tx3 = txu1.sign(platformvm.keyChain());
            let tx3obj = tx3.serialize("display");
            let tx3str = JSON.stringify(tx3obj);
            let tx4newobj = JSON.parse(tx3str);
            let tx4 = new tx_1.Tx();
            tx4.deserialize(tx4newobj, "display");
            expect(tx4.toBuffer().toString("hex")).toBe(checkTx);
            serialzeit(tx1, "ImportTx");
        }));
        test('buildExportTx', () => __awaiter(void 0, void 0, void 0, function* () {
            platformvm.setTxFee(new bn_js_1.default(fee));
            const addrbuff1 = addrs1.map((a) => platformvm.parseAddress(a));
            const addrbuff2 = addrs2.map((a) => platformvm.parseAddress(a));
            const addrbuff3 = addrs3.map((a) => platformvm.parseAddress(a));
            const amount = new bn_js_1.default(90);
            const txu1 = yield platformvm.buildExportTx(set, amount, bintools.cb58Decode(constants_1.Defaults.network[dijets.getNetworkID()].X["blockchainID"]), addrbuff3.map((a) => bintools.addressToString(dijets.getHRP(), "P", a)), addrs1, addrs2, new payload_1.UTF8Payload("hello world"), helperfunctions_1.UnixNow());
            const txu2 = set.buildExportTx(networkid, bintools.cb58Decode(blockchainid), amount, assetID, addrbuff3, addrbuff1, addrbuff2, bintools.cb58Decode(constants_1.Defaults.network[dijets.getNetworkID()].X["blockchainID"]), platformvm.getTxFee(), assetID, new payload_1.UTF8Payload("hello world").getPayload(), helperfunctions_1.UnixNow());
            expect(txu2.toBuffer().toString('hex')).toBe(txu1.toBuffer().toString('hex'));
            expect(txu2.toString()).toBe(txu1.toString());
            const txu3 = yield platformvm.buildExportTx(set, amount, bintools.cb58Decode(constants_1.Defaults.network[dijets.getNetworkID()].X["blockchainID"]), addrs3, addrs1, addrs2, new payload_1.UTF8Payload("hello world"), helperfunctions_1.UnixNow());
            const txu4 = set.buildExportTx(networkid, bintools.cb58Decode(blockchainid), amount, assetID, addrbuff3, addrbuff1, addrbuff2, undefined, platformvm.getTxFee(), assetID, new payload_1.UTF8Payload("hello world").getPayload(), helperfunctions_1.UnixNow());
            expect(txu4.toBuffer().toString('hex')).toBe(txu3.toBuffer().toString('hex'));
            expect(txu4.toString()).toBe(txu3.toString());
            expect(txu2.toBuffer().toString('hex')).toBe(txu1.toBuffer().toString('hex'));
            expect(txu2.toString()).toBe(txu1.toString());
            let tx1 = txu1.sign(platformvm.keyChain());
            let checkTx = tx1.toBuffer().toString("hex");
            let tx1obj = tx1.serialize("hex");
            let tx1str = JSON.stringify(tx1obj);
            let tx2newobj = JSON.parse(tx1str);
            let tx2 = new tx_1.Tx();
            tx2.deserialize(tx2newobj, "hex");
            expect(tx2.toBuffer().toString("hex")).toBe(checkTx);
            let tx3 = txu1.sign(platformvm.keyChain());
            let tx3obj = tx3.serialize("display");
            let tx3str = JSON.stringify(tx3obj);
            let tx4newobj = JSON.parse(tx3str);
            let tx4 = new tx_1.Tx();
            tx4.deserialize(tx4newobj, "display");
            expect(tx4.toBuffer().toString("hex")).toBe(checkTx);
            serialzeit(tx1, "ExportTx");
        }));
        /*
            test('buildAddSubnetValidatorTx', async () => {
              platformvm.setFee(new BN(fee));
              const addrbuff1 = addrs1.map((a) => platformvm.parseAddress(a));
              const addrbuff2 = addrs2.map((a) => platformvm.parseAddress(a));
              const addrbuff3 = addrs3.map((a) => platformvm.parseAddress(a));
              const amount:BN = new BN(90);
        
              const txu1:UnsignedTx = await platformvm.buildAddSubnetValidatorTx(
                set,
                addrs1,
                addrs2,
                nodeID,
                startTime,
                endTime,
                PlatformVMConstants.MINSTAKE,
                new UTF8Payload("hello world"), UnixNow()
              );
        
              const txu2:UnsignedTx = set.buildAddSubnetValidatorTx(
                networkid, bintools.cb58Decode(blockchainid),
                addrbuff1,
                addrbuff2,
                NodeIDStringToBuffer(nodeID),
                startTime,
                endTime,
                PlatformVMConstants.MINSTAKE,
                platformvm.getFee(),
                assetID,
                new UTF8Payload("hello world").getPayload(), UnixNow()
              );
              expect(txu2.toBuffer().toString('hex')).toBe(txu1.toBuffer().toString('hex'));
              expect(txu2.toString()).toBe(txu1.toString());
        
            });
        */
        test('buildAddDelegatorTx 1', () => __awaiter(void 0, void 0, void 0, function* () {
            const addrbuff1 = addrs1.map((a) => platformvm.parseAddress(a));
            const addrbuff2 = addrs2.map((a) => platformvm.parseAddress(a));
            const addrbuff3 = addrs3.map((a) => platformvm.parseAddress(a));
            const amount = constants_1.Defaults.network[networkid]["P"].minDelegationStake;
            const locktime = new bn_js_1.default(54321);
            const threshold = 2;
            platformvm.setMinStake(constants_1.Defaults.network[networkid]["P"].minStake, constants_1.Defaults.network[networkid]["P"].minDelegationStake);
            const txu1 = yield platformvm.buildAddDelegatorTx(set, addrs3, addrs1, addrs2, nodeID, startTime, endTime, amount, addrs3, locktime, threshold, new payload_1.UTF8Payload("hello world"), helperfunctions_1.UnixNow());
            const txu2 = set.buildAddDelegatorTx(networkid, bintools.cb58Decode(blockchainid), assetID, addrbuff3, addrbuff1, addrbuff2, helperfunctions_2.NodeIDStringToBuffer(nodeID), startTime, endTime, amount, locktime, threshold, addrbuff3, new bn_js_1.default(0), assetID, new payload_1.UTF8Payload("hello world").getPayload(), helperfunctions_1.UnixNow());
            expect(txu2.toBuffer().toString('hex')).toBe(txu1.toBuffer().toString('hex'));
            expect(txu2.toString()).toBe(txu1.toString());
            let tx1 = txu1.sign(platformvm.keyChain());
            let checkTx = tx1.toBuffer().toString("hex");
            let tx1obj = tx1.serialize("hex");
            let tx1str = JSON.stringify(tx1obj);
            let tx2newobj = JSON.parse(tx1str);
            let tx2 = new tx_1.Tx();
            tx2.deserialize(tx2newobj, "hex");
            expect(tx2.toBuffer().toString("hex")).toBe(checkTx);
            let tx3 = txu1.sign(platformvm.keyChain());
            let tx3obj = tx3.serialize("display");
            let tx3str = JSON.stringify(tx3obj);
            let tx4newobj = JSON.parse(tx3str);
            let tx4 = new tx_1.Tx();
            tx4.deserialize(tx4newobj, "display");
            expect(tx4.toBuffer().toString("hex")).toBe(checkTx);
            serialzeit(tx1, "AddDelegatorTx");
        }));
        test('buildAddValidatorTx sort StakeableLockOuts 1', () => __awaiter(void 0, void 0, void 0, function* () {
            // two UTXO. The 1st has a lesser stakeablelocktime and a greater amount of DJTX. The 2nd has a greater stakeablelocktime and a lesser amount of DJTX.
            // We expect this test to only consume the 2nd UTXO since it has the greater locktime.
            const addrbuff1 = addrs1.map((a) => platformvm.parseAddress(a));
            const amount1 = new bn_js_1.default('20000000000000000');
            const amount2 = new bn_js_1.default('10000000000000000');
            const locktime1 = new bn_js_1.default(0);
            const threshold = 1;
            const stakeableLockTime1 = new bn_js_1.default(1633824000);
            const secpTransferOutput1 = new outputs_1.SECPTransferOutput(amount1, addrbuff1, locktime1, threshold);
            const parseableOutput1 = new outputs_1.ParseableOutput(secpTransferOutput1);
            const stakeableLockOut1 = new outputs_1.StakeableLockOut(amount1, addrbuff1, locktime1, threshold, stakeableLockTime1, parseableOutput1);
            const stakeableLockTime2 = new bn_js_1.default(1733824000);
            const secpTransferOutput2 = new outputs_1.SECPTransferOutput(amount2, addrbuff1, locktime1, threshold);
            const parseableOutput2 = new outputs_1.ParseableOutput(secpTransferOutput2);
            const stakeableLockOut2 = new outputs_1.StakeableLockOut(amount2, addrbuff1, locktime1, threshold, stakeableLockTime2, parseableOutput2);
            const nodeID = "NodeID-36giFye5epwBTpGqPk7b4CCYe3hfyoFr1";
            const stakeAmount = constants_1.Defaults.network[networkid]["P"].minStake;
            platformvm.setMinStake(stakeAmount, constants_1.Defaults.network[networkid]["P"].minDelegationStake);
            const delegationFeeRate = new bn_js_1.default(2).toNumber();
            const codecID = 0;
            const txid = bintools.cb58Decode('auhMFs24ffc2BRWKw6i7Qngcs8jSQUS9Ei2XwJsUpEq4sTVib');
            const txid2 = bintools.cb58Decode('2JwDfm3C7p88rJQ1Y1xWLkWNMA1nqPzqnaC2Hi4PDNKiPnXgGv');
            const outputidx0 = 0;
            const outputidx1 = 0;
            const assetID = yield platformvm.getDJTXAssetID();
            const assetID2 = yield platformvm.getDJTXAssetID();
            const utxo1 = new utxos_2.UTXO(codecID, txid, outputidx0, assetID, stakeableLockOut1);
            const utxo2 = new utxos_2.UTXO(codecID, txid2, outputidx1, assetID2, stakeableLockOut2);
            const utxoSet = new utxos_1.UTXOSet();
            utxoSet.add(utxo1);
            utxoSet.add(utxo2);
            const txu1 = yield platformvm.buildAddValidatorTx(utxoSet, addrs3, addrs1, addrs2, nodeID, startTime, endTime, stakeAmount, addrs3, delegationFeeRate);
            let tx = txu1.getTransaction();
            let ins = tx.getIns();
            // start test inputs
            // confirm only 1 input
            expect(ins.length).toBe(1);
            let input = ins[0];
            let ai = input.getInput();
            let ao = stakeableLockOut2.getTransferableOutput().getOutput();
            let ao2 = stakeableLockOut1.getTransferableOutput().getOutput();
            // confirm input amount matches the output w/ the greater staekablelock time but lesser amount
            expect(ai.getAmount().toString()).toEqual(ao.getAmount().toString());
            // confirm input amount doesn't match the output w/ the lesser staekablelock time but greater amount
            expect(ai.getAmount().toString()).not.toEqual(ao2.getAmount().toString());
            let sli = input.getInput();
            // confirm input stakeablelock time matches the output w/ the greater stakeablelock time but lesser amount 
            expect(sli.getStakeableLocktime().toString()).toEqual(stakeableLockOut2.getStakeableLocktime().toString());
            // confirm input stakeablelock time doesn't match the output w/ the lesser stakeablelock time but greater amount
            expect(sli.getStakeableLocktime().toString()).not.toEqual(stakeableLockOut1.getStakeableLocktime().toString());
            // stop test inputs
            // start test outputs
            let outs = tx.getOuts();
            // confirm only 1 output
            expect(outs.length).toBe(1);
            let output = outs[0];
            let ao3 = output.getOutput();
            // confirm output amount matches the output w/ the greater stakeablelock time but lesser amount sans the stake amount
            expect(ao3.getAmount().toString()).toEqual(ao.getAmount().sub(stakeAmount).toString());
            // confirm output amount doesn't match the output w/ the lesser stakeablelock time but greater amount
            expect(ao3.getAmount().toString()).not.toEqual(ao2.getAmount().toString());
            let slo = output.getOutput();
            // confirm output stakeablelock time matches the output w/ the greater stakeablelock time but lesser amount 
            expect(slo.getStakeableLocktime().toString()).toEqual(stakeableLockOut2.getStakeableLocktime().toString());
            // confirm output stakeablelock time doesn't match the output w/ the greater stakeablelock time but lesser amount 
            expect(slo.getStakeableLocktime().toString()).not.toEqual(stakeableLockOut1.getStakeableLocktime().toString());
            // confirm tx nodeID matches nodeID
            expect(tx.getNodeIDString()).toEqual(nodeID);
            // confirm tx starttime matches starttime
            expect(tx.getStartTime().toString()).toEqual(startTime.toString());
            // confirm tx endtime matches endtime 
            expect(tx.getEndTime().toString()).toEqual(endTime.toString());
            // confirm tx stake amount matches stakeAmount
            expect(tx.getStakeAmount().toString()).toEqual(stakeAmount.toString());
            let stakeOuts = tx.getStakeOuts();
            // confirm only 1 stakeOut
            expect(stakeOuts.length).toBe(1);
            let stakeOut = stakeOuts[0];
            let slo2 = stakeOut.getOutput();
            // confirm stakeOut stakeablelock time matches the output w/ the greater stakeablelock time but lesser amount 
            expect(slo2.getStakeableLocktime().toString()).toEqual(stakeableLockOut2.getStakeableLocktime().toString());
            // confirm stakeOut stakeablelock time doesn't match the output w/ the greater stakeablelock time but lesser amount 
            expect(slo2.getStakeableLocktime().toString()).not.toEqual(stakeableLockOut1.getStakeableLocktime().toString());
            slo2.getAmount();
            // confirm stakeOut stake amount matches stakeAmount
            expect(slo2.getAmount().toString()).toEqual(stakeAmount.toString());
        }));
        test('buildAddValidatorTx sort StakeableLockOuts 2', () => __awaiter(void 0, void 0, void 0, function* () {
            // two UTXO. The 1st has a lesser stakeablelocktime and a greater amount of DJTX. The 2nd has a greater stakeablelocktime and a lesser amount of DJTX.
            // this time we're staking a greater amount than is available in the 2nd UTXO.
            // We expect this test to consume the full 2nd UTXO and a fraction of the 1st UTXO..
            const addrbuff1 = addrs1.map((a) => platformvm.parseAddress(a));
            const amount1 = new bn_js_1.default('20000000000000000');
            const amount2 = new bn_js_1.default('10000000000000000');
            const locktime1 = new bn_js_1.default(0);
            const threshold = 1;
            const stakeableLockTime1 = new bn_js_1.default(1633824000);
            const secpTransferOutput1 = new outputs_1.SECPTransferOutput(amount1, addrbuff1, locktime1, threshold);
            const parseableOutput1 = new outputs_1.ParseableOutput(secpTransferOutput1);
            const stakeableLockOut1 = new outputs_1.StakeableLockOut(amount1, addrbuff1, locktime1, threshold, stakeableLockTime1, parseableOutput1);
            const stakeableLockTime2 = new bn_js_1.default(1733824000);
            const secpTransferOutput2 = new outputs_1.SECPTransferOutput(amount2, addrbuff1, locktime1, threshold);
            const parseableOutput2 = new outputs_1.ParseableOutput(secpTransferOutput2);
            const stakeableLockOut2 = new outputs_1.StakeableLockOut(amount2, addrbuff1, locktime1, threshold, stakeableLockTime2, parseableOutput2);
            const nodeID = "NodeID-36giFye5epwBTpGqPk7b4CCYe3hfyoFr1";
            const stakeAmount = new bn_js_1.default('10000003000000000');
            platformvm.setMinStake(stakeAmount, constants_1.Defaults.network[networkid]["P"].minDelegationStake);
            const delegationFeeRate = new bn_js_1.default(2).toNumber();
            const codecID = 0;
            const txid = bintools.cb58Decode('auhMFs24ffc2BRWKw6i7Qngcs8jSQUS9Ei2XwJsUpEq4sTVib');
            const txid2 = bintools.cb58Decode('2JwDfm3C7p88rJQ1Y1xWLkWNMA1nqPzqnaC2Hi4PDNKiPnXgGv');
            const outputidx0 = 0;
            const outputidx1 = 0;
            const assetID = yield platformvm.getDJTXAssetID();
            const assetID2 = yield platformvm.getDJTXAssetID();
            const utxo1 = new utxos_2.UTXO(codecID, txid, outputidx0, assetID, stakeableLockOut1);
            const utxo2 = new utxos_2.UTXO(codecID, txid2, outputidx1, assetID2, stakeableLockOut2);
            const utxoSet = new utxos_1.UTXOSet();
            utxoSet.add(utxo1);
            utxoSet.add(utxo2);
            const txu1 = yield platformvm.buildAddValidatorTx(utxoSet, addrs3, addrs1, addrs2, nodeID, startTime, endTime, stakeAmount, addrs3, delegationFeeRate);
            let tx = txu1.getTransaction();
            let ins = tx.getIns();
            // start test inputs
            // confirm only 1 input
            expect(ins.length).toBe(2);
            let input1 = ins[0];
            let input2 = ins[1];
            let ai1 = input1.getInput();
            let ai2 = input2.getInput();
            let ao1 = stakeableLockOut2.getTransferableOutput().getOutput();
            let ao2 = stakeableLockOut1.getTransferableOutput().getOutput();
            // confirm each input amount matches the corresponding output 
            expect(ai2.getAmount().toString()).toEqual(ao1.getAmount().toString());
            expect(ai1.getAmount().toString()).toEqual(ao2.getAmount().toString());
            let sli1 = input1.getInput();
            let sli2 = input2.getInput();
            // confirm input strakeablelock time matches the output w/ the greater staekablelock time but lesser amount 
            expect(sli1.getStakeableLocktime().toString()).toEqual(stakeableLockOut1.getStakeableLocktime().toString());
            expect(sli2.getStakeableLocktime().toString()).toEqual(stakeableLockOut2.getStakeableLocktime().toString());
            // stop test inputs
            // start test outputs
            let outs = tx.getOuts();
            // confirm only 1 output
            expect(outs.length).toBe(1);
            let output = outs[0];
            let ao3 = output.getOutput();
            // confirm output amount matches the output amount sans the 2nd utxo amount and the stake amount
            expect(ao3.getAmount().toString()).toEqual(ao2.getAmount().sub(stakeAmount.sub(ao1.getAmount())).toString());
            let slo = output.getOutput();
            // confirm output stakeablelock time matches the output w/ the lesser stakeablelock since the other was consumed
            expect(slo.getStakeableLocktime().toString()).toEqual(stakeableLockOut1.getStakeableLocktime().toString());
            // confirm output stakeablelock time doesn't match the output w/ the greater stakeablelock time  
            expect(slo.getStakeableLocktime().toString()).not.toEqual(stakeableLockOut2.getStakeableLocktime().toString());
            // confirm tx nodeID matches nodeID
            expect(tx.getNodeIDString()).toEqual(nodeID);
            // confirm tx starttime matches starttime
            expect(tx.getStartTime().toString()).toEqual(startTime.toString());
            // confirm tx endtime matches endtime 
            expect(tx.getEndTime().toString()).toEqual(endTime.toString());
            // confirm tx stake amount matches stakeAmount
            expect(tx.getStakeAmount().toString()).toEqual(stakeAmount.toString());
            let stakeOuts = tx.getStakeOuts();
            // confirm 2 stakeOuts
            expect(stakeOuts.length).toBe(2);
            let stakeOut1 = stakeOuts[0];
            let stakeOut2 = stakeOuts[1];
            let slo2 = stakeOut1.getOutput();
            let slo3 = stakeOut2.getOutput();
            // confirm both stakeOut strakeablelock times matche the corresponding output  
            expect(slo3.getStakeableLocktime().toString()).toEqual(stakeableLockOut1.getStakeableLocktime().toString());
            expect(slo2.getStakeableLocktime().toString()).toEqual(stakeableLockOut2.getStakeableLocktime().toString());
        }));
        test('buildAddValidatorTx sort StakeableLockOuts 3', () => __awaiter(void 0, void 0, void 0, function* () {
            // three UTXO. 
            // The 1st is a SecpTransferableOutput. 
            // The 2nd has a lesser stakeablelocktime and a greater amount of DJTX. 
            // The 3rd has a greater stakeablelocktime and a lesser amount of DJTX.
            // 
            // this time we're staking a greater amount than is available in the 3rd UTXO.
            // We expect this test to consume the full 3rd UTXO and a fraction of the 2nd UTXO and not to consume the SecpTransferableOutput
            const addrbuff1 = addrs1.map((a) => platformvm.parseAddress(a));
            const amount1 = new bn_js_1.default('20000000000000000');
            const amount2 = new bn_js_1.default('10000000000000000');
            const locktime1 = new bn_js_1.default(0);
            const threshold = 1;
            const stakeableLockTime1 = new bn_js_1.default(1633824000);
            const secpTransferOutput0 = new outputs_1.SECPTransferOutput(amount1, addrbuff1, locktime1, threshold);
            const secpTransferOutput1 = new outputs_1.SECPTransferOutput(amount1, addrbuff1, locktime1, threshold);
            const parseableOutput1 = new outputs_1.ParseableOutput(secpTransferOutput1);
            const stakeableLockOut1 = new outputs_1.StakeableLockOut(amount1, addrbuff1, locktime1, threshold, stakeableLockTime1, parseableOutput1);
            const stakeableLockTime2 = new bn_js_1.default(1733824000);
            const secpTransferOutput2 = new outputs_1.SECPTransferOutput(amount2, addrbuff1, locktime1, threshold);
            const parseableOutput2 = new outputs_1.ParseableOutput(secpTransferOutput2);
            const stakeableLockOut2 = new outputs_1.StakeableLockOut(amount2, addrbuff1, locktime1, threshold, stakeableLockTime2, parseableOutput2);
            const nodeID = "NodeID-36giFye5epwBTpGqPk7b4CCYe3hfyoFr1";
            const stakeAmount = new bn_js_1.default('10000003000000000');
            platformvm.setMinStake(stakeAmount, constants_1.Defaults.network[networkid]["P"].minDelegationStake);
            const delegationFeeRate = new bn_js_1.default(2).toNumber();
            const codecID = 0;
            const txid0 = bintools.cb58Decode('auhMFs24ffc2BRWKw6i7Qngcs8jSQUS9Ei2XwJsUpEq4sTVib');
            const txid1 = bintools.cb58Decode('2jhyJit8kWA6SwkRwKxXepFnfhs971CEqaGkjJmiADM8H4g2LR');
            const txid2 = bintools.cb58Decode('2JwDfm3C7p88rJQ1Y1xWLkWNMA1nqPzqnaC2Hi4PDNKiPnXgGv');
            const outputidx0 = 0;
            const outputidx1 = 0;
            const assetID = yield platformvm.getDJTXAssetID();
            const assetID2 = yield platformvm.getDJTXAssetID();
            const utxo0 = new utxos_2.UTXO(codecID, txid0, outputidx0, assetID, secpTransferOutput0);
            const utxo1 = new utxos_2.UTXO(codecID, txid1, outputidx0, assetID, stakeableLockOut1);
            const utxo2 = new utxos_2.UTXO(codecID, txid2, outputidx1, assetID2, stakeableLockOut2);
            const utxoSet = new utxos_1.UTXOSet();
            utxoSet.add(utxo0);
            utxoSet.add(utxo1);
            utxoSet.add(utxo2);
            const txu1 = yield platformvm.buildAddValidatorTx(utxoSet, addrs3, addrs1, addrs2, nodeID, startTime, endTime, stakeAmount, addrs3, delegationFeeRate);
            let tx = txu1.getTransaction();
            let ins = tx.getIns();
            // start test inputs
            // confirm only 1 input
            expect(ins.length).toBe(2);
            let input1 = ins[0];
            let input2 = ins[1];
            let ai1 = input1.getInput();
            let ai2 = input2.getInput();
            let ao1 = stakeableLockOut2.getTransferableOutput().getOutput();
            let ao2 = stakeableLockOut1.getTransferableOutput().getOutput();
            // confirm each input amount matches the corresponding output 
            expect(ai2.getAmount().toString()).toEqual(ao2.getAmount().toString());
            expect(ai1.getAmount().toString()).toEqual(ao1.getAmount().toString());
            let sli1 = input1.getInput();
            let sli2 = input2.getInput();
            // confirm input strakeablelock time matches the output w/ the greater staekablelock time but lesser amount 
            expect(sli1.getStakeableLocktime().toString()).toEqual(stakeableLockOut2.getStakeableLocktime().toString());
            expect(sli2.getStakeableLocktime().toString()).toEqual(stakeableLockOut1.getStakeableLocktime().toString());
            // stop test inputs
            // start test outputs
            let outs = tx.getOuts();
            // confirm only 1 output
            expect(outs.length).toBe(1);
            let output = outs[0];
            let ao3 = output.getOutput();
            // confirm output amount matches the output amount sans the 2nd utxo amount and the stake amount
            expect(ao3.getAmount().toString()).toEqual(ao2.getAmount().sub(stakeAmount.sub(ao1.getAmount())).toString());
            let slo = output.getOutput();
            // confirm output stakeablelock time matches the output w/ the lesser stakeablelock since the other was consumed
            expect(slo.getStakeableLocktime().toString()).toEqual(stakeableLockOut1.getStakeableLocktime().toString());
            // confirm output stakeablelock time doesn't match the output w/ the greater stakeablelock time  
            expect(slo.getStakeableLocktime().toString()).not.toEqual(stakeableLockOut2.getStakeableLocktime().toString());
            // confirm tx nodeID matches nodeID
            expect(tx.getNodeIDString()).toEqual(nodeID);
            // confirm tx starttime matches starttime
            expect(tx.getStartTime().toString()).toEqual(startTime.toString());
            // confirm tx endtime matches endtime 
            expect(tx.getEndTime().toString()).toEqual(endTime.toString());
            // confirm tx stake amount matches stakeAmount
            expect(tx.getStakeAmount().toString()).toEqual(stakeAmount.toString());
            let stakeOuts = tx.getStakeOuts();
            // confirm 2 stakeOuts
            expect(stakeOuts.length).toBe(2);
            let stakeOut1 = stakeOuts[0];
            let stakeOut2 = stakeOuts[1];
            let slo2 = stakeOut1.getOutput();
            let slo3 = stakeOut2.getOutput();
            // confirm both stakeOut strakeablelock times matche the corresponding output  
            expect(slo3.getStakeableLocktime().toString()).toEqual(stakeableLockOut1.getStakeableLocktime().toString());
            expect(slo2.getStakeableLocktime().toString()).toEqual(stakeableLockOut2.getStakeableLocktime().toString());
        }));
        test('buildAddValidatorTx 1', () => __awaiter(void 0, void 0, void 0, function* () {
            const addrbuff1 = addrs1.map((a) => platformvm.parseAddress(a));
            const addrbuff2 = addrs2.map((a) => platformvm.parseAddress(a));
            const addrbuff3 = addrs3.map((a) => platformvm.parseAddress(a));
            const amount = constants_1.Defaults.network[networkid]["P"].minStake.add(new bn_js_1.default(fee));
            const locktime = new bn_js_1.default(54321);
            const threshold = 2;
            platformvm.setMinStake(constants_1.Defaults.network[networkid]["P"].minStake, constants_1.Defaults.network[networkid]["P"].minDelegationStake);
            const txu1 = yield platformvm.buildAddValidatorTx(set, addrs3, addrs1, addrs2, nodeID, startTime, endTime, amount, addrs3, 0.1334556, locktime, threshold, new payload_1.UTF8Payload("hello world"), helperfunctions_1.UnixNow());
            const txu2 = set.buildAddValidatorTx(networkid, bintools.cb58Decode(blockchainid), assetID, addrbuff3, addrbuff1, addrbuff2, helperfunctions_2.NodeIDStringToBuffer(nodeID), startTime, endTime, amount, locktime, threshold, addrbuff3, 0.1335, new bn_js_1.default(0), assetID, new payload_1.UTF8Payload("hello world").getPayload(), helperfunctions_1.UnixNow());
            expect(txu2.toBuffer().toString('hex')).toBe(txu1.toBuffer().toString('hex'));
            expect(txu2.toString()).toBe(txu1.toString());
            let tx1 = txu1.sign(platformvm.keyChain());
            let checkTx = tx1.toBuffer().toString("hex");
            let tx1obj = tx1.serialize("hex");
            let tx1str = JSON.stringify(tx1obj);
            let tx2newobj = JSON.parse(tx1str);
            let tx2 = new tx_1.Tx();
            tx2.deserialize(tx2newobj, "hex");
            expect(tx2.toBuffer().toString("hex")).toBe(checkTx);
            let tx3 = txu1.sign(platformvm.keyChain());
            let tx3obj = tx3.serialize("display");
            let tx3str = JSON.stringify(tx3obj);
            let tx4newobj = JSON.parse(tx3str);
            let tx4 = new tx_1.Tx();
            tx4.deserialize(tx4newobj, "display");
            expect(tx4.toBuffer().toString("hex")).toBe(checkTx);
            serialzeit(tx1, "AddValidatorTx");
        }));
        test('buildAddDelegatorTx 2', () => __awaiter(void 0, void 0, void 0, function* () {
            const addrbuff1 = addrs1.map((a) => platformvm.parseAddress(a));
            const addrbuff2 = addrs2.map((a) => platformvm.parseAddress(a));
            const addrbuff3 = addrs3.map((a) => platformvm.parseAddress(a));
            const amount = constants_1.Defaults.network[networkid]["P"].minDelegationStake;
            const locktime = new bn_js_1.default(54321);
            const threshold = 2;
            platformvm.setMinStake(constants_1.Defaults.network[networkid]["P"].minStake, constants_1.Defaults.network[networkid]["P"].minDelegationStake);
            const txu1 = yield platformvm.buildAddDelegatorTx(lset, addrs3, addrs1, addrs2, nodeID, startTime, endTime, amount, addrs3, locktime, threshold, new payload_1.UTF8Payload("hello world"), helperfunctions_1.UnixNow());
            const txu2 = lset.buildAddDelegatorTx(networkid, bintools.cb58Decode(blockchainid), assetID, addrbuff3, addrbuff1, addrbuff2, helperfunctions_2.NodeIDStringToBuffer(nodeID), startTime, endTime, amount, locktime, threshold, addrbuff3, new bn_js_1.default(0), assetID, new payload_1.UTF8Payload("hello world").getPayload(), helperfunctions_1.UnixNow());
            expect(txu2.toBuffer().toString('hex')).toBe(txu1.toBuffer().toString('hex'));
            expect(txu2.toString()).toBe(txu1.toString());
            let tx1 = txu1.sign(platformvm.keyChain());
            let checkTx = tx1.toBuffer().toString("hex");
            let tx1obj = tx1.serialize("hex");
            let tx1str = JSON.stringify(tx1obj);
            let tx2newobj = JSON.parse(tx1str);
            let tx2 = new tx_1.Tx();
            tx2.deserialize(tx2newobj, "hex");
            expect(tx2.toBuffer().toString("hex")).toBe(checkTx);
            let tx3 = txu1.sign(platformvm.keyChain());
            let tx3obj = tx3.serialize("display");
            let tx3str = JSON.stringify(tx3obj);
            let tx4newobj = JSON.parse(tx3str);
            let tx4 = new tx_1.Tx();
            tx4.deserialize(tx4newobj, "display");
            expect(tx4.toBuffer().toString("hex")).toBe(checkTx);
            serialzeit(tx1, "AddDelegatorTx");
        }));
        test('buildAddValidatorTx 2', () => __awaiter(void 0, void 0, void 0, function* () {
            const addrbuff1 = addrs1.map((a) => platformvm.parseAddress(a));
            const addrbuff2 = addrs2.map((a) => platformvm.parseAddress(a));
            const addrbuff3 = addrs3.map((a) => platformvm.parseAddress(a));
            const amount = constants_2.ONEDJTX.mul(new bn_js_1.default(25));
            const locktime = new bn_js_1.default(54321);
            const threshold = 2;
            platformvm.setMinStake(constants_2.ONEDJTX.mul(new bn_js_1.default(25)), constants_2.ONEDJTX.mul(new bn_js_1.default(25)));
            const txu1 = yield platformvm.buildAddValidatorTx(lset, addrs3, addrs1, addrs2, nodeID, startTime, endTime, amount, addrs3, 0.1334556, locktime, threshold, new payload_1.UTF8Payload("hello world"), helperfunctions_1.UnixNow());
            const txu2 = lset.buildAddValidatorTx(networkid, bintools.cb58Decode(blockchainid), assetID, addrbuff3, addrbuff1, addrbuff2, helperfunctions_2.NodeIDStringToBuffer(nodeID), startTime, endTime, amount, locktime, threshold, addrbuff3, 0.1335, new bn_js_1.default(0), assetID, new payload_1.UTF8Payload("hello world").getPayload(), helperfunctions_1.UnixNow());
            expect(txu2.toBuffer().toString('hex')).toBe(txu1.toBuffer().toString('hex'));
            expect(txu2.toString()).toBe(txu1.toString());
            let tx1 = txu1.sign(platformvm.keyChain());
            let checkTx = tx1.toBuffer().toString("hex");
            let tx1obj = tx1.serialize("hex");
            let tx1str = JSON.stringify(tx1obj);
            let tx2newobj = JSON.parse(tx1str);
            let tx2 = new tx_1.Tx();
            tx2.deserialize(tx2newobj, "hex");
            expect(tx2.toBuffer().toString("hex")).toBe(checkTx);
            let tx3 = txu1.sign(platformvm.keyChain());
            let tx3obj = tx3.serialize("display");
            let tx3str = JSON.stringify(tx3obj);
            let tx4newobj = JSON.parse(tx3str);
            let tx4 = new tx_1.Tx();
            tx4.deserialize(tx4newobj, "display");
            expect(tx4.toBuffer().toString("hex")).toBe(checkTx);
            serialzeit(tx1, "AddValidatorTx");
        }));
        test('buildAddValidatorTx 3', () => __awaiter(void 0, void 0, void 0, function* () {
            const addrbuff1 = addrs1.map((a) => platformvm.parseAddress(a));
            const addrbuff2 = addrs2.map((a) => platformvm.parseAddress(a));
            const addrbuff3 = addrs3.map((a) => platformvm.parseAddress(a));
            const amount = constants_2.ONEDJTX.mul(new bn_js_1.default(3));
            const locktime = new bn_js_1.default(54321);
            const threshold = 2;
            platformvm.setMinStake(constants_2.ONEDJTX.mul(new bn_js_1.default(3)), constants_2.ONEDJTX.mul(new bn_js_1.default(3)));
            //2 utxos; one lockedstakeable; other unlocked; both utxos have 2 djtx; stake 3 DJTX
            let dummySet = new utxos_1.UTXOSet();
            let lockedBaseOut = new outputs_1.SECPTransferOutput(constants_2.ONEDJTX.mul(new bn_js_1.default(2)), addrbuff1, locktime, 1);
            let lockedBaseXOut = new outputs_1.ParseableOutput(lockedBaseOut);
            let lockedOut = new outputs_1.StakeableLockOut(constants_2.ONEDJTX.mul(new bn_js_1.default(2)), addrbuff1, locktime, 1, locktime, lockedBaseXOut);
            let txidLocked = buffer_1.Buffer.alloc(32);
            txidLocked.fill(1);
            let txidxLocked = buffer_1.Buffer.alloc(4);
            txidxLocked.writeUInt32BE(1, 0);
            const lu = new utxos_2.UTXO(0, txidLocked, txidxLocked, assetID, lockedOut);
            let txidUnlocked = buffer_1.Buffer.alloc(32);
            txidUnlocked.fill(2);
            let txidxUnlocked = buffer_1.Buffer.alloc(4);
            txidxUnlocked.writeUInt32BE(2, 0);
            let unlockedOut = new outputs_1.SECPTransferOutput(constants_2.ONEDJTX.mul(new bn_js_1.default(2)), addrbuff1, locktime, 1);
            const ulu = new utxos_2.UTXO(0, txidUnlocked, txidxUnlocked, assetID, unlockedOut);
            dummySet.add(ulu);
            dummySet.add(lu);
            const txu1 = yield platformvm.buildAddValidatorTx(dummySet, addrs3, addrs1, addrs2, nodeID, startTime, endTime, amount, addrs3, 0.1334556, locktime, threshold, new payload_1.UTF8Payload("hello world"), helperfunctions_1.UnixNow());
            let txu1Ins = txu1.getTransaction().getIns();
            let txu1Outs = txu1.getTransaction().getOuts();
            let txu1Stake = txu1.getTransaction().getStakeOuts();
            let txu1Total = txu1.getTransaction().getTotalOuts();
            let intotal = new bn_js_1.default(0);
            for (let i = 0; i < txu1Ins.length; i++) {
                intotal = intotal.add(txu1Ins[i].getInput().getAmount());
            }
            let outtotal = new bn_js_1.default(0);
            for (let i = 0; i < txu1Outs.length; i++) {
                outtotal = outtotal.add(txu1Outs[i].getOutput().getAmount());
            }
            let staketotal = new bn_js_1.default(0);
            for (let i = 0; i < txu1Stake.length; i++) {
                staketotal = staketotal.add(txu1Stake[i].getOutput().getAmount());
            }
            let totaltotal = new bn_js_1.default(0);
            for (let i = 0; i < txu1Total.length; i++) {
                totaltotal = totaltotal.add(txu1Total[i].getOutput().getAmount());
            }
            expect(intotal.toString(10)).toBe("4000000000");
            expect(outtotal.toString(10)).toBe("1000000000");
            expect(staketotal.toString(10)).toBe("3000000000");
            expect(totaltotal.toString(10)).toBe("4000000000");
        }));
        test('buildCreateSubnetTx1', () => __awaiter(void 0, void 0, void 0, function* () {
            platformvm.setCreationTxFee(new bn_js_1.default(10));
            const addrbuff1 = addrs1.map((a) => platformvm.parseAddress(a));
            const addrbuff2 = addrs2.map((a) => platformvm.parseAddress(a));
            const addrbuff3 = addrs3.map((a) => platformvm.parseAddress(a));
            const txu1 = yield platformvm.buildCreateSubnetTx(set, addrs1, addrs2, addrs3, 1, new payload_1.UTF8Payload("hello world"), helperfunctions_1.UnixNow());
            const txu2 = set.buildCreateSubnetTx(networkid, bintools.cb58Decode(blockchainid), addrbuff1, addrbuff2, addrbuff3, 1, platformvm.getCreationTxFee(), assetID, new payload_1.UTF8Payload("hello world").getPayload(), helperfunctions_1.UnixNow());
            expect(txu2.toBuffer().toString('hex')).toBe(txu1.toBuffer().toString('hex'));
            expect(txu2.toString()).toBe(txu1.toString());
            let tx1 = txu1.sign(platformvm.keyChain());
            let checkTx = tx1.toBuffer().toString("hex");
            let tx1obj = tx1.serialize("hex");
            let tx1str = JSON.stringify(tx1obj);
            let tx2newobj = JSON.parse(tx1str);
            let tx2 = new tx_1.Tx();
            tx2.deserialize(tx2newobj, "hex");
            expect(tx2.toBuffer().toString("hex")).toBe(checkTx);
            let tx3 = txu1.sign(platformvm.keyChain());
            let tx3obj = tx3.serialize("display");
            let tx3str = JSON.stringify(tx3obj);
            let tx4newobj = JSON.parse(tx3str);
            let tx4 = new tx_1.Tx();
            tx4.deserialize(tx4newobj, "display");
            expect(tx4.toBuffer().toString("hex")).toBe(checkTx);
            serialzeit(tx1, "CreateSubnetTx");
        }));
        test('buildCreateSubnetTx 2', () => __awaiter(void 0, void 0, void 0, function* () {
            platformvm.setCreationTxFee(new bn_js_1.default(10));
            const addrbuff1 = addrs1.map((a) => platformvm.parseAddress(a));
            const addrbuff2 = addrs2.map((a) => platformvm.parseAddress(a));
            const addrbuff3 = addrs3.map((a) => platformvm.parseAddress(a));
            const txu1 = yield platformvm.buildCreateSubnetTx(lset, addrs1, addrs2, addrs3, 1, new payload_1.UTF8Payload("hello world"), helperfunctions_1.UnixNow());
            const txu2 = lset.buildCreateSubnetTx(networkid, bintools.cb58Decode(blockchainid), addrbuff1, addrbuff2, addrbuff3, 1, platformvm.getCreationTxFee(), assetID, new payload_1.UTF8Payload("hello world").getPayload(), helperfunctions_1.UnixNow());
            expect(txu2.toBuffer().toString('hex')).toBe(txu1.toBuffer().toString('hex'));
            expect(txu2.toString()).toBe(txu1.toString());
        }));
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBpLnRlc3QuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi90ZXN0cy9hcGlzL3BsYXRmb3Jtdm0vYXBpLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsc0VBQXdDO0FBQ3hDLDZCQUFnQztBQUNoQyxpREFBd0Q7QUFDeEQsb0NBQWlDO0FBQ2pDLGtEQUF1QjtBQUN2QixrRUFBMEM7QUFDMUMsK0NBQWlDO0FBQ2pDLG1EQUFnRTtBQUNoRSxxREFBb0Q7QUFDcEQscUVBQWtFO0FBQ2xFLDJEQUF3RDtBQUN4RCx5REFBc0k7QUFDdEksdURBQWdIO0FBQ2hILHFEQUFpRDtBQUNqRCw4REFBcUM7QUFDckMsK0NBQXdEO0FBQ3hELCtEQUFvRDtBQUNwRCwrQ0FBZ0Q7QUFDaEQsK0RBQWlFO0FBQ2pFLG1EQUE4QztBQUM5QywyREFBc0U7QUFHdEU7O0dBRUc7QUFDSCxNQUFNLFFBQVEsR0FBRyxrQkFBUSxDQUFDLFdBQVcsRUFBRSxDQUFDO0FBQ3hDLE1BQU0sVUFBVSxHQUFHLDZCQUFhLENBQUMsV0FBVyxFQUFFLENBQUM7QUFFL0MsTUFBTSxpQkFBaUIsR0FBVyxLQUFLLENBQUM7QUFFeEMsU0FBUyxVQUFVLENBQUMsTUFBbUIsRUFBRSxJQUFXO0lBQ2xELElBQUcsaUJBQWlCLEVBQUM7UUFDbkIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLFVBQVUsQ0FBQyxTQUFTLENBQUMsTUFBTSxFQUFFLFlBQVksRUFBRSxLQUFLLEVBQUUsSUFBSSxHQUFHLGlCQUFpQixDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ3pHLE9BQU8sQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxVQUFVLENBQUMsU0FBUyxDQUFDLE1BQU0sRUFBRSxZQUFZLEVBQUUsU0FBUyxFQUFFLElBQUksR0FBRyxvQkFBb0IsQ0FBQyxDQUFDLENBQUMsQ0FB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QUMsUUFBUSxFQUFFLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztZQUM5RSxNQUFNLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDO1lBRTlDLElBQUksR0FBRyxHQUFNLElBQUksQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUM7WUFDOUMsSUFBSSxPQUFPLEdBQVUsR0FBRyxDQUFDLFFBQVEsRUFBRSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUNwRCxJQUFJLE1BQU0sR0FBVSxHQUFHLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQ3pDLElBQUksTUFBTSxHQUFVLElBQUksQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLENBQUM7WUFFM0MsSUFBSSxTQUFTLEdBQVUsSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUMxQyxJQUFJLEdBQUcsR0FBTSxJQUFJLE9BQUUsRUFBRSxDQUFDO1lBQ3RCLEdBQUcsQ0FBQyxXQUFXLENBQUMsU0FBUyxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBRWxDLE1BQU0sQ0FBQyxHQUFHLENBQUMsUUFBUSxFQUFFLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBRXJELElBQUksR0FBRyxHQUFNLElBQUksQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUM7WUFDOUMsSUFBSSxNQUFNLEdBQVUsR0FBRyxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsQ0FBQztZQUM3QyxJQUFJLE1BQU0sR0FBVSxJQUFJLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBRTNDLElBQUksU0FBUyxHQUFV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LElBQUksQ0FBQyxVQUFVLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQztZQUM5QyxJQUFJLE9BQU8sR0FBVSxHQUFHLENBQUMsUUFBUSxFQUFFLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQ3BELElBQUksTUFBTSxHQUFVLEdBQUcsQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDekMsSUFBSSxNQUFNLEdBQVUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUUzQyxJQUFJLFNBQVMsR0FBVSxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQzFDLElBQUksR0FBRyxHQUFNLElBQUksT0FBRSxFQUFFLENBQUM7WUFDdEIsR0FBRyxDQUFDLFdBQVcsQ0FBQyxTQUFTLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFFbEMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7WUFFckQsSUFBSSxHQUFHLEdBQU0sSUFBSSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQztZQUM5QyxJQUFJLE1BQU0sR0FBVSxHQUFHLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxDQUFDO1lBQzdDLElBQUksTUFBTSxHQUFVLElBQUksQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLENBQUM7WUFFM0MsSUFBSSxTQUFTLEdBQVUsSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUMxQyxJQUFJLEdBQUcsR0FBTSxJQUFJLE9BQUUsRUFBRSxDQUFDO1lBQ3RCLEdBQUcsQ0FBQyxXQUFXLENBQUMsU0FBUyxFQUFFLFNBQVMsQ0FBQyxDQUFDO1lBRXRDLE1BQU0sQ0FBQyxHQUFHLENBQUMsUUFBUSxFQUFFLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBRXJE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Q0FBQztZQUVsQyxNQUFNLENBQUMsR0FBRyxDQUFDLFFBQVEsRUFBRSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUVyRCxJQUFJLEdBQUcsR0FBTSxJQUFJLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDO1lBQzlDLElBQUksTUFBTSxHQUFVLEdBQUcsQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLENBQUM7WUFDN0MsSUFBSSxNQUFNLEdBQVUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUUzQyxJQUFJLFNBQVMsR0FBVSxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQzFDLElBQUksR0FBRyxHQUFNLElBQUksT0FBRSxFQUFFLENBQUM7WUFDdEIsR0FBRyxDQUFDLFdBQVcsQ0FBQyxTQUFTLEVBQUUsU0FBUyxDQUFDLENBQUM7WUFFdEMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7WUFFckQsVUFBVSxDQUFDLEdBQUcsRUFBRSxnQkFBZ0IsQ0FBQyxDQUFDO1FBRXBDLENBQUMsQ0FBQSxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsdUJBQXVCLEVBQUUsR0FBUyxFQUFFO1lBQ3ZDLE1BQU0sU0FBUyxHQUFHLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLFVBQVUsQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNoRSxNQUFNLFNBQVMsR0FBRyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxVQUFVLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDaEUsTUFBTSxTQUFTLEdBQUcsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFB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LFVBQVUsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDO1lBQzlDLElBQUksT0FBTyxHQUFVLEdBQUcsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDcEQsSUFBSSxNQUFNLEdBQVUsR0FBRyxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUN6QyxJQUFJLE1BQU0sR0FBVSxJQUFJLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBRTNDLElBQUksU0FBUyxHQUFVLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDMUMsSUFBSSxHQUFHLEdBQU0sSUFBSSxPQUFFLEVBQUUsQ0FBQztZQUN0QixHQUFHLENBQUMsV0FBVyxDQUFDLFNBQVMsRUFBRSxLQUFLLENBQUMsQ0FBQztZQUVsQyxNQUFNLENBQUMsR0FBRyxDQUFDLFFBQVEsRUFBRSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUVyRCxJQUFJLEdBQUcsR0FBTSxJQUFJLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDO1lBQzlDLElBQUksTUFBTSxHQUFVLEdBQUcsQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLENBQUM7WUFDN0MsSUFBSSxNQUFNLEdBQVUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUUzQyxJQUFJLFNBQVMsR0FBVSxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQzFDLElBQUksR0FBRyxHQUFNLElBQUksT0FBRSxFQUFFLENBQUM7WUFDdEIsR0FBRyxDQUFDLFdBQVcsQ0FBQyxTQUFTLEVBQUUsU0FBUyxDQUFDLENBQUM7WUFFdEMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7WUFFckQsVUFBVSxDQUFD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QUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7WUFDOUUsTUFBTSxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQztZQUU5QyxJQUFJLEdBQUcsR0FBTSxJQUFJLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDO1lBQzlDLElBQUksT0FBTyxHQUFVLEdBQUcsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDcEQsSUFBSSxNQUFNLEdBQVUsR0FBRyxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUN6QyxJQUFJLE1BQU0sR0FBVSxJQUFJLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBRTNDLElBQUksU0FBUyxHQUFVLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDMUMsSUFBSSxHQUFHLEdBQU0sSUFBSSxPQUFFLEVBQUUsQ0FBQztZQUN0QixHQUFHLENBQUMsV0FBVyxDQUFDLFNBQVMsRUFBRSxLQUFLLENBQUMsQ0FBQztZQUVsQyxNQUFNLENBQUMsR0FBRyxDQUFDLFFBQVEsRUFBRSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUVyRCxJQUFJLEdBQUcsR0FBTSxJQUFJLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDO1lBQzlDLElBQUksTUFBTSxHQUFVLEdBQUcsQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLENBQUM7WUFDN0MsSUFBSSxNQUFNLEdBQVUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUUzQyxJQUFJLFNBQVMsR0FBVSxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQzFDLElBQUksR0FBRyxHQUFNLElBQUksT0FBRSxFQUFFLENBQUM7WUFDdEIsR0FBRyxDQUFDLFdBQVcsQ0FBQyxTQUFTLEVBQUUsU0FBUyxDQUFDLENBQUM7WUFFdEMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7WUFFckQsVUFBVSxDQUFDLEdBQUcsRUFBRSxnQkFBZ0IsQ0FBQyxDQUFDO1FBRXBDLENBQUMsQ0FBQSxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsdUJBQXVCLEVBQUUsR0FBUyxFQUFFO1lBQ3ZDLFVBQVUsQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLGVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ3hDLE1BQU0sU0FBUyxHQUFHLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLFVBQVUsQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNoRSxNQUFNLFNBQVMsR0FBRyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxVQUFVLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDaEUsTUFBTSxTQUFTLEdBQUcsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsVUFBVSxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBRWhFLE1BQU0sSUFBSSxHQUFjLE1BQU0sVUFBVSxDQUFDLG1CQUFtQixDQUMxRCxJQUFJLEVBQ0osTUFBTSxFQUNOLE1BQU0sRUFDTixNQUFNLEVBQ04sQ0FBQyxFQUNELElBQUkscUJBQVcsQ0FBQyxhQUFhLENBQUMsRUFBRSx5QkFBTyxFQUFFLENBQzFDLENBQUM7WUFFRixNQUFNLElBQUksR0FBYyxJQUFJLENBQUMsbUJBQW1CLENBQzlDLFNBQVMsRUFBRSxRQUFRLENBQUMsVUFBVSxDQUFDLFlBQVksQ0FBQyxFQUM1QyxTQUFTLEVBQ1QsU0FBUyxFQUNULFNBQVMsRUFDVCxDQUFDLEVBQ0QsVUFBVSxDQUFDLGdCQUFnQixFQUFFLEVBQzdCLE9BQU8sRUFDUCxJQUFJLHFCQUFXLENBQUMsYUFBYSxDQUFDLENBQUMsVUFBVSxFQUFFLEVBQUUseUJBQU8sRUFBRSxDQUN2RCxDQUFDO1lBQ0YsTUFBTSxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO1lBQzlFLE1BQU0sQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUM7UUFFaEQsQ0FBQyxDQUFBLENBQUMsQ0FBQztJQUdMLENBQUMsQ0FBQyxDQUFDO0FBQ0wsQ0FBQyxDQUFDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgbW9ja0F4aW9zIGZyb20gJ2plc3QtbW9jay1heGlvcyc7XG5pbXBvcnQgeyBBdmFsYW5jaGUgfSBmcm9tICdzcmMnO1xuaW1wb3J0IHsgUGxhdGZvcm1WTUFQSSB9IGZyb20gJ3NyYy9hcGlzL3BsYXRmb3Jtdm0vYXBpJztcbmltcG9ydCB7IEJ1ZmZlciB9IGZyb20gJ2J1ZmZlci8nO1xuaW1wb3J0IEJOIGZyb20gJ2JuLmpzJztcbmltcG9ydCBCaW5Ub29scyBmcm9tICdzcmMvdXRpbHMvYmludG9vbHMnO1xuaW1wb3J0ICogYXMgYmVjaDMyIGZyb20gJ2JlY2gzMic7XG5pbXBvcnQgeyBEZWZhdWx0cywgUGxhdGZvcm1DaGFpbklEIH0gZnJvbSAnc3JjL3V0aWxzL2NvbnN0YW50cyc7XG5pbXBvcnQgeyBVVFhPU2V0IH0gZnJvbSAnc3JjL2FwaXMvcGxhdGZvcm12bS91dHhvcyc7XG5pbXBvcnQgeyBQZXJzaXN0YW5jZU9wdGlvbnMgfSBmcm9tICdzcmMvdXRpbHMvcGVyc2lzdGVuY2VvcHRpb25zJztcbmltcG9ydCB7IEtleUNoYWluIH0gZnJvbSAnc3JjL2FwaXMvcGxhdGZvcm12bS9rZXljaGFpbic7XG5pbXBvcnQgeyBTRUNQVHJhbnNmZXJPdXRwdXQsIFRyYW5zZmVyYWJsZU91dHB1dCwgQW1vdW50T3V0cHV0LCBQYXJzZWFibGVPdXRwdXQsIFN0YWtlYWJsZUxvY2tPdXQgfSBmcm9tICdzcmMvYXBpcy9wbGF0Zm9ybXZtL291dHB1dHMnO1xuaW1wb3J0IHsgVHJhbnNmZXJhYmxlSW5wdXQsIFNFQ1BUcmFuc2ZlcklucHV0LCBBbW91bnRJbnB1dCwgU3Rha2VhYmxlTG9ja0luIH0gZnJvbSAnc3JjL2FwaXMvcGxhdGZvcm12bS9pbnB1dHMnO1xuaW1wb3J0IHsgVVRYTyB9IGZyb20gJ3NyYy9hcGlzL3BsYXRmb3Jtdm0vdXR4b3MnO1xuaW1wb3J0IGNyZWF0ZUhhc2ggZnJvbSAnY3JlYXRlLWhhc2gnO1xuaW1wb3J0IHsgVW5zaWduZWRUeCwgVHggfSBmcm9tICdzcmMvYXBpcy9wbGF0Zm9ybXZtL3R4JztcbmltcG9ydCB7IFVuaXhOb3cgfSBmcm9tICdzcmMvdXRpbHMvaGVscGVyZnVuY3Rpb25zJztcbmltcG9ydCB7IFVURjhQYXlsb2FkIH0gZnJvbSAnc3JjL3V0aWxzL3BheWxvYWQnO1xuaW1wb3J0IHsgTm9kZUlEU3RyaW5nVG9CdWZmZXIgfSBmcm9tICdzcmMvdXRpbHMvaGVscGVyZnVuY3Rpb25zJztcbmltcG9ydCB7IE9ORUFWQVggfSBmcm9tICdzcmMvdXRpbHMvY29uc3RhbnRzJztcbmltcG9ydCB7IFNlcmlhbGl6YWJsZSwgU2VyaWFsaXphdGlvbiB9IGZyb20gJ3NyYy91dGlscy9zZXJpYWxpemF0aW9uJztcbmltcG9ydCB7IEFkZFZhbGlkYXRvclR4IH0gZnJvbSAnc3JjL2FwaXMvcGxhdGZvcm12bS92YWxpZGF0aW9udHgnO1xuXG4vKipcbiAqIEBpZ25vcmVcbiAqL1xuY29uc3QgYmludG9vbHMgPSBCaW5Ub29scy5nZXRJbnN0YW5jZSgpO1xuY29uc3Qgc2VyaWFsaXplciA9IFNlcmlhbGl6YXRpb24uZ2V0SW5zdGFuY2UoKTtcblxuY29uc3QgZHVtcFNlcmlhbGl6YXRpb246Ym9vbGVhbiA9IGZhbHNlO1xuXG5mdW5jdGlvbiBzZXJpYWx6ZWl0KGFUaGluZzpTZXJpYWxpemFibGUsIG5hbWU6c3RyaW5nKXtcbiAgaWYoZHVtcFNlcmlhbGl6YXRpb24pe1xuICAgIGNvbnNvbGUubG9nKEpTT04uc3RyaW5naWZ5KHNlcmlhbGl6ZXIuc2VyaWFsaXplKGFUaGluZywgXCJwbGF0Zm9ybXZtXCIsIFwiaGV4XCIsIG5hbWUgKyBcIiAtLSBIZXggRW5jb2RlZFwiKSkpO1xuICAgIGNvbnNvbGUubG9nKEpTT04uc3RyaW5naWZ5KHNlcmlhbGl6ZXIuc2VyaWFsaXplKGFUaGluZywgXCJwbGF0Zm9ybXZtXCIsIFwiZGlzcGxheVwiLCBuYW1lICsgXCIgLS0gSHVtYW4tUmVhZGFibGVcIikpKTtcbiAgfVxufVxuXG5kZXNjcmliZSgnUGxhdGZvcm1WTUFQSScsICgpID0+IHtcbiAgY29uc3QgbmV0d29ya2lkOm51bWJlciA9IDEyMzQ1O1xuICBjb25zdCBibG9ja2NoYWluaWQ6c3RyaW5nID0gUGxhdGZvcm1DaGFpbklEO1xuICBjb25zdCBpcDpzdHJpbmcgPSAnMTI3LjAuMC4xJztcbiAgY29uc3QgcG9ydDpudW1iZXIgPSA5NjUwO1xuICBjb25zdCBwcm90b2NvbDpzdHJpbmcgPSAnaHR0cHMnO1xuXG4gIGNvbnN0IG5vZGVJRDpzdHJpbmcgPSBcIk5vZGVJRC1CNkQ0djFWdFBZTGJpVXZZWHRXNFB4OG9FOWltQzJ2R1dcIjtcbiAgY29uc3Qgc3RhcnRUaW1lOkJOID0gVW5peE5vdygpLmFkZChuZXcgQk4oNjAgKiA1KSk7XG4gIGNvbnN0IGVuZFRpbWU6Qk4gPSBzdGFydFRpbWUuYWRkKG5ldyBCTigxMjA5NjAwKSk7XG5cbiAgY29uc3QgdXNlcm5hbWU6c3RyaW5nID0gJ0F2YUxhYnMnO1xuICBjb25zdCBwYXNzd29yZDpzdHJpbmcgPSAncGFzc3dvcmQnO1xuXG4gIGNvbnN0IGF2YWxhbmNoZTpBdmFsYW5jaGUgPSBuZXcgQXZhbGFuY2hlKGlwLCBwb3J0LCBwcm90b2NvbCwgbmV0d29ya2lkLCB1bmRlZmluZWQsIHVuZGVmaW5lZCwgdW5kZWZpbmVkLCB0cnVlKTtcbiAgbGV0IGFwaTpQbGF0Zm9ybVZNQVBJO1xuICBsZXQgYWxpYXM6c3RyaW5nO1xuXG4gIGNvbnN0IGFkZHJBOnN0cmluZyA9ICdQLScgKyBiZWNoMzIuZW5jb2RlKGF2YWxhbmNoZS5nZXRIUlAoKSwgYmVjaDMyLnRvV29yZHMoYmludG9vbHMuY2I1OERlY29kZShcIkI2RDR2MVZ0UFlMYmlVdllYdFc0UHg4b0U5aW1DMnZHV1wiKSkpO1xuICBjb25zdCBhZGRyQjpzdHJpbmcgPSAnUC0nICsgYmVjaDMyLmVuY29kZShhdmFsYW5jaGUuZ2V0SFJQKCksIGJlY2gzMi50b1dvcmRzKGJpbnRvb2xzLmNiNThEZWNvZGUoXCJQNXdkUnVaZWFEdDI4ZUhNUDVTM3c5WmRvQmZvN3d1ekZcIikpKTtcbiAgY29uc3QgYWRkckM6c3RyaW5nID0gJ1AtJyArIGJlY2gzMi5lbmNvZGUoYXZhbGFuY2hlLmdldEhSUCgpLCBiZWNoMzIudG9Xb3JkcyhiaW50b29scy5jYjU4RGVjb2RlKFwiNlkza3lzakY5am5IbllrZFM5eUdBdW9IeWFlMmVObWVWXCIpKSk7XG5cbiAgYmVmb3JlQWxsKCgpID0+IHtcbiAgICBhcGkgPSBuZXcgUGxhdGZvcm1WTUFQSShhdmFsYW5jaGUsICcvZXh0L2JjL1AnKTtcbiAgICBhbGlhcyA9IGFwaS5nZXRCbG9ja2NoYWluQWxpYXMoKTtcbiAgfSk7XG5cbiAgYWZ0ZXJFYWNoKCgpID0+IHtcbiAgICBtb2NrQXhpb3MucmVzZXQoKTtcbiAgfSk7XG5cbiAgdGVzdCgncmVmcmVzaEJsb2NrY2hhaW5JRCcsIGFzeW5jICgpID0+IHtcbiAgICBsZXQgbjNiY0lEOnN0cmluZyA9IERlZmF1bHRzLm5ldHdvcmtbM10uUFtcImJsb2NrY2hhaW5JRFwiXTtcbiAgICBsZXQgdGVzdEFQSTpQbGF0Zm9ybVZNQVBJID0gbmV3IFBsYXRmb3JtVk1BUEkoYXZhbGFuY2hlLCAnL2V4dC9iYy9QJyk7XG4gICAgbGV0IGJjMTpzdHJpbmcgPSB0ZXN0QVBJLmdldEJsb2NrY2hhaW5JRCgpO1xuICAgIGV4cGVjdChiYzEpLnRvQmUoUGxhdGZvcm1DaGFpbklEKTtcblxuICAgIHRlc3RBUEkucmVmcmVzaEJsb2NrY2hhaW5JRCgpO1xuICAgIGxldCBiYzI6c3RyaW5nID0gdGVzdEFQSS5nZXRCbG9ja2NoYWluSUQoKTtcbiAgICBleHBlY3QoYmMyKS50b0JlKFBsYXRmb3JtQ2hhaW5JRCk7XG5cbiAgICB0ZXN0QVBJLnJlZnJlc2hCbG9ja2NoYWluSUQobjNiY0lEKTtcbiAgICBsZXQgYmMzOnN0cmluZyA9IHRlc3RBUEkuZ2V0QmxvY2tjaGFpbklEKCk7XG4gICAgZXhwZWN0KGJjMykudG9CZShuM2JjSUQpO1xuXG4gIH0pO1xuXG4gIHRlc3QoJ2xpc3RBZGRyZXNzZXMnLCBhc3luYyAoKSA9PiB7XG4gICAgY29uc3QgYWRkcmVzc2VzID0gW2FkZHJBLCBhZGRyQl07XG5cbiAgICBjb25zdCByZXN1bHQ6UHJvbWlzZTxBcnJheTxzdHJpbmc+PiA9IGFwaS5saXN0QWRkcmVzc2VzKHVzZXJuYW1lLCBwYXNzd29yZCk7XG4gICAgY29uc3QgcGF5bG9hZDpvYmplY3QgPSB7XG4gICAgICByZXN1bHQ6IHtcbiAgICAgICAgYWRkcmVzc2VzLFxuICAgICAgfSxcbiAgICB9O1xuICAgIGNvbnN0IHJlc3BvbnNlT2JqID0ge1xuICAgICAgZGF0YTogcGF5bG9hZCxcbiAgICB9O1xuXG4gICAgbW9ja0F4aW9zLm1vY2tSZXNwb25zZShyZXNwb25zZU9iaik7XG4gICAgY29uc3QgcmVzcG9uc2U6QXJyYXk8c3RyaW5nPiA9IGF3YWl0IHJlc3VsdDtcblxuICAgIGV4cGVjdChtb2NrQXhpb3MucmVxdWVzdCkudG9IYXZlQmVlbkNhbGxlZFRpbWVzKDEpO1xuICAgIGV4cGVjdChyZXNwb25zZSkudG9CZShhZGRyZXNzZXMpO1xuICB9KTtcblxuICB0ZXN0KCdpbXBvcnRLZXknLCBhc3luYyAoKSA9PiB7XG4gICAgY29uc3QgYWRkcmVzcyA9IGFkZHJDO1xuXG4gICAgY29uc3QgcmVzdWx0OlByb21pc2U8c3RyaW5nPiA9IGFwaS5pbXBvcnRLZXkodXNlcm5hbWUsIHBhc3N3b3JkLCAna2V5Jyk7XG4gICAgY29uc3QgcGF5bG9hZDpvYmplY3QgPSB7XG4gICAgICByZXN1bHQ6IHtcbiAgICAgICAgYWRkcmVzcyxcbiAgICAgIH0sXG4gICAgfTtcbiAgICBjb25zdCByZXNwb25zZU9iaiA9IHtcbiAgICAgIGRhdGE6IHBheWxvYWQsXG4gICAgfTtcblxuICAgIG1vY2tBeGlvcy5tb2NrUmVzcG9uc2UocmVzcG9uc2VPYmopO1xuICAgIGNvbnN0IHJlc3BvbnNlOnN0cmluZyA9IGF3YWl0IHJlc3VsdDtcblxuICAgIGV4cGVjdChtb2NrQXhpb3MucmVxdWVzdCkudG9IYXZlQmVlbkNhbGxlZFRpbWVzKDEpO1xuICAgIGV4cGVjdChyZXNwb25zZSkudG9CZShhZGRyZXNzKTtcbiAgfSk7XG5cbiAgdGVzdCgnZ2V0QmFsYW5jZScsIGFzeW5jICgpID0+IHtcbiAgICBjb25zdCBiYWxhbmNlID0gbmV3IEJOKCcxMDAnLCAxMCk7XG4gICAgY29uc3QgcmVzcG9iaiA9IHtcbiAgICAgIGJhbGFuY2UsXG4gICAgICB1dHhvSURzOiBbXG4gICAgICAgIHtcbiAgICAgICAgICBcInR4SURcIjpcIkxVcmlCM1c5MTlGODRMd1BNTXc0c20yZlo0WTc2V2diNm1zYWF1RVk3aTF0Rk5tdHZcIixcbiAgICAgICAgICBcIm91dHB1dEluZGV4XCI6MFxuICAgICAgICB9XG4gICAgICBdXG4gICAgfVxuICAgIGNvbnN0IHJlc3VsdDpQcm9taXNlPG9iamVjdD4gPSBhcGkuZ2V0QmFsYW5jZShhZGRyQSk7XG4gICAgY29uc3QgcGF5bG9hZDpvYmplY3QgPSB7XG4gICAgICByZXN1bHQ6IHJlc3BvYmosXG4gICAgfTtcbiAgICBjb25zdCByZXNwb25zZU9iaiA9IHtcbiAgICAgIGRhdGE6IHBheWxvYWQsXG4gICAgfTtcblxuICAgIG1vY2tBeGlvcy5tb2NrUmVzcG9uc2UocmVzcG9uc2VPYmopO1xuICAgIGNvbnN0IHJlc3BvbnNlOm9iamVjdCA9IGF3YWl0IHJlc3VsdDtcblxuICAgIGV4cGVjdChtb2NrQXhpb3MucmVxdWVzdCkudG9IYXZlQmVlbkNhbGxlZFRpbWVzKDEpO1xuICAgIGV4cGVjdChKU09OLnN0cmluZ2lmeShyZXNwb25zZSkpLnRvQmUoSlNPTi5zdHJpbmdpZnkocmVzcG9iaikpO1xuICB9KTtcblxuICB0ZXN0KCdnZXRDdXJyZW50U3VwcGx5JywgYXN5bmMgKCkgPT4ge1xuICAgIGNvbnN0IHN1cHBseSA9IG5ldyBCTignMTAwMDAwMDAwMDAwMCcsIDEwKTtcbiAgICBjb25zdCByZXN1bHQ6UHJvbWlzZTxCTj4gPSBhcGkuZ2V0Q3VycmVudFN1cHBseSgpO1xuICAgIGNvbnN0IHBheWxvYWQ6b2JqZWN0ID0ge1xuICAgICAgcmVzdWx0OiB7XG4gICAgICAgIHN1cHBseVxuICAgICAgfSxcbiAgICB9O1xuICAgIGNvbnN0IHJlc3BvbnNlT2JqID0ge1xuICAgICAgZGF0YTogcGF5bG9hZCxcbiAgICB9O1xuXG4gICAgbW9ja0F4aW9zLm1vY2tSZXNwb25zZShyZXNwb25zZU9iaik7XG4gICAgY29uc3QgcmVzcG9uc2U6Qk4gPSBhd2FpdCByZXN1bHQ7XG5cbiAgICBleHBlY3QobW9ja0F4aW9zLnJlcXVlc3QpLnRvSGF2ZUJlZW5DYWxsZWRUaW1lcygxKTtcbiAgICBleHBlY3QocmVzcG9uc2UudG9TdHJpbmcoMTApKS50b0JlKHN1cHBseS50b1N0cmluZygxMCkpO1xuICB9KTtcblxuICB0ZXN0KCdnZXRIZWlnaHQnLCBhc3luYyAoKSA9PiB7XG4gICAgY29uc3QgaGVpZ2h0ID0gbmV3IEJOKCcxMDAnLCAxMCk7XG4gICAgY29uc3QgcmVzdWx0OlByb21pc2U8Qk4+ID0gYXBpLmdldEhlaWdodCgpO1xuICAgIGNvbnN0IHBheWxvYWQ6b2JqZWN0ID0ge1xuICAgICAgcmVzdWx0OiB7XG4gICAgICAgIGhlaWdodFxuICAgICAgfSxcbiAgICB9O1xuICAgIGNvbnN0IHJlc3BvbnNlT2JqID0ge1xuICAgICAgZGF0YTogcGF5bG9hZCxcbiAgICB9O1xuXG4gICAgbW9ja0F4aW9zLm1vY2tSZXNwb25zZShyZXNwb25zZU9iaik7XG4gICAgY29uc3QgcmVzcG9uc2U6Qk4gPSBhd2FpdCByZXN1bHQ7XG5cbiAgICBleHBlY3QobW9ja0F4aW9zLnJlcXVlc3QpLnRvSGF2ZUJlZW5DYWxsZWRUaW1lcygxKTtcbiAgICBleHBlY3QocmVzcG9uc2UudG9TdHJpbmcoMTApKS50b0JlKGhlaWdodC50b1N0cmluZygxMCkpO1xuICB9KTtcblxuICB0ZXN0KCdnZXRNaW5TdGFrZScsIGFzeW5jICgpID0+IHtcbiAgICBjb25zdCBtaW5TdGFrZSA9IG5ldyBCTihcIjIwMDAwMDAwMDAwMDBcIiwgMTApO1xuICAgIGNvbnN0IG1pbkRlbGVnYXRlID0gbmV3IEJOKFwiMjUwMDAwMDAwMDBcIiwgMTApO1xuICAgIGNvbnN0IHJlc3VsdDpQcm9taXNlPG9iamVjdD4gPSBhcGkuZ2V0TWluU3Rha2UoKTtcbiAgICBjb25zdCBwYXlsb2FkOm9iamVjdCA9IHtcbiAgICAgIHJlc3VsdDoge1xuICAgICAgICBtaW5WYWxpZGF0b3JTdGFrZTogXCIyMDAwMDAwMDAwMDAwXCIsXG4gICAgICAgIG1pbkRlbGVnYXRvclN0YWtlOiBcIjI1MDAwMDAwMDAwXCJcbiAgICAgIH0sXG4gICAgfTtcbiAgICBjb25zdCByZXNwb25zZU9iaiA9IHtcbiAgICAgIGRhdGE6IHBheWxvYWQsXG4gICAgfTtcblxuICAgIG1vY2tBeGlvcy5tb2NrUmVzcG9uc2UocmVzcG9uc2VPYmopO1xuICAgIGNvbnN0IHJlc3BvbnNlOm9iamVjdCA9IGF3YWl0IHJlc3VsdDtcblxuICAgIGV4cGVjdChtb2NrQXhpb3MucmVxdWVzdCkudG9IYXZlQmVlbkNhbGxlZFRpbWVzKDEpO1xuICAgIGV4cGVjdChyZXNwb25zZVtcIm1pblZhbGlkYXRvclN0YWtlXCJdLnRvU3RyaW5nKDEwKSkudG9CZShtaW5TdGFrZS50b1N0cmluZygxMCkpO1xuICAgIGV4cGVjdChyZXNwb25zZVtcIm1pbkRlbGVnYXRvclN0YWtlXCJdLnRvU3RyaW5nKDEwKSkudG9CZShtaW5EZWxlZ2F0ZS50b1N0cmluZygxMCkpO1xuICB9KTtcblxuICB0ZXN0KCdnZXRTdGFrZScsIGFzeW5jICgpID0+IHtcbiAgICBjb25zdCBzdGFrZWQgPSBuZXcgQk4oJzEwMCcsIDEwKTtcbiAgICBjb25zdCByZXN1bHQ6UHJvbWlzZTxvYmplY3Q+ID0gYXBpLmdldFN0YWtlKFthZGRyQV0pO1xuICAgIGNvbnN0IHBheWxvYWQ6b2JqZWN0ID0ge1xuICAgICAgcmVzdWx0OiB7XG4gICAgICAgIHN0YWtlZFxuICAgICAgfSxcbiAgICB9O1xuICAgIGNvbnN0IHJlc3BvbnNlT2JqID0ge1xuICAgICAgZGF0YTogcGF5bG9hZCxcbiAgICB9O1xuXG4gICAgbW9ja0F4aW9zLm1vY2tSZXNwb25zZShyZXNwb25zZU9iaik7XG4gICAgY29uc3QgcmVzcG9uc2U6b2JqZWN0ID0gYXdhaXQgcmVzdWx0O1xuXG4gICAgZXhwZWN0KG1vY2tBeGlvcy5yZXF1ZXN0KS50b0hhdmVCZWVuQ2FsbGVkVGltZXMoMSk7XG4gICAgZXhwZWN0KEpTT04uc3RyaW5naWZ5KHJlc3BvbnNlKSkudG9CZShKU09OLnN0cmluZ2lmeShzdGFrZWQpKTtcbiAgfSk7XG5cblxuICB0ZXN0KCdhZGRTdWJuZXRWYWxpZGF0b3IgMScsIGFzeW5jICgpID0+IHtcbiAgICBjb25zdCBub2RlSUQgPSAnYWJjZGVmJztcbiAgICBjb25zdCBzdWJuZXRJRCA9IFwiNFI1cDJSWERHTHFhaWZaRTRoSFdIOW93ZTM0cGZvQlVMbjFEclFUV2l2amc4bzRhSFwiO1xuICAgIGNvbnN0IHN0YXJ0VGltZSA9IG5ldyBEYXRlKDE5ODUsIDUsIDksIDEyLCA1OSwgNDMsIDkpO1xuICAgIGNvbnN0IGVuZFRpbWUgPSBuZXcgRGF0ZSgxOTgyLCAzLCAxLCAxMiwgNTgsIDMzLCA3KTtcbiAgICBjb25zdCB3ZWlnaHQgPSAxMztcbiAgICBjb25zdCB1dHggPSAndmFsaWQnO1xuICAgIGNvbnN0IHJlc3VsdDpQcm9taXNlPHN0cmluZz4gPSBhcGkuYWRkU3VibmV0VmFsaWRhdG9yKHVzZXJuYW1lLCBwYXNzd29yZCwgbm9kZUlELCBzdWJuZXRJRCwgc3RhcnRUaW1lLCBlbmRUaW1lLCB3ZWlnaHQpO1xuICAgIGNvbnN0IHBheWxvYWQ6b2JqZWN0ID0ge1xuICAgICAgcmVzdWx0OiB7XG4gICAgICAgIHR4SUQ6IHV0eCxcbiAgICAgIH0sXG4gICAgfTtcbiAgICBjb25zdCByZXNwb25zZU9iaiA9IHtcbiAgICAgIGRhdGE6IHBheWxvYWQsXG4gICAgfTtcblxuICAgIG1vY2tBeGlvcy5tb2NrUmVzcG9uc2UocmVzcG9uc2VPYmopO1xuICAgIGNvbnN0IHJlc3BvbnNlOnN0cmluZyA9IGF3YWl0IHJlc3VsdDtcblxuICAgIGV4cGVjdChtb2NrQXhpb3MucmVxdWVzdCkudG9IYXZlQmVlbkNhbGxlZFRpbWVzKDEpO1xuICAgIGV4cGVjdChyZXNwb25zZSkudG9CZSh1dHgpO1xuICB9KTtcblxuICB0ZXN0KCdhZGRTdWJuZXRWYWxpZGF0b3InLCBhc3luYyAoKSA9PiB7XG4gICAgY29uc3Qgbm9kZUlEID0gJ2FiY2RlZic7XG4gICAgY29uc3Qgc3VibmV0SUQgPSBCdWZmZXIuZnJvbSgnYWJjZGVmJywgJ2hleCcpO1xuICAgIGNvbnN0IHN0YXJ0VGltZSA9IG5ldyBEYXRlKDE5ODUsIDUsIDksIDEyLCA1OSwgNDMsIDkpO1xuICAgIGNvbnN0IGVuZFRpbWUgPSBuZXcgRGF0ZSgxOTgyLCAzLCAxLCAxMiwgNTgsIDMzLCA3KTtcbiAgICBjb25zdCB3ZWlnaHQgPSAxMztcbiAgICBjb25zdCB1dHggPSAndmFsaWQnO1xuICAgIGNvbnN0IHJlc3VsdDpQcm9taXNlPHN0cmluZz4gPSBhcGkuYWRkU3VibmV0VmFsaWRhdG9yKHVzZXJuYW1lLCBwYXNzd29yZCwgbm9kZUlELCBzdWJuZXRJRCwgc3RhcnRUaW1lLCBlbmRUaW1lLCB3ZWlnaHQpO1xuICAgIGNvbnN0IHBheWxvYWQ6b2JqZWN0ID0ge1xuICAgICAgcmVzdWx0OiB7XG4gICAgICAgIHR4SUQ6IHV0eCxcbiAgICAgIH0sXG4gICAgfTtcbiAgICBjb25zdCByZXNwb25zZU9iaiA9IHtcbiAgICAgIGRhdGE6IHBheWxvYWQsXG4gICAgfTtcblxuICAgIG1vY2tBeGlvcy5tb2NrUmVzcG9uc2UocmVzcG9uc2VPYmopO1xuICAgIGNvbnN0IHJlc3BvbnNlOnN0cmluZyA9IGF3YWl0IHJlc3VsdDtcblxuICAgIGV4cGVjdChtb2NrQXhpb3MucmVxdWVzdCkudG9IYXZlQmVlbkNhbGxlZFRpbWVzKDEpO1xuICAgIGV4cGVjdChyZXNwb25zZSkudG9CZSh1dHgpO1xuICB9KTtcblxuICB0ZXN0KCdhZGREZWxlZ2F0b3IgMScsIGFzeW5jICgpID0+IHtcbiAgICBjb25zdCBub2RlSUQgPSAnYWJjZGVmJztcbiAgICBjb25zdCBzdGFydFRpbWUgPSBuZXcgRGF0ZSgxOTg1LCA1LCA5LCAxMiwgNTksIDQzLCA5KTtcbiAgICBjb25zdCBlbmRUaW1lID0gbmV3IERhdGUoMTk4MiwgMywgMSwgMTIsIDU4LCAzMywgNyk7XG4gICAgY29uc3Qgc3Rha2VBbW91bnQgPSBuZXcgQk4oMTMpO1xuICAgIGNvbnN0IHJld2FyZEFkZHJlc3MgPSAnZmVkY2JhJztcbiAgICBjb25zdCB1dHggPSAndmFsaWQnO1xuICAgIGNvbnN0IHJlc3VsdDpQcm9taXNlPHN0cmluZz4gPSBhcGkuYWRkRGVsZWdhdG9yKHVzZXJuYW1lLCBwYXNzd29yZCwgbm9kZUlELCBzdGFydFRpbWUsIGVuZFRpbWUsIHN0YWtlQW1vdW50LCByZXdhcmRBZGRyZXNzKTtcbiAgICBjb25zdCBwYXlsb2FkOm9iamVjdCA9IHtcbiAgICAgIHJlc3VsdDoge1xuICAgICAgICB0eElEOiB1dHgsXG4gICAgICB9LFxuICAgIH07XG4gICAgY29uc3QgcmVzcG9uc2VPYmogPSB7XG4gICAgICBkYXRhOiBwYXlsb2FkLFxuICAgIH07XG5cbiAgICBtb2NrQXhpb3MubW9ja1Jlc3BvbnNlKHJlc3BvbnNlT2JqKTtcbiAgICBjb25zdCByZXNwb25zZTpzdHJpbmcgPSBhd2FpdCByZXN1bHQ7XG5cbiAgICBleHBlY3QobW9ja0F4aW9zLnJlcXVlc3QpLnRvSGF2ZUJlZW5DYWxsZWRUaW1lcygxKTtcbiAgICBleHBlY3QocmVzcG9uc2UpLnRvQmUodXR4KTtcbiAgfSk7XG5cbiAgdGVzdCgnZ2V0QmxvY2tjaGFpbnMgMScsIGFzeW5jICgpID0+IHtcbiAgICBjb25zdCByZXNwID0gW3tcbiAgICAgIGlkOiAnbm9kZUlEJyxcbiAgICAgIHN1Ym5ldElEOiAnc3VibmV0SUQnLFxuICAgICAgdm1JRDogJ3ZtSUQnLFxuICAgIH1dO1xuICAgIGNvbnN0IHJlc3VsdDpQcm9taXNlPEFycmF5PG9iamVjdD4+ID0gYXBpLmdldEJsb2NrY2hhaW5zKCk7XG4gICAgY29uc3QgcGF5bG9hZDpvYmplY3QgPSB7XG4gICAgICByZXN1bHQ6IHtcbiAgICAgICAgYmxvY2tjaGFpbnM6IHJlc3AsXG4gICAgICB9LFxuICAgIH07XG4gICAgY29uc3QgcmVzcG9uc2VPYmogPSB7XG4gICAgICBkYXRhOiBwYXlsb2FkLFxuICAgIH07XG5cbiAgICBtb2NrQXhpb3MubW9ja1Jlc3BvbnNlKHJlc3BvbnNlT2JqKTtcbiAgICBjb25zdCByZXNwb25zZTpBcnJheTxvYmplY3Q+ID0gYXdhaXQgcmVzdWx0O1xuXG4gICAgZXhwZWN0KG1vY2tBeGlvcy5yZXF1ZXN0KS50b0hhdmVCZWVuQ2FsbGVkVGltZXMoMSk7XG4gICAgZXhwZWN0KHJlc3BvbnNlKS50b0JlKHJlc3ApO1xuICB9KTtcblxuICB0ZXN0KCdnZXRTdWJuZXRzIDEnLCBhc3luYyAoKSA9PiB7XG4gICAgY29uc3QgcmVzcDogQXJyYXk8b2JqZWN0PiA9IFt7XG4gICAgICBpZDogJ2lkJyxcbiAgICAgIGNvbnRyb2xLZXlzOiBbJ2NvbnRyb2xLZXlzJ10sXG4gICAgICB0aHJlc2hvbGQ6ICd0aHJlc2hvbGQnLFxuICAgIH1dO1xuICAgIGNvbnN0IHJlc3VsdDpQcm9taXNlPG9iamVjdD4gPSBhcGkuZ2V0U3VibmV0cygpO1xuICAgIGNvbnN0IHBheWxvYWQ6b2JqZWN0ID0ge1xuICAgICAgcmVzdWx0OiB7XG4gICAgICAgIHN1Ym5ldHM6IHJlc3AsXG4gICAgICB9LFxuICAgIH07XG4gICAgY29uc3QgcmVzcG9uc2VPYmogPSB7XG4gICAgICBkYXRhOiBwYXlsb2FkLFxuICAgIH07XG5cbiAgICBtb2NrQXhpb3MubW9ja1Jlc3BvbnNlKHJlc3BvbnNlT2JqKTtcbiAgICBjb25zdCByZXNwb25zZTpvYmplY3QgPSBhd2FpdCByZXN1bHQ7XG5cbiAgICBleHBlY3QobW9ja0F4aW9zLnJlcXVlc3QpLnRvSGF2ZUJlZW5DYWxsZWRUaW1lcygxKTtcbiAgICBleHBlY3QocmVzcG9uc2UpLnRvRXF1YWwocmVzcCk7XG4gIH0pO1xuXG4gIHRlc3QoJ2dldEN1cnJlbnRWYWxpZGF0b3JzIDEnLCBhc3luYyAoKSA9PiB7XG4gICAgY29uc3QgdmFsaWRhdG9ycyA9IFsndmFsMScsICd2YWwyJ107XG4gICAgY29uc3QgcmVzdWx0OlByb21pc2U8b2JqZWN0PiA9IGFwaS5nZXRDdXJyZW50VmFsaWRhdG9ycygpO1xuICAgIGNvbnN0IHBheWxvYWQ6b2JqZWN0ID0ge1xuICAgICAgcmVzdWx0OiB7XG4gICAgICAgIHZhbGlkYXRvcnMsXG4gICAgICB9LFxuICAgIH07XG4gICAgY29uc3QgcmVzcG9uc2VPYmogPSB7XG4gICAgICBkYXRhOiBwYXlsb2FkLFxuICAgIH07XG5cbiAgICBtb2NrQXhpb3MubW9ja1Jlc3BvbnNlKHJlc3BvbnNlT2JqKTtcbiAgICBjb25zdCByZXNwb25zZTpvYmplY3QgPSBhd2FpdCByZXN1bHQ7XG5cbiAgICBleHBlY3QobW9ja0F4aW9zLnJlcXVlc3QpLnRvSGF2ZUJlZW5DYWxsZWRUaW1lcygxKTtcbiAgICBleHBlY3QocmVzcG9uc2UpLnRvU3RyaWN0RXF1YWwoe3ZhbGlkYXRvcnN9KTtcbiAgfSk7XG5cbiAgdGVzdCgnZ2V0Q3VycmVudFZhbGlkYXRvcnMgMicsIGFzeW5jICgpID0+IHtcbiAgICBjb25zdCBzdWJuZXRJRDpzdHJpbmcgPSAnYWJjZGVmJztcbiAgICBjb25zdCB2YWxpZGF0b3JzID0gWyd2YWwxJywgJ3ZhbDInXTtcbiAgICBjb25zdCByZXN1bHQ6UHJvbWlzZTxvYmplY3Q+ID0gYXBpLmdldEN1cnJlbnRWYWxpZGF0b3JzKHN1Ym5ldElEKTtcbiAgICBjb25zdCBwYXlsb2FkOm9iamVjdCA9IHtcbiAgICAgIHJlc3VsdDoge1xuICAgICAgICB2YWxpZGF0b3JzLFxuICAgICAgfSxcbiAgICB9O1xuICAgIGNvbnN0IHJlc3BvbnNlT2JqID0ge1xuICAgICAgZGF0YTogcGF5bG9hZCxcbiAgICB9O1xuXG4gICAgbW9ja0F4aW9zLm1vY2tSZXNwb25zZShyZXNwb25zZU9iaik7XG4gICAgY29uc3QgcmVzcG9uc2U6b2JqZWN0ID0gYXdhaXQgcmVzdWx0O1xuXG4gICAgZXhwZWN0KG1vY2tBeGlvcy5yZXF1ZXN0KS50b0hhdmVCZWVuQ2FsbGVkVGltZXMoMSk7XG4gICAgZXhwZWN0KHJlc3BvbnNlKS50b1N0cmljdEVxdWFsKHt2YWxpZGF0b3JzfSk7XG4gIH0pO1xuXG4gIHRlc3QoJ2dldEN1cnJlbnRWYWxpZGF0b3JzIDMnLCBhc3luYyAoKSA9PiB7XG4gICAgY29uc3Qgc3VibmV0SUQ6QnVmZmVyID0gQnVmZmVyLmZyb20oJ2FiY2RlZicsICdoZXgnKTtcbiAgICBjb25zdCB2YWxpZGF0b3JzID0gWyd2YWwxJywgJ3ZhbDInXTtcbiAgICBjb25zdCByZXN1bHQ6UHJvbWlzZTxvYmplY3Q+ID0gYXBpLmdldEN1cnJlbnRWYWxpZGF0b3JzKHN1Ym5ldElEKTtcbiAgICBjb25zdCBwYXlsb2FkOm9iamVjdCA9IHtcbiAgICAgIHJlc3VsdDoge1xuICAgICAgICB2YWxpZGF0b3JzLFxuICAgICAgfSxcbiAgICB9O1xuICAgIGNvbnN0IHJlc3BvbnNlT2JqID0ge1xuICAgICAgZGF0YTogcGF5bG9hZCxcbiAgICB9O1xuXG4gICAgbW9ja0F4aW9zLm1vY2tSZXNwb25zZShyZXNwb25zZU9iaik7XG4gICAgY29uc3QgcmVzcG9uc2U6b2JqZWN0ID0gYXdhaXQgcmVzdWx0O1xuXG4gICAgZXhwZWN0KG1vY2tBeGlvcy5yZXF1ZXN0KS50b0hhdmVCZWVuQ2FsbGVkVGltZXMoMSk7XG4gICAgZXhwZWN0KHJlc3BvbnNlKS50b1N0cmljdEVxdWFsKHt2YWxpZGF0b3JzfSk7XG4gIH0pO1xuXG4gIHRlc3QoJ2V4cG9ydEtleScsIGFzeW5jICgpID0+IHtcbiAgICBjb25zdCBrZXkgPSAnc2RmZ2x2bGoyaDN2NDUnO1xuXG4gICAgY29uc3QgcmVzdWx0OlByb21pc2U8c3RyaW5nPiA9IGFwaS5leHBvcnRLZXkodXNlcm5hbWUsIHBhc3N3b3JkLCBhZGRyQSk7XG4gICAgY29uc3QgcGF5bG9hZDpvYmplY3QgPSB7XG4gICAgICByZXN1bHQ6IHtcbiAgICAgICAgcHJpdmF0ZUtleToga2V5LFxuICAgICAgfSxcbiAgICB9O1xuICAgIGNvbnN0IHJlc3BvbnNlT2JqID0ge1xuICAgICAgZGF0YTogcGF5bG9hZCxcbiAgICB9O1xuXG4gICAgbW9ja0F4aW9zLm1vY2tSZXNwb25zZShyZXNwb25zZU9iaik7XG4gICAgY29uc3QgcmVzcG9uc2U6c3RyaW5nID0gYXdhaXQgcmVzdWx0O1xuXG4gICAgZXhwZWN0KG1vY2tBeGlvcy5yZXF1ZXN0KS50b0hhdmVCZWVuQ2FsbGVkVGltZXMoMSk7XG4gICAgZXhwZWN0KHJlc3BvbnNlKS50b0JlKGtleSk7XG4gIH0pO1xuXG4gIHRlc3QoXCJleHBvcnRBVkFYXCIsIGFzeW5jICgpPT57XG4gICAgbGV0IGFtb3VudCA9IG5ldyBCTigxMDApO1xuICAgIGxldCB0byA9IFwiYWJjZGVmXCI7XG4gICAgbGV0IHVzZXJuYW1lID0gXCJSb2JlcnRcIjtcbiAgICBsZXQgcGFzc3dvcmQgPSBcIlBhdWxzb25cIjtcbiAgICBsZXQgdHhJRCA9IFwidmFsaWRcIjtcbiAgICBsZXQgcmVzdWx0OlByb21pc2U8c3RyaW5nPiA9IGFwaS5leHBvcnRBVkFYKHVzZXJuYW1lLCBwYXNzd29yZCwgYW1vdW50LCB0byk7XG4gICAgbGV0IHBheWxvYWQ6b2JqZWN0ID0ge1xuICAgICAgICBcInJlc3VsdFwiOiB7XG4gICAgICAgICAgICBcInR4SURcIjogdHhJRFxuICAgICAgICB9XG4gICAgfTtcbiAgICBsZXQgcmVzcG9uc2VPYmogPSB7XG4gICAgICAgIGRhdGE6IHBheWxvYWRcbiAgICB9O1xuXG4gICAgbW9ja0F4aW9zLm1vY2tSZXNwb25zZShyZXNwb25zZU9iaik7XG4gICAgbGV0IHJlc3BvbnNlOnN0cmluZyA9IGF3YWl0IHJlc3VsdDtcblxuICAgIGV4cGVjdChtb2NrQXhpb3MucmVxdWVzdCkudG9IYXZlQmVlbkNhbGxlZFRpbWVzKDEpO1xuICAgIGV4cGVjdChyZXNwb25zZSkudG9CZSh0eElEKTtcbiAgfSk7XG5cbiAgdGVzdChcImltcG9ydEFWQVhcIiwgYXN5bmMgKCk9PntcbiAgICBsZXQgdG8gPSBcImFiY2RlZlwiO1xuICAgIGxldCB1c2VybmFtZSA9IFwiUm9iZXJ0XCI7XG4gICAgbGV0IHBhc3N3b3JkID0gXCJQYXVsc29uXCI7XG4gICAgbGV0IHR4SUQgPSBcInZhbGlkXCI7XG4gICAgbGV0IHJlc3VsdDpQcm9taXNlPHN0cmluZz4gPSBhcGkuaW1wb3J0QVZBWCh1c2VybmFtZSwgcGFzc3dvcmQsIHRvLCBibG9ja2NoYWluaWQpO1xuICAgIGxldCBwYXlsb2FkOm9iamVjdCA9IHtcbiAgICAgICAgXCJyZXN1bHRcIjoge1xuICAgICAgICAgICAgXCJ0eElEXCI6IHR4SURcbiAgICAgICAgfVxuICAgIH07XG4gICAgbGV0IHJlc3BvbnNlT2JqID0ge1xuICAgICAgICBkYXRhOiBwYXlsb2FkXG4gICAgfTtcblxuICAgIG1vY2tBeGlvcy5tb2NrUmVzcG9uc2UocmVzcG9uc2VPYmopO1xuICAgIGxldCByZXNwb25zZTpzdHJpbmcgPSBhd2FpdCByZXN1bHQ7XG5cbiAgICBleHBlY3QobW9ja0F4aW9zLnJlcXVlc3QpLnRvSGF2ZUJlZW5DYWxsZWRUaW1lcygxKTtcbiAgICBleHBlY3QocmVzcG9uc2UpLnRvQmUodHhJRCk7XG4gIH0pO1xuXG4gIHRlc3QoJ2NyZWF0ZUJsb2NrY2hhaW4nLCBhc3luYyAoKSA9PiB7XG4gICAgY29uc3QgYmxvY2tjaGFpbklEOnN0cmluZyA9ICc3c2lrM1ByNnIxRmVMcnZLMW9Xd0VDQlM4aUo1VlB1U2gnO1xuICAgIGNvbnN0IHZtSUQ6c3RyaW5nID0gJzdzaWszUHI2cjFGZUxydksxb1d3RUNCUzhpSjVWUHVTaCc7XG4gICAgY29uc3QgbmFtZTpzdHJpbmcgPSAnU29tZSBCbG9ja2NoYWluJztcbiAgICBjb25zdCBnZW5lc2lzOnN0cmluZyA9ICd7cnVoOlwicm9oXCJ9JztcbiAgICBjb25zdCBzdWJuZXRJRDpCdWZmZXIgPSBCdWZmZXIuZnJvbSgnYWJjZGVmJywgJ2hleCcpO1xuICAgIGNvbnN0IHJlc3VsdDpQcm9taXNlPHN0cmluZz4gPSBhcGkuY3JlYXRlQmxvY2tjaGFpbih1c2VybmFtZSwgcGFzc3dvcmQsIHN1Ym5ldElELCB2bUlELCBbMSwyLDNdLCBuYW1lLCBnZW5lc2lzKTtcbiAgICBjb25zdCBwYXlsb2FkOm9iamVjdCA9IHtcbiAgICAgIHJlc3VsdDoge1xuICAgICAgICB0eElEOiBibG9ja2NoYWluSUQsXG4gICAgICB9LFxuICAgIH07XG4gICAgY29uc3QgcmVzcG9uc2VPYmogPSB7XG4gICAgICBkYXRhOiBwYXlsb2FkLFxuICAgIH07XG5cbiAgICBtb2NrQXhpb3MubW9ja1Jlc3BvbnNlKHJlc3BvbnNlT2JqKTtcbiAgICBjb25zdCByZXNwb25zZTpzdHJpbmcgPSBhd2FpdCByZXN1bHQ7XG5cbiAgICBleHBlY3QobW9ja0F4aW9zLnJlcXVlc3QpLnRvSGF2ZUJlZW5DYWxsZWRUaW1lcygxKTtcbiAgICBleHBlY3QocmVzcG9uc2UpLnRvQmUoYmxvY2tjaGFpbklEKTtcbiAgfSk7XG5cbiAgdGVzdCgnZ2V0QmxvY2tjaGFpblN0YXR1cycsIGFzeW5jICgpID0+IHtcbiAgY29uc3QgYmxvY2tjaGFpbklEOnN0cmluZyA9ICc3c2lrM1ByNnIxRmVMcnZLMW9Xd0VDQlM4aUo1VlB1U2gnO1xuICBjb25zdCByZXN1bHQ6UHJvbWlzZTxzdHJpbmc+ID0gYXBpLmdldEJsb2NrY2hhaW5TdGF0dXMoYmxvY2tjaGFpbklEKTtcbiAgY29uc3QgcGF5bG9hZDpvYmplY3QgPSB7XG4gICAgcmVzdWx0OiB7XG4gICAgICBzdGF0dXM6ICdBY2NlcHRlZCcsXG4gICAgfSxcbiAgfTtcbiAgY29uc3QgcmVzcG9uc2VPYmogPSB7XG4gICAgZGF0YTogcGF5bG9hZCxcbiAgfTtcblxuICBtb2NrQXhpb3MubW9ja1Jlc3BvbnNlKHJlc3BvbnNlT2JqKTtcbiAgY29uc3QgcmVzcG9uc2U6c3RyaW5nID0gYXdhaXQgcmVzdWx0O1xuXG4gIGV4cGVjdChtb2NrQXhpb3MucmVxdWVzdCkudG9IYXZlQmVlbkNhbGxlZFRpbWVzKDEpO1xuICBleHBlY3QocmVzcG9uc2UpLnRvQmUoJ0FjY2VwdGVkJyk7XG59KTtcblxuICB0ZXN0KCdjcmVhdGVBZGRyZXNzJywgYXN5bmMgKCkgPT4ge1xuICAgIGNvbnN0IGFsaWFzID0gJ3JhbmRvbWFsaWFzJztcblxuICAgIGNvbnN0IHJlc3VsdDpQcm9taXNlPHN0cmluZz4gPSBhcGkuY3JlYXRlQWRkcmVzcyh1c2VybmFtZSwgcGFzc3dvcmQpO1xuICAgIGNvbnN0IHBheWxvYWQ6b2JqZWN0ID0ge1xuICAgICAgcmVzdWx0OiB7XG4gICAgICAgIGFkZHJlc3M6IGFsaWFzLFxuICAgICAgfSxcbiAgICB9O1xuICAgIGNvbnN0IHJlc3BvbnNlT2JqID0ge1xuICAgICAgZGF0YTogcGF5bG9hZCxcbiAgICB9O1xuXG4gICAgbW9ja0F4aW9zLm1vY2tSZXNwb25zZShyZXNwb25zZU9iaik7XG4gICAgY29uc3QgcmVzcG9uc2U6c3RyaW5nID0gYXdhaXQgcmVzdWx0O1xuXG4gICAgZXhwZWN0KG1vY2tBeGlvcy5yZXF1ZXN0KS50b0hhdmVCZWVuQ2FsbGVkVGltZXMoMSk7XG4gICAgZXhwZWN0KHJlc3BvbnNlKS50b0JlKGFsaWFzKTtcbiAgfSk7XG5cbiAgdGVzdCgnY3JlYXRlU3VibmV0IDEnLCBhc3luYyAoKSA9PiB7XG4gICAgY29uc3QgY29udHJvbEtleXMgPSBbJ2FiY2RlZiddO1xuICAgIGNvbnN0IHRocmVzaG9sZCA9IDEzO1xuICAgIGNvbnN0IHV0eCA9ICd2YWxpZCc7XG4gICAgY29uc3QgcmVzdWx0OlByb21pc2U8c3RyaW5nPiA9IGFwaS5jcmVhdGVTdWJuZXQodXNlcm5hbWUsIHBhc3N3b3JkLCBjb250cm9sS2V5cywgdGhyZXNob2xkKTtcbiAgICBjb25zdCBwYXlsb2FkOm9iamVjdCA9IHtcbiAgICAgIHJlc3VsdDoge1xuICAgICAgICB0eElEOiB1dHgsXG4gICAgICB9LFxuICAgIH07XG4gICAgY29uc3QgcmVzcG9uc2VPYmogPSB7XG4gICAgICBkYXRhOiBwYXlsb2FkLFxuICAgIH07XG5cbiAgICBtb2NrQXhpb3MubW9ja1Jlc3BvbnNlKHJlc3BvbnNlT2JqKTtcbiAgICBjb25zdCByZXNwb25zZTpzdHJpbmcgPSBhd2FpdCByZXN1bHQ7XG5cbiAgICBleHBlY3QobW9ja0F4aW9zLnJlcXVlc3QpLnRvSGF2ZUJlZW5DYWxsZWRUaW1lcygxKTtcbiAgICBleHBlY3QocmVzcG9uc2UpLnRvQmUodXR4KTtcbiAgfSk7XG5cbiAgdGVzdCgnc2FtcGxlVmFsaWRhdG9ycyAxJywgYXN5bmMgKCkgPT4ge1xuICAgIGxldCBzdWJuZXRJRDtcbiAgICBjb25zdCB2YWxpZGF0b3JzID0gWyd2YWwxJywgJ3ZhbDInXTtcbiAgICBjb25zdCByZXN1bHQ6UHJvbWlzZTxBcnJheTxzdHJpbmc+PiA9IGFwaS5zYW1wbGVWYWxpZGF0b3JzKDEwLCBzdWJuZXRJRCk7XG4gICAgY29uc3QgcGF5bG9hZDpvYmplY3QgPSB7XG4gICAgICByZXN1bHQ6IHtcbiAgICAgICAgdmFsaWRhdG9ycyxcbiAgICAgIH0sXG4gICAgfTtcbiAgICBjb25zdCByZXNwb25zZU9iaiA9IHtcbiAgICAgIGRhdGE6IHBheWxvYWQsXG4gICAgfTtcblxuICAgIG1vY2tBeGlvcy5tb2NrUmVzcG9uc2UocmVzcG9uc2VPYmopO1xuICAgIGNvbnN0IHJlc3BvbnNlOkFycmF5PHN0cmluZz4gPSBhd2FpdCByZXN1bHQ7XG5cbiAgICBleHBlY3QobW9ja0F4aW9zLnJlcXVlc3QpLnRvSGF2ZUJlZW5DYWxsZWRUaW1lcygxKTtcbiAgICBleHBlY3QocmVzcG9uc2UpLnRvQmUodmFsaWRhdG9ycyk7XG4gIH0pO1xuXG4gIHRlc3QoJ3NhbXBsZVZhbGlkYXRvcnMgMicsIGFzeW5jICgpID0+IHtcbiAgICBjb25zdCBzdWJuZXRJRCA9ICdhYmNkZWYnO1xuICAgIGNvbnN0IHZhbGlkYXRvcnMgPSBbJ3ZhbDEnLCAndmFsMiddO1xuICAgIGNvbnN0IHJlc3VsdDpQcm9taXNlPEFycmF5PHN0cmluZz4+ID0gYXBpLnNhbXBsZVZhbGlkYXRvcnMoMTAsIHN1Ym5ldElEKTtcbiAgICBjb25zdCBwYXlsb2FkOm9iamVjdCA9IHtcbiAgICAgIHJlc3VsdDoge1xuICAgICAgICB2YWxpZGF0b3JzLFxuICAgICAgfSxcbiAgICB9O1xuICAgIGNvbnN0IHJlc3BvbnNlT2JqID0ge1xuICAgICAgZGF0YTogcGF5bG9hZCxcbiAgICB9O1xuXG4gICAgbW9ja0F4aW9zLm1vY2tSZXNwb25zZShyZXNwb25zZU9iaik7XG4gICAgY29uc3QgcmVzcG9uc2U6QXJyYXk8c3RyaW5nPiA9IGF3YWl0IHJlc3VsdDtcblxuICAgIGV4cGVjdChtb2NrQXhpb3MucmVxdWVzdCkudG9IYXZlQmVlbkNhbGxlZFRpbWVzKDEpO1xuICAgIGV4cGVjdChyZXNwb25zZSkudG9CZSh2YWxpZGF0b3JzKTtcbiAgfSk7XG5cbiAgdGVzdCgnc2FtcGxlVmFsaWRhdG9ycyAzJywgYXN5bmMgKCkgPT4ge1xuICAgIGNvbnN0IHN1Ym5ldElEID0gQnVmZmVyLmZyb20oJ2FiY2RlZicsICdoZXgnKTtcbiAgICBjb25zdCB2YWxpZGF0b3JzID0gWyd2YWwxJywgJ3ZhbDInXTtcbiAgICBjb25zdCByZXN1bHQ6UHJvbWlzZTxBcnJheTxzdHJpbmc+PiA9IGFwaS5zYW1wbGVWYWxpZGF0b3JzKDEwLCBzdWJuZXRJRCk7XG4gICAgY29uc3QgcGF5bG9hZDpvYmplY3QgPSB7XG4gICAgICByZXN1bHQ6IHtcbiAgICAgICAgdmFsaWRhdG9ycyxcbiAgICAgIH0sXG4gICAgfTtcbiAgICBjb25zdCByZXNwb25zZU9iaiA9IHtcbiAgICAgIGRhdGE6IHBheWxvYWQsXG4gICAgfTtcbiAgfSk7XG5cbiAgdGVzdCgndmFsaWRhdGVkQnkgMScsIGFzeW5jICgpID0+IHtcbiAgICBjb25zdCBibG9ja2NoYWluSUQgPSAnYWJjZGVmJztcbiAgICBjb25zdCByZXNwID0gJ3ZhbGlkJztcbiAgICBjb25zdCByZXN1bHQ6UHJvbWlzZTxzdHJpbmc+ID0gYXBpLnZhbGlkYXRlZEJ5KGJsb2NrY2hhaW5JRCk7XG4gICAgY29uc3QgcGF5bG9hZDpvYmplY3QgPSB7XG4gICAgICByZXN1bHQ6IHtcbiAgICAgICAgc3VibmV0SUQ6IHJlc3AsXG4gICAgICB9LFxuICAgIH07XG4gICAgY29uc3QgcmVzcG9uc2VPYmogPSB7XG4gICAgICBkYXRhOiBwYXlsb2FkLFxuICAgIH07XG5cbiAgICBtb2NrQXhpb3MubW9ja1Jlc3BvbnNlKHJlc3BvbnNlT2JqKTtcbiAgICBjb25zdCByZXNwb25zZTpzdHJpbmcgPSBhd2FpdCByZXN1bHQ7XG5cbiAgICBleHBlY3QobW9ja0F4aW9zLnJlcXVlc3QpLnRvSGF2ZUJlZW5DYWxsZWRUaW1lcygxKTtcbiAgICBleHBlY3QocmVzcG9uc2UpLnRvQmUocmVzcCk7XG4gIH0pO1xuXG4gIHRlc3QoJ3ZhbGlkYXRlcyAxJywgYXN5bmMgKCkgPT4ge1xuICAgIGxldCBzdWJuZXRJRDtcbiAgICBjb25zdCByZXNwID0gWyd2YWxpZCddO1xuICAgIGNvbnN0IHJlc3VsdDpQcm9taXNlPEFycmF5PHN0cmluZz4+ID0gYXBpLnZhbGlkYXRlcyhzdWJuZXRJRCk7XG4gICAgY29uc3QgcGF5bG9hZDpvYmplY3QgPSB7XG4gICAgICByZXN1bHQ6IHtcbiAgICAgICAgYmxvY2tjaGFpbklEczogcmVzcCxcbiAgICAgIH0sXG4gICAgfTtcbiAgICBjb25zdCByZXNwb25zZU9iaiA9IHtcbiAgICAgIGRhdGE6IHBheWxvYWQsXG4gICAgfTtcblxuICAgIG1vY2tBeGlvcy5tb2NrUmVzcG9uc2UocmVzcG9uc2VPYmopO1xuICAgIGNvbnN0IHJlc3BvbnNlOkFycmF5PHN0cmluZz4gPSBhd2FpdCByZXN1bHQ7XG5cbiAgICBleHBlY3QobW9ja0F4aW9zLnJlcXVlc3QpLnRvSGF2ZUJlZW5DYWxsZWRUaW1lcygxKTtcbiAgICBleHBlY3QocmVzcG9uc2UpLnRvQmUocmVzcCk7XG4gIH0pO1xuXG4gIHRlc3QoJ3ZhbGlkYXRlcyAyJywgYXN5bmMgKCkgPT4ge1xuICAgIGNvbnN0IHN1Ym5ldElEID0gJ2RlYWRiZWVmJztcbiAgICBjb25zdCByZXNwID0gWyd2YWxpZCddO1xuICAgIGNvbnN0IHJlc3VsdDpQcm9taXNlPEFycmF5PHN0cmluZz4+ID0gYXBpLnZhbGlkYXRlcyhzdWJuZXRJRCk7XG4gICAgY29uc3QgcGF5bG9hZDpvYmplY3QgPSB7XG4gICAgICByZXN1bHQ6IHtcbiAgICAgICAgYmxvY2tjaGFpbklEczogcmVzcCxcbiAgICAgIH0sXG4gICAgfTtcbiAgICBjb25zdCByZXNwb25zZU9iaiA9IHtcbiAgICAgIGRhdGE6IHBheWxvYWQsXG4gICAgfTtcblxuICAgIG1vY2tBeGlvcy5tb2NrUmVzcG9uc2UocmVzcG9uc2VPYmopO1xuICAgIGNvbnN0IHJlc3BvbnNlOkFycmF5PHN0cmluZz4gPSBhd2FpdCByZXN1bHQ7XG5cbiAgICBleHBlY3QobW9ja0F4aW9zLnJlcXVlc3QpLnRvSGF2ZUJlZW5DYWxsZWRUaW1lcygxKTtcbiAgICBleHBlY3QocmVzcG9uc2UpLnRvQmUocmVzcCk7XG4gIH0pO1xuXG4gIHRlc3QoJ3ZhbGlkYXRlcyAzJywgYXN5bmMgKCkgPT4ge1xuICAgIGNvbnN0IHN1Ym5ldElEID0gQnVmZmVyLmZyb20oJ2FiY2RlZicsICdoZXgnKTtcbiAgICBjb25zdCByZXNwID0gWyd2YWxpZCddO1xuICAgIGNvbnN0IHJlc3VsdDpQcm9taXNlPEFycmF5PHN0cmluZz4+ID0gYXBpLnZhbGlkYXRlcyhzdWJuZXRJRCk7XG4gICAgY29uc3QgcGF5bG9hZDpvYmplY3QgPSB7XG4gICAgICByZXN1bHQ6IHtcbiAgICAgICAgYmxvY2tjaGFpbklEczogcmVzcCxcbiAgICAgIH0sXG4gICAgfTtcbiAgICBjb25zdCByZXNwb25zZU9iaiA9IHtcbiAgICAgIGRhdGE6IHBheWxvYWQsXG4gICAgfTtcblxuICAgIG1vY2tBeGlvcy5tb2NrUmVzcG9uc2UocmVzcG9uc2VPYmopO1xuICAgIGNvbnN0IHJlc3BvbnNlOkFycmF5PHN0cmluZz4gPSBhd2FpdCByZXN1bHQ7XG5cbiAgICBleHBlY3QobW9ja0F4aW9zLnJlcXVlc3QpLnRvSGF2ZUJlZW5DYWxsZWRUaW1lcygxKTtcbiAgICBleHBlY3QocmVzcG9uc2UpLnRvQmUocmVzcCk7XG4gIH0pO1xuXG4gIHRlc3QoJ2dldFR4JywgYXN5bmMgKCkgPT4ge1xuICAgIGNvbnN0IHR4aWQ6c3RyaW5nID0gJ2Y5NjY3NTBmNDM4ODY3YzNjOTgyOGRkY2RiZTY2MGUyMWNjZGJiMzZhOTI3Njk1OGYwMTFiYTQ3MmY3NWQ0ZTcnO1xuXG4gICAgY29uc3QgcmVzdWx0OlByb21pc2U8c3RyaW5nPiA9IGFwaS5nZXRUeCh0eGlkKTtcbiAgICBjb25zdCBwYXlsb2FkOm9iamVjdCA9IHtcbiAgICAgIHJlc3VsdDoge1xuICAgICAgICB0eDogJ3NvbWV0eCcsXG4gICAgICB9LFxuICAgIH07XG4gICAgY29uc3QgcmVzcG9uc2VPYmogPSB7XG4gICAgICBkYXRhOiBwYXlsb2FkLFxuICAgIH07XG5cbiAgICBtb2NrQXhpb3MubW9ja1Jlc3BvbnNlKHJlc3BvbnNlT2JqKTtcbiAgICBjb25zdCByZXNwb25zZTpzdHJpbmcgPSBhd2FpdCByZXN1bHQ7XG5cbiAgICBleHBlY3QobW9ja0F4aW9zLnJlcXVlc3QpLnRvSGF2ZUJlZW5DYWxsZWRUaW1lcygxKTtcbiAgICBleHBlY3QocmVzcG9uc2UpLnRvQmUoJ3NvbWV0eCcpO1xuICB9KTtcblxuXG4gIHRlc3QoJ2dldFR4U3RhdHVzJywgYXN5bmMgKCkgPT4ge1xuICAgIGNvbnN0IHR4aWQ6c3RyaW5nID0gJ2Y5NjY3NTBmNDM4ODY3YzNjOTgyOGRkY2RiZTY2MGUyMWNjZGJiMzZhOTI3Njk1OGYwMTFiYTQ3MmY3NWQ0ZTcnO1xuXG4gICAgY29uc3QgcmVzdWx0OlByb21pc2U8c3RyaW5nfHtzdGF0dXM6c3RyaW5nLCByZWFzb246c3RyaW5nfT4gPSBhcGkuZ2V0VHhTdGF0dXModHhpZCk7XG4gICAgY29uc3QgcGF5bG9hZDpvYmplY3QgPSB7XG4gICAgICByZXN1bHQ6ICAnYWNjZXB0ZWQnXG4gICAgfTtcbiAgICBjb25zdCByZXNwb25zZU9iaiA9IHtcbiAgICAgIGRhdGE6IHBheWxvYWQsXG4gICAgfTtcblxuICAgIG1vY2tBeGlvcy5tb2NrUmVzcG9uc2UocmVzcG9uc2VPYmopO1xuICAgIGNvbnN0IHJlc3BvbnNlOnN0cmluZ3x7c3RhdHVzOnN0cmluZywgcmVhc29uOnN0cmluZ30gPSBhd2FpdCByZXN1bHQ7XG5cbiAgICBleHBlY3QobW9ja0F4aW9zLnJlcXVlc3QpLnRvSGF2ZUJlZW5DYWxsZWRUaW1lcygxKTtcbiAgICBleHBlY3QocmVzcG9uc2UpLnRvQmUoJ2FjY2VwdGVkJyk7XG4gIH0pO1xuXG4gIHRlc3QoJ2dldFVUWE9zJywgYXN5bmMgKCkgPT4ge1xuICAgIC8vIFBheW1lbnRcbiAgICBjb25zdCBPUFVUWE9zdHIxOnN0cmluZyA9IGJpbnRvb2xzLmNiNThFbmNvZGUoQnVmZmVyLmZyb20oJzAwMDAzOGQxYjlmMTEzODY3MmRhNmZiNmMzNTEyNTUzOTI3NmE5YWNjMmE2NjhkNjNiZWE2YmEzYzc5NWUyZWRiMGY1MDAwMDAwMDEzZTA3ZTM4ZTJmMjMxMjFiZTg3NTY0MTJjMThkYjcyNDZhMTZkMjZlZTk5MzZmM2NiYTI4YmUxNDljZmQzNTU4MDAwMDAwMDcwMDAwMDAwMDAwMDA0ZGQ1MDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAxMDAwMDAwMDFhMzZmZDBjMmRiY2FiMzExNzMxZGRlN2VmMTUxNGJkMjZmY2RjNzRkJywgJ2hleCcpKTtcbiAgICBjb25zdCBPUFVUWE9zdHIyOnN0cmluZyA9IGJpbnRvb2xzLmNiNThFbmNvZGUoQnVmZmVyLmZyb20oJzAwMDBjM2U0ODIzNTcxNTg3ZmUyYmRmYzUwMjY4OWY1YTgyMzhiOWQwZWE3ZjMyNzcxMjRkMTZhZjlkZTBkMmQ5OTExMDAwMDAwMDAzZTA3ZTM4ZTJmMjMxMjFiZTg3NTY0MTJjMThkYjcyNDZhMTZkMjZlZTk5MzZmM2NiYTI4YmUxNDljZmQzNTU4MDAwMDAwMDcwMDAwMDAwMDAwMDAwMDE5MDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAxMDAwMDAwMDFlMWI2YjZhNGJhZDk0ZDJlM2YyMDczMDM3OWI5YmNkNmYxNzYzMThlJywgJ2hleCcpKTtcbiAgICBjb25zdCBPUFVUWE9zdHIzOnN0cmluZyA9IGJpbnRvb2xzLmNiNThFbmNvZGUoQnVmZmVyLmZyb20oJzAwMDBmMjlkYmE2MWZkYThkNTdhOTExZTdmODgxMGY5MzViZGU4MTBkM2Y4ZDQ5NTQwNDY4NWJkYjhkOWQ4NTQ1ZTg2MDAwMDAwMDAzZTA3ZTM4ZTJmMjMxMjFiZTg3NTY0MTJjMThkYjcyNDZhMTZkMjZlZTk5MzZmM2NiYTI4YmUxNDljZmQzNTU4MDAwMDAwMDcwMDAwMDAwMDAwMDAwMDE5MDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAxMDAwMDAwMDFlMWI2YjZhNGJhZDk0ZDJlM2YyMDczMDM3OWI5YmNkNmYxNzYzMThlJywgJ2hleCcpKTtcblxuICAgIGNvbnN0IHNldDpVVFhPU2V0ID0gbmV3IFVUWE9TZXQoKTtcbiAgICBzZXQuYWRkKE9QVVRYT3N0cjEpO1xuICAgIHNldC5hZGRBcnJheShbT1BVVFhPc3RyMiwgT1BVVFhPc3RyM10pO1xuXG4gICAgY29uc3QgcGVyc2lzdE9wdHM6UGVyc2lzdGFuY2VPcHRpb25zID0gbmV3IFBlcnNpc3RhbmNlT3B0aW9ucygndGVzdCcsIHRydWUsICd1bmlvbicpO1xuICAgIGV4cGVjdChwZXJzaXN0T3B0cy5nZXRNZXJnZVJ1bGUoKSkudG9CZSgndW5pb24nKTtcbiAgICBsZXQgYWRkcmVzc2VzOkFycmF5PHN0cmluZz4gPSBzZXQuZ2V0QWRkcmVzc2VzKCkubWFwKChhKSA9PiBhcGkuYWRkcmVzc0Zyb21CdWZmZXIoYSkpO1xuICAgIGxldCByZXN1bHQ6UHJvbWlzZTx7XG4gICAgICBudW1GZXRjaGVkOm51bWJlcixcbiAgICAgIHV0eG9zOlVUWE9TZXQsXG4gICAgICBlbmRJbmRleDp7YWRkcmVzczpzdHJpbmcsIHV0eG86c3RyaW5nfVxuICAgIH0+ID0gYXBpLmdldFVUWE9zKGFkZHJlc3NlcywgYXBpLmdldEJsb2NrY2hhaW5JRCgpLCAwLCB1bmRlZmluZWQsIHBlcnNpc3RPcHRzKTtcbiAgICBjb25zdCBwYXlsb2FkOm9iamVjdCA9IHtcbiAgICAgIHJlc3VsdDoge1xuICAgICAgICBudW1GZXRjaGVkOjMsXG4gICAgICAgIHV0eG9zOiBbT1BVVFhPc3RyMSwgT1BVVFhPc3RyMiwgT1BVVFhPc3RyM10sXG4gICAgICAgIHN0b3BJbmRleDoge2FkZHJlc3M6IFwiYVwiLCB1dHhvOiBcImJcIn1cbiAgICAgIH0sXG4gICAgfTtcbiAgICBjb25zdCByZXNwb25zZU9iaiA9IHtcbiAgICAgIGRhdGE6IHBheWxvYWQsXG4gICAgfTtcblxuICAgIG1vY2tBeGlvcy5tb2NrUmVzcG9uc2UocmVzcG9uc2VPYmopO1xuICAgIGxldCByZXNwb25zZTpVVFhPU2V0ID0gKGF3YWl0IHJlc3VsdCkudXR4b3M7XG5cbiAgICBleHBlY3QobW9ja0F4aW9zLnJlcXVlc3QpLnRvSGF2ZUJlZW5DYWxsZWRUaW1lcygxKTtcbiAgICBleHBlY3QoSlNPTi5zdHJpbmdpZnkocmVzcG9uc2UuZ2V0QWxsVVRYT1N0cmluZ3MoKS5zb3J0KCkpKS50b0JlKEpTT04uc3RyaW5naWZ5KHNldC5nZXRBbGxVVFhPU3RyaW5ncygpLnNvcnQoKSkpO1xuXG4gICAgYWRkcmVzc2VzID0gc2V0LmdldEFkZHJlc3NlcygpLm1hcCgoYSkgPT4gYXBpLmFkZHJlc3NGcm9tQnVmZmVyKGEpKTtcbiAgICByZXN1bHQgPSAgYXBpLmdldFVUWE9zKGFkZHJlc3NlcywgYXBpLmdldEJsb2NrY2hhaW5JRCgpLCAwLCB1bmRlZmluZWQsIHBlcnNpc3RPcHRzKTtcblxuICAgIG1vY2tBeGlvcy5tb2NrUmVzcG9uc2UocmVzcG9uc2VPYmopO1xuICAgIHJlc3BvbnNlID0gKGF3YWl0IHJlc3VsdCkudXR4b3M7XG5cbiAgICBleHBlY3QobW9ja0F4aW9zLnJlcXVlc3QpLnRvSGF2ZUJlZW5DYWxsZWRUaW1lcygyKTtcbiAgICBleHBlY3QoSlNPTi5zdHJpbmdpZnkocmVzcG9uc2UuZ2V0QWxsVVRYT1N0cmluZ3MoKS5zb3J0KCkpKS50b0JlKEpTT04uc3RyaW5naWZ5KHNldC5nZXRBbGxVVFhPU3RyaW5ncygpLnNvcnQoKSkpO1xuICB9KTtcblxuXG4gIGRlc2NyaWJlKCdUcmFuc2FjdGlvbnMnLCAoKSA9PiB7XG4gICAgbGV0IHNldDpVVFhPU2V0O1xuICAgIGxldCBsc2V0OlVUWE9TZXQ7XG4gICAgbGV0IGtleW1ncjI6S2V5Q2hhaW47XG4gICAgbGV0IGtleW1ncjM6S2V5Q2hhaW47XG4gICAgbGV0IGFkZHJzMTpBcnJheTxzdHJpbmc+O1xuICAgIGxldCBhZGRyczI6QXJyYXk8c3RyaW5nPjtcbiAgICBsZXQgYWRkcnMzOkFycmF5PHN0cmluZz47XG4gICAgbGV0IGFkZHJlc3NidWZmczpBcnJheTxCdWZmZXI+ID0gW107XG4gICAgbGV0IGFkZHJlc3NlczpBcnJheTxzdHJpbmc+ID0gW107XG4gICAgbGV0IHV0eG9zOkFycmF5PFVUWE8+O1xuICAgIGxldCBsdXR4b3M6QXJyYXk8VVRYTz47XG4gICAgbGV0IGlucHV0czpBcnJheTxUcmFuc2ZlcmFibGVJbnB1dD47XG4gICAgbGV0IG91dHB1dHM6QXJyYXk8VHJhbnNmZXJhYmxlT3V0cHV0PjtcbiAgICBjb25zdCBhbW50Om51bWJlciA9IDEwMDAwO1xuICAgIGNvbnN0IGFzc2V0SUQ6QnVmZmVyID0gQnVmZmVyLmZyb20oY3JlYXRlSGFzaCgnc2hhMjU2JykudXBkYXRlKCdtYXJ5IGhhZCBhIGxpdHRsZSBsYW1iJykuZGlnZXN0KCkpO1xuICAgIGNvbnN0IE5GVGFzc2V0SUQ6QnVmZmVyID0gQnVmZmVyLmZyb20oY3JlYXRlSGFzaCgnc2hhMjU2JykudXBkYXRlKFwiSSBjYW4ndCBzdGFuZCBpdCwgSSBrbm93IHlvdSBwbGFubmVkIGl0LCBJJ21tYSBzZXQgc3RyYWlnaHQgdGhpcyBXYXRlcmdhdGUuJ1wiKS5kaWdlc3QoKSk7XG4gICAgbGV0IHNlY3BiYXNlMTpTRUNQVHJhbnNmZXJPdXRwdXQ7XG4gICAgbGV0IHNlY3BiYXNlMjpTRUNQVHJhbnNmZXJPdXRwdXQ7XG4gICAgbGV0IHNlY3BiYXNlMzpTRUNQVHJhbnNmZXJPdXRwdXQ7XG4gICAgbGV0IGZ1bmd1dHhvaWRzOkFycmF5PHN0cmluZz4gPSBbXTtcbiAgICBsZXQgcGxhdGZvcm12bTpQbGF0Zm9ybVZNQVBJO1xuICAgIGNvbnN0IGZlZTpudW1iZXIgPSAxMDtcbiAgICBjb25zdCBuYW1lOnN0cmluZyA9ICdNb3J0eWNvaW4gaXMgdGhlIGR1bWIgYXMgYSBzYWNrIG9mIGhhbW1lcnMuJztcbiAgICBjb25zdCBzeW1ib2w6c3RyaW5nID0gJ21vclQnO1xuICAgIGNvbnN0IGRlbm9taW5hdGlvbjpudW1iZXIgPSA4O1xuXG4gICAgYmVmb3JlRWFjaChhc3luYyAoKSA9PiB7XG4gICAgICBwbGF0Zm9ybXZtID0gbmV3IFBsYXRmb3JtVk1BUEkoYXZhbGFuY2hlLCBcIi9leHQvYmMvUFwiKTtcbiAgICAgIGNvbnN0IHJlc3VsdDpQcm9taXNlPEJ1ZmZlcj4gPSBwbGF0Zm9ybXZtLmdldEFWQVhBc3NldElEKCk7XG4gICAgICBjb25zdCBwYXlsb2FkOm9iamVjdCA9IHtcbiAgICAgICAgcmVzdWx0OiB7XG4gICAgICAgICAgbmFtZSxcbiAgICAgICAgICBzeW1ib2wsXG4gICAgICAgICAgYXNzZXRJRDogYmludG9vbHMuY2I1OEVuY29kZShhc3NldElEKSxcbiAgICAgICAgICBkZW5vbWluYXRpb246IGAke2Rlbm9taW5hdGlvbn1gLFxuICAgICAgICB9LFxuICAgICAgfTtcbiAgICAgIGNvbnN0IHJlc3BvbnNlT2JqID0ge1xuICAgICAgICBkYXRhOiBwYXlsb2FkLFxuICAgICAgfTtcblxuICAgICAgbW9ja0F4aW9zLm1vY2tSZXNwb25zZShyZXNwb25zZU9iaik7XG4gICAgICBhd2FpdCByZXN1bHQ7XG4gICAgICBzZXQgPSBuZXcgVVRYT1NldCgpO1xuICAgICAgbHNldCA9IG5ldyBVVFhPU2V0O1xuICAgICAgcGxhdGZvcm12bS5uZXdLZXlDaGFpbigpO1xuICAgICAga2V5bWdyMiA9IG5ldyBLZXlDaGFpbihhdmFsYW5jaGUuZ2V0SFJQKCksIGFsaWFzKTtcbiAgICAgIGtleW1ncjMgPSBuZXcgS2V5Q2hhaW4oYXZhbGFuY2hlLmdldEhSUCgpLCBhbGlhcyk7XG4gICAgICBhZGRyczEgPSBbXTtcbiAgICAgIGFkZHJzMiA9IFtdO1xuICAgICAgYWRkcnMzID0gW107XG4gICAgICB1dHhvcyA9IFtdO1xuICAgICAgbHV0eG9zID0gW107XG4gICAgICBpbnB1dHMgPSBbXTtcbiAgICAgIG91dHB1dHMgPSBbXTtcbiAgICAgIGZ1bmd1dHhvaWRzID0gW107XG4gICAgICBjb25zdCBwbG9hZDpCdWZmZXIgPSBCdWZmZXIuYWxsb2MoMTAyNCk7XG4gICAgICBwbG9hZC53cml0ZShcIkFsbCB5b3UgVHJla2tpZXMgYW5kIFRWIGFkZGljdHMsIERvbid0IG1lYW4gdG8gZGlzcyBkb24ndCBtZWFuIHRvIGJyaW5nIHN0YXRpYy5cIiwgMCwgMTAyNCwgJ3V0ZjgnKTtcblxuICAgICAgZm9yIChsZXQgaTpudW1iZXIgPSAwOyBpIDwgMzsgaSsrKSB7XG4gICAgICAgIGFkZHJzMS5wdXNoKHBsYXRmb3Jtdm0uYWRkcmVzc0Zyb21CdWZmZXIocGxhdGZvcm12bS5rZXlDaGFpbigpLm1ha2VLZXkoKS5nZXRBZGRyZXNzKCkpKTtcbiAgICAgICAgYWRkcnMyLnB1c2gocGxhdGZvcm12bS5hZGRyZXNzRnJvbUJ1ZmZlcihrZXltZ3IyLm1ha2VLZXkoKS5nZXRBZGRyZXNzKCkpKTtcbiAgICAgICAgYWRkcnMzLnB1c2gocGxhdGZvcm12bS5hZGRyZXNzRnJvbUJ1ZmZlcihrZXltZ3IzLm1ha2VLZXkoKS5nZXRBZGRyZXNzKCkpKTtcbiAgICAgIH1cbiAgICAgIGNvbnN0IGFtb3VudDpCTiA9IE9ORUFWQVgubXVsKG5ldyBCTihhbW50KSk7XG4gICAgICBhZGRyZXNzYnVmZnMgPSBwbGF0Zm9ybXZtLmtleUNoYWluKCkuZ2V0QWRkcmVzc2VzKCk7XG4gICAgICBhZGRyZXNzZXMgPSBhZGRyZXNzYnVmZnMubWFwKChhKSA9PiBwbGF0Zm9ybXZtLmFkZHJlc3NGcm9tQnVmZmVyKGEpKTtcbiAgICAgIGNvbnN0IGxvY2t0aW1lOkJOID0gbmV3IEJOKDU0MzIxKTtcbiAgICAgIGNvbnN0IHRocmVzaG9sZDpudW1iZXIgPSAzO1xuICAgICAgZm9yIChsZXQgaTpudW1iZXIgPSAwOyBpIDwgNTsgaSsrKSB7XG4gICAgICAgIGxldCB0eGlkOkJ1ZmZlciA9IEJ1ZmZlci5mcm9tKGNyZWF0ZUhhc2goJ3NoYTI1NicpLnVwZGF0ZShiaW50b29scy5mcm9tQk5Ub0J1ZmZlcihuZXcgQk4oaSksIDMyKSkuZGlnZXN0KCkpO1xuICAgICAgICBsZXQgdHhpZHg6QnVmZmVyID0gQnVmZmVyLmFsbG9jKDQpO1xuICAgICAgICB0eGlkeC53cml0ZVVJbnQzMkJFKGksIDApO1xuICAgICAgICBcbiAgICAgICAgY29uc3Qgb3V0OlNFQ1BUcmFuc2Zlck91dHB1dCA9IG5ldyBTRUNQVHJhbnNmZXJPdXRwdXQoYW1vdW50LCBhZGRyZXNzYnVmZnMsIGxvY2t0aW1lLCB0aHJlc2hvbGQpO1xuICAgICAgICBjb25zdCB4ZmVyb3V0OlRyYW5zZmVyYWJsZU91dHB1dCA9IG5ldyBUcmFuc2ZlcmFibGVPdXRwdXQoYXNzZXRJRCwgb3V0KTtcbiAgICAgICAgb3V0cHV0cy5wdXNoKHhmZXJvdXQpO1xuXG4gICAgICAgIGNvbnN0IHU6VVRYTyA9IG5ldyBVVFhPKCk7XG4gICAgICAgIHUuZnJvbUJ1ZmZlcihCdWZmZXIuY29uY2F0KFt1LmdldENvZGVjSURCdWZmZXIoKSwgdHhpZCwgdHhpZHgsIHhmZXJvdXQudG9CdWZmZXIoKV0pKTtcbiAgICAgICAgZnVuZ3V0eG9pZHMucHVzaCh1LmdldFVUWE9JRCgpKTtcbiAgICAgICAgdXR4b3MucHVzaCh1KTtcblxuICAgICAgICB0eGlkID0gdS5nZXRUeElEKCk7XG4gICAgICAgIHR4aWR4ID0gdS5nZXRPdXRwdXRJZHgoKTtcbiAgICAgICAgY29uc3QgYXNzZXQgPSB1LmdldEFzc2V0SUQoKTtcblxuICAgICAgICBjb25zdCBpbnB1dDpTRUNQVHJhbnNmZXJJbnB1dCA9IG5ldyBTRUNQVHJhbnNmZXJJbnB1dChhbW91bnQpO1xuICAgICAgICBjb25zdCB4ZmVyaW5wdXQ6VHJhbnNmZXJhYmxlSW5wdXQgPSBuZXcgVHJhbnNmZXJhYmxlSW5wdXQodHhpZCwgdHhpZHgsIGFzc2V0LCBpbnB1dCk7XG4gICAgICAgIGlucHV0cy5wdXNoKHhmZXJpbnB1dCk7XG4gICAgICB9XG4gICAgICBzZXQuYWRkQXJyYXkodXR4b3MpO1xuICAgICAgZm9yIChsZXQgaTpudW1iZXIgPSAwOyBpIDwgNDsgaSsrKSB7XG4gICAgICAgIGxldCB0eGlkOkJ1ZmZlciA9IEJ1ZmZlci5mcm9tKGNyZWF0ZUhhc2goJ3NoYTI1NicpLnVwZGF0ZShiaW50b29scy5mcm9tQk5Ub0J1ZmZlcihuZXcgQk4oaSksIDMyKSkuZGlnZXN0KCkpO1xuICAgICAgICBsZXQgdHhpZHg6QnVmZmVyID0gQnVmZmVyLmFsbG9jKDQpO1xuICAgICAgICB0eGlkeC53cml0ZVVJbnQzMkJFKGksIDApO1xuICAgICAgICBcbiAgICAgICAgY29uc3Qgb3V0OlNFQ1BUcmFuc2Zlck91dHB1dCA9IG5ldyBTRUNQVHJhbnNmZXJPdXRwdXQoT05FQVZBWC5tdWwobmV3IEJOKDUpKSwgYWRkcmVzc2J1ZmZzLCBsb2NrdGltZSwgMSk7XG4gICAgICAgIGNvbnN0IHBvdXQ6UGFyc2VhYmxlT3V0cHV0ID0gbmV3IFBhcnNlYWJsZU91dHB1dChvdXQpO1xuICAgICAgICBjb25zdCBsb2Nrb3V0OlN0YWtlYWJsZUxvY2tPdXQgPSBuZXcgU3Rha2VhYmxlTG9ja091dChPTkVBVkFYLm11bChuZXcgQk4oNSkpLCBhZGRyZXNzYnVmZnMsIGxvY2t0aW1lLCAxLCBsb2NrdGltZS5hZGQobmV3IEJOKDg2NDAwKSksIHBvdXQpO1xuICAgICAgICBjb25zdCB4ZmVyb3V0OlRyYW5zZmVyYWJsZU91dHB1dCA9IG5ldyBUcmFuc2ZlcmFibGVPdXRwdXQoYXNzZXRJRCwgbG9ja291dCk7XG5cbiAgICAgICAgY29uc3QgdTpVVFhPID0gbmV3IFVUWE8oKTtcbiAgICAgICAgdS5mcm9tQnVmZmVyKEJ1ZmZlci5jb25jYXQoW3UuZ2V0Q29kZWNJREJ1ZmZlcigpLCB0eGlkLCB0eGlkeCwgeGZlcm91dC50b0J1ZmZlcigpXSkpO1xuICAgICAgICBsdXR4b3MucHVzaCh1KTtcbiAgICAgIH1cbiAgICAgIFxuICAgICAgbHNldC5hZGRBcnJheShsdXR4b3MpO1xuICAgICAgbHNldC5hZGRBcnJheShzZXQuZ2V0QWxsVVRYT3MoKSk7XG4gICAgICBcblxuICAgICAgc2VjcGJhc2UxID0gbmV3IFNFQ1BUcmFuc2Zlck91dHB1dChuZXcgQk4oNzc3KSwgYWRkcnMzLm1hcCgoYSkgPT4gcGxhdGZvcm12bS5wYXJzZUFkZHJlc3MoYSkpLCBVbml4Tm93KCksIDEpO1xuICAgICAgc2VjcGJhc2UyID0gbmV3IFNFQ1BUcmFuc2Zlck91dHB1dChuZXcgQk4oODg4KSwgYWRkcnMyLm1hcCgoYSkgPT4gcGxhdGZvcm12bS5wYXJzZUFkZHJlc3MoYSkpLCBVbml4Tm93KCksIDEpO1xuICAgICAgc2VjcGJhc2UzID0gbmV3IFNFQ1BUcmFuc2Zlck91dHB1dChuZXcgQk4oOTk5KSwgYWRkcnMyLm1hcCgoYSkgPT4gcGxhdGZvcm12bS5wYXJzZUFkZHJlc3MoYSkpLCBVbml4Tm93KCksIDEpO1xuXG4gICAgfSk7XG5cbiAgICB0ZXN0KCdzaWduVHgnLCBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCBhc3NldElEID0gYXdhaXQgcGxhdGZvcm12bS5nZXRBVkFYQXNzZXRJRCgpO1xuICAgICAgY29uc3QgdHh1MjpVbnNpZ25lZFR4ID0gc2V0LmJ1aWxkQmFzZVR4KFxuICAgICAgICBuZXR3b3JraWQsIGJpbnRvb2xzLmNiNThEZWNvZGUoYmxvY2tjaGFpbmlkKSwgbmV3IEJOKGFtbnQpLCBhc3NldElELFxuICAgICAgICBhZGRyczMubWFwKChhKSA9PiBwbGF0Zm9ybXZtLnBhcnNlQWRkcmVzcyhhKSksXG4gICAgICAgIGFkZHJzMS5tYXAoKGEpID0+IHBsYXRmb3Jtdm0ucGFyc2VBZGRyZXNzKGEpKSxcbiAgICAgICAgYWRkcnMxLm1hcCgoYSkgPT4gcGxhdGZvcm12bS5wYXJzZUFkZHJlc3MoYSkpLFxuICAgICAgICBwbGF0Zm9ybXZtLmdldFR4RmVlKCksIGFzc2V0SUQsXG4gICAgICAgIHVuZGVmaW5lZCwgVW5peE5vdygpLCBuZXcgQk4oMCksIDEsXG4gICAgICApO1xuXG4gICAgICBjb25zdCB0eDI6VHggPSB0eHUyLnNpZ24ocGxhdGZvcm12bS5rZXlDaGFpbigpKTtcbiAgICB9KTtcblxuICAgIHRlc3QoJ2J1aWxkSW1wb3J0VHgnLCBhc3luYyAoKSA9PiB7XG4gICAgICBsZXQgbG9ja3RpbWU6Qk4gPSBuZXcgQk4oMCk7XG4gICAgICBsZXQgdGhyZXNob2xkOm51bWJlciA9IDE7XG4gICAgICBwbGF0Zm9ybXZtLnNldFR4RmVlKG5ldyBCTihmZWUpKTtcbiAgICAgIGNvbnN0IGFkZHJidWZmMSA9IGFkZHJzMS5tYXAoKGEpID0+IHBsYXRmb3Jtdm0ucGFyc2VBZGRyZXNzKGEpKTtcbiAgICAgIGNvbnN0IGFkZHJidWZmMiA9IGFkZHJzMi5tYXAoKGEpID0+IHBsYXRmb3Jtdm0ucGFyc2VBZGRyZXNzKGEpKTtcbiAgICAgIGNvbnN0IGFkZHJidWZmMyA9IGFkZHJzMy5tYXAoKGEpID0+IHBsYXRmb3Jtdm0ucGFyc2VBZGRyZXNzKGEpKTtcbiAgICAgIGNvbnN0IGZ1bmd1dHhvOlVUWE8gPSBzZXQuZ2V0VVRYTyhmdW5ndXR4b2lkc1sxXSk7XG4gICAgICBjb25zdCBmdW5ndXR4b3N0cjpzdHJpbmcgPSBmdW5ndXR4by50b1N0cmluZygpO1xuXG4gICAgICBjb25zdCByZXN1bHQ6UHJvbWlzZTxVbnNpZ25lZFR4PiA9IHBsYXRmb3Jtdm0uYnVpbGRJbXBvcnRUeChcbiAgICAgICAgc2V0LGFkZHJzMSwgUGxhdGZvcm1DaGFpbklELCBhZGRyczMsIGFkZHJzMSwgYWRkcnMyLCBuZXcgVVRGOFBheWxvYWQoXCJoZWxsbyB3b3JsZFwiKSwgVW5peE5vdygpLCBsb2NrdGltZSwgdGhyZXNob2xkXG4gICAgICApO1xuICAgICAgY29uc3QgcGF5bG9hZDpvYmplY3QgPSB7XG4gICAgICAgIHJlc3VsdDoge1xuICAgICAgICAgIHV0eG9zOltmdW5ndXR4b3N0cl1cbiAgICAgICAgfSxcbiAgICAgIH07XG4gICAgICBjb25zdCByZXNwb25zZU9iaiA9IHtcbiAgICAgICAgZGF0YTogcGF5bG9hZCxcbiAgICAgIH07XG5cbiAgICAgIG1vY2tBeGlvcy5tb2NrUmVzcG9uc2UocmVzcG9uc2VPYmopO1xuICAgICAgY29uc3QgdHh1MTpVbnNpZ25lZFR4ID0gYXdhaXQgcmVzdWx0O1xuXG4gICAgICBjb25zdCB0eHUyOlVuc2lnbmVkVHggPSBzZXQuYnVpbGRJbXBvcnRUeChcbiAgICAgICAgbmV0d29ya2lkLCBiaW50b29scy5jYjU4RGVjb2RlKGJsb2NrY2hhaW5pZCksIFxuICAgICAgICBhZGRyYnVmZjMsIGFkZHJidWZmMSwgYWRkcmJ1ZmYyLCBbZnVuZ3V0eG9dLCBiaW50b29scy5jYjU4RGVjb2RlKFBsYXRmb3JtQ2hhaW5JRCksIHBsYXRmb3Jtdm0uZ2V0VHhGZWUoKSwgYXdhaXQgcGxhdGZvcm12bS5nZXRBVkFYQXNzZXRJRCgpLCBcbiAgICAgICAgbmV3IFVURjhQYXlsb2FkKFwiaGVsbG8gd29ybGRcIikuZ2V0UGF5bG9hZCgpLCBVbml4Tm93KCksIGxvY2t0aW1lLCB0aHJlc2hvbGRcbiAgICAgICk7XG5cbiAgICAgIGV4cGVjdCh0eHUyLnRvQnVmZmVyKCkudG9TdHJpbmcoJ2hleCcpKS50b0JlKHR4dTEudG9CdWZmZXIoKS50b1N0cmluZygnaGV4JykpO1xuICAgICAgZXhwZWN0KHR4dTIudG9TdHJpbmcoKSkudG9CZSh0eHUxLnRvU3RyaW5nKCkpO1xuXG4gICAgICBsZXQgdHgxOlR4ID0gdHh1MS5zaWduKHBsYXRmb3Jtdm0ua2V5Q2hhaW4oKSk7XG4gICAgICBsZXQgY2hlY2tUeDpzdHJpbmcgPSB0eDEudG9CdWZmZXIoKS50b1N0cmluZyhcImhleFwiKTtcbiAgICAgIGxldCB0eDFvYmo6b2JqZWN0ID0gdHgxLnNlcmlhbGl6ZShcImhleFwiKTtcbiAgICAgIGxldCB0eDFzdHI6c3RyaW5nID0gSlNPTi5zdHJpbmdpZnkodHgxb2JqKTtcbiAgICAgIFxuICAgICAgbGV0IHR4Mm5ld29iajpvYmplY3QgPSBKU09OLnBhcnNlKHR4MXN0cik7XG4gICAgICBsZXQgdHgyOlR4ID0gbmV3IFR4KCk7XG4gICAgICB0eDIuZGVzZXJpYWxpemUodHgybmV3b2JqLCBcImhleFwiKTtcbiAgICAgIFxuICAgICAgZXhwZWN0KHR4Mi50b0J1ZmZlcigpLnRvU3RyaW5nKFwiaGV4XCIpKS50b0JlKGNoZWNrVHgpO1xuXG4gICAgICBsZXQgdHgzOlR4ID0gdHh1MS5zaWduKHBsYXRmb3Jtdm0ua2V5Q2hhaW4oKSk7XG4gICAgICBsZXQgdHgzb2JqOm9iamVjdCA9IHR4My5zZXJpYWxpemUoXCJkaXNwbGF5XCIpO1xuICAgICAgbGV0IHR4M3N0cjpzdHJpbmcgPSBKU09OLnN0cmluZ2lmeSh0eDNvYmopO1xuICAgICAgXG4gICAgICBsZXQgdHg0bmV3b2JqOm9iamVjdCA9IEpTT04ucGFyc2UodHgzc3RyKTtcbiAgICAgIGxldCB0eDQ6VHggPSBuZXcgVHgoKTtcbiAgICAgIHR4NC5kZXNlcmlhbGl6ZSh0eDRuZXdvYmosIFwiZGlzcGxheVwiKTtcbiAgICAgIFxuICAgICAgZXhwZWN0KHR4NC50b0J1ZmZlcigpLnRvU3RyaW5nKFwiaGV4XCIpKS50b0JlKGNoZWNrVHgpO1xuXG4gICAgICBzZXJpYWx6ZWl0KHR4MSwgXCJJbXBvcnRUeFwiKTtcbiAgICB9KTtcblxuICAgIHRlc3QoJ2J1aWxkRXhwb3J0VHgnLCBhc3luYyAoKSA9PiB7XG5cbiAgICAgIHBsYXRmb3Jtdm0uc2V0VHhGZWUobmV3IEJOKGZlZSkpO1xuICAgICAgY29uc3QgYWRkcmJ1ZmYxID0gYWRkcnMxLm1hcCgoYSkgPT4gcGxhdGZvcm12bS5wYXJzZUFkZHJlc3MoYSkpO1xuICAgICAgY29uc3QgYWRkcmJ1ZmYyID0gYWRkcnMyLm1hcCgoYSkgPT4gcGxhdGZvcm12bS5wYXJzZUFkZHJlc3MoYSkpO1xuICAgICAgY29uc3QgYWRkcmJ1ZmYzID0gYWRkcnMzLm1hcCgoYSkgPT4gcGxhdGZvcm12bS5wYXJzZUFkZHJlc3MoYSkpO1xuICAgICAgY29uc3QgYW1vdW50OkJOID0gbmV3IEJOKDkwKTtcbiAgICAgIGNvbnN0IHR4dTE6VW5zaWduZWRUeCA9IGF3YWl0IHBsYXRmb3Jtdm0uYnVpbGRFeHBvcnRUeChcbiAgICAgICAgc2V0LCBcbiAgICAgICAgYW1vdW50LFxuICAgICAgICBiaW50b29scy5jYjU4RGVjb2RlKERlZmF1bHRzLm5ldHdvcmtbYXZhbGFuY2hlLmdldE5ldHdvcmtJRCgpXS5YW1wiYmxvY2tjaGFpbklEXCJdKSxcbiAgICAgICAgYWRkcmJ1ZmYzLm1hcCgoYSkgPT4gYmludG9vbHMuYWRkcmVzc1RvU3RyaW5nKGF2YWxhbmNoZS5nZXRIUlAoKSwgXCJQXCIsIGEpKSwgXG4gICAgICAgIGFkZHJzMSwgXG4gICAgICAgIGFkZHJzMixcbiAgICAgICAgbmV3IFVURjhQYXlsb2FkKFwiaGVsbG8gd29ybGRcIiksIFVuaXhOb3coKVxuICAgICAgKTtcblxuICAgICAgY29uc3QgdHh1MjpVbnNpZ25lZFR4ID0gc2V0LmJ1aWxkRXhwb3J0VHgoXG4gICAgICAgIG5ldHdvcmtpZCwgYmludG9vbHMuY2I1OERlY29kZShibG9ja2NoYWluaWQpLFxuICAgICAgICBhbW91bnQsXG4gICAgICAgIGFzc2V0SUQsIFxuICAgICAgICBhZGRyYnVmZjMsIFxuICAgICAgICBhZGRyYnVmZjEsIFxuICAgICAgICBhZGRyYnVmZjIsIFxuICAgICAgICBiaW50b29scy5jYjU4RGVjb2RlKERlZmF1bHRzLm5ldHdvcmtbYXZhbGFuY2hlLmdldE5ldHdvcmtJRCgpXS5YW1wiYmxvY2tjaGFpbklEXCJdKSwgXG4gICAgICAgIHBsYXRmb3Jtdm0uZ2V0VHhGZWUoKSwgXG4gICAgICAgIGFzc2V0SUQsXG4gICAgICAgIG5ldyBVVEY4UGF5bG9hZChcImhlbGxvIHdvcmxkXCIpLmdldFBheWxvYWQoKSwgVW5peE5vdygpXG4gICAgICApO1xuXG4gICAgICBleHBlY3QodHh1Mi50b0J1ZmZlcigpLnRvU3RyaW5nKCdoZXgnKSkudG9CZSh0eHUxLnRvQnVmZmVyKCkudG9TdHJpbmcoJ2hleCcpKTtcbiAgICAgIGV4cGVjdCh0eHUyLnRvU3RyaW5nKCkpLnRvQmUodHh1MS50b1N0cmluZygpKTtcblxuICAgICAgY29uc3QgdHh1MzpVbnNpZ25lZFR4ID0gYXdhaXQgcGxhdGZvcm12bS5idWlsZEV4cG9ydFR4KFxuICAgICAgICBzZXQsIGFtb3VudCwgYmludG9vbHMuY2I1OERlY29kZShEZWZhdWx0cy5uZXR3b3JrW2F2YWxhbmNoZS5nZXROZXR3b3JrSUQoKV0uWFtcImJsb2NrY2hhaW5JRFwiXSksIFxuICAgICAgICBhZGRyczMsIGFkZHJzMSwgYWRkcnMyLCBcbiAgICAgICAgbmV3IFVURjhQYXlsb2FkKFwiaGVsbG8gd29ybGRcIiksIFVuaXhOb3coKVxuICAgICAgKTtcblxuICAgICAgY29uc3QgdHh1NDpVbnNpZ25lZFR4ID0gc2V0LmJ1aWxkRXhwb3J0VHgoXG4gICAgICAgIG5ldHdvcmtpZCwgYmludG9vbHMuY2I1OERlY29kZShibG9ja2NoYWluaWQpLCBhbW91bnQsXG4gICAgICAgIGFzc2V0SUQsIGFkZHJidWZmMywgYWRkcmJ1ZmYxLCBhZGRyYnVmZjIsIHVuZGVmaW5lZCwgcGxhdGZvcm12bS5nZXRUeEZlZSgpLCBhc3NldElELCBcbiAgICAgICAgbmV3IFVURjhQYXlsb2FkKFwiaGVsbG8gd29ybGRcIikuZ2V0UGF5bG9hZCgpLCBVbml4Tm93KClcbiAgICAgICk7XG5cbiAgICAgIGV4cGVjdCh0eHU0LnRvQnVmZmVyKCkudG9TdHJpbmcoJ2hleCcpKS50b0JlKHR4dTMudG9CdWZmZXIoKS50b1N0cmluZygnaGV4JykpO1xuICAgICAgZXhwZWN0KHR4dTQudG9TdHJpbmcoKSkudG9CZSh0eHUzLnRvU3RyaW5nKCkpO1xuXG5cbiAgICAgIGV4cGVjdCh0eHUyLnRvQnVmZmVyKCkudG9TdHJpbmcoJ2hleCcpKS50b0JlKHR4dTEudG9CdWZmZXIoKS50b1N0cmluZygnaGV4JykpO1xuICAgICAgZXhwZWN0KHR4dTIudG9TdHJpbmcoKSkudG9CZSh0eHUxLnRvU3RyaW5nKCkpO1xuXG4gICAgICBsZXQgdHgxOlR4ID0gdHh1MS5zaWduKHBsYXRmb3Jtdm0ua2V5Q2hhaW4oKSk7XG4gICAgICBsZXQgY2hlY2tUeDpzdHJpbmcgPSB0eDEudG9CdWZmZXIoKS50b1N0cmluZyhcImhleFwiKTtcbiAgICAgIGxldCB0eDFvYmo6b2JqZWN0ID0gdHgxLnNlcmlhbGl6ZShcImhleFwiKTtcbiAgICAgIGxldCB0eDFzdHI6c3RyaW5nID0gSlNPTi5zdHJpbmdpZnkodHgxb2JqKTtcblxuICAgICAgbGV0IHR4Mm5ld29iajpvYmplY3QgPSBKU09OLnBhcnNlKHR4MXN0cik7XG4gICAgICBsZXQgdHgyOlR4ID0gbmV3IFR4KCk7XG4gICAgICB0eDIuZGVzZXJpYWxpemUodHgybmV3b2JqLCBcImhleFwiKTtcblxuICAgICAgZXhwZWN0KHR4Mi50b0J1ZmZlcigpLnRvU3RyaW5nKFwiaGV4XCIpKS50b0JlKGNoZWNrVHgpO1xuXG4gICAgICBsZXQgdHgzOlR4ID0gdHh1MS5zaWduKHBsYXRmb3Jtdm0ua2V5Q2hhaW4oKSk7XG4gICAgICBsZXQgdHgzb2JqOm9iamVjdCA9IHR4My5zZXJpYWxpemUoXCJkaXNwbGF5XCIpO1xuICAgICAgbGV0IHR4M3N0cjpzdHJpbmcgPSBKU09OLnN0cmluZ2lmeSh0eDNvYmopO1xuICAgICAgXG4gICAgICBsZXQgdHg0bmV3b2JqOm9iamVjdCA9IEpTT04ucGFyc2UodHgzc3RyKTtcbiAgICAgIGxldCB0eDQ6VHggPSBuZXcgVHgoKTtcbiAgICAgIHR4NC5kZXNlcmlhbGl6ZSh0eDRuZXdvYmosIFwiZGlzcGxheVwiKTtcblxuICAgICAgZXhwZWN0KHR4NC50b0J1ZmZlcigpLnRvU3RyaW5nKFwiaGV4XCIpKS50b0JlKGNoZWNrVHgpO1xuXG4gICAgICBzZXJpYWx6ZWl0KHR4MSwgXCJFeHBvcnRUeFwiKTtcblxuICAgIH0pO1xuLypcbiAgICB0ZXN0KCdidWlsZEFkZFN1Ym5ldFZhbGlkYXRvclR4JywgYXN5bmMgKCkgPT4ge1xuICAgICAgcGxhdGZvcm12bS5zZXRGZWUobmV3IEJOKGZlZSkpO1xuICAgICAgY29uc3QgYWRkcmJ1ZmYxID0gYWRkcnMxLm1hcCgoYSkgPT4gcGxhdGZvcm12bS5wYXJzZUFkZHJlc3MoYSkpO1xuICAgICAgY29uc3QgYWRkcmJ1ZmYyID0gYWRkcnMyLm1hcCgoYSkgPT4gcGxhdGZvcm12bS5wYXJzZUFkZHJlc3MoYSkpO1xuICAgICAgY29uc3QgYWRkcmJ1ZmYzID0gYWRkcnMzLm1hcCgoYSkgPT4gcGxhdGZvcm12bS5wYXJzZUFkZHJlc3MoYSkpO1xuICAgICAgY29uc3QgYW1vdW50OkJOID0gbmV3IEJOKDkwKTtcblxuICAgICAgY29uc3QgdHh1MTpVbnNpZ25lZFR4ID0gYXdhaXQgcGxhdGZvcm12bS5idWlsZEFkZFN1Ym5ldFZhbGlkYXRvclR4KFxuICAgICAgICBzZXQsICBcbiAgICAgICAgYWRkcnMxLCBcbiAgICAgICAgYWRkcnMyLCBcbiAgICAgICAgbm9kZUlELCBcbiAgICAgICAgc3RhcnRUaW1lLFxuICAgICAgICBlbmRUaW1lLFxuICAgICAgICBQbGF0Zm9ybVZNQ29uc3RhbnRzLk1JTlNUQUtFLFxuICAgICAgICBuZXcgVVRGOFBheWxvYWQoXCJoZWxsbyB3b3JsZFwiKSwgVW5peE5vdygpXG4gICAgICApO1xuXG4gICAgICBjb25zdCB0eHUyOlVuc2lnbmVkVHggPSBzZXQuYnVpbGRBZGRTdWJuZXRWYWxpZGF0b3JUeChcbiAgICAgICAgbmV0d29ya2lkLCBiaW50b29scy5jYjU4RGVjb2RlKGJsb2NrY2hhaW5pZCksIFxuICAgICAgICBhZGRyYnVmZjEsICAgICAgICAgXG4gICAgICAgIGFkZHJidWZmMiwgXG4gICAgICAgIE5vZGVJRFN0cmluZ1RvQnVmZmVyKG5vZGVJRCksIFxuICAgICAgICBzdGFydFRpbWUsXG4gICAgICAgIGVuZFRpbWUsXG4gICAgICAgIFBsYXRmb3JtVk1Db25zdGFudHMuTUlOU1RBS0UsXG4gICAgICAgIHBsYXRmb3Jtdm0uZ2V0RmVlKCksIFxuICAgICAgICBhc3NldElELFxuICAgICAgICBuZXcgVVRGOFBheWxvYWQoXCJoZWxsbyB3b3JsZFwiKS5nZXRQYXlsb2FkKCksIFVuaXhOb3coKVxuICAgICAgKTtcbiAgICAgIGV4cGVjdCh0eHUyLnRvQnVmZmVyKCkudG9TdHJpbmcoJ2hleCcpKS50b0JlKHR4dTEudG9CdWZmZXIoKS50b1N0cmluZygnaGV4JykpO1xuICAgICAgZXhwZWN0KHR4dTIudG9TdHJpbmcoKSkudG9CZSh0eHUxLnRvU3RyaW5nKCkpO1xuXG4gICAgfSk7XG4qL1xuICAgIHRlc3QoJ2J1aWxkQWRkRGVsZWdhdG9yVHggMScsIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IGFkZHJidWZmMSA9IGFkZHJzMS5tYXAoKGEpID0+IHBsYXRmb3Jtdm0ucGFyc2VBZGRyZXNzKGEpKTtcbiAgICAgIGNvbnN0IGFkZHJidWZmMiA9IGFkZHJzMi5tYXAoKGEpID0+IHBsYXRmb3Jtdm0ucGFyc2VBZGRyZXNzKGEpKTtcbiAgICAgIGNvbnN0IGFkZHJidWZmMyA9IGFkZHJzMy5tYXAoKGEpID0+IHBsYXRmb3Jtdm0ucGFyc2VBZGRyZXNzKGEpKTtcbiAgICAgIGNvbnN0IGFtb3VudDpCTiA9IERlZmF1bHRzLm5ldHdvcmtbbmV0d29ya2lkXVtcIlBcIl0ubWluRGVsZWdhdGlvblN0YWtlO1xuXG4gICAgICBjb25zdCBsb2NrdGltZTpCTiA9IG5ldyBCTig1NDMyMSk7XG4gICAgICBjb25zdCB0aHJlc2hvbGQ6bnVtYmVyID0gMjtcblxuICAgICAgcGxhdGZvcm12bS5zZXRNaW5TdGFrZShEZWZhdWx0cy5uZXR3b3JrW25ldHdvcmtpZF1bXCJQXCJdLm1pblN0YWtlLCBEZWZhdWx0cy5uZXR3b3JrW25ldHdvcmtpZF1bXCJQXCJdLm1pbkRlbGVnYXRpb25TdGFrZSk7XG5cbiAgICAgIGNvbnN0IHR4dTE6VW5zaWduZWRUeCA9IGF3YWl0IHBsYXRmb3Jtdm0uYnVpbGRBZGREZWxlZ2F0b3JUeChcbiAgICAgICAgc2V0LCBcbiAgICAgICAgYWRkcnMzLFxuICAgICAgICBhZGRyczEsIFxuICAgICAgICBhZGRyczIsIFxuICAgICAgICBub2RlSUQsIFxuICAgICAgICBzdGFydFRpbWUsXG4gICAgICAgIGVuZFRpbWUsXG4gICAgICAgIGFtb3VudCxcbiAgICAgICAgYWRkcnMzLCBcbiAgICAgICAgbG9ja3RpbWUsXG4gICAgICAgIHRocmVzaG9sZCxcbiAgICAgICAgbmV3IFVURjhQYXlsb2FkKFwiaGVsbG8gd29ybGRcIiksIFVuaXhOb3coKVxuICAgICAgKTtcblxuICAgICAgY29uc3QgdHh1MjpVbnNpZ25lZFR4ID0gc2V0LmJ1aWxkQWRkRGVsZWdhdG9yVHgoXG4gICAgICAgIG5ldHdvcmtpZCwgYmludG9vbHMuY2I1OERlY29kZShibG9ja2NoYWluaWQpLCBcbiAgICAgICAgYXNzZXRJRCxcbiAgICAgICAgYWRkcmJ1ZmYzLFxuICAgICAgICBhZGRyYnVmZjEsICAgICAgICAgXG4gICAgICAgIGFkZHJidWZmMiwgXG4gICAgICAgIE5vZGVJRFN0cmluZ1RvQnVmZmVyKG5vZGVJRCksIFxuICAgICAgICBzdGFydFRpbWUsXG4gICAgICAgIGVuZFRpbWUsXG4gICAgICAgIGFtb3VudCxcbiAgICAgICAgbG9ja3RpbWUsXG4gICAgICAgIHRocmVzaG9sZCxcbiAgICAgICAgYWRkcmJ1ZmYzLFxuICAgICAgICBuZXcgQk4oMCksIFxuICAgICAgICBhc3NldElELFxuICAgICAgICBuZXcgVVRGOFBheWxvYWQoXCJoZWxsbyB3b3JsZFwiKS5nZXRQYXlsb2FkKCksIFVuaXhOb3coKVxuICAgICAgKTtcbiAgICAgIGV4cGVjdCh0eHUyLnRvQnVmZmVyKCkudG9TdHJpbmcoJ2hleCcpKS50b0JlKHR4dTEudG9CdWZmZXIoKS50b1N0cmluZygnaGV4JykpO1xuICAgICAgZXhwZWN0KHR4dTIudG9TdHJpbmcoKSkudG9CZSh0eHUxLnRvU3RyaW5nKCkpO1xuXG4gICAgICBsZXQgdHgxOlR4ID0gdHh1MS5zaWduKHBsYXRmb3Jtdm0ua2V5Q2hhaW4oKSk7XG4gICAgICBsZXQgY2hlY2tUeDpzdHJpbmcgPSB0eDEudG9CdWZmZXIoKS50b1N0cmluZyhcImhleFwiKTtcbiAgICAgIGxldCB0eDFvYmo6b2JqZWN0ID0gdHgxLnNlcmlhbGl6ZShcImhleFwiKTtcbiAgICAgIGxldCB0eDFzdHI6c3RyaW5nID0gSlNPTi5zdHJpbmdpZnkodHgxb2JqKTtcbiAgICAgIFxuICAgICAgbGV0IHR4Mm5ld29iajpvYmplY3QgPSBKU09OLnBhcnNlKHR4MXN0cik7XG4gICAgICBsZXQgdHgyOlR4ID0gbmV3IFR4KCk7XG4gICAgICB0eDIuZGVzZXJpYWxpemUodHgybmV3b2JqLCBcImhleFwiKTtcbiAgICAgIFxuICAgICAgZXhwZWN0KHR4Mi50b0J1ZmZlcigpLnRvU3RyaW5nKFwiaGV4XCIpKS50b0JlKGNoZWNrVHgpO1xuXG4gICAgICBsZXQgdHgzOlR4ID0gdHh1MS5zaWduKHBsYXRmb3Jtdm0ua2V5Q2hhaW4oKSk7XG4gICAgICBsZXQgdHgzb2JqOm9iamVjdCA9IHR4My5zZXJpYWxpemUoXCJkaXNwbGF5XCIpO1xuICAgICAgbGV0IHR4M3N0cjpzdHJpbmcgPSBKU09OLnN0cmluZ2lmeSh0eDNvYmopO1xuICAgICAgXG4gICAgICBsZXQgdHg0bmV3b2JqOm9iamVjdCA9IEpTT04ucGFyc2UodHgzc3RyKTtcbiAgICAgIGxldCB0eDQ6VHggPSBuZXcgVHgoKTtcbiAgICAgIHR4NC5kZXNlcmlhbGl6ZSh0eDRuZXdvYmosIFwiZGlzcGxheVwiKTtcbiAgICAgIFxuICAgICAgZXhwZWN0KHR4NC50b0J1ZmZlcigpLnRvU3RyaW5nKFwiaGV4XCIpKS50b0JlKGNoZWNrVHgpO1xuXG4gICAgICBzZXJpYWx6ZWl0KHR4MSwgXCJBZGREZWxlZ2F0b3JUeFwiKTtcblxuICAgIH0pO1xuXG4gICAgdGVzdCgnYnVpbGRBZGRWYWxpZGF0b3JUeCBzb3J0IFN0YWtlYWJsZUxvY2tPdXRzIDEnLCBhc3luYyAoKSA9PiB7XG4gICAgICAvLyB0d28gVVRYTy4gVGhlIDFzdCBoYXMgYSBsZXNzZXIgc3Rha2VhYmxlbG9ja3RpbWUgYW5kIGEgZ3JlYXRlciBhbW91bnQgb2YgQVZBWC4gVGhlIDJuZCBoYXMgYSBncmVhdGVyIHN0YWtlYWJsZWxvY2t0aW1lIGFuZCBhIGxlc3NlciBhbW91bnQgb2YgQVZBWC5cbiAgICAgIC8vIFdlIGV4cGVjdCB0aGlzIHRlc3QgdG8gb25seSBjb25zdW1lIHRoZSAybmQgVVRYTyBzaW5jZSBpdCBoYXMgdGhlIGdyZWF0ZXIgbG9ja3RpbWUuXG4gICAgICBjb25zdCBhZGRyYnVmZjE6IEJ1ZmZlcltdID0gYWRkcnMxLm1hcCgoYSkgPT4gcGxhdGZvcm12bS5wYXJzZUFkZHJlc3MoYSkpO1xuICAgICAgY29uc3QgYW1vdW50MTogQk4gPSBuZXcgQk4oJzIwMDAwMDAwMDAwMDAwMDAwJyk7XG4gICAgICBjb25zdCBhbW91bnQyOiBCTiA9IG5ldyBCTignMTAwMDAwMDAwMDAwMDAwMDAnKTtcbiAgICAgIGNvbnN0IGxvY2t0aW1lMTogQk4gPSBuZXcgQk4oMCk7XG4gICAgICBjb25zdCB0aHJlc2hvbGQ6IG51bWJlciA9IDE7XG4gICAgICBcbiAgICAgIGNvbnN0IHN0YWtlYWJsZUxvY2tUaW1lMTogQk4gPSBuZXcgQk4oMTYzMzgyNDAwMCk7XG4gICAgICBjb25zdCBzZWNwVHJhbnNmZXJPdXRwdXQxOiBTRUNQVHJhbnNmZXJPdXRwdXQgPSBuZXcgU0VDUFRyYW5zZmVyT3V0cHV0KGFtb3VudDEsIGFkZHJidWZmMSwgbG9ja3RpbWUxLCB0aHJlc2hvbGQpO1xuICAgICAgY29uc3QgcGFyc2VhYmxlT3V0cHV0MTogUGFyc2VhYmxlT3V0cHV0ID0gbmV3IFBhcnNlYWJsZU91dHB1dChzZWNwVHJhbnNmZXJPdXRwdXQxKTtcbiAgICAgIGNvbnN0IHN0YWtlYWJsZUxvY2tPdXQxOiBTdGFrZWFibGVMb2NrT3V0ID0gbmV3IFN0YWtlYWJsZUxvY2tPdXQoYW1vdW50MSwgYWRkcmJ1ZmYxLCBsb2NrdGltZTEsIHRocmVzaG9sZCwgc3Rha2VhYmxlTG9ja1RpbWUxLCBwYXJzZWFibGVPdXRwdXQxKTtcbiAgICAgIGNvbnN0IHN0YWtlYWJsZUxvY2tUaW1lMjogQk4gPSBuZXcgQk4oMTczMzgyNDAwMCk7XG4gICAgICBjb25zdCBzZWNwVHJhbnNmZXJPdXRwdXQyOiBTRUNQVHJhbnNmZXJPdXRwdXQgPSBuZXcgU0VDUFRyYW5zZmVyT3V0cHV0KGFtb3VudDIsIGFkZHJidWZmMSwgbG9ja3RpbWUxLCB0aHJlc2hvbGQpO1xuICAgICAgY29uc3QgcGFyc2VhYmxlT3V0cHV0MjogUGFyc2VhYmxlT3V0cHV0ID0gbmV3IFBhcnNlYWJsZU91dHB1dChzZWNwVHJhbnNmZXJPdXRwdXQyKTtcbiAgICAgIGNvbnN0IHN0YWtlYWJsZUxvY2tPdXQyOiBTdGFrZWFibGVMb2NrT3V0ID0gbmV3IFN0YWtlYWJsZUxvY2tPdXQoYW1vdW50MiwgYWRkcmJ1ZmYxLCBsb2NrdGltZTEsIHRocmVzaG9sZCwgc3Rha2VhYmxlTG9ja1RpbWUyLCBwYXJzZWFibGVPdXRwdXQyKTtcbiAgICAgIGNvbnN0IG5vZGVJRDogc3RyaW5nID0gXCJOb2RlSUQtMzZnaUZ5ZTVlcHdCVHBHcVBrN2I0Q0NZZTNoZnlvRnIxXCI7XG4gICAgICBjb25zdCBzdGFrZUFtb3VudDogQk4gPSBEZWZhdWx0cy5uZXR3b3JrW25ldHdvcmtpZF1bXCJQXCJdLm1pblN0YWtlO1xuICAgICAgcGxhdGZvcm12bS5zZXRNaW5TdGFrZShzdGFrZUFtb3VudCwgRGVmYXVsdHMubmV0d29ya1tuZXR3b3JraWRdW1wiUFwiXS5taW5EZWxlZ2F0aW9uU3Rha2UpO1xuICAgICAgY29uc3QgZGVsZWdhdGlvbkZlZVJhdGU6IG51bWJlciA9IG5ldyBCTigyKS50b051bWJlcigpO1xuICAgICAgY29uc3QgY29kZWNJRDogbnVtYmVyID0gMDtcbiAgICAgIGNvbnN0IHR4aWQ6IEJ1ZmZlciA9IGJpbnRvb2xzLmNiNThEZWNvZGUoJ2F1aE1GczI0ZmZjMkJSV0t3Nmk3UW5nY3M4alNRVVM5RWkyWHdKc1VwRXE0c1RWaWInKTtcbiAgICAgIGNvbnN0IHR4aWQyOiBCdWZmZXIgPSBiaW50b29scy5jYjU4RGVjb2RlKCcySndEZm0zQzdwODhySlExWTF4V0xrV05NQTFucVB6cW5hQzJIaTRQRE5LaVBuWGdHdicpOyBcbiAgICAgIGNvbnN0IG91dHB1dGlkeDA6IG51bWJlciA9IDA7XG4gICAgICBjb25zdCBvdXRwdXRpZHgxOiBudW1iZXIgPSAwO1xuICAgICAgY29uc3QgYXNzZXRJRCA9IGF3YWl0IHBsYXRmb3Jtdm0uZ2V0QVZBWEFzc2V0SUQoKTtcbiAgICAgIGNvbnN0IGFzc2V0SUQyID0gYXdhaXQgcGxhdGZvcm12bS5nZXRBVkFYQXNzZXRJRCgpO1xuICAgICAgY29uc3QgdXR4bzE6IFVUWE8gPSBuZXcgVVRYTyhjb2RlY0lELCB0eGlkLCBvdXRwdXRpZHgwLCBhc3NldElELCBzdGFrZWFibGVMb2NrT3V0MSk7XG4gICAgICBjb25zdCB1dHhvMjogVVRYTyA9IG5ldyBVVFhPKGNvZGVjSUQsIHR4aWQyLCBvdXRwdXRpZHgxLCBhc3NldElEMiwgc3Rha2VhYmxlTG9ja091dDIpO1xuICAgICAgY29uc3QgdXR4b1NldDogVVRYT1NldCA9ICBuZXcgVVRYT1NldCgpO1xuICAgICAgdXR4b1NldC5hZGQodXR4bzEpO1xuICAgICAgdXR4b1NldC5hZGQodXR4bzIpO1xuICAgICAgY29uc3QgdHh1MTogVW5zaWduZWRUeCA9IGF3YWl0IHBsYXRmb3Jtdm0uYnVpbGRBZGRWYWxpZGF0b3JUeChcbiAgICAgICAgdXR4b1NldCwgXG4gICAgICAgIGFkZHJzMyxcbiAgICAgICAgYWRkcnMxLCBcbiAgICAgICAgYWRkcnMyLCBcbiAgICAgICAgbm9kZUlELCBcbiAgICAgICAgc3RhcnRUaW1lLFxuICAgICAgICBlbmRUaW1lLFxuICAgICAgICBzdGFrZUFtb3VudCxcbiAgICAgICAgYWRkcnMzLCBcbiAgICAgICAgZGVsZWdhdGlvbkZlZVJhdGVcbiAgICAgICk7XG4gICAgICBsZXQgdHggPSB0eHUxLmdldFRyYW5zYWN0aW9uKCkgYXMgQWRkVmFsaWRhdG9yVHg7XG4gICAgICBsZXQgaW5zOiBUcmFuc2ZlcmFibGVJbnB1dFtdID0gdHguZ2V0SW5zKCk7XG4gICAgICAvLyBzdGFydCB0ZXN0IGlucHV0c1xuICAgICAgLy8gY29uZmlybSBvbmx5IDEgaW5wdXRcbiAgICAgIGV4cGVjdChpbnMubGVuZ3RoKS50b0JlKDEpO1xuICAgICAgbGV0IGlucHV0OiBUcmFuc2ZlcmFibGVJbnB1dCA9IGluc1swXTtcbiAgICAgIGxldCBhaSA9IGlucHV0LmdldElucHV0KCkgYXMgQW1vdW50SW5wdXQ7XG4gICAgICBsZXQgYW8gPSBzdGFrZWFibGVMb2NrT3V0Mi5nZXRUcmFuc2ZlcmFibGVPdXRwdXQoKS5nZXRPdXRwdXQoKSBhcyBBbW91bnRPdXRwdXQ7XG4gICAgICBsZXQgYW8yID0gc3Rha2VhYmxlTG9ja091dDEuZ2V0VHJhbnNmZXJhYmxlT3V0cHV0KCkuZ2V0T3V0cHV0KCkgYXMgQW1vdW50T3V0cHV0O1xuICAgICAgLy8gY29uZmlybSBpbnB1dCBhbW91bnQgbWF0Y2hlcyB0aGUgb3V0cHV0IHcvIHRoZSBncmVhdGVyIHN0YWVrYWJsZWxvY2sgdGltZSBidXQgbGVzc2VyIGFtb3VudFxuICAgICAgZXhwZWN0KGFpLmdldEFtb3VudCgpLnRvU3RyaW5nKCkpLnRvRXF1YWwoYW8uZ2V0QW1vdW50KCkudG9TdHJpbmcoKSlcbiAgICAgIC8vIGNvbmZpcm0gaW5wdXQgYW1vdW50IGRvZXNuJ3QgbWF0Y2ggdGhlIG91dHB1dCB3LyB0aGUgbGVzc2VyIHN0YWVrYWJsZWxvY2sgdGltZSBidXQgZ3JlYXRlciBhbW91bnRcbiAgICAgIGV4cGVjdChhaS5nZXRBbW91bnQoKS50b1N0cmluZygpKS5ub3QudG9FcXVhbChhbzIuZ2V0QW1vdW50KCkudG9TdHJpbmcoKSlcblxuICAgICAgbGV0IHNsaSA9IGlucHV0LmdldElucHV0KCkgYXMgU3Rha2VhYmxlTG9ja0luO1xuICAgICAgLy8gY29uZmlybSBpbnB1dCBzdGFrZWFibGVsb2NrIHRpbWUgbWF0Y2hlcyB0aGUgb3V0cHV0IHcvIHRoZSBncmVhdGVyIHN0YWtlYWJsZWxvY2sgdGltZSBidXQgbGVzc2VyIGFtb3VudCBcbiAgICAgIGV4cGVjdChzbGkuZ2V0U3Rha2VhYmxlTG9ja3RpbWUoKS50b1N0cmluZygpKS50b0VxdWFsKHN0YWtlYWJsZUxvY2tPdXQyLmdldFN0YWtlYWJsZUxvY2t0aW1lKCkudG9TdHJpbmcoKSk7XG4gICAgICAvLyBjb25maXJtIGlucHV0IHN0YWtlYWJsZWxvY2sgdGltZSBkb2Vzbid0IG1hdGNoIHRoZSBvdXRwdXQgdy8gdGhlIGxlc3NlciBzdGFrZWFibGVsb2NrIHRpbWUgYnV0IGdyZWF0ZXIgYW1vdW50XG4gICAgICBleHBlY3Qoc2xpLmdldFN0YWtlYWJsZUxvY2t0aW1lKCkudG9TdHJpbmcoKSkubm90LnRvRXF1YWwoc3Rha2VhYmxlTG9ja091dDEuZ2V0U3Rha2VhYmxlTG9ja3RpbWUoKS50b1N0cmluZygpKTtcbiAgICAgIC8vIHN0b3AgdGVzdCBpbnB1dHNcblxuICAgICAgLy8gc3RhcnQgdGVzdCBvdXRwdXRzXG4gICAgICBsZXQgb3V0czogVHJhbnNmZXJhYmxlT3V0cHV0W10gPSB0eC5nZXRPdXRzKCk7XG4gICAgICAvLyBjb25maXJtIG9ubHkgMSBvdXRwdXRcbiAgICAgIGV4cGVjdChvdXRzLmxlbmd0aCkudG9CZSgxKTtcbiAgICAgIGxldCBvdXRwdXQ6IFRyYW5zZmVyYWJsZU91dHB1dCA9IG91dHNbMF07XG4gICAgICBsZXQgYW8zID0gb3V0cHV0LmdldE91dHB1dCgpIGFzIEFtb3VudE91dHB1dDtcbiAgICAgIC8vIGNvbmZpcm0gb3V0cHV0IGFtb3VudCBtYXRjaGVzIHRoZSBvdXRwdXQgdy8gdGhlIGdyZWF0ZXIgc3Rha2VhYmxlbG9jayB0aW1lIGJ1dCBsZXNzZXIgYW1vdW50IHNhbnMgdGhlIHN0YWtlIGFtb3VudFxuICAgICAgZXhwZWN0KGFvMy5nZXRBbW91bnQoKS50b1N0cmluZygpKS50b0VxdWFsKGFvLmdldEFtb3VudCgpLnN1YihzdGFrZUFtb3VudCkudG9TdHJpbmcoKSlcbiAgICAgIC8vIGNvbmZpcm0gb3V0cHV0IGFtb3VudCBkb2Vzbid0IG1hdGNoIHRoZSBvdXRwdXQgdy8gdGhlIGxlc3NlciBzdGFrZWFibGVsb2NrIHRpbWUgYnV0IGdyZWF0ZXIgYW1vdW50XG4gICAgICBleHBlY3QoYW8zLmdldEFtb3VudCgpLnRvU3RyaW5nKCkpLm5vdC50b0VxdWFsKGFvMi5nZXRBbW91bnQoKS50b1N0cmluZygpKVxuXG4gICAgICBsZXQgc2xvID0gb3V0cHV0LmdldE91dHB1dCgpIGFzIFN0YWtlYWJsZUxvY2tPdXQ7XG4gICAgICAvLyBjb25maXJtIG91dHB1dCBzdGFrZWFibGVsb2NrIHRpbWUgbWF0Y2hlcyB0aGUgb3V0cHV0IHcvIHRoZSBncmVhdGVyIHN0YWtlYWJsZWxvY2sgdGltZSBidXQgbGVzc2VyIGFtb3VudCBcbiAgICAgIGV4cGVjdChzbG8uZ2V0U3Rha2VhYmxlTG9ja3RpbWUoKS50b1N0cmluZygpKS50b0VxdWFsKHN0YWtlYWJsZUxvY2tPdXQyLmdldFN0YWtlYWJsZUxvY2t0aW1lKCkudG9TdHJpbmcoKSk7XG4gICAgICAvLyBjb25maXJtIG91dHB1dCBzdGFrZWFibGVsb2NrIHRpbWUgZG9lc24ndCBtYXRjaCB0aGUgb3V0cHV0IHcvIHRoZSBncmVhdGVyIHN0YWtlYWJsZWxvY2sgdGltZSBidXQgbGVzc2VyIGFtb3VudCBcbiAgICAgIGV4cGVjdChzbG8uZ2V0U3Rha2VhYmxlTG9ja3RpbWUoKS50b1N0cmluZygpKS5ub3QudG9FcXVhbChzdGFrZWFibGVMb2NrT3V0MS5nZXRTdGFrZWFibGVMb2NrdGltZSgpLnRvU3RyaW5nKCkpO1xuXG4gICAgICAvLyBjb25maXJtIHR4IG5vZGVJRCBtYXRjaGVzIG5vZGVJRFxuICAgICAgZXhwZWN0KHR4LmdldE5vZGVJRFN0cmluZygpKS50b0VxdWFsKG5vZGVJRCk7XG4gICAgICAvLyBjb25maXJtIHR4IHN0YXJ0dGltZSBtYXRjaGVzIHN0YXJ0dGltZVxuICAgICAgZXhwZWN0KHR4LmdldFN0YXJ0VGltZSgpLnRvU3RyaW5nKCkpLnRvRXF1YWwoc3RhcnRUaW1lLnRvU3RyaW5nKCkpO1xuICAgICAgLy8gY29uZmlybSB0eCBlbmR0aW1lIG1hdGNoZXMgZW5kdGltZSBcbiAgICAgIGV4cGVjdCh0eC5nZXRFbmRUaW1lKCkudG9TdHJpbmcoKSkudG9FcXVhbChlbmRUaW1lLnRvU3RyaW5nKCkpO1xuICAgICAgLy8gY29uZmlybSB0eCBzdGFrZSBhbW91bnQgbWF0Y2hlcyBzdGFrZUFtb3VudFxuICAgICAgZXhwZWN0KHR4LmdldFN0YWtlQW1vdW50KCkudG9TdHJpbmcoKSkudG9FcXVhbChzdGFrZUFtb3VudC50b1N0cmluZygpKTtcblxuICAgICAgbGV0IHN0YWtlT3V0czogVHJhbnNmZXJhYmxlT3V0cHV0W10gPSB0eC5nZXRTdGFrZU91dHMoKTtcbiAgICAgIC8vIGNvbmZpcm0gb25seSAxIHN0YWtlT3V0XG4gICAgICBleHBlY3Qoc3Rha2VPdXRzLmxlbmd0aCkudG9CZSgxKTtcblxuICAgICAgbGV0IHN0YWtlT3V0OiBUcmFuc2ZlcmFibGVPdXRwdXQgPSBzdGFrZU91dHNbMF07XG4gICAgICBsZXQgc2xvMiA9IHN0YWtlT3V0LmdldE91dHB1dCgpIGFzIFN0YWtlYWJsZUxvY2tPdXQ7XG4gICAgICAvLyBjb25maXJtIHN0YWtlT3V0IHN0YWtlYWJsZWxvY2sgdGltZSBtYXRjaGVzIHRoZSBvdXRwdXQgdy8gdGhlIGdyZWF0ZXIgc3Rha2VhYmxlbG9jayB0aW1lIGJ1dCBsZXNzZXIgYW1vdW50IFxuICAgICAgZXhwZWN0KHNsbzIuZ2V0U3Rha2VhYmxlTG9ja3RpbWUoKS50b1N0cmluZygpKS50b0VxdWFsKHN0YWtlYWJsZUxvY2tPdXQyLmdldFN0YWtlYWJsZUxvY2t0aW1lKCkudG9TdHJpbmcoKSk7XG4gICAgICAvLyBjb25maXJtIHN0YWtlT3V0IHN0YWtlYWJsZWxvY2sgdGltZSBkb2Vzbid0IG1hdGNoIHRoZSBvdXRwdXQgdy8gdGhlIGdyZWF0ZXIgc3Rha2VhYmxlbG9jayB0aW1lIGJ1dCBsZXNzZXIgYW1vdW50IFxuICAgICAgZXhwZWN0KHNsbzIuZ2V0U3Rha2VhYmxlTG9ja3RpbWUoKS50b1N0cmluZygpKS5ub3QudG9FcXVhbChzdGFrZWFibGVMb2NrT3V0MS5nZXRTdGFrZWFibGVMb2NrdGltZSgpLnRvU3RyaW5nKCkpO1xuICAgICAgc2xvMi5nZXRBbW91bnQoKVxuICAgICAgLy8gY29uZmlybSBzdGFrZU91dCBzdGFrZSBhbW91bnQgbWF0Y2hlcyBzdGFrZUFtb3VudFxuICAgICAgZXhwZWN0KHNsbzIuZ2V0QW1vdW50KCkudG9TdHJpbmcoKSkudG9FcXVhbChzdGFrZUFtb3VudC50b1N0cmluZygpKTtcbiAgICB9KTtcblxuICAgIHRlc3QoJ2J1aWxkQWRkVmFsaWRhdG9yVHggc29ydCBTdGFrZWFibGVMb2NrT3V0cyAyJywgYXN5bmMgKCkgPT4ge1xuXG4gICAgICAvLyB0d28gVVRYTy4gVGhlIDFzdCBoYXMgYSBsZXNzZXIgc3Rha2VhYmxlbG9ja3RpbWUgYW5kIGEgZ3JlYXRlciBhbW91bnQgb2YgQVZBWC4gVGhlIDJuZCBoYXMgYSBncmVhdGVyIHN0YWtlYWJsZWxvY2t0aW1lIGFuZCBhIGxlc3NlciBhbW91bnQgb2YgQVZBWC5cbiAgICAgIC8vIHRoaXMgdGltZSB3ZSdyZSBzdGFraW5nIGEgZ3JlYXRlciBhbW91bnQgdGhhbiBpcyBhdmFpbGFibGUgaW4gdGhlIDJuZCBVVFhPLlxuICAgICAgLy8gV2UgZXhwZWN0IHRoaXMgdGVzdCB0byBjb25zdW1lIHRoZSBmdWxsIDJuZCBVVFhPIGFuZCBhIGZyYWN0aW9uIG9mIHRoZSAxc3QgVVRYTy4uXG4gICAgICBjb25zdCBhZGRyYnVmZjE6IEJ1ZmZlcltdID0gYWRkcnMxLm1hcCgoYSkgPT4gcGxhdGZvcm12bS5wYXJzZUFkZHJlc3MoYSkpO1xuICAgICAgY29uc3QgYW1vdW50MTogQk4gPSBuZXcgQk4oJzIwMDAwMDAwMDAwMDAwMDAwJyk7XG4gICAgICBjb25zdCBhbW91bnQyOiBCTiA9IG5ldyBCTignMTAwMDAwMDAwMDAwMDAwMDAnKTtcbiAgICAgIGNvbnN0IGxvY2t0aW1lMTogQk4gPSBuZXcgQk4oMCk7XG4gICAgICBjb25zdCB0aHJlc2hvbGQ6IG51bWJlciA9IDE7XG4gICAgICBcbiAgICAgIGNvbnN0IHN0YWtlYWJsZUxvY2tUaW1lMTogQk4gPSBuZXcgQk4oMTYzMzgyNDAwMCk7XG4gICAgICBjb25zdCBzZWNwVHJhbnNmZXJPdXRwdXQxOiBTRUNQVHJhbnNmZXJPdXRwdXQgPSBuZXcgU0VDUFRyYW5zZmVyT3V0cHV0KGFtb3VudDEsIGFkZHJidWZmMSwgbG9ja3RpbWUxLCB0aHJlc2hvbGQpO1xuICAgICAgY29uc3QgcGFyc2VhYmxlT3V0cHV0MTogUGFyc2VhYmxlT3V0cHV0ID0gbmV3IFBhcnNlYWJsZU91dHB1dChzZWNwVHJhbnNmZXJPdXRwdXQxKTtcbiAgICAgIGNvbnN0IHN0YWtlYWJsZUxvY2tPdXQxOiBTdGFrZWFibGVMb2NrT3V0ID0gbmV3IFN0YWtlYWJsZUxvY2tPdXQoYW1vdW50MSwgYWRkcmJ1ZmYxLCBsb2NrdGltZTEsIHRocmVzaG9sZCwgc3Rha2VhYmxlTG9ja1RpbWUxLCBwYXJzZWFibGVPdXRwdXQxKTtcbiAgICAgIGNvbnN0IHN0YWtlYWJsZUxvY2tUaW1lMjogQk4gPSBuZXcgQk4oMTczMzgyNDAwMCk7XG4gICAgICBjb25zdCBzZWNwVHJhbnNmZXJPdXRwdXQyOiBTRUNQVHJhbnNmZXJPdXRwdXQgPSBuZXcgU0VDUFRyYW5zZmVyT3V0cHV0KGFtb3VudDIsIGFkZHJidWZmMSwgbG9ja3RpbWUxLCB0aHJlc2hvbGQpO1xuICAgICAgY29uc3QgcGFyc2VhYmxlT3V0cHV0MjogUGFyc2VhYmxlT3V0cHV0ID0gbmV3IFBhcnNlYWJsZU91dHB1dChzZWNwVHJhbnNmZXJPdXRwdXQyKTtcbiAgICAgIGNvbnN0IHN0YWtlYWJsZUxvY2tPdXQyOiBTdGFrZWFibGVMb2NrT3V0ID0gbmV3IFN0YWtlYWJsZUxvY2tPdXQoYW1vdW50MiwgYWRkcmJ1ZmYxLCBsb2NrdGltZTEsIHRocmVzaG9sZCwgc3Rha2VhYmxlTG9ja1RpbWUyLCBwYXJzZWFibGVPdXRwdXQyKTtcbiAgICAgIGNvbnN0IG5vZGVJRDogc3RyaW5nID0gXCJOb2RlSUQtMzZnaUZ5ZTVlcHdCVHBHcVBrN2I0Q0NZZTNoZnlvRnIxXCI7XG4gICAgICBjb25zdCBzdGFrZUFtb3VudDogQk4gPSBuZXcgQk4oJzEwMDAwMDAzMDAwMDAwMDAwJyk7XG4gICAgICBwbGF0Zm9ybXZtLnNldE1pblN0YWtlKHN0YWtlQW1vdW50LCBEZWZhdWx0cy5uZXR3b3JrW25ldHdvcmtpZF1bXCJQXCJdLm1pbkRlbGVnYXRpb25TdGFrZSk7XG4gICAgICBjb25zdCBkZWxlZ2F0aW9uRmVlUmF0ZTogbnVtYmVyID0gbmV3IEJOKDIpLnRvTnVtYmVyKCk7XG4gICAgICBjb25zdCBjb2RlY0lEOiBudW1iZXIgPSAwO1xuICAgICAgY29uc3QgdHhpZDogQnVmZmVyID0gYmludG9vbHMuY2I1OERlY29kZSgnYXVoTUZzMjRmZmMyQlJXS3c2aTdRbmdjczhqU1FVUzlFaTJYd0pzVXBFcTRzVFZpYicpO1xuICAgICAgY29uc3QgdHhpZDI6IEJ1ZmZlciA9IGJpbnRvb2xzLmNiNThEZWNvZGUoJzJKd0RmbTNDN3A4OHJKUTFZMXhXTGtXTk1BMW5xUHpxbmFDMkhpNFBETktpUG5YZ0d2Jyk7IFxuICAgICAgY29uc3Qgb3V0cHV0aWR4MDogbnVtYmVyID0gMDtcbiAgICAgIGNvbnN0IG91dHB1dGlkeDE6IG51bWJlciA9IDA7XG4gICAgICBjb25zdCBhc3NldElEID0gYXdhaXQgcGxhdGZvcm12bS5nZXRBVkFYQXNzZXRJRCgpO1xuICAgICAgY29uc3QgYXNzZXRJRDIgPSBhd2FpdCBwbGF0Zm9ybXZtLmdldEFWQVhBc3NldElEKCk7XG4gICAgICBjb25zdCB1dHhvMTogVVRYTyA9IG5ldyBVVFhPKGNvZGVjSUQsIHR4aWQsIG91dHB1dGlkeDAsIGFzc2V0SUQsIHN0YWtlYWJsZUxvY2tPdXQxKTtcbiAgICAgIGNvbnN0IHV0eG8yOiBVVFhPID0gbmV3IFVUWE8oY29kZWNJRCwgdHhpZDIsIG91dHB1dGlkeDEsIGFzc2V0SUQyLCBzdGFrZWFibGVMb2NrT3V0Mik7XG4gICAgICBjb25zdCB1dHhvU2V0OiBVVFhPU2V0ID0gIG5ldyBVVFhPU2V0KCk7XG4gICAgICB1dHhvU2V0LmFkZCh1dHhvMSk7XG4gICAgICB1dHhvU2V0LmFkZCh1dHhvMik7XG4gICAgICBjb25zdCB0eHUxOiBVbnNpZ25lZFR4ID0gYXdhaXQgcGxhdGZvcm12bS5idWlsZEFkZFZhbGlkYXRvclR4KFxuICAgICAgICB1dHhvU2V0LCBcbiAgICAgICAgYWRkcnMzLFxuICAgICAgICBhZGRyczEsIFxuICAgICAgICBhZGRyczIsIFxuICAgICAgICBub2RlSUQsIFxuICAgICAgICBzdGFydFRpbWUsXG4gICAgICAgIGVuZFRpbWUsXG4gICAgICAgIHN0YWtlQW1vdW50LFxuICAgICAgICBhZGRyczMsIFxuICAgICAgICBkZWxlZ2F0aW9uRmVlUmF0ZVxuICAgICAgKTtcbiAgICAgIGxldCB0eCA9IHR4dTEuZ2V0VHJhbnNhY3Rpb24oKSBhcyBBZGRWYWxpZGF0b3JUeDtcbiAgICAgIGxldCBpbnM6IFRyYW5zZmVyYWJsZUlucHV0W10gPSB0eC5nZXRJbnMoKTtcbiAgICAgIC8vIHN0YXJ0IHRlc3QgaW5wdXRzXG4gICAgICAvLyBjb25maXJtIG9ubHkgMSBpbnB1dFxuICAgICAgZXhwZWN0KGlucy5sZW5ndGgpLnRvQmUoMik7XG4gICAgICBsZXQgaW5wdXQxOiBUcmFuc2ZlcmFibGVJbnB1dCA9IGluc1swXTtcbiAgICAgIGxldCBpbnB1dDI6IFRyYW5zZmVyYWJsZUlucHV0ID0gaW5zWzFdO1xuICAgICAgbGV0IGFpMSA9IGlucHV0MS5nZXRJbnB1dCgpIGFzIEFtb3VudElucHV0O1xuICAgICAgbGV0IGFpMiA9IGlucHV0Mi5nZXRJbnB1dCgpIGFzIEFtb3VudElucHV0O1xuICAgICAgbGV0IGFvMSA9IHN0YWtlYWJsZUxvY2tPdXQyLmdldFRyYW5zZmVyYWJsZU91dHB1dCgpLmdldE91dHB1dCgpIGFzIEFtb3VudE91dHB1dDtcbiAgICAgIGxldCBhbzIgPSBzdGFrZWFibGVMb2NrT3V0MS5nZXRUcmFuc2ZlcmFibGVPdXRwdXQoKS5nZXRPdXRwdXQoKSBhcyBBbW91bnRPdXRwdXQ7XG4gICAgICAvLyBjb25maXJtIGVhY2ggaW5wdXQgYW1vdW50IG1hdGNoZXMgdGhlIGNvcnJlc3BvbmRpbmcgb3V0cHV0IFxuICAgICAgZXhwZWN0KGFpMi5nZXRBbW91bnQoKS50b1N0cmluZygpKS50b0VxdWFsKGFvMS5nZXRBbW91bnQoKS50b1N0cmluZygpKVxuICAgICAgZXhwZWN0KGFpMS5nZXRBbW91bnQoKS50b1N0cmluZygpKS50b0VxdWFsKGFvMi5nZXRBbW91bnQoKS50b1N0cmluZygpKVxuXG4gICAgICBsZXQgc2xpMSA9IGlucHV0MS5nZXRJbnB1dCgpIGFzIFN0YWtlYWJsZUxvY2tJbjtcbiAgICAgIGxldCBzbGkyID0gaW5wdXQyLmdldElucHV0KCkgYXMgU3Rha2VhYmxlTG9ja0luO1xuICAgICAgLy8gY29uZmlybSBpbnB1dCBzdHJha2VhYmxlbG9jayB0aW1lIG1hdGNoZXMgdGhlIG91dHB1dCB3LyB0aGUgZ3JlYXRlciBzdGFla2FibGVsb2NrIHRpbWUgYnV0IGxlc3NlciBhbW91bnQgXG4gICAgICBleHBlY3Qoc2xpMS5nZXRTdGFrZWFibGVMb2NrdGltZSgpLnRvU3RyaW5nKCkpLnRvRXF1YWwoc3Rha2VhYmxlTG9ja091dDEuZ2V0U3Rha2VhYmxlTG9ja3RpbWUoKS50b1N0cmluZygpKTtcbiAgICAgIGV4cGVjdChzbGkyLmdldFN0YWtlYWJsZUxvY2t0aW1lKCkudG9TdHJpbmcoKSkudG9FcXVhbChzdGFrZWFibGVMb2NrT3V0Mi5nZXRTdGFrZWFibGVMb2NrdGltZSgpLnRvU3RyaW5nKCkpO1xuICAgICAgLy8gc3RvcCB0ZXN0IGlucHV0c1xuXG4gICAgICAvLyBzdGFydCB0ZXN0IG91dHB1dHNcbiAgICAgIGxldCBvdXRzOiBUcmFuc2ZlcmFibGVPdXRwdXRbXSA9IHR4LmdldE91dHMoKTtcbiAgICAgIC8vIGNvbmZpcm0gb25seSAxIG91dHB1dFxuICAgICAgZXhwZWN0KG91dHMubGVuZ3RoKS50b0JlKDEpO1xuICAgICAgbGV0IG91dHB1dDogVHJhbnNmZXJhYmxlT3V0cHV0ID0gb3V0c1swXTtcbiAgICAgIGxldCBhbzMgPSBvdXRwdXQuZ2V0T3V0cHV0KCkgYXMgQW1vdW50T3V0cHV0O1xuICAgICAgLy8gY29uZmlybSBvdXRwdXQgYW1vdW50IG1hdGNoZXMgdGhlIG91dHB1dCBhbW91bnQgc2FucyB0aGUgMm5kIHV0eG8gYW1vdW50IGFuZCB0aGUgc3Rha2UgYW1vdW50XG4gICAgICBleHBlY3QoYW8zLmdldEFtb3VudCgpLnRvU3RyaW5nKCkpLnRvRXF1YWwoYW8yLmdldEFtb3VudCgpLnN1YihzdGFrZUFtb3VudC5zdWIoYW8xLmdldEFtb3VudCgpKSkudG9TdHJpbmcoKSlcblxuICAgICAgbGV0IHNsbyA9IG91dHB1dC5nZXRPdXRwdXQoKSBhcyBTdGFrZWFibGVMb2NrT3V0O1xuICAgICAgLy8gY29uZmlybSBvdXRwdXQgc3Rha2VhYmxlbG9jayB0aW1lIG1hdGNoZXMgdGhlIG91dHB1dCB3LyB0aGUgbGVzc2VyIHN0YWtlYWJsZWxvY2sgc2luY2UgdGhlIG90aGVyIHdhcyBjb25zdW1lZFxuICAgICAgZXhwZWN0KHNsby5nZXRTdGFrZWFibGVMb2NrdGltZSgpLnRvU3RyaW5nKCkpLnRvRXF1YWwoc3Rha2VhYmxlTG9ja091dDEuZ2V0U3Rha2VhYmxlTG9ja3RpbWUoKS50b1N0cmluZygpKTtcbiAgICAgIC8vIGNvbmZpcm0gb3V0cHV0IHN0YWtlYWJsZWxvY2sgdGltZSBkb2Vzbid0IG1hdGNoIHRoZSBvdXRwdXQgdy8gdGhlIGdyZWF0ZXIgc3Rha2VhYmxlbG9jayB0aW1lICBcbiAgICAgIGV4cGVjdChzbG8uZ2V0U3Rha2VhYmxlTG9ja3RpbWUoKS50b1N0cmluZygpKS5ub3QudG9FcXVhbChzdGFrZWFibGVMb2NrT3V0Mi5nZXRTdGFrZWFibGVMb2NrdGltZSgpLnRvU3RyaW5nKCkpO1xuXG4gICAgICAvLyBjb25maXJtIHR4IG5vZGVJRCBtYXRjaGVzIG5vZGVJRFxuICAgICAgZXhwZWN0KHR4LmdldE5vZGVJRFN0cmluZygpKS50b0VxdWFsKG5vZGVJRCk7XG4gICAgICAvLyBjb25maXJtIHR4IHN0YXJ0dGltZSBtYXRjaGVzIHN0YXJ0dGltZVxuICAgICAgZXhwZWN0KHR4LmdldFN0YXJ0VGltZSgpLnRvU3RyaW5nKCkpLnRvRXF1YWwoc3RhcnRUaW1lLnRvU3RyaW5nKCkpO1xuICAgICAgLy8gY29uZmlybSB0eCBlbmR0aW1lIG1hdGNoZXMgZW5kdGltZSBcbiAgICAgIGV4cGVjdCh0eC5nZXRFbmRUaW1lKCkudG9TdHJpbmcoKSkudG9FcXVhbChlbmRUaW1lLnRvU3RyaW5nKCkpO1xuICAgICAgLy8gY29uZmlybSB0eCBzdGFrZSBhbW91bnQgbWF0Y2hlcyBzdGFrZUFtb3VudFxuICAgICAgZXhwZWN0KHR4LmdldFN0YWtlQW1vdW50KCkudG9TdHJpbmcoKSkudG9FcXVhbChzdGFrZUFtb3VudC50b1N0cmluZygpKTtcblxuICAgICAgbGV0IHN0YWtlT3V0czogVHJhbnNmZXJhYmxlT3V0cHV0W10gPSB0eC5nZXRTdGFrZU91dHMoKTtcbiAgICAgIC8vIGNvbmZpcm0gMiBzdGFrZU91dHNcbiAgICAgIGV4cGVjdChzdGFrZU91dHMubGVuZ3RoKS50b0JlKDIpO1xuXG4gICAgICBsZXQgc3Rha2VPdXQxOiBUcmFuc2ZlcmFibGVPdXRwdXQgPSBzdGFrZU91dHNbMF07XG4gICAgICBsZXQgc3Rha2VPdXQyOiBUcmFuc2ZlcmFibGVPdXRwdXQgPSBzdGFrZU91dHNbMV07XG4gICAgICBsZXQgc2xvMiA9IHN0YWtlT3V0MS5nZXRPdXRwdXQoKSBhcyBTdGFrZWFibGVMb2NrT3V0O1xuICAgICAgbGV0IHNsbzMgPSBzdGFrZU91dDIuZ2V0T3V0cHV0KCkgYXMgU3Rha2VhYmxlTG9ja091dDtcbiAgICAgIC8vIGNvbmZpcm0gYm90aCBzdGFrZU91dCBzdHJha2VhYmxlbG9jayB0aW1lcyBtYXRjaGUgdGhlIGNvcnJlc3BvbmRpbmcgb3V0cHV0ICBcbiAgICAgIGV4cGVjdChzbG8zLmdldFN0YWtlYWJsZUxvY2t0aW1lKCkudG9TdHJpbmcoKSkudG9FcXVhbChzdGFrZWFibGVMb2NrT3V0MS5nZXRTdGFrZWFibGVMb2NrdGltZSgpLnRvU3RyaW5nKCkpO1xuICAgICAgZXhwZWN0KHNsbzIuZ2V0U3Rha2VhYmxlTG9ja3RpbWUoKS50b1N0cmluZygpKS50b0VxdWFsKHN0YWtlYWJsZUxvY2tPdXQyLmdldFN0YWtlYWJsZUxvY2t0aW1lKCkudG9TdHJpbmcoKSk7XG4gICAgfSk7XG5cbiAgICB0ZXN0KCdidWlsZEFkZFZhbGlkYXRvclR4IHNvcnQgU3Rha2VhYmxlTG9ja091dHMgMycsIGFzeW5jICgpID0+IHtcbiAgICAgIC8vIHRocmVlIFVUWE8uIFxuICAgICAgLy8gVGhlIDFzdCBpcyBhIFNlY3BUcmFuc2ZlcmFibGVPdXRwdXQuIFxuICAgICAgLy8gVGhlIDJuZCBoYXMgYSBsZXNzZXIgc3Rha2VhYmxlbG9ja3RpbWUgYW5kIGEgZ3JlYXRlciBhbW91bnQgb2YgQVZBWC4gXG4gICAgICAvLyBUaGUgM3JkIGhhcyBhIGdyZWF0ZXIgc3Rha2VhYmxlbG9ja3RpbWUgYW5kIGEgbGVzc2VyIGFtb3VudCBvZiBBVkFYLlxuICAgICAgLy8gXG4gICAgICAvLyB0aGlzIHRpbWUgd2UncmUgc3Rha2luZyBhIGdyZWF0ZXIgYW1vdW50IHRoYW4gaXMgYXZhaWxhYmxlIGluIHRoZSAzcmQgVVRYTy5cbiAgICAgIC8vIFdlIGV4cGVjdCB0aGlzIHRlc3QgdG8gY29uc3VtZSB0aGUgZnVsbCAzcmQgVVRYTyBhbmQgYSBmcmFjdGlvbiBvZiB0aGUgMm5kIFVUWE8gYW5kIG5vdCB0byBjb25zdW1lIHRoZSBTZWNwVHJhbnNmZXJhYmxlT3V0cHV0XG4gICAgICBjb25zdCBhZGRyYnVmZjE6IEJ1ZmZlcltdID0gYWRkcnMxLm1hcCgoYSkgPT4gcGxhdGZvcm12bS5wYXJzZUFkZHJlc3MoYSkpO1xuICAgICAgY29uc3QgYW1vdW50MTogQk4gPSBuZXcgQk4oJzIwMDAwMDAwMDAwMDAwMDAwJyk7XG4gICAgICBjb25zdCBhbW91bnQyOiBCTiA9IG5ldyBCTignMTAwMDAwMDAwMDAwMDAwMDAnKTtcbiAgICAgIGNvbnN0IGxvY2t0aW1lMTogQk4gPSBuZXcgQk4oMCk7XG4gICAgICBjb25zdCB0aHJlc2hvbGQ6IG51bWJlciA9IDE7XG4gICAgICBcbiAgICAgIGNvbnN0IHN0YWtlYWJsZUxvY2tUaW1lMTogQk4gPSBuZXcgQk4oMTYzMzgyNDAwMCk7XG4gICAgICBjb25zdCBzZWNwVHJhbnNmZXJPdXRwdXQwOiBTRUNQVHJhbnNmZXJPdXRwdXQgPSBuZXcgU0VDUFRyYW5zZmVyT3V0cHV0KGFtb3VudDEsIGFkZHJidWZmMSwgbG9ja3RpbWUxLCB0aHJlc2hvbGQpO1xuICAgICAgY29uc3Qgc2VjcFRyYW5zZmVyT3V0cHV0MTogU0VDUFRyYW5zZmVyT3V0cHV0ID0gbmV3IFNFQ1BUcmFuc2Zlck91dHB1dChhbW91bnQxLCBhZGRyYnVmZjEsIGxvY2t0aW1lMSwgdGhyZXNob2xkKTtcbiAgICAgIGNvbnN0IHBhcnNlYWJsZU91dHB1dDE6IFBhcnNlYWJsZU91dHB1dCA9IG5ldyBQYXJzZWFibGVPdXRwdXQoc2VjcFRyYW5zZmVyT3V0cHV0MSk7XG4gICAgICBjb25zdCBzdGFrZWFibGVMb2NrT3V0MTogU3Rha2VhYmxlTG9ja091dCA9IG5ldyBTdGFrZWFibGVMb2NrT3V0KGFtb3VudDEsIGFkZHJidWZmMSwgbG9ja3RpbWUxLCB0aHJlc2hvbGQsIHN0YWtlYWJsZUxvY2tUaW1lMSwgcGFyc2VhYmxlT3V0cHV0MSk7XG4gICAgICBjb25zdCBzdGFrZWFibGVMb2NrVGltZTI6IEJOID0gbmV3IEJOKDE3MzM4MjQwMDApO1xuICAgICAgY29uc3Qgc2VjcFRyYW5zZmVyT3V0cHV0MjogU0VDUFRyYW5zZmVyT3V0cHV0ID0gbmV3IFNFQ1BUcmFuc2Zlck91dHB1dChhbW91bnQyLCBhZGRyYnVmZjEsIGxvY2t0aW1lMSwgdGhyZXNob2xkKTtcbiAgICAgIGNvbnN0IHBhcnNlYWJsZU91dHB1dDI6IFBhcnNlYWJsZU91dHB1dCA9IG5ldyBQYXJzZWFibGVPdXRwdXQoc2VjcFRyYW5zZmVyT3V0cHV0Mik7XG4gICAgICBjb25zdCBzdGFrZWFibGVMb2NrT3V0MjogU3Rha2VhYmxlTG9ja091dCA9IG5ldyBTdGFrZWFibGVMb2NrT3V0KGFtb3VudDIsIGFkZHJidWZmMSwgbG9ja3RpbWUxLCB0aHJlc2hvbGQsIHN0YWtlYWJsZUxvY2tUaW1lMiwgcGFyc2VhYmxlT3V0cHV0Mik7XG4gICAgICBjb25zdCBub2RlSUQ6IHN0cmluZyA9IFwiTm9kZUlELTM2Z2lGeWU1ZXB3QlRwR3FQazdiNENDWWUzaGZ5b0ZyMVwiO1xuICAgICAgY29uc3Qgc3Rha2VBbW91bnQ6IEJOID0gbmV3IEJOKCcxMDAwMDAwMzAwMDAwMDAwMCcpO1xuICAgICAgcGxhdGZvcm12bS5zZXRNaW5TdGFrZShzdGFrZUFtb3VudCwgRGVmYXVsdHMubmV0d29ya1tuZXR3b3JraWRdW1wiUFwiXS5taW5EZWxlZ2F0aW9uU3Rha2UpO1xuICAgICAgY29uc3QgZGVsZWdhdGlvbkZlZVJhdGU6IG51bWJlciA9IG5ldyBCTigyKS50b051bWJlcigpO1xuICAgICAgY29uc3QgY29kZWNJRDogbnVtYmVyID0gMDtcbiAgICAgIGNvbnN0IHR4aWQwOiBCdWZmZXIgPSBiaW50b29scy5jYjU4RGVjb2RlKCdhdWhNRnMyNGZmYzJCUldLdzZpN1FuZ2NzOGpTUVVTOUVpMlh3SnNVcEVxNHNUVmliJyk7XG4gICAgICBjb25zdCB0eGlkMTogQnVmZmVyID0gYmludG9vbHMuY2I1OERlY29kZSgnMmpoeUppdDhrV0E2U3drUndLeFhlcEZuZmhzOTcxQ0VxYUdrakptaUFETThINGcyTFInKTtcbiAgICAgIGNvbnN0IHR4aWQyOiBCdWZmZXIgPSBiaW50b29scy5jYjU4RGVjb2RlKCcySndEZm0zQzdwODhySlExWTF4V0xrV05NQTFucVB6cW5hQzJIaTRQRE5LaVBuWGdHdicpOyBcbiAgICAgIGNvbnN0IG91dHB1dGlkeDA6IG51bWJlciA9IDA7XG4gICAgICBjb25zdCBvdXRwdXRpZHgxOiBudW1iZXIgPSAwO1xuICAgICAgY29uc3QgYXNzZXRJRCA9IGF3YWl0IHBsYXRmb3Jtdm0uZ2V0QVZBWEFzc2V0SUQoKTtcbiAgICAgIGNvbnN0IGFzc2V0SUQyID0gYXdhaXQgcGxhdGZvcm12bS5nZXRBVkFYQXNzZXRJRCgpO1xuICAgICAgY29uc3QgdXR4bzA6IFVUWE8gPSBuZXcgVVRYTyhjb2RlY0lELCB0eGlkMCwgb3V0cHV0aWR4MCwgYXNzZXRJRCwgc2VjcFRyYW5zZmVyT3V0cHV0MCk7XG4gICAgICBjb25zdCB1dHhvMTogVVRYTyA9IG5ldyBVVFhPKGNvZGVjSUQsIHR4aWQxLCBvdXRwdXRpZHgwLCBhc3NldElELCBzdGFrZWFibGVMb2NrT3V0MSk7XG4gICAgICBjb25zdCB1dHhvMjogVVRYTyA9IG5ldyBVVFhPKGNvZGVjSUQsIHR4aWQyLCBvdXRwdXRpZHgxLCBhc3NldElEMiwgc3Rha2VhYmxlTG9ja091dDIpO1xuICAgICAgY29uc3QgdXR4b1NldDogVVRYT1NldCA9ICBuZXcgVVRYT1NldCgpO1xuICAgICAgdXR4b1NldC5hZGQodXR4bzApO1xuICAgICAgdXR4b1NldC5hZGQodXR4bzEpO1xuICAgICAgdXR4b1NldC5hZGQodXR4bzIpO1xuICAgICAgY29uc3QgdHh1MTogVW5zaWduZWRUeCA9IGF3YWl0IHBsYXRmb3Jtdm0uYnVpbGRBZGRWYWxpZGF0b3JUeChcbiAgICAgICAgdXR4b1NldCwgXG4gICAgICAgIGFkZHJzMyxcbiAgICAgICAgYWRkcnMxLCBcbiAgICAgICAgYWRkcnMyLCBcbiAgICAgICAgbm9kZUlELCBcbiAgICAgICAgc3RhcnRUaW1lLFxuICAgICAgICBlbmRUaW1lLFxuICAgICAgICBzdGFrZUFtb3VudCxcbiAgICAgICAgYWRkcnMzLCBcbiAgICAgICAgZGVsZWdhdGlvbkZlZVJhdGVcbiAgICAgICk7XG4gICAgICBsZXQgdHggPSB0eHUxLmdldFRyYW5zYWN0aW9uKCkgYXMgQWRkVmFsaWRhdG9yVHg7XG4gICAgICBsZXQgaW5zOiBUcmFuc2ZlcmFibGVJbnB1dFtdID0gdHguZ2V0SW5zKCk7XG4gICAgICAvLyBzdGFydCB0ZXN0IGlucHV0c1xuICAgICAgLy8gY29uZmlybSBvbmx5IDEgaW5wdXRcbiAgICAgIGV4cGVjdChpbnMubGVuZ3RoKS50b0JlKDIpO1xuICAgICAgbGV0IGlucHV0MTogVHJhbnNmZXJhYmxlSW5wdXQgPSBpbnNbMF07XG4gICAgICBsZXQgaW5wdXQyOiBUcmFuc2ZlcmFibGVJbnB1dCA9IGluc1sxXTtcbiAgICAgIGxldCBhaTEgPSBpbnB1dDEuZ2V0SW5wdXQoKSBhcyBBbW91bnRJbnB1dDtcbiAgICAgIGxldCBhaTIgPSBpbnB1dDIuZ2V0SW5wdXQoKSBhcyBBbW91bnRJbnB1dDtcbiAgICAgIGxldCBhbzEgPSBzdGFrZWFibGVMb2NrT3V0Mi5nZXRUcmFuc2ZlcmFibGVPdXRwdXQoKS5nZXRPdXRwdXQoKSBhcyBBbW91bnRPdXRwdXQ7XG4gICAgICBsZXQgYW8yID0gc3Rha2VhYmxlTG9ja091dDEuZ2V0VHJhbnNmZXJhYmxlT3V0cHV0KCkuZ2V0T3V0cHV0KCkgYXMgQW1vdW50T3V0cHV0O1xuICAgICAgLy8gY29uZmlybSBlYWNoIGlucHV0IGFtb3VudCBtYXRjaGVzIHRoZSBjb3JyZXNwb25kaW5nIG91dHB1dCBcbiAgICAgIGV4cGVjdChhaTIuZ2V0QW1vdW50KCkudG9TdHJpbmcoKSkudG9FcXVhbChhbzIuZ2V0QW1vdW50KCkudG9TdHJpbmcoKSlcbiAgICAgIGV4cGVjdChhaTEuZ2V0QW1vdW50KCkudG9TdHJpbmcoKSkudG9FcXVhbChhbzEuZ2V0QW1vdW50KCkudG9TdHJpbmcoKSlcblxuICAgICAgbGV0IHNsaTEgPSBpbnB1dDEuZ2V0SW5wdXQoKSBhcyBTdGFrZWFibGVMb2NrSW47XG4gICAgICBsZXQgc2xpMiA9IGlucHV0Mi5nZXRJbnB1dCgpIGFzIFN0YWtlYWJsZUxvY2tJbjtcbiAgICAgIC8vIGNvbmZpcm0gaW5wdXQgc3RyYWtlYWJsZWxvY2sgdGltZSBtYXRjaGVzIHRoZSBvdXRwdXQgdy8gdGhlIGdyZWF0ZXIgc3RhZWthYmxlbG9jayB0aW1lIGJ1dCBsZXNzZXIgYW1vdW50IFxuICAgICAgZXhwZWN0KHNsaTEuZ2V0U3Rha2VhYmxlTG9ja3RpbWUoKS50b1N0cmluZygpKS50b0VxdWFsKHN0YWtlYWJsZUxvY2tPdXQyLmdldFN0YWtlYWJsZUxvY2t0aW1lKCkudG9TdHJpbmcoKSk7XG4gICAgICBleHBlY3Qoc2xpMi5nZXRTdGFrZWFibGVMb2NrdGltZSgpLnRvU3RyaW5nKCkpLnRvRXF1YWwoc3Rha2VhYmxlTG9ja091dDEuZ2V0U3Rha2VhYmxlTG9ja3RpbWUoKS50b1N0cmluZygpKTtcbiAgICAgIC8vIHN0b3AgdGVzdCBpbnB1dHNcblxuICAgICAgLy8gc3RhcnQgdGVzdCBvdXRwdXRzXG4gICAgICBsZXQgb3V0czogVHJhbnNmZXJhYmxlT3V0cHV0W10gPSB0eC5nZXRPdXRzKCk7XG4gICAgICAvLyBjb25maXJtIG9ubHkgMSBvdXRwdXRcbiAgICAgIGV4cGVjdChvdXRzLmxlbmd0aCkudG9CZSgxKTtcbiAgICAgIGxldCBvdXRwdXQ6IFRyYW5zZmVyYWJsZU91dHB1dCA9IG91dHNbMF07XG4gICAgICBsZXQgYW8zID0gb3V0cHV0LmdldE91dHB1dCgpIGFzIEFtb3VudE91dHB1dDtcbiAgICAgIC8vIGNvbmZpcm0gb3V0cHV0IGFtb3VudCBtYXRjaGVzIHRoZSBvdXRwdXQgYW1vdW50IHNhbnMgdGhlIDJuZCB1dHhvIGFtb3VudCBhbmQgdGhlIHN0YWtlIGFtb3VudFxuICAgICAgZXhwZWN0KGFvMy5nZXRBbW91bnQoKS50b1N0cmluZygpKS50b0VxdWFsKGFvMi5nZXRBbW91bnQoKS5zdWIoc3Rha2VBbW91bnQuc3ViKGFvMS5nZXRBbW91bnQoKSkpLnRvU3RyaW5nKCkpXG5cbiAgICAgIGxldCBzbG8gPSBvdXRwdXQuZ2V0T3V0cHV0KCkgYXMgU3Rha2VhYmxlTG9ja091dDtcbiAgICAgIC8vIGNvbmZpcm0gb3V0cHV0IHN0YWtlYWJsZWxvY2sgdGltZSBtYXRjaGVzIHRoZSBvdXRwdXQgdy8gdGhlIGxlc3NlciBzdGFrZWFibGVsb2NrIHNpbmNlIHRoZSBvdGhlciB3YXMgY29uc3VtZWRcbiAgICAgIGV4cGVjdChzbG8uZ2V0U3Rha2VhYmxlTG9ja3RpbWUoKS50b1N0cmluZygpKS50b0VxdWFsKHN0YWtlYWJsZUxvY2tPdXQxLmdldFN0YWtlYWJsZUxvY2t0aW1lKCkudG9TdHJpbmcoKSk7XG4gICAgICAvLyBjb25maXJtIG91dHB1dCBzdGFrZWFibGVsb2NrIHRpbWUgZG9lc24ndCBtYXRjaCB0aGUgb3V0cHV0IHcvIHRoZSBncmVhdGVyIHN0YWtlYWJsZWxvY2sgdGltZSAgXG4gICAgICBleHBlY3Qoc2xvLmdldFN0YWtlYWJsZUxvY2t0aW1lKCkudG9TdHJpbmcoKSkubm90LnRvRXF1YWwoc3Rha2VhYmxlTG9ja091dDIuZ2V0U3Rha2VhYmxlTG9ja3RpbWUoKS50b1N0cmluZygpKTtcblxuICAgICAgLy8gY29uZmlybSB0eCBub2RlSUQgbWF0Y2hlcyBub2RlSURcbiAgICAgIGV4cGVjdCh0eC5nZXROb2RlSURTdHJpbmcoKSkudG9FcXVhbChub2RlSUQpO1xuICAgICAgLy8gY29uZmlybSB0eCBzdGFydHRpbWUgbWF0Y2hlcyBzdGFydHRpbWVcbiAgICAgIGV4cGVjdCh0eC5nZXRTdGFydFRpbWUoKS50b1N0cmluZygpKS50b0VxdWFsKHN0YXJ0VGltZS50b1N0cmluZygpKTtcbiAgICAgIC8vIGNvbmZpcm0gdHggZW5kdGltZSBtYXRjaGVzIGVuZHRpbWUgXG4gICAgICBleHBlY3QodHguZ2V0RW5kVGltZSgpLnRvU3RyaW5nKCkpLnRvRXF1YWwoZW5kVGltZS50b1N0cmluZygpKTtcbiAgICAgIC8vIGNvbmZpcm0gdHggc3Rha2UgYW1vdW50IG1hdGNoZXMgc3Rha2VBbW91bnRcbiAgICAgIGV4cGVjdCh0eC5nZXRTdGFrZUFtb3VudCgpLnRvU3RyaW5nKCkpLnRvRXF1YWwoc3Rha2VBbW91bnQudG9TdHJpbmcoKSk7XG5cbiAgICAgIGxldCBzdGFrZU91dHM6IFRyYW5zZmVyYWJsZU91dHB1dFtdID0gdHguZ2V0U3Rha2VPdXRzKCk7XG4gICAgICAvLyBjb25maXJtIDIgc3Rha2VPdXRzXG4gICAgICBleHBlY3Qoc3Rha2VPdXRzLmxlbmd0aCkudG9CZSgyKTtcblxuICAgICAgbGV0IHN0YWtlT3V0MTogVHJhbnNmZXJhYmxlT3V0cHV0ID0gc3Rha2VPdXRzWzBdO1xuICAgICAgbGV0IHN0YWtlT3V0MjogVHJhbnNmZXJhYmxlT3V0cHV0ID0gc3Rha2VPdXRzWzFdO1xuICAgICAgbGV0IHNsbzIgPSBzdGFrZU91dDEuZ2V0T3V0cHV0KCkgYXMgU3Rha2VhYmxlTG9ja091dDtcbiAgICAgIGxldCBzbG8zID0gc3Rha2VPdXQyLmdldE91dHB1dCgpIGFzIFN0YWtlYWJsZUxvY2tPdXQ7XG4gICAgICAvLyBjb25maXJtIGJvdGggc3Rha2VPdXQgc3RyYWtlYWJsZWxvY2sgdGltZXMgbWF0Y2hlIHRoZSBjb3JyZXNwb25kaW5nIG91dHB1dCAgXG4gICAgICBleHBlY3Qoc2xvMy5nZXRTdGFrZWFibGVMb2NrdGltZSgpLnRvU3RyaW5nKCkpLnRvRXF1YWwoc3Rha2VhYmxlTG9ja091dDEuZ2V0U3Rha2VhYmxlTG9ja3RpbWUoKS50b1N0cmluZygpKTtcbiAgICAgIGV4cGVjdChzbG8yLmdldFN0YWtlYWJsZUxvY2t0aW1lKCkudG9TdHJpbmcoKSkudG9FcXVhbChzdGFrZWFibGVMb2NrT3V0Mi5nZXRTdGFrZWFibGVMb2NrdGltZSgpLnRvU3RyaW5nKCkpO1xuICAgIH0pO1xuXG4gICAgdGVzdCgnYnVpbGRBZGRWYWxpZGF0b3JUeCAxJywgYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgYWRkcmJ1ZmYxID0gYWRkcnMxLm1hcCgoYSkgPT4gcGxhdGZvcm12bS5wYXJzZUFkZHJlc3MoYSkpO1xuICAgICAgY29uc3QgYWRkcmJ1ZmYyID0gYWRkcnMyLm1hcCgoYSkgPT4gcGxhdGZvcm12bS5wYXJzZUFkZHJlc3MoYSkpO1xuICAgICAgY29uc3QgYWRkcmJ1ZmYzID0gYWRkcnMzLm1hcCgoYSkgPT4gcGxhdGZvcm12bS5wYXJzZUFkZHJlc3MoYSkpO1xuICAgICAgY29uc3QgYW1vdW50OkJOID0gRGVmYXVsdHMubmV0d29ya1tuZXR3b3JraWRdW1wiUFwiXS5taW5TdGFrZS5hZGQobmV3IEJOKGZlZSkpO1xuXG4gICAgICBjb25zdCBsb2NrdGltZTpCTiA9IG5ldyBCTig1NDMyMSk7XG4gICAgICBjb25zdCB0aHJlc2hvbGQ6bnVtYmVyID0gMjtcblxuICAgICAgcGxhdGZvcm12bS5zZXRNaW5TdGFrZShEZWZhdWx0cy5uZXR3b3JrW25ldHdvcmtpZF1bXCJQXCJdLm1pblN0YWtlLCBEZWZhdWx0cy5uZXR3b3JrW25ldHdvcmtpZF1bXCJQXCJdLm1pbkRlbGVnYXRpb25TdGFrZSk7XG5cbiAgICAgIGNvbnN0IHR4dTE6VW5zaWduZWRUeCA9IGF3YWl0IHBsYXRmb3Jtdm0uYnVpbGRBZGRWYWxpZGF0b3JUeChcbiAgICAgICAgc2V0LCBcbiAgICAgICAgYWRkcnMzLFxuICAgICAgICBhZGRyczEsIFxuICAgICAgICBhZGRyczIsIFxuICAgICAgICBub2RlSUQsIFxuICAgICAgICBzdGFydFRpbWUsXG4gICAgICAgIGVuZFRpbWUsXG4gICAgICAgIGFtb3VudCxcbiAgICAgICAgYWRkcnMzLCBcbiAgICAgICAgMC4xMzM0NTU2LFxuICAgICAgICBsb2NrdGltZSxcbiAgICAgICAgdGhyZXNob2xkLFxuICAgICAgICBuZXcgVVRGOFBheWxvYWQoXCJoZWxsbyB3b3JsZFwiKSwgVW5peE5vdygpXG4gICAgICApO1xuXG4gICAgICBjb25zdCB0eHUyOlVuc2lnbmVkVHggPSBzZXQuYnVpbGRBZGRWYWxpZGF0b3JUeChcbiAgICAgICAgbmV0d29ya2lkLCBiaW50b29scy5jYjU4RGVjb2RlKGJsb2NrY2hhaW5pZCksIFxuICAgICAgICBhc3NldElELFxuICAgICAgICBhZGRyYnVmZjMsXG4gICAgICAgIGFkZHJidWZmMSwgICAgICAgICBcbiAgICAgICAgYWRkcmJ1ZmYyLCBcbiAgICAgICAgTm9kZUlEU3RyaW5nVG9CdWZmZXIobm9kZUlEKSwgXG4gICAgICAgIHN0YXJ0VGltZSxcbiAgICAgICAgZW5kVGltZSxcbiAgICAgICAgYW1vdW50LFxuICAgICAgICBsb2NrdGltZSxcbiAgICAgICAgdGhyZXNob2xkLFxuICAgICAgICBhZGRyYnVmZjMsXG4gICAgICAgIDAuMTMzNSxcbiAgICAgICAgbmV3IEJOKDApLFxuICAgICAgICBhc3NldElELFxuICAgICAgICBuZXcgVVRGOFBheWxvYWQoXCJoZWxsbyB3b3JsZFwiKS5nZXRQYXlsb2FkKCksIFVuaXhOb3coKVxuICAgICAgKTtcbiAgICAgIGV4cGVjdCh0eHUyLnRvQnVmZmVyKCkudG9TdHJpbmcoJ2hleCcpKS50b0JlKHR4dTEudG9CdWZmZXIoKS50b1N0cmluZygnaGV4JykpO1xuICAgICAgZXhwZWN0KHR4dTIudG9TdHJpbmcoKSkudG9CZSh0eHUxLnRvU3RyaW5nKCkpO1xuXG4gICAgICBsZXQgdHgxOlR4ID0gdHh1MS5zaWduKHBsYXRmb3Jtdm0ua2V5Q2hhaW4oKSk7XG4gICAgICBsZXQgY2hlY2tUeDpzdHJpbmcgPSB0eDEudG9CdWZmZXIoKS50b1N0cmluZyhcImhleFwiKTtcbiAgICAgIGxldCB0eDFvYmo6b2JqZWN0ID0gdHgxLnNlcmlhbGl6ZShcImhleFwiKTtcbiAgICAgIGxldCB0eDFzdHI6c3RyaW5nID0gSlNPTi5zdHJpbmdpZnkodHgxb2JqKTtcbiAgICAgIFxuICAgICAgbGV0IHR4Mm5ld29iajpvYmplY3QgPSBKU09OLnBhcnNlKHR4MXN0cik7XG4gICAgICBsZXQgdHgyOlR4ID0gbmV3IFR4KCk7XG4gICAgICB0eDIuZGVzZXJpYWxpemUodHgybmV3b2JqLCBcImhleFwiKTtcblxuICAgICAgZXhwZWN0KHR4Mi50b0J1ZmZlcigpLnRvU3RyaW5nKFwiaGV4XCIpKS50b0JlKGNoZWNrVHgpO1xuXG4gICAgICBsZXQgdHgzOlR4ID0gdHh1MS5zaWduKHBsYXRmb3Jtdm0ua2V5Q2hhaW4oKSk7XG4gICAgICBsZXQgdHgzb2JqOm9iamVjdCA9IHR4My5zZXJpYWxpemUoXCJkaXNwbGF5XCIpO1xuICAgICAgbGV0IHR4M3N0cjpzdHJpbmcgPSBKU09OLnN0cmluZ2lmeSh0eDNvYmopO1xuICAgICAgXG4gICAgICBsZXQgdHg0bmV3b2JqOm9iamVjdCA9IEpTT04ucGFyc2UodHgzc3RyKTtcbiAgICAgIGxldCB0eDQ6VHggPSBuZXcgVHgoKTtcbiAgICAgIHR4NC5kZXNlcmlhbGl6ZSh0eDRuZXdvYmosIFwiZGlzcGxheVwiKTtcblxuICAgICAgZXhwZWN0KHR4NC50b0J1ZmZlcigpLnRvU3RyaW5nKFwiaGV4XCIpKS50b0JlKGNoZWNrVHgpO1xuXG4gICAgICBzZXJpYWx6ZWl0KHR4MSwgXCJBZGRWYWxpZGF0b3JUeFwiKTtcblxuICAgIH0pO1xuXG4gICAgdGVzdCgnYnVpbGRBZGREZWxlZ2F0b3JUeCAyJywgYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgYWRkcmJ1ZmYxID0gYWRkcnMxLm1hcCgoYSkgPT4gcGxhdGZvcm12bS5wYXJzZUFkZHJlc3MoYSkpO1xuICAgICAgY29uc3QgYWRkcmJ1ZmYyID0gYWRkcnMyLm1hcCgoYSkgPT4gcGxhdGZvcm12bS5wYXJzZUFkZHJlc3MoYSkpO1xuICAgICAgY29uc3QgYWRkcmJ1ZmYzID0gYWRkcnMzLm1hcCgoYSkgPT4gcGxhdGZvcm12bS5wYXJzZUFkZHJlc3MoYSkpO1xuICAgICAgY29uc3QgYW1vdW50OkJOID0gRGVmYXVsdHMubmV0d29ya1tuZXR3b3JraWRdW1wiUFwiXS5taW5EZWxlZ2F0aW9uU3Rha2U7XG5cbiAgICAgIGNvbnN0IGxvY2t0aW1lOkJOID0gbmV3IEJOKDU0MzIxKTtcbiAgICAgIGNvbnN0IHRocmVzaG9sZDpudW1iZXIgPSAyO1xuXG4gICAgICBwbGF0Zm9ybXZtLnNldE1pblN0YWtlKERlZmF1bHRzLm5ldHdvcmtbbmV0d29ya2lkXVtcIlBcIl0ubWluU3Rha2UsIERlZmF1bHRzLm5ldHdvcmtbbmV0d29ya2lkXVtcIlBcIl0ubWluRGVsZWdhdGlvblN0YWtlKTtcblxuICAgICAgY29uc3QgdHh1MTpVbnNpZ25lZFR4ID0gYXdhaXQgcGxhdGZvcm12bS5idWlsZEFkZERlbGVnYXRvclR4KFxuICAgICAgICBsc2V0LCBcbiAgICAgICAgYWRkcnMzLFxuICAgICAgICBhZGRyczEsIFxuICAgICAgICBhZGRyczIsIFxuICAgICAgICBub2RlSUQsIFxuICAgICAgICBzdGFydFRpbWUsXG4gICAgICAgIGVuZFRpbWUsXG4gICAgICAgIGFtb3VudCxcbiAgICAgICAgYWRkcnMzLCBcbiAgICAgICAgbG9ja3RpbWUsXG4gICAgICAgIHRocmVzaG9sZCxcbiAgICAgICAgbmV3IFVURjhQYXlsb2FkKFwiaGVsbG8gd29ybGRcIiksIFVuaXhOb3coKVxuICAgICAgKTtcblxuICAgICAgY29uc3QgdHh1MjpVbnNpZ25lZFR4ID0gbHNldC5idWlsZEFkZERlbGVnYXRvclR4KFxuICAgICAgICBuZXR3b3JraWQsIGJpbnRvb2xzLmNiNThEZWNvZGUoYmxvY2tjaGFpbmlkKSwgXG4gICAgICAgIGFzc2V0SUQsXG4gICAgICAgIGFkZHJidWZmMyxcbiAgICAgICAgYWRkcmJ1ZmYxLCAgICAgICAgIFxuICAgICAgICBhZGRyYnVmZjIsIFxuICAgICAgICBOb2RlSURTdHJpbmdUb0J1ZmZlcihub2RlSUQpLCBcbiAgICAgICAgc3RhcnRUaW1lLFxuICAgICAgICBlbmRUaW1lLFxuICAgICAgICBhbW91bnQsXG4gICAgICAgIGxvY2t0aW1lLFxuICAgICAgICB0aHJlc2hvbGQsXG4gICAgICAgIGFkZHJidWZmMyxcbiAgICAgICAgbmV3IEJOKDApLCBcbiAgICAgICAgYXNzZXRJRCxcbiAgICAgICAgbmV3IFVURjhQYXlsb2FkKFwiaGVsbG8gd29ybGRcIikuZ2V0UGF5bG9hZCgpLCBVbml4Tm93KClcbiAgICAgICk7XG4gICAgICBleHBlY3QodHh1Mi50b0J1ZmZlcigpLnRvU3RyaW5nKCdoZXgnKSkudG9CZSh0eHUxLnRvQnVmZmVyKCkudG9TdHJpbmcoJ2hleCcpKTtcbiAgICAgIGV4cGVjdCh0eHUyLnRvU3RyaW5nKCkpLnRvQmUodHh1MS50b1N0cmluZygpKTtcblxuICAgICAgbGV0IHR4MTpUeCA9IHR4dTEuc2lnbihwbGF0Zm9ybXZtLmtleUNoYWluKCkpO1xuICAgICAgbGV0IGNoZWNrVHg6c3RyaW5nID0gdHgxLnRvQnVmZmVyKCkudG9TdHJpbmcoXCJoZXhcIik7XG4gICAgICBsZXQgdHgxb2JqOm9iamVjdCA9IHR4MS5zZXJpYWxpemUoXCJoZXhcIik7XG4gICAgICBsZXQgdHgxc3RyOnN0cmluZyA9IEpTT04uc3RyaW5naWZ5KHR4MW9iaik7XG4gICAgICBcbiAgICAgIGxldCB0eDJuZXdvYmo6b2JqZWN0ID0gSlNPTi5wYXJzZSh0eDFzdHIpO1xuICAgICAgbGV0IHR4MjpUeCA9IG5ldyBUeCgpO1xuICAgICAgdHgyLmRlc2VyaWFsaXplKHR4Mm5ld29iaiwgXCJoZXhcIik7XG4gICAgICBcbiAgICAgIGV4cGVjdCh0eDIudG9CdWZmZXIoKS50b1N0cmluZyhcImhleFwiKSkudG9CZShjaGVja1R4KTtcblxuICAgICAgbGV0IHR4MzpUeCA9IHR4dTEuc2lnbihwbGF0Zm9ybXZtLmtleUNoYWluKCkpO1xuICAgICAgbGV0IHR4M29iajpvYmplY3QgPSB0eDMuc2VyaWFsaXplKFwiZGlzcGxheVwiKTtcbiAgICAgIGxldCB0eDNzdHI6c3RyaW5nID0gSlNPTi5zdHJpbmdpZnkodHgzb2JqKTtcbiAgICAgIFxuICAgICAgbGV0IHR4NG5ld29iajpvYmplY3QgPSBKU09OLnBhcnNlKHR4M3N0cik7XG4gICAgICBsZXQgdHg0OlR4ID0gbmV3IFR4KCk7XG4gICAgICB0eDQuZGVzZXJpYWxpemUodHg0bmV3b2JqLCBcImRpc3BsYXlcIik7XG4gICAgICBcbiAgICAgIGV4cGVjdCh0eDQudG9CdWZmZXIoKS50b1N0cmluZyhcImhleFwiKSkudG9CZShjaGVja1R4KTtcblxuICAgICAgc2VyaWFsemVpdCh0eDEsIFwiQWRkRGVsZWdhdG9yVHhcIik7XG5cbiAgICB9KTtcblxuICAgIHRlc3QoJ2J1aWxkQWRkVmFsaWRhdG9yVHggMicsIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IGFkZHJidWZmMSA9IGFkZHJzMS5tYXAoKGEpID0+IHBsYXRmb3Jtdm0ucGFyc2VBZGRyZXNzKGEpKTtcbiAgICAgIGNvbnN0IGFkZHJidWZmMiA9IGFkZHJzMi5tYXAoKGEpID0+IHBsYXRmb3Jtdm0ucGFyc2VBZGRyZXNzKGEpKTtcbiAgICAgIGNvbnN0IGFkZHJidWZmMyA9IGFkZHJzMy5tYXAoKGEpID0+IHBsYXRmb3Jtdm0ucGFyc2VBZGRyZXNzKGEpKTtcbiAgICAgIGNvbnN0IGFtb3VudDpCTiA9IE9ORUFWQVgubXVsKG5ldyBCTigyNSkpO1xuXG4gICAgICBjb25zdCBsb2NrdGltZTpCTiA9IG5ldyBCTig1NDMyMSk7XG4gICAgICBjb25zdCB0aHJlc2hvbGQ6bnVtYmVyID0gMjtcblxuICAgICAgcGxhdGZvcm12bS5zZXRNaW5TdGFrZShPTkVBVkFYLm11bChuZXcgQk4oMjUpKSwgT05FQVZBWC5tdWwobmV3IEJOKDI1KSkpO1xuXG4gICAgICBjb25zdCB0eHUxOlVuc2lnbmVkVHggPSBhd2FpdCBwbGF0Zm9ybXZtLmJ1aWxkQWRkVmFsaWRhdG9yVHgoXG4gICAgICAgIGxzZXQsIFxuICAgICAgICBhZGRyczMsXG4gICAgICAgIGFkZHJzMSwgXG4gICAgICAgIGFkZHJzMiwgXG4gICAgICAgIG5vZGVJRCwgXG4gICAgICAgIHN0YXJ0VGltZSxcbiAgICAgICAgZW5kVGltZSxcbiAgICAgICAgYW1vdW50LFxuICAgICAgICBhZGRyczMsIFxuICAgICAgICAwLjEzMzQ1NTYsXG4gICAgICAgIGxvY2t0aW1lLFxuICAgICAgICB0aHJlc2hvbGQsXG4gICAgICAgIG5ldyBVVEY4UGF5bG9hZChcImhlbGxvIHdvcmxkXCIpLCBVbml4Tm93KClcbiAgICAgICk7XG5cbiAgICAgIGNvbnN0IHR4dTI6VW5zaWduZWRUeCA9IGxzZXQuYnVpbGRBZGRWYWxpZGF0b3JUeChcbiAgICAgICAgbmV0d29ya2lkLCBiaW50b29scy5jYjU4RGVjb2RlKGJsb2NrY2hhaW5pZCksIFxuICAgICAgICBhc3NldElELFxuICAgICAgICBhZGRyYnVmZjMsXG4gICAgICAgIGFkZHJidWZmMSwgICAgICAgICBcbiAgICAgICAgYWRkcmJ1ZmYyLCBcbiAgICAgICAgTm9kZUlEU3RyaW5nVG9CdWZmZXIobm9kZUlEKSwgXG4gICAgICAgIHN0YXJ0VGltZSxcbiAgICAgICAgZW5kVGltZSxcbiAgICAgICAgYW1vdW50LFxuICAgICAgICBsb2NrdGltZSxcbiAgICAgICAgdGhyZXNob2xkLFxuICAgICAgICBhZGRyYnVmZjMsXG4gICAgICAgIDAuMTMzNSxcbiAgICAgICAgbmV3IEJOKDApLCBcbiAgICAgICAgYXNzZXRJRCxcbiAgICAgICAgbmV3IFVURjhQYXlsb2FkKFwiaGVsbG8gd29ybGRcIikuZ2V0UGF5bG9hZCgpLCBVbml4Tm93KClcbiAgICAgICk7XG4gICAgICBleHBlY3QodHh1Mi50b0J1ZmZlcigpLnRvU3RyaW5nKCdoZXgnKSkudG9CZSh0eHUxLnRvQnVmZmVyKCkudG9TdHJpbmcoJ2hleCcpKTtcbiAgICAgIGV4cGVjdCh0eHUyLnRvU3RyaW5nKCkpLnRvQmUodHh1MS50b1N0cmluZygpKTtcblxuICAgICAgbGV0IHR4MTpUeCA9IHR4dTEuc2lnbihwbGF0Zm9ybXZtLmtleUNoYWluKCkpO1xuICAgICAgbGV0IGNoZWNrVHg6c3RyaW5nID0gdHgxLnRvQnVmZmVyKCkudG9TdHJpbmcoXCJoZXhcIik7XG4gICAgICBsZXQgdHgxb2JqOm9iamVjdCA9IHR4MS5zZXJpYWxpemUoXCJoZXhcIik7XG4gICAgICBsZXQgdHgxc3RyOnN0cmluZyA9IEpTT04uc3RyaW5naWZ5KHR4MW9iaik7XG4gICAgICBcbiAgICAgIGxldCB0eDJuZXdvYmo6b2JqZWN0ID0gSlNPTi5wYXJzZSh0eDFzdHIpO1xuICAgICAgbGV0IHR4MjpUeCA9IG5ldyBUeCgpO1xuICAgICAgdHgyLmRlc2VyaWFsaXplKHR4Mm5ld29iaiwgXCJoZXhcIik7XG5cbiAgICAgIGV4cGVjdCh0eDIudG9CdWZmZXIoKS50b1N0cmluZyhcImhleFwiKSkudG9CZShjaGVja1R4KTtcblxuICAgICAgbGV0IHR4MzpUeCA9IHR4dTEuc2lnbihwbGF0Zm9ybXZtLmtleUNoYWluKCkpO1xuICAgICAgbGV0IHR4M29iajpvYmplY3QgPSB0eDMuc2VyaWFsaXplKFwiZGlzcGxheVwiKTtcbiAgICAgIGxldCB0eDNzdHI6c3RyaW5nID0gSlNPTi5zdHJpbmdpZnkodHgzb2JqKTtcbiAgICAgIFxuICAgICAgbGV0IHR4NG5ld29iajpvYmplY3QgPSBKU09OLnBhcnNlKHR4M3N0cik7XG4gICAgICBsZXQgdHg0OlR4ID0gbmV3IFR4KCk7XG4gICAgICB0eDQuZGVzZXJpYWxpemUodHg0bmV3b2JqLCBcImRpc3BsYXlcIik7XG5cbiAgICAgIGV4cGVjdCh0eDQudG9CdWZmZXIoKS50b1N0cmluZyhcImhleFwiKSkudG9CZShjaGVja1R4KTtcblxuICAgICAgc2VyaWFsemVpdCh0eDEsIFwiQWRkVmFsaWRhdG9yVHhcIik7XG5cbiAgICB9KTtcblxuICAgIHRlc3QoJ2J1aWxkQWRkVmFsaWRhdG9yVHggMycsIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IGFkZHJidWZmMSA9IGFkZHJzMS5tYXAoKGEpID0+IHBsYXRmb3Jtdm0ucGFyc2VBZGRyZXNzKGEpKTtcbiAgICAgIGNvbnN0IGFkZHJidWZmMiA9IGFkZHJzMi5tYXAoKGEpID0+IHBsYXRmb3Jtdm0ucGFyc2VBZGRyZXNzKGEpKTtcbiAgICAgIGNvbnN0IGFkZHJidWZmMyA9IGFkZHJzMy5tYXAoKGEpID0+IHBsYXRmb3Jtdm0ucGFyc2VBZGRyZXNzKGEpKTtcbiAgICAgIGNvbnN0IGFtb3VudDpCTiA9IE9ORUFWQVgubXVsKG5ldyBCTigzKSk7XG5cbiAgICAgIGNvbnN0IGxvY2t0aW1lOkJOID0gbmV3IEJOKDU0MzIxKTtcbiAgICAgIGNvbnN0IHRocmVzaG9sZDpudW1iZXIgPSAyO1xuXG4gICAgICBwbGF0Zm9ybXZtLnNldE1pblN0YWtlKE9ORUFWQVgubXVsKG5ldyBCTigzKSksIE9ORUFWQVgubXVsKG5ldyBCTigzKSkpO1xuXG4gICAgICAvLzIgdXR4b3M7IG9uZSBsb2NrZWRzdGFrZWFibGU7IG90aGVyIHVubG9ja2VkOyBib3RoIHV0eG9zIGhhdmUgMiBhdmF4OyBzdGFrZSAzIEFWQVhcblxuICAgICAgbGV0IGR1bW15U2V0OlVUWE9TZXQgPSBuZXcgVVRYT1NldCgpO1xuXG4gICAgICBsZXQgbG9ja2VkQmFzZU91dDpTRUNQVHJhbnNmZXJPdXRwdXQgPSBuZXcgU0VDUFRyYW5zZmVyT3V0cHV0KE9ORUFWQVgubXVsKG5ldyBCTigyKSksIGFkZHJidWZmMSwgbG9ja3RpbWUsIDEpO1xuICAgICAgbGV0IGxvY2tlZEJhc2VYT3V0OlBhcnNlYWJsZU91dHB1dCA9IG5ldyBQYXJzZWFibGVPdXRwdXQobG9ja2VkQmFzZU91dCk7XG4gICAgICBsZXQgbG9ja2VkT3V0OlN0YWtlYWJsZUxvY2tPdXQgPSBuZXcgU3Rha2VhYmxlTG9ja091dChPTkVBVkFYLm11bChuZXcgQk4oMikpLCBhZGRyYnVmZjEsIGxvY2t0aW1lLCAxLCBsb2NrdGltZSwgbG9ja2VkQmFzZVhPdXQpXG4gICAgICBcbiAgICAgIGxldCB0eGlkTG9ja2VkOkJ1ZmZlciA9IEJ1ZmZlci5hbGxvYygzMik7XG4gICAgICB0eGlkTG9ja2VkLmZpbGwoMSk7XG4gICAgICBsZXQgdHhpZHhMb2NrZWQ6QnVmZmVyID0gQnVmZmVyLmFsbG9jKDQpO1xuICAgICAgdHhpZHhMb2NrZWQud3JpdGVVSW50MzJCRSgxLCAwKTtcbiAgICAgIGNvbnN0IGx1OlVUWE8gPSBuZXcgVVRYTygwLCB0eGlkTG9ja2VkLCB0eGlkeExvY2tlZCwgYXNzZXRJRCwgbG9ja2VkT3V0KTtcbiAgICAgIFxuICAgICAgbGV0IHR4aWRVbmxvY2tlZDpCdWZmZXIgPSBCdWZmZXIuYWxsb2MoMzIpO1xuICAgICAgdHhpZFVubG9ja2VkLmZpbGwoMik7XG4gICAgICBsZXQgdHhpZHhVbmxvY2tlZDpCdWZmZXIgPSBCdWZmZXIuYWxsb2MoNCk7XG4gICAgICB0eGlkeFVubG9ja2VkLndyaXRlVUludDMyQkUoMiwgMCk7XG4gICAgICBsZXQgdW5sb2NrZWRPdXQ6U0VDUFRyYW5zZmVyT3V0cHV0ID0gbmV3IFNFQ1BUcmFuc2Zlck91dHB1dChPTkVBVkFYLm11bChuZXcgQk4oMikpLCBhZGRyYnVmZjEsIGxvY2t0aW1lLCAxKTtcbiAgICAgIGNvbnN0IHVsdTpVVFhPID0gbmV3IFVUWE8oMCwgdHhpZFVubG9ja2VkLCB0eGlkeFVubG9ja2VkLCBhc3NldElELCB1bmxvY2tlZE91dCk7XG5cbiAgICAgIGR1bW15U2V0LmFkZCh1bHUpO1xuICAgICAgZHVtbXlTZXQuYWRkKGx1KTtcblxuICAgICAgY29uc3QgdHh1MTpVbnNpZ25lZFR4ID0gYXdhaXQgcGxhdGZvcm12bS5idWlsZEFkZFZhbGlkYXRvclR4KFxuICAgICAgICBkdW1teVNldCwgXG4gICAgICAgIGFkZHJzMyxcbiAgICAgICAgYWRkcnMxLCBcbiAgICAgICAgYWRkcnMyLCBcbiAgICAgICAgbm9kZUlELCBcbiAgICAgICAgc3RhcnRUaW1lLFxuICAgICAgICBlbmRUaW1lLFxuICAgICAgICBhbW91bnQsXG4gICAgICAgIGFkZHJzMywgXG4gICAgICAgIDAuMTMzNDU1NixcbiAgICAgICAgbG9ja3RpbWUsXG4gICAgICAgIHRocmVzaG9sZCxcbiAgICAgICAgbmV3IFVURjhQYXlsb2FkKFwiaGVsbG8gd29ybGRcIiksIFVuaXhOb3coKVxuICAgICAgKTtcblxuICAgICAgbGV0IHR4dTFJbnMgPSAodHh1MS5nZXRUcmFuc2FjdGlvbigpIGFzIEFkZFZhbGlkYXRvclR4KS5nZXRJbnMoKTtcbiAgICAgIGxldCB0eHUxT3V0cyA9ICh0eHUxLmdldFRyYW5zYWN0aW9uKCkgYXMgQWRkVmFsaWRhdG9yVHgpLmdldE91dHMoKTtcbiAgICAgIGxldCB0eHUxU3Rha2UgPSAodHh1MS5nZXRUcmFuc2FjdGlvbigpIGFzIEFkZFZhbGlkYXRvclR4KS5nZXRTdGFrZU91dHMoKTtcbiAgICAgIGxldCB0eHUxVG90YWwgPSAodHh1MS5nZXRUcmFuc2FjdGlvbigpIGFzIEFkZFZhbGlkYXRvclR4KS5nZXRUb3RhbE91dHMoKTtcblxuICAgICAgbGV0IGludG90YWw6Qk4gPSBuZXcgQk4oMCk7XG5cbiAgICAgIGZvcihsZXQgaSA9IDA7IGkgPCB0eHUxSW5zLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGludG90YWwgPSBpbnRvdGFsLmFkZCgodHh1MUluc1tpXS5nZXRJbnB1dCgpIGFzIEFtb3VudElucHV0KS5nZXRBbW91bnQoKSk7XG4gICAgICB9XG5cbiAgICAgIGxldCBvdXR0b3RhbDpCTiA9IG5ldyBCTigwKTtcblxuICAgICAgZm9yKGxldCBpID0gMDsgaSA8IHR4dTFPdXRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIG91dHRvdGFsID0gb3V0dG90YWwuYWRkKCh0eHUxT3V0c1tpXS5nZXRPdXRwdXQoKSBhcyBBbW91bnRPdXRwdXQpLmdldEFtb3VudCgpKTtcbiAgICAgIH1cblxuICAgICAgbGV0IHN0YWtldG90YWw6Qk4gPSBuZXcgQk4oMCk7XG5cbiAgICAgIGZvcihsZXQgaSA9IDA7IGkgPCB0eHUxU3Rha2UubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgc3Rha2V0b3RhbCA9IHN0YWtldG90YWwuYWRkKCh0eHUxU3Rha2VbaV0uZ2V0T3V0cHV0KCkgYXMgQW1vdW50T3V0cHV0KS5nZXRBbW91bnQoKSk7XG4gICAgICB9XG5cbiAgICAgIGxldCB0b3RhbHRvdGFsOkJOID0gbmV3IEJOKDApO1xuXG4gICAgICBmb3IobGV0IGkgPSAwOyBpIDwgdHh1MVRvdGFsLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHRvdGFsdG90YWwgPSB0b3RhbHRvdGFsLmFkZCgodHh1MVRvdGFsW2ldLmdldE91dHB1dCgpIGFzIEFtb3VudE91dHB1dCkuZ2V0QW1vdW50KCkpO1xuICAgICAgfVxuXG4gICAgICBleHBlY3QoaW50b3RhbC50b1N0cmluZygxMCkpLnRvQmUoXCI0MDAwMDAwMDAwXCIpO1xuICAgICAgZXhwZWN0KG91dHRvdGFsLnRvU3RyaW5nKDEwKSkudG9CZShcIjEwMDAwMDAwMDBcIik7XG4gICAgICBleHBlY3Qoc3Rha2V0b3RhbC50b1N0cmluZygxMCkpLnRvQmUoXCIzMDAwMDAwMDAwXCIpO1xuICAgICAgZXhwZWN0KHRvdGFsdG90YWwudG9TdHJpbmcoMTApKS50b0JlKFwiNDAwMDAwMDAwMFwiKTtcblxuICAgIH0pO1xuXG4gICAgdGVzdCgnYnVpbGRDcmVhdGVTdWJuZXRUeDEnLCBhc3luYyAoKSA9PiB7XG4gICAgICBwbGF0Zm9ybXZtLnNldENyZWF0aW9uVHhGZWUobmV3IEJOKDEwKSk7XG4gICAgICBjb25zdCBhZGRyYnVmZjEgPSBhZGRyczEubWFwKChhKSA9PiBwbGF0Zm9ybXZtLnBhcnNlQWRkcmVzcyhhKSk7XG4gICAgICBjb25zdCBhZGRyYnVmZjIgPSBhZGRyczIubWFwKChhKSA9PiBwbGF0Zm9ybXZtLnBhcnNlQWRkcmVzcyhhKSk7XG4gICAgICBjb25zdCBhZGRyYnVmZjMgPSBhZGRyczMubWFwKChhKSA9PiBwbGF0Zm9ybXZtLnBhcnNlQWRkcmVzcyhhKSk7XG5cbiAgICAgIGNvbnN0IHR4dTE6VW5zaWduZWRUeCA9IGF3YWl0IHBsYXRmb3Jtdm0uYnVpbGRDcmVhdGVTdWJuZXRUeChcbiAgICAgICAgc2V0LCBcbiAgICAgICAgYWRkcnMxLCBcbiAgICAgICAgYWRkcnMyLCBcbiAgICAgICAgYWRkcnMzLCBcbiAgICAgICAgMSxcbiAgICAgICAgbmV3IFVURjhQYXlsb2FkKFwiaGVsbG8gd29ybGRcIiksIFVuaXhOb3coKVxuICAgICAgKTtcblxuICAgICAgY29uc3QgdHh1MjpVbnNpZ25lZFR4ID0gc2V0LmJ1aWxkQ3JlYXRlU3VibmV0VHgoXG4gICAgICAgIG5ldHdvcmtpZCwgYmludG9vbHMuY2I1OERlY29kZShibG9ja2NoYWluaWQpLCBcbiAgICAgICAgYWRkcmJ1ZmYxLCAgICAgICAgIFxuICAgICAgICBhZGRyYnVmZjIsIFxuICAgICAgICBhZGRyYnVmZjMsXG4gICAgICAgIDEsXG4gICAgICAgIHBsYXRmb3Jtdm0uZ2V0Q3JlYXRpb25UeEZlZSgpLCBcbiAgICAgICAgYXNzZXRJRCxcbiAgICAgICAgbmV3IFVURjhQYXlsb2FkKFwiaGVsbG8gd29ybGRcIikuZ2V0UGF5bG9hZCgpLCBVbml4Tm93KClcbiAgICAgICk7XG4gICAgICBleHBlY3QodHh1Mi50b0J1ZmZlcigpLnRvU3RyaW5nKCdoZXgnKSkudG9CZSh0eHUxLnRvQnVmZmVyKCkudG9TdHJpbmcoJ2hleCcpKTtcbiAgICAgIGV4cGVjdCh0eHUyLnRvU3RyaW5nKCkpLnRvQmUodHh1MS50b1N0cmluZygpKTtcblxuICAgICAgbGV0IHR4MTpUeCA9IHR4dTEuc2lnbihwbGF0Zm9ybXZtLmtleUNoYWluKCkpO1xuICAgICAgbGV0IGNoZWNrVHg6c3RyaW5nID0gdHgxLnRvQnVmZmVyKCkudG9TdHJpbmcoXCJoZXhcIik7XG4gICAgICBsZXQgdHgxb2JqOm9iamVjdCA9IHR4MS5zZXJpYWxpemUoXCJoZXhcIik7XG4gICAgICBsZXQgdHgxc3RyOnN0cmluZyA9IEpTT04uc3RyaW5naWZ5KHR4MW9iaik7XG4gICAgICBcbiAgICAgIGxldCB0eDJuZXdvYmo6b2JqZWN0ID0gSlNPTi5wYXJzZSh0eDFzdHIpO1xuICAgICAgbGV0IHR4MjpUeCA9IG5ldyBUeCgpO1xuICAgICAgdHgyLmRlc2VyaWFsaXplKHR4Mm5ld29iaiwgXCJoZXhcIik7XG4gICAgICBcbiAgICAgIGV4cGVjdCh0eDIudG9CdWZmZXIoKS50b1N0cmluZyhcImhleFwiKSkudG9CZShjaGVja1R4KTtcblxuICAgICAgbGV0IHR4MzpUeCA9IHR4dTEuc2lnbihwbGF0Zm9ybXZtLmtleUNoYWluKCkpO1xuICAgICAgbGV0IHR4M29iajpvYmplY3QgPSB0eDMuc2VyaWFsaXplKFwiZGlzcGxheVwiKTtcbiAgICAgIGxldCB0eDNzdHI6c3RyaW5nID0gSlNPTi5zdHJpbmdpZnkodHgzb2JqKTtcbiAgICAgIFxuICAgICAgbGV0IHR4NG5ld29iajpvYmplY3QgPSBKU09OLnBhcnNlKHR4M3N0cik7XG4gICAgICBsZXQgdHg0OlR4ID0gbmV3IFR4KCk7XG4gICAgICB0eDQuZGVzZXJpYWxpemUodHg0bmV3b2JqLCBcImRpc3BsYXlcIik7XG4gICAgICBcbiAgICAgIGV4cGVjdCh0eDQudG9CdWZmZXIoKS50b1N0cmluZyhcImhleFwiKSkudG9CZShjaGVja1R4KTtcblxuICAgICAgc2VyaWFsemVpdCh0eDEsIFwiQ3JlYXRlU3VibmV0VHhcIik7XG5cbiAgICB9KTtcblxuICAgIHRlc3QoJ2J1aWxkQ3JlYXRlU3VibmV0VHggMicsIGFzeW5jICgpID0+IHtcbiAgICAgIHBsYXRmb3Jtdm0uc2V0Q3JlYXRpb25UeEZlZShuZXcgQk4oMTApKTtcbiAgICAgIGNvbnN0IGFkZHJidWZmMSA9IGFkZHJzMS5tYXAoKGEpID0+IHBsYXRmb3Jtdm0ucGFyc2VBZGRyZXNzKGEpKTtcbiAgICAgIGNvbnN0IGFkZHJidWZmMiA9IGFkZHJzMi5tYXAoKGEpID0+IHBsYXRmb3Jtdm0ucGFyc2VBZGRyZXNzKGEpKTtcbiAgICAgIGNvbnN0IGFkZHJidWZmMyA9IGFkZHJzMy5tYXAoKGEpID0+IHBsYXRmb3Jtdm0ucGFyc2VBZGRyZXNzKGEpKTtcblxuICAgICAgY29uc3QgdHh1MTpVbnNpZ25lZFR4ID0gYXdhaXQgcGxhdGZvcm12bS5idWlsZENyZWF0ZVN1Ym5ldFR4KFxuICAgICAgICBsc2V0LCBcbiAgICAgICAgYWRkcnMxLCBcbiAgICAgICAgYWRkcnMyLCBcbiAgICAgICAgYWRkcnMzLCBcbiAgICAgICAgMSxcbiAgICAgICAgbmV3IFVURjhQYXlsb2FkKFwiaGVsbG8gd29ybGRcIiksIFVuaXhOb3coKVxuICAgICAgKTtcblxuICAgICAgY29uc3QgdHh1MjpVbnNpZ25lZFR4ID0gbHNldC5idWlsZENyZWF0ZVN1Ym5ldFR4KFxuICAgICAgICBuZXR3b3JraWQsIGJpbnRvb2xzLmNiNThEZWNvZGUoYmxvY2tjaGFpbmlkKSwgXG4gICAgICAgIGFkZHJidWZmMSwgICAgICAgICBcbiAgICAgICAgYWRkcmJ1ZmYyLCBcbiAgICAgICAgYWRkcmJ1ZmYzLFxuICAgICAgICAxLCBcbiAgICAgICAgcGxhdGZvcm12bS5nZXRDcmVhdGlvblR4RmVlKCksIFxuICAgICAgICBhc3NldElELFxuICAgICAgICBuZXcgVVRGOFBheWxvYWQoXCJoZWxsbyB3b3JsZFwiKS5nZXRQYXlsb2FkKCksIFVuaXhOb3coKVxuICAgICAgKTtcbiAgICAgIGV4cGVjdCh0eHUyLnRvQnVmZmVyKCkudG9TdHJpbmcoJ2hleCcpKS50b0JlKHR4dTEudG9CdWZmZXIoKS50b1N0cmluZygnaGV4JykpO1xuICAgICAgZXhwZWN0KHR4dTIudG9TdHJpbmcoKSkudG9CZSh0eHUxLnRvU3RyaW5nKCkpO1xuXG4gICAgfSk7XG5cblxuICB9KTtcbn0pO1xuIl19