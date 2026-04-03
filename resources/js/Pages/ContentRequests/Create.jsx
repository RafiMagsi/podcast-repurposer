import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import CreateContent from '@/Components/create-content/CreateContent';
import { Head, usePage } from '@inertiajs/react';

export default function ContentRequestsCreate({ auth, tones = [], uploadLimits = null }) {
    const { usageLimits } = usePage().props;

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <div className="grid gap-8 xl:grid-cols-[1.08fr_.92fr] xl:items-center">
                    <div>
                        <div className="app-badge mb-4">New source</div>
                        <h1 className="app-heading">Turn one short source into ready-to-post content.</h1>
                        <p className="app-subheading mt-5 max-w-2xl">
                            Upload a 1-minute video, a 1-minute audio clip, or paste one short text idea. VoicePost AI takes you straight into the workspace while the transcript and outputs are prepared.
                        </p>
                        {usageLimits ? (
                            <div className="mt-4 text-sm leading-7 text-[rgb(var(--color-text-muted))]">
                                {usageLimits.remaining} of {usageLimits.limit} runs remaining on the ${usageLimits.plan_price_usd} plan.
                            </div>
                        ) : null}
                    </div>

                    <div className="app-card-soft p-6">
                        <div className="text-xs uppercase tracking-[0.18em] text-[rgb(var(--color-text-faint))]">
                            Included outputs
                        </div>
                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                            {[
                                ['Summary', 'A clean overview of the source before deeper review.'],
                                ['LinkedIn Post', 'A professional draft from the same source.'],
                                ['X Post', 'A short publish-ready version for fast posting.'],
                                ['Instagram + Newsletter', 'A caption and email-ready draft from the same run.'],
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
