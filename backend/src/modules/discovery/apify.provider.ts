import { BadGatewayException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type {
  DiscoverySearchInput,
  PlaceProvider,
  ProviderRun,
  RawPlace,
} from './place-provider.interface';

const API = 'https://api.apify.com/v2';

/** Apify calisma durumu -> bizim sozlesmemiz. */
const STATUS_MAP: Record<string, ProviderRun['status']> = {
  READY: 'RUNNING',
  RUNNING: 'RUNNING',
  SUCCEEDED: 'SUCCEEDED',
  FAILED: 'FAILED',
  ABORTING: 'ABORTED',
  ABORTED: 'ABORTED',
  'TIMING-OUT': 'TIMED_OUT',
  'TIMED-OUT': 'TIMED_OUT',
};

interface ApifyRunData {
  id: string;
  status: string;
  defaultDatasetId?: string;
  startedAt?: string;
  finishedAt?: string;
  usageTotalUsd?: number;
  stats?: { outputItemCount?: number };
}

/**
 * Apify `compass/crawler-google-places` adaptoru.
 *
 * Neden kuyruk (BullMQ) yok: Apify'in kendisi zaten bir kuyruk. Calismayi
 * baslatip runId aliyoruz, tamamlanmasini Apify beklıyor, biz durumu
 * soruyoruz. Kendi kuyrugumuzu baskasinin kuyrugunu beklemek icin kurmak
 * gereksiz bir katman olurdu.
 */
@Injectable()
export class ApifyPlaceProvider implements PlaceProvider {
  readonly name = 'apify' as const;
  private readonly logger = new Logger(ApifyPlaceProvider.name);
  private readonly actor: string;

  constructor(private readonly config: ConfigService) {
    this.actor = this.config.get<string>('APIFY_PLACES_ACTOR') ?? 'compass/crawler-google-places';
  }

  /**
   * @param accountKey hangi hesabin token'i kullanilsin.
   *   Iki ucretsiz hesabin ayri $5 kotasi var; hangisinin harcandigi
   *   `discovery_runs` uzerinden izlenebilsin diye acikca secilir.
   */
  private token(accountKey: 'primary' | 'secondary' = 'primary'): string {
    const key = accountKey === 'primary' ? 'APIFY_TOKEN' : 'APIFY_TOKEN_SECONDARY';
    const token = this.config.get<string>(key);
    if (!token) {
      throw new BadGatewayException({
        code: 'provider_not_configured',
        message: `${key} tanimli degil`,
      });
    }
    return token;
  }

  async startRun(
    input: DiscoverySearchInput,
    accountKey: 'primary' | 'secondary' = 'primary',
  ): Promise<ProviderRun> {
    const body: Record<string, unknown> = {
      searchStringsArray: input.searchTerms,
      maxCrawledPlacesPerSearch: input.maxPerSearch,
      language: input.language,
      countryCode: input.countryCode.toLowerCase(),
      // Bu bir FILTREDIR: acikken yalnizca sitesi gorunmeyen isletmeler doner
      // ve kayitlarda `website` alani hic bulunmaz (bkz. classifyWebsite).
      ...(input.onlyWithoutWebsite ? { website: 'withoutWebsite' } : {}),
      // Yorum, gorsel ve iletisim taramasi KAPALI: her biri ayri ucretlendiriliyor
      // ve bizim ihtiyacimiz olan alanlar temel kayitta zaten var.
      maxReviews: 0,
      maxImages: 0,
      maxQuestions: 0,
      scrapePlaceDetailPage: false,
      scrapeContacts: false,
      skipClosedPlaces: true, // kapali isletmeye teklif goturulmez
      searchMatching: 'all',
    };

    if (input.locationQuery) body.locationQuery = input.locationQuery;
    if (input.lat != null && input.lng != null) {
      body.customGeolocation = {
        type: 'Point',
        coordinates: [input.lng, input.lat],
        radiusKm: (input.radiusM ?? 5000) / 1000,
      };
    }

    const data = await this.request<ApifyRunData>(
      'POST',
      `/acts/${encodeURIComponent(this.actor.replace('/', '~'))}/runs`,
      accountKey,
      body,
    );
    this.logger.log(`Apify calismasi baslatildi: ${data.id} (hesap: ${accountKey})`);
    return this.toProviderRun(data);
  }

  async getRun(
    runId: string,
    accountKey: 'primary' | 'secondary' = 'primary',
  ): Promise<ProviderRun> {
    const data = await this.request<ApifyRunData>('GET', `/actor-runs/${runId}`, accountKey);
    return this.toProviderRun(data);
  }

  async fetchResults(
    datasetId: string,
    offset: number,
    limit: number,
    accountKey: 'primary' | 'secondary' = 'primary',
  ): Promise<RawPlace[]> {
    const items = await this.request<Record<string, unknown>[]>(
      'GET',
      `/datasets/${datasetId}/items?offset=${offset}&limit=${limit}&clean=true`,
      accountKey,
    );
    return items.map((item) => this.toRawPlace(item));
  }

  private toProviderRun(d: ApifyRunData): ProviderRun {
    return {
      runId: d.id,
      datasetId: d.defaultDatasetId ?? null,
      status: STATUS_MAP[d.status] ?? 'RUNNING',
      itemCount: d.stats?.outputItemCount ?? null,
      startedAt: d.startedAt ?? null,
      finishedAt: d.finishedAt ?? null,
      costUsd: d.usageTotalUsd ?? null,
    };
  }

  private toRawPlace(item: Record<string, unknown>): RawPlace {
    const loc = item.location as { lat?: number; lng?: number } | undefined;
    return {
      placeId: String(item.placeId ?? ''),
      name: String(item.title ?? ''),
      categoryName: (item.categoryName as string) ?? null,
      categories: (item.categories as string[]) ?? undefined,
      address: (item.address as string) ?? null,
      street: (item.street as string) ?? null,
      city: (item.city as string) ?? null,
      state: (item.state as string) ?? null,
      neighborhood: (item.neighborhood as string) ?? null,
      postalCode: (item.postalCode as string) ?? null,
      countryCode: (item.countryCode as string) ?? null,
      lat: loc?.lat ?? null,
      lng: loc?.lng ?? null,
      phone: (item.phone as string) ?? null,
      phoneUnformatted: (item.phoneUnformatted as string) ?? null,
      // KRITIK: alan yoksa `undefined` KALMALI. `?? null` yazilirsa
      // "saglayici bakmadi" ile "sitesi yok" ayrimi kaybolur ve tum
      // lead puanlamasi bozulur (bkz. classifyWebsite).
      website: 'website' in item ? ((item.website as string) ?? null) : undefined,
      totalScore: (item.totalScore as number) ?? null,
      reviewsCount: (item.reviewsCount as number) ?? null,
      url: (item.url as string) ?? null,
      permanentlyClosed: Boolean(item.permanentlyClosed),
      temporarilyClosed: Boolean(item.temporarilyClosed),
      raw: item,
    };
  }

  private async request<T>(
    method: 'GET' | 'POST',
    path: string,
    accountKey: 'primary' | 'secondary',
    body?: unknown,
  ): Promise<T> {
    const sep = path.includes('?') ? '&' : '?';
    const url = `${API}${path}${sep}token=${this.token(accountKey)}`;

    let res: Response;
    try {
      res = await fetch(url, {
        method,
        headers: body ? { 'Content-Type': 'application/json' } : {},
        body: body ? JSON.stringify(body) : undefined,
        signal: AbortSignal.timeout(60_000),
      });
    } catch (err) {
      throw new BadGatewayException({
        code: 'provider_unreachable',
        message: `Apify'a ulasilamadi: ${err instanceof Error ? err.message : 'bilinmeyen hata'}`,
      });
    }

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      // Token'i ASLA loga veya hata mesajina koymuyoruz; url icinde duruyor.
      this.logger.error(`Apify ${method} ${path} -> ${res.status}`);
      throw new BadGatewayException({
        code: 'provider_error',
        message: `Apify hatasi (${res.status}): ${text.slice(0, 200)}`,
      });
    }

    const json = (await res.json()) as { data?: T } | T;
    return (json as { data?: T }).data !== undefined ? (json as { data: T }).data : (json as T);
  }
}
