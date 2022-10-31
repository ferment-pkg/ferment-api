import {
  Controller,
  Get,
  Header,
  HttpException,
  Param,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import type { Barrell } from './barrells.service';
import { BarrellsService } from './barrells.service';

@Controller({
  path: 'barrells',
  version: '2',
})
export class BarrellsController {
  constructor(private readonly barrellsService: BarrellsService) {}
  @Get()
  @Header('Cache-Control', 'max-age=1200')
  async getBarrells(): Promise<Barrell[]> {
    return await this.barrellsService.getBarrells();
  }
  @Get('/:name')
  @Header('Cache-Control', 'max-age=1200')
  async getBarrellsByName(
    @Param() { name }: { name: string },
  ): Promise<Barrell> {
    const barrells = await this.barrellsService.getBarrells();
    switch (
      barrells.find(
        (barrell) => barrell.pkgname.toLowerCase() == name.toLowerCase(),
      )
    ) {
      case undefined:
        throw new HttpException(`Barrell ${name} not found`, 404);
      default:
        return barrells.find(
          (barrell) => barrell.pkgname.toLowerCase() == name.toLowerCase(),
        );
    }
  }
  @Get('/download/:name/:file')
  @Header('Content-Type', 'application/gzip')
  async downloadBarrell(
    @Param() { name, file }: { name: string; file: string },
    @Res() res: Response,
  ): Promise<HttpException | Buffer | any> {
    if (!(name && file)) throw new HttpException('Missing parameters', 400);
    if (!(await this.barrellsService.checkIfFileExists(name, file)))
      throw new HttpException('File Doesnt Exists', 404);
    const buffer = await this.barrellsService.downloadFile(name, file);
    this.barrellsService.currentDownloads.splice(
      this.barrellsService.currentDownloads.indexOf(`${name}/${file}`),
      1,
    );
    res.setHeader(
      'Content-Length',
      await this.barrellsService.getFileSize(name, file),
    );
    buffer.pipe(res);
  }
  @Get('/info/:name/:file')
  async getFileInfo(@Param() { name, file }: { name: string; file: string }) {
    if (!(name && file)) throw new HttpException('Missing parameters', 400);
    if (!this.barrellsService.checkIfFileExists(name, file))
      throw new HttpException('File not found', 404);
    return {
      fileSize: await this.barrellsService.getFileSize(name, file),
      latestVersion: await this.barrellsService.getLatestVersion(name),
      allFiles: await this.barrellsService.listFiles(name),
      universal: this.barrellsService.isBarrellUniversal(
        name,
        file.split('@')[1].split('_')[0],
      ),
    };
  }
  @Get('/info/:name')
  async getBarrellInfo(@Param() { name }: { name: string }) {
    if (!name) throw new HttpException('Missing parameters', 400);
    if (!this.barrellsService.checkIfBarrellExists(name))
      throw new HttpException('Barrell not found', 404);
    return {
      latestVersion: await this.barrellsService.getLatestVersion(name),
      allFiles: await this.barrellsService.listFiles(name),
    };
  }
}
