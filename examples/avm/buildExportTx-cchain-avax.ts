import { 
  Dijets,
  BinTools,
  BN,
  Buffer
} from "../../src";
import {
  AVMAPI, 
  KeyChain as AVMKeyChain,
  UTXOSet,
  UnsignedTx,
  Tx
} from "../../src/apis/avm"
import { 
  KeyChain as EVMKeyChain, 
  EVMAPI 
} from "../../src/apis/evm";
import { 
  Defaults, 
  UnixNow 
} from "../../src/utils"
        
const ip: string = "localhost"
const port: number = 9650
const protocol: string = "http"
const networkID: number = 12345
const dijets: Dijets = new Dijets(ip, port, protocol, networkID)
const xchain: AVMAPI = dijets.XChain()
const cchain: EVMAPI = dijets.CChain()
const bintools: BinTools = BinTools.getInstance()
const xKeychain: AVMKeyChain = xchain.keyChain()
const cKeychain: EVMKeyChain = cchain.keyChain()
const privKey: string = "PrivateKey-ewoqjP7PxY4yr3iLTpLisriqt94hdyDFNgchSxGGztUrTXtNN"
xKeychain.importKey(privKey)
cKeychain.importKey(privKey)
const xAddressStrings: string[] = xchain.keyChain().getAddressStrings()
const cAddressStrings: string[] = cchain.keyChain().getAddressStrings()
const cChainBlockchainID: string = Defaults.network['12345'].C.blockchainID
const locktime: BN = new BN(0)
const asOf: BN = UnixNow()
const memo: Buffer = Buffer.from("AVM utility method buildExportTx to export DJTX to the C-Chain from the X-Chain")
const fee: BN = xchain.getDefaultTxFee()
        
const main = async (): Promise<any> => {
  const avmUTXOResponse: any = await xchain.getUTXOs(xAddressStrings)
  const utxoSet: UTXOSet = avmUTXOResponse.utxos
  const djtxAssetID: Buffer = await xchain.getDJTXAssetID()
  const getBalanceResponse: any = await xchain.getBalance(xAddressStrings[0], bintools.cb58Encode(djtxAssetID))
  const balance: BN = new BN(getBalanceResponse.balance)
  const amount: BN = balance.sub(fee)
    
  const unsignedTx: UnsignedTx = await xchain.buildExportTx(
    utxoSet,
    amount,
    cChainBlockchainID,
    cAddressStrings,
    xAddressStrings,
    xAddressStrings,
    memo,
    asOf,
    locktime
  )
  
  const tx: Tx = unsignedTx.sign(xKeychain)
  const txid: string = await xchain.issueTx(tx)
  console.log(`Success! TXID: ${txid}`)
}
      
main()
      