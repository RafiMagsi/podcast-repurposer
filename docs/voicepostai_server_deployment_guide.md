# VoicePostAI Server Deployment Guide

## 1. Fix the current `APP_KEY` error

From the project root on the server:

```bash
cp .env.example .env
php artisan key:generate
php artisan optimize:clear
```

If `.env` already exists and only the key is missing:

```bash
php artisan key:generate
php artisan optimize:clear
```

---

## 2. Install backend and frontend dependencies

From the project root:

```bash
composer install --no-dev --optimize-autoloader
npm install
npm run build
```

Because this project uses Laravel with JSX views via Vite/Inertia, production assets must be built with `npm run build`.

---

## 3. Configure `.env`

Set the correct production values in `.env`:

```env
APP_NAME=VoicePostAI
APP_ENV=production
APP_DEBUG=false
APP_URL=https://voicepostai.dropticks.com

APP_KEY=base64:generated-by-key-generate

DB_CONNECTION=...
DB_HOST=...
DB_PORT=...
DB_DATABASE=...
DB_USERNAME=...
DB_PASSWORD=...

FILESYSTEM_DISK=s3
QUEUE_CONNECTION=database
CACHE_STORE=file
SESSION_DRIVER=file
LOG_CHANNEL=stack
```

If using S3:

```env
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_DEFAULT_REGION=...
AWS_BUCKET=...
AWS_USE_PATH_STYLE_ENDPOINT=false
AWS_URL=
AWS_ENDPOINT=
```

If mail is needed:

```env
MAIL_MAILER=smtp
MAIL_HOST=...
MAIL_PORT=587
MAIL_USERNAME=...
MAIL_PASSWORD=...
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=...
MAIL_FROM_NAME="${APP_NAME}"
```

---

## 4. Run database setup

```bash
php artisan migrate --force
```

If seeders are needed:

```bash
php artisan db:seed --force
```

---

## 5. Create storage link

If your app serves public files through Laravel storage, run:

```bash
php artisan storage:link
```

Verify it exists:

```bash
ls -ld public/storage
```

---

## 6. Cache production config

After `.env` is correct:

```bash
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

If you change `.env` later, clear and rebuild caches again.

---

## 7. Set storage and cache permissions

Typical Laravel writable paths:

```bash
chmod -R ug+rwx storage bootstrap/cache
```

If needed, also set correct ownership for the web server user.

---

## 8. Set web server document root

Your web server must point to Laravel’s `public` directory, not the project root.

Correct document root:

```text
/path/to/voicepostai/public
```

---

## 9. Queue setup

This project uses background jobs, so queue workers must be running in production.

If using database queue, make sure queue tables exist:

```bash
php artisan queue:table
php artisan migrate --force
```

Test manually first:

```bash
php artisan queue:work --tries=1
```

If jobs process correctly, set up Supervisor.

---

## 10. Install Supervisor

On Ubuntu/Debian:

```bash
sudo apt update
sudo apt install -y supervisor
```

---

## 11. Create Supervisor config for Laravel queue

Create this file:

```text
/etc/supervisor/conf.d/voicepostai-worker.conf
```

Use this example:

```ini
[program:voicepostai-worker]
process_name=%(program_name)s_%(process_num)02d
command=/usr/bin/php /var/www/voicepostai/artisan queue:work --sleep=3 --tries=3 --max-time=3600
autostart=true
autorestart=true
stopasgroup=true
killasgroup=true
user=www-data
numprocs=1
redirect_stderr=true
stdout_logfile=/var/www/voicepostai/storage/logs/worker.log
stopwaitsecs=3600
```

Adjust:
- PHP path
- project path
- process user

Then run:

```bash
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start voicepostai-worker:*
```

---

## 12. Scheduler cron job

If the project uses Laravel Scheduler, add this cron entry:

```bash
* * * * * cd /var/www/voicepostai && php artisan schedule:run >> /dev/null 2>&1
```

---

## 13. Verify media processing dependencies

Because the app processes audio/video, verify:

```bash
which ffmpeg
which ffprobe
ffmpeg -version
ffprobe -version
```

If missing:

```bash
sudo apt update
sudo apt install -y ffmpeg
```

---

## 14. Final production verification commands

Run:

```bash
php artisan about
php artisan optimize:clear
php artisan route:list
php artisan queue:work --once
tail -f storage/logs/laravel.log
```

Then verify in browser:
- home page loads
- JSX pages render correctly
- uploads work
- previews work
- queue jobs process
- no 500 errors appear in logs

---

## 15. Deployment update routine

For future deployments, use this order:

```bash
git pull
composer install --no-dev --optimize-autoloader
npm install
npm run build
php artisan migrate --force
php artisan storage:link
php artisan optimize:clear
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan queue:restart
```

`php artisan queue:restart` is important because queue workers keep old code in memory.

---

## 16. Production checklist

### App
- `APP_KEY` exists
- `APP_URL` is correct
- `APP_DEBUG=false`

### Storage
- S3 credentials are valid
- uploads work
- `php artisan storage:link` is run if public storage is used
- media preview URLs work
- thumbnails work

### Queues
- Supervisor is running
- jobs process correctly
- queue restart works after deployment

### Frontend
- `npm run build` completed successfully
- Vite assets are served from `public/build`

### Media
- `ffmpeg` and `ffprobe` are installed
- audio/video processing works

---

## 17. First commands to run now

If code is already uploaded, run:

```bash
cd /var/www/voicepostai
cp .env.example .env
php artisan key:generate
composer install --no-dev --optimize-autoloader
npm install
npm run build
php artisan migrate --force
php artisan storage:link
php artisan optimize:clear
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan queue:work --once
```

Then set up Supervisor for queues.
