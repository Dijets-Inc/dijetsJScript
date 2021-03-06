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
Object.defineProperty(exports, "__esModule", { value: true });
exports.TestAPI = void 0;
const apibase_1 = require("../src/common/apibase");
class TestAPI extends apibase_1.APIBase {
    constructor(djtx, endpoint = '/ext/testing') {
        super(djtx, endpoint);
        this.TestGET = (input, path = '', axiosConfig = undefined) => __awaiter(this, void 0, void 0, function* () { return this._TestMethod('get', path, { input }, axiosConfig); });
        this.TestDELETE = (input, path = '', axiosConfig = undefined) => __awaiter(this, void 0, void 0, function* () { return this._TestMethod('delete', path, { input }, axiosConfig); });
        this.TestPOST = (input, path = '', axiosConfig = undefined) => __awaiter(this, void 0, void 0, function* () { return this._TestMethod('post', path, {}, { input }, axiosConfig); });
        this.TestPUT = (input, path = '', axiosConfig = undefined) => __awaiter(this, void 0, void 0, function* () { return this._TestMethod('put', path, {}, { input }, axiosConfig); });
        this.TestPATCH = (input, path = '', axiosConfig = undefined) => __awaiter(this, void 0, void 0, function* () { return this._TestMethod('patch', path, {}, { input }, axiosConfig); });
        this._respFn = (res) => {
            let response;
            if (typeof res.data === 'string') {
                response = JSON.parse(res.data);
            }
            else {
                response = res.data;
            }
            return response.result;
        };
        this._TestMethod = (method, path = '', getdata = {}, postdata = undefined, axiosConfig = undefined) => __awaiter(this, void 0, void 0, function* () {
            if (postdata === undefined) {
                return this.core[method](this.baseurl + path, getdata, {}, axiosConfig).then((res) => this._respFn(res));
            }
            return this.core[method](this.baseurl + path, getdata, postdata, {}, axiosConfig).then((res) => {
                res.data = JSON.stringify(res.data); // coverage completeness
                return this._respFn(res);
            });
        });
    }
}
exports.TestAPI = TestAPI;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVzdGxpYi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3Rlc3RzL3Rlc3RsaWIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7O0FBR0EsbURBQXFFO0FBRXJFLE1BQWEsT0FBUSxTQUFRLGlCQUFPO0lBK0JsQyxZQUFZLElBQWtCLEVBQUUsV0FBa0IsY0FBYztRQUFJLEtBQUssQ0FBQyxJQUFJLEVBQUUsUUFBUSxDQUFDLENBQUM7UUE5QjFGLFlBQU8sR0FBRyxDQUFPLEtBQVksRUFBRSxPQUFjLEVBQUUsRUFBRSxjQUFpQyxTQUFTLEVBQWtCLEVBQUUsZ0RBQUMsT0FBQSxJQUFJLENBQUMsV0FBVyxDQUFDLEtBQUssRUFBRSxJQUFJLEVBQUUsRUFBRSxLQUFLLEVBQUUsRUFBRSxXQUFXLENBQUMsQ0FBQSxHQUFBLENBQUM7UUFFdEssZUFBVSxHQUFHLENBQU8sS0FBWSxFQUFFLE9BQWMsRUFBRSxFQUFFLGNBQWlDLFNBQVMsRUFBa0IsRUFBRSxnREFBQyxPQUFBLElBQUksQ0FBQyxXQUFXLENBQUMsUUFBUSxFQUFFLElBQUksRUFBRSxFQUFFLEtBQUssRUFBRSxFQUFFLFdBQVcsQ0FBQyxDQUFBLEdBQUEsQ0FBQztRQUU1SyxhQUFRLEdBQUcsQ0FBTyxLQUFZLEVBQUUsT0FBYyxFQUFFLEVBQUUsY0FBaUMsU0FBUyxFQUFrQixFQUFFLGdEQUFDLE9BQUEsSUFBSSxDQUFDLFdBQVcsQ0FBQyxNQUFNLEVBQUUsSUFBSSxFQUFFLEVBQUUsRUFBRSxFQUFFLEtBQUssRUFBRSxFQUFFLFdBQVcsQ0FBQyxDQUFBLEdBQUEsQ0FBQztRQUU1SyxZQUFPLEdBQUcsQ0FBTyxLQUFZLEVBQUUsT0FBYyxFQUFFLEVBQUUsY0FBaUMsU0FBUyxFQUFrQixFQUFFLGdEQUFDLE9BQUEsSUFBSSxDQUFDLFdBQVcsQ0FBQyxLQUFLLEVBQUUsSUFBSSxFQUFFLEVBQUUsRUFBRSxFQUFFLEtBQUssRUFBRSxFQUFFLFdBQVcsQ0FBQyxDQUFBLEdBQUEsQ0FBQztRQUUxSyxjQUFTLEdBQUcsQ0FBTyxLQUFZLEVBQUUsT0FBYyxFQUFFLEVBQUUsY0FBaUMsU0FBUyxFQUFrQixFQUFFLGdEQUFDLE9BQUEsSUFBSSxDQUFDLFdBQVcsQ0FBQyxPQUFPLEVBQUUsSUFBSSxFQUFFLEVBQUUsRUFBRSxFQUFFLEtBQUssRUFBRSxFQUFFLFdBQVcsQ0FBQyxDQUFBLEdBQUEsQ0FBQztRQUVwSyxZQUFPLEdBQUcsQ0FBQyxHQUF1QixFQUFFLEVBQUU7WUFDOUMsSUFBSSxRQUFZLENBQUM7WUFDakIsSUFBSSxPQUFPLEdBQUcsQ0FBQyxJQUFJLEtBQUssUUFBUSxFQUFFO2dCQUNoQyxRQUFRLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUM7YUFDakM7aUJBQU07Z0JBQ0wsUUFBUSxHQUFHLEdBQUcsQ0FBQyxJQUFjLENBQUM7YUFDL0I7WUFDRCxPQUFPLFFBQVEsQ0FBQyxNQUFNLENBQUM7UUFDekIsQ0FBQyxDQUFDO1FBRVEsZ0JBQVcsR0FBRyxDQUFPLE1BQWEsRUFBRSxPQUFjLEVBQUUsRUFBRSxVQUFpQixFQUFFLEVBQUUsV0FBa0IsU0FBUyxFQUFFLGNBQWlDLFNBQVMsRUFBa0IsRUFBRTtZQUM5SyxJQUFJLFFBQVEsS0FBSyxTQUFTLEVBQUU7Z0JBQzFCLE9BQU8sSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxJQUFJLENBQUMsT0FBTyxHQUFHLElBQUksRUFBRSxPQUFPLEVBQUUsRUFBRSxFQUFFLFdBQVcsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQXVCLEVBQUUsRUFBRSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQzthQUM5SDtZQUNELE9BQU8sSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxJQUFJLENBQUMsT0FBTyxHQUFHLElBQUksRUFBRSxPQUFPLEVBQUUsUUFBUSxFQUFFLEVBQUUsRUFBRSxXQUFXLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUF1QixFQUFFLEVBQUU7Z0JBQ2pILEdBQUcsQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyx3QkFBd0I7Z0JBQzdELE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUMzQixDQUFDLENBQUMsQ0FBQztRQUNMLENBQUMsQ0FBQSxDQUFDO0lBRXlGLENBQUM7Q0FDN0Y7QUFoQ0QsMEJBZ0NDIiwic291cmNlc0NvbnRlbnQiOlsiXG5pbXBvcnQgQXZhbGFuY2hlQ29yZSBmcm9tICdzcmMvYXZhbGFuY2hlJztcbmltcG9ydCB7IEF4aW9zUmVxdWVzdENvbmZpZyB9IGZyb20gJ2F4aW9zJztcbmltcG9ydCB7IEFQSUJhc2UsIFJlcXVlc3RSZXNwb25zZURhdGEgfSBmcm9tICcuLi9zcmMvY29tbW9uL2FwaWJhc2UnO1xuXG5leHBvcnQgY2xhc3MgVGVzdEFQSSBleHRlbmRzIEFQSUJhc2Uge1xuICBUZXN0R0VUID0gYXN5bmMgKGlucHV0OnN0cmluZywgcGF0aDpzdHJpbmcgPSAnJywgYXhpb3NDb25maWc6QXhpb3NSZXF1ZXN0Q29uZmlnID0gdW5kZWZpbmVkKTpQcm9taXNlPG9iamVjdD4gPT4gdGhpcy5fVGVzdE1ldGhvZCgnZ2V0JywgcGF0aCwgeyBpbnB1dCB9LCBheGlvc0NvbmZpZyk7XG5cbiAgVGVzdERFTEVURSA9IGFzeW5jIChpbnB1dDpzdHJpbmcsIHBhdGg6c3RyaW5nID0gJycsIGF4aW9zQ29uZmlnOkF4aW9zUmVxdWVzdENvbmZpZyA9IHVuZGVmaW5lZCk6UHJvbWlzZTxvYmplY3Q+ID0+IHRoaXMuX1Rlc3RNZXRob2QoJ2RlbGV0ZScsIHBhdGgsIHsgaW5wdXQgfSwgYXhpb3NDb25maWcpO1xuXG4gIFRlc3RQT1NUID0gYXN5bmMgKGlucHV0OnN0cmluZywgcGF0aDpzdHJpbmcgPSAnJywgYXhpb3NDb25maWc6QXhpb3NSZXF1ZXN0Q29uZmlnID0gdW5kZWZpbmVkKTpQcm9taXNlPG9iamVjdD4gPT4gdGhpcy5fVGVzdE1ldGhvZCgncG9zdCcsIHBhdGgsIHt9LCB7IGlucHV0IH0sIGF4aW9zQ29uZmlnKTtcblxuICBUZXN0UFVUID0gYXN5bmMgKGlucHV0OnN0cmluZywgcGF0aDpzdHJpbmcgPSAnJywgYXhpb3NDb25maWc6QXhpb3NSZXF1ZXN0Q29uZmlnID0gdW5kZWZpbmVkKTpQcm9taXNlPG9iamVjdD4gPT4gdGhpcy5fVGVzdE1ldGhvZCgncHV0JywgcGF0aCwge30sIHsgaW5wdXQgfSwgYXhpb3NDb25maWcpO1xuXG4gIFRlc3RQQVRDSCA9IGFzeW5jIChpbnB1dDpzdHJpbmcsIHBhdGg6c3RyaW5nID0gJycsIGF4aW9zQ29uZmlnOkF4aW9zUmVxdWVzdENvbmZpZyA9IHVuZGVmaW5lZCk6UHJvbWlzZTxvYmplY3Q+ID0+IHRoaXMuX1Rlc3RNZXRob2QoJ3BhdGNoJywgcGF0aCwge30sIHsgaW5wdXQgfSwgYXhpb3NDb25maWcpO1xuXG4gIHByb3RlY3RlZCBfcmVzcEZuID0gKHJlczpSZXF1ZXN0UmVzcG9uc2VEYXRhKSA9PiB7XG4gICAgbGV0IHJlc3BvbnNlOmFueTtcbiAgICBpZiAodHlwZW9mIHJlcy5kYXRhID09PSAnc3RyaW5nJykge1xuICAgICAgcmVzcG9uc2UgPSBKU09OLnBhcnNlKHJlcy5kYXRhKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmVzcG9uc2UgPSByZXMuZGF0YSBhcyBvYmplY3Q7XG4gICAgfVxuICAgIHJldHVybiByZXNwb25zZS5yZXN1bHQ7XG4gIH07XG5cbiAgcHJvdGVjdGVkIF9UZXN0TWV0aG9kID0gYXN5bmMgKG1ldGhvZDpzdHJpbmcsIHBhdGg6c3RyaW5nID0gJycsIGdldGRhdGE6b2JqZWN0ID0ge30sIHBvc3RkYXRhOm9iamVjdCA9IHVuZGVmaW5lZCwgYXhpb3NDb25maWc6QXhpb3NSZXF1ZXN0Q29uZmlnID0gdW5kZWZpbmVkKTpQcm9taXNlPG9iamVjdD4gPT4ge1xuICAgIGlmIChwb3N0ZGF0YSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICByZXR1cm4gdGhpcy5jb3JlW21ldGhvZF0odGhpcy5iYXNldXJsICsgcGF0aCwgZ2V0ZGF0YSwge30sIGF4aW9zQ29uZmlnKS50aGVuKChyZXM6UmVxdWVzdFJlc3BvbnNlRGF0YSkgPT4gdGhpcy5fcmVzcEZuKHJlcykpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5jb3JlW21ldGhvZF0odGhpcy5iYXNldXJsICsgcGF0aCwgZ2V0ZGF0YSwgcG9zdGRhdGEsIHt9LCBheGlvc0NvbmZpZykudGhlbigocmVzOlJlcXVlc3RSZXNwb25zZURhdGEpID0+IHtcbiAgICAgIHJlcy5kYXRhID0gSlNPTi5zdHJpbmdpZnkocmVzLmRhdGEpOyAvLyBjb3ZlcmFnZSBjb21wbGV0ZW5lc3NcbiAgICAgIHJldHVybiB0aGlzLl9yZXNwRm4ocmVzKTtcbiAgICB9KTtcbiAgfTtcblxuICBjb25zdHJ1Y3RvcihhdmF4OkF2YWxhbmNoZUNvcmUsIGVuZHBvaW50OnN0cmluZyA9ICcvZXh0L3Rlc3RpbmcnKSB7IHN1cGVyKGF2YXgsIGVuZHBvaW50KTsgfVxufVxuIl19