import { URL } from 'node:url';

export type TokenInfoResponse = {
  aud?: string;
  exp?: string;
  expires_in?: string;
  scope?: string;
  sub?: string;
  email?: string;
  azp?: string;
  [key: string]: unknown;
};

export type VerifiedGoogleAccessToken = {
  token: string;
  subject: string;
  clientId?: string;
  scopes: string[];
  expiresAt: number;
  claims: TokenInfoResponse;
};

const TOKENINFO_ENDPOINT = 'https://oauth2.googleapis.com/tokeninfo';
const DEFAULT_SCOPE_STRING =
  'openid https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile';

export const GOOGLE_OAUTH_CLIENT_ID = process.env.GOOGLE_OAUTH_CLIENT_ID ?? '';

export const GOOGLE_OAUTH_CLIENT_SECRET =
  process.env.GOOGLE_OAUTH_CLIENT_SECRET ?? '';

export const GOOGLE_TOKEN_ENDPOINT_AUTH_METHOD = 'client_secret_post';
export const GOOGLE_AUTHORIZATION_ENDPOINT =
  'https://accounts.google.com/o/oauth2/v2/auth';
export const GOOGLE_TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';
export const GOOGLE_JWKS_URI = 'https://www.googleapis.com/oauth2/v3/certs';
export const GOOGLE_OPENID_ISSUER = 'https://accounts.google.com';
export const GOOGLE_USERINFO_ENDPOINT =
  'https://openidconnect.googleapis.com/v1/userinfo';

const SCOPE_EQUIVALENTS: Record<string, readonly string[]> = {
  openid: ['openid'],
  email: ['email', 'https://www.googleapis.com/auth/userinfo.email'],
  profile: ['profile', 'https://www.googleapis.com/auth/userinfo.profile'],
};

const canonicalizeScope = (scope: string): string => {
  for (const [canonical, variants] of Object.entries(SCOPE_EQUIVALENTS)) {
    if (variants.includes(scope)) {
      return canonical;
    }
  }
  return scope;
};

const requiredScopes = (
  process.env.GOOGLE_OAUTH_REQUIRED_SCOPES ?? DEFAULT_SCOPE_STRING
)
  .split(/\s+/)
  .map((scope) => scope.trim())
  .filter((scope) => scope.length > 0);

const normalizedRequiredScopes = Array.from(
  new Set(requiredScopes.map((scope) => canonicalizeScope(scope))),
);

const allowedAudiences = (process.env.GOOGLE_OAUTH_ALLOWED_AUDIENCES ?? '')
  .split(',')
  .map((value) => value.trim())
  .filter((value) => value.length > 0);

const allowedClientIds = (process.env.GOOGLE_OAUTH_ALLOWED_CLIENT_IDS ?? '')
  .split(',')
  .map((value) => value.trim())
  .filter((value) => value.length > 0);

const tokenCache = new Map<string, VerifiedGoogleAccessToken>();

const minimumCacheSlackMs = 5_000;
const requestTimeoutMs = Number(
  process.env.GOOGLE_OAUTH_TOKENINFO_TIMEOUT_MS ?? '5000',
);

function hasRequiredScopes(scopes: string[]): boolean {
  if (normalizedRequiredScopes.length === 0) return true;
  const scopeSet = new Set(scopes.map((scope) => canonicalizeScope(scope)));
  return normalizedRequiredScopes.every((scope) => scopeSet.has(scope));
}

function isAudienceAllowed(aud?: string): boolean {
  if (!aud || allowedAudiences.length === 0) return true;
  return allowedAudiences.includes(aud);
}

function isClientAllowed(clientId?: string): boolean {
  if (!clientId || allowedClientIds.length === 0) return true;
  return allowedClientIds.includes(clientId);
}

async function fetchTokenInfo(
  token: string,
  signal: AbortSignal,
): Promise<TokenInfoResponse | null> {
  try {
    const url = new URL(TOKENINFO_ENDPOINT);
    url.searchParams.set('access_token', token);
    const response = await fetch(url, { signal });
    if (!response.ok) {
      return null;
    }
    const data = (await response.json()) as TokenInfoResponse;
    return data;
  } catch (error) {
    console.error('[OAuth] Failed to query Google tokeninfo endpoint:', error);
    return null;
  }
}

export async function verifyGoogleAccessToken(
  token: string,
): Promise<VerifiedGoogleAccessToken | null> {
  const cached = tokenCache.get(token);
  if (cached && cached.expiresAt - Date.now() > minimumCacheSlackMs) {
    return cached;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(
    () => controller.abort('timeout'),
    Math.max(requestTimeoutMs, 1000),
  );
  try {
    const info = await fetchTokenInfo(token, controller.signal);
    if (!info) return null;
    const scopeString = typeof info.scope === 'string' ? info.scope : '';
    const scopes = scopeString
      .split(/\s+/)
      .map((scope) => scope.trim())
      .filter((scope) => scope.length > 0);
    const audience = typeof info.aud === 'string' ? info.aud : undefined;
    const authorizedParty = typeof info.azp === 'string' ? info.azp : undefined;
    if (!isAudienceAllowed(audience)) {
      console.warn('[OAuth] Token audience not permitted:', {
        audience,
        allowedAudiences,
      });
      return null;
    }
    if (!isClientAllowed(authorizedParty ?? audience)) {
      console.warn('[OAuth] Token client not permitted:', {
        clientId: authorizedParty ?? audience,
        allowedClientIds,
      });
      return null;
    }

    const expiresInSeconds = Number(info.expires_in ?? info.exp ?? 0);
    const expiresAt = Number.isFinite(expiresInSeconds)
      ? Date.now() + Math.max(expiresInSeconds, 0) * 1000
      : Date.now() + 60_000;
    const subject =
      typeof info.sub === 'string'
        ? info.sub
        : typeof info.email === 'string'
          ? info.email
          : 'unknown';

    if (!hasRequiredScopes(scopes)) {
      const missingScopes = normalizedRequiredScopes.filter(
        (scope) =>
          !scopes.map((value) => canonicalizeScope(value)).includes(scope),
      );
      console.warn('[OAuth] Token missing required scopes:', {
        required: requiredScopes,
        normalizedRequired: normalizedRequiredScopes,
        presented: scopes,
        missing: missingScopes,
      });
    } else {
      console.log('[OAuth] Token scopes accepted:', scopes);
    }

    console.log('[OAuth] Token audience:', audience);

    const verified: VerifiedGoogleAccessToken = {
      token,
      subject,
      clientId: authorizedParty ?? audience,
      scopes,
      expiresAt,
      claims: info,
    };
    tokenCache.set(token, verified);
    return verified;
  } finally {
    clearTimeout(timeoutId);
  }
}

export function clearTokenCache(): void {
  tokenCache.clear();
}

export function getRequiredScopes(): readonly string[] {
  return requiredScopes;
}

export function buildWwwAuthenticateHeader(
  metadataUrl: string,
  error?: string,
  description?: string,
  realm = 'ui-mcp',
): string {
  const parts = [`Bearer realm="${realm}"`];
  if (requiredScopes.length > 0) {
    parts.push(`scope="${requiredScopes.join(' ')}"`);
  }
  parts.push(`authorization_uri="${metadataUrl}"`);
  if (error) {
    parts.push(`error="${error}"`);
  }
  if (description) {
    parts.push(`error_description="${description.replace(/"/g, "'")}"`);
  }
  return parts.join(', ');
}
