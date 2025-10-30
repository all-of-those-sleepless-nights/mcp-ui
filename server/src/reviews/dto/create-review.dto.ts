import { Type } from 'class-transformer';
import {
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateReviewDto {
  @Type(() => Number)
  @IsInt()
  proId!: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  userId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  bookingId?: number;

  @Type(() => Number)
  @IsNumber()
  rating!: number;

  @IsOptional()
  @IsString()
  review?: string;
}
