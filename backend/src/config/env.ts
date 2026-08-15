import { z } from 'zod';

/**
 * Ortam degiskenlerinin TEK dogrulama noktasi.
 *
 * Neden acilista dogruluyoruz: eksik/bozuk bir ENCRYPTION_KEY ile ayaga kalkan
 * bir servis, sorunu ancak birisi mail hesabi kaydetmeye calistiginda gosterir
 * — yani en kotu anda. Burada patlarsa konteyner hic baslamaz, bu iyi bir sey.
 */
export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  ROLE: z.enum(['api', 'worker']).default('api'),
  PORT: z.coerce.number().int().positive().default(5080),
  SERVER_NAME: z.string().default('SiteStudyo Sales OS'),

  DATABASE_URL: z.string().min(1, 'DATABASE_URL zorunlu'),
  REDIS_URL: z.string().min(1, 'REDIS_URL zorunlu'),

  JWT_SECRET: z.string().min(32, 'JWT_SECRET en az 32 karakter olmali'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET en az 32 karakter olmali'),
  JWT_ACCESS_TTL: z.string().default('15m'),
  JWT_REFRESH_TTL: z.string().default('30d'),

  // AES-256-GCM 32 baytlik anahtar ister; hex olarak tam 64 karakter.
  ENCRYPTION_KEY: z
    .string()
    .regex(/^[0-9a-fA-F]{64}$/, 'ENCRYPTION_KEY 64 hex karakter olmali (openssl rand -hex 32)'),

  PLACE_PROVIDER: z.enum(['apify', 'google']).default('apify'),
  APIFY_TOKEN: z.string().default(''),
  APIFY_TOKEN_SECONDARY: z.string().default(''),
  APIFY_PLACES_ACTOR: z.string().default('compass/crawler-google-places'),
  GOOGLE_PLACES_API_KEY: z.string().default(''),

  INBOUND_HMAC_SECRET: z.string().min(16),
  IP_HASH_SALT: z.string().min(16),

  RATE_LIMIT_LOGIN_PER_MIN: z.coerce.number().int().positive().default(5),
  RATE_LIMIT_INBOUND_PER_MIN: z.coerce.number().int().positive().default(20),
  RATE_LIMIT_GLOBAL_PER_MIN: z.coerce.number().int().positive().default(300),

  CORS_ORIGINS: z.string().default('tauri://localhost,http://localhost:5173'),
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv(raw: Record<string, unknown>): Env {
  const parsed = envSchema.safeParse(raw);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join('.')}: ${i.message}`)
      .join('\n');
    throw new Error(`Ortam degiskenleri gecersiz:\n${issues}`);
  }
  return parsed.data;
}

export function corsOrigins(env: Env): string[] {
  return env.CORS_ORIGINS.split(',')
    .map((o) => o.trim())
    .filter(Boolean);
}
