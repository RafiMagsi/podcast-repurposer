import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, useForm } from '@inertiajs/react';

export default function ConfirmPassword() {
    const { data, setData, post, processing, errors, reset } = useForm({
        password: '',
    });

    const submit = (e) => {
        e.preventDefault();

        post(route('password.confirm'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <GuestLayout>
            <Head title="Confirm Password" />

            <div className="auth-card">
                <div className="app-badge mb-4">Security</div>
                <h1 className="text-3xl font-semibold text-[rgb(var(--color-text-strong))]">Confirm your password</h1>
                <div className="mt-3 text-sm leading-7 text-[rgb(var(--color-text-muted))]">
                    This is a secure area of the application. Enter your password to continue.
                </div>

                <form onSubmit={submit} className="mt-6 space-y-5">
                    <div>
                        <InputLabel htmlFor="password" value="Password" />

                        <TextInput
                            id="password"
                            type="password"
                            name="password"
                            value={data.password}
                            className="mt-1 block w-full"
                            isFocused={true}
                            onChange={(e) => setData('password', e.target.value)}
                        />

                        <InputError message={errors.password} className="mt-2" />
                    </div>

                    <div className="flex justify-end">
                        <PrimaryButton disabled={processing}>
                            Confirm
                        </PrimaryButton>
                    </div>
                </form>
            </div>
        </GuestLayout>
    );
}
