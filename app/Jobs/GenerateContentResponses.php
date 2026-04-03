<?php

namespace App\Jobs;

use App\Models\ContentRequest;
use App\Models\ContentResponse;
use App\Services\OpenAIContentService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;
use Throwable;

class GenerateContentResponses implements ShouldQueue
{
    use Queueable;

    public int $tries = 3;
    public int $timeout = 600;

    public function __construct(
        public int $contentRequestId
    ) {
    }

    public function handle(OpenAIContentService $openAIContentService): void
    {
        Log::info('GenerateContentResponses started', [
            'content_request_id' => $this->contentRequestId,
        ]);

        $contentRequest = ContentRequest::find($this->contentRequestId);

        if (! $contentRequest) {
            Log::warning('GenerateContentResponses content request not found', [
                'content_request_id' => $this->contentRequestId,
            ]);
            return;
        }

        if (! $contentRequest->transcript) {
            Log::error('GenerateContentResponses missing transcript', [
                'content_request_id' => $contentRequest->id,
            ]);

            $contentRequest->update([
                'status' => 'failed',
                'error_message' => 'Transcript is missing.',
            ]);

            return;
        }

        $contentRequest->update([
            'status' => 'generating',
            'error_message' => null,
        ]);

        try {
            $outputs = $openAIContentService->generate($contentRequest->transcript, $contentRequest->tone);

            Log::info('VoicePost outputs generated', [
                'content_request_id' => $contentRequest->id,
                'summary_length' => strlen($outputs['summary'] ?? ''),
                'linkedin_post_length' => strlen($outputs['linkedin_post'] ?? ''),
                'x_post_length' => strlen($outputs['x_post'] ?? ''),
                'instagram_caption_length' => strlen($outputs['instagram_caption'] ?? ''),
                'newsletter_length' => strlen($outputs['newsletter'] ?? ''),
            ]);

            ContentResponse::updateOrCreate(
                ['episode_id' => $contentRequest->id, 'content_type' => 'summary'],
                ['title' => 'Summary', 'body' => $outputs['summary'], 'meta' => null]
            );

            ContentResponse::updateOrCreate(
                ['episode_id' => $contentRequest->id, 'content_type' => 'linkedin_post'],
                ['title' => 'LinkedIn Post', 'body' => $outputs['linkedin_post'], 'meta' => null]
            );

            ContentResponse::updateOrCreate(
                ['episode_id' => $contentRequest->id, 'content_type' => 'x_post'],
                ['title' => 'X Post', 'body' => $outputs['x_post'], 'meta' => null]
            );

            ContentResponse::updateOrCreate(
                ['episode_id' => $contentRequest->id, 'content_type' => 'instagram_caption'],
                ['title' => 'Instagram Caption', 'body' => $outputs['instagram_caption'], 'meta' => null]
            );

            ContentResponse::updateOrCreate(
                ['episode_id' => $contentRequest->id, 'content_type' => 'newsletter'],
                ['title' => 'Newsletter', 'body' => $outputs['newsletter'], 'meta' => null]
            );

            $contentRequest->update([
                'summary' => $outputs['summary'],
                'status' => 'completed',
            ]);
        } catch (Throwable $e) {
            report($e);

            Log::error('GenerateContentResponses failed', [
                'content_request_id' => $contentRequest->id,
                'message' => $e->getMessage(),
            ]);

            $contentRequest->update([
                'status' => 'failed',
                'error_message' => $e->getMessage(),
            ]);

            throw $e;
        }
    }
}
