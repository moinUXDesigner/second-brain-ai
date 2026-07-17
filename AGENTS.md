# Repository Guidelines

## Project Structure & Module Organization

The React/Vite app lives in `src/`, with screens in `src/features/`, shared UI in `src/components/`, API clients in `src/services/`, stores in `src/app/store/`, hooks in `src/hooks/`, and utilities in `src/utils/`. Static assets are in `public/`; built output goes to `dist/`.

The Laravel API is under `backend/`: controllers in `backend/app/Http/Controllers/`, models in `backend/app/Models/`, services in `backend/app/Services/`, migrations in `backend/database/migrations/`, and routes in `backend/routes/api.php`. Google Apps Script integrations are in `gas/` and `gas-backend/`.

## Build, Test, and Development Commands

- `npm install`: install frontend dependencies.
- `npm run dev`: start the Vite development server.
- `npm run build`: type-check with `tsc -b` and build the production frontend.
- `npm run lint`: run ESLint over the frontend.
- `docker-compose up -d`: start Laravel API, MariaDB, and phpMyAdmin.
- `cd backend && composer install`: install backend dependencies.
- `cd backend && php artisan migrate --seed`: apply database migrations and seed data.
- `cd backend && vendor/bin/pint`: format PHP when dependencies are installed.

## Coding Style & Naming Conventions

Use TypeScript, React function components, and existing feature-folder patterns. Components/pages use PascalCase filenames such as `TodayPage.tsx`; hooks use `useX.ts`; services use camelCase names such as `taskService.ts`. Prefer aliases like `@/utils/cn`. Keep styling in Tailwind utilities.

PHP follows Laravel conventions: singular models, `Controller` classes, and `Service` classes.

## Testing Guidelines

There is no committed frontend test script yet, so run `npm run lint` and `npm run build` before UI changes. Backend dev dependencies include PHPUnit; add API tests under `backend/tests/` and run `cd backend && vendor/bin/phpunit`.

## Commit & Pull Request Guidelines

Recent commits are short and outcome-focused, for example `feat: Project status bug fixed` or `Display task AI and actual time`. Use concise imperative messages, optionally prefixed with `feat:`, `fix:`, or `chore:`.

Pull requests should include a summary, affected frontend/backend areas, commands run, linked issues when available, and screenshots for visible UI changes. Mention required environment variables or deployment secret changes.

## Security & Configuration Tips

Do not commit real secrets. Use `.env.example` files and GitHub Actions secrets for database credentials, Firebase keys, OpenAI keys, SSH settings, and GAS URLs. Keep generated artifacts, local tokens, and database dumps out of review unless required.
