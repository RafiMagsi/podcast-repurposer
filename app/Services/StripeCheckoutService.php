<?php

namespace App\Services;

use App\Models\BillingPurchase;
use App\Models\User;
use Illuminate\Http\Client\RequestException;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Arr;
use RuntimeException;

class StripeCheckoutService
{
    public function __construct(protected SettingService $settings)
    {
    }

    public function packageSummary(): array
    {
        return [
            'name' => (string) $this->settings->get('stripe_package_name', config('services.stripe.package_name', 'VoicePost AI Starter Pack')),
            'runs' => (int) $this->settings->get('stripe_package_runs', (string) config('services.stripe.package_runs', 100)),
            'price_usd' => (int) $this->settings->get('stripe_package_price_usd', (string) config('services.stripe.package_price_usd', 10)),
            'price_cents' => (int) $this->settings->get('stripe_package_price_cents', (string) config('services.stripe.package_price_cents', 1000)),
            'currency' => (string) $this->settings->get('stripe_currency', config('services.stripe.currency', 'usd')),
        ];
    }

    public function publishableKey(): string
    {
        return trim((string) $this->settings->get('stripe_publishable_key', config('services.stripe.publishable_key')));
    }

    public function createCheckoutSession(User $user): string
    {
        $secret = $this->secretKey();

        $package = $this->packageSummary();

        $successUrl = route('billing.page', ['checkout' => 'success'], false);
        $cancelUrl = route('billing.page', ['checkout' => 'cancelled'], false);

        try {
            $response = Http::asForm()
                ->withBasicAuth($secret, '')
                ->acceptJson()
                ->post('https://api.stripe.com/v1/checkout/sessions', [
                    'mode' => 'payment',
                    'success_url' => url($successUrl),
                    'cancel_url' => url($cancelUrl),
                    'client_reference_id' => (string) $user->id,
                    'customer_email' => $user->email,
                    'metadata[user_id]' => (string) $user->id,
                    'metadata[runs_purchased]' => (string) $package['runs'],
                    'metadata[package_name]' => $package['name'],
                    'line_items[0][quantity]' => 1,
                    'line_items[0][price_data][currency]' => $package['currency'],
                    'line_items[0][price_data][unit_amount]' => (string) $package['price_cents'],
                    'line_items[0][price_data][product_data][name]' => $package['name'],
                    'line_items[0][price_data][product_data][description]' => sprintf('%d VoicePost AI runs', $package['runs']),
                    'payment_intent_data[metadata][user_id]' => (string) $user->id,
                    'payment_intent_data[metadata][runs_purchased]' => (string) $package['runs'],
                ])
                ->throw();
        } catch (RequestException $exception) {
            Log::error('Stripe checkout session creation failed', [
                'user_id' => $user->id,
                'response' => $exception->response?->json(),
            ]);

            throw new RuntimeException('Unable to start Stripe checkout right now.');
        }

        $payload = $response->json();

        BillingPurchase::updateOrCreate(
            ['provider_session_id' => (string) ($payload['id'] ?? '')],
            [
                'user_id' => $user->id,
                'provider' => 'stripe',
                'provider_payment_status' => $payload['payment_status'] ?? 'unpaid',
                'status' => 'pending',
                'currency' => $package['currency'],
                'amount_cents' => $package['price_cents'],
                'runs_purchased' => $package['runs'],
                'payload' => $payload,
            ],
        );

        return (string) ($payload['url'] ?? '');
    }

    public function createPaymentIntent(User $user): array
    {
        $secret = $this->secretKey();
        $package = $this->packageSummary();

        try {
            $response = Http::asForm()
                ->withBasicAuth($secret, '')
                ->acceptJson()
                ->post('https://api.stripe.com/v1/payment_intents', [
                    'amount' => (string) $package['price_cents'],
                    'currency' => $package['currency'],
                    'automatic_payment_methods[enabled]' => 'false',
                    'payment_method_types[0]' => 'card',
                    'metadata[user_id]' => (string) $user->id,
                    'metadata[runs_purchased]' => (string) $package['runs'],
                    'metadata[package_name]' => $package['name'],
                ])
                ->throw();
        } catch (RequestException $exception) {
            Log::error('Stripe payment intent creation failed', [
                'user_id' => $user->id,
                'response' => $exception->response?->json(),
            ]);

            throw new RuntimeException('Unable to prepare Stripe payment right now.');
        }

        $payload = $response->json();
        $paymentIntentId = (string) ($payload['id'] ?? '');
        $clientSecret = (string) ($payload['client_secret'] ?? '');

        if ($paymentIntentId === '' || $clientSecret === '') {
            throw new RuntimeException('Stripe payment intent did not return the required payment details.');
        }

        BillingPurchase::updateOrCreate(
            ['provider_session_id' => $paymentIntentId],
            [
                'user_id' => $user->id,
                'provider' => 'stripe',
                'provider_payment_status' => $payload['status'] ?? 'requires_payment_method',
                'status' => 'pending',
                'currency' => $package['currency'],
                'amount_cents' => $package['price_cents'],
                'runs_purchased' => $package['runs'],
                'payload' => $payload,
            ],
        );

        return [
            'payment_intent_id' => $paymentIntentId,
            'client_secret' => $clientSecret,
        ];
    }

    public function finalizePaymentIntent(User $user, string $paymentIntentId): array
    {
        $secret = $this->secretKey();

        try {
            $response = Http::withBasicAuth($secret, '')
                ->acceptJson()
                ->get('https://api.stripe.com/v1/payment_intents/'.$paymentIntentId)
                ->throw();
        } catch (RequestException $exception) {
            Log::error('Stripe payment intent retrieval failed', [
                'user_id' => $user->id,
                'payment_intent_id' => $paymentIntentId,
                'response' => $exception->response?->json(),
            ]);

            throw new RuntimeException('Unable to verify Stripe payment right now.');
        }

        $paymentIntent = $response->json();
        $purchase = BillingPurchase::query()
            ->where('provider_session_id', $paymentIntentId)
            ->where('user_id', $user->id)
            ->first();

        if (! $purchase) {
            throw new RuntimeException('Stripe payment record was not found for this account.');
        }

        $status = (string) ($paymentIntent['status'] ?? '');

        if ($status !== 'succeeded') {
            if ($status === 'processing') {
                $purchase->forceFill([
                    'provider_payment_status' => $status,
                    'status' => 'pending',
                    'payload' => $paymentIntent,
                ])->save();

                return [
                    'status' => 'processing',
                    'message' => 'Payment is still processing. Your run balance will update after Stripe confirms the charge.',
                ];
            }

            $purchase->forceFill([
                'provider_payment_status' => $status ?: 'failed',
                'status' => 'failed',
                'payload' => $paymentIntent,
            ])->save();

            throw new RuntimeException('Stripe payment was not completed successfully.');
        }

        $this->fulfillPurchase($purchase, $paymentIntent);

        return [
            'status' => 'succeeded',
            'message' => 'Payment completed. Your run balance has been updated.',
            'run_limit' => (int) $purchase->user->fresh()->run_limit,
        ];
    }

    public function handleWebhook(string $payload, string $signature): void
    {
        $event = $this->verifyWebhookSignature($payload, $signature);

        if (! in_array($event['type'] ?? '', [
            'checkout.session.completed',
            'checkout.session.async_payment_succeeded',
            'payment_intent.succeeded',
            'payment_intent.payment_failed',
        ], true)) {
            return;
        }

        $object = $event['data']['object'] ?? [];

        if (($event['type'] ?? '') === 'payment_intent.payment_failed') {
            $paymentIntentId = (string) ($object['id'] ?? '');

            if ($paymentIntentId === '') {
                throw new RuntimeException('Missing Stripe payment intent ID.');
            }

            $purchase = BillingPurchase::query()
                ->where('provider_session_id', $paymentIntentId)
                ->first();

            if (! $purchase) {
                throw new RuntimeException('Stripe payment intent is not tracked locally.');
            }

            $purchase->forceFill([
                'provider_payment_status' => $object['status'] ?? 'failed',
                'status' => 'failed',
                'payload' => $object,
            ])->save();

            return;
        }

        $paymentReference = (string) Arr::get($object, 'payment_intent', Arr::get($object, 'id', ''));

        if ($paymentReference === '') {
            throw new RuntimeException('Missing Stripe payment reference.');
        }

        $purchase = BillingPurchase::query()
            ->where('provider_session_id', $paymentReference)
            ->first();

        if (! $purchase && str_starts_with($paymentReference, 'cs_')) {
            $purchase = BillingPurchase::query()
                ->where('provider_session_id', $paymentReference)
                ->first();
        }

        if (! $purchase) {
            throw new RuntimeException('Stripe payment reference is not tracked locally.');
        }

        $this->fulfillPurchase($purchase, $object);
    }

    protected function fulfillPurchase(BillingPurchase $purchase, array $payload): void
    {
        if ($purchase->status === 'fulfilled') {
            return;
        }

        $paymentStatus = (string) Arr::get($payload, 'payment_status', Arr::get($payload, 'status', $purchase->provider_payment_status));

        $purchase->forceFill([
            'provider_payment_status' => $paymentStatus,
            'status' => 'fulfilled',
            'payload' => $payload,
            'fulfilled_at' => now(),
        ])->save();

        $purchase->user()->increment('run_limit', $purchase->runs_purchased);
        $purchase->user()->update([
            'plan_price_usd' => round($purchase->amount_cents / 100, 2),
        ]);
    }

    protected function secretKey(): string
    {
        $secret = trim((string) $this->settings->get('stripe_secret_key', config('services.stripe.secret')));

        if ($secret === '') {
            throw new RuntimeException('Stripe is not configured.');
        }

        if (str_starts_with($secret, 'pk_')) {
            throw new RuntimeException('Stripe secret key is invalid. Use the Stripe secret key in admin settings, not the publishable key.');
        }

        return $secret;
    }

    protected function verifyWebhookSignature(string $payload, string $signatureHeader): array
    {
        $secret = (string) $this->settings->get('stripe_webhook_secret', config('services.stripe.webhook_secret'));

        if ($secret === '') {
            throw new RuntimeException('Stripe webhook secret is not configured.');
        }

        $parts = collect(explode(',', $signatureHeader))
            ->mapWithKeys(function ($part) {
                [$key, $value] = array_pad(explode('=', $part, 2), 2, null);

                return [$key => $value];
            });

        $timestamp = $parts->get('t');
        $signature = $parts->get('v1');

        if (! $timestamp || ! $signature) {
            throw new RuntimeException('Invalid Stripe signature header.');
        }

        if (abs(now()->timestamp - (int) $timestamp) > 300) {
            throw new RuntimeException('Stripe webhook timestamp is outside the tolerance window.');
        }

        $expected = hash_hmac('sha256', $timestamp.'.'.$payload, $secret);

        if (! hash_equals($expected, $signature)) {
            throw new RuntimeException('Stripe webhook signature verification failed.');
        }

        $decoded = json_decode($payload, true);

        if (! is_array($decoded)) {
            throw new RuntimeException('Invalid Stripe webhook payload.');
        }

        return $decoded;
    }
}
