import ApplicationLogo from '@/Components/ApplicationLogo';
import { Link } from '@inertiajs/react';

export default function GuestLayout({ children }) {
    return (
        <div className="auth-shell">
            <div className="w-full max-w-6xl">
                <div className="grid gap-8 lg:grid-cols-[1.05fr_.95fr] lg:items-center">
                    <div className="hidden lg:block">
                        <div className="app-panel overflow-hidden p-10">
                            <div className="app-badge mb-5">VoicePost AI</div>
                            <h1 className="app-heading max-w-lg">
                                Turn one short source into ready-to-post content.
                            </h1>
                            <p className="app-subheading mt-5 max-w-xl">
                                Sign in to a lighter workspace for short video, audio, and text inputs, transcripts, and reusable content outputs.
                            </p>

                            <div className="mt-8 grid gap-4 sm:grid-cols-2">
                                <div className="stat-card">
                                    <div className="text-xs uppercase tracking-[0.18em] text-[rgb(var(--color-text-faint))]">
                                        Workflow
                                    </div>
                                    <div className="mt-2 text-lg font-semibold text-[rgb(var(--color-text-strong))]">
                                        Voice note · Transcript · Content
                                    </div>
                                </div>
                                <div className="stat-card">
                                    <div className="text-xs uppercase tracking-[0.18em] text-[rgb(var(--color-text-faint))]">
                                        Outputs
                                    </div>
                                    <div className="mt-2 text-lg font-semibold text-[rgb(var(--color-text-strong))]">
                                        Summary, LinkedIn, X, Instagram, Newsletter
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8 rounded-[24px] border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface-soft))] p-5">
                                <div className="input-hero">Start drafting with AI...</div>
                                <div className="mt-4 flex flex-wrap gap-2">
                                    {['Popular', 'Captions', 'Newsletter', 'Tweets'].map((item, index) => (
                                        <div
                                            key={item}
                                            className={index === 0 ? 'filter-pill filter-pill-active' : 'filter-pill'}
                                        >
                                            {item}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div>
                        <div className="mb-5 flex justify-center lg:justify-start">
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
