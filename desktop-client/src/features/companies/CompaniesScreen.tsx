import { useCallback, useEffect, useRef, useState } from 'react';
import { api, type Company, type CompanyPage } from '../../services/api';
import { Evidence } from './Evidence';
import { CompanyDrawer } from './CompanyDrawer';

type Filters = {
  city?: string;
  sector?: string;
  q?: string;
  sort: string;
  /** 'true' = temas edildi, 'false' = hic temas edilmedi */
  contacted?: string;
  /** yalnizca cep telefonu olanlar — WhatsApp gonderilebilir */
  mobileOnly?: string;
};

const CITIES = ['İstanbul', 'Ankara', 'İzmir'];
const SECTORS: Array<[string, string]> = [
  ['guzellik', 'Güzellik'],
  ['yeme_icme', 'Yeme-içme'],
  ['spor_saglik', 'Spor & sağlık'],
  ['emlak', 'Emlak'],
  ['temizlik', 'Temizlik'],
  ['otomotiv', 'Otomotiv'],
  ['profesyonel_hizmet', 'Profesyonel hizmet'],
];

const SORTS: Array<[string, string]> = [
  ['googleReviewsCount:desc', 'En çok yorum alan'],
  ['googleRating:desc', 'En yüksek puanlı'],
  ['leadScore:desc', 'En yüksek lead skoru'],
  ['lastContactedAt:desc', 'Son temas ettiklerim'],
  ['name:asc', 'İsme göre'],
];

export function CompaniesScreen() {
  const [filters, setFilters] = useState<Filters>({ sort: 'googleReviewsCount:desc' });
  const [items, setItems] = useState<Company[]>([]);
  const [total, setTotal] = useState<number | null>(null);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const sentinel = useRef<HTMLDivElement>(null);

  const query = useCallback(
    (extra?: string) => {
      const p = new URLSearchParams({ limit: '50', sort: filters.sort });
      if (filters.city) p.set('city', filters.city);
      if (filters.sector) p.set('sector', filters.sector);
      if (filters.q) p.set('q', filters.q);
      if (filters.contacted) p.set('contacted', filters.contacted);
      if (filters.mobileOnly) p.set('mobileOnly', filters.mobileOnly);
      if (extra) p.set('cursor', extra);
      return p.toString();
    },
    [filters],
  );

  // Filtre degisince listeyi bastan yukle.
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    api<CompanyPage>(`/companies?${query()}`)
      .then((page) => {
        if (cancelled) return;
        setItems(page.items);
        setTotal(page.approxTotal);
        setCursor(page.nextCursor);
      })
      .catch((e: Error) => !cancelled && setError(e.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [query, reloadKey]);

  // Sonsuz kaydirma: imlecli sayfalamanin dogal karsiligi. Sayfa numarasi
  // yok cunku on binlerce kayitta OFFSET sorgusu cokuyor.
  useEffect(() => {
    const el = sentinel.current;
    if (!el || !cursor || loading) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        io.disconnect();
        api<CompanyPage>(`/companies?${query(cursor)}`)
          .then((page) => {
            setItems((prev) => [...prev, ...page.items]);
            setCursor(page.nextCursor);
          })
          .catch(() => undefined);
      },
      { rootMargin: '400px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [cursor, loading, query]);

  // Ozetteki sayi SABIT olmali: onceki hali "ilk 50'nin 44'u" diyordu ve
  // kaydirdikca degisiyordu — okuyan kisi neye baktigini bilemezdi.
  // En cok yorum alan kayit, siralamanin dogasi geregi listenin basinda.
  const topReviews = items[0]?.googleReviewsCount ?? 0;

  return (
    <div className="workspace">
      <aside className="sidebar">
        <div className="filter-group">
          <h3>Şehir</h3>
          {CITIES.map((c) => (
            <button
              key={c}
              className="facet"
              aria-pressed={filters.city === c}
              onClick={() => setFilters((f) => ({ ...f, city: f.city === c ? undefined : c }))}
            >
              {c}
            </button>
          ))}
        </div>

        <div className="filter-group">
          <h3>Sektör</h3>
          {SECTORS.map(([key, label]) => (
            <button
              key={key}
              className="facet"
              aria-pressed={filters.sector === key}
              onClick={() =>
                setFilters((f) => ({ ...f, sector: f.sector === key ? undefined : key }))
              }
            >
              {label}
            </button>
          ))}
        </div>
      </aside>

      <main className="main">
        <p className="summary">
          {total === null ? (
            'Havuz yükleniyor…'
          ) : total === 0 ? (
            'Bu filtreye uyan işletme yok.'
          ) : (
            <>
              {filters.city ? <strong>{filters.city}</strong> : 'Havuzda'}
              {filters.city ? "'da" : ''} sitesi olmayan{' '}
              <strong>{total.toLocaleString('tr')}</strong> işletme.
              {topReviews > 0 && (
                <>
                  {' '}
                  En çok yorum alanı <strong>{topReviews.toLocaleString('tr')}</strong> yorumla
                  listenin başında.
                </>
              )}
            </>
          )}
        </p>

        <div className="toolbar">
          <input
            className="search"
            placeholder="İşletme adı ara…"
            defaultValue={filters.q ?? ''}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const v = (e.target as HTMLInputElement).value.trim();
                setFilters((f) => ({ ...f, q: v || undefined }));
              }
            }}
          />
          <select
            className="sort"
            value={filters.sort}
            onChange={(e) => setFilters((f) => ({ ...f, sort: e.target.value }))}
          >
            {SORTS.map(([v, label]) => (
              <option key={v} value={v}>
                {label}
              </option>
            ))}
          </select>

          <button
            className={`chip toggle${filters.mobileOnly ? ' on' : ''}`}
            onClick={() =>
              setFilters((f) => ({ ...f, mobileOnly: f.mobileOnly ? undefined : 'true' }))
            }
            title="Sadece cep telefonu olanlar — WhatsApp gönderilebilir"
          >
            WhatsApp’lık
          </button>
          <button
            className={`chip toggle${filters.contacted === 'false' ? ' on' : ''}`}
            onClick={() =>
              setFilters((f) => ({
                ...f,
                contacted: f.contacted === 'false' ? undefined : 'false',
              }))
            }
            title="Henüz hiç temas edilmemiş işletmeler"
          >
            Temas edilmemiş
          </button>
          <button
            className={`chip toggle${filters.contacted === 'true' ? ' on' : ''}`}
            onClick={() =>
              setFilters((f) => ({
                ...f,
                contacted: f.contacted === 'true' ? undefined : 'true',
              }))
            }
            title="Daha önce yazdığım veya aradığım işletmeler"
          >
            Yazdıklarım
          </button>

          {filters.city && (
            <span className="chip">
              {filters.city}
              <button
                onClick={() => setFilters((f) => ({ ...f, city: undefined }))}
                aria-label="Şehir filtresini kaldır"
              >
                ✕
              </button>
            </span>
          )}
          {filters.sector && (
            <span className="chip">
              {SECTORS.find(([k]) => k === filters.sector)?.[1]}
              <button
                onClick={() => setFilters((f) => ({ ...f, sector: undefined }))}
                aria-label="Sektör filtresini kaldır"
              >
                ✕
              </button>
            </span>
          )}
        </div>

        <div className="table-scroll">
          {error ? (
            <div className="empty">
              <h2>Liste yüklenemedi</h2>
              <p>{error}</p>
            </div>
          ) : !loading && items.length === 0 ? (
            <div className="empty">
              <h2>Bu filtreye uyan işletme yok</h2>
              <p>Şehir veya sektör seçimini genişletin.</p>
            </div>
          ) : (
            <table className="grid">
              <thead>
                <tr>
                  <th>İşletme</th>
                  <th style={{ width: 232 }}>Kanıt</th>
                  <th style={{ width: 116 }}>İlçe</th>
                  <th style={{ width: 142 }}>Telefon</th>
                  <th style={{ width: 96 }}>Temas</th>
                  <th style={{ width: 56, textAlign: 'right' }}>Skor</th>
                </tr>
              </thead>
              <tbody>
                {items.map((c) => (
                  <tr
                    key={c.id}
                    aria-selected={selected === c.id}
                    onClick={() => {
                      setSelected(c.id);
                      setOpenId(c.id);
                    }}
                  >
                    <td className="cell-name">
                      <span className="name-main">{c.name}</span>
                      {c.categoryRaw && <span className="name-cat">{c.categoryRaw}</span>}
                    </td>
                    <td>
                      <Evidence rating={c.googleRating} reviews={c.googleReviewsCount} />
                    </td>
                    <td className="cell-muted">{c.district ?? '—'}</td>
                    <td className="cell-muted">{c.phone ?? '—'}</td>
                    <td className={`cell-contact${c.lastContactedAt ? ' done' : ''}`}>
                      {c.lastContactedAt ? sinceText(c.lastContactedAt) : '—'}
                    </td>
                    <td className="cell-num">
                      <span className={`score grade-${c.leadGrade}`} title={`Sınıf: ${c.leadGrade}`}>
                        {c.leadScore}
                      </span>
                    </td>
                  </tr>
                ))}
                {loading &&
                  Array.from({ length: 12 }).map((_, i) => (
                    <tr className="loading-row" key={`s${i}`}>
                      <td>
                        <div className="skeleton" style={{ width: `${45 + (i % 4) * 12}%` }} />
                      </td>
                      <td>
                        <div className="skeleton" style={{ width: '70%' }} />
                      </td>
                      <td colSpan={4} />
                    </tr>
                  ))}
              </tbody>
            </table>
          )}
          <div ref={sentinel} style={{ height: 1 }} />
        </div>
      </main>

      {openId && (
        <CompanyDrawer
          companyId={openId}
          onClose={() => setOpenId(null)}
          // Temas kaydedilince listedeki "Temas" sutunu tazelensin.
          onChanged={() => setReloadKey((k) => k + 1)}
        />
      )}
    </div>
  );
}

/** "3 gün önce" gibi kisa zaman metni. */
function sinceText(iso: string): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days === 0) return 'bugün';
  if (days === 1) return 'dün';
  if (days < 30) return `${days} gün`;
  return new Date(iso).toLocaleDateString('tr');
}
