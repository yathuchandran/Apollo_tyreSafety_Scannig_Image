import React, { useState, useRef, useEffect } from 'react';

// ─── LANDSCAPE WRAPPER ───────────────────────────────────────────────────────
// Rotates the ENTIRE screen 90° — camera feed + HUD rotate together
const LandscapeWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div style={{
      position: 'fixed', inset: 0, overflow: 'hidden',
      background: '#000',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        width: '100vh',
        height: '100vw',
        transform: 'rotate(90deg)',
        transformOrigin: 'center center',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {children}
      </div>
    </div>
  );
};

// ─── LANDSCAPE PROMPT ────────────────────────────────────────────────────────
interface LandscapePromptProps {
  onContinue: () => void;
  onClose: () => void;
}

const LandscapePrompt: React.FC<LandscapePromptProps> = ({ onContinue, onClose }) => {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 50,
      background: '#080c10',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      fontFamily: "'DM Sans', sans-serif",
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse 70% 50% at 50% 60%, rgba(0,210,120,0.07) 0%, transparent 70%)',
      }} />
      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.04 }}>
        <defs><pattern id="g" width="32" height="32" patternUnits="userSpaceOnUse">
          <path d="M 32 0 L 0 0 0 32" fill="none" stroke="#00d47a" strokeWidth="0.5" />
        </pattern></defs>
        <rect width="100%" height="100%" fill="url(#g)" />
      </svg>

      <button onClick={onClose} style={{
        position: 'absolute', top: 20, left: 20,
        background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 12, width: 40, height: 40, cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'rgba(255,255,255,0.5)', fontSize: 18,
      }}>✕</button>

      <div style={{ position: 'absolute', top: 24, left: '50%', transform: 'translateX(-50%)' }}>
        <span style={{ color: 'rgba(255,255,255,0.15)', fontSize: 11, letterSpacing: '0.35em', textTransform: 'uppercase', fontWeight: 500 }}>
          APOLLO · TREAD SCAN
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 40, padding: '0 32px', maxWidth: 360 }}>

        {/* Phone rotation animation */}
        <div style={{ position: 'relative', width: 160, height: 160 }}>
          <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '1px solid rgba(0,212,122,0.15)', animation: 'spin 12s linear infinite' }} />
          <div style={{ position: 'absolute', inset: 12, borderRadius: '50%', border: '1px dashed rgba(0,212,122,0.1)', animation: 'spin 8s linear infinite reverse' }} />
          <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,212,122,0.12) 0%, transparent 70%)' }} />
          <div style={{
            position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
            animation: 'phoneRotate 3s cubic-bezier(0.4,0,0.2,1) infinite',
          }}>
            <svg width="52" height="88" viewBox="0 0 52 88" fill="none">
              <rect x="1" y="1" width="50" height="86" rx="9" fill="rgba(0,212,122,0.06)" stroke="rgba(0,212,122,0.6)" strokeWidth="1.5" />
              <rect x="7" y="10" width="38" height="60" rx="4" fill="rgba(0,212,122,0.04)" stroke="rgba(0,212,122,0.25)" strokeWidth="1" />
              <rect x="20" y="75" width="12" height="3" rx="1.5" fill="rgba(0,212,122,0.4)" />
              <circle cx="26" cy="5.5" r="1.5" fill="rgba(0,212,122,0.3)" />
              <line x1="7" y1="40" x2="45" y2="40" stroke="rgba(0,212,122,0.3)" strokeWidth="0.75" strokeDasharray="3 2" />
              <line x1="7" y1="35" x2="45" y2="35" stroke="rgba(0,212,122,0.15)" strokeWidth="0.5" />
              <line x1="7" y1="45" x2="45" y2="45" stroke="rgba(0,212,122,0.15)" strokeWidth="0.5" />
            </svg>
          </div>
          <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} viewBox="0 0 160 160">
            <path d="M 140 80 A 60 60 0 0 0 80 20" stroke="rgba(0,212,122,0.4)" strokeWidth="2" fill="none" strokeLinecap="round" strokeDasharray="8 4" style={{ animation: 'dashMove 2s linear infinite' }} />
            <polygon points="78,14 86,24 70,24" fill="rgba(0,212,122,0.6)" />
          </svg>
        </div>

        <div style={{ textAlign: 'center' }}>
          <h2 style={{ color: '#fff', fontSize: 26, fontWeight: 600, margin: '0 0 12px', letterSpacing: '-0.5px', lineHeight: 1.2 }}>
            Rotate to Landscape
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 14, lineHeight: 1.7, margin: 0 }}>
            Turn your phone sideways so the scanner captures the full tyre tread width in one pass.
          </p>
        </div>

        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            { icon: '↻', label: 'Rotate phone 90° to landscape' },
            { icon: '◎', label: 'Align tread in the green frame' },
            { icon: '→', label: 'Sweep slowly left to right' },
          ].map((s, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 14,
              background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 12, padding: '12px 16px',
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: 8,
                background: 'rgba(0,212,122,0.1)', border: '1px solid rgba(0,212,122,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#00d47a', fontSize: 16, flexShrink: 0,
              }}>{s.icon}</div>
              <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14 }}>{s.label}</span>
              <div style={{
                marginLeft: 'auto', width: 20, height: 20, borderRadius: '50%',
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'rgba(255,255,255,0.2)', fontSize: 11,
              }}>{i + 1}</div>
            </div>
          ))}
        </div>

        <button onClick={onContinue} style={{
          width: '100%',
          background: 'linear-gradient(135deg, #00c46e, #00d47a)',
          border: 'none', borderRadius: 16, padding: '18px 32px',
          color: '#001a0d', fontSize: 15, fontWeight: 700,
          letterSpacing: '0.3px', cursor: 'pointer',
        }}>
          <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M23 7l-7 5 7 5V7z" /><rect x="1" y="5" width="15" height="14" rx="2" />
            </svg>
            Open Scanner
          </span>
        </button>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&display=swap');
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes phoneRotate {
          0%,25%  { transform: rotate(0deg); }
          55%,85% { transform: rotate(-90deg); }
          100%    { transform: rotate(0deg); }
        }
        @keyframes dashMove { to { stroke-dashoffset: -24; } }
      `}</style>
    </div>
  );
};

// ─── CAMERA CAPTURE ──────────────────────────────────────────────────────────
interface CameraCaptureProps {
  onCapture: (videoUrl: string) => void;
  onClose: () => void;
}

const CameraCapture: React.FC<CameraCaptureProps> = ({ onCapture, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const [isCameraReady, setIsCameraReady] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [timeLeft, setTimeLeft] = useState(8);
  const [recordingComplete, setRecordingComplete] = useState(false);
  const [scanX, setScanX] = useState(0);

  useEffect(() => {
    if (!isRecording) { setScanX(0); return; }
    let x = 0; let dir = 1;
    const id = setInterval(() => {
      x += dir * 2.5;
      if (x >= 100) dir = -1;
      if (x <= 0) dir = 1;
      setScanX(x);
    }, 16);
    return () => clearInterval(id);
  }, [isRecording]);

  useEffect(() => {
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
        alert('Camera access denied.');
        onClose();
      }
    };
    startCamera();
    return () => { streamRef.current?.getTracks().forEach((t) => t.stop()); };
  }, [onClose]);

  const startRecording = () => {
    if (!streamRef.current || isRecording || !isCameraReady) return;
    if (navigator.vibrate) navigator.vibrate(100);
    const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp8') ? 'video/webm;codecs=vp8' : 'video/webm';
    const mr = new MediaRecorder(streamRef.current, { mimeType });
    mediaRecorderRef.current = mr;
    chunksRef.current = [];
    mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
    mr.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' });
      setRecordingComplete(true);
      setTimeout(() => onCapture(URL.createObjectURL(blob)), 800);
    };
    mr.start();
    setIsRecording(true);
    setTimeLeft(8);
    let s = 8;
    const iv = setInterval(() => {
      s--; setTimeLeft(s);
      if (s === 0) { clearInterval(iv); mr.stop(); setIsRecording(false); }
    }, 1000);
  };

  const progress = ((8 - timeLeft) / 8) * 100;
  const circumference = 2 * Math.PI * 28;

  return (
    <LandscapeWrapper>
      {/* Camera feed fills the rotated container perfectly */}
      <video
        ref={videoRef} autoPlay playsInline muted
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
      />

      {/* Vignette */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse 120% 80% at 50% 50%, transparent 35%, rgba(0,0,0,0.6) 100%)',
      }} />

      {/* Top gradient */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 80, background: 'linear-gradient(to bottom, rgba(0,0,0,0.72), transparent)', pointerEvents: 'none' }} />
      {/* Bottom gradient */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 96, background: 'linear-gradient(to top, rgba(0,0,0,0.78), transparent)', pointerEvents: 'none' }} />

      {/* ══ SCANNER FRAME ══ */}
      <div style={{
        position: 'absolute', left: '50%', top: '50%',
        transform: 'translate(-50%, -50%)',
        width: '82%', maxWidth: 660,
        aspectRatio: '16 / 4.5',
        pointerEvents: 'none',
      }}>
        <svg viewBox="0 0 660 186" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible' }}>
          {/* Frame fill */}
          <rect x="0" y="0" width="660" height="186" rx="3" fill="rgba(0,212,122,0.025)" />
          {/* Dashed border */}
          <rect x="0.75" y="0.75" width="658.5" height="184.5" rx="3" fill="none"
            stroke="rgba(0,212,122,0.65)" strokeWidth="1.5" strokeDasharray="10 5"
            style={{ animation: 'dashMove 3s linear infinite' }}
          />
          {/* Guide verticals */}
          {[132, 264, 330, 396, 528].map((x, i) => (
            <line key={x} x1={x} y1="0" x2={x} y2="186"
              stroke="#00d47a" strokeWidth={i === 2 ? 1.5 : 0.8} opacity={i === 2 ? 0.5 : 0.18} />
          ))}
          {/* Tick marks */}
          {[132, 264, 330, 396, 528].map((x, i) => (
            <g key={`t${x}`}>
              <line x1={x} y1="0" x2={x} y2={i === 2 ? -14 : -9} stroke="#00d47a" strokeWidth={i === 2 ? 2 : 1.2} opacity="0.45" />
              <line x1={x} y1="186" x2={x} y2={i === 2 ? 200 : 195} stroke="#00d47a" strokeWidth={i === 2 ? 2 : 1.2} opacity="0.45" />
            </g>
          ))}
          {/* Center crosshair */}
          <circle cx="330" cy="93" r="5" fill="none" stroke="#00d47a" strokeWidth="1.5" opacity="0.7">
            <animate attributeName="opacity" values="0.15;0.85;0.15" dur="2s" repeatCount="indefinite" />
          </circle>
          <line x1="320" y1="93" x2="340" y2="93" stroke="#00d47a" strokeWidth="0.8" opacity="0.35" />
          <line x1="330" y1="83" x2="330" y2="103" stroke="#00d47a" strokeWidth="0.8" opacity="0.35" />
          {/* Scanning beam */}
          {isRecording && (
            <line x1={`${scanX * 6.6}`} y1="0" x2={`${scanX * 6.6}`} y2="186" stroke="#00d47a" strokeWidth="1.5" opacity="0.75">
              <animate attributeName="opacity" values="0.3;0.85;0.3" dur="0.6s" repeatCount="indefinite" />
            </line>
          )}
        </svg>

        {/* Corner L-brackets */}
        {[
          { top: -2, left: -2, bt: '2.5px', bl: '2.5px' },
          { top: -2, right: -2, bt: '2.5px', br: '2.5px' },
          { bottom: -2, left: -2, bb: '2.5px', bl: '2.5px' },
          { bottom: -2, right: -2, bb: '2.5px', br: '2.5px' },
        ].map((c, i) => (
          <div key={i} style={{
            position: 'absolute', width: 22, height: 22,
            top: (c as any).top, bottom: (c as any).bottom, left: (c as any).left, right: (c as any).right,
            borderTop: (c as any).bt ? `${(c as any).bt} solid #00d47a` : undefined,
            borderBottom: (c as any).bb ? `${(c as any).bb} solid #00d47a` : undefined,
            borderLeft: (c as any).bl ? `${(c as any).bl} solid #00d47a` : undefined,
            borderRight: (c as any).br ? `${(c as any).br} solid #00d47a` : undefined,
          }} />
        ))}

        {/* Frame label */}
        <div style={{
          position: 'absolute', top: -26, left: '50%', transform: 'translateX(-50%)',
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <div style={{
            width: 6, height: 6, borderRadius: '50%',
            background: isRecording ? '#ef4444' : '#00d47a',
            animation: 'blink 1s ease-in-out infinite',
          }} />
          <span style={{ color: '#00d47a', fontSize: 10, fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', fontFamily: 'monospace' }}>
            {isRecording ? 'SCANNING' : 'ALIGN TYRE TREAD'}
          </span>
        </div>
      </div>

      {/* ══ TOP BAR ══ */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, padding: '14px 20px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        pointerEvents: 'auto',
      }}>
        <button onClick={onClose} disabled={isRecording} style={{
          width: 40, height: 40, borderRadius: 12,
          background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255,255,255,0.12)',
          color: isRecording ? 'rgba(255,255,255,0.25)' : 'white',
          fontSize: 16, cursor: isRecording ? 'not-allowed' : 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>✕</button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 7, height: 7, borderRadius: '50%',
            background: isRecording ? '#ef4444' : '#00d47a',
            boxShadow: isRecording ? '0 0 8px rgba(239,68,68,0.9)' : '0 0 8px rgba(0,212,122,0.9)',
            animation: 'blink 1s ease-in-out infinite',
          }} />
          <span style={{ color: 'rgba(255,255,255,0.55)', fontSize: 11, letterSpacing: '0.2em', fontFamily: 'monospace' }}>
            {isRecording ? 'REC' : 'APOLLO'}
          </span>
        </div>

        <div style={{
          padding: '6px 14px', borderRadius: 20,
          background: isRecording ? 'rgba(239,68,68,0.12)' : 'rgba(255,255,255,0.07)',
          border: `1px solid ${isRecording ? 'rgba(239,68,68,0.35)' : 'rgba(255,255,255,0.12)'}`,
        }}>
          <span style={{ color: isRecording ? '#ef4444' : 'rgba(255,255,255,0.45)', fontSize: 12, fontWeight: 600, fontFamily: 'monospace' }}>
            {isRecording ? `0:0${timeLeft}` : '0:08'}
          </span>
        </div>
      </div>

      {/* ══ BOTTOM BAR ══ */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, padding: '10px 28px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        pointerEvents: 'auto',
      }}>
        {/* Left: hint / progress */}
        <div style={{ minWidth: 120 }}>
          {!isRecording && isCameraReady && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <div style={{ display: 'flex', gap: 3, animation: 'slideRight 2s ease-in-out infinite' }}>
                  {[0, 1, 2].map(i => (
                    <div key={i} style={{ width: 16, height: 2, borderRadius: 1, background: `rgba(0,212,122,${0.3 + i * 0.3})` }} />
                  ))}
                </div>
                <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>Sweep left → right</span>
              </div>
              <span style={{ color: 'rgba(255,255,255,0.22)', fontSize: 10 }}>Hold steady & flat</span>
            </div>
          )}
          {isRecording && (
            <div>
              <div style={{ width: 110, height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.08)', overflow: 'hidden', marginBottom: 5 }}>
                <div style={{
                  height: '100%', borderRadius: 2,
                  background: 'linear-gradient(90deg, #00c46e, #00d47a)',
                  width: `${progress}%`, transition: 'width 1s linear',
                }} />
              </div>
              <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10 }}>{8 - timeLeft}s of 8s</span>
            </div>
          )}
        </div>

        {/* Center: record button */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
          <button
            onClick={startRecording}
            disabled={!isCameraReady || isRecording || recordingComplete}
            style={{
              position: 'relative', cursor: (!isCameraReady || isRecording || recordingComplete) ? 'not-allowed' : 'pointer',
              background: 'none', border: 'none', padding: 0,
              opacity: (!isCameraReady || isRecording || recordingComplete) ? 0.4 : 1,
            }}
          >
            {isRecording && (
              <svg style={{ position: 'absolute', inset: -6, width: 76, height: 76 }} viewBox="0 0 76 76">
                <circle cx="38" cy="38" r="28" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3" />
                <circle cx="38" cy="38" r="28" fill="none" stroke="#ef4444" strokeWidth="3"
                  strokeLinecap="round" strokeDasharray={circumference}
                  strokeDashoffset={circumference - (circumference * progress) / 100}
                  transform="rotate(-90 38 38)" style={{ transition: 'stroke-dashoffset 1s linear' }} />
              </svg>
            )}
            <div style={{
              width: 64, height: 64, borderRadius: '50%',
              border: `2px solid ${isRecording ? 'rgba(239,68,68,0.45)' : 'rgba(255,255,255,0.28)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: isRecording ? 'rgba(239,68,68,0.07)' : 'rgba(255,255,255,0.05)',
            }}>
              <div style={{
                width: 44, height: 44, borderRadius: isRecording ? 8 : '50%',
                background: isRecording ? '#ef4444' : '#00d47a',
                transition: 'all 0.3s ease',
                boxShadow: isRecording ? '0 0 18px rgba(239,68,68,0.55)' : '0 0 18px rgba(0,212,122,0.5)',
              }} />
            </div>
          </button>
          <span style={{ color: isRecording ? '#ef4444' : 'rgba(255,255,255,0.3)', fontSize: 10, letterSpacing: '0.08em', animation: isRecording ? 'blink 1s ease-in-out infinite' : 'none' }}>
            {isRecording ? `● ${timeLeft}s` : 'TAP TO SCAN'}
          </span>
        </div>

        {/* Right: badge */}
        <div style={{ textAlign: 'right', minWidth: 80 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 10px',
            borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
          }}>
            <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#00d47a' }} />
            <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10, fontFamily: 'monospace' }}>HD · ENV</span>
          </div>
        </div>
      </div>

      {/* ══ SCAN COMPLETE ══ */}
      {recordingComplete && (
        <div style={{
          position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          animation: 'fadeIn 0.3s ease',
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, animation: 'scaleIn 0.4s cubic-bezier(0.34,1.56,0.64,1)' }}>
            <div style={{
              width: 72, height: 72, borderRadius: '50%',
              background: 'rgba(0,212,122,0.12)', border: '2px solid rgba(0,212,122,0.45)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                <path d="M7 16l6 6 12-12" stroke="#00d47a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ color: 'white', fontSize: 18, fontWeight: 600, margin: '0 0 4px' }}>Scan Complete</p>
              <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, margin: 0 }}>Processing video…</p>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&display=swap');
        @keyframes dashMove { to { stroke-dashoffset: -30; } }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.25} }
        @keyframes slideRight { 0%{transform:translateX(-4px);opacity:0.4} 50%{transform:translateX(4px);opacity:1} 100%{transform:translateX(-4px);opacity:0.4} }
        @keyframes fadeIn { from{opacity:0} to{opacity:1} }
        @keyframes scaleIn { from{transform:scale(0.5);opacity:0} 60%{transform:scale(1.06)} to{transform:scale(1);opacity:1} }
      `}</style>
    </LandscapeWrapper>
  );
};

// ─── HOME ────────────────────────────────────────────────────────────────────
const Home: React.FC = () => {
  const [stage, setStage] = useState<'home' | 'prompt' | 'camera'>('home');
  const [capturedVideos, setCapturedVideos] = useState<string[]>([]);

  return (
    <div style={{ minHeight: '100vh', background: '#080c10', fontFamily: "'DM Sans', sans-serif", color: 'white', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, background: 'radial-gradient(ellipse 60% 40% at 30% 20%, rgba(0,212,122,0.06) 0%, transparent 60%), radial-gradient(ellipse 50% 50% at 80% 80%, rgba(0,100,255,0.04) 0%, transparent 60%)' }} />
      <svg style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', opacity: 0.035, zIndex: 0, pointerEvents: 'none' }}>
        <defs><pattern id="hg" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#00d47a" strokeWidth="0.5" />
        </pattern></defs>
        <rect width="100%" height="100%" fill="url(#hg)" />
      </svg>

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 440, margin: '0 auto', padding: '0 24px 48px' }}>
        {/* Header */}
        <div style={{ paddingTop: 64, marginBottom: 56 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(0,212,122,0.12)', border: '1px solid rgba(0,212,122,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00d47a" strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="12" r="3" /><path d="M2 12h3M19 12h3M12 2v3M12 19v3" />
              </svg>
            </div>
            <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: 11, letterSpacing: '0.3em', textTransform: 'uppercase' }}>APOLLO SYSTEM</span>
          </div>
          <h1 style={{ fontSize: 42, fontWeight: 700, margin: '0 0 8px', letterSpacing: '-1.5px', lineHeight: 1.1 }}>
            Tread<span style={{ color: '#00d47a' }}>Scan</span>
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, margin: 0, lineHeight: 1.6 }}>
            AI-powered tyre tread depth analysis in 8 seconds
          </p>
        </div>

        {/* Scan CTA */}
        <button onClick={() => setStage('prompt')} style={{ width: '100%', background: 'none', border: '1px solid rgba(0,212,122,0.2)', borderRadius: 20, padding: 0, cursor: 'pointer', overflow: 'hidden', position: 'relative', marginBottom: 24 }}>
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(0,212,122,0.08) 0%, rgba(0,100,200,0.04) 100%)' }} />
          <div style={{ position: 'relative', padding: '36px 32px' }}>
            <div style={{ marginBottom: 28, display: 'flex', justifyContent: 'center' }}>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', inset: -12, borderRadius: '50%', border: '1px solid rgba(0,212,122,0.15)', animation: 'ringPulse 2.5s ease-in-out infinite' }} />
                <div style={{ position: 'absolute', inset: -24, borderRadius: '50%', border: '1px solid rgba(0,212,122,0.07)', animation: 'ringPulse 2.5s ease-in-out infinite 0.5s' }} />
                <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(0,212,122,0.1)', border: '1px solid rgba(0,212,122,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#00d47a" strokeWidth="1.5" strokeLinecap="round">
                    <path d="M23 7l-7 5 7 5V7z" /><rect x="1" y="5" width="15" height="14" rx="2" />
                  </svg>
                </div>
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: 11, letterSpacing: '0.25em', margin: '0 0 8px', textTransform: 'uppercase' }}>Tap to begin</p>
              <h2 style={{ fontSize: 22, fontWeight: 600, margin: '0 0 6px', letterSpacing: '-0.5px' }}>Start Tyre Scan</h2>
              <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, margin: '0 0 24px' }}>8-second guided video capture</p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 8, flexWrap: 'wrap' }}>
                {['Landscape mode', 'HD capture', 'Auto-timed'].map(f => (
                  <span key={f} style={{ padding: '4px 12px', borderRadius: 20, background: 'rgba(0,212,122,0.08)', border: '1px solid rgba(0,212,122,0.15)', color: 'rgba(0,212,122,0.8)', fontSize: 11, fontWeight: 500 }}>{f}</span>
                ))}
              </div>
            </div>
          </div>
        </button>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 32 }}>
          {[{ value: '±0.1', unit: 'mm', label: 'Accuracy' }, { value: '8', unit: 's', label: 'Scan time' }, { value: '4K', unit: '', label: 'Resolution' }].map(s => (
            <div key={s.label} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: '16px 12px', textAlign: 'center' }}>
              <div style={{ marginBottom: 2 }}>
                <span style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.5px' }}>{s.value}</span>
                <span style={{ fontSize: 11, color: '#00d47a', fontWeight: 600 }}>{s.unit}</span>
              </div>
              <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, margin: 0 }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* Recent scans */}
        {capturedVideos.length > 0 && (
          <div style={{ marginBottom: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, margin: 0, color: 'rgba(255,255,255,0.7)' }}>Recent Scans</h3>
              <span style={{ padding: '2px 10px', borderRadius: 20, background: 'rgba(0,212,122,0.1)', border: '1px solid rgba(0,212,122,0.2)', color: '#00d47a', fontSize: 11 }}>{capturedVideos.length}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {capturedVideos.map((url, i) => (
                <div key={i} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: 12 }}>
                  <video src={url} controls style={{ width: '100%', borderRadius: 8, display: 'block' }} />
                  <div style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11 }}>Scan #{capturedVideos.length - i}</span>
                    <span style={{ padding: '2px 8px', borderRadius: 6, background: 'rgba(0,212,122,0.08)', color: '#00d47a', fontSize: 10 }}>Captured</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* How to */}
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: '20px' }}>
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', margin: '0 0 16px' }}>How it works</p>
          {[
            ['Tap "Start Tyre Scan"', 'Launches the guided landscape scanner'],
            ['Rotate phone to landscape', 'Wider view captures the full tread'],
            ['Align tread in green frame', 'Center the tyre in the scan zone'],
            ['Sweep slowly left to right', 'Records 8 seconds — auto-stops'],
          ].map(([title, desc], i) => (
            <div key={i} style={{ display: 'flex', gap: 14, marginBottom: i < 3 ? 16 : 0 }}>
              <div style={{ width: 24, height: 24, borderRadius: 6, background: 'rgba(0,212,122,0.08)', border: '1px solid rgba(0,212,122,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00d47a', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{i + 1}</div>
              <div>
                <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: 500, margin: '0 0 2px' }}>{title}</p>
                <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 12, margin: 0 }}>{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {stage === 'prompt' && <LandscapePrompt onContinue={() => setStage('camera')} onClose={() => setStage('home')} />}
      {stage === 'camera' && <CameraCapture onCapture={(url) => { setCapturedVideos(p => [url, ...p]); setStage('home'); }} onClose={() => setStage('home')} />}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&display=swap');
        @keyframes ringPulse { 0%,100%{transform:scale(1);opacity:0.6} 50%{transform:scale(1.15);opacity:0.2} }
      `}</style>
    </div>
  );
};

export default Home;