import { PartialType } from '@nestjs/mapped-types';

import { CreateProTimeWindowDto } from './create-pro-time-window.dto';

export class UpdateProTimeWindowDto extends PartialType(
  CreateProTimeWindowDto,
) {}
