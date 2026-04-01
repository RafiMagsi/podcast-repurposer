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
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <div className="app-badge mb-3">New Episode</div>
                        <h1 className="app-heading">Upload podcast or spoken audio</h1>
                        <p className="app-subheading mt-2 max-w-2xl">
                            Upload a short voice note or audio clip under 1 minute. VoicePost AI will
                            turn it into a summary, a LinkedIn post, and an X post.
                        </p>
                    </div>
                </div>
            }
        >
            <Head title="Upload Audio" />

            <div className="app-card p-6 sm:p-8">
                <form onSubmit={submit} className="space-y-6">
                    <div>
                        <label className="label-theme">Episode Title</label>
                        <input
                            type="text"
                            value={data.title}
                            onChange={(e) => setData('title', e.target.value)}
                            className="input-theme"
                            placeholder="e.g. How AI is changing content workflows"
                        />
                        {errors.title && <p className="form-error">{errors.title}</p>}
                    </div>

                    <div>
                        <label className="label-theme">Tone</label>
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
                        <label className="label-theme">Audio File</label>

                        <div className="app-card-soft p-4">
                            <input
                                type="file"
                                accept=".mp3,.wav,.m4a,audio/*"
                                onChange={(e) => setData('audio', e.target.files[0] || null)}
                                className="block w-full text-sm text-slate-300 file:mr-4 file:rounded-xl file:border-0 file:bg-white/10 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-white/15"
                            />

                            <div className="mt-3 text-sm text-slate-400">
                                Supported formats: MP3, WAV, M4A · Maximum size: 5 MB · Keep recordings under 1 minute
                            </div>
                        </div>

                        {errors.audio && <p className="form-error">{errors.audio}</p>}
                    </div>

                    {progress && (
                        <div className="app-card-soft p-4">
                            <div className="mb-2 flex items-center justify-between text-sm text-slate-300">
                                <span>Uploading file</span>
                                <span>{progress.percentage}%</span>
                            </div>

                            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
                                <div
                                    className="h-full rounded-full bg-[linear-gradient(135deg,var(--color-primary),var(--color-primary-2))]"
                                    style={{ width: `${progress.percentage}%` }}
                                />
                            </div>
                        </div>
                    )}

                    <div className="app-divider pt-6">
                        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                            <button
                                type="button"
                                onClick={() => window.history.back()}
                                className="btn-secondary"
                            >
                                Cancel
                            </button>

                            <button
                                type="submit"
                                disabled={processing}
                                className="btn-primary disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {processing ? 'Uploading...' : 'Upload & Process'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </AuthenticatedLayout>
    );
}