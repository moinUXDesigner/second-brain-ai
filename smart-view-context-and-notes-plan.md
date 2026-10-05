# Make Smart View use all daily inputs and notes

## Summary
Smart View will consider the selected day's energy, mood, focus, available time, activity preference, and notes. Add editable notes to the generation popup. Always include eligible tasks scheduled for that day; use rules with a visible notice when AI is unavailable.

## Implementation
- Save this plan before implementation.
- Add a labeled, prefilled notes textarea; save edits including clearing before generation. Keep canceled edits local and make the popup scrollable.
- Resolve daily state by requested date, using defaults when missing, and recalculate fit scores every generation.
- Rank eligible tasks with the existing AI service using daily inputs, daily/task notes, durations, due dates, and project context. Validate ordered existing IDs; reject duplicates and malformed responses.
- Include scheduled tasks first. Fill remaining time from ranked optional tasks, skipping oversized tasks. Zero minutes permits only scheduled tasks.
- Fall back to deterministic priority, fit, and activity ranking on unavailable or invalid AI; visibly explain that daily notes were not interpreted.
- Build results before transactional replacement. Do not rewrite task titles, deadlines, or projects.
- Add nullable Today View positions and preserve recommendation order after reload; retain old sorting for legacy records.

## Interfaces and feedback
- Keep the generation endpoint and task-array response; add metadata for mode, available minutes, selected minutes, and scheduled overflow.
- Show fallback and overflow notices. Scheduled tasks stay included even beyond available time.
- Use the existing model/key with a 20-second AI timeout and 60-second generation client timeout.
- Add the position migration; no new secrets.

## Validation
- Mock AI to check complete context, exact-day state, fresh fit, valid ranking, and persistent order.
- Test missing state, empty lists, excluded statuses, recurrence, scheduled retention, overflow, zero minutes, and skipping oversized tasks.
- Test missing keys, HTTP failures, timeouts, invalid IDs, duplicates, malformed responses, and transactional rollback.
- Verify popup prefill/edit/clear/cancel, sharing, loading/retry, rollover, and mobile scrolling.
- Run PHPUnit, frontend build, and lint; report unavailable checks.

## Defaults
Scheduled tasks take precedence over notes requesting omission. AI affects the view without rewriting tasks.
