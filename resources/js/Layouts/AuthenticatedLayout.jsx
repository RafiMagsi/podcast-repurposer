import { Link, usePage } from '@inertiajs/react';

function isActive(url, target) {
    return url === target || url.startsWith(`${target}/`);
}

export default function AuthenticatedLayout({ user, header, children }) {
    const { url } = usePage();

    return (
        <div className="app-shell">
            <div className="topbar">
                <div className="app-page flex items-center justify-between gap-4 py-4">
                    <div className="flex items-center gap-6">
                        <Link href={route('dashboard')} className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,var(--color-primary),var(--color-primary-2))] text-sm font-bold text-white shadow-lg">
                                AI
                            </div>
                            <div>
                                <div className="text-sm font-semibold text-white">
                                    Podcast Repurposer
                                </div>
                                <div className="text-xs text-slate-400">
                                    Audio → Transcript → Content
                                </div>
                            </div>
                        </Link>

                        <nav className="hidden items-center gap-2 md:flex">
                            <Link
                                href={route('dashboard')}
                                className={`nav-link ${isActive(url, '/dashboard') ? 'nav-link-active' : ''}`}
                            >
                                Dashboard
                            </Link>
                            <Link
                                href={route('episodes.index')}
                                className={`nav-link ${isActive(url, '/episodes') ? 'nav-link-active' : ''}`}
                            >
                                Episodes
                            </Link>
                            <Link
                                href={route('settings.index')}
                                className={`nav-link ${isActive(url, '/settings') ? 'nav-link-active' : ''}`}
                            >
                                Settings
                            </Link>
                        </nav>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="hidden text-right sm:block">
                            <div className="text-sm font-medium text-white">{user.name}</div>
                            <div className="text-xs text-slate-400">{user.email}</div>
                        </div>

                        <Link href={route('logout')} method="post" as="button" className="btn-secondary">
                            Logout
                        </Link>
                    </div>
                </div>
            </div>

            <main className="app-page space-y-6">
                {header ? (
                    <div className="app-panel p-6">
                        {header}
                    </div>
                ) : null}

                {children}
            </main>
        </div>
    );
}