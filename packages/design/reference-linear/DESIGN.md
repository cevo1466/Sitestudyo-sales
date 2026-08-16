# DESIGN.md — Design-Only Reference

> SADECE TASARIM analizi  
> Oluşturulma: 2026-08-16 16:26  
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
| Kaynak domain | `linear.app` |
| Gezilen sayfa | 6 |
| Keşfedilen aday sayfa | 157 |
| Vision ile analiz edilen sayfa | 6 |
| Tespit edilen teknoloji | 5 |
| Analiz tarihi | 2026-08-16 16:26 |

## Teknoloji Yığını

| Teknoloji | Kategori | Güven | Kanıt |
|---|---:|---:|---|
| **Chart.js** | `chart_library` | 0.99 | `` |
| **Cloudflare** | `cdn_security` | 0.96 | `` |
| **Next.js** | `frontend_framework` | 0.99 | `` |
| **React** | `frontend_framework` | 0.99 | `` |
| **Vite** | `build_tool` | 0.93 | `` |

### Yığın Kararı

- **Ana yığın:** Next.js 1.0.0-beta.4 + React
- **Frontend:** Next.js 1.0.0-beta.4, React
- **Backend:** —
- **Platform / CMS:** —
- **Stil katmanı:** —

### Altyapı

| Alan | Tespit |
|---|---|
| server | cloudflare |


### Varlık Profili

- **Görsel formatları:** png ×9, woff2 ×6, svg ×2, jpg ×1
- **Modern format oranı (avif/webp/svg):** %17
- **Font kaynağı:** static.linear.app
- **Üçüncü parti host sayısı:** 0


## Kaydırma Deneyimi ve Hareket Yığını

Bu sitede özel bir kaydırma **kütüphanesi** tespit edilmedi; tarayıcının standart kaydırması kullanılıyor.

**Kaydırma modeli:** Tarayıcının kendi kaydırması (özel bir smooth-scroll katmanı yok)

**Sayfa uzunluğu:** ~29.67 ekran boyu

**Ekran görüntüsü yakalama:** `scrolled_full_page` × 2, `static_full_page` × 4

Sayfalar gerçek tekerlek olaylarıyla gezilerek toplam **0** gizli blok açığa çıkarıldı. Kaydırmadan alınan klasik bir screenshot bu blokları boş yakalardı.

**Ölçülen koreografi:**
- Sabitlenen (pin) bölüm: **0** (toplam 0 px)
- Parallaks katman: **0**
- Yatay kaydırma şeridi: **0**
- Kaydırmaya bağlı (scrub) sahne: **0**, bir kez tetiklenen: **2**

> Sahne sahne ölçümler, sitenin kendi `@keyframes`/`@font-face`/`:root` tanımları ve bölüm bölüm yeniden kurma reçetesi ZIP içindeki **`MOTION.md`**, **`REPLICATE.md`** ve **`site/`** klasöründe.


## Kalite ve Erişilebilirlik (ölçüm katmanı)

Bu bölüm ekran görüntüsü yorumu değil, sayfada çalıştırılan **ölçümlerin**
sonucudur. Aynı ölçüm katmanı "Yapay Zeka Belirtilerini Tara" modunu da besler.

**Yapay zeka izi skoru: 86.4/100** (Özgün ve tutarlı; belirgin şablon izi yok.) · 22/22 metrik ölçüldü

| Grup | Skor | Metrik |
|---|---:|---:|
| Renk & Efekt | 78.7 | 7 |
| İşçilik & Hiyerarşi | 84.5 | 3 |
| Görsel Dil | 85.7 | 2 |
| Düzen & Kompozisyon | 89.4 | 7 |
| Tipografi | 100.0 | 3 |

### Erişilebilirlik

- **677** / 1049 metin-zemin çifti WCAG AA eşiğinin altında (%64.5)
- **51** / 123 görselde alt metni yok (%41.5)

> Yeni tasarımı üretirken bu iki sayıyı **iyileştirmek** hedeftir; kaynak
> sitenin kontrast hatalarını taşıma.

### En düşük skorlu ölçümler

| Ölçüm | Bulunan | Hedef | Skor |
|---|---:|---:|---:|
| WCAG AA kontrast hatası | %52 | %2 | 0.0 |
| Baskın buton stili | %85 | %60 | 28.6 |
| Alt metni olmayan görsel | %34 | %10 | 57.2 |
| Farklı boşluk değeri sayısı | 20 adet | 14 adet | 72.7 |
| Bölüm ritmi tekdüzeliği | %65 | %55 | 74.3 |
| Yuvarlak rozet içinde yazı | 4 adet | 2 adet | 79.2 |
| Cam efekti (backdrop blur) | 2 adet | 1 adet | 88.9 |
| Boşluk grid uyumu (4px) | %84 | %88 | 89.0 |
| Yuvarlak köşe + gölge birlikteliği | %2 | %18 | 100.0 |
| Birebir aynı kart grupları | 0 adet | 2 adet | 100.0 |
| Ortalanmış metin oranı | %0 | %30 | 100.0 |
| Farklı yazı boyutu sayısı | 8 adet | 9 adet | 100.0 |


## Responsive Davranış (ölçülen)

Bu tablo **gerçekten ziyaret edilen** viewport'ların ölçümüdür. Önceki
sürümlerde bu bölümde sabit bir breakpoint listesi vardı ve tek bir masaüstü
viewport'tan üretilmesine rağmen ölçülmüş gibi sunuluyordu.

| Viewport | Baskın kolon | Gizlenen nav linki | Gövde puntosu | Yatay taşma |
|---|---:|---:|---:|---:|
| Mobil (390px) | 1 | %67 | 16px | 0 |
| Tablet (768px) | 1 | %67 | 16px | 0 |
| Masaüstü (1440px) | 1 | %22 | 16px | 0 |

**Sitenin CSS'inde beyan ettiği eşikler:** `768px` (13 kural), `640px` (12 kural), `1024px` (7 kural)

- Mobilde navigasyon linklerinin çoğu gizleniyor (hamburger menü deseni).


## Tasarım Token'ları

Bu bölüm screenshot tahmininden bağımsız olarak görünür DOM elemanlarının computed CSS değerlerinden çıkarılmıştır.

### Renk Token'ları

- `#f7f8f8` — örnek pay: 45%
- `#8a8f98` — örnek pay: 19%
- `#d0d6e0` — örnek pay: 16%
- `#62666d` — örnek pay: 9%
- `#08090a` — örnek pay: 4%
- `#ffffff` — örnek pay: 3%
- `#0f1011` — örnek pay: 1%
- `#828fff` — örnek pay: 1%
- `#1c1c1f` — örnek pay: 0%
- `#18191a` — örnek pay: 0%

### Tipografi Token'ları

- `Inter Variable` — örnek pay: 99%
- `Berkeley Mono` — örnek pay: 1%

**Sık görülen font boyutları:** `16px`, `13px`, `15px`, `17px`, `12px`, `13.3333px`, `14px`, `10px`, `24px`, `14.875px`

### Şekil / Radius

**Sık görülen border-radius değerleri:** `0px`, `9999px`, `5px`, `8px`, `6px`, `2px`, `4px`, `999px`

### Spacing / Border / Shadow

**Sık görülen spacing değerleri:** `8px`, `32px`, `5px`, `1px`, `16px`, `6px`, `12px`, `10px`, `24px`, `4px`

**Border width değerleri:** `1px`

**Shadow değerleri:** `rgba(0, 0, 0, 0.2) 0px 0px 0px 1px`, `rgba(0, 0, 0, 0.03) 0px 1.2px 0px 0px`, `rgba(0, 0, 0, 0.4) 0px 2px 4px 0px`, `rgba(0, 0, 0, 0.25) 0px 2px 32px 0px`


## Global Design System

Bu bölüm tek tek sayfa anlatımı değil, bütün crawl + Vision + computed CSS sinyallerinden çıkarılmış ortak tasarım dili specification'ıdır.

### 1. Visual Theme & Atmosphere

- **Tasarım dili:** derived from repeated color, typography, spacing, surface and section patterns across the crawled site
- **Marka karakteri:** infer as polished, consistent and system-led when token repetition is strong; adjust tone to the new brand
- **Görsel atmosfer:** use the observed density, whitespace and surface hierarchy rather than source content
- **Kullanıcı hissi:** predictable, coherent and easy to scan; preserve clarity over decorative noise
- **Temel prensipler:** reuse the extracted token proportions, keep hierarchy section-first and component-consistent, separate primary actions from neutral surfaces, preserve whitespace rhythm across pages, avoid source copy and exact composition

### 2. Color System

- **background** `#08090a` — kullanım oranı: 48%; kullan: page backgrounds, large quiet surfaces, negative space; kaçın: small text, critical actions without contrast checks; hover: tespit-edilemedi (öneri): temel renkten %6-10 koyu/açık bir durum türet; kontrastı uygulamada doğrula; active: tespit-edilemedi (öneri): temel renkten %10-14 daha güçlü bir durum türet; yeni renk ailesi katma
- **surface** `#ffffff` — kullanım oranı: 20%; kullan: cards, modals, inputs; kaçın: primary CTA if it blends into the page; hover: tespit-edilemedi (öneri): temel renkten %6-10 koyu/açık bir durum türet; kontrastı uygulamada doğrula; active: tespit-edilemedi (öneri): temel renkten %10-14 daha güçlü bir durum türet; yeni renk ailesi katma
- **text** `#f7f8f8` — kullanım oranı: 50%; kullan: primary reading text, headings when contrast is sufficient; kaçın: large filled surfaces, decorative backgrounds; hover: tespit-edilemedi (öneri): temel renkten %6-10 koyu/açık bir durum türet; kontrastı uygulamada doğrula; active: tespit-edilemedi (öneri): temel renkten %10-14 daha güçlü bir durum türet; yeni renk ailesi katma
- **muted_text** `#8a8f98` — kullanım oranı: 21%; kullan: helper text, metadata, secondary labels; kaçın: primary actions, long body copy at low contrast; hover: tespit-edilemedi (öneri): temel renkten %6-10 koyu/açık bir durum türet; kontrastı uygulamada doğrula; active: tespit-edilemedi (öneri): temel renkten %10-14 daha güçlü bir durum türet; yeni renk ailesi katma
- **border** `#f7f8f8` — kullanım oranı: 46%; kullan: separators, input outlines, card boundaries; kaçın: large text blocks, dominant brand moments; hover: tespit-edilemedi (öneri): temel renkten %6-10 koyu/açık bir durum türet; kontrastı uygulamada doğrula; active: tespit-edilemedi (öneri): temel renkten %10-14 daha güçlü bir durum türet; yeni renk ailesi katma
- **primary_action** `#5e6ad2` — kullanım oranı: 0%; kullan: main CTA, selected state, high-emphasis controls; kaçın: dense backgrounds, long reading surfaces; hover: tespit-edilemedi (öneri): temel renkten %6-10 koyu/açık bir durum türet; kontrastı uygulamada doğrula; active: tespit-edilemedi (öneri): temel renkten %10-14 daha güçlü bir durum türet; yeni renk ailesi katma
- **accent** `#ffffff` — kullanım oranı: 3%; kullan: badges, focus cues, small visual anchors; kaçın: body copy, large page backgrounds; hover: tespit-edilemedi (öneri): temel renkten %6-10 koyu/açık bir durum türet; kontrastı uygulamada doğrula; active: tespit-edilemedi (öneri): temel renkten %10-14 daha güçlü bir durum türet; yeni renk ailesi katma
- **success** `tespit-edilemedi` — kullanım oranı: 0%; kullan: ; kaçın: ; hover: None; active: None
- **warning** `#eb5757` — kullanım oranı: 0%; kullan: supporting UI role; kaçın: unrelated semantic roles; hover: tespit-edilemedi (öneri): temel renkten %6-10 koyu/açık bir durum türet; kontrastı uygulamada doğrula; active: tespit-edilemedi (öneri): temel renkten %10-14 daha güçlü bir durum türet; yeni renk ailesi katma
- **error** `#eb5757` — kullanım oranı: 0%; kullan: supporting UI role; kaçın: unrelated semantic roles; hover: tespit-edilemedi (öneri): temel renkten %6-10 koyu/açık bir durum türet; kontrastı uygulamada doğrula; active: tespit-edilemedi (öneri): temel renkten %10-14 daha güçlü bir durum türet; yeni renk ailesi katma

Semantic feedback renkleri: success `tespit-edilemedi`, warning `#eb5757`, error `#eb5757`.

### 3. Typography System

**Font family:** `Inter Variable`

- **display** — size `64px`, weight `510`, line-height `64px`, letter-spacing `-0.165px`; amaç: largest brand/hero statement only
- **h1** — size `64px`, weight `510`, line-height `64px`, letter-spacing `-0.165px`; amaç: page-level heading
- **h2** — size `20px`, weight `590`, line-height `26.6px`, letter-spacing `-0.165px`; amaç: major section heading
- **h3** — size `16px`, weight `400`, line-height `24px`, letter-spacing `-0.165px`; amaç: card or subsection heading
- **body** — size `16px`, weight `400`, line-height `24px`, letter-spacing `-0.165px`; amaç: primary reading and descriptions
- **small** — size `13px`, weight `400`, line-height `19.5px`, letter-spacing `-0.165px`; amaç: secondary descriptions and compact UI
- **caption** — size `15px`, weight `400`, line-height `24px`, letter-spacing `-0.165px`; amaç: metadata, helper text and annotations
- **button** — size `16px`, weight `400`, line-height `24px`, letter-spacing `-0.165px`; amaç: interactive commands
- **label** — size `13px`, weight `400`, line-height `19.5px`, letter-spacing `-0.165px`; amaç: form labels and UI descriptors

### 4. Component Library

- **Primary Button** — `{"name": "Primary Button", "background": "#5e6ad2", "text": "#ffffff", "radius": "0px", "padding": "8px 32px", "height": "44-52px", "hover": "tespit-edilemedi (öneri): kontrastı hafifçe artır, renk ailesini koru", "active": "tespit-edilemedi (öneri): daha koyu/güçlü dolguyla görsel olarak sıkıştır", "disabled": "reduce opacity to 45-55%, keep geometry unchanged, remove elevation", "shadow": "rgba(0, 0, 0, 0.2) 0px 0px 0px 1px", "border": "transparent or same-color border", "contrast_ratio": 4.7}`
- **Secondary Button** — `{"name": "Secondary Button", "background": "#08090a", "text": "#f7f8f8", "radius": "0px", "padding": "8px 32px", "height": "42-50px", "hover": "tespit-edilemedi (öneri): #ffffff ya da düşük kontrastlı bir ton kullan", "active": "tespit-edilemedi (öneri): kenarlık kontrastını artır, yüzey parlaklığını azalt", "disabled": "reduce opacity to 45-55%, keep geometry unchanged, remove elevation", "shadow": "none or lower than primary surfaces", "border": "1px solid current palette border"}`
- **Cards** — `{"name": "Cards", "background": "#08090a", "text": "#f7f8f8", "radius": "0px", "padding": "32px", "height": "content-defined; preserve consistent vertical rhythm", "hover": "tespit-edilemedi (öneri): kenarlık kontrastını ya da yüksekliği hafif artır; boyut değiştirme", "active": "tespit-edilemedi (öneri): yüzeyi sabit tut; seçili durumu kenarlık/aksan ile göster", "disabled": "reduce opacity to 45-55%, keep geometry unchanged, remove elevation", "shadow": "rgba(0, 0, 0, 0.2) 0px 0px 0px 1px", "border": "1px solid low-contrast border"}`
- **Pricing Cards** — `{"status": "not-observed", "note": "Bu sitede 'pricing_cards' pattern'ine dair DOM kaniti bulunamadi; spec uretilmedi. Ihtiyacin varsa mevcut token'lardan turet."}`
- **Hero** — `{"status": "not-observed", "note": "Bu sitede 'hero' pattern'ine dair DOM kaniti bulunamadi; spec uretilmedi. Ihtiyacin varsa mevcut token'lardan turet."}`
- **Navigation** — `{"layout": "horizontal on desktop, collapsed/stacked on mobile", "height": "64-88px desktop, 56-72px mobile", "background": "#08090a", "border": "1px bottom separator when needed", "item_style": "16px text with compact spacing and clear active state"}`
- **Footer** — `{"layout": "multi-column or compact grouped links", "background": "#f7f8f8", "text": "#08090a", "spacing": "large top/bottom padding with tighter internal link rhythm"}`
- **Inputs** — `{"name": "Inputs", "background": "#08090a", "text": "#f7f8f8", "radius": "0px", "padding": "8px 32px", "height": "42-48px", "hover": "tespit-edilemedi (öneri): kenarlık kontrastını artır", "active": "tespit-edilemedi (öneri): aksan/birincil token ile net bir odak halkası göster", "disabled": "reduce opacity to 45-55%, keep geometry unchanged, remove elevation", "shadow": "none", "border": "1px solid low-contrast border"}`
- **Search** — `{"status": "not-observed", "note": "Bu sitede 'search' pattern'ine dair DOM kaniti bulunamadi; spec uretilmedi. Ihtiyacin varsa mevcut token'lardan turet."}`
- **Dropdown** — `{"status": "not-observed", "note": "Bu sitede 'dropdown' pattern'ine dair DOM kaniti bulunamadi; spec uretilmedi. Ihtiyacin varsa mevcut token'lardan turet."}`
- **Tabs** — `{"background": "#ffffff", "active_background": "#08090a", "text": "#f7f8f8", "radius": "0px", "spacing": "8px", "border": "1px solid low-contrast border or underline"}`
- **Badges** — `{"background": "#ffffff", "text": "#f7f8f8", "radius": "smaller than cards; pill only if observed radius supports it", "padding": "4-8px vertical, 8-12px horizontal", "border": "1px solid subtle border"}`
- **Alerts** — `{"status": "not-observed", "note": "Bu sitede 'alerts' pattern'ine dair DOM kaniti bulunamadi; spec uretilmedi. Ihtiyacin varsa mevcut token'lardan turet."}`
- **Modal** — `{"status": "not-observed", "note": "Bu sitede 'modal' pattern'ine dair DOM kaniti bulunamadi; spec uretilmedi. Ihtiyacin varsa mevcut token'lardan turet."}`
- **Accordion** — `{"status": "not-observed", "note": "Bu sitede 'accordion' pattern'ine dair DOM kaniti bulunamadi; spec uretilmedi. Ihtiyacin varsa mevcut token'lardan turet."}`
- **Faq** — `{"status": "not-observed", "note": "Bu sitede 'faq' pattern'ine dair DOM kaniti bulunamadi; spec uretilmedi. Ihtiyacin varsa mevcut token'lardan turet."}`
- **Pricing Table** — `{"status": "not-observed", "note": "Bu sitede 'pricing_table' pattern'ine dair DOM kaniti bulunamadi; spec uretilmedi. Ihtiyacin varsa mevcut token'lardan turet."}`
- **Cta Banner** — `{"status": "not-observed", "note": "Bu sitede 'cta_banner' pattern'ine dair DOM kaniti bulunamadi; spec uretilmedi. Ihtiyacin varsa mevcut token'lardan turet."}`
- **Feature Card** — `{"name": "Feature Card", "background": "#08090a", "text": "#f7f8f8", "radius": "0px", "padding": "32px", "height": "content-defined; preserve consistent vertical rhythm", "hover": "tespit-edilemedi (öneri): kenarlık kontrastını ya da yüksekliği hafif artır; boyut değiştirme", "active": "tespit-edilemedi (öneri): yüzeyi sabit tut; seçili durumu kenarlık/aksan ile göster", "disabled": "reduce opacity to 45-55%, keep geometry unchanged, remove elevation", "shadow": "rgba(0, 0, 0, 0.2) 0px 0px 0px 1px", "border": "1px solid low-contrast border"}`
- **Product Card** — `{"name": "Product Card", "background": "#08090a", "text": "#f7f8f8", "radius": "0px", "padding": "32px", "height": "image/media area plus text/action stack", "hover": "tespit-edilemedi (öneri): kenarlık kontrastını ya da yüksekliği hafif artır; boyut değiştirme", "active": "tespit-edilemedi (öneri): yüzeyi sabit tut; seçili durumu kenarlık/aksan ile göster", "disabled": "reduce opacity to 45-55%, keep geometry unchanged, remove elevation", "shadow": "rgba(0, 0, 0, 0.2) 0px 0px 0px 1px", "border": "1px solid low-contrast border"}`

### 5. Layout System

- **Grid:** use observed grid/flex rhythm from component-patterns; choose responsive columns by content density
- **Max width:** 640px, 400px, 320px, 600px, 280px, 1280px, 1440px, 360px
- **Breakpoints:** {"status": "tespit-edilemedi", "note": "Breakpoint tespiti icin cok-viewport tarama gerekir."}
- **Section spacing:** 8px, 32px, 5px, 1px, 16px, 6px
- **Component spacing:** 1px, 16px, 6px, 12px, 10px, 24px, 4px
- **Container padding:** 8px, 32px, 5px, 1px
- **White-space philosophy:** let sections breathe; use denser rhythm only inside forms, tables and repeated cards
- **Visual rhythm:** dominant sections: content, generic-block, footer, card-grid, gallery, hero, form

### 6. Elevation System

- **Shadow scale:** rgba(0, 0, 0, 0.2) 0px 0px 0px 1px, rgba(0, 0, 0, 0.03) 0px 1.2px 0px 0px, rgba(0, 0, 0, 0.4) 0px 2px 4px 0px, rgba(0, 0, 0, 0.25) 0px 2px 32px 0px, rgba(255, 255, 255, 0.08) 0px 0px 0px 0.5px inset, rgba(0, 0, 0, 0.06) 0px 4px 4px -1px, rgba(0, 0, 0, 0.12) 0px 1px 1px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgb(62, 62, 68) 0px 0px 0px 1px, rgba(0, 0, 0, 0) 0px 8px 2px 0px, rgba(0, 0, 0, 0.01) 0px 5px 2px 0px, rgba(0, 0, 0, 0.04) 0px 3px 2px 0px, rgba(0, 0, 0, 0.07) 0px 1px 1px 0px, rgba(0, 0, 0, 0
- **Border hierarchy:** 1px
- **Radius hierarchy:** 0px, 9999px, 5px, 8px, 6px, 2px, 4px, 999px
- **Surface hierarchy:** page background, surface/card, raised/modal, primary action

### 7. Motion Language

- **Hover davranışı:** infer through component states: subtle color, border or elevation change; avoid layout shift
- **Transition süreleri:** 0.1s, 0.25s, 0.16s, 0.4s, 0.12s, 0.2s
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
| 1 | `form` | `grid-or-repeated` | `spacious` | 72px | 10332px | 11 | 8 | 5 | 95% | dom |
| 2 | `content` | `stacked` | `spacious` | 272px | 185px | 1 | 1 | 1 | 80% | dom |
| 3 | `generic-block` | `stacked` | `spacious` | 535px | 704px | 0 | 0 | 0 | 54% | dom |
| 4 | `card-grid` | `grid-or-repeated` | `spacious` | 580px | 612px | 2 | 6 | 6 | 95% | dom |
| 5 | `content` | `grid-2col` | `spacious` | 2609px | 250px | 1 | 1 | 2 | 84% | dom |
| 6 | `gallery` | `stacked` | `spacious` | 2859px | 626px | 0 | 8 | 1 | 68% | dom |
| 7 | `content` | `grid-2col` | `spacious` | 3843px | 250px | 1 | 1 | 2 | 84% | dom |
| 8 | `content` | `grid-2col` | `spacious` | 5070px | 250px | 1 | 1 | 2 | 84% | dom |
| 9 | `content` | `grid-2col` | `spacious` | 6252px | 250px | 1 | 1 | 2 | 84% | dom |
| 10 | `content` | `grid-2col` | `spacious` | 7352px | 250px | 1 | 1 | 2 | 84% | dom |
| 11 | `generic-block` | `stacked` | `spacious` | 7602px | 598px | 0 | 0 | 1 | 54% | dom |
| 12 | `content` | `stacked` | `spacious` | 8582px | 422px | 1 | 5 | 2 | 92% | dom |
| 13 | `content` | `flex-column` | `spacious` | 9952px | 228px | 1 | 2 | 1 | 72% | dom |
| 14 | `footer` | `grid-multi` | `spacious` | 10405px | 493px | 5 | 8 | 5 | 92% | dom |
| 15 | `generic-block` | `stacked` | `spacious` | 272px | 176px | 1 | 0 | 1 | 72% | dom |
| 16 | `generic-block` | `grid-2col` | `spacious` | 1404px | 408px | 1 | 0 | 1 | 64% | dom |
| 17 | `generic-block` | `grid-2col` | `spacious` | 2069px | 169px | 1 | 1 | 1 | 72% | dom |
| 18 | `content` | `grid-2col` | `spacious` | 4757px | 958px | 1 | 2 | 1 | 72% | dom |
| 19 | `footer` | `grid-multi` | `spacious` | 6520px | 493px | 5 | 8 | 5 | 92% | dom |
| 20 | `hero` | `flex-column` | `spacious` | 200px | 328px | 1 | 1 | 3 | 95% | dom |
| 21 | `card-grid` | `grid-multi` | `balanced` | 627px | 560px | 0 | 0 | 35 | 80% | dom |
| 22 | `generic-block` | `grid-2col` | `spacious` | 1486px | 179px | 1 | 0 | 2 | 76% | dom |
| 23 | `content` | `flex-column` | `spacious` | 1666px | 597px | 1 | 0 | 1 | 60% | dom |
| 24 | `content` | `flex-column` | `spacious` | 2263px | 596px | 1 | 0 | 1 | 60% | dom |
| 25 | `content` | `grid-2col` | `spacious` | 3116px | 250px | 1 | 1 | 2 | 84% | dom |
| 26 | `content` | `stacked` | `spacious` | 3366px | 605px | 1 | 0 | 1 | 68% | dom |
| 27 | `generic-block` | `flex-column` | `spacious` | 4747px | 184px | 1 | 2 | 2 | 94% | dom |
| 28 | `generic-block` | `stacked` | `spacious` | 4819px | 453px | 0 | 0 | 0 | 50% | dom |
| 29 | `footer` | `grid-multi` | `spacious` | 5535px | 493px | 5 | 8 | 5 | 92% | dom |
| 30 | `gallery` | `stacked` | `spacious` | 72px | 6226px | 27 | 8 | 1 | 78% | dom |
| 31 | `card-grid` | `grid-or-repeated` | `spacious` | 149px | 5925px | 27 | 8 | 14 | 95% | dom |
| 32 | `hero` | `grid-multi` | `spacious` | 290px | 872px | 6 | 6 | 6 | 95% | dom |
| 33 | `content` | `stacked` | `spacious` | 1292px | 422px | 1 | 5 | 2 | 92% | dom |
| 34 | `card-grid` | `grid-multi` | `spacious` | 1834px | 872px | 6 | 6 | 6 | 95% | dom |
| 35 | `card-grid` | `grid-multi` | `spacious` | 2977px | 302px | 4 | 4 | 4 | 95% | dom |
| 36 | `card-grid` | `grid-multi` | `spacious` | 3514px | 872px | 6 | 6 | 6 | 95% | dom |
| 37 | `content` | `flex-column` | `spacious` | 5846px | 228px | 1 | 2 | 1 | 72% | dom |
| 38 | `footer` | `grid-multi` | `spacious` | 6299px | 502px | 5 | 8 | 5 | 92% | dom |
| 39 | `generic-block` | `stacked` | `spacious` | 272px | 177px | 1 | 1 | 1 | 80% | dom |
| 40 | `content` | `grid-2col` | `spacious` | 1358px | 433px | 1 | 1 | 1 | 72% | dom |
| 41 | `content` | `stacked` | `spacious` | 2378px | 1037px | 1 | 0 | 1 | 72% | dom |
| 42 | `footer` | `stacked` | `spacious` | 3543px | 3461px | 1 | 8 | 1 | 80% | dom |
| 43 | `footer` | `grid-multi` | `spacious` | 7005px | 493px | 5 | 8 | 5 | 92% | dom |
| 44 | `gallery` | `stacked` | `spacious` | 149px | 26049px | 36 | 8 | 2 | 95% | dom |
| 45 | `hero` | `stacked` | `spacious` | 347px | 1454px | 2 | 8 | 1 | 68% | dom |
| 46 | `content` | `stacked` | `spacious` | 431px | 1298px | 1 | 7 | 0 | 82% | dom |
| 47 | `content` | `stacked` | `spacious` | 1801px | 3377px | 5 | 8 | 1 | 74% | dom |
| 48 | `content` | `stacked` | `spacious` | 1869px | 3237px | 4 | 8 | 0 | 88% | dom |
| 49 | `content` | `stacked` | `spacious` | 1869px | 3309px | 4 | 8 | 1 | 74% | dom |
| 50 | `content` | `stacked` | `spacious` | 5178px | 1701px | 2 | 8 | 1 | 74% | dom |
| 51 | `content` | `stacked` | `spacious` | 5262px | 1545px | 1 | 7 | 0 | 88% | dom |
| 52 | `content` | `stacked` | `spacious` | 6878px | 1788px | 1 | 8 | 1 | 68% | dom |
| 53 | `content` | `stacked` | `spacious` | 8666px | 1861px | 3 | 8 | 1 | 68% | dom |
| 54 | `content` | `stacked` | `spacious` | 8750px | 1705px | 2 | 8 | 0 | 82% | dom |
| 55 | `content` | `stacked` | `spacious` | 8750px | 1777px | 2 | 8 | 1 | 68% | dom |
| 56 | `content` | `stacked` | `spacious` | 10527px | 3215px | 6 | 8 | 1 | 68% | dom |
| 57 | `content` | `stacked` | `spacious` | 10595px | 3075px | 5 | 8 | 0 | 82% | dom |
| 58 | `content` | `stacked` | `spacious` | 10595px | 3147px | 5 | 8 | 1 | 68% | dom |
| 59 | `content` | `stacked` | `spacious` | 13742px | 2840px | 4 | 8 | 1 | 74% | dom |
| 60 | `content` | `stacked` | `spacious` | 13810px | 2700px | 3 | 8 | 0 | 88% | dom |
| 61 | `content` | `stacked` | `spacious` | 13810px | 2772px | 3 | 8 | 1 | 74% | dom |
| 62 | `content` | `stacked` | `spacious` | 16582px | 1541px | 3 | 8 | 1 | 68% | dom |
| 63 | `content` | `stacked` | `spacious` | 16666px | 1385px | 2 | 8 | 0 | 82% | dom |
| 64 | `content` | `stacked` | `spacious` | 16666px | 1457px | 2 | 8 | 1 | 68% | dom |
| 65 | `content` | `stacked` | `spacious` | 18123px | 3877px | 4 | 8 | 1 | 74% | dom |
| 66 | `content` | `stacked` | `spacious` | 18191px | 3737px | 3 | 8 | 0 | 88% | dom |
| 67 | `content` | `stacked` | `spacious` | 18191px | 3809px | 3 | 8 | 1 | 74% | dom |
| 68 | `content` | `stacked` | `spacious` | 22000px | 3989px | 5 | 8 | 1 | 74% | dom |
| 69 | `content` | `stacked` | `spacious` | 22084px | 3833px | 4 | 8 | 0 | 88% | dom |
| 70 | `content` | `stacked` | `spacious` | 22084px | 3905px | 4 | 8 | 1 | 74% | dom |
| 71 | `footer` | `stacked` | `spacious` | 25746px | 1603px | 0 | 0 | 1 | 50% | dom |
| 72 | `footer` | `grid-multi` | `spacious` | 26199px | 502px | 5 | 8 | 5 | 92% | dom |

## Sayfa Envanteri

| # | Sayfa tipi | Screenshot | CSS Örnek |
|---|---|---|---|
| 1 | `home` | `001_https___linear_app_.png` | 900 visible element |
| 2 | `inner-page` | `002_https___linear_app_about.png` | 661 visible element |
| 3 | `inner-page` | `003_https___linear_app_agents.png` | 900 visible element |
| 4 | `content-index` | `004_https___linear_app_blog.png` | 591 visible element |
| 5 | `inner-page` | `005_https___linear_app_careers.png` | 558 visible element |
| 6 | `inner-page` | `006_https___linear_app_changelog.png` | 900 visible element |

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
| `badge-or-tag` | `llRoCw` | 16x | `SPAN` | `0px` | `0px 0px 0px 0px` | `12px` | `rgba(0, 0, 0, 0)` |
| `button` | `M1bpsa_navItem` | 13x | `BUTTON` | `6px` | `0px 6px 0px 6px` | `13px` | `rgba(0, 0, 0, 0)` |
| `card` | `SPbJba_grain` | 11x | `DIV` | `12px` | `0px 0px 0px 0px` | `16px` | `rgba(0, 0, 0, 0)` |
| `list-item` | `TZTsQG_item` | 9x | `LI` | `0px` | `0px 0px 0px 0px` | `16px` | `rgba(0, 0, 0, 0)` |
| `badge-or-tag` | `cGuDyM` | 9x | `SPAN` | `0px` | `0px 0px 0px 0px` | `12px` | `rgba(0, 0, 0, 0)` |
| `badge-or-tag` | `MR81zG_item` | 8x | `LI` | `0px` | `0px 0px 0px 0px` | `16px` | `rgba(0, 0, 0, 0)` |
| `button` | `TZTsQG_anchor` | 7x | `BUTTON` | `9999px` | `0px 12px 0px 12px` | `13px` | `rgba(0, 0, 0, 0)` |
| `input-group` | `-B0yXq_root` | 7x | `DIV` | `0px` | `0px 0px 0px 0px` | `16px` | `rgba(0, 0, 0, 0)` |
| `card` | `SPbJba_grainSubtle` | 6x | `DIV` | `12px 12px 0px 0px` | `0px 0px 0px 0px` | `16px` | `rgba(0, 0, 0, 0)` |
| `card` | `w9ZFkq_staggerItem` | 5x | `SPAN` | `0px` | `0px 0px 0px 0px` | `16px` | `rgba(0, 0, 0, 0)` |
| `nav-item` | `S36ykG_size-small` | 4x | `A` | `9999px` | `0px 12px 0px 12px` | `13px` | `rgba(0, 0, 0, 0)` |
| `badge-or-tag` | `dRPErG` | 4x | `SPAN` | `0px` | `0px 0px 0px 0px` | `12px` | `rgba(0, 0, 0, 0)` |
| `badge-or-tag` | `hide-desktop` | 4x | `DIV` | `0px` | `0px 0px 0px 0px` | `16px` | `rgba(0, 0, 0, 0)` |
| `card` | `ImRUSq_column` | 24x | `DIV` | `0px` | `0px 32px 0px 32px` | `16px` | `rgba(0, 0, 0, 0)` |
| `list-item` | `TZTsQG_item` | 9x | `LI` | `0px` | `0px 0px 0px 0px` | `16px` | `rgba(0, 0, 0, 0)` |

## Vision ↔ Computed CSS Uzlaştırması

**Genel uyum:** güçlü-uyum (%99)

| Boyut | Uyum | Kontrol edilen |
|---|---:|---:|
| Renk | %98 | 46 |
| Tipografi | %100 | 25 |

Çelişkilerde **computed CSS esastır** — vision ekran görüntüsünden tahmin eder, computed CSS ölçer.

- Çelişki bulunamadı.

## Sayfa Sayfa Görsel Analiz

### Görsel analiz — `product (URL tahmini: home)`

**Screenshot:** `001_https___linear_app_.png` · **Güven:** 0.95 · **Doğrulama:** 8/9 renk computed CSS ile doğrulandı

- **Görsel ton:** dark-mode dominant, developer-oriented, minimal, tech-noir, high-contrast, editorial-rhythm, precision-tool aesthetic
- **Yapı:** single-column full-width page with alternating full-bleed sections; nav pinned top, hero block, repeating feature rows (alternating left/right media placement), card grids, quote strips, multi-column footer
- **Yoğunluk:** spacious · **Grid:** constrained center column (~max-width ~1200–1280) flanked by generous gutters; internal feature rows split ~50/50 between text and product screenshot
- **Gözlenen componentler:** top navigation, hero, product mockup card, feature row (alternating), three-up value card row, logo strip, diff / code preview, testimonial card

**Surface & atmosphere.** The page lives almost entirely on a single near-black neutral surface (ilgili bölüm), warmed just off pure black so that the foreground feels lit rather than crushed. All copy and chrome sit on this one plane — there is no layered background gradient, no decorative texture. The discipline is ilgili bölüm

**Color logic.** A minimal token set carries the whole experience:
- One **primary accent** in the indigo family (ilgili bölüm) reserved for CTAs, links, and brand punctuation.
- One **secondary accent** in violet (ilgili bölüm) used sparingly for decorative fills.
- A **semantic red** (ilgili bölüm) that doubles as a diff-marker color, semantically tied to ilgili bölüm
- A **saturated yellow** appears as a deliberate tonal shock only inside testimonial blocks — it is the only chromatic exception and functions as a pause between long dark sections.
- Muted grays (ilgili bölüm, ilgili bölüm) handle all secondary hierarchy without introducing a second hue.

**Typography system.** A duo-type stack does all the work: a geometric sans (Inter Variable) for everything human-readable, and a distinctive monospaced face (Berkeley Mono) for code/data surfaces. Hierarchy is achieved through a wide modular scale — a single oversized display weight at the top (around the 60–70px band) that collapses quickly into 13–16px body sizes. No decorative weights are stacked; the system reads as one voice.

**Layout grammar.** The page is one vertical scroll composed of full-bleed bands:
1. Thin quiet navigation
2. Hero with oversized headline + product surface
3. Repeating **alternating feature rows** (text left / media right, then swapped) — this zigzag is the structural signature.
4. A **three-up value card row** under a wide header.
5. A monochrome **logo strip** as social-proof punctuation.
6. Two more alternating rows including a **diff preview** that visibly demonstrates the product.
7. A **two-tile testimonial band** introducing the yellow accent.
8. A **dense changelog-style feed row** at the bottom.
9. A multi-column footer.

Vertical rhythm is generous — each band breathes ~80–120px of internal padding — producing a ilgili bölüm density despite heavy information.

**Component language.**
- **Buttons/avatars/tags** are full-pill (ilgili bölüm).
- **Cards and surfaces** use a small radius (ilgili bölüm) with a 1px low-contrast border plus a soft layered shadow for elevation.
- **Product mockup cards** dominate the page — the page is essentially a portfolio of itself; every feature is proven by embedding a real UI screenshot rather than abstract illustration.
- **Code/diff panels** use the mono font with semantic line colors, presenting the product's own surface as marketing material.
- **Testimonial cards** act as color-filled editorial breaks; their fills are the only large color fields on the page.

**Cross-reference health.** The computed CSS aligns tightly with the visual: text and background tokens match exactly, the indigo/violet/red accents map 1:1 to visible usage, and the dual-type stack is confirmed. The yellow testimonial fill is the only element not present in the top-5 background token list — it is likely a separate variant token and is treated here as an inference with reduced confidence.

**Abstract design principles worth carrying forward.**
1. Build on one dark surface; never decorate the background.
2. Restrict the palette to one brand accent + one semantic pair — let whitespace carry hierarchy.
3. Use a two-type system: one confident sans for UI, one distinctive mono for data surfaces.
4. Prove features by showing the real product inside the marketing page.
5. Alternate left/right media placement row-by-row to generate rhythm without ornament.
6. Use a two-tier radius scale (pill for interactive, small for surfaces).
7. Reserve one unexpected saturated color for editorial breaks — never use it inside the core product chrome.
8. Keep navigation visually quiet so product surfaces own attention.


---

### Görsel analiz — `inner-page`

**Screenshot:** `002_https___linear_app_about.png` · **Güven:** 0.99 · **Doğrulama:** renk tespiti yok

- **Görsel ton:** —
- **Yapı:** —
- **Yoğunluk:** — · **Grid:** —
- **Gözlenen componentler:** —

**Genel karakter**

Sayfa, neredeyse saf siyah (#08090a) bir zemin üzerinde tek bir soğuk-mavi/mor aksan rengiyle (#5e6ad2) çalışan, yüksek kontrastlı, editorial bir karanlık temadır. Tek bir yazı ailesi (Inter Variable) tüm hiyerarşiyi boyut ve ağırlıkla çözmektedir; renk yalnızca eylem ve marka işareti için kullanılır. Ton: sade, profesyonel, ferah ama bilgi-yoğun.

**Tipografi sistemi**

- Tek aile, geniş ağırlık skalası; dekoratif serif/mono kullanımı yok.
- Display ~64px, section ~48px, sub ~24px, gövde 15–16px, navigasyon 13–14px, caption 12–13px.
- Başlıklar orta-ağır (medium/semibold), gövde düzenli (regular); geniş satır yüksekliği ve sıkı satır aralığı.
- Hiyerarşi, boyut + ağırlık + boşluk üçlüsüyle kurulur; renk hiyerarşide pasiftir.

**Layout prensipleri**

- Sayfa, dikey istiflenen tam-genişlik bölümlerden oluşur; her bölüm çok geniş dış padding (~128px) ile nefes alır.
- Metin bölümleri asimetrik 2 sütun: yaklaşık 1/3 başlık + 2/3 gövde. Bu oran editorial bir ritim yaratır.
- Portreler 4 sütun, isim listeleri 6+ sütun yoğun liste, yatırımcı logoları 2 sütun kart.
- Grid içi boşluklar dar (8–24px), bölümler arası boşluk geniştir — bu kontrast sayfanın en güçlü tasarım imzasıdır.

**Bileşen notları**

- **Navigasyon**: sol logo, ortada düşük-kontrast bağlantılar, sağda filled pill biçiminde primary CTA. CTA tam yuvarlak (radius 9999), accent dolu, beyaz yazı.
- **Medya çerçevesi**: büyük 16:9-ish oran, küçük iç radius (~6–8px), yumuşak gölge, oynatma UI'ı gömülü. Köşeler ve çerçeve minimal; ağırlık medya içeriğindedir.
- **Editorial split**: tek satırlık oversized başlık + sağda 2–3 satır gövde; sütunlar arası büyük boşluk.
- **Portre gridi**: 1:1 kare monochrome kareler, altında iki-satır caption (kalın isim, açık rol).
- **İsim listesi**: 6+ sütun düz metin grid, çok küçük punto, ince ayrım çizgileri; kart yerine düz metin tercih edilerek yoğunluk kontrol altında tutulur.
- **Logo kart**: koyu zeminde açık yüzeyli (#e5e5e6) yuvarlatılmış kart (~8px), içeride inverted logo lockup. Renk inversiyonu vurgu için yeterlidir.
- **Footer**: 5 sütun kompakt link grid'i, çok küçük etiketler, bölüm ayracı yok; tipografik hizalama yapıyı taşır.

**Görsellik**

İnsan odaklı editorial fotoğrafçılık: monochrome, doğal ışık, candid portreler; bunlar sıkı bir gridde tek tip kırpılır. Ürün UI'ı arka planda kontekst sağlar. Logolar inverted lockup olarak kullanılır, fotoğraf+tipografi dışında dekoratif öğe yoktur.

**CSS doğrulama notları**

Computed CSS renkleri, yazı ailesi, boyut skalası ve padding değerleri görselle tam uyumlu: karanlık zemin + hafif yükseltilmiş panel + tek aksan, tek Inter ailesi, 128px bölüm nefesi, 9999px CTA radius'u. Görsel tahminle çelişen herhangi bir token yok; tüm değerler doğrudan computed CSS ile doğrulanmıştır.

**Tasarım ilhamı (kısa)**

- Tek tipografi ailesi + tek aksan rengi + karanlık zemin → minimalizmi marka diline çevir.
- Asimetrik 2 sütun editorial split + büyük bölüm padding → ilgili bölüm bilinçli bir araçtır.
- Sıkı grid içi, geniş grid dışı → yoğunluk/ferahlık kontrastı sayfanın imzasıdır.
- Yalnızca eylem için kullanılan pill CTA; geri kalan her şey yazıdır.
- Uzun listeleri kart yerine düz metin grid'i olarak sun — tasarım disiplini yoğunluktan doğar.


---

### Görsel analiz — `product (URL tahmini: inner-page)`

**Screenshot:** `003_https___linear_app_agents.png` · **Güven:** 0.92 · **Doğrulama:** 9/9 renk computed CSS ile doğrulandı

- **Görsel ton:** dark-mode-default, minimal-monochrome, high-contrast-typography, subtle-accent-saturation, engineering-premium, generous-negative-space
- **Yapı:** single-column narrative with alternating 2-column feature bands, capped by a 3-up product mockup row and a 4-up icon grid
- **Yoğunluk:** spacious · **Grid:** container ~1200-1280px; 3-col mockup grid (equal width), 2-col 50/50 feature bands, 4-col icon matrix
- **Gözlenen componentler:** top-nav, hero-block, product-mockup-card, suggestion-chip, feature-band, highlight-card, log-row, icon-feature-card

**Overall Direction**
A dark-default, monochrome-leaning product page that communicates entirely through typography hierarchy, in-app UI mockups, and a single restrained accent. The composition is calm and editorial, with photography deliberately absent — every visual ilgili bölüm is made through artifact (a chat preview, a log row, a status pill) rather than illustration.

**Color System**
A two-step dark substrate separates the page (ilgili bölüm canvas, ilgili bölüm recessed panels). Text is built on a four-step cool-gray ladder descending from near-white (ilgili bölüm) through three muted stops (ilgili bölüm, ilgili bölüm, ilgili bölüm) — never a warm gray, never pure black. The single accent sits at ilgili bölüm (mid blue-violet) and is rationed to roughly one occurrence per fold: a status dot, a primary CTA, a faint gradient panel. Hairline borders read as desaturated white at low opacity, never chroma-tinted.

**Typography**
Inter Variable carries the entire system. The display tier reaches ~72px with measured tracking and a two-line break that itself becomes rhythmic structure. Body sits at 15-17px with comfortable line-height; nav, button, and caption share a 13-14px compact band. Weights skew medium over bold — confidence is signaled by size and luminance, not weight jumps. No secondary face, no serif, no mono is needed.

**Spatial System**
A max-width container (~1200-1280px) anchors the page; vertical rhythm between sections runs ~96-160px, giving every block room to breathe. Inside cards, padding clusters around 14-24px with 16-24px gaps between siblings. The result reads as ilgili bölüm without being airy — the density is controlled by negative space rather than by content stacking.

**Layout Pattern**
The page reads top-to-bottom as: anchor nav → centered hero → 3-up product mockup grid → alternating 2-column feature bands (text↔visual) → 2-column intro block → 4-column icon capability matrix → centered CTA → 5-column utility footer. The 2-column alternation is the strongest structural device — it converts a long-scroll narrative into scannable, mirrorable pairs.

**Components**
- *Mockup cards*: dark surface, 1px hairline, 8-12px radius, faint shadow, simulated app chrome. One variant uses a soft purple-pink gradient tint as the only chromatic surface.
- *CTA pill*: 999px radius; primary inverts to white fill on dark, secondary appears as ghost outline.
- *Suggestion chips*: tiny rounded pills with leading dot — used inside chat mockups.
- *Highlight cards*: 12px radius, 14px padding, faint elevation; host icons, status rows, or log-style entries.
- *Icon feature cells*: monoline outlined glyph + 1-line label + 1-line description, rendered 4-up across two rows.
- *Footer*: 5-column link matrix at low contrast, kept utility-grade.

**Elevation & Edge Language**
The system refuses heavy borders. Elevation is communicated by (a) 1-pixel hairlines, (b) very soft multi-stop shadows, and (c) a 2-3 step surface ladder. Radius is tightly controlled: 5 for chips, 8-12 for cards, 999 for pills — that's the whole vocabulary.

**Imagery Strategy**
No photography. The page substitutes UI screenshots and abstract iconography, which keeps the visual language consistent with the product itself and avoids tonal mismatch.

**Animation Cues (inferred)**
Hover states likely shift hairline brightness to white and bump the accent dot; CTA fill probably inverts against the dark canvas. Nothing in the static frame suggests movement beyond subtle luminance transitions.

**Reusable Design Principles**
1. Build dark themes on a 2-3 step surface ladder, not on hue.
2. Use a single rationed accent; never pair it with secondary colors.
3. Ratio display-to-body ≥ 4x; let size, not weight, carry hierarchy.
4. Alternate 1:1 text/visual bands to convert narrative into scannable rhythm.
5. Replace concept imagery with product artifacts.
6. Restrict radius to 3-4 values; 5/8-12/999 is enough.
7. Elevate with hairline + faint shadow, never weight.
8. Reserve a single tinted gradient panel per page to inject warmth without breaking monochrome.


---

### Görsel analiz — `blog (URL tahmini: content-index)`

**Screenshot:** `004_https___linear_app_blog.png` · **Güven:** 0.93 · **Doğrulama:** 10/10 renk computed CSS ile doğrulandı

- **Görsel ton:** dark-mode, technical, minimal, editorial, developer-oriented, grid-disciplined, monospace-accented
- **Yapı:** vertical scroll, full-bleed dark canvas, top bar with logo+nav+CTA, hero row with title+filter/search, repeated card grids (3-up) for editorial entries, a 4-up changelog row, a 3-up press row, a stacked archive list, footer CTA band
- **Yoğunluk:** — · **Grid:** 12-column responsive grid with 3-column card modules (approx 32px gutters); consistent gutter rhythm; cards align to a vertical baseline
- **Gözlenen componentler:** TopNav, HeroHeader, EditorialCard, ChangelogRow, PressCard, ArchiveList, FooterCTA, Footer

**Tone & Atmosphere.** The page reads as a calm, editorial dark canvas: near-black grounds, cool-gray text, hairline dividers, and exactly one warm accent reserved for live-signal dots. Density is balanced — compact inside cards, spacious between sections — giving the long scroll a rhythmic breath.

**Color System.** A two-step dark stack defines depth: a darker page canvas (~`#08090a`) under slightly lighter elevated cards (~`#18191a`), separated by 1px hairlines in cool gray (~`#3e3e44` / ilgili bölüm). Type is off-white (~`#f7f8f8`), with two muted gray steps for secondary and tertiary captions. A single coral (ilgili bölüm) acts as a status dot, never as decoration. A bright white pill is the lone high-contrast CTA in the hero, anchoring the top of the page.

**Typography.** A geometric sans handles UI and headings (Inter-class, medium weight for display, regular for body, ~14–16px base, ~48px hero). A monospaced face handles all metadata — dates, tags, category labels — at ~12–13px. This sans + mono pairing is a primary identity signal; the mono always signals ilgili bölüm

**Layout & Grid.** Top utility bar → oversized hero with filter/search → repeated 3-up card grid → compact 4-up changelog row → 3-up press row → stacked archive list → centered CTA band → multi-column footer. The outer 12-column grid hosts consistent 3-up modules with ~32px gutters; section spacing reads as ~80–120px between blocks. Cards align to a shared vertical baseline.

**Components.** All cards share one chrome: image top, hairline border, ~5–6px radius, elevated dark surface, mono caption, bold title, short excerpt. Buttons are full pills (ilgili bölüm); one filled light pill + one outline variant carries the page. The changelog uses hairline-divided rows with a single accent dot indicator. The archive is a dense divider-separated list, providing rhythm contrast against the image-card grids.

**Imagery.** Monochromatic, high-contrast technical illustrations and UI crops; occasional photographic portraits in the press tiles. All imagery is treated in a consistent dark/desaturated key, so the card grid stays visually unified.

**Cross-reference.** Computed CSS aligns with the screenshot: dual near-black surfaces, off-white + two cool-gray text steps, restrained coral accent, Inter + Berkeley Mono pairing, hairline-first separation with very subtle shadows. No contradictions.

**Design Principles to Carry Forward.**
1. Build depth from tone shift + hairlines, not shadows.
2. Use one accent color as signal only.
3. Pair a geometric sans with a mono for meta — let mono carry the ilgili bölüm voice.
4. Standardize one card grammar and reuse it across content types.
5. Alternate grid-card sections with divider-row list sections to create rhythm.
6. Confine oversized display type to the hero; keep section headings measured.
7. Limit buttons to a single pill style with two variants (fill / outline).


---

### Görsel analiz — `content (URL tahmini: inner-page)`

**Screenshot:** `005_https___linear_app_careers.png` · **Güven:** 0.92 · **Doğrulama:** 9/9 renk computed CSS ile doğrulandı

- **Görsel ton:** monochrome dark canvas, editorial-minimal, high-contrast typographic hierarchy, restrained single-accent system, engineering-forward / developer-tools aesthetic
- **Yapı:** single full-bleed column on dark canvas; stacked editorial sections separated by whitespace rather than visible dividers; nav pinned at top; large hero image inside content flow; mid-page 2-column block; tabular listings; multi-column footer
- **Yoğunluk:** spacious · **Grid:** appears to be 12-col with content constrained to ~6–8 visual cols; image hero spans full content width; team grid uses ~5 equal columns; principles use offset 2-column (number + text pair); job table is a 3-col implicit grid (title / region / action)
- **Gözlenen componentler:** top nav bar, hero text block, image hero, two-column editorial block, team photo card row, principles list, open roles table, pill button

Bu sayfa, karanlık bir kanvas üzerinde tipografi odaklı editorial bir dil kuruyor. Tasarımın merkezinde **aşırı kısıtlı bir renk paleti** var: zemin gerçek bir near-black, metin beyaz, üç kademeli gri tonu muted hiyerarşi için, ve tüm sayfada **tek bir accent renk** hem ordinal numaralar hem de link/CTA için kullanılıyor. Bu tek-vurgu stratejisi, her şeyin aynı paletten konuşmasını sağlıyor; ek renk yok, gradient yok, dolgu vurgusu yok. İzole görsel etki için accent bile sadece iki dar rolde çalışıyor.

**Tipografi iki sesli bir sistem:** insanist/geometrik bir sans (Inter Variable) her yerde baskın, monospaced bir yüz (Berkeley Mono) yalnızca sıralama, numara ve meta-etiketler için devreye giriyor. Bu ikili bileşim, fazladan renk eklemeden ritim yaratıyor. Hiyerarşi ağırlık kontrastından değil, **boyut sıçramalarından** geliyor: devasa display başlık (~64px) → bölüm başlığı (~48px) → küçük bölüm etiketi → gövde. Satır yükseklikleri gövdede geniş, başlıklarda sıkı.

**Layout, tek bir content-sütunu etrafında dönüyor.** Sayfa section'ları kart veya kutu kullanmıyor; bölümler **dikey beyaz alan ve 1px hairline kuralları** ile ayrılıyor. Kutuyu boşluk yapıyor — bu en net tasarım prensibi. İçeride iki kompozisyon dili var: editorial bloklar (kısa etiket sol, uzun paragraf sağ) ve veri blokları (prensiplerin 2-kolonlu listesi, iş ilanlarının 3-kolonlu tabular grid'i).

**Component dili tutarlı ve düşük sayıda primitive üzerine kurulu.** Her interactive control **tam yuvarlak pill geometrisi** (radius token ≈ 9999) ile geliyor; kart ve image chrome'ları 4–8px arası köşe yumuşatma ile geliyor; metin yüzeyleri sıfır radius kullanıyor. Bu üç kademeli yarıçap skalası, ilgili bölüm ayrımını netleştiriyor. Gölge neredeyse hiç kullanılmıyor — derinlik yerine spacing ve hairline'lar çalışıyor.

**Tablolar görsel olarak en kritik component.** Rol/region/action olarak 3 sanal kolon, sadece satır ayraçları, satır yüksekliği geniş, aksiyon kolonu accent renkte sağa hizalı. Zebra fill yok, kutu yok. Bu "sessiz veri grid'i" yaklaşımı, bilgi yoğunluğu taşıyan sayfalar için doğrudan örnek alınabilir bir pattern.

**Footer düz bir link dizini** — imajsız, CTA'sız, referans indeksi gibi davranan yapı. Sitenin genel ilgili bölüm tavrıyla uyumlu; pazarlama yüzeyi değil.

**Kopyalama için değil ilham için özet:**
- Kanvası near-black tut, beyaz tipografiye çalıştır.
- Tek bir accent rengini yalnızca iki dar rolle kullan.
- İnsanist sans + mono ikilisi ile renk eklemeden ritim üret.
- Bölümleri kart değil, whitespace ve hairline ile ayır.
- Tüm interaktif elemanları pill yap; köşe yumuşatmayı sadece chrome'da kullan.
- Hiyerarşi için ağırlık yerine boyut sıçramasına güven.
- Veri bloklarını ilgili bölüm olarak işle: satır kuralları + accent link + geniş satır yüksekliği.


---

### Görsel analiz — `content (URL tahmini: inner-page)`

**Screenshot:** `006_https___linear_app_changelog.png` · **Güven:** 0.88 · **Doğrulama:** 9/9 renk computed CSS ile doğrulandı

- **Görsel ton:** dark-mode-dominant, minimal-technical, developer-focused, high-contrast-restraint, editorial-stacked, monochrome-with-single-accent
- **Yapı:** single-column vertical stack with sectioned rhythm; hero at top followed by repeating date/version blocks each containing mixed media (image + text + nested cards)
- **Yoğunluk:** — · **Grid:** centered narrow column (~max 720-820px content width) with full-bleed edges; sub-grids inside each section for media + caption alignment
- **Gözlenen componentler:** hero-block, entry-card, version-date-header, chip-tag, inline-media, blockquote-or-callout, cta-pill, footer-strip

` with professional analysis

I must NOT copy text/headlines/menus from the screenshot. Only describe design tokens, components, spacing, hierarchy, etc. in abstract terms.

Let me analyze what I can see:

**Layout:**
- Single-column stacked layout with very long scrollable content (26049px gallery height)
- Hero section at top
- Multiple content sections stacked vertically
- Very dark theme (#08090a background)
- Long-form changelog structure with alternating sections

**Colors (from CSS cross-reference):**
- Background: #08090a (near-black)
- Secondary background: #1c1c1f, #23252a (dark grays for cards/sections)
- Text primary: #d0d6e0, #f7f8f8 (light gray/white)
- Text muted: #62666d, #8a8f98 (gray)
- Accent: #5e6ad2 (purple/indigo - Linear's signature color)

**Typography:**
- Inter Variable for UI/body
- Berkeley Mono for code/timestamps
- Font sizes: 12-24px range
- Mix of sans-serif and mono creates technical/developer aesthetic

**Components I can identify:**
- Cards/sections with alternating dark backgrounds
- Date headers (likely with mono font)
- Image/media embeds within content blocks
- Version/labels
- Buttons/links
- Tag/chip components (small pills)
- Avatars/user mentions
- Image galleries
- Quote blocks

**Visual tone:**
- Dark, minimal, technical
- Developer-focused
- Clean typography
- Lots of negative space
- Restrained color palette with accent purple

**Border radius:**
- 8px for cards
- 9999px (fully rounded) for chips/pills
- 0-5px for small elements

**Spacing:**
- Generous padding 8-24px
- Large vertical margins between sections (48px)
- Stacked single column

Let me structure the JSON output.</think>

```json
{
  ilgili bölüm: ilgili bölüm,
  ilgili bölüm: 0.88,
  ilgili bölüm: [
    ilgili bölüm,
    ilgili bölüm,
    ilgili bölüm,
    ilgili bölüm,
    ilgili bölüm,
    ilgili bölüm
  ],
  ilgili bölüm: [
    {"hex": ilgili bölüm, ilgili bölüm: ilgili bölüm, ilgili bölüm: 0.95, ilgili bölüm: ilgili bölüm, ilgili bölüm: true},
    {"hex": ilgili bölüm, ilgili bölüm: ilgili bölüm, ilgili bölüm: 0.9, ilgili bölüm: ilgili bölüm, ilgili bölüm: true},
    {"hex": ilgili bölüm, ilgili bölüm: ilgili bölüm, ilgili bölüm: 0.85, ilgili bölüm: ilgili bölüm, ilgili bölüm: true},
    {"hex": ilgili bölüm, ilgili bölüm: ilgili bölüm, ilgili bölüm: 0.9, ilgili bölüm: ilgili bölüm, ilgili bölüm: true},
    {"hex": ilgili bölüm, ilgili bölüm: ilgili bölüm, ilgili bölüm: 0.85, ilgili bölüm: ilgili bölüm, ilgili bölüm: true},
    {"hex": ilgili bölüm, ilgili bölüm: ilgili bölüm, ilgili bölüm: 0.8, ilgili bölüm: ilgili bölüm, ilgili bölüm: true},
    {"hex": ilgili bölüm, ilgili bölüm: ilgili bölüm, ilgili bölüm: 0.75, ilgili bölüm: ilgili bölüm, ilgili bölüm: true},
    {"hex": ilgili bölüm, ilgili bölüm: ilgili bölüm, ilgili bölüm: 0.95, ilgili bölüm: ilgili bölüm, ilgili bölüm: true},
    {"hex": ilgili bölüm, ilgili bölüm: ilgili bölüm, ilgili bölüm: 0.7, ilgili bölüm: ilgili bölüm, ilgili bölüm: true}
  ],
  ilgili bölüm: [
    {"role": ilgili bölüm, ilgili bölüm: ilgili bölüm, ilgili bölüm: ilgili bölüm, ilgili bölüm: ilgili bölüm, ilgili bölüm: ilgili bölüm, ilgili bölüm: 0.85},
    {"role": ilgili bölüm, ilgili bölüm: ilgili bölüm, ilgili bölüm: ilgili bölüm, ilgili bölüm: ilgili bölüm, ilgili bölüm: ilgili bölüm, ilgili bölüm: 0.8},
    {"role": ilgili bölüm, ilgili bölüm: ilgili bölüm, ilgili bölüm: ilgili bölüm, ilgili bölüm: ilgili bölüm, ilgili bölüm: ilgili bölüm, ilgili bölüm: 0.9},
    {"role": ilgili bölüm, ilgili bölüm: ilgili bölüm, ilgili bölüm: ilgili bölüm, ilgili bölüm: ilgili bölüm, ilgili bölüm: ilgili bölüm, ilgili bölüm: 0.9},
    {"role": ilgili bölüm, ilgili bölüm: ilgili bölüm, ilgili bölüm: ilgili bölüm, ilgili bölüm: ilgili bölüm, ilgili bölüm: ilgili bölüm, ilgili bölüm: 0.8}
  ],
  ilgili bölüm: {
    ilgili bölüm: "single-column vertical stack with sectioned rhythm; hero at top followed by repeating date/version blocks each containing mixed media (image + text + nested cards)",
    ilgili bölüm: "centered narrow column (~max 720-820px content width) with full-bleed edges; sub-grids inside each section for media + caption alignment",
    ilgili bölüm: "8 / 12 / 16 / 24 / 48 px observed; sections separated by ~48px vertical gaps; inner card padding 16-24px",
    ilgili bölüm: "spacious with high vertical breathing room between sections; internally compact for paragraph and chip clusters",
    ilgili bölüm: 0.82
  },
  ilgili bölüm: [
    {"name": ilgili bölüm, ilgili bölüm: ilgili bölüm, ilgili bölüm: ilgili bölüm, ilgili bölüm: 0.8},
    {"name": ilgili bölüm, ilgili bölüm: "section block with dark surface fill (#1c1c1f), 8px radius, 1px border or no border, internal padding 16-24px, hosts image + body + nested elements", ilgili bölüm: ilgili bölüm, ilgili bölüm: 0.85},
    {"name": ilgili bölüm, ilgili bölüm: ilgili bölüm, ilgili bölüm: ilgili bölüm, ilgili bölüm: 0.75},
    {"name": ilgili bölüm, ilgili bölüm: "fully rounded (radius 9999) pill, small height ~24-28px, 12-13px text, subtle dark fill or accent fill", ilgili bölüm: ilgili bölüm, ilgili bölüm: 0.85},
    {"name": ilgili bölüm, ilgili bölüm: "embedded image/gif blocks with rounded corners (8px) and minimal frame, often preceded by a mono caption", ilgili bölüm: ilgili bölüm, ilgili bölüm: 0.8},
    {"name": ilgili bölüm, ilgili bölüm: "differentiated surface (#23252a) with left-edge accent or subtle border, used for quoted announcements", ilgili bölüm: ilgili bölüm, ilgili bölüm: 0.7},
    {"name": ilgili bölüm, ilgili bölüm: "small rounded button (radius 9999), compact horizontal padding 12-16px, accent purple fill #5e6ad2 or dark fill with border", ilgili bölüm: ilgili bölüm, ilgili bölüm: 0.8},
    {"name": ilgili bölüm, ilgili bölüm: ilgili bölüm, ilgili bölüm: ilgili bölüm, ilgili bölüm: 0.75}
  ],
  ilgili bölüm: {
    ilgili bölüm: "dark UI screenshots, product mockups, animated demonstrations; consistent dark canvas to blend with page",
    ilgili bölüm: "in-context within each entry-card as supporting visual; never full-bleed hero; always framed with subtle radius",
    ilgili bölüm: 0.8
  },
  ilgili bölüm: [
    "Computed primary background #08090a matches perceived near-black canvas; matches visual analysis.",
    "Computed text #f7f8f8 and #d0d6e0 align with two-tier body/heading contrast observed.",
    "Accent #5e6ad2 detected as one of the few non-monochrome fills; consistent with isolated pill and link highlights visible.",
    "Font families Inter Variable + Berkeley Mono fully explain the mix of crisp UI text and monospaced metadata/date strings.",
    ilgili bölüm,
    "Padding scale 8/12/16/24 confirms compact internal density vs spacious external section rhythm.",
    "Single-column ilgili bölüm layout across all detected sections confirms no multi-column competition; vertical scroll is primary navigation."
  ],
  ilgili bölüm: [
    "Establish a near-black canvas (#08090a) as the default, with two elevation surfaces (#1c1c1f, #23252a) used sparingly to separate content density.",
    "Reservoir the accent color to a single hue (#5e6ad2) and use it only for active states, tags, and primary CTAs—never decorative.",
    "Pair a geometric sans for body with a monospaced face for any metadata, version stamps, or code fragments to reinforce a technical identity.",
    "Anchor each changelog entry with a monospaced date or version header; it doubles as a visual rhythm device.",
    "Keep content width constrained (~720-820px) and center it; outer edges remain negative space to emphasize reading flow.",
    "Use an 8px base radius for cards and 9999px (full pill) for chips/buttons to create a clear two-tier geometry vocabulary.",
    "Maintain generous vertical separation (48px) between entries but compact internal spacing (8-24px) so each block feels self-contained.",
    "Embed product imagery at small-to-medium scale with the same dark surface tone so visuals feel native rather than pasted-in.",
    "Limit shadow usage to elevation transitions only; rely on surface color contrast and 1px borders for hierarchy."
  ]
}
```

---

## VISUAL_AUDIT_MARKDOWN

### Genel Kompozisyon
Sayfa tek-sütun dikey bir ilgili bölüm üzerine kurulu; hero alanı üst kenarda kompakt bir başlık-özet-CTA üçlüsüyle yerleştirilmiş, ardından aynı şablonu tekrarlayan çok sayıda bağımsız blok aşağı doğru istifleniyor. Tüm sayfa 26k+ px yüksekliğinde, yani dikey kaydırma birincil navigasyon. İçerik genişliği sınırlı ve ortalanmış; kenar boşlukları bilinçli olarak geniş tutulmuş.

### Renk Sistemi
Sayfa, neredeyse siyah bir kanvas (#08090a) üzerine iki kademeli koyu yüzey tonu (#1c1c1f, #23252a) ile çalışıyor. Metin hiyerarşisi üç-dört kademeli: birincil başlık için en yüksek kontrast (#f7f8f8), gövde için hafif düşürülmüş tonda (#d0d6e0), metadata ve tarihler için muted gri (#8a8f98, #62666d). Tek bir mor-mavi vurgu rengi (#5e6ad2) var; bu renk bilinçli olarak yalnızca CTA pill'lerinde, link vurgularında ve seçilmiş etiketlerde kullanılıyor. Renk oranı yaklaşık %85 monokrom, %10 koyu gri yüzeyler, %5 vurgu — bu, ilgili bölüm prensibinin net bir örneği.

### Tipografi
İki font ailesi yan yana çalışıyor: geometrik sans (Inter Variable) gövde ve başlıklarda, monospace (Berkeley Mono) tarih damgaları, versiyon numaraları ve kod benzeri fragment'larda. Mono font kullanımı sayfaya otomatik olarak ilgili bölüm bir karakter kazandırıyor. Boyut skalası 12-24px aralığında; başlık-gövde arası kontrast ağırlık (weight) ile değil renk tonu ve boyutla çözülmüş.

### Spacing & Grid
İçerik tek bir dar sütunda akar (~720-820px tahmini). Bölümler arasında ~48px dikey boşluk var; her bloğun iç padding'i 16-24px arasında, yani ilgili bölüm bir ritim. Bu, okuyucuyu yavaşlatmadan bloklar arası geçişi netleştiriyor.

### Component Vokabüleri
- **Kart/Entry blok:** 8px radius, koyu yüzey dolgusu, 1px sınır veya sınırsız, içinde medya + metin + alt bileşenler barındırıyor.
- **Pill/Chip:** Tam yuvarlak (radius 9999), 24-28px yükseklik, 12-13px etiket metni; iki varyant — pasif (koyu fill) ve vurgulu (accent dolgu).
- **Mono Header:** Tarih/versiyon damgası olarak kullanılıyor; küçük boyutta ama yüksek kontrastla bölüm anchor işlevi görüyor.
- **Inline Media:** Görseller aynı koyu yüzey tonuna yakın üretilmiş, 8px radius ile çerçevelenmiş; tam ekran hero değil, her zaman blok içinde.
- **CTA:** Küçük, yuvarlak pill buton; birincil varyant accent dolgu, ikincil varyant koyu yüzey + 1px border.
- **Callout:** Daha koyu yüzey (#23252a) + olası sol kenar accent çizgisi ile ayrılan, nadiren kullanılan quote/düşünce kutusu.

### Görsel Kimlik Özeti
Tasarım dili ilgili bölüm olarak özetlenebilir: az element, çok negatif alan, tek vurgu rengi, iki yüzey kademesi, iki geometri ailesi (8px radius ve pill). Bu kombinasyon, ürün yazılımı / geliştirici aracı konumlandırmasını zorlaştırmadan ilgili bölüm bir izlenim bırakıyor.

### Uygulama Notları (Token Seviyesinde)
- **color-bg:** ilgili bölüm (canvas), ilgili bölüm (card), ilgili bölüm (code/callout)
- **color-text:** ilgili bölüm (primary), ilgili bölüm (secondary), ilgili bölüm / ilgili bölüm (muted)
- **color-accent:** ilgili bölüm — yalnızca interaktif durumlar
- **radius:** ilgili bölüm (card), ilgili bölüm (pill), ilgili bölüm (inline)
- **spacing:** ilgili bölüm skalası
- **border:** ilgili bölüm solid, muted ton
- **font-stack:** ilgili bölüm (UI/body) + ilgili bölüm (mono)
- **shadow:** Yalnızca yükselti geçişlerinde, dekoratif değil


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
| crawl | ✅ tam | 6 sayfa gezildi, 6 ekran görüntüsü alındı |
| scroll_capture | ✅ uygulandı | 2/6 sayfada kaydırma ile tam yakalama yapıldı |
| teknoloji_tespiti | ✅ tam | 5 teknoloji tespit edildi, 6/6 sayfada runtime probe çalıştı |
| computed_css_tokens | ✅ tam | Renk/tipografi/spacing token'ları gerçek computed CSS'ten çıkarıldı |
| gorsel_analiz_vision | ✅ tam | 6/6 sayfa görsel olarak analiz edildi |

**Sayılar:** 6 sayfa gezildi · 6 sayfa görsel analiz · 5 teknoloji tespiti

### Dikkat edilmesi gerekenler
- Bilinen eksik yok; rapor tam kapsamlı üretildi.

