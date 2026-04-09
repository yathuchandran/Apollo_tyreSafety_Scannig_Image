import { useState, useRef, useEffect } from 'react';

// ─── CAMERA CAPTURE ──────────────────────────────────────────────────────────
interface CameraCaptureProps {
  onCapture: (videoUrl: string) => void;
  onClose: () => void;
}

// Extended types for torch support
interface ExtendedMediaTrackCapabilities extends MediaTrackCapabilities {
  torch?: boolean;
}

const CameraCapture: React.FC<CameraCaptureProps> = ({ onCapture, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const trackRef = useRef<MediaStreamTrack | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const [isCameraReady, setIsCameraReady] = useState<boolean>(false);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingDuration, setRecordingDuration] = useState<number>(0);
  const [recordingComplete, setRecordingComplete] = useState<boolean>(false);
  const [scanPct, setScanPct] = useState<number>(0);
  const [flashSupported, setFlashSupported] = useState<boolean>(false);
  
  // NEW: UI state for dynamic frames
  const [showLeftFrame, setShowLeftFrame] = useState<boolean>(true);
  const [showRightFrame, setShowRightFrame] = useState<boolean>(false);
  const [recordingPhase, setRecordingPhase] = useState<'start' | 'scanning' | 'end'>('start');

  const durationIntervalRef = useRef<number | null>(null);
  const phaseTimeoutRef = useRef<number | null>(null);

  // Show right frame after 2 seconds, hide left frame
  useEffect(() => {
    if (isRecording && recordingPhase === 'start') {
      phaseTimeoutRef.current = window.setTimeout(() => {
        setShowLeftFrame(false);
        setShowRightFrame(true);
        setRecordingPhase('scanning');
        
        // Vibrate to indicate phase change
        if (navigator.vibrate) navigator.vibrate(200);
      }, 2000);
    }
    return () => {
      if (phaseTimeoutRef.current) clearTimeout(phaseTimeoutRef.current);
    };
  }, [isRecording, recordingPhase]);

  // Reset UI when recording stops
  useEffect(() => {
    if (!isRecording) {
      setShowLeftFrame(true);
      setShowRightFrame(false);
      setRecordingPhase('start');
      if (phaseTimeoutRef.current) clearTimeout(phaseTimeoutRef.current);
    }
  }, [isRecording]);

  // Function to turn on flash
  const turnOnFlash = async (stream: MediaStream) => {
    try {
      const videoTrack = stream.getVideoTracks()[0];
      if (!videoTrack) return;

      trackRef.current = videoTrack;

      const capabilities = videoTrack.getCapabilities() as ExtendedMediaTrackCapabilities;
      const hasTorch = capabilities.torch !== undefined && capabilities.torch === true;

      if (hasTorch) {
        setFlashSupported(true);
        await videoTrack.applyConstraints({
          advanced: [{ torch: true }] as any
        });
        console.log('Flash turned on');
      } else {
        console.log('Flash not supported on this device');
        setFlashSupported(false);
      }
    } catch (error) {
      console.error('Failed to turn on flash:', error);
      setFlashSupported(false);
    }
  };

  // Function to turn off flash
  const turnOffFlash = async () => {
    try {
      if (trackRef.current) {
        const capabilities = trackRef.current.getCapabilities() as ExtendedMediaTrackCapabilities;
        const hasTorch = capabilities.torch !== undefined && capabilities.torch === true;

        if (hasTorch) {
          await trackRef.current.applyConstraints({
            advanced: [{ torch: false }] as any
          });
          console.log('Flash turned off');
        }
      }
    } catch (error) {
      console.error('Failed to turn off flash:', error);
    }
  };

  // Animate scan line (horizontal movement)
  useEffect(() => {
    if (!isRecording || recordingPhase !== 'scanning') { 
      setScanPct(0); 
      return; 
    }
    let x = 0; 
    let dir = 1;
    const id = setInterval(() => {
      x += dir * 2.2;
      if (x >= 100) dir = -1;
      if (x <= 0) dir = 1;
      setScanPct(x);
    }, 16);
    return () => clearInterval(id);
  }, [isRecording, recordingPhase]);

  // ─── CROP LOGIC ──────────────────────────────────────────────────────
  const drawToCanvas = () => {
    if (!canvasRef.current || !videoRef.current || !isRecording) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { alpha: false });

    if (!ctx || video.videoWidth === 0 || video.videoHeight === 0) {
      animationFrameRef.current = requestAnimationFrame(drawToCanvas);
      return;
    }

    // Crop from left side to right side (full width capture, but only specific height)
    const leftTrimPercent = 0.35;
    const topTrimPercent = 0.20;
    const heightPercent = 0.30;

    const sx = video.videoWidth * leftTrimPercent;
    const sy = video.videoHeight * topTrimPercent;
    const sWidth = video.videoWidth - sx;
    const sHeight = video.videoHeight * heightPercent;

    canvas.width = sWidth;
    canvas.height = sHeight;

    ctx.drawImage(
      video,
      sx, sy, sWidth, sHeight,
      0, 0, sWidth, sHeight
    );

    animationFrameRef.current = requestAnimationFrame(drawToCanvas);
  };

  // Start canvas drawing when recording begins
  useEffect(() => {
    if (isRecording && videoRef.current) {
      drawToCanvas();
    }
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [isRecording]);

  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'environment',
            width: { ideal: 1280 },
            height: { ideal: 960 },
            aspectRatio: { exact: 4 / 3 },
          },
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          streamRef.current = stream;
          videoRef.current.onloadedmetadata = () => {
            setIsCameraReady(true);
            turnOnFlash(stream);
          };
        }
      } catch {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: 'environment',
              width: { ideal: 1280 },
              height: { ideal: 960 },
            },
          });
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            streamRef.current = stream;
            videoRef.current.onloadedmetadata = () => {
              setIsCameraReady(true);
              turnOnFlash(stream);
            };
          }
        } catch {
          alert('Camera access denied. Please enable camera permissions.');
          onClose();
        }
      }
    };
    startCamera();

    // Create hidden canvas for selective recording
    canvasRef.current = document.createElement('canvas');
    canvasRef.current.style.display = 'none';
    document.body.appendChild(canvasRef.current);

    return () => {
      turnOffFlash();
      streamRef.current?.getTracks().forEach((t: MediaStreamTrack) => t.stop());
      if (durationIntervalRef.current) clearInterval(durationIntervalRef.current);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (canvasRef.current) document.body.removeChild(canvasRef.current);
      if (phaseTimeoutRef.current) clearTimeout(phaseTimeoutRef.current);
    };
  }, [onClose]);

  const startRecording = () => {
    if (!streamRef.current || isRecording || !isCameraReady || !canvasRef.current) return;

    // Reset UI state
    setShowLeftFrame(true);
    setShowRightFrame(false);
    setRecordingPhase('start');
    
    // Start the canvas drawing loop
    setIsRecording(true);
    drawToCanvas();

    // RECORD FROM CANVAS, NOT CAMERA
    const canvasStream = canvasRef.current.captureStream(30);

    const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp8')
      ? 'video/webm;codecs=vp8'
      : 'video/webm';

    const mr = new MediaRecorder(canvasStream, { mimeType });
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

    mr.start(1000);
    setRecordingDuration(0);
    durationIntervalRef.current = setInterval(() => {
      setRecordingDuration(prev => prev + 1);
    }, 1000);
  };

  const stopRecording = () => {
    if (!isRecording || !mediaRecorderRef.current) return;
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    if (phaseTimeoutRef.current) clearTimeout(phaseTimeoutRef.current);
    mediaRecorderRef.current.stop();
    setIsRecording(false);
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = Math.min((recordingDuration / 60) * 100, 100);

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
      {/* Flash indicator */}
      {flashSupported && isCameraReady && !isRecording && (
        <div style={{
          position: 'absolute',
          top: 70,
          right: 20,
          zIndex: 20,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(8px)',
          padding: '6px 12px',
          borderRadius: 20,
          border: '1px solid rgba(255,255,255,0.1)',
          pointerEvents: 'none',
        }}>
          <div style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: '#FFD700',
            boxShadow: '0 0 8px #FFD700',
            animation: 'pulse 1.5s ease-in-out infinite',
          }} />
          <span style={{
            color: '#FFD700',
            fontSize: 10,
            fontWeight: 500,
            letterSpacing: '0.5px',
          }}>FLASH ON</span>
        </div>
      )}

      {/* Camera feed container */}
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
        <div style={{
          width: '100%',
          height: 'auto',
          aspectRatio: '6 / 7',
          position: 'relative',
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
      </div>

      {/* Vignette */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse 90% 130% at 50% 50%, transparent 30%, rgba(0,0,0,0.65) 100%)',
      }} />

      {/* Top gradient */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 100,
        background: 'linear-gradient(to bottom, rgba(0,0,0,0.82), transparent)',
        pointerEvents: 'none',
        zIndex: 5,
      }} />
      {/* Bottom gradient */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: 120,
        background: 'linear-gradient(to top, rgba(0,0,0,0.85), transparent)',
        pointerEvents: 'none',
        zIndex: 5,
      }} />

      {/* ══ START FRAME (LEFT SIDE) - Shows first 2 seconds ══ */}
      {showLeftFrame && isRecording && recordingPhase === 'start' && (
        <div style={{
          position: 'absolute',
          left: 0,
          top: '50%',
          transform: 'translateY(-50%)',
          width: '30%',
          height: '40%',
          pointerEvents: 'none',
          zIndex: 15,
          animation: 'fadeOutLeft 0.5s ease-in-out forwards',
          animationDelay: '1.5s',
        }}>
          <svg
            viewBox="0 0 300 300"
            style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '100%' }}
          >
            <defs>
              <linearGradient id="startGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#00d47a" stopOpacity="0.95" />
                <stop offset="100%" stopColor="#00d47a" stopOpacity="0.3" />
              </linearGradient>
              <filter id="glowStart">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Curved tyre edge */}
            <path
              d="M 50 10 Q 25 30 40 70 L 40 230 Q 25 270 50 290"
              fill="none"
              stroke="url(#startGrad)"
              strokeWidth="5"
              strokeLinecap="round"
              filter="url(#glowStart)"
            />

            <path
              d="M 70 20 Q 50 40 60 80 L 60 220 Q 50 260 70 280"
              fill="none"
              stroke="#00d47a"
              strokeOpacity="0.4"
              strokeWidth="2.5"
              strokeLinecap="round"
            />

            {/* START label */}
            <text x="40" y="140" fill="#00d47a" fontSize="12" fontWeight="700" textAnchor="end" fontFamily="monospace" letterSpacing="2">
              START
            </text>
            <text x="40" y="155" fill="#00d47a" fontSize="8" fontWeight="600" textAnchor="end" fontFamily="monospace">
              HERE →
            </text>

            {/* Arrow */}
            <path
              d="M 55 145 L 85 145 M 80 140 L 85 145 L 80 150"
              stroke="#00d47a"
              strokeWidth="2.5"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <animate attributeName="opacity" values="0.4;1;0.4" dur="0.6s" repeatCount="indefinite" />
            </path>

            {/* Guide lines */}
            {[80, 110, 140, 170, 200, 230].map((y) => (
              <line key={y} x1="55" y1={y} x2="85" y2={y - 8} stroke="#00d47a" strokeWidth="1.5" opacity="0.5" strokeLinecap="round" />
            ))}
          </svg>

          <div style={{
            position: 'absolute', bottom: -35, left: '50%', transform: 'translateX(-50%)',
            background: 'rgba(0,212,122,0.2)', backdropFilter: 'blur(8px)',
            padding: '4px 12px', borderRadius: 20, whiteSpace: 'nowrap',
            border: '1px solid rgba(0,212,122,0.5)',
          }}>
            <span style={{ color: '#00d47a', fontSize: 10, fontWeight: 600 }}>POSITION TYRE HERE →</span>
          </div>
        </div>
      )}

      {/* ══ END FRAME (RIGHT SIDE) - Appears after 2 seconds ══ */}
      {showRightFrame && isRecording && recordingPhase === 'scanning' && (
        <div style={{
          position: 'absolute',
          right: 0,
          top: '50%',
          transform: 'translateY(-50%)',
          width: '30%',
          height: '40%',
          pointerEvents: 'none',
          zIndex: 15,
          animation: 'slideInRight 0.4s ease-out',
        }}>
          <svg
            viewBox="0 0 300 300"
            style={{ position: 'absolute', right: 0, top: 0, width: '100%', height: '100%' }}
          >
            <defs>
              <linearGradient id="endGrad" x1="100%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#ef4444" stopOpacity="0.95" />
                <stop offset="100%" stopColor="#ef4444" stopOpacity="0.3" />
              </linearGradient>
              <filter id="glowEnd">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Curved tyre edge (mirrored) */}
            <path
              d="M 250 10 Q 275 30 260 70 L 260 230 Q 275 270 250 290"
              fill="none"
              stroke="url(#endGrad)"
              strokeWidth="5"
              strokeLinecap="round"
              filter="url(#glowEnd)"
            />

            <path
              d="M 230 20 Q 250 40 240 80 L 240 220 Q 250 260 230 280"
              fill="none"
              stroke="#ef4444"
              strokeOpacity="0.4"
              strokeWidth="2.5"
              strokeLinecap="round"
            />

            {/* END label */}
            <text x="260" y="140" fill="#ef4444" fontSize="12" fontWeight="700" textAnchor="start" fontFamily="monospace" letterSpacing="2">
              END
            </text>
            <text x="260" y="155" fill="#ef4444" fontSize="8" fontWeight="600" textAnchor="start" fontFamily="monospace">
              ← HERE
            </text>

            {/* Arrow pointing left */}
            <path
              d="M 245 145 L 215 145 M 220 140 L 215 145 L 220 150"
              stroke="#ef4444"
              strokeWidth="2.5"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <animate attributeName="opacity" values="0.4;1;0.4" dur="0.6s" repeatCount="indefinite" />
            </path>

            {/* Guide lines */}
            {[80, 110, 140, 170, 200, 230].map((y) => (
              <line key={y} x1="245" y1={y} x2="215" y2={y - 8} stroke="#ef4444" strokeWidth="1.5" opacity="0.5" strokeLinecap="round" />
            ))}
          </svg>

          <div style={{
            position: 'absolute', bottom: -35, left: '50%', transform: 'translateX(-50%)',
            background: 'rgba(239,68,68,0.2)', backdropFilter: 'blur(8px)',
            padding: '4px 12px', borderRadius: 20, whiteSpace: 'nowrap',
            border: '1px solid rgba(239,68,68,0.5)',
          }}>
            <span style={{ color: '#ef4444', fontSize: 10, fontWeight: 600 }}>← STOP WHEN TYRE REACHES HERE</span>
          </div>
        </div>
      )}

      {/* ══ SCANNING LINE ANIMATION ══ */}
      {isRecording && recordingPhase === 'scanning' && (
        <div style={{
          position: 'absolute',
          top: '20%',
          left: 0,
          width: '100%',
          height: '30%',
          pointerEvents: 'none',
          zIndex: 16,
          overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute',
            left: `${scanPct}%`,
            top: 0,
            bottom: 0,
            width: 3,
            background: 'linear-gradient(180deg, transparent, #00d47a, #00d47a, transparent)',
            boxShadow: '0 0 12px #00d47a',
            animation: 'pulse 0.4s ease-in-out infinite',
          }} />
        </div>
      )}

      {/* Phase indicator text */}
      {isRecording && (
        <div style={{
          position: 'absolute',
          top: '15%',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 17,
          pointerEvents: 'none',
          textAlign: 'center',
        }}>
          <div style={{
            background: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(12px)',
            padding: '6px 16px',
            borderRadius: 40,
            border: `1px solid ${recordingPhase === 'start' ? 'rgba(0,212,122,0.5)' : 'rgba(239,68,68,0.5)'}`,
          }}>
            <span style={{
              color: recordingPhase === 'start' ? '#00d47a' : '#ef4444',
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: '2px',
              fontFamily: 'monospace',
            }}>
              {recordingPhase === 'start' ? '← START HERE' : recordingPhase === 'scanning' ? 'MOVE PHONE →' : ''}
            </span>
          </div>
        </div>
      )}

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
            {isRecording ? formatDuration(recordingDuration) : '0:00'}
          </span>
        </div>
      </div>

      {/* ══ BOTTOM BAR ══ */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        padding: '16px 28px 28px',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14,
        zIndex: 10,
      }}>
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
              <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>Move phone from LEFT to RIGHT across tread</span>
            </div>
          </div>
        )}
        {isRecording && (
          <div style={{ width: '100%', maxWidth: 200 }}>
            <div style={{
              width: '100%', height: 3, borderRadius: 2,
              background: 'rgba(255,255,255,0.08)', overflow: 'hidden', marginBottom: 5,
            }}>
              <div style={{
                height: '100%', borderRadius: 2,
                background: 'linear-gradient(90deg, #00c46e, #ef4444)',
                width: `${progress}%`, transition: 'width 1s linear',
              }} />
            </div>
            <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10 }}>
              Recording: {formatDuration(recordingDuration)}
            </span>
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            padding: '5px 10px', borderRadius: 8,
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
          }}>
            <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#00d47a' }} />
            <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10, fontFamily: 'monospace' }}>CROP · HD</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            {!isRecording ? (
              <button
                onClick={startRecording}
                disabled={!isCameraReady || recordingComplete}
                style={{
                  position: 'relative', background: 'none', border: 'none', padding: 0,
                  cursor: (!isCameraReady || recordingComplete) ? 'not-allowed' : 'pointer',
                  opacity: (!isCameraReady || recordingComplete) ? 0.4 : 1,
                }}
              >
                <div style={{
                  width: 64, height: 64, borderRadius: '50%',
                  border: '2px solid rgba(255,255,255,0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'rgba(255,255,255,0.05)',
                }}>
                  <div style={{
                    width: 44, height: 44,
                    borderRadius: '50%',
                    background: '#00d47a',
                    boxShadow: '0 0 20px rgba(0,212,122,0.55)',
                  }} />
                </div>
              </button>
            ) : (
              <button
                onClick={stopRecording}
                style={{
                  position: 'relative', background: 'none', border: 'none', padding: 0,
                  cursor: 'pointer',
                }}
              >
                <div style={{
                  width: 64, height: 64, borderRadius: '50%',
                  border: '2px solid rgba(239,68,68,0.45)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'rgba(239,68,68,0.07)',
                }}>
                  <div style={{
                    width: 44, height: 44,
                    borderRadius: 8,
                    background: '#ef4444',
                    boxShadow: '0 0 20px rgba(239,68,68,0.6)',
                  }} />
                </div>
              </button>
            )}
            <span style={{
              color: isRecording ? '#ef4444' : 'rgba(255,255,255,0.35)',
              fontSize: 10, letterSpacing: '0.08em',
              animation: isRecording ? 'blink 1s ease-in-out infinite' : 'none',
            }}>
              {isRecording ? '● STOP' : isCameraReady ? 'TAP TO SCAN' : 'LOADING...'}
            </span>
          </div>

          <div style={{ width: 72 }} />
        </div>
      </div>

      {/* ══ SCAN COMPLETE ══ */}
      {recordingComplete && (
        <div style={{
          position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.65)',
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
        @keyframes dashMove { to { stroke-dashoffset: -30; } }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.2} }
        @keyframes fadeIn { from{opacity:0} to{opacity:1} }
        @keyframes fadeOutLeft {
          from { opacity: 1; transform: translateY(-50%) translateX(0); }
          to { opacity: 0; transform: translateY(-50%) translateX(-50px); }
        }
        @keyframes slideInRight {
          from { opacity: 0; transform: translateY(-50%) translateX(50px); }
          to { opacity: 1; transform: translateY(-50%) translateX(0); }
        }
        @keyframes scaleIn {
          from{transform:scale(0.5);opacity:0}
          60%{transform:scale(1.06)}
          to{transform:scale(1);opacity:1}
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
};

// ─── INSTRUCTIONS PROMPT ─────────────────────────────────────────────────────
interface InstructionsPromptProps {
  onContinue: () => void;
  onClose: () => void;
}

const InstructionsPrompt: React.FC<InstructionsPromptProps> = ({ onContinue, onClose }) => (
  <div style={{
    position: 'fixed',
    inset: 0,
    zIndex: 40,
    background: '#080c10',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: "'DM Sans', sans-serif",
    overflow: 'hidden',
  }}>
    <div style={{
      position: 'absolute', inset: 0, pointerEvents: 'none',
      background: 'radial-gradient(ellipse 70% 50% at 50% 60%, rgba(0,210,120,0.07) 0%, transparent 70%)',
    }} />
    <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.04, pointerEvents: 'none' }}>
      <defs>
        <pattern id="pg" width="32" height="32" patternUnits="userSpaceOnUse">
          <path d="M 32 0 L 0 0 0 32" fill="none" stroke="#00d47a" strokeWidth="0.5" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#pg)" />
    </svg>

    <button onClick={onClose} style={{
      position: 'absolute', top: 20, left: 20,
      background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: 12, width: 40, height: 40, cursor: 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: 'rgba(255,255,255,0.5)', fontSize: 18,
      zIndex: 1,
    }}>✕</button>

    <div style={{ position: 'absolute', top: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 1 }}>
      <span style={{ color: 'rgba(255,255,255,0.15)', fontSize: 11, letterSpacing: '0.35em', textTransform: 'uppercase', fontWeight: 500, whiteSpace: 'nowrap' }}>
        APOLLO · TREAD SCAN
      </span>
    </div>

    <div style={{
      position: 'relative',
      zIndex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 24,
      padding: '60px 32px 32px',
      maxWidth: 360,
      width: '100%',
    }}>
      <div style={{ position: 'relative', width: 120, height: 120, flexShrink: 0 }}>
        <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '1px solid rgba(0,212,122,0.15)', animation: 'spin 12s linear infinite' }} />
        <div style={{ position: 'absolute', inset: 12, borderRadius: '50%', border: '1px dashed rgba(0,212,122,0.1)', animation: 'spin 8s linear infinite reverse' }} />
        <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,212,122,0.1) 0%, transparent 70%)' }} />
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
          animation: 'phoneRotate 3s cubic-bezier(0.4,0,0.2,1) infinite',
        }}>
          <svg width="40" height="68" viewBox="0 0 48 82" fill="none">
            <rect x="1" y="1" width="46" height="80" rx="8" fill="rgba(0,212,122,0.06)" stroke="rgba(0,212,122,0.6)" strokeWidth="1.5" />
            <rect x="6" y="10" width="36" height="54" rx="3" fill="rgba(0,212,122,0.04)" stroke="rgba(0,212,122,0.2)" strokeWidth="1" />
            <rect x="18" y="70" width="12" height="3" rx="1.5" fill="rgba(0,212,122,0.4)" />
            <circle cx="24" cy="5.5" r="1.5" fill="rgba(0,212,122,0.3)" />
            <line x1="6" y1="37" x2="42" y2="37" stroke="rgba(0,212,122,0.3)" strokeWidth="0.8" strokeDasharray="3 2" />
          </svg>
        </div>
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} viewBox="0 0 150 150">
          <path d="M 130 75 A 55 55 0 0 0 75 20" stroke="rgba(0,212,122,0.45)" strokeWidth="2" fill="none" strokeLinecap="round" strokeDasharray="8 4" style={{ animation: 'dashMove2 2s linear infinite' }} />
          <polygon points="73,13 81,23 65,23" fill="rgba(0,212,122,0.65)" />
        </svg>
      </div>

      <div style={{ textAlign: 'center' }}>
        <h2 style={{ color: '#fff', fontSize: 20, fontWeight: 600, margin: '0 0 8px', letterSpacing: '-0.5px' }}>
          Guided Tread Recording
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, lineHeight: 1.6, margin: 0 }}>
          Start at the left green frame, move phone across tread, stop when tyre reaches the red frame
        </p>
      </div>

      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {[
          { icon: '🟢', label: 'Start: Position tyre at LEFT green frame' },
          { icon: '➡️', label: 'Move phone horizontally across the tread' },
          { icon: '🔴', label: 'Stop: When tyre reaches RIGHT red frame' },
          { icon: '✂', label: 'Only the framed area is recorded' },
        ].map((s, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 12,
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 12, padding: '10px 14px',
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
        border: 'none', borderRadius: 14, padding: '16px 32px',
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
        background: 'radial-gradient(ellipse 60% 40% at 30% 20%, rgba(0,212,122,0.06) 0%, transparent 60%), radial-gradient(ellipse 50% 50% at 80% 80%, rgba(0,100,255,0.04) 0%, transparent 60%)',
      }} />
      <svg style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', opacity: 0.035, zIndex: 0, pointerEvents: 'none' }}>
        <defs>
          <pattern id="hg" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#00d47a" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#hg)" />
      </svg>

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
            AI-powered tyre tread depth analysis
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
              <p style={{ color: 'rgba(255,255,255,0.33)', fontSize: 13, margin: '0 0 22px' }}>Guided left-to-right capture</p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 8, flexWrap: 'wrap' }}>
                {['Start guide', 'End guide', 'Full coverage'].map(f => (
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
            { value: 'Guided', unit: '', label: 'Mode' },
            { value: 'HD', unit: '', label: 'Output' },
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
                  <span style={{ padding: '2px 8px', borderRadius: 6, background: 'rgba(0,212,122,0.08)', color: '#00d47a', fontSize: 10 }}>Guided</span>
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: 20 }}>
          <p style={{ color: 'rgba(255,255,255,0.28)', fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', margin: '0 0 16px' }}>How it works</p>
          {([
            ['Tap "Start Tyre Scan"', 'Launches the guided camera scanner'],
            ['Hold phone steady', 'Position tyre at LEFT green frame'],
            ['After 2 sec, red END frame appears', 'Move phone until tyre reaches red frame'],
            ['Tap STOP when tyre reaches red frame', 'Perfectly cropped output video'],
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