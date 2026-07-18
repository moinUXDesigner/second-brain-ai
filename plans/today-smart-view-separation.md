# Today / Smart View Split with Plan File Storage

## Summary
Implement a clean separation between scheduled work and AI-recommended work:

- `Today` becomes the page for tasks explicitly scheduled for **Saturday, July 18, 2026**.
- `Smart View` becomes a separate page for AI-generated recommended tasks.
- Store this implementation plan inside the repo under a new `plans/` folder before feature work begins.

Create the plan file as:
- `plans/today-smart-view-separation.md`

## Key Changes
### Plan File
- Create a new top-level folder: `plans/`
- Add `plans/today-smart-view-separation.md`
- Write the full approved implementation plan into that file before any code changes
- Keep the file concise and aligned to the actual implementation; update only if implementation materially diverges

### Backend
- Change `GET /tasks/today` so it returns **scheduled-only** tasks:
  - tasks with `due_date = requested date`
  - recurring tasks that occur on the requested date
  - exclude deleted/done/note/idea tasks from the returned list
- Add `GET /tasks/today/smart` for Smart View data:
  - return persisted `TodayView` rows for the requested date
  - format each task with the existing task formatter
  - preserve existing smart sorting behavior
- Keep `POST /pipeline/today` as the Smart View generation endpoint only
- Reuse the existing `TodayView` table and pipeline logic; no migration needed

### Frontend
- Keep `/today` as the scheduled-only page
- Add `/today/smart` as the Smart View page
- Add a sidebar item labeled `Smart View`
- On `Today` page:
  - remove the current inline Smart View generation role
  - replace the current Smart View action with navigation to `/today/smart`
  - keep search, edit, delete, completion, and batch update behavior for scheduled tasks
- On `Smart View` page:
  - use the current daily-state modal and AI generation flow
  - load smart tasks from the new smart endpoint
  - keep search, edit, delete, completion, and batch update behavior
  - show empty-state guidance to generate Smart View when no AI list exists yet
- Reuse `TodayTable` for both pages, with page-specific headings and empty states

### Data / Hooks / Routing
- Add a dedicated service method and React Query hook for Smart View tasks so scheduled and smart caches stay separate
- Add a new router entry for `/today/smart`
- Keep existing invalidation behavior for task/project refreshes after edits and status updates

## Test Plan
- Run `npm run build`
- Run PHP syntax checks for touched backend files
- Manual scenarios:
  - `/today` shows only due-today and recurring-today tasks for **2026-07-18**
  - `/today` does not include AI-only recommended tasks
  - `/today/smart` shows Smart View tasks from `TodayView`
  - generating Smart View updates `/today/smart` without changing `/today`
  - sidebar navigation highlights `Today` and `Smart View` independently
  - edit, delete, completion, search, and batch update still work on both pages
  - Smart View empty state appears correctly before generation

## Assumptions
- Plan files for future work should live in `plans/`
- The correct filename for this work is `plans/today-smart-view-separation.md`
- `Today` should be strictly scheduled-only
- `Smart View` should be a separate sidebar destination, not just a modal or button inside Today
- Mobile bottom navigation remains unchanged in this iteration unless there is already an intended slot for Smart View
