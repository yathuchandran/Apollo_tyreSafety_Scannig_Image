// components/HomePage.tsx
import React from 'react';

interface HomePageProps {
  onStartCapture: () => void;
}

const HomePage: React.FC<HomePageProps> = ({ onStartCapture }) => {
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 font-sans">
      {/* Background Decorative Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-green-600/10 rounded-full blur-[120px]" />
      </div>

      {/* Logo/Brand Section */}
      <div className="text-center mb-12 animate-fade-in relative z-10">
        <div className="inline-block p-5 bg-gradient-to-tr from-blue-600 to-blue-400 rounded-3xl mb-6 shadow-[0_0_40px_rgba(37,99,235,0.4)]">
          <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h1 className="text-5xl font-extrabold text-white mb-3 tracking-tight">TyreScan <span className="text-blue-500">Pro</span></h1>
        <p className="text-zinc-400 text-xl font-medium">Precision Tyre Tread Analysis</p>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-12 relative z-10">
        <div className="bg-zinc-900/50 backdrop-blur-xl rounded-2xl p-8 border border-white/5 hover:border-blue-500/30 transition-all duration-300 group">
          <div className="bg-blue-500/10 w-14 h-14 rounded-xl flex items-center justify-center text-3xl mb-4 group-hover:scale-110 transition-transform">📱</div>
          <h3 className="text-white text-xl font-bold mb-2">Smart Scanning</h3>
          <p className="text-zinc-400 text-sm leading-relaxed">Advanced frame-by-frame tread capture technology</p>
        </div>
        <div className="bg-zinc-900/50 backdrop-blur-xl rounded-2xl p-8 border border-white/5 hover:border-green-500/30 transition-all duration-300 group">
          <div className="bg-green-500/10 w-14 h-14 rounded-xl flex items-center justify-center text-3xl mb-4 group-hover:scale-110 transition-transform">🎯</div>
          <h3 className="text-white text-xl font-bold mb-2">Precision Crop</h3>
          <p className="text-zinc-400 text-sm leading-relaxed">Automatically isolates the tread pattern for analysis</p>
        </div>
        <div className="bg-zinc-900/50 backdrop-blur-xl rounded-2xl p-8 border border-white/5 hover:border-purple-500/30 transition-all duration-300 group">
          <div className="bg-purple-500/10 w-14 h-14 rounded-xl flex items-center justify-center text-3xl mb-4 group-hover:scale-110 transition-transform">💾</div>
          <h3 className="text-white text-xl font-bold mb-2">Cloud Ready</h3>
          <p className="text-zinc-400 text-sm leading-relaxed">Save high-resolution scans directly to your device</p>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-zinc-900/80 backdrop-blur-2xl rounded-3xl p-8 max-w-2xl mx-auto mb-12 border border-white/10 shadow-2xl relative z-10">
        <h2 className="text-white font-bold text-xl mb-6 flex items-center gap-3">
          <span className="w-1.5 h-6 bg-blue-500 rounded-full" />
          Preparation Checklist
        </h2>
        <div className="space-y-6">
          <div className="flex items-start space-x-4">
            <div className="bg-blue-600/20 text-blue-400 rounded-xl w-10 h-10 flex items-center justify-center font-bold flex-shrink-0">1</div>
            <div>
              <p className="text-white font-semibold">Portrait Mode Only</p>
              <p className="text-zinc-400 text-sm mt-1">Always hold your device <span className="text-blue-400 font-bold">vertically</span> for the entire scan.</p>
            </div>
          </div>
          <div className="flex items-start space-x-4">
            <div className="bg-blue-600/20 text-blue-400 rounded-xl w-10 h-10 flex items-center justify-center font-bold flex-shrink-0">2</div>
            <div>
              <p className="text-white font-semibold">Optimal Distance</p>
              <p className="text-zinc-400 text-sm mt-1">Hold the camera exactly <span className="text-blue-400 font-bold">10cm (4 inches)</span> away from the tyre tread.</p>
            </div>
          </div>
          <div className="flex items-start space-x-4">
            <div className="bg-blue-600/20 text-blue-400 rounded-xl w-10 h-10 flex items-center justify-center font-bold flex-shrink-0">3</div>
            <div>
              <p className="text-white font-semibold">Steady Sweep</p>
              <p className="text-zinc-400 text-sm mt-1">Slowly move the camera across the tread to the end zone.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Capture Button */}
      <button
        onClick={onStartCapture}
        className="group relative px-12 py-5 rounded-2xl overflow-hidden transition-all duration-300 hover:scale-105 active:scale-95 shadow-[0_20px_50px_rgba(37,99,235,0.3)] z-10"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-700 group-hover:from-blue-500 group-hover:to-blue-600 transition-all" />
        <div className="relative flex items-center space-x-3 text-white font-bold">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="text-xl tracking-wide">INITIALIZE SCANNER</span>
        </div>
      </button>

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.8s cubic-bezier(0.16, 1, 0.3, 1);
        }
      `}</style>
    </div>
  );
};

export default HomePage;