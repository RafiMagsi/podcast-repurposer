<?php

namespace App\Jobs;

use App\Models\Episode;
use App\Models\GeneratedContent;
use App\Services\OpenAIContentService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;
use Throwable;

class GenerateEpisodeContent implements ShouldQueue
{
    use Queueable;

    public int $tries = 3;
    public int $timeout = 600;

    public function __construct(
        public int $episodeId
    ) {
    }

    public function handle(OpenAIContentService $openAIContentService): void
    {
        Log::info('GenerateEpisodeContent started', [
            'episode_id' => $this->episodeId,
        ]);

        $episode = Episode::find($this->episodeId);

        if (! $episode) {
            Log::warning('GenerateEpisodeContent episode not found', [
                'episode_id' => $this->episodeId,
            ]);
            return;
        }

        if (! $episode->transcript) {
            Log::error('GenerateEpisodeContent missing transcript', [
                'episode_id' => $episode->id,
            ]);

            $episode->update([
                'status' => 'failed',
                'error_message' => 'Transcript is missing.',
            ]);

            return;
        }

        $episode->update([
            'status' => 'generating',
            'error_message' => null,
        ]);

        try {
            $outputs = $openAIContentService->generate($episode->transcript, $episode->tone);

            Log::info('VoicePost outputs generated', [
                'episode_id' => $episode->id,
                'summary_length' => strlen($outputs['summary'] ?? ''),
                'linkedin_post_length' => strlen($outputs['linkedin_post'] ?? ''),
                'x_post_length' => strlen($outputs['x_post'] ?? ''),
            ]);

            GeneratedContent::updateOrCreate(
                ['episode_id' => $episode->id, 'content_type' => 'summary'],
                ['title' => 'Summary', 'body' => $outputs['summary'], 'meta' => null]
            );

            GeneratedContent::updateOrCreate(
                ['episode_id' => $episode->id, 'content_type' => 'linkedin_post'],
                ['title' => 'LinkedIn Post', 'body' => $outputs['linkedin_post'], 'meta' => null]
            );

            GeneratedContent::updateOrCreate(
                ['episode_id' => $episode->id, 'content_type' => 'x_post'],
                ['title' => 'X Post', 'body' => $outputs['x_post'], 'meta' => null]
            );

            $episode->update([
                'summary' => $outputs['summary'],
                'status' => 'completed',
            ]);
        } catch (Throwable $e) {
            report($e);

            Log::error('GenerateEpisodeContent failed', [
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