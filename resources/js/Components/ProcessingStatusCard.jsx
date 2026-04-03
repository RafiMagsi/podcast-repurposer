import { useEffect, useMemo, useState } from 'react';

function statusClass(status) {
    switch (status) {
        case 'completed':
            return 'status-badge status-completed';
        case 'cancelled':
            return 'status-badge status-cancelled';
        case 'transcribing':
        case 'transcribed':
            return 'status-badge status-transcribing';
        case 'generating':
            return 'status-badge status-generating';
        case 'failed':
            return 'status-badge status-failed';
        default:
            return 'status-badge status-uploaded';
    }
}

function buildStageMeta(contentRequest) {
    const isMediaPrep =
        contentRequest.status === 'transcribing' && contentRequest.compression_status === 'started';

    if (contentRequest.status === 'uploaded') {
        return {
            progressWidth: '14%',
            currentStep: 0,
            stageLabel: 'Source queued',
            aiLines: [
                'Upload accepted',
                'Preparing the pipeline order',
                'Waiting for processing to begin',
            ],
        };
    }

    if (isMediaPrep) {
        return {
            progressWidth: '38%',
            currentStep: 1,
            stageLabel: 'Media prep active',
            aiLines:
                contentRequest.media_kind === 'audio'
                    ? [
                          'Preparing the audio source',
                          'Cleaning and compressing the recording',
                          'Getting the file ready for transcription',
                      ]
                    : [
                          'Preparing preview and source media',
                          'Extracting a clean audio track',
                          'Getting the file ready for transcription',
                      ],
        };
    }

    if (contentRequest.status === 'transcribing') {
        return {
            progressWidth: '58%',
            currentStep: 2,
            stageLabel: 'Transcription running',
            aiLines: [
                'Listening to the source',
                'Converting speech into transcript',
                'Structuring the raw text for generation',
            ],
        };
    }

    if (contentRequest.status === 'transcribed') {
        return {
            progressWidth: '76%',
            currentStep: 3,
            stageLabel: 'Writing prep',
            aiLines: [
                'Transcript is ready',
                'Selecting the strongest angle',
                'Preparing the writing pass',
            ],
        };
    }

    if (contentRequest.status === 'generating') {
        return {
            progressWidth: '91%',
            currentStep: 3,
            stageLabel: 'AI writing',
            aiLines: [
                'Drafting the summary',
                'Writing the LinkedIn post',
                'Shaping the X, Instagram, and newsletter outputs',
            ],
        };
    }

    return {
        progressWidth: '100%',
        currentStep: 3,
        stageLabel: 'Finished',
        aiLines: [],
    };
}

const stepLabels = [
    'Source received',
    'Media prep',
    'Transcript analysis',
    'Content generation',
];

export default function ProcessingStatusCard({ contentRequest, isProcessing, liveStatusLabel }) {
    const stageMeta = useMemo(() => buildStageMeta(contentRequest), [contentRequest]);
    const [activeAiLineIndex, setActiveAiLineIndex] = useState(0);
    const [dotCount, setDotCount] = useState(1);

    useEffect(() => {
        if (!isProcessing || stageMeta.aiLines.length <= 1) {
            setActiveAiLineIndex(0);
            return undefined;
        }

        const interval = window.setInterval(() => {
            setActiveAiLineIndex((current) => (current + 1) % stageMeta.aiLines.length);
        }, 1700);

        return () => window.clearInterval(interval);
    }, [isProcessing, stageMeta.aiLines]);

    useEffect(() => {
        if (!isProcessing) {
            setDotCount(1);
            return undefined;
        }

        const interval = window.setInterval(() => {
            setDotCount((current) => (current % 3) + 1);
        }, 420);

        return () => window.clearInterval(interval);
    }, [isProcessing]);

    const animatedLine = stageMeta.aiLines[activeAiLineIndex] || '';
    const thinkingDots = '.'.repeat(dotCount);

    return (
        <div
            className={`app-card relative overflow-hidden p-5 ${
                isProcessing
                    ? 'border-blue-200 bg-blue-50'
                    : contentRequest.status === 'completed'
                    ? 'border-emerald-200 bg-emerald-50'
                    : contentRequest.status === 'cancelled'
                    ? 'border-amber-200 bg-amber-50'
                    : contentRequest.status === 'failed'
                    ? 'border-red-200 bg-red-50'
                    : ''
            }`}
        >
            <div className="pointer-events-none absolute inset-0">
                {isProcessing ? (
                    <>
                        <div className="absolute -right-12 -top-12 h-36 w-36 rounded-full bg-blue-200/30 blur-3xl animate-pulse" />
                        <div className="absolute right-6 top-4 h-20 w-20 rounded-full bg-indigo-200/25 blur-2xl animate-pulse [animation-delay:600ms]" />
                        <div className="absolute right-24 top-6 text-[13px] text-blue-500/80 animate-pulse">✦</div>
                        <div className="absolute right-12 top-14 text-[11px] text-sky-500/70 animate-pulse [animation-delay:400ms]">✦</div>
                        <div className="absolute right-28 bottom-7 text-[12px] text-indigo-400/70 animate-pulse [animation-delay:900ms]">✦</div>
                    </>
                ) : contentRequest.status === 'completed' ? (
                    <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-emerald-200/30 blur-3xl" />
                ) : contentRequest.status === 'cancelled' ? (
                    <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-amber-200/30 blur-3xl" />
                ) : contentRequest.status === 'failed' ? (
                    <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-red-200/30 blur-3xl" />
                ) : null}
            </div>

            <div className="relative flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div className="max-w-3xl">
                    <div className="flex items-center gap-2">
                        <div className="text-sm font-semibold text-[rgb(var(--color-text))]">
                            Live processing status
                        </div>
                        {isProcessing ? (
                            <span className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white/80 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-blue-700 backdrop-blur-sm">
                                <span className="relative flex h-2.5 w-2.5 items-center justify-center">
                                    <span className="absolute h-2.5 w-2.5 rounded-full bg-blue-400/35 animate-ping" />
                                    <span className="relative h-1.5 w-1.5 rounded-full bg-blue-500" />
                                </span>
                                AI Active
                            </span>
                        ) : null}
                    </div>
                    <p className="mt-1 text-sm leading-6 text-[rgb(var(--color-text-muted))]">
                        {liveStatusLabel}
                    </p>

                    {isProcessing ? (
                        <div className="mt-4 rounded-[18px] border border-white/70 bg-white/80 px-4 py-3 shadow-[0_1px_0_rgba(255,255,255,0.85)_inset] backdrop-blur-sm">
                            <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-blue-700">
                                {stageMeta.stageLabel}
                            </div>
                            <div className="mt-2 text-sm font-medium text-[rgb(var(--color-text-strong))]">
                                {animatedLine}
                                <span className="text-blue-500">{thinkingDots}</span>
                            </div>
                        </div>
                    ) : null}
                </div>

                <div className="flex items-center gap-3">
                    <span className={statusClass(contentRequest.status)}>{contentRequest.status}</span>
                    {contentRequest.compression_status ? (
                        <span className="rounded-full border border-blue-200 bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-blue-700 backdrop-blur-sm">
                            Media prep {contentRequest.compression_status}
                        </span>
                    ) : null}
                    {isProcessing ? (
                        <div className="flex items-center gap-2 rounded-full border border-blue-200 bg-white/80 px-3 py-1.5 shadow-[0_1px_0_rgba(255,255,255,0.8)_inset] backdrop-blur-sm" aria-hidden="true">
                            <span className="relative flex h-3 w-3 items-center justify-center">
                                <span className="absolute h-3 w-3 rounded-full border border-blue-300/70 border-t-blue-500 animate-spin" />
                                <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                            </span>
                            <span className="text-xs font-medium text-blue-700">Thinking</span>
                        </div>
                    ) : null}
                </div>
            </div>

            {isProcessing ? (
                <div className="relative mt-4">
                    <div className="progress-track">
                        <div className="progress-fill" style={{ width: stageMeta.progressWidth }} />
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-[rgb(var(--color-text-faint))]">
                        {stepLabels.map((label, index) => {
                            const isActive = index === stageMeta.currentStep;
                            const isComplete = index < stageMeta.currentStep;

                            return (
                                <div key={label} className="contents">
                                    <span
                                        className={`rounded-full border px-2.5 py-1 shadow-[0_1px_0_rgba(255,255,255,0.85)_inset] backdrop-blur-sm ${
                                            isActive
                                                ? 'border-blue-200 bg-blue-100/80 text-blue-700'
                                                : isComplete
                                                ? 'border-emerald-200 bg-emerald-50/85 text-emerald-700'
                                                : 'border-white/70 bg-white/75'
                                        }`}
                                    >
                                        {label}
                                    </span>
                                    {index < stepLabels.length - 1 ? (
                                        <span className={isComplete ? 'text-emerald-300' : 'text-blue-300'}>→</span>
                                    ) : null}
                                </div>
                            );
                        })}
                    </div>

                    <p className="mt-2 text-xs leading-6 text-[rgb(var(--color-text-faint))]">
                        This page refreshes automatically while processing is in progress.
                    </p>
                </div>
            ) : null}
        </div>
    );
}
