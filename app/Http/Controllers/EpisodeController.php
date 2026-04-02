<?php

namespace App\Http\Controllers;

use App\Jobs\TranscribeEpisode;
use App\Models\Episode;
use App\Services\S3DiskFactory;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
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
            'audio' => ['required', 'file', 'mimetypes:audio/mpeg,audio/wav,audio/x-wav,audio/mp4,audio/x-m4a', 'max:5120'],
        ]);

        $file = $request->file('audio');

        try {
            $disk = $s3DiskFactory->make();

            $folder = 'episodes/' . now()->format('Y/m');
            $filename = uniqid('episode_', true) . '.' . $file->getClientOriginalExtension();
            $path = $disk->putFileAs($folder, $file, $filename);

            if (! $path) {
                return back()->withErrors([
                    'audio' => 'Audio upload failed. Please check S3 settings and try again.',
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
                ->with('success', 'Audio uploaded successfully. Transcription has been queued.');
        } catch (Throwable $e) {
            report($e);

            return back()->withErrors([
                'audio' => 'Unable to upload file right now. Check storage settings and try again.',
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
                ->with('success', 'Episode deleted successfully.');
        } catch (Throwable $e) {
            report($e);

            return back()->withErrors([
                'episode' => 'Unable to delete episode right now.',
            ]);
        }
    }
}