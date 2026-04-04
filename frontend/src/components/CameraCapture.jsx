import { useRef, useState, useCallback } from 'react';
import { Camera, ShieldCheck, RefreshCw, CheckCircle, Lock } from 'lucide-react';

/**
 * CameraCapture — Live camera enforced capture (SRS FR-4B.2)
 * Uses MediaDevices.getUserMedia() — NO file/gallery picker allowed.
 * Returns base64-encoded JPEG to parent via onCapture callback.
 */
export default function CameraCapture({ onCapture, onCancel }) {
  const videoRef   = useRef(null);
  const canvasRef  = useRef(null);
  const streamRef  = useRef(null);
  const [phase, setPhase]     = useState('idle'); // idle | streaming | preview
  const [preview, setPreview] = useState(null);
  const [error, setError]     = useState('');

  const startCamera = useCallback(async () => {
    setError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      setPhase('streaming');
    } catch (err) {
      setError(`Camera access denied: ${err.message}. Please allow camera access and try again.`);
    }
  }, []);

  const capturePhoto = useCallback(() => {
    const video  = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width  = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    setPreview(dataUrl);
    setPhase('preview');
  }, []);

  const retake = () => {
    setPreview(null);
    setPhase('streaming');
    setError('');
  };

  const confirm = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    onCapture(preview);
  };

  const cancel = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    onCancel?.();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Error banner */}
      {error && <div className="alert alert-error">{error}</div>}

      {/* Anti-fraud notice */}
      <div className="alert alert-info" style={{ fontSize: 13 }}>
        <Lock className="w-4 h-4 flex-shrink-0 mt-0.5" />
        <span>Live camera capture required. Screenshots or gallery photos are not accepted and will be rejected by our AI verification system.</span>
      </div>

      {/* Video feed */}
      <div style={{ position: 'relative', borderRadius: 16, overflow: 'hidden', background: '#0F172A', aspectRatio: '16/9' }}>
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={{
            width: '100%', height: '100%', objectFit: 'cover',
            display: phase === 'streaming' ? 'block' : 'none',
          }}
        />
        {preview && phase === 'preview' && (
          <img src={preview} alt="Captured" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        )}
        {phase === 'idle' && (
          <div style={{
            position: 'absolute', inset: 0, display: 'flex', alignItems: 'center',
            justifyContent: 'center', flexDirection: 'column', gap: 12, color: '#94A3B8',
          }}>
            <Camera className="w-12 h-12 opacity-30" />
            <div style={{ fontSize: 14, fontWeight: 600 }}>Camera not active</div>
          </div>
        )}

        {/* Capture frame overlay */}
        {phase === 'streaming' && (
          <div style={{
            position: 'absolute', inset: 20,
            border: '2px solid rgba(79, 70, 229, 0.5)',
            borderRadius: 12, pointerEvents: 'none',
          }} />
        )}
      </div>

      {/* Hidden canvas for capture */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {/* Controls */}
      <div style={{ display: 'flex', gap: 10 }}>
        {phase === 'idle' && (
          <>
            <button className="btn btn-primary" onClick={startCamera} style={{ flex: 1 }}>
              <Camera className="w-4 h-4" /> Start Camera
            </button>
            <button className="btn btn-ghost" onClick={cancel}>Cancel</button>
          </>
        )}
        {phase === 'streaming' && (
          <>
            <button className="btn btn-primary" onClick={capturePhoto} style={{ flex: 1 }}>
              <Camera className="w-4 h-4" /> Capture Photo
            </button>
            <button className="btn btn-ghost" onClick={cancel}>Cancel</button>
          </>
        )}
        {phase === 'preview' && (
          <>
            <button className="btn btn-primary" onClick={confirm} style={{ flex: 1 }}>
              <CheckCircle className="w-4 h-4" /> Submit This Photo
            </button>
            <button className="btn btn-ghost" onClick={retake}>
              <RefreshCw className="w-4 h-4" /> Retake
            </button>
          </>
        )}
      </div>
    </div>
  );
}
