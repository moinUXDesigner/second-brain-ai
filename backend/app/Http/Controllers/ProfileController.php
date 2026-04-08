<?php

namespace App\Http\Controllers;

use App\Models\Profile;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class ProfileController extends Controller
{
    public function show(): JsonResponse
    {
        $profile = Profile::first();
        if (!$profile) return response()->json(['success' => true, 'data' => null]);
        return response()->json(['success' => true, 'data' => $this->format($profile)]);
    }

    public function save(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name'             => 'nullable|string',
            'work_type'        => 'nullable|string',
            'routine_type'     => 'nullable|string',
            'commute_time'     => 'nullable|string',
            'use_personal_data'=> 'nullable|boolean',
            'age'              => 'nullable|string',
            'dob'              => 'nullable|date',
            'financial_status' => 'nullable|string',
            'health_status'    => 'nullable|string',
            'custom_notes'     => 'nullable|string',
        ]);

        $profile = Profile::updateOrCreate(['id' => 1], $data);
        return response()->json(['success' => true, 'data' => $this->format($profile)]);
    }

    private function format(Profile $profile): array
    {
        return [
            'userId'          => '1',
            'name'            => $profile->name ?? '',
            'workType'        => $profile->work_type ?? '',
            'routineType'     => $profile->routine_type ?? '',
            'commuteTime'     => $profile->commute_time ?? '',
            'usePersonalData' => (bool) $profile->use_personal_data,
            'age'             => $profile->age ?? '',
            'dob'             => $profile->dob?->toDateString() ?? '',
            'financialStatus' => $profile->financial_status ?? '',
            'healthStatus'    => $profile->health_status ?? '',
            'customNotes'     => $profile->custom_notes ?? '',
            'updatedAt'       => $profile->updated_at?->toISOString() ?? '',
        ];
    }
}
