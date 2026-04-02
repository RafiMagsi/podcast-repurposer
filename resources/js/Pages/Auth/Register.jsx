import GuestLayout from '@/Layouts/GuestLayout';
import InputError from '@/Components/InputError';
import { Head, Link, useForm } from '@inertiajs/react';

export default function Register() {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
    });

    const submit = (e) => {
        e.preventDefault();

        post(route('register'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <GuestLayout>
            <Head title="Register" />

            <div className="auth-card">
                <div className="mb-8">
                    <div className="app-badge mb-4">Get started</div>
                    <h1 className="text-3xl font-semibold text-[rgb(var(--color-text-strong))]">Create your account</h1>
                    <p className="mt-2 text-sm text-[rgb(var(--color-text-muted))]">
                        Start turning 1-minute voice notes into summaries, posts, and drafts with VoicePost AI.
                    </p>
                </div>

                <form onSubmit={submit} className="space-y-5">
                    <div>
                        <label className="label-theme">Name</label>
                        <input
                            type="text"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            className="input-theme"
                            autoComplete="name"
                        />
                        <InputError message={errors.name} className="form-error" />
                    </div>

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
                            autoComplete="new-password"
                        />
                        <InputError message={errors.password} className="form-error" />
                    </div>

                    <div>
                        <label className="label-theme">Confirm Password</label>
                        <input
                            type="password"
                            value={data.password_confirmation}
                            onChange={(e) => setData('password_confirmation', e.target.value)}
                            className="input-theme"
                            autoComplete="new-password"
                        />
                        <InputError message={errors.password_confirmation} className="form-error" />
                    </div>

                    <button
                        type="submit"
                        disabled={processing}
                        className="btn-primary w-full disabled:opacity-60"
                    >
                        {processing ? 'Creating account...' : 'Create account'}
                    </button>

                    <div className="text-center text-sm text-[rgb(var(--color-text-muted))]">
                        Already have an account?{' '}
                        <Link href={route('login')} className="text-[rgb(var(--color-text-strong))] hover:underline">
                            Sign in
                        </Link>
                    </div>
                </form>
            </div>
        </GuestLayout>
    );
}
