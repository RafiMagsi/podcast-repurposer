<?php

namespace App\Http\Controllers;

use App\Jobs\GenerateContentResponses;
use App\Jobs\TranscribeContentRequest;
use App\Models\ContentRequest;
use App\Models\ContentRequestChatMessage;
use App\Services\ContentSuggestionService;
use App\Services\OpenAIContentService;
use App\Services\OperationalAnalyticsService;
use App\Services\S3DiskFactory;
use App\Services\UsageLimitService;
use App\Services\WhisperService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\URL;
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
                'source_type' => $contentRequest->input_type ?? $this->detectSourceType($contentRequest->mime_type, $contentRequest->file_path),
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
            'uploadLimits' => $this->uploadLimits(),
        ]);
    }

    public function suggestions(Request $request, ContentSuggestionService $contentSuggestionService): JsonResponse
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'tone' => ['required', 'in:professional,engaging,concise'],
            'source_type' => ['required', 'in:text,audio,video'],
            'source_text' => ['nullable', 'string', 'max:200'],
        ]);

        $suggestions = $contentSuggestionService->generate(
            $validated['title'],
            $validated['tone'],
            $validated['source_type'],
            $validated['source_text'] ?? null,
        );

        return response()->json([
            'suggestions' => $suggestions,
        ]);
    }

    public function store(
        Request $request,
        S3DiskFactory $s3DiskFactory,
        WhisperService $whisperService,
        UsageLimitService $usageLimitService,
        OperationalAnalyticsService $analytics
    ): RedirectResponse
    {
        $userId = $request->user()->id;
        $uploadLimits = $this->uploadLimits();
        $usageSummary = $usageLimitService->summaryForUser($request->user());

        if ($usageSummary['reached']) {
            return back()->withErrors([
                'source_file' => sprintf(
                    'You have reached your %d-run limit on the $%s plan. Upgrade or wait before starting a new run.',
                    $usageSummary['limit'],
                    rtrim(rtrim(number_format((float) $usageSummary['plan_price_usd'], 2, '.', ''), '0'), '.')
                ),
            ])->withInput();
        }

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'tone' => ['required', 'in:professional,engaging,concise'],
            'source_type' => ['nullable', 'in:text,audio,video'],
            'source_text' => [
                'nullable',
                'string',
                'max:200',
                Rule::requiredIf(fn () => $request->input('source_type') === 'text' && ! $request->hasFile('source_file') && ! $request->hasFile('audio')),
            ],
            'source_file' => [
                'nullable',
                'file',
                'mimes:mp3,wav,m4a,mp4,mov,webm',
                'mimetypes:audio/mpeg,audio/wav,audio/x-wav,audio/mp4,audio/x-m4a,audio/webm,video/mp4,video/quicktime,video/webm',
                Rule::requiredIf(fn () => $request->input('source_type') !== 'text' && ! $request->hasFile('audio')),
            ],
            'audio' => [
                'nullable',
                'file',
                'mimetypes:audio/mpeg,audio/wav,audio/x-wav,audio/mp4,audio/x-m4a,audio/webm',
            ],
            'selected_suggestion' => ['nullable', 'string', 'max:255'],
        ]);

        $file = $request->file('source_file') ?? $request->file('audio');

        Log::info('Uploaded source debug', [
            'original_name' => $file?->getClientOriginalName(),
            'extension' => $file?->getClientOriginalExtension(),
            'mime_type' => $file?->getMimeType(),
            'size' => $file?->getSize(),
        ]);

        $sourceType = $validated['source_type'] ?? null;
        $sourceText = trim((string) ($validated['source_text'] ?? ''));
        $requestedSourceType = $sourceType;

        if (! $sourceType) {
            if ($request->hasFile('audio')) {
                $sourceType = 'audio';
            } elseif ($request->hasFile('source_file')) {
                $uploadedMime = (string) ($file?->getMimeType() ?? '');
                $sourceType = str_starts_with($uploadedMime, 'video/') ? 'video' : 'audio';
            } elseif ($sourceText !== '') {
                $sourceType = 'text';
            }
        }

        $isTextSource = $sourceType === 'text' || ($sourceText !== '' && ! $file);

        if (! $isTextSource && $file) {
            $sizeValidationMessage = $this->validateUploadedMediaFileSize(
                $file,
                $sourceType,
                $requestedSourceType,
                $uploadLimits
            );

            if ($sizeValidationMessage) {
                return back()->withErrors([
                    'source_file' => $sizeValidationMessage,
                ])->withInput();
            }

            $durationValidationMessage = $this->validateUploadedMediaDuration(
                $file->getRealPath(),
                $sourceType,
                $requestedSourceType,
                $whisperService
            );

            if ($durationValidationMessage) {
                return back()->withErrors([
                    'source_file' => $durationValidationMessage,
                ])->withInput();
            }
        }

        if ($request->hasSession()) {
            $request->session()->save();
        }

        try {
            if ($isTextSource) {
                $contentRequest = ContentRequest::create([
                    'user_id' => $userId,
                    'title' => $validated['title'],
                    'tone' => $validated['tone'],
                    'input_type' => 'text',
                    'media_kind' => null,
                    'source_text' => $sourceText,
                    'selected_suggestion' => $validated['selected_suggestion'] ?? null,
                    'original_file_name' => null,
                    'file_path' => '',
                    'mime_type' => 'text/plain',
                    'file_size' => mb_strlen($sourceText),
                    'status' => 'transcribed',
                    'transcript' => $sourceText,
                ]);

                GenerateContentResponses::dispatch($contentRequest->id);
                $analytics->record('run_created', [
                    'user_id' => $userId,
                    'content_request_id' => $contentRequest->id,
                    'source_type' => 'text',
                    'status' => $contentRequest->status,
                ]);

                return redirect()
                    ->route('content-requests.show', $contentRequest);
            }

            $disk = $s3DiskFactory->make();

            $folder = 'content-requests/' . now()->format('Y/m');
            $filename = uniqid('content_request_', true) . '.' . $file->getClientOriginalExtension();
            $path = $folder . '/' . $filename;

            $stream = fopen($file->getRealPath(), 'r');

            if (! $stream) {
                throw new \RuntimeException('Unable to open uploaded file stream.');
            }

            try {
                $uploaded = $disk->put($path, $stream);
            } finally {
                if (is_resource($stream)) {
                    fclose($stream);
                }
            }

            if (! $uploaded) {
                return back()->withErrors([
                    'source_file' => 'Source upload failed. Please check storage settings and try again.',
                ])->withInput();
            }

            $mimeType = (string) $file->getMimeType();
            $mediaKind = $sourceType === 'video'
                ? 'video'
                : ($sourceType === 'audio' ? 'audio' : (str_starts_with($mimeType, 'video/') ? 'video' : 'audio'));

            $contentRequest = ContentRequest::create([
                'user_id' => $userId,
                'title' => $validated['title'],
                'tone' => $validated['tone'],
                'input_type' => $sourceType,
                'media_kind' => $mediaKind,
                'source_text' => null,
                'selected_suggestion' => $validated['selected_suggestion'] ?? null,
                'original_file_name' => $file->getClientOriginalName(),
                'file_path' => $path,
                'mime_type' => $mimeType,
                'file_size' => $file->getSize(),
                'status' => $mediaKind === 'video' ? ContentRequest::STATUS_TRANSCRIBING : ContentRequest::STATUS_UPLOADED,
                'compression_status' => $mediaKind === 'video' ? 'started' : null,
            ]);

            $analytics->record('run_created', [
                'user_id' => $userId,
                'content_request_id' => $contentRequest->id,
                'source_type' => $sourceType,
                'status' => $contentRequest->status,
            ]);

            TranscribeContentRequest::dispatch($contentRequest->id);

            return redirect()
                ->route('content-requests.show', $contentRequest);
        } catch (Throwable $e) {
            report($e);

            \Log::error('ContentRequest upload failed', [
                'message' => $e->getMessage(),
                'source_type' => $sourceType ?? null,
                'file_name' => $file?->getClientOriginalName(),
                'mime_type' => $file?->getMimeType(),
                'size' => $file?->getSize(),
            ]);

            return back()->withErrors([
                'source_file' => 'Unable to upload this source right now. Check storage settings and try again.',
            ])->withInput();
        }
    }

    public function show(Request $request, ContentRequest $contentRequest, S3DiskFactory $s3DiskFactory): Response
    {
        abort_unless($contentRequest->user_id === $request->user()->id, 403);

        $contentRequest->load(['contentResponses', 'chatMessages']);

        return Inertia::render('ContentRequests/Show', [
            'contentRequest' => $this->serializeContentRequest($contentRequest, $s3DiskFactory),
        ]);
    }

    public function status(Request $request, ContentRequest $contentRequest, S3DiskFactory $s3DiskFactory): JsonResponse
    {
        abort_unless($contentRequest->user_id === $request->user()->id, 403);

        $contentRequest->load(['contentResponses', 'chatMessages']);

        return response()->json([
            'contentRequest' => $this->serializeContentRequest($contentRequest, $s3DiskFactory),
        ]);
    }

    public function magicChat(
        Request $request,
        ContentRequest $contentRequest,
        OpenAIContentService $openAIContentService,
        S3DiskFactory $s3DiskFactory
    ): JsonResponse {
        abort_unless($contentRequest->user_id === $request->user()->id, 403);

        $validated = $request->validate([
            'message' => ['required', 'string', 'max:2000'],
        ]);

        $contentRequest->load(['contentResponses', 'chatMessages']);

        if (
            blank($contentRequest->transcript)
            && blank($contentRequest->summary)
            && $contentRequest->contentResponses->isEmpty()
        ) {
            return response()->json([
                'message' => 'Magic Chat becomes available after the transcript or outputs are ready.',
            ], 422);
        }

        $userMessage = $contentRequest->chatMessages()->create([
            'role' => 'user',
            'body' => trim($validated['message']),
        ]);

        $contentRequest->load('chatMessages');

        try {
            $assistantReply = $openAIContentService->generateChatReply(
                $contentRequest,
                $userMessage->body,
                $contentRequest->chatMessages
                    ->sortBy('id')
                    ->take(-8)
                    ->map(fn (ContentRequestChatMessage $message) => [
                        'role' => $message->role,
                        'body' => $message->body,
                    ])
                    ->values()
                    ->all(),
            );

            $contentRequest->chatMessages()->create([
                'role' => 'assistant',
                'body' => $assistantReply,
            ]);
        } catch (Throwable $e) {
            report($e);

            return response()->json([
                'message' => 'Magic Chat is unavailable right now. Please try again.',
            ], 422);
        }

        $contentRequest->load(['contentResponses', 'chatMessages']);

        return response()->json([
            'contentRequest' => $this->serializeContentRequest($contentRequest, $s3DiskFactory),
        ]);
    }

    public function retryTranscription(Request $request, ContentRequest $contentRequest, OperationalAnalyticsService $analytics): RedirectResponse
    {
        abort_unless($contentRequest->user_id === $request->user()->id, 403);

        if (in_array($contentRequest->status, ContentRequest::processingStatuses(), true)) {
            return back()->withErrors([
                'contentRequest' => 'This recording is already processing. Cancel it first or wait for it to finish.',
            ]);
        }

        if (! $contentRequest->file_path) {
            return back()->withErrors([
                'contentRequest' => 'This item was created from text, so transcription cannot be retried.',
            ]);
        }

        $contentRequest->update([
            'status' => ContentRequest::STATUS_UPLOADED,
            'error_message' => null,
            'failure_stage' => null,
            'transcript' => null,
            'summary' => null,
            'compression_status' => null,
            'compression_error' => null,
        ]);

        $contentRequest->contentResponses()->delete();
        $analytics->record('retry_transcription', [
            'user_id' => $request->user()->id,
            'content_request_id' => $contentRequest->id,
            'source_type' => $contentRequest->input_type,
            'status' => $contentRequest->status,
        ]);

        TranscribeContentRequest::dispatch($contentRequest->id);

        return back()->with('success', 'Transcription retry started.');
    }

    public function regenerateContent(Request $request, ContentRequest $contentRequest, OperationalAnalyticsService $analytics): RedirectResponse
    {
        abort_unless($contentRequest->user_id === $request->user()->id, 403);

        if (in_array($contentRequest->status, ContentRequest::processingStatuses(), true)) {
            return back()->withErrors([
                'contentRequest' => 'This recording is already processing. Cancel it first or wait for it to finish.',
            ]);
        }

        if (! $contentRequest->transcript) {
            return back()->withErrors([
                'contentRequest' => 'Transcript is missing. Retry transcription first.',
            ]);
        }

        $contentRequest->update([
            'status' => ContentRequest::STATUS_TRANSCRIBED,
            'error_message' => null,
            'failure_stage' => null,
            'summary' => null,
        ]);

        $contentRequest->contentResponses()->delete();
        $analytics->record('regenerate_content', [
            'user_id' => $request->user()->id,
            'content_request_id' => $contentRequest->id,
            'source_type' => $contentRequest->input_type,
            'status' => $contentRequest->status,
        ]);

        GenerateContentResponses::dispatch($contentRequest->id);

        return back()->with('success', 'Content regeneration started.');
    }

    public function regenerateOutput(
        Request $request,
        ContentRequest $contentRequest,
        string $contentType,
        OperationalAnalyticsService $analytics
    ): RedirectResponse {
        abort_unless($contentRequest->user_id === $request->user()->id, 403);

        if (! in_array($contentType, ContentRequest::EXPECTED_OUTPUT_TYPES, true)) {
            abort(404);
        }

        if (in_array($contentRequest->status, ContentRequest::processingStatuses(), true)) {
            return back()->withErrors([
                'contentRequest' => 'This recording is already processing. Wait for it to finish before regenerating a single output.',
            ]);
        }

        if (! $contentRequest->transcript) {
            return back()->withErrors([
                'contentRequest' => 'Transcript is missing. Retry transcription first.',
            ]);
        }

        $existingResponse = $contentRequest->contentResponses()
            ->where('content_type', $contentType)
            ->first();

        if (! $existingResponse) {
            return back()->withErrors([
                'contentRequest' => 'Only existing content cards can be regenerated one at a time.',
            ]);
        }

        $existingResponse->update([
            'meta' => array_merge($existingResponse->meta ?? [], [
                'is_regenerating' => true,
            ]),
        ]);

        $analytics->record('regenerate_content', [
            'user_id' => $request->user()->id,
            'content_request_id' => $contentRequest->id,
            'source_type' => $contentRequest->input_type,
            'content_type' => $contentType,
            'status' => $contentRequest->status,
            'meta' => ['scope' => 'single_output'],
        ]);

        GenerateContentResponses::dispatch($contentRequest->id, $contentType);

        return back()->with('success', ContentRequest::OUTPUT_TITLES[$contentType] . ' regeneration started.');
    }

    public function cancelProcessing(Request $request, ContentRequest $contentRequest): RedirectResponse
    {
        abort_unless($contentRequest->user_id === $request->user()->id, 403);

        if (! in_array($contentRequest->status, ContentRequest::processingStatuses(), true)) {
            return back()->withErrors([
                'contentRequest' => 'Only active processing can be cancelled.',
            ]);
        }

        $updates = [
            'status' => ContentRequest::STATUS_CANCELLED,
            'error_message' => 'Processing was cancelled.',
        ];

        if (in_array($contentRequest->compression_status, [null, 'started'], true)) {
            $updates['compression_status'] = 'cancelled';
            $updates['compression_error'] = null;
        }

        $contentRequest->update($updates);

        return back()->with('success', 'Processing cancelled.');
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
                $disk = app(\App\Services\S3DiskFactory::class)->make();

                if ($contentRequest->file_path) {
                    $this->deleteOwnedMediaPath(
                        $disk,
                        $contentRequest->file_path,
                        ['content-requests/'],
                        'source file',
                        $contentRequest
                    );
                }

                if ($contentRequest->preview_path) {
                    $this->deleteOwnedMediaPath(
                        $disk,
                        $contentRequest->preview_path,
                        ['content-request-previews/'],
                        'preview',
                        $contentRequest
                    );
                }

                if ($contentRequest->thumbnail_path) {
                    $this->deleteOwnedMediaPath(
                        $disk,
                        $contentRequest->thumbnail_path,
                        ['content-request-thumbnails/'],
                        'thumbnail',
                        $contentRequest
                    );
                }
            } catch (Throwable $storageException) {
                report($storageException);

                Log::warning('Content request file delete failed, continuing DB delete', [
                    'content_request_id' => $contentRequest->id,
                    'file_path' => $contentRequest->file_path,
                    'preview_path' => $contentRequest->preview_path,
                    'thumbnail_path' => $contentRequest->thumbnail_path,
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

        return 'audio';
    }

    private function serializeContentRequest(ContentRequest $contentRequest, S3DiskFactory $s3DiskFactory): array
    {
        $mediaUrl = $this->sanitizeMediaUrl($this->temporaryPreviewUrl($contentRequest, $s3DiskFactory));
        $mediaUrlSource = 'temporary_url';

        if (! $mediaUrl) {
            $mediaUrl = $this->sanitizeMediaUrl($this->signedPreviewUrl($contentRequest));
            $mediaUrlSource = 'signed_route';
        }

        $thumbnailUrl = $this->sanitizeMediaUrl($this->temporaryThumbnailUrl($contentRequest, $s3DiskFactory));
        $thumbnailUrlSource = 'temporary_url';

        if (! $thumbnailUrl) {
            $thumbnailUrl = $this->sanitizeMediaUrl($this->signedThumbnailUrl($contentRequest));
            $thumbnailUrlSource = 'signed_route';
        }

        // Log::debug('Content request preview delivery resolved', [
        //     'content_request_id' => $contentRequest->id,
        //     'public_id' => $contentRequest->public_id,
        //     'media_kind' => $contentRequest->media_kind,
        //     'media_url_source' => $mediaUrlSource,
        //     'thumbnail_url_source' => $thumbnailUrlSource,
        //     'has_media_url' => filled($mediaUrl),
        //     'has_thumbnail_url' => filled($thumbnailUrl),
        // ]);

        return [
            'id' => $contentRequest->id,
            'public_id' => $contentRequest->public_id,
            'title' => $contentRequest->title,
            'status' => $contentRequest->status,
            'tone' => $contentRequest->tone,
            'original_file_name' => $contentRequest->original_file_name,
            'mime_type' => $contentRequest->mime_type,
            'source_type' => $contentRequest->input_type ?? $this->detectSourceType($contentRequest->mime_type, $contentRequest->file_path),
            'file_size' => $contentRequest->file_size,
            'compressed_file_size' => $contentRequest->compressed_file_size,
            'compression_status' => $contentRequest->compression_status,
            'compression_error' => $contentRequest->compression_error,
            'transcript' => $contentRequest->transcript,
            'summary' => $contentRequest->summary,
            'error_message' => $contentRequest->error_message,
            'failure_stage' => $contentRequest->failure_stage,
            'expected_output_count' => count(ContentRequest::EXPECTED_OUTPUT_TYPES),
            'created_at' => optional($contentRequest->created_at)->toDateTimeString(),
            'input_type' => $contentRequest->input_type,
            'media_kind' => $contentRequest->media_kind,
            'source_text' => $contentRequest->source_text,
            'preview_path' => $contentRequest->preview_path,
            'media_url' => $mediaUrl,
            'media_thumbnail_url' => $thumbnailUrl,
            'content_responses' => $contentRequest->contentResponses->map(fn ($contentResponse) => [
                'id' => $contentResponse->id,
                'content_type' => $contentResponse->content_type,
                'title' => $contentResponse->title,
                'body' => $contentResponse->body,
                'meta' => $contentResponse->meta,
            ])->values(),
            'chat_messages' => $contentRequest->chatMessages
                ->sortBy('id')
                ->map(fn ($message) => [
                    'id' => $message->id,
                    'role' => $message->role,
                    'body' => $message->body,
                    'created_at' => optional($message->created_at)->toDateTimeString(),
                ])
                ->values(),
        ];
    }

    private function uploadLimits(): array
    {
        $phpLimitBytes = $this->phpUploadLimitBytes();
        $videoLimitBytes = 300 * 1024 * 1024;
        $audioLimitBytes = 25 * 1024 * 1024;

        if ($phpLimitBytes !== null) {
            $safePhpLimitBytes = max(1024, $phpLimitBytes - (1024 * 1024));

            $videoLimitBytes = min($videoLimitBytes, $safePhpLimitBytes);
            $audioLimitBytes = min($audioLimitBytes, $safePhpLimitBytes);
        }

        return [
            'video' => [
                'bytes' => $videoLimitBytes,
                'label' => $this->formatBytes($videoLimitBytes),
            ],
            'audio' => [
                'bytes' => $audioLimitBytes,
                'label' => $this->formatBytes($audioLimitBytes),
            ],
        ];
    }

    private function phpUploadLimitBytes(): ?int
    {
        $limits = array_filter([
            $this->iniSizeToBytes(ini_get('post_max_size')),
            $this->iniSizeToBytes(ini_get('upload_max_filesize')),
        ], fn (?int $value) => $value !== null && $value > 0);

        if ($limits === []) {
            return null;
        }

        return min($limits);
    }

    private function iniSizeToBytes(string|false $size): ?int
    {
        if (! is_string($size) || trim($size) === '') {
            return null;
        }

        $normalized = trim($size);
        $unit = strtolower(substr($normalized, -1));
        $value = (float) $normalized;

        return match ($unit) {
            'g' => (int) round($value * 1024 * 1024 * 1024),
            'm' => (int) round($value * 1024 * 1024),
            'k' => (int) round($value * 1024),
            default => (int) round($value),
        };
    }

    private function formatBytes(int $bytes): string
    {
        if ($bytes >= 1024 * 1024) {
            $megabytes = $bytes / (1024 * 1024);
            $formatted = fmod($megabytes, 1.0) === 0.0
                ? number_format($megabytes, 0)
                : number_format($megabytes, 1);

            return sprintf('%s MB', $formatted);
        }

        if ($bytes >= 1024) {
            return sprintf('%s KB', number_format($bytes / 1024, 0));
        }

        return sprintf('%d bytes', $bytes);
    }

    private function validateUploadedMediaFileSize($file, ?string $sourceType, ?string $requestedSourceType, array $uploadLimits): ?string
    {
        $isVideo = $sourceType === 'video';
        $maxBytes = $isVideo ? $uploadLimits['video']['bytes'] : $uploadLimits['audio']['bytes'];

        if (($file?->getSize() ?? 0) <= $maxBytes) {
            return null;
        }

        if ($isVideo) {
            return sprintf('Video uploads must be %s or less.', $uploadLimits['video']['label']);
        }

        return sprintf('Audio uploads must be %s or less.', $uploadLimits['audio']['label']);
    }

    private function validateUploadedMediaDuration(
        string|false $realPath,
        ?string $sourceType,
        ?string $requestedSourceType,
        WhisperService $whisperService
    ): ?string {
        if (! is_string($realPath) || $realPath === '') {
            return 'Unable to inspect this media file. Choose a valid file and try again.';
        }

        try {
            $whisperService->assertMediaWithinDurationLimit($realPath, 60);

            return null;
        } catch (Throwable $e) {
            if ($e->getMessage() === 'Media must be 1 minute or less.') {
                if ($sourceType === 'video') {
                    return 'Video uploads must be 1 minute or less.';
                }

                return 'Audio uploads must be 1 minute or less.';
            }

            return $sourceType === 'video'
                ? 'Unable to read video duration. Upload a valid video that is 1 minute or less.'
                : 'Unable to read audio duration. Upload a valid audio file or recording that is 1 minute or less.';
        }
    }
    
    public function preview(Request $request, ContentRequest $contentRequest, S3DiskFactory $s3DiskFactory)
    {
        abort_unless($contentRequest->user_id === $request->user()->id, 403);

        return $this->streamPreviewResponse($contentRequest, $s3DiskFactory);
    }

    public function thumbnail(Request $request, ContentRequest $contentRequest, S3DiskFactory $s3DiskFactory)
    {
        abort_unless($contentRequest->user_id === $request->user()->id, 403);

        return $this->streamThumbnailResponse($contentRequest, $s3DiskFactory);
    }

    public function signedPreview(ContentRequest $contentRequest, S3DiskFactory $s3DiskFactory)
    {
        return $this->streamPreviewResponse($contentRequest, $s3DiskFactory);
    }

    public function signedThumbnail(ContentRequest $contentRequest, S3DiskFactory $s3DiskFactory)
    {
        return $this->streamThumbnailResponse($contentRequest, $s3DiskFactory);
    }

    private function streamPreviewResponse(ContentRequest $contentRequest, S3DiskFactory $s3DiskFactory)
    {
        $path = $contentRequest->preview_path ?: $contentRequest->file_path;

        if (! $path) {
            abort(404);
        }

        try {
            $disk = $s3DiskFactory->make();

            if (! $disk->exists($path)) {
                abort(404);
            }

            $contentType = $contentRequest->preview_path ? 'video/mp4' : ($contentRequest->mime_type ?: 'application/octet-stream');
            $filename = $contentRequest->preview_path
                ? pathinfo((string) $contentRequest->original_file_name, PATHINFO_FILENAME) . '-preview.mp4'
                : ($contentRequest->original_file_name ?? basename($path));

            return $disk->response(
                $path,
                $filename,
                [
                    'Content-Type' => $contentType,
                    'Content-Disposition' => 'inline; filename="' . $filename . '"',
                ]
            );
        } catch (Throwable $e) {
            report($e);
            abort(404);
        }
    }

    private function streamThumbnailResponse(ContentRequest $contentRequest, S3DiskFactory $s3DiskFactory)
    {
        if (! $contentRequest->thumbnail_path) {
            abort(404);
        }

        try {
            $disk = $s3DiskFactory->make();

            if (! $disk->exists($contentRequest->thumbnail_path)) {
                abort(404);
            }

            return $disk->response(
                $contentRequest->thumbnail_path,
                basename($contentRequest->thumbnail_path),
                [
                    'Content-Type' => 'image/jpeg',
                    'Content-Disposition' => 'inline; filename="' . basename($contentRequest->thumbnail_path) . '"',
                ]
            );
        } catch (Throwable $e) {
            report($e);
            abort(404);
        }
    }

    private function signedPreviewUrl(ContentRequest $contentRequest): ?string
    {
        if (! $contentRequest->file_path) {
            return null;
        }

        return URL::signedRoute('content-requests.preview.signed', [
            'contentRequest' => $contentRequest,
        ]);
    }

    private function signedThumbnailUrl(ContentRequest $contentRequest): ?string
    {
        if (! $contentRequest->thumbnail_path) {
            return null;
        }

        return URL::signedRoute('content-requests.thumbnail.signed', [
            'contentRequest' => $contentRequest,
        ]);
    }

    private function temporaryPreviewUrl(ContentRequest $contentRequest, S3DiskFactory $s3DiskFactory): ?string
    {
        $path = $contentRequest->preview_path ?: $contentRequest->file_path;

        if (! $path) {
            return null;
        }

        try {
            $disk = $s3DiskFactory->make();

            $contentType = $contentRequest->preview_path ? 'video/mp4' : ($contentRequest->mime_type ?: 'application/octet-stream');
            $filename = $contentRequest->preview_path
                ? pathinfo((string) $contentRequest->original_file_name, PATHINFO_FILENAME) . '-preview.mp4'
                : ($contentRequest->original_file_name ?? basename($path));

            return $disk->temporaryUrl($path, now()->addMinutes(20), [
                'ResponseContentType' => $contentType,
                'ResponseContentDisposition' => 'inline; filename="' . $filename . '"',
            ]);
        } catch (Throwable $e) {
            Log::warning('Unable to create temporary preview URL, using signed route fallback', [
                'content_request_id' => $contentRequest->id,
                'public_id' => $contentRequest->public_id,
                'preview_path' => $contentRequest->preview_path,
                'file_path' => $contentRequest->file_path,
                'message' => $e->getMessage(),
            ]);

            return null;
        }
    }

    private function temporaryThumbnailUrl(ContentRequest $contentRequest, S3DiskFactory $s3DiskFactory): ?string
    {
        if (! $contentRequest->thumbnail_path) {
            return null;
        }

        try {
            $disk = $s3DiskFactory->make();

            return $disk->temporaryUrl($contentRequest->thumbnail_path, now()->addMinutes(20), [
                'ResponseContentType' => 'image/jpeg',
                'ResponseContentDisposition' => 'inline; filename="' . basename($contentRequest->thumbnail_path) . '"',
            ]);
        } catch (Throwable $e) {
            Log::warning('Unable to create temporary thumbnail URL, using signed route fallback', [
                'content_request_id' => $contentRequest->id,
                'public_id' => $contentRequest->public_id,
                'message' => $e->getMessage(),
            ]);

            return null;
        }
    }

    private function sanitizeMediaUrl(?string $url): ?string
    {
        if (! is_string($url) || trim($url) === '') {
            return null;
        }

        $parsed = parse_url($url);
        $scheme = strtolower((string) ($parsed['scheme'] ?? ''));

        if (! in_array($scheme, ['http', 'https'], true)) {
            return null;
        }

        if (empty($parsed['host'])) {
            return null;
        }

        return $url;
    }

    private function deleteOwnedMediaPath($disk, string $path, array $allowedPrefixes, string $label, ContentRequest $contentRequest): void
    {
        foreach ($allowedPrefixes as $prefix) {
            if (str_starts_with($path, $prefix)) {
                $disk->delete($path);

                Log::info(sprintf('Content request %s deleted from storage', $label), [
                    'content_request_id' => $contentRequest->id,
                    'path' => $path,
                ]);

                return;
            }
        }

        Log::warning('Skipped deleting unexpected media path', [
            'content_request_id' => $contentRequest->id,
            'label' => $label,
            'path' => $path,
        ]);
    }
}
