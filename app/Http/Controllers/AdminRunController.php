<?php

namespace App\Http\Controllers;

use App\Models\ContentRequest;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AdminRunController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $filter = (string) $request->query('filter', 'all');

        $query = ContentRequest::query()
            ->with('user:id,name,email')
            ->latest();

        if ($filter === 'failed') {
            $query->whereIn('status', [ContentRequest::STATUS_FAILED, ContentRequest::STATUS_PARTIAL]);
        } elseif ($filter === 'processing') {
            $query->whereIn('status', ContentRequest::processingStatuses());
        }

        $runs = $query
            ->paginate(20)
            ->withQueryString()
            ->through(fn (ContentRequest $contentRequest) => [
                'id' => $contentRequest->id,
                'public_id' => $contentRequest->public_id,
                'title' => $contentRequest->title,
                'status' => $contentRequest->status,
                'source_type' => $contentRequest->input_type ?: $this->detectSourceType($contentRequest->mime_type, $contentRequest->file_path),
                'created_at' => optional($contentRequest->created_at)->toDateTimeString(),
                'user' => [
                    'name' => $contentRequest->user?->name,
                    'email' => $contentRequest->user?->email,
                ],
            ]);

        return Inertia::render('Admin/Runs/Index', [
            'runs' => $runs,
            'filters' => [
                'current' => $filter,
                'items' => [
                    ['value' => 'all', 'label' => 'All runs'],
                    ['value' => 'processing', 'label' => 'Processing'],
                    ['value' => 'failed', 'label' => 'Failed / partial'],
                ],
            ],
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

        return 'audio';
    }
}
