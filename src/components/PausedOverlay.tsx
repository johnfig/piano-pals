'use client';

interface PausedOverlayProps {
  onResume: () => void;
  onQuit: () => void;
}

export default function PausedOverlay({ onResume, onQuit }: PausedOverlayProps) {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm z-50">
      <div className="text-center space-y-8">
        <h2 className="text-5xl font-black text-white tracking-wider">PAUSED</h2>
        <div className="space-y-3">
          <button
            onClick={onResume}
            className="block w-48 mx-auto py-3 px-6 rounded-xl bg-[#FF6B6B] text-white font-bold text-lg hover:scale-105 active:scale-95 transition-transform"
          >
            Resume
          </button>
          <button
            onClick={onQuit}
            className="block w-48 mx-auto py-3 px-6 rounded-xl border border-white/20 text-gray-400 font-semibold hover:text-white hover:border-white/40 transition-colors"
          >
            Quit to Menu
          </button>
        </div>
        <p className="text-gray-600 text-sm">Press ESC to resume</p>
      </div>
    </div>
  );
}
