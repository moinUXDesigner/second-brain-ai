<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TodayView extends Model
{
    protected $table = 'today_view';

    protected $fillable = ['task_id', 'priority', 'fit_score', 'category', 'status', 'date'];

    protected $casts = ['date' => 'date'];

    public function task(): BelongsTo
    {
        return $this->belongsTo(Task::class);
    }
}
