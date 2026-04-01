<?php

namespace App\Http\Controllers;

use App\Models\Episode;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\RedirectResponse;

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
                'created_at' => $episode->created_at?->toDateTimeString(),
            ]);

        return Inertia::render('episodes/index', [
            'episodes' => $episodes,
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('episodes/create', [
            'tones' => [
                ['label' => 'Professional', 'value' => 'professional'],
                ['label' => 'Engaging', 'value' => 'engaging'],
                ['label' => 'Concise', 'value' => 'concise'],
            ],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'tone' => ['required', 'in:professional,engaging,concise'],
            'audio' => ['required', 'file', 'mimetypes:audio/mpeg,audio/wav,audio/x-wav,audio/mp4,audio/x-m4a', 'max:51200'],
        ]);

        $file = $request->file('audio');
        $path = $file->store('episodes', 'local');

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

        return redirect()
            ->route('episodes.show', $episode)
            ->with('success', 'Audio uploaded successfully.');
    }

    public function show(Request $request, Episode $episode): Response
    {
        abort_unless($episode->user_id === $request->user()->id, 403);

        $episode->load('generatedContents');

        return Inertia::render('episodes/show', [
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
                'created_at' => $episode->created_at?->toDateTimeString(),
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