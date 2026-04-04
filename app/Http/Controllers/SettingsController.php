<?php

namespace App\Http\Controllers;

use App\Services\SettingService;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SettingsController extends Controller
{
    public function index(SettingService $settings): Response
    {
        $user = request()->user();
        $canManageSystemSettings = (bool) $user?->is_admin;
        $scopeType = $canManageSystemSettings ? request()->string('scope_type')->toString() : 'project';
        $scopeType = in_array($scopeType, ['project', 'user'], true) ? $scopeType : 'project';
        $scopeUserId = $canManageSystemSettings && $scopeType === 'user'
            ? (int) request()->integer('scope_user_id')
            : null;
        $scopeUser = $scopeUserId
            ? User::query()->select('id', 'name', 'email')->find($scopeUserId)
            : null;
        $targetScopeUser = $scopeType === 'user' && $scopeUser ? $scopeUser : null;

        $getScoped = fn (string $key, mixed $default = null) => $targetScopeUser
            ? $settings->getForUser($targetScopeUser, $key, $default)
            : $settings->getProject($key, $default);
        $hasScoped = fn (string $key) => $targetScopeUser
            ? $settings->has($key, $targetScopeUser)
            : $settings->hasProject($key);

        return Inertia::render('Settings/Index', [
            'canManageSystemSettings' => $canManageSystemSettings,
            'settingScope' => [
                'type' => $targetScopeUser ? 'user' : 'project',
                'user_id' => $targetScopeUser?->id,
                'label' => $targetScopeUser
                    ? sprintf('%s (%s)', $targetScopeUser->name, $targetScopeUser->email)
                    : 'Project Default',
                'uses_project_defaults' => ! $targetScopeUser,
            ],
            'scopeUsers' => $canManageSystemSettings
                ? User::query()
                    ->select('id', 'name', 'email')
                    ->orderBy('name')
                    ->limit(100)
                    ->get()
                    ->map(fn (User $scopeCandidate) => [
                        'id' => $scopeCandidate->id,
                        'label' => sprintf('%s (%s)', $scopeCandidate->name, $scopeCandidate->email),
                    ])
                    ->values()
                    ->all()
                : [],
            'settings' => [
                'openai_api_key' => $canManageSystemSettings ? '' : null,
                'claude_api_key' => $canManageSystemSettings ? '' : null,
                'aws_access_key_id' => $canManageSystemSettings ? '' : null,
                'aws_secret_access_key' => $canManageSystemSettings ? '' : null,
                'aws_default_region' => $canManageSystemSettings ? $getScoped('aws_default_region', '') : null,
                'aws_bucket' => $canManageSystemSettings ? $getScoped('aws_bucket', '') : null,
                'aws_url' => $canManageSystemSettings ? $getScoped('aws_url', '') : null,
                'aws_endpoint' => $canManageSystemSettings ? $getScoped('aws_endpoint', '') : null,
                'aws_use_path_style_endpoint' => $canManageSystemSettings ? $getScoped('aws_use_path_style_endpoint', 'false') : null,
                'bypass_openai_for_testing' => $canManageSystemSettings ? $getScoped('bypass_openai_for_testing', 'false') : null,
                'stripe_secret_key' => $canManageSystemSettings ? '' : null,
                'stripe_publishable_key' => $canManageSystemSettings ? '' : null,
                'stripe_webhook_secret' => $canManageSystemSettings ? '' : null,
                'stripe_package_name' => $canManageSystemSettings ? $getScoped('stripe_package_name', (string) config('services.stripe.package_name', 'VoicePost AI Starter Pack')) : null,
                'stripe_package_runs' => $canManageSystemSettings ? $getScoped('stripe_package_runs', (string) config('services.stripe.package_runs', 100)) : null,
                'stripe_package_price_usd' => $canManageSystemSettings ? $getScoped('stripe_package_price_usd', (string) config('services.stripe.package_price_usd', 10)) : null,
                'stripe_package_price_cents' => $canManageSystemSettings ? $getScoped('stripe_package_price_cents', (string) config('services.stripe.package_price_cents', 1000)) : null,
                'stripe_currency' => $canManageSystemSettings ? $getScoped('stripe_currency', (string) config('services.stripe.currency', 'usd')) : null,
                'has_openai_api_key' => $canManageSystemSettings ? $hasScoped('openai_api_key') : false,
                'has_claude_api_key' => $canManageSystemSettings ? $hasScoped('claude_api_key') : false,
                'has_aws_access_key_id' => $canManageSystemSettings ? $hasScoped('aws_access_key_id') : false,
                'has_aws_secret_access_key' => $canManageSystemSettings ? $hasScoped('aws_secret_access_key') : false,
                'has_stripe_secret_key' => $canManageSystemSettings ? $hasScoped('stripe_secret_key') : false,
                'has_stripe_publishable_key' => $canManageSystemSettings ? $hasScoped('stripe_publishable_key') : false,
                'has_stripe_webhook_secret' => $canManageSystemSettings ? $hasScoped('stripe_webhook_secret') : false,
            ],
            'billing' => [
                'run_limit' => (int) ($user?->run_limit ?? 0),
                'plan_price_usd' => (float) ($user?->plan_price_usd ?? 0),
                'recent_purchases' => $user
                    ? $user->billingPurchases()
                        ->latest()
                        ->limit(5)
                        ->get()
                        ->map(fn ($purchase) => [
                            'id' => $purchase->id,
                            'status' => $purchase->status,
                            'runs_purchased' => $purchase->runs_purchased,
                            'amount_cents' => $purchase->amount_cents,
                            'currency' => strtoupper($purchase->currency),
                            'fulfilled_at' => optional($purchase->fulfilled_at)->toDateTimeString(),
                            'created_at' => optional($purchase->created_at)->toDateTimeString(),
                        ])
                        ->values()
                        ->all()
                    : [],
                'package_runs' => (int) config('services.stripe.package_runs', 100),
                'package_price_usd' => (int) config('services.stripe.package_price_usd', 10),
            ],
        ]);
    }

    public function update(Request $request, SettingService $settings): RedirectResponse
    {
        abort_unless($request->user()?->is_admin, 403);

        $validated = $request->validate([
            'scope_type' => ['required', 'in:project,user'],
            'scope_user_id' => ['nullable', 'required_if:scope_type,user', 'integer', 'exists:users,id'],
            'openai_api_key' => ['nullable', 'string'],
            'claude_api_key' => ['nullable', 'string'],
            'aws_access_key_id' => ['nullable', 'string'],
            'aws_secret_access_key' => ['nullable', 'string'],
            'aws_default_region' => ['nullable', 'string'],
            'aws_bucket' => ['nullable', 'string'],
            'aws_url' => ['nullable', 'string'],
            'aws_endpoint' => ['nullable', 'string'],
            'aws_use_path_style_endpoint' => ['nullable', 'in:true,false,1,0'],
            'bypass_openai_for_testing' => ['nullable', 'in:true,false,1,0'],
            'stripe_secret_key' => ['nullable', 'string', 'starts_with:sk_'],
            'stripe_publishable_key' => ['nullable', 'string', 'starts_with:pk_'],
            'stripe_webhook_secret' => ['nullable', 'string', 'starts_with:whsec_'],
            'stripe_package_name' => ['nullable', 'string'],
            'stripe_package_runs' => ['nullable', 'integer', 'min:1'],
            'stripe_package_price_usd' => ['nullable', 'integer', 'min:1'],
            'stripe_package_price_cents' => ['nullable', 'integer', 'min:1'],
            'stripe_currency' => ['nullable', 'string', 'max:10'],
        ]);

        $scopeUser = $validated['scope_type'] === 'user'
            ? User::query()->findOrFail($validated['scope_user_id'] ?? 0)
            : null;

        $secretKeys = [
            'openai_api_key',
            'claude_api_key',
            'aws_access_key_id',
            'aws_secret_access_key',
            'stripe_secret_key',
            'stripe_publishable_key',
            'stripe_webhook_secret',
        ];

        foreach ($validated as $key => $value) {
            if (in_array($key, ['scope_type', 'scope_user_id'], true)) {
                continue;
            }

            if (in_array($key, $secretKeys, true)) {
                if ($value !== null && trim($value) !== '') {
                    $scopeUser
                        ? $settings->setForUser($scopeUser, $key, $value, 'string', true)
                        : $settings->setProject($key, $value, 'string', true);
                }

                continue;
            }

            $scopeUser
                ? $settings->setForUser($scopeUser, $key, $value, 'string', false)
                : $settings->setProject($key, $value, 'string', false);
        }

        return redirect()
            ->route('settings.index', array_filter([
                'scope_type' => $scopeUser ? 'user' : 'project',
                'scope_user_id' => $scopeUser?->id,
            ]))
            ->with('success', 'Settings updated successfully.');
    }
}
