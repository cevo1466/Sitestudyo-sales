import { redact } from './redact';

describe('redact', () => {
  it('hassas alanlari maskeler', () => {
    const out = redact({
      email: 'a@b.com',
      password: 'gizli123',
      refreshToken: 'rt_abc',
      apiKey: 'apify_api_xxx',
    }) as Record<string, unknown>;

    expect(out.email).toBe('a@b.com');
    expect(out.password).toBe('***');
    expect(out.refreshToken).toBe('***');
    expect(out.apiKey).toBe('***');
  });

  it('alan adinin buyuk/kucuk harfine bakmaz', () => {
    const out = redact({ PASSWORD: 'x', Authorization: 'Bearer y' }) as Record<string, unknown>;
    expect(out.PASSWORD).toBe('***');
    expect(out.Authorization).toBe('***');
  });

  it('ic ice nesnelerde de maskeler', () => {
    const out = redact({
      user: { name: 'Melih', password: 'gizli' },
      mail: { smtpUser: 'a@b.com', smtpPassword: 'gizli' },
    }) as Record<string, Record<string, string>>;
    expect(out.user.name).toBe('Melih');
    expect(out.user.password).toBe('***');
    expect(out.mail.smtpPassword).toBe('***');
  });

  it('dizilerin icine girer', () => {
    const out = redact([{ token: 'a' }, { token: 'b' }]) as Record<string, string>[];
    expect(out.map((o) => o.token)).toEqual(['***', '***']);
  });

  it('Buffer icerigini loga yazmaz', () => {
    const out = redact({ secretEnc: Buffer.from('sifreli') }) as Record<string, unknown>;
    expect(out.secretEnc).toBe('***');
  });

  it('dairesel olmayan derin yapida sonsuz donmez', () => {
    let deep: Record<string, unknown> = { password: 'x' };
    for (let i = 0; i < 20; i++) deep = { nested: deep };
    expect(() => redact(deep)).not.toThrow();
  });

  it('null ve undefined degerleri korur', () => {
    const out = redact({ a: null, b: undefined, c: 0, d: false }) as Record<string, unknown>;
    expect(out).toEqual({ a: null, b: undefined, c: 0, d: false });
  });
});
