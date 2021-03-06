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
const api_1 = require("src/apis/metrics/api");
describe('Metrics', () => {
    const ip = '127.0.0.1';
    const port = 9650;
    const protocol = 'https';
    const dijets = new src_1.Dijets(ip, port, protocol, 12345, undefined, undefined, undefined, true);
    let metrics;
    beforeAll(() => {
        metrics = new api_1.MetricsAPI(dijets);
    });
    afterEach(() => {
        jest_mock_axios_1.default.reset();
    });
    test('getMetrics', () => __awaiter(void 0, void 0, void 0, function* () {
        const result = metrics.getMetrics();
        const payload = `
              gecko_timestamp_handler_get_failed_bucket{le="100"} 0
              gecko_timestamp_handler_get_failed_bucket{le="1000"} 0
              gecko_timestamp_handler_get_failed_bucket{le="10000"} 0
              gecko_timestamp_handler_get_failed_bucket{le="100000"} 0
              gecko_timestamp_handler_get_failed_bucket{le="1e+06"} 0
              gecko_timestamp_handler_get_failed_bucket{le="1e+07"} 0
              gecko_timestamp_handler_get_failed_bucket{le="1e+08"} 0
              gecko_timestamp_handler_get_failed_bucket{le="1e+09"} 0
              gecko_timestamp_handler_get_failed_bucket{le="+Inf"} 0
        `;
        const responseObj = {
            data: payload,
        };
        jest_mock_axios_1.default.mockResponse(responseObj);
        const response = yield result;
        expect(jest_mock_axios_1.default.request).toHaveBeenCalledTimes(1);
        expect(response).toBe(payload);
    }));
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBpLnRlc3QuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi90ZXN0cy9hcGlzL21ldHJpY3MvYXBpLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7QUFBQSxzRUFBd0M7QUFDeEMsNkJBQWdDO0FBQ2hDLDhDQUFrRDtBQUVsRCxRQUFRLENBQUMsU0FBUyxFQUFFLEdBQUcsRUFBRTtJQUN2QixNQUFNLEVBQUUsR0FBRyxXQUFXLENBQUM7SUFDdkIsTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDO0lBQ2xCLE1BQU0sUUFBUSxHQUFHLE9BQU8sQ0FBQztJQUV6QixNQUFNLFNBQVMsR0FBRyxJQUFJLGVBQVMsQ0FBQyxFQUFFLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRSxLQUFLLEVBQUUsU0FBUyxFQUFFLFNBQVMsRUFBRSxTQUFTLEVBQUUsSUFBSSxDQUFDLENBQUM7SUFDbEcsSUFBSSxPQUFrQixDQUFDO0lBRXZCLFNBQVMsQ0FBQyxHQUFHLEVBQUU7UUFDYixPQUFPLEdBQUcsSUFBSSxnQkFBVSxDQUFDLFNBQVMsQ0FBQyxDQUFDO0lBQ3RDLENBQUMsQ0FBQyxDQUFDO0lBRUgsU0FBUyxDQUFDLEdBQUcsRUFBRTtRQUNiLHlCQUFTLENBQUMsS0FBSyxFQUFFLENBQUM7SUFDcEIsQ0FBQyxDQUFDLENBQUM7SUFFSCxJQUFJLENBQUMsWUFBWSxFQUFFLEdBQVMsRUFBRTtRQUM1QixNQUFNLE1BQU0sR0FBbUIsT0FBTyxDQUFDLFVBQVUsRUFBRSxDQUFDO1FBQ3BELE1BQU0sT0FBTyxHQUFVOzs7Ozs7Ozs7O1NBVWxCLENBQUM7UUFDTixNQUFNLFdBQVcsR0FBRztZQUNsQixJQUFJLEVBQUUsT0FBTztTQUNkLENBQUM7UUFFRix5QkFBUyxDQUFDLFlBQVksQ0FBQyxXQUFXLENBQUMsQ0FBQztRQUNwQyxNQUFNLFFBQVEsR0FBVSxNQUFNLE1BQU0sQ0FBQztRQUVyQyxNQUFNLENBQUMseUJBQVMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxxQkFBcUIsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNuRCxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBQ2pDLENBQUMsQ0FBQSxDQUFDLENBQUM7QUFDTCxDQUFDLENBQUMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBtb2NrQXhpb3MgZnJvbSAnamVzdC1tb2NrLWF4aW9zJztcbmltcG9ydCB7IEF2YWxhbmNoZSB9IGZyb20gJ3NyYyc7XG5pbXBvcnQgeyBNZXRyaWNzQVBJIH0gZnJvbSAnc3JjL2FwaXMvbWV0cmljcy9hcGknO1xuXG5kZXNjcmliZSgnTWV0cmljcycsICgpID0+IHtcbiAgY29uc3QgaXAgPSAnMTI3LjAuMC4xJztcbiAgY29uc3QgcG9ydCA9IDk2NTA7XG4gIGNvbnN0IHByb3RvY29sID0gJ2h0dHBzJztcblxuICBjb25zdCBhdmFsYW5jaGUgPSBuZXcgQXZhbGFuY2hlKGlwLCBwb3J0LCBwcm90b2NvbCwgMTIzNDUsIHVuZGVmaW5lZCwgdW5kZWZpbmVkLCB1bmRlZmluZWQsIHRydWUpO1xuICBsZXQgbWV0cmljczpNZXRyaWNzQVBJO1xuXG4gIGJlZm9yZUFsbCgoKSA9PiB7XG4gICAgbWV0cmljcyA9IG5ldyBNZXRyaWNzQVBJKGF2YWxhbmNoZSk7XG4gIH0pO1xuXG4gIGFmdGVyRWFjaCgoKSA9PiB7XG4gICAgbW9ja0F4aW9zLnJlc2V0KCk7XG4gIH0pO1xuXG4gIHRlc3QoJ2dldE1ldHJpY3MnLCBhc3luYyAoKSA9PiB7XG4gICAgY29uc3QgcmVzdWx0OlByb21pc2U8c3RyaW5nPiA9IG1ldHJpY3MuZ2V0TWV0cmljcygpO1xuICAgIGNvbnN0IHBheWxvYWQ6c3RyaW5nID0gYFxuICAgICAgICAgICAgICBnZWNrb190aW1lc3RhbXBfaGFuZGxlcl9nZXRfZmFpbGVkX2J1Y2tldHtsZT1cIjEwMFwifSAwXG4gICAgICAgICAgICAgIGdlY2tvX3RpbWVzdGFtcF9oYW5kbGVyX2dldF9mYWlsZWRfYnVja2V0e2xlPVwiMTAwMFwifSAwXG4gICAgICAgICAgICAgIGdlY2tvX3RpbWVzdGFtcF9oYW5kbGVyX2dldF9mYWlsZWRfYnVja2V0e2xlPVwiMTAwMDBcIn0gMFxuICAgICAgICAgICAgICBnZWNrb190aW1lc3RhbXBfaGFuZGxlcl9nZXRfZmFpbGVkX2J1Y2tldHtsZT1cIjEwMDAwMFwifSAwXG4gICAgICAgICAgICAgIGdlY2tvX3RpbWVzdGFtcF9oYW5kbGVyX2dldF9mYWlsZWRfYnVja2V0e2xlPVwiMWUrMDZcIn0gMFxuICAgICAgICAgICAgICBnZWNrb190aW1lc3RhbXBfaGFuZGxlcl9nZXRfZmFpbGVkX2J1Y2tldHtsZT1cIjFlKzA3XCJ9IDBcbiAgICAgICAgICAgICAgZ2Vja29fdGltZXN0YW1wX2hhbmRsZXJfZ2V0X2ZhaWxlZF9idWNrZXR7bGU9XCIxZSswOFwifSAwXG4gICAgICAgICAgICAgIGdlY2tvX3RpbWVzdGFtcF9oYW5kbGVyX2dldF9mYWlsZWRfYnVja2V0e2xlPVwiMWUrMDlcIn0gMFxuICAgICAgICAgICAgICBnZWNrb190aW1lc3RhbXBfaGFuZGxlcl9nZXRfZmFpbGVkX2J1Y2tldHtsZT1cIitJbmZcIn0gMFxuICAgICAgICBgO1xuICAgIGNvbnN0IHJlc3BvbnNlT2JqID0ge1xuICAgICAgZGF0YTogcGF5bG9hZCxcbiAgICB9O1xuXG4gICAgbW9ja0F4aW9zLm1vY2tSZXNwb25zZShyZXNwb25zZU9iaik7XG4gICAgY29uc3QgcmVzcG9uc2U6c3RyaW5nID0gYXdhaXQgcmVzdWx0O1xuXG4gICAgZXhwZWN0KG1vY2tBeGlvcy5yZXF1ZXN0KS50b0hhdmVCZWVuQ2FsbGVkVGltZXMoMSk7XG4gICAgZXhwZWN0KHJlc3BvbnNlKS50b0JlKHBheWxvYWQpO1xuICB9KTtcbn0pO1xuIl19