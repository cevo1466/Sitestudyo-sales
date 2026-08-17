import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { scoreLead, type ScoreResult, type ScoreRule } from './lead-scorer';

/** Tek seferde islenecek isletme sayisi — bellek ve kilit suresi dengesi. */
const BATCH = 500;

@Injectable()
export class ScoringService {
  private readonly logger = new Logger(ScoringService.name);

  constructor(private readonly prisma: PrismaService) {}

  listRules() {
    return this.prisma.leadScoreRule.findMany({ orderBy: { sortOrder: 'asc' } });
  }

  /**
   * Agirliklari gunceller.
   *
   * Degistirilen agirlik, YENIDEN HESAPLAMA yapilana kadar mevcut skorlari
   * etkilemez. Bunu sessizce arka planda yapmak, kullanicinin "neden hepsi
   * degisti" diye sormasina yol acardi; hesaplama acikca tetiklenir.
   */
  async updateRules(updates: Array<{ key: string; weight?: number; enabled?: boolean }>) {
    for (const u of updates) {
      await this.prisma.leadScoreRule.update({
        where: { key: u.key },
        data: {
          ...(u.weight !== undefined ? { weight: u.weight } : {}),
          ...(u.enabled !== undefined ? { enabled: u.enabled } : {}),
        },
      });
    }
    return this.listRules();
  }

  /** Tek bir isletmenin skorunu kirilimiyla birlikte hesaplar (yazmaz). */
  async explain(companyId: string): Promise<ScoreResult | null> {
    const rules = await this.loadRules();
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      include: {
        analyses: { orderBy: { checkedAt: 'desc' }, take: 1 },
        contacts: { where: { email: { not: null } }, take: 1 },
      },
    });
    if (!company) return null;
    return this.scoreCompany(company, rules);
  }

  /**
   * Havuzun tamaminin (veya secilenlerin) skorunu yeniden hesaplar.
   *
   * Sayfa sayfa ilerliyor: 500 bin kaydi tek seferde belege almak
   * konteynerin 320 MB sinirini asardi.
   */
  async recalculate(companyIds?: string[]): Promise<{ processed: number; changed: number }> {
    const rules = await this.loadRules();
    let processed = 0;
    let changed = 0;
    let cursor: string | undefined;

    for (;;) {
      const companies = await this.prisma.company.findMany({
        where: companyIds ? { id: { in: companyIds } } : undefined,
        include: {
          analyses: { orderBy: { checkedAt: 'desc' }, take: 1 },
          contacts: { where: { email: { not: null } }, take: 1 },
        },
        orderBy: { id: 'asc' },
        take: BATCH,
        ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      });
      if (!companies.length) break;

      for (const company of companies) {
        const result = this.scoreCompany(company, rules);
        processed++;
        if (company.leadScore === result.score && company.leadGrade === result.grade) continue;

        await this.prisma.company.update({
          where: { id: company.id },
          data: { leadScore: result.score, leadGrade: result.grade, lastScoredAt: new Date() },
        });
        changed++;
      }

      cursor = companies[companies.length - 1].id;
      if (companies.length < BATCH) break;
      this.logger.log(`Puanlandi: ${processed}`);
    }

    return { processed, changed };
  }

  /** Yuklenmis bir isletme kaydini puanlar. Outreach da bunu kullaniyor. */
  scoreCompany(
    company: {
      websiteStatus: Parameters<typeof scoreLead>[0]['websiteStatus'];
      googleRating: unknown;
      googleReviewsCount: number | null;
      phoneE164: string | null;
      contacts: unknown[];
      analyses: Array<{
        isResponsive: boolean | null;
        sslValid: boolean | null;
        contactSignals: unknown;
      }>;
    },
    rules: ScoreRule[],
  ): ScoreResult {
    const latest = company.analyses[0];
    const signals = (latest?.contactSignals ?? null) as { hasContactForm?: boolean } | null;

    return scoreLead(
      {
        websiteStatus: company.websiteStatus,
        // Prisma Decimal -> sayi
        googleRating: company.googleRating === null ? null : Number(company.googleRating),
        googleReviewsCount: company.googleReviewsCount,
        phoneE164: company.phoneE164,
        hasEmail: company.contacts.length > 0,
        analysis: latest
          ? {
              isResponsive: latest.isResponsive,
              sslValid: latest.sslValid,
              hasContactForm: signals?.hasContactForm ?? null,
            }
          : null,
      },
      rules,
    );
  }

  async loadRules(): Promise<ScoreRule[]> {
    const rows = await this.prisma.leadScoreRule.findMany();
    return rows.map((r) => ({
      key: r.key,
      label: r.label,
      weight: r.weight,
      enabled: r.enabled,
    }));
  }
}
