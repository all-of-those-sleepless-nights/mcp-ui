import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsInt,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateServiceDto {
  @IsString()
  slug!: string;

  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @Type(() => Number)
  @IsInt()
  defaultPriceLow!: number;

  @Type(() => Number)
  @IsInt()
  defaultPriceHigh!: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  defaultRadiusKm?: number;

  @Type(() => Number)
  @IsArray()
  @ArrayNotEmpty()
  @IsInt({ each: true })
  defaultWorkingDays!: number[];
}
