import { useEffect, useRef, useState } from 'react';

function pickVideoMimeType() {
    const candidates = [
        'video/mp4;codecs=avc1.42E01E,mp4a.40.2',
        'video/mp4',
        'video/webm;codecs=vp8,opus',
        'video/webm',
    ];

    return candidates.find((mimeType) => window.MediaRecorder?.isTypeSupported?.(mimeType)) ?? '';
}

export default function VideoRecorder({ onRecorded, onError, maxSeconds = 60 }) {
    const [isRecording, setIsRecording] = useState(false);
    const [elapsed, setElapsed] = useState(0);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [recordedDuration, setRecordedDuration] = useState(0);
    const [permissionState, setPermissionState] = useState('idle');

    const liveVideoRef = useRef(null);
    const mediaRecorderRef = useRef(null);
    const streamRef = useRef(null);
    const chunksRef = useRef([]);
    const timerRef = useRef(null);
    const elapsedRef = useRef(0);

    useEffect(() => {
        return () => {
            stopTracks();
            clearTimer();
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
                video: true,
                audio: true,
            });

            setPermissionState('granted');
            streamRef.current = stream;

            if (liveVideoRef.current) {
                liveVideoRef.current.srcObject = stream;
            }

            chunksRef.current = [];

            const mimeType = pickVideoMimeType();
            const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
            mediaRecorderRef.current = recorder;

            recorder.ondataavailable = (event) => {
                if (event.data && event.data.size > 0) {
                    chunksRef.current.push(event.data);
                }
            };

            recorder.onstop = () => {
                const blob = new Blob(chunksRef.current, {
                    type: recorder.mimeType || 'video/webm',
                });

                const url = URL.createObjectURL(blob);
                setPreviewUrl(url);

                const extension = blob.type.includes('mp4')
                    ? 'mp4'
                    : blob.type.includes('quicktime')
                    ? 'mov'
                    : 'webm';

                const file = new File([blob], `video-recording-${Date.now()}.${extension}`, {
                    type: blob.type || 'video/webm',
                });

                onRecorded(file);

                if (liveVideoRef.current) {
                    liveVideoRef.current.srcObject = null;
                }

                stopTracks();
                clearTimer();
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
            onError?.('Camera or microphone access was denied or is not available.');
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

        if (liveVideoRef.current) {
            liveVideoRef.current.srcObject = null;
        }

        stopTracks();
        onRecorded(null);
        setElapsed(0);
        setRecordedDuration(0);
        elapsedRef.current = 0;
        setIsRecording(false);
        setPermissionState('idle');
    };

    return (
        <div className="rounded-[16px] border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface-soft))] p-4">
            <div className="text-xs uppercase tracking-[0.18em] text-[rgb(var(--color-text-faint))]">
                Video recording
            </div>

            <div className="mt-2 text-sm leading-6 text-[rgb(var(--color-text-muted))]">
                Record up to {maxSeconds} seconds. Camera and microphone access are required.
            </div>

            <div className="recording-status-panel mt-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <div className="recording-status-label">
                            {isRecording ? 'Recording now' : previewUrl ? 'Recording captured' : 'Ready to record'}
                        </div>
                        <div className="recording-status-text">
                            {isRecording
                                ? 'Camera and microphone are live. Stop when the clip is ready.'
                                : previewUrl
                                ? `Saved preview ready. Duration ${formatDuration(recordedDuration)}.`
                                : 'Use a clear frame and voice. The recorder will stop automatically at 1 minute.'}
                        </div>
                    </div>

                    <div className={`recording-pill ${isRecording ? 'recording-pill-live' : ''}`}>
                        <span className="recording-pill-dot" />
                        {isRecording ? 'Live' : previewUrl ? 'Saved' : 'Idle'}
                    </div>
                </div>
            </div>

            <div className="mt-3 overflow-hidden rounded-[14px] border border-[rgb(var(--color-border))] bg-black">
                <div className="flex h-[220px] items-center justify-center bg-black sm:h-[280px] lg:h-[340px] xl:h-[380px]">
                    {previewUrl ? (
                        <video controls className="max-h-full max-w-full object-contain" src={previewUrl} />
                    ) : (
                        <video
                            ref={liveVideoRef}
                            autoPlay
                            muted
                            playsInline
                            className="max-h-full max-w-full object-contain"
                        />
                    )}
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

                <button type="button" onClick={retake} className="btn-secondary">
                    Retake
                </button>

                <div className="text-sm font-semibold text-[rgb(var(--color-text-strong))]">
                    {isRecording ? `${elapsed}s / ${maxSeconds}s` : previewUrl ? formatDuration(recordedDuration) : `0s / ${maxSeconds}s`}
                </div>
            </div>

            {permissionState === 'denied' ? (
                <div className="mt-3 rounded-[14px] border border-[rgba(191,61,61,0.18)] bg-[rgb(var(--color-danger-bg))] px-4 py-3.5">
                    <div className="text-sm font-semibold text-[rgb(var(--color-danger-text))]">
                        Camera or microphone access is blocked.
                    </div>
                    <div className="mt-1 text-sm leading-6 text-[rgb(var(--color-text-muted))]">
                        Allow camera and microphone access in your browser settings, then try recording again.
                    </div>
                </div>
            ) : null}
        </div>
    );
}
