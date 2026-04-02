import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, usePage } from '@inertiajs/react';

function statusClass(status) {
    switch (status) {
        case 'completed':
            return 'status-badge status-completed';
        case 'transcribing':
        case 'transcribed':
            return 'status-badge status-transcribing';
        case 'generating':
            return 'status-badge status-generating';
        case 'failed':
            return 'status-badge status-failed';
        default:
            return 'status-badge status-uploaded';
    }
}

export default function Dashboard({ auth, episodes = [] }) {
    const { flash } = usePage().props;
    const completedCount = episodes.filter((episode) => episode.status === 'completed').length;
    const inProgressCount = episodes.filter((episode) =>
        ['uploaded', 'transcribing', 'transcribed', 'generating'].includes(episode.status),
    ).length;
    const failedCount = episodes.filter((episode) => episode.status === 'failed').length;
    const latestEpisode = episodes[0] || null;

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <div className="grid gap-8 xl:grid-cols-[1.15fr_.85fr] xl:items-center">
                    <div>
                        <div className="app-badge mb-4">VoicePost AI</div>
                        <h1 className="app-heading">Supercharge your media workflow with a lighter, cleaner studio.</h1>
                        <p className="app-subheading mt-5 max-w-2xl">
                            The screenshots you shared point to a sharper SaaS pattern: high-contrast
                            typography, softer surfaces, black primary actions, and clearer content
                            workflow states. This dashboard now follows that model.
                        </p>

                        <div className="mt-8 flex flex-wrap gap-3">
                            <Link href={route('episodes.create')} className="btn-primary">
                                Upload audio
                            </Link>
                            <Link href={route('episodes.index')} className="btn-secondary">
                                Open library
                            </Link>
                        </div>
                    </div>

                    <div className="app-card-soft p-6">
                        <div className="tab-group">
                            <div className="tab-item tab-item-active">Transcript</div>
                            <div className="tab-item">AI Content</div>
                            <div className="tab-item">Magic Chat</div>
                        </div>

                        <div className="mt-5 grid gap-3">
                            {[
                                ['One source', 'Turn each upload into a full working content pack.'],
                                ['Clear progress', 'Track uploaded, transcribing, generating, and completed states.'],
                                ['Faster review', 'Open an episode workspace and copy exactly what you need.'],
                            ].map(([title, copy], index) => (
                                <div key={title} className="flex items-start gap-3 rounded-[20px] border border-[rgb(var(--color-border))] bg-white px-4 py-4">
                                    <div
                                        className={`profile-icon ${
                                            ['profile-icon-purple', 'profile-icon-blue', 'profile-icon-green'][index]
                                        } text-sm font-semibold text-[rgb(var(--color-text-strong))]`}
                                    >
                                        {index + 1}
                                    </div>
                                    <div>
                                        <div className="text-sm font-semibold text-[rgb(var(--color-text-strong))]">
                                            {title}
                                        </div>
                                        <div className="mt-1 text-sm leading-6 text-[rgb(var(--color-text-muted))]">
                                            {copy}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            }
        >
            <Head title="Dashboard" />

            {flash?.success && (
                <div className="app-card border-[rgb(var(--color-border))] bg-[rgb(var(--color-success-bg))] p-4 text-sm text-[rgb(var(--color-success-text))]">
                    {flash.success}
                </div>
            )}

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div className="stat-card">
                    <div className="text-xs uppercase tracking-[0.18em] text-[rgb(var(--color-text-faint))]">
                        Total uploads
                    </div>
                    <div className="mt-3 text-4xl font-semibold text-[rgb(var(--color-text-strong))]">
                        {episodes.length}
                    </div>
                    <div className="mt-2 text-sm text-[rgb(var(--color-text-muted))]">
                        All uploaded recordings in your workspace.
                    </div>
                </div>
                <div className="stat-card">
                    <div className="text-xs uppercase tracking-[0.18em] text-[rgb(var(--color-text-faint))]">
                        Completed
                    </div>
                    <div className="mt-3 text-4xl font-semibold text-[rgb(var(--color-text-strong))]">
                        {completedCount}
                    </div>
                    <div className="mt-2 text-sm text-[rgb(var(--color-text-muted))]">
                        Assets ready to review and export.
                    </div>
                </div>
                <div className="stat-card">
                    <div className="text-xs uppercase tracking-[0.18em] text-[rgb(var(--color-text-faint))]">
                        In progress
                    </div>
                    <div className="mt-3 text-4xl font-semibold text-[rgb(var(--color-text-strong))]">
                        {inProgressCount}
                    </div>
                    <div className="mt-2 text-sm text-[rgb(var(--color-text-muted))]">
                        Runs moving through transcript or generation.
                    </div>
                </div>
                <div className="stat-card">
                    <div className="text-xs uppercase tracking-[0.18em] text-[rgb(var(--color-text-faint))]">
                        Failed
                    </div>
                    <div className="mt-3 text-4xl font-semibold text-[rgb(var(--color-text-strong))]">
                        {failedCount}
                    </div>
                    <div className="mt-2 text-sm text-[rgb(var(--color-text-muted))]">
                        Runs that need a retry or settings check.
                    </div>
                </div>
            </div>

            <div className="grid gap-6 xl:grid-cols-[1.25fr_.75fr]">
                <div className="app-card overflow-hidden">
                    <div className="flex flex-col gap-4 border-b border-[rgb(var(--color-border))] px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h2 className="app-section-title">Recent recordings</h2>
                            <p className="app-muted">Open an episode and continue from transcript to content.</p>
                        </div>
                        <Link href={route('episodes.index')} className="btn-outline">
                            View all
                        </Link>
                    </div>

                    {episodes.length === 0 ? (
                        <div className="p-6 text-sm text-[rgb(var(--color-text-muted))]">
                            No episodes yet. Start with your first upload.
                        </div>
                    ) : (
                        <div className="divide-y divide-[rgb(var(--color-border))]">
                            {episodes.map((episode) => (
                                <div
                                    key={episode.id}
                                    className="flex flex-col gap-4 px-6 py-5 lg:flex-row lg:items-center lg:justify-between"
                                >
                                    <div className="min-w-0">
                                        <div className="truncate text-lg font-semibold text-[rgb(var(--color-text-strong))]">
                                            {episode.title}
                                        </div>
                                        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2 text-sm text-[rgb(var(--color-text-muted))]">
                                            <span>{episode.original_file_name || 'Audio file'}</span>
                                            <span>{episode.created_at}</span>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-3">
                                        <span className={statusClass(episode.status)}>{episode.status}</span>
                                        <Link href={route('episodes.show', episode.public_id)} className="btn-secondary">
                                            Open workspace
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="space-y-6">
                    <div className="app-card p-6">
                        <div className="app-badge-neutral">Next best step</div>
                        <div className="mt-4 text-2xl font-semibold text-[rgb(var(--color-text-strong))]">
                            {latestEpisode ? latestEpisode.title : 'Create your first content run'}
                        </div>
                        <p className="mt-3 text-sm leading-7 text-[rgb(var(--color-text-muted))]">
                            {latestEpisode
                                ? 'Open the latest recording, review the transcript, then polish the generated content pack.'
                                : 'Configure providers, upload a short recording, and use the generated outputs as your first publishing draft.'}
                        </p>
                        <div className="mt-5">
                            {latestEpisode ? (
                                <Link href={route('episodes.show', latestEpisode.public_id)} className="btn-primary w-full">
                                    Open latest episode
                                </Link>
                            ) : (
                                <Link href={route('settings.index')} className="btn-primary w-full">
                                    Configure providers
                                </Link>
                            )}
                        </div>
                    </div>

                    <div className="app-card p-6">
                        <h2 className="app-section-title">Output stack</h2>
                        <div className="mt-4 flex flex-wrap gap-2">
                            {['Summary', 'Blog Draft', 'LinkedIn Post', 'X Thread'].map((item) => (
                                <span key={item} className="filter-pill">
                                    {item}
                                </span>
                            ))}
                        </div>
                    </div>

                    <div className="app-card p-6">
                        <h2 className="app-section-title">Connected pipeline</h2>
                        <div className="mt-4 space-y-3">
                            {[
                                ['Transcription', 'OpenAI Whisper'],
                                ['Generation', 'Claude content pipeline'],
                                ['Storage', 'S3-compatible source management'],
                            ].map(([label, value], index) => (
                                <div key={label} className="flex items-center gap-3 rounded-[18px] border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface-soft))] px-4 py-3">
                                    <div
                                        className={`profile-icon ${
                                            ['profile-icon-blue', 'profile-icon-purple', 'profile-icon-green'][index]
                                        } text-sm font-semibold text-[rgb(var(--color-text-strong))]`}
                                    >
                                        •
                                    </div>
                                    <div className="flex-1">
                                        <div className="text-sm text-[rgb(var(--color-text-muted))]">{label}</div>
                                        <div className="text-sm font-semibold text-[rgb(var(--color-text-strong))]">
                                            {value}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
