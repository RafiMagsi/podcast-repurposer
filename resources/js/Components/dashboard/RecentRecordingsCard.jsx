import { Link } from '@inertiajs/react';

export default function RecentRecordingsCard({episodes }){

    function sourcePillClass(sourceType) {
        switch (sourceType) {
            case 'video':
                return 'app-badge-neutral';
            case 'text':
                return 'app-badge';
            case 'audio':
                return 'app-badge-neutral';
            default:
                return 'app-badge-neutral';
        }
    }

    function sourceLabel(sourceType) {
        switch (sourceType) {
            case 'video':
                return 'Video';
            case 'text':
                return 'Text note';
            case 'audio':
                return 'Audio';
            default:
                return 'Recording';
        }
    }

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
    
    function formatRelative(dateString) {
        if (!dateString) return 'Unknown';
    
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMinutes = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMinutes / 60);
        const diffDays = Math.floor(diffHours / 24);
    
        if (diffMinutes < 1) return 'Just now';
        if (diffMinutes < 60) return `${diffMinutes}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
    
        return date.toLocaleDateString();
    }

    return (
        <div className="app-card overflow-hidden">
            <div className="flex flex-col gap-4 border-b border-[rgb(var(--color-border))] px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="app-section-title">Recent recordings</h2>
                    <p className="app-muted mt-1">
                        Browse the latest runs and jump back into the workspace quickly.
                    </p>
                </div>

                <Link href={route('episodes.index')} className="btn-secondary">
                    Open library
                </Link>
            </div>

            {episodes.length === 0 ? (
                <div className="p-6 text-sm text-[rgb(var(--color-text-muted))]">
                    No recordings yet. Create your first short source above.
                </div>
            ) : (
                <div className="divide-y divide-[rgb(var(--color-border))]">
                    {episodes.map((episode) => (
                        <div
                            key={episode.public_id || episode.id}
                            className="flex flex-col gap-4 px-6 py-5 xl:flex-row xl:items-center xl:justify-between"
                        >
                            <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-3">
                                    <div className="truncate text-base font-semibold text-[rgb(var(--color-text-strong))]">
                                        {episode.title}
                                    </div>
                                    <span className={sourcePillClass(episode.source_type)}>
                                        {sourceLabel(episode.source_type)}
                                    </span>
                                    <span className={statusClass(episode.status)}>{episode.status}</span>
                                </div>
                                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2 text-sm text-[rgb(var(--color-text-muted))]">
                                    <span>{episode.original_file_name || 'Inline text note'}</span>
                                    <span>{formatRelative(episode.created_at)}</span>
                                </div>
                            </div>

                            <Link href={route('episodes.show', episode.public_id)} className="btn-secondary">
                                Open workspace
                            </Link>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}