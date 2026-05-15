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
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
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

  const processFrame = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !isRecording) return;

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    const v = videoRef.current;
    const c = canvasRef.current;

    // Source dimensions
    const sourceWidth = v.videoWidth;
    const sourceHeight = v.videoHeight;
    
    // The frame in the UI is 82% width, with 3.7/7 aspect ratio
    const frameAspectRatio = 3.7 / 7;
    const targetWidth = sourceWidth * 0.82;
    const targetHeight = targetWidth / frameAspectRatio;

    if (c.width !== Math.floor(targetWidth)) {
      c.width = Math.floor(targetWidth / 2) * 2;
      c.height = Math.floor(targetHeight / 2) * 2;
    }

    // Centered crop
    const sx = (sourceWidth - c.width) / 2;
    const sy = (sourceHeight - c.height) / 2;

    ctx.drawImage(v, sx, sy, c.width, c.height, 0, 0, c.width, c.height);
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

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (phase === 'SCANNING') {
      interval = setInterval(() => {
        setTimer(prev => (prev + 1) % 100);
      }, 30);
    }
    return () => clearInterval(interval);
  }, [phase]);

  const startRecording = () => {
    if (!canvasRef.current) return;

    setRecordedChunks([]);
    const stream = canvasRef.current.captureStream(30);
    const recorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp8' });

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) setRecordedChunks(prev => [...prev, e.data]);
    };

    recorder.onstop = () => {
      const blob = new Blob(recordedChunks, { type: 'video/webm' });
      onRecordingComplete(blob);
    };

    recorder.start();
    mediaRecorderRef.current = recorder;
    setIsRecording(true);
    setPhase('START');
    setTimer(0);

    setTimeout(() => {
      setPhase('SCANNING');
      if ('vibrate' in navigator) navigator.vibrate(200);
    }, START_PHASE_DURATION);
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
    setPhase('IDLE');
    
    const stream = videoRef.current?.srcObject as MediaStream;
    stream?.getTracks().forEach(track => {
        if (track.kind === 'video') track.applyConstraints({ advanced: [{ torch: false }] } as any);
    });
  };

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden flex items-center justify-center font-sans">
      <canvas ref={canvasRef} className="hidden" />

      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="absolute inset-0 w-full h-full object-cover opacity-80"
      />

      {/* Advanced Glassmorphism Mask */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" />
        
        {/* Dynamic Scan Area (The "Hole" in the mask) */}
        <div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-transparent border-2 border-white/20 shadow-[0_0_100px_rgba(0,0,0,0.8)]"
          style={{ 
            width: '82%',
            aspectRatio: '3.7 / 7'
          }}
        >
          {/* Internal Grid for Scanner feel */}
          <div className="absolute inset-0 grid grid-cols-4 grid-rows-8 opacity-20">
            {[...Array(32)].map((_, i) => (
              <div key={i} className="border-[0.5px] border-blue-400" />
            ))}
          </div>
          
          {/* Active Scan Indicator */}
          {phase === 'SCANNING' && (
            <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-blue-400 to-transparent shadow-[0_0_20px_rgba(59,130,246,1)] animate-scan z-20" />
          )}

          {/* Corner Brackets */}
          <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-blue-500 rounded-tl-sm" />
          <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-blue-500 rounded-tr-sm" />
          <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-blue-500 rounded-bl-sm" />
          <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-blue-500 rounded-br-sm" />
        </div>
      </div>

      {/* Distance Instruction - FIXED OVERLAY */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 pointer-events-none w-full text-center">
        <div className="inline-block bg-blue-600/90 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/20 shadow-2xl animate-pulse">
          <p className="text-white font-black text-sm tracking-[0.2em] uppercase">
            Maintain 10cm Distance
          </p>
        </div>
        <div className="mt-4 flex justify-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '200ms' }} />
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '400ms' }} />
        </div>
      </div>

      {/* Progress & Feedback Overlay */}
      <div className="absolute top-12 left-0 right-0 z-40 flex flex-col items-center">
        <div className="px-6 py-2 bg-black/40 backdrop-blur-xl rounded-full border border-white/10 mb-4">
           <h2 className="text-white font-bold text-sm tracking-widest uppercase">
             {phase === 'IDLE' && 'Ready to Scan'}
             {phase === 'START' && 'Stabilizing...'}
             {phase === 'SCANNING' && 'Scanning Tread'}
           </h2>
        </div>

        {phase === 'SCANNING' && (
           <div className="w-64 h-1.5 bg-white/10 rounded-full overflow-hidden border border-white/5">
              <div 
                className="h-full bg-gradient-to-r from-blue-600 to-blue-400 transition-all duration-300 shadow-[0_0_10px_rgba(59,130,246,0.5)]" 
                style={{ width: `${timer}%` }} 
              />
           </div>
        )}
      </div>

      {/* Center Target during START phase */}
      {phase === 'START' && (
        <div className="absolute z-50 flex flex-col items-center pointer-events-none">
          <div className="w-32 h-32 border-4 border-green-500 rounded-full animate-ping opacity-50" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-green-500 font-black text-2xl">
            2s
          </div>
        </div>
      )}

      {/* Main Control Button */}
      <div className="absolute bottom-16 w-full flex flex-col items-center gap-8 z-50">
        <div className="flex items-center justify-center gap-12">
            {!isRecording ? (
              <button 
                onClick={startRecording}
                className="group relative w-24 h-24 flex items-center justify-center"
              >
                <div className="absolute inset-0 bg-red-600/20 rounded-full animate-ping group-hover:bg-red-600/30" />
                <div className="relative w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-2xl transition-transform group-active:scale-90">
                   <div className="w-16 h-16 border-4 border-black/5 rounded-full flex items-center justify-center">
                      <div className="w-8 h-8 bg-red-600 rounded-full" />
                   </div>
                </div>
              </button>
            ) : (
              <button 
                onClick={stopRecording}
                className="group relative w-24 h-24 flex items-center justify-center"
              >
                <div className="absolute inset-0 bg-white/20 rounded-full animate-pulse" />
                <div className="relative w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-2xl transition-transform group-active:scale-90">
                   <div className="w-10 h-10 bg-black rounded-lg" />
                </div>
              </button>
            )}
        </div>
        
        {/* Helper text */}
        {!isRecording && (
          <p className="text-zinc-400 text-xs font-bold tracking-widest uppercase bg-black/40 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/5">
            Tap to begin scan
          </p>
        )}
      </div>

      {/* Close/Back Button */}
      <button 
        onClick={() => window.history.back()}
        className="absolute top-10 left-6 z-50 w-12 h-12 bg-black/40 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-white/10 text-white hover:bg-black/60 transition-all active:scale-90"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <style>{`
        @keyframes scan {
          from { top: 0% }
          to { top: 100% }
        }
        .animate-scan {
          animation: scan 2s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        .animate-bounce {
          animation: bounce 0.6s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default TyreTreadRecorder;