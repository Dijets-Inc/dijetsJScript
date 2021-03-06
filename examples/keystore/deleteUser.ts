import { Dijets } from "../../dist";
import { KeystoreAPI } from "../../dist/apis/keystore";
  
const ip: string = 'localhost';
const port: number = 9650;
const protocol: string = 'http';
const networkID: number = 12345;
const dijets: Dijets = new Dijets(ip, port, protocol, networkID);
const keystore: KeystoreAPI = dijets.NodeKeys();
  
const main = async (): Promise<any> => {
  const username: string = "username";
  const password: string = "Vz48jjHLTCcAepH95nT4B"
  const successful: boolean = await keystore.deleteUser(username, password);
  console.log(successful);
}
    
main()
  