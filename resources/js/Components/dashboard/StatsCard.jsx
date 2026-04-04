export default function StatsCard({ contentRequests, completedCount, processingCount, failedCount, usageLimits }) {
    return (
        <div className="compact-grid-4 xl:grid-cols-5">
            <div className="stat-card-compact">
                <div className="app-faint text-xs uppercase tracking-[0.18em] text-[rgb(var(--color-text-faint))]">
                    Total runs
                </div>
                <div className="mt-2 text-3xl font-semibold text-[rgb(var(--color-text-strong))]">
                    {contentRequests.length}
                </div>
                <div className="stat-card-copy">
                    Video, audio, and text note requests in one library.
                </div>
            </div>

            <div className="stat-card-compact">
                <div className="app-faint text-xs uppercase tracking-[0.18em] text-[rgb(var(--color-text-faint))]">
                    Completed
                </div>
                <div className="mt-2 text-3xl font-semibold text-[rgb(var(--color-text-strong))]">
                    {completedCount}
                </div>
                <div className="stat-card-copy">
                    Ready to copy, refine, or publish.
                </div>
            </div>

            <div className="stat-card-compact">
                <div className="app-faint text-xs uppercase tracking-[0.18em] text-[rgb(var(--color-text-faint))]">
                    Processing
                </div>
                <div className="mt-2 text-3xl font-semibold text-[rgb(var(--color-text-strong))]">
                    {processingCount}
                </div>
                <div className="stat-card-copy">
                    Transcribing or generating content right now.
                </div>
            </div>

            <div className="stat-card-compact">
                <div className="app-faint text-xs uppercase tracking-[0.18em] text-[rgb(var(--color-text-faint))]">
                    Needs review
                </div>
                <div className="mt-2 text-3xl font-semibold text-[rgb(var(--color-text-strong))]">
                    {failedCount}
                </div>
                <div className="stat-card-copy">
                    Items that need another pass or a settings fix.
                </div>
            </div>

            <div className="stat-card-compact">
                <div className="app-faint text-xs uppercase tracking-[0.18em] text-[rgb(var(--color-text-faint))]">
                    Remaining
                </div>
                <div className="mt-2 text-3xl font-semibold text-[rgb(var(--color-text-strong))]">
                    {usageLimits?.remaining ?? '0'}
                </div>
                <div className="stat-card-copy">
                    {usageLimits ? `${usageLimits.limit} runs on the $${usageLimits.plan_price_usd} plan.` : 'Usage data unavailable.'}
                </div>
            </div>
        </div>
    );
}
