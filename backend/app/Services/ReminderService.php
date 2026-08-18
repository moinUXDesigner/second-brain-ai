<?php

namespace App\Services;

use App\Models\Task;
use App\Models\User;
use App\Notifications\TaskReminderNotification;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class ReminderService
{
    public function checkForUser(User $user, ?Carbon $now = null): int
    {
        $now ??= now();
        $tasks = Task::query()
            ->where('status', 'Pending')
            ->get();

        $created = 0;
        foreach ($tasks as $task) {
            foreach ($this->eventsForTask($task, $now) as $event) {
                if ($this->notifyOnce($user, $task, $event['kind'], $event['key'], $event['title'], $event['message'], $now)) {
                    $created++;
                }
            }
        }

        return $created;
    }

    public function checkAllUsers(?Carbon $now = null): int
    {
        $now ??= now();
        $created = 0;

        User::query()->chunkById(100, function ($users) use (&$created, $now) {
            foreach ($users as $user) {
                $created += $this->checkForUser($user, $now);
            }
        });

        return $created;
    }

    public function notifyScheduledToday(User $user, Task $task, ?Carbon $now = null): bool
    {
        $now ??= now();
        $today = $now->toDateString();

        return $this->notifyOnce(
            $user,
            $task,
            'scheduled_today',
            $today,
            'Task Scheduled today',
            "\"{$task->title}\" is scheduled for today.",
            $now
        );
    }

    private function eventsForTask(Task $task, Carbon $now): array
    {
        $events = [];
        $today = $now->toDateString();

        if ($task->reminder_enabled && $task->reminder_at && $task->reminder_at->lte($now)) {
            $events[] = [
                'kind' => 'explicit_reminder',
                'key' => $task->reminder_at->format('Y-m-d-H-i'),
                'title' => 'Task reminder',
                'message' => "\"{$task->title}\" is ready for your attention.",
            ];
        }

        if ($task->due_date) {
            $dueDate = $task->due_date->toDateString();
            if ($dueDate === $today) {
                $events[] = [
                    'kind' => 'due_today',
                    'key' => $today,
                    'title' => 'Task due today',
                    'message' => "\"{$task->title}\" is scheduled for today.",
                ];
            } elseif ($dueDate < $today) {
                $events[] = [
                    'kind' => 'due_overdue',
                    'key' => $today,
                    'title' => 'Task overdue',
                    'message' => "\"{$task->title}\" is past its due date.",
                ];
            }
        }

        if ($task->deadline_date) {
            $deadlineDate = $task->deadline_date->toDateString();
            if ($deadlineDate === $today) {
                $events[] = [
                    'kind' => 'deadline_today',
                    'key' => $today,
                    'title' => 'Deadline today',
                    'message' => "\"{$task->title}\" has a deadline today.",
                ];
            } elseif ($deadlineDate < $today) {
                $events[] = [
                    'kind' => 'deadline_overdue',
                    'key' => $today,
                    'title' => 'Deadline overdue',
                    'message' => "\"{$task->title}\" is past its deadline.",
                ];
            }
        }

        return $events;
    }

    private function notifyOnce(User $user, Task $task, string $kind, string $key, string $title, string $message, Carbon $now): bool
    {
        return DB::transaction(function () use ($user, $task, $kind, $key, $title, $message, $now) {
            $inserted = DB::table('task_reminder_logs')->insertOrIgnore([
                'user_id' => $user->id,
                'task_id' => $task->id,
                'kind' => $kind,
                'reminder_key' => $key,
                'notified_at' => $now,
                'created_at' => $now,
                'updated_at' => $now,
            ]);

            if ($inserted === 0) {
                return false;
            }

            $user->notify(new TaskReminderNotification($task, $kind, $title, $message));
            return true;
        });
    }
}
