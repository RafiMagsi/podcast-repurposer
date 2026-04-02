export default function ApplicationLogo({
    className = 'h-10 w-10',
    withText = false,
    textClassName = 'text-sm font-semibold text-white',
    subtitleClassName = 'text-[11px] text-slate-400',
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
                    <div className={subtitleClassName}>Audio → Transcript → Content</div>
                </div>
            ) : null}
        </div>
    );
}
