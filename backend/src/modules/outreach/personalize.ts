import { WebsiteStatus } from '@prisma/client';
import type { ScoreReason } from '../scoring/lead-scorer';

/**
 * Sablon degiskenlerinin ISLETMEYE OZEL degerlerini uretir.
 *
 * Saf fonksiyonlar: veritabanina dokunmaz. Amac, her musteriye elle metin
 * yazmayi bitirmek — sablon bir kez yazilir, degiskenler o isletmenin
 * gercek verisinden dolar.
 *
 * TEMEL KURAL: uydurma yok. Bir bilgi olculmediyse degisken BOS doner ve
 * onu kullanan cumle tamamen silinir (bkz. message-builder/renderTemplate).
 * "Sitenizde tespit ettigimiz sorun:" diye baslayip devami olmayan bir
 * mesaj, hic mesaj atmamaktan kotudur.
 */

export interface TemplateVariable {
  name: string;
  label: string;
  example: string;
}

/**
 * Degisken katalogunun TEK kaynagi.
 *
 * Ayarlar ekranindaki degisken cipleri bunu API'den cekiyor. Onceden liste
 * hem burada hem masaustunde ayri ayri yazilmisti; biri guncellenip digeri
 * unutuldugunda kullaniciya var olmayan bir degisken oneriliyordu.
 */
export const TEMPLATE_VARIABLES: TemplateVariable[] = [
  { name: 'isim', label: 'İşletmenin tam adı', example: 'Sakal Kafe Pub' },
  { name: 'ilkAd', label: 'İşletmenin kısa adı', example: 'Sakal' },
  { name: 'sektorTekil', label: 'Sektör (insan dili)', example: 'restoran ve kafe' },
  { name: 'kategori', label: 'Google kategorisi', example: 'irlanda pub’ı' },
  { name: 'ilce', label: 'İlçe (yoksa il)', example: 'Kadıköy' },
  { name: 'sehir', label: 'İl', example: 'İstanbul' },
  { name: 'puan', label: 'Google puanı', example: '4.6' },
  { name: 'yorum', label: 'Google yorum sayısı', example: '312' },
  { name: 'sorun', label: 'Sitesindeki ana sorun (ölçülmüş)', example: 'siteniz telefonda düzgün görünmüyor' },
  { name: 'sorunDetay', label: 'Sorunun bir cümlelik açıklaması', example: 'Ziyaretçilerin çoğu telefondan giriyor ve sayfa ekrana sığmıyor' },
  { name: 'skorGerekce', label: 'Bu işletmeyi öne çıkaran sebepler', example: 'web sitenizin olmaması ve yorum sayınızın yüksek olması' },
];

/**
 * Sektor kovasinin musteriye soylenebilir hali.
 *
 * Veritabanindaki `sector` degerleri makine anahtari ('yeme_icme'); bunlar
 * mesaja oldugu gibi giremez.
 */
const SECTOR_NOUN: Record<string, string> = {
  guzellik: 'kuaför ve güzellik salonu',
  yeme_icme: 'restoran ve kafe',
  spor_saglik: 'spor ve sağlık',
  lojistik: 'nakliye ve lojistik',
  profesyonel_hizmet: 'ofis ve danışmanlık',
  perakende: 'perakende',
  egitim: 'eğitim',
  emlak: 'emlak',
  otomotiv: 'oto servis',
  temizlik: 'temizlik',
};

/**
 * Isletme adinda AYIRT EDICI olmayan kelimeler.
 *
 * "Cafe Nero" isletmesine "Merhaba Cafe" demek, adres defterinden
 * kopyalanmis bir mesaj gibi duruyor. Ilk ayirt edici kelime aranıyor.
 */
const GENERIC_NAME_WORDS = new Set([
  'cafe', 'café', 'kafe', 'restoran', 'restaurant', 'lokanta', 'lokantası',
  'bar', 'pub', 'bistro', 'otel', 'hotel', 'pastane', 'fırın', 'büfe',
  'kuaför', 'kuafor', 'berber', 'salon', 'salonu', 'güzellik', 'spa',
  'market', 'süpermarket', 'bakkal', 'mağaza', 'magaza', 'butik',
  'oto', 'otomotiv', 'servis', 'servisi', 'atölye', 'atölyesi', 'atolye',
  'dükkanı', 'dükkan', 'dukkan', 'merkezi', 'merkez', 'ofisi', 'ofis',
  'spor', 'stüdyo', 'stüdyosu', 'kliniği', 'klinik', 'eczanesi', 'eczane',
  'emlak', 'emlakçı', 'nakliyat', 'nakliye', 'lojistik', 'kargo',
  'ltd', 'ltd.', 'şti', 'şti.', 'sti', 'a.ş.', 'aş', 'a.ş', 'san', 'san.',
  'tic', 'tic.', 've', 'the', 'özel', 'ozel', 'dr', 'dr.',
]);

/** Isletmenin hitap edilebilir kisa adi. Ayirt edici kelime yoksa tam ad. */
export function firstName(name: string): string {
  const words = name
    .split(/\s+/)
    .map((w) => w.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}.]+$/gu, ''))
    .filter(Boolean);
  const distinctive = words.find((w) => !GENERIC_NAME_WORDS.has(w.toLocaleLowerCase('tr')));
  return distinctive ?? name.trim();
}

/**
 * Sektorun mesaja girebilecek hali.
 *
 * Once normalize edilmis kova (daha duzgun Turkce), sonra Google'in ham
 * kategorisi. Ikisi de yoksa BOS: sablonda "işletmeniz" gibi bir guvenli
 * varsayilan zaten cumleyi tasiyabiliyor.
 */
export function sectorSingular(sector: string | null, categoryRaw: string | null): string {
  if (sector && SECTOR_NOUN[sector]) return SECTOR_NOUN[sector];
  if (categoryRaw) return categoryRaw.toLocaleLowerCase('tr');
  return '';
}

/** Mesajda kullanilabilecek olculmus site verisi. */
export interface AnalysisForMessage {
  isResponsive: boolean | null;
  sslValid: boolean | null;
  httpsRedirect: boolean | null;
  loadMs: number | null;
  ttfbMs: number | null;
  httpStatus: number | null;
  errorCode: string | null;
  hasTitle: boolean | null;
  hasMetaDesc: boolean | null;
}

export interface ProblemInput {
  websiteStatus: WebsiteStatus;
  analysis: AnalysisForMessage | null;
}

export interface Problem {
  /** Cumle icine giren kisa hali: "siteniz telefonda düzgün görünmüyor". */
  short: string;
  /** Bir cumlelik aciklama. */
  detail: string;
}

const BROKEN_CODES = new Set(['DNS_FAIL', 'TIMEOUT', 'BLOCKED', 'EMPTY_PAGE']);

/** Yavas kabul edilen esikler. 3 sn'yi gecen sayfada ziyaretcinin yarisi kayboluyor. */
const SLOW_LOAD_MS = 4000;
const SLOW_TTFB_MS = 2000;

function seconds(ms: number): string {
  return (ms / 1000).toLocaleString('tr', { maximumFractionDigits: 1 });
}

/**
 * Isletmenin sitesindeki EN GUCLU tek sorunu secer.
 *
 * Siralama KANIT GUCUNE gore: itiraz edilemeyen ustte. "Siteniz yok"
 * tartisilamaz; "acilmiyor" musteri kendi telefonundan dogrulayabilir;
 * "SEO eksik" ise tartismaya acik ve satisi zayiflatir, en altta.
 *
 * Birden fazla sorun varsa yalniz biri soyleniyor: mesaja sorun listesi
 * koymak, satis konusmasini teknik tartismaya cevirir.
 *
 * Olculmus veri yoksa null — o zaman sorundan BAHSEDILMEZ.
 */
export function problemOf(input: ProblemInput): Problem | null {
  const a = input.analysis;

  if (input.websiteStatus === WebsiteStatus.NO_WEBSITE) {
    return {
      short: 'web siteniz yok',
      detail: 'Google’da görünüyorsunuz ama müşteriniz size ait bir sayfaya ulaşamıyor',
    };
  }
  if (input.websiteStatus === WebsiteStatus.SOCIAL_ONLY) {
    return {
      short: 'sadece sosyal medya hesabınız var',
      detail:
        'Sosyal medya dışında size ait bir adres yok, arama sonuçlarında rakipleriniz öne çıkıyor',
    };
  }
  if (
    input.websiteStatus === WebsiteStatus.BROKEN ||
    (a?.errorCode && BROKEN_CODES.has(a.errorCode)) ||
    (a?.httpStatus !== null && a?.httpStatus !== undefined && a.httpStatus >= 500)
  ) {
    return {
      short: 'siteniz açılmıyor',
      detail: 'Adresi denedik, sayfa yüklenmedi — müşteriniz de yükleyemiyor',
    };
  }
  if (a?.sslValid === false || a?.errorCode === 'SSL_ERROR') {
    return {
      short: 'sitenizde güvenlik sertifikası sorunu var',
      detail: 'Tarayıcılar ziyaretçiye “güvenli değil” uyarısı gösteriyor',
    };
  }
  if (a?.isResponsive === false) {
    return {
      short: 'siteniz telefonda düzgün görünmüyor',
      detail: 'Ziyaretçilerin çoğu telefondan giriyor ve sayfa ekrana sığmıyor',
    };
  }
  if ((a?.loadMs ?? 0) > SLOW_LOAD_MS || (a?.ttfbMs ?? 0) > SLOW_TTFB_MS) {
    const ms = a!.loadMs && a!.loadMs > SLOW_LOAD_MS ? a!.loadMs : a!.ttfbMs!;
    return {
      short: 'siteniz çok yavaş açılıyor',
      detail: `Sayfa ${seconds(ms)} saniyede açılıyor; 3 saniyeyi geçince ziyaretçilerin yarısı vazgeçiyor`,
    };
  }
  if (a?.httpsRedirect === false) {
    return {
      short: 'siteniz güvenli bağlantıya yönlenmiyor',
      detail: 'http adresi https’e geçmiyor, tarayıcı ziyaretçiyi uyarıyor',
    };
  }
  if (a && (a.hasTitle === false || a.hasMetaDesc === false)) {
    return {
      short: 'siteniz Google’da doğru görünmüyor',
      detail: 'Sayfa başlığı veya açıklaması eksik, arama sonucunda boş bir satır olarak çıkıyorsunuz',
    };
  }
  if (
    input.websiteStatus === WebsiteStatus.OUTDATED ||
    input.websiteStatus === WebsiteStatus.ACTIVE_WEAK
  ) {
    return {
      short: 'siteniz eskimiş',
      detail: 'Tasarımı ve teknik yapısı bugünün standartlarının gerisinde',
    };
  }
  return null;
}

/**
 * Puanlama kurallarinin MUSTERIYE soylenebilir karsiligi.
 *
 * Kural etiketleri admin ekrani icin yazildi ("Site bozuk (5xx / zaman
 * asimi)") ve oldugu gibi mesaja giremez. Karsiligi olmayan kurallar
 * (telefon var, e-posta bulundu) mesaja hic girmiyor: musteri icin bir sey
 * ifade etmiyorlar ve "numaranizi bulduk" demek rahatsiz edici.
 */
const REASON_PHRASE: Record<string, string> = {
  no_website: 'web sitenizin olmaması',
  broken_website: 'sitenizin açılmaması',
  social_only: 'yalnızca sosyal medyada olmanız',
  outdated_weak: 'sitenizin eskimiş olması',
  not_responsive: 'sitenizin telefonda düzgün görünmemesi',
  ssl_problem: 'güvenlik sertifikası sorunu',
  no_contact_form: 'sitenizde iletişim formu olmaması',
  high_rating: 'Google puanınızın yüksek olması',
  many_reviews: 'yorum sayınızın yüksek olması',
};

/**
 * Bu isletmeyi one cikaran en guclu iki sebep, tek ifade halinde.
 *
 * Sayisal skor ASLA yazilmiyor: musteriye "sizi 78 puan verdik" demek
 * hem anlamsiz hem itici. Yalnizca gercekten puan almis sebepler giriyor.
 */
export function scoreReasonText(reasons: ScoreReason[]): string {
  const phrases = [...reasons]
    .sort((x, y) => y.points - x.points)
    .map((r) => REASON_PHRASE[r.key])
    .filter((p): p is string => Boolean(p))
    .slice(0, 2);
  if (!phrases.length) return '';
  return phrases.join(' ve ');
}

/** Sablon degiskenlerine giren verinin tamami. */
export interface CompanyForVariables {
  name: string;
  district: string | null;
  city: string | null;
  categoryRaw: string | null;
  sector: string | null;
  websiteStatus: WebsiteStatus;
  googleRating: number | null;
  googleReviewsCount: number | null;
  analysis: AnalysisForMessage | null;
  scoreReasons: ScoreReason[] | null;
}

/** Degisken adi -> bu isletme icin degeri. Bilinmeyen her sey bos string. */
export function buildVariables(c: CompanyForVariables): Record<string, string> {
  const problem = problemOf({ websiteStatus: c.websiteStatus, analysis: c.analysis });
  return {
    isim: c.name,
    ilkAd: firstName(c.name),
    sektorTekil: sectorSingular(c.sector, c.categoryRaw),
    kategori: (c.categoryRaw ?? '').toLocaleLowerCase('tr'),
    ilce: c.district ?? c.city ?? '',
    sehir: c.city ?? '',
    // Nokta ile: "4.1". Turkce'de virgul dogru olurdu ama bu bicim
    // kayitli sablonlarda ve testlerde sozlesme haline geldi, degistirmek
    // gorunur bir kazanc getirmeden mevcut metinleri oynatir.
    puan: c.googleRating !== null ? c.googleRating.toFixed(1) : '',
    yorum: c.googleReviewsCount !== null ? c.googleReviewsCount.toLocaleString('tr') : '',
    sorun: problem?.short ?? '',
    sorunDetay: problem?.detail ?? '',
    skorGerekce: scoreReasonText(c.scoreReasons ?? []),
  };
}

/**
 * Bos kalinca CUMLESI silinmesi gereken degiskenler.
 *
 * Bunlar cumlenin tasiyicisi: yoklugunda kalan metin ("Sitenizde tespit
 * ettik.") anlamsiz oluyor ve kozmetik bosluk temizligiyle duzelmiyor.
 * Digerleri (isim, ilce, puan) bos kalsa da cumle ayakta kaliyor.
 */
export const SENTENCE_CRITICAL_VARIABLES = ['sorun', 'sorunDetay', 'skorGerekce'] as const;
