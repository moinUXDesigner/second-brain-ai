<?php

namespace App\Notifications;

use App\Models\Task;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class TaskReminderNotification extends Notification
{
    use Queueable;

    public function __construct(
        private Task $task,
        private string $kind,
        private string $title,
        private string $message
    ) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        return [
            'kind' => $this->kind,
            'title' => $this->title,
            'message' => $this->message,
            'taskId' => (string) $this->task->id,
            'taskTitle' => $this->task->title,
            'dueDate' => $this->task->due_date?->toDateString(),
            'deadlineDate' => $this->task->deadline_date?->toDateString(),
            'reminderAt' => $this->task->reminder_at?->toISOString(),
        ];
    }
}
