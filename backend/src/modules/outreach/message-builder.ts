import { WebsiteStatus } from '@prisma/client';
import type { ScoreReason } from '../scoring/lead-scorer';
import {
  buildVariables,
  problemOf,
  SENTENCE_CRITICAL_VARIABLES,
  type AnalysisForMessage,
} from './personalize';

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
  /** Kullanilabilir degiskenlerin listesi: personalize.ts TEMPLATE_VARIABLES. */
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
  /**
   * Asagidaki ucu ISTEGE BAGLI. Verilmediginde ilgili degiskenler bos
   * kalir ve onlari kullanan cumleler mesajdan dusuyor — yani eski
   * cagiranlar bozulmadan calismaya devam ediyor.
   */
  sector?: string | null;
  analysis?: AnalysisForMessage | null;
  scoreReasons?: ScoreReason[] | null;
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

/**
 * Icinde verilen etiketi barindiran CUMLELERI atar.
 *
 * Kozmetik bosluk temizligi burada yetmiyor: tasiyici degiskeni bos kalan
 * bir cumle ("Sitenizde tespit ettigimiz sorun:.") dilbilgisel olarak
 * onarilamaz, silinmesi gerekiyor. Satir yapisi korunuyor ki sablonun
 * paragraflari bozulmasin.
 */
function dropSentencesWith(body: string, placeholder: string): string {
  return body
    .split('\n')
    .map((line) => {
      const parts = line.match(/[^.!?]+[.!?]*\s*/g);
      if (!parts) return line;
      return parts.filter((p) => !p.includes(placeholder)).join('');
    })
    .join('\n');
}

/**
 * Sablondaki degiskenleri doldurur.
 *
 * Iki farkli bosluk davranisi var ve ayrimi bilinerek yapildi:
 * - Sıradan degisken (isim, ilce, puan) bos kalirsa yalnizca kendisi
 *   silinir; cumle ayakta kalir.
 * - Tasiyici degisken (sorun, sorunDetay, skorGerekce) bos kalirsa
 *   CUMLENIN TAMAMI dusuyor. Bu degiskenler olculmus veriye dayaniyor ve
 *   veri yoksa o cumlenin soyleyecegi bir sey de yok.
 */
export function renderTemplate(body: string, c: CompanyForMessage): string {
  const values = buildVariables({
    name: c.name,
    district: c.district,
    city: c.city,
    categoryRaw: c.categoryRaw,
    sector: c.sector ?? null,
    websiteStatus: c.websiteStatus,
    googleRating: c.googleRating,
    googleReviewsCount: c.googleReviewsCount,
    analysis: c.analysis ?? null,
    scoreReasons: c.scoreReasons ?? null,
  });

  let text = body;
  for (const key of SENTENCE_CRITICAL_VARIABLES) {
    if (values[key]) continue;
    text = dropSentencesWith(text, `{{${key}}}`);
  }

  return (
    text
      .replace(/\{\{(\w+)\}\}/g, (_, k: string) => values[k] ?? '')
      // Degisken bos kalinca olusan cift bosluklari ve bosluk-noktalama
      // birlesimlerini temizliyoruz; aksi halde musteriye "Merhaba ,
      // yetkilisi" gibi bir mesaj gider.
      .replace(/ {2,}/g, ' ')
      .replace(/\s+([,.!?])/g, '$1')
      .replace(/\(\s*\)/g, '')
      .replace(/,\s*,/g, ',')
      // Cumle dusurulunce satir basinda sarkan noktalama kalabiliyor.
      .replace(/^[,;:\s]+/gm, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim()
  );
}

/**
 * Bu isletme icin hangi sablon onerilmeli?
 *
 * Sosyal kanit en guclu argumandir ama ancak gercekten kanit varsa:
 * 20'den az yorumu olan bir isletmeye "yorumlariniz harika" demek
 * inandiriciligi bitirir.
 *
 * SOZLESME: donen deger her zaman su UC SABIT anahtardan biri —
 * 'sosyal_kanit' | 'site_sorunlu' | 'sade'. Yeni bir anahtar eklenemez,
 * cunku kullanicinin kayitli sablon listesinde karsiligi olmaz ve
 * buildMessages sessizce ilk sablona duser (uc test bunu koruyor).
 *
 * "Sitesi yok" olan isletme site_sorunlu ALMIYOR: olmayan bir sitenin
 * teknik sorunlarindan bahsetmek anlamsiz olur.
 */
export function recommendedTemplateKey(c: CompanyForMessage): string {
  const reviews = c.googleReviewsCount ?? 0;
  const rating = c.googleRating ?? 0;
  const socialProof = reviews >= 20 && rating >= 4.0;
  const siteless =
    c.websiteStatus === WebsiteStatus.NO_WEBSITE ||
    c.websiteStatus === WebsiteStatus.SOCIAL_ONLY;

  if (siteless) return socialProof ? 'sosyal_kanit' : 'sade';

  // Sitesi olan isletmede OLCULMUS bir sorun varsa site_sorunlu. Bu, eski
  // haline gore su durumu da yakaliyor: durumu ACTIVE_GOOD gorunen ama
  // analizde mobil uyumsuz / sertifikasi bozuk cikan siteler.
  if (problemOf({ websiteStatus: c.websiteStatus, analysis: c.analysis ?? null })) {
    return 'site_sorunlu';
  }
  return 'sade';
}

export function buildMessages(
  c: CompanyForMessage,
  templates: MessageTemplate[],
): RenderedMessage[] {
  const best = recommendedTemplateKey(c);
  // Onerilen anahtar SABIT KODLU ('sosyal_kanit' / 'site_sorunlu' / 'sade').
  // Kullanici artik kendi sablonlarini ekleyip bunlari silebiliyor; o anahtar
  // listede yoksa hicbir sablon onerilmis gorunmez ve kimse sebebini anlamaz.
  // Eslesme tutmazsa listedeki ilk sablona dusuyoruz: oneri kalitesi duser
  // ama ipucu satiri sessizce kaybolmaz.
  const chosen = templates.some((t) => t.key === best) ? best : templates[0]?.key;
  return templates.map((t) => ({
    key: t.key,
    label: t.label,
    text: renderTemplate(t.body, c),
    recommended: t.key === chosen,
  }));
}
