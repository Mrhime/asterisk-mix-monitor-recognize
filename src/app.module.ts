import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AsteriskModule } from './asterisk/asterisk.module';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import * as winston from 'winston';
import {
  utilities as nestWinstonModuleUtilities,
  WinstonModule,
} from 'nest-winston';
import { ConvertModule } from './convert/convert.module';
import { RecognizeModule } from './recognize/recognizeModule';

@Module({
  imports: [
    WinstonModule.forRoot({
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.ms(),
            nestWinstonModuleUtilities.format.nestLike('MyApp', {
              prettyPrint: true,
              colors: true,
            }),
          ),
        }),
      ],
    }),

    ScheduleModule.forRoot(),
    ConfigModule.forRoot({
      envFilePath: ['.dev.env', '.env'],
      expandVariables: true,
      isGlobal: true,
      cache: false,
    }),
    AsteriskModule,
    ConvertModule,
    RecognizeModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
