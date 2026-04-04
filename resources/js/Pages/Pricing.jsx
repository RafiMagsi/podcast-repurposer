import AppCard from '@/Components/ui/AppCard';
import MarketingLayout from '@/Layouts/MarketingLayout';
import { Link, usePage } from '@inertiajs/react';

export default function Pricing({ auth }) {
    const page = usePage();
    const checkoutState = new URLSearchParams(page.url.split('?')[1] || '').get('checkout');
    const billingError = page.props?.errors?.billing;

    return (
        <MarketingLayout
            auth={auth}
            title="Pricing"
            activeNav="pricing"
            headerTitle="Simple pricing for a focused short-source workflow."
            headerCopy="The product is built around a straightforward run model: one source in, one full output set out. Keep pricing clear, usage visible, and upgrade decisions simple."
        >
            {checkoutState === 'success' ? (
                <div className="mb-4 rounded-[16px] border border-[rgb(var(--color-border))] bg-[rgb(var(--color-success-bg))] px-4 py-3 text-sm text-[rgb(var(--color-success-text))]">
                    Payment received. Your run quota will update as soon as Stripe confirms the checkout.
                </div>
            ) : null}

            {checkoutState === 'cancelled' ? (
                <div className="mb-4 rounded-[16px] border border-[rgb(var(--color-border))] bg-[rgb(var(--color-warning-bg))] px-4 py-3 text-sm text-[rgb(var(--color-warning-text))]">
                    Checkout was cancelled. You can start it again anytime.
                </div>
            ) : null}

            {billingError ? (
                <div className="mb-4 rounded-[16px] border border-[rgb(var(--color-border))] bg-[rgb(var(--color-danger-bg))] px-4 py-3 text-sm text-[rgb(var(--color-danger-text))]">
                    {billingError}
                </div>
            ) : null}

            <div className="grid gap-4 xl:grid-cols-[.9fr_1.1fr]">
                <AppCard variant="compact" padding="lg" className="p-6 sm:p-7">
                    <div className="app-badge-neutral">Starter plan</div>
                    <div className="mt-4 text-4xl font-bold tracking-[-0.05em] text-[rgb(var(--color-text-strong))]">
                        $10
                    </div>
                    <div className="mt-1 text-sm text-[rgb(var(--color-text-muted))]">
                        100 runs for short-source content creation
                    </div>

                    <div className="mt-5 space-y-3">
                        {[
                            '1-minute video support',
                            '1-minute audio support',
                            '200-character text note support',
                            'Transcript + five output types',
                            'Retry, regenerate, and per-output refresh',
                        ].map((item) => (
                            <div key={item} className="note-card-muted">{item}</div>
                        ))}
                    </div>

                    <div className="mt-6">
                        {auth?.user ? (
                            <a href={route('billing.page')} className="btn-primary w-full justify-center">
                                Buy 100 Runs
                            </a>
                        ) : (
                            <Link href={route('register')} className="btn-primary w-full justify-center">
                                Create Account
                            </Link>
                        )}
                    </div>
                </AppCard>

                <div className="space-y-4">
                    <AppCard variant="muted" padding="md">
                        <h2 className="app-section-title">How usage works</h2>
                        <div className="mt-4 grid gap-3 sm:grid-cols-3">
                            {[
                                ['1 Run', 'Each AI content request uses one run from your plan balance.'],
                                ['Visible quota', 'Remaining runs are shown in the dashboard and create flow.'],
                                ['Stripe checkout', 'Hosted checkout keeps payment handling off your app server.'],
                            ].map(([title, description]) => (
                                <div key={title} className="note-card">
                                    <div className="text-sm font-semibold text-[rgb(var(--color-text-strong))]">{title}</div>
                                    <div className="mt-1 text-sm leading-6 text-[rgb(var(--color-text-muted))]">{description}</div>
                                </div>
                            ))}
                        </div>
                    </AppCard>

                    <AppCard variant="compact" padding="md" className="p-5">
                        <h2 className="app-section-title">Included in every run</h2>
                        <div className="mt-4 grid gap-2 sm:grid-cols-2">
                            {['Summary', 'LinkedIn Post', 'X Post', 'Instagram Caption', 'Newsletter'].map((item) => (
                                <div key={item} className="note-card-muted">{item}</div>
                            ))}
                        </div>
                    </AppCard>

                    <AppCard variant="muted" padding="md">
                        <h2 className="app-section-title">What happens after purchase</h2>
                        <div className="mt-4 grid gap-3 sm:grid-cols-3">
                            {[
                                ['1', 'Complete your purchase'],
                                ['2', 'Your run balance becomes available'],
                                ['3', 'Start creating from the workspace'],
                            ].map(([step, label]) => (
                                <div key={step} className="note-card">
                                    <div className="text-xs uppercase tracking-[0.16em] text-[rgb(var(--color-text-faint))]">Step {step}</div>
                                    <div className="mt-1.5 text-sm font-semibold text-[rgb(var(--color-text-strong))]">{label}</div>
                                </div>
                            ))}
                        </div>
                    </AppCard>
                </div>
            </div>
        </MarketingLayout>
    );
}
