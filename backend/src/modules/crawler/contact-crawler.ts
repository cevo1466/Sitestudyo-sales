import { isPrivateHost } from '../analyzer/website-analyzer';

export interface FoundContact {
  email: string;
  sourceUrl: string;
  /** VERIFIED = sayfada aciken yaziyordu, GUESSED = kalip uretimi. */
  confidence: 'VERIFIED' | 'GUESSED';
}

export interface CrawlResult {
  contacts: FoundContact[];
  pagesVisited: string[];
  blockedByRobots: string[];
  errorCode: string | null;
}

/**
 * Iletisim sayfasi adaylari.
 *
 * Sirasi onemli: ana sayfa cogu kucuk isletmede zaten e-posta iceriyor,
 * once ona bakip erken cikabiliyoruz. Bu, her siteye 7 istek atmak yerine
 * cogunda 1-2 istekle bitirmek demek.
 */
const CANDIDATE_PATHS = [
  '/',
  '/iletisim',
  '/contact',
  '/iletisim.html',
  '/contact-us',
  '/hakkimizda',
  '/about',
];

const TIMEOUT_MS = 12_000;
const UA = 'Mozilla/5.0 (compatible; SiteStudyoBot/1.0; +https://sitestudyo.com/bot)';

/** Sayfa basina bekleme — hedef siteyi yormamak icin. */
const POLITE_DELAY_MS = 1500;

/** Cop e-postalar: gorsel dosyalari, ornek adresler, izleme pikselleri. */
const JUNK = [
  /\.(png|jpe?g|gif|svg|webp|css|js)$/i,
  /^(example|test|your|email|name|user|sentry|wixpress)@/i,
  /@(sentry|example|domain|email)\.(io|com|net)$/i,
  // Turkce yer tutucular. sitestudyo.com'un iletisim formundaki ornek
  // metin "ornek@sirket.com" gercek bir adres gibi yakalaniyordu; boyle
  // bir adrese teklif gonderilmesi hem bosa is hem sert bounce demek.
  /^(ornek|örnek|isim|ad|adiniz|adınız|eposta|e-posta|mail)@/i,
  /@(sirket|şirket|ornek|örnek|alanadi|alanadınız|siteniz)\./i,
];

export async function crawlContacts(
  websiteUrl: string,
  opts: { respectRobots: boolean; maxPages: number; delayMs?: number } = {
    respectRobots: true,
    maxPages: 4,
  },
): Promise<CrawlResult> {
  const result: CrawlResult = {
    contacts: [],
    pagesVisited: [],
    blockedByRobots: [],
    errorCode: null,
  };

  let origin: URL;
  try {
    origin = new URL(/^https?:\/\//i.test(websiteUrl) ? websiteUrl : `https://${websiteUrl}`);
  } catch {
    result.errorCode = 'INVALID_URL';
    return result;
  }
  if (isPrivateHost(origin.hostname)) {
    result.errorCode = 'BLOCKED_HOST';
    return result;
  }

  const disallowed = opts.respectRobots ? await loadRobots(origin) : [];
  const seen = new Set<string>();
  const delay = opts.delayMs ?? POLITE_DELAY_MS;

  for (const path of CANDIDATE_PATHS) {
    if (result.pagesVisited.length >= opts.maxPages) break;

    const url = new URL(path, origin).toString();
    if (seen.has(url)) continue;
    seen.add(url);

    if (disallowed.some((rule) => new URL(url).pathname.startsWith(rule))) {
      // robots.txt'e uymak tercih degil zorunluluk: engellenen yolu
      // taramak hem etik degil hem IP engeline gotururdu.
      result.blockedByRobots.push(url);
      continue;
    }

    const html = await fetchPage(url);
    if (html === null) continue;

    result.pagesVisited.push(url);
    for (const c of extractEmails(html, url, origin.hostname)) {
      if (!result.contacts.some((x) => x.email === c.email)) result.contacts.push(c);
    }

    // Ana sayfada dogrulanmis adres bulduysak devam etmeye gerek yok.
    if (path === '/' && result.contacts.some((c) => c.confidence === 'VERIFIED')) break;

    if (delay > 0) await sleep(delay);
  }

  return result;
}

async function fetchPage(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': UA, Accept: 'text/html' },
      redirect: 'follow',
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) return null;
    const type = res.headers.get('content-type') ?? '';
    if (!type.includes('html')) return null;
    return await res.text();
  } catch {
    return null;
  }
}

async function loadRobots(origin: URL): Promise<string[]> {
  try {
    const res = await fetch(new URL('/robots.txt', origin).toString(), {
      headers: { 'User-Agent': UA },
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) return [];
    const text = await res.text();

    // Yalnizca bizi (veya herkesi) ilgilendiren bloklari okuyoruz.
    const rules: string[] = [];
    let applies = false;
    for (const line of text.split('\n')) {
      const l = line.trim().toLowerCase();
      if (l.startsWith('user-agent:')) {
        const agent = l.slice(11).trim();
        applies = agent === '*' || agent.includes('sitestudyobot');
      } else if (applies && l.startsWith('disallow:')) {
        const path = line.slice(line.indexOf(':') + 1).trim();
        if (path) rules.push(path);
      }
    }
    return rules;
  } catch {
    return [];
  }
}

export function extractEmails(rawHtml: string, sourceUrl: string, host: string): FoundContact[] {
  // Script ve stil icerigi atiliyor: paketlenmis JavaScript'te @ isareti
  // ve rakam bol, temizlenmezse her sitede sahte adres "bulunur".
  const html = rawHtml
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ');

  const found = new Map<string, FoundContact>();

  // mailto: bagi en guvenilir kaynak — insan eliyle konmus demektir.
  for (const m of html.matchAll(/mailto:([^"'?\s>]+)/gi)) {
    add(found, m[1], sourceUrl, 'VERIFIED');
  }
  for (const m of html.matchAll(/[\w.+-]+@[\w-]+\.[\w.]{2,}/g)) {
    add(found, m[0], sourceUrl, 'VERIFIED');
  }

  const list = [...found.values()];

  // Hicbir adres yoksa kalip uretmiyoruz. info@alan-adi tahmini,
  // gonderim listesine "dogrulanmis" gibi girip sert bounce uretir;
  // bu da gonderen itibarini yakar. GUESSED etiketi bu yuzden var ve
  // gonderim tarafinda ayri muamele gorecek.
  if (!list.length && host) {
    return [
      { email: `info@${host.replace(/^www\./, '')}`, sourceUrl, confidence: 'GUESSED' },
    ];
  }
  return list.slice(0, 10);
}

function add(
  map: Map<string, FoundContact>,
  raw: string,
  sourceUrl: string,
  confidence: FoundContact['confidence'],
): void {
  const email = decodeURIComponent(raw).trim().toLowerCase();
  if (!/^[\w.+-]+@[\w-]+\.[\w.]{2,}$/.test(email)) return;
  if (JUNK.some((re) => re.test(email))) return;
  if (!map.has(email)) map.set(email, { email, sourceUrl, confidence });
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
