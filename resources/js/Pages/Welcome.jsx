import { Head, Link } from '@inertiajs/react';
import AppCard from '@/Components/ui/AppCard';

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
    return (
        <>
            <Head title="VoicePost AI" />

            <div className="min-h-screen overflow-hidden">
                <div className="mx-auto max-w-[1360px] p-3 sm:p-4">
                    <div className="overflow-hidden rounded-[28px] border border-[rgb(var(--color-border))] bg-[rgb(var(--color-page-bg))] shadow-[0_22px_60px_rgba(17,24,39,0.08)]">
                        <div className="bg-[rgb(var(--color-surface-pink))] px-6 py-3 text-center text-sm font-semibold text-[rgb(var(--color-text-strong))]">
                            VoicePost AI for fast short-source-to-content workflows
                        </div>

                        <div className="relative">
                            <div className="absolute left-[-8rem] top-28 h-72 w-72 rounded-full bg-[rgb(var(--color-surface-pink))] opacity-70 blur-3xl" />
                            <div className="absolute right-[-6rem] top-24 h-72 w-72 rounded-full bg-[rgb(var(--color-surface-blue))] opacity-80 blur-3xl" />
                            <div className="absolute bottom-[-6rem] left-1/3 h-72 w-72 rounded-full bg-[rgb(var(--color-surface-lavender))] opacity-70 blur-3xl" />

                            <div className="relative px-5 pb-10 pt-5 lg:px-7">
                                <header className="mx-auto flex max-w-6xl flex-col gap-3 rounded-[18px] border border-[rgb(var(--color-border))] bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                                    <Link href="/" className="flex items-center gap-3">
                                        <img src="/assets/welcome/brand-mark.svg" alt="VoicePost AI" className="h-9 w-9" />
                                        <span className="text-lg font-semibold text-[rgb(var(--color-text-strong))]">
                                            VoicePost AI
                                        </span>
                                    </Link>

                                    <nav className="flex flex-wrap items-center gap-2 sm:gap-3">
                                        <Link href="#" className="nav-link">Product</Link>
                                        <Link href="#" className="nav-link">Use Cases</Link>
                                        <Link href="#" className="nav-link">Pricing</Link>
                                        {auth?.user ? (
                                            <NavLink href={route('dashboard')} primary>
                                                Open dashboard
                                            </NavLink>
                                        ) : (
                                            <>
                                                <NavLink href={route('login')}>Sign in</NavLink>
                                                <NavLink href={route('register')} primary>
                                                    Sign up
                                                </NavLink>
                                            </>
                                        )}
                                    </nav>
                                </header>

                                <section className="mx-auto grid max-w-6xl gap-5 py-8 xl:grid-cols-[.92fr_1.08fr] xl:items-start xl:gap-6 xl:py-10">
                                    <div className="text-center xl:text-left">
                                        <div className="app-badge mb-4">VoicePost AI</div>
                                        <h1 className="mx-auto max-w-4xl text-4xl font-extrabold leading-[0.98] tracking-[-0.05em] text-[rgb(var(--color-text-strong))] sm:text-5xl xl:mx-0 xl:text-6xl">
                                            Turn one short source into ready-to-post content.
                                        </h1>
                                        <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-[rgb(var(--color-text-muted))] xl:mx-0">
                                            Upload a short video, upload short audio, or paste one short text note. VoicePost AI turns it into a transcript plus five reusable content assets from one compact workspace.
                                        </p>

                                        <div className="mt-6 flex flex-wrap items-center justify-center gap-3 xl:justify-start">
                                            {auth?.user ? (
                                                <NavLink href={route('dashboard')} primary>
                                                    Open workspace
                                                </NavLink>
                                            ) : (
                                                <>
                                                    <NavLink href={route('register')} primary>
                                                        Start free
                                                    </NavLink>
                                                    <NavLink href={route('login')}>Sign in</NavLink>
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

                                    <div className="relative">
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
                                                    {['Transcript', 'AI Content', 'Magic Chat'].map((tab, index) => (
                                                        <div
                                                            key={tab}
                                                            className={index === 0 ? 'filter-pill filter-pill-active' : 'filter-pill'}
                                                        >
                                                            {tab}
                                                        </div>
                                                    ))}
                                                </div>

                                                <div className="mt-4 grid gap-3 xl:grid-cols-[250px_minmax(0,1fr)]">
                                                    <div className="space-y-4">
                                                        <div className="rounded-[16px] border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface-soft))] p-4">
                                                            <div className="text-xs uppercase tracking-[0.16em] text-[rgb(var(--color-text-faint))]">
                                                                Source preview
                                                            </div>
                                                            <div className="mt-3 overflow-hidden rounded-[14px] border border-[rgb(var(--color-border))] bg-black">
                                                                <div className="flex h-[230px] items-center justify-center">
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

                                <section className="mx-auto max-w-6xl py-8">
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
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
