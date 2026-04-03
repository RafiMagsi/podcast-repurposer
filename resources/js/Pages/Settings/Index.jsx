import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, usePage } from '@inertiajs/react';

export default function SettingsIndex({ auth, settings }) {
    const { flash } = usePage().props;
    const configuredLabels = {
        openai_api_key: settings.has_openai_api_key,
        claude_api_key: settings.has_claude_api_key,
        aws_access_key_id: settings.has_aws_access_key_id,
        aws_secret_access_key: settings.has_aws_secret_access_key,
    };

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
        bypass_openai_for_testing: settings.bypass_openai_for_testing || 'false',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('settings.update'));
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <div className="grid gap-8 xl:grid-cols-[1.05fr_.95fr] xl:items-center">
                    <div>
                        <div className="app-badge mb-4">Provider configuration</div>
                        <h1 className="app-heading">Keep the engine room clean, readable, and dependable.</h1>
                        <p className="app-subheading mt-5 max-w-2xl">
                            The screenshots use light surfaces and straightforward forms. This settings
                            view now matches that direction so sensitive credentials sit in calmer UI.
                        </p>
                    </div>

                    <div className="app-card-soft p-6">
                        <div className="text-xs uppercase tracking-[0.18em] text-[rgb(var(--color-text-faint))]">
                            Connected systems
                        </div>
                        <div className="mt-4 space-y-3">
                            {[
                                ['Transcription', 'OpenAI / Whisper'],
                                ['Generation', 'Claude content prompts'],
                                ['Storage', 'Amazon S3 or compatible bucket'],
                            ].map(([label, value], index) => (
                                <div key={label} className="profile-card">
                                    <div
                                        className={`profile-icon ${
                                            ['profile-icon-blue', 'profile-icon-purple', 'profile-icon-green'][index]
                                        } text-sm font-semibold text-[rgb(var(--color-text-strong))]`}
                                    >
                                        •
                                    </div>
                                    <div className="flex-1">
                                        <div className="text-sm text-[rgb(var(--color-text-muted))]">{label}</div>
                                        <div className="text-sm font-semibold text-[rgb(var(--color-text-strong))]">
                                            {value}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            }
        >
            <Head title="Settings" />

            {flash?.success && (
                <div className="app-card bg-[rgb(var(--color-success-bg))] p-4 text-sm text-[rgb(var(--color-success-text))]">
                    {flash.success}
                </div>
            )}

            <form onSubmit={submit} className="grid gap-6 xl:grid-cols-[1fr_1fr]">
                <div className="app-card p-6 sm:p-8">
                    <div>
                        <h2 className="app-section-title">AI providers</h2>
                        <p className="app-muted mt-2">
                            Keys used for transcription and content generation.
                        </p>
                    </div>

                    <div className="mt-6 space-y-6">
                        <div>
                            <label className="label-theme">OpenAI API key</label>
                            <input
                                type="password"
                                value={data.openai_api_key}
                                onChange={(e) => setData('openai_api_key', e.target.value)}
                                className="input-theme"
                                placeholder={configuredLabels.openai_api_key ? 'Saved on server. Enter a new key to replace it.' : 'Enter OpenAI API key'}
                            />
                            {configuredLabels.openai_api_key ? (
                                <p className="mt-2 text-sm text-[rgb(var(--color-text-muted))]">Existing key is stored server-side and hidden from the browser.</p>
                            ) : null}
                            {errors.openai_api_key && <p className="form-error">{errors.openai_api_key}</p>}
                        </div>
                        <div className="rounded-[20px] border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface-soft))] p-4">
                            <div className="flex items-start justify-between gap-4">
                                <div className="min-w-0 flex-1">
                                    <label className="label-theme mb-0">Bypass OpenAI calls for testing</label>
                                    <p className="mt-1 text-sm leading-6 text-[rgb(var(--color-text-muted))]">
                                        When enabled, transcription and content generation will use mock test
                                        responses instead of calling the OpenAI APIs.
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    onClick={() =>
                                        setData(
                                            'bypass_openai_for_testing',
                                            data.bypass_openai_for_testing === 'true' ? 'false' : 'true'
                                        )
                                    }
                                    className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition ${
                                        data.bypass_openai_for_testing === 'true'
                                            ? 'bg-[rgb(var(--color-primary))]'
                                            : 'bg-[rgb(var(--color-border-strong))]'
                                    }`}
                                    aria-pressed={data.bypass_openai_for_testing === 'true'}
                                >
                                    <span
                                        className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${
                                            data.bypass_openai_for_testing === 'true' ? 'translate-x-6' : 'translate-x-1'
                                        }`}
                                    />
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="label-theme">Claude API key</label>
                            <input
                                type="password"
                                value={data.claude_api_key}
                                onChange={(e) => setData('claude_api_key', e.target.value)}
                                className="input-theme"
                                placeholder={configuredLabels.claude_api_key ? 'Saved on server. Enter a new key to replace it.' : 'Enter Claude API key'}
                            />
                            {configuredLabels.claude_api_key ? (
                                <p className="mt-2 text-sm text-[rgb(var(--color-text-muted))]">Existing key is stored server-side and hidden from the browser.</p>
                            ) : null}
                            {errors.claude_api_key && <p className="form-error">{errors.claude_api_key}</p>}
                        </div>
                    </div>
                </div>

                <div className="app-card p-6 sm:p-8">
                    <div>
                        <h2 className="app-section-title">Storage</h2>
                        <p className="app-muted mt-2">
                            Bucket and endpoint settings for uploaded source files.
                        </p>
                    </div>

                    <div className="mt-6 space-y-6">
                        <div>
                            <label className="label-theme">AWS access key ID</label>
                            <input
                                type="password"
                                value={data.aws_access_key_id}
                                onChange={(e) => setData('aws_access_key_id', e.target.value)}
                                className="input-theme"
                                placeholder={configuredLabels.aws_access_key_id ? 'Saved on server. Enter a new key to replace it.' : 'Enter AWS access key ID'}
                            />
                            {configuredLabels.aws_access_key_id ? (
                                <p className="mt-2 text-sm text-[rgb(var(--color-text-muted))]">Existing key is stored server-side and hidden from the browser.</p>
                            ) : null}
                            {errors.aws_access_key_id && <p className="form-error">{errors.aws_access_key_id}</p>}
                        </div>

                        <div>
                            <label className="label-theme">AWS secret access key</label>
                            <input
                                type="password"
                                value={data.aws_secret_access_key}
                                onChange={(e) => setData('aws_secret_access_key', e.target.value)}
                                className="input-theme"
                                placeholder={configuredLabels.aws_secret_access_key ? 'Saved on server. Enter a new key to replace it.' : 'Enter AWS secret access key'}
                            />
                            {configuredLabels.aws_secret_access_key ? (
                                <p className="mt-2 text-sm text-[rgb(var(--color-text-muted))]">Existing key is stored server-side and hidden from the browser.</p>
                            ) : null}
                            {errors.aws_secret_access_key && <p className="form-error">{errors.aws_secret_access_key}</p>}
                        </div>

                        <div className="grid gap-6 sm:grid-cols-2">
                            <div>
                                <label className="label-theme">AWS region</label>
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
                        </div>

                        <div>
                            <label className="label-theme">Custom URL</label>
                            <input
                                type="text"
                                value={data.aws_url}
                                onChange={(e) => setData('aws_url', e.target.value)}
                                className="input-theme"
                                placeholder="https://cdn.example.com"
                            />
                        </div>

                        <div>
                            <label className="label-theme">Endpoint</label>
                            <input
                                type="text"
                                value={data.aws_endpoint}
                                onChange={(e) => setData('aws_endpoint', e.target.value)}
                                className="input-theme"
                                placeholder="For S3-compatible providers only"
                            />
                        </div>

                        <div>
                            <label className="label-theme">Use path style endpoint</label>
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
                </div>

                <div className="xl:col-span-2">
                    <div className="flex justify-end">
                        <button type="submit" disabled={processing} className="btn-primary">
                            {processing ? 'Saving...' : 'Save settings'}
                        </button>
                    </div>
                </div>
            </form>
        </AuthenticatedLayout>
    );
}
