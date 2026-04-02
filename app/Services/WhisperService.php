<?php

namespace App\Services;

use App\Models\Episode;
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

    public function transcribe(Episode $episode): string
    {
        Log::info('WhisperService transcribe started', [
            'episode_id' => $episode->id,
            'public_id' => $episode->public_id,
            's3_path' => $episode->file_path,
        ]);

        $apiKey = $this->settings->get('openai_api_key');

        if (! $apiKey) {
            throw new RuntimeException('Missing openai_api_key');
        }

        $disk = $this->s3DiskFactory->make();

        $stream = $disk->readStream($episode->file_path);

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
            'episode_id' => $episode->id,
            'temp_path' => $tempPath,
        ]);

        stream_copy_to_stream($stream, $tempFile);

        fclose($stream);
        fclose($tempFile);

        $originalSize = file_exists($tempPath) ? filesize($tempPath) : null;

        Log::info('Original temp audio file ready', [
            'episode_id' => $episode->id,
            'temp_path' => $tempPath,
            'original_size' => $originalSize,
        ]);

        $episode->update([
            'compression_status' => 'started',
            'compression_error' => null,
        ]);

        $compressedPath = null;

        try {
            $compressionResult = $this->audioCompressionService->compressForTranscription($tempPath);

            $compressedPath = $compressionResult['path'];
            $compressedSize = $compressionResult['size'];

            $episode->update([
                'compressed_file_size' => $compressedSize,
                'compression_status' => 'completed',
                'compression_error' => null,
            ]);

            Log::info('Compressed file ready for transcription', [
                'episode_id' => $episode->id,
                'compressed_path' => $compressedPath,
                'compressed_size' => $compressedSize,
            ]);

            if ($compressedSize > (25 * 1024 * 1024)) {
                throw new RuntimeException('Compressed audio is still larger than 5MB.');
            }

            Log::info('Sending file to OpenAI transcription API', [
                'episode_id' => $episode->id,
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
                'episode_id' => $episode->id,
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
                'episode_id' => $episode->id,
                'text_length' => strlen($text),
            ]);

            return trim($text);
        } catch (\Throwable $e) {
            $episode->update([
                'compression_status' => 'failed',
                'compression_error' => $e->getMessage(),
            ]);

            Log::error('WhisperService failed', [
                'episode_id' => $episode->id,
                'message' => $e->getMessage(),
            ]);

            throw $e;
        } finally {
            if (file_exists($tempPath)) {
                @unlink($tempPath);

                Log::info('Original temp file deleted', [
                    'episode_id' => $episode->id,
                    'temp_path' => $tempPath,
                ]);
            }

            if ($compressedPath && file_exists($compressedPath)) {
                @unlink($compressedPath);

                Log::info('Compressed temp file deleted', [
                    'episode_id' => $episode->id,
                    'compressed_path' => $compressedPath,
                ]);
            }
        }
    }
}