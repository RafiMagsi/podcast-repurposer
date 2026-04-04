export default function CurrentFocusCard({ activeContentRequest }) {
    return (
        <div className="app-card-compact p-4">
            <div className="app-badge-neutral">Current Focus</div>

            <h2 className="mt-2.5 text-[1.8rem] font-semibold tracking-[-0.04em] text-[rgb(var(--color-text-strong))]">
                {activeContentRequest ? activeContentRequest.title : 'Build your first content run'}
            </h2>

            <p className="mt-1.5 text-sm leading-5 text-[rgb(var(--color-text-muted))]">
                {activeContentRequest
                    ? 'Open the latest run to review transcript, outputs, and status.'
                    : 'Start with a short video, audio clip, or one text idea.'}
            </p>

            <div className="mt-3.5 compact-grid-3 xl:grid-cols-1">
                <div className="note-card">
                    <div className="text-xs uppercase tracking-[0.18em] text-[rgb(var(--color-text-faint))]">
                        Source types
                    </div>
                    <div className="mt-1.5 text-sm font-semibold text-[rgb(var(--color-text-strong))]">
                        Video, audio, text
                    </div>
                </div>

                <div className="note-card">
                    <div className="text-xs uppercase tracking-[0.18em] text-[rgb(var(--color-text-faint))]">
                        Limits
                    </div>
                    <div className="mt-1.5 text-sm font-semibold text-[rgb(var(--color-text-strong))]">
                        1 minute / 200 chars
                    </div>
                </div>

                <div className="note-card">
                    <div className="text-xs uppercase tracking-[0.18em] text-[rgb(var(--color-text-faint))]">
                        Outputs
                    </div>
                    <div className="mt-1.5 text-sm font-semibold text-[rgb(var(--color-text-strong))]">
                        Summary, LinkedIn, X, Instagram, newsletter
                    </div>
                </div>
            </div>

            <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
                {activeContentRequest ? (
                    <a href={route('content-requests.show', activeContentRequest.public_id)} className="btn-primary w-full">
                        Open latest workspace
                    </a>
                ) : (
                    <a href={route('content-requests.create')} className="btn-primary w-full">
                        Open full upload page
                    </a>
                )}

                <a href={route('settings.index')} className="btn-secondary w-full">
                    Configure providers
                </a>
            </div>
        </div>
    );
}
