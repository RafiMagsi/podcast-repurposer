<?php

use App\Models\Episode;
use App\Models\User;
use App\Services\S3DiskFactory;
use Illuminate\Contracts\Filesystem\Filesystem;
use Illuminate\Http\UploadedFile;
use Mockery;

it('uploads audio and creates an episode', function () {
    $user = User::factory()->create();

    $fakeDisk = Mockery::mock(Filesystem::class);
    $fakeDisk->shouldReceive('putFileAs')->once()->andReturn('episodes/2026/04/test.mp3');

    $factory = Mockery::mock(S3DiskFactory::class);
    $factory->shouldReceive('make')->once()->andReturn($fakeDisk);

    $this->app->instance(S3DiskFactory::class, $factory);

    $file = UploadedFile::fake()->create('sample.mp3', 1000, 'audio/mpeg');

    $response = $this->actingAs($user)->post(route('episodes.store'), [
        'title' => 'My Test Episode',
        'tone' => 'professional',
        'audio' => $file,
    ]);

    $response->assertRedirect();

    $episode = Episode::first();

    expect($episode)->not->toBeNull();
    expect($episode->title)->toBe('My Test Episode');
    expect($episode->status)->toBe('uploaded');
    expect($episode->file_path)->toBe('episodes/2026/04/test.mp3');
});