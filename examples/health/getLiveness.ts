import { 
  Dijets
} from "../../src";
import { HealthAPI } from "../../src/apis/health";
  
const ip: string = 'localhost';
const port: number = 9650;
const protocol: string = 'http';
const networkID: number = 12345;
const dijets: Dijets = new Dijets(ip, port, protocol, networkID);
const health: HealthAPI = dijets.Health();
  
const main = async (): Promise<any> => {
  const getLivenessResponse: object= await health.getLiveness();
  console.log(getLivenessResponse);
}
    
main()
  