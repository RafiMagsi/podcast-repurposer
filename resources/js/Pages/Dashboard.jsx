import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm, usePage } from '@inertiajs/react';

const sourceOptions = [
    {
        value: 'video',
        title: '1-minute video',
        description: 'Upload a short MP4, MOV, or WebM clip and extract the transcript from it.',
        icon: 'V',
        iconClass: 'profile-icon-orange',
    },
    {
        value: 'audio',
        title: '1-minute audio',
        description: 'Drop in an MP3, WAV, or M4A file to generate content from clean spoken audio.',
        icon: 'A',
        iconClass: 'profile-icon-blue',
    },
    {
        value: 'recording',
        title: '1-minute recording',
        description: 'Use the same upload flow for a raw voice recording captured from your device.',
        icon: 'R',
        iconClass: 'profile-icon-green',
    },
    {
        value: 'text',
        title: '200-character sentence',
        description: 'Paste one short idea and turn it into content without uploading a file.',
        icon: 'T',
        iconClass: 'profile-icon-purple',
    },
];

const outputCards = [
    {
        title: 'Summary',
        description: 'A short clean overview of the main idea and supporting point.',
    },
    {
        title: 'LinkedIn Post',
        description: 'A sharper professional draft built from the transcript or text note.',
    },
    {
        title: 'X Post',
        description: 'A concise publish-ready version for fast short-form posting.',
    },
];

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

function formatRelative(dateString) {
    if (!dateString) return 'Unknown';

    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMinutes = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString();
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

function sourcePillClass(sourceType) {
    switch (sourceType) {
        case 'video':
            return 'app-badge-neutral';
        case 'text':
            return 'app-badge';
        case 'audio':
            return 'app-badge-neutral';
        default:
            return 'app-badge-neutral';
    }
}

export default function Dashboard({ auth, episodes = [] }) {
    const { flash } = usePage().props;
    const completedCount = episodes.filter((episode) => episode.status === 'completed').length;
    const processingCount = episodes.filter((episode) =>
        ['uploaded', 'transcribing', 'transcribed', 'generating'].includes(episode.status),
    ).length;
    const failedCount = episodes.filter((episode) => episode.status === 'failed').length;
    const activeEpisode = episodes[0] || null;

    const { data, setData, post, processing, progress, errors, reset } = useForm({
        title: '',
        tone: 'professional',
        source_type: 'recording',
        source_file: null,
        source_text: '',
    });

    const isTextSource = data.source_type === 'text';
    const textLength = data.source_text.length;
    const fileError = errors.source_file || errors.audio;

    const submit = (e) => {
        e.preventDefault();

        post(route('episodes.store'), {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => reset(),
        });
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
                    <div>
                        <div className="app-badge-neutral">VoicePost AI Studio</div>
                        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-[rgb(var(--color-text-strong))]">
                            Create content from one short source.
                        </h1>
                        <p className="mt-2 max-w-2xl text-sm leading-7 text-[rgb(var(--color-text-muted))]">
                            Bring in a 1-minute video, audio clip, recording, or one sentence under
                            200 characters and move from transcript to content in one workspace.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <Link href={route('episodes.index')} className="topbar-action">
                            Recordings
                        </Link>
                        <Link href={route('settings.index')} className="topbar-action">
                            Settings
                        </Link>
                        <Link href={route('episodes.create')} className="btn-primary-rect">
                            Full upload page
                        </Link>
                    </div>
                </div>
            }
        >
            <Head title="Dashboard" />

            <div className="space-y-6">
                {flash?.success && (
                    <div className="app-card border-[rgb(var(--color-border))] bg-[rgb(var(--color-success-bg))] p-4 text-sm text-[rgb(var(--color-success-text))]">
                        {flash.success}
                    </div>
                )}

                <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-4">
                    <div className="stat-card">
                        <div className="app-faint text-xs uppercase tracking-[0.18em] text-[rgb(var(--color-text-faint))]">
                            Total runs
                        </div>
                        <div className="mt-3 text-4xl font-semibold text-[rgb(var(--color-text-strong))]">
                            {episodes.length}
                        </div>
                        <div className="mt-2 text-sm text-[rgb(var(--color-text-muted))]">
                            Video, audio, recordings, and text notes in one library.
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="app-faint text-xs uppercase tracking-[0.18em] text-[rgb(var(--color-text-faint))]">
                            Completed
                        </div>
                        <div className="mt-3 text-4xl font-semibold text-[rgb(var(--color-text-strong))]">
                            {completedCount}
                        </div>
                        <div className="mt-2 text-sm text-[rgb(var(--color-text-muted))]">
                            Ready to copy, refine, or publish.
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="app-faint text-xs uppercase tracking-[0.18em] text-[rgb(var(--color-text-faint))]">
                            Processing
                        </div>
                        <div className="mt-3 text-4xl font-semibold text-[rgb(var(--color-text-strong))]">
                            {processingCount}
                        </div>
                        <div className="mt-2 text-sm text-[rgb(var(--color-text-muted))]">
                            Transcribing or generating content right now.
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="app-faint text-xs uppercase tracking-[0.18em] text-[rgb(var(--color-text-faint))]">
                            Needs review
                        </div>
                        <div className="mt-3 text-4xl font-semibold text-[rgb(var(--color-text-strong))]">
                            {failedCount}
                        </div>
                        <div className="mt-2 text-sm text-[rgb(var(--color-text-muted))]">
                            Items that need another pass or a settings fix.
                        </div>
                    </div>
                </div>

                <div className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_360px]">
                    <div className="space-y-6">
                        <div className="app-card overflow-hidden">
                            <div className="border-b border-[rgb(var(--color-border))] px-6 py-5">
                                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                                    <div>
                                        <div className="app-badge-neutral">Create Content</div>
                                        <h2 className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-[rgb(var(--color-text-strong))]">
                                            Start with one short source.
                                        </h2>
                                    </div>

                                    <div className="tab-group">
                                        <div className="tab-item tab-item-active">Create</div>
                                        <div className="tab-item">Recurring prompts</div>
                                    </div>
                                </div>
                            </div>

                            <div className="grid gap-8 p-6 2xl:grid-cols-[minmax(0,1.22fr)_360px]">
                                <div>
                                    <div className="grid gap-3 lg:grid-cols-1">
                                        {sourceOptions.map((option) => (
                                            <button
                                                key={option.value}
                                                type="button"
                                                onClick={() => setData('source_type', option.value)}
                                                className={`profile-card min-h-[unset] px-5 py-5 text-left ${data.source_type === option.value ? 'profile-card-active' : ''}`}
                                            >
                                                <div className="flex items-start gap-4">
                                                    <div
                                                        className={`profile-icon ${option.iconClass} mt-0.5 text-sm font-semibold text-[rgb(var(--color-text-strong))]`}
                                                    >
                                                        {option.icon}
                                                    </div>

                                                    <div className="min-w-0 flex-1">
                                                        <div className="text-[18px] font-semibold leading-8 text-[rgb(var(--color-text-strong))]">
                                                            {option.title}
                                                        </div>
                                                        <div className="mt-1 text-sm leading-7 text-[rgb(var(--color-text-muted))]">
                                                            {option.description}
                                                        </div>
                                                    </div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>

                                    <form onSubmit={submit} className="mt-6 space-y-5">
                                        <div>
                                            <label className="label-theme">Recording title</label>
                                            <input
                                                type="text"
                                                value={data.title}
                                                onChange={(e) => setData('title', e.target.value)}
                                                className="input-theme"
                                                placeholder="e.g. Founder lesson on pricing after one sales call"
                                            />
                                            {errors.title && <p className="form-error">{errors.title}</p>}
                                        </div>

                                        <div className="grid gap-5">
                                            <div>
                                                {isTextSource ? (
                                                    <>
                                                        <div className="mb-2 flex items-center justify-between gap-3">
                                                            <label className="label-theme mb-0">Text sentence</label>
                                                            <span className="text-xs font-medium text-[rgb(var(--color-text-faint))]">
                                                                {textLength}/200
                                                            </span>
                                                        </div>
                                                        <textarea
                                                            value={data.source_text}
                                                            onChange={(e) => setData('source_text', e.target.value.slice(0, 200))}
                                                            className="textarea-theme"
                                                            rows={6}
                                                            maxLength={200}
                                                            placeholder="Paste one short insight, takeaway, or idea. Keep it under 200 characters."
                                                        />
                                                        {errors.source_text && <p className="form-error">{errors.source_text}</p>}
                                                    </>
                                                ) : (
                                                    <>
                                                        <label className="label-theme">
                                                            {data.source_type === 'video' ? 'Video file' : 'Source file'}
                                                        </label>
                                                        <div className="upload-zone min-h-[220px] items-start justify-start text-left">
                                                            <input
                                                                type="file"
                                                                accept="audio/*,video/mp4,video/quicktime,video/webm"
                                                                onChange={(e) => setData('source_file', e.target.files[0] || null)}
                                                                className="block w-full text-sm text-[rgb(var(--color-text-muted))] file:mr-4 file:rounded-full file:border-0 file:bg-[rgb(var(--color-primary))] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-[rgb(var(--color-primary-hover))]"
                                                            />
                                                            <div className="mt-4 max-w-sm text-sm leading-7 text-[rgb(var(--color-text-muted))]">
                                                                Supported formats: MP3, WAV, M4A, MP4, MOV, WebM.
                                                                Keep uploads under 5 MB and around one minute for the fastest turnaround.
                                                            </div>
                                                        </div>
                                                        {fileError && <p className="form-error">{fileError}</p>}
                                                    </>
                                                )}
                                            </div>

                                            <div>
                                                <label className="label-theme">Voice and tone</label>
                                                <select
                                                    value={data.tone}
                                                    onChange={(e) => setData('tone', e.target.value)}
                                                    className="select-theme"
                                                >
                                                    <option value="professional">Professional</option>
                                                    <option value="engaging">Engaging</option>
                                                    <option value="concise">Concise</option>
                                                </select>

                                                <div className="mt-4 rounded-[20px] border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface-soft))] p-5">
                                                    <div className="text-xs uppercase tracking-[0.18em] text-[rgb(var(--color-text-faint))]">
                                                        Limits
                                                    </div>
                                                    <div className="mt-3 space-y-3 text-sm leading-7 text-[rgb(var(--color-text-muted))]">
                                                        <p>Video, audio, or recording: 1 minute</p>
                                                        <p>Text note: 200 characters</p>
                                                        <p>Outputs: summary, LinkedIn post, X post</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {progress && (
                                            <div className="app-card-soft p-4">
                                                <div className="mb-2 flex items-center justify-between text-sm text-[rgb(var(--color-text-muted))]">
                                                    <span>Uploading source</span>
                                                    <span>{progress.percentage}%</span>
                                                </div>
                                                <div className="progress-track">
                                                    <div className="progress-fill" style={{ width: `${progress.percentage}%` }} />
                                                </div>
                                            </div>
                                        )}

                                        <div className="flex flex-col gap-4 2xl:flex-row 2xl:items-center 2xl:justify-between">
                                            <p className="max-w-2xl pr-0 text-sm leading-7 text-[rgb(var(--color-text-muted))] 2xl:pr-8">
                                                {isTextSource
                                                    ? 'Text notes skip transcription and go straight into content generation.'
                                                    : 'File uploads run through transcription first, then generate content outputs.'}
                                            </p>
                                            <button
                                                type="submit"
                                                disabled={processing}
                                                className="btn-primary min-w-[172px] disabled:cursor-not-allowed disabled:opacity-60"
                                            >
                                                {processing ? 'Processing...' : 'Create content'}
                                            </button>
                                        </div>
                                    </form>
                                </div>

                                <div className="rounded-[28px] border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface-soft))] p-5 xl:sticky xl:top-24">
                                    <div className="app-badge-neutral">Workspace Preview</div>
                                    <h3 className="mt-4 text-xl font-semibold tracking-[-0.03em] text-[rgb(var(--color-text-strong))]">
                                        {activeEpisode?.title || 'One short source becomes a full draft set'}
                                    </h3>
                                    <p className="mt-2 text-sm leading-6 text-[rgb(var(--color-text-muted))]">
                                        Review transcript on the right, then move into summary and channel-specific outputs.
                                    </p>

                                    <div className="mt-5 overflow-hidden rounded-[24px] border border-[rgb(var(--color-border))] bg-white">
                                        <div className="aspect-[16/10] bg-[linear-gradient(135deg,rgba(244,239,235,1),rgba(233,239,255,1))] p-4">
                                            <div className="flex h-full items-end rounded-[18px] bg-[linear-gradient(135deg,rgba(18,18,22,0.9),rgba(67,58,49,0.82))] p-4">
                                                <div className="w-full rounded-[16px] bg-white/12 p-4 text-sm text-white/90 backdrop-blur-sm">
                                                    <div className="font-semibold">Transcript preview</div>
                                                    <div className="mt-2 text-xs leading-5 text-white/70">
                                                        VoicePost AI extracts the transcript, then builds reusable post drafts from the strongest idea.
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="border-t border-[rgb(var(--color-border))] p-4">
                                            <div className="tab-group w-full justify-between gap-2">
                                                <div className="tab-item tab-item-active">Transcript</div>
                                                <div className="tab-item">Outputs</div>
                                            </div>

                                            <div className="mt-4 space-y-3">
                                                <div className="rounded-[18px] border border-[rgb(var(--color-border))] px-4 py-4">
                                                    <div className="text-sm font-semibold text-[rgb(var(--color-text-strong))]">
                                                        Speaker 1
                                                    </div>
                                                    <div className="mt-1 text-sm leading-6 text-[rgb(var(--color-text-muted))]">
                                                        Start with one clear idea, explain why it matters, and let the workspace expand it.
                                                    </div>
                                                </div>
                                                <div className="rounded-[18px] border border-[rgb(var(--color-border))] px-4 py-3">
                                                    <div className="text-sm font-semibold text-[rgb(var(--color-text-strong))]">
                                                        Output stack
                                                    </div>
                                                    <div className="mt-2 flex flex-wrap gap-2">
                                                        {outputCards.map((item) => (
                                                            <span key={item.title} className="filter-pill">
                                                                {item.title}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="app-card p-6">
                            <div className="flex flex-col gap-4 border-b border-[rgb(var(--color-border))] pb-5 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <div className="app-badge-neutral">Recurring Outputs</div>
                                    <h2 className="mt-3 text-xl font-semibold tracking-[-0.03em] text-[rgb(var(--color-text-strong))]">
                                        Every short source expands into usable drafts.
                                    </h2>
                                </div>
                                <Link href={route('episodes.index')} className="btn-outline">
                                    View library
                                </Link>
                            </div>

                            <div className="mt-5 space-y-4">
                                {outputCards.map((item, index) => (
                                    <div key={item.title} className="output-section">
                                        <div className="output-section-header justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="profile-icon profile-icon-blue text-sm font-semibold text-[rgb(var(--color-text-strong))]">
                                                    {index + 1}
                                                </div>
                                                <div>
                                                    <div>{item.title}</div>
                                                    <div className="text-xs font-normal text-[rgb(var(--color-text-muted))]">
                                                        {item.description}
                                                    </div>
                                                </div>
                                            </div>
                                            <span className="app-badge-saved">Generated</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="app-card overflow-hidden">
                            <div className="flex flex-col gap-4 border-b border-[rgb(var(--color-border))] px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <h2 className="app-section-title">Recent recordings</h2>
                                    <p className="app-muted mt-1">
                                        Browse the latest runs and jump back into the workspace quickly.
                                    </p>
                                </div>

                                <Link href={route('episodes.index')} className="btn-secondary">
                                    Open library
                                </Link>
                            </div>

                            {episodes.length === 0 ? (
                                <div className="p-6 text-sm text-[rgb(var(--color-text-muted))]">
                                    No recordings yet. Create your first short source above.
                                </div>
                            ) : (
                                <div className="divide-y divide-[rgb(var(--color-border))]">
                                    {episodes.map((episode) => (
                                        <div
                                            key={episode.public_id || episode.id}
                                            className="flex flex-col gap-4 px-6 py-5 xl:flex-row xl:items-center xl:justify-between"
                                        >
                                            <div className="min-w-0">
                                                <div className="flex flex-wrap items-center gap-3">
                                                    <div className="truncate text-base font-semibold text-[rgb(var(--color-text-strong))]">
                                                        {episode.title}
                                                    </div>
                                                    <span className={sourcePillClass(episode.source_type)}>
                                                        {sourceLabel(episode.source_type)}
                                                    </span>
                                                    <span className={statusClass(episode.status)}>{episode.status}</span>
                                                </div>
                                                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2 text-sm text-[rgb(var(--color-text-muted))]">
                                                    <span>{episode.original_file_name || 'Inline text note'}</span>
                                                    <span>{formatRelative(episode.created_at)}</span>
                                                </div>
                                            </div>

                                            <Link href={route('episodes.show', episode.public_id)} className="btn-secondary">
                                                Open workspace
                                            </Link>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="space-y-6 xl:sticky xl:top-24 xl:self-start">
                        <div className="app-card p-6">
                            <div className="app-badge-neutral">Current Focus</div>
                            <h2 className="mt-4 text-2xl font-semibold tracking-[-0.03em] text-[rgb(var(--color-text-strong))]">
                                {activeEpisode ? activeEpisode.title : 'Build your first content run'}
                            </h2>
                            <p className="mt-3 text-sm leading-7 text-[rgb(var(--color-text-muted))]">
                                {activeEpisode
                                    ? 'Open the latest run to review its transcript, outputs, and status in the workspace.'
                                    : 'Use the create panel to start with a 1-minute file or one short sentence.'}
                            </p>

                            <div className="mt-5 grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
                                <div className="rounded-[18px] border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface-soft))] px-4 py-3">
                                    <div className="text-xs uppercase tracking-[0.18em] text-[rgb(var(--color-text-faint))]">
                                        Source types
                                    </div>
                                    <div className="mt-2 text-sm font-semibold text-[rgb(var(--color-text-strong))]">
                                        Video, audio, recording, text
                                    </div>
                                </div>
                                <div className="rounded-[18px] border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface-soft))] px-4 py-3">
                                    <div className="text-xs uppercase tracking-[0.18em] text-[rgb(var(--color-text-faint))]">
                                        Limits
                                    </div>
                                    <div className="mt-2 text-sm font-semibold text-[rgb(var(--color-text-strong))]">
                                        1 minute / 200 chars
                                    </div>
                                </div>
                                <div className="rounded-[18px] border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface-soft))] px-4 py-3">
                                    <div className="text-xs uppercase tracking-[0.18em] text-[rgb(var(--color-text-faint))]">
                                        Outputs
                                    </div>
                                    <div className="mt-2 text-sm font-semibold text-[rgb(var(--color-text-strong))]">
                                        Summary, LinkedIn, X
                                    </div>
                                </div>
                            </div>

                            <div className="mt-5 flex flex-col gap-3">
                                {activeEpisode ? (
                                    <Link href={route('episodes.show', activeEpisode.public_id)} className="btn-primary w-full">
                                        Open latest workspace
                                    </Link>
                                ) : (
                                    <Link href={route('episodes.create')} className="btn-primary w-full">
                                        Open full upload page
                                    </Link>
                                )}
                                <Link href={route('settings.index')} className="btn-secondary w-full">
                                    Configure providers
                                </Link>
                            </div>
                        </div>

                        <div className="app-card p-6">
                            <div className="app-badge-neutral">Best Practices</div>
                            <div className="mt-4 space-y-4">
                                {[
                                    'Keep file-based inputs close to one main idea instead of mixing multiple topics.',
                                    'Lead with the strongest insight first so the transcript stays focused.',
                                    'For text mode, one sentence with a clear angle produces cleaner post drafts.',
                                ].map((item) => (
                                    <div
                                        key={item}
                                        className="rounded-[18px] border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface-soft))] px-4 py-3 text-sm leading-6 text-[rgb(var(--color-text-muted))]"
                                    >
                                        {item}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
