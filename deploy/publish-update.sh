#!/usr/bin/env bash
#
# Masaustu guncellemesini yayinlar.
#
# NEDEN GEREKLI: depo private. tauri-action'in urettigi latest.json,
# kurulum dosyalarini GitHub surum adreslerinden gostererek yaziyor;
# o adresler kimlik dogrulamasi istiyor ve kullanicinin bilgisayarindaki
# uygulamanin token'i yok — indirme 404 doner. Bu yuzden dosyalari
# sunucuya indirip latest.json'daki adresleri kendi sunucumuza cevirmek
# zorundayiz. (Alternatif depoyu herkese acmakti; kaynak kodda musteri
# verisi olmasa da bunu yapmadik.)
#
# KULLANIM:  deploy/publish-update.sh desktop-v0.2.1
#
# TOKEN: ~/.salesos-keys/github-token dosyasindan okunur. Bu token'in
# TEK ihtiyaci "Contents: Read-only" iznidir; baska hicbir izin verme.
set -euo pipefail

TAG="${1:?Kullanim: publish-update.sh <etiket>   ornek: desktop-v0.2.1}"
REPO="cevo1466/Sitestudyo-sales"
DEST="/var/www/updates"
TOKEN_FILE="$HOME/.salesos-keys/github-token"

if [[ ! -r "$TOKEN_FILE" ]]; then
  echo "HATA: $TOKEN_FILE yok." >&2
  echo "GitHub'da 'Contents: Read-only' izinli bir token uretip icine yaz:" >&2
  echo "  https://github.com/settings/personal-access-tokens" >&2
  exit 1
fi
TOKEN="$(tr -d '[:space:]' < "$TOKEN_FILE")"
api() { curl -fsSL -H "Authorization: Bearer $TOKEN" \
             -H "Accept: application/vnd.github+json" "$@"; }

echo "==> $TAG surumu araniyor"
RELEASE="$(api "https://api.github.com/repos/$REPO/releases/tags/$TAG")"

# Taslak surum yayinlanmadan varliklar indirilemez; tauri-action taslak
# olusturuyor, bu yuzden once yayinliyoruz.
if [[ "$(printf '%s' "$RELEASE" | python3 -c 'import sys,json;print(json.load(sys.stdin)["draft"])')" == "True" ]]; then
  echo "==> Taslak surum yayinlaniyor"
  ID="$(printf '%s' "$RELEASE" | python3 -c 'import sys,json;print(json.load(sys.stdin)["id"])')"
  RELEASE="$(api -X PATCH -d '{"draft":false}' \
    "https://api.github.com/repos/$REPO/releases/$ID")"
fi

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

# Varlik adlari bosluk iceriyor ("SiteStudyo Sales OS_0.2.1_amd64.deb"),
# bu yuzden satir satir degil NUL ile ayirarak okuyoruz.
printf '%s' "$RELEASE" | python3 -c '
import sys, json
for a in json.load(sys.stdin)["assets"]:
    sys.stdout.write(a["name"] + "\0" + a["url"] + "\0")
' > "$TMP/assets"

echo "==> Dosyalar indiriliyor"
while IFS= read -r -d '' NAME && IFS= read -r -d '' URL; do
  echo "    $NAME"
  curl -fsSL -H "Authorization: Bearer $TOKEN" \
       -H "Accept: application/octet-stream" -o "$TMP/$NAME" "$URL"
done < "$TMP/assets"

if [[ ! -f "$TMP/latest.json" ]]; then
  echo "HATA: latest.json bu surumde yok." >&2
  echo "Sebebi genelde tauri.conf.json'da createUpdaterArtifacts kapali" >&2
  echo "olmasi ya da imza anahtari secret'inin eksik olmasidir." >&2
  exit 1
fi

# Adresleri kendi sunucumuza cevir. Dosya adlari URL kodlu yaziliyor.
echo "==> Adresler api.sitestudyo.com'a cevriliyor"
python3 - "$TMP/latest.json" <<'PY'
import json, sys, urllib.parse
p = sys.argv[1]
d = json.load(open(p, encoding='utf-8'))
base = 'https://api.sitestudyo.com/updates/'
for name, plat in d.get('platforms', {}).items():
    url = plat.get('url', '')
    plat['url'] = base + urllib.parse.quote(url.rsplit('/', 1)[-1])
json.dump(d, open(p, 'w', encoding='utf-8'), indent=2)
print('  surum', d.get('version'), '-', len(d.get('platforms', {})), 'platform')
PY

# latest.json EN SON tasinir: once ikili dosyalar yerinde olsun, yoksa
# tam o an guncelleme arayan bir uygulama var olmayan dosyayi indirmeye
# calisir.
install -d "$DEST"
find "$TMP" -maxdepth 1 -type f ! -name latest.json ! -name assets \
  -exec install -m 644 {} "$DEST"/ \;
install -m 644 "$TMP/latest.json" "$DEST/latest.json"

echo "==> Yayinlandi: $DEST"
curl -fsS https://api.sitestudyo.com/updates/latest.json | head -c 200
echo
