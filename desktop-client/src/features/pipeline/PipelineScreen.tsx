import { useCallback, useEffect, useState } from 'react';
import { api } from '../../services/api';

interface Stage {
  id: string;
  key: string;
  name: string;
  sortOrder: number;
  isWon: boolean;
  isLost: boolean;
  color: string | null;
}
interface Pipeline {
  id: string;
  name: string;
  isDefault: boolean;
  stages: Stage[];
}
interface Lead {
  id: string;
  title: string;
  value: string | null;
  currency: string;
  stageId: string;
  stageEnteredAt: string;
  company: { id: string; name: string; city: string | null; leadGrade: string } | null;
}

/** Bir işin bu aşamada kaç gündür beklediği. */
function daysIn(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
}

export function PipelineScreen({ onGoToCompanies }: { onGoToCompanies: () => void }) {
  const [pipeline, setPipeline] = useState<Pipeline | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [moving, setMoving] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [pipes, list] = await Promise.all([
        api<Pipeline[]>('/pipelines'),
        api<{ items: Lead[] }>('/leads?status=open&limit=200'),
      ]);
      setPipeline(pipes.find((p) => p.isDefault) ?? pipes[0] ?? null);
      setLeads(list.items);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Huni yüklenemedi');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function move(lead: Lead, stageId: string): Promise<void> {
    setMoving(lead.id);
    // Iyimser guncelleme: kart hemen yeni sutuna gecsin. Sunucu cevabini
    // beklemek surukle-birak hissini olduruyor; hata olursa geri aliniyor.
    const before = leads;
    setLeads((prev) => prev.map((l) => (l.id === lead.id ? { ...l, stageId } : l)));
    try {
      await api(`/leads/${lead.id}/move`, {
        method: 'POST',
        body: JSON.stringify({ stageId }),
      });
      await load();
    } catch (e) {
      setLeads(before);
      setError(e instanceof Error ? e.message : 'Taşınamadı');
    } finally {
      setMoving(null);
    }
  }

  if (loading) {
    return (
      <div className="board-wrap">
        <div className="board">
          {Array.from({ length: 4 }).map((_, i) => (
            <div className="column" key={i}>
              <div className="column-head">
                <div className="skeleton" style={{ width: 90 }} />
              </div>
              <div className="skeleton" style={{ height: 54, borderRadius: 8, margin: 8 }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error && !pipeline) {
    return (
      <div className="empty">
        <h2>Huni yüklenemedi</h2>
        <p>{error}</p>
      </div>
    );
  }

  // Hic is kaydi yokken bos sutunlar gostermek, ekrani "bozuk" gosterir.
  // Bos ekran bir davettir: ne yapilacagini soylemeli.
  if (!leads.length) {
    return (
      <div className="empty">
        <h2>Hunide henüz iş yok</h2>
        <p>
          Peşine düştüğün işler burada durur. İşletmeler ekranından bir işletme seçip huniye
          aldığında ilk kart bu panoda belirir.
        </p>
        <button className="btn" style={{ width: 'auto', padding: '0 18px' }} onClick={onGoToCompanies}>
          İşletmelere git
        </button>
      </div>
    );
  }

  const stages = pipeline?.stages ?? [];

  return (
    <div className="board-wrap">
      {error && <div className="notice error" style={{ margin: '12px 24px 0' }}>{error}</div>}
      <div className="board">
        {stages.map((stage) => {
          const inStage = leads.filter((l) => l.stageId === stage.id);
          const total = inStage.reduce((s, l) => s + Number(l.value ?? 0), 0);
          return (
            <section className="column" key={stage.id}>
              <header className="column-head">
                <span className="column-dot" style={{ background: stage.color ?? '#83868c' }} />
                <span className="column-name">{stage.name}</span>
                <span className="column-count">{inStage.length}</span>
              </header>
              {total > 0 && (
                <div className="column-total">
                  {total.toLocaleString('tr')} {inStage[0]?.currency ?? 'TRY'}
                </div>
              )}

              <div className="column-body">
                {inStage.map((lead) => {
                  const age = daysIn(lead.stageEnteredAt);
                  return (
                    <article
                      className={`lead-card${moving === lead.id ? ' busy' : ''}`}
                      key={lead.id}
                    >
                      <div className="lead-company">{lead.company?.name ?? '—'}</div>
                      <div className="lead-title">{lead.title}</div>
                      <div className="lead-foot">
                        {lead.value && (
                          <span className="lead-value">
                            {Number(lead.value).toLocaleString('tr')} {lead.currency}
                          </span>
                        )}
                        {/* 7 gunden uzun bekleyen is dikkat ister: hunide
                            unutulan kayitlar en sik kayip sebebi. */}
                        <span className={`lead-age${age >= 7 ? ' stale' : ''}`}>
                          {age === 0 ? 'bugün' : `${age} gün`}
                        </span>
                      </div>
                      <select
                        className="lead-move"
                        value={stage.id}
                        disabled={moving === lead.id}
                        onChange={(e) => void move(lead, e.target.value)}
                        aria-label={`${lead.company?.name} işini taşı`}
                      >
                        {stages.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.id === stage.id ? `● ${s.name}` : `→ ${s.name}`}
                          </option>
                        ))}
                      </select>
                    </article>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
