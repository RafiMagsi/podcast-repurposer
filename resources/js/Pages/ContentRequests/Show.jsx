import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, usePage } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
import DeleteConfirmationModal from '@/Components/DeleteConfirmationModal';
import ActionConfirmationModal from '@/Components/ActionConfirmationModal';
import ProcessingStatusCard from '@/Components/ProcessingStatusCard';
import ContentResponseCard from '@/Components/content-responses/ContentResponseCard';

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

export default function ContentRequestsShow({ auth, contentRequest }) {
    const { flash, errors } = usePage().props;
    const canRetryTranscription = contentRequest.source_type !== 'text';

    const orderedContentResponses = [...(contentRequest.content_responses || [])].sort((a, b) => {
        const order = ['summary', 'linkedin_post', 'x_post', 'instagram_caption', 'newsletter'];
        return order.indexOf(a.content_type) - order.indexOf(b.content_type);
    });

    const retryTranscription = () => {
        setRetrying(true);

        router.post(route('content-requests.retry-transcription', contentRequest.public_id), {}, {
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

        router.post(route('content-requests.regenerate-content', contentRequest.public_id), {}, {
            onSuccess: () => {
                setShowRegenerateModal(false);
            },
            onFinish: () => {
                setRegenerating(false);
            },
        });
    };

    const details = [
        ['Source type', sourceLabel(contentRequest.source_type)],
        ['Original file', contentRequest.original_file_name || 'Inline text note'],
        ['Original size', formatMb(contentRequest.file_size)],
        ['Compressed size', formatMb(contentRequest.compressed_file_size)],
        ['Compression status', contentRequest.compression_status || 'Not started'],
        ['Tone', contentRequest.tone || 'N/A'],
        ['Created at', contentRequest.created_at || 'N/A'],
        ['Recording ID', contentRequest.public_id || contentRequest.id || 'N/A'],
    ];

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [showRetryModal, setShowRetryModal] = useState(false);
    const [showRegenerateModal, setShowRegenerateModal] = useState(false);
    const [retrying, setRetrying] = useState(false);
    const [regenerating, setRegenerating] = useState(false);

    const deleteContentRequest = () => {
        setDeleting(true);

        router.delete(route('content-requests.destroy', contentRequest.public_id), {
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

    const isProcessing = useMemo(() => {
        return processingStatuses.includes(contentRequest.status);
    }, [contentRequest.status]);

    const liveStatusLabel = useMemo(() => {
        switch (contentRequest.status) {
            case 'uploaded':
                return 'Upload received. Waiting to start processing.';
            case 'transcribing':
                return 'Transcribing source into text...';
            case 'transcribed':
                return 'Transcript ready. Generating content...';
            case 'generating':
                return 'Building summary and social content...';
            case 'completed':
                return 'Content is ready.';
            case 'failed':
                return 'Processing failed. Review the error and retry if needed.';
            default:
                return 'Status updated.';
        }
    }, [contentRequest.status]);

    useEffect(() => {
        if (!isProcessing) return;

        const interval = window.setInterval(() => {
            router.reload({
                only: ['contentRequest', 'flash', 'errors'],
                preserveScroll: true,
                preserveState: true,
            });
        }, 2500);

        const onFocus = () => {
            router.reload({
                only: ['contentRequest', 'flash', 'errors'],
                preserveScroll: true,
                preserveState: true,
            });
        };

        window.addEventListener('focus', onFocus);

        return () => {
            window.clearInterval(interval);
            window.removeEventListener('focus', onFocus);
        };
    }, [isProcessing]);

    return (
        <AuthenticatedLayout
            user={auth?.user}
            header={
                <div className="grid gap-8 xl:grid-cols-[1.1fr_.9fr] xl:items-center">
                    <div>
                        <div className="app-badge mb-4">Recording workspace</div>
                        <h1 className="app-heading">{contentRequest.title}</h1>
                        <p className="app-subheading mt-5 max-w-2xl">
                            Inspired by the screenshots, this page now leans into a clearer recording
                            workspace: dark text, lighter panels, and more structured transcript and output review.
                        </p>
                        <div className="mt-6 flex flex-wrap items-center gap-3">
                            <span className={statusClass(contentRequest.status)}>{contentRequest.status}</span>
                            {isProcessing ? (
                                <span className="app-badge-neutral">Auto updating</span>
                            ) : null}
                            {canRetryTranscription ? (
                                <button
                                    type="button"
                                    onClick={() => setShowRetryModal(true)}
                                    className="btn-secondary"
                                >
                                    Retry Transcription
                                </button>
                            ) : null}

                            <button
                                type="button"
                                onClick={() => setShowRegenerateModal(true)}
                                className="btn-primary"
                                disabled={!contentRequest.transcript}
                            >
                                Regenerate Content
                            </button>
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
                                ['Summary', contentRequest.summary ? 'Ready' : 'Pending'],
                                ['Transcript', contentRequest.transcript ? 'Ready' : 'Pending'],
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
            <Head title={contentRequest.title} />

            {flash?.success && (
                <div className="app-card bg-[rgb(var(--color-success-bg))] p-4 text-sm text-[rgb(var(--color-success-text))]">
                    {flash.success}
                </div>
            )}

            <ProcessingStatusCard
                contentRequest={contentRequest}
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

                    {contentRequest.compression_error && (
                        <div className="app-card bg-[rgb(var(--color-warning-bg))] p-6 text-[rgb(var(--color-warning-text))]">
                            <h2 className="app-section-title text-[rgb(var(--color-warning-text))]">Compression issue</h2>
                            <p className="mt-3 text-sm">{contentRequest.compression_error}</p>
                        </div>
                    )}

                    {contentRequest.error_message && (
                        <div className="app-card bg-[rgb(var(--color-danger-bg))] p-6 text-[rgb(var(--color-danger-text))]">
                            <h2 className="app-section-title text-[rgb(var(--color-danger-text))]">Processing issue</h2>
                            <p className="mt-3 text-sm">{contentRequest.error_message}</p>
                        </div>
                    )}

                    <div className="app-card p-6">
                        <h2 className="app-section-title">Quick actions</h2>
                        <div className="mt-5 flex flex-col gap-3">
                            <button
                                type="button"
                                onClick={() => copyToClipboard(contentRequest.transcript || '')}
                                className="btn-outline w-full"
                                disabled={!contentRequest.transcript}
                            >
                                Copy transcript
                            </button>
                            <button
                                type="button"
                                onClick={() => copyToClipboard(contentRequest.summary || '')}
                                className="btn-outline w-full"
                                disabled={!contentRequest.summary}
                            >
                                Copy summary
                            </button>
                            {canRetryTranscription ? (
                                <button
                                    type="button"
                                    onClick={() => setShowRetryModal(true)}
                                    className="btn-secondary w-full"
                                >
                                    Retry transcription
                                </button>
                            ) : null}
                            <button
                                type="button"
                                onClick={() => setShowRegenerateModal(true)}
                                className="btn-primary w-full"
                                disabled={!contentRequest.transcript}
                            >
                                Regenerate content
                            </button>
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
                    <div className="app-card p-6">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <h2 className="app-section-title">Summary</h2>
                                <p className="app-muted mt-2">
                                    Condensed context before you review the full transcript.
                                </p>
                            </div>
                            {contentRequest.summary ? (
                                <button
                                    type="button"
                                    onClick={() => copyToClipboard(contentRequest.summary)}
                                    className="btn-copy"
                                >
                                    Copy
                                </button>
                            ) : null}
                        </div>
                        <div className="mt-5 rounded-[24px] border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface-soft))] p-5 text-sm leading-7 text-[rgb(var(--color-text))]">
                            {contentRequest.summary || (isProcessing ? 'Waiting for summary generation...' : 'Summary not generated yet.')}
                        </div>
                    </div>

                    <div className="app-card p-6">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <h2 className="app-section-title">Transcript</h2>
                                <p className="app-muted mt-2">
                                    The full text source used by the generation pipeline.
                                </p>
                            </div>
                            {contentRequest.transcript ? (
                                <button
                                    type="button"
                                    onClick={() => copyToClipboard(contentRequest.transcript)}
                                    className="btn-copy"
                                >
                                    Copy
                                </button>
                            ) : null}
                        </div>
                        <div className="mt-5 max-h-[500px] overflow-y-auto rounded-[24px] border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface-soft))] p-5 text-sm leading-7 text-[rgb(var(--color-text))]">
                            {contentRequest.transcript || (isProcessing ? 'Waiting for transcript...' : 'Transcript not generated yet.')}
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
                message={`This will permanently remove the source file, transcript, summary, and content responses for "${contentRequest.title}".`}
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
        </AuthenticatedLayout>
    );
}
