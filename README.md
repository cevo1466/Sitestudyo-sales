# SiteStudyo Sales OS

SiteStudyo'nun musteri bulma, site kalitesi analizi, puanlama ve satis hunisi takibini
tek yerde toplayan sistem. Sunucu tarafi VDS'te surekli calisir; masaustu istemcisi
herhangi bir bilgisayara kurulup **kendi VDS adresini girerek** baglanir.

```
Masaustu Istemci (Tauri)  ──HTTPS/WSS──▶  nginx (mevcut)  ──▶  API + Worker
                                                                 │
                                                        Postgres 16 + Redis 7
```

## Depo yapisi

| Klasor | Ne var |
|---|---|
| `backend/` | NestJS modüler monolit — API + BullMQ isçileri (tek imaj, `ROLE` ile ayrilir) |
| `desktop-client/` | React + Vite + Tauri masaustu uygulamasi |
| `packages/shared/` | Backend ve istemcinin **ortak** tip/DTO tanimlari |
| `deploy/` | nginx vhost sablonu, sertifika notlari |
| `docker-compose.yml` | postgres + redis + backend + worker (nginx **yok**, bkz. asagi) |

## Sunucu kurulumu (VDS)

```bash
git clone <ozel-depo> sitestudyo-sales-os
cd sitestudyo-sales-os

cp .env.example .env                 # Postgres sifresi, portlar
cp backend/.env.example backend/.env # JWT, sifreleme anahtari, Apify token

# Sirlari uret:
openssl rand -base64 48   # JWT_SECRET ve JWT_REFRESH_SECRET icin (iki farkli)
openssl rand -hex 32      # ENCRYPTION_KEY icin (TAM 32 bayt olmali)

docker compose up -d --build
docker compose exec backend npx prisma migrate deploy
docker compose exec backend npm run seed      # admin kullanici + varsayilan huni

curl http://127.0.0.1:5080/api/v1/health
```

### Neden compose'da nginx yok?

Bu VDS'te **80 ve 443 portlari mevcut `hosting_nginx` konteynerinde** ve sunucudaki tum
siteler oradan geciyor. Kendi nginx'imizi kaldirmak butun siteleri dusururdu. Bunun yerine:

1. `deploy/nginx/api.sitestudyo.com.conf` dosyasini `/var/www/nginx-vhosts/` altina kopyala
2. `sudo docker exec hosting_nginx nginx -t` ile dogrula
3. `sudo docker exec hosting_nginx nginx -s reload`

vhost, backend konteynerine `hostingpanel_hosting-network` agi uzerinden **konteyner adiyla**
(`salesos_backend:5080`) ulasir. Compose'un yayinladigi portlar sadece `127.0.0.1`'e bagli,
yani internetten dogrudan erisim yok.

Sertifika icin `deploy/certbot-webroot.md` — bu sunucuda certbot'un `--nginx` eklentisi
**calismaz** (nginx konteynerin icinde), webroot yontemi kullanilir.

## Gelistirme (yerel)

```bash
docker compose up -d postgres redis    # sadece altyapi
cd backend && npm install
npx prisma migrate dev && npm run seed
npm run start:dev                      # http://127.0.0.1:5080
```

## Masaustu uygulamasi

Installer'lar **GitHub Actions**'ta uretilir (`.github/workflows/desktop-release.yml`);
bu VDS'te Rust toolchain yok ve Linux'tan Windows'a Tauri capraz derlemesi calismaz.

```bash
git tag desktop-v0.1.0 && git push --tags
# -> Release'e .msi (Windows), .dmg (macOS), .AppImage/.deb (Linux) dusar
```

Uygulama ilk acilista **Sunucu Baglantisi** ekrani gosterir: VDS adresi girilir,
`/api/v1/health` ile dogrulanir, sonra giris ekrani acilir.

## Guvenlik kurallari

- Istemci Postgres'e **asla** dogrudan baglanmaz; her sey API uzerinden.
- Mail hesabi sifreleri veritabaninda AES-256-GCM ile sifreli (`ENCRYPTION_KEY`).
- Refresh token'lar rotasyonlu; ayni token ikinci kez kullanilirsa tum oturum ailesi iptal.
- Loglarda token/sifre/apiKey alanlari maskelenir.
- Gonderim oncesi **Do-Not-Contact** listesi zorunlu kontrol edilir.
- `.env` dosyalari `.gitignore`'da. Ilk push oncesi: `git check-ignore -v backend/.env`

## Faz durumu

| Faz | Kapsam | Durum |
|---|---|---|
| 0 | Mimari analiz | ✅ |
| 1 | Docker + sema + kimlik dogrulama | 🔨 |
| 2 | CRM cekirdegi | ⏳ |
| 3 | Isletme kesfi (Apify/Google Places) | ⏳ |
| 4 | Site analizoru + lead puanlama | ⏳ |
| 5 | Iletisim (e-posta) tarayicisi | ⏳ |
| 6 | SMTP/IMAP | ⏳ |
| 7 | Masaustu arayuzu | ⏳ |
| 8 | sitestudyo.com gelen lead API'si | ⏳ |
| 9 | Gorevler ve takip otomasyonlari | ⏳ |
| 10 | Teklif motoru, analitik | ⏳ |
