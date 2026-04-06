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

  // 🎥 Start Camera
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
        alert('Camera access denied');
        onClose();
      }
    };

    startCamera();

    return () => {
      streamRef.current?.getTracks().forEach(track => track.stop());
    };
  }, [onClose]);

  // 🎬 Start Recording
  const startRecording = () => {
    if (!streamRef.current) return;

    const mediaRecorder = new MediaRecorder(streamRef.current);
    mediaRecorderRef.current = mediaRecorder;
    chunksRef.current = [];

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunksRef.current.push(e.data);
      }
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

        {/* Dark layer */}
        <div className="absolute inset-0 bg-black/50" />

        {/* Tyre Guide Box */}
        <div className="absolute top-16 bottom-24 left-[20%] right-[20%] border-2 border-green-400" />

        {/* Edge Lines */}
        <div className="absolute top-16 bottom-24 left-[20%] w-[3px] bg-green-400" />
        <div className="absolute top-16 bottom-24 right-[20%] w-[3px] bg-green-400" />

        {/* Direction */}
        <div className="absolute bottom-32 left-0 right-0 text-center text-white text-lg animate-pulse">
          ➡️ Move Slowly (Left → Right)
        </div>

        {/* Timer */}
        {isRecording && (
          <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-black/70 px-5 py-2 rounded-full text-white text-xl font-bold">
            {timeLeft}s
          </div>
        )}
      </div>

      {/* Top Controls */}
      <div className="absolute top-4 left-4 right-4 flex justify-between z-20">
        <button
          onClick={onClose}
          className="p-3 bg-black/60 rounded-full"
        >
          <X className="text-white" />
        </button>
      </div>

      {/* Bottom Controls */}
      <div className="absolute bottom-10 w-full flex flex-col items-center z-20">

        <button
          onClick={startRecording}
          disabled={!isCameraReady || isRecording}
          className="w-20 h-20 bg-red-500 rounded-full border-4 border-white shadow-xl disabled:opacity-50"
        />

        <p className="text-white mt-4 text-sm text-center px-6">
          Align tyre within lines and move slowly from left to right
        </p>
      </div>
    </div>
  );
};

export default CameraCapture;