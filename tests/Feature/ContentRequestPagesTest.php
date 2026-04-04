<?php

use App\Models\ContentRequest;
use App\Models\User;
use App\Services\S3DiskFactory;
use Illuminate\Contracts\Filesystem\Filesystem;
use Illuminate\Foundation\Http\Middleware\ValidateCsrfToken;
use Illuminate\Support\Facades\RateLimiter;

it('redirects guests from content request pages', function () {
    $this->get(route('content-requests.index'))->assertRedirect(route('login'));
    $this->get(route('content-requests.create'))->assertRedirect(route('login'));
    $this->get(route('pipeline.index'))->assertRedirect(route('login'));
    $this->get(route('pipeline.status'))->assertRedirect(route('login'));
});

it('allows authenticated users to view content request pages', function () {
    $user = User::factory()->create([
        'run_limit' => 100,
        'plan_price_usd' => 10,
    ]);
    $contentRequest = ContentRequest::create([
        'user_id' => $user->id,
        'title' => 'Test recording',
        'tone' => 'professional',
        'input_type' => 'audio',
        'media_kind' => 'audio',
        'original_file_name' => 'clip.mp3',
        'file_path' => 'content-requests/test.mp3',
        'mime_type' => 'audio/mpeg',
        'file_size' => 1024,
        'status' => ContentRequest::STATUS_UPLOADED,
    ]);

    $this->actingAs($user)
        ->get(route('content-requests.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->where('usageLimits.remaining', 99));
    $this->actingAs($user)
        ->get(route('content-requests.create'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->where('usageLimits.remaining', 99));
    $this->actingAs($user)->get(route('pipeline.index'))->assertOk();
    $this->actingAs($user)
        ->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->where('usageLimits.limit', 100)->where('usageLimits.plan_price_usd', 10));
    $this->actingAs($user)->get(route('pipeline.status'))->assertOk()->assertJsonStructure(['contentRequests']);
    $statusResponse = $this->actingAs($user)->get(route('content-requests.status', $contentRequest));
    $statusResponse->assertOk()->assertJsonStructure(['contentRequest']);

    $mediaUrl = (string) data_get($statusResponse->json(), 'contentRequest.media_url');

    expect($mediaUrl)->not->toBe('');
    expect($mediaUrl)->toContain('content-requests/test.mp3');
});

it('allows a user to cancel active processing', function () {
    $this->withoutMiddleware(ValidateCsrfToken::class);

    $user = User::factory()->create();
    $contentRequest = ContentRequest::create([
        'user_id' => $user->id,
        'title' => 'Test recording',
        'tone' => 'professional',
        'input_type' => 'audio',
        'media_kind' => 'audio',
        'original_file_name' => 'clip.mp3',
        'file_path' => 'content-requests/test.mp3',
        'mime_type' => 'audio/mpeg',
        'file_size' => 1024,
        'status' => ContentRequest::STATUS_TRANSCRIBING,
        'compression_status' => 'started',
    ]);

    $response = $this
        ->actingAs($user)
        ->post(route('content-requests.cancel-processing', $contentRequest));

    $response->assertRedirect();

    expect($contentRequest->fresh()->status)->toBe(ContentRequest::STATUS_CANCELLED);
    expect($contentRequest->fresh()->compression_status)->toBe('cancelled');
});

it('blocks retry transcription while processing is already active', function () {
    $this->withoutMiddleware(ValidateCsrfToken::class);

    $user = User::factory()->create();
    $contentRequest = ContentRequest::create([
        'user_id' => $user->id,
        'title' => 'Active recording',
        'tone' => 'professional',
        'input_type' => 'audio',
        'media_kind' => 'audio',
        'original_file_name' => 'clip.mp3',
        'file_path' => 'content-requests/test.mp3',
        'mime_type' => 'audio/mpeg',
        'file_size' => 1024,
        'status' => ContentRequest::STATUS_TRANSCRIBING,
    ]);

    $response = $this
        ->actingAs($user)
        ->from(route('content-requests.show', $contentRequest))
        ->post(route('content-requests.retry-transcription', $contentRequest));

    $response->assertRedirect(route('content-requests.show', $contentRequest));
    $response->assertSessionHasErrors([
        'contentRequest' => 'This recording is already processing. Cancel it first or wait for it to finish.',
    ]);
});

it('blocks regenerate content while processing is already active', function () {
    $this->withoutMiddleware(ValidateCsrfToken::class);

    $user = User::factory()->create();
    $contentRequest = ContentRequest::create([
        'user_id' => $user->id,
        'title' => 'Active recording',
        'tone' => 'professional',
        'input_type' => 'audio',
        'media_kind' => 'audio',
        'original_file_name' => 'clip.mp3',
        'file_path' => 'content-requests/test.mp3',
        'mime_type' => 'audio/mpeg',
        'file_size' => 1024,
        'transcript' => 'Test transcript',
        'status' => ContentRequest::STATUS_GENERATING,
    ]);

    $response = $this
        ->actingAs($user)
        ->from(route('content-requests.show', $contentRequest))
        ->post(route('content-requests.regenerate-content', $contentRequest));

    $response->assertRedirect(route('content-requests.show', $contentRequest));
    $response->assertSessionHasErrors([
        'contentRequest' => 'This recording is already processing. Cancel it first or wait for it to finish.',
    ]);
});

it('rate limits retry and regenerate actions with a safe fallback error', function () {
    $this->withoutMiddleware(ValidateCsrfToken::class);

    $user = User::factory()->create();
    $contentRequest = ContentRequest::create([
        'user_id' => $user->id,
        'title' => 'Completed recording',
        'tone' => 'professional',
        'input_type' => 'audio',
        'media_kind' => 'audio',
        'original_file_name' => 'clip.mp3',
        'file_path' => 'content-requests/test.mp3',
        'mime_type' => 'audio/mpeg',
        'file_size' => 1024,
        'transcript' => 'Ready transcript',
        'status' => ContentRequest::STATUS_COMPLETED,
    ]);

    $key = 'content-rate:action:user:' . $user->id;
    RateLimiter::clear($key);

    foreach (range(1, 10) as $attempt) {
        RateLimiter::hit($key, 600);
    }

    $response = $this
        ->actingAs($user)
        ->from(route('content-requests.show', $contentRequest))
        ->post(route('content-requests.regenerate-content', $contentRequest));

    $response->assertRedirect(route('content-requests.show', $contentRequest));
    $response->assertSessionHasErrors([
        'contentRequest' => 'Too many retry or regenerate attempts in a short time. Please wait a few minutes and try again.',
    ]);

    RateLimiter::clear($key);
});

it('deletes only expected media paths from storage when removing a content request', function () {
    $this->withoutMiddleware(ValidateCsrfToken::class);

    $user = User::factory()->create();
    $contentRequest = ContentRequest::create([
        'user_id' => $user->id,
        'title' => 'Delete me',
        'tone' => 'professional',
        'input_type' => 'video',
        'media_kind' => 'video',
        'original_file_name' => 'clip.mp4',
        'file_path' => '../unexpected/path.mp4',
        'preview_path' => 'content-request-previews/safe-preview.mp4',
        'thumbnail_path' => 'content-request-thumbnails/safe-thumb.jpg',
        'mime_type' => 'video/mp4',
        'file_size' => 1024,
        'status' => ContentRequest::STATUS_COMPLETED,
    ]);

    $fakeDisk = \Mockery::mock(Filesystem::class);
    $fakeDisk->shouldReceive('delete')->once()->with('content-request-previews/safe-preview.mp4');
    $fakeDisk->shouldReceive('delete')->once()->with('content-request-thumbnails/safe-thumb.jpg');
    $fakeDisk->shouldNotReceive('delete')->with('../unexpected/path.mp4');

    $factory = \Mockery::mock(S3DiskFactory::class);
    $factory->shouldReceive('make')->once()->andReturn($fakeDisk);
    $this->app->instance(S3DiskFactory::class, $factory);

    $response = $this
        ->actingAs($user)
        ->delete(route('content-requests.destroy', $contentRequest));

    $response->assertRedirect(route('content-requests.index'));
    expect(ContentRequest::find($contentRequest->id))->toBeNull();
});
