import { useEffect, useState } from 'react';

/**
 * Guncelleme dugmesi.
 *
 * Yalnizca masaustu uygulamasinda gorunur — tarayicida calisirken
 * guncellenecek bir sey yok. Guncelleme VARSA gorunur, yoksa hic
 * cizilmez: her acilista "guncel" yazan bir rozet gurultuden ibaret.
 */
type State = 'idle' | 'checking' | 'available' | 'downloading' | 'ready' | 'error';

interface UpdateInfo {
  version: string;
  notes?: string;
}

// Tauri'nin eklentileri yalnizca masaustunde var; tarayicida import
// denemesi hata verir, bu yuzden calisma zamaninda yukluyoruz.
function isDesktop(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
}

export function UpdateButton() {
  const [state, setState] = useState<State>('idle');
  const [info, setInfo] = useState<UpdateInfo | null>(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isDesktop()) return;
    let dead = false;

    void (async () => {
      setState('checking');
      try {
        const { check } = await import('@tauri-apps/plugin-updater');
        const update = await check();
        if (dead) return;
        if (update) {
          setInfo({ version: update.version, notes: update.body });
          setState('available');
        } else {
          setState('idle');
        }
      } catch (e) {
        if (dead) return;
        // Guncelleme sunucusuna ulasilamamasi kullaniciyi ilgilendirmez;
        // sessizce geciyoruz, uygulamayi kullanmaya devam edebilir.
        setState('idle');
        setError(e instanceof Error ? e.message : null);
      }
    })();

    return () => {
      dead = true;
    };
  }, []);

  async function install(): Promise<void> {
    setState('downloading');
    setProgress(0);
    try {
      const { check } = await import('@tauri-apps/plugin-updater');
      const { relaunch } = await import('@tauri-apps/plugin-process');
      const update = await check();
      if (!update) {
        setState('idle');
        return;
      }

      let total = 0;
      let got = 0;
      await update.downloadAndInstall((ev) => {
        if (ev.event === 'Started') total = ev.data.contentLength ?? 0;
        else if (ev.event === 'Progress') {
          got += ev.data.chunkLength;
          if (total > 0) setProgress(Math.round((got / total) * 100));
        } else if (ev.event === 'Finished') setState('ready');
      });

      // Kurulum bitti; yeni surumle acilmasi icin yeniden baslatiyoruz.
      await relaunch();
    } catch (e) {
      setState('error');
      setError(e instanceof Error ? e.message : 'Güncelleme başarısız');
    }
  }

  if (!isDesktop() || state === 'idle' || state === 'checking') return null;

  if (state === 'error') {
    return (
      <button className="update-btn err" title={error ?? ''} onClick={() => setState('available')}>
        Güncelleme başarısız
      </button>
    );
  }

  if (state === 'downloading' || state === 'ready') {
    return (
      <span className="update-btn busy">
        {state === 'ready' ? 'Yeniden başlatılıyor…' : `İndiriliyor %${progress}`}
      </span>
    );
  }

  return (
    <button
      className="update-btn"
      onClick={() => void install()}
      title={info?.notes ?? 'Yeni sürüm hazır'}
    >
      Güncelle → {info?.version}
    </button>
  );
}
