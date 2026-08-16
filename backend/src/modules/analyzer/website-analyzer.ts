import { WebsiteStatus } from '@prisma/client';
import { connect as tlsConnect } from 'node:tls';

export interface AnalysisResult {
  requestedUrl: string;
  finalUrl: string | null;
  httpStatus: number | null;
  redirectChain: string[];
  sslValid: boolean | null;
  sslExpiresAt: Date | null;
  httpsRedirect: boolean | null;
  ttfbMs: number | null;
  loadMs: number | null;
  hasTitle: boolean;
  title: string | null;
  hasMetaDesc: boolean;
  metaDesc: string | null;
  hasViewport: boolean;
  hasCanonical: boolean;
  isResponsive: boolean | null;
  cms: string | null;
  generator: string | null;
  techStack: { frameworks: string[]; analytics: string[]; server: string | null };
  contactSignals: {
    emails: string[];
    phones: string[];
    hasContactForm: boolean;
    whatsapp: string | null;
    social: Record<string, string>;
  };
  websiteScore: number | null;
  websiteStatus: WebsiteStatus;
  errorCode: string | null;
}

/**
 * Neden tarayici (Playwright) YOK:
 *
 * Bu VDS'te 3.9 GB RAM var, swap dolu ve bos bellek ~400 MB. Chromium tek
 * basina ~300 MB yiyor; es zamanli iki analiz sunucuyu OOM'a iter ve
 * uzerinde calisan diger siteleri de dusurur.
 *
 * Bedeli: JavaScript ile cizilen icerigi goremiyoruz. Ama olctugumuz
 * seylerin cogu (HTTP durumu, SSL, TTFB, meta etiketler, sunucu basliklari)
 * ham HTML'de zaten var. JS ile cizilen bir SPA'da "baslik yok" demek
 * yanlis olurdu — bu yuzden SPA tespit edilirse ilgili alanlar `null`
 * birakiliyor, `false` degil.
 */
const TIMEOUT_MS = 15_000;
const MAX_BYTES = 1_500_000; // 1.5 MB'dan sonrasi olcum icin gereksiz
const UA =
  'Mozilla/5.0 (compatible; SiteStudyoBot/1.0; +https://sitestudyo.com/bot)';

export async function analyzeWebsite(rawUrl: string): Promise<AnalysisResult> {
  const result: AnalysisResult = emptyResult(rawUrl);

  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(rawUrl) ? rawUrl : `https://${rawUrl}`);
  } catch {
    result.errorCode = 'INVALID_URL';
    return result;
  }

  // SSRF kapisi: ic aglara istek atilmasini engelle. Bu uc, kullanicidan
  // gelen bir adresle calisiyor; ic servislere yonlendirilebilirdi.
  if (isPrivateHost(url.hostname)) {
    result.errorCode = 'BLOCKED_HOST';
    return result;
  }

  const started = Date.now();
  let res: Response;
  let ttfb: number | null = null;

  try {
    res = await fetch(url.toString(), {
      redirect: 'follow',
      headers: { 'User-Agent': UA, Accept: 'text/html,application/xhtml+xml' },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    ttfb = Date.now() - started;
  } catch (err) {
    const msg = err instanceof Error ? err.message : '';
    result.errorCode = /timeout|abort/i.test(msg)
      ? 'TIMEOUT'
      : /ENOTFOUND|EAI_AGAIN|getaddrinfo/i.test(msg)
        ? 'DNS_FAIL'
        : /certificate|SSL|TLS/i.test(msg)
          ? 'SSL_ERROR'
          : 'FETCH_FAIL';
    // Erisilemeyen site BOZUK sayilir — satis acisindan en degerli
    // sinyallerden biri: musteri kaybediyor demektir.
    result.websiteStatus = WebsiteStatus.BROKEN;
    result.sslValid = result.errorCode === 'SSL_ERROR' ? false : null;
    return result;
  }

  result.httpStatus = res.status;
  result.finalUrl = res.url;
  result.ttfbMs = ttfb;
  result.httpsRedirect = res.url.startsWith('https://');
  result.techStack.server = res.headers.get('server');

  if (res.status >= 500 || res.status === 0) {
    result.websiteStatus = WebsiteStatus.BROKEN;
    result.errorCode = `HTTP_${res.status}`;
    return result;
  }
  if (res.status === 404 || res.status === 410) {
    result.websiteStatus = WebsiteStatus.BROKEN;
    result.errorCode = `HTTP_${res.status}`;
    return result;
  }

  const html = await readCapped(res, MAX_BYTES);
  result.loadMs = Date.now() - started;

  parseHtml(html, result);
  if (result.finalUrl?.startsWith('https://')) {
    const ssl = await checkSsl(new URL(result.finalUrl).hostname);
    result.sslValid = ssl.valid;
    result.sslExpiresAt = ssl.expiresAt;
  } else {
    result.sslValid = false; // http:// ile servis eden site
  }

  scoreAndClassify(result, html);
  return result;
}

// ─────────────────────────────────────────────────────────── HTML olcumu

function parseHtml(html: string, r: AnalysisResult): void {
  const title = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(html)?.[1]?.trim();
  r.title = title ? decodeEntities(title).slice(0, 500) : null;
  r.hasTitle = Boolean(r.title);

  const desc = /<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i.exec(html)?.[1];
  r.metaDesc = desc ? decodeEntities(desc).trim() : null;
  r.hasMetaDesc = Boolean(r.metaDesc);

  r.hasViewport = /<meta[^>]+name=["']viewport["']/i.test(html);
  r.hasCanonical = /<link[^>]+rel=["']canonical["']/i.test(html);
  // Mobil uyumlulugun HTML'den olculebilen tek guvenilir isareti viewport.
  // CSS medya sorgularini indirip yorumlamak tarayici isterdi.
  r.isResponsive = r.hasViewport;

  const gen = /<meta[^>]+name=["']generator["'][^>]+content=["']([^"']*)["']/i.exec(html)?.[1];
  r.generator = gen ? gen.trim().slice(0, 160) : null;

  r.cms = detectCms(html, r.generator);
  r.techStack.frameworks = detectFrameworks(html);
  r.techStack.analytics = detectAnalytics(html);
  r.contactSignals = extractContacts(html);
}

function detectCms(html: string, generator: string | null): string | null {
  if (generator) {
    for (const name of ['WordPress', 'Joomla', 'Drupal', 'Wix', 'Shopify', 'Webflow']) {
      if (generator.toLowerCase().includes(name.toLowerCase())) return name;
    }
  }
  if (/wp-content|wp-includes/i.test(html)) return 'WordPress';
  if (/cdn\.shopify\.com/i.test(html)) return 'Shopify';
  if (/static\.parastorage\.com|wixstatic/i.test(html)) return 'Wix';
  if (/assets\.website-files\.com|webflow/i.test(html)) return 'Webflow';
  return null;
}

function detectFrameworks(html: string): string[] {
  const found: string[] = [];
  if (/__NEXT_DATA__|\/_next\//.test(html)) found.push('Next.js');
  else if (/data-reactroot|react(-dom)?[.-]/i.test(html)) found.push('React');
  if (/__NUXT__|\/_nuxt\//.test(html)) found.push('Nuxt');
  else if (/data-v-[0-9a-f]{8}|vue(\.runtime)?[.-]/i.test(html)) found.push('Vue');
  if (/ng-version=|angular[.-]/i.test(html)) found.push('Angular');
  if (/jquery[.-]/i.test(html)) found.push('jQuery');
  if (/bootstrap[.-]/i.test(html)) found.push('Bootstrap');
  return found;
}

function detectAnalytics(html: string): string[] {
  const found: string[] = [];
  if (/gtag\(|googletagmanager\.com\/gtag/i.test(html)) found.push('GA4');
  if (/googletagmanager\.com\/gtm/i.test(html)) found.push('GTM');
  if (/connect\.facebook\.net.*fbevents/i.test(html)) found.push('Meta Pixel');
  if (/hotjar/i.test(html)) found.push('Hotjar');
  if (/yandex.*metrika|mc\.yandex\.ru/i.test(html)) found.push('Yandex Metrica');
  return found;
}

function extractContacts(rawHtml: string): AnalysisResult['contactSignals'] {
  // <script> ve <style> icerigi ONCE atiliyor: paketlenmis JavaScript
  // rakam ve @ isareti dolu oldugu icin, temizlenmezse her sitede
  // duzinelerce sahte telefon/e-posta "bulunur". attio.com'da 10 adet
  // Turkce telefon numarasi cikmisti — hepsi bundle icindeki rakamlardi.
  const html = rawHtml
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ');

  const emails = [
    ...new Set(
      (html.match(/[\w.+-]+@[\w-]+\.[\w.]{2,}/g) ?? [])
        .map((e) => e.toLowerCase())
        // Gorsel dosya adlari ve ornek adresler e-posta degil.
        .filter((e) => !/\.(png|jpe?g|gif|svg|webp)$/i.test(e))
        .filter((e) => !/^(example|test|your|email|name)@/.test(e)),
    ),
  ].slice(0, 10);

  const phones = [
    ...new Set(
      (html.match(/(?<![\d.])(?:\+90|0)\s?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{2}[\s.-]?\d{2}(?![\d])/g) ?? []).map((p) =>
        p.replace(/\s+/g, ' ').trim(),
      ),
    ),
  ].slice(0, 10);

  const social: Record<string, string> = {};
  for (const [key, re] of [
    ['instagram', /https?:\/\/(?:www\.)?instagram\.com\/[\w.]+/i],
    ['facebook', /https?:\/\/(?:www\.)?facebook\.com\/[\w.]+/i],
    ['linkedin', /https?:\/\/(?:www\.)?linkedin\.com\/(?:company|in)\/[\w-]+/i],
    ['x', /https?:\/\/(?:www\.)?(?:twitter|x)\.com\/[\w]+/i],
    ['youtube', /https?:\/\/(?:www\.)?youtube\.com\/[\w@/-]+/i],
  ] as const) {
    const m = re.exec(html);
    if (m) social[key] = m[0];
  }

  const wa = /https?:\/\/(?:wa\.me|api\.whatsapp\.com)\/[\w?=+&.]+/i.exec(html);

  return {
    emails,
    phones,
    // <form> icinde e-posta/mesaj alani ariyoruz; arama kutusu form
    // sayilmamali, yoksa her sitede "iletisim formu var" cikardi.
    hasContactForm:
      /<form[\s\S]{0,2000}?(type=["']email["']|name=["'][^"']*(mail|mesaj|message|konu|subject)[^"']*["']|<textarea)/i.test(
        html,
      ),
    whatsapp: wa ? wa[0] : null,
    social,
  };
}

// ──────────────────────────────────────────────────────── Puan ve sinif

/**
 * 0-100 site kalite puani ve durum sinifi.
 *
 * Bu puan LEAD puani DEGIL: site ne kadar iyiyse bu yuksek, lead puani
 * dusuk olur. Ikisi ters yonde calisir ve karistirilmamalidir.
 */
function scoreAndClassify(r: AnalysisResult, html: string): void {
  let score = 0;
  score += r.httpStatus === 200 ? 20 : 5;
  score += r.sslValid ? 15 : 0;
  score += r.httpsRedirect ? 5 : 0;
  score += r.hasTitle ? 10 : 0;
  score += r.hasMetaDesc ? 10 : 0;
  score += r.hasViewport ? 15 : 0;
  score += r.hasCanonical ? 5 : 0;
  score += r.contactSignals.hasContactForm ? 5 : 0;
  score += r.contactSignals.emails.length || r.contactSignals.phones.length ? 5 : 0;
  if (r.ttfbMs !== null) score += r.ttfbMs < 600 ? 10 : r.ttfbMs < 1500 ? 5 : 0;
  r.websiteScore = Math.min(100, score);

  // Icerigi neredeyse bos bir sayfa (park edilmis alan adi, "yapim
  // asamasinda") calisan bir site sayilmamali.
  const textLength = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().length;
  if (textLength < 200) {
    r.websiteStatus = WebsiteStatus.BROKEN;
    r.errorCode = 'EMPTY_PAGE';
    return;
  }

  r.websiteStatus =
    score >= 75
      ? WebsiteStatus.ACTIVE_GOOD
      : !r.hasViewport
        ? WebsiteStatus.OUTDATED // mobil uyumsuz site bugun "eski" demek
        : WebsiteStatus.ACTIVE_WEAK;
}

// ────────────────────────────────────────────────────────────── Yardimci

async function checkSsl(
  hostname: string,
): Promise<{ valid: boolean | null; expiresAt: Date | null }> {
  return new Promise((resolve) => {
    const socket = tlsConnect(
      { host: hostname, port: 443, servername: hostname, timeout: 8000 },
      () => {
        const cert = socket.getPeerCertificate();
        const expiresAt = cert?.valid_to ? new Date(cert.valid_to) : null;
        resolve({ valid: socket.authorized && (expiresAt?.getTime() ?? 0) > Date.now(), expiresAt });
        socket.destroy();
      },
    );
    socket.on('error', () => resolve({ valid: false, expiresAt: null }));
    socket.on('timeout', () => {
      socket.destroy();
      resolve({ valid: null, expiresAt: null });
    });
  });
}

/** Ic ag adreslerini engeller (SSRF). */
export function isPrivateHost(hostname: string): boolean {
  const h = hostname.toLowerCase();
  if (h === 'localhost' || h.endsWith('.localhost') || h.endsWith('.internal')) return true;
  if (/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.test(h)) {
    const [a, b] = h.split('.').map(Number);
    if (a === 10 || a === 127 || a === 0) return true;
    if (a === 192 && b === 168) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 169 && b === 254) return true; // bulut metadata ucu
  }
  if (h.startsWith('[') || h.includes(':')) return true; // IPv6 — ayirt etmek yerine engelle
  return false;
}

async function readCapped(res: Response, max: number): Promise<string> {
  const reader = res.body?.getReader();
  if (!reader) return '';
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    total += value.length;
    if (total >= max) {
      await reader.cancel();
      break;
    }
  }
  return Buffer.concat(chunks).toString('utf8');
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ');
}

function emptyResult(url: string): AnalysisResult {
  return {
    requestedUrl: url,
    finalUrl: null,
    httpStatus: null,
    redirectChain: [],
    sslValid: null,
    sslExpiresAt: null,
    httpsRedirect: null,
    ttfbMs: null,
    loadMs: null,
    hasTitle: false,
    title: null,
    hasMetaDesc: false,
    metaDesc: null,
    hasViewport: false,
    hasCanonical: false,
    isResponsive: null,
    cms: null,
    generator: null,
    techStack: { frameworks: [], analytics: [], server: null },
    contactSignals: { emails: [], phones: [], hasContactForm: false, whatsapp: null, social: {} },
    websiteScore: null,
    websiteStatus: WebsiteStatus.UNKNOWN,
    errorCode: null,
  };
}
