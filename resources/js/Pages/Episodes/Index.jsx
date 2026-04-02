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

export default function EpisodesIndex({ auth, episodes }) {
    const items = episodes.data || [];
    const completedCount = items.filter((episode) => episode.status === 'completed').length;
    const activeCount = items.filter((episode) =>
        ['uploaded', 'transcribing', 'transcribed', 'generating'].includes(episode.status),
    ).length;
    const { flash, errors } = usePage().props;

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [selectedEpisode, setSelectedEpisode] = useState(null);

    const openDeleteModal = (episode) => {
        setSelectedEpisode(episode);
        setShowDeleteModal(true);
    };

    const closeDeleteModal = () => {
        if (deleting) return;

        setShowDeleteModal(false);
        setSelectedEpisode(null);
    };

    const deleteEpisode = () => {
        if (!selectedEpisode) return;

        setDeleting(true);

        router.delete(route('episodes.destroy', selectedEpisode.public_id), {
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
                            This library now follows that same structure so episodes feel easier to scan.
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
            <Head title="Episodes" />

            {flash?.success && (
                <div className="app-card border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-700">
                    {flash.success}
                </div>
            )}

            {errors?.episode && (
                <div className="app-card border-red-500/20 bg-red-500/10 p-4 text-sm text-red-700">
                    {errors.episode}
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
                        Open any episode to inspect transcript and outputs.
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
                    <Link href={route('episodes.create')} className="btn-primary">
                        Upload
                    </Link>
                </div>
            </div>

            <div className="app-card overflow-hidden">
                <div className="flex flex-col gap-4 border-b border-[rgb(var(--color-border))] px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="app-section-title">All recordings</h2>
                        <p className="app-muted">Your uploaded audio, current status, and entry to each workspace.</p>
                    </div>
                    <Link href={route('episodes.create')} className="btn-secondary">
                        Add upload
                    </Link>
                </div>

                {items.length === 0 ? (
                    <div className="p-6 text-sm text-[rgb(var(--color-text-muted))]">No recordings found.</div>
                ) : (
                    <div className="divide-y divide-[rgb(var(--color-border))]">
                        {items.map((episode) => (
                            <div
                                key={episode.id}
                                className="flex flex-col gap-4 px-6 py-5 xl:flex-row xl:items-center xl:justify-between"
                            >
                                <div className="min-w-0">
                                    <div className="truncate text-lg font-semibold text-[rgb(var(--color-text-strong))]">
                                        {episode.title}
                                    </div>
                                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2 text-sm text-[rgb(var(--color-text-muted))]">
                                        <span>{episode.original_file_name || 'Audio file'}</span>
                                        <span>{episode.created_at}</span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <span className={statusClass(episode.status)}>{episode.status}</span>

                                    <Link href={route('episodes.show', episode.public_id)} className="btn-secondary">
                                        Open workspace
                                    </Link>

                                    <button
                                        type="button"
                                        onClick={() => openDeleteModal(episode)}
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

            {episodes.links && episodes.links.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {episodes.links.map((link, index) => (
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
                onConfirm={deleteEpisode}
                processing={deleting}
                title="Delete episode?"
                message={
                    selectedEpisode
                        ? `This will permanently remove the audio file, transcript, summary, and generated content for "${selectedEpisode.title}".`
                        : 'This will permanently remove this episode.'
                }
            />
        </AuthenticatedLayout>
    );
}
