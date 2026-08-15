# Faz 2 — CRM Çekirdeği Uygulama Planı

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** İşletme havuzunu filtrelenebilir, sayfalanabilir ve toplu işlenebilir hale getirmek; işletmeleri satış hunisine terfi ettiren lead akışını kurmak.

**Architecture:** NestJS modüler monolit. Filtre mantığı tek bir `CompanyQuery` sınıfında toplanır; liste, sayım ve toplu işlem uçlarının hepsi onu çağırır — böylece "liste 3.400 gösterir ama toplu işlem 3.600 kayda dokunur" hatası yapısal olarak imkânsız olur. Sayfalama imleç (keyset) tabanlı. Zaman tüneli yazımı tek bir servisten geçer.

**Tech Stack:** NestJS 11 + Fastify, Prisma 6 + MariaDB 10.11, Zod doğrulama, Jest + Supertest.

**Onaylı spec:** `docs/superpowers/specs/2026-08-15-crm-cekirdegi-design.md`

## Global Constraints

Her görevin gereksinimleri aşağıdakileri **örtük olarak** içerir.

- **Dil:** kod, değişken ve dosya adları İngilizce; yorumlar ve kullanıcıya dönen mesajlar Türkçe. Kaynak dosyalarda Türkçe karakter (ç, ğ, ı, ö, ş, ü) **kullanılmaz** — yorumlarda da sadeleştirilmiş yazım (`islem`, `dogrulama`). Yalnızca kullanıcıya dönen `message` metinleri ve testlerdeki beklenen metinler Türkçe karakter içerebilir.
- **Hata zarfı:** her hata `{ code, message, fields? }` biçiminde. `code` snake_case ve makine tarafından okunur, `message` Türkçe ve kullanıcıya gösterilir. Mevcut `HttpExceptionFilter` bu zarfı zaten uyguluyor — `HttpException` fırlatırken gövde olarak bu nesneyi ver.
- **Doğrulama:** her girdi Zod ile doğrulanır, `new ZodValidationPipe(schema)` ile bağlanır. Elle `if (!body.x) throw` yazılmaz.
- **Yetki:** `JwtAuthGuard` global olarak bağlı; Faz 2'deki hiçbir uç `@Public()` **değildir**.
- **Prisma erişimi:** yalnızca servisler `PrismaService`'e dokunur. Controller'lar Prisma görmez.
- **Yeni tablo yok.** Faz 1 şeması yeterli. Tek migration: sıralama indeksleri (Görev 3).
- **Test komutları:** birim `npm test`, uçtan uca `npm run test:e2e`. e2e testler gerçek MariaDB'ye koşar:
  ```bash
  cd backend
  export DATABASE_URL="mysql://salesos:$(grep -oP '(?<=mysql://salesos:)[^@]+' .env)@127.0.0.1:3306/salesos"
  npm run test:e2e
  ```
- **Test dosya konumu:** birim testler kaynak dosyanın yanında `*.spec.ts`, e2e testler `test/*.e2e-spec.ts` (jest `rootDir: src`, e2e ayrı config).
- **Commit:** her görevin sonunda bir commit. Mesaj Türkçe, gövdesinde **neden** anlatılır.
- **Sıralanabilir alanlar:** `leadScore`, `name`, `firstSeenAt` (NULL olamaz, `asc` ve `desc`); `googleRating`, `googleReviewsCount`, `lastAnalyzedAt` (NULL olabilir, **yalnızca `desc`**). Gerekçe Görev 2'de.
- **Sayfa boyutu:** `limit` 1-200, varsayılan 50.

---

## Dosya Yapısı

| Dosya | Sorumluluk |
|---|---|
| `src/modules/companies/company-filter.dto.ts` | Filtre + sıralama + sayfalama Zod şemaları. Filtrenin sözleşmesi. |
| `src/modules/companies/company-query.ts` | ★ Filtre → Prisma `where`/`orderBy`, imleç kodla/çöz. Tek doğruluk kaynağı. |
| `src/modules/companies/companies.service.ts` | Liste, detay, güncelle, sayım. |
| `src/modules/companies/company-bulk.service.ts` | Filtre bazlı toplu işlem. |
| `src/modules/companies/companies.controller.ts` | HTTP uçları. |
| `src/modules/companies/companies.module.ts` | Bağlama. |
| `src/modules/contacts/*` | İşletmeye bağlı kişiler. |
| `src/modules/leads/*` | Terfi, aşama taşıma, kapatma. |
| `src/modules/pipelines/*` | Huni ve aşama tanımları. |
| `src/modules/crm-shared/activity.service.ts` | ★ Zaman tünelinin tek yazma kapısı. |
| `src/modules/crm-shared/tags.service.ts` | Etiket CRUD + işletmeye bağlama. |
| `src/modules/crm-shared/crm-shared.module.ts` | `@Global()` — diğer modüller enjekte eder. |
| `test/factories.ts` | e2e testler icin veri uretici yardimcilar. |

---

## Görev 1: Filtre şeması ve `where` çevirimi

**Files:**
- Create: `backend/src/modules/companies/company-filter.dto.ts`
- Create: `backend/src/modules/companies/company-query.ts`
- Test: `backend/src/modules/companies/company-query.spec.ts`

**Interfaces:**
- Produces: `companyFilterSchema` (Zod), `CompanyFilter` (tip), `CompanyQuery.toWhere(filter): Prisma.CompanyWhereInput`

- [ ] **Step 1: Failing test yaz**

`backend/src/modules/companies/company-query.spec.ts`:

```ts
import { WebsiteStatus, LeadGrade } from '@prisma/client';
import { companyFilterSchema } from './company-filter.dto';
import { CompanyQuery } from './company-query';

describe('CompanyQuery.toWhere', () => {
  const parse = (raw: unknown) => companyFilterSchema.parse(raw);

  it('bos filtrede hicbir kosul uretmez', () => {
    expect(CompanyQuery.toWhere(parse({}))).toEqual({});
  });

  it('sehir ve ilceyi esitlik olarak ekler', () => {
    const w = CompanyQuery.toWhere(parse({ city: 'Ankara', district: 'Cankaya' }));
    expect(w.city).toBe('Ankara');
    expect(w.district).toBe('Cankaya');
  });

  it('websiteStatus dizisini IN olarak ceviriri', () => {
    const w = CompanyQuery.toWhere(parse({ websiteStatus: ['NO_WEBSITE', 'BROKEN'] }));
    expect(w.websiteStatus).toEqual({ in: [WebsiteStatus.NO_WEBSITE, WebsiteStatus.BROKEN] });
  });

  it('leadGrade dizisini IN olarak cevirir', () => {
    const w = CompanyQuery.toWhere(parse({ leadGrade: ['VERY_HOT'] }));
    expect(w.leadGrade).toEqual({ in: [LeadGrade.VERY_HOT] });
  });

  it('minScore ve maxScore araligi kurar', () => {
    const w = CompanyQuery.toWhere(parse({ minScore: 70, maxScore: 89 }));
    expect(w.leadScore).toEqual({ gte: 70, lte: 89 });
  });

  it('yalnizca minScore verilirse ust sinir koymaz', () => {
    const w = CompanyQuery.toWhere(parse({ minScore: 70 }));
    expect(w.leadScore).toEqual({ gte: 70 });
  });

  it('hasPhone=true telefonu olanlari secer', () => {
    const w = CompanyQuery.toWhere(parse({ hasPhone: 'true' }));
    expect(w.phoneE164).toEqual({ not: null });
  });

  it('hasPhone=false telefonu OLMAYANLARI secer', () => {
    // Klasik tuzak: z.coerce.boolean() "false" metnini TRUE yapar ve bu filtre
    // sessizce tersine doner. Sema bu yuzden metin kabul edip elle cevirir.
    const w = CompanyQuery.toWhere(parse({ hasPhone: 'false' }));
    expect(w.phoneE164).toBeNull();
  });

  it('hasEmail=true en az bir e-postali kisi kosulu kurar', () => {
    const w = CompanyQuery.toWhere(parse({ hasEmail: 'true' }));
    expect(w.contacts).toEqual({ some: { email: { not: null } } });
  });

  it('etiketleri VE mantigiyla arar (hepsini tasiyanlar)', () => {
    const w = CompanyQuery.toWhere(parse({ tags: ['sicak', 'ankara'] }));
    expect(w.AND).toEqual([
      { tags: { some: { tag: { slug: 'sicak' } } } },
      { tags: { some: { tag: { slug: 'ankara' } } } },
    ]);
  });

  it('q icin fulltext arama kurar', () => {
    const w = CompanyQuery.toWhere(parse({ q: 'kuafor' }));
    expect(w.name).toEqual({ search: 'kuafor' });
  });

  it('120 karakterden uzun aramayi reddeder', () => {
    expect(() => parse({ q: 'a'.repeat(121) })).toThrow();
  });

  it('gecersiz websiteStatus degerini reddeder', () => {
    expect(() => parse({ websiteStatus: ['UYDURMA'] })).toThrow();
  });

  it('minScore > maxScore ise reddeder', () => {
    expect(() => parse({ minScore: 90, maxScore: 10 })).toThrow(/minScore/);
  });
});
```

- [ ] **Step 2: Testi calistir, BASARISIZ oldugunu gor**

Run: `cd backend && npx jest src/modules/companies/company-query.spec.ts`
Expected: FAIL — `Cannot find module './company-filter.dto'`

- [ ] **Step 3: Filtre semasini yaz**

`backend/src/modules/companies/company-filter.dto.ts`:

```ts
import { LeadGrade, WebsiteStatus } from '@prisma/client';
import { z } from 'zod';

/**
 * "true"/"false" metnini boolean'a cevirir.
 *
 * z.coerce.boolean() BURADA KULLANILAMAZ: JavaScript'te Boolean("false")
 * true doner. Sorgu dizesinden gelen ?hasPhone=false o zaman "telefonu
 * olanlar" filtresine donusur ve kimse fark etmez.
 */
const boolFromString = z
  .enum(['true', 'false'])
  .transform((v) => v === 'true');

export const companyFilterSchema = z
  .object({
    q: z.string().trim().min(1).max(120).optional(),
    city: z.string().trim().max(80).optional(),
    district: z.string().trim().max(80).optional(),
    sector: z.string().trim().max(60).optional(),
    websiteStatus: z.array(z.nativeEnum(WebsiteStatus)).min(1).optional(),
    leadGrade: z.array(z.nativeEnum(LeadGrade)).min(1).optional(),
    tags: z.array(z.string().trim().max(60)).min(1).max(10).optional(),
    minScore: z.coerce.number().int().min(0).max(100).optional(),
    maxScore: z.coerce.number().int().min(0).max(100).optional(),
    hasPhone: boolFromString.optional(),
    hasEmail: boolFromString.optional(),
  })
  .refine((f) => f.minScore === undefined || f.maxScore === undefined || f.minScore <= f.maxScore, {
    message: 'minScore, maxScore degerinden buyuk olamaz',
    path: ['minScore'],
  });

export type CompanyFilter = z.infer<typeof companyFilterSchema>;
```

- [ ] **Step 4: `toWhere` cevirimini yaz**

`backend/src/modules/companies/company-query.ts`:

```ts
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
 * Bu sinif statiktir ve durum tutmaz — enjekte edilmesine gerek yok.
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
      where.AND = filter.tags.map((slug) => ({
        tags: { some: { tag: { slug } } },
      }));
    }

    return where;
  }
}
```

- [ ] **Step 5: Testi calistir, GECTIGINI gor**

Run: `cd backend && npx jest src/modules/companies/company-query.spec.ts`
Expected: PASS — 13 test

- [ ] **Step 6: Commit**

```bash
cd /home/melih/sitestudyo-sales-os
git add backend/src/modules/companies/
git commit -m "Faz 2: isletme filtresi semasi ve where cevirimi

Filtre mantigi tek bir sinifta topland: liste, sayim ve toplu islem
uclarinin hepsi burayi cagiracak. Ayri ayri yazilsalardi biri
guncellenip digeri unutulur ve liste ile toplu islem farkli kume
uzerinde calisirdi — hicbir hata vermeden.

hasPhone/hasEmail icin z.coerce.boolean() KULLANILMADI: Boolean(\"false\")
JavaScript'te true doner ve filtre sessizce tersine donerdi."
```

---

## Görev 2: Sıralama ve imleç (keyset) sayfalama

**Files:**
- Modify: `backend/src/modules/companies/company-filter.dto.ts`
- Modify: `backend/src/modules/companies/company-query.ts`
- Test: `backend/src/modules/companies/company-query.spec.ts` (ekleme)

**Interfaces:**
- Consumes: Görev 1'den `CompanyFilter`, `CompanyQuery.toWhere`
- Produces:
  - `listQuerySchema` (Zod), `ListQuery` tipi (`{ filter, sort, limit, cursor? }`)
  - `CompanyQuery.toOrderBy(sort): Prisma.CompanyOrderByWithRelationInput[]`
  - `CompanyQuery.encodeCursor(row, sort, total): string`
  - `CompanyQuery.decodeCursor(raw, sort): DecodedCursor` — `{ s, i, t }`
  - `CompanyQuery.cursorWhere(cursor, sort): Prisma.CompanyWhereInput`
  - `class InvalidCursorError extends Error`

- [ ] **Step 1: Failing test yaz**

`company-query.spec.ts` dosyasinin sonuna ekle:

```ts
import { listQuerySchema, SORTABLE_FIELDS } from './company-filter.dto';
import { InvalidCursorError } from './company-query';

describe('siralama', () => {
  it('varsayilan siralama leadScore:desc', () => {
    const q = listQuerySchema.parse({});
    expect(q.sort).toEqual({ field: 'leadScore', dir: 'desc' });
  });

  it('id her zaman ikincil siralama anahtaridir', () => {
    // id olmadan ayni puana sahip kayitlar sayfa sinirinda atlanir veya
    // iki kez gelir — imlec karsilastirmasi belirsiz kalir.
    const order = CompanyQuery.toOrderBy({ field: 'leadScore', dir: 'desc' });
    expect(order).toEqual([{ leadScore: 'desc' }, { id: 'desc' }]);
  });

  it('bilinmeyen alanla siralamayi reddeder', () => {
    expect(() => listQuerySchema.parse({ sort: 'sifre:desc' })).toThrow();
  });

  it('NULL olabilen alanda asc siralamayi reddeder', () => {
    // MySQL asc'de NULL'lari basa, desc'te sona koyar. Keyset sayfalama
    // NULL bolgesine girince asc'de dogru calismiyor; desteklenmeyen bir
    // bicimi sessizce yanlis sonuc vermektense reddediyoruz.
    expect(() => listQuerySchema.parse({ sort: 'googleRating:asc' })).toThrow(/desc/);
    expect(() => listQuerySchema.parse({ sort: 'googleRating:desc' })).not.toThrow();
  });

  it('NULL olamayan alanda asc kabul edilir', () => {
    expect(() => listQuerySchema.parse({ sort: 'name:asc' })).not.toThrow();
  });

  it('limit sinirlarini uygular', () => {
    expect(listQuerySchema.parse({}).limit).toBe(50);
    expect(() => listQuerySchema.parse({ limit: 0 })).toThrow();
    expect(() => listQuerySchema.parse({ limit: 201 })).toThrow();
  });
});

describe('imlec', () => {
  const sort = { field: 'leadScore', dir: 'desc' } as const;
  const row = { id: 'abc-123', leadScore: 87 } as never;

  it('kodlanan imlec cozuldugunde ayni degerleri verir', () => {
    const c = CompanyQuery.encodeCursor(row, sort, 4820);
    expect(CompanyQuery.decodeCursor(c, sort)).toEqual({ s: 87, i: 'abc-123', t: 4820 });
  });

  it('bozuk imleci reddeder', () => {
    expect(() => CompanyQuery.decodeCursor('bu-base64-degil!!', sort)).toThrow(InvalidCursorError);
    expect(() => CompanyQuery.decodeCursor(Buffer.from('{}').toString('base64url'), sort))
      .toThrow(InvalidCursorError);
  });

  it('BASKA siralamaya ait imleci reddeder', () => {
    // Istemci siralamayi degistirip eski imleci gonderirse sonuc anlamsiz
    // olur; sessizce karisik veri dondurmektense hata veriyoruz.
    const c = CompanyQuery.encodeCursor(row, sort, 10);
    expect(() => CompanyQuery.decodeCursor(c, { field: 'name', dir: 'asc' }))
      .toThrow(InvalidCursorError);
  });

  it('desc icin "kucuk VEYA (esit VE id kucuk)" kosulu uretir', () => {
    const w = CompanyQuery.cursorWhere({ s: 87, i: 'abc-123', t: 0 }, sort);
    expect(w.OR).toEqual([
      { leadScore: { lt: 87 } },
      { leadScore: 87, id: { lt: 'abc-123' } },
    ]);
  });

  it('asc icin "buyuk VEYA (esit VE id buyuk)" kosulu uretir', () => {
    const asc = { field: 'name', dir: 'asc' } as const;
    const w = CompanyQuery.cursorWhere({ s: 'Ahmet', i: 'abc-123', t: 0 }, asc);
    expect(w.OR).toEqual([
      { name: { gt: 'Ahmet' } },
      { name: 'Ahmet', id: { gt: 'abc-123' } },
    ]);
  });

  it('NULL olabilen alanda NULL bolgesini de kapsar', () => {
    const nsort = { field: 'googleRating', dir: 'desc' } as const;
    const w = CompanyQuery.cursorWhere({ s: 4.5, i: 'abc', t: 0 }, nsort);
    // desc'te NULL'lar en sonda: degeri kucuk olanlar VEYA NULL olanlar
    expect(w.OR).toEqual([
      { googleRating: { lt: 4.5 } },
      { googleRating: null },
      { googleRating: 4.5, id: { lt: 'abc' } },
    ]);
  });

  it('NULL bolgesindeyken yalnizca id ile ilerler', () => {
    const nsort = { field: 'googleRating', dir: 'desc' } as const;
    const w = CompanyQuery.cursorWhere({ s: null, i: 'abc', t: 0 }, nsort);
    expect(w.OR).toEqual([{ googleRating: null, id: { lt: 'abc' } }]);
  });
});
```

- [ ] **Step 2: Testi calistir, BASARISIZ oldugunu gor**

Run: `cd backend && npx jest src/modules/companies/company-query.spec.ts`
Expected: FAIL — `listQuerySchema is not exported`

- [ ] **Step 3: Siralama semasini ekle**

`company-filter.dto.ts` sonuna ekle:

```ts
/** NULL olamayan alanlar: asc ve desc serbest. */
export const NON_NULL_SORTABLE = ['leadScore', 'name', 'firstSeenAt'] as const;
/** NULL olabilen alanlar: yalnizca desc (gerekce: company-query.ts cursorWhere). */
export const NULLABLE_SORTABLE = ['googleRating', 'googleReviewsCount', 'lastAnalyzedAt'] as const;
export const SORTABLE_FIELDS = [...NON_NULL_SORTABLE, ...NULLABLE_SORTABLE] as const;

export type SortField = (typeof SORTABLE_FIELDS)[number];
export interface Sort {
  field: SortField;
  dir: 'asc' | 'desc';
}

export function isNullableSortField(field: SortField): boolean {
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
    if (dir === 'asc' && isNullableSortField(field as SortField)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `${field} alani bos olabildigi icin yalnizca desc ile siralanabilir`,
      });
      return z.NEVER;
    }
    return { field: field as SortField, dir };
  });

export const listQuerySchema = z.object({
  filter: companyFilterSchema.default({}),
  sort: sortSchema,
  limit: z.coerce.number().int().min(1).max(200).default(50),
  cursor: z.string().max(500).optional(),
});

export type ListQuery = z.infer<typeof listQuerySchema>;
```

- [ ] **Step 4: Imlec mantigini yaz**

`company-query.ts` icine ekle (sinifin icine ve dosyanin ustune):

```ts
import { isNullableSortField, type Sort } from './company-filter.dto';

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
```

`CompanyQuery` sinifina ekle:

```ts
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
      // Decimal ve Date dogrudan JSON'a yazilamaz; ilkel tipe indiriyoruz.
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
    const or: Prisma.CompanyWhereInput[] = [{ [f]: { [cmp]: cursor.s } } as Prisma.CompanyWhereInput];

    // MySQL desc siralamada NULL'lari EN SONA koyar. Degeri olan kayitlarin
    // arkasindan NULL'lar gelecegi icin onlari da sonraki sayfaya dahil
    // etmeliyiz; yoksa NULL'li kayitlar listede hic gorunmez.
    if (isNullableSortField(f)) {
      or.push({ [f]: null } as Prisma.CompanyWhereInput);
    }

    or.push({ [f]: cursor.s, id: { [idOp]: cursor.i } } as Prisma.CompanyWhereInput);
    return { OR: or };
  }
```

Dosyanin sonuna yardimci:

```ts
/** Decimal / Date / Number -> JSON'a yazilabilir ilkel deger. */
function toPrimitive(value: unknown): string | number {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'number' || typeof value === 'string') return value;
  // Prisma.Decimal
  return String(value);
}
```

- [ ] **Step 5: Testi calistir, GECTIGINI gor**

Run: `cd backend && npx jest src/modules/companies/company-query.spec.ts`
Expected: PASS — 13 + 13 = 26 test

- [ ] **Step 6: Commit**

```bash
cd /home/melih/sitestudyo-sales-os
git add backend/src/modules/companies/
git commit -m "Faz 2: imlec tabanli sayfalama ve siralama

Sayfa numarali sayfalama on binlerce kayitta cokuyor (OFFSET 200000
MySQL'e 200 bin satir taratir). Keyset yontemi kullaniliyor.

Uc bilincli karar:
- id ZORUNLU ikincil siralama anahtari; onsuz ayni puanli kayitlar
  sayfa sinirinda atlanir veya iki kez gelir
- imlec siralama anahtarini tasir; istemci siralamayi degistirip eski
  imleci gonderirse sessizce karisik veri yerine hata doner
- NULL olabilen alanlarda yalnizca desc destekleniyor; MySQL asc'de
  NULL'lari basa koyuyor ve keyset o bolgede dogru ilerlemiyor"
```

---

## Görev 3: Sıralama indeksleri

**Files:**
- Modify: `backend/prisma/schema.prisma` (Company modeli `@@index` blogu)
- Create: `backend/prisma/migrations/<zaman>_crm_sort_indexes/migration.sql` (Prisma uretir)

**Interfaces:**
- Consumes: Görev 2'deki `SORTABLE_FIELDS`
- Produces: yok (yalnizca performans)

- [ ] **Step 1: Semaya indeksleri ekle**

`schema.prisma` icinde `model Company` blogundaki `@@index` satirlarinin yanina:

```prisma
  // Siralama indeksleri. Imlec karsilastirmasi (alan, id) ciftine bakiyor;
  // indeks tam bu sirayla olmazsa MySQL siralama icin dosya bazli sort'a
  // duser ve derin sayfalar yavaslar.
  @@index([leadScore, id])
  @@index([googleRating, id])
  @@index([firstSeenAt, id])
  @@index([lastAnalyzedAt, id])
```

- [ ] **Step 2: Migration uret ve uygula**

```bash
cd backend
PW=$(grep -oP '(?<=mysql://salesos:)[^@]+' .env)
DATABASE_URL="mysql://salesos:$PW@127.0.0.1:3306/salesos" \
SHADOW_DATABASE_URL="mysql://salesos:$PW@127.0.0.1:3306/salesos_shadow" \
npx prisma migrate dev --name crm_sort_indexes --skip-seed
```
Expected: `Your database is now in sync with your schema.`

- [ ] **Step 3: Indekslerin gercekten olustugunu dogrula**

```bash
PW=$(grep -oP '(?<=mysql://salesos:)[^@]+' .env)
sudo docker exec hosting_mysql mysql -usalesos -p"$PW" -e \
  "SHOW INDEX FROM companies WHERE Key_name LIKE '%leadScore%' OR Key_name LIKE '%googleRating%';" salesos
```
Expected: `leadScore` ve `googleRating` iceren indeks satirlari listelenir.

- [ ] **Step 4: Commit**

```bash
cd /home/melih/sitestudyo-sales-os
git add backend/prisma/
git commit -m "Faz 2: siralama icin bilesik indeksler

Imlec karsilastirmasi (alan, id) ciftine bakiyor. Indeks tam bu sirayla
olmazsa MySQL dosya bazli siralamaya duser ve derin sayfalarda sorgu
suresi kayit sayisiyla birlikte buyur."
```

---

## Görev 4: İşletme listesi, detay ve güncelleme uçları

**Files:**
- Create: `backend/src/modules/companies/companies.service.ts`
- Create: `backend/src/modules/companies/companies.controller.ts`
- Create: `backend/src/modules/companies/companies.module.ts`
- Create: `backend/test/factories.ts`
- Modify: `backend/src/app.module.ts` (CompaniesModule'u imports'a ekle)
- Test: `backend/test/companies.e2e-spec.ts`

**Interfaces:**
- Consumes: `CompanyQuery`, `listQuerySchema`, `ListQuery`
- Produces:
  - `CompaniesService.list(q: ListQuery): Promise<{ items: Company[]; nextCursor: string | null; approxTotal: number }>`
  - `CompaniesService.findOne(id: string)`
  - `CompaniesService.update(id: string, dto: UpdateCompanyDto)`
  - `makeCompany(prisma, overrides?)` test fabrikasi

- [ ] **Step 1: Test fabrikasini yaz**

`backend/test/factories.ts`:

```ts
import { randomUUID, createHash } from 'node:crypto';
import { LeadGrade, PrismaClient, WebsiteStatus } from '@prisma/client';

export interface CompanyOverrides {
  name?: string;
  city?: string;
  district?: string;
  sector?: string;
  websiteStatus?: WebsiteStatus;
  leadGrade?: LeadGrade;
  leadScore?: number;
  phoneE164?: string | null;
  googleRating?: number | null;
}

/** e2e testlerde isletme uretir. placeId benzersiz kalsin diye rastgele. */
export async function makeCompany(prisma: PrismaClient, o: CompanyOverrides = {}) {
  const name = o.name ?? `Test Isletme ${randomUUID().slice(0, 8)}`;
  const nameNormalized = name.toLowerCase();
  return prisma.company.create({
    data: {
      placeId: `test-${randomUUID()}`,
      source: 'manual',
      name,
      nameNormalized,
      dedupeKey: createHash('sha256').update(`${nameNormalized}|${randomUUID()}`).digest('hex'),
      city: o.city ?? 'Istanbul',
      district: o.district ?? 'Fatih',
      sector: o.sector ?? 'guzellik',
      websiteStatus: o.websiteStatus ?? WebsiteStatus.UNKNOWN,
      leadGrade: o.leadGrade ?? LeadGrade.LOW,
      leadScore: o.leadScore ?? 0,
      phoneE164: o.phoneE164 === undefined ? '+905551234567' : o.phoneE164,
      googleRating: o.googleRating ?? null,
    },
  });
}

/** Testin actigi tum isletmeleri (ve bagli kayitlari) temizler. */
export async function cleanupCompanies(prisma: PrismaClient) {
  await prisma.company.deleteMany({ where: { placeId: { startsWith: 'test-' } } });
}

/** Giris yapip erisim token'i doner — korumali uclari cagirmak icin. */
export async function loginToken(
  server: unknown,
  request: (s: unknown) => { post: (u: string) => { send: (b: unknown) => Promise<{ body: { accessToken: string } }> } },
  email: string,
  password: string,
): Promise<string> {
  const res = await request(server).post('/api/v1/auth/login').send({ email, password });
  return res.body.accessToken;
}
```

- [ ] **Step 2: Failing e2e testi yaz**

`backend/test/companies.e2e-spec.ts`:

```ts
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import request from 'supertest';
import { LeadGrade, UserRole, WebsiteStatus } from '@prisma/client';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/common/prisma/prisma.service';
import { AuthService } from '../src/modules/auth/auth.service';
import { makeCompany, cleanupCompanies } from './factories';

describe('Companies (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let token: string;

  const EMAIL = `co-${Date.now()}@test.local`;
  const PASSWORD = 'e2e-Test-Parola-123';

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication<NestFastifyApplication>(new FastifyAdapter());
    app.setGlobalPrefix('api/v1');
    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    prisma = app.get(PrismaService);
    await prisma.user.create({
      data: {
        email: EMAIL,
        name: 'CRM Test',
        role: UserRole.ADMIN,
        passwordHash: await AuthService.hashPassword(PASSWORD),
      },
    });
    const login = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: EMAIL, password: PASSWORD });
    token = login.body.accessToken;

    await cleanupCompanies(prisma);
    // Puanlari bilerek TEKRARLI: imlecin esitlik bozucusunu sinamak icin.
    for (let i = 0; i < 30; i++) {
      await makeCompany(prisma, {
        city: i < 20 ? 'Istanbul' : 'Ankara',
        leadScore: i % 5 === 0 ? 90 : i,
        leadGrade: i % 5 === 0 ? LeadGrade.VERY_HOT : LeadGrade.LOW,
        websiteStatus: i % 3 === 0 ? WebsiteStatus.NO_WEBSITE : WebsiteStatus.ACTIVE_GOOD,
      });
    }
  });

  afterAll(async () => {
    await cleanupCompanies(prisma);
    await prisma.user.deleteMany({ where: { email: EMAIL } });
    await app.close();
  });

  const auth = () => request(app.getHttpServer()).get('/api/v1/companies').set('Authorization', `Bearer ${token}`);

  it('tokensiz erisimi reddeder', async () => {
    await request(app.getHttpServer()).get('/api/v1/companies').expect(401);
  });

  it('varsayilan sayfayi ve toplami doner', async () => {
    const res = await auth().expect(200);
    expect(res.body.items.length).toBeGreaterThan(0);
    expect(res.body.approxTotal).toBeGreaterThanOrEqual(30);
    expect(res.body).toHaveProperty('nextCursor');
  });

  it('sehre gore filtreler', async () => {
    const res = await auth().query({ city: 'Ankara' }).expect(200);
    expect(res.body.approxTotal).toBe(10);
    for (const c of res.body.items) expect(c.city).toBe('Ankara');
  });

  it('imlecle gezerken kayit atlamaz ve tekrarlamaz', async () => {
    // 30 kaydin 10'u ayni puana (90) sahip; esitlik bozucu calismazsa
    // tam bu sinirda kayit kaybolur veya iki kez gelir.
    const seen = new Set<string>();
    let cursor: string | null = null;
    let pages = 0;
    do {
      const res = await auth().query({ limit: 7, ...(cursor ? { cursor } : {}) }).expect(200);
      for (const c of res.body.items) {
        expect(seen.has(c.id)).toBe(false); // tekrar yok
        seen.add(c.id);
      }
      cursor = res.body.nextCursor;
      pages++;
      expect(pages).toBeLessThan(20); // sonsuz donguye karsi
    } while (cursor);
    expect(seen.size).toBe(30); // atlama yok
  });

  it('bozuk imleci 400 ile reddeder', async () => {
    const res = await auth().query({ cursor: 'bozuk!!!' }).expect(400);
    expect(res.body.code).toBe('invalid_cursor');
  });

  it('bilinmeyen siralama alanini reddeder', async () => {
    const res = await auth().query({ sort: 'passwordHash:desc' }).expect(400);
    expect(res.body.code).toBe('validation_error');
  });

  it('detay ucunda kisiler ve zaman tuneli gelir', async () => {
    const one = await makeCompany(prisma, { name: 'Detay Testi' });
    const res = await request(app.getHttpServer())
      .get(`/api/v1/companies/${one.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(res.body.name).toBe('Detay Testi');
    expect(Array.isArray(res.body.contacts)).toBe(true);
    expect(Array.isArray(res.body.activities)).toBe(true);
  });

  it('olmayan isletmede 404 doner', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/companies/00000000-0000-4000-8000-000000000000')
      .set('Authorization', `Bearer ${token}`)
      .expect(404);
    expect(res.body.code).toBe('not_found');
  });

  it('elle duzeltmeyi kaydeder ve nameNormalized alanini tazeler', async () => {
    const one = await makeCompany(prisma, { name: 'Eski Ad' });
    await request(app.getHttpServer())
      .patch(`/api/v1/companies/${one.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Yeni Ad' })
      .expect(200);
    const after = await prisma.company.findUnique({ where: { id: one.id } });
    expect(after!.name).toBe('Yeni Ad');
    // Mukerrer tespiti bu alana bagli; guncellenmezse bayat kalir.
    expect(after!.nameNormalized).toBe('yeni ad');
  });

  it('duzenlenmesi yasak alanlari reddeder', async () => {
    const one = await makeCompany(prisma);
    const res = await request(app.getHttpServer())
      .patch(`/api/v1/companies/${one.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ leadScore: 100 })
      .expect(400);
    expect(res.body.code).toBe('validation_error');
  });
});
```

- [ ] **Step 3: Testi calistir, BASARISIZ oldugunu gor**

```bash
cd backend
PW=$(grep -oP '(?<=mysql://salesos:)[^@]+' .env)
DATABASE_URL="mysql://salesos:$PW@127.0.0.1:3306/salesos" npx jest --config test/jest-e2e.json companies
```
Expected: FAIL — 404 (uc henuz yok)

- [ ] **Step 4: Servisi yaz**

`backend/src/modules/companies/companies.service.ts`:

```ts
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CompanyQuery, InvalidCursorError } from './company-query';
import type { CompanyFilter, ListQuery } from './company-filter.dto';
import type { UpdateCompanyDto } from './update-company.dto';
import { normalizeName } from './normalize-name';

@Injectable()
export class CompaniesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(q: ListQuery) {
    const filterWhere = CompanyQuery.toWhere(q.filter);

    let total: number;
    let where = filterWhere;

    if (q.cursor) {
      let cursor;
      try {
        cursor = CompanyQuery.decodeCursor(q.cursor, q.sort);
      } catch (err) {
        if (err instanceof InvalidCursorError) {
          throw new BadRequestException({ code: 'invalid_cursor', message: err.message });
        }
        throw err;
      }
      // Toplam sayiyi imlecten okuyoruz: her sayfada COUNT(*) calistirmak
      // 20 sayfalik bir gezinmede 20 tam tarama demek olurdu.
      total = cursor.t;
      where = { AND: [filterWhere, CompanyQuery.cursorWhere(cursor, q.sort)] };
    } else {
      total = await this.prisma.company.count({ where: filterWhere });
    }

    // limit+1 cekiyoruz: fazladan kayit gelirse sonraki sayfa VAR demektir.
    // Ayri bir "daha var mi" sorgusu calistirmaya gerek kalmiyor.
    const rows = await this.prisma.company.findMany({
      where,
      orderBy: CompanyQuery.toOrderBy(q.sort),
      take: q.limit + 1,
    });

    const hasMore = rows.length > q.limit;
    const items = hasMore ? rows.slice(0, q.limit) : rows;
    const last = items[items.length - 1];

    return {
      items,
      nextCursor: hasMore && last ? CompanyQuery.encodeCursor(last, q.sort, total) : null,
      approxTotal: total,
    };
  }

  async count(filter: CompanyFilter): Promise<number> {
    return this.prisma.company.count({ where: CompanyQuery.toWhere(filter) });
  }

  async findOne(id: string) {
    const company = await this.prisma.company.findUnique({
      where: { id },
      include: {
        contacts: { orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }] },
        analyses: { orderBy: { checkedAt: 'desc' }, take: 1 },
        leads: { where: { closedAt: null }, include: { stage: true } },
        tags: { include: { tag: true } },
        activities: { orderBy: { occurredAt: 'desc' }, take: 50 },
      },
    });
    if (!company) {
      throw new NotFoundException({ code: 'not_found', message: 'Isletme bulunamadi' });
    }
    return company;
  }

  async update(id: string, dto: UpdateCompanyDto) {
    await this.findOne(id); // yoksa 404
    return this.prisma.company.update({
      where: { id },
      data: {
        ...dto,
        // Mukerrer tespiti nameNormalized uzerinden yuruyor; ad degisince
        // birlikte tazelenmezse bayat kalir ve ayni isletme iki kez girer.
        ...(dto.name ? { nameNormalized: normalizeName(dto.name) } : {}),
      },
    });
  }
}
```

- [ ] **Step 5: Ad normalizasyonunu ve guncelleme DTO'sunu yaz**

`backend/src/modules/companies/normalize-name.ts`:

```ts
/**
 * Mukerrer tespiti icin isletme adini sadelestirir.
 *
 * Turkce'de I/i donusumu yerele bagli: 'I'.toLowerCase() Turkce yerelde 'ı'
 * verir. Yerel bagimli davranis makineden makineye degisir ve ayni isletme
 * iki farkli anahtar uretebilir; bu yuzden 'tr' yereli ACIKCA veriliyor.
 */
export function normalizeName(name: string): string {
  return name.toLocaleLowerCase('tr').replace(/\s+/g, ' ').trim();
}
```

`backend/src/modules/companies/update-company.dto.ts`:

```ts
import { z } from 'zod';

/**
 * Yalnizca ELLE duzeltilebilecek alanlar. leadScore, websiteStatus ve
 * leadGrade bilerek disarida: onlari puanlama motoru (Faz 4) hesapliyor.
 * Elle degistirilebilseydi motorun bir sonraki calismasinda sessizce
 * ustune yazilirdi.
 */
export const updateCompanySchema = z
  .object({
    name: z.string().trim().min(1).max(255).optional(),
    phone: z.string().trim().max(40).nullable().optional(),
    phoneE164: z.string().trim().regex(/^\+\d{7,15}$/, 'E.164 bicimi olmali').nullable().optional(),
    websiteUrl: z.string().url().max(500).nullable().optional(),
    sector: z.string().trim().max(60).nullable().optional(),
    city: z.string().trim().max(80).nullable().optional(),
    district: z.string().trim().max(80).nullable().optional(),
    address: z.string().trim().max(500).nullable().optional(),
  })
  .strict() // tanimsiz alan gonderilirse 400 — sessizce yutulmaz
  .refine((d) => Object.keys(d).length > 0, { message: 'Guncellenecek alan yok' });

export type UpdateCompanyDto = z.infer<typeof updateCompanySchema>;
```

- [ ] **Step 6: Controller ve modulu yaz**

`backend/src/modules/companies/companies.controller.ts`:

```ts
import { Body, Controller, Get, Param, Patch, Query } from '@nestjs/common';
import { CompaniesService } from './companies.service';
import { listQuerySchema, type ListQuery } from './company-filter.dto';
import { updateCompanySchema, type UpdateCompanyDto } from './update-company.dto';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';

@Controller('companies')
export class CompaniesController {
  constructor(private readonly companies: CompaniesService) {}

  @Get()
  list(@Query(new ZodValidationPipe(listQuerySchema.transform(flattenQuery))) q: ListQuery) {
    return this.companies.list(q);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.companies.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateCompanySchema)) dto: UpdateCompanyDto,
  ) {
    return this.companies.update(id, dto);
  }
}

/** Sorgu dizesi duz gelir (?city=X&limit=7); semanin bekledigi ic ice yapiya cevirir. */
function flattenQuery(q: ListQuery): ListQuery {
  return q;
}
```

> **Not:** sorgu dizesi duz geldigi icin `listQuerySchema`'nin `filter` alanini
> ayni duzlemden okumasi gerekiyor. Bunu saglamak icin `company-filter.dto.ts`
> icindeki `listQuerySchema` tanimini soyle degistir:
>
> ```ts
> export const listQuerySchema = z
>   .object({
>     sort: sortSchema,
>     limit: z.coerce.number().int().min(1).max(200).default(50),
>     cursor: z.string().max(500).optional(),
>   })
>   .passthrough()
>   .transform((raw, ctx) => {
>     const parsed = companyFilterSchema.safeParse(raw);
>     if (!parsed.success) {
>       for (const issue of parsed.error.issues) ctx.addIssue(issue);
>       return z.NEVER;
>     }
>     return {
>       filter: parsed.data,
>       sort: raw.sort,
>       limit: raw.limit,
>       cursor: raw.cursor,
>     };
>   });
> ```
>
> Boylece `?city=Ankara&limit=7` hem filtreye hem sayfalamaya dogru dagilir.
> Controller'daki `flattenQuery` yardimcisi bu durumda gereksizdir, sil.

`backend/src/modules/companies/companies.module.ts`:

```ts
import { Module } from '@nestjs/common';
import { CompaniesController } from './companies.controller';
import { CompaniesService } from './companies.service';

@Module({
  controllers: [CompaniesController],
  providers: [CompaniesService],
  exports: [CompaniesService],
})
export class CompaniesModule {}
```

`src/app.module.ts` icinde `imports` dizisine `CompaniesModule` ekle (AuthModule'un altina) ve dosyanin basina `import { CompaniesModule } from './modules/companies/companies.module';` satirini koy.

- [ ] **Step 7: Testi calistir, GECTIGINI gor**

```bash
cd backend
PW=$(grep -oP '(?<=mysql://salesos:)[^@]+' .env)
DATABASE_URL="mysql://salesos:$PW@127.0.0.1:3306/salesos" npx jest --config test/jest-e2e.json companies
```
Expected: PASS — 10 test

- [ ] **Step 8: Commit**

```bash
cd /home/melih/sitestudyo-sales-os
git add backend/src/modules/companies/ backend/src/app.module.ts backend/test/
git commit -m "Faz 2: isletme listesi, detay ve elle duzeltme uclari

Liste limit+1 cekiyor: fazladan kayit gelirse sonraki sayfa var demektir,
ayri bir sayim sorgusu gerekmiyor. Toplam sayi imlecte tasiniyor.

PATCH yalnizca elle duzeltilebilir alanlari kabul ediyor; leadScore ve
websiteStatus disarida cunku onlari puanlama motoru hesapliyor ve elle
degistirilse bir sonraki calismada sessizce ustune yazilirdi.

Ad degisince nameNormalized birlikte tazeleniyor — mukerrer tespiti ona
bagli, bayat kalirsa ayni isletme iki kez girer."
```

---

## Görev 5: Sayım ucu ve "liste == sayım" değişmezi

**Files:**
- Modify: `backend/src/modules/companies/companies.controller.ts`
- Test: `backend/test/companies-invariant.e2e-spec.ts`

**Interfaces:**
- Consumes: `CompaniesService.count(filter)` (Görev 4'te yazildi)
- Produces: `POST /companies/count` -> `{ matched: number }`

Bu gorev planin en onemli parcasi: burada yazilan test, tasarimin var olma
sebebini kaniti altina aliyor.

- [ ] **Step 1: Failing testi yaz**

`backend/test/companies-invariant.e2e-spec.ts`:

```ts
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import request from 'supertest';
import { LeadGrade, UserRole, WebsiteStatus } from '@prisma/client';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/common/prisma/prisma.service';
import { AuthService } from '../src/modules/auth/auth.service';
import { makeCompany, cleanupCompanies } from './factories';

/**
 * TASARIMIN VAR OLMA SEBEBI OLAN TEST.
 *
 * Filtre mantigi liste ve toplu islem uclarinda ayri ayri yazilsaydi, biri
 * guncellenip digeri unutuldugunda sistem SESSIZCE yanlis calisirdi: liste
 * 3.400 gosterirken toplu islem 3.600 kayda dokunurdu. Hicbir hata cikmaz,
 * kimse fark etmez, yanlis isletmelere etiket atilir.
 *
 * Bu test gectigi surece o hata sinifi imkansizdir.
 */
describe('Degismez: liste sayisi == sayim sayisi (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let token: string;

  const EMAIL = `inv-${Date.now()}@test.local`;
  const PASSWORD = 'e2e-Test-Parola-123';

  const FILTERS: Array<Record<string, unknown>> = [
    {},
    { city: 'Ankara' },
    { city: 'Istanbul', district: 'Fatih' },
    { websiteStatus: ['NO_WEBSITE'] },
    { websiteStatus: ['NO_WEBSITE', 'BROKEN'] },
    { leadGrade: ['VERY_HOT'] },
    { minScore: 70 },
    { minScore: 70, maxScore: 89 },
    { hasPhone: 'true' },
    { hasPhone: 'false' },
    { sector: 'guzellik' },
    { city: 'Ankara', websiteStatus: ['NO_WEBSITE'], minScore: 50 },
  ];

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication<NestFastifyApplication>(new FastifyAdapter());
    app.setGlobalPrefix('api/v1');
    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    prisma = app.get(PrismaService);
    await prisma.user.create({
      data: {
        email: EMAIL,
        name: 'Invariant Test',
        role: UserRole.ADMIN,
        passwordHash: await AuthService.hashPassword(PASSWORD),
      },
    });
    const login = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: EMAIL, password: PASSWORD });
    token = login.body.accessToken;

    await cleanupCompanies(prisma);
    const cities = ['Istanbul', 'Ankara', 'Izmir'];
    const sectors = ['guzellik', 'yeme_icme', 'spor_saglik'];
    const statuses = [
      WebsiteStatus.NO_WEBSITE,
      WebsiteStatus.BROKEN,
      WebsiteStatus.ACTIVE_GOOD,
      WebsiteStatus.SOCIAL_ONLY,
    ];
    for (let i = 0; i < 200; i++) {
      const score = i % 101;
      await makeCompany(prisma, {
        city: cities[i % 3],
        district: i % 2 === 0 ? 'Fatih' : 'Kadikoy',
        sector: sectors[i % 3],
        websiteStatus: statuses[i % 4],
        leadScore: score,
        leadGrade:
          score >= 90 ? LeadGrade.VERY_HOT : score >= 70 ? LeadGrade.HOT : LeadGrade.LOW,
        // Ucte birinin telefonu YOK: hasPhone filtresi anlamli olsun
        phoneE164: i % 3 === 0 ? null : `+9055512${String(i).padStart(5, '0')}`,
      });
    }
  }, 120000);

  afterAll(async () => {
    await cleanupCompanies(prisma);
    await prisma.user.deleteMany({ where: { email: EMAIL } });
    await app.close();
  });

  /** Listeyi imlecle sonuna kadar gezip benzersiz id sayisini doner. */
  async function walkList(filter: Record<string, unknown>): Promise<number> {
    const seen = new Set<string>();
    let cursor: string | null = null;
    let guard = 0;
    do {
      const res = await request(app.getHttpServer())
        .get('/api/v1/companies')
        .set('Authorization', `Bearer ${token}`)
        .query({ ...filter, limit: 13, ...(cursor ? { cursor } : {}) })
        .expect(200);
      for (const c of res.body.items) seen.add(c.id);
      cursor = res.body.nextCursor;
      if (++guard > 100) throw new Error('Sayfalama bitmedi — imlec ilerlemiyor');
    } while (cursor);
    return seen.size;
  }

  it.each(FILTERS)('filtre %j icin liste ve sayim ayni sonucu verir', async (filter) => {
    const listed = await walkList(filter);

    const counted = await request(app.getHttpServer())
      .post('/api/v1/companies/count')
      .set('Authorization', `Bearer ${token}`)
      .send({ filter })
      .expect(200);

    expect(counted.body.matched).toBe(listed);
  }, 60000);

  it('sayim, listenin bildirdigi approxTotal ile de tutar', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/companies')
      .set('Authorization', `Bearer ${token}`)
      .query({ city: 'Ankara' })
      .expect(200);

    const counted = await request(app.getHttpServer())
      .post('/api/v1/companies/count')
      .set('Authorization', `Bearer ${token}`)
      .send({ filter: { city: 'Ankara' } })
      .expect(200);

    expect(res.body.approxTotal).toBe(counted.body.matched);
  });
});
```

- [ ] **Step 2: Testi calistir, BASARISIZ oldugunu gor**

```bash
cd backend
PW=$(grep -oP '(?<=mysql://salesos:)[^@]+' .env)
DATABASE_URL="mysql://salesos:$PW@127.0.0.1:3306/salesos" npx jest --config test/jest-e2e.json companies-invariant
```
Expected: FAIL — `POST /companies/count` 404

- [ ] **Step 3: Sayim ucunu ekle**

`companies.controller.ts` icine:

```ts
import { HttpCode, Post } from '@nestjs/common';
import { companyFilterSchema, type CompanyFilter } from './company-filter.dto';
import { z } from 'zod';

const countSchema = z.object({ filter: companyFilterSchema.default({}) });

// ... sinif icine:

  /**
   * Toplu islemden ONCE "kac kayit etkilenecek" sorusuna kesin cevap.
   * Listenin approxTotal degeri imlecte tasindigi icin bayat olabilir;
   * bu uc her cagrida yeniden sayar.
   */
  @Post('count')
  @HttpCode(200)
  async count(@Body(new ZodValidationPipe(countSchema)) body: { filter: CompanyFilter }) {
    return { matched: await this.companies.count(body.filter) };
  }
```

> **Yol sirasi onemli:** `@Post('count')` metodu `@Get(':id')` ile catismaz
> (farkli HTTP fiili) ama ileride `@Post(':id/...')` eklenirse `count`
> metodunun controller icinde ONCE tanimli olmasi gerekir; yoksa `:id`
> yakalayicisi "count" metnini bir kimlik sanir.

- [ ] **Step 4: Testi calistir, GECTIGINI gor**

```bash
cd backend
PW=$(grep -oP '(?<=mysql://salesos:)[^@]+' .env)
DATABASE_URL="mysql://salesos:$PW@127.0.0.1:3306/salesos" npx jest --config test/jest-e2e.json companies-invariant
```
Expected: PASS — 13 test (12 filtre + 1 approxTotal)

- [ ] **Step 5: Commit**

```bash
cd /home/melih/sitestudyo-sales-os
git add backend/src/modules/companies/ backend/test/
git commit -m "Faz 2: sayim ucu ve 'liste == sayim' degismezi

Bu testin varligi tasarimin gerekcesi. Filtre mantigi liste ve toplu
islem uclarinda ayri ayri yazilsaydi, biri guncellenip digeri
unutuldugunda liste 3.400 gosterirken toplu islem 3.600 kayda
dokunurdu — hicbir hata vermeden.

12 farkli filtre kombinasyonunda listeyi imlecle sonuna kadar gezip
sayim ucuyla karsilastiriyor."
```

---

## Görev 6: Etiketler

**Files:**
- Create: `backend/src/modules/crm-shared/tags.service.ts`
- Create: `backend/src/modules/crm-shared/tags.controller.ts`
- Create: `backend/src/modules/crm-shared/crm-shared.module.ts`
- Modify: `backend/src/app.module.ts`
- Test: `backend/test/tags.e2e-spec.ts`

**Interfaces:**
- Produces:
  - `TagsService.list(): Promise<Tag[]>`
  - `TagsService.create(dto: { name: string; color?: string }): Promise<Tag>`
  - `TagsService.remove(id: string): Promise<void>`
  - `TagsService.slugify(name: string): string`

- [ ] **Step 1: Failing test yaz**

`backend/test/tags.e2e-spec.ts` — acilis blogu Gorev 4'teki `companies.e2e-spec.ts`
ile ayni (`EMAIL = \`tag-${Date.now()}@test.local\``), testler:

```ts
  it('etiket olusturur ve slug uretir', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/tags')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Sıcak Müşteri', color: '#ff0000' })
      .expect(201);
    expect(res.body.slug).toBe('sicak-musteri'); // Turkce karakterler sadelesir
    expect(res.body.name).toBe('Sıcak Müşteri'); // gorunen ad korunur
  });

  it('ayni slug ikinci kez olusturulamaz', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/tags')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Ankara' })
      .expect(201);
    const res = await request(app.getHttpServer())
      .post('/api/v1/tags')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'ankara' }) // farkli yazim, AYNI slug
      .expect(409);
    expect(res.body.code).toBe('duplicate');
  });

  it('gecersiz rengi reddeder', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/tags')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Test', color: 'kirmizi' })
      .expect(400);
    expect(res.body.code).toBe('validation_error');
  });

  it('etiketleri listeler', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/tags')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('etiket silinince isletme baglantilari da silinir ama isletme kalir', async () => {
    const company = await makeCompany(prisma);
    const tag = await prisma.tag.create({ data: { slug: 'silinecek', name: 'Silinecek' } });
    await prisma.companyTag.create({ data: { companyId: company.id, tagId: tag.id } });

    await request(app.getHttpServer())
      .delete(`/api/v1/tags/${tag.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(204);

    expect(await prisma.companyTag.count({ where: { tagId: tag.id } })).toBe(0);
    expect(await prisma.company.findUnique({ where: { id: company.id } })).not.toBeNull();
  });
```

`afterAll` icine ekle: `await prisma.tag.deleteMany({ where: { slug: { in: ['sicak-musteri', 'ankara', 'silinecek'] } } });`

- [ ] **Step 2: Testi calistir, BASARISIZ oldugunu gor**

Run: `... npx jest --config test/jest-e2e.json tags`
Expected: FAIL — 404

- [ ] **Step 3: Servisi yaz**

`backend/src/modules/crm-shared/tags.service.ts`:

```ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class TagsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * "Sıcak Müşteri" -> "sicak-musteri"
   *
   * Slug hem filtre parametresi hem benzersizlik anahtari. Turkce karakter
   * icerirse URL'de yuzde kodlamasina girer ve "Ankara" ile "ankara" ayri
   * etiket olur — kullanici ikisini de olusturur, filtre ikisini de kacirir.
   */
  slugify(name: string): string {
    const map: Record<string, string> = {
      ç: 'c', ğ: 'g', ı: 'i', ö: 'o', ş: 's', ü: 'u', â: 'a', î: 'i', û: 'u',
    };
    return name
      .toLocaleLowerCase('tr')
      .replace(/[çğıöşüâîû]/g, (c) => map[c] ?? c)
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60);
  }

  list() {
    return this.prisma.tag.findMany({ orderBy: { name: 'asc' } });
  }

  create(dto: { name: string; color?: string }) {
    // Slug benzersizligi semada tanimli; catisma olursa Prisma P2002 firlatir
    // ve HttpExceptionFilter onu 409 duplicate'e cevirir.
    return this.prisma.tag.create({
      data: { name: dto.name, slug: this.slugify(dto.name), color: dto.color ?? null },
    });
  }

  async remove(id: string): Promise<void> {
    const tag = await this.prisma.tag.findUnique({ where: { id } });
    if (!tag) throw new NotFoundException({ code: 'not_found', message: 'Etiket bulunamadi' });
    // company_tags uzerindeki iliski onDelete: Cascade — baglantilar silinir,
    // isletmelerin kendisi etkilenmez.
    await this.prisma.tag.delete({ where: { id } });
  }
}
```

- [ ] **Step 4: Controller ve modulu yaz**

`backend/src/modules/crm-shared/tags.controller.ts`:

```ts
import { Body, Controller, Delete, Get, HttpCode, Param, Post } from '@nestjs/common';
import { z } from 'zod';
import { TagsService } from './tags.service';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';

const createTagSchema = z.object({
  name: z.string().trim().min(1).max(80),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Renk #RRGGBB biciminde olmali').optional(),
});

@Controller('tags')
export class TagsController {
  constructor(private readonly tags: TagsService) {}

  @Get()
  list() {
    return this.tags.list();
  }

  @Post()
  create(@Body(new ZodValidationPipe(createTagSchema)) dto: { name: string; color?: string }) {
    return this.tags.create(dto);
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(@Param('id') id: string): Promise<void> {
    await this.tags.remove(id);
  }
}
```

`backend/src/modules/crm-shared/crm-shared.module.ts`:

```ts
import { Global, Module } from '@nestjs/common';
import { TagsService } from './tags.service';
import { TagsController } from './tags.controller';

/**
 * @Global: ActivityService ve TagsService'i neredeyse her CRM modulu
 * kullanacak. Her modulde tek tek import etmek yerine bir kez global.
 */
@Global()
@Module({
  controllers: [TagsController],
  providers: [TagsService],
  exports: [TagsService],
})
export class CrmSharedModule {}
```

`app.module.ts` imports dizisine `CrmSharedModule` ekle (CompaniesModule'dan ONCE — global modul once yuklenmelidir).

- [ ] **Step 5: Testi calistir, GECTIGINI gor**

Run: `... npx jest --config test/jest-e2e.json tags`
Expected: PASS — 5 test

- [ ] **Step 6: Commit**

```bash
cd /home/melih/sitestudyo-sales-os
git add backend/src/modules/crm-shared/ backend/src/app.module.ts backend/test/
git commit -m "Faz 2: etiket servisi ve uclari

Slug uretimi Turkce karakterleri sadelestirip 'tr' yereliyle kucultuyor.
Aksi halde 'Ankara' ile 'ankara' ayri etiket olurdu: kullanici ikisini de
olusturur, filtre ikisini de kacirir."
```

---

## Görev 7: Toplu işlem (tag / untag / dnc)

**Files:**
- Create: `backend/src/modules/companies/company-bulk.service.ts`
- Create: `backend/src/modules/companies/bulk.dto.ts`
- Modify: `backend/src/modules/companies/companies.controller.ts`
- Modify: `backend/src/modules/companies/companies.module.ts`
- Test: `backend/test/companies-bulk.e2e-spec.ts`

**Interfaces:**
- Consumes: `CompanyQuery.toWhere`, `CompaniesService.count`
- Produces: `CompanyBulkService.run(dto: BulkDto): Promise<BulkResult>` where
  `BulkResult = { matched: number; applied: number; skipped: number }`

- [ ] **Step 1: Failing testi yaz**

`backend/test/companies-bulk.e2e-spec.ts` — acilis Gorev 4 ile ayni
(`EMAIL = \`blk-${Date.now()}@test.local\``), `beforeAll` icinde 40 isletme uret
(20'si Ankara, 20'si Istanbul), sonra:

```ts
  const bulk = (body: unknown) =>
    request(app.getHttpServer())
      .post('/api/v1/companies/bulk')
      .set('Authorization', `Bearer ${token}`)
      .send(body);

  it('filtreye uyan tum isletmeleri etiketler', async () => {
    const tag = await prisma.tag.create({ data: { slug: 'blk-a', name: 'Blk A' } });
    const res = await bulk({
      filter: { city: 'Ankara' },
      action: 'tag',
      payload: { tagIds: [tag.id] },
    }).expect(200);

    expect(res.body.matched).toBe(20);
    expect(res.body.applied).toBe(20);
    expect(await prisma.companyTag.count({ where: { tagId: tag.id } })).toBe(20);
  });

  it('ayni etiketi ikinci kez uygulamak hata vermez, mukerrer olusturmaz', async () => {
    const tag = await prisma.tag.create({ data: { slug: 'blk-b', name: 'Blk B' } });
    await bulk({ filter: { city: 'Ankara' }, action: 'tag', payload: { tagIds: [tag.id] } });
    await bulk({ filter: { city: 'Ankara' }, action: 'tag', payload: { tagIds: [tag.id] } }).expect(200);
    expect(await prisma.companyTag.count({ where: { tagId: tag.id } })).toBe(20);
  });

  it('excludeIds ile belirtilenlere dokunmaz', async () => {
    const tag = await prisma.tag.create({ data: { slug: 'blk-c', name: 'Blk C' } });
    const ankara = await prisma.company.findMany({
      where: { city: 'Ankara', placeId: { startsWith: 'test-' } },
      take: 3,
    });
    const res = await bulk({
      filter: { city: 'Ankara' },
      excludeIds: ankara.map((c) => c.id),
      action: 'tag',
      payload: { tagIds: [tag.id] },
    }).expect(200);

    expect(res.body.matched).toBe(17);
    expect(await prisma.companyTag.count({ where: { tagId: tag.id } })).toBe(17);
    for (const c of ankara) {
      expect(await prisma.companyTag.count({ where: { tagId: tag.id, companyId: c.id } })).toBe(0);
    }
  });

  it('etiket kaldirir', async () => {
    const tag = await prisma.tag.create({ data: { slug: 'blk-d', name: 'Blk D' } });
    await bulk({ filter: { city: 'Ankara' }, action: 'tag', payload: { tagIds: [tag.id] } });
    await bulk({ filter: { city: 'Ankara' }, action: 'untag', payload: { tagIds: [tag.id] } }).expect(200);
    expect(await prisma.companyTag.count({ where: { tagId: tag.id } })).toBe(0);
  });

  it('temas etme listesine ekler (telefonu olanlar icin)', async () => {
    const res = await bulk({ filter: { city: 'Istanbul' }, action: 'dnc' }).expect(200);
    expect(res.body.applied).toBeGreaterThan(0);
    const count = await prisma.doNotContact.count({ where: { type: 'PHONE' } });
    expect(count).toBeGreaterThan(0);
  });

  it('confirmCount tutmuyorsa 409 doner ve HICBIR SEY yazmaz', async () => {
    const tag = await prisma.tag.create({ data: { slug: 'blk-e', name: 'Blk E' } });
    const before = await prisma.companyTag.count();

    const res = await bulk({
      filter: { city: 'Ankara' },
      action: 'tag',
      payload: { tagIds: [tag.id] },
      confirmCount: 999, // ekranda gorulen sayi artik gecerli degil
    }).expect(409);

    expect(res.body.code).toBe('count_mismatch');
    expect(res.body.message).toContain('20'); // gercek sayiyi bildirir
    expect(await prisma.companyTag.count()).toBe(before); // tek satir bile yazilmadi
  });

  it('confirmCount tutuyorsa uygular', async () => {
    const tag = await prisma.tag.create({ data: { slug: 'blk-f', name: 'Blk F' } });
    await bulk({
      filter: { city: 'Ankara' },
      action: 'tag',
      payload: { tagIds: [tag.id] },
      confirmCount: 20,
    }).expect(200);
    expect(await prisma.companyTag.count({ where: { tagId: tag.id } })).toBe(20);
  });

  it('bos filtre ile tum havuza dokunmayi reddeder', async () => {
    // Kazara "hepsini etiketle" en pahali hatalardan biri; acik onay istiyoruz.
    const tag = await prisma.tag.create({ data: { slug: 'blk-g', name: 'Blk G' } });
    const res = await bulk({ filter: {}, action: 'tag', payload: { tagIds: [tag.id] } }).expect(400);
    expect(res.body.code).toBe('empty_filter_not_allowed');
  });

  it('bilinmeyen etiket kimliginde 400 doner', async () => {
    const res = await bulk({
      filter: { city: 'Ankara' },
      action: 'tag',
      payload: { tagIds: ['00000000-0000-4000-8000-000000000000'] },
    }).expect(400);
    expect(res.body.code).toBe('validation_error');
  });
```

`afterAll` icine: `await prisma.companyTag.deleteMany({}); await prisma.tag.deleteMany({ where: { slug: { startsWith: 'blk-' } } }); await prisma.doNotContact.deleteMany({});`

- [ ] **Step 2: Testi calistir, BASARISIZ oldugunu gor**

Run: `... npx jest --config test/jest-e2e.json companies-bulk`
Expected: FAIL — 404

- [ ] **Step 3: Toplu islem DTO'sunu yaz**

`backend/src/modules/companies/bulk.dto.ts`:

```ts
import { z } from 'zod';
import { companyFilterSchema } from './company-filter.dto';

/** promote icin ust sinir; gerekcesi company-bulk.service.ts icinde. */
export const PROMOTE_LIMIT = 200;

export const bulkSchema = z.object({
  filter: companyFilterSchema,
  excludeIds: z.array(z.string().uuid()).max(500).default([]),
  action: z.enum(['tag', 'untag', 'promote', 'dnc']),
  payload: z
    .object({
      tagIds: z.array(z.string().uuid()).min(1).max(10).optional(),
      pipelineId: z.string().uuid().optional(),
    })
    .default({}),
  /**
   * Istemcinin ekranda GORDUGU sayi. Verilirse sunucu kendi saydigi sayiyla
   * karsilastirir ve tutmuyorsa hicbir sey yapmaz. Gorulen ile yapilanin
   * ayni kume olmasini garanti eder.
   */
  confirmCount: z.number().int().min(0).optional(),
});

export type BulkDto = z.infer<typeof bulkSchema>;

export interface BulkResult {
  matched: number;
  applied: number;
  skipped: number;
}
```

- [ ] **Step 4: Toplu islem servisini yaz**

`backend/src/modules/companies/company-bulk.service.ts`:

```ts
import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { DncType, Prisma } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CompanyQuery } from './company-query';
import { PROMOTE_LIMIT, type BulkDto, type BulkResult } from './bulk.dto';

/** Tek seferde islenecek satir sayisi — cok buyuk INSERT'ler kilit suresini uzatir. */
const BATCH = 500;

@Injectable()
export class CompanyBulkService {
  constructor(private readonly prisma: PrismaService) {}

  async run(dto: BulkDto): Promise<BulkResult> {
    // Bos filtre = tum havuz. Kazara "hepsini etiketle" geri alinmasi zor bir
    // hata; en az bir daraltma kosulu sart.
    if (Object.keys(dto.filter).length === 0) {
      throw new BadRequestException({
        code: 'empty_filter_not_allowed',
        message: 'Toplu islem icin en az bir filtre secmelisiniz',
      });
    }

    const where: Prisma.CompanyWhereInput = {
      AND: [
        CompanyQuery.toWhere(dto.filter),
        ...(dto.excludeIds.length ? [{ id: { notIn: dto.excludeIds } }] : []),
      ],
    };

    const matched = await this.prisma.company.count({ where });

    // Once dogrula, SONRA yaz. Sirasi tersine donerse kismen uygulanmis bir
    // islem kalir ve kullanici neyin degistigini bilemez.
    if (dto.confirmCount !== undefined && dto.confirmCount !== matched) {
      throw new ConflictException({
        code: 'count_mismatch',
        message: `Kayit sayisi degismis: ekranda ${dto.confirmCount} vardi, simdi ${matched}. Listeyi yenileyip tekrar deneyin.`,
      });
    }

    if (dto.action === 'promote' && matched > PROMOTE_LIMIT) {
      throw new BadRequestException({
        code: 'bulk_limit_exceeded',
        message: `Tek seferde en fazla ${PROMOTE_LIMIT} isletme huniye alinabilir (${matched} secildi). Filtreyi daraltin.`,
      });
    }

    if (dto.action === 'tag' || dto.action === 'untag') {
      const tagIds = dto.payload.tagIds ?? [];
      if (!tagIds.length) {
        throw new BadRequestException({
          code: 'validation_error',
          message: 'Etiket secilmedi',
          fields: { 'payload.tagIds': 'En az bir etiket gerekli' },
        });
      }
      const existing = await this.prisma.tag.count({ where: { id: { in: tagIds } } });
      if (existing !== tagIds.length) {
        throw new BadRequestException({
          code: 'validation_error',
          message: 'Secilen etiketlerden biri bulunamadi',
          fields: { 'payload.tagIds': 'Gecersiz etiket' },
        });
      }
    }

    const ids = await this.collectIds(where);
    let applied = 0;

    for (let i = 0; i < ids.length; i += BATCH) {
      const batch = ids.slice(i, i + BATCH);
      applied += await this.applyBatch(dto, batch);
    }

    return { matched, applied, skipped: matched - Math.min(applied, matched) };
  }

  /** Etkilenecek kimlikleri toplar. Yalnizca id cekiyoruz — tum satir gereksiz. */
  private async collectIds(where: Prisma.CompanyWhereInput): Promise<string[]> {
    const rows = await this.prisma.company.findMany({ where, select: { id: true } });
    return rows.map((r) => r.id);
  }

  private async applyBatch(dto: BulkDto, companyIds: string[]): Promise<number> {
    switch (dto.action) {
      case 'tag': {
        const data = companyIds.flatMap((companyId) =>
          (dto.payload.tagIds ?? []).map((tagId) => ({ companyId, tagId })),
        );
        // skipDuplicates: ayni etiket ikinci kez uygulanirsa hata vermek yerine
        // atlanir — kullanici acisindan "zaten etiketliydi" bir hata degil.
        const res = await this.prisma.companyTag.createMany({ data, skipDuplicates: true });
        return res.count > 0 ? companyIds.length : 0;
      }
      case 'untag': {
        await this.prisma.companyTag.deleteMany({
          where: { companyId: { in: companyIds }, tagId: { in: dto.payload.tagIds ?? [] } },
        });
        return companyIds.length;
      }
      case 'dnc': {
        const rows = await this.prisma.company.findMany({
          where: { id: { in: companyIds }, phoneE164: { not: null } },
          select: { phoneE164: true },
        });
        const res = await this.prisma.doNotContact.createMany({
          data: rows.map((r) => ({
            type: DncType.PHONE,
            value: r.phoneE164!,
            reason: 'Toplu islemle eklendi',
          })),
          skipDuplicates: true,
        });
        return res.count;
      }
      case 'promote':
        // Gorev 12'de leads modulu hazir olunca doldurulacak.
        throw new BadRequestException({
          code: 'not_implemented',
          message: 'Toplu terfi henuz kullanilabilir degil',
        });
    }
  }
}
```

- [ ] **Step 5: Controller ve modulu guncelle**

`companies.controller.ts` icine:

```ts
import { CompanyBulkService } from './company-bulk.service';
import { bulkSchema, type BulkDto } from './bulk.dto';

// yapici: private readonly bulkService: CompanyBulkService

  @Post('bulk')
  @HttpCode(200)
  runBulk(@Body(new ZodValidationPipe(bulkSchema)) dto: BulkDto) {
    return this.bulkService.run(dto);
  }
```

`companies.module.ts` providers dizisine `CompanyBulkService` ekle.

- [ ] **Step 6: Testi calistir, GECTIGINI gor**

Run: `... npx jest --config test/jest-e2e.json companies-bulk`
Expected: PASS — 9 test

- [ ] **Step 7: Commit**

```bash
cd /home/melih/sitestudyo-sales-os
git add backend/src/modules/companies/ backend/test/
git commit -m "Faz 2: filtre bazli toplu islem (tag/untag/dnc)

Toplu islem ID degil FILTRE aliyor: 3.400 kaydi secince 3.400 kimlik
gondermek pratik degil ve imlecli listede istemci hepsini gormemistir.

Uc koruma:
- confirmCount: ekranda gorulen sayi ile gercek sayi tutmuyorsa 409 ve
  hicbir sey yazilmaz — gorulen ile yapilan hep ayni kume
- bos filtre reddedilir; kazara tum havuzu etiketlemek geri alinmasi zor
- dogrulama HER ZAMAN yazmadan once; tersine donerse kismen uygulanmis
  bir islem kalir ve kullanici neyin degistigini bilemez"
```

---

## Görev 8: Kişiler (Contacts)

**Files:**
- Create: `backend/src/modules/contacts/contacts.service.ts`, `contacts.controller.ts`, `contact.dto.ts`, `contacts.module.ts`
- Modify: `backend/src/app.module.ts`
- Test: `backend/test/contacts.e2e-spec.ts`

**Interfaces:**
- Produces:
  - `ContactsService.listByCompany(companyId: string)`
  - `ContactsService.create(dto: CreateContactDto)`
  - `ContactsService.update(id: string, dto: UpdateContactDto)`
  - `ContactsService.remove(id: string)`
  - `ContactsService.setPrimary(id: string)`

- [ ] **Step 1: Failing test yaz**

`backend/test/contacts.e2e-spec.ts` — acilis Gorev 4 ile ayni
(`EMAIL = \`ct-${Date.now()}@test.local\``), testler:

```ts
  it('isletmeye kisi ekler', async () => {
    const c = await makeCompany(prisma);
    const res = await request(app.getHttpServer())
      .post('/api/v1/contacts')
      .set('Authorization', `Bearer ${token}`)
      .send({ companyId: c.id, name: 'Ayse Yilmaz', email: 'ayse@ornek.com', role: 'Sahip' })
      .expect(201);
    expect(res.body.email).toBe('ayse@ornek.com');
    expect(res.body.confidence).toBe('GUESSED'); // varsayilan
  });

  it('e-postayi kucuk harfe cevirir', async () => {
    const c = await makeCompany(prisma);
    const res = await request(app.getHttpServer())
      .post('/api/v1/contacts')
      .set('Authorization', `Bearer ${token}`)
      .send({ companyId: c.id, email: 'BUYUK@Ornek.COM' })
      .expect(201);
    // Aksi halde ayni adres iki kez girer ve mukerrer engeli calismaz.
    expect(res.body.email).toBe('buyuk@ornek.com');
  });

  it('ayni isletmeye ayni e-postayi ikinci kez eklemez', async () => {
    const c = await makeCompany(prisma);
    const body = { companyId: c.id, email: 'tek@ornek.com' };
    await request(app.getHttpServer()).post('/api/v1/contacts')
      .set('Authorization', `Bearer ${token}`).send(body).expect(201);
    const res = await request(app.getHttpServer()).post('/api/v1/contacts')
      .set('Authorization', `Bearer ${token}`).send(body).expect(409);
    expect(res.body.code).toBe('duplicate');
  });

  it('olmayan isletmeye kisi eklemeyi reddeder', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/contacts')
      .set('Authorization', `Bearer ${token}`)
      .send({ companyId: '00000000-0000-4000-8000-000000000000', email: 'a@b.com' })
      .expect(404);
    expect(res.body.code).toBe('not_found');
  });

  it('ne e-posta ne telefon verilirse reddeder', async () => {
    const c = await makeCompany(prisma);
    const res = await request(app.getHttpServer())
      .post('/api/v1/contacts')
      .set('Authorization', `Bearer ${token}`)
      .send({ companyId: c.id, name: 'Kimsesiz' })
      .expect(400);
    // Iletisim bilgisi olmayan kisi kaydinin hicbir islevi yok.
    expect(res.body.code).toBe('validation_error');
  });

  it('isletmeye gore listeler, birincil kisi basta gelir', async () => {
    const c = await makeCompany(prisma);
    await prisma.contact.create({ data: { companyId: c.id, email: 'ikinci@x.com' } });
    const first = await prisma.contact.create({
      data: { companyId: c.id, email: 'birinci@x.com', isPrimary: true },
    });
    const res = await request(app.getHttpServer())
      .get('/api/v1/contacts').query({ companyId: c.id })
      .set('Authorization', `Bearer ${token}`).expect(200);
    expect(res.body[0].id).toBe(first.id);
  });

  it('birincil isaretlenince digerinin birincilligi kalkar', async () => {
    const c = await makeCompany(prisma);
    const a = await prisma.contact.create({
      data: { companyId: c.id, email: 'a@x.com', isPrimary: true },
    });
    const b = await prisma.contact.create({ data: { companyId: c.id, email: 'b@x.com' } });

    await request(app.getHttpServer())
      .post(`/api/v1/contacts/${b.id}/primary`)
      .set('Authorization', `Bearer ${token}`).expect(200);

    // Iki birincil kisi olursa "kime yazacagiz" sorusu belirsizlesir.
    expect((await prisma.contact.findUnique({ where: { id: a.id } }))!.isPrimary).toBe(false);
    expect((await prisma.contact.findUnique({ where: { id: b.id } }))!.isPrimary).toBe(true);
  });

  it('kisiyi siler', async () => {
    const c = await makeCompany(prisma);
    const k = await prisma.contact.create({ data: { companyId: c.id, email: 'sil@x.com' } });
    await request(app.getHttpServer())
      .delete(`/api/v1/contacts/${k.id}`)
      .set('Authorization', `Bearer ${token}`).expect(204);
    expect(await prisma.contact.findUnique({ where: { id: k.id } })).toBeNull();
  });
```

- [ ] **Step 2: Testi calistir, BASARISIZ oldugunu gor**

Run: `... npx jest --config test/jest-e2e.json contacts`
Expected: FAIL — 404

- [ ] **Step 3: DTO'lari yaz**

`backend/src/modules/contacts/contact.dto.ts`:

```ts
import { ContactConfidence } from '@prisma/client';
import { z } from 'zod';

const base = {
  name: z.string().trim().max(160).nullable().optional(),
  role: z.string().trim().max(120).nullable().optional(),
  email: z.string().email().max(191).toLowerCase().nullable().optional(),
  phone: z.string().trim().max(40).nullable().optional(),
  confidence: z.nativeEnum(ContactConfidence).optional(),
};

export const createContactSchema = z
  .object({ companyId: z.string().uuid(), ...base })
  .strict()
  .refine((d) => Boolean(d.email || d.phone), {
    message: 'E-posta veya telefon zorunlu',
    path: ['email'],
  });

export const updateContactSchema = z
  .object(base)
  .strict()
  .refine((d) => Object.keys(d).length > 0, { message: 'Guncellenecek alan yok' });

export type CreateContactDto = z.infer<typeof createContactSchema>;
export type UpdateContactDto = z.infer<typeof updateContactSchema>;
```

- [ ] **Step 4: Servisi yaz**

`backend/src/modules/contacts/contacts.service.ts`:

```ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import type { CreateContactDto, UpdateContactDto } from './contact.dto';

@Injectable()
export class ContactsService {
  constructor(private readonly prisma: PrismaService) {}

  listByCompany(companyId: string) {
    // Birincil kisi basta: arayuz "kime yazacagiz" sorusuna ilk satirdan cevap versin.
    return this.prisma.contact.findMany({
      where: { companyId },
      orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
    });
  }

  async create(dto: CreateContactDto) {
    const company = await this.prisma.company.findUnique({ where: { id: dto.companyId } });
    if (!company) {
      throw new NotFoundException({ code: 'not_found', message: 'Isletme bulunamadi' });
    }
    // (companyId, email) benzersizligi semada tanimli -> P2002 -> 409 duplicate
    return this.prisma.contact.create({ data: { ...dto, source: 'manual' } });
  }

  async update(id: string, dto: UpdateContactDto) {
    await this.getOrThrow(id);
    return this.prisma.contact.update({ where: { id }, data: dto });
  }

  async remove(id: string): Promise<void> {
    await this.getOrThrow(id);
    await this.prisma.contact.delete({ where: { id } });
  }

  async setPrimary(id: string) {
    const contact = await this.getOrThrow(id);
    // Tek transaction: aradaki bir hata iki birincil kisi birakirsa "kime
    // yazacagiz" sorusu belirsiz kalir.
    return this.prisma.$transaction(async (tx) => {
      await tx.contact.updateMany({
        where: { companyId: contact.companyId, isPrimary: true },
        data: { isPrimary: false },
      });
      return tx.contact.update({ where: { id }, data: { isPrimary: true } });
    });
  }

  private async getOrThrow(id: string) {
    const contact = await this.prisma.contact.findUnique({ where: { id } });
    if (!contact) {
      throw new NotFoundException({ code: 'not_found', message: 'Kisi bulunamadi' });
    }
    return contact;
  }
}
```

- [ ] **Step 5: Controller ve modulu yaz**

`backend/src/modules/contacts/contacts.controller.ts`:

```ts
import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Query } from '@nestjs/common';
import { z } from 'zod';
import { ContactsService } from './contacts.service';
import {
  createContactSchema, updateContactSchema,
  type CreateContactDto, type UpdateContactDto,
} from './contact.dto';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';

const listSchema = z.object({ companyId: z.string().uuid() });

@Controller('contacts')
export class ContactsController {
  constructor(private readonly contacts: ContactsService) {}

  @Get()
  list(@Query(new ZodValidationPipe(listSchema)) q: { companyId: string }) {
    return this.contacts.listByCompany(q.companyId);
  }

  @Post()
  create(@Body(new ZodValidationPipe(createContactSchema)) dto: CreateContactDto) {
    return this.contacts.create(dto);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateContactSchema)) dto: UpdateContactDto,
  ) {
    return this.contacts.update(id, dto);
  }

  @Post(':id/primary')
  @HttpCode(200)
  setPrimary(@Param('id') id: string) {
    return this.contacts.setPrimary(id);
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(@Param('id') id: string): Promise<void> {
    await this.contacts.remove(id);
  }
}
```

`backend/src/modules/contacts/contacts.module.ts`:

```ts
import { Module } from '@nestjs/common';
import { ContactsController } from './contacts.controller';
import { ContactsService } from './contacts.service';

@Module({
  controllers: [ContactsController],
  providers: [ContactsService],
  exports: [ContactsService],
})
export class ContactsModule {}
```

`app.module.ts` imports dizisine `ContactsModule` ekle.

- [ ] **Step 6: Testi calistir, GECTIGINI gor**

Run: `... npx jest --config test/jest-e2e.json contacts`
Expected: PASS — 8 test

- [ ] **Step 7: Commit**

```bash
cd /home/melih/sitestudyo-sales-os
git add backend/src/modules/contacts/ backend/src/app.module.ts backend/test/
git commit -m "Faz 2: kisi (contact) modulu

E-posta kucuk harfe ceviriliyor; aksi halde ayni adres iki farkli kayit
olur ve (companyId, email) benzersizligi ise yaramaz.

Birincil kisi isaretleme tek transaction: yarim kalirsa iki birincil kisi
kalir ve 'kime yazacagiz' sorusu belirsizlesir.

Ne e-posta ne telefon iceren kisi kaydi reddediliyor — hicbir islevi yok."
```

---

## Görev 9: Zaman tüneli (Activities) ve notlar

**Files:**
- Create: `backend/src/modules/crm-shared/activity.service.ts`, `activities.controller.ts`, `notes.service.ts`, `notes.controller.ts`, `activity.dto.ts`
- Modify: `backend/src/modules/crm-shared/crm-shared.module.ts`
- Test: `backend/test/activities.e2e-spec.ts`

**Interfaces:**
- Produces:
  - `ActivityService.record(input: RecordActivityInput, tx?: Prisma.TransactionClient): Promise<Activity>`
  - `ActivityService.list(q: { companyId?: string; leadId?: string; limit: number })`
  - `RecordActivityInput = { type: ActivityType; companyId?: string | null; leadId?: string | null; userId?: string | null; subject?: string | null; body?: string | null; meta?: Prisma.InputJsonValue; occurredAt?: Date }`
  - `NotesService.create/update/remove/listBy`

- [ ] **Step 1: Failing test yaz**

`backend/test/activities.e2e-spec.ts` — acilis Gorev 4 ile ayni
(`EMAIL = \`act-${Date.now()}@test.local\``), testler:

```ts
  it('elle aktivite ekler', async () => {
    const c = await makeCompany(prisma);
    const res = await request(app.getHttpServer())
      .post('/api/v1/activities')
      .set('Authorization', `Bearer ${token}`)
      .send({ companyId: c.id, type: 'CALL', subject: 'Aradim', body: 'Musait degildi' })
      .expect(201);
    expect(res.body.type).toBe('CALL');
    expect(res.body.userId).toBeTruthy(); // giris yapan kullaniciya baglanir
  });

  it('aktiviteleri en yeniden eskiye siralar', async () => {
    const c = await makeCompany(prisma);
    await prisma.activity.create({
      data: { companyId: c.id, type: 'NOTE', subject: 'eski', occurredAt: new Date('2026-01-01') },
    });
    await prisma.activity.create({
      data: { companyId: c.id, type: 'NOTE', subject: 'yeni', occurredAt: new Date('2026-08-01') },
    });
    const res = await request(app.getHttpServer())
      .get('/api/v1/activities').query({ companyId: c.id })
      .set('Authorization', `Bearer ${token}`).expect(200);
    expect(res.body.items[0].subject).toBe('yeni');
  });

  it('companyId de leadId de verilmezse reddeder', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/activities')
      .set('Authorization', `Bearer ${token}`).expect(400);
    // Filtresiz sorgu tum sistemin zaman tunelini ceker; anlamsiz ve pahali.
    expect(res.body.code).toBe('validation_error');
  });

  it('aktivite silme ucu YOKTUR', async () => {
    const c = await makeCompany(prisma);
    const a = await prisma.activity.create({ data: { companyId: c.id, type: 'CALL' } });
    // Zaman tuneli denetim izi; silinebilseydi "ne zaman yazmistik" sorusunun
    // cevabi guvenilmez olurdu.
    await request(app.getHttpServer())
      .delete(`/api/v1/activities/${a.id}`)
      .set('Authorization', `Bearer ${token}`).expect(404);
  });

  it('not ekler, gunceller ve siler', async () => {
    const c = await makeCompany(prisma);
    const created = await request(app.getHttpServer())
      .post('/api/v1/notes')
      .set('Authorization', `Bearer ${token}`)
      .send({ companyId: c.id, body: 'Ilk not' }).expect(201);

    await request(app.getHttpServer())
      .patch(`/api/v1/notes/${created.body.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ body: 'Duzeltilmis not' }).expect(200);

    await request(app.getHttpServer())
      .delete(`/api/v1/notes/${created.body.id}`)
      .set('Authorization', `Bearer ${token}`).expect(204);

    expect(await prisma.note.findUnique({ where: { id: created.body.id } })).toBeNull();
  });

  it('bos not govdesini reddeder', async () => {
    const c = await makeCompany(prisma);
    const res = await request(app.getHttpServer())
      .post('/api/v1/notes')
      .set('Authorization', `Bearer ${token}`)
      .send({ companyId: c.id, body: '   ' }).expect(400);
    expect(res.body.code).toBe('validation_error');
  });
```

- [ ] **Step 2: Testi calistir, BASARISIZ oldugunu gor**

Run: `... npx jest --config test/jest-e2e.json activities`
Expected: FAIL — 404

- [ ] **Step 3: ActivityService'i yaz**

`backend/src/modules/crm-shared/activity.service.ts`:

```ts
import { BadRequestException, Injectable } from '@nestjs/common';
import { ActivityType, Prisma } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';

export interface RecordActivityInput {
  type: ActivityType;
  companyId?: string | null;
  leadId?: string | null;
  userId?: string | null;
  subject?: string | null;
  body?: string | null;
  meta?: Prisma.InputJsonValue;
  occurredAt?: Date;
}

/**
 * ZAMAN TUNELININ TEK YAZMA KAPISI.
 *
 * Baska hicbir yer prisma.activity.create cagirmaz. Her servis kendi
 * kaydini atsaydi bir olayin yazilmayi unutulmasi kacinilmaz olurdu ve
 * eksiklik ancak birine "biz bunlara ne zaman yazmistik?" diye
 * soruldugunda anlasilirdi — yani guvenilmez oldugu anlasildiginda.
 */
@Injectable()
export class ActivityService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * @param tx Cagiran bir transaction icindeyse onu ver. Terfi gibi
   *   islemlerde lead ile aktivitenin AYNI transaction'da yazilmasi sart:
   *   biri yazilip digeri yazilmazsa gecmis eksik kalir.
   */
  record(input: RecordActivityInput, tx?: Prisma.TransactionClient) {
    if (!input.companyId && !input.leadId) {
      throw new BadRequestException({
        code: 'validation_error',
        message: 'Aktivite bir isletmeye veya lead kaydina bagli olmali',
      });
    }
    const client = tx ?? this.prisma;
    return client.activity.create({
      data: {
        type: input.type,
        companyId: input.companyId ?? null,
        leadId: input.leadId ?? null,
        userId: input.userId ?? null,
        subject: input.subject ?? null,
        body: input.body ?? null,
        meta: input.meta ?? Prisma.JsonNull,
        occurredAt: input.occurredAt ?? new Date(),
      },
    });
  }

  async list(q: { companyId?: string; leadId?: string; limit: number; offset: number }) {
    const where = q.companyId ? { companyId: q.companyId } : { leadId: q.leadId };
    const [items, total] = await Promise.all([
      this.prisma.activity.findMany({
        where,
        orderBy: { occurredAt: 'desc' },
        take: q.limit,
        skip: q.offset,
      }),
      this.prisma.activity.count({ where }),
    ]);
    // Zaman tuneli tek bir kaydin gecmisi; derin sayfalama olmadigi icin
    // burada imlece gerek yok, offset yeterli.
    return { items, total };
  }
}
```

- [ ] **Step 4: Aktivite DTO'su ve controller'i yaz**

`backend/src/modules/crm-shared/activity.dto.ts`:

```ts
import { ActivityType } from '@prisma/client';
import { z } from 'zod';

export const createActivitySchema = z
  .object({
    companyId: z.string().uuid().optional(),
    leadId: z.string().uuid().optional(),
    // SYSTEM ve STAGE_CHANGE disarida: onlari yalnizca sistem uretir.
    // Elle yazilabilseydi denetim izi uydurulabilir hale gelirdi.
    type: z.enum([
      ActivityType.CALL, ActivityType.MEETING,
      ActivityType.EMAIL_OUT, ActivityType.EMAIL_IN, ActivityType.NOTE,
    ]),
    subject: z.string().trim().max(255).optional(),
    body: z.string().trim().max(10000).optional(),
    occurredAt: z.coerce.date().optional(),
  })
  .refine((d) => Boolean(d.companyId || d.leadId), {
    message: 'companyId veya leadId zorunlu',
    path: ['companyId'],
  });

export const listActivitySchema = z
  .object({
    companyId: z.string().uuid().optional(),
    leadId: z.string().uuid().optional(),
    limit: z.coerce.number().int().min(1).max(200).default(50),
    offset: z.coerce.number().int().min(0).default(0),
  })
  .refine((d) => Boolean(d.companyId || d.leadId), {
    message: 'companyId veya leadId zorunlu',
    path: ['companyId'],
  });

export const createNoteSchema = z
  .object({
    companyId: z.string().uuid().optional(),
    leadId: z.string().uuid().optional(),
    body: z.string().trim().min(1, 'Not bos olamaz').max(10000),
  })
  .refine((d) => Boolean(d.companyId || d.leadId), {
    message: 'companyId veya leadId zorunlu',
    path: ['companyId'],
  });

export const updateNoteSchema = z.object({
  body: z.string().trim().min(1, 'Not bos olamaz').max(10000),
});
```

`backend/src/modules/crm-shared/activities.controller.ts`:

```ts
import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ActivityService } from './activity.service';
import { createActivitySchema, listActivitySchema } from './activity.dto';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { CurrentUser, type AuthUser } from '../../common/decorators/current-user.decorator';
import type { z } from 'zod';

@Controller('activities')
export class ActivitiesController {
  constructor(private readonly activities: ActivityService) {}

  // DELETE ucu BILEREK YOK: zaman tuneli denetim izidir, silinemez.

  @Get()
  list(@Query(new ZodValidationPipe(listActivitySchema)) q: z.infer<typeof listActivitySchema>) {
    return this.activities.list(q);
  }

  @Post()
  create(
    @Body(new ZodValidationPipe(createActivitySchema)) dto: z.infer<typeof createActivitySchema>,
    @CurrentUser() user: AuthUser,
  ) {
    return this.activities.record({ ...dto, userId: user.id });
  }
}
```

- [ ] **Step 5: Notes servisini ve controller'i yaz**

`backend/src/modules/crm-shared/notes.service.ts`:

```ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class NotesService {
  constructor(private readonly prisma: PrismaService) {}

  listBy(q: { companyId?: string; leadId?: string }) {
    return this.prisma.note.findMany({
      where: q.companyId ? { companyId: q.companyId } : { leadId: q.leadId },
      orderBy: { createdAt: 'desc' },
    });
  }

  create(dto: { companyId?: string; leadId?: string; body: string }, userId: string) {
    return this.prisma.note.create({
      data: {
        companyId: dto.companyId ?? null,
        leadId: dto.leadId ?? null,
        body: dto.body,
        userId,
      },
    });
  }

  async update(id: string, body: string) {
    await this.getOrThrow(id);
    return this.prisma.note.update({ where: { id }, data: { body } });
  }

  async remove(id: string): Promise<void> {
    await this.getOrThrow(id);
    await this.prisma.note.delete({ where: { id } });
  }

  private async getOrThrow(id: string) {
    const note = await this.prisma.note.findUnique({ where: { id } });
    if (!note) throw new NotFoundException({ code: 'not_found', message: 'Not bulunamadi' });
    return note;
  }
}
```

`backend/src/modules/crm-shared/notes.controller.ts`:

```ts
import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Query } from '@nestjs/common';
import { z } from 'zod';
import { NotesService } from './notes.service';
import { createNoteSchema, updateNoteSchema } from './activity.dto';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { CurrentUser, type AuthUser } from '../../common/decorators/current-user.decorator';

const listNoteSchema = z
  .object({ companyId: z.string().uuid().optional(), leadId: z.string().uuid().optional() })
  .refine((d) => Boolean(d.companyId || d.leadId), { message: 'companyId veya leadId zorunlu' });

@Controller('notes')
export class NotesController {
  constructor(private readonly notes: NotesService) {}

  @Get()
  list(@Query(new ZodValidationPipe(listNoteSchema)) q: z.infer<typeof listNoteSchema>) {
    return this.notes.listBy(q);
  }

  @Post()
  create(
    @Body(new ZodValidationPipe(createNoteSchema)) dto: z.infer<typeof createNoteSchema>,
    @CurrentUser() user: AuthUser,
  ) {
    return this.notes.create(dto, user.id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateNoteSchema)) dto: { body: string },
  ) {
    return this.notes.update(id, dto.body);
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(@Param('id') id: string): Promise<void> {
    await this.notes.remove(id);
  }
}
```

`crm-shared.module.ts` guncelle: `controllers: [TagsController, ActivitiesController, NotesController]`,
`providers: [TagsService, ActivityService, NotesService]`,
`exports: [TagsService, ActivityService, NotesService]`.

- [ ] **Step 6: Testi calistir, GECTIGINI gor**

Run: `... npx jest --config test/jest-e2e.json activities`
Expected: PASS — 6 test

- [ ] **Step 7: Commit**

```bash
cd /home/melih/sitestudyo-sales-os
git add backend/src/modules/crm-shared/ backend/test/
git commit -m "Faz 2: zaman tuneli (activities) ve notlar

ActivityService zaman tunelinin TEK yazma kapisi. Her servis kendi
kaydini atsaydi bir olayin yazilmayi unutulmasi kacinilmazdi ve eksiklik
ancak 'biz bunlara ne zaman yazmistik?' diye soruldugunda anlasilirdi.

Iki bilincli kisit:
- activities silinemez (denetim izi); notes silinebilir (calisma notu)
- SYSTEM ve STAGE_CHANGE elle yazilamaz, yalnizca sistem uretir"
```

---

## Görev 10: Huniler (Pipelines)

**Files:**
- Create: `backend/src/modules/pipelines/pipelines.service.ts`, `pipelines.controller.ts`, `pipeline.dto.ts`, `pipelines.module.ts`
- Modify: `backend/src/app.module.ts`
- Test: `backend/test/pipelines.e2e-spec.ts`

**Interfaces:**
- Produces:
  - `PipelinesService.list()`
  - `PipelinesService.getDefault(): Promise<Pipeline & { stages: PipelineStage[] }>`
  - `PipelinesService.create(dto)`
  - `PipelinesService.replaceStages(pipelineId: string, stages: StageInput[])`

- [ ] **Step 1: Failing test yaz**

`backend/test/pipelines.e2e-spec.ts` — acilis Gorev 4 ile ayni
(`EMAIL = \`pl-${Date.now()}@test.local\``), testler:

```ts
  it('varsayilan huniyi asamalariyla doner', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/pipelines')
      .set('Authorization', `Bearer ${token}`).expect(200);
    const def = res.body.find((p: { isDefault: boolean }) => p.isDefault);
    expect(def).toBeTruthy();
    expect(def.stages.length).toBe(6); // seed'den gelen 6 asama
    expect(def.stages[0].key).toBe('lead');
    expect(def.stages.map((s: { sortOrder: number }) => s.sortOrder))
      .toEqual([...def.stages.map((s: { sortOrder: number }) => s.sortOrder)].sort((a, b) => a - b));
  });

  it('yeni huni olusturur', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/pipelines')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Test Hunisi' }).expect(201);
    expect(res.body.isDefault).toBe(false); // ikinci huni varsayilan olmaz
  });

  it('asamalari topluca degistirir ve siralar', async () => {
    const p = await prisma.pipeline.create({ data: { name: 'Asama Testi' } });
    const res = await request(app.getHttpServer())
      .put(`/api/v1/pipelines/${p.id}/stages`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        stages: [
          { key: 'a', name: 'Birinci', sortOrder: 10 },
          { key: 'b', name: 'Ikinci', sortOrder: 20 },
          { key: 'z', name: 'Kazanildi', sortOrder: 30, isWon: true },
        ],
      }).expect(200);
    expect(res.body.length).toBe(3);
    expect(res.body[2].isWon).toBe(true);
  });

  it('ayni key iki kez verilirse reddeder', async () => {
    const p = await prisma.pipeline.create({ data: { name: 'Cift Key' } });
    const res = await request(app.getHttpServer())
      .put(`/api/v1/pipelines/${p.id}/stages`)
      .set('Authorization', `Bearer ${token}`)
      .send({ stages: [
        { key: 'ayni', name: 'Bir', sortOrder: 10 },
        { key: 'ayni', name: 'Iki', sortOrder: 20 },
      ] }).expect(400);
    expect(res.body.code).toBe('validation_error');
  });

  it('lead barindiran bir asama silinemez', async () => {
    // Aksi halde lead sahipsiz kalir ve hunide hicbir sutunda gorunmez.
    const def = await prisma.pipeline.findFirst({
      where: { isDefault: true }, include: { stages: { orderBy: { sortOrder: 'asc' } } },
    });
    const company = await makeCompany(prisma);
    await prisma.lead.create({
      data: {
        companyId: company.id, pipelineId: def!.id,
        stageId: def!.stages[0].id, title: 'Engelleyen lead',
      },
    });

    const res = await request(app.getHttpServer())
      .put(`/api/v1/pipelines/${def!.id}/stages`)
      .set('Authorization', `Bearer ${token}`)
      .send({ stages: [{ key: 'tek', name: 'Tek Asama', sortOrder: 10 }] })
      .expect(409);
    expect(res.body.code).toBe('stage_in_use');
  });
```

- [ ] **Step 2: Testi calistir, BASARISIZ oldugunu gor**

Run: `... npx jest --config test/jest-e2e.json pipelines`
Expected: FAIL — 404

- [ ] **Step 3: DTO'yu yaz**

`backend/src/modules/pipelines/pipeline.dto.ts`:

```ts
import { z } from 'zod';

export const createPipelineSchema = z.object({
  name: z.string().trim().min(1).max(120),
});

const stageSchema = z.object({
  key: z.string().trim().regex(/^[a-z0-9_]{1,40}$/, 'key kucuk harf, rakam ve alt cizgi olmali'),
  name: z.string().trim().min(1).max(120),
  sortOrder: z.number().int().min(0),
  isWon: z.boolean().default(false),
  isLost: z.boolean().default(false),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
});

export const replaceStagesSchema = z
  .object({ stages: z.array(stageSchema).min(1).max(20) })
  .refine((d) => new Set(d.stages.map((s) => s.key)).size === d.stages.length, {
    message: 'Asama anahtarlari (key) benzersiz olmali',
    path: ['stages'],
  })
  .refine((d) => !d.stages.some((s) => s.isWon && s.isLost), {
    message: 'Bir asama hem kazanildi hem kaybedildi olamaz',
    path: ['stages'],
  });

export type StageInput = z.infer<typeof stageSchema>;
```

- [ ] **Step 4: Servisi yaz**

`backend/src/modules/pipelines/pipelines.service.ts`:

```ts
import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import type { StageInput } from './pipeline.dto';

@Injectable()
export class PipelinesService {
  constructor(private readonly prisma: PrismaService) {}

  list() {
    return this.prisma.pipeline.findMany({
      include: { stages: { orderBy: { sortOrder: 'asc' } } },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
    });
  }

  async getDefault() {
    const pipeline = await this.prisma.pipeline.findFirst({
      where: { isDefault: true },
      include: { stages: { orderBy: { sortOrder: 'asc' } } },
    });
    if (!pipeline) {
      // Seed calistirilmamis demektir; sessizce bos donmek yerine soyluyoruz.
      throw new NotFoundException({
        code: 'no_default_pipeline',
        message: 'Varsayilan huni bulunamadi. `npm run seed` calistirilmis mi?',
      });
    }
    return pipeline;
  }

  create(dto: { name: string }) {
    // isDefault verilmiyor: varsayilan huni seed ile bir kez kurulur ve
    // sonradan degismez. Iki varsayilan huni olsaydi terfi hangisine
    // yazacagini bilemezdi.
    return this.prisma.pipeline.create({ data: { name: dto.name, isDefault: false } });
  }

  async replaceStages(pipelineId: string, stages: StageInput[]) {
    const pipeline = await this.prisma.pipeline.findUnique({
      where: { id: pipelineId },
      include: { stages: true },
    });
    if (!pipeline) {
      throw new NotFoundException({ code: 'not_found', message: 'Huni bulunamadi' });
    }

    const keepKeys = new Set(stages.map((s) => s.key));
    const removed = pipeline.stages.filter((s) => !keepKeys.has(s.key));

    if (removed.length) {
      const inUse = await this.prisma.lead.count({
        where: { stageId: { in: removed.map((s) => s.id) } },
      });
      if (inUse > 0) {
        // Silinseydi lead sahipsiz kalir ve hunide hicbir sutunda gorunmezdi.
        throw new ConflictException({
          code: 'stage_in_use',
          message: `Silinmek istenen asamalarda ${inUse} adet lead var. Once onlari tasiyin.`,
        });
      }
    }

    return this.prisma.$transaction(async (tx) => {
      if (removed.length) {
        await tx.pipelineStage.deleteMany({ where: { id: { in: removed.map((s) => s.id) } } });
      }
      for (const s of stages) {
        await tx.pipelineStage.upsert({
          where: { pipelineId_key: { pipelineId, key: s.key } },
          update: { name: s.name, sortOrder: s.sortOrder, isWon: s.isWon, isLost: s.isLost, color: s.color ?? null },
          create: { pipelineId, ...s, color: s.color ?? null },
        });
      }
      return tx.pipelineStage.findMany({ where: { pipelineId }, orderBy: { sortOrder: 'asc' } });
    });
  }
}
```

- [ ] **Step 5: Controller ve modulu yaz**

`backend/src/modules/pipelines/pipelines.controller.ts`:

```ts
import { Body, Controller, Get, Param, Post, Put } from '@nestjs/common';
import { PipelinesService } from './pipelines.service';
import { createPipelineSchema, replaceStagesSchema, type StageInput } from './pipeline.dto';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';

@Controller('pipelines')
export class PipelinesController {
  constructor(private readonly pipelines: PipelinesService) {}

  @Get()
  list() {
    return this.pipelines.list();
  }

  @Post()
  create(@Body(new ZodValidationPipe(createPipelineSchema)) dto: { name: string }) {
    return this.pipelines.create(dto);
  }

  @Put(':id/stages')
  replaceStages(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(replaceStagesSchema)) dto: { stages: StageInput[] },
  ) {
    return this.pipelines.replaceStages(id, dto.stages);
  }
}
```

`backend/src/modules/pipelines/pipelines.module.ts`:

```ts
import { Module } from '@nestjs/common';
import { PipelinesController } from './pipelines.controller';
import { PipelinesService } from './pipelines.service';

@Module({
  controllers: [PipelinesController],
  providers: [PipelinesService],
  exports: [PipelinesService],
})
export class PipelinesModule {}
```

`app.module.ts` imports dizisine `PipelinesModule` ekle.

- [ ] **Step 6: Testi calistir, GECTIGINI gor**

Run: `... npx jest --config test/jest-e2e.json pipelines`
Expected: PASS — 5 test

- [ ] **Step 7: Commit**

```bash
cd /home/melih/sitestudyo-sales-os
git add backend/src/modules/pipelines/ backend/src/app.module.ts backend/test/
git commit -m "Faz 2: huni ve asama yonetimi

Lead barindiran asama silinemiyor (409 stage_in_use): silinseydi lead
sahipsiz kalir ve hunide hicbir sutunda gorunmezdi — kaybolmus gibi.

Yeni huniler varsayilan olamaz; iki varsayilan huni olsaydi terfi
hangisine yazacagini bilemezdi."
```

---

## Görev 11: Lead — terfi, aşama taşıma, kapatma

**Files:**
- Create: `backend/src/modules/leads/leads.service.ts`, `leads.controller.ts`, `lead.dto.ts`, `leads.module.ts`
- Modify: `backend/src/app.module.ts`
- Test: `backend/test/leads.e2e-spec.ts`

**Interfaces:**
- Consumes: `PipelinesService.getDefault()`, `ActivityService.record(input, tx)`
- Produces:
  - `LeadsService.promote(dto: PromoteDto, userId: string, tx?: Prisma.TransactionClient)`
  - `LeadsService.list(q)`, `LeadsService.update(id, dto)`
  - `LeadsService.move(id: string, stageId: string, note: string | undefined, userId: string)`
  - `LeadsService.close(id: string, won: boolean, lostReason: string | undefined, userId: string)`

- [ ] **Step 1: Failing test yaz**

`backend/test/leads.e2e-spec.ts` — acilis Gorev 4 ile ayni
(`EMAIL = \`ld-${Date.now()}@test.local\``), `beforeAll` sonunda varsayilan
huniyi al: `defaultPipeline = await prisma.pipeline.findFirst({ where: { isDefault: true }, include: { stages: { orderBy: { sortOrder: 'asc' } } } });`

```ts
  const promote = (body: unknown) =>
    request(app.getHttpServer()).post('/api/v1/leads')
      .set('Authorization', `Bearer ${token}`).send(body);

  it('isletmeyi huniye terfi ettirir ve ilk asamaya koyar', async () => {
    const c = await makeCompany(prisma);
    const res = await promote({ companyId: c.id, title: 'Web sitesi teklifi' }).expect(201);
    expect(res.body.stageId).toBe(defaultPipeline.stages[0].id);
    expect(res.body.stageEnteredAt).toBeTruthy();
  });

  it('terfi ayni islemde SYSTEM aktivitesi yazar', async () => {
    const c = await makeCompany(prisma);
    await promote({ companyId: c.id, title: 'Aktivite testi' }).expect(201);
    const acts = await prisma.activity.findMany({ where: { companyId: c.id, type: 'SYSTEM' } });
    expect(acts.length).toBe(1);
  });

  it('ayni isletmenin ACIK ikinci lead kaydini engeller', async () => {
    const c = await makeCompany(prisma);
    await promote({ companyId: c.id, title: 'Birinci' }).expect(201);
    const res = await promote({ companyId: c.id, title: 'Ikinci' }).expect(409);
    expect(res.body.code).toBe('lead_already_open');
  });

  it('KAPALI lead varken yeni lead acilabilir (tekrar satis)', async () => {
    const c = await makeCompany(prisma);
    const first = await promote({ companyId: c.id, title: 'Ilk is' }).expect(201);
    await request(app.getHttpServer())
      .post(`/api/v1/leads/${first.body.id}/close`)
      .set('Authorization', `Bearer ${token}`).send({ won: true }).expect(200);

    // Bir yil sonra bakim/yenileme satisi: eski gecmis EZILMEDEN yeni kayit
    const second = await promote({ companyId: c.id, title: 'Yenileme' }).expect(201);
    expect(second.body.id).not.toBe(first.body.id);
    expect(await prisma.lead.count({ where: { companyId: c.id } })).toBe(2);
  });

  it('olmayan isletmede 404 doner', async () => {
    const res = await promote({
      companyId: '00000000-0000-4000-8000-000000000000', title: 'Hayalet',
    }).expect(404);
    expect(res.body.code).toBe('not_found');
  });

  it('asama tasir ve STAGE_CHANGE aktivitesi yazar', async () => {
    const c = await makeCompany(prisma);
    const lead = await promote({ companyId: c.id, title: 'Tasima' }).expect(201);
    const target = defaultPipeline.stages[2];

    const res = await request(app.getHttpServer())
      .post(`/api/v1/leads/${lead.body.id}/move`)
      .set('Authorization', `Bearer ${token}`)
      .send({ stageId: target.id }).expect(200);

    expect(res.body.stageId).toBe(target.id);
    const acts = await prisma.activity.findMany({
      where: { leadId: lead.body.id, type: 'STAGE_CHANGE' },
    });
    expect(acts.length).toBe(1);
    expect((acts[0].meta as { to: string }).to).toBe(target.key);
  });

  it('her tasimada stageEnteredAt sifirlanir', async () => {
    const c = await makeCompany(prisma);
    const lead = await promote({ companyId: c.id, title: 'Sure' }).expect(201);
    const before = new Date(lead.body.stageEnteredAt).getTime();
    await new Promise((r) => setTimeout(r, 1100)); // MySQL saniye cozunurlugu

    await request(app.getHttpServer())
      .post(`/api/v1/leads/${lead.body.id}/move`)
      .set('Authorization', `Bearer ${token}`)
      .send({ stageId: defaultPipeline.stages[1].id }).expect(200);

    const after = await prisma.lead.findUnique({ where: { id: lead.body.id } });
    // Bir isin bir asamada NE KADAR bekledigini olcebilmek icin sifirlanmali.
    expect(new Date(after!.stageEnteredAt).getTime()).toBeGreaterThan(before);
  });

  it('baska huninin asamasina tasimayi reddeder', async () => {
    const c = await makeCompany(prisma);
    const lead = await promote({ companyId: c.id, title: 'Yabanci asama' }).expect(201);
    const other = await prisma.pipeline.create({ data: { name: 'Baska Huni' } });
    const otherStage = await prisma.pipelineStage.create({
      data: { pipelineId: other.id, key: 'x', name: 'X', sortOrder: 10 },
    });

    const res = await request(app.getHttpServer())
      .post(`/api/v1/leads/${lead.body.id}/move`)
      .set('Authorization', `Bearer ${token}`)
      .send({ stageId: otherStage.id }).expect(400);
    expect(res.body.code).toBe('stage_not_in_pipeline');
  });

  it('kazanildi olarak kapatir ve closedAt yazar', async () => {
    const c = await makeCompany(prisma);
    const lead = await promote({ companyId: c.id, title: 'Kazanma' }).expect(201);
    const res = await request(app.getHttpServer())
      .post(`/api/v1/leads/${lead.body.id}/close`)
      .set('Authorization', `Bearer ${token}`).send({ won: true }).expect(200);
    expect(res.body.closedAt).toBeTruthy();
    const stage = await prisma.pipelineStage.findUnique({ where: { id: res.body.stageId } });
    expect(stage!.isWon).toBe(true);
  });

  it('kaybedildi kapanisinda gerekce zorunlu', async () => {
    const c = await makeCompany(prisma);
    const lead = await promote({ companyId: c.id, title: 'Kayip' }).expect(201);
    const res = await request(app.getHttpServer())
      .post(`/api/v1/leads/${lead.body.id}/close`)
      .set('Authorization', `Bearer ${token}`).send({ won: false }).expect(400);
    // Gerekce olmadan kaybedilen isler sonradan analiz edilemez.
    expect(res.body.code).toBe('validation_error');
  });

  it('kapali lead tekrar tasinamaz', async () => {
    const c = await makeCompany(prisma);
    const lead = await promote({ companyId: c.id, title: 'Kapali' }).expect(201);
    await request(app.getHttpServer())
      .post(`/api/v1/leads/${lead.body.id}/close`)
      .set('Authorization', `Bearer ${token}`).send({ won: true }).expect(200);

    const res = await request(app.getHttpServer())
      .post(`/api/v1/leads/${lead.body.id}/move`)
      .set('Authorization', `Bearer ${token}`)
      .send({ stageId: defaultPipeline.stages[1].id }).expect(409);
    expect(res.body.code).toBe('lead_closed');
  });

  it('asamaya gore listeler (kanban beslemesi)', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/leads').query({ stageId: defaultPipeline.stages[0].id })
      .set('Authorization', `Bearer ${token}`).expect(200);
    expect(Array.isArray(res.body.items)).toBe(true);
    for (const l of res.body.items) expect(l.stageId).toBe(defaultPipeline.stages[0].id);
  });
```

`afterAll` icine: `await prisma.lead.deleteMany({}); await prisma.pipeline.deleteMany({ where: { isDefault: false } });`

- [ ] **Step 2: Testi calistir, BASARISIZ oldugunu gor**

Run: `... npx jest --config test/jest-e2e.json leads`
Expected: FAIL — 404

- [ ] **Step 3: DTO'yu yaz**

`backend/src/modules/leads/lead.dto.ts`:

```ts
import { z } from 'zod';

export const promoteSchema = z.object({
  companyId: z.string().uuid(),
  pipelineId: z.string().uuid().optional(), // verilmezse varsayilan huni
  title: z.string().trim().min(1).max(255),
  value: z.number().nonnegative().max(99999999).optional(),
  currency: z.string().length(3).default('TRY'),
});

export const updateLeadSchema = z
  .object({
    title: z.string().trim().min(1).max(255).optional(),
    value: z.number().nonnegative().max(99999999).nullable().optional(),
  })
  .strict()
  .refine((d) => Object.keys(d).length > 0, { message: 'Guncellenecek alan yok' });

export const moveSchema = z.object({
  stageId: z.string().uuid(),
  note: z.string().trim().max(1000).optional(),
});

export const closeSchema = z
  .object({
    won: z.boolean(),
    lostReason: z.string().trim().max(500).optional(),
  })
  // Gerekcesiz kaybedilen isler sonradan analiz edilemez: "neden
  // kaybediyoruz" sorusunun cevabi bu alanda birikiyor.
  .refine((d) => d.won || Boolean(d.lostReason), {
    message: 'Kaybedilen is icin gerekce zorunlu',
    path: ['lostReason'],
  });

export const listLeadSchema = z.object({
  stageId: z.string().uuid().optional(),
  companyId: z.string().uuid().optional(),
  status: z.enum(['open', 'closed', 'all']).default('open'),
  limit: z.coerce.number().int().min(1).max(200).default(100),
  offset: z.coerce.number().int().min(0).default(0),
});

export type PromoteDto = z.infer<typeof promoteSchema>;
```

- [ ] **Step 4: Servisi yaz**

`backend/src/modules/leads/leads.service.ts`:

```ts
import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { ActivityType, Prisma } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { ActivityService } from '../crm-shared/activity.service';
import { PipelinesService } from '../pipelines/pipelines.service';
import type { PromoteDto } from './lead.dto';
import type { z } from 'zod';
import type { listLeadSchema } from './lead.dto';

@Injectable()
export class LeadsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activities: ActivityService,
    private readonly pipelines: PipelinesService,
  ) {}

  /**
   * TERFI: havuzdaki bir isletmeyi satis hunisine alir.
   *
   * @param tx Toplu terfide cagiran zaten bir transaction icinde; onu ver.
   */
  async promote(dto: PromoteDto, userId: string, tx?: Prisma.TransactionClient) {
    const run = async (client: Prisma.TransactionClient) => {
      const company = await client.company.findUnique({ where: { id: dto.companyId } });
      if (!company) {
        throw new NotFoundException({ code: 'not_found', message: 'Isletme bulunamadi' });
      }

      // Ayni anda EN FAZLA bir acik lead. Kapali lead varken yenisi acilabilir —
      // tekrar satis (site -> bakim -> yenileme) tam olarak budur.
      const open = await client.lead.findFirst({
        where: { companyId: dto.companyId, closedAt: null },
      });
      if (open) {
        throw new ConflictException({
          code: 'lead_already_open',
          message: 'Bu isletmenin zaten acik bir is kaydi var',
        });
      }

      const pipeline = dto.pipelineId
        ? await client.pipeline.findUnique({
            where: { id: dto.pipelineId },
            include: { stages: { orderBy: { sortOrder: 'asc' } } },
          })
        : await this.pipelines.getDefault();

      if (!pipeline || !pipeline.stages.length) {
        throw new BadRequestException({
          code: 'pipeline_has_no_stages',
          message: 'Secilen huninin hic asamasi yok',
        });
      }

      const lead = await client.lead.create({
        data: {
          companyId: dto.companyId,
          pipelineId: pipeline.id,
          stageId: pipeline.stages[0].id,
          title: dto.title,
          value: dto.value ?? null,
          currency: dto.currency,
          ownerId: userId,
          stageEnteredAt: new Date(),
        },
      });

      // AYNI transaction: lead yazilip aktivite yazilmazsa gecmis eksik kalir
      // ve "bu is huniye ne zaman girdi" sorusunun cevabi kaybolur.
      await this.activities.record(
        {
          type: ActivityType.SYSTEM,
          companyId: dto.companyId,
          leadId: lead.id,
          userId,
          subject: 'Huniye alindi',
          meta: { pipeline: pipeline.name, stage: pipeline.stages[0].key },
        },
        client,
      );

      return lead;
    };

    return tx ? run(tx) : this.prisma.$transaction(run);
  }

  async list(q: z.infer<typeof listLeadSchema>) {
    const where: Prisma.LeadWhereInput = {
      ...(q.stageId ? { stageId: q.stageId } : {}),
      ...(q.companyId ? { companyId: q.companyId } : {}),
      ...(q.status === 'open' ? { closedAt: null } : {}),
      ...(q.status === 'closed' ? { closedAt: { not: null } } : {}),
    };
    const [items, total] = await Promise.all([
      this.prisma.lead.findMany({
        where,
        include: { company: { select: { id: true, name: true, city: true, leadGrade: true } }, stage: true },
        orderBy: { stageEnteredAt: 'desc' },
        take: q.limit,
        skip: q.offset,
      }),
      this.prisma.lead.count({ where }),
    ]);
    return { items, total };
  }

  async update(id: string, dto: { title?: string; value?: number | null }) {
    await this.getOpenOrThrow(id);
    return this.prisma.lead.update({ where: { id }, data: dto });
  }

  async move(id: string, stageId: string, note: string | undefined, userId: string) {
    const lead = await this.getOpenOrThrow(id);

    const stage = await this.prisma.pipelineStage.findUnique({ where: { id: stageId } });
    if (!stage || stage.pipelineId !== lead.pipelineId) {
      // Baska huninin asamasina tasinsa lead kendi hunisinde kaybolur.
      throw new BadRequestException({
        code: 'stage_not_in_pipeline',
        message: 'Secilen asama bu isin hunisine ait degil',
      });
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.lead.update({
        where: { id },
        data: {
          stageId,
          // Her geciste sifirlanir: bir isin bir asamada NE KADAR bekledigini
          // olcebilmek icin. Toplam yasi createdAt veriyor.
          stageEnteredAt: new Date(),
          ...(stage.isWon || stage.isLost ? { closedAt: new Date() } : {}),
        },
      });

      await this.activities.record(
        {
          type: ActivityType.STAGE_CHANGE,
          companyId: lead.companyId,
          leadId: lead.id,
          userId,
          subject: `${lead.stage.name} -> ${stage.name}`,
          body: note ?? null,
          meta: { from: lead.stage.key, to: stage.key },
        },
        tx,
      );

      return updated;
    });
  }

  async close(id: string, won: boolean, lostReason: string | undefined, userId: string) {
    const lead = await this.getOpenOrThrow(id);

    const target = await this.prisma.pipelineStage.findFirst({
      where: { pipelineId: lead.pipelineId, ...(won ? { isWon: true } : { isLost: true }) },
    });
    if (!target) {
      throw new BadRequestException({
        code: 'no_close_stage',
        message: `Bu hunide ${won ? 'kazanildi' : 'kaybedildi'} asamasi tanimli degil`,
      });
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.lead.update({
        where: { id },
        data: {
          stageId: target.id,
          stageEnteredAt: new Date(),
          closedAt: new Date(),
          lostReason: won ? null : (lostReason ?? null),
        },
      });

      await this.activities.record(
        {
          type: ActivityType.STAGE_CHANGE,
          companyId: lead.companyId,
          leadId: lead.id,
          userId,
          subject: won ? 'Kazanildi' : 'Kaybedildi',
          body: lostReason ?? null,
          meta: { from: lead.stage.key, to: target.key, closed: true },
        },
        tx,
      );

      return updated;
    });
  }

  private async getOpenOrThrow(id: string) {
    const lead = await this.prisma.lead.findUnique({ where: { id }, include: { stage: true } });
    if (!lead) throw new NotFoundException({ code: 'not_found', message: 'Is kaydi bulunamadi' });
    if (lead.closedAt) {
      // Kapali bir isi tasimak gecmisi bozar; yeni is icin yeni lead acilir.
      throw new ConflictException({
        code: 'lead_closed',
        message: 'Bu is kapatilmis. Yeni bir is icin isletmeyi tekrar huniye alin.',
      });
    }
    return lead;
  }
}
```

- [ ] **Step 5: Controller ve modulu yaz**

`backend/src/modules/leads/leads.controller.ts`:

```ts
import { Body, Controller, Get, HttpCode, Param, Patch, Post, Query } from '@nestjs/common';
import type { z } from 'zod';
import { LeadsService } from './leads.service';
import {
  promoteSchema, updateLeadSchema, moveSchema, closeSchema, listLeadSchema,
  type PromoteDto,
} from './lead.dto';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { CurrentUser, type AuthUser } from '../../common/decorators/current-user.decorator';

@Controller('leads')
export class LeadsController {
  constructor(private readonly leads: LeadsService) {}

  @Get()
  list(@Query(new ZodValidationPipe(listLeadSchema)) q: z.infer<typeof listLeadSchema>) {
    return this.leads.list(q);
  }

  /** TERFI: havuzdaki isletmeyi satis hunisine alir. */
  @Post()
  promote(
    @Body(new ZodValidationPipe(promoteSchema)) dto: PromoteDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.leads.promote(dto, user.id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateLeadSchema)) dto: { title?: string; value?: number | null },
  ) {
    return this.leads.update(id, dto);
  }

  @Post(':id/move')
  @HttpCode(200)
  move(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(moveSchema)) dto: { stageId: string; note?: string },
    @CurrentUser() user: AuthUser,
  ) {
    return this.leads.move(id, dto.stageId, dto.note, user.id);
  }

  @Post(':id/close')
  @HttpCode(200)
  close(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(closeSchema)) dto: { won: boolean; lostReason?: string },
    @CurrentUser() user: AuthUser,
  ) {
    return this.leads.close(id, dto.won, dto.lostReason, user.id);
  }
}
```

`backend/src/modules/leads/leads.module.ts`:

```ts
import { Module } from '@nestjs/common';
import { LeadsController } from './leads.controller';
import { LeadsService } from './leads.service';
import { PipelinesModule } from '../pipelines/pipelines.module';

@Module({
  imports: [PipelinesModule],
  controllers: [LeadsController],
  providers: [LeadsService],
  exports: [LeadsService],
})
export class LeadsModule {}
```

`app.module.ts` imports dizisine `LeadsModule` ekle (PipelinesModule'dan sonra).

- [ ] **Step 6: Testi calistir, GECTIGINI gor**

Run: `... npx jest --config test/jest-e2e.json leads`
Expected: PASS — 12 test

- [ ] **Step 7: Commit**

```bash
cd /home/melih/sitestudyo-sales-os
git add backend/src/modules/leads/ backend/src/app.module.ts backend/test/
git commit -m "Faz 2: lead terfi, asama tasima ve kapatma

Terfi tek transaction: lead ile SYSTEM aktivitesi birlikte yazilir.
Biri yazilip digeri yazilmasaydi 'bu is huniye ne zaman girdi'
sorusunun cevabi kaybolurdu.

Isletme basina EN FAZLA bir acik lead, ama kapali lead varken yenisi
acilabilir — tekrar satis (site -> bakim -> yenileme) tam olarak bu.

stageEnteredAt her geciste sifirlaniyor: bir isin bir asamada ne kadar
bekledigini olcebilmek icin. Toplam yasi createdAt veriyor.

Kaybedilen iste gerekce zorunlu; 'neden kaybediyoruz' sorusunun cevabi
o alanda birikiyor."
```

---

## Görev 12: Toplu terfi ve kayıtlı aramalar

**Files:**
- Modify: `backend/src/modules/companies/company-bulk.service.ts`
- Modify: `backend/src/modules/companies/companies.module.ts`
- Create: `backend/src/modules/companies/saved-searches.service.ts`, `saved-searches.controller.ts`
- Modify: `backend/test/companies-bulk.e2e-spec.ts`
- Test: `backend/test/saved-searches.e2e-spec.ts`

**Interfaces:**
- Consumes: `LeadsService.promote(dto, userId, tx)`, `companyFilterSchema`
- Produces: `SavedSearchesService.list(userId)`, `.create(userId, dto)`, `.remove(userId, id)`

- [ ] **Step 1: Toplu terfi testini yaz**

`backend/test/companies-bulk.e2e-spec.ts` dosyasina ekle:

```ts
  it('secili isletmeleri topluca huniye alir', async () => {
    const res = await bulk({
      filter: { city: 'Ankara', leadGrade: ['VERY_HOT'] },
      action: 'promote',
    }).expect(200);
    expect(res.body.applied).toBe(res.body.matched);
    const leads = await prisma.lead.count();
    expect(leads).toBe(res.body.applied);
  });

  it('zaten acik lead kaydi olanlari atlar, hata vermez', async () => {
    // Ikinci calistirma: hepsinin zaten acik lead'i var.
    const res = await bulk({
      filter: { city: 'Ankara', leadGrade: ['VERY_HOT'] },
      action: 'promote',
    }).expect(200);
    expect(res.body.applied).toBe(0);
    expect(res.body.skipped).toBe(res.body.matched);
  });

  it('200 sinirini asan terfiyi reddeder ve TEK lead bile acmaz', async () => {
    const before = await prisma.lead.count();
    const res = await bulk({ filter: { city: 'Istanbul' }, action: 'promote' });
    if (res.status === 400) {
      expect(res.body.code).toBe('bulk_limit_exceeded');
      expect(await prisma.lead.count()).toBe(before);
    }
  });
```

> `beforeAll` icinde Istanbul isletmelerinin sayisini 201'e cikar ki
> son test anlamli olsun: `for (let i = 0; i < 201; i++) await makeCompany(prisma, { city: 'Istanbul' });`

- [ ] **Step 2: Testi calistir, BASARISIZ oldugunu gor**

Run: `... npx jest --config test/jest-e2e.json companies-bulk`
Expected: FAIL — `not_implemented`

- [ ] **Step 3: Toplu terfiyi uygula**

`company-bulk.service.ts` icinde `applyBatch`in `promote` dalini degistir ve
yapiciya `LeadsService` ile `userId` tasima ekle:

```ts
// yapici:
constructor(
  private readonly prisma: PrismaService,
  private readonly leads: LeadsService,
) {}

// run() imzasi: run(dto: BulkDto, userId: string)
// applyBatch imzasi: applyBatch(dto: BulkDto, companyIds: string[], userId: string)

      case 'promote': {
        let created = 0;
        // Her isletme KENDI transaction'inda: biri "zaten acik lead var"
        // diye reddedilince digerlerinin de geri alinmasi istenmiyor.
        // Toplu islemde kismi basari mesru bir sonuc — sonuc nesnesi
        // applied/skipped ile neyin olduğunu acikca bildiriyor.
        for (const companyId of companyIds) {
          try {
            await this.leads.promote(
              {
                companyId,
                pipelineId: dto.payload.pipelineId,
                title: 'Toplu terfi',
                currency: 'TRY',
              },
              userId,
            );
            created++;
          } catch (err) {
            // lead_already_open bir hata degil, atlanacak bir durum.
            if (err instanceof ConflictException) continue;
            throw err;
          }
        }
        return created;
      }
```

`run()` icindeki dönüs satirini duzelt:

```ts
    return { matched, applied, skipped: matched - applied };
```

`companies.module.ts` icine `imports: [LeadsModule]` ekle.
`companies.controller.ts` icindeki `runBulk` metoduna `@CurrentUser() user: AuthUser`
parametresi ekleyip `this.bulkService.run(dto, user.id)` cagir.

- [ ] **Step 4: Testi calistir, GECTIGINI gor**

Run: `... npx jest --config test/jest-e2e.json companies-bulk`
Expected: PASS — 12 test

- [ ] **Step 5: Kayitli arama testini yaz**

`backend/test/saved-searches.e2e-spec.ts` — acilis Gorev 4 ile ayni
(`EMAIL = \`ss-${Date.now()}@test.local\``):

```ts
  it('arama kaydeder', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/saved-searches')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Ankara - Sitesi Yok',
              params: { city: 'Ankara', websiteStatus: ['NO_WEBSITE'] } })
      .expect(201);
    expect(res.body.name).toBe('Ankara - Sitesi Yok');
  });

  it('gecersiz filtre parametresini reddeder', async () => {
    // Kaydedilen filtre ileride oldugu gibi calistirilacak; bozuk bir
    // filtreyi simdi kabul etmek, sorunu aylar sonraya ertelemek olur.
    const res = await request(app.getHttpServer())
      .post('/api/v1/saved-searches')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Bozuk', params: { websiteStatus: ['UYDURMA_DURUM'] } })
      .expect(400);
    expect(res.body.code).toBe('validation_error');
  });

  it('ayni isimle ikinci kayit olmaz', async () => {
    const body = { name: 'Tekrar', params: { city: 'Izmir' } };
    await request(app.getHttpServer()).post('/api/v1/saved-searches')
      .set('Authorization', `Bearer ${token}`).send(body).expect(201);
    const res = await request(app.getHttpServer()).post('/api/v1/saved-searches')
      .set('Authorization', `Bearer ${token}`).send(body).expect(409);
    expect(res.body.code).toBe('duplicate');
  });

  it('yalnizca kendi aramalarini listeler ve silebilir', async () => {
    const other = await prisma.user.create({
      data: { email: `other-${Date.now()}@test.local`, name: 'Baskasi',
              passwordHash: 'x' },
    });
    const foreign = await prisma.savedSearch.create({
      data: { userId: other.id, name: 'Baskasinin aramasi', params: {} },
    });

    const list = await request(app.getHttpServer())
      .get('/api/v1/saved-searches')
      .set('Authorization', `Bearer ${token}`).expect(200);
    expect(list.body.find((s: { id: string }) => s.id === foreign.id)).toBeUndefined();

    await request(app.getHttpServer())
      .delete(`/api/v1/saved-searches/${foreign.id}`)
      .set('Authorization', `Bearer ${token}`).expect(404);

    await prisma.savedSearch.deleteMany({ where: { userId: other.id } });
    await prisma.user.delete({ where: { id: other.id } });
  });
```

- [ ] **Step 6: Kayitli arama servisini ve controller'i yaz**

`backend/src/modules/companies/saved-searches.service.ts`:

```ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import type { CompanyFilter } from './company-filter.dto';

@Injectable()
export class SavedSearchesService {
  constructor(private readonly prisma: PrismaService) {}

  list(userId: string) {
    return this.prisma.savedSearch.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  create(userId: string, dto: { name: string; params: CompanyFilter }) {
    // (userId, name) benzersizligi semada -> P2002 -> 409 duplicate
    return this.prisma.savedSearch.create({
      data: { userId, name: dto.name, params: dto.params as Prisma.InputJsonValue },
    });
  }

  async remove(userId: string, id: string): Promise<void> {
    // where'e userId dahil: baskasinin kaydini silmeye calisan 404 alir,
    // "var ama senin degil" bilgisi bile sizmaz.
    const res = await this.prisma.savedSearch.deleteMany({ where: { id, userId } });
    if (res.count === 0) {
      throw new NotFoundException({ code: 'not_found', message: 'Kayitli arama bulunamadi' });
    }
  }
}
```

`backend/src/modules/companies/saved-searches.controller.ts`:

```ts
import { Body, Controller, Delete, Get, HttpCode, Param, Post } from '@nestjs/common';
import { z } from 'zod';
import { SavedSearchesService } from './saved-searches.service';
import { companyFilterSchema, type CompanyFilter } from './company-filter.dto';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { CurrentUser, type AuthUser } from '../../common/decorators/current-user.decorator';

const createSchema = z.object({
  name: z.string().trim().min(1).max(120),
  // Kaydedilen filtre ileride oldugu gibi calistirilacak; bozuk bir filtreyi
  // simdi kabul etmek sorunu aylar sonraya ertelemek olur.
  params: companyFilterSchema,
});

@Controller('saved-searches')
export class SavedSearchesController {
  constructor(private readonly saved: SavedSearchesService) {}

  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.saved.list(user.id);
  }

  @Post()
  create(
    @Body(new ZodValidationPipe(createSchema)) dto: { name: string; params: CompanyFilter },
    @CurrentUser() user: AuthUser,
  ) {
    return this.saved.create(user.id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(@Param('id') id: string, @CurrentUser() user: AuthUser): Promise<void> {
    await this.saved.remove(user.id, id);
  }
}
```

`companies.module.ts`: `controllers` dizisine `SavedSearchesController`,
`providers` dizisine `SavedSearchesService` ekle.

- [ ] **Step 7: Tum test takimini calistir**

```bash
cd backend
npm test
PW=$(grep -oP '(?<=mysql://salesos:)[^@]+' .env)
DATABASE_URL="mysql://salesos:$PW@127.0.0.1:3306/salesos" npm run test:e2e
```
Expected: birim 26+ test PASS, e2e 70+ test PASS (Faz 1'in 16 testi dahil)

- [ ] **Step 8: Commit**

```bash
cd /home/melih/sitestudyo-sales-os
git add backend/src/modules/ backend/test/
git commit -m "Faz 2: toplu terfi ve kayitli aramalar

Toplu terfide her isletme kendi transaction'inda: biri 'zaten acik lead
var' diye atlandiginda digerlerinin geri alinmasi istenmiyor. Kismi
basari mesru bir sonuc ve applied/skipped ile acikca bildiriliyor.

Kayitli aramalarda filtre KAYIT ANINDA dogrulaniyor; bozuk bir filtreyi
kabul etmek sorunu aylar sonra o arama calistirildiginda patlatirdi.

Silme sorgusunda userId de where icinde: baskasinin kaydini silmeye
calisan 404 aliyor, 'var ama senin degil' bilgisi bile sizmiyor."
```

---

## Kapanış: Faz 2 doğrulaması

- [ ] **Adim 1: Tum testler**

```bash
cd backend && npm test
PW=$(grep -oP '(?<=mysql://salesos:)[^@]+' .env)
DATABASE_URL="mysql://salesos:$PW@127.0.0.1:3306/salesos" npm run test:e2e
```

- [ ] **Adim 2: Lint**

```bash
cd backend && npm run lint
```

- [ ] **Adim 3: Mevcut siteler bozulmadi mi**

```bash
sudo docker exec hosting_nginx nginx -t
```
Expected: `syntax is ok` / `test is successful`

- [ ] **Adim 4: Bellek ayak izi**

```bash
free -m
```
Expected: kullanim Faz 1 seviyesinde (yeni konteyner eklenmedi)

- [ ] **Adim 5: Faz ozeti**

Yapilanlari, calistirilan testleri ve acik kalan konulari ozetle. Faz 3'e
gecmeden once kullanicidan onay al.

---

## Öz-Denetim Sonucu

Bu plan yazildiktan sonra spec ile karsilastirildi. Bulunan ve **duzeltilen**
noktalar:

1. **Spec'te `POST /companies/count` vardi ama gorev listesinde yoktu** →
   Gorev 5'e eklendi ve degismez testinin dayanagi yapildi.
2. **`promote` toplu islemi Gorev 7'de `leads` modulu hazir olmadan
   cagriliyordu** → Gorev 7'de acikca `not_implemented` firlatiyor, Gorev 12'de
   dolduruluyor. Sira bagimliligi Interfaces bloklarinda yazili.
3. **Spec `hasEmail=false` durumunu tanimlamiyordu** → `none` semantigi
   secildi ve Gorev 1'de yazildi.
4. **Spec'te olmayan ama gerekli iki koruma eklendi:** bos filtre ile toplu
   islem reddi (`empty_filter_not_allowed`) ve kapali lead'in tasinamamasi
   (`lead_closed`). Ikisi de geri alinmasi zor durumlari engelliyor.
5. **Tip tutarliligi:** `CompanyQuery` metod adlari (`toWhere`, `toOrderBy`,
   `encodeCursor`, `decodeCursor`, `cursorWhere`) Gorev 1, 2, 4, 5, 7 boyunca
   ayni; `BulkResult` alanlari (`matched`, `applied`, `skipped`) Gorev 7 ve
   12'de ayni.
