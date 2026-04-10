# Deployment Guide for Hostinger

## Subdomains Setup
- Frontend: https://secondbrain.khajamynuddin.com
- Backend API: https://api-secondbrain.khajamynuddin.com

## Frontend Deployment (React App)

### 1. Build the production app
```bash
npm run build
```

### 2. Upload to Hostinger
- Upload all files from the `dist` folder to `/public_html/secondbrain`
- Make sure to upload:
  - index.html
  - assets/ folder
  - All other files in dist/

### 3. Configure .htaccess for React Router
Create a `.htaccess` file in `/public_html/secondbrain` with:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

## Backend Deployment (Laravel API)

### 1. Upload backend files
- Upload all files from the `backend` folder to `/public_html/api-secondbrain`

### 2. Configure .env file
- Copy `.env.production` to `.env` in `/public_html/api-secondbrain`
- Update database credentials:
  - DB_DATABASE=your_hostinger_database_name
  - DB_USERNAME=your_hostinger_database_user
  - DB_PASSWORD=your_hostinger_database_password
  - DB_HOST=localhost (usually for Hostinger)

### 3. Generate APP_KEY
Run this command via SSH or create a PHP file to generate:
```bash
php artisan key:generate
```

Or create a temporary file `generate-key.php`:
```php
<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->call('key:generate');
echo "Key generated successfully!";
```

### 4. Set correct permissions
```bash
chmod -R 755 storage bootstrap/cache
```

### 5. Point subdomain to public folder
In Hostinger, make sure `api-secondbrain.khajamynuddin.com` points to:
`/public_html/api-secondbrain/public`

### 6. Run migrations
Via SSH or create a migration script:
```bash
php artisan migrate --force
```

### 7. Configure .htaccess in public folder
The Laravel public/.htaccess should already be configured, but verify it exists.

## Database Setup

### 1. Create MySQL database in Hostinger
- Go to hPanel → Databases → MySQL Databases
- Create a new database
- Create a database user
- Assign user to database with all privileges
- Note down: database name, username, password

### 2. Update backend .env with database credentials

## SSL Certificates
- Hostinger usually provides free SSL certificates
- Enable SSL for both subdomains in hPanel
- Make sure "Force HTTPS" is enabled

## Testing
1. Test API: https://api-secondbrain.khajamynuddin.com/api/health (if you have a health endpoint)
2. Test Frontend: https://secondbrain.khajamynuddin.com

## Troubleshooting

### If API returns 500 error:
- Check storage and cache folder permissions
- Check .env configuration
- Check error logs in storage/logs/laravel.log

### If frontend shows blank page:
- Check browser console for errors
- Verify API URL is correct in .env.production
- Check .htaccess is properly configured

### CORS issues:
- Verify CORS_ALLOWED_ORIGINS in backend .env
- Check config/cors.php settings
