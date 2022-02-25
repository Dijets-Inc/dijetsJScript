import { 
  Dijets
} from "../../dist";
import { InfoAPI } from "../../dist/apis/info";
  
const ip: string = 'localhost';
const port: number = 9650;
const protocol: string = 'http';
const networkID: number = 12345;
const dijets: Dijets = new Dijets(ip, port, protocol, networkID);
const info: InfoAPI = dijets.Info();
  
const main = async (): Promise<any> => {
  const alias: string = "X";
  const blockchainID : string = await info.getBlockchainID(alias);
  console.log(blockchainID);
}
    
main()
  