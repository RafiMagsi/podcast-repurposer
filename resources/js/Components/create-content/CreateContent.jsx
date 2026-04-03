import { useForm } from '@inertiajs/react';

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

const defaultTones = [
    { label: 'Professional', value: 'professional' },
    { label: 'Engaging', value: 'engaging' },
    { label: 'Concise', value: 'concise' },
];

const handoffSteps = [
    ['1', 'Redirect immediately', 'The app sends you to the recording workspace as soon as the request is accepted.'],
    ['2', 'Track live progress', 'Processing status, transcript generation, and retries happen there instead of on the dashboard.'],
    ['3', 'Review real outputs', 'Summary, LinkedIn, X, newsletter, and the rest are reviewed where the actual data exists.'],
];

export default function CreateContent({
    tones = [],
    showCardHeader = true,
    showCancelButton = false,
    preserveScroll = false,
    titlePlaceholder = 'e.g. Founder lesson on pricing after one sales call',
    submitLabel = 'Create content',
    fileHelpText = 'Supported formats: MP3, WAV, M4A, MP4, MOV, WebM. Keep uploads under 5 MB and around one minute for the fastest turnaround.',
    className = '',
}) {
    const toneOptions = tones.length > 0 ? tones : defaultTones;

    const { data, setData, post, processing, progress, errors } = useForm({
        title: '',
        tone: toneOptions[0]?.value || 'professional',
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
            preserveScroll,
        });
    };

    return (
        <div className={`app-card overflow-hidden ${className}`}>
            {showCardHeader ? (
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
            ) : null}

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
                                placeholder={titlePlaceholder}
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
                                                {fileHelpText}
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
                                    {toneOptions.map((tone) => (
                                        <option key={tone.value} value={tone.value}>
                                            {tone.label}
                                        </option>
                                    ))}
                                </select>

                                <div className="mt-4 rounded-[20px] border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface-soft))] p-5">
                                    <div className="text-xs uppercase tracking-[0.18em] text-[rgb(var(--color-text-faint))]">
                                        Limits
                                    </div>
                                    <div className="mt-3 space-y-3 text-sm leading-7 text-[rgb(var(--color-text-muted))]">
                                        <p>Video, audio, or recording: 1 minute</p>
                                        <p>Text note: 200 characters</p>
                                        <p>Outputs: summary, LinkedIn post, X post, Instagram caption, and newsletter from one idea.</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {progress ? (
                            <div className="app-card-soft p-4">
                                <div className="mb-2 flex items-center justify-between text-sm text-[rgb(var(--color-text-muted))]">
                                    <span>Uploading source</span>
                                    <span>{progress.percentage}%</span>
                                </div>
                                <div className="progress-track">
                                    <div className="progress-fill" style={{ width: `${progress.percentage}%` }} />
                                </div>
                            </div>
                        ) : null}

                        <div className="flex flex-col gap-4 2xl:flex-row 2xl:items-center 2xl:justify-between">
                            <p className="max-w-2xl pr-0 text-sm leading-7 text-[rgb(var(--color-text-muted))] 2xl:pr-8">
                                {isTextSource
                                    ? 'Text notes skip transcription and go straight into content generation.'
                                    : 'File uploads run through transcription first, then generate content outputs.'}
                            </p>

                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                                {showCancelButton ? (
                                    <button type="button" onClick={() => window.history.back()} className="btn-outline">
                                        Cancel
                                    </button>
                                ) : null}
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="btn-primary min-w-[172px] disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {processing ? 'Processing...' : submitLabel}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>

                <div className="rounded-[28px] border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface-soft))] p-5 xl:sticky xl:top-24">
                    <div className="app-badge-neutral">After You Submit</div>
                    <h3 className="mt-4 text-xl font-semibold tracking-[-0.03em] text-[rgb(var(--color-text-strong))]">
                        You go straight to the recording workspace.
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-[rgb(var(--color-text-muted))]">
                        The dashboard is only for starting the run. Once submitted, the real transcript,
                        processing states, and generated content live on the recording page.
                    </p>

                    <div className="mt-5 space-y-3">
                        {handoffSteps.map(([step, title, description], index) => (
                            <div key={step} className="profile-card">
                                <div
                                    className={`profile-icon ${
                                        ['profile-icon-blue', 'profile-icon-purple', 'profile-icon-green'][index]
                                    } text-sm font-semibold text-[rgb(var(--color-text-strong))]`}
                                >
                                    {step}
                                </div>
                                <div>
                                    <div className="text-sm font-semibold text-[rgb(var(--color-text-strong))]">
                                        {title}
                                    </div>
                                    <div className="text-sm leading-6 text-[rgb(var(--color-text-muted))]">
                                        {description}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-5 rounded-[20px] border border-[rgb(var(--color-border))] bg-white px-4 py-4">
                        <div className="text-xs uppercase tracking-[0.18em] text-[rgb(var(--color-text-faint))]">
                            Best use of this space
                        </div>
                        <div className="mt-2 text-sm leading-6 text-[rgb(var(--color-text-muted))]">
                            Source selection, limits, and expectation-setting before the handoff.
                            The recording workspace handles the real content review.
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
