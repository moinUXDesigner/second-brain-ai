<?php

namespace Tests\Feature;

use App\Models\Task;
use App\Models\User;
use App\Services\ReminderService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Tests\TestCase;

class TodayTasksTest extends TestCase
{
    use RefreshDatabase;

    public function test_input_preserves_the_selected_due_date_and_appears_in_today(): void
    {
        $user = User::create(['name' => 'Test', 'email' => 'input@example.com', 'password' => 'password']);

        $response = $this->actingAs($user)->postJson('/api/input', [
            'text' => 'Go to buy deewan cot today',
            'type' => 'task',
            'due_date' => '2026-10-11',
            'estimated_time' => '45 minutes',
        ])->assertOk()
            ->assertJsonPath('data.task.dueDate', '2026-10-11')
            ->assertJsonPath('data.task.timeEstimate', '45 minutes');

        $this->getJson('/api/tasks/today?date=2026-10-11')
            ->assertOk()
            ->assertJsonPath('data.0.id', $response->json('data.task.id'));
    }

    public function test_scheduling_uses_the_client_date_when_utc_is_still_yesterday(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-10-10 20:00:00', 'UTC'));

        try {
            $user = User::create(['name' => 'Test', 'email' => 'today@example.com', 'password' => 'password']);
            $task = Task::create(['title' => 'Scheduled task', 'status' => 'Pending']);
            $this->mock(ReminderService::class, function ($mock) {
                $mock->shouldReceive('notifyScheduledToday')->once()->andReturn(false);
            });

            $this->actingAs($user)
                ->postJson("/api/tasks/{$task->id}/schedule-today", ['date' => '2026-10-11'])
                ->assertOk();

            $this->assertSame('2026-10-11', $task->fresh()->due_date->toDateString());
            $this->getJson('/api/tasks/today?date=2026-10-11')
                ->assertOk()
                ->assertJsonPath('data.0.id', (string) $task->id);
            $this->getJson('/api/tasks/today?date=2026-10-10')
                ->assertOk()
                ->assertJsonCount(0, 'data');
        } finally {
            Carbon::setTestNow();
        }
    }
}
