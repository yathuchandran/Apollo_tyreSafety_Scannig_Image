import React, { useEffect, useRef, useState } from 'react';
import { X, RotateCcw } from 'lucide-react';

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
  const [isLandscape, setIsLandscape] = useState(
    window.innerWidth > window.innerHeight
  );

  // Monitor orientation changes
  useEffect(() => {
    const handleResize = () => {
      setIsLandscape(window.innerWidth > window.innerHeight);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  // Camera initialization
  useEffect(() => {
    const startCamera = async () => {
      try {
        // Request landscape orientation lock
        if (screen.orientation && screen.orientation.lock) {
          try {
            await screen.orientation.lock('landscape');
          } catch (err) {
            console.log('Orientation lock not supported');
          }
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'environment',
            width: { ideal: 1920 },
            height: { ideal: 1080 }
          }
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          streamRef.current = stream;
          videoRef.current.onloadedmetadata = () => {
            setIsCameraReady(true);
          };
        }
      } catch (err) {
        alert('Camera access denied. Please enable camera permissions.');
        onClose();
      }
    };

    startCamera();

    return () => {
      // Stop camera
      streamRef.current?.getTracks().forEach(track => track.stop());
      
      // Unlock orientation
      if (screen.orientation && screen.orientation.unlock) {
        screen.orientation.unlock();
      }
    };
  }, [onClose]);

  // Recording logic
  const startRecording = () => {
    if (!streamRef.current || isRecording || !isLandscape) return;

    if (navigator.vibrate) navigator.vibrate(200);

    const mediaRecorder = new MediaRecorder(streamRef.current, {
      mimeType: 'video/webm;codecs=vp8'
    });
    mediaRecorderRef.current = mediaRecorder;
    chunksRef.current = [];

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' });
      const videoUrl = URL.createObjectURL(blob);
      setRecordingComplete(true);
      
      setTimeout(() => {
        onCapture(videoUrl);
      }, 500);
    };

    mediaRecorder.start();
    setIsRecording(true);
    setTimeLeft(8);

    let seconds = 8;
    const interval = setInterval(() => {
      seconds--;
      setTimeLeft(seconds);

      if (seconds === 0) {
        clearInterval(interval);
        mediaRecorder.stop();
        setIsRecording(false);
      }
    }, 1000);
  };

  // Block portrait mode - MANDATORY LANDSCAPE
  if (!isLandscape) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col items-center justify-center text-white z-50">
        <div className="text-center px-8">
          <div className="mb-8 relative">
            <div className="inline-block border-4 border-blue-400 rounded-2xl p-4 animate-rotate">
              📱
            </div>
            <RotateCcw className="absolute -right-2 -top-2 w-12 h-12 text-blue-400 animate-spin-slow" />
          </div>
          
          <h2 className="text-3xl font-bold mb-4">Rotate Your Device</h2>
          <p className="text-gray-300 text-lg mb-2">
            Please use <span className="text-blue-400 font-semibold">landscape mode</span>
          </p>
          <p className="text-gray-400 text-sm">
            Tire scanning requires horizontal orientation
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black z-50 overflow-hidden">
      {/* Video Feed */}
      <div className="relative w-full h-full">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="absolute inset-0 w-full h-full object-cover"
        />
      </div>

      {/* Overlay UI */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Dark overlay - except scan area */}
        <div className="absolute inset-0 bg-black/60" />

        {/* Tire Scan Frame - Horizontal Ellipse (Landscape) */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[85%] max-w-[700px] h-[50%] max-h-[350px]">
          
          {/* Clear center area for tire */}
          <div className="absolute inset-0 rounded-[50%] bg-transparent border-0" 
               style={{ 
                 boxShadow: '0 0 0 9999px rgba(0,0,0,0.7)',
                 clipPath: 'none'
               }} 
          />

          {/* Tire Frame SVG */}
          <svg viewBox="0 0 700 350" className="w-full h-full absolute inset-0" preserveAspectRatio="none">
            <defs>
              <linearGradient id="frameGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" style={{ stopColor: '#10b981', stopOpacity: 0.8 }} />
                <stop offset="50%" style={{ stopColor: '#22c55e', stopOpacity: 1 }} />
                <stop offset="100%" style={{ stopColor: '#10b981', stopOpacity: 0.8 }} />
              </linearGradient>
            </defs>

            {/* Outer tire ellipse (main frame) */}
            <ellipse
              cx="350"
              cy="175"
              rx="320"
              ry="155"
              fill="none"
              stroke="url(#frameGradient)"
              strokeWidth="3"
              strokeDasharray="15 8"
              className="animate-dash"
            />

            {/* Inner tire ellipse */}
            <ellipse
              cx="350"
              cy="175"
              rx="280"
              ry="125"
              fill="none"
              stroke="#22c55e"
              strokeWidth="1.5"
              opacity="0.4"
            />

            {/* Tire tread pattern lines (vertical) */}
            <line x1="150" y1="40" x2="150" y2="310" stroke="#22c55e" strokeWidth="2" opacity="0.5" />
            <line x1="220" y1="25" x2="220" y2="325" stroke="#22c55e" strokeWidth="2" opacity="0.5" />
            <line x1="290" y1="18" x2="290" y2="332" stroke="#22c55e" strokeWidth="2.5" opacity="0.6" />
            <line x1="350" y1="15" x2="350" y2="335" stroke="#22c55e" strokeWidth="3" opacity="0.7" />
            <line x1="410" y1="18" x2="410" y2="332" stroke="#22c55e" strokeWidth="2.5" opacity="0.6" />
            <line x1="480" y1="25" x2="480" y2="325" stroke="#22c55e" strokeWidth="2" opacity="0.5" />
            <line x1="550" y1="40" x2="550" y2="310" stroke="#22c55e" strokeWidth="2" opacity="0.5" />

            {/* Center alignment dot */}
            <circle cx="350" cy="175" r="6" fill="#22c55e">
              <animate attributeName="opacity" values="0.3;1;0.3" dur="1.5s" repeatCount="indefinite" />
            </circle>

            {/* Top and bottom horizontal guide lines */}
            <line x1="100" y1="175" x2="600" y2="175" stroke="#10b981" strokeWidth="1" opacity="0.3" strokeDasharray="5 5" />

            {/* Scanning animation line when recording */}
            {isRecording && (
              <>
                <line x1="50" y1="175" x2="650" y2="175" stroke="#10b981" strokeWidth="3" opacity="0.8" className="animate-scan-line">
                  <animate attributeName="x1" values="50;650;50" dur="2s" repeatCount="indefinite" />
                  <animate attributeName="x2" values="80;680;80" dur="2s" repeatCount="indefinite" />
                </line>
              </>
            )}
          </svg>

          {/* Edge glow effect */}
          <div className="absolute inset-0 rounded-[50%] pointer-events-none"
               style={{
                 boxShadow: 'inset 0 0 40px rgba(16, 185, 129, 0.3)',
               }}
          />
        </div>

        {/* Instructions - Top */}
        {!isRecording && isCameraReady && (
          <div className="absolute top-6 left-0 right-0 text-center">
            <div className="inline-flex items-center gap-3 bg-black/80 px-8 py-4 rounded-full backdrop-blur-md border border-green-500/30">
              <span className="text-3xl">🎯</span>
              <p className="text-white text-lg font-medium">
                Position tire within the frame
              </p>
            </div>
          </div>
        )}

        {/* Movement instruction - Bottom */}
        {!isRecording && isCameraReady && (
          <div className="absolute bottom-28 left-0 right-0 text-center">
            <div className="inline-flex items-center gap-4 bg-gradient-to-r from-blue-600/90 to-green-600/90 px-10 py-5 rounded-full backdrop-blur-md border-2 border-white/30 shadow-2xl animate-pulse-slow">
              <span className="text-3xl">➡️</span>
              <p className="text-white text-xl font-bold tracking-wide">
                Move camera slowly left to right
              </p>
              <span className="text-3xl">➡️</span>
            </div>
          </div>
        )}

        {/* Countdown Display */}
        {isRecording && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="relative">
              {/* Main countdown number */}
              <div 
                className="text-white font-black animate-countdown-pulse" 
                style={{ 
                  fontSize: '140px',
                  textShadow: '0 0 40px rgba(16, 185, 129, 0.9), 0 0 80px rgba(16, 185, 129, 0.6)',
                  WebkitTextStroke: '3px rgba(16, 185, 129, 0.5)'
                }}
              >
                {timeLeft}
              </div>
              
              {/* Circular progress ring */}
              <svg className="absolute -inset-12 w-64 h-64" viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="rgba(255,255,255,0.1)"
                  strokeWidth="3"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeDasharray="283"
                  strokeDashoffset={283 - (283 * (8 - timeLeft)) / 8}
                  style={{ transition: 'stroke-dashoffset 1s linear' }}
                />
              </svg>
            </div>
          </div>
        )}

        {/* Recording Indicator Badge */}
        {isRecording && (
          <div className="absolute top-8 left-1/2 -translate-x-1/2">
            <div className="flex items-center gap-3 bg-red-600 px-8 py-4 rounded-full shadow-2xl border-2 border-white/50">
              <div className="w-4 h-4 bg-white rounded-full animate-pulse" />
              <span className="text-white font-bold text-base uppercase tracking-widest">Recording</span>
            </div>
          </div>
        )}

        {/* Completion Message */}
        {recordingComplete && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/70">
            <div className="bg-gradient-to-r from-green-500 to-emerald-500 px-12 py-6 rounded-3xl shadow-2xl animate-scale-in border-4 border-white/30">
              <p className="text-white text-3xl font-black flex items-center gap-4">
                <span className="text-5xl">✓</span>
                <span>Scan Complete!</span>
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Close Button */}
      <div className="absolute top-6 left-6 z-20 pointer-events-auto">
        <button
          onClick={onClose}
          disabled={isRecording}
          className="p-4 bg-black/80 hover:bg-black rounded-full backdrop-blur-md transition-all disabled:opacity-50 border border-white/20"
        >
          <X className="text-white w-7 h-7" />
        </button>
      </div>

      {/* Capture Button */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 pointer-events-auto">
        <button
          onClick={startRecording}
          disabled={!isCameraReady || isRecording || recordingComplete}
          className="relative group disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {/* Pulse effect */}
          <div 
            className="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-75 group-hover:opacity-100" 
            style={{ animationDuration: '2s' }} 
          />
          
          {/* Main button */}
          <div className="relative w-24 h-24 bg-red-600 rounded-full border-4 border-white shadow-2xl 
                          flex items-center justify-center transition-all duration-200 
                          group-hover:scale-110 group-active:scale-95 group-hover:border-8">
            {!isRecording && (
              <div className="w-8 h-8 bg-white rounded-sm" />
            )}
          </div>
        </button>
        
        {/* Button label */}
        {!isRecording && isCameraReady && (
          <p className="text-white text-base text-center mt-4 font-semibold tracking-wide">
            Tap to start scanning
          </p>
        )}
      </div>
    </div>
  );
};

export default CameraCapture;