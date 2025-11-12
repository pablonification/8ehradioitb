# Deployment Guide — 8ehradioitb (Armbian + Docker + nginx)

Panduan lengkap menggunakan skrip `deploy/deploy.sh` yang disediakan. Skrip ini otomatis:

- menginstal Docker (jika belum ada)
- membuat `.env.production` dari environment atau default
- membangun dan menjalankan container Next.js
- (opsional) menjalankan MongoDB container jika `MONGODB_URL` menunjuk lokal
- menulis konfigurasi nginx dan meminta sertifikat Let's Encrypt

File penting yang ditambahkan:

- `Dockerfile` — multi-stage build untuk Next.js
- `docker-compose.yml` — aplikasi `app` (bind ke 127.0.0.1:3000)
- `docker-compose.mongo.yml` — service `mongo` (opsional)
- `deploy/deploy.sh` — skrip one-click
- `deploy/.env.example` — template .env (tidak dikomit jika di .gitignore)

Syarat sebelum menjalankan

- Domain yang mengarah ke VPS (A/AAAA record ke IP server)
- VPS Armbian dengan akses root (sudo)
- Jika Anda memakai external MongoDB (Atlas), tahu connection stringnya

Langkah singkat

1. Clone repo di VPS:
   sudo git clone <repo> /opt/8ehradioitb && cd /opt/8ehradioitb
2. Buat/ekspor environment variables sensitif atau jalankan skrip lalu edit `.env.production`:
   - export MONGODB_URL="mongodb://user:pass@host:port/db" (opsional)
   - export NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=...
   - export NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=...
   - export R2\_\* vars jika diperlukan
     Jika tidak diekspor, deploy script akan membuat `.env.production` dengan nilai default (local mongo) dan generate `NEXTAUTH_SECRET`.
3. Jalankan skrip deploy:
   sudo ./deploy/deploy.sh --domain example.com --email admin@example.com

Apa yang dilakukan skrip

- Membuat `.env.production` di root proyek. Jika `MONGODB_URL` kosong, ia default ke `mongodb://mongo:27017/8ehradio`.
- Jika `.env.production` menunjuk ke `mongo`/`localhost`/`127.0.0.1` atau kosong, skrip akan memulai `docker compose` dengan `docker-compose.mongo.yml` sehingga Mongo berjalan sebagai container lokal.
- Jika `.env.production` menunjuk host lain (mis: mongodb+srv://... atau host berbeda), maka hanya `app` yang dijalankan dan Anda harus memastikan Mongo remote dapat diakses.
- Menulis file nginx site di `/etc/nginx/sites-available/8ehradioitb`, enable, reload.
- Meminta sertifikat Let's Encrypt via `certbot --nginx`.

Menjalankan manual vs otomatis

- Jika Anda ingin kontrol penuh, jalankan langkah manual yang sama:
  - Build image: `docker compose --env-file .env.production -f docker-compose.yml -f docker-compose.mongo.yml build` (sesuaikan jika pakai remote mongo)
  - Run: `docker compose --env-file .env.production up -d`

Troubleshooting singkat

- Kalau build gagal karena Prisma: lihat `docker compose logs app` dan telusuri error. Untuk Prisma di ARM Anda mungkin perlu set `PRISMA_CLIENT_ENGINE_TYPE=library` di `.env.production`.
- Kalau nginx gagal reload: `sudo nginx -t` dan `sudo tail -n 200 /var/log/nginx/error.log`.
- Kalau certbot gagal: jalankan manual `sudo certbot certonly --webroot -w /var/www/certbot -d example.com` lalu update nginx config untuk SSL atau rerun `certbot --nginx`.

Keamanan & best practices

- Jangan menyimpan secrets di Git. Gunakan secret manager atau set env di VPS.
- Gunakan firewall untuk hanya membuka port 80/443.
- Backup volume `mongo_data` secara berkala.

Jika Anda ingin, saya bisa:

- Menambahkan systemd service untuk auto-start deployment script atau docker compose auto restart policy (saat ini `restart: unless-stopped` sudah ada),
- Mengubah binding app jika Anda ingin expose langsung ke public,
- Menambahkan healthchecks dan logging rotation.

---

Panduan ini dibuat otomatis oleh tool. Jika Anda ingin saya jalankan deploy sekarang di server ini, kirim domain dan email dan berikan izin untuk menjalankan skrip (butuh sudo).
