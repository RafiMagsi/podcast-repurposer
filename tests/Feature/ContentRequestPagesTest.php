<?php

use App\Models\ContentRequest;
use App\Models\User;

it('redirects guests from content request pages', function () {
    $this->get(route('content-requests.index'))->assertRedirect(route('login'));
    $this->get(route('content-requests.create'))->assertRedirect(route('login'));
    $this->get(route('pipeline.index'))->assertRedirect(route('login'));
    $this->get(route('pipeline.status'))->assertRedirect(route('login'));
});

it('allows authenticated users to view content request pages', function () {
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
        'status' => ContentRequest::STATUS_UPLOADED,
    ]);

    $this->actingAs($user)->get(route('content-requests.index'))->assertOk();
    $this->actingAs($user)->get(route('content-requests.create'))->assertOk();
    $this->actingAs($user)->get(route('pipeline.index'))->assertOk();
    $this->actingAs($user)->get(route('dashboard'))->assertOk();
    $this->actingAs($user)->get(route('pipeline.status'))->assertOk()->assertJsonStructure(['contentRequests']);
    $statusResponse = $this->actingAs($user)->get(route('content-requests.status', $contentRequest));
    $statusResponse->assertOk()->assertJsonStructure(['contentRequest']);

    $mediaUrl = (string) data_get($statusResponse->json(), 'contentRequest.media_url');

    expect($mediaUrl)->not->toBe('');
    expect($mediaUrl)->toContain('content-requests/test.mp3');
});

it('allows a user to cancel active processing', function () {
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
