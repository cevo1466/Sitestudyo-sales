# SiteStudyo Sales OS — Ortak Proje Hafızası

## Kanonik proje bilgileri

- Proje kökü: `/home/melih/sitestudyo-sales-os`
- Canlı API: `https://api.sitestudyo.com` → host köprüsündeki `5080` portu
- Yığın: NestJS + Prisma + MariaDB (`salesos`) + Redis + Tauri masaüstü istemcisi
- Parolalar `argon2id` ile hashlenir; düz parola hiçbir belgeye, loga veya repoya yazılmaz.
- Kimlik bilgisi değişikliğinde ilgili `refresh_tokens` kayıtları iptal edilmelidir.
- Sunucunun 80/443 portlarını `hosting_nginx` tutar; Sales OS kendi nginx'ini açmaz.
- Bu sunucuda yakın zamanda OOM yaşandığı için backend/worker yeniden başlatılmadan önce bellek ve mevcut yük kontrol edilir.

## 2026-08-18 — Admin parola yenileme

- `admin@sitestudyo.com` hesabının aktif `ADMIN` olduğu canlı `salesos` veritabanında doğrulandı.
- Kullanıcının istediği yeni parola, uygulamanın üretim parametreleriyle Argon2id hashlenerek kaydedildi; parola değeri hafızaya alınmadı.
- Hesaba ait 58 yenileme oturumu silindi. Bağımsız hash doğrulaması geçti ve kalan yenileme oturumu sayısı `0` görüldü.
- Kaynak dosya değiştirilmedi. Kontrol sırasında `https://api.sitestudyo.com/api/v1/health` yanıtı `502` idi; yeniden başlatılmış hostta `salesos_backend`, `salesos_worker` ve `salesos_redis` konteynerleri mevcut değildi.
- Kapanış riski: parola veritabanında hazır olsa da API tekrar ayağa kalkana kadar masaüstü istemciden giriş yapılamaz. Önceki OOM olayları nedeniyle bu ayrı bir servis kurtarma işi olarak ele alınmalıdır.

## 2026-08-18 — API kurtarma ve canlı giriş doğrulaması

- Sunucu yeniden başladıktan sonra Sales OS konteynerleri ve yerel imajları yoktu; nginx bu nedenle boş `5080` portuna proxy yapıp `502` dönüyordu.
- Backend imajı yeniden üretildi. İlk açılışta Dockerfile'ın `dist/main.js` çalıştırdığı, Nest build'in gerçek çıktısının `dist/src/main.js` olduğu kanıtlandı.
- `backend/Dockerfile` ve `backend/package.json` başlangıç yolu `dist/src/main.js` olarak düzeltildi. `backend/src/config/runtime-entrypoint.spec.ts` önce kırmızı, sonra yeşil çalıştırıldı.
- Üretim `backend/.env` içindeki veritabanı ana makinesi, sırları göstermeden, konteyner ağı için `127.0.0.1` yerine `hosting_mysql` yapıldı. Bu dosya git tarafından yok sayılır.
- `salesos_backend` ve `salesos_redis` yeniden kuruldu; ikisi de sağlıklı. Yerel ve dış health endpoint'leri `200` döndü.
- `admin@sitestudyo.com` hesabıyla kullanıcının istediği parola üzerinden canlı HTTPS giriş `200`, `/auth/me` `200`, test oturumu kapatma `204` döndü. Parola/token hafızaya veya loga yazılmadı.
- Birim testleri: `11/11` suite, `192/192` test geçti.
- Worker aynı imajla açılınca `ROLE=worker` modunda başarıyla başlatılıp `0` koduyla hemen çıktığı için restart döngüsüne girdi; kaynak tüketmemesi için durduruldu. Giriş/API işlevini etkilemez, ayrı bir worker yaşam döngüsü bug'ı olarak kalır.

## 2026-08-19 — Public masaüstü indirme linkleri

- Kök neden: `desktop-v0.2.7` paketleri yalnız GitHub Actions artifact'i olarak kalmıştı. Artifact linkleri oturum ister ve geçicidir; GitHub'da yayınlanmış bir Release olmadığı için linki alan dış kullanıcı dosyaları göremiyor/indiremiyordu.
- `.github/workflows/desktop-release.yml` artık üç platformun build'i bittikten sonra artifact'leri birleştirip gerçek GitHub Release'e yükleyen `publish` job'ına sahiptir. Release önce draft hazırlanır, tüm dosyalar yüklendikten sonra public/latest yapılır.
- `GH_REPO=${{ github.repository }}` zorunludur: publish job'ında checkout yoktur; bu değişken olmazsa `gh` "not a git repository" ile çıkar. `deploy/test-desktop-release-workflow.sh` bu davranışları regresyon testi olarak denetler.
- Mevcut `desktop-v0.2.7` tek-seferlik Actions onarımıyla public yayımlandı. Anonim Release sayfası ve Windows `.exe`, macOS `.dmg`, Linux `.AppImage`/`.deb` linkleri ayrı ayrı HTTP 200 doğrulandı; Release toplam 8 varlık içeriyor.
- Release: `https://github.com/cevo1466/Sitestudyo-sales/releases/tag/desktop-v0.2.7`. Sunucudaki imzalı otomatik güncelleme kanalı (`https://api.sitestudyo.com/updates/latest.json`) değişmedi ve 200 dönüyor.
- Kullanıcının son kontrolünde Debian paketi doğrudan `https://github.com/cevo1466/Sitestudyo-sales/releases/download/desktop-v0.2.7/SiteStudyo.Sales.OS_0.2.7_amd64.deb` üzerinden anonim HTTP 200 ile tekrar doğrulandı.

## 2026-08-19 — Sunucu disk kullanım denetimi

- Kök disk 77 GB; 60 GB kullanılıyor, 14 GB boş (yaklaşık %82 doluluk).
- En büyük tek Docker imajı kullanılmayan `ghcr.io/usestrix/strix-sandbox:1.3.0` (5.9 GB). Docker toplamında 6.85 GB imaj alanı ve 3.955 GB build cache geri kazanılabilir görünüyor; toplam potansiyel Docker temizliği yaklaşık 10.8 GB.
- `/home/melih/.cache` 3.9 GB: Playwright 2.4 GB, Camoufox 1.3 GB. Bunlar geliştirme/otomasyon önbellekleri.
- Aktif servis imajları: hosting frontend 1.16 GB, hosting backend 1.08 GB, Sales OS backend/worker ortak 846 MB, MariaDB 458 MB.
- Journal 224 MB; `/var/www` içerikleri içinde en büyüğü ayd.sitestudyo.com 740 MB ve gparty.sitestudyo.com 467 MB.
- Bu denetimde hiçbir dosya, Docker imajı veya cache silinmedi. Temizlik ayrı bir onaylı işlem olmalıdır; özellikle Strix imajının gerçekten kullanılmadığı tekrar doğrulanmadan kaldırılmamalıdır.
- Ek tüketiciler: `/root/.cache` 3.1 GB (Playwright 1.9 GB, uv 538 MB, pip 234 MB), `/root/.codex` 952 MB (packages 350 MB, sessions 294 MB), `/root/.agent-browser` 759 MB, `/home/claude/.cache` 909 MB (Playwright 641 MB), `/root/.local` 434 MB, `/var/log` 424 MB (journal 225 MB), `hostpanel-release` 737 MB ve eski recovery klasörü 158 MB.
- `/var/www` yaklaşık 1.4 GB; başlıca `ayd.sitestudyo.com` 740 MB, `gparty.sitestudyo.com` 467 MB ve `updates` 170 MB. `/var/lib` Docker hariç yaklaşık 393 MB (apt 311 MB, PostgreSQL 82 MB).
- `df` ile `docker system df` arasında kalan büyük farkın containerd overlay snapshot katmanlarından gelmesi muhtemel; `/var/lib/containerd` elle silinmemeli. Kontrollü Docker/ctr snapshot incelemesi ve prune planı gerekir.
- Yerel PAT yalnız okuma yetkili bırakıldı; kalıcı yazma izni verilmedi. Release yayınlama, workflow'un dar kapsamlı `contents: write` yetkisiyle yapılır.
