export default function CurrentFocusCard({ activeContentRequest }) {
    return (
        <div className="app-card p-6">
            <div className="app-badge-neutral">Current Focus</div>

            <h2 className="mt-4 text-[28px] font-semibold tracking-[-0.035em] text-[rgb(var(--color-text-strong))]">
                {activeContentRequest ? activeContentRequest.title : 'Build your first content run'}
            </h2>

            <p className="mt-3 text-sm leading-7 text-[rgb(var(--color-text-muted))]">
                {activeContentRequest
                    ? 'Open the latest run to review its transcript, content responses, and status in the workspace.'
                    : 'Use the create page to start with a 1-minute video, a 1-minute audio clip, or one short text idea.'}
            </p>

            <div className="mt-5 grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
                <div className="dashboard-note">
                    <div className="text-xs uppercase tracking-[0.18em] text-[rgb(var(--color-text-faint))]">
                        Source types
                    </div>
                    <div className="mt-2 text-sm font-semibold text-[rgb(var(--color-text-strong))]">
                        Video, audio, text
                    </div>
                </div>

                <div className="dashboard-note">
                    <div className="text-xs uppercase tracking-[0.18em] text-[rgb(var(--color-text-faint))]">
                        Limits
                    </div>
                    <div className="mt-2 text-sm font-semibold text-[rgb(var(--color-text-strong))]">
                        1 minute / 200 chars
                    </div>
                </div>

                <div className="dashboard-note">
                    <div className="text-xs uppercase tracking-[0.18em] text-[rgb(var(--color-text-faint))]">
                        Outputs
                    </div>
                    <div className="mt-2 text-sm font-semibold text-[rgb(var(--color-text-strong))]">
                        Summary, LinkedIn, X, Instagram, Newsletter
                    </div>
                </div>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row xl:flex-col">
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
