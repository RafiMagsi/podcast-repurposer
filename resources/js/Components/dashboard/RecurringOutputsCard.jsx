import { Link } from '@inertiajs/react';

export default function RecurringOutputsCard({ items }) {
    return (
        <div className="app-card p-6">
            <div className="flex flex-col gap-4 border-b border-[rgb(var(--color-border))] pb-5 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <div className="app-badge-neutral">Recurring Outputs</div>
                    <h2 className="mt-3 text-xl font-semibold tracking-[-0.03em] text-[rgb(var(--color-text-strong))]">
                        Every short source expands into usable drafts.
                    </h2>
                    <p className="mt-2 text-sm leading-7 text-[rgb(var(--color-text-muted))]">
                        The workspace keeps the same five output types in a fixed order so review feels predictable.
                    </p>
                </div>

                <Link href={route('content-requests.index')} className="btn-outline">
                    View library
                </Link>
            </div>

            <div className="mt-5 grid gap-4 lg:grid-cols-2">
                {items.map((item, index) => (
                    <div key={item.title} className="output-section">
                        <div className="output-section-header items-start justify-between gap-4">
                            <div className="flex items-start gap-3">
                                <div className="profile-icon profile-icon-blue text-sm font-semibold text-[rgb(var(--color-text-strong))]">
                                    {index + 1}
                                </div>
                                <div className="min-w-0">
                                    <div className="text-sm font-semibold text-[rgb(var(--color-text-strong))]">{item.title}</div>
                                    <div className="mt-1 text-xs font-normal leading-6 text-[rgb(var(--color-text-muted))]">
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
