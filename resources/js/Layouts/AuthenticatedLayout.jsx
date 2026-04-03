import ApplicationLogo from '@/Components/ApplicationLogo';
import { Link, usePage } from '@inertiajs/react';

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
    const breadcrumb = buildBreadcrumb(url);

    return (
        <div className="app-shell">
            <div className="workspace-shell">
                <aside className="sidebar">
                    <div className="flex items-center justify-between gap-3 pb-4 lg:block">
                        <a href={route('dashboard')} className="flex items-center gap-3">
                            <ApplicationLogo
                                className="h-10 w-10 rounded-2xl"
                                withText
                                textClassName="text-base font-semibold text-[rgb(var(--color-text-strong))]"
                                subtitleClassName="text-[11px] uppercase tracking-[0.16em] text-[rgb(var(--color-text-muted))]"
                            />
                        </a>

                        <div className="hidden rounded-full bg-[rgb(var(--color-surface-blue))] px-3 py-1 mt-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-[rgb(var(--color-secondary-text))] lg:inline-flex">
                            Studio
                        </div>
                    </div>

                    <div className="app-card-soft mt-2 hidden p-4 lg:block">
                        <div className="text-xs uppercase tracking-[0.18em] text-[rgb(var(--color-text-faint))]">
                            Workspace
                        </div>
                        <div className="mt-2 text-sm font-semibold text-[rgb(var(--color-text-strong))]">
                            VoicePost AI
                        </div>
                        <div className="mt-2 flex items-center gap-3">
                            <div className="flex-1">
                                <div className="usage-bar-track">
                                    <div className="usage-bar-fill" style={{ width: '78%' }} />
                                </div>
                            </div>
                            <span className="text-xs font-medium text-[rgb(var(--color-text-muted))]">
                                78%
                            </span>
                        </div>
                    </div>

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
                        <div className="app-card p-4">
                            <div className="text-xs uppercase tracking-[0.18em] text-[rgb(var(--color-text-faint))]">
                                Need content fast?
                            </div>
                            <div className="mt-2 text-sm font-semibold text-[rgb(var(--color-text-strong))]">
                                Upload one recording and let VoicePost AI draft the rest.
                            </div>
                            <a href={route('content-requests.create')} className="btn-primary mt-4 w-full">
                                New recording
                            </a>
                        </div>
                    </div>
                </aside>

                <div className="workspace-main">
                    <div className="topbar">
                        <div className="app-page flex flex-col gap-4 py-4 lg:flex-row lg:items-center lg:justify-between">
                            <div>
                                <div className="breadcrumb">
                                    <span>{breadcrumb[0]}</span>
                                    <span className="breadcrumb-sep">/</span>
                                    <span className="breadcrumb-current">{breadcrumb[1]}</span>
                                </div>
                                {authUser ? (
                                    <div className="mt-1 text-sm text-[rgb(var(--color-text-muted))]">
                                        {authUser.name} · {authUser.email}
                                    </div>
                                ) : null}
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

                    <main className="workspace-content space-y-6">
                        {header ? <div className="app-panel p-6 sm:p-8">{header}</div> : null}
                        {children}
                    </main>
                </div>
            </div>
        </div>
    );
}
