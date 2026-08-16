.PHONY: help setup up down logs ps build migrate seed test lint backup nginx-check nginx-reload mem

# Bu sunucuda Compose v2 eklentisi kurulu degil, yalnizca eski `docker-compose`
# ikilisi var. Ikisini de destekliyoruz ama v2 onerilir:
#   sudo apt install docker-compose-plugin
# v1 artik bakim almiyor ve saglik kontrolune bagli `depends_on` kurallarini
# guvenilir uygulamiyor.
DC := $(shell docker compose version >/dev/null 2>&1 && echo "docker compose" || echo "docker-compose")

help: ## Komutlari listele
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-16s\033[0m %s\n", $$1, $$2}'

setup: ## .env dosyalarini olustur (varsa dokunmaz)
	@[ -f .env ] || cp .env.example .env
	@[ -f backend/.env ] || cp backend/.env.example backend/.env
	@echo "Sirlari doldur:  openssl rand -base64 48   ve   openssl rand -hex 32"

up: ## Servisleri baslat
	$(DC) up -d --build

down: ## Servisleri durdur
	$(DC) down

ps: ## Durum
	$(DC) ps

logs: ## Canli loglar
	$(DC) logs -f --tail=100

migrate: ## Migration'lari uygula (uretim)
	$(DC) exec backend npx prisma migrate deploy

seed: ## Baslangic verisini yukle
	$(DC) exec backend npm run seed

test: ## Testleri calistir (birim + e2e)
	cd backend && npm test
	$(MAKE) test-e2e

## e2e AYRI veritabaninda kosar. Sema degistiginde buraya da uygulanmali —
## unutulursa testler "kolon yok" diye toplu halde patlar ve sanki kod
## bozulmus gibi gorunur. Bu hedef ikisini birden yapiyor.
test-e2e: ## e2e testleri (test veritabanini once gunceller)
	cd backend && 	PW=$$(grep -oP '(?<=mysql://salesos:)[^@]+' .env) && 	DATABASE_URL="mysql://salesos:$$PW@127.0.0.1:3306/salesos_test" npx prisma migrate deploy && 	DATABASE_URL="mysql://salesos:$$PW@127.0.0.1:3306/salesos" npm run test:e2e

lint: ## Kod denetimi
	cd backend && npm run lint

## --------------------------------------------------------------- yedek
## Veritabani sunucudaki mevcut MariaDB'de (`hosting_mysql`). O konteyner
## hosting paneline ait; panel yeniden kurulursa verimiz de gider.
## Bu yuzden yedek tercih degil, zorunluluk.
backup: ## salesos veritabanini yedekle (backups/ altina)
	@mkdir -p backups
	@docker exec hosting_mysql mysqldump \
		-usalesos -p"$$(grep -oP '(?<=mysql://salesos:)[^@]+' backend/.env)" \
		--single-transaction --quick --default-character-set=utf8mb4 salesos \
		| gzip > backups/salesos-$$(date +%Y%m%d-%H%M%S).sql.gz
	@ls -lh backups | tail -3
	@echo "Eski yedekler temizleniyor (30 gunden eski)..."
	@find backups -name 'salesos-*.sql.gz' -mtime +30 -delete

## ------------------------------------------------------------- sunucu
nginx-check: ## Mevcut nginx yapilandirmasini dogrula (SITELERI BOZMADAN)
	sudo docker exec hosting_nginx nginx -t

nginx-reload: ## nginx'i yeniden yukle
	sudo docker exec hosting_nginx nginx -t && sudo docker exec hosting_nginx nginx -s reload

mem: ## Bellek ayak izini olc
	@free -m
	@docker stats --no-stream --format 'table {{.Name}}\t{{.MemUsage}}\t{{.CPUPerc}}' \
		$$(docker ps --filter name=salesos --format '{{.Names}}') 2>/dev/null || true
