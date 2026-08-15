# Tasarim sistemi

Bu klasor panelin gorunusunun **tek kaynagi**. Renk, boyut veya bosluk degeri
bilesen dosyalarina elle yazilmaz — hepsi `tokens.css` icindeki degiskenlerden
gelir. Boylece tema degistirmek tek dosyayi degistirmek demek olur.

## Nereden geldi

Referans olarak **Attio** secildi. Gerekcesi: bizim ekranlarimizla ayni
problemi cozuyor (yogun isletme tablosu + kanban satis hunisi + kayit
detayi) ve kategorisindeki en iyi arayuz olarak aniliyor. Jenerik
"mor gradyanli yonetim paneli" gorunumunun tam tersi.

Tasarim **tahmin edilmedi, olculdu**: `design.sitestudyo.com` motoru
15 Agustos 2026'da `https://attio.com` uzerinde 8 sayfa gezdirildi; renk,
tipografi, bosluk, yaricap, golge ve hareket degerleri gercek DOM'dan
cikarildi. Ham cikti `reference/` altinda duruyor.

| Dosya | Ne var |
|---|---|
| `reference/tokens.json` | Olculen ham jetonlar (W3C design-token bicimi) |
| `reference/olcumler/` | Yerlesim izgarasi, yuzeyler, etkilesim durumlari, tema |
| `reference/DESIGN.md` | Motorun urettigi tam tasarim raporu |
| `reference/MOTION.md` `motion.json` | Olculen gecis sureleri ve egrileri |
| `reference/LISANS-UYARISI.md` | Font/ikon/gorsel telif uyarisi — **oku** |
| `tokens.css` | **Bizim** sistemimiz: olcumden turetilmis, uygulamaya uyarlanmis |

`reference/` icindeki ekran goruntuleri, fontlar, ikonlar ve gorseller depoya
**alinmadi**: 8 MB yer tutuyorlardi ve hepsi Attio'nun lisansi altinda.
Olcum verisi kaldi, telifli varliklar kalmadi.

## Olcum, ikinci el kaynaklari yalanladi

Attio hakkinda yazilan hemen her yazi onu "Hunter Black `#1C1D1F` zemin +
teal `#3ABDAF` vurgu, koyu arayuz" diye anlatiyor. **Sitenin bugunku hali
oyle degil.** Olculen degerler:

| | Yazilanlar | Olculen |
|---|---|---|
| Zemin | `#1C1D1F` (koyu) | `#fbfbfb` / `#e0fced` (acik, nane) |
| Vurgu | `#3ABDAF` teal | `#266df0` mavi |
| Ikincil | — | `#00d17e` yesil |
| Tipografi | Inter | Inter ✓ (tek dogrulanan) |

`tokens.css` olculen degerleri esas alir.

## Neden birebir kopya degil

Olculen sey bir **pazarlama sitesi**: 64px basliklar, 16px govde, genis
bosluklar, nane yesili zemin. Bizim yaptigimiz sey gunde saatlerce bakilan
bir calisma araci. Uc yerde bilerek ayrildik:

1. **Yogunluk.** Pazarlama sitesinin 16px govdesi ve genis satirlari yerine
   13-14px ve 36px satir yuksekligi. Bir isletme tablosunda ekranda kac satir
   gorundugu bu urunun en onemli kullanilabilirlik degiskeni.
2. **Nane zemin arayuz rengi degil.** `#e0fced` bir kampanya rengi; sekiz saat
   ona bakilmaz. Vurgu ailesinde tuttuk, zemin `#fbfbfb`.
3. **Koyu tema turetildi.** Olculen sitede koyu tema degiskenleri
   yakalanamadi (`diff` bos dondu). Koyu palet olcum degil, acik paletin ton
   iliskilerini koruyan turetmesidir; kontrastlar WCAG AA'ya gore secildi.
   Tek istisna `--border-default: #2f3336` — o deger gercekten olculdu.

## Kullanim

```css
/* Dogru */
.row:hover { background: var(--bg-hover); }
.score     { font-variant-numeric: tabular-nums; color: var(--grade-hot); }

/* Yanlis — jeton sistemini delip geciyor */
.row:hover { background: #f1f3f5; }
```

Tema degistirme: kok elemana `.light` veya `.dark` sinifi koy. Hicbiri yoksa
isletim sistemi tercihi izlenir (`prefers-color-scheme`).

## Font

Inter **SIL Open Font License** ile geliyor, kendi kopyamizi
[Fontsource](https://fontsource.org/fonts/inter) uzerinden pakete gomuyoruz.
Referans paketindeki `.woff2` dosyalari Attio'nun lisansi altindaydi ve
yeniden dagitilamaz — bu yuzden depoda yoklar.
