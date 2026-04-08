<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Project extends Model
{
    use SoftDeletes;

    protected $fillable = ['title', 'description', 'status', 'priority', 'due_date'];

    protected $casts = ['due_date' => 'date'];

    public function tasks(): HasMany
    {
        return $this->hasMany(Task::class);
    }

    public function getProgressAttribute(): int
    {
        $total = $this->tasks()->count();
        if ($total === 0) return 0;
        $done = $this->tasks()->where('status', 'Done')->count();
        return (int) round(($done / $total) * 100);
    }

    protected $appends = ['progress'];
}
