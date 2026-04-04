import AppCard from '@/Components/ui/AppCard';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, usePage } from '@inertiajs/react';
import { useEffect, useMemo, useRef, useState } from 'react';

function loadStripeScript() {
    return new Promise((resolve, reject) => {
        if (window.Stripe) {
            resolve(window.Stripe);
            return;
        }

        const existingScript = document.querySelector('script[data-stripe-js="true"]');

        if (existingScript) {
            existingScript.addEventListener('load', () => resolve(window.Stripe), { once: true });
            existingScript.addEventListener('error', () => reject(new Error('Unable to load Stripe.js.')), { once: true });
            return;
        }

        const script = document.createElement('script');
        script.src = 'https://js.stripe.com/v3/';
        script.async = true;
        script.dataset.stripeJs = 'true';
        script.onload = () => resolve(window.Stripe);
        script.onerror = () => reject(new Error('Unable to load Stripe.js.'));
        document.head.appendChild(script);
    });
}

export default function BillingCheckout({ auth, billing, checkoutState = null }) {
    const page = usePage();
    const billingError = page.props?.errors?.billing;
    const packageSummary = billing?.package || {
        name: 'VoicePost AI Starter Pack',
        runs: 100,
        price_usd: 10,
        currency: 'usd',
    };
    const publishableKey = billing?.publishable_key || '';
    const cardMountRef = useRef(null);
    const stripeRef = useRef(null);
    const elementsRef = useRef(null);
    const cardElementRef = useRef(null);
    const [cardholderName, setCardholderName] = useState(auth?.user?.name || '');
    const [statusMessage, setStatusMessage] = useState('');
    const [statusTone, setStatusTone] = useState(checkoutState === 'success' ? 'success' : checkoutState === 'cancelled' ? 'warning' : billingError ? 'danger' : 'neutral');
    const [loadingStripe, setLoadingStripe] = useState(true);
    const [readyToPay, setReadyToPay] = useState(false);
    const [processingPayment, setProcessingPayment] = useState(false);

    const statusClassName = useMemo(() => {
        if (statusTone === 'success') {
            return 'border border-[rgb(var(--color-success-border))] bg-[rgb(var(--color-success-bg))] text-[rgb(var(--color-success-text))]';
        }

        if (statusTone === 'warning') {
            return 'border border-[rgb(var(--color-warning-border))] bg-[rgb(var(--color-warning-bg))] text-[rgb(var(--color-warning-text))]';
        }

        if (statusTone === 'danger') {
            return 'border border-[rgb(var(--color-danger-border))] bg-[rgb(var(--color-danger-bg))] text-[rgb(var(--color-danger-text))]';
        }

        return 'border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface-soft))] text-[rgb(var(--color-text-muted))]';
    }, [statusTone]);

    useEffect(() => {
        if (checkoutState === 'success') {
            setStatusMessage('Payment received. Your run balance will update as soon as Stripe confirms the payment.');
            setStatusTone('success');
        } else if (checkoutState === 'cancelled') {
            setStatusMessage('Payment was cancelled. No charge was completed.');
            setStatusTone('warning');
        } else if (billingError) {
            setStatusMessage(billingError);
            setStatusTone('danger');
        }
    }, [checkoutState, billingError]);

    useEffect(() => {
        let mounted = true;

        const initialiseStripe = async () => {
            if (!publishableKey) {
                if (mounted) {
                    setStatusMessage('Stripe publishable key is missing. Ask an admin to complete Stripe settings.');
                    setStatusTone('danger');
                    setLoadingStripe(false);
                }

                return;
            }

            try {
                const StripeFactory = await loadStripeScript();

                if (!mounted || !cardMountRef.current) {
                    return;
                }

                const stripe = StripeFactory(publishableKey);

                if (!stripe) {
                    throw new Error('Stripe failed to initialize.');
                }

                const elements = stripe.elements();
                const card = elements.create('card', {
                    hidePostalCode: true,
                    style: {
                        base: {
                            color: '#111827',
                            fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif',
                            fontSize: '16px',
                            '::placeholder': {
                                color: '#94a3b8',
                            },
                        },
                        invalid: {
                            color: '#be123c',
                        },
                    },
                });

                card.mount(cardMountRef.current);
                card.on('change', (event) => {
                    if (!mounted) {
                        return;
                    }

                    if (event.error) {
                        setStatusMessage(event.error.message || 'Card details are incomplete.');
                        setStatusTone('danger');
                    } else {
                        setStatusMessage('');
                        setStatusTone('neutral');
                    }
                });

                stripeRef.current = stripe;
                elementsRef.current = elements;
                cardElementRef.current = card;

                setReadyToPay(true);
            } catch (error) {
                if (mounted) {
                    setStatusMessage(error.message || 'Unable to load Stripe payment form.');
                    setStatusTone('danger');
                }
            } finally {
                if (mounted) {
                    setLoadingStripe(false);
                }
            }
        };

        initialiseStripe();

        return () => {
            mounted = false;

            if (cardElementRef.current) {
                cardElementRef.current.destroy();
                cardElementRef.current = null;
            }
        };
    }, [publishableKey]);

    const handlePayment = async (event) => {
        event.preventDefault();

        if (!stripeRef.current || !cardElementRef.current) {
            setStatusMessage('Stripe payment form is not ready yet.');
            setStatusTone('danger');
            return;
        }

        setProcessingPayment(true);
        setStatusMessage('Preparing payment...');
        setStatusTone('neutral');

        try {
            const intentResponse = await window.axios.post(route('billing.payment-intent'));
            const clientSecret = intentResponse.data?.client_secret;
            const paymentIntentId = intentResponse.data?.payment_intent_id;

            if (!clientSecret || !paymentIntentId) {
                throw new Error('Payment details were not returned by the server.');
            }

            const confirmation = await stripeRef.current.confirmCardPayment(clientSecret, {
                payment_method: {
                    card: cardElementRef.current,
                    billing_details: {
                        name: cardholderName || auth?.user?.name || '',
                        email: auth?.user?.email || '',
                    },
                },
            });

            if (confirmation.error) {
                throw new Error(confirmation.error.message || 'Stripe could not confirm the payment.');
            }

            if (!confirmation.paymentIntent) {
                throw new Error('Stripe did not return a payment result.');
            }

            if (confirmation.paymentIntent.status === 'succeeded') {
                const finalizeResponse = await window.axios.post(route('billing.payment-intent.finalize'), {
                    payment_intent_id: paymentIntentId,
                });

                setStatusMessage(finalizeResponse.data?.message || 'Payment completed successfully.');
                setStatusTone('success');
                router.reload({ only: ['usageLimits'] });
                return;
            }

            if (confirmation.paymentIntent.status === 'processing') {
                setStatusMessage('Payment is processing. Your balance will update once Stripe confirms the charge.');
                setStatusTone('warning');
                return;
            }

            throw new Error('Stripe did not complete the payment.');
        } catch (error) {
            const message = error?.response?.data?.message || error?.message || 'Unable to complete the payment right now.';
            setStatusMessage(message);
            setStatusTone('danger');
        } finally {
            setProcessingPayment(false);
        }
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <div className="grid gap-6 xl:grid-cols-[1.05fr_.95fr] xl:items-center">
                    <div>
                        <div className="app-badge mb-4">Billing</div>
                        <h1 className="app-heading">Purchase runs without leaving the workspace.</h1>
                        <p className="app-subheading mt-4 max-w-2xl">
                            Review the package, enter card details securely through Stripe Elements, and keep the full payment flow inside VoicePost AI.
                        </p>
                    </div>

                    <AppCard variant="soft" padding="md" className="p-6">
                        <div className="text-xs uppercase tracking-[0.18em] text-[rgb(var(--color-text-faint))]">
                            Current balance
                        </div>
                        <div className="mt-3 grid gap-3 sm:grid-cols-3">
                            <div className="note-card">
                                <div className="text-xs uppercase tracking-[0.18em] text-[rgb(var(--color-text-faint))]">
                                    Available runs
                                </div>
                                <div className="mt-2 text-lg font-semibold text-[rgb(var(--color-text-strong))]">
                                    {billing.run_limit}
                                </div>
                            </div>
                            <div className="note-card">
                                <div className="text-xs uppercase tracking-[0.18em] text-[rgb(var(--color-text-faint))]">
                                    Latest pack
                                </div>
                                <div className="mt-2 text-lg font-semibold text-[rgb(var(--color-text-strong))]">
                                    {billing.plan_price_usd > 0 ? `$${billing.plan_price_usd}` : 'Not purchased'}
                                </div>
                            </div>
                            <div className="note-card">
                                <div className="text-xs uppercase tracking-[0.18em] text-[rgb(var(--color-text-faint))]">
                                    This purchase
                                </div>
                                <div className="mt-2 text-lg font-semibold text-[rgb(var(--color-text-strong))]">
                                    {packageSummary.runs} runs
                                </div>
                            </div>
                        </div>
                    </AppCard>
                </div>
            }
        >
            <Head title="Billing" />

            {statusMessage ? (
                <div className={`app-card p-4 text-sm ${statusClassName}`}>
                    {statusMessage}
                </div>
            ) : null}

            <div className="grid gap-6 xl:grid-cols-[.95fr_1.05fr]">
                <AppCard variant="compact" padding="lg" className="p-6 sm:p-7">
                    <div className="app-badge-neutral">Card payment</div>
                    <div className="mt-4 text-4xl font-bold tracking-[-0.05em] text-[rgb(var(--color-text-strong))]">
                        ${packageSummary.price_usd}
                    </div>
                    <div className="mt-1 text-sm text-[rgb(var(--color-text-muted))]">
                        {packageSummary.runs} runs for short-source content creation
                    </div>

                    <form onSubmit={handlePayment} className="mt-6 space-y-4">
                        <div>
                            <label className="label-theme">Cardholder name</label>
                            <input
                                type="text"
                                value={cardholderName}
                                onChange={(event) => setCardholderName(event.target.value)}
                                className="input-theme"
                                placeholder="Name on card"
                            />
                        </div>

                        <div>
                            <label className="label-theme">Card details</label>
                            <div className="rounded-[14px] border border-[rgb(var(--color-border))] bg-white px-4 py-3">
                                <div ref={cardMountRef} />
                            </div>
                            <p className="mt-2 text-sm text-[rgb(var(--color-text-muted))]">
                                Card data is handled by Stripe Elements and never touches your app server.
                            </p>
                        </div>

                        <div className="flex flex-col gap-3 sm:flex-row">
                            <button
                                type="submit"
                                disabled={!readyToPay || loadingStripe || processingPayment || publishableKey === ''}
                                className="btn-primary flex-1 justify-center disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {processingPayment
                                    ? 'Processing Payment...'
                                    : loadingStripe
                                    ? 'Loading Payment Form...'
                                    : 'Pay Securely'}
                            </button>
                            <a href={route('dashboard')} className="btn-outline flex-1 justify-center">
                                Back To Dashboard
                            </a>
                        </div>
                    </form>
                </AppCard>

                <div className="space-y-4">
                    <AppCard variant="muted" padding="md">
                        <h2 className="app-section-title">What this payment includes</h2>
                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                            {[
                                'Transcript generation',
                                'Summary output',
                                'LinkedIn post',
                                'X post',
                                'Instagram caption',
                                'Newsletter draft',
                            ].map((item) => (
                                <div key={item} className="note-card">{item}</div>
                            ))}
                        </div>
                    </AppCard>

                    <AppCard variant="compact" padding="md" className="p-5">
                        <h2 className="app-section-title">Recent purchases</h2>
                        <div className="mt-4 space-y-3">
                            {billing.recent_purchases.length > 0 ? (
                                billing.recent_purchases.map((purchase) => (
                                    <div key={purchase.id} className="note-card">
                                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                            <div>
                                                <div className="text-sm font-semibold text-[rgb(var(--color-text-strong))]">
                                                    {purchase.runs_purchased} runs · ${(purchase.amount_cents / 100).toFixed(2)} {purchase.currency}
                                                </div>
                                                <div className="mt-1 text-sm text-[rgb(var(--color-text-muted))]">
                                                    {purchase.fulfilled_at ? `Fulfilled ${purchase.fulfilled_at}` : `Created ${purchase.created_at}`}
                                                </div>
                                            </div>
                                            <div className="pill-compact">{purchase.status}</div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="note-card-muted">
                                    No purchases yet. Completed payments will appear here automatically.
                                </div>
                            )}
                        </div>
                    </AppCard>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
