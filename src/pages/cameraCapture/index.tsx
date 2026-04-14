import React, { useEffect, useRef, useState } from 'react';
import { X, Camera, SwitchCamera, Layout, Circle } from 'lucide-react';

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
    <div className="fixed inset-0 bg-black z-50 overflow-hidden flex flex-col">
      {/* Video Feed */}
      <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden">
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
          {/* Dimmed background overlay */}
          <div className="absolute inset-0 bg-black/40" />
          
          {/* Mode-specific Frame */}
          <div className="relative z-10 w-[85%] max-w-[500px] aspect-[4/3] flex items-center justify-center">
            {captureMode === 'tread' ? (
              /* Tread Frame: Vertical focus */
              <div className="relative w-[60%] h-[90%] border-2 border-dashed border-green-500 rounded-lg shadow-[0_0_20px_rgba(34,197,94,0.3)]">
                {/* Horizontal Tread Line Guides */}
                <div className="absolute inset-0 flex flex-col justify-around opacity-40">
                  <div className="w-full h-[1px] bg-green-400" />
                  <div className="w-full h-[1px] bg-green-400" />
                  <div className="w-full h-[1px] bg-green-400" />
                  <div className="w-full h-[1px] bg-green-400" />
                </div>
                {/* Center crosshair */}
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center">
                  <div className="w-full h-[2px] bg-green-500 absolute" />
                  <div className="w-[2px] h-full bg-green-500 absolute" />
                </div>
                {/* Corner Accents */}
                <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-green-400" />
                <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-green-400" />
                <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-green-400" />
                <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-green-400" />
              </div>
            ) : (
              /* Sidewall Frame: Circular focus */
              <div className="relative w-full aspect-square border-2 border-dashed border-blue-400 rounded-full shadow-[0_0_20px_rgba(96,165,250,0.3)]">
                {/* Inner circle guide */}
                <div className="absolute inset-[15%] border border-blue-300 rounded-full opacity-50" />
                {/* Center crosshair */}
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center">
                  <div className="w-full h-[2px] bg-blue-400 absolute" />
                  <div className="w-[2px] h-full bg-blue-400 absolute" />
                </div>
                {/* Brackets */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-4 px-3 bg-blue-500 text-[10px] text-white rounded font-bold uppercase tracking-widest">Top</div>
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-4 px-3 bg-blue-500 text-[10px] text-white rounded font-bold uppercase tracking-widest">Bottom</div>
              </div>
            )}
          </div>

          {/* Labels and Instructions */}
          <div className="absolute top-24 left-0 right-0 text-center">
            <div className="inline-block bg-black/60 backdrop-blur-md px-6 py-2 rounded-full border border-white/20">
              <p className="text-white text-sm font-medium flex items-center gap-2">
                {captureMode === 'tread' ? (
                  <>
                    <Layout className="w-4 h-4 text-green-400" />
                    Align Tyre Tread within the Green Box
                  </>
                ) : (
                  <>
                    <Circle className="w-4 h-4 text-blue-400" />
                    Align Tyre Sidewall within the Blue Circle
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

      {/* Control Bar */}
      <div className="bg-zinc-900 px-6 py-8 pb-10 flex flex-col gap-6">
        {/* Mode Selector */}
        <div className="flex justify-center">
          <div className="bg-black/50 p-1 rounded-xl flex gap-1">
            <button
              onClick={() => setCaptureMode('tread')}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-lg transition-all ${
                captureMode === 'tread'
                  ? 'bg-green-600 text-white shadow-lg'
                  : 'text-zinc-500 hover:text-white'
              }`}
            >
              <Layout className="w-4 h-4" />
              <span className="text-sm font-bold">Tread</span>
            </button>
            <button
              onClick={() => setCaptureMode('sidewall')}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-lg transition-all ${
                captureMode === 'sidewall'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-zinc-500 hover:text-white'
              }`}
            >
              <Circle className="w-4 h-4" />
              <span className="text-sm font-bold">Sidewall</span>
            </button>
          </div>
        </div>

        {/* Main Actions */}
        <div className="flex items-center justify-between max-w-sm mx-auto w-full">
          {/* Close */}
          <button
            onClick={onClose}
            className="p-4 bg-zinc-800 rounded-full text-white hover:bg-zinc-700 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Capture Button */}
          <button
            onClick={capturePhoto}
            disabled={!isCameraReady || isCapturing}
            className="group relative p-1"
          >
            <div className="absolute inset-0 bg-white/20 rounded-full animate-ping group-active:hidden" />
            <div className="relative w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-2xl transition-transform active:scale-90 overflow-hidden">
              <div className="w-[90%] h-[90%] border-4 border-black/10 rounded-full flex items-center justify-center">
                <Camera className="w-10 h-10 text-zinc-900" />
              </div>
            </div>
          </button>

          {/* Placeholder/Flip Camera (optional) */}
          <div className="w-14 h-14" />
        </div>
      </div>
    </div>
  );
};

export default CameraCapture;