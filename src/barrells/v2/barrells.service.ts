import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as child from 'child_process';
import { FirebaseApp, FirebaseOptions, initializeApp } from 'firebase/app';
import {
  FirebaseStorage,
  getMetadata,
  getStorage,
  getStream,
  listAll,
  ref,
} from 'firebase/storage';
import * as fs from 'fs';
import { Model } from 'mongoose';
import { Barrells, BarrellsDocument } from 'src/schemas/barrells.schema';
export type Barrell = {
  pkgname: string;
  alias?: string[];
  description: string;
  source: string[];
  dependencies?: string[];
  Dbuild?: string[];
  home?: string;
  license?: string[];
  version: string;
  downloads: number;
  archs: string[];
};

@Injectable()
export class BarrellsService {
  private barrells: Barrell[];
  private app: FirebaseApp;
  private storage: FirebaseStorage;
  currentDownloads: string[] = [];
  constructor(
    @InjectModel(Barrells.name) private barrellsModel: Model<BarrellsDocument>,
  ) {
    const firebaseConfig: FirebaseOptions = {
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
      try {
        const files = fs.readdirSync('/tmp/ferment-api/downloads');
        files.forEach((f) => {
          if (this.currentDownloads.find((d) => d == f)) {
            files.splice(files.indexOf(f), 1);
          }
        });
        for (const f of files) {
          fs.rmdirSync(`/tmp/ferment-api/downloads/${f}`);
        }
      } catch (err) {
        fs.mkdirSync('/tmp/ferment-api/downloads', { recursive: true });
      }
    }, 1000 * 60 * 60);
    setInterval(async () => {
      this.barrells = [];
    }, 1000 * 60 * 30);
  }
  async getBarrells(): Promise<Barrell[]> {
    if (!this.barrells) {
      this.barrells = [];
    }
    if (!fs.existsSync('Barrells')) {
      this.barrells = [];
      child.exec('git clone https://github.com/ferment-pkg/Barrells Barrells');
      //wait for done to be true
    }
    if (this.barrells.length == 0) {
      const b = await this.getAllBarrell();
      for (const file of fs.readdirSync('Barrells')) {
        if (!file.endsWith('.fpkg')) {
          continue;
        }
        const content = fs.readFileSync(`Barrells/${file}`, 'utf8').split('\n');
        const name = content
          .find((c) => c.startsWith('pkgname='))
          .split('=')[1]
          .trim();
        const description = content
          .find((line) => line.startsWith('description'))
          ?.split('=')[1]
          .replaceAll('\t', '')
          .replaceAll('"', '') as string;
        const download = content
          .find((line) => line.startsWith('source'))
          ?.split('=')[1]
          .replaceAll('\t', '')
          .replaceAll("'", '')
          .replaceAll('"', '')
          .split(',');
        const dependencies = content
          .find((line) => line.startsWith('dependencies'))
          ?.split('=')[1]
          .replaceAll('\t', '')
          .replaceAll("'", '')
          .replaceAll('"', '')
          .split(',');

        const home = content
          .find((line) => line.includes('home'))
          ?.split('=')[1]
          .replaceAll('\t', '')
          .replaceAll('"', '') as string;
        const version = content
          .find((line) => line.includes('version'))
          ?.split('=')[1]
          .replaceAll('\t', '')
          .replaceAll('"', '') as string;
        const license = content
          .find((line) => line.includes('license'))
          ?.split('=')[1]
          .replaceAll('\t', '')
          .replaceAll("'", '')
          .replaceAll('"', '')
          .split(',');
        const Dbuild = content
          .find((line) => line.includes('Dbuild'))
          ?.split('=')[1]
          .replaceAll('\t', '')
          .replaceAll("'", '')
          .replaceAll('"', '')
          .split(',');
        const archs = content
          .find((line) => line.includes('archs'))
          ?.split('=')[1]
          .replaceAll('\t', '')
          .replaceAll("'", '')
          .replaceAll('"', '')
          .split(',');
        this.barrells.push({
          pkgname: name,
          description,
          source: download,
          dependencies: dependencies || [],
          home,
          downloads: b.find((b) => b.name == name)?.downloadsAllTime || 0,
          version,
          license: license ? license : [],
          Dbuild: Dbuild ? Dbuild : [],
          archs,
        });
      }
    }
    return this.barrells || [];
  }
  async downloadFile(
    name: string,
    file: string,
  ): Promise<NodeJS.ReadableStream> {
    if (!fs.existsSync('Barrells')) {
      await this.getBarrells();
    }
    //check if @ is in file
    if (!file.includes('@')) {
      //make file the latesrt version
      file = await this.getLatestVersion(name);
    }
    const refFile = ref(this.storage, `${name}/${file}`);
    const stream = getStream(refFile);
    await this.incrementDownloads(name);
    return stream;
  }
  async getFileSize(name: string, file: string): Promise<number> {
    //use firebase to get file size without
    const fileRef = ref(this.storage, `${name}/${file}`);
    const metadata = await getMetadata(fileRef);
    return metadata.size;
  }
  async checkIfFileExists(name: string, file: string): Promise<boolean> {
    //return false if metadata promise is rejected
    try {
      const fileRef = ref(this.storage, `${name}/${file}`);
      await getMetadata(fileRef);
      return true;
    } catch (e) {
      return false;
    }
  }
  async checkIfBarrellExists(name: string): Promise<boolean> {
    //return false if metadata promise is rejected
    try {
      const fileRef = ref(this.storage, `${name}`);
      await getMetadata(fileRef);
      return true;
    } catch (e) {
      return false;
    }
  }
  async listFiles(name: string): Promise<string[]> {
    const fileRef = ref(this.storage, `${name}`);
    const { items } = await listAll(fileRef);
    const versions = items.map((item) => item.name);
    const versionSorted = versions.sort((a, b) => {
      const aSplit = a.split('.');
      const bSplit = b.split('.');
      if (aSplit[0] > bSplit[0]) {
        return -1;
      } else if (aSplit[0] < bSplit[0]) {
        return 1;
      } else {
        if (aSplit[1] > bSplit[1]) {
          return -1;
        } else if (aSplit[1] < bSplit[1]) {
          return 1;
        } else {
          if (aSplit[2] > bSplit[2]) {
            return -1;
          } else if (aSplit[2] < bSplit[2]) {
            return 1;
          } else {
            return 0;
          }
        }
      }
    });
    return versionSorted;
  }
  async getLatestVersion(name: string): Promise<string> {
    const fileRef = ref(this.storage, name);
    const { items } = await listAll(fileRef);
    const versions = items.map((item) => item.name.split('@')[1]);
    //file format lloks like name@version.tar.gz
    const latestVersion = versions
      .sort((a, b) => {
        const aSplit = a.split('.');
        const bSplit = b.split('.');
        if (aSplit[0] > bSplit[0]) {
          return -1;
        } else if (aSplit[0] < bSplit[0]) {
          return 1;
        } else {
          if (aSplit[1] > bSplit[1]) {
            return -1;
          } else if (aSplit[1] < bSplit[1]) {
            return 1;
          } else {
            if (aSplit[2] > bSplit[2]) {
              return -1;
            } else if (aSplit[2] < bSplit[2]) {
              return 1;
            } else {
              return 0;
            }
          }
        }
      })
      .pop();
    return latestVersion.replace('.ferment', '') || '';
  }
  async getAllBarrell(): Promise<Barrells[]> {
    return await this.barrellsModel.find().exec();
  }
  async incrementDownloads(name: string): Promise<void> {
    const barrell = await this.barrellsModel.findOne({ name: name }).exec();
    if (barrell) {
      barrell.downloadsAllTime++;
      await barrell.save();
    } else {
      const newBarrell = new this.barrellsModel({ name, downloadsAllTime: 1 });
      await newBarrell.save();
    }
  }
  isBarrellUniversal(name: string, version: string): boolean {
    const barrell = this.barrells.find(
      (b) => b.pkgname == name && b.version == version,
    );
    if (barrell) {
      return barrell.archs.find((a) => a.toLowerCase() == 'universal')
        ? true
        : false;
    } else {
      return false;
    }
  }
}
