<?php

namespace App\Http\Controllers;

use App\Models\FinanceEntry;
use App\Services\FinanceSummaryService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class FinanceEntryController extends Controller
{
    public function __construct(private FinanceSummaryService $summary) {}

    public function index(Request $request): JsonResponse
    {
        $filters = $request->validate([
            'bucket' => ['nullable', Rule::in(FinanceEntry::BUCKETS)],
        ]);

        $entries = FinanceEntry::query()
            ->where('user_id', $request->user()->id)
            ->when($filters['bucket'] ?? null, fn($query, $bucket) => $query->where('bucket', $bucket))
            ->orderByRaw('due_date is null')
            ->orderBy('due_date')
            ->orderByDesc('created_at')
            ->get()
            ->map(fn(FinanceEntry $entry) => $this->format($entry));

        return response()->json(['success' => true, 'data' => $entries, 'total' => $entries->count()]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate($this->rules());
        $data['user_id'] = $request->user()->id;
        $data['status'] = $data['status'] ?? 'active';
        $data['zakat_eligible'] = $data['zakat_eligible'] ?? in_array($data['bucket'], ['asset', 'receivable'], true);

        $entry = FinanceEntry::create($data);

        return response()->json(['success' => true, 'data' => $this->format($entry)], 201);
    }

    public function update(Request $request, FinanceEntry $financeEntry): JsonResponse
    {
        $this->authorizeEntry($request, $financeEntry);

        $data = $request->validate($this->rules(updating: true));
        $financeEntry->update($data);

        return response()->json(['success' => true, 'data' => $this->format($financeEntry->fresh())]);
    }

    public function destroy(Request $request, FinanceEntry $financeEntry): JsonResponse
    {
        $this->authorizeEntry($request, $financeEntry);
        $financeEntry->delete();

        return response()->json(['success' => true, 'data' => ['deleted' => true, 'entryId' => (string) $financeEntry->id]]);
    }

    public function summary(Request $request): JsonResponse
    {
        return response()->json(['success' => true, 'data' => $this->summary->forUser($request->user())]);
    }

    private function rules(bool $updating = false): array
    {
        $required = $updating ? 'sometimes|required' : 'required';

        return [
            'bucket' => [$required, Rule::in(FinanceEntry::BUCKETS)],
            'title' => [$required, 'string', 'max:255'],
            'amount' => [$required, 'numeric', 'min:0'],
            'counterparty' => ['nullable', 'string', 'max:255'],
            'due_date' => ['nullable', 'date'],
            'status' => ['nullable', 'string', 'max:50'],
            'notes' => ['nullable', 'string'],
            'zakat_eligible' => ['sometimes', 'boolean'],
        ];
    }

    private function authorizeEntry(Request $request, FinanceEntry $financeEntry): void
    {
        abort_unless((int) $financeEntry->user_id === (int) $request->user()->id, 404);
    }

    private function format(FinanceEntry $entry): array
    {
        return [
            'id' => (string) $entry->id,
            'bucket' => $entry->bucket,
            'title' => $entry->title,
            'amount' => (float) $entry->amount,
            'counterparty' => $entry->counterparty ?? '',
            'dueDate' => $entry->due_date?->toDateString() ?? '',
            'status' => $entry->status ?? 'active',
            'notes' => $entry->notes ?? '',
            'zakatEligible' => (bool) $entry->zakat_eligible,
            'createdAt' => $entry->created_at?->toISOString() ?? '',
            'updatedAt' => $entry->updated_at?->toISOString() ?? '',
        ];
    }
}
