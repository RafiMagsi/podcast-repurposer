<?php

namespace App\Http\Controllers;

use App\Models\ContentRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PipelineController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $contentRequests = $this->activeContentRequests($request);

        return Inertia::render('Pipeline/Index', [
            'contentRequests' => $contentRequests,
        ]);
    }

    public function status(Request $request): JsonResponse
    {
        return response()->json([
            'contentRequests' => $this->activeContentRequests($request),
        ]);
    }

    private function detectSourceType(?string $mimeType, ?string $filePath): string
    {
        if ($mimeType === 'text/plain' || ! $filePath) {
            return 'text';
        }

        if ($mimeType && str_starts_with($mimeType, 'video/')) {
            return 'video';
        }

        if ($mimeType && str_starts_with($mimeType, 'audio/')) {
            return 'audio';
        }

        return 'recording';
    }

    private function activeContentRequests(Request $request)
    {
        return $request->user()
            ->contentRequests()
            ->whereIn('status', ContentRequest::processingStatuses())
            ->latest()
            ->get()
            ->map(fn ($contentRequest) => [
                'id' => $contentRequest->id,
                'public_id' => $contentRequest->public_id,
                'title' => $contentRequest->title,
                'status' => $contentRequest->status,
                'compression_status' => $contentRequest->compression_status,
                'pipeline_state' => $this->pipelineState($contentRequest),
                'tone' => $contentRequest->tone,
                'original_file_name' => $contentRequest->original_file_name,
                'source_type' => $contentRequest->input_type ?? $this->detectSourceType($contentRequest->mime_type, $contentRequest->file_path),
                'created_at' => optional($contentRequest->created_at)->toDateTimeString(),
                'updated_at' => optional($contentRequest->updated_at)->toDateTimeString(),
            ])
            ->values();
    }

    private function pipelineState(ContentRequest $contentRequest): string
    {
        if ($contentRequest->status !== ContentRequest::STATUS_UPLOADED) {
            return 'current';
        }

        if (in_array($contentRequest->compression_status, ['started', 'completed'], true)) {
            return 'current';
        }

        return 'queue';
    }
}
