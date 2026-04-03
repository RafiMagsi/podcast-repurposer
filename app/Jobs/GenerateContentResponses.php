<?php

namespace App\Jobs;

use App\Exceptions\ProcessingCancelledException;
use App\Jobs\PrepareVideoPreviewAssets;
use App\Models\ContentRequest;
use App\Models\ContentResponse;
use App\Services\OpenAIContentService;
use Illuminate\Contracts\Queue\ShouldBeUnique;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;
use Throwable;

class GenerateContentResponses implements ShouldQueue, ShouldBeUnique
{
    use Queueable;

    public int $tries = 1;
    public int $timeout = 600;
    public int $uniqueFor = 3600;

    public function __construct(
        public int $contentRequestId
    ) {
    }

    public function uniqueId(): string
    {
        return 'generate:' . $this->contentRequestId;
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

        $this->abortIfCancelled($contentRequest);

        if (! $contentRequest->transcript) {
            Log::error('GenerateContentResponses missing transcript', [
                'content_request_id' => $contentRequest->id,
            ]);

            $contentRequest->update([
                'status' => ContentRequest::STATUS_FAILED,
                'error_message' => 'Content generation failed: transcript is missing.',
                'failure_stage' => 'generation',
            ]);

            return;
        }

        $contentRequest->update([
            'status' => ContentRequest::STATUS_GENERATING,
            'error_message' => null,
            'failure_stage' => null,
        ]);

        try {
            $outputs = $openAIContentService->generate(
                $contentRequest->transcript,
                $contentRequest->tone,
                $contentRequest->selected_suggestion
            );
            $contentRequest->refresh();
            $this->abortIfCancelled($contentRequest);

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
                'status' => ContentRequest::STATUS_COMPLETED,
                'failure_stage' => null,
            ]);
        } catch (ProcessingCancelledException $e) {
            Log::info('GenerateContentResponses cancelled', [
                'content_request_id' => $contentRequest->id,
            ]);

            return;
        } catch (Throwable $e) {
            $contentRequest->refresh();

            if ($contentRequest->status === ContentRequest::STATUS_CANCELLED) {
                Log::info('GenerateContentResponses error ignored after cancellation', [
                    'content_request_id' => $contentRequest->id,
                    'message' => $e->getMessage(),
                ]);

                return;
            }

            report($e);

            Log::error('GenerateContentResponses failed', [
                'content_request_id' => $contentRequest->id,
                'message' => $e->getMessage(),
            ]);

            $contentRequest->update([
                'status' => ContentRequest::STATUS_FAILED,
                'error_message' => $this->generationFailureMessage($e),
                'failure_stage' => 'generation',
            ]);

            throw $e;
        } finally {
            $contentRequest->refresh();

            if (
                $contentRequest->media_kind === 'video' &&
                empty($contentRequest->preview_path)
            ) {
                PrepareVideoPreviewAssets::dispatch($contentRequest->id);
            }
        }
    }

    public function failed(?Throwable $e): void
    {
        if (! $e) {
            return;
        }

        $contentRequest = ContentRequest::find($this->contentRequestId);

        if (! $contentRequest || $contentRequest->status === ContentRequest::STATUS_CANCELLED) {
            return;
        }

        $contentRequest->update([
            'status' => ContentRequest::STATUS_FAILED,
            'error_message' => $this->generationFailureMessage($e),
            'failure_stage' => 'generation',
        ]);
    }

    private function abortIfCancelled(ContentRequest $contentRequest): void
    {
        $contentRequest->refresh();

        if ($contentRequest->status === ContentRequest::STATUS_CANCELLED) {
            throw new ProcessingCancelledException('Processing was cancelled.');
        }
    }

    private function generationFailureMessage(Throwable $e): string
    {
        return 'Content generation failed: ' . $e->getMessage();
    }
}
