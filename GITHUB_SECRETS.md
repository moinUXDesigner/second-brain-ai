# GitHub Secrets Configuration Guide

## Required GitHub Secrets

Go to your GitHub repository: `Settings` → `Secrets and variables` → `Actions` → `New repository secret`

Add the following secrets:

### FTP Configuration (Required)
```
FTP_SERVER
  Value: ftp.khajamynuddin.com (or your Hostinger FTP server)
  Example: ftp.yourdomain.com

FTP_USERNAME
  Value: Your FTP username from Hostinger
  Example: u123456789

FTP_PASSWORD
  Value: Your FTP password from Hostinger
```

### SSH Configuration (Required for migrations)
```
SSH_HOST
  Value: Your Hostinger SSH host
  Example: ssh.khajamynuddin.com or IP address

SSH_USERNAME
  Value: Your SSH username (usually same as FTP username)
  Example: u123456789

SSH_PASSWORD
  Value: Your SSH password (usually same as FTP password)

SSH_PORT
  Value: SSH port (usually 22 or 65002 for Hostinger)
  Example: 65002
```

### Database Configuration (Required)
```
DB_HOST
  Value: localhost (for Hostinger shared hosting)

DB_PORT
  Value: 3306

DB_DATABASE
  Value: Your database name from Hostinger
  Example: u123456789_secondbrain

DB_USERNAME
  Value: Your database username
  Example: u123456789_dbuser

DB_PASSWORD
  Value: Your database password
```

### Laravel Configuration (Required)
```
LARAVEL_APP_KEY
  Value: Generate using: php artisan key:generate --show
  Example: base64:abcdefghijklmnopqrstuvwxyz1234567890ABCDEFGH=
  
  To generate locally:
  1. cd backend
  2. php artisan key:generate --show
  3. Copy the output (including "base64:" prefix)
```

### OpenAI Configuration (Required)
```
OPENAI_API_KEY
  Value: Your OpenAI API key
  Example: sk-proj-...
```

### Firebase Configuration (Optional - if using Firebase)
```
VITE_FIREBASE_API_KEY
  Value: Your Firebase API key

VITE_FIREBASE_AUTH_DOMAIN
  Value: your-project.firebaseapp.com

VITE_FIREBASE_PROJECT_ID
  Value: your-project-id

VITE_FIREBASE_STORAGE_BUCKET
  Value: your-project.appspot.com

VITE_FIREBASE_MESSAGING_SENDER_ID
  Value: 123456789012

VITE_FIREBASE_APP_ID
  Value: 1:123456789012:web:abcdef123456
```

### Google Apps Script (Optional)
```
VITE_GAS_WEB_APP_URL
  Value: Your Google Apps Script web app URL
  Example: https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec
```

## How to Find Hostinger Credentials

### FTP Credentials
1. Login to Hostinger hPanel
2. Go to `Files` → `FTP Accounts`
3. Find or create FTP account for your domain
4. Note: Server, Username, Password

### SSH Credentials
1. Login to Hostinger hPanel
2. Go to `Advanced` → `SSH Access`
3. Enable SSH if not already enabled
4. Note: SSH Host, Port (usually 65002), Username, Password

### Database Credentials
1. Login to Hostinger hPanel
2. Go to `Databases` → `MySQL Databases`
3. Create database if not exists
4. Create database user
5. Assign user to database
6. Note: Database name, Username, Password

## Testing the Workflow

### Manual Trigger
1. Go to your GitHub repository
2. Click `Actions` tab
3. Select `Deploy to Hostinger` workflow
4. Click `Run workflow` → `Run workflow`

### Automatic Trigger
- Push to `master` branch will automatically trigger deployment

## Troubleshooting

### FTP Connection Failed
- Verify FTP_SERVER, FTP_USERNAME, FTP_PASSWORD are correct
- Check if FTP is enabled in Hostinger
- Try using IP address instead of domain for FTP_SERVER

### SSH Connection Failed
- Verify SSH is enabled in Hostinger hPanel
- Check SSH_PORT (Hostinger usually uses 65002, not 22)
- Verify SSH_USERNAME and SSH_PASSWORD

### Database Connection Failed
- Verify database exists in Hostinger
- Check DB_HOST is set to "localhost"
- Verify DB_USERNAME has privileges on DB_DATABASE

### Laravel APP_KEY Error
- Generate key locally: `php artisan key:generate --show`
- Copy the entire output including "base64:" prefix
- Add to GitHub Secrets as LARAVEL_APP_KEY

### Migration Failed
- Check database credentials are correct
- Verify SSH connection works
- Check file permissions on server

## Security Notes

⚠️ **IMPORTANT:**
- Never commit secrets to git
- Keep your .env files in .gitignore
- Rotate passwords regularly
- Use strong passwords for FTP/SSH
- Enable 2FA on GitHub account
- Limit FTP/SSH access to specific IPs if possible

## Workflow Features

✅ Automatic deployment on push to master
✅ Manual deployment trigger available
✅ Frontend build and deploy
✅ Backend deploy with dependencies
✅ Database migrations
✅ Cache optimization
✅ File permissions setup

## Post-Deployment Checklist

After first successful deployment:
1. ✅ Visit https://secondbrain.khajamynuddin.com
2. ✅ Test API: https://api-secondbrain.khajamynuddin.com/api/health
3. ✅ Enable SSL certificates in Hostinger
4. ✅ Force HTTPS redirect
5. ✅ Test login functionality
6. ✅ Check error logs if issues occur

## Support

If deployment fails:
1. Check GitHub Actions logs for error details
2. Verify all secrets are correctly set
3. Test FTP/SSH credentials manually
4. Check Hostinger error logs
5. Review DEPLOYMENT.md for manual deployment steps
