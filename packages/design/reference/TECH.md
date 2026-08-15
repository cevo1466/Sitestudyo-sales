# TECH.md — Teknoloji Dökümü

**Hedef:** https://attio.com

Bu döküm ölçüme dayanır. Her bulgunun yanında hangi katmandan geldiği ve
kanıt sınıfı yazılıdır. Sınıflar:

| Sınıf | Anlamı |
|---|---|
| **Kanıtlı** | Çalışan sayfa kendi söyledi ya da dosya içinde yazıyor. Tartışılmaz. |
| **Güçlü işaret** | Neredeyse kesin, ama kütüphane kendini bildirmedi. |
| **Zayıf işaret** | Yalnız sınıf adı. Tek başına "kullanıyor" demek için YETERSİZ. |

## Özet yığın

`Next.js 16.2.5 + React + Tailwind CSS 4.x`

Bu satır YALNIZ kanıtlı ve güçlü işaretlerden kuruldu; zayıf işaretler
aşağıda ayrı bölümde.

## Doğrulanmış teknolojiler

| Teknoloji | Kategori | Sınıf | Katman | Sürüm | Sürümün kaynağı |
|---|---|---|---|---|---|
| **Cloudflare** | `cdn_security` | Kanıtlı | sunucu başlığı | — | — |
| **Google Analytics 4** | `analytics` | Güçlü işaret | asset URL yolu, HTML yapısı / meta | — | — |
| **Google Tag Manager** | `tag_manager` | Güçlü işaret | asset URL yolu, HTML yapısı / meta | — | — |
| **Meta Pixel** | `analytics` | Güçlü işaret | asset URL yolu | — | — |
| **Next.js** | `frontend_framework` | Kanıtlı | çalışan sayfa (runtime probe), indirilen dosya içeriği, sunucu başlığı, asset URL yolu, HTML yapısı / meta | 16.2.5 | çalışan sayfa (runtime probe) |
| **React** | `frontend_framework` | Kanıtlı | çalışan sayfa (runtime probe), indirilen dosya içeriği, HTML yapısı / meta | — | — |
| **Tailwind CSS** | `css_framework` | Kanıtlı | çalışan sayfa (runtime probe), indirilen dosya içeriği, yalnız sınıf adı | 4.x | çalışan sayfa (runtime probe) |
| **Vercel** | `hosting` | Kanıtlı | sunucu başlığı | — | — |

## Görülebilirlik

**Sunucu tarafı:** Görülemiyor — CDN/proxy arkasında
  - Kanıt: `server: cloudflare`

Bu, "backend yok" demek DEĞİLDİR. CDN/proxy katmanı kaynak
sunucunun imzasını gizlediği için ölçüm yapılamadı.

## Bu siteyi yeniden yapsam (ÇIKARIM)

> ⚠️ Bu bölüm ölçüm DEĞİL, yukarıdaki ölçümlerden yapılan bir çıkarımdır.

Ölçülen yığın `Next.js 16.2.5 + React + Tailwind CSS 4.x` olduğuna göre benzer bir sonuç
aynı ailede kalarak elde edilebilir. Kararı kendi ekibinizin bildiği
yığına göre verin; bu satır bir tavsiye değil, gözlemin özetidir.
