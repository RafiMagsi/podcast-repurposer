import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import CreateContent from '@/Components/create-content/CreateContent';
import { Head, usePage } from '@inertiajs/react';

export default function ContentRequestsCreate({ auth, tones = [], uploadLimits = null }) {
    const { usageLimits } = usePage().props;

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <div>
                    <h1 className="app-page-title">Turn one short source into ready-to-post content.</h1>
                    <p className="app-subheading mt-2 max-w-2xl">
                        Upload a 1-minute video, a 1-minute audio clip, or paste one short text idea. VoicePost AI takes you straight into the workspace while the transcript and outputs are prepared.
                    </p>
                </div>
            }
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
