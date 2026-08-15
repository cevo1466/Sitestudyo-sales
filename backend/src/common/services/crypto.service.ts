import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  createCipheriv,
  createDecipheriv,
  createHash,
  createHmac,
  randomBytes,
  timingSafeEqual,
} from 'node:crypto';

const ALGO = 'aes-256-gcm';
const IV_LEN = 12; // GCM icin onerilen uzunluk
const TAG_LEN = 16;

/**
 * Mail hesabi sifreleri gibi GERI DONULEBILIR olmasi gereken sirlar icin.
 * Kullanici sifreleri buraya girmez — onlar argon2 ile tek yonlu hash'lenir.
 *
 * Bicim:  [12 bayt IV][16 bayt GCM etiketi][sifreli metin]
 * Tek bir Buffer olarak saklanir (mail_accounts.secretEnc).
 */
@Injectable()
export class CryptoService {
  private readonly key: Buffer;
  private readonly ipSalt: string;
  private readonly inboundSecret: string;

  constructor(config: ConfigService) {
    // env.ts acilista 64 hex karakter oldugunu dogruladi.
    this.key = Buffer.from(config.getOrThrow<string>('ENCRYPTION_KEY'), 'hex');
    this.ipSalt = config.getOrThrow<string>('IP_HASH_SALT');
    this.inboundSecret = config.getOrThrow<string>('INBOUND_HMAC_SECRET');
  }

  encrypt(plain: string): Buffer {
    const iv = randomBytes(IV_LEN);
    const cipher = createCipheriv(ALGO, this.key, iv);
    const enc = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
    return Buffer.concat([iv, cipher.getAuthTag(), enc]);
  }

  decrypt(payload: Buffer): string {
    if (payload.length < IV_LEN + TAG_LEN) {
      throw new Error('Sifreli veri bozuk: beklenenden kisa');
    }
    const iv = payload.subarray(0, IV_LEN);
    const tag = payload.subarray(IV_LEN, IV_LEN + TAG_LEN);
    const data = payload.subarray(IV_LEN + TAG_LEN);
    const decipher = createDecipheriv(ALGO, this.key, iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8');
  }

  encryptJson(value: unknown): Buffer {
    return this.encrypt(JSON.stringify(value));
  }

  decryptJson<T>(payload: Buffer): T {
    return JSON.parse(this.decrypt(payload)) as T;
  }

  /**
   * KVKK: ziyaretci IP'leri duz saklanmaz. Tuzlu hash geri cevrilemez ama
   * ayni IP her zaman ayni degeri urettigi icin oran sinirlama ve mukerrer
   * tespiti calismaya devam eder.
   */
  hashIp(ip: string | undefined | null): string | null {
    if (!ip) return null;
    return createHash('sha256').update(this.ipSalt).update(ip).digest('hex');
  }

  /** Refresh token'lar veritabaninda duz degil, hash'li tutulur. */
  hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  /** sitestudyo.com'dan gelen isteklerin imza dogrulamasi. */
  verifyInboundSignature(body: string, timestamp: string, signature: string): boolean {
    const age = Math.abs(Date.now() / 1000 - Number(timestamp));
    if (!Number.isFinite(age) || age > 300) return false; // 5 dk tolerans

    const expected = createHmac('sha256', this.inboundSecret)
      .update(`${timestamp}.${body}`)
      .digest('hex');

    const a = Buffer.from(expected, 'utf8');
    const b = Buffer.from(signature ?? '', 'utf8');
    // timingSafeEqual esit olmayan uzunlukta patlar; once uzunluk bakiyoruz.
    return a.length === b.length && timingSafeEqual(a, b);
  }
}
