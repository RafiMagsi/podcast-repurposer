<?php

namespace App\Jobs;

use App\Exceptions\ProcessingCancelledException;
use App\Models\ContentRequest;
use App\Services\WhisperService;
use Illuminate\Contracts\Queue\ShouldBeUnique;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;
use Throwable;

class TranscribeContentRequest implements ShouldQueue, ShouldBeUnique
{
    use Queueable;

    public int $tries = 3;
    public int $timeout = 1200;
    public int $uniqueFor = 3600;

    public function __construct(
        public int $contentRequestId
    ) {
    }

    public function uniqueId(): string
    {
        return 'transcribe:' . $this->contentRequestId;
    }

    public function handle(WhisperService $whisperService): void
    {
        Log::info('TranscribeContentRequest started', [
            'content_request_id' => $this->contentRequestId,
        ]);

        $contentRequest = ContentRequest::find($this->contentRequestId);

        if (! $contentRequest) {
            Log::warning('TranscribeContentRequest content request not found', [
                'content_request_id' => $this->contentRequestId,
            ]);
            return;
        }

        $this->abortIfCancelled($contentRequest);

        $contentRequest->update([
            'status' => ContentRequest::STATUS_TRANSCRIBING,
            'error_message' => null,
            'compression_error' => null,
        ]);

        Log::info('Content request status changed to transcribing', [
            'content_request_id' => $contentRequest->id,
            'public_id' => $contentRequest->public_id,
            'file_path' => $contentRequest->file_path,
        ]);

        try {
            Log::info('Calling WhisperService', [
                'content_request_id' => $contentRequest->id,
                's3_path' => $contentRequest->file_path,
            ]);

            $transcript = trim((string) $whisperService->transcribe($contentRequest));
            $contentRequest->refresh();
            $this->abortIfCancelled($contentRequest);

            if ($transcript === '') {
                $contentRequest->update([
                    'status' => ContentRequest::STATUS_FAILED,
                    'error_message' => 'Transcription returned empty text.',
                ]);

                Log::error('TranscribeContentRequest empty transcript', [
                    'content_request_id' => $contentRequest->id,
                    'mime_type' => $contentRequest->mime_type,
                ]);

                return;
            }

            Log::info('WhisperService returned transcript', [
                'content_request_id' => $contentRequest->id,
                'transcript_length' => strlen($transcript),
            ]);

            $contentRequest->update([
                'transcript' => $transcript,
                'status' => ContentRequest::STATUS_TRANSCRIBED,
                'error_message' => null,
            ]);

            $contentRequest->refresh();
            $this->abortIfCancelled($contentRequest);

            Log::info('Content request status changed to transcribed', [
                'content_request_id' => $contentRequest->id,
            ]);

            GenerateContentResponses::dispatch($contentRequest->id);

            Log::info('GenerateContentResponses dispatched', [
                'content_request_id' => $contentRequest->id,
            ]);
        } catch (ProcessingCancelledException $e) {
            Log::info('TranscribeContentRequest cancelled', [
                'content_request_id' => $contentRequest->id,
            ]);

            return;
        } catch (Throwable $e) {
            $contentRequest->refresh();

            if ($contentRequest->status === ContentRequest::STATUS_CANCELLED) {
                Log::info('TranscribeContentRequest error ignored after cancellation', [
                    'content_request_id' => $contentRequest->id,
                    'message' => $e->getMessage(),
                ]);

                return;
            }

            report($e);

            Log::error('TranscribeContentRequest failed', [
                'content_request_id' => $contentRequest->id,
                'message' => $e->getMessage(),
            ]);

            $contentRequest->update([
                'status' => ContentRequest::STATUS_FAILED,
                'error_message' => $e->getMessage(),
            ]);

            throw $e;
        }
    }

    private function abortIfCancelled(ContentRequest $contentRequest): void
    {
        $contentRequest->refresh();

        if ($contentRequest->status === ContentRequest::STATUS_CANCELLED) {
            throw new ProcessingCancelledException('Processing was cancelled.');
        }
    }
}
