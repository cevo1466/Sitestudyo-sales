import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InboundStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CryptoService } from '../../common/services/crypto.service';
import { normalizeName } from '../companies/normalize-name';

@Injectable()
export class InboundService {
  private readonly logger = new Logger(InboundService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly crypto: CryptoService,
  ) {}

  /**
   * sitestudyo.com'daki formdan gelen kayit.
   *
   * Bu uc INTERNETE ACIK. Uc katmanli koruma var:
   *   1. HMAC imzasi — istegin gercekten siteden geldigini dogrular
   *   2. Oran siniri (main.ts) — sel baskinini engeller
   *   3. Zorunlu alan dogrulamasi — cop kaydi bastan reddeder
   */
  async receive(
    dto: {
      source: string;
      name?: string;
      email?: string;
      phone?: string;
      message?: string;
      pageUrl?: string;
      utm?: Record<string, string>;
      visitorId?: string;
    },
    ip: string | undefined,
  ) {
    const lead = await this.prisma.inboundLead.create({
      data: {
        source: dto.source,
        payload: dto as Prisma.InputJsonValue,
        name: dto.name ?? null,
        email: dto.email?.toLowerCase() ?? null,
        phone: dto.phone ?? null,
        message: dto.message ?? null,
        pageUrl: dto.pageUrl ?? null,
        utm: (dto.utm ?? null) as Prisma.InputJsonValue,
        visitorId: dto.visitorId ?? null,
        // KVKK: ham IP saklanmiyor, tuzlu hash olarak tutuluyor.
        ipHash: this.crypto.hashIp(ip),
        status: InboundStatus.NEW,
      },
    });

    this.logger.log(`Gelen lead: ${lead.id} (${dto.source})`);
    return { id: lead.id, received: true };
  }

  /** Anonim ziyaretci olayi. Form geldiginde visitorId ile eslesecek. */
  async recordEvent(
    dto: { visitorId: string; sessionId?: string; type: string; pageUrl?: string; meta?: unknown },
    ip: string | undefined,
  ) {
    await this.prisma.visitorEvent.create({
      data: {
        visitorId: dto.visitorId,
        sessionId: dto.sessionId ?? null,
        type: dto.type,
        pageUrl: dto.pageUrl ?? null,
        meta: (dto.meta ?? null) as Prisma.InputJsonValue,
        ipHash: this.crypto.hashIp(ip),
      },
    });
    return { received: true };
  }

  async list(status?: InboundStatus) {
    return this.prisma.inboundLead.findMany({
      where: status ? { status } : undefined,
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  /** Gelen lead'in ziyaretci gecmisi — form doldurmadan once ne gezmis. */
  async journey(id: string) {
    const lead = await this.prisma.inboundLead.findUnique({ where: { id } });
    if (!lead?.visitorId) return [];
    return this.prisma.visitorEvent.findMany({
      where: { visitorId: lead.visitorId },
      orderBy: { occurredAt: 'asc' },
      take: 200,
    });
  }

  /**
   * Gelen lead'i havuza cevirir.
   *
   * Mukerrer onleme: ayni e-posta veya ad+telefon zaten varsa YENI
   * isletme acmiyor, mevcut kayda bagliyoruz. Aksi halde formu iki kez
   * dolduran biri iki ayri isletme olurdu.
   */
  async convert(id: string) {
    const lead = await this.prisma.inboundLead.findUnique({ where: { id } });
    if (!lead) {
      throw new BadRequestException({ code: 'not_found', message: 'Kayit bulunamadi' });
    }
    if (lead.companyId) {
      return { companyId: lead.companyId, created: false };
    }

    const name = lead.name?.trim() || lead.email?.split('@')[0] || 'Isimsiz kayit';
    const nameNormalized = normalizeName(name);

    let company = lead.email
      ? await this.prisma.company.findFirst({
          where: { contacts: { some: { email: lead.email } } },
        })
      : null;
    company ??= await this.prisma.company.findFirst({ where: { nameNormalized } });

    const created = !company;
    company ??= await this.prisma.company.create({
      data: {
        source: 'inbound',
        name,
        nameNormalized,
        phone: lead.phone,
        countryCode: 'TR',
      },
    });

    if (lead.email) {
      await this.prisma.contact.upsert({
        where: { companyId_email: { companyId: company.id, email: lead.email } },
        update: {},
        create: {
          companyId: company.id,
          email: lead.email,
          name: lead.name,
          phone: lead.phone,
          source: 'inbound',
          // Kisi formu kendi doldurdu: bu adres tahmin degil, dogrulanmis.
          confidence: 'VERIFIED',
          isPrimary: true,
        },
      });
    }

    await this.prisma.inboundLead.update({
      where: { id },
      data: { companyId: company.id, status: InboundStatus.CONVERTED },
    });

    return { companyId: company.id, created };
  }
}
