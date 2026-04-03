<?php

namespace App\Jobs;

use App\Models\ContentRequest;
use App\Services\WhisperService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;
use Throwable;

class TranscribeContentRequest implements ShouldQueue
{
    use Queueable;

    public int $tries = 3;
    public int $timeout = 1200;

    public function __construct(
        public int $contentRequestId
    ) {
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

        $contentRequest->update([
            'status' => 'transcribing',
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

            if ($transcript === '') {
                $contentRequest->update([
                    'status' => 'failed',
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
                'status' => 'transcribed',
                'error_message' => null,
            ]);

            Log::info('Content request status changed to transcribed', [
                'content_request_id' => $contentRequest->id,
            ]);

            GenerateContentResponses::dispatch($contentRequest->id);

            Log::info('GenerateContentResponses dispatched', [
                'content_request_id' => $contentRequest->id,
            ]);
        } catch (Throwable $e) {
            report($e);

            Log::error('TranscribeContentRequest failed', [
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
