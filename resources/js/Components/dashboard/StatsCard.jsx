export default function StatsCard({ contentRequests, completedCount, processingCount, failedCount }) {
    return (
        <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-4">
            <div className="stat-card">
                <div className="app-faint text-xs uppercase tracking-[0.18em] text-[rgb(var(--color-text-faint))]">
                    Total runs
                </div>
                <div className="mt-3 text-4xl font-semibold text-[rgb(var(--color-text-strong))]">
                    {contentRequests.length}
                </div>
                <div className="mt-2 text-sm text-[rgb(var(--color-text-muted))]">
                    Video, audio, recordings, and text notes in one library.
                </div>
            </div>

            <div className="stat-card">
                <div className="app-faint text-xs uppercase tracking-[0.18em] text-[rgb(var(--color-text-faint))]">
                    Completed
                </div>
                <div className="mt-3 text-4xl font-semibold text-[rgb(var(--color-text-strong))]">
                    {completedCount}
                </div>
                <div className="mt-2 text-sm text-[rgb(var(--color-text-muted))]">
                    Ready to copy, refine, or publish.
                </div>
            </div>

            <div className="stat-card">
                <div className="app-faint text-xs uppercase tracking-[0.18em] text-[rgb(var(--color-text-faint))]">
                    Processing
                </div>
                <div className="mt-3 text-4xl font-semibold text-[rgb(var(--color-text-strong))]">
                    {processingCount}
                </div>
                <div className="mt-2 text-sm text-[rgb(var(--color-text-muted))]">
                    Transcribing or generating content right now.
                </div>
            </div>

            <div className="stat-card">
                <div className="app-faint text-xs uppercase tracking-[0.18em] text-[rgb(var(--color-text-faint))]">
                    Needs review
                </div>
                <div className="mt-3 text-4xl font-semibold text-[rgb(var(--color-text-strong))]">
                    {failedCount}
                </div>
                <div className="mt-2 text-sm text-[rgb(var(--color-text-muted))]">
                    Items that need another pass or a settings fix.
                </div>
            </div>
        </div>
    );
}
