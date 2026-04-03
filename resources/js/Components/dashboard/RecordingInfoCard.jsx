export default function RecordingInfoCard() {
    return (
        <div className="app-card p-6 sm:p-8">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                <div className="max-w-2xl">
                    <div className="app-badge-neutral">New Run</div>
                    <h2 className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-[rgb(var(--color-text-strong))]">
                        Start a new content request from the dedicated creation workspace.
                    </h2>
                    <p className="mt-2 max-w-xl text-sm leading-7 text-[rgb(var(--color-text-muted))]">
                        Use this dashboard to monitor request status, review recent activity, and move quickly into the creation flow when you are ready to generate new content.
                    </p>

                    <div className="mt-5 grid gap-3 sm:grid-cols-3">
                        <div className="dashboard-note">
                            <div className="text-xs uppercase tracking-[0.18em] text-[rgb(var(--color-text-faint))]">Video</div>
                            <div className="mt-2 text-sm font-semibold text-[rgb(var(--color-text-strong))]">Up to 1 minute</div>
                        </div>
                        <div className="dashboard-note">
                            <div className="text-xs uppercase tracking-[0.18em] text-[rgb(var(--color-text-faint))]">Audio</div>
                            <div className="mt-2 text-sm font-semibold text-[rgb(var(--color-text-strong))]">Up to 1 minute</div>
                        </div>
                        <div className="dashboard-note">
                            <div className="text-xs uppercase tracking-[0.18em] text-[rgb(var(--color-text-faint))]">Text note</div>
                            <div className="mt-2 text-sm font-semibold text-[rgb(var(--color-text-strong))]">Up to 200 characters</div>
                        </div>
                    </div>
                </div>

                <div className="flex w-full flex-col gap-3 sm:w-auto sm:min-w-[220px]">
                    <a href={route('content-requests.create')} className="btn-primary inline-flex w-full justify-center whitespace-nowrap">
                        Open creation workspace
                    </a>
                    <a href={route('content-requests.index')} className="btn-secondary inline-flex w-full justify-center whitespace-nowrap">
                        Review library
                    </a>
                </div>
            </div>
        </div>
    );
}
