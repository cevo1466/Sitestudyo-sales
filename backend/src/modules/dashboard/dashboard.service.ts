import { Injectable } from '@nestjs/common';
import { LeadGrade, WebsiteStatus } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Panonun tek ekranlik ozeti.
   *
   * Butun sorgular TEK Promise.all icinde: sirayla calistirilsalardi 10
   * gidis-donus olurdu ve pano acilisinda gorunur bir gecikme yaratirdi.
   */
  async stats() {
    const [
      companies,
      byGrade,
      byStatus,
      byCity,
      bySector,
      openLeads,
      wonLeads,
      lostLeads,
      contacts,
      recentRuns,
      stageBreakdown,
    ] = await Promise.all([
      this.prisma.company.count(),
      this.prisma.company.groupBy({ by: ['leadGrade'], _count: true }),
      this.prisma.company.groupBy({ by: ['websiteStatus'], _count: true }),
      this.prisma.company.groupBy({
        by: ['city'],
        _count: true,
        orderBy: { _count: { city: 'desc' } },
        take: 8,
      }),
      this.prisma.company.groupBy({
        by: ['sector'],
        _count: true,
        orderBy: { _count: { sector: 'desc' } },
        take: 10,
      }),
      this.prisma.lead.count({ where: { closedAt: null } }),
      this.prisma.lead.count({ where: { stage: { isWon: true } } }),
      this.prisma.lead.count({ where: { stage: { isLost: true } } }),
      this.prisma.contact.count({ where: { email: { not: null } } }),
      this.prisma.discoveryRun.findMany({ orderBy: { createdAt: 'desc' }, take: 5 }),
      this.prisma.lead.groupBy({ by: ['stageId'], _count: true }),
    ]);

    const stages = await this.prisma.pipelineStage.findMany({ orderBy: { sortOrder: 'asc' } });
    const funnel = stages.map((s) => ({
      key: s.key,
      name: s.name,
      count: stageBreakdown.find((b) => b.stageId === s.id)?._count ?? 0,
    }));

    const closed = wonLeads + lostLeads;

    return {
      pool: {
        companies,
        withEmail: contacts,
        byGrade: this.toMap(byGrade, 'leadGrade', LeadGrade),
        byWebsiteStatus: this.toMap(byStatus, 'websiteStatus', WebsiteStatus),
        topCities: byCity.map((r) => ({ city: r.city ?? '(bos)', count: r._count })),
        topSectors: bySector.map((r) => ({ sector: r.sector ?? '(eslenmemis)', count: r._count })),
      },
      pipeline: {
        open: openLeads,
        won: wonLeads,
        lost: lostLeads,
        // Kapanmis is yokken oran hesaplamak 0/0 = NaN uretir ve arayuzde
        // "NaN%" gorunur; bu yuzden null donuyoruz.
        winRate: closed > 0 ? Math.round((wonLeads / closed) * 100) : null,
        funnel,
      },
      discovery: {
        totalSpentUsd: recentRuns.reduce((s, r) => s + Number(r.costUsd ?? 0), 0),
        recent: recentRuns.map((r) => ({
          id: r.id,
          status: r.status,
          found: r.foundCount,
          created: r.newCount,
          costUsd: Number(r.costUsd ?? 0),
          createdAt: r.createdAt,
        })),
      },
    };
  }

  private toMap<T extends string>(
    rows: Array<Record<string, unknown> & { _count: number }>,
    key: string,
    enumObj: Record<string, T>,
  ): Record<T, number> {
    const out = Object.fromEntries(Object.values(enumObj).map((v) => [v, 0])) as Record<T, number>;
    for (const r of rows) out[r[key] as T] = r._count;
    return out;
  }
}
