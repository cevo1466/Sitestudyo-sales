# TECH.md — Teknoloji Dökümü

**Hedef:** https://folk.app

Bu döküm ölçüme dayanır. Her bulgunun yanında hangi katmandan geldiği ve
kanıt sınıfı yazılıdır. Sınıflar:

| Sınıf | Anlamı |
|---|---|
| **Kanıtlı** | Çalışan sayfa kendi söyledi ya da dosya içinde yazıyor. Tartışılmaz. |
| **Güçlü işaret** | Neredeyse kesin, ama kütüphane kendini bildirmedi. |
| **Zayıf işaret** | Yalnız sınıf adı. Tek başına "kullanıyor" demek için YETERSİZ. |

## Özet yığın

`React`

Bu satır YALNIZ kanıtlı ve güçlü işaretlerden kuruldu; zayıf işaretler
aşağıda ayrı bölümde.

## Doğrulanmış teknolojiler

| Teknoloji | Kategori | Sınıf | Katman | Sürüm | Sürümün kaynağı |
|---|---|---|---|---|---|
| **Cloudflare** | `cdn_security` | Kanıtlı | sunucu başlığı | — | — |
| **Google Analytics 4** | `analytics` | Güçlü işaret | asset URL yolu, HTML yapısı / meta | — | — |
| **Google Fonts** | `font_service` | Güçlü işaret | asset URL yolu | — | — |
| **Google Tag Manager** | `tag_manager` | Güçlü işaret | asset URL yolu, HTML yapısı / meta | — | — |
| **Parcel** | `build_tool` | Kanıtlı | çalışan sayfa (runtime probe) | — | — |
| **React** | `frontend_framework` | Kanıtlı | çalışan sayfa (runtime probe) | — | — |
| **Webflow** | `site_builder` | Kanıtlı | çalışan sayfa (runtime probe), HTML yapısı / meta | — | — |
| **jQuery** | `javascript_library` | Kanıtlı | çalışan sayfa (runtime probe) | 3.5.1 | çalışan sayfa (runtime probe) |
| **webpack** | `build_tool` | Kanıtlı | çalışan sayfa (runtime probe), indirilen dosya içeriği | — | — |

## Görülebilirlik

**Sunucu tarafı:** Görülemiyor — CDN/proxy arkasında
  - Kanıt: `server: cloudflare`

Bu, "backend yok" demek DEĞİLDİR. CDN/proxy katmanı kaynak
sunucunun imzasını gizlediği için ölçüm yapılamadı.

## Bu siteyi yeniden yapsam (ÇIKARIM)

> ⚠️ Bu bölüm ölçüm DEĞİL, yukarıdaki ölçümlerden yapılan bir çıkarımdır.

Ölçülen yığın `React` olduğuna göre benzer bir sonuç
aynı ailede kalarak elde edilebilir. Kararı kendi ekibinizin bildiği
yığına göre verin; bu satır bir tavsiye değil, gözlemin özetidir.
