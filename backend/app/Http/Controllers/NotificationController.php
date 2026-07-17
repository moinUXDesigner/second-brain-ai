<?php

namespace App\Http\Controllers;

use App\Services\ReminderService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $limit = min((int) $request->query('limit', 20), 50);
        $user = $request->user();
        $notifications = $user->notifications()
            ->latest()
            ->limit($limit)
            ->get()
            ->map(fn($notification) => $this->format($notification));

        return response()->json([
            'success' => true,
            'data' => [
                'items' => $notifications,
                'unreadCount' => $user->unreadNotifications()->count(),
            ],
        ]);
    }

    public function markRead(Request $request, string $id): JsonResponse
    {
        $notification = $request->user()->notifications()->where('id', $id)->firstOrFail();
        $notification->markAsRead();

        return response()->json(['success' => true, 'data' => $this->format($notification->fresh())]);
    }

    public function markAllRead(Request $request): JsonResponse
    {
        $request->user()->unreadNotifications->markAsRead();
        return response()->json([
            'success' => true,
            'data' => ['unreadCount' => 0],
        ]);
    }

    public function checkReminders(Request $request, ReminderService $reminders): JsonResponse
    {
        $created = $reminders->checkForUser($request->user());

        return response()->json([
            'success' => true,
            'data' => ['created' => $created],
        ]);
    }

    private function format($notification): array
    {
        return [
            'id' => (string) $notification->id,
            'type' => $notification->type,
            'data' => $notification->data,
            'readAt' => $notification->read_at?->toISOString() ?? '',
            'createdAt' => $notification->created_at?->toISOString() ?? '',
        ];
    }
}
