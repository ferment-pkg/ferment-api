import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { config } from 'dotenv';
import { SocketIoAdapter } from './adpaters/websocket.adpater';
import { AppModule } from './app.module';
async function bootstrap() {
  config();
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.enableCors();
  app.set('trust proxy', 1);
  app.useWebSocketAdapter(new SocketIoAdapter(app));
  await app.listen(process.env.PORT || 3000);
}
bootstrap();
