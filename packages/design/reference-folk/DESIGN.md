# DESIGN.md — Design-Only Reference

> SADECE TASARIM analizi  
> Oluşturulma: 2026-08-16 20:47  
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
| Kaynak domain | `folk.app` |
| Gezilen sayfa | 2 |
| Keşfedilen aday sayfa | 72 |
| Vision ile analiz edilen sayfa | 2 |
| Tespit edilen teknoloji | 9 |
| Analiz tarihi | 2026-08-16 20:47 |

## Teknoloji Yığını

| Teknoloji | Kategori | Güven | Kanıt |
|---|---:|---:|---|
| **Cloudflare** | `cdn_security` | 0.96 | `` |
| **Google Analytics 4** | `analytics` | 0.92 | `` |
| **Google Fonts** | `font_service` | 0.92 | `` |
| **Google Tag Manager** | `tag_manager` | 0.93 | `` |
| **Parcel** | `build_tool` | 0.99 | `` |
| **React** | `frontend_framework` | 0.99 | `` |
| **Webflow** | `site_builder` | 0.99 | `` |
| **jQuery** | `javascript_library` | 0.99 | `` |
| **webpack** | `build_tool` | 0.99 | `` |

### Yığın Kararı

- **Ana yığın:** React
- **Frontend:** React
- **Backend:** —
- **Platform / CMS:** Webflow
- **Stil katmanı:** —

### Altyapı

| Alan | Tespit |
|---|---|
| server | cloudflare |


### Varlık Profili

- **Görsel formatları:** svg ×52, webp ×39, png ×7, woff2 ×6, gif ×2
- **Modern format oranı (avif/webp/svg):** %91
- **Font kaynağı:** cdn.prod.website-files.com
- **Üçüncü parti host sayısı:** 36


## Kaydırma Deneyimi ve Hareket Yığını

Bu sitede özel bir kaydırma **kütüphanesi** tespit edilmedi; tarayıcının standart kaydırması kullanılıyor.

**Kaydırma modeli:** Tarayıcının kendi kaydırması (özel bir smooth-scroll katmanı yok)

**Sayfa uzunluğu:** ~9.34 ekran boyu

**Ekran görüntüsü yakalama:** `static_full_page` × 2

Sayfalar gerçek tekerlek olaylarıyla gezilerek toplam **0** gizli blok açığa çıkarıldı. Kaydırmadan alınan klasik bir screenshot bu blokları boş yakalardı.

**Ölçülen koreografi:**
- Sabitlenen (pin) bölüm: **0** (toplam 0 px)
- Parallaks katman: **0**
- Yatay kaydırma şeridi: **0**
- Kaydırmaya bağlı (scrub) sahne: **0**, bir kez tetiklenen: **0**

> Sahne sahne ölçümler, sitenin kendi `@keyframes`/`@font-face`/`:root` tanımları ve bölüm bölüm yeniden kurma reçetesi ZIP içindeki **`MOTION.md`**, **`REPLICATE.md`** ve **`site/`** klasöründe.


## Kalite ve Erişilebilirlik (ölçüm katmanı)

Bu bölüm ekran görüntüsü yorumu değil, sayfada çalıştırılan **ölçümlerin**
sonucudur. Aynı ölçüm katmanı "Yapay Zeka Belirtilerini Tara" modunu da besler.

**Yapay zeka izi skoru: 89.3/100** (Özgün ve tutarlı; belirgin şablon izi yok.) · 20/22 metrik ölçüldü

| Grup | Skor | Metrik |
|---|---:|---:|
| Görsel Dil | 71.7 | 2 |
| Tipografi | 74.8 | 3 |
| Düzen & Kompozisyon | 87.7 | 7 |
| Renk & Efekt | 100.0 | 7 |
| İşçilik & Hiyerarşi | 100.0 | 1 |

### Erişilebilirlik

- **0** / 150 metin-zemin çifti WCAG AA eşiğinin altında (%0.0)
- **59** / 104 görselde alt metni yok (%56.7)

> Yeni tasarımı üretirken bu iki sayıyı **iyileştirmek** hedeftir; kaynak
> sitenin kontrast hatalarını taşıma.

### En düşük skorlu ölçümler

| Ölçüm | Bulunan | Hedef | Skor |
|---|---:|---:|---:|
| Bölüm ritmi tekdüzeliği | %96 | %55 | 0.0 |
| Alt metni olmayan görsel | %57 | %10 | 15.1 |
| Yazı ailesi sayısı | 4 adet | 2 adet | 50.0 |
| Farklı yazı boyutu sayısı | 12 adet | 9 adet | 80.0 |
| Farklı boşluk değeri sayısı | 14 adet | 14 adet | 97.7 |
| Yuvarlak köşe + gölge birlikteliği | %0 | %18 | 100.0 |
| Birebir aynı kart grupları | 2 adet | 2 adet | 100.0 |
| Ortalanmış metin oranı | %4 | %30 | 100.0 |
| Boşluk grid uyumu (4px) | %93 | %88 | 100.0 |
| Emoji içeren başlık | 0 adet | 0 adet | 100.0 |
| Varsayılan çerçeve paleti kullanımı | %0 | %20 | 100.0 |
| Mor-indigo gradyan | 0 adet | 0 adet | 100.0 |


## Responsive Davranış (ölçülen)

Bu tablo **gerçekten ziyaret edilen** viewport'ların ölçümüdür. Önceki
sürümlerde bu bölümde sabit bir breakpoint listesi vardı ve tek bir masaüstü
viewport'tan üretilmesine rağmen ölçülmüş gibi sunuluyordu.

| Viewport | Baskın kolon | Gizlenen nav linki | Gövde puntosu | Yatay taşma |
|---|---:|---:|---:|---:|
| Mobil (390px) | 2 | %100 | 14px | 0 |
| Tablet (768px) | 2 | %100 | 14px | 0 |
| Masaüstü (1440px) | 3 | %95 | 14.4px | 0 |

**Sitenin CSS'inde beyan ettiği eşikler:** `991px` (5 kural), `767px` (5 kural), `479px` (5 kural), `768px` (2 kural), `1440px` (2 kural), `1920px` (1 kural)

- Mobilde navigasyon linklerinin çoğu gizleniyor (hamburger menü deseni).
- Grid mobilde 2 kolona iniyor (masaüstü 3).
- Gövde puntosu mobilde 14px, masaüstünde 14.4px.


## Tasarım Token'ları

Bu bölüm screenshot tahmininden bağımsız olarak görünür DOM elemanlarının computed CSS değerlerinden çıkarılmıştır.

### Renk Token'ları

- `#030200` — örnek pay: 79%
- `#ffffff` — örnek pay: 7%
- `#000000` — örnek pay: 5%
- `#222222` — örnek pay: 2%
- `#050500` — örnek pay: 2%
- `#f7f3ef` — örnek pay: 1%
- `#646464` — örnek pay: 1%
- `#333333` — örnek pay: 0%
- `#f6dff6` — örnek pay: 0%
- `#e3efdc` — örnek pay: 0%

### Tipografi Token'ları

- `Foundersgrotesk` — örnek pay: 70%
- `Inter` — örnek pay: 20%
- `Uxumgrotesque` — örnek pay: 7%
- `Rubik` — örnek pay: 2%
- `system-ui` — örnek pay: 1%
- `Instrumentserif` — örnek pay: 1%

**Sık görülen font boyutları:** `14.4px`, `15px`, `14px`, `13px`, `20px`, `48px`, `10px`, `28px`, `40px`, `64px`

### Şekil / Radius

**Sık görülen border-radius değerleri:** `0px`, `1000px`, `20px`, `1440px`, `50%`, `100px`

### Spacing / Border / Shadow

**Sık görülen spacing değerleri:** `24px`, `16px`, `8px`, `144px`, `10px`, `20px`, `4px`, `6px`, `6.4px`, `112px`

**Border width değerleri:** `1px`

**Shadow değerleri:** `rgba(0, 0, 0, 0.06) 0px 1px 6px 0px, rgba(0, 0, 0, 0.16) 0px 2px 32px 0px`


## Global Design System

Bu bölüm tek tek sayfa anlatımı değil, bütün crawl + Vision + computed CSS sinyallerinden çıkarılmış ortak tasarım dili specification'ıdır.

### 1. Visual Theme & Atmosphere

- **Tasarım dili:** derived from repeated color, typography, spacing, surface and section patterns across the crawled site
- **Marka karakteri:** infer as polished, consistent and system-led when token repetition is strong; adjust tone to the new brand
- **Görsel atmosfer:** use the observed density, whitespace and surface hierarchy rather than source content
- **Kullanıcı hissi:** predictable, coherent and easy to scan; preserve clarity over decorative noise
- **Temel prensipler:** reuse the extracted token proportions, keep hierarchy section-first and component-consistent, separate primary actions from neutral surfaces, preserve whitespace rhythm across pages, avoid source copy and exact composition

### 2. Color System

- **background** `#ffffff` — kullanım oranı: 59%; kullan: page backgrounds, large quiet surfaces, negative space; kaçın: small text, critical actions without contrast checks; hover: tespit-edilemedi (öneri): temel renkten %6-10 koyu/açık bir durum türet; kontrastı uygulamada doğrula; active: tespit-edilemedi (öneri): temel renkten %10-14 daha güçlü bir durum türet; yeni renk ailesi katma
- **surface** `#000000` — kullanım oranı: 18%; kullan: cards, modals, inputs; kaçın: primary CTA if it blends into the page; hover: tespit-edilemedi (öneri): temel renkten %6-10 koyu/açık bir durum türet; kontrastı uygulamada doğrula; active: tespit-edilemedi (öneri): temel renkten %10-14 daha güçlü bir durum türet; yeni renk ailesi katma
- **text** `#030200` — kullanım oranı: 89%; kullan: primary reading text, headings when contrast is sufficient; kaçın: large filled surfaces, decorative backgrounds; hover: tespit-edilemedi (öneri): temel renkten %6-10 koyu/açık bir durum türet; kontrastı uygulamada doğrula; active: tespit-edilemedi (öneri): temel renkten %10-14 daha güçlü bir durum türet; yeni renk ailesi katma
- **muted_text** `#000000` — kullanım oranı: 4%; kullan: helper text, metadata, secondary labels; kaçın: primary actions, long body copy at low contrast; hover: tespit-edilemedi (öneri): temel renkten %6-10 koyu/açık bir durum türet; kontrastı uygulamada doğrula; active: tespit-edilemedi (öneri): temel renkten %10-14 daha güçlü bir durum türet; yeni renk ailesi katma
- **border** `#030200` — kullanım oranı: 88%; kullan: separators, input outlines, card boundaries; kaçın: large text blocks, dominant brand moments; hover: tespit-edilemedi (öneri): temel renkten %6-10 koyu/açık bir durum türet; kontrastı uygulamada doğrula; active: tespit-edilemedi (öneri): temel renkten %10-14 daha güçlü bir durum türet; yeni renk ailesi katma
- **primary_action** `#000000` — kullanım oranı: 5%; kullan: main CTA, selected state, high-emphasis controls; kaçın: dense backgrounds, long reading surfaces; hover: tespit-edilemedi (öneri): temel renkten %6-10 koyu/açık bir durum türet; kontrastı uygulamada doğrula; active: tespit-edilemedi (öneri): temel renkten %10-14 daha güçlü bir durum türet; yeni renk ailesi katma
- **accent** `#fff0bd` — kullanım oranı: 0%; kullan: badges, focus cues, small visual anchors; kaçın: body copy, large page backgrounds; hover: tespit-edilemedi (öneri): temel renkten %6-10 koyu/açık bir durum türet; kontrastı uygulamada doğrula; active: tespit-edilemedi (öneri): temel renkten %10-14 daha güçlü bir durum türet; yeni renk ailesi katma
- **success** `tespit-edilemedi` — kullanım oranı: 0%; kullan: ; kaçın: ; hover: None; active: None
- **warning** `tespit-edilemedi` — kullanım oranı: 0%; kullan: ; kaçın: ; hover: None; active: None
- **error** `tespit-edilemedi` — kullanım oranı: 0%; kullan: ; kaçın: ; hover: None; active: None

Semantic feedback renkleri: success `tespit-edilemedi`, warning `tespit-edilemedi`, error `tespit-edilemedi`.

### 3. Typography System

**Font family:** `Foundersgrotesk`

- **display** — size `64px`, weight `500`, line-height `64px`, letter-spacing `1px`; amaç: largest brand/hero statement only
- **h1** — size `64px`, weight `500`, line-height `64px`, letter-spacing `1px`; amaç: page-level heading
- **h2** — size `21px`, weight `500`, line-height `25.2px`, letter-spacing `1px`; amaç: major section heading
- **h3** — size `48px`, weight `500`, line-height `52.8px`, letter-spacing `1px`; amaç: card or subsection heading
- **body** — size `14.4px`, weight `400`, line-height `23.04px`, letter-spacing `1px`; amaç: primary reading and descriptions
- **small** — size `15px`, weight `500`, line-height `31.5px`, letter-spacing `1px`; amaç: secondary descriptions and compact UI
- **caption** — size `14px`, weight `400`, line-height `22.4px`, letter-spacing `1px`; amaç: metadata, helper text and annotations
- **button** — size `14.4px`, weight `400`, line-height `23.04px`, letter-spacing `1px`; amaç: interactive commands
- **label** — size `15px`, weight `500`, line-height `31.5px`, letter-spacing `1px`; amaç: form labels and UI descriptors

### 4. Component Library

- **Primary Button** — `{"name": "Primary Button", "background": "#000000", "text": "#ffffff", "radius": "0px", "padding": "24px 16px", "height": "44-52px", "hover": "tespit-edilemedi (öneri): kontrastı hafifçe artır, renk ailesini koru", "active": "tespit-edilemedi (öneri): daha koyu/güçlü dolguyla görsel olarak sıkıştır", "disabled": "reduce opacity to 45-55%, keep geometry unchanged, remove elevation", "shadow": "rgba(0, 0, 0, 0.06) 0px 1px 6px 0px, rgba(0, 0, 0, 0.16) 0px 2px 32px 0px", "border": "transparent or same-color border", "contrast_ratio": 21.0}`
- **Secondary Button** — `{"name": "Secondary Button", "background": "#ffffff", "text": "#030200", "radius": "0px", "padding": "24px 16px", "height": "42-50px", "hover": "tespit-edilemedi (öneri): #000000 ya da düşük kontrastlı bir ton kullan", "active": "tespit-edilemedi (öneri): kenarlık kontrastını artır, yüzey parlaklığını azalt", "disabled": "reduce opacity to 45-55%, keep geometry unchanged, remove elevation", "shadow": "none or lower than primary surfaces", "border": "1px solid current palette border"}`
- **Cards** — `{"name": "Cards", "background": "#ffffff", "text": "#030200", "radius": "0px", "padding": "16px", "height": "content-defined; preserve consistent vertical rhythm", "hover": "tespit-edilemedi (öneri): kenarlık kontrastını ya da yüksekliği hafif artır; boyut değiştirme", "active": "tespit-edilemedi (öneri): yüzeyi sabit tut; seçili durumu kenarlık/aksan ile göster", "disabled": "reduce opacity to 45-55%, keep geometry unchanged, remove elevation", "shadow": "rgba(0, 0, 0, 0.06) 0px 1px 6px 0px, rgba(0, 0, 0, 0.16) 0px 2px 32px 0px", "border": "1px solid low-contrast border"}`
- **Pricing Cards** — `{"status": "not-observed", "note": "Bu sitede 'pricing_cards' pattern'ine dair DOM kaniti bulunamadi; spec uretilmedi. Ihtiyacin varsa mevcut token'lardan turet."}`
- **Hero** — `{"status": "not-observed", "note": "Bu sitede 'hero' pattern'ine dair DOM kaniti bulunamadi; spec uretilmedi. Ihtiyacin varsa mevcut token'lardan turet."}`
- **Navigation** — `{"layout": "horizontal on desktop, collapsed/stacked on mobile", "height": "64-88px desktop, 56-72px mobile", "background": "#ffffff", "border": "1px bottom separator when needed", "item_style": "14.4px text with compact spacing and clear active state"}`
- **Footer** — `{"layout": "multi-column or compact grouped links", "background": "#030200", "text": "#ffffff", "spacing": "large top/bottom padding with tighter internal link rhythm"}`
- **Inputs** — `{"name": "Inputs", "background": "#ffffff", "text": "#030200", "radius": "0px", "padding": "24px 16px", "height": "42-48px", "hover": "tespit-edilemedi (öneri): kenarlık kontrastını artır", "active": "tespit-edilemedi (öneri): aksan/birincil token ile net bir odak halkası göster", "disabled": "reduce opacity to 45-55%, keep geometry unchanged, remove elevation", "shadow": "none", "border": "1px solid low-contrast border"}`
- **Search** — `{"status": "not-observed", "note": "Bu sitede 'search' pattern'ine dair DOM kaniti bulunamadi; spec uretilmedi. Ihtiyacin varsa mevcut token'lardan turet."}`
- **Dropdown** — `{"name": "Dropdown", "background": "#ffffff", "text": "#030200", "radius": "0px", "padding": "24px 16px", "height": "42-48px", "hover": "tespit-edilemedi (öneri): kenarlık kontrastını artır", "active": "tespit-edilemedi (öneri): aksan/birincil token ile net bir odak halkası göster", "disabled": "reduce opacity to 45-55%, keep geometry unchanged, remove elevation", "shadow": "none", "border": "1px solid low-contrast border"}`
- **Tabs** — `{"status": "not-observed", "note": "Bu sitede 'tabs' pattern'ine dair DOM kaniti bulunamadi; spec uretilmedi. Ihtiyacin varsa mevcut token'lardan turet."}`
- **Badges** — `{"background": "#000000", "text": "#030200", "radius": "smaller than cards; pill only if observed radius supports it", "padding": "4-8px vertical, 8-12px horizontal", "border": "1px solid subtle border"}`
- **Alerts** — `{"status": "not-observed", "note": "Bu sitede 'alerts' pattern'ine dair DOM kaniti bulunamadi; spec uretilmedi. Ihtiyacin varsa mevcut token'lardan turet."}`
- **Modal** — `{"status": "not-observed", "note": "Bu sitede 'modal' pattern'ine dair DOM kaniti bulunamadi; spec uretilmedi. Ihtiyacin varsa mevcut token'lardan turet."}`
- **Accordion** — `{"name": "Accordion", "background": "#ffffff", "text": "#030200", "radius": "0px", "padding": "16px", "height": "row-based; expanded panel keeps same rhythm", "hover": "tespit-edilemedi (öneri): kenarlık kontrastını ya da yüksekliği hafif artır; boyut değiştirme", "active": "tespit-edilemedi (öneri): yüzeyi sabit tut; seçili durumu kenarlık/aksan ile göster", "disabled": "reduce opacity to 45-55%, keep geometry unchanged, remove elevation", "shadow": "rgba(0, 0, 0, 0.06) 0px 1px 6px 0px, rgba(0, 0, 0, 0.16) 0px 2px 32px 0px", "border": "1px solid low-contrast border"}`
- **Faq** — `{"status": "not-observed", "note": "Bu sitede 'faq' pattern'ine dair DOM kaniti bulunamadi; spec uretilmedi. Ihtiyacin varsa mevcut token'lardan turet."}`
- **Pricing Table** — `{"status": "not-observed", "note": "Bu sitede 'pricing_table' pattern'ine dair DOM kaniti bulunamadi; spec uretilmedi. Ihtiyacin varsa mevcut token'lardan turet."}`
- **Cta Banner** — `{"status": "not-observed", "note": "Bu sitede 'cta_banner' pattern'ine dair DOM kaniti bulunamadi; spec uretilmedi. Ihtiyacin varsa mevcut token'lardan turet."}`
- **Feature Card** — `{"name": "Feature Card", "background": "#ffffff", "text": "#030200", "radius": "0px", "padding": "16px", "height": "content-defined; preserve consistent vertical rhythm", "hover": "tespit-edilemedi (öneri): kenarlık kontrastını ya da yüksekliği hafif artır; boyut değiştirme", "active": "tespit-edilemedi (öneri): yüzeyi sabit tut; seçili durumu kenarlık/aksan ile göster", "disabled": "reduce opacity to 45-55%, keep geometry unchanged, remove elevation", "shadow": "rgba(0, 0, 0, 0.06) 0px 1px 6px 0px, rgba(0, 0, 0, 0.16) 0px 2px 32px 0px", "border": "1px solid low-contrast border"}`
- **Product Card** — `{"name": "Product Card", "background": "#ffffff", "text": "#030200", "radius": "0px", "padding": "16px", "height": "image/media area plus text/action stack", "hover": "tespit-edilemedi (öneri): kenarlık kontrastını ya da yüksekliği hafif artır; boyut değiştirme", "active": "tespit-edilemedi (öneri): yüzeyi sabit tut; seçili durumu kenarlık/aksan ile göster", "disabled": "reduce opacity to 45-55%, keep geometry unchanged, remove elevation", "shadow": "rgba(0, 0, 0, 0.06) 0px 1px 6px 0px, rgba(0, 0, 0, 0.16) 0px 2px 32px 0px", "border": "1px solid low-contrast border"}`

### 5. Layout System

- **Grid:** use observed grid/flex rhythm from component-patterns; choose responsive columns by content density
- **Max width:** 1160px, 320px, 360px, 1440px, 280px, 440px, 640px, 600px
- **Breakpoints:** {"status": "tespit-edilemedi", "note": "Breakpoint tespiti icin cok-viewport tarama gerekir."}
- **Section spacing:** 24px, 16px, 8px, 144px, 10px, 20px
- **Component spacing:** 144px, 10px, 20px, 4px, 6px, 6.4px, 112px
- **Container padding:** 24px, 16px, 8px, 144px
- **White-space philosophy:** let sections breathe; use denser rhythm only inside forms, tables and repeated cards
- **Visual rhythm:** dominant sections: hero, generic-block, gallery, content, form, card-grid, footer

### 6. Elevation System

- **Shadow scale:** rgba(0, 0, 0, 0.06) 0px 1px 6px 0px, rgba(0, 0, 0, 0.16) 0px 2px 32px 0px
- **Border hierarchy:** 1px
- **Radius hierarchy:** 0px, 1000px, 20px, 1440px, 50%, 100px
- **Surface hierarchy:** page background, surface/card, raised/modal, primary action

### 7. Motion Language

- **Hover davranışı:** infer through component states: subtle color, border or elevation change; avoid layout shift
- **Transition süreleri:** 0.1s, 0.2s, 0.15s, 0.3s, 0.167s, 0.08s
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
| 1 | `hero` | `stacked` | `spacious` | -7289px | 615px | 1 | 1 | 1 | 76% | dom |
| 2 | `hero` | `stacked` | `spacious` | -7289px | 1112px | 1 | 1 | 1 | 78% | dom |
| 3 | `gallery` | `stacked` | `spacious` | -6097px | 6271px | 14 | 6 | 1 | 86% | dom |
| 4 | `hero` | `flex-column` | `spacious` | -5556px | 543px | 1 | 1 | 1 | 78% | dom |
| 5 | `hero` | `flex-column` | `spacious` | -4853px | 572px | 1 | 1 | 1 | 78% | dom |
| 6 | `hero` | `flex-column` | `spacious` | -4168px | 593px | 1 | 1 | 1 | 78% | dom |
| 7 | `hero` | `flex-column` | `spacious` | -3463px | 588px | 1 | 1 | 1 | 78% | dom |
| 8 | `hero` | `flex-column` | `spacious` | -2763px | 588px | 1 | 1 | 1 | 78% | dom |
| 9 | `hero` | `flex-column` | `spacious` | -2063px | 588px | 1 | 1 | 1 | 78% | dom |
| 10 | `hero` | `flex-column` | `spacious` | -1332px | 318px | 5 | 0 | 1 | 70% | dom |
| 11 | `hero` | `stacked` | `spacious` | -902px | 605px | 1 | 0 | 1 | 70% | dom |
| 12 | `content` | `flex-column` | `spacious` | -185px | 199px | 1 | 0 | 1 | 70% | dom |
| 13 | `footer` | `stacked` | `spacious` | 174px | 1033px | 1 | 8 | 1 | 72% | dom |
| 14 | `form` | `flex-row` | `spacious` | 270px | 305px | 1 | 0 | 1 | 64% | dom |
| 15 | `hero` | `stacked` | `spacious` | 0px | 534px | 1 | 0 | 1 | 68% | dom |
| 16 | `content` | `stacked` | `spacious` | 1759px | 369px | 4 | 0 | 1 | 70% | dom |
| 17 | `card-grid` | `grid-multi` | `spacious` | 1832px | 296px | 3 | 0 | 3 | 90% | dom |
| 18 | `generic-block` | `flex-column` | `spacious` | 2389px | 154px | 1 | 0 | 1 | 60% | dom |
| 19 | `generic-block` | `flex-row` | `spacious` | 2976px | 158px | 1 | 0 | 1 | 60% | dom |
| 20 | `generic-block` | `flex-row` | `spacious` | 3588px | 158px | 1 | 0 | 1 | 60% | dom |
| 21 | `generic-block` | `flex-column` | `spacious` | 4217px | 175px | 1 | 0 | 1 | 60% | dom |
| 22 | `generic-block` | `flex-row` | `spacious` | 4804px | 158px | 1 | 0 | 1 | 60% | dom |
| 23 | `card-grid` | `grid-multi` | `spacious` | 5256px | 307px | 3 | 3 | 3 | 95% | dom |
| 24 | `gallery` | `stacked` | `spacious` | 5675px | 605px | 1 | 0 | 1 | 70% | dom |
| 25 | `form` | `flex-row` | `spacious` | 7017px | 305px | 1 | 0 | 1 | 64% | dom |

## Sayfa Envanteri

| # | Sayfa tipi | Screenshot | CSS Örnek |
|---|---|---|---|
| 1 | `home` | `001_https___folk_app_.png` | 438 visible element |
| 2 | `inner-page` | `002_https___www_folk_app_agency_crm.png` | 429 visible element |

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
| `nav-item` | `w-inline-block` | 18x | `A` | `0px` | `0px 0px 0px 0px` | `14.4px` | `rgba(0, 0, 0, 0)` |
| `card` | `logo-cell` | 18x | `DIV` | `0px` | `24px 16px 24px 16px` | `14.4px` | `rgb(255, 255, 255)` |
| `badge-or-tag` | `nav-wrapper-link` | 6x | `DIV` | `0px` | `0px 0px 0px 0px` | `14.4px` | `rgba(0, 0, 0, 0)` |
| `input-group` | `form-field-wrapper-2` | 4x | `DIV` | `0px` | `0px 0px 0px 0px` | `14.4px` | `rgba(0, 0, 0, 0)` |
| `card` | `form-label-ads` | 4x | `LABEL` | `0px` | `0px 0px 0px 0px` | `15px` | `rgba(0, 0, 0, 0)` |
| `card` | `form-input` | 4x | `INPUT` | `0px` | `6.4px 8px 6.4px 8px` | `14px` | `rgba(255, 255, 255, 0.9)` |
| `feature-card` | `rl_navbar1_menu-dropdown` | 3x | `DIV` | `0px` | `0px 0px 0px 0px` | `14.4px` | `rgba(0, 0, 0, 0)` |
| `card` | `nav-item` | 3x | `DIV` | `0px` | `20px 10px 20px 10px` | `14.4px` | `rgba(0, 0, 0, 0)` |
| `badge-or-tag` | `nav-chevron` | 3x | `IMG` | `0px` | `0px 0px 0px 0px` | `14.4px` | `rgba(0, 0, 0, 0)` |
| `nav-item` | `rl_navbar1_dropdown-toggle` | 3x | `A` | `20px` | `4px 10px 4px 10px` | `14.4px` | `rgba(0, 0, 0, 0)` |
| `badge-or-tag` | `rating-grid-number` | 3x | `P` | `0px` | `0px 0px 0px 0px` | `28px` | `rgba(0, 0, 0, 0)` |
| `nav-item` | `w-inline-block` | 19x | `A` | `0px` | `16px 6px 16px 6px` | `14.4px` | `rgba(0, 0, 0, 0)` |
| `card` | `logo-cell` | 18x | `DIV` | `0px` | `24px 16px 24px 16px` | `14.4px` | `rgb(255, 255, 255)` |
| `badge-or-tag` | `nav-wrapper-link` | 6x | `DIV` | `0px` | `0px 0px 0px 0px` | `14.4px` | `rgba(0, 0, 0, 0)` |
| `input-group` | `form-field-wrapper-2` | 4x | `DIV` | `0px` | `0px 0px 0px 0px` | `14.4px` | `rgba(0, 0, 0, 0)` |

## Vision ↔ Computed CSS Uzlaştırması

**Genel uyum:** güçlü-uyum (%100)

| Boyut | Uyum | Kontrol edilen |
|---|---:|---:|
| Renk | %100 | 20 |
| Tipografi | %100 | 11 |

Çelişkilerde **computed CSS esastır** — vision ekran görüntüsünden tahmin eder, computed CSS ölçer.

- Çelişki bulunamadı.

## Sayfa Sayfa Görsel Analiz

### Görsel analiz — `product (URL tahmini: home)`

**Screenshot:** `001_https___folk_app_.png` · **Güven:** 0.92 · **Doğrulama:** 10/10 renk computed CSS ile doğrulandı

- **Görsel ton:** editorial-soft, high-contrast-monochrome-with-pastel-accents, playful-but-mature, low-noise, generous-whitespace
- **Yapı:** single vertical narrative with alternating full-width feature blocks; each block transitions between white, cream, and pastel-tinted panels
- **Yoğunluk:** spacious · **Grid:** 12-col implied container ~1280-1440px; product mockups centered with large negative breathing room
- **Gözlenen componentler:** primary-button, text-input, feature-card, logo-cell, testimonial-card, integration-tile, industry-pill

**Tasarım dili özeti**

Sayfa, neredeyse tamamen beyaz bir tuval üzerinde ilerleyen, gölge yerine renk bloklarıyla derinlik kuran editorial bir SaaS anlatımı kuruyor. Tipografi üçlü bir yapıya oturuyor: dikkat çekici bir display ailesi (görsel olarak serif/slab hissi veren, hesaplanmış CSS'te Uxumgrotesque olarak geçen) hero ve bölüm başlıklarını taşırken, UI ve butonlar geometric bir grotesk olan Foundersgrotesk'te, gövde metinleri ise Inter'de kalıyor. Bu üçlü kontrast, ilgili bölüm ayrımını tipografik seviyede çözüyor.

**Renk sistemi**

Kompozisyon siyah-beyaz bir ana omurga üzerinde yürüyor; vurgu yalnızca üç pastel yüzeyden geliyor: krem (#f7f3ef), lavanta (#f6dff6) ve nane yeşili (#e3efdc). Görselde ayrıca algılanan soft cyan ve pastel sarı panel/chip'ler, sayfanın ilgili bölüm olmayan, çocuksu-olmayan pastel paletini genişletiyor. Saf siyah (#000000) yalnızca birincil CTA ve dark inversion bandına ayrılmış; metin hep near-black varyantlarla (#030200, #050500, #222222) basılıyor — bu küçük ayrım, ilgili bölüm hiyerarşisini takviye ediyor.

**Layout ve ritim**

Sayfa stacked, tek-sütun, çok uzun bir anlatı. Her bölüm yaklaşık 96–144px dış boşlukla ayrılıyor (CSS token'ları 112/144 ile uyumlu) ve her demo bloğu tek bir büyük başlık + tek bir UI mockup + yan çağrı olarak kuruluyor. Yoğunluk ilgili bölüm — derinlik mockup'ların etrafındaki nefes alanından geliyor, içerik sıkıştırılmıyor. Yoğunlaşan tek yüzeyler: logo grid'i (krem band üzerinde) ve integrations ızgarası.

**Bileşen dili**

Köşe yuvarlaklığı skalası {0, 20, 100, 1000, 1440} olacak şekilde kurulmuş — bu, ilgili bölüm ve ilgili bölüm geometriye güçlü bir bağlılık olduğunu gösteriyor. Birincil CTA tamamen yuvarlak, siyah solid, beyaz etiketli, ghost varyantı görselde yok. Kartlar 20px radius ve pastel yüzeylerle ayrışıyor; kartların varyantı rengidir, gölgesi değil. Kutucuk/kutu formu yerine her bölümde ilgili bölüm kullanılıyor. Testimonial'lar 3-4'lü küçük cluster'lar halinde, yine pastel yüzeylerde çalışıyor.

**Görsellik**

Fotoğraf stili muted, doğal ışıklı, belgesel — ellerin cihazla etkileşimi ve sade ofis portreleri birkaç yerde accent olarak kullanılmış. Görsel ağırlık UI mockup'larda; fotoğraf dekor değil, mikro-anlatı.

**CSS cross-reference**

Computed CSS ile görsel analiz büyük ölçüde tutarlı: font aileleri üçlü olarak ayrışıyor, renkler near-black metin + pastel yüzeyler olarak beklenen dağılımda, radius skalası gözlemlenen pill geometriyi doğruluyor. Tek şeffaflık: computed top-5'te yer almayan cyan ve pastel sarı paneller görselde açıkça var; bu yüzeyler daha alt sıralarda ama tasarım sistemi için gerçek bir token oldukları ilgili bölüm olarak not edilmeli. Gölge sayısının 1 olması, sayfanın düz (flat) karakterini sayısal olarak doğruluyor.

**İlham prensipleri (kopyalanmaya değil, ilham alınmaya uygun)**

- Tek bir kalın görsel anlatı başına: büyük display başlık + ortalanmış tek mockup + bol beyaz alan.
- Derinlik için gölge değil, renk bloğu kullan; UI'i ilgili bölüm değil ilgili bölüm.
- Birincil CTA'yı siyah pill olarak tek bir görsel ritim noktasına sabitle; sayfa boyunca tek bir CTA geometrisi.
- Sayfa eksenini pastel yıkamalarla böl (krem/lavanta/mint); metin hiyerarşisini siyah tonlarıyla yarat, aksan için daima yüzey rengi kullan.
- Sosyal kanıtı bir kahraman alıntı yerine 3-4 pastel karttan oluşan bir cluster olarak sun.
- Sayfayı, hero'daki lead-capture formunun aynısının yer aldığı tek bir karanlık inversion bandı ile kapat.
- Dikey ritim gözünü korkutmasın: 96px+ section padding, yoğunluk yalnızca logo/integrations ızgaralarında.


---

### Görsel analiz — `product (URL tahmini: inner-page)`

**Screenshot:** `002_https___www_folk_app_agency_crm.png` · **Güven:** 0.92 · **Doğrulama:** 10/10 renk computed CSS ile doğrulandı

- **Görsel ton:** soft pastel palette anchored on lavender/pink, friendly, approachable, premium-SaaS, low-contrast airy composition, rounded geometry, soft shadows, playful without being childish, high typographic contrast between display and body
- **Yapı:** single-column narrative with alternating two-column feature rows; hero stacked center-aligned
- **Yoğunluk:** — · **Grid:** 12-col underlying grid; feature rows split 5/7 or 6/6; logo grid appears 4 columns; testimonial grid 3 columns
- **Gözlenen componentler:** primary-button, secondary-button, surface-card, pill-tag, avatar-circle, logo-grid-cell, feature-callout, video-card

` with concise professional explanation

I should not reproduce any text/copy from the source site. I need to focus on abstract design principles: hierarchy, density, spacing, grid, color ratios, typography character, radius, border, shadow, component behavior.

Let me analyze the screenshot carefully:

**Visual observations:**
- The page has a soft lavender/purple gradient background at the top (#eaddf3 to #f6dff6 based on computed CSS)
- There's a CRM-style interface screenshot shown in the hero section
- Cards have soft rounded corners (looks like 20px based on border-radius values)
- Typography appears to use a mix of a display serif/grotesque font (Uxumgrotesque or Foundersgrotesk) and Inter for body
- Buttons appear to be pill-shaped (1000px border-radius)
- Color palette: black text, white cards, lavender/pink background, with some accent colors
- Logo grids showing trusted companies in a clean grid layout
- Cards with shadow effect (subtle, single variant)
- The overall tone is clean, modern, friendly, approachable
- Density is balanced to spacious
- Grid system appears to be multi-column with consistent gutters

**Layout structure:**
- Hero section with stacked layout at top
- Trust/logos grid (4 columns)
- Feature sections alternating left/right with cards
- FAQ accordion at bottom
- CTA footer
- Standard footer with links

**Components:**
- Cards with rounded corners and subtle shadows
- Pill buttons
- Avatar circles with images
- Badge/pill components (tags)
- Form inputs with rounded corners
- Icon-based feature cards
- Video player cards
- FAQ accordion items

**Color analysis:**
- Background lavender: #eaddf3 / #f6dff6
- White cards: #ffffff
- Black text: #000000 / #030200
- Muted text: #646464
- Soft cream/off-white: #f7f3ef
- Pink accent: #f6dff6

**Typography:**
- Display heading uses a distinctive grotesque (likely Uxumgrotesque based on the unique characters visible)
- Body uses Inter or similar humanist sans
- Headings are large and bold
- Body text is medium size with good line height

Let me structure my analysis now.</think>

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
    {"hex": ilgili bölüm, ilgili bölüm: ilgili bölüm, ilgili bölüm: 0.95, ilgili bölüm: ilgili bölüm, ilgili bölüm: true},
    {"hex": ilgili bölüm, ilgili bölüm: ilgili bölüm, ilgili bölüm: 0.95, ilgili bölüm: ilgili bölüm, ilgili bölüm: true},
    {"hex": ilgili bölüm, ilgili bölüm: ilgili bölüm, ilgili bölüm: 0.99, ilgili bölüm: ilgili bölüm, ilgili bölüm: true},
    {"hex": ilgili bölüm, ilgili bölüm: ilgili bölüm, ilgili bölüm: 0.85, ilgili bölüm: ilgili bölüm, ilgili bölüm: true},
    {"hex": ilgili bölüm, ilgili bölüm: ilgili bölüm, ilgili bölüm: 0.99, ilgili bölüm: ilgili bölüm, ilgili bölüm: true},
    {"hex": ilgili bölüm, ilgili bölüm: ilgili bölüm, ilgili bölüm: 0.9, ilgili bölüm: ilgili bölüm, ilgili bölüm: true},
    {"hex": ilgili bölüm, ilgili bölüm: ilgili bölüm, ilgili bölüm: 0.9, ilgili bölüm: ilgili bölüm, ilgili bölüm: true},
    {"hex": ilgili bölüm, ilgili bölüm: ilgili bölüm, ilgili bölüm: 0.8, ilgili bölüm: ilgili bölüm, ilgili bölüm: true},
    {"hex": ilgili bölüm, ilgili bölüm: ilgili bölüm, ilgili bölüm: 0.85, ilgili bölüm: ilgili bölüm, ilgili bölüm: true},
    {"hex": ilgili bölüm, ilgili bölüm: ilgili bölüm, ilgili bölüm: 0.8, ilgili bölüm: ilgili bölüm, ilgili bölüm: false}
  ],
  ilgili bölüm: [
    {"role": ilgili bölüm, ilgili bölüm: ilgili bölüm, ilgili bölüm: ilgili bölüm, ilgili bölüm: ilgili bölüm, ilgili bölüm: ilgili bölüm, ilgili bölüm: 0.9},
    {"role": ilgili bölüm, ilgili bölüm: ilgili bölüm, ilgili bölüm: ilgili bölüm, ilgili bölüm: ilgili bölüm, ilgili bölüm: ilgili bölüm, ilgili bölüm: 0.85},
    {"role": ilgili bölüm, ilgili bölüm: ilgili bölüm, ilgili bölüm: ilgili bölüm, ilgili bölüm: ilgili bölüm, ilgili bölüm: ilgili bölüm, ilgili bölüm: 0.95},
    {"role": ilgili bölüm, ilgili bölüm: ilgili bölüm, ilgili bölüm: ilgili bölüm, ilgili bölüm: ilgili bölüm, ilgili bölüm: ilgili bölüm, ilgili bölüm: 0.9},
    {"role": ilgili bölüm, ilgili bölüm: ilgili bölüm, ilgili bölüm: ilgili bölüm, ilgili bölüm: ilgili bölüm, ilgili bölüm: ilgili bölüm, ilgili bölüm: 0.9},
    {"role": ilgili bölüm, ilgili bölüm: ilgili bölüm, ilgili bölüm: ilgili bölüm, ilgili bölüm: ilgili bölüm, ilgili bölüm: ilgili bölüm, ilgili bölüm: 0.85},
    {"role": ilgili bölüm, ilgili bölüm: ilgili bölüm, ilgili bölüm: ilgili bölüm, ilgili bölüm: ilgili bölüm, ilgili bölüm: ilgili bölüm, ilgili bölüm: 0.8}
  ],
  ilgili bölüm: {
    ilgili bölüm: "single-column narrative with alternating two-column feature rows; hero stacked center-aligned",
    ilgili bölüm: "12-col underlying grid; feature rows split 5/7 or 6/6; logo grid appears 4 columns; testimonial grid 3 columns",
    ilgili bölüm: "generous vertical rhythm; large section breaks (~96-160px between blocks); tight internal card padding (~16-24px); gutters ~24-32px",
    ilgili bölüm: ilgili bölüm,
    ilgili bölüm: ilgili bölüm,
    ilgili bölüm: 0.88
  },
  ilgili bölüm: [
    {"name": ilgili bölüm, ilgili bölüm: "pill-shaped, dark fill (#000), white label, ~1000px radius, ~40-48px height, slight inward padding; sits inside dark capsules for hero CTA", ilgili bölüm: ilgili bölüm, ilgili bölüm: 0.9},
    {"name": ilgili bölüm, ilgili bölüm: ilgili bölüm, ilgili bölüm: ilgili bölüm, ilgili bölüm: 0.85},
    {"name": ilgili bölüm, ilgili bölüm: "white, ~20px radius, ~16-24px padding, single soft shadow (low blur), 1px or 0px border", ilgili bölüm: ilgili bölüm, ilgili bölüm: 0.95},
    {"name": ilgili bölüm, ilgili bölüm: "small rounded badge ~1440px radius, light tinted background, short label, used for categorization and metadata chips", ilgili bölüm: ilgili bölüm, ilgili bölüm: 0.9},
    {"name": ilgili bölüm, ilgili bölüm: "50% radius circular image, paired with name + role text; appears in testimonial cards", ilgili bölüm: ilgili bölüm, ilgili bölüm: 0.95},
    {"name": ilgili bölüm, ilgili bölüm: "flat logo on neutral surface, no frame, even grid spacing, low contrast monochrome treatment", ilgili bölüm: ilgili bölüm, ilgili bölüm: 0.9},
    {"name": ilgili bölüm, ilgili bölüm: "two-column row: heading + subhead left, illustrated card/UI right; reverses direction by section", ilgili bölüm: ilgili bölüm, ilgili bölüm: 0.9},
    {"name": ilgili bölüm, ilgili bölüm: ilgili bölüm, ilgili bölüm: ilgili bölüm, ilgili bölüm: 0.85},
    {"name": ilgili bölüm, ilgili bölüm: ilgili bölüm, ilgili bölüm: ilgili bölüm, ilgili bölüm: 0.8},
    {"name": ilgili bölüm, ilgili bölüm: ilgili bölüm, ilgili bölüm: ilgili bölüm, ilgili bölüm: 0.85},
    {"name": ilgili bölüm, ilgili bölüm: "sticky-feel header; left wordmark, center horizontal nav, right auth actions; transparent over tinted hero", ilgili bölüm: ilgili bölüm, ilgili bölüm: 0.8}
  ],
  ilgili bölüm: {
    ilgili bölüm: "flat UI mockups of the product on tinted gradient; soft photographic avatars (real people); monochrome logo lockups",
    ilgili bölüm: "product illustrations dominate hero and feature sections; humans reserved for social proof",
    ilgili bölüm: 0.85
  },
  ilgili bölüm: [
    "Computed lavender #eaddf3 and pink #f6dff6 match visible gradient washes exactly.",
    "Computed #f7f3ef confirms a warm off-white secondary surface tone, slightly cream rather than neutral.",
    "Border-radius 20px is consistent with the dominant card rounding; 1000px drives pill buttons/tags; 1440px for capsule chips; 50% used for circular avatars.",
    "Box-shadow count is single-variant — confirms minimal, low-elevation shadow language visible in screenshots.",
    "Detected font families match the visible duality: Uxumgrotesque (distinctive display) + Inter (neutral UI/body). Foundersgrotesk appears reserved for wordmark/decorative.",
    "Font size scale 14–15px for body, 24–28px for subhead, ~48px for hero display matches the observed hierarchy.",
    "Top margin tokens (112/144/160px) indicate generous vertical rhythm between hero/feature sections.",
    "Body text color #222 and muted #646464 explain the soft, low-contrast body feel against white surfaces."
  ],
  ilgili bölüm: [
    "Adopt a dual-typeface system: one quirky characterful display face for headings + one neutral humanist sans for UI to create personality without sacrificing legibility.",
    "Use a single soft pastel gradient as the only chromatic moment on the page; let everything else be white/black/gray so product UI mockups stay the focus.",
    "Cards: 20px corner radius + single low-blur shadow + 1px optional border. Avoid heavy elevation stacks.",
    "Buttons: full-pill (≥1000px radius), consistent vertical padding, single primary color (near-black) and one outlined secondary.",
    "Section rhythm: alternate left/right two-column feature blocks to create narrative pacing while keeping a single grid baseline.",
    "Trust row: flat monochrome logos in an even 4-column grid, no boxes, no captions — keeps the wall quiet.",
    "Accent surfaces: introduce a warm off-white (#f7f3ef) as secondary card tone to soften pure white contrast blocks.",
    "Avatar + short quote in 3-column grid for testimonials; keep them human and small to preserve whitespace.",
    "Reserve the only dark element for primary CTAs; everything else should breathe on light surfaces.",
    "Footer stays typographic only: stacked link columns, muted gray, no decorative imagery, anchoring the page quietly."
  ]
}
```

## VISUAL_AUDIT_MARKDOWN

**Tone & overall identity.** The page reads as a friendly, premium SaaS marketing surface. A single soft lavender→pink pastel wash carries the hero and a few accent moments, while the rest of the canvas stays neutral white with a warm off-white (#f7f3ef) as a secondary surface. The chromatic ratio is roughly: ~70% white surface, ~20% tinted background, ~10% near-black text/UI, with pink/lavender acting as a single emotional accent rather than a system color. This is a ilgili bölüm aesthetic — the product UI mockups are the visual hero, not the page chrome.

**Typography.** A distinctive display grotesque with quirky letterforms (visible ligatures, slightly humanist proportions) carries every heading; it scales from ~48px hero down to ~28px section headings. Body, nav, and button labels all sit on a neutral humanist sans (Inter) at 14–15px with generous line-height. The contrast between the display face and the neutral UI sans is the page's main voice — it's the strongest personality signal. Wordmark/monogram uses a third custom geometric grotesque for branded moments.

**Layout & rhythm.** A 12-column grid underlies the page. Hero is center-stacked. Below it, alternating two-column feature rows (heading-left / UI-right, then reverse) drive a narrative cadence. Vertical rhythm is generous: 112–160px gaps between sections. The trust row is a quiet 4-column flat logo grid with no frames or captions. A 3-column testimonial block sits later. Footer is purely typographic with stacked link columns in muted gray.

**Components.**
- *Cards*: 20px radius, ~16–24px padding, single low-blur shadow, optional hairline border. Three jobs: product mockup surface, feature illustration, video thumbnail.
- *Buttons*: pill-shaped (1000px radius). Primary is solid near-black on white; secondary is outlined white-with-border. Heights feel consistent and tactile.
- *Pill tags*: capsule chips for categorization and metadata, tinted background variants.
- *Avatars*: 50% circular, paired with name+role text in testimonial rows.
- *Form inputs*: fully-rounded, generous height, used for lead-capture moments.
- *Nav*: wordmark left, horizontal nav center, auth actions right; transparent over tinted hero.

**Imagery.** Mostly flat product UI illustrations on tinted gradient surfaces. Real human avatars are reserved for social proof only. Logos are flat monochrome.

**Design-system takeaways for inspiration.**
1. Build the personality around a type pairing, not around color — one characterful display face + one neutral UI sans.
2. Pick a single pastel gradient as your ilgili bölüm backdrop, not a multi-color system.
3. Cards should share one radius (20px), one shadow, optional 1px border. No mixed elevations.
4. Buttons should be uniformly pill-shaped with a single solid primary color; resist gradients or shadows.
5. Alternate feature-block direction to create rhythm without changing grid baseline.
6. Keep trust rows typographically silent (flat logos, no frames) so adjacent sections can be loud.
7. Use a warm off-white as a second surface tone to break pure-white monotony.
8. Reserve dark for CTAs and headings only — let everything else breathe on light surfaces.
9. Footer is typographic only: stacked link columns, muted color, zero decoration.
10. Maintain at least 96–120px between major sections to preserve the airy, premium feel.


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
| crawl | ✅ tam | 2 sayfa gezildi, 2 ekran görüntüsü alındı |
| scroll_capture | ➖ gerekmedi | Sayfalarda gizli/animasyonlu blok yoktu; ek kaydırma turu gerekmedi |
| teknoloji_tespiti | ✅ tam | 9 teknoloji tespit edildi, 2/2 sayfada runtime probe çalıştı |
| computed_css_tokens | ✅ tam | Renk/tipografi/spacing token'ları gerçek computed CSS'ten çıkarıldı |
| gorsel_analiz_vision | ✅ tam | 2/2 sayfa görsel olarak analiz edildi |

**Sayılar:** 2 sayfa gezildi · 2 sayfa görsel analiz · 9 teknoloji tespiti

### Dikkat edilmesi gerekenler
- Bilinen eksik yok; rapor tam kapsamlı üretildi.

