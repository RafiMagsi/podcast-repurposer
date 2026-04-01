<?php

namespace App\Jobs;

use App\Models\Episode;
use App\Jobs\GenerateEpisodeContent;
use App\Services\WhisperService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;
use Throwable;

class TranscribeEpisode implements ShouldQueue
{
    use Queueable;

    public int $tries = 3;
    public int $timeout = 1200;

    public function __construct(
        public int $episodeId
    ) {
    }

    public function handle(WhisperService $whisperService): void
    {
        Log::info('TranscribeEpisode started', [
            'episode_id' => $this->episodeId,
        ]);

        $episode = Episode::find($this->episodeId);

        if (! $episode) {
            Log::warning('TranscribeEpisode episode not found', [
                'episode_id' => $this->episodeId,
            ]);
            return;
        }

        $episode->update([
            'status' => 'transcribing',
            'error_message' => null,
            'compression_error' => null,
        ]);

        Log::info('Episode status changed to transcribing', [
            'episode_id' => $episode->id,
            'public_id' => $episode->public_id,
            'file_path' => $episode->file_path,
        ]);

        try {
            Log::info('Calling WhisperService', [
                'episode_id' => $episode->id,
                's3_path' => $episode->file_path,
            ]);

            $transcript = $whisperService->transcribe($episode);

            Log::info('WhisperService returned transcript', [
                'episode_id' => $episode->id,
                'transcript_length' => strlen($transcript),
            ]);

            $episode->update([
                'transcript' => $transcript,
                'status' => 'transcribed',
            ]);

            Log::info('Episode status changed to transcribed', [
                'episode_id' => $episode->id,
            ]);

            GenerateEpisodeContent::dispatch($episode->id);

            Log::info('GenerateEpisodeContent dispatched', [
                'episode_id' => $episode->id,
            ]);
        } catch (Throwable $e) {
            report($e);

            Log::error('TranscribeEpisode failed', [
                'episode_id' => $episode->id,
                'message' => $e->getMessage(),
            ]);

            $episode->update([
                'status' => 'failed',
                'error_message' => $e->getMessage(),
            ]);

            throw $e;
        }
    }
}