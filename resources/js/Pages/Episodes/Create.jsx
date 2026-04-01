import AppLayout from '@/Layouts/AppLayout';
import { Head, useForm } from '@inertiajs/react';

export default function EpisodesCreate({ tones = [] }) {
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
        <AppLayout>
            <Head title="Upload Audio" />

            <div className="mx-auto max-w-3xl p-6">
                <div className="rounded-xl border border-gray-200 bg-white p-6">
                    <h1 className="mb-6 text-2xl font-semibold text-gray-900">Upload Audio</h1>

                    <form onSubmit={submit} className="space-y-6">
                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">
                                Title
                            </label>
                            <input
                                type="text"
                                value={data.title}
                                onChange={(e) => setData('title', e.target.value)}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-black focus:outline-none"
                                placeholder="Episode title"
                            />
                            {errors.title && (
                                <p className="mt-1 text-sm text-red-600">{errors.title}</p>
                            )}
                        </div>

                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">
                                Tone
                            </label>
                            <select
                                value={data.tone}
                                onChange={(e) => setData('tone', e.target.value)}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-black focus:outline-none"
                            >
                                {tones.map((tone) => (
                                    <option key={tone.value} value={tone.value}>
                                        {tone.label}
                                    </option>
                                ))}
                            </select>
                            {errors.tone && (
                                <p className="mt-1 text-sm text-red-600">{errors.tone}</p>
                            )}
                        </div>

                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">
                                Audio File
                            </label>
                            <input
                                type="file"
                                accept=".mp3,.wav,.m4a,audio/*"
                                onChange={(e) => setData('audio', e.target.files[0] || null)}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2"
                            />
                            <p className="mt-1 text-xs text-gray-500">
                                Supported: MP3, WAV, M4A. Max 50MB.
                            </p>
                            {errors.audio && (
                                <p className="mt-1 text-sm text-red-600">{errors.audio}</p>
                            )}
                        </div>

                        {progress && (
                            <div>
                                <div className="mb-1 text-xs text-gray-500">
                                    Uploading: {progress.percentage}%
                                </div>
                                <div className="h-2 w-full overflow-hidden rounded bg-gray-200">
                                    <div
                                        className="h-full bg-black"
                                        style={{ width: `${progress.percentage}%` }}
                                    />
                                </div>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={processing}
                            className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                        >
                            {processing ? 'Uploading...' : 'Upload'}
                        </button>
                    </form>
                </div>
            </div>
        </AppLayout>
    );
}