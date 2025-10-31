import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module';
import { OauthModule } from '../auth/oauth.module';
import { McpController } from './mcp.controller';
import { McpService } from './mcp.service';

@Module({
  imports: [PrismaModule, OauthModule],
  controllers: [McpController],
  providers: [McpService],
})
export class McpModule {}
