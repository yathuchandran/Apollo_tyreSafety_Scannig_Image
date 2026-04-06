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
        // ✅ FIX: Safe orientation lock (no TS error)
        const orientation = screen.orientation as any;
        if (orientation?.lock) {
          try {
            await orientation.lock('landscape');
          } catch {
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

      // ✅ FIX: Safe unlock
      const orientation = screen.orientation as any;
      orientation?.unlock?.();
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

  // 🚫 STRICT LANDSCAPE ONLY
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

      {/* Video */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Overlay */}
      <div className="absolute inset-0 pointer-events-none">

        <div className="absolute inset-0 bg-black/60" />

        {/* Scan Frame */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[85%] max-w-[700px] h-[50%] max-h-[350px]">
          <svg viewBox="0 0 700 350" className="w-full h-full">
            <ellipse
              cx="350"
              cy="175"
              rx="320"
              ry="155"
              fill="none"
              stroke="#22c55e"
              strokeWidth="3"
              strokeDasharray="15 8"
            />
          </svg>
        </div>

        {/* Countdown */}
        {isRecording && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-white text-7xl font-bold animate-pulse">
              {timeLeft}
            </div>
          </div>
        )}
      </div>

      {/* Close */}
      <div className="absolute top-6 left-6 z-20">
        <button
          onClick={onClose}
          disabled={isRecording}
          className="p-4 bg-black/80 rounded-full"
        >
          <X className="text-white w-6 h-6" />
        </button>
      </div>

      {/* Capture */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20">
        <button
          onClick={startRecording}
          disabled={!isCameraReady || isRecording}
          className="w-24 h-24 bg-red-600 rounded-full border-4 border-white"
        />
      </div>
    </div>
  );
};

export default CameraCapture;