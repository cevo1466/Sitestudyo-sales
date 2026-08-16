/**
 * Bir sonraki taramanin NE olacagina karar verir.
 *
 * Saf fonksiyon: veritabanina ve Apify'a dokunmaz. Kapsanmis kumeyi ve
 * butceyi disaridan alir. Boylece "bu ay ne taranacak" sorusu tek bir
 * testle cevaplanabiliyor — ve para harcayan bir kararin testsiz kalmasi
 * kabul edilemezdi.
 */

/** Bir tarama hedefi: tek konum, tek arama terimi. */
export interface Target {
  locationQuery: string;
  term: string;
}

export interface PlanInput {
  /** Daha once taranmis (konum, terim) ciftleri. */
  covered: Target[];
  /** Hesapta kalan kredi (USD). */
  remainingUsd: number;
  /** Isletme basina olculen maliyet. 384 kayit = $1.92 -> $0.005 */
  costPerPlace: number;
  /** Terim basina cekilecek en fazla isletme. */
  maxPerSearch: number;
  /** Tek bir calismaya konulacak en fazla terim (Apify calisma suresi siniri). */
  maxTermsPerRun: number;
  /** Guvenlik payi: krediyi son kurusuna kadar harcamiyoruz. */
  safetyMarginUsd?: number;
}

export interface Plan {
  locationQuery: string;
  terms: string[];
  maxPerSearch: number;
  estimatedUsd: number;
}

/**
 * Hedef izgarasi: sehir x sektor terimi.
 *
 * Sehirler nufus ve ticari yogunluga gore siralandi — once en cok
 * isletme cikacak yerler taransin ki kredi en verimli kullanilsin.
 */
export const CITIES = [
  'İstanbul, Türkiye',
  'Ankara, Türkiye',
  'İzmir, Türkiye',
  'Bursa, Türkiye',
  'Antalya, Türkiye',
  'Adana, Türkiye',
  'Konya, Türkiye',
  'Gaziantep, Türkiye',
  'Kocaeli, Türkiye',
  'Mersin, Türkiye',
  'Kayseri, Türkiye',
  'Eskişehir, Türkiye',
  'Samsun, Türkiye',
  'Denizli, Türkiye',
  'Trabzon, Türkiye',
];

/**
 * Terimler: web sitesi satin alma egilimi yuksek isletmeler once.
 *
 * Sira onemli — kredi bitmeden once en degerli sektorler taranmis olsun.
 * "kuafor" ve "restoran" cok kayit verir ama dusuk butceli musterilerdir;
 * "dis klinigi", "avukat", "emlak" daha yuksek biletli islerdir.
 */
export const TERMS = [
  'diş kliniği',
  'avukat',
  'emlak ofisi',
  'mali müşavir',
  'özel klinik',
  'veteriner kliniği',
  'medikal estetik',
  'iç mimarlık',
  'özel anaokulu',
  'spor salonu',
  'oto servis',
  'güzellik salonu',
  'kuaför salonu',
  'berber',
  'restoran',
  'kafe',
  'pastane',
  'kuru temizleme',
  'psikolog',
  'fizyoterapi',
];

function key(t: Target): string {
  return `${t.locationQuery}|||${t.term}`;
}

/**
 * Butceye sigan, HENUZ TARANMAMIS bir sonraki tarama planini uretir.
 *
 * Tek bir calisma tek bir konumda kaliyor: Apify `locationQuery`'yi
 * calisma basina aliyor ve iki sehri tek calismada taramanin yolu yok.
 */
export function planNextRun(input: PlanInput): Plan | null {
  const margin = input.safetyMarginUsd ?? 0.25;
  const budget = input.remainingUsd - margin;
  if (budget <= 0) return null;

  const coveredKeys = new Set(input.covered.map(key));
  const costPerTerm = input.maxPerSearch * input.costPerPlace;
  if (costPerTerm <= 0) return null;

  const affordableTerms = Math.floor(budget / costPerTerm);
  if (affordableTerms < 1) return null;

  const limit = Math.min(affordableTerms, input.maxTermsPerRun);

  // Sehir sehir ilerliyoruz: ilk sehrin tum terimleri bitmeden digerine
  // gecmiyoruz. Boylece bir sehir "tamamlandi" diyebiliyoruz; her sehirden
  // biraz toplamak, hicbir sehri tam kapsamamak demek olurdu.
  for (const locationQuery of CITIES) {
    const remaining = TERMS.filter((term) => !coveredKeys.has(key({ locationQuery, term })));
    if (!remaining.length) continue;

    const terms = remaining.slice(0, limit);
    return {
      locationQuery,
      terms,
      maxPerSearch: input.maxPerSearch,
      estimatedUsd: Number((terms.length * costPerTerm).toFixed(2)),
    };
  }

  // Tum izgara tarandi.
  return null;
}

/** Izgaranin ne kadari tarandi? Arayuzde ilerleme gostermek icin. */
export function coverageProgress(covered: Target[]): {
  done: number;
  total: number;
  percent: number;
} {
  const coveredKeys = new Set(covered.map(key));
  const total = CITIES.length * TERMS.length;
  let done = 0;
  for (const locationQuery of CITIES) {
    for (const term of TERMS) {
      if (coveredKeys.has(key({ locationQuery, term }))) done++;
    }
  }
  return { done, total, percent: Math.round((done / total) * 100) };
}
