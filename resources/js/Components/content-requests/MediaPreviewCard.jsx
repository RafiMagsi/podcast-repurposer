import { useEffect, useMemo } from 'react';

export default function MediaPreviewCard({ file, sourceType, sourceText }) {
    const objectUrl = useMemo(() => {
        if (!file) return null;
        return URL.createObjectURL(file);
    }, [file]);

    useEffect(() => {
        return () => {
            if (objectUrl) {
                URL.revokeObjectURL(objectUrl);
            }
        };
    }, [objectUrl]);

    if (sourceType === 'text' && sourceText?.trim()) {
        return (
            <div className="rounded-[16px] border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface-soft))] p-4">
                <div className="text-xs uppercase tracking-[0.18em] text-[rgb(var(--color-text-faint))]">
                    Text preview
                </div>
                <div className="mt-3 whitespace-pre-wrap text-sm leading-6 text-[rgb(var(--color-text))]">
                    {sourceText}
                </div>
            </div>
        );
    }

    if (!file || !objectUrl) {
        return null;
    }

    if (sourceType === 'audio') {
        return (
            <div className="rounded-[16px] border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface-soft))] p-4">
                <div className="text-xs uppercase tracking-[0.18em] text-[rgb(var(--color-text-faint))]">
                    Audio preview
                </div>

                <div className="mt-3 flex min-h-[96px] items-center rounded-[14px] border border-[rgb(var(--color-border))] bg-white px-4">
                    <audio controls className="w-full" src={objectUrl}>
                        Your browser does not support audio playback.
                    </audio>
                </div>
            </div>
        );
    }

    if (sourceType === 'video') {
        return (
            <div className="rounded-[16px] border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface-soft))] p-4">
                <div className="text-xs uppercase tracking-[0.18em] text-[rgb(var(--color-text-faint))]">
                    Video preview
                </div>

                <div className="mt-3 overflow-hidden rounded-[14px] border border-[rgb(var(--color-border))] bg-black">
                    <div className="flex h-[220px] items-center justify-center bg-black sm:h-[280px] lg:h-[340px] xl:h-[380px]">
                        <video controls className="max-h-full max-w-full object-contain" src={objectUrl}>
                            Your browser does not support video playback.
                        </video>
                    </div>
                </div>
            </div>
        );
    }

    return null;
}
