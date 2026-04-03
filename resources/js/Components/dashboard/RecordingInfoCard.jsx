export default function RecordingInfoCard() {
    return (
        <div className="app-card p-6 sm:p-8">
            <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                <div className="max-w-xl">
                    <div className="app-badge-neutral">New Run</div>
                    <h2 className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-[rgb(var(--color-text-strong))]">
                        Start a new content request from the dedicated creation workspace.
                    </h2>
                    <p className="mt-2 text-sm max-w-l leading-7 text-[rgb(var(--color-text-muted))]">
                        Use this dashboard to monitor request status, review recent activity, and move quickly into the creation flow when you are ready to generate new content.
                    </p>
                </div>

                <div className="flex flex-col items-start gap-3">
                    <a href={route('content-requests.create')} className="btn-primary inline-flex min-w-[190px] justify-center whitespace-nowrap">
                        Text Prompt
                    </a>
                </div>
            </div>
        </div>
    );
}
