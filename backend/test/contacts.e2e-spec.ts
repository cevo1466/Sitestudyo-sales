import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import request from 'supertest';
import { UserRole } from '@prisma/client';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/common/prisma/prisma.service';
import { AuthService } from '../src/modules/auth/auth.service';
import { makeCompany, cleanupCompanies } from './factories';

describe('Contacts (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let token: string;

  const EMAIL = `ct-${Date.now()}@test.local`;
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
        name: 'Contact Test',
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

  const post = (body: object) =>
    request(app.getHttpServer())
      .post('/api/v1/contacts')
      .set('Authorization', `Bearer ${token}`)
      .send(body);

  it('isletmeye kisi ekler', async () => {
    const c = await makeCompany(prisma);
    const res = await post({
      companyId: c.id,
      name: 'Ayse Yilmaz',
      email: 'ayse@ornek.com',
      role: 'Sahip',
    }).expect(201);
    expect(res.body.email).toBe('ayse@ornek.com');
    expect(res.body.confidence).toBe('GUESSED'); // varsayilan
  });

  it('e-postayi kucuk harfe cevirir', async () => {
    const c = await makeCompany(prisma);
    const res = await post({ companyId: c.id, email: 'BUYUK@Ornek.COM' }).expect(201);
    // Aksi halde ayni adres iki kez girer ve mukerrer engeli calismaz.
    expect(res.body.email).toBe('buyuk@ornek.com');
  });

  it('ayni isletmeye ayni e-postayi ikinci kez eklemez', async () => {
    const c = await makeCompany(prisma);
    const body = { companyId: c.id, email: 'tek@ornek.com' };
    await post(body).expect(201);
    const res = await post(body).expect(409);
    expect(res.body.code).toBe('duplicate');
  });

  it('olmayan isletmeye kisi eklemeyi reddeder', async () => {
    const res = await post({
      companyId: '00000000-0000-4000-8000-000000000000',
      email: 'a@b.com',
    }).expect(404);
    expect(res.body.code).toBe('not_found');
  });

  it('ne e-posta ne telefon verilirse reddeder', async () => {
    const c = await makeCompany(prisma);
    const res = await post({ companyId: c.id, name: 'Kimsesiz' }).expect(400);
    // Iletisim bilgisi olmayan kisi kaydinin hicbir islevi yok.
    expect(res.body.code).toBe('validation_error');
  });

  it('isletmeye gore listeler, birincil kisi basta gelir', async () => {
    const c = await makeCompany(prisma);
    await prisma.contact.create({ data: { companyId: c.id, email: 'ikinci@x.com' } });
    const first = await prisma.contact.create({
      data: { companyId: c.id, email: 'birinci@x.com', isPrimary: true },
    });
    const res = await request(app.getHttpServer())
      .get('/api/v1/contacts')
      .query({ companyId: c.id })
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(res.body[0].id).toBe(first.id);
  });

  it('birincil isaretlenince digerinin birincilligi kalkar', async () => {
    const c = await makeCompany(prisma);
    const a = await prisma.contact.create({
      data: { companyId: c.id, email: 'a@x.com', isPrimary: true },
    });
    const b = await prisma.contact.create({ data: { companyId: c.id, email: 'b@x.com' } });

    await request(app.getHttpServer())
      .post(`/api/v1/contacts/${b.id}/primary`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    // Iki birincil kisi olursa "kime yazacagiz" sorusu belirsizlesir.
    expect((await prisma.contact.findUnique({ where: { id: a.id } }))!.isPrimary).toBe(false);
    expect((await prisma.contact.findUnique({ where: { id: b.id } }))!.isPrimary).toBe(true);
  });

  it('kisiyi siler', async () => {
    const c = await makeCompany(prisma);
    const k = await prisma.contact.create({ data: { companyId: c.id, email: 'sil@x.com' } });
    await request(app.getHttpServer())
      .delete(`/api/v1/contacts/${k.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(204);
    expect(await prisma.contact.findUnique({ where: { id: k.id } })).toBeNull();
  });
});
