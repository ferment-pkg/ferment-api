import { Logger } from '@nestjs/common';
import {
  MessageBody,
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
} from '@nestjs/websockets';
import * as child from 'child_process';
import { FirebaseApp, initializeApp } from 'firebase/app';
import {
  FirebaseStorage,
  getStorage,
  getStream,
  ref,
  uploadBytes,
} from 'firebase/storage';
import * as fs from 'fs';
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
    this.logger.log(`Client connected ${args.toString()}`);
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
    fs.mkdirSync(`/tmp/ferment-api/prebuilds/${data.name}/`, {
      recursive: true,
    });
    fs.writeFileSync(
      `/tmp/ferment-api/prebuilds/${data.name}/${data.file}.prt${data.part}`,
      data.data,
      {
        encoding: 'base64',
        flag: 'w',
      },
    );
    //Checks if all parts have been uploaded
    if (data.part == data.of) {
      //Merge and upload to azure
      let done = false;
      child
        .exec(
          `cd /tmp/ferment-api/prebuilds/${data.name}/ && cat *.prt* > ${data.file}`,
        )
        .once('exit', (code) => {
          if (code == 0) {
            done = true;
          } else {
            return 'Error merging files';
          }
        });
      while (!done) {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
      //Do Upload ! NOT IMPLEMENTED YET
      //DELETE BOTTOM WHEN AZURE UPLOAD FINISHED CREATION
      // fs.renameSync(
      //   `/tmp/ferment-api/prebuilds/${data.name}/${data.file}`,
      //   `/tmp/${data.file}`,
      // );
      // fs.rmSync(`/tmp/ferment-api/prebuilds/${data.name}/`, {
      //   force: true,
      //   recursive: true,
      // });
      const content = fs.readFileSync(
        `/tmp/ferment-api/prebuilds/${data.name}/${data.file}`,
      );
      //upload
      const f = ref(this.storage, `${data.name}/${data.file}`);
      try {
        await uploadBytes(f, content);
        fs.unlinkSync(`/tmp/ferment-api/prebuilds/${data.name}/${data.file}`);
        return 'Uploaded Complete File';
      } catch (err) {
        return 'Error Uploading File';
      }
    }
    return `Uploaded Part ${data.part}/${data.of}`;
  }
  @SubscribeMessage('download')
  async handleDownload(
    socket: any,
    data: { name: string; file: string },
  ): Promise<{ data: any } | string> {
    try {
      const r = ref(this.storage, `${data.name}/${data.file}`);
      const stream = getStream(r);
      fs.mkdirSync('/tmp/ferment-api/downloads/' + data.name, {
        recursive: true,
      });
      const stm = fs.createWriteStream(
        `/tmp/ferment-api/downloads/${data.name}/${data.file}`,
      );
      await stream.pipe(stm);
      const content = fs.readFileSync(
        `/tmp/ferment-api/downloads/${data.name}/${data.file}`,
      );
      //wait 1 second
      return { data: content.toString() };
    } catch (err) {
      return 'Error While Downloading';
    }
  }
}
