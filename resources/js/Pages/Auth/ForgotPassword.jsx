import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, useForm } from '@inertiajs/react';

export default function ForgotPassword({ status }) {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
    });

    const submit = (e) => {
        e.preventDefault();

        post(route('password.email'));
    };

    return (
        <GuestLayout>
            <Head title="Forgot Password" />

            <div className="auth-card">
                <div className="app-badge mb-4">Recovery</div>
                <h1 className="text-3xl font-semibold text-[rgb(var(--color-text-strong))]">Reset your password</h1>
                <div className="mt-3 text-sm leading-7 text-[rgb(var(--color-text-muted))]">
                    Enter your email address and we will send you a secure reset link.
                </div>

                {status && (
                    <div className="mt-4 rounded-2xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-success-bg))] px-4 py-3 text-sm font-medium text-[rgb(var(--color-success-text))]">
                        {status}
                    </div>
                )}

                <form onSubmit={submit} className="mt-6 space-y-5">
                    <div>
                        <InputLabel htmlFor="email" value="Email" />
                        <TextInput
                            id="email"
                            type="email"
                            name="email"
                            value={data.email}
                            className="mt-1 block w-full"
                            isFocused={true}
                            onChange={(e) => setData('email', e.target.value)}
                        />
                        <InputError message={errors.email} className="mt-2" />
                    </div>

                    <div className="flex justify-end">
                        <PrimaryButton disabled={processing}>
                            Email password reset link
                        </PrimaryButton>
                    </div>
                </form>
            </div>
        </GuestLayout>
    );
}
