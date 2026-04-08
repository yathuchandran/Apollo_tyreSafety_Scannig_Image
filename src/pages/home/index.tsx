import { useState, useRef, useEffect } from 'react';

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

  const [isCameraReady, setIsCameraReady] = useState<boolean>(false);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [timeLeft, setTimeLeft] = useState<number>(8);
  const [recordingComplete, setRecordingComplete] = useState<boolean>(false);
  const [scanPct, setScanPct] = useState<number>(0);

  // Animate vertical scan line
  useEffect(() => {
    if (!isRecording) { setScanPct(0); return; }
    let x = 0; let dir = 1;
    const id = setInterval(() => {
      x += dir * 2.2;
      if (x >= 100) dir = -1;
      if (x <= 0) dir = 1;
      setScanPct(x);
    }, 16);
    return () => clearInterval(id);
  }, [isRecording]);

  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'environment',
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
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
    return () => {
      streamRef.current?.getTracks().forEach((t: MediaStreamTrack) => t.stop());
    };
  }, [onClose]);

  const startRecording = () => {
    if (!streamRef.current || isRecording || !isCameraReady) return;
    if (navigator.vibrate) navigator.vibrate(100);
    const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp8')
      ? 'video/webm;codecs=vp8'
      : 'video/webm';
    const mr = new MediaRecorder(streamRef.current, { mimeType });
    mediaRecorderRef.current = mr;
    chunksRef.current = [];
    mr.ondataavailable = (e: BlobEvent) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
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
  const circ = 2 * Math.PI * 28;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: '#000',
      zIndex: 50,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      height: '100vh',
      width: '100vw',
    }}>
      {/* Camera feed container - Landscape mode (16:9) */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}>
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
      </div>

      {/* Vignette */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse 90% 130% at 50% 50%, transparent 30%, rgba(0,0,0,0.65) 100%)',
      }} />

      {/* Top gradient */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 80,
        background: 'linear-gradient(to bottom, rgba(0,0,0,0.82), transparent)',
        pointerEvents: 'none',
        zIndex: 5,
      }} />
      {/* Bottom gradient */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: 100,
        background: 'linear-gradient(to top, rgba(0,0,0,0.85), transparent)',
        pointerEvents: 'none',
        zIndex: 5,
      }} />

      {/* ══ CURVED SIDE EDGES FRAME — Left side only, inspired by reference image ══ */}
      <div style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 15,
      }}>
        {/* Left side curved edge - Main design */}
        <svg
          viewBox="0 0 120 100"
          preserveAspectRatio="none"
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: '22%',
            height: '100%',
            overflow: 'visible'
          }}
        >
          <defs>
            <linearGradient id="edgeGradLeft" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#00d47a" stopOpacity="0.95" />
              <stop offset="30%" stopColor="#00d47a" stopOpacity="0.6" />
              <stop offset="70%" stopColor="#00d47a" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#00d47a" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="edgeGradLeft2" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#00ff95" stopOpacity="0.7" />
              <stop offset="40%" stopColor="#00d47a" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#00d47a" stopOpacity="0" />
            </linearGradient>
            <filter id="glowLeft">
              <feGaussianBlur stdDeviation="4" result="blur"/>
              <feMerge>
                <feMergeNode in="blur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
            <filter id="glowStrong">
              <feGaussianBlur stdDeviation="6" result="blur"/>
              <feMerge>
                <feMergeNode in="blur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>

          {/* Outermost curved edge - bold */}
          <path
            d="M 28 0 L 8 0 Q 0 0 0 8 L 0 92 Q 0 100 8 100 L 28 100"
            fill="none"
            stroke="url(#edgeGradLeft)"
            strokeWidth="5"
            strokeLinecap="round"
            filter="url(#glowLeft)"
          />

          {/* Secondary curved line - inner */}
          <path
            d="M 38 0 L 16 0 Q 6 0 6 10 L 6 90 Q 6 100 16 100 L 38 100"
            fill="none"
            stroke="url(#edgeGradLeft2)"
            strokeWidth="2.5"
            strokeLinecap="round"
            opacity="0.8"
          />

          {/* Tertiary subtle curve */}
          <path
            d="M 48 0 L 26 0 Q 14 0 14 12 L 14 88 Q 14 100 26 100 L 48 100"
            fill="none"
            stroke="#00d47a"
            strokeOpacity="0.25"
            strokeWidth="1.5"
            strokeLinecap="round"
          />

          {/* Animated dots along the edge */}
          {[8, 20, 32, 44, 56, 68, 80, 92].map((y, i) => (
            <circle
              key={i}
              cx="4"
              cy={y}
              r="2.5"
              fill="#00ff95"
              opacity="0.7"
              filter="url(#glowStrong)"
            >
              <animate 
                attributeName="opacity" 
                values="0.2;1;0.2" 
                dur={`${1.5 + i * 0.15}s`} 
                repeatCount="indefinite" 
              />
              <animate 
                attributeName="r" 
                values="1.5;3;1.5" 
                dur={`${1.5 + i * 0.15}s`} 
                repeatCount="indefinite" 
              />
            </circle>
          ))}

          {/* Decorative dash lines along the curve */}
          <path
            d="M 58 0 L 36 0 Q 22 0 22 14 L 22 86 Q 22 100 36 100 L 58 100"
            fill="none"
            stroke="#00d47a"
            strokeOpacity="0.12"
            strokeWidth="1"
            strokeDasharray="4 6"
          />
        </svg>

        {/* Right side - very subtle mirror for balance (much lighter) */}
        <svg
          viewBox="0 0 120 100"
          preserveAspectRatio="none"
          style={{
            position: 'absolute',
            right: 0,
            top: 0,
            width: '15%',
            height: '100%',
            overflow: 'visible'
          }}
        >
          <defs>
            <linearGradient id="edgeGradRight" x1="100%" y1="0%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#00d47a" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#00d47a" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path
            d="M 92 0 L 112 0 Q 120 0 120 8 L 120 92 Q 120 100 112 100 L 92 100"
            fill="none"
            stroke="url(#edgeGradRight)"
            strokeWidth="2"
            strokeLinecap="round"
            opacity="0.3"
          />
        </svg>

        {/* Scanning beam - full width line */}
        {isRecording && (
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: `${scanPct}%`,
              width: '100%',
              height: '3px',
              background: 'linear-gradient(90deg, #00ff95, #00d47a, #00ff95)',
              boxShadow: '0 0 16px rgba(0,212,122,0.9)',
              transform: 'translateY(-50%)',
              opacity: 0.9,
            }}
          >
            <div style={{
              position: 'absolute',
              left: 0,
              top: -3,
              width: '10px',
              height: '9px',
              background: '#00ff95',
              borderRadius: '50%',
              filter: 'blur(3px)',
              animation: 'pulseLeft 0.4s ease-in-out infinite',
            }} />
            <div style={{
              position: 'absolute',
              right: 0,
              top: -3,
              width: '10px',
              height: '9px',
              background: '#00ff95',
              borderRadius: '50%',
              filter: 'blur(3px)',
              animation: 'pulseRight 0.4s ease-in-out infinite',
            }} />
          </div>
        )}

        {/* Frame label - positioned top center */}
        <div style={{
          position: 'absolute', top: '6%', left: '50%', transform: 'translateX(-50%)',
          display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap',
          background: 'rgba(0,0,0,0.55)',
          backdropFilter: 'blur(8px)',
          padding: '6px 16px',
          borderRadius: 40,
          border: '1px solid rgba(0,212,122,0.35)',
          zIndex: 20,
        }}>
          <div style={{
            width: 8, height: 8, borderRadius: '50%',
            background: isRecording ? '#ef4444' : '#00d47a',
            boxShadow: `0 0 8px ${isRecording ? '#ef4444' : '#00d47a'}`,
            animation: 'blink 1s ease-in-out infinite',
          }} />
          <span style={{
            color: '#00d47a', fontSize: 11, fontWeight: 600,
            letterSpacing: '0.25em', textTransform: 'uppercase', fontFamily: 'monospace',
          }}>
            {isRecording ? 'SCANNING' : 'ALIGN TYRE TREAD'}
          </span>
        </div>

        {/* Corner L-brackets - left side prominent, right side subtle */}
        <div style={{
          position: 'absolute',
          top: '10%',
          left: '6%',
          width: 32,
          height: 32,
          borderTop: '3px solid #00d47a',
          borderLeft: '3px solid #00d47a',
          borderRadius: '8px 0 0 0',
          filter: 'drop-shadow(0 0 6px rgba(0,212,122,0.6))',
        }} />
        <div style={{
          position: 'absolute',
          bottom: '10%',
          left: '6%',
          width: 32,
          height: 32,
          borderBottom: '3px solid #00d47a',
          borderLeft: '3px solid #00d47a',
          borderRadius: '0 0 0 8px',
          filter: 'drop-shadow(0 0 6px rgba(0,212,122,0.6))',
        }} />
        
        {/* Right side subtle corners */}
        <div style={{
          position: 'absolute',
          top: '10%',
          right: '4%',
          width: 24,
          height: 24,
          borderTop: '2px solid rgba(0,212,122,0.4)',
          borderRight: '2px solid rgba(0,212,122,0.4)',
          borderRadius: '0 6px 0 0',
        }} />
        <div style={{
          position: 'absolute',
          bottom: '10%',
          right: '4%',
          width: 24,
          height: 24,
          borderBottom: '2px solid rgba(0,212,122,0.4)',
          borderRight: '2px solid rgba(0,212,122,0.4)',
          borderRadius: '0 0 6px 0',
        }} />

        {/* Horizontal guide lines - subtle */}
        {[20, 35, 50, 65, 80].map((y, i) => (
          <div
            key={y}
            style={{
              position: 'absolute',
              left: i === 2 ? '7%' : '9%',
              right: i === 2 ? '7%' : '9%',
              top: `${y}%`,
              height: '1px',
              background: `linear-gradient(90deg, rgba(0,212,122,${0.5 - i * 0.07}), rgba(0,212,122,${0.15 - i * 0.03}), rgba(0,212,122,0))`,
              opacity: 0.5,
            }}
          />
        ))}

        {/* Center crosshair */}
        <div style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          width: 48,
          height: 48,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <div style={{
            position: 'absolute',
            width: 20,
            height: 20,
            border: '1.5px solid #00d47a',
            borderRadius: '50%',
            opacity: 0.8,
          }}>
            <animate attributeName="opacity" values="0.3;1;0.3" dur="2s" repeatCount="indefinite" />
          </div>
          <div style={{
            position: 'absolute',
            width: 6,
            height: 6,
            background: '#00ff95',
            borderRadius: '50%',
            opacity: 0.7,
            boxShadow: '0 0 10px #00d47a',
          }}>
            <animate attributeName="r" values="2;5;2" dur="1.5s" repeatCount="indefinite" />
          </div>
          <div style={{
            position: 'absolute',
            width: 30,
            height: 1,
            background: 'linear-gradient(90deg, transparent, #00d47a, transparent)',
            opacity: 0.4,
          }} />
          <div style={{
            position: 'absolute',
            width: 1,
            height: 30,
            background: 'linear-gradient(0deg, transparent, #00d47a, transparent)',
            opacity: 0.4,
          }} />
        </div>

        {/* Left side text label */}
        <div style={{
          position: 'absolute',
          left: '8%',
          top: '50%',
          transform: 'translateY(-50%) rotate(-90deg)',
          transformOrigin: 'left center',
          whiteSpace: 'nowrap',
        }}>
          <span style={{
            color: 'rgba(0,212,122,0.35)',
            fontSize: 10,
            letterSpacing: '0.3em',
            fontFamily: 'monospace',
            textTransform: 'uppercase',
          }}>
            SCAN ZONE
          </span>
        </div>
      </div>

      {/* ══ TOP BAR ══ */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        padding: '14px 20px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        zIndex: 10,
      }}>
        <button
          onClick={onClose}
          disabled={isRecording}
          style={{
            width: 42, height: 42, borderRadius: 12,
            background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)',
            color: isRecording ? 'rgba(255,255,255,0.25)' : 'white',
            fontSize: 18, cursor: isRecording ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >✕</button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 7, height: 7, borderRadius: '50%',
            background: isRecording ? '#ef4444' : '#00d47a',
            boxShadow: isRecording ? '0 0 8px rgba(239,68,68,0.9)' : '0 0 8px rgba(0,212,122,0.9)',
            animation: 'blink 1s ease-in-out infinite',
          }} />
          <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, letterSpacing: '0.2em', fontFamily: 'monospace' }}>
            {isRecording ? 'REC' : 'APOLLO'}
          </span>
        </div>

        <div style={{
          padding: '6px 14px', borderRadius: 20,
          background: isRecording ? 'rgba(239,68,68,0.12)' : 'rgba(255,255,255,0.08)',
          border: `1px solid ${isRecording ? 'rgba(239,68,68,0.4)' : 'rgba(255,255,255,0.15)'}`,
        }}>
          <span style={{
            color: isRecording ? '#ef4444' : 'rgba(255,255,255,0.5)',
            fontSize: 12, fontWeight: 600, fontFamily: 'monospace',
          }}>
            {isRecording ? `0:0${timeLeft}` : '0:08'}
          </span>
        </div>
      </div>

      {/* ══ BOTTOM BAR ══ */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        padding: '20px 28px 32px',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14,
        zIndex: 10,
      }}>
        {/* Progress / hint */}
        {!isRecording && isCameraReady && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 4 }}>
              <div style={{ display: 'flex', gap: 3 }}>
                {[0, 1, 2].map(i => (
                  <div key={i} style={{
                    width: 16, height: 2, borderRadius: 1,
                    background: `rgba(0,212,122,${0.3 + i * 0.3})`,
                  }} />
                ))}
              </div>
              <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>Hold steady · aim at tread</span>
            </div>
          </div>
        )}
        {isRecording && (
          <div style={{ width: '100%', maxWidth: 220 }}>
            <div style={{
              width: '100%', height: 3, borderRadius: 2,
              background: 'rgba(255,255,255,0.08)', overflow: 'hidden', marginBottom: 5,
            }}>
              <div style={{
                height: '100%', borderRadius: 2,
                background: 'linear-gradient(90deg, #00c46e, #00ff95)',
                width: `${progress}%`, transition: 'width 1s linear',
              }} />
            </div>
            <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10 }}>
              {8 - timeLeft}s of 8s captured
            </span>
          </div>
        )}

        {/* Record button row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
          {/* Left badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            padding: '5px 10px', borderRadius: 8,
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
          }}>
            <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#00d47a' }} />
            <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10, fontFamily: 'monospace' }}>16:9 · HD</span>
          </div>

          {/* Center record button */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <button
              onClick={startRecording}
              disabled={!isCameraReady || isRecording || recordingComplete}
              style={{
                position: 'relative', background: 'none', border: 'none', padding: 0,
                cursor: (!isCameraReady || isRecording || recordingComplete) ? 'not-allowed' : 'pointer',
                opacity: (!isCameraReady || isRecording || recordingComplete) ? 0.4 : 1,
              }}
            >
              {isRecording && (
                <svg style={{ position: 'absolute', inset: -6, width: 76, height: 76 }} viewBox="0 0 76 76">
                  <circle cx="38" cy="38" r="28" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3" />
                  <circle
                    cx="38" cy="38" r="28" fill="none" stroke="#ef4444" strokeWidth="3"
                    strokeLinecap="round" strokeDasharray={circ}
                    strokeDashoffset={circ - (circ * progress) / 100}
                    transform="rotate(-90 38 38)"
                    style={{ transition: 'stroke-dashoffset 1s linear' }}
                  />
                </svg>
              )}
              <div style={{
                width: 64, height: 64, borderRadius: '50%',
                border: `2px solid ${isRecording ? 'rgba(239,68,68,0.45)' : 'rgba(255,255,255,0.3)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: isRecording ? 'rgba(239,68,68,0.07)' : 'rgba(255,255,255,0.05)',
              }}>
                <div style={{
                  width: 44, height: 44,
                  borderRadius: isRecording ? 8 : '50%',
                  background: isRecording ? '#ef4444' : '#00d47a',
                  transition: 'all 0.3s ease',
                  boxShadow: isRecording ? '0 0 20px rgba(239,68,68,0.6)' : '0 0 20px rgba(0,212,122,0.55)',
                }} />
              </div>
            </button>
            <span style={{
              color: isRecording ? '#ef4444' : 'rgba(255,255,255,0.35)',
              fontSize: 10, letterSpacing: '0.08em',
              animation: isRecording ? 'blink 1s ease-in-out infinite' : 'none',
            }}>
              {isRecording ? `● ${timeLeft}s` : isCameraReady ? 'TAP TO SCAN' : 'LOADING...'}
            </span>
          </div>

          {/* Right spacer */}
          <div style={{ width: 72 }} />
        </div>
      </div>

      {/* ══ SCAN COMPLETE ══ */}
      {recordingComplete && (
        <div style={{
          position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          animation: 'fadeIn 0.3s ease',
          zIndex: 20,
        }}>
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16,
            animation: 'scaleIn 0.4s cubic-bezier(0.34,1.56,0.64,1)',
          }}>
            <div style={{
              width: 72, height: 72, borderRadius: '50%',
              background: 'rgba(0,212,122,0.12)', border: '2px solid rgba(0,212,122,0.5)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                <path d="M7 16l6 6 12-12" stroke="#00d47a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ color: 'white', fontSize: 18, fontWeight: 600, margin: '0 0 4px' }}>Scan Complete</p>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, margin: 0 }}>Processing video…</p>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.2} }
        @keyframes fadeIn { from{opacity:0} to{opacity:1} }
        @keyframes scaleIn {
          from{transform:scale(0.5);opacity:0}
          60%{transform:scale(1.06)}
          to{transform:scale(1);opacity:1}
        }
        @keyframes pulseLeft {
          0%,100% { opacity: 0.4; transform: translateX(0) scale(1); }
          50% { opacity: 1; transform: translateX(5px) scale(1.2); }
        }
        @keyframes pulseRight {
          0%,100% { opacity: 0.4; transform: translateX(0) scale(1); }
          50% { opacity: 1; transform: translateX(-5px) scale(1.2); }
        }
      `}</style>
    </div>
  );
};

// ─── INSTRUCTIONS PROMPT (updated for landscape orientation) ─────────────────
interface InstructionsPromptProps {
  onContinue: () => void;
  onClose: () => void;
}

const InstructionsPrompt: React.FC<InstructionsPromptProps> = ({ onContinue, onClose }) => (
  <div style={{
    position: 'absolute', inset: 0, zIndex: 40,
    background: '#080c10',
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    fontFamily: "'DM Sans', sans-serif",
    overflow: 'hidden',
  }}>
    <div style={{
      position: 'absolute', inset: 0, pointerEvents: 'none',
      background: 'radial-gradient(ellipse 70% 50% at 50% 60%, rgba(0,210,120,0.07) 0%, transparent 70%)',
    }} />
    
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

    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 32, padding: '0 32px', maxWidth: 360, width: '100%' }}>
      {/* Phone icon - landscape orientation */}
      <div style={{ position: 'relative', width: 180, height: 130 }}>
        <div style={{ position: 'absolute', inset: 0, borderRadius: 20, border: '1px solid rgba(0,212,122,0.15)', animation: 'spin 12s linear infinite' }} />
        <div style={{ position: 'absolute', inset: 8, borderRadius: 14, border: '1px dashed rgba(0,212,122,0.1)', animation: 'spin 8s linear infinite reverse' }} />
        <div style={{ position: 'absolute', inset: 0, borderRadius: 20, background: 'radial-gradient(circle, rgba(0,212,122,0.08) 0%, transparent 70%)' }} />
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
          animation: 'phoneRotate 3s cubic-bezier(0.4,0,0.2,1) infinite',
        }}>
          <svg width="140" height="80" viewBox="0 0 140 80" fill="none">
            <rect x="2" y="2" width="136" height="76" rx="12" fill="rgba(0,212,122,0.06)" stroke="rgba(0,212,122,0.6)" strokeWidth="1.5" />
            <rect x="8" y="12" width="124" height="56" rx="6" fill="rgba(0,212,122,0.04)" stroke="rgba(0,212,122,0.2)" strokeWidth="1" />
            <rect x="55" y="70" width="30" height="4" rx="2" fill="rgba(0,212,122,0.4)" />
            <circle cx="120" cy="10" r="2" fill="rgba(0,212,122,0.3)" />
            <line x1="12" y1="40" x2="128" y2="40" stroke="rgba(0,212,122,0.3)" strokeWidth="0.8" strokeDasharray="3 2" />
          </svg>
        </div>
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} viewBox="0 0 180 130">
          <path d="M 160 65 A 70 50 0 0 0 90 15" stroke="rgba(0,212,122,0.45)" strokeWidth="2" fill="none" strokeLinecap="round" strokeDasharray="8 4" style={{ animation: 'dashMove2 2s linear infinite' }} />
          <polygon points="88,8 96,18 80,18" fill="rgba(0,212,122,0.65)" />
        </svg>
      </div>

      <div style={{ textAlign: 'center' }}>
        <h2 style={{ color: '#fff', fontSize: 22, fontWeight: 600, margin: '0 0 10px', letterSpacing: '-0.5px' }}>
          Hold Landscape Mode
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, lineHeight: 1.7, margin: 0 }}>
          Turn your phone sideways — the curved left edge guides you to center the tyre tread.
        </p>
      </div>

      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {[
          { icon: '◎', label: 'Point rear camera at the tread' },
          { icon: '◠', label: 'Align tread along the curved left edge' },
          { icon: '●', label: 'Tap scan — holds steady for 8 seconds' },
        ].map((s, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 12,
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 12, padding: '11px 14px',
          }}>
            <div style={{
              width: 30, height: 30, borderRadius: 8, flexShrink: 0,
              background: 'rgba(0,212,122,0.1)', border: '1px solid rgba(0,212,122,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#00d47a', fontSize: 14,
            }}>{s.icon}</div>
            <span style={{ color: 'rgba(255,255,255,0.65)', fontSize: 13 }}>{s.label}</span>
            <div style={{
              marginLeft: 'auto', width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'rgba(255,255,255,0.2)', fontSize: 10,
            }}>{i + 1}</div>
          </div>
        ))}
      </div>

      <button onClick={onContinue} style={{
        width: '100%',
        background: 'linear-gradient(135deg, #00b863, #00d47a)',
        border: 'none', borderRadius: 14, padding: '17px 32px',
        color: '#001a0d', fontSize: 15, fontWeight: 700,
        letterSpacing: '0.2px', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
      }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <path d="M23 7l-7 5 7 5V7z" /><rect x="1" y="5" width="15" height="14" rx="2" />
        </svg>
        Open Scanner
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
      @keyframes dashMove2 { to { stroke-dashoffset: -24; } }
    `}</style>
  </div>
);

// ─── HOME ────────────────────────────────────────────────────────────────────
const Home: React.FC = () => {
  const [stage, setStage] = useState<'home' | 'prompt' | 'camera'>('home');
  const [capturedVideos, setCapturedVideos] = useState<string[]>([]);

  return (
    <div style={{
      minHeight: '100vh', background: '#080c10',
      fontFamily: "'DM Sans', sans-serif", color: 'white',
      position: 'relative', overflow: 'hidden',
    }}>
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
        background: 'radial-gradient(ellipse 60% 40% at 30% 20%, rgba(0,212,122,0.06) 0%, transparent 60%)',
      }} />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 440, margin: '0 auto', padding: '0 24px 48px' }}>
        <div style={{ paddingTop: 64, marginBottom: 52 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <div style={{
              width: 30, height: 30, borderRadius: 8,
              background: 'rgba(0,212,122,0.12)', border: '1px solid rgba(0,212,122,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#00d47a" strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="12" r="3" /><path d="M2 12h3M19 12h3M12 2v3M12 19v3" />
              </svg>
            </div>
            <span style={{ color: 'rgba(255,255,255,0.22)', fontSize: 11, letterSpacing: '0.3em', textTransform: 'uppercase' }}>APOLLO SYSTEM</span>
          </div>
          <h1 style={{ fontSize: 40, fontWeight: 700, margin: '0 0 8px', letterSpacing: '-1.5px', lineHeight: 1.1 }}>
            Tread<span style={{ color: '#00d47a' }}>Scan</span>
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.38)', fontSize: 14, margin: 0, lineHeight: 1.6 }}>
            AI-powered tyre tread depth analysis in 8 seconds
          </p>
        </div>

        <button onClick={() => setStage('prompt')} style={{
          width: '100%', background: 'none',
          border: '1px solid rgba(0,212,122,0.2)', borderRadius: 20,
          padding: 0, cursor: 'pointer', overflow: 'hidden', position: 'relative', marginBottom: 20,
        }}>
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(0,212,122,0.08) 0%, rgba(0,100,200,0.04) 100%)' }} />
          <div style={{ position: 'relative', padding: '34px 32px' }}>
            <div style={{ marginBottom: 26, display: 'flex', justifyContent: 'center' }}>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', inset: -12, borderRadius: '50%', border: '1px solid rgba(0,212,122,0.15)', animation: 'ringPulse 2.5s ease-in-out infinite' }} />
                <div style={{ position: 'absolute', inset: -24, borderRadius: '50%', border: '1px solid rgba(0,212,122,0.07)', animation: 'ringPulse 2.5s ease-in-out infinite 0.5s' }} />
                <div style={{
                  width: 68, height: 68, borderRadius: '50%',
                  background: 'rgba(0,212,122,0.1)', border: '1px solid rgba(0,212,122,0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#00d47a" strokeWidth="1.5" strokeLinecap="round">
                    <path d="M23 7l-7 5 7 5V7z" /><rect x="1" y="5" width="15" height="14" rx="2" />
                  </svg>
                </div>
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: 11, letterSpacing: '0.25em', margin: '0 0 8px', textTransform: 'uppercase' }}>Tap to begin</p>
              <h2 style={{ fontSize: 21, fontWeight: 600, margin: '0 0 6px', letterSpacing: '-0.4px' }}>Start Tyre Scan</h2>
              <p style={{ color: 'rgba(255,255,255,0.33)', fontSize: 13, margin: '0 0 22px' }}>8-second guided video capture</p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 8, flexWrap: 'wrap' }}>
                {['Landscape mode', 'HD capture', 'Auto-timed'].map(f => (
                  <span key={f} style={{
                    padding: '4px 12px', borderRadius: 20,
                    background: 'rgba(0,212,122,0.08)', border: '1px solid rgba(0,212,122,0.15)',
                    color: 'rgba(0,212,122,0.8)', fontSize: 11, fontWeight: 500,
                  }}>{f}</span>
                ))}
              </div>
            </div>
          </div>
        </button>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 28 }}>
          {[
            { value: '±0.1', unit: 'mm', label: 'Accuracy' },
            { value: '8', unit: 's', label: 'Scan time' },
            { value: '4K', unit: '', label: 'Resolution' },
          ].map(s => (
            <div key={s.label} style={{
              background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 14, padding: '14px 10px', textAlign: 'center',
            }}>
              <div style={{ marginBottom: 2 }}>
                <span style={{ fontSize: 19, fontWeight: 700, letterSpacing: '-0.5px' }}>{s.value}</span>
                <span style={{ fontSize: 11, color: '#00d47a', fontWeight: 600 }}>{s.unit}</span>
              </div>
              <p style={{ color: 'rgba(255,255,255,0.28)', fontSize: 11, margin: 0 }}>{s.label}</p>
            </div>
          ))}
        </div>

        {capturedVideos.length > 0 && (
          <div style={{ marginBottom: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, margin: 0, color: 'rgba(255,255,255,0.65)' }}>Recent Scans</h3>
              <span style={{ padding: '2px 10px', borderRadius: 20, background: 'rgba(0,212,122,0.1)', border: '1px solid rgba(0,212,122,0.2)', color: '#00d47a', fontSize: 11 }}>{capturedVideos.length}</span>
            </div>
            {capturedVideos.map((url, i) => (
              <div key={i} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: 12, marginBottom: 10 }}>
                <video src={url} controls style={{ width: '100%', borderRadius: 8, display: 'block' }} />
                <div style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'rgba(255,255,255,0.28)', fontSize: 11 }}>Scan #{capturedVideos.length - i}</span>
                  <span style={{ padding: '2px 8px', borderRadius: 6, background: 'rgba(0,212,122,0.08)', color: '#00d47a', fontSize: 10 }}>Captured</span>
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: 20 }}>
          <p style={{ color: 'rgba(255,255,255,0.28)', fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', margin: '0 0 16px' }}>How it works</p>
          {([
            ['Tap "Start Tyre Scan"', 'Launches the guided camera scanner'],
            ['Hold phone in landscape mode', 'Point rear camera at the tyre tread'],
            ['Align tread along curved left edge', 'Centre the tyre in the scan zone'],
            ['Hold steady for 8 seconds', 'Records then auto-stops and saves'],
          ] as [string, string][]).map(([title, desc], i) => (
            <div key={i} style={{ display: 'flex', gap: 14, marginBottom: i < 3 ? 16 : 0 }}>
              <div style={{
                width: 24, height: 24, borderRadius: 6, flexShrink: 0,
                background: 'rgba(0,212,122,0.08)', border: '1px solid rgba(0,212,122,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#00d47a', fontSize: 11, fontWeight: 700,
              }}>{i + 1}</div>
              <div>
                <p style={{ color: 'rgba(255,255,255,0.68)', fontSize: 13, fontWeight: 500, margin: '0 0 2px' }}>{title}</p>
                <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 12, margin: 0 }}>{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {stage === 'prompt' && (
        <InstructionsPrompt
          onContinue={() => setStage('camera')}
          onClose={() => setStage('home')}
        />
      )}
      {stage === 'camera' && (
        <CameraCapture
          onCapture={(url: string) => { setCapturedVideos((p: string[]) => [url, ...p]); setStage('home'); }}
          onClose={() => setStage('home')}
        />
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&display=swap');
        @keyframes ringPulse { 0%,100%{transform:scale(1);opacity:0.6} 50%{transform:scale(1.15);opacity:0.2} }
      `}</style>
    </div>
  );
};

export default Home;