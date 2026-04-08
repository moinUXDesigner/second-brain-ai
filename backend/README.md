# Second Brain AI — Backend Setup & Deployment Guide

## Project Structure

```
Tasks/
├── backend/          ← Laravel 11 API
├── src/              ← React frontend
├── docker-compose.yml
└── ...
```

---

## LOCAL DEVELOPMENT SETUP

### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running
- Node.js 18+ (for frontend)
- Git

---

### Step 1 — Clone & configure environment

```bash
# Copy backend env
cp backend/.env.example backend/.env
```

Edit `backend/.env` — the defaults work for Docker as-is.
Only add your OpenAI key if you want AI features:
```
OPENAI_API_KEY=sk-...
```

---

### Step 2 — Start Docker containers

```bash
docker-compose up -d
```

This starts:
| Service     | URL                        |
|-------------|----------------------------|
| Laravel API | http://localhost:8000/api  |
| phpMyAdmin  | http://localhost:8080      |
| MariaDB     | localhost:3306             |

---

### Step 3 — Install Laravel dependencies & run migrations

```bash
# Enter the app container
docker exec -it second_brain_app bash

# Inside container:
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate --seed
exit
```

The seed creates a default admin user:
- Email: `admin@secondbrain.ai`
- Password: `password`

---

### Step 4 — Start the React frontend

```bash
# In the project root (d:\Tasks)
npm install
npm run dev
```

Frontend runs at: http://localhost:3000

---

### Step 5 — Test the API

```bash
# Login
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@secondbrain.ai","password":"password"}'
```

---

## HOSTINGER SHARED HOSTING DEPLOYMENT

> Hostinger shared hosting supports PHP 8.2 + MySQL/MariaDB.
> No Docker needed on shared hosting — Laravel runs natively.

---

### Backend Deployment (Laravel on Hostinger)

#### Step 1 — Prepare the build locally

```bash
# Inside the app container or with local PHP/Composer
cd backend
composer install --no-dev --optimize-autoloader
php artisan config:cache
php artisan route:cache
```

#### Step 2 — Upload files via FTP / File Manager

Upload the entire `backend/` folder contents to Hostinger.
**Important:** Point your domain's document root to `backend/public/`
(In Hostinger hPanel → Domains → Manage → Document Root → set to `public_html/api/public` or similar)

Recommended structure on Hostinger:
```
public_html/
├── api/              ← upload backend/ contents here
│   ├── public/       ← set as document root for api.yourdomain.com
│   ├── app/
│   ├── ...
```

#### Step 3 — Create MariaDB database on Hostinger

In hPanel → Databases → MySQL Databases:
1. Create database: `second_brain`
2. Create user + assign to database
3. Note the host (usually `localhost` on shared hosting)

#### Step 4 — Set environment variables on Hostinger

Create `backend/.env` on the server (via File Manager):
```
APP_ENV=production
APP_DEBUG=false
APP_URL=https://api.yourdomain.com

DB_CONNECTION=mariadb
DB_HOST=localhost
DB_PORT=3306
DB_DATABASE=your_db_name
DB_USERNAME=your_db_user
DB_PASSWORD=your_db_password

SANCTUM_STATEFUL_DOMAINS=yourdomain.com
CORS_ALLOWED_ORIGINS=https://yourdomain.com

OPENAI_API_KEY=sk-...
```

#### Step 5 — Run migrations on Hostinger

Use Hostinger's Terminal (SSH) or run via a temporary PHP file:
```bash
php artisan migrate --seed --force
php artisan key:generate
php artisan storage:link
```

---

### Frontend Deployment (React on GitHub Pages — existing workflow)

Your existing GitHub Actions workflow deploys the React app to GitHub Pages.

Update `backend/.env` (frontend) before building:
```
VITE_API_BASE_URL=https://api.yourdomain.com/api
```

Or set it as a GitHub Actions secret:
1. Go to repo → Settings → Secrets → Actions
2. Add: `VITE_API_BASE_URL` = `https://api.yourdomain.com/api`

Update `.github/workflows/deploy.yml` to pass the env var during build:
```yaml
- name: Build
  run: npm run build
  env:
    VITE_API_BASE_URL: ${{ secrets.VITE_API_BASE_URL }}
```

---

### CORS on Production

In `backend/.env` on Hostinger:
```
CORS_ALLOWED_ORIGINS=https://yourusername.github.io
```

---

## API ENDPOINTS REFERENCE

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Register |
| POST | /api/auth/login | Login → returns token |
| GET  | /api/auth/profile | Get current user |
| POST | /api/auth/logout | Logout |
| GET  | /api/tasks | All tasks |
| GET  | /api/tasks/today | Today's tasks |
| POST | /api/tasks | Create task |
| PUT  | /api/tasks/{id} | Update task |
| PATCH| /api/tasks/{id}/status | Update status |
| DELETE| /api/tasks/{id} | Soft delete |
| GET  | /api/projects | All projects |
| GET  | /api/projects/deleted | Deleted projects |
| POST | /api/projects | Create project |
| PUT  | /api/projects/{id} | Update project |
| DELETE| /api/projects/{id} | Soft delete |
| PATCH| /api/projects/{id}/restore | Restore |
| GET  | /api/daily-state | Get daily state |
| POST | /api/daily-state | Save daily state |
| GET  | /api/profile | Get profile |
| POST | /api/profile | Save profile |
| POST | /api/ai/analyze | Analyze input (AI) |
| POST | /api/input | Create task or project |
| GET  | /api/dashboard | Dashboard stats |
| POST | /api/pipeline/run | Run full AI pipeline |
| POST | /api/pipeline/today | Generate today view |
| GET  | /api/audit-logs | Get audit logs |
| POST | /api/audit-logs | Create audit log |
