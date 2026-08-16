/**
 * Var olan bir Apify sonuc kumesini havuza aktarir. KREDI HARCAMAZ.
 *
 *   npx ts-node --transpile-only scripts/import-dataset.ts <datasetId> <true|false> [primary|secondary]
 *
 * Ornek (24 Haz 2026 Istanbul taramasi, withoutWebsite filtresiyle):
 *   npx ts-node --transpile-only scripts/import-dataset.ts ujUIqG2ummmiPuKhr true primary
 *
 * Ikinci parametre, o taramanin `website: "withoutWebsite"` FILTRESIYLE
 * kosup kosmadigini soyler. Yanlis verilirse sitesi olmayan isletmeler
 * "bilinmiyor" olarak girer (veya tersi) ve lead puanlamasi bozulur.
 */
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { DiscoveryService } from '../src/modules/discovery/discovery.service';

async function main(): Promise<void> {
  const [datasetId, withoutWebsite, account = 'primary'] = process.argv.slice(2);
  if (!datasetId || (withoutWebsite !== 'true' && withoutWebsite !== 'false')) {
    console.error(
      'Kullanim: import-dataset.ts <datasetId> <true|false> [primary|secondary]',
    );
    process.exit(1);
  }

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['log', 'warn', 'error'],
  });
  const discovery = app.get(DiscoveryService);

  console.log(
    `\nAktariliyor: ${datasetId} (onlyWithoutWebsite=${withoutWebsite}, hesap=${account})\n`,
  );
  const r = await discovery.importDataset(datasetId, {
    onlyWithoutWebsite: withoutWebsite === 'true',
    account: account as 'primary' | 'secondary',
  });

  console.log('\n─────────── SONUC ───────────');
  console.log(`  gorulen    : ${r.seen}`);
  console.log(`  yeni       : ${r.created}`);
  console.log(`  guncellendi: ${r.updated}`);
  console.log(`  mukerrer   : ${r.duplicates}`);
  console.log(`  atlanan    : ${r.skipped}`);
  if (r.unmappedCategories.length) {
    console.log(
      `\n  ESLENMEMIS KATEGORILER (${r.unmappedCategories.length}) — sector_mappings'e eklenmeli:`,
    );
    for (const c of r.unmappedCategories) console.log(`    - ${c}`);
  }

  await app.close();
}

main().catch((e) => {
  console.error('Aktarim basarisiz:', e);
  process.exit(1);
});
