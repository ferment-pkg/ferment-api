import { Logger } from '@nestjs/common';
import {
  MessageBody,
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
} from '@nestjs/websockets';
import { FirebaseApp, initializeApp } from 'firebase/app';
import {
  FirebaseStorage,
  getStorage,
  ref,
  uploadBytes,
} from 'firebase/storage';
import * as fs from 'fs/promises';
type UploadMessage = {
  file: string;
  part: number;
  of: number;
  data: string;
  name: string;
};
@WebSocketGateway()
export class PrebuildsGateway implements OnGatewayConnection {
  private app: FirebaseApp;
  private storage: FirebaseStorage;
  private readonly logger = new Logger('PrebuildsGateway');
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
  }
  handleConnection(client: any, ...args: any) {
    const e = [];
    for (const f in args) {
      e.push(f);
    }
    for (const f of args) {
      e.push(f);
    }
    this.logger.log(`Client connected ${e.toString()}`);
  }
  @SubscribeMessage('upload')
  async handleUpload(@MessageBody() data: UploadMessage): Promise<string> {
    console.log(data);
    if (
      !data ||
      !data.file ||
      !data.part ||
      !data.of ||
      !data.data ||
      !data.name
    ) {
      return 'Invalid data';
    }
    await fs.mkdir(`/tmp/ferment-api/prebuilds/${data.name}/`, {
      recursive: true,
    });
    await fs.appendFile(
      `/tmp/ferment-api/prebuilds/${data.name}/${data.file}`,
      data.data,
      {
        encoding: 'base64',
      },
    );
    //Checks if all parts have been uploaded
    if (data.part == data.of) {
      const content = await fs.readFile(
        `/tmp/ferment-api/prebuilds/${data.name}/${data.file}`,
      );
      //upload
      const f = ref(this.storage, `${data.name}/${data.file}`);
      try {
        await uploadBytes(f, content);
        await fs.unlink(`/tmp/ferment-api/prebuilds/${data.name}/${data.file}`);
        return 'Uploaded Complete File';
      } catch (err) {
        return 'Error Uploading File';
      }
    }
    return `Uploaded Part ${data.part}/${data.of}`;
  }
  // @SubscribeMessage('download')
  // async handleDownload(
  //   socket: any,
  //   data: { name: string; file: string },
  // ): Promise<{ data: any } | string> {

  // }
}
