<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DailyState extends Model
{
    protected $fillable = ['date', 'energy', 'mood', 'focus', 'available_time', 'notes'];

    protected $casts = ['date' => 'date'];
}
