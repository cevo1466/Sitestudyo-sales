/**
 * API istemcisi — sunucu adresi CALISMA ZAMANINDA belirlenir.
 *
 * Uygulama hicbir adres gomulu gelmez: kullanici kendi VDS'ini girer,
 * adres bu bilgisayara kaydedilir. Boylece ayni kurulum dosyasi herkeste
 * calisir ve herkes kendi sunucusuna baglanir.
 */

const STORAGE_KEY = 'salesos.connection';

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
}

/**
 * Erisim token'i YALNIZCA BELLEKTE.
 *
 * localStorage'a yazilsaydi, sayfada calisan herhangi bir kod onu
 * okuyabilirdi. Uygulama kapaninca token ucuyor; oturumu surdurmek
 * refresh token'in isi (masaustu surumunde isletim sistemi anahtar
 * zincirinde saklanacak).
 */
let accessToken: string | null = null;
export function setAccessToken(t: string | null): void {
  accessToken = t;
}
export function hasToken(): boolean {
  return accessToken !== null;
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

export async function api<T>(
  path: string,
  init: RequestInit & { serverUrl?: string } = {},
): Promise<T> {
  const root = init.serverUrl?.replace(/\/+$/, '') ?? baseUrl();
  const res = await fetch(`${root}/api/v1${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...init.headers,
    },
  });

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
