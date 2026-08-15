# api.sitestudyo.com sertifikasi

## Neden `--nginx` kullanilmiyor

Certbot'un nginx eklentisi, nginx yapilandirmasini bulup gecici olarak
degistirerek calisir. Bu sunucuda nginx **konteynerin icinde** (`hosting_nginx`),
host uzerinde `/etc/nginx` yok. Eklenti ya hicbir sey bulamaz ya da yanlis
dosyayi degistirir. **webroot** yontemi bu sorunu yasamaz: certbot sadece bir
dosya yazar, dogrulamayi nginx'in mevcut yapilandirmasi servis eder.

## Sira (bu sirayla)

Kayit zaten hazir: `api.sitestudyo.com A 185.48.180.25`, Cloudflare'da **DNS only**.
Proxy (turuncu bulut) acik olursa HTTP-01 dogrulamasi CF'e gider ve basarisiz olur.

**1. Dogrulama klasoru**

```bash
sudo mkdir -p /var/www/_acme/api.sitestudyo.com
```

**2. Once SADECE 80 blogu**

`api.sitestudyo.com.conf` dosyasindaki 443 blogunu tamamen yorum satirina al ve
`location /` icindeki `return 301`'i gecici olarak `return 404;` yap.

> Neden: 443 blogu hentiz var olmayan bir sertifika dosyasini gosterir.
> nginx eksik dosyada **hic baslamaz** — sunucudaki butun siteler duser.

```bash
sudo cp deploy/nginx/api.sitestudyo.com.conf /var/www/nginx-vhosts/
sudo docker exec hosting_nginx nginx -t     # HATA VERIYORSA DEVAM ETME
sudo docker exec hosting_nginx nginx -s reload
```

**3. Dogrulama yolunun gercekten calistigini kanitla**

```bash
echo test | sudo tee /var/www/_acme/api.sitestudyo.com/.well-known/acme-challenge/probe
curl -s http://api.sitestudyo.com/.well-known/acme-challenge/probe   # "test" donmeli
sudo rm /var/www/_acme/api.sitestudyo.com/.well-known/acme-challenge/probe
```

Bu adim atlanirsa ve yol yanlissa Let's Encrypt'in **saatlik hata limitine**
takilirsin. Once kuru calistir:

```bash
sudo certbot certonly --webroot \
  -w /var/www/_acme/api.sitestudyo.com \
  -d api.sitestudyo.com \
  --dry-run
```

**4. Gercek sertifika**

```bash
sudo certbot certonly --webroot \
  -w /var/www/_acme/api.sitestudyo.com \
  -d api.sitestudyo.com \
  --agree-tos -m admin@sitestudyo.com --no-eff-email
```

**5. 443 blogunu ac**

Yorumlari kaldir, `return 404;`'u tekrar `return 301 https://...` yap.

```bash
sudo docker exec hosting_nginx nginx -t
sudo docker exec hosting_nginx nginx -s reload
curl -s https://api.sitestudyo.com/api/v1/health
```

## Otomatik yenileme

Certbot host'ta yeniliyor ama nginx konteynerde — yenilenen sertifikayi
kendi basina yuklemez. Yenileme kancasi sart:

```bash
sudo tee /etc/letsencrypt/renewal-hooks/deploy/reload-hosting-nginx.sh >/dev/null <<'EOF'
#!/bin/sh
docker exec hosting_nginx nginx -s reload
EOF
sudo chmod +x /etc/letsencrypt/renewal-hooks/deploy/reload-hosting-nginx.sh
```

Kontrol: `sudo certbot renew --dry-run`
