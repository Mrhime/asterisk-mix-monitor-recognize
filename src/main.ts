import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    // logger: console,
    cors: true,
  });
  const config = new DocumentBuilder()
    .setTitle('AmiRecognize')
    .setDescription('API')
    .setVersion('v1')
    .addTag('Convert')
    .addTag('Recognize')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('/doc', app, document);
  const configService = await app.get<ConfigService>(ConfigService);
  const PORT = configService.get('PORT', 3000);
  console.log('App listen: ', PORT);
  await app.listen(PORT);
}
bootstrap();
