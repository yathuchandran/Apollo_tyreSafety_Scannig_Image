import { useState, useRef, useEffect } from 'react';

interface CameraCaptureProps {
  initialMode: 'video' | 'photo_tread' | 'photo_sidewall';
  onCapture: (croppedVideoUrl: string, originalVideoUrl: string) => void;
  onPhotoCapture: (imageUrl: string, type: 'tread' | 'sidewall') => void;
  onClose: () => void;
}

// Extended types for torch support
interface ExtendedMediaTrackCapabilities extends MediaTrackCapabilities {
  torch?: boolean;
  // zoom?: any;
}

const CameraCapture: React.FC<CameraCaptureProps> = ({ initialMode, onCapture, onPhotoCapture, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const croppedRecorderRef = useRef<MediaRecorder | null>(null);
  const originalRecorderRef = useRef<MediaRecorder | null>(null);
  const croppedChunksRef = useRef<Blob[]>([]);
  const originalChunksRef = useRef<Blob[]>([]);
  const trackRef = useRef<MediaStreamTrack | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const [isCameraReady, setIsCameraReady] = useState<boolean>(false);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingDuration, setRecordingDuration] = useState<number>(0);
  const [recordingComplete] = useState<boolean>(false);
  const [scanPct, setScanPct] = useState<number>(0);
  const [flashSupported, setFlashSupported] = useState<boolean>(false);
  const [showEndFrame, setShowEndFrame] = useState<boolean>(false);

  // New states for Photo Mode
  const [captureType] = useState<'video' | 'photo'>(initialMode === 'video' ? 'video' : 'photo');
  const [photoSubMode] = useState<'tread' | 'sidewall'>(initialMode === 'photo_sidewall' ? 'sidewall' : 'tread');
  const [isCapturingPhoto, setIsCapturingPhoto] = useState<boolean>(false);

  const durationIntervalRef = useRef<number | null>(null);
  const stopTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const recordingStartTimeRef = useRef<number>(0);

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

  const applyZoom = async (stream: MediaStream, zoomLevel: number) => {
    try {
      const videoTrack = stream.getVideoTracks()[0];
      if (!videoTrack) return;
      const capabilities = videoTrack.getCapabilities() as ExtendedMediaTrackCapabilities;
      if (capabilities.zoom) {
        await videoTrack.applyConstraints({
          advanced: [{ zoom: zoomLevel }] as any
        });
        console.log(`Zoom applied: ${zoomLevel}`);
      }
    } catch (error) {
      console.error('Failed to apply zoom:', error);
    }
  };

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

  // Monitor recording duration to switch frames at 2 seconds
  useEffect(() => {
    if (isRecording && recordingDuration >= 2) {
      setShowEndFrame(true);
    } else if (!isRecording) {
      setShowEndFrame(false);
    }
  }, [recordingDuration, isRecording]);

  // ─── SYMMETRICAL CROP LOGIC - ADJUSTABLE ────────────────────────────────────
  // ─── DYNAMIC CROP LOGIC - Changes based on recording phase ────────────────────
  // ─── CROP LOGIC - Start with NO right trim, then adjust ────────────────────
  // ─── SIMPLE CROP LOGIC - Capture from left trim to full right edge ─────
  const drawToCanvas = () => {
    if (!canvasRef.current || !videoRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { alpha: false });

    if (!ctx || video.videoWidth === 0) {
      animationFrameRef.current = requestAnimationFrame(drawToCanvas);
      return;
    }

    // --- FIX 2: Rely on the canvas dimensions set in startRecording ---
    const leftTrimPercent = 0.20;
    const topStartPct = 0.20;

    const sx = video.videoWidth * leftTrimPercent;
    const sy = video.videoHeight * topStartPct;

    // Draw using the pre-calculated canvas width/height
    ctx.drawImage(
      video,
      sx,
      sy,
      canvas.width,
      canvas.height,
      0,
      0,
      canvas.width,
      canvas.height
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
            width: { ideal: 1920 },
            height: { ideal: 1080 },
            // Removed strict aspectRatio: { exact: 4 / 3 } to allow for a native, full-height mobile view.
          },
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          streamRef.current = stream;
          videoRef.current.onloadedmetadata = () => {
            setIsCameraReady(true);
            turnOnFlash(stream);
            if (initialMode === 'photo_sidewall' || initialMode === 'photo_tread') {
              // Explicitly reset zoom to 1.0 to remove any 'default' zooming
              applyZoom(stream, 1.0);
            }
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

    canvasRef.current = document.createElement('canvas');
    canvasRef.current.style.display = 'none';
    document.body.appendChild(canvasRef.current);

    return () => {
      turnOffFlash();
      streamRef.current?.getTracks().forEach((t: MediaStreamTrack) => t.stop());
      if (durationIntervalRef.current) clearInterval(durationIntervalRef.current);
      if (stopTimeoutRef.current) clearTimeout(stopTimeoutRef.current);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (canvasRef.current) document.body.removeChild(canvasRef.current);
    };
  }, [onClose]);

  const startRecording = () => {
    if (!streamRef.current || isRecording || !isCameraReady || !canvasRef.current || !videoRef.current) return;

    setShowEndFrame(false);

    const video = videoRef.current;
    const canvas = canvasRef.current;

    // --- CROP PARAMETERS ---
    const leftTrimPercent = 0.20; // Start at 20%
    const heightPct = 0.30;       // 30% tall slice

    // sx is our starting point on the X axis
    const sx = video.videoWidth * leftTrimPercent;

    // Calculate width to reach the ABSOLUTE right edge (100% width)
    // video.videoWidth - sx gives us every pixel remaining to the right
    const sWidth = video.videoWidth - sx;
    const sHeight = video.videoHeight * heightPct;

    // VP8/WebM encoders prefer even numbers for dimensions.
    // We set the canvas size once here and do NOT change it during the loop.
    canvas.width = Math.floor(sWidth / 2) * 2;
    canvas.height = Math.floor(sHeight / 2) * 2;

    croppedChunksRef.current = [];
    originalChunksRef.current = [];

    const canvasStream = canvas.captureStream(30);
    const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp8')
      ? 'video/webm;codecs=vp8'
      : 'video/webm';

    const croppedRecorder = new MediaRecorder(canvasStream, { mimeType });
    croppedRecorderRef.current = croppedRecorder;

    croppedRecorder.ondataavailable = (e: BlobEvent) => {
      if (e.data.size > 0) croppedChunksRef.current.push(e.data);
    };

    const originalRecorder = new MediaRecorder(streamRef.current, { mimeType });
    originalRecorderRef.current = originalRecorder;

    originalRecorder.ondataavailable = (e: BlobEvent) => {
      if (e.data.size > 0) originalChunksRef.current.push(e.data);
    };

    let croppedReady = false;
    let originalReady = false;

    const processVideos = () => {
      if (croppedReady && originalReady) {
        const croppedBlob = new Blob(croppedChunksRef.current, { type: mimeType });
        const originalBlob = new Blob(originalChunksRef.current, { type: mimeType });
        onCapture(URL.createObjectURL(croppedBlob), URL.createObjectURL(originalBlob));
      }
    };

    croppedRecorder.onstop = () => { croppedReady = true; processVideos(); };
    originalRecorder.onstop = () => { originalReady = true; processVideos(); };

    croppedRecorder.start(1000);
    originalRecorder.start(1000);

    recordingStartTimeRef.current = Date.now();
    setRecordingDuration(0);
    durationIntervalRef.current = setInterval(() => {
      setRecordingDuration(prev => prev + 1);
    }, 1000);

    setIsRecording(true);
    drawToCanvas();
  };

  const stopRecording = () => {
    if (!isRecording) return;

    console.log('Stopping both recorders at the same time...');

    // Get the actual recording duration
    const actualDuration = Math.floor((Date.now() - recordingStartTimeRef.current) / 1000);
    console.log(`Actual recording duration: ${actualDuration} seconds`);

    // Stop BOTH recorders immediately
    if (croppedRecorderRef.current && croppedRecorderRef.current.state === 'recording') {
      croppedRecorderRef.current.stop();
    }
    if (originalRecorderRef.current && originalRecorderRef.current.state === 'recording') {
      originalRecorderRef.current.stop();
    }

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    setIsRecording(false);
    setShowEndFrame(false);

    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !isCameraReady) return;

    setIsCapturingPhoto(true);
    if (navigator.vibrate) navigator.vibrate(100);

    const video = videoRef.current;

    // Create a temporary canvas for capture
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    if (context) {
      // Set canvas dimensions to match video stream
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Draw the current video frame to the canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Get the image as a data URL (JPEG)
      const imageDataUrl = canvas.toDataURL('image/jpeg', 0.9);

      // Brief delay for shutter effect
      setTimeout(() => {
        onPhotoCapture(imageDataUrl, photoSubMode);
        setIsCapturingPhoto(false);
      }, 300);
    }
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
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
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        </div>
      </div>

      {/* Capture Shutter Animation */}
      {isCapturingPhoto && (
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'white',
          zIndex: 100,
          animation: 'shutter 0.3s ease-out'
        }} />
      )}

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

      {/* ══ CONDITIONAL FRAMES ══ */}
      {captureType === 'video' ? (
        /* Video Scan Frame */
        <div style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          width: 'min(82%, calc(100% * 6 / 7 * 0.82))',
          aspectRatio: '3.7 / 7',
          pointerEvents: 'none',
          zIndex: 15,
        }}>
          <svg
            viewBox="0 0 280 630"
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

            <rect x="4" y="4" width="272" height="622" rx="16" fill="rgba(0,212,122,0.03)" />

            <path
              d="M 28 18 L 58 18 Q 62 18 62 22 L 62 48"
              fill="none"
              stroke="#00d47a"
              strokeOpacity="0.35"
              strokeWidth="1.2"
              strokeLinecap="round"
            />
            <path
              d="M 252 18 L 222 18 Q 218 18 218 22 L 218 48"
              fill="none"
              stroke="#00d47a"
              strokeOpacity="0.35"
              strokeWidth="1.2"
              strokeLinecap="round"
            />
            <path
              d="M 28 612 L 58 612 Q 62 612 62 608 L 62 582"
              fill="none"
              stroke="#00d47a"
              strokeOpacity="0.35"
              strokeWidth="1.2"
              strokeLinecap="round"
            />
            <path
              d="M 252 612 L 222 612 Q 218 612 218 608 L 218 582"
              fill="none"
              stroke="#00d47a"
              strokeOpacity="0.35"
              strokeWidth="1.2"
              strokeLinecap="round"
            />

            {[126, 210, 315, 420, 504].map((y, i) => (
              <line
                key={y}
                x1="15"
                y1={y}
                x2="265"
                y2={y}
                stroke="#00d47a"
                strokeWidth={i === 2 ? 1.2 : 0.6}
                opacity={i === 2 ? 0.35 : 0.12}
                strokeDasharray={i === 2 ? "none" : "4 6"}
              />
            ))}

            <circle cx="140" cy="315" r="8" fill="none" stroke="#00d47a" strokeWidth="1.5" opacity="0.7">
              <animate attributeName="opacity" values="0.2;0.9;0.2" dur="2s" repeatCount="indefinite" />
            </circle>
            <circle cx="140" cy="315" r="3" fill="#00d47a" opacity="0.5">
              <animate attributeName="r" values="2;4;2" dur="1.5s" repeatCount="indefinite" />
            </circle>
            <line x1="122" y1="315" x2="158" y2="315" stroke="#00d47a" strokeWidth="0.8" opacity="0.4" />
            <line x1="140" y1="297" x2="140" y2="333" stroke="#00d47a" strokeWidth="0.8" opacity="0.4" />

            {[126, 210, 315, 420, 504].map((y, i) => (
              <g key={`tick-${y}`}>
                <line
                  x1="12"
                  y1={y}
                  x2={i === 2 ? 20 : 17}
                  y2={y}
                  stroke="#00d47a"
                  strokeWidth={i === 2 ? 2 : 1}
                  opacity="0.5"
                  strokeLinecap="round"
                />
                <line
                  x1="268"
                  y1={y}
                  x2={i === 2 ? 260 : 263}
                  y2={y}
                  stroke="#00d47a"
                  strokeWidth={i === 2 ? 2 : 1}
                  opacity="0.5"
                  strokeLinecap="round"
                />
              </g>
            ))}

            {isRecording && (
              <line
                x1="12"
                y1={scanPct * 6.3}
                x2="268"
                y2={scanPct * 6.3}
                stroke="#00d47a"
                strokeWidth="2.5"
                opacity="0.85"
                filter="url(#glow)"
              >
                <animate attributeName="opacity" values="0.3;0.95;0.3" dur="0.4s" repeatCount="indefinite" />
              </line>
            )}

            <rect
              x="8"
              y="8"
              width="264"
              height="614"
              rx="12"
              fill="none"
              stroke="rgba(0,212,122,0.25)"
              strokeWidth="1"
              strokeDasharray="8 6"
              style={{ animation: 'dashMove 4s linear infinite' }}
            />
          </svg>

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
      ) : (
        /* Photo Frames */
        <div style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 15,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          {photoSubMode === 'tread' ? (
            /* Original Tread PHOTO Frame: Arched Profile (Increased Size) */
            <div style={{
              width: '100%',
              height: '100%',
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <svg viewBox="0 0 110 170" style={{ width: '92%', height: '92%', overflow: 'visible' }}>
                {/* Tyre Profile Outline (Scaled Up) */}
                <path
                  d="M 5 2 Q -5 85 5 168 L 105 168 Q 115 85 105 2 Z"
                  fill="none"
                  stroke="#00d47a"
                  strokeWidth="2.8"
                  strokeDasharray="7 4"
                  filter="drop-shadow(0 0 10px rgba(0,212,122,0.45))"
                />

                {/* Internal Tread Pattern Lines (Scaled Up) */}
                <line x1="35" y1="10" x2="35" y2="160" stroke="#00d47a" strokeWidth="1.2" opacity="0.4" />
                <line x1="50" y1="10" x2="50" y2="160" stroke="#00d47a" strokeWidth="1.2" opacity="0.4" />
                <line x1="65" y1="10" x2="65" y2="160" stroke="#00d47a" strokeWidth="1.2" opacity="0.4" />
                <line x1="80" y1="10" x2="80" y2="160" stroke="#00d47a" strokeWidth="1.2" opacity="0.4" />

                {/* Horizontal Level Guides */}
                <line x1="2" y1="40" x2="108" y2="40" stroke="#00d47a" strokeWidth="0.6" opacity="0.25" />
                <line x1="2" y1="85" x2="108" y2="85" stroke="#00d47a" strokeWidth="0.6" opacity="0.25" />
                <line x1="2" y1="130" x2="108" y2="130" stroke="#00d47a" strokeWidth="0.6" opacity="0.25" />

                {/* Center Crosshair */}
                <circle cx="55" cy="85" r="5" stroke="#00d47a" strokeWidth="1.2" fill="none" />
                <line x1="48" y1="85" x2="62" y2="85" stroke="#00d47a" strokeWidth="1.2" />
                <line x1="55" y1="78" x2="55" y2="92" stroke="#00d47a" strokeWidth="1.2" />
              </svg>

              <div style={{
                position: 'absolute', bottom: '15%', left: '50%', transform: 'translateX(-50%)',
                background: 'rgba(0,212,122,0.95)', padding: '8px 18px', borderRadius: 8,
                color: '#001a0d', fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap',
                boxShadow: '0 4px 14px rgba(0,0,0,0.35)', zIndex: 20
              }}>
                ALIGN TREAD IN PROFILE
              </div>
            </div>
          ) : (
            /* Refined Sidewall PHOTO Frame: Professional Wide-Arc rotated for landscape */
            <div style={{
              width: '100%',
              height: '100%',
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <svg
                viewBox="0 0 400 300"
                style={{
                  width: "100%",
                  height: "100%",
                  position: "absolute",
                  top: 0,
                  left: 0,
                  transform: 'rotate(90deg)',
                  transformOrigin: 'center center'
                }}
              >
                <defs>
                  {/* Glow Effects */}
                  <filter id="glowGreen">
                    <feGaussianBlur stdDeviation="3.5" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>

                {/* 🔵 Instruction Text - Centered vertically in the 300-unit space */}
                <text
                  x="200"
                  y="45"
                  textAnchor="middle"
                  fontSize="8.5"
                  fill="#f63b3b"
                  fontWeight="700"
                  letterSpacing="1.8"
                >
                  ALIGN TYRE TEXT INSIDE FRAME
                </text>

                {/* 🟢 Curved Capture Zone (Continuous Arched Shell - No straight cuts) */}
                <path
                  d="M 5 282 A 400 350 0 0 1 395 282 Q 410 150 392 18 A 400 350 0 0 0 8 18 Q -10 150 5 282 Z"
                  fill="rgba(34,197,94,0.18)"
                  stroke="#22c55e"
                  strokeWidth="3.2"
                  filter="url(#glowGreen)"
                />

                {/* 🔴 Main Alignment Arc (Full Width Span) */}
                {/* <path
                  d="M 5 165 A 410 240 0 0 1 395 165"
                  fill="none"
                  stroke="#ef4444"
                  strokeWidth="1.8"
                  strokeDasharray="12 10"
                /> */}

                {/* 🎯 Center Crosshair (Centered at y=150) */}
                {/* <circle cx="200" cy="150" r="14" stroke="#3b82f6" fill="none" strokeWidth="2.2" /> */}
                {/* <line x1="178" y1="150" x2="222" y2="150" stroke="#3b82f6" strokeWidth="2.2" /> */}
                {/* <line x1="200" y1="128" x2="200" y2="172" stroke="#3b82f6" strokeWidth="2.2" /> */}

                {/* 🔽 Bottom Hint */}
                {/* <text
                  x="200"
                  y="280"
                  textAnchor="middle"
                  fontSize="8"
                  fill="#9ca3af"
                  fontWeight="500"
                >
                  Keep tyre straight • Good lighting
                </text> */}
              </svg>
            </div>
          )}
        </div>
      )}

      {/* ══ LEFT SIDE TYRE CURVED EDGE (START FRAME) ══ */}
      {captureType === 'video' && (!isRecording || (isRecording && !showEndFrame)) && (
        <div style={{
          position: 'absolute',
          left: 0,
          top: '50%',
          transform: 'translateY(-50%)',
          width: '100%',
          height: '60%',
          pointerEvents: 'none',
          zIndex: 15,
        }}>
          <svg
            viewBox="0 0 300 300"
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              height: '100%',
              width: '100%',
              rotate: '90deg',
            }}
          >
            <defs>
              <linearGradient id="tyreGlow" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#00d47a" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#00d47a" stopOpacity="0.2" />
              </linearGradient>
              <filter id="softGlow">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            <path
              d="M 50 10 Q 25 30 40 70 L 40 230 Q 25 270 50 290"
              fill="none"
              stroke="url(#tyreGlow)"
              strokeWidth="5"
              strokeLinecap="round"
              filter="url(#softGlow)"
            />

            <path
              d="M 70 20 Q 50 40 60 80 L 60 220 Q 50 260 70 280"
              fill="none"
              stroke="#00d47a"
              strokeOpacity="0.4"
              strokeWidth="2.5"
              strokeLinecap="round"
            />

            <path
              d="M 45 15 Q 20 35 35 75 L 35 235 Q 20 265 45 295"
              fill="none"
              stroke="#00d47a"
              strokeOpacity="0.25"
              strokeWidth="1.2"
              strokeDasharray="5 6"
              strokeLinecap="round"
            />

            <line
              x1="50"
              y1="70"
              x2="50"
              y2="230"
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

            <polygon
              points="55,145 70,135 70,155"
              fill="#00d47a"
              opacity="0.8"
            >
              {!isRecording && (
                <animate attributeName="opacity" values="0.4;1;0.4" dur="1.5s" repeatCount="indefinite" />
              )}
            </polygon>

            {isRecording && (
              <>
                <line
                  x1="70"
                  y1="145"
                  x2="250"
                  y2="145"
                  stroke="#00d47a"
                  strokeWidth="2"
                  opacity="0.4"
                  strokeDasharray="6 4"
                >
                  <animate attributeName="stroke-dashoffset" from="0" to="-20" dur="1s" repeatCount="indefinite" />
                </line>
                <polygon
                  points="250,140 265,145 250,150"
                  fill="#00d47a"
                  opacity="0.6"
                >
                  <animate attributeName="opacity" values="0.3;0.8;0.3" dur="0.8s" repeatCount="indefinite" />
                </polygon>
              </>
            )}

            <text
              x="40"
              y="140"
              fill="#00d47a"
              fontSize="9"
              fontWeight="700"
              textAnchor="end"
              style={{ fontFamily: 'monospace', letterSpacing: '1px' }}
            >
              START
            </text>
            <text
              x="40"
              y="152"
              fill="#00d47a"
              fontSize="7"
              fontWeight="600"
              textAnchor="end"
              style={{ fontFamily: 'monospace' }}
            >
              HERE →
            </text>

            {[80, 110, 140, 170, 200, 230].map((y) => (
              <line
                key={y}
                x1="55"
                y1={y}
                x2="70"
                y2={y - 8}
                stroke="#00d47a"
                strokeWidth="1.5"
                opacity="0.6"
                strokeLinecap="round"
              />
            ))}

            {isRecording && (
              <line
                x1={50 + (scanPct * 2.2)}
                y1="70"
                x2={50 + (scanPct * 2.2)}
                y2="230"
                stroke="#00d47a"
                strokeWidth="2"
                opacity="0.7"
                filter="url(#softGlow)"
              >
                <animate attributeName="opacity" values="0.3;0.9;0.3" dur="0.4s" repeatCount="indefinite" />
              </line>
            )}
          </svg>
        </div>
      )}

      {/* ══ RIGHT SIDE TYRE CURVED EDGE (END FRAME) ══ */}
      {captureType === 'video' && (isRecording && showEndFrame) && (
        <div style={{
          position: 'absolute',
          right: 0,
          top: '50%',
          transform: 'translateY(0%)',
          width: '100%',
          height: '60%',
          pointerEvents: 'none',
          zIndex: 15,
        }}>
          <svg
            viewBox="0 0 300 300"
            style={{
              position: 'absolute',
              right: 0,
              bottom: '50%',
              height: '100%',
              width: '100%',
              rotate: '-90deg',
            }}
          >
            <defs>
              <linearGradient id="tyreGlowRight" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#00d47a" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#00d47a" stopOpacity="0.2" />
              </linearGradient>
              <filter id="softGlowRight">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            <path
              d="M 50 10 Q 25 30 40 70 L 40 230 Q 25 270 50 290"
              fill="none"
              stroke="url(#tyreGlowRight)"
              strokeWidth="5"
              strokeLinecap="round"
              filter="url(#softGlowRight)"
            />

            <path
              d="M 70 20 Q 50 40 60 80 L 60 220 Q 50 260 70 280"
              fill="none"
              stroke="#00d47a"
              strokeOpacity="0.4"
              strokeWidth="2.5"
              strokeLinecap="round"
            />

            <line
              x1="50"
              y1="70"
              x2="50"
              y2="230"
              stroke="#00d47a"
              strokeWidth="3"
              opacity="0.9"
              strokeDasharray="8 4"
              filter="url(#softGlowRight)"
            >
              {isRecording && (
                <animate attributeName="opacity" values="0.5;1;0.5" dur="1s" repeatCount="indefinite" />
              )}
            </line>

            <text
              x="40"
              y="140"
              fill="#00d47a"
              fontSize="10"
              fontWeight="700"
              textAnchor="end"
              style={{ fontFamily: 'monospace', letterSpacing: '1px' }}
            >
              END
            </text>
            <text
              x="40"
              y="152"
              fill="#00d47a"
              fontSize="8"
              fontWeight="600"
              textAnchor="end"
              style={{ fontFamily: 'monospace' }}
            >
              HERE →
            </text>

            {[80, 110, 140, 170, 200, 230].map((y) => (
              <line
                key={y}
                x1="55"
                y1={y}
                x2="70"
                y2={y - 8}
                stroke="#00d47a"
                strokeWidth="1.5"
                opacity="0.6"
                strokeLinecap="round"
              />
            ))}
          </svg>
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
        {/* Note: Mode Switchers removed as per requirement for separate sections */}

        {captureType === 'video' ? (
          /* Video Controls */
          <>
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
          </>
        ) : (
          /* Photo Controls */
          <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <button
                  onClick={capturePhoto}
                  disabled={!isCameraReady || isCapturingPhoto}
                  style={{
                    position: 'relative', background: 'none', border: 'none', padding: 0,
                    cursor: (!isCameraReady || isCapturingPhoto) ? 'not-allowed' : 'pointer',
                    opacity: (!isCameraReady || isCapturingPhoto) ? 0.4 : 1,
                  }}
                >
                  <div style={{
                    width: 72, height: 72, borderRadius: '50%',
                    border: '3px solid white',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'rgba(255,255,255,0.1)',
                  }}>
                    <div style={{
                      width: 58, height: 58,
                      borderRadius: '50%',
                      background: 'white',
                      boxShadow: '0 0 20px rgba(255,255,255,0.4)',
                    }} />
                  </div>
                </button>
                <span style={{
                  color: 'white',
                  fontSize: 10, letterSpacing: '0.1em', fontWeight: 600
                }}>
                  {isCameraReady ? 'CLICK PHOTO' : 'LOADING...'}
                </span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ══ SCAN COMPLETE ══ */}
      {recordingComplete && (
        <div style={{
          position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.85)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          animation: 'fadeIn 0.3s ease',
          zIndex: 20,
          overflow: 'auto',
        }}>
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24,
            animation: 'scaleIn 0.4s cubic-bezier(0.34,1.56,0.64,1)',
            padding: '40px 20px',
            maxWidth: 500,
            width: '100%',
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
        @keyframes shutter {
          0% { opacity: 0; }
          20% { opacity: 1; }
          100% { opacity: 0; }
        }
      `}</style>
    </div>
  );
};

// ─── INSTRUCTIONS PROMPT ─────────────────────────────────────────────────────
interface InstructionsPromptProps {
  mode: 'video' | 'photo_tread' | 'photo_sidewall';
  onContinue: () => void;
  onClose: () => void;
}

const InstructionsPrompt: React.FC<InstructionsPromptProps> = ({ mode, onContinue, onClose }) => (
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
          {mode === 'video' ? 'Selective Tread Recording' : mode === 'photo_tread' ? 'Tread Profile Capture' : 'Sidewall Arc Capture'}
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, lineHeight: 1.6, margin: 0 }}>
          {mode === 'video'
            ? 'Only the tread inside the green frame will be captured — perfect, cropped output'
            : mode === 'photo_tread'
              ? 'Capture high-resolution tread profile with professional arched guides'
              : 'Capture clear sidewall details using the calibrated tyre arc guide'}
        </p>
      </div>

      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {[
          { icon: mode === 'video' ? '◎' : '📷', label: mode === 'video' ? 'Point rear camera at the tread' : 'Choose Tread or Sidewall mode' },
          { icon: '▭', label: mode === 'video' ? 'Align tread inside the green frame' : 'Align tyre within professional guides' },
          { icon: mode === 'video' ? '✂' : '✨', label: mode === 'video' ? 'Only the framed area is recorded' : 'High-resolution still capture' },
          { icon: '●', label: mode === 'video' ? 'Tap scan to start, tap stop when finished' : 'Tap shutter button to capture photo' },
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
  const [captureMode, setCaptureMode] = useState<'video' | 'photo_tread' | 'photo_sidewall'>('video');
  const [capturedVideos, setCapturedVideos] = useState<Array<{ cropped: string; original: string }>>([]);
  const [capturedPhotos, setCapturedPhotos] = useState<Array<{ url: string; type: 'tread' | 'sidewall'; timestamp: number }>>([]);

  // Helper function to download a video from a URL
  const downloadVideo = (url: string, filename: string) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

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

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 20 }}>
          {/* 1. VIDEO SECTION */}
          <button
            onClick={() => {
              setCaptureMode('video');
              setStage('prompt');
            }}
            style={{
              width: '100%', background: 'none',
              border: '1px solid rgba(0,212,122,0.2)', borderRadius: 20,
              padding: 0, cursor: 'pointer', overflow: 'hidden', position: 'relative',
            }}
          >
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(0,212,122,0.1) 0%, rgba(0,100,200,0.05) 100%)' }} />
            <div style={{ position: 'relative', padding: '24px 22px', display: 'flex', alignItems: 'center', gap: 18 }}>
              <div style={{
                width: 52, height: 52, borderRadius: '50%',
                background: 'rgba(0,212,122,0.1)', border: '1px solid rgba(0,212,122,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
              }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#00d47a" strokeWidth="1.5" strokeLinecap="round">
                  <path d="M23 7l-7 5 7 5V7z" /><rect x="1" y="5" width="15" height="14" rx="2" />
                </svg>
              </div>
              <div style={{ textAlign: 'left' }}>
                <h2 style={{ fontSize: 17, fontWeight: 600, margin: '0 0 2px', letterSpacing: '-0.3px', color: 'white' }}>Start Tyre Scan</h2>
                <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, margin: 0 }}>Selective tread recording (Video)</p>
              </div>
            </div>
          </button>

          {/* 2. TREAD PHOTO SECTION */}
          <button
            onClick={() => {
              setCaptureMode('photo_tread');
              setStage('prompt');
            }}
            style={{
              width: '100%', background: 'none',
              border: '1px solid rgba(0,212,122,0.2)', borderRadius: 20,
              padding: 0, cursor: 'pointer', overflow: 'hidden', position: 'relative',
            }}
          >
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(0,212,122,0.08) 0%, rgba(0,212,122,0.03) 100%)' }} />
            <div style={{ position: 'relative', padding: '22px 22px', display: 'flex', alignItems: 'center', gap: 18 }}>
              <div style={{
                width: 52, height: 52, borderRadius: '50%',
                background: 'rgba(0,212,122,0.1)', border: '1px solid rgba(0,212,122,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
              }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#00d47a" strokeWidth="1.5" strokeLinecap="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <circle cx="12" cy="12" r="3" />
                  <path d="M12 9v6M9 12h6" />
                </svg>
              </div>
              <div style={{ textAlign: 'left' }}>
                <h2 style={{ fontSize: 17, fontWeight: 600, margin: '0 0 2px', letterSpacing: '-0.3px', color: 'white' }}>Tread Photo Capture</h2>
                <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, margin: 0 }}>Arched tyre profile (Still)</p>
              </div>
            </div>
          </button>

          {/* 3. SIDEWALL PHOTO SECTION */}
          <button
            onClick={() => {
              setCaptureMode('photo_sidewall');
              setStage('prompt');
            }}
            style={{
              width: '100%', background: 'none',
              border: '1px solid rgba(59,130,246,0.2)', borderRadius: 20,
              padding: 0, cursor: 'pointer', overflow: 'hidden', position: 'relative',
            }}
          >
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(59,130,246,0.1) 0%, rgba(0,212,122,0.05) 100%)' }} />
            <div style={{ position: 'relative', padding: '22px 22px', display: 'flex', alignItems: 'center', gap: 18 }}>
              <div style={{
                width: 52, height: 52, borderRadius: '50%',
                background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
              }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="1.5" strokeLinecap="round">
                  <path d="M12 2a10 10 0 0 0-10 10" />
                  <circle cx="12" cy="12" r="4" />
                  <path d="M19 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                </svg>
              </div>
              <div style={{ textAlign: 'left' }}>
                <h2 style={{ fontSize: 17, fontWeight: 600, margin: '0 0 2px', letterSpacing: '-0.3px', color: 'white' }}>Sidewall Photo Capture</h2>
                <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, margin: 0 }}>Tyre side curvature (Still)</p>
              </div>
            </div>
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 28 }}>
          {[
            { value: '±0.1', unit: 'mm', label: 'Accuracy' },
            { value: 'Crop', unit: '', label: 'Mode' },
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
            {capturedVideos.map((video, i) => (
              <div key={i} style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 14,
                padding: 12,
                marginBottom: 16
              }}>
                {/* CROPPED VERSION SECTION */}
                <div style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ color: '#00d47a', fontSize: 11, fontWeight: 600 }}>CROPPED VERSION</span>
                      <span style={{ padding: '2px 8px', borderRadius: 6, background: 'rgba(0,212,122,0.08)', color: '#00d47a', fontSize: 10 }}>Selective Area</span>
                    </div>
                    <button
                      onClick={() => downloadVideo(video.cropped, `tread_scan_cropped_${Date.now()}.webm`)}
                      style={{
                        padding: '4px 12px',
                        borderRadius: 6,
                        background: 'rgba(0,212,122,0.1)',
                        border: '1px solid rgba(0,212,122,0.25)',
                        color: '#00d47a',
                        fontSize: 11,
                        fontWeight: 500,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="7 10 12 15 17 10" />
                        <line x1="12" y1="15" x2="12" y2="3" />
                      </svg>
                      Download Cropped
                    </button>
                  </div>
                  <video src={video.cropped} controls style={{ width: '100%', borderRadius: 8, display: 'block' }} />
                </div>

                {/* ORIGINAL VERSION SECTION */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 600 }}>ORIGINAL (UNCUT)</span>
                      <span style={{ padding: '2px 8px', borderRadius: 6, background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)', fontSize: 10 }}>Full Frame</span>
                    </div>
                    <button
                      onClick={() => downloadVideo(video.original, `tread_scan_original_${Date.now()}.webm`)}
                      style={{
                        padding: '4px 12px',
                        borderRadius: 6,
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.15)',
                        color: 'rgba(255,255,255,0.6)',
                        fontSize: 11,
                        fontWeight: 500,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="7 10 12 15 17 10" />
                        <line x1="12" y1="15" x2="12" y2="3" />
                      </svg>
                      Download Original
                    </button>
                  </div>
                  <video src={video.original} controls style={{ width: '100%', borderRadius: 8, display: 'block' }} />
                </div>

                <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                  <span style={{ color: 'rgba(255,255,255,0.28)', fontSize: 11 }}>Scan #{capturedVideos.length - i}</span>
                  <button
                    onClick={() => {
                      downloadVideo(video.cropped, `tread_scan_cropped_${Date.now()}.webm`);
                      setTimeout(() => {
                        downloadVideo(video.original, `tread_scan_original_${Date.now()}.webm`);
                      }, 150);
                    }}
                    style={{
                      padding: '5px 14px',
                      borderRadius: 20,
                      background: 'linear-gradient(135deg, rgba(0,212,122,0.15), rgba(0,212,122,0.05))',
                      border: '1px solid rgba(0,212,122,0.3)',
                      color: '#00d47a',
                      fontSize: 10,
                      fontWeight: 600,
                      cursor: 'pointer',
                      letterSpacing: '0.3px',
                    }}
                  >
                    Download Both Videos
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Captured Photos Gallery */}
        {capturedPhotos.length > 0 && (
          <div style={{ marginBottom: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, margin: 0, color: 'rgba(255,255,255,0.65)' }}>Captured Photos</h3>
              <span style={{ padding: '2px 10px', borderRadius: 20, background: 'rgba(0,212,122,0.1)', border: '1px solid rgba(0,212,122,0.2)', color: '#00d47a', fontSize: 11 }}>{capturedPhotos.length}</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {capturedPhotos.map((photo, i) => (
                <div key={i} style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  borderRadius: 14,
                  padding: 8,
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  <img src={photo.url} alt={`Capture ${i}`} style={{ width: '100%', aspectRatio: '1/1', objectFit: 'cover', borderRadius: 10 }} />
                  <div style={{
                    position: 'absolute', top: 12, right: 12,
                    padding: '2px 8px', borderRadius: 6,
                    background: photo.type === 'tread' ? 'rgba(0,212,122,0.9)' : 'rgba(59,130,246,0.9)',
                    color: 'white', fontSize: 9, fontWeight: 700, textTransform: 'uppercase'
                  }}>
                    {photo.type}
                  </div>
                  <div style={{ marginTop: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: 'rgba(255,255,255,0.28)', fontSize: 9 }}>{new Date(photo.timestamp).toLocaleTimeString()}</span>
                    <button
                      onClick={() => {
                        const a = document.createElement('a');
                        a.href = photo.url;
                        a.download = `tyre_${photo.type}_${photo.timestamp}.jpg`;
                        a.click();
                      }}
                      style={{
                        padding: '2px 6px',
                        borderRadius: 4,
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        color: 'rgba(255,255,255,0.5)',
                        fontSize: 8,
                        cursor: 'pointer',
                      }}
                    >
                      Save
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: 20 }}>
          <p style={{ color: 'rgba(255,255,255,0.28)', fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', margin: '0 0 16px' }}>How it works</p>
          {([
            ['Tap "Start Tyre Scan"', 'Launches the guided camera scanner'],
            ['Hold phone in portrait mode', 'Point rear camera at the tyre tread'],
            ['Align tread in green frame', 'Only the framed area will be recorded'],
            ['Tap scan to start, stop when done', 'Perfectly cropped output video'],
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
          mode={captureMode}
          onContinue={() => setStage('camera')}
          onClose={() => setStage('home')}
        />
      )}
      {stage === 'camera' && (
        <CameraCapture
          initialMode={captureMode}
          onCapture={(croppedUrl: string, originalUrl: string) => {
            setCapturedVideos((p) => [{ cropped: croppedUrl, original: originalUrl }, ...p]);
            setStage('home');
          }}
          onPhotoCapture={(imageUrl: string, type: 'tread' | 'sidewall') => {
            setCapturedPhotos((p) => [{ url: imageUrl, type, timestamp: Date.now() }, ...p]);
            // Optional: You could show a toast here or auto-close if desired
            // For now, we keep it open for multiple captures as proposed.
          }}
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
