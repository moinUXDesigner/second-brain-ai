<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PushDelivery extends Model
{
    protected $guarded = [];

    protected $casts = ['payload' => 'array', 'available_at' => 'datetime'];
}
