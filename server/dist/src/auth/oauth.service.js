"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var OauthService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.OauthService = exports.OAUTH_REGISTRATION_PATH = exports.OPENID_CONFIGURATION_PATH = exports.PROTECTED_RESOURCE_PATH = void 0;
const common_1 = require("@nestjs/common");
const google_1 = require("./google");
exports.PROTECTED_RESOURCE_PATH = '/.well-known/oauth-protected-resource';
exports.OPENID_CONFIGURATION_PATH = '/.well-known/openid-configuration';
exports.OAUTH_REGISTRATION_PATH = '/oauth/register';
let OauthService = OauthService_1 = class OauthService {
    constructor() {
        this.logger = new common_1.Logger(OauthService_1.name);
        this.requiredScopes = [...(0, google_1.getRequiredScopes)()];
        this.realm = process.env.OAUTH_REALM && process.env.OAUTH_REALM.trim().length > 0
            ? process.env.OAUTH_REALM.trim()
            : 'ui-mcp';
        this.registrationEndpoint = process.env.GOOGLE_OAUTH_REGISTRATION_ENDPOINT?.trim() ?? undefined;
    }
    getRealm() {
        return this.realm;
    }
    getProtectedResourcePath() {
        return exports.PROTECTED_RESOURCE_PATH;
    }
    getOpenIdConfigurationPath() {
        return exports.OPENID_CONFIGURATION_PATH;
    }
    getRegistrationPath() {
        return exports.OAUTH_REGISTRATION_PATH;
    }
    getRequiredScopes() {
        return this.requiredScopes;
    }
    getBaseUrl(req) {
        const protocol = this.getRequestProtocol(req);
        const host = req.headers.host ?? 'localhost:3000';
        return `${protocol}://${host}`;
    }
    getMetadataUrl(req) {
        return `${this.getBaseUrl(req)}${exports.PROTECTED_RESOURCE_PATH}`;
    }
    buildChallenge(metadataUrl, error, description) {
        return (0, google_1.buildWwwAuthenticateHeader)(metadataUrl, error, description, this.realm);
    }
    setCorsHeaders(res) {
        res.setHeader('Access-Control-Allow-Origin', '*');
    }
    async requireAuth(req, res) {
        const metadataUrl = this.getMetadataUrl(req);
        const token = this.extractBearerToken(req.headers.authorization);
        if (!token) {
            this.sendUnauthorized(res, metadataUrl, 'invalid_token', 'Missing Bearer token');
            return null;
        }
        const verified = await (0, google_1.verifyGoogleAccessToken)(token);
        if (!verified) {
            this.sendUnauthorized(res, metadataUrl, 'invalid_token', 'Unable to validate Google access token');
            return null;
        }
        return { token: verified, metadataUrl };
    }
    respondProtectedResource(req, res) {
        const baseUrl = this.getBaseUrl(req);
        const payload = {
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
    respondOpenIdConfiguration(req, res) {
        const baseUrl = this.getBaseUrl(req);
        const payload = {
            issuer: baseUrl,
            authorization_endpoint: google_1.GOOGLE_AUTHORIZATION_ENDPOINT,
            token_endpoint: google_1.GOOGLE_TOKEN_ENDPOINT,
            jwks_uri: google_1.GOOGLE_JWKS_URI,
            registration_endpoint: `${baseUrl}${exports.OAUTH_REGISTRATION_PATH}`,
            response_types_supported: ['code'],
            grant_types_supported: ['authorization_code'],
            code_challenge_methods_supported: ['S256'],
            token_endpoint_auth_methods_supported: [google_1.GOOGLE_TOKEN_ENDPOINT_AUTH_METHOD],
            scopes_supported: this.requiredScopes,
        };
        this.setCorsHeaders(res);
        res.setHeader('Cache-Control', 'public, max-age=300');
        res.setHeader('Content-Type', 'application/json');
        res.status(200).json(payload);
    }
    handleDynamicRegistration(body, res) {
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
                client_id: google_1.GOOGLE_OAUTH_CLIENT_ID,
                client_secret: google_1.GOOGLE_OAUTH_CLIENT_SECRET,
                client_id_issued_at: issuedAt,
                client_secret_expires_at: 0,
                token_endpoint_auth_method: google_1.GOOGLE_TOKEN_ENDPOINT_AUTH_METHOD,
                grant_types: ['authorization_code'],
                response_types: ['code'],
                scope: this.requiredScopes.join(' '),
                redirect_uris: payload.redirectUris,
            };
            res
                .status(201)
                .header('Content-Type', 'application/json')
                .json(registrationResponse);
        }
        catch (error) {
            this.logger.error('[OAuth] Registration error:', error);
            res
                .status(400)
                .header('Content-Type', 'application/json')
                .json({ error: 'invalid_request', error_description: 'Unable to parse registration payload' });
        }
    }
    parseRegistrationBody(body) {
        if (!body || typeof body !== 'object') {
            return { redirectUris: [] };
        }
        const payload = body;
        const redirectUrisRaw = payload.redirect_uris;
        const redirectUris = Array.isArray(redirectUrisRaw)
            ? redirectUrisRaw.filter((value) => typeof value === 'string')
            : [];
        this.logger.log('[OAuth] Dynamic registration request', {
            redirectUris,
            applicationType: payload.application_type,
            clientName: payload.client_name,
        });
        return { redirectUris };
    }
    sendUnauthorized(res, metadataUrl, error, description) {
        this.setCorsHeaders(res);
        const challenge = this.buildChallenge(metadataUrl, error, description);
        res.setHeader('WWW-Authenticate', challenge);
        res
            .status(401)
            .header('Content-Type', 'application/json')
            .json({ error, error_description: description ?? 'Authorization required' });
    }
    extractBearerToken(headerValue) {
        if (typeof headerValue !== 'string')
            return undefined;
        const match = headerValue.match(/^\s*Bearer\s+(.+)\s*$/i);
        return match ? match[1]?.trim() : undefined;
    }
    getRequestProtocol(req) {
        const forwarded = req.headers['x-forwarded-proto'];
        if (typeof forwarded === 'string' && forwarded.length > 0) {
            const [first] = forwarded.split(',');
            if (first?.trim())
                return first.trim();
        }
        const encrypted = req.socket?.encrypted ?? false;
        if (encrypted)
            return 'https';
        if (typeof req.protocol === 'string' && req.protocol.length > 0) {
            return req.protocol;
        }
        return 'http';
    }
};
exports.OauthService = OauthService;
exports.OauthService = OauthService = OauthService_1 = __decorate([
    (0, common_1.Injectable)()
], OauthService);
//# sourceMappingURL=oauth.service.js.map