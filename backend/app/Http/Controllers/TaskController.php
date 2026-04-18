<?php

namespace App\Http\Controllers;

use App\Models\Task;
use App\Models\Project;
use App\Services\ClassificationService;
use App\Services\AIService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class TaskController extends Controller
{
    public function __construct(
        private ClassificationService $classifier,
        private AIService $ai
    ) {}

    public function index(): JsonResponse
    {
        $tasks = Task::with('project')
            ->whereNotIn('status', ['Deleted'])
            ->orderByDesc('created_at')
            ->get()
            ->map(fn($t) => $this->format($t));

        return response()->json(['success' => true, 'data' => $tasks, 'total' => $tasks->count()]);
    }

    public function today(): JsonResponse
    {
        $tasks = \App\Models\TodayView::with('task.project')
            ->whereDate('date', today())
            ->get()
            ->map(function ($tv) {
                $t = $tv->task;
                if (!$t) return null;
                $data = $this->format($t);
                $data['priority']  = $tv->priority;
                $data['fit_score'] = $tv->fit_score;
                $data['category']  = $tv->category;
                $data['status']    = $tv->status;
                return $data;
            })
            ->filter()
            ->values();

        return response()->json(['success' => true, 'data' => $tasks]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'title'         => 'required|string',
            'type'          => 'nullable|string',
            'area'          => 'nullable|string',
            'notes'         => 'nullable|string',
            'project_id'    => 'nullable|exists:projects,id',
            'recurrence'    => 'nullable|in:Daily,Weekly,Monthly,Yearly',
            'due_date'      => 'nullable|date',
            'deadline_date' => 'nullable|date',
            'time_estimate' => 'nullable|string',
            'status'        => 'nullable|in:Pending,Done,Deleted,Idea,Note',
            'tags'          => 'nullable|array',
        ]);

        $rule = $this->classifier->classify($data['title'], $data['type'] ?? '');
        $urgency = $this->classifier->deriveUrgency($data['title']);

        $task = Task::create(array_merge($data, [
            'maslow'        => $rule['maslow'],
            'impact'        => $rule['impact'],
            'effort'        => $rule['effort'],
            'confidence'    => $rule['confidence'],
            'time_estimate' => $data['time_estimate'] ?? $this->classifier->deriveTime($data['title']),
            'urgency'       => $urgency,
            'priority'      => $this->classifier->calculatePriority($rule['maslow'], $rule['impact'], $rule['effort'], $urgency),
            'source'        => 'RULE',
            'status'        => $data['status'] ?? 'Pending',
        ]));

        return response()->json(['success' => true, 'data' => $this->format($task->load('project'))], 201);
    }

    public function update(Request $request, Task $task): JsonResponse
    {
        $data = $request->validate([
            'title'         => 'sometimes|string',
            'type'          => 'nullable|string',
            'area'          => 'nullable|string',
            'notes'         => 'nullable|string',
            'project_id'    => 'nullable|exists:projects,id',
            'recurrence'    => 'nullable|in:Daily,Weekly,Monthly,Yearly',
            'due_date'      => 'nullable|date',
            'deadline_date' => 'nullable|date',
            'time_estimate' => 'nullable|string',
            'status'        => 'nullable|in:Pending,Done,Deleted,Idea,Note',
            'category'      => 'nullable|string',
            'tags'          => 'nullable|array',
        ]);

        $task->update($data);
        return response()->json(['success' => true, 'data' => $this->format($task->load('project'))]);
    }

    public function updateStatus(Request $request, Task $task): JsonResponse
    {
        $data = $request->validate(['status' => 'required|in:Pending,Done,Deleted,Idea,Note']);
        $task->status       = $data['status'];
        $task->completed_at = $data['status'] === 'Done' ? now() : null;
        $task->save();

        \App\Models\TodayView::where('task_id', $task->id)
            ->whereDate('date', today())
            ->update(['status' => $data['status'] === 'Done' ? 'Done' : 'Pending']);

        return response()->json(['success' => true, 'data' => ['id' => $task->id, 'status' => $task->status]]);
    }

    public function resetRecurring(Task $task): JsonResponse
    {
        if (!$task->recurrence) {
            return response()->json(['success' => false, 'message' => 'Not a recurring task'], 400);
        }

        $nextDue = match ($task->recurrence) {
            'Daily'   => now()->addDay()->toDateString(),
            'Weekly'  => now()->addWeek()->toDateString(),
            'Monthly' => now()->addMonth()->toDateString(),
            'Yearly'  => now()->addYear()->toDateString(),
        };

        $task->update([
            'status'       => 'Pending',
            'completed_at' => null,
            'due_date'     => $nextDue,
        ]);

        return response()->json(['success' => true, 'data' => $this->format($task)]);
    }

    public function linkToProject(Request $request, Task $task): JsonResponse
    {
        $data = $request->validate(['project_id' => 'nullable|exists:projects,id']);
        $task->update(['project_id' => $data['project_id']]);
        return response()->json(['success' => true, 'data' => ['taskId' => $task->id, 'projectId' => $task->project_id, 'linked' => true]]);
    }

    public function startTimer(Task $task): JsonResponse
    {
        if ($task->timer_running) {
            return response()->json(['success' => false, 'message' => 'Timer already running'], 400);
        }

        $task->update([
            'timer_running' => true,
            'timer_started_at' => now(),
        ]);

        return response()->json(['success' => true, 'data' => $this->format($task)]);
    }

    public function pauseTimer(Task $task): JsonResponse
    {
        if (!$task->timer_running) {
            return response()->json(['success' => false, 'message' => 'Timer not running'], 400);
        }

        $elapsed = now()->diffInSeconds($task->timer_started_at);
        $task->update([
            'timer_running' => false,
            'time_spent' => $task->time_spent + $elapsed,
            'timer_started_at' => null,
        ]);

        return response()->json(['success' => true, 'data' => $this->format($task)]);
    }

    public function stopTimer(Task $task): JsonResponse
    {
        if ($task->timer_running) {
            $elapsed = now()->diffInSeconds($task->timer_started_at);
            $task->time_spent += $elapsed;
        }

        $task->update([
            'timer_running' => false,
            'timer_started_at' => null,
        ]);

        return response()->json(['success' => true, 'data' => $this->format($task)]);
    }

    public function destroy(Task $task): JsonResponse
    {
        $task->update(['status' => 'Deleted', 'completed_at' => now()]);
        return response()->json(['success' => true, 'data' => ['deleted' => true, 'taskId' => $task->id]]);
    }

    public function cleanup(): JsonResponse
    {
        Task::where('title', '')->orWhereNull('title')->delete();
        app(\App\Services\PipelineService::class)->classifyAllTasks();
        return response()->json(['success' => true, 'data' => ['message' => 'Cleanup complete']]);
    }

    public function assignDueDates(): JsonResponse
    {
        $tasks = Task::whereNotIn('status', ['Done', 'Deleted'])
            ->whereNull('due_date')
            ->get(['id', 'title', 'urgency', 'area']);

        if ($tasks->isEmpty()) {
            return response()->json(['success' => true, 'data' => ['updated' => 0, 'message' => 'All tasks already have due dates.']]);
        }

        $payload = $tasks->map(fn($t) => [
            'id'      => $t->id,
            'title'   => $t->title,
            'urgency' => $t->urgency ?? 'Medium',
            'area'    => $t->area ?? '',
        ])->values()->toArray();

        // Process in chunks of 50 to stay within token limits
        $chunks  = array_chunk($payload, 50);
        $updated = 0;

        foreach ($chunks as $chunk) {
            $results = $this->ai->assignDueDates($chunk);
            foreach ($results as $result) {
                if (!empty($result['id']) && !empty($result['due_date'])) {
                    Task::where('id', $result['id'])->update(['due_date' => $result['due_date']]);
                    $updated++;
                }
            }
        }

        return response()->json(['success' => true, 'data' => ['updated' => $updated, 'total' => $tasks->count()]]);
    }

    private function format(Task $task): array
    {
        return [
            'id'           => (string) $task->id,
            'title'        => $task->title,
            'type'         => $task->type ?? '',
            'area'         => $task->area ?? '',
            'notes'        => $task->notes ?? '',
            'projectId'    => $task->project_id ? (string) $task->project_id : '',
            'projectName'  => $task->project?->title ?? '',
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
            'tags'         => $task->tags ?? [],
            'completedAt'  => $task->completed_at?->toISOString() ?? '',
            'createdAt'    => $task->created_at?->toISOString() ?? '',
            'updatedAt'    => $task->updated_at?->toISOString() ?? '',
            'timeSpent'    => $task->time_spent ?? 0,
            'timerRunning' => $task->timer_running ?? false,
            'timerStartedAt' => $task->timer_started_at?->toISOString() ?? '',
        ];
    }
}
