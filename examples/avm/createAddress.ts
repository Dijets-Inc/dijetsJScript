import { 
  Dijets
} from "../../dist";
import { AVMAPI } from "../../dist/apis/avm";
  
const ip: string = 'localhost';
const port: number = 9650;
const protocol: string = 'http';
const networkID: number = 12345;
const dijets: Dijets = new Dijets(ip, port, protocol, networkID);
const xchain: AVMAPI = dijets.XChain();
  
const main = async (): Promise<any> => {
  const username: string = "username";
  const password: string = "Vz48jjHLTCcAepH95nT4B"
  const address: string = await xchain.createAddress(username, password);
  console.log(address);
}
    
main()
  