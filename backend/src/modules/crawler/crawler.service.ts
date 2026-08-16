import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ContactConfidence } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { ScoringService } from '../scoring/scoring.service';
import { crawlContacts } from './contact-crawler';

@Injectable()
export class CrawlerService {
  private readonly logger = new Logger(CrawlerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly scoring: ScoringService,
  ) {}

  async crawlCompanies(companyIds: string[]) {
    const companies = await this.prisma.company.findMany({
      where: { id: { in: companyIds } },
      select: { id: true, websiteUrl: true, name: true },
    });

    const withSite = companies.filter((c) => c.websiteUrl);
    if (!withSite.length) {
      // Sitesi olmayan isletmede taranacak sayfa yok. Sessizce bos donmek
      // "tarayici calismadi" sanilmasina yol acardi.
      throw new BadRequestException({
        code: 'no_website_to_crawl',
        message: `Secilen ${companies.length} isletmenin hicbirinde web sitesi adresi yok`,
      });
    }

    const settings = await this.prisma.setting.findMany({
      where: { key: { in: ['crawler.respect_robots', 'crawler.delay_ms'] } },
    });
    const respectRobots =
      (settings.find((s) => s.key === 'crawler.respect_robots')?.value as { value?: boolean })
        ?.value ?? true;
    const delayMs =
      (settings.find((s) => s.key === 'crawler.delay_ms')?.value as { value?: number })?.value ??
      2000;

    let created = 0;
    for (const company of withSite) {
      const r = await crawlContacts(company.websiteUrl!, {
        respectRobots,
        maxPages: 4,
        delayMs,
      });

      for (const c of r.contacts) {
        try {
          await this.prisma.contact.create({
            data: {
              companyId: company.id,
              email: c.email,
              source: 'crawler',
              sourceUrl: c.sourceUrl,
              confidence:
                c.confidence === 'VERIFIED'
                  ? ContactConfidence.VERIFIED
                  : ContactConfidence.GUESSED,
            },
          });
          created++;
        } catch {
          // (companyId, email) benzersiz — ayni adres zaten varsa atla.
        }
      }
      this.logger.log(`${company.name}: ${r.contacts.length} adres, ${r.pagesVisited.length} sayfa`);
    }

    // Bulunan e-posta lead puanini yukseltiyor (+10); ayri bir adim
    // birakmak "neden skor degismedi" sorusuna yol acardi.
    await this.scoring.recalculate(withSite.map((c) => c.id));

    return { crawled: withSite.length, skipped: companies.length - withSite.length, created };
  }
}
