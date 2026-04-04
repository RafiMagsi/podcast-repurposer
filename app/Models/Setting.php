<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Setting extends Model
{
    protected $fillable = [
        'scope_type',
        'scope_id',
        'key',
        'value',
        'type',
        'is_encrypted',
    ];
}
