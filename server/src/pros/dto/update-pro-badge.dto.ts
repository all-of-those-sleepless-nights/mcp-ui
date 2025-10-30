import { PartialType } from '@nestjs/mapped-types';

import { CreateProBadgeDto } from './create-pro-badge.dto';

export class UpdateProBadgeDto extends PartialType(CreateProBadgeDto) {}
