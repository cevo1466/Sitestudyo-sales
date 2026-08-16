/**
 * Isletme kaynagi soyutlamasi.
 *
 * Faz 0'da Apify birincil, Google Places ikincil secildi (gerekce: Apify
 * aktoru website/openingHours/reviewsTags gibi alanlari Places API'nin
 * ucretli katmanlarinda olan bilgilerle birlikte tek fiyata veriyor ve
 * elde calisan bir kurulum + kredi var).
 *
 * Arayuz, o karara kilitlenmemek icin var: iki saglayici da ayni sozlesmeyi
 * uygular, .env'deki PLACE_PROVIDER hangisinin kullanilacagini secer.
 */

/** Bir isletme kaydinin saglayicidan bagimsiz hali. */
export interface RawPlace {
  /** Google Place ID — birincil mukerrer anahtari. */
  placeId: string;
  name: string;
  categoryName?: string | null;
  categories?: string[];
  address?: string | null;
  street?: string | null;
  /** DIKKAT: saglayicilar bunu ILCE olarak doldurabiliyor (bkz. normalizer). */
  city?: string | null;
  /** Turkiye'de il buraya geliyor. */
  state?: string | null;
  neighborhood?: string | null;
  postalCode?: string | null;
  countryCode?: string | null;
  lat?: number | null;
  lng?: number | null;
  phone?: string | null;
  phoneUnformatted?: string | null;
  /**
   * ONEMLI: `undefined` ile `null` FARKLI anlamlar tasiyor.
   *   undefined -> saglayici bu alani hic dondurmedi (bilinmiyor)
   *   null      -> saglayici bakti ve site YOK dedi
   * Bu ayrim korunmazsa "bilinmiyor" ile "sitesi yok" karisir ve lead
   * puanlamasinin en agirlikli girdisi (40 puan) uydurma olur.
   */
  website?: string | null;
  totalScore?: number | null;
  reviewsCount?: number | null;
  url?: string | null;
  permanentlyClosed?: boolean;
  temporarilyClosed?: boolean;
  /** Saglayicidan gelen ham kayit — sema degisirse geriye donuk isleyebilelim. */
  raw: unknown;
}

/** Bir kesif calismasinin baslatma parametreleri. */
export interface DiscoverySearchInput {
  /** "kuafor salonu", "berber" ... */
  searchTerms: string[];
  /** "Istanbul, Turkiye" veya "Ankara, Cankaya" */
  locationQuery?: string;
  lat?: number;
  lng?: number;
  radiusM?: number;
  maxPerSearch: number;
  language: string;
  countryCode: string;
  /**
   * Sitesi olmayanlara daralt.
   *
   * Bu bir FILTREDIR, alan secimi degil: acikken saglayici zaten yalnizca
   * sitesi gorunmeyen isletmeleri dondurur ve kayitlarda `website` alani
   * hic bulunmaz. Normalizer bu bayragi bilmek zorunda — yoksa "alan yok"
   * durumunu "bilinmiyor" sanip 384 sicak lead'i UNKNOWN'a duserdi.
   */
  onlyWithoutWebsite: boolean;
}

/** Saglayicidaki calismanin durumu. */
export interface ProviderRun {
  runId: string;
  datasetId: string | null;
  status: 'RUNNING' | 'SUCCEEDED' | 'FAILED' | 'ABORTED' | 'TIMED_OUT';
  itemCount: number | null;
  startedAt: string | null;
  finishedAt: string | null;
  costUsd: number | null;
}

export interface PlaceProvider {
  readonly name: 'apify' | 'google';

  /** Calismayi baslatir ve HEMEN doner; tamamlanmasini beklemez. */
  startRun(input: DiscoverySearchInput): Promise<ProviderRun>;

  /** Calismanin guncel durumunu sorar. */
  getRun(runId: string): Promise<ProviderRun>;

  /**
   * Sonuclari sayfa sayfa okur.
   * @param offset kacinci kayittan itibaren
   * @param limit  kac kayit
   */
  fetchResults(datasetId: string, offset: number, limit: number): Promise<RawPlace[]>;
}

export const PLACE_PROVIDER = Symbol('PLACE_PROVIDER');
