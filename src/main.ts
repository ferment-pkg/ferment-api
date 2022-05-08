import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { config } from 'dotenv';
async function bootstrap() {
  config();
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.enableCors();
  app.set('trust proxy', 1);
  await app.listen(process.env.PORT || 3000);
}
bootstrap();
