<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Profile extends Model
{
    protected $fillable = [
        'name', 'work_type', 'routine_type', 'commute_time',
        'use_personal_data', 'age', 'dob', 'financial_status',
        'health_status', 'custom_notes',
    ];

    protected $casts = ['use_personal_data' => 'boolean', 'dob' => 'date'];
}
