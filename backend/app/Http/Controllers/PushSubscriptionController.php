<?php

namespace App\Http\Controllers;

use App\Models\PushDelivery;
use App\Models\PushSubscription;
use App\Services\PushService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class PushSubscriptionController extends Controller
{
    public function config(PushService $push)
    {
        return response()->json(['success' => true, 'data' => [
            'enabled' => $push->configured(), 'publicKey' => config('push.public_key'),
        ]]);
    }

    private function endpoint(Request $request): string
    {
        $data = $request->validate(['endpoint' => 'required|url:https|max:2048']);
        $url = parse_url($data['endpoint']);
        // Only browser push providers may receive outbound requests; never arbitrary user URLs.
        $host = strtolower($url['host'] ?? '');
        $allowed = $host === 'fcm.googleapis.com'
            || $host === 'updates.push.services.mozilla.com'
            || $host === 'updates-autopush.stage.mozaws.net'
            || $host === 'web.push.apple.com'
            || str_ends_with($host, '.notify.windows.com');
        if (! $allowed || isset($url['user']) || isset($url['pass']) || (isset($url['port']) && $url['port'] !== 443)) {
            throw ValidationException::withMessages(['endpoint' => ['Unsupported browser push provider.']]);
        }

        return $data['endpoint'];
    }

    public function store(Request $request, PushService $push)
    {
        abort_unless($push->configured(), 503, 'Push notifications are not configured.');
        $endpoint = $this->endpoint($request);
        $data = $request->validate([
            'keys.p256dh' => ['required', 'string', 'regex:/^[A-Za-z0-9_-]{87}=?$/'],
            'keys.auth' => ['required', 'string', 'regex:/^[A-Za-z0-9_-]{22}(==)?$/'],
        ]);
        // A shared browser belongs to the current signed-in user. Old queued payloads must not follow it.
        DB::transaction(function () use ($request, $endpoint, $data) {
            $hash = hash('sha256', $endpoint);
            $existing = PushSubscription::where('endpoint_hash', $hash)->lockForUpdate()->first();
            if ($existing && $existing->user_id !== $request->user()->id) {
                $existing->delete();
            }
            PushSubscription::updateOrCreate(['endpoint_hash' => $hash], [
                'user_id' => $request->user()->id, 'endpoint' => $endpoint,
                'public_key' => $data['keys']['p256dh'], 'auth_token' => $data['keys']['auth'],
            ]);
        });

        return response()->json(['success' => true]);
    }

    public function destroy(Request $request)
    {
        $endpoint = $this->endpoint($request);
        PushSubscription::where('user_id', $request->user()->id)->where('endpoint_hash', hash('sha256', $endpoint))->delete();

        return response()->json(['success' => true]);
    }

    public function test(Request $request, PushService $push)
    {
        abort_unless($push->configured(), 503, 'Push notifications are not configured.');
        $endpoint = $this->endpoint($request);
        $subscription = PushSubscription::where('user_id', $request->user()->id)
            ->where('endpoint_hash', hash('sha256', $endpoint))->firstOrFail();
        PushDelivery::create([
            'push_subscription_id' => $subscription->id,
            'payload' => ['title' => 'Second Brain AI', 'message' => 'Push notifications are working.', 'url' => '/tasks', 'tag' => 'push-test'],
            'available_at' => now(),
        ]);

        return response()->json(['success' => true, 'message' => 'Test notification queued.'], 202);
    }
}
