import { useEffect, useState } from 'react';
import { api, getConnection, clearConnection } from '../../services/api';
import { GRADE_LABEL, label } from '../../lib/labels';
import { DiscoveryPanel } from './DiscoveryPanel';
import { TemplateManager } from './TemplateManager';
import { AppUpdatePanel } from './AppUpdatePanel';

interface Rule {
  id: string;
  key: string;
  label: string;
  weight: number;
  enabled: boolean;
  sortOrder: number;
}

interface Stats {
  pool: {
    companies: number;
    withEmail: number;
    byGrade: Record<string, number>;
  };
  discovery: { totalSpentUsd: number };
}


export function SettingsScreen() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [dirty, setDirty] = useState<Record<string, Partial<Rule>>>({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null);
  const conn = getConnection();

  useEffect(() => {
    void Promise.all([api<Rule[]>('/lead-scoring/rules'), api<Stats>('/dashboard/stats')])
      .then(([r, s]) => {
        setRules(r);
        setStats(s);
      })
      .catch((e: Error) => setMessage({ kind: 'error', text: e.message }));
  }, []);

  /**
   * Erisilebilir en yuksek puan.
   *
   * Bunu gostermek sart: havuzun tamaminin sitesi yoksa site-sorunu
   * puanlari hic devreye girmez ve tavan 65'te kalir — yani "Sicak" (70)
   * esigi hicbir zaman asilamaz. Bu sayi olmadan kullanici sistemin
   * bozuk oldugunu sanir.
   */
  const view = rules.map((r) => ({ ...r, ...dirty[r.key] }));
  const websiteRules = ['no_website', 'broken_website', 'social_only', 'outdated_weak'];
  const bestWebsite = Math.max(
    0,
    ...view.filter((r) => websiteRules.includes(r.key) && r.enabled).map((r) => r.weight),
  );
  const others = view
    .filter((r) => !websiteRules.includes(r.key) && r.enabled)
    .reduce((s, r) => s + r.weight, 0);
  const ceiling = Math.min(100, bestWebsite + others);

  // Sitesi olmayan bir isletmenin gercekte alabilecegi tavan: site sorunu
  // puanlari (mobil/SSL/form) site gerektirdigi icin devre disi.
  const siteProblemKeys = ['not_responsive', 'ssl_problem', 'no_contact_form'];
  const noSiteCeiling = Math.min(
    100,
    (view.find((r) => r.key === 'no_website' && r.enabled)?.weight ?? 0) +
      view
        .filter((r) => !websiteRules.includes(r.key) && !siteProblemKeys.includes(r.key) && r.enabled)
        .reduce((s, r) => s + r.weight, 0),
  );

  function change(key: string, patch: Partial<Rule>): void {
    setDirty((d) => ({ ...d, [key]: { ...d[key], ...patch } }));
    setMessage(null);
  }

  async function save(): Promise<void> {
    const changed = Object.entries(dirty).map(([key, p]) => ({ key, ...p }));
    if (!changed.length) return;
    setSaving(true);
    try {
      const updated = await api<Rule[]>('/lead-scoring/rules', {
        method: 'PUT',
        body: JSON.stringify({ rules: changed }),
      });
      setRules(updated);
      setDirty({});
      setMessage({
        kind: 'ok',
        text: 'Ağırlıklar kaydedildi. Mevcut skorlar için “Havuzu yeniden puanla” deyin.',
      });
    } catch (e) {
      setMessage({ kind: 'error', text: e instanceof Error ? e.message : 'Kaydedilemedi' });
    } finally {
      setSaving(false);
    }
  }

  async function recalc(): Promise<void> {
    setSaving(true);
    setMessage(null);
    try {
      const r = await api<{ processed: number; changed: number }>('/lead-scoring/recalculate', {
        method: 'POST',
        body: JSON.stringify({}),
      });
      setMessage({
        kind: 'ok',
        text: `${r.processed.toLocaleString('tr')} işletme puanlandı, ${r.changed.toLocaleString('tr')} tanesinin skoru değişti.`,
      });
      setStats(await api<Stats>('/dashboard/stats'));
    } catch (e) {
      setMessage({ kind: 'error', text: e instanceof Error ? e.message : 'Puanlanamadı' });
    } finally {
      setSaving(false);
    }
  }

  const hasChanges = Object.keys(dirty).length > 0;

  return (
    <div className="settings">
      <section className="panel">
        <h2>Lead puanlaması</h2>
        <p className="panel-lede">
          Bir işletmenin ne kadar sıcak olduğunu bu ağırlıklar belirler. Değiştirdikten sonra
          havuzu yeniden puanlamanız gerekir.
        </p>

        {message && <div className={`notice ${message.kind}`}>{message.text}</div>}

        {/* Tavan uyarisi — sistemin neden 'Sicak' lead uretmedigini aciklar */}
        {stats && stats.pool.byGrade.HOT === 0 && stats.pool.byGrade.VERY_HOT === 0 && (
          <div className="notice warn">
            Havuzun tamamının sitesi yok. Site sorunu puanları (mobil uyumsuzluk, SSL,
            iletişim formu) bir site gerektirdiği için devreye girmiyor. Erişilebilir
            en yüksek skor bu yüzden {noSiteCeiling}. “Sıcak” eşiği 70 olduğu sürece
            hiçbir kayıt sıcak görünmez. Ağırlıkları artırıp eşiği yakalayabilir ya da
            sitesi olan işletmeleri de tarayabilirsiniz.
          </div>
        )}

        <table className="rules">
          <thead>
            <tr>
              <th>Kural</th>
              <th style={{ width: 92, textAlign: 'right' }}>Puan</th>
              <th style={{ width: 70, textAlign: 'center' }}>Açık</th>
            </tr>
          </thead>
          <tbody>
            {view.map((r) => (
              <tr key={r.key} className={dirty[r.key] ? 'changed' : ''}>
                <td>
                  <span className={r.enabled ? '' : 'off'}>{r.label}</span>
                </td>
                <td style={{ textAlign: 'right' }}>
                  <input
                    className="weight"
                    type="number"
                    min={0}
                    max={100}
                    value={r.weight}
                    disabled={!r.enabled}
                    onChange={(e) => change(r.key, { weight: Number(e.target.value) })}
                  />
                </td>
                <td style={{ textAlign: 'center' }}>
                  <input
                    type="checkbox"
                    checked={r.enabled}
                    onChange={(e) => change(r.key, { enabled: e.target.checked })}
                    aria-label={`${r.label} kuralını aç/kapat`}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="ceiling">
          Erişilebilir en yüksek skor: <strong>{ceiling}</strong>
          <span className="ceiling-note">
            · sitesi olmayan bir işletme için <strong>{noSiteCeiling}</strong>
          </span>
        </div>

        <div className="actions">
          <button className="btn" style={{ width: 'auto', padding: '0 18px' }} onClick={() => void save()} disabled={!hasChanges || saving}>
            {saving ? 'Kaydediliyor…' : 'Ağırlıkları kaydet'}
          </button>
          <button
            className="btn secondary"
            style={{ width: 'auto', padding: '0 18px' }}
            onClick={() => void recalc()}
            disabled={saving}
          >
            Havuzu yeniden puanla
          </button>
        </div>
      </section>

      <section className="panel">
        <h2>Havuz</h2>
        {stats ? (
          <table className="rules">
            <tbody>
              <tr>
                <td>İşletme</td>
                <td style={{ textAlign: 'right' }}>
                  <strong>{stats.pool.companies.toLocaleString('tr')}</strong>
                </td>
              </tr>
              <tr>
                <td>E-posta adresi bulunan</td>
                <td style={{ textAlign: 'right' }}>
                  <strong>{stats.pool.withEmail.toLocaleString('tr')}</strong>
                </td>
              </tr>
              {Object.entries(stats.pool.byGrade).map(([g, n]) => (
                <tr key={g}>
                  <td>
                    <span className={`grade-dot grade-${g}`} /> {label(GRADE_LABEL, g)}
                  </td>
                  <td style={{ textAlign: 'right' }}>{n.toLocaleString('tr')}</td>
                </tr>
              ))}
              <tr>
                <td>Keşif için harcanan</td>
                <td style={{ textAlign: 'right' }}>
                  ${stats.discovery.totalSpentUsd.toFixed(2)}
                </td>
              </tr>
            </tbody>
          </table>
        ) : (
          <div className="skeleton" style={{ height: 120, borderRadius: 8 }} />
        )}
      </section>

      <TemplateManager />

      <DiscoveryPanel />

      <AppUpdatePanel />

      <section className="panel">
        <h2>Sunucu</h2>
        <table className="rules">
          <tbody>
            <tr>
              <td>Bağlı sunucu</td>
              <td style={{ textAlign: 'right' }}>
                <code>{conn?.serverUrl ?? '—'}</code>
              </td>
            </tr>
            <tr>
              <td>Adı</td>
              <td style={{ textAlign: 'right' }}>{conn?.serverName ?? '—'}</td>
            </tr>
          </tbody>
        </table>
        <div className="actions">
          <button
            className="btn secondary"
            style={{ width: 'auto', padding: '0 18px' }}
            onClick={() => {
              clearConnection();
              location.reload();
            }}
          >
            Başka sunucuya bağlan
          </button>
        </div>
      </section>
    </div>
  );
}
