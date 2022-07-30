import { Body, Controller, HttpStatus, Post, Req } from '@nestjs/common';
import { Request } from 'express';
import * as fs from 'fs/promises';
import { AppService } from './app.service';
@Controller('')
export class AppController {
  @Post('ghpayload')
  async getGithubPayload(
    @Req() req: Request,
    @Body() body: { config: { secret: string } },
  ): Promise<HttpStatus> {
    if (req.headers['X-Github-Event'] === 'ping') return HttpStatus.OK;
    if (req.headers['X-Github-Event'] !== 'push') return HttpStatus.BAD_REQUEST;
    if (req.headers['X-Github-Delivery'] === undefined)
      return HttpStatus.BAD_REQUEST;
    if (body.config.secret != process.env.GHPAYLOADSECRET)
      return HttpStatus.UNAUTHORIZED;
    //GHPAYLOADSECRET

    const id = AppService.id;
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
