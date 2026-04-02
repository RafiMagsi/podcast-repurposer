import React from 'react';
import { contentTypeMeta } from './contentTypeMeta.jsx';
import { newsletterParts } from './newsletterParts.jsx';

export default function GeneratedContentCard({
    content,
    onCopy,
    fallbackLabel,
}) {
    const meta = contentTypeMeta(content.content_type, fallbackLabel);
    const isNewsletter = content.content_type === 'newsletter';
    const { subject, content: newsletterBody } = newsletterParts(content.body);

    return (
        <div className={`rounded-[26px] border p-5 ${meta.sectionClass}`}>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-2xl ${meta.iconWrapClass}`}>
                            {meta.icon}
                        </div>

                        <div>
                            <div className="text-base font-semibold text-[rgb(var(--color-text-strong))]">
                                {meta.label}
                            </div>
                            <div className="mt-1 text-sm text-[rgb(var(--color-text-muted))]">
                                {meta.description}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <span className={`rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${meta.badgeClass}`}>
                        {meta.label}
                    </span>

                    <button
                        type="button"
                        onClick={() => onCopy(content.body)}
                        className="btn-copy"
                    >
                        Copy content
                    </button>
                </div>
            </div>

            {content.title ? (
                <div className="mt-4 text-sm font-medium text-[rgb(var(--color-text-muted))]">
                    {content.title}
                </div>
            ) : null}

            {isNewsletter ? (
                <div className="mt-4 space-y-4">
                    {subject ? (
                        <div className="rounded-[20px] border border-white/70 bg-white/80 p-4">
                            <div className="text-xs uppercase tracking-[0.16em] text-[rgb(var(--color-text-faint))]">
                                Subject line
                            </div>
                            <div className="mt-2 text-sm font-semibold leading-7 text-[rgb(var(--color-text-strong))]">
                                {subject}
                            </div>
                        </div>
                    ) : null}

                    <div className="whitespace-pre-wrap rounded-[20px] border border-white/70 bg-white/80 p-4 text-sm leading-7 text-[rgb(var(--color-text))]">
                        {newsletterBody || 'Newsletter body not available.'}
                    </div>
                </div>
            ) : (
                <div className="whitespace-pre-wrap mt-4 rounded-[20px] border border-white/70 bg-white/80 p-4 text-sm leading-7 text-[rgb(var(--color-text))]">
                    {content.body}
                </div>
            )}
        </div>
    );
}