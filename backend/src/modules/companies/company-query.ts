import { Prisma } from '@prisma/client';
import type { CompanyFilter } from './company-filter.dto';

/**
 * Filtrenin TEK dogruluk kaynagi.
 *
 * Ayni filtre uc yerde kullaniliyor: liste, sayim, toplu islem. Cevirim
 * mantigi birden fazla yere yazilirsa biri guncellenip digeri unutulur ve
 * sistem SESSIZCE yanlis calisir: liste 3.400 gosterir, toplu islem 3.600
 * kayda dokunur. Hicbir hata mesaji cikmaz.
 *
 * Sinif statiktir ve durum tutmaz — enjekte edilmesine gerek yok.
 */
export class CompanyQuery {
  static toWhere(filter: CompanyFilter): Prisma.CompanyWhereInput {
    const where: Prisma.CompanyWhereInput = {};

    if (filter.q) where.name = { search: filter.q };
    if (filter.city) where.city = filter.city;
    if (filter.district) where.district = filter.district;
    if (filter.sector) where.sector = filter.sector;

    if (filter.websiteStatus) where.websiteStatus = { in: filter.websiteStatus };
    if (filter.leadGrade) where.leadGrade = { in: filter.leadGrade };

    if (filter.minScore !== undefined || filter.maxScore !== undefined) {
      where.leadScore = {
        ...(filter.minScore !== undefined ? { gte: filter.minScore } : {}),
        ...(filter.maxScore !== undefined ? { lte: filter.maxScore } : {}),
      };
    }

    if (filter.hasPhone !== undefined) {
      where.phoneE164 = filter.hasPhone ? { not: null } : null;
    }

    if (filter.hasEmail !== undefined) {
      where.contacts = filter.hasEmail
        ? { some: { email: { not: null } } }
        : { none: { email: { not: null } } };
    }

    // Etiketlerde VE mantigi: her etiket icin AYRI bir `some` kosulu gerekir.
    // Tek bir `some: { tag: { slug: { in: [...] } } }` yazilirsa VEYA olur —
    // "sicak VEYA ankara" doner, oysa istenen "sicak VE ankara".
    if (filter.tags) {
      where.AND = filter.tags.map((slug) => ({ tags: { some: { tag: { slug } } } }));
    }

    return where;
  }
}
