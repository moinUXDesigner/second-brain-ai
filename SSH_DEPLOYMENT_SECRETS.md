# GitHub Secrets for SSH Deployment

## 🔑 Required GitHub Secrets

Go to: https://github.com/moinUXDesigner/second-brain-ai/settings/secrets/actions

Click "New repository secret" and add each of these:

---

## SSH Configuration (Required)

### 1. SSH_HOST
**Description:** Your Hostinger server hostname or IP address

**How to find:**
1. Login to Hostinger hPanel
2. Go to **Advanced** → **SSH Access**
3. Look for "Hostname" or "Server IP"

**Example values:**
```
ssh.khajamynuddin.com
OR
123.456.789.012
```

**Secret Name:** `SSH_HOST`
**Secret Value:** Your hostname or IP

---

### 2. SSH_USERNAME
**Description:** Your SSH username (usually same as hosting username)

**How to find:**
1. Hostinger hPanel → **Advanced** → **SSH Access**
2. Look for "Username"

**Example values:**
```
u123456789
OR
khajamynuddin
```

**Secret Name:** `SSH_USERNAME`
**Secret Value:** Your SSH username

---

### 3. SSH_PRIVATE_KEY
**Description:** Your SSH private key for authentication

**How to generate and add:**

#### Option A: Generate New SSH Key (Recommended)

**On your local machine (Windows):**

1. Open PowerShell or Git Bash
2. Generate SSH key:
   ```bash
   ssh-keygen -t rsa -b 4096 -C "github-actions@secondbrain"
   ```
3. When prompted for file location, press Enter (default location)
4. When prompted for passphrase, press Enter (no passphrase for automation)
5. This creates two files:
   - `~/.ssh/id_rsa` (private key) - Keep this SECRET
   - `~/.ssh/id_rsa.pub` (public key) - Upload to server

**Copy the private key:**
```bash
# Windows PowerShell
Get-Content ~/.ssh/id_rsa | clip

# Git Bash / Linux
cat ~/.ssh/id_rsa
```

**Add public key to Hostinger:**
1. Copy the public key:
   ```bash
   # Windows PowerShell
   Get-Content ~/.ssh/id_rsa.pub
   
   # Git Bash / Linux
   cat ~/.ssh/id_rsa.pub
   ```
2. Login to Hostinger hPanel
3. Go to **Advanced** → **SSH Access**
4. Click "Manage SSH Keys" or "Add SSH Key"
5. Paste the PUBLIC key content
6. Save

**Secret Name:** `SSH_PRIVATE_KEY`
**Secret Value:** Paste the ENTIRE content of `id_rsa` (private key)
```
-----BEGIN RSA PRIVATE KEY-----
MIIEpAIBAAKCAQEA...
(many lines)
...
-----END RSA PRIVATE KEY-----
```

⚠️ **IMPORTANT:** 
- Copy the ENTIRE private key including the BEGIN and END lines
- Never share your private key
- The private key should have multiple lines

---

#### Option B: Use Existing SSH Key

If you already have SSH access to Hostinger:

1. Find your private key (usually `~/.ssh/id_rsa`)
2. Copy the entire content
3. Add to GitHub Secrets

---

## Database Configuration (Required)

### 4. DB_HOST
**Secret Name:** `DB_HOST`
**Secret Value:** `localhost`

---

### 5. DB_PORT
**Secret Name:** `DB_PORT`
**Secret Value:** `3306`

---

### 6. DB_DATABASE
**Description:** Your MySQL database name from Hostinger

**How to find:**
1. Hostinger hPanel → **Databases** → **MySQL Databases**
2. Look for your database name

**Example:** `u123456789_secondbrain`

**Secret Name:** `DB_DATABASE`
**Secret Value:** Your database name

---

### 7. DB_USERNAME
**Description:** Your MySQL database username

**How to find:**
1. Hostinger hPanel → **Databases** → **MySQL Databases**
2. Look for the username assigned to your database

**Example:** `u123456789_dbuser`

**Secret Name:** `DB_USERNAME`
**Secret Value:** Your database username

---

### 8. DB_PASSWORD
**Description:** Your MySQL database password

**Secret Name:** `DB_PASSWORD`
**Secret Value:** Your database password

---

## Laravel Configuration (Required)

### 9. LARAVEL_APP_KEY
**Description:** Laravel application encryption key

**How to generate:**

1. Open terminal in your project
2. Run:
   ```bash
   cd backend
   php artisan key:generate --show
   ```
3. Copy the output (including "base64:" prefix)

**Example output:**
```
base64:abcdefghijklmnopqrstuvwxyz1234567890ABCDEFGH=
```

**Secret Name:** `LARAVEL_APP_KEY`
**Secret Value:** The entire output from the command

---

## OpenAI Configuration (Required)

### 10. OPENAI_API_KEY
**Description:** Your OpenAI API key

**How to find:**
- Check your local `backend/.env` file
- Or get from: https://platform.openai.com/api-keys

**Example:** `sk-proj-...`

**Secret Name:** `OPENAI_API_KEY`
**Secret Value:** Your OpenAI API key

---

## Optional Secrets (If Using)

### VITE_GAS_WEB_APP_URL
**Secret Name:** `VITE_GAS_WEB_APP_URL`
**Secret Value:** Your Google Apps Script URL (if using)

### Firebase Secrets (if using Firebase)
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

---

## 📋 Quick Checklist

Before deploying, make sure you have added these 10 required secrets:

- [ ] SSH_HOST
- [ ] SSH_USERNAME
- [ ] SSH_PRIVATE_KEY
- [ ] DB_HOST
- [ ] DB_PORT
- [ ] DB_DATABASE
- [ ] DB_USERNAME
- [ ] DB_PASSWORD
- [ ] LARAVEL_APP_KEY
- [ ] OPENAI_API_KEY

---

## 🧪 Testing SSH Connection

Before deploying, test your SSH connection locally:

```bash
# Test SSH connection
ssh -i ~/.ssh/id_rsa YOUR_USERNAME@YOUR_HOST

# If successful, you should see the server prompt
# Type 'exit' to disconnect
```

---

## 🚀 Deploy After Setup

Once all secrets are configured:

1. **Automatic deployment:**
   ```bash
   git push origin master
   ```

2. **Manual deployment:**
   - Go to: https://github.com/moinUXDesigner/second-brain-ai/actions
   - Click "Deploy to Hostinger via SSH"
   - Click "Run workflow"

---

## 🔒 Security Best Practices

✅ **DO:**
- Use SSH keys instead of passwords
- Generate separate keys for GitHub Actions
- Keep private keys secret
- Use strong database passwords
- Rotate keys regularly

❌ **DON'T:**
- Share your private key
- Commit secrets to git
- Use the same key everywhere
- Use weak passwords

---

## 🆘 Troubleshooting

### "Permission denied (publickey)"
- Make sure you added the PUBLIC key to Hostinger
- Verify the PRIVATE key is correctly copied to GitHub Secrets
- Check that the key doesn't have a passphrase

### "Host key verification failed"
- The workflow handles this automatically with `ssh-keyscan`
- If issues persist, check SSH_HOST is correct

### "Connection refused"
- Verify SSH is enabled in Hostinger
- Check SSH_HOST and SSH_USERNAME are correct
- Confirm your hosting plan supports SSH

---

## 📞 Need Help?

- Check deployment logs: https://github.com/moinUXDesigner/second-brain-ai/actions
- Review Hostinger SSH documentation
- Verify all secrets are set correctly
