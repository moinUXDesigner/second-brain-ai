# 🔐 Add SSH_PASSPHRASE Secret

## ✅ Workflow Updated

The deployment workflow now supports SSH keys with passphrases!

---

## 📝 Add SSH_PASSPHRASE to GitHub Secrets

### Step 1: Go to GitHub Secrets

https://github.com/moinUXDesigner/second-brain-ai/settings/secrets/actions

### Step 2: Add New Secret

1. Click **"New repository secret"**
2. **Name:** `SSH_PASSPHRASE`
3. **Value:** Your SSH key passphrase (the password you use to unlock your private key)
4. Click **"Add secret"**

---

## 🔍 What is SSH_PASSPHRASE?

When you generated your SSH key, you were asked:

```
Enter passphrase (empty for no passphrase):
```

The passphrase you entered there is what you need to add as `SSH_PASSPHRASE`.

---

## ⚠️ Important Notes

### If You Don't Remember Your Passphrase

You'll need to generate a new SSH key pair:

```bash
# Generate new key without passphrase (easier for automation)
ssh-keygen -t rsa -b 4096 -C "github-actions" -N ""
```

This creates a key **without** a passphrase, which is actually **recommended for CI/CD**.

Then:
1. Copy the **public key** (`~/.ssh/id_rsa.pub`) to Hostinger
2. Copy the **private key** (`~/.ssh/id_rsa`) to GitHub Secret `SSH_PRIVATE_KEY`
3. **Don't add** `SSH_PASSPHRASE` secret (leave it empty or remove the validation)

---

## 🎯 Recommended Approach for CI/CD

For automated deployments, it's actually **better to use SSH keys WITHOUT passphrases**.

### Why?

- ✅ Simpler configuration
- ✅ No passphrase management needed
- ✅ More reliable in automation
- ✅ Still secure (private key is encrypted in GitHub Secrets)

### How to Generate Key Without Passphrase

```bash
ssh-keygen -t rsa -b 4096 -C "github-actions-secondbrain" -f ~/.ssh/github_actions_key -N ""
```

This creates:
- `~/.ssh/github_actions_key` (private key) → Add to `SSH_PRIVATE_KEY`
- `~/.ssh/github_actions_key.pub` (public key) → Add to Hostinger

---

## 🔄 Two Options

### Option 1: Add SSH_PASSPHRASE (Current Setup)

If you want to keep your passphrase-protected key:

1. Add `SSH_PASSPHRASE` secret with your passphrase
2. Deploy

### Option 2: Generate New Key Without Passphrase (Recommended)

1. Generate new key without passphrase
2. Add public key to Hostinger
3. Update `SSH_PRIVATE_KEY` secret with new private key
4. Remove passphrase requirement from workflow
5. Deploy

---

## 🚀 After Adding SSH_PASSPHRASE

Push to deploy:

```bash
git push origin master
```

Or trigger manually from GitHub Actions.

---

## 📋 Complete Secrets List (12 Total)

- [x] SSH_HOST
- [x] SSH_PORT
- [x] SSH_USERNAME
- [x] SSH_PRIVATE_KEY
- [ ] **SSH_PASSPHRASE** ← Add this now
- [x] DB_HOST
- [x] DB_PORT
- [x] DB_DATABASE
- [x] DB_USERNAME
- [x] DB_PASSWORD
- [x] LARAVEL_APP_KEY
- [x] OPENAI_API_KEY

---

## 🆘 Need Help?

If you don't remember your passphrase or want to switch to a passphrase-free key, let me know and I'll help you generate a new one!
