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
const api_1 = require("src/apis/keystore/api");
describe('Keystore', () => {
    const ip = '127.0.0.1';
    const port = 9650;
    const protocol = 'https';
    const username = 'DijetsInc';
    const password = 'password';
    const dijets = new src_1.Dijets(ip, port, protocol, 12345, undefined, undefined, undefined, true);
    let keystore;
    beforeAll(() => {
        keystore = new api_1.KeystoreAPI(dijets);
    });
    afterEach(() => {
        jest_mock_axios_1.default.reset();
    });
    test('createUser', () => __awaiter(void 0, void 0, void 0, function* () {
        const result = keystore.createUser(username, password);
        const payload = {
            result: {
                success: true,
            },
        };
        const responseObj = {
            data: payload,
        };
        jest_mock_axios_1.default.mockResponse(responseObj);
        const response = yield result;
        expect(jest_mock_axios_1.default.request).toHaveBeenCalledTimes(1);
        expect(response).toBe(true);
    }));
    test('deleteUser', () => __awaiter(void 0, void 0, void 0, function* () {
        const result = keystore.deleteUser(username, password);
        const payload = {
            result: {
                success: true,
            },
        };
        const responseObj = {
            data: payload,
        };
        jest_mock_axios_1.default.mockResponse(responseObj);
        const response = yield result;
        expect(jest_mock_axios_1.default.request).toHaveBeenCalledTimes(1);
        expect(response).toBe(true);
    }));
    test('exportUser', () => __awaiter(void 0, void 0, void 0, function* () {
        const data = 'data';
        const result = keystore.exportUser(username, password);
        const payload = {
            result: {
                user: data,
            },
        };
        const responseObj = {
            data: payload,
        };
        jest_mock_axios_1.default.mockResponse(responseObj);
        const response = yield result;
        expect(jest_mock_axios_1.default.request).toHaveBeenCalledTimes(1);
        expect(response).toBe(data);
    }));
    test('importUser', () => __awaiter(void 0, void 0, void 0, function* () {
        const result = keystore.importUser(username, 'data', password);
        const payload = {
            result: {
                success: true,
            },
        };
        const responseObj = {
            data: payload,
        };
        jest_mock_axios_1.default.mockResponse(responseObj);
        const response = yield result;
        expect(jest_mock_axios_1.default.request).toHaveBeenCalledTimes(1);
        expect(response).toBe(true);
    }));
    test('listUsers', () => __awaiter(void 0, void 0, void 0, function* () {
        const accounts = ['acc1', 'acc2'];
        const result = keystore.listUsers();
        const payload = {
            result: {
                users: accounts,
            },
        };
        const responseObj = {
            data: payload,
        };
        jest_mock_axios_1.default.mockResponse(responseObj);
        const response = yield result;
        expect(jest_mock_axios_1.default.request).toHaveBeenCalledTimes(1);
        expect(response).toBe(accounts);
    }));
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBpLnRlc3QuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi90ZXN0cy9hcGlzL2tleXN0b3JlL2FwaS50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7O0FBQUEsc0VBQXdDO0FBRXhDLDZCQUFnQztBQUNoQywrQ0FBb0Q7QUFFcEQsUUFBUSxDQUFDLFVBQVUsRUFBRSxHQUFHLEVBQUU7SUFDeEIsTUFBTSxFQUFFLEdBQUcsV0FBVyxDQUFDO0lBQ3ZCLE1BQU0sSUFBSSxHQUFHLElBQUksQ0FBQztJQUNsQixNQUFNLFFBQVEsR0FBRyxPQUFPLENBQUM7SUFFekIsTUFBTSxRQUFRLEdBQUcsU0FBUyxDQUFDO0lBQzNCLE1BQU0sUUFBUSxHQUFHLFVBQVUsQ0FBQztJQUU1QixNQUFNLFNBQVMsR0FBRyxJQUFJLGVBQVMsQ0FBQyxFQUFFLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRSxLQUFLLEVBQUUsU0FBUyxFQUFFLFNBQVMsRUFBRSxTQUFTLEVBQUUsSUFBSSxDQUFDLENBQUM7SUFDbEcsSUFBSSxRQUFvQixDQUFDO0lBRXpCLFNBQVMsQ0FBQyxHQUFHLEVBQUU7UUFDYixRQUFRLEdBQUcsSUFBSSxpQkFBVyxDQUFDLFNBQVMsQ0FBQyxDQUFDO0lBQ3hDLENBQUMsQ0FBQyxDQUFDO0lBRUgsU0FBUyxDQUFDLEdBQUcsRUFBRTtRQUNiLHlCQUFTLENBQUMsS0FBSyxFQUFFLENBQUM7SUFDcEIsQ0FBQyxDQUFDLENBQUM7SUFFSCxJQUFJLENBQUMsWUFBWSxFQUFFLEdBQVMsRUFBRTtRQUM1QixNQUFNLE1BQU0sR0FBb0IsUUFBUSxDQUFDLFVBQVUsQ0FBQyxRQUFRLEVBQUUsUUFBUSxDQUFDLENBQUM7UUFDeEUsTUFBTSxPQUFPLEdBQVU7WUFDckIsTUFBTSxFQUFFO2dCQUNOLE9BQU8sRUFBRSxJQUFJO2FBQ2Q7U0FDRixDQUFDO1FBQ0YsTUFBTSxXQUFXLEdBQUc7WUFDbEIsSUFBSSxFQUFFLE9B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Q3JCLE1BQU0sRUFBRTtnQkFDTixLQUFLLEVBQUUsUUFBUTthQUNoQjtTQUNGLENBQUM7UUFDRixNQUFNLFdBQVcsR0FBRztZQUNsQixJQUFJLEVBQUUsT0FBTztTQUNkLENBQUM7UUFFRix5QkFBUyxDQUFDLFlBQVksQ0FBQyxXQUFXLENBQUMsQ0FBQztRQUNwQyxNQUFNLFFBQVEsR0FBaUIsTUFBTSxNQUFNLENBQUM7UUFFNUMsTUFBTSxDQUFDLHlCQUFTLENBQUMsT0FBTyxDQUFDLENBQUMscUJBQXFCLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDbkQsTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztJQUNsQyxDQUFDLENBQUEsQ0FBQyxDQUFDO0FBQ0wsQ0FBQyxDQUFDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgbW9ja0F4aW9zIGZyb20gJ2plc3QtbW9jay1heGlvcyc7XG5cbmltcG9ydCB7IEF2YWxhbmNoZSB9IGZyb20gJ3NyYyc7XG5pbXBvcnQgeyBLZXlzdG9yZUFQSSB9IGZyb20gJ3NyYy9hcGlzL2tleXN0b3JlL2FwaSc7XG5cbmRlc2NyaWJlKCdLZXlzdG9yZScsICgpID0+IHtcbiAgY29uc3QgaXAgPSAnMTI3LjAuMC4xJztcbiAgY29uc3QgcG9ydCA9IDk2NTA7XG4gIGNvbnN0IHByb3RvY29sID0gJ2h0dHBzJztcblxuICBjb25zdCB1c2VybmFtZSA9ICdBdmFMYWJzJztcbiAgY29uc3QgcGFzc3dvcmQgPSAncGFzc3dvcmQnO1xuXG4gIGNvbnN0IGF2YWxhbmNoZSA9IG5ldyBBdmFsYW5jaGUoaXAsIHBvcnQsIHByb3RvY29sLCAxMjM0NSwgdW5kZWZpbmVkLCB1bmRlZmluZWQsIHVuZGVmaW5lZCwgdHJ1ZSk7XG4gIGxldCBrZXlzdG9yZTpLZXlzdG9yZUFQSTtcblxuICBiZWZvcmVBbGwoKCkgPT4ge1xuICAgIGtleXN0b3JlID0gbmV3IEtleXN0b3JlQVBJKGF2YWxhbmNoZSk7XG4gIH0pO1xuXG4gIGFmdGVyRWFjaCgoKSA9PiB7XG4gICAgbW9ja0F4aW9zLnJlc2V0KCk7XG4gIH0pO1xuXG4gIHRlc3QoJ2NyZWF0ZVVzZXInLCBhc3luYyAoKSA9PiB7XG4gICAgY29uc3QgcmVzdWx0OlByb21pc2U8Ym9vbGVhbj4gPSBrZXlzdG9yZS5jcmVhdGVVc2VyKHVzZXJuYW1lLCBwYXNzd29yZCk7XG4gICAgY29uc3QgcGF5bG9hZDpvYmplY3QgPSB7XG4gICAgICByZXN1bHQ6IHtcbiAgICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgIH0sXG4gICAgfTtcbiAgICBjb25zdCByZXNwb25zZU9iaiA9IHtcbiAgICAgIGRhdGE6IHBheWxvYWQsXG4gICAgfTtcblxuICAgIG1vY2tBeGlvcy5tb2NrUmVzcG9uc2UocmVzcG9uc2VPYmopO1xuICAgIGNvbnN0IHJlc3BvbnNlOmJvb2xlYW4gPSBhd2FpdCByZXN1bHQ7XG5cbiAgICBleHBlY3QobW9ja0F4aW9zLnJlcXVlc3QpLnRvSGF2ZUJlZW5DYWxsZWRUaW1lcygxKTtcbiAgICBleHBlY3QocmVzcG9uc2UpLnRvQmUodHJ1ZSk7XG4gIH0pO1xuXG4gIHRlc3QoJ2RlbGV0ZVVzZXInLCBhc3luYyAoKSA9PiB7XG4gICAgY29uc3QgcmVzdWx0OlByb21pc2U8Ym9vbGVhbj4gPSBrZXlzdG9yZS5kZWxldGVVc2VyKHVzZXJuYW1lLCBwYXNzd29yZCk7XG4gICAgY29uc3QgcGF5bG9hZDpvYmplY3QgPSB7XG4gICAgICByZXN1bHQ6IHtcbiAgICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgIH0sXG4gICAgfTtcbiAgICBjb25zdCByZXNwb25zZU9iaiA9IHtcbiAgICAgIGRhdGE6IHBheWxvYWQsXG4gICAgfTtcblxuICAgIG1vY2tBeGlvcy5tb2NrUmVzcG9uc2UocmVzcG9uc2VPYmopO1xuICAgIGNvbnN0IHJlc3BvbnNlOmJvb2xlYW4gPSBhd2FpdCByZXN1bHQ7XG5cbiAgICBleHBlY3QobW9ja0F4aW9zLnJlcXVlc3QpLnRvSGF2ZUJlZW5DYWxsZWRUaW1lcygxKTtcbiAgICBleHBlY3QocmVzcG9uc2UpLnRvQmUodHJ1ZSk7XG4gIH0pO1xuXG4gIHRlc3QoJ2V4cG9ydFVzZXInLCBhc3luYyAoKSA9PiB7XG4gICAgY29uc3QgZGF0YSA9ICdkYXRhJztcblxuICAgIGNvbnN0IHJlc3VsdDpQcm9taXNlPHN0cmluZz4gPSBrZXlzdG9yZS5leHBvcnRVc2VyKHVzZXJuYW1lLCBwYXNzd29yZCk7XG4gICAgY29uc3QgcGF5bG9hZDpvYmplY3QgPSB7XG4gICAgICByZXN1bHQ6IHtcbiAgICAgICAgdXNlcjogZGF0YSxcbiAgICAgIH0sXG4gICAgfTtcbiAgICBjb25zdCByZXNwb25zZU9iaiA9IHtcbiAgICAgIGRhdGE6IHBheWxvYWQsXG4gICAgfTtcblxuICAgIG1vY2tBeGlvcy5tb2NrUmVzcG9uc2UocmVzcG9uc2VPYmopO1xuICAgIGNvbnN0IHJlc3BvbnNlOnN0cmluZyA9IGF3YWl0IHJlc3VsdDtcblxuICAgIGV4cGVjdChtb2NrQXhpb3MucmVxdWVzdCkudG9IYXZlQmVlbkNhbGxlZFRpbWVzKDEpO1xuICAgIGV4cGVjdChyZXNwb25zZSkudG9CZShkYXRhKTtcbiAgfSk7XG5cbiAgdGVzdCgnaW1wb3J0VXNlcicsIGFzeW5jICgpID0+IHtcbiAgICBjb25zdCByZXN1bHQ6UHJvbWlzZTxib29sZWFuPiA9IGtleXN0b3JlLmltcG9ydFVzZXIodXNlcm5hbWUsICdkYXRhJywgcGFzc3dvcmQpO1xuICAgIGNvbnN0IHBheWxvYWQ6b2JqZWN0ID0ge1xuICAgICAgcmVzdWx0OiB7XG4gICAgICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgICB9LFxuICAgIH07XG4gICAgY29uc3QgcmVzcG9uc2VPYmogPSB7XG4gICAgICBkYXRhOiBwYXlsb2FkLFxuICAgIH07XG5cbiAgICBtb2NrQXhpb3MubW9ja1Jlc3BvbnNlKHJlc3BvbnNlT2JqKTtcbiAgICBjb25zdCByZXNwb25zZTpib29sZWFuID0gYXdhaXQgcmVzdWx0O1xuXG4gICAgZXhwZWN0KG1vY2tBeGlvcy5yZXF1ZXN0KS50b0hhdmVCZWVuQ2FsbGVkVGltZXMoMSk7XG4gICAgZXhwZWN0KHJlc3BvbnNlKS50b0JlKHRydWUpO1xuICB9KTtcblxuICB0ZXN0KCdsaXN0VXNlcnMnLCBhc3luYyAoKSA9PiB7XG4gICAgY29uc3QgYWNjb3VudHMgPSBbJ2FjYzEnLCAnYWNjMiddO1xuXG4gICAgY29uc3QgcmVzdWx0OlByb21pc2U8QXJyYXk8c3RyaW5nPj4gPSBrZXlzdG9yZS5saXN0VXNlcnMoKTtcbiAgICBjb25zdCBwYXlsb2FkOm9iamVjdCA9IHtcbiAgICAgIHJlc3VsdDoge1xuICAgICAgICB1c2VyczogYWNjb3VudHMsXG4gICAgICB9LFxuICAgIH07XG4gICAgY29uc3QgcmVzcG9uc2VPYmogPSB7XG4gICAgICBkYXRhOiBwYXlsb2FkLFxuICAgIH07XG5cbiAgICBtb2NrQXhpb3MubW9ja1Jlc3BvbnNlKHJlc3BvbnNlT2JqKTtcbiAgICBjb25zdCByZXNwb25zZTpBcnJheTxzdHJpbmc+ID0gYXdhaXQgcmVzdWx0O1xuXG4gICAgZXhwZWN0KG1vY2tBeGlvcy5yZXF1ZXN0KS50b0hhdmVCZWVuQ2FsbGVkVGltZXMoMSk7XG4gICAgZXhwZWN0KHJlc3BvbnNlKS50b0JlKGFjY291bnRzKTtcbiAgfSk7XG59KTtcbiJdfQ==