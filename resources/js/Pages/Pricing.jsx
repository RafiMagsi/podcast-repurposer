import AppCard from '@/Components/ui/AppCard';
import MarketingLayout from '@/Layouts/MarketingLayout';
import { Link } from '@inertiajs/react';

export default function Pricing({ auth }) {
    return (
        <MarketingLayout
            auth={auth}
            title="Pricing"
            activeNav="pricing"
            headerTitle="Simple pricing for a focused short-source workflow."
            headerCopy="The product is built around a straightforward run model: one source in, one full output set out. Keep pricing clear, usage visible, and upgrade decisions simple."
        >
            <div className="grid gap-4 xl:grid-cols-[.9fr_1.1fr]">
                <AppCard variant="compact" padding="lg" className="p-6 sm:p-7">
                    <div className="app-badge-neutral">Starter plan</div>
                    <div className="mt-4 text-4xl font-bold tracking-[-0.05em] text-[rgb(var(--color-text-strong))]">
                        $10
                    </div>
                    <div className="mt-1 text-sm text-[rgb(var(--color-text-muted))]">
                        100 runs included
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
                            <Link href={route('dashboard')} className="btn-primary w-full justify-center">
                                Open Dashboard
                            </Link>
                        ) : (
                            <Link href={route('register')} className="btn-primary w-full justify-center">
                                Start With 100 Runs
                            </Link>
                        )}
                    </div>
                </AppCard>

                <div className="space-y-4">
                    <AppCard variant="muted" padding="md">
                        <h2 className="app-section-title">How usage works</h2>
                        <div className="mt-4 grid gap-3 sm:grid-cols-3">
                            {[
                                ['1 Run', 'Each new content request uses one run.'],
                                ['Visible quota', 'Remaining runs are shown in the dashboard and create flow.'],
                                ['Easy scaling', 'Run limits can be adjusted per user as plans change.'],
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
                </div>
            </div>
        </MarketingLayout>
    );
}
