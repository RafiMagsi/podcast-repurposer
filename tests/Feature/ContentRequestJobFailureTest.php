<?php

use App\Jobs\GenerateContentResponses;
use App\Jobs\TranscribeContentRequest;
use App\Models\ContentRequest;
use App\Models\User;
use App\Services\OpenAIContentService;
use App\Services\WhisperService;

it('marks the content request failed when transcription provider work throws', function () {
    $user = User::factory()->create();
    $contentRequest = ContentRequest::create([
        'user_id' => $user->id,
        'title' => 'Provider failure',
        'tone' => 'professional',
        'input_type' => 'audio',
        'media_kind' => 'audio',
        'original_file_name' => 'clip.mp3',
        'file_path' => 'content-requests/test.mp3',
        'mime_type' => 'audio/mpeg',
        'file_size' => 1024,
        'status' => ContentRequest::STATUS_UPLOADED,
    ]);

    $whisper = Mockery::mock(WhisperService::class);
    $whisper->shouldReceive('transcribe')
        ->once()
        ->withArgs(fn ($request) => $request->is($contentRequest))
        ->andThrow(new RuntimeException('Transcription provider failed.'));

    try {
        (new TranscribeContentRequest($contentRequest->id))->handle($whisper);
    } catch (RuntimeException $e) {
        expect($e->getMessage())->toBe('Transcription provider failed.');
    }

    $contentRequest->refresh();

    expect($contentRequest->status)->toBe(ContentRequest::STATUS_FAILED);
    expect($contentRequest->error_message)->toBe('Transcription provider failed.');
});

it('marks the content request failed when output generation throws', function () {
    $user = User::factory()->create();
    $contentRequest = ContentRequest::create([
        'user_id' => $user->id,
        'title' => 'Generation failure',
        'tone' => 'professional',
        'input_type' => 'audio',
        'media_kind' => 'audio',
        'original_file_name' => 'clip.mp3',
        'file_path' => 'content-requests/test.mp3',
        'mime_type' => 'audio/mpeg',
        'file_size' => 1024,
        'transcript' => 'Ready transcript',
        'status' => ContentRequest::STATUS_TRANSCRIBED,
    ]);

    $openAI = Mockery::mock(OpenAIContentService::class);
    $openAI->shouldReceive('generate')
        ->once()
        ->with('Ready transcript', 'professional')
        ->andThrow(new RuntimeException('Content generation failed.'));

    try {
        (new GenerateContentResponses($contentRequest->id))->handle($openAI);
    } catch (RuntimeException $e) {
        expect($e->getMessage())->toBe('Content generation failed.');
    }

    $contentRequest->refresh();

    expect($contentRequest->status)->toBe(ContentRequest::STATUS_FAILED);
    expect($contentRequest->error_message)->toBe('Content generation failed.');
});
