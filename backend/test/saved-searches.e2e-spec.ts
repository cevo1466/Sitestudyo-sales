import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import request from 'supertest';
import { UserRole } from '@prisma/client';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/common/prisma/prisma.service';
import { AuthService } from '../src/modules/auth/auth.service';

describe('SavedSearches (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let token: string;

  const EMAIL = `ss-${Date.now()}@test.local`;
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
        name: 'Saved Test',
        role: UserRole.ADMIN,
        passwordHash: await AuthService.hashPassword(PASSWORD),
      },
    });
    const login = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: EMAIL, password: PASSWORD });
    token = login.body.accessToken;
  }, 120000);

  afterAll(async () => {
    const me = await prisma.user.findUnique({ where: { email: EMAIL } });
    if (me) await prisma.savedSearch.deleteMany({ where: { userId: me.id } });
    await prisma.user.deleteMany({ where: { email: EMAIL } });
    await app.close();
  });

  const bearer = () => `Bearer ${token}`;
  const post = (body: object) =>
    request(app.getHttpServer())
      .post('/api/v1/saved-searches')
      .set('Authorization', bearer())
      .send(body);

  it('arama kaydeder', async () => {
    const res = await post({
      name: 'Ankara - Sitesi Yok',
      params: { city: 'Ankara', websiteStatus: ['NO_WEBSITE'] },
    }).expect(201);
    expect(res.body.name).toBe('Ankara - Sitesi Yok');
  });

  it('gecersiz filtre parametresini reddeder', async () => {
    // Kaydedilen filtre ileride oldugu gibi calistirilacak; bozuk bir filtreyi
    // simdi kabul etmek, sorunu aylar sonraya ertelemek olur.
    const res = await post({
      name: 'Bozuk',
      params: { websiteStatus: ['UYDURMA_DURUM'] },
    }).expect(400);
    expect(res.body.code).toBe('validation_error');
  });

  it('ayni isimle ikinci kayit olmaz', async () => {
    const body = { name: 'Tekrar', params: { city: 'Izmir' } };
    await post(body).expect(201);
    const res = await post(body).expect(409);
    expect(res.body.code).toBe('duplicate');
  });

  it('yalnizca kendi aramalarini listeler ve silebilir', async () => {
    const other = await prisma.user.create({
      data: {
        email: `other-${Date.now()}@test.local`,
        name: 'Baskasi',
        passwordHash: await AuthService.hashPassword('x-Parola-123'),
      },
    });
    const foreign = await prisma.savedSearch.create({
      data: { userId: other.id, name: 'Baskasinin aramasi', params: {} },
    });

    const list = await request(app.getHttpServer())
      .get('/api/v1/saved-searches')
      .set('Authorization', bearer())
      .expect(200);
    expect(list.body.find((s: { id: string }) => s.id === foreign.id)).toBeUndefined();

    // "var ama senin degil" bilgisi bile sizmamali: 403 degil 404.
    await request(app.getHttpServer())
      .delete(`/api/v1/saved-searches/${foreign.id}`)
      .set('Authorization', bearer())
      .expect(404);

    await prisma.savedSearch.deleteMany({ where: { userId: other.id } });
    await prisma.user.delete({ where: { id: other.id } });
  });
});
