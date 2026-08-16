#!/usr/bin/env python3
"""
Tauri ikonlarini uretir.

Motif, uygulamanin imza ogesiyle ayni: KANIT CUBUKLARI. Isletme tablosunda
yorum hacmini gosteren o cubuklar urunun kimligi; ikonda da onlar var.
Boylece gorev cubugundaki simge ile ekrandaki tablo ayni seyi soyluyor.

Renkler olculmus jetonlardan (packages/design/tokens.css):
  zemin  #16181a  (koyu — gorev cubugunda hem acik hem koyu temada okunur)
  vurgu  #266df0  (birincil eylem mavisi)

  python3 scripts/make-icons.py
"""
from __future__ import annotations

import os
from PIL import Image, ImageDraw

OUT = os.path.join(os.path.dirname(__file__), "..", "src-tauri", "icons")

BG = (22, 24, 26, 255)        # --bg-base (koyu)
ACCENT = (38, 109, 240, 255)  # --accent
DIM = (61, 74, 99, 255)       # sonuncu cubuk: olcegin devami

# Cubuk yukseklikleri — azalan, tabloda gordugun siralamayi taklit ediyor.
BARS = [0.86, 0.62, 0.42, 0.24]


def draw(size: int) -> Image.Image:
    # 4x cizip kucultuyoruz: kucuk boyutlarda kenarlar boylece puruzsuz.
    s = size * 4
    img = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)

    radius = int(s * 0.22)
    d.rounded_rectangle([0, 0, s - 1, s - 1], radius=radius, fill=BG)

    pad = s * 0.20
    inner = s - pad * 2
    n = len(BARS)
    gap = inner * 0.10
    bar_w = (inner - gap * (n - 1)) / n
    bottom = s - pad
    bar_r = max(1, int(bar_w * 0.34))

    for i, h in enumerate(BARS):
        x0 = pad + i * (bar_w + gap)
        y0 = bottom - inner * h
        color = DIM if i == n - 1 else ACCENT
        d.rounded_rectangle([x0, y0, x0 + bar_w, bottom], radius=bar_r, fill=color)

    return img.resize((size, size), Image.LANCZOS)


def main() -> None:
    os.makedirs(OUT, exist_ok=True)

    # Tauri'nin bekledigi PNG'ler
    for name, size in [
        ("32x32.png", 32),
        ("128x128.png", 128),
        ("128x128@2x.png", 256),
        ("icon.png", 512),
        ("Square30x30Logo.png", 30),
        ("Square44x44Logo.png", 44),
        ("Square71x71Logo.png", 71),
        ("Square89x89Logo.png", 89),
        ("Square107x107Logo.png", 107),
        ("Square142x142Logo.png", 142),
        ("Square150x150Logo.png", 150),
        ("Square284x284Logo.png", 284),
        ("Square310x310Logo.png", 310),
        ("StoreLogo.png", 50),
    ]:
        draw(size).save(os.path.join(OUT, name))

    # Windows .ico — birden fazla boyut tek dosyada; kucuk boyutlar
    # gorev cubugunda, buyukler masaustunde kullaniliyor.
    sizes = [16, 24, 32, 48, 64, 128, 256]
    draw(256).save(
        os.path.join(OUT, "icon.ico"),
        format="ICO",
        sizes=[(x, x) for x in sizes],
    )

    # macOS .icns — Pillow ICNS yazarken en az 16x16..1024 ister.
    try:
        draw(1024).save(os.path.join(OUT, "icon.icns"), format="ICNS")
    except Exception as e:  # pragma: no cover
        print(f"icns uretilemedi ({e}) — macOS derlemesi bunu isteyebilir")

    print(f"Ikonlar yazildi: {os.path.abspath(OUT)}")


if __name__ == "__main__":
    main()
