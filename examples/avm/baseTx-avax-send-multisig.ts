import { 
  Dijets,
  BinTools,
  BN,
  Buffer
} from "../../src";
import {
  AVMAPI, 
  KeyChain as AVMKeyChain,
  SECPTransferOutput,
  SECPTransferInput,
  TransferableOutput,
  TransferableInput,
  UTXOSet,
  UTXO,
  AmountOutput,
  UnsignedTx,
  Tx,
  BaseTx
} from "../../src/apis/avm"
import { Defaults } from "../../src/utils"
      
      
const ip: string = "localhost"
const port: number = 9650
const protocol: string = "http"
const networkID: number = 12345
const dijets: Dijets = new Dijets(ip, port, protocol, networkID)
const xchain: AVMAPI = dijets.XChain()
const bintools: BinTools = BinTools.getInstance()
const xKeychain: AVMKeyChain = xchain.keyChain()
let privKey: string = "PrivateKey-ewoqjP7PxY4yr3iLTpLisriqt94hdyDFNgchSxGGztUrTXtNN"
// X-local18jma8ppw3nhx5r4ap8clazz0dps7rv5u00z96u
xKeychain.importKey(privKey)
privKey = "PrivateKey-R6e8f5QSa89DjpvL9asNdhdJ4u8VqzMJStPV8VVdDmLgPd8a4"
// X-local15s7p7mkdev0uajrd0pzxh88kr8ryccztek57g0
xKeychain.importKey(privKey)
privKey = "PrivateKey-24b2s6EqkBp9bFG5S3Xxi4bjdxFqeRk56ck7QdQArVbwKkAvxz"
// X-local1aekly2mwnsz6lswd6u0jqvd9u6yddt58duwcc9
xKeychain.importKey(privKey)
const xAddresses: Buffer[] = xchain.keyChain().getAddresses()
  
const xAddressStrings: string[] = xchain.keyChain().getAddressStrings()
const blockchainid: string = Defaults.network['12345'].X.blockchainID
const outputs: TransferableOutput[] = []
const inputs: TransferableInput[] = []
const fee: BN = xchain.getDefaultTxFee()
const threshold: number = 1
const locktime: BN = new BN(0)
const memo: Buffer = Buffer.from("AVM manual spend multisig BaseTx to send DJTX")
// Uncomment for codecID 00 01
// const codecID: number = 1
      
const main = async (): Promise<any> => {
  const djtxAssetID: Buffer = await xchain.getDJTXAssetID()
  const getBalanceResponse: any = await xchain.getBalance(xAddressStrings[0], bintools.cb58Encode(djtxAssetID))
  const balance: BN = new BN(getBalanceResponse['balance'])
  const secpTransferOutput: SECPTransferOutput = new SECPTransferOutput(balance.sub(fee), [xAddresses[0]], locktime, threshold)
  // Uncomment for codecID 00 01
//   secpTransferOutput.setCodecID(codecID)
  const transferableOutput: TransferableOutput = new TransferableOutput(djtxAssetID, secpTransferOutput)
  outputs.push(transferableOutput)
  
  const avmUTXOResponse: any = await xchain.getUTXOs(xAddressStrings)
  const utxoSet: UTXOSet = avmUTXOResponse.utxos
  const utxos: UTXO[] = utxoSet.getAllUTXOs()
  utxos.forEach((utxo: UTXO) => {
    const amountOutput: AmountOutput = utxo.getOutput() as AmountOutput
    const amt: BN = amountOutput.getAmount().clone()
    const txid: Buffer = utxo.getTxID()
    const outputidx: Buffer = utxo.getOutputIdx()
  
    const secpTransferInput: SECPTransferInput = new SECPTransferInput(amt)
    // Uncomment for codecID 00 01
    // secpTransferInput.setCodecID(codecID)
    xAddresses.forEach((xAddress: Buffer, index: number) => {
    if(index < 3) {
        secpTransferInput.addSignatureIdx(index, xAddress)
    }
    })
  
    const input: TransferableInput = new TransferableInput(txid, outputidx, djtxAssetID, secpTransferInput)
    inputs.push(input)
  })
  
  const baseTx: BaseTx = new BaseTx (
    networkID,
    bintools.cb58Decode(blockchainid),
    outputs,
    inputs,
    memo
  )
  // Uncomment for codecID 00 01
//   baseTx.setCodecID(codecID)
  const unsignedTx: UnsignedTx = new UnsignedTx(baseTx)
  const tx: Tx = unsignedTx.sign(xKeychain)
  const txid: string = await xchain.issueTx(tx)
  console.log(`Success! TXID: ${txid}`)
}
    
main()
    