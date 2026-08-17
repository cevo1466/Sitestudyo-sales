import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../../services/api';
import { WhatsAppPanel, type Message } from '../companies/WhatsAppPanel';

/**
 * Gunluk calisma kuyrugu.
 *
 * SORUN: 2.045 kayitlik listede her sabah "bugun kiminle konusacagim"
 * elle bulunuyordu — is yapmadan once yapilan is. Bu ekran tek soruyu
 * cevapliyor: SIRADAKI.
 *
 * Metinler sunucuda TOPLU uretiliyor (tek istek), yani kart degistirince
 * beklemek yok. Gonderme yine elle: WhatsApp aciliyor, gonder tusuna
 * kullanici basiyor.
 */

interface QueueItem {
  companyId: string;
  name: string;
  district: string | null;
  city: string | null;
  phone: string | null;
  phoneE164: string | null;
  phoneKind: 'mobile' | 'landline' | 'none';
  leadScore: number;
  leadGrade: 'VERY_HOT' | 'HOT' | 'WARM' | 'LOW';
  recommendedKey: string | null;
  messages: Message[];
}

interface QueueResponse {
  items: QueueItem[];
  total: number;
  doneToday: number;
}

/**
 * Kalinan yerin saklandigi anahtar.
 *
 * Icinde GUN ve FILTRE var: gun degisince kuyruk bastan basliyor, filtre
 * degisince de. Yoksa dunun sirasi bugunun listesine uygulanir ve
 * kullanici hic gormedigi kayitlarin ustunden atlar.
 */
function progressKey(params: string): string {
  // YEREL gun, UTC degil: sunucu da kuyrugu yerel gun basina gore kuruyor.
  // toISOString kullanilsa Turkiye'de gece yarisi ile 03:00 arasinda
  // kuyruk yenilenirken kalinan yer yenilenmiyordu.
  const now = new Date();
  const day = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
  return `salesos.queue.v1:${day}:${params}`;
}

/**
 * Tek kartin WhatsApp paneli.
 *
 * Ayri bilesen olmasinin sebebi `useMemo`: hazir metin nesnesi her
 * cizimde yeniden kurulursa panel onu "yeni veri" sanip metin kutusunu
 * sifirlar ve kullanicinin elle yaptigi duzeltme kaybolur.
 */
function QueueCard({ item, onSent }: { item: QueueItem; onSent: () => void }) {
  const preloaded = useMemo(
    () => ({
      companyId: item.companyId,
      name: item.name,
      phone: item.phone,
      phoneE164: item.phoneE164,
      phoneKind: item.phoneKind,
      // Engelli numaralar kuyruk kurulurken SUNUCUDA ayiklandi; buraya
      // gelen hicbir kayit "bir daha yazma" listesinde degil.
      blocked: false,
      blockedReason: null,
      messages: item.messages,
    }),
    [item],
  );
  return <WhatsAppPanel companyId={item.companyId} preloaded={preloaded} onSent={onSent} />;
}

export function QueueScreen({ initialParams = '' }: { initialParams?: string }) {
  const [data, setData] = useState<QueueResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [index, setIndex] = useState(0);
  const [done, setDone] = useState<Set<string>>(new Set());
  const [reloadKey, setReloadKey] = useState(0);

  const params = useMemo(() => {
    const p = new URLSearchParams(initialParams);
    if (!p.has('limit')) p.set('limit', '20');
    return p.toString();
  }, [initialParams]);

  useEffect(() => {
    let dead = false;
    setData(null);
    setError(null);
    api<QueueResponse>(`/outreach/queue?${params}`)
      .then((d) => {
        if (dead) return;
        setData(d);
        // Kalinan yeri geri getir; liste kisaldiysa sona sabitle.
        const saved = Number(window.localStorage.getItem(progressKey(params)) ?? 0);
        setIndex(Math.min(Number.isFinite(saved) ? saved : 0, Math.max(d.items.length - 1, 0)));
      })
      .catch((e: Error) => !dead && setError(e.message));
    return () => {
      dead = true;
    };
  }, [params, reloadKey]);

  const go = useCallback(
    (delta: number) => {
      setIndex((i) => {
        const next = Math.min(Math.max(i + delta, 0), Math.max((data?.items.length ?? 1) - 1, 0));
        window.localStorage.setItem(progressKey(params), String(next));
        return next;
      });
    },
    [data, params],
  );

  // Klavye: sag/sol ok ile ilerle. Metin kutusundayken devre disi —
  // mesaji duzenlerken imleci saga tasimak kayit atlatmamali.
  useEffect(() => {
    function onKey(e: KeyboardEvent): void {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === 'TEXTAREA' || t.tagName === 'INPUT')) return;
      if (e.key === 'ArrowRight') go(1);
      if (e.key === 'ArrowLeft') go(-1);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [go]);

  if (error) {
    return (
      <div className="workspace">
        <main className="main">
          <div className="empty">
            <h2>Kuyruk yüklenemedi</h2>
            <p>{error}</p>
          </div>
        </main>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="workspace">
        <main className="main">
          <div className="skeleton" style={{ height: 320 }} />
        </main>
      </div>
    );
  }

  if (!data.items.length) {
    return (
      <div className="workspace">
        <main className="main">
          <div className="empty">
            <h2>Bugünlük kuyruk boş</h2>
            <p>
              {data.doneToday > 0
                ? `Bugün ${data.doneToday} işletmeyle temas kurdunuz. Bu filtreye uyan başka kayıt kalmadı.`
                : 'Bu filtreye uyan, bugün temas edilmemiş cep telefonlu işletme yok. İşletmeler ekranından filtreyi genişletip yeniden kuyruk hazırlayabilirsiniz.'}
            </p>
          </div>
        </main>
      </div>
    );
  }

  const item = data.items[index];

  return (
    <div className="workspace">
      <main className="main">
        <p className="summary">
          Kuyrukta <strong>{index + 1}</strong> / {data.items.length}
          {data.total > data.items.length && <> (filtreye uyan {data.total.toLocaleString('tr')})</>}
          {' · '}bugün <strong>{data.doneToday}</strong> temas
        </p>

        <div className="queue-card">
          <div className="queue-head">
            <div>
              <h2 className="queue-name">{item.name}</h2>
              <p className="queue-meta">
                {[item.district, item.city].filter(Boolean).join(' · ') || '—'}
              </p>
            </div>
            <span className={`score grade-${item.leadGrade}`} title={`Sınıf: ${item.leadGrade}`}>
              {item.leadScore}
            </span>
          </div>

          <QueueCard
            item={item}
            onSent={() => setDone((prev) => new Set(prev).add(item.companyId))}
          />

          <div className="queue-actions">
            <button
              className="btn secondary"
              style={{ width: 'auto', padding: '0 14px' }}
              onClick={() => go(-1)}
              disabled={index === 0}
            >
              ← Geri
            </button>
            <button
              className="btn"
              style={{ width: 'auto', padding: '0 18px' }}
              onClick={() => go(1)}
              disabled={index >= data.items.length - 1}
            >
              {done.has(item.companyId) ? 'Sıradaki →' : 'Atla →'}
            </button>
            <button
              className="btn secondary"
              style={{ width: 'auto', padding: '0 14px' }}
              onClick={() => {
                window.localStorage.removeItem(progressKey(params));
                setIndex(0);
                setReloadKey((k) => k + 1);
              }}
            >
              Kuyruğu yenile
            </button>
          </div>

          <p className="wa-hint">
            Sağ/sol ok tuşlarıyla da ilerleyebilirsiniz. Kaldığınız yer bugün
            için saklanıyor; yarın kuyruk baştan kurulur.
          </p>
        </div>
      </main>
    </div>
  );
}
