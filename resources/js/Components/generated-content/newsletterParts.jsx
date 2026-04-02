export function newsletterParts(body = '') {
    const trimmed = (body || '').trim();

    if (!trimmed) {
        return { subject: '', content: '' };
    }

    const lines = trimmed.split('\n');
    const firstLine = lines[0]?.trim() || '';

    if (firstLine.toLowerCase().startsWith('subject:')) {
        return {
            subject: firstLine.replace(/^subject:\s*/i, '').trim(),
            content: lines.slice(1).join('\n').trim(),
        };
    }

    return {
        subject: '',
        content: trimmed,
    };
}