# Automated Deployment with GitHub Actions

This project includes automated deployment to Hostinger using GitHub Actions.

## 🚀 Deployment Options

### Option 1: Full Automation (Recommended)
**File:** `.github/workflows/deploy.yml`
- ✅ Automatic frontend build and deploy
- ✅ Automatic backend deploy
- ✅ Automatic database migrations via SSH
- ✅ Cache optimization
- ✅ File permissions setup
- ⚠️ Requires SSH access (available on most Hostinger plans)

### Option 2: FTP Only
**File:** `.github/workflows/deploy-ftp-only.yml`
- ✅ Automatic frontend build and deploy
- ✅ Automatic backend deploy
- ⚠️ Manual migration step required (via browser)
- ⚠️ Manual permission setup required
- ✅ Works without SSH access

## 📋 Setup Instructions

### Step 1: Choose Your Workflow

**If you have SSH access (recommended):**
- Keep `deploy.yml` active
- Delete or disable `deploy-ftp-only.yml`

**If you don't have SSH access:**
- Rename `deploy-ftp-only.yml` to `deploy.yml`
- Delete the original `deploy.yml`

### Step 2: Configure GitHub Secrets

Go to: `Repository Settings` → `Secrets and variables` → `Actions`

**Required for both options:**
```
FTP_SERVER          - Your Hostinger FTP server
FTP_USERNAME        - Your FTP username
FTP_PASSWORD        - Your FTP password
DB_HOST             - Database host (usually "localhost")
DB_PORT             - Database port (usually "3306")
DB_DATABASE         - Your database name
DB_USERNAME         - Your database username
DB_PASSWORD         - Your database password
LARAVEL_APP_KEY     - Generate with: php artisan key:generate --show
OPENAI_API_KEY      - Your OpenAI API key
```

**Additional for SSH deployment:**
```
SSH_HOST            - Your SSH host
SSH_USERNAME        - Your SSH username
SSH_PASSWORD        - Your SSH password
SSH_PORT            - SSH port (usually 65002 for Hostinger)
```

**Optional (if using):**
```
VITE_GAS_WEB_APP_URL
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
```

📖 **Detailed guide:** See `GITHUB_SECRETS.md`

### Step 3: Configure Subdomains in Hostinger

1. Login to Hostinger hPanel
2. Go to `Domains` → `Subdomains`
3. Create two subdomains:
   - `secondbrain.khajamynuddin.com` → `/public_html/secondbrain`
   - `api-secondbrain.khajamynuddin.com` → `/public_html/api-secondbrain/public`

### Step 4: Create Database

1. Go to `Databases` → `MySQL Databases`
2. Create new database
3. Create database user
4. Assign user to database with all privileges
5. Save credentials for GitHub Secrets

### Step 5: Deploy!

**Automatic deployment:**
```bash
git add .
git commit -m "Configure deployment"
git push origin master
```

**Manual deployment:**
1. Go to GitHub repository
2. Click `Actions` tab
3. Select `Deploy to Hostinger`
4. Click `Run workflow`

### Step 6: Post-Deployment (FTP Only)

If using FTP-only deployment:
1. Visit: `https://api-secondbrain.khajamynuddin.com/migrate.php`
2. Wait for migrations to complete
3. **DELETE** `migrate.php` file via FTP/File Manager
4. Set permissions via File Manager:
   - `storage/` → 755
   - `bootstrap/cache/` → 755

### Step 7: Enable SSL

1. Go to Hostinger hPanel
2. Navigate to `SSL` section
3. Enable SSL for both subdomains
4. Enable "Force HTTPS"

## 🧪 Testing

After deployment:
- Frontend: https://secondbrain.khajamynuddin.com
- Backend API: https://api-secondbrain.khajamynuddin.com/api/health

## 📊 Monitoring Deployments

1. Go to GitHub repository
2. Click `Actions` tab
3. View deployment history and logs
4. Check for errors if deployment fails

## 🔧 Troubleshooting

### Deployment Failed
- Check GitHub Actions logs for error details
- Verify all secrets are correctly configured
- Test FTP credentials manually

### Frontend Shows Blank Page
- Check browser console for errors
- Verify API URL in build logs
- Check `.htaccess` file exists

### Backend Returns 500 Error
- Check `storage/logs/laravel.log` on server
- Verify database credentials
- Check file permissions

### Database Connection Failed
- Verify DB_HOST is "localhost"
- Check database exists in Hostinger
- Verify user has privileges

### SSH Connection Failed
- Verify SSH is enabled in Hostinger
- Check SSH_PORT (usually 65002, not 22)
- Try FTP-only deployment instead

## 📚 Additional Resources

- `GITHUB_SECRETS.md` - Detailed secrets configuration guide
- `DEPLOYMENT.md` - Manual deployment instructions
- `DEPLOYMENT_CHECKLIST.md` - Quick reference checklist

## 🔒 Security Best Practices

- ✅ Never commit secrets to git
- ✅ Keep `.env` files in `.gitignore`
- ✅ Rotate passwords regularly
- ✅ Enable 2FA on GitHub
- ✅ Use strong passwords
- ✅ Delete migration scripts after use
- ✅ Set `APP_DEBUG=false` in production

## 🎯 Workflow Triggers

- **Automatic:** Push to `master` branch
- **Manual:** GitHub Actions → Run workflow button

## 📝 Notes

- First deployment may take 3-5 minutes
- Subsequent deployments are faster (incremental)
- Frontend is cleaned on each deploy (fresh build)
- Backend preserves uploaded files and logs
- Database migrations run automatically (SSH) or manually (FTP-only)

## 🆘 Support

If you encounter issues:
1. Check GitHub Actions logs
2. Review Hostinger error logs
3. Verify all secrets are set correctly
4. Test credentials manually
5. Try manual deployment as fallback

---

**Deployment Status:** Check the badge in repository README
**Last Updated:** 2026-04-10
