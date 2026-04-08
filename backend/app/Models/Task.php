<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Task extends Model
{
    protected $fillable = [
        'project_id', 'title', 'type', 'area', 'notes', 'maslow',
        'impact', 'effort', 'time_estimate', 'urgency', 'category',
        'confidence', 'priority', 'fit_score', 'status', 'source',
        'recurrence', 'due_date', 'tags', 'completed_at',
    ];

    protected $casts = [
        'tags' => 'array',
        'due_date' => 'date',
        'completed_at' => 'datetime',
    ];

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function getProjectNameAttribute(): string
    {
        return $this->project?->title ?? '';
    }

    protected $appends = ['project_name'];
}
