import {
  Injectable,
  OnApplicationBootstrap,
  OnApplicationShutdown,
} from '@nestjs/common';
import * as fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';
@Injectable()
export class AppService
  implements OnApplicationShutdown, OnApplicationBootstrap
{
  static id: string;
  async onApplicationShutdown() {
    //read the instances.json file
    const content = await fs.readFile('instances.json', 'utf8');
    //remove the instance from the file
    const instances: StatusFile = JSON.parse(content);
    const index = instances.instances.findIndex(
      (instance) => instance.id === AppService.id,
    );
    instances.instances.splice(index, 1);
    instances.instancesUpToDate--;

    //write the file back
    await fs.writeFile('instances.json', JSON.stringify(instances));
  }
  async onApplicationBootstrap() {
    //generate a uuid
    AppService.id = uuidv4();
    //check if instances.json exists
    try {
      await fs.stat('instances.json');
    } catch (err) {
      //if not, create it
      fs.writeFile(
        'instances.json',
        JSON.stringify({ instances: [], newPush: false, instancesUpToDate: 0 }),
      );
      //wait 500 ms before
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
    const content = await fs.readFile('instances.json', 'utf8');
    const instances: StatusFile = JSON.parse(content);
    instances.instances.push({
      id: AppService.id,
      status: 'running',
      upToDate: true,
    });
    instances.instancesUpToDate++;
    await fs.writeFile('instances.json', JSON.stringify(instances));
    setInterval(async () => {
      const content = await fs.readFile('instances.json', 'utf8');
      const instances: StatusFile = JSON.parse(content);
      if (!instances.newPush) return;
      instances.instances.find(
        (instance) => instance.id === AppService.id,
      ).upToDate = true;
      instances.instancesUpToDate++;
      if (instances.instancesUpToDate === instances.instances.length) {
        instances.newPush = false;
      }
      await fs.writeFile('instances.json', JSON.stringify(instances));
      console.log('Im out');
      await new Promise((resolve) => setTimeout(resolve, 500));
      //give a sigterm
      process.kill(process.pid, 'SIGTERM');
    }, 1000);
  }
}
