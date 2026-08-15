import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import request from 'supertest';
import { LeadGrade, UserRole, WebsiteStatus } from '@prisma/client';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/common/prisma/prisma.service';
import { AuthService } from '../src/modules/auth/auth.service';
import { makeCompany, cleanupCompanies } from './factories';

describe('Companies (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let token: string;

  const EMAIL = `co-${Date.now()}@test.local`;
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
        name: 'CRM Test',
        role: UserRole.ADMIN,
        passwordHash: await AuthService.hashPassword(PASSWORD),
      },
    });
    const login = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: EMAIL, password: PASSWORD });
    token = login.body.accessToken;

    await cleanupCompanies(prisma);
    // Puanlar bilerek TEKRARLI: imlecin esitlik bozucusunu sinamak icin.
    for (let i = 0; i < 30; i++) {
      await makeCompany(prisma, {
        city: i < 20 ? 'Istanbul' : 'Ankara',
        leadScore: i % 5 === 0 ? 90 : i,
        leadGrade: i % 5 === 0 ? LeadGrade.VERY_HOT : LeadGrade.LOW,
        websiteStatus: i % 3 === 0 ? WebsiteStatus.NO_WEBSITE : WebsiteStatus.ACTIVE_GOOD,
      });
    }
  }, 120000);

  afterAll(async () => {
    await cleanupCompanies(prisma);
    await prisma.user.deleteMany({ where: { email: EMAIL } });
    await app.close();
  });

  const auth = () =>
    request(app.getHttpServer()).get('/api/v1/companies').set('Authorization', `Bearer ${token}`);

  it('tokensiz erisimi reddeder', async () => {
    await request(app.getHttpServer()).get('/api/v1/companies').expect(401);
  });

  it('varsayilan sayfayi ve toplami doner', async () => {
    const res = await auth().expect(200);
    expect(res.body.items.length).toBeGreaterThan(0);
    expect(res.body.approxTotal).toBeGreaterThanOrEqual(30);
    expect(res.body).toHaveProperty('nextCursor');
  });

  it('sehre gore filtreler', async () => {
    const res = await auth().query({ city: 'Ankara' }).expect(200);
    expect(res.body.approxTotal).toBe(10);
    for (const c of res.body.items) expect(c.city).toBe('Ankara');
  });

  it('imlecle gezerken kayit atlamaz ve tekrarlamaz', async () => {
    // 30 kaydin 6'si ayni puana (90) sahip; esitlik bozucu calismazsa
    // tam bu sinirda kayit kaybolur veya iki kez gelir.
    const seen = new Set<string>();
    let cursor: string | null = null;
    let pages = 0;
    do {
      const res: request.Response = await auth()
        .query({ limit: 7, ...(cursor ? { cursor } : {}) })
        .expect(200);
      for (const c of res.body.items) {
        expect(seen.has(c.id)).toBe(false); // tekrar yok
        seen.add(c.id);
      }
      cursor = res.body.nextCursor;
      pages++;
      expect(pages).toBeLessThan(20); // sonsuz donguye karsi
    } while (cursor);
    expect(seen.size).toBe(30); // atlama yok
  });

  it('bozuk imleci 400 ile reddeder', async () => {
    const res = await auth().query({ cursor: 'bozuk!!!' }).expect(400);
    expect(res.body.code).toBe('invalid_cursor');
  });

  it('bilinmeyen siralama alanini reddeder', async () => {
    const res = await auth().query({ sort: 'passwordHash:desc' }).expect(400);
    expect(res.body.code).toBe('validation_error');
  });

  it('detay ucunda kisiler ve zaman tuneli gelir', async () => {
    const one = await makeCompany(prisma, { name: 'Detay Testi' });
    const res = await request(app.getHttpServer())
      .get(`/api/v1/companies/${one.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(res.body.name).toBe('Detay Testi');
    expect(Array.isArray(res.body.contacts)).toBe(true);
    expect(Array.isArray(res.body.activities)).toBe(true);
  });

  it('olmayan isletmede 404 doner', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/companies/00000000-0000-4000-8000-000000000000')
      .set('Authorization', `Bearer ${token}`)
      .expect(404);
    expect(res.body.code).toBe('not_found');
  });

  it('elle duzeltmeyi kaydeder ve nameNormalized alanini tazeler', async () => {
    const one = await makeCompany(prisma, { name: 'Eski Ad' });
    await request(app.getHttpServer())
      .patch(`/api/v1/companies/${one.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Yeni Ad' })
      .expect(200);
    const after = await prisma.company.findUnique({ where: { id: one.id } });
    expect(after!.name).toBe('Yeni Ad');
    // Mukerrer tespiti bu alana bagli; guncellenmezse bayat kalir.
    expect(after!.nameNormalized).toBe('yeni ad');
  });

  it('duzenlenmesi yasak alanlari reddeder', async () => {
    const one = await makeCompany(prisma);
    const res = await request(app.getHttpServer())
      .patch(`/api/v1/companies/${one.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ leadScore: 100 })
      .expect(400);
    expect(res.body.code).toBe('validation_error');
  });
});
