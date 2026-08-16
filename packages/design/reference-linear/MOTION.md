# Hareket Dili

Zaman çizelgesi referans sayfası: `https://linear.app/`

> Bu bölümdeki her sayı sayfa gerçekten kaydırılırken ölçüldü — ekran görüntüsünden ya da modelden tahmin edilmedi. Kaydırma adımı başına elemanların konumu, opaklığı ve transform matrisi örneklendi.

> ⚠️ **Ölçüm çözünürlüğü ±269px.** Örnekler bu aralıkla alındığı için aşağıdaki mesafeler bir örnekleme adımından daha hassas değildir: 900 ms'lik bir giriş animasyonu ile 200 ms'lik bir CSS geçişi aynı değeri üretebilir. Mertebeye güven, ondalığa değil.

## Sayfa ölçeği

- Kaydırma yolu: **1076 px** (~1.2 ekran boyu)
- Ölçüm noktası: 5 kaydırma adımı, 91 eleman izlendi

## Hareket profili

| Ölçüm | Değer |
|---|---:|
| Animasyonlu eleman (sahne) | 2 |
| Sabitlenen (pinned) bölüm | 0 |
| Toplam sabitlenme mesafesi | 0 px |
| Parallaks katman | 0 |
| Yatay kaydırma şeridi | 0 |
| Kaydırmaya bağlı (scrub) | 0 |
| Bir kez tetiklenen | 2 |
| Bağlanması ölçülemedi | 0 |
| Açılışta oynayan | 0 |

## İmza teknikleri

| Teknik | Ölçüm | Anlamı |
|---|---:|---|
| Metin bölme (SplitText) | 88 | başlıklar harf/kelime bazında sarmalanmış — harf harf açılma tekniği |
| Karışım modu (mix-blend) | 19 | katmanlar birbirine karışıyor; düz üst üste bindirme aynı hissi vermez |
| Maske | 16 | maskeyle açılan/kesilen yüzeyler |
| clip-path | 26 | geometrik açılma efektleri |
| Video | 6 | hareketin bir kısmı videodan geliyor |
| Yapışık (sticky) eleman | 9 | CSS sticky ile tutulan bölümler |
| Yatay şerit | 1 | viewport'tan geniş, yana kayan konteyner |
| Kaydırma yakalama (snap) | 2 | bölümler kaydırmada yerine oturuyor |
| will-change | 28 | GPU katmanına alınmış eleman sayısı — performans bütçesinin işareti |

✅ **`prefers-reduced-motion` destekleniyor** (10 kural). Taklit ederken bunu ATLAMA — erişilebilirlik gereği ve ödüllü sitelerin standardı.

## Sitenin kendi tanımları

Aşağıdakiler ölçülmüş ya da tahmin edilmiş değil — sitenin CSS'inde **yazılı** olan tanımlardır. ZIP içinde `site/` klasöründe birebir kopyalanabilir hâlde duruyorlar.

- **87 @keyframes** → `site/keyframes.css` (AWsA3W_scrollbarIn, AWsA3W_scrollbarOut, PPSGPG_blink, PSAPAG_dialogClose, PSAPAG_dialogOpen, PSAPAG_fadeIn, PSAPAG_fadeOut, UVNdXW_close …)
- **162 CSS değişkeni** → `site/tokens-from-source.css`

**En çok kullanılan geçiş eğrileri:**

| Süre ve eğri | Kaç elemanda |
|---|---:|
| `0.1s \| ease` | 261 |
| `0.16s \| cubic-bezier(0.25` | 156 |
| `0.25s \| ease` | 83 |
| `0.1s \| cubic-bezier(0.25` | 80 |
| `0.2s \| ease` | 78 |
| `0.25s \| cubic-bezier(0.25` | 40 |
