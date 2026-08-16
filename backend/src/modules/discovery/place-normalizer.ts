import { createHash } from 'node:crypto';
import { WebsiteStatus } from '@prisma/client';
import type { RawPlace } from './place-provider.interface';

/** Isletmenin veritabanina yazilmaya hazir hali. */
export interface NormalizedCompany {
  placeId: string;
  source: string;
  name: string;
  nameNormalized: string;
  dedupeKey: string | null;
  categoryRaw: string | null;
  sector: string | null;
  address: string | null;
  street: string | null;
  city: string | null;
  district: string | null;
  neighborhood: string | null;
  postalCode: string | null;
  countryCode: string | null;
  lat: number | null;
  lng: number | null;
  phone: string | null;
  phoneE164: string | null;
  websiteUrl: string | null;
  websiteDomain: string | null;
  websiteStatus: WebsiteStatus;
  googleRating: number | null;
  googleReviewsCount: number | null;
  googleUrl: string | null;
  businessStatus: string | null;
  raw: unknown;
}

export interface NormalizeOptions {
  /** categoryRaw -> sector eslemesi (sector_mappings tablosundan). */
  sectorMap: Map<string, string>;
  /** Bu tarama `withoutWebsite` filtresiyle mi kostu? (bkz. classifyWebsite) */
  onlyWithoutWebsite: boolean;
  source?: string;
}

/**
 * Turkiye'de saglayici IL bilgisini `state`, ILCE bilgisini `city` alanina
 * yaziyor (ornek: city="Kadıköy", state="İstanbul").
 *
 * Duz eslersek `?city=İstanbul` filtresi HIC kayit dondurmez ve kullanici
 * havuzun bos oldugunu saniyor. Bu yuzden TR'de alanlar takas ediliyor.
 * Diger ulkelerde `state` eyalet/bolge demek, oraya dokunmuyoruz.
 */
const STATE_IS_CITY_COUNTRIES = new Set(['TR']);

/**
 * Il adini tek bicime indirger.
 *
 * Google buyuk sehirleri bolgeye bolerek dondurebiliyor: "İstanbul - Asya",
 * "Istanbul - Europe", "Istanbul - Asia". Bunlar duzeltilmezse `city=İstanbul`
 * filtresi o kayitlari KACIRIR — kullanici havuzda olmayan isletmeler
 * oldugunu bilmez. Gercek veride 1.812 kaydin 9'u boyleydi.
 *
 * Ayrica noktasiz "Istanbul" -> "İstanbul": MySQL siralama harf duyarsiz
 * olsa da 'I' ile 'İ' AYRI harfler ve esitlik saglamaz.
 */
const CITY_CANONICAL: Record<string, string> = {
  istanbul: 'İstanbul',
  'istanbul - asya': 'İstanbul',
  'istanbul - avrupa': 'İstanbul',
  'istanbul - asia': 'İstanbul',
  'istanbul - europe': 'İstanbul',
  izmir: 'İzmir',
  ankara: 'Ankara',
};

export function canonicalCity(raw: string | null | undefined): string | null {
  if (!raw?.trim()) return null;
  const cleaned = raw.trim().replace(/\s+/g, ' ');
  // Noktali/noktasiz I ayrimini kaldirip arama anahtarina ceviriyoruz.
  const key = cleaned.toLowerCase().replace(/i̇/g, 'i').replace(/ı/g, 'i');
  return CITY_CANONICAL[key] ?? cleaned;
}

const SOCIAL_HOSTS = [
  'instagram.com',
  'facebook.com',
  'fb.com',
  'linktr.ee',
  'tiktok.com',
  'twitter.com',
  'x.com',
  'youtube.com',
  'linkedin.com',
  'wa.me',
  'sahibinden.com',
  'blogspot.com',
  'wixsite.com',
  'business.site', // Google'in kendi mini sayfasi — gercek site sayilmaz
];

/**
 * Telefonu E.164'e cevirir (+905551234567).
 *
 * Mukerrer anahtarinin yarisi bu deger; bicim tutarsizsa ayni isletme
 * "0216 418 10 76" ve "+90 216 418 10 76" olarak iki kez girer.
 */
export function toE164(raw: string | null | undefined, countryCode = 'TR'): string | null {
  if (!raw?.trim()) return null;

  const hasPlus = raw.trim().startsWith('+');
  let digits = raw.replace(/\D/g, '');
  if (!digits) return null;

  const cc = countryCode === 'TR' ? '90' : null;

  if (!hasPlus && cc) {
    if (digits.startsWith('0')) digits = cc + digits.slice(1);
    else if (digits.length === 10) digits = cc + digits;
  }

  // E.164 tavani 15 hane; 7'nin altini gecerli bir numara saymiyoruz.
  if (digits.length < 7 || digits.length > 15) return null;
  return `+${digits}`;
}

/**
 * Web sitesi durumunu belirler — bu fazin en kritik karari.
 *
 * `website` alaninin UC hali var ve ucu de farkli anlama geliyor:
 *   undefined + filtre KAPALI -> saglayici bakmadi, BILINMIYOR
 *   undefined + filtre ACIK   -> tarama zaten sitesizleri getirdi, SITESI YOK
 *   null                      -> saglayici bakti ve bulamadi, SITESI YOK
 *
 * Ilk iki durum karistirilirsa lead puanlamasinin en agirlikli girdisi
 * (sitesi yok = 40 puan) uydurma olur: ya 384 sicak lead soguk gorunur,
 * ya da hicbir sey bilinmeyen kayitlar sicak damgasi yer.
 */
export function classifyWebsite(
  website: string | null | undefined,
  onlyWithoutWebsite: boolean,
): { status: WebsiteStatus; url: string | null } {
  if (website === undefined) {
    return {
      status: onlyWithoutWebsite ? WebsiteStatus.NO_WEBSITE : WebsiteStatus.UNKNOWN,
      url: null,
    };
  }
  if (website === null || !website.trim()) {
    return { status: WebsiteStatus.NO_WEBSITE, url: null };
  }

  const url = parseUrl(website);
  if (!url) return { status: WebsiteStatus.UNKNOWN, url: null };

  const host = url.hostname.replace(/^www\./, '');
  if (SOCIAL_HOSTS.some((s) => host === s || host.endsWith(`.${s}`))) {
    return { status: WebsiteStatus.SOCIAL_ONLY, url: url.toString().replace(/\/$/, '') };
  }

  // Gercek bir site var ama kalitesi OLCULMEDI. ACTIVE_GOOD demek
  // olculmemis bir iddia olurdu; Faz 4 analizoru karar verecek.
  return { status: WebsiteStatus.UNKNOWN, url: url.toString().replace(/\/$/, '') };
}

function parseUrl(value: string): URL | null {
  const candidate = /^https?:\/\//i.test(value) ? value : `https://${value}`;
  try {
    const url = new URL(candidate);
    // Nokta icermeyen veya bosluklu "host" gercek alan adi degil.
    if (!url.hostname.includes('.') || /\s/.test(url.hostname)) return null;
    return url;
  } catch {
    return null;
  }
}

export function extractDomain(url: string | null): string | null {
  if (!url) return null;
  const parsed = parseUrl(url);
  return parsed ? parsed.hostname.replace(/^www\./, '') : null;
}

/**
 * Ikincil mukerrer anahtari: placeId olmayan veya degisen kayitlari yakalar.
 *
 * Telefon yoksa NULL doner — MySQL NULL'lari benzersiz saymaz, boylece
 * telefonsuz yuzlerce kayit birbirini engellemez.
 */
export function buildDedupeKey(nameNormalized: string, phoneE164: string | null): string | null {
  if (!phoneE164) return null;
  return createHash('sha256').update(`${nameNormalized}|${phoneE164}`).digest('hex');
}

/** Turkce yerelle sadelestirir; 'I'.toLowerCase() yerele bagli oldugu icin acikca veriliyor. */
export function normalizeName(name: string): string {
  return name.toLocaleLowerCase('tr').replace(/\s+/g, ' ').trim();
}

export function normalizePlace(place: RawPlace, opts: NormalizeOptions): NormalizedCompany {
  const country = (place.countryCode ?? 'TR').toUpperCase();
  const swap = STATE_IS_CITY_COUNTRIES.has(country);

  const city = canonicalCity(swap ? place.state : place.city);
  const district = swap ? (place.city ?? null) : null;

  const phoneE164 = toE164(place.phoneUnformatted ?? place.phone, country);
  const nameNormalized = normalizeName(place.name);
  const web = classifyWebsite(place.website, opts.onlyWithoutWebsite);

  const categoryRaw = place.categoryName ?? place.categories?.[0] ?? null;

  return {
    placeId: place.placeId,
    source: opts.source ?? 'apify',
    name: place.name,
    nameNormalized,
    dedupeKey: buildDedupeKey(nameNormalized, phoneE164),
    categoryRaw,
    // Eslenmemis kategoride uydurma bir sektor atamak filtreyi sessizce
    // yanlis yapardi; bos birakip categoryRaw'i sakliyoruz.
    // Anahtar kucuk harfe cevrilerek araniyor: MySQL'in utf8mb4_unicode_ci
    // siralamasi buyuk/kucuk harf duyarsiz, JavaScript'in Map'i duyarli.
    // "Nakliyat Şirketi" ile "Nakliyat şirketi" veritabaninda TEK satira
    // duser ama duz aramada ikincisi bulunamaz ve kategori sessizce
    // eslenmemis gorunur.
    sector: categoryRaw ? (opts.sectorMap.get(categoryRaw.toLocaleLowerCase('tr')) ?? null) : null,
    address: place.address ?? null,
    street: place.street ?? null,
    city,
    district,
    neighborhood: place.neighborhood ?? null,
    postalCode: place.postalCode ?? null,
    countryCode: country,
    lat: place.lat ?? null,
    lng: place.lng ?? null,
    phone: place.phone ?? null,
    phoneE164,
    websiteUrl: web.url,
    websiteDomain: extractDomain(web.url),
    websiteStatus: web.status,
    googleRating: place.totalScore ?? null,
    googleReviewsCount: place.reviewsCount ?? null,
    googleUrl: place.url ?? null,
    businessStatus: place.permanentlyClosed
      ? 'PERMANENTLY_CLOSED'
      : place.temporarilyClosed
        ? 'TEMPORARILY_CLOSED'
        : 'OPERATIONAL',
    raw: place.raw,
  };
}
