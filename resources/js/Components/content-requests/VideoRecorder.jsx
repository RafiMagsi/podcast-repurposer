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

    const liveVideoRef = useRef(null);
    const mediaRecorderRef = useRef(null);
    const streamRef = useRef(null);
    const chunksRef = useRef([]);
    const timerRef = useRef(null);

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

    const startRecording = async () => {
        try {
            if (previewUrl) {
                URL.revokeObjectURL(previewUrl);
                setPreviewUrl(null);
            }

            const stream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true,
            });

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
                setElapsed(0);
            };

            recorder.start();
            setIsRecording(true);
            setElapsed(0);

            timerRef.current = setInterval(() => {
                setElapsed((prev) => {
                    const next = prev + 1;
                    if (next >= maxSeconds) {
                        stopRecording();
                    }
                    return next;
                });
            }, 1000);
        } catch (error) {
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
        setIsRecording(false);
    };

    return (
        <div className="mt-5 rounded-[24px] border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface-soft))] p-5">
            <div className="text-xs uppercase tracking-[0.18em] text-[rgb(var(--color-text-faint))]">
                Video recording
            </div>

            <div className="mt-3 text-sm text-[rgb(var(--color-text-muted))]">
                Record up to {maxSeconds} seconds. Camera and microphone access are required.
            </div>

            <div className="mt-4 overflow-hidden rounded-[18px] border border-[rgb(var(--color-border))] bg-black">
                <div className="flex h-[320px] items-center justify-center bg-black sm:h-[380px] lg:h-[420px]">
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

            <div className="mt-4 flex flex-wrap items-center gap-3">
                {!isRecording ? (
                    <button type="button" onClick={startRecording} className="btn-primary">
                        Start Video Recording
                    </button>
                ) : (
                    <button type="button" onClick={stopRecording} className="btn-primary">
                        Stop Recording
                    </button>
                )}

                <button type="button" onClick={retake} className="btn-secondary">
                    Retake
                </button>

                <div className="text-sm font-semibold text-[rgb(var(--color-text-strong))]">
                    {elapsed}s / {maxSeconds}s
                </div>
            </div>
        </div>
    );
}
