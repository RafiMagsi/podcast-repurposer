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
            'audio' => ['required', 'file', 'mimetypes:audio/mpeg,audio/wav,audio/x-wav,audio/mp4,audio/x-m4a', 'max:204800'],
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
                'title' => $episode->title,
                'status' => $episode->status,
                'tone' => $episode->tone,
                'original_file_name' => $episode->original_file_name,
                'file_size' => $episode->file_size,
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
}