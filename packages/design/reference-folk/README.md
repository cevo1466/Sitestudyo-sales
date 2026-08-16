# folk.app ölçümü — 16 Ağustos 2026

Bu klasör **ham analiz çıktısını içermez**, yalnızca ölçülen değerlerin
özetini (`olcum.json`) tutar. Sebebi aşağıda.

Ölçüm `designstudyo.com` motoruyla yapıldı: 8 sayfa gezildi, değerler gerçek
DOM'dan çıkarıldı. Ham çıktı (13 MB, ekran görüntüleri, indirilen varlıklar,
sayfa kaynakları) sunucuda `/home/melih/salesos-design-raw-folk` altında
duruyor.

## Neden ham çıktı depoda değil

İlk denemede tamamı commit edildi ve **gitleaks CI adımı kırmızıya döndü**.
Bulunan şey bizim bir sırrımız değildi: analiz motoru folk.app'in kendi
sayfasındaki üçüncü taraf servis anahtarını (Weglot) `tech-stack.json`
dosyasına kopyalamıştı.

Anahtar zaten folk.app'in herkese açık JavaScript dosyasında duruyor, yani
sızdırılmış bir şey yok. Ama başkasının anahtarını kendi depomuzda taşımanın
bir gerekçesi de yok, üstelik 6,6 MB yer kaplıyordu.

**Kural:** bir site analizinin ham çıktısını depoya koyma. Analiz edilen
sitenin istemci tarafı anahtarlarını beraberinde getirir. Ölçülen değerleri
özetle, gerisini sunucuda bırak.

## Ölçüm ne dedi

| Ne | Değer |
|---|---|
| Köşe yarıçapı `0px` | **%97.3** (hap `1000px` yalnızca %1.2) |
| Kenarlık | 1px, %100; rengi neredeyse siyah (`#030200`, %88.5) |
| Yazı ağırlığı | 400 → %84, 500 → %14, **700 → %1.7** |
| Gövde puntosu | 14.4px → %68, sonra 15px ve 13px |
| Satır yüksekliği | 23.04px (14.4px üzerinde 1.6) |
| Harf aralığı | 1px → %57 (küçük büyük harf etiketlerde) |
| Geçiş süresi | 0.1s / 0.15s / 0.2s |
| Gölge | tek bir yumuşak gölge |
| Boşluk | 24px ve 16px baskın |

## Bunlardan ne alındı, ne alınmadı

Alınanlar `packages/design/tokens.css` içinde, hangi değerin nereden geldiği
oradaki yorumlarda yazılı: yarıçap felsefesi, ağırlık disiplini (700 artık
kullanılmıyor), kenarlık yaklaşımı, küçük etiketlerdeki harf aralığı.

Alınmayanlar: folk.app bir **pazarlama sitesi**. 144px kenar boşlukları ve
112px bölüm araları bizim ekranlarımıza uymaz; Sales OS günde saatlerce
bakılan yoğun bir tablo. Yoğunluk değerleri (satır yüksekliği 36px, gövde
13px) korundu.

Vurgu rengi kararı da buradan çıktı: ölçümde renkli bir vurgu neredeyse yok,
kontrast var. Mor dolgulu düğmeler `--ink` jetonuna taşındı.
