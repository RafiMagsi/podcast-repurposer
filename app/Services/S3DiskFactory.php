<?php

namespace App\Services;

use Illuminate\Contracts\Filesystem\Filesystem;
use Illuminate\Support\Facades\Storage;
use RuntimeException;

class S3DiskFactory
{
    public function __construct(
        protected SettingService $settings
    ) {
    }

    public function make(): Filesystem
    {
        $key = $this->settings->get('aws_access_key_id');
        $secret = $this->settings->get('aws_secret_access_key');
        $region = $this->settings->get('aws_default_region');
        $bucket = $this->settings->get('aws_bucket');

        if (! $key || ! $secret || ! $region || ! $bucket) {
            throw new RuntimeException('S3 settings are incomplete.');
        }

        return Storage::build([
            'driver' => 's3',
            'key' => $key,
            'secret' => $secret,
            'region' => $region,
            'bucket' => $bucket,
            'url' => $this->settings->get('aws_url') ?: null,
            'endpoint' => $this->settings->get('aws_endpoint') ?: null,
            'use_path_style_endpoint' => filter_var(
                $this->settings->get('aws_use_path_style_endpoint', 'false'),
                FILTER_VALIDATE_BOOL
            ),
            'throw' => false,
        ]);
    }
}