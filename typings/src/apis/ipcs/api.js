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
exports.IPCSAPI = void 0;
const jrpcapi_1 = require("../../common/jrpcapi");
/**
 * Class for interacting with a node's IPCSAPI.
 *
 * @category RPCAPIs
 *
 * @remarks This extends the [[JRPCAPI]] class. This class should not be directly called. Instead, use the [[Dijets.addAPI]] function to register this interface with Dijets.
 */
class IPCSAPI extends jrpcapi_1.JRPCAPI {
    constructor(core, baseurl = "/ext/ipcs") {
        super(core, baseurl);
        /**
         * Register a blockchain so it publishes accepted vertices to a Unix domain socket.
         *
         * @param blockchainID the blockchain that will publish accepted vertices.
         *
         * @returns Returns a Promise<iPublishBlockchainResponse> containing the consensusURL and decisionsURL.
         */
        this.publishBlockchain = (blockchainID) => __awaiter(this, void 0, void 0, function* () {
            const params = {
                blockchainID
            };
            const response = yield this.callMethod("ipcs.publishBlockchain", params);
            return response.data.result;
        });
        /**
         * Deregister a blockchain so that it no longer publishes to a Unix domain socket.
         *
         * @param blockchainID the blockchain that will publish accepted vertices.
         *
         * @returns Returns a Promise<iPublishBlockchainResponse> containing the consensusURL and decisionsURL.
         */
        this.unpublishBlockchain = (blockchainID) => __awaiter(this, void 0, void 0, function* () {
            const params = {
                blockchainID
            };
            const response = yield this.callMethod("ipcs.unpublishBlockchain", params);
            return response.data.result.success;
        });
    }
}
exports.IPCSAPI = IPCSAPI;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBpLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vc3JjL2FwaXMvaXBjcy9hcGkudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7O0FBS0Esa0RBQStDO0FBUS9DOzs7Ozs7R0FNRztBQUNILE1BQWEsT0FBUSxTQUFRLGlCQUFPO0lBK0JsQyxZQUFZLElBQW1CLEVBQUUsVUFBa0IsV0FBVztRQUFJLEtBQUssQ0FBQyxJQUFJLEVBQUUsT0FBTyxDQUFDLENBQUM7UUE5QnZGOzs7Ozs7V0FNRztRQUNILHNCQUFpQixHQUFHLENBQU8sWUFBb0IsRUFBdUMsRUFBRTtZQUN0RixNQUFNLE1BQU0sR0FBNkI7Z0JBQ3ZDLFlBQVk7YUFDYixDQUFDO1lBQ0YsTUFBTSxRQUFRLEdBQXdCLE1BQU0sSUFBSSxDQUFDLFVBQVUsQ0FBQyx3QkFBd0IsRUFBRSxNQUFNLENBQUMsQ0FBQztZQUM5RixPQUFPLFFBQVEsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDO1FBQzlCLENBQUMsQ0FBQSxDQUFDO1FBRUY7Ozs7OztXQU1HO1FBQ0gsd0JBQW1CLEdBQUcsQ0FBTyxZQUFvQixFQUFvQixFQUFFO1lBQ3JFLE1BQU0sTUFBTSxHQUErQjtnQkFDekMsWUFBWTthQUNiLENBQUM7WUFDRixNQUFNLFFBQVEsR0FBd0IsTUFBTSxJQUFJLENBQUMsVUFBVSxDQUFDLDBCQUEwQixFQUFFLE1BQU0sQ0FBQyxDQUFDO1lBQ2hHLE9BQU8sUUFBUSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDO1FBQ3RDLENBQUMsQ0FBQSxDQUFDO0lBRXNGLENBQUM7Q0FDMUY7QUFoQ0QsMEJBZ0NDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAcGFja2FnZURvY3VtZW50YXRpb25cbiAqIEBtb2R1bGUgQVBJLUluZm9cbiAqL1xuaW1wb3J0IEF2YWxhbmNoZUNvcmUgZnJvbSBcIi4uLy4uL2F2YWxhbmNoZVwiO1xuaW1wb3J0IHsgSlJQQ0FQSSB9IGZyb20gXCIuLi8uLi9jb21tb24vanJwY2FwaVwiO1xuaW1wb3J0IHsgUmVxdWVzdFJlc3BvbnNlRGF0YSB9IGZyb20gXCIuLi8uLi9jb21tb24vYXBpYmFzZVwiO1xuaW1wb3J0IHsgXG4gIGlQdWJsaXNoQmxvY2tjaGFpblBhcmFtcywgXG4gIGlQdWJsaXNoQmxvY2tjaGFpblJlc3BvbnNlLFxuICBpVW5wdWJsaXNoQmxvY2tjaGFpblBhcmFtcyBcbn0gZnJvbSBcIi4vaW50ZXJmYWNlc1wiO1xuXG4vKipcbiAqIENsYXNzIGZvciBpbnRlcmFjdGluZyB3aXRoIGEgbm9kZSdzIElQQ1NBUEkuXG4gKlxuICogQGNhdGVnb3J5IFJQQ0FQSXNcbiAqXG4gKiBAcmVtYXJrcyBUaGlzIGV4dGVuZHMgdGhlIFtbSlJQQ0FQSV1dIGNsYXNzLiBUaGlzIGNsYXNzIHNob3VsZCBub3QgYmUgZGlyZWN0bHkgY2FsbGVkLiBJbnN0ZWFkLCB1c2UgdGhlIFtbQXZhbGFuY2hlLmFkZEFQSV1dIGZ1bmN0aW9uIHRvIHJlZ2lzdGVyIHRoaXMgaW50ZXJmYWNlIHdpdGggQXZhbGFuY2hlLlxuICovXG5leHBvcnQgY2xhc3MgSVBDU0FQSSBleHRlbmRzIEpSUENBUEkge1xuICAvKipcbiAgICogUmVnaXN0ZXIgYSBibG9ja2NoYWluIHNvIGl0IHB1Ymxpc2hlcyBhY2NlcHRlZCB2ZXJ0aWNlcyB0byBhIFVuaXggZG9tYWluIHNvY2tldC5cbiAgICpcbiAgICogQHBhcmFtIGJsb2NrY2hhaW5JRCB0aGUgYmxvY2tjaGFpbiB0aGF0IHdpbGwgcHVibGlzaCBhY2NlcHRlZCB2ZXJ0aWNlcy5cbiAgICpcbiAgICogQHJldHVybnMgUmV0dXJucyBhIFByb21pc2U8aVB1Ymxpc2hCbG9ja2NoYWluUmVzcG9uc2U+IGNvbnRhaW5pbmcgdGhlIGNvbnNlbnN1c1VSTCBhbmQgZGVjaXNpb25zVVJMLlxuICAgKi9cbiAgcHVibGlzaEJsb2NrY2hhaW4gPSBhc3luYyAoYmxvY2tjaGFpbklEOiBzdHJpbmcpOiBQcm9taXNlPGlQdWJsaXNoQmxvY2tjaGFpblJlc3BvbnNlPiA9PiB7XG4gICAgY29uc3QgcGFyYW1zOiBpUHVibGlzaEJsb2NrY2hhaW5QYXJhbXMgPSB7XG4gICAgICBibG9ja2NoYWluSURcbiAgICB9O1xuICAgIGNvbnN0IHJlc3BvbnNlOiBSZXF1ZXN0UmVzcG9uc2VEYXRhID0gYXdhaXQgdGhpcy5jYWxsTWV0aG9kKFwiaXBjcy5wdWJsaXNoQmxvY2tjaGFpblwiLCBwYXJhbXMpO1xuICAgIHJldHVybiByZXNwb25zZS5kYXRhLnJlc3VsdDtcbiAgfTtcblxuICAvKipcbiAgICogRGVyZWdpc3RlciBhIGJsb2NrY2hhaW4gc28gdGhhdCBpdCBubyBsb25nZXIgcHVibGlzaGVzIHRvIGEgVW5peCBkb21haW4gc29ja2V0LlxuICAgKlxuICAgKiBAcGFyYW0gYmxvY2tjaGFpbklEIHRoZSBibG9ja2NoYWluIHRoYXQgd2lsbCBwdWJsaXNoIGFjY2VwdGVkIHZlcnRpY2VzLlxuICAgKlxuICAgKiBAcmV0dXJucyBSZXR1cm5zIGEgUHJvbWlzZTxpUHVibGlzaEJsb2NrY2hhaW5SZXNwb25zZT4gY29udGFpbmluZyB0aGUgY29uc2Vuc3VzVVJMIGFuZCBkZWNpc2lvbnNVUkwuXG4gICAqL1xuICB1bnB1Ymxpc2hCbG9ja2NoYWluID0gYXN5bmMgKGJsb2NrY2hhaW5JRDogc3RyaW5nKTogUHJvbWlzZTxib29sZWFuPiA9PiB7XG4gICAgY29uc3QgcGFyYW1zOiBpVW5wdWJsaXNoQmxvY2tjaGFpblBhcmFtcyA9IHtcbiAgICAgIGJsb2NrY2hhaW5JRFxuICAgIH07XG4gICAgY29uc3QgcmVzcG9uc2U6IFJlcXVlc3RSZXNwb25zZURhdGEgPSBhd2FpdCB0aGlzLmNhbGxNZXRob2QoXCJpcGNzLnVucHVibGlzaEJsb2NrY2hhaW5cIiwgcGFyYW1zKTtcbiAgICByZXR1cm4gcmVzcG9uc2UuZGF0YS5yZXN1bHQuc3VjY2VzcztcbiAgfTtcblxuICBjb25zdHJ1Y3Rvcihjb3JlOiBBdmFsYW5jaGVDb3JlLCBiYXNldXJsOiBzdHJpbmcgPSBcIi9leHQvaXBjc1wiKSB7IHN1cGVyKGNvcmUsIGJhc2V1cmwpOyB9XG59XG4iXX0=