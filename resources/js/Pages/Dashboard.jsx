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


export default function Dashboard({ auth, episodes = [] }) {
    const { flash } = usePage().props;
    const completedCount = episodes.filter((episode) => episode.status === 'completed').length;
    const processingCount = episodes.filter((episode) =>
        ['uploaded', 'transcribing', 'transcribed', 'generating'].includes(episode.status),
    ).length;
    const failedCount = episodes.filter((episode) => episode.status === 'failed').length;
    const activeEpisode = episodes[0] || null;

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
                            Bring in a 1-minute video, audio clip, recording, or one sentence under
                            200 characters, submit the run, and jump straight into the recording workspace.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <Link href={route('episodes.index')} className="topbar-action">
                            Library
                        </Link>
                        <Link href={route('settings.index')} className="topbar-action">
                            Settings
                        </Link>
                        <Link href={route('episodes.create')} className="btn-primary-rect">
                            Full upload page
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

                <StatsCard episodes={episodes} completedCount={completedCount} processingCount={processingCount} failedCount={failedCount} />

                <div className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_360px]">
                    <div className="space-y-6">
                        <RecordingInfoCard />

                        <RecentRecordingsCard episodes={episodes} />

                        <RecurringOutputsCard items={outputCards} />
                    </div>

                    <div className="space-y-6 xl:sticky xl:top-24 xl:self-start">
                        <CurrentFocusCard activeEpisode={activeEpisode} />

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
                                        className="rounded-[18px] border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface-soft))] px-4 py-3 text-sm leading-6 text-[rgb(var(--color-text-muted))]"
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
