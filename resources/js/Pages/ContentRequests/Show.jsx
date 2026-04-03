import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
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
            return 'Recording';
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
    const canRetryTranscription = liveContentRequest.source_type !== 'text';

    useEffect(() => {
        setLiveContentRequest((currentContentRequest) =>
            mergeStableMediaUrls(currentContentRequest, contentRequest),
        );
    }, [contentRequest]);

    const orderedContentResponses = [...(liveContentRequest.content_responses || [])].sort((a, b) => {
        const order = ['summary', 'linkedin_post', 'x_post', 'instagram_caption', 'newsletter'];
        return order.indexOf(a.content_type) - order.indexOf(b.content_type);
    });

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
    const finalizedStatuses = ['completed', 'failed', 'cancelled'];

    const isProcessing = useMemo(() => {
        return processingStatuses.includes(liveContentRequest.status);
    }, [liveContentRequest.status]);

    const isFinalized = useMemo(() => {
        return finalizedStatuses.includes(liveContentRequest.status);
    }, [liveContentRequest.status]);

    const showRetryAction = canRetryTranscription && isFinalized;
    const showRegenerateAction = isFinalized && Boolean(liveContentRequest.transcript);

    const liveStatusLabel = useMemo(() => {
        switch (liveContentRequest.status) {
            case 'uploaded':
                if (liveContentRequest.media_kind === 'video') {
                    return 'Upload received. Video preview preparation is queued and will start shortly.';
                }

                if (liveContentRequest.media_kind === 'audio') {
                    return 'Upload received. Audio processing will start shortly.';
                }

                return 'Upload received. Waiting to start processing.';
            case 'transcribing':
                if (liveContentRequest.compression_status === 'started') {
                    if (
                        liveContentRequest.media_kind === 'video' &&
                        (!liveContentRequest.preview_path || !liveContentRequest.media_thumbnail_url)
                    ) {
                        return 'Preparing video preview, extracting a thumbnail, and getting the source ready for transcription...';
                    }

                    if (liveContentRequest.media_kind === 'audio') {
                        return 'Preparing audio and compressing it for transcription...';
                    }

                    return 'Preparing media, extracting audio, and compressing for transcription...';
                }

                if (liveContentRequest.compression_status === 'completed') {
                    return 'Media prep is complete. Transcribing source into text...';
                }

                return 'Transcribing source into text...';
            case 'transcribed':
                return 'Transcript ready. Generating content...';
            case 'generating':
                return 'Building summary and social content...';
            case 'completed':
                return 'Content is ready.';
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
    }, [liveContentRequest.compression_status, liveContentRequest.status]);

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
                <div className="grid gap-8 xl:grid-cols-[1.1fr_.9fr] xl:items-center">
                    <div>
                        <div className="app-badge mb-4">Recording workspace</div>
                        <h1 className="app-heading">{liveContentRequest.title}</h1>
                        <p className="app-subheading mt-5 max-w-2xl">
                            Inspired by the screenshots, this page now leans into a clearer recording
                            workspace: dark text, lighter panels, and more structured transcript and output review.
                        </p>
                        <div className="mt-6 flex flex-wrap items-center gap-3">
                            <span className={statusClass(liveContentRequest.status)}>{liveContentRequest.status}</span>
                            {isProcessing ? (
                                <span className="app-badge-neutral">Auto updating</span>
                            ) : null}
                            {isProcessing ? (
                                <button
                                    type="button"
                                    onClick={() => setShowCancelModal(true)}
                                    className="btn-outline"
                                >
                                    Cancel Processing
                                </button>
                            ) : null}
                            {showRetryAction ? (
                                <button
                                    type="button"
                                    onClick={() => setShowRetryModal(true)}
                                    className="btn-secondary"
                                >
                                    Retry Transcription
                                </button>
                            ) : null}

                            {showRegenerateAction ? (
                                <button
                                    type="button"
                                    onClick={() => setShowRegenerateModal(true)}
                                    className="btn-primary"
                                >
                                    Regenerate Content
                                </button>
                            ) : null}
                        </div>
                    </div>

                    <div className="app-card-soft p-6">
                        <div className="tab-group">
                            <div className="tab-item tab-item-active">Transcript</div>
                            <div className="tab-item">AI Content</div>
                            <div className="tab-item">Magic Chat</div>
                        </div>

                        <div className="mt-5 grid gap-3 sm:grid-cols-3">
                            {[
                                ['Summary', liveContentRequest.summary ? 'Ready' : 'Pending'],
                                ['Transcript', liveContentRequest.transcript ? 'Ready' : 'Pending'],
                                ['Responses', `${orderedContentResponses.length} generated`],
                            ].map(([label, value]) => (
                                <div
                                    key={label}
                                    className="rounded-[18px] border border-[rgb(var(--color-border))] bg-white px-4 py-4"
                                >
                                    <div className="text-xs uppercase tracking-[0.16em] text-[rgb(var(--color-text-faint))]">
                                        {label}
                                    </div>
                                    <div className="mt-2 text-sm font-semibold text-[rgb(var(--color-text-strong))]">
                                        {value}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            }
        >
            <Head title={liveContentRequest.title} />

            {flash?.success && (
                <div className="app-card bg-[rgb(var(--color-success-bg))] p-4 text-sm text-[rgb(var(--color-success-text))]">
                    {flash.success}
                </div>
            )}

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

            <div className="grid gap-6 xl:grid-cols-[0.78fr_1.22fr]">
                <div className="space-y-6">
                    <div className="app-card p-6">
                        <h2 className="app-section-title">Recording details</h2>
                        <div className="mt-5 space-y-3">
                            {details.map(([label, value]) => (
                                <div
                                    key={label}
                                    className="rounded-[18px] border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface-soft))] px-4 py-3"
                                >
                                    <div className="text-xs uppercase tracking-[0.18em] text-[rgb(var(--color-text-faint))]">
                                        {label}
                                    </div>
                                    <div className="mt-2 break-all text-sm leading-6 text-[rgb(var(--color-text-strong))]">
                                        {value}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {liveContentRequest.compression_error && (
                        <div className="app-card bg-[rgb(var(--color-warning-bg))] p-6 text-[rgb(var(--color-warning-text))]">
                            <h2 className="app-section-title text-[rgb(var(--color-warning-text))]">Compression issue</h2>
                            <p className="mt-3 text-sm">{liveContentRequest.compression_error}</p>
                        </div>
                    )}

                    {liveContentRequest.error_message && (
                        <div className="app-card bg-[rgb(var(--color-danger-bg))] p-6 text-[rgb(var(--color-danger-text))]">
                            <h2 className="app-section-title text-[rgb(var(--color-danger-text))]">Processing issue</h2>
                            <p className="mt-3 text-sm">{liveContentRequest.error_message}</p>
                        </div>
                    )}

                    {isProcessing ? (
                        <div className="app-card bg-[rgb(var(--color-surface-soft))] p-6">
                            <h2 className="app-section-title">Content actions locked</h2>
                            <p className="mt-3 text-sm leading-6 text-[rgb(var(--color-text-muted))]">
                                Retry transcription and regenerate content are only available after this run reaches a final state.
                            </p>
                        </div>
                    ) : null}

                    <div className="app-card p-6">
                        <h2 className="app-section-title">Quick actions</h2>
                        <div className="mt-5 flex flex-col gap-3">
                            <button
                                type="button"
                                onClick={() => copyToClipboard(liveContentRequest.transcript || '')}
                                className="btn-outline w-full"
                                disabled={!liveContentRequest.transcript}
                            >
                                Copy transcript
                            </button>
                            <button
                                type="button"
                                onClick={() => copyToClipboard(liveContentRequest.summary || '')}
                                className="btn-outline w-full"
                                disabled={!liveContentRequest.summary}
                            >
                                Copy summary
                            </button>
                            {showRetryAction ? (
                                <button
                                    type="button"
                                    onClick={() => setShowRetryModal(true)}
                                    className="btn-secondary w-full"
                                >
                                    Retry transcription
                                </button>
                            ) : null}
                            {isProcessing ? (
                                <button
                                    type="button"
                                    onClick={() => setShowCancelModal(true)}
                                    className="btn-outline w-full"
                                >
                                    Cancel processing
                                </button>
                            ) : null}
                            {showRegenerateAction ? (
                                <button
                                    type="button"
                                    onClick={() => setShowRegenerateModal(true)}
                                    className="btn-primary w-full"
                                >
                                    Regenerate content
                                </button>
                            ) : null}
                            <button
                                type="button"
                                onClick={() => setShowDeleteModal(true)}
                                className="btn-danger w-full"
                            >
                                Delete Recording
                            </button>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <ContentPreviewCard contentRequest={liveContentRequest} onCopy={copyToClipboard} sourceLabel={sourceLabel}/>
                    
                    <div className="app-card p-6">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <h2 className="app-section-title">Transcript</h2>
                                <p className="app-muted mt-2">
                                    The full text source used by the generation pipeline.
                                </p>
                            </div>
                            {liveContentRequest.transcript ? (
                                <button
                                    type="button"
                                    onClick={() => copyToClipboard(liveContentRequest.transcript)}
                                    className="btn-copy"
                                >
                                    Copy
                                </button>
                            ) : null}
                        </div>
                        <div className="mt-5 max-h-[500px] overflow-y-auto rounded-[24px] border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface-soft))] p-5 text-sm leading-7 text-[rgb(var(--color-text))]">
                            {liveContentRequest.transcript || (isProcessing ? 'Waiting for transcript...' : 'Transcript not generated yet.')}
                        </div>
                    </div>
                    
                    <div className="app-card p-6">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <h2 className="app-section-title">Summary</h2>
                                <p className="app-muted mt-2">
                                    Condensed context before you review the full transcript.
                                </p>
                            </div>
                            {liveContentRequest.summary ? (
                                <button
                                    type="button"
                                    onClick={() => copyToClipboard(liveContentRequest.summary)}
                                    className="btn-copy"
                                >
                                    Copy
                                </button>
                            ) : null}
                        </div>
                        <div className="mt-5 rounded-[24px] border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface-soft))] p-5 text-sm leading-7 text-[rgb(var(--color-text))]">
                            {liveContentRequest.summary || (isProcessing ? 'Waiting for summary generation...' : 'Summary not generated yet.')}
                        </div>
                    </div>

                    <div className="app-card p-6">
                        <div>
                            <h2 className="app-section-title">Content responses</h2>
                            <p className="app-muted mt-2">
                                AI-generated assets created from the transcript and recording tone.
                            </p>
                        </div>

                        {orderedContentResponses.length === 0 ? (
                            <div className="mt-5 text-sm text-slate-400">
                                {isProcessing ? 'Content responses will appear here automatically once ready.' : 'No content responses yet.'}
                            </div>
                        ) : (
                            <div className="mt-5 space-y-5">
                                {orderedContentResponses.map((contentResponse) => (
                                    <ContentResponseCard
                                        key={contentResponse.id}
                                        contentResponse={contentResponse}
                                        onCopy={copyToClipboard}
                                        fallbackLabel={formatContentType(contentResponse.content_type)}
                                    />
                                ))}
                            </div>
                        )}
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
                title="Regenerate content?"
                message="This will keep the transcript, remove the current content responses, and create fresh outputs again."
                confirmText="Regenerate Content"
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
