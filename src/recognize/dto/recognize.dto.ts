import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUrl } from 'class-validator';

export class RecognizeDto {
  constructor() {
    this.id = Date.now().toString();
  }
  @ApiProperty()
  // @IsNotEmpty()
  id: string;

  @ApiProperty({ example: 'audio file wav stereo 2 chanel' })
  file: any;

  @ApiProperty()
  @IsNotEmpty()
  token: string;

  @ApiProperty()
  // @IsNotEmpty()
  // @IsUrl()
  webhookUrl: string;
}
