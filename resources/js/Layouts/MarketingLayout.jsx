import ApplicationLogo from '@/Components/ApplicationLogo';
import { Head, Link } from '@inertiajs/react';

function NavItem({ href, children, active = false }) {
    return (
        <Link href={href} className={active ? 'nav-link nav-link-active' : 'nav-link'}>
            {children}
        </Link>
    );
}

function ActionLink({ href, children, primary = false }) {
    return primary ? (
        <Link href={href} className="btn-primary">
            {children}
        </Link>
    ) : (
        <Link href={href} className="btn-outline">
            {children}
        </Link>
    );
}

export default function MarketingLayout({
    auth,
    title,
    headerTitle,
    headerCopy,
    activeNav = 'product',
    children,
}) {
    return (
        <>
            <Head title={title} />

            <div className="min-h-screen overflow-hidden">
                <div className="mx-auto max-w-[1360px] p-3 sm:p-4">
                    <div className="overflow-hidden rounded-[28px] border border-[rgb(var(--color-border))] bg-[rgb(var(--color-page-bg))] shadow-[0_22px_60px_rgba(17,24,39,0.08)]">
                        <div className="bg-[rgb(var(--color-surface-pink))] px-6 py-3 text-center text-sm font-semibold text-[rgb(var(--color-text-strong))]">
                            VoicePost AI for fast short-source-to-content workflows
                        </div>

                        <div className="relative">
                            <div className="absolute left-[-8rem] top-28 h-72 w-72 rounded-full bg-[rgb(var(--color-surface-pink))] opacity-70 blur-3xl" />
                            <div className="absolute right-[-6rem] top-24 h-72 w-72 rounded-full bg-[rgb(var(--color-surface-blue))] opacity-80 blur-3xl" />
                            <div className="absolute bottom-[-6rem] left-1/3 h-72 w-72 rounded-full bg-[rgb(var(--color-surface-lavender))] opacity-70 blur-3xl" />

                            <div className="relative px-5 pb-10 pt-5 lg:px-7">
                                <header className="mx-auto flex max-w-6xl flex-col gap-3 rounded-[18px] border border-[rgb(var(--color-border))] bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                                    <Link href={route('home')}>
                                        <ApplicationLogo
                                            className="h-9 w-9 rounded-[18px]"
                                            withText
                                            textClassName="text-lg font-semibold text-[rgb(var(--color-text-strong))]"
                                            subtitleClassName="hidden"
                                        />
                                    </Link>

                                    <nav className="flex flex-wrap items-center gap-2 sm:gap-3">
                                        <NavItem href={route('product')} active={activeNav === 'product'}>Product</NavItem>
                                        <NavItem href={route('use-cases')} active={activeNav === 'use-cases'}>Use Cases</NavItem>
                                        <NavItem href={route('pricing')} active={activeNav === 'pricing'}>Pricing</NavItem>
                                        {auth?.user ? (
                                            <ActionLink href={route('dashboard')} primary>
                                                Open Dashboard
                                            </ActionLink>
                                        ) : (
                                            <>
                                                <ActionLink href={route('login')}>Sign In</ActionLink>
                                                <ActionLink href={route('register')} primary>
                                                    Sign Up
                                                </ActionLink>
                                            </>
                                        )}
                                    </nav>
                                </header>

                                <section className="mx-auto max-w-6xl py-8 xl:py-10">
                                    <div className="max-w-3xl">
                                        <div className="app-badge mb-4">VoicePost AI</div>
                                        <h1 className="app-page-title">{headerTitle}</h1>
                                        <p className="app-subheading mt-3 max-w-2xl">{headerCopy}</p>
                                    </div>

                                    <div className="mt-6">
                                        {children}
                                    </div>
                                </section>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
