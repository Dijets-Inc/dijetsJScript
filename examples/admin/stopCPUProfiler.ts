import { 
  Dijets
} from "../../dist";
import { AdminAPI } from "../../dist/apis/admin";
  
const ip: string = 'localhost';
const port: number = 9650;
const protocol: string = 'http';
const networkID: number = 12345;
const dijets: Dijets = new Dijets(ip, port, protocol, networkID);
const admin: AdminAPI = dijets.Admin();
  
const main = async (): Promise<any> => {
  const successful: boolean = await admin.stopCPUProfiler();
  console.log(successful);
}
    
main()
  