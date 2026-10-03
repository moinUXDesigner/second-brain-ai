<?php

namespace App\Services;

use App\Models\PushDelivery;
use App\Models\PushSubscription;
use App\Models\User;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Minishlink\WebPush\Subscription;
use Minishlink\WebPush\WebPush;

class PushService
{
    public function configured(): bool
    {
        return (bool) (config('push.public_key') && config('push.private_key'));
    }

    public function enqueue(User $user, array $payload): void
    {
        if (! $this->configured()) {
            return;
        }
        PushSubscription::where('user_id', $user->id)->each(function ($subscription) use ($payload) {
            PushDelivery::create([
                'push_subscription_id' => $subscription->id,
                'payload' => $payload,
                'available_at' => now(),
            ]);
        });
    }

    protected function sender(): WebPush
    {
        return new WebPush(['VAPID' => [
            'subject' => config('push.subject'),
            'publicKey' => config('push.public_key'),
            'privateKey' => config('push.private_key'),
        ]], ['TTL' => 3600], 10, ['allow_redirects' => false]);
    }

    public function flush(): int
    {
        if (! $this->configured()) {
            return 0;
        }

        // The scheduler and manual runs share this lock. HTTP delivery happens outside reminder transactions.
        return Cache::lock('push-delivery', 600)->get(function () {
            $webPush = $this->sender();
            $sent = 0;
            foreach (PushDelivery::where('available_at', '<=', now())->orderBy('id')->limit(30)->get() as $delivery) {
                $subscription = PushSubscription::find($delivery->push_subscription_id);
                if (! $subscription) {
                    $delivery->delete();

                    continue;
                }
                // Drop stale reminders instead of delivering yesterday's backlog.
                if ($delivery->created_at->lt(now()->subHour())) {
                    $delivery->delete();

                    continue;
                }
                try {
                    $report = $webPush->sendOneNotification(Subscription::create([
                        'endpoint' => $subscription->endpoint,
                        'keys' => ['p256dh' => $subscription->public_key, 'auth' => $subscription->auth_token],
                    ]), json_encode($delivery->payload, JSON_THROW_ON_ERROR));
                    if ($report->isSubscriptionExpired()) {
                        $subscription->delete();

                        continue;
                    }
                    if ($report->isSuccess()) {
                        $delivery->delete();
                        $sent++;

                        continue;
                    }
                    Log::warning('Push provider rejected delivery', ['delivery_id' => $delivery->id, 'status' => $report->getResponse()?->getStatusCode()]);
                } catch (\Throwable $error) {
                    // Do not log endpoints or keys, which are subscription credentials.
                    Log::warning('Push delivery failed', ['delivery_id' => $delivery->id, 'error_type' => get_class($error)]);
                }
                $attempts = $delivery->attempts + 1;
                if ($attempts >= 5) {
                    $delivery->delete();
                } else {
                    $delivery->update(['attempts' => $attempts, 'available_at' => now()->addMinutes(2 ** $attempts)]);
                }
            }

            return $sent;
        }) ?? 0;
    }
}
