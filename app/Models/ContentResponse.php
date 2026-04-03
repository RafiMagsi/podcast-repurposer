<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ContentResponse extends Model
{
    use HasFactory;

    protected $table = 'generated_contents';

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

    public function contentRequest(): BelongsTo
    {
        return $this->belongsTo(ContentRequest::class, 'episode_id');
    }
}
