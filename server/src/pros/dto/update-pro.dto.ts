import { PartialType } from '@nestjs/mapped-types';

import { CreateProDto } from './create-pro.dto';

export class UpdateProDto extends PartialType(CreateProDto) {}
