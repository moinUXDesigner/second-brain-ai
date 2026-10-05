<?php

namespace App\Services;

use App\Models\Task;
use App\Models\DailyState;
use App\Models\TodayView;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class PipelineService
{
    public function __construct(
        private ClassificationService $classifier,
        private AIService $ai
    ) {}

    public function classifyAllTasks(): void
    {
        $tasks = Task::whereNotIn('status', ['Done', 'Deleted'])->get();

        foreach ($tasks as $task) {
            $rule = $this->classifier->classify($task->title, $task->type ?? '');

            $task->maslow        = $rule['maslow'];
            $task->impact        = $rule['impact'];
            $task->effort        = $rule['effort'];
            $task->confidence    = $rule['confidence'];
            $task->time_estimate = $this->classifier->deriveTime($task->title);
            $task->urgency       = $this->classifier->deriveUrgency($task->title);
            $task->source        = 'RULE';

            $priority = $this->classifier->calculatePriority(
                $rule['maslow'], $rule['impact'], $rule['effort'],
                $task->urgency
            );
            $task->priority = $priority;
            $task->save();
        }
    }

    public function calculateFitScores(?string $date = null): void
    {
        $state = DailyState::whereDate('date', $date ?: Carbon::today()->toDateString())->first();
        foreach (Task::whereNotIn('status', ['Done', 'Deleted', 'Note', 'Idea'])->get() as $task) {
            $task->fit_score = $this->classifier->calculateFitScore(
                $task->effort ?? 5, $task->time_estimate ?? '',
                $state?->energy ?? 5, $state?->mood ?? 5, $state?->focus ?? 5
            );
            $task->save();
        }
    }

    public function generateTodayView(?string $date = null): array
    {
        return $this->generateSmartView($date)['data'];
    }

    public function generateSmartView(?string $date = null): array
    {
        $today = $date ?: Carbon::today()->toDateString();
        $state = DailyState::whereDate('date', $today)->first();
        $context = [
            'date' => $today, 'energy' => $state?->energy ?? 5,
            'mood' => $state?->mood ?? 5, 'focus' => $state?->focus ?? 5,
            'availableTime' => $state?->available_time ?? 120,
            'activityPreference' => $state?->activity_preference ?? 'Any',
            'notes' => $state?->notes ?? '',
        ];
        $tasks = Task::with('project')->whereNotIn('status', ['Done', 'Deleted', 'Note', 'Idea'])
            ->get()->filter(fn (Task $task) => $this->isTaskEligibleForToday($task, $today))->values();
        foreach ($tasks as $task) {
            $task->fit_score = $this->classifier->calculateFitScore(
                $task->effort ?? 5, $task->time_estimate ?? '',
                $context['energy'], $context['mood'], $context['focus']
            );
        }
        $tasks = $tasks->sort(function (Task $a, Task $b) use ($context) {
            $score = fn (Task $task) => ($task->priority ?? 0) + ($task->project?->priority ?? 0) * 0.2
                + $task->fit_score + ($context['activityPreference'] === 'Any' ? 0 : $this->activityMatchScore($task, $context['activityPreference']) * 3);
            return ($score($b) <=> $score($a)) ?: ($a->id <=> $b->id);
        })->values();
        $isScheduled = fn (Task $task) => $task->recurrence
            ? $this->recurringTaskOccursOnDate($task, $today)
            : $task->due_date?->toDateString() === $today;
        $duration = fn (Task $task) => $this->classifier->parseTimeEstimate($task->time_estimate ?? '', $task->effort ?? 5);
        $rank = $this->ai->rankSmartViewTasks($context, $tasks->map(fn (Task $task) => [
            'id' => (string) $task->id, 'title' => $task->title, 'notes' => $task->notes,
            'area' => $task->area, 'priority' => $task->priority, 'fitScore' => $task->fit_score,
            'durationMinutes' => $duration($task), 'dueDate' => $task->due_date?->toDateString(),
            'scheduled' => $isScheduled($task),
            'project' => $task->project?->only(['title', 'domain', 'priority']),
        ])->all());
        if ($rank !== null) {
            $positions = array_flip($rank);
            $tasks = $tasks->sortBy(fn (Task $task) => $positions[(string) $task->id])->values();
        }
        $selected = $tasks->filter($isScheduled)->values();
        $scheduledMinutes = $selected->sum($duration);
        $totalMinutes = $scheduledMinutes;
        foreach ($tasks->reject($isScheduled) as $task) {
            $minutes = $duration($task);
            if ($context['availableTime'] <= 0 || $totalMinutes + $minutes > $context['availableTime']) continue;
            $selected->push($task);
            $totalMinutes += $minutes;
        }
        $rows = $selected->map(function (Task $task, int $position) use ($today, $context) {
            $priority = (int) (($task->priority ?? 0) + ($task->project?->priority ?? 0) * 0.2);
            return [
                'task_id' => $task->id, 'priority' => $priority, 'fit_score' => $task->fit_score,
                'category' => $this->classifier->getCategory($priority, $task->fit_score, $this->toLevel($context['energy'])),
                'status' => 'Pending', 'date' => $today, 'position' => $position,
            ];
        });
        $output = DB::transaction(function () use ($today, $rows, $tasks, $selected) {
            foreach ($tasks as $task) {
                $task->save();
            }
            $output = $selected->map(function (Task $task, int $index) use ($rows) {
                return array_merge(app(TaskFormatter::class)->format($task), [
                    'priority' => $rows[$index]['priority'],
                    'fitScore' => $rows[$index]['fit_score'],
                    'category' => $rows[$index]['category'],
                    'status' => $rows[$index]['status'],
                ]);
            })->all();
            TodayView::whereDate('date', $today)->delete();
            foreach ($rows as $row) {
                TodayView::create($row);
            }
            return $output;
        });
        return ['data' => $output, 'meta' => [
            'mode' => $rank === null ? 'rules' : 'ai',
            'availableMinutes' => $context['availableTime'], 'selectedMinutes' => $totalMinutes,
            'scheduledOverflowMinutes' => max(0, $scheduledMinutes - $context['availableTime']),
        ]];
    }

    public function runFullPipeline(): array
    {
        $this->classifyAllTasks();
        return $this->generateTodayView();
    }

    private function toLevel(int $val): string
    {
        if ($val <= 3) return 'Low';
        if ($val <= 6) return 'Medium';
        return 'High';
    }

    private function activityMatchScore(Task $task, string $preference): int
    {
        $text = strtolower(implode(' ', array_filter([
            $task->title,
            $task->area,
            $task->category,
            $task->notes,
            $task->project?->title,
            $task->project?->domain,
        ])));

        $outdoorTerms = [
            'outdoor', 'outside', 'walk', 'run', 'running', 'cycle', 'cycling',
            'errand', 'market', 'shop', 'shopping', 'travel', 'commute', 'site visit',
            'field', 'garden', 'park', 'doctor', 'hospital', 'appointment',
        ];
        $indoorTerms = [
            'indoor', 'inside', 'home', 'office', 'desk', 'computer', 'laptop',
            'email', 'call', 'meeting', 'read', 'write', 'study', 'code', 'admin',
            'planning', 'review', 'document',
        ];

        $isOutdoor = $this->containsAny($text, $outdoorTerms);
        $isIndoor = $this->containsAny($text, $indoorTerms);

        if ($preference === 'Outdoor') {
            if ($isOutdoor) return 2;
            if ($isIndoor) return 0;
            return 1;
        }

        if ($isIndoor) return 2;
        if ($isOutdoor) return 0;
        return 1;
    }

    private function containsAny(string $text, array $terms): bool
    {
        foreach ($terms as $term) {
            if (str_contains($text, $term)) {
                return true;
            }
        }

        return false;
    }

    private function isTaskEligibleForToday(Task $task, string $today): bool
    {
        if (!$task->recurrence) {
            return true;
        }

        return $this->recurringTaskOccursOnDate($task, $today);
    }

    private function recurringTaskOccursOnDate(Task $task, string $date): bool
    {
        if (!$task->due_date) {
            return false;
        }

        $anchor = $task->due_date->copy()->startOfDay();
        $target = Carbon::parse($date)->startOfDay();

        if ($target->lt($anchor)) {
            return false;
        }

        return match ($task->recurrence) {
            'Daily' => true,
            'Weekly' => (int) $anchor->diffInDays($target) % 7 === 0,
            'Monthly' => $anchor->day === $target->day,
            'Yearly' => $anchor->month === $target->month && $anchor->day === $target->day,
            default => false,
        };
    }
}
