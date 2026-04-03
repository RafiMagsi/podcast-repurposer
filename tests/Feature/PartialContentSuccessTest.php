<?php

use App\Jobs\GenerateContentResponses;
use App\Models\ContentRequest;
use App\Models\User;
use App\Services\OpenAIContentService;

it('marks a run partial when generation fails after transcript success', function () {
    $user = User::factory()->create();
    $contentRequest = ContentRequest::create([
        'user_id' => $user->id,
        'title' => 'Partial generation',
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
        ->andThrow(new RuntimeException('Provider timeout.'));

    try {
        (new GenerateContentResponses($contentRequest->id))->handle($openAI);
    } catch (RuntimeException $e) {
        expect($e->getMessage())->toBe('Provider timeout.');
    }

    $contentRequest->refresh();

    expect($contentRequest->status)->toBe(ContentRequest::STATUS_PARTIAL);
    expect($contentRequest->failure_stage)->toBe('generation');
    expect($contentRequest->error_message)->toBe('Content generation failed: Provider timeout.');
});

it('marks a run partial when some output types are missing', function () {
    $user = User::factory()->create();
    $contentRequest = ContentRequest::create([
        'user_id' => $user->id,
        'title' => 'Missing outputs',
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
        ->andReturn([
            'summary' => 'Summary text.',
            'linkedin_post' => 'LinkedIn text.',
            'x_post' => '',
            'instagram_caption' => '',
            'newsletter' => "Subject: Hello\n\nBody",
        ]);

    (new GenerateContentResponses($contentRequest->id))->handle($openAI);

    $contentRequest->refresh();

    expect($contentRequest->status)->toBe(ContentRequest::STATUS_PARTIAL);
    expect($contentRequest->failure_stage)->toBe('generation');
    expect($contentRequest->error_message)->toContain('x_post');
    expect($contentRequest->error_message)->toContain('instagram_caption');
    expect($contentRequest->contentResponses()->count())->toBe(3);
});
