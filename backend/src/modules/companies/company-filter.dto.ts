import { LeadGrade, WebsiteStatus } from '@prisma/client';
import { z } from 'zod';

/**
 * "true"/"false" metnini boolean'a cevirir.
 *
 * z.coerce.boolean() BURADA KULLANILAMAZ: JavaScript'te Boolean("false")
 * true doner. Sorgu dizesinden gelen ?hasPhone=false o zaman "telefonu
 * olanlar" filtresine donusur ve kimse fark etmez.
 */
const boolFromString = z.enum(['true', 'false']).transform((v) => v === 'true');

/**
 * Sorgu dizesinde TEK elemanli dizi skaler olarak gelir:
 *   ?websiteStatus=NO_WEBSITE           -> "NO_WEBSITE"   (metin)
 *   ?websiteStatus=NO_WEBSITE&websiteStatus=BROKEN -> [...]  (dizi)
 * Sarmalanmazsa tek secimli filtreler 400 verir — kullanicinin en cok
 * kullandigi durum tam olarak budur.
 */
const asArray = <T extends z.ZodTypeAny>(item: T) =>
  z.preprocess((v) => (v === undefined || Array.isArray(v) ? v : [v]), z.array(item).min(1));

export const companyFilterSchema = z
  .object({
    q: z.string().trim().min(1).max(120).optional(),
    city: z.string().trim().max(80).optional(),
    district: z.string().trim().max(80).optional(),
    sector: z.string().trim().max(60).optional(),
    websiteStatus: asArray(z.nativeEnum(WebsiteStatus)).optional(),
    leadGrade: asArray(z.nativeEnum(LeadGrade)).optional(),
    tags: asArray(z.string().trim().max(60)).optional(),
    minScore: z.coerce.number().int().min(0).max(100).optional(),
    maxScore: z.coerce.number().int().min(0).max(100).optional(),
    hasPhone: boolFromString.optional(),
    hasEmail: boolFromString.optional(),
    /** true = daha once temas edildi, false = hic temas edilmedi */
    contacted: boolFromString.optional(),
    /** Yalnizca cep telefonu olanlar (WhatsApp ihtimali yuksek) */
    mobileOnly: boolFromString.optional(),
    /**
     * Bu tarihten BERI temas edilmemis kayitlar (hic temas edilmeyenler
     * dahil). Gunluk calisma kuyrugu icin: bugun zaten yazdigim isletme
     * ayni gun tekrar karsima cikmasin.
     *
     * `contacted` ile ayni alana bakiyor ama farkli soru soruyor: o "hic
     * temas edildi mi", bu "SON temas ne zaman".
     */
    notContactedSince: z.coerce.date().optional(),
  })
  .refine((f) => f.minScore === undefined || f.maxScore === undefined || f.minScore <= f.maxScore, {
    message: 'minScore, maxScore degerinden buyuk olamaz',
    path: ['minScore'],
  });

export type CompanyFilter = z.infer<typeof companyFilterSchema>;

// ────────────────────────────────────────────────── Siralama ve sayfalama

/** NULL olamayan alanlar: asc ve desc serbest. */
export const NON_NULL_SORTABLE = ['leadScore', 'name', 'firstSeenAt'] as const;
/** NULL olabilen alanlar: yalnizca desc (gerekce company-query.ts cursorWhere). */
export const NULLABLE_SORTABLE = [
  'googleRating',
  'googleReviewsCount',
  'lastAnalyzedAt',
  'lastContactedAt',
] as const;
export const SORTABLE_FIELDS = [...NON_NULL_SORTABLE, ...NULLABLE_SORTABLE] as const;

export type SortField = (typeof SORTABLE_FIELDS)[number];
export interface Sort {
  field: SortField;
  dir: 'asc' | 'desc';
}

export function isNullableSortField(field: string): boolean {
  return (NULLABLE_SORTABLE as readonly string[]).includes(field);
}

const sortSchema = z
  .string()
  .default('leadScore:desc')
  .transform((raw, ctx): Sort => {
    const [field, dir = 'desc'] = raw.split(':');
    if (!(SORTABLE_FIELDS as readonly string[]).includes(field)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Siralanamayan alan: ${field}. Gecerli alanlar: ${SORTABLE_FIELDS.join(', ')}`,
      });
      return z.NEVER;
    }
    if (dir !== 'asc' && dir !== 'desc') {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Yon yalnizca asc veya desc olabilir' });
      return z.NEVER;
    }
    // MySQL asc'de NULL'lari basa koyuyor ve keyset sayfalama o bolgede
    // dogru ilerlemiyor. Sessizce yanlis sonuc vermektense reddediyoruz.
    if (dir === 'asc' && isNullableSortField(field)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `${field} alani bos olabildigi icin yalnizca desc ile siralanabilir`,
      });
      return z.NEVER;
    }
    return { field: field as SortField, dir };
  });

/**
 * Sorgu dizesi duz gelir (?city=Ankara&limit=7&sort=name:asc). Sayfalama
 * alanlarini ayirip geri kalanini filtre semasina veriyoruz; boylece istemci
 * ic ice nesne kurmak zorunda kalmiyor.
 */
export const listQuerySchema = z
  .object({
    sort: sortSchema,
    limit: z.coerce.number().int().min(1).max(200).default(50),
    cursor: z.string().max(500).optional(),
  })
  .passthrough()
  .transform((raw, ctx) => {
    const { sort, limit, cursor, ...rest } = raw as Record<string, unknown> & {
      sort: Sort;
      limit: number;
      cursor?: string;
    };
    const parsed = companyFilterSchema.safeParse(rest);
    if (!parsed.success) {
      for (const issue of parsed.error.issues) ctx.addIssue(issue);
      return z.NEVER;
    }
    return { filter: parsed.data, sort, limit, cursor };
  });

export type ListQuery = z.infer<typeof listQuerySchema>;
