<?php

namespace App\Http\Controllers;

use App\Jobs\GenerateContentResponses;
use App\Jobs\TranscribeContentRequest;
use App\Models\ContentRequest;
use App\Services\S3DiskFactory;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ContentRequestController extends Controller
{
    public function index(Request $request): Response
    {
        $contentRequests = $request->user()
            ->contentRequests()
            ->latest()
            ->paginate(10)
            ->through(fn ($contentRequest) => [
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

        return Inertia::render('ContentRequests/Index', [
            'contentRequests' => $contentRequests,
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('ContentRequests/Create', [
            'tones' => [
                ['label' => 'Professional', 'value' => 'professional'],
                ['label' => 'Engaging', 'value' => 'engaging'],
                ['label' => 'Concise', 'value' => 'concise'],
            ],
        ]);
    }

    public function store(Request $request, S3DiskFactory $s3DiskFactory): RedirectResponse
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'tone' => ['required', 'in:professional,engaging,concise'],
            'source_type' => ['nullable', 'in:video,audio,recording,text'],
            'source_text' => [
                'nullable',
                'string',
                'max:200',
                Rule::requiredIf(fn () => $request->input('source_type') === 'text' && ! $request->hasFile('source_file') && ! $request->hasFile('audio')),
            ],
            'source_file' => [
                'nullable',
                'file',
                'mimetypes:audio/mpeg,audio/wav,audio/x-wav,audio/mp4,audio/x-m4a,video/mp4,video/quicktime,video/webm',
                'max:5120',
                Rule::requiredIf(fn () => $request->input('source_type') !== 'text' && ! filled($request->input('source_text')) && ! $request->hasFile('audio')),
            ],
            'audio' => [
                'nullable',
                'file',
                'mimetypes:audio/mpeg,audio/wav,audio/x-wav,audio/mp4,audio/x-m4a',
                'max:5120',
            ],
        ]);

        $file = $request->file('source_file') ?? $request->file('audio');
        $sourceText = trim((string) ($validated['source_text'] ?? ''));
        $sourceType = $validated['source_type'] ?? null;

        if (! $sourceType) {
            if ($request->hasFile('audio')) {
                $sourceType = 'recording';
            } elseif ($request->hasFile('source_file')) {
                $uploadedMime = (string) ($file?->getMimeType() ?? '');
                $sourceType = str_starts_with($uploadedMime, 'video/') ? 'video' : 'audio';
            } elseif ($sourceText !== '') {
                $sourceType = 'text';
            }
        }

        $isTextSource = $sourceType === 'text' || ($sourceText !== '' && ! $file);

        try {
            if ($isTextSource) {
                $contentRequest = ContentRequest::create([
                    'user_id' => $request->user()->id,
                    'title' => $validated['title'],
                    'tone' => $validated['tone'],
                    'input_type' => 'text',
                    'media_kind' => null,
                    'source_text' => $sourceText,
                    'original_file_name' => null,
                    'file_path' => null,
                    'mime_type' => 'text/plain',
                    'file_size' => mb_strlen($sourceText),
                    'status' => 'transcribed',
                    'transcript' => $sourceText,
                ]);

                GenerateContentResponses::dispatch($contentRequest->id);

                return redirect()
                    ->route('content-requests.show', $contentRequest)
                    ->with('success', 'Text note saved successfully. Content generation has been queued.');
            }

            $disk = $s3DiskFactory->make();

            $folder = 'content-requests/' . now()->format('Y/m');
            $filename = uniqid('content_request_', true) . '.' . $file->getClientOriginalExtension();
            $path = $disk->putFileAs($folder, $file, $filename);

            if (! $path) {
                return back()->withErrors([
                    'source_file' => 'Source upload failed. Please check storage settings and try again.',
                ]);
            }

            $mimeType = (string) $file->getMimeType();
            $mediaKind = str_starts_with($mimeType, 'video/') ? 'video' : 'audio';

            $contentRequest = ContentRequest::create([
                'user_id' => $request->user()->id,
                'title' => $validated['title'],
                'tone' => $validated['tone'],
                'input_type' => $sourceType,
                'media_kind' => $mediaKind,
                'source_text' => null,
                'original_file_name' => $file->getClientOriginalName(),
                'file_path' => $path,
                'mime_type' => $mimeType,
                'file_size' => $file->getSize(),
                'status' => 'uploaded',
            ]);

            TranscribeContentRequest::dispatch($contentRequest->id);

            return redirect()
                ->route('content-requests.show', $contentRequest)
                ->with('success', 'Source uploaded successfully. Transcription has been queued.');
        } catch (Throwable $e) {
            report($e);

            return back()->withErrors([
                'source_file' => 'Unable to upload this source right now. Check storage settings and try again.',
            ]);
        }
    }

    public function show(Request $request, ContentRequest $contentRequest, S3DiskFactory $s3DiskFactory): Response
    {
        abort_unless($contentRequest->user_id === $request->user()->id, 403);

        $contentRequest->load('contentResponses');

        $mediaUrl = null;

        if ($contentRequest->file_path) {
            try {
                $disk = $s3DiskFactory->make();
                $adapterClass = get_class($disk->getAdapter());

                if (str_contains(strtolower($adapterClass), 's3')) {
                    $mediaUrl = $disk->temporaryUrl(
                        $contentRequest->file_path,
                        now()->addMinutes(30)
                    );
                } else {
                    $mediaUrl = $disk->url($contentRequest->file_path);
                }
            } catch (Throwable $e) {
                report($e);
                $mediaUrl = null;
            }
        }

        return Inertia::render('ContentRequests/Show', [
            'contentRequest' => [
                'id' => $contentRequest->id,
                'public_id' => $contentRequest->public_id,
                'title' => $contentRequest->title,
                'status' => $contentRequest->status,
                'tone' => $contentRequest->tone,
                'original_file_name' => $contentRequest->original_file_name,
                'mime_type' => $contentRequest->mime_type,
                'source_type' => $this->detectSourceType($contentRequest->mime_type, $contentRequest->file_path),
                'file_size' => $contentRequest->file_size,
                'compressed_file_size' => $contentRequest->compressed_file_size,
                'compression_status' => $contentRequest->compression_status,
                'compression_error' => $contentRequest->compression_error,
                'transcript' => $contentRequest->transcript,
                'summary' => $contentRequest->summary,
                'error_message' => $contentRequest->error_message,
                'created_at' => optional($contentRequest->created_at)->toDateTimeString(),
                'input_type' => $contentRequest->input_type,
                'media_kind' => $contentRequest->media_kind,
                'source_text' => $contentRequest->source_text,
                'media_url' => $mediaUrl,
                'content_responses' => $contentRequest->contentResponses->map(fn ($contentResponse) => [
                    'id' => $contentResponse->id,
                    'content_type' => $contentResponse->content_type,
                    'title' => $contentResponse->title,
                    'body' => $contentResponse->body,
                    'meta' => $contentResponse->meta,
                ])->values(),
            ],
        ]);
    }

    public function retryTranscription(Request $request, ContentRequest $contentRequest): RedirectResponse
    {
        abort_unless($contentRequest->user_id === $request->user()->id, 403);

        if (! $contentRequest->file_path) {
            return back()->withErrors([
                'contentRequest' => 'This item was created from text, so transcription cannot be retried.',
            ]);
        }

        $contentRequest->update([
            'status' => 'uploaded',
            'error_message' => null,
            'transcript' => null,
            'summary' => null,
        ]);

        $contentRequest->contentResponses()->delete();

        TranscribeContentRequest::dispatch($contentRequest->id);

        return back()->with('success', 'Transcription retry started.');
    }

    public function regenerateContent(Request $request, ContentRequest $contentRequest): RedirectResponse
    {
        abort_unless($contentRequest->user_id === $request->user()->id, 403);

        if (! $contentRequest->transcript) {
            return back()->withErrors([
                'contentRequest' => 'Transcript is missing. Retry transcription first.',
            ]);
        }

        $contentRequest->update([
            'status' => 'transcribed',
            'error_message' => null,
            'summary' => null,
        ]);

        $contentRequest->contentResponses()->delete();

        GenerateContentResponses::dispatch($contentRequest->id);

        return back()->with('success', 'Content regeneration started.');
    }

    public function destroy(Request $request, ContentRequest $contentRequest): RedirectResponse
    {
        abort_unless($contentRequest->user_id === $request->user()->id, 403);

        try {
            Log::info('Deleting content request', [
                'content_request_id' => $contentRequest->id,
                'public_id' => $contentRequest->public_id,
                'user_id' => $request->user()->id,
            ]);

            $contentRequest->contentResponses()->delete();

            try {
                if ($contentRequest->file_path) {
                    $disk = app(\App\Services\S3DiskFactory::class)->make();
                    $disk->delete($contentRequest->file_path);

                    Log::info('Content request file deleted from storage', [
                        'content_request_id' => $contentRequest->id,
                        'file_path' => $contentRequest->file_path,
                    ]);
                }
            } catch (Throwable $storageException) {
                report($storageException);

                Log::warning('Content request file delete failed, continuing DB delete', [
                    'content_request_id' => $contentRequest->id,
                    'file_path' => $contentRequest->file_path,
                    'message' => $storageException->getMessage(),
                ]);
            }

            $contentRequest->delete();

            return redirect()
                ->route('content-requests.index')
                ->with('success', 'Recording deleted successfully.');
        } catch (Throwable $e) {
            report($e);

            return back()->withErrors([
                'contentRequest' => 'Unable to delete this recording right now.',
            ]);
        }
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
    
    public function preview(Request $request, ContentRequest $contentRequest)
    {
        abort_unless($contentRequest->user_id === $request->user()->id, 403);

        if (! $contentRequest->file_path) {
            abort(404);
        }

        try {
            $diskName = config('filesystems.default');
            $disk = Storage::disk($diskName);

            if (! $disk->exists($contentRequest->file_path)) {
                abort(404);
            }

            return $disk->response(
                $contentRequest->file_path,
                $contentRequest->original_file_name ?? basename($contentRequest->file_path),
                [
                    'Content-Type' => $contentRequest->mime_type ?: 'application/octet-stream',
                    'Content-Disposition' => 'inline; filename="' . ($contentRequest->original_file_name ?? basename($contentRequest->file_path)) . '"',
                ]
            );
        } catch (Throwable $e) {
            report($e);
            abort(404);
        }
    }
}
