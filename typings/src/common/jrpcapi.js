"use strict";
/**
 * @packageDocumentation
 * @module Common-JRPCAPI
 */
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
exports.JRPCAPI = void 0;
const bintools_1 = __importDefault(require("../utils/bintools"));
const apibase_1 = require("./apibase");
/**
 * @ignore
 */
const bintools = bintools_1.default.getInstance();
class JRPCAPI extends apibase_1.APIBase {
    /**
       *
       * @param core Reference to the Dijets instance using this endpoint
       * @param baseurl Path of the APIs baseurl - ex: "/ext/bc/avm"
       * @param jrpcVersion The jrpc version to use, default "2.0".
       */
    constructor(core, baseurl, jrpcVersion = '2.0') {
        super(core, baseurl);
        this.jrpcVersion = '2.0';
        this.rpcid = 1;
        this.callMethod = (method, params, baseurl, headers) => __awaiter(this, void 0, void 0, function* () {
            const ep = baseurl || this.baseurl;
            const rpc = {};
            rpc.id = this.rpcid;
            rpc.method = method;
            // Set parameters if exists
            if (params) {
                rpc.params = params;
            }
            else if (this.jrpcVersion === '1.0') {
                rpc.params = [];
            }
            if (this.jrpcVersion !== '1.0') {
                rpc.jsonrpc = this.jrpcVersion;
            }
            let headrs = { 'Content-Type': 'application/json;charset=UTF-8' };
            if (headers) {
                headrs = Object.assign(Object.assign({}, headrs), headers);
            }
            let baseURL = `${this.core.getProtocol()}://${this.core.getIP()}`;
            const port = this.core.getPort();
            if (port != undefined && typeof port === 'number' && port >= 0) {
                baseURL = `${baseURL}:${port}`;
            }
            const axConf = {
                baseURL: baseURL,
                responseType: 'json',
            };
            return this.core.post(ep, {}, JSON.stringify(rpc), headrs, axConf)
                .then((resp) => {
                if (resp.status >= 200 && resp.status < 300) {
                    this.rpcid += 1;
                    if (typeof resp.data === 'string') {
                        resp.data = JSON.parse(resp.data);
                    }
                    if (typeof resp.data === 'object' && (resp.data === null || 'error' in resp.data)) {
                        throw new Error(`${resp.data.error.message}`);
                    }
                }
                return resp;
            });
        });
        /**
           * Returns the rpcid, a strictly-increasing number, starting from 1, indicating the next
           * request ID that will be sent.
           */
        this.getRPCID = () => this.rpcid;
        this.jrpcVersion = jrpcVersion;
        this.rpcid = 1;
    }
}
exports.JRPCAPI = JRPCAPI;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoianJwY2FwaS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9jb21tb24vanJwY2FwaS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7OztHQUdHOzs7Ozs7Ozs7Ozs7Ozs7QUFHSCxpRUFBeUM7QUFFekMsdUNBQXlEO0FBRXpEOztHQUVHO0FBQ0gsTUFBTSxRQUFRLEdBQUcsa0JBQVEsQ0FBQyxXQUFXLEVBQUUsQ0FBQztBQUV4QyxNQUFhLE9BQVEsU0FBUSxpQkFBTztJQWdFbEM7Ozs7O1NBS0s7SUFDTCxZQUFZLElBQWtCLEVBQUUsT0FBYyxFQUFFLGNBQXFCLEtBQUs7UUFDeEUsS0FBSyxDQUFDLElBQUksRUFBRSxPQUFPLENBQUMsQ0FBQztRQXRFYixnQkFBVyxHQUFVLEtBQUssQ0FBQztRQUUzQixVQUFLLEdBQUcsQ0FBQyxDQUFDO1FBRXBCLGVBQVUsR0FBRyxDQUNYLE1BQWEsRUFDYixNQUE4QixFQUM5QixPQUFlLEVBQ2YsT0FBZ0IsRUFDZSxFQUFFO1lBQ2pDLE1BQU0sRUFBRSxHQUFHLE9BQU8sSUFBSSxJQUFJLENBQUMsT0FBTyxDQUFDO1lBQ25DLE1BQU0sR0FBRyxHQUFPLEVBQUUsQ0FBQztZQUNuQixHQUFHLENBQUMsRUFBRSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDcEIsR0FBRyxDQUFDLE1BQU0sR0FBRyxNQUFNLENBQUM7WUFFcEIsMkJBQTJCO1lBQzNCLElBQUksTUFBTSxFQUFFO2dCQUNWLEdBQUcsQ0FBQyxNQUFNLEdBQUcsTUFBTSxDQUFDO2FBQ3JCO2lCQUFNLElBQUksSUFBSSxDQUFDLFdBQVcsS0FBSyxLQUFLLEVBQUU7Z0JBQ3JDLEdBQUcsQ0FBQyxNQUFNLEdBQUcsRUFBRSxDQUFDO2FBQ2pCO1lBRUQsSUFBSSxJQUFJLENBQUMsV0FBVyxLQUFLLEtBQUssRUFBRTtnQkFDOUIsR0FBRyxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFDO2FBQ2hDO1lBRUQsSUFBSSxNQUFNLEdBQVUsRUFBRSxjQUFjLEVBQUUsZ0NBQWdDLEVBQUUsQ0FBQztZQUN6RSxJQUFHLE9BQU8sRUFBRTtnQkFDVixNQUFNLG1DQUFPLE1BQU0sR0FBSyxPQUFPLENBQUMsQ0FBQzthQUNsQztZQUVELElBQUksT0FBTyxHQUFXLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxXQUFXLEVBQUUsTUFBTSxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRSxFQUFFLENBQUM7WUFDMUUsTUFBTSxJQUFJLEdBQVcsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQUN6QyxJQUFHLElBQUksSUFBSSxTQUFTLElBQUksT0FBTyxJQUFJLEtBQUssUUFBUSxJQUFJLElBQUksSUFBSSxDQUFDLEVBQUU7Z0JBQzdELE9BQU8sR0FBRyxHQUFHLE9BQU8sSUFBSSxJQUFJLEVBQUUsQ0FBQzthQUNoQztZQUVELE1BQU0sTUFBTSxHQUFzQjtnQkFDaEMsT0FBTyxFQUFFLE9BQU87Z0JBQ2hCLFlBQVksRUFBRSxNQUFNO2FBQ3JCLENBQUM7WUFFRixPQUFPLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUUsRUFBRSxFQUFFLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsRUFBRSxNQUFNLEVBQUUsTUFBTSxDQUFDO2lCQUMvRCxJQUFJLENBQUMsQ0FBQyxJQUF3QixFQUFFLEVBQUU7Z0JBQ2pDLElBQUksSUFBSSxDQUFDLE1BQU0sSUFBSSxHQUFHLElBQUksSUFBSSxDQUFDLE1BQU0sR0FBRyxHQUFHLEVBQUU7b0JBQzNDLElBQUksQ0FBQyxLQUFLLElBQUksQ0FBQyxDQUFDO29CQUNoQixJQUFJLE9BQU8sSUFBSSxDQUFDLElBQUksS0FBSyxRQUFRLEVBQUU7d0JBQ2pDLElBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7cUJBQ25DO29CQUNELElBQUksT0FBTyxJQUFJLENBQUMsSUFBSSxLQUFLLFFBQVEsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLEtBQUssSUFBSSxJQUFJLE9BQU8sSUFBSSxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUU7d0JBQ2pGLE1BQU0sSUFBSSxLQUFLLENBQUMsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDO3FCQUMvQztpQkFDRjtnQkFDRCxPQUFPLElBQUksQ0FBQztZQUNkLENBQUMsQ0FBQyxDQUFDO1FBQ1AsQ0FBQyxDQUFBLENBQUM7UUFFRjs7O2FBR0s7UUFDTCxhQUFRLEdBQUcsR0FBVSxFQUFFLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQztRQVVqQyxJQUFJLENBQUMsV0FBVyxHQUFHLFdBQVcsQ0FBQztRQUMvQixJQUFJLENBQUMsS0FBSyxHQUFHLENBQUMsQ0FBQztJQUNqQixDQUFDO0NBQ0Y7QUEzRUQsMEJBMkVDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAcGFja2FnZURvY3VtZW50YXRpb25cbiAqIEBtb2R1bGUgQ29tbW9uLUpSUENBUElcbiAqL1xuXG5pbXBvcnQgeyBBeGlvc1JlcXVlc3RDb25maWcgfSBmcm9tICdheGlvcyc7XG5pbXBvcnQgQmluVG9vbHMgZnJvbSAnLi4vdXRpbHMvYmludG9vbHMnO1xuaW1wb3J0IEF2YWxhbmNoZUNvcmUgZnJvbSAnLi4vYXZhbGFuY2hlJztcbmltcG9ydCB7IEFQSUJhc2UsIFJlcXVlc3RSZXNwb25zZURhdGEgfSBmcm9tICcuL2FwaWJhc2UnO1xuXG4vKipcbiAqIEBpZ25vcmVcbiAqL1xuY29uc3QgYmludG9vbHMgPSBCaW5Ub29scy5nZXRJbnN0YW5jZSgpO1xuXG5leHBvcnQgY2xhc3MgSlJQQ0FQSSBleHRlbmRzIEFQSUJhc2Uge1xuICBwcm90ZWN0ZWQganJwY1ZlcnNpb246c3RyaW5nID0gJzIuMCc7XG5cbiAgcHJvdGVjdGVkIHJwY2lkID0gMTtcblxuICBjYWxsTWV0aG9kID0gYXN5bmMgKFxuICAgIG1ldGhvZDpzdHJpbmcsXG4gICAgcGFyYW1zPzpBcnJheTxvYmplY3Q+IHwgb2JqZWN0LFxuICAgIGJhc2V1cmw/OnN0cmluZyxcbiAgICBoZWFkZXJzPzogb2JqZWN0XG4gICAgKTpQcm9taXNlPFJlcXVlc3RSZXNwb25zZURhdGE+ID0+IHtcbiAgICBjb25zdCBlcCA9IGJhc2V1cmwgfHwgdGhpcy5iYXNldXJsO1xuICAgIGNvbnN0IHJwYzphbnkgPSB7fTtcbiAgICBycGMuaWQgPSB0aGlzLnJwY2lkO1xuICAgIHJwYy5tZXRob2QgPSBtZXRob2Q7XG5cbiAgICAvLyBTZXQgcGFyYW1ldGVycyBpZiBleGlzdHNcbiAgICBpZiAocGFyYW1zKSB7XG4gICAgICBycGMucGFyYW1zID0gcGFyYW1zO1xuICAgIH0gZWxzZSBpZiAodGhpcy5qcnBjVmVyc2lvbiA9PT0gJzEuMCcpIHtcbiAgICAgIHJwYy5wYXJhbXMgPSBbXTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5qcnBjVmVyc2lvbiAhPT0gJzEuMCcpIHtcbiAgICAgIHJwYy5qc29ucnBjID0gdGhpcy5qcnBjVmVyc2lvbjtcbiAgICB9XG5cbiAgICBsZXQgaGVhZHJzOm9iamVjdCA9IHsgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uO2NoYXJzZXQ9VVRGLTgnIH07XG4gICAgaWYoaGVhZGVycykge1xuICAgICAgaGVhZHJzID0gey4uLmhlYWRycywgLi4uaGVhZGVyc307XG4gICAgfVxuXG4gICAgbGV0IGJhc2VVUkw6IHN0cmluZyA9IGAke3RoaXMuY29yZS5nZXRQcm90b2NvbCgpfTovLyR7dGhpcy5jb3JlLmdldElQKCl9YDtcbiAgICBjb25zdCBwb3J0OiBudW1iZXIgPSB0aGlzLmNvcmUuZ2V0UG9ydCgpO1xuICAgIGlmKHBvcnQgIT0gdW5kZWZpbmVkICYmIHR5cGVvZiBwb3J0ID09PSAnbnVtYmVyJyAmJiBwb3J0ID49IDApIHtcbiAgICAgIGJhc2VVUkwgPSBgJHtiYXNlVVJMfToke3BvcnR9YDtcbiAgICB9XG5cbiAgICBjb25zdCBheENvbmY6QXhpb3NSZXF1ZXN0Q29uZmlnID0ge1xuICAgICAgYmFzZVVSTDogYmFzZVVSTCxcbiAgICAgIHJlc3BvbnNlVHlwZTogJ2pzb24nLFxuICAgIH07XG5cbiAgICByZXR1cm4gdGhpcy5jb3JlLnBvc3QoZXAsIHt9LCBKU09OLnN0cmluZ2lmeShycGMpLCBoZWFkcnMsIGF4Q29uZilcbiAgICAgIC50aGVuKChyZXNwOlJlcXVlc3RSZXNwb25zZURhdGEpID0+IHtcbiAgICAgICAgaWYgKHJlc3Auc3RhdHVzID49IDIwMCAmJiByZXNwLnN0YXR1cyA8IDMwMCkge1xuICAgICAgICAgIHRoaXMucnBjaWQgKz0gMTtcbiAgICAgICAgICBpZiAodHlwZW9mIHJlc3AuZGF0YSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIHJlc3AuZGF0YSA9IEpTT04ucGFyc2UocmVzcC5kYXRhKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKHR5cGVvZiByZXNwLmRhdGEgPT09ICdvYmplY3QnICYmIChyZXNwLmRhdGEgPT09IG51bGwgfHwgJ2Vycm9yJyBpbiByZXNwLmRhdGEpKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYCR7cmVzcC5kYXRhLmVycm9yLm1lc3NhZ2V9YCk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXNwO1xuICAgICAgfSk7XG4gIH07XG5cbiAgLyoqXG4gICAgICogUmV0dXJucyB0aGUgcnBjaWQsIGEgc3RyaWN0bHktaW5jcmVhc2luZyBudW1iZXIsIHN0YXJ0aW5nIGZyb20gMSwgaW5kaWNhdGluZyB0aGUgbmV4dFxuICAgICAqIHJlcXVlc3QgSUQgdGhhdCB3aWxsIGJlIHNlbnQuXG4gICAgICovXG4gIGdldFJQQ0lEID0gKCk6bnVtYmVyID0+IHRoaXMucnBjaWQ7XG5cbiAgLyoqXG4gICAgICpcbiAgICAgKiBAcGFyYW0gY29yZSBSZWZlcmVuY2UgdG8gdGhlIEF2YWxhbmNoZSBpbnN0YW5jZSB1c2luZyB0aGlzIGVuZHBvaW50XG4gICAgICogQHBhcmFtIGJhc2V1cmwgUGF0aCBvZiB0aGUgQVBJcyBiYXNldXJsIC0gZXg6IFwiL2V4dC9iYy9hdm1cIlxuICAgICAqIEBwYXJhbSBqcnBjVmVyc2lvbiBUaGUganJwYyB2ZXJzaW9uIHRvIHVzZSwgZGVmYXVsdCBcIjIuMFwiLlxuICAgICAqL1xuICBjb25zdHJ1Y3Rvcihjb3JlOkF2YWxhbmNoZUNvcmUsIGJhc2V1cmw6c3RyaW5nLCBqcnBjVmVyc2lvbjpzdHJpbmcgPSAnMi4wJykge1xuICAgIHN1cGVyKGNvcmUsIGJhc2V1cmwpO1xuICAgIHRoaXMuanJwY1ZlcnNpb24gPSBqcnBjVmVyc2lvbjtcbiAgICB0aGlzLnJwY2lkID0gMTtcbiAgfVxufVxuXG5cblxuXG5cbiJdfQ==