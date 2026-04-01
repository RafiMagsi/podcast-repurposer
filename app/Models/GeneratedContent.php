<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GeneratedContent extends Model
{
    use HasFactory;

    protected $fillable = [
        'episode_id',
        'content_type',
        'title',
        'body',
        'meta',
    ];

    protected $casts = [
        'meta' => 'array',
    ];

    public function episode(): BelongsTo
    {
        return $this->belongsTo(Episode::class);
    }
}