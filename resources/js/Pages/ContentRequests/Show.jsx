import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import AppCard from '@/Components/ui/AppCard';
import { Head, router, usePage } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
import DeleteConfirmationModal from '@/Components/DeleteConfirmationModal';
import ActionConfirmationModal from '@/Components/ActionConfirmationModal';
import ProcessingStatusCard from '@/Components/ProcessingStatusCard';
import ContentResponseCard from '@/Components/content-responses/ContentResponseCard';
import ContentPreviewCard from '@/Components/content-responses/ContentPreviewCard';

function formatContentType(value) {
    return value
        .split('_')
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');
}

function statusClass(status) {
    switch (status) {
        case 'completed':
            return 'status-badge status-completed';
        case 'cancelled':
            return 'status-badge status-cancelled';
        case 'partial':
            return 'status-badge status-partial';
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

function copyToClipboard(text) {
    if (!text) return;
    navigator.clipboard.writeText(text);
}

function formatMb(bytes) {
    if (!bytes) return 'N/A';
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
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

function mergeStableMediaUrls(currentContentRequest, nextContentRequest) {
    if (!currentContentRequest) {
        return nextContentRequest;
    }

    return {
        ...nextContentRequest,
        media_url:
            currentContentRequest.media_url && nextContentRequest.media_url
                ? currentContentRequest.media_url
                : nextContentRequest.media_url,
        media_thumbnail_url:
            currentContentRequest.media_thumbnail_url && nextContentRequest.media_thumbnail_url
                ? currentContentRequest.media_thumbnail_url
                : nextContentRequest.media_thumbnail_url,
    };
}

export default function ContentRequestsShow({ auth, contentRequest }) {
    const { flash, errors } = usePage().props;
    const [liveContentRequest, setLiveContentRequest] = useState(contentRequest);
    const [regeneratingOutputTypes, setRegeneratingOutputTypes] = useState({});
    const canRetryTranscription = liveContentRequest.source_type !== 'text';

    useEffect(() => {
        setLiveContentRequest((currentContentRequest) =>
            mergeStableMediaUrls(currentContentRequest, contentRequest),
        );
    }, [contentRequest]);

    const orderedContentResponses = [...(liveContentRequest.content_responses || [])]
        .map((contentResponse) => ({
            ...contentResponse,
            meta: {
                ...(contentResponse.meta || {}),
                is_regenerating: Boolean(contentResponse.meta?.is_regenerating || regeneratingOutputTypes[contentResponse.content_type]),
            },
        }))
        .sort((a, b) => {
            const order = ['summary', 'linkedin_post', 'x_post', 'instagram_caption', 'newsletter'];
            return order.indexOf(a.content_type) - order.indexOf(b.content_type);
        });
    const expectedOutputTypes = ['summary', 'linkedin_post', 'x_post', 'instagram_caption', 'newsletter'];
    const missingOutputTypes = expectedOutputTypes.filter(
        (contentType) => !orderedContentResponses.some((response) => response.content_type === contentType),
    );

    const retryTranscription = () => {
        setRetrying(true);

        router.post(route('content-requests.retry-transcription', liveContentRequest.public_id), {}, {
            onSuccess: () => {
                setShowRetryModal(false);
            },
            onFinish: () => {
                setRetrying(false);
            },
        });
    };

    const regenerateContent = () => {
        setRegenerating(true);

        router.post(route('content-requests.regenerate-content', liveContentRequest.public_id), {}, {
            onSuccess: () => {
                setShowRegenerateModal(false);
            },
            onFinish: () => {
                setRegenerating(false);
            },
        });
    };

    const regenerateSingleOutput = (contentType) => {
        setRegeneratingOutputTypes((current) => ({
            ...current,
            [contentType]: true,
        }));

        router.post(route('content-requests.regenerate-output', {
            contentRequest: liveContentRequest.public_id,
            contentType,
        }), {}, {
            preserveScroll: true,
            onFinish: () => {
                setRegeneratingOutputTypes((current) => {
                    const next = { ...current };
                    delete next[contentType];
                    return next;
                });
            },
        });
    };

    const details = [
        ['Source type', sourceLabel(liveContentRequest.source_type)],
        ['Original file', liveContentRequest.original_file_name || 'Inline text note'],
        ['Original size', formatMb(liveContentRequest.file_size)],
        ['Compressed size', formatMb(liveContentRequest.compressed_file_size)],
        ['Compression status', liveContentRequest.compression_status || 'Not started'],
        ['Tone', liveContentRequest.tone || 'N/A'],
        ['Created at', liveContentRequest.created_at || 'N/A'],
        ['Recording ID', liveContentRequest.public_id || liveContentRequest.id || 'N/A'],
    ];

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [showRetryModal, setShowRetryModal] = useState(false);
    const [showRegenerateModal, setShowRegenerateModal] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [retrying, setRetrying] = useState(false);
    const [regenerating, setRegenerating] = useState(false);
    const [cancelling, setCancelling] = useState(false);

    const deleteContentRequest = () => {
        setDeleting(true);

        router.delete(route('content-requests.destroy', liveContentRequest.public_id), {
            onSuccess: () => {
                setDeleting(false);
                setShowDeleteModal(false);
            },
            onError: () => {
                setDeleting(false);
            },
            onFinish: () => {
                setDeleting(false);
            },
        });
    };

    const processingStatuses = ['uploaded', 'transcribing', 'transcribed', 'generating'];
    const finalizedStatuses = ['completed', 'partial', 'failed', 'cancelled'];

    const isProcessing = useMemo(() => {
        return processingStatuses.includes(liveContentRequest.status);
    }, [liveContentRequest.status]);

    const isFinalized = useMemo(() => {
        return finalizedStatuses.includes(liveContentRequest.status);
    }, [liveContentRequest.status]);

    const showRetryAction = canRetryTranscription && isFinalized && !liveContentRequest.transcript;
    const showRegenerateAction = isFinalized && Boolean(liveContentRequest.transcript);

    const liveStatusLabel = useMemo(() => {
        switch (liveContentRequest.status) {
            case 'uploaded':
                if (liveContentRequest.media_kind === 'video') {
                    return 'Upload received. The video is in queue and will move into media preparation shortly.';
                }

                if (liveContentRequest.media_kind === 'audio') {
                    return 'Upload received. The audio is in queue and will move into transcription shortly.';
                }

                return 'Upload received. The request is queued to start processing.';
            case 'transcribing':
                if (liveContentRequest.compression_status === 'started') {
                    if (
                        liveContentRequest.media_kind === 'video' &&
                        (!liveContentRequest.preview_path || !liveContentRequest.media_thumbnail_url)
                    ) {
                        return 'Media prep is running: preparing the video preview, thumbnail, and transcription-ready source.';
                    }

                    if (liveContentRequest.media_kind === 'audio') {
                        return 'Media prep is running: preparing and compressing the audio for transcription.';
                    }

                    return 'Media prep is running: preparing the source for transcription.';
                }

                if (liveContentRequest.compression_status === 'completed') {
                    return 'Media prep is complete. The source is now being transcribed into text.';
                }

                return 'Transcription is in progress.';
            case 'transcribed':
                return 'Transcript is ready. VoicePost AI is preparing the writing pass.';
            case 'generating':
                return 'VoicePost AI is writing the summary and final content outputs.';
            case 'completed':
                return 'Content is ready.';
            case 'partial':
                if (missingOutputTypes.length > 0) {
                    return `Part of the run succeeded, but ${missingOutputTypes.length} output ${missingOutputTypes.length === 1 ? 'is' : 'are'} still missing. Regenerate content to complete the set.`;
                }

                return 'Part of the run succeeded, but the content set is incomplete. Regenerate content to finish it.';
            case 'cancelled':
                return 'Processing was cancelled. You can retry transcription or regenerate content when ready.';
            case 'failed':
                if (liveContentRequest.compression_status === 'failed') {
                    return 'Media preparation failed. Review the compression issue and retry if needed.';
                }

                return 'Processing failed. Review the error and retry if needed.';
            default:
                return 'Status updated.';
        }
    }, [liveContentRequest.compression_status, liveContentRequest.status, missingOutputTypes.length]);

    const cancelProcessing = () => {
        setCancelling(true);

        router.post(route('content-requests.cancel-processing', liveContentRequest.public_id), {}, {
            onSuccess: () => {
                setShowCancelModal(false);
            },
            onFinish: () => {
                setCancelling(false);
            },
        });
    };

    useEffect(() => {
        if (!isProcessing) return;

        let cancelled = false;

        const syncStatus = async () => {
            if (cancelled || document.visibilityState !== 'visible') {
                return;
            }

            try {
                const response = await window.fetch(
                    route('content-requests.status', liveContentRequest.public_id),
                    {
                        headers: {
                            Accept: 'application/json',
                            'X-Requested-With': 'XMLHttpRequest',
                        },
                        credentials: 'same-origin',
                    },
                );

                if (!response.ok) {
                    return;
                }

                const payload = await response.json();

                if (!cancelled && payload?.contentRequest) {
                    setLiveContentRequest((currentContentRequest) =>
                        mergeStableMediaUrls(currentContentRequest, payload.contentRequest),
                    );
                }
            } catch (_error) {
                // Keep polling passive. The next interval can recover.
            }
        };

        const interval = window.setInterval(syncStatus, 2500);
        const onFocus = () => {
            void syncStatus();
        };

        window.addEventListener('focus', onFocus);

        return () => {
            cancelled = true;
            window.clearInterval(interval);
            window.removeEventListener('focus', onFocus);
        };
    }, [isProcessing, liveContentRequest.public_id]);

    return (
        <AuthenticatedLayout
            user={auth?.user}
            header={
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div>
                        <div className="app-badge-neutral mb-3">Recording workspace</div>
                        <h1 className="app-page-title">
                            {liveContentRequest.title}
                        </h1>
                        <p className="app-subheading mt-2 max-w-2xl">
                            Review the source, transcript, and final content from one compact workspace.
                        </p>
                        <div className="mt-4 flex flex-wrap items-center gap-2.5">
                            <span className={statusClass(liveContentRequest.status)}>{liveContentRequest.status}</span>
                            {isProcessing ? <span className="app-badge-neutral">Auto updating</span> : null}
                            <span className="app-badge-neutral">{sourceLabel(liveContentRequest.source_type)}</span>
                        </div>
                    </div>

                    <div className="grid w-full gap-2 sm:grid-cols-2 xl:w-auto xl:min-w-[440px] xl:grid-cols-2">
                        {isProcessing ? (
                            <button type="button" onClick={() => setShowCancelModal(true)} className="btn-outline w-full">
                                Cancel Processing
                            </button>
                        ) : null}
                        {showRetryAction ? (
                            <button type="button" onClick={() => setShowRetryModal(true)} className="btn-secondary w-full">
                                Retry Transcription
                            </button>
                        ) : null}
                        {showRegenerateAction ? (
                            <button type="button" onClick={() => setShowRegenerateModal(true)} className="btn-primary w-full">
                                {liveContentRequest.status === 'partial' ? 'Complete Missing Outputs' : 'Regenerate Content'}
                            </button>
                        ) : null}
                        <button type="button" onClick={() => setShowDeleteModal(true)} className="btn-danger w-full">
                            Delete Recording
                        </button>
                    </div>
                </div>
            }
        >
            <Head title={liveContentRequest.title} />

            <div className="space-y-4 sm:space-y-5 xl:space-y-6">
                {flash?.success && (
                    <div className="app-card bg-[rgb(var(--color-success-bg))] p-4 text-sm text-[rgb(var(--color-success-text))]">
                        {flash.success}
                    </div>
                )}

                <AppCard variant="compact" padding="md" className="sm:p-5">
                    <div className="compact-grid-2 xl:grid-cols-4">
                        {[
                            ['Run state', formatContentType(liveContentRequest.status)],
                            ['Transcript', liveContentRequest.transcript ? 'Ready' : isProcessing ? 'In progress' : 'Pending'],
                            ['Outputs', `${orderedContentResponses.length}/${liveContentRequest.expected_output_count || expectedOutputTypes.length} ready`],
                            ['Source', sourceLabel(liveContentRequest.source_type)],
                        ].map(([label, value]) => (
                            <div key={label} className="app-card-muted p-3.5">
                                <div className="text-xs uppercase tracking-[0.16em] text-[rgb(var(--color-text-faint))]">
                                    {label}
                                </div>
                                <div className="mt-1.5 text-sm font-semibold text-[rgb(var(--color-text-strong))]">
                                    {value}
                                </div>
                            </div>
                        ))}
                    </div>
                </AppCard>

                <ProcessingStatusCard
                    contentRequest={liveContentRequest}
                    isProcessing={isProcessing}
                    liveStatusLabel={liveStatusLabel}
                />

                {errors?.contentRequest && (
                    <div className="app-card bg-[rgb(var(--color-danger-bg))] p-4 text-sm text-[rgb(var(--color-danger-text))]">
                        {errors.contentRequest}
                    </div>
                )}

                <div className="grid gap-4 xl:gap-5 2xl:grid-cols-[300px_minmax(0,1fr)] 2xl:gap-6">
                    <div className="space-y-4 xl:space-y-5">
                        <AppCard variant="compact" padding="md">
                            <div className="section-header-compact">
                                <div className="section-header-copy">
                                    <h2 className="app-section-title">Recording details</h2>
                                </div>
                            </div>
                            <div className="space-y-2.5">
                                {details.map(([label, value]) => (
                                    <div key={label} className="note-card">
                                        <div className="text-xs uppercase tracking-[0.18em] text-[rgb(var(--color-text-faint))]">
                                            {label}
                                        </div>
                                        <div className="mt-1.5 break-all text-sm leading-6 text-[rgb(var(--color-text-strong))]">
                                            {value}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </AppCard>

                        <AppCard variant="compact" padding="md">
                            <div className="section-header-compact">
                                <div className="section-header-copy">
                                    <h2 className="app-section-title">Quick actions</h2>
                                </div>
                            </div>
                            <div className="grid gap-2.5 sm:grid-cols-2 2xl:grid-cols-1">
                                <button
                                    type="button"
                                    onClick={() => copyToClipboard(liveContentRequest.transcript || '')}
                                    className="btn-copy w-full justify-center"
                                    disabled={!liveContentRequest.transcript}
                                >
                                    Copy transcript
                                </button>
                                <button
                                    type="button"
                                    onClick={() => copyToClipboard(liveContentRequest.summary || '')}
                                    className="btn-copy w-full justify-center"
                                    disabled={!liveContentRequest.summary}
                                >
                                    Copy summary
                                </button>
                                {showRetryAction ? (
                                    <button type="button" onClick={() => setShowRetryModal(true)} className="btn-compact w-full justify-center">
                                        Retry transcription
                                    </button>
                                ) : null}
                                {isProcessing ? (
                                    <button type="button" onClick={() => setShowCancelModal(true)} className="btn-compact w-full justify-center">
                                        Cancel processing
                                    </button>
                                ) : null}
                                {showRegenerateAction ? (
                                    <button type="button" onClick={() => setShowRegenerateModal(true)} className="btn-secondary w-full justify-center">
                                        {liveContentRequest.status === 'partial' ? 'Complete missing outputs' : 'Regenerate content'}
                                    </button>
                                ) : null}
                            </div>
                        </AppCard>

                        {liveContentRequest.compression_error && (
                            <AppCard className="bg-[rgb(var(--color-warning-bg))] p-4 text-[rgb(var(--color-warning-text))]">
                                <h2 className="app-section-title text-[rgb(var(--color-warning-text))]">Compression issue</h2>
                                <p className="mt-2 text-sm">{liveContentRequest.compression_error}</p>
                            </AppCard>
                        )}

                        {liveContentRequest.error_message && (
                            <AppCard className="bg-[rgb(var(--color-danger-bg))] p-4 text-[rgb(var(--color-danger-text))]">
                                <h2 className="app-section-title text-[rgb(var(--color-danger-text))]">
                                    {liveContentRequest.failure_stage === 'transcription'
                                        ? 'Transcription issue'
                                        : liveContentRequest.failure_stage === 'generation'
                                        ? 'Generation issue'
                                        : 'Processing issue'}
                                </h2>
                                <p className="mt-2 text-sm">{liveContentRequest.error_message}</p>
                            </AppCard>
                        )}

                        {liveContentRequest.status === 'partial' ? (
                            <AppCard className="bg-[rgb(var(--color-warning-bg))] p-4 text-[rgb(var(--color-warning-text))]">
                                <h2 className="app-section-title text-[rgb(var(--color-warning-text))]">Partial completion</h2>
                                <p className="mt-2 text-sm">
                                    The transcript is available, but this run did not finish every content output.
                                </p>
                                {missingOutputTypes.length > 0 ? (
                                    <p className="mt-2 text-sm">
                                        Missing outputs: {missingOutputTypes.map(formatContentType).join(', ')}.
                                    </p>
                                ) : null}
                            </AppCard>
                        ) : null}

                        {isProcessing ? (
                            <AppCard className="bg-[rgb(var(--color-surface-soft))] p-4">
                                <h2 className="app-section-title">Content actions locked</h2>
                                <p className="mt-2 text-sm leading-6 text-[rgb(var(--color-text-muted))]">
                                    Retry transcription and regenerate content unlock after this run reaches a final state.
                                </p>
                            </AppCard>
                        ) : null}
                    </div>

                    <div className="space-y-4 xl:space-y-5">
                        <ContentPreviewCard contentRequest={liveContentRequest} sourceLabel={sourceLabel} />

                        <div className="grid gap-4 2xl:grid-cols-2 2xl:gap-5">
                            <AppCard variant="compact" padding="md" className="sm:p-5">
                                <div className="section-header-compact">
                                    <div className="section-header-copy">
                                        <h2 className="app-section-title">Transcript</h2>
                                        <p className="app-muted mt-1 text-sm">
                                            The source text used by the generation pipeline.
                                        </p>
                                    </div>
                                    {liveContentRequest.transcript ? (
                                        <button type="button" onClick={() => copyToClipboard(liveContentRequest.transcript)} className="btn-copy">
                                            Copy
                                        </button>
                                    ) : null}
                                </div>
                                <div className="max-h-[460px] overflow-y-auto rounded-[14px] border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface-soft))] p-4 text-sm leading-7 text-[rgb(var(--color-text))] sm:max-h-[520px]">
                                    {liveContentRequest.transcript || (isProcessing ? 'Waiting for transcript...' : 'Transcript not generated yet.')}
                                </div>
                            </AppCard>

                            <AppCard variant="compact" padding="md" className="sm:p-5">
                                <div className="section-header-compact">
                                    <div className="section-header-copy">
                                        <h2 className="app-section-title">Summary</h2>
                                        <p className="app-muted mt-1 text-sm">
                                            Condensed context before reviewing the full run.
                                        </p>
                                    </div>
                                    {liveContentRequest.summary ? (
                                        <button type="button" onClick={() => copyToClipboard(liveContentRequest.summary)} className="btn-copy">
                                            Copy
                                        </button>
                                    ) : null}
                                </div>
                                <div className="rounded-[14px] border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface-soft))] p-4 text-sm leading-7 text-[rgb(var(--color-text))]">
                                    {liveContentRequest.summary || (isProcessing ? 'Waiting for summary generation...' : 'Summary not generated yet.')}
                                </div>
                            </AppCard>
                        </div>

                        <AppCard variant="compact" padding="md" className="sm:p-5">
                            <div className="section-header-compact">
                                <div className="section-header-copy">
                                    <h2 className="app-section-title">Content responses</h2>
                                    <p className="app-muted mt-1 text-sm">
                                        AI-generated assets created from the transcript and selected tone.
                                    </p>
                                </div>
                            </div>

                            {orderedContentResponses.length === 0 ? (
                                <div className="rounded-[14px] border border-dashed border-[rgb(var(--color-border-strong))] bg-[rgb(var(--color-surface-soft))] p-4 text-sm text-slate-400">
                                    {isProcessing ? 'Content responses will appear here automatically once ready.' : 'No content responses yet.'}
                                </div>
                            ) : (
                                <div className="grid gap-4">
                                    {orderedContentResponses.map((contentResponse) => (
                                        <ContentResponseCard
                                            key={contentResponse.id}
                                            contentResponse={contentResponse}
                                            onCopy={copyToClipboard}
                                            onRegenerate={regenerateSingleOutput}
                                            fallbackLabel={formatContentType(contentResponse.content_type)}
                                        />
                                    ))}
                                </div>
                            )}

                            {missingOutputTypes.length > 0 && !isProcessing ? (
                                <div className="mt-4 rounded-[14px] border border-amber-200 bg-amber-50 px-4 py-3.5 text-sm text-amber-800">
                                    Missing outputs: {missingOutputTypes.map(formatContentType).join(', ')}. Use the regenerate action to finish the set.
                                </div>
                            ) : null}
                        </AppCard>
                    </div>
                </div>
            </div>
            <DeleteConfirmationModal
                show={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={deleteContentRequest}
                processing={deleting}
                title="Delete recording?"
                message={`This will permanently remove the source file, transcript, summary, and content responses for "${liveContentRequest.title}".`}
            />

            <ActionConfirmationModal
                show={showRetryModal}
                onClose={() => !retrying && setShowRetryModal(false)}
                onConfirm={retryTranscription}
                processing={retrying}
                variant="warning"
                title="Retry transcription?"
                message="This will clear the current transcript, summary, and content responses, then run transcription again from the original uploaded file."
                confirmText="Retry Transcription"
            />

            <ActionConfirmationModal
                show={showRegenerateModal}
                onClose={() => !regenerating && setShowRegenerateModal(false)}
                onConfirm={regenerateContent}
                processing={regenerating}
                variant="warning"
                title={liveContentRequest.status === 'partial' ? 'Complete missing outputs?' : 'Regenerate content?'}
                message={
                    liveContentRequest.status === 'partial'
                        ? 'This will keep the transcript and try to complete the missing content outputs again.'
                        : 'This will keep the transcript, remove the current content responses, and create fresh outputs again.'
                }
                confirmText={liveContentRequest.status === 'partial' ? 'Complete Missing Outputs' : 'Regenerate Content'}
            />

            <ActionConfirmationModal
                show={showCancelModal}
                onClose={() => !cancelling && setShowCancelModal(false)}
                onConfirm={cancelProcessing}
                processing={cancelling}
                variant="warning"
                title="Cancel processing?"
                message="This stops the current transcription or content-generation run and marks the recording as cancelled."
                confirmText="Cancel Processing"
            />
        </AuthenticatedLayout>
    );
}
