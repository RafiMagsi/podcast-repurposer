export default function RecordingInfoCard() {
    return (
        <div className="app-card-compact p-4 sm:p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div className="max-w-2xl">
                    <div className="app-badge-neutral">New Run</div>
                    <h2 className="mt-3 text-xl font-semibold tracking-[-0.03em] text-[rgb(var(--color-text-strong))]">
                        Start from one short source.
                    </h2>
                    <p className="mt-2 max-w-xl text-sm leading-6 text-[rgb(var(--color-text-muted))]">
                        Open the creation workspace, submit one run, and review the transcript plus outputs there.
                    </p>

                    <div className="mt-4 compact-grid-3">
                        <div className="note-card">
                            <div className="text-xs uppercase tracking-[0.18em] text-[rgb(var(--color-text-faint))]">Video</div>
                            <div className="mt-2 text-sm font-semibold text-[rgb(var(--color-text-strong))]">Up to 1 minute</div>
                        </div>
                        <div className="note-card">
                            <div className="text-xs uppercase tracking-[0.18em] text-[rgb(var(--color-text-faint))]">Audio</div>
                            <div className="mt-2 text-sm font-semibold text-[rgb(var(--color-text-strong))]">Up to 1 minute</div>
                        </div>
                        <div className="note-card">
                            <div className="text-xs uppercase tracking-[0.18em] text-[rgb(var(--color-text-faint))]">Text note</div>
                            <div className="mt-2 text-sm font-semibold text-[rgb(var(--color-text-strong))]">Up to 200 characters</div>
                        </div>
                    </div>
                </div>

                <div className="flex w-full flex-col gap-2 sm:w-auto sm:min-w-[220px]">
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
