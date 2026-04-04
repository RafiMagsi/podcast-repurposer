import { useEffect, useRef, useState } from 'react';
import { useForm } from '@inertiajs/react';
import Modal from '@/Components/Modal';
import AppCard from '@/Components/ui/AppCard';
import SourceModeSelector from '@/Components/content-requests/SourceModeSelector';
import UploadSourcePanel from '@/Components/content-requests/UploadSourcePanel';
import AudioRecorder from '@/Components/content-requests/AudioRecorder';
import VideoRecorder from '@/Components/content-requests/VideoRecorder';
import MediaPreviewCard from '@/Components/content-requests/MediaPreviewCard';

const sourceOptions = [
    {
        value: 'video',
        title: '1-minute video',
        description: 'Upload a short MP4, MOV, or WebM clip and extract the transcript from it.',
        icon: 'V',
        iconClass: 'profile-icon-orange',
    },
    {
        value: 'audio',
        title: '1-minute audio',
        description: 'Drop in an MP3, WAV, or M4A file to generate content from clean spoken audio.',
        icon: 'A',
        iconClass: 'profile-icon-blue',
    },
    {
        value: 'text',
        title: '200-character sentence',
        description: 'Paste one short idea and turn it into content without uploading a file.',
        icon: 'T',
        iconClass: 'profile-icon-purple',
    },
];

const defaultTones = [
    { label: 'Professional', value: 'professional' },
    { label: 'Engaging', value: 'engaging' },
    { label: 'Concise', value: 'concise' },
];

const handoffSteps = [
    ['1', 'Redirect immediately', 'The app sends you to the recording workspace as soon as the request is accepted.'],
    ['2', 'Track live progress', 'Processing status, transcript generation, and retries happen there instead of on the dashboard.'],
    ['3', 'Review five outputs', 'Summary, LinkedIn post, X post, Instagram caption, and newsletter are reviewed where the actual data exists.'],
];

const outputPreviewCards = [
    ['Summary', 'Clean overview'],
    ['LinkedIn', 'Professional draft'],
    ['X Post', 'Short-form version'],
    ['Instagram', 'Caption + hashtags'],
    ['Newsletter', 'Subject + body'],
];

export default function CreateContent({
    tones = [],
    uploadLimits = null,
    usageLimits = null,
    showCardHeader = true,
    showCancelButton = false,
    preserveScroll = false,
    titlePlaceholder = 'e.g. Founder lesson on pricing after one sales call',
    submitLabel = 'Create content',
    fileHelpText = null,
    className = '',
}) {
    const toneOptions = tones.length > 0 ? tones : defaultTones;
    const resolvedUploadLimits = uploadLimits ?? {
        video: { bytes: 300 * 1024 * 1024, label: '300 MB' },
        audio: { bytes: 25 * 1024 * 1024, label: '25 MB' },
    };

    const { data, setData, post, processing, progress, errors, clearErrors, setError, cancel, transform } = useForm({
        title: '',
        tone: toneOptions[0]?.value || 'professional',
        source_type: sourceOptions[0]?.value || 'video',
        source_mode: 'upload',
        source_file: null,
        source_text: '',
        selected_suggestion: '',
    });

    const uploadFinishTimeoutRef = useRef(null);
    const [uploadProgress, setUploadProgress] = useState(null);
    const [showUploadProgress, setShowUploadProgress] = useState(false);
    const [isIndeterminateUpload, setIsIndeterminateUpload] = useState(false);
    const [isWaitingForServer, setIsWaitingForServer] = useState(false);
    const [showSuggestionsModal, setShowSuggestionsModal] = useState(false);
    const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
    const [suggestionError, setSuggestionError] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [pendingSuggestion, setPendingSuggestion] = useState('');
    const [showErrorModal, setShowErrorModal] = useState(false);
    const [errorModalTitle, setErrorModalTitle] = useState('Something needs attention');
    const [errorMessages, setErrorMessages] = useState([]);
    const [isRedirectingToWorkspace, setIsRedirectingToWorkspace] = useState(false);

    const isTextSource = data.source_type === 'text';
    const usageLimitReached = Boolean(usageLimits?.reached);
    const textLength = data.source_text.length;
    const fileError = errors.source_file || errors.audio;
    const resolvedFileHelpText =
        fileHelpText ??
        `Supported formats: MP3, WAV, M4A, MP4, MOV, WebM. Audio uploads must be ${resolvedUploadLimits.audio.label} or less. Video uploads must be ${resolvedUploadLimits.video.label} or less.`;

    const fileLimitForSourceType = (sourceType) =>
        sourceType === 'video' ? resolvedUploadLimits.video : resolvedUploadLimits.audio;

    const fileLimitMessage = (sourceType) =>
        sourceType === 'video'
            ? `Video uploads must be ${resolvedUploadLimits.video.label} or less.`
            : `Audio uploads must be ${resolvedUploadLimits.audio.label} or less.`;

    const validateSourceFile = (file, sourceType = data.source_type) => {
        if (!file) {
            clearErrors('source_file');
            return true;
        }

        const limit = fileLimitForSourceType(sourceType);

        if (file.size > limit.bytes) {
            setError('source_file', fileLimitMessage(sourceType));
            return false;
        }

        clearErrors('source_file');

        return true;
    };

    const openErrorModal = (messages, title = 'Something needs attention') => {
        const nextMessages = (Array.isArray(messages) ? messages : [messages])
            .map((message) => String(message || '').trim())
            .filter(Boolean);

        if (nextMessages.length === 0) {
            return;
        }

        setErrorModalTitle(title);
        setErrorMessages([...new Set(nextMessages)]);
        setShowErrorModal(true);
    };

    const handleFileChange = (event) => {
        const nextFile = event.target.files[0] || null;
        setData('source_file', nextFile);

        if (!nextFile) {
            clearErrors('source_file');
            return;
        }

        if (!validateSourceFile(nextFile)) {
            setData('source_file', null);
            event.target.value = '';
        }
    };

    useEffect(() => {
        if (progress?.percentage != null) {
            setShowUploadProgress(true);
            setUploadProgress(progress.percentage);
            setIsIndeterminateUpload(false);
        }
    }, [progress?.percentage]);

    useEffect(() => {
        const nextErrors = Object.values(errors ?? {}).filter(Boolean);

        if (nextErrors.length > 0) {
            openErrorModal(nextErrors, 'Please fix this before continuing');
        }
    }, [errors]);

    useEffect(() => {
        return () => {
            if (uploadFinishTimeoutRef.current) {
                window.clearTimeout(uploadFinishTimeoutRef.current);
            }
        };
    }, []);

    const cancelUpload = () => {
        cancel();
        if (uploadFinishTimeoutRef.current) {
            window.clearTimeout(uploadFinishTimeoutRef.current);
        }
        setShowUploadProgress(false);
        setUploadProgress(null);
        setIsIndeterminateUpload(false);
        setIsWaitingForServer(false);
        setIsRedirectingToWorkspace(false);
    };

    const resetSuggestionState = () => {
        setData('selected_suggestion', '');
        setPendingSuggestion('');
        setSuggestions([]);
        setSuggestionError('');
    };

    const submitContent = (selectedSuggestion = '') => {
        transform((current) => ({
            ...current,
            selected_suggestion: selectedSuggestion || '',
        }));

        post(route('content-requests.store'), {
            forceFormData: true,
            preserveScroll: true,
            onStart: () => {
                setIsRedirectingToWorkspace(false);
                if (!isTextSource) {
                    setShowUploadProgress(true);
                    setUploadProgress((current) => current ?? 1);
                    setIsIndeterminateUpload(true);
                }
            },
            onProgress: (event) => {
                if (typeof event?.percentage === 'number') {
                    setShowUploadProgress(true);
                    setUploadProgress(event.percentage);
                    setIsIndeterminateUpload(false);

                    if (event.percentage >= 100) {
                        setIsWaitingForServer(true);
                    }
                }
            },
            onSuccess: () => {
                setIsWaitingForServer(false);
                setIsRedirectingToWorkspace(true);
            },
            onError: (nextErrors) => {
                setIsWaitingForServer(false);
                setIsRedirectingToWorkspace(false);
                setShowUploadProgress(false);
                setUploadProgress(null);
                setIsIndeterminateUpload(false);

                const messages = Object.values(nextErrors ?? {}).filter(Boolean);

                if (messages.length > 0) {
                    openErrorModal(messages, 'Unable to start this run');
                }
            },
            onFinish: () => {
                transform((current) => current);

                if (isTextSource) {
                    setShowUploadProgress(false);
                    setUploadProgress(null);
                    setIsWaitingForServer(false);
                    setIsRedirectingToWorkspace(false);
                    return;
                }

                uploadFinishTimeoutRef.current = window.setTimeout(() => {
                    setShowUploadProgress(false);
                    setUploadProgress(null);
                    setIsIndeterminateUpload(false);
                    setIsWaitingForServer(false);
                    setIsRedirectingToWorkspace(false);
                }, 250);
            },
        });
    };

    const requestSuggestions = async () => {
        const response = await window.axios.post(route('content-requests.suggestions'), {
            title: data.title,
            tone: data.tone,
            source_type: data.source_type,
            source_text: isTextSource ? data.source_text : '',
        }, {
            headers: {
                Accept: 'application/json',
            },
            withCredentials: true,
        }).catch((error) => {
            const message = error?.response?.data?.message || 'Unable to generate suggestions right now.';

            throw new Error(message);
        });

        return Array.isArray(response?.data?.suggestions) ? response.data.suggestions : [];
    };

    const submit = async (e) => {
        e.preventDefault();

        if (!isTextSource && data.source_file && !validateSourceFile(data.source_file)) {
            return;
        }

        setSuggestionError('');

        if (!data.title.trim()) {
            setError('title', 'A recording title is required.');
            openErrorModal('A recording title is required.', 'Missing title');
            return;
        }

        if (isTextSource && !data.source_text.trim()) {
            setError('source_text', 'A short source is required.');
            openErrorModal('A short source is required.', 'Missing text source');
            return;
        }

        setIsLoadingSuggestions(true);
        setShowSuggestionsModal(true);

        try {
            const nextSuggestions = await requestSuggestions();
            setSuggestions(nextSuggestions);
            setPendingSuggestion(nextSuggestions[0] ?? '');
        } catch (error) {
            const message = error.message || 'Unable to generate suggestions right now.';
            setSuggestionError(message);
            openErrorModal(message, 'Suggestions are unavailable');
        } finally {
            setIsLoadingSuggestions(false);
        }
    };

    const uploadStatusMessage =
        uploadProgress != null && uploadProgress >= 100 && processing
            ? isWaitingForServer || isRedirectingToWorkspace
                ? 'Upload sent. Finalizing request and opening the workspace...'
                : 'Upload complete.'
            : uploadProgress != null
            ? `Uploading ${Math.round(uploadProgress)}%`
            : 'Preparing upload...';

    const sourceTypeMeta = {
        video: {
            eyebrow: 'Video source',
            title: 'Upload or record one focused video clip.',
            detail: `Keep it under 1 minute and ${resolvedUploadLimits.video.label}. VoicePost AI extracts the audio first, then generates the final outputs.`,
        },
        audio: {
            eyebrow: 'Audio source',
            title: 'Use a short audio clip with clear spoken voice.',
            detail: `Keep it under 1 minute and ${resolvedUploadLimits.audio.label}. MP3, WAV, M4A, and WebM audio are supported.`,
        },
        text: {
            eyebrow: 'Text source',
            title: 'Paste one short idea and generate from that angle.',
            detail: 'Keep it under 200 characters. Text sources skip transcription and go straight into content generation.',
        },
    }[data.source_type];

    const handleSourceTypeChange = (type) => {
        setData((prev) => ({
            ...prev,
            source_type: type,
            source_mode: type === 'text' ? 'upload' : 'upload',
            source_file: null,
            source_text: type === 'text' ? prev.source_text : '',
            selected_suggestion: '',
        }));

        setPendingSuggestion('');
        setSuggestions([]);
        setSuggestionError('');
        clearErrors('source_file');
        clearErrors('source_text');
    };

    const handleRecordedFile = (file) => {
        resetSuggestionState();
        setData('source_file', file);
        clearErrors('source_file');
    };

    const handleUploadFile = (file) => {
        resetSuggestionState();
        setData('source_file', file);
        clearErrors('source_file');
    };

    const clearSelectedFile = () => {
        resetSuggestionState();
        setData('source_file', null);
        clearErrors('source_file');
    };

    return (
        <>
        <AppCard variant="compact" padding="none" className={`overflow-hidden ${className}`}>
            {showCardHeader ? (
                <div className="border-b border-[rgb(var(--color-border))] px-5 py-4">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <div className="app-badge-neutral">Create Content</div>
                            <h2 className="mt-2 app-heading-md">
                                Turn one short source into ready-to-post content.
                            </h2>
                        </div>

                        <div className="tab-group-compact">
                            <div className="tab-item-compact tab-item-compact-active">Create</div>
                            <div className="tab-item-compact">Outputs</div>
                        </div>
                    </div>
                </div>
            ) : null}

            <div className="grid gap-4 p-4 sm:gap-5 sm:p-5 2xl:grid-cols-[minmax(0,1fr)_340px] 2xl:items-start">
                <div className="space-y-4">
                    <AppCard variant="muted" padding="md">
                        <div className="text-xs uppercase tracking-[0.18em] text-[rgb(var(--color-text-faint))]">
                            Choose your source type
                        </div>
                        <div className="mt-3 grid gap-2 sm:grid-cols-2 2xl:grid-cols-3">
                        {sourceOptions.map((option) => (
                            <button
                                key={option.value}
                                type="button"
                                onClick={() => handleSourceTypeChange(option.value)}
                                className={`profile-card min-h-[unset] px-3.5 py-3.5 text-left ${data.source_type === option.value ? 'profile-card-active' : ''}`}
                            >
                                <div className="flex items-start gap-3">
                                    <div
                                        className={`profile-icon ${option.iconClass} mt-0.5 h-8 w-8 text-sm font-semibold text-[rgb(var(--color-text-strong))]`}
                                    >
                                        {option.icon}
                                    </div>

                                    <div className="min-w-0 flex-1">
                                        <div className="text-[15px] font-semibold leading-6 text-[rgb(var(--color-text-strong))]">
                                            {option.title}
                                        </div>
                                        <div className="mt-0.5 text-xs leading-5 text-[rgb(var(--color-text-muted))]">
                                            {option.description}
                                        </div>
                                    </div>
                                </div>
                            </button>
                        ))}
                        </div>
                    </AppCard>

                    <form onSubmit={submit} className="space-y-4">
                            <AppCard variant="muted" padding="md">
                                <div className="text-xs uppercase tracking-[0.18em] text-[rgb(var(--color-text-faint))]">
                                    {sourceTypeMeta.eyebrow}
                                </div>
                                <div className="mt-1.5 text-base font-semibold text-[rgb(var(--color-text-strong))]">
                                    {sourceTypeMeta.title}
                                </div>
                                <div className="mt-1.5 text-sm leading-6 text-[rgb(var(--color-text-muted))]">
                                    {sourceTypeMeta.detail}
                                </div>

                                <SourceModeSelector
                                    sourceType={data.source_type}
                                    value={data.source_mode}
                                    onChange={(mode) => {
                                        setData('source_mode', mode);
                                        setData('source_file', null);
                                        clearErrors('source_file');
                                    }}
                                />
                            </AppCard>

                            <AppCard variant="muted" padding="md">
                                <div className="grid gap-4 xl:grid-cols-2">
                                    <div>
                                        <label className="label-theme">Recording title</label>
                                        <input
                                            type="text"
                                            value={data.title}
                                            onChange={(e) => {
                                                setData('title', e.target.value);
                                                clearErrors('title');
                                                resetSuggestionState();
                                            }}
                                            className="input-theme"
                                            placeholder={titlePlaceholder}
                                        />
                                    </div>

                                    <div>
                                        <label className="label-theme">Voice and tone</label>
                                        <select
                                            value={data.tone}
                                            onChange={(e) => {
                                                setData('tone', e.target.value);
                                                resetSuggestionState();
                                            }}
                                            className="select-theme"
                                        >
                                            {toneOptions.map((tone) => (
                                                <option key={tone.value} value={tone.value}>
                                                    {tone.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </AppCard>

                            {data.source_type === 'text' ? (
                            <div className="space-y-3">
                                <AppCard variant="muted" padding="md">
                                    <label className="label-theme">Text Prompt</label>
                                    <textarea
                                        value={data.source_text}
                                        onChange={(e) => {
                                            setData('source_text', e.target.value);
                                            clearErrors('source_text');
                                            resetSuggestionState();
                                        }}
                                        rows={5}
                                        className="input-theme min-h-[140px]"
                                        placeholder="Enter a short idea, note, or spoken-style prompt..."
                                    />
                                    <div className="mt-2 flex items-center justify-between gap-4 text-sm text-[rgb(var(--color-text-muted))]">
                                        <span>Used directly for suggestions and outputs.</span>
                                        <span>{textLength}/200</span>
                                    </div>
                                </AppCard>

                                <div className="note-card-muted">
                                    Keep it short and direct. One sentence with one clear angle works best.
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {data.source_mode === 'upload' ? (
                                    <UploadSourcePanel
                                        sourceType={data.source_type}
                                        selectedFile={data.source_file}
                                        onFileChange={handleUploadFile}
                                        onClear={clearSelectedFile}
                                    />
                                ) : null}

                                {data.source_mode === 'record' && data.source_type === 'audio' ? (
                                    <AudioRecorder
                                        onRecorded={handleRecordedFile}
                                        onError={(message) => openErrorModal(message, 'Recording access issue')}
                                        maxSeconds={60}
                                    />
                                ) : null}

                                {data.source_mode === 'record' && data.source_type === 'video' ? (
                                    <VideoRecorder
                                        onRecorded={handleRecordedFile}
                                        onError={(message) => openErrorModal(message, 'Recording access issue')}
                                        maxSeconds={60}
                                    />
                                ) : null}

                                {data.source_mode !== 'record' ? (
                                    <MediaPreviewCard
                                        file={data.source_file}
                                        sourceType={data.source_type}
                                        sourceText={data.source_text}
                                    />
                                ) : null}
                            </div>
                        )}

                            {showUploadProgress && data.source_type !== 'text' ? (
                            <div className="rounded-[14px] border border-[rgb(var(--color-border))] bg-white p-4">
                                <div className="flex items-center justify-between gap-4">
                                    <div>
                                        <div className="text-sm font-semibold text-[rgb(var(--color-text-strong))]">
                                            Uploading source
                                        </div>
                                        <div className="mt-1 text-sm text-[rgb(var(--color-text-muted))]">
                                            {uploadStatusMessage}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <div className="text-sm font-semibold text-[rgb(var(--color-text-strong))]">
                                            {uploadProgress != null ? `${Math.round(uploadProgress)}%` : '...'}
                                        </div>
                                        {processing ? (
                                            <button type="button" onClick={cancelUpload} className="btn-compact">
                                                Cancel
                                            </button>
                                        ) : null}
                                    </div>
                                </div>

                                <div className="mt-3 h-2 overflow-hidden rounded-full bg-[rgb(var(--color-border))]">
                                    <div
                                        className={`h-full rounded-full bg-[#4B5563] transition-all duration-200 ${
                                            isIndeterminateUpload ? 'upload-progress-indeterminate' : ''
                                        }`}
                                        style={{ width: isIndeterminateUpload ? '35%' : `${uploadProgress ?? 0}%` }}
                                    />
                                </div>
                            </div>
                        ) : null}

                            {(fileError || errors.source_text || errors.title) ? (
                                <div className="rounded-[14px] border border-[rgba(191,61,61,0.18)] bg-[rgb(var(--color-danger-bg))] px-4 py-3 text-sm leading-6 text-[rgb(var(--color-text-strong))]">
                                    {fileError || errors.source_text || errors.title}
                                </div>
                            ) : null}

                            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                                <p className="max-w-2xl pr-0 text-sm leading-6 text-[rgb(var(--color-text-muted))]">
                                    {isTextSource
                                        ? 'Text notes skip transcription and go straight into content generation.'
                                        : 'File uploads run through transcription first, then generate content outputs.'}
                                </p>

                                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:self-start xl:self-center">
                                    {showCancelButton ? (
                                        <button type="button" onClick={() => window.history.back()} className="btn-outline">
                                            Cancel
                                        </button>
                                    ) : null}
                                    <button
                                        type="submit"
                                        disabled={processing || usageLimitReached}
                                        className="btn-primary min-w-[172px] disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        {usageLimitReached
                                            ? 'Usage limit reached'
                                            : processing
                                            ? isRedirectingToWorkspace
                                                ? 'Opening workspace...'
                                                : 'Processing...'
                                            : submitLabel}
                                    </button>
                                </div>
                            </div>
                    </form>
                </div>

                <div className="grid gap-4 lg:grid-cols-2 2xl:sticky 2xl:top-24 2xl:block">
                    <AppCard variant="muted" padding="md">
                        <div>
                            <h1 className="mt-3 app-heading-md">Turn one short source into ready-to-post content.</h1>
                            <p className="app-subheading mt-2 max-w-2xl">
                                Upload a 1-minute video, a 1-minute audio clip, or paste one short text idea. VoicePost AI takes you straight into the workspace while the transcript and outputs are prepared.
                            </p>
                        </div>
                        <div className="app-badge-neutral">New Source</div>
                        <h3 className="mt-3 app-heading-md">
                            Start one short run from this workspace.
                        </h3>
                        <p className="mt-1.5 text-sm leading-6 text-[rgb(var(--color-text-muted))]">
                            Choose video, audio, or text, then move straight into the recording workspace while transcript and output generation run in the background.
                        </p>

                        {usageLimits ? (
                            <div className={`mt-4 rounded-[14px] border px-4 py-3 ${
                                usageLimitReached
                                    ? 'border-[rgba(225,29,72,0.18)] bg-[rgba(225,29,72,0.04)]'
                                    : 'border-[rgb(var(--color-border))] bg-white'
                            }`}>
                                <div className="text-xs uppercase tracking-[0.18em] text-[rgb(var(--color-text-faint))]">
                                    Usage Remaining
                                </div>
                                <div className="mt-1.5 text-base font-semibold text-[rgb(var(--color-text-strong))]">
                                    {usageLimits.remaining} of {usageLimits.limit} runs left
                                </div>
                                <div className="mt-1 text-sm leading-6 text-[rgb(var(--color-text-muted))]">
                                    ${usageLimits.plan_price_usd} plan. Every new request uses one run.
                                </div>
                                <div className="mt-3 usage-bar-track">
                                    <div className="usage-bar-fill" style={{ width: `${usageLimits.percent_used}%` }} />
                                </div>
                                <div className="mt-2 text-sm text-[rgb(var(--color-text-muted))]">
                                    {usageLimits.used} used
                                </div>
                                {usageLimitReached ? (
                                    <div className="mt-3 text-sm leading-6 text-[rgb(var(--color-text-muted))]">
                                        The current quota is exhausted. New processing is blocked until the limit is increased.
                                    </div>
                                ) : null}
                            </div>
                        ) : null}
                    </AppCard>

                    <AppCard variant="muted" padding="md">
                        <div className="text-xs uppercase tracking-[0.18em] text-[rgb(var(--color-text-faint))]">
                            Included Outputs
                        </div>
                        <div className="mt-3 space-y-2.5">
                            {outputPreviewCards.map(([title, description], index) => (
                                <div key={title} className="flex items-center gap-3 rounded-[12px] border border-[rgb(var(--color-border))] bg-white px-3 py-2.5">
                                    <div className={`icon-compact ${
                                        ['profile-icon-purple', 'profile-icon-blue', 'profile-icon-green', 'profile-icon-yellow', 'profile-icon-orange'][index]
                                    } text-[rgb(var(--color-text-strong))]`}>
                                        {index + 1}
                                    </div>
                                    <div className="min-w-0">
                                        <div className="text-sm font-semibold text-[rgb(var(--color-text-strong))]">{title}</div>
                                        <div className="text-xs leading-5 text-[rgb(var(--color-text-muted))]">{description}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </AppCard>

                    <AppCard variant="muted" padding="md" className="lg:col-span-2 2xl:col-span-1">
                        <div className="app-badge-neutral">After You Submit</div>
                        <h3 className="mt-3 app-heading-md">
                            You go straight to the recording workspace.
                        </h3>
                        <p className="mt-1.5 text-sm leading-6 text-[rgb(var(--color-text-muted))]">
                            The real transcript, processing states, and content responses live on the recording page.
                        </p>

                        <div className="mt-4 space-y-2.5">
                            {handoffSteps.map(([step, title, description], index) => (
                                <div key={step} className="profile-card min-h-[unset] p-3.5">
                                    <div
                                        className={`profile-icon ${
                                            ['profile-icon-blue', 'profile-icon-purple', 'profile-icon-green'][index]
                                        } text-sm font-semibold text-[rgb(var(--color-text-strong))]`}
                                    >
                                        {step}
                                    </div>
                                    <div>
                                        <div className="text-sm font-semibold text-[rgb(var(--color-text-strong))]">
                                            {title}
                                        </div>
                                        <div className="text-sm leading-6 text-[rgb(var(--color-text-muted))]">
                                            {description}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="mt-4 rounded-[14px] border border-[rgb(var(--color-border))] bg-white px-4 py-3 text-sm leading-6 text-[rgb(var(--color-text-muted))]">
                            Source selection, limits, and expectation-setting happen here. The workspace handles the real review.
                        </div>
                    </AppCard>

                    <AppCard variant="muted" padding="md" className="lg:col-span-2 2xl:col-span-1">
                        <div className="text-xs uppercase tracking-[0.18em] text-[rgb(var(--color-text-faint))]">
                            Limits
                        </div>
                        <div className="mt-3 space-y-2.5 text-sm leading-6 text-[rgb(var(--color-text-muted))]">
                            <div className="note-card-muted">Video or audio: 1 minute</div>
                            <div className="note-card-muted">Text note: 200 characters</div>
                            <div className="note-card-muted">One run creates all five outputs in one workspace.</div>
                        </div>
                    </AppCard>
                </div>
            </div>
        </AppCard>
            <Modal
                show={showSuggestionsModal}
                maxWidth="2xl"
                onClose={() => {
                    if (!isLoadingSuggestions) {
                        setShowSuggestionsModal(false);
                    }
                }}
            >
                <div className="border-b border-[rgb(var(--color-border))] px-6 py-5">
                    <div className="app-badge-neutral">3 suggestions</div>
                    <h3 className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-[rgb(var(--color-text-strong))]">
                        Pick the direction to generate from.
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-[rgb(var(--color-text-muted))]">
                        VoicePost AI will use your selected direction as the main angle for the final outputs.
                    </p>
                </div>

                <div className="space-y-4 px-6 py-6">
                    {isLoadingSuggestions ? (
                        <div className="rounded-[20px] border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface-soft))] px-5 py-8 text-sm text-[rgb(var(--color-text-muted))]">
                            Generating suggestions...
                        </div>
                    ) : null}

                    {!isLoadingSuggestions && suggestions.length > 0 ? (
                        <div className="space-y-3">
                            {suggestions.map((suggestion, index) => (
                                <button
                                    key={`${index}-${suggestion}`}
                                    type="button"
                                    onClick={() => setPendingSuggestion(suggestion)}
                                    className={`profile-card min-h-[unset] w-full px-5 py-5 text-left ${
                                        pendingSuggestion === suggestion ? 'profile-card-active' : ''
                                    }`}
                                >
                                    <div className="flex items-start gap-4">
                                        <div className="profile-icon profile-icon-blue text-sm font-semibold text-[rgb(var(--color-text-strong))]">
                                            {index + 1}
                                        </div>
                                        <div className="text-sm leading-7 text-[rgb(var(--color-text-strong))]">
                                            {suggestion}
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    ) : null}
                </div>

                <div className="flex flex-col gap-3 border-t border-[rgb(var(--color-border))] px-6 py-5 sm:flex-row sm:items-center sm:justify-end">
                    <button
                        type="button"
                        className="btn-outline"
                        onClick={() => {
                            setShowSuggestionsModal(false);
                        }}
                        disabled={isLoadingSuggestions}
                    >
                        Back
                    </button>
                    <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => {
                            setShowSuggestionsModal(false);
                            if (!isTextSource) {
                                setShowUploadProgress(true);
                                setUploadProgress(1);
                                setIsIndeterminateUpload(true);
                                setIsWaitingForServer(false);
                            }
                            submitContent('');
                        }}
                        disabled={isLoadingSuggestions}
                    >
                        Skip suggestion
                    </button>
                    <button
                        type="button"
                        className="btn-primary min-w-[190px] disabled:cursor-not-allowed disabled:opacity-60"
                        onClick={() => {
                            setData('selected_suggestion', pendingSuggestion);
                            setShowSuggestionsModal(false);
                            if (!isTextSource) {
                                setShowUploadProgress(true);
                                setUploadProgress(1);
                                setIsIndeterminateUpload(true);
                                setIsWaitingForServer(false);
                            }
                            submitContent(pendingSuggestion);
                        }}
                        disabled={isLoadingSuggestions || !pendingSuggestion}
                    >
                        Generate from selection
                    </button>
                </div>
            </Modal>

            <Modal show={showErrorModal} maxWidth="lg" onClose={() => setShowErrorModal(false)}>
                <div className="border-b border-[rgb(var(--color-border))] px-6 py-5">
                    <div className="app-badge-neutral">Create workflow</div>
                    <h3 className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-[rgb(var(--color-text-strong))]">
                        {errorModalTitle}
                    </h3>
                </div>

                <div className="space-y-3 px-6 py-6">
                    {errorMessages.map((message, index) => (
                        <div
                            key={`${index}-${message}`}
                            className="rounded-[18px] border border-[rgba(225,29,72,0.18)] bg-[rgba(225,29,72,0.04)] px-4 py-4 text-sm leading-6 text-[rgb(var(--color-text-strong))]"
                        >
                            {message}
                        </div>
                    ))}
                </div>

                <div className="flex justify-end border-t border-[rgb(var(--color-border))] px-6 py-5">
                    <button type="button" className="btn-primary min-w-[140px]" onClick={() => setShowErrorModal(false)}>
                        Continue editing
                    </button>
                </div>
            </Modal>
        </>
    );
}
