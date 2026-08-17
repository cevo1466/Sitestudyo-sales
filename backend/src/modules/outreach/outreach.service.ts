import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ActivityType, DncType } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { ActivityService } from '../crm-shared/activity.service';
import { ScoringService } from '../scoring/scoring.service';
import type { ScoreRule } from '../scoring/lead-scorer';
import {
  buildMessages,
  classifyPhone,
  whatsappUrl,
  type CompanyForMessage,
  type MessageTemplate,
  type PhoneKind,
} from './message-builder';

const TEMPLATES_KEY = 'outreach.whatsapp_templates';

/**
 * Mesaj uretmek icin gereken TAM veri.
 *
 * Tek yerde duruyor cunku iki cagiran var: tek isletmelik `messagesFor` ve
 * toplu `WorkQueueService.prepare`. Ikisi ayri select yazarsa biri
 * eksik veriyle calisir ve ayni isletme iki ekranda iki farkli mesaj
 * gosterir.
 */
export const COMPANY_FOR_MESSAGE_SELECT = {
  id: true,
  name: true,
  district: true,
  city: true,
  categoryRaw: true,
  sector: true,
  phone: true,
  phoneE164: true,
  websiteStatus: true,
  googleRating: true,
  googleReviewsCount: true,
  leadScore: true,
  leadGrade: true,
  analyses: {
    orderBy: { checkedAt: 'desc' },
    take: 1,
    select: {
      isResponsive: true,
      sslValid: true,
      httpsRedirect: true,
      loadMs: true,
      ttfbMs: true,
      httpStatus: true,
      errorCode: true,
      hasTitle: true,
      hasMetaDesc: true,
      contactSignals: true,
    },
  },
  contacts: { where: { email: { not: null } }, take: 1, select: { id: true } },
} as const;

/**
 * Sablonlar veritabaninda; Ayarlar ekranindan degistirilebilsinler diye.
 *
 * Bu metinler yalnizca HIC sablon kaydedilmemis kurulumlarda devreye
 * giriyor; Melih'in kayitli sablonlari varsa dokunulmuyor.
 *
 * Tasiyici degiskenler ({{sorun}}, {{sorunDetay}}, {{skorGerekce}}) ayri
 * cumlelere konuldu: veri olculmemisse o cumle mesajdan tamamen dusuyor ve
 * kalan metin kendi basina anlamli kaliyor.
 */
export const DEFAULT_TEMPLATES: MessageTemplate[] = [
  {
    key: 'sosyal_kanit',
    label: 'Sosyal kanıt',
    body:
      'Merhaba, {{isim}} yetkilisiyle görüşebilir miyim? Google’da {{yorum}} yorum ve ' +
      '{{puan}} puanınız var — {{ilce}} için bu gerçekten iyi bir iş. Bizim dikkatimizi ' +
      'çeken {{skorGerekce}} oldu. Sizi arayan müşteri Google’da bulup çıkıyor ama ' +
      'elinde sizin bir siteniz kalmıyor. SiteStudyo olarak bunu konuşmak isteriz.',
  },
  {
    key: 'sade',
    label: 'Sade',
    body:
      'Merhaba, {{ilkAd}} için yazıyorum. {{ilce}} bölgesinde {{sektorTekil}} ' +
      'işletmelerine web sitesi yapıyoruz. Sitenizle ilgili dikkatimizi çeken bir şey ' +
      'var: {{sorun}}. Kısa bir görüşmeye ne dersiniz? SiteStudyo',
  },
  {
    key: 'site_sorunlu',
    label: 'Site sorunlu',
    body:
      'Merhaba, {{ilkAd}} için yazıyorum. Web sitenizi hızlıca kontrol ettik: {{sorun}}. ' +
      '{{sorunDetay}}. {{ilce}} bölgesinde {{sektorTekil}} işletmelerine web sitesi ' +
      'yapıyoruz, bunu birlikte düzeltebiliriz. Kısaca konuşalım mı? SiteStudyo',
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
    private readonly scoring: ScoringService,
  ) {}

  /**
   * Veritabani kaydini mesaj uretimine hazir hale getirir.
   *
   * Skor gerekcelerini yeniden HESAPLIYOR (kayitli `leadScore` sadece bir
   * sayi, kirilimi saklanmiyor). Kurallar disaridan geliyor ki toplu
   * hazirlikta 50 kez yeniden yuklenmesin.
   */
  toCompanyForMessage(
    c: {
      name: string;
      district: string | null;
      city: string | null;
      categoryRaw: string | null;
      sector: string | null;
      phoneE164: string | null;
      websiteStatus: CompanyForMessage['websiteStatus'];
      googleRating: unknown;
      googleReviewsCount: number | null;
      contacts: unknown[];
      analyses: Array<{
        isResponsive: boolean | null;
        sslValid: boolean | null;
        httpsRedirect: boolean | null;
        loadMs: number | null;
        ttfbMs: number | null;
        httpStatus: number | null;
        errorCode: string | null;
        hasTitle: boolean | null;
        hasMetaDesc: boolean | null;
        contactSignals: unknown;
      }>;
    },
    rules: ScoreRule[],
  ): CompanyForMessage {
    const a = c.analyses[0] ?? null;
    return {
      name: c.name,
      district: c.district,
      city: c.city,
      categoryRaw: c.categoryRaw,
      sector: c.sector,
      phoneE164: c.phoneE164,
      websiteStatus: c.websiteStatus,
      googleRating: c.googleRating === null ? null : Number(c.googleRating),
      googleReviewsCount: c.googleReviewsCount,
      analysis: a
        ? {
            isResponsive: a.isResponsive,
            sslValid: a.sslValid,
            httpsRedirect: a.httpsRedirect,
            loadMs: a.loadMs,
            ttfbMs: a.ttfbMs,
            httpStatus: a.httpStatus,
            errorCode: a.errorCode,
            hasTitle: a.hasTitle,
            hasMetaDesc: a.hasMetaDesc,
          }
        : null,
      scoreReasons: this.scoring.scoreCompany(c, rules).reasons,
    };
  }

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
      select: COMPANY_FOR_MESSAGE_SELECT,
    });
    if (!c) throw new NotFoundException({ code: 'not_found', message: 'İşletme bulunamadı' });

    const rules = await this.scoring.loadRules();
    const forMessage = this.toCompanyForMessage(c, rules);

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
   * Arayuz bunu ancak wa.me penceresi GERCEKTEN acildiktan sonra cagiriyor.
   * Onceden acma denemesiyle ayni anda cagiriliyordu ve masaustunde pencere
   * hic acilmadigi halde kayit olusuyordu — zaman tuneli yalan soyluyordu.
   *
   * Iki asamali kayit:
   * - `opened`: pencere acildi, mesajin gonderildigini BILMIYORUZ.
   * - `sent`:  kullanici panelde "Gonderdim" dedi. Tek dogrulama yolu bu;
   *            WhatsApp gonderim durumunu hicbir yere bildirmiyor.
   *
   * Iki durum da ActivityType.WHATSAPP ile geciyor, yani ikisi de
   * `lastContactedAt`i guncelliyor. Bilincli: acma basarisizsa zaten hic
   * kayit olusmuyor, basarili acma gercek bir temas girisimidir. Aksi halde
   * "actim ama gondermedim" durumundaki isletme ertesi gun kuyruga yeniden
   * dusup tekrar acilirdi.
   */
  async logWhatsApp(
    companyId: string,
    userId: string,
    templateKey: string,
    text: string,
    outcome: 'opened' | 'sent' = 'opened',
  ) {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      select: { id: true },
    });
    if (!company) throw new NotFoundException({ code: 'not_found', message: 'İşletme bulunamadı' });

    return this.activities.record({
      type: ActivityType.WHATSAPP,
      companyId,
      userId,
      subject:
        outcome === 'sent'
          ? `WhatsApp mesajı gönderildi (${templateKey})`
          : `WhatsApp açıldı (${templateKey})`,
      body: text.slice(0, 4000),
      meta: { templateKey, outcome },
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
