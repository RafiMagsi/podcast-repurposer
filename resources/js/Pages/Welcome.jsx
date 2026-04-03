import { Head, Link } from '@inertiajs/react';

const features = [
    {
        title: 'Start with one short source',
        description: 'Use a 1-minute video, 1-minute audio clip, or one short text idea and let the workflow handle the rest.',
    },
    {
        title: 'Review clearly',
        description: 'Inspect transcript, summary, and generated assets inside a cleaner editorial layout.',
    },
    {
        title: 'Reuse faster',
        description: 'Turn one source into a summary, LinkedIn post, X post, Instagram caption, and newsletter draft.',
    },
    {
        title: 'Stay in control',
        description: 'Keep provider settings in your own workspace and rerun outputs when needed.',
    },
];

const outputs = ['Transcript', 'Summary', 'LinkedIn Post', 'X Post', 'Instagram Caption', 'Newsletter'];

const tabs = ['Transcript', 'AI Content', 'Magic Chat'];

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
        <div className="app-card p-6">
            <div className="app-badge-neutral mb-4">Feature</div>
            <h3 className="text-lg font-semibold text-[rgb(var(--color-text-strong))]">{title}</h3>
            <p className="mt-2 text-sm leading-7 text-[rgb(var(--color-text-muted))]">{description}</p>
        </div>
    );
}

export default function Welcome({ auth }) {
    return (
        <>
            <Head title="VoicePost AI" />

            <div className="min-h-screen overflow-hidden">
                <div className="mx-auto max-w-[1500px] p-3 sm:p-4">
                    <div className="overflow-hidden rounded-[36px] border border-[rgb(var(--color-border))] bg-[rgb(var(--color-page-bg))] shadow-[0_30px_80px_rgba(17,24,39,0.08)]">
                        <div className="bg-[rgb(var(--color-surface-pink))] px-6 py-3 text-center text-sm font-semibold text-[rgb(var(--color-text-strong))]">
                            VoicePost AI for fast short-source-to-content workflows
                        </div>

                        <div className="relative">
                            <div className="absolute left-[-8rem] top-28 h-72 w-72 rounded-full bg-[rgb(var(--color-surface-pink))] opacity-70 blur-3xl" />
                            <div className="absolute right-[-6rem] top-24 h-72 w-72 rounded-full bg-[rgb(var(--color-surface-blue))] opacity-80 blur-3xl" />
                            <div className="absolute bottom-[-6rem] left-1/3 h-72 w-72 rounded-full bg-[rgb(var(--color-surface-lavender))] opacity-70 blur-3xl" />

                            <div className="relative px-6 pb-20 pt-6 lg:px-10">
                                <header className="mx-auto flex max-w-6xl flex-col gap-4 rounded-[24px] border border-[rgb(var(--color-border))] bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
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

                                <section className="mx-auto grid max-w-6xl gap-12 py-14 lg:grid-cols-[1fr_.95fr] lg:items-center lg:py-20">
                                    <div className="text-center lg:text-left">
                                        <div className="app-badge mb-5">VoicePost AI</div>
                                        <h1 className="mx-auto max-w-4xl text-5xl font-extrabold leading-[0.98] tracking-[-0.05em] text-[rgb(var(--color-text-strong))] sm:text-6xl lg:mx-0 lg:text-7xl">
                                            Turn one short source into ready-to-post content.
                                        </h1>
                                        <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-[rgb(var(--color-text-muted))] lg:mx-0">
                                            Upload a 1-minute video, a 1-minute audio clip, or paste one short text idea. VoicePost AI turns it into a transcript and five reusable content assets from one clean workspace.
                                        </p>

                                        <div className="mt-8 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
                                            {auth?.user ? (
                                                <NavLink href={route('dashboard')} primary>
                                                    Open workspace
                                                </NavLink>
                                            ) : (
                                                <>
                                                    <NavLink href={route('register')} primary>
                                                        Try a voice note free
                                                    </NavLink>
                                                    <NavLink href={route('login')}>Sign in</NavLink>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    <div className="relative">
                                        <div className="app-card overflow-hidden rounded-[32px]">
                                            <div className="flex items-center gap-2 border-b border-[rgb(var(--color-border))] bg-black px-5 py-3">
                                                <span className="h-3 w-3 rounded-full bg-[#ff6f61]" />
                                                <span className="h-3 w-3 rounded-full bg-[#ffd166]" />
                                                <span className="h-3 w-3 rounded-full bg-[#7bd389]" />
                                            </div>

                                            <div className="bg-white p-6">
                                                <div className="input-hero">Start drafting with AI...</div>

                                                <div className="mt-5 flex flex-wrap gap-2">
                                                    {tabs.map((tab, index) => (
                                                        <div
                                                            key={tab}
                                                            className={index === 0 ? 'filter-pill filter-pill-active' : 'filter-pill'}
                                                        >
                                                            {tab}
                                                        </div>
                                                    ))}
                                                </div>

                                                <div className="mt-5 grid gap-4 lg:grid-cols-[1.1fr_.9fr]">
                                                    <div className="rounded-[24px] border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface-soft))] p-4">
                                                        <div className="mb-3 flex items-center justify-between">
                                                            <div>
                                                                <div className="text-sm font-semibold text-[rgb(var(--color-text-strong))]">
                                                                    Workflow
                                                                </div>
                                                                <div className="text-xs text-[rgb(var(--color-text-faint))]">
                                                                    Upload / Transcript / Content
                                                                </div>
                                                            </div>
                                                            <span className="app-badge-neutral">Live</span>
                                                        </div>
                                                        <img
                                                            src="/assets/welcome/workflow-diagram.svg"
                                                            alt="Workflow diagram"
                                                            className="w-full"
                                                        />
                                                    </div>

                                                    <div className="rounded-[24px] border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface-soft))] p-4">
                                                        <div className="text-sm font-semibold text-[rgb(var(--color-text-strong))]">
                                                            Output stack
                                                        </div>
                                                        <div className="mt-3 flex flex-wrap gap-2">
                                                            {outputs.map((item) => (
                                                                <span key={item} className="filter-pill">
                                                                    {item}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </section>

                                <section className="mx-auto max-w-6xl py-2">
                                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                                        {features.map((feature) => (
                                            <FeatureCard key={feature.title} {...feature} />
                                        ))}
                                    </div>
                                </section>

                                <section className="mx-auto max-w-6xl py-16">
                                    <div className="grid gap-6 lg:grid-cols-[1.05fr_.95fr]">
                                        <div className="app-card p-8">
                                            <div className="app-badge-neutral">What you get</div>
                                            <h2 className="mt-4 text-3xl font-bold tracking-[-0.04em] text-[rgb(var(--color-text-strong))]">
                                                A short-source workspace that feels focused, not bloated.
                                            </h2>
                                            <p className="mt-4 max-w-2xl text-sm leading-7 text-[rgb(var(--color-text-muted))]">
                                                VoicePost AI is built around one promise: turn one short source into ready-to-post content. The experience stays calm, structured, and easy to scan while keeping the real workflow visible.
                                            </p>

                                            <div className="mt-8 grid gap-3 sm:grid-cols-2">
                                                {outputs.map((item, index) => (
                                                    <div
                                                        key={item}
                                                        className="flex items-center gap-3 rounded-[18px] border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface-soft))] px-4 py-3"
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
                                        </div>

                                        <div className="space-y-4">
                                            {[
                                                ['01', 'Add one short source', 'Upload a video, upload audio, or paste a short text idea.'],
                                                ['02', 'Generate the transcript', 'Use the transcript as the source of truth for the writing pass.'],
                                                ['03', 'Review five outputs', 'Copy the summary, LinkedIn post, X post, Instagram caption, and newsletter from one workspace.'],
                                            ].map(([step, title, description]) => (
                                                <div key={step} className="app-card p-6">
                                                    <div className="flex items-start gap-4">
                                                        <div className="profile-icon profile-icon-blue text-sm font-semibold text-[rgb(var(--color-secondary-text))]">
                                                            {step}
                                                        </div>
                                                        <div>
                                                            <h3 className="text-xl font-semibold text-[rgb(var(--color-text-strong))]">
                                                                {title}
                                                            </h3>
                                                            <p className="mt-2 text-sm leading-7 text-[rgb(var(--color-text-muted))]">
                                                                {description}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
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
