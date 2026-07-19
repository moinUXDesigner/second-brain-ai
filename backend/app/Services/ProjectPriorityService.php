<?php

namespace App\Services;

use App\Models\Project;
use App\Models\Task;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;

class ProjectPriorityService
{
    private const MASLOW_LEVELS = [
        'Physiological',
        'Safety',
        'Love',
        'Esteem',
        'Self-Actualization',
    ];

    public function sync(Project $project): Project
    {
        $project->loadMissing('tasks');

        $openTasks = $project->tasks->filter(
            fn(Task $task) => !in_array($task->status, ['Done', 'Deleted', 'Note'], true)
        );

        $maslowLevel = $this->dominantMaslowLevel($openTasks);
        $autoPriority = $this->calculateAutoPriority($openTasks, $maslowLevel);
        $priorityMode = $project->priority_mode === 'manual' ? 'manual' : 'auto';
        $manualPriority = $this->normalizeManualPriority($project->manual_priority);
        $effectivePriority = $priorityMode === 'manual'
            ? ($manualPriority ?? $autoPriority)
            : $autoPriority;

        if ($priorityMode === 'auto') {
            $manualPriority = null;
        }

        $project->forceFill([
            'priority_mode' => $priorityMode,
            'manual_priority' => $manualPriority,
            'auto_priority' => $autoPriority,
            'maslow_level' => $maslowLevel,
            'priority' => $effectivePriority,
        ]);

        if ($project->isDirty(['priority_mode', 'manual_priority', 'auto_priority', 'maslow_level', 'priority'])) {
            $project->save();
        }

        return $project->refresh()->load('tasks');
    }

    public function syncById(null|int|string $projectId): void
    {
        if (!$projectId) {
            return;
        }

        $project = Project::with('tasks')->find($projectId);
        if ($project) {
            $this->sync($project);
        }
    }

    private function dominantMaslowLevel(Collection $tasks): string
    {
        if ($tasks->isEmpty()) {
            return 'Self-Actualization';
        }

        $scores = [];

        foreach ($tasks as $task) {
            $level = $this->normalizeMaslowLevel($task->maslow);
            $scores[$level] = ($scores[$level] ?? 0) + max(1, (int) ($task->priority ?? 0));
        }

        uasort($scores, fn(int $a, int $b) => $b <=> $a);

        return array_key_first($scores) ?: 'Self-Actualization';
    }

    private function calculateAutoPriority(Collection $tasks, string $maslowLevel): int
    {
        if ($tasks->isEmpty()) {
            return 1;
        }

        $taskPriority = (float) $tasks->avg(fn(Task $task) => max(1, (int) ($task->priority ?? 1)));
        $highestTaskPriority = (int) $tasks->max(fn(Task $task) => (int) ($task->priority ?? 0));
        $urgencyBoost = $tasks->max(fn(Task $task) => $this->dueDateBoost($task)) ?? 0;
        $maslowWeight = $this->maslowWeight($maslowLevel);

        $score = ($taskPriority * 0.35) + ($highestTaskPriority * 0.25) + ($maslowWeight * 0.25) + ($urgencyBoost * 0.15);

        return max(1, min(10, (int) round($score)));
    }

    private function normalizeMaslowLevel(?string $level): string
    {
        foreach (self::MASLOW_LEVELS as $knownLevel) {
            if (strtolower($knownLevel) === strtolower((string) $level)) {
                return $knownLevel;
            }
        }

        return 'Self-Actualization';
    }

    private function maslowWeight(string $level): int
    {
        return match ($level) {
            'Physiological' => 10,
            'Safety' => 8,
            'Love' => 6,
            'Esteem' => 4,
            default => 2,
        };
    }

    private function dueDateBoost(Task $task): int
    {
        $dateValue = $task->deadline_date ?? $task->due_date;
        if (!$dateValue) {
            return 1;
        }

        $dueDate = $dateValue instanceof Carbon ? $dateValue->copy() : Carbon::parse($dateValue);
        $days = now()->startOfDay()->diffInDays($dueDate->startOfDay(), false);

        if ($days < 0) {
            return 10;
        }
        if ($days <= 3) {
            return 9;
        }
        if ($days <= 7) {
            return 7;
        }
        if ($days <= 30) {
            return 4;
        }

        return 1;
    }

    private function normalizeManualPriority(null|int|string $priority): ?int
    {
        if ($priority === null || $priority === '') {
            return null;
        }

        return max(1, min(10, (int) $priority));
    }
}
