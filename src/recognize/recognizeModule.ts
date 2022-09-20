import { Logger, Module } from '@nestjs/common';
import { RecognizeController } from './recognizeController';
import { RecognizeService } from './recognizeService';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [
    ConfigModule.forRoot(),
    HttpModule.register({
      timeout: 1000,
      maxRedirects: 1,
    }),
  ],
  controllers: [RecognizeController],
  providers: [RecognizeService, Logger],
  exports: [],
})
export class RecognizeModule {}
