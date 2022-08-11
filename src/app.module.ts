import { Module } from '@nestjs/common';
import { AppController } from './app/app.controller';
import { AppService } from './app/app.service';
import { BarrellsModule } from './barrells/barrells.module';

@Module({
  imports: [BarrellsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
