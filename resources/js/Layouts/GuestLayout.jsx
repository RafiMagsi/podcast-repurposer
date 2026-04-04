import ApplicationLogo from '@/Components/ApplicationLogo';
import AppCard from '@/Components/ui/AppCard';
import { Link } from '@inertiajs/react';

export default function GuestLayout({ children }) {
    return (
        <div className="auth-shell">
            <div className="w-full max-w-6xl">
                <div className="grid gap-6 lg:grid-cols-[1fr_.92fr] lg:items-center xl:gap-8">
                    <div className="hidden lg:block">
                        <AppCard variant="panel" padding="none" className="overflow-hidden p-8 xl:p-9">
                            <div className="app-badge-neutral mb-4">VoicePost AI</div>
                            <h1 className="app-heading max-w-lg">
                                Turn one short source into ready-to-post content.
                            </h1>
                            <p className="app-subheading mt-4 max-w-xl">
                                Use one compact workspace for short video, audio, and text inputs, transcripts, and reusable post-ready outputs.
                            </p>

                            <div className="mt-6 compact-grid-2">
                                <AppCard className="stat-card">
                                    <div className="text-xs uppercase tracking-[0.18em] text-[rgb(var(--color-text-faint))]">
                                        Workflow
                                    </div>
                                    <div className="mt-2 text-lg font-semibold text-[rgb(var(--color-text-strong))]">
                                        Source · Transcript · Content
                                    </div>
                                </AppCard>
                                <AppCard className="stat-card">
                                    <div className="text-xs uppercase tracking-[0.18em] text-[rgb(var(--color-text-faint))]">
                                        Outputs
                                    </div>
                                    <div className="mt-2 text-lg font-semibold text-[rgb(var(--color-text-strong))]">
                                        Summary, LinkedIn, X, Instagram, Newsletter
                                    </div>
                                </AppCard>
                            </div>

                            <AppCard variant="muted" padding="md" className="mt-6">
                                <div className="input-hero">Short video, audio, or text note...</div>
                                <div className="mt-4 flex flex-wrap gap-2">
                                    {['Summary', 'LinkedIn', 'X Post', 'Newsletter'].map((item, index) => (
                                        <div
                                            key={item}
                                            className={index === 0 ? 'filter-pill filter-pill-active' : 'filter-pill'}
                                        >
                                            {item}
                                        </div>
                                    ))}
                                </div>
                            </AppCard>
                        </AppCard>
                    </div>

                    <div>
                        <div className="mb-4 flex justify-center lg:justify-start">
                            <Link href="/">
                                <ApplicationLogo
                                    className="h-14 w-14 rounded-[20px]"
                                    withText
                                    textClassName="text-lg font-semibold text-[rgb(var(--color-text-strong))]"
                                    subtitleClassName="text-[11px] uppercase tracking-[0.18em] text-[rgb(var(--color-text-muted))]"
                                />
                            </Link>
                        </div>

                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
}
