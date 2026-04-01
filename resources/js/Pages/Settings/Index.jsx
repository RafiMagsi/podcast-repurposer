import AppLayout from '@/Layouts/AppLayout';
import { Head, useForm, usePage } from '@inertiajs/react';

export default function SettingsIndex({ settings }) {
    const { flash } = usePage().props;

    const { data, setData, post, processing, errors } = useForm({
        openai_api_key: settings.openai_api_key || '',
        claude_api_key: settings.claude_api_key || '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('settings.update'));
    };

    return (
        <AppLayout>
            <Head title="Settings" />

            <div className="mx-auto max-w-3xl space-y-6 p-6">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>
                    <p className="text-sm text-gray-500">
                        Save API credentials for transcription and content generation.
                    </p>
                </div>

                {flash?.success && (
                    <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                        {flash.success}
                    </div>
                )}

                <div className="rounded-xl border border-gray-200 bg-white p-6">
                    <form onSubmit={submit} className="space-y-6">
                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">
                                OpenAI API Key
                            </label>
                            <input
                                type="password"
                                value={data.openai_api_key}
                                onChange={(e) => setData('openai_api_key', e.target.value)}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2"
                            />
                            {errors.openai_api_key && (
                                <p className="mt-1 text-sm text-red-600">{errors.openai_api_key}</p>
                            )}
                        </div>

                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">
                                Claude API Key
                            </label>
                            <input
                                type="password"
                                value={data.claude_api_key}
                                onChange={(e) => setData('claude_api_key', e.target.value)}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2"
                            />
                            {errors.claude_api_key && (
                                <p className="mt-1 text-sm text-red-600">{errors.claude_api_key}</p>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={processing}
                            className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                        >
                            {processing ? 'Saving...' : 'Save Settings'}
                        </button>
                    </form>
                </div>
            </div>
        </AppLayout>
    );
}