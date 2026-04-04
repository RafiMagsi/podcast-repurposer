export default function StatsCard({ contentRequests, completedCount, processingCount, failedCount, usageLimits }) {
    return (
        <div className="compact-grid-4 xl:grid-cols-5">
            <div className="stat-card-compact">
                <div className="app-faint text-xs uppercase tracking-[0.18em] text-[rgb(var(--color-text-faint))]">
                    Total runs
                </div>
                <div className="mt-1.5 text-[1.75rem] font-semibold leading-none text-[rgb(var(--color-text-strong))]">
                    {contentRequests.length}
                </div>
                <div className="stat-card-copy">
                    Video, audio, and text in one library.
                </div>
            </div>

            <div className="stat-card-compact">
                <div className="app-faint text-xs uppercase tracking-[0.18em] text-[rgb(var(--color-text-faint))]">
                    Completed
                </div>
                <div className="mt-1.5 text-[1.75rem] font-semibold leading-none text-[rgb(var(--color-text-strong))]">
                    {completedCount}
                </div>
                <div className="stat-card-copy">
                    Ready to review or publish.
                </div>
            </div>

            <div className="stat-card-compact">
                <div className="app-faint text-xs uppercase tracking-[0.18em] text-[rgb(var(--color-text-faint))]">
                    Processing
                </div>
                <div className="mt-1.5 text-[1.75rem] font-semibold leading-none text-[rgb(var(--color-text-strong))]">
                    {processingCount}
                </div>
                <div className="stat-card-copy">
                    Active transcription or generation.
                </div>
            </div>

            <div className="stat-card-compact">
                <div className="app-faint text-xs uppercase tracking-[0.18em] text-[rgb(var(--color-text-faint))]">
                    Needs review
                </div>
                <div className="mt-1.5 text-[1.75rem] font-semibold leading-none text-[rgb(var(--color-text-strong))]">
                    {failedCount}
                </div>
                <div className="stat-card-copy">
                    Runs that need another pass.
                </div>
            </div>

            <div className="stat-card-compact">
                <div className="app-faint text-xs uppercase tracking-[0.18em] text-[rgb(var(--color-text-faint))]">
                    Remaining
                </div>
                <div className="mt-1.5 text-[1.75rem] font-semibold leading-none text-[rgb(var(--color-text-strong))]">
                    {usageLimits?.remaining ?? '0'}
                </div>
                <div className="stat-card-copy">
                    {usageLimits ? `${usageLimits.limit} runs on the $${usageLimits.plan_price_usd} plan.` : 'Usage unavailable.'}
                </div>
            </div>
        </div>
    );
}
