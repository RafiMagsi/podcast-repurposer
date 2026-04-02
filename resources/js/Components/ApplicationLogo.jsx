export default function ApplicationLogo({
    className = 'h-10 w-10',
    withText = false,
    textClassName = 'text-sm font-semibold text-[rgb(var(--color-text-strong))]',
    subtitleClassName = 'text-[11px] text-[rgb(var(--color-text-muted))]',
}) {
    return (
        <div className="flex items-center gap-3">
            <img
                src="/assets/logo/voicepost-ai-mark.svg"
                alt="VoicePost AI"
                className={className}
            />

            {withText ? (
                <div className="leading-tight">
                    <div className={textClassName}>VoicePost AI</div>
                    <div className={subtitleClassName}>Voice Notes → Transcript → Content</div>
                </div>
            ) : null}
        </div>
    );
}
