# Hareket Dili

Zaman çizelgesi referans sayfası: `https://attio.com/`

> Bu bölümdeki her sayı sayfa gerçekten kaydırılırken ölçüldü — ekran görüntüsünden ya da modelden tahmin edilmedi. Kaydırma adımı başına elemanların konumu, opaklığı ve transform matrisi örneklendi.

> ⚠️ **Ölçüm çözünürlüğü ±530px.** Örnekler bu aralıkla alındığı için aşağıdaki mesafeler bir örnekleme adımından daha hassas değildir: 900 ms'lik bir giriş animasyonu ile 200 ms'lik bir CSS geçişi aynı değeri üretebilir. Mertebeye güven, ondalığa değil.

## Sayfa ölçeği

- Kaydırma yolu: **12189 px** (~13.54 ekran boyu)
- Ölçüm noktası: 24 kaydırma adımı, 133 eleman izlendi

## Hareket profili

| Ölçüm | Değer |
|---|---:|
| Animasyonlu eleman (sahne) | 21 |
| Sabitlenen (pinned) bölüm | 4 |
| Toplam sabitlenme mesafesi | 4410 px (~4.9 ekran) |
| Parallaks katman | 0 |
| Yatay kaydırma şeridi | 0 |
| Kaydırmaya bağlı (scrub) | 5 |
| Bir kez tetiklenen | 15 |
| Bağlanması ölçülemedi | 1 |
| Açılışta oynayan | 0 |

## Sahneler (belge sırasıyla)

| # | Eleman | Ne oluyor | Ölçüm | Bağlanma |
|---:|---|---|---|---|
| 1 | `body.bg-(--color-page-background).[&_*[id]]:scroll-mb-6 > di` | sabitlenir (pin) | 3150px boyunca, üst kenar 0px'te | bir kez tetiklenir |
| 2 | `div.container.flex > div.flex.w-full > div.lg:grid.lg:grid-c` | sabitlenir (pin) | 2520px boyunca, üst kenar 116px'te | bir kez tetiklenir |
| 3 | `html.font-sans.text-base > body.bg-(--color-page-background)` | sabitlenir (pin), CSS `enter` | 3150px boyunca, üst kenar 730px'te | bir kez tetiklenir |
| 4 | `div.relative.mx-auto > div.relative > div.absolute.inset-0 >` | fade-scale | opacity 0→1; scale 0.9→0.95 · 630px kaydırma boyunca | bir kez tetiklenir |
| 5 | `div.select-none.border-subtle-stroke > div.relative.h-[327px` | fade-up | opacity 0→1; translateY 16px→0px · 630px kaydırma boyunca | bir kez tetiklenir |
| 6 | `div.absolute.top-[60px] > div.overflow-hidden.rounded-t-[6px` | fade | opacity 0→1 · 630px kaydırma boyunca | bir kez tetiklenir |
| 7 | `div.relative.aspect-[1044/654] > div.absolute.top-0 > div.ab` | fade-up | opacity 0→1; translateY 14px→0px · 630px kaydırma boyunca | bir kez tetiklenir |
| 8 | `div.bg-white-100.px-6 > div.mt-3.grid > div.overflow-hidden.` | fade | opacity 0→0.919 · 1260px kaydırma boyunca | bir kez tetiklenir |
| 9 | `div.bg-white-100.px-6 > div.mt-3.grid > div.overflow-hidden.` | fade | opacity 0→1 · 1260px kaydırma boyunca | bir kez tetiklenir |
| 10 | `div.relative > div.relative.overflow-hidden > div.pointer-ev` | clip-reveal | opacity 0→1; clip-path farkli→acik · 2520px kaydırma boyunca | kaydırmaya bağlı (scrub) |
| 11 | `div.relative.overflow-hidden > div.absolute.inset-x-0 > div.` | fade | opacity 0→0.963 · 1260px kaydırma boyunca | kaydırmaya bağlı (scrub) |
| 12 | `div.relative > div.relative.overflow-hidden > div.absolute.i` | fade-scale | opacity 0→1; scale 0.84→1 · 2520px kaydırma boyunca | kaydırmaya bağlı (scrub) |
| 13 | `div.relative.overflow-hidden > div.absolute.inset-x-0 > div.` | fade | opacity 0→1 · 2520px kaydırma boyunca | kaydırmaya bağlı (scrub) |
| 14 | `div.container.flex > div.flex.w-full > div.h-[250svh] > div.` | sabitlenir (pin) | 1260px boyunca, üst kenar 116px'te | bir kez tetiklenir |
| 15 | `div.container.flex > div.w-full.flex-1 > div.overflow-hidden` | fade | opacity 0.051→1 · 1260px kaydırma boyunca | bir kez tetiklenir |
| 16 | `div.container.flex > div.w-full.flex-1 > div.overflow-hidden` | clip-reveal | opacity 0→1; clip-path farkli→acik · 630px kaydırma boyunca | bir kez tetiklenir |
| 17 | `div.w-full.flex-1 > div.relative.z-10 > div.col-[3/-3].grid ` | fade | opacity 0→1 · 630px kaydırma boyunca | bir kez tetiklenir |
| 18 | `div.w-full.flex-1 > div.relative.z-10 > div.col-[3/-3].grid ` | fade | opacity 0→1 · 630px kaydırma boyunca | bir kez tetiklenir |

> Bu sahnelerin içinde aynı hareketi miras alan **11** iç eleman daha var; animasyonu yukarıdaki dış elemana bağlaman yeterli.

## İmza teknikleri

| Teknik | Ölçüm | Anlamı |
|---|---:|---|
| Metin bölme (SplitText) | 47 | başlıklar harf/kelime bazında sarmalanmış — harf harf açılma tekniği |
| Karışım modu (mix-blend) | 79 | katmanlar birbirine karışıyor; düz üst üste bindirme aynı hissi vermez |
| Maske | 53 | maskeyle açılan/kesilen yüzeyler |
| clip-path | 13 | geometrik açılma efektleri |
| Canvas / WebGL | 2 | shader ya da 2B tuval katmanı var — CSS ile taklidi mümkün değil |
| Yapışık (sticky) eleman | 10 | CSS sticky ile tutulan bölümler |
| Yatay şerit | 4 | viewport'tan geniş, yana kayan konteyner |
| Kaydırma yakalama (snap) | 1 | bölümler kaydırmada yerine oturuyor |
| will-change | 88 | GPU katmanına alınmış eleman sayısı — performans bütçesinin işareti |

✅ **`prefers-reduced-motion` destekleniyor** (6 kural). Taklit ederken bunu ATLAMA — erişilebilirlik gereği ve ödüllü sitelerin standardı.

## Sitenin kendi tanımları

Aşağıdakiler ölçülmüş ya da tahmin edilmiş değil — sitenin CSS'inde **yazılı** olan tanımlardır. ZIP içinde `site/` klasöründe birebir kopyalanabilir hâlde duruyorlar.

- **15 @keyframes** → `site/keyframes.css` (ai-hero-box-gradient-spin, completed, connection, enter, infra-fade-in, infra-reveal-to-right, pipeline-radar-bob, pipeline-radar-ring-inner …)
- **18 @font-face** → `site/fonts.css` (JetBrains Mono, JetBrains Mono Fallback, inter, inter Fallback, interDisplay, interDisplay Fallback)
- **162 CSS değişkeni** → `site/tokens-from-source.css`

**En çok kullanılan geçiş eğrileri:**

| Süre ve eğri | Kaç elemanda |
|---|---:|
| `0.3s \| cubic-bezier(0` | 513 |
| `0.3s \| cubic-bezier(0.2` | 355 |
| `0.15s \| cubic-bezier(0` | 327 |
| `0.4s \| cubic-bezier(0.65` | 226 |
| `0.4s \| cubic-bezier(0.2` | 220 |
| `0.4s \| ease` | 87 |

## Tekdüzelik ölçümü (yapay zeka izi)

- Baskın giriş animasyonu: `fade` (%57)
- Farklı teknik sayısı: 4

✅ Giriş animasyonları çeşitli. Taklit ederken de tek bir `fade-up` kalıbına düşme.
