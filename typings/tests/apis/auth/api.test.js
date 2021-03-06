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
describe('Auth', () => {
    const ip = '127.0.0.1';
    const port = 9650;
    const protocol = 'https';
    const dijets = new src_1.Dijets(ip, port, protocol, 12345, 'What is my purpose? You pass butter. Oh my god.', undefined, undefined, false);
    let auth;
    // We think we're a Rick, but we're totally a Jerry.
    let password = "Weddings are basically funerals with a cake. -- Rich Sanchez";
    let newPassword = "Sometimes science is more art than science, Morty. -- Rich Sanchez";
    let testToken = "To live is to risk it all; otherwise you're just an inert chunk of randomly assembled molecules drifting wherever the universe blows you. -- Rick Sanchez";
    let testEndpoints = ["/ext/opt/bin/bash/foo", "/dev/null", "/tmp"];
    beforeAll(() => {
        auth = dijets.Auth();
    });
    afterEach(() => {
        jest_mock_axios_1.default.reset();
    });
    test('newToken', () => __awaiter(void 0, void 0, void 0, function* () {
        const result = auth.newToken(password, testEndpoints);
        const payload = {
            result: {
                token: testToken,
            },
        };
        const responseObj = {
            data: payload,
        };
        jest_mock_axios_1.default.mockResponse(responseObj);
        const response = yield result;
        expect(jest_mock_axios_1.default.request).toHaveBeenCalledTimes(1);
        expect(response).toBe(testToken);
    }));
    test('revokeToken', () => __awaiter(void 0, void 0, void 0, function* () {
        const result = auth.revokeToken(password, testToken);
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
    test('changePassword', () => __awaiter(void 0, void 0, void 0, function* () {
        const result = auth.changePassword(password, newPassword);
        const payload = {
            result: {
                success: false,
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
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBpLnRlc3QuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi90ZXN0cy9hcGlzL2F1dGgvYXBpLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7QUFBQSxzRUFBd0M7QUFDeEMsNkJBQWdDO0FBR2hDLFFBQVEsQ0FBQyxNQUFNLEVBQUUsR0FBRyxFQUFFO0lBQ3BCLE1BQU0sRUFBRSxHQUFVLFdBQVcsQ0FBQztJQUM5QixNQUFNLElBQUksR0FBVSxJQUFJLENBQUM7SUFDekIsTUFBTSxRQUFRLEdBQVUsT0FBTyxDQUFDO0lBRWhDLE1BQU0sU0FBUyxHQUFhLElBQUksZUFBUyxDQUFDLEVBQUUsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFLEtBQUssRUFBRSxpREFBaUQsRUFBRSxTQUFTLEVBQUUsU0FBUyxFQUFFLEtBQUssQ0FBQyxDQUFDO0lBQ3JKLElBQUksSUFBWSxDQUFDO0lBRWpCLG9EQUFvRDtJQUNwRCxJQUFJLFFBQVEsR0FBVSw4REFBOEQsQ0FBQztJQUNyRixJQUFJLFdBQVcsR0FBVSxvRUFBb0UsQ0FBQztJQUU5RixJQUFJLFNBQVMsR0FBVSwySkFBMkosQ0FBQTtJQUVsTCxJQUFJLGFBQWEsR0FBaUIsQ0FBQyx1QkFBdUIsRUFBRSxXQUFXLEVBQUUsTUFBTSxDQUFDLENBQUM7SUFFakYsU0FBUyxDQUFDLEdBQUcsRUFBRTtRQUNiLElBQUksR0FBRyxTQUFTLENBQUMsSUFBSSxFQUFFLENBQUM7SUFDMUIsQ0FBQyxDQUFDLENBQUM7SUFFSCxTQUFTLENBQUMsR0FBRyxFQUFFO1FBQ2IseUJBQVMsQ0FBQyxLQUFLLEVBQUUsQ0FBQztJQUNwQixDQUFDLENBQUMsQ0FBQztJQUVILElBQUksQ0FBQyxVQUFVLEVBQUUsR0FBUyxFQUFFO1FBQzFCLE1BQU0sTUFBTSxHQUFtQixJQUFJLENBQUMsUUFBUSxDQUFDLFFBQVEsRUFBRSxhQUFhLENBQUMsQ0FBQztRQUN0RSxNQUFNLE9BQU8sR0FBVTtZQUNyQixNQUFNLEVBQUU7Z0JBQ04sS0FBSyxFQUFFLFNBQVM7YUFDakI7U0FDRixDQUFDO1FBQ0YsTUFBTSxXQUFXLEdBQUc7WUFDbEIsSUFBSSxFQUFFLE9BQU87U0FDZCxDQUFDO1FBRUYseUJBQVMsQ0FBQyxZQUFZLENBQUMsV0FBVyxDQUFDLENBQUM7UUFDcEMsTUFBTSxRQUFRLEdBQVUsTUFBTSxNQUFNLENBQUM7UUFFckMsTUFBTSxDQUFDLHlCQUFTLENBQUMsT0FBTyxDQUFDLENBQUMscUJBQXFCLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDbkQsTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQztJQUNuQyxDQUFDLENBQUEsQ0FBQyxDQUFDO0lBRUgsSUFBSSxDQUFDLGFBQWEsRUFBRSxHQUFTLEVBQUU7UUFDN0IsTUFBTSxNQUFNLEdBQW9CLElBQUksQ0FBQyxXQUFXLENBQUMsUUFBUSxFQUFFLFNBQVMsQ0FBQyxDQUFDO1FBQ3RFLE1BQU0sT0FBTyxHQUFVO1lBQ3JCLE1BQU0sRUFBRTtnQkFDTixPQUFPLEVBQUUsSUFBSTthQUNkO1NBQ0YsQ0FBQztRQUNGLE1BQU0sV0FBVyxHQUFHO1lBQ2xCLElBQUksRUFBRSxPQUFPO1NBQ2QsQ0FBQztRQUVGLHlCQUFTLENBQUMsWUFBWSxDQUFDLFdBQVcsQ0FBQyxDQUFDO1FBQ3BDLE1BQU0sUUFBUSxHQUFXLE1BQU0sTUFBTSxDQUFDO1FBRXRDLE1BQU0sQ0FBQyx5QkFBUyxDQUFDLE9BQU8sQ0FBQyxDQUFDLHFCQUFxQixDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ25ELE1BQU0sQ0FBQyxRQUFRLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDOUIsQ0FBQyxDQUFBLENBQUMsQ0FBQztJQUdILElBQUksQ0FBQyxnQkFBZ0IsRUFBRSxHQUFTLEVBQUU7UUFDaEMsTUFBTSxNQUFNLEdBQW9CLElBQUksQ0FBQyxjQUFjLENBQUMsUUFBUSxFQUFFLFdBQVcsQ0FBQyxDQUFDO1FBQzNFLE1BQU0sT0FBTyxHQUFVO1lBQ3JCLE1BQU0sRUFBRTtnQkFDTixPQUFPLEVBQUUsS0FBSzthQUNmO1NBQ0YsQ0FBQztRQUNGLE1BQU0sV0FBVyxHQUFHO1lBQ2xCLElBQUksRUFBRSxPQUFPO1NBQ2QsQ0FBQztRQUVGLHlCQUFTLENBQUMsWUFBWSxDQUFDLFdBQVcsQ0FBQyxDQUFDO1FBQ3BDLE1BQU0sUUFBUSxHQUFXLE1BQU0sTUFBTSxDQUFDO1FBRXRDLE1BQU0sQ0FBQyx5QkFBUyxDQUFDLE9BQU8sQ0FBQyxDQUFDLHFCQUFxQixDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ25ELE1BQU0sQ0FBQyxRQUFRLENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDL0IsQ0FBQyxDQUFBLENBQUMsQ0FBQztBQUNMLENBQUMsQ0FBQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IG1vY2tBeGlvcyBmcm9tICdqZXN0LW1vY2stYXhpb3MnO1xuaW1wb3J0IHsgQXZhbGFuY2hlIH0gZnJvbSAnc3JjJztcbmltcG9ydCB7IEF1dGhBUEkgfSBmcm9tICdzcmMvYXBpcy9hdXRoL2FwaSc7XG5cbmRlc2NyaWJlKCdBdXRoJywgKCkgPT4ge1xuICBjb25zdCBpcDpzdHJpbmcgPSAnMTI3LjAuMC4xJztcbiAgY29uc3QgcG9ydDpudW1iZXIgPSA5NjUwO1xuICBjb25zdCBwcm90b2NvbDpzdHJpbmcgPSAnaHR0cHMnO1xuXG4gIGNvbnN0IGF2YWxhbmNoZTpBdmFsYW5jaGUgPSBuZXcgQXZhbGFuY2hlKGlwLCBwb3J0LCBwcm90b2NvbCwgMTIzNDUsICdXaGF0IGlzIG15IHB1cnBvc2U/IFlvdSBwYXNzIGJ1dHRlci4gT2ggbXkgZ29kLicsIHVuZGVmaW5lZCwgdW5kZWZpbmVkLCBmYWxzZSk7XG4gIGxldCBhdXRoOkF1dGhBUEk7XG5cbiAgLy8gV2UgdGhpbmsgd2UncmUgYSBSaWNrLCBidXQgd2UncmUgdG90YWxseSBhIEplcnJ5LlxuICBsZXQgcGFzc3dvcmQ6c3RyaW5nID0gXCJXZWRkaW5ncyBhcmUgYmFzaWNhbGx5IGZ1bmVyYWxzIHdpdGggYSBjYWtlLiAtLSBSaWNoIFNhbmNoZXpcIjtcbiAgbGV0IG5ld1Bhc3N3b3JkOnN0cmluZyA9IFwiU29tZXRpbWVzIHNjaWVuY2UgaXMgbW9yZSBhcnQgdGhhbiBzY2llbmNlLCBNb3J0eS4gLS0gUmljaCBTYW5jaGV6XCI7XG5cbiAgbGV0IHRlc3RUb2tlbjpzdHJpbmcgPSBcIlRvIGxpdmUgaXMgdG8gcmlzayBpdCBhbGw7IG90aGVyd2lzZSB5b3UncmUganVzdCBhbiBpbmVydCBjaHVuayBvZiByYW5kb21seSBhc3NlbWJsZWQgbW9sZWN1bGVzIGRyaWZ0aW5nIHdoZXJldmVyIHRoZSB1bml2ZXJzZSBibG93cyB5b3UuIC0tIFJpY2sgU2FuY2hlelwiXG5cbiAgbGV0IHRlc3RFbmRwb2ludHM6QXJyYXk8c3RyaW5nPiA9IFtcIi9leHQvb3B0L2Jpbi9iYXNoL2Zvb1wiLCBcIi9kZXYvbnVsbFwiLCBcIi90bXBcIl07XG5cbiAgYmVmb3JlQWxsKCgpID0+IHtcbiAgICBhdXRoID0gYXZhbGFuY2hlLkF1dGgoKTtcbiAgfSk7XG5cbiAgYWZ0ZXJFYWNoKCgpID0+IHtcbiAgICBtb2NrQXhpb3MucmVzZXQoKTtcbiAgfSk7XG5cbiAgdGVzdCgnbmV3VG9rZW4nLCBhc3luYyAoKSA9PiB7XG4gICAgY29uc3QgcmVzdWx0OlByb21pc2U8c3RyaW5nPiA9IGF1dGgubmV3VG9rZW4ocGFzc3dvcmQsIHRlc3RFbmRwb2ludHMpO1xuICAgIGNvbnN0IHBheWxvYWQ6b2JqZWN0ID0ge1xuICAgICAgcmVzdWx0OiB7XG4gICAgICAgIHRva2VuOiB0ZXN0VG9rZW4sXG4gICAgICB9LFxuICAgIH07XG4gICAgY29uc3QgcmVzcG9uc2VPYmogPSB7XG4gICAgICBkYXRhOiBwYXlsb2FkLFxuICAgIH07XG5cbiAgICBtb2NrQXhpb3MubW9ja1Jlc3BvbnNlKHJlc3BvbnNlT2JqKTtcbiAgICBjb25zdCByZXNwb25zZTpzdHJpbmcgPSBhd2FpdCByZXN1bHQ7XG5cbiAgICBleHBlY3QobW9ja0F4aW9zLnJlcXVlc3QpLnRvSGF2ZUJlZW5DYWxsZWRUaW1lcygxKTtcbiAgICBleHBlY3QocmVzcG9uc2UpLnRvQmUodGVzdFRva2VuKTtcbiAgfSk7XG5cbiAgdGVzdCgncmV2b2tlVG9rZW4nLCBhc3luYyAoKSA9PiB7XG4gICAgY29uc3QgcmVzdWx0OlByb21pc2U8Ym9vbGVhbj4gPSBhdXRoLnJldm9rZVRva2VuKHBhc3N3b3JkLCB0ZXN0VG9rZW4pO1xuICAgIGNvbnN0IHBheWxvYWQ6b2JqZWN0ID0ge1xuICAgICAgcmVzdWx0OiB7XG4gICAgICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgICB9LFxuICAgIH07XG4gICAgY29uc3QgcmVzcG9uc2VPYmogPSB7XG4gICAgICBkYXRhOiBwYXlsb2FkLFxuICAgIH07XG5cbiAgICBtb2NrQXhpb3MubW9ja1Jlc3BvbnNlKHJlc3BvbnNlT2JqKTtcbiAgICBjb25zdCByZXNwb25zZTpib29sZWFuID0gYXdhaXQgcmVzdWx0O1xuXG4gICAgZXhwZWN0KG1vY2tBeGlvcy5yZXF1ZXN0KS50b0hhdmVCZWVuQ2FsbGVkVGltZXMoMSk7XG4gICAgZXhwZWN0KHJlc3BvbnNlKS50b0JlKHRydWUpO1xuICB9KTtcblxuXG4gIHRlc3QoJ2NoYW5nZVBhc3N3b3JkJywgYXN5bmMgKCkgPT4ge1xuICAgIGNvbnN0IHJlc3VsdDpQcm9taXNlPGJvb2xlYW4+ID0gYXV0aC5jaGFuZ2VQYXNzd29yZChwYXNzd29yZCwgbmV3UGFzc3dvcmQpO1xuICAgIGNvbnN0IHBheWxvYWQ6b2JqZWN0ID0ge1xuICAgICAgcmVzdWx0OiB7XG4gICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgfSxcbiAgICB9O1xuICAgIGNvbnN0IHJlc3BvbnNlT2JqID0ge1xuICAgICAgZGF0YTogcGF5bG9hZCxcbiAgICB9O1xuXG4gICAgbW9ja0F4aW9zLm1vY2tSZXNwb25zZShyZXNwb25zZU9iaik7XG4gICAgY29uc3QgcmVzcG9uc2U6Ym9vbGVhbiA9IGF3YWl0IHJlc3VsdDtcblxuICAgIGV4cGVjdChtb2NrQXhpb3MucmVxdWVzdCkudG9IYXZlQmVlbkNhbGxlZFRpbWVzKDEpO1xuICAgIGV4cGVjdChyZXNwb25zZSkudG9CZShmYWxzZSk7XG4gIH0pO1xufSk7XG4iXX0=