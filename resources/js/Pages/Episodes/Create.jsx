import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import CreateContent from '@/Components/create-content/CreateContent';
import { Head } from '@inertiajs/react';

export default function EpisodesCreate({ auth, tones = [] }) {
    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <div className="grid gap-8 xl:grid-cols-[1.08fr_.92fr] xl:items-center">
                    <div>
                        <div className="app-badge mb-4">New source</div>
                        <h1 className="app-heading">Turn one short source into content.</h1>
                        <p className="app-subheading mt-5 max-w-2xl">
                            Upload a 1-minute video, audio clip, recording, or paste a sentence under
                            200 characters, then jump straight into the recording workspace while VoicePost AI processes the run.
                        </p>
                    </div>

                    <div className="app-card-soft p-6">
                        <div className="text-xs uppercase tracking-[0.18em] text-[rgb(var(--color-text-faint))]">
                            Included outputs
                        </div>
                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                            {[
                                ['Summary', 'Fast overview for review and approvals.'],
                                ['LinkedIn Post', 'Professional social copy from the same source.'],
                                ['X Post', 'Short-form draft for quick posting.'],
                                ['Workspace', 'Transcript plus generated content in one place.'],
                            ].map(([title, description], index) => (
                                <div key={title} className="profile-card">
                                    <div
                                        className={`profile-icon ${
                                            ['profile-icon-purple', 'profile-icon-blue', 'profile-icon-green', 'profile-icon-yellow'][index]
                                        } text-sm font-semibold text-[rgb(var(--color-text-strong))]`}
                                    >
                                        •
                                    </div>
                                    <div>
                                        <div className="text-sm font-semibold text-[rgb(var(--color-text-strong))]">
                                            {title}
                                        </div>
                                        <div className="text-sm leading-6 text-[rgb(var(--color-text-muted))]">
                                            {description}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            }
        >
            <Head title="Create Content" />

            <CreateContent tones={tones} showCardHeader={false} showCancelButton titlePlaceholder="e.g. 3 lessons from one client call" />
        </AuthenticatedLayout>
    );
}
