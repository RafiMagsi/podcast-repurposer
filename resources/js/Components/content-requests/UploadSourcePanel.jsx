export default function UploadSourcePanel({
    sourceType,
    selectedFile,
    error,
    onFileChange,
    onClear,
}) {
    const isVideo = sourceType === 'video';

    const accept = isVideo
        ? 'video/*,.mp4,.mov,.webm'
        : 'audio/*,.mp3,.wav,.m4a,.webm';

    const label = isVideo ? 'Video file' : 'Audio file';
    const helpText = isVideo
        ? 'Supported formats: MP4, MOV, WebM. Keep video uploads under 300 MB and within 1 minute.'
        : 'Supported formats: MP3, WAV, M4A, WebM. Keep audio uploads under 25 MB and within 1 minute.';

    return (
        <div className="mt-5 rounded-[24px] border border-dashed border-[rgb(var(--color-border-strong))] bg-[rgb(var(--color-surface-soft))] p-5">
            <label className="label-theme">{label}</label>

            <input
                type="file"
                accept={accept}
                onChange={(e) => onFileChange(e.target.files?.[0] || null)}
                className="block w-full text-sm text-[rgb(var(--color-text-muted))] file:mr-4 file:rounded-full file:border-0 file:bg-[rgb(var(--color-primary))] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-[rgb(var(--color-primary-hover))]"
            />

            <div className="mt-4 text-sm leading-7 text-[rgb(var(--color-text-muted))]">
                {helpText}
            </div>

            {selectedFile ? (
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-[18px] border border-[rgb(var(--color-border))] bg-white px-4 py-3">
                    <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-semibold text-[rgb(var(--color-text-strong))]">
                            {selectedFile.name}
                        </div>
                        <div className="mt-1 text-xs text-[rgb(var(--color-text-muted))]">
                            {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={onClear}
                        className="btn-secondary whitespace-nowrap"
                    >
                        Remove
                    </button>
                </div>
            ) : null}

            {error ? (
                <div className="mt-3 text-sm text-red-600">{error}</div>
            ) : null}
        </div>
    );
}
