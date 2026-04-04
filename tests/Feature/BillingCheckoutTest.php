<?php

use App\Models\BillingPurchase;
use App\Models\User;
use Illuminate\Support\Facades\Http;

it('creates a stripe checkout session for an authenticated user', function () {
    $this->withoutMiddleware();

    config()->set('services.stripe.secret', 'sk_test_123');
    config()->set('services.stripe.package_runs', 100);
    config()->set('services.stripe.package_price_cents', 1000);
    config()->set('services.stripe.package_price_usd', 10);

    Http::fake([
        'https://api.stripe.com/v1/checkout/sessions' => Http::response([
            'id' => 'cs_test_123',
            'url' => 'https://checkout.stripe.com/c/pay/cs_test_123',
            'payment_status' => 'unpaid',
        ], 200),
    ]);

    $user = User::factory()->create([
        'run_limit' => 100,
        'plan_price_usd' => 10,
    ]);

    $response = $this
        ->actingAs($user)
        ->post(route('billing.checkout'));

    $response->assertRedirect('https://checkout.stripe.com/c/pay/cs_test_123');

    $purchase = BillingPurchase::query()->where('provider_session_id', 'cs_test_123')->first();

    expect($purchase)->not->toBeNull();
    expect($purchase->user_id)->toBe($user->id);
    expect($purchase->runs_purchased)->toBe(100);
    expect($purchase->amount_cents)->toBe(1000);
    expect($purchase->status)->toBe('pending');
});

it('shows the dedicated billing page for authenticated users', function () {
    $user = User::factory()->create([
        'run_limit' => 25,
        'plan_price_usd' => 10,
    ]);

    $this->actingAs($user)
        ->get(route('billing.page'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Billing/Checkout')
            ->where('billing.run_limit', 25)
            ->where('billing.publishable_key', app(\App\Services\StripeCheckoutService::class)->publishableKey())
        );
});

it('creates a stripe payment intent for the embedded payment page', function () {
    $this->withoutMiddleware();

    config()->set('services.stripe.secret', 'sk_test_123');
    config()->set('services.stripe.package_runs', 100);
    config()->set('services.stripe.package_price_cents', 1000);
    config()->set('services.stripe.package_price_usd', 10);

    Http::fake([
        'https://api.stripe.com/v1/payment_intents' => Http::response([
            'id' => 'pi_test_123',
            'client_secret' => 'pi_test_123_secret_456',
            'status' => 'requires_payment_method',
        ], 200),
    ]);

    $user = User::factory()->create();

    $response = $this
        ->actingAs($user)
        ->postJson(route('billing.payment-intent'));

    $response
        ->assertOk()
        ->assertJson([
            'payment_intent_id' => 'pi_test_123',
            'client_secret' => 'pi_test_123_secret_456',
        ]);

    $purchase = BillingPurchase::query()->where('provider_session_id', 'pi_test_123')->first();

    expect($purchase)->not->toBeNull();
    expect($purchase->status)->toBe('pending');
    expect($purchase->runs_purchased)->toBe(100);
});

it('finalizes a succeeded stripe payment intent and credits runs immediately', function () {
    $this->withoutMiddleware();

    config()->set('services.stripe.secret', 'sk_test_123');

    Http::fake([
        'https://api.stripe.com/v1/payment_intents/pi_test_final_123' => Http::response([
            'id' => 'pi_test_final_123',
            'status' => 'succeeded',
        ], 200),
    ]);

    $user = User::factory()->create([
        'run_limit' => 0,
        'plan_price_usd' => 0,
    ]);

    BillingPurchase::create([
        'user_id' => $user->id,
        'provider' => 'stripe',
        'provider_session_id' => 'pi_test_final_123',
        'provider_payment_status' => 'requires_payment_method',
        'status' => 'pending',
        'currency' => 'usd',
        'amount_cents' => 1000,
        'runs_purchased' => 100,
    ]);

    $response = $this
        ->actingAs($user)
        ->postJson(route('billing.payment-intent.finalize'), [
            'payment_intent_id' => 'pi_test_final_123',
        ]);

    $response
        ->assertOk()
        ->assertJson([
            'status' => 'succeeded',
            'run_limit' => 100,
        ]);

    expect($user->fresh()->run_limit)->toBe(100);
    expect($user->fresh()->plan_price_usd)->toBe('10.00');
});

it('starts checkout from a browser get request', function () {
    config()->set('services.stripe.secret', 'sk_test_123');
    config()->set('services.stripe.package_runs', 100);
    config()->set('services.stripe.package_price_cents', 1000);
    config()->set('services.stripe.package_price_usd', 10);

    Http::fake([
        'https://api.stripe.com/v1/checkout/sessions' => Http::response([
            'id' => 'cs_test_get_123',
            'url' => 'https://checkout.stripe.com/c/pay/cs_test_get_123',
            'payment_status' => 'unpaid',
        ], 200),
    ]);

    $user = User::factory()->create();

    $response = $this
        ->actingAs($user)
        ->get(route('billing.start'));

    $response->assertRedirect('https://checkout.stripe.com/c/pay/cs_test_get_123');
});

it('returns an inertia location response for checkout from inertia pages', function () {
    $this->withoutMiddleware();

    config()->set('services.stripe.secret', 'sk_test_123');
    config()->set('services.stripe.package_runs', 100);
    config()->set('services.stripe.package_price_cents', 1000);
    config()->set('services.stripe.package_price_usd', 10);

    Http::fake([
        'https://api.stripe.com/v1/checkout/sessions' => Http::response([
            'id' => 'cs_test_789',
            'url' => 'https://checkout.stripe.com/c/pay/cs_test_789',
            'payment_status' => 'unpaid',
        ], 200),
    ]);

    $user = User::factory()->create();

    $response = $this
        ->actingAs($user)
        ->withHeader('X-Inertia', 'true')
        ->post(route('billing.checkout'));

    $response
        ->assertStatus(409)
        ->assertHeader('X-Inertia-Location', 'https://checkout.stripe.com/c/pay/cs_test_789');
});

it('fulfills a stripe checkout session by webhook and adds runs once', function () {
    config()->set('services.stripe.webhook_secret', 'whsec_test_123');

    $user = User::factory()->create([
        'run_limit' => 100,
        'plan_price_usd' => 10,
    ]);

    BillingPurchase::create([
        'user_id' => $user->id,
        'provider' => 'stripe',
        'provider_session_id' => 'cs_test_456',
        'provider_payment_status' => 'unpaid',
        'status' => 'pending',
        'currency' => 'usd',
        'amount_cents' => 1000,
        'runs_purchased' => 100,
    ]);

    $payload = json_encode([
        'type' => 'checkout.session.completed',
        'data' => [
            'object' => [
                'id' => 'cs_test_456',
                'payment_status' => 'paid',
            ],
        ],
    ], JSON_THROW_ON_ERROR);

    $timestamp = (string) now()->timestamp;
    $signature = hash_hmac('sha256', $timestamp.'.'.$payload, 'whsec_test_123');

    $response = $this->call(
        'POST',
        route('billing.stripe.webhook'),
        [],
        [],
        [],
        [
            'CONTENT_TYPE' => 'application/json',
            'HTTP_STRIPE_SIGNATURE' => 't='.$timestamp.',v1='.$signature,
        ],
        $payload,
    );

    $response->assertOk();

    $user->refresh();
    $purchase = BillingPurchase::query()->where('provider_session_id', 'cs_test_456')->first();

    expect($user->run_limit)->toBe(200);
    expect((float) $user->plan_price_usd)->toBe(10.0);
    expect($purchase->status)->toBe('fulfilled');
    expect($purchase->provider_payment_status)->toBe('paid');
    expect($purchase->fulfilled_at)->not->toBeNull();

    $secondResponse = $this->call(
        'POST',
        route('billing.stripe.webhook'),
        [],
        [],
        [],
        [
            'CONTENT_TYPE' => 'application/json',
            'HTTP_STRIPE_SIGNATURE' => 't='.$timestamp.',v1='.$signature,
        ],
        $payload,
    );

    $secondResponse->assertOk();

    expect($user->fresh()->run_limit)->toBe(200);
});
