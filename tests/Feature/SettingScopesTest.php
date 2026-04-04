<?php

use App\Models\User;
use App\Services\SettingService;

it('stores and retrieves project settings by default', function () {
    $service = app(SettingService::class);

    $service->setProject('openai_api_key', 'project-openai-key', 'string', true);

    expect($service->get('openai_api_key'))->toBe('project-openai-key');
    expect($service->getProject('openai_api_key'))->toBe('project-openai-key');
});

it('allows future user overrides while still falling back to project settings', function () {
    $service = app(SettingService::class);
    $user = User::factory()->create();

    $service->setProject('openai_api_key', 'project-openai-key', 'string', true);

    expect($service->getForUser($user, 'openai_api_key'))->toBe('project-openai-key');

    $service->setForUser($user, 'openai_api_key', 'user-openai-key', 'string', true);

    expect($service->getForUser($user, 'openai_api_key'))->toBe('user-openai-key');
    expect($service->getProject('openai_api_key'))->toBe('project-openai-key');
});
