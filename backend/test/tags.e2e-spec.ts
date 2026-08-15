import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import request from 'supertest';
import { UserRole } from '@prisma/client';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/common/prisma/prisma.service';
import { AuthService } from '../src/modules/auth/auth.service';
import { makeCompany, cleanupCompanies } from './factories';

describe('Tags (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let token: string;

  const EMAIL = `tag-${Date.now()}@test.local`;
  const PASSWORD = 'e2e-Test-Parola-123';
  const SLUGS = ['sicak-musteri', 'ankara', 'silinecek'];

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
        name: 'Tag Test',
        role: UserRole.ADMIN,
        passwordHash: await AuthService.hashPassword(PASSWORD),
      },
    });
    const login = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: EMAIL, password: PASSWORD });
    token = login.body.accessToken;
    await prisma.tag.deleteMany({ where: { slug: { in: SLUGS } } });
  }, 120000);

  afterAll(async () => {
    await prisma.tag.deleteMany({ where: { slug: { in: SLUGS } } });
    await cleanupCompanies(prisma);
    await prisma.user.deleteMany({ where: { email: EMAIL } });
    await app.close();
  });

  const post = (body: object) =>
    request(app.getHttpServer())
      .post('/api/v1/tags')
      .set('Authorization', `Bearer ${token}`)
      .send(body);

  it('etiket olusturur ve slug uretir', async () => {
    const res = await post({ name: 'Sıcak Müşteri', color: '#ff0000' }).expect(201);
    expect(res.body.slug).toBe('sicak-musteri'); // Turkce karakterler sadelesir
    expect(res.body.name).toBe('Sıcak Müşteri'); // gorunen ad korunur
  });

  it('ayni slug ikinci kez olusturulamaz', async () => {
    await post({ name: 'Ankara' }).expect(201);
    // Farkli yazim, AYNI slug: iki ayri etiket olsaydi filtre ikisini de kacirirdi.
    const res = await post({ name: 'ankara' }).expect(409);
    expect(res.body.code).toBe('duplicate');
  });

  it('gecersiz rengi reddeder', async () => {
    const res = await post({ name: 'Test', color: 'kirmizi' }).expect(400);
    expect(res.body.code).toBe('validation_error');
  });

  it('etiketleri listeler', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/tags')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('etiket silinince isletme baglantilari da silinir ama isletme kalir', async () => {
    const company = await makeCompany(prisma);
    const tag = await prisma.tag.create({ data: { slug: 'silinecek', name: 'Silinecek' } });
    await prisma.companyTag.create({ data: { companyId: company.id, tagId: tag.id } });

    await request(app.getHttpServer())
      .delete(`/api/v1/tags/${tag.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(204);

    expect(await prisma.companyTag.count({ where: { tagId: tag.id } })).toBe(0);
    expect(await prisma.company.findUnique({ where: { id: company.id } })).not.toBeNull();
  });
});
