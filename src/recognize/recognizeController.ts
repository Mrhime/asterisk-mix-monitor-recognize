import { ApiTags } from '@nestjs/swagger';
import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UnauthorizedException,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FileInterceptor } from '@nestjs/platform-express';
import { RecognizeDto } from './dto/recognize.dto';
import { RecognizeService } from './recognizeService';

@ApiTags('Recognize')
@Controller('Recognize')
export class RecognizeController {
  constructor(
    private readonly configService: ConfigService,
    private readonly recognizeService: RecognizeService,
  ) {}
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('file'))
  @Post('/recognizeLong')
  async recognizeLong(
    @Body() dto: RecognizeDto,
    @UploadedFile() file: any, // Express.Multer.File,
  ): Promise<any> {
    // if (dto.token !== this.configService.get('APP_TOKEN')) {
    //   throw new UnauthorizedException('Invalid token');
    // }
    // if (!file) {
    //   throw new BadRequestException('file id not exist');
    // }
    const res = [];
    const recognize = await this.recognizeService.recognizeLong(file, dto);
    recognize.items.forEach((item) => {
      res.push({
        channelNumber: item.channelTag,
        text: item.alternatives.map((alt) => alt.text),
      });
    });
    return res;
  }

  @Post('recognizeByPath')
  async recognizeByPath(@Body() dto: RecognizeDto): Promise<any> {
    const res = [];
    const recognize = await this.recognizeService.recognizeByPath(dto);
    console.log(recognize);
    if (recognize.items) {
      recognize.items.forEach((item) => {
        res.push({
          channelNumber: item.channelTag,
          text: item.alternatives.map((alt) => alt.text),
        });
      });
    }

    return res;
  }
}
