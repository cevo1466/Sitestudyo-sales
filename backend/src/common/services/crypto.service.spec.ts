import { ConfigService } from '@nestjs/config';
import { randomBytes } from 'node:crypto';
import { CryptoService } from './crypto.service';

function makeService(overrides: Record<string, string> = {}): CryptoService {
  const values: Record<string, string> = {
    ENCRYPTION_KEY: randomBytes(32).toString('hex'),
    IP_HASH_SALT: 'test-salt-en-az-onalti',
    INBOUND_HMAC_SECRET: 'test-inbound-secret-16',
    ...overrides,
  };
  const config = {
    getOrThrow: (key: string) => {
      const v = values[key];
      if (!v) throw new Error(`eksik: ${key}`);
      return v;
    },
  } as unknown as ConfigService;
  return new CryptoService(config);
}

describe('CryptoService', () => {
  describe('sifreleme', () => {
    it('sifreledigini geri cozer', () => {
      const svc = makeService();
      const secret = 'smtp-sifresi-çok-gizli-ĞÜŞİÖÇ';
      expect(svc.decrypt(svc.encrypt(secret))).toBe(secret);
    });

    it('ayni girdi icin her seferinde FARKLI sifreli metin uretir', () => {
      // Ayni IV tekrar kullanilirsa GCM'in guvenligi tamamen coker.
      const svc = makeService();
      const a = svc.encrypt('ayni-metin');
      const b = svc.encrypt('ayni-metin');
      expect(a.equals(b)).toBe(false);
    });

    it('kurcalanmis veriyi cozmeyi REDDEDER', () => {
      const svc = makeService();
      const enc = svc.encrypt('dokunma');
      enc[enc.length - 1] ^= 0xff; // son bayti boz
      expect(() => svc.decrypt(enc)).toThrow();
    });

    it('baska bir anahtarla cozulemez', () => {
      const a = makeService();
      const b = makeService(); // farkli rastgele anahtar
      expect(() => b.decrypt(a.encrypt('gizli'))).toThrow();
    });

    it('cok kisa veriyi anlasilir hatayla reddeder', () => {
      const svc = makeService();
      expect(() => svc.decrypt(Buffer.alloc(4))).toThrow(/bozuk/i);
    });

    it('JSON gidip gelir', () => {
      const svc = makeService();
      const value = { smtp: 'a', imap: 'b', port: 993 };
      expect(svc.decryptJson(svc.encryptJson(value))).toEqual(value);
    });
  });

  describe('hashIp', () => {
    it('ayni IP icin kararli, farkli IP icin farkli deger uretir', () => {
      const svc = makeService();
      expect(svc.hashIp('1.2.3.4')).toBe(svc.hashIp('1.2.3.4'));
      expect(svc.hashIp('1.2.3.4')).not.toBe(svc.hashIp('1.2.3.5'));
    });

    it('ham IP degerini icermez', () => {
      const svc = makeService();
      expect(svc.hashIp('185.48.180.25')).not.toContain('185');
    });

    it('bos deger icin null doner', () => {
      const svc = makeService();
      expect(svc.hashIp(null)).toBeNull();
      expect(svc.hashIp(undefined)).toBeNull();
    });

    it('farkli tuzlar farkli hash uretir', () => {
      const a = makeService({ IP_HASH_SALT: 'tuz-bir-onalti-kar' });
      const b = makeService({ IP_HASH_SALT: 'tuz-iki-onalti-kar' });
      expect(a.hashIp('1.2.3.4')).not.toBe(b.hashIp('1.2.3.4'));
    });
  });

  describe('verifyInboundSignature', () => {
    const sign = (secret: string, ts: string, body: string) =>
      require('node:crypto').createHmac('sha256', secret).update(`${ts}.${body}`).digest('hex');

    it('gecerli imzayi kabul eder', () => {
      const secret = 'test-inbound-secret-16';
      const svc = makeService({ INBOUND_HMAC_SECRET: secret });
      const ts = String(Math.floor(Date.now() / 1000));
      const body = '{"email":"a@b.com"}';
      expect(svc.verifyInboundSignature(body, ts, sign(secret, ts, body))).toBe(true);
    });

    it('govde degistirilmisse reddeder', () => {
      const secret = 'test-inbound-secret-16';
      const svc = makeService({ INBOUND_HMAC_SECRET: secret });
      const ts = String(Math.floor(Date.now() / 1000));
      const sig = sign(secret, ts, '{"email":"a@b.com"}');
      expect(svc.verifyInboundSignature('{"email":"saldirgan@b.com"}', ts, sig)).toBe(false);
    });

    it('eski istegi reddeder (tekrar saldirisi)', () => {
      const secret = 'test-inbound-secret-16';
      const svc = makeService({ INBOUND_HMAC_SECRET: secret });
      const old = String(Math.floor(Date.now() / 1000) - 600); // 10 dk once
      expect(svc.verifyInboundSignature('{}', old, sign(secret, old, '{}'))).toBe(false);
    });

    it('bos veya bozuk imzada patlamaz, false doner', () => {
      const svc = makeService();
      const ts = String(Math.floor(Date.now() / 1000));
      expect(svc.verifyInboundSignature('{}', ts, '')).toBe(false);
      expect(svc.verifyInboundSignature('{}', ts, 'kisa')).toBe(false);
      expect(svc.verifyInboundSignature('{}', 'sayi-degil', 'x')).toBe(false);
    });
  });

  describe('hashToken', () => {
    it('token duz metnini geri veremeyecek sekilde hash uretir', () => {
      const svc = makeService();
      const token = 'refresh-token-degeri';
      const hash = svc.hashToken(token);
      expect(hash).toHaveLength(64);
      expect(hash).not.toContain(token);
      expect(svc.hashToken(token)).toBe(hash);
    });
  });
});
