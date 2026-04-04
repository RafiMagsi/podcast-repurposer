import ApplicationLogo from '@/Components/ApplicationLogo';
import { Link, usePage } from '@inertiajs/react';

const DEFAULT_COPY = {
    403: 'Access Restricted',
    404: 'Page Not Found',
    419: 'Session Expired',
    429: 'Too Many Requests',
    500: 'Something Went Wrong',
    503: 'Temporarily Unavailable',
};

export default function ErrorPage({ status = 500, title, message }) {
    const page = usePage();
    const user = page.props?.auth?.user || null;
    const resolvedTitle = title || DEFAULT_COPY[status] || DEFAULT_COPY[500];

    return (
        <div className="min-h-screen bg-[rgb(var(--color-page-bg))] px-4 py-8 sm:px-6 lg:px-8">
            <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-[920px] items-center justify-center">
                <div className="app-card w-full p-6 sm:p-8 lg:p-10">
                    <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
                        <div className="max-w-[560px]">
                            <div className="mb-5 inline-flex rounded-full bg-[rgb(var(--color-surface-blue))] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[rgb(var(--color-secondary-text))]">
                                Error {status}
                            </div>
                            <div className="mb-4">
                                <ApplicationLogo
                                    className="h-10 w-10 rounded-[18px]"
                                    withText
                                    textClassName="text-[16px] font-semibold text-[rgb(var(--color-text-strong))]"
                                    subtitleClassName="text-[10px] uppercase tracking-[0.18em] text-[rgb(var(--color-text-muted))]"
                                />
                            </div>
                            <h1 className="text-3xl font-semibold tracking-[-0.05em] text-[rgb(var(--color-text-strong))] sm:text-4xl">
                                {resolvedTitle}
                            </h1>
                            <p className="mt-4 max-w-2xl text-base leading-7 text-[rgb(var(--color-text-muted))]">
                                {message}
                            </p>

                            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                                <a href="/" className="btn-primary justify-center">
                                    Go Home
                                </a>
                                {user ? (
                                    <a href={route('dashboard')} className="btn-outline justify-center">
                                        Open Dashboard
                                    </a>
                                ) : (
                                    <Link href={route('login')} className="btn-outline justify-center">
                                        Sign In
                                    </Link>
                                )}
                            </div>
                        </div>

                        <div className="w-full max-w-[240px] rounded-[18px] border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface-soft))] p-5">
                            <div className="text-xs uppercase tracking-[0.18em] text-[rgb(var(--color-text-faint))]">
                                What you can do
                            </div>
                            <div className="mt-4 space-y-3">
                                {[
                                    'Return to the main workspace',
                                    'Retry the action after a refresh',
                                    'Contact support if the issue continues',
                                ].map((item) => (
                                    <div key={item} className="note-card-muted">
                                        {item}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
