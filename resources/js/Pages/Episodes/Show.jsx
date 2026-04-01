import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, usePage } from '@inertiajs/react';

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
            return 'status-badge status-transcribing';
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

export default function EpisodesShow({ auth, episode }) {
    const { flash, errors } = usePage().props;

    const orderedContent = [...(episode.generated_contents || [])].sort((a, b) => {
        const order = ['summary', 'blog_post', 'linkedin_post', 'x_thread'];
        return order.indexOf(a.content_type) - order.indexOf(b.content_type);
    });

    const retryTranscription = () => {
        router.post(route('episodes.retry-transcription', episode.public_id));
    };

    const regenerateContent = () => {
        router.post(route('episodes.regenerate-content', episode.public_id));
    };

    return (
        <AuthenticatedLayout
            user={auth?.user}
            header={
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                        <div className="app-badge mb-3">Episode Result</div>
                        <h1 className="app-heading">{episode.title}</h1>
                        <p className="app-subheading mt-2 max-w-2xl">
                            Review the transcript, compression details, summary, and generated content.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <span className={statusClass(episode.status)}>{episode.status}</span>
                    </div>
                </div>
            }
        >
            <Head title={episode.title} />

            {flash?.success && (
                <div className="app-card border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-300">
                    {flash.success}
                </div>
            )}

            {errors?.episode && (
                <div className="app-card border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
                    {errors.episode}
                </div>
            )}

            <div className="grid gap-6 lg:grid-cols-3">
                <div className="space-y-6 lg:col-span-1">
                    <div className="app-card p-6">
                        <h2 className="app-section-title">Episode Details</h2>

                        <div className="mt-5 space-y-4 text-sm">
                            <div>
                                <div className="app-muted">Original file</div>
                                <div className="mt-1 break-words text-slate-200">
                                    {episode.original_file_name || 'N/A'}
                                </div>
                            </div>

                            <div>
                                <div className="app-muted">Original size</div>
                                <div className="mt-1 text-slate-200">
                                    {formatMb(episode.file_size)}
                                </div>
                            </div>

                            <div>
                                <div className="app-muted">Compressed size</div>
                                <div className="mt-1 text-slate-200">
                                    {formatMb(episode.compressed_file_size)}
                                </div>
                            </div>

                            <div>
                                <div className="app-muted">Compression status</div>
                                <div className="mt-1 text-slate-200">
                                    {episode.compression_status || 'Not started'}
                                </div>
                            </div>

                            <div>
                                <div className="app-muted">Tone</div>
                                <div className="mt-1 text-slate-200">{episode.tone || 'N/A'}</div>
                            </div>

                            <div>
                                <div className="app-muted">Created at</div>
                                <div className="mt-1 text-slate-200">{episode.created_at || 'N/A'}</div>
                            </div>

                            <div>
                                <div className="app-muted">Episode ID</div>
                                <div className="mt-1 break-all text-slate-200">
                                    {episode.public_id || episode.id || 'N/A'}
                                </div>
                            </div>
                        </div>
                    </div>

                    {episode.compression_error && (
                        <div className="app-card border-amber-500/20 bg-amber-500/10 p-6">
                            <h2 className="app-section-title text-amber-300">Compression Error</h2>
                            <p className="mt-3 text-sm text-amber-200">{episode.compression_error}</p>
                        </div>
                    )}

                    {episode.error_message && (
                        <div className="app-card border-red-500/20 bg-red-500/10 p-6">
                            <h2 className="app-section-title text-red-300">Processing Error</h2>
                            <p className="mt-3 text-sm text-red-200">{episode.error_message}</p>
                        </div>
                    )}

                    <div className="app-card p-6">
                        <h2 className="app-section-title">Actions</h2>

                        <div className="mt-4 flex flex-col gap-3">
                            <button
                                type="button"
                                onClick={() => copyToClipboard(episode.transcript || '')}
                                className="btn-secondary w-full"
                                disabled={!episode.transcript}
                            >
                                Copy Transcript
                            </button>

                            <button
                                type="button"
                                onClick={() => copyToClipboard(episode.summary || '')}
                                className="btn-secondary w-full"
                                disabled={!episode.summary}
                            >
                                Copy Summary
                            </button>

                            <button
                                type="button"
                                onClick={retryTranscription}
                                className="btn-secondary w-full"
                            >
                                Retry Transcription
                            </button>

                            <button
                                type="button"
                                onClick={regenerateContent}
                                className="btn-primary w-full"
                                disabled={!episode.transcript}
                            >
                                Regenerate Content
                            </button>
                        </div>
                    </div>
                </div>

                <div className="space-y-6 lg:col-span-2">
                    <div className="app-card p-6">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <h2 className="app-section-title">Summary</h2>
                                <p className="app-muted mt-1">
                                    Short overview extracted from the audio content.
                                </p>
                            </div>

                            {episode.summary ? (
                                <button
                                    type="button"
                                    onClick={() => copyToClipboard(episode.summary)}
                                    className="btn-ghost"
                                >
                                    Copy
                                </button>
                            ) : null}
                        </div>

                        <div className="mt-5 whitespace-pre-wrap text-sm leading-7 text-slate-200">
                            {episode.summary || 'Summary not generated yet.'}
                        </div>
                    </div>

                    <div className="app-card p-6">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <h2 className="app-section-title">Transcript</h2>
                                <p className="app-muted mt-1">
                                    Full transcription of the uploaded audio file.
                                </p>
                            </div>

                            {episode.transcript ? (
                                <button
                                    type="button"
                                    onClick={() => copyToClipboard(episode.transcript)}
                                    className="btn-ghost"
                                >
                                    Copy
                                </button>
                            ) : null}
                        </div>

                        <div className="mt-5 max-h-[500px] overflow-y-auto whitespace-pre-wrap rounded-2xl border border-[var(--color-border)] bg-slate-900/40 p-4 text-sm leading-7 text-slate-200">
                            {episode.transcript || 'Transcript not generated yet.'}
                        </div>
                    </div>

                    <div className="app-card p-6">
                        <div>
                            <h2 className="app-section-title">Generated Content</h2>
                            <p className="app-muted mt-1">
                                AI-generated assets created from the transcript.
                            </p>
                        </div>

                        {orderedContent.length === 0 ? (
                            <div className="mt-5 text-sm text-slate-400">
                                No generated content yet.
                            </div>
                        ) : (
                            <div className="mt-5 space-y-5">
                                {orderedContent.map((content) => (
                                    <div key={content.id} className="app-card-soft p-5">
                                        <div className="flex items-start justify-between gap-4">
                                            <div>
                                                <h3 className="text-base font-semibold text-white">
                                                    {formatContentType(content.content_type)}
                                                </h3>
                                                {content.title ? (
                                                    <p className="mt-1 text-sm text-slate-400">
                                                        {content.title}
                                                    </p>
                                                ) : null}
                                            </div>

                                            <button
                                                type="button"
                                                onClick={() => copyToClipboard(content.body)}
                                                className="btn-ghost"
                                            >
                                                Copy
                                            </button>
                                        </div>

                                        <div className="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-200">
                                            {content.body}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}