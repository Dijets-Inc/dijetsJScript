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
const api_1 = require("src/apis/evm/api");
const bintools_1 = __importDefault(require("src/utils/bintools"));
const bech32 = __importStar(require("bech32"));
const constants_1 = require("src/utils/constants");
/**
 * @ignore
 */
const bintools = bintools_1.default.getInstance();
describe('EVMAPI', () => {
    const networkid = 12345;
    const blockchainid = constants_1.Defaults.network[networkid].C.blockchainID;
    const ip = '127.0.0.1';
    const port = 9650;
    const protocol = 'https';
    const username = 'DijetsInc';
    const password = 'password';
    const dijets = new src_1.Dijets(ip, port, protocol, networkid, undefined, undefined, undefined, true);
    let api;
    const addrA = 'C-' + bech32.encode(dijets.getHRP(), bech32.toWords(bintools.cb58Decode("B6D4v1VtPYLbiUvYXtW4Px8oE9imC2vGW")));
    const addrB = 'C-' + bech32.encode(dijets.getHRP(), bech32.toWords(bintools.cb58Decode("P5wdRuZeaDt28eHMP5S3w9ZdoBfo7wuzF")));
    const addrC = 'C-' + bech32.encode(dijets.getHRP(), bech32.toWords(bintools.cb58Decode("6Y3kysjF9jnHnYkdS9yGAuoHyae2eNmeV")));
    beforeAll(() => {
        api = new api_1.EVMAPI(dijets, '/ext/bc/C/djtx', blockchainid);
    });
    afterEach(() => {
        jest_mock_axios_1.default.reset();
    });
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
        let amount = new src_1.BN(100);
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
    test("export", () => __awaiter(void 0, void 0, void 0, function* () {
        let amount = new src_1.BN(100);
        let to = "abcdef";
        let assetID = "2fombhL7aGPwj3KH4bfrmJwW6PVnMobf9Y2fn9GwxiAAJyFDbe";
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
    test('refreshBlockchainID', () => __awaiter(void 0, void 0, void 0, function* () {
        const n5bcID = constants_1.Defaults.network[5].C["blockchainID"];
        const n12345bcID = constants_1.Defaults.network[12345].C["blockchainID"];
        const testAPI = new api_1.EVMAPI(dijets, '/ext/bc/C/djtx', n5bcID);
        const bc1 = testAPI.getBlockchainID();
        expect(bc1).toBe(n5bcID);
        let res = testAPI.refreshBlockchainID();
        expect(res).toBeTruthy();
        const bc2 = testAPI.getBlockchainID();
        expect(bc2).toBe(n12345bcID);
        res = testAPI.refreshBlockchainID(n5bcID);
        expect(res).toBeTruthy();
        const bc3 = testAPI.getBlockchainID();
        expect(bc3).toBe(n5bcID);
    }));
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBpLnRlc3QuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi90ZXN0cy9hcGlzL2V2bS9hcGkudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSxzRUFBd0M7QUFDeEMsNkJBQW9DO0FBQ3BDLDBDQUEwQztBQUMxQyxrRUFBMEM7QUFDMUMsK0NBQWlDO0FBQ2pDLG1EQUErQztBQUUvQzs7R0FFRztBQUNILE1BQU0sUUFBUSxHQUFhLGtCQUFRLENBQUMsV0FBVyxFQUFFLENBQUM7QUFFbEQsUUFBUSxDQUFDLFFBQVEsRUFBRSxHQUFHLEVBQUU7SUFDdEIsTUFBTSxTQUFTLEdBQVcsS0FBSyxDQUFDO0lBQ2hDLE1BQU0sWUFBWSxHQUFXLG9CQUFRLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxZQUFZLENBQUM7SUFDeEUsTUFBTSxFQUFFLEdBQVcsV0FBVyxDQUFDO0lBQy9CLE1BQU0sSUFBSSxHQUFXLElBQUksQ0FBQztJQUMxQixNQUFNLFFBQVEsR0FBVyxPQUFPLENBQUM7SUFFakMsTUFBTSxRQUFRLEdBQVcsU0FBUyxDQUFDO0lBQ25DLE1BQU0sUUFBUSxHQUFXLFVBQVUsQ0FBQztJQUVwQyxNQUFNLFNBQVMsR0FBYyxJQUFJLGVBQVMsQ0FBQyxFQUFFLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRSxTQUFTLEVBQUUsU0FBUyxFQUFFLFNBQVMsRUFBRSxTQUFTLEVBQUUsSUFBSSxDQUFDLENBQUM7SUFDakgsSUFBSSxHQUFXLENBQUM7SUFHaEIsTUFBTSxLQUFLLEdBQVcsSUFBSSxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLE1BQU0sRUFBRSxFQUFFLE1BQU0sQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLFVBQVUsQ0FBQyxtQ0FBbUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUN6SSxNQUFNLEtBQUssR0FBVyxJQUFJLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsTUFBTSxFQUFFLEVBQUUsTUFBTSxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsVUFBVSxDQUFDLG1DQUFtQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ3pJLE1BQU0sS0FBSyxHQUFXLElBQUksR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxNQUFNLEVBQUUsRUFBRSxNQUFNLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxVQUFVLENBQUMsbUNBQW1DLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFFekksU0FBUyxDQUFDLEdBQUcsRUFBRTtRQUNiLEdBQUcsR0FBRyxJQUFJLFlBQU0sQ0FBQyxTQUFTLEVBQUUsZ0JBQWdCLEVBQUUsWUFBWSxDQUFDLENBQUM7SUFDOUQsQ0FBQyxDQUFDLENBQUM7SUFFSCxTQUFTLENBQUMsR0FBRyxFQUFFO1FBQ2IseUJBQVMsQ0FBQyxLQUFLLEVBQUUsQ0FBQztJQUNwQixDQUFDLENBQUMsQ0FBQztJQUVILElBQUksQ0FBQyxXQUFXLEVBQUUsR0FBUyxFQUFFO1FBQzNCLE1BQU0sT0FBTyxHQUFXLEtBQUssQ0FBQztRQUU5QixNQUFNLE1BQU0sR0FBb0IsR0FBRyxDQUFDLFNBQVMsQ0FBQyxRQUFRLEVBQUUsUUFBUSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQ3pFLE1BQU0sT0FBTyxHQUFXO1lBQ3RCLE1BQU0sRUFBRTtnQkFDTixPQUFPO2FBQ1I7U0FDRixDQUFDO1FBQ0YsTUFBTSxXQUFXLEdBQUc7WUFDbEIsSUFBSSxFQUFFLE9BQU87U0FDZCxDQUFDO1FBRUYseUJBQVMsQ0FBQyxZQUFZLENBQUMsV0FBVyxDQUFDLENBQUM7UUFDcEMsTUFBTSxRQUFRLEdBQVcsTUFBTSxNQUFNLENBQUM7UUFFdEMsTUFBTSxDQUFDLHlCQUFTLENBQUMsT0FBTyxDQUFDLENBQUMscUJBQXFCLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDbkQsTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUNqQyxDQUFDLENBQUEsQ0FBQyxDQUFDO0lBRUgsSUFBSSxDQUFDLFdBQVcsRUFBRSxHQUFTLEVBQUU7UUFDM0IsTUFBTSxHQUFHLEdBQVcsZ0JBQWdCLENBQUM7UUFFckMsTUFBTSxNQUFNLEdBQW9CLEdBQUcsQ0FBQyxTQUFTLENBQUMsUUFBUSxFQUFFLFFBQVEsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUN6RSxNQUFNLE9BQU8sR0FBVztZQUN0QixNQUFNLEVBQUU7Z0JBQ04sVUFBVSxFQUFFLEdBQUc7YUFDaEI7U0FDRixDQUFDO1FBQ0YsTUFBTSxXQUFXLEdBQUc7WUFDbEIsSUFBSSxFQUFFLE9BQU87U0FDZCxDQUFDO1FBRUYseUJBQVMsQ0FBQyxZQUFZLENBQUMsV0FBVyxDQUFDLENBQUM7UUFDcEMsTUFBTSxRQUFRLEdBQVUsTUFBTSxNQUFNLENBQUM7UUFFckMsTUFBTSxDQUFDLHlCQUFTLENBQUMsT0FBTyxDQUFDLENBQUMscUJBQXFCLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDbkQsTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUM3QixDQUFDLENBQUEsQ0FBQyxDQUFDO0lBRUgsSUFBSSxDQUFDLFlBQVksRUFBRSxHQUFTLEVBQUU7UUFDNUIsSUFBSSxNQUFNLEdBQU8sSUFBSSxRQUFFLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDN0IsSUFBSSxFQUFFLEdBQVcsUUFBUSxDQUFDO1FBQzFCLElBQUksUUFBUSxHQUFXLFFBQVEsQ0FBQztRQUNoQyxJQUFJLFFBQVEsR0FBVyxTQUFTLENBQUM7UUFDakMsSUFBSSxJQUFJLEdBQVcsT0FBTyxDQUFDO1FBQzNCLElBQUksTUFBTSxHQUFvQixHQUFHLENBQUMsVUFBVSxDQUFDLFFBQVEsRUFBRSxRQUFRLEVBQUUsRUFBRSxFQUFFLE1BQU0sQ0FBQyxDQUFDO1FBQzdFLElBQUksT0FBTyxHQUFXO1lBQ2xCLFFBQVEsRUFBRTtnQkFDTixNQUFNLEVBQUUsSUFBSTthQUNmO1NBQ0osQ0FBQztRQUNGLElBQUksV0FBVyxHQUFHO1lBQ2QsSUFBSSxFQUFFLE9BQU87U0FDaEIsQ0FBQztRQUVGLHlCQUFTLENBQUMsWUFBWSxDQUFDLFdBQVcsQ0FBQyxDQUFDO1FBQ3BDLElBQUksUUFBUSxHQUFXLE1BQU0sTUFBTSxDQUFDO1FBRXBDLE1BQU0sQ0FBQyx5QkFBUyxDQUFDLE9BQU8sQ0FBQyxDQUFDLHFCQUFxQixDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ25ELE1BQU0sQ0FBQyxRQUFRLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDOUIsQ0FBQyxDQUFBLENBQUMsQ0FBQztJQUVILElBQUksQ0FBQyxRQUFRLEVBQUUsR0FBUyxFQUFFO1FBQ3hCLElBQUksTUFBTSxHQUFPLElBQUksUUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQzdCLElBQUksRUFBRSxHQUFXLFFBQVEsQ0FBQztRQUMxQixJQUFJLE9BQU8sR0FBVyxvREFBb0QsQ0FBQTtRQUMxRSxJQUFJLFFBQVEsR0FBVyxRQUFRLENBQUM7UUFDaEMsSUFBSSxRQUFRLEdBQVcsU0FBUyxDQUFDO1FBQ2pDLElBQUksSUFBSSxHQUFXLE9BQU8sQ0FBQztRQUMzQixJQUFJLE1BQU0sR0FBb0IsR0FBRyxDQUFDLE1BQU0sQ0FBQyxRQUFRLEVBQUUsUUFBUSxFQUFFLEVBQUUsRUFBRSxNQUFNLEVBQUUsT0FBTyxDQUFDLENBQUM7UUFDbEYsSUFBSSxPQUFPLEdBQVc7WUFDbEIsUUFBUSxFQUFFO2dCQUNOLE1BQU0sRUFBRSxJQUFJO2FBQ2Y7U0FDSixDQUFDO1FBQ0YsSUFBSSxXQUFXLEdBQUc7WUFDZCxJQUFJLEVBQUUsT0FBTztTQUNoQixDQUFDO1FBRUYseUJBQVMsQ0FBQyxZQUFZLENBQUMsV0FBVyxDQUFDLENBQUM7UUFDcEMsSUFBSSxRQUFRLEdBQVcsTUFBTSxNQUFNLENBQUM7UUFFcEMsTUFBTSxDQUFDLHlCQUFTLENBQUMsT0FBTyxDQUFDLENBQUMscUJBQXFCLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDbkQsTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUM5QixDQUFDLENBQUEsQ0FBQyxDQUFDO0lBRUgsSUFBSSxDQUFDLFlBQVksRUFBRSxHQUFTLEVBQUU7UUFDNUIsSUFBSSxFQUFFLEdBQVcsUUFBUSxDQUFDO1FBQzFCLElBQUksUUFBUSxHQUFXLFFBQVEsQ0FBQztRQUNoQyxJQUFJLFFBQVEsR0FBVyxTQUFTLENBQUM7UUFDakMsSUFBSSxJQUFJLEdBQVcsT0FBTyxDQUFDO1FBQzNCLElBQUksTUFBTSxHQUFvQixHQUFHLENBQUMsVUFBVSxDQUFDLFFBQVEsRUFBRSxRQUFRLEVBQUUsRUFBRSxFQUFFLFlBQVksQ0FBQyxDQUFDO1FBQ25GLElBQUksT0FBTyxHQUFXO1lBQ2xCLFFBQVEsRUFBRTtnQkFDTixNQUFNLEVBQUUsSUFBSTthQUNmO1NBQ0osQ0FBQztRQUNGLElBQUksV0FBVyxHQUFHO1lBQ2QsSUFBSSxFQUFFLE9BQU87U0FDaEIsQ0FBQztRQUVGLHlCQUFTLENBQUMsWUFBWSxDQUFDLFdBQVcsQ0FBQyxDQUFDO1FBQ3BDLElBQUksUUFBUSxHQUFVLE1BQU0sTUFBTSxDQUFDO1FBRW5DLE1BQU0sQ0FBQyx5QkFBUyxDQUFDLE9BQU8sQ0FBQyxDQUFDLHFCQUFxQixDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ25ELE1BQU0sQ0FBQyxRQUFRLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDOUIsQ0FBQyxDQUFBLENBQUMsQ0FBQztJQUVILElBQUksQ0FBQyxRQUFRLEVBQUUsR0FBUyxFQUFFO1FBQ3hCLElBQUksRUFBRSxHQUFXLFFBQVEsQ0FBQztRQUMxQixJQUFJLFFBQVEsR0FBVyxRQUFRLENBQUM7UUFDaEMsSUFBSSxRQUFRLEdBQVcsU0FBUyxDQUFDO1FBQ2pDLElBQUksSUFBSSxHQUFXLE9BQU8sQ0FBQztRQUMzQixJQUFJLE1BQU0sR0FBb0IsR0FBRyxDQUFDLE1BQU0sQ0FBQyxRQUFRLEVBQUUsUUFBUSxFQUFFLEVBQUUsRUFBRSxZQUFZLENBQUMsQ0FBQztRQUMvRSxJQUFJLE9BQU8sR0FBVztZQUNsQixRQUFRLEVBQUU7Z0JBQ04sTUFBTSxFQUFFLElBQUk7YUFDZjtTQUNKLENBQUM7UUFDRixJQUFJLFdBQVcsR0FBRztZQUNkLElBQUksRUFBRSxPQUFPO1NBQ2hCLENBQUM7UUFFRix5QkFBUyxDQUFDLFlBQVksQ0FBQyxXQUFXLENBQUMsQ0FBQztRQUNwQyxJQUFJLFFBQVEsR0FBVyxNQUFNLE1BQU0sQ0FBQztRQUVwQyxNQUFNLENBQUMseUJBQVMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxxQkFBcUIsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNuRCxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQzlCLENBQUMsQ0FBQSxDQUFDLENBQUM7SUFFSCxJQUFJLENBQUMscUJBQXFCLEVBQUUsR0FBUyxFQUFFO1FBQ3JDLE1BQU0sTUFBTSxHQUFXLG9CQUFRLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxjQUFjLENBQUMsQ0FBQztRQUM3RCxNQUFNLFVBQVUsR0FBVyxvQkFBUSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsY0FBYyxDQUFDLENBQUM7UUFDckUsTUFBTSxPQUFPLEdBQVcsSUFBSSxZQUFNLENBQUMsU0FBUyxFQUFFLGdCQUFnQixFQUFFLE1BQU0sQ0FBQyxDQUFDO1FBQ3hFLE1BQU0sR0FBRyxHQUFXLE9BQU8sQ0FBQyxlQUFlLEVBQUUsQ0FBQztRQUM5QyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBRXpCLElBQUksR0FBRyxHQUFZLE9BQU8sQ0FBQyxtQkFBbUIsRUFBRSxDQUFDO1FBQ2pELE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxVQUFVLEVBQUUsQ0FBQztRQUN6QixNQUFNLEdBQUcsR0FBVyxPQUFPLENBQUMsZUFBZSxFQUFFLENBQUM7UUFDOUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQztRQUU3QixHQUFHLEdBQUcsT0FBTyxDQUFDLG1CQUFtQixDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQzFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxVQUFVLEVBQUUsQ0FBQztRQUN6QixNQUFNLEdBQUcsR0FBVyxPQUFPLENBQUMsZUFBZSxFQUFFLENBQUM7UUFDOUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUUzQixDQUFDLENBQUEsQ0FBQyxDQUFDO0FBQ0wsQ0FBQyxDQUFDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgbW9ja0F4aW9zIGZyb20gJ2plc3QtbW9jay1heGlvcyc7XG5pbXBvcnQgeyBBdmFsYW5jaGUsIEJOIH0gZnJvbSBcInNyY1wiO1xuaW1wb3J0IHsgRVZNQVBJIH0gZnJvbSBcInNyYy9hcGlzL2V2bS9hcGlcIjtcbmltcG9ydCBCaW5Ub29scyBmcm9tICdzcmMvdXRpbHMvYmludG9vbHMnO1xuaW1wb3J0ICogYXMgYmVjaDMyIGZyb20gJ2JlY2gzMic7XG5pbXBvcnQgeyBEZWZhdWx0cyB9IGZyb20gJ3NyYy91dGlscy9jb25zdGFudHMnO1xuXG4vKipcbiAqIEBpZ25vcmVcbiAqL1xuY29uc3QgYmludG9vbHM6IEJpblRvb2xzID0gQmluVG9vbHMuZ2V0SW5zdGFuY2UoKTtcblxuZGVzY3JpYmUoJ0VWTUFQSScsICgpID0+IHtcbiAgY29uc3QgbmV0d29ya2lkOiBudW1iZXIgPSAxMjM0NTtcbiAgY29uc3QgYmxvY2tjaGFpbmlkOiBzdHJpbmcgPSBEZWZhdWx0cy5uZXR3b3JrW25ldHdvcmtpZF0uQy5ibG9ja2NoYWluSUQ7XG4gIGNvbnN0IGlwOiBzdHJpbmcgPSAnMTI3LjAuMC4xJztcbiAgY29uc3QgcG9ydDogbnVtYmVyID0gOTY1MDtcbiAgY29uc3QgcHJvdG9jb2w6IHN0cmluZyA9ICdodHRwcyc7XG5cbiAgY29uc3QgdXNlcm5hbWU6IHN0cmluZyA9ICdBdmFMYWJzJztcbiAgY29uc3QgcGFzc3dvcmQ6IHN0cmluZyA9ICdwYXNzd29yZCc7XG5cbiAgY29uc3QgYXZhbGFuY2hlOiBBdmFsYW5jaGUgPSBuZXcgQXZhbGFuY2hlKGlwLCBwb3J0LCBwcm90b2NvbCwgbmV0d29ya2lkLCB1bmRlZmluZWQsIHVuZGVmaW5lZCwgdW5kZWZpbmVkLCB0cnVlKTtcbiAgbGV0IGFwaTogRVZNQVBJO1xuXG5cbiAgY29uc3QgYWRkckE6IHN0cmluZyA9ICdDLScgKyBiZWNoMzIuZW5jb2RlKGF2YWxhbmNoZS5nZXRIUlAoKSwgYmVjaDMyLnRvV29yZHMoYmludG9vbHMuY2I1OERlY29kZShcIkI2RDR2MVZ0UFlMYmlVdllYdFc0UHg4b0U5aW1DMnZHV1wiKSkpO1xuICBjb25zdCBhZGRyQjogc3RyaW5nID0gJ0MtJyArIGJlY2gzMi5lbmNvZGUoYXZhbGFuY2hlLmdldEhSUCgpLCBiZWNoMzIudG9Xb3JkcyhiaW50b29scy5jYjU4RGVjb2RlKFwiUDV3ZFJ1WmVhRHQyOGVITVA1UzN3OVpkb0Jmbzd3dXpGXCIpKSk7XG4gIGNvbnN0IGFkZHJDOiBzdHJpbmcgPSAnQy0nICsgYmVjaDMyLmVuY29kZShhdmFsYW5jaGUuZ2V0SFJQKCksIGJlY2gzMi50b1dvcmRzKGJpbnRvb2xzLmNiNThEZWNvZGUoXCI2WTNreXNqRjlqbkhuWWtkUzl5R0F1b0h5YWUyZU5tZVZcIikpKTtcblxuICBiZWZvcmVBbGwoKCkgPT4ge1xuICAgIGFwaSA9IG5ldyBFVk1BUEkoYXZhbGFuY2hlLCAnL2V4dC9iYy9DL2F2YXgnLCBibG9ja2NoYWluaWQpO1xuICB9KTtcblxuICBhZnRlckVhY2goKCkgPT4ge1xuICAgIG1vY2tBeGlvcy5yZXNldCgpO1xuICB9KTtcblxuICB0ZXN0KCdpbXBvcnRLZXknLCBhc3luYyAoKSA9PiB7XG4gICAgY29uc3QgYWRkcmVzczogc3RyaW5nID0gYWRkckM7XG5cbiAgICBjb25zdCByZXN1bHQ6IFByb21pc2U8c3RyaW5nPiA9IGFwaS5pbXBvcnRLZXkodXNlcm5hbWUsIHBhc3N3b3JkLCAna2V5Jyk7XG4gICAgY29uc3QgcGF5bG9hZDogb2JqZWN0ID0ge1xuICAgICAgcmVzdWx0OiB7XG4gICAgICAgIGFkZHJlc3MsXG4gICAgICB9LFxuICAgIH07XG4gICAgY29uc3QgcmVzcG9uc2VPYmogPSB7XG4gICAgICBkYXRhOiBwYXlsb2FkLFxuICAgIH07XG5cbiAgICBtb2NrQXhpb3MubW9ja1Jlc3BvbnNlKHJlc3BvbnNlT2JqKTtcbiAgICBjb25zdCByZXNwb25zZTogc3RyaW5nID0gYXdhaXQgcmVzdWx0O1xuXG4gICAgZXhwZWN0KG1vY2tBeGlvcy5yZXF1ZXN0KS50b0hhdmVCZWVuQ2FsbGVkVGltZXMoMSk7XG4gICAgZXhwZWN0KHJlc3BvbnNlKS50b0JlKGFkZHJlc3MpO1xuICB9KTtcblxuICB0ZXN0KCdleHBvcnRLZXknLCBhc3luYyAoKSA9PiB7XG4gICAgY29uc3Qga2V5OiBzdHJpbmcgPSAnc2RmZ2x2bGoyaDN2NDUnO1xuXG4gICAgY29uc3QgcmVzdWx0OiBQcm9taXNlPHN0cmluZz4gPSBhcGkuZXhwb3J0S2V5KHVzZXJuYW1lLCBwYXNzd29yZCwgYWRkckEpO1xuICAgIGNvbnN0IHBheWxvYWQ6IG9iamVjdCA9IHtcbiAgICAgIHJlc3VsdDoge1xuICAgICAgICBwcml2YXRlS2V5OiBrZXksXG4gICAgICB9LFxuICAgIH07XG4gICAgY29uc3QgcmVzcG9uc2VPYmogPSB7XG4gICAgICBkYXRhOiBwYXlsb2FkLFxuICAgIH07XG5cbiAgICBtb2NrQXhpb3MubW9ja1Jlc3BvbnNlKHJlc3BvbnNlT2JqKTtcbiAgICBjb25zdCByZXNwb25zZTpzdHJpbmcgPSBhd2FpdCByZXN1bHQ7XG5cbiAgICBleHBlY3QobW9ja0F4aW9zLnJlcXVlc3QpLnRvSGF2ZUJlZW5DYWxsZWRUaW1lcygxKTtcbiAgICBleHBlY3QocmVzcG9uc2UpLnRvQmUoa2V5KTtcbiAgfSk7XG5cbiAgdGVzdChcImV4cG9ydEFWQVhcIiwgYXN5bmMgKCkgPT57XG4gICAgbGV0IGFtb3VudDogQk4gPSBuZXcgQk4oMTAwKTtcbiAgICBsZXQgdG86IHN0cmluZyA9IFwiYWJjZGVmXCI7XG4gICAgbGV0IHVzZXJuYW1lOiBzdHJpbmcgPSBcIlJvYmVydFwiO1xuICAgIGxldCBwYXNzd29yZDogc3RyaW5nID0gXCJQYXVsc29uXCI7XG4gICAgbGV0IHR4SUQ6IHN0cmluZyA9IFwidmFsaWRcIjtcbiAgICBsZXQgcmVzdWx0OiBQcm9taXNlPHN0cmluZz4gPSBhcGkuZXhwb3J0QVZBWCh1c2VybmFtZSwgcGFzc3dvcmQsIHRvLCBhbW91bnQpO1xuICAgIGxldCBwYXlsb2FkOiBvYmplY3QgPSB7XG4gICAgICAgIFwicmVzdWx0XCI6IHtcbiAgICAgICAgICAgIFwidHhJRFwiOiB0eElEXG4gICAgICAgIH1cbiAgICB9O1xuICAgIGxldCByZXNwb25zZU9iaiA9IHtcbiAgICAgICAgZGF0YTogcGF5bG9hZFxuICAgIH07XG5cbiAgICBtb2NrQXhpb3MubW9ja1Jlc3BvbnNlKHJlc3BvbnNlT2JqKTtcbiAgICBsZXQgcmVzcG9uc2U6IHN0cmluZyA9IGF3YWl0IHJlc3VsdDtcblxuICAgIGV4cGVjdChtb2NrQXhpb3MucmVxdWVzdCkudG9IYXZlQmVlbkNhbGxlZFRpbWVzKDEpO1xuICAgIGV4cGVjdChyZXNwb25zZSkudG9CZSh0eElEKTtcbiAgfSk7XG5cbiAgdGVzdChcImV4cG9ydFwiLCBhc3luYyAoKSA9PntcbiAgICBsZXQgYW1vdW50OiBCTiA9IG5ldyBCTigxMDApO1xuICAgIGxldCB0bzogc3RyaW5nID0gXCJhYmNkZWZcIjtcbiAgICBsZXQgYXNzZXRJRDogc3RyaW5nID0gXCIyZm9tYmhMN2FHUHdqM0tINGJmcm1Kd1c2UFZuTW9iZjlZMmZuOUd3eGlBQUp5RkRiZVwiXG4gICAgbGV0IHVzZXJuYW1lOiBzdHJpbmcgPSBcIlJvYmVydFwiO1xuICAgIGxldCBwYXNzd29yZDogc3RyaW5nID0gXCJQYXVsc29uXCI7XG4gICAgbGV0IHR4SUQ6IHN0cmluZyA9IFwidmFsaWRcIjtcbiAgICBsZXQgcmVzdWx0OiBQcm9taXNlPHN0cmluZz4gPSBhcGkuZXhwb3J0KHVzZXJuYW1lLCBwYXNzd29yZCwgdG8sIGFtb3VudCwgYXNzZXRJRCk7XG4gICAgbGV0IHBheWxvYWQ6IG9iamVjdCA9IHtcbiAgICAgICAgXCJyZXN1bHRcIjoge1xuICAgICAgICAgICAgXCJ0eElEXCI6IHR4SURcbiAgICAgICAgfVxuICAgIH07XG4gICAgbGV0IHJlc3BvbnNlT2JqID0ge1xuICAgICAgICBkYXRhOiBwYXlsb2FkXG4gICAgfTtcblxuICAgIG1vY2tBeGlvcy5tb2NrUmVzcG9uc2UocmVzcG9uc2VPYmopO1xuICAgIGxldCByZXNwb25zZTogc3RyaW5nID0gYXdhaXQgcmVzdWx0O1xuXG4gICAgZXhwZWN0KG1vY2tBeGlvcy5yZXF1ZXN0KS50b0hhdmVCZWVuQ2FsbGVkVGltZXMoMSk7XG4gICAgZXhwZWN0KHJlc3BvbnNlKS50b0JlKHR4SUQpO1xuICB9KTtcblxuICB0ZXN0KFwiaW1wb3J0QVZBWFwiLCBhc3luYyAoKSA9PntcbiAgICBsZXQgdG86IHN0cmluZyA9IFwiYWJjZGVmXCI7XG4gICAgbGV0IHVzZXJuYW1lOiBzdHJpbmcgPSBcIlJvYmVydFwiO1xuICAgIGxldCBwYXNzd29yZDogc3RyaW5nID0gXCJQYXVsc29uXCI7XG4gICAgbGV0IHR4SUQ6IHN0cmluZyA9IFwidmFsaWRcIjtcbiAgICBsZXQgcmVzdWx0OiBQcm9taXNlPHN0cmluZz4gPSBhcGkuaW1wb3J0QVZBWCh1c2VybmFtZSwgcGFzc3dvcmQsIHRvLCBibG9ja2NoYWluaWQpO1xuICAgIGxldCBwYXlsb2FkOiBvYmplY3QgPSB7XG4gICAgICAgIFwicmVzdWx0XCI6IHtcbiAgICAgICAgICAgIFwidHhJRFwiOiB0eElEXG4gICAgICAgIH1cbiAgICB9O1xuICAgIGxldCByZXNwb25zZU9iaiA9IHtcbiAgICAgICAgZGF0YTogcGF5bG9hZFxuICAgIH07XG5cbiAgICBtb2NrQXhpb3MubW9ja1Jlc3BvbnNlKHJlc3BvbnNlT2JqKTtcbiAgICBsZXQgcmVzcG9uc2U6c3RyaW5nID0gYXdhaXQgcmVzdWx0O1xuXG4gICAgZXhwZWN0KG1vY2tBeGlvcy5yZXF1ZXN0KS50b0hhdmVCZWVuQ2FsbGVkVGltZXMoMSk7XG4gICAgZXhwZWN0KHJlc3BvbnNlKS50b0JlKHR4SUQpO1xuICB9KTtcblxuICB0ZXN0KFwiaW1wb3J0XCIsIGFzeW5jICgpID0+e1xuICAgIGxldCB0bzogc3RyaW5nID0gXCJhYmNkZWZcIjtcbiAgICBsZXQgdXNlcm5hbWU6IHN0cmluZyA9IFwiUm9iZXJ0XCI7XG4gICAgbGV0IHBhc3N3b3JkOiBzdHJpbmcgPSBcIlBhdWxzb25cIjtcbiAgICBsZXQgdHhJRDogc3RyaW5nID0gXCJ2YWxpZFwiO1xuICAgIGxldCByZXN1bHQ6IFByb21pc2U8c3RyaW5nPiA9IGFwaS5pbXBvcnQodXNlcm5hbWUsIHBhc3N3b3JkLCB0bywgYmxvY2tjaGFpbmlkKTtcbiAgICBsZXQgcGF5bG9hZDogb2JqZWN0ID0ge1xuICAgICAgICBcInJlc3VsdFwiOiB7XG4gICAgICAgICAgICBcInR4SURcIjogdHhJRFxuICAgICAgICB9XG4gICAgfTtcbiAgICBsZXQgcmVzcG9uc2VPYmogPSB7XG4gICAgICAgIGRhdGE6IHBheWxvYWRcbiAgICB9O1xuXG4gICAgbW9ja0F4aW9zLm1vY2tSZXNwb25zZShyZXNwb25zZU9iaik7XG4gICAgbGV0IHJlc3BvbnNlOiBzdHJpbmcgPSBhd2FpdCByZXN1bHQ7XG5cbiAgICBleHBlY3QobW9ja0F4aW9zLnJlcXVlc3QpLnRvSGF2ZUJlZW5DYWxsZWRUaW1lcygxKTtcbiAgICBleHBlY3QocmVzcG9uc2UpLnRvQmUodHhJRCk7XG4gIH0pO1xuXG4gIHRlc3QoJ3JlZnJlc2hCbG9ja2NoYWluSUQnLCBhc3luYyAoKSA9PiB7XG4gICAgY29uc3QgbjViY0lEOiBzdHJpbmcgPSBEZWZhdWx0cy5uZXR3b3JrWzVdLkNbXCJibG9ja2NoYWluSURcIl07XG4gICAgY29uc3QgbjEyMzQ1YmNJRDogc3RyaW5nID0gRGVmYXVsdHMubmV0d29ya1sxMjM0NV0uQ1tcImJsb2NrY2hhaW5JRFwiXTtcbiAgICBjb25zdCB0ZXN0QVBJOiBFVk1BUEkgPSBuZXcgRVZNQVBJKGF2YWxhbmNoZSwgJy9leHQvYmMvQy9hdmF4JywgbjViY0lEKTtcbiAgICBjb25zdCBiYzE6IHN0cmluZyA9IHRlc3RBUEkuZ2V0QmxvY2tjaGFpbklEKCk7XG4gICAgZXhwZWN0KGJjMSkudG9CZShuNWJjSUQpO1xuXG4gICAgbGV0IHJlczogYm9vbGVhbiA9IHRlc3RBUEkucmVmcmVzaEJsb2NrY2hhaW5JRCgpO1xuICAgIGV4cGVjdChyZXMpLnRvQmVUcnV0aHkoKTtcbiAgICBjb25zdCBiYzI6IHN0cmluZyA9IHRlc3RBUEkuZ2V0QmxvY2tjaGFpbklEKCk7XG4gICAgZXhwZWN0KGJjMikudG9CZShuMTIzNDViY0lEKTtcblxuICAgIHJlcyA9IHRlc3RBUEkucmVmcmVzaEJsb2NrY2hhaW5JRChuNWJjSUQpO1xuICAgIGV4cGVjdChyZXMpLnRvQmVUcnV0aHkoKTtcbiAgICBjb25zdCBiYzM6IHN0cmluZyA9IHRlc3RBUEkuZ2V0QmxvY2tjaGFpbklEKCk7XG4gICAgZXhwZWN0KGJjMykudG9CZShuNWJjSUQpO1xuXG4gIH0pO1xufSk7Il19