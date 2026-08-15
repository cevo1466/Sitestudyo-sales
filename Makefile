.PHONY: help setup up down logs ps build migrate seed test lint backup nginx-check nginx-reload mem

help: ## Komutlari listele
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-16s\033[0m %s\n", $$1, $$2}'

setup: ## .env dosyalarini olustur (varsa dokunmaz)
	@[ -f .env ] || cp .env.example .env
	@[ -f backend/.env ] || cp backend/.env.example backend/.env
	@echo "Sirlari doldur:  openssl rand -base64 48   ve   openssl rand -hex 32"

up: ## Servisleri baslat
	docker compose up -d --build

down: ## Servisleri durdur
	docker compose down

ps: ## Durum
	docker compose ps

logs: ## Canli loglar
	docker compose logs -f --tail=100

migrate: ## Migration'lari uygula (uretim)
	docker compose exec backend npx prisma migrate deploy

seed: ## Baslangic verisini yukle
	docker compose exec backend npm run seed

test: ## Testleri calistir
	cd backend && npm test

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
