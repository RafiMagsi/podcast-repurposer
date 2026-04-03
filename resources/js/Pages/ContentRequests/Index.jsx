import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import DeleteConfirmationModal from '@/Components/DeleteConfirmationModal';

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

export default function ContentRequestsIndex({ auth, contentRequests }) {
    const items = contentRequests.data || [];
    const completedCount = items.filter((contentRequest) => contentRequest.status === 'completed').length;
    const activeCount = items.filter((contentRequest) =>
        ['uploaded', 'transcribing', 'transcribed', 'generating'].includes(contentRequest.status),
    ).length;
    const { flash, errors } = usePage().props;

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [selectedContentRequest, setSelectedContentRequest] = useState(null);

    const openDeleteModal = (contentRequest) => {
        setSelectedContentRequest(contentRequest);
        setShowDeleteModal(true);
    };

    const closeDeleteModal = () => {
        if (deleting) return;

        setShowDeleteModal(false);
        setSelectedContentRequest(null);
    };

    const deleteContentRequest = () => {
        if (!selectedContentRequest) return;

        setDeleting(true);

        router.delete(route('content-requests.destroy', selectedContentRequest.public_id), {
            preserveScroll: true,
            onSuccess: () => {
                setDeleting(false);
                closeDeleteModal();
            },
            onError: () => {
                setDeleting(false);
            },
            onFinish: () => {
                setDeleting(false);
            },
        });
    };

    return (
        <AuthenticatedLayout
            user={auth?.user}
            header={
                <div className="grid gap-8 xl:grid-cols-[1.1fr_.9fr] xl:items-center">
                    <div>
                        <div className="app-badge mb-4">Recordings library</div>
                        <h1 className="app-heading">Browse every upload in a cleaner recording catalog.</h1>
                        <p className="app-subheading mt-5 max-w-2xl">
                            The reference images use a white canvas, dark type, and clearer grouping.
                            This library now follows that same structure so recordings feel easier to scan.
                        </p>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="stat-card">
                            <div className="text-xs uppercase tracking-[0.18em] text-[rgb(var(--color-text-faint))]">
                                On this page
                            </div>
                            <div className="mt-3 text-4xl font-semibold text-[rgb(var(--color-text-strong))]">
                                {items.length}
                            </div>
                            <div className="mt-2 text-sm text-[rgb(var(--color-text-muted))]">
                                Recordings currently visible in the library.
                            </div>
                        </div>
                        <div className="stat-card">
                            <div className="text-xs uppercase tracking-[0.18em] text-[rgb(var(--color-text-faint))]">
                                Completed
                            </div>
                            <div className="mt-3 text-4xl font-semibold text-[rgb(var(--color-text-strong))]">
                                {completedCount}
                            </div>
                            <div className="mt-2 text-sm text-[rgb(var(--color-text-muted))]">
                                Ready to open and export.
                            </div>
                        </div>
                    </div>
                </div>
            }
        >
            <Head title="Recordings" />

            {flash?.success && (
                <div className="app-card border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-700">
                    {flash.success}
                </div>
            )}

            {errors?.contentRequest && (
                <div className="app-card border-red-500/20 bg-red-500/10 p-4 text-sm text-red-700">
                    {errors.contentRequest}
                </div>
            )}

            <div className="grid gap-4 md:grid-cols-3">
                <div className="stat-card">
                    <div className="text-xs uppercase tracking-[0.18em] text-[rgb(var(--color-text-faint))]">
                        Active processing
                    </div>
                    <div className="mt-3 text-4xl font-semibold text-[rgb(var(--color-text-strong))]">
                        {activeCount}
                    </div>
                    <div className="mt-2 text-sm text-[rgb(var(--color-text-muted))]">
                        Uploads moving through transcription or generation.
                    </div>
                </div>
                <div className="stat-card">
                    <div className="text-xs uppercase tracking-[0.18em] text-[rgb(var(--color-text-faint))]">
                        View style
                    </div>
                    <div className="mt-3 text-lg font-semibold text-[rgb(var(--color-text-strong))]">
                        Library / Workspace
                    </div>
                    <div className="mt-2 text-sm text-[rgb(var(--color-text-muted))]">
                        Open any recording to inspect transcript and content responses.
                    </div>
                </div>
                <div className="stat-card flex items-center justify-between gap-4">
                    <div>
                        <div className="text-xs uppercase tracking-[0.18em] text-[rgb(var(--color-text-faint))]">
                            New source
                        </div>
                        <div className="mt-3 text-lg font-semibold text-[rgb(var(--color-text-strong))]">
                            Start another run
                        </div>
                    </div>
                    <Link href={route('content-requests.create')} className="btn-primary">
                        Create New
                    </Link>
                </div>
            </div>

            <div className="app-card overflow-hidden">
                <div className="flex flex-col gap-4 border-b border-[rgb(var(--color-border))] px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="app-section-title">All recordings</h2>
                        <p className="app-muted">Your uploaded sources, current status, and entry to each workspace.</p>
                    </div>
                    <Link href={route('content-requests.create')} className="btn-secondary">
                        Create New
                    </Link>
                </div>

                {items.length === 0 ? (
                    <div className="p-6 text-sm text-[rgb(var(--color-text-muted))]">No recordings found.</div>
                ) : (
                    <div className="divide-y divide-[rgb(var(--color-border))]">
                        {items.map((contentRequest) => (
                            <div
                                key={contentRequest.id}
                                className="flex flex-col gap-4 px-6 py-5 xl:flex-row xl:items-center xl:justify-between"
                            >
                                <div className="min-w-0">
                                    <div className="flex flex-wrap items-center gap-3">
                                        <div className="truncate text-lg font-semibold text-[rgb(var(--color-text-strong))]">
                                            {contentRequest.title}
                                        </div>
                                        <span className="app-badge-neutral">{sourceLabel(contentRequest.source_type)}</span>
                                    </div>
                                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2 text-sm text-[rgb(var(--color-text-muted))]">
                                        <span>{contentRequest.original_file_name || 'Inline text note'}</span>
                                        <span>{contentRequest.created_at}</span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <span className={statusClass(contentRequest.status)}>{contentRequest.status}</span>

                                    <Link href={route('content-requests.show', contentRequest.public_id)} className="btn-secondary">
                                        Open workspace
                                    </Link>

                                    <button
                                        type="button"
                                        onClick={() => openDeleteModal(contentRequest)}
                                        className="btn-ghost text-red-600 hover:bg-red-50 hover:text-red-700"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {contentRequests.links && contentRequests.links.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {contentRequests.links.map((link, index) => (
                        <Link
                            key={`${link.label}-${index}`}
                            href={link.url || '#'}
                            preserveScroll
                            className={`rounded-full border px-4 py-2 text-sm transition ${
                                link.active
                                    ? 'border-[rgb(var(--color-primary))] bg-[rgb(var(--color-primary))] text-white'
                                    : 'border-[rgb(var(--color-border))] bg-white text-[rgb(var(--color-text-muted))] hover:bg-[rgb(var(--color-surface-soft))]'
                            } ${!link.url ? 'pointer-events-none opacity-50' : ''}`}
                            dangerouslySetInnerHTML={{ __html: link.label }}
                        />
                    ))}
                </div>
            )}
            <DeleteConfirmationModal
                show={showDeleteModal}
                onClose={closeDeleteModal}
                onConfirm={deleteContentRequest}
                processing={deleting}
                title="Delete recording?"
                message={
                    selectedContentRequest
                        ? `This will permanently remove the source file, transcript, summary, and content responses for "${selectedContentRequest.title}".`
                        : 'This will permanently remove this recording.'
                }
            />
        </AuthenticatedLayout>
    );
}
