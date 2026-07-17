# Notifications and Reminders Plan

## Summary
Implement v1 in-app notifications and task reminders. Users will see a notification bell in the header, review unread/read notifications in a dropdown or panel, and receive reminder notifications for tasks based on explicit reminder times plus due/deadline rules. No browser push or email in v1.

## Key Changes
- Add backend notification storage using Laravel database notifications and an idempotency log so reminder scans do not create duplicate notifications.
- Add task reminder support with `reminder_at` and `reminder_enabled` fields on tasks.
- Add protected notification endpoints for listing notifications, marking one/all read, and manually checking reminders.
- Extend task create/update/formatting to accept and return `reminderAt` and `reminderEnabled`.

## Reminder Behavior
- Generate in-app notifications for pending tasks only.
- Create notifications for explicit reminder time reached, due date today, deadline today, overdue due date, and overdue deadline.
- Do not notify for `Done`, `Deleted`, `Note`, or `Idea` tasks.
- Use one notification per user/task/reminder kind/date to avoid repeated reminders.
- Add `php artisan reminders:check` to scan all users, plus a manual API endpoint for local use.

## Frontend Changes
- Add notification types, service methods, and React Query hooks.
- Add a header bell with unread badge and a compact notification panel.
- Add reminder controls to `EditTaskModal`: enable reminder and choose reminder date/time.

## Test Plan
- Run `npm run build`.
- Run PHP syntax checks for new/updated backend files.
- Check migration status where available.
- Manually confirm reminder creation, no duplicate reminder spam, mark read, mark all read, and completed/deleted exclusions.

## Assumptions
- V1 is in-app only.
- Browser push notifications and email reminders are out of scope.
- Reminder timestamps use server time and are displayed in the user's local browser formatting.
- Existing task columns remain authoritative for due date and deadline date.
