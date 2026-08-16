import { useState } from 'react';
import { api, saveConnection, type HealthInfo } from '../../services/api';

/**
 * Ilk acilis: kullanici KENDI sunucusunun adresini girer.
 *
 * Adres uygulamaya gomulu gelmiyor; ayni kurulum dosyasi herkeste
 * calisiyor ve herkes kendi VDS'ine baglaniyor. Baglanti dogrulanmadan
 * giris ekrani acilmiyor — yanlis adresle "sifre hatali" hatasi almak
 * kullaniciyi yanlis yere baktirirdi.
 */
export function ConnectionScreen({ onReady }: { onReady: () => void }) {
  const [url, setUrl] = useState('https://api.sitestudyo.com');
  const [state, setState] = useState<'idle' | 'testing' | 'ok'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [server, setServer] = useState<string | null>(null);

  async function test(): Promise<void> {
    setState('testing');
    setError(null);
    try {
      const h = await api<HealthInfo>('/health', { serverUrl: url });
      setServer(h.serverName);
      setState('ok');
      saveConnection({ serverUrl: url, serverName: h.serverName });
    } catch (e) {
      setState('idle');
      setError(
        e instanceof Error
          ? `Sunucuya ulaşılamadı. Adresi ve sunucunun çalıştığını kontrol edin. (${e.message})`
          : 'Sunucuya ulaşılamadı.',
      );
    }
  }

  return (
    <div className="gate">
      <div className="gate-card">
        <h1>Sunucunuza bağlanın</h1>
        <p className="lede">
          Sales OS kendi sunucunuzda çalışır. Adresi bir kez girin, bu bilgisayara kaydedilsin.
        </p>

        {error && <div className="notice error">{error}</div>}
        {state === 'ok' && server && (
          <div className="notice ok">Bağlandı: {server}</div>
        )}

        <div className="field">
          <label htmlFor="url">Sunucu adresi</label>
          <input
            id="url"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              setState('idle');
            }}
            placeholder="https://api.sitestudyo.com"
            spellCheck={false}
            autoFocus
          />
          <div className="hint">Örnek: https://api.sitestudyo.com veya http://185.48.180.25:5080</div>
        </div>

        {state === 'ok' ? (
          <button className="btn" onClick={onReady}>
            Girişe devam et
          </button>
        ) : (
          <button className="btn" onClick={test} disabled={state === 'testing' || !url.trim()}>
            {state === 'testing' ? 'Bağlanılıyor…' : 'Bağlantıyı test et'}
          </button>
        )}
      </div>
    </div>
  );
}
