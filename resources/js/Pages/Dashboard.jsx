import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, usePage } from '@inertiajs/react';

function statusClass(status) {
    switch (status) {
        case 'completed':
            return 'status-badge status-completed';
        case 'transcribing':
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

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <div className="app-badge mb-3">AI Workflow Dashboard</div>
                        <h1 className="app-heading">Turn audio into reusable content</h1>
                        <p className="app-subheading mt-2 max-w-2xl">
                            Upload a podcast or spoken recording, generate a transcript,
                            then turn it into a blog post, LinkedIn post, and X thread.
                        </p>
                    </div>

                    <div className="flex gap-3">
                        <Link href={route('settings.index')} className="btn-secondary">
                            Settings
                        </Link>
                        <Link href={route('episodes.create')} className="btn-primary">
                            Upload Audio
                        </Link>
                    </div>
                </div>
            }
        >
            <Head title="Dashboard" />

            {flash?.success && (
                <div className="app-card border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-300">
                    {flash.success}
                </div>
            )}

            <div className="grid gap-4 md:grid-cols-3">
                <div className="stat-card">
                    <div className="app-muted">Recent uploads</div>
                    <div className="mt-2 text-3xl font-semibold text-white">{episodes.length}</div>
                </div>
                <div className="stat-card">
                    <div className="app-muted">Workflow</div>
                    <div className="mt-2 text-sm text-slate-200">Whisper + Claude pipeline</div>
                </div>
                <div className="stat-card">
                    <div className="app-muted">Output set</div>
                    <div className="mt-2 text-sm text-slate-200">Summary, Blog, LinkedIn, X Thread</div>
                </div>
            </div>

            <div className="app-card overflow-hidden">
                <div className="flex items-center justify-between border-b border-[var(--color-border)] px-6 py-4">
                    <div>
                        <h2 className="app-section-title">Recent episodes</h2>
                        <p className="app-muted">Track processing and open generated content.</p>
                    </div>
                    <Link href={route('episodes.index')} className="btn-ghost">
                        View all
                    </Link>
                </div>

                {episodes.length === 0 ? (
                    <div className="p-6 text-sm text-slate-400">
                        No episodes yet. Upload your first audio file.
                    </div>
                ) : (
                    episodes.map((episode) => (
                        <div
                            key={episode.id}
                            className="flex flex-col gap-3 border-b border-[var(--color-border)] px-6 py-5 last:border-b-0 md:flex-row md:items-center md:justify-between"
                        >
                            <div className="min-w-0">
                                <div className="truncate text-base font-semibold text-white">
                                    {episode.title}
                                </div>
                                <div className="mt-1 text-sm text-slate-400">
                                    {episode.original_file_name || 'Audio file'} · {episode.created_at}
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <span className={statusClass(episode.status)}>{episode.status}</span>
                                <Link href={route('episodes.show', episode.public_id)} className="btn-secondary">
                                    Open
                                </Link>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </AuthenticatedLayout>
    );
}