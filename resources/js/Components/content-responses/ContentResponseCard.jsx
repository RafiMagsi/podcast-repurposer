import React from 'react';
import { contentTypeMeta } from './contentTypeMeta.jsx';
import { newsletterParts } from './newsletterParts.jsx';

export default function ContentResponseCard({
    contentResponse,
    onCopy,
    onRegenerate,
    fallbackLabel,
}) {
    const meta = contentTypeMeta(contentResponse.content_type, fallbackLabel);
    const isNewsletter = contentResponse.content_type === 'newsletter';
    const { subject, content: newsletterBody } = newsletterParts(contentResponse.body);
    const isRegenerating = Boolean(contentResponse.meta?.is_regenerating);
    const regenerationError = contentResponse.meta?.regeneration_error;

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
                        onClick={() => onRegenerate?.(contentResponse.content_type)}
                        className="btn-secondary"
                        disabled={isRegenerating}
                    >
                        {isRegenerating ? 'Regenerating...' : 'Regenerate'}
                    </button>

                    <button
                        type="button"
                        onClick={() => onCopy(contentResponse.body)}
                        className="btn-copy"
                        disabled={isRegenerating}
                    >
                        Copy content
                    </button>
                </div>
            </div>

            {isRegenerating ? (
                <div className="mt-4 rounded-[18px] border border-[rgb(var(--color-border-strong))] bg-white/80 px-4 py-3 text-sm text-[rgb(var(--color-text-muted))]">
                    Regenerating this output. The rest of the content set stays unchanged.
                </div>
            ) : null}

            {!isRegenerating && regenerationError ? (
                <div className="mt-4 rounded-[18px] border border-[rgb(var(--color-danger-border))] bg-[rgb(var(--color-danger-bg))] px-4 py-3 text-sm text-[rgb(var(--color-danger-text))]">
                    {regenerationError}
                </div>
            ) : null}

            {contentResponse.title ? (
                <div className="mt-4 text-sm font-medium text-[rgb(var(--color-text-muted))]">
                    {contentResponse.title}
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
                    {contentResponse.body}
                </div>
            )}
        </div>
    );
}
