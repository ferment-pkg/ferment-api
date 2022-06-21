import { Module } from '@nestjs/common';
import { BarrellsModule } from './barrells/barrells.module';
import { PrebuildsGateway } from './prebuilds.gateway';

@Module({
  imports: [BarrellsModule],
  controllers: [],
  providers: [PrebuildsGateway],
})
export class AppModule {}
