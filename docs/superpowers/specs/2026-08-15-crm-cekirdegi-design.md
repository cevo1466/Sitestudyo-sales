# Faz 2 — CRM Çekirdeği (tasarım)

**Tarih:** 15 Ağustos 2026
**Durum:** onaylandı, uygulanmayı bekliyor
**Kapsam:** Companies, Contacts, Leads, Pipelines, Activities, Notes, Tags, Saved Searches
**Kapsam dışı:** işletme keşfi (Faz 3), site analizi (Faz 4), e-posta (Faz 6), arayüz (Faz 7)

---

## 1. Problem

Faz 1 kimlik doğrulama ve veri modelini kurdu ama tabloların hiçbirine dokunan
bir uç nokta yok. Faz 3 işletme keşfi buraya veri yazacak, Faz 7 arayüzü buradan
okuyacak. Bu faz o ikisinin arasındaki sözleşmeyi kuruyor.

Sistemin gerçek yükü CRUD değil, **filtre**. Havuz on binlerce işletmeye çıkacak
ve tek kullanıcı gün boyu şunu yapacak: daralt → bak → toplu işlem uygula.

## 2. Kararlar ve gerekçeleri

### 2.1 Havuz + terfi modeli

Keşfedilen işletme otomatik olarak lead **olmaz**. `companies` av sahası,
`leads` gerçekten peşinde olunan işler.

Neden ayrı tablo: SiteStudyo aynı işletmeye yıllar içinde birden fazla satış
yapabilir (site → bakım → yenileme). Aşama bilgisi işletmenin üzerinde bir alan
olsaydı, ikinci işi kaydetmek birincinin geçmişini ezmek anlamına gelirdi.

Kural: bir işletmenin aynı anda **en fazla bir açık lead'i** olabilir. Kapalı
(kazanıldı/kaybedildi) lead varken yeni lead açılabilir — tekrar satış budur.

### 2.2 Tek kullanıcı

Panel şimdilik tek kişi tarafından kullanılıyor. `ownerId` alanları şemada
duruyor ama arayüz ve uçlar atama ile uğraşmıyor. İkinci kullanıcı geldiğinde
veri modeli hazır olduğu için sadece filtre ve yetki eklenecek.

### 2.3 İmleç tabanlı sayfalama

Havuz on binlere çıkacağı için sayfa numaralı sayfalama kullanılmıyor:
`OFFSET 200000` MySQL'e 200 bin satır taratır ve derin sayfalar kullanılamaz
hale gelir.

Keyset (imleç) yöntemi: sıralama anahtarı + `id` birlikte taşınır.
`id` **zorunlu eşitlik bozucu** — tek başına `leadScore` ile sıralanırsa aynı
puana sahip kayıtlar sayfa sınırında atlanır veya tekrarlanır.

```
cursor = base64url({ v: 1, k: "leadScore:desc", s: <sıralama değeri>, i: <id>, t: <toplam> })
WHERE (leadScore, id) < (:s, :i)  ORDER BY leadScore DESC, id DESC
```

`k` alanı sıralama anahtarını taşır: istemci sıralamayı değiştirip eski imleci
gönderirse sonuç anlamsız olur, bu yüzden uyuşmazlıkta **400 `invalid_cursor`**.

**Sayım (`approxTotal`).** `SELECT COUNT(*)` her sayfada çalıştırılmaz —
imleçle gezilen 20 sayfada 20 kez tam tarama demek olurdu. Sayı ilk istekte
(imleçsiz) bir kez hesaplanır ve imlecin `t` alanında taşınır. Bu yüzden
"yaklaşık": gezinme sırasında havuza yeni kayıt girerse sayı tazelenmez.
Toplu işlem bu değere **güvenmez**, `POST /companies/count` ile o anki kesin
sayıyı yeniden hesaplar.

**Parametre sınırları:**

| Parametre | Değerler |
|---|---|
| `limit` | 1-200, varsayılan 50 |
| `sort` | `leadScore` \| `googleRating` \| `googleReviewsCount` \| `name` \| `firstSeenAt` \| `lastAnalyzedAt`, sonuna `:asc` veya `:desc` (varsayılan `leadScore:desc`) |
| `q` | en fazla 120 karakter; `name` + `address` fulltext |
| `tags` | etiket slug listesi, **VE** mantığı (hepsini taşıyanlar) |

Sıralanabilir alanların hepsinde ya indeks var ya da `id` ile birlikte
indekslenmiş — imleç karşılaştırması indeks kullanmazsa sayfalama yavaşlar.
`googleRating` ve `firstSeenAt` için Faz 2'de indeks eklenecek.

### 2.4 Filtrenin tek doğruluk kaynağı: `CompanyQuery`

Aynı filtre üç yerde kullanılıyor: liste, toplu işlem, kayıtlı arama. Filtre
mantığı birden fazla yere yazılırsa biri güncellenip diğeri unutulur ve
sistem **sessizce yanlış** çalışır: liste 3.400 gösterir, toplu işlem 3.600
kayda dokunur. Kimse fark etmez.

Bu yüzden filtre → sorgu çevirimi tek bir sınıfta:

```
company-query.ts
  toWhere(filter)      -> Prisma.CompanyWhereInput
  toOrderBy(sort)      -> Prisma.CompanyOrderByInput[]
  encodeCursor(row, sort) / decodeCursor(str, sort)
```

Dışarıya bu üç fonksiyon açılır. Fulltext mi LIKE mı kullanıldığı, imlecin
nasıl kodlandığı, etiket join'inin nasıl kurulduğu çağıranı ilgilendirmez.

### 2.5 Toplu işlem ID değil FİLTRE alır

3.400 kaydı seçtiğinde 3.400 ID göndermek pratik değil ve imleçli listede
istemci zaten hepsini görmemiştir.

```
POST /companies/bulk
{
  "filter": { "city": "Ankara", "websiteStatus": "NO_WEBSITE" },
  "excludeIds": ["..."],          // "hepsi ama şu üçü hariç"
  "action": "tag",
  "payload": { "tagIds": ["..."] },
  "confirmCount": 3400            // isteğe bağlı güvenlik kilidi
}
```

**`confirmCount`:** ekranda 3.400 görüp tıkladın; arada yeni bir tarama 200
kayıt eklediyse sunucu **409 `count_mismatch`** döner ve hiçbir şey yazmaz.
Gördüğün ile yaptığın her zaman aynı küme olur.

**`promote` üst sınırı 200:** 3.400 lead kanban'ı kullanılamaz hale getirir.
Sınır aşılırsa **400 `bulk_limit_exceeded`** döner. Sessizce ilk 200'ü almak
yasak — kullanıcı neyin işlendiğini bilmelidir.

Desteklenen eylemler: `tag`, `untag`, `promote`, `dnc`.
CSV dışa aktarma bilinçli olarak kapsam dışı (istenmedi).

### 2.6 Zaman tünelinin tek yazma kapısı

`activity.service.ts` dışında hiçbir yer `prisma.activity.create` çağırmaz.

Alternatifi her serviste ayrı ayrı kayıt atmaktı; o zaman bir olayın
kaydedilmeyi unutulması kaçınılmaz olur ve zaman tüneli sessizce eksik kalır —
üstelik eksikliği ancak birine "biz bunlara ne zaman yazmıştık?" diye
sorulduğunda anlaşılır.

`activities` yalnızca eklenir, düzenlenmez/silinmez (denetim izi).
`notes` ise düzenlenebilir ve silinebilir (kullanıcının kendi çalışma notu).

## 3. Modül yapısı

```
backend/src/modules/
├── companies/
│   ├── company-filter.dto.ts        zod şeması — filtrenin sözleşmesi
│   ├── company-query.ts             ★ filtre→sorgu+imleç (tek kaynak)
│   ├── companies.service.ts         liste, detay, güncelle
│   ├── company-bulk.service.ts      filtre bazlı toplu işlem
│   ├── companies.controller.ts
│   └── companies.module.ts
├── contacts/
├── leads/                           terfi, aşama taşıma, kapatma
├── pipelines/                       huni ve aşama tanımları
└── crm-shared/
    ├── activity.service.ts          ★ zaman tünelinin tek yazma kapısı
    ├── tags.service.ts
    └── crm-shared.module.ts
```

`saved-searches` ve `notes` uçları `companies` ve `crm-shared` içine yerleşir;
kendi başlarına modül olacak kadar mantık taşımıyorlar.

## 4. API sözleşmesi

Tümü `/api/v1` altında ve JWT ister.

```
GET   /companies          ?q &city &district &sector &websiteStatus &leadGrade
                          &tags &minScore &maxScore &hasPhone &hasEmail
                          &cursor &limit &sort
                          -> { items[], nextCursor, approxTotal }
GET   /companies/:id      -> şirket + kişiler + son analiz + açık lead + zaman tüneli
PATCH /companies/:id      -> elle düzeltme (ad, telefon, sektör, website)
POST  /companies/count    { filter } -> { matched }
POST  /companies/bulk     (bkz. §2.5)

GET    /contacts ?companyId
POST   /contacts
PATCH  /contacts/:id
DELETE /contacts/:id
POST   /contacts/:id/primary

POST  /leads              { companyId, pipelineId?, title, value? }   TERFİ
GET   /leads              ?stageId &companyId &status
PATCH /leads/:id
POST  /leads/:id/move     { stageId, note? }
POST  /leads/:id/close    { won, lostReason? }

GET  /pipelines
POST /pipelines
PUT  /pipelines/:id/stages      (sıralama dahil toplu güncelleme)

GET  /activities ?companyId|leadId       (sayfalı, yalnız ekleme)
POST /activities
GET  /notes ?companyId|leadId
POST /notes | PATCH /notes/:id | DELETE /notes/:id
GET  /tags | POST /tags | DELETE /tags/:id
GET  /saved-searches | POST | DELETE /saved-searches/:id
```

### Hata kodları (Faz 1 zarfına eklenenler)

| Kod | HTTP | Ne zaman |
|---|---|---|
| `lead_already_open` | 409 | İşletmenin zaten açık bir lead'i var |
| `bulk_limit_exceeded` | 400 | `promote` 200 sınırını aştı |
| `count_mismatch` | 409 | `confirmCount` ile gerçek sayı tutmuyor |
| `stage_not_in_pipeline` | 400 | Aşama, lead'in hunisine ait değil |
| `invalid_cursor` | 400 | İmleç bozuk veya farklı sıralamaya ait |

## 5. Veri akışı

**Terfi** — tek transaction:
```
açık lead kontrolü → varsa 409 lead_already_open
INSERT lead (stage = huninin ilk aşaması, stageEnteredAt = now)
INSERT activity (SYSTEM, "huniye alındı")
COMMIT                      ← yarım kalırsa ikisi de yazılmaz
```

**Aşama taşıma:**
```
aşama bu huniye ait mi? → değilse 400 stage_not_in_pipeline
UPDATE lead SET stageId, stageEnteredAt = now
INSERT activity (STAGE_CHANGE, meta: { from, to })
kapanış aşamasıysa: closedAt = now
```

`stageEnteredAt` her geçişte sıfırlanır — bir işin bir aşamada ne kadar
beklediğini ölçebilmek için. Toplam yaşı `createdAt` verir.

**Toplu işlem:**
```
matched = count(filter)  →  confirmCount uyuşmuyorsa 409, HİÇBİR ŞEY YAZMA
promote ve matched > 200 →  400, HİÇBİR ŞEY YAZMA
partiler halinde uygula (500'lük) → { matched, applied, skipped }
```

## 6. Test stratejisi

**Bu tasarımın var oluş sebebi olan test:**

> Aynı filtre için listenin döndürdüğü kayıt sayısı ile `count`/`bulk`
> uçlarının bulduğu sayı **zorunlu olarak eşittir**.

```
500 şirket üret (çeşitli şehir/sektör/durum/puan)
12 farklı filtre kombinasyonu için:
  GET /companies imleçle sonuna kadar gezilir  -> N benzersiz kayıt
  POST /companies/count aynı filtreyle          -> M
  N === M olmalı
```

Bu test geçtiği sürece §2.4'te anlatılan sessiz bozulma imkânsızdır.

**Diğer zorunlu testler:**

- *İmleç bütünlüğü:* 500 kaydı 50'şer gezerken hiçbir kayıt atlanmaz veya
  iki kez gelmez — aynı `leadScore` değerine sahip kayıtlar dahil
- *İmleç doğrulaması:* bozuk imleç 400 verir, çökmez; farklı sıralamaya ait
  imleç reddedilir
- *Terfi bütünlüğü:* aktivite yazımı başarısız olursa lead de yazılmaz
- *Tekrar satış:* kapalı lead varken yeni lead açılabilir; açık lead varken
  açılamaz (409)
- *`confirmCount` uyuşmazlığında hiçbir kayıt değişmez* (öncesi/sonrası
  veritabanı durumu karşılaştırılır)
- *`promote` sınırı:* 201 kayıtta 400 döner ve **tek bir lead bile açılmaz**
- *Aşama doğrulaması:* başka hunini aşamasına taşıma reddedilir
- *Zaman tüneli:* her aşama geçişi tam olarak bir `STAGE_CHANGE` üretir

Testler Faz 1'deki düzeni izler: `*.spec.ts` birim, `test/*.e2e-spec.ts`
gerçek MariaDB'ye karşı.

## 7. Riskler

| Risk | Önlem |
|---|---|
| Fulltext arama Türkçe karakterde zayıf kalabilir | `nameNormalized` alanı zaten var; fulltext yetmezse onun üzerinden prefix araması. Ölçmeden karar verilmeyecek |
| Toplu etiketleme 3.400 satır INSERT eder | 500'lük partiler, `skipDuplicates` |
| `approxTotal` büyük havuzda yavaşlar | Sayım yalnızca ilk sayfada; imleçli sayfalarda taşınır |
| Şema değişikliği gerekirse | Bu faz **yeni tablo eklemiyor**; Faz 1 şeması yeterli. Tek migration: sıralama için `googleRating` ve `firstSeenAt` indeksleri |
| `hasEmail` filtresi `contacts` tablosuna join gerektirir | `contacts(companyId)` ve `contacts(email)` indeksleri var. Yine de bu filtre diğerlerinden yavaş olacak; ölçülüp gerekirse `companies` üzerinde türetilmiş bir bayrağa taşınacak |

## 8. Kapsam dışı (bilinçli)

- CSV dışa aktarma — istenmedi
- Kullanıcı atama / rol bazlı satır yetkisi — tek kullanıcı
- Özel alanlar (custom fields) — gerçek ihtiyaç görülmeden eklenmeyecek
- Lead için ayrı huni sihirbazı — varsayılan huni yeterli
