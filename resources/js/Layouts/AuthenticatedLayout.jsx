import ApplicationLogo from '@/Components/ApplicationLogo';
import AppCard from '@/Components/ui/AppCard';
import { Link, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';

function isActive(url, target) {
    return url === target || url.startsWith(`${target}/`);
}

function buildBreadcrumb(url) {
    if (isActive(url, '/content-requests')) {
        return ['Workspace', 'Recordings'];
    }

    if (isActive(url, '/pipeline')) {
        return ['Workspace', 'Pipeline'];
    }

    if (isActive(url, '/settings')) {
        return ['Workspace', 'Settings'];
    }

    if (isActive(url, '/profile')) {
        return ['Account', 'Profile'];
    }

    return ['Workspace', 'Dashboard'];
}

export default function AuthenticatedLayout({ user: passedUser = null, header, children }) {
    const page = usePage();
    const url = page.url || '';
    const authUser = passedUser || page.props?.auth?.user || null;
    const isAdmin = Boolean(authUser?.is_admin);
    const usageLimits = page.props?.usageLimits || null;
    const breadcrumb = buildBreadcrumb(url);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    useEffect(() => {
        setSidebarOpen(false);
    }, [url]);

    return (
        <div className="app-shell">
            <div className="workspace-shell">
                <aside className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
                    <div className="flex items-center justify-between gap-3 pb-3 lg:block">
                        <a href={route('dashboard')} className="flex min-w-0 items-center gap-3">
                            <ApplicationLogo
                                className="h-9 w-9 rounded-[18px]"
                                withText
                                textClassName="text-[15px] font-semibold text-[rgb(var(--color-text-strong))]"
                                subtitleClassName="text-[10px] uppercase tracking-[0.18em] text-[rgb(var(--color-text-muted))]"
                            />
                        </a>

                        <button
                            type="button"
                            onClick={() => setSidebarOpen((current) => !current)}
                            className="sidebar-mobile-toggle lg:hidden"
                            aria-label={sidebarOpen ? 'Close navigation' : 'Open navigation'}
                        >
                            {sidebarOpen ? '×' : '☰'}
                        </button>

                        <div className="mt-4 hidden rounded-full bg-[rgb(var(--color-surface-blue))] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[rgb(var(--color-secondary-text))] lg:inline-flex">
                            Studio
                        </div>
                    </div>

                    <AppCard variant="soft" padding="md" className="mt-2 hidden lg:block">
                        <div className="text-xs uppercase tracking-[0.18em] text-[rgb(var(--color-text-faint))]">
                            Workspace
                        </div>
                        <div className="mt-2 text-sm font-semibold text-[rgb(var(--color-text-strong))]">
                            VoicePost AI
                        </div>
                        {usageLimits ? (
                            <div className="mt-1 text-xs text-[rgb(var(--color-text-muted))]">
                                ${usageLimits.plan_price_usd} plan · {usageLimits.remaining} / {usageLimits.limit} runs left
                            </div>
                        ) : null}
                        <div className="mt-2 flex items-center gap-3">
                            <div className="flex-1">
                                <div className="usage-bar-track">
                                    <div
                                        className="usage-bar-fill"
                                        style={{ width: `${usageLimits?.percent_used ?? 0}%` }}
                                    />
                                </div>
                            </div>
                            <span className="text-xs font-medium text-[rgb(var(--color-text-muted))]">
                                {usageLimits ? `${usageLimits.percent_used}%` : '0%'}
                            </span>
                        </div>
                        {usageLimits?.reached ? (
                            <div className="mt-3 rounded-[14px] border border-[rgba(225,29,72,0.18)] bg-[rgba(225,29,72,0.04)] px-3 py-2 text-xs leading-5 text-[rgb(var(--color-text-muted))]">
                                Usage limit reached. New runs are blocked until the quota is increased.
                            </div>
                        ) : null}
                    </AppCard>

                    <div className="sidebar-scroll-area">
                    <div className="sidebar-section-label">Workspace</div>

                    <nav className="grid gap-1">
                        <a
                            href={route('dashboard')}
                            className={`sidebar-link ${isActive(url, '/dashboard') ? 'sidebar-link-active' : ''}`}
                        >
                            <span className="sidebar-icon">D</span>
                            Dashboard
                        </a>
                        <a
                            href={route('content-requests.index')}
                            className={`sidebar-link ${isActive(url, '/content-requests') ? 'sidebar-link-active' : ''}`}
                        >
                            <span className="sidebar-icon">R</span>
                            Content Library
                        </a>
                        <a
                            href={route('pipeline.index')}
                            className={`sidebar-link ${isActive(url, '/pipeline') ? 'sidebar-link-active' : ''}`}
                        >
                            <span className="sidebar-icon">P</span>
                            Pipeline
                        </a>
                        {isAdmin ? (
                            <a
                                href={route('admin.runs.index')}
                                className={`sidebar-link ${isActive(url, '/admin/runs') ? 'sidebar-link-active' : ''}`}
                            >
                                <span className="sidebar-icon">A</span>
                                Admin Runs
                            </a>
                        ) : null}
                        <a
                            href={route('settings.index')}
                            className={`sidebar-link ${isActive(url, '/settings') ? 'sidebar-link-active' : ''}`}
                        >
                            <span className="sidebar-icon">S</span>
                            Settings
                        </a>
                    </nav>

                    <div className="sidebar-section-label">Account</div>

                    <nav className="grid gap-1">
                        <a
                            href={route('profile.edit')}
                            className={`sidebar-link ${isActive(url, '/profile') ? 'sidebar-link-active' : ''}`}
                        >
                            <span className="sidebar-icon">P</span>
                            Profile
                        </a>
                        <a href="/" className="sidebar-link">
                            <span className="sidebar-icon">H</span>
                            Home
                        </a>
                    </nav>

                    <div className="mt-6 hidden lg:block">
                        <AppCard padding="md">
                            <div className="text-xs uppercase tracking-[0.18em] text-[rgb(var(--color-text-faint))]">
                                Need content fast?
                            </div>
                            <div className="mt-2 text-sm font-semibold text-[rgb(var(--color-text-strong))]">
                                Upload one recording and let VoicePost AI draft the rest.
                            </div>
                            <a href={route('content-requests.create')} className="btn-primary mt-4 w-full">
                                New recording
                            </a>
                        </AppCard>
                    </div>
                    </div>
                </aside>

                <div className="workspace-main">
                    <div className="topbar">
                        <div className="app-page flex flex-col gap-3 py-3 lg:flex-row lg:items-center lg:justify-between">
                            <div className="flex min-w-0 items-center gap-3">
                                <button
                                    type="button"
                                    onClick={() => setSidebarOpen((current) => !current)}
                                    className="sidebar-mobile-toggle hidden max-lg:inline-flex"
                                    aria-label={sidebarOpen ? 'Close navigation' : 'Open navigation'}
                                >
                                    {sidebarOpen ? '×' : '☰'}
                                </button>

                                <div className="breadcrumb">
                                    <span>{breadcrumb[0]}</span>
                                    <span className="breadcrumb-sep">/</span>
                                    <span className="breadcrumb-current">{breadcrumb[1]}</span>
                                </div>
                            </div>

                            <div className="flex flex-col gap-3 lg:min-w-0 lg:flex-row lg:items-center lg:justify-end">
                                <div className="topbar-search-wrap">
                                    <span className="topbar-search-icon">⌕</span>
                                    <input
                                        type="text"
                                        className="topbar-search"
                                        value=""
                                        placeholder="Search runs, transcripts, or outputs"
                                        readOnly
                                        aria-label="Search runs, transcripts, or outputs"
                                    />
                                </div>

                                <div className="flex flex-wrap items-center gap-2">
                                <a href={route('dashboard')} className="topbar-action">
                                    Dashboard
                                </a>
                                <a href={route('content-requests.index')} className="topbar-action">
                                    Library
                                </a>
                                <a href={route('pipeline.index')} className="topbar-action">
                                    Pipeline
                                </a>
                                {isAdmin ? (
                                    <a href={route('admin.runs.index')} className="topbar-action">
                                        Admin Runs
                                    </a>
                                ) : null}
                                <a href={route('settings.index')} className="btn-secondary">
                                    Settings
                                </a>
                                <a href={route('content-requests.create')} className="btn-primary-rect">
                                    New recording
                                </a>
                                <Link href={route('logout')} method="post" as="button" className="btn-outline">
                                    Logout
                                </Link>
                                </div>
                            </div>
                        </div>
                    </div>

                    <main className="workspace-content space-y-6">
                        {header ? <AppCard variant="panel" padding="lg">{header}</AppCard> : null}
                        {children}
                    </main>
                </div>
            </div>
        </div>
    );
}
