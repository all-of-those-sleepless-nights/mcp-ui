import type { Request, Response } from 'express';
import { type VerifiedGoogleAccessToken } from './google';
export declare const PROTECTED_RESOURCE_PATH = "/.well-known/oauth-protected-resource";
export declare const OPENID_CONFIGURATION_PATH = "/.well-known/openid-configuration";
export declare const OAUTH_REGISTRATION_PATH = "/oauth/register";
export declare class OauthService {
    private readonly logger;
    private readonly requiredScopes;
    private readonly realm;
    private readonly registrationEndpoint;
    getRealm(): string;
    getProtectedResourcePath(): string;
    getOpenIdConfigurationPath(): string;
    getRegistrationPath(): string;
    getRequiredScopes(): readonly string[];
    getBaseUrl(req: Request): string;
    getMetadataUrl(req: Request): string;
    buildChallenge(metadataUrl: string, error: string, description?: string): string;
    setCorsHeaders(res: Response): void;
    requireAuth(req: Request, res: Response): Promise<{
        token: VerifiedGoogleAccessToken;
        metadataUrl: string;
    } | null>;
    respondProtectedResource(req: Request, res: Response): void;
    respondOpenIdConfiguration(req: Request, res: Response): void;
    handleDynamicRegistration(body: unknown, res: Response): void;
    private parseRegistrationBody;
    private sendUnauthorized;
    private extractBearerToken;
    private getRequestProtocol;
}
