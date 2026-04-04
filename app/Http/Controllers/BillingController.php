<?php

namespace App\Http\Controllers;

use App\Services\StripeCheckoutService;
use Inertia\Inertia;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;
use Inertia\Response as InertiaResponse;
use RuntimeException;

class BillingController extends Controller
{
    public function page(Request $request, StripeCheckoutService $stripeCheckoutService): InertiaResponse
    {
        $user = $request->user();

        return Inertia::render('Billing/Checkout', [
            'billing' => [
                'run_limit' => (int) ($user?->run_limit ?? 0),
                'plan_price_usd' => (float) ($user?->plan_price_usd ?? 0),
                'publishable_key' => $stripeCheckoutService->publishableKey(),
                'recent_purchases' => $user
                    ? $user->billingPurchases()
                        ->latest()
                        ->limit(6)
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
                'package' => $stripeCheckoutService->packageSummary(),
            ],
            'checkoutState' => $request->query('checkout'),
        ]);
    }

    public function start(Request $request, StripeCheckoutService $stripeCheckoutService)
    {
        try {
            $checkoutUrl = $stripeCheckoutService->createCheckoutSession($request->user());
        } catch (RuntimeException $exception) {
            return redirect()
                ->route('billing.page')
                ->withErrors([
                    'billing' => $exception->getMessage(),
                ]);
        }

        if ($checkoutUrl === '') {
            return redirect()
                ->route('billing.page')
                ->withErrors([
                    'billing' => 'Stripe checkout did not return a valid URL.',
                ]);
        }

        return redirect()->away($checkoutUrl);
    }

    public function checkout(Request $request, StripeCheckoutService $stripeCheckoutService)
    {
        try {
            $checkoutUrl = $stripeCheckoutService->createCheckoutSession($request->user());
        } catch (RuntimeException $exception) {
            return back()->withErrors([
                'billing' => $exception->getMessage(),
            ]);
        }

        if ($checkoutUrl === '') {
            return back()->withErrors([
                'billing' => 'Stripe checkout did not return a valid URL.',
            ]);
        }

        if ($request->header('X-Inertia')) {
            return Inertia::location($checkoutUrl);
        }

        return redirect()->away($checkoutUrl);
    }

    public function createPaymentIntent(Request $request, StripeCheckoutService $stripeCheckoutService): JsonResponse
    {
        try {
            $paymentIntent = $stripeCheckoutService->createPaymentIntent($request->user());
        } catch (RuntimeException $exception) {
            return response()->json([
                'message' => $exception->getMessage(),
            ], 422);
        }

        return response()->json($paymentIntent);
    }

    public function finalizePaymentIntent(Request $request, StripeCheckoutService $stripeCheckoutService): JsonResponse
    {
        $validated = $request->validate([
            'payment_intent_id' => ['required', 'string'],
        ]);

        try {
            $result = $stripeCheckoutService->finalizePaymentIntent(
                $request->user(),
                $validated['payment_intent_id'],
            );
        } catch (RuntimeException $exception) {
            return response()->json([
                'message' => $exception->getMessage(),
            ], 422);
        }

        return response()->json($result);
    }

    public function webhook(Request $request, StripeCheckoutService $stripeCheckoutService): Response
    {
        try {
            $stripeCheckoutService->handleWebhook(
                $request->getContent(),
                (string) $request->header('Stripe-Signature', ''),
            );
        } catch (RuntimeException $exception) {
            return response($exception->getMessage(), 400);
        }

        return response('ok', 200);
    }
}
