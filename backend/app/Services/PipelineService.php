<?php

namespace App\Services;

use App\Models\Task;
use App\Models\DailyState;
use App\Models\TodayView;
use Illuminate\Support\Carbon;

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

    public function calculateFitScores(): void
    {
        $state = DailyState::orderByDesc('date')->first();
        if (!$state) return;

        $tasks = Task::whereNotIn('status', ['Done', 'Deleted'])->get();

        foreach ($tasks as $task) {
            $fitScore = $this->classifier->calculateFitScore(
                $task->effort ?? 5,
                $task->time_estimate ?? '',
                $state->energy,
                $state->mood,
                $state->focus
            );
            $task->fit_score = $fitScore;
            $task->save();
        }
    }

    public function generateTodayView(): array
    {
        $state = DailyState::orderByDesc('date')->first();
        $availableMinutes = $state?->available_time ?? 120;
        $energy = $state ? $this->toLevel($state->energy) : 'Medium';

        $tasks = Task::with('project')
            ->whereNotIn('status', ['Done', 'Deleted'])
            ->orderByDesc('priority')
            ->get();

        TodayView::whereDate('date', today())->delete();

        $output = [];
        $totalMins = 0;
        $today = Carbon::today()->toDateString();

        foreach ($tasks as $task) {
            $taskMins = $this->classifier->parseTimeEstimate($task->time_estimate ?? '', $task->effort ?? 5);

            if ($totalMins + $taskMins > $availableMinutes && count($output) > 0) break;

            $projectPriority = $task->project?->priority ?? 0;
            $adjustedPriority = $task->priority + ($projectPriority * 0.2);
            $category = $this->classifier->getCategory((int)$adjustedPriority, $task->fit_score ?? 0, $energy);

            TodayView::create([
                'task_id'   => $task->id,
                'priority'  => (int)$adjustedPriority,
                'fit_score' => $task->fit_score ?? 0,
                'category'  => $category,
                'status'    => 'Pending',
                'date'      => $today,
            ]);

            $output[] = array_merge($task->toArray(), [
                'priority'  => (int)$adjustedPriority,
                'fit_score' => $task->fit_score ?? 0,
                'category'  => $category,
            ]);

            $totalMins += $taskMins;
        }

        return $output;
    }

    public function runFullPipeline(): array
    {
        $this->classifyAllTasks();
        $this->calculateFitScores();
        return $this->generateTodayView();
    }

    private function toLevel(int $val): string
    {
        if ($val <= 3) return 'Low';
        if ($val <= 6) return 'Medium';
        return 'High';
    }
}
