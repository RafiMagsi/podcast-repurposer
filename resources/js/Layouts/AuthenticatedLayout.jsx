import ApplicationLogo from '@/Components/ApplicationLogo';
import { Link, usePage } from '@inertiajs/react';

function isActive(url, target) {
    return url === target || url.startsWith(`${target}/`);
}

export default function AuthenticatedLayout({ user: passedUser = null, header, children }) {
    const page = usePage();
    const url = page.url || '';
    const authUser = passedUser || page.props?.auth?.user || null;

    return (
        <div className="app-shell">
            <div className="topbar">
                <div className="app-page flex items-center justify-between gap-4 py-4">
                    <div className="flex items-center gap-6">
                        <Link href={route('dashboard')} className="flex items-center gap-3">
                            <ApplicationLogo className="h-9 w-9" withText />
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
                        {authUser ? (
                            <div className="hidden text-right sm:block">
                                <div className="text-sm font-medium text-white">{authUser.name}</div>
                                <div className="text-xs text-slate-400">{authUser.email}</div>
                            </div>
                        ) : null}

                        <Link href={route('logout')} method="post" as="button" className="btn-secondary">
                            Logout
                        </Link>
                    </div>
                </div>
            </div>

            <main className="app-page space-y-6">
                {header ? <div className="app-panel p-6">{header}</div> : null}
                {children}
            </main>
        </div>
    );
}