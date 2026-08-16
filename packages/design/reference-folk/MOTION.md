# Hareket Dili

> ⚠️ **Kaydırma zaman çizelgesi ölçülemedi.** Sayfa tarama sırasında ilerlemedi — açılış animasyonu, çerez duvarı ya da kaydırmayı ele geçiren bir katman tekerlek olaylarını yutmuş olabilir. Aşağıdaki *durağan* ölçümler (teknikler, sitenin kendi tanımları) geçerlidir; sahne/pin/parallaks ölçümü YOKTUR.

Ölçülen kaydırma yolu: **0 px** (0 örnek).

## İmza teknikleri

| Teknik | Ölçüm | Anlamı |
|---|---:|---|
| Metin bölme (SplitText) | 1 | başlıklar harf/kelime bazında sarmalanmış — harf harf açılma tekniği |
| Yapışık (sticky) eleman | 1 | CSS sticky ile tutulan bölümler |
| will-change | 1 | GPU katmanına alınmış eleman sayısı — performans bütçesinin işareti |

✅ **`prefers-reduced-motion` destekleniyor** (1 kural). Taklit ederken bunu ATLAMA — erişilebilirlik gereği ve ödüllü sitelerin standardı.

## Sitenin kendi tanımları

Aşağıdakiler ölçülmüş ya da tahmin edilmiş değil — sitenin CSS'inde **yazılı** olan tanımlardır. ZIP içinde `site/` klasöründe birebir kopyalanabilir hâlde duruyorlar.

- **4 @keyframes** → `site/keyframes.css` (intercom-lightweight-app-gradient, intercom-lightweight-app-launcher, intercom-lightweight-app-messenger, spin)
- **7 @font-face** → `site/fonts.css` (Axeptio CJK Fallback, Geist Mono, Instrumentserif, Inter, Uxumgrotesque, webflow-icons)
- **48 CSS değişkeni** → `site/tokens-from-source.css`

**En çok kullanılan geçiş eğrileri:**

| Süre ve eğri | Kaç elemanda |
|---|---:|
| `0.2s \| ease` | 7 |
| `0.3s \| ease` | 6 |
| `0.1s \| linear` | 4 |
| `0.15s \| ease` | 2 |
| `0.1s \| ease` | 2 |
| `0.22s \| cubic-bezier(0.22` | 2 |
