import { 
  Dijets,
  Buffer
} from "../../dist";
import { AVMAPI } from "../../dist/apis/avm";
  
const ip: string = 'localhost';
const port: number = 9650;
const protocol: string = 'http';
const networkID: number = 12345;
const dijets: Dijets = new Dijets(ip, port, protocol, networkID);
const xchain: AVMAPI = dijets.XChain();
  
const main = async (): Promise<any> => {
  const newAssetID: string = "11FtAxv";
  await xchain.setDJTXAssetID(newAssetID);
  const assetID: Buffer = await xchain.getDJTXAssetID();
  console.log(assetID);
}
    
main()
  