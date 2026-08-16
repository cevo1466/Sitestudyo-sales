import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import request from 'supertest';
import { UserRole } from '@prisma/client';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/common/prisma/prisma.service';
import { AuthService } from '../src/modules/auth/auth.service';
import { makeCompany, cleanupCompanies } from './factories';

describe('Pipelines (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let token: string;

  const EMAIL = `pl-${Date.now()}@test.local`;
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
        name: 'Pipeline Test',
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
  }, 120000);

  afterAll(async () => {
    await prisma.lead.deleteMany({});
    await prisma.pipeline.deleteMany({ where: { isDefault: false } });
    await cleanupCompanies(prisma);
    await prisma.user.deleteMany({ where: { email: EMAIL } });
    await app.close();
  });

  const bearer = () => `Bearer ${token}`;

  it('varsayilan huniyi asamalariyla doner', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/pipelines')
      .set('Authorization', bearer())
      .expect(200);
    const def = res.body.find((p: { isDefault: boolean }) => p.isDefault);
    expect(def).toBeTruthy();
    expect(def.stages.length).toBe(6); // seed'den gelen 6 asama
    expect(def.stages[0].key).toBe('lead');
    const orders = def.stages.map((s: { sortOrder: number }) => s.sortOrder);
    expect(orders).toEqual([...orders].sort((a: number, b: number) => a - b));
  });

  it('yeni huni olusturur ve varsayilan YAPMAZ', async () => {
    // Iki varsayilan huni olsaydi terfi hangisine yazacagini bilemezdi.
    const res = await request(app.getHttpServer())
      .post('/api/v1/pipelines')
      .set('Authorization', bearer())
      .send({ name: 'Test Hunisi' })
      .expect(201);
    expect(res.body.isDefault).toBe(false);
  });

  it('asamalari topluca degistirir ve siralar', async () => {
    const p = await prisma.pipeline.create({ data: { name: 'Asama Testi' } });
    const res = await request(app.getHttpServer())
      .put(`/api/v1/pipelines/${p.id}/stages`)
      .set('Authorization', bearer())
      .send({
        stages: [
          { key: 'a', name: 'Birinci', sortOrder: 10 },
          { key: 'b', name: 'Ikinci', sortOrder: 20 },
          { key: 'z', name: 'Kazanildi', sortOrder: 30, isWon: true },
        ],
      })
      .expect(200);
    expect(res.body.length).toBe(3);
    expect(res.body[2].isWon).toBe(true);
  });

  it('ayni key iki kez verilirse reddeder', async () => {
    const p = await prisma.pipeline.create({ data: { name: 'Cift Key' } });
    const res = await request(app.getHttpServer())
      .put(`/api/v1/pipelines/${p.id}/stages`)
      .set('Authorization', bearer())
      .send({
        stages: [
          { key: 'ayni', name: 'Bir', sortOrder: 10 },
          { key: 'ayni', name: 'Iki', sortOrder: 20 },
        ],
      })
      .expect(400);
    expect(res.body.code).toBe('validation_error');
  });

  it('is kaydi barindiran bir asama silinemez', async () => {
    // Silinseydi lead sahipsiz kalir ve hunide hicbir sutunda gorunmezdi.
    const def = await prisma.pipeline.findFirst({
      where: { isDefault: true },
      include: { stages: { orderBy: { sortOrder: 'asc' } } },
    });
    const company = await makeCompany(prisma);
    await prisma.lead.create({
      data: {
        companyId: company.id,
        pipelineId: def!.id,
        stageId: def!.stages[0].id,
        title: 'Engelleyen is kaydi',
      },
    });

    const res = await request(app.getHttpServer())
      .put(`/api/v1/pipelines/${def!.id}/stages`)
      .set('Authorization', bearer())
      .send({ stages: [{ key: 'tek', name: 'Tek Asama', sortOrder: 10 }] })
      .expect(409);
    expect(res.body.code).toBe('stage_in_use');
  });
});
