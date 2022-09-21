import { ApiTags } from '@nestjs/swagger';
import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ConvertService } from './convert.service';
import { DatePathDto } from './dto/date-path.dto';
@ApiTags('Convert')
@Controller('Convert')
export class ConvertController {
  constructor(private readonly convertService: ConvertService) {}
  @Post('convert/')
  async convertAt(@Body() datePathDto: DatePathDto) {
    console.log(datePathDto);
    return await this.convertService.convertPath(datePathDto);
  }

  @Get('/records/')
  getRecords(@Query() path: DatePathDto): Promise<Array<string>> {
    return this.convertService.getRecords(path);
  }
}
