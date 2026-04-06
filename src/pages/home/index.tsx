import React, { useState } from 'react';
import { Video, CheckCircle, RotateCcw, X } from 'lucide-react';

// ============= CAMERA CAPTURE COMPONENT =============
interface CameraCaptureProps {
  onCapture: (videoUrl: string) => void;
  onClose: () => void;
}

const CameraCapture: React.FC<CameraCaptureProps> = ({ onCapture, onClose }) => {
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const streamRef = React.useRef<MediaStream | null>(null);
  const mediaRecorderRef = React.useRef<MediaRecorder | null>(null);
  const chunksRef = React.useRef<Blob[]>([]);

  const [isCameraReady, setIsCameraReady] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [timeLeft, setTimeLeft] = useState(8);
  const [recordingComplete, setRecordingComplete] = useState(false);
  const [isLandscape, setIsLandscape] = useState(
    window.innerWidth > window.innerHeight
  );

  // Monitor orientation
  React.useEffect(() => {
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

  // Camera init
  React.useEffect(() => {
    const startCamera = async () => {
      try {
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
      streamRef.current?.getTracks().forEach(track => track.stop());
      if (screen.orientation && screen.orientation.unlock) {
        screen.orientation.unlock();
      }
    };
  }, [onClose]);

  // Recording
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

  // MANDATORY LANDSCAPE
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
      <div className="relative w-full h-full">
        <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover" />
      </div>

      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-black/60" />

        {/* Landscape Tire Frame */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[85%] max-w-[700px] h-[50%] max-h-[350px]">
          
          <div className="absolute inset-0 rounded-[50%] bg-transparent" 
               style={{ boxShadow: '0 0 0 9999px rgba(0,0,0,0.7)' }} />

          <svg viewBox="0 0 700 350" className="w-full h-full absolute inset-0" preserveAspectRatio="none">
            <defs>
              <linearGradient id="frameGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" style={{ stopColor: '#10b981', stopOpacity: 0.8 }} />
                <stop offset="50%" style={{ stopColor: '#22c55e', stopOpacity: 1 }} />
                <stop offset="100%" style={{ stopColor: '#10b981', stopOpacity: 0.8 }} />
              </linearGradient>
            </defs>

            <ellipse cx="350" cy="175" rx="320" ry="155" fill="none" stroke="url(#frameGradient)" 
                     strokeWidth="3" strokeDasharray="15 8" className="animate-dash" />
            <ellipse cx="350" cy="175" rx="280" ry="125" fill="none" stroke="#22c55e" 
                     strokeWidth="1.5" opacity="0.4" />

            {/* Tread lines */}
            <line x1="150" y1="40" x2="150" y2="310" stroke="#22c55e" strokeWidth="2" opacity="0.5" />
            <line x1="220" y1="25" x2="220" y2="325" stroke="#22c55e" strokeWidth="2" opacity="0.5" />
            <line x1="290" y1="18" x2="290" y2="332" stroke="#22c55e" strokeWidth="2.5" opacity="0.6" />
            <line x1="350" y1="15" x2="350" y2="335" stroke="#22c55e" strokeWidth="3" opacity="0.7" />
            <line x1="410" y1="18" x2="410" y2="332" stroke="#22c55e" strokeWidth="2.5" opacity="0.6" />
            <line x1="480" y1="25" x2="480" y2="325" stroke="#22c55e" strokeWidth="2" opacity="0.5" />
            <line x1="550" y1="40" x2="550" y2="310" stroke="#22c55e" strokeWidth="2" opacity="0.5" />

            <circle cx="350" cy="175" r="6" fill="#22c55e">
              <animate attributeName="opacity" values="0.3;1;0.3" dur="1.5s" repeatCount="indefinite" />
            </circle>

            <line x1="100" y1="175" x2="600" y2="175" stroke="#10b981" strokeWidth="1" opacity="0.3" strokeDasharray="5 5" />

            {isRecording && (
              <line x1="50" y1="175" x2="650" y2="175" stroke="#10b981" strokeWidth="3" opacity="0.8">
                <animate attributeName="x1" values="50;650;50" dur="2s" repeatCount="indefinite" />
                <animate attributeName="x2" values="80;680;80" dur="2s" repeatCount="indefinite" />
              </line>
            )}
          </svg>

          <div className="absolute inset-0 rounded-[50%]" style={{ boxShadow: 'inset 0 0 40px rgba(16, 185, 129, 0.3)' }} />
        </div>

        {!isRecording && isCameraReady && (
          <>
            <div className="absolute top-6 left-0 right-0 text-center">
              <div className="inline-flex items-center gap-3 bg-black/80 px-8 py-4 rounded-full backdrop-blur-md border border-green-500/30">
                <span className="text-3xl">🎯</span>
                <p className="text-white text-lg font-medium">Position tire within the frame</p>
              </div>
            </div>
            
            <div className="absolute bottom-28 left-0 right-0 text-center">
              <div className="inline-flex items-center gap-4 bg-gradient-to-r from-blue-600/90 to-green-600/90 px-10 py-5 rounded-full backdrop-blur-md border-2 border-white/30 shadow-2xl animate-pulse-slow">
                <span className="text-3xl">➡️</span>
                <p className="text-white text-xl font-bold tracking-wide">Move camera slowly left to right</p>
                <span className="text-3xl">➡️</span>
              </div>
            </div>
          </>
        )}

        {isRecording && (
          <>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative">
                <div className="text-white font-black animate-countdown-pulse" 
                     style={{ fontSize: '140px', textShadow: '0 0 40px rgba(16, 185, 129, 0.9)', WebkitTextStroke: '3px rgba(16, 185, 129, 0.5)' }}>
                  {timeLeft}
                </div>
                
                <svg className="absolute -inset-12 w-64 h-64" viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
                  <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="3" />
                  <circle cx="50" cy="50" r="45" fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round"
                    strokeDasharray="283" strokeDashoffset={283 - (283 * (8 - timeLeft)) / 8}
                    style={{ transition: 'stroke-dashoffset 1s linear' }} />
                </svg>
              </div>
            </div>

            <div className="absolute top-8 left-1/2 -translate-x-1/2">
              <div className="flex items-center gap-3 bg-red-600 px-8 py-4 rounded-full shadow-2xl border-2 border-white/50">
                <div className="w-4 h-4 bg-white rounded-full animate-pulse" />
                <span className="text-white font-bold text-base uppercase tracking-widest">Recording</span>
              </div>
            </div>
          </>
        )}

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

      <div className="absolute top-6 left-6 z-20 pointer-events-auto">
        <button onClick={onClose} disabled={isRecording}
          className="p-4 bg-black/80 hover:bg-black rounded-full backdrop-blur-md transition-all disabled:opacity-50 border border-white/20">
          <X className="text-white w-7 h-7" />
        </button>
      </div>

      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 pointer-events-auto">
        <button onClick={startRecording} disabled={!isCameraReady || isRecording || recordingComplete}
          className="relative group disabled:opacity-50 disabled:cursor-not-allowed">
          <div className="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-75" style={{ animationDuration: '2s' }} />
          
          <div className="relative w-24 h-24 bg-red-600 rounded-full border-4 border-white shadow-2xl 
                          flex items-center justify-center transition-all duration-200 
                          group-hover:scale-110 group-active:scale-95 group-hover:border-8">
            {!isRecording && <div className="w-8 h-8 bg-white rounded-sm" />}
          </div>
        </button>
        
        {!isRecording && isCameraReady && (
          <p className="text-white text-base text-center mt-4 font-semibold tracking-wide">Tap to start scanning</p>
        )}
      </div>
    </div>
  );
};

// ============= HOME COMPONENT =============
const Home: React.FC = () => {
  const [showCamera, setShowCamera] = useState(false);
  const [capturedVideos, setCapturedVideos] = useState<string[]>([]);

  const handleCapturedVideo = (videoUrl: string) => {
    console.log("Captured Video:", videoUrl);
    setCapturedVideos(prev => [...prev, videoUrl]);
    setShowCamera(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-12 pt-8">
          <div className="inline-block">
            <h1 className="text-5xl font-bold text-white mb-2 tracking-tight">Apollo</h1>
            <div className="h-1 bg-gradient-to-r from-blue-400 to-green-400 rounded-full"></div>
          </div>
          <p className="text-blue-200 mt-4 text-lg">Tyre Tread Analysis System</p>
        </div>

        <button onClick={() => setShowCamera(true)}
          className="w-full bg-gradient-to-br from-blue-500 to-blue-600 rounded-3xl shadow-2xl hover:shadow-blue-500/50 
                     p-10 border border-blue-400/30 hover:border-blue-400/60 transition-all duration-300 
                     transform hover:scale-[1.02] active:scale-[0.98] group">
          <div className="flex flex-col items-center gap-6">
            <div className="relative">
              <div className="absolute inset-0 bg-white/20 rounded-full blur-xl group-hover:blur-2xl transition-all"></div>
              <div className="relative w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-lg">
                <Video className="w-10 h-10 text-blue-600" />
              </div>
            </div>
            
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Start Tyre Scan</h2>
              <p className="text-blue-100 text-sm">Capture 8-second video of tyre tread</p>
            </div>

            <div className="flex items-center gap-4 text-blue-100 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                <span>8 seconds</span>
              </div>
              <div className="w-1 h-1 bg-blue-300 rounded-full"></div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                <span>Landscape</span>
              </div>
              <div className="w-1 h-1 bg-blue-300 rounded-full"></div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                <span>HD quality</span>
              </div>
            </div>
          </div>
        </button>

        {capturedVideos.length > 0 && (
          <div className="mt-8">
            <h3 className="text-white text-xl font-semibold mb-4">Recent Scans</h3>
            <div className="grid gap-4">
              {capturedVideos.map((videoUrl, index) => (
                <div key={index} className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
                  <video src={videoUrl} controls className="w-full rounded-lg" />
                  <p className="text-white/70 text-sm mt-2">Scan {capturedVideos.length - index}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-12 bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
          <h3 className="text-white text-lg font-semibold mb-4">📋 How to Scan</h3>
          <ol className="space-y-3 text-blue-100">
            <li className="flex gap-3">
              <span className="font-bold text-blue-400">1.</span>
              <span>Rotate device to landscape mode</span>
            </li>
            <li className="flex gap-3">
              <span className="font-bold text-blue-400">2.</span>
              <span>Position tire horizontally within the green frame</span>
            </li>
            <li className="flex gap-3">
              <span className="font-bold text-blue-400">3.</span>
              <span>Tap record and slowly move camera left to right</span>
            </li>
            <li className="flex gap-3">
              <span className="font-bold text-blue-400">4.</span>
              <span>Keep movement steady for 8 seconds</span>
            </li>
          </ol>
        </div>
      </div>

      {showCamera && (
        <CameraCapture onCapture={handleCapturedVideo} onClose={() => setShowCamera(false)} />
      )}

      <style>{`
        @keyframes countdown-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.15); }
        }
        .animate-countdown-pulse { animation: countdown-pulse 1s ease-in-out infinite; }

        @keyframes dash { to { stroke-dashoffset: -46; } }
        .animate-dash { animation: dash 3s linear infinite; }

        @keyframes pulse-slow {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.85; transform: scale(1.03); }
        }
        .animate-pulse-slow { animation: pulse-slow 2.5s ease-in-out infinite; }

        @keyframes scale-in {
          0% { opacity: 0; transform: scale(0.3) rotate(-10deg); }
          60% { transform: scale(1.1) rotate(5deg); }
          100% { opacity: 1; transform: scale(1) rotate(0deg); }
        }
        .animate-scale-in { animation: scale-in 0.6s cubic-bezier(0.34, 1.56, 0.64, 1); }

        @keyframes rotate {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(90deg); }
        }
        .animate-rotate { animation: rotate 1.5s ease-in-out infinite alternate; }

        @keyframes spin-slow { to { transform: rotate(360deg); } }
        .animate-spin-slow { animation: spin-slow 3s linear infinite; }
      `}</style>
    </div>
  );
};

export default Home;