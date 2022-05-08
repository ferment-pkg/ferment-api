import { Module } from '@nestjs/common';
import { BarrellsController } from './barrells.controller';
import { BarrellsService } from './barrells.service';

@Module({
  controllers: [BarrellsController],
  providers: [BarrellsService],
})
export class BarrellsModule {}
