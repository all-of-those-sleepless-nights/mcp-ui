import { Module } from '@nestjs/common';

import { PrismaModule } from 'src/prisma/prisma.module';
import { ProsController } from './pros.controller';
import { ProsService } from './pros.service';

@Module({
  imports: [PrismaModule],
  controllers: [ProsController],
  providers: [ProsService],
})
export class ProsModule {}
