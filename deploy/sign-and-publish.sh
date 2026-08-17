#!/usr/bin/env bash
#
# Paketleri SUNUCUDA imzalar ve guncellemeyi yayinlar.
#
# NEDEN SUNUCUDA: imza sirrini GitHub'a dogru bicimde yazmak uc denemede de
# basarisiz oldu (340, 344 karakter geldi; 348 olmasi gerekiyor). Panodan
# gecerken metnin sonu kesiliyor ve her deneme sekiz dakikalik uc platformluk
# derlemeyi yakiyor. Anahtar zaten burada duruyor, CI'a hic vermeye gerek yok.
#
# KULLANIM: deploy/sign-and-publish.sh <calisma-id> <surum>
#   ornek:   deploy/sign-and-publish.sh 32001876615 0.2.5
set -euo pipefail

RUN_ID="${1:?Kullanim: sign-and-publish.sh <calisma-id> <surum>}"
VERSION="${2:?Surum gerekli, ornek: 0.2.5}"
REPO="cevo1466/Sitestudyo-sales"
KEY="$HOME/.salesos-keys/updater.key"
DEST="/var/www/updates"
BASE="https://api.sitestudyo.com/updates"
CLI="/home/melih/sitestudyo-sales-os/desktop-client"

[[ -r "$KEY" ]] || { echo "HATA: imza anahtari yok: $KEY" >&2; exit 1; }
[[ -n "${GH_TOKEN:-}" ]] || { echo "HATA: GH_TOKEN gerekli (actions:read yeter)" >&2; exit 1; }

TMP="$(mktemp -d)"; trap 'rm -rf "$TMP"' EXIT
api() { curl -fsSL -H "Authorization: Bearer $GH_TOKEN" \
             -H "Accept: application/vnd.github+json" "$@"; }

echo "==> Artifact listesi"
api "https://api.github.com/repos/$REPO/actions/runs/$RUN_ID/artifacts" \
  | python3 -c '
import sys, json
for a in json.load(sys.stdin)["artifacts"]:
    if not a["expired"]:
        sys.stdout.write(a["name"] + "\0" + a["archive_download_url"] + "\0")
' > "$TMP/list"

echo "==> Indiriliyor"
while IFS= read -r -d '' NAME && IFS= read -r -d '' URL; do
  echo "    $NAME"
  curl -fsSL -H "Authorization: Bearer $GH_TOKEN" -o "$TMP/$NAME.zip" "$URL"
  unzip -o -q "$TMP/$NAME.zip" -d "$TMP/paketler"
done < "$TMP/list"

# Tauri guncelleyicisi her platformda BELLI bir dosya turunu indirir.
# Windows'ta NSIS kurulumu, Linux'ta AppImage, macOS'ta .app.tar.gz.
# .deb ve .msi kullaniciya elle kurulum icin durur, guncelleyici onlari
# kullanmaz; latest.json'a da girmezler.
declare -A HEDEF=(
  [windows-x86_64]='-setup.exe'
  [linux-x86_64]='.AppImage'
  [darwin-universal]='.app.tar.gz'
)

echo "==> Imzalaniyor"
install -d "$DEST"
PLATFORMS=""
for PLAT in "${!HEDEF[@]}"; do
  UZANTI="${HEDEF[$PLAT]}"
  DOSYA="$(find "$TMP/paketler" -type f -name "*${UZANTI}" | head -1)"
  if [[ -z "$DOSYA" ]]; then
    echo "    $PLAT: paket bulunamadi, atlaniyor"
    continue
  fi
  AD="$(basename "$DOSYA")"
  echo "    $PLAT <- $AD"

  # Imza dosyanin YANINA yazilir (.sig). Anahtar parolasiz uretildi.
  ( cd "$CLI" && TAURI_SIGNING_PRIVATE_KEY_PASSWORD='' \
      npx --yes @tauri-apps/cli signer sign -f "$KEY" "$DOSYA" >/dev/null )

  IMZA="$(cat "$DOSYA.sig")"
  install -m 644 "$DOSYA" "$DEST/$AD"
  PLATFORMS="$PLATFORMS$(python3 -c "
import json,sys,urllib.parse
print(json.dumps({'$PLAT': {'signature': '''$IMZA''', 'url': '$BASE/' + urllib.parse.quote('$AD')}})[1:-1] + ',')
")"
done

[[ -n "$PLATFORMS" ]] || { echo "HATA: imzalanacak paket bulunamadi" >&2; exit 1; }

echo "==> latest.json"
# latest.json EN SON yaziliyor: ikili dosyalar yerinde olmadan listeyi
# yayinlamak, tam o an guncelleme arayan bir uygulamayi var olmayan
# dosyaya yonlendirirdi.
python3 - "$VERSION" "$PLATFORMS" > "$DEST/latest.json" <<'PY'
import json, sys, datetime
version, platforms = sys.argv[1], sys.argv[2].rstrip(',')
print(json.dumps({
    'version': version,
    'notes': 'Yeni arayuz, mesaj sablonlari ve WhatsApp penceresi.',
    'pub_date': datetime.datetime.now(datetime.timezone.utc)
                 .replace(microsecond=0).isoformat().replace('+00:00', 'Z'),
    'platforms': json.loads('{' + platforms + '}'),
}, indent=2, ensure_ascii=False))
PY

chmod 644 "$DEST/latest.json"
echo "==> Yayinlandi"
curl -fsS "$BASE/latest.json" | head -20
