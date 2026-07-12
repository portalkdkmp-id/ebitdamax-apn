# Deployment Guide — ebitdamax-apn

Panduan langkah-demi-langkah deploy aplikasi ke production server Linux (Ubuntu/Debian) dengan asumsi PHP, Composer, Node.js, dan Nginx sudah terinstal.

---

## Prasyarat Server

| Komponen   | Versi Minimal     |
| ---------- | ----------------- |
| PHP        | 8.3               |
| Composer   | 2.x               |
| Node.js    | 20+ (untuk build) |
| NPM        | 10+               |
| Nginx      | 1.24+             |
| PostgreSQL | 15+               |

Ekstensi PHP yang wajib:

```
bcmath ctype curl fileinfo json mbstring openssl pdo pdo_pgsql
tokenizer xml
```

---

## 1. Clone & Siapkan Project

```bash
# Masuk ke direktori aplikasi
cd /var/www

# Clone repository
git clone <repository-url> ebitdamax-apn
cd ebitdamax-apn

# Copy .env production
cp .env.example .env
```

---

## 2. Konfigurasi Environment (`.env`)

Edit file `.env` menggunakan editor:

```bash
nano .env
```

Isi minimal yang harus disesuaikan untuk production:

```ini
APP_NAME="EbitdaMax APN"
APP_ENV=production
APP_DEBUG=false
APP_URL=https://domain-anda.com

DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=ebitdamax
DB_USERNAME=ebitdamax
DB_PASSWORD=*************

SESSION_DRIVER=database
QUEUE_CONNECTION=database
CACHE_STORE=database

# Token API eksternal
PORTAL_PEMBANGUNAN_SARPRAS_TOKEN=<isi-token-anda>
```

> **Penting:** Jika menggunakan MySQL/MariaDB, buat database kosong terlebih dahulu, lalu jalankan `php artisan migrate` di langkah 4.

---

## 3. Install Dependencies & Build Frontend

```bash
# Install PHP dependencies (tanpa dev)
composer install --no-dev --optimize-autoloader --no-interaction

# Install Node.js dependencies
npm ci

# Build frontend assets
npm run build
```

Setelah build, struktur output berada di `public/build/`. Pastikan direktori ini ada:

```bash
ls public/build/
```

---

## 4. Menyiapkan Database

### Opsi A: Database Baru (Fresh)

Jika tidak ada backup, buat database dari awal:

```bash
# Buat database & user di PostgreSQL
sudo -u postgres psql
```
```sql
CREATE USER ebitdamax WITH PASSWORD 'password-kuat';
CREATE DATABASE ebitdamax OWNER ebitdamax;
\c ebitdamax
GRANT ALL ON SCHEMA public TO ebitdamax;
\q
```

Kemudian jalankan migrasi:

```bash
php artisan migrate --force
php artisan db:seed --force
```

### Opsi B: Import dari Backup Dump (`.sql`)

Jika Anda memiliki file backup dump PostgreSQL (misalnya `database.backup.sql`):

1.  Buat database kosong:
    ```bash
    sudo -u postgres psql
    ```
    ```sql
    CREATE USER ebitdamax WITH PASSWORD 'password-kuat';
    CREATE DATABASE ebitdamax OWNER ebitdamax;
    \q
    ```

2.  Import file dump:
    ```bash
    PGPASSWORD=password-kuat psql -U ebitdamax -h 127.0.0.1 -d ebitdamax < database.backup.sql
    ```

3.  Jalankan migrasi baru (jika ada yang belum di dump):
    ```bash
    php artisan migrate --force
    ```

### Opsi C: Import dari Backup Custom Format (`.dump`)

Jika backup dibuat dengan `pg_dump -Fc`:

```bash
PGPASSWORD=password-kuat pg_restore -U ebitdamax -h 127.0.0.1 -d ebitdamax --clean --no-owner database.backup.dump
php artisan migrate --force
```

---

## 5. Inisialisasi Aplikasi

```bash
# Generate APP_KEY (hanya jika .env belum memiliki APP_KEY yang valid)
php artisan key:generate

# Buat symlink storage → public/storage
php artisan storage:link

# Cache konfigurasi & route (production optimization)
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan event:cache
```

---

## 6. Atur Permission Direktori

Pastikan user web server (biasanya `www-data`) memiliki akses tulis ke direktori berikut:

```bash
sudo chown -R www-data:www-data storage bootstrap/cache
sudo chmod -R 775 storage bootstrap/cache
```

---

## 7. Konfigurasi Nginx

Buat file konfigurasi:

```bash
sudo nano /etc/nginx/sites-available/ebitdamax-apn
```

Isi dengan konfigurasi berikut:

```nginx
server {
    listen 80;
    server_name domain-anda.com;
    root /var/www/ebitdamax-apn/public;

    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";

    index index.php;
    charset utf-8;

    # Gzip
    gzip on;
    gzip_vary on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml text/javascript image/svg+xml;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location = /favicon.ico { access_log off; log_not_found off; }
    location = /robots.txt  { access_log off; log_not_found off; }

    # Static assets with long cache
    location /build/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php8.3-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
        fastcgi_buffers 16 16k;
        fastcgi_buffer_size 32k;
    }

    location ~ /\.(?!well-known).* {
        deny all;
    }
}
```

Aktifkan site dan reload Nginx:

```bash
sudo ln -s /etc/nginx/sites-available/ebitdamax-apn /etc/nginx/sites-enabled/
sudo nginx -t          # Test konfigurasi
sudo systemctl reload nginx
```

---

## 8. Konfigurasi SSL (HTTPS)

Gunakan **Certbot** (Let's Encrypt) untuk SSL gratis:

```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx -y

# Generate sertifikat SSL
sudo certbot --nginx -d domain-anda.com

# Verifikasi auto-renewal
sudo certbot renew --dry-run
```

Certbot akan otomatis mengupdate konfigurasi Nginx untuk redirect HTTP ke HTTPS.

---

## 9. Scheduler & Queue Worker

### Cron Job (untuk scheduled tasks)

```bash
sudo crontab -u www-data -e
```

Tambah baris:

```
* * * * * cd /var/www/ebitdamax-apn && php artisan schedule:run >> /dev/null 2>&1
```

### Queue Worker (via Supervisor)

Install Supervisor jika belum ada:

```bash
sudo apt install supervisor -y
```

Buat file konfigurasi:

```bash
sudo nano /etc/supervisor/conf.d/ebitdamax-worker.conf
```

```ini
[program:ebitdamax-worker]
process_name=%(program_name)s_%(process_num)02d
command=php /var/www/ebitdamax-apn/artisan queue:work database --sleep=3 --tries=3 --max-time=3600
autostart=true
autorestart=true
stopasgroup=true
killasgroup=true
user=www-data
numprocs=2
redirect_stderr=true
stdout_logfile=/var/log/ebitdamax-worker.log
stopwaitsecs=3600
```

Aktifkan:

```bash
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start ebitdamax-worker:*
```

---

## 10. Verifikasi

1.  Buka `https://domain-anda.com` di browser.
2.  Pastikan halaman login/dashboard muncul tanpa error.
3.  Cek log jika ada masalah:

```bash
sudo tail -f storage/logs/laravel.log
sudo tail -f /var/log/nginx/error.log
```

---

## 11. Update di Kemudian Hari

Setiap kali ada perubahan kode yang di-push, jalankan di server:

```bash
cd /var/www/ebitdamax-apn

# Pull perubahan
git pull origin main

# Install dependency jika ada perubahan
composer install --no-dev --optimize-autoloader --no-interaction
npm ci
npm run build

# Migrasi jika ada migration baru
php artisan migrate --force

# Refresh cache
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Restart queue worker
sudo supervisorctl restart ebitdamax-worker:*
```

---

## Troubleshooting

| Masalah                           | Solusi                                                                 |
| --------------------------------- | ---------------------------------------------------------------------- |
| **500 Server Error**              | Cek `storage/logs/laravel.log`, pastikan `APP_KEY` sudah di-generate.  |
| **Halaman putih / JS error**      | Cek file ada di `public/build/`. Jika tidak, ulangi `npm run build`.   |
| **Gambar / storage tidak muncul** | Jalankan `php artisan storage:link`.                                   |
| **Login gagal**                   | Pastikan `APP_URL` di `.env` sesuai domain yang dipakai.               |
| **Nginx 502 Bad Gateway**         | Pastikan PHP-FPM berjalan: `sudo systemctl status php8.3-fpm`.         |
| **PostgreSQL connection refused** | Pastikan PostgreSQL berjalan: `sudo systemctl status postgresql`. Cek `pg_hba.conf` mengizinkan koneksi local (method: `md5` atau `scram-sha-256`). |
