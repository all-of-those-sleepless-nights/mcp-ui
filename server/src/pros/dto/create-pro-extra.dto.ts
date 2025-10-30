import { Type } from 'class-transformer';
import { IsInt, IsString } from 'class-validator';

export class CreateProExtraDto {
  @IsString()
  name!: string;

  @Type(() => Number)
  @IsInt()
  price!: number;
}
