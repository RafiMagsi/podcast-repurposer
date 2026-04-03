import { Link } from '@inertiajs/react';

export default function RecurringOutputsCard({ items }) {
    return (
        <div className="app-card p-6">
            <div className="flex flex-col gap-4 border-b border-[rgb(var(--color-border))] pb-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <div className="app-badge-neutral">Recurring Outputs</div>
                    <h2 className="mt-3 text-xl font-semibold tracking-[-0.03em] text-[rgb(var(--color-text-strong))]">
                        Every short source expands into usable drafts.
                    </h2>
                </div>

                <Link href={route('content-requests.index')} className="btn-outline">
                    View library
                </Link>
            </div>

            <div className="mt-5 space-y-4">
                {items.map((item, index) => (
                    <div key={item.title} className="output-section">
                        <div className="output-section-header justify-between">
                            <div className="flex items-center gap-3">
                                <div className="profile-icon profile-icon-blue text-sm font-semibold text-[rgb(var(--color-text-strong))]">
                                    {index + 1}
                                </div>
                                <div>
                                    <div>{item.title}</div>
                                    <div className="text-xs font-normal text-[rgb(var(--color-text-muted))]">
                                        {item.description}
                                    </div>
                                </div>
                            </div>

                            <span className="app-badge-saved">Generated</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
