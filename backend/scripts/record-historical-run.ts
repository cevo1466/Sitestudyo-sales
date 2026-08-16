/**
 * Sistem kurulmadan ONCE Apify'da yapilmis taramayi kayit altina alir.
 *
 * Neden gerekli: cakisma korumasi (`findOverlap`) `discovery_runs`
 * tablosuna bakiyor. Bu tarama disaridan yapildigi icin tabloda yok ve
 * koruma "Istanbul / kuafor salonu" aramasinin tekrarlandigini goremez —
 * ayni isletmeleri ikinci kez tarayip krediyi bosa harcardik.
 *
 *   npx ts-node --transpile-only scripts/record-historical-run.ts
 */
import { NestFactory } from '@nestjs/core';
import { JobStatus, PrismaClient } from '@prisma/client';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/common/prisma/prisma.service';

const HISTORICAL = {
  apifyRunId: 'sU74cEZwHiTzNXfQo',
  datasetId: 'ujUIqG2ummmiPuKhr',
  costUsd: 1.9152,
  foundCount: 384,
  startedAt: new Date('2026-06-24T22:00:00Z'),
  finishedAt: new Date('2026-06-24T22:21:16Z'),
  params: {
    searchTerms: [
      'kuaför salonu',
      'berber',
      'kafe kahve',
      'lojistik nakliyat',
      'pilates stüdyo',
      'mimarlık ofisi',
      'güzellik salonu',
      'restoran',
    ],
    locationQuery: 'İstanbul, Türkiye',
    maxPerSearch: 75,
    onlyWithoutWebsite: true,
    account: 'primary',
    note: 'Sistem kurulmadan once elle yapilmis tarama',
  },
};

async function main(): Promise<void> {
  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['warn', 'error'] });
  const prisma = app.get(PrismaService) as unknown as PrismaClient;

  const already = await prisma.discoveryRun.findFirst({
    where: { apifyRunId: HISTORICAL.apifyRunId },
  });
  if (already) {
    console.log('Gecmis tarama zaten kayitli:', already.id);
    await app.close();
    return;
  }

  const run = await prisma.discoveryRun.create({
    data: {
      provider: 'apify',
      status: JobStatus.SUCCEEDED,
      params: HISTORICAL.params,
      apifyRunId: HISTORICAL.apifyRunId,
      datasetId: HISTORICAL.datasetId,
      costUsd: HISTORICAL.costUsd,
      foundCount: HISTORICAL.foundCount,
      newCount: HISTORICAL.foundCount,
      startedAt: HISTORICAL.startedAt,
      finishedAt: HISTORICAL.finishedAt,
    },
  });

  console.log('Gecmis tarama kaydedildi:', run.id);
  console.log('Kapsanan:', HISTORICAL.params.locationQuery);
  for (const t of HISTORICAL.params.searchTerms) console.log('  -', t);
  await app.close();
}

main().catch((e) => {
  console.error('Basarisiz:', e);
  process.exit(1);
});
