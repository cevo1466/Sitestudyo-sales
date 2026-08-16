/**
 * Gercek ziyaretci IP'si.
 *
 * Istekler once Cloudflare'dan, sonra sunucudaki `hosting_nginx`ten geciyor.
 * `req.ip` bu yuzden nginx konteynerinin adresi (172.19.0.6) olur ve oran
 * sinirlama TEK bir sayaca duser — yani herkes birbirinin kotasini yer.
 *
 * Sira onemli: nginx vhost'u `real_ip_header CF-Connecting-IP` ile
 * X-Forwarded-For'un basina gercek IP'yi koyuyor, o yuzden ilk siradaki
 * degeri aliyoruz.
 */
/**
 * Istek nesnesinden IP okumak icin gereken EN AZ sekil.
 *
 * Fastify'in tam `FastifyRequest` tipini denetleyicilere yaymak yerine
 * bunu kullaniyoruz: denetleyicilerin istekten baska bir sey okumasi
 * gerekmiyor ve `any` yazmak butun alanlari sessizce actigi icin
 * tehlikeliydi.
 */
export interface IpBearingRequest {
  headers?: Record<string, unknown>;
  ip?: string;
  socket?: { remoteAddress?: string };
}

export function clientIp(req: IpBearingRequest): string | undefined {
  const headers = req.headers ?? {};

  const cf = headers['cf-connecting-ip'];
  if (typeof cf === 'string' && cf) return cf.trim();

  const xff = headers['x-forwarded-for'];
  if (typeof xff === 'string' && xff) {
    const first = xff.split(',')[0]?.trim();
    if (first) return first;
  }

  const real = headers['x-real-ip'];
  if (typeof real === 'string' && real) return real.trim();

  return req.ip ?? req.socket?.remoteAddress;
}

/**
 * User-Agent basligini metin olarak dondurur.
 *
 * Basliklar `unknown` cunku Fastify ayni basligi birden fazla kez
 * gorurse dizi veriyor. Ilk degeri aliyoruz; denetim kaydina yazilan
 * sey her zaman duz metin olsun.
 */
export function userAgent(req: IpBearingRequest): string | undefined {
  const raw = req.headers?.['user-agent'];
  const value = Array.isArray(raw) ? raw[0] : raw;
  return typeof value === 'string' ? value : undefined;
}
