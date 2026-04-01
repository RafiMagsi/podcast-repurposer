<?php

use App\Models\User;
use App\Models\Setting;
use Illuminate\Support\Facades\Crypt;

it('redirects guests from settings page', function () {
    $this->get(route('settings.index'))
        ->assertRedirect(route('login'));
});

it('allows authenticated users to view settings page', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get(route('settings.index'))
        ->assertOk();
});

it('saves encrypted provider keys', function () {
    $user = User::factory()->create();

    $this->actingAs($user)->post(route('settings.update'), [
        'openai_api_key' => 'openai-test-key',
        'claude_api_key' => 'claude-test-key',
    ])->assertRedirect(route('settings.index'));

    $openAi = Setting::where('key', 'openai_api_key')->first();
    $claude = Setting::where('key', 'claude_api_key')->first();

    expect($openAi)->not->toBeNull();
    expect($claude)->not->toBeNull();

    expect($openAi->value)->not->toBe('openai-test-key');
    expect($claude->value)->not->toBe('claude-test-key');

    expect(Crypt::decryptString($openAi->value))->toBe('openai-test-key');
    expect(Crypt::decryptString($claude->value))->toBe('claude-test-key');
});