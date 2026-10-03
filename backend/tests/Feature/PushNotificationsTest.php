<?php

namespace Tests\Feature;

use App\Models\PushDelivery;
use App\Models\PushSubscription;
use App\Models\Task;
use App\Models\User;
use App\Services\PushService;
use App\Services\ReminderService;
use GuzzleHttp\Psr7\Request;
use GuzzleHttp\Psr7\Response;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Minishlink\WebPush\MessageSentReport;
use Minishlink\WebPush\VAPID;
use Minishlink\WebPush\WebPush;
use Tests\TestCase;

class PushNotificationsTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $keys = VAPID::createVapidKeys();
        config(['push.public_key' => $keys['publicKey'], 'push.private_key' => $keys['privateKey']]);
    }

    private function user(string $email = 'push@example.com'): User
    {
        return User::create(['name' => 'Push user', 'email' => $email, 'password' => 'password', 'role' => 'user']);
    }

    private function payload(): array
    {
        return [
            'endpoint' => 'https://fcm.googleapis.com/fcm/send/test-subscription',
            'keys' => ['p256dh' => config('push.public_key'), 'auth' => rtrim(strtr(base64_encode(str_repeat('x', 16)), '+/', '-_'), '=')],
        ];
    }

    private function subscribe(User $user): PushSubscription
    {
        Sanctum::actingAs($user);
        $this->postJson('/api/push/subscriptions', $this->payload())->assertOk();

        return PushSubscription::where('user_id', $user->id)->firstOrFail();
    }

    public function test_registration_requires_auth_and_rejects_arbitrary_endpoints(): void
    {
        $this->postJson('/api/push/subscriptions', $this->payload())->assertUnauthorized();
        Sanctum::actingAs($this->user());
        foreach (['https://127.0.0.1/push', 'http://fcm.googleapis.com/push', 'https://fcm.googleapis.com.evil.example/push', 'https://fcm.googleapis.com:8443/push'] as $endpoint) {
            $this->postJson('/api/push/subscriptions', [...$this->payload(), 'endpoint' => $endpoint])->assertUnprocessable();
        }
        $this->postJson('/api/push/subscriptions', [...$this->payload(), 'keys' => ['p256dh' => 'bad', 'auth' => 'bad']])->assertUnprocessable();
        $this->assertDatabaseCount('push_subscriptions', 0);
    }

    public function test_registration_is_idempotent_and_account_switch_clears_old_deliveries(): void
    {
        $first = $this->user();
        $subscription = $this->subscribe($first);
        $this->subscribe($first);
        $this->assertDatabaseCount('push_subscriptions', 1);
        app(PushService::class)->enqueue($first, ['title' => 'Private reminder']);
        $this->assertDatabaseCount('push_deliveries', 1);
        $second = $this->user('second@example.com');
        $this->subscribe($second);
        $this->assertDatabaseCount('push_subscriptions', 1);
        $this->assertDatabaseMissing('push_subscriptions', ['id' => $subscription->id]);
        $this->assertDatabaseCount('push_deliveries', 0);
    }

    public function test_unsubscribe_and_test_requests_are_scoped_to_current_user(): void
    {
        $this->subscribe($this->user());
        Sanctum::actingAs($this->user('other@example.com'));
        $this->deleteJson('/api/push/subscriptions', $this->payload())->assertOk();
        $this->assertDatabaseCount('push_subscriptions', 1);
        $this->postJson('/api/push/test', $this->payload())->assertNotFound();
    }

    public function test_test_notification_only_targets_selected_device(): void
    {
        $user = $this->user();
        $this->subscribe($user);
        $other = $this->payload();
        $other['endpoint'] .= '-second';
        $this->postJson('/api/push/subscriptions', $other)->assertOk();
        $this->postJson('/api/push/test', $this->payload())->assertStatus(202);
        $this->assertDatabaseCount('push_deliveries', 1);
        $this->deleteJson('/api/push/subscriptions', $this->payload())->assertOk();
        $this->assertDatabaseCount('push_deliveries', 0);
        $this->assertDatabaseCount('push_subscriptions', 1);
    }

    public function test_reminder_scan_queues_once_and_preserves_in_app_notifications(): void
    {
        $user = $this->user();
        $this->subscribe($user);
        Task::create(['title' => 'Due task', 'type' => 'Task', 'status' => 'Pending', 'due_date' => now()->toDateString()]);
        Task::create(['title' => 'Done task', 'type' => 'Task', 'status' => 'Done', 'due_date' => now()->toDateString()]);
        $reminders = app(ReminderService::class);
        $this->assertSame(1, $reminders->checkForUser($user));
        $this->assertSame(0, $reminders->checkForUser($user));
        $this->assertDatabaseCount('notifications', 1);
        $this->assertDatabaseCount('push_deliveries', 1);
        $this->assertStringStartsWith('/tasks?edit=', PushDelivery::first()->payload['url']);
    }

    public function test_unconfigured_push_does_not_break_in_app_reminders(): void
    {
        config(['push.private_key' => null]);
        $user = $this->user();
        Sanctum::actingAs($user);
        $this->getJson('/api/push/config')->assertJsonPath('data.enabled', false);
        $this->postJson('/api/push/subscriptions', $this->payload())->assertStatus(503);
        Task::create(['title' => 'Due task', 'type' => 'Task', 'status' => 'Pending', 'due_date' => now()->toDateString()]);
        app(ReminderService::class)->checkForUser($user);
        $this->assertDatabaseCount('notifications', 1);
        $this->assertDatabaseCount('push_deliveries', 0);
    }

    private function sender(int $status): PushService
    {
        $webPush = $this->getMockBuilder(WebPush::class)->disableOriginalConstructor()->onlyMethods(['sendOneNotification'])->getMock();
        $webPush->expects($this->once())->method('sendOneNotification')->willReturn(new MessageSentReport(
            new Request('POST', $this->payload()['endpoint']), new Response($status), $status < 300
        ));

        return new class($webPush) extends PushService
        {
            public function __construct(private WebPush $webPush) {}

            protected function sender(): WebPush
            {
                return $this->webPush;
            }
        };
    }

    public function test_delivery_success_removes_outbox_item(): void
    {
        $user = $this->user();
        $this->subscribe($user);
        app(PushService::class)->enqueue($user, ['title' => 'Reminder']);
        $this->assertSame(1, $this->sender(201)->flush());
        $this->assertDatabaseCount('push_deliveries', 0);
        $this->assertDatabaseCount('push_subscriptions', 1);
    }

    public function test_expired_subscription_is_deleted_with_queued_messages(): void
    {
        $user = $this->user();
        $this->subscribe($user);
        app(PushService::class)->enqueue($user, ['title' => 'Reminder']);
        $this->sender(410)->flush();
        $this->assertDatabaseCount('push_deliveries', 0);
        $this->assertDatabaseCount('push_subscriptions', 0);
    }

    public function test_transient_failure_is_retried_with_backoff_then_bounded(): void
    {
        $user = $this->user();
        $this->subscribe($user);
        app(PushService::class)->enqueue($user, ['title' => 'Reminder']);
        $this->sender(503)->flush();
        $delivery = PushDelivery::firstOrFail();
        $this->assertSame(1, $delivery->attempts);
        $this->assertTrue($delivery->available_at->isFuture());
        $delivery->update(['attempts' => 4, 'available_at' => now()]);
        $this->sender(503)->flush();
        $this->assertDatabaseCount('push_deliveries', 0);
        $this->assertDatabaseCount('push_subscriptions', 1);
    }

    public function test_logout_removes_only_current_browser_subscription(): void
    {
        $user = $this->user();
        $this->subscribe($user);
        $token = $user->createToken('test')->plainTextToken;
        // Use a real Sanctum access token so the logout action can revoke it.
        auth()->forgetGuards();
        $this->withToken($token)->postJson('/api/auth/logout', ['push_endpoint' => $this->payload()['endpoint']])->assertOk();
        $this->assertDatabaseCount('push_subscriptions', 0);
    }
}
