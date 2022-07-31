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
@Controller('')
export class AppController {
  @Post('ghpayload')
  async getGithubPayload(
    @Req() req: Request,
    @Body() body: { config: { secret: string } },
  ): Promise<HttpStatus> {
    if (req.headers['X-Github-Event'] === 'ping')
      throw new HttpException('Pong', 200);
    if (req.headers['X-Github-Event'] !== 'push')
      throw new HttpException('Not a push', 400);
    if (req.headers['X-Github-Delivery'] === undefined)
      throw new HttpException('Missing X-Github-Delivery', 400);
    //verify signature
    const hmac = req.headers['X-Hub-Signature'];
    const sha =
      'sha1=' +
      crypto
        .createHmac('sha1', process.env.GHPAYLOADSECRET)
        .update(req.body)
        .digest('hex');
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
    setTimeout(() => process.exit(0), 1000);
    return HttpStatus.OK;
  }
}
