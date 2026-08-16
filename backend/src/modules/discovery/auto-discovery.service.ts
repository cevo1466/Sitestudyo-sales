import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JobStatus } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { DiscoveryService } from './discovery.service';
import { coverageProgress, planNextRun, type Target } from './discovery-planner';

type Account = 'primary' | 'secondary';

export interface AccountState {
  account: Account;
  usedUsd: number;
  limitUsd: number;
  remainingUsd: number;
}

export interface AutoRunResult {
  account: Account;
  status: 'started' | 'no_credit' | 'grid_complete' | 'busy' | 'error';
  detail: string;
  plan?: { locationQuery: string; terms: string[]; estimatedUsd: number };
  runId?: string;
}

/** Olculen maliyet: 384 isletme = $1.92 */
const COST_PER_PLACE = 0.005;

@Injectable()
export class AutoDiscoveryService {
  private readonly logger = new Logger(AutoDiscoveryService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly discovery: DiscoveryService,
  ) {}

  /**
   * Kredi durumunu Apify'a SORAR.
   *
   * Kotanin ne zaman yenilendigini tahmin etmiyoruz — Apify bu tarihi
   * API'sinde vermiyor. Onun yerine her calismada gercek kalan krediyi
   * olcuyoruz; boylece yenilenme ne zaman olursa olsun dogru davraniyor.
   */
  async accountState(account: Account): Promise<AccountState> {
    const key = account === 'primary' ? 'APIFY_TOKEN' : 'APIFY_TOKEN_SECONDARY';
    const token = this.config.get<string>(key);
    if (!token) return { account, usedUsd: 0, limitUsd: 0, remainingUsd: 0 };

    const res = await fetch(`https://api.apify.com/v2/users/me/limits?token=${token}`, {
      signal: AbortSignal.timeout(20_000),
    });
    if (!res.ok) throw new Error(`Apify kota sorgusu basarisiz (${res.status})`);

    const body = (await res.json()) as {
      data?: { current?: { monthlyUsageUsd?: number }; limits?: { maxMonthlyUsageUsd?: number } };
    };
    const usedUsd = body.data?.current?.monthlyUsageUsd ?? 0;
    const limitUsd = body.data?.limits?.maxMonthlyUsageUsd ?? 0;
    return { account, usedUsd, limitUsd, remainingUsd: Math.max(0, limitUsd - usedUsd) };
  }

  /** Daha once taranmis (konum, terim) ciftleri. */
  async coveredTargets(): Promise<Target[]> {
    const runs = await this.prisma.discoveryRun.findMany({
      where: { status: { in: [JobStatus.SUCCEEDED, JobStatus.PARTIAL, JobStatus.RUNNING] } },
    });
    const out: Target[] = [];
    for (const r of runs) {
      const p = (r.params ?? {}) as {
        locationQuery?: string;
        searchTerms?: string[];
        onlyWithoutWebsite?: boolean;
      };
      if (!p.locationQuery) continue;
      // Eski kayitlarda bu alan yok; hepsi sitesizler icin yapilmisti.
      const onlyWithoutWebsite = p.onlyWithoutWebsite ?? true;
      for (const term of p.searchTerms ?? []) {
        out.push({ locationQuery: p.locationQuery, term, onlyWithoutWebsite });
      }
    }
    return out;
  }

  async progress() {
    const covered = await this.coveredTargets();
    return {
      withoutWebsite: coverageProgress(covered, true),
      withWebsite: coverageProgress(covered, false),
      includeWithWebsite: await this.includeWithWebsite(),
    };
  }

  /**
   * Sitesi OLAN isletmeler de taransin mi?
   *
   * Ayarlar ekranindan acilip kapanir. Acik oldugunda izgara ikinci kez,
   * filtresiz taranir; site analizoru ve iletisim tarayicisi ancak boyle
   * is gorur — sitesi olmayan bir isletmede analiz edilecek adres yok.
   * Puan tavani da ancak boyle 75'in uzerine cikar.
   */
  async includeWithWebsite(): Promise<boolean> {
    const row = await this.prisma.setting.findUnique({
      where: { key: 'discovery.include_with_website' },
    });
    return (row?.value as { enabled?: boolean } | null)?.enabled === true;
  }

  /** Sitesi olanlarin da taranmasini acar/kapatir. */
  async setIncludeWithWebsite(enabled: boolean): Promise<{ enabled: boolean }> {
    await this.prisma.setting.upsert({
      where: { key: 'discovery.include_with_website' },
      create: { key: 'discovery.include_with_website', value: { enabled } },
      update: { value: { enabled } },
    });
    this.logger.log(`Sitesi olanlari tara: ${enabled ? 'ACIK' : 'KAPALI'}`);
    return { enabled };
  }

  /**
   * Bir hesap icin sirada ne varsa baslatir.
   *
   * Hicbir kosulda kotayi asmaya calismaz ve ayni arama x konum ciftini
   * ikinci kez taramaz — kredi geri gelmiyor, tekrar tarama para yakmak.
   */
  async runFor(account: Account, userId: string | null): Promise<AutoRunResult> {
    // Zaten calisan bir tarama varsa ikincisini baslatmiyoruz: es zamanli
    // iki calisma kotayi ongorulemez hizda tuketir.
    const active = await this.prisma.discoveryRun.count({ where: { status: JobStatus.RUNNING } });
    if (active > 0) {
      return { account, status: 'busy', detail: `${active} tarama zaten calisiyor` };
    }

    let state: AccountState;
    try {
      state = await this.accountState(account);
    } catch (err) {
      return {
        account,
        status: 'error',
        detail: err instanceof Error ? err.message : 'Kota sorgulanamadi',
      };
    }

    const includeWithWebsite = await this.includeWithWebsite();
    const plan = planNextRun({
      covered: await this.coveredTargets(),
      includeWithWebsite,
      remainingUsd: state.remainingUsd,
      costPerPlace: COST_PER_PLACE,
      maxPerSearch: 100,
      // Tek calismada 10 terimden fazlasi Apify'da uzun surer ve
      // yarida kesilme riski artar.
      maxTermsPerRun: 10,
    });

    if (!plan) {
      const done = state.remainingUsd <= 0.25;
      return {
        account,
        status: done ? 'no_credit' : 'grid_complete',
        detail: done
          ? `Kredi bitti ($${state.usedUsd.toFixed(2)} / $${state.limitUsd})`
          : 'Hedef izgarasindaki tum arama x konum ciftleri tarandi',
      };
    }

    const admin = userId
      ? { id: userId }
      : await this.prisma.user.findFirst({ where: { role: 'ADMIN' }, select: { id: true } });

    const run = await this.discovery.startRun(
      {
        searchTerms: plan.terms,
        locationQuery: plan.locationQuery,
        maxPerSearch: plan.maxPerSearch,
        language: 'tr',
        countryCode: 'tr',
        // Filtre planlayicidan geliyor. Kapali oldugunda sitesi OLAN
        // isletmeler de dondugu icin analizor devreye girer; bozuk veya
        // eski siteler en sicak leadlerdir.
        onlyWithoutWebsite: plan.onlyWithoutWebsite,
        account,
      },
      admin?.id ?? '',
    );

    this.logger.log(
      `Otomatik tarama: ${plan.locationQuery} / ${plan.terms.length} terim ` +
        `~$${plan.estimatedUsd} (${account}, ` +
        `${plan.onlyWithoutWebsite ? 'yalnizca sitesizler' : 'sitesi olanlar dahil'})`,
    );

    return {
      account,
      status: 'started',
      detail: `${plan.locationQuery} — ${plan.terms.length} terim, tahmini $${plan.estimatedUsd}`,
      plan,
      runId: run.id,
    };
  }

  /**
   * Biten taramalarin sonuclarini havuza aktarir.
   *
   * Baslatma ve aktarma AYRI: Apify calismasi dakikalar suruyor, tek bir
   * cagrida beklemek zaman asimina takilirdi. Zamanlayici her calistiginda
   * once bitenleri toplar, sonra yenisini baslatir.
   */
  async importFinished(): Promise<Array<{ runId: string; created: number; duplicates: number }>> {
    const pending = await this.prisma.discoveryRun.findMany({
      where: { status: JobStatus.RUNNING, apifyRunId: { not: null } },
    });

    const out: Array<{ runId: string; created: number; duplicates: number }> = [];
    for (const run of pending) {
      const fresh = await this.discovery.refresh(run.id);
      if (fresh.status === JobStatus.RUNNING) continue;
      if (fresh.status !== JobStatus.SUCCEEDED && fresh.status !== JobStatus.PARTIAL) continue;

      try {
        const r = await this.discovery.importRun(run.id);
        out.push({ runId: run.id, created: r.created, duplicates: r.duplicates });
        this.logger.log(`Aktarildi ${run.id}: +${r.created} yeni, ${r.duplicates} mukerrer`);
      } catch (err) {
        this.logger.error(
          `Aktarim basarisiz ${run.id}: ${err instanceof Error ? err.message : err}`,
        );
      }
    }
    return out;
  }

  /** Zamanlayicinin cagirdigi tek giris noktasi. */
  async tick(): Promise<{
    imported: Array<{ runId: string; created: number; duplicates: number }>;
    started: AutoRunResult[];
    progress: Awaited<ReturnType<AutoDiscoveryService['progress']>>;
  }> {
    const imported = await this.importFinished();

    const started: AutoRunResult[] = [];
    // Iki hesap sirayla deneniyor: birinin kredisi bittiginde digeri
    // devam etsin. Ayni anda ikisini birden baslatmiyoruz (bkz. `busy`).
    for (const account of ['primary', 'secondary'] as const) {
      const r = await this.runFor(account, null);
      started.push(r);
      if (r.status === 'started') break;
    }

    return { imported, started, progress: await this.progress() };
  }
}
