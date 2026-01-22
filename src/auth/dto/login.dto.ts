import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    description: 'User password',
    example: 'your-secure-password',
  })
  @IsString()
  @MinLength(1)
  password: string;
}
