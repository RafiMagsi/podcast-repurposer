<?php

namespace App\Http\Controllers;

use App\Jobs\TranscribeEpisode;
use App\Models\Episode;
use App\Services\S3DiskFactory;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;
use App\Jobs\GenerateEpisodeContent;
use Illuminate\Support\Facades\Log;


class EpisodeController extends Controller
{
    public function index(Request $request): Response
    {
        $episodes = $request->user()
            ->episodes()
            ->latest()
            ->paginate(10)
            ->through(fn ($episode) => [
                'id' => $episode->id,
                'public_id' => $episode->public_id,
                'title' => $episode->title,
                'status' => $episode->status,
                'tone' => $episode->tone,
                'original_file_name' => $episode->original_file_name,
                'mime_type' => $episode->mime_type,
                'source_type' => $this->detectSourceType($episode->mime_type, $episode->file_path),
                'created_at' => optional($episode->created_at)->toDateTimeString(),
            ]);

        return Inertia::render('Episodes/Index', [
            'episodes' => $episodes,
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Episodes/Create', [
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
                $episode = Episode::create([
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

                GenerateEpisodeContent::dispatch($episode->id);

                return redirect()
                    ->route('episodes.show', $episode)
                    ->with('success', 'Text note saved successfully. Content generation has been queued.');
            }

            $disk = $s3DiskFactory->make();

            $folder = 'episodes/' . now()->format('Y/m');
            $filename = uniqid('episode_', true) . '.' . $file->getClientOriginalExtension();
            $path = $disk->putFileAs($folder, $file, $filename);

            if (! $path) {
                return back()->withErrors([
                    'source_file' => 'Source upload failed. Please check storage settings and try again.',
                ]);
            }

            $episode = Episode::create([
                'user_id' => $request->user()->id,
                'title' => $validated['title'],
                'tone' => $validated['tone'],
                'original_file_name' => $file->getClientOriginalName(),
                'file_path' => $path,
                'mime_type' => $file->getMimeType(),
                'file_size' => $file->getSize(),
                'status' => 'uploaded',
            ]);

            TranscribeEpisode::dispatch($episode->id);

            return redirect()
                ->route('episodes.show', $episode)
                ->with('success', 'Source uploaded successfully. Transcription has been queued.');
        } catch (Throwable $e) {
            report($e);

            return back()->withErrors([
                'source_file' => 'Unable to upload this source right now. Check storage settings and try again.',
            ]);
        }
    }

    public function show(Request $request, Episode $episode): Response
    {
        abort_unless($episode->user_id === $request->user()->id, 403);

        $episode->load('generatedContents');

        return Inertia::render('Episodes/Show', [
            'episode' => [
                'id' => $episode->id,
                'public_id' => $episode->public_id,
                'title' => $episode->title,
                'status' => $episode->status,
                'tone' => $episode->tone,
                'original_file_name' => $episode->original_file_name,
                'mime_type' => $episode->mime_type,
                'source_type' => $this->detectSourceType($episode->mime_type, $episode->file_path),
                'file_size' => $episode->file_size,
                'compressed_file_size' => $episode->compressed_file_size,
                'compression_status' => $episode->compression_status,
                'compression_error' => $episode->compression_error,
                'transcript' => $episode->transcript,
                'summary' => $episode->summary,
                'error_message' => $episode->error_message,
                'created_at' => optional($episode->created_at)->toDateTimeString(),
                'generated_contents' => $episode->generatedContents->map(fn ($content) => [
                    'id' => $content->id,
                    'content_type' => $content->content_type,
                    'title' => $content->title,
                    'body' => $content->body,
                    'meta' => $content->meta,
                ])->values(),
            ],
        ]);
    }
    public function retryTranscription(Request $request, Episode $episode): RedirectResponse
    {
        abort_unless($episode->user_id === $request->user()->id, 403);

        if (! $episode->file_path) {
            return back()->withErrors([
                'episode' => 'This item was created from text, so transcription cannot be retried.',
            ]);
        }

        $episode->update([
            'status' => 'uploaded',
            'error_message' => null,
            'transcript' => null,
            'summary' => null,
        ]);

        $episode->generatedContents()->delete();

        TranscribeEpisode::dispatch($episode->id);

        return back()->with('success', 'Transcription retry started.');
    }

    public function regenerateContent(Request $request, Episode $episode): RedirectResponse
    {
        abort_unless($episode->user_id === $request->user()->id, 403);

        if (! $episode->transcript) {
            return back()->withErrors([
                'episode' => 'Transcript is missing. Retry transcription first.',
            ]);
        }

        $episode->update([
            'status' => 'transcribed',
            'error_message' => null,
            'summary' => null,
        ]);

        $episode->generatedContents()->delete();

        GenerateEpisodeContent::dispatch($episode->id);

        return back()->with('success', 'Content regeneration started.');
    }
    public function destroy(Request $request, Episode $episode): RedirectResponse
    {
        abort_unless($episode->user_id === $request->user()->id, 403);
        

        try {
            Log::info('Deleting episode', [
                'episode_id' => $episode->id,
                'public_id' => $episode->public_id,
                'user_id' => $request->user()->id,
            ]);

            // delete generated contents first
            $episode->generatedContents()->delete();

            // optional: delete audio file from S3
            try {
                if ($episode->file_path) {
                    $disk = app(\App\Services\S3DiskFactory::class)->make();
                    $disk->delete($episode->file_path);

                    Log::info('Episode file deleted from storage', [
                        'episode_id' => $episode->id,
                        'file_path' => $episode->file_path,
                    ]);
                }
            } catch (Throwable $storageException) {
                report($storageException);

                Log::warning('Episode file delete failed, continuing DB delete', [
                    'episode_id' => $episode->id,
                    'file_path' => $episode->file_path,
                    'message' => $storageException->getMessage(),
                ]);
            }

            $episode->delete();

            return redirect()
                ->route('episodes.index')
                ->with('success', 'Recording deleted successfully.');
        } catch (Throwable $e) {
            report($e);

            return back()->withErrors([
                'episode' => 'Unable to delete this recording right now.',
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
