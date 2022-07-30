import { Module } from '@nestjs/common';
import { BarrellsModule } from './barrells/barrells.module';
import { PrebuildsGateway } from './prebuilds.gateway';
import { AppController } from './app/app.controller';
import { AppService } from './app/app.service';

@Module({
  imports: [BarrellsModule],
  controllers: [AppController],
  providers: [PrebuildsGateway, AppService],
})
export class AppModule {}
