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
                audio: true,
            });

            streamRef.current = stream;
            chunksRef.current = [];

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
        onRecorded(null);
        setElapsed(0);
    };

    return (
        <div className="mt-5 rounded-[24px] border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface-soft))] p-5">
            <div className="text-xs uppercase tracking-[0.18em] text-[rgb(var(--color-text-faint))]">
                Audio recording
            </div>

            <div className="mt-3 text-sm text-[rgb(var(--color-text-muted))]">
                Record up to {maxSeconds} seconds. Microphone access is required.
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3">
                {!isRecording ? (
                    <button type="button" onClick={startRecording} className="btn-primary">
                        Start Recording
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
            {previewUrl ? (
                <div className="mt-4 flex h-[120px] items-center rounded-[16px] border border-[rgb(var(--color-border))] bg-white px-4">
                    <audio controls className="w-full" src={previewUrl}>
                        Your browser does not support audio playback.
                    </audio>
                </div>
            ) : null}
        </div>
    );
}
