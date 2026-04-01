import AppLayout from '@/Layouts/AppLayout';
import { Head, usePage } from '@inertiajs/react';

function formatContentType(value) {
    return value
        .split('_')
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');
}

export default function EpisodesShow({ episode }) {
    const { flash } = usePage().props;

    return (
        <AppLayout>
            <Head title={episode.title} />

            <div className="mx-auto max-w-5xl space-y-6 p-6">
                {flash?.success && (
                    <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                        {flash.success}
                    </div>
                )}

                <div className="rounded-xl border border-gray-200 bg-white p-6">
                    <h1 className="text-2xl font-semibold text-gray-900">{episode.title}</h1>

                    <div className="mt-4 grid gap-3 text-sm text-gray-600 md:grid-cols-2">
                        <div>
                            <strong>Status:</strong> {episode.status}
                        </div>
                        <div>
                            <strong>Tone:</strong> {episode.tone}
                        </div>
                        <div>
                            <strong>Original file:</strong> {episode.original_file_name}
                        </div>
                        <div>
                            <strong>Size:</strong>{' '}
                            {(episode.file_size / 1024 / 1024).toFixed(2)} MB
                        </div>
                    </div>

                    {episode.error_message && (
                        <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                            {episode.error_message}
                        </div>
                    )}
                </div>

                <div className="rounded-xl border border-gray-200 bg-white p-6">
                    <h2 className="mb-3 text-lg font-semibold text-gray-900">Summary</h2>
                    <div className="whitespace-pre-wrap text-sm text-gray-700">
                        {episode.summary || 'Summary not generated yet.'}
                    </div>
                </div>

                <div className="rounded-xl border border-gray-200 bg-white p-6">
                    <h2 className="mb-3 text-lg font-semibold text-gray-900">Transcript</h2>
                    <div className="whitespace-pre-wrap text-sm text-gray-700">
                        {episode.transcript || 'Transcript not generated yet.'}
                    </div>
                </div>

                <div className="rounded-xl border border-gray-200 bg-white p-6">
                    <h2 className="mb-4 text-lg font-semibold text-gray-900">Generated Content</h2>

                    {episode.generated_contents.length === 0 ? (
                        <p className="text-sm text-gray-500">No generated content yet.</p>
                    ) : (
                        <div className="space-y-4">
                            {episode.generated_contents.map((content) => (
                                <div key={content.id} className="rounded-lg border border-gray-200 p-4">
                                    <h3 className="mb-2 font-semibold text-gray-900">
                                        {formatContentType(content.content_type)}
                                    </h3>
                                    <div className="whitespace-pre-wrap text-sm text-gray-700">
                                        {content.body}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}