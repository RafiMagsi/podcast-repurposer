<?php

namespace App\Jobs;

use App\Models\Episode;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class TranscribeEpisode implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public int $episodeId
    ) {
    }

    public function handle(): void
    {
        $episode = Episode::find($this->episodeId);

        if (! $episode) {
            return;
        }

        // Phase 1 placeholder:
        // later this will call WhisperService
        if ($episode->status === 'uploaded') {
            $episode->update([
                'status' => 'uploaded',
            ]);
        }
    }
}