import { ApiProperty } from '@nestjs/swagger';

export class DatePathDto {
  @ApiProperty({
    description: 'date path records',
    example: '2022/09/17',
  })
  path: string;

  @ApiProperty({
    example: '79245115597',
    required: false,
    description: 'phone number client',
  })
  phone?: string;
  constructor(path?: string) {
    this.path = path;
  }
}
