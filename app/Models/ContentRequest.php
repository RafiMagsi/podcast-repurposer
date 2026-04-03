<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class ContentRequest extends Model
{
    use HasFactory;

    protected $table = 'episodes';

    protected $fillable = [
        'public_id',
        'user_id',
        'title',
        'original_file_name',
        'file_path',
        'mime_type',
        'file_size',
        'compressed_file_size',
        'compression_status',
        'compression_error',
        'duration_seconds',
        'tone',
        'status',
        'transcript',
        'summary',
        'error_message',
        'input_type',
        'media_kind',
        'source_text',
    ];

    protected static function booted(): void
    {
        static::creating(function ($contentRequest) {
            if (! $contentRequest->public_id) {
                $contentRequest->public_id = (string) Str::ulid();
            }
        });
    }

    public function getRouteKeyName(): string
    {
        return 'public_id';
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function contentResponses(): HasMany
    {
        return $this->hasMany(ContentResponse::class, 'episode_id');
    }
}
