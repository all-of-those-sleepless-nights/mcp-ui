import { Type } from 'class-transformer';
import { IsInt, IsNumber, IsOptional, IsString } from 'class-validator';

export class RateJobDto {
  @Type(() => Number)
  @IsInt()
  jobId!: number;

  @Type(() => Number)
  @IsNumber()
  rating!: number;

  @IsOptional()
  @IsString()
  review?: string;
}
