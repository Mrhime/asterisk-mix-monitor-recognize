import { Logger, Module } from '@nestjs/common';
import { AsteriskService } from './asterisk.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule.forRoot()],
  controllers: [],
  providers: [AsteriskService, Logger],
  exports: [AsteriskService],
})
export class AsteriskModule {}
