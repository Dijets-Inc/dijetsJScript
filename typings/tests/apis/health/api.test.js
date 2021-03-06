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
const bintools_1 = __importDefault(require("src/utils/bintools"));
const api_1 = require("src/apis/health/api");
/**
 * @ignore
 */
const bintools = bintools_1.default.getInstance();
describe('Health', () => {
    const ip = '127.0.0.1';
    const port = 9650;
    const protocol = 'https';
    const dijets = new src_1.Dijets(ip, port, protocol, 12345, undefined, undefined, undefined, true);
    let health;
    beforeAll(() => {
        health = new api_1.HealthAPI(dijets);
    });
    afterEach(() => {
        jest_mock_axios_1.default.reset();
    });
    test('getLiveness ', () => __awaiter(void 0, void 0, void 0, function* () {
        const result = health.getLiveness();
        const payload = {
            result: {
                checks: {
                    'network.validators.heartbeat': {
                        message: {
                            heartbeat: 1591041377,
                        },
                        timestamp: '2020-06-01T15:56:18.554202-04:00',
                        duration: 23201,
                        contiguousFailures: 0,
                        timeOfFirstFailure: null,
                    },
                },
                healthy: true,
            },
        };
        const responseObj = {
            data: payload,
        };
        jest_mock_axios_1.default.mockResponse(responseObj);
        const response = yield result;
        expect(jest_mock_axios_1.default.request).toHaveBeenCalledTimes(1);
        expect(response).toBe(payload.result);
    }));
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBpLnRlc3QuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi90ZXN0cy9hcGlzL2hlYWx0aC9hcGkudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7OztBQUFBLHNFQUF3QztBQUV4Qyw2QkFBZ0M7QUFDaEMsa0VBQTBDO0FBQzFDLDZDQUFnRDtBQUVoRDs7R0FFRztBQUNILE1BQU0sUUFBUSxHQUFHLGtCQUFRLENBQUMsV0FBVyxFQUFFLENBQUM7QUFFeEMsUUFBUSxDQUFDLFFBQVEsRUFBRSxHQUFHLEVBQUU7SUFDdEIsTUFBTSxFQUFFLEdBQUcsV0FBVyxDQUFDO0lBQ3ZCLE1BQU0sSUFBSSxHQUFHLElBQUksQ0FBQztJQUNsQixNQUFNLFFBQVEsR0FBRyxPQUFPLENBQUM7SUFFekIsTUFBTSxTQUFTLEdBQUcsSUFBSSxlQUFTLENBQUMsRUFBRSxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUUsS0FBSyxFQUFFLFNBQVMsRUFBRSxTQUFTLEVBQUUsU0FBUyxFQUFFLElBQUksQ0FBQyxDQUFDO0lBQ2xHLElBQUksTUFBZ0IsQ0FBQztJQUVyQixTQUFTLENBQUMsR0FBRyxFQUFFO1FBQ2IsTUFBTSxHQUFHLElBQUksZUFBUyxDQUFDLFNBQVMsQ0FBQyxDQUFDO0lBQ3BDLENBQUMsQ0FBQyxDQUFDO0lBRUgsU0FBUyxDQUFDLEdBQUcsRUFBRTtRQUNiLHlCQUFTLENBQUMsS0FBSyxFQUFFLENBQUM7SUFDcEIsQ0FBQyxDQUFDLENBQUM7SUFFSCxJQUFJLENBQUMsY0FBYyxFQUFFLEdBQVMsRUFBRTtRQUM5QixNQUFNLE1BQU0sR0FBbUIsTUFBTSxDQUFDLFdBQVcsRUFBRSxDQUFDO1FBQ3BELE1BQU0sT0FBTyxHQUFPO1lBQ2xCLE1BQU0sRUFBRTtnQkFDTixNQUFNLEVBQUU7b0JBQ04sOEJBQThCLEVBQUU7d0JBQzlCLE9BQU8sRUFBRTs0QkFDUCxTQUFTLEVBQUUsVUFBVTt5QkFDdEI7d0JBQ0QsU0FBUyxFQUFFLGtDQUFrQzt3QkFDN0MsUUFBUSxFQUFFLEtBQUs7d0JBQ2Ysa0JBQWtCLEVBQUUsQ0FBQzt3QkFDckIsa0JBQWtCLEVBQUUsSUFBSTtxQkFDekI7aUJBQ0Y7Z0JBQ0QsT0FBTyxFQUFFLElBQUk7YUFDZDtTQUNGLENBQUM7UUFDRixNQUFNLFdBQVcsR0FBRztZQUNsQixJQUFJLEVBQUUsT0FBTztTQUNkLENBQUM7UUFFRix5QkFBUyxDQUFDLFlBQVksQ0FBQyxXQUFXLENBQUMsQ0FBQztRQUNwQyxNQUFNLFFBQVEsR0FBTyxNQUFNLE1BQU0sQ0FBQztRQUVsQyxNQUFNLENBQUMseUJBQVMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxxQkFBcUIsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNuRCxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUN4QyxDQUFDLENBQUEsQ0FBQyxDQUFDO0FBQ0wsQ0FBQyxDQUFDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgbW9ja0F4aW9zIGZyb20gJ2plc3QtbW9jay1heGlvcyc7XG5cbmltcG9ydCB7IEF2YWxhbmNoZSB9IGZyb20gJ3NyYyc7XG5pbXBvcnQgQmluVG9vbHMgZnJvbSAnc3JjL3V0aWxzL2JpbnRvb2xzJztcbmltcG9ydCB7IEhlYWx0aEFQSSB9IGZyb20gJ3NyYy9hcGlzL2hlYWx0aC9hcGknO1xuXG4vKipcbiAqIEBpZ25vcmVcbiAqL1xuY29uc3QgYmludG9vbHMgPSBCaW5Ub29scy5nZXRJbnN0YW5jZSgpO1xuXG5kZXNjcmliZSgnSGVhbHRoJywgKCkgPT4ge1xuICBjb25zdCBpcCA9ICcxMjcuMC4wLjEnO1xuICBjb25zdCBwb3J0ID0gOTY1MDtcbiAgY29uc3QgcHJvdG9jb2wgPSAnaHR0cHMnO1xuXG4gIGNvbnN0IGF2YWxhbmNoZSA9IG5ldyBBdmFsYW5jaGUoaXAsIHBvcnQsIHByb3RvY29sLCAxMjM0NSwgdW5kZWZpbmVkLCB1bmRlZmluZWQsIHVuZGVmaW5lZCwgdHJ1ZSk7XG4gIGxldCBoZWFsdGg6SGVhbHRoQVBJO1xuXG4gIGJlZm9yZUFsbCgoKSA9PiB7XG4gICAgaGVhbHRoID0gbmV3IEhlYWx0aEFQSShhdmFsYW5jaGUpO1xuICB9KTtcblxuICBhZnRlckVhY2goKCkgPT4ge1xuICAgIG1vY2tBeGlvcy5yZXNldCgpO1xuICB9KTtcblxuICB0ZXN0KCdnZXRMaXZlbmVzcyAnLCBhc3luYyAoKSA9PiB7XG4gICAgY29uc3QgcmVzdWx0OlByb21pc2U8b2JqZWN0PiA9IGhlYWx0aC5nZXRMaXZlbmVzcygpO1xuICAgIGNvbnN0IHBheWxvYWQ6YW55ID0ge1xuICAgICAgcmVzdWx0OiB7XG4gICAgICAgIGNoZWNrczoge1xuICAgICAgICAgICduZXR3b3JrLnZhbGlkYXRvcnMuaGVhcnRiZWF0Jzoge1xuICAgICAgICAgICAgbWVzc2FnZToge1xuICAgICAgICAgICAgICBoZWFydGJlYXQ6IDE1OTEwNDEzNzcsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdGltZXN0YW1wOiAnMjAyMC0wNi0wMVQxNTo1NjoxOC41NTQyMDItMDQ6MDAnLFxuICAgICAgICAgICAgZHVyYXRpb246IDIzMjAxLFxuICAgICAgICAgICAgY29udGlndW91c0ZhaWx1cmVzOiAwLFxuICAgICAgICAgICAgdGltZU9mRmlyc3RGYWlsdXJlOiBudWxsLFxuICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIGhlYWx0aHk6IHRydWUsXG4gICAgICB9LFxuICAgIH07XG4gICAgY29uc3QgcmVzcG9uc2VPYmogPSB7XG4gICAgICBkYXRhOiBwYXlsb2FkLFxuICAgIH07XG5cbiAgICBtb2NrQXhpb3MubW9ja1Jlc3BvbnNlKHJlc3BvbnNlT2JqKTtcbiAgICBjb25zdCByZXNwb25zZTphbnkgPSBhd2FpdCByZXN1bHQ7XG5cbiAgICBleHBlY3QobW9ja0F4aW9zLnJlcXVlc3QpLnRvSGF2ZUJlZW5DYWxsZWRUaW1lcygxKTtcbiAgICBleHBlY3QocmVzcG9uc2UpLnRvQmUocGF5bG9hZC5yZXN1bHQpO1xuICB9KTtcbn0pO1xuIl19