import { WebsiteStatus } from '@prisma/client';
import { normalizePlace, toE164, buildDedupeKey, classifyWebsite } from './place-normalizer';
import type { RawPlace } from './place-provider.interface';

/** Gercek Apify kaydindan alinmis ornek (dataset ujUIqG2ummmiPuKhr). */
const APIFY_SAMPLE: RawPlace = {
  placeId: 'ChIJQSvlgV24yhQRAe3ATY-zkeY',
  name: 'Rota Tasimacilik ve Lojistik Hizmetleri Tic. Ltd. Sirketi',
  categoryName: 'Depo',
  categories: ['Depo', 'Lojistik Firması'],
  address: 'Rıhtım Cad. & Neşet Ömer Sk Esen Apt 19/5, 34710 Kadıköy/İstanbul, Türkiye',
  street: 'Rıhtım Cad. & Neşet Ömer Sk Esen Apt 19/5',
  city: 'Kadıköy', // DIKKAT: bu ILCE
  state: 'İstanbul', // bu IL
  neighborhood: 'Caferağa',
  postalCode: '34710',
  countryCode: 'TR',
  lat: 40.9892282,
  lng: 29.0223446,
  phone: '+90 216 418 10 76',
  phoneUnformatted: '+902164181076',
  totalScore: 3.5,
  reviewsCount: 10,
  url: 'https://www.google.com/maps/search/?api=1&query=Rota',
  permanentlyClosed: false,
  temporarilyClosed: false,
  raw: {},
};

describe('toE164', () => {
  it('bosluklu numarayi sadelestirir', () => {
    expect(toE164('+90 216 418 10 76')).toBe('+902164181076');
  });

  it('parantez ve tireleri temizler', () => {
    expect(toE164('+90 (216) 418-10-76')).toBe('+902164181076');
  });

  it('basinda 0 olan yerel numaraya ulke kodu ekler', () => {
    expect(toE164('0216 418 10 76', 'TR')).toBe('+902164181076');
  });

  it('ulke kodsuz 10 haneli numaraya +90 ekler', () => {
    expect(toE164('5551234567', 'TR')).toBe('+905551234567');
  });

  it('cok kisa veya cok uzun numarayi reddeder', () => {
    // Bozuk numarayi kaydetmek, mukerrer anahtarini da bozar.
    expect(toE164('123')).toBeNull();
    expect(toE164('12345678901234567890')).toBeNull();
  });

  it('bos degerde null doner', () => {
    expect(toE164(null)).toBeNull();
    expect(toE164(undefined)).toBeNull();
    expect(toE164('   ')).toBeNull();
  });
});

describe('classifyWebsite', () => {
  it('saglayici alani HIC dondurmediyse ve filtre kapaliysa BILINMIYOR der', () => {
    // En kritik kural: "alan yok" ile "sitesi yok" ayni sey degil.
    expect(classifyWebsite(undefined, false)).toEqual({
      status: WebsiteStatus.UNKNOWN,
      url: null,
    });
  });

  it('saglayici alani dondurmediyse AMA filtre aciksa SITESI YOK der', () => {
    // withoutWebsite filtresiyle calisan bir tarama zaten yalnizca sitesi
    // gorunmeyen isletmeleri dondurur; alanin olmamasi beklenen durumdur.
    expect(classifyWebsite(undefined, true)).toEqual({
      status: WebsiteStatus.NO_WEBSITE,
      url: null,
    });
  });

  it('acikca null geldiyse filtreden bagimsiz SITESI YOK der', () => {
    expect(classifyWebsite(null, false)).toEqual({
      status: WebsiteStatus.NO_WEBSITE,
      url: null,
    });
  });

  it('sosyal medya adresini SOSYAL olarak isaretler', () => {
    for (const url of [
      'https://www.instagram.com/kuafor',
      'https://facebook.com/kuafor',
      'https://linktr.ee/kuafor',
      'https://www.tiktok.com/@kuafor',
    ]) {
      expect(classifyWebsite(url, false).status).toBe(WebsiteStatus.SOCIAL_ONLY);
    }
  });

  it('gercek siteyi henuz siniflandirmaz, analiz bekliyor der', () => {
    // Site kalitesi ancak Faz 4 analizoru olctugunde bilinir; simdi
    // ACTIVE_GOOD demek olculmemis bir iddia olurdu.
    expect(classifyWebsite('https://ornekkuafor.com', false)).toEqual({
      status: WebsiteStatus.UNKNOWN,
      url: 'https://ornekkuafor.com',
    });
  });

  it('sema eksik adrese https ekler', () => {
    expect(classifyWebsite('ornekkuafor.com', false).url).toBe('https://ornekkuafor.com');
  });

  it('bozuk adresi null sayar ve BILINMIYOR der', () => {
    expect(classifyWebsite('bu bir adres degil !!', false)).toEqual({
      status: WebsiteStatus.UNKNOWN,
      url: null,
    });
  });
});

describe('buildDedupeKey', () => {
  it('ad ve telefondan kararli bir anahtar uretir', () => {
    const a = buildDedupeKey('ornek kuafor', '+905551234567');
    const b = buildDedupeKey('ornek kuafor', '+905551234567');
    expect(a).toBe(b);
    expect(a).toHaveLength(64);
  });

  it('telefon yoksa null doner', () => {
    // MySQL NULL'lari benzersiz saymaz; telefonsuz kayitlar birbirini
    // engellemesin diye kasten null birakiyoruz.
    expect(buildDedupeKey('ornek kuafor', null)).toBeNull();
  });

  it('farkli isletmeler icin farkli anahtar uretir', () => {
    expect(buildDedupeKey('a kuafor', '+905551234567')).not.toBe(
      buildDedupeKey('b kuafor', '+905551234567'),
    );
  });
});

describe('normalizePlace', () => {
  // Anahtarlar kucuk harfli: import.service sectorMap'i boyle yukluyor
  // (MySQL harf duyarsiz, JS Map duyarli — bkz. loadSectorMap).
  const sectorMap = new Map([
    ['depo', 'lojistik'],
    ['kuaför', 'guzellik'],
  ]);

  it('TURKIYE ADRES TUZAGI: state -> il, city -> ilce', () => {
    // Apify Turkiye'de city alanina ILCE yaziyor. Duz eslersek
    // ?city=Istanbul filtresi HIC kayit dondurmez.
    const c = normalizePlace(APIFY_SAMPLE, { sectorMap, onlyWithoutWebsite: true });
    expect(c.city).toBe('İstanbul');
    expect(c.district).toBe('Kadıköy');
    expect(c.neighborhood).toBe('Caferağa');
  });

  it('Turkiye disinda state ili degil eyaleti gosterir, city korunur', () => {
    const us = { ...APIFY_SAMPLE, countryCode: 'US', city: 'Brooklyn', state: 'New York' };
    const c = normalizePlace(us, { sectorMap, onlyWithoutWebsite: false });
    expect(c.city).toBe('Brooklyn');
    expect(c.district).toBeNull();
  });

  it('telefonu E.164 bicimine cevirir', () => {
    const c = normalizePlace(APIFY_SAMPLE, { sectorMap, onlyWithoutWebsite: true });
    expect(c.phoneE164).toBe('+902164181076');
    expect(c.phone).toBe('+90 216 418 10 76'); // gosterim bicimi korunur
  });

  it('kategoriyi ust seviye sektore esler', () => {
    const c = normalizePlace(APIFY_SAMPLE, { sectorMap, onlyWithoutWebsite: true });
    expect(c.sector).toBe('lojistik');
    expect(c.categoryRaw).toBe('Depo');
  });

  it('kategori eslemesini buyuk/kucuk harften bagimsiz bulur', () => {
    // MySQL harf duyarsiz kaydeder; kod duyarli ararsa kategori sessizce
    // eslenmemis gorunur ve sektor filtresi o kayitlari kacirir.
    const p = { ...APIFY_SAMPLE, categoryName: 'DEPO' };
    expect(normalizePlace(p, { sectorMap, onlyWithoutWebsite: true }).sector).toBe('lojistik');
  });

  it('eslenmemis kategoride sektoru bos birakir, kategoriyi saklar', () => {
    // Uydurma bir sektor atamak, filtreyi sessizce yanlis yapardi.
    const p = { ...APIFY_SAMPLE, categoryName: 'Tanimsiz Kategori' };
    const c = normalizePlace(p, { sectorMap, onlyWithoutWebsite: true });
    expect(c.sector).toBeNull();
    expect(c.categoryRaw).toBe('Tanimsiz Kategori');
  });

  it('withoutWebsite taramasinda SITESI YOK isaretler', () => {
    const c = normalizePlace(APIFY_SAMPLE, { sectorMap, onlyWithoutWebsite: true });
    expect(c.websiteStatus).toBe(WebsiteStatus.NO_WEBSITE);
    expect(c.websiteUrl).toBeNull();
  });

  it('filtresiz taramada site alani yoksa BILINMIYOR birakir', () => {
    const c = normalizePlace(APIFY_SAMPLE, { sectorMap, onlyWithoutWebsite: false });
    expect(c.websiteStatus).toBe(WebsiteStatus.UNKNOWN);
  });

  it('site adresinden alan adini cikarir', () => {
    const p = { ...APIFY_SAMPLE, website: 'https://www.ornekkuafor.com/iletisim' };
    const c = normalizePlace(p, { sectorMap, onlyWithoutWebsite: false });
    expect(c.websiteDomain).toBe('ornekkuafor.com'); // www atilir
  });

  it('kalici kapali isletmeyi isaretler', () => {
    const p = { ...APIFY_SAMPLE, permanentlyClosed: true };
    const c = normalizePlace(p, { sectorMap, onlyWithoutWebsite: true });
    expect(c.businessStatus).toBe('PERMANENTLY_CLOSED');
  });

  it('Google puani ve yorum sayisini tasir', () => {
    const c = normalizePlace(APIFY_SAMPLE, { sectorMap, onlyWithoutWebsite: true });
    expect(c.googleRating).toBe(3.5);
    expect(c.googleReviewsCount).toBe(10);
  });

  it('ad normalizasyonunu Turkce yerelle yapar', () => {
    const p = { ...APIFY_SAMPLE, name: 'ISTANBUL Kuafor' };
    const c = normalizePlace(p, { sectorMap, onlyWithoutWebsite: true });
    // 'I'.toLowerCase() Turkce yerelde 'ı' verir; yerel verilmezse ayni
    // isletme iki farkli mukerrer anahtari uretir.
    expect(c.nameNormalized).toBe('ıstanbul kuafor');
  });

  it('ham kaydi saklar', () => {
    const c = normalizePlace(APIFY_SAMPLE, { sectorMap, onlyWithoutWebsite: true });
    expect(c.raw).toBeDefined();
  });
});
