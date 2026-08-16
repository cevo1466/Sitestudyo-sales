/** Iletisim tarayicisini gercek sitelerde dener. */
import { crawlContacts } from '../src/modules/crawler/contact-crawler';

const DEFAULTS = ['https://sitestudyo.com', 'https://gpartysus.com', 'http://127.0.0.1:8088'];

async function main(): Promise<void> {
  const sites = process.argv.slice(2).length ? process.argv.slice(2) : DEFAULTS;
  for (const s of sites) {
    const r = await crawlContacts(s, { respectRobots: true, maxPages: 4, delayMs: 500 });
    console.log(`\n── ${s}`);
    console.log(`   gezilen  : ${r.pagesVisited.length} sayfa`);
    console.log(`   robots   : ${r.blockedByRobots.length} engellendi`);
    console.log(`   hata     : ${r.errorCode ?? '-'}`);
    for (const c of r.contacts) console.log(`   ${c.confidence.padEnd(8)} ${c.email}`);
    if (!r.contacts.length) console.log('   (adres bulunamadi)');
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
