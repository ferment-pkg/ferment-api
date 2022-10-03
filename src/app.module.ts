import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app/app.controller';
import { AppService } from './app/app.service';
import { BarrellsModule } from './barrells/barrells.module';

@Module({
  imports: [
    BarrellsModule,
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRoot(process.env.MONGODB),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
