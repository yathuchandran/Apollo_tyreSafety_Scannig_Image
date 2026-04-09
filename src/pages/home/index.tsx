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
  const finalFrameTimeoutRef = useRef<number | null>(null);

  const [isCameraReady, setIsCameraReady] = useState<boolean>(false);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingDuration, setRecordingDuration] = useState<number>(0);
  const [recordingComplete, setRecordingComplete] = useState<boolean>(false);
  const [scanPct, setScanPct] = useState<number>(0);
  const [flashSupported, setFlashSupported] = useState<boolean>(false);

  const durationIntervalRef = useRef<number | null>(null);

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

  // Animate horizontal scan line (for landscape)
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

  // Draw cropped frame to canvas for selective recording - LANDSCAPE MODE
  const drawToCanvas = () => {
    if (!canvasRef.current || !videoRef.current || !isRecording) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { alpha: false });
    
    if (!ctx || video.videoWidth === 0 || video.videoHeight === 0) {
      if (isRecording) {
        animationFrameRef.current = requestAnimationFrame(drawToCanvas);
      }
      return;
    }

    // For LANDSCAPE: crop to wide rectangle (aspect ratio ~ 16/9 or similar)
    // Target aspect ratio for landscape: 7 / 3.7 ≈ 1.89 (wider than tall)
    const targetAspectRatio = 7 / 3.7; // ~1.89 (width/height for landscape)
    const videoAspectRatio = video.videoWidth / video.videoHeight;
    
    let cropWidth, cropHeight, startX, startY;
    
    if (videoAspectRatio > targetAspectRatio) {
      // Video is wider, crop width to match aspect ratio
      cropHeight = video.videoHeight;
      cropWidth = cropHeight * targetAspectRatio;
      startX = (video.videoWidth - cropWidth) / 2;
      startY = 0;
    } else {
      // Video is taller, crop height to match aspect ratio
      cropWidth = video.videoWidth;
      cropHeight = cropWidth / targetAspectRatio;
      startX = 0;
      startY = (video.videoHeight - cropHeight) / 2;
    }
    
    // Set canvas dimensions to match cropped area (landscape orientation)
    canvas.width = cropWidth;
    canvas.height = cropHeight;
    
    // Draw the cropped portion to canvas
    ctx.drawImage(
      video,
      startX, startY, cropWidth, cropHeight,
      0, 0, cropWidth, cropHeight
    );
    
    // Continue the animation loop only if recording
    if (isRecording) {
      animationFrameRef.current = requestAnimationFrame(drawToCanvas);
    }
  };

  // Start canvas drawing when recording begins
  useEffect(() => {
    if (isRecording && videoRef.current && canvasRef.current) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
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
        // Request landscape-friendly resolution
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'environment',
            width: { ideal: 1920 },
            height: { ideal: 1080 },
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
              height: { ideal: 720 },
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
      if (finalFrameTimeoutRef.current) clearTimeout(finalFrameTimeoutRef.current);
      if (canvasRef.current) document.body.removeChild(canvasRef.current);
    };
  }, [onClose]);

  // Draw one final frame to ensure all content is captured
  const drawFinalFrame = () => {
    if (!canvasRef.current || !videoRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { alpha: false });
    
    if (!ctx || video.videoWidth === 0 || video.videoHeight === 0) return;
    
    // Recalculate crop dimensions for landscape
    const targetAspectRatio = 7 / 3.7; // ~1.89
    const videoAspectRatio = video.videoWidth / video.videoHeight;
    
    let cropWidth, cropHeight, startX, startY;
    
    if (videoAspectRatio > targetAspectRatio) {
      cropHeight = video.videoHeight;
      cropWidth = cropHeight * targetAspectRatio;
      startX = (video.videoWidth - cropWidth) / 2;
      startY = 0;
    } else {
      cropWidth = video.videoWidth;
      cropHeight = cropWidth / targetAspectRatio;
      startX = 0;
      startY = (video.videoHeight - cropHeight) / 2;
    }
    
    canvas.width = cropWidth;
    canvas.height = cropHeight;
    
    ctx.drawImage(
      video,
      startX, startY, cropWidth, cropHeight,
      0, 0, cropWidth, cropHeight
    );
  };

  const startRecording = () => {
    if (!streamRef.current || isRecording || !isCameraReady || !canvasRef.current) return;
    if (navigator.vibrate) navigator.vibrate(100);
    
    chunksRef.current = [];
    
    drawFinalFrame();
    
    const canvasStream = canvasRef.current.captureStream(30);
    
    const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp8')
      ? 'video/webm;codecs=vp8'
      : 'video/webm';
    const mr = new MediaRecorder(canvasStream, { mimeType });
    mediaRecorderRef.current = mr;
    
    mr.ondataavailable = (e: BlobEvent) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    
    mr.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' });
      setRecordingComplete(true);
      setTimeout(() => {
        onCapture(URL.createObjectURL(blob));
      }, 800);
    };
    
    mr.start(500);
    setIsRecording(true);
    setRecordingDuration(0);

    durationIntervalRef.current = setInterval(() => {
      setRecordingDuration(prev => prev + 1);
    }, 1000);
  };

  const stopRecording = () => {
    if (!isRecording || !mediaRecorderRef.current) return;
    
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }
    
    drawFinalFrame();
    
    if (finalFrameTimeoutRef.current) clearTimeout(finalFrameTimeoutRef.current);
    
    finalFrameTimeoutRef.current = setTimeout(() => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.requestData();
        
        setTimeout(() => {
          if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop();
          }
          setIsRecording(false);
        }, 100);
      }
    }, 150);
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

      {/* Camera feed container - LANDSCAPE MODE */}
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
          height: '100%',
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
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              minWidth: '100%',
              minHeight: '100%',
              width: 'auto',
              height: 'auto',
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

      {/* ══ LANDSCAPE SCAN FRAME (Horizontal) ══ */}
      <div style={{
        position: 'absolute',
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, -50%)',
        width: 'min(85%, 85%)',
        aspectRatio: '7 / 3.7',
        pointerEvents: 'none',
        zIndex: 15,
      }}>
        <svg
          viewBox="0 0 700 370"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible' }}
        >
          <defs>
            <linearGradient id="frameGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00d47a" stopOpacity="0.9" />
              <stop offset="50%" stopColor="#00d47a" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#00d47a" stopOpacity="0.9" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="2" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <rect x="8" y="8" width="684" height="354" rx="16" fill="rgba(0,212,122,0.03)" />

          {/* Corner brackets */}
          <path d="M 28 18 L 48 18 Q 52 18 52 22 L 52 42" fill="none" stroke="#00d47a" strokeOpacity="0.8" strokeWidth="2" strokeLinecap="round" />
          <path d="M 672 18 L 652 18 Q 648 18 648 22 L 648 42" fill="none" stroke="#00d47a" strokeOpacity="0.8" strokeWidth="2" strokeLinecap="round" />
          <path d="M 28 352 L 48 352 Q 52 352 52 348 L 52 328" fill="none" stroke="#00d47a" strokeOpacity="0.8" strokeWidth="2" strokeLinecap="round" />
          <path d="M 672 352 L 652 352 Q 648 352 648 348 L 648 328" fill="none" stroke="#00d47a" strokeOpacity="0.8" strokeWidth="2" strokeLinecap="round" />

          {/* Vertical guide lines for tread alignment */}
          {[140, 280, 350, 420, 560].map((x, i) => (
            <line
              key={x}
              x1={x}
              y1="15"
              x2={x}
              y2="355"
              stroke="#00d47a"
              strokeWidth={i === 2 ? 1.2 : 0.6}
              opacity={i === 2 ? 0.35 : 0.12}
              strokeDasharray={i === 2 ? "none" : "4 6"}
            />
          ))}

          {/* Center crosshair */}
          <circle cx="350" cy="185" r="8" fill="none" stroke="#00d47a" strokeWidth="1.5" opacity="0.7">
            <animate attributeName="opacity" values="0.2;0.9;0.2" dur="2s" repeatCount="indefinite" />
          </circle>
          <circle cx="350" cy="185" r="3" fill="#00d47a" opacity="0.5">
            <animate attributeName="r" values="2;4;2" dur="1.5s" repeatCount="indefinite" />
          </circle>
          <line x1="332" y1="185" x2="368" y2="185" stroke="#00d47a" strokeWidth="0.8" opacity="0.4" />
          <line x1="350" y1="167" x2="350" y2="203" stroke="#00d47a" strokeWidth="0.8" opacity="0.4" />

          {/* Tick marks on top and bottom */}
          {[140, 280, 350, 420, 560].map((x, i) => (
            <g key={`tick-${x}`}>
              <line
                x1={x}
                y1="12"
                x2={x}
                y2={i === 2 ? 20 : 17}
                stroke="#00d47a"
                strokeWidth={i === 2 ? 2 : 1}
                opacity="0.5"
                strokeLinecap="round"
              />
              <line
                x1={x}
                y1="358"
                x2={x}
                y2={i === 2 ? 350 : 353}
                stroke="#00d47a"
                strokeWidth={i === 2 ? 2 : 1}
                opacity="0.5"
                strokeLinecap="round"
              />
            </g>
          ))}

          {/* Scanning beam - horizontal for landscape */}
          {isRecording && (
            <line
              x1={scanPct * 6.95}
              y1="15"
              x2={scanPct * 6.95}
              y2="355"
              stroke="#00d47a"
              strokeWidth="2.5"
              opacity="0.85"
              filter="url(#glow)"
            >
              <animate attributeName="opacity" values="0.3;0.95;0.3" dur="0.4s" repeatCount="indefinite" />
            </line>
          )}

          {/* Animated dash border */}
          <rect
            x="8"
            y="8"
            width="684"
            height="354"
            rx="12"
            fill="none"
            stroke="rgba(0,212,122,0.25)"
            strokeWidth="1.5"
            strokeDasharray="8 6"
            style={{ animation: 'dashMove 4s linear infinite' }}
          />
        </svg>

        {/* Frame label */}
        <div style={{
          position: 'absolute', top: -32, left: '50%', transform: 'translateX(-50%)',
          display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap',
          background: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(4px)',
          padding: '4px 12px',
          borderRadius: 20,
          border: '1px solid rgba(0,212,122,0.3)',
        }}>
          <div style={{
            width: 7, height: 7, borderRadius: '50%',
            background: isRecording ? '#ef4444' : '#00d47a',
            boxShadow: `0 0 6px ${isRecording ? '#ef4444' : '#00d47a'}`,
            animation: 'blink 1s ease-in-out infinite',
          }} />
          <span style={{
            color: '#00d47a', fontSize: 10, fontWeight: 600,
            letterSpacing: '0.2em', textTransform: 'uppercase', fontFamily: 'monospace',
          }}>
            {isRecording ? 'RECORDING' : 'ALIGN TYRE TREAD'}
          </span>
        </div>
      </div>

      {/* ══ LEFT SIDE TYRE CURVED EDGE - Landscape Version */}
      <div style={{
        position: 'absolute',
        left: 0,
        top: '50%',
        transform: 'translateY(-50%)',
        width: '100%',
        height: '70%',
        pointerEvents: 'none',
        zIndex: 15,
      }}>
        <svg
          viewBox="0 0 800 400"
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: '100%',
            height: '100%',
          }}
        >
          <defs>
            <linearGradient id="tyreGlow" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#00d47a" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#00d47a" stopOpacity="0.1" />
            </linearGradient>
            <filter id="softGlow">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Main tyre edge - curved from left */}
          <path
            d="M 30 50 Q 50 75 70 100 L 70 300 Q 50 325 30 350"
            fill="none"
            stroke="url(#tyreGlow)"
            strokeWidth="5"
            strokeLinecap="round"
            filter="url(#softGlow)"
          />

          {/* Inner parallel edge */}
          <path
            d="M 50 70 Q 70 95 90 120 L 90 280 Q 70 305 50 330"
            fill="none"
            stroke="#00d47a"
            strokeOpacity="0.4"
            strokeWidth="2.5"
            strokeLinecap="round"
          />

          {/* Rough edge detail */}
          <path
            d="M 25 40 Q 45 65 65 90 L 65 310 Q 45 335 25 360"
            fill="none"
            stroke="#00d47a"
            strokeOpacity="0.25"
            strokeWidth="1.2"
            strokeDasharray="5 6"
            strokeLinecap="round"
          />

          {/* Recording start marker */}
          <line
            x1="70"
            y1="100"
            x2="70"
            y2="300"
            stroke="#00d47a"
            strokeWidth="3"
            opacity="0.9"
            strokeDasharray="8 4"
            filter="url(#softGlow)"
          >
            {isRecording && (
              <animate attributeName="opacity" values="0.5;1;0.5" dur="1s" repeatCount="indefinite" />
            )}
          </line>

          {/* Recording start arrow */}
          <polygon
            points="75,195 95,185 95,205"
            fill="#00d47a"
            opacity="0.8"
          >
            {!isRecording && (
              <animate attributeName="opacity" values="0.4;1;0.4" dur="1.5s" repeatCount="indefinite" />
            )}
          </polygon>

          {/* Recording direction arrow (rightward) */}
          {isRecording && (
            <>
              <line
                x1="95"
                y1="195"
                x2="700"
                y2="195"
                stroke="#00d47a"
                strokeWidth="2"
                opacity="0.4"
                strokeDasharray="6 4"
              >
                <animate attributeName="stroke-dashoffset" from="0" to="-20" dur="1s" repeatCount="indefinite" />
              </line>
              <polygon
                points="700,190 720,195 700,200"
                fill="#00d47a"
                opacity="0.6"
              >
                <animate attributeName="opacity" values="0.3;0.8;0.3" dur="0.8s" repeatCount="indefinite" />
              </polygon>
            </>
          )}

          {/* START label */}
          <text
            x="60"
            y="190"
            fill="#00d47a"
            fontSize="9"
            fontWeight="700"
            textAnchor="end"
            style={{ fontFamily: 'monospace', letterSpacing: '1px' }}
          >
            START
          </text>
          <text
            x="60"
            y="205"
            fill="#00d47a"
            fontSize="7"
            fontWeight="600"
            textAnchor="end"
            style={{ fontFamily: 'monospace' }}
          >
            HERE →
          </text>

          {/* Small tread ticks */}
          {[120, 160, 200, 240, 280].map((y) => (
            <line
              key={y}
              x1="80"
              y1={y}
              x2="100"
              y2={y - 8}
              stroke="#00d47a"
              strokeWidth="1.5"
              opacity="0.6"
              strokeLinecap="round"
            />
          ))}

          {/* Scan line - moves horizontally */}
          {isRecording && (
            <line
              x1={80 + (scanPct * 6.2)}
              y1="100"
              x2={80 + (scanPct * 6.2)}
              y2="300"
              stroke="#00d47a"
              strokeWidth="2"
              opacity="0.7"
              filter="url(#softGlow)"
            >
              <animate attributeName="opacity" values="0.3;0.9;0.3" dur="0.4s" repeatCount="indefinite" />
            </line>
          )}

          {/* Right side unlimited indicator */}
          <text
            x="740"
            y="195"
            fill="rgba(255,255,255,0.15)"
            fontSize="7"
            textAnchor="end"
            style={{ fontFamily: 'monospace' }}
          >
            UNLIMITED
          </text>
          <text
            x="740"
            y="208"
            fill="rgba(255,255,255,0.1)"
            fontSize="6"
            textAnchor="end"
            style={{ fontFamily: 'monospace' }}
          >
            COVERAGE →
          </text>
        </svg>
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
              <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>Hold steady · Cover full tread</span>
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
                background: 'linear-gradient(90deg, #00c46e, #00d47a)',
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
            <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10, fontFamily: 'monospace' }}>LANDSCAPE · HD</span>
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
        @keyframes scaleIn {
          from{transform:scale(0.5);opacity:0}
          60%{transform:scale(1.06)}
          to{transform:scale(1);opacity:1}
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.2); }
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
          Landscape Tyre Scanning
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, lineHeight: 1.6, margin: 0 }}>
          Hold your phone horizontally for wider tread coverage
        </p>
      </div>

      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {[
          { icon: '📱', label: 'Hold phone in landscape mode' },
          { icon: '◎', label: 'Point rear camera at the tread' },
          { icon: '▭', label: 'Align tread inside the green frame' },
          { icon: '●', label: 'Tap scan to start, tap stop when finished' },
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
            Landscape mode · Wide tread coverage
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
              <p style={{ color: 'rgba(255,255,255,0.33)', fontSize: 13, margin: '0 0 22px' }}>Landscape orientation · Wide frame</p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 8, flexWrap: 'wrap' }}>
                {['Landscape', 'Cropped output', 'Wide tread'].map(f => (
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
            { value: '16:9', unit: '', label: 'Aspect' },
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
                  <span style={{ padding: '2px 8px', borderRadius: 6, background: 'rgba(0,212,122,0.08)', color: '#00d47a', fontSize: 10 }}>Landscape</span>
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: 20 }}>
          <p style={{ color: 'rgba(255,255,255,0.28)', fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', margin: '0 0 16px' }}>How it works</p>
          {([
            ['Tap "Start Tyre Scan"', 'Launches the landscape camera scanner'],
            ['Hold phone horizontally', 'Rotate to landscape orientation'],
            ['Align tread in green frame', 'Wider frame captures more tread'],
            ['Tap scan to start, stop when done', 'Perfectly cropped landscape output'],
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