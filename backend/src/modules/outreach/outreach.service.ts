import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ActivityType, DncType } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { ActivityService } from '../crm-shared/activity.service';
import {
  buildMessages,
  classifyPhone,
  whatsappUrl,
  type CompanyForMessage,
  type MessageTemplate,
  type PhoneKind,
} from './message-builder';

const TEMPLATES_KEY = 'outreach.whatsapp_templates';

/** Sablonlar veritabaninda; Ayarlar ekranindan degistirilebilsinler diye. */
export const DEFAULT_TEMPLATES: MessageTemplate[] = [
  {
    key: 'sosyal_kanit',
    label: 'Sosyal kanıt',
    body:
      'Merhaba, {{isim}} yetkilisiyle görüşebilir miyim? Google’da {{yorum}} yorum ve ' +
      '{{puan}} puanınız var — {{ilce}} için bu gerçekten iyi bir iş. Sizi arayan müşteri ' +
      'Google’da bulup çıkıyor ama elinde sizin bir siteniz kalmıyor. SiteStudyo olarak ' +
      'bunu konuşmak isteriz.',
  },
  {
    key: 'sade',
    label: 'Sade',
    body:
      'Merhaba, {{isim}} için yazıyorum. {{ilce}} bölgesinde {{kategori}} işletmelerine ' +
      'web sitesi yapıyoruz. Google’da görünüyorsunuz ama web siteniz yok — kısa bir ' +
      'görüşmeye ne dersiniz? SiteStudyo',
  },
  {
    key: 'site_sorunlu',
    label: 'Site sorunlu',
    body:
      'Merhaba, {{isim}} web sitenizde teknik sorunlar tespit ettik (mobil uyum ve ' +
      'güvenlik sertifikası). Bu durum müşterilerinizin size ulaşmasını zorlaştırıyor ' +
      'olabilir. Kısaca konuşalım mı? SiteStudyo',
  },
];

export interface OutreachOptions {
  templates: MessageTemplate[];
  phoneKind: PhoneKind;
  /** Temas edilmemesi gereken bir numara mi? */
  blocked: boolean;
  blockedReason: string | null;
}

@Injectable()
export class OutreachService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activities: ActivityService,
  ) {}

  async listTemplates(): Promise<MessageTemplate[]> {
    const row = await this.prisma.setting.findUnique({ where: { key: TEMPLATES_KEY } });
    if (!row) return DEFAULT_TEMPLATES;
    const v = row.value as unknown;
    return Array.isArray(v) && v.length ? (v as MessageTemplate[]) : DEFAULT_TEMPLATES;
  }

  async saveTemplates(templates: MessageTemplate[]): Promise<MessageTemplate[]> {
    await this.prisma.setting.upsert({
      where: { key: TEMPLATES_KEY },
      update: { value: templates as never },
      create: { key: TEMPLATES_KEY, value: templates as never },
    });
    return templates;
  }

  /**
   * Bir isletme icin gonderilebilecek mesajlari uretir.
   *
   * Gonderim ONCESI Do-Not-Contact kontrolu burada: "bir daha yazma"
   * diyene yazmak geri alinamaz bir hata ve arayuzun bunu gostermeden
   * dugmeyi aktif birakmasi kabul edilemez.
   */
  async messagesFor(companyId: string) {
    const c = await this.prisma.company.findUnique({
      where: { id: companyId },
      select: {
        id: true,
        name: true,
        district: true,
        city: true,
        categoryRaw: true,
        phone: true,
        phoneE164: true,
        websiteStatus: true,
        googleRating: true,
        googleReviewsCount: true,
      },
    });
    if (!c) throw new NotFoundException({ code: 'not_found', message: 'İşletme bulunamadı' });

    const forMessage: CompanyForMessage = {
      name: c.name,
      district: c.district,
      city: c.city,
      categoryRaw: c.categoryRaw,
      phoneE164: c.phoneE164,
      websiteStatus: c.websiteStatus,
      googleRating: c.googleRating === null ? null : Number(c.googleRating),
      googleReviewsCount: c.googleReviewsCount,
    };

    const templates = await this.listTemplates();
    const phoneKind = classifyPhone(c.phoneE164);

    let blocked = false;
    let blockedReason: string | null = null;
    if (c.phoneE164) {
      const dnc = await this.prisma.doNotContact.findFirst({
        where: { type: DncType.PHONE, value: c.phoneE164 },
      });
      if (dnc) {
        blocked = true;
        blockedReason = dnc.reason ?? 'Temas edilmeyecekler listesinde';
      }
    }

    const messages = buildMessages(forMessage, templates);

    return {
      companyId: c.id,
      name: c.name,
      phone: c.phone,
      phoneE164: c.phoneE164,
      phoneKind,
      blocked,
      blockedReason,
      messages: messages.map((m) => ({
        ...m,
        url: c.phoneE164 && !blocked ? whatsappUrl(c.phoneE164, m.text) : null,
      })),
    };
  }

  /**
   * WhatsApp temasini kaydeder.
   *
   * Arayuz bunu wa.me penceresini AÇARKEN cagiriyor, acilmasini
   * beklemeden: kullanicinin akisini kesmemek icin. Kayit basarisiz
   * olsa bile pencere aciliyor.
   */
  async logWhatsApp(companyId: string, userId: string, templateKey: string, text: string) {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      select: { id: true },
    });
    if (!company) throw new NotFoundException({ code: 'not_found', message: 'İşletme bulunamadı' });

    return this.activities.record({
      type: ActivityType.WHATSAPP,
      companyId,
      userId,
      subject: `WhatsApp mesajı gönderildi (${templateKey})`,
      body: text.slice(0, 4000),
      meta: { templateKey },
    });
  }

  /** Bu numaraya bir daha yazma. */
  async blockPhone(companyId: string, userId: string, reason: string | null) {
    const c = await this.prisma.company.findUnique({
      where: { id: companyId },
      select: { phoneE164: true },
    });
    if (!c?.phoneE164) {
      throw new BadRequestException({
        code: 'no_phone',
        message: 'Bu işletmenin telefon numarası yok',
      });
    }
    await this.prisma.doNotContact.upsert({
      where: { type_value: { type: DncType.PHONE, value: c.phoneE164 } },
      update: { reason },
      create: { type: DncType.PHONE, value: c.phoneE164, reason, createdBy: userId },
    });
    await this.activities.record({
      type: ActivityType.SYSTEM,
      companyId,
      userId,
      subject: 'Temas edilmeyecekler listesine eklendi',
      body: reason,
    });
    return { blocked: true };
  }
}
