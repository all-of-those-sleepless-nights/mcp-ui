import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsInt,
  IsNumber,
  IsString,
} from 'class-validator';

export class CreateProDto {
  @IsString()
  slug!: string;

  @Type(() => Number)
  @IsInt()
  serviceId!: number;

  @IsString()
  name!: string;

  @IsString()
  image!: string;

  @IsString()
  imageAlt!: string;

  @Type(() => Number)
  @IsNumber()
  rating!: number;

  @Type(() => Number)
  @IsInt()
  reviewsCount!: number;

  @Type(() => Number)
  @IsInt()
  priceFrom!: number;

  @IsString()
  currency!: string;

  @Type(() => Number)
  @IsNumber()
  latitude!: number;

  @Type(() => Number)
  @IsNumber()
  longitude!: number;

  @Type(() => Number)
  @IsInt()
  serviceRadiusKm!: number;

  @Type(() => Number)
  @IsArray()
  @ArrayNotEmpty()
  @IsInt({ each: true })
  workingDays!: number[];

  @Type(() => Number)
  @IsInt()
  baseQuoteLow!: number;

  @Type(() => Number)
  @IsInt()
  baseQuoteHigh!: number;
}
