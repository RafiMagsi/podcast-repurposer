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

class PrepareVideoPreviewAssets implements ShouldQueue, ShouldBeUnique
{
    use Queueable;

    public int $tries = 1;
    public int $timeout = 1200;
    public int $uniqueFor = 3600;

    public function __construct(
        public int $contentRequestId
    ) {
    }

    public function uniqueId(): string
    {
        return 'video-preview:' . $this->contentRequestId;
    }

    public function handle(WhisperService $whisperService): void
    {
        $contentRequest = ContentRequest::find($this->contentRequestId);

        if (! $contentRequest) {
            return;
        }

        if ($contentRequest->media_kind !== 'video') {
            return;
        }

        if ($contentRequest->preview_path && $contentRequest->thumbnail_path) {
            Log::info('PrepareVideoPreviewAssets skipped because assets already exist', [
                'content_request_id' => $contentRequest->id,
                'public_id' => $contentRequest->public_id,
            ]);

            return;
        }

        try {
            $whisperService->prepareVideoAssets($contentRequest);
        } catch (ProcessingCancelledException $e) {
            Log::info('PrepareVideoPreviewAssets cancelled', [
                'content_request_id' => $contentRequest->id,
                'public_id' => $contentRequest->public_id,
            ]);
        } catch (Throwable $e) {
            report($e);

            Log::warning('PrepareVideoPreviewAssets failed', [
                'content_request_id' => $contentRequest->id,
                'public_id' => $contentRequest->public_id,
                'message' => $e->getMessage(),
            ]);
        }
    }
}
