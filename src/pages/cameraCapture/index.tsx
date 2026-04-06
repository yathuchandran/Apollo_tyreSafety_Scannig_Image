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
        if (screen.orientation && screen.orientation.lock) {
          screen.orientation.lock('landscape').catch(() => {});
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
        alert('Camera access denied');
        onClose();
      }
    };

    startCamera();

    return () => {
      streamRef.current?.getTracks().forEach(track => track.stop());
      if (screen.orientation && screen.orientation.unlock) {
        screen.orientation.unlock();
      }
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
      const blob = new Blob(chunksRef.current, { type: 'video/mp4' });
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

  // 🚫 Block portrait mode
  if (!isLandscape) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col items-center justify-center text-white z-50">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-pulse">📱↻</div>
          <h2 className="text-xl font-semibold mb-2">Rotate Your Device</h2>
          <p className="text-gray-400 text-sm">
            Please use landscape mode for tyre scanning
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black z-50">

      {/* Video */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-cover"
      />

      {/* Overlay */}
      <div className="absolute inset-0 pointer-events-none">

        <div className="absolute inset-0 bg-black/60" />

        {/* Scan zone */}
        <div className="absolute left-0 right-0 top-[35%] h-[30%]">

          <div className="absolute top-0 w-full h-12 border-t-4 border-green-400 rounded-[100%]" />
          <div className="absolute bottom-0 w-full h-12 border-b-4 border-green-400 rounded-[100%]" />

          <div className="absolute top-1/2 left-10 right-10 h-[2px] bg-green-300 opacity-70" />
          <div className="absolute top-1/2 left-0 right-0 h-[2px] bg-green-500 animate-scan" />
        </div>

        <div className="absolute top-0 left-0 right-0 h-[35%] bg-black/70" />
        <div className="absolute bottom-0 left-0 right-0 h-[35%] bg-black/70" />

        <div className="absolute bottom-24 w-full text-center text-white text-lg animate-pulse">
          ➡️ Move Slowly (Left → Right)
        </div>

        {isRecording && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-white text-7xl font-bold animate-blink">
              {timeLeft}
            </div>
          </div>
        )}
      </div>

      {/* Top */}
      <div className="absolute top-4 left-4 z-20">
        <button onClick={onClose} className="p-3 bg-black/60 rounded-full">
          <X className="text-white" />
        </button>
      </div>

      {/* Bottom */}
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