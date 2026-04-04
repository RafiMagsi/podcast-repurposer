import { useEffect, useRef } from 'react';

function safeMediaUrl(url) {
    if (!url || typeof url !== 'string') {
        return null;
    }

    try {
        const parsed = new URL(url, window.location.origin);

        if (!['http:', 'https:'].includes(parsed.protocol)) {
            return null;
        }

        return parsed.toString();
    } catch (_error) {
        return null;
    }
}

export default function ContentPreviewCard({ contentRequest, sourceLabel }) {
    const isVideoSource = contentRequest.media_kind === 'video';
    const isAudioSource = contentRequest.media_kind === 'audio';
    const mediaElementRef = useRef(null);
    const mediaUrl = safeMediaUrl(contentRequest.media_url);
    const thumbnailUrl = safeMediaUrl(contentRequest.media_thumbnail_url);

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
        <div className="app-card-compact p-4 sm:p-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                    <div className="app-badge-neutral">{sourceLabel(contentRequest.input_type)}</div>
                    <h2 className="mt-2.5 text-lg font-semibold tracking-[-0.03em] text-[rgb(var(--color-text-strong))]">
                        Source Preview
                    </h2>
                    <p className="mt-1.5 text-sm leading-6 text-[rgb(var(--color-text-muted))]">
                        Media previews stream normally with browser buffering.
                    </p>
                </div>

                {contentRequest.original_file_name || contentRequest.media_thumbnail_url ? (
                    <div className="note-card-muted w-full text-sm lg:w-auto lg:max-w-[260px]">
                        {contentRequest.original_file_name || 'Thumbnail available'}
                    </div>
                ) : null}
            </div>

            <div className="mt-4">
                {contentRequest.input_type === 'text' ? (
                    <div className="rounded-[16px] border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface-soft))] p-4">
                        <div className="text-xs uppercase tracking-[0.18em] text-[rgb(var(--color-text-faint))]">
                            Text preview
                        </div>
                        <div className="mt-3 whitespace-pre-wrap rounded-[14px] border border-[rgb(var(--color-border))] bg-white p-4 text-sm leading-7 text-[rgb(var(--color-text))]">
                            {contentRequest.source_text || 'No text source available.'}
                        </div>
                    </div>
                ) : isAudioSource && mediaUrl ? (
                    <div className="rounded-[16px] border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface-soft))] p-4">
                        <div className="text-xs uppercase tracking-[0.18em] text-[rgb(var(--color-text-faint))]">
                            Audio preview
                        </div>
                        <div className="mt-3 flex min-h-[104px] items-center rounded-[14px] border border-[rgb(var(--color-border))] bg-white px-4">
                            <audio
                                ref={mediaElementRef}
                                controls
                                preload="metadata"
                                className="w-full"
                                src={mediaUrl}
                            >
                                Your browser does not support audio playback.
                            </audio>
                        </div>
                    </div>
                ) : isVideoSource && (mediaUrl || thumbnailUrl) ? (
                    <div className="rounded-[16px] border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface-soft))] p-4">
                        <div className="text-xs uppercase tracking-[0.18em] text-[rgb(var(--color-text-faint))]">
                            Video preview
                        </div>
                        <div className="mt-3 overflow-hidden rounded-[14px] border border-[rgb(var(--color-border))] bg-black">
                            <div className="relative flex min-h-[220px] items-center justify-center bg-black sm:min-h-[280px] lg:min-h-[360px]">
                                {mediaUrl ? (
                                    <video
                                        ref={mediaElementRef}
                                        controls
                                        preload="metadata"
                                        poster={thumbnailUrl || undefined}
                                        className="max-h-full max-w-full object-contain"
                                        src={mediaUrl}
                                    >
                                        Your browser does not support video playback.
                                    </video>
                                ) : thumbnailUrl ? (
                                    <img
                                        src={thumbnailUrl}
                                        alt={`${contentRequest.title} thumbnail`}
                                        className="max-h-full max-w-full object-contain"
                                    />
                                ) : null}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="rounded-[16px] border border-dashed border-[rgb(var(--color-border-strong))] bg-[rgb(var(--color-surface-soft))] p-4 text-sm text-[rgb(var(--color-text-muted))]">
                        Preview is not available for this source.
                    </div>
                )}
            </div>
        </div>
    );
}
