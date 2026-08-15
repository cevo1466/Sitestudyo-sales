# DESIGN.md — Design-Only Reference

> SADECE TASARIM analizi  
> Oluşturulma: 2026-08-15 22:40  
> Kaynak: Playwright crawl + computed CSS extraction + teknoloji imzaları + Vision analizi

## Kullanım Notu

Bu dosya bir siteyi birebir kopyalamak için değildir. Amaç, incelenen sitenin **tasarım dilinden, layout mantığından, spacing/typography/color sisteminden ve component yaklaşımından esinlenmek** için tarafsız bir tasarım referansı üretmektir.

**Kesin kurallar:**

- İncelenen sitenin başlıklarını, paragraflarını, CTA/button yazılarını, menü metinlerini, marka anlatısını veya sayfa copy'sini kullanma.
- Sayfa düzenini birebir klonlama; aynı hiyerarşi prensibini özgün içerik ve farklı kompozisyonla yeniden yorumla.
- Görsel stil, renk oranı, tipografi hissi, boşluk sistemi, radius/border/shadow dili ve component davranışını soyutla.
- Bu dokümanı başka bir yapay zekaya verirken görev tanımı: **"Bu kaynaktan sadece tasarım yaklaşımını öğren, içerik ve birebir layout kopyalama."**
- Kesin veriler DOM/CSS ve HTTP kanıtlarından gelir; Vision bölümleri görsel çıkarımdır ve confidence notlarıyla değerlendirilmelidir.

## Genel Bakış

| Özellik | Değer |
|---|---|
| Kaynak domain | `attio.com` |
| Gezilen sayfa | 8 |
| Keşfedilen aday sayfa | 64 |
| Vision ile analiz edilen sayfa | 8 |
| Tespit edilen teknoloji | 8 |
| Analiz tarihi | 2026-08-15 22:40 |

## Teknoloji Yığını

| Teknoloji | Kategori | Güven | Kanıt |
|---|---:|---:|---|
| **Cloudflare** | `cdn_security` | 0.96 | `` |
| **Google Analytics 4** | `analytics` | 0.92 | `` |
| **Google Tag Manager** | `tag_manager` | 0.93 | `` |
| **Meta Pixel** | `analytics` | 0.92 | `` |
| **Next.js** | `frontend_framework` | 0.99 | `` |
| **React** | `frontend_framework` | 0.99 | `` |
| **Tailwind CSS** | `css_framework` | 0.99 | `` |
| **Vercel** | `hosting` | 0.94 | `` |

### Yığın Kararı

- **Ana yığın:** Next.js 16.2.5 + React + Tailwind CSS 4.x
- **Frontend:** Next.js 16.2.5, React
- **Backend:** —
- **Platform / CMS:** —
- **Stil katmanı:** —

### Altyapı

| Alan | Tespit |
|---|---|
| server | cloudflare |
| x_powered_by | Next.js |


### Varlık Profili

- **Görsel formatları:** svg ×102, woff2 ×81, gif ×9, jpg ×7, png ×3
- **Modern format oranı (avif/webp/svg):** %84
- **Font kaynağı:** attio.com
- **Üçüncü parti host sayısı:** 41


## Kaydırma Deneyimi ve Hareket Yığını

Bu sitede özel bir kaydırma **kütüphanesi** tespit edilmedi; tarayıcının standart kaydırması kullanılıyor.

**Kaydırma modeli:** Tarayıcının kendi kaydırması (özel bir smooth-scroll katmanı yok)

**Sayfa uzunluğu:** ~19.63 ekran boyu

**Ekran görüntüsü yakalama:** `scrolled_full_page` × 4, `static_full_page` × 4

Sayfalar gerçek tekerlek olaylarıyla gezilerek toplam **70** gizli blok açığa çıkarıldı. Kaydırmadan alınan klasik bir screenshot bu blokları boş yakalardı.

**Ölçülen koreografi:**
- Sabitlenen (pin) bölüm: **4** (toplam 4410 px)
- Parallaks katman: **0**
- Yatay kaydırma şeridi: **0**
- Kaydırmaya bağlı (scrub) sahne: **5**, bir kez tetiklenen: **15**

> Sahne sahne ölçümler, sitenin kendi `@keyframes`/`@font-face`/`:root` tanımları ve bölüm bölüm yeniden kurma reçetesi ZIP içindeki **`MOTION.md`**, **`REPLICATE.md`** ve **`site/`** klasöründe.


## Kalite ve Erişilebilirlik (ölçüm katmanı)

Bu bölüm ekran görüntüsü yorumu değil, sayfada çalıştırılan **ölçümlerin**
sonucudur. Aynı ölçüm katmanı "Yapay Zeka Belirtilerini Tara" modunu da besler.

**Yapay zeka izi skoru: 81.2/100** (Genel olarak sağlam; sayılı noktada şablon alışkanlığı var.) · 22/22 metrik ölçüldü

| Grup | Skor | Metrik |
|---|---:|---:|
| İşçilik & Hiyerarşi | 52.2 | 3 |
| Görsel Dil | 66.7 | 2 |
| Düzen & Kompozisyon | 79.9 | 7 |
| Tipografi | 84.5 | 3 |
| Renk & Efekt | 99.1 | 7 |

### Erişilebilirlik

- **10** / 220 metin-zemin çifti WCAG AA eşiğinin altında (%4.5)
- **287** / 555 görselde alt metni yok (%51.7)

> Yeni tasarımı üretirken bu iki sayıyı **iyileştirmek** hedeftir; kaynak
> sitenin kontrast hatalarını taşıma.

### En düşük skorlu ölçümler

| Ölçüm | Bulunan | Hedef | Skor |
|---|---:|---:|---:|
| Bölüm ritmi tekdüzeliği | %100 | %55 | 0.0 |
| Alt metni olmayan görsel | %97 | %10 | 0.0 |
| Baskın buton stili | %100 | %60 | 0.0 |
| Ayrışan buton stili sayısı | 1 adet | 3 adet | 0.0 |
| Birebir aynı kart grupları | 4 adet | 2 adet | 71.4 |
| Farklı boşluk değeri sayısı | 20 adet | 14 adet | 75.0 |
| Yazı ailesi sayısı | 3 adet | 2 adet | 75.0 |
| Farklı yazı boyutu sayısı | 12 adet | 9 adet | 83.3 |
| Cam efekti (backdrop blur) | 2 adet | 1 adet | 88.9 |
| Boşluk grid uyumu (4px) | %87 | %88 | 96.5 |
| Yuvarlak köşe + gölge birlikteliği | %2 | %18 | 100.0 |
| Ortalanmış metin oranı | %2 | %30 | 100.0 |


## Responsive Davranış (ölçülen)

Bu tablo **gerçekten ziyaret edilen** viewport'ların ölçümüdür. Önceki
sürümlerde bu bölümde sabit bir breakpoint listesi vardı ve tek bir masaüstü
viewport'tan üretilmesine rağmen ölçülmüş gibi sunuluyordu.

| Viewport | Baskın kolon | Gizlenen nav linki | Gövde puntosu | Yatay taşma |
|---|---:|---:|---:|---:|
| Mobil (390px) | 12 | %96 | 16px | 0 |
| Tablet (768px) | 12 | %96 | 16px | 0 |
| Masaüstü (1440px) | 12 | %86 | 16px | 0 |

**Sitenin CSS'inde beyan ettiği eşikler:** `992px` (26 kural), `375px` (19 kural), `768px` (14 kural), `1200px` (11 kural), `576px` (9 kural), `1536px` (8 kural), `1199px` (1 kural)

- Mobilde navigasyon linklerinin çoğu gizleniyor (hamburger menü deseni).


## Tasarım Token'ları

Bu bölüm screenshot tahmininden bağımsız olarak görünür DOM elemanlarının computed CSS değerlerinden çıkarılmıştır.

### Renk Token'ları

- `#242629` — örnek pay: 30%
- `#000000` — örnek pay: 25%
- `#505155` — örnek pay: 19%
- `#266df0` — örnek pay: 3%
- `#e0fced` — örnek pay: 2%
- `#007d53` — örnek pay: 2%
- `#056c87` — örnek pay: 2%
- `#00d17e` — örnek pay: 1%
- `#ddf9e4` — örnek pay: 1%
- `#0b935d` — örnek pay: 1%

### Tipografi Token'ları

- `inter` — örnek pay: 96%
- `interDisplay` — örnek pay: 2%
- `tiemposText` — örnek pay: 1%
- `JetBrains Mono` — örnek pay: 0%
- `system-ui` — örnek pay: 0%

**Sık görülen font boyutları:** `16px`, `14px`, `12px`, `15px`, `40px`, `32px`, `10px`, `18px`, `11px`, `28px`

### Şekil / Radius

**Sık görülen border-radius değerleri:** `0px`, `7px`, `30%`, `8px`, `10px`, `12px`, `3.35544e+07px`, `6px`

### Spacing / Border / Shadow

**Sık görülen spacing değerleri:** `1px`, `4px`, `12px`, `8px`, `24px`, `18px`, `6px`, `2px`, `20px`, `10px`

**Border width değerleri:** `1px`

**Shadow değerleri:** `rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, oklch(0 0 0 / 0.01) 0px `, `rgba(0, 0, 0, 0.04) 0px 1px 3px 0px, rgba(28, 40, 64, 0.18) 0px 0px 2px 0px`, `rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0.05) 0px `, `oklch(0 0 0 / 0.01) 0px 1px 2px 0px, oklch(0 0 0 / 0.02) 0px 2px 4px -1px, oklch(0 0 0 / 0.03) 0px 4px 8px -2px`


## Global Design System

Bu bölüm tek tek sayfa anlatımı değil, bütün crawl + Vision + computed CSS sinyallerinden çıkarılmış ortak tasarım dili specification'ıdır.

### 1. Visual Theme & Atmosphere

- **Tasarım dili:** derived from repeated color, typography, spacing, surface and section patterns across the crawled site
- **Marka karakteri:** infer as polished, consistent and system-led when token repetition is strong; adjust tone to the new brand
- **Görsel atmosfer:** use the observed density, whitespace and surface hierarchy rather than source content
- **Kullanıcı hissi:** predictable, coherent and easy to scan; preserve clarity over decorative noise
- **Temel prensipler:** reuse the extracted token proportions, keep hierarchy section-first and component-consistent, separate primary actions from neutral surfaces, preserve whitespace rhythm across pages, avoid source copy and exact composition

### 2. Color System

- **background** `#e0fced` — kullanım oranı: 17%; kullan: page backgrounds, large quiet surfaces, negative space; kaçın: small text, critical actions without contrast checks; hover: tespit-edilemedi (öneri): temel renkten %6-10 koyu/açık bir durum türet; kontrastı uygulamada doğrula; active: tespit-edilemedi (öneri): temel renkten %10-14 daha güçlü bir durum türet; yeni renk ailesi katma
- **surface** `#266df0` — kullanım oranı: 15%; kullan: cards, modals, inputs; kaçın: primary CTA if it blends into the page; hover: tespit-edilemedi (öneri): temel renkten %6-10 koyu/açık bir durum türet; kontrastı uygulamada doğrula; active: tespit-edilemedi (öneri): temel renkten %10-14 daha güçlü bir durum türet; yeni renk ailesi katma
- **text** `#242629` — kullanım oranı: 34%; kullan: primary reading text, headings when contrast is sufficient; kaçın: large filled surfaces, decorative backgrounds; hover: tespit-edilemedi (öneri): temel renkten %6-10 koyu/açık bir durum türet; kontrastı uygulamada doğrula; active: tespit-edilemedi (öneri): temel renkten %10-14 daha güçlü bir durum türet; yeni renk ailesi katma
- **muted_text** `#000000` — kullanım oranı: 29%; kullan: helper text, metadata, secondary labels; kaçın: primary actions, long body copy at low contrast; hover: tespit-edilemedi (öneri): temel renkten %6-10 koyu/açık bir durum türet; kontrastı uygulamada doğrula; active: tespit-edilemedi (öneri): temel renkten %10-14 daha güçlü bir durum türet; yeni renk ailesi katma
- **border** `#000000` — kullanım oranı: 42%; kullan: separators, input outlines, card boundaries; kaçın: large text blocks, dominant brand moments; hover: tespit-edilemedi (öneri): temel renkten %6-10 koyu/açık bir durum türet; kontrastı uygulamada doğrula; active: tespit-edilemedi (öneri): temel renkten %10-14 daha güçlü bir durum türet; yeni renk ailesi katma
- **primary_action** `#266df0` — kullanım oranı: 3%; kullan: main CTA, selected state, high-emphasis controls; kaçın: dense backgrounds, long reading surfaces; hover: tespit-edilemedi (öneri): temel renkten %6-10 koyu/açık bir durum türet; kontrastı uygulamada doğrula; active: tespit-edilemedi (öneri): temel renkten %10-14 daha güçlü bir durum türet; yeni renk ailesi katma
- **accent** `#056c87` — kullanım oranı: 2%; kullan: badges, focus cues, small visual anchors; kaçın: body copy, large page backgrounds; hover: tespit-edilemedi (öneri): temel renkten %6-10 koyu/açık bir durum türet; kontrastı uygulamada doğrula; active: tespit-edilemedi (öneri): temel renkten %10-14 daha güçlü bir durum türet; yeni renk ailesi katma
- **success** `#00d17e` — kullanım oranı: 0%; kullan: supporting UI role; kaçın: unrelated semantic roles; hover: tespit-edilemedi (öneri): temel renkten %6-10 koyu/açık bir durum türet; kontrastı uygulamada doğrula; active: tespit-edilemedi (öneri): temel renkten %10-14 daha güçlü bir durum türet; yeni renk ailesi katma
- **warning** `#f5a300` — kullanım oranı: 0%; kullan: supporting UI role; kaçın: unrelated semantic roles; hover: tespit-edilemedi (öneri): temel renkten %6-10 koyu/açık bir durum türet; kontrastı uygulamada doğrula; active: tespit-edilemedi (öneri): temel renkten %10-14 daha güçlü bir durum türet; yeni renk ailesi katma
- **error** `#b81c5d` — kullanım oranı: 0%; kullan: supporting UI role; kaçın: unrelated semantic roles; hover: tespit-edilemedi (öneri): temel renkten %6-10 koyu/açık bir durum türet; kontrastı uygulamada doğrula; active: tespit-edilemedi (öneri): temel renkten %10-14 daha güçlü bir durum türet; yeni renk ailesi katma

Semantic feedback renkleri: success `#00d17e`, warning `#f5a300`, error `#b81c5d`.

### 3. Typography System

**Font family:** `inter`

- **display** — size `64px`, weight `600`, line-height `60.8px`, letter-spacing `-0.16px`; amaç: largest brand/hero statement only
- **h1** — size `64px`, weight `600`, line-height `60.8px`, letter-spacing `-0.16px`; amaç: page-level heading
- **h2** — size `40px`, weight `600`, line-height `44px`, letter-spacing `-0.16px`; amaç: major section heading
- **h3** — size `24px`, weight `500`, line-height `30px`, letter-spacing `-0.16px`; amaç: card or subsection heading
- **body** — size `16px`, weight `500`, line-height `22px`, letter-spacing `-0.16px`; amaç: primary reading and descriptions
- **small** — size `14px`, weight `500`, line-height `20px`, letter-spacing `-0.16px`; amaç: secondary descriptions and compact UI
- **caption** — size `12px`, weight `500`, line-height `14px`, letter-spacing `-0.16px`; amaç: metadata, helper text and annotations
- **button** — size `16px`, weight `500`, line-height `22px`, letter-spacing `-0.16px`; amaç: interactive commands
- **label** — size `14px`, weight `500`, line-height `20px`, letter-spacing `-0.16px`; amaç: form labels and UI descriptors

### 4. Component Library

- **Primary Button** — `{"name": "Primary Button", "background": "#266df0", "text": "#ffffff", "radius": "0px", "padding": "1px 4px", "height": "44-52px", "hover": "tespit-edilemedi (öneri): kontrastı hafifçe artır, renk ailesini koru", "active": "tespit-edilemedi (öneri): daha koyu/güçlü dolguyla görsel olarak sıkıştır", "disabled": "reduce opacity to 45-55%, keep geometry unchanged, remove elevation", "shadow": "rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, oklch(0 0 0 / 0.01) 0px ", "border": "transparent or same-color border", "contrast_ratio": 4.64}`
- **Secondary Button** — `{"name": "Secondary Button", "background": "#e0fced", "text": "#242629", "radius": "0px", "padding": "1px 4px", "height": "42-50px", "hover": "tespit-edilemedi (öneri): #266df0 ya da düşük kontrastlı bir ton kullan", "active": "tespit-edilemedi (öneri): kenarlık kontrastını artır, yüzey parlaklığını azalt", "disabled": "reduce opacity to 45-55%, keep geometry unchanged, remove elevation", "shadow": "none or lower than primary surfaces", "border": "1px solid current palette border"}`
- **Cards** — `{"name": "Cards", "background": "#e0fced", "text": "#242629", "radius": "0px", "padding": "4px", "height": "content-defined; preserve consistent vertical rhythm", "hover": "tespit-edilemedi (öneri): kenarlık kontrastını ya da yüksekliği hafif artır; boyut değiştirme", "active": "tespit-edilemedi (öneri): yüzeyi sabit tut; seçili durumu kenarlık/aksan ile göster", "disabled": "reduce opacity to 45-55%, keep geometry unchanged, remove elevation", "shadow": "rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, oklch(0 0 0 / 0.01) 0px ", "border": "1px solid low-contrast border"}`
- **Pricing Cards** — `{"status": "not-observed", "note": "Bu sitede 'pricing_cards' pattern'ine dair DOM kaniti bulunamadi; spec uretilmedi. Ihtiyacin varsa mevcut token'lardan turet."}`
- **Hero** — `{"status": "not-observed", "note": "Bu sitede 'hero' pattern'ine dair DOM kaniti bulunamadi; spec uretilmedi. Ihtiyacin varsa mevcut token'lardan turet."}`
- **Navigation** — `{"layout": "horizontal on desktop, collapsed/stacked on mobile", "height": "64-88px desktop, 56-72px mobile", "background": "#e0fced", "border": "1px bottom separator when needed", "item_style": "16px text with compact spacing and clear active state"}`
- **Footer** — `{"layout": "multi-column or compact grouped links", "background": "#242629", "text": "#e0fced", "spacing": "large top/bottom padding with tighter internal link rhythm"}`
- **Inputs** — `{"name": "Inputs", "background": "#e0fced", "text": "#242629", "radius": "0px", "padding": "1px 4px", "height": "42-48px", "hover": "tespit-edilemedi (öneri): kenarlık kontrastını artır", "active": "tespit-edilemedi (öneri): aksan/birincil token ile net bir odak halkası göster", "disabled": "reduce opacity to 45-55%, keep geometry unchanged, remove elevation", "shadow": "none", "border": "1px solid low-contrast border"}`
- **Search** — `{"status": "not-observed", "note": "Bu sitede 'search' pattern'ine dair DOM kaniti bulunamadi; spec uretilmedi. Ihtiyacin varsa mevcut token'lardan turet."}`
- **Dropdown** — `{"status": "not-observed", "note": "Bu sitede 'dropdown' pattern'ine dair DOM kaniti bulunamadi; spec uretilmedi. Ihtiyacin varsa mevcut token'lardan turet."}`
- **Tabs** — `{"status": "not-observed", "note": "Bu sitede 'tabs' pattern'ine dair DOM kaniti bulunamadi; spec uretilmedi. Ihtiyacin varsa mevcut token'lardan turet."}`
- **Badges** — `{"status": "not-observed", "note": "Bu sitede 'badges' pattern'ine dair DOM kaniti bulunamadi; spec uretilmedi. Ihtiyacin varsa mevcut token'lardan turet."}`
- **Alerts** — `{"status": "not-observed", "note": "Bu sitede 'alerts' pattern'ine dair DOM kaniti bulunamadi; spec uretilmedi. Ihtiyacin varsa mevcut token'lardan turet."}`
- **Modal** — `{"status": "not-observed", "note": "Bu sitede 'modal' pattern'ine dair DOM kaniti bulunamadi; spec uretilmedi. Ihtiyacin varsa mevcut token'lardan turet."}`
- **Accordion** — `{"status": "not-observed", "note": "Bu sitede 'accordion' pattern'ine dair DOM kaniti bulunamadi; spec uretilmedi. Ihtiyacin varsa mevcut token'lardan turet."}`
- **Faq** — `{"status": "not-observed", "note": "Bu sitede 'faq' pattern'ine dair DOM kaniti bulunamadi; spec uretilmedi. Ihtiyacin varsa mevcut token'lardan turet."}`
- **Pricing Table** — `{"status": "not-observed", "note": "Bu sitede 'pricing_table' pattern'ine dair DOM kaniti bulunamadi; spec uretilmedi. Ihtiyacin varsa mevcut token'lardan turet."}`
- **Cta Banner** — `{"status": "not-observed", "note": "Bu sitede 'cta_banner' pattern'ine dair DOM kaniti bulunamadi; spec uretilmedi. Ihtiyacin varsa mevcut token'lardan turet."}`
- **Feature Card** — `{"name": "Feature Card", "background": "#e0fced", "text": "#242629", "radius": "0px", "padding": "4px", "height": "content-defined; preserve consistent vertical rhythm", "hover": "tespit-edilemedi (öneri): kenarlık kontrastını ya da yüksekliği hafif artır; boyut değiştirme", "active": "tespit-edilemedi (öneri): yüzeyi sabit tut; seçili durumu kenarlık/aksan ile göster", "disabled": "reduce opacity to 45-55%, keep geometry unchanged, remove elevation", "shadow": "rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, oklch(0 0 0 / 0.01) 0px ", "border": "1px solid low-contrast border"}`
- **Product Card** — `{"name": "Product Card", "background": "#e0fced", "text": "#242629", "radius": "0px", "padding": "4px", "height": "image/media area plus text/action stack", "hover": "tespit-edilemedi (öneri): kenarlık kontrastını ya da yüksekliği hafif artır; boyut değiştirme", "active": "tespit-edilemedi (öneri): yüzeyi sabit tut; seçili durumu kenarlık/aksan ile göster", "disabled": "reduce opacity to 45-55%, keep geometry unchanged, remove elevation", "shadow": "rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, oklch(0 0 0 / 0.01) 0px ", "border": "1px solid low-contrast border"}`

### 5. Layout System

- **Grid:** use observed grid/flex rhythm from component-patterns; choose responsive columns by content density
- **Max width:** 1400px, 240px, 1440px, 280px, 320px, 480px, 1160px, 360px
- **Breakpoints:** {"status": "tespit-edilemedi", "note": "Breakpoint tespiti icin cok-viewport tarama gerekir."}
- **Section spacing:** 1px, 4px, 12px, 8px, 24px, 18px
- **Component spacing:** 8px, 24px, 18px, 6px, 2px, 20px, 10px
- **Container padding:** 1px, 4px, 12px, 8px
- **White-space philosophy:** let sections breathe; use denser rhythm only inside forms, tables and repeated cards
- **Visual rhythm:** dominant sections: generic-block, navbar, content, footer, card-grid, gallery, hero

### 6. Elevation System

- **Shadow scale:** rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, oklch(0 0 0 / 0.01) 0px , rgba(0, 0, 0, 0.04) 0px 1px 3px 0px, rgba(28, 40, 64, 0.18) 0px 0px 2px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0.05) 0px , oklch(0 0 0 / 0.01) 0px 1px 2px 0px, oklch(0 0 0 / 0.02) 0px 2px 4px -1px, oklch(0 0 0 / 0.03) 0px 4px 8px -2px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, lab(99.9987 0.0337958 0.000309944) 0px 0px 0px 0.5px, rgba, rgba(11, 13, 24, 0.06) 0px 0px 0px 1px, rgba(11, 13, 24, 0.024) 0px 1px 2px 0px, rgba(11, 13, 24, 0.03) 0px 3px 6px 0px, rgba(11, 13, 24, 0.035) 0px 8px 14px 0p, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(15, 107, 233, 0.12), rgba(28, 40, 64, 0.08) 0px 6px 20px -2px, rgba(28, 40, 64, 0.06) 0px 2px 6px 0px
- **Border hierarchy:** 1px
- **Radius hierarchy:** 0px, 7px, 30%, 8px, 10px, 12px, 3.35544e+07px, 6px
- **Surface hierarchy:** page background, surface/card, raised/modal, primary action

### 7. Motion Language

- **Hover davranışı:** infer through component states: subtle color, border or elevation change; avoid layout shift
- **Transition süreleri:** 0.3s, 0.4s, 0.15s, 0.2s, 0.5s, 0.6s
- **Animation tipi:** functional micro-interactions only; no decorative motion unless the source repeatedly signals it
- **Scroll davranışı:** standard document scroll with section clarity
- **Carousel davranışı:** only use if required by the product; keep controls explicit and accessible
- **Not:** motion is inferred because static screenshots cannot prove runtime animation

### 8. Design Principles

- CTA colors should come from the highest-contrast primary/action token, not from arbitrary new hues.
- Cards should use the observed surface, border, radius and shadow hierarchy instead of decorative styling.
- Thin borders are preferred when the palette already provides strong surface separation.
- Radius should stay within the extracted hierarchy; do not inflate corners unless the source system supports it.
- Hero sections should preserve generous whitespace and clear hierarchy while using original content.
- Footers may invert surface/text colors when the extracted palette supports strong contrast.

### 9. Do & Don't

**Do**

- Use extracted tokens as ratios and roles, not as a mandate to copy the source.
- Build reusable components from the component specs.
- Keep typography hierarchy consistent across page types.
- Validate contrast for every semantic color role.
- Keep hover/active states subtle and stable.

**Don't**

- Do not copy source headings, paragraphs, menus, CTA labels or brand phrases.
- Do not recreate exact section order or exact page composition.
- Do not add unrelated colors outside the semantic palette.
- Do not treat Vision inferences as stronger than computed CSS evidence.
- Do not produce any of the measured AI tells listed in forbidden_ai_tells.

### 10. AI Design Generation Guide

Generate a new, original design with the same quality level and design logic. Use this document only as a design language specification. Do not generate code from this section and do not copy the source site.

- Start from the semantic color roles, typography roles and layout rhythm.
- Create new content architecture and new copy.
- Use component specs for geometry, states, spacing and hierarchy.
- Preserve the observed density and visual atmosphere while changing composition.
- Cross-check computed CSS tokens before trusting screenshot-only inferences.
- Obey every rule in forbidden_ai_tells — buttons must never be pill-shaped with a glow/pulse halo.
- Write all copy with the humanizer skill (npx skills add https://github.com/blader/humanizer --skill humanizer).

**Beklenen sonuç:** A distinct design that feels related in quality, polish and system discipline, but is not a clone.


## Section Akışı

Aşağıdaki sıralama sayfaların **DOM yapısından ölçüldü**: her bölümün konumu, yüksekliği, layout tipi ve içerdiği bileşen tipleri gerçek elemanlardan geliyor.

| # | Section Tipi | Layout | Yoğunluk | Pozisyon (y) | Yükseklik | Başlık | CTA | Kart | Güven | Kaynak |
|---|---|---|---|---:|---:|---:|---:|---:|---:|---|
| 1 | `generic-block` | `stacked` | `spacious` | 116px | 1176px | 0 | 0 | 0 | 54% | dom |
| 2 | `generic-block` | `flex-column` | `spacious` | 1766px | 180px | 1 | 0 | 1 | 64% | dom |
| 3 | `generic-block` | `stacked` | `spacious` | 2027px | 275px | 1 | 0 | 1 | 64% | dom |
| 4 | `generic-block` | `stacked` | `spacious` | 3438px | 275px | 1 | 0 | 1 | 64% | dom |
| 5 | `generic-block` | `stacked` | `spacious` | 4369px | 275px | 1 | 0 | 1 | 64% | dom |
| 6 | `card-grid` | `flex-row` | `spacious` | 4717px | 581px | 0 | 0 | 4 | 74% | dom |
| 7 | `generic-block` | `stacked` | `spacious` | 5780px | 275px | 1 | 0 | 1 | 64% | dom |
| 8 | `generic-block` | `stacked` | `spacious` | 6711px | 247px | 1 | 0 | 1 | 64% | dom |
| 9 | `generic-block` | `flex-column` | `spacious` | 8375px | 180px | 1 | 0 | 1 | 60% | dom |
| 10 | `generic-block` | `stacked` | `spacious` | 9338px | 704px | 0 | 0 | 2 | 66% | dom |
| 11 | `generic-block` | `flex-column` | `spacious` | 9472px | 538px | 1 | 0 | 1 | 64% | dom |
| 12 | `generic-block` | `stacked` | `spacious` | 9578px | 1887px | 0 | 0 | 0 | 54% | dom |
| 13 | `content` | `flex-column` | `spacious` | 10441px | 200px | 1 | 1 | 1 | 68% | dom |
| 14 | `generic-block` | `flex-column` | `spacious` | 11249px | 212px | 1 | 1 | 1 | 86% | dom |
| 15 | `content` | `flex-column` | `spacious` | 11824px | 348px | 1 | 1 | 1 | 68% | dom |
| 16 | `generic-block` | `flex-column` | `spacious` | 13862px | 180px | 1 | 0 | 1 | 60% | dom |
| 17 | `content` | `flex-column` | `spacious` | 14623px | 192px | 1 | 1 | 1 | 72% | dom |
| 18 | `content` | `flex-column` | `spacious` | 15688px | 192px | 1 | 1 | 1 | 72% | dom |
| 19 | `card-grid` | `grid-multi` | `spacious` | 15960px | 312px | 4 | 4 | 4 | 92% | dom |
| 20 | `generic-block` | `flex-column` | `spacious` | 16595px | 416px | 1 | 2 | 1 | 72% | dom |
| 21 | `footer` | `grid-multi` | `spacious` | 17012px | 548px | 6 | 8 | 1 | 72% | dom |
| 22 | `footer` | `grid-or-repeated` | `spacious` | 17092px | 420px | 6 | 8 | 6 | 88% | dom |
| 23 | `navbar` | `flex-column` | `spacious` | 234px | 572px | 2 | 2 | 1 | 82% | dom |
| 24 | `navbar` | `grid-multi` | `spacious` | 1222px | 352px | 1 | 0 | 1 | 64% | dom |
| 25 | `gallery` | `flex-column` | `spacious` | 1638px | 284px | 0 | 0 | 2 | 72% | dom |
| 26 | `navbar` | `grid-multi` | `spacious` | 2147px | 348px | 1 | 0 | 1 | 64% | dom |
| 27 | `card-grid` | `grid-multi` | `spacious` | 2495px | 256px | 5 | 0 | 5 | 84% | dom |
| 28 | `content` | `stacked` | `spacious` | 3621px | 540px | 4 | 0 | 1 | 60% | dom |
| 29 | `navbar` | `grid-multi` | `spacious` | 7215px | 312px | 1 | 0 | 1 | 64% | dom |
| 30 | `card-grid` | `grid-multi` | `spacious` | 7527px | 477px | 3 | 0 | 3 | 90% | dom |
| 31 | `navbar` | `grid-multi` | `spacious` | 8165px | 312px | 1 | 0 | 1 | 64% | dom |
| 32 | `generic-block` | `flex-column` | `spacious` | 8802px | 398px | 1 | 2 | 1 | 68% | dom |
| 33 | `footer` | `grid-multi` | `spacious` | 9234px | 548px | 6 | 8 | 1 | 72% | dom |
| 34 | `footer` | `grid-or-repeated` | `spacious` | 9314px | 420px | 6 | 8 | 6 | 88% | dom |
| 35 | `generic-block` | `flex-column` | `spacious` | 229px | 200px | 1 | 0 | 1 | 64% | dom |
| 36 | `content` | `grid-multi` | `spacious` | 494px | 4794px | 5 | 8 | 1 | 80% | dom |
| 37 | `card-grid` | `grid-or-repeated` | `spacious` | 590px | 4538px | 4 | 4 | 22 | 94% | dom |
| 38 | `content` | `grid-multi` | `spacious` | 5449px | 392px | 1 | 1 | 1 | 80% | dom |
| 39 | `footer` | `grid-multi` | `spacious` | 5941px | 548px | 6 | 8 | 1 | 72% | dom |
| 40 | `footer` | `grid-or-repeated` | `spacious` | 6021px | 420px | 6 | 8 | 6 | 88% | dom |
| 41 | `navbar` | `flex-column` | `spacious` | 116px | 492px | 2 | 0 | 1 | 78% | dom |
| 42 | `content` | `flex-column` | `spacious` | 924px | 460px | 1 | 0 | 1 | 74% | dom |
| 43 | `content` | `flex-column` | `spacious` | 1385px | 460px | 1 | 0 | 1 | 74% | dom |
| 44 | `content` | `flex-column` | `spacious` | 1846px | 460px | 1 | 0 | 1 | 74% | dom |
| 45 | `content` | `flex-column` | `spacious` | 2307px | 460px | 1 | 0 | 1 | 74% | dom |
| 46 | `content` | `flex-column` | `spacious` | 2768px | 460px | 1 | 0 | 1 | 74% | dom |
| 47 | `generic-block` | `flex-column` | `spacious` | 4136px | 150px | 1 | 2 | 1 | 72% | dom |
| 48 | `footer` | `grid-multi` | `spacious` | 4447px | 548px | 6 | 8 | 1 | 72% | dom |
| 49 | `footer` | `grid-or-repeated` | `spacious` | 4527px | 420px | 6 | 8 | 6 | 88% | dom |
| 50 | `generic-block` | `flex-column` | `spacious` | 116px | 244px | 1 | 0 | 1 | 64% | dom |
| 51 | `content` | `stacked` | `spacious` | 1332px | 5510px | 12 | 8 | 1 | 72% | dom |
| 52 | `content` | `grid-multi` | `spacious` | 6842px | 1344px | 13 | 8 | 1 | 72% | dom |
| 53 | `content` | `stacked` | `spacious` | 7018px | 1016px | 13 | 8 | 1 | 68% | dom |
| 54 | `card-grid` | `grid-or-repeated` | `spacious` | 7086px | 948px | 12 | 8 | 12 | 88% | dom |
| 55 | `footer` | `grid-multi` | `spacious` | 8187px | 548px | 6 | 8 | 1 | 72% | dom |
| 56 | `footer` | `grid-or-repeated` | `spacious` | 8267px | 420px | 6 | 8 | 6 | 88% | dom |
| 57 | `navbar` | `flex-column` | `spacious` | 116px | 308px | 1 | 0 | 1 | 60% | dom |
| 58 | `navbar` | `grid-multi` | `spacious` | 1100px | 276px | 1 | 0 | 1 | 64% | dom |
| 59 | `generic-block` | `stacked` | `spacious` | 1466px | 576px | 1 | 0 | 1 | 60% | dom |
| 60 | `navbar` | `grid-multi` | `spacious` | 3383px | 312px | 1 | 0 | 1 | 64% | dom |
| 61 | `gallery` | `flex-column` | `spacious` | 4404px | 538px | 1 | 0 | 1 | 80% | dom |
| 62 | `generic-block` | `flex-column` | `spacious` | 5264px | 156px | 1 | 0 | 2 | 72% | dom |
| 63 | `gallery` | `flex-column` | `spacious` | 5564px | 284px | 0 | 0 | 2 | 72% | dom |
| 64 | `generic-block` | `flex-column` | `spacious` | 6736px | 398px | 1 | 2 | 1 | 68% | dom |
| 65 | `footer` | `grid-multi` | `spacious` | 7168px | 548px | 6 | 8 | 1 | 72% | dom |
| 66 | `footer` | `grid-or-repeated` | `spacious` | 7248px | 420px | 6 | 8 | 6 | 88% | dom |
| 67 | `hero` | `grid-multi` | `spacious` | 116px | 746px | 2 | 2 | 1 | 72% | dom |
| 68 | `navbar` | `flex-column` | `spacious` | 247px | 484px | 2 | 2 | 1 | 82% | dom |
| 69 | `navbar` | `grid-multi` | `spacious` | 1177px | 276px | 1 | 0 | 1 | 64% | dom |
| 70 | `generic-block` | `stacked` | `spacious` | 1454px | 545px | 1 | 0 | 1 | 74% | dom |
| 71 | `generic-block` | `stacked` | `spacious` | 2450px | 545px | 1 | 0 | 1 | 74% | dom |
| 72 | `content` | `stacked` | `spacious` | 3279px | 540px | 4 | 0 | 1 | 60% | dom |
| 73 | `navbar` | `grid-multi` | `spacious` | 5858px | 348px | 1 | 0 | 1 | 64% | dom |
| 74 | `card-grid` | `grid-multi` | `spacious` | 6206px | 477px | 3 | 0 | 3 | 90% | dom |
| 75 | `navbar` | `grid-multi` | `spacious` | 6844px | 312px | 1 | 0 | 1 | 64% | dom |
| 76 | `navbar` | `grid-multi` | `spacious` | 7449px | 326px | 1 | 0 | 1 | 64% | dom |
| 77 | `card-grid` | `grid-multi` | `spacious` | 7775px | 243px | 8 | 8 | 8 | 92% | dom |
| 78 | `generic-block` | `flex-column` | `spacious` | 8171px | 398px | 1 | 2 | 1 | 68% | dom |
| 79 | `footer` | `grid-multi` | `spacious` | 8603px | 548px | 6 | 8 | 1 | 72% | dom |
| 80 | `footer` | `grid-or-repeated` | `spacious` | 8683px | 420px | 6 | 8 | 6 | 88% | dom |
| 81 | `navbar` | `flex-column` | `spacious` | 116px | 364px | 2 | 2 | 1 | 86% | dom |
| 82 | `navbar` | `grid-multi` | `spacious` | 1627px | 348px | 1 | 0 | 1 | 64% | dom |
| 83 | `generic-block` | `stacked` | `spacious` | 1976px | 523px | 1 | 0 | 1 | 74% | dom |
| 84 | `generic-block` | `stacked` | `spacious` | 2950px | 523px | 1 | 0 | 1 | 74% | dom |
| 85 | `navbar` | `grid-multi` | `spacious` | 3634px | 348px | 1 | 0 | 1 | 64% | dom |
| 86 | `navbar` | `grid-multi` | `spacious` | 4275px | 384px | 1 | 0 | 1 | 64% | dom |
| 87 | `card-grid` | `grid-multi` | `spacious` | 4659px | 499px | 3 | 0 | 3 | 90% | dom |
| 88 | `content` | `stacked` | `spacious` | 5441px | 540px | 4 | 0 | 1 | 60% | dom |
| 89 | `navbar` | `grid-multi` | `spacious` | 8020px | 348px | 1 | 0 | 1 | 64% | dom |
| 90 | `content` | `flex-row` | `spacious` | 8440px | 502px | 1 | 0 | 2 | 76% | dom |
| 91 | `navbar` | `grid-multi` | `spacious` | 9103px | 326px | 1 | 0 | 1 | 64% | dom |
| 92 | `card-grid` | `grid-multi` | `spacious` | 9429px | 243px | 8 | 8 | 8 | 92% | dom |
| 93 | `generic-block` | `flex-column` | `spacious` | 9825px | 398px | 1 | 2 | 1 | 68% | dom |
| 94 | `footer` | `grid-multi` | `spacious` | 10257px | 548px | 6 | 8 | 1 | 72% | dom |
| 95 | `footer` | `grid-or-repeated` | `spacious` | 10337px | 420px | 6 | 8 | 6 | 88% | dom |

## Sayfa Envanteri

| # | Sayfa tipi | Screenshot | CSS Örnek |
|---|---|---|---|
| 1 | `home` | `001_https___attio_com_.png` | 900 visible element |
| 2 | `inner-page` | `002_https___attio_com_platform_workflows.png` | 900 visible element |
| 3 | `content-index` | `003_https___attio_com_engineering_blog_introducing_universal_context.png` | 900 visible element |
| 4 | `inner-page` | `004_https___attio_com_customers.png` | 900 visible element |
| 5 | `pricing/catalog` | `005_https___attio_com_pricing.png` | 900 visible element |
| 6 | `inner-page` | `006_https___attio_com_platform_ask.png` | 900 visible element |
| 7 | `inner-page` | `007_https___attio_com_platform_ai.png` | 671 visible element |
| 8 | `inner-page` | `008_https___attio_com_platform_data.png` | 891 visible element |

## Özgün Tasarım Üretim Direktifi

- Önce `design_tokens` içindeki renk, font ve radius değerlerini temel token seti olarak kullan.
- Vision bölümündeki renk/font tahminlerini, yukarıdaki computed CSS token'larıyla çelişiyorsa düşük güvenli kabul et.
- Component üretirken sadece boyut, radius, renk, border, shadow, spacing ve hiyerarşi sinyallerini takip et; kaynak sitedeki metinleri veya CTA ifadelerini kullanma.
- Header, hero, card, form, footer gibi blokları aynı tasarım ilkeleriyle ama farklı içerik mimarisiyle tasarla.
- Hedef çıktı özgün olmalı: "aynı site" değil, aynı kalite/dil/ritim hissinden esinlenen yeni bir tasarım.
- Teknoloji kararlarında sadece `confidence >= 0.85` olan tespitleri güçlü kanıt say; daha düşük değerleri olası sinyal olarak değerlendir.
- Keşfedilen aday sayfa sayısı sitemap ve aynı-domain iç linklerden çıkarılır; gerçek kapalı/linksiz sayfa toplamı gibi yorumlama.
- ZIP içindeki `analysis.json`, `design-tokens.json`, `tech-stack.json` ve `pages.json` dosyaları makine-okunur ana kaynaklardır.

## İzole Component Örnekleri (DOM Tespiti)

Bu bölüm sayfada tekrar eden component pattern'lerini ve onların stillerini gösterir. Her component gerçek DOM elementlerinden izole edilmiştir.

| Tip | Class | Tekrar | Tag | Border Radius | Padding | Font | Background |
|---|---|---:|---|---|---|---|---|
| `nav-item` | `-mx-1` | 39x | `A` | `8px` | `4px 4px 4px 4px` | `14px` | `rgba(0, 0, 0, 0)` |
| `card` | `container` | 19x | `DIV` | `0px` | `0px 24px 0px 24px` | `16px` | `rgba(0, 0, 0, 0)` |
| `button` | `text-[15px]` | 9x | `BUTTON` | `10px` | `4px 20px 4px 0px` | `15px` | `rgba(0, 0, 0, 0)` |
| `nav-item` | `max-lg:h-11.5` | 6x | `A` | `10px` | `0px 12px 0px 12px` | `14px` | `lab(99.9987 0.0337958 0.000309944)` |
| `button` | `button-ghost` | 4x | `BUTTON` | `10px` | `0px 8px 0px 12px` | `15px` | `rgba(0, 0, 0, 0)` |
| `card` | `top-(--site-header-height)` | 4x | `DIV` | `0px` | `0px 0px 0px 0px` | `16px` | `rgba(0, 0, 0, 0)` |
| `nav-item` | `group` | 42x | `A` | `8px` | `4px 4px 4px 4px` | `14px` | `rgba(0, 0, 0, 0)` |
| `card` | `attio-group-hover-underline` | 38x | `SPAN` | `0px` | `0px 0px 0px 0px` | `14px` | `rgba(0, 0, 0, 0)` |
| `nav-item` | `rounded-xl` | 36x | `A` | `12px` | `0px 0px 0px 0px` | `16px` | `lab(94.3726 -0.157326 -2.23036)` |
| `button` | `-translate-y-1/2` | 21x | `BUTTON` | `0px` | `0px 0px 0px 0px` | `16px` | `lab(50.3787 -1.31875 -9.56043)` |
| `card` | `container` | 18x | `DIV` | `0px` | `0px 24px 0px 24px` | `16px` | `rgba(0, 0, 0, 0)` |
| `button` | `right-0` | 13x | `BUTTON` | `8px` | `1px 5px 1px 5px` | `16px` | `lab(96.1596 -0.0828803 -1.13571)` |
| `feature-card` | `pb-[7px]` | 6x | `NAV` | `0px` | `0px 0px 7px 0px` | `16px` | `rgba(0, 0, 0, 0)` |
| `card` | `-z-1` | 5x | `DIV` | `0px` | `0px 0px 0px 0px` | `16px` | `rgba(0, 0, 0, 0)` |
| `button` | `button-outline` | 5x | `BUTTON` | `10px` | `0px 12px 0px 12px` | `14px` | `lab(99.9987 0.0337958 0.000309944)` |

## Vision ↔ Computed CSS Uzlaştırması

**Genel uyum:** güçlü-uyum (%94)

| Boyut | Uyum | Kontrol edilen |
|---|---:|---:|
| Renk | %88 | 72 |
| Tipografi | %100 | 42 |

Çelişkilerde **computed CSS esastır** — vision ekran görüntüsünden tahmin eder, computed CSS ölçer.

- **color** `#fff3cc` — Vision bu rengi computed CSS ile eşleşiyor saydı; ölçülen palette karşılığı yok. Computed CSS esastır.
- **color** `#a0a0a8` — Vision bu rengi computed CSS ile eşleşiyor saydı; ölçülen palette karşılığı yok. Computed CSS esastır.
- **color** `#9fa1a7` — Vision bu rengi computed CSS ile eşleşiyor saydı; ölçülen palette karşılığı yok. Computed CSS esastır.
- **color** `#183c81` — Vision bu rengi computed CSS ile eşleşiyor saydı; ölçülen palette karşılığı yok. Computed CSS esastır.

## Sayfa Sayfa Görsel Analiz

### Görsel analiz — `product (URL tahmini: home)`

**Screenshot:** `001_https___attio_com_.png` · **Güven:** 0.9 · **Doğrulama:** 10/10 renk computed CSS ile doğrulandı

- **Görsel ton:** clean SaaS marketing, light/dark sectional rhythm, data-oriented product showcase, editorial spacing with airy whitespace, subtle accent color economy
- **Yapı:** single-column marketing page with alternating content blocks; hero + features + dark logo band + light stat band + CTA + footer
- **Yoğunluk:** balanced · **Grid:** 12-col inferred; max-width content centered around ~1200px; cards arranged in flex-row grids of 3-6
- **Gözlenen componentler:** primary CTA, feature block, product screenshot mock, customer logo grid, stat tile, pricing/tier card, navigation bar, eyebrow label

## Color System
Bu sayfa, tek bir doygun vurgu rengi (doygun yeşil) üzerine kurulu, son derece disiplinli bir renk ekonomisine sahip. Ana token seti dört katmandan oluşuyor: (1) sayfa zemini için kırık beyaz (#fbfbfb), (2) metin için iki koyu nötr (#242629 başlık, #505155 ikincil), (3) vurgu olarak bir ana yeşil (#007d53), (4) bölüm zemini olarak aynı yeşilin çok soluk tonu (#e0fced). İkincil olarak mavi (#266df0) ve sıcak turuncu-koral (#d97757) çok kontrollü kullanılmış; bunlar birincil CTA'ya alternatif veya mikro-vurgu rolünde. Sınırlayıcı renk #d1d3d6 gri ile 1px'lik saçak çizgiler. **Prensip:** her sayfada tek bir ilgili bölüm vurgu rengi seç, onun %10-15 opaklıktaki tonunu bölüm zemini olarak kullan, geri kalan her şeyi nötr tut.

## Typography
Tipografi sistemi üç katmanlı: geometrik sans (Inter ailesi) gövde ve başlıklar için, Inter Display varyantı daha büyük başlıklarda, JetBrains Mono yalnızca mikro-etiket ve başlık öncesi (eyebrow) ilgili bölüm metinlerinde. Ağırlık skalası regular → medium → semibold; gerçek bold ağırlık başlıklarda bile az kullanılmış, bu da tasarıma ilgili bölüm bir karakter veriyor. Boyut skalası küçük: 9-11px mono etiketler, 13-14px nav/button, 16px gövde, 18-32px başlıklar, hero ~48-64px. Letter-spacing mikro-etiketlerde hafif artırılmış. **Prensip:** mono fontu sadece dekoratif değil anlamsal bir işaretçi olarak kullan (kategori, durum, versiyon); gövdede asla mono karıştırma.

## Layout & Spacing
Sayfa tek-sütun dikey akışla kurgulanmış; her bölüm ~275-1176px arası değişen yüksekliklerle birbirini izliyor. İçeride 12-col implied grid, içerik ~1200px maksimum genişlikte ortalanmış. Dikey spacing birimi 8px; bölümler arası ~80-120px nefes alanı, kart içi 24px padding. Bölümler arası ritim **UZUN → KISA → UZUN → KISA** şeklinde tekrarlanıyor: büyük özellik bloğu, ardından kompakt metrik/CTA şeridi. Yoğunluk ilgili bölüm — ne sıkışık ne de boş; her blok kendi içinde hava alıyor. **Prensip:** sayfa ritmini blok yüksekliklerinin kontrastıyla kur; aynı boyutta 5 blok yan yana koymak yerine 3 büyük + 2 kompakt ile pacing yarat.

## Components

### Primary CTA (Pill Button)
Dolgun yeşil zemin, beyaz yazı, border-radius ~9999px (tam yuvarlatılmış hap formu), 1px border yok, yumuşak hover shadow. Internal padding yatayda ~18-24px, dikeyde ~10-12px. İkincil versiyon ghost (metin + ok ikonu). **Davranış:** Bu hap formu sadece CTA'lara ayrılmış; kart veya input'larda asla kullanılmıyor.

### Feature Block (2-col interior)
İki sütunlu iç yerleşim: bir tarafta soluk yeşil panel üzerinde başlık + bullet'lar, diğer tarafta mock ürün ekran görüntüsü. Köşeler ~8-9px yuvarlatılmış, ince 1px border, çoklu katmanlı (2-3 stacked) drop shadow. Bölümler arası **aynalama**: bir bloğa görsel solda, bir sonrakinde sağda — Z-zigzag okuma deseni.

### Product Screenshot Card
Tarayıcı chrome'u çerçeveli UI mock, ~6-8px radius, multi-layer soft shadow. İçinde tablo / kanban / pipeline varyantları. Ana görsel içerik tipi: gerçek fotoğraf yerine her zaman bu UI mock'ları kullanılıyor.

### Customer Logo Wall (Dark Band)
Sayfa ortasında bir kez kontrast kırma: ~250-300px yüksekliğinde neredeyse siyah zemin üzerinde 6 kolonluk logo grid'i. Logolar monokrom beyaz veya grileştirilmiş. **Prensip:** uzun açık bir sayfada tek bir koyu bant yerleştirerek görsel ilgili bölüm yarat.

### Stat Tile
Çok küçük kompakt blok: büyük punto sayısal değer (birincil yeşilde), altında mikro mono caption. Genelde 3-4 tanesi yatay grup olarak yerleştirilmiş.

### Pricing Card
3'lü tier düzeni, 8-9px radius, 1px border. Ortanca tier muhtemelen hafifçe vurgulanmış (zemin veya border kontrastı ile).

### Navigation
Üstte sticky bar, ~64-72px yükseklik, şeffaf veya kırık beyaz zemin, küçük logo sol, orta menü öğeleri, sağda pill CTA.

## Imagery
Görsel strateji minimalist ve ürün-odaklı: stok fotoğraf veya illüstrasyon neredeyse hiç yok. Her bölümde ana görsel bir ürün UI mock'u. Bu mock'lar tarayıcı çerçevesi içinde, soft shadow ile yerleştirilmiş. **Prensip:** SaaS landing'inde dekoratif görsel kullanmaktan kaçın; ürünün kendisi en ikna edici görsel materyaldir.

## CSS Cross-Reference
Computed CSS ile görsel analiz güçlü şekilde örtüşüyor: (a) renk token'ları görseldeki tonlarla birebir eşleşiyor, (b) font yığını Inter/Inter Display/JetBrains Mono olarak tespit edilmiş — görseldeki geometrik sans + mono etiket duygusuyla tam uyumlu, (c) border-radius dağılımı (sıfır değil + tam yuvarlak + 8-9px) ilgili bölüm sistemini doğruluyor, (d) 9 farklı shadow varyantı UI mock'lara uygulanan çoklu katman derinliğine karşılık geliyor, (e) DOM section layout verisi (flex-row, stacked, h=275/581/1176) sayfadaki büyük/kompakt blok ritmini teyit ediyor. Herhangi bir uyumsuzluk yok; computed CSS referans alınmalı.
```


---

### Görsel analiz — `product (URL tahmini: inner-page)`

**Screenshot:** `002_https___attio_com_platform_workflows.png` · **Güven:** 0.85 · **Doğrulama:** 11/12 renk computed CSS ile doğrulandı

- **Görsel ton:** editorial-clean, airy and spacious, pastel-soft-accent, serif-led editorial, low-saturation palette, subtle elevation, minimal-but-rich
- **Yapı:** long single-column page with stacked editorial sections; alternates between hero / trust row / illustrated dialog / multi-card grid / dark band / form / dark band / multi-column grid / final CTA / footer
- **Yoğunluk:** spacious · **Grid:** 12-column implied; card grids appear 2-up and 3-up; section max-width centered
- **Gözlenen componentler:** primary-nav, primary-cta, secondary-link-cta, trust-logo-strip, feature-card-grid, conversation-mock, quote-block, dark-band-hero

**Genel Karakter**
Sayfa, editoryal bir SaaS ürün sayfası: tek sütun dikey akış, çok bölümlü, ritmik olarak açık ve koyu yüzeylerin dönüşümüyle ilerliyor. Görsel ton ilgili bölüm — düşük doygunluk, açık yüzeyler, ince ayrıntı.

**Renk Sistemi**
Ana zemin beyaz; metinler kademeli olarak neredeyse-siyah (#242629 → #000000), ikincil kopya orta-gri (#505155). Marka vurgusu soğuk bir teal/petrol (#056c87) ve sıcak bir yeşil (#0b935d) üzerinden geliyor. En belirgin token sistemi beş pastel kategori yüzeyi: mint, lavanta, gök mavisi, tereyağı, şeftali — bunlar ikon kutuları, rozetler ve mock UI baloncuklarında tekrar ediyor. Bir tane koyu (near-black) bant var; burası ritmi kırmak ve görsel ağırlık merkezi oluşturmak için kullanılmış.

**Tipografi**
İki aileli, net bir hiyerarşi: editorial bir serif başlıklarda (büyük, sade, geçiş dönemi hissi — Tiempos ailesi), insanist bir sans gövde/UI'da (Inter). Başlıklar çok büyük (~32–40px), gövde 15–16px, navigasyon ve etiketler 12–14px. Kalınlıklar medium'da kalıyor; çok kalın veya çok ince kullanılmamış. Göz hizası yumuşak, satır aralığı geniş.

**Layout & Grid**
Sayfa 12 sütunlu bir çerçevede dönüyor; bölümler max-width ve ortalanmış. Kart gridleri 2 ve 3 kolon olarak bölümlere göre değişiyor. Dikey ritim çok ferah — bölümler arası 80–120px gibi geniş boşluklar. İç mekânda 8/12/16/24 adımı baskın.

**Bileşenler**
- **Nav**: ince, ortada linkler, sağda ghost link + koyu dolgulu CTA.
- **CTA'lar**: koyu dolgulu yuvarlak pill (primary) ve altı çizili teal accent link (secondary). İkisi bir sistem gibi yan yana kullanılmış.
- **Kartlar**: pastel yüzeyli ikon tile + kısa başlık + kısa açıklama; ince 1px kenar veya çok hafif gölge.
- **Sohbet mock'u**: alternatif baloncuklar, dairesel avatarlar, zaman damgası mikro etiketleri.
- **Koyu bant**: tam genişlik, ters tipografi, tek başlık + marka imzası.
- **Form**: tek satır e-posta input + koyu buton, düşük görsel ağırlık.
- **Footer**: geniş çok kolonlu link dizini + marka + mikro yasal satır.

**Elevation & Köşeler**
Köşeler 10–12px — yumuşak ama pill değil. Avatarlar tam daire. Gölgeler sadece interaktif/elevasyon gerektiren kartlarda ve çok hafif; dekoratif tile'larda kullanılmıyor. Kenar çizgileri 1px ince, çoğu zaman yok; yer yer pastel yüzey renginin kendisi ayrımı sağlıyor.

**Density**
ilgili bölüm tarafta: her bölüm az öğeyle anlatıyor, kartlar sıkıştırılmamış, hava boşluğu bol. Bu, ürünün karmaşık işlevlerini sade bir dille sunma stratejisi.

**Görseller**
Fotoğraf yok; her şey flat illüstrasyon, mock UI, ikonografi. Pastel token sistemi illüstrasyona da uygulanmış — marka tutarlılığı güçlü.

**Tasarım Sistemi Notları (Prensip Olarak)**
1. Çift font ailesi: serif = duygu, sans = işlev.
2. 5–6 pastel kategori token'ı: ikon tile, rozet, mock UI baloncuğu.
3. Tipografik gri tonlaması sıkı; renk sadece link/CTA'da.
4. Açık/koyu bant dönüşümüyle ritim — divider yerine zıtlık.
5. Primary CTA koyu pill, secondary ghost veya renkli altı çizili.
6. Logo şeritleri monokrom, düşük kontrast — doku olarak okunmalı.
7. Gölge sadece yükseltilmiş interaktif kartlarda.
8. Form kompakt ve inline; ağır container yok.
9. 8/16/24 spacing adımı tutarlı.
10. Köşe radius'u ~12 — kurumsal-yumuşak dengesi.


---

### Görsel analiz — `content (URL tahmini: content-index)`

**Screenshot:** `003_https___attio_com_engineering_blog_introducing_universal_context.png` · **Güven:** 0.95 · **Doğrulama:** 7/8 renk computed CSS ile doğrulandı

- **Görsel ton:** dark editorial, minimal technical, high-contrast, document-like long-scroll, developer-focused, monochromatic with cool accent
- **Yapı:** single-column long-scroll article with persistent top navigation and multi-column footer
- **Yoğunluk:** spacious · **Grid:** centered single content column (approx 680-760px) flanked by generous gutters; footer uses 4-5 column grid
- **Gözlenen componentler:** top-nav, article-header, long-body, media-embed, section-heading, cta-banner, footer

**Sayfa Kimliği:** Uzun-scroll editorial içerik sayfası (engineering blog). Tek sütun okuma deneyimi, persistent top nav, çoklu kolon altlık.

**Renk Sistemi**
Sayfa, neredeyse siyah düz bir arka plan üzerinde beyaz ana metin ve gri tonlarında ikincil metin kullanıyor. Tek bir soğuk mavi aksan (link/CTA) var ve başlık dışında renk kullanımı son derece kısıtlı. Birincil CTA, header'da yüksek kontrastlı beyaz bir pill olarak öne çıkıyor — sayfadaki tek ilgili bölüm bileşen olarak işlev görüyor. Yüzey ayrımı, gölge yerine çok hafif ton kaymalarıyla sağlanıyor.

**Tipografi**
İki aile var: biri başlıklar için daha ağır/keskin bir display kesimi, diğeri gövde ve UI için nötr bir insanist-geometrik sans. Tipografi sadece iki ağırlıkla (regular + semibold/bold) hiyerarşi kuruyor; bu da sayfaya ilgili bölüm karakteri veriyor. Skala küçükten büyüğe meta → gövde → bölüm başlığı → display şeklinde akıyor; devasa bir H1 ile neredeyse hiyerarşinin tepesinde tek bir vuruş noktası var.

**Layout & Grid**
İçerik tek bir dar orta sütunda (~700px) hizalanmış; yanlarda geniş hava boşlukları bırakılmış. Bu ilgili bölüm hissi, modern SaaS sayfalarının tipik hero-grid mantığından bilinçli bir sapma. Bölümler arasında dikey ritim 40–80px aralığında, 8px tabanlı bir spacing ölçeği üzerinde çalışıyor. Footer çok kolonlu bir grid ile yoğunluğu artırıyor — yukarıdaki sakinliği bilinçli olarak kapatıyor.

**Bileşenler**
- **Top nav:** Logo + ortalanmış linkler + sağda primary pill; altında 1px ince bölücü.
- **Article header:** Devasa display başlık, küçük avatar + meta satırı, kategori eyebrow etiketi. Çok nefes alan.
- **Long body:** Tek sütun, tutarlı satır yüksekliği, paragraf arası ferah boşluk, ara sıra inline accent linkler ve küçük caption etiketleri.
- **Media embed:** Sözde ilgili bölüm hissi için inline, ince border, küçük radius, altında caption şeridi.
- **Section heading:** H2 ağırlığıyla net chunking; öncesi-sonrası sıkı spacing.
- **CTA banner:** Footer üstünde başkaca yüzeyden hafifçe ayrılan, daha ağır metinli eylem paneli.
- **Footer:** Marka bloğu + çoklu muted link kolonları + ince üst bölücü.

**Görsel & İmaj Kullanımı**
Fotoğraf yerine tek bir düşük-fideli monokrom piksel/ASCII tarzı illüstrasyon kullanılmış; bu da ilgili bölüm tonunu güçlendiriyor. Hiç hero görsel yok — sayfa metin ağırlıklı bir belge gibi davranıyor.

**CSS Cross-Reference**
Computed font aileleri (inter + interDisplay) görsel tahminle tam uyumlu: temiz geometrik sans, başlıklarda daha sert bir display kesimi. 80px marj değeri, gözlemlenen bölümler arası ferah ritmi doğruluyor. Tek box-shadow varyantı, gözlemlenen ilgili bölüm stratejisiyle tutarlı. 1px border kalınlığı, header ve medya bloklarındaki ince ayraçlarla örtüşüyor. Border-radius ölçeği (0/6/8/10) hem keskin chrome hem yumuşak kart hissi için iki kutup sunuyor — sayfa ikincisini tercih ediyor.

**İlham Notları (soyut prensipler)**
1. Karanlık editorial kanvas + tek soğuk aksan; kontrastı korumak için metni tam beyaz tut.
2. Başlıklar için ayrı bir display ağırlığı, gövde için nötr regular — sadece iki ağırlıkla çok net hiyerarşi kur.
3. Uzun içeriği ~700px'lik tek sütuna sıkıştır, yanları boş bırak; ilgili bölüm hissi.
4. 8px tabanlı spacing ama bölüm arası 40-80px atlama — yavaş scroll ritmi.
5. Tek ilgili bölüm bileşeni header'daki primary CTA olsun; geri kalan her şey tonal kalsın.
6. Görselleri 6-10px radius ve caption şeridiyle editorial insert gibi yerleştir; marketing kartı gibi değil.
7. Footer yoğun ve sessiz olsun — birçok muted kolon, ince üst bölücü.
8. Yüzey ayrımı için gölge değil, bir kademe daha açık panel tonu kullan.


---

### Görsel analiz — `content (URL tahmini: inner-page)`

**Screenshot:** `004_https___attio_com_customers.png` · **Güven:** 0.95 · **Doğrulama:** 5/5 renk computed CSS ile doğrulandı

- **Görsel ton:** editorial-minimal, high-whitespace, soft-neutral, serif-led, structured-grid
- **Yapı:** single-column vertical stack of full-width sections; centered narrow content column; alternating media/text halves inside each section card
- **Yoğunluk:** spacious · **Grid:** single primary column with internal two-column (50/50) media+text split per section
- **Gözlenen componentler:** top navigation bar, logo grid strip, case study card, pull quote card, logo mosaic, floating action chips, footer, cookie notice

Sayfa, geniş dikey nefes alan, editorial-minimal bir içerik sayfasıdır. Görsel hiyerarşi iki tipografi ailesi arasında net bir iş bölümüyle kurulmuş: birincisi transitional serif (CSS'te tiemposText) tüm başlıkları ve alıntıları taşır, ikincisi geometric sans (inter) gövde, navigasyon ve etiketlerde kullanılır. Bu ikili yapı sayfaya ilgili bölüm tonu verir.

Layout tek bir orta-hizalı geniş kolon üzerinde full-width section kartlarından oluşur; her kart ~450-480px yüksekliğinde olup içeride 50/50 medya–metin yarımıyla çalışır. Bu yerleşim, tekrarlayan bir ilgili bölüm alternasyonuyla ritim yaratır; kart yüksekliklerinin sabit kalması sayesinde sayfa boyunca sabit bir tempo elde edilir. Spacing skalası geniştir: 56–72px iç dolgu, 64px section padding üst seviyesindedir; bu da ilgili bölüm yoğunluk sınıfına girer.

Renk paleti bilinçli olarak kısıtlıdır. Kanvas beyaza yakın bir nötrdür; metin near-black, ayırıcı çizgiler ve kart sınırları #e4e7ec bandında soft-gri olarak işler (computed CSS bunu doğruluyor). Birincil CTA için tek bir koyu dolgu tonu kullanılır, kalan her şey strok veya muted metin olarak kalır — yani ilgili bölüm yaklaşımı. Gölgeler sadece yüzen öğelerde (cookie overlay, FAB) görülür, kartlarda değil; bu da ilgili bölüm kuralını netleştirir.

Bileşen ailesi: top nav (marka sol, linkler orta, iki CTA sağ — biri chip-style filled, biri ghost); logo grid strip (iki satır monochrome wordmark, eşit aralıklı); case-study card (~10-12px radius, 1px border, upper-case kategori etiketi + bold serif hook cümlesi + sans açıklama); pull quote card (line-art portre + serif alıntı + küçük attribution); tapered logo mosaic (kenarlarda opaklık sönümü dekoratif yoğunluk için); paired CTA chips (filled + outline); çok kolonlu koyu footer; fixed chat FAB. Köşe yuvarlaklıkları 7-12px aralığında, yani ne agresif ne de sert. Butonlar küçük punto (13-14px), medium ağırlıkta ve pill değil yumuşak rounded-rect — buton karakteri ilgili bölüm olarak özetlenebilir.

CSS cross-reference: görselde gözlemlenen renkler ve tipografi computed CSS ile büyük ölçüde uyumlu. Tek sapma, computed background'ın #e4e7ec olarak raporlanmasıdır — bu aslında sınırları ve muted yüzeyleri temsil eder, ana kanvas değil; yani palette doğrulaması ilgili bölüm olarak yeniden yorumlanmalıdır.

İlham notları özetle: kısıtlı iki-renk paleti, tek bir serif/sans ikilisi, tekrarlayan uniform-kart dikey stak, alternasyonla ritim, sadece yüzen öğelerde gölge, sonu CTA çifti. Bunlar, siteye özgü görseller veya metinler olmadan, ilgili bölüm bir case-study sayfa şablonu üretmek için soyut prensipler olarak kullanılabilir.


---

### Görsel analiz — `pricing (URL tahmini: pricing/catalog)`

**Screenshot:** `005_https___attio_com_pricing.png` · **Güven:** 0.95 · **Doğrulama:** 6/8 renk computed CSS ile doğrulandı

- **Görsel ton:** minimalist, editorial, data-dense, modern-utility, clean-monochromatic-with-accent
- **Yapı:** vertical-stack: nav → hero → tier-card-row → logo-strip → comparison-table → FAQ → footer
- **Yoğunluk:** — · **Grid:** outer container constrained centered (~1200-1280px); 4-column tier grid; 5-column comparison table; 4-column logo grid; 4-column footer
- **Gözlenen componentler:** top-nav, hero, tier-card, pill-segmented-toggle, logo-strip, comparison-table, primary-button, faq-accordion

### Overall Design Language
This pricing page is built on a **monochromatic, editorial-utility aesthetic**. The dominant surface is off-white with a faint warm cast; the secondary surface is true white. Hierarchy is carried by **type weight and size**, not color. A single **lime/chartreuse accent** is used with extreme restraint — only as a tiny highlight chip adjacent to prices — which makes it feel declarative rather than decorative. The page inverts exactly one tier card to near-black to anchor the visual focal point without breaking the calm palette.

### Color System
- **Surface scale**: pure white (ilgili bölüm) primary, a barely-warm light gray (ilgili bölüm inferred) for soft section breaks, near-black (ilgili bölüm / ilgili bölüm) for inverted emphasis card and primary CTAs.
- **Text scale**: near-black for primary, mid-gray (~`#6B6B6B`) for secondary, very fine 1px lines for borders (~`#E5E5E2`).
- **Accent**: a saturated lime — used only as a 2D highlight tag, never as a fill.
- **Ratio**: roughly 85% neutral surfaces, 10% text, 5% accent + dividers. This is the ilgili bölüm neutral-with-spice palette.

### Typography
Confirmed geometric sans-serif (Inter), no contrast in stroke, no serifs anywhere. Hierarchy is enforced by **steep size jumps**:
- Display: ~40px, weight 700
- Section heading: ~24px, weight 600
- Body: 16px / 14px, weight 400
- Micro-copy: 12px, weight 400

Letter spacing is default-tight; headings feel dense and confident.

### Layout & Spacing
- **Outer container**: centered, ~1200px max width.
- **Vertical rhythm**: 32px+ between sections; the comparison block alone is ~5500px tall, indicating a comfortably spacious page that doesn't feel cramped despite data density.
- **Grid**: 4-column tier row, 5-column feature matrix, 4-column logo strip, 4-column footer.

### Key Components (design tokens)
1. **Pill segmented toggle** — stadium radius (effectively ∞), dual pills, active state filled. Use for any two-state switcher (billing, audience, locale).
2. **Tier card** — 10–20px radius, 16–24px internal padding, oversized price, 12px helper text, single primary CTA. Inverted variant for the recommended tier.
3. **Primary button** — dark fill, white label, ~8px radius, 36–40px tall, 14px text. Ghost variant for secondary actions.
4. **Comparison table** — 1px hairline dividers, alternating row tint, left-aligned category labels at ~12px / 600 weight, check/dash glyphs for boolean cells. Clean, scannable, no zebra-striping aggression.
5. **Logo strip** — monochrome, evenly spaced, mid-page trust band.
6. **FAQ accordion** — question-only rows, bold label, right-aligned caret, hairline divider.
7. **Footer** — dark surface inversion, multi-column link cluster.

### Elevation & Borders
Border is the primary structural device (1px hairlines everywhere). Shadows exist but are **subtle** — used only for floating tier cards or sticky elements, never on table cells. The shadow scale appears to have 4 distinct levels (lift, hover, sheet, modal).

### Imagery
Zero illustrative or photographic content. The brand is communicated entirely through **typography, logos, and color**. This is a deliberate editorial choice that keeps cognitive load low and lets the comparison data breathe.

### Design Principles to Carry Forward
- **Restraint over decoration**: one accent, used sparingly.
- **Hierarchy via type and inversion**, not color flooding.
- **Hairlines + alternating tints** for data tables — never colored backgrounds.
- **Pill controls** for two-state toggles, **soft-rectangle buttons** for actions.
- **Generous vertical rhythm** even when the page is dense.
- **Logo strip as the only mid-page visual band** — no decorative graphics.
- **Dark footer inversion** to close the page with weight contrast.


---

### Görsel analiz — `product (URL tahmini: inner-page)`

**Screenshot:** `006_https___attio_com_platform_ask.png` · **Güven:** 0.92 · **Doğrulama:** 11/12 renk computed CSS ile doğrulandı

- **Görsel ton:** high-contrast editorial, tech-forward, dark/light alternating rhythm, generous whitespace, linear vertical-line motif as section separator, subtle dotted/grid background texture in dark bands
- **Yapı:** single-column stacked sections, each section a full-bleed band; alternating dark/light creates vertical rhythm; content centered inside ~1200-1280px max-width container
- **Yoğunluk:** spacious · **Grid:** 12-column implicit; content cards arranged in 3- or 4-up grids with 24-32px gutters; bottom gallery uses 6-up tag-style grid
- **Gözlenen componentler:** top navigation bar, hero prompt composer, consent/notice banner, tabbed content surface, feature row with status dots, dark feature strip with vertical line motif, hexagonal/grid texture panel, link grid / sitemap footer

explanation
3. NO text/copy from the source
4. Cross-reference with computed CSS data
5. Be abstract about design principles, not clone the layout

Let me analyze the screenshot carefully:

**Page Structure:**
- Top dark navigation bar (looks like black/very dark)
- Hero section with large heading area on light gray/off-white background
- Input/CTA element below the heading
- Cookie consent popup
- Section transition with vertical lines/dots pattern
- Dark section with grid background
- Light section with tabbed content
- Another dark section
- Content sections alternating
- Grid-based content sections
- Testimonial block
- Footer CTA
- Dark footer

**Colors:**
- Background: Light gray/off-white (#f8f9fa confirmed in CSS)
- Text: Dark (#242629, #000000, #505155)
- Accents: Blue (#266df0), Yellow/Orange (#f5a300), Green (#00d17e)
- Dark sections: Near black with subtle grid

**Typography:**
- Inter / InterDisplay family (confirmed)
- Hero size: ~56px
- Body: ~16px
- Small: ~12-14px

**Layout:**
- Centered max-width container
- Generous vertical spacing
- Alternating light/dark sections
- Grid patterns in dark areas

**Components:**
- Dark navigation with logo, menu, CTA buttons
- Search-like input with icon
- Tab navigation (horizontal)
- Card components with shadow
- Grid feature blocks
- CTA buttons (filled dark, filled blue, outlined)

Let me build the JSON now.

The detected colors from CSS:
- #266df0 - blue (likely primary CTA)
- #f5a300 - amber/orange (accent)
- #cdced2 - light gray (border)
- #00d17e - green (success/active)
- #f8f9fa - off-white (background)

Font: Inter, InterDisplay
Sizes: 16, 14, 12, 15, 13, 18, 56, 32

Looking at the image:
- Top nav: black/dark with white text, has logo on left, menu items, ilgili bölüm and ilgili bölüm on right
- Hero: light background with massive heading ilgili bölüm with subtext, then an input field with ilgili bölüm and a blue circular button
- Cookie banner overlay
- A divider/transition area with vertical lines pattern
- Light section: tabs (Recording, Success, Sales, Founders, Gesture Layer), content area showing interaction logs
- Dark section: ilgili bölüm with vertical line decorations, 4 feature blocks
- Light section: ilgili bölüm with chat-like UI
- Below: 3 columns of features with a center radial chart
- Testimonial section
- Final CTA section: dark background with hexagonal pattern on right
- Footer: dark with columns of links

The vertical lines pattern is interesting - appears in transitions between sections.

Let me compose the audit now. I need to be careful not to copy any text content.</think>

```json
{
  ilgili bölüm: ilgili bölüm,
  ilgili bölüm: 0.92,
  ilgili bölüm: [
    ilgili bölüm,
    ilgili bölüm,
    ilgili bölüm,
    ilgili bölüm,
    ilgili bölüm,
    ilgili bölüm
  ],
  ilgili bölüm: [
    { ilgili bölüm: ilgili bölüm, ilgili bölüm: ilgili bölüm, ilgili bölüm: 0.98, ilgili bölüm: ilgili bölüm, ilgili bölüm: true },
    { ilgili bölüm: ilgili bölüm, ilgili bölüm: ilgili bölüm, ilgili bölüm: 0.9, ilgili bölüm: ilgili bölüm, ilgili bölüm: false },
    { ilgili bölüm: ilgili bölüm, ilgili bölüm: ilgili bölüm, ilgili bölüm: 0.9, ilgili bölüm: ilgili bölüm, ilgili bölüm: false },
    { ilgili bölüm: ilgili bölüm, ilgili bölüm: ilgili bölüm, ilgili bölüm: 0.95, ilgili bölüm: ilgili bölüm, ilgili bölüm: true },
    { ilgili bölüm: ilgili bölüm, ilgili bölüm: ilgili bölüm, ilgili bölüm: 0.9, ilgili bölüm: ilgili bölüm, ilgili bölüm: true },
    { ilgili bölüm: ilgili bölüm, ilgili bölüm: ilgili bölüm, ilgili bölüm: 0.85, ilgili bölüm: ilgili bölüm, ilgili bölüm: false },
    { ilgili bölüm: ilgili bölüm, ilgili bölüm: ilgili bölüm, ilgili bölüm: 0.95, ilgili bölüm: ilgili bölüm, ilgili bölüm: false },
    { ilgili bölüm: ilgili bölüm, ilgili bölüm: ilgili bölüm, ilgili bölüm: 0.97, ilgili bölüm: ilgili bölüm, ilgili bölüm: true },
    { ilgili bölüm: ilgili bölüm, ilgili bölüm: ilgili bölüm, ilgili bölüm: 0.95, ilgili bölüm: ilgili bölüm, ilgili bölüm: true },
    { ilgili bölüm: ilgili bölüm, ilgili bölüm: ilgili bölüm, ilgili bölüm: 0.95, ilgili bölüm: ilgili bölüm, ilgili bölüm: true },
    { ilgili bölüm: ilgili bölüm, ilgili bölüm: ilgili bölüm, ilgili bölüm: 0.95, ilgili bölüm: ilgili bölüm, ilgili bölüm: true },
    { ilgili bölüm: ilgili bölüm, ilgili bölüm: ilgili bölüm, ilgili bölüm: 0.85, ilgili bölüm: ilgili bölüm, ilgili bölüm: false }
  ],
  ilgili bölüm: [
    { ilgili bölüm: ilgili bölüm, ilgili bölüm: ilgili bölüm, ilgili bölüm: ilgili bölüm, ilgili bölüm: ilgili bölüm, ilgili bölüm: ilgili bölüm, ilgili bölüm: 0.93 },
    { ilgili bölüm: ilgili bölüm, ilgili bölüm: ilgili bölüm, ilgili bölüm: ilgili bölüm, ilgili bölüm: ilgili bölüm, ilgili bölüm: ilgili bölüm, ilgili bölüm: 0.9 },
    { ilgili bölüm: ilgili bölüm, ilgili bölüm: ilgili bölüm, ilgili bölüm: ilgili bölüm, ilgili bölüm: ilgili bölüm, ilgili bölüm: ilgili bölüm, ilgili bölüm: 0.95 },
    { ilgili bölüm: ilgili bölüm, ilgili bölüm: ilgili bölüm, ilgili bölüm: ilgili bölüm, ilgili bölüm: ilgili bölüm, ilgili bölüm: ilgili bölüm, ilgili bölüm: 0.9 },
    { ilgili bölüm: ilgili bölüm, ilgili bölüm: ilgili bölüm, ilgili bölüm: ilgili bölüm, ilgili bölüm: ilgili bölüm, ilgili bölüm: ilgili bölüm, ilgili bölüm: 0.9 },
    { ilgili bölüm: ilgili bölüm, ilgili bölüm: ilgili bölüm, ilgili bölüm: ilgili bölüm, ilgili bölüm: ilgili bölüm, ilgili bölüm: ilgili bölüm, ilgili bölüm: 0.85 }
  ],
  ilgili bölüm: {
    ilgili bölüm: "single-column stacked sections, each section a full-bleed band; alternating dark/light creates vertical rhythm; content centered inside ~1200-1280px max-width container",
    ilgili bölüm: "12-column implicit; content cards arranged in 3- or 4-up grids with 24-32px gutters; bottom gallery uses 6-up tag-style grid",
    ilgili bölüm: "8px base; vertical section padding ~96-128px desktop; intra-card 16-24px; tight hairline-1px borders",
    ilgili bölüm: ilgili bölüm,
    ilgili bölüm: 0.9
  },
  ilgili bölüm: [
    {
      ilgili bölüm: ilgili bölüm,
      ilgili bölüm: "Dark band, sticky-feel; left: brand mark; center: horizontal menu with dropdown indicator caret; right: outlined ilgili bölüm CTA and filled primary CTA. Bottom edge has a faint divider.",
      ilgili bölüm: ilgili bölüm,
      ilgili bölüm: 0.95
    },
    {
      ilgili bölüm: ilgili bölüm,
      ilgili bölüm: "Centered display heading + short supporting line; below: pill-shaped input with rounded submit action on the right; very tall vertical breathing room above and below.",
      ilgili bölüm: ilgili bölüm,
      ilgili bölüm: 0.9
    },
    {
      ilgili bölüm: ilgili bölüm,
      ilgili bölüm: "Bottom-left floating card with small body copy and two stacked buttons (primary + ghost). Subtle shadow, white surface.",
      ilgili bölüm: ilgili bölüm,
      ilgili bölüm: 0.85
    },
    {
      ilgili bölüm: ilgili bölüm,
      ilgili bölüm: "Horizontal underline tab strip with 4-5 items, active tab uses underline weight; panel below shows a UI preview mock (log list, conversation, decision panel).",
      ilgili bölüm: ilgili bölüm,
      ilgili bölüm: 0.9
    },
    {
      ilgili bölüm: ilgili bölüm,
      ilgili bölüm: "Three-column trio, each card has a colored dot (blue/amber/green), short label, body copy, and a sample chip/badge at bottom.",
      ilgili bölüm: ilgili bölüm,
      ilgili bölüm: 0.85
    },
    {
      ilgili bölüm: ilgili bölüm,
      ilgili bölüm: "Black band; faint vertical hairlines as decorative texture; a centered eyebrow line + heading; below: 4-up icon + headline + body copy cards in a flat grid, no card surface.",
      ilgili bölüm: ilgili bölüm,
      ilgili bölüm: 0.85
    },
    {
      ilgili bölüm: ilgili bölüm,
      ilgili bölüm: "Right side of a dark CTA band carries a low-contrast geometric hex/triangle pattern as background motif.",
      ilgili bölüm: ilgili bölüm,
      ilgili bölüm: 0.8
    },
    {
      ilgili bölüm: ilgili bölüm,
      ilgili bölüm: "Multi-column link list on dark background; column titles are slightly brighter; links are low-contrast; small social glyphs top-left of footer.",
      ilgili bölüm: ilgili bölüm,
      ilgili bölüm: 0.9
    }
  ],
  ilgili bölüm: {
    ilgili bölüm: "no photographic imagery; relies on UI mock screenshots, abstract dot/line decorations, and minimal flat icons (line/glyph style)",
    ilgili bölüm: "UI previews carry the visual load; decorative vertical-line and hex patterns substitute for hero imagery",
    ilgili bölüm: 0.9
  },
  ilgili bölüm: [
    "Computed text colors #242629 / #505155 / #000000 align with observed dark gray scale on light surfaces.",
    "Computed background #f8f9fa matches the dominant off-white canvas; the warmer white inside cards likely #ffffff (not in computed top 5).",
    "Computed accents #266df0 (blue), #f5a300 (amber), #00d17e (green) all appear as small status dots and the primary submit pill - exact match.",
    ilgili bölüm,
    "Font stack ilgili bölüm confirmed; visually consistent with a neutral geometric sans with slight display cuts at hero size.",
    "Border-radius distribution: pill (very large ~9999px), 12px (cards), 6-10px (chips/buttons) - matches observed input, card, and chip shapes.",
    "Box-shadow count (8) consistent with the floating consent banner + elevated UI mock cards; shadows appear soft and short, not heavy."
  ],
  ilgili bölüm: [
    "Use a strict two-tone alternation (off-white canvas / near-black band) to create rhythm without decoration.",
    "Let vertical breathing room do the work: hero block sits inside ~120px of empty space top/bottom; no ornamental gradient.",
    "Communicate interactivity through UI mock screenshots rather than hero illustration.",
    "Carry a thin recurring motif (vertical hairlines or dotted grid) only inside dark bands to suggest ilgili bölüm.",
    "Status communication uses a small colored dot (~8px) in a consistent palette (blue / amber / green) reused across feature rows.",
    "Pill-shaped primary CTA, ~9999px radius, paired with a ghost/outline secondary; same pair repeats in nav and footer.",
    "Typography is single-family; hierarchy is achieved purely by size + weight + color (no alternate display font).",
    ilgili bölüm,
    "Footer is dark and dense, but links use low-contrast gray to recede; brand color reserved for active/CTA only.",
    "Decorative hex/triangle texture reserved for the closing CTA band to imply ilgili bölüm without literal copy."
  ]
}
```

---

## VISUAL_AUDIT_MARKDOWN

**Overall character.** A linear, editorial product page that leans on contrast and spacing rather than illustration. The canvas is a soft off-white (ilgili bölüm) and the page is sliced into alternating bands of off-white and near-black. That alternation is the primary structural device - it tells the eye where one module ends and the next begins without dividers or rules.

**Color logic.** Three roles only: neutral ink (dark gray ilgili bölüm with a muted secondary around ilgili bölüm), neutral paper (off-white + white card surfaces), and a small accent palette (blue ilgili bölüm, amber ilgili bölüm, green ilgili bölüm). Accent colors are not decorative - they always encode meaning: a primary action, a status, a category. Borders are 1px hairlines in a desaturated ilgili bölüm. No gradients, no shadows on the page chrome itself.

**Typography.** Single-family sans (ilgili bölüm / ilgili bölüm). Hierarchy is purely by size and weight. A ~56px display weight opens the page, then sections settle around 32px centered headings, 16-18px body, 14px UI/nav, 12-13px muted meta. Tracking is default; no all-caps display. Letter-spacing is never manipulated as a stylistic device.

**Spacing & rhythm.** A loose 8px scale, but at the section level the page behaves in ~96-128px vertical chunks. The hero is exceptionally tall - this is intentional, it frames the prompt-composer component as the centerpiece. Card padding is 16-24px; gutters between columns are 24-32px. Overall density reads as spacious.

**Surface treatments.**
- Cards use radius ~12px, 1px hairline border, optional soft shadow only on UI mock previews.
- Inputs use a very large radius (~pill) with a single circular submit button.
- Buttons come in two flavors only: filled dark or filled primary for emphasis, ghost/outline for secondary. Same pair recurs in nav and footer.
- Tabs use underline affordance - no pill background, keeps the surface calm.
- Status communication is a single ~8px colored dot reused across feature rows.

**Texture & decoration.** Almost none. Where it appears, it is restrained:
- A vertical-hairline motif decorates the dark band transitions, suggesting ilgili bölüm without literal copy.
- A faint hex / triangle texture sits only on the right side of the closing CTA band, implying ilgili bölüm.
- No photography. Visual storytelling is carried entirely by UI mock screenshots of the product itself.

**Grid & layout.** Single-column stacked sections, full-bleed. Inside each section content centers within a ~1200-1280px container. Card rows are 3-up or 4-up with even gutters. The bottom gallery breaks into a denser 6-up tag-style grid. Footer is a multi-column link list on dark with low-contrast links to recede.

**Component vocabulary (reusable tokens).**
- *Primary action*: pill, filled accent, 14-15px medium label, ~9999px radius.
- *Secondary action*: same pill, 1px outline, transparent fill, dark or white text depending on surface.
- *Card*: 12px radius, 1px hairline, white or off-white fill, optional soft shadow for elevated mocks.
- *Input*: pill radius, 1px border, leading icon slot, trailing circular submit.
- *Tab*: text label + 2px underline in muted gray (default) and primary/accent (active).
- *Status dot*: 8px solid circle, three allowed colors.
- *Feature tile* (dark bands): no surface, just icon + headline + 2-3 lines, separated by whitespace alone.

**Takeaway for a derivative design.** The system earns its polish from discipline, not ornament: two surfaces, one font, one radius family, three accent dots, and a single recurring linear motif. Reproducing the *feeling* means honoring those constraints more than copying any specific module.


---

### Görsel analiz — `product (URL tahmini: inner-page)`

**Screenshot:** `007_https___attio_com_platform_ai.png` · **Güven:** 0.92 · **Doğrulama:** 6/7 renk computed CSS ile doğrulandı

- **Görsel ton:** minimal, editorial, restrained, premium, high-contrast typographic, neutral palette, spacious
- **Yapı:** single-column long-scroll with sectioned rhythm; alternating feature blocks, logo strip, integration cards, footer CTA
- **Yoğunluk:** spacious · **Grid:** centered max-width container (~1200-1280), 2-up then 3-up card grids, asymmetric feature blocks (text-left/screenshot-right)
- **Gözlenen componentler:** primary CTA button (dark), input/search field, feature card / screenshot card, integration logo grid, toggle / chip, section heading pair, footer

**Sayfa Kimliği & Genel Karakter**
Ürün tanıtım sayfası; uzun-scroll, editöryal bir SaaS landing'i. Ağırlıklı olarak tipografi ve boşluk ile kurulan, görselde fotoğraf yerine ürün UI ekran görüntülerini kullanan, minimalist bir kompozisyon.

**Renk Sistemi**
Tek renkli bir iskelet üzerine kurulu: canvas için çok açık bir gri-beyaz (~#f4f5f6), kart yüzeyleri için saf beyaz, metin için üç kademeli gri (near-black başlık, ~#5c5e63 gövde, ~#9fa1a7 muted), ince bölücüler için soft hairline. Bilinçli olarak düşük satürasyon; sadece küçük etkileşim öğelerinde tek bir soğuk vurgu rengi (tahminen mavi) kullanılıyor. Hesaplanmış CSS renkleri görsel tahminle yüksek oranda örtüşüyor — palette tutarlı.

**Tipografi**
Çift-aile sistemi: insanist bir serif (tiemposText) display başlıklarda; geometrik sans (inter) gövde, UI ve butonlarda. Bu kombinasyon modern-editöryal bir karakter veriyor — başlıklar ilgili bölüm, gövde ilgili bölüm. Tipografik merdiven kompakt: ~13–16px UI, ~18–24px subhead, ~32–40px display. Ağırlık kullanımı tutumlu; medium ve semibold baskın.

**Layout & Grid**
Orta hizalı, tek sütun bir sayfa omurgası; içinde 2'li ve 3'lü kart gridleri ile asimetrik feature blokları (metin bir yanda, ekran görüntüsü diğer yanda) ritmik olarak yerleştirilmiş. Bölümler arasında geniş dikey nefes alanı; hiyerarşi çoğunlukla spacing ile, ikincil olarak boyutla kuruluyor.

**Bileşenler**
- **Primary CTA:** solid near-black dolgulu, orta yumuşaklıkta radius (~12px), beyaz etiket; gradyan veya parlaklık yok.
- **Kart:** beyaz yüzey + 1px hairline + iki katmanlı yumuşak gölge; içeride UI mock'u barındırıyor.
- **Input/Arama:** yumuşak köşeli, ince border, solda ikon, muted placeholder.
- **Logo strip:** düz, gri tonlu, eşit ağırlıkta marka logoları — hiyerarşi kurmadan yanyana.
- **Footer:** koyu zemin üzerinde çok-sütunlu link grid'i.

**Spacing & Shape Dili**
Section ritmi 80–120px, blok arası 24–36px, bileşen içi 12–20px. Radius skalası dar (8–13px), shadow skalası dar (3 tier). Bu dar token vocabulay'ı görselde ilgili bölüm bir kalite hissi yaratıyor.

**Görsellik**
Fotoğraf yok; soyut gradient/şekil motifleri yalnızca son CTA bölümünde beliriyor. Geri kalan her şey tipografi + UI ekran görüntüsü.

**Cross-reference Notu**
Computed CSS ile görsel analiz güçlü biçimde uyumlu: font aileleri, gri tonları ve radius skalası tahminleri doğruluyor. Saf beyaz kart yüzeyi top-5 bg listesinde yer almıyor — bu beklenen, çünkü canvas (#f4f5f6) baskın.

**İlham Çıkarımları (kopyalanmaya değil, ilham verici prensipler)**
1. İki-aile tipografi (serif display + sans gövde) ile editöryal bir karakter kur.
2. Neredeyse monokrom bir palettan başla; vurgu rengini yalnızca etkileşim için sakla.
3. Hiyerarşiyi spacing ile kur — boyut ile değil; section başına ~100px dikey nefes.
4. Kart sistemi: beyaz + hairline + yumuşak iki-katmanlı gölge; asla renkli sınır kullanma.
5. CTA'yı solid near-black olarak sabitle; gradyan veya renkli CTA'dan kaçın.
6. Logo / entegrasyon şeritlerini gri tonlarda ve eşit ağırlıkta tut — içerikle rekabet etmesin.
7. Token vocabulay'ını sıkı tut: 3 radius, 3 shadow, 6–8 tipografi adımı. Tutarlılık, karmaşıklıktan daha güçlü bir lüks sinyali.


---

### Görsel analiz — `product (URL tahmini: inner-page)`

**Screenshot:** `008_https___attio_com_platform_data.png` · **Güven:** 0.92 · **Doğrulama:** 7/10 renk computed CSS ile doğrulandı

- **Görsel ton:** clinical-enterprise, airy and spacious, soft corporate, data-trustworthy, low-saturation palette with selective bright accents
- **Yapı:** single-column vertical narrative with alternating left-right split blocks and centered alignment at hero / quote / CTA bands
- **Yoğunluk:** spacious · **Grid:** wide center-max container ~1200-1280px, 2-column split for feature rows, multi-column grid for product cards and footer
- **Gözlenen componentler:** Top utility bar, Primary navigation, Hero block, Split feature row, Product mockup card, Logo / trust cloud, Quote band, Three-up benefit row

` header
3. Cross-reference visual analysis with computed CSS data
4. Abstract design principles only, no text content reproduction
5. Use confidence levels and inference markers
6. Don't give direct cloning instructions

Let me analyze the screenshot carefully:

**Page Structure:**
- This is a long landing page for a platform
- Top: Navigation with logo, menu items, CTA buttons
- Hero section with large heading
- Multiple feature sections with alternating layouts
- Card grids with product features
- A testimonial quote section
- Sections about CRM/data management
- Bottom: Pricing/CTA section
- Footer with multiple columns

**Colors observed:**
- Background: Mostly white/off-white (#FFFFFF or very light)
- Light blue/lavender accent backgrounds (#e5eeff confirmed by CSS)
- Dark navy blue text (#183c81 confirmed by CSS)
- Black for headings
- Some green accent (logo, some indicators)
- Yellow/orange accents (logos, indicators)
- Purple accents
- Gray text for secondary info
- Border colors: light gray

**Typography:**
- Font family: Inter, Inter Display, Tiempos Text (confirmed by CSS)
- Sans-serif geometric (Inter is a geometric/grotesque sans)
- Large bold headings (32-40px range)
- Body text smaller (14-16px)
- Good hierarchy

**Layout:**
- Wide layout, max-width container
- Vertical rhythm with consistent spacing
- Section padding around 80-120px vertical
- Grid system with cards
- Alternating left/right layouts for feature sections

**Components:**
- Cards with subtle shadows
- Buttons with rounded corners (8-12px radius)
- Navigation bar
- Tab/badge components
- Logo grid
- Avatar lists
- Feature illustrations (showing UI mockups)

**Border radius:**
- 8px, 10px, 12px, 20px observed (confirmed by CSS)

**Shadows:**
- Subtle box shadows (6 variants confirmed)

Now let me build the JSON and markdown analysis.

For the colors:
- Background: white #FFFFFF
- Text primary: dark navy #183c81 (matches CSS)
- Accent blue background: #e5eeff (matches CSS)
- Green accents: approximately #00C853 or similar
- Yellow/orange: approximately #FFB800
- Purple: approximately #8B5CF6
- Gray borders: #E5E7EB

For typography:
- Inter is a humanist/grotesque sans-serif
- Inter Display is the display variant
- Tiempos Text is a serif (interesting choice for some text)
- Weight hierarchy: Bold for headings (700-800), regular (400) for body, medium (500) for nav

Layout:
- Maximum width container, centered
- 12-column grid feeling
- Spacious density with generous whitespace
- Vertical section padding ~80-120px

Components to identify:
- Top navigation
- Hero with primary CTA
- Feature section with image + text (alternating)
- Logo cloud
- Testimonial quote
- Card grid
- Dashboard mockups
- Pricing/CTA banner
- Multi-column footer

Let me write this up now.</think>

```json
{
  ilgili bölüm: ilgili bölüm,
  ilgili bölüm: 0.92,
  ilgili bölüm: [
    ilgili bölüm,
    ilgili bölüm,
    ilgili bölüm,
    ilgili bölüm,
    ilgili bölüm
  ],
  ilgili bölüm: [
    {"hex":"#FFFFFF","role":"background","confidence":0.98,"evidence":"page canvas","css_match":true},
    {"hex":"#183C81","role":"primary text / brand deep","confidence":0.95,"evidence":"headlines, footer text, CTA fill","css_match":true},
    {"hex":"#E5EEFF","role":"surface tint / section wash","confidence":0.95,"evidence":"alternating section backgrounds, nav bar wash","css_match":true},
    {"hex":"#0A1F44","role":"text strongest","confidence":0.7,"evidence":"deepest headings","css_match":false},
    {"hex":"#5B6478","role":"muted body text","confidence":0.8,"evidence":"paragraphs, sub copy","css_match":false},
    {"hex":"#E6EAF0","role":"border / divider","confidence":0.85,"evidence":"card outlines, separators","css_match":false},
    {"hex":"#1EC26B","role":"accent positive / logo pop","confidence":0.75,"evidence":"brand mark dot, status dots","css_match":false},
    {"hex":"#F5B400","role":"accent warning / logo pop","confidence":0.7,"evidence":"logo grid, status dots","css_match":false},
    {"hex":"#7C5CFF","role":"accent secondary","confidence":0.7,"evidence":"logo grid, badge fills","css_match":false},
    {"hex":"#F4F6FA","role":"subtle surface","confidence":0.8,"evidence":"inset card backgrounds","css_match":false}
  ],
  ilgili bölüm: [
    {"role":"display heading","family_inference":"geometric grotesque sans (Inter Display)","css_family":"interDisplay","weight":"700-800","size_relation":"~40px","confidence":0.95},
    {"role":"section heading","family_inference":"geometric grotesque sans (Inter)","css_family":"inter","weight":"700","size_relation":"~32px","confidence":0.95},
    {"role":"body","family_inference":"humanist grotesque sans (Inter)","css_family":"inter","weight":"400","size_relation":"16px","confidence":0.95},
    {"role":"nav / eyebrow","family_inference":"geometric grotesque sans uppercase tracked","css_family":"inter","weight":"500-600","size_relation":"11-12px","confidence":0.85},
    {"role":"button / pill","family_inference":"geometric grotesque sans","css_family":"inter","weight":"600","size_relation":"14px","confidence":0.9},
    {"role":"serif accent","family_inference":"contemporary serif (Tiempos)","css_family":"tiemposText","weight":"400-500","size_relation":"~18-24px","confidence":0.7}
  ],
  ilgili bölüm: {
    ilgili bölüm:"single-column vertical narrative with alternating left-right split blocks and centered alignment at hero / quote / CTA bands",
    ilgili bölüm:"wide center-max container ~1200-1280px, 2-column split for feature rows, multi-column grid for product cards and footer",
    ilgili bölüm:"modular rhythm; section vertical padding large (~80-120px), card padding 20-24px, gap between cards 16-24px, micro-spacing 4-6px",
    ilgili bölüm:"spacious",
    ilgili bölüm:0.9
  },
  ilgili bölüm: [
    {"name":"Top utility bar","description":"thin band above main nav with very small links and a primary CTA pill on the right","states_or_variants":"signed-out / signed-in inferred","confidence":0.85},
    {"name":"Primary navigation","description":"horizontal bar with brand mark left, center menu, dual CTA on right (ghost + solid); subtle bottom border","states_or_variants":"default","confidence":0.95},
    {"name":"Hero block","description":"centered headline + supporting line + dual CTA + trust micro-row (avatar stack + label)","states_or_variants":"default","confidence":0.9},
    {"name":"Split feature row","description":"alternating image-left / image-right pattern with bold heading, body paragraph, optional link affordance, and product mockup illustration","states_or_variants":"image-left, image-right, stacked-center","confidence":0.95},
    {"name":"Product mockup card","description":"rounded card with subtle shadow showing app UI fragments; functions as illustration, not screenshot","states_or_variants":"table mock, kanban mock, pipeline mock, dashboard mock","confidence":0.85},
    {"name":"Logo / trust cloud","description":"row of small monochrome brand marks under a subtle caption","states_or_variants":"default","confidence":0.95},
    {"name":"Quote band","description":"centered pull-quote with attribution line below","states_or_variants":"default","confidence":0.9},
    {"name":"Three-up benefit row","description":"icon + short heading + one-line description tiles in a horizontal trio","states_or_variants":"3-col, sometimes 2-col","confidence":0.85},
    {"name":"Card grid","description":"2-4 column grid of neutral cards with heading + body, optional cta","states_or_variants":"2-col, 3-col","confidence":0.9},
    {"name":"Pricing / CTA banner","description":"dark deep-blue block with bold white heading and a solid white or accent pill button","states_or_variants":"default","confidence":0.9},
    {"name":"Multi-column footer","description":"brand + tagline column, multiple link columns, locale and social row at base","states_or_variants":"default","confidence":0.95},
    {"name":"Avatar stack","description":"small overlapping circular avatars indicating social proof","states_or_variants":"default","confidence":0.85}
  ],
  ilgili bölüm: {
    ilgili bölüm:"flat product mockups and UI fragment illustrations rather than photography; abstract gradient washes as decorative section backgrounds",
    ilgili bölüm:"illustration-led; no human photography; trust signals rely on logos and avatars, not faces",
    ilgili bölüm:0.9
  },
  ilgili bölüm: [
    "Detected font stack (inter, interDisplay, tiemposText) matches the visual: sans-led UI with one serif accent class likely reserved for editorial pull-quote tone.",
    "Border-radius scale (0/8/10/12/20) maps cleanly to what is visible: cards ~12-20px, buttons ~10-12px, badges ~8px.",
    "Box shadows are present but visually subtle — matches ilgili bölüm tone, not heavy elevation.",
    "Padding scale (4/12/24/20) plus larger section vertical rhythm inferred from DOM section heights suggests a 4-8-12-24 modular spacing token.",
    "Top CSS text color #183C81 appears as a primary deep brand hue, but headings look darker; likely two text tokens in use (deep brand + near-black).",
    "Background color #E5EEFF matches the alternating wash sections exactly — confirms a ilgili bölüm design token."
  ],
  ilgili bölüm: [
    "Anchor a single deep brand color as both heading color and primary CTA fill to create tonal cohesion across long-scroll.",
    "Alternate white canvas and a single low-saturation tint (~5-8% blue) to create rhythm without introducing competing hues.",
    "Use illustration-as-mockup (soft-rendered UI fragments inside cards) instead of screenshots for a controlled, on-brand surface.",
    "Reserve a serif family for one signature moment (quote / editorial line) to break a purely sans UI and add editorial weight.",
    "Standardize on two radii tiers: small (8-10) for controls, large (12-20) for surfaces; keeps the system visually calm.",
    "Build with two CTAs per hero: one solid primary, one ghost secondary, in matching geometry for predictable affordance.",
    "Place a thin utility strip above the main nav for trust / locale links without distracting from hero hierarchy.",
    "Use avatar stacks + monochrome logo cloud as the only social-proof artifacts; reinforces enterprise neutrality.",
    "Cap section vertical padding generously (~80-120px) to signal premium and let type breathe; pair with ~24px card padding inside.",
    "Treat product cards as ilgili bölüm: title + one-line promise, no marketing copy, in a uniform grid for scanability."
  ]
}
```

```markdown
# VISUAL_AUDIT_MARKDOWN

## Overall character
The page reads as a long-form enterprise SaaS landing — calm, data-trustworthy, and illustration-led rather than photography-led. The visual rhythm is built on a single alternating pattern: a white canvas, then a soft tinted wash, then white again. This is the strongest structural signal in the layout and should be treated as the backbone of any inspired design.

## Color system
The palette is intentionally narrow. One deep navy acts as both the strongest text color and the primary CTA fill — that dual-role is what gives the page its tonal cohesion. One low-saturation blue (close to a 6-8% tint of the deep navy) is used as an alternating section background; no other large color fields appear. Accents (a fresh green, a warm yellow, a violet) are reserved for tiny moments — brand marks, status dots, badge fills — never for large surfaces. Borders are a near-invisible cool gray. Result: low chroma overall, with selective bright micro-acents to draw the eye without breaking calmness.

## Typography
The type system is sans-led with a single serif accent. The sans is geometric/grotesque (Inter family) with a separate display cut for headlines — headings are heavier, tighter, and noticeably larger than body. Body sits at a comfortable reading size with relaxed line-height. An uppercase, tracked-out, small-weight eyebrow style is used for section labels above each block, which is the main navigational cue. A serif (Tiempos-class) appears in one or two editorial-style moments — pull-quote, perhaps a tagline — to break monotony and add weight without shouting. Hierarchy is therefore carried by: eyebrow → display heading → supporting line → body → micro-meta.

## Layout & spacing
A wide centered max-width container governs everything. Feature sections follow an alternating two-column split (mockup left / copy right, then mirrored), which is the page's signature gesture. Density is spacious: large vertical section padding, generous gaps between cards, and tight internal card padding — meaning the outside breathes while the inside stays dense with information. Grids appear in: the product card row (multi-column), the footer (4-5 link columns), and the small three-up benefit tiles. There is no tight masonry; everything aligns to a clean grid baseline.

## Component language
- **Navigation**: dual-tier (thin utility strip + main nav), ghost and solid CTA pair, subtle bottom border.
- **Buttons**: rounded but not pill-shaped; solid primary uses the deep brand color with white text; ghost uses outlined or text-only treatment.
- **Cards**: mid-soft radius (12-20px), subtle elevation (very low shadow, no hard borders or borders so faint they read as hairlines), used to host mockups or short copy.
- **Mockups-as-illustrations**: UI fragments rendered flat inside cards instead of screenshots — gives controlled brand surface and avoids pixel-level copy issues.
- **Social proof**: avatar stacks and monochrome logo clouds only — no photography, no faces.
- **Quote band**: centered, large, serif-led, attribution beneath — the page's one editorial moment.
- **CTA banner**: deep-navy block with a white or accent pill button; used as the visual closer before the footer.
- **Footer**: multi-column link grid + locale row, brand + tagline first column.

## Imagery
No photography is used. Trust is carried by logos and avatars. Decoration is done with soft gradient washes and abstract shapes inside cards. This keeps the surface predictable and on-brand regardless of content swaps.

## Design tokens worth borrowing
- **Brand deep**: one deep hue used for both text and CTA — collapse roles for cohesion.
- **Tint-section token**: one low-sat wash for alternating backgrounds; never introduce a second tint.
- **Radius pair**: small for controls (8-10), large for surfaces (12-20).
- **Two radii, two shadows, two paddings** is enough; restraint is the design.
- **Eyebrow / display / body / micro** is the four-step type ladder; no more.
- **Sans + single serif accent** pattern for editorial punctuation.
- **Avatar stack + logo cloud** as the universal social-proof vocabulary.

## Practical takeaways
1. Pick one deep brand color and let it do double duty as text and CTA — don't separate them.
2. Alternate two backgrounds (white + single tint) for vertical rhythm; resist more hues.
3. Use flat product-fragment illustrations inside cards instead of screenshots.
4. Reserve one serif moment to add editorial weight to a SaaS surface.
5. Keep CTAs to two per hero, matching geometry, differing fill.
6. Use uppercase tracked eyebrows as the only section-divider chrome.
7. End with a saturated CTA banner that mirrors the brand color but inverted (deep fill, light type).
```


## Makine Okunur Dosyalar

- `analysis.json` — content-free tasarım raporu şeması
- `design-system.json` — renk, tipografi, spacing, radius ve layout sistemi
- `design-tokens.json` — geriye dönük uyumluluk için design-system kopyası
- `tech-stack.json` — teknoloji tespitleri, confidence ve kanıt snippet'leri
- `pages.json` — crawl edilen sayfalar, header, asset ve design signal özetleri
- `report-manifest.json` — bu raporun kapsamı: hangi bölüm tam, hangisi eksik
- `screenshots/` — tam sayfa ekran görüntüleri

## Kapsam ve Eksikler

Bu bölüm raporun NEYİ kapsadığını ve neyi kapsamadığını açıkça yazar.
Aynı bilgi makine-okunur biçimde `report-manifest.json` dosyasındadır.

| Bölüm | Durum | Ayrıntı |
|---|---|---|
| crawl | ✅ tam | 8 sayfa gezildi, 8 ekran görüntüsü alındı |
| scroll_capture | ✅ uygulandı | 4/8 sayfada kaydırma ile tam yakalama yapıldı |
| teknoloji_tespiti | ✅ tam | 8 teknoloji tespit edildi, 8/8 sayfada runtime probe çalıştı |
| computed_css_tokens | ✅ tam | Renk/tipografi/spacing token'ları gerçek computed CSS'ten çıkarıldı |
| gorsel_analiz_vision | ✅ tam | 8/8 sayfa görsel olarak analiz edildi |

**Sayılar:** 8 sayfa gezildi · 8 sayfa görsel analiz · 8 teknoloji tespiti

### Dikkat edilmesi gerekenler
- Bilinen eksik yok; rapor tam kapsamlı üretildi.

