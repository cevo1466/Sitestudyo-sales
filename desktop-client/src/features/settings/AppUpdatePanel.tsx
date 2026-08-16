import { useEffect, useState } from 'react';

/**
 * Uygulama surumu ve guncelleme paneli.
 *
 * UpdateButton yalnizca bekleyen bir guncelleme VARSA cizilir; bu yuzden
 * kullanici ozelligin var oldugunu goremiyor ve "her seferinde sildim,
 * yeniden mi kuracagim" diye soruyor. Bu panel Ayarlar ekraninda HER ZAMAN
 * durur: kurulu surumu gosterir, denetlemeyi kullaniciya birakir ve
 * guncellemenin yerinde yapildigini acikca yazar.
 */

// Tauri eklentileri yalnizca masaustunde var; tarayicida ust seviye import
// patlar. Bu yuzden hepsi calisma zamaninda await import ile yukleniyor.
function isDesktop(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
}

type Phase =
  | 'idle' // henuz denetlenmedi
  | 'checking'
  | 'available'
  | 'uptodate'
  | 'downloading'
  | 'installed' // kurulum bitti, yeniden baslatiliyor
  | 'unreachable' // sunucuya ulasilamadi (guncelleme yok DEGIL)
  | 'failed'; // indirme/kurulum hatasi

interface Available {
  version: string;
  notes: string | null;
}

// Ham hata metnini title icin sakliyoruz; kullaniciya sade cumle gosteriyoruz.
function rawMessage(e: unknown): string {
  if (e instanceof Error) return e.message;
  if (typeof e === 'string') return e;
  return String(e);
}

export function AppUpdatePanel() {
  const [version, setVersion] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>('idle');
  const [update, setUpdate] = useState<Available | null>(null);
  const [percent, setPercent] = useState(0);
  const [raw, setRaw] = useState<string | null>(null);

  const desktop = isDesktop();

  useEffect(() => {
    if (!desktop) return;
    let dead = false;

    void (async () => {
      try {
        const { getVersion } = await import('@tauri-apps/api/app');
        const v = await getVersion();
        if (!dead) setVersion(v);
      } catch {
        // Surum okunamazsa panel yine calisir, sadece numara gorunmez.
        if (!dead) setVersion(null);
      }
    })();

    return () => {
      dead = true;
    };
  }, [desktop]);

  async function checkForUpdate(): Promise<void> {
    setPhase('checking');
    setRaw(null);
    setUpdate(null);
    try {
      const { check } = await import('@tauri-apps/plugin-updater');
      const found = await check();
      if (found) {
        setUpdate({ version: found.version, notes: found.body ?? null });
        setPhase('available');
      } else {
        setPhase('uptodate');
      }
    } catch (e) {
      // Buraya dusmek "guncelleme yok" demek degil: sunucuya hic
      // ulasilamadi. Ikisini ayri gostermek zorundayiz.
      setRaw(rawMessage(e));
      setPhase('unreachable');
    }
  }

  async function installUpdate(): Promise<void> {
    setPhase('downloading');
    setPercent(0);
    setRaw(null);
    try {
      const { check } = await import('@tauri-apps/plugin-updater');
      const { relaunch } = await import('@tauri-apps/plugin-process');

      // Update nesnesi tasinabilir degil; indirmeden hemen once tazeliyoruz.
      const found = await check();
      if (!found) {
        setUpdate(null);
        setPhase('uptodate');
        return;
      }

      let total = 0;
      let received = 0;
      await found.downloadAndInstall((ev) => {
        if (ev.event === 'Started') {
          total = ev.data.contentLength ?? 0;
        } else if (ev.event === 'Progress') {
          received += ev.data.chunkLength;
          if (total > 0) setPercent(Math.round((received / total) * 100));
        } else if (ev.event === 'Finished') {
          setPercent(100);
        }
      });

      setPhase('installed');
      // Yeni surumle acilmasi icin uygulamayi yeniden baslatiyoruz.
      await relaunch();
    } catch (e) {
      setRaw(rawMessage(e));
      setPhase('failed');
    }
  }

  if (!desktop) {
    return (
      <section className="panel">
        <h2>Uygulama sürümü</h2>
        <p className="panel-lede">
          Güncelleme yalnızca bilgisayara kurulan masaüstü uygulamasında geçerlidir.
          Tarayıcıdan açtığınızda her zaman en son sürümü görürsünüz.
        </p>
      </section>
    );
  }

  const busy = phase === 'checking' || phase === 'downloading' || phase === 'installed';

  return (
    <section className="panel">
      <h2>Uygulama sürümü</h2>
      <p className="panel-lede">
        Güncelleme uygulamanın içinde yapılır: yeni sürüm indirilir, kurulur ve
        uygulama yeniden başlar. Uygulamayı silip baştan kurmanız gerekmez.
      </p>

      <table className="rules">
        <tbody>
          <tr>
            <td>Kurulu sürüm</td>
            <td style={{ textAlign: 'right' }}>
              {version ? (
                <strong>{version}</strong>
              ) : (
                <span className="muted">okunamadı</span>
              )}
            </td>
          </tr>
          <tr>
            <td>Durum</td>
            <td style={{ textAlign: 'right' }}>
              {phase === 'idle' && <span className="muted">denetlenmedi</span>}
              {phase === 'checking' && <span className="muted">denetleniyor…</span>}
              {phase === 'uptodate' && <span>En güncel sürümü kullanıyorsunuz</span>}
              {phase === 'available' && <strong>Yeni sürüm: {update?.version}</strong>}
              {phase === 'downloading' && <span>İndiriliyor %{percent}</span>}
              {phase === 'installed' && <span>Kuruldu, yeniden başlatılıyor…</span>}
              {phase === 'unreachable' && (
                <span className="muted">güncelleme sunucusuna ulaşılamadı</span>
              )}
              {phase === 'failed' && <span className="muted">güncelleme tamamlanamadı</span>}
            </td>
          </tr>
        </tbody>
      </table>

      {phase === 'available' && update?.notes && (
        <div className="ceiling">
          <span className="ceiling-note">Bu sürümde:</span> {update.notes}
        </div>
      )}

      {phase === 'unreachable' && (
        <div className="notice error" title={raw ?? undefined}>
          Güncelleme sunucusuna ulaşılamadı. İnternet bağlantınızı kontrol edip
          tekrar deneyin. Bu, güncelleme olmadığı anlamına gelmez.
        </div>
      )}

      {phase === 'failed' && (
        <div className="notice error" title={raw ?? undefined}>
          Güncelleme indirilemedi veya kurulamadı. Uygulamayı kapatıp yeniden
          açtıktan sonra tekrar deneyin; kurulu sürümünüz olduğu gibi duruyor.
        </div>
      )}

      <div className="actions">
        <button
          className="btn secondary"
          disabled={busy}
          onClick={() => void checkForUpdate()}
        >
          {phase === 'checking' ? 'Denetleniyor…' : 'Güncellemeleri denetle'}
        </button>

        {(phase === 'available' || phase === 'downloading' || phase === 'installed') && (
          <button className="btn" disabled={busy} onClick={() => void installUpdate()}>
            {phase === 'downloading'
              ? `İndiriliyor %${percent}`
              : phase === 'installed'
                ? 'Yeniden başlatılıyor…'
                : 'Güncelle ve yeniden başlat'}
          </button>
        )}
      </div>
    </section>
  );
}

// Not: Yeni CSS eklenmedi; panel tamamen mevcut siniflarla kuruldu
// (panel, panel-lede, rules, ceiling/ceiling-note, notice error, actions,
// btn, btn secondary, muted). Ilerleme cubugu icin ayri bir sinif yok,
// yuzde metin olarak gosteriliyor. Gorsel bir cubuk istenirse app.css'e
// ".update-progress" + ".update-progress > span" eklenmesi gerekir.
