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
const api_1 = require("src/apis/avm/api");
const keychain_1 = require("src/apis/avm/keychain");
const buffer_1 = require("buffer/");
const bn_js_1 = __importDefault(require("bn.js"));
const bintools_1 = __importDefault(require("src/utils/bintools"));
const utxos_1 = require("src/apis/avm/utxos");
const inputs_1 = require("src/apis/avm/inputs");
const create_hash_1 = __importDefault(require("create-hash"));
const tx_1 = require("src/apis/avm/tx");
const constants_1 = require("src/apis/avm/constants");
const outputs_1 = require("src/apis/avm/outputs");
const ops_1 = require("src/apis/avm/ops");
const bech32 = __importStar(require("bech32"));
const payload_1 = require("src/utils/payload");
const initialstates_1 = require("src/apis/avm/initialstates");
const constants_2 = require("src/utils/constants");
const helperfunctions_1 = require("src/utils/helperfunctions");
const output_1 = require("src/common/output");
const minterset_1 = require("src/apis/avm/minterset");
const constants_3 = require("src/utils/constants");
const persistenceoptions_1 = require("src/utils/persistenceoptions");
const constants_4 = require("src/utils/constants");
const serialization_1 = require("src/utils/serialization");
/**
 * @ignore
 */
const bintools = bintools_1.default.getInstance();
const serializer = serialization_1.Serialization.getInstance();
const dumpSerailization = false;
function serialzeit(aThing, name) {
    if (dumpSerailization) {
        console.log(JSON.stringify(serializer.serialize(aThing, "avm", "hex", name + " -- Hex Encoded")));
        console.log(JSON.stringify(serializer.serialize(aThing, "avm", "display", name + " -- Human-Readable")));
    }
}
describe('AVMAPI', () => {
    const networkid = 12345;
    const blockchainid = constants_2.Defaults.network[networkid].X.blockchainID;
    const ip = '127.0.0.1';
    const port = 9650;
    const protocol = 'https';
    const username = 'DijetsInc';
    const password = 'password';
    const dijets = new src_1.Dijets(ip, port, protocol, networkid, undefined, undefined, undefined, true);
    let api;
    let alias;
    const addrA = 'X-' + bech32.encode(dijets.getHRP(), bech32.toWords(bintools.cb58Decode("B6D4v1VtPYLbiUvYXtW4Px8oE9imC2vGW")));
    const addrB = 'X-' + bech32.encode(dijets.getHRP(), bech32.toWords(bintools.cb58Decode("P5wdRuZeaDt28eHMP5S3w9ZdoBfo7wuzF")));
    const addrC = 'X-' + bech32.encode(dijets.getHRP(), bech32.toWords(bintools.cb58Decode("6Y3kysjF9jnHnYkdS9yGAuoHyae2eNmeV")));
    beforeAll(() => {
        api = new api_1.AVMAPI(dijets, '/ext/bc/X', blockchainid);
        alias = api.getBlockchainAlias();
    });
    afterEach(() => {
        jest_mock_axios_1.default.reset();
    });
    test('can Send 1', () => __awaiter(void 0, void 0, void 0, function* () {
        const txId = 'asdfhvl234';
        const memo = "hello world";
        const changeAddr = "X-local1";
        const result = api.send(username, password, 'assetId', 10, addrA, [addrB], addrA, memo);
        const payload = {
            result: {
                txID: txId,
                changeAddr: changeAddr
            },
        };
        const responseObj = {
            data: payload,
        };
        jest_mock_axios_1.default.mockResponse(responseObj);
        const response = yield result;
        expect(jest_mock_axios_1.default.request).toHaveBeenCalledTimes(1);
        expect(response['txID']).toBe(txId);
        expect(response['changeAddr']).toBe(changeAddr);
    }));
    test('can Send 2', () => __awaiter(void 0, void 0, void 0, function* () {
        const txId = 'asdfhvl234';
        const memo = buffer_1.Buffer.from("hello world");
        const changeAddr = "X-local1";
        const result = api.send(username, password, bintools.b58ToBuffer('6h2s5de1VC65meajE1L2PjvZ1MXvHc3F6eqPCGKuDt4MxiweF'), new bn_js_1.default(10), addrA, [addrB], addrA, memo);
        const payload = {
            result: {
                txID: txId,
                changeAddr: changeAddr
            },
        };
        const responseObj = {
            data: payload,
        };
        jest_mock_axios_1.default.mockResponse(responseObj);
        const response = yield result;
        expect(jest_mock_axios_1.default.request).toHaveBeenCalledTimes(1);
        expect(response['txID']).toBe(txId);
        expect(response['changeAddr']).toBe(changeAddr);
    }));
    test('can Send Multiple', () => __awaiter(void 0, void 0, void 0, function* () {
        const txId = 'asdfhvl234';
        const memo = "hello world";
        const changeAddr = "X-local1";
        const result = api.sendMultiple(username, password, [{ assetID: 'assetId', amount: 10, to: addrA }], [addrB], addrA, memo);
        const payload = {
            result: {
                txID: txId,
                changeAddr: changeAddr
            },
        };
        const responseObj = {
            data: payload,
        };
        jest_mock_axios_1.default.mockResponse(responseObj);
        const response = yield result;
        expect(jest_mock_axios_1.default.request).toHaveBeenCalledTimes(1);
        expect(response['txID']).toBe(txId);
        expect(response['changeAddr']).toBe(changeAddr);
    }));
    test('refreshBlockchainID', () => __awaiter(void 0, void 0, void 0, function* () {
        let n3bcID = constants_2.Defaults.network[3].X["blockchainID"];
        let n12345bcID = constants_2.Defaults.network[12345].X["blockchainID"];
        let testAPI = new api_1.AVMAPI(dijets, '/ext/bc/avm', n3bcID);
        let bc1 = testAPI.getBlockchainID();
        expect(bc1).toBe(n3bcID);
        testAPI.refreshBlockchainID();
        let bc2 = testAPI.getBlockchainID();
        expect(bc2).toBe(n12345bcID);
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
        const result = api.getBalance(addrA, 'ATH');
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
    test("export", () => __awaiter(void 0, void 0, void 0, function* () {
        let amount = new bn_js_1.default(100);
        let to = "abcdef";
        let assetID = "DJTX";
        let username = "Robert";
        let password = "Paulson";
        let txID = "valid";
        let result = api.export(username, password, to, amount, assetID);
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
    test("exportDJTX", () => __awaiter(void 0, void 0, void 0, function* () {
        let amount = new bn_js_1.default(100);
        let to = "abcdef";
        let username = "Robert";
        let password = "Paulson";
        let txID = "valid";
        let result = api.exportDJTX(username, password, to, amount);
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
    test("import", () => __awaiter(void 0, void 0, void 0, function* () {
        let to = "abcdef";
        let username = "Robert";
        let password = "Paulson";
        let txID = "valid";
        let result = api.import(username, password, to, blockchainid);
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
    test('createFixedCapAsset', () => __awaiter(void 0, void 0, void 0, function* () {
        const kp = new keychain_1.KeyPair(dijets.getHRP(), alias);
        kp.importKey(buffer_1.Buffer.from('ef9bf2d4436491c153967c9709dd8e82795bdb9b5ad44ee22c2903005d1cf676', 'hex'));
        const denomination = 0;
        const assetid = '8a5d2d32e68bc50036e4d086044617fe4a0a0296b274999ba568ea92da46d533';
        const initialHolders = [
            {
                address: '7sik3Pr6r1FeLrvK1oWwECBS8iJ5VPuSh',
                amount: '10000',
            },
            {
                address: '7sik3Pr6r1FeLrvK1oWwECBS8iJ5VPuSh',
                amount: '50000',
            },
        ];
        const result = api.createFixedCapAsset(username, password, 'Some Coin', 'SCC', denomination, initialHolders);
        const payload = {
            result: {
                assetID: assetid,
            },
        };
        const responseObj = {
            data: payload,
        };
        jest_mock_axios_1.default.mockResponse(responseObj);
        const response = yield result;
        expect(jest_mock_axios_1.default.request).toHaveBeenCalledTimes(1);
        expect(response).toBe(assetid);
    }));
    test('createVariableCapAsset', () => __awaiter(void 0, void 0, void 0, function* () {
        const kp = new keychain_1.KeyPair(dijets.getHRP(), alias);
        kp.importKey(buffer_1.Buffer.from('ef9bf2d4436491c153967c9709dd8e82795bdb9b5ad44ee22c2903005d1cf676', 'hex'));
        const denomination = 0;
        const assetid = '8a5d2d32e68bc50036e4d086044617fe4a0a0296b274999ba568ea92da46d533';
        const minterSets = [
            {
                minters: [
                    '4peJsFvhdn7XjhNF4HWAQy6YaJts27s9q',
                ],
                threshold: 1,
            },
            {
                minters: [
                    'dcJ6z9duLfyQTgbjq2wBCowkvcPZHVDF',
                    '2fE6iibqfERz5wenXE6qyvinsxDvFhHZk',
                    '7ieAJbfrGQbpNZRAQEpZCC1Gs1z5gz4HU',
                ],
                threshold: 2,
            },
        ];
        const result = api.createVariableCapAsset(username, password, 'Some Coin', 'SCC', denomination, minterSets);
        const payload = {
            result: {
                assetID: assetid,
            },
        };
        const responseObj = {
            data: payload,
        };
        jest_mock_axios_1.default.mockResponse(responseObj);
        const response = yield result;
        expect(jest_mock_axios_1.default.request).toHaveBeenCalledTimes(1);
        expect(response).toBe(assetid);
    }));
    test('mint 1', () => __awaiter(void 0, void 0, void 0, function* () {
        const username = 'Collin';
        const password = 'Cusce';
        const amount = 2;
        const assetID = 'f966750f438867c3c9828ddcdbe660e21ccdbb36a9276958f011ba472f75d4e7';
        const to = 'dcJ6z9duLfyQTgbjq2wBCowkvcPZHVDF';
        const minters = [
            'dcJ6z9duLfyQTgbjq2wBCowkvcPZHVDF',
            '2fE6iibqfERz5wenXE6qyvinsxDvFhHZk',
            '7ieAJbfrGQbpNZRAQEpZCC1Gs1z5gz4HU',
        ];
        const result = api.mint(username, password, amount, assetID, to, minters);
        const payload = {
            result: {
                txID: 'sometx',
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
    test('mint 2', () => __awaiter(void 0, void 0, void 0, function* () {
        const username = 'Collin';
        const password = 'Cusce';
        const amount = new bn_js_1.default(1);
        const assetID = buffer_1.Buffer.from('f966750f438867c3c9828ddcdbe660e21ccdbb36a9276958f011ba472f75d4e7', 'hex');
        const to = 'dcJ6z9duLfyQTgbjq2wBCowkvcPZHVDF';
        const minters = [
            'dcJ6z9duLfyQTgbjq2wBCowkvcPZHVDF',
            '2fE6iibqfERz5wenXE6qyvinsxDvFhHZk',
            '7ieAJbfrGQbpNZRAQEpZCC1Gs1z5gz4HU',
        ];
        const result = api.mint(username, password, amount, assetID, to, minters);
        const payload = {
            result: {
                txID: 'sometx',
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
            result: {
                status: 'accepted',
            },
        };
        const responseObj = {
            data: payload,
        };
        jest_mock_axios_1.default.mockResponse(responseObj);
        const response = yield result;
        expect(jest_mock_axios_1.default.request).toHaveBeenCalledTimes(1);
        expect(response).toBe('accepted');
    }));
    test('getAssetDescription as string', () => __awaiter(void 0, void 0, void 0, function* () {
        const assetid = buffer_1.Buffer.from('8a5d2d32e68bc50036e4d086044617fe4a0a0296b274999ba568ea92da46d533', 'hex');
        const assetidstr = bintools.cb58Encode(assetid);
        const result = api.getAssetDescription(assetidstr);
        const payload = {
            result: {
                name: 'Collin Coin',
                symbol: 'CKC',
                assetID: assetidstr,
                denomination: '10',
            },
        };
        const responseObj = {
            data: payload,
        };
        jest_mock_axios_1.default.mockResponse(responseObj);
        const response = yield result;
        expect(jest_mock_axios_1.default.request).toHaveBeenCalledTimes(1);
        expect(response.name).toBe('Collin Coin');
        expect(response.symbol).toBe('CKC');
        expect(response.assetID.toString('hex')).toBe(assetid.toString('hex'));
        expect(response.denomination).toBe(10);
    }));
    test('getAssetDescription as Buffer', () => __awaiter(void 0, void 0, void 0, function* () {
        const assetid = buffer_1.Buffer.from('8a5d2d32e68bc50036e4d086044617fe4a0a0296b274999ba568ea92da46d533', 'hex');
        const assetidstr = bintools.cb58Encode(buffer_1.Buffer.from('8a5d2d32e68bc50036e4d086044617fe4a0a0296b274999ba568ea92da46d533', 'hex'));
        const result = api.getAssetDescription(assetid);
        const payload = {
            result: {
                name: 'Collin Coin',
                symbol: 'CKC',
                assetID: assetidstr,
                denomination: '11',
            },
        };
        const responseObj = {
            data: payload,
        };
        jest_mock_axios_1.default.mockResponse(responseObj);
        const response = yield result;
        expect(jest_mock_axios_1.default.request).toHaveBeenCalledTimes(1);
        expect(response.name).toBe('Collin Coin');
        expect(response.symbol).toBe('CKC');
        expect(response.assetID.toString('hex')).toBe(assetid.toString('hex'));
        expect(response.denomination).toBe(11);
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
        let keymgr2;
        let keymgr3;
        let addrs1;
        let addrs2;
        let addrs3;
        let addressbuffs = [];
        let addresses = [];
        let utxos;
        let inputs;
        let outputs;
        let ops;
        const amnt = 10000;
        const assetID = buffer_1.Buffer.from(create_hash_1.default('sha256').update('mary had a little lamb').digest());
        const NFTassetID = buffer_1.Buffer.from(create_hash_1.default('sha256').update("I can't stand it, I know you planned it, I'mma set straight this Watergate.'").digest());
        let secpbase1;
        let secpbase2;
        let secpbase3;
        let initialState;
        let nftpbase1;
        let nftpbase2;
        let nftpbase3;
        let nftInitialState;
        let nftutxoids = [];
        let fungutxoids = [];
        let avm;
        const fee = 10;
        const name = 'Mortycoin is the dumb as a sack of hammers.';
        const symbol = 'morT';
        const denomination = 8;
        let secpMintOut1;
        let secpMintOut2;
        let secpMintTXID;
        let secpMintUTXO;
        let secpMintXferOut1;
        let secpMintXferOut2;
        let secpMintOp;
        let xfersecpmintop;
        beforeEach(() => __awaiter(void 0, void 0, void 0, function* () {
            avm = new api_1.AVMAPI(dijets, "/ext/bc/X", blockchainid);
            const result = avm.getDJTXAssetID(true);
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
            avm.newKeyChain();
            keymgr2 = new keychain_1.KeyChain(dijets.getHRP(), alias);
            keymgr3 = new keychain_1.KeyChain(dijets.getHRP(), alias);
            addrs1 = [];
            addrs2 = [];
            addrs3 = [];
            utxos = [];
            inputs = [];
            outputs = [];
            ops = [];
            nftutxoids = [];
            fungutxoids = [];
            const pload = buffer_1.Buffer.alloc(1024);
            pload.write("All you Trekkies and TV addicts, Don't mean to diss don't mean to bring static.", 0, 1024, 'utf8');
            for (let i = 0; i < 3; i++) {
                addrs1.push(avm.addressFromBuffer(avm.keyChain().makeKey().getAddress()));
                addrs2.push(avm.addressFromBuffer(keymgr2.makeKey().getAddress()));
                addrs3.push(avm.addressFromBuffer(keymgr3.makeKey().getAddress()));
            }
            const amount = constants_4.ONEDJTX.mul(new bn_js_1.default(amnt));
            addressbuffs = avm.keyChain().getAddresses();
            addresses = addressbuffs.map((a) => avm.addressFromBuffer(a));
            const locktime = new bn_js_1.default(54321);
            const threshold = 3;
            for (let i = 0; i < 5; i++) {
                let txid = buffer_1.Buffer.from(create_hash_1.default('sha256').update(bintools.fromBNToBuffer(new bn_js_1.default(i), 32)).digest());
                let txidx = buffer_1.Buffer.alloc(4);
                txidx.writeUInt32BE(i, 0);
                const out = new outputs_1.SECPTransferOutput(amount, addressbuffs, locktime, threshold);
                const xferout = new outputs_1.TransferableOutput(assetID, out);
                outputs.push(xferout);
                const u = new utxos_1.UTXO();
                u.fromBuffer(buffer_1.Buffer.concat([u.getCodecIDBuffer(), txid, txidx, xferout.toBuffer()]));
                fungutxoids.push(u.getUTXOID());
                utxos.push(u);
                txid = u.getTxID();
                txidx = u.getOutputIdx();
                const asset = u.getAssetID();
                const input = new inputs_1.SECPTransferInput(amount);
                const xferinput = new inputs_1.TransferableInput(txid, txidx, asset, input);
                inputs.push(xferinput);
                const nout = new outputs_1.NFTTransferOutput(1000 + i, pload, addressbuffs, locktime, threshold);
                const op = new ops_1.NFTTransferOperation(nout);
                const nfttxid = buffer_1.Buffer.from(create_hash_1.default('sha256').update(bintools.fromBNToBuffer(new bn_js_1.default(1000 + i), 32)).digest());
                const nftutxo = new utxos_1.UTXO(constants_1.AVMConstants.LATESTCODEC, nfttxid, 1000 + i, NFTassetID, nout);
                nftutxoids.push(nftutxo.getUTXOID());
                const xferop = new ops_1.TransferableOperation(NFTassetID, [nftutxo.getUTXOID()], op);
                ops.push(xferop);
                utxos.push(nftutxo);
            }
            set.addArray(utxos);
            secpbase1 = new outputs_1.SECPTransferOutput(new bn_js_1.default(777), addrs3.map((a) => avm.parseAddress(a)), helperfunctions_1.UnixNow(), 1);
            secpbase2 = new outputs_1.SECPTransferOutput(new bn_js_1.default(888), addrs2.map((a) => avm.parseAddress(a)), helperfunctions_1.UnixNow(), 1);
            secpbase3 = new outputs_1.SECPTransferOutput(new bn_js_1.default(999), addrs2.map((a) => avm.parseAddress(a)), helperfunctions_1.UnixNow(), 1);
            initialState = new initialstates_1.InitialStates();
            initialState.addOutput(secpbase1, constants_1.AVMConstants.SECPFXID);
            initialState.addOutput(secpbase2, constants_1.AVMConstants.SECPFXID);
            initialState.addOutput(secpbase3, constants_1.AVMConstants.SECPFXID);
            nftpbase1 = new outputs_1.NFTMintOutput(0, addrs1.map(a => api.parseAddress(a)), locktime, 1);
            nftpbase2 = new outputs_1.NFTMintOutput(1, addrs2.map(a => api.parseAddress(a)), locktime, 1);
            nftpbase3 = new outputs_1.NFTMintOutput(2, addrs3.map(a => api.parseAddress(a)), locktime, 1);
            nftInitialState = new initialstates_1.InitialStates();
            nftInitialState.addOutput(nftpbase1, constants_1.AVMConstants.NFTFXID);
            nftInitialState.addOutput(nftpbase2, constants_1.AVMConstants.NFTFXID);
            nftInitialState.addOutput(nftpbase3, constants_1.AVMConstants.NFTFXID);
            secpMintOut1 = new outputs_1.SECPMintOutput(addressbuffs, new bn_js_1.default(0), 1);
            secpMintOut2 = new outputs_1.SECPMintOutput(addressbuffs, new bn_js_1.default(0), 1);
            secpMintTXID = buffer_1.Buffer.from(create_hash_1.default('sha256').update(bintools.fromBNToBuffer(new bn_js_1.default(1337), 32)).digest());
            secpMintUTXO = new utxos_1.UTXO(constants_1.AVMConstants.LATESTCODEC, secpMintTXID, 0, assetID, secpMintOut1);
            secpMintXferOut1 = new outputs_1.SECPTransferOutput(new bn_js_1.default(123), addrs3.map((a) => avm.parseAddress(a)), helperfunctions_1.UnixNow(), 2);
            secpMintXferOut2 = new outputs_1.SECPTransferOutput(new bn_js_1.default(456), [avm.parseAddress(addrs2[0])], helperfunctions_1.UnixNow(), 1);
            secpMintOp = new ops_1.SECPMintOperation(secpMintOut1, secpMintXferOut1);
            set.add(secpMintUTXO);
            xfersecpmintop = new ops_1.TransferableOperation(assetID, [secpMintUTXO.getUTXOID()], secpMintOp);
        }));
        test('signTx', () => __awaiter(void 0, void 0, void 0, function* () {
            const txu1 = yield avm.buildBaseTx(set, new bn_js_1.default(amnt), bintools.cb58Encode(assetID), addrs3, addrs1, addrs1);
            const txu2 = set.buildBaseTx(networkid, bintools.cb58Decode(blockchainid), new bn_js_1.default(amnt), assetID, addrs3.map((a) => avm.parseAddress(a)), addrs1.map((a) => avm.parseAddress(a)), addrs1.map((a) => avm.parseAddress(a)), avm.getTxFee(), assetID, undefined, helperfunctions_1.UnixNow(), new bn_js_1.default(0), 1);
            const tx1 = avm.signTx(txu1);
            const tx2 = avm.signTx(txu2);
            expect(tx2.toBuffer().toString('hex')).toBe(tx1.toBuffer().toString('hex'));
            expect(tx2.toString()).toBe(tx1.toString());
        }));
        test('buildBaseTx1', () => __awaiter(void 0, void 0, void 0, function* () {
            const txu1 = yield avm.buildBaseTx(set, new bn_js_1.default(amnt), bintools.cb58Encode(assetID), addrs3, addrs1, addrs1, new payload_1.UTF8Payload("hello world").getContent());
            let memobuf = buffer_1.Buffer.from("hello world");
            const txu2 = set.buildBaseTx(networkid, bintools.cb58Decode(blockchainid), new bn_js_1.default(amnt), assetID, addrs3.map((a) => avm.parseAddress(a)), addrs1.map((a) => avm.parseAddress(a)), addrs1.map((a) => avm.parseAddress(a)), avm.getTxFee(), assetID, memobuf, helperfunctions_1.UnixNow(), new bn_js_1.default(0), 1);
            expect(txu2.toBuffer().toString('hex')).toBe(txu1.toBuffer().toString('hex'));
            expect(txu2.toString()).toBe(txu1.toString());
            let tx1 = txu1.sign(avm.keyChain());
            let checkTx = tx1.toBuffer().toString("hex");
            let tx1obj = tx1.serialize("hex");
            let tx1str = JSON.stringify(tx1obj);
            /*
            console.log("-----Test1 JSON-----");
            console.log(tx1str);
            console.log("-----Test1 ENDN-----");
            */
            let tx2newobj = JSON.parse(tx1str);
            let tx2 = new tx_1.Tx();
            tx2.deserialize(tx2newobj, "hex");
            /*
            let tx2obj:object = tx2.serialize("hex");
            let tx2str:string = JSON.stringify(tx2obj);
            console.log("-----Test2 JSON-----");
            console.log(tx2str);
            console.log("-----Test2 ENDN-----");
            */
            expect(tx2.toBuffer().toString("hex")).toBe(checkTx);
            let tx3 = txu1.sign(avm.keyChain());
            let tx3obj = tx3.serialize("display");
            let tx3str = JSON.stringify(tx3obj);
            /*
            console.log("-----Test3 JSON-----");
            console.log(tx3str);
            console.log("-----Test3 ENDN-----");
            */
            let tx4newobj = JSON.parse(tx3str);
            let tx4 = new tx_1.Tx();
            tx4.deserialize(tx4newobj, "display");
            /*
            let tx4obj:object = tx4.serialize("display");
            let tx4str:string = JSON.stringify(tx4obj);
            console.log("-----Test4 JSON-----");
            console.log(tx4str);
            console.log("-----Test4 ENDN-----");
            */
            expect(tx4.toBuffer().toString("hex")).toBe(checkTx);
        }));
        test('buildBaseTx2', () => __awaiter(void 0, void 0, void 0, function* () {
            const txu1 = yield avm.buildBaseTx(set, new bn_js_1.default(amnt).sub(new bn_js_1.default(100)), bintools.cb58Encode(assetID), addrs3, addrs1, addrs2, new payload_1.UTF8Payload("hello world"));
            const txu2 = set.buildBaseTx(networkid, bintools.cb58Decode(blockchainid), new bn_js_1.default(amnt).sub(new bn_js_1.default(100)), assetID, addrs3.map((a) => avm.parseAddress(a)), addrs1.map((a) => avm.parseAddress(a)), addrs2.map((a) => avm.parseAddress(a)), avm.getTxFee(), assetID, new payload_1.UTF8Payload("hello world").getPayload(), helperfunctions_1.UnixNow(), new bn_js_1.default(0), 1);
            expect(txu2.toBuffer().toString('hex')).toBe(txu1.toBuffer().toString('hex'));
            expect(txu2.toString()).toBe(txu1.toString());
            const outies = txu1.getTransaction().getOuts().sort(outputs_1.TransferableOutput.comparator());
            expect(outies.length).toBe(2);
            const outaddr0 = outies[0].getOutput().getAddresses().map((a) => avm.addressFromBuffer(a));
            const outaddr1 = outies[1].getOutput().getAddresses().map((a) => avm.addressFromBuffer(a));
            const testaddr2 = JSON.stringify(addrs2.sort());
            const testaddr3 = JSON.stringify(addrs3.sort());
            const testout0 = JSON.stringify(outaddr0.sort());
            const testout1 = JSON.stringify(outaddr1.sort());
            expect((testaddr2 == testout0 && testaddr3 == testout1)
                || (testaddr3 == testout0 && testaddr2 == testout1)).toBe(true);
            let tx1 = txu1.sign(avm.keyChain());
            let checkTx = tx1.toBuffer().toString("hex");
            let tx1obj = tx1.serialize("hex");
            let tx1str = JSON.stringify(tx1obj);
            /*
            console.log("-----Test1 JSON-----");
            console.log(tx1str);
            console.log("-----Test1 ENDN-----");
            */
            let tx2newobj = JSON.parse(tx1str);
            let tx2 = new tx_1.Tx();
            tx2.deserialize(tx2newobj, "hex");
            /*
            let tx2obj:object = tx2.serialize("hex");
            let tx2str:string = JSON.stringify(tx2obj);
            console.log("-----Test2 JSON-----");
            console.log(tx2str);
            console.log("-----Test2 ENDN-----");
            */
            expect(tx2.toBuffer().toString("hex")).toBe(checkTx);
            let tx3 = txu1.sign(avm.keyChain());
            let tx3obj = tx3.serialize("display");
            let tx3str = JSON.stringify(tx3obj);
            /*
            console.log("-----Test3 JSON-----");
            console.log(tx3str);
            console.log("-----Test3 ENDN-----");
            */
            let tx4newobj = JSON.parse(tx3str);
            let tx4 = new tx_1.Tx();
            tx4.deserialize(tx4newobj, "display");
            /*
            let tx4obj:object = tx4.serialize("display");
            let tx4str:string = JSON.stringify(tx4obj);
            console.log("-----Test4 JSON-----");
            console.log(tx4str);
            console.log("-----Test4 ENDN-----");
            */
            expect(tx4.toBuffer().toString("hex")).toBe(checkTx);
            serialzeit(tx1, "BaseTx");
        }));
        test('issueTx Serialized', () => __awaiter(void 0, void 0, void 0, function* () {
            const txu = yield avm.buildBaseTx(set, new bn_js_1.default(amnt), bintools.cb58Encode(assetID), addrs3, addrs1, addrs1);
            const tx = avm.signTx(txu);
            const txid = 'f966750f438867c3c9828ddcdbe660e21ccdbb36a9276958f011ba472f75d4e7';
            const result = avm.issueTx(tx.toString());
            const payload = {
                result: {
                    txID: txid,
                },
            };
            const responseObj = {
                data: payload,
            };
            jest_mock_axios_1.default.mockResponse(responseObj);
            let response = yield result;
            expect(response).toBe(txid);
        }));
        test('issueTx Buffer', () => __awaiter(void 0, void 0, void 0, function* () {
            const txu = yield avm.buildBaseTx(set, new bn_js_1.default(amnt), bintools.cb58Encode(assetID), addrs3, addrs1, addrs1);
            const tx = avm.signTx(txu);
            const txid = 'f966750f438867c3c9828ddcdbe660e21ccdbb36a9276958f011ba472f75d4e7';
            const result = avm.issueTx(tx.toBuffer());
            const payload = {
                result: {
                    txID: txid,
                },
            };
            const responseObj = {
                data: payload,
            };
            jest_mock_axios_1.default.mockResponse(responseObj);
            const response = yield result;
            expect(response).toBe(txid);
        }));
        test('issueTx Class Tx', () => __awaiter(void 0, void 0, void 0, function* () {
            const txu = yield avm.buildBaseTx(set, new bn_js_1.default(amnt), bintools.cb58Encode(assetID), addrs3, addrs1, addrs1);
            const tx = avm.signTx(txu);
            const txid = 'f966750f438867c3c9828ddcdbe660e21ccdbb36a9276958f011ba472f75d4e7';
            const result = avm.issueTx(tx);
            const payload = {
                result: {
                    txID: txid,
                },
            };
            const responseObj = {
                data: payload,
            };
            jest_mock_axios_1.default.mockResponse(responseObj);
            const response = yield result;
            expect(response).toBe(txid);
        }));
        test('buildCreateAssetTx - Fixed Cap', () => __awaiter(void 0, void 0, void 0, function* () {
            avm.setCreationTxFee(new bn_js_1.default(fee));
            const txu1 = yield avm.buildCreateAssetTx(set, addrs1, addrs2, initialState, name, symbol, denomination);
            const txu2 = set.buildCreateAssetTx(dijets.getNetworkID(), bintools.cb58Decode(avm.getBlockchainID()), addrs1.map((a) => avm.parseAddress(a)), addrs2.map((a) => avm.parseAddress(a)), initialState, name, symbol, denomination, undefined, avm.getCreationTxFee(), assetID);
            expect(txu2.toBuffer().toString('hex')).toBe(txu1.toBuffer().toString('hex'));
            expect(txu2.toString()).toBe(txu1.toString());
            let tx1 = txu1.sign(avm.keyChain());
            let checkTx = tx1.toBuffer().toString("hex");
            let tx1obj = tx1.serialize("hex");
            let tx1str = JSON.stringify(tx1obj);
            /*
            console.log("-----Test1 JSON-----");
            console.log(tx1str);
            console.log("-----Test1 ENDN-----");
            */
            let tx2newobj = JSON.parse(tx1str);
            let tx2 = new tx_1.Tx();
            tx2.deserialize(tx2newobj, "hex");
            /*
            let tx2obj:object = tx2.serialize("hex");
            let tx2str:string = JSON.stringify(tx2obj);
            console.log("-----Test2 JSON-----");
            console.log(tx2str);
            console.log("-----Test2 ENDN-----");
            */
            expect(tx2.toBuffer().toString("hex")).toBe(checkTx);
            let tx3 = txu1.sign(avm.keyChain());
            let tx3obj = tx3.serialize("display");
            let tx3str = JSON.stringify(tx3obj);
            /*
            console.log("-----Test3 JSON-----");
            console.log(tx3str);
            console.log("-----Test3 ENDN-----");
            */
            let tx4newobj = JSON.parse(tx3str);
            let tx4 = new tx_1.Tx();
            tx4.deserialize(tx4newobj, "display");
            /*
            let tx4obj:object = tx4.serialize("display");
            let tx4str:string = JSON.stringify(tx4obj);
            console.log("-----Test4 JSON-----");
            console.log(tx4str);
            console.log("-----Test4 ENDN-----");
            */
            expect(tx4.toBuffer().toString("hex")).toBe(checkTx);
            serialzeit(tx1, "CreateAssetTx");
        }));
        test('buildCreateAssetTx - Variable Cap', () => __awaiter(void 0, void 0, void 0, function* () {
            avm.setCreationTxFee(new bn_js_1.default(constants_2.Defaults.network[12345].P["creationTxFee"]));
            let mintOutputs = [secpMintOut1, secpMintOut2];
            const txu1 = yield avm.buildCreateAssetTx(set, addrs1, addrs2, initialState, name, symbol, denomination, mintOutputs);
            const txu2 = set.buildCreateAssetTx(dijets.getNetworkID(), bintools.cb58Decode(avm.getBlockchainID()), addrs1.map((a) => avm.parseAddress(a)), addrs2.map((a) => avm.parseAddress(a)), initialState, name, symbol, denomination, mintOutputs, avm.getCreationTxFee(), assetID);
            expect(txu2.toBuffer().toString('hex')).toBe(txu1.toBuffer().toString('hex'));
            expect(txu2.toString()).toBe(txu1.toString());
            let tx1 = txu1.sign(avm.keyChain());
            let checkTx = tx1.toBuffer().toString("hex");
            let tx1obj = tx1.serialize("hex");
            let tx1str = JSON.stringify(tx1obj);
            /*
            console.log("-----Test1 JSON-----");
            console.log(tx1str);
            console.log("-----Test1 ENDN-----");
            */
            let tx2newobj = JSON.parse(tx1str);
            let tx2 = new tx_1.Tx();
            tx2.deserialize(tx2newobj, "hex");
            /*
            let tx2obj:object = tx2.serialize("hex");
            let tx2str:string = JSON.stringify(tx2obj);
            console.log("-----Test2 JSON-----");
            console.log(tx2str);
            console.log("-----Test2 ENDN-----");
            */
            expect(tx2.toBuffer().toString("hex")).toBe(checkTx);
            let tx3 = txu1.sign(avm.keyChain());
            let tx3obj = tx3.serialize("display");
            let tx3str = JSON.stringify(tx3obj);
            /*
            console.log("-----Test3 JSON-----");
            console.log(tx3str);
            console.log("-----Test3 ENDN-----");
            */
            let tx4newobj = JSON.parse(tx3str);
            let tx4 = new tx_1.Tx();
            tx4.deserialize(tx4newobj, "display");
            /*
            let tx4obj:object = tx4.serialize("display");
            let tx4str:string = JSON.stringify(tx4obj);
            console.log("-----Test4 JSON-----");
            console.log(tx4str);
            console.log("-----Test4 ENDN-----");
            */
            expect(tx4.toBuffer().toString("hex")).toBe(checkTx);
        }));
        test('buildSECPMintTx', () => __awaiter(void 0, void 0, void 0, function* () {
            avm.setTxFee(new bn_js_1.default(fee));
            let newMinter = new outputs_1.SECPMintOutput(addrs3.map((a) => avm.parseAddress(a)), new bn_js_1.default(0), 1);
            const txu1 = yield avm.buildSECPMintTx(set, newMinter, secpMintXferOut1, addrs1, addrs2, secpMintUTXO.getUTXOID());
            const txu2 = set.buildSECPMintTx(dijets.getNetworkID(), bintools.cb58Decode(avm.getBlockchainID()), newMinter, secpMintXferOut1, addrs1.map((a) => avm.parseAddress(a)), addrs2.map((a) => avm.parseAddress(a)), secpMintUTXO.getUTXOID(), avm.getTxFee(), assetID);
            expect(txu2.toBuffer().toString('hex')).toBe(txu1.toBuffer().toString('hex'));
            expect(txu2.toString()).toBe(txu1.toString());
            let tx1 = txu1.sign(avm.keyChain());
            let checkTx = tx1.toBuffer().toString("hex");
            let tx1obj = tx1.serialize("hex");
            let tx1str = JSON.stringify(tx1obj);
            /*
            console.log("-----Test1 JSON-----");
            console.log(tx1str);
            console.log("-----Test1 ENDN-----");
            */
            let tx2newobj = JSON.parse(tx1str);
            let tx2 = new tx_1.Tx();
            tx2.deserialize(tx2newobj, "hex");
            /*
            let tx2obj:object = tx2.serialize("hex");
            let tx2str:string = JSON.stringify(tx2obj);
            console.log("-----Test2 JSON-----");
            console.log(tx2str);
            console.log("-----Test2 ENDN-----");
            */
            expect(tx2.toBuffer().toString("hex")).toBe(checkTx);
            let tx3 = txu1.sign(avm.keyChain());
            let tx3obj = tx3.serialize("display");
            let tx3str = JSON.stringify(tx3obj);
            /*
            console.log("-----Test3 JSON-----");
            console.log(tx3str);
            console.log("-----Test3 ENDN-----");
            */
            let tx4newobj = JSON.parse(tx3str);
            let tx4 = new tx_1.Tx();
            tx4.deserialize(tx4newobj, "display");
            /*
            let tx4obj:object = tx4.serialize("display");
            let tx4str:string = JSON.stringify(tx4obj);
            console.log("-----Test4 JSON-----");
            console.log(tx4str);
            console.log("-----Test4 ENDN-----");
            */
            expect(tx4.toBuffer().toString("hex")).toBe(checkTx);
            serialzeit(tx1, "SECPMintTx");
        }));
        test('buildCreateNFTAssetTx', () => __awaiter(void 0, void 0, void 0, function* () {
            avm.setCreationTxFee(new bn_js_1.default(constants_2.Defaults.network[12345].P["creationTxFee"]));
            let minterSets = [new minterset_1.MinterSet(1, addrs1)];
            let locktime = new bn_js_1.default(0);
            let txu1 = yield avm.buildCreateNFTAssetTx(set, addrs1, addrs2, minterSets, name, symbol, new payload_1.UTF8Payload("hello world"), helperfunctions_1.UnixNow(), locktime);
            let txu2 = set.buildCreateNFTAssetTx(dijets.getNetworkID(), bintools.cb58Decode(avm.getBlockchainID()), addrs1.map(a => avm.parseAddress(a)), addrs2.map((a) => avm.parseAddress(a)), minterSets, name, symbol, avm.getCreationTxFee(), assetID, new payload_1.UTF8Payload("hello world").getPayload(), helperfunctions_1.UnixNow(), locktime);
            expect(txu2.toBuffer().toString("hex")).toBe(txu1.toBuffer().toString("hex"));
            expect(txu2.toString()).toBe(txu1.toString());
            let tx1 = txu1.sign(avm.keyChain());
            let checkTx = tx1.toBuffer().toString("hex");
            let tx1obj = tx1.serialize("hex");
            let tx1str = JSON.stringify(tx1obj);
            /*
            console.log("-----Test1 JSON-----");
            console.log(tx1str);
            console.log("-----Test1 ENDN-----");
            */
            let tx2newobj = JSON.parse(tx1str);
            let tx2 = new tx_1.Tx();
            tx2.deserialize(tx2newobj, "hex");
            /*
            let tx2obj:object = tx2.serialize("hex");
            let tx2str:string = JSON.stringify(tx2obj);
            console.log("-----Test2 JSON-----");
            console.log(tx2str);
            console.log("-----Test2 ENDN-----");
            */
            expect(tx2.toBuffer().toString("hex")).toBe(checkTx);
            let tx3 = txu1.sign(avm.keyChain());
            let tx3obj = tx3.serialize("display");
            let tx3str = JSON.stringify(tx3obj);
            /*
            console.log("-----Test3 JSON-----");
            console.log(tx3str);
            console.log("-----Test3 ENDN-----");
            */
            let tx4newobj = JSON.parse(tx3str);
            let tx4 = new tx_1.Tx();
            tx4.deserialize(tx4newobj, "display");
            /*
            let tx4obj:object = tx4.serialize("display");
            let tx4str:string = JSON.stringify(tx4obj);
            console.log("-----Test4 JSON-----");
            console.log(tx4str);
            console.log("-----Test4 ENDN-----");
            */
            expect(tx4.toBuffer().toString("hex")).toBe(checkTx);
            serialzeit(tx1, "CreateNFTAssetTx");
        }));
        test('buildCreateNFTMintTx', () => __awaiter(void 0, void 0, void 0, function* () {
            avm.setTxFee(new bn_js_1.default(fee));
            let groupID = 0;
            let locktime = new bn_js_1.default(0);
            let threshold = 1;
            let payload = buffer_1.Buffer.from("Dijets");
            let addrbuff1 = addrs1.map(a => avm.parseAddress(a));
            let addrbuff2 = addrs2.map(a => avm.parseAddress(a));
            let addrbuff3 = addrs3.map(a => avm.parseAddress(a));
            let outputOwners = [];
            let oo = new output_1.OutputOwners(addrbuff3, locktime, threshold);
            outputOwners.push();
            let txu1 = yield avm.buildCreateNFTMintTx(set, oo, addrs1, addrs2, nftutxoids, groupID, payload, undefined, helperfunctions_1.UnixNow());
            let txu2 = set.buildCreateNFTMintTx(dijets.getNetworkID(), bintools.cb58Decode(avm.getBlockchainID()), [oo], addrbuff1, addrbuff2, nftutxoids, groupID, payload, avm.getTxFee(), assetID, undefined, helperfunctions_1.UnixNow());
            expect(txu2.toBuffer().toString("hex")).toBe(txu1.toBuffer().toString("hex"));
            expect(txu2.toString()).toBe(txu1.toString());
            outputOwners.push(oo);
            outputOwners.push(new output_1.OutputOwners(addrbuff3, locktime, threshold + 1));
            let txu3 = yield avm.buildCreateNFTMintTx(set, outputOwners, addrs1, addrs2, nftutxoids, groupID, payload, undefined, helperfunctions_1.UnixNow());
            let txu4 = set.buildCreateNFTMintTx(dijets.getNetworkID(), bintools.cb58Decode(avm.getBlockchainID()), outputOwners, addrbuff1, addrbuff2, nftutxoids, groupID, payload, avm.getTxFee(), assetID, undefined, helperfunctions_1.UnixNow());
            expect(txu4.toBuffer().toString("hex")).toBe(txu3.toBuffer().toString("hex"));
            expect(txu4.toString()).toBe(txu3.toString());
            let tx1 = txu1.sign(avm.keyChain());
            let checkTx = tx1.toBuffer().toString("hex");
            let tx1obj = tx1.serialize("hex");
            let tx1str = JSON.stringify(tx1obj);
            /*
            console.log("-----Test1 JSON-----");
            console.log(tx1str);
            console.log("-----Test1 ENDN-----");
            */
            let tx2newobj = JSON.parse(tx1str);
            let tx2 = new tx_1.Tx();
            tx2.deserialize(tx2newobj, "hex");
            /*
            let tx2obj:object = tx2.serialize("hex");
            let tx2str:string = JSON.stringify(tx2obj);
            console.log("-----Test2 JSON-----");
            console.log(tx2str);
            console.log("-----Test2 ENDN-----");
            */
            expect(tx2.toBuffer().toString("hex")).toBe(checkTx);
            let tx3 = txu1.sign(avm.keyChain());
            let tx3obj = tx3.serialize("display");
            let tx3str = JSON.stringify(tx3obj);
            /*
            console.log("-----Test3 JSON-----");
            console.log(tx3str);
            console.log("-----Test3 ENDN-----");
            */
            let tx4newobj = JSON.parse(tx3str);
            let tx4 = new tx_1.Tx();
            tx4.deserialize(tx4newobj, "display");
            /*
            let tx4obj:object = tx4.serialize("display");
            let tx4str:string = JSON.stringify(tx4obj);
            console.log("-----Test4 JSON-----");
            console.log(tx4str);
            console.log("-----Test4 ENDN-----");
            */
            expect(tx4.toBuffer().toString("hex")).toBe(checkTx);
            serialzeit(tx1, "CreateNFTMintTx");
        }));
        test('buildNFTTransferTx', () => __awaiter(void 0, void 0, void 0, function* () {
            avm.setTxFee(new bn_js_1.default(fee));
            const pload = buffer_1.Buffer.alloc(1024);
            pload.write("All you Trekkies and TV addicts, Don't mean to diss don't mean to bring static.", 0, 1024, 'utf8');
            const addrbuff1 = addrs1.map((a) => avm.parseAddress(a));
            const addrbuff2 = addrs2.map(a => avm.parseAddress(a));
            const addrbuff3 = addrs3.map((a) => avm.parseAddress(a));
            const txu1 = yield avm.buildNFTTransferTx(set, addrs3, addrs1, addrs2, nftutxoids[1], new payload_1.UTF8Payload("hello world"), helperfunctions_1.UnixNow(), new bn_js_1.default(0), 1);
            const txu2 = set.buildNFTTransferTx(networkid, bintools.cb58Decode(blockchainid), addrbuff3, addrbuff1, addrbuff2, [nftutxoids[1]], avm.getTxFee(), assetID, new payload_1.UTF8Payload("hello world").getPayload(), helperfunctions_1.UnixNow(), new bn_js_1.default(0), 1);
            expect(txu2.toBuffer().toString('hex')).toBe(txu1.toBuffer().toString('hex'));
            expect(txu2.toString()).toBe(txu1.toString());
            let tx1 = txu1.sign(avm.keyChain());
            let checkTx = tx1.toBuffer().toString("hex");
            let tx1obj = tx1.serialize("hex");
            let tx1str = JSON.stringify(tx1obj);
            /*
            console.log("-----Test1 JSON-----");
            console.log(tx1str);
            console.log("-----Test1 ENDN-----");
            */
            let tx2newobj = JSON.parse(tx1str);
            let tx2 = new tx_1.Tx();
            tx2.deserialize(tx2newobj, "hex");
            /*
            let tx2obj:object = tx2.serialize("hex");
            let tx2str:string = JSON.stringify(tx2obj);
            console.log("-----Test2 JSON-----");
            console.log(tx2str);
            console.log("-----Test2 ENDN-----");
            */
            expect(tx2.toBuffer().toString("hex")).toBe(checkTx);
            let tx3 = txu1.sign(avm.keyChain());
            let tx3obj = tx3.serialize("display");
            let tx3str = JSON.stringify(tx3obj);
            /*
            console.log("-----Test3 JSON-----");
            console.log(tx3str);
            console.log("-----Test3 ENDN-----");
            */
            let tx4newobj = JSON.parse(tx3str);
            let tx4 = new tx_1.Tx();
            tx4.deserialize(tx4newobj, "display");
            /*
            let tx4obj:object = tx4.serialize("display");
            let tx4str:string = JSON.stringify(tx4obj);
            console.log("-----Test4 JSON-----");
            console.log(tx4str);
            console.log("-----Test4 ENDN-----");
            */
            expect(tx4.toBuffer().toString("hex")).toBe(checkTx);
            serialzeit(tx1, "NFTTransferTx");
        }));
        test('buildImportTx', () => __awaiter(void 0, void 0, void 0, function* () {
            let locktime = new bn_js_1.default(0);
            let threshold = 1;
            avm.setTxFee(new bn_js_1.default(fee));
            const addrbuff1 = addrs1.map((a) => avm.parseAddress(a));
            const addrbuff2 = addrs2.map((a) => avm.parseAddress(a));
            const addrbuff3 = addrs3.map((a) => avm.parseAddress(a));
            const fungutxo = set.getUTXO(fungutxoids[1]);
            const fungutxostr = fungutxo.toString();
            const result = avm.buildImportTx(set, addrs1, constants_3.PlatformChainID, addrs3, addrs1, addrs2, new payload_1.UTF8Payload("hello world"), helperfunctions_1.UnixNow(), locktime, threshold);
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
            const txu2 = set.buildImportTx(networkid, bintools.cb58Decode(blockchainid), addrbuff3, addrbuff1, addrbuff2, [fungutxo], bintools.cb58Decode(constants_3.PlatformChainID), avm.getTxFee(), yield avm.getDJTXAssetID(), new payload_1.UTF8Payload("hello world").getPayload(), helperfunctions_1.UnixNow(), locktime, threshold);
            expect(txu2.toBuffer().toString('hex')).toBe(txu1.toBuffer().toString('hex'));
            expect(txu2.toString()).toBe(txu1.toString());
            let tx1 = txu1.sign(avm.keyChain());
            let checkTx = tx1.toBuffer().toString("hex");
            let tx1obj = tx1.serialize("hex");
            let tx1str = JSON.stringify(tx1obj);
            /*
            console.log("-----Test1 JSON-----");
            console.log(tx1str);
            console.log("-----Test1 ENDN-----");
            */
            let tx2newobj = JSON.parse(tx1str);
            let tx2 = new tx_1.Tx();
            tx2.deserialize(tx2newobj, "hex");
            /*
            let tx2obj:object = tx2.serialize("hex");
            let tx2str:string = JSON.stringify(tx2obj);
            console.log("-----Test2 JSON-----");
            console.log(tx2str);
            console.log("-----Test2 ENDN-----");
            */
            expect(tx2.toBuffer().toString("hex")).toBe(checkTx);
            let tx3 = txu1.sign(avm.keyChain());
            let tx3obj = tx3.serialize("display");
            let tx3str = JSON.stringify(tx3obj);
            /*
            console.log("-----Test3 JSON-----");
            console.log(tx3str);
            console.log("-----Test3 ENDN-----");
            */
            let tx4newobj = JSON.parse(tx3str);
            let tx4 = new tx_1.Tx();
            tx4.deserialize(tx4newobj, "display");
            /*
            let tx4obj:object = tx4.serialize("display");
            let tx4str:string = JSON.stringify(tx4obj);
            console.log("-----Test4 JSON-----");
            console.log(tx4str);
            console.log("-----Test4 ENDN-----");
            */
            expect(tx4.toBuffer().toString("hex")).toBe(checkTx);
            serialzeit(tx1, "ImportTx");
        }));
        test('buildExportTx', () => __awaiter(void 0, void 0, void 0, function* () {
            avm.setTxFee(new bn_js_1.default(fee));
            const addrbuff1 = addrs1.map((a) => avm.parseAddress(a));
            const addrbuff2 = addrs2.map((a) => avm.parseAddress(a));
            const addrbuff3 = addrs3.map((a) => avm.parseAddress(a));
            const amount = new bn_js_1.default(90);
            const txu1 = yield avm.buildExportTx(set, amount, bintools.cb58Decode(constants_3.PlatformChainID), addrbuff3.map((a) => bintools.addressToString(dijets.getHRP(), "P", a)), addrs1, addrs2, new payload_1.UTF8Payload("hello world"), helperfunctions_1.UnixNow());
            const txu2 = set.buildExportTx(networkid, bintools.cb58Decode(blockchainid), amount, assetID, addrbuff3, addrbuff1, addrbuff2, bintools.cb58Decode(constants_3.PlatformChainID), avm.getTxFee(), assetID, new payload_1.UTF8Payload("hello world").getPayload(), helperfunctions_1.UnixNow());
            expect(txu2.toBuffer().toString('hex')).toBe(txu1.toBuffer().toString('hex'));
            expect(txu2.toString()).toBe(txu1.toString());
            const txu3 = yield avm.buildExportTx(set, amount, constants_3.PlatformChainID, addrs3, addrs1, addrs2, new payload_1.UTF8Payload("hello world"), helperfunctions_1.UnixNow());
            const txu4 = set.buildExportTx(networkid, bintools.cb58Decode(blockchainid), amount, assetID, addrbuff3, addrbuff1, addrbuff2, undefined, avm.getTxFee(), assetID, new payload_1.UTF8Payload("hello world").getPayload(), helperfunctions_1.UnixNow());
            expect(txu4.toBuffer().toString('hex')).toBe(txu3.toBuffer().toString('hex'));
            expect(txu4.toString()).toBe(txu3.toString());
            let tx1 = txu1.sign(avm.keyChain());
            let checkTx = tx1.toBuffer().toString("hex");
            let tx1obj = tx1.serialize("hex");
            let tx1str = JSON.stringify(tx1obj);
            /*
            console.log("-----Test1 JSON-----");
            console.log(tx1str);
            console.log("-----Test1 ENDN-----");
            */
            let tx2newobj = JSON.parse(tx1str);
            let tx2 = new tx_1.Tx();
            tx2.deserialize(tx2newobj, "hex");
            /*
            let tx2obj:object = tx2.serialize("hex");
            let tx2str:string = JSON.stringify(tx2obj);
            console.log("-----Test2 JSON-----");
            console.log(tx2str);
            console.log("-----Test2 ENDN-----");
            */
            expect(tx2.toBuffer().toString("hex")).toBe(checkTx);
            let tx3 = txu1.sign(avm.keyChain());
            let tx3obj = tx3.serialize("display");
            let tx3str = JSON.stringify(tx3obj);
            /*
            console.log("-----Test3 JSON-----");
            console.log(tx3str);
            console.log("-----Test3 ENDN-----");
            */
            let tx4newobj = JSON.parse(tx3str);
            let tx4 = new tx_1.Tx();
            tx4.deserialize(tx4newobj, "display");
            /*
            let tx4obj:object = tx4.serialize("display");
            let tx4str:string = JSON.stringify(tx4obj);
            console.log("-----Test4 JSON-----");
            console.log(tx4str);
            console.log("-----Test4 ENDN-----");
            */
            expect(tx4.toBuffer().toString("hex")).toBe(checkTx);
            serialzeit(tx1, "ExportTx");
        }));
        test('buildGenesis', () => __awaiter(void 0, void 0, void 0, function* () {
            let genesisData = {
                genesisData: {
                    assetAlias1: {
                        name: "human readable name",
                        symbol: "DMC",
                        initialState: {
                            fixedCap: [
                                {
                                    amount: 1000,
                                    address: "A"
                                },
                                {
                                    amount: 5000,
                                    address: "B"
                                },
                            ]
                        }
                    },
                    assetAliasCanBeAnythingUnique: {
                        name: "human readable name",
                        symbol: "DMC",
                        initialState: {
                            variableCap: [
                                {
                                    minters: [
                                        "A",
                                        "B"
                                    ],
                                    threshold: 1
                                },
                                {
                                    minters: [
                                        "A",
                                        "B",
                                        "C"
                                    ],
                                    threshold: 2
                                }
                            ]
                        }
                    }
                }
            };
            let bytes = "111TNWzUtHKoSvxohjyfEwE2X228ZDGBngZ4mdMUVMnVnjtnawW1b1zbAhzyAM1v6d7ECNj6DXsT7qDmhSEf3DWgXRj7ECwBX36ZXFc9tWVB2qHURoUfdDvFsBeSRqatCmj76eZQMGZDgBFRNijRhPNKUap7bCeKpHDtuCZc4YpPkd4mR84dLL2AL1b4K46eirWKMaFVjA5btYS4DnyUx5cLpAq3d35kEdNdU5zH3rTU18S4TxYV8voMPcLCTZ3h4zRsM5jW1cUzjWVvKg7uYS2oR9qXRFcgy1gwNTFZGstySuvSF7MZeZF4zSdNgC4rbY9H94RVhqe8rW7MXqMSZB6vBTB2BpgF6tNFehmYxEXwjaKRrimX91utvZe9YjgGbDr8XHsXCnXXg4ZDCjapCy4HmmRUtUoAduGNBdGVMiwE9WvVbpMFFcNfgDXGz9NiatgSnkxQALTHvGXXm8bn4CoLFzKnAtq3KwiWqHmV3GjFYeUm3m8Zee9VDfZAvDsha51acxfto1htstxYu66DWpT36YT18WSbxibZcKXa7gZrrsCwyzid8CCWw79DbaLCUiq9u47VqofG1kgxwuuyHb8NVnTgRTkQASSbj232fyG7YeX4mAvZY7a7K7yfSyzJaXdUdR7aLeCdLP6mbFDqUMrN6YEkU2X8d4Ck3T";
            let result = api.buildGenesis(genesisData);
            let payload = {
                "result": {
                    'bytes': bytes
                }
            };
            let responseObj = {
                data: payload
            };
            jest_mock_axios_1.default.mockResponse(responseObj);
            let response = yield result;
            expect(response).toBe(bytes);
        }));
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBpLnRlc3QuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi90ZXN0cy9hcGlzL2F2bS9hcGkudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSxzRUFBd0M7QUFDeEMsNkJBQWdDO0FBQ2hDLDBDQUEwQztBQUMxQyxvREFBMEQ7QUFDMUQsb0NBQStCO0FBQy9CLGtEQUF1QjtBQUN2QixrRUFBMEM7QUFDMUMsOENBQW1EO0FBQ25ELGdEQUEyRTtBQUMzRSw4REFBcUM7QUFDckMsd0NBQWlEO0FBQ2pELHNEQUFzRDtBQUN0RCxrREFBZ0k7QUFDaEksMENBQWtHO0FBQ2xHLCtDQUFpQztBQUNqQywrQ0FBZ0Q7QUFDaEQsOERBQTJEO0FBQzNELG1EQUErQztBQUMvQywrREFBb0Q7QUFDcEQsOENBQWlEO0FBQ2pELHNEQUFtRDtBQUNuRCxtREFBc0Q7QUFDdEQscUVBQWtFO0FBQ2xFLG1EQUE4QztBQUM5QywyREFBc0U7QUFFdEU7O0dBRUc7QUFDSCxNQUFNLFFBQVEsR0FBRyxrQkFBUSxDQUFDLFdBQVcsRUFBRSxDQUFDO0FBQ3hDLE1BQU0sVUFBVSxHQUFHLDZCQUFhLENBQUMsV0FBVyxFQUFFLENBQUM7QUFFL0MsTUFBTSxpQkFBaUIsR0FBVyxLQUFLLENBQUM7QUFFeEMsU0FBUyxVQUFVLENBQUMsTUFBbUIsRUFBRSxJQUFXO0lBQ2xELElBQUcsaUJBQWlCLEVBQUM7UUFDbkIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLFVBQVUsQ0FBQyxTQUFTLENBQUMsTUFBTSxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUUsSUFBSSxHQUFHLGlCQUFpQixDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ2xHLE9BQU8sQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxVQUFVLENBQUMsU0FBUyxDQUFDLE1BQU0sRUFBRSxLQUFLLEVBQUUs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T0FBTyxHQUFVLEdBQUcsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDcEQsSUFBSSxNQUFNLEdBQVUsR0FBRyxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUN6QyxJQUFJLE1BQU0sR0FBVSxJQUFJLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBRTNDOzs7O2NBSUU7WUFFRixJQUFJLFNBQVMsR0FBVSxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQzFDLElBQUksR0FBRyxHQUFNLElBQUksT0FBRSxFQUFFLENBQUM7WUFDdEIsR0FBRyxDQUFDLFdBQVcsQ0FBQyxTQUFTLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFFbEM7Ozs7OztjQU1FO1lBRUYsTUFBTSxDQUFDLEdBQUcsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7WUFFckQsSUFBSSxHQUFHLEdBQU0sSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQztZQUN2QyxJQUFJLE1BQU0sR0FBVSxHQUFHLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxDQUFDO1lBQzdDLElBQUksTUFBTSxHQUFVLElBQUksQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLENBQUM7WUFFM0M7Ozs7Y0FJRTtZQUVGLElBQUksU0FBUyxHQUFVLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDMUMsSUFBSSxHQUFHLEdBQU0sSUFBSSxPQUFFLEVBQUUsQ0FBQztZQUN0QixHQUFHLENBQUMsV0FBVyxDQUFDLFNBQVMsRUFBRSxTQUFTLENBQUMsQ0FBQztZQUV0Qzs7Ozs7O2NBTUU7WUFFRixNQUFNLENBQUMsR0FBRyxDQUFDLFFBQVEsRUFBRSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztZ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O2dCQUNqQixRQUFRLEVBQUU7b0JBQ04sT0FBTyxFQUFFLEtBQUs7aUJBQ2pCO2FBQ0osQ0FBQztZQUNGLElBQUksV0FBVyxHQUFHO2dCQUNkLElBQUksRUFBRSxPQUFPO2FBQ2hCLENBQUM7WUFFRix5QkFBUyxDQUFDLFlBQVksQ0FBQyxXQUFXLENBQUMsQ0FBQztZQUNwQyxJQUFJLFFBQVEsR0FBVSxNQUFNLE1BQU0sQ0FBQztZQUVuQyxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ2pDLENBQUMsQ0FBQSxDQUFDLENBQUM7SUFDTCxDQUFDLENBQUMsQ0FBQztBQUNMLENBQUMsQ0FBQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IG1vY2tBeGlvcyBmcm9tICdqZXN0LW1vY2stYXhpb3MnO1xuaW1wb3J0IHsgQXZhbGFuY2hlIH0gZnJvbSBcInNyY1wiO1xuaW1wb3J0IHsgQVZNQVBJIH0gZnJvbSBcInNyYy9hcGlzL2F2bS9hcGlcIjtcbmltcG9ydCB7IEtleVBhaXIsIEtleUNoYWluIH0gZnJvbSAnc3JjL2FwaXMvYXZtL2tleWNoYWluJztcbmltcG9ydCB7QnVmZmVyfSBmcm9tIFwiYnVmZmVyL1wiO1xuaW1wb3J0IEJOIGZyb20gXCJibi5qc1wiO1xuaW1wb3J0IEJpblRvb2xzIGZyb20gJ3NyYy91dGlscy9iaW50b29scyc7XG5pbXBvcnQgeyBVVFhPU2V0LCBVVFhPIH0gZnJvbSAnc3JjL2FwaXMvYXZtL3V0eG9zJztcbmltcG9ydCB7IFRyYW5zZmVyYWJsZUlucHV0LCBTRUNQVHJhbnNmZXJJbnB1dCB9IGZyb20gJ3NyYy9hcGlzL2F2bS9pbnB1dHMnO1xuaW1wb3J0IGNyZWF0ZUhhc2ggZnJvbSBcImNyZWF0ZS1oYXNoXCI7XG5pbXBvcnQgeyBVbnNpZ25lZFR4LCBUeCB9IGZyb20gJ3NyYy9hcGlzL2F2bS90eCc7XG5pbXBvcnQgeyBBVk1Db25zdGFudHMgfSBmcm9tICdzcmMvYXBpcy9hdm0vY29uc3RhbnRzJztcbmltcG9ydCB7IFRyYW5zZmVyYWJsZU91dHB1dCwgU0VDUFRyYW5zZmVyT3V0cHV0LCBORlRNaW50T3V0cHV0LCBORlRUcmFuc2Zlck91dHB1dCwgU0VDUE1pbnRPdXRwdXQgfSBmcm9tICdzcmMvYXBpcy9hdm0vb3V0cHV0cyc7XG5pbXBvcnQgeyBORlRUcmFuc2Zlck9wZXJhdGlvbiwgVHJhbnNmZXJhYmxlT3BlcmF0aW9uLCBTRUNQTWludE9wZXJhdGlvbiB9IGZyb20gJ3NyYy9hcGlzL2F2bS9vcHMnO1xuaW1wb3J0ICogYXMgYmVjaDMyIGZyb20gJ2JlY2gzMic7XG5pbXBvcnQgeyBVVEY4UGF5bG9hZCB9IGZyb20gJ3NyYy91dGlscy9wYXlsb2FkJztcbmltcG9ydCB7IEluaXRpYWxTdGF0ZXMgfSBmcm9tICdzcmMvYXBpcy9hdm0vaW5pdGlhbHN0YXRlcyc7XG5pbXBvcnQgeyBEZWZhdWx0cyB9IGZyb20gJ3NyYy91dGlscy9jb25zdGFudHMnO1xuaW1wb3J0IHsgVW5peE5vdyB9IGZyb20gJ3NyYy91dGlscy9oZWxwZXJmdW5jdGlvbnMnO1xuaW1wb3J0IHsgT3V0cHV0T3duZXJzIH0gZnJvbSAnc3JjL2NvbW1vbi9vdXRwdXQnO1xuaW1wb3J0IHsgTWludGVyU2V0IH0gZnJvbSAnc3JjL2FwaXMvYXZtL21pbnRlcnNldCc7XG5pbXBvcnQgeyBQbGF0Zm9ybUNoYWluSUQgfSBmcm9tICdzcmMvdXRpbHMvY29uc3RhbnRzJztcbmltcG9ydCB7IFBlcnNpc3RhbmNlT3B0aW9ucyB9IGZyb20gJ3NyYy91dGlscy9wZXJzaXN0ZW5jZW9wdGlvbnMnO1xuaW1wb3J0IHsgT05FQVZBWCB9IGZyb20gJ3NyYy91dGlscy9jb25zdGFudHMnO1xuaW1wb3J0IHsgU2VyaWFsaXphYmxlLCBTZXJpYWxpemF0aW9uIH0gZnJvbSAnc3JjL3V0aWxzL3NlcmlhbGl6YXRpb24nO1xuXG4vKipcbiAqIEBpZ25vcmVcbiAqL1xuY29uc3QgYmludG9vbHMgPSBCaW5Ub29scy5nZXRJbnN0YW5jZSgpO1xuY29uc3Qgc2VyaWFsaXplciA9IFNlcmlhbGl6YXRpb24uZ2V0SW5zdGFuY2UoKTtcblxuY29uc3QgZHVtcFNlcmFpbGl6YXRpb246Ym9vbGVhbiA9IGZhbHNlO1xuXG5mdW5jdGlvbiBzZXJpYWx6ZWl0KGFUaGluZzpTZXJpYWxpemFibGUsIG5hbWU6c3RyaW5nKXtcbiAgaWYoZHVtcFNlcmFpbGl6YXRpb24pe1xuICAgIGNvbnNvbGUubG9nKEpTT04uc3RyaW5naWZ5KHNlcmlhbGl6ZXIuc2VyaWFsaXplKGFUaGluZywgXCJhdm1cIiwgXCJoZXhcIiwgbmFtZSArIFwiIC0tIEhleCBFbmNvZGVkXCIpKSk7XG4gICAgY29uc29sZS5sb2coSlNPTi5zdHJpbmdpZnkoc2VyaWFsaXplci5zZXJpYWxpemUoYVRoaW5nLCBcImF2bVwiLCBcImRpc3BsYXlcIiwgbmFtZSArIFwiIC0tIEh1bWFuLVJlYWRhYmxlXCIpKSk7XG4gIH1cbn1cblxuZGVzY3JpYmUoJ0FWTUFQSScsICgpID0+IHtcbiAgY29uc3QgbmV0d29ya2lkOm51bWJlciA9IDEyMzQ1O1xuICBjb25zdCBibG9ja2NoYWluaWQ6c3RyaW5nID0gRGVmYXVsdHMubmV0d29ya1tuZXR3b3JraWRdLlguYmxvY2tjaGFpbklEO1xuICBjb25zdCBpcDpzdHJpbmcgPSAnMTI3LjAuMC4xJztcbiAgY29uc3QgcG9ydDpudW1iZXIgPSA5NjUwO1xuICBjb25zdCBwcm90b2NvbDpzdHJpbmcgPSAnaHR0cHMnO1xuXG4gIGNvbnN0IHVzZXJuYW1lOnN0cmluZyA9ICdBdmFMYWJzJztcbiAgY29uc3QgcGFzc3dvcmQ6c3RyaW5nID0gJ3Bhc3N3b3JkJztcblxuICBjb25zdCBhdmFsYW5jaGU6QXZhbGFuY2hlID0gbmV3IEF2YWxhbmNoZShpcCwgcG9ydCwgcHJvdG9jb2wsIG5ldHdvcmtpZCwgdW5kZWZpbmVkLCB1bmRlZmluZWQsIHVuZGVmaW5lZCwgdHJ1ZSk7XG4gIGxldCBhcGk6QVZNQVBJO1xuICBsZXQgYWxpYXM6c3RyaW5nO1xuXG5cbiAgY29uc3QgYWRkckE6c3RyaW5nID0gJ1gtJyArIGJlY2gzMi5lbmNvZGUoYXZhbGFuY2hlLmdldEhSUCgpLCBiZWNoMzIudG9Xb3JkcyhiaW50b29scy5jYjU4RGVjb2RlKFwiQjZENHYxVnRQWUxiaVV2WVh0VzRQeDhvRTlpbUMydkdXXCIpKSk7XG4gIGNvbnN0IGFkZHJCOnN0cmluZyA9ICdYLScgKyBiZWNoMzIuZW5jb2RlKGF2YWxhbmNoZS5nZXRIUlAoKSwgYmVjaDMyLnRvV29yZHMoYmludG9vbHMuY2I1OERlY29kZShcIlA1d2RSdVplYUR0MjhlSE1QNVMzdzlaZG9CZm83d3V6RlwiKSkpO1xuICBjb25zdCBhZGRyQzpzdHJpbmcgPSAnWC0nICsgYmVjaDMyLmVuY29kZShhdmFsYW5jaGUuZ2V0SFJQKCksIGJlY2gzMi50b1dvcmRzKGJpbnRvb2xzLmNiNThEZWNvZGUoXCI2WTNreXNqRjlqbkhuWWtkUzl5R0F1b0h5YWUyZU5tZVZcIikpKTtcblxuICBiZWZvcmVBbGwoKCkgPT4ge1xuICAgIGFwaSA9IG5ldyBBVk1BUEkoYXZhbGFuY2hlLCAnL2V4dC9iYy9YJywgYmxvY2tjaGFpbmlkKTtcbiAgICBhbGlhcyA9IGFwaS5nZXRCbG9ja2NoYWluQWxpYXMoKTtcbiAgfSk7XG5cbiAgYWZ0ZXJFYWNoKCgpID0+IHtcbiAgICBtb2NrQXhpb3MucmVzZXQoKTtcbiAgfSk7XG5cbiAgdGVzdCgnY2FuIFNlbmQgMScsIGFzeW5jICgpID0+IHtcbiAgICBjb25zdCB0eElkOnN0cmluZyA9ICdhc2RmaHZsMjM0JztcbiAgICBjb25zdCBtZW1vOnN0cmluZyA9IFwiaGVsbG8gd29ybGRcIjtcbiAgICBjb25zdCBjaGFuZ2VBZGRyOnN0cmluZyA9IFwiWC1sb2NhbDFcIlxuICAgIGNvbnN0IHJlc3VsdDpQcm9taXNlPG9iamVjdD4gPSBhcGkuc2VuZCh1c2VybmFtZSwgcGFzc3dvcmQsICdhc3NldElkJywgMTAsIGFkZHJBLCBbYWRkckJdLCBhZGRyQSwgbWVtbyk7XG4gICAgY29uc3QgcGF5bG9hZDpvYmplY3QgPSB7XG4gICAgICByZXN1bHQ6IHtcbiAgICAgICAgdHhJRDogdHhJZCxcbiAgICAgICAgY2hhbmdlQWRkcjogY2hhbmdlQWRkclxuICAgICAgfSxcbiAgICB9O1xuICAgIGNvbnN0IHJlc3BvbnNlT2JqID0ge1xuICAgICAgZGF0YTogcGF5bG9hZCxcbiAgICB9O1xuXG4gICAgbW9ja0F4aW9zLm1vY2tSZXNwb25zZShyZXNwb25zZU9iaik7XG4gICAgY29uc3QgcmVzcG9uc2U6b2JqZWN0ID0gYXdhaXQgcmVzdWx0O1xuXG4gICAgZXhwZWN0KG1vY2tBeGlvcy5yZXF1ZXN0KS50b0hhdmVCZWVuQ2FsbGVkVGltZXMoMSk7XG4gICAgZXhwZWN0KHJlc3BvbnNlWyd0eElEJ10pLnRvQmUodHhJZCk7XG4gICAgZXhwZWN0KHJlc3BvbnNlWydjaGFuZ2VBZGRyJ10pLnRvQmUoY2hhbmdlQWRkcik7XG4gIH0pO1xuXG4gIHRlc3QoJ2NhbiBTZW5kIDInLCBhc3luYyAoKSA9PiB7XG4gICAgY29uc3QgdHhJZDpzdHJpbmcgPSAnYXNkZmh2bDIzNCc7XG4gICAgY29uc3QgbWVtbzpCdWZmZXIgPSBCdWZmZXIuZnJvbShcImhlbGxvIHdvcmxkXCIpXG4gICAgY29uc3QgY2hhbmdlQWRkcjpzdHJpbmcgPSBcIlgtbG9jYWwxXCJcbiAgICBjb25zdCByZXN1bHQ6UHJvbWlzZTxvYmplY3Q+ID0gYXBpLnNlbmQodXNlcm5hbWUsIHBhc3N3b3JkLCBiaW50b29scy5iNThUb0J1ZmZlcignNmgyczVkZTFWQzY1bWVhakUxTDJQanZaMU1YdkhjM0Y2ZXFQQ0dLdUR0NE14aXdlRicpLCBuZXcgQk4oMTApLCBhZGRyQSwgW2FkZHJCXSwgYWRkckEsIG1lbW8pO1xuICAgIGNvbnN0IHBheWxvYWQ6b2JqZWN0ID0ge1xuICAgICAgcmVzdWx0OiB7XG4gICAgICAgIHR4SUQ6IHR4SWQsXG4gICAgICAgIGNoYW5nZUFkZHI6IGNoYW5nZUFkZHJcbiAgICAgIH0sXG4gICAgfTtcbiAgICBjb25zdCByZXNwb25zZU9iaiA9IHtcbiAgICAgIGRhdGE6IHBheWxvYWQsXG4gICAgfTtcblxuICAgIG1vY2tBeGlvcy5tb2NrUmVzcG9uc2UocmVzcG9uc2VPYmopO1xuICAgIGNvbnN0IHJlc3BvbnNlOm9iamVjdCA9IGF3YWl0IHJlc3VsdDtcblxuICAgIGV4cGVjdChtb2NrQXhpb3MucmVxdWVzdCkudG9IYXZlQmVlbkNhbGxlZFRpbWVzKDEpO1xuICAgIGV4cGVjdChyZXNwb25zZVsndHhJRCddKS50b0JlKHR4SWQpO1xuICAgIGV4cGVjdChyZXNwb25zZVsnY2hhbmdlQWRkciddKS50b0JlKGNoYW5nZUFkZHIpO1xuICB9KTtcblxuICB0ZXN0KCdjYW4gU2VuZCBNdWx0aXBsZScsIGFzeW5jICgpID0+IHtcbiAgICBjb25zdCB0eElkOnN0cmluZyA9ICdhc2RmaHZsMjM0JztcbiAgICBjb25zdCBtZW1vOnN0cmluZyA9IFwiaGVsbG8gd29ybGRcIjtcbiAgICBjb25zdCBjaGFuZ2VBZGRyOnN0cmluZyA9IFwiWC1sb2NhbDFcIlxuICAgIGNvbnN0IHJlc3VsdDpQcm9taXNlPG9iamVjdD4gPSBhcGkuc2VuZE11bHRpcGxlKHVzZXJuYW1lLCBwYXNzd29yZCwgW3thc3NldElEOiAnYXNzZXRJZCcsIGFtb3VudDogMTAsIHRvOiBhZGRyQX1dLCBbYWRkckJdLCBhZGRyQSwgbWVtbyk7XG4gICAgY29uc3QgcGF5bG9hZDpvYmplY3QgPSB7XG4gICAgICByZXN1bHQ6IHtcbiAgICAgICAgdHhJRDogdHhJZCxcbiAgICAgICAgY2hhbmdlQWRkcjogY2hhbmdlQWRkclxuICAgICAgfSxcbiAgICB9O1xuICAgIGNvbnN0IHJlc3BvbnNlT2JqID0ge1xuICAgICAgZGF0YTogcGF5bG9hZCxcbiAgICB9O1xuXG4gICAgbW9ja0F4aW9zLm1vY2tSZXNwb25zZShyZXNwb25zZU9iaik7XG4gICAgY29uc3QgcmVzcG9uc2U6b2JqZWN0ID0gYXdhaXQgcmVzdWx0O1xuXG4gICAgZXhwZWN0KG1vY2tBeGlvcy5yZXF1ZXN0KS50b0hhdmVCZWVuQ2FsbGVkVGltZXMoMSk7XG4gICAgZXhwZWN0KHJlc3BvbnNlWyd0eElEJ10pLnRvQmUodHhJZCk7XG4gICAgZXhwZWN0KHJlc3BvbnNlWydjaGFuZ2VBZGRyJ10pLnRvQmUoY2hhbmdlQWRkcik7XG4gIH0pO1xuXG4gIHRlc3QoJ3JlZnJlc2hCbG9ja2NoYWluSUQnLCBhc3luYyAoKSA9PiB7XG4gICAgbGV0IG4zYmNJRDpzdHJpbmcgPSBEZWZhdWx0cy5uZXR3b3JrWzNdLlhbXCJibG9ja2NoYWluSURcIl07XG4gICAgbGV0IG4xMjM0NWJjSUQ6c3RyaW5nID0gRGVmYXVsdHMubmV0d29ya1sxMjM0NV0uWFtcImJsb2NrY2hhaW5JRFwiXTtcbiAgICBsZXQgdGVzdEFQSTpBVk1BUEkgPSBuZXcgQVZNQVBJKGF2YWxhbmNoZSwgJy9leHQvYmMvYXZtJywgbjNiY0lEKTtcbiAgICBsZXQgYmMxOnN0cmluZyA9IHRlc3RBUEkuZ2V0QmxvY2tjaGFpbklEKCk7XG4gICAgZXhwZWN0KGJjMSkudG9CZShuM2JjSUQpO1xuXG4gICAgdGVzdEFQSS5yZWZyZXNoQmxvY2tjaGFpbklEKCk7XG4gICAgbGV0IGJjMjpzdHJpbmcgPSB0ZXN0QVBJLmdldEJsb2NrY2hhaW5JRCgpO1xuICAgIGV4cGVjdChiYzIpLnRvQmUobjEyMzQ1YmNJRCk7XG5cbiAgICB0ZXN0QVBJLnJlZnJlc2hCbG9ja2NoYWluSUQobjNiY0lEKTtcbiAgICBsZXQgYmMzOnN0cmluZyA9IHRlc3RBUEkuZ2V0QmxvY2tjaGFpbklEKCk7XG4gICAgZXhwZWN0KGJjMykudG9CZShuM2JjSUQpO1xuXG4gIH0pO1xuXG4gIHRlc3QoJ2xpc3RBZGRyZXNzZXMnLCBhc3luYyAoKSA9PiB7XG4gICAgY29uc3QgYWRkcmVzc2VzID0gW2FkZHJBLCBhZGRyQl07XG5cbiAgICBjb25zdCByZXN1bHQ6UHJvbWlzZTxBcnJheTxzdHJpbmc+PiA9IGFwaS5saXN0QWRkcmVzc2VzKHVzZXJuYW1lLCBwYXNzd29yZCk7XG4gICAgY29uc3QgcGF5bG9hZDpvYmplY3QgPSB7XG4gICAgICByZXN1bHQ6IHtcbiAgICAgICAgYWRkcmVzc2VzLFxuICAgICAgfSxcbiAgICB9O1xuICAgIGNvbnN0IHJlc3BvbnNlT2JqID0ge1xuICAgICAgZGF0YTogcGF5bG9hZCxcbiAgICB9O1xuXG4gICAgbW9ja0F4aW9zLm1vY2tSZXNwb25zZShyZXNwb25zZU9iaik7XG4gICAgY29uc3QgcmVzcG9uc2U6QXJyYXk8c3RyaW5nPiA9IGF3YWl0IHJlc3VsdDtcblxuICAgIGV4cGVjdChtb2NrQXhpb3MucmVxdWVzdCkudG9IYXZlQmVlbkNhbGxlZFRpbWVzKDEpO1xuICAgIGV4cGVjdChyZXNwb25zZSkudG9CZShhZGRyZXNzZXMpO1xuICB9KTtcblxuICB0ZXN0KCdpbXBvcnRLZXknLCBhc3luYyAoKSA9PiB7XG4gICAgY29uc3QgYWRkcmVzcyA9IGFkZHJDO1xuXG4gICAgY29uc3QgcmVzdWx0OlByb21pc2U8c3RyaW5nPiA9IGFwaS5pbXBvcnRLZXkodXNlcm5hbWUsIHBhc3N3b3JkLCAna2V5Jyk7XG4gICAgY29uc3QgcGF5bG9hZDpvYmplY3QgPSB7XG4gICAgICByZXN1bHQ6IHtcbiAgICAgICAgYWRkcmVzcyxcbiAgICAgIH0sXG4gICAgfTtcbiAgICBjb25zdCByZXNwb25zZU9iaiA9IHtcbiAgICAgIGRhdGE6IHBheWxvYWQsXG4gICAgfTtcblxuICAgIG1vY2tBeGlvcy5tb2NrUmVzcG9uc2UocmVzcG9uc2VPYmopO1xuICAgIGNvbnN0IHJlc3BvbnNlOnN0cmluZyA9IGF3YWl0IHJlc3VsdDtcblxuICAgIGV4cGVjdChtb2NrQXhpb3MucmVxdWVzdCkudG9IYXZlQmVlbkNhbGxlZFRpbWVzKDEpO1xuICAgIGV4cGVjdChyZXNwb25zZSkudG9CZShhZGRyZXNzKTtcbiAgfSk7XG5cbiAgdGVzdCgnZ2V0QmFsYW5jZScsIGFzeW5jICgpID0+IHtcbiAgICBjb25zdCBiYWxhbmNlID0gbmV3IEJOKCcxMDAnLCAxMCk7XG4gICAgY29uc3QgcmVzcG9iaiA9IHtcbiAgICAgIGJhbGFuY2UsXG4gICAgICB1dHhvSURzOiBbXG4gICAgICAgIHtcbiAgICAgICAgICBcInR4SURcIjpcIkxVcmlCM1c5MTlGODRMd1BNTXc0c20yZlo0WTc2V2diNm1zYWF1RVk3aTF0Rk5tdHZcIixcbiAgICAgICAgICBcIm91dHB1dEluZGV4XCI6MFxuICAgICAgICB9XG4gICAgICBdXG4gICAgfTtcblxuICAgIGNvbnN0IHJlc3VsdDpQcm9taXNlPG9iamVjdD4gPSBhcGkuZ2V0QmFsYW5jZShhZGRyQSwgJ0FUSCcpO1xuICAgIGNvbnN0IHBheWxvYWQ6b2JqZWN0ID0ge1xuICAgICAgcmVzdWx0OiByZXNwb2JqLFxuICAgIH07XG4gICAgY29uc3QgcmVzcG9uc2VPYmogPSB7XG4gICAgICBkYXRhOiBwYXlsb2FkLFxuICAgIH07XG5cbiAgICBtb2NrQXhpb3MubW9ja1Jlc3BvbnNlKHJlc3BvbnNlT2JqKTtcbiAgICBjb25zdCByZXNwb25zZTpvYmplY3QgPSBhd2FpdCByZXN1bHQ7XG5cbiAgICBleHBlY3QobW9ja0F4aW9zLnJlcXVlc3QpLnRvSGF2ZUJlZW5DYWxsZWRUaW1lcygxKTtcbiAgICBleHBlY3QoSlNPTi5zdHJpbmdpZnkocmVzcG9uc2UpKS50b0JlKEpTT04uc3RyaW5naWZ5KHJlc3BvYmopKTtcbiAgfSk7XG5cbiAgdGVzdCgnZXhwb3J0S2V5JywgYXN5bmMgKCkgPT4ge1xuICAgIGNvbnN0IGtleSA9ICdzZGZnbHZsajJoM3Y0NSc7XG5cbiAgICBjb25zdCByZXN1bHQ6UHJvbWlzZTxzdHJpbmc+ID0gYXBpLmV4cG9ydEtleSh1c2VybmFtZSwgcGFzc3dvcmQsIGFkZHJBKTtcbiAgICBjb25zdCBwYXlsb2FkOm9iamVjdCA9IHtcbiAgICAgIHJlc3VsdDoge1xuICAgICAgICBwcml2YXRlS2V5OiBrZXksXG4gICAgICB9LFxuICAgIH07XG4gICAgY29uc3QgcmVzcG9uc2VPYmogPSB7XG4gICAgICBkYXRhOiBwYXlsb2FkLFxuICAgIH07XG5cbiAgICBtb2NrQXhpb3MubW9ja1Jlc3BvbnNlKHJlc3BvbnNlT2JqKTtcbiAgICBjb25zdCByZXNwb25zZTpzdHJpbmcgPSBhd2FpdCByZXN1bHQ7XG5cbiAgICBleHBlY3QobW9ja0F4aW9zLnJlcXVlc3QpLnRvSGF2ZUJlZW5DYWxsZWRUaW1lcygxKTtcbiAgICBleHBlY3QocmVzcG9uc2UpLnRvQmUoa2V5KTtcbiAgfSk7XG5cbiAgdGVzdChcImV4cG9ydFwiLCBhc3luYyAoKT0+e1xuICAgIGxldCBhbW91bnQgPSBuZXcgQk4oMTAwKTtcbiAgICBsZXQgdG8gPSBcImFiY2RlZlwiO1xuICAgIGxldCBhc3NldElEID0gXCJBVkFYXCJcbiAgICBsZXQgdXNlcm5hbWUgPSBcIlJvYmVydFwiO1xuICAgIGxldCBwYXNzd29yZCA9IFwiUGF1bHNvblwiO1xuICAgIGxldCB0eElEID0gXCJ2YWxpZFwiO1xuICAgIGxldCByZXN1bHQ6UHJvbWlzZTxzdHJpbmc+ID0gYXBpLmV4cG9ydCh1c2VybmFtZSwgcGFzc3dvcmQsIHRvLCBhbW91bnQsIGFzc2V0SUQpO1xuICAgIGxldCBwYXlsb2FkOm9iamVjdCA9IHtcbiAgICAgICAgXCJyZXN1bHRcIjoge1xuICAgICAgICAgICAgXCJ0eElEXCI6IHR4SURcbiAgICAgICAgfVxuICAgIH07XG4gICAgbGV0IHJlc3BvbnNlT2JqID0ge1xuICAgICAgICBkYXRhOiBwYXlsb2FkXG4gICAgfTtcblxuICAgIG1vY2tBeGlvcy5tb2NrUmVzcG9uc2UocmVzcG9uc2VPYmopO1xuICAgIGxldCByZXNwb25zZTpzdHJpbmcgPSBhd2FpdCByZXN1bHQ7XG5cbiAgICBleHBlY3QobW9ja0F4aW9zLnJlcXVlc3QpLnRvSGF2ZUJlZW5DYWxsZWRUaW1lcygxKTtcbiAgICBleHBlY3QocmVzcG9uc2UpLnRvQmUodHhJRCk7XG4gIH0pO1xuXG4gIHRlc3QoXCJleHBvcnRBVkFYXCIsIGFzeW5jICgpPT57XG4gICAgbGV0IGFtb3VudCA9IG5ldyBCTigxMDApO1xuICAgIGxldCB0byA9IFwiYWJjZGVmXCI7XG4gICAgbGV0IHVzZXJuYW1lID0gXCJSb2JlcnRcIjtcbiAgICBsZXQgcGFzc3dvcmQgPSBcIlBhdWxzb25cIjtcbiAgICBsZXQgdHhJRCA9IFwidmFsaWRcIjtcbiAgICBsZXQgcmVzdWx0OlByb21pc2U8c3RyaW5nPiA9IGFwaS5leHBvcnRBVkFYKHVzZXJuYW1lLCBwYXNzd29yZCwgdG8sIGFtb3VudCk7XG4gICAgbGV0IHBheWxvYWQ6b2JqZWN0ID0ge1xuICAgICAgICBcInJlc3VsdFwiOiB7XG4gICAgICAgICAgICBcInR4SURcIjogdHhJRFxuICAgICAgICB9XG4gICAgfTtcbiAgICBsZXQgcmVzcG9uc2VPYmogPSB7XG4gICAgICAgIGRhdGE6IHBheWxvYWRcbiAgICB9O1xuXG4gICAgbW9ja0F4aW9zLm1vY2tSZXNwb25zZShyZXNwb25zZU9iaik7XG4gICAgbGV0IHJlc3BvbnNlOnN0cmluZyA9IGF3YWl0IHJlc3VsdDtcblxuICAgIGV4cGVjdChtb2NrQXhpb3MucmVxdWVzdCkudG9IYXZlQmVlbkNhbGxlZFRpbWVzKDEpO1xuICAgIGV4cGVjdChyZXNwb25zZSkudG9CZSh0eElEKTtcbn0pO1xuXG50ZXN0KFwiaW1wb3J0XCIsIGFzeW5jICgpPT57XG4gIGxldCB0byA9IFwiYWJjZGVmXCI7XG4gIGxldCB1c2VybmFtZSA9IFwiUm9iZXJ0XCI7XG4gIGxldCBwYXNzd29yZCA9IFwiUGF1bHNvblwiO1xuICBsZXQgdHhJRCA9IFwidmFsaWRcIjtcbiAgbGV0IHJlc3VsdDpQcm9taXNlPHN0cmluZz4gPSBhcGkuaW1wb3J0KHVzZXJuYW1lLCBwYXNzd29yZCwgdG8sIGJsb2NrY2hhaW5pZCk7XG4gIGxldCBwYXlsb2FkOm9iamVjdCA9IHtcbiAgICAgIFwicmVzdWx0XCI6IHtcbiAgICAgICAgICBcInR4SURcIjogdHhJRFxuICAgICAgfVxuICB9O1xuICBsZXQgcmVzcG9uc2VPYmogPSB7XG4gICAgICBkYXRhOiBwYXlsb2FkXG4gIH07XG5cbiAgbW9ja0F4aW9zLm1vY2tSZXNwb25zZShyZXNwb25zZU9iaik7XG4gIGxldCByZXNwb25zZTpzdHJpbmcgPSBhd2FpdCByZXN1bHQ7XG5cbiAgZXhwZWN0KG1vY2tBeGlvcy5yZXF1ZXN0KS50b0hhdmVCZWVuQ2FsbGVkVGltZXMoMSk7XG4gIGV4cGVjdChyZXNwb25zZSkudG9CZSh0eElEKTtcbn0pO1xuXG4gIHRlc3QoXCJpbXBvcnRBVkFYXCIsIGFzeW5jICgpPT57XG4gICAgbGV0IHRvID0gXCJhYmNkZWZcIjtcbiAgICBsZXQgdXNlcm5hbWUgPSBcIlJvYmVydFwiO1xuICAgIGxldCBwYXNzd29yZCA9IFwiUGF1bHNvblwiO1xuICAgIGxldCB0eElEID0gXCJ2YWxpZFwiO1xuICAgIGxldCByZXN1bHQ6UHJvbWlzZTxzdHJpbmc+ID0gYXBpLmltcG9ydEFWQVgodXNlcm5hbWUsIHBhc3N3b3JkLCB0bywgYmxvY2tjaGFpbmlkKTtcbiAgICBsZXQgcGF5bG9hZDpvYmplY3QgPSB7XG4gICAgICAgIFwicmVzdWx0XCI6IHtcbiAgICAgICAgICAgIFwidHhJRFwiOiB0eElEXG4gICAgICAgIH1cbiAgICB9O1xuICAgIGxldCByZXNwb25zZU9iaiA9IHtcbiAgICAgICAgZGF0YTogcGF5bG9hZFxuICAgIH07XG5cbiAgICBtb2NrQXhpb3MubW9ja1Jlc3BvbnNlKHJlc3BvbnNlT2JqKTtcbiAgICBsZXQgcmVzcG9uc2U6c3RyaW5nID0gYXdhaXQgcmVzdWx0O1xuXG4gICAgZXhwZWN0KG1vY2tBeGlvcy5yZXF1ZXN0KS50b0hhdmVCZWVuQ2FsbGVkVGltZXMoMSk7XG4gICAgZXhwZWN0KHJlc3BvbnNlKS50b0JlKHR4SUQpO1xufSk7XG5cbiAgdGVzdCgnY3JlYXRlQWRkcmVzcycsIGFzeW5jICgpID0+IHtcbiAgICBjb25zdCBhbGlhcyA9ICdyYW5kb21hbGlhcyc7XG5cbiAgICBjb25zdCByZXN1bHQ6UHJvbWlzZTxzdHJpbmc+ID0gYXBpLmNyZWF0ZUFkZHJlc3ModXNlcm5hbWUsIHBhc3N3b3JkKTtcbiAgICBjb25zdCBwYXlsb2FkOm9iamVjdCA9IHtcbiAgICAgIHJlc3VsdDoge1xuICAgICAgICBhZGRyZXNzOiBhbGlhcyxcbiAgICAgIH0sXG4gICAgfTtcbiAgICBjb25zdCByZXNwb25zZU9iaiA9IHtcbiAgICAgIGRhdGE6IHBheWxvYWQsXG4gICAgfTtcblxuICAgIG1vY2tBeGlvcy5tb2NrUmVzcG9uc2UocmVzcG9uc2VPYmopO1xuICAgIGNvbnN0IHJlc3BvbnNlOnN0cmluZyA9IGF3YWl0IHJlc3VsdDtcblxuICAgIGV4cGVjdChtb2NrQXhpb3MucmVxdWVzdCkudG9IYXZlQmVlbkNhbGxlZFRpbWVzKDEpO1xuICAgIGV4cGVjdChyZXNwb25zZSkudG9CZShhbGlhcyk7XG4gIH0pO1xuXG4gIHRlc3QoJ2NyZWF0ZUZpeGVkQ2FwQXNzZXQnLCBhc3luYyAoKSA9PiB7XG4gICAgY29uc3Qga3A6S2V5UGFpciA9IG5ldyBLZXlQYWlyKGF2YWxhbmNoZS5nZXRIUlAoKSwgYWxpYXMpO1xuICAgIGtwLmltcG9ydEtleShCdWZmZXIuZnJvbSgnZWY5YmYyZDQ0MzY0OTFjMTUzOTY3Yzk3MDlkZDhlODI3OTViZGI5YjVhZDQ0ZWUyMmMyOTAzMDA1ZDFjZjY3NicsICdoZXgnKSk7XG5cbiAgICBjb25zdCBkZW5vbWluYXRpb246bnVtYmVyID0gMDtcbiAgICBjb25zdCBhc3NldGlkOnN0cmluZyA9ICc4YTVkMmQzMmU2OGJjNTAwMzZlNGQwODYwNDQ2MTdmZTRhMGEwMjk2YjI3NDk5OWJhNTY4ZWE5MmRhNDZkNTMzJztcbiAgICBjb25zdCBpbml0aWFsSG9sZGVyczpBcnJheTxvYmplY3Q+ID0gW1xuICAgICAge1xuICAgICAgICBhZGRyZXNzOiAnN3NpazNQcjZyMUZlTHJ2SzFvV3dFQ0JTOGlKNVZQdVNoJyxcbiAgICAgICAgYW1vdW50OiAnMTAwMDAnLFxuICAgICAgfSxcbiAgICAgIHtcbiAgICAgICAgYWRkcmVzczogJzdzaWszUHI2cjFGZUxydksxb1d3RUNCUzhpSjVWUHVTaCcsXG4gICAgICAgIGFtb3VudDogJzUwMDAwJyxcbiAgICAgIH0sXG4gICAgXTtcblxuICAgIGNvbnN0IHJlc3VsdDpQcm9taXNlPHN0cmluZz4gPSBhcGkuY3JlYXRlRml4ZWRDYXBBc3NldCh1c2VybmFtZSwgcGFzc3dvcmQsICdTb21lIENvaW4nLCAnU0NDJywgZGVub21pbmF0aW9uLCBpbml0aWFsSG9sZGVycyk7XG4gICAgY29uc3QgcGF5bG9hZDpvYmplY3QgPSB7XG4gICAgICByZXN1bHQ6IHtcbiAgICAgICAgYXNzZXRJRDogYXNzZXRpZCxcbiAgICAgIH0sXG4gICAgfTtcbiAgICBjb25zdCByZXNwb25zZU9iaiA9IHtcbiAgICAgIGRhdGE6IHBheWxvYWQsXG4gICAgfTtcblxuICAgIG1vY2tBeGlvcy5tb2NrUmVzcG9uc2UocmVzcG9uc2VPYmopO1xuICAgIGNvbnN0IHJlc3BvbnNlOnN0cmluZyA9IGF3YWl0IHJlc3VsdDtcblxuICAgIGV4cGVjdChtb2NrQXhpb3MucmVxdWVzdCkudG9IYXZlQmVlbkNhbGxlZFRpbWVzKDEpO1xuICAgIGV4cGVjdChyZXNwb25zZSkudG9CZShhc3NldGlkKTtcbiAgfSk7XG5cbiAgdGVzdCgnY3JlYXRlVmFyaWFibGVDYXBBc3NldCcsIGFzeW5jICgpID0+IHtcbiAgICBjb25zdCBrcDpLZXlQYWlyID0gbmV3IEtleVBhaXIoYXZhbGFuY2hlLmdldEhSUCgpLCBhbGlhcyk7XG4gICAga3AuaW1wb3J0S2V5KEJ1ZmZlci5mcm9tKCdlZjliZjJkNDQzNjQ5MWMxNTM5NjdjOTcwOWRkOGU4Mjc5NWJkYjliNWFkNDRlZTIyYzI5MDMwMDVkMWNmNjc2JywgJ2hleCcpKTtcblxuICAgIGNvbnN0IGRlbm9taW5hdGlvbjpudW1iZXIgPSAwO1xuICAgIGNvbnN0IGFzc2V0aWQ6c3RyaW5nID0gJzhhNWQyZDMyZTY4YmM1MDAzNmU0ZDA4NjA0NDYxN2ZlNGEwYTAyOTZiMjc0OTk5YmE1NjhlYTkyZGE0NmQ1MzMnO1xuICAgIGNvbnN0IG1pbnRlclNldHM6QXJyYXk8b2JqZWN0PiA9IFtcbiAgICAgIHtcbiAgICAgICAgbWludGVyczogW1xuICAgICAgICAgICc0cGVKc0Z2aGRuN1hqaE5GNEhXQVF5NllhSnRzMjdzOXEnLFxuICAgICAgICBdLFxuICAgICAgICB0aHJlc2hvbGQ6IDEsXG4gICAgICB9LFxuICAgICAge1xuICAgICAgICBtaW50ZXJzOiBbXG4gICAgICAgICAgJ2RjSjZ6OWR1TGZ5UVRnYmpxMndCQ293a3ZjUFpIVkRGJyxcbiAgICAgICAgICAnMmZFNmlpYnFmRVJ6NXdlblhFNnF5dmluc3hEdkZoSFprJyxcbiAgICAgICAgICAnN2llQUpiZnJHUWJwTlpSQVFFcFpDQzFHczF6NWd6NEhVJyxcbiAgICAgICAgXSxcbiAgICAgICAgdGhyZXNob2xkOiAyLFxuICAgICAgfSxcbiAgICBdO1xuXG4gICAgY29uc3QgcmVzdWx0OlByb21pc2U8c3RyaW5nPiA9IGFwaS5jcmVhdGVWYXJpYWJsZUNhcEFzc2V0KHVzZXJuYW1lLCBwYXNzd29yZCwgJ1NvbWUgQ29pbicsICdTQ0MnLCBkZW5vbWluYXRpb24sIG1pbnRlclNldHMpO1xuICAgIGNvbnN0IHBheWxvYWQ6b2JqZWN0ID0ge1xuICAgICAgcmVzdWx0OiB7XG4gICAgICAgIGFzc2V0SUQ6IGFzc2V0aWQsXG4gICAgICB9LFxuICAgIH07XG4gICAgY29uc3QgcmVzcG9uc2VPYmogPSB7XG4gICAgICBkYXRhOiBwYXlsb2FkLFxuICAgIH07XG5cbiAgICBtb2NrQXhpb3MubW9ja1Jlc3BvbnNlKHJlc3BvbnNlT2JqKTtcbiAgICBjb25zdCByZXNwb25zZTpzdHJpbmcgPSBhd2FpdCByZXN1bHQ7XG5cbiAgICBleHBlY3QobW9ja0F4aW9zLnJlcXVlc3QpLnRvSGF2ZUJlZW5DYWxsZWRUaW1lcygxKTtcbiAgICBleHBlY3QocmVzcG9uc2UpLnRvQmUoYXNzZXRpZCk7XG4gIH0pO1xuXG4gIHRlc3QoJ21pbnQgMScsIGFzeW5jICgpID0+IHtcbiAgICBjb25zdCB1c2VybmFtZTpzdHJpbmcgPSAnQ29sbGluJztcbiAgICBjb25zdCBwYXNzd29yZDpzdHJpbmcgPSAnQ3VzY2UnO1xuICAgIGNvbnN0IGFtb3VudDpudW1iZXIgPSAyO1xuICAgIGNvbnN0IGFzc2V0SUQ6c3RyaW5nID0gJ2Y5NjY3NTBmNDM4ODY3YzNjOTgyOGRkY2RiZTY2MGUyMWNjZGJiMzZhOTI3Njk1OGYwMTFiYTQ3MmY3NWQ0ZTcnO1xuICAgIGNvbnN0IHRvOnN0cmluZyA9ICdkY0o2ejlkdUxmeVFUZ2JqcTJ3QkNvd2t2Y1BaSFZERic7XG4gICAgY29uc3QgbWludGVyczpBcnJheTxzdHJpbmc+ID0gW1xuICAgICAgJ2RjSjZ6OWR1TGZ5UVRnYmpxMndCQ293a3ZjUFpIVkRGJyxcbiAgICAgICcyZkU2aWlicWZFUno1d2VuWEU2cXl2aW5zeER2RmhIWmsnLFxuICAgICAgJzdpZUFKYmZyR1FicE5aUkFRRXBaQ0MxR3MxejVnejRIVScsXG4gICAgXTtcbiAgICBjb25zdCByZXN1bHQ6UHJvbWlzZTxzdHJpbmc+ID0gYXBpLm1pbnQodXNlcm5hbWUsIHBhc3N3b3JkLCBhbW91bnQsIGFzc2V0SUQsIHRvLCBtaW50ZXJzKTtcbiAgICBjb25zdCBwYXlsb2FkOm9iamVjdCA9IHtcbiAgICAgIHJlc3VsdDoge1xuICAgICAgICB0eElEOiAnc29tZXR4JyxcbiAgICAgIH0sXG4gICAgfTtcbiAgICBjb25zdCByZXNwb25zZU9iaiA9IHtcbiAgICAgIGRhdGE6IHBheWxvYWQsXG4gICAgfTtcblxuICAgIG1vY2tBeGlvcy5tb2NrUmVzcG9uc2UocmVzcG9uc2VPYmopO1xuICAgIGNvbnN0IHJlc3BvbnNlOnN0cmluZyA9IGF3YWl0IHJlc3VsdDtcblxuICAgIGV4cGVjdChtb2NrQXhpb3MucmVxdWVzdCkudG9IYXZlQmVlbkNhbGxlZFRpbWVzKDEpO1xuICAgIGV4cGVjdChyZXNwb25zZSkudG9CZSgnc29tZXR4Jyk7XG4gIH0pO1xuXG4gIHRlc3QoJ21pbnQgMicsIGFzeW5jICgpID0+IHtcbiAgICBjb25zdCB1c2VybmFtZTpzdHJpbmcgPSAnQ29sbGluJztcbiAgICBjb25zdCBwYXNzd29yZDpzdHJpbmcgPSAnQ3VzY2UnO1xuICAgIGNvbnN0IGFtb3VudDpCTiA9IG5ldyBCTigxKTtcbiAgICBjb25zdCBhc3NldElEOkJ1ZmZlciA9IEJ1ZmZlci5mcm9tKCdmOTY2NzUwZjQzODg2N2MzYzk4MjhkZGNkYmU2NjBlMjFjY2RiYjM2YTkyNzY5NThmMDExYmE0NzJmNzVkNGU3JywgJ2hleCcpO1xuICAgIGNvbnN0IHRvOnN0cmluZyA9ICdkY0o2ejlkdUxmeVFUZ2JqcTJ3QkNvd2t2Y1BaSFZERic7XG4gICAgY29uc3QgbWludGVyczpBcnJheTxzdHJpbmc+ID0gW1xuICAgICAgJ2RjSjZ6OWR1TGZ5UVRnYmpxMndCQ293a3ZjUFpIVkRGJyxcbiAgICAgICcyZkU2aWlicWZFUno1d2VuWEU2cXl2aW5zeER2RmhIWmsnLFxuICAgICAgJzdpZUFKYmZyR1FicE5aUkFRRXBaQ0MxR3MxejVnejRIVScsXG4gICAgXTtcbiAgICBjb25zdCByZXN1bHQ6UHJvbWlzZTxzdHJpbmc+ID0gYXBpLm1pbnQodXNlcm5hbWUsIHBhc3N3b3JkLCBhbW91bnQsIGFzc2V0SUQsIHRvLCBtaW50ZXJzKTtcbiAgICBjb25zdCBwYXlsb2FkOm9iamVjdCA9IHtcbiAgICAgIHJlc3VsdDoge1xuICAgICAgICB0eElEOiAnc29tZXR4JyxcbiAgICAgIH0sXG4gICAgfTtcbiAgICBjb25zdCByZXNwb25zZU9iaiA9IHtcbiAgICAgIGRhdGE6IHBheWxvYWQsXG4gICAgfTtcblxuICAgIG1vY2tBeGlvcy5tb2NrUmVzcG9uc2UocmVzcG9uc2VPYmopO1xuICAgIGNvbnN0IHJlc3BvbnNlOnN0cmluZyA9IGF3YWl0IHJlc3VsdDtcblxuICAgIGV4cGVjdChtb2NrQXhpb3MucmVxdWVzdCkudG9IYXZlQmVlbkNhbGxlZFRpbWVzKDEpO1xuICAgIGV4cGVjdChyZXNwb25zZSkudG9CZSgnc29tZXR4Jyk7XG4gIH0pO1xuXG4gIHRlc3QoJ2dldFR4JywgYXN5bmMgKCkgPT4ge1xuICAgIGNvbnN0IHR4aWQ6c3RyaW5nID0gJ2Y5NjY3NTBmNDM4ODY3YzNjOTgyOGRkY2RiZTY2MGUyMWNjZGJiMzZhOTI3Njk1OGYwMTFiYTQ3MmY3NWQ0ZTcnO1xuXG4gICAgY29uc3QgcmVzdWx0OlByb21pc2U8c3RyaW5nPiA9IGFwaS5nZXRUeCh0eGlkKTtcbiAgICBjb25zdCBwYXlsb2FkOm9iamVjdCA9IHtcbiAgICAgIHJlc3VsdDoge1xuICAgICAgICB0eDogJ3NvbWV0eCcsXG4gICAgICB9LFxuICAgIH07XG4gICAgY29uc3QgcmVzcG9uc2VPYmogPSB7XG4gICAgICBkYXRhOiBwYXlsb2FkLFxuICAgIH07XG5cbiAgICBtb2NrQXhpb3MubW9ja1Jlc3BvbnNlKHJlc3BvbnNlT2JqKTtcbiAgICBjb25zdCByZXNwb25zZTpzdHJpbmcgPSBhd2FpdCByZXN1bHQ7XG5cbiAgICBleHBlY3QobW9ja0F4aW9zLnJlcXVlc3QpLnRvSGF2ZUJlZW5DYWxsZWRUaW1lcygxKTtcbiAgICBleHBlY3QocmVzcG9uc2UpLnRvQmUoJ3NvbWV0eCcpO1xuICB9KTtcblxuXG4gIHRlc3QoJ2dldFR4U3RhdHVzJywgYXN5bmMgKCkgPT4ge1xuICAgIGNvbnN0IHR4aWQ6c3RyaW5nID0gJ2Y5NjY3NTBmNDM4ODY3YzNjOTgyOGRkY2RiZTY2MGUyMWNjZGJiMzZhOTI3Njk1OGYwMTFiYTQ3MmY3NWQ0ZTcnO1xuXG4gICAgY29uc3QgcmVzdWx0OlByb21pc2U8c3RyaW5nPiA9IGFwaS5nZXRUeFN0YXR1cyh0eGlkKTtcbiAgICBjb25zdCBwYXlsb2FkOm9iamVjdCA9IHtcbiAgICAgIHJlc3VsdDoge1xuICAgICAgICBzdGF0dXM6ICdhY2NlcHRlZCcsXG4gICAgICB9LFxuICAgIH07XG4gICAgY29uc3QgcmVzcG9uc2VPYmogPSB7XG4gICAgICBkYXRhOiBwYXlsb2FkLFxuICAgIH07XG5cbiAgICBtb2NrQXhpb3MubW9ja1Jlc3BvbnNlKHJlc3BvbnNlT2JqKTtcbiAgICBjb25zdCByZXNwb25zZTpzdHJpbmcgPSBhd2FpdCByZXN1bHQ7XG5cbiAgICBleHBlY3QobW9ja0F4aW9zLnJlcXVlc3QpLnRvSGF2ZUJlZW5DYWxsZWRUaW1lcygxKTtcbiAgICBleHBlY3QocmVzcG9uc2UpLnRvQmUoJ2FjY2VwdGVkJyk7XG4gIH0pO1xuXG4gIHRlc3QoJ2dldEFzc2V0RGVzY3JpcHRpb24gYXMgc3RyaW5nJywgYXN5bmMgKCkgPT4ge1xuICAgIGNvbnN0IGFzc2V0aWQ6QnVmZmVyID0gQnVmZmVyLmZyb20oJzhhNWQyZDMyZTY4YmM1MDAzNmU0ZDA4NjA0NDYxN2ZlNGEwYTAyOTZiMjc0OTk5YmE1NjhlYTkyZGE0NmQ1MzMnLCAnaGV4Jyk7XG4gICAgY29uc3QgYXNzZXRpZHN0cjpzdHJpbmcgPSBiaW50b29scy5jYjU4RW5jb2RlKGFzc2V0aWQpO1xuXG4gICAgY29uc3QgcmVzdWx0OlByb21pc2U8b2JqZWN0PiA9IGFwaS5nZXRBc3NldERlc2NyaXB0aW9uKGFzc2V0aWRzdHIpO1xuICAgIGNvbnN0IHBheWxvYWQ6b2JqZWN0ID0ge1xuICAgICAgcmVzdWx0OiB7XG4gICAgICAgIG5hbWU6ICdDb2xsaW4gQ29pbicsXG4gICAgICAgIHN5bWJvbDogJ0NLQycsXG4gICAgICAgIGFzc2V0SUQ6IGFzc2V0aWRzdHIsXG4gICAgICAgIGRlbm9taW5hdGlvbjogJzEwJyxcbiAgICAgIH0sXG4gICAgfTtcbiAgICBjb25zdCByZXNwb25zZU9iaiA9IHtcbiAgICAgIGRhdGE6IHBheWxvYWQsXG4gICAgfTtcblxuICAgIG1vY2tBeGlvcy5tb2NrUmVzcG9uc2UocmVzcG9uc2VPYmopO1xuICAgIGNvbnN0IHJlc3BvbnNlOmFueSA9IGF3YWl0IHJlc3VsdDtcblxuICAgIGV4cGVjdChtb2NrQXhpb3MucmVxdWVzdCkudG9IYXZlQmVlbkNhbGxlZFRpbWVzKDEpO1xuICAgIGV4cGVjdChyZXNwb25zZS5uYW1lKS50b0JlKCdDb2xsaW4gQ29pbicpO1xuICAgIGV4cGVjdChyZXNwb25zZS5zeW1ib2wpLnRvQmUoJ0NLQycpO1xuICAgIGV4cGVjdChyZXNwb25zZS5hc3NldElELnRvU3RyaW5nKCdoZXgnKSkudG9CZShhc3NldGlkLnRvU3RyaW5nKCdoZXgnKSk7XG4gICAgZXhwZWN0KHJlc3BvbnNlLmRlbm9taW5hdGlvbikudG9CZSgxMCk7XG4gIH0pO1xuXG4gIHRlc3QoJ2dldEFzc2V0RGVzY3JpcHRpb24gYXMgQnVmZmVyJywgYXN5bmMgKCkgPT4ge1xuICAgIGNvbnN0IGFzc2V0aWQ6QnVmZmVyID0gQnVmZmVyLmZyb20oJzhhNWQyZDMyZTY4YmM1MDAzNmU0ZDA4NjA0NDYxN2ZlNGEwYTAyOTZiMjc0OTk5YmE1NjhlYTkyZGE0NmQ1MzMnLCAnaGV4Jyk7XG4gICAgY29uc3QgYXNzZXRpZHN0cjpzdHJpbmcgPSBiaW50b29scy5jYjU4RW5jb2RlKEJ1ZmZlci5mcm9tKCc4YTVkMmQzMmU2OGJjNTAwMzZlNGQwODYwNDQ2MTdmZTRhMGEwMjk2YjI3NDk5OWJhNTY4ZWE5MmRhNDZkNTMzJywgJ2hleCcpKTtcblxuICAgIGNvbnN0IHJlc3VsdDpQcm9taXNlPG9iamVjdD4gPSBhcGkuZ2V0QXNzZXREZXNjcmlwdGlvbihhc3NldGlkKTtcbiAgICBjb25zdCBwYXlsb2FkOm9iamVjdCA9IHtcbiAgICAgIHJlc3VsdDoge1xuICAgICAgICBuYW1lOiAnQ29sbGluIENvaW4nLFxuICAgICAgICBzeW1ib2w6ICdDS0MnLFxuICAgICAgICBhc3NldElEOiBhc3NldGlkc3RyLFxuICAgICAgICBkZW5vbWluYXRpb246ICcxMScsXG4gICAgICB9LFxuICAgIH07XG4gICAgY29uc3QgcmVzcG9uc2VPYmogPSB7XG4gICAgICBkYXRhOiBwYXlsb2FkLFxuICAgIH07XG5cbiAgICBtb2NrQXhpb3MubW9ja1Jlc3BvbnNlKHJlc3BvbnNlT2JqKTtcbiAgICBjb25zdCByZXNwb25zZTphbnkgPSBhd2FpdCByZXN1bHQ7XG5cbiAgICBleHBlY3QobW9ja0F4aW9zLnJlcXVlc3QpLnRvSGF2ZUJlZW5DYWxsZWRUaW1lcygxKTtcbiAgICBleHBlY3QocmVzcG9uc2UubmFtZSkudG9CZSgnQ29sbGluIENvaW4nKTtcbiAgICBleHBlY3QocmVzcG9uc2Uuc3ltYm9sKS50b0JlKCdDS0MnKTtcbiAgICBleHBlY3QocmVzcG9uc2UuYXNzZXRJRC50b1N0cmluZygnaGV4JykpLnRvQmUoYXNzZXRpZC50b1N0cmluZygnaGV4JykpO1xuICAgIGV4cGVjdChyZXNwb25zZS5kZW5vbWluYXRpb24pLnRvQmUoMTEpO1xuICB9KTtcblxuICB0ZXN0KCdnZXRVVFhPcycsIGFzeW5jICgpID0+IHtcbiAgICAvLyBQYXltZW50XG4gICAgY29uc3QgT1BVVFhPc3RyMTpzdHJpbmcgPSBiaW50b29scy5jYjU4RW5jb2RlKEJ1ZmZlci5mcm9tKCcwMDAwMzhkMWI5ZjExMzg2NzJkYTZmYjZjMzUxMjU1MzkyNzZhOWFjYzJhNjY4ZDYzYmVhNmJhM2M3OTVlMmVkYjBmNTAwMDAwMDAxM2UwN2UzOGUyZjIzMTIxYmU4NzU2NDEyYzE4ZGI3MjQ2YTE2ZDI2ZWU5OTM2ZjNjYmEyOGJlMTQ5Y2ZkMzU1ODAwMDAwMDA3MDAwMDAwMDAwMDAwNGRkNTAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMTAwMDAwMDAxYTM2ZmQwYzJkYmNhYjMxMTczMWRkZTdlZjE1MTRiZDI2ZmNkYzc0ZCcsICdoZXgnKSk7XG4gICAgY29uc3QgT1BVVFhPc3RyMjpzdHJpbmcgPSBiaW50b29scy5jYjU4RW5jb2RlKEJ1ZmZlci5mcm9tKCcwMDAwYzNlNDgyMzU3MTU4N2ZlMmJkZmM1MDI2ODlmNWE4MjM4YjlkMGVhN2YzMjc3MTI0ZDE2YWY5ZGUwZDJkOTkxMTAwMDAwMDAwM2UwN2UzOGUyZjIzMTIxYmU4NzU2NDEyYzE4ZGI3MjQ2YTE2ZDI2ZWU5OTM2ZjNjYmEyOGJlMTQ5Y2ZkMzU1ODAwMDAwMDA3MDAwMDAwMDAwMDAwMDAxOTAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMTAwMDAwMDAxZTFiNmI2YTRiYWQ5NGQyZTNmMjA3MzAzNzliOWJjZDZmMTc2MzE4ZScsICdoZXgnKSk7XG4gICAgY29uc3QgT1BVVFhPc3RyMzpzdHJpbmcgPSBiaW50b29scy5jYjU4RW5jb2RlKEJ1ZmZlci5mcm9tKCcwMDAwZjI5ZGJhNjFmZGE4ZDU3YTkxMWU3Zjg4MTBmOTM1YmRlODEwZDNmOGQ0OTU0MDQ2ODViZGI4ZDlkODU0NWU4NjAwMDAwMDAwM2UwN2UzOGUyZjIzMTIxYmU4NzU2NDEyYzE4ZGI3MjQ2YTE2ZDI2ZWU5OTM2ZjNjYmEyOGJlMTQ5Y2ZkMzU1ODAwMDAwMDA3MDAwMDAwMDAwMDAwMDAxOTAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMTAwMDAwMDAxZTFiNmI2YTRiYWQ5NGQyZTNmMjA3MzAzNzliOWJjZDZmMTc2MzE4ZScsICdoZXgnKSk7XG5cbiAgICBjb25zdCBzZXQ6VVRYT1NldCA9IG5ldyBVVFhPU2V0KCk7XG4gICAgc2V0LmFkZChPUFVUWE9zdHIxKTtcbiAgICBzZXQuYWRkQXJyYXkoW09QVVRYT3N0cjIsIE9QVVRYT3N0cjNdKTtcblxuICAgIGNvbnN0IHBlcnNpc3RPcHRzOlBlcnNpc3RhbmNlT3B0aW9ucyA9IG5ldyBQZXJzaXN0YW5jZU9wdGlvbnMoJ3Rlc3QnLCB0cnVlLCAndW5pb24nKTtcbiAgICBleHBlY3QocGVyc2lzdE9wdHMuZ2V0TWVyZ2VSdWxlKCkpLnRvQmUoJ3VuaW9uJyk7XG4gICAgbGV0IGFkZHJlc3NlczpBcnJheTxzdHJpbmc+ID0gc2V0LmdldEFkZHJlc3NlcygpLm1hcCgoYSkgPT4gYXBpLmFkZHJlc3NGcm9tQnVmZmVyKGEpKTtcbiAgICBsZXQgcmVzdWx0OlByb21pc2U8e1xuICAgICAgbnVtRmV0Y2hlZDpudW1iZXIsXG4gICAgICB1dHhvczpVVFhPU2V0LFxuICAgICAgZW5kSW5kZXg6e2FkZHJlc3M6c3RyaW5nLCB1dHhvOnN0cmluZ31cbiAgICB9PiA9IGFwaS5nZXRVVFhPcyhhZGRyZXNzZXMsIGFwaS5nZXRCbG9ja2NoYWluSUQoKSwgMCwgdW5kZWZpbmVkLCBwZXJzaXN0T3B0cyk7XG4gICAgY29uc3QgcGF5bG9hZDpvYmplY3QgPSB7XG4gICAgICByZXN1bHQ6IHtcbiAgICAgICAgbnVtRmV0Y2hlZDozLFxuICAgICAgICB1dHhvczogW09QVVRYT3N0cjEsIE9QVVRYT3N0cjIsIE9QVVRYT3N0cjNdLFxuICAgICAgICBzdG9wSW5kZXg6IHthZGRyZXNzOiBcImFcIiwgdXR4bzogXCJiXCJ9XG4gICAgICB9LFxuICAgIH07XG4gICAgY29uc3QgcmVzcG9uc2VPYmogPSB7XG4gICAgICBkYXRhOiBwYXlsb2FkLFxuICAgIH07XG5cbiAgICBtb2NrQXhpb3MubW9ja1Jlc3BvbnNlKHJlc3BvbnNlT2JqKTtcbiAgICBsZXQgcmVzcG9uc2U6VVRYT1NldCA9IChhd2FpdCByZXN1bHQpLnV0eG9zO1xuXG4gICAgZXhwZWN0KG1vY2tBeGlvcy5yZXF1ZXN0KS50b0hhdmVCZWVuQ2FsbGVkVGltZXMoMSk7XG4gICAgZXhwZWN0KEpTT04uc3RyaW5naWZ5KHJlc3BvbnNlLmdldEFsbFVUWE9TdHJpbmdzKCkuc29ydCgpKSkudG9CZShKU09OLnN0cmluZ2lmeShzZXQuZ2V0QWxsVVRYT1N0cmluZ3MoKS5zb3J0KCkpKTtcblxuICAgIGFkZHJlc3NlcyA9IHNldC5nZXRBZGRyZXNzZXMoKS5tYXAoKGEpID0+IGFwaS5hZGRyZXNzRnJvbUJ1ZmZlcihhKSk7XG4gICAgcmVzdWx0ID0gYXBpLmdldFVUWE9zKGFkZHJlc3NlcywgYXBpLmdldEJsb2NrY2hhaW5JRCgpLCAwLCB1bmRlZmluZWQsIHBlcnNpc3RPcHRzKTtcblxuICAgIG1vY2tBeGlvcy5tb2NrUmVzcG9uc2UocmVzcG9uc2VPYmopO1xuICAgIHJlc3BvbnNlID0gKGF3YWl0IHJlc3VsdCkudXR4b3M7XG5cbiAgICBleHBlY3QobW9ja0F4aW9zLnJlcXVlc3QpLnRvSGF2ZUJlZW5DYWxsZWRUaW1lcygyKTtcbiAgICBleHBlY3QoSlNPTi5zdHJpbmdpZnkocmVzcG9uc2UuZ2V0QWxsVVRYT1N0cmluZ3MoKS5zb3J0KCkpKS50b0JlKEpTT04uc3RyaW5naWZ5KHNldC5nZXRBbGxVVFhPU3RyaW5ncygpLnNvcnQoKSkpO1xuICB9KTtcblxuICBkZXNjcmliZSgnVHJhbnNhY3Rpb25zJywgKCkgPT4ge1xuICAgIGxldCBzZXQ6VVRYT1NldDtcbiAgICBsZXQga2V5bWdyMjpLZXlDaGFpbjtcbiAgICBsZXQga2V5bWdyMzpLZXlDaGFpbjtcbiAgICBsZXQgYWRkcnMxOkFycmF5PHN0cmluZz47XG4gICAgbGV0IGFkZHJzMjpBcnJheTxzdHJpbmc+O1xuICAgIGxldCBhZGRyczM6QXJyYXk8c3RyaW5nPjtcbiAgICBsZXQgYWRkcmVzc2J1ZmZzOkFycmF5PEJ1ZmZlcj4gPSBbXTtcbiAgICBsZXQgYWRkcmVzc2VzOkFycmF5PHN0cmluZz4gPSBbXTtcbiAgICBsZXQgdXR4b3M6QXJyYXk8VVRYTz47XG4gICAgbGV0IGlucHV0czpBcnJheTxUcmFuc2ZlcmFibGVJbnB1dD47XG4gICAgbGV0IG91dHB1dHM6QXJyYXk8VHJhbnNmZXJhYmxlT3V0cHV0PjtcbiAgICBsZXQgb3BzOkFycmF5PFRyYW5zZmVyYWJsZU9wZXJhdGlvbj47XG4gICAgY29uc3QgYW1udDpudW1iZXIgPSAxMDAwMDtcbiAgICBjb25zdCBhc3NldElEOkJ1ZmZlciA9IEJ1ZmZlci5mcm9tKGNyZWF0ZUhhc2goJ3NoYTI1NicpLnVwZGF0ZSgnbWFyeSBoYWQgYSBsaXR0bGUgbGFtYicpLmRpZ2VzdCgpKTtcbiAgICBjb25zdCBORlRhc3NldElEOkJ1ZmZlciA9IEJ1ZmZlci5mcm9tKGNyZWF0ZUhhc2goJ3NoYTI1NicpLnVwZGF0ZShcIkkgY2FuJ3Qgc3RhbmQgaXQsIEkga25vdyB5b3UgcGxhbm5lZCBpdCwgSSdtbWEgc2V0IHN0cmFpZ2h0IHRoaXMgV2F0ZXJnYXRlLidcIikuZGlnZXN0KCkpO1xuICAgIGxldCBzZWNwYmFzZTE6U0VDUFRyYW5zZmVyT3V0cHV0O1xuICAgIGxldCBzZWNwYmFzZTI6U0VDUFRyYW5zZmVyT3V0cHV0O1xuICAgIGxldCBzZWNwYmFzZTM6U0VDUFRyYW5zZmVyT3V0cHV0O1xuICAgIGxldCBpbml0aWFsU3RhdGU6SW5pdGlhbFN0YXRlcztcbiAgICBsZXQgbmZ0cGJhc2UxOk5GVE1pbnRPdXRwdXQ7XG4gICAgbGV0IG5mdHBiYXNlMjpORlRNaW50T3V0cHV0O1xuICAgIGxldCBuZnRwYmFzZTM6TkZUTWludE91dHB1dDtcbiAgICBsZXQgbmZ0SW5pdGlhbFN0YXRlOkluaXRpYWxTdGF0ZXM7XG4gICAgbGV0IG5mdHV0eG9pZHM6QXJyYXk8c3RyaW5nPiA9IFtdO1xuICAgIGxldCBmdW5ndXR4b2lkczpBcnJheTxzdHJpbmc+ID0gW107XG4gICAgbGV0IGF2bTpBVk1BUEk7XG4gICAgY29uc3QgZmVlOm51bWJlciA9IDEwO1xuICAgIGNvbnN0IG5hbWU6c3RyaW5nID0gJ01vcnR5Y29pbiBpcyB0aGUgZHVtYiBhcyBhIHNhY2sgb2YgaGFtbWVycy4nO1xuICAgIGNvbnN0IHN5bWJvbDpzdHJpbmcgPSAnbW9yVCc7XG4gICAgY29uc3QgZGVub21pbmF0aW9uOm51bWJlciA9IDg7XG5cbiAgICBsZXQgc2VjcE1pbnRPdXQxOlNFQ1BNaW50T3V0cHV0O1xuICAgIGxldCBzZWNwTWludE91dDI6U0VDUE1pbnRPdXRwdXQ7XG4gICAgbGV0IHNlY3BNaW50VFhJRDpCdWZmZXI7XG4gICAgbGV0IHNlY3BNaW50VVRYTzpVVFhPO1xuICAgIGxldCBzZWNwTWludFhmZXJPdXQxOlNFQ1BUcmFuc2Zlck91dHB1dDtcbiAgICBsZXQgc2VjcE1pbnRYZmVyT3V0MjpTRUNQVHJhbnNmZXJPdXRwdXQ7XG4gICAgbGV0IHNlY3BNaW50T3A6U0VDUE1pbnRPcGVyYXRpb247XG5cbiAgICBsZXQgeGZlcnNlY3BtaW50b3A6VHJhbnNmZXJhYmxlT3BlcmF0aW9uO1xuXG4gICAgYmVmb3JlRWFjaChhc3luYyAoKSA9PiB7XG4gICAgICBhdm0gPSBuZXcgQVZNQVBJKGF2YWxhbmNoZSwgXCIvZXh0L2JjL1hcIiwgYmxvY2tjaGFpbmlkKTtcbiAgICAgIGNvbnN0IHJlc3VsdDpQcm9taXNlPEJ1ZmZlcj4gPSBhdm0uZ2V0QVZBWEFzc2V0SUQodHJ1ZSk7XG4gICAgICBjb25zdCBwYXlsb2FkOm9iamVjdCA9IHtcbiAgICAgICAgcmVzdWx0OiB7XG4gICAgICAgICAgbmFtZSxcbiAgICAgICAgICBzeW1ib2wsXG4gICAgICAgICAgYXNzZXRJRDogYmludG9vbHMuY2I1OEVuY29kZShhc3NldElEKSxcbiAgICAgICAgICBkZW5vbWluYXRpb246IGAke2Rlbm9taW5hdGlvbn1gLFxuICAgICAgICB9LFxuICAgICAgfTtcbiAgICAgIGNvbnN0IHJlc3BvbnNlT2JqID0ge1xuICAgICAgICBkYXRhOiBwYXlsb2FkLFxuICAgICAgfTtcblxuICAgICAgbW9ja0F4aW9zLm1vY2tSZXNwb25zZShyZXNwb25zZU9iaik7XG4gICAgICBhd2FpdCByZXN1bHQ7XG4gICAgICBzZXQgPSBuZXcgVVRYT1NldCgpO1xuICAgICAgYXZtLm5ld0tleUNoYWluKCk7XG4gICAgICBrZXltZ3IyID0gbmV3IEtleUNoYWluKGF2YWxhbmNoZS5nZXRIUlAoKSwgYWxpYXMpO1xuICAgICAga2V5bWdyMyA9IG5ldyBLZXlDaGFpbihhdmFsYW5jaGUuZ2V0SFJQKCksIGFsaWFzKTtcbiAgICAgIGFkZHJzMSA9IFtdO1xuICAgICAgYWRkcnMyID0gW107XG4gICAgICBhZGRyczMgPSBbXTtcbiAgICAgIHV0eG9zID0gW107XG4gICAgICBpbnB1dHMgPSBbXTtcbiAgICAgIG91dHB1dHMgPSBbXTtcbiAgICAgIG9wcyA9IFtdO1xuICAgICAgbmZ0dXR4b2lkcyA9IFtdO1xuICAgICAgZnVuZ3V0eG9pZHMgPSBbXTtcbiAgICAgIGNvbnN0IHBsb2FkOkJ1ZmZlciA9IEJ1ZmZlci5hbGxvYygxMDI0KTtcbiAgICAgIHBsb2FkLndyaXRlKFwiQWxsIHlvdSBUcmVra2llcyBhbmQgVFYgYWRkaWN0cywgRG9uJ3QgbWVhbiB0byBkaXNzIGRvbid0IG1lYW4gdG8gYnJpbmcgc3RhdGljLlwiLCAwLCAxMDI0LCAndXRmOCcpO1xuXG4gICAgICBmb3IgKGxldCBpOm51bWJlciA9IDA7IGkgPCAzOyBpKyspIHtcbiAgICAgICAgYWRkcnMxLnB1c2goYXZtLmFkZHJlc3NGcm9tQnVmZmVyKGF2bS5rZXlDaGFpbigpLm1ha2VLZXkoKS5nZXRBZGRyZXNzKCkpKTtcbiAgICAgICAgYWRkcnMyLnB1c2goYXZtLmFkZHJlc3NGcm9tQnVmZmVyKGtleW1ncjIubWFrZUtleSgpLmdldEFkZHJlc3MoKSkpO1xuICAgICAgICBhZGRyczMucHVzaChhdm0uYWRkcmVzc0Zyb21CdWZmZXIoa2V5bWdyMy5tYWtlS2V5KCkuZ2V0QWRkcmVzcygpKSk7XG4gICAgICB9XG4gICAgICBjb25zdCBhbW91bnQ6Qk4gPSBPTkVBVkFYLm11bChuZXcgQk4oYW1udCkpO1xuICAgICAgYWRkcmVzc2J1ZmZzID0gYXZtLmtleUNoYWluKCkuZ2V0QWRkcmVzc2VzKCk7XG4gICAgICBhZGRyZXNzZXMgPSBhZGRyZXNzYnVmZnMubWFwKChhKSA9PiBhdm0uYWRkcmVzc0Zyb21CdWZmZXIoYSkpO1xuICAgICAgY29uc3QgbG9ja3RpbWU6Qk4gPSBuZXcgQk4oNTQzMjEpO1xuICAgICAgY29uc3QgdGhyZXNob2xkOm51bWJlciA9IDM7XG4gICAgICBmb3IgKGxldCBpOm51bWJlciA9IDA7IGkgPCA1OyBpKyspIHtcbiAgICAgICAgbGV0IHR4aWQ6QnVmZmVyID0gQnVmZmVyLmZyb20oY3JlYXRlSGFzaCgnc2hhMjU2JykudXBkYXRlKGJpbnRvb2xzLmZyb21CTlRvQnVmZmVyKG5ldyBCTihpKSwgMzIpKS5kaWdlc3QoKSk7XG4gICAgICAgIGxldCB0eGlkeDpCdWZmZXIgPSBCdWZmZXIuYWxsb2MoNCk7XG4gICAgICAgIHR4aWR4LndyaXRlVUludDMyQkUoaSwgMCk7XG4gICAgICAgIFxuICAgICAgICBjb25zdCBvdXQ6U0VDUFRyYW5zZmVyT3V0cHV0ID0gbmV3IFNFQ1BUcmFuc2Zlck91dHB1dChhbW91bnQsIGFkZHJlc3NidWZmcywgbG9ja3RpbWUsIHRocmVzaG9sZCk7XG4gICAgICAgIGNvbnN0IHhmZXJvdXQ6VHJhbnNmZXJhYmxlT3V0cHV0ID0gbmV3IFRyYW5zZmVyYWJsZU91dHB1dChhc3NldElELCBvdXQpO1xuICAgICAgICBvdXRwdXRzLnB1c2goeGZlcm91dCk7XG5cbiAgICAgICAgY29uc3QgdTpVVFhPID0gbmV3IFVUWE8oKTtcbiAgICAgICAgdS5mcm9tQnVmZmVyKEJ1ZmZlci5jb25jYXQoW3UuZ2V0Q29kZWNJREJ1ZmZlcigpLCB0eGlkLCB0eGlkeCwgeGZlcm91dC50b0J1ZmZlcigpXSkpO1xuICAgICAgICBmdW5ndXR4b2lkcy5wdXNoKHUuZ2V0VVRYT0lEKCkpO1xuICAgICAgICB1dHhvcy5wdXNoKHUpO1xuXG4gICAgICAgIHR4aWQgPSB1LmdldFR4SUQoKTtcbiAgICAgICAgdHhpZHggPSB1LmdldE91dHB1dElkeCgpO1xuICAgICAgICBjb25zdCBhc3NldCA9IHUuZ2V0QXNzZXRJRCgpO1xuXG4gICAgICAgIGNvbnN0IGlucHV0OlNFQ1BUcmFuc2ZlcklucHV0ID0gbmV3IFNFQ1BUcmFuc2ZlcklucHV0KGFtb3VudCk7XG4gICAgICAgIGNvbnN0IHhmZXJpbnB1dDpUcmFuc2ZlcmFibGVJbnB1dCA9IG5ldyBUcmFuc2ZlcmFibGVJbnB1dCh0eGlkLCB0eGlkeCwgYXNzZXQsIGlucHV0KTtcbiAgICAgICAgaW5wdXRzLnB1c2goeGZlcmlucHV0KTtcblxuICAgICAgICBjb25zdCBub3V0Ok5GVFRyYW5zZmVyT3V0cHV0ID0gbmV3IE5GVFRyYW5zZmVyT3V0cHV0KDEwMDAgKyBpLCBwbG9hZCwgYWRkcmVzc2J1ZmZzLCBsb2NrdGltZSwgdGhyZXNob2xkKTtcbiAgICAgICAgY29uc3Qgb3A6TkZUVHJhbnNmZXJPcGVyYXRpb24gPSBuZXcgTkZUVHJhbnNmZXJPcGVyYXRpb24obm91dCk7XG4gICAgICAgIGNvbnN0IG5mdHR4aWQ6QnVmZmVyID0gQnVmZmVyLmZyb20oY3JlYXRlSGFzaCgnc2hhMjU2JykudXBkYXRlKGJpbnRvb2xzLmZyb21CTlRvQnVmZmVyKG5ldyBCTigxMDAwICsgaSksIDMyKSkuZGlnZXN0KCkpO1xuICAgICAgICBjb25zdCBuZnR1dHhvOlVUWE8gPSBuZXcgVVRYTyhBVk1Db25zdGFudHMuTEFURVNUQ09ERUMsIG5mdHR4aWQsIDEwMDAgKyBpLCBORlRhc3NldElELCBub3V0KTtcbiAgICAgICAgbmZ0dXR4b2lkcy5wdXNoKG5mdHV0eG8uZ2V0VVRYT0lEKCkpO1xuICAgICAgICBjb25zdCB4ZmVyb3A6VHJhbnNmZXJhYmxlT3BlcmF0aW9uID0gbmV3IFRyYW5zZmVyYWJsZU9wZXJhdGlvbihORlRhc3NldElELCBbbmZ0dXR4by5nZXRVVFhPSUQoKV0sIG9wKTtcbiAgICAgICAgb3BzLnB1c2goeGZlcm9wKTtcbiAgICAgICAgdXR4b3MucHVzaChuZnR1dHhvKTtcbiAgICAgIH1cbiAgICAgIHNldC5hZGRBcnJheSh1dHhvcyk7XG5cbiAgICAgIHNlY3BiYXNlMSA9IG5ldyBTRUNQVHJhbnNmZXJPdXRwdXQobmV3IEJOKDc3NyksIGFkZHJzMy5tYXAoKGEpID0+IGF2bS5wYXJzZUFkZHJlc3MoYSkpLCBVbml4Tm93KCksIDEpO1xuICAgICAgc2VjcGJhc2UyID0gbmV3IFNFQ1BUcmFuc2Zlck91dHB1dChuZXcgQk4oODg4KSwgYWRkcnMyLm1hcCgoYSkgPT4gYXZtLnBhcnNlQWRkcmVzcyhhKSksIFVuaXhOb3coKSwgMSk7XG4gICAgICBzZWNwYmFzZTMgPSBuZXcgU0VDUFRyYW5zZmVyT3V0cHV0KG5ldyBCTig5OTkpLCBhZGRyczIubWFwKChhKSA9PiBhdm0ucGFyc2VBZGRyZXNzKGEpKSwgVW5peE5vdygpLCAxKTtcbiAgICAgIGluaXRpYWxTdGF0ZSA9IG5ldyBJbml0aWFsU3RhdGVzKCk7XG4gICAgICBpbml0aWFsU3RhdGUuYWRkT3V0cHV0KHNlY3BiYXNlMSwgQVZNQ29uc3RhbnRzLlNFQ1BGWElEKTtcbiAgICAgIGluaXRpYWxTdGF0ZS5hZGRPdXRwdXQoc2VjcGJhc2UyLCBBVk1Db25zdGFudHMuU0VDUEZYSUQpO1xuICAgICAgaW5pdGlhbFN0YXRlLmFkZE91dHB1dChzZWNwYmFzZTMsIEFWTUNvbnN0YW50cy5TRUNQRlhJRCk7XG5cbiAgICAgIG5mdHBiYXNlMSA9IG5ldyBORlRNaW50T3V0cHV0KDAsIGFkZHJzMS5tYXAoYSA9PiBhcGkucGFyc2VBZGRyZXNzKGEpKSwgbG9ja3RpbWUsIDEpO1xuICAgICAgbmZ0cGJhc2UyID0gbmV3IE5GVE1pbnRPdXRwdXQoMSwgYWRkcnMyLm1hcChhID0+IGFwaS5wYXJzZUFkZHJlc3MoYSkpLCBsb2NrdGltZSwgMSk7XG4gICAgICBuZnRwYmFzZTMgPSBuZXcgTkZUTWludE91dHB1dCgyLCBhZGRyczMubWFwKGEgPT4gYXBpLnBhcnNlQWRkcmVzcyhhKSksIGxvY2t0aW1lLCAxKTtcbiAgICAgIG5mdEluaXRpYWxTdGF0ZSA9IG5ldyBJbml0aWFsU3RhdGVzKCk7XG4gICAgICBuZnRJbml0aWFsU3RhdGUuYWRkT3V0cHV0KG5mdHBiYXNlMSwgQVZNQ29uc3RhbnRzLk5GVEZYSUQpO1xuICAgICAgbmZ0SW5pdGlhbFN0YXRlLmFkZE91dHB1dChuZnRwYmFzZTIsIEFWTUNvbnN0YW50cy5ORlRGWElEKTtcbiAgICAgIG5mdEluaXRpYWxTdGF0ZS5hZGRPdXRwdXQobmZ0cGJhc2UzLCBBVk1Db25zdGFudHMuTkZURlhJRCk7XG5cbiAgICAgIHNlY3BNaW50T3V0MSA9IG5ldyBTRUNQTWludE91dHB1dChhZGRyZXNzYnVmZnMsIG5ldyBCTigwKSwgMSk7XG4gICAgICBzZWNwTWludE91dDIgPSBuZXcgU0VDUE1pbnRPdXRwdXQoYWRkcmVzc2J1ZmZzLCBuZXcgQk4oMCksIDEpO1xuICAgICAgc2VjcE1pbnRUWElEID0gQnVmZmVyLmZyb20oY3JlYXRlSGFzaCgnc2hhMjU2JykudXBkYXRlKGJpbnRvb2xzLmZyb21CTlRvQnVmZmVyKG5ldyBCTigxMzM3KSwgMzIpKS5kaWdlc3QoKSk7XG4gICAgICBzZWNwTWludFVUWE8gPSBuZXcgVVRYTyhBVk1Db25zdGFudHMuTEFURVNUQ09ERUMsIHNlY3BNaW50VFhJRCwgMCwgYXNzZXRJRCwgc2VjcE1pbnRPdXQxKTtcbiAgICAgIHNlY3BNaW50WGZlck91dDEgPSBuZXcgU0VDUFRyYW5zZmVyT3V0cHV0KG5ldyBCTigxMjMpLCBhZGRyczMubWFwKChhKSA9PiBhdm0ucGFyc2VBZGRyZXNzKGEpKSwgVW5peE5vdygpLCAyKTtcbiAgICAgIHNlY3BNaW50WGZlck91dDIgPSBuZXcgU0VDUFRyYW5zZmVyT3V0cHV0KG5ldyBCTig0NTYpLCBbYXZtLnBhcnNlQWRkcmVzcyhhZGRyczJbMF0pXSwgVW5peE5vdygpLCAxKTtcbiAgICAgIHNlY3BNaW50T3AgPSBuZXcgU0VDUE1pbnRPcGVyYXRpb24oc2VjcE1pbnRPdXQxLCBzZWNwTWludFhmZXJPdXQxKTtcblxuICAgICAgc2V0LmFkZChzZWNwTWludFVUWE8pO1xuXG4gICAgICB4ZmVyc2VjcG1pbnRvcCA9IG5ldyBUcmFuc2ZlcmFibGVPcGVyYXRpb24oYXNzZXRJRCwgW3NlY3BNaW50VVRYTy5nZXRVVFhPSUQoKV0sIHNlY3BNaW50T3ApO1xuXG4gICAgfSk7XG5cbiAgICB0ZXN0KCdzaWduVHgnLCBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCB0eHUxOlVuc2lnbmVkVHggPSBhd2FpdCBhdm0uYnVpbGRCYXNlVHgoc2V0LCBuZXcgQk4oYW1udCksIGJpbnRvb2xzLmNiNThFbmNvZGUoYXNzZXRJRCksIGFkZHJzMywgYWRkcnMxLCBhZGRyczEpO1xuICAgICAgY29uc3QgdHh1MjpVbnNpZ25lZFR4ID0gc2V0LmJ1aWxkQmFzZVR4KFxuICAgICAgICBuZXR3b3JraWQsIGJpbnRvb2xzLmNiNThEZWNvZGUoYmxvY2tjaGFpbmlkKSwgbmV3IEJOKGFtbnQpLCBhc3NldElELFxuICAgICAgICBhZGRyczMubWFwKChhKSA9PiBhdm0ucGFyc2VBZGRyZXNzKGEpKSxcbiAgICAgICAgYWRkcnMxLm1hcCgoYSkgPT4gYXZtLnBhcnNlQWRkcmVzcyhhKSksXG4gICAgICAgIGFkZHJzMS5tYXAoKGEpID0+IGF2bS5wYXJzZUFkZHJlc3MoYSkpLFxuICAgICAgICBhdm0uZ2V0VHhGZWUoKSwgYXNzZXRJRCxcbiAgICAgICAgdW5kZWZpbmVkLCBVbml4Tm93KCksIG5ldyBCTigwKSwgMSxcbiAgICAgICk7XG5cbiAgICAgIGNvbnN0IHR4MTpUeCA9IGF2bS5zaWduVHgodHh1MSk7XG4gICAgICBjb25zdCB0eDI6VHggPSBhdm0uc2lnblR4KHR4dTIpO1xuXG4gICAgICBleHBlY3QodHgyLnRvQnVmZmVyKCkudG9TdHJpbmcoJ2hleCcpKS50b0JlKHR4MS50b0J1ZmZlcigpLnRvU3RyaW5nKCdoZXgnKSk7XG4gICAgICBleHBlY3QodHgyLnRvU3RyaW5nKCkpLnRvQmUodHgxLnRvU3RyaW5nKCkpO1xuICAgIH0pO1xuXG4gICAgdGVzdCgnYnVpbGRCYXNlVHgxJywgYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgdHh1MTpVbnNpZ25lZFR4ID0gYXdhaXQgYXZtLmJ1aWxkQmFzZVR4KHNldCwgbmV3IEJOKGFtbnQpLCBiaW50b29scy5jYjU4RW5jb2RlKGFzc2V0SUQpLCBhZGRyczMsIGFkZHJzMSwgYWRkcnMxLCBuZXcgVVRGOFBheWxvYWQoXCJoZWxsbyB3b3JsZFwiKS5nZXRDb250ZW50KCkpO1xuICAgICAgbGV0IG1lbW9idWY6QnVmZmVyID0gQnVmZmVyLmZyb20oXCJoZWxsbyB3b3JsZFwiKTtcbiAgICAgIGNvbnN0IHR4dTI6VW5zaWduZWRUeCA9IHNldC5idWlsZEJhc2VUeChcbiAgICAgICAgbmV0d29ya2lkLCBiaW50b29scy5jYjU4RGVjb2RlKGJsb2NrY2hhaW5pZCksIG5ldyBCTihhbW50KSwgYXNzZXRJRCxcbiAgICAgICAgYWRkcnMzLm1hcCgoYSkgPT4gYXZtLnBhcnNlQWRkcmVzcyhhKSksXG4gICAgICAgIGFkZHJzMS5tYXAoKGEpID0+IGF2bS5wYXJzZUFkZHJlc3MoYSkpLFxuICAgICAgICBhZGRyczEubWFwKChhKSA9PiBhdm0ucGFyc2VBZGRyZXNzKGEpKSxcbiAgICAgICAgYXZtLmdldFR4RmVlKCksIGFzc2V0SUQsXG4gICAgICAgICBtZW1vYnVmLCBVbml4Tm93KCksIG5ldyBCTigwKSwgMSxcbiAgICAgICk7XG4gICAgICBleHBlY3QodHh1Mi50b0J1ZmZlcigpLnRvU3RyaW5nKCdoZXgnKSkudG9CZSh0eHUxLnRvQnVmZmVyKCkudG9TdHJpbmcoJ2hleCcpKTtcbiAgICAgIGV4cGVjdCh0eHUyLnRvU3RyaW5nKCkpLnRvQmUodHh1MS50b1N0cmluZygpKTtcblxuICAgICAgbGV0IHR4MTpUeCA9IHR4dTEuc2lnbihhdm0ua2V5Q2hhaW4oKSk7XG4gICAgICBsZXQgY2hlY2tUeDpzdHJpbmcgPSB0eDEudG9CdWZmZXIoKS50b1N0cmluZyhcImhleFwiKTtcbiAgICAgIGxldCB0eDFvYmo6b2JqZWN0ID0gdHgxLnNlcmlhbGl6ZShcImhleFwiKTtcbiAgICAgIGxldCB0eDFzdHI6c3RyaW5nID0gSlNPTi5zdHJpbmdpZnkodHgxb2JqKTtcbiAgICAgIFxuICAgICAgLypcbiAgICAgIGNvbnNvbGUubG9nKFwiLS0tLS1UZXN0MSBKU09OLS0tLS1cIik7XG4gICAgICBjb25zb2xlLmxvZyh0eDFzdHIpO1xuICAgICAgY29uc29sZS5sb2coXCItLS0tLVRlc3QxIEVORE4tLS0tLVwiKTtcbiAgICAgICovXG4gICAgICBcbiAgICAgIGxldCB0eDJuZXdvYmo6b2JqZWN0ID0gSlNPTi5wYXJzZSh0eDFzdHIpO1xuICAgICAgbGV0IHR4MjpUeCA9IG5ldyBUeCgpO1xuICAgICAgdHgyLmRlc2VyaWFsaXplKHR4Mm5ld29iaiwgXCJoZXhcIik7XG4gICAgICBcbiAgICAgIC8qXG4gICAgICBsZXQgdHgyb2JqOm9iamVjdCA9IHR4Mi5zZXJpYWxpemUoXCJoZXhcIik7XG4gICAgICBsZXQgdHgyc3RyOnN0cmluZyA9IEpTT04uc3RyaW5naWZ5KHR4Mm9iaik7XG4gICAgICBjb25zb2xlLmxvZyhcIi0tLS0tVGVzdDIgSlNPTi0tLS0tXCIpO1xuICAgICAgY29uc29sZS5sb2codHgyc3RyKTtcbiAgICAgIGNvbnNvbGUubG9nKFwiLS0tLS1UZXN0MiBFTkROLS0tLS1cIik7XG4gICAgICAqL1xuICAgICAgXG4gICAgICBleHBlY3QodHgyLnRvQnVmZmVyKCkudG9TdHJpbmcoXCJoZXhcIikpLnRvQmUoY2hlY2tUeCk7XG5cbiAgICAgIGxldCB0eDM6VHggPSB0eHUxLnNpZ24oYXZtLmtleUNoYWluKCkpO1xuICAgICAgbGV0IHR4M29iajpvYmplY3QgPSB0eDMuc2VyaWFsaXplKFwiZGlzcGxheVwiKTtcbiAgICAgIGxldCB0eDNzdHI6c3RyaW5nID0gSlNPTi5zdHJpbmdpZnkodHgzb2JqKTtcbiAgICAgIFxuICAgICAgLypcbiAgICAgIGNvbnNvbGUubG9nKFwiLS0tLS1UZXN0MyBKU09OLS0tLS1cIik7XG4gICAgICBjb25zb2xlLmxvZyh0eDNzdHIpO1xuICAgICAgY29uc29sZS5sb2coXCItLS0tLVRlc3QzIEVORE4tLS0tLVwiKTtcbiAgICAgICovXG4gICAgICBcbiAgICAgIGxldCB0eDRuZXdvYmo6b2JqZWN0ID0gSlNPTi5wYXJzZSh0eDNzdHIpO1xuICAgICAgbGV0IHR4NDpUeCA9IG5ldyBUeCgpO1xuICAgICAgdHg0LmRlc2VyaWFsaXplKHR4NG5ld29iaiwgXCJkaXNwbGF5XCIpO1xuICAgICAgXG4gICAgICAvKlxuICAgICAgbGV0IHR4NG9iajpvYmplY3QgPSB0eDQuc2VyaWFsaXplKFwiZGlzcGxheVwiKTtcbiAgICAgIGxldCB0eDRzdHI6c3RyaW5nID0gSlNPTi5zdHJpbmdpZnkodHg0b2JqKTtcbiAgICAgIGNvbnNvbGUubG9nKFwiLS0tLS1UZXN0NCBKU09OLS0tLS1cIik7XG4gICAgICBjb25zb2xlLmxvZyh0eDRzdHIpO1xuICAgICAgY29uc29sZS5sb2coXCItLS0tLVRlc3Q0IEVORE4tLS0tLVwiKTtcbiAgICAgICovXG4gICAgICBcbiAgICAgIGV4cGVjdCh0eDQudG9CdWZmZXIoKS50b1N0cmluZyhcImhleFwiKSkudG9CZShjaGVja1R4KTtcbiAgICB9KTtcblxuICAgIHRlc3QoJ2J1aWxkQmFzZVR4MicsIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IHR4dTE6VW5zaWduZWRUeCA9IGF3YWl0IGF2bS5idWlsZEJhc2VUeChcbiAgICAgICAgc2V0LCBuZXcgQk4oYW1udCkuc3ViKG5ldyBCTigxMDApKSwgYmludG9vbHMuY2I1OEVuY29kZShhc3NldElEKSwgXG4gICAgICAgIGFkZHJzMywgYWRkcnMxLCBhZGRyczIsIFxuICAgICAgICBuZXcgVVRGOFBheWxvYWQoXCJoZWxsbyB3b3JsZFwiKSk7XG4gICAgICBjb25zdCB0eHUyOlVuc2lnbmVkVHggPSBzZXQuYnVpbGRCYXNlVHgoXG4gICAgICAgIG5ldHdvcmtpZCwgYmludG9vbHMuY2I1OERlY29kZShibG9ja2NoYWluaWQpLCBuZXcgQk4oYW1udCkuc3ViKG5ldyBCTigxMDApKSwgYXNzZXRJRCxcbiAgICAgICAgYWRkcnMzLm1hcCgoYSkgPT4gYXZtLnBhcnNlQWRkcmVzcyhhKSksXG4gICAgICAgIGFkZHJzMS5tYXAoKGEpID0+IGF2bS5wYXJzZUFkZHJlc3MoYSkpLFxuICAgICAgICBhZGRyczIubWFwKChhKSA9PiBhdm0ucGFyc2VBZGRyZXNzKGEpKSxcbiAgICAgICAgYXZtLmdldFR4RmVlKCksIGFzc2V0SUQsXG4gICAgICAgIG5ldyBVVEY4UGF5bG9hZChcImhlbGxvIHdvcmxkXCIpLmdldFBheWxvYWQoKSwgVW5peE5vdygpLCBuZXcgQk4oMCksIDEsXG4gICAgICApO1xuXG4gICAgICBleHBlY3QodHh1Mi50b0J1ZmZlcigpLnRvU3RyaW5nKCdoZXgnKSkudG9CZSh0eHUxLnRvQnVmZmVyKCkudG9TdHJpbmcoJ2hleCcpKTtcbiAgICAgIGV4cGVjdCh0eHUyLnRvU3RyaW5nKCkpLnRvQmUodHh1MS50b1N0cmluZygpKTtcblxuICAgICAgY29uc3Qgb3V0aWVzID0gdHh1MS5nZXRUcmFuc2FjdGlvbigpLmdldE91dHMoKS5zb3J0KFRyYW5zZmVyYWJsZU91dHB1dC5jb21wYXJhdG9yKCkpIGFzIEFycmF5PFRyYW5zZmVyYWJsZU91dHB1dD47XG5cbiAgICAgIGV4cGVjdChvdXRpZXMubGVuZ3RoKS50b0JlKDIpO1xuICAgICAgY29uc3Qgb3V0YWRkcjAgPSBvdXRpZXNbMF0uZ2V0T3V0cHV0KCkuZ2V0QWRkcmVzc2VzKCkubWFwKChhKSA9PiBhdm0uYWRkcmVzc0Zyb21CdWZmZXIoYSkpO1xuICAgICAgY29uc3Qgb3V0YWRkcjEgPSBvdXRpZXNbMV0uZ2V0T3V0cHV0KCkuZ2V0QWRkcmVzc2VzKCkubWFwKChhKSA9PiBhdm0uYWRkcmVzc0Zyb21CdWZmZXIoYSkpO1xuXG4gICAgICBjb25zdCB0ZXN0YWRkcjIgPSBKU09OLnN0cmluZ2lmeShhZGRyczIuc29ydCgpKTtcbiAgICAgIGNvbnN0IHRlc3RhZGRyMyA9IEpTT04uc3RyaW5naWZ5KGFkZHJzMy5zb3J0KCkpO1xuXG4gICAgICBjb25zdCB0ZXN0b3V0MCA9IEpTT04uc3RyaW5naWZ5KG91dGFkZHIwLnNvcnQoKSk7XG4gICAgICBjb25zdCB0ZXN0b3V0MSA9IEpTT04uc3RyaW5naWZ5KG91dGFkZHIxLnNvcnQoKSk7XG4gICAgICBleHBlY3QoXG4gICAgICAgICh0ZXN0YWRkcjIgPT0gdGVzdG91dDAgJiYgdGVzdGFkZHIzID09IHRlc3RvdXQxKVxuICAgICAgICAgICAgICAgIHx8ICh0ZXN0YWRkcjMgPT0gdGVzdG91dDAgJiYgdGVzdGFkZHIyID09IHRlc3RvdXQxKSxcbiAgICAgICkudG9CZSh0cnVlKTtcblxuICAgICAgbGV0IHR4MTpUeCA9IHR4dTEuc2lnbihhdm0ua2V5Q2hhaW4oKSk7XG4gICAgICBsZXQgY2hlY2tUeDpzdHJpbmcgPSB0eDEudG9CdWZmZXIoKS50b1N0cmluZyhcImhleFwiKTtcbiAgICAgIGxldCB0eDFvYmo6b2JqZWN0ID0gdHgxLnNlcmlhbGl6ZShcImhleFwiKTtcbiAgICAgIGxldCB0eDFzdHI6c3RyaW5nID0gSlNPTi5zdHJpbmdpZnkodHgxb2JqKTtcbiAgICAgIFxuICAgICAgLypcbiAgICAgIGNvbnNvbGUubG9nKFwiLS0tLS1UZXN0MSBKU09OLS0tLS1cIik7XG4gICAgICBjb25zb2xlLmxvZyh0eDFzdHIpO1xuICAgICAgY29uc29sZS5sb2coXCItLS0tLVRlc3QxIEVORE4tLS0tLVwiKTtcbiAgICAgICovXG4gICAgICBcbiAgICAgIGxldCB0eDJuZXdvYmo6b2JqZWN0ID0gSlNPTi5wYXJzZSh0eDFzdHIpO1xuICAgICAgbGV0IHR4MjpUeCA9IG5ldyBUeCgpO1xuICAgICAgdHgyLmRlc2VyaWFsaXplKHR4Mm5ld29iaiwgXCJoZXhcIik7XG4gICAgICBcbiAgICAgIC8qXG4gICAgICBsZXQgdHgyb2JqOm9iamVjdCA9IHR4Mi5zZXJpYWxpemUoXCJoZXhcIik7XG4gICAgICBsZXQgdHgyc3RyOnN0cmluZyA9IEpTT04uc3RyaW5naWZ5KHR4Mm9iaik7XG4gICAgICBjb25zb2xlLmxvZyhcIi0tLS0tVGVzdDIgSlNPTi0tLS0tXCIpO1xuICAgICAgY29uc29sZS5sb2codHgyc3RyKTtcbiAgICAgIGNvbnNvbGUubG9nKFwiLS0tLS1UZXN0MiBFTkROLS0tLS1cIik7XG4gICAgICAqL1xuICAgICAgXG4gICAgICBleHBlY3QodHgyLnRvQnVmZmVyKCkudG9TdHJpbmcoXCJoZXhcIikpLnRvQmUoY2hlY2tUeCk7XG5cbiAgICAgIGxldCB0eDM6VHggPSB0eHUxLnNpZ24oYXZtLmtleUNoYWluKCkpO1xuICAgICAgbGV0IHR4M29iajpvYmplY3QgPSB0eDMuc2VyaWFsaXplKFwiZGlzcGxheVwiKTtcbiAgICAgIGxldCB0eDNzdHI6c3RyaW5nID0gSlNPTi5zdHJpbmdpZnkodHgzb2JqKTtcbiAgICAgIFxuICAgICAgLypcbiAgICAgIGNvbnNvbGUubG9nKFwiLS0tLS1UZXN0MyBKU09OLS0tLS1cIik7XG4gICAgICBjb25zb2xlLmxvZyh0eDNzdHIpO1xuICAgICAgY29uc29sZS5sb2coXCItLS0tLVRlc3QzIEVORE4tLS0tLVwiKTtcbiAgICAgICovXG4gICAgICBcbiAgICAgIGxldCB0eDRuZXdvYmo6b2JqZWN0ID0gSlNPTi5wYXJzZSh0eDNzdHIpO1xuICAgICAgbGV0IHR4NDpUeCA9IG5ldyBUeCgpO1xuICAgICAgdHg0LmRlc2VyaWFsaXplKHR4NG5ld29iaiwgXCJkaXNwbGF5XCIpO1xuICAgICAgXG4gICAgICAvKlxuICAgICAgbGV0IHR4NG9iajpvYmplY3QgPSB0eDQuc2VyaWFsaXplKFwiZGlzcGxheVwiKTtcbiAgICAgIGxldCB0eDRzdHI6c3RyaW5nID0gSlNPTi5zdHJpbmdpZnkodHg0b2JqKTtcbiAgICAgIGNvbnNvbGUubG9nKFwiLS0tLS1UZXN0NCBKU09OLS0tLS1cIik7XG4gICAgICBjb25zb2xlLmxvZyh0eDRzdHIpO1xuICAgICAgY29uc29sZS5sb2coXCItLS0tLVRlc3Q0IEVORE4tLS0tLVwiKTtcbiAgICAgICovXG4gICAgICBcbiAgICAgIGV4cGVjdCh0eDQudG9CdWZmZXIoKS50b1N0cmluZyhcImhleFwiKSkudG9CZShjaGVja1R4KTtcblxuICAgICAgc2VyaWFsemVpdCh0eDEsIFwiQmFzZVR4XCIpO1xuICAgIH0pO1xuXG4gICAgdGVzdCgnaXNzdWVUeCBTZXJpYWxpemVkJywgYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgdHh1OlVuc2lnbmVkVHggPSBhd2FpdCBhdm0uYnVpbGRCYXNlVHgoc2V0LCBuZXcgQk4oYW1udCksIGJpbnRvb2xzLmNiNThFbmNvZGUoYXNzZXRJRCksIGFkZHJzMywgYWRkcnMxLCBhZGRyczEpO1xuICAgICAgY29uc3QgdHggPSBhdm0uc2lnblR4KHR4dSk7XG4gICAgICBjb25zdCB0eGlkOnN0cmluZyA9ICdmOTY2NzUwZjQzODg2N2MzYzk4MjhkZGNkYmU2NjBlMjFjY2RiYjM2YTkyNzY5NThmMDExYmE0NzJmNzVkNGU3JztcblxuICAgICAgY29uc3QgcmVzdWx0OlByb21pc2U8c3RyaW5nPiA9IGF2bS5pc3N1ZVR4KHR4LnRvU3RyaW5nKCkpO1xuICAgICAgY29uc3QgcGF5bG9hZDpvYmplY3QgPSB7XG4gICAgICAgIHJlc3VsdDoge1xuICAgICAgICAgIHR4SUQ6IHR4aWQsXG4gICAgICAgIH0sXG4gICAgICB9O1xuICAgICAgY29uc3QgcmVzcG9uc2VPYmogPSB7XG4gICAgICAgIGRhdGE6IHBheWxvYWQsXG4gICAgICB9O1xuICAgICAgbW9ja0F4aW9zLm1vY2tSZXNwb25zZShyZXNwb25zZU9iaik7XG4gICAgICAgIGxldCByZXNwb25zZTpzdHJpbmcgPSBhd2FpdCByZXN1bHQ7XG5cbiAgICAgICAgZXhwZWN0KHJlc3BvbnNlKS50b0JlKHR4aWQpO1xuICAgICAgfSk7XG5cbiAgICB0ZXN0KCdpc3N1ZVR4IEJ1ZmZlcicsIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IHR4dTpVbnNpZ25lZFR4ID0gYXdhaXQgYXZtLmJ1aWxkQmFzZVR4KHNldCwgbmV3IEJOKGFtbnQpLCBiaW50b29scy5jYjU4RW5jb2RlKGFzc2V0SUQpLCBhZGRyczMsIGFkZHJzMSwgYWRkcnMxKTtcbiAgICAgIGNvbnN0IHR4ID0gYXZtLnNpZ25UeCh0eHUpO1xuXG4gICAgICBjb25zdCB0eGlkOnN0cmluZyA9ICdmOTY2NzUwZjQzODg2N2MzYzk4MjhkZGNkYmU2NjBlMjFjY2RiYjM2YTkyNzY5NThmMDExYmE0NzJmNzVkNGU3JztcbiAgICAgIGNvbnN0IHJlc3VsdDpQcm9taXNlPHN0cmluZz4gPSBhdm0uaXNzdWVUeCh0eC50b0J1ZmZlcigpKTtcbiAgICAgIGNvbnN0IHBheWxvYWQ6b2JqZWN0ID0ge1xuICAgICAgICByZXN1bHQ6IHtcbiAgICAgICAgICB0eElEOiB0eGlkLFxuICAgICAgICB9LFxuICAgICAgfTtcbiAgICAgIGNvbnN0IHJlc3BvbnNlT2JqID0ge1xuICAgICAgICBkYXRhOiBwYXlsb2FkLFxuICAgICAgfTtcblxuICAgICAgbW9ja0F4aW9zLm1vY2tSZXNwb25zZShyZXNwb25zZU9iaik7XG4gICAgICBjb25zdCByZXNwb25zZTpzdHJpbmcgPSBhd2FpdCByZXN1bHQ7XG5cbiAgICAgIGV4cGVjdChyZXNwb25zZSkudG9CZSh0eGlkKTtcbiAgICB9KTtcbiAgICB0ZXN0KCdpc3N1ZVR4IENsYXNzIFR4JywgYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgdHh1OlVuc2lnbmVkVHggPSBhd2FpdCBhdm0uYnVpbGRCYXNlVHgoc2V0LCBuZXcgQk4oYW1udCksIGJpbnRvb2xzLmNiNThFbmNvZGUoYXNzZXRJRCksIGFkZHJzMywgYWRkcnMxLCBhZGRyczEpO1xuICAgICAgY29uc3QgdHggPSBhdm0uc2lnblR4KHR4dSk7XG5cbiAgICAgIGNvbnN0IHR4aWQ6c3RyaW5nID0gJ2Y5NjY3NTBmNDM4ODY3YzNjOTgyOGRkY2RiZTY2MGUyMWNjZGJiMzZhOTI3Njk1OGYwMTFiYTQ3MmY3NWQ0ZTcnO1xuXG4gICAgICBjb25zdCByZXN1bHQ6UHJvbWlzZTxzdHJpbmc+ID0gYXZtLmlzc3VlVHgodHgpO1xuICAgICAgY29uc3QgcGF5bG9hZDpvYmplY3QgPSB7XG4gICAgICAgIHJlc3VsdDoge1xuICAgICAgICAgIHR4SUQ6IHR4aWQsXG4gICAgICAgIH0sXG4gICAgICB9O1xuICAgICAgY29uc3QgcmVzcG9uc2VPYmogPSB7XG4gICAgICAgIGRhdGE6IHBheWxvYWQsXG4gICAgICB9O1xuXG4gICAgICBtb2NrQXhpb3MubW9ja1Jlc3BvbnNlKHJlc3BvbnNlT2JqKTtcbiAgICAgIGNvbnN0IHJlc3BvbnNlOnN0cmluZyA9IGF3YWl0IHJlc3VsdDtcblxuICAgICAgZXhwZWN0KHJlc3BvbnNlKS50b0JlKHR4aWQpO1xuICAgIH0pO1xuXG4gICAgdGVzdCgnYnVpbGRDcmVhdGVBc3NldFR4IC0gRml4ZWQgQ2FwJywgYXN5bmMgKCkgPT4ge1xuICAgICAgYXZtLnNldENyZWF0aW9uVHhGZWUobmV3IEJOKGZlZSkpO1xuICAgICAgY29uc3QgdHh1MTpVbnNpZ25lZFR4ID0gYXdhaXQgYXZtLmJ1aWxkQ3JlYXRlQXNzZXRUeChcbiAgICAgICAgc2V0LCBcbiAgICAgICAgYWRkcnMxLCBcbiAgICAgICAgYWRkcnMyLFxuICAgICAgICBpbml0aWFsU3RhdGUsIFxuICAgICAgICBuYW1lLCBcbiAgICAgICAgc3ltYm9sLCBcbiAgICAgICAgZGVub21pbmF0aW9uXG4gICAgICApO1xuICBcbiAgICAgIGNvbnN0IHR4dTI6VW5zaWduZWRUeCA9IHNldC5idWlsZENyZWF0ZUFzc2V0VHgoXG4gICAgICAgIGF2YWxhbmNoZS5nZXROZXR3b3JrSUQoKSwgXG4gICAgICAgIGJpbnRvb2xzLmNiNThEZWNvZGUoYXZtLmdldEJsb2NrY2hhaW5JRCgpKSwgXG4gICAgICAgIGFkZHJzMS5tYXAoKGEpID0+IGF2bS5wYXJzZUFkZHJlc3MoYSkpLCBcbiAgICAgICAgYWRkcnMyLm1hcCgoYSkgPT4gYXZtLnBhcnNlQWRkcmVzcyhhKSksIFxuICAgICAgICBpbml0aWFsU3RhdGUsIFxuICAgICAgICBuYW1lLCBcbiAgICAgICAgc3ltYm9sLCBcbiAgICAgICAgZGVub21pbmF0aW9uLFxuICAgICAgICB1bmRlZmluZWQsXG4gICAgICAgIGF2bS5nZXRDcmVhdGlvblR4RmVlKCksXG4gICAgICAgIGFzc2V0SURcbiAgICAgICk7XG5cbiAgICAgIGV4cGVjdCh0eHUyLnRvQnVmZmVyKCkudG9TdHJpbmcoJ2hleCcpKS50b0JlKHR4dTEudG9CdWZmZXIoKS50b1N0cmluZygnaGV4JykpO1xuICAgICAgZXhwZWN0KHR4dTIudG9TdHJpbmcoKSkudG9CZSh0eHUxLnRvU3RyaW5nKCkpO1xuXG4gICAgICBsZXQgdHgxOlR4ID0gdHh1MS5zaWduKGF2bS5rZXlDaGFpbigpKTtcbiAgICAgIGxldCBjaGVja1R4OnN0cmluZyA9IHR4MS50b0J1ZmZlcigpLnRvU3RyaW5nKFwiaGV4XCIpO1xuICAgICAgbGV0IHR4MW9iajpvYmplY3QgPSB0eDEuc2VyaWFsaXplKFwiaGV4XCIpO1xuICAgICAgbGV0IHR4MXN0cjpzdHJpbmcgPSBKU09OLnN0cmluZ2lmeSh0eDFvYmopO1xuICAgICAgXG4gICAgICAvKlxuICAgICAgY29uc29sZS5sb2coXCItLS0tLVRlc3QxIEpTT04tLS0tLVwiKTtcbiAgICAgIGNvbnNvbGUubG9nKHR4MXN0cik7XG4gICAgICBjb25zb2xlLmxvZyhcIi0tLS0tVGVzdDEgRU5ETi0tLS0tXCIpO1xuICAgICAgKi9cbiAgICAgIFxuICAgICAgbGV0IHR4Mm5ld29iajpvYmplY3QgPSBKU09OLnBhcnNlKHR4MXN0cik7XG4gICAgICBsZXQgdHgyOlR4ID0gbmV3IFR4KCk7XG4gICAgICB0eDIuZGVzZXJpYWxpemUodHgybmV3b2JqLCBcImhleFwiKTtcbiAgICAgIFxuICAgICAgLypcbiAgICAgIGxldCB0eDJvYmo6b2JqZWN0ID0gdHgyLnNlcmlhbGl6ZShcImhleFwiKTtcbiAgICAgIGxldCB0eDJzdHI6c3RyaW5nID0gSlNPTi5zdHJpbmdpZnkodHgyb2JqKTtcbiAgICAgIGNvbnNvbGUubG9nKFwiLS0tLS1UZXN0MiBKU09OLS0tLS1cIik7XG4gICAgICBjb25zb2xlLmxvZyh0eDJzdHIpO1xuICAgICAgY29uc29sZS5sb2coXCItLS0tLVRlc3QyIEVORE4tLS0tLVwiKTtcbiAgICAgICovXG4gICAgICBcbiAgICAgIGV4cGVjdCh0eDIudG9CdWZmZXIoKS50b1N0cmluZyhcImhleFwiKSkudG9CZShjaGVja1R4KTtcblxuICAgICAgbGV0IHR4MzpUeCA9IHR4dTEuc2lnbihhdm0ua2V5Q2hhaW4oKSk7XG4gICAgICBsZXQgdHgzb2JqOm9iamVjdCA9IHR4My5zZXJpYWxpemUoXCJkaXNwbGF5XCIpO1xuICAgICAgbGV0IHR4M3N0cjpzdHJpbmcgPSBKU09OLnN0cmluZ2lmeSh0eDNvYmopO1xuICAgICAgXG4gICAgICAvKlxuICAgICAgY29uc29sZS5sb2coXCItLS0tLVRlc3QzIEpTT04tLS0tLVwiKTtcbiAgICAgIGNvbnNvbGUubG9nKHR4M3N0cik7XG4gICAgICBjb25zb2xlLmxvZyhcIi0tLS0tVGVzdDMgRU5ETi0tLS0tXCIpO1xuICAgICAgKi9cbiAgICAgIFxuICAgICAgbGV0IHR4NG5ld29iajpvYmplY3QgPSBKU09OLnBhcnNlKHR4M3N0cik7XG4gICAgICBsZXQgdHg0OlR4ID0gbmV3IFR4KCk7XG4gICAgICB0eDQuZGVzZXJpYWxpemUodHg0bmV3b2JqLCBcImRpc3BsYXlcIik7XG4gICAgICBcbiAgICAgIC8qXG4gICAgICBsZXQgdHg0b2JqOm9iamVjdCA9IHR4NC5zZXJpYWxpemUoXCJkaXNwbGF5XCIpO1xuICAgICAgbGV0IHR4NHN0cjpzdHJpbmcgPSBKU09OLnN0cmluZ2lmeSh0eDRvYmopO1xuICAgICAgY29uc29sZS5sb2coXCItLS0tLVRlc3Q0IEpTT04tLS0tLVwiKTtcbiAgICAgIGNvbnNvbGUubG9nKHR4NHN0cik7XG4gICAgICBjb25zb2xlLmxvZyhcIi0tLS0tVGVzdDQgRU5ETi0tLS0tXCIpO1xuICAgICAgKi9cbiAgICAgIFxuICAgICAgZXhwZWN0KHR4NC50b0J1ZmZlcigpLnRvU3RyaW5nKFwiaGV4XCIpKS50b0JlKGNoZWNrVHgpO1xuXG4gICAgICBzZXJpYWx6ZWl0KHR4MSwgXCJDcmVhdGVBc3NldFR4XCIpO1xuICAgIH0pO1xuXG4gICAgdGVzdCgnYnVpbGRDcmVhdGVBc3NldFR4IC0gVmFyaWFibGUgQ2FwJywgYXN5bmMgKCkgPT4ge1xuICAgICAgYXZtLnNldENyZWF0aW9uVHhGZWUobmV3IEJOKERlZmF1bHRzLm5ldHdvcmtbMTIzNDVdLlBbXCJjcmVhdGlvblR4RmVlXCJdKSk7XG4gICAgICBsZXQgbWludE91dHB1dHM6QXJyYXk8U0VDUE1pbnRPdXRwdXQ+ICA9IFtzZWNwTWludE91dDEsIHNlY3BNaW50T3V0Ml07XG4gICAgICBjb25zdCB0eHUxOlVuc2lnbmVkVHggPSBhd2FpdCBhdm0uYnVpbGRDcmVhdGVBc3NldFR4KFxuICAgICAgICBzZXQsIFxuICAgICAgICBhZGRyczEsIFxuICAgICAgICBhZGRyczIsXG4gICAgICAgIGluaXRpYWxTdGF0ZSwgXG4gICAgICAgIG5hbWUsIFxuICAgICAgICBzeW1ib2wsIFxuICAgICAgICBkZW5vbWluYXRpb24sXG4gICAgICAgIG1pbnRPdXRwdXRzXG4gICAgICApO1xuICBcbiAgICAgIGNvbnN0IHR4dTI6VW5zaWduZWRUeCA9IHNldC5idWlsZENyZWF0ZUFzc2V0VHgoXG4gICAgICAgIGF2YWxhbmNoZS5nZXROZXR3b3JrSUQoKSwgXG4gICAgICAgIGJpbnRvb2xzLmNiNThEZWNvZGUoYXZtLmdldEJsb2NrY2hhaW5JRCgpKSwgXG4gICAgICAgIGFkZHJzMS5tYXAoKGEpID0+IGF2bS5wYXJzZUFkZHJlc3MoYSkpLCBcbiAgICAgICAgYWRkcnMyLm1hcCgoYSkgPT4gYXZtLnBhcnNlQWRkcmVzcyhhKSksIFxuICAgICAgICBpbml0aWFsU3RhdGUsIFxuICAgICAgICBuYW1lLCBcbiAgICAgICAgc3ltYm9sLCBcbiAgICAgICAgZGVub21pbmF0aW9uLFxuICAgICAgICBtaW50T3V0cHV0cyxcbiAgICAgICAgYXZtLmdldENyZWF0aW9uVHhGZWUoKSxcbiAgICAgICAgYXNzZXRJRFxuICAgICAgKTtcblxuICAgICAgZXhwZWN0KHR4dTIudG9CdWZmZXIoKS50b1N0cmluZygnaGV4JykpLnRvQmUodHh1MS50b0J1ZmZlcigpLnRvU3RyaW5nKCdoZXgnKSk7XG4gICAgICBleHBlY3QodHh1Mi50b1N0cmluZygpKS50b0JlKHR4dTEudG9TdHJpbmcoKSk7XG5cbiAgICAgIGxldCB0eDE6VHggPSB0eHUxLnNpZ24oYXZtLmtleUNoYWluKCkpO1xuICAgICAgbGV0IGNoZWNrVHg6c3RyaW5nID0gdHgxLnRvQnVmZmVyKCkudG9TdHJpbmcoXCJoZXhcIik7XG4gICAgICBsZXQgdHgxb2JqOm9iamVjdCA9IHR4MS5zZXJpYWxpemUoXCJoZXhcIik7XG4gICAgICBsZXQgdHgxc3RyOnN0cmluZyA9IEpTT04uc3RyaW5naWZ5KHR4MW9iaik7XG4gICAgICBcbiAgICAgIC8qXG4gICAgICBjb25zb2xlLmxvZyhcIi0tLS0tVGVzdDEgSlNPTi0tLS0tXCIpO1xuICAgICAgY29uc29sZS5sb2codHgxc3RyKTtcbiAgICAgIGNvbnNvbGUubG9nKFwiLS0tLS1UZXN0MSBFTkROLS0tLS1cIik7XG4gICAgICAqL1xuICAgICAgXG4gICAgICBsZXQgdHgybmV3b2JqOm9iamVjdCA9IEpTT04ucGFyc2UodHgxc3RyKTtcbiAgICAgIGxldCB0eDI6VHggPSBuZXcgVHgoKTtcbiAgICAgIHR4Mi5kZXNlcmlhbGl6ZSh0eDJuZXdvYmosIFwiaGV4XCIpO1xuICAgICAgXG4gICAgICAvKlxuICAgICAgbGV0IHR4Mm9iajpvYmplY3QgPSB0eDIuc2VyaWFsaXplKFwiaGV4XCIpO1xuICAgICAgbGV0IHR4MnN0cjpzdHJpbmcgPSBKU09OLnN0cmluZ2lmeSh0eDJvYmopO1xuICAgICAgY29uc29sZS5sb2coXCItLS0tLVRlc3QyIEpTT04tLS0tLVwiKTtcbiAgICAgIGNvbnNvbGUubG9nKHR4MnN0cik7XG4gICAgICBjb25zb2xlLmxvZyhcIi0tLS0tVGVzdDIgRU5ETi0tLS0tXCIpO1xuICAgICAgKi9cbiAgICAgIFxuICAgICAgZXhwZWN0KHR4Mi50b0J1ZmZlcigpLnRvU3RyaW5nKFwiaGV4XCIpKS50b0JlKGNoZWNrVHgpO1xuXG4gICAgICBsZXQgdHgzOlR4ID0gdHh1MS5zaWduKGF2bS5rZXlDaGFpbigpKTtcbiAgICAgIGxldCB0eDNvYmo6b2JqZWN0ID0gdHgzLnNlcmlhbGl6ZShcImRpc3BsYXlcIik7XG4gICAgICBsZXQgdHgzc3RyOnN0cmluZyA9IEpTT04uc3RyaW5naWZ5KHR4M29iaik7XG4gICAgICBcbiAgICAgIC8qXG4gICAgICBjb25zb2xlLmxvZyhcIi0tLS0tVGVzdDMgSlNPTi0tLS0tXCIpO1xuICAgICAgY29uc29sZS5sb2codHgzc3RyKTtcbiAgICAgIGNvbnNvbGUubG9nKFwiLS0tLS1UZXN0MyBFTkROLS0tLS1cIik7XG4gICAgICAqL1xuICAgICAgXG4gICAgICBsZXQgdHg0bmV3b2JqOm9iamVjdCA9IEpTT04ucGFyc2UodHgzc3RyKTtcbiAgICAgIGxldCB0eDQ6VHggPSBuZXcgVHgoKTtcbiAgICAgIHR4NC5kZXNlcmlhbGl6ZSh0eDRuZXdvYmosIFwiZGlzcGxheVwiKTtcbiAgICAgIFxuICAgICAgLypcbiAgICAgIGxldCB0eDRvYmo6b2JqZWN0ID0gdHg0LnNlcmlhbGl6ZShcImRpc3BsYXlcIik7XG4gICAgICBsZXQgdHg0c3RyOnN0cmluZyA9IEpTT04uc3RyaW5naWZ5KHR4NG9iaik7XG4gICAgICBjb25zb2xlLmxvZyhcIi0tLS0tVGVzdDQgSlNPTi0tLS0tXCIpO1xuICAgICAgY29uc29sZS5sb2codHg0c3RyKTtcbiAgICAgIGNvbnNvbGUubG9nKFwiLS0tLS1UZXN0NCBFTkROLS0tLS1cIik7XG4gICAgICAqL1xuICAgICAgXG4gICAgICBleHBlY3QodHg0LnRvQnVmZmVyKCkudG9TdHJpbmcoXCJoZXhcIikpLnRvQmUoY2hlY2tUeCk7XG4gICAgfSk7XG5cbiAgICB0ZXN0KCdidWlsZFNFQ1BNaW50VHgnLCBhc3luYyAoKSA9PiB7XG4gICAgICBhdm0uc2V0VHhGZWUobmV3IEJOKGZlZSkpO1xuICAgICAgbGV0IG5ld01pbnRlcjpTRUNQTWludE91dHB1dCA9IG5ldyBTRUNQTWludE91dHB1dChhZGRyczMubWFwKChhKSA9PiBhdm0ucGFyc2VBZGRyZXNzKGEpKSwgbmV3IEJOKDApLCAxKTtcbiAgICAgIGNvbnN0IHR4dTE6VW5zaWduZWRUeCA9IGF3YWl0IGF2bS5idWlsZFNFQ1BNaW50VHgoXG4gICAgICAgIHNldCwgXG4gICAgICAgIG5ld01pbnRlcixcbiAgICAgICAgc2VjcE1pbnRYZmVyT3V0MSxcbiAgICAgICAgYWRkcnMxLFxuICAgICAgICBhZGRyczIsXG4gICAgICAgIHNlY3BNaW50VVRYTy5nZXRVVFhPSUQoKVxuICAgICAgKTtcbiAgXG4gICAgICBjb25zdCB0eHUyOlVuc2lnbmVkVHggPSBzZXQuYnVpbGRTRUNQTWludFR4KFxuICAgICAgICBhdmFsYW5jaGUuZ2V0TmV0d29ya0lEKCksIFxuICAgICAgICBiaW50b29scy5jYjU4RGVjb2RlKGF2bS5nZXRCbG9ja2NoYWluSUQoKSksXG4gICAgICAgIG5ld01pbnRlcixcbiAgICAgICAgc2VjcE1pbnRYZmVyT3V0MSxcbiAgICAgICAgYWRkcnMxLm1hcCgoYSkgPT4gYXZtLnBhcnNlQWRkcmVzcyhhKSksIFxuICAgICAgICBhZGRyczIubWFwKChhKSA9PiBhdm0ucGFyc2VBZGRyZXNzKGEpKSwgXG4gICAgICAgIHNlY3BNaW50VVRYTy5nZXRVVFhPSUQoKSxcbiAgICAgICAgYXZtLmdldFR4RmVlKCksIGFzc2V0SURcbiAgICAgICk7XG5cbiAgICAgIGV4cGVjdCh0eHUyLnRvQnVmZmVyKCkudG9TdHJpbmcoJ2hleCcpKS50b0JlKHR4dTEudG9CdWZmZXIoKS50b1N0cmluZygnaGV4JykpO1xuICAgICAgZXhwZWN0KHR4dTIudG9TdHJpbmcoKSkudG9CZSh0eHUxLnRvU3RyaW5nKCkpO1xuXG4gICAgICBsZXQgdHgxOlR4ID0gdHh1MS5zaWduKGF2bS5rZXlDaGFpbigpKTtcbiAgICAgIGxldCBjaGVja1R4OnN0cmluZyA9IHR4MS50b0J1ZmZlcigpLnRvU3RyaW5nKFwiaGV4XCIpO1xuICAgICAgbGV0IHR4MW9iajpvYmplY3QgPSB0eDEuc2VyaWFsaXplKFwiaGV4XCIpO1xuICAgICAgbGV0IHR4MXN0cjpzdHJpbmcgPSBKU09OLnN0cmluZ2lmeSh0eDFvYmopO1xuICAgICAgXG4gICAgICAvKlxuICAgICAgY29uc29sZS5sb2coXCItLS0tLVRlc3QxIEpTT04tLS0tLVwiKTtcbiAgICAgIGNvbnNvbGUubG9nKHR4MXN0cik7XG4gICAgICBjb25zb2xlLmxvZyhcIi0tLS0tVGVzdDEgRU5ETi0tLS0tXCIpO1xuICAgICAgKi9cbiAgICAgIFxuICAgICAgbGV0IHR4Mm5ld29iajpvYmplY3QgPSBKU09OLnBhcnNlKHR4MXN0cik7XG4gICAgICBsZXQgdHgyOlR4ID0gbmV3IFR4KCk7XG4gICAgICB0eDIuZGVzZXJpYWxpemUodHgybmV3b2JqLCBcImhleFwiKTtcbiAgICAgIFxuICAgICAgLypcbiAgICAgIGxldCB0eDJvYmo6b2JqZWN0ID0gdHgyLnNlcmlhbGl6ZShcImhleFwiKTtcbiAgICAgIGxldCB0eDJzdHI6c3RyaW5nID0gSlNPTi5zdHJpbmdpZnkodHgyb2JqKTtcbiAgICAgIGNvbnNvbGUubG9nKFwiLS0tLS1UZXN0MiBKU09OLS0tLS1cIik7XG4gICAgICBjb25zb2xlLmxvZyh0eDJzdHIpO1xuICAgICAgY29uc29sZS5sb2coXCItLS0tLVRlc3QyIEVORE4tLS0tLVwiKTtcbiAgICAgICovXG4gICAgICBcbiAgICAgIGV4cGVjdCh0eDIudG9CdWZmZXIoKS50b1N0cmluZyhcImhleFwiKSkudG9CZShjaGVja1R4KTtcblxuICAgICAgbGV0IHR4MzpUeCA9IHR4dTEuc2lnbihhdm0ua2V5Q2hhaW4oKSk7XG4gICAgICBsZXQgdHgzb2JqOm9iamVjdCA9IHR4My5zZXJpYWxpemUoXCJkaXNwbGF5XCIpO1xuICAgICAgbGV0IHR4M3N0cjpzdHJpbmcgPSBKU09OLnN0cmluZ2lmeSh0eDNvYmopO1xuICAgICAgXG4gICAgICAvKlxuICAgICAgY29uc29sZS5sb2coXCItLS0tLVRlc3QzIEpTT04tLS0tLVwiKTtcbiAgICAgIGNvbnNvbGUubG9nKHR4M3N0cik7XG4gICAgICBjb25zb2xlLmxvZyhcIi0tLS0tVGVzdDMgRU5ETi0tLS0tXCIpO1xuICAgICAgKi9cbiAgICAgIFxuICAgICAgbGV0IHR4NG5ld29iajpvYmplY3QgPSBKU09OLnBhcnNlKHR4M3N0cik7XG4gICAgICBsZXQgdHg0OlR4ID0gbmV3IFR4KCk7XG4gICAgICB0eDQuZGVzZXJpYWxpemUodHg0bmV3b2JqLCBcImRpc3BsYXlcIik7XG4gICAgICBcbiAgICAgIC8qXG4gICAgICBsZXQgdHg0b2JqOm9iamVjdCA9IHR4NC5zZXJpYWxpemUoXCJkaXNwbGF5XCIpO1xuICAgICAgbGV0IHR4NHN0cjpzdHJpbmcgPSBKU09OLnN0cmluZ2lmeSh0eDRvYmopO1xuICAgICAgY29uc29sZS5sb2coXCItLS0tLVRlc3Q0IEpTT04tLS0tLVwiKTtcbiAgICAgIGNvbnNvbGUubG9nKHR4NHN0cik7XG4gICAgICBjb25zb2xlLmxvZyhcIi0tLS0tVGVzdDQgRU5ETi0tLS0tXCIpO1xuICAgICAgKi9cbiAgICAgIFxuICAgICAgZXhwZWN0KHR4NC50b0J1ZmZlcigpLnRvU3RyaW5nKFwiaGV4XCIpKS50b0JlKGNoZWNrVHgpO1xuXG4gICAgICBzZXJpYWx6ZWl0KHR4MSwgXCJTRUNQTWludFR4XCIpO1xuICAgIH0pO1xuXG4gICAgdGVzdCgnYnVpbGRDcmVhdGVORlRBc3NldFR4JywgYXN5bmMgKCkgPT4ge1xuICAgICAgYXZtLnNldENyZWF0aW9uVHhGZWUobmV3IEJOKERlZmF1bHRzLm5ldHdvcmtbMTIzNDVdLlBbXCJjcmVhdGlvblR4RmVlXCJdKSk7XG4gICAgICBsZXQgbWludGVyU2V0czpBcnJheTxNaW50ZXJTZXQ+ID0gW25ldyBNaW50ZXJTZXQoMSwgYWRkcnMxKV07XG4gICAgICBsZXQgbG9ja3RpbWU6Qk4gPSBuZXcgQk4oMCk7XG5cbiAgICAgIGxldCB0eHUxOlVuc2lnbmVkVHggPSBhd2FpdCBhdm0uYnVpbGRDcmVhdGVORlRBc3NldFR4KFxuICAgICAgICAgIHNldCwgYWRkcnMxLCBhZGRyczIsIG1pbnRlclNldHMsXG4gICAgICAgICAgbmFtZSwgc3ltYm9sLCBuZXcgVVRGOFBheWxvYWQoXCJoZWxsbyB3b3JsZFwiKSwgVW5peE5vdygpLCBsb2NrdGltZVxuICAgICAgKTtcbiAgICAgIFxuICAgICAgbGV0IHR4dTI6VW5zaWduZWRUeCA9IHNldC5idWlsZENyZWF0ZU5GVEFzc2V0VHgoXG4gICAgICAgICAgYXZhbGFuY2hlLmdldE5ldHdvcmtJRCgpLCBiaW50b29scy5jYjU4RGVjb2RlKGF2bS5nZXRCbG9ja2NoYWluSUQoKSksIFxuICAgICAgICAgIGFkZHJzMS5tYXAoYSA9PiBhdm0ucGFyc2VBZGRyZXNzKGEpKSwgYWRkcnMyLm1hcCgoYSkgPT4gYXZtLnBhcnNlQWRkcmVzcyhhKSksIG1pbnRlclNldHMsIFxuICAgICAgICAgIG5hbWUsIHN5bWJvbCwgYXZtLmdldENyZWF0aW9uVHhGZWUoKSwgYXNzZXRJRCwgbmV3IFVURjhQYXlsb2FkKFwiaGVsbG8gd29ybGRcIikuZ2V0UGF5bG9hZCgpLCBVbml4Tm93KCksIGxvY2t0aW1lXG4gICAgICApO1xuXG4gICAgICBleHBlY3QodHh1Mi50b0J1ZmZlcigpLnRvU3RyaW5nKFwiaGV4XCIpKS50b0JlKHR4dTEudG9CdWZmZXIoKS50b1N0cmluZyhcImhleFwiKSk7XG4gICAgICBleHBlY3QodHh1Mi50b1N0cmluZygpKS50b0JlKHR4dTEudG9TdHJpbmcoKSk7XG5cbiAgICAgIGxldCB0eDE6VHggPSB0eHUxLnNpZ24oYXZtLmtleUNoYWluKCkpO1xuICAgICAgbGV0IGNoZWNrVHg6c3RyaW5nID0gdHgxLnRvQnVmZmVyKCkudG9TdHJpbmcoXCJoZXhcIik7XG4gICAgICBsZXQgdHgxb2JqOm9iamVjdCA9IHR4MS5zZXJpYWxpemUoXCJoZXhcIik7XG4gICAgICBsZXQgdHgxc3RyOnN0cmluZyA9IEpTT04uc3RyaW5naWZ5KHR4MW9iaik7XG4gICAgICBcbiAgICAgIC8qXG4gICAgICBjb25zb2xlLmxvZyhcIi0tLS0tVGVzdDEgSlNPTi0tLS0tXCIpO1xuICAgICAgY29uc29sZS5sb2codHgxc3RyKTtcbiAgICAgIGNvbnNvbGUubG9nKFwiLS0tLS1UZXN0MSBFTkROLS0tLS1cIik7XG4gICAgICAqL1xuICAgICAgXG4gICAgICBsZXQgdHgybmV3b2JqOm9iamVjdCA9IEpTT04ucGFyc2UodHgxc3RyKTtcbiAgICAgIGxldCB0eDI6VHggPSBuZXcgVHgoKTtcbiAgICAgIHR4Mi5kZXNlcmlhbGl6ZSh0eDJuZXdvYmosIFwiaGV4XCIpO1xuICAgICAgXG4gICAgICAvKlxuICAgICAgbGV0IHR4Mm9iajpvYmplY3QgPSB0eDIuc2VyaWFsaXplKFwiaGV4XCIpO1xuICAgICAgbGV0IHR4MnN0cjpzdHJpbmcgPSBKU09OLnN0cmluZ2lmeSh0eDJvYmopO1xuICAgICAgY29uc29sZS5sb2coXCItLS0tLVRlc3QyIEpTT04tLS0tLVwiKTtcbiAgICAgIGNvbnNvbGUubG9nKHR4MnN0cik7XG4gICAgICBjb25zb2xlLmxvZyhcIi0tLS0tVGVzdDIgRU5ETi0tLS0tXCIpO1xuICAgICAgKi9cbiAgICAgIFxuICAgICAgZXhwZWN0KHR4Mi50b0J1ZmZlcigpLnRvU3RyaW5nKFwiaGV4XCIpKS50b0JlKGNoZWNrVHgpO1xuXG4gICAgICBsZXQgdHgzOlR4ID0gdHh1MS5zaWduKGF2bS5rZXlDaGFpbigpKTtcbiAgICAgIGxldCB0eDNvYmo6b2JqZWN0ID0gdHgzLnNlcmlhbGl6ZShcImRpc3BsYXlcIik7XG4gICAgICBsZXQgdHgzc3RyOnN0cmluZyA9IEpTT04uc3RyaW5naWZ5KHR4M29iaik7XG4gICAgICBcbiAgICAgIC8qXG4gICAgICBjb25zb2xlLmxvZyhcIi0tLS0tVGVzdDMgSlNPTi0tLS0tXCIpO1xuICAgICAgY29uc29sZS5sb2codHgzc3RyKTtcbiAgICAgIGNvbnNvbGUubG9nKFwiLS0tLS1UZXN0MyBFTkROLS0tLS1cIik7XG4gICAgICAqL1xuICAgICAgXG4gICAgICBsZXQgdHg0bmV3b2JqOm9iamVjdCA9IEpTT04ucGFyc2UodHgzc3RyKTtcbiAgICAgIGxldCB0eDQ6VHggPSBuZXcgVHgoKTtcbiAgICAgIHR4NC5kZXNlcmlhbGl6ZSh0eDRuZXdvYmosIFwiZGlzcGxheVwiKTtcbiAgICAgIFxuICAgICAgLypcbiAgICAgIGxldCB0eDRvYmo6b2JqZWN0ID0gdHg0LnNlcmlhbGl6ZShcImRpc3BsYXlcIik7XG4gICAgICBsZXQgdHg0c3RyOnN0cmluZyA9IEpTT04uc3RyaW5naWZ5KHR4NG9iaik7XG4gICAgICBjb25zb2xlLmxvZyhcIi0tLS0tVGVzdDQgSlNPTi0tLS0tXCIpO1xuICAgICAgY29uc29sZS5sb2codHg0c3RyKTtcbiAgICAgIGNvbnNvbGUubG9nKFwiLS0tLS1UZXN0NCBFTkROLS0tLS1cIik7XG4gICAgICAqL1xuICAgICAgXG4gICAgICBleHBlY3QodHg0LnRvQnVmZmVyKCkudG9TdHJpbmcoXCJoZXhcIikpLnRvQmUoY2hlY2tUeCk7XG5cbiAgICAgIHNlcmlhbHplaXQodHgxLCBcIkNyZWF0ZU5GVEFzc2V0VHhcIik7XG4gICAgfSk7IFxuXG4gICAgdGVzdCgnYnVpbGRDcmVhdGVORlRNaW50VHgnLCBhc3luYyAoKSA9PiB7XG4gICAgICBhdm0uc2V0VHhGZWUobmV3IEJOKGZlZSkpO1xuICAgICAgbGV0IGdyb3VwSUQ6bnVtYmVyID0gMDtcbiAgICAgIGxldCBsb2NrdGltZTpCTiA9IG5ldyBCTigwKTtcbiAgICAgIGxldCB0aHJlc2hvbGQ6bnVtYmVyID0gMTtcbiAgICAgIGxldCBwYXlsb2FkOkJ1ZmZlciA9IEJ1ZmZlci5mcm9tKFwiQXZhbGFuY2hlXCIpO1xuICAgICAgbGV0IGFkZHJidWZmMTogQnVmZmVyW10gPSBhZGRyczEubWFwKGEgPT4gYXZtLnBhcnNlQWRkcmVzcyhhKSk7XG4gICAgICBsZXQgYWRkcmJ1ZmYyOiBCdWZmZXJbXSA9IGFkZHJzMi5tYXAoYSA9PiBhdm0ucGFyc2VBZGRyZXNzKGEpKTtcbiAgICAgIGxldCBhZGRyYnVmZjM6IEJ1ZmZlcltdID0gYWRkcnMzLm1hcChhID0+IGF2bS5wYXJzZUFkZHJlc3MoYSkpO1xuICAgICAgbGV0IG91dHB1dE93bmVyczpBcnJheTxPdXRwdXRPd25lcnM+ID0gW107XG4gICAgICBsZXQgb286T3V0cHV0T3duZXJzID0gbmV3IE91dHB1dE93bmVycyhhZGRyYnVmZjMsIGxvY2t0aW1lLCB0aHJlc2hvbGQpO1xuICAgICAgb3V0cHV0T3duZXJzLnB1c2goKTtcbiAgICAgICBcbiAgICAgIGxldCB0eHUxOlVuc2lnbmVkVHggPSBhd2FpdCBhdm0uYnVpbGRDcmVhdGVORlRNaW50VHgoXG4gICAgICAgICAgc2V0LCBvbywgYWRkcnMxLCBhZGRyczIsIG5mdHV0eG9pZHMsIGdyb3VwSUQsIHBheWxvYWQsIFxuICAgICAgICAgIHVuZGVmaW5lZCwgVW5peE5vdygpXG4gICAgICApO1xuXG4gICAgICBsZXQgdHh1MjpVbnNpZ25lZFR4ID0gc2V0LmJ1aWxkQ3JlYXRlTkZUTWludFR4KFxuICAgICAgICAgIGF2YWxhbmNoZS5nZXROZXR3b3JrSUQoKSwgYmludG9vbHMuY2I1OERlY29kZShhdm0uZ2V0QmxvY2tjaGFpbklEKCkpLCBcbiAgICAgICAgICBbb29dLCBhZGRyYnVmZjEsIGFkZHJidWZmMiwgbmZ0dXR4b2lkcywgZ3JvdXBJRCwgcGF5bG9hZCwgXG4gICAgICAgICAgYXZtLmdldFR4RmVlKCksIGFzc2V0SUQsIHVuZGVmaW5lZCwgVW5peE5vdygpXG4gICAgICApO1xuXG4gICAgICBleHBlY3QodHh1Mi50b0J1ZmZlcigpLnRvU3RyaW5nKFwiaGV4XCIpKS50b0JlKHR4dTEudG9CdWZmZXIoKS50b1N0cmluZyhcImhleFwiKSk7XG4gICAgICBleHBlY3QodHh1Mi50b1N0cmluZygpKS50b0JlKHR4dTEudG9TdHJpbmcoKSk7XG5cbiAgICAgIG91dHB1dE93bmVycy5wdXNoKG9vKTtcbiAgICAgIG91dHB1dE93bmVycy5wdXNoKG5ldyBPdXRwdXRPd25lcnMoYWRkcmJ1ZmYzLCBsb2NrdGltZSwgdGhyZXNob2xkICsgMSkpO1xuXG4gICAgICBsZXQgdHh1MzpVbnNpZ25lZFR4ID0gYXdhaXQgYXZtLmJ1aWxkQ3JlYXRlTkZUTWludFR4KFxuICAgICAgICBzZXQsIG91dHB1dE93bmVycywgYWRkcnMxLCBhZGRyczIsIG5mdHV0eG9pZHMsIGdyb3VwSUQsIHBheWxvYWQsIFxuICAgICAgICB1bmRlZmluZWQsIFVuaXhOb3coKVxuICAgICk7XG5cbiAgICBsZXQgdHh1NDpVbnNpZ25lZFR4ID0gc2V0LmJ1aWxkQ3JlYXRlTkZUTWludFR4KFxuICAgICAgICBhdmFsYW5jaGUuZ2V0TmV0d29ya0lEKCksIGJpbnRvb2xzLmNiNThEZWNvZGUoYXZtLmdldEJsb2NrY2hhaW5JRCgpKSwgXG4gICAgICAgIG91dHB1dE93bmVycywgYWRkcmJ1ZmYxLCBhZGRyYnVmZjIsIG5mdHV0eG9pZHMsIGdyb3VwSUQsIHBheWxvYWQsIFxuICAgICAgICBhdm0uZ2V0VHhGZWUoKSwgYXNzZXRJRCwgdW5kZWZpbmVkLCBVbml4Tm93KClcbiAgICApO1xuXG4gICAgZXhwZWN0KHR4dTQudG9CdWZmZXIoKS50b1N0cmluZyhcImhleFwiKSkudG9CZSh0eHUzLnRvQnVmZmVyKCkudG9TdHJpbmcoXCJoZXhcIikpO1xuICAgIGV4cGVjdCh0eHU0LnRvU3RyaW5nKCkpLnRvQmUodHh1My50b1N0cmluZygpKTtcblxuICAgIGxldCB0eDE6VHggPSB0eHUxLnNpZ24oYXZtLmtleUNoYWluKCkpO1xuICAgIGxldCBjaGVja1R4OnN0cmluZyA9IHR4MS50b0J1ZmZlcigpLnRvU3RyaW5nKFwiaGV4XCIpO1xuICAgIGxldCB0eDFvYmo6b2JqZWN0ID0gdHgxLnNlcmlhbGl6ZShcImhleFwiKTtcbiAgICBsZXQgdHgxc3RyOnN0cmluZyA9IEpTT04uc3RyaW5naWZ5KHR4MW9iaik7XG4gICAgXG4gICAgLypcbiAgICBjb25zb2xlLmxvZyhcIi0tLS0tVGVzdDEgSlNPTi0tLS0tXCIpO1xuICAgIGNvbnNvbGUubG9nKHR4MXN0cik7XG4gICAgY29uc29sZS5sb2coXCItLS0tLVRlc3QxIEVORE4tLS0tLVwiKTtcbiAgICAqL1xuICAgIFxuICAgIGxldCB0eDJuZXdvYmo6b2JqZWN0ID0gSlNPTi5wYXJzZSh0eDFzdHIpO1xuICAgIGxldCB0eDI6VHggPSBuZXcgVHgoKTtcbiAgICB0eDIuZGVzZXJpYWxpemUodHgybmV3b2JqLCBcImhleFwiKTtcbiAgICBcbiAgICAvKlxuICAgIGxldCB0eDJvYmo6b2JqZWN0ID0gdHgyLnNlcmlhbGl6ZShcImhleFwiKTtcbiAgICBsZXQgdHgyc3RyOnN0cmluZyA9IEpTT04uc3RyaW5naWZ5KHR4Mm9iaik7XG4gICAgY29uc29sZS5sb2coXCItLS0tLVRlc3QyIEpTT04tLS0tLVwiKTtcbiAgICBjb25zb2xlLmxvZyh0eDJzdHIpO1xuICAgIGNvbnNvbGUubG9nKFwiLS0tLS1UZXN0MiBFTkROLS0tLS1cIik7XG4gICAgKi9cbiAgICBcbiAgICBleHBlY3QodHgyLnRvQnVmZmVyKCkudG9TdHJpbmcoXCJoZXhcIikpLnRvQmUoY2hlY2tUeCk7XG5cbiAgICBsZXQgdHgzOlR4ID0gdHh1MS5zaWduKGF2bS5rZXlDaGFpbigpKTtcbiAgICBsZXQgdHgzb2JqOm9iamVjdCA9IHR4My5zZXJpYWxpemUoXCJkaXNwbGF5XCIpO1xuICAgIGxldCB0eDNzdHI6c3RyaW5nID0gSlNPTi5zdHJpbmdpZnkodHgzb2JqKTtcbiAgICBcbiAgICAvKlxuICAgIGNvbnNvbGUubG9nKFwiLS0tLS1UZXN0MyBKU09OLS0tLS1cIik7XG4gICAgY29uc29sZS5sb2codHgzc3RyKTtcbiAgICBjb25zb2xlLmxvZyhcIi0tLS0tVGVzdDMgRU5ETi0tLS0tXCIpO1xuICAgICovXG4gICAgXG4gICAgbGV0IHR4NG5ld29iajpvYmplY3QgPSBKU09OLnBhcnNlKHR4M3N0cik7XG4gICAgbGV0IHR4NDpUeCA9IG5ldyBUeCgpO1xuICAgIHR4NC5kZXNlcmlhbGl6ZSh0eDRuZXdvYmosIFwiZGlzcGxheVwiKTtcbiAgICBcbiAgICAvKlxuICAgIGxldCB0eDRvYmo6b2JqZWN0ID0gdHg0LnNlcmlhbGl6ZShcImRpc3BsYXlcIik7XG4gICAgbGV0IHR4NHN0cjpzdHJpbmcgPSBKU09OLnN0cmluZ2lmeSh0eDRvYmopO1xuICAgIGNvbnNvbGUubG9nKFwiLS0tLS1UZXN0NCBKU09OLS0tLS1cIik7XG4gICAgY29uc29sZS5sb2codHg0c3RyKTtcbiAgICBjb25zb2xlLmxvZyhcIi0tLS0tVGVzdDQgRU5ETi0tLS0tXCIpO1xuICAgICovXG4gICAgXG4gICAgZXhwZWN0KHR4NC50b0J1ZmZlcigpLnRvU3RyaW5nKFwiaGV4XCIpKS50b0JlKGNoZWNrVHgpO1xuXG4gICAgc2VyaWFsemVpdCh0eDEsIFwiQ3JlYXRlTkZUTWludFR4XCIpO1xuXG4gIH0pO1xuXG4gICAgdGVzdCgnYnVpbGRORlRUcmFuc2ZlclR4JywgYXN5bmMgKCkgPT4ge1xuICAgICAgYXZtLnNldFR4RmVlKG5ldyBCTihmZWUpKTtcbiAgICAgIGNvbnN0IHBsb2FkOkJ1ZmZlciA9IEJ1ZmZlci5hbGxvYygxMDI0KTtcbiAgICAgIHBsb2FkLndyaXRlKFwiQWxsIHlvdSBUcmVra2llcyBhbmQgVFYgYWRkaWN0cywgRG9uJ3QgbWVhbiB0byBkaXNzIGRvbid0IG1lYW4gdG8gYnJpbmcgc3RhdGljLlwiLCAwLCAxMDI0LCAndXRmOCcpO1xuICAgICAgY29uc3QgYWRkcmJ1ZmYxID0gYWRkcnMxLm1hcCgoYSkgPT4gYXZtLnBhcnNlQWRkcmVzcyhhKSk7XG4gICAgICBjb25zdCBhZGRyYnVmZjIgPSBhZGRyczIubWFwKGEgPT4gYXZtLnBhcnNlQWRkcmVzcyhhKSk7XG4gICAgICBjb25zdCBhZGRyYnVmZjMgPSBhZGRyczMubWFwKChhKSA9PiBhdm0ucGFyc2VBZGRyZXNzKGEpKTtcbiAgICAgIGNvbnN0IHR4dTE6VW5zaWduZWRUeCA9IGF3YWl0IGF2bS5idWlsZE5GVFRyYW5zZmVyVHgoXG4gICAgICAgIHNldCwgYWRkcnMzLCBhZGRyczEsIGFkZHJzMiwgbmZ0dXR4b2lkc1sxXSxcbiAgICAgICAgbmV3IFVURjhQYXlsb2FkKFwiaGVsbG8gd29ybGRcIiksIFVuaXhOb3coKSwgbmV3IEJOKDApLCAxLFxuICAgICAgKTtcblxuICAgICAgY29uc3QgdHh1MjpVbnNpZ25lZFR4ID0gc2V0LmJ1aWxkTkZUVHJhbnNmZXJUeChcbiAgICAgICAgbmV0d29ya2lkLCBiaW50b29scy5jYjU4RGVjb2RlKGJsb2NrY2hhaW5pZCksIGFkZHJidWZmMywgYWRkcmJ1ZmYxLCBhZGRyYnVmZjIsXG4gICAgICAgIFtuZnR1dHhvaWRzWzFdXSwgYXZtLmdldFR4RmVlKCksIGFzc2V0SUQsIG5ldyBVVEY4UGF5bG9hZChcImhlbGxvIHdvcmxkXCIpLmdldFBheWxvYWQoKSwgVW5peE5vdygpLCBuZXcgQk4oMCksIDEsXG4gICAgICApO1xuXG4gICAgICBleHBlY3QodHh1Mi50b0J1ZmZlcigpLnRvU3RyaW5nKCdoZXgnKSkudG9CZSh0eHUxLnRvQnVmZmVyKCkudG9TdHJpbmcoJ2hleCcpKTtcbiAgICAgIGV4cGVjdCh0eHUyLnRvU3RyaW5nKCkpLnRvQmUodHh1MS50b1N0cmluZygpKTtcblxuICAgICAgbGV0IHR4MTpUeCA9IHR4dTEuc2lnbihhdm0ua2V5Q2hhaW4oKSk7XG4gICAgICBsZXQgY2hlY2tUeDpzdHJpbmcgPSB0eDEudG9CdWZmZXIoKS50b1N0cmluZyhcImhleFwiKTtcbiAgICAgIGxldCB0eDFvYmo6b2JqZWN0ID0gdHgxLnNlcmlhbGl6ZShcImhleFwiKTtcbiAgICAgIGxldCB0eDFzdHI6c3RyaW5nID0gSlNPTi5zdHJpbmdpZnkodHgxb2JqKTtcbiAgICAgIFxuICAgICAgLypcbiAgICAgIGNvbnNvbGUubG9nKFwiLS0tLS1UZXN0MSBKU09OLS0tLS1cIik7XG4gICAgICBjb25zb2xlLmxvZyh0eDFzdHIpO1xuICAgICAgY29uc29sZS5sb2coXCItLS0tLVRlc3QxIEVORE4tLS0tLVwiKTtcbiAgICAgICovXG4gICAgICBcbiAgICAgIGxldCB0eDJuZXdvYmo6b2JqZWN0ID0gSlNPTi5wYXJzZSh0eDFzdHIpO1xuICAgICAgbGV0IHR4MjpUeCA9IG5ldyBUeCgpO1xuICAgICAgdHgyLmRlc2VyaWFsaXplKHR4Mm5ld29iaiwgXCJoZXhcIik7XG4gICAgICBcbiAgICAgIC8qXG4gICAgICBsZXQgdHgyb2JqOm9iamVjdCA9IHR4Mi5zZXJpYWxpemUoXCJoZXhcIik7XG4gICAgICBsZXQgdHgyc3RyOnN0cmluZyA9IEpTT04uc3RyaW5naWZ5KHR4Mm9iaik7XG4gICAgICBjb25zb2xlLmxvZyhcIi0tLS0tVGVzdDIgSlNPTi0tLS0tXCIpO1xuICAgICAgY29uc29sZS5sb2codHgyc3RyKTtcbiAgICAgIGNvbnNvbGUubG9nKFwiLS0tLS1UZXN0MiBFTkROLS0tLS1cIik7XG4gICAgICAqL1xuICAgICAgXG4gICAgICBleHBlY3QodHgyLnRvQnVmZmVyKCkudG9TdHJpbmcoXCJoZXhcIikpLnRvQmUoY2hlY2tUeCk7XG4gIFxuICAgICAgbGV0IHR4MzpUeCA9IHR4dTEuc2lnbihhdm0ua2V5Q2hhaW4oKSk7XG4gICAgICBsZXQgdHgzb2JqOm9iamVjdCA9IHR4My5zZXJpYWxpemUoXCJkaXNwbGF5XCIpO1xuICAgICAgbGV0IHR4M3N0cjpzdHJpbmcgPSBKU09OLnN0cmluZ2lmeSh0eDNvYmopO1xuICAgICAgXG4gICAgICAvKlxuICAgICAgY29uc29sZS5sb2coXCItLS0tLVRlc3QzIEpTT04tLS0tLVwiKTtcbiAgICAgIGNvbnNvbGUubG9nKHR4M3N0cik7XG4gICAgICBjb25zb2xlLmxvZyhcIi0tLS0tVGVzdDMgRU5ETi0tLS0tXCIpO1xuICAgICAgKi9cbiAgICAgIFxuICAgICAgbGV0IHR4NG5ld29iajpvYmplY3QgPSBKU09OLnBhcnNlKHR4M3N0cik7XG4gICAgICBsZXQgdHg0OlR4ID0gbmV3IFR4KCk7XG4gICAgICB0eDQuZGVzZXJpYWxpemUodHg0bmV3b2JqLCBcImRpc3BsYXlcIik7XG4gICAgICBcbiAgICAgIC8qXG4gICAgICBsZXQgdHg0b2JqOm9iamVjdCA9IHR4NC5zZXJpYWxpemUoXCJkaXNwbGF5XCIpO1xuICAgICAgbGV0IHR4NHN0cjpzdHJpbmcgPSBKU09OLnN0cmluZ2lmeSh0eDRvYmopO1xuICAgICAgY29uc29sZS5sb2coXCItLS0tLVRlc3Q0IEpTT04tLS0tLVwiKTtcbiAgICAgIGNvbnNvbGUubG9nKHR4NHN0cik7XG4gICAgICBjb25zb2xlLmxvZyhcIi0tLS0tVGVzdDQgRU5ETi0tLS0tXCIpO1xuICAgICAgKi9cbiAgICAgIFxuICAgICAgZXhwZWN0KHR4NC50b0J1ZmZlcigpLnRvU3RyaW5nKFwiaGV4XCIpKS50b0JlKGNoZWNrVHgpO1xuXG4gICAgICBzZXJpYWx6ZWl0KHR4MSwgXCJORlRUcmFuc2ZlclR4XCIpO1xuXG4gICAgfSk7XG5cbiAgICB0ZXN0KCdidWlsZEltcG9ydFR4JywgYXN5bmMgKCkgPT4ge1xuICAgICAgbGV0IGxvY2t0aW1lOkJOID0gbmV3IEJOKDApO1xuICAgICAgbGV0IHRocmVzaG9sZDpudW1iZXIgPSAxO1xuICAgICAgYXZtLnNldFR4RmVlKG5ldyBCTihmZWUpKTtcbiAgICAgIGNvbnN0IGFkZHJidWZmMSA9IGFkZHJzMS5tYXAoKGEpID0+IGF2bS5wYXJzZUFkZHJlc3MoYSkpO1xuICAgICAgY29uc3QgYWRkcmJ1ZmYyID0gYWRkcnMyLm1hcCgoYSkgPT4gYXZtLnBhcnNlQWRkcmVzcyhhKSk7XG4gICAgICBjb25zdCBhZGRyYnVmZjMgPSBhZGRyczMubWFwKChhKSA9PiBhdm0ucGFyc2VBZGRyZXNzKGEpKTtcbiAgICAgIGNvbnN0IGZ1bmd1dHhvOlVUWE8gPSBzZXQuZ2V0VVRYTyhmdW5ndXR4b2lkc1sxXSk7XG4gICAgICBjb25zdCBmdW5ndXR4b3N0cjpzdHJpbmcgPSBmdW5ndXR4by50b1N0cmluZygpO1xuICAgICAgXG4gICAgICBjb25zdCByZXN1bHQ6UHJvbWlzZTxVbnNpZ25lZFR4PiA9IGF2bS5idWlsZEltcG9ydFR4KFxuICAgICAgICBzZXQsIGFkZHJzMSwgUGxhdGZvcm1DaGFpbklELCBhZGRyczMsIGFkZHJzMSwgYWRkcnMyLCBuZXcgVVRGOFBheWxvYWQoXCJoZWxsbyB3b3JsZFwiKSwgVW5peE5vdygpLCBsb2NrdGltZSwgdGhyZXNob2xkXG4gICAgICApO1xuICAgICAgY29uc3QgcGF5bG9hZDpvYmplY3QgPSB7XG4gICAgICAgIHJlc3VsdDoge1xuICAgICAgICAgIHV0eG9zOltmdW5ndXR4b3N0cl1cbiAgICAgICAgfSxcbiAgICAgIH07XG4gICAgICBjb25zdCByZXNwb25zZU9iaiA9IHtcbiAgICAgICAgZGF0YTogcGF5bG9hZCxcbiAgICAgIH07XG5cbiAgICAgIG1vY2tBeGlvcy5tb2NrUmVzcG9uc2UocmVzcG9uc2VPYmopO1xuICAgICAgY29uc3QgdHh1MTpVbnNpZ25lZFR4ID0gYXdhaXQgcmVzdWx0O1xuXG4gICAgICBjb25zdCB0eHUyOlVuc2lnbmVkVHggPSBzZXQuYnVpbGRJbXBvcnRUeChcbiAgICAgICAgbmV0d29ya2lkLCBiaW50b29scy5jYjU4RGVjb2RlKGJsb2NrY2hhaW5pZCksIFxuICAgICAgICBhZGRyYnVmZjMsIGFkZHJidWZmMSwgYWRkcmJ1ZmYyLCBbZnVuZ3V0eG9dLCBiaW50b29scy5jYjU4RGVjb2RlKFBsYXRmb3JtQ2hhaW5JRCksIGF2bS5nZXRUeEZlZSgpLCBhd2FpdCBhdm0uZ2V0QVZBWEFzc2V0SUQoKSwgXG4gICAgICAgIG5ldyBVVEY4UGF5bG9hZChcImhlbGxvIHdvcmxkXCIpLmdldFBheWxvYWQoKSwgVW5peE5vdygpLCBsb2NrdGltZSwgdGhyZXNob2xkXG4gICAgICApO1xuXG4gICAgICBleHBlY3QodHh1Mi50b0J1ZmZlcigpLnRvU3RyaW5nKCdoZXgnKSkudG9CZSh0eHUxLnRvQnVmZmVyKCkudG9TdHJpbmcoJ2hleCcpKTtcbiAgICAgIGV4cGVjdCh0eHUyLnRvU3RyaW5nKCkpLnRvQmUodHh1MS50b1N0cmluZygpKTtcblxuICAgICAgbGV0IHR4MTpUeCA9IHR4dTEuc2lnbihhdm0ua2V5Q2hhaW4oKSk7XG4gICAgICBsZXQgY2hlY2tUeDpzdHJpbmcgPSB0eDEudG9CdWZmZXIoKS50b1N0cmluZyhcImhleFwiKTtcbiAgICAgIGxldCB0eDFvYmo6b2JqZWN0ID0gdHgxLnNlcmlhbGl6ZShcImhleFwiKTtcbiAgICAgIGxldCB0eDFzdHI6c3RyaW5nID0gSlNPTi5zdHJpbmdpZnkodHgxb2JqKTtcbiAgICAgIFxuICAgICAgLypcbiAgICAgIGNvbnNvbGUubG9nKFwiLS0tLS1UZXN0MSBKU09OLS0tLS1cIik7XG4gICAgICBjb25zb2xlLmxvZyh0eDFzdHIpO1xuICAgICAgY29uc29sZS5sb2coXCItLS0tLVRlc3QxIEVORE4tLS0tLVwiKTtcbiAgICAgICovXG4gICAgICBcbiAgICAgIGxldCB0eDJuZXdvYmo6b2JqZWN0ID0gSlNPTi5wYXJzZSh0eDFzdHIpO1xuICAgICAgbGV0IHR4MjpUeCA9IG5ldyBUeCgpO1xuICAgICAgdHgyLmRlc2VyaWFsaXplKHR4Mm5ld29iaiwgXCJoZXhcIik7XG4gICAgICBcbiAgICAgIC8qXG4gICAgICBsZXQgdHgyb2JqOm9iamVjdCA9IHR4Mi5zZXJpYWxpemUoXCJoZXhcIik7XG4gICAgICBsZXQgdHgyc3RyOnN0cmluZyA9IEpTT04uc3RyaW5naWZ5KHR4Mm9iaik7XG4gICAgICBjb25zb2xlLmxvZyhcIi0tLS0tVGVzdDIgSlNPTi0tLS0tXCIpO1xuICAgICAgY29uc29sZS5sb2codHgyc3RyKTtcbiAgICAgIGNvbnNvbGUubG9nKFwiLS0tLS1UZXN0MiBFTkROLS0tLS1cIik7XG4gICAgICAqL1xuICAgICAgXG4gICAgICBleHBlY3QodHgyLnRvQnVmZmVyKCkudG9TdHJpbmcoXCJoZXhcIikpLnRvQmUoY2hlY2tUeCk7XG4gIFxuICAgICAgbGV0IHR4MzpUeCA9IHR4dTEuc2lnbihhdm0ua2V5Q2hhaW4oKSk7XG4gICAgICBsZXQgdHgzb2JqOm9iamVjdCA9IHR4My5zZXJpYWxpemUoXCJkaXNwbGF5XCIpO1xuICAgICAgbGV0IHR4M3N0cjpzdHJpbmcgPSBKU09OLnN0cmluZ2lmeSh0eDNvYmopO1xuICAgICAgXG4gICAgICAvKlxuICAgICAgY29uc29sZS5sb2coXCItLS0tLVRlc3QzIEpTT04tLS0tLVwiKTtcbiAgICAgIGNvbnNvbGUubG9nKHR4M3N0cik7XG4gICAgICBjb25zb2xlLmxvZyhcIi0tLS0tVGVzdDMgRU5ETi0tLS0tXCIpO1xuICAgICAgKi9cbiAgICAgIFxuICAgICAgbGV0IHR4NG5ld29iajpvYmplY3QgPSBKU09OLnBhcnNlKHR4M3N0cik7XG4gICAgICBsZXQgdHg0OlR4ID0gbmV3IFR4KCk7XG4gICAgICB0eDQuZGVzZXJpYWxpemUodHg0bmV3b2JqLCBcImRpc3BsYXlcIik7XG4gICAgICBcbiAgICAgIC8qXG4gICAgICBsZXQgdHg0b2JqOm9iamVjdCA9IHR4NC5zZXJpYWxpemUoXCJkaXNwbGF5XCIpO1xuICAgICAgbGV0IHR4NHN0cjpzdHJpbmcgPSBKU09OLnN0cmluZ2lmeSh0eDRvYmopO1xuICAgICAgY29uc29sZS5sb2coXCItLS0tLVRlc3Q0IEpTT04tLS0tLVwiKTtcbiAgICAgIGNvbnNvbGUubG9nKHR4NHN0cik7XG4gICAgICBjb25zb2xlLmxvZyhcIi0tLS0tVGVzdDQgRU5ETi0tLS0tXCIpO1xuICAgICAgKi9cbiAgICAgIFxuICAgICAgZXhwZWN0KHR4NC50b0J1ZmZlcigpLnRvU3RyaW5nKFwiaGV4XCIpKS50b0JlKGNoZWNrVHgpO1xuXG4gICAgICBzZXJpYWx6ZWl0KHR4MSwgXCJJbXBvcnRUeFwiKTtcbiAgICB9KTtcblxuICAgIHRlc3QoJ2J1aWxkRXhwb3J0VHgnLCBhc3luYyAoKSA9PiB7XG4gICAgICBhdm0uc2V0VHhGZWUobmV3IEJOKGZlZSkpO1xuICAgICAgY29uc3QgYWRkcmJ1ZmYxID0gYWRkcnMxLm1hcCgoYSkgPT4gYXZtLnBhcnNlQWRkcmVzcyhhKSk7XG4gICAgICBjb25zdCBhZGRyYnVmZjIgPSBhZGRyczIubWFwKChhKSA9PiBhdm0ucGFyc2VBZGRyZXNzKGEpKTtcbiAgICAgIGNvbnN0IGFkZHJidWZmMyA9IGFkZHJzMy5tYXAoKGEpID0+IGF2bS5wYXJzZUFkZHJlc3MoYSkpO1xuICAgICAgY29uc3QgYW1vdW50OkJOID0gbmV3IEJOKDkwKTtcbiAgICAgIGNvbnN0IHR4dTE6VW5zaWduZWRUeCA9IGF3YWl0IGF2bS5idWlsZEV4cG9ydFR4KFxuICAgICAgICBzZXQsIFxuICAgICAgICBhbW91bnQsIFxuICAgICAgICBiaW50b29scy5jYjU4RGVjb2RlKFBsYXRmb3JtQ2hhaW5JRCksXG4gICAgICAgIGFkZHJidWZmMy5tYXAoKGEpID0+IGJpbnRvb2xzLmFkZHJlc3NUb1N0cmluZyhhdmFsYW5jaGUuZ2V0SFJQKCksIFwiUFwiLCBhKSksIFxuICAgICAgICBhZGRyczEsIFxuICAgICAgICBhZGRyczIsXG4gICAgICAgIG5ldyBVVEY4UGF5bG9hZChcImhlbGxvIHdvcmxkXCIpLCBVbml4Tm93KClcbiAgICAgICk7XG5cbiAgICAgIGNvbnN0IHR4dTI6VW5zaWduZWRUeCA9IHNldC5idWlsZEV4cG9ydFR4KFxuICAgICAgICBuZXR3b3JraWQsIGJpbnRvb2xzLmNiNThEZWNvZGUoYmxvY2tjaGFpbmlkKSxcbiAgICAgICAgYW1vdW50LFxuICAgICAgICBhc3NldElELCBcbiAgICAgICAgYWRkcmJ1ZmYzLCBcbiAgICAgICAgYWRkcmJ1ZmYxLCBcbiAgICAgICAgYWRkcmJ1ZmYyLCBcbiAgICAgICAgYmludG9vbHMuY2I1OERlY29kZShQbGF0Zm9ybUNoYWluSUQpLCBcbiAgICAgICAgYXZtLmdldFR4RmVlKCksIFxuICAgICAgICBhc3NldElELFxuICAgICAgICBuZXcgVVRGOFBheWxvYWQoXCJoZWxsbyB3b3JsZFwiKS5nZXRQYXlsb2FkKCksIFVuaXhOb3coKVxuICAgICAgKTtcblxuICAgICAgZXhwZWN0KHR4dTIudG9CdWZmZXIoKS50b1N0cmluZygnaGV4JykpLnRvQmUodHh1MS50b0J1ZmZlcigpLnRvU3RyaW5nKCdoZXgnKSk7XG4gICAgICBleHBlY3QodHh1Mi50b1N0cmluZygpKS50b0JlKHR4dTEudG9TdHJpbmcoKSk7XG5cbiAgICAgIGNvbnN0IHR4dTM6VW5zaWduZWRUeCA9IGF3YWl0IGF2bS5idWlsZEV4cG9ydFR4KFxuICAgICAgICBzZXQsIGFtb3VudCwgUGxhdGZvcm1DaGFpbklELCBcbiAgICAgICAgYWRkcnMzLCBhZGRyczEsIGFkZHJzMiwgXG4gICAgICAgIG5ldyBVVEY4UGF5bG9hZChcImhlbGxvIHdvcmxkXCIpLCBVbml4Tm93KClcbiAgICAgICk7XG5cbiAgICAgIGNvbnN0IHR4dTQ6VW5zaWduZWRUeCA9IHNldC5idWlsZEV4cG9ydFR4KFxuICAgICAgICBuZXR3b3JraWQsIGJpbnRvb2xzLmNiNThEZWNvZGUoYmxvY2tjaGFpbmlkKSwgYW1vdW50LFxuICAgICAgICBhc3NldElELCBhZGRyYnVmZjMsIGFkZHJidWZmMSwgYWRkcmJ1ZmYyLCB1bmRlZmluZWQsIGF2bS5nZXRUeEZlZSgpLCBhc3NldElELCBcbiAgICAgICAgbmV3IFVURjhQYXlsb2FkKFwiaGVsbG8gd29ybGRcIikuZ2V0UGF5bG9hZCgpLCBVbml4Tm93KClcbiAgICAgICk7XG5cbiAgICAgIGV4cGVjdCh0eHU0LnRvQnVmZmVyKCkudG9TdHJpbmcoJ2hleCcpKS50b0JlKHR4dTMudG9CdWZmZXIoKS50b1N0cmluZygnaGV4JykpO1xuICAgICAgZXhwZWN0KHR4dTQudG9TdHJpbmcoKSkudG9CZSh0eHUzLnRvU3RyaW5nKCkpO1xuXG4gICAgICAgICAgICBsZXQgdHgxOlR4ID0gdHh1MS5zaWduKGF2bS5rZXlDaGFpbigpKTtcbiAgICAgIGxldCBjaGVja1R4OnN0cmluZyA9IHR4MS50b0J1ZmZlcigpLnRvU3RyaW5nKFwiaGV4XCIpO1xuICAgICAgbGV0IHR4MW9iajpvYmplY3QgPSB0eDEuc2VyaWFsaXplKFwiaGV4XCIpO1xuICAgICAgbGV0IHR4MXN0cjpzdHJpbmcgPSBKU09OLnN0cmluZ2lmeSh0eDFvYmopO1xuICAgICAgXG4gICAgICAvKlxuICAgICAgY29uc29sZS5sb2coXCItLS0tLVRlc3QxIEpTT04tLS0tLVwiKTtcbiAgICAgIGNvbnNvbGUubG9nKHR4MXN0cik7XG4gICAgICBjb25zb2xlLmxvZyhcIi0tLS0tVGVzdDEgRU5ETi0tLS0tXCIpO1xuICAgICAgKi9cbiAgICAgIFxuICAgICAgbGV0IHR4Mm5ld29iajpvYmplY3QgPSBKU09OLnBhcnNlKHR4MXN0cik7XG4gICAgICBsZXQgdHgyOlR4ID0gbmV3IFR4KCk7XG4gICAgICB0eDIuZGVzZXJpYWxpemUodHgybmV3b2JqLCBcImhleFwiKTtcbiAgICAgIFxuICAgICAgLypcbiAgICAgIGxldCB0eDJvYmo6b2JqZWN0ID0gdHgyLnNlcmlhbGl6ZShcImhleFwiKTtcbiAgICAgIGxldCB0eDJzdHI6c3RyaW5nID0gSlNPTi5zdHJpbmdpZnkodHgyb2JqKTtcbiAgICAgIGNvbnNvbGUubG9nKFwiLS0tLS1UZXN0MiBKU09OLS0tLS1cIik7XG4gICAgICBjb25zb2xlLmxvZyh0eDJzdHIpO1xuICAgICAgY29uc29sZS5sb2coXCItLS0tLVRlc3QyIEVORE4tLS0tLVwiKTtcbiAgICAgICovXG4gICAgICBcbiAgICAgIGV4cGVjdCh0eDIudG9CdWZmZXIoKS50b1N0cmluZyhcImhleFwiKSkudG9CZShjaGVja1R4KTtcbiAgXG4gICAgICBsZXQgdHgzOlR4ID0gdHh1MS5zaWduKGF2bS5rZXlDaGFpbigpKTtcbiAgICAgIGxldCB0eDNvYmo6b2JqZWN0ID0gdHgzLnNlcmlhbGl6ZShcImRpc3BsYXlcIik7XG4gICAgICBsZXQgdHgzc3RyOnN0cmluZyA9IEpTT04uc3RyaW5naWZ5KHR4M29iaik7XG4gICAgICBcbiAgICAgIC8qXG4gICAgICBjb25zb2xlLmxvZyhcIi0tLS0tVGVzdDMgSlNPTi0tLS0tXCIpO1xuICAgICAgY29uc29sZS5sb2codHgzc3RyKTtcbiAgICAgIGNvbnNvbGUubG9nKFwiLS0tLS1UZXN0MyBFTkROLS0tLS1cIik7XG4gICAgICAqL1xuICAgICAgXG4gICAgICBsZXQgdHg0bmV3b2JqOm9iamVjdCA9IEpTT04ucGFyc2UodHgzc3RyKTtcbiAgICAgIGxldCB0eDQ6VHggPSBuZXcgVHgoKTtcbiAgICAgIHR4NC5kZXNlcmlhbGl6ZSh0eDRuZXdvYmosIFwiZGlzcGxheVwiKTtcbiAgICAgIFxuICAgICAgLypcbiAgICAgIGxldCB0eDRvYmo6b2JqZWN0ID0gdHg0LnNlcmlhbGl6ZShcImRpc3BsYXlcIik7XG4gICAgICBsZXQgdHg0c3RyOnN0cmluZyA9IEpTT04uc3RyaW5naWZ5KHR4NG9iaik7XG4gICAgICBjb25zb2xlLmxvZyhcIi0tLS0tVGVzdDQgSlNPTi0tLS0tXCIpO1xuICAgICAgY29uc29sZS5sb2codHg0c3RyKTtcbiAgICAgIGNvbnNvbGUubG9nKFwiLS0tLS1UZXN0NCBFTkROLS0tLS1cIik7XG4gICAgICAqL1xuICAgICAgXG4gICAgICBleHBlY3QodHg0LnRvQnVmZmVyKCkudG9TdHJpbmcoXCJoZXhcIikpLnRvQmUoY2hlY2tUeCk7XG5cbiAgICAgIHNlcmlhbHplaXQodHgxLCBcIkV4cG9ydFR4XCIpO1xuXG4gICAgfSk7XG5cbiAgICB0ZXN0KCdidWlsZEdlbmVzaXMnLCBhc3luYyAoKT0+e1xuICAgICAgICBsZXQgZ2VuZXNpc0RhdGE6b2JqZWN0ID0ge1xuICAgICAgICAgICAgZ2VuZXNpc0RhdGEgOiB7XG4gICAgICAgICAgICAgICAgYXNzZXRBbGlhczE6IHtcbiAgICAgICAgICAgICAgICAgICAgbmFtZTogXCJodW1hbiByZWFkYWJsZSBuYW1lXCIsXG4gICAgICAgICAgICAgICAgICAgIHN5bWJvbDogXCJBVkFMXCIsXG4gICAgICAgICAgICAgICAgICAgIGluaXRpYWxTdGF0ZToge1xuICAgICAgICAgICAgICAgICAgICAgICAgZml4ZWRDYXAgOiBbXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhbW91bnQ6IDEwMDAsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFkZHJlc3M6IFwiQVwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFtb3VudDogNTAwMCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYWRkcmVzczogXCJCXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgXVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBhc3NldEFsaWFzQ2FuQmVBbnl0aGluZ1VuaXF1ZToge1xuICAgICAgICAgICAgICAgICAgICBuYW1lOiBcImh1bWFuIHJlYWRhYmxlIG5hbWVcIixcbiAgICAgICAgICAgICAgICAgICAgc3ltYm9sOiBcIkFWQUxcIixcbiAgICAgICAgICAgICAgICAgICAgaW5pdGlhbFN0YXRlOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXJpYWJsZUNhcCA6IFtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1pbnRlcnM6IFtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiQVwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJCXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhyZXNob2xkOiAxXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1pbnRlcnM6IFtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiQVwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJCXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcIkNcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aHJlc2hvbGQ6IDJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBdXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgbGV0IGJ5dGVzOnN0cmluZyA9IFwiMTExVE5XelV0SEtvU3Z4b2hqeWZFd0UyWDIyOFpER0JuZ1o0bWRNVVZNblZuanRuYXdXMWIxemJBaHp5QU0xdjZkN0VDTmo2RFhzVDdxRG1oU0VmM0RXZ1hSajdFQ3dCWDM2WlhGYzl0V1ZCMnFIVVJvVWZkRHZGc0JlU1JxYXRDbWo3NmVaUU1HWkRnQkZSTmlqUmhQTktVYXA3YkNlS3BIRHR1Q1pjNFlwUGtkNG1SODRkTEwyQUwxYjRLNDZlaXJXS01hRlZqQTVidFlTNERueVV4NWNMcEFxM2QzNWtFZE5kVTV6SDNyVFUxOFM0VHhZVjh2b01QY0xDVFozaDR6UnNNNWpXMWNVempXVnZLZzd1WVMyb1I5cVhSRmNneTFnd05URlpHc3R5U3V2U0Y3TVplWkY0elNkTmdDNHJiWTlIOTRSVmhxZThyVzdNWHFNU1pCNnZCVEIyQnBnRjZ0TkZlaG1ZeEVYd2phS1JyaW1YOTF1dHZaZTlZamdHYkRyOFhIc1hDblhYZzRaRENqYXBDeTRIbW1SVXRVb0FkdUdOQmRHVk1pd0U5V3ZWYnBNRkZjTmZnRFhHejlOaWF0Z1Nua3hRQUxUSHZHWFhtOGJuNENvTEZ6S25BdHEzS3dpV3FIbVYzR2pGWWVVbTNtOFplZTlWRGZaQXZEc2hhNTFhY3hmdG8xaHRzdHhZdTY2RFdwVDM2WVQxOFdTYnhpYlpjS1hhN2dacnJzQ3d5emlkOENDV3c3OURiYUxDVWlxOXU0N1Zxb2ZHMWtneHd1dXlIYjhOVm5UZ1JUa1FBU1NiajIzMmZ5RzdZZVg0bUF2Wlk3YTdLN3lmU3l6SmFYZFVkUjdhTGVDZExQNm1iRkRxVU1yTjZZRWtVMlg4ZDRDazNUXCJcblxuICAgICAgICBsZXQgcmVzdWx0OlByb21pc2U8c3RyaW5nPiA9IGFwaS5idWlsZEdlbmVzaXMoZ2VuZXNpc0RhdGEpO1xuICAgICAgICBsZXQgcGF5bG9hZDpvYmplY3QgPSB7XG4gICAgICAgICAgICBcInJlc3VsdFwiOiB7XG4gICAgICAgICAgICAgICAgJ2J5dGVzJzogYnl0ZXNcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgbGV0IHJlc3BvbnNlT2JqID0ge1xuICAgICAgICAgICAgZGF0YTogcGF5bG9hZFxuICAgICAgICB9O1xuXG4gICAgICAgIG1vY2tBeGlvcy5tb2NrUmVzcG9uc2UocmVzcG9uc2VPYmopO1xuICAgICAgICBsZXQgcmVzcG9uc2U6c3RyaW5nID0gYXdhaXQgcmVzdWx0O1xuXG4gICAgICAgIGV4cGVjdChyZXNwb25zZSkudG9CZShieXRlcyk7XG4gICAgfSk7XG4gIH0pO1xufSk7Il19