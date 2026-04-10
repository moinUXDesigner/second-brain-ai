# ⚠️ SETUP REQUIRED: Configure GitHub Secrets

## The deployment is failing because GitHub Secrets are not configured yet.

### 🔧 Quick Setup (5 minutes)

#### Step 1: Go to GitHub Secrets
Open this URL in your browser:
```
https://github.com/moinUXDesigner/second-brain-ai/settings/secrets/actions
```

#### Step 2: Click "New repository secret" and add these one by one:

### 🔑 Required Secrets (Minimum to deploy)

#### FTP Configuration
```
Name: FTP_SERVER
Value: ftp.khajamynuddin.com
(Get from Hostinger → Files → FTP Accounts)
```

```
Name: FTP_USERNAME
Value: [Your FTP username from Hostinger]
(Example: u123456789)
```

```
Name: FTP_PASSWORD
Value: [Your FTP password from Hostinger]
```

#### Database Configuration
```
Name: DB_HOST
Value: localhost
```

```
Name: DB_PORT
Value: 3306
```

```
Name: DB_DATABASE
Value: [Your database name from Hostinger]
(Example: u123456789_secondbrain)
```

```
Name: DB_USERNAME
Value: [Your database username]
```

```
Name: DB_PASSWORD
Value: [Your database password]
```

#### Laravel Configuration
```
Name: LARAVEL_APP_KEY
Value: [Generate this - see below]
```

**To generate LARAVEL_APP_KEY:**
1. Open terminal in your project
2. Run: `cd backend`
3. Run: `php artisan key:generate --show`
4. Copy the entire output (including "base64:" prefix)
5. Paste as the secret value

#### OpenAI Configuration
```
Name: OPENAI_API_KEY
Value: [Your OpenAI API key]
(The one from your local backend/.env file)
```

### 📍 Where to Find Hostinger Credentials

#### FTP Credentials:
1. Login to Hostinger hPanel: https://hpanel.hostinger.com
2. Go to: **Files** → **FTP Accounts**
3. Find your FTP account or create new one
4. Copy: Server, Username, Password

#### Database Credentials:
1. Login to Hostinger hPanel
2. Go to: **Databases** → **MySQL Databases**
3. Create database if not exists:
   - Click "Create Database"
   - Name it (e.g., u123456789_secondbrain)
4. Create database user:
   - Click "Create User"
   - Set username and password
5. Assign user to database:
   - Select database
   - Select user
   - Grant all privileges
6. Copy: Database name, Username, Password

### 🔐 SSH Configuration (Optional - for full automation)

If you want automatic migrations (recommended):

```
Name: SSH_HOST
Value: [Your SSH host from Hostinger]
(Example: ssh.khajamynuddin.com or IP address)
```

```
Name: SSH_USERNAME
Value: [Usually same as FTP username]
```

```
Name: SSH_PASSWORD
Value: [Usually same as FTP password]
```

```
Name: SSH_PORT
Value: 65002
(Hostinger usually uses port 65002, not 22)
```

**To find SSH details:**
1. Hostinger hPanel → **Advanced** → **SSH Access**
2. Enable SSH if not enabled
3. Copy: Host, Port, Username, Password

### ✅ After Adding All Secrets

1. Go to: https://github.com/moinUXDesigner/second-brain-ai/actions
2. Click on the failed workflow run
3. Click "Re-run all jobs"

OR

Simply push a new commit:
```bash
git commit --allow-empty -m "Trigger deployment after secrets setup"
git push origin master
```

### 🎯 Minimum Secrets to Start

If you want to test quickly, add at least these 9 secrets:
1. FTP_SERVER
2. FTP_USERNAME
3. FTP_PASSWORD
4. DB_HOST
5. DB_PORT
6. DB_DATABASE
7. DB_USERNAME
8. DB_PASSWORD
9. LARAVEL_APP_KEY
10. OPENAI_API_KEY

### 📞 Need Help?

- Full guide: See `GITHUB_SECRETS.md`
- Deployment docs: See `GITHUB_ACTIONS_DEPLOYMENT.md`
- Manual deployment: See `DEPLOYMENT.md`

### 🔒 Security Note

✅ Secrets are encrypted and never exposed in logs
✅ Only GitHub Actions can access them
✅ Never commit secrets to your repository
