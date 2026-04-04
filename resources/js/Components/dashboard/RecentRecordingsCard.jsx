export default function RecentRecordingsCard({ contentRequests }) {
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
                return 'Audio';
        }
    }

    function statusClass(status) {
        switch (status) {
            case 'completed':
                return 'status-badge status-completed';
            case 'cancelled':
                return 'status-badge status-cancelled';
            case 'partial':
                return 'status-badge status-partial';
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
        <div className="app-card-compact overflow-hidden">
            <div className="section-header-compact border-b border-[rgb(var(--color-border))] px-4 py-3.5">
                <div>
                    <h2 className="app-section-title">Recent recordings</h2>
                    <p className="app-muted mt-1 text-sm">
                        Latest runs, ready to reopen.
                    </p>
                </div>

                <a href={route('content-requests.index')} className="btn-compact">
                    Open library
                </a>
            </div>

            {contentRequests.length === 0 ? (
                <div className="p-4 text-sm text-[rgb(var(--color-text-muted))]">
                    No recordings yet. Create your first short source above.
                </div>
            ) : (
                <div className="divide-y divide-[rgb(var(--color-border))]">
                    {contentRequests.map((contentRequest) => (
                        <div
                            key={contentRequest.public_id || contentRequest.id}
                            className="flex flex-col gap-2.5 px-4 py-3.5 lg:flex-row lg:items-center lg:justify-between"
                        >
                            <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                    <div className="truncate text-sm font-semibold leading-5 text-[rgb(var(--color-text-strong))]">
                                        {contentRequest.title}
                                    </div>
                                    <span className={sourcePillClass(contentRequest.source_type)}>
                                        {sourceLabel(contentRequest.source_type)}
                                    </span>
                                    <span className={statusClass(contentRequest.status)}>{contentRequest.status}</span>
                                </div>
                                <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs leading-5 text-[rgb(var(--color-text-muted))]">
                                    <span className="truncate">{contentRequest.original_file_name || 'Inline text note'}</span>
                                    <span>{formatRelative(contentRequest.created_at)}</span>
                                </div>
                            </div>

                            <a
                                href={route('content-requests.show', contentRequest.public_id)}
                                className="btn-compact w-full justify-center lg:w-auto"
                            >
                                Open
                            </a>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
