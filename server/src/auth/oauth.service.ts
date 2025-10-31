import { Injectable, Logger } from '@nestjs/common';
import type { Request, Response } from 'express';

import {
  buildWwwAuthenticateHeader,
  getRequiredScopes,
  GOOGLE_AUTHORIZATION_ENDPOINT,
  GOOGLE_JWKS_URI,
  GOOGLE_OAUTH_CLIENT_ID,
  GOOGLE_OAUTH_CLIENT_SECRET,
  GOOGLE_TOKEN_ENDPOINT,
  GOOGLE_TOKEN_ENDPOINT_AUTH_METHOD,
  type VerifiedGoogleAccessToken,
  verifyGoogleAccessToken,
} from './google';

export const PROTECTED_RESOURCE_PATH = '/.well-known/oauth-protected-resource';
export const OPENID_CONFIGURATION_PATH = '/.well-known/openid-configuration';
export const OAUTH_REGISTRATION_PATH = '/oauth/register';

@Injectable()
export class OauthService {
  private readonly logger = new Logger(OauthService.name);
  private readonly requiredScopes = [...getRequiredScopes()];
  private readonly realm =
    process.env.OAUTH_REALM && process.env.OAUTH_REALM.trim().length > 0
      ? process.env.OAUTH_REALM.trim()
      : 'ui-mcp';
  private readonly registrationEndpoint =
    process.env.GOOGLE_OAUTH_REGISTRATION_ENDPOINT?.trim() ?? undefined;

  getRealm(): string {
    return this.realm;
  }

  getProtectedResourcePath(): string {
    return PROTECTED_RESOURCE_PATH;
  }

  getOpenIdConfigurationPath(): string {
    return OPENID_CONFIGURATION_PATH;
  }

  getRegistrationPath(): string {
    return OAUTH_REGISTRATION_PATH;
  }

  getRequiredScopes(): readonly string[] {
    return this.requiredScopes;
  }

  getBaseUrl(req: Request): string {
    const protocol = this.getRequestProtocol(req);
    const host = req.headers.host ?? 'localhost:3000';
    return `${protocol}://${host}`;
  }

  getMetadataUrl(req: Request): string {
    return `${this.getBaseUrl(req)}${PROTECTED_RESOURCE_PATH}`;
  }

  buildChallenge(metadataUrl: string, error: string, description?: string): string {
    return buildWwwAuthenticateHeader(metadataUrl, error, description, this.realm);
  }

  setCorsHeaders(res: Response): void {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }

  async requireAuth(
    req: Request,
    res: Response,
  ): Promise<{ token: VerifiedGoogleAccessToken; metadataUrl: string } | null> {
    const metadataUrl = this.getMetadataUrl(req);
    const token = this.extractBearerToken(req.headers.authorization);
    if (!token) {
      this.sendUnauthorized(res, metadataUrl, 'invalid_token', 'Missing Bearer token');
      return null;
    }

    const verified = await verifyGoogleAccessToken(token);
    if (!verified) {
      this.sendUnauthorized(res, metadataUrl, 'invalid_token', 'Unable to validate Google access token');
      return null;
    }
    return { token: verified, metadataUrl };
  }

  respondProtectedResource(req: Request, res: Response): void {
    const baseUrl = this.getBaseUrl(req);
    const payload: Record<string, unknown> = {
      issuer: baseUrl,
      resource: `${baseUrl}/mcp`,
      authorization_servers: [baseUrl],
      required_scopes: this.requiredScopes,
    };
    if (this.registrationEndpoint) {
      payload.registration_endpoint = this.registrationEndpoint;
    }
    this.setCorsHeaders(res);
    res.setHeader('Cache-Control', 'public, max-age=300');
    res.setHeader('Content-Type', 'application/json');
    res.status(200).json(payload);
  }

  respondOpenIdConfiguration(req: Request, res: Response): void {
    const baseUrl = this.getBaseUrl(req);
    const payload = {
      issuer: baseUrl,
      authorization_endpoint: GOOGLE_AUTHORIZATION_ENDPOINT,
      token_endpoint: GOOGLE_TOKEN_ENDPOINT,
      jwks_uri: GOOGLE_JWKS_URI,
      registration_endpoint: `${baseUrl}${OAUTH_REGISTRATION_PATH}`,
      response_types_supported: ['code'],
      grant_types_supported: ['authorization_code'],
      code_challenge_methods_supported: ['S256'],
      token_endpoint_auth_methods_supported: [GOOGLE_TOKEN_ENDPOINT_AUTH_METHOD],
      scopes_supported: this.requiredScopes,
    };
    this.setCorsHeaders(res);
    res.setHeader('Cache-Control', 'public, max-age=300');
    res.setHeader('Content-Type', 'application/json');
    res.status(200).json(payload);
  }

  handleDynamicRegistration(body: unknown, res: Response): void {
    this.setCorsHeaders(res);
    if (res.req?.method !== 'POST') {
      res.setHeader('Allow', 'POST');
      res.status(405).send('Method Not Allowed');
      return;
    }
    try {
      const payload = this.parseRegistrationBody(body);
      const issuedAt = Math.floor(Date.now() / 1000);
      const registrationResponse = {
        client_id: GOOGLE_OAUTH_CLIENT_ID,
        client_secret: GOOGLE_OAUTH_CLIENT_SECRET,
        client_id_issued_at: issuedAt,
        client_secret_expires_at: 0,
        token_endpoint_auth_method: GOOGLE_TOKEN_ENDPOINT_AUTH_METHOD,
        grant_types: ['authorization_code'],
        response_types: ['code'],
        scope: this.requiredScopes.join(' '),
        redirect_uris: payload.redirectUris,
      };
      res
        .status(201)
        .header('Content-Type', 'application/json')
        .json(registrationResponse);
    } catch (error) {
      this.logger.error('[OAuth] Registration error:', error as Error);
      res
        .status(400)
        .header('Content-Type', 'application/json')
        .json({ error: 'invalid_request', error_description: 'Unable to parse registration payload' });
    }
  }

  private parseRegistrationBody(body: unknown): { redirectUris: string[] } {
    if (!body || typeof body !== 'object') {
      return { redirectUris: [] };
    }
    const payload = body as Record<string, unknown>;
    const redirectUrisRaw = payload.redirect_uris;
    const redirectUris = Array.isArray(redirectUrisRaw)
      ? (redirectUrisRaw as unknown[]).filter(
          (value: unknown): value is string => typeof value === 'string',
        )
      : [];
    this.logger.log('[OAuth] Dynamic registration request', {
      redirectUris,
      applicationType: payload.application_type,
      clientName: payload.client_name,
    });
    return { redirectUris };
  }

  private sendUnauthorized(res: Response, metadataUrl: string, error: string, description?: string): void {
    this.setCorsHeaders(res);
    const challenge = this.buildChallenge(metadataUrl, error, description);
    res.setHeader('WWW-Authenticate', challenge);
    res
      .status(401)
      .header('Content-Type', 'application/json')
      .json({ error, error_description: description ?? 'Authorization required' });
  }

  private extractBearerToken(headerValue: string | undefined): string | undefined {
    if (typeof headerValue !== 'string') return undefined;
    const match = headerValue.match(/^\s*Bearer\s+(.+)\s*$/i);
    return match ? match[1]?.trim() : undefined;
  }

  private getRequestProtocol(req: Request): string {
    const forwarded = req.headers['x-forwarded-proto'];
    if (typeof forwarded === 'string' && forwarded.length > 0) {
      const [first] = forwarded.split(',');
      if (first?.trim()) return first.trim();
    }
    const encrypted = (req.socket as { encrypted?: boolean } | undefined)?.encrypted ?? false;
    if (encrypted) return 'https';
    if (typeof req.protocol === 'string' && req.protocol.length > 0) {
      return req.protocol;
    }
    return 'http';
  }
}
