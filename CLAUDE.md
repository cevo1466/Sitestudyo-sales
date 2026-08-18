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
