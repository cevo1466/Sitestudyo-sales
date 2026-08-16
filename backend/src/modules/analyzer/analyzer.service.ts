import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { ScoringService } from '../scoring/scoring.service';
import { analyzeWebsite, type AnalysisResult } from './website-analyzer';

/**
 * Es zamanli analiz sayisi.
 *
 * Bu VDS'te ~400 MB bos bellek var ve baska siteler de calisiyor.
 * Yukseltmeden once `free -m` ile olcun.
 */
const CONCURRENCY = 3;

@Injectable()
export class AnalyzerService {
  private readonly logger = new Logger(AnalyzerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly scoring: ScoringService,
  ) {}

  /** Kayit acmadan tek bir adresi olcer — deneme amacli. */
  analyzeUrl(url: string): Promise<AnalysisResult> {
    return analyzeWebsite(url);
  }

  async analyzeCompanies(companyIds: string[]) {
    const companies = await this.prisma.company.findMany({
      where: { id: { in: companyIds } },
      select: { id: true, websiteUrl: true, name: true },
    });
    if (!companies.length) {
      throw new NotFoundException({ code: 'not_found', message: 'Isletme bulunamadi' });
    }

    const withSite = companies.filter((c) => c.websiteUrl);
    if (!withSite.length) {
      // Sessizce bos donmek yerine soyluyoruz: kullanici "analiz calismadi"
      // sanmasin. Sitesi olmayan isletmenin analiz edilecek adresi yok.
      throw new BadRequestException({
        code: 'no_website_to_analyze',
        message: `Secilen ${companies.length} isletmenin hicbirinde web sitesi adresi yok`,
      });
    }

    const results: Array<{ companyId: string; status: string; error: string | null }> = [];

    for (let i = 0; i < withSite.length; i += CONCURRENCY) {
      const slice = withSite.slice(i, i + CONCURRENCY);
      const done = await Promise.all(
        slice.map(async (c) => {
          const r = await analyzeWebsite(c.websiteUrl!);
          await this.persist(c.id, r);
          return { companyId: c.id, status: r.websiteStatus, error: r.errorCode };
        }),
      );
      results.push(...done);
      this.logger.log(`Analiz edildi: ${Math.min(i + CONCURRENCY, withSite.length)}/${withSite.length}`);
    }

    // Analiz sonucu lead puanini degistirir (mobil uyumsuzluk, SSL sorunu,
    // iletisim formu yoklugu puan getiriyor). Ayri bir adim birakmak
    // "neden skor guncellenmedi" sorusuna yol acardi.
    await this.scoring.recalculate(withSite.map((c) => c.id));

    return { analyzed: results.length, skipped: companies.length - withSite.length, results };
  }

  history(companyId: string) {
    return this.prisma.websiteAnalysis.findMany({
      where: { companyId },
      orderBy: { checkedAt: 'desc' },
      take: 20,
    });
  }

  /** Her analiz YENI satir acar; site zamanla duzeldi mi gorebilelim. */
  private async persist(companyId: string, r: AnalysisResult): Promise<void> {
    await this.prisma.websiteAnalysis.create({
      data: {
        companyId,
        requestedUrl: r.requestedUrl,
        finalUrl: r.finalUrl,
        httpStatus: r.httpStatus,
        redirectChain: r.redirectChain as Prisma.InputJsonValue,
        sslValid: r.sslValid,
        sslExpiresAt: r.sslExpiresAt,
        httpsRedirect: r.httpsRedirect,
        ttfbMs: r.ttfbMs,
        loadMs: r.loadMs,
        hasTitle: r.hasTitle,
        title: r.title,
        hasMetaDesc: r.hasMetaDesc,
        metaDesc: r.metaDesc,
        hasViewport: r.hasViewport,
        hasCanonical: r.hasCanonical,
        isResponsive: r.isResponsive,
        cms: r.cms,
        generator: r.generator,
        techStack: r.techStack as Prisma.InputJsonValue,
        contactSignals: r.contactSignals as Prisma.InputJsonValue,
        websiteScore: r.websiteScore,
        websiteStatus: r.websiteStatus,
        errorCode: r.errorCode,
      },
    });

    await this.prisma.company.update({
      where: { id: companyId },
      data: {
        websiteStatus: r.websiteStatus,
        websiteScore: r.websiteScore,
        lastAnalyzedAt: new Date(),
      },
    });
  }
}
