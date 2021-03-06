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
describe('IPCS', () => {
    const ip = '127.0.0.1';
    const port = 9650;
    const protocol = 'https';
    const dijets = new src_1.Dijets(ip, port, protocol, 12345);
    let ipcs;
    beforeAll(() => {
        ipcs = dijets.IPCS();
    });
    afterEach(() => {
        jest_mock_axios_1.default.reset();
    });
    test('publishBlockchain', () => __awaiter(void 0, void 0, void 0, function* () {
        const blockchainID = "11111111111111111111111111111111LpoYY";
        const result = ipcs.publishBlockchain(blockchainID);
        const payload = {
            result: {
                consensusURL: "/tmp/12345-11111111111111111111111111111111LpoYY-consensus",
                decisionsURL: "/tmp/12345-11111111111111111111111111111111LpoYY-decisions"
            },
        };
        const responseObj = {
            data: payload
        };
        jest_mock_axios_1.default.mockResponse(responseObj);
        const response = yield result;
        expect(jest_mock_axios_1.default.request).toHaveBeenCalledTimes(1);
        expect(response.consensusURL).toBe("/tmp/12345-11111111111111111111111111111111LpoYY-consensus");
        expect(response.decisionsURL).toBe("/tmp/12345-11111111111111111111111111111111LpoYY-decisions");
    }));
    test('unpublishBlockchain', () => __awaiter(void 0, void 0, void 0, function* () {
        const blockchainID = "11111111111111111111111111111111LpoYY";
        const result = ipcs.unpublishBlockchain(blockchainID);
        const payload = {
            result: {
                success: true
            },
        };
        const responseObj = {
            data: payload
        };
        jest_mock_axios_1.default.mockResponse(responseObj);
        const response = yield result;
        expect(jest_mock_axios_1.default.request).toHaveBeenCalledTimes(1);
        expect(response).toBe(true);
    }));
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBpLnRlc3QuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi90ZXN0cy9hcGlzL2lwY3MvYXBpLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7QUFBQSxzRUFBd0M7QUFDeEMsNkJBQWdDO0FBSWhDLFFBQVEsQ0FBQyxNQUFNLEVBQUUsR0FBRyxFQUFFO0lBQ3BCLE1BQU0sRUFBRSxHQUFVLFdBQVcsQ0FBQztJQUM5QixNQUFNLElBQUksR0FBVSxJQUFJLENBQUM7SUFDekIsTUFBTSxRQUFRLEdBQVUsT0FBTyxDQUFDO0lBRWhDLE1BQU0sU0FBUyxHQUFhLElBQUksZUFBUyxDQUFDLEVBQUUsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFLEtBQUssQ0FBQyxDQUFDO0lBQ3JFLElBQUksSUFBWSxDQUFDO0lBRWpCLFNBQVMsQ0FBQyxHQUFHLEVBQUU7UUFDYixJQUFJLEdBQUcsU0FBUyxDQUFDLElBQUksRUFBRSxDQUFDO0lBQzFCLENBQUMsQ0FBQyxDQUFDO0lBRUgsU0FBUyxDQUFDLEdBQUcsRUFBRTtRQUNiLHlCQUFTLENBQUMsS0FBSyxFQUFFLENBQUM7SUFDcEIsQ0FBQyxDQUFDLENBQUM7SUFFSCxJQUFJLENBQUMsbUJBQW1CLEVBQUUsR0FBUyxFQUFFO1FBQ25DLE1BQU0sWUFBWSxHQUFXLHVDQUF1QyxDQUFDO1FBQ3JFLE1BQU0sTUFBTSxHQUF1QyxJQUFJLENBQUMsaUJBQWlCLENBQUMsWUFBWSxDQUFDLENBQUM7UUFDeEYsTUFBTSxPQUFPLEdBQVU7WUFDckIsTUFBTSxFQUFFO2dCQUNOLFlBQVksRUFBRSw0REFBNEQ7Z0JBQzFFLFlBQVksRUFBRSw0REFBNEQ7YUFDM0U7U0FDRixDQUFDO1FBQ0YsTUFBTSxXQUFXLEdBQUc7WUFDbEIsSUFBSSxFQUFFLE9BQU87U0FDZCxDQUFDO1FBRUYseUJBQVMsQ0FBQyxZQUFZLENBQUMsV0FBVyxDQUFDLENBQUM7UUFDcEMsTUFBTSxRQUFRLEdBQThCLE1BQU0sTUFBTSxDQUFDO1FBRXpELE1BQU0sQ0FBQyx5QkFBUyxDQUFDLE9BQU8sQ0FBQyxDQUFDLHFCQUFxQixDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ25ELE1BQU0sQ0FBQyxRQUFRLENBQUMsWUFBWSxDQUFDLENBQUMsSUFBSSxDQUFDLDREQUE0RCxDQUFDLENBQUM7UUFDakcsTUFBTSxDQUFDLFFBQVEsQ0FBQyxZQUFZLENBQUMsQ0FBQyxJQUFJLENBQUMsNERBQTRELENBQUMsQ0FBQztJQUNuRyxDQUFDLENBQUEsQ0FBQyxDQUFDO0lBRUgsSUFBSSxDQUFDLHFCQUFxQixFQUFFLEdBQVMsRUFBRTtRQUNyQyxNQUFNLFlBQVksR0FBVyx1Q0FBdUMsQ0FBQztRQUNyRSxNQUFNLE1BQU0sR0FBb0IsSUFBSSxDQUFDLG1CQUFtQixDQUFDLFlBQVksQ0FBQyxDQUFDO1FBQ3ZFLE1BQU0sT0FBTyxHQUFVO1lBQ3JCLE1BQU0sRUFBRTtnQkFDTixPQUFPLEVBQUUsSUFBSTthQUNkO1NBQ0YsQ0FBQztRQUNGLE1BQU0sV0FBVyxHQUFHO1lBQ2xCLElBQUksRUFBRSxPQUFPO1NBQ2QsQ0FBQztRQUVGLHlCQUFTLENBQUMsWUFBWSxDQUFDLFdBQVcsQ0FBQyxDQUFDO1FBQ3BDLE1BQU0sUUFBUSxHQUFVLE1BQU0sTUFBTSxDQUFDO1FBRXJDLE1BQU0sQ0FBQyx5QkFBUyxDQUFDLE9BQU8sQ0FBQyxDQUFDLHFCQUFxQixDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ25ELE1BQU0sQ0FBQyxRQUFRLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDOUIsQ0FBQyxDQUFBLENBQUMsQ0FBQztBQUNMLENBQUMsQ0FBQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IG1vY2tBeGlvcyBmcm9tICdqZXN0LW1vY2stYXhpb3MnO1xuaW1wb3J0IHsgQXZhbGFuY2hlIH0gZnJvbSAnc3JjJztcbmltcG9ydCB7IElQQ1NBUEkgfSBmcm9tICdzcmMvYXBpcy9pcGNzL2FwaSc7XG5pbXBvcnQgeyBpUHVibGlzaEJsb2NrY2hhaW5SZXNwb25zZSB9IGZyb20gJ3NyYy9hcGlzL2lwY3MvaW50ZXJmYWNlcyc7XG5cbmRlc2NyaWJlKCdJUENTJywgKCkgPT4ge1xuICBjb25zdCBpcDpzdHJpbmcgPSAnMTI3LjAuMC4xJztcbiAgY29uc3QgcG9ydDpudW1iZXIgPSA5NjUwO1xuICBjb25zdCBwcm90b2NvbDpzdHJpbmcgPSAnaHR0cHMnO1xuXG4gIGNvbnN0IGF2YWxhbmNoZTpBdmFsYW5jaGUgPSBuZXcgQXZhbGFuY2hlKGlwLCBwb3J0LCBwcm90b2NvbCwgMTIzNDUpO1xuICBsZXQgaXBjczpJUENTQVBJO1xuXG4gIGJlZm9yZUFsbCgoKSA9PiB7XG4gICAgaXBjcyA9IGF2YWxhbmNoZS5JUENTKCk7XG4gIH0pO1xuXG4gIGFmdGVyRWFjaCgoKSA9PiB7XG4gICAgbW9ja0F4aW9zLnJlc2V0KCk7XG4gIH0pO1xuXG4gIHRlc3QoJ3B1Ymxpc2hCbG9ja2NoYWluJywgYXN5bmMgKCkgPT4ge1xuICAgIGNvbnN0IGJsb2NrY2hhaW5JRDogc3RyaW5nID0gXCIxMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMUxwb1lZXCI7XG4gICAgY29uc3QgcmVzdWx0OlByb21pc2U8aVB1Ymxpc2hCbG9ja2NoYWluUmVzcG9uc2U+ID0gaXBjcy5wdWJsaXNoQmxvY2tjaGFpbihibG9ja2NoYWluSUQpO1xuICAgIGNvbnN0IHBheWxvYWQ6b2JqZWN0ID0ge1xuICAgICAgcmVzdWx0OiB7XG4gICAgICAgIGNvbnNlbnN1c1VSTDogXCIvdG1wLzEyMzQ1LTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExTHBvWVktY29uc2Vuc3VzXCIsXG4gICAgICAgIGRlY2lzaW9uc1VSTDogXCIvdG1wLzEyMzQ1LTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExTHBvWVktZGVjaXNpb25zXCJcbiAgICAgIH0sXG4gICAgfTtcbiAgICBjb25zdCByZXNwb25zZU9iaiA9IHtcbiAgICAgIGRhdGE6IHBheWxvYWRcbiAgICB9O1xuXG4gICAgbW9ja0F4aW9zLm1vY2tSZXNwb25zZShyZXNwb25zZU9iaik7XG4gICAgY29uc3QgcmVzcG9uc2U6aVB1Ymxpc2hCbG9ja2NoYWluUmVzcG9uc2UgPSBhd2FpdCByZXN1bHQ7XG5cbiAgICBleHBlY3QobW9ja0F4aW9zLnJlcXVlc3QpLnRvSGF2ZUJlZW5DYWxsZWRUaW1lcygxKTtcbiAgICBleHBlY3QocmVzcG9uc2UuY29uc2Vuc3VzVVJMKS50b0JlKFwiL3RtcC8xMjM0NS0xMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMUxwb1lZLWNvbnNlbnN1c1wiKTtcbiAgICBleHBlY3QocmVzcG9uc2UuZGVjaXNpb25zVVJMKS50b0JlKFwiL3RtcC8xMjM0NS0xMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMUxwb1lZLWRlY2lzaW9uc1wiKTtcbiAgfSk7XG4gIFxuICB0ZXN0KCd1bnB1Ymxpc2hCbG9ja2NoYWluJywgYXN5bmMgKCkgPT4ge1xuICAgIGNvbnN0IGJsb2NrY2hhaW5JRDogc3RyaW5nID0gXCIxMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMUxwb1lZXCI7XG4gICAgY29uc3QgcmVzdWx0OlByb21pc2U8Ym9vbGVhbj4gPSBpcGNzLnVucHVibGlzaEJsb2NrY2hhaW4oYmxvY2tjaGFpbklEKTtcbiAgICBjb25zdCBwYXlsb2FkOm9iamVjdCA9IHtcbiAgICAgIHJlc3VsdDoge1xuICAgICAgICBzdWNjZXNzOiB0cnVlXG4gICAgICB9LFxuICAgIH07XG4gICAgY29uc3QgcmVzcG9uc2VPYmogPSB7XG4gICAgICBkYXRhOiBwYXlsb2FkXG4gICAgfTtcblxuICAgIG1vY2tBeGlvcy5tb2NrUmVzcG9uc2UocmVzcG9uc2VPYmopO1xuICAgIGNvbnN0IHJlc3BvbnNlOmJvb2xlYW49IGF3YWl0IHJlc3VsdDtcblxuICAgIGV4cGVjdChtb2NrQXhpb3MucmVxdWVzdCkudG9IYXZlQmVlbkNhbGxlZFRpbWVzKDEpO1xuICAgIGV4cGVjdChyZXNwb25zZSkudG9CZSh0cnVlKTtcbiAgfSk7XG59KTtcbiJdfQ==