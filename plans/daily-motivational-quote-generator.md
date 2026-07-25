# Daily Motivational Quote Generator

## Context

The user wants a daily personalized motivational quote generated from: mood, energy, focus, a factual description of people's behavior today, how it affected them, what they want to protect/improve, a preferred tone, and a language. The app already has a **Daily State** feature (`src/features/daily-state/DailyStatePage.tsx` + `backend/app/Models/DailyState.php` + `DailyStateController`) that tracks mood/energy/focus per day, and an existing OpenAI integration (`backend/app/Services/AIService.php`, model `gpt-4o-mini`) used for task categorization. Rather than duplicating the mood/energy/focus UI and a new date-keyed table, this feature extends the existing Daily State page and table with the additional inputs and a "Generate Quote" action, persisting the result so it can be reviewed via the existing history endpoint.

## Backend (Laravel)

1. **Migration** — new file `backend/database/migrations/2024_01_01_000012_add_quote_fields_to_daily_states.php` adding nullable columns to `daily_states`:
   - `behaviour_today` (text)
   - `effect_on_me` (text)
   - `protect_or_improve` (text)
   - `tone` (string, e.g. `Gentle|Strong|Spiritual|Professional|Assertive`)
   - `language` (string, e.g. `English|Telugu|Hindi`)
   - `quote` (text) — the generated quote
   - `quote_generated_at` (timestamp, nullable)

2. **Model** — `backend/app/Models/DailyState.php`: add the new columns to `$fillable`.

3. **AIService** — `backend/app/Services/AIService.php`: add `generateMotivationalQuote(array $input): ?string`, following the same pattern as `generateProjectTitle()`/`analyzeInput()` (Http::withToken, `gpt-4o-mini`, try/catch + Log::warning, strip code fences). System prompt instructs the model to:
   - Use mood/energy/focus (1-10) plus the behaviour/effect/protect-or-improve text as context.
   - Never assume other people's intentions or motives — describe only what was stated.
   - Match the requested tone (Gentle/Strong/Spiritual/Professional/Assertive).
   - Write the quote in the requested language (English/Telugu/Hindi).
   - Return ONLY the quote text (1-3 sentences), no preamble/quotation marks/explanation.

4. **Controller** — `backend/app/Http/Controllers/DailyStateController.php`:
   - Extend `save()` validation to accept the new optional fields (`behaviour_today`, `effect_on_me`, `protect_or_improve`, `tone` in:Gentle,Strong,Spiritual,Professional,Assertive, `language` in:English,Telugu,Hindi) and persist them in `updateOrCreate`.
   - Add new method `generateQuote(Request $request)`: validates the same fields (all required this time) plus `date`, loads/creates the day's `DailyState`, calls `AIService::generateMotivationalQuote()`, saves `quote` + `quote_generated_at` on the row, returns the formatted state (including `quote`).
   - Extend `format()` to include `behaviourToday`, `effectOnMe`, `protectOrImprove`, `tone`, `language`, `quote`, `quoteGeneratedAt`.

5. **Routes** — `backend/routes/api.php`: add `POST /daily-state/quote` → `DailyStateController::generateQuote` alongside the existing `daily-state` routes.

## Frontend (React/TS)

1. **Types** — `src/types/index.ts`: extend `DailyState` interface with the new optional fields (`behaviourToday?`, `effectOnMe?`, `protectOrImprove?`, `tone?`, `language?`, `quote?`, `quoteGeneratedAt?`).

2. **Service** — `src/services/endpoints/dailyStateService.ts`: add `generateQuote(payload)` calling `POST /daily-state/quote`.

3. **UI** — `src/features/daily-state/DailyStatePage.tsx`:
   - Add state for the new fields, loaded from `dailyStateService.get()` same as existing fields.
   - New `Card` section: three textareas — "People's behaviour today", "How it affected me", "What I want to protect or improve" — with the existing placeholder-style guidance text (mirroring the example prompts the user gave, e.g. "Describe what they actually said or did, without guessing their intentions").
   - New `Card` section: tone selector (5 buttons like the existing `ACTIVITY_OPTIONS` pattern: Gentle/Strong/Spiritual/Professional/Assertive) and a language selector (English/Telugu/Hindi, same button style).
   - New "Generate My Quote" button that calls `dailyStateService.generateQuote()` with today's full payload (mood, energy, focus, behaviour, effect, protect, tone, language, date) and displays the returned quote in a styled `Card` (loading state while awaiting, toast on failure mirroring existing `handleSave` pattern).
   - Keep the existing "Save Daily State" button behavior; the new fields flow into the same `handleSave` payload too, so they persist even without generating a quote.

## Verification

- Run backend migration (`php artisan migrate`) and confirm new columns exist on `daily_states`.
- Start backend + frontend dev servers; open `/daily-state`.
- Fill mood/energy/focus sliders, the three new textareas, pick a tone and language, click "Generate My Quote" — confirm a quote appears matching tone/language and doesn't editorialize about others' intent.
- Reload the page and confirm previously entered fields and the last generated quote reload via `GET /daily-state`.
- Check `GET /daily-state/history` includes the new fields for past days.
- If `OPENAI_API_KEY` isn't configured, confirm `generateQuote` fails gracefully (matches existing null-return + toast-error pattern) rather than crashing.
