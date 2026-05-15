// components/PreviewPage.tsx
import React, { useEffect, useRef } from 'react';

interface PreviewPageProps {
  videoUrl: string;
  onRetake: () => void;
  onSave: () => void;
  onNewCapture: () => void;
}

const PreviewPage: React.FC<PreviewPageProps> = ({ 
  videoUrl, 
  onRetake, 
  onSave, 
  onNewCapture 
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(e => console.log('Auto-play prevented:', e));
    }
  }, [videoUrl]);

  return (
    <div className="min-h-screen bg-black flex flex-col font-sans">
      {/* Background Decorative Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[20%] right-[-10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[20%] left-[-10%] w-[50%] h-[50%] bg-green-600/10 rounded-full blur-[120px]" />
      </div>

      {/* Header */}
      <div className="relative z-10 px-6 py-6 flex items-center justify-between border-b border-white/5 bg-black/40 backdrop-blur-2xl">
        <button
          onClick={onNewCapture}
          className="w-10 h-10 flex items-center justify-center bg-white/5 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition-all active:scale-90"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="text-center">
          <h2 className="text-white text-lg font-black tracking-widest uppercase">Scan Results</h2>
          <div className="flex items-center justify-center gap-2 mt-1">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-[10px] text-zinc-500 font-bold tracking-tighter uppercase">Processing Complete</span>
          </div>
        </div>
        <div className="w-10" />
      </div>

      {/* Video Preview Container */}
      <div className="flex-1 flex items-center justify-center p-6 relative z-10">
        <div className="relative group max-w-sm w-full bg-zinc-900 rounded-[2rem] overflow-hidden shadow-[0_0_80px_rgba(0,0,0,1)] border border-white/10">
          {/* Internal Scanner Lines Overlay */}
          <div className="absolute inset-0 pointer-events-none z-10 opacity-30">
            <div className="absolute inset-0 grid grid-cols-6 grid-rows-12">
               {[...Array(72)].map((_, i) => (
                 <div key={i} className="border-[0.5px] border-white/10" />
               ))}
            </div>
          </div>

          <video
            ref={videoRef}
            src={videoUrl}
            controls
            loop
            className="w-full h-auto aspect-[9/16] object-cover"
            playsInline
          />
        </div>
      </div>

      {/* Bottom Action Panel */}
      <div className="relative z-10 bg-zinc-900/80 backdrop-blur-3xl border-t border-white/10 p-8 pb-12 rounded-t-[3rem] shadow-[0_-20px_50px_rgba(0,0,0,0.5)]">
        <div className="max-w-md mx-auto">
          {/* Metadata Grid */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
              <p className="text-zinc-500 text-[10px] font-bold tracking-widest uppercase mb-1">Scan Duration</p>
              <p className="text-white text-xl font-black">
                {(() => {
                  const video = videoRef.current;
                  return video?.duration ? `${Math.round(video.duration)}s` : '5s';
                })()}
              </p>
            </div>
            <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
              <p className="text-zinc-500 text-[10px] font-bold tracking-widest uppercase mb-1">Target Format</p>
              <p className="text-white text-xl font-black text-blue-400">WEBM / HD</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-4">
            <button
              onClick={onSave}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-black py-5 rounded-2xl transition-all shadow-[0_10px_30px_rgba(37,99,235,0.3)] active:scale-95 flex items-center justify-center gap-3 tracking-widest uppercase text-sm"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <span>Export to Gallery</span>
            </button>
            
            <button
              onClick={onRetake}
              className="w-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white font-bold py-5 rounded-2xl transition-all border border-white/5 active:scale-95 flex items-center justify-center gap-3 tracking-widest uppercase text-xs"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Discard & Retake</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PreviewPage;