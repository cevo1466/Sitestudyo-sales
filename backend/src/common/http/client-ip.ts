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
export function clientIp(req: {
  headers?: Record<string, unknown>;
  ip?: string;
  socket?: { remoteAddress?: string };
}): string | undefined {
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
