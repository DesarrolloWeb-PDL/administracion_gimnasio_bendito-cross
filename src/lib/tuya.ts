import crypto from 'crypto';

// Tuya Cloud OpenAPI client (Western America endpoint by default).
// Signing scheme verified against the live API: HMAC-SHA256 over
// clientId [+ accessToken] + t + nonce + stringToSign, uppercase hex.

const EMPTY_BODY_SHA256 =
  'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';

const DEFAULT_ENDPOINT = 'https://openapi.tuyaus.com';
const TOKEN_REFRESH_MARGIN_MS = 120_000; // refresh token when within 120s of expiry

type SignRequestParams = {
  secret: string;
  clientId: string;
  method: string; // 'GET' | 'POST' | ...
  pathWithQuery: string; // e.g. '/v1.0/token?grant_type=1'
  body?: string | undefined; // raw body string; undefined = empty body
  accessToken?: string | undefined;
  t: string; // 13-digit ms timestamp as string
  nonce: string;
};

// Pure lowercase-hex sha256 of the raw body; empty body uses the known
// sha256('') constant (never an empty string in stringToSign).
function contentHash(body: string | undefined): string {
  if (body === undefined || body === '') return EMPTY_BODY_SHA256;
  return crypto.createHash('sha256').update(body, 'utf8').digest('hex');
}

// Low-level signer: HMAC-SHA256(secret, signInput) as UPPERCASE hex.
export function buildSign(secret: string, signInput: string): string {
  return crypto
    .createHmac('sha256', secret)
    .update(signInput, 'utf8')
    .digest('hex')
    .toUpperCase();
}

// Full request signer. headersBlock is empty (no custom Signature-Headers),
// so stringToSign is `${METHOD}\n${contentSha256}\n\n${pathWithQuery}`.
export function signRequest(params: SignRequestParams): string {
  const contentSha256 = contentHash(params.body);
  const stringToSign = `${params.method.toUpperCase()}\n${contentSha256}\n\n${params.pathWithQuery}`;
  const signInput = params.accessToken
    ? `${params.clientId}${params.accessToken}${params.t}${params.nonce}${stringToSign}`
    : `${params.clientId}${params.t}${params.nonce}${stringToSign}`;
  return buildSign(params.secret, signInput);
}

// --- Token cache (module scope on globalThis to survive HMR) ---

type TokenCache = { token: string; expiresAt: number }; // expiresAt in epoch ms

function globalStore(): { __tuyaTokenCache?: TokenCache } {
  return globalThis as { __tuyaTokenCache?: TokenCache };
}

export function clearTokenCache(): void {
  delete globalStore().__tuyaTokenCache;
}

// --- Configuration ---

export function isPuertaHabilitada(): boolean {
  return process.env.TUYA_ENABLED === 'true';
}

function getPulseSeconds(): number {
  const raw = Number(process.env.TUYA_PULSE_SECONDS ?? '3');
  return Number.isFinite(raw) && raw > 0 ? raw : 3;
}

function getPulseMode(): 'energize' | 'release' {
  return process.env.TUYA_PULSE_MODE === 'release' ? 'release' : 'energize';
}

// --- Cloud request ---

async function request(
  pathWithQuery: string,
  options: { method: 'GET' | 'POST'; body?: string },
): Promise<unknown> {
  const clientId = process.env.TUYA_ACCESS_ID;
  const secret = process.env.TUYA_ACCESS_SECRET;
  if (!clientId || !secret) {
    throw new Error('TUYA_ACCESS_ID / TUYA_ACCESS_SECRET not configured');
  }
  const endpoint = process.env.TUYA_ENDPOINT || DEFAULT_ENDPOINT;

  const isTokenRequest = pathWithQuery.startsWith('/v1.0/token');
  const accessToken = isTokenRequest ? undefined : await getAccessToken();

  const t = Date.now().toString();
  const nonce = crypto.randomUUID().replace(/-/g, '');
  const sign = signRequest({
    secret,
    clientId,
    method: options.method,
    pathWithQuery,
    body: options.body,
    accessToken,
    t,
    nonce,
  });

  const headers: Record<string, string> = {
    client_id: clientId,
    sign,
    sign_method: 'HMAC-SHA256',
    t,
    nonce,
  };
  if (accessToken) headers.access_token = accessToken;
  if (options.body !== undefined) headers['Content-Type'] = 'application/json';

  const res = await fetch(`${endpoint}${pathWithQuery}`, {
    method: options.method,
    headers,
    body: options.body,
  });

  const json = (await res.json()) as {
    success?: boolean;
    result?: unknown;
    code?: number;
    msg?: string;
  };
  if (!res.ok || json.success !== true) {
    throw new Error(
      `Tuya API ${options.method} ${pathWithQuery} failed (HTTP ${res.status}, code ${json.code}): ${json.msg ?? 'unknown error'}`,
    );
  }
  return json.result;
}

async function getAccessToken(): Promise<string> {
  const cache = globalStore().__tuyaTokenCache;
  if (cache && Date.now() < cache.expiresAt - TOKEN_REFRESH_MARGIN_MS) {
    return cache.token;
  }
  const result = (await request('/v1.0/token?grant_type=1', { method: 'GET' })) as {
    access_token: string;
    expire_time: number; // seconds
  };
  globalStore().__tuyaTokenCache = {
    token: result.access_token,
    expiresAt: Date.now() + result.expire_time * 1000,
  };
  return result.access_token;
}

// --- Public door API ---

export type AbrirPuertaResult = { ok: boolean; skipped?: boolean; error?: string };

async function sendSwitchCommand(deviceId: string, value: boolean): Promise<void> {
  const body = JSON.stringify({ commands: [{ code: 'switch_1', value }] });
  await request(`/v1.0/devices/${deviceId}/commands`, { method: 'POST', body });
}

export async function abrirPuerta(): Promise<AbrirPuertaResult> {
  if (!isPuertaHabilitada()) return { ok: true, skipped: true };

  const deviceId = process.env.TUYA_DEVICE_ID;
  if (!deviceId) return { ok: false, error: 'TUYA_DEVICE_ID not configured' };

  const pulseSeconds = getPulseSeconds();

  try {
    if (getPulseMode() === 'release') {
      // Electromagnetic lock: default-powered = locked. Cut power to release,
      // re-engage after the pulse.
      await sendSwitchCommand(deviceId, false);
      await new Promise((resolve) => setTimeout(resolve, pulseSeconds * 1000));
      await sendSwitchCommand(deviceId, true);
    } else {
      // Energize mode: single command; countdown_1 makes the device auto-off
      // locally after N seconds.
      const body = JSON.stringify({
        commands: [
          { code: 'switch_1', value: true },
          { code: 'countdown_1', value: pulseSeconds },
        ],
      });
      await request(`/v1.0/devices/${deviceId}/commands`, { method: 'POST', body });
    }
    return { ok: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('abrirPuerta failed:', message);
    return { ok: false, error: message };
  }
}
