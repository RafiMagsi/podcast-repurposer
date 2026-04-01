import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';

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

export default function EpisodesIndex({ auth, episodes }) {
    return (
        <AuthenticatedLayout
            user={auth?.user}
            header={
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <div className="app-badge mb-3">Episode Library</div>
                        <h1 className="app-heading">Manage uploaded episodes</h1>
                        <p className="app-subheading mt-2 max-w-2xl">
                            View uploaded audio files, monitor processing status, and open generated results.
                        </p>
                    </div>

                    <Link href={route('episodes.create')} className="btn-primary">
                        Upload Audio
                    </Link>
                </div>
            }
        >
            <Head title="Episodes" />

            <div className="app-card overflow-hidden">
                <div className="flex items-center justify-between border-b border-[var(--color-border)] px-6 py-4">
                    <div>
                        <h2 className="app-section-title">All episodes</h2>
                        <p className="app-muted">Your uploaded audio files and processing state.</p>
                    </div>
                </div>

                {episodes.data.length === 0 ? (
                    <div className="p-6 text-sm text-slate-400">No episodes found.</div>
                ) : (
                    episodes.data.map((episode) => (
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

            {episodes.links && episodes.links.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {episodes.links.map((link, index) => (
                        <Link
                            key={`${link.label}-${index}`}
                            href={link.url || '#'}
                            preserveScroll
                            className={`rounded-xl border px-3 py-2 text-sm transition ${
                                link.active
                                    ? 'border-transparent bg-white/10 text-white'
                                    : 'border-[var(--color-border)] text-slate-300 hover:bg-white/5'
                            } ${!link.url ? 'pointer-events-none opacity-50' : ''}`}
                            dangerouslySetInnerHTML={{ __html: link.label }}
                        />
                    ))}
                </div>
            )}
        </AuthenticatedLayout>
    );
}