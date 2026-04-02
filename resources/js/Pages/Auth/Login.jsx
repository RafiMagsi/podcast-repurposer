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

            <div className="auth-shell">
                <div className="auth-card">
                    <div className="mb-8">
                        <div className="app-badge mb-4">Welcome back</div>
                        <h1 className="text-3xl font-semibold text-white">Sign in</h1>
                        <p className="mt-2 text-sm text-slate-400">
                            Access your VoicePost AI workspace.
                        </p>
                    </div>

                    {status && (
                        <div className="mb-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
                            {status}
                        </div>
                    )}

                    <form onSubmit={submit} className="space-y-5">
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

                        <label className="flex items-center gap-3 text-sm text-slate-300">
                            <Checkbox
                                checked={data.remember}
                                onChange={(e) => setData('remember', e.target.checked)}
                            />
                            Remember me
                        </label>

                        <button
                            type="submit"
                            disabled={processing}
                            className="btn-primary w-full disabled:opacity-60"
                        >
                            {processing ? 'Signing in...' : 'Sign in'}
                        </button>

                        <div className="flex items-center justify-between text-sm">
                            {canResetPassword ? (
                                <Link
                                    href={route('password.request')}
                                    className="text-slate-400 hover:text-white"
                                >
                                    Forgot password?
                                </Link>
                            ) : (
                                <span />
                            )}

                            <Link
                                href={route('register')}
                                className="text-slate-400 hover:text-white"
                            >
                                Create account
                            </Link>
                        </div>
                    </form>
                </div>
            </div>
        </GuestLayout>
    );
}
