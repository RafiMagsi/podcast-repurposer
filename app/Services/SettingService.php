<?php

namespace App\Services;

use App\Models\Setting;
use Illuminate\Support\Facades\Crypt;

class SettingService
{
    public function get(string $key, $default = null)
    {
        $setting = Setting::where('key', $key)->first();

        if (! $setting || $setting->value === null) {
            return $default;
        }

        if ($setting->is_encrypted) {
            try {
                return Crypt::decryptString($setting->value);
            } catch (\Throwable $e) {
                return $default;
            }
        }

        return $setting->value;
    }

    public function set(string $key, ?string $value, ?string $type = null, bool $encrypted = true): Setting
    {
        $storedValue = $value;

        if ($value !== null && $encrypted) {
            $storedValue = Crypt::encryptString($value);
        }

        return Setting::updateOrCreate(
            ['key' => $key],
            [
                'value' => $storedValue,
                'type' => $type,
                'is_encrypted' => $encrypted,
            ]
        );
    }

    public function has(string $key): bool
    {
        return Setting::where('key', $key)->exists();
    }
}