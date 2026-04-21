<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\Task;
use App\Services\ClassificationService;
use App\Services\AIService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class ProjectController extends Controller
{
    public function __construct(
        private ClassificationService $classifier,
        private AIService $ai
    ) {}

    public function show(Project $project): JsonResponse
  {
      if ($project->status === 'Deleted') {
          return response()->json(['success' => false, 'message' => 'Project not found'], 404);
      }
      return response()->json(['success' => true, 'data' => $this->format($project->load('tasks'))]);
  }

  public function index(): JsonResponse
    {
        $projects = Project::with('tasks')
            ->whereNotIn('status', ['Deleted'])
            ->orderByDesc('created_at')
            ->get()
            ->map(fn($p) => $this->format($p));

        return response()->json(['success' => true, 'data' => $projects]);
    }

    public function deleted(): JsonResponse
    {
        $projects = Project::with('tasks')
            ->where('status', 'Deleted')
            ->orderByDesc('updated_at')
            ->get()
            ->map(fn($p) => $this->format($p));

        return response()->json(['success' => true, 'data' => $projects]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'title'       => 'required|string',
            'description' => 'nullable|string',
            'area'        => 'nullable|string',
            'priority'    => 'nullable|integer',
            'subtasks'    => 'nullable|array',
        ]);

        // Generate concise project title using AI or rule-based fallback
        $userInput = $data['title'];
        $projectTitle = $this->ai->generateProjectTitle($userInput, $data['area'] ?? '');
        
        // Fallback to rule-based if AI fails
        if (!$projectTitle) {
            $projectTitle = $this->classifier->generateProjectTitle($userInput);
        }

        $project = Project::create([
            'title'       => $projectTitle,
            'description' => $userInput, // Store original input as description
            'status'      => 'Active',
            'priority'    => $data['priority'] ?? 0,
            'domain'      => $data['area'] ?? '',
        ]);

        $subtaskTitles = $data['subtasks'] ?? [];

        if (empty($subtaskTitles)) {
            $subtaskTitles = $this->ai->generateSubtasks($userInput, $data['area'] ?? '', $data['description'] ?? '');
            if (empty($subtaskTitles)) {
                $subtaskTitles = $this->classifier->generateSubtasks($userInput);
            }
        }

        foreach ($subtaskTitles as $title) {
            $title = is_string($title) ? $title : ($title['subtask'] ?? $title['title'] ?? json_encode($title));
            if (!$title) continue;
            $rule = $this->classifier->classify($title);
            Task::create([
                'project_id'    => $project->id,
                'title'         => $title,
                'type'          => 'Task',
                'area'          => $data['area'] ?? '',
                'status'        => 'Pending',
                'maslow'        => $rule['maslow'],
                'impact'        => $rule['impact'],
                'effort'        => $rule['effort'],
                'time_estimate' => $this->classifier->deriveTime($title),
                'urgency'       => $this->classifier->deriveUrgency($title),
                'source'        => 'RULE',
            ]);
        }

        return response()->json(['success' => true, 'data' => $this->format($project->load('tasks'))], 201);
    }

    public function update(Request $request, Project $project): JsonResponse
    {
        $data = $request->validate([
            'title'       => 'sometimes|string',
            'description' => 'nullable|string',
            'status'      => 'nullable|in:Active,Completed,Archived,Deleted',
            'priority'    => 'nullable|integer',
            'due_date'    => 'nullable|date',
        ]);

        $project->update($data);
        return response()->json(['success' => true, 'data' => $this->format($project->load('tasks'))]);
    }

    public function destroy(Project $project): JsonResponse
    {
        $project->update(['status' => 'Deleted']);
        return response()->json(['success' => true, 'data' => ['deleted' => true, 'projectId' => $project->id]]);
    }

    public function restore(Project $project): JsonResponse
    {
        $project->update(['status' => 'Active']);
        return response()->json(['success' => true, 'data' => $this->format($project->load('tasks'))]);
    }

    private function format(Project $project): array
    {
        $subtasks = $project->tasks->map(fn($t) => [
            'id'             => (string) $t->id,
            'title'          => $t->title,
            'type'           => $t->type ?? 'Task',
            'area'           => $t->area ?? '',
            'notes'          => $t->notes ?? '',
            'projectId'      => (string) $project->id,
            'status'         => $t->status,
            'priority'       => $t->priority ?? 0,
            'fitScore'       => $t->fit_score ?? 0,
            'category'       => $t->category ?? '',
            'urgency'        => $t->urgency ?? '',
            'dueDate'        => $t->due_date?->toDateString() ?? '',
            'timeSpent'      => $t->time_spent ?? 0,
            'timerRunning'   => $t->timer_running ?? false,
            'timerStartedAt' => $t->timer_started_at?->toISOString() ?? '',
        ])->values()->toArray();

        $total    = count($subtasks);
        $done     = count(array_filter($subtasks, fn($s) => $s['status'] === 'Done'));
        $progress = $total > 0 ? (int) round(($done / $total) * 100) : 0;

        return [
            'id'          => (string) $project->id,
            'title'       => $project->title,
            'description' => $project->description ?? '',
            'status'      => $project->status,
            'priority'    => $project->priority ?? 0,
            'progress'    => $progress,
            'subtasks'    => $subtasks,
            'dueDate'     => $project->due_date?->toDateString() ?? '',
            'domain'      => $project->domain ?? '',
            'createdAt'   => $project->created_at?->toISOString() ?? '',
            'updatedAt'   => $project->updated_at?->toISOString() ?? '',
        ];
    }
}
