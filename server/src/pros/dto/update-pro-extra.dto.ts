import { PartialType } from '@nestjs/mapped-types';

import { CreateProExtraDto } from './create-pro-extra.dto';

export class UpdateProExtraDto extends PartialType(CreateProExtraDto) {}
