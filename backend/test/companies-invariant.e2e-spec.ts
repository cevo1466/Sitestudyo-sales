import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import request from 'supertest';
import { LeadGrade, UserRole, WebsiteStatus } from '@prisma/client';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/common/prisma/prisma.service';
import { AuthService } from '../src/modules/auth/auth.service';
import { makeCompany, cleanupCompanies } from './factories';

/**
 * TASARIMIN VAR OLMA SEBEBI OLAN TEST.
 *
 * Filtre mantigi liste ve toplu islem uclarinda ayri ayri yazilsaydi, biri
 * guncellenip digeri unutuldugunda sistem SESSIZCE yanlis calisirdi: liste
 * 3.400 gosterirken toplu islem 3.600 kayda dokunurdu. Hicbir hata cikmaz,
 * kimse fark etmez, yanlis isletmelere etiket atilir veya mail gider.
 *
 * Bu test gectigi surece o hata sinifi imkansizdir.
 */
describe('Degismez: liste sayisi == sayim sayisi (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let token: string;

  const EMAIL = `inv-${Date.now()}@test.local`;
  const PASSWORD = 'e2e-Test-Parola-123';

  const FILTERS: Array<Record<string, unknown>> = [
    { city: 'Ankara' },
    { city: 'Istanbul', district: 'Fatih' },
    { websiteStatus: ['NO_WEBSITE'] },
    { websiteStatus: ['NO_WEBSITE', 'BROKEN'] },
    { leadGrade: ['VERY_HOT'] },
    { minScore: 70 },
    { minScore: 70, maxScore: 89 },
    { hasPhone: 'true' },
    { hasPhone: 'false' },
    { sector: 'guzellik' },
    { city: 'Ankara', websiteStatus: ['NO_WEBSITE'], minScore: 50 },
    { city: 'Izmir', sector: 'spor_saglik' },
  ];

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
        name: 'Invariant Test',
        role: UserRole.ADMIN,
        passwordHash: await AuthService.hashPassword(PASSWORD),
      },
    });
    const login = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: EMAIL, password: PASSWORD });
    token = login.body.accessToken;

    await cleanupCompanies(prisma);
    const cities = ['Istanbul', 'Ankara', 'Izmir'];
    const sectors = ['guzellik', 'yeme_icme', 'spor_saglik'];
    const statuses = [
      WebsiteStatus.NO_WEBSITE,
      WebsiteStatus.BROKEN,
      WebsiteStatus.ACTIVE_GOOD,
      WebsiteStatus.SOCIAL_ONLY,
    ];
    for (let i = 0; i < 200; i++) {
      const score = i % 101;
      await makeCompany(prisma, {
        city: cities[i % 3],
        district: i % 2 === 0 ? 'Fatih' : 'Kadikoy',
        sector: sectors[i % 3],
        websiteStatus: statuses[i % 4],
        leadScore: score,
        leadGrade: score >= 90 ? LeadGrade.VERY_HOT : score >= 70 ? LeadGrade.HOT : LeadGrade.LOW,
        // Ucte birinin telefonu YOK: hasPhone filtresi anlamli olsun
        phoneE164: i % 3 === 0 ? null : `+9055512${String(i).padStart(5, '0')}`,
      });
    }
  }, 180000);

  afterAll(async () => {
    await cleanupCompanies(prisma);
    await prisma.user.deleteMany({ where: { email: EMAIL } });
    await app.close();
  });

  /** Listeyi imlecle sonuna kadar gezip benzersiz id sayisini doner. */
  async function walkList(filter: Record<string, unknown>): Promise<number> {
    const seen = new Set<string>();
    let cursor: string | null = null;
    let guard = 0;
    do {
      const res: request.Response = await request(app.getHttpServer())
        .get('/api/v1/companies')
        .set('Authorization', `Bearer ${token}`)
        .query({ ...filter, limit: 13, ...(cursor ? { cursor } : {}) })
        .expect(200);
      for (const c of res.body.items) seen.add(c.id);
      cursor = res.body.nextCursor;
      if (++guard > 100) throw new Error('Sayfalama bitmedi — imlec ilerlemiyor');
    } while (cursor);
    return seen.size;
  }

  it.each(FILTERS)(
    'filtre %j icin liste ve sayim ayni sonucu verir',
    async (filter) => {
      const listed = await walkList(filter as Record<string, unknown>);

      const counted = await request(app.getHttpServer())
        .post('/api/v1/companies/count')
        .set('Authorization', `Bearer ${token}`)
        .send({ filter })
        .expect(200);

      expect(counted.body.matched).toBe(listed);
    },
    60000,
  );

  it('sayim, listenin bildirdigi approxTotal ile de tutar', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/companies')
      .set('Authorization', `Bearer ${token}`)
      .query({ city: 'Ankara' })
      .expect(200);

    const counted = await request(app.getHttpServer())
      .post('/api/v1/companies/count')
      .set('Authorization', `Bearer ${token}`)
      .send({ filter: { city: 'Ankara' } })
      .expect(200);

    expect(res.body.approxTotal).toBe(counted.body.matched);
  });

  it('farkli siralamalarda da ayni kumeyi dolasir', async () => {
    // Siralama degisince imlec mantigi da degisiyor; kume degismemeli.
    const filter = { city: 'Ankara' };
    const byScore = await walkList(filter);
    const byName = await walkList({ ...filter, sort: 'name:asc' });
    const byRating = await walkList({ ...filter, sort: 'googleRating:desc' });
    expect(byName).toBe(byScore);
    expect(byRating).toBe(byScore);
  }, 60000);
});
