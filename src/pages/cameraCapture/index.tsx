import React, { useEffect, useRef, useState } from 'react';
import { X, RotateCw } from 'lucide-react';

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

  // Camera initialization
  useEffect(() => {
    const startCamera = async () => {
      try {
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
      // Stop all camera tracks
      streamRef.current?.getTracks().forEach(track => track.stop());
    };
  }, [onClose]);

  // Recording logic
  const startRecording = () => {
    if (!streamRef.current || isRecording) return;

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
      
      // Small delay before callback to show completion state
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

  return (
    <div className="fixed inset-0 bg-black z-50 overflow-hidden">
      {/* Video Feed - Always landscape orientation */}
      <div className="relative w-full h-full">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="absolute inset-0 w-full h-full object-cover"
          style={{
            transform: 'rotate(0deg)',
          }}
        />
      </div>

      {/* Overlay UI */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Dark overlay background */}
        <div className="absolute inset-0 bg-black/50" />

        {/* Tire-shaped guide frame (horizontally oriented) */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] max-w-[600px] aspect-[3/1.2]">
          {/* Main tire outline */}
          <svg
            viewBox="0 0 600 240"
            className="w-full h-full"
            style={{ filter: 'drop-shadow(0 0 20px rgba(34, 197, 94, 0.5))' }}
          >
            {/* Outer tire ellipse */}
            <ellipse
              cx="300"
              cy="120"
              rx="280"
              ry="100"
              fill="none"
              stroke="#22c55e"
              strokeWidth="4"
              strokeDasharray="10 5"
              className="animate-dash"
            />
            
            {/* Inner tire ellipse */}
            <ellipse
              cx="300"
              cy="120"
              rx="240"
              ry="80"
              fill="none"
              stroke="#22c55e"
              strokeWidth="2"
              opacity="0.5"
            />

            {/* Tread pattern guides - vertical lines */}
            <line x1="200" y1="40" x2="200" y2="200" stroke="#22c55e" strokeWidth="1.5" opacity="0.4" />
            <line x1="250" y1="30" x2="250" y2="210" stroke="#22c55e" strokeWidth="1.5" opacity="0.4" />
            <line x1="300" y1="20" x2="300" y2="220" stroke="#22c55e" strokeWidth="2" opacity="0.6" />
            <line x1="350" y1="30" x2="350" y2="210" stroke="#22c55e" strokeWidth="1.5" opacity="0.4" />
            <line x1="400" y1="40" x2="400" y2="200" stroke="#22c55e" strokeWidth="1.5" opacity="0.4" />

            {/* Center alignment marker */}
            <circle cx="300" cy="120" r="8" fill="#22c55e" opacity="0.8">
              <animate attributeName="opacity" values="0.3;1;0.3" dur="1.5s" repeatCount="indefinite" />
            </circle>

            {/* Scanning line animation */}
            {isRecording && (
              <line
                x1="50"
                y1="120"
                x2="550"
                y2="120"
                stroke="#10b981"
                strokeWidth="3"
                opacity="0.9"
                className="animate-scan-horizontal"
              >
                <animate
                  attributeName="x1"
                  values="50;550;50"
                  dur="2s"
                  repeatCount="indefinite"
                />
                <animate
                  attributeName="x2"
                  values="70;570;70"
                  dur="2s"
                  repeatCount="indefinite"
                />
              </line>
            )}
          </svg>

          {/* Corner brackets for framing */}
          <div className="absolute -top-4 -left-4 w-12 h-12 border-t-4 border-l-4 border-green-400 rounded-tl-lg" />
          <div className="absolute -top-4 -right-4 w-12 h-12 border-t-4 border-r-4 border-green-400 rounded-tr-lg" />
          <div className="absolute -bottom-4 -left-4 w-12 h-12 border-b-4 border-l-4 border-green-400 rounded-bl-lg" />
          <div className="absolute -bottom-4 -right-4 w-12 h-12 border-b-4 border-r-4 border-green-400 rounded-br-lg" />
        </div>

        {/* Instruction text - top */}
        {!isRecording && isCameraReady && (
          <div className="absolute top-8 left-0 right-0 text-center pointer-events-none">
            <div className="inline-block bg-black/70 px-6 py-3 rounded-full backdrop-blur-sm">
              <p className="text-white text-base font-medium flex items-center gap-2 justify-center">
                <span className="text-2xl">🔍</span>
                <span>Align tire within the guide</span>
              </p>
            </div>
          </div>
        )}

        {/* Movement instruction - bottom */}
        {!isRecording && isCameraReady && (
          <div className="absolute bottom-32 left-0 right-0 text-center pointer-events-none">
            <div className="inline-block bg-black/70 px-8 py-4 rounded-full backdrop-blur-sm animate-pulse-slow">
              <p className="text-green-400 text-lg font-semibold flex items-center gap-3 justify-center">
                <span className="text-2xl">➡️</span>
                <span>Move camera slowly left to right</span>
                <span className="text-2xl">➡️</span>
              </p>
            </div>
          </div>
        )}

        {/* Countdown overlay */}
        {isRecording && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="relative">
              {/* Countdown number with pulsing glow */}
              <div className="text-white font-bold animate-countdown-pulse" 
                   style={{ fontSize: '120px', textShadow: '0 0 30px rgba(34, 197, 94, 0.8)' }}>
                {timeLeft}
              </div>
              
              {/* Progress ring */}
              <svg className="absolute -inset-8 w-48 h-48 -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="rgba(255,255,255,0.1)"
                  strokeWidth="4"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="#22c55e"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeDasharray="283"
                  strokeDashoffset={283 - (283 * (8 - timeLeft)) / 8}
                  style={{ transition: 'stroke-dashoffset 1s linear' }}
                />
              </svg>
            </div>
          </div>
        )}

        {/* Recording indicator */}
        {isRecording && (
          <div className="absolute top-8 left-1/2 -translate-x-1/2 pointer-events-none">
            <div className="flex items-center gap-3 bg-red-500 px-6 py-3 rounded-full shadow-lg">
              <div className="w-3 h-3 bg-white rounded-full animate-pulse" />
              <span className="text-white font-semibold text-sm uppercase tracking-wide">Recording</span>
            </div>
          </div>
        )}

        {/* Completion message */}
        {recordingComplete && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 pointer-events-none">
            <div className="bg-green-500 px-8 py-4 rounded-2xl shadow-2xl animate-scale-in">
              <p className="text-white text-2xl font-bold flex items-center gap-3">
                <span className="text-3xl">✓</span>
                <span>Scan Complete!</span>
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Close Button */}
      <div className="absolute top-4 left-4 z-20 pointer-events-auto">
        <button
          onClick={onClose}
          disabled={isRecording}
          className="p-3 bg-black/70 hover:bg-black/90 rounded-full backdrop-blur-sm transition-all disabled:opacity-50"
        >
          <X className="text-white w-6 h-6" />
        </button>
      </div>

      {/* Rotate device hint for portrait mode */}
      <div className="absolute top-4 right-4 z-20 pointer-events-none md:hidden">
        <div className="bg-black/70 px-4 py-2 rounded-full backdrop-blur-sm flex items-center gap-2">
          <RotateCw className="text-yellow-400 w-4 h-4" />
          <span className="text-yellow-400 text-xs font-medium">Best in landscape</span>
        </div>
      </div>

      {/* Capture Button */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 pointer-events-auto">
        <button
          onClick={startRecording}
          disabled={!isCameraReady || isRecording || recordingComplete}
          className="relative group disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {/* Outer ring pulse */}
          <div className="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-75 group-hover:opacity-100" 
               style={{ animationDuration: '2s' }} />
          
          {/* Main button */}
          <div className="relative w-20 h-20 bg-red-500 rounded-full border-4 border-white shadow-2xl 
                          flex items-center justify-center transition-transform group-hover:scale-110 
                          group-active:scale-95">
            {!isRecording && (
              <div className="w-6 h-6 bg-white rounded-sm" />
            )}
          </div>
        </button>
        
        {/* Helper text */}
        {!isRecording && isCameraReady && (
          <p className="text-white text-sm text-center mt-3 font-medium">
            Tap to start scanning
          </p>
        )}
      </div>
    </div>
  );
};

export default CameraCapture;