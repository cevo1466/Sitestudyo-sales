/**
 * Otomatik kesif — zamanlayicinin cagirdigi giris noktasi.
 *
 *   npx ts-node --transpile-only scripts/auto-discover.ts
 *
 * Her calismada:
 *   1. Biten taramalarin sonucunu havuza aktarir
 *   2. Kalan krediyi Apify'a SORAR (tarih tahmin etmez)
 *   3. Krediye sigan, HENUZ TARANMAMIS bir sonraki plani baslatir
 *
 * Gunde bir kez calismasi yeterli: kota aylik yenileniyor ve tek bir
 * calisma kotanin buyuk kismini kullaniyor.
 */
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { AutoDiscoveryService } from '../src/modules/discovery/auto-discovery.service';

async function main(): Promise<void> {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['log', 'warn', 'error'],
  });
  const auto = app.get(AutoDiscoveryService);

  const r = await auto.tick();

  console.log(`\n─── ${new Date().toISOString()} ───`);
  for (const i of r.imported) {
    console.log(`  aktarildi ${i.runId.slice(0, 8)}: +${i.created} yeni, ${i.duplicates} mukerrer`);
  }
  for (const s of r.started) {
    console.log(`  ${s.account.padEnd(9)} ${s.status.padEnd(14)} ${s.detail}`);
  }
  console.log(`  izgara: ${r.progress.done}/${r.progress.total} (%${r.progress.percent})`);

  await app.close();
}

main().catch((e) => {
  console.error('Otomatik kesif basarisiz:', e?.message ?? e);
  process.exit(1);
});
