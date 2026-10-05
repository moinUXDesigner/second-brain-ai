<?php

namespace App\Services;

use App\Models\Task;

class TaskFormatter
{
    public function format(Task $task): array
    {
        $phases = $task->project?->phases ?? [];
        $milestones = $task->project?->milestones ?? [];
        $phaseNames = collect($phases)->pluck('title', 'id');
        $milestoneNames = collect($milestones)->pluck('title', 'id');

        return [
            'id'           => (string) $task->id,
            'title'        => $task->title,
            'type'         => $task->type ?? '',
            'area'         => $task->area ?? '',
            'notes'        => $task->notes ?? '',
            'projectId'    => $task->project_id ? (string) $task->project_id : '',
            'projectName'  => $task->project?->title ?? '',
            'phaseId'      => $task->phase_id ?? '',
            'phaseName'    => $phaseNames[$task->phase_id] ?? '',
            'milestoneId'  => $task->milestone_id ?? '',
            'milestoneName'=> $milestoneNames[$task->milestone_id] ?? '',
            'maslow'       => $task->maslow ?? '',
            'impact'       => $task->impact ?? 0,
            'effort'       => $task->effort ?? 0,
            'timeEstimate' => $task->time_estimate ?? '',
            'urgency'      => $task->urgency ?? '',
            'category'     => $task->category ?? '',
            'confidence'   => $task->confidence ?? 0,
            'priority'     => $task->priority ?? 0,
            'fitScore'     => $task->fit_score ?? 0,
            'status'       => $task->status,
            'source'       => $task->source ?? '',
            'recurrence'   => $task->recurrence ?? '',
            'dueDate'      => $task->due_date?->toDateString() ?? '',
            'deadlineDate' => $task->deadline_date?->toDateString() ?? '',
            'reminderAt'   => $task->reminder_at?->toISOString() ?? '',
            'reminderEnabled' => (bool) $task->reminder_enabled,
            'tags'         => $task->tags ?? [],
            'images'       => $task->images ?? [],
            'completedAt'  => $task->completed_at?->toISOString() ?? '',
            'createdAt'    => $task->created_at?->toISOString() ?? '',
            'updatedAt'    => $task->updated_at?->toISOString() ?? '',
            'timeSpent'    => $task->time_spent ?? 0,
            'timerRunning' => $task->timer_running ?? false,
            'timerStartedAt' => $task->timer_started_at?->toISOString() ?? '',
        ];
    }

}
