# SiteStudyo Sales OS

Müşteri bulma, site kalitesi analizi, lead puanlama ve satış hunisi takibini tek yerde
toplayan sistem. Sunucu tarafı VDS'te sürekli çalışır; masaüstü uygulaması herhangi bir
bilgisayara kurulup **kendi sunucu adresini girerek** bağlanır.

**Durum:** on fazın tamamı bitti. Sistem canlıda, gerçek veriyle çalışıyor.

| | |
|---|---|
| Havuzdaki işletme | **2.045** (hepsinin web sitesi yok) |
| Telefon numarası olan | 1.567 |
| Test | 114 birim + 93 uçtan uca = **207**, hepsi geçiyor |
| API | https://api.sitestudyo.com |
| Masaüstü uygulaması | Releases → `.msi` / `.dmg` / `.AppImage` / `.deb` |

```
Masaüstü uygulaması (Tauri)
        │  HTTPS
        ▼
  nginx (mevcut hosting_nginx konteyneri, 80/443)
        │  172.19.0.1:5080
        ▼
  NestJS API  ──▶  MariaDB (salesos)  +  Redis
```

## Fazlar

| Faz | Kapsam | Durum |
|---|---|---|
| 0 | Mimari analiz | ✅ |
| 1 | Docker, şema, kimlik doğrulama | ✅ |
| 2 | CRM çekirdeği (işletme, kişi, huni, zaman tüneli) | ✅ |
| 3 | İşletme keşfi (Apify / Google Places) | ✅ |
| 4 | Site analizörü + lead puanlama | ✅ |
| 5 | İletişim (e-posta) tarayıcısı | ✅ |
| 6 | SMTP gönderim / IMAP cevap eşleştirme | ✅ |
| 7 | Masaüstü arayüzü | ✅ |
| 8 | sitestudyo.com gelen lead API'si | ✅ |
| 9 | Görevler ve takip | ✅ |
| 10 | Analitik panosu | ✅ |

## Depo yapısı

| Klasör | Ne var |
|---|---|
| `backend/` | NestJS modüler monolit — 15 modül, Prisma + MariaDB |
| `desktop-client/` | React + Vite + Tauri 2 masaüstü uygulaması |
| `packages/design/` | Tasarım jetonları + attio.com ölçüm çıktısı |
| `deploy/` | nginx vhost şablonu, sertifika adımları |
| `docs/superpowers/` | Tasarım dokümanı ve uygulama planı |
| `docker-compose.yml` | redis + backend + worker (**Postgres ve nginx yok**, aşağı bak) |

## Sunucu kurulumu

```bash
git clone git@github.com:cevo1466/Sitestudyo-sales.git
cd Sitestudyo-sales

make setup                    # .env şablonlarını kopyalar
# Sırları üret:
openssl rand -base64 48       # JWT_SECRET ve JWT_REFRESH_SECRET (iki farklı)
openssl rand -hex 32          # ENCRYPTION_KEY (TAM 32 bayt olmalı)

make up
docker compose exec backend npx prisma migrate deploy
docker compose exec backend npm run seed   # admin + huni + puanlama kuralları

curl http://127.0.0.1:5080/api/v1/health
```

### Neden kendi Postgres'i ve nginx'i yok

Bu VDS'te **80 ve 443 portları mevcut `hosting_nginx` konteynerinde** ve sunucudaki tüm
siteler oradan geçiyor; kendi nginx'imizi kaldırmak hepsini düşürürdü. Ayrıca 3,9 GB RAM
var ve swap dolu — ayrı bir Postgres konteyneri ~384 MB yerdi. Onun yerine sunucuda zaten
çalışan **MariaDB'de ayrı bir `salesos` veritabanı** kullanılıyor; panelin kendi
veritabanına erişim yok.

Dışarıya açılış `deploy/nginx/api.sitestudyo.com.conf` ile yapılır. Sertifika adımları
`deploy/certbot-webroot.md` içinde — **sıra önemli**, 443 bloğunu sertifikadan önce
açmak nginx'i başlatmaz ve sunucudaki bütün siteleri düşürür.

## Masaüstü uygulaması

Kurulum dosyaları GitHub Actions'ta üretilir (`.github/workflows/desktop-release.yml`).
`.msi` yalnızca Windows'ta derlenebilir; VDS Linux ve üzerinde Rust yok.

```bash
git tag desktop-v0.1.0 && git push origin desktop-v0.1.0
# -> Releases altında taslak sürüm: .msi, .dmg, .AppImage, .deb
```

İlk açılışta **sunucu adresi** sorulur. Buraya `https://api.sitestudyo.com` yazılır,
"Bağlantıyı test et" ile doğrulanır ve adres o bilgisayara kaydedilir.

> Kurulum dosyaları **imzasız**. Windows "bilgisayarınızı korudu" uyarısı verir —
> "Daha fazla bilgi" → "Yine de çalıştır". Kod imzalama sertifikası alınırsa kalkar.

## Ekranlar

- **İşletmeler** — imleçli liste, filtre, arama. *Kanıt* sütunu yorum hacmini gösterir:
  bu veride gerçek ayırt edici o ve satış argümanının kendisi de o.
- **Huni** — kanban, aşama başına toplam tutar, 7 günden uzun bekleyen iş işaretli.
- **Ayarlar** — puanlama ağırlıkları düzenlenebilir, erişilebilir tavan gösterilir.

## Bilinmesi gerekenler

**Site analizörü ve iletişim tarayıcısı şu an boşta.** Havuzdaki 2.045 kaydın hepsinin
web sitesi yok — analiz edilecek adres, taranacak sayfa yok. İkisi de kurulu ve gerçek
sitelerde doğrulandı (`scripts/try-analyzer.ts`, `scripts/try-crawler.ts`), ama filtresiz
bir tarama yapılana kadar iş görmeyecekler. Boş dönmüyorlar, açıkça
"sitesi olan kayıt yok" diyorlar.

**Hiçbir kayıt "sıcak" görünmüyor ve bu bir hata değil.** Sitesi olmayan bir işletme,
site sorunu puanlarını (mobil uyumsuzluk, SSL, iletişim formu) alamaz — o puanlar site
gerektiriyor. Erişilebilir tavan bu yüzden 75'te kalıyor ve "Sıcak" eşiği 70. Ayarlar
ekranı bu sayıyı açıkça gösterir; ağırlıklar oradan değiştirilebilir.

**Keşif kredisi tükendi.** İki Apify hesabının aylık $5'ı da harcandı (toplam $10,92 →
2.045 işletme). Kota her ay sıfırlanıyor.

## Güvenlik kuralları

- Masaüstü uygulaması veritabanına **asla** doğrudan bağlanmaz; her şey API üzerinden.
- Mail hesabı şifreleri AES-256-GCM ile şifreli (`ENCRYPTION_KEY`).
- Refresh token'lar rotasyonlu; aynı token ikinci kez kullanılırsa tüm oturum ailesi iptal.
- Gönderim öncesi **Do-Not-Contact** listesi zorunlu kontrol edilir.
- Ziyaretçi IP'leri ham saklanmaz, tuzlu hash olarak tutulur (KVKK).
- Loglarda token/şifre/apiKey alanları maskelenir.
- `.env` dosyaları `.gitignore`'da. Push öncesi: `git check-ignore -v backend/.env`

## Testler

```bash
cd backend
npm test                                   # 114 birim testi
DATABASE_URL="mysql://salesos:...@127.0.0.1:3306/salesos" npm run test:e2e   # 93 e2e
```

e2e testleri **ayrı** `salesos_test` veritabanında koşar (`test/setup-env.ts`). Canlı
veritabanında koşsalardı gerçek kayıtlar kesin sayı doğrulayan testleri bozardı — bir
kez bozdu, izolasyon o yüzden var.
