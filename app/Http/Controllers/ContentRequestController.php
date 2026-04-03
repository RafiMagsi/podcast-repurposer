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
        $isTextSource = $request->input('source_type') === 'text' || ($sourceText !== '' && ! $file);

        try {
            if ($isTextSource) {
                $contentRequest = ContentRequest::create([
                    'user_id' => $request->user()->id,
                    'title' => $validated['title'],
                    'tone' => $validated['tone'],
                    'original_file_name' => null,
                    'file_path' => '',
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

            $contentRequest = ContentRequest::create([
                'user_id' => $request->user()->id,
                'title' => $validated['title'],
                'tone' => $validated['tone'],
                'original_file_name' => $file->getClientOriginalName(),
                'file_path' => $path,
                'mime_type' => $file->getMimeType(),
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

    public function show(Request $request, ContentRequest $contentRequest): Response
    {
        abort_unless($contentRequest->user_id === $request->user()->id, 403);

        $contentRequest->load('contentResponses');

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
}
