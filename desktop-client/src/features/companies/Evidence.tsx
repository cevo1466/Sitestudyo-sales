/**
 * KANIT — bu tablonun imza ogesi.
 *
 * Neden skor cubugu degil: bu havuzda skorlar 40-65 arasinda sikisik.
 * Her cubuk yari dolu gorunur ve hicbir seyi ayirt etmez.
 *
 * Gosterilen sey YORUM HACMI, cunku bu veride gercek ayirt edici o —
 * ve satis argumaninin kendisi de o: "7.538 kisi yorum yapmis, sitesi yok."
 */

/** Yorum sayisinin gorsel agirligi icin ust sinir. */
const CEILING = 8000;

/**
 * Karekok olcek.
 *
 * Once logaritmik yazilmisti; ekranda denenince UST TARAFTA COKTUGU
 * gorunudu: varsayilan siralama "en cok yorum alan" oldugu icin ilk
 * sayfadaki herkes 2.000-7.600 arasindaydi ve log olcekte hepsi %84-99
 * bandina sikisip birbirinden ayirt edilemez hale geliyordu — cubugun
 * tek isi tam da orada fark gostermekti.
 *
 * Dogrusal olcek de calismaz: havuzun buyuk cogunlugu 0-100 yorum
 * araliginda ve dogrusalda hepsi gorunmez bir cizgiye duser.
 *
 * Karekok ikisinin arasi: 7.626 -> %98, 2.286 -> %53, 100 -> %11, 20 -> %5.
 * Hem tepe ayrisiyor hem kucuk degerler goruniyor.
 */
function weight(reviews: number): number {
  if (reviews <= 0) return 0;
  return Math.min(1, Math.sqrt(reviews) / Math.sqrt(CEILING));
}

export function Evidence({
  rating,
  reviews,
}: {
  rating: string | number | null;
  reviews: number | null;
}) {
  const r = rating === null ? null : Number(rating);
  const count = reviews ?? 0;

  if (r === null && count === 0) {
    // Uydurma bir cubuk cizmektense yoklugu soylemek dogru.
    return <span className="evidence none">kanıt yok</span>;
  }

  return (
    <span
      className="evidence"
      title={`${r?.toFixed(1) ?? '?'} yıldız · ${count.toLocaleString('tr')} yorum`}
    >
      <span className={`stars${r !== null && r >= 4 ? ' high' : ''}`}>
        {r !== null ? `★${r.toFixed(1)}` : '—'}
      </span>
      <span className="track">
        <span className="fill" style={{ width: `${weight(count) * 100}%` }} />
      </span>
      <span className="reviews">{count > 0 ? count.toLocaleString('tr') : ''}</span>
    </span>
  );
}
