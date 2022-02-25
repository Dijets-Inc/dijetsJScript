"use strict";
/**
 * @packageDocumentation
 * @module Utils-HelperFunctions
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NodeIDStringToBuffer = exports.bufferToNodeIDString = exports.privateKeyStringToBuffer = exports.bufferToPrivateKeyString = exports.UnixNow = exports.MaxWeightFormula = exports.getPreferredHRP = void 0;
const constants_1 = require("./constants");
const bn_js_1 = __importDefault(require("bn.js"));
const bintools_1 = __importDefault(require("../utils/bintools"));
/**
 * @ignore
 */
const bintools = bintools_1.default.getInstance();
function getPreferredHRP(networkID = undefined) {
    if (networkID in constants_1.NetworkIDToHRP) {
        return constants_1.NetworkIDToHRP[networkID];
    }
    else if (typeof networkID === "undefined") {
        return constants_1.NetworkIDToHRP[constants_1.DefaultNetworkID];
    }
    return constants_1.FallbackHRP;
}
exports.getPreferredHRP = getPreferredHRP;
function MaxWeightFormula(staked, cap) {
    return bn_js_1.default.min(staked.mul(new bn_js_1.default(5)), cap);
}
exports.MaxWeightFormula = MaxWeightFormula;
/**
 * Function providing the current UNIX time using a {@link https://github.com/indutny/bn.js/|BN}.
 */
function UnixNow() {
    return new bn_js_1.default(Math.round((new Date()).getTime() / 1000));
}
exports.UnixNow = UnixNow;
/**
 * Takes a private key buffer and produces a private key string with prefix.
 *
 * @param pk A {@link https://github.com/feross/buffer|Buffer} for the private key.
 */
function bufferToPrivateKeyString(pk) {
    return "PrivateKey-" + bintools.cb58Encode(pk);
}
exports.bufferToPrivateKeyString = bufferToPrivateKeyString;
/**
 * Takes a private key string and produces a private key {@link https://github.com/feross/buffer|Buffer}.
 *
 * @param pk A string for the private key.
 */
function privateKeyStringToBuffer(pk) {
    if (!pk.startsWith("PrivateKey-")) {
        throw new Error("Error - privateKeyStringToBuffer: private keys must start with 'PrivateKey-'");
    }
    let pksplit = pk.split("-");
    return bintools.cb58Decode(pksplit[pksplit.length - 1]);
}
exports.privateKeyStringToBuffer = privateKeyStringToBuffer;
/**
 * Takes a nodeID buffer and produces a nodeID string with prefix.
 *
 * @param pk A {@link https://github.com/feross/buffer|Buffer} for the nodeID.
 */
function bufferToNodeIDString(pk) {
    return "NodeID-" + bintools.cb58Encode(pk);
}
exports.bufferToNodeIDString = bufferToNodeIDString;
/**
 * Takes a nodeID string and produces a nodeID {@link https://github.com/feross/buffer|Buffer}.
 *
 * @param pk A string for the nodeID.
 */
function NodeIDStringToBuffer(pk) {
    if (!pk.startsWith("NodeID-")) {
        throw new Error("Error - privateNodeIDToBuffer: nodeID must start with 'NodeID-'");
    }
    let pksplit = pk.split("-");
    return bintools.cb58Decode(pksplit[pksplit.length - 1]);
}
exports.NodeIDStringToBuffer = NodeIDStringToBuffer;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaGVscGVyZnVuY3Rpb25zLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL3V0aWxzL2hlbHBlcmZ1bmN0aW9ucy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7OztHQUdHOzs7Ozs7QUFFSCwyQ0FBNEU7QUFDNUUsa0RBQXVCO0FBRXZCLGlFQUF5QztBQUV6Qzs7R0FFRztBQUNILE1BQU0sUUFBUSxHQUFZLGtCQUFRLENBQUMsV0FBVyxFQUFFLENBQUM7QUFFakQsU0FBZ0IsZUFBZSxDQUFDLFlBQW1CLFNBQVM7SUFDeEQsSUFBSSxTQUFTLElBQUksMEJBQWMsRUFBRTtRQUMvQixPQUFPLDBCQUFjLENBQUMsU0FBUyxDQUFDLENBQUM7S0FDbEM7U0FBTSxJQUFHLE9BQU8sU0FBUyxLQUFLLFdBQVcsRUFBRTtRQUMxQyxPQUFPLDBCQUFjLENBQUMsNEJBQWdCLENBQUMsQ0FBQztLQUN6QztJQUNELE9BQU8sdUJBQVcsQ0FBQztBQUN2QixDQUFDO0FBUEQsMENBT0M7QUFFRCxTQUFnQixnQkFBZ0IsQ0FBQyxNQUFTLEVBQUUsR0FBTTtJQUNoRCxPQUFPLGVBQUUsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxJQUFJLGVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDO0FBQzVDLENBQUM7QUFGRCw0Q0FFQztBQUVEOztHQUVHO0FBQ0gsU0FBZ0IsT0FBTztJQUNyQixPQUFPLElBQUksZUFBRSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxJQUFJLElBQUksRUFBRSxDQUFDLENBQUMsT0FBTyxFQUFFLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQztBQUMzRCxDQUFDO0FBRkQsMEJBRUM7QUFFRDs7OztHQUlHO0FBQ0gsU0FBZ0Isd0JBQXdCLENBQUMsRUFBUztJQUNoRCxPQUFPLGFBQWEsR0FBRyxRQUFRLENBQUMsVUFBVSxDQUFDLEVBQUUsQ0FBQyxDQUFDO0FBQ2pELENBQUM7QUFGRCw0REFFQztBQUVEOzs7O0dBSUc7QUFDSCxTQUFnQix3QkFBd0IsQ0FBQyxFQUFTO0lBQ2hELElBQUcsQ0FBQyxFQUFFLENBQUMsVUFBVSxDQUFDLGFBQWEsQ0FBQyxFQUFFO1FBQ2hDLE1BQU0sSUFBSSxLQUFLLENBQUMsOEVBQThFLENBQUMsQ0FBQztLQUNqRztJQUNELElBQUksT0FBTyxHQUFpQixFQUFFLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQzFDLE9BQU8sUUFBUSxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQzFELENBQUM7QUFORCw0REFNQztBQUVEOzs7O0dBSUc7QUFDSCxTQUFnQixvQkFBb0IsQ0FBQyxFQUFTO0lBQzVDLE9BQU8sU0FBUyxHQUFHLFFBQVEsQ0FBQyxVQUFVLENBQUMsRUFBRSxDQUFDLENBQUM7QUFDN0MsQ0FBQztBQUZELG9EQUVDO0FBRUQ7Ozs7R0FJRztBQUNILFNBQWdCLG9CQUFvQixDQUFDLEVBQVM7SUFDNUMsSUFBRyxDQUFDLEVBQUUsQ0FBQyxVQUFVLENBQUMsU0FBUyxDQUFDLEVBQUU7UUFDNUIsTUFBTSxJQUFJLEtBQUssQ0FBQyxpRUFBaUUsQ0FBQyxDQUFDO0tBQ3BGO0lBQ0QsSUFBSSxPQUFPLEdBQWlCLEVBQUUsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUM7SUFDMUMsT0FBTyxRQUFRLENBQUMsVUFBVSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDMUQsQ0FBQztBQU5ELG9EQU1DIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAcGFja2FnZURvY3VtZW50YXRpb25cbiAqIEBtb2R1bGUgVXRpbHMtSGVscGVyRnVuY3Rpb25zXG4gKi9cblxuaW1wb3J0IHsgTmV0d29ya0lEVG9IUlAsIERlZmF1bHROZXR3b3JrSUQsIEZhbGxiYWNrSFJQIH0gZnJvbSAnLi9jb25zdGFudHMnO1xuaW1wb3J0IEJOIGZyb20gJ2JuLmpzJztcbmltcG9ydCB7IEJ1ZmZlciB9IGZyb20gJ2J1ZmZlci8nO1xuaW1wb3J0IEJpblRvb2xzIGZyb20gJy4uL3V0aWxzL2JpbnRvb2xzJztcblxuLyoqXG4gKiBAaWdub3JlXG4gKi9cbmNvbnN0IGJpbnRvb2xzOkJpblRvb2xzID0gQmluVG9vbHMuZ2V0SW5zdGFuY2UoKTtcblxuZXhwb3J0IGZ1bmN0aW9uIGdldFByZWZlcnJlZEhSUChuZXR3b3JrSUQ6bnVtYmVyID0gdW5kZWZpbmVkKSB7XG4gICAgaWYgKG5ldHdvcmtJRCBpbiBOZXR3b3JrSURUb0hSUCkge1xuICAgICAgcmV0dXJuIE5ldHdvcmtJRFRvSFJQW25ldHdvcmtJRF07XG4gICAgfSBlbHNlIGlmKHR5cGVvZiBuZXR3b3JrSUQgPT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgIHJldHVybiBOZXR3b3JrSURUb0hSUFtEZWZhdWx0TmV0d29ya0lEXTtcbiAgICB9XG4gICAgcmV0dXJuIEZhbGxiYWNrSFJQO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gTWF4V2VpZ2h0Rm9ybXVsYShzdGFrZWQ6Qk4sIGNhcDpCTik6Qk57XG4gIHJldHVybiBCTi5taW4oc3Rha2VkLm11bChuZXcgQk4oNSkpLCBjYXApO1xufVxuXG4vKipcbiAqIEZ1bmN0aW9uIHByb3ZpZGluZyB0aGUgY3VycmVudCBVTklYIHRpbWUgdXNpbmcgYSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2luZHV0bnkvYm4uanMvfEJOfS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIFVuaXhOb3coKTpCTiB7XG4gIHJldHVybiBuZXcgQk4oTWF0aC5yb3VuZCgobmV3IERhdGUoKSkuZ2V0VGltZSgpIC8gMTAwMCkpO1xufVxuXG4vKipcbiAqIFRha2VzIGEgcHJpdmF0ZSBrZXkgYnVmZmVyIGFuZCBwcm9kdWNlcyBhIHByaXZhdGUga2V5IHN0cmluZyB3aXRoIHByZWZpeC5cbiAqIFxuICogQHBhcmFtIHBrIEEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0gZm9yIHRoZSBwcml2YXRlIGtleS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGJ1ZmZlclRvUHJpdmF0ZUtleVN0cmluZyhwazpCdWZmZXIpOnN0cmluZyB7XG4gIHJldHVybiBcIlByaXZhdGVLZXktXCIgKyBiaW50b29scy5jYjU4RW5jb2RlKHBrKTtcbn1cblxuLyoqXG4gKiBUYWtlcyBhIHByaXZhdGUga2V5IHN0cmluZyBhbmQgcHJvZHVjZXMgYSBwcml2YXRlIGtleSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfS5cbiAqIFxuICogQHBhcmFtIHBrIEEgc3RyaW5nIGZvciB0aGUgcHJpdmF0ZSBrZXkuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBwcml2YXRlS2V5U3RyaW5nVG9CdWZmZXIocGs6c3RyaW5nKTpCdWZmZXIge1xuICBpZighcGsuc3RhcnRzV2l0aChcIlByaXZhdGVLZXktXCIpKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKFwiRXJyb3IgLSBwcml2YXRlS2V5U3RyaW5nVG9CdWZmZXI6IHByaXZhdGUga2V5cyBtdXN0IHN0YXJ0IHdpdGggJ1ByaXZhdGVLZXktJ1wiKTtcbiAgfVxuICBsZXQgcGtzcGxpdDpBcnJheTxzdHJpbmc+ID0gcGsuc3BsaXQoXCItXCIpO1xuICByZXR1cm4gYmludG9vbHMuY2I1OERlY29kZShwa3NwbGl0W3Brc3BsaXQubGVuZ3RoIC0gMV0pO1xufVxuXG4vKipcbiAqIFRha2VzIGEgbm9kZUlEIGJ1ZmZlciBhbmQgcHJvZHVjZXMgYSBub2RlSUQgc3RyaW5nIHdpdGggcHJlZml4LlxuICogXG4gKiBAcGFyYW0gcGsgQSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSBmb3IgdGhlIG5vZGVJRC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGJ1ZmZlclRvTm9kZUlEU3RyaW5nKHBrOkJ1ZmZlcik6c3RyaW5nIHtcbiAgcmV0dXJuIFwiTm9kZUlELVwiICsgYmludG9vbHMuY2I1OEVuY29kZShwayk7XG59XG5cbi8qKlxuICogVGFrZXMgYSBub2RlSUQgc3RyaW5nIGFuZCBwcm9kdWNlcyBhIG5vZGVJRCB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfS5cbiAqIFxuICogQHBhcmFtIHBrIEEgc3RyaW5nIGZvciB0aGUgbm9kZUlELlxuICovXG5leHBvcnQgZnVuY3Rpb24gTm9kZUlEU3RyaW5nVG9CdWZmZXIocGs6c3RyaW5nKTpCdWZmZXIge1xuICBpZighcGsuc3RhcnRzV2l0aChcIk5vZGVJRC1cIikpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJFcnJvciAtIHByaXZhdGVOb2RlSURUb0J1ZmZlcjogbm9kZUlEIG11c3Qgc3RhcnQgd2l0aCAnTm9kZUlELSdcIik7XG4gIH1cbiAgbGV0IHBrc3BsaXQ6QXJyYXk8c3RyaW5nPiA9IHBrLnNwbGl0KFwiLVwiKTtcbiAgcmV0dXJuIGJpbnRvb2xzLmNiNThEZWNvZGUocGtzcGxpdFtwa3NwbGl0Lmxlbmd0aCAtIDFdKTtcbn0iXX0=