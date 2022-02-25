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
const utxos_1 = require("src/apis/avm/utxos");
const api_1 = require("src/apis/avm/api");
const tx_1 = require("src/apis/avm/tx");
const keychain_1 = require("src/apis/avm/keychain");
const inputs_1 = require("src/apis/avm/inputs");
const create_hash_1 = __importDefault(require("create-hash"));
const bintools_1 = __importDefault(require("src/utils/bintools"));
const bn_js_1 = __importDefault(require("bn.js"));
const buffer_1 = require("buffer/");
const outputs_1 = require("src/apis/avm/outputs");
const constants_1 = require("src/apis/avm/constants");
const ops_1 = require("src/apis/avm/ops");
const index_1 = require("src/index");
const payload_1 = require("src/utils/payload");
const initialstates_1 = require("src/apis/avm/initialstates");
const helperfunctions_1 = require("src/utils/helperfunctions");
const basetx_1 = require("src/apis/avm/basetx");
const createassettx_1 = require("src/apis/avm/createassettx");
const operationtx_1 = require("src/apis/avm/operationtx");
const importtx_1 = require("src/apis/avm/importtx");
const exporttx_1 = require("src/apis/avm/exporttx");
const constants_2 = require("src/utils/constants");
const constants_3 = require("src/utils/constants");
const constants_4 = require("../../../src/utils/constants");
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
    let ops;
    let importIns;
    let importUTXOs;
    let exportOuts;
    let fungutxos;
    let exportUTXOIDS;
    let api;
    const amnt = 10000;
    const netid = 12345;
    const memo = buffer_1.Buffer.from("DijetsJS");
    const blockchainid = constants_3.Defaults.network[netid].X.blockchainID;
    const alias = 'X';
    const assetID = buffer_1.Buffer.from(create_hash_1.default('sha256').update("Well, now, don't you tell me to smile, you stick around I'll make it worth your while.").digest());
    const NFTassetID = buffer_1.Buffer.from(create_hash_1.default('sha256').update("I can't stand it, I know you planned it, I'mma set straight this Watergate.'").digest());
    const codecID_zero = 0;
    const codecID_one = 1;
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
    const blockchainID = bintools.cb58Decode(blockchainid);
    const name = 'Mortycoin is the dumb as a sack of hammers.';
    const symbol = 'morT';
    const denomination = 8;
    let djtxAssetID;
    beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
        dijets = new index_1.Dijets(ip, port, protocol, netid, undefined, undefined, null, true);
        api = new api_1.AVMAPI(dijets, '/ext/bc/avm', blockchainid);
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
        payload.write("All you Trekkies and TV addicts, Don't mean to diss don't mean to bring static.", 0, 1024, 'utf8');
        for (let i = 0; i < 5; i++) {
            let txid = buffer_1.Buffer.from(create_hash_1.default('sha256').update(bintools.fromBNToBuffer(new bn_js_1.default(i), 32)).digest());
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
            const nfttxid = buffer_1.Buffer.from(create_hash_1.default('sha256').update(bintools.fromBNToBuffer(new bn_js_1.default(1000 + i), 32)).digest());
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
    test("BaseTx codecIDs", () => {
        const baseTx = new basetx_1.BaseTx();
        expect(baseTx.getCodecID()).toBe(codecID_zero);
        expect(baseTx.getTypeID()).toBe(constants_1.AVMConstants.BASETX);
        baseTx.setCodecID(codecID_one);
        expect(baseTx.getCodecID()).toBe(codecID_one);
        expect(baseTx.getTypeID()).toBe(constants_1.AVMConstants.BASETX_CODECONE);
        baseTx.setCodecID(codecID_zero);
        expect(baseTx.getCodecID()).toBe(codecID_zero);
        expect(baseTx.getTypeID()).toBe(constants_1.AVMConstants.BASETX);
    });
    test("Invalid BaseTx codecID", () => {
        const baseTx = new basetx_1.BaseTx();
        expect(() => {
            baseTx.setCodecID(2);
        }).toThrow("Error - BaseTx.setCodecID: invalid codecID. Valid codecIDs are 0 and 1.");
    });
    test("CreateAssetTx codecIDs", () => {
        const createAssetTx = new createassettx_1.CreateAssetTx();
        expect(createAssetTx.getCodecID()).toBe(codecID_zero);
        expect(createAssetTx.getTypeID()).toBe(constants_1.AVMConstants.CREATEASSETTX);
        createAssetTx.setCodecID(codecID_one);
        expect(createAssetTx.getCodecID()).toBe(codecID_one);
        expect(createAssetTx.getTypeID()).toBe(constants_1.AVMConstants.CREATEASSETTX_CODECONE);
        createAssetTx.setCodecID(codecID_zero);
        expect(createAssetTx.getCodecID()).toBe(codecID_zero);
        expect(createAssetTx.getTypeID()).toBe(constants_1.AVMConstants.CREATEASSETTX);
    });
    test("Invalid CreateAssetTx codecID", () => {
        const createAssetTx = new createassettx_1.CreateAssetTx();
        expect(() => {
            createAssetTx.setCodecID(2);
        }).toThrow("Error - CreateAssetTx.setCodecID: invalid codecID. Valid codecIDs are 0 and 1.");
    });
    test("OperationTx codecIDs", () => {
        const operationTx = new operationtx_1.OperationTx();
        expect(operationTx.getCodecID()).toBe(codecID_zero);
        expect(operationTx.getTypeID()).toBe(constants_1.AVMConstants.OPERATIONTX);
        operationTx.setCodecID(codecID_one);
        expect(operationTx.getCodecID()).toBe(codecID_one);
        expect(operationTx.getTypeID()).toBe(constants_1.AVMConstants.OPERATIONTX_CODECONE);
        operationTx.setCodecID(codecID_zero);
        expect(operationTx.getCodecID()).toBe(codecID_zero);
        expect(operationTx.getTypeID()).toBe(constants_1.AVMConstants.OPERATIONTX);
    });
    test("Invalid OperationTx codecID", () => {
        const operationTx = new operationtx_1.OperationTx();
        expect(() => {
            operationTx.setCodecID(2);
        }).toThrow("Error - OperationTx.setCodecID: invalid codecID. Valid codecIDs are 0 and 1.");
    });
    test("ImportTx codecIDs", () => {
        const importTx = new importtx_1.ImportTx();
        expect(importTx.getCodecID()).toBe(codecID_zero);
        expect(importTx.getTypeID()).toBe(constants_1.AVMConstants.IMPORTTX);
        importTx.setCodecID(codecID_one);
        expect(importTx.getCodecID()).toBe(codecID_one);
        expect(importTx.getTypeID()).toBe(constants_1.AVMConstants.IMPORTTX_CODECONE);
        importTx.setCodecID(codecID_zero);
        expect(importTx.getCodecID()).toBe(codecID_zero);
        expect(importTx.getTypeID()).toBe(constants_1.AVMConstants.IMPORTTX);
    });
    test("Invalid ImportTx codecID", () => {
        const importTx = new importtx_1.ImportTx();
        expect(() => {
            importTx.setCodecID(2);
        }).toThrow("Error - ImportTx.setCodecID: invalid codecID. Valid codecIDs are 0 and 1.");
    });
    test("ExportTx codecIDs", () => {
        const exportTx = new exporttx_1.ExportTx();
        expect(exportTx.getCodecID()).toBe(codecID_zero);
        expect(exportTx.getTypeID()).toBe(constants_1.AVMConstants.EXPORTTX);
        exportTx.setCodecID(codecID_one);
        expect(exportTx.getCodecID()).toBe(codecID_one);
        expect(exportTx.getTypeID()).toBe(constants_1.AVMConstants.EXPORTTX_CODECONE);
        exportTx.setCodecID(codecID_zero);
        expect(exportTx.getCodecID()).toBe(codecID_zero);
        expect(exportTx.getTypeID()).toBe(constants_1.AVMConstants.EXPORTTX);
    });
    test("Invalid ExportTx codecID", () => {
        const exportTx = new exporttx_1.ExportTx();
        expect(() => {
            exportTx.setCodecID(2);
        }).toThrow("Error - ExportTx.setCodecID: invalid codecID. Valid codecIDs are 0 and 1.");
    });
    test('Create small BaseTx that is Goose Egg Tx', () => __awaiter(void 0, void 0, void 0, function* () {
        const bintools = bintools_1.default.getInstance();
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
        const baseTx = new basetx_1.BaseTx(netid, blockchainID, outs, ins);
        const unsignedTx = new tx_1.UnsignedTx(baseTx);
        expect(yield api.checkGooseEgg(unsignedTx)).toBe(true);
    }));
    test('confirm inputTotal, outputTotal and fee are correct', () => __awaiter(void 0, void 0, void 0, function* () {
        const bintools = bintools_1.default.getInstance();
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
        const baseTx = new basetx_1.BaseTx(netid, blockchainID, outs, ins);
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
        const baseTx = new basetx_1.BaseTx(netid, blockchainID, outs, ins);
        const unsignedTx = new tx_1.UnsignedTx(baseTx);
        expect(yield api.checkGooseEgg(unsignedTx)).toBe(true);
    }));
    test('Create large BaseTx that is Goose Egg Tx', () => __awaiter(void 0, void 0, void 0, function* () {
        const bintools = bintools_1.default.getInstance();
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
        const baseTx = new basetx_1.BaseTx(netid, blockchainID, outs, ins);
        const unsignedTx = new tx_1.UnsignedTx(baseTx);
        expect(yield api.checkGooseEgg(unsignedTx)).toBe(false);
    }));
    test("Create large BaseTx that isn't Goose Egg Tx", () => __awaiter(void 0, void 0, void 0, function* () {
        const bintools = bintools_1.default.getInstance();
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
        const baseTx = new basetx_1.BaseTx(netid, blockchainID, outs, ins);
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
            set.buildBaseTx(netid, blockchainID, constants_4.ONEDJTX.mul(new bn_js_1.default(amnt * 10000)), assetID, addrs3, addrs1, addrs1);
        }).toThrow();
    });
    test('CreateAssetTX', () => {
        const secpbase1 = new outputs_1.SECPTransferOutput(new bn_js_1.default(777), addrs3, locktime, 1);
        const secpbase2 = new outputs_1.SECPTransferOutput(new bn_js_1.default(888), addrs2, locktime, 1);
        const secpbase3 = new outputs_1.SECPTransferOutput(new bn_js_1.default(999), addrs2, locktime, 1);
        const initialState = new initialstates_1.InitialStates();
        initialState.addOutput(secpbase1, constants_1.AVMConstants.SECPFXID);
        initialState.addOutput(secpbase2, constants_1.AVMConstants.SECPFXID);
        initialState.addOutput(secpbase3, constants_1.AVMConstants.SECPFXID);
        const name = 'Rickcoin is the most intelligent coin';
        const symbol = 'RICK';
        const denomination = 9;
        const txu = new createassettx_1.CreateAssetTx(netid, blockchainID, outputs, inputs, new payload_1.UTF8Payload("hello world").getPayload(), name, symbol, denomination, initialState);
        const txins = txu.getIns();
        const txouts = txu.getOuts();
        const initState = txu.getInitialStates();
        expect(txins.length).toBe(inputs.length);
        expect(txouts.length).toBe(outputs.length);
        expect(initState.toBuffer().toString('hex')).toBe(initialState.toBuffer().toString('hex'));
        expect(txu.getTxType()).toBe(constants_1.AVMConstants.CREATEASSETTX);
        expect(txu.getNetworkID()).toBe(12345);
        expect(txu.getBlockchainID().toString('hex')).toBe(blockchainID.toString('hex'));
        expect(txu.getName()).toBe(name);
        expect(txu.getSymbol()).toBe(symbol);
        expect(txu.getDenomination()).toBe(denomination);
        expect(txu.getDenominationBuffer().readUInt8(0)).toBe(denomination);
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
        const txunew = new createassettx_1.CreateAssetTx();
        txunew.fromBuffer(txu.toBuffer());
        expect(txunew.toBuffer().toString('hex')).toBe(txu.toBuffer().toString('hex'));
        expect(txunew.toString()).toBe(txu.toString());
    });
    test('Creation OperationTx', () => {
        const optx = new operationtx_1.OperationTx(netid, blockchainID, outputs, inputs, new payload_1.UTF8Payload("hello world").getPayload(), ops);
        const txunew = new operationtx_1.OperationTx();
        const opbuff = optx.toBuffer();
        txunew.fromBuffer(opbuff);
        expect(txunew.toBuffer().toString('hex')).toBe(opbuff.toString('hex'));
        expect(txunew.toString()).toBe(optx.toString());
        expect(optx.getOperations().length).toBe(ops.length);
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
    test('Creation Tx3 using OperationTx', () => {
        const txu = set.buildNFTTransferTx(netid, blockchainID, addrs3, addrs1, addrs2, nftutxoids, new bn_js_1.default(90), djtxAssetID, undefined, helperfunctions_1.UnixNow(), helperfunctions_1.UnixNow().add(new bn_js_1.default(50)), 1);
        const tx = txu.sign(keymgr1);
        const tx2 = new tx_1.Tx();
        tx2.fromBuffer(tx.toBuffer());
        expect(tx2.toBuffer().toString('hex')).toBe(tx.toBuffer().toString('hex'));
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHgudGVzdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3Rlc3RzL2FwaXMvYXZtL3R4LnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7QUFBQSxzRUFBd0M7QUFDeEMsOENBQW1EO0FBQ25ELDBDQUEwQztBQUMxQyx3Q0FBaUQ7QUFDakQsb0RBQWlEO0FBQ2pELGdEQUEyRTtBQUMzRSw4REFBcUM7QUFDckMsa0VBQTBDO0FBQzFDLGtEQUF1QjtBQUN2QixvQ0FBaUM7QUFDakMsa0RBQWlHO0FBQ2pHLHNEQUFzRDtBQUN0RCwwQ0FBK0U7QUFDL0UscUNBQXNDO0FBQ3RDLCtDQUFnRDtBQUNoRCw4REFBMkQ7QUFDM0QsK0RBQW9EO0FBQ3BELGdEQUE2QztBQUM3Qyw4REFBMkQ7QUFDM0QsMERBQXVEO0FBQ3ZELG9EQUFpRDtBQUNqRCxvREFBaUQ7QUFDakQsbURBQXNEO0FBQ3RELG1EQUErQztBQUMvQyw0REFBdUQ7QUFHdkQ7O0dBRUc7QUFDSCxNQUFNLFFBQVEsR0FBRyxrQkFBUSxDQUFDLFdBQVcsRUFBRSxDQUFDO0FBQ3hDLFFBQVEsQ0FBQyxjQUFjLEVBQUUsR0FBRyxFQUFFO0lBQzVCLElBQUksR0FBVyxDQUFDO0lBQ2hCLElBQUksT0FBZ0IsQ0FBQztJQUNyQixJQUFJLE9BQWdCLENBQUM7SUFDckIsSUFBSSxPQUFnQixDQUFDO0lBQ3JCLElBQUksTUFBb0IsQ0FBQztJQUN6QixJQUFJLE1BQW9CLENBQUM7SUFDekIsSUFBSSxNQUFvQixDQUFDO0lBQ3pCLElBQUksS0FBaUIsQ0FBQztJQUN0QixJQUFJLE1BQStCLENBQUM7SUFDcEMsSUFBSSxPQUFpQyxDQUFDO0lBQ3RDLElBQUksR0FBZ0MsQ0FBQztJQUNyQyxJQUFJLFNBQWtDLENBQUM7SUFDdkMsSUFBSSxXQUF1QixDQUFDO0lBQzVCLElBQUksVUFBb0MsQ0FBQztJQUN6QyxJQUFJLFNBQXFCLENBQUM7SUFDMUIsSUFBSSxhQUEy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RUFBRTtZQUM1QyxDQUFDLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDO1lBQzVCLENBQUMsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUM7U0FDOUI7UUFDRCxNQUFNLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFFaEUsQ0FBQyxHQUFHLEVBQUUsQ0FBQztRQUNQLENBQUMsR0FBRyxFQUFFLENBQUM7UUFFUCxLQUFLLElBQUksQ0FBQyxHQUFVLENBQUMsRUFBRSxDQUFDLEdBQUcsTUFBTSxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRTtZQUM3QyxDQUFDLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDO1lBQzdCLENBQUMsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUM7U0FDL0I7UUFDRCxNQUFNLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFFaEUsTUFBTSxNQUFNLEdBQWMsSUFBSSxlQUFVLEVBQUUsQ0FBQztRQUMzQyxNQUFNLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDO1FBQ2xDLE1BQU0sQ0FBQyxNQUFNLENBQUMsUUFBUSxFQUFFLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztRQUMvRSxNQUFNLENBQUMsTUFBTSxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDO0lBQ2pELENBQUMsQ0FBQyxDQUFDO0lBRUgsSUFBSSxDQUFDLGtDQUFrQyxFQUFFLEdBQUcsRUFBRTtRQUM1QyxNQUFNLENBQUMsR0FBRyxFQUFFO1lBQ1YsR0FBRyxDQUFDLFdBQVcsQ0FDYixLQUFLLEVBQUUsWUFBWSxFQUNuQixtQkFBTyxDQUFDLEdBQUcsQ0FBQyxJQUFJLGVBQUUsQ0FBQyxJQUFJLEdBQUcsS0FBSyxDQUFDLENBQUMsRUFBRSxPQUFPLEVBQzFDLE1BQU0sRUFBRSxNQUFNLEVBQUUsTUFBTSxDQUN2QixDQUFDO1FBQ0osQ0FBQyxDQUFDLENBQUMsT0FBTyxFQUFFLENBQUM7SUFDZixDQUFDLENBQUMsQ0FBQztJQUVILElBQUksQ0FBQyxlQUFlLEVBQUUsR0FBRyxFQUFFO1FBQ3pCLE1BQU0sU0FBUyxHQUFzQixJQUFJLDRCQUFrQixDQUFDLElBQUksZUFBRSxDQUFDLEdBQUcsQ0FBQyxFQUFFLE1BQU0sRUFBRSxRQUFRLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDOUYsTUFBTSxTQUFTLEdBQXNCLElBQUksNEJBQWtCLENBQUMsSUFBSSxlQUFFLENBQUMsR0FBRyxDQUFDLEVBQUUsTUFBTSxFQUFFLFFBQVEsRUFBRSxDQUFDLENBQUMsQ0FBQztRQUM5RixNQUFNLFNBQVMsR0FBc0IsSUFBSSw0QkFBa0IsQ0FBQyxJQUFJLGVBQUUsQ0FBQyxHQUFHLENBQUMsRUFBRSxNQUFNLEVBQUUsUUFBUSxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQzlGLE1BQU0sWUFBWSxHQUFpQixJQUFJLDZCQUFhLEVBQUUsQ0FBQztRQUN2RCxZQUFZLENBQUMsU0FBUyxDQUFDLFNBQVMsRUFBRSx3QkFBWSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQ3pELFlBQVksQ0FBQyxTQUFTLENBQUMsU0FBUyxFQUFFLHdCQUFZLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDekQsWUFBWSxDQUFDLFNBQVMsQ0FBQyxTQUFTLEVBQUUsd0JBQVksQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUN6RCxNQUFNLElBQUksR0FBVSx1Q0FBdUMsQ0FBQztRQUM1RCxNQUFNLE1BQU0sR0FBVSxNQUFNLENBQUM7UUFDN0IsTUFBTSxZQUFZLEdBQVUsQ0FBQyxDQUFDO1FBQzlCLE1BQU0sR0FBRyxHQUFpQixJQUFJLDZCQUFhLENBQUMsS0FBSyxFQUFFLFlBQVksRUFBRSxPQUFPLEVBQUUsTUFBTSxFQUFFLElBQUkscUJBQVcsQ0FBQyxhQUFhLENBQUMsQ0FBQyxVQUFVLEVBQUUsRUFBRSxJQUFJLEVBQUUsTUFBTSxFQUFFLFlBQVksRUFBRSxZQUFZLENBQUMsQ0FBQztRQUN6SyxNQUFNLEtBQUssR0FBNEIsR0FBRyxDQUFDLE1BQU0sRUFBRSxDQUFDO1FBQ3BELE1BQU0sTUFBTSxHQUE2QixHQUFHLENBQUMsT0FBTyxFQUFFLENBQUM7UUFDdkQsTUFBTSxTQUFTLEdBQWlCLEdBQUcsQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDO1FBQ3ZELE1BQU0sQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUN6QyxNQUFNLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDM0MsTUFBTSxDQUFDLFNBQVMsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLFFBQVEsRUFBRSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO1FBRTNGLE1BQU0sQ0FBQyxHQUFHLENBQUMsU0FBUyxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsd0JBQVksQ0FBQyxhQUFhLENBQUMsQ0FBQztRQUN6RCxNQUFNLENBQUMsR0FBRyxDQUFDLFlBQVksRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ3ZDLE1BQU0sQ0FBQyxHQUFHLENBQUMsZUFBZSxFQUFFLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztRQUVqRixNQUFNLENBQUMsR0FBRyxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ2pDLE1BQU0sQ0FBQyxHQUFHLENBQUMsU0FBUyxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDckMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxlQUFlLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsQ0FBQztRQUNqRCxNQUFNLENBQUMsR0FBRyxDQUFDLHFCQUFxQixFQUFFLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFDO1FBRXBFLElBQUksQ0FBQyxHQUFpQixFQUFFLENBQUM7UUFDekIsSUFBSSxDQUFDLEdBQWlCLEVBQUUsQ0FBQztRQUN6QixLQUFLLElBQUksQ0FBQyxHQUFVLENBQUMsRUFBRSxDQUFDLEdBQUcsS0FBSyxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRTtZQUM1QyxDQUFDLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDO1lBQzVCLENBQUMsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUM7U0FDOUI7UUFDRCxNQUFNLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFFaEUsQ0FBQyxHQUFHLEVBQUUsQ0FBQztRQUNQLENBQUMsR0FBRyxFQUFFLENBQUM7UUFFUCxLQUFLLElBQUksQ0FBQyxHQUFVLENBQUMsRUFBRSxDQUFDLEdBQUcsTUFBTSxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRTtZQUM3QyxDQUFDLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDO1lBQzdCLENBQUMsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUM7U0FDL0I7UUFDRCxNQUFNLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFFaEUsTUFBTSxNQUFNLEdBQWlCLElBQUksNkJBQWEsRUFBRSxDQUFDO1FBQ2pELE1BQU0sQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUM7UUFDbEMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxRQUFRLEVBQUUsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLFFBQVEsRUFBRSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO1FBQy9FLE1BQU0sQ0FBQyxNQUFNLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUM7SUFDakQsQ0FBQyxDQUFDLENBQUM7SUFFSCxJQUFJLENBQUMsc0JBQXNCLEVBQUUsR0FBRyxFQUFFO1FBQ2hDLE1BQU0sSUFBSSxHQUFlLElBQUkseUJBQVcsQ0FDdEMsS0FBSyxFQUFFLFlBQVksRUFBRSxPQUFPLEVBQUUsTUFBTSxFQUFFLElBQUkscUJBQVcsQ0FBQyxhQUFhLENBQUMsQ0FBQyxVQUFVLEVBQUUsRUFBRSxHQUFHLENBQ3ZGLENBQUM7UUFDRixNQUFNLE1BQU0sR0FBZSxJQUFJLHlCQUFXLEVBQUUsQ0FBQztRQUM3QyxNQUFNLE1BQU0sR0FBVSxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUM7UUFDdEMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUMxQixNQUFNLENBQUMsTUFBTSxDQUFDLFFBQVEsRUFBRSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7UUFDdkUsTUFBTSxDQUFDLE1BQU0sQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQztRQUNoRCxNQUFNLENBQUMsSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUFDLE1BQU0sQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUM7SUFDdkQsQ0FBQyxDQUFDLENBQUM7SUFFSCxJQUFJLENBQUMsbUJBQW1CLEVBQUUsR0FBRyxFQUFFO1FBQzdCLE1BQU0sTUFBTSxHQUFZLElBQUksbUJBQVEsQ0FDbEMsS0FBSyxFQUFFLFlBQVksRUFBRyxPQUFPLEVBQUUsTUFBTSxFQUFFLElBQUkscUJBQVcsQ0FBQyxhQUFhLENBQUMsQ0FBQyxVQUFVLEVBQUUsRUFBRSxTQUFTLEVBQUUsU0FBUyxDQUN6RyxDQUFDO1FBRUYsTUFBTSxDQUFDLEdBQUcsRUFBRTtZQUNWLE1BQU0sQ0FBQyxRQUFRLEVBQUUsQ0FBQztRQUNwQixDQUFDLENBQUMsQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUViLE1BQU0sUUFBUSxHQUFZLElBQUksbUJBQVEsQ0FDcEMsS0FBSyxFQUFFLFlBQVksRUFBRyxPQUFPLEVBQUUsTUFBTSxFQUFFLElBQUkscUJBQVcsQ0FBQyxhQUFhLENBQUMsQ0FBQyxVQUFVLEVBQUUsRUFBRSxRQUFRLENBQUMsVUFBVSxDQUFDLDJCQUFlLENBQUMsRUFBRSxTQUFTLENBQ3BJLENBQUM7UUFDRixNQUFNLE1BQU0sR0FBWSxJQUFJLG1CQUFRLEVBQUUsQ0FBQztRQUN2QyxNQUFNLFVBQVUsR0FBVSxRQUFRLENBQUMsUUFBUSxFQUFFLENBQUM7UUFDOUMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxVQUFVLENBQUMsQ0FBQztRQUU5QixNQUFNLENBQUMsTUFBTSxDQUFDLFFBQVEsRUFBRSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7UUFDM0UsTUFBTSxDQUFDLE1BQU0sQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQztRQUNwRCxNQUFNLENBQUMsUUFBUSxDQUFDLGVBQWUsRUFBRSxDQUFDLE1BQU0sQ0FBQyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLENBQUM7SUFDbkUsQ0FBQyxDQUFDLENBQUM7SUFFSCxJQUFJLENBQUMsbUJBQW1CLEVBQUUsR0FBRyxFQUFFO1FBQzdCLE1BQU0sTUFBTSxHQUFZLElBQUksbUJBQVEsQ0FDbEMsS0FBSyxFQUFFLFlBQVksRUFBRSxPQUFPLEVBQUUsTUFBTSxFQUFFLFNBQVMsRUFBRSxTQUFTLEVBQUUsVUFBVSxDQUN2RSxDQUFDO1FBRUYsTUFBTSxDQUFDLEdBQUcsRUFBRTtZQUNWLE1BQU0sQ0FBQyxRQUFRLEVBQUUsQ0FBQztRQUNwQixDQUFDLENBQUMsQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUViLE1BQU0sUUFBUSxHQUFZLElBQUksbUJBQVEsQ0FDcEMsS0FBSyxFQUFFLFlBQVksRUFBRSxPQUFPLEVBQUUsTUFBTSxFQUFFLFNBQVMsRUFBRSxRQUFRLENBQUMsVUFBVSxDQUFDLDJCQUFlLENBQUMsRUFBRSxVQUFVLENBQ2xHLENBQUM7UUFDRixNQUFNLE1BQU0sR0FBWSxJQUFJLG1CQUFRLEVBQUUsQ0FBQztRQUN2QyxNQUFNLFVBQVUsR0FBVSxRQUFRLENBQUMsUUFBUSxFQUFFLENBQUM7UUFDOUMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxVQUFVLENBQUMsQ0FBQztRQUU5QixNQUFNLENBQUMsTUFBTSxDQUFDLFFBQVEsRUFBRSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7UUFDM0UsTUFBTSxDQUFDLE1BQU0sQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQztRQUNwRCxNQUFNLENBQUMsUUFBUSxDQUFDLGdCQUFnQixFQUFFLENBQUMsTUFBTSxDQUFDLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUNyRSxDQUFDLENBQUMsQ0FBQztJQUVILElBQUksQ0FBQyw2Q0FBNkMsRUFBRSxHQUFHLEVBQUU7UUFDdkQsTUFBTSxHQUFHLEdBQWMsR0FBRyxDQUFDLFdBQVcsQ0FDcEMsS0FBSyxFQUFFLFlBQVksRUFDbkIsSUFBSSxlQUFFLENBQUMsSUFBSSxDQUFDLEVBQUUsT0FBTyxFQUFFLE1BQU0sRUFBRSxNQUFNLEVBQUUsTUFBTSxFQUFFLFNBQVMsRUFBRSxTQUFTLEVBQUUsU0FBUyxFQUM5RSx5QkFBTyxFQUFFLEVBQUUseUJBQU8sRUFBRSxDQUFDLEdBQUcsQ0FBQyxJQUFJLGVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FDeEMsQ0FBQztRQUNGLE1BQU0sRUFBRSxHQUFNLEdBQUcsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7UUFFaEMsTUFBTSxHQUFHLEdBQU0sSUFBSSxPQUFFLEVBQUUsQ0FBQztRQUN4QixHQUFHLENBQUMsVUFBVSxDQUFDLEVBQUUsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDO1FBQzlCLE1BQU0sQ0FBQyxHQUFHLENBQUMsUUFBUSxFQUFFLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztRQUMzRSxNQUFNLENBQUMsR0FBRyxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDO0lBQzdDLENBQUMsQ0FBQyxDQUFDO0lBQ0gsSUFBSSxDQUFDLGdEQUFnRCxFQUFFLEdBQUcsRUFBRTtRQUMxRCxNQUFNLEdBQUcsR0FBYyxHQUFHLENBQUMsV0FBVyxDQUNwQyxLQUFLLEVBQUUsWUFBWSxFQUNuQixJQUFJLGVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRSxPQUFPLEVBQ3JCLE1BQU0sRUFBRSxNQUFNLEVBQUUsTUFBTSxDQUN2QixDQUFDO1FBQ0YsTUFBTSxFQUFFLEdBQU0sR0FBRyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUNoQyxNQUFNLEdBQUcsR0FBTSxJQUFJLE9BQUUsRUFBRSxDQUFDO1FBQ3hCLEdBQUcsQ0FBQyxVQUFVLENBQUMsRUFBRSxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUM7UUFDOUIsTUFBTSxDQUFDLEdBQUcsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLFFBQVEsRUFBRSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO1FBQzNFLE1BQU0sQ0FBQyxHQUFHLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUM7SUFDN0MsQ0FBQyxDQUFDLENBQUM7SUFFSCxJQUFJLENBQUMsZ0NBQWdDLEVBQUUsR0FBRyxFQUFFO1FBQzFDLE1BQU0sR0FBRyxHQUFjLEdBQUcsQ0FBQyxrQkFBa0IsQ0FDM0MsS0FBSyxFQUFFLFlBQVksRUFDbkIsTUFBTSxFQUFFLE1BQU0sRUFBRSxNQUFNLEVBQUUsVUFBVSxFQUFFLElBQUksZUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLFdBQVcsRUFBRSxTQUFTLEVBQ3RFLHlCQUFPLEVBQUUsRUFBRSx5QkFBTyxFQUFFLENBQUMsR0FBRyxDQUFDLElBQUksZUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUN4QyxDQUFDO1FBQ0YsTUFBTSxFQUFFLEdBQU0sR0FBRyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUNoQyxNQUFNLEdBQUcsR0FBTSxJQUFJLE9BQUUsRUFBRSxDQUFDO1FBQ3hCLEdBQUcsQ0FBQyxVQUFVLENBQUMsRUFBRSxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUM7UUFDOUIsTUFBTSxDQUFDLEdBQUcsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLFFBQVEsRUFBRSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO0lBQzdFLENBQUMsQ0FBQyxDQUFDO0lBRUgsSUFBSSxDQUFDLDZCQUE2QixFQUFFLEdBQUcsRUFBRTtRQUN2QyxNQUFNLEdBQUcsR0FBYyxHQUFHLENBQUMsYUFBYSxDQUN0QyxLQUFLLEVBQUUsWUFBWSxFQUFFLE1BQU0sRUFBRSxNQUFNLEVBQUUsTUFBTSxFQUFFLFdBQVcsRUFBRSxRQUFRLENBQUMsVUFBVSxDQUFDLDJCQUFlLENBQUMsRUFBRSxJQUFJLGVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxPQUFPLEVBQ25ILElBQUkscUJBQVcsQ0FBQyxhQUFhLENBQUMsQ0FBQyxVQUFVLEVBQUUsRUFBRSx5QkFBTyxFQUFFLENBQUMsQ0FBQztRQUMxRCxNQUFNLEVBQUUsR0FBTSxHQUFHLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQ2hDLE1BQU0sR0FBRyxHQUFNLElBQUksT0FBRSxFQUFFLENBQUM7UUFDeEIsR0FBRyxDQUFDLFVBQVUsQ0FBQyxFQUFFLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQztRQUM5QixNQUFNLENBQUMsR0FBRyxDQUFDLFFBQVEsRUFBRSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsUUFBUSxFQUFFLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7SUFDN0UsQ0FBQyxDQUFDLENBQUM7SUFFSCxJQUFJLENBQUMsNkJBQTZCLEVBQUUsR0FBRyxFQUFFO1FBQ3ZDLE1BQU0sR0FBRyxHQUFjLEdBQUcsQ0FBQyxhQUFhLENBQ3RDLEtBQUssRUFBRSxZQUFZLEVBQUUsSUFBSSxlQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsV0FBVyxFQUM1QyxNQUFNLEVBQUUsTUFBTSxFQUFFLE1BQU0sRUFBRSxRQUFRLENBQUMsVUFBVSxDQUFDLDJCQUFlLENBQUMsRUFDNUQsU0FBUyxFQUFFLFNBQVMsRUFBRSxJQUFJLHFCQUFXLENBQUMsYUFBYSxDQUFDLENBQUMsVUFBVSxFQUFFLEVBQUUseUJBQU8sRUFBRSxDQUM3RSxDQUFBO1FBQ0QsTUFBTSxFQUFFLEdBQU0sR0FBRyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUNoQyxNQUFNLEdBQUcsR0FBTSxJQUFJLE9BQUUsRUFBRSxDQUFDO1FBQ3hCLEdBQUcsQ0FBQyxVQUFVLENBQUMsRUFBRSxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUM7UUFDOUIsTUFBTSxDQUFDLEVBQUUsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLFFBQVEsRUFBRSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO0lBQzdFLENBQUMsQ0FBQyxDQUFDO0FBRUwsQ0FBQyxDQUFDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgbW9ja0F4aW9zIGZyb20gJ2plc3QtbW9jay1heGlvcyc7XG5pbXBvcnQgeyBVVFhPU2V0LCBVVFhPIH0gZnJvbSAnc3JjL2FwaXMvYXZtL3V0eG9zJztcbmltcG9ydCB7IEFWTUFQSSB9IGZyb20gJ3NyYy9hcGlzL2F2bS9hcGknO1xuaW1wb3J0IHsgVW5zaWduZWRUeCwgVHggfSBmcm9tICdzcmMvYXBpcy9hdm0vdHgnO1xuaW1wb3J0IHsgS2V5Q2hhaW4gfSBmcm9tICdzcmMvYXBpcy9hdm0va2V5Y2hhaW4nO1xuaW1wb3J0IHsgU0VDUFRyYW5zZmVySW5wdXQsIFRyYW5zZmVyYWJsZUlucHV0IH0gZnJvbSAnc3JjL2FwaXMvYXZtL2lucHV0cyc7XG5pbXBvcnQgY3JlYXRlSGFzaCBmcm9tICdjcmVhdGUtaGFzaCc7XG5pbXBvcnQgQmluVG9vbHMgZnJvbSAnc3JjL3V0aWxzL2JpbnRvb2xzJztcbmltcG9ydCBCTiBmcm9tICdibi5qcyc7XG5pbXBvcnQgeyBCdWZmZXIgfSBmcm9tICdidWZmZXIvJztcbmltcG9ydCB7IFNFQ1BUcmFuc2Zlck91dHB1dCwgTkZUVHJhbnNmZXJPdXRwdXQsIFRyYW5zZmVyYWJsZU91dHB1dCB9IGZyb20gJ3NyYy9hcGlzL2F2bS9vdXRwdXRzJztcbmltcG9ydCB7IEFWTUNvbnN0YW50cyB9IGZyb20gJ3NyYy9hcGlzL2F2bS9jb25zdGFudHMnO1xuaW1wb3J0IHsgVHJhbnNmZXJhYmxlT3BlcmF0aW9uLCBORlRUcmFuc2Zlck9wZXJhdGlvbiB9IGZyb20gJ3NyYy9hcGlzL2F2bS9vcHMnO1xuaW1wb3J0IHsgQXZhbGFuY2hlIH0gZnJvbSAnc3JjL2luZGV4JztcbmltcG9ydCB7IFVURjhQYXlsb2FkIH0gZnJvbSAnc3JjL3V0aWxzL3BheWxvYWQnO1xuaW1wb3J0IHsgSW5pdGlhbFN0YXRlcyB9IGZyb20gJ3NyYy9hcGlzL2F2bS9pbml0aWFsc3RhdGVzJztcbmltcG9ydCB7IFVuaXhOb3cgfSBmcm9tICdzcmMvdXRpbHMvaGVscGVyZnVuY3Rpb25zJztcbmltcG9ydCB7IEJhc2VUeCB9IGZyb20gJ3NyYy9hcGlzL2F2bS9iYXNldHgnO1xuaW1wb3J0IHsgQ3JlYXRlQXNzZXRUeCB9IGZyb20gJ3NyYy9hcGlzL2F2bS9jcmVhdGVhc3NldHR4JztcbmltcG9ydCB7IE9wZXJhdGlvblR4IH0gZnJvbSAnc3JjL2FwaXMvYXZtL29wZXJhdGlvbnR4JztcbmltcG9ydCB7IEltcG9ydFR4IH0gZnJvbSAnc3JjL2FwaXMvYXZtL2ltcG9ydHR4JztcbmltcG9ydCB7IEV4cG9ydFR4IH0gZnJvbSAnc3JjL2FwaXMvYXZtL2V4cG9ydHR4JztcbmltcG9ydCB7IFBsYXRmb3JtQ2hhaW5JRCB9IGZyb20gJ3NyYy91dGlscy9jb25zdGFudHMnO1xuaW1wb3J0IHsgRGVmYXVsdHMgfSBmcm9tICdzcmMvdXRpbHMvY29uc3RhbnRzJztcbmltcG9ydCB7IE9ORUFWQVggfSBmcm9tICcuLi8uLi8uLi9zcmMvdXRpbHMvY29uc3RhbnRzJztcblxuXG4vKipcbiAqIEBpZ25vcmVcbiAqL1xuY29uc3QgYmludG9vbHMgPSBCaW5Ub29scy5nZXRJbnN0YW5jZSgpO1xuZGVzY3JpYmUoJ1RyYW5zYWN0aW9ucycsICgpID0+IHtcbiAgbGV0IHNldDpVVFhPU2V0O1xuICBsZXQga2V5bWdyMTpLZXlDaGFpbjtcbiAgbGV0IGtleW1ncjI6S2V5Q2hhaW47XG4gIGxldCBrZXltZ3IzOktleUNoYWluO1xuICBsZXQgYWRkcnMxOkFycmF5PEJ1ZmZlcj47XG4gIGxldCBhZGRyczI6QXJyYXk8QnVmZmVyPjtcbiAgbGV0IGFkZHJzMzpBcnJheTxCdWZmZXI+O1xuICBsZXQgdXR4b3M6QXJyYXk8VVRYTz47XG4gIGxldCBpbnB1dHM6QXJyYXk8VHJhbnNmZXJhYmxlSW5wdXQ+O1xuICBsZXQgb3V0cHV0czpBcnJheTxUcmFuc2ZlcmFibGVPdXRwdXQ+O1xuICBsZXQgb3BzOkFycmF5PFRyYW5zZmVyYWJsZU9wZXJhdGlvbj47XG4gIGxldCBpbXBvcnRJbnM6QXJyYXk8VHJhbnNmZXJhYmxlSW5wdXQ+O1xuICBsZXQgaW1wb3J0VVRYT3M6QXJyYXk8VVRYTz47XG4gIGxldCBleHBvcnRPdXRzOkFycmF5PFRyYW5zZmVyYWJsZU91dHB1dD47XG4gIGxldCBmdW5ndXR4b3M6QXJyYXk8VVRYTz47XG4gIGxldCBleHBvcnRVVFhPSURTOkFycmF5PHN0cmluZz47XG4gIGxldCBhcGk6QVZNQVBJO1xuICBjb25zdCBhbW50Om51bWJlciA9IDEwMDAwO1xuICBjb25zdCBuZXRpZDpudW1iZXIgPSAxMjM0NTtcbiAgY29uc3QgbWVtbzpCdWZmZXIgPSBCdWZmZXIuZnJvbShcIkF2YWxhbmNoZUpTXCIpO1xuICBjb25zdCBibG9ja2NoYWluaWQ6c3RyaW5nID0gRGVmYXVsdHMubmV0d29ya1tuZXRpZF0uWC5ibG9ja2NoYWluSUQ7XG4gIGNvbnN0IGFsaWFzOnN0cmluZyA9ICdYJztcbiAgY29uc3QgYXNzZXRJRDpCdWZmZXIgPSBCdWZmZXIuZnJvbShjcmVhdGVIYXNoKCdzaGEyNTYnKS51cGRhdGUoXCJXZWxsLCBub3csIGRvbid0IHlvdSB0ZWxsIG1lIHRvIHNtaWxlLCB5b3Ugc3RpY2sgYXJvdW5kIEknbGwgbWFrZSBpdCB3b3J0aCB5b3VyIHdoaWxlLlwiKS5kaWdlc3QoKSk7XG4gIGNvbnN0IE5GVGFzc2V0SUQ6QnVmZmVyID0gQnVmZmVyLmZyb20oY3JlYXRlSGFzaCgnc2hhMjU2JykudXBkYXRlKFwiSSBjYW4ndCBzdGFuZCBpdCwgSSBrbm93IHlvdSBwbGFubmVkIGl0LCBJJ21tYSBzZXQgc3RyYWlnaHQgdGhpcyBXYXRlcmdhdGUuJ1wiKS5kaWdlc3QoKSk7XG4gIGNvbnN0IGNvZGVjSURfemVybzogbnVtYmVyID0gMDtcbiAgY29uc3QgY29kZWNJRF9vbmU6IG51bWJlciA9IDE7XG4gIGxldCBhbW91bnQ6Qk47XG4gIGxldCBhZGRyZXNzZXM6QXJyYXk8QnVmZmVyPjtcbiAgbGV0IGZhbGxBZGRyZXNzZXM6QXJyYXk8QnVmZmVyPjtcbiAgbGV0IGxvY2t0aW1lOkJOO1xuICBsZXQgZmFsbExvY2t0aW1lOkJOO1xuICBsZXQgdGhyZXNob2xkOm51bWJlcjtcbiAgbGV0IGZhbGxUaHJlc2hvbGQ6bnVtYmVyO1xuICBjb25zdCBuZnR1dHhvaWRzOkFycmF5PHN0cmluZz4gPSBbXTtcbiAgY29uc3QgaXAgPSAnMTI3LjAuMC4xJztcbiAgY29uc3QgcG9ydCA9IDgwODA7XG4gIGNvbnN0IHByb3RvY29sID0gJ2h0dHAnO1xuICBsZXQgYXZhbGFuY2hlOkF2YWxhbmNoZTtcbiAgY29uc3QgYmxvY2tjaGFpbklEOkJ1ZmZlciA9IGJpbnRvb2xzLmNiNThEZWNvZGUoYmxvY2tjaGFpbmlkKTtcbiAgY29uc3QgbmFtZTpzdHJpbmcgPSAnTW9ydHljb2luIGlzIHRoZSBkdW1iIGFzIGEgc2FjayBvZiBoYW1tZXJzLic7XG4gIGNvbnN0IHN5bWJvbDpzdHJpbmcgPSAnbW9yVCc7XG4gIGNvbnN0IGRlbm9taW5hdGlvbjpudW1iZXIgPSA4O1xuICBsZXQgYXZheEFzc2V0SUQ6QnVmZmVyO1xuXG4gIGJlZm9yZUFsbChhc3luYyAoKSA9PiB7XG4gICAgYXZhbGFuY2hlID0gbmV3IEF2YWxhbmNoZShpcCwgcG9ydCwgcHJvdG9jb2wsIG5ldGlkLCB1bmRlZmluZWQsIHVuZGVmaW5lZCwgbnVsbCwgdHJ1ZSk7XG4gICAgYXBpID0gbmV3IEFWTUFQSShhdmFsYW5jaGUsICcvZXh0L2JjL2F2bScsIGJsb2NrY2hhaW5pZCk7XG5cbiAgICBjb25zdCByZXN1bHQ6UHJvbWlzZTxCdWZmZXI+ID0gYXBpLmdldEFWQVhBc3NldElEKCk7XG4gICAgY29uc3QgcGF5bG9hZDpvYmplY3QgPSB7XG4gICAgICByZXN1bHQ6IHtcbiAgICAgICAgbmFtZSxcbiAgICAgICAgc3ltYm9sLFxuICAgICAgICBhc3NldElEOiBiaW50b29scy5jYjU4RW5jb2RlKGFzc2V0SUQpLFxuICAgICAgICBkZW5vbWluYXRpb246IGAke2Rlbm9taW5hdGlvbn1gLFxuICAgICAgfSxcbiAgICB9O1xuICAgIGNvbnN0IHJlc3BvbnNlT2JqID0ge1xuICAgICAgZGF0YTogcGF5bG9hZCxcbiAgICB9O1xuXG4gICAgbW9ja0F4aW9zLm1vY2tSZXNwb25zZShyZXNwb25zZU9iaik7XG4gICAgYXZheEFzc2V0SUQgPSBhd2FpdCByZXN1bHQ7XG4gIH0pO1xuXG4gIGJlZm9yZUVhY2goKCkgPT4ge1xuICAgIHNldCA9IG5ldyBVVFhPU2V0KCk7XG4gICAga2V5bWdyMSA9IG5ldyBLZXlDaGFpbihhdmFsYW5jaGUuZ2V0SFJQKCksIGFsaWFzKTtcbiAgICBrZXltZ3IyID0gbmV3IEtleUNoYWluKGF2YWxhbmNoZS5nZXRIUlAoKSwgYWxpYXMpO1xuICAgIGtleW1ncjMgPSBuZXcgS2V5Q2hhaW4oYXZhbGFuY2hlLmdldEhSUCgpLCBhbGlhcyk7XG4gICAgYWRkcnMxID0gW107XG4gICAgYWRkcnMyID0gW107XG4gICAgYWRkcnMzID0gW107XG4gICAgdXR4b3MgPSBbXTtcbiAgICBpbnB1dHMgPSBbXTtcbiAgICBvdXRwdXRzID0gW107XG4gICAgaW1wb3J0SW5zID0gW107XG4gICAgaW1wb3J0VVRYT3MgPSBbXTtcbiAgICBleHBvcnRPdXRzID0gW107XG4gICAgZnVuZ3V0eG9zID0gW107XG4gICAgZXhwb3J0VVRYT0lEUyA9IFtdO1xuICAgIG9wcyA9IFtdO1xuICAgIGZvciAobGV0IGk6bnVtYmVyID0gMDsgaSA8IDM7IGkrKykge1xuICAgICAgYWRkcnMxLnB1c2goa2V5bWdyMS5tYWtlS2V5KCkuZ2V0QWRkcmVzcygpKTtcbiAgICAgIGFkZHJzMi5wdXNoKGtleW1ncjIubWFrZUtleSgpLmdldEFkZHJlc3MoKSk7XG4gICAgICBhZGRyczMucHVzaChrZXltZ3IzLm1ha2VLZXkoKS5nZXRBZGRyZXNzKCkpO1xuICAgIH1cbiAgICBhbW91bnQgPSBPTkVBVkFYLm11bChuZXcgQk4oYW1udCkpO1xuICAgIGFkZHJlc3NlcyA9IGtleW1ncjEuZ2V0QWRkcmVzc2VzKCk7XG4gICAgZmFsbEFkZHJlc3NlcyA9IGtleW1ncjIuZ2V0QWRkcmVzc2VzKCk7XG4gICAgbG9ja3RpbWUgPSBuZXcgQk4oNTQzMjEpO1xuICAgIGZhbGxMb2NrdGltZSA9IGxvY2t0aW1lLmFkZChuZXcgQk4oNTApKTtcbiAgICB0aHJlc2hvbGQgPSAzO1xuICAgIGZhbGxUaHJlc2hvbGQgPSAxO1xuXG4gICAgY29uc3QgcGF5bG9hZDpCdWZmZXIgPSBCdWZmZXIuYWxsb2MoMTAyNCk7XG4gICAgcGF5bG9hZC53cml0ZShcIkFsbCB5b3UgVHJla2tpZXMgYW5kIFRWIGFkZGljdHMsIERvbid0IG1lYW4gdG8gZGlzcyBkb24ndCBtZWFuIHRvIGJyaW5nIHN0YXRpYy5cIiwgMCwgMTAyNCwgJ3V0ZjgnKTtcblxuICAgIGZvciAobGV0IGk6bnVtYmVyID0gMDsgaSA8IDU7IGkrKykge1xuICAgICAgbGV0IHR4aWQ6QnVmZmVyID0gQnVmZmVyLmZyb20oY3JlYXRlSGFzaCgnc2hhMjU2JykudXBkYXRlKGJpbnRvb2xzLmZyb21CTlRvQnVmZmVyKG5ldyBCTihpKSwgMzIpKS5kaWdlc3QoKSk7XG4gICAgICBsZXQgdHhpZHg6QnVmZmVyID0gQnVmZmVyLmZyb20oYmludG9vbHMuZnJvbUJOVG9CdWZmZXIobmV3IEJOKGkpLCA0KSk7XG4gICAgICBjb25zdCBvdXQ6U0VDUFRyYW5zZmVyT3V0cHV0ID0gbmV3IFNFQ1BUcmFuc2Zlck91dHB1dChhbW91bnQsIGFkZHJlc3NlcywgbG9ja3RpbWUsIHRocmVzaG9sZCk7XG4gICAgICBjb25zdCB4ZmVyb3V0OlRyYW5zZmVyYWJsZU91dHB1dCA9IG5ldyBUcmFuc2ZlcmFibGVPdXRwdXQoYXNzZXRJRCwgb3V0KTtcbiAgICAgIG91dHB1dHMucHVzaCh4ZmVyb3V0KTtcblxuICAgICAgY29uc3QgdTpVVFhPID0gbmV3IFVUWE8oQVZNQ29uc3RhbnRzLkxBVEVTVENPREVDLCB0eGlkLCB0eGlkeCwgYXNzZXRJRCwgb3V0KTtcbiAgICAgIHV0eG9zLnB1c2godSk7XG4gICAgICBmdW5ndXR4b3MucHVzaCh1KTtcbiAgICAgIGltcG9ydFVUWE9zLnB1c2godSk7XG5cbiAgICAgIHR4aWQgPSB1LmdldFR4SUQoKTtcbiAgICAgIHR4aWR4ID0gdS5nZXRPdXRwdXRJZHgoKTtcblxuICAgICAgY29uc3QgaW5wdXQ6U0VDUFRyYW5zZmVySW5wdXQgPSBuZXcgU0VDUFRyYW5zZmVySW5wdXQoYW1vdW50KTtcbiAgICAgIGNvbnN0IHhmZXJpbjpUcmFuc2ZlcmFibGVJbnB1dCA9IG5ldyBUcmFuc2ZlcmFibGVJbnB1dCh0eGlkLCB0eGlkeCwgYXNzZXRJRCwgaW5wdXQpO1xuICAgICAgaW5wdXRzLnB1c2goeGZlcmluKTtcblxuICAgICAgY29uc3Qgbm91dDpORlRUcmFuc2Zlck91dHB1dCA9IG5ldyBORlRUcmFuc2Zlck91dHB1dCgxMDAwICsgaSwgcGF5bG9hZCwgYWRkcmVzc2VzLCBsb2NrdGltZSwgdGhyZXNob2xkKTtcbiAgICAgIGNvbnN0IG9wOk5GVFRyYW5zZmVyT3BlcmF0aW9uID0gbmV3IE5GVFRyYW5zZmVyT3BlcmF0aW9uKG5vdXQpO1xuICAgICAgY29uc3QgbmZ0dHhpZDpCdWZmZXIgPSBCdWZmZXIuZnJvbShjcmVhdGVIYXNoKCdzaGEyNTYnKS51cGRhdGUoYmludG9vbHMuZnJvbUJOVG9CdWZmZXIobmV3IEJOKDEwMDAgKyBpKSwgMzIpKS5kaWdlc3QoKSk7XG4gICAgICBjb25zdCBuZnR1dHhvOlVUWE8gPSBuZXcgVVRYTyhBVk1Db25zdGFudHMuTEFURVNUQ09ERUMsIG5mdHR4aWQsIDEwMDAgKyBpLCBORlRhc3NldElELCBub3V0KTtcbiAgICAgIG5mdHV0eG9pZHMucHVzaChuZnR1dHhvLmdldFVUWE9JRCgpKTtcbiAgICAgIGNvbnN0IHhmZXJvcDpUcmFuc2ZlcmFibGVPcGVyYXRpb24gPSBuZXcgVHJhbnNmZXJhYmxlT3BlcmF0aW9uKE5GVGFzc2V0SUQsIFtuZnR1dHhvLmdldFVUWE9JRCgpXSwgb3ApO1xuICAgICAgb3BzLnB1c2goeGZlcm9wKTtcbiAgICAgIHV0eG9zLnB1c2gobmZ0dXR4byk7XG4gICAgfVxuICAgIGZvcihsZXQgaTpudW1iZXIgPSAxOyBpIDwgNDsgaSsrKXtcbiAgICAgIGltcG9ydElucy5wdXNoKGlucHV0c1tpXSk7XG4gICAgICBleHBvcnRPdXRzLnB1c2gob3V0cHV0c1tpXSk7XG4gICAgICBleHBvcnRVVFhPSURTLnB1c2goZnVuZ3V0eG9zW2ldLmdldFVUWE9JRCgpKTtcbiAgICB9XG4gICAgc2V0LmFkZEFycmF5KHV0eG9zKTtcbiAgfSk7XG5cbiAgdGVzdChcIkJhc2VUeCBjb2RlY0lEc1wiLCAoKSA9PiB7XG4gICAgY29uc3QgYmFzZVR4OiBCYXNlVHggPSBuZXcgQmFzZVR4KCk7XG4gICAgZXhwZWN0KGJhc2VUeC5nZXRDb2RlY0lEKCkpLnRvQmUoY29kZWNJRF96ZXJvKTtcbiAgICBleHBlY3QoYmFzZVR4LmdldFR5cGVJRCgpKS50b0JlKEFWTUNvbnN0YW50cy5CQVNFVFgpO1xuICAgIGJhc2VUeC5zZXRDb2RlY0lEKGNvZGVjSURfb25lKVxuICAgIGV4cGVjdChiYXNlVHguZ2V0Q29kZWNJRCgpKS50b0JlKGNvZGVjSURfb25lKTtcbiAgICBleHBlY3QoYmFzZVR4LmdldFR5cGVJRCgpKS50b0JlKEFWTUNvbnN0YW50cy5CQVNFVFhfQ09ERUNPTkUpO1xuICAgIGJhc2VUeC5zZXRDb2RlY0lEKGNvZGVjSURfemVybylcbiAgICBleHBlY3QoYmFzZVR4LmdldENvZGVjSUQoKSkudG9CZShjb2RlY0lEX3plcm8pO1xuICAgIGV4cGVjdChiYXNlVHguZ2V0VHlwZUlEKCkpLnRvQmUoQVZNQ29uc3RhbnRzLkJBU0VUWCk7XG4gIH0pO1xuXG4gIHRlc3QoXCJJbnZhbGlkIEJhc2VUeCBjb2RlY0lEXCIsICgpOiB2b2lkID0+IHtcbiAgICBjb25zdCBiYXNlVHg6IEJhc2VUeCA9IG5ldyBCYXNlVHgoKTtcbiAgICBleHBlY3QoKCkgPT4ge1xuICAgICAgYmFzZVR4LnNldENvZGVjSUQoMilcbiAgICB9KS50b1Rocm93KFwiRXJyb3IgLSBCYXNlVHguc2V0Q29kZWNJRDogaW52YWxpZCBjb2RlY0lELiBWYWxpZCBjb2RlY0lEcyBhcmUgMCBhbmQgMS5cIik7XG4gIH0pO1xuXG4gIHRlc3QoXCJDcmVhdGVBc3NldFR4IGNvZGVjSURzXCIsICgpID0+IHtcbiAgICBjb25zdCBjcmVhdGVBc3NldFR4OiBDcmVhdGVBc3NldFR4ID0gbmV3IENyZWF0ZUFzc2V0VHgoKTtcbiAgICBleHBlY3QoY3JlYXRlQXNzZXRUeC5nZXRDb2RlY0lEKCkpLnRvQmUoY29kZWNJRF96ZXJvKTtcbiAgICBleHBlY3QoY3JlYXRlQXNzZXRUeC5nZXRUeXBlSUQoKSkudG9CZShBVk1Db25zdGFudHMuQ1JFQVRFQVNTRVRUWCk7XG4gICAgY3JlYXRlQXNzZXRUeC5zZXRDb2RlY0lEKGNvZGVjSURfb25lKVxuICAgIGV4cGVjdChjcmVhdGVBc3NldFR4LmdldENvZGVjSUQoKSkudG9CZShjb2RlY0lEX29uZSk7XG4gICAgZXhwZWN0KGNyZWF0ZUFzc2V0VHguZ2V0VHlwZUlEKCkpLnRvQmUoQVZNQ29uc3RhbnRzLkNSRUFURUFTU0VUVFhfQ09ERUNPTkUpO1xuICAgIGNyZWF0ZUFzc2V0VHguc2V0Q29kZWNJRChjb2RlY0lEX3plcm8pXG4gICAgZXhwZWN0KGNyZWF0ZUFzc2V0VHguZ2V0Q29kZWNJRCgpKS50b0JlKGNvZGVjSURfemVybyk7XG4gICAgZXhwZWN0KGNyZWF0ZUFzc2V0VHguZ2V0VHlwZUlEKCkpLnRvQmUoQVZNQ29uc3RhbnRzLkNSRUFURUFTU0VUVFgpO1xuICB9KTtcblxuICB0ZXN0KFwiSW52YWxpZCBDcmVhdGVBc3NldFR4IGNvZGVjSURcIiwgKCk6IHZvaWQgPT4ge1xuICAgIGNvbnN0IGNyZWF0ZUFzc2V0VHg6IENyZWF0ZUFzc2V0VHggPSBuZXcgQ3JlYXRlQXNzZXRUeCgpO1xuICAgIGV4cGVjdCgoKSA9PiB7XG4gICAgICBjcmVhdGVBc3NldFR4LnNldENvZGVjSUQoMilcbiAgICB9KS50b1Rocm93KFwiRXJyb3IgLSBDcmVhdGVBc3NldFR4LnNldENvZGVjSUQ6IGludmFsaWQgY29kZWNJRC4gVmFsaWQgY29kZWNJRHMgYXJlIDAgYW5kIDEuXCIpO1xuICB9KTtcblxuICB0ZXN0KFwiT3BlcmF0aW9uVHggY29kZWNJRHNcIiwgKCkgPT4ge1xuICAgIGNvbnN0IG9wZXJhdGlvblR4OiBPcGVyYXRpb25UeCA9IG5ldyBPcGVyYXRpb25UeCgpO1xuICAgIGV4cGVjdChvcGVyYXRpb25UeC5nZXRDb2RlY0lEKCkpLnRvQmUoY29kZWNJRF96ZXJvKTtcbiAgICBleHBlY3Qob3BlcmF0aW9uVHguZ2V0VHlwZUlEKCkpLnRvQmUoQVZNQ29uc3RhbnRzLk9QRVJBVElPTlRYKTtcbiAgICBvcGVyYXRpb25UeC5zZXRDb2RlY0lEKGNvZGVjSURfb25lKVxuICAgIGV4cGVjdChvcGVyYXRpb25UeC5nZXRDb2RlY0lEKCkpLnRvQmUoY29kZWNJRF9vbmUpO1xuICAgIGV4cGVjdChvcGVyYXRpb25UeC5nZXRUeXBlSUQoKSkudG9CZShBVk1Db25zdGFudHMuT1BFUkFUSU9OVFhfQ09ERUNPTkUpO1xuICAgIG9wZXJhdGlvblR4LnNldENvZGVjSUQoY29kZWNJRF96ZXJvKVxuICAgIGV4cGVjdChvcGVyYXRpb25UeC5nZXRDb2RlY0lEKCkpLnRvQmUoY29kZWNJRF96ZXJvKTtcbiAgICBleHBlY3Qob3BlcmF0aW9uVHguZ2V0VHlwZUlEKCkpLnRvQmUoQVZNQ29uc3RhbnRzLk9QRVJBVElPTlRYKTtcbiAgfSk7XG5cbiAgdGVzdChcIkludmFsaWQgT3BlcmF0aW9uVHggY29kZWNJRFwiLCAoKTogdm9pZCA9PiB7XG4gICAgY29uc3Qgb3BlcmF0aW9uVHg6IE9wZXJhdGlvblR4ID0gbmV3IE9wZXJhdGlvblR4KCk7XG4gICAgZXhwZWN0KCgpID0+IHtcbiAgICAgIG9wZXJhdGlvblR4LnNldENvZGVjSUQoMilcbiAgICB9KS50b1Rocm93KFwiRXJyb3IgLSBPcGVyYXRpb25UeC5zZXRDb2RlY0lEOiBpbnZhbGlkIGNvZGVjSUQuIFZhbGlkIGNvZGVjSURzIGFyZSAwIGFuZCAxLlwiKTtcbiAgfSk7XG5cbiAgdGVzdChcIkltcG9ydFR4IGNvZGVjSURzXCIsICgpID0+IHtcbiAgICBjb25zdCBpbXBvcnRUeDogSW1wb3J0VHggPSBuZXcgSW1wb3J0VHgoKTtcbiAgICBleHBlY3QoaW1wb3J0VHguZ2V0Q29kZWNJRCgpKS50b0JlKGNvZGVjSURfemVybyk7XG4gICAgZXhwZWN0KGltcG9ydFR4LmdldFR5cGVJRCgpKS50b0JlKEFWTUNvbnN0YW50cy5JTVBPUlRUWCk7XG4gICAgaW1wb3J0VHguc2V0Q29kZWNJRChjb2RlY0lEX29uZSlcbiAgICBleHBlY3QoaW1wb3J0VHguZ2V0Q29kZWNJRCgpKS50b0JlKGNvZGVjSURfb25lKTtcbiAgICBleHBlY3QoaW1wb3J0VHguZ2V0VHlwZUlEKCkpLnRvQmUoQVZNQ29uc3RhbnRzLklNUE9SVFRYX0NPREVDT05FKTtcbiAgICBpbXBvcnRUeC5zZXRDb2RlY0lEKGNvZGVjSURfemVybylcbiAgICBleHBlY3QoaW1wb3J0VHguZ2V0Q29kZWNJRCgpKS50b0JlKGNvZGVjSURfemVybyk7XG4gICAgZXhwZWN0KGltcG9ydFR4LmdldFR5cGVJRCgpKS50b0JlKEFWTUNvbnN0YW50cy5JTVBPUlRUWCk7XG4gIH0pO1xuXG4gIHRlc3QoXCJJbnZhbGlkIEltcG9ydFR4IGNvZGVjSURcIiwgKCk6IHZvaWQgPT4ge1xuICAgIGNvbnN0IGltcG9ydFR4OiBJbXBvcnRUeCA9IG5ldyBJbXBvcnRUeCgpO1xuICAgIGV4cGVjdCgoKSA9PiB7XG4gICAgICBpbXBvcnRUeC5zZXRDb2RlY0lEKDIpXG4gICAgfSkudG9UaHJvdyhcIkVycm9yIC0gSW1wb3J0VHguc2V0Q29kZWNJRDogaW52YWxpZCBjb2RlY0lELiBWYWxpZCBjb2RlY0lEcyBhcmUgMCBhbmQgMS5cIik7XG4gIH0pO1xuXG4gIHRlc3QoXCJFeHBvcnRUeCBjb2RlY0lEc1wiLCAoKSA9PiB7XG4gICAgY29uc3QgZXhwb3J0VHg6IEV4cG9ydFR4ID0gbmV3IEV4cG9ydFR4KCk7XG4gICAgZXhwZWN0KGV4cG9ydFR4LmdldENvZGVjSUQoKSkudG9CZShjb2RlY0lEX3plcm8pO1xuICAgIGV4cGVjdChleHBvcnRUeC5nZXRUeXBlSUQoKSkudG9CZShBVk1Db25zdGFudHMuRVhQT1JUVFgpO1xuICAgIGV4cG9ydFR4LnNldENvZGVjSUQoY29kZWNJRF9vbmUpXG4gICAgZXhwZWN0KGV4cG9ydFR4LmdldENvZGVjSUQoKSkudG9CZShjb2RlY0lEX29uZSk7XG4gICAgZXhwZWN0KGV4cG9ydFR4LmdldFR5cGVJRCgpKS50b0JlKEFWTUNvbnN0YW50cy5FWFBPUlRUWF9DT0RFQ09ORSk7XG4gICAgZXhwb3J0VHguc2V0Q29kZWNJRChjb2RlY0lEX3plcm8pXG4gICAgZXhwZWN0KGV4cG9ydFR4LmdldENvZGVjSUQoKSkudG9CZShjb2RlY0lEX3plcm8pO1xuICAgIGV4cGVjdChleHBvcnRUeC5nZXRUeXBlSUQoKSkudG9CZShBVk1Db25zdGFudHMuRVhQT1JUVFgpO1xuICB9KTtcblxuICB0ZXN0KFwiSW52YWxpZCBFeHBvcnRUeCBjb2RlY0lEXCIsICgpOiB2b2lkID0+IHtcbiAgICBjb25zdCBleHBvcnRUeDogRXhwb3J0VHggPSBuZXcgRXhwb3J0VHgoKTtcbiAgICBleHBlY3QoKCkgPT4ge1xuICAgICAgZXhwb3J0VHguc2V0Q29kZWNJRCgyKVxuICAgIH0pLnRvVGhyb3coXCJFcnJvciAtIEV4cG9ydFR4LnNldENvZGVjSUQ6IGludmFsaWQgY29kZWNJRC4gVmFsaWQgY29kZWNJRHMgYXJlIDAgYW5kIDEuXCIpO1xuICB9KTtcblxuICB0ZXN0KCdDcmVhdGUgc21hbGwgQmFzZVR4IHRoYXQgaXMgR29vc2UgRWdnIFR4JywgYXN5bmMgKCkgPT4ge1xuICAgIGNvbnN0IGJpbnRvb2xzOiBCaW5Ub29scyA9IEJpblRvb2xzLmdldEluc3RhbmNlKCk7XG4gICAgY29uc3Qgb3V0czpUcmFuc2ZlcmFibGVPdXRwdXRbXSA9IFtdO1xuICAgIGNvbnN0IGluczpUcmFuc2ZlcmFibGVJbnB1dFtdID0gW107XG4gICAgY29uc3Qgb3V0cHV0QW10OkJOID0gbmV3IEJOKFwiMjY2XCIpO1xuICAgIGNvbnN0IG91dHB1dDpTRUNQVHJhbnNmZXJPdXRwdXQgPSBuZXcgU0VDUFRyYW5zZmVyT3V0cHV0KG91dHB1dEFtdCwgYWRkcnMxLCBuZXcgQk4oMCksIDEpO1xuICAgIGNvbnN0IHRyYW5zZmVyYWJsZU91dHB1dDpUcmFuc2ZlcmFibGVPdXRwdXQgPSBuZXcgVHJhbnNmZXJhYmxlT3V0cHV0KGF2YXhBc3NldElELCBvdXRwdXQpO1xuICAgIG91dHMucHVzaCh0cmFuc2ZlcmFibGVPdXRwdXQpO1xuICAgIGNvbnN0IGlucHV0QW10OkJOID0gbmV3IEJOKFwiNDAwXCIpO1xuICAgIGNvbnN0IGlucHV0OlNFQ1BUcmFuc2ZlcklucHV0ID0gbmV3IFNFQ1BUcmFuc2ZlcklucHV0KGlucHV0QW10KTtcbiAgICBpbnB1dC5hZGRTaWduYXR1cmVJZHgoMCwgYWRkcnMxWzBdKTtcbiAgICBjb25zdCB0eGlkOkJ1ZmZlciA9IGJpbnRvb2xzLmNiNThEZWNvZGUoXCJuOFhINUpZMUVYNVZZcURlQWhCNFpkNEdLeGk5VU5ReTZvUHBNc0NBajFRNnhraWlMXCIpO1xuICAgIGNvbnN0IG91dHB1dEluZGV4OkJ1ZmZlciA9IEJ1ZmZlci5mcm9tKGJpbnRvb2xzLmZyb21CTlRvQnVmZmVyKG5ldyBCTigwKSwgNCkpO1xuICAgIGNvbnN0IHRyYW5zZmVyYWJsZUlucHV0OlRyYW5zZmVyYWJsZUlucHV0ID0gbmV3IFRyYW5zZmVyYWJsZUlucHV0KHR4aWQsIG91dHB1dEluZGV4LCBhdmF4QXNzZXRJRCwgaW5wdXQpO1xuICAgIGlucy5wdXNoKHRyYW5zZmVyYWJsZUlucHV0KTtcbiAgICBjb25zdCBiYXNlVHg6QmFzZVR4ID0gbmV3IEJhc2VUeChuZXRpZCwgYmxvY2tjaGFpbklELCBvdXRzLCBpbnMpO1xuICAgIGNvbnN0IHVuc2lnbmVkVHg6VW5zaWduZWRUeCA9IG5ldyBVbnNpZ25lZFR4KGJhc2VUeCk7XG4gICAgZXhwZWN0KGF3YWl0IGFwaS5jaGVja0dvb3NlRWdnKHVuc2lnbmVkVHgpKS50b0JlKHRydWUpO1xuICB9KTtcblxuICB0ZXN0KCdjb25maXJtIGlucHV0VG90YWwsIG91dHB1dFRvdGFsIGFuZCBmZWUgYXJlIGNvcnJlY3QnLCBhc3luYyAoKSA9PiB7XG4gICAgY29uc3QgYmludG9vbHM6IEJpblRvb2xzID0gQmluVG9vbHMuZ2V0SW5zdGFuY2UoKTtcbiAgICAvLyBBVkFYIGFzc2V0SURcbiAgICBjb25zdCBhc3NldElEOkJ1ZmZlciA9IGJpbnRvb2xzLmNiNThEZWNvZGUoXCJuOFhINUpZMUVYNVZZcURlQWhCNFpkNEdLeGk5VU5ReTZvUHBNc0NBajFRNnhraWlMXCIpO1xuICAgIGNvbnN0IG91dHM6VHJhbnNmZXJhYmxlT3V0cHV0W10gPSBbXTtcbiAgICBjb25zdCBpbnM6VHJhbnNmZXJhYmxlSW5wdXRbXSA9IFtdO1xuICAgIGNvbnN0IG91dHB1dEFtdDpCTiA9IG5ldyBCTihcIjI2NlwiKTtcbiAgICBjb25zdCBvdXRwdXQ6U0VDUFRyYW5zZmVyT3V0cHV0ID0gbmV3IFNFQ1BUcmFuc2Zlck91dHB1dChvdXRwdXRBbXQsIGFkZHJzMSwgbmV3IEJOKDApLCAxKTtcbiAgICBjb25zdCB0cmFuc2ZlcmFibGVPdXRwdXQ6VHJhbnNmZXJhYmxlT3V0cHV0ID0gbmV3IFRyYW5zZmVyYWJsZU91dHB1dChhc3NldElELCBvdXRwdXQpO1xuICAgIG91dHMucHVzaCh0cmFuc2ZlcmFibGVPdXRwdXQpO1xuICAgIGNvbnN0IGlucHV0QW10OkJOID0gbmV3IEJOKFwiNDAwXCIpO1xuICAgIGNvbnN0IGlucHV0OlNFQ1BUcmFuc2ZlcklucHV0ID0gbmV3IFNFQ1BUcmFuc2ZlcklucHV0KGlucHV0QW10KTtcbiAgICBpbnB1dC5hZGRTaWduYXR1cmVJZHgoMCwgYWRkcnMxWzBdKTtcbiAgICBjb25zdCB0eGlkOkJ1ZmZlciA9IGJpbnRvb2xzLmNiNThEZWNvZGUoXCJuOFhINUpZMUVYNVZZcURlQWhCNFpkNEdLeGk5VU5ReTZvUHBNc0NBajFRNnhraWlMXCIpO1xuICAgIGNvbnN0IG91dHB1dEluZGV4OkJ1ZmZlciA9IEJ1ZmZlci5mcm9tKGJpbnRvb2xzLmZyb21CTlRvQnVmZmVyKG5ldyBCTigwKSwgNCkpO1xuICAgIGNvbnN0IHRyYW5zZmVyYWJsZUlucHV0OlRyYW5zZmVyYWJsZUlucHV0ID0gbmV3IFRyYW5zZmVyYWJsZUlucHV0KHR4aWQsIG91dHB1dEluZGV4LCBhc3NldElELCBpbnB1dCk7XG4gICAgaW5zLnB1c2godHJhbnNmZXJhYmxlSW5wdXQpO1xuICAgIGNvbnN0IGJhc2VUeDpCYXNlVHggPSBuZXcgQmFzZVR4KG5ldGlkLCBibG9ja2NoYWluSUQsIG91dHMsIGlucyk7XG4gICAgY29uc3QgdW5zaWduZWRUeDpVbnNpZ25lZFR4ID0gbmV3IFVuc2lnbmVkVHgoYmFzZVR4KTtcbiAgICBjb25zdCBpbnB1dFRvdGFsOkJOID0gdW5zaWduZWRUeC5nZXRJbnB1dFRvdGFsKGFzc2V0SUQpO1xuICAgIGNvbnN0IG91dHB1dFRvdGFsOkJOID0gdW5zaWduZWRUeC5nZXRPdXRwdXRUb3RhbChhc3NldElEKTtcbiAgICBjb25zdCBidXJuOkJOID0gdW5zaWduZWRUeC5nZXRCdXJuKGFzc2V0SUQpO1xuICAgIGV4cGVjdChpbnB1dFRvdGFsLnRvTnVtYmVyKCkpLnRvRXF1YWwobmV3IEJOKDQwMCkudG9OdW1iZXIoKSk7XG4gICAgZXhwZWN0KG91dHB1dFRvdGFsLnRvTnVtYmVyKCkpLnRvRXF1YWwobmV3IEJOKDI2NikudG9OdW1iZXIoKSk7XG4gICAgZXhwZWN0KGJ1cm4udG9OdW1iZXIoKSkudG9FcXVhbChuZXcgQk4oMTM0KS50b051bWJlcigpKTtcbiAgfSk7XG5cblxuICB0ZXN0KFwiQ3JlYXRlIHNtYWxsIEJhc2VUeCB0aGF0IGlzbid0IEdvb3NlIEVnZyBUeFwiLCBhc3luYyAoKSA9PiB7XG4gICAgY29uc3QgYmludG9vbHM6IEJpblRvb2xzID0gQmluVG9vbHMuZ2V0SW5zdGFuY2UoKTtcbiAgICBjb25zdCBvdXRzOlRyYW5zZmVyYWJsZU91dHB1dFtdID0gW107XG4gICAgY29uc3QgaW5zOlRyYW5zZmVyYWJsZUlucHV0W10gPSBbXTtcbiAgICBjb25zdCBvdXRwdXRBbXQ6Qk4gPSBuZXcgQk4oXCIyNjdcIik7XG4gICAgY29uc3Qgb3V0cHV0OlNFQ1BUcmFuc2Zlck91dHB1dCA9IG5ldyBTRUNQVHJhbnNmZXJPdXRwdXQob3V0cHV0QW10LCBhZGRyczEsIG5ldyBCTigwKSwgMSk7XG4gICAgY29uc3QgdHJhbnNmZXJhYmxlT3V0cHV0OlRyYW5zZmVyYWJsZU91dHB1dCA9IG5ldyBUcmFuc2ZlcmFibGVPdXRwdXQoYXZheEFzc2V0SUQsIG91dHB1dCk7XG4gICAgb3V0cy5wdXNoKHRyYW5zZmVyYWJsZU91dHB1dCk7XG4gICAgY29uc3QgaW5wdXRBbXQ6Qk4gPSBuZXcgQk4oXCI0MDBcIik7XG4gICAgY29uc3QgaW5wdXQ6U0VDUFRyYW5zZmVySW5wdXQgPSBuZXcgU0VDUFRyYW5zZmVySW5wdXQoaW5wdXRBbXQpO1xuICAgIGlucHV0LmFkZFNpZ25hdHVyZUlkeCgwLCBhZGRyczFbMF0pO1xuICAgIGNvbnN0IHR4aWQ6QnVmZmVyID0gYmludG9vbHMuY2I1OERlY29kZShcIm44WEg1SlkxRVg1VllxRGVBaEI0WmQ0R0t4aTlVTlF5Nm9QcE1zQ0FqMVE2eGtpaUxcIik7XG4gICAgY29uc3Qgb3V0cHV0SW5kZXg6QnVmZmVyID0gQnVmZmVyLmZyb20oYmludG9vbHMuZnJvbUJOVG9CdWZmZXIobmV3IEJOKDApLCA0KSk7XG4gICAgY29uc3QgdHJhbnNmZXJhYmxlSW5wdXQ6VHJhbnNmZXJhYmxlSW5wdXQgPSBuZXcgVHJhbnNmZXJhYmxlSW5wdXQodHhpZCwgb3V0cHV0SW5kZXgsIGF2YXhBc3NldElELCBpbnB1dCk7XG4gICAgaW5zLnB1c2godHJhbnNmZXJhYmxlSW5wdXQpO1xuICAgIGNvbnN0IGJhc2VUeDpCYXNlVHggPSBuZXcgQmFzZVR4KG5ldGlkLCBibG9ja2NoYWluSUQsIG91dHMsIGlucyk7XG4gICAgY29uc3QgdW5zaWduZWRUeDpVbnNpZ25lZFR4ID0gbmV3IFVuc2lnbmVkVHgoYmFzZVR4KTtcbiAgICBleHBlY3QoYXdhaXQgYXBpLmNoZWNrR29vc2VFZ2codW5zaWduZWRUeCkpLnRvQmUodHJ1ZSk7XG4gIH0pO1xuXG4gIHRlc3QoJ0NyZWF0ZSBsYXJnZSBCYXNlVHggdGhhdCBpcyBHb29zZSBFZ2cgVHgnLCBhc3luYyAoKSA9PiB7XG4gICAgY29uc3QgYmludG9vbHM6IEJpblRvb2xzID0gQmluVG9vbHMuZ2V0SW5zdGFuY2UoKTtcbiAgICBjb25zdCBvdXRzOlRyYW5zZmVyYWJsZU91dHB1dFtdID0gW107XG4gICAgY29uc3QgaW5zOlRyYW5zZmVyYWJsZUlucHV0W10gPSBbXTtcbiAgICBjb25zdCBvdXRwdXRBbXQ6Qk4gPSBuZXcgQk4oXCI2MDk1NTU1MDAwMDBcIik7XG4gICAgY29uc3Qgb3V0cHV0OlNFQ1BUcmFuc2Zlck91dHB1dCA9IG5ldyBTRUNQVHJhbnNmZXJPdXRwdXQob3V0cHV0QW10LCBhZGRyczEsIG5ldyBCTigwKSwgMSk7XG4gICAgY29uc3QgdHJhbnNmZXJhYmxlT3V0cHV0OlRyYW5zZmVyYWJsZU91dHB1dCA9IG5ldyBUcmFuc2ZlcmFibGVPdXRwdXQoYXZheEFzc2V0SUQsIG91dHB1dCk7XG4gICAgb3V0cy5wdXNoKHRyYW5zZmVyYWJsZU91dHB1dCk7XG4gICAgY29uc3QgaW5wdXRBbXQ6Qk4gPSBuZXcgQk4oXCI0NTAwMDAwMDAwMDAwMDAwMFwiKTtcbiAgICBjb25zdCBpbnB1dDpTRUNQVHJhbnNmZXJJbnB1dCA9IG5ldyBTRUNQVHJhbnNmZXJJbnB1dChpbnB1dEFtdCk7XG4gICAgaW5wdXQuYWRkU2lnbmF0dXJlSWR4KDAsIGFkZHJzMVswXSk7XG4gICAgY29uc3QgdHhpZDpCdWZmZXIgPSBiaW50b29scy5jYjU4RGVjb2RlKFwibjhYSDVKWTFFWDVWWXFEZUFoQjRaZDRHS3hpOVVOUXk2b1BwTXNDQWoxUTZ4a2lpTFwiKTtcbiAgICBjb25zdCBvdXRwdXRJbmRleDpCdWZmZXIgPSBCdWZmZXIuZnJvbShiaW50b29scy5mcm9tQk5Ub0J1ZmZlcihuZXcgQk4oMCksIDQpKTtcbiAgICBjb25zdCB0cmFuc2ZlcmFibGVJbnB1dDpUcmFuc2ZlcmFibGVJbnB1dCA9IG5ldyBUcmFuc2ZlcmFibGVJbnB1dCh0eGlkLCBvdXRwdXRJbmRleCwgYXZheEFzc2V0SUQsIGlucHV0KTtcbiAgICBpbnMucHVzaCh0cmFuc2ZlcmFibGVJbnB1dCk7XG4gICAgY29uc3QgYmFzZVR4OkJhc2VUeCA9IG5ldyBCYXNlVHgobmV0aWQsIGJsb2NrY2hhaW5JRCwgb3V0cywgaW5zKTtcbiAgICBjb25zdCB1bnNpZ25lZFR4OlVuc2lnbmVkVHggPSBuZXcgVW5zaWduZWRUeChiYXNlVHgpO1xuICAgIGV4cGVjdChhd2FpdCBhcGkuY2hlY2tHb29zZUVnZyh1bnNpZ25lZFR4KSkudG9CZShmYWxzZSk7XG4gIH0pO1xuXG4gIHRlc3QoXCJDcmVhdGUgbGFyZ2UgQmFzZVR4IHRoYXQgaXNuJ3QgR29vc2UgRWdnIFR4XCIsIGFzeW5jICgpID0+IHtcbiAgICBjb25zdCBiaW50b29sczogQmluVG9vbHMgPSBCaW5Ub29scy5nZXRJbnN0YW5jZSgpO1xuICAgIGNvbnN0IG91dHM6VHJhbnNmZXJhYmxlT3V0cHV0W10gPSBbXTtcbiAgICBjb25zdCBpbnM6VHJhbnNmZXJhYmxlSW5wdXRbXSA9IFtdO1xuICAgIGNvbnN0IG91dHB1dEFtdDpCTiA9IG5ldyBCTihcIjQ0OTk1NjA5NTU1NTAwMDAwXCIpO1xuICAgIGNvbnN0IG91dHB1dDpTRUNQVHJhbnNmZXJPdXRwdXQgPSBuZXcgU0VDUFRyYW5zZmVyT3V0cHV0KG91dHB1dEFtdCwgYWRkcnMxLCBuZXcgQk4oMCksIDEpO1xuICAgIGNvbnN0IHRyYW5zZmVyYWJsZU91dHB1dDpUcmFuc2ZlcmFibGVPdXRwdXQgPSBuZXcgVHJhbnNmZXJhYmxlT3V0cHV0KGF2YXhBc3NldElELCBvdXRwdXQpO1xuICAgIG91dHMucHVzaCh0cmFuc2ZlcmFibGVPdXRwdXQpO1xuICAgIGNvbnN0IGlucHV0QW10OkJOID0gbmV3IEJOKFwiNDUwMDAwMDAwMDAwMDAwMDBcIik7XG4gICAgY29uc3QgaW5wdXQ6U0VDUFRyYW5zZmVySW5wdXQgPSBuZXcgU0VDUFRyYW5zZmVySW5wdXQoaW5wdXRBbXQpO1xuICAgIGlucHV0LmFkZFNpZ25hdHVyZUlkeCgwLCBhZGRyczFbMF0pO1xuICAgIGNvbnN0IHR4aWQ6QnVmZmVyID0gYmludG9vbHMuY2I1OERlY29kZShcIm44WEg1SlkxRVg1VllxRGVBaEI0WmQ0R0t4aTlVTlF5Nm9QcE1zQ0FqMVE2eGtpaUxcIik7XG4gICAgY29uc3Qgb3V0cHV0SW5kZXg6QnVmZmVyID0gQnVmZmVyLmZyb20oYmludG9vbHMuZnJvbUJOVG9CdWZmZXIobmV3IEJOKDApLCA0KSk7XG4gICAgY29uc3QgdHJhbnNmZXJhYmxlSW5wdXQ6VHJhbnNmZXJhYmxlSW5wdXQgPSBuZXcgVHJhbnNmZXJhYmxlSW5wdXQodHhpZCwgb3V0cHV0SW5kZXgsIGF2YXhBc3NldElELCBpbnB1dCk7XG4gICAgaW5zLnB1c2godHJhbnNmZXJhYmxlSW5wdXQpO1xuICAgIGNvbnN0IGJhc2VUeDpCYXNlVHggPSBuZXcgQmFzZVR4KG5ldGlkLCBibG9ja2NoYWluSUQsIG91dHMsIGlucyk7XG4gICAgY29uc3QgdW5zaWduZWRUeDpVbnNpZ25lZFR4ID0gbmV3IFVuc2lnbmVkVHgoYmFzZVR4KTtcbiAgICBleHBlY3QoYXdhaXQgYXBpLmNoZWNrR29vc2VFZ2codW5zaWduZWRUeCkpLnRvQmUodHJ1ZSk7XG4gIH0pO1xuXG4gIHRlc3QoJ0NyZWF0aW9uIFVuc2lnbmVkVHgnLCAoKSA9PiB7XG4gICAgY29uc3QgYmFzZVR4OkJhc2VUeCA9IG5ldyBCYXNlVHgobmV0aWQsIGJsb2NrY2hhaW5JRCwgb3V0cHV0cywgaW5wdXRzKTtcbiAgICBjb25zdCB0eHU6VW5zaWduZWRUeCA9IG5ldyBVbnNpZ25lZFR4KGJhc2VUeCk7XG4gICAgY29uc3QgdHhpbnM6QXJyYXk8VHJhbnNmZXJhYmxlSW5wdXQ+ID0gdHh1LmdldFRyYW5zYWN0aW9uKCkuZ2V0SW5zKCk7XG4gICAgY29uc3QgdHhvdXRzOkFycmF5PFRyYW5zZmVyYWJsZU91dHB1dD4gPSB0eHUuZ2V0VHJhbnNhY3Rpb24oKS5nZXRPdXRzKCk7XG4gICAgZXhwZWN0KHR4aW5zLmxlbmd0aCkudG9CZShpbnB1dHMubGVuZ3RoKTtcbiAgICBleHBlY3QodHhvdXRzLmxlbmd0aCkudG9CZShvdXRwdXRzLmxlbmd0aCk7XG5cbiAgICBleHBlY3QodHh1LmdldFRyYW5zYWN0aW9uKCkuZ2V0VHhUeXBlKCkpLnRvQmUoMCk7XG4gICAgZXhwZWN0KHR4dS5nZXRUcmFuc2FjdGlvbigpLmdldE5ldHdvcmtJRCgpKS50b0JlKDEyMzQ1KTtcbiAgICBleHBlY3QodHh1LmdldFRyYW5zYWN0aW9uKCkuZ2V0QmxvY2tjaGFpbklEKCkudG9TdHJpbmcoJ2hleCcpKS50b0JlKGJsb2NrY2hhaW5JRC50b1N0cmluZygnaGV4JykpO1xuXG4gICAgbGV0IGE6QXJyYXk8c3RyaW5nPiA9IFtdO1xuICAgIGxldCBiOkFycmF5PHN0cmluZz4gPSBbXTtcbiAgICBmb3IgKGxldCBpOm51bWJlciA9IDA7IGkgPCB0eGlucy5sZW5ndGg7IGkrKykge1xuICAgICAgYS5wdXNoKHR4aW5zW2ldLnRvU3RyaW5nKCkpO1xuICAgICAgYi5wdXNoKGlucHV0c1tpXS50b1N0cmluZygpKTtcbiAgICB9XG4gICAgZXhwZWN0KEpTT04uc3RyaW5naWZ5KGEuc29ydCgpKSkudG9CZShKU09OLnN0cmluZ2lmeShiLnNvcnQoKSkpO1xuXG4gICAgYSA9IFtdO1xuICAgIGIgPSBbXTtcblxuICAgIGZvciAobGV0IGk6bnVtYmVyID0gMDsgaSA8IHR4b3V0cy5sZW5ndGg7IGkrKykge1xuICAgICAgYS5wdXNoKHR4b3V0c1tpXS50b1N0cmluZygpKTtcbiAgICAgIGIucHVzaChvdXRwdXRzW2ldLnRvU3RyaW5nKCkpO1xuICAgIH1cbiAgICBleHBlY3QoSlNPTi5zdHJpbmdpZnkoYS5zb3J0KCkpKS50b0JlKEpTT04uc3RyaW5naWZ5KGIuc29ydCgpKSk7XG5cbiAgICBjb25zdCB0eHVuZXc6VW5zaWduZWRUeCA9IG5ldyBVbnNpZ25lZFR4KCk7XG4gICAgdHh1bmV3LmZyb21CdWZmZXIodHh1LnRvQnVmZmVyKCkpO1xuICAgIGV4cGVjdCh0eHVuZXcudG9CdWZmZXIoKS50b1N0cmluZygnaGV4JykpLnRvQmUodHh1LnRvQnVmZmVyKCkudG9TdHJpbmcoJ2hleCcpKTtcbiAgICBleHBlY3QodHh1bmV3LnRvU3RyaW5nKCkpLnRvQmUodHh1LnRvU3RyaW5nKCkpO1xuICB9KTtcblxuICB0ZXN0KCdDcmVhdGlvbiBVbnNpZ25lZFR4IENoZWNrIEFtb3VudCcsICgpID0+IHtcbiAgICBleHBlY3QoKCkgPT4ge1xuICAgICAgc2V0LmJ1aWxkQmFzZVR4KFxuICAgICAgICBuZXRpZCwgYmxvY2tjaGFpbklELFxuICAgICAgICBPTkVBVkFYLm11bChuZXcgQk4oYW1udCAqIDEwMDAwKSksIGFzc2V0SUQsXG4gICAgICAgIGFkZHJzMywgYWRkcnMxLCBhZGRyczEsIFxuICAgICAgKTtcbiAgICB9KS50b1Rocm93KCk7XG4gIH0pO1xuXG4gIHRlc3QoJ0NyZWF0ZUFzc2V0VFgnLCAoKSA9PiB7XG4gICAgY29uc3Qgc2VjcGJhc2UxOlNFQ1BUcmFuc2Zlck91dHB1dCA9IG5ldyBTRUNQVHJhbnNmZXJPdXRwdXQobmV3IEJOKDc3NyksIGFkZHJzMywgbG9ja3RpbWUsIDEpO1xuICAgIGNvbnN0IHNlY3BiYXNlMjpTRUNQVHJhbnNmZXJPdXRwdXQgPSBuZXcgU0VDUFRyYW5zZmVyT3V0cHV0KG5ldyBCTig4ODgpLCBhZGRyczIsIGxvY2t0aW1lLCAxKTtcbiAgICBjb25zdCBzZWNwYmFzZTM6U0VDUFRyYW5zZmVyT3V0cHV0ID0gbmV3IFNFQ1BUcmFuc2Zlck91dHB1dChuZXcgQk4oOTk5KSwgYWRkcnMyLCBsb2NrdGltZSwgMSk7XG4gICAgY29uc3QgaW5pdGlhbFN0YXRlOkluaXRpYWxTdGF0ZXMgPSBuZXcgSW5pdGlhbFN0YXRlcygpO1xuICAgIGluaXRpYWxTdGF0ZS5hZGRPdXRwdXQoc2VjcGJhc2UxLCBBVk1Db25zdGFudHMuU0VDUEZYSUQpO1xuICAgIGluaXRpYWxTdGF0ZS5hZGRPdXRwdXQoc2VjcGJhc2UyLCBBVk1Db25zdGFudHMuU0VDUEZYSUQpO1xuICAgIGluaXRpYWxTdGF0ZS5hZGRPdXRwdXQoc2VjcGJhc2UzLCBBVk1Db25zdGFudHMuU0VDUEZYSUQpO1xuICAgIGNvbnN0IG5hbWU6c3RyaW5nID0gJ1JpY2tjb2luIGlzIHRoZSBtb3N0IGludGVsbGlnZW50IGNvaW4nO1xuICAgIGNvbnN0IHN5bWJvbDpzdHJpbmcgPSAnUklDSyc7XG4gICAgY29uc3QgZGVub21pbmF0aW9uOm51bWJlciA9IDk7XG4gICAgY29uc3QgdHh1OkNyZWF0ZUFzc2V0VHggPSBuZXcgQ3JlYXRlQXNzZXRUeChuZXRpZCwgYmxvY2tjaGFpbklELCBvdXRwdXRzLCBpbnB1dHMsIG5ldyBVVEY4UGF5bG9hZChcImhlbGxvIHdvcmxkXCIpLmdldFBheWxvYWQoKSwgbmFtZSwgc3ltYm9sLCBkZW5vbWluYXRpb24sIGluaXRpYWxTdGF0ZSk7XG4gICAgY29uc3QgdHhpbnM6QXJyYXk8VHJhbnNmZXJhYmxlSW5wdXQ+ID0gdHh1LmdldElucygpO1xuICAgIGNvbnN0IHR4b3V0czpBcnJheTxUcmFuc2ZlcmFibGVPdXRwdXQ+ID0gdHh1LmdldE91dHMoKTtcbiAgICBjb25zdCBpbml0U3RhdGU6SW5pdGlhbFN0YXRlcyA9IHR4dS5nZXRJbml0aWFsU3RhdGVzKCk7XG4gICAgZXhwZWN0KHR4aW5zLmxlbmd0aCkudG9CZShpbnB1dHMubGVuZ3RoKTtcbiAgICBleHBlY3QodHhvdXRzLmxlbmd0aCkudG9CZShvdXRwdXRzLmxlbmd0aCk7XG4gICAgZXhwZWN0KGluaXRTdGF0ZS50b0J1ZmZlcigpLnRvU3RyaW5nKCdoZXgnKSkudG9CZShpbml0aWFsU3RhdGUudG9CdWZmZXIoKS50b1N0cmluZygnaGV4JykpO1xuXG4gICAgZXhwZWN0KHR4dS5nZXRUeFR5cGUoKSkudG9CZShBVk1Db25zdGFudHMuQ1JFQVRFQVNTRVRUWCk7XG4gICAgZXhwZWN0KHR4dS5nZXROZXR3b3JrSUQoKSkudG9CZSgxMjM0NSk7XG4gICAgZXhwZWN0KHR4dS5nZXRCbG9ja2NoYWluSUQoKS50b1N0cmluZygnaGV4JykpLnRvQmUoYmxvY2tjaGFpbklELnRvU3RyaW5nKCdoZXgnKSk7XG5cbiAgICBleHBlY3QodHh1LmdldE5hbWUoKSkudG9CZShuYW1lKTtcbiAgICBleHBlY3QodHh1LmdldFN5bWJvbCgpKS50b0JlKHN5bWJvbCk7XG4gICAgZXhwZWN0KHR4dS5nZXREZW5vbWluYXRpb24oKSkudG9CZShkZW5vbWluYXRpb24pO1xuICAgIGV4cGVjdCh0eHUuZ2V0RGVub21pbmF0aW9uQnVmZmVyKCkucmVhZFVJbnQ4KDApKS50b0JlKGRlbm9taW5hdGlvbik7XG5cbiAgICBsZXQgYTpBcnJheTxzdHJpbmc+ID0gW107XG4gICAgbGV0IGI6QXJyYXk8c3RyaW5nPiA9IFtdO1xuICAgIGZvciAobGV0IGk6bnVtYmVyID0gMDsgaSA8IHR4aW5zLmxlbmd0aDsgaSsrKSB7XG4gICAgICBhLnB1c2godHhpbnNbaV0udG9TdHJpbmcoKSk7XG4gICAgICBiLnB1c2goaW5wdXRzW2ldLnRvU3RyaW5nKCkpO1xuICAgIH1cbiAgICBleHBlY3QoSlNPTi5zdHJpbmdpZnkoYS5zb3J0KCkpKS50b0JlKEpTT04uc3RyaW5naWZ5KGIuc29ydCgpKSk7XG5cbiAgICBhID0gW107XG4gICAgYiA9IFtdO1xuXG4gICAgZm9yIChsZXQgaTpudW1iZXIgPSAwOyBpIDwgdHhvdXRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBhLnB1c2godHhvdXRzW2ldLnRvU3RyaW5nKCkpO1xuICAgICAgYi5wdXNoKG91dHB1dHNbaV0udG9TdHJpbmcoKSk7XG4gICAgfVxuICAgIGV4cGVjdChKU09OLnN0cmluZ2lmeShhLnNvcnQoKSkpLnRvQmUoSlNPTi5zdHJpbmdpZnkoYi5zb3J0KCkpKTtcblxuICAgIGNvbnN0IHR4dW5ldzpDcmVhdGVBc3NldFR4ID0gbmV3IENyZWF0ZUFzc2V0VHgoKTtcbiAgICB0eHVuZXcuZnJvbUJ1ZmZlcih0eHUudG9CdWZmZXIoKSk7XG4gICAgZXhwZWN0KHR4dW5ldy50b0J1ZmZlcigpLnRvU3RyaW5nKCdoZXgnKSkudG9CZSh0eHUudG9CdWZmZXIoKS50b1N0cmluZygnaGV4JykpO1xuICAgIGV4cGVjdCh0eHVuZXcudG9TdHJpbmcoKSkudG9CZSh0eHUudG9TdHJpbmcoKSk7XG4gIH0pO1xuXG4gIHRlc3QoJ0NyZWF0aW9uIE9wZXJhdGlvblR4JywgKCkgPT4ge1xuICAgIGNvbnN0IG9wdHg6T3BlcmF0aW9uVHggPSBuZXcgT3BlcmF0aW9uVHgoXG4gICAgICBuZXRpZCwgYmxvY2tjaGFpbklELCBvdXRwdXRzLCBpbnB1dHMsIG5ldyBVVEY4UGF5bG9hZChcImhlbGxvIHdvcmxkXCIpLmdldFBheWxvYWQoKSwgb3BzLFxuICAgICk7XG4gICAgY29uc3QgdHh1bmV3Ok9wZXJhdGlvblR4ID0gbmV3IE9wZXJhdGlvblR4KCk7XG4gICAgY29uc3Qgb3BidWZmOkJ1ZmZlciA9IG9wdHgudG9CdWZmZXIoKTtcbiAgICB0eHVuZXcuZnJvbUJ1ZmZlcihvcGJ1ZmYpO1xuICAgIGV4cGVjdCh0eHVuZXcudG9CdWZmZXIoKS50b1N0cmluZygnaGV4JykpLnRvQmUob3BidWZmLnRvU3RyaW5nKCdoZXgnKSk7XG4gICAgZXhwZWN0KHR4dW5ldy50b1N0cmluZygpKS50b0JlKG9wdHgudG9TdHJpbmcoKSk7XG4gICAgZXhwZWN0KG9wdHguZ2V0T3BlcmF0aW9ucygpLmxlbmd0aCkudG9CZShvcHMubGVuZ3RoKTtcbiAgfSk7XG5cbiAgdGVzdCgnQ3JlYXRpb24gSW1wb3J0VHgnLCAoKSA9PiB7XG4gICAgY29uc3QgYm9tYnR4OkltcG9ydFR4ID0gbmV3IEltcG9ydFR4KFxuICAgICAgbmV0aWQsIGJsb2NrY2hhaW5JRCwgIG91dHB1dHMsIGlucHV0cywgbmV3IFVURjhQYXlsb2FkKFwiaGVsbG8gd29ybGRcIikuZ2V0UGF5bG9hZCgpLCB1bmRlZmluZWQsIGltcG9ydEluc1xuICAgICk7XG5cbiAgICBleHBlY3QoKCkgPT4ge1xuICAgICAgYm9tYnR4LnRvQnVmZmVyKCk7XG4gICAgfSkudG9UaHJvdygpO1xuXG4gICAgY29uc3QgaW1wb3J0dHg6SW1wb3J0VHggPSBuZXcgSW1wb3J0VHgoXG4gICAgICBuZXRpZCwgYmxvY2tjaGFpbklELCAgb3V0cHV0cywgaW5wdXRzLCBuZXcgVVRGOFBheWxvYWQoXCJoZWxsbyB3b3JsZFwiKS5nZXRQYXlsb2FkKCksIGJpbnRvb2xzLmNiNThEZWNvZGUoUGxhdGZvcm1DaGFpbklEKSwgaW1wb3J0SW5zXG4gICAgKTtcbiAgICBjb25zdCB0eHVuZXc6SW1wb3J0VHggPSBuZXcgSW1wb3J0VHgoKTtcbiAgICBjb25zdCBpbXBvcnRidWZmOkJ1ZmZlciA9IGltcG9ydHR4LnRvQnVmZmVyKCk7XG4gICAgdHh1bmV3LmZyb21CdWZmZXIoaW1wb3J0YnVmZik7XG5cbiAgICBleHBlY3QodHh1bmV3LnRvQnVmZmVyKCkudG9TdHJpbmcoJ2hleCcpKS50b0JlKGltcG9ydGJ1ZmYudG9TdHJpbmcoJ2hleCcpKTtcbiAgICBleHBlY3QodHh1bmV3LnRvU3RyaW5nKCkpLnRvQmUoaW1wb3J0dHgudG9TdHJpbmcoKSk7XG4gICAgZXhwZWN0KGltcG9ydHR4LmdldEltcG9ydElucHV0cygpLmxlbmd0aCkudG9CZShpbXBvcnRJbnMubGVuZ3RoKTtcbiAgfSk7XG5cbiAgdGVzdCgnQ3JlYXRpb24gRXhwb3J0VHgnLCAoKSA9PiB7XG4gICAgY29uc3QgYm9tYnR4OkV4cG9ydFR4ID0gbmV3IEV4cG9ydFR4KFxuICAgICAgbmV0aWQsIGJsb2NrY2hhaW5JRCwgb3V0cHV0cywgaW5wdXRzLCB1bmRlZmluZWQsIHVuZGVmaW5lZCwgZXhwb3J0T3V0c1xuICAgICk7XG5cbiAgICBleHBlY3QoKCkgPT4ge1xuICAgICAgYm9tYnR4LnRvQnVmZmVyKCk7XG4gICAgfSkudG9UaHJvdygpO1xuXG4gICAgY29uc3QgZXhwb3J0dHg6RXhwb3J0VHggPSBuZXcgRXhwb3J0VHgoXG4gICAgICBuZXRpZCwgYmxvY2tjaGFpbklELCBvdXRwdXRzLCBpbnB1dHMsIHVuZGVmaW5lZCwgYmludG9vbHMuY2I1OERlY29kZShQbGF0Zm9ybUNoYWluSUQpLCBleHBvcnRPdXRzXG4gICAgKTtcbiAgICBjb25zdCB0eHVuZXc6RXhwb3J0VHggPSBuZXcgRXhwb3J0VHgoKTtcbiAgICBjb25zdCBleHBvcnRidWZmOkJ1ZmZlciA9IGV4cG9ydHR4LnRvQnVmZmVyKCk7XG4gICAgdHh1bmV3LmZyb21CdWZmZXIoZXhwb3J0YnVmZik7XG5cbiAgICBleHBlY3QodHh1bmV3LnRvQnVmZmVyKCkudG9TdHJpbmcoJ2hleCcpKS50b0JlKGV4cG9ydGJ1ZmYudG9TdHJpbmcoJ2hleCcpKTtcbiAgICBleHBlY3QodHh1bmV3LnRvU3RyaW5nKCkpLnRvQmUoZXhwb3J0dHgudG9TdHJpbmcoKSk7XG4gICAgZXhwZWN0KGV4cG9ydHR4LmdldEV4cG9ydE91dHB1dHMoKS5sZW5ndGgpLnRvQmUoZXhwb3J0T3V0cy5sZW5ndGgpO1xuICB9KTtcblxuICB0ZXN0KCdDcmVhdGlvbiBUeDEgd2l0aCBhc29mLCBsb2NrdGltZSwgdGhyZXNob2xkJywgKCkgPT4ge1xuICAgIGNvbnN0IHR4dTpVbnNpZ25lZFR4ID0gc2V0LmJ1aWxkQmFzZVR4KFxuICAgICAgbmV0aWQsIGJsb2NrY2hhaW5JRCxcbiAgICAgIG5ldyBCTig5MDAwKSwgYXNzZXRJRCwgYWRkcnMzLCBhZGRyczEsIGFkZHJzMSwgdW5kZWZpbmVkLCB1bmRlZmluZWQsIHVuZGVmaW5lZCxcbiAgICAgIFVuaXhOb3coKSwgVW5peE5vdygpLmFkZChuZXcgQk4oNTApKSwgMSxcbiAgICApO1xuICAgIGNvbnN0IHR4OlR4ID0gdHh1LnNpZ24oa2V5bWdyMSk7XG5cbiAgICBjb25zdCB0eDI6VHggPSBuZXcgVHgoKTtcbiAgICB0eDIuZnJvbVN0cmluZyh0eC50b1N0cmluZygpKTtcbiAgICBleHBlY3QodHgyLnRvQnVmZmVyKCkudG9TdHJpbmcoJ2hleCcpKS50b0JlKHR4LnRvQnVmZmVyKCkudG9TdHJpbmcoJ2hleCcpKTtcbiAgICBleHBlY3QodHgyLnRvU3RyaW5nKCkpLnRvQmUodHgudG9TdHJpbmcoKSk7XG4gIH0pO1xuICB0ZXN0KCdDcmVhdGlvbiBUeDIgd2l0aG91dCBhc29mLCBsb2NrdGltZSwgdGhyZXNob2xkJywgKCkgPT4ge1xuICAgIGNvbnN0IHR4dTpVbnNpZ25lZFR4ID0gc2V0LmJ1aWxkQmFzZVR4KFxuICAgICAgbmV0aWQsIGJsb2NrY2hhaW5JRCxcbiAgICAgIG5ldyBCTig5MDAwKSwgYXNzZXRJRCxcbiAgICAgIGFkZHJzMywgYWRkcnMxLCBhZGRyczFcbiAgICApO1xuICAgIGNvbnN0IHR4OlR4ID0gdHh1LnNpZ24oa2V5bWdyMSk7XG4gICAgY29uc3QgdHgyOlR4ID0gbmV3IFR4KCk7XG4gICAgdHgyLmZyb21CdWZmZXIodHgudG9CdWZmZXIoKSk7XG4gICAgZXhwZWN0KHR4Mi50b0J1ZmZlcigpLnRvU3RyaW5nKCdoZXgnKSkudG9CZSh0eC50b0J1ZmZlcigpLnRvU3RyaW5nKCdoZXgnKSk7XG4gICAgZXhwZWN0KHR4Mi50b1N0cmluZygpKS50b0JlKHR4LnRvU3RyaW5nKCkpO1xuICB9KTtcblxuICB0ZXN0KCdDcmVhdGlvbiBUeDMgdXNpbmcgT3BlcmF0aW9uVHgnLCAoKSA9PiB7XG4gICAgY29uc3QgdHh1OlVuc2lnbmVkVHggPSBzZXQuYnVpbGRORlRUcmFuc2ZlclR4KFxuICAgICAgbmV0aWQsIGJsb2NrY2hhaW5JRCwgXG4gICAgICBhZGRyczMsIGFkZHJzMSwgYWRkcnMyLCBuZnR1dHhvaWRzLCBuZXcgQk4oOTApLCBhdmF4QXNzZXRJRCwgdW5kZWZpbmVkLFxuICAgICAgVW5peE5vdygpLCBVbml4Tm93KCkuYWRkKG5ldyBCTig1MCkpLCAxLFxuICAgICk7XG4gICAgY29uc3QgdHg6VHggPSB0eHUuc2lnbihrZXltZ3IxKTtcbiAgICBjb25zdCB0eDI6VHggPSBuZXcgVHgoKTtcbiAgICB0eDIuZnJvbUJ1ZmZlcih0eC50b0J1ZmZlcigpKTtcbiAgICBleHBlY3QodHgyLnRvQnVmZmVyKCkudG9TdHJpbmcoJ2hleCcpKS50b0JlKHR4LnRvQnVmZmVyKCkudG9TdHJpbmcoJ2hleCcpKTtcbiAgfSk7XG5cbiAgdGVzdCgnQ3JlYXRpb24gVHg0IHVzaW5nIEltcG9ydFR4JywgKCkgPT4ge1xuICAgIGNvbnN0IHR4dTpVbnNpZ25lZFR4ID0gc2V0LmJ1aWxkSW1wb3J0VHgoXG4gICAgICBuZXRpZCwgYmxvY2tjaGFpbklELCBhZGRyczMsIGFkZHJzMSwgYWRkcnMyLCBpbXBvcnRVVFhPcywgYmludG9vbHMuY2I1OERlY29kZShQbGF0Zm9ybUNoYWluSUQpLCBuZXcgQk4oOTApLCBhc3NldElELFxuICAgICAgbmV3IFVURjhQYXlsb2FkKFwiaGVsbG8gd29ybGRcIikuZ2V0UGF5bG9hZCgpLCBVbml4Tm93KCkpO1xuICAgIGNvbnN0IHR4OlR4ID0gdHh1LnNpZ24oa2V5bWdyMSk7XG4gICAgY29uc3QgdHgyOlR4ID0gbmV3IFR4KCk7XG4gICAgdHgyLmZyb21CdWZmZXIodHgudG9CdWZmZXIoKSk7XG4gICAgZXhwZWN0KHR4Mi50b0J1ZmZlcigpLnRvU3RyaW5nKCdoZXgnKSkudG9CZSh0eC50b0J1ZmZlcigpLnRvU3RyaW5nKCdoZXgnKSk7XG4gIH0pO1xuXG4gIHRlc3QoJ0NyZWF0aW9uIFR4NSB1c2luZyBFeHBvcnRUeCcsICgpID0+IHtcbiAgICBjb25zdCB0eHU6VW5zaWduZWRUeCA9IHNldC5idWlsZEV4cG9ydFR4KFxuICAgICAgbmV0aWQsIGJsb2NrY2hhaW5JRCwgbmV3IEJOKDkwKSwgYXZheEFzc2V0SUQsXG4gICAgICBhZGRyczMsIGFkZHJzMSwgYWRkcnMyLCBiaW50b29scy5jYjU4RGVjb2RlKFBsYXRmb3JtQ2hhaW5JRCksIFxuICAgICAgdW5kZWZpbmVkLCB1bmRlZmluZWQsIG5ldyBVVEY4UGF5bG9hZChcImhlbGxvIHdvcmxkXCIpLmdldFBheWxvYWQoKSwgVW5peE5vdygpXG4gICAgKVxuICAgIGNvbnN0IHR4OlR4ID0gdHh1LnNpZ24oa2V5bWdyMSk7XG4gICAgY29uc3QgdHgyOlR4ID0gbmV3IFR4KCk7XG4gICAgdHgyLmZyb21CdWZmZXIodHgudG9CdWZmZXIoKSk7XG4gICAgZXhwZWN0KHR4LnRvQnVmZmVyKCkudG9TdHJpbmcoJ2hleCcpKS50b0JlKHR4Mi50b0J1ZmZlcigpLnRvU3RyaW5nKCdoZXgnKSk7XG4gIH0pO1xuXG59KTtcbiJdfQ==