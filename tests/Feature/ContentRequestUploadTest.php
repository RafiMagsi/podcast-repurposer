<?php

use App\Models\ContentRequest;
use App\Models\User;
use App\Services\S3DiskFactory;
use App\Jobs\TranscribeContentRequest;
use Illuminate\Contracts\Filesystem\Filesystem;
use Illuminate\Http\Exceptions\PostTooLargeException;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Queue;

it('uploads audio and creates a content request', function () {
    $user = User::factory()->create();
    Queue::fake();

    $fakeDisk = \Mockery::mock(Filesystem::class);
    $fakeDisk->shouldReceive('putFileAs')->once()->andReturn('content-requests/2026/04/test.mp3');

    $factory = \Mockery::mock(S3DiskFactory::class);
    $factory->shouldReceive('make')->once()->andReturn($fakeDisk);

    $this->app->instance(S3DiskFactory::class, $factory);

    $file = UploadedFile::fake()->create('sample.mp3', 1000, 'audio/mpeg');

    $response = $this->actingAs($user)->post(route('content-requests.store'), [
        'title' => 'My Test Content Request',
        'tone' => 'professional',
        'audio' => $file,
    ]);

    $response->assertRedirect();

    $contentRequest = ContentRequest::first();

    expect($contentRequest)->not->toBeNull();
    expect($contentRequest->title)->toBe('My Test Content Request');
    expect($contentRequest->status)->toBe('uploaded');
    expect($contentRequest->file_path)->toBe('content-requests/2026/04/test.mp3');

    Queue::assertPushed(TranscribeContentRequest::class, function ($job) use ($contentRequest) {
        return $job->contentRequestId === $contentRequest->id;
    });
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
