import { parseTtlMs } from './auth.service';

describe('parseTtlMs', () => {
  it('birimleri dogru cevirir', () => {
    expect(parseTtlMs('30s')).toBe(30_000);
    expect(parseTtlMs('15m')).toBe(900_000);
    expect(parseTtlMs('2h')).toBe(7_200_000);
    expect(parseTtlMs('30d')).toBe(2_592_000_000);
  });

  it('birimsiz degeri saniye sayar', () => {
    expect(parseTtlMs('3600')).toBe(3_600_000);
  });

  it('bostuklari tolere eder', () => {
    expect(parseTtlMs(' 15m ')).toBe(900_000);
  });

  it('gecersiz bicimde sessizce yanlis deger DONMEZ, hata firlatir', () => {
    // Sessizce 0 donmesi, refresh token'i aninda suresi dolmus yapardi.
    expect(() => parseTtlMs('15dakika')).toThrow(/Gecersiz TTL/);
    expect(() => parseTtlMs('')).toThrow();
    expect(() => parseTtlMs('m15')).toThrow();
  });
});
