<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\Task;
use App\Models\DailyState;
use App\Models\Profile;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class ImportController extends Controller
{
    public function import(Request $request): JsonResponse
    {
        $data = $request->validate([
            'projects'    => 'nullable|array',
            'tasks'       => 'nullable|array',
            'dailyStates' => 'nullable|array',
            'profile'     => 'nullable|array',
        ]);

        $stats = ['projects' => 0, 'tasks' => 0, 'daily_states' => 0, 'profile' => false];

        DB::transaction(function () use ($data, &$stats) {

            // Map gas_id → new DB id for project linking
            $projectIdMap = [];

            // ── Projects ──────────────────────────────────────
            foreach ($data['projects'] ?? [] as $p) {
                if (empty($p['title'])) continue;

                $project = Project::create([
                    'title'       => $p['title'],
                    'description' => $p['description'] ?? '',
                    'status'      => $this->validProjectStatus($p['status'] ?? 'Active'),
                    'priority'    => (int) ($p['priority'] ?? 0),
                    'due_date'    => null,
                    'created_at'  => $p['created_at'] ?? now(),
                    'updated_at'  => $p['updated_at'] ?? now(),
                ]);

                if (!empty($p['gas_id'])) {
                    $projectIdMap[$p['gas_id']] = $project->id;
                }

                $stats['projects']++;
            }

            // ── Tasks ─────────────────────────────────────────
            foreach ($data['tasks'] ?? [] as $t) {
                if (empty($t['title'])) continue;

                $projectId = null;
                if (!empty($t['gas_project_id']) && isset($projectIdMap[$t['gas_project_id']])) {
                    $projectId = $projectIdMap[$t['gas_project_id']];
                }

                Task::create([
                    'project_id'    => $projectId,
                    'title'         => $t['title'],
                    'type'          => $t['type'] ?? 'Task',
                    'area'          => $t['area'] ?? '',
                    'notes'         => $t['notes'] ?? '',
                    'maslow'        => $t['maslow'] ?? null,
                    'impact'        => (int) ($t['impact'] ?? 0),
                    'effort'        => (int) ($t['effort'] ?? 0),
                    'time_estimate' => $t['time_estimate'] ?? null,
                    'urgency'       => $t['urgency'] ?? null,
                    'category'      => $t['category'] ?? null,
                    'confidence'    => (float) ($t['confidence'] ?? 0),
                    'priority'      => (int) ($t['priority'] ?? 0),
                    'fit_score'     => (float) ($t['fit_score'] ?? 0),
                    'status'        => $this->validTaskStatus($t['status'] ?? 'Pending'),
                    'source'        => $t['source'] ?? null,
                    'recurrence'    => $this->validRecurrence($t['recurrence'] ?? null),
                    'due_date'      => $t['due_date'] ?? null,
                    'completed_at'  => $t['completed_at'] ?? null,
                ]);

                $stats['tasks']++;
            }

            // ── Daily States ───────────────────────────────────
            foreach ($data['dailyStates'] ?? [] as $s) {
                if (empty($s['date'])) continue;

                DailyState::updateOrCreate(
                    ['date' => $s['date']],
                    [
                        'energy'         => (int) ($s['energy'] ?? 5),
                        'mood'           => (int) ($s['mood'] ?? 5),
                        'focus'          => (int) ($s['focus'] ?? 5),
                        'available_time' => (int) ($s['available_time'] ?? 120),
                        'notes'          => $s['notes'] ?? '',
                    ]
                );

                $stats['daily_states']++;
            }

            // ── Profile ────────────────────────────────────────
            if (!empty($data['profile'])) {
                $p = $data['profile'];
                Profile::updateOrCreate(
                    ['id' => 1],
                    [
                        'name'              => $p['name'] ?? '',
                        'work_type'         => $p['work_type'] ?? '',
                        'routine_type'      => $p['routine_type'] ?? '',
                        'commute_time'      => $p['commute_time'] ?? '',
                        'use_personal_data' => (bool) ($p['use_personal_data'] ?? false),
                        'age'               => $p['age'] ?? '',
                        'dob'               => !empty($p['dob']) ? $p['dob'] : null,
                        'financial_status'  => $p['financial_status'] ?? '',
                        'health_status'     => $p['health_status'] ?? '',
                        'custom_notes'      => $p['custom_notes'] ?? '',
                    ]
                );
                $stats['profile'] = true;
            }
        });

        return response()->json([
            'success' => true,
            'message' => 'Import completed successfully',
            'stats'   => $stats,
        ]);
    }

    private function validProjectStatus(string $status): string
    {
        return in_array($status, ['Active', 'Completed', 'Archived', 'Deleted']) ? $status : 'Active';
    }

    private function validTaskStatus(string $status): string
    {
        return in_array($status, ['Pending', 'Done', 'Deleted', 'Idea', 'Note']) ? $status : 'Pending';
    }

    private function validRecurrence(?string $r): ?string
    {
        if (!$r) return null;
        return in_array($r, ['Daily', 'Weekly', 'Monthly', 'Yearly']) ? $r : null;
    }
}
