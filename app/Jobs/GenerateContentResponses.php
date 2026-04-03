<?php

namespace App\Jobs;

use App\Exceptions\ProcessingCancelledException;
use App\Jobs\PrepareVideoPreviewAssets;
use App\Models\ContentRequest;
use App\Models\ContentResponse;
use App\Services\OpenAIContentService;
use App\Services\OperationalAnalyticsService;
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

    public function handle(OpenAIContentService $openAIContentService, ?OperationalAnalyticsService $analytics = null): void
    {
        $analytics ??= app(OperationalAnalyticsService::class);

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

            $outputTitles = [
                'summary' => 'Summary',
                'linkedin_post' => 'LinkedIn Post',
                'x_post' => 'X Post',
                'instagram_caption' => 'Instagram Caption',
                'newsletter' => 'Newsletter',
            ];

            $savedOutputTypes = [];

            foreach (ContentRequest::EXPECTED_OUTPUT_TYPES as $contentType) {
                $body = trim((string) ($outputs[$contentType] ?? ''));

                if ($body === '') {
                    continue;
                }

                ContentResponse::updateOrCreate(
                    ['episode_id' => $contentRequest->id, 'content_type' => $contentType],
                    ['title' => $outputTitles[$contentType], 'body' => $body, 'meta' => null]
                );

                $savedOutputTypes[] = $contentType;
                $analytics->record('output_generated', [
                    'user_id' => $contentRequest->user_id,
                    'content_request_id' => $contentRequest->id,
                    'source_type' => $contentRequest->input_type,
                    'content_type' => $contentType,
                    'status' => $contentRequest->status,
                ]);
            }

            $missingOutputTypes = array_values(array_diff(ContentRequest::EXPECTED_OUTPUT_TYPES, $savedOutputTypes));
            $hasAllOutputs = $missingOutputTypes === [];

            $contentRequest->update([
                'summary' => $outputs['summary'],
                'status' => $hasAllOutputs ? ContentRequest::STATUS_COMPLETED : ContentRequest::STATUS_PARTIAL,
                'error_message' => $hasAllOutputs
                    ? null
                    : 'Content generation finished with missing outputs: ' . implode(', ', $missingOutputTypes) . '.',
                'failure_stage' => $hasAllOutputs ? null : 'generation',
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

            $contentRequest->update($this->generationFailureState($contentRequest, $e));

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

        $contentRequest->update($this->generationFailureState($contentRequest, $e));
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

    private function generationFailureState(ContentRequest $contentRequest, Throwable $e): array
    {
        $hasTranscript = filled($contentRequest->transcript);
        $hasExistingOutputs = $contentRequest->contentResponses()->exists() || filled($contentRequest->summary);

        return [
            'status' => ($hasTranscript || $hasExistingOutputs)
                ? ContentRequest::STATUS_PARTIAL
                : ContentRequest::STATUS_FAILED,
            'error_message' => $this->generationFailureMessage($e),
            'failure_stage' => 'generation',
        ];
    }
}
