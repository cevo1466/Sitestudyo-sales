/**
 * Tarama durumunu sorar; bittiyse sonuclari havuza aktarir.
 *
 *   npx ts-node --transpile-only scripts/run-status.ts <runId> [--import]
 *   npx ts-node --transpile-only scripts/run-status.ts --all
 */
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { DiscoveryService } from '../src/modules/discovery/discovery.service';

async function main(): Promise<void> {
  const arg = process.argv[2];
  const doImport = process.argv.includes('--import');

  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['warn', 'error'] });
  const discovery = app.get(DiscoveryService);

  if (!arg || arg === '--all') {
    const runs = await discovery.list();
    console.log('\n─────── TARAMALAR ───────');
    for (const r of runs) {
      const p = (r.params ?? {}) as { locationQuery?: string; account?: string };
      console.log(
        `${r.id.slice(0, 8)}  ${String(r.status).padEnd(10)} ${String(p.account ?? '-').padEnd(10)} ` +
          `bulunan=${String(r.foundCount).padStart(4)} yeni=${String(r.newCount).padStart(4)} ` +
          `$${r.costUsd ?? 0}  ${p.locationQuery ?? ''}`,
      );
    }
    await app.close();
    return;
  }

  const run = await discovery.refresh(arg);
  console.log(`\ndurum    : ${run.status}`);
  console.log(`bulunan  : ${run.foundCount}`);
  console.log(`maliyet  : $${run.costUsd ?? 0}`);
  console.log(`dataset  : ${run.datasetId ?? '-'}`);

  if (doImport && run.status !== 'RUNNING') {
    console.log('\nHavuza aktariliyor...');
    const r = await discovery.importRun(arg);
    console.log(`  gorulen    : ${r.seen}`);
    console.log(`  yeni       : ${r.created}`);
    console.log(`  guncellendi: ${r.updated}`);
    console.log(`  mukerrer   : ${r.duplicates}`);
    if (r.unmappedCategories.length) {
      console.log(`\n  ESLENMEMIS KATEGORILER (${r.unmappedCategories.length}):`);
      for (const c of r.unmappedCategories) console.log(`    - ${c}`);
    }
  }

  await app.close();
}

main().catch((e) => {
  console.error('Basarisiz:', e?.response ?? e?.message ?? e);
  process.exit(1);
});
