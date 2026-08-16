import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { JobStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { ApifyPlaceProvider } from './apify.provider';
import { ImportService, type ImportResult } from './import.service';
import type { DiscoverySearchInput } from './place-provider.interface';

/** Apify'dan tek seferde cekilecek kayit sayisi. */
const PAGE = 500;

export interface StartRunDto extends DiscoverySearchInput {
  account: 'primary' | 'secondary';
}

@Injectable()
export class DiscoveryService {
  private readonly logger = new Logger(DiscoveryService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly provider: ApifyPlaceProvider,
    private readonly importer: ImportService,
  ) {}

  /**
   * Daha once hangi arama x konum ciftlerinin tarandigini doner.
   *
   * Iki ayri Apify hesabinin ayri $5 kotasi var ve kredi geri gelmiyor;
   * ayni isletmeyi ikinci kez taramak parayi bosa harcamak demek. Yeni
   * calisma acmadan once buraya bakilir.
   */
  async coverage(): Promise<Array<{ locationQuery: string; terms: string[]; runId: string }>> {
    const runs = await this.prisma.discoveryRun.findMany({
      where: { status: { in: [JobStatus.SUCCEEDED, JobStatus.PARTIAL, JobStatus.RUNNING] } },
      orderBy: { createdAt: 'desc' },
    });
    return runs.map((r) => {
      const p = (r.params ?? {}) as { locationQuery?: string; searchTerms?: string[] };
      return {
        locationQuery: p.locationQuery ?? '(konum yok)',
        terms: p.searchTerms ?? [],
        runId: r.id,
      };
    });
  }

  /** Yeni bir tarama baslatir. Tamamlanmasini BEKLEMEZ. */
  async startRun(dto: StartRunDto, userId: string) {
    const overlap = await this.findOverlap(dto);
    if (overlap.length) {
      // Sessizce tekrar taramak yerine soyluyoruz: kredi geri gelmiyor.
      throw new BadRequestException({
        code: 'coverage_overlap',
        message: `Bu arama daha once yapilmis: ${overlap.join(', ')}. Kredi bosa gitmesin diye engellendi; farkli terim veya konum secin.`,
      });
    }

    const providerRun = await this.provider.startRun(dto, dto.account);

    return this.prisma.discoveryRun.create({
      data: {
        userId,
        provider: 'apify',
        params: {
          searchTerms: dto.searchTerms,
          locationQuery: dto.locationQuery,
          maxPerSearch: dto.maxPerSearch,
          onlyWithoutWebsite: dto.onlyWithoutWebsite,
          account: dto.account,
        } as Prisma.InputJsonValue,
        status: JobStatus.RUNNING,
        apifyRunId: providerRun.runId,
        datasetId: providerRun.datasetId,
        startedAt: new Date(),
      },
    });
  }

  /** Saglayiciya durumu sorar ve kaydi tazeler. */
  async refresh(id: string) {
    const run = await this.getOrThrow(id);
    if (!run.apifyRunId) return run;

    const account = this.accountOf(run);
    const p = await this.provider.getRun(run.apifyRunId, account);

    const status =
      p.status === 'SUCCEEDED'
        ? JobStatus.SUCCEEDED
        : p.status === 'RUNNING'
          ? JobStatus.RUNNING
          : p.status === 'ABORTED'
            ? JobStatus.CANCELLED
            : JobStatus.FAILED;

    return this.prisma.discoveryRun.update({
      where: { id },
      data: {
        status,
        datasetId: p.datasetId ?? run.datasetId,
        foundCount: p.itemCount ?? run.foundCount,
        costUsd: p.costUsd ?? run.costUsd,
        finishedAt: p.finishedAt ? new Date(p.finishedAt) : null,
      },
    });
  }

  /**
   * Sonuclari havuza aktarir. Tekrar calistirilabilir — ikinci calistirma
   * yeni kayit uretmez, yalnizca gunceller.
   */
  async importRun(id: string): Promise<ImportResult & { runId: string }> {
    const run = await this.refresh(id);
    if (!run.datasetId) {
      throw new BadRequestException({
        code: 'no_dataset',
        message: 'Bu calismanin sonuc kumesi henuz yok',
      });
    }
    if (run.status === JobStatus.RUNNING) {
      throw new BadRequestException({
        code: 'run_not_finished',
        message: 'Tarama hala suruyor, bitince tekrar deneyin',
      });
    }

    const params = (run.params ?? {}) as { onlyWithoutWebsite?: boolean };
    const total = await this.importDataset(run.datasetId, {
      onlyWithoutWebsite: params.onlyWithoutWebsite ?? false,
      account: this.accountOf(run),
    });

    await this.prisma.discoveryRun.update({
      where: { id },
      data: {
        newCount: total.created,
        dupCount: total.duplicates,
        foundCount: total.seen,
        status: total.skipped > 0 ? JobStatus.PARTIAL : JobStatus.SUCCEEDED,
      },
    });

    return { ...total, runId: id };
  }

  /**
   * Var olan bir Apify sonuc kumesini dogrudan aktarir.
   *
   * Yeni tarama BASLATMAZ, dolayisiyla kredi harcamaz — gecmiste yapilmis
   * calismalarin sonucunu sisteme almak icin.
   */
  async importDataset(
    datasetId: string,
    opts: { onlyWithoutWebsite: boolean; account: 'primary' | 'secondary' },
  ): Promise<ImportResult> {
    const total: ImportResult = {
      seen: 0,
      created: 0,
      updated: 0,
      duplicates: 0,
      skipped: 0,
      unmappedCategories: [],
    };
    const unmapped = new Set<string>();

    for (let offset = 0; ; offset += PAGE) {
      const batch = await this.provider.fetchResults(datasetId, offset, PAGE, opts.account);
      if (!batch.length) break;

      const r = await this.importer.importPlaces(batch, {
        onlyWithoutWebsite: opts.onlyWithoutWebsite,
        source: 'apify',
      });
      total.seen += r.seen;
      total.created += r.created;
      total.updated += r.updated;
      total.duplicates += r.duplicates;
      total.skipped += r.skipped;
      for (const c of r.unmappedCategories) unmapped.add(c);

      this.logger.log(`Aktarildi ${offset + batch.length}: +${r.created} yeni, ${r.duplicates} mukerrer`);
      if (batch.length < PAGE) break;
    }

    total.unmappedCategories = [...unmapped];
    return total;
  }

  list() {
    return this.prisma.discoveryRun.findMany({ orderBy: { createdAt: 'desc' }, take: 50 });
  }

  private accountOf(run: { params: Prisma.JsonValue }): 'primary' | 'secondary' {
    const p = (run.params ?? {}) as { account?: string };
    return p.account === 'secondary' ? 'secondary' : 'primary';
  }

  /** Ayni konumda ayni terimi daha once taradik mi? */
  private async findOverlap(dto: StartRunDto): Promise<string[]> {
    const previous = await this.coverage();
    const hits: string[] = [];
    for (const prev of previous) {
      if (prev.locationQuery !== (dto.locationQuery ?? '(konum yok)')) continue;
      const same = dto.searchTerms.filter((t) => prev.terms.includes(t));
      if (same.length) hits.push(`${prev.locationQuery} / ${same.join(', ')}`);
    }
    return hits;
  }

  private async getOrThrow(id: string) {
    const run = await this.prisma.discoveryRun.findUnique({ where: { id } });
    if (!run) {
      throw new NotFoundException({ code: 'not_found', message: 'Tarama kaydi bulunamadi' });
    }
    return run;
  }
}
