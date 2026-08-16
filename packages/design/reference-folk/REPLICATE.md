# Replikasyon Reçetesi — https://folk.app

Bu dosya, siteyi **sıfırdan yeniden kuracak** kişi ya da yapay zeka için yazıldı. Sıra önemlidir: aşağıdaki adımlar birbirinin üstüne biner.

> **Önce `BUILD_PROMPT.md`'yi oku** — orada yasaklı yapay zeka belirtileri ve metin yazımı kuralları var. Bu dosya *ne kuracağını*, o dosya *nasıl kurmayacağını* söyler.

> **Telif uyarısı:** bu reçete sitenin *tasarım ve etkileşim dilini* tarif eder. Metinleri, fotoğrafları, logoyu ve font dosyalarını kopyalama — onlar kaynak sitenin mülkü. Kendi içeriğinle doldur.

## 1. Teknoloji seçimi

Ölçümde özel bir hareket katmanı çıkmadı. Tarayıcının kendi kaydırmasıyla ve CSS geçişleriyle kurmak yeterli — kütüphane ekleme.

## 2. Temeli kur

1. `site/tokens-from-source.css` dosyasını projenin köküne al. Bunlar sitenin **kendi** değişkenleri; renk ve boşluk kararlarını buradan türet, ekran görüntüsünden pipet çekme.
2. `site/fonts.css`'teki aileleri **kendi lisansınla** temin et. Değişken font varsa değişken sürümünü kullan; sabit ağırlık kullanmak tipografiyi ölü gösterir.
3. `site/keyframes.css` içindeki 4 kuralı olduğu gibi al — bunlar sitenin CSS'inde yazılı, tahmin değil.

## 3. Sahneleri sırayla kur

⚠️ **Kaydırma ölçümü yapılamadı** (sayfa tarama sırasında ilerlemedi). Bu bölüm için kaynak siteyi kendin gezip sahneleri not alman gerekiyor; aşağıdaki teknik listesi ve `site/` klasöründeki tanımlar yine de geçerli.

## 5. Bittiğinde doğrula

Aşağıdakilerin hepsi geçmeden "aynısı oldu" deme:

- [ ] Sayfa uzunluğu ~? ekran boyu (çok kısa çıktıysa sabitlenen bölümleri atlamışsın demektir)
- [ ] 0 sabitlenen bölüm var ve toplam sabitlenme mesafesi tutuyor
- [ ] 0 parallaks katmanı ve hız dağılımı (-) benzer
- [ ] Kaydırmayı geri sardığında `scrub` işaretli sahneler geri sarıyor, `bir kez tetiklenir` işaretliler yerinde kalıyor
- [ ] `prefers-reduced-motion: reduce` açıkken tüm scroll animasyonları kapanıyor
- [ ] Klavye ile gezinilebiliyor ve sabitlenen bölümler odağı hapsetmiyor
- [ ] `BUILD_PROMPT.md`'deki yasak listesinden hiçbiri sayfada yok
