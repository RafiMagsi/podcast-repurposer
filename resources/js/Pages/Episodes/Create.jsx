import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm } from '@inertiajs/react';

export default function EpisodesCreate({ auth, tones = [] }) {
    const { data, setData, post, processing, errors, progress } = useForm({
        title: '',
        tone: 'professional',
        audio: null,
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('episodes.store'));
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <div className="grid gap-8 xl:grid-cols-[1.08fr_.92fr] xl:items-center">
                    <div>
                        <div className="app-badge mb-4">New recording</div>
                        <h1 className="app-heading">Upload once and leave with a cleaner content pack.</h1>
                        <p className="app-subheading mt-5 max-w-2xl">
                            The screenshots lean toward calm intake flows: light surfaces, strong labels,
                            and just enough guidance before a user commits to processing.
                        </p>
                    </div>

                    <div className="app-card-soft p-6">
                        <div className="text-xs uppercase tracking-[0.18em] text-[rgb(var(--color-text-faint))]">
                            Included outputs
                        </div>
                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                            {[
                                ['Summary', 'Fast overview for review and approvals.'],
                                ['Blog Draft', 'Long-form starting point from the transcript.'],
                                ['LinkedIn Post', 'Professional social copy from the same source.'],
                                ['X Thread', 'Short-form hooks and talking points.'],
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
            <Head title="Upload Audio" />

            <div className="grid gap-6 xl:grid-cols-[1.05fr_.95fr]">
                <div className="app-card p-6 sm:p-8">
                    <form onSubmit={submit} className="space-y-7">
                        <div>
                            <label className="label-theme">Episode title</label>
                            <input
                                type="text"
                                value={data.title}
                                onChange={(e) => setData('title', e.target.value)}
                                className="input-theme"
                                placeholder="e.g. Building an AI workflow that actually saves time"
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

                        <div>
                            <label className="label-theme">Source audio</label>
                            <div className="upload-zone">
                                <input
                                    type="file"
                                    accept=".mp3,.wav,.m4a,audio/*"
                                    onChange={(e) => setData('audio', e.target.files[0] || null)}
                                    className="block w-full text-sm text-[rgb(var(--color-text-muted))] file:mr-4 file:rounded-full file:border-0 file:bg-[rgb(var(--color-primary))] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-[rgb(var(--color-primary-hover))]"
                                />
                                <div className="mt-4 max-w-xl text-sm leading-6 text-[rgb(var(--color-text-muted))]">
                                    Supported formats: MP3, WAV, M4A. Keep files under 5 MB and under one
                                    minute for the current MVP flow.
                                </div>
                            </div>
                            {errors.audio && <p className="form-error">{errors.audio}</p>}
                        </div>

                        {progress && (
                            <div className="app-card-soft p-4">
                                <div className="mb-2 flex items-center justify-between text-sm text-[rgb(var(--color-text-muted))]">
                                    <span>Uploading file</span>
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
                                    {processing ? 'Uploading...' : 'Upload and process'}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>

                <div className="space-y-6">
                    <div className="app-card p-6">
                        <h2 className="app-section-title">Before you upload</h2>
                        <div className="mt-5 space-y-3">
                            {[
                                'Use a specific title so the output pack is easier to scan later.',
                                'Pick a tone that matches the first place the content will be published.',
                                'Shorter files feel faster and are easier to validate while iterating.',
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
                                ['Upload accepted', 'Your source is stored and queued for processing.'],
                                ['Transcript generated', 'Whisper creates the working text layer.'],
                                ['Content drafted', 'VoicePost AI produces reusable written assets.'],
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
