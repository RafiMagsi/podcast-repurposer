import Modal from '@/Components/Modal';

export default function DeleteConfirmationModal({
    show,
    onClose,
    onConfirm,
    title = 'Delete item?',
    message = 'This action cannot be undone.',
    confirmText = 'Delete Permanently',
    cancelText = 'Cancel',
    processing = false,
}) {
    return (
        <Modal show={show} maxWidth="md" onClose={onClose}>
            <div className="p-6 sm:p-7 bg-[rgb(var(--color-surface-2))]">
                <div className="flex items-start gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-red-600">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                        >
                            <path
                                fillRule="evenodd"
                                d="M8.257 3.099c.765-1.36 2.72-1.36 3.485 0l5.58 9.92c.75 1.334-.213 2.981-1.742 2.981H4.42c-1.53 0-2.492-1.647-1.742-2.98l5.58-9.921zM11 13a1 1 0 10-2 0 1 1 0 002 0zm-1-6a1 1 0 00-1 1v3a1 1 0 102 0V8a1 1 0 00-1-1z"
                                clipRule="evenodd"
                            />
                        </svg>
                    </div>

                    <div className="min-w-0 flex-1">
                        <h3 className="text-lg font-semibold tracking-tight text-[rgb(var(--color-text))]">
                            {title}
                        </h3>

                        <p className="mt-2 text-sm leading-6 text-[rgb(var(--color-text-muted))]">
                            {message}
                        </p>

                        <p className="mt-2 text-sm leading-6 text-red-600">
                            This action cannot be undone.
                        </p>
                    </div>
                </div>

                <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
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
                        className="btn-danger"
                        disabled={processing}
                    >
                        {processing ? 'Deleting...' : confirmText}
                    </button>
                </div>
            </div>
        </Modal>
    );
}