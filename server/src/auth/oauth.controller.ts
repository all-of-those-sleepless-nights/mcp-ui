import { Body, Controller, Get, HttpCode, Options, Post, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';

import {
  OPENID_CONFIGURATION_PATH,
  OAUTH_REGISTRATION_PATH,
  OauthService,
  PROTECTED_RESOURCE_PATH,
} from './oauth.service';

@Controller()
export class OauthController {
  constructor(private readonly oauthService: OauthService) {}

  @Get(PROTECTED_RESOURCE_PATH)
  getProtectedResourceMetadata(@Req() req: Request, @Res() res: Response): void {
    this.oauthService.respondProtectedResource(req, res);
  }

  @Get(OPENID_CONFIGURATION_PATH)
  getOpenIdConfiguration(@Req() req: Request, @Res() res: Response): void {
    this.oauthService.respondOpenIdConfiguration(req, res);
  }

  @Options(OAUTH_REGISTRATION_PATH)
  handleOptions(@Res() res: Response): void {
    this.oauthService.setCorsHeaders(res);
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'content-type, authorization');
    res.status(204).send();
  }

  @Post(OAUTH_REGISTRATION_PATH)
  @HttpCode(201)
  register(@Body() body: unknown, @Res() res: Response): void {
    this.oauthService.handleDynamicRegistration(body, res);
  }
}
