/**
 * API istemcisi — sunucu adresi CALISMA ZAMANINDA belirlenir.
 *
 * Uygulama hicbir adres gomulu gelmez: kullanici kendi VDS'ini girer,
 * adres bu bilgisayara kaydedilir. Boylece ayni kurulum dosyasi herkeste
 * calisir ve herkes kendi sunucusuna baglanir.
 */

const STORAGE_KEY = 'salesos.connection';
const REFRESH_KEY = 'salesos.refresh';

export interface Connection {
  serverUrl: string;
  serverName?: string;
}

export function getConnection(): Connection | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Connection) : null;
  } catch {
    return null;
  }
}

export function saveConnection(c: Connection): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(c));
}

export function clearConnection(): void {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

/**
 * Erisim token'i YALNIZCA BELLEKTE. Omru 15 dakika.
 *
 * Yenileme token'i ise diske yaziliyor. Bu bir odunlesme:
 *   - Bellekte tutulsaydi uygulama her kapandiginda tekrar giris gerekirdi.
 *   - Diskte tutulunca, o dosyayi okuyabilen biri oturumu ele gecirebilir.
 * Masaustu uygulamasinda depolama zaten uygulamanin kendi profilinde ve
 * isletim sistemi kullanici hesabiyla korunuyor. Anahtar zinciri (OS
 * keychain) daha iyi olurdu; ilerideki is.
 */
let accessToken: string | null = null;

export function setTokens(access: string | null, refresh?: string | null): void {
  accessToken = access;
  if (refresh === null) localStorage.removeItem(REFRESH_KEY);
  else if (refresh) localStorage.setItem(REFRESH_KEY, refresh);
}

export function hasToken(): boolean {
  return accessToken !== null;
}

export function hasSession(): boolean {
  return Boolean(localStorage.getItem(REFRESH_KEY));
}

/** Oturum tamamen bittiginde cagriliyor — App giris ekranina donuyor. */
let onSessionLost: (() => void) | null = null;
export function setSessionLostHandler(fn: () => void): void {
  onSessionLost = fn;
}

export class ApiError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly status: number,
    readonly fields?: Record<string, string>,
  ) {
    super(message);
  }
}

function baseUrl(): string {
  const c = getConnection();
  // Gelistirmede Vite ayni kokenden proxy'liyor; adres girilmemisse
  // gorece yol kullaniyoruz.
  return c?.serverUrl?.replace(/\/+$/, '') ?? '';
}

/**
 * Istek tekrar gonderilebilir mi?
 *
 * Bir kez okunmus akis (stream) veya tuketilmis govde ikinci kez
 * gonderilemez ("body already used"). Bugun tum cagrilar JSON metni
 * gonderiyor ve metin tekrar kullanilabilir; bu kontrol ileride biri
 * dosya yuklemesi eklediginde sessizce kirilmayi engelliyor.
 */
function canRetry(init: RequestInit): boolean {
  const b = init.body;
  return b === undefined || b === null || typeof b === 'string';
}

async function raw(path: string, init: RequestInit, root: string): Promise<Response> {
  return fetch(`${root}/api/v1${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...init.headers,
    },
  });
}

/**
 * Erisim token'ini yeniler.
 *
 * Es zamanli istekler ayni anda 401 alabilir; her biri ayri ayri yenileme
 * cagirirsa sunucu ROTASYON yuzunden ikincisini "tekrar kullanim" sayip
 * TUM oturumu iptal eder. Bu yuzden ayni anda yalnizca bir yenileme
 * calisiyor, digerleri onu bekliyor.
 */
/** Yenileme sonucu: oturum bitti mi, yoksa gecici bir aksaklik mi. */
type RefreshOutcome = 'ok' | 'expired' | 'unavailable';

let refreshing: Promise<RefreshOutcome> | null = null;

function refreshTokens(root: string): Promise<RefreshOutcome> {
  if (refreshing) return refreshing;

  const run = (async (): Promise<RefreshOutcome> => {
    const refreshToken = localStorage.getItem(REFRESH_KEY);
    if (!refreshToken) return 'expired';
    try {
      const res = await fetch(`${root}/api/v1/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      // 5xx = sunucu gecici olarak bozuk. Oturumu SILMIYORUZ; bir
      // saniyelik aksaklik yuzunden kullaniciyi disari atmak, sorunu
      // cozmek yerine buyutmek olur.
      if (res.status >= 500) return 'unavailable';
      if (!res.ok) return 'expired';

      const body: unknown = await res.json();
      // Cevabin bicimini dogruluyoruz: bozuk bir cevabi token diye
      // saklamak, bir sonraki istekte anlasilmaz bir 401 uretirdi.
      if (
        typeof body !== 'object' ||
        body === null ||
        typeof (body as { accessToken?: unknown }).accessToken !== 'string' ||
        typeof (body as { refreshToken?: unknown }).refreshToken !== 'string'
      ) {
        return 'expired';
      }
      const t = body as { accessToken: string; refreshToken: string };
      setTokens(t.accessToken, t.refreshToken);
      return 'ok';
    } catch {
      // Ag hatasi — oturum bitmis DEGIL.
      return 'unavailable';
    }
  })();

  refreshing = run;
  // Kilidi promise KIMLIGINE gore aciyoruz: setTimeout(...,0) ile
  // acmak, promise bittikten sonraki kisa arada eski sonucu servis
  // ediyor ve gercekte yenileme yapmadan "basarili" sayilabiliyordu.
  void run.finally(() => {
    if (refreshing === run) refreshing = null;
  });
  return run;
}

export async function api<T>(
  path: string,
  init: RequestInit & { serverUrl?: string } = {},
): Promise<T> {
  const root = init.serverUrl?.replace(/\/+$/, '') ?? baseUrl();

  let res = await raw(path, init, root);

  // 15 dakikalik erisim token'i dolunca sessizce yenileyip TEKRAR
  // deniyoruz. Bu olmadan uygulama 15 dakika sonra "Liste yuklenemedi"
  // deyip duruyordu ve tek cozum kapatip yeniden acmakti.
  //
  // `path` burada /auth/login gibi; /api/v1 onekini raw() ekliyor.
  if (res.status === 401 && !path.startsWith('/auth/') && canRetry(init)) {
    // Yenileme, istegin gittigi AYNI sunucuya gidiyor. baseUrl()
    // kullanilsaydi token bir sunucudan alinip digerine gonderilebilirdi.
    const outcome = await refreshTokens(root);
    if (outcome === 'ok') {
      res = await raw(path, init, root);
    } else if (outcome === 'expired') {
      setTokens(null, null);
      onSessionLost?.();
    }
    // 'unavailable' -> token'lara DOKUNMUYORUZ. Asagida 401 hatasi
    // firlatilacak, kullanici tekrar deneyince oturum devam edecek.
  }

  if (res.status === 204) return undefined as T;

  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError(
      (body as { code?: string }).code ?? 'error',
      (body as { message?: string }).message ?? 'Beklenmeyen bir hata olustu',
      res.status,
      (body as { fields?: Record<string, string> }).fields,
    );
  }
  return body as T;
}

/** Kayitli yenileme token'i ile oturumu geri getirir (uygulama acilisinda). */
export async function restoreSession(): Promise<boolean> {
  if (!getConnection() || !hasSession()) return false;
  return (await refreshTokens(baseUrl())) === 'ok';
}

// ───────────────────────────────────────────────────────────── Tipler

export interface Company {
  id: string;
  name: string;
  city: string | null;
  district: string | null;
  sector: string | null;
  categoryRaw: string | null;
  phone: string | null;
  phoneE164: string | null;
  websiteStatus: string;
  leadScore: number;
  leadGrade: 'VERY_HOT' | 'HOT' | 'WARM' | 'LOW';
  googleRating: string | number | null;
  googleReviewsCount: number | null;
}

export interface CompanyPage {
  items: Company[];
  nextCursor: string | null;
  approxTotal: number;
}

export interface HealthInfo {
  status: string;
  serverName: string;
  api: string;
}
