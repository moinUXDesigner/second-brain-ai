<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AuditLog extends Model
{
    protected $fillable = [
        'action', 'entity_type', 'entity_id', 'description',
        'metadata', 'severity', 'session_id', 'timestamp',
    ];

    protected $casts = ['metadata' => 'array', 'timestamp' => 'datetime'];
}
