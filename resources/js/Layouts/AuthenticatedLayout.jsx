import ApplicationLogo from '@/Components/ApplicationLogo';
import { Link, usePage } from '@inertiajs/react';

function isActive(url, target) {
    return url === target || url.startsWith(`${target}/`);
}

function buildBreadcrumb(url) {
    if (isActive(url, '/episodes')) {
        return ['Workspace', 'Recordings'];
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
                        <Link href={route('dashboard')} className="flex items-center gap-3">
                            <ApplicationLogo
                                className="h-10 w-10 rounded-2xl"
                                withText
                                textClassName="text-base font-semibold text-[rgb(var(--color-text-strong))]"
                                subtitleClassName="text-[11px] uppercase tracking-[0.16em] text-[rgb(var(--color-text-muted))]"
                            />
                        </Link>

                        <div className="hidden rounded-full bg-[rgb(var(--color-surface-blue))] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[rgb(var(--color-secondary-text))] lg:inline-flex">
                            Studio
                        </div>
                    </div>

                    <div className="app-card-soft mt-2 hidden p-4 lg:block">
                        <div className="text-xs uppercase tracking-[0.18em] text-[rgb(var(--color-text-faint))]">
                            Workspace
                        </div>
                        <div className="mt-2 text-sm font-semibold text-[rgb(var(--color-text-strong))]">
                            My Content Agency
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
                        <Link
                            href={route('dashboard')}
                            className={`sidebar-link ${isActive(url, '/dashboard') ? 'sidebar-link-active' : ''}`}
                        >
                            <span className="sidebar-icon">D</span>
                            Dashboard
                        </Link>
                        <Link
                            href={route('episodes.index')}
                            className={`sidebar-link ${isActive(url, '/episodes') ? 'sidebar-link-active' : ''}`}
                        >
                            <span className="sidebar-icon">R</span>
                            Recordings
                        </Link>
                        <Link
                            href={route('settings.index')}
                            className={`sidebar-link ${isActive(url, '/settings') ? 'sidebar-link-active' : ''}`}
                        >
                            <span className="sidebar-icon">S</span>
                            Settings
                        </Link>
                    </nav>

                    <div className="sidebar-section-label">Account</div>

                    <nav className="grid gap-1">
                        <Link
                            href={route('profile.edit')}
                            className={`sidebar-link ${isActive(url, '/profile') ? 'sidebar-link-active' : ''}`}
                        >
                            <span className="sidebar-icon">P</span>
                            Profile
                        </Link>
                        <Link href="/" className="sidebar-link">
                            <span className="sidebar-icon">H</span>
                            Home
                        </Link>
                    </nav>

                    <div className="mt-6 hidden lg:block">
                        <div className="app-card p-4">
                            <div className="text-xs uppercase tracking-[0.18em] text-[rgb(var(--color-text-faint))]">
                                Need content fast?
                            </div>
                            <div className="mt-2 text-sm font-semibold text-[rgb(var(--color-text-strong))]">
                                Upload one recording and let VoicePost AI draft the rest.
                            </div>
                            <Link href={route('episodes.create')} className="btn-primary mt-4 w-full">
                                New upload
                            </Link>
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
                                <Link href={route('dashboard')} className="topbar-action">
                                    Dashboard
                                </Link>
                                <Link href={route('episodes.index')} className="topbar-action">
                                    Library
                                </Link>
                                <Link href={route('settings.index')} className="btn-secondary">
                                    Settings
                                </Link>
                                <Link href={route('episodes.create')} className="btn-primary-rect">
                                    New upload
                                </Link>
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
