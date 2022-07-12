import {
  Controller,
  Get,
  HttpException,
  Param,
  Res,
  StreamableFile,
} from '@nestjs/common';
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
    @Res({ passthrough: true }) res: Response,
  ): Promise<HttpException | StreamableFile> {
    if (!(name && file)) throw new HttpException('Missing parameters', 400);
    res.set({
      'Content-Type': 'application/gzip',
      'Content-Disposition': `attachment; filename="${file}"`,
    });
    const stream = await this.barrellsService.downloadFile(name, file);
    return new StreamableFile(stream.read() as Buffer);
  }
}
