import { WebsiteStatus } from '@prisma/client';
import {
  buildMessages,
  classifyPhone,
  recommendedTemplateKey,
  renderTemplate,
  whatsappUrl,
  type CompanyForMessage,
  type MessageTemplate,
} from './message-builder';

const base: CompanyForMessage = {
  name: 'Meşhur Kavurmacı',
  district: 'Altındağ',
  city: 'Ankara',
  categoryRaw: 'Et Lokantası',
  phoneE164: '+905365058555',
  websiteStatus: WebsiteStatus.NO_WEBSITE,
  googleRating: 4.1,
  googleReviewsCount: 7626,
};

const TEMPLATES: MessageTemplate[] = [
  {
    key: 'sosyal_kanit',
    label: 'Sosyal kanıt',
    body: 'Merhaba, {{isim}} yetkilisiyle görüşebilir miyim? Google\'da {{yorum}} yorum ve {{puan}} puanınız var — {{ilce}}\'de bu ciddi bir başarı.',
  },
  {
    key: 'sade',
    label: 'Sade',
    body: 'Merhaba, {{isim}} için yazıyorum. {{ilce}}\'de {{kategori}} işletmelerine web sitesi yapıyoruz.',
  },
  {
    key: 'site_sorunlu',
    label: 'Site sorunlu',
    body: 'Merhaba, {{isim}} web sitesinde teknik sorunlar tespit ettik.',
  },
];

describe('classifyPhone', () => {
  it('Turkiye cep hattini mobil sayar', () => {
    expect(classifyPhone('+905365058555')).toBe('mobile');
    expect(classifyPhone('+905551234567')).toBe('mobile');
  });

  it('Turkiye sabit hattini landline sayar', () => {
    // Havuzun ucte biri sabit hat; uyarmadan WhatsApp onermek
    // kullaniciyi 661 kez bosa ugrastirirdi.
    expect(classifyPhone('+902122383838')).toBe('landline');
    expect(classifyPhone('+903123658365')).toBe('landline');
    expect(classifyPhone('+902164181076')).toBe('landline');
  });

  it('telefon yoksa none doner', () => {
    expect(classifyPhone(null)).toBe('none');
    expect(classifyPhone('')).toBe('none');
  });

  it('yabanci numarada tur tahmini yapmaz, denemeye birakir', () => {
    expect(classifyPhone('+491701234567')).toBe('mobile');
  });
});

describe('whatsappUrl', () => {
  it('numarayi sadelestirip mesaji kodlar', () => {
    const url = whatsappUrl('+90 536 505 85 55', 'Merhaba, nasılsınız?');
    expect(url).toContain('https://wa.me/905365058555?text=');
    expect(url).toContain(encodeURIComponent('Merhaba, nasılsınız?'));
  });

  it('Turkce karakterleri dogru kodlar', () => {
    const url = whatsappUrl('+905551112233', 'Görüşmek isteriz');
    // Ham Turkce karakter URL'de kalirsa WhatsApp mesaji bozuk aciyor.
    expect(url).not.toContain('ö');
    expect(decodeURIComponent(url.split('text=')[1])).toBe('Görüşmek isteriz');
  });
});

describe('renderTemplate', () => {
  it('degiskenleri doldurur', () => {
    const out = renderTemplate('{{isim}} · {{yorum}} yorum · {{puan}} · {{ilce}}', base);
    expect(out).toBe('Meşhur Kavurmacı · 7.626 yorum · 4.1 · Altındağ');
  });

  it('kategoriyi kucuk harfe cevirir (cumle icinde dogru okunsun)', () => {
    expect(renderTemplate('{{kategori}} işletmesi', base)).toBe('et lokantası işletmesi');
  });

  it('ilce yoksa sehre duser', () => {
    const c = { ...base, district: null };
    expect(renderTemplate('{{ilce}}', c)).toBe('Ankara');
  });

  it('bos degisken yuzunden olusan cift bosluk ve sarkan noktalama temizlenir', () => {
    // Aksi halde musteriye "Merhaba , yetkilisi" gibi bir mesaj gider.
    const c = { ...base, googleReviewsCount: null, district: null, city: null };
    expect(renderTemplate('Merhaba {{ilce}}, {{yorum}} yorumunuz var', c)).toBe(
      'Merhaba, yorumunuz var',
    );
  });

  it('tanimsiz degiskeni bos birakir, ham etiketi birakmaz', () => {
    // "{{sirket}}" diye ham etiket musteriye gitmemeli.
    expect(renderTemplate('{{sirket}} merhaba', base)).toBe('merhaba');
  });

  it('puani tek ondalikla yazar', () => {
    expect(renderTemplate('{{puan}}', { ...base, googleRating: 4 })).toBe('4.0');
  });
});

describe('recommendedTemplateKey', () => {
  it('sitesi yok + cok yorum + yuksek puan -> sosyal kanit', () => {
    expect(recommendedTemplateKey(base)).toBe('sosyal_kanit');
  });

  it('yorum azsa sosyal kanit ONERMEZ', () => {
    // 12 yorumu olan isletmeye "yorumlariniz harika" demek
    // inandiriciligi bitirir.
    expect(recommendedTemplateKey({ ...base, googleReviewsCount: 12 })).toBe('sade');
  });

  it('puan dusukse sosyal kanit onermez', () => {
    expect(recommendedTemplateKey({ ...base, googleRating: 3.4 })).toBe('sade');
  });

  it('puan/yorum hic yoksa sade oner', () => {
    expect(
      recommendedTemplateKey({ ...base, googleRating: null, googleReviewsCount: null }),
    ).toBe('sade');
  });

  it('site bozuk veya eskiyse site_sorunlu oner', () => {
    for (const s of [WebsiteStatus.BROKEN, WebsiteStatus.OUTDATED, WebsiteStatus.ACTIVE_WEAK]) {
      expect(recommendedTemplateKey({ ...base, websiteStatus: s })).toBe('site_sorunlu');
    }
  });

  it('sitesi iyiyse sosyal kanit degil sade oner', () => {
    expect(
      recommendedTemplateKey({ ...base, websiteStatus: WebsiteStatus.ACTIVE_GOOD }),
    ).toBe('sade');
  });
});

describe('buildMessages', () => {
  it('tum sablonlari doldurur ve BIR tanesini onerir', () => {
    const out = buildMessages(base, TEMPLATES);
    expect(out).toHaveLength(3);
    expect(out.filter((m) => m.recommended)).toHaveLength(1);
    expect(out.find((m) => m.recommended)!.key).toBe('sosyal_kanit');
  });

  it('uretilen metinde ham degisken etiketi KALMAZ', () => {
    // Musteriye "{{isim}}" gitmesi en utandirici hata olurdu.
    for (const m of buildMessages(base, TEMPLATES)) {
      expect(m.text).not.toMatch(/\{\{|\}\}/);
      expect(m.text.length).toBeGreaterThan(10);
    }
  });

  it('verisi eksik isletmede de calisir', () => {
    const bos: CompanyForMessage = {
      name: 'İsimsiz Dükkan',
      district: null,
      city: null,
      categoryRaw: null,
      phoneE164: null,
      websiteStatus: WebsiteStatus.UNKNOWN,
      googleRating: null,
      googleReviewsCount: null,
    };
    for (const m of buildMessages(bos, TEMPLATES)) {
      expect(m.text).not.toMatch(/\{\{|\}\}/);
      expect(m.text).toContain('İsimsiz Dükkan');
    }
  });
});

describe('onerilen sablon her zaman bir tanesine duser', () => {
  // Bu testin korudugu sey: recommendedTemplateKey SABIT anahtarlar
  // donduruyor ('sosyal_kanit' / 'site_sorunlu' / 'sade'). Kullanici artik
  // Ayarlar ekranindan kendi sablonlarini ekleyip bunlari silebiliyor.
  // Yedek olmasaydi o an "onerilen" ipucu sessizce kaybolur, kimse de
  // sebebini anlamazdi.
  const kendi: MessageTemplate[] = [
    { key: 'benim_sablonum', label: 'Benim şablonum', body: 'Merhaba {{isim}}' },
    { key: 'ikinci', label: 'İkinci', body: 'Selam {{isim}}' },
  ];

  it('sabit anahtarlarin hicbiri listede yoksa ilk sablonu onerir', () => {
    const out = buildMessages(base, kendi);
    expect(out.filter((m) => m.recommended)).toHaveLength(1);
    expect(out[0].recommended).toBe(true);
  });

  it('sabit anahtar listede varsa onu secer', () => {
    const karisik: MessageTemplate[] = [
      { key: 'benim_sablonum', label: 'Benim şablonum', body: 'Merhaba' },
      { key: recommendedTemplateKey(base), label: 'Uygun', body: '{{yorum}} yorum' },
    ];
    const out = buildMessages(base, karisik);
    expect(out.find((m) => m.recommended)?.key).toBe(recommendedTemplateKey(base));
  });

  it('bos listede patlamaz', () => {
    expect(buildMessages(base, [])).toEqual([]);
  });
});
