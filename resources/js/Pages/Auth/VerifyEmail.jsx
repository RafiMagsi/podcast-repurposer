import PrimaryButton from '@/Components/PrimaryButton';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';

export default function VerifyEmail({ status }) {
    const { post, processing } = useForm({});

    const submit = (e) => {
        e.preventDefault();

        post(route('verification.send'));
    };

    return (
        <GuestLayout>
            <Head title="Email Verification" />

            <div className="auth-card">
                <div className="app-badge mb-4">Verification</div>
                <h1 className="text-3xl font-semibold text-[rgb(var(--color-text-strong))]">Verify your email</h1>
                <div className="mt-3 text-sm leading-7 text-[rgb(var(--color-text-muted))]">
                    Confirm your email address before entering the workspace. If the message did
                    not arrive, send another verification link.
                </div>

                {status === 'verification-link-sent' && (
                    <div className="mt-4 rounded-2xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-success-bg))] px-4 py-3 text-sm font-medium text-[rgb(var(--color-success-text))]">
                        A new verification link has been sent to your email address.
                    </div>
                )}

                <form onSubmit={submit} className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <PrimaryButton disabled={processing}>
                        Resend verification email
                    </PrimaryButton>

                    <Link
                        href={route('logout')}
                        method="post"
                        as="button"
                        className="text-sm text-[rgb(var(--color-text-muted))] underline underline-offset-4 hover:text-[rgb(var(--color-text-strong))]"
                    >
                        Log out
                    </Link>
                </form>
            </div>
        </GuestLayout>
    );
}
