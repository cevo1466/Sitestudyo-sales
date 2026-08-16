/**
 * Analizoru GERCEK sitelerde dener.
 *
 *   npx ts-node --transpile-only scripts/try-analyzer.ts [url...]
 *
 * Argumansiz calistirilirsa asagidaki karisik kume kullanilir: calisan
 * site, SSRF denemesi ve olmayan alan adi — uc yolun da dogru davrandigini
 * tek bakista gormek icin.
 */
import { analyzeWebsite } from '../src/modules/analyzer/website-analyzer';

const DEFAULTS = [
  'https://sitestudyo.com',
  'https://gpartysus.com',
  'https://attio.com',
  'http://127.0.0.1:8088', // SSRF kapisi denemesi — BLOCKED_HOST bekleniyor
  'https://bu-alan-adi-yok-12345.com', // DNS_FAIL bekleniyor
];

async function main(): Promise<void> {
  const sites = process.argv.slice(2).length ? process.argv.slice(2) : DEFAULTS;

  for (const s of sites) {
    const r = await analyzeWebsite(s);
    console.log(`\n── ${s}`);
    console.log(`   durum    : ${r.websiteStatus}${r.errorCode ? ` (${r.errorCode})` : ''}`);
    console.log(`   http     : ${r.httpStatus}  ttfb=${r.ttfbMs}ms  site puani=${r.websiteScore}`);
    console.log(
      `   ssl      : ${r.sslValid}  bitis=${r.sslExpiresAt?.toISOString().slice(0, 10) ?? '-'}`,
    );
    console.log(`   baslik   : ${r.title?.slice(0, 60) ?? '-'}`);
    console.log(
      `   viewport : ${r.hasViewport}  meta=${r.hasMetaDesc}  canonical=${r.hasCanonical}`,
    );
    console.log(
      `   teknoloji: cms=${r.cms ?? '-'} fw=[${r.techStack.frameworks}] ` +
        `analytics=[${r.techStack.analytics}] server=${r.techStack.server ?? '-'}`,
    );
    console.log(
      `   iletisim : form=${r.contactSignals.hasContactForm} ` +
        `eposta=${r.contactSignals.emails.length} tel=${r.contactSignals.phones.length} ` +
        `sosyal=[${Object.keys(r.contactSignals.social)}]`,
    );
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
