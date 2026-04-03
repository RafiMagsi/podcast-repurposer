import { useEffect, useRef } from 'react';

export default function ContentPreviewCard({ contentRequest, sourceLabel }) {
    const isVideoSource = contentRequest.media_kind === 'video';
    const isAudioSource = contentRequest.media_kind === 'audio';
    const mediaElementRef = useRef(null);

    useEffect(() => {
        const stopPreview = () => {
            const mediaElement = mediaElementRef.current;

            if (!mediaElement) {
                return;
            }

            try {
                mediaElement.pause();
            } catch (_error) {
                // Best-effort cleanup before navigation.
            }
        };

        const handlePageHide = () => {
            stopPreview();
        };

        const handleDocumentClick = (event) => {
            const target = event.target instanceof Element ? event.target.closest('a[href]') : null;

            if (target) {
                stopPreview();
            }
        };

        window.addEventListener('pagehide', handlePageHide);
        window.addEventListener('beforeunload', handlePageHide);
        document.addEventListener('click', handleDocumentClick, true);

        return () => {
            window.removeEventListener('pagehide', handlePageHide);
            window.removeEventListener('beforeunload', handlePageHide);
            document.removeEventListener('click', handleDocumentClick, true);
            stopPreview();
        };
    }, []);

    return (
        <div className="app-card p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <div className="app-badge-neutral">{sourceLabel(contentRequest.input_type)}</div>
                    <h2 className="mt-3 text-xl font-semibold tracking-[-0.03em] text-[rgb(var(--color-text-strong))]">
                        Source Preview
                    </h2>
                    <p className="mt-2 text-sm leading-7 text-[rgb(var(--color-text-muted))]">
                        Media previews stream normally and begin playback with browser buffering instead of forcing a full download.
                    </p>
                </div>

                {contentRequest.original_file_name || contentRequest.media_thumbnail_url ? (
                    <div className="rounded-[18px] border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface-soft))] px-4 py-3 text-sm text-[rgb(var(--color-text-muted))]">
                        {contentRequest.original_file_name || 'Thumbnail available'}
                    </div>
                ) : null}
            </div>

            <div className="mt-5">
                {contentRequest.input_type === 'text' ? (
                    <div className="rounded-[22px] border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface-soft))] p-5">
                        <div className="text-xs uppercase tracking-[0.18em] text-[rgb(var(--color-text-faint))]">
                            Text preview
                        </div>
                        <div className="mt-4 whitespace-pre-wrap rounded-[18px] border border-[rgb(var(--color-border))] bg-white p-5 text-sm leading-7 text-[rgb(var(--color-text))]">
                            {contentRequest.source_text || 'No text source available.'}
                        </div>
                    </div>
                ) : isAudioSource && contentRequest.media_url ? (
                    <div className="rounded-[22px] border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface-soft))] p-5">
                        <div className="text-xs uppercase tracking-[0.18em] text-[rgb(var(--color-text-faint))]">
                            Audio preview
                        </div>
                        <div className="mt-4 flex h-[120px] items-center rounded-[16px] border border-[rgb(var(--color-border))] bg-white px-4">
                            <audio
                                ref={mediaElementRef}
                                controls
                                preload="metadata"
                                className="w-full"
                                src={contentRequest.media_url}
                            >
                                Your browser does not support audio playback.
                            </audio>
                        </div>
                    </div>
                ) : isVideoSource && (contentRequest.media_url || contentRequest.media_thumbnail_url) ? (
                    <div className="rounded-[22px] border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface-soft))] p-5">
                        <div className="text-xs uppercase tracking-[0.18em] text-[rgb(var(--color-text-faint))]">
                            Video preview
                        </div>
                        <div className="mt-4 overflow-hidden rounded-[18px] border border-[rgb(var(--color-border))] bg-black">
                            <div className="relative flex h-[420px] items-center justify-center bg-black sm:h-[460px] lg:h-[500px]">
                                {contentRequest.media_url ? (
                                    <video
                                        ref={mediaElementRef}
                                        controls
                                        preload="metadata"
                                        poster={contentRequest.media_thumbnail_url || undefined}
                                        className="max-h-full max-w-full object-contain"
                                        src={contentRequest.media_url}
                                    >
                                        Your browser does not support video playback.
                                    </video>
                                ) : contentRequest.media_thumbnail_url ? (
                                    <img
                                        src={contentRequest.media_thumbnail_url}
                                        alt={`${contentRequest.title} thumbnail`}
                                        className="max-h-full max-w-full object-contain"
                                    />
                                ) : null}
                            </div>
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
