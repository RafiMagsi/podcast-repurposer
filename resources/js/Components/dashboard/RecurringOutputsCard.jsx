import { Link } from '@inertiajs/react';

export default function RecurringOutputsCard({ items }) {
    return (
        <div className="app-card-compact p-4">
            <div className="section-header-compact border-b border-[rgb(var(--color-border))] pb-4">
                <div>
                    <div className="app-badge-neutral">Recurring Outputs</div>
                    <h2 className="mt-2 text-lg font-semibold tracking-[-0.03em] text-[rgb(var(--color-text-strong))]">
                        Five consistent assets on every run.
                    </h2>
                    <p className="mt-1 text-sm leading-5 text-[rgb(var(--color-text-muted))]">
                        Same order, same review flow.
                    </p>
                </div>

                <Link href={route('content-requests.index')} className="btn-compact w-full sm:w-auto">
                    View library
                </Link>
            </div>

            <div className="mt-4 compact-grid-2">
                {items.map((item, index) => (
                    <div key={item.title} className="app-card-muted p-3">
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex min-w-0 items-start gap-3">
                                <div className="icon-compact profile-icon-blue shrink-0 font-semibold text-[rgb(var(--color-text-strong))]">
                                    {index + 1}
                                </div>
                                <div className="min-w-0">
                                    <div className="text-sm font-semibold leading-5 text-[rgb(var(--color-text-strong))]">
                                        {item.title}
                                    </div>
                                    <div className="mt-1 text-xs leading-5 text-[rgb(var(--color-text-muted))]">
                                        {item.description}
                                    </div>
                                </div>
                            </div>

                            <span className="app-badge-saved shrink-0">Ready</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
