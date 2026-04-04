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

it('does not expose system configuration payload to non-admin users', function () {
    $user = User::factory()->create(['is_admin' => false]);

    $this->actingAs($user)
        ->get(route('settings.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('canManageSystemSettings', false)
            ->where('settings.openai_api_key', null)
            ->where('settings.stripe_secret_key', null)
        );
});

it('does not expose saved secrets to the frontend settings payload', function () {
    $user = User::factory()->create(['is_admin' => true]);

    Setting::updateOrCreate(['key' => 'openai_api_key'], [
        'scope_type' => 'project',
        'scope_id' => 0,
        'key' => 'openai_api_key',
        'value' => Crypt::encryptString('super-secret-openai-key'),
        'type' => 'string',
        'is_encrypted' => true,
    ]);

    $response = $this->actingAs($user)
        ->get(route('settings.index'));

    $response->assertOk()->assertInertia(fn ($page) => $page
        ->where('settings.openai_api_key', '')
        ->where('settings.has_openai_api_key', true)
    );

    $response->assertDontSee('super-secret-openai-key');
});

it('saves encrypted provider and stripe keys for admins', function () {
    $this->withoutMiddleware();

    $user = User::factory()->create(['is_admin' => true]);

    $this->actingAs($user)->post(route('settings.update'), [
        'openai_api_key' => 'openai-test-key',
        'claude_api_key' => 'claude-test-key',
        'stripe_secret_key' => 'sk_test_value',
        'stripe_webhook_secret' => 'whsec_test_value',
    ])->assertRedirect(route('settings.index'));

    $openAi = Setting::where('key', 'openai_api_key')->first();
    $claude = Setting::where('key', 'claude_api_key')->first();
    $stripeSecret = Setting::where('key', 'stripe_secret_key')->first();
    $stripeWebhook = Setting::where('key', 'stripe_webhook_secret')->first();

    expect($openAi)->not->toBeNull();
    expect($claude)->not->toBeNull();
    expect($stripeSecret)->not->toBeNull();
    expect($stripeWebhook)->not->toBeNull();

    expect($openAi->value)->not->toBe('openai-test-key');
    expect($claude->value)->not->toBe('claude-test-key');
    expect($stripeSecret->value)->not->toBe('sk_test_value');
    expect($stripeWebhook->value)->not->toBe('whsec_test_value');

    expect(Crypt::decryptString($openAi->value))->toBe('openai-test-key');
    expect(Crypt::decryptString($claude->value))->toBe('claude-test-key');
    expect(Crypt::decryptString($stripeSecret->value))->toBe('sk_test_value');
    expect(Crypt::decryptString($stripeWebhook->value))->toBe('whsec_test_value');
});

it('keeps existing encrypted secrets when a blank settings save is submitted', function () {
    $this->withoutMiddleware();

    $user = User::factory()->create(['is_admin' => true]);

    Setting::updateOrCreate(['key' => 'openai_api_key'], [
        'scope_type' => 'project',
        'scope_id' => 0,
        'key' => 'openai_api_key',
        'value' => Crypt::encryptString('existing-openai-key'),
        'type' => 'string',
        'is_encrypted' => true,
    ]);

    $this->actingAs($user)->post(route('settings.update'), [
        'openai_api_key' => '',
        'aws_default_region' => 'us-east-1',
    ])->assertRedirect(route('settings.index'));

    $openAi = Setting::where('key', 'openai_api_key')->first();

    expect($openAi)->not->toBeNull();
    expect(Crypt::decryptString($openAi->value))->toBe('existing-openai-key');
});

it('blocks non-admin users from updating system settings', function () {
    $this->withoutMiddleware();

    $user = User::factory()->create(['is_admin' => false]);

    $this->actingAs($user)->post(route('settings.update'), [
        'openai_api_key' => 'openai-test-key',
    ])->assertForbidden();
});
