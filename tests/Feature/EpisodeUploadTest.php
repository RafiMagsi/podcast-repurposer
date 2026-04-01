<?php

use App\Models\Episode;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

it('allows authenticated users to upload audio', function () {
    Storage::fake('local');

    $user = User::factory()->create();

    $file = UploadedFile::fake()->create('sample.mp3', 1000, 'audio/mpeg');

    $response = $this->actingAs($user)->post(route('episodes.store'), [
        'title' => 'Test Episode',
        'tone' => 'professional',
        'audio' => $file,
    ]);

    $response->assertRedirect();

    $episode = Episode::first();

    expect($episode)->not->toBeNull();
    expect($episode->title)->toBe('Test Episode');
    expect($episode->user_id)->toBe($user->id);

    Storage::disk('local')->assertExists($episode->file_path);
});

it('prevents users from viewing another users episode', function () {
    $owner = User::factory()->create();
    $otherUser = User::factory()->create();

    $episode = Episode::factory()->create([
        'user_id' => $owner->id,
        'title' => 'Private Episode',
        'file_path' => 'episodes/private.mp3',
        'status' => 'uploaded',
    ]);

    $this->actingAs($otherUser)
        ->get(route('episodes.show', $episode))
        ->assertForbidden();
});