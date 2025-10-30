import { Type } from 'class-transformer';
import {
  IsDateString,
  IsInt,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateBookingDto {
  @Type(() => Number)
  @IsInt()
  proId!: number;

  @Type(() => Number)
  @IsInt()
  serviceId!: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  userId?: number;

  @IsDateString()
  start!: string;

  @IsDateString()
  end!: string;

  @IsString()
  status!: string;

  @Type(() => Number)
  @IsInt()
  priceEstimate!: number;

  @IsObject()
  address!: Record<string, unknown>;

  @IsOptional()
  @IsString()
  instructions?: string;

  @IsOptional()
  @IsString()
  quoteId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  rating?: number;

  @IsOptional()
  @IsString()
  reviewText?: string;
}
