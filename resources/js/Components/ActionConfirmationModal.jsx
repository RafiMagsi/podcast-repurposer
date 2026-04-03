import Modal from '@/Components/Modal';

export default function ActionConfirmationModal({
    show,
    onClose,
    onConfirm,
    title = 'Are you sure?',
    message = '',
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    processing = false,
    variant = 'default', // default | warning
}) {
    const iconWrapperClass =
        variant === 'warning'
            ? 'border-amber-200 bg-amber-50 text-amber-600'
            : 'border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface-2))] text-[rgb(var(--color-text-muted))]';

    const confirmButtonClass =
        variant === 'warning'
            ? 'inline-flex items-center justify-center rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm font-medium text-amber-700 transition hover:bg-amber-100 disabled:opacity-60'
            : 'btn-primary';

    return (
        <Modal show={show} maxWidth="md" onClose={onClose}>
            <div className="p-6">
                <div className="flex items-start gap-3">
                    <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border ${iconWrapperClass}`}>
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                        >
                            <path d="M3 12a9 9 0 0 1 15.3-6.3" />
                            <path d="M18 3v4h-4" />
                            <path d="M21 12a9 9 0 0 1-15.3 6.3" />
                            <path d="M6 21v-4h4" />
                        </svg>
                    </div>

                    <div className="min-w-0 flex-1">
                        <h3 className="text-base font-semibold text-[rgb(var(--color-text))]">
                            {title}
                        </h3>

                        <p className="mt-2 text-sm leading-6 text-[rgb(var(--color-text-muted))]">
                            {message}
                        </p>
                    </div>
                </div>

                <div className="mt-6 flex items-center justify-end gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="btn-secondary"
                        disabled={processing}
                    >
                        {cancelText}
                    </button>

                    <button
                        type="button"
                        onClick={onConfirm}
                        className={confirmButtonClass}
                        disabled={processing}
                    >
                        {processing ? 'Processing...' : confirmText}
                    </button>
                </div>
            </div>
        </Modal>
    );
}