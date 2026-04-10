# Quick Deployment Checklist for Hostinger

## ✅ Configuration Complete
- Frontend configured for: https://secondbrain.khajamynuddin.com
- Backend configured for: https://api-secondbrain.khajamynuddin.com
- Production build created in `dist/` folder

## 📦 What to Upload

### Frontend (React App)
**Location:** `/public_html/secondbrain`
**Files to upload:** Everything from `dist/` folder
- index.html
- assets/ folder
- manifest.webmanifest
- registerSW.js
- sw.js
- workbox-*.js
- pwa-icon.svg
- pwa-maskable.svg
- 404.html
- .htaccess (from public/.htaccess)

### Backend (Laravel API)
**Location:** `/public_html/api-secondbrain`
**Files to upload:** Everything from `backend/` folder EXCEPT:
- node_modules/
- .git/
- storage/logs/* (create empty folder)
- bootstrap/cache/* (create empty folder)

## 🔧 Post-Upload Configuration

### 1. Backend Setup
1. Copy `backend/.env.production` to `/public_html/api-secondbrain/.env`
2. Edit `.env` and update:
   ```
   DB_DATABASE=your_hostinger_database_name
   DB_USERNAME=your_hostinger_database_user
   DB_PASSWORD=your_hostinger_database_password
   OPENAI_API_KEY=your_actual_openai_key
   ```
3. Generate APP_KEY (via SSH or PHP script)
4. Set permissions: `chmod -R 755 storage bootstrap/cache`
5. Run migrations: `php artisan migrate --force`

### 2. Subdomain Configuration in Hostinger
- Point `secondbrain.khajamynuddin.com` → `/public_html/secondbrain`
- Point `api-secondbrain.khajamynuddin.com` → `/public_html/api-secondbrain/public`

### 3. SSL Certificates
- Enable SSL for both subdomains in hPanel
- Force HTTPS redirect

## 🗄️ Database Setup
1. Create MySQL database in hPanel
2. Create database user
3. Grant all privileges
4. Update backend .env with credentials

## 🧪 Testing
- Frontend: https://secondbrain.khajamynuddin.com
- API Health: https://api-secondbrain.khajamynuddin.com/api/health

## 📝 Important Notes
- The actual OpenAI API key is in your local `backend/.env` file
- Copy it to production `.env` manually (don't commit it to git)
- Make sure to set `APP_DEBUG=false` in production
- Check error logs at: `/public_html/api-secondbrain/storage/logs/laravel.log`

## 📚 Full Documentation
See `DEPLOYMENT.md` for detailed instructions and troubleshooting.
