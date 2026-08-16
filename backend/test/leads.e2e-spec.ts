import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import request from 'supertest';
import { UserRole } from '@prisma/client';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/common/prisma/prisma.service';
import { AuthService } from '../src/modules/auth/auth.service';
import { makeCompany, cleanupCompanies } from './factories';

describe('Leads (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let token: string;
  let stages: Array<{ id: string; key: string }>;

  const EMAIL = `ld-${Date.now()}@test.local`;
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
        name: 'Lead Test',
        role: UserRole.ADMIN,
        passwordHash: await AuthService.hashPassword(PASSWORD),
      },
    });
    const login = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: EMAIL, password: PASSWORD });
    token = login.body.accessToken;

    await prisma.lead.deleteMany({});
    await cleanupCompanies(prisma);

    const def = await prisma.pipeline.findFirst({
      where: { isDefault: true },
      include: { stages: { orderBy: { sortOrder: 'asc' } } },
    });
    stages = def!.stages;
  }, 120000);

  afterAll(async () => {
    await prisma.lead.deleteMany({});
    await prisma.pipeline.deleteMany({ where: { isDefault: false } });
    await cleanupCompanies(prisma);
    await prisma.user.deleteMany({ where: { email: EMAIL } });
    await app.close();
  });

  const bearer = () => `Bearer ${token}`;
  const promote = (body: object) =>
    request(app.getHttpServer())
      .post('/api/v1/leads')
      .set('Authorization', bearer())
      .send(body);

  it('isletmeyi huniye terfi ettirir ve ilk asamaya koyar', async () => {
    const c = await makeCompany(prisma);
    const res = await promote({ companyId: c.id, title: 'Web sitesi teklifi' }).expect(201);
    expect(res.body.stageId).toBe(stages[0].id);
    expect(res.body.stageEnteredAt).toBeTruthy();
  });

  it('terfi ayni islemde SYSTEM aktivitesi yazar', async () => {
    const c = await makeCompany(prisma);
    await promote({ companyId: c.id, title: 'Aktivite testi' }).expect(201);
    const acts = await prisma.activity.findMany({ where: { companyId: c.id, type: 'SYSTEM' } });
    expect(acts.length).toBe(1);
  });

  it('ayni isletmenin ACIK ikinci is kaydini engeller', async () => {
    const c = await makeCompany(prisma);
    await promote({ companyId: c.id, title: 'Birinci' }).expect(201);
    const res = await promote({ companyId: c.id, title: 'Ikinci' }).expect(409);
    expect(res.body.code).toBe('lead_already_open');
  });

  it('KAPALI kayit varken yeni kayit acilabilir (tekrar satis)', async () => {
    const c = await makeCompany(prisma);
    const first = await promote({ companyId: c.id, title: 'Ilk is' }).expect(201);
    await request(app.getHttpServer())
      .post(`/api/v1/leads/${first.body.id}/close`)
      .set('Authorization', bearer())
      .send({ won: true })
      .expect(200);

    // Bir yil sonra bakim/yenileme satisi: eski gecmis EZILMEDEN yeni kayit
    const second = await promote({ companyId: c.id, title: 'Yenileme' }).expect(201);
    expect(second.body.id).not.toBe(first.body.id);
    expect(await prisma.lead.count({ where: { companyId: c.id } })).toBe(2);
  });

  it('olmayan isletmede 404 doner', async () => {
    const res = await promote({
      companyId: '00000000-0000-4000-8000-000000000000',
      title: 'Hayalet',
    }).expect(404);
    expect(res.body.code).toBe('not_found');
  });

  it('asama tasir ve STAGE_CHANGE aktivitesi yazar', async () => {
    const c = await makeCompany(prisma);
    const lead = await promote({ companyId: c.id, title: 'Tasima' }).expect(201);
    const target = stages[2];

    const res = await request(app.getHttpServer())
      .post(`/api/v1/leads/${lead.body.id}/move`)
      .set('Authorization', bearer())
      .send({ stageId: target.id })
      .expect(200);

    expect(res.body.stageId).toBe(target.id);
    const acts = await prisma.activity.findMany({
      where: { leadId: lead.body.id, type: 'STAGE_CHANGE' },
    });
    expect(acts.length).toBe(1);
    expect((acts[0].meta as { to: string }).to).toBe(target.key);
  });

  it('her tasimada stageEnteredAt sifirlanir', async () => {
    const c = await makeCompany(prisma);
    const lead = await promote({ companyId: c.id, title: 'Sure' }).expect(201);
    const before = new Date(lead.body.stageEnteredAt).getTime();
    await new Promise((r) => setTimeout(r, 1100)); // MySQL saniye cozunurlugu

    await request(app.getHttpServer())
      .post(`/api/v1/leads/${lead.body.id}/move`)
      .set('Authorization', bearer())
      .send({ stageId: stages[1].id })
      .expect(200);

    const after = await prisma.lead.findUnique({ where: { id: lead.body.id } });
    // Bir isin bir asamada NE KADAR bekledigini olcebilmek icin sifirlanmali.
    expect(new Date(after!.stageEnteredAt).getTime()).toBeGreaterThan(before);
  });

  it('baska huninin asamasina tasimayi reddeder', async () => {
    const c = await makeCompany(prisma);
    const lead = await promote({ companyId: c.id, title: 'Yabanci asama' }).expect(201);
    const other = await prisma.pipeline.create({ data: { name: 'Baska Huni' } });
    const otherStage = await prisma.pipelineStage.create({
      data: { pipelineId: other.id, key: 'x', name: 'X', sortOrder: 10 },
    });

    const res = await request(app.getHttpServer())
      .post(`/api/v1/leads/${lead.body.id}/move`)
      .set('Authorization', bearer())
      .send({ stageId: otherStage.id })
      .expect(400);
    expect(res.body.code).toBe('stage_not_in_pipeline');
  });

  it('kazanildi olarak kapatir ve closedAt yazar', async () => {
    const c = await makeCompany(prisma);
    const lead = await promote({ companyId: c.id, title: 'Kazanma' }).expect(201);
    const res = await request(app.getHttpServer())
      .post(`/api/v1/leads/${lead.body.id}/close`)
      .set('Authorization', bearer())
      .send({ won: true })
      .expect(200);
    expect(res.body.closedAt).toBeTruthy();
    const stage = await prisma.pipelineStage.findUnique({ where: { id: res.body.stageId } });
    expect(stage!.isWon).toBe(true);
  });

  it('kaybedildi kapanisinda gerekce zorunlu', async () => {
    const c = await makeCompany(prisma);
    const lead = await promote({ companyId: c.id, title: 'Kayip' }).expect(201);
    const res = await request(app.getHttpServer())
      .post(`/api/v1/leads/${lead.body.id}/close`)
      .set('Authorization', bearer())
      .send({ won: false })
      .expect(400);
    // Gerekcesiz kaybedilen isler sonradan analiz edilemez.
    expect(res.body.code).toBe('validation_error');
  });

  it('kapali is kaydi tekrar tasinamaz', async () => {
    const c = await makeCompany(prisma);
    const lead = await promote({ companyId: c.id, title: 'Kapali' }).expect(201);
    await request(app.getHttpServer())
      .post(`/api/v1/leads/${lead.body.id}/close`)
      .set('Authorization', bearer())
      .send({ won: true })
      .expect(200);

    const res = await request(app.getHttpServer())
      .post(`/api/v1/leads/${lead.body.id}/move`)
      .set('Authorization', bearer())
      .send({ stageId: stages[1].id })
      .expect(409);
    expect(res.body.code).toBe('lead_closed');
  });

  it('asamaya gore listeler (kanban beslemesi)', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/leads')
      .query({ stageId: stages[0].id })
      .set('Authorization', bearer())
      .expect(200);
    expect(Array.isArray(res.body.items)).toBe(true);
    for (const l of res.body.items) expect(l.stageId).toBe(stages[0].id);
  });
});
