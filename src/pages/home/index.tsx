import React, { useState } from 'react';
import { Video, CheckCircle, RotateCcw } from 'lucide-react';

// ─────────────────────────────────────────────
// LandscapePrompt Component
// ─────────────────────────────────────────────
interface LandscapePromptProps {
  onContinue: () => void;
  onClose: () => void;
}

const LandscapePrompt: React.FC<LandscapePromptProps> = ({ onContinue, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0f172a 100%)' }}>

      {/* Animated background grid */}
      <div className="absolute inset-0 overflow-hidden opacity-10">
        <svg width="100%" height="100%">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#22c55e" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-6 left-6 z-20 p-2 rounded-full"
        style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)' }}
      >
        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <div className="relative flex flex-col items-center gap-8 px-8 text-center">

        {/* Phone rotation animation */}
        <div className="relative flex items-center justify-center" style={{ width: 180, height: 180 }}>

          {/* Orbit ring */}
          <div className="absolute inset-0 rounded-full"
            style={{ border: '1px solid rgba(34,197,94,0.25)', animation: 'spin-slow 8s linear infinite' }} />
          <div className="absolute rounded-full"
            style={{ inset: 16, border: '1px dashed rgba(34,197,94,0.15)', animation: 'spin-slow 5s linear infinite reverse' }} />

          {/* Phone SVG that rotates */}
          <div style={{ animation: 'phone-rotate 2.8s cubic-bezier(0.4,0,0.2,1) infinite' }}>
            <svg width="90" height="90" viewBox="0 0 90 90" fill="none">
              {/* Phone body */}
              <rect x="28" y="10" width="34" height="60" rx="6" fill="rgba(34,197,94,0.15)" stroke="#22c55e" strokeWidth="2" />
              {/* Screen */}
              <rect x="32" y="18" width="26" height="42" rx="3" fill="rgba(34,197,94,0.1)" stroke="#22c55e" strokeWidth="1" />
              {/* Home bar */}
              <rect x="39" y="65" width="12" height="3" rx="1.5" fill="#22c55e" opacity="0.6" />
              {/* Camera dot */}
              <circle cx="45" cy="14" r="1.5" fill="#22c55e" opacity="0.5" />
            </svg>
          </div>

          {/* Rotation arrow */}
          <div className="absolute" style={{ bottom: 10, right: 10 }}>
            <RotateCcw size={20} color="#22c55e" style={{ animation: 'rotate-arrow 2.8s ease-in-out infinite' }} />
          </div>
        </div>

        {/* Text */}
        <div className="flex flex-col gap-3">
          <h2 className="text-white font-bold" style={{ fontSize: 26, letterSpacing: '-0.5px' }}>
            Rotate Your Phone
          </h2>
          <p className="text-green-400 font-medium" style={{ fontSize: 15 }}>
            Landscape mode captures more tyre tread
          </p>
          <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13, maxWidth: 260, margin: '0 auto', lineHeight: 1.6 }}>
            Turn your device sideways to unlock the full scanning view and get the best analysis results
          </p>
        </div>

        {/* Landscape preview illustration */}
        <div className="relative"
          style={{ background: 'rgba(34,197,94,0.05)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 16, padding: '16px 24px' }}>
          <svg width="220" height="80" viewBox="0 0 220 80" fill="none">
            {/* Phone in landscape */}
            <rect x="10" y="18" width="200" height="44" rx="8" fill="rgba(34,197,94,0.08)" stroke="#22c55e" strokeWidth="1.5" />
            {/* Screen */}
            <rect x="20" y="24" width="180" height="32" rx="4" fill="rgba(34,197,94,0.06)" stroke="#22c55e" strokeWidth="1" strokeOpacity="0.5" />
            {/* Scanner frame inside */}
            <rect x="40" y="29" width="140" height="22" rx="2" fill="none" stroke="#4ade80" strokeWidth="1" strokeDasharray="4 2" />
            {/* Tyre tread lines */}
            <line x1="60" y1="29" x2="60" y2="51" stroke="#22c55e" strokeWidth="0.75" opacity="0.4" />
            <line x1="80" y1="29" x2="80" y2="51" stroke="#22c55e" strokeWidth="0.75" opacity="0.4" />
            <line x1="110" y1="29" x2="110" y2="51" stroke="#22c55e" strokeWidth="1" opacity="0.7" />
            <line x1="140" y1="29" x2="140" y2="51" stroke="#22c55e" strokeWidth="0.75" opacity="0.4" />
            <line x1="160" y1="29" x2="160" y2="51" stroke="#22c55e" strokeWidth="0.75" opacity="0.4" />
            {/* Side button */}
            <rect x="8" y="30" width="3" height="10" rx="1.5" fill="#22c55e" opacity="0.4" />
            {/* Home bar */}
            <rect x="205" y="36" width="5" height="8" rx="2.5" fill="#22c55e" opacity="0.4" />
            {/* Check label */}
            <circle cx="110" cy="66" r="6" fill="rgba(34,197,94,0.2)" />
            <path d="M107 66l2 2 4-4" stroke="#4ade80" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <text x="122" y="70" fontSize="10" fill="#4ade80" fontFamily="system-ui">Landscape ready</text>
          </svg>
        </div>

        {/* CTA Button */}
        <button
          onClick={onContinue}
          className="relative group"
          style={{
            background: 'linear-gradient(135deg, #16a34a, #22c55e)',
            border: 'none',
            borderRadius: 50,
            padding: '16px 48px',
            color: 'white',
            fontSize: 16,
            fontWeight: 600,
            letterSpacing: '0.3px',
            cursor: 'pointer',
            boxShadow: '0 0 40px rgba(34,197,94,0.3)',
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Video size={18} />
            Got it — Open Camera
          </span>
        </button>

        <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>
          Hold the phone horizontally before recording
        </p>
      </div>

      <style>{`
        @keyframes phone-rotate {
          0%   { transform: rotate(0deg); }
          30%  { transform: rotate(0deg); }
          60%  { transform: rotate(-90deg); }
          85%  { transform: rotate(-90deg); }
          100% { transform: rotate(0deg); }
        }
        @keyframes rotate-arrow {
          0%, 30% { opacity: 0; transform: rotate(0deg); }
          50%      { opacity: 1; transform: rotate(-180deg); }
          85%      { opacity: 0; }
          100%     { opacity: 0; }
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

// ─────────────────────────────────────────────
// CameraCapture Component — rotated 90° UI
// ─────────────────────────────────────────────
interface CameraCaptureProps {
  onCapture: (videoUrl: string) => void;
  onClose: () => void;
}

const CameraCapture: React.FC<CameraCaptureProps> = ({ onCapture, onClose }) => {
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const streamRef = React.useRef<MediaStream | null>(null);
  const mediaRecorderRef = React.useRef<MediaRecorder | null>(null);
  const chunksRef = React.useRef<Blob[]>([]);

  const [isCameraReady, setIsCameraReady] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [timeLeft, setTimeLeft] = useState(8);
  const [recordingComplete, setRecordingComplete] = useState(false);

  React.useEffect(() => {
    const lockOrientation = async () => {
      if (screen.orientation && 'lock' in screen.orientation) {
        try { await (screen.orientation as any).lock('landscape'); } catch { /* ignore */ }
      }
    };
    lockOrientation();
    return () => {
      if (screen.orientation && 'unlock' in screen.orientation) {
        (screen.orientation as any).unlock();
      }
    };
  }, []);

  React.useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          streamRef.current = stream;
          videoRef.current.onloadedmetadata = () => setIsCameraReady(true);
        }
      } catch {
        alert('Camera access denied. Please enable camera permissions.');
        onClose();
      }
    };
    startCamera();
    return () => { streamRef.current?.getTracks().forEach((t) => t.stop()); };
  }, [onClose]);

  const startRecording = () => {
    if (!streamRef.current || isRecording) return;
    if (navigator.vibrate) navigator.vibrate(200);
    const mediaRecorder = new MediaRecorder(streamRef.current, { mimeType: 'video/webm;codecs=vp8' });
    mediaRecorderRef.current = mediaRecorder;
    chunksRef.current = [];
    mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
    mediaRecorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' });
      const videoUrl = URL.createObjectURL(blob);
      setRecordingComplete(true);
      setTimeout(() => onCapture(videoUrl), 600);
    };
    mediaRecorder.start();
    setIsRecording(true);
    setTimeLeft(8);
    let seconds = 8;
    const interval = setInterval(() => {
      seconds--;
      setTimeLeft(seconds);
      if (seconds === 0) { clearInterval(interval); mediaRecorder.stop(); setIsRecording(false); }
    }, 1000);
  };

  return (
    /* Outer: full screen, black background, everything inside rotated 90° */
    <div className="fixed inset-0 bg-black z-50 overflow-hidden flex items-center justify-center">

      {/* The entire camera UI is rotated 90° clockwise to simulate landscape on portrait devices */}
      <div
        style={{
          position: 'absolute',
          width: '100vh',       /* rotated: height becomes width */
          height: '100vw',      /* rotated: width becomes height */
          transform: 'rotate(90deg)',
          transformOrigin: 'center center',
          overflow: 'hidden',
        }}
      >
        {/* Live Camera Feed */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
        />

        {/* ── HUD Layer ── */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>

          {/* Top bar gradient */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: 80,
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.7), transparent)',
          }} />

          {/* Bottom bar gradient */}
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0, height: 100,
            background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)',
          }} />

          {/* ── Scanner frame: wide, flat rectangle ── */}
          <div style={{
            position: 'absolute',
            left: '50%', top: '50%',
            transform: 'translate(-50%, -50%)',
            width: '86%', maxWidth: 680,
            aspectRatio: '680 / 200',
          }}>
            <svg viewBox="0 0 680 200" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible' }}>
              {/* Animated dashed top/bottom */}
              <line x1="0" y1="0" x2="680" y2="0" stroke="#22c55e" strokeWidth="2.5" strokeDasharray="12 6" className="dash-anim" />
              <line x1="0" y1="200" x2="680" y2="200" stroke="#22c55e" strokeWidth="2.5" strokeDasharray="12 6" className="dash-anim" />
              {/* Solid left/right */}
              <line x1="0" y1="0" x2="0" y2="200" stroke="#22c55e" strokeWidth="2.5" />
              <line x1="680" y1="0" x2="680" y2="200" stroke="#22c55e" strokeWidth="2.5" />

              {/* Guide verticals */}
              {[136, 272, 340, 408, 544].map((x, i) => (
                <line key={x} x1={x} y1="0" x2={x} y2="200"
                  stroke="#22c55e" strokeWidth={i === 2 ? 2 : 1.2} opacity={i === 2 ? 0.9 : 0.35} />
              ))}

              {/* Tick marks */}
              {[136, 272, 340, 408, 544].map((x, i) => (
                <g key={x}>
                  <line x1={x} y1="0" x2={x} y2={i === 2 ? -14 : -10} stroke="#22c55e" strokeWidth={i === 2 ? 2.5 : 1.8} opacity="0.6" />
                  <line x1={x} y1="200" x2={x} y2={i === 2 ? 214 : 210} stroke="#22c55e" strokeWidth={i === 2 ? 2.5 : 1.8} opacity="0.6" />
                </g>
              ))}

              {/* Pulsing center dot */}
              <circle cx="340" cy="100" r="5" fill="#22c55e" opacity="0.9">
                <animate attributeName="opacity" values="0.25;1;0.25" dur="1.6s" repeatCount="indefinite" />
              </circle>

              {/* Scanning line while recording */}
              {isRecording && (
                <line x1="0" y1="0" x2="0" y2="200" stroke="#4ade80" strokeWidth="2.5" opacity="0.9">
                  <animate attributeName="x1" values="0;680;0" dur="2s" repeatCount="indefinite" />
                  <animate attributeName="x2" values="0;680;0" dur="2s" repeatCount="indefinite" />
                </line>
              )}

              {/* Corner glow spots */}
              <circle cx="0" cy="0" r="8" fill="#22c55e" opacity="0.35" />
              <circle cx="680" cy="0" r="8" fill="#22c55e" opacity="0.35" />
              <circle cx="0" cy="200" r="8" fill="#22c55e" opacity="0.35" />
              <circle cx="680" cy="200" r="8" fill="#22c55e" opacity="0.35" />
            </svg>

            {/* L-brackets */}
            {['top-left', 'top-right', 'bottom-left', 'bottom-right'].map((pos) => (
              <div key={pos} style={{
                position: 'absolute',
                top: pos.includes('top') ? -2 : undefined,
                bottom: pos.includes('bottom') ? -2 : undefined,
                left: pos.includes('left') ? -2 : undefined,
                right: pos.includes('right') ? -2 : undefined,
                width: 28, height: 28,
                borderTop: pos.includes('top') ? '3.5px solid #4ade80' : undefined,
                borderBottom: pos.includes('bottom') ? '3.5px solid #4ade80' : undefined,
                borderLeft: pos.includes('left') ? '3.5px solid #4ade80' : undefined,
                borderRight: pos.includes('right') ? '3.5px solid #4ade80' : undefined,
              }} />
            ))}
          </div>

          {/* ── Label: align tyre (before recording) ── */}
          {!isRecording && isCameraReady && (
            <div style={{ position: 'absolute', top: 18, left: 0, right: 0, display: 'flex', justifyContent: 'center' }}>
              <div style={{
                background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)',
                borderRadius: 50, padding: '8px 22px',
                border: '1px solid rgba(255,255,255,0.1)',
              }}>
                <p style={{ color: 'white', fontSize: 13, margin: 0, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ color: '#4ade80', fontSize: 16 }}>◎</span>
                  Align tyre tread within the guide frame
                </p>
              </div>
            </div>
          )}

          {/* ── Direction hint ── */}
          {!isRecording && isCameraReady && (
            <div style={{ position: 'absolute', bottom: 22, left: 0, right: 0, display: 'flex', justifyContent: 'center' }}>
              <div style={{
                background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)',
                borderRadius: 50, padding: '10px 28px',
                border: '1px solid rgba(34,197,94,0.25)',
                animation: 'pulse-hint 2.5s ease-in-out infinite',
              }}>
                <p style={{ color: '#4ade80', fontSize: 13, margin: 0, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span>→</span>
                  Move camera slowly left to right
                  <span>→</span>
                </p>
              </div>
            </div>
          )}

          {/* ── Recording badge ── */}
          {isRecording && (
            <div style={{ position: 'absolute', top: 18, left: '50%', transform: 'translateX(-50%)' }}>
              <div style={{
                background: '#ef4444', borderRadius: 50, padding: '8px 22px',
                display: 'flex', alignItems: 'center', gap: 10,
                boxShadow: '0 0 20px rgba(239,68,68,0.5)',
              }}>
                <div style={{
                  width: 10, height: 10, borderRadius: '50%', background: 'white',
                  animation: 'blink 1s ease-in-out infinite',
                }} />
                <span style={{ color: 'white', fontSize: 12, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase' }}>Recording</span>
              </div>
            </div>
          )}

          {/* ── Countdown ── */}
          {isRecording && (
            <div style={{ position: 'absolute', right: 32, top: '50%', transform: 'translateY(-50%)' }}>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="80" height="80" viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
                  <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="5" />
                  <circle cx="50" cy="50" r="42" fill="none" stroke="#22c55e" strokeWidth="5"
                    strokeLinecap="round" strokeDasharray="264"
                    strokeDashoffset={264 - (264 * (8 - timeLeft)) / 8}
                    style={{ transition: 'stroke-dashoffset 1s linear' }} />
                </svg>
                <span style={{
                  position: 'absolute', color: 'white', fontSize: 28, fontWeight: 700,
                  textShadow: '0 0 20px rgba(34,197,94,0.8)',
                  animation: 'count-pulse 1s ease-in-out infinite',
                }}>{timeLeft}</span>
              </div>
            </div>
          )}

          {/* ── Scan complete ── */}
          {recordingComplete && (
            <div style={{
              position: 'absolute', inset: 0,
              background: 'rgba(0,0,0,0.55)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <div style={{
                background: '#16a34a', borderRadius: 20, padding: '20px 36px',
                display: 'flex', alignItems: 'center', gap: 14,
                boxShadow: '0 0 60px rgba(34,197,94,0.4)',
                animation: 'scale-in 0.45s cubic-bezier(0.34, 1.56, 0.64, 1)',
              }}>
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                  <circle cx="16" cy="16" r="15" fill="rgba(255,255,255,0.2)" />
                  <path d="M9 16l5 5 9-9" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span style={{ color: 'white', fontSize: 22, fontWeight: 700 }}>Scan Complete!</span>
              </div>
            </div>
          )}
        </div>

        {/* ── Close button ── */}
        <div style={{ position: 'absolute', top: 14, left: 14, zIndex: 20, pointerEvents: 'auto' }}>
          <button
            onClick={onClose}
            disabled={isRecording}
            style={{
              background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: '50%', width: 44, height: 44,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', opacity: isRecording ? 0.4 : 1,
              backdropFilter: 'blur(8px)',
            }}
          >
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* ── Record button: right side (landscape layout) ── */}
        <div style={{
          position: 'absolute', right: 28, top: '50%', transform: 'translateY(-50%)',
          zIndex: 20, pointerEvents: 'auto',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
        }}>
          <button
            onClick={startRecording}
            disabled={!isCameraReady || isRecording || recordingComplete}
            style={{ position: 'relative', cursor: 'pointer', background: 'none', border: 'none', padding: 0,
              opacity: (!isCameraReady || isRecording || recordingComplete) ? 0.5 : 1 }}
          >
            {/* Ping ring */}
            <div style={{
              position: 'absolute', inset: 0, borderRadius: '50%', background: '#ef4444',
              animation: 'ping 2s cubic-bezier(0,0,0.2,1) infinite', opacity: 0.6,
            }} />
            <div style={{
              position: 'relative', width: 68, height: 68, borderRadius: '50%',
              background: 'linear-gradient(135deg, #ef4444, #dc2626)',
              border: '4px solid white',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 30px rgba(239,68,68,0.5)',
            }}>
              <div style={{ width: 22, height: 22, borderRadius: 4, background: 'white' }} />
            </div>
          </button>
          {!isRecording && isCameraReady && (
            <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 11, textAlign: 'center', fontWeight: 500, whiteSpace: 'nowrap' }}>
              Tap to scan
            </p>
          )}
        </div>

        <style>{`
          @keyframes dash-move { to { stroke-dashoffset: -36; } }
          .dash-anim { animation: dash-move 3s linear infinite; }
          @keyframes ping { 0%,100%{transform:scale(1);opacity:.7} 50%{transform:scale(1.5);opacity:0} }
          @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.3} }
          @keyframes count-pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(1.1)} }
          @keyframes pulse-hint { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.75;transform:scale(1.015)} }
          @keyframes scale-in { 0%{opacity:0;transform:scale(0.4)} 60%{transform:scale(1.08)} 100%{opacity:1;transform:scale(1)} }
        `}</style>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// Home Component
// ─────────────────────────────────────────────
const Home: React.FC = () => {
  const [showLandscapePrompt, setShowLandscapePrompt] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [capturedVideos, setCapturedVideos] = useState<string[]>([]);

  const handleCapturedVideo = (videoUrl: string) => {
    setCapturedVideos((prev) => [...prev, videoUrl]);
    setShowCamera(false);
  };

  const handleStartScan = () => {
    setShowLandscapePrompt(true);
  };

  const handleLandscapeContinue = () => {
    setShowLandscapePrompt(false);
    setShowCamera(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-4 md:p-8">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="text-center mb-12 pt-8">
          <div className="inline-block">
            <h1 className="text-5xl font-bold text-white mb-2 tracking-tight">Apollo</h1>
            <div className="h-1 bg-gradient-to-r from-blue-400 to-green-400 rounded-full" />
          </div>
          <p className="text-blue-200 mt-4 text-lg">Tyre Tread Analysis System</p>
        </div>

        {/* Scan Button */}
        <button
          onClick={handleStartScan}
          className="w-full bg-gradient-to-br from-blue-500 to-blue-600 rounded-3xl shadow-2xl
                     hover:shadow-blue-500/50 p-10 border border-blue-400/30 hover:border-blue-400/60
                     transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] group"
        >
          <div className="flex flex-col items-center gap-6">
            <div className="relative">
              <div className="absolute inset-0 bg-white/20 rounded-full blur-xl group-hover:blur-2xl transition-all" />
              <div className="relative w-20 h-20 bg-white rounded-full flex items-center justify-center
                              shadow-lg group-hover:shadow-white/50 transition-all">
                <Video className="w-10 h-10 text-blue-600" />
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Start Tyre Scan</h2>
              <p className="text-blue-100 text-sm">Capture 8-second video of tyre tread</p>
            </div>
            <div className="flex items-center gap-4 text-blue-100 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                <span>8 seconds</span>
              </div>
              <div className="w-1 h-1 bg-blue-300 rounded-full" />
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                <span>Landscape mode</span>
              </div>
              <div className="w-1 h-1 bg-blue-300 rounded-full" />
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                <span>HD quality</span>
              </div>
            </div>
          </div>
        </button>

        {/* Recent Scans */}
        {capturedVideos.length > 0 && (
          <div className="mt-8">
            <h3 className="text-white text-xl font-semibold mb-4">Recent Scans</h3>
            <div className="grid gap-4">
              {capturedVideos.map((videoUrl, index) => (
                <div key={index} className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
                  <video src={videoUrl} controls className="w-full rounded-lg" />
                  <p className="text-white/70 text-sm mt-2">Scan {capturedVideos.length - index}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-12 bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
          <h3 className="text-white text-lg font-semibold mb-4">📋 How to Scan</h3>
          <ol className="space-y-3 text-blue-100">
            <li className="flex gap-3">
              <span className="font-bold text-blue-400">1.</span>
              <span>Tap "Start Tyre Scan" and rotate your phone to landscape</span>
            </li>
            <li className="flex gap-3">
              <span className="font-bold text-blue-400">2.</span>
              <span>Position tyre horizontally and align tread within the green frame</span>
            </li>
            <li className="flex gap-3">
              <span className="font-bold text-blue-400">3.</span>
              <span>Tap record and slowly move left to right</span>
            </li>
            <li className="flex gap-3">
              <span className="font-bold text-blue-400">4.</span>
              <span>Keep movement steady for 8 seconds</span>
            </li>
          </ol>
        </div>
      </div>

      {/* Landscape Prompt */}
      {showLandscapePrompt && (
        <LandscapePrompt
          onContinue={handleLandscapeContinue}
          onClose={() => setShowLandscapePrompt(false)}
        />
      )}

      {/* Camera */}
      {showCamera && (
        <CameraCapture
          onCapture={handleCapturedVideo}
          onClose={() => setShowCamera(false)}
        />
      )}
    </div>
  );
};

export default Home;