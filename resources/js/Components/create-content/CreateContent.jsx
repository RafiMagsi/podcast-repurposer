import { useEffect, useRef, useState } from 'react';
import { useForm } from '@inertiajs/react';
import Modal from '@/Components/Modal';
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
        value: 'recording',
        title: '1-minute recording',
        description: 'Use the same upload flow for a raw voice recording captured from your device.',
        icon: 'R',
        iconClass: 'profile-icon-green',
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
    ['3', 'Review real outputs', 'Summary, LinkedIn post, X post, Instagram caption, and newsletter are reviewed where the actual data exists.'],
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
        source_type: 'text',
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

    const isTextSource = data.source_type === 'text';
    const usageLimitReached = Boolean(usageLimits?.reached);
    const textLength = data.source_text.length;
    const fileError = errors.source_file || errors.audio;
    const resolvedFileHelpText =
        fileHelpText ??
        `Supported formats: MP3, WAV, M4A, MP4, MOV, WebM. Audio and recordings must be ${resolvedUploadLimits.audio.label} or less. Video uploads must be ${resolvedUploadLimits.video.label} or less.`;

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
            },
            onFinish: () => {
                transform((current) => current);

                if (isTextSource) {
                    setShowUploadProgress(false);
                    setUploadProgress(null);
                    setIsWaitingForServer(false);
                    return;
                }

                uploadFinishTimeoutRef.current = window.setTimeout(() => {
                    setShowUploadProgress(false);
                    setUploadProgress(null);
                    setIsIndeterminateUpload(false);
                    setIsWaitingForServer(false);
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
            return;
        }

        if (isTextSource && !data.source_text.trim()) {
            setError('source_text', 'A short source is required.');
            return;
        }

        setIsLoadingSuggestions(true);
        setShowSuggestionsModal(true);

        try {
            const nextSuggestions = await requestSuggestions();
            setSuggestions(nextSuggestions);
            setPendingSuggestion(nextSuggestions[0] ?? '');
        } catch (error) {
            setSuggestionError(error.message || 'Unable to generate suggestions right now.');
        } finally {
            setIsLoadingSuggestions(false);
        }
    };

    const uploadStatusMessage =
        uploadProgress != null && uploadProgress >= 100 && processing
            ? isWaitingForServer
                ? 'Upload sent. Finalizing request and redirecting...'
                : 'Upload complete.'
            : uploadProgress != null
            ? `Uploading ${Math.round(uploadProgress)}%`
            : 'Preparing upload...';

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
        <div className={`app-card overflow-hidden ${className}`}>
            {showCardHeader ? (
                <div className="border-b border-[rgb(var(--color-border))] px-6 py-5">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <div className="app-badge-neutral">Create Content</div>
                            <h2 className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-[rgb(var(--color-text-strong))]">
                                Start with one short source.
                            </h2>
                        </div>

                        <div className="tab-group">
                            <div className="tab-item tab-item-active">Create</div>
                            <div className="tab-item">Recurring prompts</div>
                        </div>
                    </div>
                </div>
            ) : null}

            <div className="grid gap-8 p-6 2xl:grid-cols-[minmax(0,1.22fr)_360px]">
                <div>
                    <div className="grid gap-3 lg:grid-cols-1">
                        {sourceOptions.map((option) => (
                            <button
                                key={option.value}
                                type="button"
                                onClick={() => handleSourceTypeChange(option.value)}
                                className={`profile-card min-h-[unset] px-5 py-5 text-left ${data.source_type === option.value ? 'profile-card-active' : ''}`}
                            >
                                <div className="flex items-start gap-4">
                                    <div
                                        className={`profile-icon ${option.iconClass} mt-0.5 text-sm font-semibold text-[rgb(var(--color-text-strong))]`}
                                    >
                                        {option.icon}
                                    </div>

                                    <div className="min-w-0 flex-1">
                                        <div className="text-[18px] font-semibold leading-8 text-[rgb(var(--color-text-strong))]">
                                            {option.title}
                                        </div>
                                        <div className="mt-1 text-sm leading-7 text-[rgb(var(--color-text-muted))]">
                                            {option.description}
                                        </div>
                                    </div>
                                </div>
                            </button>
                        ))}
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

                    <form onSubmit={submit} className="mt-6 space-y-5">
                        {usageLimits ? (
                            <div className={`rounded-[20px] border px-5 py-4 ${
                                usageLimitReached
                                    ? 'border-[rgba(225,29,72,0.18)] bg-[rgba(225,29,72,0.04)]'
                                    : 'border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface-soft))]'
                            }`}>
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                    <div>
                                        <div className="text-xs uppercase tracking-[0.18em] text-[rgb(var(--color-text-faint))]">
                                            Usage remaining
                                        </div>
                                        <div className="mt-2 text-lg font-semibold text-[rgb(var(--color-text-strong))]">
                                            {usageLimits.remaining} of {usageLimits.limit} runs left
                                        </div>
                                        <div className="mt-1 text-sm leading-6 text-[rgb(var(--color-text-muted))]">
                                            ${usageLimits.plan_price_usd} plan. Every new request uses one run.
                                        </div>
                                    </div>
                                    <div className="min-w-[180px]">
                                        <div className="usage-bar-track">
                                            <div className="usage-bar-fill" style={{ width: `${usageLimits.percent_used}%` }} />
                                        </div>
                                        <div className="mt-2 text-sm text-[rgb(var(--color-text-muted))]">
                                            {usageLimits.used} used
                                        </div>
                                    </div>
                                </div>
                                {usageLimitReached ? (
                                    <div className="mt-3 text-sm leading-6 text-[rgb(var(--color-text-muted))]">
                                        The current quota is exhausted. New processing is blocked until the limit is increased.
                                    </div>
                                ) : null}
                            </div>
                        ) : null}

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
                            {errors.title && <p className="form-error">{errors.title}</p>}
                        </div>

                        <div className="grid gap-5">
                            {data.source_type === 'text' ? (
                            <div className="mt-5">
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
                                {errors.source_text ? (
                                    <div className="mt-2 text-sm text-red-600">{errors.source_text}</div>
                                ) : null}
                            </div>
                        ) : (
                            <>
                                {data.source_mode === 'upload' ? (
                                    <UploadSourcePanel
                                        sourceType={data.source_type}
                                        selectedFile={data.source_file}
                                        error={errors.source_file}
                                        onFileChange={handleUploadFile}
                                        onClear={clearSelectedFile}
                                    />
                                ) : null}

                                {data.source_mode === 'record' && data.source_type === 'audio' ? (
                                    <AudioRecorder onRecorded={handleRecordedFile} maxSeconds={60} />
                                ) : null}

                                {data.source_mode === 'record' && data.source_type === 'video' ? (
                                    <VideoRecorder onRecorded={handleRecordedFile} maxSeconds={60} />
                                ) : null}

                                {data.source_mode !== 'record' ? (
                                    <MediaPreviewCard
                                        file={data.source_file}
                                        sourceType={data.source_type}
                                        sourceText={data.source_text}
                                    />
                                ) : null}
                            </>
                        )}

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

                        {showUploadProgress && data.source_type !== 'text' ? (
                            <div className="mt-4 rounded-[18px] border border-[rgb(var(--color-border))] bg-white p-4">
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
                                            <button type="button" onClick={cancelUpload} className="btn-secondary">
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

                        <div className="flex flex-col gap-4 2xl:flex-row 2xl:items-center 2xl:justify-between">
                            <p className="max-w-2xl pr-0 text-sm leading-7 text-[rgb(var(--color-text-muted))] 2xl:pr-8">
                                {isTextSource
                                    ? 'Text notes skip transcription and go straight into content generation.'
                                    : 'File uploads run through transcription first, then generate content outputs.'}
                            </p>

                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
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
                                    {usageLimitReached ? 'Usage limit reached' : processing ? 'Processing...' : submitLabel}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>

                <div className="mt-4 rounded-[20px] border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface-soft))] p-5">
                    <div className="text-xs uppercase tracking-[0.18em] text-[rgb(var(--color-text-faint))]">
                        Limits
                    </div>
                    <div className="mt-3 space-y-3 text-sm leading-7 text-[rgb(var(--color-text-muted))]">
                        <p>Video, audio, or recording: 1 minute</p>
                        <p>Text note: 200 characters</p>
                        <p>Outputs: summary, LinkedIn post, X post, Instagram caption, and newsletter from one idea.</p>
                    </div>
                </div>

                <div className="rounded-[28px] border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface-soft))] p-5 xl:sticky xl:top-24">
                    <div className="app-badge-neutral">After You Submit</div>
                    <h3 className="mt-4 text-xl font-semibold tracking-[-0.03em] text-[rgb(var(--color-text-strong))]">
                        You go straight to the recording workspace.
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-[rgb(var(--color-text-muted))]">
                        The dashboard is only for starting the run. Once submitted, the real transcript,
                        processing states, and content responses live on the recording page.
                    </p>

                    <div className="mt-5 space-y-3">
                        {handoffSteps.map(([step, title, description], index) => (
                            <div key={step} className="profile-card">
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

                    <div className="mt-5 rounded-[20px] border border-[rgb(var(--color-border))] bg-white px-4 py-4">
                        <div className="text-xs uppercase tracking-[0.18em] text-[rgb(var(--color-text-faint))]">
                            Best use of this space
                        </div>
                        <div className="mt-2 text-sm leading-6 text-[rgb(var(--color-text-muted))]">
                            Source selection, limits, and expectation-setting before the handoff.
                            The recording workspace handles the real content review.
                        </div>
                    </div>
                </div>
            </div>

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

                    {!isLoadingSuggestions && suggestionError ? (
                        <div className="rounded-[20px] border border-[rgba(225,29,72,0.18)] bg-[rgba(225,29,72,0.04)] px-5 py-4">
                            <div className="text-sm font-medium text-[rgb(var(--color-text-strong))]">
                                Suggestions are unavailable right now.
                            </div>
                            <div className="mt-1 text-sm leading-6 text-[rgb(var(--color-text-muted))]">
                                {suggestionError}
                            </div>
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
        </div>
    );
}
