import { IsString } from 'class-validator';

export class CreateProBadgeDto {
  @IsString()
  label!: string;
}
