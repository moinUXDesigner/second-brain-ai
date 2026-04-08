<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class AuditController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = AuditLog::orderByDesc('timestamp');

        if ($request->filled('action'))   $query->where('action', $request->action);
        if ($request->filled('severity')) $query->where('severity', $request->severity);
        if ($request->filled('search')) {
            $q = $request->search;
            $query->where(fn($q2) => $q2->where('description', 'like', "%{$q}%")->orWhere('action', 'like', "%{$q}%"));
        }
        if ($request->filled('date_from')) $query->whereDate('timestamp', '>=', $request->date_from);
        if ($request->filled('date_to'))   $query->whereDate('timestamp', '<=', $request->date_to);

        $perPage = (int) $request->query('per_page', 50);
        $result  = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'data'    => $result->items(),
            'total'   => $result->total(),
            'page'    => $result->currentPage(),
            'perPage' => $result->perPage(),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'action'      => 'required|string',
            'entity_type' => 'required|string',
            'entity_id'   => 'nullable|string',
            'description' => 'nullable|string',
            'metadata'    => 'nullable|array',
            'severity'    => 'nullable|in:info,warning,critical',
            'session_id'  => 'required|string',
            'timestamp'   => 'nullable|date',
        ]);

        $log = AuditLog::create(array_merge($data, [
            'severity'    => $data['severity'] ?? 'info',
            'description' => $data['description'] ?? $data['action'],
            'timestamp'   => $data['timestamp'] ?? now(),
        ]));

        return response()->json(['success' => true, 'data' => $log], 201);
    }
}
