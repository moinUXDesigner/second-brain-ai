<?php

namespace App\Services;

use App\Models\FinanceEntry;
use App\Models\User;

class FinanceSummaryService
{
    private const LIABILITY_BUCKETS = ['loan', 'handloan'];
    private const ZAKAT_ASSET_BUCKETS = ['asset', 'receivable'];
    private const CLOSED_STATUSES = ['closed', 'paid', 'settled', 'done'];

    public function forUser(User $user): array
    {
        $entries = FinanceEntry::query()
            ->where('user_id', $user->id)
            ->get();

        $activeEntries = $entries->filter(fn(FinanceEntry $entry) => !$this->isClosed($entry));
        $totals = array_fill_keys(FinanceEntry::BUCKETS, 0.0);
        $counts = array_fill_keys(FinanceEntry::BUCKETS, 0);

        foreach ($activeEntries as $entry) {
            $totals[$entry->bucket] += (float) $entry->amount;
            $counts[$entry->bucket]++;
        }

        $netPosition = $totals['asset'] + $totals['receivable'] - $totals['loan'] - $totals['handloan'];

        $zakatAssets = $activeEntries
            ->filter(fn(FinanceEntry $entry) => $entry->zakat_eligible && in_array($entry->bucket, self::ZAKAT_ASSET_BUCKETS, true))
            ->sum(fn(FinanceEntry $entry) => (float) $entry->amount);

        $liabilities = $activeEntries
            ->filter(fn(FinanceEntry $entry) => in_array($entry->bucket, self::LIABILITY_BUCKETS, true))
            ->sum(fn(FinanceEntry $entry) => (float) $entry->amount);

        $zakatBase = max((float) $zakatAssets - (float) $liabilities, 0);

        return [
            'totals' => $this->roundMap($totals),
            'counts' => $counts,
            'netPosition' => round($netPosition, 2),
            'zakatBase' => round($zakatBase, 2),
            'zakatEstimate' => round($zakatBase * 0.025, 2),
            'activeEntryCount' => $activeEntries->count(),
            'entryCount' => $entries->count(),
        ];
    }

    private function isClosed(FinanceEntry $entry): bool
    {
        return in_array(strtolower($entry->status ?? ''), self::CLOSED_STATUSES, true);
    }

    private function roundMap(array $values): array
    {
        foreach ($values as $key => $value) {
            $values[$key] = round((float) $value, 2);
        }

        return $values;
    }
}
