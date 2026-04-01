<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;
use RuntimeException;

class AudioCompressionService
{
    public function compressForTranscription(string $inputPath): array
    {
        Log::info('AudioCompressionService started', [
            'input_path' => $inputPath,
            'original_size' => file_exists($inputPath) ? filesize($inputPath) : null,
        ]);

        if (! file_exists($inputPath)) {
            throw new RuntimeException('Input file does not exist for compression.');
        }

        $outputPath = tempnam(sys_get_temp_dir(), 'episode_compressed_');

        if (! $outputPath) {
            throw new RuntimeException('Unable to create compressed temp file.');
        }

        $finalOutputPath = $outputPath . '.mp3';

        @unlink($outputPath);

        $command = sprintf(
            'ffmpeg -y -i %s -vn -ac 1 -ar 16000 -b:a 32k %s 2>&1',
            escapeshellarg($inputPath),
            escapeshellarg($finalOutputPath)
        );

        Log::info('Running FFmpeg compression', [
            'command' => $command,
            'output_path' => $finalOutputPath,
        ]);

        exec($command, $output, $exitCode);

        Log::info('FFmpeg process completed', [
            'exit_code' => $exitCode,
            'output' => $output,
        ]);

        if ($exitCode !== 0 || ! file_exists($finalOutputPath)) {
            throw new RuntimeException('FFmpeg compression failed: ' . implode("\n", $output));
        }

        $compressedSize = filesize($finalOutputPath);

        Log::info('Audio compression completed successfully', [
            'output_path' => $finalOutputPath,
            'compressed_size' => $compressedSize,
        ]);

        return [
            'path' => $finalOutputPath,
            'size' => $compressedSize,
        ];
    }
}