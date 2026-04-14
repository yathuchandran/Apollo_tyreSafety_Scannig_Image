import React, { useEffect, useRef, useState } from 'react';
import { X, Camera, Layout, Circle } from 'lucide-react';

interface CameraCaptureProps {
  onCapture: (imageDataUrl: string) => void;
  onClose: () => void;
}

type CaptureMode = 'tread' | 'sidewall';

const CameraCapture: React.FC<CameraCaptureProps> = ({ onCapture, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [isCameraReady, setIsCameraReady] = useState(false);
  const [captureMode, setCaptureMode] = useState<CaptureMode>('tread');
  const [isCapturing, setIsCapturing] = useState(false);

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
      streamRef.current?.getTracks().forEach(track => track.stop());
    };
  }, [onClose]);

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current || !isCameraReady) return;

    setIsCapturing(true);
    if (navigator.vibrate) navigator.vibrate(100);

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (context) {
      // Set canvas dimensions to match video stream
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Draw the current video frame to the canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Get the image as a data URL (JPEG)
      const imageDataUrl = canvas.toDataURL('image/jpeg', 0.9);

      // Send the captured image back
      setTimeout(() => {
        onCapture(imageDataUrl);
        setIsCapturing(false);
      }, 300);
    }
  };

  return (
    <div className="fixed inset-0 bg-black z-50 overflow-hidden">
      {/* Video Feed - Truly full screen */}
      <div className="absolute inset-0 bg-black flex items-center justify-center overflow-hidden">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
        />

        {/* Hidden Canvas for capture */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Framing Overlays */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          {/* Advanced Glassmorphism Overlay */}
          <div className={`absolute inset-0 transition-all duration-700 backdrop-blur-[1px] ${
            captureMode === 'tread' ? 'bg-black/5' : 'bg-black/40'
          }`} />
          
          {/* Mode-specific Frame Container */}
          <div className="relative z-10 w-full h-full flex items-center justify-center p-2">
            {captureMode === 'tread' ? (
              /* Tread Frame: Maximum screen fit with scanning effect */
              <div className="relative w-full h-full border-[12px] border-dashed border-green-500 shadow-[inset_0_0_250px_rgba(34,197,94,0.4)] overflow-hidden rounded-xl">
                {/* Dynamic Scanning Line */}
                <div className="absolute inset-x-0 h-1.5 bg-gradient-to-r from-transparent via-green-400 to-transparent shadow-[0_0_30px_rgba(74,222,128,1)] animate-scan opacity-90" />

                {/* Horizontal Tread Line Guides */}
                <div className="absolute inset-0 flex flex-col justify-around opacity-50">
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="w-full h-[3px] bg-green-400/70" />
                  ))}
                </div>

                {/* Center Crosshair with Pulse */}
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 flex items-center justify-center">
                  <div className="absolute inset-0 border-4 border-green-500 rounded-full animate-ping opacity-30" />
                  <div className="w-full h-[4px] bg-green-500 absolute" />
                  <div className="w-[4px] h-full bg-green-500 absolute" />
                </div>

                {/* Premium Corner Accents - true corners */}
                <div className="absolute top-0 left-0 w-48 h-48 border-t-[16px] border-l-[16px] border-green-500 shadow-[0_0_50px_rgba(34,197,94,0.6)] rounded-tl-lg" />
                <div className="absolute top-0 right-0 w-48 h-48 border-t-[16px] border-r-[16px] border-green-500 shadow-[0_0_50px_rgba(34,197,94,0.6)] rounded-tr-lg" />
                <div className="absolute bottom-0 left-0 w-48 h-48 border-b-[16px] border-l-[16px] border-green-500 shadow-[0_0_50px_rgba(34,197,94,0.6)] rounded-bl-lg" />
                <div className="absolute bottom-0 right-0 w-48 h-48 border-b-[16px] border-r-[16px] border-green-500 shadow-[0_0_50px_rgba(34,197,94,0.6)] rounded-br-lg" />
              </div>
            ) : (
              /* Sidewall Frame: Maximum diameter circle with glowing focus */
              <div className="relative w-[98vmin] h-[98vmin] border-[6px] border-dashed border-blue-400 rounded-full shadow-[0_0_200px_rgba(96,165,250,0.6)] bg-blue-500/5 backdrop-blur-[2px] flex items-center justify-center">
                {/* Focus Ring Animation */}
                <div className="absolute inset-0 border-[8px] border-blue-400 rounded-full animate-pulse opacity-50" />
                
                {/* Inner circle guide */}
                <div className="absolute inset-[12%] border-2 border-blue-300/40 rounded-full border-dotted" />
                
                {/* Center crosshair */}
                <div className="absolute w-40 h-40 flex items-center justify-center">
                  <div className="w-full h-[5px] bg-blue-400 absolute shadow-[0_0_40px_rgba(96,165,250,1)]" />
                  <div className="w-[5px] h-full bg-blue-400 absolute shadow-[0_0_40px_rgba(96,165,250,1)]" />
                </div>
                
                {/* Floating Brackets */}
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 px-12 py-4 bg-blue-600/95 backdrop-blur-md text-[18px] text-white rounded-full font-bold uppercase tracking-widest shadow-2xl border border-blue-400/50 animate-bounce-subtle">
                  Top
                </div>
                <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 px-12 py-4 bg-blue-600/95 backdrop-blur-md text-[18px] text-white rounded-full font-bold uppercase tracking-widest shadow-2xl border border-blue-400/50 animate-bounce-subtle-reverse">
                  Bottom
                </div>
              </div>
            )}
          </div>

          {/* Labels and Instructions */}
          <div className="absolute top-10 left-0 right-0 text-center z-30">
            <div className="inline-block bg-black/40 backdrop-blur-xl px-8 py-3 rounded-full border border-white/20 shadow-2xl">
              <p className="text-white text-lg font-semibold flex items-center gap-3">
                {captureMode === 'tread' ? (
                  <>
                    <Layout className="w-6 h-6 text-green-400" />
                    Align Tyre Tread in Box
                  </>
                ) : (
                  <>
                    <Circle className="w-6 h-6 text-blue-400" />
                    Align Sidewall in Circle
                  </>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Capture Shutter Animation */}
        {isCapturing && (
          <div className="absolute inset-0 bg-white animate-pulse z-50 transition-opacity duration-200" />
        )}
      </div>

      {/* Control Bar Overlay */}
      <div className="absolute bottom-0 left-0 right-0 z-40 px-6 py-10 pb-12 flex flex-col gap-8 bg-gradient-to-t from-black/80 via-black/40 to-transparent backdrop-blur-[2px]">
        {/* Mode Selector */}
        <div className="flex justify-center">
          <div className="bg-white/10 backdrop-blur-2xl p-1.5 rounded-2xl flex gap-1 border border-white/10 shadow-2xl">
            <button
              onClick={() => setCaptureMode('tread')}
              className={`flex items-center gap-2 px-8 py-3 rounded-xl transition-all duration-300 ${
                captureMode === 'tread'
                  ? 'bg-green-600 text-white shadow-[0_0_20px_rgba(34,197,94,0.5)] scale-105'
                  : 'text-zinc-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <Layout className="w-5 h-5" />
              <span className="text-base font-bold tracking-tight">Tread</span>
            </button>
            <button
              onClick={() => setCaptureMode('sidewall')}
              className={`flex items-center gap-2 px-8 py-3 rounded-xl transition-all duration-300 ${
                captureMode === 'sidewall'
                  ? 'bg-blue-600 text-white shadow-[0_0_20px_rgba(59,130,246,0.5)] scale-105'
                  : 'text-zinc-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <Circle className="w-5 h-5" />
              <span className="text-base font-bold tracking-tight">Sidewall</span>
            </button>
          </div>
        </div>

        {/* Main Actions */}
        <div className="flex items-center justify-between max-w-md mx-auto w-full px-4">
          {/* Close */}
          <button
            onClick={onClose}
            className="p-5 bg-white/10 backdrop-blur-xl rounded-full text-white hover:bg-white/20 transition-all border border-white/10 active:scale-95 shadow-xl"
          >
            <X className="w-7 h-7" />
          </button>

          {/* Capture Button */}
          <button
            onClick={capturePhoto}
            disabled={!isCameraReady || isCapturing}
            className="group relative p-1.5"
          >
            <div className="absolute inset-0 bg-white/20 rounded-full animate-ping group-active:hidden" />
            <div className="relative w-28 h-28 bg-white rounded-full flex items-center justify-center shadow-[0_0_50px_rgba(255,255,255,0.3)] transition-all active:scale-90 active:bg-zinc-200 overflow-hidden">
              <div className="w-[88%] h-[88%] border-[3px] border-black/10 rounded-full flex items-center justify-center">
                <Camera className="w-12 h-12 text-black" />
              </div>
            </div>
          </button>

          {/* Placeholder/Extra Option */}
          <div className="w-16 h-16 opacity-0" />
        </div>
      </div>
    </div>
  );
};

export default CameraCapture;
