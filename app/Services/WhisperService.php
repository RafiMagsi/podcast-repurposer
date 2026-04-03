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

        $disk = $this->s3DiskFactory->make();

        $stream = $disk->readStream($contentRequest->file_path);

        if (! $stream) {
            throw new RuntimeException('Unable to read audio file from S3.');
        }

        $tempPath = tempnam(sys_get_temp_dir(), 'episode_audio_');

        if (! $tempPath) {
            if (is_resource($stream)) {
                fclose($stream);
            }

            throw new RuntimeException('Unable to create temporary file.');
        }

        $tempFile = fopen($tempPath, 'w+b');

        if (! $tempFile) {
            if (is_resource($stream)) {
                fclose($stream);
            }

            throw new RuntimeException('Unable to open temporary file.');
        }

        Log::info('Copying S3 stream into temporary file', [
            'content_request_id' => $contentRequest->id,
            'temp_path' => $tempPath,
        ]);

        stream_copy_to_stream($stream, $tempFile);

        fclose($stream);
        fclose($tempFile);

        $originalSize = file_exists($tempPath) ? filesize($tempPath) : null;

        Log::info('Original temp audio file ready', [
            'content_request_id' => $contentRequest->id,
            'temp_path' => $tempPath,
            'original_size' => $originalSize,
        ]);

        $contentRequest->update([
            'compression_status' => 'started',
            'compression_error' => null,
        ]);

        $compressedPath = null;

        try {
            $compressionResult = $this->audioCompressionService->compressForTranscription($tempPath);

            $compressedPath = $compressionResult['path'];
            $compressedSize = $compressionResult['size'];

            $contentRequest->update([
                'compressed_file_size' => $compressedSize,
                'compression_status' => 'completed',
                'compression_error' => null,
            ]);

            Log::info('Compressed file ready for transcription', [
                'content_request_id' => $contentRequest->id,
                'compressed_path' => $compressedPath,
                'compressed_size' => $compressedSize,
            ]);

            if ($compressedSize > (25 * 1024 * 1024)) {
                throw new RuntimeException('Compressed audio is still larger than 5MB.');
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

            $text = $response->json('text');

            if (! $text) {
                throw new RuntimeException('OpenAI transcription returned empty text.');
            }

            $text = data_get($response->json(), 'output.0.content.0.text')
            ?? data_get($response->json(), 'output_text');

            Log::info('OpenAI response debug', [
                'status' => $response->status(),
                'text' => $text,
                'full_response' => $response->json(),
            ]);

            Log::info('OpenAI transcription text extracted successfully', [
                'content_request_id' => $contentRequest->id,
                'text_length' => strlen($text),
            ]);

            return trim($text);
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
            if (file_exists($tempPath)) {
                @unlink($tempPath);

                Log::info('Original temp file deleted', [
                    'content_request_id' => $contentRequest->id,
                    'temp_path' => $tempPath,
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
}
