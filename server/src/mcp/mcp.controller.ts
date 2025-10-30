import {
  Controller,
  Get,
  Options,
  Post,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import { Request, Response } from 'express';

import { McpService } from './mcp.service';
import type { Request as RawRequest } from 'express';

@Controller('mcp')
export class McpController {
  constructor(private readonly mcpService: McpService) {}

  @Options()
  handleRootOptions(@Res() res: Response): void {
    this.mcpService.handleOptions(res);
  }

  @Options('messages')
  handleMessagesOptions(@Res() res: Response): void {
    this.mcpService.handleOptions(res);
  }

  @Get()
  async openStream(
    @Req() req: RawRequest,
    @Res() res: Response,
  ): Promise<void> {
    await this.mcpService.handleSse(req, res);
  }

  @Post('messages')
  async receiveMessage(
    @Query('sessionId') sessionId: string | undefined,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    await this.mcpService.handlePost(sessionId, req, res);
  }
}
