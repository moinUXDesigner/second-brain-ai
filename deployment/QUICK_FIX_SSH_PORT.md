# \ud83d\udd27 Quick Fix - Add Missing SSH_PORT Secret

## \u26a0\ufe0f Issue Found

Your deployment is failing because **SSH_PORT** secret is missing!

Hostinger uses a **custom SSH port** (not the default port 22).

---

## \u2705 Solution - Add SSH_PORT Secret

### Step 1: Find Your SSH Port

1. Login to **Hostinger hPanel**: https://hpanel.hostinger.com
2. Go to: **Advanced** \u2192 **SSH Access**
3. Look for **"Port"** number

**Common Hostinger SSH ports:**
- `65002`
- `21098`
- `2222`

### Step 2: Add to GitHub Secrets

1. Go to: https://github.com/moinUXDesigner/second-brain-ai/settings/secrets/actions
2. Click **"New repository secret"**
3. **Name:** `SSH_PORT`
4. **Value:** Your port number (e.g., `65002`)
5. Click **"Add secret"**

---

## \ud83d\udd0d Verify Other SSH Secrets

While you're there, double-check these secrets are correct:

### SSH_HOST
**Should be:** `srv1641.hostinger.com` (or similar)
**NOT:** `khajamynuddin.com` or `secondbrain.khajamynuddin.com`

To find correct value:
- Hostinger hPanel \u2192 Advanced \u2192 SSH Access
- Look for "Hostname" or "Server"

### SSH_USERNAME
**Should be:** `u484303972` (your Hostinger username)

### SSH_PRIVATE_KEY
**Should include:**
```
-----BEGIN OPENSSH PRIVATE KEY-----
... (many lines)
-----END OPENSSH PRIVATE KEY-----
```

**Must have:**
- Line breaks preserved
- BEGIN and END lines included
- No extra spaces

---

## \ud83d\ude80 After Adding SSH_PORT

### Option 1: Push to Deploy
```bash
git push origin master
```

### Option 2: Manual Trigger
1. Go to: https://github.com/moinUXDesigner/second-brain-ai/actions
2. Click "Deploy to Hostinger via SSH"
3. Click "Run workflow"

---

## \ud83d\udcdd Expected Deployment Flow

After fixing SSH_PORT, you should see:

1. \u2705 Validate Required Secrets
2. \u2705 Setup Node.js
3. \u2705 Install frontend dependencies
4. \u2705 Build frontend
5. \u2705 Setup SSH Key
6. \u2705 Test SSH Connection \u2190 **This should now work!**
7. \u2705 Deploy Frontend
8. \u2705 Deploy Backend
9. \u2705 Run Migrations
10. \u2705 Optimize Laravel

---

## \ud83c\udfaf After Successful Deployment

Your app will be live at:
- **Frontend:** https://secondbrain.khajamynuddin.com
- **Backend API:** https://api-secondbrain.khajamynuddin.com

---

## \ud83d\udd0d Still Having Issues?

### Test SSH Locally

From your computer, test the connection:

```bash
ssh -p YOUR_PORT YOUR_USERNAME@YOUR_HOST
```

Example:
```bash
ssh -p 65002 u484303972@srv1641.hostinger.com
```

If this works locally, then your secrets are correct!

---

## \ud83d\udcde Need Help Finding SSH Details?

**Hostinger Support can provide:**
- Exact SSH hostname
- SSH port number
- Confirm your username

Contact: https://www.hostinger.com/contact
