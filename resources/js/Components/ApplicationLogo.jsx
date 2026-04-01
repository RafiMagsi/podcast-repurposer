export default function ApplicationLogo({
    className = 'h-10 w-10',
    withText = false,
    textClassName = 'text-sm font-semibold text-white',
    subtitleClassName = 'text-[11px] text-slate-400',
}) {
    return (
        <div className="flex items-center gap-3">
            <img
                src="/assets/logo/podcast-repurposer-mark.svg"
                alt="Podcast Repurposer"
                className={className}
            />

            {withText ? (
                <div className="leading-tight">
                    <div className={textClassName}>Podcast Repurposer</div>
                    <div className={subtitleClassName}>Audio → Transcript → Content</div>
                </div>
            ) : null}
        </div>
    );
}