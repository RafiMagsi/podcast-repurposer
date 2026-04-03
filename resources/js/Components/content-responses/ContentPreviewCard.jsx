export default function({contentRequest, sourceLabel}){
    return(
        <div className="app-card p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <div className="app-badge-neutral">{sourceLabel(contentRequest.input_type)}</div>
                    <h2 className="mt-3 text-xl font-semibold tracking-[-0.03em] text-[rgb(var(--color-text-strong))]">
                        Source Preview
                    </h2>
                    <p className="mt-2 text-sm leading-7 text-[rgb(var(--color-text-muted))]">
                        Review the original source before checking transcript and generated content.
                    </p>
                </div>

                {contentRequest.original_file_name ? (
                    <div className="rounded-[18px] border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface-soft))] px-4 py-3 text-sm text-[rgb(var(--color-text-muted))]">
                        {contentRequest.original_file_name}
                    </div>
                ) : null}
            </div>

            <div className="mt-5">
                {contentRequest.input_type === 'text' ? (
                    <div className="rounded-[22px] border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface-soft))] p-5">
                        <div className="text-xs uppercase tracking-[0.18em] text-[rgb(var(--color-text-faint))]">
                            Source text
                        </div>
                        <div className="mt-3 whitespace-pre-wrap text-sm leading-7 text-[rgb(var(--color-text))]">
                            {contentRequest.source_text || 'No source text available.'}
                        </div>
                    </div>
                ) : contentRequest.media_url && contentRequest.media_kind === 'audio' ? (
                    <div className="rounded-[22px] border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface-soft))] p-5">
                        <div className="text-xs uppercase tracking-[0.18em] text-[rgb(var(--color-text-faint))]">
                            Audio preview
                        </div>
                        <div className="mt-4">
                            <audio controls className="w-full">
                                <source
                                    src={contentRequest.media_url}
                                    type={contentRequest.mime_type || 'audio/mpeg'}
                                />
                                Your browser does not support audio playback.
                            </audio>
                        </div>
                    </div>
                ) : contentRequest.media_url && contentRequest.media_kind === 'video' ? (
                    <div className="rounded-[22px] border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface-soft))] p-5">
                        <div className="text-xs uppercase tracking-[0.18em] text-[rgb(var(--color-text-faint))]">
                            Video preview
                        </div>
                        <div className="mt-4 overflow-hidden rounded-[18px] border border-[rgb(var(--color-border))] bg-black">
                            <video controls className="w-full">
                                <source
                                    src={contentRequest.media_url}
                                    type={contentRequest.mime_type || 'video/mp4'}
                                />
                                Your browser does not support video playback.
                            </video>
                        </div>
                    </div>
                ) : (
                    <div className="rounded-[22px] border border-dashed border-[rgb(var(--color-border-strong))] bg-[rgb(var(--color-surface-soft))] p-5 text-sm text-[rgb(var(--color-text-muted))]">
                        Preview is not available for this source.
                    </div>
                )}
            </div>
        </div>
    );
}