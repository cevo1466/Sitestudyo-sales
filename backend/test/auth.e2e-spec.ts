import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/common/prisma/prisma.service';
import { AuthService } from '../src/modules/auth/auth.service';
import { UserRole } from '@prisma/client';

/**
 * Gercek veritabanina kosar (CI'da MariaDB servisi, yerelde salesos).
 * Kimlik dogrulama, mock'la test edilmesi en anlamsiz katman: sorunlar
 * tam da gercek sorgu ve gercek token akisinda cikiyor.
 */
describe('Auth (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const EMAIL = `e2e-${Date.now()}@test.local`;
  const PASSWORD = 'e2e-Test-Parola-123';

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication<NestFastifyApplication>(new FastifyAdapter());
    app.setGlobalPrefix('api/v1');
    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    prisma = app.get(PrismaService);
    await prisma.user.create({
      data: {
        email: EMAIL,
        name: 'E2E Kullanici',
        role: UserRole.ADMIN,
        passwordHash: await AuthService.hashPassword(PASSWORD),
      },
    });
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: EMAIL } });
    await app.close();
  });

  const server = () => app.getHttpServer();

  describe('GET /health', () => {
    it('kimlik dogrulamasiz erisilebilir (istemcinin baglanti testi)', async () => {
      const res = await request(server()).get('/api/v1/health').expect(200);
      expect(res.body.status).toBe('ok');
      expect(res.body.serverName).toBeTruthy();
    });

    it('veritabani/surum ayrintisini disari vermez', async () => {
      const res = await request(server()).get('/api/v1/health');
      const text = JSON.stringify(res.body).toLowerCase();
      expect(text).not.toContain('mysql');
      expect(text).not.toContain('mariadb');
      expect(text).not.toContain('prisma');
    });
  });

  describe('POST /auth/login', () => {
    it('dogru bilgilerle token cifti verir', async () => {
      const res = await request(server())
        .post('/api/v1/auth/login')
        .send({ email: EMAIL, password: PASSWORD })
        .expect(200);

      expect(res.body.accessToken).toBeTruthy();
      expect(res.body.refreshToken).toBeTruthy();
      expect(res.body.user.email).toBe(EMAIL);
      // Sifre hash'i cevaba ASLA sizmamali
      expect(JSON.stringify(res.body)).not.toContain('argon2');
      expect(res.body.user.passwordHash).toBeUndefined();
    });

    it('e-postayi buyuk/kucuk harften bagimsiz kabul eder', async () => {
      await request(server())
        .post('/api/v1/auth/login')
        .send({ email: EMAIL.toUpperCase(), password: PASSWORD })
        .expect(200);
    });

    it('yanlis sifreyi reddeder', async () => {
      const res = await request(server())
        .post('/api/v1/auth/login')
        .send({ email: EMAIL, password: 'yanlis-parola' })
        .expect(401);
      expect(res.body.code).toBe('invalid_credentials');
    });

    it('olmayan kullanicida AYNI hatayi verir (kullanici numaralandirmayi engeller)', async () => {
      const res = await request(server())
        .post('/api/v1/auth/login')
        .send({ email: 'yok@test.local', password: 'herhangi' })
        .expect(401);
      expect(res.body.code).toBe('invalid_credentials');
    });

    it('bozuk govdeyi alan bazli hatayla reddeder', async () => {
      const res = await request(server())
        .post('/api/v1/auth/login')
        .send({ email: 'eposta-degil', password: '' })
        .expect(400);
      expect(res.body.code).toBe('validation_error');
      expect(res.body.fields.email).toBeTruthy();
    });
  });

  describe('GET /auth/me', () => {
    it('gecerli token ile kullaniciyi doner', async () => {
      const login = await request(server())
        .post('/api/v1/auth/login')
        .send({ email: EMAIL, password: PASSWORD });

      const res = await request(server())
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${login.body.accessToken}`)
        .expect(200);
      expect(res.body.email).toBe(EMAIL);
    });

    it('tokensiz istegi reddeder', async () => {
      await request(server()).get('/api/v1/auth/me').expect(401);
    });

    it('uydurma token reddedilir', async () => {
      await request(server())
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer uydurma.token.degeri')
        .expect(401);
    });

    it('refresh token, erisim token yerine KULLANILAMAZ', async () => {
      const login = await request(server())
        .post('/api/v1/auth/login')
        .send({ email: EMAIL, password: PASSWORD });

      await request(server())
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${login.body.refreshToken}`)
        .expect(401);
    });
  });

  describe('POST /auth/refresh — rotasyon', () => {
    it('yeni bir cift verir ve eskisini kapatir', async () => {
      const login = await request(server())
        .post('/api/v1/auth/login')
        .send({ email: EMAIL, password: PASSWORD });

      const refreshed = await request(server())
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: login.body.refreshToken })
        .expect(200);

      expect(refreshed.body.refreshToken).not.toBe(login.body.refreshToken);
      expect(refreshed.body.accessToken).toBeTruthy();
    });

    it('AYNI token ikinci kez kullanilirsa tum oturum ailesini iptal eder', async () => {
      const login = await request(server())
        .post('/api/v1/auth/login')
        .send({ email: EMAIL, password: PASSWORD });

      // 1. kullanim: normal
      const first = await request(server())
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: login.body.refreshToken })
        .expect(200);

      // 2. kullanim: calinmis token senaryosu
      const reuse = await request(server())
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: login.body.refreshToken })
        .expect(401);
      expect(reuse.body.code).toBe('token_reuse_detected');

      // Kritik: mesru olarak uretilmis olan yeni token DA artik gecersiz —
      // saldirgan zincire girdiyse orasi da kapanmali.
      await request(server())
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: first.body.refreshToken })
        .expect(401);
    });

    it('bilinmeyen token reddedilir', async () => {
      const res = await request(server())
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: 'bilinmeyen-token-degeri-yeterince-uzun' })
        .expect(401);
      expect(res.body.code).toBe('invalid_refresh_token');
    });
  });

  describe('POST /auth/logout', () => {
    it('cikistan sonra refresh token calismaz', async () => {
      const login = await request(server())
        .post('/api/v1/auth/login')
        .send({ email: EMAIL, password: PASSWORD });

      await request(server())
        .post('/api/v1/auth/logout')
        .send({ refreshToken: login.body.refreshToken })
        .expect(204);

      await request(server())
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: login.body.refreshToken })
        .expect(401);
    });
  });

  describe('devre disi hesap', () => {
    it('isActive=false olunca giris yapamaz', async () => {
      const email = `disabled-${Date.now()}@test.local`;
      await prisma.user.create({
        data: {
          email,
          name: 'Kapali',
          role: UserRole.SALES,
          isActive: false,
          passwordHash: await AuthService.hashPassword(PASSWORD),
        },
      });

      const res = await request(server())
        .post('/api/v1/auth/login')
        .send({ email, password: PASSWORD })
        .expect(401);
      expect(res.body.code).toBe('account_disabled');

      await prisma.user.deleteMany({ where: { email } });
    });
  });
});
