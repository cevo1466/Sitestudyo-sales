# Replikasyon Reçetesi — https://attio.com

Bu dosya, siteyi **sıfırdan yeniden kuracak** kişi ya da yapay zeka için yazıldı. Sıra önemlidir: aşağıdaki adımlar birbirinin üstüne biner.

> **Önce `BUILD_PROMPT.md`'yi oku** — orada yasaklı yapay zeka belirtileri ve metin yazımı kuralları var. Bu dosya *ne kuracağını*, o dosya *nasıl kurmayacağını* söyler.

> **Telif uyarısı:** bu reçete sitenin *tasarım ve etkileşim dilini* tarif eder. Metinleri, fotoğrafları, logoyu ve font dosyalarını kopyalama — onlar kaynak sitenin mülkü. Kendi içeriğinle doldur.

## 1. Teknoloji seçimi

- **4 sabitlenen bölüm var.** Bunun için kaydırmaya bağlı bir zaman çizelgesi kütüphanesi gerekir (GSAP ScrollTrigger ya da native CSS `animation-timeline: scroll()`). Saf IntersectionObserver ile *scrub* yapılamaz — sadece tetikleme yapılır ve sonuç yanlış hisseder.
- **5 sahne kaydırmaya bağlı (scrub).** Bunları zamanlayıcıya bağlarsan site "kendi kendine oynuyor" gibi olur; kaydırma konumuna bağla.
- **Canvas/WebGL katmanı var.** Bu kısım CSS ile taklit edilemez; three.js / OGL gibi bir katman ya da hazır video/görsel dizisi gerekir. Bunu atlarsan site "benziyor ama boş" görünür.
- **Başlıklar harf/kelime bazında bölünmüş.** Bunun için bir bölme yardımcısı gerekir (GSAP SplitText ücretli; `split-type` ücretsiz alternatif). ⚠️ Bölünen metnin ekran okuyucuda tek parça kalması için sarmalayıcıya `aria-label` ver, harflere `aria-hidden` koy.

## 2. Temeli kur

1. `site/tokens-from-source.css` dosyasını projenin köküne al. Bunlar sitenin **kendi** değişkenleri; renk ve boşluk kararlarını buradan türet, ekran görüntüsünden pipet çekme.
2. `site/fonts.css`'teki aileleri **kendi lisansınla** temin et. Değişken font varsa değişken sürümünü kullan; sabit ağırlık kullanmak tipografiyi ölü gösterir.
3. `site/keyframes.css` içindeki 15 kuralı olduğu gibi al — bunlar sitenin CSS'inde yazılı, tahmin değil.

## 3. Sahneleri sırayla kur

Her sahne için ölçülen değerler aşağıda. Bunlar **hedef** değerlerdir: kendi uygulamanda aynı hissi verecek şekilde ayarla, ama mertebeyi koru.

### Sahne 1 — `body.bg-(--color-page-background).[&_*[id]]:scroll-mb-6 > div.flex.min`

- **Sabitle:** kaydırmanın 4579px noktasında başlar, 3150px boyunca ekranda tutulur (üst kenar 0px'te sabit). Bu mesafeyi sahnenin ne kadar süreceği belirler — sayfa yüksekliğini buna göre ayır.
- **Bağlanma:** bir kez tetikle ve bırak (geri sardığında tekrar oynamamalı).
- İçindeki 1 eleman aynı hareketi miras alıyor; ayrı ayrı animasyon yazma.

### Sahne 2 — `div.container.flex > div.flex.w-full > div.lg:grid.lg:grid-cols-24 > n`

- **Sabitle:** kaydırmanın 4579px noktasında başlar, 2520px boyunca ekranda tutulur (üst kenar 116px'te sabit). Bu mesafeyi sahnenin ne kadar süreceği belirler — sayfa yüksekliğini buna göre ayır.
- **Bağlanma:** bir kez tetikle ve bırak (geri sardığında tekrar oynamamalı).

### Sahne 3 — `html.font-sans.text-base > body.bg-(--color-page-background).[&_*[id]]`

- **Sabitle:** kaydırmanın 4579px noktasında başlar, 3150px boyunca ekranda tutulur (üst kenar 730px'te sabit). Bu mesafeyi sahnenin ne kadar süreceği belirler — sayfa yüksekliğini buna göre ayır.
- **Bağlanma:** bir kez tetikle ve bırak (geri sardığında tekrar oynamamalı).

### Sahne 4 — `div.relative.mx-auto > div.relative > div.absolute.inset-0 > div.absol`

- **Giriş:** `opacity` 0 → 1; `scale` 0.9 → 0.95 — 630px kaydırma boyunca.
- **Bağlanma:** bir kez tetikle ve bırak (geri sardığında tekrar oynamamalı).

### Sahne 5 — `div.select-none.border-subtle-stroke > div.relative.h-[327px] > div.ab`

- **Giriş:** `opacity` 0 → 1; `translateY` 16px → 0px — 630px kaydırma boyunca.
- **Bağlanma:** bir kez tetikle ve bırak (geri sardığında tekrar oynamamalı).

### Sahne 6 — `div.absolute.top-[60px] > div.overflow-hidden.rounded-t-[6px] > div.fl`

- **Giriş:** `opacity` 0 → 1 — 630px kaydırma boyunca.
- **Bağlanma:** bir kez tetikle ve bırak (geri sardığında tekrar oynamamalı).

### Sahne 7 — `div.relative.aspect-[1044/654] > div.absolute.top-0 > div.absolute.top`

- **Giriş:** `opacity` 0 → 1; `translateY` 14px → 0px — 630px kaydırma boyunca.
- **Bağlanma:** bir kez tetikle ve bırak (geri sardığında tekrar oynamamalı).
- İçindeki 2 eleman aynı hareketi miras alıyor; ayrı ayrı animasyon yazma.

### Sahne 8 — `div.bg-white-100.px-6 > div.mt-3.grid > div.overflow-hidden.rounded-xl`

- **Giriş:** `opacity` 0 → 0.919 — 1260px kaydırma boyunca.
- **Bağlanma:** bir kez tetikle ve bırak (geri sardığında tekrar oynamamalı).
- İçindeki 2 eleman aynı hareketi miras alıyor; ayrı ayrı animasyon yazma.

### Sahne 9 — `div.bg-white-100.px-6 > div.mt-3.grid > div.overflow-hidden.rounded-xl`

- **Giriş:** `opacity` 0 → 1 — 1260px kaydırma boyunca.
- **Bağlanma:** bir kez tetikle ve bırak (geri sardığında tekrar oynamamalı).
- İçindeki 2 eleman aynı hareketi miras alıyor; ayrı ayrı animasyon yazma.

### Sahne 10 — `div.relative > div.relative.overflow-hidden > div.pointer-events-none.`

- **Giriş:** `opacity` 0 → 1; `clip-path` farkli → acik — 2520px kaydırma boyunca.
- **Bağlanma:** kaydırma konumuna bağla (geri sardığında geri sarmalı).

### Sahne 11 — `div.relative.overflow-hidden > div.absolute.inset-x-0 > div.flex.max-w`

- **Giriş:** `opacity` 0 → 0.963 — 1260px kaydırma boyunca.
- **Bağlanma:** kaydırma konumuna bağla (geri sardığında geri sarmalı).

### Sahne 12 — `div.relative > div.relative.overflow-hidden > div.absolute.inset-x-0 >`

- **Giriş:** `opacity` 0 → 1; `scale` 0.84 → 1 — 2520px kaydırma boyunca.
- **Bağlanma:** kaydırma konumuna bağla (geri sardığında geri sarmalı).

### Sahne 13 — `div.relative.overflow-hidden > div.absolute.inset-x-0 > div.pointer-ev`

- **Giriş:** `opacity` 0 → 1 — 2520px kaydırma boyunca.
- **Bağlanma:** kaydırma konumuna bağla (geri sardığında geri sarmalı).

### Sahne 14 — `div.container.flex > div.flex.w-full > div.h-[250svh] > div.sticky.top`

- **Sabitle:** kaydırmanın 11509px noktasında başlar, 1260px boyunca ekranda tutulur (üst kenar 116px'te sabit). Bu mesafeyi sahnenin ne kadar süreceği belirler — sayfa yüksekliğini buna göre ayır.
- **Bağlanma:** bir kez tetikle ve bırak (geri sardığında tekrar oynamamalı).
- İçindeki 1 eleman aynı hareketi miras alıyor; ayrı ayrı animasyon yazma.

### Sahne 15 — `div.container.flex > div.w-full.flex-1 > div.overflow-hidden.relative `

- **Giriş:** `opacity` 0.051 → 1 — 1260px kaydırma boyunca.
- **Bağlanma:** bir kez tetikle ve bırak (geri sardığında tekrar oynamamalı).
- İçindeki 1 eleman aynı hareketi miras alıyor; ayrı ayrı animasyon yazma.

### Sahne 16 — `div.container.flex > div.w-full.flex-1 > div.overflow-hidden.relative `

- **Giriş:** `opacity` 0 → 1; `clip-path` farkli → acik — 630px kaydırma boyunca.
- **Bağlanma:** bir kez tetikle ve bırak (geri sardığında tekrar oynamamalı).

### Sahne 17 — `div.w-full.flex-1 > div.relative.z-10 > div.col-[3/-3].grid > div.flex`

- **Giriş:** `opacity` 0 → 1 — 630px kaydırma boyunca.
- **Bağlanma:** bir kez tetikle ve bırak (geri sardığında tekrar oynamamalı).
- İçindeki 1 eleman aynı hareketi miras alıyor; ayrı ayrı animasyon yazma.

### Sahne 18 — `div.w-full.flex-1 > div.relative.z-10 > div.col-[3/-3].grid > div.flex`

- **Giriş:** `opacity` 0 → 1 — 630px kaydırma boyunca.
- **Bağlanma:** bir kez tetikle ve bırak (geri sardığında tekrar oynamamalı).
- İçindeki 1 eleman aynı hareketi miras alıyor; ayrı ayrı animasyon yazma.

## 4. Detay teknikleri

- **Başlık açılışı:** başlıkları satır/kelime/harf olarak böl ve kademeli (stagger) aç. Ölçüm: 47 harf, 306 kelime sarmalayıcı. Erişilebilirlik için sarmalayıcıya `aria-label`.
- **Karışım modu:** 79 elemanda `mix-blend-mode` var. Bu, üst üste binen katmanların rengini değiştirir; düz opaklıkla taklit edilirse görsel kimlik kaybolur.
- **Maske / clip-path:** 53 maske, 13 clip-path. Açılma efektlerini opaklıkla değil geometriyle yap.
- ⚠️ **Performans:** kaynak sitede 88 elemanda `will-change` var. Bunu birebir kopyalama — her eleman GPU katmanına alınırsa mobilde bellek şişer. Sadece gerçekten animasyonlu elemanlara ver.

## 5. Bittiğinde doğrula

Aşağıdakilerin hepsi geçmeden "aynısı oldu" deme:

- [ ] Sayfa uzunluğu ~13.54 ekran boyu (çok kısa çıktıysa sabitlenen bölümleri atlamışsın demektir)
- [ ] 4 sabitlenen bölüm var ve toplam sabitlenme mesafesi tutuyor
- [ ] 0 parallaks katmanı ve hız dağılımı (-) benzer
- [ ] Kaydırmayı geri sardığında `scrub` işaretli sahneler geri sarıyor, `bir kez tetiklenir` işaretliler yerinde kalıyor
- [ ] `prefers-reduced-motion: reduce` açıkken tüm scroll animasyonları kapanıyor
- [ ] Klavye ile gezinilebiliyor ve sabitlenen bölümler odağı hapsetmiyor
- [ ] `BUILD_PROMPT.md`'deki yasak listesinden hiçbiri sayfada yok
