/**
 * Log maskeleme.
 *
 * Bir hata nesnesini oldugu gibi loglamak, icindeki `password`, `token` veya
 * `apiKey` alanini da diske yazar; o log satiri sonra bir hata takip servisine
 * veya destek talebine kopyalanir. Loga giden her sey once buradan gecmeli.
 */
const SENSITIVE = [
  'password',
  'passwordhash',
  'currentpassword',
  'newpassword',
  'token',
  'accesstoken',
  'refreshtoken',
  'authorization',
  'cookie',
  'secret',
  'apikey',
  'api_key',
  'encryptionkey',
  'secretenc',
  'smtppassword',
  'imappassword',
];

const MASK = '***';
const MAX_DEPTH = 6;

export function redact(value: unknown, depth = 0): unknown {
  if (depth > MAX_DEPTH) return '[derinlik siniri]';
  if (value === null || value === undefined) return value;
  if (Buffer.isBuffer(value)) return `[Buffer ${value.length} bayt]`;
  if (Array.isArray(value)) return value.map((v) => redact(v, depth + 1));
  if (typeof value !== 'object') return value;

  const out: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
    out[key] = SENSITIVE.includes(key.toLowerCase()) ? MASK : redact(val, depth + 1);
  }
  return out;
}

/** Authorization: Bearer xxx -> Bearer *** */
export function redactHeaders(headers: Record<string, unknown>): Record<string, unknown> {
  return redact(headers) as Record<string, unknown>;
}
