# TECH.md — Teknoloji Dökümü

**Hedef:** https://linear.app

Bu döküm ölçüme dayanır. Her bulgunun yanında hangi katmandan geldiği ve
kanıt sınıfı yazılıdır. Sınıflar:

| Sınıf | Anlamı |
|---|---|
| **Kanıtlı** | Çalışan sayfa kendi söyledi ya da dosya içinde yazıyor. Tartışılmaz. |
| **Güçlü işaret** | Neredeyse kesin, ama kütüphane kendini bildirmedi. |
| **Zayıf işaret** | Yalnız sınıf adı. Tek başına "kullanıyor" demek için YETERSİZ. |

## Özet yığın

`Next.js 1.0.0-beta.4 + React`

Bu satır YALNIZ kanıtlı ve güçlü işaretlerden kuruldu; zayıf işaretler
aşağıda ayrı bölümde.

## Doğrulanmış teknolojiler

| Teknoloji | Kategori | Sınıf | Katman | Sürüm | Sürümün kaynağı |
|---|---|---|---|---|---|
| **Chart.js** | `chart_library` | Kanıtlı | çalışan sayfa (runtime probe) | — | — |
| **Cloudflare** | `cdn_security` | Kanıtlı | sunucu başlığı | — | — |
| **Next.js** | `frontend_framework` | Kanıtlı | çalışan sayfa (runtime probe), sunucu başlığı, asset URL yolu | 1.0.0-beta.4 | çalışan sayfa (runtime probe) |
| **React** | `frontend_framework` | Kanıtlı | çalışan sayfa (runtime probe), indirilen dosya içeriği, HTML yapısı / meta | — | — |
| **Vite** | `build_tool` | Kanıtlı | indirilen dosya içeriği | — | — |

## Görülebilirlik

**Sunucu tarafı:** Görülemiyor — CDN/proxy arkasında
  - Kanıt: `server: cloudflare`

Bu, "backend yok" demek DEĞİLDİR. CDN/proxy katmanı kaynak
sunucunun imzasını gizlediği için ölçüm yapılamadı.

## Bu siteyi yeniden yapsam (ÇIKARIM)

> ⚠️ Bu bölüm ölçüm DEĞİL, yukarıdaki ölçümlerden yapılan bir çıkarımdır.

Ölçülen yığın `Next.js 1.0.0-beta.4 + React` olduğuna göre benzer bir sonuç
aynı ailede kalarak elde edilebilir. Kararı kendi ekibinizin bildiği
yığına göre verin; bu satır bir tavsiye değil, gözlemin özetidir.
