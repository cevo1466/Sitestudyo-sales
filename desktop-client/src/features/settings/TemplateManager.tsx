import { useEffect, useRef, useState } from 'react';
import { api } from '../../services/api';

interface Template {
  key: string;
  label: string;
  body: string;
}
/** Satir kimligi: React listesi icin. Bkz. asagidaki uid notu. */
interface Row extends Template {
  uid: string;
}

interface TemplateVariable {
  name: string;
  label: string;
  example: string;
}

/**
 * Degisken listesi SUNUCUDAN geliyor (`GET /outreach/template-variables`).
 *
 * Onceden burada sabit bir dizi vardi ve motora yeni degisken eklendiginde
 * arayuz bilmiyordu — kullaniciya var olmayan degiskenler onerilebiliyordu.
 *
 * Asagidaki liste bir ikinci tanim DEGIL, istek basarisiz olursa cipler
 * tamamen kaybolmasin diye tutulan asgari bir yedek; her zaman calistigi
 * bilinen bes degisken.
 */
const FALLBACK_VARIABLES: TemplateVariable[] = [
  { name: 'isim', label: 'İşletmenin tam adı', example: '' },
  { name: 'puan', label: 'Google puanı', example: '' },
  { name: 'yorum', label: 'Google yorum sayısı', example: '' },
  { name: 'ilce', label: 'İlçe (yoksa il)', example: '' },
  { name: 'kategori', label: 'Google kategorisi', example: '' },
];

let counter = 0;
const nextUid = (): string => `r${++counter}`;

/** Turkce harfleri ASCII karsiligina cevirir. */
function toAscii(text: string): string {
  const map: Record<string, string> = {
    ı: 'i', İ: 'i', ş: 's', Ş: 's', ğ: 'g', Ğ: 'g',
    ü: 'u', Ü: 'u', ö: 'o', Ö: 'o', ç: 'c', Ç: 'c',
  };
  return text.replace(/[ıİşŞğĞüÜöÖçÇ]/g, (ch) => map[ch] ?? ch);
}

/**
 * Baslikta anahtar uretir.
 *
 * Anahtari kullaniciya sormuyoruz: teknik bir ayrinti ve yanlis girilirse
 * temas kayitlariyla baglantiyi koparir.
 */
function makeKey(label: string, taken: Set<string>): string {
  const base =
    toAscii(label).toLocaleLowerCase('tr').trim().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '') ||
    'sablon';
  if (!taken.has(base)) return base;
  for (let i = 2; i < 500; i++) {
    if (!taken.has(`${base}_${i}`)) return `${base}_${i}`;
  }
  return `${base}_${Date.now()}`;
}

/**
 * WhatsApp mesaj sablonlari.
 *
 * Sablonlar `Setting` tablosunda JSON olarak duruyor, Prisma semasi
 * degismiyor. Kaydetme TOPLU: dizinin tamami tek PUT ile gidiyor, cunku
 * sunucu tarafinda tek bir ayar satiri var.
 */
export function TemplateManager() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [saved, setSaved] = useState<Template[]>([]);
  const [variables, setVariables] = useState<TemplateVariable[]>(FALLBACK_VARIABLES);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ kind: string; text: string } | null>(null);
  // Degisken eklerken hangi kutuya yazacagimizi bilmek icin son odagi
  // tutuyoruz: cipe tiklandigi anda odak cipe gecmis oluyor.
  const lastFocused = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    api<Template[]>('/outreach/templates')
      .then((list) => {
        setSaved(list);
        setRows(list.map((t) => ({ ...t, uid: nextUid() })));
      })
      .catch((e: Error) => setMessage({ kind: 'error', text: e.message }));

    // Cipler kritik degil: gelmezse yedek liste kaliyor, kullaniciya hata
    // gostermeye gerek yok — sablonlari yine duzenleyebiliyor.
    api<TemplateVariable[]>('/outreach/template-variables')
      .then((list) => list.length && setVariables(list))
      .catch(() => undefined);
  }, []);

  if (message?.kind === 'fatal') {
    return (
      <section className="panel">
        <h2>Mesaj şablonları</h2>
        <div className="notice error">{message.text}</div>
      </section>
    );
  }
  if (!rows) {
    return (
      <section className="panel">
        <h2>Mesaj şablonları</h2>
        <div className="skeleton" style={{ height: 140 }} />
      </section>
    );
  }

  const dirty = JSON.stringify(rows.map(({ uid: _uid, ...t }) => t)) !== JSON.stringify(saved);

  function patch(uid: string, part: Partial<Template>): void {
    setRows((prev) => prev!.map((r) => (r.uid === uid ? { ...r, ...part } : r)));
  }

  function add(): void {
    const taken = new Set(rows!.map((r) => r.key));
    setRows([...rows!, { uid: nextUid(), key: makeKey('sablon', taken), label: '', body: '' }]);
    setMessage(null);
  }

  function remove(uid: string): void {
    if (rows!.length <= 1) {
      setMessage({
        kind: 'warn',
        text: 'Son şablon silinemez. Silinirse çekmecede gösterilecek mesaj kalmaz.',
      });
      return;
    }
    setRows(rows!.filter((r) => r.uid !== uid));
    setMessage(null);
  }

  function insertVariable(v: string): void {
    const box = lastFocused.current;
    if (!box) {
      setMessage({ kind: 'warn', text: 'Önce eklemek istediğiniz mesaj kutusuna tıklayın.' });
      return;
    }
    const uid = box.dataset.uid;
    const row = rows!.find((r) => r.uid === uid);
    if (!row) return;
    const at = box.selectionStart ?? row.body.length;
    patch(row.uid, { body: row.body.slice(0, at) + v + row.body.slice(box.selectionEnd ?? at) });
    window.setTimeout(() => {
      box.focus();
      box.setSelectionRange(at + v.length, at + v.length);
    }, 0);
  }

  async function save(): Promise<void> {
    const empty = rows!.find((r) => !r.label.trim() || !r.body.trim());
    if (empty) {
      setMessage({ kind: 'error', text: 'Başlığı veya mesajı boş bir şablon var, kaydedilemez.' });
      return;
    }
    setBusy(true);
    setMessage(null);
    try {
      // Anahtar KAYITLI sablonlarda sabit kalir: temas kayitlari
      // templateKey uzerinden bu degere bagli. Yalniz yeni satirlar
      // baslikatan anahtar uretir.
      const taken = new Set<string>();
      const payload: Template[] = rows!.map(({ uid: _uid, ...t }) => {
        const known = saved.some((s) => s.key === t.key);
        const key = known ? t.key : makeKey(t.label, taken);
        taken.add(key);
        return { ...t, key };
      });
      const back = await api<Template[]>('/outreach/templates', {
        method: 'PUT',
        body: JSON.stringify({ templates: payload }),
      });
      setSaved(back);
      setRows(back.map((t) => ({ ...t, uid: nextUid() })));
      setMessage({ kind: 'success', text: 'Şablonlar kaydedildi.' });
    } catch (e) {
      setMessage({ kind: 'error', text: e instanceof Error ? e.message : 'Kaydedilemedi' });
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="panel">
      <h2>Mesaj şablonları</h2>
      <p className="panel-lede">
        Çekmecedeki WhatsApp mesajı buradan seçilir. Değişkenler gönderim
        anında işletmenin verisiyle dolar.
      </p>

      {message && message.kind !== 'fatal' && (
        <div className={`notice ${message.kind}`}>{message.text}</div>
      )}

      <div className="var-row">
        {variables.map((v) => (
          <button
            key={v.name}
            className="chip"
            onClick={() => insertVariable(`{{${v.name}}}`)}
            type="button"
            title={v.example ? `${v.label} — örnek: ${v.example}` : v.label}
          >
            {`{{${v.name}}}`}
          </button>
        ))}
      </div>

      <p className="panel-lede">
        <strong>{'{{sorun}}'}</strong>, <strong>{'{{sorunDetay}}'}</strong> ve{' '}
        <strong>{'{{skorGerekce}}'}</strong> ölçülmüş veriye dayanır. O işletme
        için veri yoksa bu değişkenin bulunduğu <em>cümle tamamen düşer</em> —
        yarım kalmış bir cümle müşteriye gitmez. Bu yüzden onları ayrı
        cümlelere koyun.
      </p>

      {rows.map((r) => (
        <div className="tpl" key={r.uid}>
          <input
            className="tpl-label"
            value={r.label}
            placeholder="Şablon başlığı"
            onChange={(e) => patch(r.uid, { label: e.target.value })}
          />
          <textarea
            className="tpl-body"
            data-uid={r.uid}
            value={r.body}
            rows={4}
            placeholder="Mesaj metni"
            onFocus={(e) => (lastFocused.current = e.currentTarget)}
            onChange={(e) => patch(r.uid, { body: e.target.value })}
          />
          <div className="tpl-foot">
            <span className="muted">{r.key}</span>
            <button className="wa-block" onClick={() => remove(r.uid)} type="button">
              Sil
            </button>
          </div>
        </div>
      ))}

      <div className="actions">
        <button
          className="btn"
          style={{ width: 'auto', padding: '0 18px' }}
          onClick={() => void save()}
          disabled={busy || !dirty}
        >
          Şablonları kaydet
        </button>
        <button
          className="btn secondary"
          style={{ width: 'auto', padding: '0 14px' }}
          onClick={add}
          type="button"
        >
          Şablon ekle
        </button>
      </div>
    </section>
  );
}
