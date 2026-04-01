import AppLayout from '@/Layouts/AppLayout';
import { Head, Link } from '@inertiajs/react';

export default function EpisodesIndex({ episodes }) {
    return (
        <AppLayout>
            <Head title="Episodes" />

            <div className="mx-auto max-w-6xl space-y-6 p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold text-gray-900">Episodes</h1>
                        <p className="text-sm text-gray-500">All uploaded audio files</p>
                    </div>

                    <Link
                        href={route('episodes.create')}
                        className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white"
                    >
                        Upload Audio
                    </Link>
                </div>

                <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                    {episodes.data.length === 0 ? (
                        <div className="p-6 text-sm text-gray-500">No episodes found.</div>
                    ) : (
                        episodes.data.map((episode) => (
                            <div
                                key={episode.id}
                                className="flex items-center justify-between border-b border-gray-100 p-4 last:border-b-0"
                            >
                                <div>
                                    <div className="font-medium text-gray-900">{episode.title}</div>
                                    <div className="text-sm text-gray-500">
                                        {episode.status} · {episode.tone} · {episode.original_file_name}
                                    </div>
                                </div>

                                <Link
                                    href={route('episodes.show', episode.id)}
                                    className="text-sm font-medium text-blue-600 hover:text-blue-700"
                                >
                                    View
                                </Link>
                            </div>
                        ))
                    )}
                </div>

                {episodes.links && episodes.links.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                        {episodes.links.map((link, index) => (
                            <Link
                                key={`${link.label}-${index}`}
                                href={link.url || '#'}
                                preserveScroll
                                className={`rounded border px-3 py-1 text-sm ${
                                    link.active
                                        ? 'border-black bg-black text-white'
                                        : 'border-gray-300 bg-white text-gray-700'
                                } ${!link.url ? 'pointer-events-none opacity-50' : ''}`}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                            />
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}