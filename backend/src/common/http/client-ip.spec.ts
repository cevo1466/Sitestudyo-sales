import { clientIp } from './client-ip';

describe('clientIp', () => {
  it('CF-Connecting-IP varsa onu tercih eder', () => {
    expect(
      clientIp({
        headers: { 'cf-connecting-ip': '1.2.3.4', 'x-forwarded-for': '9.9.9.9' },
        ip: '172.19.0.6',
      }),
    ).toBe('1.2.3.4');
  });

  it('X-Forwarded-For zincirinden ILK adresi alir', () => {
    // Zincir: gercek istemci, ara proxy'ler. Sondaki en yakin proxy'dir.
    expect(clientIp({ headers: { 'x-forwarded-for': '1.2.3.4, 10.0.0.1, 172.19.0.6' } })).toBe(
      '1.2.3.4',
    );
  });

  it('baslik yoksa req.ip degerine duser', () => {
    expect(clientIp({ headers: {}, ip: '5.6.7.8' })).toBe('5.6.7.8');
  });

  it('req.ip de yoksa soket adresine duser', () => {
    expect(clientIp({ headers: {}, socket: { remoteAddress: '7.7.7.7' } })).toBe('7.7.7.7');
  });

  it('hicbir kaynak yoksa undefined doner (patlamaz)', () => {
    expect(clientIp({})).toBeUndefined();
  });

  it('bos baslik degerini yok sayar', () => {
    expect(clientIp({ headers: { 'x-forwarded-for': '' }, ip: '5.6.7.8' })).toBe('5.6.7.8');
  });
});
