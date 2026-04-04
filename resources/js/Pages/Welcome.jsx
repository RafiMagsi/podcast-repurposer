import { Head, Link } from '@inertiajs/react';
import { useState } from 'react';
import AppCard from '@/Components/ui/AppCard';
import ApplicationLogo from '@/Components/ApplicationLogo';

const features = [
    {
        title: 'Start with one short source',
        description: 'Start from short video, short audio, or one short text note.',
    },
    {
        title: 'Review in one workspace',
        description: 'Inspect transcript, summary, and content assets without jumping between tools.',
    },
    {
        title: 'Publish faster',
        description: 'Reuse one source across summary, LinkedIn, X, Instagram, and newsletter.',
    },
    {
        title: 'Stay in control',
        description: 'Retry, regenerate, and manage outputs from the same run workspace.',
    },
];

const outputs = ['Transcript', 'Summary', 'LinkedIn Post', 'X Post', 'Instagram Caption', 'Newsletter'];
const supportedSources = [
    ['1-Minute Video', 'Upload or record a short clip. VoicePost AI extracts the audio, transcribes it, and prepares reusable outputs.'],
    ['1-Minute Audio', 'Upload or record spoken audio, then review transcript and generated content from the same workspace.'],
    ['Short Text Note', 'Paste one short text idea up to 200 characters and skip the transcription step entirely.'],
];
const workspaceCapabilities = [
    ['Live Processing Status', 'Track queue state, Media Prep, transcription, generation, partial completion, failure, or cancellation from one run page.'],
    ['Per-Output Regeneration', 'Refresh one output card at a time without deleting the rest of the content set.'],
    ['Magic Chat Assistant', 'Ask for rewrites, stronger hooks, shorter versions, CTA changes, and alternate angles tied to the current recording.'],
    ['Retry And Recovery', 'Retry transcription, regenerate content, cancel active work, and clearly see incomplete or failed states.'],
    ['Streaming Media Review', 'Preview uploaded or recorded video and audio directly in the workspace with browser-native buffering.'],
    ['Usage Tracking', 'See remaining runs, enforce per-user limits, and block new processing when quota is exhausted.'],
];
const operationalHighlights = [
    ['Admin Run Monitoring', 'Review users, source types, statuses, and timestamps across runs from one admin page.'],
    ['Operational Analytics', 'Track source usage, completion rates, failure rates, retries, regenerations, and top output usage.'],
    ['Signed Media Access', 'Use temporary or signed media delivery paths instead of exposing source files publicly.'],
    ['Safer Failure Handling', 'Persist failure stage, show useful error messages, and avoid automatic retry loops that waste tokens.'],
];
const usageAndLimits = [
    ['Video', 'Up to 1 minute, up to 300 MB'],
    ['Audio', 'Up to 1 minute, up to 25 MB'],
    ['Text Note', 'Up to 200 characters'],
    ['Plan Model', '$10 plan with 100 runs by default, adjustable per user'],
];

const welcomeTabs = ['Transcript', 'AI Content', 'Magic Chat'];

function NavLink({ href, children, primary = false }) {
    return primary ? (
        <Link href={href} className="btn-primary">
            {children}
        </Link>
    ) : (
        <Link href={href} className="btn-outline">
            {children}
        </Link>
    );
}

function FeatureCard({ title, description }) {
    return (
        <AppCard variant="compact" padding="md" className="p-5">
            <div className="app-badge-neutral mb-3">Feature</div>
            <h3 className="text-lg font-semibold text-[rgb(var(--color-text-strong))]">{title}</h3>
            <p className="mt-2 text-sm leading-6 text-[rgb(var(--color-text-muted))]">{description}</p>
        </AppCard>
    );
}

export default function Welcome({ auth }) {
    const [activePreviewTab, setActivePreviewTab] = useState('Transcript');

    return (
        <>
            <Head title="VoicePost AI" />

            <div className="min-h-screen overflow-hidden">
                <div className="mx-auto max-w-[1360px] p-2.5 sm:p-4">
                    <div className="overflow-hidden rounded-[22px] border border-[rgb(var(--color-border))] bg-[rgb(var(--color-page-bg))] shadow-[0_10px_28px_rgba(17,24,39,0.06)] sm:rounded-[28px] sm:shadow-[0_22px_60px_rgba(17,24,39,0.08)]">
                        <div className="bg-[rgb(var(--color-surface-pink))] px-4 py-2.5 text-center text-xs font-semibold text-[rgb(var(--color-text-strong))] sm:px-6 sm:py-3 sm:text-sm">
                            VoicePost AI for fast short-source-to-content workflows
                        </div>

                        <div className="relative">
                            <div className="absolute left-[-8rem] top-28 hidden h-72 w-72 rounded-full bg-[rgb(var(--color-surface-pink))] opacity-70 blur-3xl lg:block" />
                            <div className="absolute right-[-6rem] top-24 hidden h-72 w-72 rounded-full bg-[rgb(var(--color-surface-blue))] opacity-80 blur-3xl lg:block" />
                            <div className="absolute bottom-[-6rem] left-1/3 hidden h-72 w-72 rounded-full bg-[rgb(var(--color-surface-lavender))] opacity-70 blur-3xl lg:block" />

                            <div className="relative px-3.5 pb-6 pt-4 sm:px-5 sm:pb-8 sm:pt-5 lg:px-7 lg:pb-10">
                                <header className="mx-auto flex max-w-6xl flex-col gap-3 rounded-[16px] border border-[rgb(var(--color-border))] bg-white px-3.5 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-4">
                                    <Link href="/">
                                        <ApplicationLogo
                                            className="h-9 w-9 rounded-[18px]"
                                            withText
                                            textClassName="text-lg font-semibold text-[rgb(var(--color-text-strong))]"
                                            subtitleClassName="hidden"
                                        />
                                    </Link>

                                    <nav className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end sm:gap-3">
                                        <Link href="/product" className="nav-link">Product</Link>
                                        <Link href="/use-cases" className="nav-link">Use Cases</Link>
                                        <Link href="/pricing" className="nav-link">Pricing</Link>
                                        {auth?.user ? (
                                            <NavLink href={route('dashboard')} primary>
                                                Open Dashboard
                                            </NavLink>
                                        ) : (
                                            <>
                                                <NavLink href={route('login')}>Sign In</NavLink>
                                                <NavLink href={route('register')} primary>
                                                    Sign Up
                                                </NavLink>
                                            </>
                                        )}
                                    </nav>
                                </header>

                                <section className="mx-auto max-w-6xl py-6 sm:py-8 xl:py-10">
                                    <div className="text-center xl:text-left">
                                        <div className="app-badge mb-4">VoicePost AI</div>
                                        <h1 className="mx-auto max-w-4xl text-[2.15rem] font-extrabold leading-[1] tracking-[-0.05em] text-[rgb(var(--color-text-strong))] sm:text-5xl xl:mx-0 xl:text-6xl">
                                            Turn one short source into ready-to-post content.
                                        </h1>
                                        <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-[rgb(var(--color-text-muted))] sm:mt-4 sm:text-base sm:leading-7 xl:mx-0">
                                            Upload a short video, upload short audio, or paste one short text note. VoicePost AI turns it into a transcript plus five reusable content assets from one compact workspace.
                                        </p>

                                        <div className="mt-5 flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:items-center sm:justify-center sm:gap-3 xl:justify-start">
                                            {auth?.user ? (
                                                <NavLink href={route('dashboard')} primary>
                                                    Open workspace
                                                </NavLink>
                                            ) : (
                                                <>
                                                    <NavLink href={route('register')} primary>
                                                        Start Free
                                                    </NavLink>
                                                    <NavLink href={route('login')}>Sign In</NavLink>
                                                </>
                                            )}
                                        </div>

                                        <div className="mt-5 compact-grid-3 text-left">
                                            {[
                                                ['Inputs', 'Video · Audio · Text'],
                                                ['Outputs', 'Summary · LinkedIn · X · Instagram · Newsletter'],
                                                ['Workspace', 'Transcript, status, and reusable assets together'],
                                            ].map(([label, value]) => (
                                                <div key={label} className="app-card-muted px-4 py-3">
                                                    <div className="text-xs uppercase tracking-[0.16em] text-[rgb(var(--color-text-faint))]">
                                                        {label}
                                                    </div>
                                                    <div className="mt-1.5 text-sm font-semibold leading-6 text-[rgb(var(--color-text-strong))]">
                                                        {value}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="relative mt-6 sm:mt-7">
                                        <AppCard variant="compact" padding="none" className="overflow-hidden rounded-[22px]">
                                            <div className="flex items-center justify-between gap-3 border-b border-[rgb(var(--color-border))] bg-white px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    <span className="h-2.5 w-2.5 rounded-full bg-[#ff6f61]" />
                                                    <span className="h-2.5 w-2.5 rounded-full bg-[#ffd166]" />
                                                    <span className="h-2.5 w-2.5 rounded-full bg-[#7bd389]" />
                                                </div>
                                                <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[rgb(var(--color-text-faint))]">
                                                    Workspace preview
                                                </div>
                                            </div>

                                            <div className="bg-white p-4 sm:p-5">
                                                <div className="rounded-full border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface-soft))] px-4 py-3 text-sm text-[rgb(var(--color-text-muted))]">
                                                    Search recordings, transcripts, or content assets
                                                </div>

                                                <div className="mt-4 flex flex-wrap gap-2">
                                                    {welcomeTabs.map((tab) => (
                                                        <button
                                                            key={tab}
                                                            type="button"
                                                            onClick={() => setActivePreviewTab(tab)}
                                                            className={activePreviewTab === tab ? 'filter-pill filter-pill-active' : 'filter-pill'}
                                                        >
                                                            {tab}
                                                        </button>
                                                    ))}
                                                </div>

                                                <div className="mt-4 grid gap-3 xl:grid-cols-[480px_minmax(0,1fr)]">
                                                    <div className="space-y-4">
                                                        <div className="rounded-[16px] border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface-soft))] p-4">
                                                            <div className="text-xs uppercase tracking-[0.16em] text-[rgb(var(--color-text-faint))]">
                                                                Source preview
                                                            </div>
                                                            <div className="mt-3 overflow-hidden rounded-[14px] border border-[rgb(var(--color-border))] bg-black">
                                                                <div className="flex h-[190px] items-center justify-center sm:h-[230px]">
                                                                    <img
                                                                        src="/assets/welcome/workflow-diagram.svg"
                                                                        alt="VoicePost AI workspace preview"
                                                                        className="h-full w-full object-cover opacity-85"
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="note-card-muted">
                                                            Transcript, summary, and outputs stay together in one compact run workspace.
                                                        </div>
                                                    </div>

                                                    <div className="space-y-4">
                                                        {activePreviewTab === 'Transcript' ? (
                                                            <>
                                                                <div className="rounded-[16px] border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface-soft))] p-4">
                                                                    <div className="section-header-compact">
                                                                        <div className="section-header-copy">
                                                                            <h3 className="app-section-title">Transcript</h3>
                                                                            <p className="app-muted mt-1 text-sm">Source text used for the writing pass.</p>
                                                                        </div>
                                                                    </div>
                                                                    <div className="mt-3 rounded-[14px] border border-[rgb(var(--color-border))] bg-white p-4 text-sm leading-7 text-[rgb(var(--color-text))]">
                                                                        No extra tools, just one short source turned into a transcript and ready-to-post content.
                                                                    </div>
                                                                </div>

                                                                <div className="rounded-[16px] border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface-soft))] p-4">
                                                                    <div className="section-header-compact">
                                                                        <div className="section-header-copy">
                                                                            <h3 className="app-section-title">Output stack</h3>
                                                                            <p className="app-muted mt-1 text-sm">Five reusable assets from one source.</p>
                                                                        </div>
                                                                    </div>
                                                                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                                                                        {outputs.map((item) => (
                                                                            <div key={item} className="note-card">
                                                                                <span className="text-sm font-medium text-[rgb(var(--color-text))]">
                                                                                    {item}
                                                                                </span>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            </>
                                                        ) : null}

                                                        {activePreviewTab === 'AI Content' ? (
                                                            <>
                                                                <div className="rounded-[16px] border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface-soft))] p-4">
                                                                    <div className="section-header-compact">
                                                                        <div className="section-header-copy">
                                                                            <h3 className="app-section-title">AI Content</h3>
                                                                            <p className="app-muted mt-1 text-sm">Reusable post-ready assets generated from the source.</p>
                                                                        </div>
                                                                    </div>
                                                                    <div className="mt-3 grid gap-2">
                                                                        {[
                                                                            ['Summary', 'A clean condensed overview for fast review.'],
                                                                            ['LinkedIn Post', 'A professional draft built from the same transcript.'],
                                                                            ['X Post', 'A shorter publish-ready version for short-form posting.'],
                                                                        ].map(([title, copy]) => (
                                                                            <div key={title} className="rounded-[14px] border border-[rgb(var(--color-border))] bg-white p-4">
                                                                                <div className="text-sm font-semibold text-[rgb(var(--color-text-strong))]">{title}</div>
                                                                                <div className="mt-1.5 text-sm leading-6 text-[rgb(var(--color-text-muted))]">{copy}</div>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>

                                                                <div className="rounded-[16px] border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface-soft))] p-4">
                                                                    <div className="section-header-compact">
                                                                        <div className="section-header-copy">
                                                                            <h3 className="app-section-title">Per-output control</h3>
                                                                            <p className="app-muted mt-1 text-sm">Refresh one asset without replacing the rest of the run.</p>
                                                                        </div>
                                                                    </div>
                                                                    <div className="mt-3 flex flex-wrap gap-2">
                                                                        {['Refresh one output', 'Copy content', 'Keep other outputs'].map((item) => (
                                                                            <div key={item} className="pill-compact">{item}</div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            </>
                                                        ) : null}

                                                        {activePreviewTab === 'Magic Chat' ? (
                                                            <>
                                                                <div className="rounded-[16px] border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface-soft))] p-4">
                                                                    <div className="section-header-compact">
                                                                        <div className="section-header-copy">
                                                                            <h3 className="app-section-title">Magic Chat</h3>
                                                                            <p className="app-muted mt-1 text-sm">Ask for rewrites, sharper hooks, shorter versions, and better CTAs.</p>
                                                                        </div>
                                                                    </div>
                                                                    <div className="mt-3 space-y-3">
                                                                        <div className="rounded-[14px] border border-[rgb(var(--color-border))] bg-white px-4 py-3 text-sm leading-6 text-[rgb(var(--color-text-muted))]">
                                                                            Make the LinkedIn post sound more direct and founder-led.
                                                                        </div>
                                                                        <div className="rounded-[14px] border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface-blue))] px-4 py-3 text-sm leading-6 text-[rgb(var(--color-text))]">
                                                                            Rewriting the post with a stronger hook, shorter opening, and clearer CTA based on the current transcript.
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                <div className="rounded-[16px] border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface-soft))] p-4">
                                                                    <div className="section-header-compact">
                                                                        <div className="section-header-copy">
                                                                            <h3 className="app-section-title">What it can do</h3>
                                                                        </div>
                                                                    </div>
                                                                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                                                                        {['Rewrite tone', 'Shorten output', 'Improve CTA', 'Change angle'].map((item) => (
                                                                            <div key={item} className="note-card">
                                                                                <span className="text-sm font-medium text-[rgb(var(--color-text))]">{item}</span>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            </>
                                                        ) : null}
                                                    </div>
                                                </div>
                                            </div>
                                        </AppCard>
                                    </div>
                                </section>

                                <section className="mx-auto max-w-6xl py-1">
                                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                                        {features.map((feature) => (
                                            <FeatureCard key={feature.title} {...feature} />
                                        ))}
                                    </div>
                                </section>

                                <section className="mx-auto max-w-6xl py-6 md:hidden">
                                    <AppCard variant="compact" padding="lg" className="p-5">
                                        <div className="app-badge-neutral">Mobile Overview</div>
                                        <div className="mt-3 grid gap-3">
                                            {[
                                                ['Inputs', 'Short video, audio, or one text note'],
                                                ['Outputs', 'Transcript, summary, LinkedIn, X, Instagram, newsletter'],
                                                ['Workspace', 'Preview, transcript, generation, and Magic Chat in one place'],
                                            ].map(([title, description]) => (
                                                <div key={title} className="note-card">
                                                    <div className="text-sm font-semibold text-[rgb(var(--color-text-strong))]">{title}</div>
                                                    <div className="mt-1 text-sm leading-6 text-[rgb(var(--color-text-muted))]">{description}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </AppCard>
                                </section>

                                <section className="mx-auto hidden max-w-6xl py-8 md:block">
                                    <div className="grid gap-4 xl:grid-cols-[1.02fr_.98fr]">
                                        <AppCard variant="compact" padding="lg" className="p-6 sm:p-7">
                                            <div className="app-badge-neutral">What you get</div>
                                            <h2 className="mt-3 text-2xl font-bold tracking-[-0.04em] text-[rgb(var(--color-text-strong))] sm:text-3xl">
                                                A compact product workspace, not a bloated content suite.
                                            </h2>
                                            <p className="mt-3 max-w-2xl text-sm leading-6 text-[rgb(var(--color-text-muted))]">
                                                VoicePost AI stays focused on one promise: one short source in, five reusable outputs out, all from one clean workspace.
                                            </p>

                                            <div className="mt-5 grid gap-3 sm:grid-cols-2">
                                                {outputs.map((item, index) => (
                                                    <div
                                                        key={item}
                                                        className="flex items-center gap-3 rounded-[16px] border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface-soft))] px-4 py-3"
                                                    >
                                                        <span
                                                            className={`profile-icon ${
                                                                ['profile-icon-purple', 'profile-icon-blue', 'profile-icon-green', 'profile-icon-yellow', 'profile-icon-orange', 'profile-icon-red'][index % 6]
                                                            }`}
                                                        >
                                                            •
                                                        </span>
                                                        <span className="text-sm font-medium text-[rgb(var(--color-text))]">
                                                            {item}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </AppCard>

                                        <div className="space-y-3">
                                            {[
                                                ['01', 'Add one short source', 'Upload short video, upload short audio, or paste one short text note.'],
                                                ['02', 'Generate the transcript', 'Use the transcript as the source of truth for the writing pass.'],
                                                ['03', 'Review five outputs', 'Copy summary, LinkedIn, X, Instagram, and newsletter from one workspace.'],
                                            ].map(([step, title, description]) => (
                                                <AppCard key={step} variant="compact" padding="md" className="p-5">
                                                    <div className="flex items-start gap-4">
                                                        <div className="profile-icon profile-icon-blue text-sm font-semibold text-[rgb(var(--color-secondary-text))]">
                                                            {step}
                                                        </div>
                                                        <div>
                                                            <h3 className="text-xl font-semibold text-[rgb(var(--color-text-strong))]">
                                                                {title}
                                                            </h3>
                                                            <p className="mt-2 text-sm leading-6 text-[rgb(var(--color-text-muted))]">
                                                                {description}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </AppCard>
                                            ))}
                                        </div>
                                    </div>
                                </section>

                                <section className="mx-auto hidden max-w-6xl py-4 md:block">
                                    <div className="grid gap-4 xl:grid-cols-[.94fr_1.06fr]">
                                        <AppCard variant="compact" padding="lg" className="p-6 sm:p-7">
                                            <div className="app-badge-neutral">Supported Inputs</div>
                                            <h2 className="mt-3 text-2xl font-bold tracking-[-0.04em] text-[rgb(var(--color-text-strong))] sm:text-3xl">
                                                Everything starts from one short source.
                                            </h2>
                                            <div className="mt-5 space-y-3">
                                                {supportedSources.map(([title, description]) => (
                                                    <div key={title} className="note-card">
                                                        <div className="text-sm font-semibold text-[rgb(var(--color-text-strong))]">{title}</div>
                                                        <div className="mt-1 text-sm leading-6 text-[rgb(var(--color-text-muted))]">{description}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        </AppCard>

                                        <AppCard variant="muted" padding="md">
                                            <div className="text-xs uppercase tracking-[0.18em] text-[rgb(var(--color-text-faint))]">
                                                Usage And Limits
                                            </div>
                                            <div className="mt-4 grid gap-3 sm:grid-cols-2">
                                                {usageAndLimits.map(([title, description]) => (
                                                    <div key={title} className="note-card">
                                                        <div className="text-sm font-semibold text-[rgb(var(--color-text-strong))]">{title}</div>
                                                        <div className="mt-1 text-sm leading-6 text-[rgb(var(--color-text-muted))]">{description}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        </AppCard>
                                    </div>
                                </section>

                                <section className="mx-auto hidden max-w-6xl py-4 md:block">
                                    <AppCard variant="compact" padding="lg" className="p-6 sm:p-7">
                                        <div className="section-header">
                                            <div className="section-header-copy">
                                                <div className="app-badge-neutral">What VoicePost AI Can Do</div>
                                                <h2 className="mt-3 text-2xl font-bold tracking-[-0.04em] text-[rgb(var(--color-text-strong))] sm:text-3xl">
                                                    Full project capabilities in one place.
                                                </h2>
                                                <p className="mt-2 text-sm leading-6 text-[rgb(var(--color-text-muted))]">
                                                    This product is built to cover the full short-source workflow: input, transcript, outputs, workspace controls, recovery, and monitoring.
                                                </p>
                                            </div>
                                        </div>

                                        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                                            {workspaceCapabilities.map(([title, description]) => (
                                                <div key={title} className="note-card">
                                                    <div className="text-sm font-semibold text-[rgb(var(--color-text-strong))]">{title}</div>
                                                    <div className="mt-1 text-sm leading-6 text-[rgb(var(--color-text-muted))]">{description}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </AppCard>
                                </section>

                                <section className="mx-auto max-w-6xl py-4">
                                    <div className="grid gap-4 xl:grid-cols-[1.04fr_.96fr]">
                                        <AppCard variant="muted" padding="md">
                                            <div className="text-xs uppercase tracking-[0.18em] text-[rgb(var(--color-text-faint))]">
                                                Output Set
                                            </div>
                                            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                                                {[
                                                    ['Transcript', 'Source-of-truth text extracted from audio or video when applicable.'],
                                                    ['Summary', 'Condensed context for fast review before opening the full content stack.'],
                                                    ['LinkedIn Post', 'Professional draft shaped from the transcript and selected tone.'],
                                                    ['X Post', 'Short post constrained to the platform character limit.'],
                                                    ['Instagram Caption', 'Caption body with exactly five hashtags.'],
                                                    ['Newsletter', 'Email-ready body with a subject line.'],
                                                ].map(([title, description]) => (
                                                    <div key={title} className="note-card">
                                                        <div className="text-sm font-semibold text-[rgb(var(--color-text-strong))]">{title}</div>
                                                        <div className="mt-1 text-sm leading-6 text-[rgb(var(--color-text-muted))]">{description}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        </AppCard>

                                        <AppCard variant="compact" padding="lg" className="p-6">
                                            <div className="app-badge-neutral">Operations And Reliability</div>
                                            <div className="mt-4 space-y-3">
                                                {operationalHighlights.map(([title, description]) => (
                                                    <div key={title} className="note-card-muted">
                                                        <div className="font-semibold text-[rgb(var(--color-text-strong))]">{title}</div>
                                                        <div className="mt-1">{description}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        </AppCard>
                                    </div>
                                </section>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
