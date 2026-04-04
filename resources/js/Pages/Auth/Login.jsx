import GuestLayout from '@/Layouts/GuestLayout';
import InputError from '@/Components/InputError';
import Checkbox from '@/Components/Checkbox';
import { Head, Link, useForm } from '@inertiajs/react';

export default function Login({ status, canResetPassword }) {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('login'));
    };

    return (
        <GuestLayout>
            <Head title="Login" />

            <div className="auth-card">
                <div className="mb-6">
                    <div className="app-badge-neutral mb-3">Welcome back</div>
                    <h1 className="text-3xl font-semibold text-[rgb(var(--color-text-strong))]">Sign in</h1>
                    <p className="mt-2 text-sm text-[rgb(var(--color-text-muted))]">
                        Open your VoicePost AI workspace for short-source transcription and post-ready content.
                    </p>
                </div>

                {status && (
                    <div className="mb-4 rounded-2xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-success-bg))] px-4 py-3 text-sm text-[rgb(var(--color-success-text))]">
                        {status}
                    </div>
                )}

                <form onSubmit={submit} className="space-y-4">
                    <div>
                        <label className="label-theme">Email</label>
                        <input
                            type="email"
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                            className="input-theme"
                            autoComplete="username"
                        />
                        <InputError message={errors.email} className="form-error" />
                    </div>

                    <div>
                        <label className="label-theme">Password</label>
                        <input
                            type="password"
                            value={data.password}
                            onChange={(e) => setData('password', e.target.value)}
                            className="input-theme"
                            autoComplete="current-password"
                        />
                        <InputError message={errors.password} className="form-error" />
                    </div>

                    <label className="flex items-center gap-3 text-sm text-[rgb(var(--color-text-muted))]">
                        <Checkbox
                            checked={data.remember}
                            onChange={(e) => setData('remember', e.target.checked)}
                        />
                        Remember me
                    </label>

                    <div className="space-y-3 pt-1">
                        <button
                            type="submit"
                            disabled={processing}
                            className="btn-primary w-full disabled:opacity-60"
                        >
                            {processing ? 'Signing In...' : 'Sign In'}
                        </button>
                    </div>

                    <div className="flex items-center justify-between border-t border-[rgb(var(--color-border))] pt-4 text-sm">
                        {canResetPassword ? (
                            <Link
                                href={route('password.request')}
                                className="text-[rgb(var(--color-text-muted))] hover:text-[rgb(var(--color-text-strong))]"
                            >
                                Forgot password?
                            </Link>
                        ) : (
                            <span />
                        )}

                        <Link
                            href={route('register')}
                            className="text-[rgb(var(--color-text-muted))] hover:text-[rgb(var(--color-text-strong))]"
                        >
                            Create Account
                        </Link>
                    </div>
                </form>
            </div>
        </GuestLayout>
    );
}
