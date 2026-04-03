import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, usePage } from '@inertiajs/react';
import CurrentFocusCard from '@/Components/dashboard/CurrentFocusCard';
import RecurringOutputsCard from '@/Components/dashboard/RecurringOutputsCard';
import RecentRecordingsCard from '@/Components/dashboard/RecentRecordingsCard';
import RecordingInfoCard from '@/Components/dashboard/RecordingInfoCard';
import StatsCard from '@/Components/dashboard/StatsCard';

const outputCards = [
    {
        title: 'Summary',
        description: 'A short clean overview of the main idea and supporting point.',
    },
    {
        title: 'LinkedIn Post',
        description: 'A sharper professional draft built from the transcript or text note.',
    },
    {
        title: 'X Post',
        description: 'A concise publish-ready version for fast short-form posting.',
    },
    {
        title: 'Instagram caption',
        description: 'A social-ready caption with a hook, short body, and hashtags.',
    },
    {
        title: 'Newsletter',
        description: 'A subject line and email-ready body for a quick newsletter draft.',
    },
];

export default function Dashboard({ auth, contentRequests = [] }) {
    const { flash, usageLimits } = usePage().props;
    const completedCount = contentRequests.filter((contentRequest) => contentRequest.status === 'completed').length;
    const processingCount = contentRequests.filter((contentRequest) =>
        ['uploaded', 'transcribing', 'transcribed', 'generating'].includes(contentRequest.status),
    ).length;
    const failedCount = contentRequests.filter((contentRequest) => ['failed', 'partial'].includes(contentRequest.status)).length;
    const activeContentRequest = contentRequests[0] || null;

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
                    <div>
                        <div className="app-badge-neutral">VoicePost AI Studio</div>
                        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-[rgb(var(--color-text-strong))]">
                            Create content from one short source.
                        </h1>
                        <p className="mt-2 max-w-2xl text-sm leading-7 text-[rgb(var(--color-text-muted))]">
                            Bring in a 1-minute video, audio clip, or one sentence under
                            200 characters, submit the run, and jump straight into the recording workspace.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <Link href={route('content-requests.create')} className="btn-primary-rect">
                            New recording
                        </Link>
                        <Link href={route('content-requests.index')} className="btn-outline">
                            Open library
                        </Link>
                    </div>
                </div>
            }
        >
            <Head title="Dashboard" />

            <div className="space-y-6">
                {flash?.success && (
                    <div className="app-card border-[rgb(var(--color-border))] bg-[rgb(var(--color-success-bg))] p-4 text-sm text-[rgb(var(--color-success-text))]">
                        {flash.success}
                    </div>
                )}

                {usageLimits ? (
                    <div className="app-card p-5">
                        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                            <div>
                                <div className="app-badge-neutral">Usage</div>
                                <div className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-[rgb(var(--color-text-strong))]">
                                    {usageLimits.remaining} of {usageLimits.limit} runs remaining
                                </div>
                                <div className="mt-2 text-sm leading-7 text-[rgb(var(--color-text-muted))]">
                                    ${usageLimits.plan_price_usd} plan. Each new content request counts as one run.
                                </div>
                            </div>

                            <div className="min-w-[220px] flex-1 lg:max-w-[340px]">
                                <div className="usage-bar-track">
                                    <div className="usage-bar-fill" style={{ width: `${usageLimits.percent_used}%` }} />
                                </div>
                                <div className="mt-2 text-sm text-[rgb(var(--color-text-muted))]">
                                    {usageLimits.used} used · {usageLimits.percent_used}% consumed
                                </div>
                            </div>
                        </div>
                    </div>
                ) : null}

                <StatsCard
                    contentRequests={contentRequests}
                    completedCount={completedCount}
                    processingCount={processingCount}
                    failedCount={failedCount}
                    usageLimits={usageLimits}
                />

                <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,.9fr)]">
                    <div className="space-y-6">
                        <RecordingInfoCard />

                        <RecentRecordingsCard contentRequests={contentRequests} />

                        <RecurringOutputsCard items={outputCards} />
                    </div>

                    <div className="space-y-6 xl:sticky xl:top-24 xl:self-start">
                        <CurrentFocusCard activeContentRequest={activeContentRequest} />

                        <div className="app-card p-6">
                            <div className="app-badge-neutral">Best Practices</div>
                            <div className="mt-4 space-y-4">
                                {[
                                    'Keep file-based inputs close to one main idea instead of mixing multiple topics.',
                                    'Lead with the strongest insight first so the transcript stays focused.',
                                    'For text mode, one sentence with a clear angle produces cleaner post drafts.',
                                ].map((item) => (
                                    <div
                                        key={item}
                                        className="dashboard-note text-sm leading-6 text-[rgb(var(--color-text-muted))]"
                                    >
                                        {item}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
