import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, usePage } from '@inertiajs/react';

export default function SettingsIndex({ auth, settings }) {
    const { flash } = usePage().props;

    const { data, setData, post, processing, errors } = useForm({
        openai_api_key: settings.openai_api_key || '',
        claude_api_key: settings.claude_api_key || '',
        aws_access_key_id: settings.aws_access_key_id || '',
        aws_secret_access_key: settings.aws_secret_access_key || '',
        aws_default_region: settings.aws_default_region || '',
        aws_bucket: settings.aws_bucket || '',
        aws_url: settings.aws_url || '',
        aws_endpoint: settings.aws_endpoint || '',
        aws_use_path_style_endpoint: settings.aws_use_path_style_endpoint || 'false',
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
                    <h1 className="app-heading">Manage credentials</h1>
                    <p className="app-subheading mt-2 max-w-2xl">
                        Save API and storage credentials securely in the database.
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
                <form onSubmit={submit} className="space-y-8">
                    <div className="space-y-6">
                        <div>
                            <h2 className="app-section-title">AI Providers</h2>
                            <p className="app-muted mt-1">Keys for transcription and content generation.</p>
                        </div>

                        <div>
                            <label className="label-theme">OpenAI API Key</label>
                            <input
                                type="password"
                                value={data.openai_api_key}
                                onChange={(e) => setData('openai_api_key', e.target.value)}
                                className="input-theme"
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
                            />
                            {errors.claude_api_key && <p className="form-error">{errors.claude_api_key}</p>}
                        </div>
                    </div>

                    <div className="app-divider pt-8 space-y-6">
                        <div>
                            <h2 className="app-section-title">Amazon S3</h2>
                            <p className="app-muted mt-1">Storage config for uploaded audio files.</p>
                        </div>

                        <div>
                            <label className="label-theme">AWS Access Key ID</label>
                            <input
                                type="password"
                                value={data.aws_access_key_id}
                                onChange={(e) => setData('aws_access_key_id', e.target.value)}
                                className="input-theme"
                            />
                            {errors.aws_access_key_id && <p className="form-error">{errors.aws_access_key_id}</p>}
                        </div>

                        <div>
                            <label className="label-theme">AWS Secret Access Key</label>
                            <input
                                type="password"
                                value={data.aws_secret_access_key}
                                onChange={(e) => setData('aws_secret_access_key', e.target.value)}
                                className="input-theme"
                            />
                            {errors.aws_secret_access_key && <p className="form-error">{errors.aws_secret_access_key}</p>}
                        </div>

                        <div>
                            <label className="label-theme">AWS Region</label>
                            <input
                                type="text"
                                value={data.aws_default_region}
                                onChange={(e) => setData('aws_default_region', e.target.value)}
                                className="input-theme"
                                placeholder="eu-central-1"
                            />
                            {errors.aws_default_region && <p className="form-error">{errors.aws_default_region}</p>}
                        </div>

                        <div>
                            <label className="label-theme">Bucket</label>
                            <input
                                type="text"
                                value={data.aws_bucket}
                                onChange={(e) => setData('aws_bucket', e.target.value)}
                                className="input-theme"
                            />
                            {errors.aws_bucket && <p className="form-error">{errors.aws_bucket}</p>}
                        </div>

                        <div>
                            <label className="label-theme">Custom URL (optional)</label>
                            <input
                                type="text"
                                value={data.aws_url}
                                onChange={(e) => setData('aws_url', e.target.value)}
                                className="input-theme"
                                placeholder="https://cdn.example.com"
                            />
                        </div>

                        <div>
                            <label className="label-theme">Endpoint (optional)</label>
                            <input
                                type="text"
                                value={data.aws_endpoint}
                                onChange={(e) => setData('aws_endpoint', e.target.value)}
                                className="input-theme"
                                placeholder="For S3-compatible providers only"
                            />
                        </div>

                        <div>
                            <label className="label-theme">Use Path Style Endpoint</label>
                            <select
                                value={data.aws_use_path_style_endpoint}
                                onChange={(e) => setData('aws_use_path_style_endpoint', e.target.value)}
                                className="select-theme"
                            >
                                <option value="false">False</option>
                                <option value="true">True</option>
                            </select>
                        </div>
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