import AppCard from '@/Components/ui/AppCard';
import MarketingLayout from '@/Layouts/MarketingLayout';

const pillars = [
    ['Short Inputs Only', 'Upload a 1-minute video, a 1-minute audio clip, or one short text note.'],
    ['One Workspace', 'Review transcript, processing state, and every output from one clean recording page.'],
    ['Five Outputs', 'Generate summary, LinkedIn post, X post, Instagram caption, and newsletter in one run.'],
    ['Built For Speed', 'Start a run quickly, review fast, and regenerate only what needs another pass.'],
];

export default function Product({ auth }) {
    return (
        <MarketingLayout
            auth={auth}
            title="Product"
            activeNav="product"
            headerTitle="A compact content workspace built around one short source."
            headerCopy="VoicePost AI is not a bloated studio. It is a focused workflow for turning one short input into a transcript and a complete ready-to-post content set."
        >
            <div className="grid gap-4 xl:grid-cols-[1.05fr_.95fr]">
                <AppCard variant="compact" padding="lg" className="p-6 sm:p-7">
                    <div className="section-header-compact">
                        <div className="section-header-copy">
                            <h2 className="app-section-title">What the product actually does</h2>
                            <p className="app-muted mt-1 text-sm">
                                Start a run, monitor progress, review transcript, and publish from one system.
                            </p>
                        </div>
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        {pillars.map(([title, description], index) => (
                            <div key={title} className="note-card">
                                <div className={`profile-icon ${
                                    ['profile-icon-purple', 'profile-icon-blue', 'profile-icon-green', 'profile-icon-yellow'][index]
                                } text-sm font-semibold text-[rgb(var(--color-text-strong))]`}>
                                    {index + 1}
                                </div>
                                <div className="mt-3">
                                    <div className="text-sm font-semibold text-[rgb(var(--color-text-strong))]">{title}</div>
                                    <div className="mt-1 text-sm leading-6 text-[rgb(var(--color-text-muted))]">{description}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </AppCard>

                <div className="space-y-4">
                    <AppCard variant="compact" padding="md" className="p-5">
                        <div className="app-badge-neutral">Workflow</div>
                        <div className="mt-4 space-y-3">
                            {[
                                ['Add one source', 'Choose video, audio, or text and start the run.'],
                                ['Generate transcript', 'Use the source transcript as the writing foundation.'],
                                ['Review content', 'Scan the summary and content outputs inside the workspace.'],
                                ['Ship faster', 'Copy, refresh, retry, or regenerate only what you need.'],
                            ].map(([title, description]) => (
                                <div key={title} className="note-card-muted">
                                    <div className="font-semibold text-[rgb(var(--color-text-strong))]">{title}</div>
                                    <div className="mt-1">{description}</div>
                                </div>
                            ))}
                        </div>
                    </AppCard>

                    <AppCard variant="muted" padding="md">
                        <div className="text-xs uppercase tracking-[0.18em] text-[rgb(var(--color-text-faint))]">
                            Included Outputs
                        </div>
                        <div className="mt-3 grid gap-2 sm:grid-cols-2">
                            {['Summary', 'LinkedIn Post', 'X Post', 'Instagram Caption', 'Newsletter'].map((item) => (
                                <div key={item} className="note-card">
                                    <span className="text-sm font-medium text-[rgb(var(--color-text))]">{item}</span>
                                </div>
                            ))}
                        </div>
                    </AppCard>
                </div>
            </div>
        </MarketingLayout>
    );
}
