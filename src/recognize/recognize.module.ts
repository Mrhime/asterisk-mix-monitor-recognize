import { Logger, Module } from '@nestjs/common';
import { RecognizeController } from './recognize.controller';
import { RecognizeService } from './recognize.service';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: ['.env', '.dev.env'],
      expandVariables: true,
      isGlobal: true,
      cache: false,
    }),
    HttpModule.register({
      timeout: 3000,
      maxRedirects: 1,
    }),
  ],
  controllers: [RecognizeController],
  providers: [RecognizeService, Logger],
  exports: [],
})
export class RecognizeModule {}
