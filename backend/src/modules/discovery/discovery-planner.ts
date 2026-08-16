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
  /** Bu tarama sitesizlerle mi sinirliydi? Eski kayitlarda yok -> true sayilir. */
  onlyWithoutWebsite?: boolean;
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
  /**
   * Sitesi OLAN isletmeleri de tara.
   *
   * Varsayilan kapali: havuzun tamami "sitesi yok" olsun diye baslamistik.
   * Acildiginda ayni izgara ikinci kez, filtresiz taranir — ayni isletmeler
   * degil, ayni ARAMALAR. Sonuc kumesi farkli olur cunku filtre kalkinca
   * sitesi olanlar da doner.
   */
  includeWithWebsite?: boolean;
}

export interface Plan {
  locationQuery: string;
  terms: string[];
  maxPerSearch: number;
  estimatedUsd: number;
  /**
   * Bu tarama yalnizca sitesi OLMAYANLARI mi getirecek?
   *
   * false olan taramalar sitesi OLAN isletmeleri de getirir; site
   * analizoru ve iletisim tarayicisi ancak o zaman is gorur. Bozuk,
   * eski veya mobil uyumsuz siteler ise en sicak leadlerdir — sitesi
   * hic olmayanlardan bile daha sicak olabilirler, cunku o isletme
   * dijitale zaten para harciyor demektir.
   */
  onlyWithoutWebsite: boolean;
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

/**
 * Kapsama anahtari.
 *
 * Filtre durumu anahtara DAHIL: "Ankara / dis klinigi" aramasi sitesizler
 * icin yapilmis olabilir ama sitesi olanlar icin yapilmamistir. Ikisi ayri
 * kapsama sayilmazsa, filtresiz tarama hic baslamaz.
 */
function key(t: Target, onlyWithoutWebsite = true): string {
  return `${t.locationQuery}|||${t.term}|||${onlyWithoutWebsite ? 'nw' : 'all'}`;
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

  const onlyWithoutWebsite = !input.includeWithWebsite;
  const coveredKeys = new Set(
    input.covered.map((t) => key(t, t.onlyWithoutWebsite ?? true)),
  );
  const costPerTerm = input.maxPerSearch * input.costPerPlace;
  if (costPerTerm <= 0) return null;

  const affordableTerms = Math.floor(budget / costPerTerm);
  if (affordableTerms < 1) return null;

  const limit = Math.min(affordableTerms, input.maxTermsPerRun);

  // Sehir sehir ilerliyoruz: ilk sehrin tum terimleri bitmeden digerine
  // gecmiyoruz. Boylece bir sehir "tamamlandi" diyebiliyoruz; her sehirden
  // biraz toplamak, hicbir sehri tam kapsamamak demek olurdu.
  for (const locationQuery of CITIES) {
    const remaining = TERMS.filter(
      (term) => !coveredKeys.has(key({ locationQuery, term }, onlyWithoutWebsite)),
    );
    if (!remaining.length) continue;

    const terms = remaining.slice(0, limit);
    return {
      locationQuery,
      terms,
      maxPerSearch: input.maxPerSearch,
      estimatedUsd: Number((terms.length * costPerTerm).toFixed(2)),
      onlyWithoutWebsite,
    };
  }

  // Tum izgara tarandi.
  return null;
}

/** Izgaranin ne kadari tarandi? Arayuzde ilerleme gostermek icin. */
export function coverageProgress(
  covered: Target[],
  onlyWithoutWebsite = true,
): { done: number; total: number; percent: number } {
  const coveredKeys = new Set(covered.map((t) => key(t, t.onlyWithoutWebsite ?? true)));
  const total = CITIES.length * TERMS.length;
  let done = 0;
  for (const locationQuery of CITIES) {
    for (const term of TERMS) {
      if (coveredKeys.has(key({ locationQuery, term }, onlyWithoutWebsite))) done++;
    }
  }
  return { done, total, percent: Math.round((done / total) * 100) };
}
