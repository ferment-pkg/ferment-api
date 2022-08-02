import {
  Body,
  Controller,
  HttpException,
  HttpStatus,
  Post,
  Req,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { Request } from 'express';
import * as fs from 'fs/promises';
import { AppService } from './app.service';
@Controller('')
export class AppController {
  constructor(private readonly appService: AppService) {}
  @Post('ghpayload')
  async getGithubPayload(
    @Req() req: Request,
    @Body() body: { config: { secret: string } },
  ): Promise<HttpStatus> {
    console.log(req.headers['x-github-event']);
    if (req.headers['x-github-event'] === 'ping')
      throw new HttpException('Pong', 200);
    if (req.headers['x-github-event'] != 'push')
      throw new HttpException('Not a push', 400);
    if (req.headers['x-github-delivery'] === undefined)
      throw new HttpException('Missing X-Github-Delivery', 400);
    //verify signature
    const hmac = req.headers['x-hub-signature'];
    const sha =
      'sha1=' +
      crypto
        .createHmac('sha1', process.env.GHPAYLOADSECRET)
        .update(JSON.stringify(body))
        .digest('hex');
    console.log(sha);
    console.log(hmac);
    if (hmac !== sha) throw new HttpException('Invalid signature', 400);
    //GHPAYLOADSECRET

    const instancesSTR = await fs.readFile('instances.json', 'utf8');
    const instances: StatusFile = JSON.parse(instancesSTR);
    instances.newPush = true;
    instances.instancesUpToDate = 0;
    instances.instances.forEach((instance) => {
      instance.upToDate = false;
    });
    await fs.writeFile('instances.json', JSON.stringify(instances));
    //kill after 1 second
    setTimeout(async () => {
      console.log('exit');
      await this.appService.onApplicationShutdown();
      process.exit(0);
    }, 1000);

    return HttpStatus.OK;
  }
}
