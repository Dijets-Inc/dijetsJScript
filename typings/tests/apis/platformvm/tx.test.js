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
const utxos_1 = require("src/apis/platformvm/utxos");
const api_1 = require("src/apis/platformvm/api");
const tx_1 = require("src/apis/platformvm/tx");
const keychain_1 = require("src/apis/platformvm/keychain");
const inputs_1 = require("src/apis/platformvm/inputs");
const create_hash_1 = __importDefault(require("create-hash"));
const bintools_1 = __importDefault(require("src/utils/bintools"));
const bn_js_1 = __importDefault(require("bn.js"));
const buffer_1 = require("buffer/");
const outputs_1 = require("src/apis/platformvm/outputs");
const constants_1 = require("src/apis/platformvm/constants");
const index_1 = require("src/index");
const payload_1 = require("src/utils/payload");
const helperfunctions_1 = require("src/utils/helperfunctions");
const basetx_1 = require("src/apis/platformvm/basetx");
const importtx_1 = require("src/apis/platformvm/importtx");
const exporttx_1 = require("src/apis/platformvm/exporttx");
const constants_2 = require("src/utils/constants");
/**
 * @ignore
 */
const bintools = bintools_1.default.getInstance();
describe('Transactions', () => {
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
    let importIns;
    let importUTXOs;
    let exportOuts;
    let fungutxos;
    let exportUTXOIDS;
    let api;
    const amnt = 10000;
    const netid = 12345;
    const memo = buffer_1.Buffer.from("DijetsJS");
    const blockchainID = bintools.cb58Decode(constants_2.PlatformChainID);
    const alias = 'X';
    const assetID = buffer_1.Buffer.from(create_hash_1.default('sha256').update("Well, now, don't you tell me to smile, you stick around I'll make it worth your while.").digest());
    const NFTassetID = buffer_1.Buffer.from(create_hash_1.default('sha256').update("I can't stand it, I know you planned it, I'mma set straight this Watergate.'").digest());
    let amount;
    let addresses;
    let fallAddresses;
    let locktime;
    let fallLocktime;
    let threshold;
    let fallThreshold;
    const nftutxoids = [];
    const ip = '127.0.0.1';
    const port = 8080;
    const protocol = 'http';
    let dijets;
    const blockchainid = constants_2.PlatformChainID;
    const name = 'Mortycoin is the dumb as a sack of hammers.';
    const symbol = 'morT';
    const denomination = 8;
    let djtxAssetID;
    beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
        dijets = new index_1.Dijets(ip, port, protocol, 12345, undefined, undefined, null, true);
        api = new api_1.PlatformVMAPI(dijets, '/ext/bc/P');
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
        for (let i = 0; i < 3; i++) {
            addrs1.push(keymgr1.makeKey().getAddress());
            addrs2.push(keymgr2.makeKey().getAddress());
            addrs3.push(keymgr3.makeKey().getAddress());
        }
        amount = new bn_js_1.default(amnt);
        addresses = keymgr1.getAddresses();
        fallAddresses = keymgr2.getAddresses();
        locktime = new bn_js_1.default(54321);
        fallLocktime = locktime.add(new bn_js_1.default(50));
        threshold = 3;
        fallThreshold = 1;
        const payload = buffer_1.Buffer.alloc(1024);
        payload.write("All you Trekkies and TV addicts, Don't mean to diss don't mean to bring static.", 0, 1024, 'utf8');
        for (let i = 0; i < 5; i++) {
            let txid = buffer_1.Buffer.from(create_hash_1.default('sha256').update(bintools.fromBNToBuffer(new bn_js_1.default(i), 32)).digest());
            let txidx = buffer_1.Buffer.from(bintools.fromBNToBuffer(new bn_js_1.default(i), 4));
            const out = new outputs_1.SECPTransferOutput(amount, addresses, locktime, threshold);
            const xferout = new outputs_1.TransferableOutput(assetID, out);
            outputs.push(xferout);
            const u = new utxos_1.UTXO(constants_1.PlatformVMConstants.LATESTCODEC, txid, txidx, assetID, out);
            utxos.push(u);
            fungutxos.push(u);
            importUTXOs.push(u);
            txid = u.getTxID();
            txidx = u.getOutputIdx();
            const input = new inputs_1.SECPTransferInput(amount);
            const xferin = new inputs_1.TransferableInput(txid, txidx, assetID, input);
            inputs.push(xferin);
        }
        for (let i = 1; i < 4; i++) {
            importIns.push(inputs[i]);
            exportOuts.push(outputs[i]);
            exportUTXOIDS.push(fungutxos[i].getUTXOID());
        }
        set.addArray(utxos);
    });
    test('Create small BaseTx that is Goose Egg Tx', () => __awaiter(void 0, void 0, void 0, function* () {
        const bintools = bintools_1.default.getInstance();
        const networkID = 12345;
        const outs = [];
        const ins = [];
        const outputAmt = new bn_js_1.default("266");
        const output = new outputs_1.SECPTransferOutput(outputAmt, addrs1, new bn_js_1.default(0), 1);
        const transferableOutput = new outputs_1.TransferableOutput(djtxAssetID, output);
        outs.push(transferableOutput);
        const inputAmt = new bn_js_1.default("400");
        const input = new inputs_1.SECPTransferInput(inputAmt);
        input.addSignatureIdx(0, addrs1[0]);
        const txid = bintools.cb58Decode("n8XH5JY1EX5VYqDeAhB4Zd4GKxi9UNQy6oPpMsCAj1Q6xkiiL");
        const outputIndex = buffer_1.Buffer.from(bintools.fromBNToBuffer(new bn_js_1.default(0), 4));
        const transferableInput = new inputs_1.TransferableInput(txid, outputIndex, djtxAssetID, input);
        ins.push(transferableInput);
        const baseTx = new basetx_1.BaseTx(networkID, blockchainID, outs, ins);
        const unsignedTx = new tx_1.UnsignedTx(baseTx);
        expect(yield api.checkGooseEgg(unsignedTx)).toBe(true);
    }));
    test('confirm inputTotal, outputTotal and fee are correct', () => __awaiter(void 0, void 0, void 0, function* () {
        const bintools = bintools_1.default.getInstance();
        const networkID = 12345;
        // local network P Chain ID
        // DJTX assetID
        const assetID = bintools.cb58Decode("n8XH5JY1EX5VYqDeAhB4Zd4GKxi9UNQy6oPpMsCAj1Q6xkiiL");
        const outs = [];
        const ins = [];
        const outputAmt = new bn_js_1.default("266");
        const output = new outputs_1.SECPTransferOutput(outputAmt, addrs1, new bn_js_1.default(0), 1);
        const transferableOutput = new outputs_1.TransferableOutput(assetID, output);
        outs.push(transferableOutput);
        const inputAmt = new bn_js_1.default("400");
        const input = new inputs_1.SECPTransferInput(inputAmt);
        input.addSignatureIdx(0, addrs1[0]);
        const txid = bintools.cb58Decode("n8XH5JY1EX5VYqDeAhB4Zd4GKxi9UNQy6oPpMsCAj1Q6xkiiL");
        const outputIndex = buffer_1.Buffer.from(bintools.fromBNToBuffer(new bn_js_1.default(0), 4));
        const transferableInput = new inputs_1.TransferableInput(txid, outputIndex, assetID, input);
        ins.push(transferableInput);
        const baseTx = new basetx_1.BaseTx(networkID, blockchainID, outs, ins);
        const unsignedTx = new tx_1.UnsignedTx(baseTx);
        const inputTotal = unsignedTx.getInputTotal(assetID);
        const outputTotal = unsignedTx.getOutputTotal(assetID);
        const burn = unsignedTx.getBurn(assetID);
        expect(inputTotal.toNumber()).toEqual(new bn_js_1.default(400).toNumber());
        expect(outputTotal.toNumber()).toEqual(new bn_js_1.default(266).toNumber());
        expect(burn.toNumber()).toEqual(new bn_js_1.default(134).toNumber());
    }));
    test("Create small BaseTx that isn't Goose Egg Tx", () => __awaiter(void 0, void 0, void 0, function* () {
        const bintools = bintools_1.default.getInstance();
        const networkID = 12345;
        // local network X Chain ID
        const outs = [];
        const ins = [];
        const outputAmt = new bn_js_1.default("267");
        const output = new outputs_1.SECPTransferOutput(outputAmt, addrs1, new bn_js_1.default(0), 1);
        const transferableOutput = new outputs_1.TransferableOutput(djtxAssetID, output);
        outs.push(transferableOutput);
        const inputAmt = new bn_js_1.default("400");
        const input = new inputs_1.SECPTransferInput(inputAmt);
        input.addSignatureIdx(0, addrs1[0]);
        const txid = bintools.cb58Decode("n8XH5JY1EX5VYqDeAhB4Zd4GKxi9UNQy6oPpMsCAj1Q6xkiiL");
        const outputIndex = buffer_1.Buffer.from(bintools.fromBNToBuffer(new bn_js_1.default(0), 4));
        const transferableInput = new inputs_1.TransferableInput(txid, outputIndex, djtxAssetID, input);
        ins.push(transferableInput);
        const baseTx = new basetx_1.BaseTx(networkID, blockchainID, outs, ins);
        const unsignedTx = new tx_1.UnsignedTx(baseTx);
        expect(yield api.checkGooseEgg(unsignedTx)).toBe(true);
    }));
    test('Create large BaseTx that is Goose Egg Tx', () => __awaiter(void 0, void 0, void 0, function* () {
        const bintools = bintools_1.default.getInstance();
        const networkID = 12345;
        // local network P Chain ID
        const outs = [];
        const ins = [];
        const outputAmt = new bn_js_1.default("609555500000");
        const output = new outputs_1.SECPTransferOutput(outputAmt, addrs1, new bn_js_1.default(0), 1);
        const transferableOutput = new outputs_1.TransferableOutput(djtxAssetID, output);
        outs.push(transferableOutput);
        const inputAmt = new bn_js_1.default("45000000000000000");
        const input = new inputs_1.SECPTransferInput(inputAmt);
        input.addSignatureIdx(0, addrs1[0]);
        const txid = bintools.cb58Decode("n8XH5JY1EX5VYqDeAhB4Zd4GKxi9UNQy6oPpMsCAj1Q6xkiiL");
        const outputIndex = buffer_1.Buffer.from(bintools.fromBNToBuffer(new bn_js_1.default(0), 4));
        const transferableInput = new inputs_1.TransferableInput(txid, outputIndex, djtxAssetID, input);
        ins.push(transferableInput);
        const baseTx = new basetx_1.BaseTx(networkID, blockchainID, outs, ins);
        const unsignedTx = new tx_1.UnsignedTx(baseTx);
        expect(yield api.checkGooseEgg(unsignedTx)).toBe(false);
    }));
    test("Create large BaseTx that isn't Goose Egg Tx", () => __awaiter(void 0, void 0, void 0, function* () {
        const bintools = bintools_1.default.getInstance();
        const networkID = 12345;
        // local network P Chain ID
        const outs = [];
        const ins = [];
        const outputAmt = new bn_js_1.default("44995609555500000");
        const output = new outputs_1.SECPTransferOutput(outputAmt, addrs1, new bn_js_1.default(0), 1);
        const transferableOutput = new outputs_1.TransferableOutput(djtxAssetID, output);
        outs.push(transferableOutput);
        const inputAmt = new bn_js_1.default("45000000000000000");
        const input = new inputs_1.SECPTransferInput(inputAmt);
        input.addSignatureIdx(0, addrs1[0]);
        const txid = bintools.cb58Decode("n8XH5JY1EX5VYqDeAhB4Zd4GKxi9UNQy6oPpMsCAj1Q6xkiiL");
        const outputIndex = buffer_1.Buffer.from(bintools.fromBNToBuffer(new bn_js_1.default(0), 4));
        const transferableInput = new inputs_1.TransferableInput(txid, outputIndex, djtxAssetID, input);
        ins.push(transferableInput);
        const baseTx = new basetx_1.BaseTx(networkID, blockchainID, outs, ins);
        const unsignedTx = new tx_1.UnsignedTx(baseTx);
        expect(yield api.checkGooseEgg(unsignedTx)).toBe(true);
    }));
    test('Creation UnsignedTx', () => {
        const baseTx = new basetx_1.BaseTx(netid, blockchainID, outputs, inputs);
        const txu = new tx_1.UnsignedTx(baseTx);
        const txins = txu.getTransaction().getIns();
        const txouts = txu.getTransaction().getOuts();
        expect(txins.length).toBe(inputs.length);
        expect(txouts.length).toBe(outputs.length);
        expect(txu.getTransaction().getTxType()).toBe(0);
        expect(txu.getTransaction().getNetworkID()).toBe(12345);
        expect(txu.getTransaction().getBlockchainID().toString('hex')).toBe(blockchainID.toString('hex'));
        let a = [];
        let b = [];
        for (let i = 0; i < txins.length; i++) {
            a.push(txins[i].toString());
            b.push(inputs[i].toString());
        }
        expect(JSON.stringify(a.sort())).toBe(JSON.stringify(b.sort()));
        a = [];
        b = [];
        for (let i = 0; i < txouts.length; i++) {
            a.push(txouts[i].toString());
            b.push(outputs[i].toString());
        }
        expect(JSON.stringify(a.sort())).toBe(JSON.stringify(b.sort()));
        const txunew = new tx_1.UnsignedTx();
        txunew.fromBuffer(txu.toBuffer());
        expect(txunew.toBuffer().toString('hex')).toBe(txu.toBuffer().toString('hex'));
        expect(txunew.toString()).toBe(txu.toString());
    });
    test('Creation UnsignedTx Check Amount', () => {
        expect(() => {
            set.buildBaseTx(netid, blockchainID, new bn_js_1.default(amnt * 1000), assetID, addrs3, addrs1, addrs1);
        }).toThrow();
    });
    test('Creation ImportTx', () => {
        const bombtx = new importtx_1.ImportTx(netid, blockchainID, outputs, inputs, new payload_1.UTF8Payload("hello world").getPayload(), undefined, importIns);
        expect(() => {
            bombtx.toBuffer();
        }).toThrow();
        const importtx = new importtx_1.ImportTx(netid, blockchainID, outputs, inputs, new payload_1.UTF8Payload("hello world").getPayload(), bintools.cb58Decode(constants_2.PlatformChainID), importIns);
        const txunew = new importtx_1.ImportTx();
        const importbuff = importtx.toBuffer();
        txunew.fromBuffer(importbuff);
        expect(txunew.toBuffer().toString('hex')).toBe(importbuff.toString('hex'));
        expect(txunew.toString()).toBe(importtx.toString());
        expect(importtx.getImportInputs().length).toBe(importIns.length);
    });
    test('Creation ExportTx', () => {
        const bombtx = new exporttx_1.ExportTx(netid, blockchainID, outputs, inputs, undefined, undefined, exportOuts);
        expect(() => {
            bombtx.toBuffer();
        }).toThrow();
        const exporttx = new exporttx_1.ExportTx(netid, blockchainID, outputs, inputs, undefined, bintools.cb58Decode(constants_2.PlatformChainID), exportOuts);
        const txunew = new exporttx_1.ExportTx();
        const exportbuff = exporttx.toBuffer();
        txunew.fromBuffer(exportbuff);
        expect(txunew.toBuffer().toString('hex')).toBe(exportbuff.toString('hex'));
        expect(txunew.toString()).toBe(exporttx.toString());
        expect(exporttx.getExportOutputs().length).toBe(exportOuts.length);
    });
    test('Creation Tx1 with asof, locktime, threshold', () => {
        const txu = set.buildBaseTx(netid, blockchainID, new bn_js_1.default(9000), assetID, addrs3, addrs1, addrs1, undefined, undefined, undefined, helperfunctions_1.UnixNow(), helperfunctions_1.UnixNow().add(new bn_js_1.default(50)), 1);
        const tx = txu.sign(keymgr1);
        const tx2 = new tx_1.Tx();
        tx2.fromString(tx.toString());
        expect(tx2.toBuffer().toString('hex')).toBe(tx.toBuffer().toString('hex'));
        expect(tx2.toString()).toBe(tx.toString());
    });
    test('Creation Tx2 without asof, locktime, threshold', () => {
        const txu = set.buildBaseTx(netid, blockchainID, new bn_js_1.default(9000), assetID, addrs3, addrs1, addrs1);
        const tx = txu.sign(keymgr1);
        const tx2 = new tx_1.Tx();
        tx2.fromBuffer(tx.toBuffer());
        expect(tx2.toBuffer().toString('hex')).toBe(tx.toBuffer().toString('hex'));
        expect(tx2.toString()).toBe(tx.toString());
    });
    test('Creation Tx4 using ImportTx', () => {
        const txu = set.buildImportTx(netid, blockchainID, addrs3, addrs1, addrs2, importUTXOs, bintools.cb58Decode(constants_2.PlatformChainID), new bn_js_1.default(90), assetID, new payload_1.UTF8Payload("hello world").getPayload(), helperfunctions_1.UnixNow());
        const tx = txu.sign(keymgr1);
        const tx2 = new tx_1.Tx();
        tx2.fromBuffer(tx.toBuffer());
        expect(tx2.toBuffer().toString('hex')).toBe(tx.toBuffer().toString('hex'));
    });
    test('Creation Tx5 using ExportTx', () => {
        const txu = set.buildExportTx(netid, blockchainID, new bn_js_1.default(90), djtxAssetID, addrs3, addrs1, addrs2, bintools.cb58Decode(constants_2.PlatformChainID), undefined, undefined, new payload_1.UTF8Payload("hello world").getPayload(), helperfunctions_1.UnixNow());
        const tx = txu.sign(keymgr1);
        const tx2 = new tx_1.Tx();
        tx2.fromBuffer(tx.toBuffer());
        expect(tx.toBuffer().toString('hex')).toBe(tx2.toBuffer().toString('hex'));
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHgudGVzdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3Rlc3RzL2FwaXMvcGxhdGZvcm12bS90eC50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7O0FBQUEsc0VBQXdDO0FBQ3hDLHFEQUEwRDtBQUMxRCxpREFBd0Q7QUFDeEQsK0NBQXdEO0FBQ3hELDJEQUF3RDtBQUN4RCx1REFBa0Y7QUFDbEYsOERBQXFDO0FBQ3JDLGtFQUEwQztBQUMxQyxrREFBdUI7QUFDdkIsb0NBQWlDO0FBQ2pDLHlEQUFxRjtBQUNyRiw2REFBb0U7QUFDcEUscUNBQXNDO0FBQ3RDLCtDQUFnRDtBQUNoRCwrREFBb0Q7QUFDcEQsdURBQW9EO0FBQ3BELDJEQUF3RDtBQUN4RCwyREFBd0Q7QUFDeEQsbURBQXNEO0FBR3REOztHQUVHO0FBQ0gsTUFBTSxRQUFRLEdBQUcsa0JBQVEsQ0FBQyxXQUFXLEVBQUUsQ0FBQztBQUN4QyxRQUFRLENBQUMsY0FBYyxFQUFFLEdBQUcsRUFBRTtJQUM1QixJQUFJLEdBQVcsQ0FBQztJQUNoQixJQUFJLE9BQWdCLENBQUM7SUFDckIsSUFBSSxPQUFnQixDQUFDO0lBQ3JCLElBQUksT0FBZ0IsQ0FBQztJQUNyQixJQUFJLE1BQW9CLENBQUM7SUFDekIsSUFBSSxNQUFvQixDQUFDO0lBQ3pCLElBQUksTUFBb0IsQ0FBQztJQUN6QixJQUFJLEtBQWlCLENBQUM7SUFDdEIsSUFBSSxNQUErQixDQUFDO0lBQ3BDLElBQUksT0FBaUMsQ0FBQztJQUN0QyxJQUFJLFNBQWtDLENBQUM7SUFDdkMsSUFBSSxXQUF1QixDQUFDO0lBQzVCLElBQUksVUFBb0MsQ0FBQztJQUN6QyxJQUFJLFNBQXFCLENBQUM7SUFDMUIsSUFBSSxhQUEyQixDQUFDO0lBQ2hDLElBQUksR0FBaUIsQ0FBQztJQUN0QixNQUFNLElBQUksR0FBVSxLQUFLLENBQUM7SUFDMUIsTUFBTSxLQUFLLEdBQVUsS0FBSyxDQUFDO0lBQzNCLE1BQU0sSUFBSSxHQUFVLGVBQU0sQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLENBQUM7SUFDL0MsTUFBTSxZQUFZLEdBQVUsUUFBUSxDQUFDLFVBQVUsQ0FBQywyQkFBZSxDQUFDLENBQUM7SUFDakUsTUFBTSxLQUFLLEdBQVUsR0FBRyxDQUFDO0lBQ3pCLE1BQU0sT0FBTyxHQUFVLGVBQU0sQ0FBQyxJQUFJLENBQUMscUJBQVUsQ0FBQyxRQUFRLENBQUMsQ0FBQyxNQUFNLENBQUMsd0ZBQXdGLENBQUMsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDO0lBQ25LLE1BQU0sVUFBVSxHQUFVLGVBQU0sQ0FBQyxJQUFJLENBQUMscUJBQVUsQ0FBQyxRQUFRLENBQUMsQ0FBQyxNQUFNLENBQUMsOEVBQThFLENBQUMsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDO0lBQzVKLElBQUksTUFBUyxDQUFDO0lBQ2QsSUFBSSxTQUF1QixDQUFDO0lBQzVCLElBQUksYUFBMkIsQ0FBQztJQUNoQyxJQUFJLFFBQVcsQ0FBQztJQUNoQixJQUFJLFlBQWUsQ0FBQztJQUNwQixJQUFJLFNBQWdCLENBQUM7SUFDckIsSUFBSSxhQUFvQixDQUFDO0lBQ3pCLE1BQU0sVUFBVSxHQUFpQixFQUFFLENBQUM7SUFDcEMsTUFBTSxFQUFFLEdBQUcsV0FBVyxDQUFDO0lBQ3ZCLE1BQU0sSUFBSSxHQUFHLElBQUksQ0FBQztJQUNsQixNQUFNLFFBQVEsR0FBRyxNQUFNLENBQUM7SUFDeEIsSUFBSSxTQUFtQixDQUFDO0lBQ3hCLE1BQU0sWUFBWSxHQUFVLDJCQUFlLENBQUM7SUFDNUMsTUFBTSxJQUFJLEdBQVUsNkNBQTZDLENBQUM7SUFDbEUsTUFBTSxNQUFNLEdBQVUsTUFBTSxDQUFDO0lBQzdCLE1BQU0sWUFBWSxHQUFVLENBQUMsQ0FBQztJQUM5QixJQUFJLFdBQWtCLENBQUM7SUFFdkIsU0FBUyxDQUFDLEdBQVMsRUFBRTtRQUVuQixTQUFTLEdBQUcsSUFBSSxpQkFBUyxDQUFDLEVBQUUsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFLEtBQUssRUFBRSxTQUFTLEVBQUUsU0FBUyxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztRQUN2RixHQUFHLEdBQUcsSUFBSSxtQkFBYSxDQUFDLFNBQVMsRUFBRSxXQUFXLENBQUMsQ0FBQztRQUVoRCxNQUFNLE1BQU0sR0FBbUIsR0FBRyxDQUFDLGNBQWMsRUFBRSxDQUFDO1FBQ3BELE1BQU0sT0FBTyxHQUFVO1lBQ3JCLE1BQU0sRUFBRTtnQkFDTixJQUFJO2dCQUNKLE1BQU07Z0JBQ04sT0FBTyxFQUFFLFFBQVEsQ0FBQyxVQUFVLENBQUMsT0FBTyxDQUFDO2dCQUNyQyxZQUFZLEVBQUUsR0FBRyxZQUFZLEVBQUU7YUFDaEM7U0FDRixDQUFDO1FBQ0YsTUFBTSxXQUFXLEdBQUc7WUFDbEIsSUFBSSxFQUFFLE9BQU87U0FDZCxDQUFDO1FBRUYseUJBQVMsQ0FBQyxZQUFZLENBQUMsV0FBVyxDQUFDLENBQUM7UUFDcEMsV0FBVyxHQUFHLE1BQU0sTUFBTSxDQUFDO0lBQzdCLENBQUMsQ0FBQSxDQUFDLENBQUM7SUFFSCxVQUFVLENBQUMsR0FBRyxFQUFFO1FBQ2QsR0FBRyxHQUFHLElBQUksZUFBTyxFQUFFLENBQUM7UUFDcEIsT0FBTyxHQUFHLElBQUksbUJBQVEsQ0FBQyxTQUFTLENBQUMsTUFBTSxFQUFFLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDbEQsT0FBTyxHQUFHLElBQUksbUJBQVEsQ0FBQyxTQUFTLENBQUMsTUFBTSxFQUFFLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDbEQsT0FBTyxHQUFHLElBQUksbUJBQVEsQ0FBQyxTQUFTLENBQUMsTUFBTSxFQUFFLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDbEQsTUFBTSxHQUFHLEVBQUUsQ0FBQztRQUNaLE1BQU0sR0FBRyxFQUFFLENBQUM7UUFDWixNQUFNLEdBQUcsRUFBRSxDQUFDO1FBQ1osS0FBSyxHQUFHLEVBQUUsQ0FBQztRQUNYLE1BQU0sR0FBRyxFQUFFLENBQUM7UUFDWixPQUFPLEdBQUcsRUFBRSxDQUFDO1FBQ2IsU0FBUyxHQUFHLEVBQUUsQ0FBQztRQUNmLFdBQVcsR0FBRyxFQUFFLENBQUE7UUFDaEIsVUFBVSxHQUFHLEVBQUUsQ0FBQztRQUNoQixTQUFTLEdBQUcsRUFBRSxDQUFDO1FBQ2YsYUFBYSxHQUFHLEVBQUUsQ0FBQztRQUNuQixLQUFLLElBQUksQ0FBQyxHQUFVLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFO1lBQ2pDLE1BQU0sQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sRUFBRSxDQUFDLFVBQVUsRUFBRSxDQUFDLENBQUM7WUFDNUMsTUFBTSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsT0FBTyxFQUFFLENBQUMsVUFBVSxFQUFFLENBQUMsQ0FBQztZQUM1QyxNQUFNLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxPQUFPLEVBQUUsQ0FBQyxVQUFVLEVBQUUsQ0FBQyxDQUFDO1NBQzdDO1FBQ0QsTUFBTSxHQUFHLElBQUksZUFBRSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ3RCLFNBQVMsR0FBRyxPQUFPLENBQUMsWUFBWSxFQUFFLENBQUM7UUFDbkMsYUFBYSxHQUFHLE9BQU8sQ0FBQyxZQUFZLEVBQUUsQ0FBQztRQUN2QyxRQUFRLEdBQUcsSUFBSSxlQUFFLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDekIsWUFBWSxHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMsSUFBSSxlQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztRQUN4QyxTQUFTLEdBQUcsQ0FBQyxDQUFDO1FBQ2QsYUFBYSxHQUFHLENBQUMsQ0FBQztRQUVsQixNQUFNLE9BQU8sR0FBVSxlQUFNLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQzFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsaUZBQWlGLEVBQUUsQ0FBQyxFQUFFLElBQUksRUFBRSxNQUFNLENBQUMsQ0FBQztRQUVsSCxLQUFLLElBQUksQ0FBQyxHQUFVLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFO1lBQ2pDLElBQUksSUFBSSxHQUFVLGVBQU0sQ0FBQyxJQUFJLENBQUMscUJBQVUsQ0FBQyxRQUFRLENBQUMsQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLGNBQWMsQ0FBQyxJQUFJLGVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUM7WUFDNUcsSUFBSSxLQUFLLEdBQVUsZUFBTSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsY0FBYyxDQUFDLElBQUksZUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDdEUsTUFBTSxHQUFHLEdBQXNCLElBQUksNEJBQWtCLENBQUMsTUFBTSxFQUFFLFNBQVMsRUFBRSxRQUFRLEVBQUUsU0FBUyxDQUFDLENBQUM7WUFDOUYsTUFBTSxPQUFPLEdBQXNCLElBQUksNEJBQWtCLENBQUMsT0FBTyxFQUFFLEdBQUcsQ0FBQyxDQUFDO1lBQ3hFLE9BQU8sQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7WUFFdEIsTUFBTSxDQUFDLEdBQVEsSUFBSSxZQUFJLENBQUMsK0JBQW1CLENBQUMsV0FBVyxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUUsT0FBTyxFQUFFLEdBQUcsQ0FBQyxDQUFDO1lBQ3BGLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDZCxTQUFTLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ2xCLFdBQVcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFFcEIsSUFBSSxHQUFHLENBQUMsQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQUNuQixLQUFLLEdBQUcsQ0FBQyxDQUFDLFlBQVksRUFBRSxDQUFDO1lBRXpCLE1BQU0sS0FBSyxHQUFxQixJQUFJLDBCQUFpQixDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQzlELE1BQU0sTUFBTSxHQUFxQixJQUFJLDBCQUFpQixDQUFDLElBQUksRUFBRSxLQUFLLEVBQUUsT0FBTyxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQ3BGLE1BQU0sQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7U0FDckI7UUFDRCxLQUFJLElBQUksQ0FBQyxHQUFVLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFDO1lBQy9CLFNBQVMsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDMUIsVUFBVSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUM1QixhQUFhLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxTQUFTLEVBQUUsQ0FBQyxDQUFDO1NBQzlDO1FBQ0QsR0FBRyxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUN0QixDQUFDLENBQUMsQ0FBQztJQUVILElBQUksQ0FBQywwQ0FBMEMsRUFBRSxHQUFTLEVBQUU7UUFDMUQsTUFBTSxRQUFRLEdBQWEsa0JBQVEsQ0FBQyxXQUFXLEVBQUUsQ0FBQztRQUNsRCxNQUFNLFNBQVMsR0FBVyxLQUFLLENBQUM7UUFFaEMsTUFBTSxJQUFJLEdBQXdCLEVBQUUsQ0FBQztRQUNyQyxNQUFNLEdBQUcsR0FBdUIsRUFBRSxDQUFDO1FBQ25DLE1BQU0sU0FBUyxHQUFNLElBQUksZUFBRSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ25DLE1BQU0sTUFBTSxHQUFzQixJQUFJLDRCQUFrQixDQUFDLFNBQVMsRUFBRSxNQUFNLEVBQUUsSUFBSSxlQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDMUYsTUFBTSxrQkFBa0IsR0FBc0IsSUFBSSw0QkFBa0IsQ0FBQyxXQUFXLEVBQUUsTUFBTSxDQUFDLENBQUM7UUFDMUYsSUFBSSxDQUFDLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDO1FBQzlCLE1BQU0sUUFBUSxHQUFNLElBQUksZUFBRSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ2xDLE1BQU0sS0FBSyxHQUFxQixJQUFJLDBCQUFpQixDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQ2hFLEtBQUssQ0FBQyxlQUFlLENBQUMsQ0FBQyxFQUFFLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ3BDLE1BQU0sSUFBSSxHQUFVLFFBQVEsQ0FBQyxVQUFVLENBQUMsbURBQW1ELENBQUMsQ0FBQztRQUM3RixNQUFNLFdBQVcsR0FBVSxlQUFNLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxjQUFjLENBQUMsSUFBSSxlQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUM5RSxNQUFNLGlCQUFpQixHQUFxQixJQUFJLDBCQUFpQixDQUFDLElBQUksRUFBRSxXQUFXLEVBQUUsV0FBVyxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQ3pHLEdBQUcsQ0FBQyxJQUFJLENBQUMsaUJBQWlCLENBQUMsQ0FBQztRQUM1QixNQUFNLE1BQU0sR0FBVSxJQUFJLGVBQU0sQ0FBQyxTQUFTLEVBQUUsWUFBWSxFQUFFLElBQUksRUFBRSxHQUFHLENBQUMsQ0FBQztRQUNyRSxNQUFNLFVBQVUsR0FBYyxJQUFJLGVBQVUsQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUNyRCxNQUFNLENBQUMsTUFBTSxHQUFHLENBQUMsYUFBYSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQ3pELENBQUMsQ0FBQSxDQUFDLENBQUM7SUFFSCxJQUFJLENBQUMscURBQXFELEVBQUUsR0FBUyxFQUFFO1FBQ3JFLE1BQU0sUUFBUSxHQUFhLGtCQUFRLENBQUMsV0FBVyxFQUFFLENBQUM7UUFDbEQsTUFBTSxTQUFTLEdBQVcsS0FBSyxDQUFDO1FBQ2hDLDJCQUEyQjtRQUMzQixlQUFlO1FBQ2YsTUFBTSxPQUFPLEdBQVUsUUFBUSxDQUFDLFVBQVUsQ0FBQyxtREFBbUQsQ0FBQyxDQUFDO1FBQ2hHLE1BQU0sSUFBSSxHQUF3QixFQUFFLENBQUM7UUFDckMsTUFBTSxHQUFHLEdBQXVCLEVBQUUsQ0FBQztRQUNuQyxNQUFNLFNBQVMsR0FBTSxJQUFJLGVBQUUsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUNuQyxNQUFNLE1BQU0sR0FBc0IsSUFBSSw0QkFBa0IsQ0FBQyxTQUFTLEVBQUUsTUFBTSxFQUFFLElBQUksZUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQzFGLE1BQU0sa0JBQWtCLEdBQXNCLElBQUksNEJBQWtCLENBQUMsT0FBTyxFQUFFLE1BQU0sQ0FBQyxDQUFDO1FBQ3RGLElBQUksQ0FBQyxJQUFJLENBQUMsa0JBQWtCLENBQUMsQ0FBQztRQUM5QixNQUFNLFFBQVEsR0FBTSxJQUFJLGVBQUUsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUNsQyxNQUFNLEtBQUssR0FBcUIsSUFBSSwwQkFBaUIsQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUNoRSxLQUFLLENBQUMsZUFBZSxDQUFDLENBQUMsRUFBRSxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNwQyxNQUFNLElBQUksR0FBVSxRQUFRLENBQUMsVUFBVSxDQUFDLG1EQUFtRCxDQUFDLENBQUM7UUFDN0YsTUFBTSxXQUFXLEdBQVUsZUFBTSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsY0FBYyxDQUFDLElBQUksZUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDOUUsTUFBTSxpQkFBaUIsR0FBcUIsSUFBSSwwQkFBaUIsQ0FBQyxJQUFJLEVBQUUsV0FBVyxFQUFFLE9BQU8sRUFBRSxLQUFLLENBQUMsQ0FBQztRQUNyRyxHQUFHLENBQUMsSUFBSSxDQUFDLGlCQUFpQixDQUFDLENBQUM7UUFDNUIsTUFBTSxNQUFNLEdBQVUsSUFBSSxlQUFNLENBQUMsU0FBUyxFQUFFLFlBQVksRUFBRSxJQUFJLEVBQUUsR0FBRyxDQUFDLENBQUM7UUFDckUsTUFBTSxVQUFVLEdBQWMsSUFBSSxlQUFVLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDckQsTUFBTSxVQUFVLEdBQU0sVUFBVSxDQUFDLGFBQWEsQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUN4RCxNQUFNLFdBQVcsR0FBTSxVQUFVLENBQUMsY0FBYyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQzFELE1BQU0sSUFBSSxHQUFNLFVBQVUsQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDNUMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxJQUFJLGVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDO1FBQzlELE1BQU0sQ0FBQyxXQUFXLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQyxPQUFPLENBQUMsSUFBSSxlQUFFLENBQUMsR0FBRyxDQUFDLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQztRQUMvRCxNQUFNLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUMsT0FBTyxDQUFDLElBQUksZUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUM7SUFDMUQsQ0FBQyxDQUFBLENBQUMsQ0FBQztJQUdILElBQUksQ0FBQyw2Q0FBNkMsRUFBRSxHQUFTLEVBQUU7UUFDN0QsTUFBTSxRQUFRLEdBQWEsa0JBQVEsQ0FBQyxXQUFXLEVBQUUsQ0FBQztRQUNsRCxNQUFNLFNBQVMsR0FBVyxLQUFLLENBQUM7UUFDaEMsMkJBQTJCO1FBQzNCLE1BQU0sSUFBSSxHQUF3QixFQUFFLENBQUM7UUFDckMsTUFBTSxHQUFHLEdBQXVCLEVBQUUsQ0FBQztRQUNuQyxNQUFNLFNBQVMsR0FBTSxJQUFJLGVBQUUsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUNuQyxNQUFNLE1BQU0sR0FBc0IsSUFBSSw0QkFBa0IsQ0FBQyxTQUFTLEVBQUUsTUFBTSxFQUFFLElBQUksZUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQzFGLE1BQU0sa0JBQWtCLEdBQXNCLElBQUksNEJBQWtCLENBQUMsV0FBVyxFQUFFLE1BQU0sQ0FBQyxDQUFDO1FBQzFGLElBQUksQ0FBQyxJQUFJLENBQUMsa0JBQWtCLENBQUMsQ0FBQztRQUM5QixNQUFNLFFBQVEsR0FBTSxJQUFJLGVBQUUsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUNsQyxNQUFNLEtBQUssR0FBcUIsSUFBSSwwQkFBaUIsQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUNoRSxLQUFLLENBQUMsZUFBZSxDQUFDLENBQUMsRUFBRSxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNwQyxNQUFNLElBQUksR0FBVSxRQUFRLENBQUMsVUFBVSxDQUFDLG1EQUFtRCxDQUFDLENBQUM7UUFDN0YsTUFBTSxXQUFXLEdBQVUsZUFBTSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsY0FBYyxDQUFDLElBQUksZUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDOUUsTUFBTSxpQkFBaUIsR0FBcUIsSUFBSSwwQkFBaUIsQ0FBQyxJQUFJLEVBQUUsV0FBVyxFQUFFLFdBQVcsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUN6RyxHQUFHLENBQUMsSUFBSSxDQUFDLGlCQUFpQixDQUFDLENBQUM7UUFDNUIsTUFBTSxNQUFNLEdBQVUsSUFBSSxlQUFNLENBQUMsU0FBUyxFQUFFLFlBQVksRUFBRSxJQUFJLEVBQUUsR0FBRyxDQUFDLENBQUM7UUFDckUsTUFBTSxVQUFVLEdBQWMsSUFBSSxlQUFVLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDckQsTUFBTSxDQUFDLE1BQU0sR0FBRyxDQUFDLGFBQWEsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUN6RCxDQUFDLENBQUEsQ0FBQyxDQUFDO0lBRUgsSUFBSSxDQUFDLDBDQUEwQyxFQUFFLEdBQVMsRUFBRTtRQUMxRCxNQUFNLFFBQVEsR0FBYSxrQkFBUSxDQUFDLFdBQVcsRUFBRSxDQUFDO1FBQ2xELE1BQU0sU0FBUyxHQUFXLEtBQUssQ0FBQztRQUNoQywyQkFBMkI7UUFDM0IsTUFBTSxJQUFJLEdBQXdCLEVBQUUsQ0FBQztRQUNyQyxNQUFNLEdBQUcsR0FBdUIsRUFBRSxDQUFDO1FBQ25DLE1BQU0sU0FBUyxHQUFNLElBQUksZUFBRSxDQUFDLGNBQWMsQ0FBQyxDQUFDO1FBQzVDLE1BQU0sTUFBTSxHQUFzQixJQUFJLDRCQUFrQixDQUFDLFNBQVMsRUFBRSxNQUFNLEVBQUUsSUFBSSxlQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDMUYsTUFBTSxrQkFBa0IsR0FBc0IsSUFBSSw0QkFBa0IsQ0FBQyxXQUFXLEVBQUUsTUFBTSxDQUFDLENBQUM7UUFDMUYsSUFBSSxDQUFDLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDO1FBQzlCLE1BQU0sUUFBUSxHQUFNLElBQUksZUFBRSxDQUFDLG1CQUFtQixDQUFDLENBQUM7UUFDaEQsTUFBTSxLQUFLLEdBQXFCLElBQUksMEJBQWlCLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDaEUsS0FBSyxDQUFDLGVBQWUsQ0FBQyxDQUFDLEVBQUUsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDcEMsTUFBTSxJQUFJLEdBQVUsUUFBUSxDQUFDLFVBQVUsQ0FBQyxtREFBbUQsQ0FBQyxDQUFDO1FBQzdGLE1BQU0sV0FBVyxHQUFVLGVBQU0sQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLGNBQWMsQ0FBQyxJQUFJLGVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQzlFLE1BQU0saUJBQWlCLEdBQXFCLElBQUksMEJBQWlCLENBQUMsSUFBSSxFQUFFLFdBQVcsRUFBRSxXQUFXLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDekcsR0FBRyxDQUFDLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO1FBQzVCLE1BQU0sTUFBTSxHQUFVLElBQUksZUFBTSxDQUFDLFNBQVMsRUFBRSxZQUFZLEVBQUUsSUFBSSxFQUFFLEdBQUcsQ0FBQyxDQUFDO1FBQ3JFLE1BQU0sVUFBVSxHQUFjLElBQUksZUFBVSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQ3JELE1BQU0sQ0FBQyxNQUFNLEdBQUcsQ0FBQyxhQUFhLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDMUQsQ0FBQyxDQUFBLENBQUMsQ0FBQztJQUVILElBQUksQ0FBQyw2Q0FBNkMsRUFBRSxHQUFTLEVBQUU7UUFDN0QsTUFBTSxRQUFRLEdBQWEsa0JBQVEsQ0FBQyxXQUFXLEVBQUUsQ0FBQztRQUNsRCxNQUFNLFNBQVMsR0FBVyxLQUFLLENBQUM7UUFDaEMsMkJBQTJCO1FBQzNCLE1BQU0sSUFBSSxHQUF3QixFQUFFLENBQUM7UUFDckMsTUFBTSxHQUFHLEdBQXVCLEVBQUUsQ0FBQztRQUNuQyxNQUFNLFNBQVMsR0FBTSxJQUFJLGVBQUUsQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDO1FBQ2pELE1BQU0sTUFBTSxHQUFzQixJQUFJLDRCQUFrQixDQUFDLFNBQVMsRUFBRSxNQUFNLEVBQUUsSUFBSSxlQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDMUYsTUFBTSxrQkFBa0IsR0FBc0IsSUFBSSw0QkFBa0IsQ0FBQyxXQUFXLEVBQUUsTUFBTSxDQUFDLENBQUM7UUFDMUYsSUFBSSxDQUFDLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDO1FBQzlCLE1BQU0sUUFBUSxHQUFNLElBQUksZUFBRSxDQUFDLG1CQUFtQixDQUFDLENBQUM7UUFDaEQsTUFBTSxLQUFLLEdBQXFCLElBQUksMEJBQWlCLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDaEUsS0FBSyxDQUFDLGVBQWUsQ0FBQyxDQUFDLEVBQUUsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDcEMsTUFBTSxJQUFJLEdBQVUsUUFBUSxDQUFDLFVBQVUsQ0FBQyxtREFBbUQsQ0FBQyxDQUFDO1FBQzdGLE1BQU0sV0FBVyxHQUFVLGVBQU0sQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLGNBQWMsQ0FBQyxJQUFJLGVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQzlFLE1BQU0saUJBQWlCLEdBQXFCLElBQUksMEJBQWlCLENBQUMsSUFBSSxFQUFFLFdBQVcsRUFBRSxXQUFXLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDekcsR0FBRyxDQUFDLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO1FBQzVCLE1BQU0sTUFBTSxHQUFVLElBQUksZUFBTSxDQUFDLFNBQVMsRUFBRSxZQUFZLEVBQUUsSUFBSSxFQUFFLEdBQUcsQ0FBQyxDQUFDO1FBQ3JFLE1BQU0sVUFBVSxHQUFjLElBQUksZUFBVSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQ3JELE1BQU0sQ0FBQyxNQUFNLEdBQUcsQ0FBQyxhQUFhLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDekQsQ0FBQyxDQUFBLENBQUMsQ0FBQztJQUVILElBQUksQ0FBQyxxQkFBcUIsRUFBRSxHQUFHLEVBQUU7UUFDL0IsTUFBTSxNQUFNLEdBQVUsSUFBSSxlQUFNLENBQUMsS0FBSyxFQUFFLFlBQVksRUFBRSxPQUFPLEVBQUUsTUFBTSxDQUFDLENBQUM7UUFDdkUsTUFBTSxHQUFHLEdBQWMsSUFBSSxlQUFVLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDOUMsTUFBTSxLQUFLLEdBQTRCLEdBQUcsQ0FBQyxjQUFjLEVBQUUsQ0FBQyxNQUFNLEVBQUUsQ0FBQztRQUNyRSxNQUFNLE1BQU0sR0FBNkIsR0FBRyxDQUFDLGNBQWMsRUFBRSxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQ3hFLE1BQU0sQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUN6QyxNQUFNLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUM7UUFFM0MsTUFBTSxDQUFDLEdBQUcsQ0FBQyxjQUFjLEVBQUUsQ0FBQyxTQUFTLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNqRCxNQUFNLENBQUMsR0FBRyxDQUFDLGNBQWMsRUFBRSxDQUFDLFlBQVksRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ3hELE1BQU0sQ0FBQyxHQUFHLENBQUMsY0FBYyxFQUFFLENBQUMsZUFBZSxFQUFFLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztRQUVsRyxJQUFJLENBQUMsR0FBaUIsRUFBRSxDQUFDO1FBQ3pCLElBQUksQ0FBQyxHQUFpQixFQUFFLENBQUM7UUFDekIsS0FBSyxJQUFJLENBQUMsR0FBVSxDQUFDLEVBQUUsQ0FBQyxHQUFHLEtBQUssQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUU7WUFDNUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQztZQUM1QixDQUFDLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDO1NBQzlCO1FBQ0QsTUFBTSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBRWhFLENBQUMsR0FBRyxFQUFFLENBQUM7UUFDUCxDQUFDLEdBQUcsRUFBRSxDQUFDO1FBRVAsS0FBSyxJQUFJLENBQUMsR0FBVSxDQUFDLEVBQUUsQ0FBQyxHQUFHLE1BQU0sQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUU7WUFDN0MsQ0FBQyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQztZQUM3QixDQUFDLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDO1NBQy9CO1FBQ0QsTUFBTSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBRWhFLE1BQU0sTUFBTSxHQUFjLElBQUksZUFBVSxFQUFFLENBQUM7UUFDM0MsTUFBTSxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQztRQUNsQyxNQUFNLENBQUMsTUFBTSxDQUFDLFFBQVEsRUFBRSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsUUFBUSxFQUFFLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7UUFDL0UsTUFBTSxDQUFDLE1BQU0sQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQztJQUNqRCxDQUFDLENBQUMsQ0FBQztJQUVILElBQUksQ0FBQyxrQ0FBa0MsRUFBRSxHQUFHLEVBQUU7UUFDNUMsTUFBTSxDQUFDLEdBQUcsRUFBRTtZQUNWLEdBQUcsQ0FBQyxXQUFXLENBQ2IsS0FBSyxFQUFFLFlBQVksRUFDbkIsSUFBSSxlQUFFLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQyxFQUFFLE9BQU8sRUFDNUIsTUFBTSxFQUFFLE1BQU0sRUFBRSxNQUFNLENBQ3ZCLENBQUM7UUFDSixDQUFDLENBQUMsQ0FBQyxPQUFPLEVBQUUsQ0FBQztJQUNmLENBQUMsQ0FBQyxDQUFDO0lBRUgsSUFBSSxDQUFDLG1CQUFtQixFQUFFLEdBQUcsRUFBRTtRQUM3QixNQUFNLE1BQU0sR0FBWSxJQUFJLG1CQUFRLENBQ2xDLEtBQUssRUFBRSxZQUFZLEVBQUUsT0FBTyxFQUFFLE1BQU0sRUFBRSxJQUFJLHFCQUFXLENBQUMsYUFBYSxDQUFDLENBQUMsVUFBVSxFQUFFLEVBQUUsU0FBUyxFQUFFLFNBQVMsQ0FDeEcsQ0FBQztRQUVGLE1BQU0sQ0FBQyxHQUFHLEVBQUU7WUFDVixNQUFNLENBQUMsUUFBUSxFQUFFLENBQUM7UUFDcEIsQ0FBQyxDQUFDLENBQUMsT0FBTyxFQUFFLENBQUM7UUFFYixNQUFNLFFBQVEsR0FBWSxJQUFJLG1CQUFRLENBQ3BDLEtBQUssRUFBRSxZQUFZLEVBQUcsT0FBTyxFQUFFLE1BQU0sRUFBRSxJQUFJLHFCQUFXLENBQUMsYUFBYSxDQUFDLENBQUMsVUFBVSxFQUFFLEVBQUUsUUFBUSxDQUFDLFVBQVUsQ0FBQywyQkFBZSxDQUFDLEVBQUUsU0FBUyxDQUNwSSxDQUFDO1FBQ0YsTUFBTSxNQUFNLEdBQVksSUFBSSxtQkFBUSxFQUFFLENBQUM7UUFDdkMsTUFBTSxVQUFVLEdBQVUsUUFBUSxDQUFDLFFBQVEsRUFBRSxDQUFDO1FBQzlDLE1BQU0sQ0FBQyxVQUFVLENBQUMsVUFBVSxDQUFDLENBQUM7UUFFOUIsTUFBTSxDQUFDLE1BQU0sQ0FBQyxRQUFRLEVBQUUsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO1FBQzNFLE1BQU0sQ0FBQyxNQUFNLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUM7UUFDcEQsTUFBTSxDQUFDLFFBQVEsQ0FBQyxlQUFlLEVBQUUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0lBQ25FLENBQUMsQ0FBQyxDQUFDO0lBRUgsSUFBSSxDQUFDLG1CQUFtQixFQUFFLEdBQUcsRUFBRTtRQUM3QixNQUFNLE1BQU0sR0FBWSxJQUFJLG1CQUFRLENBQ2xDLEtBQUssRUFBRSxZQUFZLEVBQUUsT0FBTyxFQUFFLE1BQU0sRUFBRSxTQUFTLEVBQUUsU0FBUyxFQUFFLFVBQVUsQ0FDdkUsQ0FBQztRQUVGLE1BQU0sQ0FBQyxHQUFHLEVBQUU7WUFDVixNQUFNLENBQUMsUUFBUSxFQUFFLENBQUM7UUFDcEIsQ0FBQyxDQUFDLENBQUMsT0FBTyxFQUFFLENBQUM7UUFFYixNQUFNLFFBQVEsR0FBWSxJQUFJLG1CQUFRLENBQ3BDLEtBQUssRUFBRSxZQUFZLEVBQUUsT0FBTyxFQUFFLE1BQU0sRUFBRSxTQUFTLEVBQUUsUUFBUSxDQUFDLFVBQVUsQ0FBQywyQkFBZSxDQUFDLEVBQUUsVUFBVSxDQUNsRyxDQUFDO1FBQ0YsTUFBTSxNQUFNLEdBQVksSUFBSSxtQkFBUSxFQUFFLENBQUM7UUFDdkMsTUFBTSxVQUFVLEdBQVUsUUFBUSxDQUFDLFFBQVEsRUFBRSxDQUFDO1FBQzlDLE1BQU0sQ0FBQyxVQUFVLENBQUMsVUFBVSxDQUFDLENBQUM7UUFFOUIsTUFBTSxDQUFDLE1BQU0sQ0FBQyxRQUFRLEVBQUUsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO1FBQzNFLE1BQU0sQ0FBQyxNQUFNLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUM7UUFDcEQsTUFBTSxDQUFDLFFBQVEsQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDLE1BQU0sQ0FBQyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsTUFBTSxDQUFDLENBQUM7SUFDckUsQ0FBQyxDQUFDLENBQUM7SUFFSCxJQUFJLENBQUMsNkNBQTZDLEVBQUUsR0FBRyxFQUFFO1FBQ3ZELE1BQU0sR0FBRyxHQUFjLEdBQUcsQ0FBQyxXQUFXLENBQ3BDLEtBQUssRUFBRSxZQUFZLEVBQ25CLElBQUksZUFBRSxDQUFDLElBQUksQ0FBQyxFQUFFLE9BQU8sRUFBRSxNQUFNLEVBQUUsTUFBTSxFQUFFLE1BQU0sRUFBRSxTQUFTLEVBQUUsU0FBUyxFQUFFLFNBQVMsRUFDOUUseUJBQU8sRUFBRSxFQUFFLHlCQUFPLEVBQUUsQ0FBQyxHQUFHLENBQUMsSUFBSSxlQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQ3hDLENBQUM7UUFDRixNQUFNLEVBQUUsR0FBTSxHQUFHLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBRWhDLE1BQU0sR0FBRyxHQUFNLElBQUksT0FBRSxFQUFFLENBQUM7UUFDeEIsR0FBRyxDQUFDLFVBQVUsQ0FBQyxFQUFFLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQztRQUM5QixNQUFNLENBQUMsR0FBRyxDQUFDLFFBQVEsRUFBRSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsUUFBUSxFQUFFLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7UUFDM0UsTUFBTSxDQUFDLEdBQUcsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQztJQUM3QyxDQUFDLENBQUMsQ0FBQztJQUNILElBQUksQ0FBQyxnREFBZ0QsRUFBRSxHQUFHLEVBQUU7UUFDMUQsTUFBTSxHQUFHLEdBQWMsR0FBRyxDQUFDLFdBQVcsQ0FDcEMsS0FBSyxFQUFFLFlBQVksRUFDbkIsSUFBSSxlQUFFLENBQUMsSUFBSSxDQUFDLEVBQUUsT0FBTyxFQUNyQixNQUFNLEVBQUUsTUFBTSxFQUFFLE1BQU0sQ0FDdkIsQ0FBQztRQUNGLE1BQU0sRUFBRSxHQUFNLEdBQUcsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDaEMsTUFBTSxHQUFHLEdBQU0sSUFBSSxPQUFFLEVBQUUsQ0FBQztRQUN4QixHQUFHLENBQUMsVUFBVSxDQUFDLEVBQUUsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDO1FBQzlCLE1BQU0sQ0FBQyxHQUFHLENBQUMsUUFBUSxFQUFFLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztRQUMzRSxNQUFNLENBQUMsR0FBRyxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDO0lBQzdDLENBQUMsQ0FBQyxDQUFDO0lBRUgsSUFBSSxDQUFDLDZCQUE2QixFQUFFLEdBQUcsRUFBRTtRQUN2QyxNQUFNLEdBQUcsR0FBYyxHQUFHLENBQUMsYUFBYSxDQUN0QyxLQUFLLEVBQUUsWUFBWSxFQUFFLE1BQU0sRUFBRSxNQUFNLEVBQUUsTUFBTSxFQUFFLFdBQVcsRUFBRSxRQUFRLENBQUMsVUFBVSxDQUFDLDJCQUFlLENBQUMsRUFBRSxJQUFJLGVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxPQUFPLEVBQ25ILElBQUkscUJBQVcsQ0FBQyxhQUFhLENBQUMsQ0FBQyxVQUFVLEVBQUUsRUFBRSx5QkFBTyxFQUFFLENBQUMsQ0FBQztRQUMxRCxNQUFNLEVBQUUsR0FBTSxHQUFHLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQ2hDLE1BQU0sR0FBRyxHQUFNLElBQUksT0FBRSxFQUFFLENBQUM7UUFDeEIsR0FBRyxDQUFDLFVBQVUsQ0FBQyxFQUFFLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQztRQUM5QixNQUFNLENBQUMsR0FBRyxDQUFDLFFBQVEsRUFBRSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsUUFBUSxFQUFFLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7SUFDN0UsQ0FBQyxDQUFDLENBQUM7SUFFSCxJQUFJLENBQUMsNkJBQTZCLEVBQUUsR0FBRyxFQUFFO1FBQ3ZDLE1BQU0sR0FBRyxHQUFjLEdBQUcsQ0FBQyxhQUFhLENBQ3RDLEtBQUssRUFBRSxZQUFZLEVBQUUsSUFBSSxlQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsV0FBVyxFQUM1QyxNQUFNLEVBQUUsTUFBTSxFQUFFLE1BQU0sRUFBRSxRQUFRLENBQUMsVUFBVSxDQUFDLDJCQUFlLENBQUMsRUFDNUQsU0FBUyxFQUFFLFNBQVMsRUFBRSxJQUFJLHFCQUFXLENBQUMsYUFBYSxDQUFDLENBQUMsVUFBVSxFQUFFLEVBQUUseUJBQU8sRUFBRSxDQUM3RSxDQUFBO1FBQ0QsTUFBTSxFQUFFLEdBQU0sR0FBRyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUNoQyxNQUFNLEdBQUcsR0FBTSxJQUFJLE9BQUUsRUFBRSxDQUFDO1FBQ3hCLEdBQUcsQ0FBQyxVQUFVLENBQUMsRUFBRSxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUM7UUFDOUIsTUFBTSxDQUFDLEVBQUUsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLFFBQVEsRUFBRSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO0lBQzdFLENBQUMsQ0FBQyxDQUFDO0FBRUwsQ0FBQyxDQUFDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgbW9ja0F4aW9zIGZyb20gJ2plc3QtbW9jay1heGlvcyc7XG5pbXBvcnQgeyBVVFhPU2V0LCBVVFhPIH0gZnJvbSAnc3JjL2FwaXMvcGxhdGZvcm12bS91dHhvcyc7XG5pbXBvcnQgeyBQbGF0Zm9ybVZNQVBJIH0gZnJvbSAnc3JjL2FwaXMvcGxhdGZvcm12bS9hcGknO1xuaW1wb3J0IHsgVW5zaWduZWRUeCwgVHggfSBmcm9tICdzcmMvYXBpcy9wbGF0Zm9ybXZtL3R4JztcbmltcG9ydCB7IEtleUNoYWluIH0gZnJvbSAnc3JjL2FwaXMvcGxhdGZvcm12bS9rZXljaGFpbic7XG5pbXBvcnQgeyBTRUNQVHJhbnNmZXJJbnB1dCwgVHJhbnNmZXJhYmxlSW5wdXQgfSBmcm9tICdzcmMvYXBpcy9wbGF0Zm9ybXZtL2lucHV0cyc7XG5pbXBvcnQgY3JlYXRlSGFzaCBmcm9tICdjcmVhdGUtaGFzaCc7XG5pbXBvcnQgQmluVG9vbHMgZnJvbSAnc3JjL3V0aWxzL2JpbnRvb2xzJztcbmltcG9ydCBCTiBmcm9tICdibi5qcyc7XG5pbXBvcnQgeyBCdWZmZXIgfSBmcm9tICdidWZmZXIvJztcbmltcG9ydCB7IFNFQ1BUcmFuc2Zlck91dHB1dCwgVHJhbnNmZXJhYmxlT3V0cHV0IH0gZnJvbSAnc3JjL2FwaXMvcGxhdGZvcm12bS9vdXRwdXRzJztcbmltcG9ydCB7IFBsYXRmb3JtVk1Db25zdGFudHMgfSBmcm9tICdzcmMvYXBpcy9wbGF0Zm9ybXZtL2NvbnN0YW50cyc7XG5pbXBvcnQgeyBBdmFsYW5jaGUgfSBmcm9tICdzcmMvaW5kZXgnO1xuaW1wb3J0IHsgVVRGOFBheWxvYWQgfSBmcm9tICdzcmMvdXRpbHMvcGF5bG9hZCc7XG5pbXBvcnQgeyBVbml4Tm93IH0gZnJvbSAnc3JjL3V0aWxzL2hlbHBlcmZ1bmN0aW9ucyc7XG5pbXBvcnQgeyBCYXNlVHggfSBmcm9tICdzcmMvYXBpcy9wbGF0Zm9ybXZtL2Jhc2V0eCc7XG5pbXBvcnQgeyBJbXBvcnRUeCB9IGZyb20gJ3NyYy9hcGlzL3BsYXRmb3Jtdm0vaW1wb3J0dHgnO1xuaW1wb3J0IHsgRXhwb3J0VHggfSBmcm9tICdzcmMvYXBpcy9wbGF0Zm9ybXZtL2V4cG9ydHR4JztcbmltcG9ydCB7IFBsYXRmb3JtQ2hhaW5JRCB9IGZyb20gJ3NyYy91dGlscy9jb25zdGFudHMnO1xuXG5cbi8qKlxuICogQGlnbm9yZVxuICovXG5jb25zdCBiaW50b29scyA9IEJpblRvb2xzLmdldEluc3RhbmNlKCk7XG5kZXNjcmliZSgnVHJhbnNhY3Rpb25zJywgKCkgPT4ge1xuICBsZXQgc2V0OlVUWE9TZXQ7XG4gIGxldCBrZXltZ3IxOktleUNoYWluO1xuICBsZXQga2V5bWdyMjpLZXlDaGFpbjtcbiAgbGV0IGtleW1ncjM6S2V5Q2hhaW47XG4gIGxldCBhZGRyczE6QXJyYXk8QnVmZmVyPjtcbiAgbGV0IGFkZHJzMjpBcnJheTxCdWZmZXI+O1xuICBsZXQgYWRkcnMzOkFycmF5PEJ1ZmZlcj47XG4gIGxldCB1dHhvczpBcnJheTxVVFhPPjtcbiAgbGV0IGlucHV0czpBcnJheTxUcmFuc2ZlcmFibGVJbnB1dD47XG4gIGxldCBvdXRwdXRzOkFycmF5PFRyYW5zZmVyYWJsZU91dHB1dD47XG4gIGxldCBpbXBvcnRJbnM6QXJyYXk8VHJhbnNmZXJhYmxlSW5wdXQ+O1xuICBsZXQgaW1wb3J0VVRYT3M6QXJyYXk8VVRYTz47XG4gIGxldCBleHBvcnRPdXRzOkFycmF5PFRyYW5zZmVyYWJsZU91dHB1dD47XG4gIGxldCBmdW5ndXR4b3M6QXJyYXk8VVRYTz47XG4gIGxldCBleHBvcnRVVFhPSURTOkFycmF5PHN0cmluZz47XG4gIGxldCBhcGk6UGxhdGZvcm1WTUFQSTtcbiAgY29uc3QgYW1udDpudW1iZXIgPSAxMDAwMDtcbiAgY29uc3QgbmV0aWQ6bnVtYmVyID0gMTIzNDU7XG4gIGNvbnN0IG1lbW86QnVmZmVyID0gQnVmZmVyLmZyb20oXCJBdmFsYW5jaGVKU1wiKTtcbiAgY29uc3QgYmxvY2tjaGFpbklEOkJ1ZmZlciA9IGJpbnRvb2xzLmNiNThEZWNvZGUoUGxhdGZvcm1DaGFpbklEKTtcbiAgY29uc3QgYWxpYXM6c3RyaW5nID0gJ1gnO1xuICBjb25zdCBhc3NldElEOkJ1ZmZlciA9IEJ1ZmZlci5mcm9tKGNyZWF0ZUhhc2goJ3NoYTI1NicpLnVwZGF0ZShcIldlbGwsIG5vdywgZG9uJ3QgeW91IHRlbGwgbWUgdG8gc21pbGUsIHlvdSBzdGljayBhcm91bmQgSSdsbCBtYWtlIGl0IHdvcnRoIHlvdXIgd2hpbGUuXCIpLmRpZ2VzdCgpKTtcbiAgY29uc3QgTkZUYXNzZXRJRDpCdWZmZXIgPSBCdWZmZXIuZnJvbShjcmVhdGVIYXNoKCdzaGEyNTYnKS51cGRhdGUoXCJJIGNhbid0IHN0YW5kIGl0LCBJIGtub3cgeW91IHBsYW5uZWQgaXQsIEknbW1hIHNldCBzdHJhaWdodCB0aGlzIFdhdGVyZ2F0ZS4nXCIpLmRpZ2VzdCgpKTtcbiAgbGV0IGFtb3VudDpCTjtcbiAgbGV0IGFkZHJlc3NlczpBcnJheTxCdWZmZXI+O1xuICBsZXQgZmFsbEFkZHJlc3NlczpBcnJheTxCdWZmZXI+O1xuICBsZXQgbG9ja3RpbWU6Qk47XG4gIGxldCBmYWxsTG9ja3RpbWU6Qk47XG4gIGxldCB0aHJlc2hvbGQ6bnVtYmVyO1xuICBsZXQgZmFsbFRocmVzaG9sZDpudW1iZXI7XG4gIGNvbnN0IG5mdHV0eG9pZHM6QXJyYXk8c3RyaW5nPiA9IFtdO1xuICBjb25zdCBpcCA9ICcxMjcuMC4wLjEnO1xuICBjb25zdCBwb3J0ID0gODA4MDtcbiAgY29uc3QgcHJvdG9jb2wgPSAnaHR0cCc7XG4gIGxldCBhdmFsYW5jaGU6QXZhbGFuY2hlO1xuICBjb25zdCBibG9ja2NoYWluaWQ6c3RyaW5nID0gUGxhdGZvcm1DaGFpbklEO1xuICBjb25zdCBuYW1lOnN0cmluZyA9ICdNb3J0eWNvaW4gaXMgdGhlIGR1bWIgYXMgYSBzYWNrIG9mIGhhbW1lcnMuJztcbiAgY29uc3Qgc3ltYm9sOnN0cmluZyA9ICdtb3JUJztcbiAgY29uc3QgZGVub21pbmF0aW9uOm51bWJlciA9IDg7XG4gIGxldCBhdmF4QXNzZXRJRDpCdWZmZXI7XG5cbiAgYmVmb3JlQWxsKGFzeW5jICgpID0+IHtcbiAgICBcbiAgICBhdmFsYW5jaGUgPSBuZXcgQXZhbGFuY2hlKGlwLCBwb3J0LCBwcm90b2NvbCwgMTIzNDUsIHVuZGVmaW5lZCwgdW5kZWZpbmVkLCBudWxsLCB0cnVlKTtcbiAgICBhcGkgPSBuZXcgUGxhdGZvcm1WTUFQSShhdmFsYW5jaGUsICcvZXh0L2JjL1AnKTtcblxuICAgIGNvbnN0IHJlc3VsdDpQcm9taXNlPEJ1ZmZlcj4gPSBhcGkuZ2V0QVZBWEFzc2V0SUQoKTtcbiAgICBjb25zdCBwYXlsb2FkOm9iamVjdCA9IHtcbiAgICAgIHJlc3VsdDoge1xuICAgICAgICBuYW1lLFxuICAgICAgICBzeW1ib2wsXG4gICAgICAgIGFzc2V0SUQ6IGJpbnRvb2xzLmNiNThFbmNvZGUoYXNzZXRJRCksXG4gICAgICAgIGRlbm9taW5hdGlvbjogYCR7ZGVub21pbmF0aW9ufWAsXG4gICAgICB9LFxuICAgIH07XG4gICAgY29uc3QgcmVzcG9uc2VPYmogPSB7XG4gICAgICBkYXRhOiBwYXlsb2FkLFxuICAgIH07XG5cbiAgICBtb2NrQXhpb3MubW9ja1Jlc3BvbnNlKHJlc3BvbnNlT2JqKTtcbiAgICBhdmF4QXNzZXRJRCA9IGF3YWl0IHJlc3VsdDtcbiAgfSk7XG5cbiAgYmVmb3JlRWFjaCgoKSA9PiB7XG4gICAgc2V0ID0gbmV3IFVUWE9TZXQoKTtcbiAgICBrZXltZ3IxID0gbmV3IEtleUNoYWluKGF2YWxhbmNoZS5nZXRIUlAoKSwgYWxpYXMpO1xuICAgIGtleW1ncjIgPSBuZXcgS2V5Q2hhaW4oYXZhbGFuY2hlLmdldEhSUCgpLCBhbGlhcyk7XG4gICAga2V5bWdyMyA9IG5ldyBLZXlDaGFpbihhdmFsYW5jaGUuZ2V0SFJQKCksIGFsaWFzKTtcbiAgICBhZGRyczEgPSBbXTtcbiAgICBhZGRyczIgPSBbXTtcbiAgICBhZGRyczMgPSBbXTtcbiAgICB1dHhvcyA9IFtdO1xuICAgIGlucHV0cyA9IFtdO1xuICAgIG91dHB1dHMgPSBbXTtcbiAgICBpbXBvcnRJbnMgPSBbXTtcbiAgICBpbXBvcnRVVFhPcyA9IFtdXG4gICAgZXhwb3J0T3V0cyA9IFtdO1xuICAgIGZ1bmd1dHhvcyA9IFtdO1xuICAgIGV4cG9ydFVUWE9JRFMgPSBbXTtcbiAgICBmb3IgKGxldCBpOm51bWJlciA9IDA7IGkgPCAzOyBpKyspIHtcbiAgICAgIGFkZHJzMS5wdXNoKGtleW1ncjEubWFrZUtleSgpLmdldEFkZHJlc3MoKSk7XG4gICAgICBhZGRyczIucHVzaChrZXltZ3IyLm1ha2VLZXkoKS5nZXRBZGRyZXNzKCkpO1xuICAgICAgYWRkcnMzLnB1c2goa2V5bWdyMy5tYWtlS2V5KCkuZ2V0QWRkcmVzcygpKTtcbiAgICB9XG4gICAgYW1vdW50ID0gbmV3IEJOKGFtbnQpO1xuICAgIGFkZHJlc3NlcyA9IGtleW1ncjEuZ2V0QWRkcmVzc2VzKCk7XG4gICAgZmFsbEFkZHJlc3NlcyA9IGtleW1ncjIuZ2V0QWRkcmVzc2VzKCk7XG4gICAgbG9ja3RpbWUgPSBuZXcgQk4oNTQzMjEpO1xuICAgIGZhbGxMb2NrdGltZSA9IGxvY2t0aW1lLmFkZChuZXcgQk4oNTApKTtcbiAgICB0aHJlc2hvbGQgPSAzO1xuICAgIGZhbGxUaHJlc2hvbGQgPSAxO1xuXG4gICAgY29uc3QgcGF5bG9hZDpCdWZmZXIgPSBCdWZmZXIuYWxsb2MoMTAyNCk7XG4gICAgcGF5bG9hZC53cml0ZShcIkFsbCB5b3UgVHJla2tpZXMgYW5kIFRWIGFkZGljdHMsIERvbid0IG1lYW4gdG8gZGlzcyBkb24ndCBtZWFuIHRvIGJyaW5nIHN0YXRpYy5cIiwgMCwgMTAyNCwgJ3V0ZjgnKTtcblxuICAgIGZvciAobGV0IGk6bnVtYmVyID0gMDsgaSA8IDU7IGkrKykge1xuICAgICAgbGV0IHR4aWQ6QnVmZmVyID0gQnVmZmVyLmZyb20oY3JlYXRlSGFzaCgnc2hhMjU2JykudXBkYXRlKGJpbnRvb2xzLmZyb21CTlRvQnVmZmVyKG5ldyBCTihpKSwgMzIpKS5kaWdlc3QoKSk7XG4gICAgICBsZXQgdHhpZHg6QnVmZmVyID0gQnVmZmVyLmZyb20oYmludG9vbHMuZnJvbUJOVG9CdWZmZXIobmV3IEJOKGkpLCA0KSk7XG4gICAgICBjb25zdCBvdXQ6U0VDUFRyYW5zZmVyT3V0cHV0ID0gbmV3IFNFQ1BUcmFuc2Zlck91dHB1dChhbW91bnQsIGFkZHJlc3NlcywgbG9ja3RpbWUsIHRocmVzaG9sZCk7XG4gICAgICBjb25zdCB4ZmVyb3V0OlRyYW5zZmVyYWJsZU91dHB1dCA9IG5ldyBUcmFuc2ZlcmFibGVPdXRwdXQoYXNzZXRJRCwgb3V0KTtcbiAgICAgIG91dHB1dHMucHVzaCh4ZmVyb3V0KTtcblxuICAgICAgY29uc3QgdTpVVFhPID0gbmV3IFVUWE8oUGxhdGZvcm1WTUNvbnN0YW50cy5MQVRFU1RDT0RFQywgdHhpZCwgdHhpZHgsIGFzc2V0SUQsIG91dCk7XG4gICAgICB1dHhvcy5wdXNoKHUpO1xuICAgICAgZnVuZ3V0eG9zLnB1c2godSk7XG4gICAgICBpbXBvcnRVVFhPcy5wdXNoKHUpO1xuXG4gICAgICB0eGlkID0gdS5nZXRUeElEKCk7XG4gICAgICB0eGlkeCA9IHUuZ2V0T3V0cHV0SWR4KCk7XG5cbiAgICAgIGNvbnN0IGlucHV0OlNFQ1BUcmFuc2ZlcklucHV0ID0gbmV3IFNFQ1BUcmFuc2ZlcklucHV0KGFtb3VudCk7XG4gICAgICBjb25zdCB4ZmVyaW46VHJhbnNmZXJhYmxlSW5wdXQgPSBuZXcgVHJhbnNmZXJhYmxlSW5wdXQodHhpZCwgdHhpZHgsIGFzc2V0SUQsIGlucHV0KTtcbiAgICAgIGlucHV0cy5wdXNoKHhmZXJpbik7XG4gICAgfVxuICAgIGZvcihsZXQgaTpudW1iZXIgPSAxOyBpIDwgNDsgaSsrKXtcbiAgICAgIGltcG9ydElucy5wdXNoKGlucHV0c1tpXSk7XG4gICAgICBleHBvcnRPdXRzLnB1c2gob3V0cHV0c1tpXSk7XG4gICAgICBleHBvcnRVVFhPSURTLnB1c2goZnVuZ3V0eG9zW2ldLmdldFVUWE9JRCgpKTtcbiAgICB9XG4gICAgc2V0LmFkZEFycmF5KHV0eG9zKTtcbiAgfSk7XG5cbiAgdGVzdCgnQ3JlYXRlIHNtYWxsIEJhc2VUeCB0aGF0IGlzIEdvb3NlIEVnZyBUeCcsIGFzeW5jICgpID0+IHtcbiAgICBjb25zdCBiaW50b29sczogQmluVG9vbHMgPSBCaW5Ub29scy5nZXRJbnN0YW5jZSgpO1xuICAgIGNvbnN0IG5ldHdvcmtJRDogbnVtYmVyID0gMTIzNDU7XG4gICAgXG4gICAgY29uc3Qgb3V0czpUcmFuc2ZlcmFibGVPdXRwdXRbXSA9IFtdO1xuICAgIGNvbnN0IGluczpUcmFuc2ZlcmFibGVJbnB1dFtdID0gW107XG4gICAgY29uc3Qgb3V0cHV0QW10OkJOID0gbmV3IEJOKFwiMjY2XCIpO1xuICAgIGNvbnN0IG91dHB1dDpTRUNQVHJhbnNmZXJPdXRwdXQgPSBuZXcgU0VDUFRyYW5zZmVyT3V0cHV0KG91dHB1dEFtdCwgYWRkcnMxLCBuZXcgQk4oMCksIDEpO1xuICAgIGNvbnN0IHRyYW5zZmVyYWJsZU91dHB1dDpUcmFuc2ZlcmFibGVPdXRwdXQgPSBuZXcgVHJhbnNmZXJhYmxlT3V0cHV0KGF2YXhBc3NldElELCBvdXRwdXQpO1xuICAgIG91dHMucHVzaCh0cmFuc2ZlcmFibGVPdXRwdXQpO1xuICAgIGNvbnN0IGlucHV0QW10OkJOID0gbmV3IEJOKFwiNDAwXCIpO1xuICAgIGNvbnN0IGlucHV0OlNFQ1BUcmFuc2ZlcklucHV0ID0gbmV3IFNFQ1BUcmFuc2ZlcklucHV0KGlucHV0QW10KTtcbiAgICBpbnB1dC5hZGRTaWduYXR1cmVJZHgoMCwgYWRkcnMxWzBdKTtcbiAgICBjb25zdCB0eGlkOkJ1ZmZlciA9IGJpbnRvb2xzLmNiNThEZWNvZGUoXCJuOFhINUpZMUVYNVZZcURlQWhCNFpkNEdLeGk5VU5ReTZvUHBNc0NBajFRNnhraWlMXCIpO1xuICAgIGNvbnN0IG91dHB1dEluZGV4OkJ1ZmZlciA9IEJ1ZmZlci5mcm9tKGJpbnRvb2xzLmZyb21CTlRvQnVmZmVyKG5ldyBCTigwKSwgNCkpO1xuICAgIGNvbnN0IHRyYW5zZmVyYWJsZUlucHV0OlRyYW5zZmVyYWJsZUlucHV0ID0gbmV3IFRyYW5zZmVyYWJsZUlucHV0KHR4aWQsIG91dHB1dEluZGV4LCBhdmF4QXNzZXRJRCwgaW5wdXQpO1xuICAgIGlucy5wdXNoKHRyYW5zZmVyYWJsZUlucHV0KTtcbiAgICBjb25zdCBiYXNlVHg6QmFzZVR4ID0gbmV3IEJhc2VUeChuZXR3b3JrSUQsIGJsb2NrY2hhaW5JRCwgb3V0cywgaW5zKTtcbiAgICBjb25zdCB1bnNpZ25lZFR4OlVuc2lnbmVkVHggPSBuZXcgVW5zaWduZWRUeChiYXNlVHgpO1xuICAgIGV4cGVjdChhd2FpdCBhcGkuY2hlY2tHb29zZUVnZyh1bnNpZ25lZFR4KSkudG9CZSh0cnVlKTtcbiAgfSk7XG5cbiAgdGVzdCgnY29uZmlybSBpbnB1dFRvdGFsLCBvdXRwdXRUb3RhbCBhbmQgZmVlIGFyZSBjb3JyZWN0JywgYXN5bmMgKCkgPT4ge1xuICAgIGNvbnN0IGJpbnRvb2xzOiBCaW5Ub29scyA9IEJpblRvb2xzLmdldEluc3RhbmNlKCk7XG4gICAgY29uc3QgbmV0d29ya0lEOiBudW1iZXIgPSAxMjM0NTtcbiAgICAvLyBsb2NhbCBuZXR3b3JrIFAgQ2hhaW4gSURcbiAgICAvLyBBVkFYIGFzc2V0SURcbiAgICBjb25zdCBhc3NldElEOkJ1ZmZlciA9IGJpbnRvb2xzLmNiNThEZWNvZGUoXCJuOFhINUpZMUVYNVZZcURlQWhCNFpkNEdLeGk5VU5ReTZvUHBNc0NBajFRNnhraWlMXCIpO1xuICAgIGNvbnN0IG91dHM6VHJhbnNmZXJhYmxlT3V0cHV0W10gPSBbXTtcbiAgICBjb25zdCBpbnM6VHJhbnNmZXJhYmxlSW5wdXRbXSA9IFtdO1xuICAgIGNvbnN0IG91dHB1dEFtdDpCTiA9IG5ldyBCTihcIjI2NlwiKTtcbiAgICBjb25zdCBvdXRwdXQ6U0VDUFRyYW5zZmVyT3V0cHV0ID0gbmV3IFNFQ1BUcmFuc2Zlck91dHB1dChvdXRwdXRBbXQsIGFkZHJzMSwgbmV3IEJOKDApLCAxKTtcbiAgICBjb25zdCB0cmFuc2ZlcmFibGVPdXRwdXQ6VHJhbnNmZXJhYmxlT3V0cHV0ID0gbmV3IFRyYW5zZmVyYWJsZU91dHB1dChhc3NldElELCBvdXRwdXQpO1xuICAgIG91dHMucHVzaCh0cmFuc2ZlcmFibGVPdXRwdXQpO1xuICAgIGNvbnN0IGlucHV0QW10OkJOID0gbmV3IEJOKFwiNDAwXCIpO1xuICAgIGNvbnN0IGlucHV0OlNFQ1BUcmFuc2ZlcklucHV0ID0gbmV3IFNFQ1BUcmFuc2ZlcklucHV0KGlucHV0QW10KTtcbiAgICBpbnB1dC5hZGRTaWduYXR1cmVJZHgoMCwgYWRkcnMxWzBdKTtcbiAgICBjb25zdCB0eGlkOkJ1ZmZlciA9IGJpbnRvb2xzLmNiNThEZWNvZGUoXCJuOFhINUpZMUVYNVZZcURlQWhCNFpkNEdLeGk5VU5ReTZvUHBNc0NBajFRNnhraWlMXCIpO1xuICAgIGNvbnN0IG91dHB1dEluZGV4OkJ1ZmZlciA9IEJ1ZmZlci5mcm9tKGJpbnRvb2xzLmZyb21CTlRvQnVmZmVyKG5ldyBCTigwKSwgNCkpO1xuICAgIGNvbnN0IHRyYW5zZmVyYWJsZUlucHV0OlRyYW5zZmVyYWJsZUlucHV0ID0gbmV3IFRyYW5zZmVyYWJsZUlucHV0KHR4aWQsIG91dHB1dEluZGV4LCBhc3NldElELCBpbnB1dCk7XG4gICAgaW5zLnB1c2godHJhbnNmZXJhYmxlSW5wdXQpO1xuICAgIGNvbnN0IGJhc2VUeDpCYXNlVHggPSBuZXcgQmFzZVR4KG5ldHdvcmtJRCwgYmxvY2tjaGFpbklELCBvdXRzLCBpbnMpO1xuICAgIGNvbnN0IHVuc2lnbmVkVHg6VW5zaWduZWRUeCA9IG5ldyBVbnNpZ25lZFR4KGJhc2VUeCk7XG4gICAgY29uc3QgaW5wdXRUb3RhbDpCTiA9IHVuc2lnbmVkVHguZ2V0SW5wdXRUb3RhbChhc3NldElEKTtcbiAgICBjb25zdCBvdXRwdXRUb3RhbDpCTiA9IHVuc2lnbmVkVHguZ2V0T3V0cHV0VG90YWwoYXNzZXRJRCk7XG4gICAgY29uc3QgYnVybjpCTiA9IHVuc2lnbmVkVHguZ2V0QnVybihhc3NldElEKTtcbiAgICBleHBlY3QoaW5wdXRUb3RhbC50b051bWJlcigpKS50b0VxdWFsKG5ldyBCTig0MDApLnRvTnVtYmVyKCkpO1xuICAgIGV4cGVjdChvdXRwdXRUb3RhbC50b051bWJlcigpKS50b0VxdWFsKG5ldyBCTigyNjYpLnRvTnVtYmVyKCkpO1xuICAgIGV4cGVjdChidXJuLnRvTnVtYmVyKCkpLnRvRXF1YWwobmV3IEJOKDEzNCkudG9OdW1iZXIoKSk7XG4gIH0pO1xuXG5cbiAgdGVzdChcIkNyZWF0ZSBzbWFsbCBCYXNlVHggdGhhdCBpc24ndCBHb29zZSBFZ2cgVHhcIiwgYXN5bmMgKCkgPT4ge1xuICAgIGNvbnN0IGJpbnRvb2xzOiBCaW5Ub29scyA9IEJpblRvb2xzLmdldEluc3RhbmNlKCk7XG4gICAgY29uc3QgbmV0d29ya0lEOiBudW1iZXIgPSAxMjM0NTtcbiAgICAvLyBsb2NhbCBuZXR3b3JrIFggQ2hhaW4gSURcbiAgICBjb25zdCBvdXRzOlRyYW5zZmVyYWJsZU91dHB1dFtdID0gW107XG4gICAgY29uc3QgaW5zOlRyYW5zZmVyYWJsZUlucHV0W10gPSBbXTtcbiAgICBjb25zdCBvdXRwdXRBbXQ6Qk4gPSBuZXcgQk4oXCIyNjdcIik7XG4gICAgY29uc3Qgb3V0cHV0OlNFQ1BUcmFuc2Zlck91dHB1dCA9IG5ldyBTRUNQVHJhbnNmZXJPdXRwdXQob3V0cHV0QW10LCBhZGRyczEsIG5ldyBCTigwKSwgMSk7XG4gICAgY29uc3QgdHJhbnNmZXJhYmxlT3V0cHV0OlRyYW5zZmVyYWJsZU91dHB1dCA9IG5ldyBUcmFuc2ZlcmFibGVPdXRwdXQoYXZheEFzc2V0SUQsIG91dHB1dCk7XG4gICAgb3V0cy5wdXNoKHRyYW5zZmVyYWJsZU91dHB1dCk7XG4gICAgY29uc3QgaW5wdXRBbXQ6Qk4gPSBuZXcgQk4oXCI0MDBcIik7XG4gICAgY29uc3QgaW5wdXQ6U0VDUFRyYW5zZmVySW5wdXQgPSBuZXcgU0VDUFRyYW5zZmVySW5wdXQoaW5wdXRBbXQpO1xuICAgIGlucHV0LmFkZFNpZ25hdHVyZUlkeCgwLCBhZGRyczFbMF0pO1xuICAgIGNvbnN0IHR4aWQ6QnVmZmVyID0gYmludG9vbHMuY2I1OERlY29kZShcIm44WEg1SlkxRVg1VllxRGVBaEI0WmQ0R0t4aTlVTlF5Nm9QcE1zQ0FqMVE2eGtpaUxcIik7XG4gICAgY29uc3Qgb3V0cHV0SW5kZXg6QnVmZmVyID0gQnVmZmVyLmZyb20oYmludG9vbHMuZnJvbUJOVG9CdWZmZXIobmV3IEJOKDApLCA0KSk7XG4gICAgY29uc3QgdHJhbnNmZXJhYmxlSW5wdXQ6VHJhbnNmZXJhYmxlSW5wdXQgPSBuZXcgVHJhbnNmZXJhYmxlSW5wdXQodHhpZCwgb3V0cHV0SW5kZXgsIGF2YXhBc3NldElELCBpbnB1dCk7XG4gICAgaW5zLnB1c2godHJhbnNmZXJhYmxlSW5wdXQpO1xuICAgIGNvbnN0IGJhc2VUeDpCYXNlVHggPSBuZXcgQmFzZVR4KG5ldHdvcmtJRCwgYmxvY2tjaGFpbklELCBvdXRzLCBpbnMpO1xuICAgIGNvbnN0IHVuc2lnbmVkVHg6VW5zaWduZWRUeCA9IG5ldyBVbnNpZ25lZFR4KGJhc2VUeCk7XG4gICAgZXhwZWN0KGF3YWl0IGFwaS5jaGVja0dvb3NlRWdnKHVuc2lnbmVkVHgpKS50b0JlKHRydWUpO1xuICB9KTtcblxuICB0ZXN0KCdDcmVhdGUgbGFyZ2UgQmFzZVR4IHRoYXQgaXMgR29vc2UgRWdnIFR4JywgYXN5bmMgKCkgPT4ge1xuICAgIGNvbnN0IGJpbnRvb2xzOiBCaW5Ub29scyA9IEJpblRvb2xzLmdldEluc3RhbmNlKCk7XG4gICAgY29uc3QgbmV0d29ya0lEOiBudW1iZXIgPSAxMjM0NTtcbiAgICAvLyBsb2NhbCBuZXR3b3JrIFAgQ2hhaW4gSURcbiAgICBjb25zdCBvdXRzOlRyYW5zZmVyYWJsZU91dHB1dFtdID0gW107XG4gICAgY29uc3QgaW5zOlRyYW5zZmVyYWJsZUlucHV0W10gPSBbXTtcbiAgICBjb25zdCBvdXRwdXRBbXQ6Qk4gPSBuZXcgQk4oXCI2MDk1NTU1MDAwMDBcIik7XG4gICAgY29uc3Qgb3V0cHV0OlNFQ1BUcmFuc2Zlck91dHB1dCA9IG5ldyBTRUNQVHJhbnNmZXJPdXRwdXQob3V0cHV0QW10LCBhZGRyczEsIG5ldyBCTigwKSwgMSk7XG4gICAgY29uc3QgdHJhbnNmZXJhYmxlT3V0cHV0OlRyYW5zZmVyYWJsZU91dHB1dCA9IG5ldyBUcmFuc2ZlcmFibGVPdXRwdXQoYXZheEFzc2V0SUQsIG91dHB1dCk7XG4gICAgb3V0cy5wdXNoKHRyYW5zZmVyYWJsZU91dHB1dCk7XG4gICAgY29uc3QgaW5wdXRBbXQ6Qk4gPSBuZXcgQk4oXCI0NTAwMDAwMDAwMDAwMDAwMFwiKTtcbiAgICBjb25zdCBpbnB1dDpTRUNQVHJhbnNmZXJJbnB1dCA9IG5ldyBTRUNQVHJhbnNmZXJJbnB1dChpbnB1dEFtdCk7XG4gICAgaW5wdXQuYWRkU2lnbmF0dXJlSWR4KDAsIGFkZHJzMVswXSk7XG4gICAgY29uc3QgdHhpZDpCdWZmZXIgPSBiaW50b29scy5jYjU4RGVjb2RlKFwibjhYSDVKWTFFWDVWWXFEZUFoQjRaZDRHS3hpOVVOUXk2b1BwTXNDQWoxUTZ4a2lpTFwiKTtcbiAgICBjb25zdCBvdXRwdXRJbmRleDpCdWZmZXIgPSBCdWZmZXIuZnJvbShiaW50b29scy5mcm9tQk5Ub0J1ZmZlcihuZXcgQk4oMCksIDQpKTtcbiAgICBjb25zdCB0cmFuc2ZlcmFibGVJbnB1dDpUcmFuc2ZlcmFibGVJbnB1dCA9IG5ldyBUcmFuc2ZlcmFibGVJbnB1dCh0eGlkLCBvdXRwdXRJbmRleCwgYXZheEFzc2V0SUQsIGlucHV0KTtcbiAgICBpbnMucHVzaCh0cmFuc2ZlcmFibGVJbnB1dCk7XG4gICAgY29uc3QgYmFzZVR4OkJhc2VUeCA9IG5ldyBCYXNlVHgobmV0d29ya0lELCBibG9ja2NoYWluSUQsIG91dHMsIGlucyk7XG4gICAgY29uc3QgdW5zaWduZWRUeDpVbnNpZ25lZFR4ID0gbmV3IFVuc2lnbmVkVHgoYmFzZVR4KTtcbiAgICBleHBlY3QoYXdhaXQgYXBpLmNoZWNrR29vc2VFZ2codW5zaWduZWRUeCkpLnRvQmUoZmFsc2UpO1xuICB9KTtcblxuICB0ZXN0KFwiQ3JlYXRlIGxhcmdlIEJhc2VUeCB0aGF0IGlzbid0IEdvb3NlIEVnZyBUeFwiLCBhc3luYyAoKSA9PiB7XG4gICAgY29uc3QgYmludG9vbHM6IEJpblRvb2xzID0gQmluVG9vbHMuZ2V0SW5zdGFuY2UoKTtcbiAgICBjb25zdCBuZXR3b3JrSUQ6IG51bWJlciA9IDEyMzQ1O1xuICAgIC8vIGxvY2FsIG5ldHdvcmsgUCBDaGFpbiBJRFxuICAgIGNvbnN0IG91dHM6VHJhbnNmZXJhYmxlT3V0cHV0W10gPSBbXTtcbiAgICBjb25zdCBpbnM6VHJhbnNmZXJhYmxlSW5wdXRbXSA9IFtdO1xuICAgIGNvbnN0IG91dHB1dEFtdDpCTiA9IG5ldyBCTihcIjQ0OTk1NjA5NTU1NTAwMDAwXCIpO1xuICAgIGNvbnN0IG91dHB1dDpTRUNQVHJhbnNmZXJPdXRwdXQgPSBuZXcgU0VDUFRyYW5zZmVyT3V0cHV0KG91dHB1dEFtdCwgYWRkcnMxLCBuZXcgQk4oMCksIDEpO1xuICAgIGNvbnN0IHRyYW5zZmVyYWJsZU91dHB1dDpUcmFuc2ZlcmFibGVPdXRwdXQgPSBuZXcgVHJhbnNmZXJhYmxlT3V0cHV0KGF2YXhBc3NldElELCBvdXRwdXQpO1xuICAgIG91dHMucHVzaCh0cmFuc2ZlcmFibGVPdXRwdXQpO1xuICAgIGNvbnN0IGlucHV0QW10OkJOID0gbmV3IEJOKFwiNDUwMDAwMDAwMDAwMDAwMDBcIik7XG4gICAgY29uc3QgaW5wdXQ6U0VDUFRyYW5zZmVySW5wdXQgPSBuZXcgU0VDUFRyYW5zZmVySW5wdXQoaW5wdXRBbXQpO1xuICAgIGlucHV0LmFkZFNpZ25hdHVyZUlkeCgwLCBhZGRyczFbMF0pO1xuICAgIGNvbnN0IHR4aWQ6QnVmZmVyID0gYmludG9vbHMuY2I1OERlY29kZShcIm44WEg1SlkxRVg1VllxRGVBaEI0WmQ0R0t4aTlVTlF5Nm9QcE1zQ0FqMVE2eGtpaUxcIik7XG4gICAgY29uc3Qgb3V0cHV0SW5kZXg6QnVmZmVyID0gQnVmZmVyLmZyb20oYmludG9vbHMuZnJvbUJOVG9CdWZmZXIobmV3IEJOKDApLCA0KSk7XG4gICAgY29uc3QgdHJhbnNmZXJhYmxlSW5wdXQ6VHJhbnNmZXJhYmxlSW5wdXQgPSBuZXcgVHJhbnNmZXJhYmxlSW5wdXQodHhpZCwgb3V0cHV0SW5kZXgsIGF2YXhBc3NldElELCBpbnB1dCk7XG4gICAgaW5zLnB1c2godHJhbnNmZXJhYmxlSW5wdXQpO1xuICAgIGNvbnN0IGJhc2VUeDpCYXNlVHggPSBuZXcgQmFzZVR4KG5ldHdvcmtJRCwgYmxvY2tjaGFpbklELCBvdXRzLCBpbnMpO1xuICAgIGNvbnN0IHVuc2lnbmVkVHg6VW5zaWduZWRUeCA9IG5ldyBVbnNpZ25lZFR4KGJhc2VUeCk7XG4gICAgZXhwZWN0KGF3YWl0IGFwaS5jaGVja0dvb3NlRWdnKHVuc2lnbmVkVHgpKS50b0JlKHRydWUpO1xuICB9KTtcblxuICB0ZXN0KCdDcmVhdGlvbiBVbnNpZ25lZFR4JywgKCkgPT4ge1xuICAgIGNvbnN0IGJhc2VUeDpCYXNlVHggPSBuZXcgQmFzZVR4KG5ldGlkLCBibG9ja2NoYWluSUQsIG91dHB1dHMsIGlucHV0cyk7XG4gICAgY29uc3QgdHh1OlVuc2lnbmVkVHggPSBuZXcgVW5zaWduZWRUeChiYXNlVHgpO1xuICAgIGNvbnN0IHR4aW5zOkFycmF5PFRyYW5zZmVyYWJsZUlucHV0PiA9IHR4dS5nZXRUcmFuc2FjdGlvbigpLmdldElucygpO1xuICAgIGNvbnN0IHR4b3V0czpBcnJheTxUcmFuc2ZlcmFibGVPdXRwdXQ+ID0gdHh1LmdldFRyYW5zYWN0aW9uKCkuZ2V0T3V0cygpO1xuICAgIGV4cGVjdCh0eGlucy5sZW5ndGgpLnRvQmUoaW5wdXRzLmxlbmd0aCk7XG4gICAgZXhwZWN0KHR4b3V0cy5sZW5ndGgpLnRvQmUob3V0cHV0cy5sZW5ndGgpO1xuXG4gICAgZXhwZWN0KHR4dS5nZXRUcmFuc2FjdGlvbigpLmdldFR4VHlwZSgpKS50b0JlKDApO1xuICAgIGV4cGVjdCh0eHUuZ2V0VHJhbnNhY3Rpb24oKS5nZXROZXR3b3JrSUQoKSkudG9CZSgxMjM0NSk7XG4gICAgZXhwZWN0KHR4dS5nZXRUcmFuc2FjdGlvbigpLmdldEJsb2NrY2hhaW5JRCgpLnRvU3RyaW5nKCdoZXgnKSkudG9CZShibG9ja2NoYWluSUQudG9TdHJpbmcoJ2hleCcpKTtcblxuICAgIGxldCBhOkFycmF5PHN0cmluZz4gPSBbXTtcbiAgICBsZXQgYjpBcnJheTxzdHJpbmc+ID0gW107XG4gICAgZm9yIChsZXQgaTpudW1iZXIgPSAwOyBpIDwgdHhpbnMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGEucHVzaCh0eGluc1tpXS50b1N0cmluZygpKTtcbiAgICAgIGIucHVzaChpbnB1dHNbaV0udG9TdHJpbmcoKSk7XG4gICAgfVxuICAgIGV4cGVjdChKU09OLnN0cmluZ2lmeShhLnNvcnQoKSkpLnRvQmUoSlNPTi5zdHJpbmdpZnkoYi5zb3J0KCkpKTtcblxuICAgIGEgPSBbXTtcbiAgICBiID0gW107XG5cbiAgICBmb3IgKGxldCBpOm51bWJlciA9IDA7IGkgPCB0eG91dHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGEucHVzaCh0eG91dHNbaV0udG9TdHJpbmcoKSk7XG4gICAgICBiLnB1c2gob3V0cHV0c1tpXS50b1N0cmluZygpKTtcbiAgICB9XG4gICAgZXhwZWN0KEpTT04uc3RyaW5naWZ5KGEuc29ydCgpKSkudG9CZShKU09OLnN0cmluZ2lmeShiLnNvcnQoKSkpO1xuXG4gICAgY29uc3QgdHh1bmV3OlVuc2lnbmVkVHggPSBuZXcgVW5zaWduZWRUeCgpO1xuICAgIHR4dW5ldy5mcm9tQnVmZmVyKHR4dS50b0J1ZmZlcigpKTtcbiAgICBleHBlY3QodHh1bmV3LnRvQnVmZmVyKCkudG9TdHJpbmcoJ2hleCcpKS50b0JlKHR4dS50b0J1ZmZlcigpLnRvU3RyaW5nKCdoZXgnKSk7XG4gICAgZXhwZWN0KHR4dW5ldy50b1N0cmluZygpKS50b0JlKHR4dS50b1N0cmluZygpKTtcbiAgfSk7XG5cbiAgdGVzdCgnQ3JlYXRpb24gVW5zaWduZWRUeCBDaGVjayBBbW91bnQnLCAoKSA9PiB7XG4gICAgZXhwZWN0KCgpID0+IHtcbiAgICAgIHNldC5idWlsZEJhc2VUeChcbiAgICAgICAgbmV0aWQsIGJsb2NrY2hhaW5JRCxcbiAgICAgICAgbmV3IEJOKGFtbnQgKiAxMDAwKSwgYXNzZXRJRCxcbiAgICAgICAgYWRkcnMzLCBhZGRyczEsIGFkZHJzMSwgXG4gICAgICApO1xuICAgIH0pLnRvVGhyb3coKTtcbiAgfSk7XG5cbiAgdGVzdCgnQ3JlYXRpb24gSW1wb3J0VHgnLCAoKSA9PiB7XG4gICAgY29uc3QgYm9tYnR4OkltcG9ydFR4ID0gbmV3IEltcG9ydFR4KFxuICAgICAgbmV0aWQsIGJsb2NrY2hhaW5JRCwgb3V0cHV0cywgaW5wdXRzLCBuZXcgVVRGOFBheWxvYWQoXCJoZWxsbyB3b3JsZFwiKS5nZXRQYXlsb2FkKCksIHVuZGVmaW5lZCwgaW1wb3J0SW5zXG4gICAgKTtcblxuICAgIGV4cGVjdCgoKSA9PiB7XG4gICAgICBib21idHgudG9CdWZmZXIoKTtcbiAgICB9KS50b1Rocm93KCk7XG5cbiAgICBjb25zdCBpbXBvcnR0eDpJbXBvcnRUeCA9IG5ldyBJbXBvcnRUeChcbiAgICAgIG5ldGlkLCBibG9ja2NoYWluSUQsICBvdXRwdXRzLCBpbnB1dHMsIG5ldyBVVEY4UGF5bG9hZChcImhlbGxvIHdvcmxkXCIpLmdldFBheWxvYWQoKSwgYmludG9vbHMuY2I1OERlY29kZShQbGF0Zm9ybUNoYWluSUQpLCBpbXBvcnRJbnNcbiAgICApO1xuICAgIGNvbnN0IHR4dW5ldzpJbXBvcnRUeCA9IG5ldyBJbXBvcnRUeCgpO1xuICAgIGNvbnN0IGltcG9ydGJ1ZmY6QnVmZmVyID0gaW1wb3J0dHgudG9CdWZmZXIoKTtcbiAgICB0eHVuZXcuZnJvbUJ1ZmZlcihpbXBvcnRidWZmKTtcblxuICAgIGV4cGVjdCh0eHVuZXcudG9CdWZmZXIoKS50b1N0cmluZygnaGV4JykpLnRvQmUoaW1wb3J0YnVmZi50b1N0cmluZygnaGV4JykpO1xuICAgIGV4cGVjdCh0eHVuZXcudG9TdHJpbmcoKSkudG9CZShpbXBvcnR0eC50b1N0cmluZygpKTtcbiAgICBleHBlY3QoaW1wb3J0dHguZ2V0SW1wb3J0SW5wdXRzKCkubGVuZ3RoKS50b0JlKGltcG9ydElucy5sZW5ndGgpO1xuICB9KTtcblxuICB0ZXN0KCdDcmVhdGlvbiBFeHBvcnRUeCcsICgpID0+IHtcbiAgICBjb25zdCBib21idHg6RXhwb3J0VHggPSBuZXcgRXhwb3J0VHgoXG4gICAgICBuZXRpZCwgYmxvY2tjaGFpbklELCBvdXRwdXRzLCBpbnB1dHMsIHVuZGVmaW5lZCwgdW5kZWZpbmVkLCBleHBvcnRPdXRzXG4gICAgKTtcblxuICAgIGV4cGVjdCgoKSA9PiB7XG4gICAgICBib21idHgudG9CdWZmZXIoKTtcbiAgICB9KS50b1Rocm93KCk7XG5cbiAgICBjb25zdCBleHBvcnR0eDpFeHBvcnRUeCA9IG5ldyBFeHBvcnRUeChcbiAgICAgIG5ldGlkLCBibG9ja2NoYWluSUQsIG91dHB1dHMsIGlucHV0cywgdW5kZWZpbmVkLCBiaW50b29scy5jYjU4RGVjb2RlKFBsYXRmb3JtQ2hhaW5JRCksIGV4cG9ydE91dHNcbiAgICApO1xuICAgIGNvbnN0IHR4dW5ldzpFeHBvcnRUeCA9IG5ldyBFeHBvcnRUeCgpO1xuICAgIGNvbnN0IGV4cG9ydGJ1ZmY6QnVmZmVyID0gZXhwb3J0dHgudG9CdWZmZXIoKTtcbiAgICB0eHVuZXcuZnJvbUJ1ZmZlcihleHBvcnRidWZmKTtcblxuICAgIGV4cGVjdCh0eHVuZXcudG9CdWZmZXIoKS50b1N0cmluZygnaGV4JykpLnRvQmUoZXhwb3J0YnVmZi50b1N0cmluZygnaGV4JykpO1xuICAgIGV4cGVjdCh0eHVuZXcudG9TdHJpbmcoKSkudG9CZShleHBvcnR0eC50b1N0cmluZygpKTtcbiAgICBleHBlY3QoZXhwb3J0dHguZ2V0RXhwb3J0T3V0cHV0cygpLmxlbmd0aCkudG9CZShleHBvcnRPdXRzLmxlbmd0aCk7XG4gIH0pO1xuXG4gIHRlc3QoJ0NyZWF0aW9uIFR4MSB3aXRoIGFzb2YsIGxvY2t0aW1lLCB0aHJlc2hvbGQnLCAoKSA9PiB7XG4gICAgY29uc3QgdHh1OlVuc2lnbmVkVHggPSBzZXQuYnVpbGRCYXNlVHgoXG4gICAgICBuZXRpZCwgYmxvY2tjaGFpbklELFxuICAgICAgbmV3IEJOKDkwMDApLCBhc3NldElELCBhZGRyczMsIGFkZHJzMSwgYWRkcnMxLCB1bmRlZmluZWQsIHVuZGVmaW5lZCwgdW5kZWZpbmVkLFxuICAgICAgVW5peE5vdygpLCBVbml4Tm93KCkuYWRkKG5ldyBCTig1MCkpLCAxLFxuICAgICk7XG4gICAgY29uc3QgdHg6VHggPSB0eHUuc2lnbihrZXltZ3IxKTtcblxuICAgIGNvbnN0IHR4MjpUeCA9IG5ldyBUeCgpO1xuICAgIHR4Mi5mcm9tU3RyaW5nKHR4LnRvU3RyaW5nKCkpO1xuICAgIGV4cGVjdCh0eDIudG9CdWZmZXIoKS50b1N0cmluZygnaGV4JykpLnRvQmUodHgudG9CdWZmZXIoKS50b1N0cmluZygnaGV4JykpO1xuICAgIGV4cGVjdCh0eDIudG9TdHJpbmcoKSkudG9CZSh0eC50b1N0cmluZygpKTtcbiAgfSk7XG4gIHRlc3QoJ0NyZWF0aW9uIFR4MiB3aXRob3V0IGFzb2YsIGxvY2t0aW1lLCB0aHJlc2hvbGQnLCAoKSA9PiB7XG4gICAgY29uc3QgdHh1OlVuc2lnbmVkVHggPSBzZXQuYnVpbGRCYXNlVHgoXG4gICAgICBuZXRpZCwgYmxvY2tjaGFpbklELFxuICAgICAgbmV3IEJOKDkwMDApLCBhc3NldElELFxuICAgICAgYWRkcnMzLCBhZGRyczEsIGFkZHJzMVxuICAgICk7XG4gICAgY29uc3QgdHg6VHggPSB0eHUuc2lnbihrZXltZ3IxKTtcbiAgICBjb25zdCB0eDI6VHggPSBuZXcgVHgoKTtcbiAgICB0eDIuZnJvbUJ1ZmZlcih0eC50b0J1ZmZlcigpKTtcbiAgICBleHBlY3QodHgyLnRvQnVmZmVyKCkudG9TdHJpbmcoJ2hleCcpKS50b0JlKHR4LnRvQnVmZmVyKCkudG9TdHJpbmcoJ2hleCcpKTtcbiAgICBleHBlY3QodHgyLnRvU3RyaW5nKCkpLnRvQmUodHgudG9TdHJpbmcoKSk7XG4gIH0pO1xuXG4gIHRlc3QoJ0NyZWF0aW9uIFR4NCB1c2luZyBJbXBvcnRUeCcsICgpID0+IHtcbiAgICBjb25zdCB0eHU6VW5zaWduZWRUeCA9IHNldC5idWlsZEltcG9ydFR4KFxuICAgICAgbmV0aWQsIGJsb2NrY2hhaW5JRCwgYWRkcnMzLCBhZGRyczEsIGFkZHJzMiwgaW1wb3J0VVRYT3MsIGJpbnRvb2xzLmNiNThEZWNvZGUoUGxhdGZvcm1DaGFpbklEKSwgbmV3IEJOKDkwKSwgYXNzZXRJRCxcbiAgICAgIG5ldyBVVEY4UGF5bG9hZChcImhlbGxvIHdvcmxkXCIpLmdldFBheWxvYWQoKSwgVW5peE5vdygpKTtcbiAgICBjb25zdCB0eDpUeCA9IHR4dS5zaWduKGtleW1ncjEpO1xuICAgIGNvbnN0IHR4MjpUeCA9IG5ldyBUeCgpO1xuICAgIHR4Mi5mcm9tQnVmZmVyKHR4LnRvQnVmZmVyKCkpO1xuICAgIGV4cGVjdCh0eDIudG9CdWZmZXIoKS50b1N0cmluZygnaGV4JykpLnRvQmUodHgudG9CdWZmZXIoKS50b1N0cmluZygnaGV4JykpO1xuICB9KTtcblxuICB0ZXN0KCdDcmVhdGlvbiBUeDUgdXNpbmcgRXhwb3J0VHgnLCAoKSA9PiB7XG4gICAgY29uc3QgdHh1OlVuc2lnbmVkVHggPSBzZXQuYnVpbGRFeHBvcnRUeChcbiAgICAgIG5ldGlkLCBibG9ja2NoYWluSUQsIG5ldyBCTig5MCksIGF2YXhBc3NldElELFxuICAgICAgYWRkcnMzLCBhZGRyczEsIGFkZHJzMiwgYmludG9vbHMuY2I1OERlY29kZShQbGF0Zm9ybUNoYWluSUQpLCBcbiAgICAgIHVuZGVmaW5lZCwgdW5kZWZpbmVkLCBuZXcgVVRGOFBheWxvYWQoXCJoZWxsbyB3b3JsZFwiKS5nZXRQYXlsb2FkKCksIFVuaXhOb3coKVxuICAgIClcbiAgICBjb25zdCB0eDpUeCA9IHR4dS5zaWduKGtleW1ncjEpO1xuICAgIGNvbnN0IHR4MjpUeCA9IG5ldyBUeCgpO1xuICAgIHR4Mi5mcm9tQnVmZmVyKHR4LnRvQnVmZmVyKCkpO1xuICAgIGV4cGVjdCh0eC50b0J1ZmZlcigpLnRvU3RyaW5nKCdoZXgnKSkudG9CZSh0eDIudG9CdWZmZXIoKS50b1N0cmluZygnaGV4JykpO1xuICB9KTtcblxufSk7XG4iXX0=