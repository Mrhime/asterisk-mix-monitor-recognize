import { Get, Injectable } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@Injectable()
@ApiTags('/test')
export class AppService {
  @Get('/ami')
  getHello(): string {
    return 'Hello World!';
  }
}
