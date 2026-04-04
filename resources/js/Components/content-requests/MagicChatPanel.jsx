import AppCard from '@/Components/ui/AppCard';

const promptSuggestions = [
    'Rewrite the LinkedIn post with a stronger hook.',
    'Make the newsletter more concise and direct.',
    'Give me three alternate X post versions.',
    'Turn this into a more confident founder tone.',
];

export default function MagicChatPanel({
    messages = [],
    value,
    onChange,
    onSubmit,
    sending = false,
    disabled = false,
    error = '',
}) {
    return (
        <AppCard variant="compact" padding="md" className="sm:p-5">
            <div className="section-header-compact">
                <div className="section-header-copy">
                    <h2 className="app-section-title">Magic Chat</h2>
                    <p className="app-muted mt-1 text-sm">
                        Ask for rewrites, stronger hooks, shorter versions, CTA changes, or alternate angles tied to this recording.
                    </p>
                </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
                {promptSuggestions.map((suggestion) => (
                    <button
                        key={suggestion}
                        type="button"
                        className="filter-pill"
                        onClick={() => onChange(suggestion)}
                        disabled={sending || disabled}
                    >
                        {suggestion}
                    </button>
                ))}
            </div>

            <div className="mt-4 space-y-3">
                {messages.length === 0 ? (
                    <div className="rounded-[14px] border border-dashed border-[rgb(var(--color-border-strong))] bg-[rgb(var(--color-surface-soft))] p-4 text-sm text-[rgb(var(--color-text-muted))]">
                        Start with a rewrite request after the transcript or outputs are ready.
                    </div>
                ) : (
                    messages.map((message) => (
                        <div
                            key={message.id}
                            className={`rounded-[14px] border px-4 py-3 text-sm leading-6 ${
                                message.role === 'assistant'
                                    ? 'border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface-soft))] text-[rgb(var(--color-text))]'
                                    : 'border-blue-200 bg-blue-50 text-[rgb(var(--color-text-strong))]'
                            }`}
                        >
                            <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[rgb(var(--color-text-faint))]">
                                {message.role === 'assistant' ? 'Magic Chat' : 'You'}
                            </div>
                            <div className="whitespace-pre-wrap">{message.body}</div>
                        </div>
                    ))
                )}
            </div>

            {error ? (
                <div className="mt-4 rounded-[14px] border border-[rgba(191,61,61,0.18)] bg-[rgb(var(--color-danger-bg))] px-4 py-3 text-sm text-[rgb(var(--color-danger-text))]">
                    {error}
                </div>
            ) : null}

            <form
                className="mt-4 space-y-3"
                onSubmit={(event) => {
                    event.preventDefault();
                    onSubmit();
                }}
            >
                <textarea
                    value={value}
                    onChange={(event) => onChange(event.target.value)}
                    className="textarea-theme min-h-[136px]"
                    placeholder="Ask for a rewrite, shorter version, stronger hook, CTA change, or another angle..."
                    disabled={sending || disabled}
                />

                <div className="flex justify-end">
                    <button
                        type="submit"
                        className="btn-primary min-w-[170px]"
                        disabled={sending || disabled || !value.trim()}
                    >
                        {sending ? 'Sending...' : 'Send To Magic Chat'}
                    </button>
                </div>
            </form>
        </AppCard>
    );
}
