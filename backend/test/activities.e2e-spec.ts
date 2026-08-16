import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import request from 'supertest';
import { UserRole } from '@prisma/client';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/common/prisma/prisma.service';
import { AuthService } from '../src/modules/auth/auth.service';
import { makeCompany, cleanupCompanies } from './factories';

describe('Activities & Notes (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let token: string;

  const EMAIL = `act-${Date.now()}@test.local`;
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
        name: 'Activity Test',
        role: UserRole.ADMIN,
        passwordHash: await AuthService.hashPassword(PASSWORD),
      },
    });
    const login = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: EMAIL, password: PASSWORD });
    token = login.body.accessToken;
    await cleanupCompanies(prisma);
  }, 120000);

  afterAll(async () => {
    await cleanupCompanies(prisma);
    await prisma.user.deleteMany({ where: { email: EMAIL } });
    await app.close();
  });

  const bearer = () => `Bearer ${token}`;

  it('elle aktivite ekler', async () => {
    const c = await makeCompany(prisma);
    const res = await request(app.getHttpServer())
      .post('/api/v1/activities')
      .set('Authorization', bearer())
      .send({ companyId: c.id, type: 'CALL', subject: 'Aradim', body: 'Musait degildi' })
      .expect(201);
    expect(res.body.type).toBe('CALL');
    expect(res.body.userId).toBeTruthy(); // giris yapan kullaniciya baglanir
  });

  it('SYSTEM tipini elle yazmayi reddeder', async () => {
    // Denetim izi uydurulabilir olmamali.
    const c = await makeCompany(prisma);
    const res = await request(app.getHttpServer())
      .post('/api/v1/activities')
      .set('Authorization', bearer())
      .send({ companyId: c.id, type: 'SYSTEM', subject: 'Sahte' })
      .expect(400);
    expect(res.body.code).toBe('validation_error');
  });

  it('aktiviteleri en yeniden eskiye siralar', async () => {
    const c = await makeCompany(prisma);
    await prisma.activity.create({
      data: { companyId: c.id, type: 'NOTE', subject: 'eski', occurredAt: new Date('2026-01-01') },
    });
    await prisma.activity.create({
      data: { companyId: c.id, type: 'NOTE', subject: 'yeni', occurredAt: new Date('2026-08-01') },
    });
    const res = await request(app.getHttpServer())
      .get('/api/v1/activities')
      .query({ companyId: c.id })
      .set('Authorization', bearer())
      .expect(200);
    expect(res.body.items[0].subject).toBe('yeni');
  });

  it('companyId de leadId de verilmezse reddeder', async () => {
    // Filtresiz sorgu tum sistemin zaman tunelini ceker; anlamsiz ve pahali.
    const res = await request(app.getHttpServer())
      .get('/api/v1/activities')
      .set('Authorization', bearer())
      .expect(400);
    expect(res.body.code).toBe('validation_error');
  });

  it('aktivite silme ucu YOKTUR', async () => {
    const c = await makeCompany(prisma);
    const a = await prisma.activity.create({ data: { companyId: c.id, type: 'CALL' } });
    await request(app.getHttpServer())
      .delete(`/api/v1/activities/${a.id}`)
      .set('Authorization', bearer())
      .expect(404);
  });

  it('not ekler, gunceller ve siler', async () => {
    const c = await makeCompany(prisma);
    const created = await request(app.getHttpServer())
      .post('/api/v1/notes')
      .set('Authorization', bearer())
      .send({ companyId: c.id, body: 'Ilk not' })
      .expect(201);

    await request(app.getHttpServer())
      .patch(`/api/v1/notes/${created.body.id}`)
      .set('Authorization', bearer())
      .send({ body: 'Duzeltilmis not' })
      .expect(200);

    await request(app.getHttpServer())
      .delete(`/api/v1/notes/${created.body.id}`)
      .set('Authorization', bearer())
      .expect(204);

    expect(await prisma.note.findUnique({ where: { id: created.body.id } })).toBeNull();
  });

  it('bos not govdesini reddeder', async () => {
    const c = await makeCompany(prisma);
    const res = await request(app.getHttpServer())
      .post('/api/v1/notes')
      .set('Authorization', bearer())
      .send({ companyId: c.id, body: '   ' })
      .expect(400);
    expect(res.body.code).toBe('validation_error');
  });
});
