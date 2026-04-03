<?php

use App\Jobs\GenerateContentResponses;
use App\Jobs\TranscribeContentRequest;
use App\Models\ContentRequest;
use App\Models\ContentResponse;
use App\Models\User;
use App\Services\ContentSuggestionService;
use App\Services\OpenAIContentService;
use Illuminate\Support\Facades\Queue;

it('creates a text content request and queues content generation', function () {
    $user = User::factory()->create();
    Queue::fake();

    $response = $this->actingAs($user)->post(route('content-requests.store'), [
        'title' => 'One-line idea',
        'tone' => 'professional',
        'source_type' => 'text',
        'source_text' => 'Turn this short idea into reusable content.',
    ]);

    $response->assertRedirect();

    $contentRequest = ContentRequest::query()->latest('id')->first();

    expect($contentRequest)->not->toBeNull();
    expect($contentRequest->input_type)->toBe('text');
    expect($contentRequest->status)->toBe(ContentRequest::STATUS_TRANSCRIBED);
    expect($contentRequest->transcript)->toBe('Turn this short idea into reusable content.');

    Queue::assertPushed(GenerateContentResponses::class, function ($job) use ($contentRequest) {
        return $job->contentRequestId === $contentRequest->id;
    });
});

it('returns 3 suggestions for the entered source', function () {
    $user = User::factory()->create();

    $service = Mockery::mock(ContentSuggestionService::class);
    $service->shouldReceive('generate')
        ->once()
        ->with('One-line idea', 'professional', 'text', 'Turn this short idea into reusable content.')
        ->andReturn([
            'Lead with the sharpest lesson from the idea.',
            'Frame the idea as a practical post with one takeaway.',
            'Turn the idea into a concise opinion-led content angle.',
        ]);

    app()->instance(ContentSuggestionService::class, $service);

    $response = $this->actingAs($user)->postJson(route('content-requests.suggestions'), [
        'title' => 'One-line idea',
        'tone' => 'professional',
        'source_type' => 'text',
        'source_text' => 'Turn this short idea into reusable content.',
    ]);

    $response->assertOk()->assertJson([
        'suggestions' => [
            'Lead with the sharpest lesson from the idea.',
            'Frame the idea as a practical post with one takeaway.',
            'Turn the idea into a concise opinion-led content angle.',
        ],
    ]);
});

it('stores the selected suggestion when creating a text content request', function () {
    $user = User::factory()->create();
    Queue::fake();

    $response = $this->actingAs($user)->post(route('content-requests.store'), [
        'title' => 'One-line idea',
        'tone' => 'professional',
        'source_type' => 'text',
        'source_text' => 'Turn this short idea into reusable content.',
        'selected_suggestion' => 'Lead with the strongest lesson and turn it into a practical post.',
    ]);

    $response->assertRedirect();

    $contentRequest = ContentRequest::query()->latest('id')->first();

    expect($contentRequest)->not->toBeNull();
    expect($contentRequest->selected_suggestion)->toBe('Lead with the strongest lesson and turn it into a practical post.');
});

it('retries transcription by clearing transcript state and queueing a new transcription job', function () {
    $user = User::factory()->create();
    Queue::fake();

    $contentRequest = ContentRequest::create([
        'user_id' => $user->id,
        'title' => 'Retry me',
        'tone' => 'professional',
        'input_type' => 'audio',
        'media_kind' => 'audio',
        'original_file_name' => 'clip.mp3',
        'file_path' => 'content-requests/test.mp3',
        'mime_type' => 'audio/mpeg',
        'file_size' => 1024,
        'transcript' => 'Old transcript',
        'summary' => 'Old summary',
        'status' => ContentRequest::STATUS_FAILED,
        'failure_stage' => 'transcription',
        'compression_status' => 'failed',
        'compression_error' => 'Old compression error',
    ]);

    ContentResponse::create([
        'episode_id' => $contentRequest->id,
        'content_type' => 'summary',
        'title' => 'Summary',
        'body' => 'Old response',
    ]);

    $response = $this
        ->actingAs($user)
        ->from(route('content-requests.show', $contentRequest))
        ->post(route('content-requests.retry-transcription', $contentRequest));

    $response->assertRedirect(route('content-requests.show', $contentRequest));
    $response->assertSessionHas('success', 'Transcription retry started.');

    $contentRequest->refresh();

    expect($contentRequest->status)->toBe(ContentRequest::STATUS_UPLOADED);
    expect($contentRequest->transcript)->toBeNull();
    expect($contentRequest->summary)->toBeNull();
    expect($contentRequest->failure_stage)->toBeNull();
    expect($contentRequest->compression_status)->toBeNull();
    expect($contentRequest->compression_error)->toBeNull();
    expect($contentRequest->contentResponses()->count())->toBe(0);

    Queue::assertPushed(TranscribeContentRequest::class, function ($job) use ($contentRequest) {
        return $job->contentRequestId === $contentRequest->id;
    });
});

it('regenerates content by clearing old responses and queueing generation again', function () {
    $user = User::factory()->create();
    Queue::fake();

    $contentRequest = ContentRequest::create([
        'user_id' => $user->id,
        'title' => 'Regenerate me',
        'tone' => 'professional',
        'input_type' => 'audio',
        'media_kind' => 'audio',
        'original_file_name' => 'clip.mp3',
        'file_path' => 'content-requests/test.mp3',
        'mime_type' => 'audio/mpeg',
        'file_size' => 1024,
        'transcript' => 'Ready transcript',
        'summary' => 'Old summary',
        'status' => ContentRequest::STATUS_COMPLETED,
        'failure_stage' => 'generation',
    ]);

    ContentResponse::create([
        'episode_id' => $contentRequest->id,
        'content_type' => 'linkedin_post',
        'title' => 'LinkedIn Post',
        'body' => 'Old LinkedIn response',
    ]);

    $response = $this
        ->actingAs($user)
        ->from(route('content-requests.show', $contentRequest))
        ->post(route('content-requests.regenerate-content', $contentRequest));

    $response->assertRedirect(route('content-requests.show', $contentRequest));
    $response->assertSessionHas('success', 'Content regeneration started.');

    $contentRequest->refresh();

    expect($contentRequest->status)->toBe(ContentRequest::STATUS_TRANSCRIBED);
    expect($contentRequest->summary)->toBeNull();
    expect($contentRequest->failure_stage)->toBeNull();
    expect($contentRequest->transcript)->toBe('Ready transcript');
    expect($contentRequest->contentResponses()->count())->toBe(0);

    Queue::assertPushed(GenerateContentResponses::class, function ($job) use ($contentRequest) {
        return $job->contentRequestId === $contentRequest->id;
    });
});

it('regenerates a single output without clearing the other outputs', function () {
    $user = User::factory()->create();
    Queue::fake();

    $contentRequest = ContentRequest::create([
        'user_id' => $user->id,
        'title' => 'Regenerate one card',
        'tone' => 'professional',
        'input_type' => 'audio',
        'media_kind' => 'audio',
        'original_file_name' => 'clip.mp3',
        'file_path' => 'content-requests/test.mp3',
        'mime_type' => 'audio/mpeg',
        'file_size' => 1024,
        'transcript' => 'Ready transcript',
        'summary' => 'Old summary',
        'status' => ContentRequest::STATUS_COMPLETED,
    ]);

    $linkedin = ContentResponse::create([
        'episode_id' => $contentRequest->id,
        'content_type' => 'linkedin_post',
        'title' => 'LinkedIn Post',
        'body' => 'Old LinkedIn response',
    ]);

    ContentResponse::create([
        'episode_id' => $contentRequest->id,
        'content_type' => 'x_post',
        'title' => 'X Post',
        'body' => 'Old X response',
    ]);

    $response = $this
        ->actingAs($user)
        ->from(route('content-requests.show', $contentRequest))
        ->post(route('content-requests.regenerate-output', [
            'contentRequest' => $contentRequest,
            'contentType' => 'linkedin_post',
        ]));

    $response->assertRedirect(route('content-requests.show', $contentRequest));
    $response->assertSessionHas('success', 'LinkedIn Post regeneration started.');

    $linkedin->refresh();
    $contentRequest->refresh();

    expect($contentRequest->summary)->toBe('Old summary');
    expect($contentRequest->contentResponses()->count())->toBe(2);
    expect($linkedin->meta['is_regenerating'])->toBeTrue();

    Queue::assertPushed(GenerateContentResponses::class, function ($job) use ($contentRequest) {
        return $job->contentRequestId === $contentRequest->id
            && $job->contentType === 'linkedin_post';
    });
});

it('passes the selected suggestion into content generation', function () {
    $user = User::factory()->create();
    $contentRequest = ContentRequest::create([
        'user_id' => $user->id,
        'title' => 'Regenerate me',
        'tone' => 'professional',
        'input_type' => 'audio',
        'media_kind' => 'audio',
        'original_file_name' => 'clip.mp3',
        'file_path' => 'content-requests/test.mp3',
        'mime_type' => 'audio/mpeg',
        'file_size' => 1024,
        'transcript' => 'Ready transcript',
        'selected_suggestion' => 'Lead with the strongest idea and make it practical.',
        'status' => ContentRequest::STATUS_TRANSCRIBED,
    ]);

    $openAI = Mockery::mock(OpenAIContentService::class);
    $openAI->shouldReceive('generate')
        ->once()
        ->with('Ready transcript', 'professional', 'Lead with the strongest idea and make it practical.')
        ->andReturn([
            'summary' => 'Summary',
            'linkedin_post' => 'LinkedIn',
            'x_post' => 'X',
            'instagram_caption' => 'Instagram',
            'newsletter' => 'Newsletter',
        ]);

    (new GenerateContentResponses($contentRequest->id))->handle($openAI);

    $contentRequest->refresh();

    expect($contentRequest->status)->toBe(ContentRequest::STATUS_COMPLETED);
    expect($contentRequest->summary)->toBe('Summary');
});

it('regenerates only the requested output in the job handler', function () {
    $user = User::factory()->create();
    $contentRequest = ContentRequest::create([
        'user_id' => $user->id,
        'title' => 'Single output job',
        'tone' => 'professional',
        'input_type' => 'audio',
        'media_kind' => 'audio',
        'original_file_name' => 'clip.mp3',
        'file_path' => 'content-requests/test.mp3',
        'mime_type' => 'audio/mpeg',
        'file_size' => 1024,
        'transcript' => 'Ready transcript',
        'summary' => 'Keep this summary',
        'status' => ContentRequest::STATUS_COMPLETED,
    ]);

    ContentResponse::create([
        'episode_id' => $contentRequest->id,
        'content_type' => 'linkedin_post',
        'title' => 'LinkedIn Post',
        'body' => 'Old LinkedIn response',
        'meta' => ['is_regenerating' => true],
    ]);

    ContentResponse::create([
        'episode_id' => $contentRequest->id,
        'content_type' => 'x_post',
        'title' => 'X Post',
        'body' => 'Keep X response',
    ]);

    $openAI = Mockery::mock(OpenAIContentService::class);
    $openAI->shouldReceive('generateSingleOutput')
        ->once()
        ->with('Ready transcript', 'linkedin_post', 'professional', null)
        ->andReturn('Fresh LinkedIn response');

    (new GenerateContentResponses($contentRequest->id, 'linkedin_post'))->handle($openAI);

    $contentRequest->refresh();
    $linkedin = $contentRequest->contentResponses()->where('content_type', 'linkedin_post')->first();
    $xPost = $contentRequest->contentResponses()->where('content_type', 'x_post')->first();

    expect($contentRequest->summary)->toBe('Keep this summary');
    expect($linkedin->body)->toBe('Fresh LinkedIn response');
    expect($linkedin->meta)->toBeNull();
    expect($xPost->body)->toBe('Keep X response');
});

it('rejects unsupported source files with a validation error', function () {
    $user = User::factory()->create();

    $file = Illuminate\Http\UploadedFile::fake()->create('notes.pdf', 100, 'application/pdf');

    $response = $this
        ->actingAs($user)
        ->from(route('content-requests.create'))
        ->post(route('content-requests.store'), [
            'title' => 'Invalid upload',
            'tone' => 'professional',
            'source_type' => 'audio',
            'source_file' => $file,
        ]);

    $response->assertRedirect(route('content-requests.create'));
    $response->assertSessionHasErrors('source_file');
});

it('returns live status payload while processing is active', function () {
    $user = User::factory()->create();
    $contentRequest = ContentRequest::create([
        'user_id' => $user->id,
        'title' => 'Live status',
        'tone' => 'professional',
        'input_type' => 'audio',
        'media_kind' => 'audio',
        'original_file_name' => 'clip.mp3',
        'file_path' => 'content-requests/test.mp3',
        'mime_type' => 'audio/mpeg',
        'file_size' => 1024,
        'status' => ContentRequest::STATUS_TRANSCRIBING,
        'compression_status' => 'started',
        'transcript' => null,
    ]);

    $response = $this
        ->actingAs($user)
        ->get(route('content-requests.status', $contentRequest));

    $response->assertOk()
        ->assertJsonPath('contentRequest.status', ContentRequest::STATUS_TRANSCRIBING)
        ->assertJsonPath('contentRequest.compression_status', 'started')
        ->assertJsonStructure([
            'contentRequest' => [
                'public_id',
                'status',
                'compression_status',
                'content_responses',
            ],
        ]);
});
