import { Controller, Get, HttpException, Param, Res } from '@nestjs/common';
import { Response } from 'express';
import { BarrellsService } from './barrells.service';
@Controller('barrells')
export class BarrellsController {
  constructor(private readonly barrellsService: BarrellsService) {}
  @Get()
  async getBarrells(): Promise<Barrell[]> {
    return await this.barrellsService.getBarrells();
  }
  @Get('/:name')
  async getBarrellsByName(
    @Param() { name }: { name: string },
  ): Promise<Barrell> {
    const barrells = await this.barrellsService.getBarrells();
    switch (
      barrells.find(
        (barrell) => barrell.name.toLowerCase() == name.toLowerCase(),
      )
    ) {
      case undefined:
        throw new HttpException(`Barrell ${name} not found`, 404);
      default:
        return barrells.find(
          (barrell) => barrell.name.toLowerCase() == name.toLowerCase(),
        );
    }
  }
  @Get('/download/:name/:file')
  async downloadBarrell(
    @Param() { name, file }: { name: string; file: string },
    @Res({ passthrough: false }) res: Response,
  ): Promise<HttpException | Buffer | void> {
    if (!(name && file)) throw new HttpException('Missing parameters', 400);
    const buffer = await this.barrellsService.downloadFile(name, file);
    this.barrellsService.currentDownloads.splice(
      this.barrellsService.currentDownloads.indexOf(`${name}/${file}`),
      1,
    );
    res.set({
      'Content-Type': 'application/gzip',
      'Content-Disposition': `attachment; filename=${file}`,
    });
    res.send(buffer);
  }
}
