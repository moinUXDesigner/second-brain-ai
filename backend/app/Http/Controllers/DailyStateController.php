<?php

namespace App\Http\Controllers;

use App\Models\DailyState;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class DailyStateController extends Controller
{
    public function history(Request $request): JsonResponse
    {
        $days   = (int) $request->query('days', 7);
        $states = DailyState::where('date', '>=', now()->subDays($days - 1)->toDateString())
            ->orderBy('date')
            ->get()
            ->map(fn($s) => $this->format($s));

        return response()->json(['success' => true, 'data' => $states]);
    }

    public function show(Request $request): JsonResponse
    {
        $date  = $request->query('date', today()->toDateString());
        $state = DailyState::whereDate('date', $date)->first()
            ?? DailyState::orderByDesc('date')->first();

        if (!$state) {
            return response()->json(['success' => true, 'data' => null]);
        }

        return response()->json(['success' => true, 'data' => $this->format($state)]);
    }

    public function save(Request $request): JsonResponse
    {
        $data = $request->validate([
            'date'           => 'required|date',
            'energy'         => 'required|integer|min:1|max:10',
            'mood'           => 'required|integer|min:1|max:10',
            'focus'          => 'required|integer|min:1|max:10',
            'available_time' => 'nullable|integer|min:0',
            'notes'          => 'nullable|string',
        ]);

        $state = DailyState::updateOrCreate(
            ['date' => $data['date']],
            [
                'energy'         => $data['energy'],
                'mood'           => $data['mood'],
                'focus'          => $data['focus'],
                'available_time' => $data['available_time'] ?? 120,
                'notes'          => $data['notes'] ?? '',
            ]
        );

        return response()->json(['success' => true, 'data' => $this->format($state)]);
    }

    private function format(DailyState $state): array
    {
        return [
            'id'            => (string) $state->id,
            'date'          => $state->date->toDateString(),
            'energy'        => $state->energy,
            'mood'          => $state->mood,
            'focus'         => $state->focus,
            'availableTime' => $state->available_time,
            'notes'         => $state->notes ?? '',
        ];
    }
}
