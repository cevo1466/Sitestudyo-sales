import { useCallback, useEffect, useState } from 'react';
import { api } from '../../services/api';
import { WhatsAppPanel } from './WhatsAppPanel';

interface Contact {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  role: string | null;
}
interface Activity {
  id: string;
  type: string;
  subject: string | null;
  body: string | null;
  occurredAt: string;
}
interface Analysis {
  websiteScore: number | null;
  sslValid: boolean | null;
  isResponsive: boolean | null;
  ttfbMs: number | null;
  cms: string | null;
}
interface Detail {
  id: string;
  name: string;
  categoryRaw: string | null;
  sector: string | null;
  city: string | null;
  district: string | null;
  address: string | null;
  phone: string | null;
  phoneE164: string | null;
  websiteUrl: string | null;
  websiteStatus: string;
  leadScore: number;
  leadGrade: string;
  googleRating: string | number | null;
  googleReviewsCount: number | null;
  googleUrl: string | null;
  lastContactedAt: string | null;
  contacts: Contact[];
  activities: Activity[];
  analyses: Analysis[];
}
interface ScoreReason {
  key: string;
  label: string;
  points: number;
}

const ACTIVITY_LABEL: Record<string, string> = {
  CALL: 'Arama',
  WHATSAPP: 'WhatsApp',
  MEETING: 'Görüşme',
  EMAIL_OUT: 'E-posta gönderildi',
  EMAIL_IN: 'E-posta geldi',
  NOTE: 'Not',
  STAGE_CHANGE: 'Aşama değişti',
  SYSTEM: 'Sistem',
};

const WEBSITE_LABEL: Record<string, string> = {
  NO_WEBSITE: 'Web sitesi yok',
  SOCIAL_ONLY: 'Sadece sosyal medya',
  BROKEN: 'Site bozuk',
  OUTDATED: 'Site eski',
  ACTIVE_WEAK: 'Site zayıf',
  ACTIVE_GOOD: 'Site iyi durumda',
  UNKNOWN: 'Henüz incelenmedi',
};

function whenText(iso: string): string {
  const d = new Date(iso);
  const days = Math.floor((Date.now() - d.getTime()) / 86_400_000);
  if (days === 0) return 'bugün';
  if (days === 1) return 'dün';
  if (days < 30) return `${days} gün önce`;
  return d.toLocaleDateString('tr');
}

export function CompanyDrawer({
  companyId,
  onClose,
  onChanged,
}: {
  companyId: string;
  onClose: () => void;
  onChanged: () => void;
}) {
  const [detail, setDetail] = useState<Detail | null>(null);
  const [reasons, setReasons] = useState<ScoreReason[]>([]);
  const [note, setNote] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [d, s] = await Promise.all([
        api<Detail>(`/companies/${companyId}`),
        api<{ reasons: ScoreReason[] }>(`/lead-scoring/explain/${companyId}`).catch(() => ({
          reasons: [],
        })),
      ]);
      setDetail(d);
      setReasons(s.reasons);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Yüklenemedi');
    }
  }, [companyId]);

  useEffect(() => {
    void load();
  }, [load]);

  // Esc ile kapatma: yogun bir listede fareyle X'e gitmek her seferinde
  // el degistirmek demek.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  async function saveNote(): Promise<void> {
    const body = note.trim();
    if (!body) return;
    setSavingNote(true);
    try {
      await api('/notes', { method: 'POST', body: JSON.stringify({ companyId, body }) });
      setNote('');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Not kaydedilemedi');
    } finally {
      setSavingNote(false);
    }
  }

  const rating = detail?.googleRating === null ? null : Number(detail?.googleRating);
  const analysis = detail?.analyses?.[0];

  return (
    <>
      <div className="drawer-scrim" onClick={onClose} aria-hidden="true" />
      <aside className="drawer" role="dialog" aria-label="İşletme detayı">
        {!detail ? (
          <div className="drawer-body">
            {error ? (
              <div className="notice error">{error}</div>
            ) : (
              <div className="skeleton" style={{ height: 90, borderRadius: 8 }} />
            )}
          </div>
        ) : (
          <>
            <header className="drawer-head">
              <div className="drawer-title">
                <h2>{detail.name}</h2>
                <p>
                  {[detail.categoryRaw, detail.district, detail.city].filter(Boolean).join(' · ')}
                </p>
              </div>
              <button className="drawer-close" onClick={onClose} aria-label="Kapat">
                ✕
              </button>
            </header>

            <div className="drawer-body">
              {error && <div className="notice error">{error}</div>}

              <WhatsAppPanel
                companyId={detail.id}
                onSent={() => {
                  void load();
                  onChanged();
                }}
              />

              <section className="drawer-block">
                <h3>Lead skoru</h3>
                <div className="score-line">
                  <span className={`score-big grade-${detail.leadGrade}`}>{detail.leadScore}</span>
                  <span className="score-grade">{detail.leadGrade}</span>
                </div>
                {reasons.length > 0 && (
                  <ul className="reasons">
                    {reasons.map((r) => (
                      <li key={r.key}>
                        <span className="reason-pts">+{r.points}</span> {r.label}
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section className="drawer-block">
                <h3>Google</h3>
                <dl className="facts">
                  <dt>Puan</dt>
                  <dd>
                    {rating !== null ? `★ ${rating.toFixed(1)}` : '—'}
                    {detail.googleReviewsCount
                      ? ` · ${detail.googleReviewsCount.toLocaleString('tr')} yorum`
                      : ''}
                  </dd>
                  <dt>Adres</dt>
                  <dd>{detail.address ?? '—'}</dd>
                  {detail.googleUrl && (
                    <>
                      <dt>Harita</dt>
                      <dd>
                        <a href={detail.googleUrl} target="_blank" rel="noreferrer">
                          Google Haritalar’da aç
                        </a>
                      </dd>
                    </>
                  )}
                </dl>
              </section>

              <section className="drawer-block">
                <h3>Web sitesi</h3>
                <dl className="facts">
                  <dt>Durum</dt>
                  <dd>{WEBSITE_LABEL[detail.websiteStatus] ?? detail.websiteStatus}</dd>
                  {detail.websiteUrl && (
                    <>
                      <dt>Adres</dt>
                      <dd>
                        <a href={detail.websiteUrl} target="_blank" rel="noreferrer">
                          {detail.websiteUrl}
                        </a>
                      </dd>
                    </>
                  )}
                  {analysis && (
                    <>
                      <dt>Site puanı</dt>
                      <dd>{analysis.websiteScore ?? '—'}</dd>
                      <dt>Teknik</dt>
                      <dd>
                        {[
                          analysis.sslValid === false ? 'SSL sorunlu' : null,
                          analysis.isResponsive === false ? 'Mobil uyumsuz' : null,
                          analysis.ttfbMs ? `${analysis.ttfbMs} ms` : null,
                          analysis.cms,
                        ]
                          .filter(Boolean)
                          .join(' · ') || 'Sorun bulunmadı'}
                      </dd>
                    </>
                  )}
                </dl>
              </section>

              {detail.contacts.length > 0 && (
                <section className="drawer-block">
                  <h3>Kişiler</h3>
                  <ul className="contact-list">
                    {detail.contacts.map((c) => (
                      <li key={c.id}>
                        <strong>{c.name ?? c.email ?? c.phone}</strong>
                        {c.role && <span className="muted"> · {c.role}</span>}
                        {c.email && <div className="muted">{c.email}</div>}
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              <section className="drawer-block">
                <h3>Zaman tüneli</h3>
                {detail.activities.length === 0 ? (
                  <p className="muted">Henüz temas edilmedi.</p>
                ) : (
                  <ul className="timeline">
                    {detail.activities.slice(0, 12).map((a) => (
                      <li key={a.id}>
                        <span className={`tl-dot tl-${a.type}`} />
                        <div>
                          <div className="tl-head">
                            <strong>{ACTIVITY_LABEL[a.type] ?? a.type}</strong>
                            <span className="muted">{whenText(a.occurredAt)}</span>
                          </div>
                          {a.subject && <div className="tl-sub">{a.subject}</div>}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section className="drawer-block">
                <h3>Not ekle</h3>
                <textarea
                  className="note-input"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Görüşmede ne konuşuldu?"
                  rows={3}
                />
                <button
                  className="btn"
                  style={{ width: 'auto', padding: '0 16px', marginTop: 8 }}
                  onClick={() => void saveNote()}
                  disabled={savingNote || !note.trim()}
                >
                  {savingNote ? 'Kaydediliyor…' : 'Notu kaydet'}
                </button>
              </section>
            </div>
          </>
        )}
      </aside>
    </>
  );
}
