import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import CreateContent from '@/Components/create-content/CreateContent';
import { Head, usePage } from '@inertiajs/react';

export default function ContentRequestsCreate({ auth, tones = [], uploadLimits = null }) {
    const { usageLimits } = usePage().props;

    return (
        <AuthenticatedLayout
            user={auth.user}
        >
            <Head title="Create Content" />

            <CreateContent
                tones={tones}
                uploadLimits={uploadLimits}
                usageLimits={usageLimits}
                showCardHeader={false}
                showCancelButton
                titlePlaceholder="e.g. 3 lessons from one client call"
            />
        </AuthenticatedLayout>
    );
}
