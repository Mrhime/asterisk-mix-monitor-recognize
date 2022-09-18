import { Logger, Module } from '@nestjs/common';
import { ConvertService } from './convert.service';
import { ConvertController } from './convert.controller';

@Module({
  imports: [],
  controllers: [ConvertController],
  providers: [ConvertService, Logger],
  exports: [],
})
export class ConvertModule {}
