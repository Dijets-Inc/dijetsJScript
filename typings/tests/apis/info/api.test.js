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
const bn_js_1 = __importDefault(require("bn.js"));
describe('Info', () => {
    const ip = '127.0.0.1';
    const port = 9650;
    const protocol = 'https';
    const dijets = new src_1.Dijets(ip, port, protocol, 12345, 'What is my purpose? You pass butter. Oh my god.', undefined, undefined, false);
    let info;
    beforeAll(() => {
        info = dijets.Info();
    });
    afterEach(() => {
        jest_mock_axios_1.default.reset();
    });
    test('getBlockchainID', () => __awaiter(void 0, void 0, void 0, function* () {
        const result = info.getBlockchainID('X');
        const payload = {
            result: {
                blockchainID: dijets.XChain().getBlockchainID(),
            },
        };
        const responseObj = {
            data: payload,
        };
        jest_mock_axios_1.default.mockResponse(responseObj);
        const response = yield result;
        expect(jest_mock_axios_1.default.request).toHaveBeenCalledTimes(1);
        expect(response).toBe('What is my purpose? You pass butter. Oh my god.');
    }));
    test('getNetworkID', () => __awaiter(void 0, void 0, void 0, function* () {
        const result = info.getNetworkID();
        const payload = {
            result: {
                networkID: 12345,
            },
        };
        const responseObj = {
            data: payload,
        };
        jest_mock_axios_1.default.mockResponse(responseObj);
        const response = yield result;
        expect(jest_mock_axios_1.default.request).toHaveBeenCalledTimes(1);
        expect(response).toBe(12345);
    }));
    test('getTxFee', () => __awaiter(void 0, void 0, void 0, function* () {
        const result = info.getTxFee();
        const payload = {
            result: {
                txFee: "1000000",
                creationTxFee: "10000000"
            },
        };
        const responseObj = {
            data: payload,
        };
        jest_mock_axios_1.default.mockResponse(responseObj);
        const response = yield result;
        expect(jest_mock_axios_1.default.request).toHaveBeenCalledTimes(1);
        expect(response.txFee.eq(new bn_js_1.default('1000000'))).toBe(true);
        expect(response.creationTxFee.eq(new bn_js_1.default('10000000'))).toBe(true);
    }));
    test('getNetworkName', () => __awaiter(void 0, void 0, void 0, function* () {
        const result = info.getNetworkName();
        const payload = {
            result: {
                networkName: 'denali',
            },
        };
        const responseObj = {
            data: payload,
        };
        jest_mock_axios_1.default.mockResponse(responseObj);
        const response = yield result;
        expect(jest_mock_axios_1.default.request).toHaveBeenCalledTimes(1);
        expect(response).toBe('denali');
    }));
    test('getNodeID', () => __awaiter(void 0, void 0, void 0, function* () {
        const result = info.getNodeID();
        const payload = {
            result: {
                nodeID: 'abcd',
            },
        };
        const responseObj = {
            data: payload,
        };
        jest_mock_axios_1.default.mockResponse(responseObj);
        const response = yield result;
        expect(jest_mock_axios_1.default.request).toHaveBeenCalledTimes(1);
        expect(response).toBe('abcd');
    }));
    test('getNodeVersion', () => __awaiter(void 0, void 0, void 0, function* () {
        const result = info.getNodeVersion();
        const payload = {
            result: {
                version: 'dijets/0.5.5',
            },
        };
        const responseObj = {
            data: payload,
        };
        jest_mock_axios_1.default.mockResponse(responseObj);
        const response = yield result;
        expect(jest_mock_axios_1.default.request).toHaveBeenCalledTimes(1);
        expect(response).toBe('dijets/0.5.5');
    }));
    test('isBootstrapped false', () => __awaiter(void 0, void 0, void 0, function* () {
        const result = info.isBootstrapped('X');
        const payload = {
            result: {
                isBootstrapped: false,
            },
        };
        const responseObj = {
            data: payload,
        };
        jest_mock_axios_1.default.mockResponse(responseObj);
        const response = yield result;
        expect(jest_mock_axios_1.default.request).toHaveBeenCalledTimes(1);
        expect(response).toBe(false);
    }));
    test('isBootstrapped true', () => __awaiter(void 0, void 0, void 0, function* () {
        const result = info.isBootstrapped('P');
        const payload = {
            result: {
                isBootstrapped: true,
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
    test('peers', () => __awaiter(void 0, void 0, void 0, function* () {
        const peers = ['p1', 'p2'];
        const result = info.peers();
        const payload = {
            result: {
                peers,
            },
        };
        const responseObj = {
            data: payload,
        };
        jest_mock_axios_1.default.mockResponse(responseObj);
        const response = yield result;
        expect(jest_mock_axios_1.default.request).toHaveBeenCalledTimes(1);
        expect(response).toBe(peers);
    }));
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBpLnRlc3QuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi90ZXN0cy9hcGlzL2luZm8vYXBpLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7QUFBQSxzRUFBd0M7QUFDeEMsNkJBQWdDO0FBRWhDLGtEQUF1QjtBQUV2QixRQUFRLENBQUMsTUFBTSxFQUFFLEdBQUcsRUFBRTtJQUNwQixNQUFNLEVBQUUsR0FBVSxXQUFXLENBQUM7SUFDOUIsTUFBTSxJQUFJLEdBQVUsSUFBSSxDQUFDO0lBQ3pCLE1BQU0sUUFBUSxHQUFVLE9BQU8sQ0FBQztJQUVoQyxNQUFNLFNBQVMsR0FBYSxJQUFJLGVBQVMsQ0FBQyxFQUFFLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRSxLQUFLLEVBQUUsaURBQWlELEVBQUUsU0FBUyxFQUFFLFNBQVMsRUFBRSxLQUFLLENBQUMsQ0FBQztJQUNySixJQUFJLElBQVksQ0FBQztJQUVqQixTQUFTLENBQUMsR0FBRyxFQUFFO1FBQ2IsSUFBSSxHQUFHLFNBQVMsQ0FBQyxJQUFJLEVBQUUsQ0FBQztJQUMxQixDQUFDLENBQUMsQ0FBQztJQUVILFNBQVMsQ0FBQyxHQUFHLEVBQUU7UUFDYix5QkFBUyxDQUFDLEtBQUssRUFBRSxDQUFDO0lBQ3BCLENBQUMsQ0FBQyxDQUFDO0lBRUgsSUFBSSxDQUFDLGlCQUFpQixFQUFFLEdBQVMsRUFBRTtRQUNqQyxNQUFNLE1BQU0sR0FBbUIsSUFBSSxDQUFDLGVBQWUsQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUN6RCxNQUFNLE9BQU8sR0FBVTtZQUNyQixNQUFNLEVBQUU7Z0JBQ04sWUFBWSxFQUFFLFNBQVMsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxlQUFlLEVBQUU7YUFDbkQ7U0FDRixDQUFDO1FBQ0YsTUFBTSxXQUFXLEdBQUc7WUFDbEIsSUFBSSxFQUFFLE9BQU87U0FDZCxDQUFDO1FBRUYseUJBQVMsQ0FBQyxZQUFZLENBQUMsV0FBVyxDQUFD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QUFNLE9BQU8sR0FBVTtZQUNyQixNQUFNLEVBQUU7Z0JBQ04sS0FBSzthQUNOO1NBQ0YsQ0FBQztRQUNGLE1BQU0sV0FBVyxHQUFHO1lBQ2xCLElBQUksRUFBRSxPQUFPO1NBQ2QsQ0FBQztRQUVGLHlCQUFTLENBQUMsWUFBWSxDQUFDLFdBQVcsQ0FBQyxDQUFDO1FBQ3BDLE1BQU0sUUFBUSxHQUFpQixNQUFNLE1BQU0sQ0FBQztRQUU1QyxNQUFNLENBQUMseUJBQVMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxxQkFBcUIsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNuRCxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQy9CLENBQUMsQ0FBQSxDQUFDLENBQUM7QUFDTCxDQUFDLENBQUMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBtb2NrQXhpb3MgZnJvbSAnamVzdC1tb2NrLWF4aW9zJztcbmltcG9ydCB7IEF2YWxhbmNoZSB9IGZyb20gJ3NyYyc7XG5pbXBvcnQgeyBJbmZvQVBJIH0gZnJvbSAnc3JjL2FwaXMvaW5mby9hcGknO1xuaW1wb3J0IEJOIGZyb20gXCJibi5qc1wiO1xuXG5kZXNjcmliZSgnSW5mbycsICgpID0+IHtcbiAgY29uc3QgaXA6c3RyaW5nID0gJzEyNy4wLjAuMSc7XG4gIGNvbnN0IHBvcnQ6bnVtYmVyID0gOTY1MDtcbiAgY29uc3QgcHJvdG9jb2w6c3RyaW5nID0gJ2h0dHBzJztcblxuICBjb25zdCBhdmFsYW5jaGU6QXZhbGFuY2hlID0gbmV3IEF2YWxhbmNoZShpcCwgcG9ydCwgcHJvdG9jb2wsIDEyMzQ1LCAnV2hhdCBpcyBteSBwdXJwb3NlPyBZb3UgcGFzcyBidXR0ZXIuIE9oIG15IGdvZC4nLCB1bmRlZmluZWQsIHVuZGVmaW5lZCwgZmFsc2UpO1xuICBsZXQgaW5mbzpJbmZvQVBJO1xuXG4gIGJlZm9yZUFsbCgoKSA9PiB7XG4gICAgaW5mbyA9IGF2YWxhbmNoZS5JbmZvKCk7XG4gIH0pO1xuXG4gIGFmdGVyRWFjaCgoKSA9PiB7XG4gICAgbW9ja0F4aW9zLnJlc2V0KCk7XG4gIH0pO1xuXG4gIHRlc3QoJ2dldEJsb2NrY2hhaW5JRCcsIGFzeW5jICgpID0+IHtcbiAgICBjb25zdCByZXN1bHQ6UHJvbWlzZTxzdHJpbmc+ID0gaW5mby5nZXRCbG9ja2NoYWluSUQoJ1gnKTtcbiAgICBjb25zdCBwYXlsb2FkOm9iamVjdCA9IHtcbiAgICAgIHJlc3VsdDoge1xuICAgICAgICBibG9ja2NoYWluSUQ6IGF2YWxhbmNoZS5YQ2hhaW4oKS5nZXRCbG9ja2NoYWluSUQoKSxcbiAgICAgIH0sXG4gICAgfTtcbiAgICBjb25zdCByZXNwb25zZU9iaiA9IHtcbiAgICAgIGRhdGE6IHBheWxvYWQsXG4gICAgfTtcblxuICAgIG1vY2tBeGlvcy5tb2NrUmVzcG9uc2UocmVzcG9uc2VPYmopO1xuICAgIGNvbnN0IHJlc3BvbnNlOnN0cmluZyA9IGF3YWl0IHJlc3VsdDtcblxuICAgIGV4cGVjdChtb2NrQXhpb3MucmVxdWVzdCkudG9IYXZlQmVlbkNhbGxlZFRpbWVzKDEpO1xuICAgIGV4cGVjdChyZXNwb25zZSkudG9CZSgnV2hhdCBpcyBteSBwdXJwb3NlPyBZb3UgcGFzcyBidXR0ZXIuIE9oIG15IGdvZC4nKTtcbiAgfSk7XG5cbiAgdGVzdCgnZ2V0TmV0d29ya0lEJywgYXN5bmMgKCkgPT4ge1xuICAgIGNvbnN0IHJlc3VsdDpQcm9taXNlPG51bWJlcj4gPSBpbmZvLmdldE5ldHdvcmtJRCgpO1xuICAgIGNvbnN0IHBheWxvYWQ6b2JqZWN0ID0ge1xuICAgICAgcmVzdWx0OiB7XG4gICAgICAgIG5ldHdvcmtJRDogMTIzNDUsXG4gICAgICB9LFxuICAgIH07XG4gICAgY29uc3QgcmVzcG9uc2VPYmogPSB7XG4gICAgICBkYXRhOiBwYXlsb2FkLFxuICAgIH07XG5cbiAgICBtb2NrQXhpb3MubW9ja1Jlc3BvbnNlKHJlc3BvbnNlT2JqKTtcbiAgICBjb25zdCByZXNwb25zZTpudW1iZXIgPSBhd2FpdCByZXN1bHQ7XG5cbiAgICBleHBlY3QobW9ja0F4aW9zLnJlcXVlc3QpLnRvSGF2ZUJlZW5DYWxsZWRUaW1lcygxKTtcbiAgICBleHBlY3QocmVzcG9uc2UpLnRvQmUoMTIzNDUpO1xuICB9KTtcblxuICB0ZXN0KCdnZXRUeEZlZScsIGFzeW5jICgpID0+IHtcbiAgICBjb25zdCByZXN1bHQ6UHJvbWlzZTx7dHhGZWU6Qk4sIGNyZWF0aW9uVHhGZWU6Qk59PiA9IGluZm8uZ2V0VHhGZWUoKTtcbiAgICBjb25zdCBwYXlsb2FkOm9iamVjdCA9IHtcbiAgICAgIHJlc3VsdDoge1xuICAgICAgICB0eEZlZTogXCIxMDAwMDAwXCIsXG4gICAgICAgIGNyZWF0aW9uVHhGZWU6IFwiMTAwMDAwMDBcIlxuICAgICAgfSxcbiAgICB9O1xuICAgIGNvbnN0IHJlc3BvbnNlT2JqID0ge1xuICAgICAgZGF0YTogcGF5bG9hZCxcbiAgICB9O1xuXG4gICAgbW9ja0F4aW9zLm1vY2tSZXNwb25zZShyZXNwb25zZU9iaik7XG4gICAgY29uc3QgcmVzcG9uc2U6e3R4RmVlOkJOLCBjcmVhdGlvblR4RmVlOkJOfSA9IGF3YWl0IHJlc3VsdDtcblxuICAgIGV4cGVjdChtb2NrQXhpb3MucmVxdWVzdCkudG9IYXZlQmVlbkNhbGxlZFRpbWVzKDEpO1xuICAgIGV4cGVjdChyZXNwb25zZS50eEZlZS5lcShuZXcgQk4oJzEwMDAwMDAnKSkpLnRvQmUodHJ1ZSk7XG4gICAgZXhwZWN0KHJlc3BvbnNlLmNyZWF0aW9uVHhGZWUuZXEobmV3IEJOKCcxMDAwMDAwMCcpKSkudG9CZSh0cnVlKTtcbiAgfSk7XG5cbiAgdGVzdCgnZ2V0TmV0d29ya05hbWUnLCBhc3luYyAoKSA9PiB7XG4gICAgY29uc3QgcmVzdWx0OlByb21pc2U8c3RyaW5nPiA9IGluZm8uZ2V0TmV0d29ya05hbWUoKTtcbiAgICBjb25zdCBwYXlsb2FkOm9iamVjdCA9IHtcbiAgICAgIHJlc3VsdDoge1xuICAgICAgICBuZXR3b3JrTmFtZTogJ2RlbmFsaScsXG4gICAgICB9LFxuICAgIH07XG4gICAgY29uc3QgcmVzcG9uc2VPYmogPSB7XG4gICAgICBkYXRhOiBwYXlsb2FkLFxuICAgIH07XG5cbiAgICBtb2NrQXhpb3MubW9ja1Jlc3BvbnNlKHJlc3BvbnNlT2JqKTtcbiAgICBjb25zdCByZXNwb25zZTpzdHJpbmcgPSBhd2FpdCByZXN1bHQ7XG5cbiAgICBleHBlY3QobW9ja0F4aW9zLnJlcXVlc3QpLnRvSGF2ZUJlZW5DYWxsZWRUaW1lcygxKTtcbiAgICBleHBlY3QocmVzcG9uc2UpLnRvQmUoJ2RlbmFsaScpO1xuICB9KTtcblxuICB0ZXN0KCdnZXROb2RlSUQnLCBhc3luYyAoKSA9PiB7XG4gICAgY29uc3QgcmVzdWx0OlByb21pc2U8c3RyaW5nPiA9IGluZm8uZ2V0Tm9kZUlEKCk7XG4gICAgY29uc3QgcGF5bG9hZDpvYmplY3QgPSB7XG4gICAgICByZXN1bHQ6IHtcbiAgICAgICAgbm9kZUlEOiAnYWJjZCcsXG4gICAgICB9LFxuICAgIH07XG4gICAgY29uc3QgcmVzcG9uc2VPYmogPSB7XG4gICAgICBkYXRhOiBwYXlsb2FkLFxuICAgIH07XG5cbiAgICBtb2NrQXhpb3MubW9ja1Jlc3BvbnNlKHJlc3BvbnNlT2JqKTtcbiAgICBjb25zdCByZXNwb25zZTpzdHJpbmcgPSBhd2FpdCByZXN1bHQ7XG5cbiAgICBleHBlY3QobW9ja0F4aW9zLnJlcXVlc3QpLnRvSGF2ZUJlZW5DYWxsZWRUaW1lcygxKTtcbiAgICBleHBlY3QocmVzcG9uc2UpLnRvQmUoJ2FiY2QnKTtcbiAgfSk7XG5cbiAgdGVzdCgnZ2V0Tm9kZVZlcnNpb24nLCBhc3luYyAoKSA9PiB7XG4gICAgY29uc3QgcmVzdWx0OlByb21pc2U8c3RyaW5nPiA9IGluZm8uZ2V0Tm9kZVZlcnNpb24oKTtcbiAgICBjb25zdCBwYXlsb2FkOm9iamVjdCA9IHtcbiAgICAgIHJlc3VsdDoge1xuICAgICAgICB2ZXJzaW9uOiAnYXZhbGFuY2hlLzAuNS41JyxcbiAgICAgIH0sXG4gICAgfTtcbiAgICBjb25zdCByZXNwb25zZU9iaiA9IHtcbiAgICAgIGRhdGE6IHBheWxvYWQsXG4gICAgfTtcblxuICAgIG1vY2tBeGlvcy5tb2NrUmVzcG9uc2UocmVzcG9uc2VPYmopO1xuICAgIGNvbnN0IHJlc3BvbnNlOnN0cmluZyA9IGF3YWl0IHJlc3VsdDtcblxuICAgIGV4cGVjdChtb2NrQXhpb3MucmVxdWVzdCkudG9IYXZlQmVlbkNhbGxlZFRpbWVzKDEpO1xuICAgIGV4cGVjdChyZXNwb25zZSkudG9CZSgnYXZhbGFuY2hlLzAuNS41Jyk7XG4gIH0pO1xuXG4gIHRlc3QoJ2lzQm9vdHN0cmFwcGVkIGZhbHNlJywgYXN5bmMgKCkgPT4ge1xuICAgIGNvbnN0IHJlc3VsdDpQcm9taXNlPGJvb2xlYW4+ID0gaW5mby5pc0Jvb3RzdHJhcHBlZCgnWCcpO1xuICAgIGNvbnN0IHBheWxvYWQ6b2JqZWN0ID0ge1xuICAgICAgcmVzdWx0OiB7XG4gICAgICAgIGlzQm9vdHN0cmFwcGVkOiBmYWxzZSxcbiAgICAgIH0sXG4gICAgfTtcbiAgICBjb25zdCByZXNwb25zZU9iaiA9IHtcbiAgICAgIGRhdGE6IHBheWxvYWQsXG4gICAgfTtcblxuICAgIG1vY2tBeGlvcy5tb2NrUmVzcG9uc2UocmVzcG9uc2VPYmopO1xuICAgIGNvbnN0IHJlc3BvbnNlOmJvb2xlYW4gPSBhd2FpdCByZXN1bHQ7XG5cbiAgICBleHBlY3QobW9ja0F4aW9zLnJlcXVlc3QpLnRvSGF2ZUJlZW5DYWxsZWRUaW1lcygxKTtcbiAgICBleHBlY3QocmVzcG9uc2UpLnRvQmUoZmFsc2UpO1xuICB9KTtcblxuICB0ZXN0KCdpc0Jvb3RzdHJhcHBlZCB0cnVlJywgYXN5bmMgKCkgPT4ge1xuICAgIGNvbnN0IHJlc3VsdDpQcm9taXNlPGJvb2xlYW4+ID0gaW5mby5pc0Jvb3RzdHJhcHBlZCgnUCcpO1xuICAgIGNvbnN0IHBheWxvYWQ6b2JqZWN0ID0ge1xuICAgICAgcmVzdWx0OiB7XG4gICAgICAgIGlzQm9vdHN0cmFwcGVkOiB0cnVlLFxuICAgICAgfSxcbiAgICB9O1xuICAgIGNvbnN0IHJlc3BvbnNlT2JqID0ge1xuICAgICAgZGF0YTogcGF5bG9hZCxcbiAgICB9O1xuXG4gICAgbW9ja0F4aW9zLm1vY2tSZXNwb25zZShyZXNwb25zZU9iaik7XG4gICAgY29uc3QgcmVzcG9uc2U6Ym9vbGVhbiA9IGF3YWl0IHJlc3VsdDtcblxuICAgIGV4cGVjdChtb2NrQXhpb3MucmVxdWVzdCkudG9IYXZlQmVlbkNhbGxlZFRpbWVzKDEpO1xuICAgIGV4cGVjdChyZXNwb25zZSkudG9CZSh0cnVlKTtcbiAgfSk7XG5cbiAgdGVzdCgncGVlcnMnLCBhc3luYyAoKSA9PiB7XG4gICAgY29uc3QgcGVlcnMgPSBbJ3AxJywgJ3AyJ107XG4gICAgY29uc3QgcmVzdWx0OlByb21pc2U8QXJyYXk8c3RyaW5nPj4gPSBpbmZvLnBlZXJzKCk7XG4gICAgY29uc3QgcGF5bG9hZDpvYmplY3QgPSB7XG4gICAgICByZXN1bHQ6IHtcbiAgICAgICAgcGVlcnMsXG4gICAgICB9LFxuICAgIH07XG4gICAgY29uc3QgcmVzcG9uc2VPYmogPSB7XG4gICAgICBkYXRhOiBwYXlsb2FkLFxuICAgIH07XG5cbiAgICBtb2NrQXhpb3MubW9ja1Jlc3BvbnNlKHJlc3BvbnNlT2JqKTtcbiAgICBjb25zdCByZXNwb25zZTpBcnJheTxzdHJpbmc+ID0gYXdhaXQgcmVzdWx0O1xuXG4gICAgZXhwZWN0KG1vY2tBeGlvcy5yZXF1ZXN0KS50b0hhdmVCZWVuQ2FsbGVkVGltZXMoMSk7XG4gICAgZXhwZWN0KHJlc3BvbnNlKS50b0JlKHBlZXJzKTtcbiAgfSk7XG59KTtcbiJdfQ==