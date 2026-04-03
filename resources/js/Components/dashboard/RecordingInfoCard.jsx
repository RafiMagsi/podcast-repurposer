import { Link } from '@inertiajs/react';

export default function(){
    return (
        <div className="app-card p-6 sm:p-8">
            <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                <div className="max-w-xl">
                    <div className="app-badge-neutral">New Run</div>
                    <h2 className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-[rgb(var(--color-text-strong))]">
                        Start a new recording on the dedicated create page.
                    </h2>
                    <p className="mt-2 text-sm leading-7 text-[rgb(var(--color-text-muted))]">
                        Keep the dashboard focused on status, recent runs, and navigation.
                        Use the create page for source selection, uploads, and the submit flow.
                    </p>
                </div>

                <div className="flex flex-col gap-3">
                    <Link href={route('episodes.create')} className="btn-primary">
                        Create content
                    </Link>
                    <Link href={route('episodes.index')} className="btn-secondary">
                        Browse recordings
                    </Link>
                </div>
            </div>
        </div>
    );
}