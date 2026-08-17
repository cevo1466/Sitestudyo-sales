import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import request from 'supertest';
import { DncType, LeadGrade, UserRole, WebsiteStatus } from '@prisma/client';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/common/prisma/prisma.service';
import { AuthService } from '../src/modules/auth/auth.service';
import { makeCompany, cleanupCompanies } from './factories';

/**
 * WhatsApp temasi ve calisma kuyrugu.
 *
 * Bu dosyanin korudugu en onemli sey: zaman tunelinin DOGRU SEYI
 * soylemesi. "Acildi" ile "gonderildi" ayri kayitlar; arayuz acma
 * basarisiz olursa hic kayit atmiyor.
 */
describe('Outreach & calisma kuyrugu (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let token: string;

  const EMAIL = `out-${Date.now()}@test.local`;
  const PASSWORD = 'e2e-Test-Parola-123';
  const bearer = () => `Bearer ${token}`;

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
        name: 'Outreach Test',
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
    await prisma.doNotContact.deleteMany({ where: { reason: 'e2e-dnc' } });
    await prisma.user.deleteMany({ where: { email: EMAIL } });
    await app.close();
  });

  it('degisken katalogunu doner', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/outreach/template-variables')
      .set('Authorization', bearer())
      .expect(200);

    const names = (res.body as Array<{ name: string }>).map((v) => v.name);
    expect(names).toContain('isim');
    expect(names).toContain('sorun');
    expect(names).toContain('skorGerekce');
  });

  it('mesajlarda ham degisken etiketi kalmaz', async () => {
    const c = await makeCompany(prisma, {
      name: 'Sakal Kafe Pub',
      sector: 'yeme_icme',
      websiteStatus: WebsiteStatus.NO_WEBSITE,
      googleRating: 4.6,
    });
    const res = await request(app.getHttpServer())
      .get(`/api/v1/outreach/company/${c.id}/messages`)
      .set('Authorization', bearer())
      .expect(200);

    expect(res.body.messages.length).toBeGreaterThan(0);
    for (const m of res.body.messages) {
      expect(m.text).not.toMatch(/\{\{|\}\}/);
      expect(m.url).toContain('https://wa.me/');
    }
    // Isletmeye ozel: adi metinde gecmeli.
    expect(res.body.messages.some((m: { text: string }) => m.text.includes('Sakal'))).toBe(true);
  });

  it('acildi kaydi "acildi" yazar ve lastContactedAt doldurur', async () => {
    const c = await makeCompany(prisma);
    await request(app.getHttpServer())
      .post(`/api/v1/outreach/company/${c.id}/whatsapp-sent`)
      .set('Authorization', bearer())
      .send({ templateKey: 'sade', text: 'Merhaba', outcome: 'opened' })
      .expect(201);

    const acts = await prisma.activity.findMany({ where: { companyId: c.id } });
    expect(acts).toHaveLength(1);
    expect(acts[0].subject).toContain('açıldı');
    expect(acts[0].subject).not.toContain('gönderildi');

    const after = await prisma.company.findUnique({ where: { id: c.id } });
    expect(after?.lastContactedAt).toBeTruthy();
  });

  it('"Gonderdim" ikinci bir kayit yazar, ilkini silmez', async () => {
    const c = await makeCompany(prisma);
    const post = (outcome: string) =>
      request(app.getHttpServer())
        .post(`/api/v1/outreach/company/${c.id}/whatsapp-sent`)
        .set('Authorization', bearer())
        .send({ templateKey: 'sade', text: 'Merhaba', outcome })
        .expect(201);

    await post('opened');
    await post('sent');

    const acts = await prisma.activity.findMany({
      where: { companyId: c.id },
      orderBy: { occurredAt: 'asc' },
    });
    // Zaman tuneli olan biteni oldugu gibi tutuyor: iki satir.
    expect(acts).toHaveLength(2);
    expect(acts.map((a) => a.subject).join(' ')).toContain('açıldı');
    expect(acts.map((a) => a.subject).join(' ')).toContain('gönderildi');
  });

  it('outcome verilmezse acildi sayar (eski masaustu surumleri)', async () => {
    const c = await makeCompany(prisma);
    await request(app.getHttpServer())
      .post(`/api/v1/outreach/company/${c.id}/whatsapp-sent`)
      .set('Authorization', bearer())
      .send({ templateKey: 'sade', text: 'Merhaba' })
      .expect(201);

    const acts = await prisma.activity.findMany({ where: { companyId: c.id } });
    expect(acts[0].subject).toContain('açıldı');
  });

  describe('kuyruk', () => {
    it('hazir metinlerle gelir ve sabit hatlari almaz', async () => {
      const cep = await makeCompany(prisma, {
        name: 'Kuyruk Cep',
        leadScore: 60,
        leadGrade: LeadGrade.WARM,
        phoneE164: `+90555${Date.now().toString().slice(-7)}`,
      });
      await makeCompany(prisma, { name: 'Kuyruk Sabit', phoneE164: '+902121234567' });

      const res = await request(app.getHttpServer())
        .get('/api/v1/outreach/queue?limit=50')
        .set('Authorization', bearer())
        .expect(200);

      const ids = res.body.items.map((i: { companyId: string }) => i.companyId);
      expect(ids).toContain(cep.id);
      expect(res.body.items.every((i: { phoneKind: string }) => i.phoneKind === 'mobile')).toBe(
        true,
      );
      for (const item of res.body.items) {
        expect(item.messages.length).toBeGreaterThan(0);
        for (const m of item.messages) expect(m.text).not.toMatch(/\{\{|\}\}/);
      }
    });

    it('temas edilmeyecekler listesindeki numarayi ALMAZ', async () => {
      const phone = `+90555${Date.now().toString().slice(-7)}`;
      const c = await makeCompany(prisma, { name: 'Kuyruk DNC', phoneE164: phone });
      await prisma.doNotContact.create({
        data: { type: DncType.PHONE, value: phone, reason: 'e2e-dnc' },
      });

      const res = await request(app.getHttpServer())
        .get('/api/v1/outreach/queue?limit=50')
        .set('Authorization', bearer())
        .expect(200);

      const ids = res.body.items.map((i: { companyId: string }) => i.companyId);
      expect(ids).not.toContain(c.id);
    });

    it('bugun temas edilmis isletmeyi kuyruktan duser', async () => {
      const c = await makeCompany(prisma, {
        name: 'Kuyruk Temas',
        phoneE164: `+90555${Date.now().toString().slice(-7)}`,
      });

      const inQueue = async () => {
        const res = await request(app.getHttpServer())
          .get('/api/v1/outreach/queue?limit=50')
          .set('Authorization', bearer())
          .expect(200);
        return res.body.items.some((i: { companyId: string }) => i.companyId === c.id);
      };

      expect(await inQueue()).toBe(true);

      await request(app.getHttpServer())
        .post(`/api/v1/outreach/company/${c.id}/whatsapp-sent`)
        .set('Authorization', bearer())
        .send({ templateKey: 'sade', text: 'Merhaba', outcome: 'opened' })
        .expect(201);

      // Bu, kuyrugun butun anlami: ayni isletme ayni gun iki kez
      // karsimiza cikmiyor.
      expect(await inQueue()).toBe(false);
    });

    it('filtre verilirse varsayilani ezer', async () => {
      const ankara = await makeCompany(prisma, {
        name: 'Kuyruk Ankara',
        city: 'Ankara',
        phoneE164: `+90555${Date.now().toString().slice(-7)}`,
      });

      const res = await request(app.getHttpServer())
        .get('/api/v1/outreach/queue?limit=50&city=Ankara')
        .set('Authorization', bearer())
        .expect(200);

      const ids = res.body.items.map((i: { companyId: string }) => i.companyId);
      expect(ids).toContain(ankara.id);
      expect(res.body.items.every((i: { city: string }) => i.city === 'Ankara')).toBe(true);
    });

    it('limit ust sinirini asan istegi reddeder', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/outreach/queue?limit=500')
        .set('Authorization', bearer())
        .expect(400);
    });
  });
});
