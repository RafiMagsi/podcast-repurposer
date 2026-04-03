<?php

namespace App\Services;

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

        if ($shouldBypass) {
            Log::info('WhisperService bypassed OpenAI transcription for testing', [
                'content_request_id' => $contentRequest->id ?? null,
                'public_id' => $contentRequest->public_id ?? null,
            ]);

            return 'This is a mock transcript generated in testing mode. VoicePost AI bypassed the OpenAI transcription call and returned a local transcript placeholder so you can test the workflow without API usage.';
        }

        $apiKey = $this->settings->get('openai_api_key');

        if (! $apiKey) {
            throw new RuntimeException('Missing openai_api_key');
        }

        $this->assertMediaWithinDurationLimit($contentRequest, 60);

        Log::info('Media duration validated successfully', [
            'content_request_id' => $contentRequest->id,
            'input_type' => $contentRequest->input_type,
            'media_kind' => $contentRequest->media_kind,
            'mime_type' => $contentRequest->mime_type,
        ]);

        if (
            ($contentRequest->input_type === 'video' || $contentRequest->media_kind === 'video' || str_starts_with((string) $contentRequest->mime_type, 'video/'))
            && empty($contentRequest->thumbnail_path)
        ) {
            $thumbnailPath = $this->generateVideoThumbnail($contentRequest);

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

        $contentRequest->update([
            'compression_status' => 'started',
            'compression_error' => null,
        ]);

        $sourcePath = null;
        $compressedPath = null;

        try {
            [$sourcePath, $compressedPath] = $this->prepareCompressedAudio($contentRequest);

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

            if (($compressedSize ?? 0) > (25 * 1024 * 1024)) {
                throw new RuntimeException('Compressed audio is still larger than 25MB.');
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

            if (! $response->successful()) {
                throw new RuntimeException('OpenAI transcription failed: ' . $response->body());
            }

            $payload = $response->json();

            Log::info('OpenAI response debug:payload', [
                'status' => $response->status(),
                'text'   => $payload,
            ]);

            $text = data_get($payload, 'full_response.text')           // ✅ your actual structure
                ?? data_get($payload, 'text')                          // fallback: raw OpenAI response
                ?? data_get($payload, 'output.0.content.0.text')       // Responses API format
                ?? data_get($payload, 'output_text')                   // another fallback
                ?? data_get($payload, 'results.0.alternatives.0.transcript'); // just in case

            Log::info('OpenAI response debug', [
                'status' => $response->status(),
                'text'   => $text,
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

    public function assertMediaWithinDurationLimit(ContentRequest $contentRequest, int $maxSeconds = 60): void
    {
        $disk = $this->s3DiskFactory->make();

        if (! $disk->exists($contentRequest->file_path)) {
            throw new \RuntimeException('Source file was not found in storage.');
        }

        $tmpSource = tempnam(sys_get_temp_dir(), 'cr_src_');

        if ($tmpSource === false) {
            throw new \RuntimeException('Unable to create temporary file for duration check.');
        }

        file_put_contents($tmpSource, $disk->get($contentRequest->file_path));

        $process = new \Symfony\Component\Process\Process([
            'ffprobe',
            '-v', 'error',
            '-show_entries', 'format=duration',
            '-of', 'default=noprint_wrappers=1:nokey=1',
            $tmpSource,
        ]);

        $process->setTimeout(120);
        $process->run();

        @unlink($tmpSource);

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
    }

    private function prepareCompressedAudio(ContentRequest $contentRequest): array
    {
        $disk = $this->s3DiskFactory->make();

        if (! $disk->exists($contentRequest->file_path)) {
            throw new \RuntimeException('Source file was not found in storage.');
        }

        $sourcePath = tempnam(sys_get_temp_dir(), 'cr_src_');

        if ($sourcePath === false) {
            throw new \RuntimeException('Unable to create source temp file.');
        }

        file_put_contents($sourcePath, $disk->get($contentRequest->file_path));

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
            @unlink($sourcePath);
            @unlink($outputPath);

            throw new \RuntimeException('Unable to extract and compress audio from source.');
        }

        return [$sourcePath, $outputPath];
    }

    private function generateVideoThumbnail(ContentRequest $contentRequest): ?string
    {
        if (
            $contentRequest->input_type !== 'video' &&
            $contentRequest->media_kind !== 'video' &&
            !str_starts_with((string) $contentRequest->mime_type, 'video/')
        ) {
            return null;
        }

        $disk = $this->s3DiskFactory->make();

        if (! $disk->exists($contentRequest->file_path)) {
            return null;
        }

        $sourcePath = tempnam(sys_get_temp_dir(), 'cr_vid_');
        if ($sourcePath === false) {
            return null;
        }

        file_put_contents($sourcePath, $disk->get($contentRequest->file_path));

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
            @unlink($sourcePath);
            @unlink($thumbPath);
            return null;
        }

        $storedThumbPath = 'content-request-thumbnails/' . now()->format('Y/m') . '/' . uniqid('thumb_', true) . '.jpg';

        $disk->put($storedThumbPath, file_get_contents($thumbPath));

        @unlink($sourcePath);
        @unlink($thumbPath);

        return $storedThumbPath;
    }
}
