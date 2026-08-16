/**
 * Baslangic verisi. Tekrar tekrar calistirilabilir (idempotent) —
 * her deploy sonrasi guvenle kosulabilsin diye upsert kullaniyoruz.
 *
 *   npm run seed
 *   SEED_ADMIN_EMAIL=... SEED_ADMIN_PASSWORD=... npm run seed
 */
import { PrismaClient, UserRole } from '@prisma/client';
import * as argon2 from 'argon2';
import { randomBytes } from 'node:crypto';

const prisma = new PrismaClient();

/**
 * Lead puanlama agirliklari (Faz 0 §2.3).
 * Bunlar KOD icinde sabit degil, veritabaninda — admin ekranindan
 * degistirilebilmeleri sart. Puanlama motoru her hesaplamada buradan okur.
 */
const SCORE_RULES = [
  { key: 'no_website', label: 'Hiç web sitesi yok', weight: 40, sortOrder: 10 },
  { key: 'broken_website', label: 'Site bozuk (5xx / zaman aşımı)', weight: 35, sortOrder: 20 },
  { key: 'social_only', label: 'Sadece sosyal medya hesabı var', weight: 30, sortOrder: 30 },
  { key: 'outdated_weak', label: 'Site eski veya zayıf', weight: 25, sortOrder: 40 },
  { key: 'not_responsive', label: 'Mobil uyumlu değil', weight: 15, sortOrder: 50 },
  { key: 'ssl_problem', label: 'SSL sertifikası sorunlu', weight: 10, sortOrder: 60 },
  { key: 'no_contact_form', label: 'İletişim formu yok', weight: 10, sortOrder: 70 },
  { key: 'high_rating', label: 'Google puanı yüksek (≥ 4.0)', weight: 10, sortOrder: 80 },
  { key: 'many_reviews', label: 'Yorum sayısı yüksek (≥ 50)', weight: 10, sortOrder: 90 },
  { key: 'email_found', label: 'Herkese açık e-posta bulundu', weight: 10, sortOrder: 100 },
  { key: 'phone_available', label: 'Telefon numarası var', weight: 5, sortOrder: 110 },
];

// Asama ve kural adlari EKRANDA GORUNUYOR — kaynak dosyalarda Turkce
// karakter kullanmama kurali kullaniciya donen metinleri kapsamiyor.
// ASCII yazilmislardi ve panoda "ILETISIME GECILDI" diye cikiyordu.
const STAGES = [
  { key: 'lead', name: 'Aday', sortOrder: 10, color: '#6B7280' },
  { key: 'contacted', name: 'İletişime Geçildi', sortOrder: 20, color: '#3B82F6' },
  { key: 'meeting', name: 'Görüşme Ayarlandı', sortOrder: 30, color: '#8B5CF6' },
  { key: 'proposal', name: 'Teklif Gönderildi', sortOrder: 40, color: '#F59E0B' },
  { key: 'won', name: 'Kazanıldı', sortOrder: 50, color: '#10B981', isWon: true },
  { key: 'lost', name: 'Kaybedildi', sortOrder: 60, color: '#EF4444', isLost: true },
];

/**
 * Apify'dan gelen ham Google kategorileri -> ust seviye sektor.
 * Elimizdeki 384 kayittaki gercek kategorilerden turetildi; liste
 * calisma zamaninda kesif sirasinda genisler.
 */
const SECTORS: Record<string, string[]> = {
  guzellik: [
    'Kuaför', 'Berber Dükkanı', 'Güzellik Salonu', 'Erkek kuaförü',
    'Kadın kuaförü', 'Tırnak salonu', 'Cilt bakım kliniği', 'Spa',
    'Epilasyon Hizmeti', 'Epilasyon Hizmetleri', 'Lazer Epilasyon Hizmeti',
    'Manikür/Pedikür Salonu', 'Sağlık ve Güzellik Merkezi', 'Kozmetik mağazası',
  ],
  yeme_icme: [
    'Restoran', 'Kafe', 'Kahve dükkanı', 'Balık Restoranı', 'Kahvaltı restoranı',
    'Meyhane', 'Türk restoranı', 'Pastane', 'Fırın', 'Bar', 'Pizza restoranı',
    // 24 Haz 2026 Istanbul taramasindan gelen gercek kategoriler
    'Aile restoranı', 'Büfe', 'Çiğ Köfteci', 'Deniz mahsülleri restoranı',
    'Dondurma dükkanı', 'Dönerci', 'Dürüm Restoranı', 'Et Lokantası',
    'Fast food lokantası', 'Hamburger restoranı', 'İrlanda pub\'ı', 'Izgara',
    'Kebap Restoranı', 'Köfteci', 'Mangal', 'Pideci', 'Pilav Restoranı',
    'Sağlıklı Yemek Restoranı', 'Tatlı Dükkanı', 'Tatlıcı', 'Tostçu',
  ],
  spor_saglik: [
    'Pilates Salonu', 'Spor salonu', 'Yoga stüdyosu', 'Fizik tedavi merkezi',
    'Diş kliniği', 'Klinik', 'Veteriner', 'Eczane',
  ],
  lojistik: ['Depo', 'Lojistik Firması', 'Kargo Şirketi', 'Nakliyat şirketi', 'Nakliyat Şirketi', 'Ulaşım Hizmeti'],
  profesyonel_hizmet: [
    'Mimarlık ofisi', 'Avukat', 'Hukuk bürosu', 'Muhasebeci',
    'Emlakçı', 'Sigorta acentesi', 'Danışmanlık',
    'Mimar', 'Mimari Tasarımcı', 'Mühendis', 'İnşaat Şirketi',
  ],
  perakende: [
    'Mağaza', 'Butik', 'Market', 'Kuyumcu', 'Optik', 'Mobilyacı', 'Bakkal',
    'Evcil Hayvan Malzemeleri Mağazası', 'Aydınlatma Mağazası',
    'Berber Malzemeleri Satıcısı', 'Terzi', 'Motosiklet Mağazası',
    'Otomobil Yedek Parça Mağazası',
  ],
  egitim: [
    'Kurs', 'Dershane', 'Anaokulu', 'Sürücü kursu', 'Dil okulu',
    'Topluluk merkezi', 'Okul Öncesi', 'Kreş', 'Montessori Okulu',
    'İlköğretim Okulu',
  ],

  // --- 16 Agu 2026 Istanbul/Ankara taramalarindan turetilen yeni sektorler ---
  // Uc kume kendi basina anlamli bir hacme ulasti (emlak 95, otomotiv 88,
  // temizlik 94) ve satis acisindan birbirinden farkli davraniyorlar;
  // profesyonel_hizmet altina tikmak filtreyi kullanilamaz hale getirirdi.
  emlak: [
    'Emlak Bürosu', 'Emlak Kiralama Ofisi', 'Gayrimenkul Danışmanı',
    'Emlak Danışmanı', 'Apartman', 'İş Merkezi',
  ],
  otomotiv: [
    'Oto Tamirhanesi', 'Araç Bakım ve Onarımı', 'Oto Lastik Dükkanı',
    'Araba Yıkama', 'Self Servis Oto Yıkama', 'Motosiklet Tamir Dükkanı',
    'Oto Elektrik Hizmeti', 'Araç Akü Mağazası', 'Oto Tamir Atölyesi',
    'Oto Kaporta Dükkanı', 'Oto Galeri',
  ],
  temizlik: [
    'Kuru Temizlemeci', 'Çamaşır Yıkama Hizmeti', 'Çamaşırhane',
    'Temizlik Hizmetleri',
  ],
};

async function main(): Promise<void> {
  // ---------------------------------------------------------- Admin
  const email = (process.env.SEED_ADMIN_EMAIL ?? 'admin@sitestudyo.com').toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    console.log(`✓ Admin zaten var: ${email} (sifre degistirilmedi)`);
  } else {
    // Sifre verilmediyse rastgele uret ve BIR KEZ ekrana bas.
    // Varsayilan bir sifre gommek, kimsenin degistirmedigi bir arka kapi olur.
    const generated = process.env.SEED_ADMIN_PASSWORD ?? randomBytes(12).toString('base64url');
    await prisma.user.create({
      data: {
        email,
        name: process.env.SEED_ADMIN_NAME ?? 'Melih',
        role: UserRole.ADMIN,
        passwordHash: await argon2.hash(generated, {
          type: argon2.argon2id,
          memoryCost: 19456,
          timeCost: 2,
          parallelism: 1,
        }),
      },
    });
    console.log('\n╔══════════════════════════════════════════════════════════╗');
    console.log('║  ADMIN HESABI OLUSTURULDU — bu sifre bir daha gosterilmez ║');
    console.log('╚══════════════════════════════════════════════════════════╝');
    console.log(`   E-posta : ${email}`);
    console.log(`   Sifre   : ${generated}\n`);
  }

  // ------------------------------------------------- Puanlama kurallari
  for (const rule of SCORE_RULES) {
    await prisma.leadScoreRule.upsert({
      where: { key: rule.key },
      // Agirliklar admin tarafindan degistirilmis olabilir — EZME.
      update: { label: rule.label, sortOrder: rule.sortOrder },
      create: rule,
    });
  }
  console.log(`✓ ${SCORE_RULES.length} puanlama kurali hazir`);

  // ------------------------------------------------------ Satis hunisi
  let pipeline = await prisma.pipeline.findFirst({ where: { isDefault: true } });
  if (!pipeline) {
    pipeline = await prisma.pipeline.create({
      data: { name: 'Satış Hunisi', isDefault: true },
    });
  }
  for (const stage of STAGES) {
    await prisma.pipelineStage.upsert({
      where: { pipelineId_key: { pipelineId: pipeline.id, key: stage.key } },
      update: { name: stage.name, sortOrder: stage.sortOrder, color: stage.color },
      create: { ...stage, pipelineId: pipeline.id },
    });
  }
  console.log(`✓ "${pipeline.name}" ${STAGES.length} asamayla hazir`);

  // ---------------------------------------------------- Sektor esleme
  let count = 0;
  for (const [sector, categories] of Object.entries(SECTORS)) {
    for (const categoryRaw of categories) {
      await prisma.sectorMapping.upsert({
        where: { categoryRaw },
        update: { sector },
        create: { categoryRaw, sector },
      });
      count++;
    }
  }
  console.log(`✓ ${count} kategori eslemesi hazir`);

  // ------------------------------------------------------- Ayarlar
  const settings: Array<[string, unknown]> = [
    ['mail.daily_send_limit', { value: 50 }],
    ['mail.min_delay_seconds', { value: 45 }],
    ['crawler.respect_robots', { value: true }],
    ['crawler.delay_ms', { value: 2000 }],
    ['analyzer.timeout_ms', { value: 20000 }],
    ['analyzer.concurrency', { value: 2 }],
  ];
  for (const [key, value] of settings) {
    await prisma.setting.upsert({ where: { key }, update: {}, create: { key, value: value as any } });
  }
  console.log(`✓ ${settings.length} varsayilan ayar hazir`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (err) => {
    console.error('Seed basarisiz:', err);
    await prisma.$disconnect();
    process.exit(1);
  });
