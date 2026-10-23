<?php

namespace Tests\Feature;

use App\Models\Project;
use App\Models\Task;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TaskProjectMoveTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->actingAs(User::create(['name' => 'Test', 'email' => 'move@example.com', 'password' => 'password']));
    }

    public function test_both_endpoints_move_tasks_and_clear_structure(): void
    {
        foreach (['link', 'update'] as $endpoint) {
            $source = Project::create(['title' => 'Source']);
            $destination = Project::create(['title' => 'Destination']);
            $task = Task::create([
                'title' => 'Move me', 'project_id' => $source->id,
                'phase_id' => 'old-phase', 'milestone_id' => 'old-milestone',
                'status' => 'Pending', 'notes' => 'Keep notes', 'priority' => 10,
                'maslow' => 'Safety', 'images' => ['attachment.png'],
                'due_date' => '2026-12-01', 'start_notes' => 'Keep history',
            ]);
            $before = $task->fresh()->getAttributes();
            $payload = ['project_id' => $destination->id];
            if ($endpoint === 'link') {
                $this->patchJson("/api/tasks/{$task->id}/link", $payload)->assertOk();
            } else {
                $payload['phase_id'] = 'stale-phase';
                $payload['milestone_id'] = 'stale-milestone';
                $this->putJson("/api/tasks/{$task->id}", $payload)->assertOk();
            }
            $task->refresh();
            $this->assertEquals($destination->id, $task->project_id);
            $this->assertNull($task->phase_id);
            $this->assertNull($task->milestone_id);
            foreach ($before as $key => $value) {
                if (!in_array($key, ['project_id', 'phase_id', 'milestone_id', 'updated_at'], true)) {
                    $this->assertEquals($value, $task->getAttributes()[$key], $key);
                }
            }
            $this->assertEquals(1, $source->fresh()->auto_priority);
            $this->assertGreaterThan(1, $destination->fresh()->auto_priority);
        }
    }

    public function test_same_project_preserves_assignments_and_unlink_clears_them(): void
    {
        $project = Project::create(['title' => 'Source']);
        $task = Task::create(['title' => 'Completed task', 'status' => 'Done', 'project_id' => $project->id,
            'phase_id' => 'phase', 'milestone_id' => 'milestone']);
        $this->patchJson("/api/tasks/{$task->id}/link", ['project_id' => (string) $project->id])->assertOk();
        $this->assertSame('phase', $task->fresh()->phase_id);
        $this->putJson("/api/tasks/{$task->id}", ['project_id' => $project->id])->assertOk();
        $this->assertSame('milestone', $task->fresh()->milestone_id);
        $this->patchJson("/api/tasks/{$task->id}/link", ['project_id' => null])
            ->assertOk()->assertJsonPath('data.linked', false);
        $task->refresh();
        $this->assertNull($task->project_id);
        $this->assertNull($task->phase_id);
        $this->assertNull($task->milestone_id);
        $this->assertSame('Done', $task->status);
    }

    public function test_invalid_destination_does_not_change_task(): void
    {
        $task = Task::create(['title' => 'Keep me', 'phase_id' => 'phase']);
        $this->patchJson("/api/tasks/{$task->id}/link", ['project_id' => 999999999])->assertUnprocessable();
        $this->putJson("/api/tasks/{$task->id}", ['project_id' => 999999999])->assertUnprocessable();
        $this->patchJson("/api/tasks/{$task->id}/link", [])->assertUnprocessable();
        $this->assertSame('phase', $task->fresh()->phase_id);
    }
}
