/** Havuzun tamamini yeniden puanlar. */
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { ScoringService } from '../src/modules/scoring/scoring.service';

async function main(): Promise<void> {
  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['log', 'warn', 'error'] });
  const r = await app.get(ScoringService).recalculate();
  console.log(`\nPuanlandi: ${r.processed} isletme, ${r.changed} tanesinin skoru degisti`);
  await app.close();
}
main().catch((e) => { console.error(e); process.exit(1); });
