<?php

namespace Tests\Feature;

use App\Models\Task;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TaskCompletionTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->actingAs(User::create(['name' => 'Test', 'email' => 'completion@example.com', 'password' => 'password']));
    }

    public function test_completion_details_survive_reload_and_preserve_creation_date(): void
    {
        $task = Task::create(['title' => 'Buy cot', 'status' => 'Pending', 'notes' => 'Original notes']);
        $createdAt = $task->created_at->toISOString();

        $this->patchJson("/api/tasks/{$task->id}/status", [
            'status' => 'Done',
            'started_at' => '2026-10-11T09:00:00Z',
            'completed_at' => '2026-10-11T10:30:00Z',
            'start_notes' => 'Measure the room',
            'completion_notes' => 'Bought the cot',
            'notes' => 'Keep the receipt',
        ])->assertOk()->assertJsonPath('data.status', 'Done');

        $this->getJson("/api/tasks/{$task->id}")
            ->assertOk()
            ->assertJsonPath('data.title', 'Buy cot')
            ->assertJsonPath('data.createdAt', $createdAt)
            ->assertJsonPath('data.startedAt', '2026-10-11T09:00:00.000000Z')
            ->assertJsonPath('data.completedAt', '2026-10-11T10:30:00.000000Z')
            ->assertJsonPath('data.startNotes', 'Measure the room')
            ->assertJsonPath('data.completionNotes', 'Bought the cot')
            ->assertJsonPath('data.notes', 'Keep the receipt');
    }

    public function test_completion_without_optional_start_and_notes_is_allowed(): void
    {
        $task = Task::create(['title' => 'Buy cot', 'status' => 'Pending', 'notes' => 'Keep these notes']);
        $this->patchJson("/api/tasks/{$task->id}/status", [
            'status' => 'Done', 'started_at' => null, 'completed_at' => '2026-10-11T10:30:00Z',
        ])->assertOk()->assertJsonPath('data.notes', 'Keep these notes');
    }

    public function test_completion_before_start_is_rejected_without_changing_the_task(): void
    {
        $task = Task::create(['title' => 'Buy cot', 'status' => 'Pending']);
        $this->patchJson("/api/tasks/{$task->id}/status", [
            'status' => 'Done',
            'started_at' => '2026-10-11T11:00:00Z',
            'completed_at' => '2026-10-11T10:00:00Z',
        ])->assertUnprocessable()->assertJsonValidationErrors('completed_at');
        $this->assertSame('Pending', $task->fresh()->status);
        $this->assertNull($task->fresh()->completed_at);
    }
}
