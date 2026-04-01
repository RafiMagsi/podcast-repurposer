import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, usePage } from '@inertiajs/react';

export default function Dashboard({ episodes = [], auth }) {
    const { flash } = usePage().props;

    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title="Dashboard" />

            <div className="mx-auto max-w-6xl space-y-6 p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
                        <p className="text-sm text-gray-500">Recent uploaded episodes</p>
                    </div>

                    <Link
                        href={route('episodes.create')}
                        className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white"
                    >
                        Upload Audio
                    </Link>
                </div>

                {flash?.success && (
                    <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                        {flash.success}
                    </div>
                )}

                <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                    {episodes.length === 0 ? (
                        <div className="p-6 text-sm text-gray-500">No episodes yet.</div>
                    ) : (
                        episodes.map((episode) => (
                            <div
                                key={episode.id}
                                className="flex items-center justify-between border-b border-gray-100 p-4 last:border-b-0"
                            >
                                <div>
                                    <div className="font-medium text-gray-900">{episode.title}</div>
                                    <div className="text-sm text-gray-500">
                                        {episode.status} · {episode.tone} · {episode.created_at}
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
            </div>
        </AuthenticatedLayout>
    );
}