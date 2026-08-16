# BUILD_PROMPT.md — bu tasarım dilinden ÖZGÜN bir site üret

> Bu dosya, siteyi yeniden üretecek yapay zekaya **doğrudan** verilmek üzere
> yazıldı. Kaynak: `https://folk.app` analizi.

## 0. Temel kural

Amaç **klon değil**. Kaynak sitenin tasarım *kalitesini*, *ritmini* ve
*sistem disiplinini* al; kompozisyonu, içerik mimarisini ve metinleri
sıfırdan kur. Kaynak siteden başlık, paragraf, menü adı, CTA metni veya
slogan **kopyalama**.

Kaynak sitenin yapay zeka izi skoru: **89.3/100** (Özgün ve tutarlı; belirgin şablon izi yok.). Ürettiğin sayfa bu skordan **daha iyi** olmalı.

## 1. Yasaklı yapay zeka belirtileri

Aşağıdakiler "yapay zeka yapmış" hissinin ölçülmüş kaynaklarıdır. Her biri
bu projede **ölçülebilir** bir kuraldır — üretim bittiğinde aynı ölçüm
tekrar çalıştırılabilir.

1. **Yanıp sönen, nefes alan, parlayan (pulse / glow / box-shadow halesi) buton ve kart YOK.**  
  Bunun yerine: Durum değişimini renk ve kenarlıkla anlat; hareket sadece kullanıcı eylemine yanıt olsun.  
  Neden: Duran bir sayfada kendiliğinden parlayan öğe, gerçek ürünlerde neredeyse hiç bulunmaz; yapay zekayla üretilmiş arayüzlerin en tanınır imzasıdır.  
  *Bu sitede ölçülen:* **0 adet** (sağlıklı eşik: 0 adet). Bu bandı aşma.
2. **Tam yuvarlak (pill / border-radius:999px) rozet ve etiket enflasyonu YOK.**  
  Bunun yerine: Rozet köşe yarıçapı, sitede ölçülen radius hiyerarşisinin İÇİNDE kalsın.  
  Neden: Her başlığın üstünde küçük pill rozet, üretilmiş arayüzlerin klişesi.  
  *Bu sitede ölçülen:* **1 adet** (sağlıklı eşik: 2 adet). Bu bandı aşma.
3. **Her kutuya birden yuvarlak köşe + gölge verme.**  
  Bunun yerine: Yüzey ayrımını önce kenarlık ve zemin farkıyla kur; gölgeyi yalnızca gerçekten yükseltilmiş öğeye (modal, dropdown) sakla.  
  Neden: "Soft UI" enflasyonu, sayfayı derinliksiz ve şablon gibi gösterir.  
  *Bu sitede ölçülen:* **%0** (sağlıklı eşik: %18). Bu bandı aşma.
4. **Mor-indigo gradyan (#8b5cf6 → #6366f1 ailesi) YOK.**  
  Bunun yerine: Ölçülen marka renginden türetilmiş düz renk veya çok düşük kontrastlı tek tonlu geçiş kullan.  
  Neden: Mor-indigo gradyan, üretilmiş şablonların fiilî varsayılanı.  
  *Bu sitede ölçülen:* **0 adet** (sağlıklı eşik: 0 adet). Bu bandı aşma.
5. **Gradyan dolgulu (background-clip:text) başlık YOK.**  
  Bunun yerine: Hiyerarşiyi punto, ağırlık ve boşlukla kur.  
  Neden: Gradyan metin, içerik zayıflığını süslemeyle kapatma refleksidir.  
  *Bu sitede ölçülen:* **0 adet** (sağlıklı eşik: 1 adet). Bu bandı aşma.
6. **Cam efekti (backdrop-filter: blur) yüzey enflasyonu YOK.**  
  Bunun yerine: En fazla tek bir yapışkan katmanda kullan (ör. üst menü); içerik kartlarında kullanma.  
  Neden: Her yüzeyin buzlu cam olması okunabilirliği düşürür ve şablon hissi verir.  
  *Bu sitede ölçülen:* **0 adet** (sağlıklı eşik: 1 adet). Bu bandı aşma.
7. **Birbirinin tıpatıp aynısı 3'lü kart dizisi YOK.**  
  Bunun yerine: Kartların ağırlığını içeriğe göre farklılaştır; gerektiğinde asimetrik düzen kur.  
  Neden: "Üç eşit kart" düzeni, içerik düşünülmeden doldurulmuş bölümün işaretidir.  
  *Bu sitede ölçülen:* **2 adet** (sağlıklı eşik: 2 adet). Bu bandı aşma.
8. **Başlıklarda emoji YOK.**  
  Bunun yerine: Anlamı kelimeyle taşı; ikon gerekiyorsa tutarlı bir ikon setinden gelsin.  
  Neden: Emoji'li başlık, sohbet çıktısının doğrudan sayfaya yapıştırıldığını gösterir.  
  *Bu sitede ölçülen:* **0 adet** (sağlıklı eşik: 0 adet). Bu bandı aşma.
9. **Varsayılan çerçeve paletini (Tailwind slate/indigo/violet tonları) olduğu gibi kullanma.**  
  Bunun yerine: Paleti, bu raporda ölçülen marka renginden türet.  
  Neden: Varsayılan palet, tasarım kararı verilmediğinin en hızlı kanıtı.  
  *Bu sitede ölçülen:* **%0** (sağlıklı eşik: %20). Bu bandı aşma.
10. **Stok/placeholder görsel (unsplash, placehold, picsum) YOK.**  
  Bunun yerine: Gerçek ürün görseli yoksa görsel yerine tipografik veya geometrik bir çözüm kur.  
  Neden: Stok görsel, sayfanın gerçek bir işe ait olmadığını anında ele verir.  
  *Bu sitede ölçülen:* **%0** (sağlıklı eşik: %0). Bu bandı aşma.
11. **Lorem ipsum ve "doldurma" metin YOK.**  
  Bunun yerine: Gerçek, kısa ve iddialı metin yaz (aşağıdaki humanizer kuralına bak).  
  Neden: Doldurma metin, yayına alınmış bir sayfada asla bulunmamalı.  
  *Bu sitede ölçülen:* **0 adet** (sağlıklı eşik: 0 adet). Bu bandı aşma.
12. **Sayfanın tamamını ortalama.**  
  Bunun yerine: Hero dışında sola hizala; okuma satır uzunluğunu 60-80 karakterde tut.  
  Neden: Baştan sona ortalanmış metin, düzen kararı verilmediğini gösterir.  
  *Bu sitede ölçülen:* **%4** (sağlıklı eşik: %30). Bu bandı aşma.
13. **Rastgele boşluk değerleri kullanma.**  
  Bunun yerine: 4px (veya 8px) tabanlı tek bir ölçeğe bağlı kal.  
  Neden: Izgaraya oturmayan boşluklar, göz kararı üretilmiş düzenin izidir.  
  *Bu sitede ölçülen:* **%93** (sağlıklı eşik: %88). Bu bandı aşma.
14. **Onlarca farklı punto kullanma.**  
  Bunun yerine: Bu raporda ölçülen tipografi ölçeğine sadık kal.  
  Neden: Kontrolsüz punto çeşitliliği, sistem yerine tek tek kararlar alındığını gösterir.  
  *Bu sitede ölçülen:* **12 adet** (sağlıklı eşik: 9 adet). Bu bandı aşma.
15. **WCAG AA eşiğinin altında metin/zemin çifti bırakma.**  
  Bunun yerine: Her semantik rol için kontrastı doğrula; bu raporda hesaplanmış oranlar var.  
  Neden: Düşük kontrast hem erişilebilirlik hatası hem de "göze hoş gelsin" refleksinin sonucu.  
  *Bu sitede ölçülen:* **%0** (sağlıklı eşik: %2). Bu bandı aşma.

## 2. Buton kuralı (özellikle dikkat)

En sık görülen yapay zeka imzası **yuvarlak + ışıklı buton**: tam yuvarlak
köşe, gradyan dolgu, etrafında parlama/gölge halesi, üstüne bir de nabız
animasyonu. Bunu yapma.

- Köşe yarıçapı bu sitede ölçülen değerlerden seçilecek: `20px`
- Dolgu düz renk: `#000000`
- Üstündeki metin: `#ffffff` (kontrast hesabıyla seçildi)
- Parlama/hale/nabız **yok**; hover'da yalnızca ölçülü bir renk veya
  kenarlık değişimi, `0.1s, 0.2s, 0.15s, 0.3s, 0.167s, 0.08s` bandında.

## 2b. Yasaklı hareket kalıpları (ölçülmüş)

Bu bölüm kaydırma-tahrikli siteler için özeldir. Yukarıdaki durağan izler kadar belirleyicidir: sayfanın *durduğu* an değil, *hareket ettiği* an ele verir.

1. **Her elemana aynı `fade-up` animasyonunu verme.**  
  Bunun yerine: Bölüme göre teknik değiştir: bir yerde maskeyle açıl, bir yerde sabitleyip yatay kaydır, bir yerde hiç animasyon kullanma.  
  Neden: Yapay zekanın ürettiği sitelerin en tanıdık hareket izi, sayfadaki her bloğun aynı mesafe ve aynı süreyle yukarı kaymasıdır. Ödüllü siteler hareketi anlatıya göre değiştirir.  
  *Ölçüm:* Bu sitede kaydırmayla tetiklenen giriş animasyonu ölçülmedi — hareket ağırlıklı olarak parallaks/sabitleme ile kuruluyor. Bu da bir cevaptır: her yere fade-up koymak zorunda değilsin.
2. **Animasyonu zamanlayıcıya bağlama.**  
  Bunun yerine: Kaydırmaya bağlı (scrub) olması gereken sahneleri kaydırma konumuna bağla; kullanıcı geri sardığında geri sarmalı.  
  Neden: Zamanlayıcıya bağlı sahne, kullanıcı dursa bile oynamaya devam eder ve site 'kendi kendine akıyor' hissi verir. Kontrolün kullanıcıda olması bu türün temel kuralıdır.  
  *Ölçüm:* Bu sitede ölçülen: **0** sahne kaydırmaya bağlı, **0** sahne bir kez tetikleniyor.
3. **Tek bir parallaks hızı kullanma.**  
  Bunun yerine: Katmanlara farklı hızlar ver; derinlik hissi hız FARKINDAN doğar.  
  Neden: Tüm katmanları 0.9 hızında kaydırmak parallaks değil, gecikmedir. Ölçülen sitelerde hız dağılımı geniştir.  
  *Ölçüm:* Bu sitede parallaks ölçülmedi — zorlama.
4. **Sabitlenen bölümü 'uzun sayfa' sanıp gereksiz uzatma.**  
  Bunun yerine: Sahnenin sabitlenme mesafesini içeriğine göre belirle: ölçülen değerler aşağıda.  
  Neden: Boş yere 400vh sabitlenen bir bölüm kullanıcıyı yorar; bu, tekniği anlamadan taklit etmenin klasik işaretidir.  
  *Ölçüm:* Bu sitede: **0** sabitlenen bölüm, toplam **0 px**.
5. **`prefers-reduced-motion` desteğini atlama.**  
  Bunun yerine: Bu medya sorgusu açıkken bütün kaydırma animasyonlarını kapat, içeriği son (oturmuş) hâliyle göster.  
  Neden: Hareket duyarlılığı olan kullanıcı için bu erişilebilirlik gereğidir; atlanması aynı zamanda işin aceleye geldiğinin işaretidir.  
  *Ölçüm:* Kaynak sitede **destekleniyor** — sen de destekle.

> Sahne sahne ölçülmüş değerler ve yeniden kurma sırası için `MOTION.md` ve `REPLICATE.md` dosyalarına bak.

## 3. Metinler — humanizer zorunlu

Sayfadaki **bütün metinler** (başlık, alt başlık, açıklama, CTA, boş durum,
hata mesajı) `humanizer` skill'i kullanılarak yazılacak. Kurulum:

```bash
npx skills add https://github.com/blader/humanizer --skill humanizer
```

Kaynak: https://github.com/blader/humanizer

Kural: önce metni yaz, sonra humanizer'dan geçir, kalıp dili temizlenmiş
sürümü kullan. Şunlar metinde bulunmayacak:

- "Devrim niteliğinde", "sorunsuz", "güçlendirin", "bir üst seviyeye taşıyın"
  gibi içi boş pazarlama kalıpları
- Her cümlede tire (—) ve üçlü liste ritmi
- "X sadece bir Y değildir" kalıbı
- Emoji ile başlayan madde işaretleri

Metin kısa, somut ve iddialı olsun; ne yaptığını söyle, ne hissettirdiğini değil.

## 4. Uyacağın ölçülmüş sistem

- **Renk rolleri:** zemin `#ffffff`,
  yüzey `#000000`,
  metin `#030200`,
  ana eylem `#000000`
- **Metin/zemin kontrastı:** 20.74 (bu değerin altına inme)
- **Tipografi:** `Foundersgrotesk`,
  gövde `14.4px` /
  ağırlık `400` /
  satır yüksekliği `23.04px`
- Ayrıntı için ZIP'teki dosyalar:

- `design-system.json`
- `design-tokens.json`
- `tokens.css`
- `tailwind.config.js`
- `DESIGN.md`
- `quality.json`

## 5. Bitirmeden önce kontrol et

- [ ] Hiçbir butonda parlama/nabız/gradyan yok
- [ ] Rozetler ölçülen radius hiyerarşisinde
- [ ] Mor-indigo gradyan ve gradyan metin yok
- [ ] Başlıklarda emoji yok, metinlerde lorem yok
- [ ] Tıpatıp aynı 3'lü kart dizisi yok
- [ ] Bütün metinler humanizer'dan geçti
- [ ] Her metin/zemin çifti WCAG AA eşiğini geçiyor
- [ ] Boşluklar tek bir ölçeğe oturuyor
- [ ] Kaynak siteden tek bir cümle kopyalanmadı
- [ ] Hareket tekdüze değil: en az iki farklı giriş tekniği var
- [ ] `prefers-reduced-motion: reduce` açıkken animasyonlar kapanıyor
- [ ] Kaydırmaya bağlı sahneler geri sardığında geri sarıyor
