import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm } from '@inertiajs/react';

const sourceOptions = [
    {
        value: 'video',
        title: '1-minute video',
        description: 'MP4, MOV, or WebM clips for transcript-led content generation.',
        icon: 'V',
        iconClass: 'profile-icon-orange',
    },
    {
        value: 'audio',
        title: '1-minute audio',
        description: 'Short audio files for transcript, summary, and post creation.',
        icon: 'A',
        iconClass: 'profile-icon-blue',
    },
    {
        value: 'recording',
        title: '1-minute recording',
        description: 'Voice recordings captured elsewhere and uploaded into the workspace.',
        icon: 'R',
        iconClass: 'profile-icon-green',
    },
    {
        value: 'text',
        title: '200-character sentence',
        description: 'One compact idea turned directly into content drafts.',
        icon: 'T',
        iconClass: 'profile-icon-purple',
    },
];

export default function EpisodesCreate({ auth, tones = [] }) {
    const { data, setData, post, processing, errors, progress, reset } = useForm({
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
            onSuccess: () => reset(),
        });
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <div className="grid gap-8 xl:grid-cols-[1.08fr_.92fr] xl:items-center">
                    <div>
                        <div className="app-badge mb-4">New source</div>
                        <h1 className="app-heading">Turn one short source into content.</h1>
                        <p className="app-subheading mt-5 max-w-2xl">
                            Upload a 1-minute video, audio clip, recording, or paste a sentence under
                            200 characters and let VoicePost AI create reusable content drafts.
                        </p>
                    </div>

                    <div className="app-card-soft p-6">
                        <div className="text-xs uppercase tracking-[0.18em] text-[rgb(var(--color-text-faint))]">
                            Included outputs
                        </div>
                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                            {[
                                ['Summary', 'Fast overview for review and approvals.'],
                                ['LinkedIn Post', 'Professional social copy from the same source.'],
                                ['X Post', 'Short-form draft for quick posting.'],
                                ['Workspace', 'Transcript plus generated content in one place.'],
                            ].map(([title, description], index) => (
                                <div key={title} className="profile-card">
                                    <div
                                        className={`profile-icon ${
                                            ['profile-icon-purple', 'profile-icon-blue', 'profile-icon-green', 'profile-icon-yellow'][index]
                                        } text-sm font-semibold text-[rgb(var(--color-text-strong))]`}
                                    >
                                        •
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
                    </div>
                </div>
            }
        >
            <Head title="Create Content" />

            <div className="grid gap-6 xl:grid-cols-[1.1fr_.9fr]">
                <div className="app-card p-6 sm:p-8">
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

                    <form onSubmit={submit} className="mt-7 space-y-7">
                        <div>
                            <label className="label-theme">Recording title</label>
                            <input
                                type="text"
                                value={data.title}
                                onChange={(e) => setData('title', e.target.value)}
                                className="input-theme"
                                placeholder="e.g. 3 lessons from one client call"
                            />
                            {errors.title && <p className="form-error">{errors.title}</p>}
                        </div>

                        <div>
                            <label className="label-theme">Voice and tone</label>
                            <select
                                value={data.tone}
                                onChange={(e) => setData('tone', e.target.value)}
                                className="select-theme"
                            >
                                {tones.map((tone) => (
                                    <option key={tone.value} value={tone.value}>
                                        {tone.label}
                                    </option>
                                ))}
                            </select>
                            {errors.tone && <p className="form-error">{errors.tone}</p>}
                        </div>

                        {isTextSource ? (
                            <div>
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
                                    placeholder="Paste one strong idea under 200 characters."
                                />
                                {errors.source_text && <p className="form-error">{errors.source_text}</p>}
                            </div>
                        ) : (
                            <div>
                                <label className="label-theme">
                                    {data.source_type === 'video' ? 'Video file' : 'Source file'}
                                </label>
                                <div className="upload-zone">
                                    <input
                                        type="file"
                                        accept="audio/*,video/mp4,video/quicktime,video/webm"
                                        onChange={(e) => setData('source_file', e.target.files[0] || null)}
                                        className="block w-full text-sm text-[rgb(var(--color-text-muted))] file:mr-4 file:rounded-full file:border-0 file:bg-[rgb(var(--color-primary))] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-[rgb(var(--color-primary-hover))]"
                                    />
                                    <div className="mt-4 max-w-xl text-sm leading-6 text-[rgb(var(--color-text-muted))]">
                                        Supported formats: MP3, WAV, M4A, MP4, MOV, WebM. Keep uploads
                                        under 5 MB and close to one minute for the current workflow.
                                    </div>
                                </div>
                                {fileError && <p className="form-error">{fileError}</p>}
                            </div>
                        )}

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

                        <div className="app-divider pt-6">
                            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                                <button type="button" onClick={() => window.history.back()} className="btn-outline">
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="btn-primary disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {processing ? 'Processing...' : 'Create content'}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>

                <div className="space-y-6">
                    <div className="app-card p-6">
                        <h2 className="app-section-title">Source limits</h2>
                        <div className="mt-5 space-y-3">
                            {[
                                'Video, audio, and recordings should stay around one minute.',
                                'Text mode is limited to 200 characters.',
                                'Shorter, more focused inputs produce cleaner social drafts.',
                            ].map((item) => (
                                <div key={item} className="rounded-[18px] border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface-soft))] px-4 py-3 text-sm leading-6 text-[rgb(var(--color-text-muted))]">
                                    {item}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="app-card p-6">
                        <h2 className="app-section-title">What happens next</h2>
                        <div className="mt-5 space-y-3">
                            {[
                                ['Source accepted', 'Your short file or sentence is stored in the workspace.'],
                                ['Transcript ready', 'File-based sources run through transcription automatically.'],
                                ['Content drafted', 'VoicePost AI generates the summary and social outputs.'],
                            ].map(([title, description], index) => (
                                <div key={title} className="profile-card">
                                    <div
                                        className={`profile-icon ${
                                            ['profile-icon-blue', 'profile-icon-purple', 'profile-icon-green'][index]
                                        } text-sm font-semibold text-[rgb(var(--color-text-strong))]`}
                                    >
                                        {index + 1}
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
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
