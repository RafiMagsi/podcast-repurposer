<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ContentRequestChatMessage extends Model
{
    use HasFactory;

    protected $fillable = [
        'episode_id',
        'role',
        'body',
    ];

    public function contentRequest(): BelongsTo
    {
        return $this->belongsTo(ContentRequest::class, 'episode_id');
    }
}
