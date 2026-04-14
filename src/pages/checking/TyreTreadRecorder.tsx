// components/TyreTreadRecorder.tsx (Updated with callback)
import React, { useRef, useState, useEffect, useCallback } from 'react';

interface TyreTreadRecorderProps {
  onRecordingComplete: (videoBlob: Blob) => void;
}

const CROP_WIDTH_PERCENT = 0.28;
const START_PHASE_DURATION = 2000;

const TyreTreadRecorder: React.FC<TyreTreadRecorderProps> = ({ onRecordingComplete }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [phase, setPhase] = useState<'IDLE' | 'START' | 'SCANNING'>('IDLE');
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const [timer, setTimer] = useState(0);
  const animationFrameRef = useRef<number>();

  // Initialize Camera & Flash
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: 1280, height: 720 },
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        // Attempt to turn on Torch
        const track = stream.getVideoTracks()[0];
        const capabilities = track.getCapabilities() as any;
        if (capabilities.torch) {
          await track.applyConstraints({ advanced: [{ torch: true }] } as any);
        }
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
    }
  };

  useEffect(() => {
    startCamera();
    return () => {
      const stream = videoRef.current?.srcObject as MediaStream;
      stream?.getTracks().forEach(track => track.stop());
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // The "Engine": Drawing the cropped frame to canvas
  const processFrame = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !isRecording) return;

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    const v = videoRef.current;
    const c = canvasRef.current;

    // Set canvas size to the cropped dimensions (28% of source width)
    const sourceWidth = v.videoWidth;
    const sourceHeight = v.videoHeight;
    const cropWidth = sourceWidth * CROP_WIDTH_PERCENT;

    if (c.width !== cropWidth) {
      c.width = cropWidth;
      c.height = sourceHeight;
    }

    // Draw only the LEFT 28% slice
    ctx.drawImage(v, 0, 0, cropWidth, sourceHeight, 0, 0, cropWidth, sourceHeight);

    animationFrameRef.current = requestAnimationFrame(processFrame);
  }, [isRecording]);

  useEffect(() => {
    if (isRecording) {
      processFrame();
    }
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isRecording, processFrame]);

  // Timer for progress bar
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (phase === 'SCANNING') {
      interval = setInterval(() => {
        setTimer(prev => (prev + 1) % 100);
      }, 30);
    }
    return () => clearInterval(interval);
  }, [phase]);

  // Recording Logic
  const startRecording = () => {
    if (!canvasRef.current) return;

    setRecordedChunks([]);
    const stream = canvasRef.current.captureStream(30);
    const recorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp8' });

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) setRecordedChunks(prev => [...prev, e.data]);
    };

    recorder.onstop = () => {
      if (recordedChunks.length > 0) {
        const blob = new Blob(recordedChunks, { type: 'video/webm' });
        onRecordingComplete(blob);
      }
    };

    recorder.start();
    mediaRecorderRef.current = recorder;
    setIsRecording(true);
    setPhase('START');
    setTimer(0);

    // Phase transition after 2s
    setTimeout(() => {
      setPhase('SCANNING');
      if ('vibrate' in navigator) navigator.vibrate(200);
    }, START_PHASE_DURATION);
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
    setPhase('IDLE');
    
    // Stop tracks/flash
    const stream = videoRef.current?.srcObject as MediaStream;
    stream?.getTracks().forEach(track => {
        if (track.kind === 'video') track.applyConstraints({ advanced: [{ torch: false }] } as any);
    });
  };

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden flex items-center justify-center">
      {/* Hidden processing canvas */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Main Viewfinder */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="absolute inset-0 w-full h-full object-cover opacity-60"
      />

      {/* Dark Overlay for non-recorded area (Right side) */}
      <div 
        className="absolute top-0 right-0 h-full bg-black/70 transition-all duration-500"
        style={{ width: `${(1 - CROP_WIDTH_PERCENT) * 100}%` }}
      />

      {/* UI GUIDES */}
      <div className="absolute inset-0 flex items-center">
        
        {/* LEFT CROP AREA (The Actual Recording Zone) */}
        <div 
          className={`h-full border-r-2 relative flex flex-col justify-center items-center transition-colors duration-500
            ${phase === 'START' ? 'border-green-500 shadow-[inset_0_0_20px_rgba(34,197,94,0.5)]' : 'border-white/20'}`}
          style={{ width: `${CROP_WIDTH_PERCENT * 100}%` }}
        >
          {phase === 'START' && (
            <div className="text-green-400 font-bold animate-pulse text-center">
              <p className="text-xs">START HERE</p>
              <span className="text-2xl">→</span>
            </div>
          )}
          
          {/* Scanning Line */}
          {phase === 'SCANNING' && (
            <div className="absolute top-0 left-0 w-full h-1 bg-white/50 shadow-[0_0_10px_white] animate-scan" />
          )}
        </div>

        {/* RIGHT GUIDE AREA (Visual Goal) */}
        <div className="flex-1 relative flex flex-col justify-center items-end pr-10">
          {phase === 'SCANNING' && (
            <div className="border-2 border-red-500 p-4 rounded shadow-[0_0_20px_rgba(239,68,68,0.6)] animate-in fade-in duration-700">
               <div className="text-red-500 font-bold text-right">
                  <span className="text-2xl">←</span>
                  <p className="text-xs">END HERE</p>
               </div>
            </div>
          )}
        </div>
      </div>

      {/* TOP HUD */}
      <div className="absolute top-10 w-full text-center">
        <h2 className="text-white font-mono text-lg tracking-widest">
          {phase === 'START' ? 'POSITION TYRE START' : 
           phase === 'SCANNING' ? 'MOVE CAMERA ACROSS TREAD' : 'READY TO SCAN'}
        </h2>
        {isRecording && (
            <div className="mt-4 w-1/2 mx-auto h-1 bg-gray-800 rounded overflow-hidden">
                <div className="h-full bg-red-500 transition-all duration-100" style={{ width: `${timer}%` }} />
            </div>
        )}
      </div>

      {/* CONTROLS */}
      <div className="absolute bottom-10 w-full flex justify-center">
        {!isRecording ? (
          <button 
            onClick={startRecording}
            className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center p-1 hover:scale-105 transition-transform"
          >
            <div className="w-full h-full bg-red-600 rounded-full hover:bg-red-500 transition-colors" />
          </button>
        ) : (
          <button 
            onClick={stopRecording}
            className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center hover:scale-105 transition-transform"
          >
            <div className="w-10 h-10 bg-white rounded-sm" />
          </button>
        )}
      </div>

      {/* Back Button */}
      <button 
        onClick={() => window.history.back()}
        className="absolute top-10 left-6 text-white bg-black/50 rounded-full p-2 hover:bg-black/70 transition-colors"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <style >{`
        @keyframes scan {
          from { top: 0% }
          to { top: 100% }
        }
        .animate-scan {
          animation: scan 2s linear infinite;
        }
        @keyframes fade-in {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .fade-in {
          animation: fade-in 0.5s ease-out;
        }
      `}</style>
    </div>
  );
};

export default TyreTreadRecorder;