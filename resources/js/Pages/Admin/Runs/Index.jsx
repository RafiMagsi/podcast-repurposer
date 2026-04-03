import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';

function statusClass(status) {
    switch (status) {
        case 'completed':
            return 'status-badge status-completed';
        case 'partial':
            return 'status-badge status-partial';
        case 'cancelled':
            return 'status-badge status-cancelled';
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

function sourceLabel(sourceType) {
    switch (sourceType) {
        case 'video':
            return 'Video';
        case 'text':
            return 'Text note';
        default:
            return 'Audio';
    }
}

export default function AdminRunsIndex({ auth, runs, filters }) {
    const items = runs.data || [];

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
                    <div>
                        <div className="app-badge-neutral">Admin</div>
                        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-[rgb(var(--color-text-strong))]">
                            Monitor every content run.
                        </h1>
                        <p className="mt-2 max-w-2xl text-sm leading-7 text-[rgb(var(--color-text-muted))]">
                            Review users, source types, statuses, and timestamps across all runs from one admin surface.
                        </p>
                    </div>
                </div>
            }
        >
            <Head title="Admin Runs" />

            <div className="space-y-6">
                <div className="flex flex-wrap gap-2">
                    {filters.items.map((item) => (
                        <Link
                            key={item.value}
                            href={route('admin.runs.index', item.value === 'all' ? {} : { filter: item.value })}
                            className={`filter-pill ${filters.current === item.value ? 'filter-pill-active' : ''}`}
                        >
                            {item.label}
                        </Link>
                    ))}
                </div>

                <div className="app-card overflow-hidden">
                    <div className="grid grid-cols-[minmax(0,1.1fr)_minmax(0,.9fr)_120px_140px_180px_130px] gap-4 border-b border-[rgb(var(--color-border))] px-6 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-[rgb(var(--color-text-faint))]">
                        <div>Run</div>
                        <div>User</div>
                        <div>Source</div>
                        <div>Status</div>
                        <div>Created</div>
                        <div>Inspect</div>
                    </div>

                    {items.length === 0 ? (
                        <div className="p-6 text-sm text-[rgb(var(--color-text-muted))]">No runs match this filter.</div>
                    ) : (
                        <div className="divide-y divide-[rgb(var(--color-border))]">
                            {items.map((run) => (
                                <div
                                    key={run.public_id}
                                    className="grid grid-cols-[minmax(0,1.1fr)_minmax(0,.9fr)_120px_140px_180px_130px] items-center gap-4 px-6 py-4"
                                >
                                    <div className="min-w-0">
                                        <div className="truncate text-sm font-semibold text-[rgb(var(--color-text-strong))]">
                                            {run.title}
                                        </div>
                                        <div className="mt-1 text-xs text-[rgb(var(--color-text-muted))]">
                                            {run.public_id}
                                        </div>
                                    </div>
                                    <div className="min-w-0">
                                        <div className="truncate text-sm font-medium text-[rgb(var(--color-text-strong))]">
                                            {run.user?.name || 'Unknown user'}
                                        </div>
                                        <div className="truncate text-xs text-[rgb(var(--color-text-muted))]">
                                            {run.user?.email || 'No email'}
                                        </div>
                                    </div>
                                    <div className="text-sm text-[rgb(var(--color-text))]">{sourceLabel(run.source_type)}</div>
                                    <div>
                                        <span className={statusClass(run.status)}>{run.status}</span>
                                    </div>
                                    <div className="text-sm text-[rgb(var(--color-text-muted))]">{run.created_at}</div>
                                    <div>
                                        <a href={route('content-requests.show', run.public_id)} className="btn-secondary">
                                            Open run
                                        </a>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
