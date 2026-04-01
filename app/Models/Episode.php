<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class Episode extends Model
{
    use HasFactory;

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
    ];

    protected static function booted(): void
    {
        static::creating(function ($episode) {
            if (! $episode->public_id) {
                $episode->public_id = (string) Str::ulid();
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

    public function generatedContents(): HasMany
    {
        return $this->hasMany(GeneratedContent::class);
    }
}