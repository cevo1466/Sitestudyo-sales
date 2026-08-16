/**
 * Yeni bir Apify taramasi baslatir. KREDI HARCAR.
 *
 *   npx ts-node --transpile-only scripts/start-run.ts <profil>
 *
 * Profiller asagida tanimli. Her profil, DAHA ONCE TARANMAMIS bir
 * arama x konum kumesi kapsar; cakisma korumasi (findOverlap) zaten
 * tekrari engelliyor ama profilleri de bilerek ayirdik.
 *
 * Maliyet: olculen deger ~$0.005 / isletme (384 kayit = $1.92).
 * Hesap basina ucretsiz kota $5/ay -> ~1000 isletme.
 */
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { DiscoveryService } from '../src/modules/discovery/discovery.service';
import { PrismaService } from '../src/common/prisma/prisma.service';
import type { StartRunDto } from '../src/modules/discovery/discovery.service';

const PROFILES: Record<string, StartRunDto & { note: string }> = {
  /**
   * 1. HESAP — Istanbul, YENI sektorler.
   * Eski tarama Istanbul'da kuafor/berber/kafe/restoran/guzellik/pilates/
   * mimarlik/lojistik kapsadi. Buradaki 12 terim onlarla kesismiyor ve
   * bilerek "web sitesine para veren" isletmeler secildi.
   */
  'istanbul-yeni-sektorler': {
    note: '1. hesap — Istanbul, web sitesi satin alma egilimi yuksek sektorler',
    account: 'primary',
    locationQuery: 'İstanbul, Türkiye',
    searchTerms: [
      'diş kliniği',
      'avukat',
      'emlak ofisi',
      'veteriner kliniği',
      'spor salonu',
      'mali müşavir',
      'oto servis',
      'kuru temizleme',
      'medikal estetik',
      'özel anaokulu',
      'iç mimarlık',
      'psikolog',
    ],
    maxPerSearch: 100,
    language: 'tr',
    countryCode: 'tr',
    onlyWithoutWebsite: true,
  },

  /** 2. HESAP — Ankara. Yeni sehir, kanitlanmis verimli terimler. */
  'ankara': {
    note: '2. hesap — Ankara',
    account: 'secondary',
    locationQuery: 'Ankara, Türkiye',
    searchTerms: [
      'kuaför salonu',
      'berber',
      'restoran',
      'kafe',
      'güzellik salonu',
      'diş kliniği',
    ],
    maxPerSearch: 100,
    language: 'tr',
    countryCode: 'tr',
    onlyWithoutWebsite: true,
  },

  /**
   * 2. HESAP — Izmir, KALAN KREDIYE gore kisilmis.
   *
   * Ankara taramasi $3.60 harcadi, hesapta $1.40 kaldi (~279 isletme).
   * 3 terim x 85 = 255 tavan ≈ $1.28 — kotayi asmadan sigar. Tavan
   * asilsaydi Apify calismayi yarida keserdi ve elimizde yarim veri kalirdi.
   */
  izmir: {
    note: '2. hesap — Izmir (kalan $1.40 krediye gore kisildi)',
    account: 'secondary',
    locationQuery: 'İzmir, Türkiye',
    searchTerms: ['kuaför salonu', 'restoran', 'diş kliniği'],
    maxPerSearch: 85,
    language: 'tr',
    countryCode: 'tr',
    onlyWithoutWebsite: true,
  },
};

async function main(): Promise<void> {
  const key = process.argv[2];
  const profile = key ? PROFILES[key] : undefined;
  if (!profile) {
    console.error('Kullanim: start-run.ts <profil>');
    console.error('Profiller:', Object.keys(PROFILES).join(', '));
    process.exit(1);
  }

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['log', 'warn', 'error'],
  });
  const discovery = app.get(DiscoveryService);
  const prisma = app.get(PrismaService);

  const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
  if (!admin) throw new Error('Admin kullanici yok — once `npm run seed`');

  const maxPlaces = profile.searchTerms.length * profile.maxPerSearch;
  console.log(`\n${profile.note}`);
  console.log(`  konum   : ${profile.locationQuery}`);
  console.log(`  terim   : ${profile.searchTerms.length} adet`);
  console.log(`  tavan   : ${maxPlaces} isletme`);
  console.log(`  tahmini : ~$${(maxPlaces * 0.005).toFixed(2)} (gercek sonuc genelde tavanin altinda)`);
  console.log(`  hesap   : ${profile.account}\n`);

  const run = await discovery.startRun(profile, admin.id);
  console.log('Tarama baslatildi.');
  console.log('  kayit id :', run.id);
  console.log('  apify id :', run.apifyRunId);
  console.log('\nDurum icin: npx ts-node --transpile-only scripts/run-status.ts', run.id);

  await app.close();
}

main().catch((e) => {
  console.error('Baslatilamadi:', e?.response ?? e?.message ?? e);
  process.exit(1);
});
