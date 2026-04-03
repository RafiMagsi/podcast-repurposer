<?php

namespace App\Services;

use App\Exceptions\ProcessingCancelledException;
use App\Models\ContentRequest;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use RuntimeException;

class WhisperService
{
    public function __construct(
        protected SettingService $settings,
        protected S3DiskFactory $s3DiskFactory,
        protected AudioCompressionService $audioCompressionService
    ) {
    }

    public function transcribe(ContentRequest $contentRequest): string
    {
        Log::info('WhisperService transcribe started', [
            'content_request_id' => $contentRequest->id,
            'public_id' => $contentRequest->public_id,
            's3_path' => $contentRequest->file_path,
        ]);

        $shouldBypass = filter_var(
            (string) $this->settings->get('bypass_openai_for_testing', 'false'),
            FILTER_VALIDATE_BOOL
        );

        $sourcePath = null;
        $compressedPath = null;

        try {
            $this->abortIfCancelled($contentRequest);
            $sourcePath = $this->downloadSourceToTempFile($contentRequest);

            $duration = $this->assertMediaWithinDurationLimit($sourcePath, 60);

            $contentRequest->update([
                'duration_seconds' => (int) ceil($duration),
            ]);

            Log::info('Media duration validated successfully', [
                'content_request_id' => $contentRequest->id,
                'duration_seconds' => $duration,
                'input_type' => $contentRequest->input_type,
                'media_kind' => $contentRequest->media_kind,
                'mime_type' => $contentRequest->mime_type,
            ]);

            $this->abortIfCancelled($contentRequest);

            if (
                ($contentRequest->input_type === 'video' || $contentRequest->media_kind === 'video' || str_starts_with((string) $contentRequest->mime_type, 'video/'))
                && empty($contentRequest->thumbnail_path)
            ) {
                $thumbnailPath = $this->generateVideoThumbnail($contentRequest, $sourcePath);

                if ($thumbnailPath) {
                    try {
                        $contentRequest->update([
                            'thumbnail_path' => $thumbnailPath,
                        ]);

                        Log::info('Video thumbnail generated successfully', [
                            'content_request_id' => $contentRequest->id,
                            'thumbnail_path' => $thumbnailPath,
                        ]);
                    } catch (\Throwable $thumbnailException) {
                        Log::warning('Video thumbnail generated but could not be saved', [
                            'content_request_id' => $contentRequest->id,
                            'thumbnail_path' => $thumbnailPath,
                            'message' => $thumbnailException->getMessage(),
                        ]);
                    }
                }
            }

            $this->abortIfCancelled($contentRequest);

            $contentRequest->update([
                'compression_status' => 'started',
                'compression_error' => null,
            ]);

            $compressedPath = $this->prepareCompressedAudio($sourcePath);

            $compressedSize = file_exists($compressedPath) ? filesize($compressedPath) : null;

            $contentRequest->update([
                'compressed_file_size' => $compressedSize,
                'compression_status' => 'completed',
                'compression_error' => null,
            ]);

            Log::info('Prepared compressed audio for transcription', [
                'content_request_id' => $contentRequest->id,
                'input_type' => $contentRequest->input_type,
                'mime_type' => $contentRequest->mime_type,
                'source_temp_path' => $sourcePath,
                'compressed_temp_path' => $compressedPath,
                'compressed_size' => $compressedSize,
            ]);

            $this->abortIfCancelled($contentRequest);

            if (($compressedSize ?? 0) > (25 * 1024 * 1024)) {
                throw new RuntimeException('Compressed audio is still larger than 25MB.');
            }

            if ($shouldBypass) {
                Log::info('WhisperService bypassed OpenAI transcription for testing after local media preparation', [
                    'content_request_id' => $contentRequest->id,
                    'public_id' => $contentRequest->public_id,
                    'thumbnail_path' => $contentRequest->thumbnail_path,
                    'compressed_size' => $compressedSize,
                ]);

                return 'This is a mock transcript generated in testing mode. VoicePost AI bypassed the OpenAI transcription call and returned a local transcript placeholder so you can test the workflow without API usage.';
            }

            $this->abortIfCancelled($contentRequest);

            $apiKey = $this->settings->get('openai_api_key');

            if (! $apiKey) {
                throw new RuntimeException('Missing openai_api_key');
            }

            Log::info('Sending file to OpenAI transcription API', [
                'content_request_id' => $contentRequest->id,
                'compressed_path' => $compressedPath,
                'filename' => basename($compressedPath),
            ]);
            $response = Http::withToken($apiKey)
                ->timeout(120)
                ->connectTimeout(15)
                ->attach(
                    'file',
                    fopen($compressedPath, 'r'),
                    basename($compressedPath)
                )
                ->post('https://api.openai.com/v1/audio/transcriptions', [
                    'model' => 'gpt-4o-mini-transcribe',
                    'response_format' => 'json',
                ]);

            Log::info('OpenAI transcription response received', [
                'content_request_id' => $contentRequest->id,
                'status' => $response->status(),
                'body' => $response->failed() ? $response->body() : null,
            ]);

            $this->abortIfCancelled($contentRequest);

            if (! $response->successful()) {
                throw new RuntimeException('OpenAI transcription failed: ' . $response->body());
            }

            $payload = $response->json();

            $text = data_get($payload, 'full_response.text')           // ✅ your actual structure
                ?? data_get($payload, 'text')                          // fallback: raw OpenAI response
                ?? data_get($payload, 'output.0.content.0.text')       // Responses API format
                ?? data_get($payload, 'output_text')                   // another fallback
                ?? data_get($payload, 'results.0.alternatives.0.transcript'); // just in case

            Log::info('OpenAI transcription text extraction resolved', [
                'content_request_id' => $contentRequest->id,
                'status' => $response->status(),
                'has_text' => is_string($text) && trim($text) !== '',
            ]);

            if (! is_string($text) || trim($text) === '') {
                throw new RuntimeException('OpenAI transcription returned empty text. Payload: ' . json_encode($payload));
            }

            $text = trim($text);


            Log::info('OpenAI transcription text extracted successfully', [
                'content_request_id' => $contentRequest->id,
                'text_length' => strlen($text),
            ]);

            return $text;
        } catch (ProcessingCancelledException $e) {
            if (in_array($contentRequest->compression_status, [null, 'started'], true)) {
                $contentRequest->update([
                    'compression_status' => 'cancelled',
                    'compression_error' => null,
                ]);
            }

            Log::info('WhisperService detected cancellation', [
                'content_request_id' => $contentRequest->id,
            ]);

            throw $e;
        } catch (\Throwable $e) {
            $contentRequest->update([
                'compression_status' => 'failed',
                'compression_error' => $e->getMessage(),
            ]);

            Log::error('WhisperService failed', [
                'content_request_id' => $contentRequest->id,
                'message' => $e->getMessage(),
            ]);

            throw $e;
        } finally {
            if ($sourcePath && file_exists($sourcePath)) {
                @unlink($sourcePath);

                Log::info('Original temp file deleted', [
                    'content_request_id' => $contentRequest->id,
                    'temp_path' => $sourcePath,
                ]);
            }

            if ($compressedPath && file_exists($compressedPath)) {
                @unlink($compressedPath);

                Log::info('Compressed temp file deleted', [
                    'content_request_id' => $contentRequest->id,
                    'compressed_path' => $compressedPath,
                ]);
            }
        }
    }

    private function abortIfCancelled(ContentRequest $contentRequest): void
    {
        $contentRequest->refresh();

        if ($contentRequest->status === ContentRequest::STATUS_CANCELLED) {
            throw new ProcessingCancelledException('Processing was cancelled.');
        }
    }

    private function downloadSourceToTempFile(ContentRequest $contentRequest): string
    {
        $disk = $this->s3DiskFactory->make();

        if (! $disk->exists($contentRequest->file_path)) {
            throw new \RuntimeException('Source file was not found in storage.');
        }

        $tmpSource = tempnam(sys_get_temp_dir(), 'cr_src_');

        if ($tmpSource === false) {
            throw new \RuntimeException('Unable to create temporary file for duration check.');
        }

        $readStream = $disk->readStream($contentRequest->file_path);

        if (! is_resource($readStream)) {
            @unlink($tmpSource);
            throw new \RuntimeException('Unable to read source file from storage.');
        }

        $writeStream = fopen($tmpSource, 'w+b');

        if (! is_resource($writeStream)) {
            fclose($readStream);
            @unlink($tmpSource);
            throw new \RuntimeException('Unable to open local temp file for media processing.');
        }

        stream_copy_to_stream($readStream, $writeStream);

        fclose($readStream);
        fclose($writeStream);

        return $tmpSource;
    }

    public function assertMediaWithinDurationLimit(string $sourcePath, int $maxSeconds = 60): float
    {
        if (! file_exists($sourcePath)) {
            throw new \RuntimeException('Source temp file is missing for duration validation.');
        }

        $process = new \Symfony\Component\Process\Process([
            'ffprobe',
            '-v', 'error',
            '-show_entries', 'format=duration',
            '-of', 'default=noprint_wrappers=1:nokey=1',
            $sourcePath,
        ]);

        $process->setTimeout(120);
        $process->run();

        if (! $process->isSuccessful()) {
            throw new \RuntimeException('Unable to determine media duration.');
        }

        $duration = (float) trim($process->getOutput());

        if ($duration <= 0) {
            throw new \RuntimeException('Invalid media duration.');
        }

        if ($duration > $maxSeconds) {
            throw new \RuntimeException('Media must be 1 minute or less.');
        }

        return $duration;
    }

    private function prepareCompressedAudio(string $sourcePath): string
    {
        if (! file_exists($sourcePath)) {
            throw new \RuntimeException('Source temp file is missing for compression.');
        }

        $outputPath = sys_get_temp_dir() . '/' . uniqid('cr_audio_', true) . '.m4a';

        $process = new \Symfony\Component\Process\Process([
            'ffmpeg',
            '-y',
            '-i', $sourcePath,
            '-vn',
            '-ac', '1',
            '-ar', '16000',
            '-b:a', '64k',
            '-c:a', 'aac',
            $outputPath,
        ]);

        $process->setTimeout(600);
        $process->run();

        if (! $process->isSuccessful() || ! file_exists($outputPath)) {
            @unlink($outputPath);

            throw new \RuntimeException('Unable to extract and compress audio from source.');
        }

        return $outputPath;
    }

    public function generateVideoThumbnail(ContentRequest $contentRequest, string $sourcePath): ?string
    {
        if (
            $contentRequest->input_type !== 'video' &&
            $contentRequest->media_kind !== 'video' &&
            !str_starts_with((string) $contentRequest->mime_type, 'video/')
        ) {
            return null;
        }

        if (! file_exists($sourcePath)) {
            return null;
        }

        $thumbPath = sys_get_temp_dir() . '/' . uniqid('cr_thumb_', true) . '.jpg';

        $process = new \Symfony\Component\Process\Process([
            'ffmpeg',
            '-y',
            '-i', $sourcePath,
            '-ss', '00:00:01',
            '-frames:v', '1',
            $thumbPath,
        ]);

        $process->setTimeout(180);
        $process->run();

        if (! $process->isSuccessful() || ! file_exists($thumbPath)) {
            @unlink($thumbPath);
            return null;
        }

        $storedThumbPath = 'content-request-thumbnails/' . now()->format('Y/m') . '/' . uniqid('thumb_', true) . '.jpg';

        $disk = $this->s3DiskFactory->make();
        $thumbStream = fopen($thumbPath, 'r');

        if (! is_resource($thumbStream)) {
            @unlink($thumbPath);
            return null;
        }

        $disk->put($storedThumbPath, $thumbStream);

        fclose($thumbStream);

        @unlink($thumbPath);

        return $storedThumbPath;
    }

    public function prepareVideoAssets(ContentRequest $contentRequest): void
    {
        if (
            $contentRequest->input_type !== 'video' &&
            $contentRequest->media_kind !== 'video' &&
            !str_starts_with((string) $contentRequest->mime_type, 'video/')
        ) {
            return;
        }

        $this->abortIfCancelled($contentRequest);

        $sourcePath = null;

        try {
            $sourcePath = $this->downloadSourceToTempFile($contentRequest);

            $updates = [];

            if (empty($contentRequest->preview_path)) {
                $previewPath = $this->generateStreamingVideoPreview($contentRequest, $sourcePath);

                if ($previewPath) {
                    $updates['preview_path'] = $previewPath;
                }
            }

            if (empty($contentRequest->thumbnail_path)) {
                $thumbnailPath = $this->generateVideoThumbnail($contentRequest, $sourcePath);

                if ($thumbnailPath) {
                    $updates['thumbnail_path'] = $thumbnailPath;
                }
            }

            if ($updates !== []) {
                $contentRequest->update($updates);

                Log::info('Video preview assets prepared', [
                    'content_request_id' => $contentRequest->id,
                    'public_id' => $contentRequest->public_id,
                    'preview_path' => $updates['preview_path'] ?? $contentRequest->preview_path,
                    'thumbnail_path' => $updates['thumbnail_path'] ?? $contentRequest->thumbnail_path,
                ]);
            }
        } finally {
            if ($sourcePath && file_exists($sourcePath)) {
                @unlink($sourcePath);
            }
        }
    }

    public function generateStreamingVideoPreview(ContentRequest $contentRequest, string $sourcePath): ?string
    {
        if (
            $contentRequest->input_type !== 'video' &&
            $contentRequest->media_kind !== 'video' &&
            !str_starts_with((string) $contentRequest->mime_type, 'video/')
        ) {
            return null;
        }

        if (! file_exists($sourcePath)) {
            return null;
        }

        $previewPath = sys_get_temp_dir() . '/' . uniqid('cr_preview_', true) . '.mp4';
        $startedAt = microtime(true);
        $strategy = $this->supportsFastPreviewRemux($sourcePath) ? 'remux' : 'transcode';
        $process = $strategy === 'remux'
            ? $this->makeFastPreviewRemuxProcess($sourcePath, $previewPath)
            : $this->makeStreamingPreviewTranscodeProcess($sourcePath, $previewPath);

        $process->setTimeout(600);
        $process->run();

        if ((! $process->isSuccessful() || ! file_exists($previewPath)) && $strategy === 'remux') {
            @unlink($previewPath);

            Log::info('Fast preview remux failed, retrying with transcode', [
                'content_request_id' => $contentRequest->id,
                'public_id' => $contentRequest->public_id,
                'message' => $process->getErrorOutput() ?: $process->getOutput(),
            ]);

            $strategy = 'transcode';
            $process = $this->makeStreamingPreviewTranscodeProcess($sourcePath, $previewPath);
            $process->setTimeout(600);
            $process->run();
        }

        if (! $process->isSuccessful() || ! file_exists($previewPath)) {
            @unlink($previewPath);

            Log::warning('Unable to generate streaming video preview', [
                'content_request_id' => $contentRequest->id,
                'public_id' => $contentRequest->public_id,
                'strategy' => $strategy,
                'message' => $process->getErrorOutput() ?: $process->getOutput(),
            ]);

            return null;
        }

        $storedPreviewPath = 'content-request-previews/' . now()->format('Y/m') . '/' . uniqid('preview_', true) . '.mp4';

        $disk = $this->s3DiskFactory->make();
        $previewStream = fopen($previewPath, 'r');

        if (! is_resource($previewStream)) {
            @unlink($previewPath);
            return null;
        }

        $disk->put($storedPreviewPath, $previewStream);

        fclose($previewStream);

        @unlink($previewPath);

        Log::info('Streaming video preview generated successfully', [
            'content_request_id' => $contentRequest->id,
            'public_id' => $contentRequest->public_id,
            'preview_path' => $storedPreviewPath,
            'strategy' => $strategy,
            'duration_ms' => (int) round((microtime(true) - $startedAt) * 1000),
        ]);

        return $storedPreviewPath;
    }

    private function supportsFastPreviewRemux(string $sourcePath): bool
    {
        $process = new \Symfony\Component\Process\Process([
            'ffprobe',
            '-v', 'error',
            '-show_entries', 'stream=codec_type,codec_name',
            '-of', 'json',
            $sourcePath,
        ]);

        $process->setTimeout(120);
        $process->run();

        if (! $process->isSuccessful()) {
            return false;
        }

        $streams = data_get(json_decode($process->getOutput(), true), 'streams', []);
        $videoCodec = null;
        $audioCodec = null;

        foreach ($streams as $stream) {
            $codecType = data_get($stream, 'codec_type');
            $codecName = strtolower((string) data_get($stream, 'codec_name', ''));

            if ($codecType === 'video' && $videoCodec === null) {
                $videoCodec = $codecName;
            }

            if ($codecType === 'audio' && $audioCodec === null) {
                $audioCodec = $codecName;
            }
        }

        return $videoCodec === 'h264' && in_array($audioCodec, ['aac', 'mp3', null], true);
    }

    private function makeFastPreviewRemuxProcess(string $sourcePath, string $previewPath): \Symfony\Component\Process\Process
    {
        return new \Symfony\Component\Process\Process([
            'ffmpeg',
            '-y',
            '-i', $sourcePath,
            '-movflags', '+faststart',
            '-c', 'copy',
            $previewPath,
        ]);
    }

    private function makeStreamingPreviewTranscodeProcess(string $sourcePath, string $previewPath): \Symfony\Component\Process\Process
    {
        return new \Symfony\Component\Process\Process([
            'ffmpeg',
            '-y',
            '-i', $sourcePath,
            '-movflags', '+faststart',
            '-pix_fmt', 'yuv420p',
            '-c:v', 'libx264',
            '-preset', 'veryfast',
            '-crf', '28',
            '-maxrate', '1200k',
            '-bufsize', '2400k',
            '-vf', 'scale=\'min(1280,iw)\':-2',
            '-c:a', 'aac',
            '-b:a', '128k',
            $previewPath,
        ]);
    }
}
