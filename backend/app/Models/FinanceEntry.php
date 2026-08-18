<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class FinanceEntry extends Model
{
    use SoftDeletes;

    public const BUCKETS = ['asset', 'loan', 'receivable', 'handloan'];

    protected $fillable = [
        'user_id',
        'bucket',
        'title',
        'amount',
        'counterparty',
        'due_date',
        'status',
        'notes',
        'zakat_eligible',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'due_date' => 'date',
        'zakat_eligible' => 'boolean',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
