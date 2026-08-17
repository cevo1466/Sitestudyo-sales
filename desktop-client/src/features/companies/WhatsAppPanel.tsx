import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { openExternal } from '../../services/open-external';

export interface Message {
  key: string;
  label: string;
  text: string;
  recommended: boolean;
  url: string | null;
}
export interface Outreach {
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
 * TASARIM KARARI: bu panel mesaji GONDERMEZ. WhatsApp'i mesaj yazili
 * halde acar, gonder tusuna kullanici kendi basar. Boylece metni son bir
 * kez okuyup duzeltebiliyor. Sablon degiskenleri (yorum sayisi, ilce)
 * veri eksikse bos kaliyor ve o hali musteriye gitmemeli.
 *
 * Metin bu yuzden her zaman acik duruyor. Onceden bir "sablon sec"
 * adiminin arkasindaydi ve gonderilecek yazi hic gorunmuyordu.
 *
 * Numaranin WhatsApp'ta kayitli olup olmadigi ONCEDEN bilinemez, WhatsApp
 * boyle bir sorgu vermiyor. Yapilabilecek tek durust sey numaranin turunu
 * soylemek: cep hatlari neredeyse her zaman WhatsApp'li, sabit hatlar
 * degil. Havuzun ucte biri sabit hat.
 */
export function WhatsAppPanel({
  companyId,
  onSent,
  preloaded,
}: {
  companyId: string;
  onSent: () => void;
  /**
   * Calisma kuyrugunda metinler toplu halde ONCEDEN uretiliyor. Verilirse
   * panel kendi istegini atmiyor — kart basina bir saniye beklemek,
   * kuyrugun butun amacini bitirirdi.
   */
  preloaded?: Outreach;
}) {
  const [data, setData] = useState<Outreach | null>(preloaded ?? null);
  const [selected, setSelected] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [opened, setOpened] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [openError, setOpenError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let dead = false;
    setOpened(false);
    setConfirmed(false);
    setOpenError(null);

    /** Onerilen sablonu (yoksa ilkini) secip metnini kutuya koyar. */
    const seat = (d: Outreach): void => {
      setData(d);
      const first = d.messages.find((m) => m.recommended) ?? d.messages[0];
      setSelected(first?.key ?? null);
      setDraft(first?.text ?? '');
    };

    if (preloaded) {
      seat(preloaded);
      return;
    }

    api<Outreach>(`/outreach/company/${companyId}/messages`)
      .then((d) => !dead && seat(d))
      .catch((e: Error) => !dead && setError(e.message));
    return () => {
      dead = true;
    };
  }, [companyId, preloaded]);

  if (error) return <div className="notice error">{error}</div>;
  if (!data) return <div className="skeleton" style={{ height: 64 }} />;

  const recommended = data.messages.find((m) => m.recommended) ?? null;

  function pick(key: string): void {
    const m = data!.messages.find((x) => x.key === key);
    setSelected(key);
    setDraft(m?.text ?? '');
  }

  /** Kayit isteklerinin tek yeri. Acma basarisizsa BURAYA hic gelinmez. */
  function log(outcome: 'opened' | 'sent'): void {
    void api(`/outreach/company/${companyId}/whatsapp-sent`, {
      method: 'POST',
      body: JSON.stringify({ templateKey: selected ?? 'ozel', text: draft, outcome }),
    })
      .then(onSent)
      .catch((e: Error) => setOpenError(`Temas kaydedilemedi: ${e.message}`));
  }

  /**
   * WhatsApp'i acar. GONDERMEZ.
   *
   * Adresteki metin WhatsApp'in yazi kutusuna dusuyor, gonderme tusuna
   * kullanici basiyor. Temasi bu yuzden "gonderildi" diye degil "acildi"
   * diye kaydediyoruz. Yalan bir zaman tuneli, hic kayit tutmamaktan
   * daha kotu olurdu.
   *
   * ONEMLI: kayit YALNIZCA acma basarili olursa atiliyor. Onceden acma
   * denemesiyle ayni anda atiliyordu; masaustunde pencere hic acilmadigi
   * halde "acildi" kaydi olusuyor ve isletme "temas edilmedi" filtresinden
   * dusuyordu.
   *
   * `openExternal` cagrisi await'siz baslar: tarayici yolunda `window.open`
   * kullanicinin tiklamasiyla AYNI anda calismak zorunda, arada bir await
   * olursa acilir pencere engeline takilir.
   */
  function openWhatsApp(): void {
    if (!data!.phoneE164 || data!.blocked) return;
    setOpenError(null);
    const url = `https://wa.me/${data!.phoneE164.replace(/\D/g, '')}?text=${encodeURIComponent(draft)}`;
    openExternal(url).then(
      () => {
        setOpened(true);
        log('opened');
      },
      (e: Error) => {
        setOpened(false);
        setOpenError(
          `WhatsApp açılamadı: ${e.message}. Temas kaydı OLUŞTURULMADI — ` +
            'metni kopyalayıp elle açabilirsiniz.',
        );
      },
    );
  }

  /**
   * "Gonderdim" — kaydi acildi'dan gonderildi'ye yukseltir.
   *
   * WhatsApp gonderim durumunu hicbir yere bildirmiyor; tek dogrulama
   * yolu kullanicinin kendisi. Ikinci bir aktivite satiri yaziliyor,
   * ilki silinmiyor: zaman tuneli olan biteni oldugu gibi tutmali.
   */
  function confirmSent(): void {
    setConfirmed(true);
    log('sent');
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
          Google kaydında telefon bulunmuyor, bu işletmeye WhatsApp açılamaz.
        </p>
      </div>
    );
  }

  return (
    <div className="wa-panel">
      <div className="wa-head">
        <div>
          <div className="wa-title">WhatsApp</div>
          <div className="wa-phone">{data.phone ?? data.phoneE164}</div>
        </div>
      </div>

      {data.phoneKind === 'landline' && (
        <p className="wa-warn">
          Bu bir sabit hat, WhatsApp’ı olmayabilir. Yine de deneyebilirsiniz.
          Numara kayıtlı değilse WhatsApp size söyler.
        </p>
      )}

      <div className="wa-tabs">
        {data.messages.map((m) => (
          <button
            key={m.key}
            className={`wa-tab${m.key === selected ? ' on' : ''}`}
            onClick={() => pick(m.key)}
          >
            {m.label}
          </button>
        ))}
      </div>

      <textarea
        className="wa-preview"
        value={draft}
        rows={7}
        onChange={(e) => setDraft(e.target.value)}
        spellCheck={false}
      />

      <p className="wa-hint">
        {recommended && recommended.key === selected
          ? 'Google verisine göre bu işletmeye en uygun şablon bu. '
          : ''}
        Metin WhatsApp’a yazılı gelir, gönder tuşuna siz basarsınız. Burada
        da değiştirebilirsiniz.
      </p>

      <div className="wa-actions">
        <button
          className="btn"
          style={{ width: 'auto', padding: '0 18px' }}
          onClick={openWhatsApp}
          disabled={!draft.trim()}
        >
          WhatsApp’ta aç
        </button>
        <button
          className="btn secondary"
          style={{ width: 'auto', padding: '0 14px' }}
          onClick={() => {
            void navigator.clipboard.writeText(draft);
            setCopied(true);
            window.setTimeout(() => setCopied(false), 1600);
          }}
        >
          {copied ? 'Kopyalandı' : 'Kopyala'}
        </button>
        {opened && !confirmed && (
          <button
            className="btn"
            style={{ width: 'auto', padding: '0 14px' }}
            onClick={confirmSent}
          >
            Gönderdim
          </button>
        )}
        <button className="wa-block" onClick={() => void block()}>
          Bir daha yazma
        </button>
      </div>

      {openError && <p className="wa-warn">{openError}</p>}

      {opened && !confirmed && (
        <p className="wa-opened">
          WhatsApp açıldı ve zaman tüneline “açıldı” olarak işlendi. Gönderip
          göndermediğinizi WhatsApp bize söylemiyor — gönderdiyseniz
          “Gönderdim”e basın, kayıt netleşsin.
        </p>
      )}

      {confirmed && (
        <p className="wa-opened">
          Gönderildi olarak işaretlendi. Zaman tünelinde iki satır var:
          açılma ve gönderim.
        </p>
      )}
    </div>
  );
}
