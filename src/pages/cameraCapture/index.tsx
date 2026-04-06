import React, { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';

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
  const [isLandscape, setIsLandscape] = useState(
    window.innerWidth > window.innerHeight
  );

  // Orientation listener
  useEffect(() => {
    const handleResize = () => {
      setIsLandscape(window.innerWidth > window.innerHeight);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Camera init
  useEffect(() => {
    const startCamera = async () => {
      try {
        // Safe orientation lock (optional)
        const orientation = (screen.orientation as any);
        orientation?.lock?.('landscape').catch(() => {});

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
        alert('Camera access denied');
        onClose();
      }
    };

    startCamera();

    return () => {
      streamRef.current?.getTracks().forEach(track => track.stop());

      const orientation = (screen.orientation as any);
      orientation?.unlock?.();
    };
  }, [onClose]);

  // Recording logic
  const startRecording = () => {
    if (!streamRef.current) return;

    if (navigator.vibrate) navigator.vibrate(200);

    const mediaRecorder = new MediaRecorder(streamRef.current);
    mediaRecorderRef.current = mediaRecorder;
    chunksRef.current = [];

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    mediaRecorder.onstop = () => {
      // ✅ FIX: correct format
      const blob = new Blob(chunksRef.current, { type: 'video/webm' });
      const videoUrl = URL.createObjectURL(blob);
      onCapture(videoUrl);
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
    <div className="fixed inset-0 bg-black z-50">

      {/* Video */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={`w-full h-full object-cover transition-transform duration-300 ${
          !isLandscape ? 'rotate-90 scale-[1.8]' : ''
        }`}
      />

      {/* Overlay */}
      <div className="absolute inset-0 pointer-events-none">

        {/* Dim background */}
        <div className="absolute inset-0 bg-black/60" />

        {/* ⚠️ Landscape suggestion (not blocking) */}
        {!isLandscape && (
          <div className="absolute top-10 w-full text-center text-yellow-400 z-50 animate-pulse">
            ⚠️ Rotate to landscape for best results
          </div>
        )}

        {/* Tyre Scan Zone */}
        <div className="absolute left-0 right-0 top-[35%] h-[30%]">

          {/* Top curve */}
          <div className="absolute top-0 w-full h-12 border-t-4 border-green-400 rounded-[100%]" />

          {/* Bottom curve */}
          <div className="absolute bottom-0 w-full h-12 border-b-4 border-green-400 rounded-[100%]" />

          {/* Guide line */}
          <div className="absolute top-1/2 left-10 right-10 h-[2px] bg-green-300 opacity-70" />

          {/* Scan animation */}
          <div className="absolute top-1/2 left-0 right-0 h-[2px] bg-green-500 animate-scan" />
        </div>

        {/* Dark areas */}
        <div className="absolute top-0 left-0 right-0 h-[35%] bg-black/70" />
        <div className="absolute bottom-0 left-0 right-0 h-[35%] bg-black/70" />

        {/* Instruction */}
        <div className="absolute bottom-24 w-full text-center text-white text-lg animate-pulse">
          ➡️ Move Slowly (Left → Right)
        </div>

        {/* Countdown */}
        {isRecording && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-white text-7xl font-bold animate-blink">
              {timeLeft}
            </div>
          </div>
        )}
      </div>

      {/* Close Button */}
      <div className="absolute top-4 left-4 z-20">
        <button onClick={onClose} className="p-3 bg-black/60 rounded-full">
          <X className="text-white" />
        </button>
      </div>

      {/* Capture Button */}
      <div className="absolute bottom-10 w-full flex flex-col items-center z-20">
        <button
          onClick={startRecording}
          disabled={!isCameraReady || isRecording}
          className="w-20 h-20 bg-red-500 rounded-full border-4 border-white shadow-xl"
        />
        <p className="text-white mt-4 text-sm text-center px-6">
          Align tyre and move slowly
        </p>
      </div>
    </div>
  );
};

export default CameraCapture;