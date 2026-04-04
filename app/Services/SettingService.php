<?php

namespace App\Services;

use App\Models\Setting;
use App\Models\User;
use Illuminate\Support\Facades\Crypt;

class SettingService
{
    public function get(string $key, $default = null, User|int|null $user = null, bool $allowUserFallback = true)
    {
        if ($allowUserFallback && $user !== null) {
            $userSetting = $this->resolveSetting($key, 'user', $this->resolveScopeId($user));

            if ($userSetting && $userSetting->value !== null) {
                return $this->readValue($userSetting, $default);
            }
        }

        $setting = $this->resolveSetting($key, 'project', 0);

        if (! $setting || $setting->value === null) {
            return $default;
        }

        return $this->readValue($setting, $default);
    }

    public function set(string $key, ?string $value, ?string $type = null, bool $encrypted = true, User|int|null $user = null): Setting
    {
        $storedValue = $value;

        if ($value !== null && $encrypted) {
            $storedValue = Crypt::encryptString($value);
        }

        return Setting::updateOrCreate(
            [
                'scope_type' => $user !== null ? 'user' : 'project',
                'scope_id' => $user !== null ? $this->resolveScopeId($user) : 0,
                'key' => $key,
            ],
            [
                'scope_type' => $user !== null ? 'user' : 'project',
                'scope_id' => $user !== null ? $this->resolveScopeId($user) : 0,
                'value' => $storedValue,
                'type' => $type,
                'is_encrypted' => $encrypted,
            ]
        );
    }

    public function has(string $key, User|int|null $user = null, bool $allowUserFallback = true): bool
    {
        if ($allowUserFallback && $user !== null && $this->resolveSetting($key, 'user', $this->resolveScopeId($user))) {
            return true;
        }

        return $this->resolveSetting($key, 'project', 0) !== null;
    }

    public function getProject(string $key, $default = null)
    {
        return $this->get($key, $default, null, false);
    }

    public function setProject(string $key, ?string $value, ?string $type = null, bool $encrypted = true): Setting
    {
        return $this->set($key, $value, $type, $encrypted, null);
    }

    public function hasProject(string $key): bool
    {
        return $this->has($key, null, false);
    }

    public function getForUser(User|int $user, string $key, $default = null, bool $fallbackToProject = true)
    {
        return $this->get($key, $default, $user, $fallbackToProject);
    }

    public function setForUser(User|int $user, string $key, ?string $value, ?string $type = null, bool $encrypted = true): Setting
    {
        return $this->set($key, $value, $type, $encrypted, $user);
    }

    protected function resolveSetting(string $key, string $scopeType, int $scopeId): ?Setting
    {
        return Setting::query()
            ->where('scope_type', $scopeType)
            ->where('scope_id', $scopeId)
            ->where('key', $key)
            ->first();
    }

    protected function readValue(Setting $setting, mixed $default): mixed
    {
        if ($setting->is_encrypted) {
            try {
                return Crypt::decryptString($setting->value);
            } catch (\Throwable $e) {
                return $default;
            }
        }

        return $setting->value;
    }

    protected function resolveScopeId(User|int $user): int
    {
        return $user instanceof User ? (int) $user->getKey() : (int) $user;
    }
}
