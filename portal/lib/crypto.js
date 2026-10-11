/*
 * Web Crypto helpers.
 *
 * Only Web-standard APIs (crypto.subtle, TextEncoder, btoa/atob) are used so the
 * same code runs in Vercel's Edge runtime (middleware) and Node.js runtime
 * (API functions).
 */

const enc = new TextEncoder();
const dec = new TextDecoder();

export function utf8(s) {
  return enc.encode(String(s));
}

export function fromUtf8(bytes) {
  return dec.decode(bytes);
}

export function b64urlEncode(bytes) {
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let bin = '';
  for (let i = 0; i < arr.length; i++) bin += String.fromCharCode(arr[i]);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function b64urlDecode(str) {
  if (typeof str !== 'string' || !/^[A-Za-z0-9_-]*$/.test(str)) {
    throw new Error('invalid base64url');
  }
  const pad = str.length % 4 === 0 ? '' : '='.repeat(4 - (str.length % 4));
  const bin = atob(str.replace(/-/g, '+').replace(/_/g, '/') + pad);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export function randomBytes(n) {
  const b = new Uint8Array(n);
  crypto.getRandomValues(b);
  return b;
}

export function randomId() {
  return b64urlEncode(randomBytes(12));
}

/* HMAC keys are cached per secret string; importKey is comparatively slow. */
const hmacKeyCache = new Map();

export async function hmacKey(secret) {
  let key = hmacKeyCache.get(secret);
  if (!key) {
    key = await crypto.subtle.importKey(
      'raw', utf8(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']
    );
    if (hmacKeyCache.size > 32) hmacKeyCache.clear();
    hmacKeyCache.set(secret, key);
  }
  return key;
}

export async function hmacSign(secret, data) {
  const key = await hmacKey(secret);
  return new Uint8Array(await crypto.subtle.sign('HMAC', key, utf8(data)));
}

/** Constant-time verification (crypto.subtle.verify compares in constant time). */
export async function hmacVerify(secret, data, sigBytes) {
  const key = await hmacKey(secret);
  return crypto.subtle.verify('HMAC', key, sigBytes, utf8(data));
}

/**
 * Constant-time string equality. Both inputs are MACed under a random
 * per-call key so the comparison time does not depend on where they differ,
 * nor on their lengths.
 */
export async function safeEqual(a, b) {
  const k = b64urlEncode(randomBytes(32));
  const [x, y] = await Promise.all([hmacSign(k, String(a)), hmacSign(k, String(b))]);
  let diff = 0;
  for (let i = 0; i < x.length; i++) diff |= x[i] ^ y[i];
  return diff === 0;
}

export async function sha256(data) {
  return new Uint8Array(await crypto.subtle.digest('SHA-256', utf8(data)));
}

/* ---------- AES-256-GCM vault ---------------------------------------------- */

const aesKeyCache = new Map();

async function aesKey(secret) {
  let key = aesKeyCache.get(secret);
  if (!key) {
    // Domain-separated SHA-256 of the configured secret -> 256-bit AES key.
    const raw = await sha256('portal-vault-v1:' + secret);
    key = await crypto.subtle.importKey('raw', raw, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
    if (aesKeyCache.size > 8) aesKeyCache.clear();
    aesKeyCache.set(secret, key);
  }
  return key;
}

export const VAULT_PREFIX = 'enc:v1:';

export async function vaultEncrypt(secret, plaintext) {
  const key = await aesKey(secret);
  const iv = randomBytes(12);
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, utf8(plaintext)));
  return VAULT_PREFIX + b64urlEncode(iv) + ':' + b64urlEncode(ct);
}

/** Returns the plaintext, or throws if the value cannot be decrypted with this secret. */
export async function vaultDecrypt(secret, value) {
  const body = String(value).slice(VAULT_PREFIX.length);
  const [ivPart, ctPart] = body.split(':');
  if (!ivPart || !ctPart) throw new Error('malformed vault value');
  const key = await aesKey(secret);
  const pt = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: b64urlDecode(ivPart) }, key, b64urlDecode(ctPart)
  );
  return fromUtf8(new Uint8Array(pt));
}

export function isEncrypted(value) {
  return typeof value === 'string' && value.startsWith(VAULT_PREFIX);
}
