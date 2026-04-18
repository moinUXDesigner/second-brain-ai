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
        'recurrence', 'due_date', 'deadline_date', 'tags', 'completed_at',
        'time_spent', 'timer_started_at', 'timer_running',
    ];

    protected $casts = [
        'tags'             => 'array',
        'due_date'         => 'date',
        'deadline_date'    => 'date',
        'completed_at'     => 'datetime',
        'timer_started_at' => 'datetime',
        'timer_running'    => 'boolean',
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
