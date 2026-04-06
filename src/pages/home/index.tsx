import React, { useState } from 'react';
import { Video, CheckCircle } from 'lucide-react';

// CameraCapture Component
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

  React.useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'environment',
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          streamRef.current = stream;
          videoRef.current.onloadedmetadata = () => setIsCameraReady(true);
        }
      } catch (err) {
        alert('Camera access denied. Please enable camera permissions.');
        onClose();
      }
    };
    startCamera();
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, [onClose]);

  const startRecording = () => {
    if (!streamRef.current || isRecording) return;
    if (navigator.vibrate) navigator.vibrate(200);

    const mediaRecorder = new MediaRecorder(streamRef.current, {
      mimeType: 'video/webm;codecs=vp8',
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
      setTimeout(() => onCapture(videoUrl), 500);
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
      {/* Live Camera Feed */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Dark overlay — all sides except frame window */}
      <div className="absolute inset-0 pointer-events-none">

        {/* ── Flat rectangular scanner frame ── */}
        {/* Positioned at vertical center, full usable width */}
        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
          style={{ width: '88%', maxWidth: '720px', aspectRatio: '720 / 220' }}
        >
          <svg
            viewBox="0 0 720 220"
            className="absolute inset-0 w-full h-full"
            style={{ overflow: 'visible' }}
          >
            {/* Top edge — dashed animated */}
            <line
              x1="0" y1="0" x2="720" y2="0"
              stroke="#22c55e" strokeWidth="3"
              strokeDasharray="14 7"
              className="animate-dash"
            />
            {/* Bottom edge — dashed animated */}
            <line
              x1="0" y1="220" x2="720" y2="220"
              stroke="#22c55e" strokeWidth="3"
              strokeDasharray="14 7"
              className="animate-dash"
            />
            {/* Left vertical cap */}
            <line x1="0" y1="0" x2="0" y2="220" stroke="#22c55e" strokeWidth="3" />
            {/* Right vertical cap */}
            <line x1="720" y1="0" x2="720" y2="220" stroke="#22c55e" strokeWidth="3" />

            {/* Tread measurement guide lines — evenly spaced verticals */}
            <line x1="144" y1="0" x2="144" y2="220" stroke="#22c55e" strokeWidth="1.5" opacity="0.45" />
            <line x1="288" y1="0" x2="288" y2="220" stroke="#22c55e" strokeWidth="1.5" opacity="0.45" />
            {/* Centre line — slightly brighter */}
            <line x1="360" y1="0" x2="360" y2="220" stroke="#22c55e" strokeWidth="2.5" opacity="0.9" />
            <line x1="432" y1="0" x2="432" y2="220" stroke="#22c55e" strokeWidth="1.5" opacity="0.45" />
            <line x1="576" y1="0" x2="576" y2="220" stroke="#22c55e" strokeWidth="1.5" opacity="0.45" />

            {/* Top tick marks above frame */}
            <line x1="144" y1="0" x2="144" y2="-9" stroke="#22c55e" strokeWidth="2" opacity="0.6" />
            <line x1="288" y1="0" x2="288" y2="-9" stroke="#22c55e" strokeWidth="2" opacity="0.6" />
            <line x1="360" y1="0" x2="360" y2="-12" stroke="#22c55e" strokeWidth="2.5" opacity="0.85" />
            <line x1="432" y1="0" x2="432" y2="-9" stroke="#22c55e" strokeWidth="2" opacity="0.6" />
            <line x1="576" y1="0" x2="576" y2="-9" stroke="#22c55e" strokeWidth="2" opacity="0.6" />

            {/* Bottom tick marks below frame */}
            <line x1="144" y1="220" x2="144" y2="229" stroke="#22c55e" strokeWidth="2" opacity="0.6" />
            <line x1="288" y1="220" x2="288" y2="229" stroke="#22c55e" strokeWidth="2" opacity="0.6" />
            <line x1="360" y1="220" x2="360" y2="232" stroke="#22c55e" strokeWidth="2.5" opacity="0.85" />
            <line x1="432" y1="220" x2="432" y2="229" stroke="#22c55e" strokeWidth="2" opacity="0.6" />
            <line x1="576" y1="220" x2="576" y2="229" stroke="#22c55e" strokeWidth="2" opacity="0.6" />

            {/* Centre alignment dot — pulsing */}
            <circle cx="360" cy="110" r="6" fill="#22c55e" opacity="0.85">
              <animate attributeName="opacity" values="0.3;1;0.3" dur="1.5s" repeatCount="indefinite" />
            </circle>

            {/* Scanning line — only while recording */}
            {isRecording && (
              <line x1="0" y1="0" x2="0" y2="220" stroke="#4ade80" strokeWidth="3" opacity="0.95">
                <animate attributeName="x1" values="0;720;0" dur="2.2s" repeatCount="indefinite" />
                <animate attributeName="x2" values="0;720;0" dur="2.2s" repeatCount="indefinite" />
              </line>
            )}
          </svg>

          {/* Corner L-brackets — small, tight to corners */}
          <div className="absolute -top-1 -left-1 w-7 h-7 border-t-[4px] border-l-[4px] border-green-400" />
          <div className="absolute -top-1 -right-1 w-7 h-7 border-t-[4px] border-r-[4px] border-green-400" />
          <div className="absolute -bottom-1 -left-1 w-7 h-7 border-b-[4px] border-l-[4px] border-green-400" />
          <div className="absolute -bottom-1 -right-1 w-7 h-7 border-b-[4px] border-r-[4px] border-green-400" />
        </div>

        {/* ── Instruction: align tire (before recording) ── */}
        {!isRecording && isCameraReady && (
          <div className="absolute top-8 left-0 right-0 text-center">
            <div className="inline-block bg-black/70 px-6 py-3 rounded-full backdrop-blur-sm">
              <p className="text-white text-base font-medium flex items-center gap-2 justify-center">
                <span className="text-xl">🔍</span>
                <span>Align tyre within the guide</span>
              </p>
            </div>
          </div>
        )}

        {/* ── Instruction: move left to right (before recording) ── */}
        {!isRecording && isCameraReady && (
          <div className="absolute bottom-32 left-0 right-0 text-center">
            <div className="inline-block bg-black/70 px-8 py-4 rounded-full backdrop-blur-sm animate-pulse-slow">
              <p className="text-green-400 text-base font-semibold flex items-center gap-3 justify-center">
                <span className="text-xl">➡️</span>
                <span>Move camera slowly left to right</span>
                <span className="text-xl">➡️</span>
              </p>
            </div>
          </div>
        )}

        {/* ── Countdown overlay (while recording) ── */}
        {isRecording && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative">
              <div
                className="text-white font-bold animate-countdown-pulse"
                style={{ fontSize: '120px', textShadow: '0 0 30px rgba(34,197,94,0.8)' }}
              >
                {timeLeft}
              </div>
              <svg className="absolute -inset-8 w-48 h-48 -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="4" />
                <circle
                  cx="50" cy="50" r="45"
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

        {/* ── Recording badge ── */}
        {isRecording && (
          <div className="absolute top-8 left-1/2 -translate-x-1/2">
            <div className="flex items-center gap-3 bg-red-500 px-6 py-3 rounded-full shadow-lg">
              <div className="w-3 h-3 bg-white rounded-full animate-pulse" />
              <span className="text-white font-semibold text-sm uppercase tracking-wide">Recording</span>
            </div>
          </div>
        )}

        {/* ── Scan complete overlay ── */}
        {recordingComplete && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60">
            <div className="bg-green-500 px-8 py-4 rounded-2xl shadow-2xl animate-scale-in">
              <p className="text-white text-2xl font-bold flex items-center gap-3">
                <span className="text-3xl">✓</span>
                <span>Scan Complete!</span>
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ── Close button ── */}
      <div className="absolute top-4 left-4 z-20 pointer-events-auto">
        <button
          onClick={onClose}
          disabled={isRecording}
          className="p-3 bg-black/70 hover:bg-black/90 rounded-full backdrop-blur-sm transition-all disabled:opacity-50"
        >
          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* ── Record button ── */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 pointer-events-auto">
        <button
          onClick={startRecording}
          disabled={!isCameraReady || isRecording || recordingComplete}
          className="relative group disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div
            className="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-75 group-hover:opacity-100"
            style={{ animationDuration: '2s' }}
          />
          <div
            className="relative w-20 h-20 bg-red-500 rounded-full border-4 border-white shadow-2xl
                       flex items-center justify-center transition-transform group-hover:scale-110 group-active:scale-95"
          >
            {!isRecording && <div className="w-6 h-6 bg-white rounded-sm" />}
          </div>
        </button>
        {!isRecording && isCameraReady && (
          <p className="text-white text-sm text-center mt-3 font-medium">Tap to start scanning</p>
        )}
      </div>

      {/* ── CSS Animations ── */}
      <style>{`
        @keyframes countdown-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(1.15); }
        }
        .animate-countdown-pulse {
          animation: countdown-pulse 1s ease-in-out infinite;
        }

        @keyframes dash {
          to { stroke-dashoffset: -42; }
        }
        .animate-dash {
          animation: dash 3s linear infinite;
        }

        @keyframes pulse-slow {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.02); }
        }
        .animate-pulse-slow {
          animation: pulse-slow 2.5s ease-in-out infinite;
        }

        @keyframes scale-in {
          0% { opacity: 0; transform: scale(0.4); }
          60% { transform: scale(1.1); }
          100% { opacity: 1; transform: scale(1); }
        }
        .animate-scale-in {
          animation: scale-in 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
      `}</style>
    </div>
  );
};

// ─────────────────────────────────────────────
// Home Component
// ─────────────────────────────────────────────
const Home: React.FC = () => {
  const [showCamera, setShowCamera] = useState(false);
  const [capturedVideos, setCapturedVideos] = useState<string[]>([]);

  const handleCapturedVideo = (videoUrl: string) => {
    setCapturedVideos((prev) => [...prev, videoUrl]);
    setShowCamera(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-4 md:p-8">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="text-center mb-12 pt-8">
          <div className="inline-block">
            <h1 className="text-5xl font-bold text-white mb-2 tracking-tight">Apollo</h1>
            <div className="h-1 bg-gradient-to-r from-blue-400 to-green-400 rounded-full" />
          </div>
          <p className="text-blue-200 mt-4 text-lg">Tyre Tread Analysis System</p>
        </div>

        {/* Scan Button */}
        <button
          onClick={() => setShowCamera(true)}
          className="w-full bg-gradient-to-br from-blue-500 to-blue-600 rounded-3xl shadow-2xl
                     hover:shadow-blue-500/50 p-10 border border-blue-400/30 hover:border-blue-400/60
                     transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] group"
        >
          <div className="flex flex-col items-center gap-6">
            <div className="relative">
              <div className="absolute inset-0 bg-white/20 rounded-full blur-xl group-hover:blur-2xl transition-all" />
              <div className="relative w-20 h-20 bg-white rounded-full flex items-center justify-center
                              shadow-lg group-hover:shadow-white/50 transition-all">
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
              <div className="w-1 h-1 bg-blue-300 rounded-full" />
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                <span>Auto-guided</span>
              </div>
              <div className="w-1 h-1 bg-blue-300 rounded-full" />
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                <span>HD quality</span>
              </div>
            </div>
          </div>
        </button>

        {/* Recent Scans */}
        {capturedVideos.length > 0 && (
          <div className="mt-8">
            <h3 className="text-white text-xl font-semibold mb-4">Recent Scans</h3>
            <div className="grid gap-4">
              {capturedVideos.map((videoUrl, index) => (
                <div
                  key={index}
                  className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20"
                >
                  <video src={videoUrl} controls className="w-full rounded-lg" />
                  <p className="text-white/70 text-sm mt-2">Scan {capturedVideos.length - index}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-12 bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
          <h3 className="text-white text-lg font-semibold mb-4">📋 How to Scan</h3>
          <ol className="space-y-3 text-blue-100">
            <li className="flex gap-3">
              <span className="font-bold text-blue-400">1.</span>
              <span>Position tyre horizontally in camera view</span>
            </li>
            <li className="flex gap-3">
              <span className="font-bold text-blue-400">2.</span>
              <span>Align tyre tread within the flat green guide frame</span>
            </li>
            <li className="flex gap-3">
              <span className="font-bold text-blue-400">3.</span>
              <span>Tap record and slowly move left to right</span>
            </li>
            <li className="flex gap-3">
              <span className="font-bold text-blue-400">4.</span>
              <span>Keep movement steady for 8 seconds</span>
            </li>
          </ol>
        </div>
      </div>

      {/* Camera Modal */}
      {showCamera && (
        <CameraCapture
          onCapture={handleCapturedVideo}
          onClose={() => setShowCamera(false)}
        />
      )}
    </div>
  );
};

export default Home;