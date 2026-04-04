import AppCard from '@/Components/ui/AppCard';
import MarketingLayout from '@/Layouts/MarketingLayout';

const useCases = [
    ['Founders', 'Turn one product update, founder note, or launch clip into a full post set.'],
    ['Consultants', 'Capture one lesson from a client call and turn it into reusable thought leadership.'],
    ['Creators', 'Reuse one short talking-head clip across multiple channels without rewriting from scratch.'],
    ['Operators', 'Standardize content output from fast internal source material and review it in one place.'],
];

export default function UseCases({ auth }) {
    return (
        <MarketingLayout
            auth={auth}
            title="Use Cases"
            activeNav="use-cases"
            headerTitle="Use cases built around fast short-form content workflows."
            headerCopy="VoicePost AI fits teams and individuals who already have ideas, clips, or notes and need them turned into a clean output set without extra tooling."
        >
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {useCases.map(([title, description], index) => (
                    <AppCard key={title} variant="compact" padding="md" className="p-5">
                        <div className={`profile-icon ${
                            ['profile-icon-purple', 'profile-icon-blue', 'profile-icon-green', 'profile-icon-yellow'][index]
                        } text-sm font-semibold text-[rgb(var(--color-text-strong))]`}>
                            {title.charAt(0)}
                        </div>
                        <h2 className="mt-4 text-lg font-semibold text-[rgb(var(--color-text-strong))]">{title}</h2>
                        <p className="mt-2 text-sm leading-6 text-[rgb(var(--color-text-muted))]">{description}</p>
                    </AppCard>
                ))}
            </div>

            <div className="mt-4 grid gap-4 xl:grid-cols-[1.05fr_.95fr]">
                <AppCard variant="compact" padding="lg" className="p-6">
                    <h2 className="app-section-title">Best fit</h2>
                    <div className="mt-4 space-y-3">
                        {[
                            'Short founder updates',
                            'Client insight recaps',
                            'Short educational clips',
                            'Voice-note style planning',
                            'Quick internal content drafting',
                        ].map((item) => (
                            <div key={item} className="note-card-muted">{item}</div>
                        ))}
                    </div>
                </AppCard>

                <AppCard variant="muted" padding="md">
                    <h2 className="app-section-title">Not built for</h2>
                    <div className="mt-4 space-y-3">
                        {[
                            'Long-form multi-hour production pipelines',
                            'Heavy collaborative editorial workflows',
                            'Large creative suites with dozens of output templates',
                        ].map((item) => (
                            <div key={item} className="note-card">
                                <span className="text-sm leading-6 text-[rgb(var(--color-text-muted))]">{item}</span>
                            </div>
                        ))}
                    </div>
                </AppCard>
            </div>
        </MarketingLayout>
    );
}
