import { WebsiteStatus } from '@prisma/client';

/**
 * WhatsApp mesaji uretimi ve telefon siniflandirmasi.
 *
 * Saf fonksiyonlar: veritabanina dokunmuyor, sablonlari disaridan aliyor.
 * Boylece "bu isletmeye hangi mesaj gider" sorusu tek bir testle
 * cevaplanabiliyor ve sablon degisikligi tum sistemi calistirmadan
 * denenebiliyor.
 */

export type PhoneKind = 'mobile' | 'landline' | 'none';

export interface MessageTemplate {
  key: string;
  label: string;
  /** {{isim}} {{puan}} {{yorum}} {{ilce}} {{kategori}} degiskenlerini kullanir. */
  body: string;
}

export interface CompanyForMessage {
  name: string;
  district: string | null;
  city: string | null;
  categoryRaw: string | null;
  phoneE164: string | null;
  websiteStatus: WebsiteStatus;
  googleRating: number | null;
  googleReviewsCount: number | null;
}

export interface RenderedMessage {
  key: string;
  label: string;
  text: string;
  /** Bu isletme icin en uygun sablon mu? Arayuz bunu onceden isaretliyor. */
  recommended: boolean;
}

/**
 * Numaranin WhatsApp'i olma ihtimalini siniflandirir.
 *
 * ONEMLI SINIR: bir numaranin WhatsApp'ta kayitli olup olmadigini
 * onceden ogrenmenin yolu YOK — WhatsApp boyle bir sorgu vermiyor.
 * Yapabilecegimiz tek durust sey numara TURUNU soylemek:
 * Turkiye'de cep hatlari (+905...) neredeyse her zaman WhatsApp'li,
 * sabit hatlar (+90212/312/232...) neredeyse hicbir zaman degil.
 *
 * Havuzun ucte biri sabit hat oldugu icin bu ayrim onemli: uyarmadan
 * "WhatsApp'tan yaz" demek, kullaniciyi 661 kez bosa ugrastirirdi.
 */
export function classifyPhone(phoneE164: string | null): PhoneKind {
  if (!phoneE164) return 'none';
  const digits = phoneE164.replace(/\D/g, '');
  // Turkiye cep hatlari: +90 5xx
  if (digits.startsWith('905')) return 'mobile';
  if (digits.startsWith('90')) return 'landline';
  // Yabanci numarada tur tahmini yapmiyoruz; denemesi kullaniciya kalsin.
  return 'mobile';
}

/** wa.me baglantisi. Numara yalnizca rakam, mesaj yuzde kodlamali. */
export function whatsappUrl(phoneE164: string, message: string): string {
  const digits = phoneE164.replace(/\D/g, '');
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

/** Sablondaki degiskenleri doldurur. Karsiligi olmayan degisken BOS birakilir. */
export function renderTemplate(body: string, c: CompanyForMessage): string {
  const values: Record<string, string> = {
    isim: c.name,
    puan: c.googleRating !== null ? c.googleRating.toFixed(1) : '',
    yorum: c.googleReviewsCount !== null ? c.googleReviewsCount.toLocaleString('tr') : '',
    ilce: c.district ?? c.city ?? '',
    kategori: (c.categoryRaw ?? '').toLocaleLowerCase('tr'),
  };
  return (
    body
      .replace(/\{\{(\w+)\}\}/g, (_, k: string) => values[k] ?? '')
      // Degisken bos kalinca olusan cift bosluklari ve bosluk-noktalama
      // birlesimlerini temizliyoruz; aksi halde musteriye "Merhaba ,
      // yetkilisi" gibi bir mesaj gider.
      .replace(/ {2,}/g, ' ')
      .replace(/\s+([,.!?])/g, '$1')
      .replace(/\(\s*\)/g, '')
      .trim()
  );
}

/**
 * Bu isletme icin hangi sablon onerilmeli?
 *
 * Sosyal kanit en guclu argumandir ama ancak gercekten kanit varsa:
 * 20'den az yorumu olan bir isletmeye "yorumlariniz harika" demek
 * inandiriciligi bitirir.
 */
export function recommendedTemplateKey(c: CompanyForMessage): string {
  const reviews = c.googleReviewsCount ?? 0;
  const rating = c.googleRating ?? 0;

  if (
    c.websiteStatus === WebsiteStatus.NO_WEBSITE &&
    reviews >= 20 &&
    rating >= 4.0
  ) {
    return 'sosyal_kanit';
  }
  if (
    c.websiteStatus === WebsiteStatus.BROKEN ||
    c.websiteStatus === WebsiteStatus.OUTDATED ||
    c.websiteStatus === WebsiteStatus.ACTIVE_WEAK
  ) {
    return 'site_sorunlu';
  }
  return 'sade';
}

export function buildMessages(
  c: CompanyForMessage,
  templates: MessageTemplate[],
): RenderedMessage[] {
  const best = recommendedTemplateKey(c);
  return templates.map((t) => ({
    key: t.key,
    label: t.label,
    text: renderTemplate(t.body, c),
    recommended: t.key === best,
  }));
}
