import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';

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

export default function EpisodesShow({ auth, episode }) {
    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                        <div className="app-badge mb-3">Episode Result</div>
                        <h1 className="app-heading">{episode.title}</h1>
                        <p className="app-subheading mt-2 max-w-2xl">
                            Review the transcript, summary, and generated content from your uploaded
                            audio file.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <span className={statusClass(episode.status)}>{episode.status}</span>
                    </div>
                </div>
            }
        >
            <Head title={episode.title} />

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
                                <div className="app-muted">File size</div>
                                <div className="mt-1 text-slate-200">
                                    {(episode.file_size / 1024 / 1024).toFixed(2)} MB
                                </div>
                            </div>

                            <div>
                                <div className="app-muted">Tone</div>
                                <div className="mt-1 text-slate-200">{episode.tone}</div>
                            </div>

                            <div>
                                <div className="app-muted">Created at</div>
                                <div className="mt-1 text-slate-200">{episode.created_at}</div>
                            </div>
                        </div>
                    </div>

                    {episode.error_message && (
                        <div className="app-card border-red-500/20 bg-red-500/10 p-6">
                            <h2 className="app-section-title text-red-300">Error</h2>
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
                            >
                                Copy Transcript
                            </button>

                            <button
                                type="button"
                                onClick={() => copyToClipboard(episode.summary || '')}
                                className="btn-secondary w-full"
                            >
                                Copy Summary
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

                        <div className="mt-5 max-h-[500px] overflow-y-auto whitespace-pre-wrap rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-2)]/60 p-4 text-sm leading-7 text-slate-200">
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

                        {episode.generated_contents.length === 0 ? (
                            <div className="mt-5 text-sm text-slate-400">
                                No generated content yet.
                            </div>
                        ) : (
                            <div className="mt-5 space-y-5">
                                {episode.generated_contents.map((content) => (
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