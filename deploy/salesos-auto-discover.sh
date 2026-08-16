#!/bin/bash
# Otomatik kesif — gunde bir kez cron ile calisir.
#
# Kotanin ne zaman yenilendigini TAHMIN ETMEZ: her calismada Apify'a
# kalan krediyi sorar. Kredi varsa siradaki taranmamis sehir+sektor
# kumesini baslatir, biten taramalarin sonucunu havuza aktarir.
set -euo pipefail
cd /home/melih/sitestudyo-sales-os/backend
PW=$(grep -oP '(?<=mysql://salesos:)[^@]+' .env)
export DATABASE_URL="mysql://salesos:${PW}@127.0.0.1:3306/salesos"
export REDIS_URL="redis://127.0.0.1:6379"
exec /usr/bin/npx ts-node --transpile-only scripts/auto-discover.ts
