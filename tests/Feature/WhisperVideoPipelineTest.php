<?php

use App\Models\ContentRequest;
use App\Models\User;
use App\Services\S3DiskFactory;
use App\Services\WhisperService;
use Illuminate\Contracts\Filesystem\Filesystem;

it('rejects invalid video files with a clear validation message', function () {
    $service = app(WhisperService::class);
    $path = tempnam(sys_get_temp_dir(), 'vp_invalid_video_');

    file_put_contents($path, 'not-a-real-video');

    expect(fn () => $service->assertVideoSourceSupported($path))
        ->toThrow(RuntimeException::class, 'Invalid video file. The upload could not be read as a supported video source.');

    @unlink($path);
});

it('rejects videos that have no audio track', function () {
    $service = app(WhisperService::class);
    $sourcePath = sys_get_temp_dir() . '/' . uniqid('vp_video_no_audio_', true) . '.mp4';

    $process = new Symfony\Component\Process\Process([
        'ffmpeg',
        '-y',
        '-f', 'lavfi',
        '-i', 'color=c=black:s=320x240:d=1',
        '-c:v', 'libx264',
        '-pix_fmt', 'yuv420p',
        '-movflags', '+faststart',
        $sourcePath,
    ]);

    $process->setTimeout(120);
    $process->run();

    expect($process->isSuccessful())->toBeTrue();

    expect(fn () => $service->assertVideoSourceSupported($sourcePath))
        ->toThrow(RuntimeException::class, 'This video has no audio track, so there is nothing to transcribe.');

    @unlink($sourcePath);
});

it('fails transcription for an invalid uploaded video with a clear message', function () {
    $user = User::factory()->create();
    $contentRequest = ContentRequest::create([
        'user_id' => $user->id,
        'title' => 'Broken video',
        'tone' => 'professional',
        'input_type' => 'video',
        'media_kind' => 'video',
        'original_file_name' => 'broken.mp4',
        'file_path' => 'content-requests/broken.mp4',
        'mime_type' => 'video/mp4',
        'file_size' => 1024,
        'status' => ContentRequest::STATUS_TRANSCRIBING,
    ]);

    $temp = tempnam(sys_get_temp_dir(), 'vp_broken_video_');
    file_put_contents($temp, 'broken-video-data');
    $readStream = fopen($temp, 'r');

    $fakeDisk = Mockery::mock(Filesystem::class);
    $fakeDisk->shouldReceive('exists')->once()->with('content-requests/broken.mp4')->andReturn(true);
    $fakeDisk->shouldReceive('readStream')->once()->with('content-requests/broken.mp4')->andReturn($readStream);

    $factory = Mockery::mock(S3DiskFactory::class);
    $factory->shouldReceive('make')->once()->andReturn($fakeDisk);
    $this->app->instance(S3DiskFactory::class, $factory);

    $service = app(WhisperService::class);

    try {
        $service->transcribe($contentRequest);
        $this->fail('Expected invalid video transcription to fail.');
    } catch (RuntimeException $e) {
        expect($e->getMessage())->toBe('Invalid video file. The upload could not be read as a supported video source.');
    } finally {
        if (is_resource($readStream)) {
            fclose($readStream);
        }

        @unlink($temp);
    }
});

it('includes preview urls for video sources in the workspace status payload', function () {
    $user = User::factory()->create();

    $contentRequest = ContentRequest::create([
        'user_id' => $user->id,
        'title' => 'Video preview',
        'tone' => 'professional',
        'input_type' => 'video',
        'media_kind' => 'video',
        'original_file_name' => 'clip.mp4',
        'file_path' => 'content-requests/test.mp4',
        'preview_path' => 'content-request-previews/test-preview.mp4',
        'thumbnail_path' => 'content-request-thumbnails/test-thumb.jpg',
        'mime_type' => 'video/mp4',
        'file_size' => 1024,
        'status' => ContentRequest::STATUS_COMPLETED,
    ]);

    $fakeDisk = Mockery::mock(Filesystem::class);
    $fakeDisk->shouldReceive('temporaryUrl')
        ->once()
        ->withArgs(fn ($path) => $path === 'content-request-previews/test-preview.mp4')
        ->andReturn('https://example.test/preview.mp4');
    $fakeDisk->shouldReceive('temporaryUrl')
        ->once()
        ->withArgs(fn ($path) => $path === 'content-request-thumbnails/test-thumb.jpg')
        ->andReturn('https://example.test/preview.jpg');

    $factory = Mockery::mock(S3DiskFactory::class);
    $factory->shouldReceive('make')->twice()->andReturn($fakeDisk);
    $this->app->instance(S3DiskFactory::class, $factory);

    $response = $this
        ->actingAs($user)
        ->get(route('content-requests.status', $contentRequest));

    $response->assertOk()
        ->assertJsonPath('contentRequest.media_url', 'https://example.test/preview.mp4')
        ->assertJsonPath('contentRequest.media_thumbnail_url', 'https://example.test/preview.jpg')
        ->assertJsonPath('contentRequest.media_kind', 'video');
});
