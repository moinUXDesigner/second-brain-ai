<?php

namespace Tests\Feature;

use App\Models\Project;
use App\Models\Task;
use App\Services\ProjectPriorityService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProjectPriorityServiceTest extends TestCase
{
    use RefreshDatabase;

    public function test_auto_priority_is_calculated_from_open_maslow_tasks(): void
    {
        $project = Project::create(['title' => 'Stabilize finances']);

        Task::create([
            'project_id' => $project->id,
            'title' => 'Pay overdue loan today',
            'type' => 'Task',
            'status' => 'Pending',
            'maslow' => 'Safety',
            'priority' => 10,
            'due_date' => now()->toDateString(),
        ]);

        $synced = app(ProjectPriorityService::class)->sync($project);

        $this->assertSame('auto', $synced->priority_mode);
        $this->assertSame('Safety', $synced->maslow_level);
        $this->assertSame(9, $synced->auto_priority);
        $this->assertSame($synced->auto_priority, $synced->priority);
    }

    public function test_manual_override_preserves_user_score_after_task_changes(): void
    {
        $project = Project::create([
            'title' => 'Manual priority project',
            'priority_mode' => 'manual',
            'manual_priority' => 9,
            'priority' => 9,
        ]);

        $task = Task::create([
            'project_id' => $project->id,
            'title' => 'Low signal task',
            'type' => 'Task',
            'status' => 'Pending',
            'maslow' => 'Esteem',
            'priority' => 2,
        ]);

        app(ProjectPriorityService::class)->sync($project);
        $task->update(['priority' => 1, 'maslow' => 'Self-Actualization']);

        $synced = app(ProjectPriorityService::class)->sync($project->fresh('tasks'));

        $this->assertSame('manual', $synced->priority_mode);
        $this->assertSame(9, $synced->manual_priority);
        $this->assertSame(9, $synced->priority);
    }

    public function test_switching_manual_back_to_auto_recalculates_priority(): void
    {
        $project = Project::create([
            'title' => 'Return to auto',
            'priority_mode' => 'manual',
            'manual_priority' => 10,
            'priority' => 10,
        ]);

        Task::create([
            'project_id' => $project->id,
            'title' => 'Simple task',
            'type' => 'Task',
            'status' => 'Pending',
            'maslow' => 'Esteem',
            'priority' => 2,
        ]);

        $project->update(['priority_mode' => 'auto']);
        $synced = app(ProjectPriorityService::class)->sync($project->fresh('tasks'));

        $this->assertSame('auto', $synced->priority_mode);
        $this->assertNull($synced->manual_priority);
        $this->assertSame($synced->auto_priority, $synced->priority);
        $this->assertNotSame(10, $synced->priority);
    }

    public function test_done_deleted_and_note_tasks_are_excluded_from_auto_priority(): void
    {
        $project = Project::create(['title' => 'Ignore closed tasks']);

        foreach (['Done', 'Deleted', 'Note'] as $status) {
            Task::create([
                'project_id' => $project->id,
                'title' => "{$status} high priority task",
                'type' => 'Task',
                'status' => $status,
                'maslow' => 'Safety',
                'priority' => 10,
            ]);
        }

        Task::create([
            'project_id' => $project->id,
            'title' => 'Only open task',
            'type' => 'Task',
            'status' => 'Pending',
            'maslow' => 'Esteem',
            'priority' => 2,
        ]);

        $synced = app(ProjectPriorityService::class)->sync($project);

        $this->assertSame('Esteem', $synced->maslow_level);
        $this->assertSame(2, $synced->auto_priority);
        $this->assertSame(2, $synced->priority);
    }
}
