// Credenciais e JWT nativos WebCrypto, compatíveis com Cloudflare Workers Free.
const encoder = new TextEncoder();
const decoder = new TextDecoder();
const iterations = 120000;
function b64(bytes) {
  let raw = '';
  for (const b of new Uint8Array(bytes)) raw += String.fromCharCode(b);
  return btoa(raw).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}
function fromB64(value) {
  const str = String(value).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(str + '='.repeat((4 - str.length % 4) % 4));
  return Uint8Array.from(raw, ch => ch.charCodeAt(0));
}
async function digest(buffer) { return new Uint8Array(await crypto.subtle.digest('SHA-256', buffer)); }
export async function hashPassword(password) {
  if (typeof password !== 'string' || password.length < 8 || password.length > 256)
    throw new ApiError(400, 'Senha deve ter entre 8 e 256 caracteres.');
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']);
  const hash = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations, hash: 'SHA-256' }, key, 256);
  return 'pbkdf2-sha256$' + iterations + '$' + b64(salt) + '$' + b64(hash);
}
export async function verifyPassword(password, stored) {
  const fields = String(stored || '').split('$');
  if (fields.length !== 4 || fields[0] !== 'pbkdf2-sha256') return false;
  const count = Number(fields[1]);
  if (count < 100000 || count > 500000 || typeof password !== 'string') return false;
  const salt = fromB64(fields[2]);
  const key = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']);
  const actual = new Uint8Array(await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: count, hash: 'SHA-256' }, key, 256
  ));
  const expected = fromB64(fields[3]);
  if (actual.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < actual.length; i++) diff |= actual[i] ^ expected[i];
  return diff === 0;
}
function checkJwtSecret(env) {
  const secret = String(env.JWT_SECRET || '');
  if (encoder.encode(secret).length < 32) throw new ApiError(503, 'Segredo de autenticação não configurado.');
  return secret;
}
async function hmac(secret, data) {
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return new Uint8Array(await crypto.subtle.sign('HMAC', key, encoder.encode(data)));
}
export async function signJwt(env, user) {
  const now = Math.floor(Date.now() / 1000);
  const payload = { sub: user.id, role: user.role_code, iat: now, exp: now + 86400 };
  const header = b64(encoder.encode(JSON.stringify({ alg: 'HS256', typ: 'JWT' })));
  const body = b64(encoder.encode(JSON.stringify(payload)));
  const signed = header + '.' + body;
  return signed + '.' + b64(await hmac(checkJwtSecret(env), signed));
}
export async function verifyJwt(env, token) {
  const segments = String(token || '').split('.');
  if (segments.length !== 3) throw new ApiError(401, 'Token inválido.');
  const header = JSON.parse(decoder.decode(fromB64(segments[0])));
  if (header.alg !== 'HS256') throw new ApiError(401, 'Token inválido.');
  const actual = b64(await hmac(checkJwtSecret(env), segments[0] + '.' + segments[1]));
  const expected = segments[2];
  if (actual.length !== expected.length) throw new ApiError(401, 'Token inválido.');
  let diff = 0;
  for (let i = 0; i < actual.length; i++) diff |= actual.charCodeAt(i) ^ expected.charCodeAt(i);
  if (diff !== 0) throw new ApiError(401, 'Token inválido.');
  const payload = JSON.parse(decoder.decode(fromB64(segments[1])));
  if (!payload.sub || !Number.isInteger(payload.exp) || payload.exp <= Date.now() / 1000) {
    throw new ApiError(401, 'Sessão expirada.');
  }
  return payload;
}
export async function verifyBootstrapKey(env, supplied) {
  const secret = String(env.BOOTSTRAP_TOKEN || '');
  if (secret.length < 32 || !supplied) return false;
  const a = await digest(encoder.encode(secret));
  const b = await digest(encoder.encode(supplied));
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}
export class ApiError extends Error {
  constructor(status, message, code = null) {
    super(message);
    this.status = status;
    this.code = code;
  }
}
export const makeId = prefix => prefix + '_' + crypto.randomUUID().replace(/-/g, '');
export const normalizeEmail = value => String(value || '').trim().toLowerCase();
export const normalizePlate = value => String(value || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
export function sanitizeString(value, max = 150) {
  return String(value || '').trim().slice(0, max);
}
