import { Injectable } from '@nestjs/common';
import * as child from 'child_process';
import { FirebaseApp, initializeApp } from 'firebase/app';
import { FirebaseStorage, getStorage, getStream, ref } from 'firebase/storage';
import * as fs from 'fs';
@Injectable()
export class BarrellsService {
  private barrells: Barrell[];
  private app: FirebaseApp;
  private storage: FirebaseStorage;
  currentDownloads: string[] = [];
  constructor() {
    const firebaseConfig = {
      apiKey: process.env.APIKEY,

      authDomain: 'fermentprebuild.firebaseapp.com',

      projectId: 'fermentprebuild',

      storageBucket: 'fermentprebuild.appspot.com',

      messagingSenderId: process.env.MESSAGEID,

      appId: process.env.APPID,

      measurementId: process.env.MEASUREID,
    };

    // Initialize Firebase

    this.app = initializeApp(firebaseConfig);
    this.storage = getStorage(this.app);
    setInterval(async () => {
      const files = fs.readdirSync('/tmp/ferment-api/downloads');
      files.forEach((f) => {
        if (this.currentDownloads.find((d) => d == f)) {
          files.splice(files.indexOf(f), 1);
        }
      });
      for (const f of files) {
        fs.unlinkSync(`/tmp/ferment-api/downloads/${f}`);
      }
    }, 1000 * 60 * 60);
  }
  async getBarrells(): Promise<Barrell[]> {
    setInterval(async () => {
      let done = false;
      const result = child
        .exec('git pull', { cwd: 'Barrells' })
        .on('exit', () => {
          done = true;
        });
      result.stdout.on('data', (data) => {
        if (!data.includes('Already up-to-date.')) {
          this.barrells.length = 0;
          for (const file of fs.readdirSync('Barrells')) {
            if (!file.endsWith('.py') || file == 'index.py') {
              continue;
            }
            const name = file.replace('.py', '');
            const content = fs
              .readFileSync(`Barrells/${file}`, 'utf8')
              .split('\n');
            const description = content
              .find((line) => line.includes('description'))
              ?.split('=')[1]
              .replaceAll('\t', '')
              .replaceAll('"', '') as string;
            const download = content
              .find((line) => line.includes('url'))
              ?.split('=')[1]
              .replaceAll('\t', '')
              .replaceAll("'", '')
              .replaceAll('"', '') as string;
            const git =
              content.find((line) => line.includes('git'))?.split('=')[1] ==
              'True';
            const dependencies = content
              .find((line) => line.includes('dependencies'))
              ?.split('=')[1]
              .replaceAll('\t', '')
              .replaceAll('[', '')
              .replaceAll(']', '')
              .replaceAll(' ', '')
              .replaceAll("'", '')
              .replaceAll('"', '') as string;
            const home = content
              .find((line) => line.includes('homepage'))
              ?.split('=')[1]
              .replaceAll('\t', '')
              .replaceAll('"', '') as string;
            this.barrells.push({
              name,
              description,
              download,
              git,
              dependencies: dependencies ? dependencies.split(',') : undefined,
              home,
            });
          }
        }
      });
      while (!done) {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }, 1000 * 60 * 5);
    if (!this.barrells) {
      this.barrells = [];
    }
    if (!fs.existsSync('Barrells')) {
      this.barrells = [];
      child.exec('git clone https://github.com/ferment-pkg/Barrells Barrells');
      //wait for done to be true
    }
    if (this.barrells.length == 0) {
      for (const file of fs.readdirSync('Barrells')) {
        if (!file.endsWith('.py') || file == 'index.py') {
          continue;
        }
        const name = file.replace('.py', '');
        const content = fs.readFileSync(`Barrells/${file}`, 'utf8').split('\n');
        const description = content
          .find((line) => line.includes('description'))
          ?.split('=')[1]
          .replaceAll('\t', '')
          .replaceAll('"', '') as string;
        const download = content
          .find((line) => line.includes('url'))
          ?.split('=')[1]
          .replaceAll('\t', '')
          .replaceAll("'", '')
          .replaceAll('"', '') as string;
        const git =
          content.find((line) => line.includes('git'))?.split('=')[1] == 'True';
        const dependencies = content
          .find((line) => line.includes('dependencies'))
          ?.split('=')[1]
          .replaceAll('\t', '')
          .replaceAll('[', '')
          .replaceAll(']', '')
          .replaceAll(' ', '')
          .replaceAll("'", '')
          .replaceAll('"', '') as string;
        const home = content
          .find((line) => line.includes('homepage'))
          ?.split('=')[1]
          .replaceAll('\t', '')
          .replaceAll('"', '') as string;
        this.barrells.push({
          name,
          description,
          download,
          git,
          dependencies: dependencies ? dependencies.split(',') : undefined,
          home,
        });
      }
    }
    return this.barrells || [];
  }
  async downloadFile(name: string, file: string): Promise<fs.ReadStream> {
    if (!fs.existsSync('Barrells')) {
      await this.getBarrells();
    }
    const fileRef = ref(this.storage, `${name}/${file}`);
    const stream = getStream(fileRef);
    const write = fs.createWriteStream(
      `/tmp/ferment-api/downloads/${name}/${file}`,
    );
    stream.pipe(write);
    this.currentDownloads.push(`${name}/${file}`);
    return fs.createReadStream(`/tmp/ferment-api/downloads/${name}/${file}`);
  }
}
