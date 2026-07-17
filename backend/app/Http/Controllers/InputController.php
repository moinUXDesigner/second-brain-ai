<?php

namespace App\Http\Controllers;

use App\Models\Task;
use App\Models\Project;
use App\Models\DailyState;
use App\Services\ClassificationService;
use App\Services\AIService;
use App\Services\PipelineService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Carbon;

class InputController extends Controller
{
    public function __construct(
        private ClassificationService $classifier,
        private AIService $ai,
        private PipelineService $pipeline
    ) {}

    public function analyze(Request $request): JsonResponse
    {
        $data = $request->validate([
            'text'      => 'required|string',
            'area'      => 'nullable|string',
            'aiEnabled' => 'nullable|boolean',
        ]);

        $text      = trim($data['text']);
        $area      = $data['area'] ?? '';
        $aiEnabled = $data['aiEnabled'] ?? true;

        $rule     = $this->classifier->classify($text);
        $type     = $this->classifier->looksLikeProject($text) ? 'project' : 'task';
        $category = $this->deriveCategory($rule);
        $priority = $rule['impact'] >= 8 ? 'High' : ($rule['impact'] >= 5 ? 'Medium' : 'Low');
        $estTime  = $this->classifier->deriveTime($text);
        $dueDate  = $this->deriveDueDate($priority, $text);
        $subtasks = [];
        $source   = 'RULE';

        if ($aiEnabled) {
            $aiResult = $this->ai->analyzeInput($text, $area);
            if ($aiResult) {
                $type     = $aiResult['type']          ?? $type;
                $category = $aiResult['category']      ?? $category;
                $priority = $aiResult['priority']      ?? $priority;
                $estTime  = $aiResult['estimatedTime'] ?? $estTime;
                $dueDate  = $this->normalizeDueDate($aiResult['dueDate'] ?? null) ?? $dueDate;
                $subtasks = $aiResult['subtasks']      ?? [];
                $source   = 'AI';
            }
        }

        if ($type === 'project' && empty($subtasks)) {
            $subtasks = $aiEnabled
                ? ($this->ai->generateSubtasks($text, $area) ?: $this->classifier->generateSubtasks($text))
                : $this->classifier->generateSubtasks($text);
        }

        return response()->json(['success' => true, 'data' => [
            'type'          => $type,
            'title'         => $text,
            'area'          => $area,
            'category'      => $category,
            'priority'      => $priority,
            'estimatedTime' => $estTime,
            'dueDate'       => $dueDate,
            'subtasks'      => array_values(array_filter($subtasks)),
            'confidence'    => $source === 'AI' ? 0.9 : $rule['confidence'],
            'source'        => $source,
        ]]);
    }

    public function create(Request $request): JsonResponse
    {
        $data = $request->validate([
            'text'          => 'required|string',
            'type'          => 'required|in:task,project',
            'area'          => 'nullable|string',
            'category'      => 'nullable|string',
            'priority'      => 'nullable|string',
            'estimatedTime' => 'nullable|string',
            'dueDate'       => 'nullable|date',
            'recurrence'    => 'nullable|in:Daily,Weekly,Monthly,Yearly',
            'subtasks'      => 'nullable|array',
        ]);

        if ($data['type'] === 'project') {
            $project = app(ProjectController::class)->store(new Request([
                'title'       => $data['text'],
                'description' => '',
                'area'        => $data['area'] ?? '',
                'due_date'    => $data['dueDate'] ?? null,
                'subtasks'    => $data['subtasks'] ?? [],
            ]));
            return response()->json(['success' => true, 'data' => ['project' => $project->getData(true)['data']]]);
        }

        $task = app(TaskController::class)->store(new Request([
            'title'         => $data['text'],
            'area'          => $data['area'] ?? '',
            'category'      => $data['category'] ?? '',
            'time_estimate' => $data['estimatedTime'] ?? '',
            'due_date'      => $data['dueDate'] ?? null,
            'recurrence'    => $data['recurrence'] ?? null,
            'status'        => 'Pending',
        ]));

        return response()->json(['success' => true, 'data' => ['task' => $task->getData(true)['data']]]);
    }

    public function dashboard(): JsonResponse
    {
        $tasks       = Task::whereNotIn('status', ['Deleted'])->get();
        $todayTasks  = \App\Models\TodayView::with('task')->whereDate('date', today())->get();
        $projects    = Project::whereNotIn('status', ['Deleted'])->get();

        return response()->json(['success' => true, 'data' => [
            'totalTasks'     => $tasks->count(),
            'completedTasks' => $tasks->where('status', 'Done')->count(),
            'pendingTasks'   => $tasks->where('status', 'Pending')->count(),
            'todayDone'      => $todayTasks->where('status', 'Done')->count(),
            'todayTotal'     => $todayTasks->count(),
            'projectCount'   => $projects->count(),
        ]]);
    }

    public function runPipeline(): JsonResponse
    {
        $tasks = $this->pipeline->runFullPipeline();
        return response()->json(['success' => true, 'data' => $tasks, 'message' => 'Pipeline completed']);
    }

    public function generateToday(): JsonResponse
    {
        $date = request()->validate([
            'date' => 'nullable|date',
        ])['date'] ?? now()->toDateString();

        $tasks = $this->pipeline->generateTodayView($date);
        return response()->json(['success' => true, 'data' => $tasks]);
    }

    private function deriveCategory(array $rule): string
    {
        if ($rule['effort'] >= 7) return 'Deep Work';
        if ($rule['effort'] <= 3) return 'Light Work';
        if ($rule['maslow'] === 'Physiological') return 'Recovery';
        return 'Admin';
    }

    private function deriveDueDate(string $priority, string $text): string
    {
        $lower = strtolower($text);
        if (str_contains($lower, 'today')) return now()->toDateString();
        if (str_contains($lower, 'tomorrow')) return now()->addDay()->toDateString();
        if (str_contains($lower, 'this week')) return now()->addWeek()->toDateString();
        if (str_contains($lower, 'next week')) return now()->addWeeks(2)->toDateString();

        return match ($priority) {
            'High' => now()->addDays(3)->toDateString(),
            'Medium' => now()->addWeeks(2)->toDateString(),
            default => now()->addMonth()->toDateString(),
        };
    }

    private function normalizeDueDate(?string $value): ?string
    {
        if (!$value) return null;

        try {
            return Carbon::parse($value)->toDateString();
        } catch (\Throwable) {
            return null;
        }
    }
}
