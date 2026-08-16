# Replikasyon Reçetesi — https://linear.app

Bu dosya, siteyi **sıfırdan yeniden kuracak** kişi ya da yapay zeka için yazıldı. Sıra önemlidir: aşağıdaki adımlar birbirinin üstüne biner.

> **Önce `BUILD_PROMPT.md`'yi oku** — orada yasaklı yapay zeka belirtileri ve metin yazımı kuralları var. Bu dosya *ne kuracağını*, o dosya *nasıl kurmayacağını* söyler.

> **Telif uyarısı:** bu reçete sitenin *tasarım ve etkileşim dilini* tarif eder. Metinleri, fotoğrafları, logoyu ve font dosyalarını kopyalama — onlar kaynak sitenin mülkü. Kendi içeriğinle doldur.

## 1. Teknoloji seçimi

- **Başlıklar harf/kelime bazında bölünmüş.** Bunun için bir bölme yardımcısı gerekir (GSAP SplitText ücretli; `split-type` ücretsiz alternatif). ⚠️ Bölünen metnin ekran okuyucuda tek parça kalması için sarmalayıcıya `aria-label` ver, harflere `aria-hidden` koy.

## 2. Temeli kur

1. `site/tokens-from-source.css` dosyasını projenin köküne al. Bunlar sitenin **kendi** değişkenleri; renk ve boşluk kararlarını buradan türet, ekran görüntüsünden pipet çekme.
3. `site/keyframes.css` içindeki 87 kuralı olduğu gibi al — bunlar sitenin CSS'inde yazılı, tahmin değil.

## 3. Sahneleri sırayla kur

Ölçümde kaydırmaya bağlı belirgin bir sahne çıkmadı. Sayfa büyük ihtimalle statik akışa dayanıyor; hareketi zorlama.
## 4. Detay teknikleri

- **Başlık açılışı:** başlıkları satır/kelime/harf olarak böl ve kademeli (stagger) aç. Ölçüm: 88 harf, 313 kelime sarmalayıcı. Erişilebilirlik için sarmalayıcıya `aria-label`.
- **Karışım modu:** 19 elemanda `mix-blend-mode` var. Bu, üst üste binen katmanların rengini değiştirir; düz opaklıkla taklit edilirse görsel kimlik kaybolur.
- **Maske / clip-path:** 16 maske, 26 clip-path. Açılma efektlerini opaklıkla değil geometriyle yap.
- **Video:** 6 video, 0 tanesi otomatik oynuyor. `muted` + `playsinline` şart; poster görseli koy.

## 5. Bittiğinde doğrula

Aşağıdakilerin hepsi geçmeden "aynısı oldu" deme:

- [ ] Sayfa uzunluğu ~1.2 ekran boyu (çok kısa çıktıysa sabitlenen bölümleri atlamışsın demektir)
- [ ] 0 sabitlenen bölüm var ve toplam sabitlenme mesafesi tutuyor
- [ ] 0 parallaks katmanı ve hız dağılımı (-) benzer
- [ ] Kaydırmayı geri sardığında `scrub` işaretli sahneler geri sarıyor, `bir kez tetiklenir` işaretliler yerinde kalıyor
- [ ] `prefers-reduced-motion: reduce` açıkken tüm scroll animasyonları kapanıyor
- [ ] Klavye ile gezinilebiliyor ve sabitlenen bölümler odağı hapsetmiyor
- [ ] `BUILD_PROMPT.md`'deki yasak listesinden hiçbiri sayfada yok
