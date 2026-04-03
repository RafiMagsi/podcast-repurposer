export default function SourceModeSelector({ sourceType, value, onChange }) {
    if (!['audio', 'video'].includes(sourceType)) {
        return null;
    }

    const uploadLabel = sourceType === 'video' ? 'Upload Video' : 'Upload Audio';
    const recordLabel = sourceType === 'video' ? 'Record Video' : 'Record Audio';

    const baseClass =
        'rounded-[18px] border px-4 py-3 text-sm font-medium transition';
    const activeClass =
        'border-[rgb(var(--color-primary))] bg-[rgb(var(--color-primary-soft))] text-[rgb(var(--color-primary))]';
    const inactiveClass =
        'border-[rgb(var(--color-border))] bg-white text-[rgb(var(--color-text-muted))] hover:border-[rgb(var(--color-border-strong))]';

    return (
        <div className="mt-5">
            <div className="mb-3 text-xs uppercase tracking-[0.18em] text-[rgb(var(--color-text-faint))]">
                Input Method
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
                <button
                    type="button"
                    onClick={() => onChange('upload')}
                    className={`${baseClass} ${value === 'upload' ? activeClass : inactiveClass}`}
                >
                    {uploadLabel}
                </button>

                <button
                    type="button"
                    onClick={() => onChange('record')}
                    className={`${baseClass} ${value === 'record' ? activeClass : inactiveClass}`}
                >
                    {recordLabel}
                </button>
            </div>
        </div>
    );
}