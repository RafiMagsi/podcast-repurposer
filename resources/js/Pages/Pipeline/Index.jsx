import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import AppCard from '@/Components/ui/AppCard';
import { Head, Link } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { formatCompressionStatusLabel, formatQueueStateLabel, formatStatusLabel } from '@/utils/contentRequestLabels';

function statusClass(status) {
    switch (status) {
        case 'transcribing':
        case 'transcribed':
            return 'status-badge status-transcribing';
        case 'generating':
            return 'status-badge status-generating';
        case 'cancelled':
            return 'status-badge status-cancelled';
        case 'partial':
            return 'status-badge status-partial';
        case 'completed':
            return 'status-badge status-completed';
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
        case 'audio':
            return 'Audio';
        default:
            return 'Audio';
    }
}

function pipelineLabel(item) {
    if (item.status === 'uploaded' && item.compression_status === 'started') {
        return 'Preparing preview and media';
    }

    if (item.status === 'uploaded') {
        return 'Queued for processing';
    }

    if (item.status === 'transcribing' && item.compression_status === 'started') {
        return 'Preparing media';
    }

    if (item.status === 'transcribing') {
        return 'Transcribing';
    }

    if (item.status === 'transcribed') {
        return 'Transcript ready';
    }

    if (item.status === 'generating') {
        return 'Generating content';
    }

    return 'Active';
}

function queueState(item) {
    if (item.pipeline_state) {
        return item.pipeline_state;
    }

    if (item.compression_status === 'started' || item.compression_status === 'completed') {
        return 'current';
    }

    return item.status === 'uploaded' ? 'queue' : 'current';
}

export default function PipelineIndex({ auth, contentRequests = [] }) {
    const [liveContentRequests, setLiveContentRequests] = useState(contentRequests);

    useEffect(() => {
        setLiveContentRequests(contentRequests);
    }, [contentRequests]);

    const orderedContentRequests = [...liveContentRequests].sort((a, b) => {
        const weight = (item) => (queueState(item) === 'current' ? 0 : 1);

        return weight(a) - weight(b);
    });

    const currentProcessingCount = orderedContentRequests.filter(
        (item) => queueState(item) === 'current',
    ).length;
    const queuedCount = orderedContentRequests.length - currentProcessingCount;

    useEffect(() => {
        let cancelled = false;

        const syncPipeline = async () => {
            if (cancelled || document.visibilityState !== 'visible') {
                return;
            }

            try {
                const response = await window.fetch(route('pipeline.status'), {
                    headers: {
                        Accept: 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                    },
                    credentials: 'same-origin',
                });

                if (!response.ok) {
                    return;
                }

                const payload = await response.json();

                if (!cancelled && Array.isArray(payload?.contentRequests)) {
                    setLiveContentRequests(payload.contentRequests);
                }
            } catch (_error) {
                // Keep polling passive. The next interval can recover.
            }
        };

        const interval = window.setInterval(syncPipeline, 2500);

        return () => {
            cancelled = true;
            window.clearInterval(interval);
        };
    }, []);

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div>
                        <div className="app-badge-neutral">Active Pipeline</div>
                        <h1 className="app-page-title mt-3">
                            Monitor Current Processing Runs.
                        </h1>
                        <p className="app-subheading mt-2 max-w-2xl">
                            This page shows every active recording moving through Media Prep, transcription, or Content Generation.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <Link href={route('content-requests.create')} className="btn-primary-rect">
                            New recording
                        </Link>
                        <Link href={route('content-requests.index')} className="topbar-action">
                            Open library
                        </Link>
                    </div>
                </div>
            }
        >
            <Head title="Pipeline" />

            <div className="compact-grid-3">
                <div className="stat-card">
                    <div className="text-xs uppercase tracking-[0.18em] text-[rgb(var(--color-text-faint))]">
                        Active runs
                    </div>
                    <div className="mt-2 text-3xl font-semibold text-[rgb(var(--color-text-strong))]">
                        {orderedContentRequests.length}
                    </div>
                    <div className="mt-1.5 text-sm text-[rgb(var(--color-text-muted))]">
                        Auto-refreshing every few seconds.
                    </div>
                </div>
                <div className="stat-card">
                    <div className="text-xs uppercase tracking-[0.18em] text-[rgb(var(--color-text-faint))]">
                        Focus
                    </div>
                    <div className="mt-2 text-lg font-semibold text-[rgb(var(--color-text-strong))]">
                        {currentProcessingCount} current, {queuedCount} queued
                    </div>
                    <div className="mt-1.5 text-sm text-[rgb(var(--color-text-muted))]">
                        Active work stays at the top, with queued runs listed below it.
                    </div>
                </div>
                <div className="stat-card">
                    <div className="text-xs uppercase tracking-[0.18em] text-[rgb(var(--color-text-faint))]">
                        Refresh
                    </div>
                    <div className="mt-2 text-lg font-semibold text-[rgb(var(--color-text-strong))]">
                        Live polling enabled
                    </div>
                    <div className="mt-1.5 text-sm text-[rgb(var(--color-text-muted))]">
                        No manual refresh needed while jobs are active.
                    </div>
                </div>
            </div>

            <AppCard variant="compact" padding="none" className="overflow-hidden">
                <div className="flex flex-col gap-3 border-b border-[rgb(var(--color-border))] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                    <div>
                            <h2 className="app-section-title">Current Processing</h2>
                        <p className="app-muted">Only active items are shown here.</p>
                    </div>
                </div>

                {orderedContentRequests.length === 0 ? (
                    <div className="p-5 text-sm text-[rgb(var(--color-text-muted))]">
                        No active processing right now.
                    </div>
                ) : (
                    <div className="divide-y divide-[rgb(var(--color-border))]">
                        {orderedContentRequests.map((item) => (
                            <div
                                key={item.public_id}
                                className="flex flex-col gap-3 px-4 py-4 sm:px-5 xl:flex-row xl:items-center xl:justify-between"
                            >
                                <div className="min-w-0">
                                    <div className="flex flex-wrap items-center gap-2.5">
                                        <div className="truncate text-base font-semibold text-[rgb(var(--color-text-strong))]">
                                            {item.title}
                                        </div>
                                        {queueState(item) === 'current' ? (
                                            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-700">
                                                {formatQueueStateLabel('current')}
                                            </span>
                                        ) : (
                                            <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-700">
                                                {formatQueueStateLabel('queue')}
                                            </span>
                                        )}
                                        <span className="app-badge-neutral">{sourceLabel(item.source_type)}</span>
                                        <span className={statusClass(item.status)}>{formatStatusLabel(item.status)}</span>
                                    </div>
                                    <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-[rgb(var(--color-text-muted))]">
                                        <span>{pipelineLabel(item)}</span>
                                        <span>{item.original_file_name || 'Inline text note'}</span>
                                        <span>{item.created_at}</span>
                                    </div>
                                </div>

                                <div className="flex flex-wrap items-center gap-2.5">
                                    {item.compression_status ? (
                                        <span className="app-badge-neutral">
                                            {formatCompressionStatusLabel(item.compression_status)}
                                        </span>
                                    ) : null}
                                    <Link href={route('content-requests.show', item.public_id)} className="btn-secondary">
                                        Open workspace
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </AppCard>
        </AuthenticatedLayout>
    );
}
