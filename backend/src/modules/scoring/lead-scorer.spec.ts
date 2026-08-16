import { LeadGrade, WebsiteStatus } from '@prisma/client';
import { scoreLead, gradeFor, type ScoreInput, type ScoreRule } from './lead-scorer';

/** Seed'deki gercek agirliklar. */
const RULES: ScoreRule[] = [
  { key: 'no_website', label: 'Hic web sitesi yok', weight: 40, enabled: true },
  { key: 'broken_website', label: 'Site bozuk', weight: 35, enabled: true },
  { key: 'social_only', label: 'Sadece sosyal medya', weight: 30, enabled: true },
  { key: 'outdated_weak', label: 'Site eski veya zayif', weight: 25, enabled: true },
  { key: 'not_responsive', label: 'Mobil uyumlu degil', weight: 15, enabled: true },
  { key: 'ssl_problem', label: 'SSL sorunlu', weight: 10, enabled: true },
  { key: 'no_contact_form', label: 'Iletisim formu yok', weight: 10, enabled: true },
  { key: 'high_rating', label: 'Google puani yuksek', weight: 10, enabled: true },
  { key: 'many_reviews', label: 'Yorum sayisi yuksek', weight: 10, enabled: true },
  { key: 'email_found', label: 'E-posta bulundu', weight: 10, enabled: true },
  { key: 'phone_available', label: 'Telefon var', weight: 5, enabled: true },
];

const base: ScoreInput = {
  websiteStatus: WebsiteStatus.UNKNOWN,
  googleRating: null,
  googleReviewsCount: null,
  phoneE164: null,
  hasEmail: false,
  analysis: null,
};

describe('gradeFor', () => {
  it('esik degerlerini dogru uygular', () => {
    expect(gradeFor(100)).toBe(LeadGrade.VERY_HOT);
    expect(gradeFor(90)).toBe(LeadGrade.VERY_HOT);
    expect(gradeFor(89)).toBe(LeadGrade.HOT);
    expect(gradeFor(70)).toBe(LeadGrade.HOT);
    expect(gradeFor(69)).toBe(LeadGrade.WARM);
    expect(gradeFor(50)).toBe(LeadGrade.WARM);
    expect(gradeFor(49)).toBe(LeadGrade.LOW);
    expect(gradeFor(0)).toBe(LeadGrade.LOW);
  });
});

describe('scoreLead — site durumu kovalari', () => {
  it('sitesi yok 40 puan verir', () => {
    const r = scoreLead({ ...base, websiteStatus: WebsiteStatus.NO_WEBSITE }, RULES);
    expect(r.score).toBe(40);
    expect(r.reasons).toEqual([
      { key: 'no_website', label: 'Hic web sitesi yok', points: 40 },
    ]);
  });

  it('kovalar BIRBIRINI DISLAR — iki durum birden sayilmaz', () => {
    // Bozuk site 35 alir; ayrica "sitesi yok" 40'i EKLENMEZ.
    const r = scoreLead({ ...base, websiteStatus: WebsiteStatus.BROKEN }, RULES);
    expect(r.score).toBe(35);
    expect(r.reasons).toHaveLength(1);
  });

  it('sadece sosyal medya 30 puan verir', () => {
    expect(scoreLead({ ...base, websiteStatus: WebsiteStatus.SOCIAL_ONLY }, RULES).score).toBe(30);
  });

  it('OUTDATED ve ACTIVE_WEAK ayni kovaya duser', () => {
    expect(scoreLead({ ...base, websiteStatus: WebsiteStatus.OUTDATED }, RULES).score).toBe(25);
    expect(scoreLead({ ...base, websiteStatus: WebsiteStatus.ACTIVE_WEAK }, RULES).score).toBe(25);
  });

  it('iyi site puan getirmez — dusuk oncelik', () => {
    expect(scoreLead({ ...base, websiteStatus: WebsiteStatus.ACTIVE_GOOD }, RULES).score).toBe(0);
  });

  it('BILINMIYOR puan getirmez — henuz olculmedi', () => {
    // Olculmemis bir seye puan vermek, uydurma bir iddia olurdu.
    expect(scoreLead({ ...base, websiteStatus: WebsiteStatus.UNKNOWN }, RULES).score).toBe(0);
  });
});

describe('scoreLead — isletme canliligi', () => {
  it('yuksek Google puani 10 ekler, esik 4.0', () => {
    expect(scoreLead({ ...base, googleRating: 4.0 }, RULES).score).toBe(10);
    expect(scoreLead({ ...base, googleRating: 3.9 }, RULES).score).toBe(0);
  });

  it('cok yorum 10 ekler, esik 50', () => {
    expect(scoreLead({ ...base, googleReviewsCount: 50 }, RULES).score).toBe(10);
    expect(scoreLead({ ...base, googleReviewsCount: 49 }, RULES).score).toBe(0);
  });

  it('telefon 5, e-posta 10 ekler', () => {
    expect(scoreLead({ ...base, phoneE164: '+905551234567' }, RULES).score).toBe(5);
    expect(scoreLead({ ...base, hasEmail: true }, RULES).score).toBe(10);
  });
});

describe('scoreLead — olculmus site sorunlari', () => {
  const withSite = { ...base, websiteStatus: WebsiteStatus.ACTIVE_WEAK };

  it('analiz yoksa site sorunlarini SAYMAZ', () => {
    // Analiz yapilmadan "mobil uyumlu degil" demek uydurma olurdu.
    expect(scoreLead({ ...withSite, analysis: null }, RULES).score).toBe(25);
  });

  it('olculen sorunlari ekler', () => {
    const r = scoreLead(
      { ...withSite, analysis: { isResponsive: false, sslValid: false, hasContactForm: false } },
      RULES,
    );
    expect(r.score).toBe(25 + 15 + 10 + 10);
  });

  it('olculup SORUN BULUNMADIYSA puan eklemez', () => {
    const r = scoreLead(
      { ...withSite, analysis: { isResponsive: true, sslValid: true, hasContactForm: true } },
      RULES,
    );
    expect(r.score).toBe(25);
  });

  it('olculemeyen alan (null) puan getirmez', () => {
    // null = "bakamadik", false = "baktik, sorun var". Karistirilirsa
    // erisilemeyen her site otomatik ceza alirdi.
    const r = scoreLead(
      { ...withSite, analysis: { isResponsive: null, sslValid: null, hasContactForm: null } },
      RULES,
    );
    expect(r.score).toBe(25);
  });
});

describe('scoreLead — birlesik senaryolar', () => {
  it('gercek senaryo: sitesi yok + iyi puan + cok yorum + telefon', () => {
    // Havuzdaki en degerli profil: para kazanan, ulasilabilir, sitesi yok.
    const r = scoreLead(
      {
        ...base,
        websiteStatus: WebsiteStatus.NO_WEBSITE,
        googleRating: 4.6,
        googleReviewsCount: 210,
        phoneE164: '+905551234567',
      },
      RULES,
    );
    expect(r.score).toBe(65);
    expect(r.grade).toBe(LeadGrade.WARM);
    expect(r.reasons.map((x) => x.key)).toEqual([
      'no_website',
      'high_rating',
      'many_reviews',
      'phone_available',
    ]);
  });

  it('en yuksek profil VERY_HOT olur', () => {
    const r = scoreLead(
      {
        ...base,
        websiteStatus: WebsiteStatus.NO_WEBSITE,
        googleRating: 4.8,
        googleReviewsCount: 500,
        phoneE164: '+905551234567',
        hasEmail: true,
      },
      RULES,
    );
    expect(r.score).toBe(75);
    expect(r.grade).toBe(LeadGrade.HOT);
  });

  it('toplam 100u asamaz', () => {
    // Admin agirliklari yukseltirse toplam 100'u gecebilir ve yuzde
    // olarak gosterilen skor anlamsizlasir.
    const inflated = RULES.map((r) => ({ ...r, weight: r.weight * 3 }));
    const r = scoreLead(
      {
        ...base,
        websiteStatus: WebsiteStatus.NO_WEBSITE,
        googleRating: 5,
        googleReviewsCount: 900,
        phoneE164: '+905551234567',
        hasEmail: true,
      },
      inflated,
    );
    expect(r.score).toBe(100);
  });

  it('kapatilan kural puan getirmez', () => {
    const off = RULES.map((r) => (r.key === 'no_website' ? { ...r, enabled: false } : r));
    const r = scoreLead({ ...base, websiteStatus: WebsiteStatus.NO_WEBSITE }, off);
    expect(r.score).toBe(0);
    expect(r.reasons).toHaveLength(0);
  });

  it('hicbir isaret yoksa 0 ve LOW', () => {
    const r = scoreLead(base, RULES);
    expect(r.score).toBe(0);
    expect(r.grade).toBe(LeadGrade.LOW);
    expect(r.reasons).toHaveLength(0);
  });

  it('her puan bir gerekceyle aciklanir — toplam kirilimla tutar', () => {
    const r = scoreLead(
      {
        ...base,
        websiteStatus: WebsiteStatus.NO_WEBSITE,
        googleRating: 4.5,
        phoneE164: '+905551234567',
      },
      RULES,
    );
    expect(r.reasons.reduce((s, x) => s + x.points, 0)).toBe(r.score);
  });
});
