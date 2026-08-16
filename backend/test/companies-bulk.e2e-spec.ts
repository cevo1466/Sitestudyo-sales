import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import request from 'supertest';
import { UserRole } from '@prisma/client';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/common/prisma/prisma.service';
import { AuthService } from '../src/modules/auth/auth.service';
import { makeCompany, cleanupCompanies } from './factories';

describe('Companies bulk (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let token: string;

  const EMAIL = `blk-${Date.now()}@test.local`;
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
        name: 'Bulk Test',
        role: UserRole.ADMIN,
        passwordHash: await AuthService.hashPassword(PASSWORD),
      },
    });
    const login = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: EMAIL, password: PASSWORD });
    token = login.body.accessToken;

    await prisma.companyTag.deleteMany({});
    await prisma.tag.deleteMany({ where: { slug: { startsWith: 'blk-' } } });
    await prisma.lead.deleteMany({});
    await cleanupCompanies(prisma);
    for (let i = 0; i < 20; i++) await makeCompany(prisma, { city: 'Ankara' });
    // Istanbul 201 kayit: promote'un 200 sinirini asmasi icin
    for (let i = 0; i < 201; i++) await makeCompany(prisma, { city: 'Istanbul' });
  }, 180000);

  afterAll(async () => {
    await prisma.lead.deleteMany({});
    await prisma.companyTag.deleteMany({});
    await prisma.tag.deleteMany({ where: { slug: { startsWith: 'blk-' } } });
    await prisma.doNotContact.deleteMany({});
    await cleanupCompanies(prisma);
    await prisma.user.deleteMany({ where: { email: EMAIL } });
    await app.close();
  });

  const bulk = (body: object) =>
    request(app.getHttpServer())
      .post('/api/v1/companies/bulk')
      .set('Authorization', `Bearer ${token}`)
      .send(body);

  it('filtreye uyan tum isletmeleri etiketler', async () => {
    const tag = await prisma.tag.create({ data: { slug: 'blk-a', name: 'Blk A' } });
    const res = await bulk({
      filter: { city: 'Ankara' },
      action: 'tag',
      payload: { tagIds: [tag.id] },
    }).expect(200);

    expect(res.body.matched).toBe(20);
    expect(res.body.applied).toBe(20);
    expect(await prisma.companyTag.count({ where: { tagId: tag.id } })).toBe(20);
  });

  it('ayni etiketi ikinci kez uygulamak hata vermez, mukerrer olusturmaz', async () => {
    const tag = await prisma.tag.create({ data: { slug: 'blk-b', name: 'Blk B' } });
    const body = { filter: { city: 'Ankara' }, action: 'tag', payload: { tagIds: [tag.id] } };
    await bulk(body).expect(200);
    await bulk(body).expect(200);
    expect(await prisma.companyTag.count({ where: { tagId: tag.id } })).toBe(20);
  });

  it('excludeIds ile belirtilenlere dokunmaz', async () => {
    const tag = await prisma.tag.create({ data: { slug: 'blk-c', name: 'Blk C' } });
    const ankara = await prisma.company.findMany({
      where: { city: 'Ankara', placeId: { startsWith: 'test-' } },
      take: 3,
    });
    const res = await bulk({
      filter: { city: 'Ankara' },
      excludeIds: ankara.map((c) => c.id),
      action: 'tag',
      payload: { tagIds: [tag.id] },
    }).expect(200);

    expect(res.body.matched).toBe(17);
    expect(await prisma.companyTag.count({ where: { tagId: tag.id } })).toBe(17);
    for (const c of ankara) {
      expect(await prisma.companyTag.count({ where: { tagId: tag.id, companyId: c.id } })).toBe(0);
    }
  });

  it('etiket kaldirir', async () => {
    const tag = await prisma.tag.create({ data: { slug: 'blk-d', name: 'Blk D' } });
    await bulk({ filter: { city: 'Ankara' }, action: 'tag', payload: { tagIds: [tag.id] } });
    await bulk({ filter: { city: 'Ankara' }, action: 'untag', payload: { tagIds: [tag.id] } }).expect(
      200,
    );
    expect(await prisma.companyTag.count({ where: { tagId: tag.id } })).toBe(0);
  });

  it('temas etme listesine ekler', async () => {
    const res = await bulk({ filter: { city: 'Istanbul' }, action: 'dnc' }).expect(200);
    expect(res.body.applied).toBeGreaterThan(0);
    expect(await prisma.doNotContact.count({ where: { type: 'PHONE' } })).toBeGreaterThan(0);
  });

  it('confirmCount tutmuyorsa 409 doner ve HICBIR SEY yazmaz', async () => {
    const tag = await prisma.tag.create({ data: { slug: 'blk-e', name: 'Blk E' } });
    const before = await prisma.companyTag.count();

    const res = await bulk({
      filter: { city: 'Ankara' },
      action: 'tag',
      payload: { tagIds: [tag.id] },
      confirmCount: 999, // ekranda gorulen sayi artik gecerli degil
    }).expect(409);

    expect(res.body.code).toBe('count_mismatch');
    expect(res.body.message).toContain('20'); // gercek sayiyi bildirir
    expect(await prisma.companyTag.count()).toBe(before); // tek satir bile yazilmadi
  });

  it('confirmCount tutuyorsa uygular', async () => {
    const tag = await prisma.tag.create({ data: { slug: 'blk-f', name: 'Blk F' } });
    await bulk({
      filter: { city: 'Ankara' },
      action: 'tag',
      payload: { tagIds: [tag.id] },
      confirmCount: 20,
    }).expect(200);
    expect(await prisma.companyTag.count({ where: { tagId: tag.id } })).toBe(20);
  });

  it('bos filtre ile tum havuza dokunmayi reddeder', async () => {
    // Kazara "hepsini etiketle" en pahali hatalardan biri; acik daraltma sart.
    const tag = await prisma.tag.create({ data: { slug: 'blk-g', name: 'Blk G' } });
    const res = await bulk({
      filter: {},
      action: 'tag',
      payload: { tagIds: [tag.id] },
    }).expect(400);
    expect(res.body.code).toBe('empty_filter_not_allowed');
  });

  it('bilinmeyen etiket kimliginde 400 doner', async () => {
    const res = await bulk({
      filter: { city: 'Ankara' },
      action: 'tag',
      payload: { tagIds: ['00000000-0000-4000-8000-000000000000'] },
    }).expect(400);
    expect(res.body.code).toBe('validation_error');
  });

  it('secili isletmeleri topluca huniye alir', async () => {
    const res = await bulk({ filter: { city: 'Ankara' }, action: 'promote' }).expect(200);
    expect(res.body.matched).toBe(20);
    expect(res.body.applied).toBe(20);
    expect(await prisma.lead.count()).toBe(20);
  });

  it('zaten acik kaydi olanlari atlar, hata vermez', async () => {
    // Ikinci calistirma: hepsinin zaten acik kaydi var.
    const res = await bulk({ filter: { city: 'Ankara' }, action: 'promote' }).expect(200);
    expect(res.body.applied).toBe(0);
    expect(res.body.skipped).toBe(res.body.matched);
    expect(await prisma.lead.count()).toBe(20); // yeni kayit acilmadi
  });

  it('200 sinirini asan terfiyi reddeder ve TEK kayit bile acmaz', async () => {
    const before = await prisma.lead.count();
    const res = await bulk({ filter: { city: 'Istanbul' }, action: 'promote' }).expect(400);
    expect(res.body.code).toBe('bulk_limit_exceeded');
    expect(res.body.message).toContain('201');
    expect(await prisma.lead.count()).toBe(before);
  });
});
