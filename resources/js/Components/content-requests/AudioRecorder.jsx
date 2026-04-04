import { useEffect, useRef, useState } from 'react';

function pickAudioMimeType() {
    const candidates = [
        'audio/mp4;codecs=mp4a.40.2',
        'audio/mp4',
        'audio/webm;codecs=opus',
        'audio/webm',
    ];

    return candidates.find((mimeType) => window.MediaRecorder?.isTypeSupported?.(mimeType)) ?? '';
}

export default function AudioRecorder({ onRecorded, onError, maxSeconds = 60 }) {
    const [isRecording, setIsRecording] = useState(false);
    const [elapsed, setElapsed] = useState(0);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [recordedDuration, setRecordedDuration] = useState(0);
    const [permissionState, setPermissionState] = useState('idle');
    const [levelBars, setLevelBars] = useState(Array.from({ length: 31 }, () => 0.18));

    const mediaRecorderRef = useRef(null);
    const streamRef = useRef(null);
    const chunksRef = useRef([]);
    const timerRef = useRef(null);
    const elapsedRef = useRef(0);
    const audioContextRef = useRef(null);
    const analyserRef = useRef(null);
    const sourceNodeRef = useRef(null);
    const animationFrameRef = useRef(null);

    useEffect(() => {
        return () => {
            stopTracks();
            clearTimer();
            stopVisualizer();
            if (previewUrl) URL.revokeObjectURL(previewUrl);
        };
    }, [previewUrl]);

    const clearTimer = () => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
    };

    const stopTracks = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop());
            streamRef.current = null;
        }
    };

    const stopVisualizer = () => {
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
        }

        if (sourceNodeRef.current) {
            sourceNodeRef.current.disconnect();
            sourceNodeRef.current = null;
        }

        if (audioContextRef.current) {
            audioContextRef.current.close().catch(() => {});
            audioContextRef.current = null;
        }

        analyserRef.current = null;
        setLevelBars(Array.from({ length: 31 }, () => 0.18));
    };

    const startVisualizer = (stream) => {
        stopVisualizer();

        const AudioContextClass = window.AudioContext || window.webkitAudioContext;

        if (!AudioContextClass) {
            return;
        }

        const audioContext = new AudioContextClass();
        const analyser = audioContext.createAnalyser();
        const source = audioContext.createMediaStreamSource(stream);

        analyser.fftSize = 128;
        analyser.smoothingTimeConstant = 0.8;
        source.connect(analyser);

        audioContextRef.current = audioContext;
        analyserRef.current = analyser;
        sourceNodeRef.current = source;

        const buffer = new Uint8Array(analyser.frequencyBinCount);

        const tick = () => {
            if (!analyserRef.current) {
                return;
            }

            analyserRef.current.getByteFrequencyData(buffer);

            const barCount = 31;
            const midpoint = Math.floor(barCount / 2);
            const bucketSize = Math.max(1, Math.floor(buffer.length / barCount));
            const nextBars = Array.from({ length: barCount }, (_, index) => {
                const start = index * bucketSize;
                const slice = buffer.slice(start, start + bucketSize);
                const average = slice.length
                    ? slice.reduce((sum, value) => sum + value, 0) / slice.length
                    : 0;
                const normalized = average / 255;
                const distanceFromCenter = Math.abs(index - midpoint) / midpoint;
                const centerWeight = 1 - distanceFromCenter * 0.45;
                const eased = Math.pow(normalized, 0.82) * centerWeight;

                return Math.max(0.14, Math.min(0.98, eased));
            });

            setLevelBars(nextBars);
            animationFrameRef.current = requestAnimationFrame(tick);
        };

        tick();
    };

    const formatDuration = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;

        return `${mins}:${String(secs).padStart(2, '0')}`;
    };

    const startRecording = async () => {
        try {
            setPermissionState('requesting');

            if (previewUrl) {
                URL.revokeObjectURL(previewUrl);
                setPreviewUrl(null);
            }

            setRecordedDuration(0);
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: true,
            });

            setPermissionState('granted');
            streamRef.current = stream;
            chunksRef.current = [];
            startVisualizer(stream);

            const mimeType = pickAudioMimeType();
            const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
            mediaRecorderRef.current = recorder;

            recorder.ondataavailable = (event) => {
                if (event.data && event.data.size > 0) {
                    chunksRef.current.push(event.data);
                }
            };

            recorder.onstop = () => {
                const blob = new Blob(chunksRef.current, {
                    type: recorder.mimeType || 'audio/webm',
                });

                const url = URL.createObjectURL(blob);
                setPreviewUrl(url);

                const extension = blob.type.includes('mp4')
                    ? 'm4a'
                    : blob.type.includes('mpeg')
                    ? 'mp3'
                    : blob.type.includes('wav')
                    ? 'wav'
                    : 'webm';

                const file = new File([blob], `audio-recording-${Date.now()}.${extension}`, {
                    type: blob.type || 'audio/webm',
                });

                onRecorded(file);

                stopTracks();
                clearTimer();
                stopVisualizer();
                setIsRecording(false);
                setRecordedDuration(elapsedRef.current || maxSeconds);
                setElapsed(0);
                elapsedRef.current = 0;
            };

            recorder.start();
            setIsRecording(true);
            setElapsed(0);
            elapsedRef.current = 0;

            timerRef.current = setInterval(() => {
                setElapsed((prev) => {
                    const next = prev + 1;
                    elapsedRef.current = next;
                    if (next >= maxSeconds) {
                        stopRecording();
                    }
                    return next;
                });
            }, 1000);
        } catch (error) {
            setPermissionState('denied');
            onError?.('Microphone access was denied or is not available.');
        }
    };

    const stopRecording = () => {
        const recorder = mediaRecorderRef.current;
        if (recorder && recorder.state !== 'inactive') {
            recorder.stop();
        }
    };

    const retake = () => {
        if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
            setPreviewUrl(null);
        }
        stopVisualizer();
        onRecorded(null);
        setElapsed(0);
        setRecordedDuration(0);
        elapsedRef.current = 0;
        setPermissionState('idle');
    };

    return (
        <div className="rounded-[16px] border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface-soft))] p-4">
            <div className="text-xs uppercase tracking-[0.18em] text-[rgb(var(--color-text-faint))]">
                Audio recording
            </div>

            <div className="mt-2 text-sm leading-6 text-[rgb(var(--color-text-muted))]">
                Record up to {maxSeconds} seconds. Microphone access is required.
            </div>

            <div className="recording-status-panel mt-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <div className="recording-status-label">
                            {isRecording ? 'Recording now' : previewUrl ? 'Recording captured' : 'Ready to record'}
                        </div>
                        <div className="recording-status-text">
                            {isRecording
                                ? 'VoicePost AI is capturing live microphone audio.'
                                : previewUrl
                                ? `Saved preview ready. Duration ${formatDuration(recordedDuration)}.`
                                : 'Start when you are ready. The recorder will stop automatically at 1 minute.'}
                        </div>
                    </div>

                    <div className={`recording-pill ${isRecording ? 'recording-pill-live' : ''}`}>
                        <span className="recording-pill-dot" />
                        {isRecording ? 'Live' : previewUrl ? 'Saved' : 'Idle'}
                    </div>
                </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2.5">
                {!isRecording ? (
                    <button type="button" onClick={startRecording} className="btn-primary">
                        {previewUrl ? 'Record again' : 'Start recording'}
                    </button>
                ) : (
                    <button type="button" onClick={stopRecording} className="btn-danger">
                        Stop recording
                    </button>
                )}

                <button type="button" onClick={retake} className="btn-secondary" disabled={isRecording && !previewUrl}>
                    Retake
                </button>

                <div className="text-sm font-semibold text-[rgb(var(--color-text-strong))]">
                    {isRecording ? `${elapsed}s / ${maxSeconds}s` : previewUrl ? formatDuration(recordedDuration) : `0s / ${maxSeconds}s`}
                </div>
            </div>

            <div className={`recording-visualizer mt-3 ${isRecording ? 'recording-visualizer-live' : ''}`}>
                {levelBars.map((level, index) => (
                    <span
                        key={index}
                        className="recording-visualizer-bar"
                        style={{
                            transform: `scaleY(${level})`,
                            opacity: 0.34 + level * 0.66,
                        }}
                    />
                ))}
            </div>

            {permissionState === 'denied' ? (
                <div className="mt-3 rounded-[14px] border border-[rgba(191,61,61,0.18)] bg-[rgb(var(--color-danger-bg))] px-4 py-3.5">
                    <div className="text-sm font-semibold text-[rgb(var(--color-danger-text))]">
                        Microphone access is blocked.
                    </div>
                    <div className="mt-1 text-sm leading-6 text-[rgb(var(--color-text-muted))]">
                        Allow microphone access in your browser settings, then try recording again.
                    </div>
                </div>
            ) : null}

            {previewUrl ? (
                <div className="mt-3 flex h-[110px] items-center rounded-[14px] border border-[rgb(var(--color-border))] bg-white px-4">
                    <audio controls className="w-full" src={previewUrl}>
                        Your browser does not support audio playback.
                    </audio>
                </div>
            ) : null}
        </div>
    );
}
