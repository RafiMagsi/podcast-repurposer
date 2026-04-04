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
                <div className="flex flex-col gap-4 lg:gap-5 xl:flex-row xl:items-end xl:justify-between">
                    <div className="max-w-3xl">
                        <div className="app-badge-neutral">VoicePost AI Studio</div>
                        <h1 className="mt-3 text-[34px] font-semibold tracking-[-0.045em] text-[rgb(var(--color-text-strong))] sm:text-[40px]">
                            Turn one short source into ready-to-post content.
                        </h1>
                        <p className="mt-2 max-w-2xl text-sm leading-6 text-[rgb(var(--color-text-muted))]">
                            Start with a 1-minute video, a 1-minute audio clip, or one short text idea. Submit the run here, then review the transcript and five outputs in the workspace.
                        </p>
                    </div>

                    <div className="grid w-full gap-2 sm:w-auto sm:grid-cols-2 xl:flex xl:w-auto xl:flex-wrap xl:items-center">
                        <Link href={route('content-requests.create')} className="btn-primary-rect w-full sm:min-w-[170px]">
                            New recording
                        </Link>
                        <Link href={route('content-requests.index')} className="btn-outline w-full sm:min-w-[150px]">
                            Open library
                        </Link>
                    </div>
                </div>
            }
        >
            <Head title="Dashboard" />

            <div className="space-y-4 sm:space-y-5 xl:space-y-6">
                {flash?.success && (
                    <div className="app-card border-[rgb(var(--color-border))] bg-[rgb(var(--color-success-bg))] p-4 text-sm text-[rgb(var(--color-success-text))]">
                        {flash.success}
                    </div>
                )}

                <div className="grid gap-4 sm:gap-5 xl:grid-cols-[minmax(0,1.48fr)_minmax(300px,.88fr)] xl:gap-6">
                    <div className="space-y-4 sm:space-y-5 xl:space-y-6">
                        <StatsCard
                            contentRequests={contentRequests}
                            completedCount={completedCount}
                            processingCount={processingCount}
                            failedCount={failedCount}
                            usageLimits={usageLimits}
                        />

                        <RecordingInfoCard />

                        <RecentRecordingsCard contentRequests={contentRequests} />

                        <RecurringOutputsCard items={outputCards} />
                    </div>

                    <div className="space-y-4 sm:space-y-5 xl:sticky xl:top-24 xl:self-start xl:space-y-6">
                        {usageLimits ? (
                            <div className="app-card-compact p-4">
                                <div className="section-header-compact">
                                    <div className="section-header-copy">
                                        <div className="app-badge-neutral">Usage</div>
                                        <div className="mt-2 text-xl font-semibold tracking-[-0.03em] text-[rgb(var(--color-text-strong))]">
                                            {usageLimits.remaining} / {usageLimits.limit} left
                                        </div>
                                    </div>
                                    <div className="pill-compact">
                                        ${usageLimits.plan_price_usd} plan
                                    </div>
                                </div>

                                <div className="usage-bar-track">
                                    <div className="usage-bar-fill" style={{ width: `${usageLimits.percent_used}%` }} />
                                </div>
                                <div className="mt-2 text-sm leading-6 text-[rgb(var(--color-text-muted))]">
                                    {usageLimits.used} used · {usageLimits.percent_used}% consumed
                                </div>
                            </div>
                        ) : null}

                        <CurrentFocusCard activeContentRequest={activeContentRequest} />

                        <div className="app-card-compact p-4">
                            <div className="section-header-compact">
                                <div className="section-header-copy">
                                    <div className="app-badge-neutral">Quick notes</div>
                                </div>
                            </div>
                            <div className="space-y-3">
                                {[
                                    'Keep file-based inputs close to one main idea instead of mixing multiple topics.',
                                    'Lead with the strongest insight first so the transcript stays focused.',
                                    'For text mode, one sentence with a clear angle produces cleaner post drafts.',
                                ].map((item) => (
                                    <div
                                        key={item}
                                        className="note-card-muted"
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
