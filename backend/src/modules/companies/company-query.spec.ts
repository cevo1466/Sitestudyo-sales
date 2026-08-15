import { WebsiteStatus, LeadGrade } from '@prisma/client';
import { companyFilterSchema, listQuerySchema } from './company-filter.dto';
import { CompanyQuery, InvalidCursorError } from './company-query';

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

  it('websiteStatus dizisini IN olarak cevirir', () => {
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

  it('hasEmail=false hic e-postali kisisi olmayanlari secer', () => {
    const w = CompanyQuery.toWhere(parse({ hasEmail: 'false' }));
    expect(w.contacts).toEqual({ none: { email: { not: null } } });
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
    expect(() => parse({ minScore: 90, maxScore: 10 })).toThrow();
  });
});

// ─────────────────────────────────────────────── Gorev 2: siralama ve imlec

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
    expect(() => listQuerySchema.parse({ sort: 'passwordHash:desc' })).toThrow();
  });

  it('NULL olabilen alanda asc siralamayi reddeder', () => {
    // MySQL asc'de NULL'lari basa, desc'te sona koyar. Keyset sayfalama
    // NULL bolgesinde asc'de dogru ilerlemiyor; desteklenmeyen bir bicimi
    // sessizce yanlis sonuc vermektense reddediyoruz.
    expect(() => listQuerySchema.parse({ sort: 'googleRating:asc' })).toThrow();
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
  const row = { id: 'abc-123', leadScore: 87 };

  it('kodlanan imlec cozuldugunde ayni degerleri verir', () => {
    const c = CompanyQuery.encodeCursor(row, sort, 4820);
    expect(CompanyQuery.decodeCursor(c, sort)).toEqual({ s: 87, i: 'abc-123', t: 4820 });
  });

  it('bozuk imleci reddeder', () => {
    expect(() => CompanyQuery.decodeCursor('bu-base64-degil!!', sort)).toThrow(InvalidCursorError);
    expect(() => CompanyQuery.decodeCursor(Buffer.from('{}').toString('base64url'), sort)).toThrow(
      InvalidCursorError,
    );
  });

  it('BASKA siralamaya ait imleci reddeder', () => {
    // Istemci siralamayi degistirip eski imleci gonderirse sonuc anlamsiz
    // olur; sessizce karisik veri dondurmektense hata veriyoruz.
    const c = CompanyQuery.encodeCursor(row, sort, 10);
    expect(() => CompanyQuery.decodeCursor(c, { field: 'name', dir: 'asc' })).toThrow(
      InvalidCursorError,
    );
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
