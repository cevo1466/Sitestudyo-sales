import { useEffect, useState } from 'react';
import { api } from '../../services/api';

interface Coverage {
  done: number;
  total: number;
  percent: number;
}
interface AutoStatus {
  accounts: { account: string; usedUsd: number; limitUsd: number; remainingUsd: number }[];
  progress: {
    withoutWebsite: Coverage;
    withWebsite: Coverage;
    includeWithWebsite: boolean;
  };
}

/**
 * Otomatik kesif paneli.
 *
 * Buradaki tek gercek karar su: sitesi OLAN isletmeler de taransin mi?
 *
 * Kapaliyken havuza yalnizca sitesiz isletmeler girer. Bu kayitlarda
 * analiz edilecek bir adres olmadigi icin site analizoru ve iletisim
 * tarayicisi hic calismaz, puan tavani da 75'te kalir — "Sicak" esigi 70
 * olsa bile gercekten sicak bir lead olusmaz.
 *
 * Acildiginda ayni sehir/sektor izgarasi ikinci kez, filtresiz taranir.
 * Bozuk, eski veya mobil uyumsuz siteler cikar; bunlar sitesi hic
 * olmayanlardan daha sicak olabilir cunku o isletme dijitale zaten
 * para harciyor demektir.
 */
export function DiscoveryPanel() {
  const [data, setData] = useState<AutoStatus | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function load(): void {
    api<AutoStatus>('/discovery/auto/status')
      .then(setData)
      .catch((e: Error) => setError(e.message));
  }

  useEffect(load, []);

  async function toggle(enabled: boolean): Promise<void> {
    setBusy(true);
    setError(null);
    try {
      await api('/discovery/auto/include-with-website', {
        method: 'POST',
        body: JSON.stringify({ enabled }),
      });
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Kaydedilemedi');
    } finally {
      setBusy(false);
    }
  }

  if (error) return <section className="panel"><h2>Otomatik keşif</h2><div className="notice error">{error}</div></section>;
  if (!data) return <section className="panel"><h2>Otomatik keşif</h2><div className="skeleton" style={{ height: 120, borderRadius: 8 }} /></section>;

  const { withoutWebsite, withWebsite, includeWithWebsite } = data.progress;
  const credit = data.accounts.reduce((s, a) => s + a.remainingUsd, 0);

  return (
    <section className="panel">
      <h2>Otomatik keşif</h2>
      <p className="panel-lede">
        Her sabah 09:17’de kredi kontrol edilir; varsa sıradaki taranmamış şehir ve
        sektör kümesi çekilir. Aynı arama iki kez, aynı işletme iki kez çekilmez.
      </p>

      <table className="rules">
        <tbody>
          <tr>
            <td>Kalan kredi</td>
            <td style={{ textAlign: 'right' }}>
              <strong>${credit.toFixed(2)}</strong>
              {credit <= 0.25 && <span className="muted"> — yenilenmesi bekleniyor</span>}
            </td>
          </tr>
          <tr>
            <td>Sitesi olmayanlar taraması</td>
            <td style={{ textAlign: 'right' }}>
              {withoutWebsite.done} / {withoutWebsite.total} (%{withoutWebsite.percent})
            </td>
          </tr>
          <tr>
            <td>Sitesi olanlar taraması</td>
            <td style={{ textAlign: 'right' }}>
              {withWebsite.done} / {withWebsite.total} (%{withWebsite.percent})
            </td>
          </tr>
        </tbody>
      </table>

      <label className="switch-row">
        <input
          type="checkbox"
          checked={includeWithWebsite}
          disabled={busy}
          onChange={(e) => void toggle(e.target.checked)}
        />
        <span>
          <strong>Sitesi olan işletmeleri de tara</strong>
          <span className="switch-note">
            Şu an havuzun tamamının sitesi yok, bu yüzden site analizörü hiç
            çalışmıyor ve puan tavanı 75’te kalıyor. Bunu açarsan bozuk ve eski
            siteler de bulunur — <strong>gerçek “sıcak” leadler ancak böyle oluşur.</strong>
          </span>
        </span>
      </label>
    </section>
  );
}
