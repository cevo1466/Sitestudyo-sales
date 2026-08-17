import { WebsiteStatus } from '@prisma/client';
import {
  buildVariables,
  firstName,
  problemOf,
  scoreReasonText,
  sectorSingular,
  TEMPLATE_VARIABLES,
  type AnalysisForMessage,
} from './personalize';

/** Analiz yapildi ama HER SEY yolunda — hicbir sorun kuralini tetiklemez. */
const cleanAnalysis: AnalysisForMessage = {
  isResponsive: true,
  sslValid: true,
  httpsRedirect: true,
  loadMs: 800,
  ttfbMs: 200,
  httpStatus: 200,
  errorCode: null,
  hasTitle: true,
  hasMetaDesc: true,
};

describe('firstName', () => {
  it('jenerik onekleri atlar', () => {
    // "Merhaba Cafe" diye baslayan bir mesaj, adres defterinden
    // kopyalanmis gibi duruyor.
    expect(firstName('Cafe Nero')).toBe('Nero');
    expect(firstName('Restoran Sakal Pub')).toBe('Sakal');
    expect(firstName('Özel Diş Kliniği Ada')).toBe('Diş');
  });

  it('ilk kelime ayirt ediciyse onu kullanir', () => {
    expect(firstName('Sakal Kafe Pub')).toBe('Sakal');
    expect(firstName('Meşhur Kavurmacı')).toBe('Meşhur');
  });

  it('tum kelimeler jenerikse TAM adi doner', () => {
    // Bos string dondurmek "Merhaba ," gibi bir mesaj demek olurdu.
    expect(firstName('Kafe')).toBe('Kafe');
    expect(firstName('Oto Servis')).toBe('Oto Servis');
  });

  it('noktalama ve fazla bosluklari temizler', () => {
    expect(firstName('  "Zeytin"  Restoran ')).toBe('Zeytin');
  });
});

describe('sectorSingular', () => {
  it('sektor kovasini insan diline cevirir', () => {
    // Veritabaninda 'yeme_icme' yaziyor; bu hali mesaja giremez.
    expect(sectorSingular('yeme_icme', 'Kafe')).toBe('restoran ve kafe');
    expect(sectorSingular('otomotiv', null)).toBe('oto servis');
  });

  it('bilinmeyen sektorde Google kategorisine duser', () => {
    expect(sectorSingular('bilinmeyen_kova', 'İrlanda Pub’ı')).toBe('irlanda pub’ı');
    expect(sectorSingular(null, 'Kuaför')).toBe('kuaför');
  });

  it('ikisi de yoksa bos doner', () => {
    expect(sectorSingular(null, null)).toBe('');
  });
});

describe('problemOf', () => {
  it('sitesi olmayani en guclu argumanla anlatir', () => {
    const p = problemOf({ websiteStatus: WebsiteStatus.NO_WEBSITE, analysis: null });
    expect(p?.short).toBe('web siteniz yok');
  });

  it('sadece sosyal medyayi ayirir', () => {
    const p = problemOf({ websiteStatus: WebsiteStatus.SOCIAL_ONLY, analysis: null });
    expect(p?.short).toContain('sosyal medya');
  });

  it('acilmayan siteyi hata koduyla yakalar', () => {
    for (const code of ['DNS_FAIL', 'TIMEOUT', 'BLOCKED', 'EMPTY_PAGE']) {
      const p = problemOf({
        websiteStatus: WebsiteStatus.UNKNOWN,
        analysis: { ...cleanAnalysis, errorCode: code },
      });
      expect(p?.short).toBe('siteniz açılmıyor');
    }
  });

  it('5xx donen siteyi acilmiyor sayar', () => {
    const p = problemOf({
      websiteStatus: WebsiteStatus.ACTIVE_GOOD,
      analysis: { ...cleanAnalysis, httpStatus: 503 },
    });
    expect(p?.short).toBe('siteniz açılmıyor');
  });

  it('sertifika sorununu bildirir', () => {
    const p = problemOf({
      websiteStatus: WebsiteStatus.ACTIVE_WEAK,
      analysis: { ...cleanAnalysis, sslValid: false },
    });
    expect(p?.short).toContain('güvenlik sertifikası');
  });

  it('mobil uyumsuzlugu bildirir', () => {
    const p = problemOf({
      websiteStatus: WebsiteStatus.ACTIVE_GOOD,
      analysis: { ...cleanAnalysis, isResponsive: false },
    });
    expect(p?.short).toContain('telefonda');
  });

  it('yavas siteyi olculen sureyle anlatir', () => {
    const p = problemOf({
      websiteStatus: WebsiteStatus.ACTIVE_GOOD,
      analysis: { ...cleanAnalysis, loadMs: 6200 },
    });
    expect(p?.short).toContain('yavaş');
    // Uydurma sayi yok: sure gercekten olculen degerden geliyor.
    expect(p?.detail).toContain('6,2');
  });

  it('https yonlendirmesi olmayani bildirir', () => {
    const p = problemOf({
      websiteStatus: WebsiteStatus.ACTIVE_GOOD,
      analysis: { ...cleanAnalysis, httpsRedirect: false },
    });
    expect(p?.short).toContain('güvenli bağlantı');
  });

  it('eksik baslik/aciklamayi en son sirada bildirir', () => {
    const p = problemOf({
      websiteStatus: WebsiteStatus.ACTIVE_GOOD,
      analysis: { ...cleanAnalysis, hasMetaDesc: false },
    });
    expect(p?.short).toContain('Google’da doğru görünmüyor');
  });

  it('olcum yoksa eski/zayif site icin genel ifadeyi kullanir', () => {
    for (const s of [WebsiteStatus.OUTDATED, WebsiteStatus.ACTIVE_WEAK]) {
      expect(problemOf({ websiteStatus: s, analysis: null })?.short).toBe('siteniz eskimiş');
    }
  });

  it('ONCELIK: sertifika sorunu mobil uyumsuzluktan once gelir', () => {
    // Ikisi birden varsa TEK sorun soylenecek. Sertifika daha itiraz
    // edilemez bir kanit: musteri kendi tarayicisinda uyariyi goruyor.
    const p = problemOf({
      websiteStatus: WebsiteStatus.ACTIVE_WEAK,
      analysis: { ...cleanAnalysis, sslValid: false, isResponsive: false },
    });
    expect(p?.short).toContain('güvenlik sertifikası');
  });

  it('sorun yoksa null doner — uydurmuyor', () => {
    expect(problemOf({ websiteStatus: WebsiteStatus.ACTIVE_GOOD, analysis: null })).toBeNull();
    expect(problemOf({ websiteStatus: WebsiteStatus.UNKNOWN, analysis: null })).toBeNull();
    expect(
      problemOf({ websiteStatus: WebsiteStatus.ACTIVE_GOOD, analysis: cleanAnalysis }),
    ).toBeNull();
  });
});

describe('scoreReasonText', () => {
  it('en guclu iki sebebi musteri diliyle birlestirir', () => {
    const out = scoreReasonText([
      { key: 'many_reviews', label: 'Yorum sayısı yüksek (≥ 50)', points: 10 },
      { key: 'no_website', label: 'Hiç web sitesi yok', points: 40 },
      { key: 'high_rating', label: 'Google puanı yüksek (≥ 4.0)', points: 10 },
    ]);
    expect(out).toBe('web sitenizin olmaması ve yorum sayınızın yüksek olması');
  });

  it('admin etiketlerini OLDUGU GIBI kullanmaz', () => {
    // "Site bozuk (5xx / zaman asimi)" ifadesi admin ekrani icin yazildi;
    // musteriye gonderilen mesaja girmesi kabul edilemez.
    const out = scoreReasonText([
      { key: 'broken_website', label: 'Site bozuk (5xx / zaman aşımı)', points: 35 },
    ]);
    expect(out).toBe('sitenizin açılmaması');
    expect(out).not.toContain('5xx');
  });

  it('musteri icin anlamsiz kurallari mesaja koymaz', () => {
    // "Telefon numaraniz var" demek rahatsiz edici ve bir sey anlatmiyor.
    const out = scoreReasonText([
      { key: 'phone_available', label: 'Telefon numarası var', points: 5 },
      { key: 'email_found', label: 'Herkese açık e-posta bulundu', points: 10 },
    ]);
    expect(out).toBe('');
  });

  it('sebep yoksa bos doner', () => {
    expect(scoreReasonText([])).toBe('');
  });
});

describe('buildVariables', () => {
  const company = {
    name: 'Sakal Kafe Pub',
    district: 'Kadıköy',
    city: 'İstanbul',
    categoryRaw: 'İrlanda Pub’ı',
    sector: 'yeme_icme',
    websiteStatus: WebsiteStatus.NO_WEBSITE,
    googleRating: 4.64,
    googleReviewsCount: 1312,
    analysis: null,
    scoreReasons: [{ key: 'no_website', label: 'Hiç web sitesi yok', points: 40 }],
  };

  it('katalogdaki her degisken icin bir deger uretir', () => {
    const values = buildVariables(company);
    for (const v of TEMPLATE_VARIABLES) {
      expect(values).toHaveProperty(v.name);
      expect(typeof values[v.name]).toBe('string');
    }
  });

  it('isletmeye ozel degerleri dogru doldurur', () => {
    const values = buildVariables(company);
    expect(values.ilkAd).toBe('Sakal');
    expect(values.sektorTekil).toBe('restoran ve kafe');
    expect(values.sehir).toBe('İstanbul');
    expect(values.ilce).toBe('Kadıköy');
    expect(values.puan).toBe('4.6');
    expect(values.yorum).toBe('1.312');
    expect(values.sorun).toBe('web siteniz yok');
    expect(values.skorGerekce).toBe('web sitenizin olmaması');
  });

  it('verisi olmayan isletmede patlamaz, bos degerler doner', () => {
    const values = buildVariables({
      name: 'İsimsiz Dükkan',
      district: null,
      city: null,
      categoryRaw: null,
      sector: null,
      websiteStatus: WebsiteStatus.UNKNOWN,
      googleRating: null,
      googleReviewsCount: null,
      analysis: null,
      scoreReasons: null,
    });
    expect(values.isim).toBe('İsimsiz Dükkan');
    expect(values.sorun).toBe('');
    expect(values.sorunDetay).toBe('');
    expect(values.skorGerekce).toBe('');
    expect(values.sektorTekil).toBe('');
  });
});
