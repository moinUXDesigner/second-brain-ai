# Prefill both forms from the day's saved state

## Summary
Daily State and the Smart View generation form will load the latest saved inputs for today, regardless of which screen the user saves from first. Only saved values are shared.

## Implementation
- Use a shared daily-state hook with the existing date-specific query key and API. Load energy, mood, focus, available time, activity preference, notes, and last-updated time.
- Load saved values when Daily State opens and whenever the Smart View modal opens. Keep the form unavailable while loading; show a retry option if loading fails.
- Use existing defaults only when no state exists for that day. Apply defaults with nullish checks so valid saved values such as zero available time are preserved.
- After saving from either screen, update the shared query cache with the server response. Smart View will preserve saved notes while updating its visible fields.
- Use the existing midnight rollover hook in both screens. Reset and reload for the new day, ignoring stale requests from the previous day.
- Keep edits local until Save or Generate. Reopening the Smart View modal restores saved values.
- Keep existing API contracts; no database migration is required.

## Validation
- Save Daily State, then open Smart View: all corresponding inputs match.
- Generate Smart View first, then open Daily State: saved inputs match.
- Change and save values in either screen; reopening the other shows the latest values.
- Verify Smart View generation preserves Daily State notes, including when generation fails after the save succeeds.
- Verify canceled edits are discarded, missing records use defaults, load failures offer retry, and midnight rollover never carries yesterday's values forward.
- Run `npm run lint` and `npm run build`.

## Assumptions
- The day means today in the app's existing local-date convention.
- Notes remain editable only in Daily State.
- Prefilled values remain editable before saving or generating.
