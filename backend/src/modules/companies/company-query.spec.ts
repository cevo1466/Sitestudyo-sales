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
