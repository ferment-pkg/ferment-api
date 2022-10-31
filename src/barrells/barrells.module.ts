import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Barrells, BarrellsSchema } from 'src/schemas/barrells.schema';
import { BarrellsController as v1Controller } from './v1/barrells.controller';
import { BarrellsService as v1Service } from './v1/barrells.service';
import { BarrellsController as v2Controller } from './v2/barrells.controller';
import { BarrellsService as v2Service } from './v2/barrells.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { schema: BarrellsSchema, name: Barrells.name },
    ]),
  ],
  controllers: [v1Controller, v2Controller],
  providers: [v1Service, v2Service],
})
export class BarrellsModule {}
