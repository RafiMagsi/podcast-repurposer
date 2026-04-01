import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, usePage } from '@inertiajs/react';

export default function SettingsIndex({ auth, settings }) {
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
        <AuthenticatedLayout
            user={auth.user}
            header={
                <div>
                    <div className="app-badge mb-3">Provider Configuration</div>
                    <h1 className="app-heading">Manage AI credentials</h1>
                    <p className="app-subheading mt-2 max-w-2xl">
                        Save provider keys securely in the database. These will be used by the
                        transcription and content-generation services.
                    </p>
                </div>
            }
        >
            <Head title="Settings" />

            {flash?.success && (
                <div className="app-card border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-300">
                    {flash.success}
                </div>
            )}

            <div className="app-card p-6">
                <form onSubmit={submit} className="space-y-6">
                    <div>
                        <label className="label-theme">OpenAI API Key</label>
                        <input
                            type="password"
                            value={data.openai_api_key}
                            onChange={(e) => setData('openai_api_key', e.target.value)}
                            className="input-theme"
                            placeholder="sk-..."
                        />
                        {errors.openai_api_key && <p className="form-error">{errors.openai_api_key}</p>}
                    </div>

                    <div>
                        <label className="label-theme">Claude API Key</label>
                        <input
                            type="password"
                            value={data.claude_api_key}
                            onChange={(e) => setData('claude_api_key', e.target.value)}
                            className="input-theme"
                            placeholder="sk-ant-..."
                        />
                        {errors.claude_api_key && <p className="form-error">{errors.claude_api_key}</p>}
                    </div>

                    <div className="flex justify-end">
                        <button type="submit" disabled={processing} className="btn-primary">
                            {processing ? 'Saving...' : 'Save Settings'}
                        </button>
                    </div>
                </form>
            </div>
        </AuthenticatedLayout>
    );
}