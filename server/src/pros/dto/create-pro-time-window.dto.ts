import { IsString } from 'class-validator';

export class CreateProTimeWindowDto {
  @IsString()
  start!: string;

  @IsString()
  end!: string;
}
