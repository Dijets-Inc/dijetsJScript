import { 
  Dijets
} from "../../dist";
import { InfoAPI } from "../../dist/apis/info";
import { iPeer } from "../../dist/apis/info/interfaces";
  
const ip: string = 'localhost';
const port: number = 9650;
const protocol: string = 'http';
const networkID: number = 12345;
const dijets: Dijets = new Dijets(ip, port, protocol, networkID);
const info: InfoAPI = dijets.Info();
  
const main = async (): Promise<any> => {
  const peers: iPeer[] = await info.peers();
  console.log(peers);
}
    
main()
  