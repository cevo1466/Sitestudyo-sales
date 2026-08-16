import { useEffect, useState } from 'react';
import { api } from '../../services/api';

interface Message {
  key: string;
  label: string;
  text: string;
  recommended: boolean;
  url: string | null;
}
interface Outreach {
  companyId: string;
  name: string;
  phone: string | null;
  phoneE164: string | null;
  phoneKind: 'mobile' | 'landline' | 'none';
  blocked: boolean;
  blockedReason: string | null;
  messages: Message[];
}

/**
 * WhatsApp temas paneli.
 *
 * Uc kademeli uyari, cunku bir numaranin WhatsApp'ta kayitli olup
 * olmadigini ONCEDEN ogrenmenin yolu yok — WhatsApp boyle bir sorgu
 * vermiyor. Yapabilecegimiz tek durust sey numaranin TURUNU soylemek:
 * cep hatlari neredeyse her zaman WhatsApp'li, sabit hatlar degil.
 * Havuzun ucte biri sabit hat oldugu icin bu uyari onemli.
 */
export function WhatsAppPanel({
  companyId,
  onSent,
}: {
  companyId: string;
  onSent: () => void;
}) {
  const [data, setData] = useState<Outreach | null>(null);
  const [picking, setPicking] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let dead = false;
    api<Outreach>(`/outreach/company/${companyId}/messages`)
      .then((d) => {
        if (dead) return;
        setData(d);
        setSelected(d.messages.find((m) => m.recommended)?.key ?? d.messages[0]?.key ?? null);
      })
      .catch((e: Error) => !dead && setError(e.message));
    return () => {
      dead = true;
    };
  }, [companyId]);

  if (error) return <div className="notice error">{error}</div>;
  if (!data) return <div className="skeleton" style={{ height: 64, borderRadius: 8 }} />;

  const msg = data.messages.find((m) => m.key === selected) ?? data.messages[0];

  function send(): void {
    if (!msg?.url) return;
    // Pencereyi HEMEN aciyoruz. Kayit isteginin cevabini beklemek
    // tarayicinin acilir pencere engeline takilir (kullanici tiklamasiyla
    // ayni anda olmayan window.open engellenir).
    window.open(msg.url, '_blank', 'noopener');
    void api(`/outreach/company/${companyId}/whatsapp-sent`, {
      method: 'POST',
      body: JSON.stringify({ templateKey: msg.key, text: msg.text }),
    })
      .then(onSent)
      .catch(() => undefined);
    setPicking(false);
  }

  async function block(): Promise<void> {
    try {
      await api(`/outreach/company/${companyId}/block`, {
        method: 'POST',
        body: JSON.stringify({ reason: 'Elle işaretlendi' }),
      });
      onSent();
      setData({ ...data!, blocked: true, blockedReason: 'Elle işaretlendi' });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'İşaretlenemedi');
    }
  }

  // --- Gonderilemez durumlar ---
  if (data.blocked) {
    return (
      <div className="wa-panel blocked">
        <div className="wa-title">Temas edilmeyecek</div>
        <p className="wa-note">{data.blockedReason}</p>
      </div>
    );
  }

  if (data.phoneKind === 'none') {
    return (
      <div className="wa-panel off">
        <div className="wa-title">Telefon numarası yok</div>
        <p className="wa-note">
          Bu işletmenin Google kaydında telefon bulunmuyor, WhatsApp gönderilemez.
        </p>
      </div>
    );
  }

  return (
    <div className="wa-panel">
      <div className="wa-head">
        <div>
          <div className="wa-title">WhatsApp’tan yaz</div>
          <div className="wa-phone">{data.phone ?? data.phoneE164}</div>
        </div>
        <button className="wa-send" onClick={() => setPicking((p) => !p)}>
          {picking ? 'Kapat' : 'Şablon seç'}
        </button>
      </div>

      {data.phoneKind === 'landline' && (
        <p className="wa-warn">
          Bu bir <strong>sabit hat</strong> — WhatsApp’ı olmayabilir. Yine de
          deneyebilirsiniz; kayıtlı değilse WhatsApp size söyler.
        </p>
      )}

      {picking && (
        <div className="wa-picker">
          <div className="wa-tabs">
            {data.messages.map((m) => (
              <button
                key={m.key}
                className={`wa-tab${m.key === selected ? ' on' : ''}`}
                onClick={() => setSelected(m.key)}
              >
                {m.label}
                {m.recommended && <span className="wa-rec" title="Bu işletme için önerilen">★</span>}
              </button>
            ))}
          </div>

          <textarea className="wa-preview" readOnly value={msg?.text ?? ''} rows={6} />

          <div className="wa-actions">
            <button className="btn" style={{ width: 'auto', padding: '0 18px' }} onClick={send}>
              WhatsApp’ta aç ve gönder
            </button>
            <button
              className="btn secondary"
              style={{ width: 'auto', padding: '0 14px' }}
              onClick={() => void navigator.clipboard.writeText(msg?.text ?? '')}
            >
              Kopyala
            </button>
            <button className="wa-block" onClick={() => void block()}>
              Bir daha yazma
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
