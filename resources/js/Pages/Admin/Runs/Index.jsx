import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import AppCard from '@/Components/ui/AppCard';
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

export default function AdminRunsIndex({ auth, runs, filters, analytics }) {
    const items = runs.data || [];
    const sourceTypeUsage = analytics?.source_type_usage || { video: 0, audio: 0, text: 0 };
    const runOutcomes = analytics?.run_outcomes || { total: 0, completed: 0, failed: 0, partial: 0, completion_rate: 0, failure_rate: 0 };
    const actions = analytics?.actions || { retry_transcription: 0, regenerate_content: 0 };
    const outputUsage = analytics?.most_used_output_types || [];

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div>
                        <div className="app-badge-neutral">Admin</div>
                        <h1 className="app-page-title mt-3">
                            Monitor every content run.
                        </h1>
                        <p className="app-subheading mt-2 max-w-2xl">
                            Review users, source types, statuses, and timestamps across all runs from one admin surface.
                        </p>
                    </div>
                </div>
            }
        >
            <Head title="Admin Runs" />

            <div className="space-y-6">
                <div className="compact-grid-4">
                    <div className="stat-card">
                        <div className="text-xs uppercase tracking-[0.18em] text-[rgb(var(--color-text-faint))]">
                            Source usage
                        </div>
                        <div className="mt-2 space-y-1.5 text-sm text-[rgb(var(--color-text))]">
                            <div>Video: {sourceTypeUsage.video}</div>
                            <div>Audio: {sourceTypeUsage.audio}</div>
                            <div>Text: {sourceTypeUsage.text}</div>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="text-xs uppercase tracking-[0.18em] text-[rgb(var(--color-text-faint))]">
                            Run outcomes
                        </div>
                        <div className="mt-2 space-y-1.5 text-sm text-[rgb(var(--color-text))]">
                            <div>Total: {runOutcomes.total}</div>
                            <div>Completed: {runOutcomes.completed} ({runOutcomes.completion_rate}%)</div>
                            <div>Failed: {runOutcomes.failed} ({runOutcomes.failure_rate}%)</div>
                            <div>Partial: {runOutcomes.partial}</div>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="text-xs uppercase tracking-[0.18em] text-[rgb(var(--color-text-faint))]">
                            Recovery usage
                        </div>
                        <div className="mt-2 space-y-1.5 text-sm text-[rgb(var(--color-text))]">
                            <div>Retry transcription: {actions.retry_transcription}</div>
                            <div>Regenerate content: {actions.regenerate_content}</div>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="text-xs uppercase tracking-[0.18em] text-[rgb(var(--color-text-faint))]">
                            Top outputs
                        </div>
                        <div className="mt-2 space-y-1.5 text-sm text-[rgb(var(--color-text))]">
                            {outputUsage.length === 0 ? (
                                <div className="text-[rgb(var(--color-text-muted))]">No output activity yet.</div>
                            ) : outputUsage.slice(0, 5).map((item) => (
                                <div key={item.content_type}>
                                    {item.content_type.replace('_', ' ')}: {item.count}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

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

                <AppCard variant="compact" padding="none" className="overflow-hidden">
                    <div className="flex items-center justify-between border-b border-[rgb(var(--color-border))] px-4 py-4 sm:px-5">
                        <div>
                            <h2 className="app-section-title">Runs</h2>
                            <p className="app-muted">Compact monitoring for active, failed, and completed runs.</p>
                        </div>
                    </div>

                    {items.length === 0 ? (
                        <div className="p-5 text-sm text-[rgb(var(--color-text-muted))]">No runs match this filter.</div>
                    ) : (
                        <div className="divide-y divide-[rgb(var(--color-border))]">
                            {items.map((run) => (
                                <div
                                    key={run.public_id}
                                    className="flex flex-col gap-3 px-4 py-4 sm:px-5 xl:flex-row xl:items-center xl:justify-between"
                                >
                                    <div className="min-w-0 xl:flex-1">
                                        <div className="flex flex-wrap items-center gap-2.5">
                                            <div className="truncate text-base font-semibold text-[rgb(var(--color-text-strong))]">
                                                {run.title}
                                            </div>
                                            <span className="app-badge-neutral">{sourceLabel(run.source_type)}</span>
                                            <span className={statusClass(run.status)}>{run.status}</span>
                                        </div>
                                        <div className="mt-1.5 text-xs text-[rgb(var(--color-text-muted))]">
                                            {run.public_id}
                                        </div>
                                    </div>
                                    <div className="min-w-0 xl:w-[260px]">
                                        <div className="truncate text-sm font-medium text-[rgb(var(--color-text-strong))]">
                                            {run.user?.name || 'Unknown user'}
                                        </div>
                                        <div className="mt-0.5 truncate text-xs text-[rgb(var(--color-text-muted))]">
                                            {run.user?.email || 'No email'}
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-[rgb(var(--color-text-muted))] xl:w-[260px] xl:justify-end">
                                        <span>{run.created_at}</span>
                                    </div>
                                    <div className="xl:w-[130px] xl:text-right">
                                        <a href={route('content-requests.show', run.public_id)} className="btn-secondary">
                                            Open run
                                        </a>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </AppCard>
            </div>
        </AuthenticatedLayout>
    );
}
