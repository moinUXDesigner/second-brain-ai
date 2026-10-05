<?php

namespace Tests\Feature;

use App\Http\Controllers\TaskController;
use App\Models\DailyState;
use App\Models\Task;
use App\Models\TodayView;
use App\Services\AIService;
use App\Services\ClassificationService;
use App\Services\PipelineService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class SmartViewGenerationTest extends TestCase
{
    use RefreshDatabase;

    private const DATE = '2026-10-05';

    protected function setUp(): void
    {
        parent::setUp();
        config(['openai.api_key' => 'test-key']);
        Http::preventStrayRequests();
    }

    private function task(array $attributes = []): Task
    {
        return Task::create(array_merge(['title' => 'Write report', 'priority' => 12, 'effort' => 7, 'time_estimate' => '30 minutes', 'notes' => 'Task context'], $attributes));
    }

    private function state(array $attributes = []): DailyState
    {
        return DailyState::create(array_merge(['date' => self::DATE, 'energy' => 2, 'mood' => 3, 'focus' => 1, 'available_time' => 60, 'activity_preference' => 'Indoor', 'notes' => 'Please prioritize writing'], $attributes));
    }

    private function rank(array $ids): void
    {
        Http::fake(['api.openai.com/*' => Http::response(['choices' => [['message' => ['content' => json_encode(['taskIds' => $ids])]]]])]);
    }

    public function test_current_day_context_notes_fit_and_order_survive_reload(): void
    {
        $state = $this->state();
        $this->state(['date' => '2026-10-06', 'energy' => 10, 'notes' => 'Wrong day']);
        $first = $this->task(['title' => 'First', 'priority' => 20]);
        $second = $this->task(['title' => 'Second', 'priority' => 1]);
        $this->rank([(string) $second->id, (string) $first->id]);
        $result = app(PipelineService::class)->generateSmartView(self::DATE);
        $this->assertSame('ai', $result['meta']['mode']);
        $this->assertSame([(string) $second->id, (string) $first->id], array_column($result['data'], 'id'));
        $expected = app(ClassificationService::class)->calculateFitScore(7, '30 minutes', 2, 3, 1);
        $this->assertEquals($expected, $first->fresh()->fit_score);
        Http::assertSent(function ($request) use ($state) {
            $payload = json_decode($request['messages'][1]['content'], true);
            $this->assertSame(self::DATE, $payload['dailyState']['date']);
            foreach (['energy' => 2, 'mood' => 3, 'focus' => 1, 'availableTime' => 60, 'activityPreference' => 'Indoor', 'notes' => $state->notes] as $key => $value) {
                $this->assertSame($value, $payload['dailyState'][$key]);
            }
            $this->assertSame('Task context', $payload['tasks'][0]['notes']);
            $this->assertSame(30, $payload['tasks'][0]['durationMinutes']);
            $this->assertArrayHasKey('project', $payload['tasks'][0]);
            return true;
        });
        $response = app(TaskController::class)->smartToday(Request::create('/tasks/today/smart', 'GET', ['date' => self::DATE]));
        $this->assertSame(array_column($result['data'], 'id'), array_column($response->getData(true)['data'], 'id'));
        $this->assertSame('First', $first->fresh()->title);
    }

    public function test_scheduled_tasks_overflow_and_zero_time_exclude_optional_tasks(): void
    {
        $this->state(['available_time' => 0]);
        $scheduled = $this->task(['due_date' => self::DATE]);
        $recurring = $this->task(['recurrence' => 'Daily', 'due_date' => '2026-10-01']);
        $optional = $this->task();
        $this->rank([$optional->id, $recurring->id, $scheduled->id]);
        $result = app(PipelineService::class)->generateSmartView(self::DATE);
        $this->assertSame([(string) $recurring->id, (string) $scheduled->id], array_column($result['data'], 'id'));
        $this->assertSame(60, $result['meta']['scheduledOverflowMinutes']);
        $this->assertSame(60, $result['meta']['selectedMinutes']);
    }

    public function test_oversized_tasks_are_skipped_and_smaller_tasks_still_fit(): void
    {
        $this->state(['available_time' => 30]);
        $large = $this->task(['time_estimate' => '2 hours']);
        $small = $this->task(['time_estimate' => '15 minutes']);
        $this->rank([$large->id, $small->id]);
        $result = app(PipelineService::class)->generateSmartView(self::DATE);
        $this->assertSame([(string) $small->id], array_column($result['data'], 'id'));
    }

    public function test_missing_state_uses_defaults_and_excludes_ineligible_tasks(): void
    {
        $this->state(['date' => '2026-10-04', 'available_time' => 0]);
        $valid = $this->task();
        foreach (['Done', 'Deleted', 'Note', 'Idea'] as $status) $this->task(['status' => $status]);
        $this->task(['recurrence' => 'Weekly', 'due_date' => '2026-10-04']);
        $this->task(['recurrence' => 'Daily', 'due_date' => '2026-10-06']);
        $this->rank([$valid->id]);
        $result = app(PipelineService::class)->generateSmartView(self::DATE);
        $this->assertSame(120, $result['meta']['availableMinutes']);
        $this->assertCount(1, $result['data']);
        Http::assertSent(fn ($request) => json_decode($request['messages'][1]['content'], true)['dailyState']['energy'] === 5);
    }

    public static function invalidRankings(): array
    {
        return [
            'malformed' => ['not json'],
            'unknown ID' => ['{"taskIds":[999999]}'],
            'duplicates' => ['{"taskIds":[1,1]}'],
            'wrong shape' => ['{"taskIds":"1"}'],
            'missing IDs' => ['{"taskIds":[]}'],
            'object IDs' => ['{"taskIds":[{}]}'],
        ];
    }

    #[DataProvider('invalidRankings')]
    public function test_invalid_ai_uses_rules(string $content): void
    {
        $this->state();
        $this->task();
        Http::fake(['api.openai.com/*' => Http::response(['choices' => [['message' => ['content' => $content]]]])]);
        $this->assertSame('rules', app(PipelineService::class)->generateSmartView(self::DATE)['meta']['mode']);
    }

    public function test_http_errors_timeouts_and_missing_key_use_rules(): void
    {
        $this->state();
        $this->task();
        Http::fake(['api.openai.com/*' => Http::response([], 503)]);
        $this->assertSame('rules', app(PipelineService::class)->generateSmartView(self::DATE)['meta']['mode']);
        Http::fake(['api.openai.com/*' => Http::failedConnection()]);
        $this->assertSame('rules', app(PipelineService::class)->generateSmartView(self::DATE)['meta']['mode']);
        config(['openai.api_key' => '']);
        $service = new PipelineService(app(ClassificationService::class), new AIService());
        $this->assertSame('rules', $service->generateSmartView(self::DATE)['meta']['mode']);
    }

    public function test_empty_list_replaces_old_view_without_ai_call(): void
    {
        $result = app(PipelineService::class)->generateSmartView(self::DATE);
        $this->assertSame([], $result['data']);
        Http::assertNothingSent();
    }

    public function test_rule_ranking_considers_fit_and_activity(): void
    {
        config(['openai.api_key' => '']);
        $this->state(['available_time' => 15, 'activity_preference' => 'Indoor']);
        $this->task(['title' => 'Outdoor garden', 'priority' => 12, 'effort' => 9, 'time_estimate' => '15 minutes']);
        $best = $this->task(['title' => 'Read at home', 'priority' => 12, 'effort' => 2, 'time_estimate' => '15 minutes']);
        $result = app(PipelineService::class)->generateSmartView(self::DATE);
        $this->assertSame('rules', $result['meta']['mode']);
        $this->assertSame([(string) $best->id], array_column($result['data'], 'id'));
        Http::assertNothingSent();
    }

    public function test_legacy_records_retain_priority_sorting(): void
    {
        $low = $this->task(['priority' => 1]);
        $high = $this->task(['priority' => 20]);
        foreach ([$low, $high] as $task) {
            TodayView::create(['task_id' => $task->id, 'priority' => $task->priority, 'fit_score' => 5, 'category' => 'Optional', 'status' => 'Pending', 'date' => self::DATE]);
        }
        $response = app(TaskController::class)->smartToday(Request::create('/tasks/today/smart', 'GET', ['date' => self::DATE]));
        $this->assertSame([(string) $high->id, (string) $low->id], array_column($response->getData(true)['data'], 'id'));
    }

    public function test_notes_can_be_updated_and_intentionally_cleared(): void
    {
        $this->state();
        $controller = app(\App\Http\Controllers\DailyStateController::class);
        foreach (['New notes', ''] as $notes) {
            $controller->save(Request::create('/daily-state', 'POST', [
                'date' => self::DATE, 'energy' => 5, 'mood' => 5, 'focus' => 5,
                'available_time' => 60, 'activity_preference' => 'Indoor', 'notes' => $notes,
            ]));
            $this->assertSame($notes, DailyState::whereDate('date', self::DATE)->first()->notes);
        }
    }

    public function test_failed_replacement_restores_previous_view_and_fit_scores(): void
    {
        $this->state();
        $task = $this->task(['fit_score' => 9]);
        $old = TodayView::create(['task_id' => $task->id, 'priority' => 12, 'fit_score' => 9, 'category' => 'Must Do', 'status' => 'Pending', 'date' => self::DATE]);
        $this->rank([$task->id]);
        TodayView::creating(function () { throw new \RuntimeException('Simulated write failure'); });
        try {
            app(PipelineService::class)->generateSmartView(self::DATE);
            $this->fail('Expected write failure');
        } catch (\RuntimeException $e) {
            $this->assertSame('Simulated write failure', $e->getMessage());
            $this->assertNotNull($old->fresh());
            $this->assertEquals(9, $task->fresh()->fit_score);
        } finally {
            TodayView::flushEventListeners();
        }
    }
}
