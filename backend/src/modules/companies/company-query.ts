import { Prisma } from '@prisma/client';
import { isNullableSortField, type CompanyFilter, type Sort } from './company-filter.dto';

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

    if (filter.contacted !== undefined) {
      // Turetilmis alan lastContactedAt uzerinden: her sorguda activities
      // tablosunu taramak 2.000+ kayitta pahali olurdu.
      where.lastContactedAt = filter.contacted ? { not: null } : null;
    }

    if (filter.mobileOnly) {
      // Turkiye cep hatlari +905 ile baslar. WhatsApp gonderilebilecek
      // kayitlari ayirmanin tek guvenilir yolu bu — bir numaranin
      // WhatsApp'ta olup olmadigini onceden sorgulamak mumkun degil.
      where.phoneE164 = { startsWith: '+905' };
    }

    // Etiketlerde VE mantigi: her etiket icin AYRI bir `some` kosulu gerekir.
    // Tek bir `some: { tag: { slug: { in: [...] } } }` yazilirsa VEYA olur —
    // "sicak VEYA ankara" doner, oysa istenen "sicak VE ankara".
    if (filter.tags) {
      where.AND = filter.tags.map((slug) => ({ tags: { some: { tag: { slug } } } }));
    }

    return where;
  }

  static toOrderBy(sort: Sort): Prisma.CompanyOrderByWithRelationInput[] {
    // id ikincil anahtar olarak ZORUNLU: tek basina leadScore ile siralanan
    // bir listede ayni puana sahip kayitlarin sirasi belirsizdir ve sayfa
    // sinirinda kayit atlanir veya iki kez gelir.
    return [{ [sort.field]: sort.dir }, { id: sort.dir }];
  }

  static encodeCursor(
    row: { id: string } & Record<string, unknown>,
    sort: Sort,
    total: number,
  ): string {
    const raw = row[sort.field];
    const payload = {
      v: CURSOR_VERSION,
      k: `${sort.field}:${sort.dir}`,
      s: raw === null || raw === undefined ? null : toPrimitive(raw),
      i: row.id,
      t: total,
    };
    return Buffer.from(JSON.stringify(payload)).toString('base64url');
  }

  static decodeCursor(raw: string, sort: Sort): DecodedCursor {
    let payload: { v?: number; k?: string; s?: unknown; i?: unknown; t?: unknown };
    try {
      payload = JSON.parse(Buffer.from(raw, 'base64url').toString('utf8'));
    } catch {
      throw new InvalidCursorError();
    }
    if (
      payload.v !== CURSOR_VERSION ||
      payload.k !== `${sort.field}:${sort.dir}` ||
      typeof payload.i !== 'string' ||
      typeof payload.t !== 'number'
    ) {
      throw new InvalidCursorError();
    }
    return {
      s: (payload.s ?? null) as string | number | null,
      i: payload.i,
      t: payload.t,
    };
  }

  static cursorWhere(cursor: DecodedCursor, sort: Sort): Prisma.CompanyWhereInput {
    const f = sort.field;
    const idOp = sort.dir === 'desc' ? 'lt' : 'gt';

    // NULL bolgesindeyiz: bu alandaki tum kayitlar NULL, siralama artik
    // yalnizca id uzerinden ilerliyor.
    if (cursor.s === null) {
      return { OR: [{ [f]: null, id: { [idOp]: cursor.i } } as Prisma.CompanyWhereInput] };
    }

    const cmp = sort.dir === 'desc' ? 'lt' : 'gt';
    const or: Prisma.CompanyWhereInput[] = [
      { [f]: { [cmp]: cursor.s } } as Prisma.CompanyWhereInput,
    ];

    // MySQL desc siralamada NULL'lari EN SONA koyar. Degeri olan kayitlarin
    // arkasindan NULL'lar gelecegi icin onlari da sonraki sayfaya dahil
    // etmeliyiz; yoksa NULL'li kayitlar listede hic gorunmez.
    if (isNullableSortField(f)) {
      or.push({ [f]: null } as Prisma.CompanyWhereInput);
    }

    or.push({ [f]: cursor.s, id: { [idOp]: cursor.i } } as Prisma.CompanyWhereInput);
    return { OR: or };
  }
}


// ────────────────────────────────────────────────────────────────── Imlec

export class InvalidCursorError extends Error {
  constructor() {
    super('Imlec gecersiz veya farkli bir siralamaya ait');
  }
}

export interface DecodedCursor {
  /** Siralama alaninin degeri; NULL bolgesindeysek null. */
  s: string | number | null;
  /** Esitlik bozucu — id olmadan ayni degerli kayitlar atlanir/tekrarlanir. */
  i: string;
  /** Toplam sayi; her sayfada COUNT(*) calistirmamak icin tasinir. */
  t: number;
}

const CURSOR_VERSION = 1;

/** Decimal / Date / sayi -> JSON'a yazilabilir ilkel deger. */
function toPrimitive(value: unknown): string | number {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'number' || typeof value === 'string') return value;
  return String(value); // Prisma.Decimal
}
