import { Head, Link } from '@inertiajs/react';

const features = [
    {
        title: 'Upload once',
        description:
            'Drop in a podcast episode, interview, webinar, or voice note and let the pipeline handle the rest.',
    },
    {
        title: 'Transcribe with AI',
        description:
            'Convert long-form audio into clean transcript text that is ready for downstream content generation.',
    },
    {
        title: 'Repurpose fast',
        description:
            'Generate blog posts, LinkedIn posts, X threads, summaries, and reuse-ready drafts from one source.',
    },
    {
        title: 'Stay in control',
        description:
            'Keep provider credentials in your own settings panel and review every output before you publish anything.',
    },
];

const outputs = [
    'Transcript',
    'Summary',
    'Blog Post',
    'LinkedIn Post',
    'X Thread',
    'More formats later',
];

const steps = [
    {
        index: '01',
        title: 'Upload your audio',
        description: 'Add your podcast or spoken content and start a processing run in seconds.',
    },
    {
        index: '02',
        title: 'Generate the transcript',
        description: 'The app transcribes the source audio so the content engine works from structured text, not guesswork.',
    },
    {
        index: '03',
        title: 'Create content assets',
        description: 'Turn one recording into multiple written outputs that you can review, copy, and reuse.',
    },
];

function NavLink({ href, children, primary = false }) {
    const base =
        'inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-medium transition';

    return primary ? (
        <Link
            href={href}
            className={`${base} bg-white text-neutral-950 hover:bg-neutral-200`}
        >
            {children}
        </Link>
    ) : (
        <Link
            href={href}
            className={`${base} border border-white/15 bg-white/5 text-white hover:border-white/30 hover:bg-white/10`}
        >
            {children}
        </Link>
    );
}

function FeatureCard({ title, description }) {
    return (
        <div className="group rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur transition hover:border-white/20 hover:bg-white/[0.06]">
            <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-xs font-semibold text-white/80">
                ✦
            </div>
            <h3 className="text-lg font-semibold text-white">{title}</h3>
            <p className="mt-2 text-sm leading-6 text-white/65">{description}</p>
        </div>
    );
}

export default function Welcome({ auth }) {
    return (
        <>
            <Head title="Podcast Repurposer" />

            <div className="min-h-screen bg-[#0a0a0a] text-white selection:bg-lime-300 selection:text-black">
                <div className="relative isolate overflow-hidden">
                    <div className="absolute inset-0 opacity-70">
                        <img
                            src="/assets/welcome/grid-bg.svg"
                            alt=""
                            className="h-full w-full object-cover"
                        />
                    </div>
                    <div className="absolute left-1/2 top-[-12rem] h-[34rem] w-[34rem] -translate-x-1/2 rounded-full bg-lime-400/12 blur-3xl" />
                    <div className="absolute right-[-8rem] top-40 h-72 w-72 rounded-full bg-cyan-400/10 blur-3xl" />

                    <div className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col px-6 pb-16 pt-6 lg:px-8">
                        <header className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 backdrop-blur md:px-5">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/10">
                                    <img
                                        src="/assets/welcome/brand-mark.svg"
                                        alt="Podcast Repurposer"
                                        className="h-6 w-6"
                                    />
                                </div>
                                <div>
                                    <div className="text-sm font-semibold tracking-wide text-white">
                                        Podcast Repurposer
                                    </div>
                                    <div className="text-xs text-white/45">
                                        AI podcast-to-content workflow
                                    </div>
                                </div>
                            </div>

                            <nav className="flex items-center gap-2">
                                {auth?.user ? (
                                    <NavLink href={route('dashboard')} primary>
                                        Open dashboard
                                    </NavLink>
                                ) : (
                                    <>
                                        <NavLink href={route('login')}>Log in</NavLink>
                                        <NavLink href={route('register')} primary>
                                            Start free
                                        </NavLink>
                                    </>
                                )}
                            </nav>
                        </header>

                        <section className="grid flex-1 items-center gap-14 py-14 lg:grid-cols-[1.05fr_.95fr] lg:py-20">
                            <div>
                                <div className="inline-flex items-center gap-2 rounded-full border border-lime-400/20 bg-lime-400/10 px-3 py-1 text-xs font-medium text-lime-200">
                                    Built for creators, founders, and content teams
                                </div>

                                <h1 className="mt-6 max-w-4xl text-4xl font-semibold leading-[1.02] tracking-[-0.04em] text-white sm:text-5xl md:text-6xl">
                                    Turn one audio recording into
                                    <span className="block bg-gradient-to-r from-lime-300 via-white to-cyan-300 bg-clip-text text-transparent">
                                        publish-ready content assets.
                                    </span>
                                </h1>

                                <p className="mt-6 max-w-2xl text-base leading-7 text-white/65 sm:text-lg">
                                    Upload a podcast episode, let AI transcribe it, then generate reusable written content from the same source. Clean workflow. Clear outputs. No bloated nonsense.
                                </p>

                                <div className="mt-8 flex flex-wrap items-center gap-3">
                                    {auth?.user ? (
                                        <NavLink href={route('dashboard')} primary>
                                            Go to dashboard
                                        </NavLink>
                                    ) : (
                                        <>
                                            <NavLink href={route('register')} primary>
                                                Create account
                                            </NavLink>
                                            <NavLink href={route('login')}>Log in</NavLink>
                                        </>
                                    )}
                                </div>

                                <div className="mt-8 flex flex-wrap gap-3 text-xs text-white/50">
                                    <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5">
                                        Upload audio
                                    </span>
                                    <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5">
                                        Transcribe with AI
                                    </span>
                                    <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5">
                                        Generate multiple outputs
                                    </span>
                                    <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5">
                                        Review before publishing
                                    </span>
                                </div>
                            </div>

                            <div className="relative">
                                <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-br from-lime-300/15 via-transparent to-cyan-300/10 blur-2xl" />
                                <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#0f1012] shadow-2xl shadow-black/40">
                                    <div className="flex items-center justify-between border-b border-white/8 px-5 py-4">
                                        <div>
                                            <p className="text-sm font-medium text-white">AI Repurposing Run</p>
                                            <p className="text-xs text-white/45">One source, multiple outputs</p>
                                        </div>
                                        <div className="rounded-full border border-lime-400/25 bg-lime-400/10 px-3 py-1 text-xs text-lime-200">
                                            Ready to process
                                        </div>
                                    </div>

                                    <div className="grid gap-4 p-5">
                                        <div className="grid gap-4 lg:grid-cols-[1.15fr_.85fr]">
                                            <div className="rounded-3xl border border-white/8 bg-white/[0.03] p-4">
                                                <div className="mb-3 flex items-center justify-between">
                                                    <div>
                                                        <p className="text-sm font-medium text-white">Audio pipeline</p>
                                                        <p className="text-xs text-white/45">Upload → transcript → content</p>
                                                    </div>
                                                    <span className="text-xs text-white/40">Live preview</span>
                                                </div>
                                                <img
                                                    src="/assets/welcome/workflow-diagram.svg"
                                                    alt="Workflow diagram"
                                                    className="w-full"
                                                />
                                            </div>

                                            <div className="rounded-3xl border border-white/8 bg-white/[0.03] p-4">
                                                <div className="mb-3">
                                                    <p className="text-sm font-medium text-white">Supported outputs</p>
                                                    <p className="text-xs text-white/45">Start small, move fast</p>
                                                </div>
                                                <img
                                                    src="/assets/welcome/output-stack.svg"
                                                    alt="Generated content outputs"
                                                    className="w-full"
                                                />
                                            </div>
                                        </div>

                                        <div className="rounded-3xl border border-white/8 bg-white/[0.03] p-4">
                                            <div className="mb-3 flex items-center justify-between">
                                                <div>
                                                    <p className="text-sm font-medium text-white">Transcript confidence</p>
                                                    <p className="text-xs text-white/45">Visual cue for source quality</p>
                                                </div>
                                                <span className="rounded-full bg-white/5 px-2.5 py-1 text-[11px] text-white/55">
                                                    AI-assisted
                                                </span>
                                            </div>
                                            <img
                                                src="/assets/welcome/audio-wave.svg"
                                                alt="Audio waveform"
                                                className="w-full"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>
                    </div>
                </div>

                <section className="mx-auto max-w-7xl px-6 py-6 lg:px-8 lg:py-12">
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                        {features.map((feature) => (
                            <FeatureCard key={feature.title} {...feature} />
                        ))}
                    </div>
                </section>

                <section className="mx-auto max-w-7xl px-6 py-14 lg:px-8">
                    <div className="grid gap-8 lg:grid-cols-[.95fr_1.05fr]">
                        <div className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-8">
                            <p className="text-sm font-medium text-lime-200">What the product does</p>
                            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-white">
                                Designed to make long-form audio useful again.
                            </h2>
                            <p className="mt-4 max-w-xl text-sm leading-7 text-white/65 sm:text-base">
                                Instead of manually re-listening to recordings and rewriting everything from scratch, the product gives you a tight workflow for turning one source file into reusable content blocks.
                            </p>

                            <div className="mt-8 grid gap-3 sm:grid-cols-2">
                                {outputs.map((item) => (
                                    <div
                                        key={item}
                                        className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-3"
                                    >
                                        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-lime-300 text-xs font-bold text-black">
                                            ✓
                                        </span>
                                        <span className="text-sm text-white/80">{item}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="grid gap-4">
                            {steps.map((step) => (
                                <div
                                    key={step.index}
                                    className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-6"
                                >
                                    <div className="flex items-start gap-4">
                                        <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-sm font-semibold text-white/80">
                                            {step.index}
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-semibold text-white">{step.title}</h3>
                                            <p className="mt-2 text-sm leading-7 text-white/65">
                                                {step.description}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="mx-auto max-w-7xl px-6 pb-20 pt-4 lg:px-8">
                    <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-white/[0.06] via-white/[0.03] to-lime-300/[0.08] p-8 sm:p-10">
                        <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
                            <div>
                                <p className="text-sm font-medium text-lime-200">Ready to test the workflow?</p>
                                <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-white">
                                    Start with one episode. Ship faster from the same source.
                                </h2>
                                <p className="mt-4 max-w-2xl text-sm leading-7 text-white/65 sm:text-base">
                                    Use the landing page to explain value. Use the dashboard to do the real work. That split is cleaner, more credible, and easier to scale later.
                                </p>
                            </div>

                            <div className="flex flex-wrap gap-3">
                                {auth?.user ? (
                                    <NavLink href={route('dashboard')} primary>
                                        Open dashboard
                                    </NavLink>
                                ) : (
                                    <>
                                        <NavLink href={route('register')} primary>
                                            Create account
                                        </NavLink>
                                        <NavLink href={route('login')}>
                                            Log in
                                        </NavLink>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </>
    );
}
