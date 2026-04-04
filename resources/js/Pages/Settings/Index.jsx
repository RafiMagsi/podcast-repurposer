import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, usePage } from '@inertiajs/react';

export default function SettingsIndex({ auth, settings, billing, canManageSystemSettings = false }) {
    const { flash } = usePage().props;
    const configuredLabels = {
        openai_api_key: settings.has_openai_api_key,
        claude_api_key: settings.has_claude_api_key,
        aws_access_key_id: settings.has_aws_access_key_id,
        aws_secret_access_key: settings.has_aws_secret_access_key,
        stripe_secret_key: settings.has_stripe_secret_key,
        stripe_publishable_key: settings.has_stripe_publishable_key,
        stripe_webhook_secret: settings.has_stripe_webhook_secret,
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
        stripe_secret_key: settings.stripe_secret_key || '',
        stripe_publishable_key: settings.stripe_publishable_key || '',
        stripe_webhook_secret: settings.stripe_webhook_secret || '',
        stripe_package_name: settings.stripe_package_name || '',
        stripe_package_runs: settings.stripe_package_runs || '100',
        stripe_package_price_usd: settings.stripe_package_price_usd || '10',
        stripe_package_price_cents: settings.stripe_package_price_cents || '1000',
        stripe_currency: settings.stripe_currency || 'usd',
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
                        <div className="app-badge mb-4">
                            {canManageSystemSettings ? 'Project configuration' : 'Account billing'}
                        </div>
                        <h1 className="app-heading">
                            {canManageSystemSettings
                                ? 'Manage the shared project settings used across every workspace.'
                                : 'Review your billing activity and current run balance.'}
                        </h1>
                        <p className="app-subheading mt-5 max-w-2xl">
                            {canManageSystemSettings
                                ? 'AI providers, storage, and Stripe are configured once at the project level by admins. All users use the same active project settings right now.'
                                : 'System-level provider, Stripe, and storage settings are restricted to admin accounts.'}
                        </p>
                    </div>

                    <div className="app-card-soft p-6">
                        <div className="text-xs uppercase tracking-[0.18em] text-[rgb(var(--color-text-faint))]">
                            {canManageSystemSettings ? 'Connected systems' : 'Billing summary'}
                        </div>
                        <div className="mt-4 space-y-3">
                            {(canManageSystemSettings
                                ? [
                                    ['Transcription', 'OpenAI / Whisper'],
                                    ['Generation', 'Claude content prompts'],
                                    ['Storage', 'Amazon S3 or compatible bucket'],
                                ]
                                : [
                                    ['Current quota', `${billing.run_limit} runs available`],
                                    ['Latest pack', billing.plan_price_usd > 0 ? `$${billing.plan_price_usd}` : 'No paid pack yet'],
                                    ['Starter plan', `${billing.package_runs} runs for $${billing.package_price_usd}`],
                                ]).map(([label, value], index) => (
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
                {canManageSystemSettings ? (
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
                ) : null}

                {canManageSystemSettings ? (
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
                ) : null}

                {canManageSystemSettings ? (
                <div className="app-card p-6 sm:p-8">
                    <div>
                        <h2 className="app-section-title">Stripe</h2>
                        <p className="app-muted mt-2">
                            Payment gateway credentials and package values used for hosted checkout.
                        </p>
                    </div>

                    <div className="mt-6 space-y-6">
                        <div>
                            <label className="label-theme">Stripe secret key</label>
                            <input
                                type="password"
                                value={data.stripe_secret_key}
                                onChange={(e) => setData('stripe_secret_key', e.target.value)}
                                className="input-theme"
                                placeholder={configuredLabels.stripe_secret_key ? 'Saved on server. Enter a new key to replace it.' : 'Enter Stripe secret key'}
                            />
                            {configuredLabels.stripe_secret_key ? (
                                <p className="mt-2 text-sm text-[rgb(var(--color-text-muted))]">Existing key is stored server-side and hidden from the browser.</p>
                            ) : null}
                            {errors.stripe_secret_key && <p className="form-error">{errors.stripe_secret_key}</p>}
                        </div>

                        <div>
                            <label className="label-theme">Stripe publishable key</label>
                            <input
                                type="password"
                                value={data.stripe_publishable_key}
                                onChange={(e) => setData('stripe_publishable_key', e.target.value)}
                                className="input-theme"
                                placeholder={configuredLabels.stripe_publishable_key ? 'Saved on server. Enter a new key to replace it.' : 'Enter Stripe publishable key'}
                            />
                            {configuredLabels.stripe_publishable_key ? (
                                <p className="mt-2 text-sm text-[rgb(var(--color-text-muted))]">Existing key is stored server-side and hidden from the browser.</p>
                            ) : null}
                            {errors.stripe_publishable_key && <p className="form-error">{errors.stripe_publishable_key}</p>}
                        </div>

                        <div>
                            <label className="label-theme">Stripe webhook secret</label>
                            <input
                                type="password"
                                value={data.stripe_webhook_secret}
                                onChange={(e) => setData('stripe_webhook_secret', e.target.value)}
                                className="input-theme"
                                placeholder={configuredLabels.stripe_webhook_secret ? 'Saved on server. Enter a new key to replace it.' : 'Enter Stripe webhook secret'}
                            />
                            {configuredLabels.stripe_webhook_secret ? (
                                <p className="mt-2 text-sm text-[rgb(var(--color-text-muted))]">Existing key is stored server-side and hidden from the browser.</p>
                            ) : null}
                            {errors.stripe_webhook_secret && <p className="form-error">{errors.stripe_webhook_secret}</p>}
                        </div>

                        <div className="grid gap-6 sm:grid-cols-2">
                            <div>
                                <label className="label-theme">Package name</label>
                                <input
                                    type="text"
                                    value={data.stripe_package_name}
                                    onChange={(e) => setData('stripe_package_name', e.target.value)}
                                    className="input-theme"
                                />
                                {errors.stripe_package_name && <p className="form-error">{errors.stripe_package_name}</p>}
                            </div>

                            <div>
                                <label className="label-theme">Currency</label>
                                <input
                                    type="text"
                                    value={data.stripe_currency}
                                    onChange={(e) => setData('stripe_currency', e.target.value)}
                                    className="input-theme"
                                />
                                {errors.stripe_currency && <p className="form-error">{errors.stripe_currency}</p>}
                            </div>
                        </div>

                        <div className="grid gap-6 sm:grid-cols-3">
                            <div>
                                <label className="label-theme">Package runs</label>
                                <input
                                    type="number"
                                    min="1"
                                    value={data.stripe_package_runs}
                                    onChange={(e) => setData('stripe_package_runs', e.target.value)}
                                    className="input-theme"
                                />
                                {errors.stripe_package_runs && <p className="form-error">{errors.stripe_package_runs}</p>}
                            </div>
                            <div>
                                <label className="label-theme">Price USD</label>
                                <input
                                    type="number"
                                    min="1"
                                    value={data.stripe_package_price_usd}
                                    onChange={(e) => setData('stripe_package_price_usd', e.target.value)}
                                    className="input-theme"
                                />
                                {errors.stripe_package_price_usd && <p className="form-error">{errors.stripe_package_price_usd}</p>}
                            </div>
                            <div>
                                <label className="label-theme">Price cents</label>
                                <input
                                    type="number"
                                    min="1"
                                    value={data.stripe_package_price_cents}
                                    onChange={(e) => setData('stripe_package_price_cents', e.target.value)}
                                    className="input-theme"
                                />
                                {errors.stripe_package_price_cents && <p className="form-error">{errors.stripe_package_price_cents}</p>}
                            </div>
                        </div>
                    </div>
                </div>
                ) : null}

                <div className="app-card p-6 sm:p-8">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                            <h2 className="app-section-title">Payment information</h2>
                            <p className="app-muted mt-2">
                                Buy runs before starting AI processing. Stripe checkout is used for payment.
                            </p>
                        </div>
                        <a href={route('billing.page')} className="btn-primary">
                            Buy {billing.package_runs} Runs
                        </a>
                    </div>

                    <div className="mt-6 grid gap-4 sm:grid-cols-3">
                        <div className="note-card">
                            <div className="text-xs uppercase tracking-[0.18em] text-[rgb(var(--color-text-faint))]">
                                Current quota
                            </div>
                            <div className="mt-2 text-lg font-semibold text-[rgb(var(--color-text-strong))]">
                                {billing.run_limit} runs
                            </div>
                        </div>
                        <div className="note-card">
                            <div className="text-xs uppercase tracking-[0.18em] text-[rgb(var(--color-text-faint))]">
                                Current pack value
                            </div>
                            <div className="mt-2 text-lg font-semibold text-[rgb(var(--color-text-strong))]">
                                ${billing.package_price_usd}
                            </div>
                        </div>
                        <div className="note-card">
                            <div className="text-xs uppercase tracking-[0.18em] text-[rgb(var(--color-text-faint))]">
                                Last paid price
                            </div>
                            <div className="mt-2 text-lg font-semibold text-[rgb(var(--color-text-strong))]">
                                ${billing.plan_price_usd}
                            </div>
                        </div>
                    </div>

                    <div className="mt-6">
                        <h3 className="text-sm font-semibold text-[rgb(var(--color-text-strong))]">Recent purchases</h3>
                        <div className="mt-3 space-y-3">
                            {billing.recent_purchases.length > 0 ? (
                                billing.recent_purchases.map((purchase) => (
                                    <div key={purchase.id} className="note-card">
                                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                            <div>
                                                <div className="text-sm font-semibold text-[rgb(var(--color-text-strong))]">
                                                    {purchase.runs_purchased} runs · {(purchase.amount_cents / 100).toFixed(2)} {purchase.currency}
                                                </div>
                                                <div className="mt-1 text-sm text-[rgb(var(--color-text-muted))]">
                                                    {purchase.fulfilled_at ? `Fulfilled ${purchase.fulfilled_at}` : `Created ${purchase.created_at}`}
                                                </div>
                                            </div>
                                            <div className="pill-compact">
                                                {purchase.status}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="note-card-muted">
                                    No purchases yet. Buy a run pack before creating AI content.
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {canManageSystemSettings ? (
                <div className="xl:col-span-2">
                    <div className="flex justify-end">
                        <button type="submit" disabled={processing} className="btn-primary">
                            {processing ? 'Saving...' : 'Save settings'}
                        </button>
                    </div>
                </div>
                ) : null}
            </form>
        </AuthenticatedLayout>
    );
}
