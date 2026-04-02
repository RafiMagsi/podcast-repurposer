import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import DeleteUserForm from './Partials/DeleteUserForm';
import UpdatePasswordForm from './Partials/UpdatePasswordForm';
import UpdateProfileInformationForm from './Partials/UpdateProfileInformationForm';

export default function Edit({ mustVerifyEmail, status }) {
    return (
        <AuthenticatedLayout
            header={
                <div>
                    <div className="app-badge mb-4">Account</div>
                    <h1 className="app-heading">Manage your profile and security settings.</h1>
                    <p className="app-subheading mt-4">
                        Update account details, rotate credentials, and handle account deletion from
                        the same premium workspace.
                    </p>
                </div>
            }
        >
            <Head title="Profile" />

            <div className="space-y-6">
                <div className="app-card p-6 sm:p-8">
                    <UpdateProfileInformationForm
                        mustVerifyEmail={mustVerifyEmail}
                        status={status}
                        className="max-w-2xl"
                    />
                </div>

                <div className="app-card p-6 sm:p-8">
                    <UpdatePasswordForm className="max-w-2xl" />
                </div>

                <div className="app-card p-6 sm:p-8">
                    <DeleteUserForm className="max-w-2xl" />
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
