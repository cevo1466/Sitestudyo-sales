# AI Brief — SADECE TASARIM

Bu brief `linear.app` kaynağından çıkarılan tasarım sinyallerini kullanır. Kaynak siteyi kopyalama.

> **Önce `BUILD_PROMPT.md` dosyasını oku.** Yasaklı yapay zeka belirtileri ve
> metin yazım kuralı (humanizer) orada, bu sitede ölçülen değerlerle birlikte.

## Yasaklı Yapay Zeka Belirtileri (özet)

- Yanıp sönen, nefes alan, parlayan (pulse / glow / box-shadow halesi) buton ve kart YOK. (bu sitede: 0 adet)
- Tam yuvarlak (pill / border-radius:999px) rozet ve etiket enflasyonu YOK. (bu sitede: 4 adet)
- Her kutuya birden yuvarlak köşe + gölge verme. (bu sitede: %2)
- Mor-indigo gradyan (#8b5cf6 → #6366f1 ailesi) YOK. (bu sitede: 0 adet)
- Gradyan dolgulu (background-clip:text) başlık YOK. (bu sitede: 0 adet)
- Cam efekti (backdrop-filter: blur) yüzey enflasyonu YOK. (bu sitede: 2 adet)
- Birbirinin tıpatıp aynısı 3'lü kart dizisi YOK. (bu sitede: 0 adet)
- Başlıklarda emoji YOK. (bu sitede: 0 adet)
- Varsayılan çerçeve paletini (Tailwind slate/indigo/violet tonları) olduğu gibi kullanma. (bu sitede: %0)
- Stok/placeholder görsel (unsplash, placehold, picsum) YOK. (bu sitede: %0)
- Lorem ipsum ve "doldurma" metin YOK. (bu sitede: 0 adet)
- Sayfanın tamamını ortalama. (bu sitede: %0)
- Rastgele boşluk değerleri kullanma. (bu sitede: %84)
- Onlarca farklı punto kullanma. (bu sitede: 8 adet)
- WCAG AA eşiğinin altında metin/zemin çifti bırakma. (bu sitede: %52)
- Bütün site metinleri `humanizer` skill'i ile yazılacak: `npx skills add https://github.com/blader/humanizer --skill humanizer`

## Görev

Özgün bir web tasarımı üret. Kaynak siteden sadece tasarım sistemi, layout ritmi, component karakteri ve görsel hiyerarşi prensiplerini öğren.

## Kesin Kurallar

- Kaynak başlık, paragraf, CTA, menü, marka anlatısı veya ürün metni kullanma.
- Birebir section sırası veya birebir layout kopyalama.
- Kendi özgün içerik mimarini ve copy'ni oluştur.
- Renk, tipografi, spacing, radius, border, shadow ve component yaklaşımını soyut tasarım sistemi olarak uygula.

## Tasarım Yönü

- Yoğunluk: `balanced`
- Görsel hiyerarşi: `section-first with reusable component rhythm`
- Renk stratejisi: `use dominant palette roles; avoid copying brand-specific content`
- Tipografi stratejisi: `reuse scale and contrast, not source copy`

## Sayfa ve Section Sinyalleri

- Sayfa tipleri: `content/blog, home, unknown`
- Baskın sectionlar: `content, generic-block, footer, card-grid, gallery, hero, form`

## Kalite Skoru

- Taranan / keşfedilen sayfa: `6` / `157`
- Crawl coverage: `0.04`
- Design signal strength: `1.0`
- Section confidence: `0.79`
- Component confidence: `0.04`
- Content-free compliance: `tespit-edilemedi`

## Kullanılacak Dosyalar

- `design-system.json`
- `sections.json`
- `component-patterns.json`
- `DESIGN.md`

## Global Design System Direktifi

`design-system.json` artık sadece token listesi değildir; Visual Theme & Atmosphere, Color System, Typography System, Component Library, Layout System, Elevation System, Motion Language, Design Principles, Do & Don't ve AI Design Generation Guide bölümlerini içeren profesyonel tasarım dili specification'ıdır.

Bu brief'in amacı aynı siteyi yapmak değil, aynı tasarım kalite seviyesinde yeni ve özgün bir arayüz üretmektir.
