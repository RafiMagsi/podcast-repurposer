<?php

use App\Models\ContentRequest;
use App\Models\User;
use App\Services\S3DiskFactory;
use App\Services\WhisperService;
use App\Jobs\TranscribeContentRequest;
use Illuminate\Contracts\Filesystem\Filesystem;
use Illuminate\Http\Exceptions\PostTooLargeException;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Queue;

it('uploads audio and creates a content request', function () {
    $user = User::factory()->create();
    Queue::fake();
    $beforeLatestId = ContentRequest::max('id') ?? 0;

    $fakeDisk = \Mockery::mock(Filesystem::class);
    $fakeDisk->shouldReceive('put')->once()->andReturn(true);

    $factory = \Mockery::mock(S3DiskFactory::class);
    $factory->shouldReceive('make')->once()->andReturn($fakeDisk);

    $this->app->instance(S3DiskFactory::class, $factory);

    $whisper = \Mockery::mock(WhisperService::class);
    $whisper->shouldReceive('assertMediaWithinDurationLimit')->once()->andReturn(42.0);
    $this->app->instance(WhisperService::class, $whisper);

    $file = UploadedFile::fake()->create('sample.mp3', 1000, 'audio/mpeg');

    $response = $this->actingAs($user)->post(route('content-requests.store'), [
        'title' => 'My Test Content Request',
        'tone' => 'professional',
        'audio' => $file,
    ]);

    $response->assertRedirect();

    $contentRequest = ContentRequest::query()
        ->where('id', '>', $beforeLatestId)
        ->latest('id')
        ->first();

    expect($contentRequest)->not->toBeNull();
    expect($contentRequest->title)->toBe('My Test Content Request');
    expect($contentRequest->status)->toBe('uploaded');
    expect($contentRequest->file_path)->toStartWith('content-requests/');
    expect($contentRequest->file_path)->toEndWith('.mp3');

    Queue::assertPushed(TranscribeContentRequest::class, function ($job) use ($contentRequest) {
        return $job->contentRequestId === $contentRequest->id;
    });
});

it('uploads video and queues transcription without blocking on preview preparation', function () {
    $user = User::factory()->create();
    Queue::fake();
    $beforeLatestId = ContentRequest::max('id') ?? 0;

    $fakeDisk = \Mockery::mock(Filesystem::class);
    $fakeDisk->shouldReceive('put')->once()->andReturn(true);

    $factory = \Mockery::mock(S3DiskFactory::class);
    $factory->shouldReceive('make')->once()->andReturn($fakeDisk);

    $this->app->instance(S3DiskFactory::class, $factory);

    $whisper = \Mockery::mock(WhisperService::class);
    $whisper->shouldReceive('assertMediaWithinDurationLimit')->once()->andReturn(42.0);
    $this->app->instance(WhisperService::class, $whisper);

    $file = UploadedFile::fake()->create('sample.mp4', 1000, 'video/mp4');

    $response = $this->actingAs($user)->post(route('content-requests.store'), [
        'title' => 'My Test Video Request',
        'tone' => 'professional',
        'source_type' => 'video',
        'source_file' => $file,
    ]);

    $response->assertRedirect();

    $contentRequest = ContentRequest::query()
        ->where('id', '>', $beforeLatestId)
        ->latest('id')
        ->first();

    expect($contentRequest)->not->toBeNull();
    expect($contentRequest->media_kind)->toBe('video');

    Queue::assertPushed(TranscribeContentRequest::class, function ($job) use ($contentRequest) {
        return $job->contentRequestId === $contentRequest->id;
    });
});

it('stores recorded webm audio as audio media instead of video', function () {
    $user = User::factory()->create();
    Queue::fake();
    $beforeLatestId = ContentRequest::max('id') ?? 0;

    $fakeDisk = \Mockery::mock(Filesystem::class);
    $fakeDisk->shouldReceive('put')->once()->andReturn(true);

    $factory = \Mockery::mock(S3DiskFactory::class);
    $factory->shouldReceive('make')->once()->andReturn($fakeDisk);

    $this->app->instance(S3DiskFactory::class, $factory);

    $whisper = \Mockery::mock(WhisperService::class);
    $whisper->shouldReceive('assertMediaWithinDurationLimit')->once()->andReturn(10.0);
    $this->app->instance(WhisperService::class, $whisper);

    $file = UploadedFile::fake()->create('audio-recording.webm', 1000, 'video/webm');

    $response = $this->actingAs($user)->post(route('content-requests.store'), [
        'title' => 'Recorded Audio',
        'tone' => 'professional',
        'source_type' => 'audio',
        'source_file' => $file,
    ]);

    $response->assertRedirect();

    $contentRequest = ContentRequest::query()
        ->where('id', '>', $beforeLatestId)
        ->latest('id')
        ->first();

    expect($contentRequest)->not->toBeNull();
    expect($contentRequest->media_kind)->toBe('audio');
    expect($contentRequest->input_type)->toBe('audio');
});

it('rejects audio uploads longer than 1 minute before storage', function () {
    $user = User::factory()->create();
    Queue::fake();

    $fakeDisk = \Mockery::mock(Filesystem::class);
    $fakeDisk->shouldNotReceive('put');

    $factory = \Mockery::mock(S3DiskFactory::class);
    $factory->shouldNotReceive('make');
    $this->app->instance(S3DiskFactory::class, $factory);

    $whisper = \Mockery::mock(WhisperService::class);
    $whisper->shouldReceive('assertMediaWithinDurationLimit')
        ->once()
        ->andThrow(new RuntimeException('Media must be 1 minute or less.'));
    $this->app->instance(WhisperService::class, $whisper);

    $file = UploadedFile::fake()->create('long.mp3', 1000, 'audio/mpeg');

    $response = $this
        ->actingAs($user)
        ->from(route('content-requests.create'))
        ->post(route('content-requests.store'), [
            'title' => 'Long audio',
            'tone' => 'professional',
            'source_type' => 'audio',
            'source_file' => $file,
        ]);

    $response->assertRedirect(route('content-requests.create'));
    $response->assertSessionHasErrors([
        'source_file' => 'Audio uploads must be 1 minute or less.',
    ]);

    Queue::assertNothingPushed();
});

it('rejects video uploads longer than 1 minute before storage', function () {
    $user = User::factory()->create();
    Queue::fake();

    $factory = \Mockery::mock(S3DiskFactory::class);
    $factory->shouldNotReceive('make');
    $this->app->instance(S3DiskFactory::class, $factory);

    $whisper = \Mockery::mock(WhisperService::class);
    $whisper->shouldReceive('assertMediaWithinDurationLimit')
        ->once()
        ->andThrow(new RuntimeException('Media must be 1 minute or less.'));
    $this->app->instance(WhisperService::class, $whisper);

    $file = UploadedFile::fake()->create('long.mp4', 1000, 'video/mp4');

    $response = $this
        ->actingAs($user)
        ->from(route('content-requests.create'))
        ->post(route('content-requests.store'), [
            'title' => 'Long video',
            'tone' => 'professional',
            'source_type' => 'video',
            'source_file' => $file,
        ]);

    $response->assertRedirect(route('content-requests.create'));
    $response->assertSessionHasErrors([
        'source_file' => 'Video uploads must be 1 minute or less.',
    ]);

    Queue::assertNothingPushed();
});

it('rejects recordings longer than 1 minute before storage', function () {
    $user = User::factory()->create();
    Queue::fake();

    $factory = \Mockery::mock(S3DiskFactory::class);
    $factory->shouldNotReceive('make');
    $this->app->instance(S3DiskFactory::class, $factory);

    $whisper = \Mockery::mock(WhisperService::class);
    $whisper->shouldReceive('assertMediaWithinDurationLimit')
        ->once()
        ->andThrow(new RuntimeException('Media must be 1 minute or less.'));
    $this->app->instance(WhisperService::class, $whisper);

    $file = UploadedFile::fake()->create('recording.mp3', 1000, 'audio/mpeg');

    $response = $this
        ->actingAs($user)
        ->from(route('content-requests.create'))
        ->post(route('content-requests.store'), [
            'title' => 'Long recording',
            'tone' => 'professional',
            'source_type' => 'recording',
            'audio' => $file,
        ]);

    $response->assertRedirect(route('content-requests.create'));
    $response->assertSessionHasErrors([
        'source_file' => 'Audio recordings must be 1 minute or less.',
    ]);

    Queue::assertNothingPushed();
});

it('redirects back with a simple upload error when the post body is too large', function () {
    $user = User::factory()->create();

    Route::middleware(['web', 'auth'])->post('/test-post-too-large', function () {
        throw new PostTooLargeException('The POST data is too large.');
    });

    $response = $this
        ->actingAs($user)
        ->from(route('content-requests.create'))
        ->post('/test-post-too-large');

    $response->assertRedirect(route('content-requests.create'));
    $response->assertSessionHasErrors([
        'source_file' => 'This upload is too large for this server. Choose a smaller file and try again.',
    ]);
});

it('blocks new processing when the user has reached the usage limit', function () {
    $user = User::factory()->create([
        'run_limit' => 2,
        'plan_price_usd' => 10,
    ]);

    foreach (range(1, 2) as $index) {
        ContentRequest::create([
            'user_id' => $user->id,
            'title' => 'Used run ' . $index,
            'tone' => 'professional',
            'input_type' => 'audio',
            'media_kind' => 'audio',
            'original_file_name' => "clip-{$index}.mp3",
            'file_path' => "content-requests/used-{$index}.mp3",
            'mime_type' => 'audio/mpeg',
            'file_size' => 1024,
            'status' => ContentRequest::STATUS_COMPLETED,
        ]);
    }

    $factory = \Mockery::mock(S3DiskFactory::class);
    $factory->shouldNotReceive('make');
    $this->app->instance(S3DiskFactory::class, $factory);

    $whisper = \Mockery::mock(WhisperService::class);
    $whisper->shouldNotReceive('assertMediaWithinDurationLimit');
    $this->app->instance(WhisperService::class, $whisper);

    $file = UploadedFile::fake()->create('sample.mp3', 1000, 'audio/mpeg');

    $response = $this
        ->actingAs($user)
        ->from(route('content-requests.create'))
        ->post(route('content-requests.store'), [
            'title' => 'Blocked request',
            'tone' => 'professional',
            'audio' => $file,
        ]);

    $response->assertRedirect(route('content-requests.create'));
    $response->assertSessionHasErrors([
        'source_file' => 'You have reached your 2-run limit on the $10 plan. Upgrade or wait before starting a new run.',
    ]);
});

it('rate limits create and upload actions with a safe error message', function () {
    $user = User::factory()->create();
    $key = 'content-rate:create:user:' . $user->id;

    RateLimiter::clear($key);

    foreach (range(1, 8) as $attempt) {
        RateLimiter::hit($key, 600);
    }

    $factory = \Mockery::mock(S3DiskFactory::class);
    $factory->shouldNotReceive('make');
    $this->app->instance(S3DiskFactory::class, $factory);

    $whisper = \Mockery::mock(WhisperService::class);
    $whisper->shouldNotReceive('assertMediaWithinDurationLimit');
    $this->app->instance(WhisperService::class, $whisper);

    $file = UploadedFile::fake()->create('sample.mp3', 1000, 'audio/mpeg');

    $response = $this
        ->actingAs($user)
        ->from(route('content-requests.create'))
        ->post(route('content-requests.store'), [
            'title' => 'Rate limited request',
            'tone' => 'professional',
            'audio' => $file,
        ]);

    $response->assertRedirect(route('content-requests.create'));
    $response->assertSessionHasErrors([
        'source_file' => 'Too many new runs in a short time. Please wait a few minutes before creating another one.',
    ]);

    RateLimiter::clear($key);
});

it('rate limits suggestion requests with a safe json message', function () {
    $user = User::factory()->create();
    $key = 'content-rate:suggestions:user:' . $user->id;

    RateLimiter::clear($key);

    foreach (range(1, 12) as $attempt) {
        RateLimiter::hit($key, 600);
    }

    $response = $this
        ->actingAs($user)
        ->postJson(route('content-requests.suggestions'), [
            'title' => 'Idea',
            'tone' => 'professional',
            'source_type' => 'text',
            'source_text' => 'Short note',
        ]);

    $response->assertStatus(429)
        ->assertJsonPath('message', 'Too many suggestion requests in a short time. Please wait a few minutes and try again.')
        ->assertJsonPath('errors.contentRequest.0', 'Too many suggestion requests in a short time. Please wait a few minutes and try again.');

    RateLimiter::clear($key);
});
