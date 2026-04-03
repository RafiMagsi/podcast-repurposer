<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $contentRequests = $request->user()
            ->contentRequests()
            ->latest()
            ->take(10)
            ->get()
            ->map(fn ($contentRequest) => [
                'id' => $contentRequest->id,
                'public_id' => $contentRequest->public_id,
                'title' => $contentRequest->title,
                'status' => $contentRequest->status,
                'tone' => $contentRequest->tone,
                'original_file_name' => $contentRequest->original_file_name,
                'mime_type' => $contentRequest->mime_type,
                'source_type' => $this->detectSourceType($contentRequest->mime_type, $contentRequest->file_path),
                'created_at' => optional($contentRequest->created_at)->toDateTimeString(),
            ]);

        return Inertia::render('Dashboard', [
            'contentRequests' => $contentRequests,
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
}
