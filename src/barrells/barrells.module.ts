import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Barrells, BarrellsSchema } from 'src/schemas/barrells.schema';
import { BarrellsController } from './barrells.controller';
import { BarrellsService } from './barrells.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { schema: BarrellsSchema, name: Barrells.name },
    ]),
  ],
  controllers: [BarrellsController],
  providers: [BarrellsService],
})
export class BarrellsModule {}
