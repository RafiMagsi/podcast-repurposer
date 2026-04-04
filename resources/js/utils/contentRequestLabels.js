export function formatStatusLabel(status) {
    switch (status) {
        case 'uploaded':
            return 'Uploaded';
        case 'transcribing':
            return 'Transcribing';
        case 'transcribed':
            return 'Transcribed';
        case 'generating':
            return 'Generating';
        case 'completed':
            return 'Completed';
        case 'partial':
            return 'Partial';
        case 'failed':
            return 'Failed';
        case 'cancelled':
            return 'Cancelled';
        default:
            return formatTitleLabel(status);
    }
}

export function formatCompressionStatusLabel(status) {
    switch (status) {
        case 'started':
            return 'Media Prep Started';
        case 'completed':
            return 'Media Prep Completed';
        case 'failed':
            return 'Media Prep Failed';
        case 'cancelled':
            return 'Media Prep Cancelled';
        default:
            return formatTitleLabel(status);
    }
}

export function formatQueueStateLabel(state) {
    return state === 'current' ? 'Current Processing' : 'In Queue';
}

export function formatTitleLabel(value) {
    if (!value) return '';

    return value
        .split(/[_\s-]+/)
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');
}
