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
const utxos_1 = require("src/apis/evm/utxos");
const api_1 = require("src/apis/evm/api");
const keychain_1 = require("src/apis/evm/keychain");
const inputs_1 = require("src/apis/evm/inputs");
const create_hash_1 = __importDefault(require("create-hash"));
const bintools_1 = __importDefault(require("src/utils/bintools"));
const bn_js_1 = __importDefault(require("bn.js"));
const buffer_1 = require("buffer/");
const outputs_1 = require("src/apis/avm/outputs");
const constants_1 = require("src/apis/avm/constants");
const ops_1 = require("src/apis/avm/ops");
const index_1 = require("src/index");
const importtx_1 = require("src/apis/evm/importtx");
const constants_2 = require("src/utils/constants");
const constants_3 = require("src/utils/constants");
const constants_4 = require("../../../src/utils/constants");
/**
 * @ignore
 */
const bintools = bintools_1.default.getInstance();
describe("Transactions", () => {
    let set;
    let keymgr1;
    let keymgr2;
    let keymgr3;
    let addrs1;
    let addrs2;
    let addrs3;
    let utxos;
    let inputs;
    let outputs;
    let ops;
    let importIns;
    let importUTXOs;
    let exportOuts;
    let fungutxos;
    let exportUTXOIDS;
    let api;
    const amnt = 10000;
    const networkID = 12345;
    const memo = bintools.stringToBuffer("DijetsJS");
    const blockchainid = constants_3.Defaults.network[networkID].C.blockchainID;
    const alias = "X";
    const assetID = buffer_1.Buffer.from(create_hash_1.default("sha256").update("Well, now, don't you tell me to smile, you stick around I'll make it worth your while.").digest());
    const NFTassetID = buffer_1.Buffer.from(create_hash_1.default("sha256").update("I can't stand it, I know you planned it, I'mma set straight this Watergate.'").digest());
    let amount;
    let addresses;
    let fallAddresses;
    let locktime;
    let fallLocktime;
    let threshold;
    let fallThreshold;
    const nftutxoids = [];
    const ip = "127.0.0.1";
    const port = 8080;
    const protocol = "http";
    let dijets;
    const blockchainID = bintools.cb58Decode(blockchainid);
    const name = "Mortycoin is the dumb as a sack of hammers.";
    const symbol = "morT";
    const denomination = 8;
    let djtxAssetID;
    beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
        dijets = new index_1.Dijets(ip, port, protocol, networkID, undefined, undefined, null, true);
        api = new api_1.EVMAPI(dijets, "/ext/bc/avm", blockchainid);
        const result = api.getDJTXAssetID();
        const payload = {
            result: {
                name,
                symbol,
                assetID: bintools.cb58Encode(assetID),
                denomination: `${denomination}`,
            },
        };
        const responseObj = {
            data: payload,
        };
        jest_mock_axios_1.default.mockResponse(responseObj);
        djtxAssetID = yield result;
    }));
    beforeEach(() => {
        set = new utxos_1.UTXOSet();
        keymgr1 = new keychain_1.KeyChain(dijets.getHRP(), alias);
        keymgr2 = new keychain_1.KeyChain(dijets.getHRP(), alias);
        keymgr3 = new keychain_1.KeyChain(dijets.getHRP(), alias);
        addrs1 = [];
        addrs2 = [];
        addrs3 = [];
        utxos = [];
        inputs = [];
        outputs = [];
        importIns = [];
        importUTXOs = [];
        exportOuts = [];
        fungutxos = [];
        exportUTXOIDS = [];
        ops = [];
        for (let i = 0; i < 3; i++) {
            addrs1.push(keymgr1.makeKey().getAddress());
            addrs2.push(keymgr2.makeKey().getAddress());
            addrs3.push(keymgr3.makeKey().getAddress());
        }
        amount = constants_4.ONEDJTX.mul(new bn_js_1.default(amnt));
        addresses = keymgr1.getAddresses();
        fallAddresses = keymgr2.getAddresses();
        locktime = new bn_js_1.default(54321);
        fallLocktime = locktime.add(new bn_js_1.default(50));
        threshold = 3;
        fallThreshold = 1;
        const payload = buffer_1.Buffer.alloc(1024);
        payload.write("All you Trekkies and TV addicts, Don't mean to diss don't mean to bring static.", 0, 1024, "utf8");
        for (let i = 0; i < 5; i++) {
            let txid = buffer_1.Buffer.from(create_hash_1.default("sha256").update(bintools.fromBNToBuffer(new bn_js_1.default(i), 32)).digest());
            let txidx = buffer_1.Buffer.from(bintools.fromBNToBuffer(new bn_js_1.default(i), 4));
            const out = new outputs_1.SECPTransferOutput(amount, addresses, locktime, threshold);
            const xferout = new outputs_1.TransferableOutput(assetID, out);
            outputs.push(xferout);
            const u = new utxos_1.UTXO(constants_1.AVMConstants.LATESTCODEC, txid, txidx, assetID, out);
            utxos.push(u);
            fungutxos.push(u);
            importUTXOs.push(u);
            txid = u.getTxID();
            txidx = u.getOutputIdx();
            const input = new inputs_1.SECPTransferInput(amount);
            const xferin = new inputs_1.TransferableInput(txid, txidx, assetID, input);
            inputs.push(xferin);
            const nout = new outputs_1.NFTTransferOutput(1000 + i, payload, addresses, locktime, threshold);
            const op = new ops_1.NFTTransferOperation(nout);
            const nfttxid = buffer_1.Buffer.from(create_hash_1.default("sha256").update(bintools.fromBNToBuffer(new bn_js_1.default(1000 + i), 32)).digest());
            const nftutxo = new utxos_1.UTXO(constants_1.AVMConstants.LATESTCODEC, nfttxid, 1000 + i, NFTassetID, nout);
            nftutxoids.push(nftutxo.getUTXOID());
            const xferop = new ops_1.TransferableOperation(NFTassetID, [nftutxo.getUTXOID()], op);
            ops.push(xferop);
            utxos.push(nftutxo);
        }
        for (let i = 1; i < 4; i++) {
            importIns.push(inputs[i]);
            exportOuts.push(outputs[i]);
            exportUTXOIDS.push(fungutxos[i].getUTXOID());
        }
        set.addArray(utxos);
    });
    test("Creation ImportTx", () => {
        const ip = "localhost";
        const port = 9650;
        const protocol = "http";
        const networkID = 12345;
        const dijets = new index_1.Dijets(ip, port, protocol, networkID);
        const cchain = dijets.CChain();
        const bintools = bintools_1.default.getInstance();
        const cKeychain = cchain.keyChain();
        const privKey = `${constants_2.PrivateKeyPrefix}${constants_2.DefaultLocalGenesisPrivateKey}`;
        cKeychain.importKey(privKey);
        const cChainBlockchainIdStr = constants_3.Defaults.network["12345"].C.blockchainID;
        const cChainBlockchainIdBuf = bintools.cb58Decode(cChainBlockchainIdStr);
        const xChainBlockchainIdStr = constants_3.Defaults.network["12345"].X.blockchainID;
        const xChainBlockchainIdBuf = bintools.cb58Decode(xChainBlockchainIdStr);
        const importedIns = [];
        const evmOutputs = [];
        const importTx = new importtx_1.ImportTx(networkID, cChainBlockchainIdBuf, xChainBlockchainIdBuf, importedIns, evmOutputs);
        const importTxBuff = importTx.toBuffer();
        const importTxNew = new importtx_1.ImportTx();
        importTxNew.fromBuffer(importTxBuff);
        const importbuff = importTx.toBuffer();
        importTxNew.fromBuffer(importbuff);
        console.log();
        expect(importTxNew.toBuffer().toString("hex")).toBe(importbuff.toString("hex"));
        expect(importTxNew.toString()).toBe(importTx.toString());
        expect(importTx.getImportInputs().length).toBe(importIns.length);
    });
    //   test('Creation ExportTx', () => {
    //     cnst bombtx: ExportTx = new ExportTx(
    //       netid, blockchainID, outputs, inputs, undefined, undefined, exportOuts
    //     );
    //     expect(() => {
    //       bombtx.toBuffer();
    //     }).toThrow();
    //     const exporttx: ExportTx = new ExportTx(
    //       netid, blockchainID, outputs, inputs, undefined, bintools.cb58Decode(PlatformChainID), exportOuts
    //     );
    //     const txunew: ExportTx = new ExportTx();
    //     const exportbuff: Buffer = exporttx.toBuffer();
    //     txunew.fromBuffer(exportbuff);
    //     expect(txunew.toBuffer().toString('hex')).toBe(exportbuff.toString('hex'));
    //     expect(txunew.toString()).toBe(exporttx.toString());
    //     expect(exporttx.getExportOutputs().length).toBe(exportOuts.length);
    //   });
    //   test('Creation Tx4 using ImportTx', () => {
    //     const txu:UnsignedTx = set.buildImportTx(
    //       netid, blockchainID, addrs3, addrs1, addrs2, importUTXOs, bintools.cb58Decode(PlatformChainID), new BN(90), assetID,
    //       new UTF8Payload("hello world").getPayload(), UnixNow());
    //     const tx:Tx = txu.sign(keymgr1);
    //     const tx2:Tx = new Tx();
    //     tx2.fromBuffer(tx.toBuffer());
    //     expect(tx2.toBuffer().toString('hex')).toBe(tx.toBuffer().toString('hex'));
    //   });
    //   test('Creation Tx5 using ExportTx', () => {
    //     const txu:UnsignedTx = set.buildExportTx(
    //       netid, blockchainID, new BN(90), djtxAssetID,
    //       addrs3, addrs1, addrs2, bintools.cb58Decode(PlatformChainID), 
    //       undefined, undefined, new UTF8Payload("hello world").getPayload(), UnixNow()
    //     )
    //     const tx:Tx = txu.sign(keymgr1);
    //     const tx2:Tx = new Tx();
    //     tx2.fromBuffer(tx.toBuffer());
    //     expect(tx.toBuffer().toString('hex')).toBe(tx2.toBuffer().toString('hex'));
    //   });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHgudGVzdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3Rlc3RzL2FwaXMvZXZtL3R4LnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7QUFBQSxzRUFBd0M7QUFDeEMsOENBQW1EO0FBQ25ELDBDQUEwQztBQUUxQyxvREFBaUQ7QUFDakQsZ0RBRzZCO0FBQzdCLDhEQUFxQztBQUNyQyxrRUFBMEM7QUFDMUMsa0RBQXVCO0FBQ3ZCLG9DQUFpQztBQUNqQyxrREFJOEI7QUFDOUIsc0RBQXNEO0FBQ3RELDBDQUcwQjtBQUMxQixxQ0FBc0M7QUFFdEMsb0RBQWlEO0FBRWpELG1EQUF1RztBQUN2RyxtREFBK0M7QUFDL0MsNERBQXVEO0FBR3ZEOztHQUVHO0FBQ0gsTUFBTSxRQUFRLEdBQUcsa0JBQVEsQ0FBQyxXQUFXLEVBQUUsQ0FBQztBQUN4QyxRQUFRLENBQUMsY0FBYyxFQUFFLEdBQUcsRUFBRTtJQUM1QixJQUFJLEdBQVcsQ0FBQztJQUNoQixJQUFJLE9BQWdCLENBQUM7SUFDckIsSUFBSSxPQUFnQixDQUFDO0lBQ3JCLElBQUksT0FBZ0IsQ0FBQztJQUNyQixJQUFJLE1BQW9CLENBQUM7SUFDekIsSUFBSSxNQUFvQixDQUFDO0lBQ3pCLElBQUksTUFBb0IsQ0FBQztJQUN6QixJQUFJLEtBQWlCLENBQUM7SUFDdEIsSUFBSSxNQUErQixDQUFDO0lBQ3BDLElBQUksT0FBaUMsQ0FBQztJQUN0QyxJQUFJLEdBQWdDLENBQUM7SUFDckMsSUFBSSxTQUFrQyxDQUFDO0lBQ3ZDLElBQUksV0FBdUIsQ0FBQztJQUM1QixJQUFJLFVBQW9DLENBQUM7SUFDekMsSUFBSSxTQUFxQixDQUFDO0lBQzFCLElBQUksYUFBMkIsQ0FBQztJQUNoQyxJQUFJLEdBQVUsQ0FBQztJQUNmLE1BQU0sSUFBSSxHQUFVLEtBQUssQ0FBQztJQUMxQixNQUFNLFNBQVMsR0FBVSxLQUFLLENBQUM7SUFDL0IsTUFBTSxJQUFJ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O0lBQ3JCLDJCQUEyQjtJQUMzQixvQkFBb0I7SUFFcEIsK0NBQStDO0lBQy9DLDBHQUEwRztJQUMxRyxTQUFTO0lBQ1QsK0NBQStDO0lBQy9DLHNEQUFzRDtJQUN0RCxxQ0FBcUM7SUFFckMsa0ZBQWtGO0lBQ2xGLDJEQUEyRDtJQUMzRCwwRUFBMEU7SUFDMUUsUUFBUTtJQUVSLGdEQUFnRDtJQUNoRCxnREFBZ0Q7SUFDaEQsNkhBQTZIO0lBQzdILGlFQUFpRTtJQUNqRSx1Q0FBdUM7SUFDdkMsK0JBQStCO0lBQy9CLHFDQUFxQztJQUNyQyxrRkFBa0Y7SUFDbEYsUUFBUTtJQUVSLGdEQUFnRDtJQUNoRCxnREFBZ0Q7SUFDaEQsc0RBQXNEO0lBQ3RELHVFQUF1RTtJQUN2RSxxRkFBcUY7SUFDckYsUUFBUTtJQUNSLHVDQUF1QztJQUN2QywrQkFBK0I7SUFDL0IscUNBQXFDO0lBQ3JDLGtGQUFrRjtJQUNsRixRQUFRO0FBQ1IsQ0FBQyxDQUFDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgbW9ja0F4aW9zIGZyb20gJ2plc3QtbW9jay1heGlvcyc7XG5pbXBvcnQgeyBVVFhPU2V0LCBVVFhPIH0gZnJvbSAnc3JjL2FwaXMvZXZtL3V0eG9zJztcbmltcG9ydCB7IEVWTUFQSSB9IGZyb20gJ3NyYy9hcGlzL2V2bS9hcGknO1xuaW1wb3J0IHsgVW5zaWduZWRUeCwgVHggfSBmcm9tICdzcmMvYXBpcy9ldm0vdHgnO1xuaW1wb3J0IHsgS2V5Q2hhaW4gfSBmcm9tICdzcmMvYXBpcy9ldm0va2V5Y2hhaW4nO1xuaW1wb3J0IHsgXG4gICAgU0VDUFRyYW5zZmVySW5wdXQsIFxuICAgIFRyYW5zZmVyYWJsZUlucHV0IFxufSBmcm9tICdzcmMvYXBpcy9ldm0vaW5wdXRzJztcbmltcG9ydCBjcmVhdGVIYXNoIGZyb20gJ2NyZWF0ZS1oYXNoJztcbmltcG9ydCBCaW5Ub29scyBmcm9tICdzcmMvdXRpbHMvYmludG9vbHMnO1xuaW1wb3J0IEJOIGZyb20gJ2JuLmpzJztcbmltcG9ydCB7IEJ1ZmZlciB9IGZyb20gJ2J1ZmZlci8nO1xuaW1wb3J0IHsgXG4gICAgU0VDUFRyYW5zZmVyT3V0cHV0LCBcbiAgICBORlRUcmFuc2Zlck91dHB1dCwgXG4gICAgVHJhbnNmZXJhYmxlT3V0cHV0IFxufSBmcm9tICdzcmMvYXBpcy9hdm0vb3V0cHV0cyc7XG5pbXBvcnQgeyBBVk1Db25zdGFudHMgfSBmcm9tICdzcmMvYXBpcy9hdm0vY29uc3RhbnRzJztcbmltcG9ydCB7IFxuICAgIFRyYW5zZmVyYWJsZU9wZXJhdGlvbiwgXG4gICAgTkZUVHJhbnNmZXJPcGVyYXRpb24gXG59IGZyb20gJ3NyYy9hcGlzL2F2bS9vcHMnO1xuaW1wb3J0IHsgQXZhbGFuY2hlIH0gZnJvbSAnc3JjL2luZGV4JztcbmltcG9ydCB7IFVURjhQYXlsb2FkIH0gZnJvbSAnc3JjL3V0aWxzL3BheWxvYWQnO1xuaW1wb3J0IHsgSW1wb3J0VHggfSBmcm9tICdzcmMvYXBpcy9ldm0vaW1wb3J0dHgnO1xuaW1wb3J0IHsgRXhwb3J0VHggfSBmcm9tICdzcmMvYXBpcy9ldm0vZXhwb3J0dHgnO1xuaW1wb3J0IHsgRGVmYXVsdExvY2FsR2VuZXNpc1ByaXZhdGVLZXksIFBsYXRmb3JtQ2hhaW5JRCwgUHJpdmF0ZUtleVByZWZpeCB9IGZyb20gJ3NyYy91dGlscy9jb25zdGFudHMnO1xuaW1wb3J0IHsgRGVmYXVsdHMgfSBmcm9tICdzcmMvdXRpbHMvY29uc3RhbnRzJztcbmltcG9ydCB7IE9ORUFWQVggfSBmcm9tICcuLi8uLi8uLi9zcmMvdXRpbHMvY29uc3RhbnRzJztcbmltcG9ydCB7IEVWTU91dHB1dCB9IGZyb20gJ3NyYy9hcGlzL2V2bSc7XG5cbi8qKlxuICogQGlnbm9yZVxuICovXG5jb25zdCBiaW50b29scyA9IEJpblRvb2xzLmdldEluc3RhbmNlKCk7XG5kZXNjcmliZShcIlRyYW5zYWN0aW9uc1wiLCAoKSA9PiB7XG4gIGxldCBzZXQ6VVRYT1NldDtcbiAgbGV0IGtleW1ncjE6S2V5Q2hhaW47XG4gIGxldCBrZXltZ3IyOktleUNoYWluO1xuICBsZXQga2V5bWdyMzpLZXlDaGFpbjtcbiAgbGV0IGFkZHJzMTpBcnJheTxCdWZmZXI+O1xuICBsZXQgYWRkcnMyOkFycmF5PEJ1ZmZlcj47XG4gIGxldCBhZGRyczM6QXJyYXk8QnVmZmVyPjtcbiAgbGV0IHV0eG9zOkFycmF5PFVUWE8+O1xuICBsZXQgaW5wdXRzOkFycmF5PFRyYW5zZmVyYWJsZUlucHV0PjtcbiAgbGV0IG91dHB1dHM6QXJyYXk8VHJhbnNmZXJhYmxlT3V0cHV0PjtcbiAgbGV0IG9wczpBcnJheTxUcmFuc2ZlcmFibGVPcGVyYXRpb24+O1xuICBsZXQgaW1wb3J0SW5zOkFycmF5PFRyYW5zZmVyYWJsZUlucHV0PjtcbiAgbGV0IGltcG9ydFVUWE9zOkFycmF5PFVUWE8+O1xuICBsZXQgZXhwb3J0T3V0czpBcnJheTxUcmFuc2ZlcmFibGVPdXRwdXQ+O1xuICBsZXQgZnVuZ3V0eG9zOkFycmF5PFVUWE8+O1xuICBsZXQgZXhwb3J0VVRYT0lEUzpBcnJheTxzdHJpbmc+O1xuICBsZXQgYXBpOkVWTUFQSTtcbiAgY29uc3QgYW1udDpudW1iZXIgPSAxMDAwMDtcbiAgY29uc3QgbmV0d29ya0lEOm51bWJlciA9IDEyMzQ1O1xuICBjb25zdCBtZW1vOkJ1ZmZlciA9IGJpbnRvb2xzLnN0cmluZ1RvQnVmZmVyKFwiQXZhbGFuY2hlSlNcIik7XG4gIGNvbnN0IGJsb2NrY2hhaW5pZDpzdHJpbmcgPSBEZWZhdWx0cy5uZXR3b3JrW25ldHdvcmtJRF0uQy5ibG9ja2NoYWluSUQ7XG4gIGNvbnN0IGFsaWFzOnN0cmluZyA9IFwiWFwiO1xuICBjb25zdCBhc3NldElEOkJ1ZmZlciA9IEJ1ZmZlci5mcm9tKGNyZWF0ZUhhc2goXCJzaGEyNTZcIikudXBkYXRlKFwiV2VsbCwgbm93LCBkb24ndCB5b3UgdGVsbCBtZSB0byBzbWlsZSwgeW91IHN0aWNrIGFyb3VuZCBJJ2xsIG1ha2UgaXQgd29ydGggeW91ciB3aGlsZS5cIikuZGlnZXN0KCkpO1xuICBjb25zdCBORlRhc3NldElEOkJ1ZmZlciA9IEJ1ZmZlci5mcm9tKGNyZWF0ZUhhc2goXCJzaGEyNTZcIikudXBkYXRlKFwiSSBjYW4ndCBzdGFuZCBpdCwgSSBrbm93IHlvdSBwbGFubmVkIGl0LCBJJ21tYSBzZXQgc3RyYWlnaHQgdGhpcyBXYXRlcmdhdGUuJ1wiKS5kaWdlc3QoKSk7XG4gIGxldCBhbW91bnQ6Qk47XG4gIGxldCBhZGRyZXNzZXM6QXJyYXk8QnVmZmVyPjtcbiAgbGV0IGZhbGxBZGRyZXNzZXM6QXJyYXk8QnVmZmVyPjtcbiAgbGV0IGxvY2t0aW1lOkJOO1xuICBsZXQgZmFsbExvY2t0aW1lOkJOO1xuICBsZXQgdGhyZXNob2xkOm51bWJlcjtcbiAgbGV0IGZhbGxUaHJlc2hvbGQ6bnVtYmVyO1xuICBjb25zdCBuZnR1dHhvaWRzOkFycmF5PHN0cmluZz4gPSBbXTtcbiAgY29uc3QgaXAgPSBcIjEyNy4wLjAuMVwiO1xuICBjb25zdCBwb3J0ID0gODA4MDtcbiAgY29uc3QgcHJvdG9jb2wgPSBcImh0dHBcIjtcbiAgbGV0IGF2YWxhbmNoZTpBdmFsYW5jaGU7XG4gIGNvbnN0IGJsb2NrY2hhaW5JRDpCdWZmZXIgPSBiaW50b29scy5jYjU4RGVjb2RlKGJsb2NrY2hhaW5pZCk7XG4gIGNvbnN0IG5hbWU6c3RyaW5nID0gXCJNb3J0eWNvaW4gaXMgdGhlIGR1bWIgYXMgYSBzYWNrIG9mIGhhbW1lcnMuXCI7XG4gIGNvbnN0IHN5bWJvbDpzdHJpbmcgPSBcIm1vclRcIjtcbiAgY29uc3QgZGVub21pbmF0aW9uOm51bWJlciA9IDg7XG4gIGxldCBhdmF4QXNzZXRJRDpCdWZmZXI7XG5cbiAgYmVmb3JlQWxsKGFzeW5jICgpID0+IHtcbiAgICBhdmFsYW5jaGUgPSBuZXcgQXZhbGFuY2hlKGlwLCBwb3J0LCBwcm90b2NvbCwgbmV0d29ya0lELCB1bmRlZmluZWQsIHVuZGVmaW5lZCwgbnVsbCwgdHJ1ZSk7XG4gICAgYXBpID0gbmV3IEVWTUFQSShhdmFsYW5jaGUsIFwiL2V4dC9iYy9hdm1cIiwgYmxvY2tjaGFpbmlkKTtcblxuICAgIGNvbnN0IHJlc3VsdDpQcm9taXNlPEJ1ZmZlcj4gPSBhcGkuZ2V0QVZBWEFzc2V0SUQoKTtcbiAgICBjb25zdCBwYXlsb2FkOm9iamVjdCA9IHtcbiAgICAgIHJlc3VsdDoge1xuICAgICAgICBuYW1lLFxuICAgICAgICBzeW1ib2wsXG4gICAgICAgIGFzc2V0SUQ6IGJpbnRvb2xzLmNiNThFbmNvZGUoYXNzZXRJRCksXG4gICAgICAgIGRlbm9taW5hdGlvbjogYCR7ZGVub21pbmF0aW9ufWAsXG4gICAgICB9LFxuICAgIH07XG4gICAgY29uc3QgcmVzcG9uc2VPYmogPSB7XG4gICAgICBkYXRhOiBwYXlsb2FkLFxuICAgIH07XG5cbiAgICBtb2NrQXhpb3MubW9ja1Jlc3BvbnNlKHJlc3BvbnNlT2JqKTtcbiAgICBhdmF4QXNzZXRJRCA9IGF3YWl0IHJlc3VsdDtcbiAgfSk7XG5cbiAgYmVmb3JlRWFjaCgoKSA9PiB7XG4gICAgc2V0ID0gbmV3IFVUWE9TZXQoKTtcbiAgICBrZXltZ3IxID0gbmV3IEtleUNoYWluKGF2YWxhbmNoZS5nZXRIUlAoKSwgYWxpYXMpO1xuICAgIGtleW1ncjIgPSBuZXcgS2V5Q2hhaW4oYXZhbGFuY2hlLmdldEhSUCgpLCBhbGlhcyk7XG4gICAga2V5bWdyMyA9IG5ldyBLZXlDaGFpbihhdmFsYW5jaGUuZ2V0SFJQKCksIGFsaWFzKTtcbiAgICBhZGRyczEgPSBbXTtcbiAgICBhZGRyczIgPSBbXTtcbiAgICBhZGRyczMgPSBbXTtcbiAgICB1dHhvcyA9IFtdO1xuICAgIGlucHV0cyA9IFtdO1xuICAgIG91dHB1dHMgPSBbXTtcbiAgICBpbXBvcnRJbnMgPSBbXTtcbiAgICBpbXBvcnRVVFhPcyA9IFtdO1xuICAgIGV4cG9ydE91dHMgPSBbXTtcbiAgICBmdW5ndXR4b3MgPSBbXTtcbiAgICBleHBvcnRVVFhPSURTID0gW107XG4gICAgb3BzID0gW107XG4gICAgZm9yIChsZXQgaTpudW1iZXIgPSAwOyBpIDwgMzsgaSsrKSB7XG4gICAgICBhZGRyczEucHVzaChrZXltZ3IxLm1ha2VLZXkoKS5nZXRBZGRyZXNzKCkpO1xuICAgICAgYWRkcnMyLnB1c2goa2V5bWdyMi5tYWtlS2V5KCkuZ2V0QWRkcmVzcygpKTtcbiAgICAgIGFkZHJzMy5wdXNoKGtleW1ncjMubWFrZUtleSgpLmdldEFkZHJlc3MoKSk7XG4gICAgfVxuICAgIGFtb3VudCA9IE9ORUFWQVgubXVsKG5ldyBCTihhbW50KSk7XG4gICAgYWRkcmVzc2VzID0ga2V5bWdyMS5nZXRBZGRyZXNzZXMoKTtcbiAgICBmYWxsQWRkcmVzc2VzID0ga2V5bWdyMi5nZXRBZGRyZXNzZXMoKTtcbiAgICBsb2NrdGltZSA9IG5ldyBCTig1NDMyMSk7XG4gICAgZmFsbExvY2t0aW1lID0gbG9ja3RpbWUuYWRkKG5ldyBCTig1MCkpO1xuICAgIHRocmVzaG9sZCA9IDM7XG4gICAgZmFsbFRocmVzaG9sZCA9IDE7XG5cbiAgICBjb25zdCBwYXlsb2FkOkJ1ZmZlciA9IEJ1ZmZlci5hbGxvYygxMDI0KTtcbiAgICBwYXlsb2FkLndyaXRlKFwiQWxsIHlvdSBUcmVra2llcyBhbmQgVFYgYWRkaWN0cywgRG9uJ3QgbWVhbiB0byBkaXNzIGRvbid0IG1lYW4gdG8gYnJpbmcgc3RhdGljLlwiLCAwLCAxMDI0LCBcInV0ZjhcIik7XG5cbiAgICBmb3IgKGxldCBpOm51bWJlciA9IDA7IGkgPCA1OyBpKyspIHtcbiAgICAgIGxldCB0eGlkOkJ1ZmZlciA9IEJ1ZmZlci5mcm9tKGNyZWF0ZUhhc2goXCJzaGEyNTZcIikudXBkYXRlKGJpbnRvb2xzLmZyb21CTlRvQnVmZmVyKG5ldyBCTihpKSwgMzIpKS5kaWdlc3QoKSk7XG4gICAgICBsZXQgdHhpZHg6QnVmZmVyID0gQnVmZmVyLmZyb20oYmludG9vbHMuZnJvbUJOVG9CdWZmZXIobmV3IEJOKGkpLCA0KSk7XG4gICAgICBjb25zdCBvdXQ6U0VDUFRyYW5zZmVyT3V0cHV0ID0gbmV3IFNFQ1BUcmFuc2Zlck91dHB1dChhbW91bnQsIGFkZHJlc3NlcywgbG9ja3RpbWUsIHRocmVzaG9sZCk7XG4gICAgICBjb25zdCB4ZmVyb3V0OlRyYW5zZmVyYWJsZU91dHB1dCA9IG5ldyBUcmFuc2ZlcmFibGVPdXRwdXQoYXNzZXRJRCwgb3V0KTtcbiAgICAgIG91dHB1dHMucHVzaCh4ZmVyb3V0KTtcblxuICAgICAgY29uc3QgdTpVVFhPID0gbmV3IFVUWE8oQVZNQ29uc3RhbnRzLkxBVEVTVENPREVDLCB0eGlkLCB0eGlkeCwgYXNzZXRJRCwgb3V0KTtcbiAgICAgIHV0eG9zLnB1c2godSk7XG4gICAgICBmdW5ndXR4b3MucHVzaCh1KTtcbiAgICAgIGltcG9ydFVUWE9zLnB1c2godSk7XG5cbiAgICAgIHR4aWQgPSB1LmdldFR4SUQoKTtcbiAgICAgIHR4aWR4ID0gdS5nZXRPdXRwdXRJZHgoKTtcblxuICAgICAgY29uc3QgaW5wdXQ6U0VDUFRyYW5zZmVySW5wdXQgPSBuZXcgU0VDUFRyYW5zZmVySW5wdXQoYW1vdW50KTtcbiAgICAgIGNvbnN0IHhmZXJpbjpUcmFuc2ZlcmFibGVJbnB1dCA9IG5ldyBUcmFuc2ZlcmFibGVJbnB1dCh0eGlkLCB0eGlkeCwgYXNzZXRJRCwgaW5wdXQpO1xuICAgICAgaW5wdXRzLnB1c2goeGZlcmluKTtcblxuICAgICAgY29uc3Qgbm91dDpORlRUcmFuc2Zlck91dHB1dCA9IG5ldyBORlRUcmFuc2Zlck91dHB1dCgxMDAwICsgaSwgcGF5bG9hZCwgYWRkcmVzc2VzLCBsb2NrdGltZSwgdGhyZXNob2xkKTtcbiAgICAgIGNvbnN0IG9wOk5GVFRyYW5zZmVyT3BlcmF0aW9uID0gbmV3IE5GVFRyYW5zZmVyT3BlcmF0aW9uKG5vdXQpO1xuICAgICAgY29uc3QgbmZ0dHhpZDpCdWZmZXIgPSBCdWZmZXIuZnJvbShjcmVhdGVIYXNoKFwic2hhMjU2XCIpLnVwZGF0ZShiaW50b29scy5mcm9tQk5Ub0J1ZmZlcihuZXcgQk4oMTAwMCArIGkpLCAzMikpLmRpZ2VzdCgpKTtcbiAgICAgIGNvbnN0IG5mdHV0eG86VVRYTyA9IG5ldyBVVFhPKEFWTUNvbnN0YW50cy5MQVRFU1RDT0RFQywgbmZ0dHhpZCwgMTAwMCArIGksIE5GVGFzc2V0SUQsIG5vdXQpO1xuICAgICAgbmZ0dXR4b2lkcy5wdXNoKG5mdHV0eG8uZ2V0VVRYT0lEKCkpO1xuICAgICAgY29uc3QgeGZlcm9wOlRyYW5zZmVyYWJsZU9wZXJhdGlvbiA9IG5ldyBUcmFuc2ZlcmFibGVPcGVyYXRpb24oTkZUYXNzZXRJRCwgW25mdHV0eG8uZ2V0VVRYT0lEKCldLCBvcCk7XG4gICAgICBvcHMucHVzaCh4ZmVyb3ApO1xuICAgICAgdXR4b3MucHVzaChuZnR1dHhvKTtcbiAgICB9XG4gICAgZm9yKGxldCBpOm51bWJlciA9IDE7IGkgPCA0OyBpKyspe1xuICAgICAgaW1wb3J0SW5zLnB1c2goaW5wdXRzW2ldKTtcbiAgICAgIGV4cG9ydE91dHMucHVzaChvdXRwdXRzW2ldKTtcbiAgICAgIGV4cG9ydFVUWE9JRFMucHVzaChmdW5ndXR4b3NbaV0uZ2V0VVRYT0lEKCkpO1xuICAgIH1cbiAgICBzZXQuYWRkQXJyYXkodXR4b3MpO1xuICB9KTtcblxuICB0ZXN0KFwiQ3JlYXRpb24gSW1wb3J0VHhcIiwgKCkgPT4ge1xuICAgIGNvbnN0IGlwOiBzdHJpbmcgPSBcImxvY2FsaG9zdFwiXG4gICAgY29uc3QgcG9ydDogbnVtYmVyID0gOTY1MFxuICAgIGNvbnN0IHByb3RvY29sOiBzdHJpbmcgPSBcImh0dHBcIlxuICAgIGNvbnN0IG5ldHdvcmtJRDogbnVtYmVyID0gMTIzNDVcbiAgICBjb25zdCBhdmFsYW5jaGU6IEF2YWxhbmNoZSA9IG5ldyBBdmFsYW5jaGUoaXAsIHBvcnQsIHByb3RvY29sLCBuZXR3b3JrSUQpXG4gICAgY29uc3QgY2NoYWluOiBFVk1BUEkgPSBhdmFsYW5jaGUuQ0NoYWluKClcbiAgICBjb25zdCBiaW50b29sczogQmluVG9vbHMgPSBCaW5Ub29scy5nZXRJbnN0YW5jZSgpXG4gICAgY29uc3QgY0tleWNoYWluOiBLZXlDaGFpbiA9IGNjaGFpbi5rZXlDaGFpbigpXG4gICAgY29uc3QgcHJpdktleTogc3RyaW5nID0gYCR7UHJpdmF0ZUtleVByZWZpeH0ke0RlZmF1bHRMb2NhbEdlbmVzaXNQcml2YXRlS2V5fWBcbiAgICBjS2V5Y2hhaW4uaW1wb3J0S2V5KHByaXZLZXkpXG4gICAgY29uc3QgY0NoYWluQmxvY2tjaGFpbklkU3RyOiBzdHJpbmcgPSBEZWZhdWx0cy5uZXR3b3JrW1wiMTIzNDVcIl0uQy5ibG9ja2NoYWluSURcbiAgICBjb25zdCBjQ2hhaW5CbG9ja2NoYWluSWRCdWY6IEJ1ZmZlciA9IGJpbnRvb2xzLmNiNThEZWNvZGUoY0NoYWluQmxvY2tjaGFpbklkU3RyKVxuICAgIGNvbnN0IHhDaGFpbkJsb2NrY2hhaW5JZFN0cjogc3RyaW5nID0gRGVmYXVsdHMubmV0d29ya1tcIjEyMzQ1XCJdLlguYmxvY2tjaGFpbklEXG4gICAgY29uc3QgeENoYWluQmxvY2tjaGFpbklkQnVmOiBCdWZmZXIgPSBiaW50b29scy5jYjU4RGVjb2RlKHhDaGFpbkJsb2NrY2hhaW5JZFN0cilcbiAgICBjb25zdCBpbXBvcnRlZEluczogVHJhbnNmZXJhYmxlSW5wdXRbXSA9IFtdXG4gICAgY29uc3QgZXZtT3V0cHV0czogRVZNT3V0cHV0W10gPSBbXVxuXG4gICAgY29uc3QgaW1wb3J0VHg6IEltcG9ydFR4ID0gbmV3IEltcG9ydFR4KFxuICAgICAgbmV0d29ya0lELCBcbiAgICAgIGNDaGFpbkJsb2NrY2hhaW5JZEJ1ZiwgXG4gICAgICB4Q2hhaW5CbG9ja2NoYWluSWRCdWYsXG4gICAgICBpbXBvcnRlZElucyxcbiAgICAgIGV2bU91dHB1dHNcbiAgICApO1xuXG4gICAgY29uc3QgaW1wb3J0VHhCdWZmOiBCdWZmZXIgPSBpbXBvcnRUeC50b0J1ZmZlcigpO1xuICAgIGNvbnN0IGltcG9ydFR4TmV3OiBJbXBvcnRUeCA9IG5ldyBJbXBvcnRUeCgpO1xuICAgIGltcG9ydFR4TmV3LmZyb21CdWZmZXIoaW1wb3J0VHhCdWZmKTtcblxuICAgIGNvbnN0IGltcG9ydGJ1ZmY6IEJ1ZmZlciA9IGltcG9ydFR4LnRvQnVmZmVyKCk7XG4gICAgaW1wb3J0VHhOZXcuZnJvbUJ1ZmZlcihpbXBvcnRidWZmKTtcblxuICAgIGNvbnNvbGUubG9nKClcbiAgICBleHBlY3QoaW1wb3J0VHhOZXcudG9CdWZmZXIoKS50b1N0cmluZyhcImhleFwiKSkudG9CZShpbXBvcnRidWZmLnRvU3RyaW5nKFwiaGV4XCIpKTtcbiAgICBleHBlY3QoaW1wb3J0VHhOZXcudG9TdHJpbmcoKSkudG9CZShpbXBvcnRUeC50b1N0cmluZygpKTtcbiAgICBleHBlY3QoaW1wb3J0VHguZ2V0SW1wb3J0SW5wdXRzKCkubGVuZ3RoKS50b0JlKGltcG9ydElucy5sZW5ndGgpO1xuICB9KTtcblxuLy8gICB0ZXN0KCdDcmVhdGlvbiBFeHBvcnRUeCcsICgpID0+IHtcbi8vICAgICBjbnN0IGJvbWJ0eDogRXhwb3J0VHggPSBuZXcgRXhwb3J0VHgoXG4vLyAgICAgICBuZXRpZCwgYmxvY2tjaGFpbklELCBvdXRwdXRzLCBpbnB1dHMsIHVuZGVmaW5lZCwgdW5kZWZpbmVkLCBleHBvcnRPdXRzXG4vLyAgICAgKTtcblxuLy8gICAgIGV4cGVjdCgoKSA9PiB7XG4vLyAgICAgICBib21idHgudG9CdWZmZXIoKTtcbi8vICAgICB9KS50b1Rocm93KCk7XG5cbi8vICAgICBjb25zdCBleHBvcnR0eDogRXhwb3J0VHggPSBuZXcgRXhwb3J0VHgoXG4vLyAgICAgICBuZXRpZCwgYmxvY2tjaGFpbklELCBvdXRwdXRzLCBpbnB1dHMsIHVuZGVmaW5lZCwgYmludG9vbHMuY2I1OERlY29kZShQbGF0Zm9ybUNoYWluSUQpLCBleHBvcnRPdXRzXG4vLyAgICAgKTtcbi8vICAgICBjb25zdCB0eHVuZXc6IEV4cG9ydFR4ID0gbmV3IEV4cG9ydFR4KCk7XG4vLyAgICAgY29uc3QgZXhwb3J0YnVmZjogQnVmZmVyID0gZXhwb3J0dHgudG9CdWZmZXIoKTtcbi8vICAgICB0eHVuZXcuZnJvbUJ1ZmZlcihleHBvcnRidWZmKTtcblxuLy8gICAgIGV4cGVjdCh0eHVuZXcudG9CdWZmZXIoKS50b1N0cmluZygnaGV4JykpLnRvQmUoZXhwb3J0YnVmZi50b1N0cmluZygnaGV4JykpO1xuLy8gICAgIGV4cGVjdCh0eHVuZXcudG9TdHJpbmcoKSkudG9CZShleHBvcnR0eC50b1N0cmluZygpKTtcbi8vICAgICBleHBlY3QoZXhwb3J0dHguZ2V0RXhwb3J0T3V0cHV0cygpLmxlbmd0aCkudG9CZShleHBvcnRPdXRzLmxlbmd0aCk7XG4vLyAgIH0pO1xuXG4vLyAgIHRlc3QoJ0NyZWF0aW9uIFR4NCB1c2luZyBJbXBvcnRUeCcsICgpID0+IHtcbi8vICAgICBjb25zdCB0eHU6VW5zaWduZWRUeCA9IHNldC5idWlsZEltcG9ydFR4KFxuLy8gICAgICAgbmV0aWQsIGJsb2NrY2hhaW5JRCwgYWRkcnMzLCBhZGRyczEsIGFkZHJzMiwgaW1wb3J0VVRYT3MsIGJpbnRvb2xzLmNiNThEZWNvZGUoUGxhdGZvcm1DaGFpbklEKSwgbmV3IEJOKDkwKSwgYXNzZXRJRCxcbi8vICAgICAgIG5ldyBVVEY4UGF5bG9hZChcImhlbGxvIHdvcmxkXCIpLmdldFBheWxvYWQoKSwgVW5peE5vdygpKTtcbi8vICAgICBjb25zdCB0eDpUeCA9IHR4dS5zaWduKGtleW1ncjEpO1xuLy8gICAgIGNvbnN0IHR4MjpUeCA9IG5ldyBUeCgpO1xuLy8gICAgIHR4Mi5mcm9tQnVmZmVyKHR4LnRvQnVmZmVyKCkpO1xuLy8gICAgIGV4cGVjdCh0eDIudG9CdWZmZXIoKS50b1N0cmluZygnaGV4JykpLnRvQmUodHgudG9CdWZmZXIoKS50b1N0cmluZygnaGV4JykpO1xuLy8gICB9KTtcblxuLy8gICB0ZXN0KCdDcmVhdGlvbiBUeDUgdXNpbmcgRXhwb3J0VHgnLCAoKSA9PiB7XG4vLyAgICAgY29uc3QgdHh1OlVuc2lnbmVkVHggPSBzZXQuYnVpbGRFeHBvcnRUeChcbi8vICAgICAgIG5ldGlkLCBibG9ja2NoYWluSUQsIG5ldyBCTig5MCksIGF2YXhBc3NldElELFxuLy8gICAgICAgYWRkcnMzLCBhZGRyczEsIGFkZHJzMiwgYmludG9vbHMuY2I1OERlY29kZShQbGF0Zm9ybUNoYWluSUQpLCBcbi8vICAgICAgIHVuZGVmaW5lZCwgdW5kZWZpbmVkLCBuZXcgVVRGOFBheWxvYWQoXCJoZWxsbyB3b3JsZFwiKS5nZXRQYXlsb2FkKCksIFVuaXhOb3coKVxuLy8gICAgIClcbi8vICAgICBjb25zdCB0eDpUeCA9IHR4dS5zaWduKGtleW1ncjEpO1xuLy8gICAgIGNvbnN0IHR4MjpUeCA9IG5ldyBUeCgpO1xuLy8gICAgIHR4Mi5mcm9tQnVmZmVyKHR4LnRvQnVmZmVyKCkpO1xuLy8gICAgIGV4cGVjdCh0eC50b0J1ZmZlcigpLnRvU3RyaW5nKCdoZXgnKSkudG9CZSh0eDIudG9CdWZmZXIoKS50b1N0cmluZygnaGV4JykpO1xuLy8gICB9KTtcbn0pO1xuIl19