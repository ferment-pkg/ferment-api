import { Module } from '@nestjs/common';
import { BarrellsModule } from './barrells/barrells.module';

@Module({
  imports: [BarrellsModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
