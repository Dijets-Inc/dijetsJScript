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

  const addressBuffer: Buffer = Buffer.from("3cb7d3842e8cee6a0ebd09f1fe884f6861e1b29c");
  const addressString: string = await xchain.addressFromBuffer(addressBuffer);
  console.log(addressString);
}
    
main()
  