'use client';

interface HUDProps {
  score: number;
  combo: number;
  multiplier: number;
  songTitle: string;
  crescendoActive: boolean;
}

export default function HUD({ score, combo, multiplier, songTitle, crescendoActive }: HUDProps) {
  return (
    <div className="fixed top-0 left-0 right-0 z-40 pointer-events-none px-6 py-4">
      <div className="flex items-start justify-between">
        {/* Left: Song title */}
        <div>
          <p className="text-gray-500 text-xs uppercase tracking-wider">Now Playing</p>
          <p className="text-white font-semibold">{songTitle}</p>
        </div>

        {/* Center: Combo */}
        <div className="text-center">
          {combo > 0 && (
            <div className={`transition-all ${combo >= 25 ? 'animate-pulse' : ''}`}>
              <p className="text-5xl font-black tabular-nums" style={{
                color: combo >= 50 ? '#ffd700' : combo >= 25 ? '#FF6B6B' : '#ffffff',
                textShadow: combo >= 25 ? `0 0 20px ${combo >= 50 ? 'rgba(255,215,0,0.6)' : 'rgba(255,107,107,0.6)'}` : 'none',
              }}>
                {combo}
              </p>
              <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">Combo</p>
            </div>
          )}
        </div>

        {/* Right: Score + Multiplier */}
        <div className="text-right">
          <p className="text-3xl font-black text-white tabular-nums">
            {score.toLocaleString()}
          </p>
          <div className="flex items-center justify-end gap-2 mt-1">
            <span
              className={`px-2 py-0.5 rounded text-xs font-black ${
                crescendoActive
                  ? 'bg-yellow-500/20 text-yellow-300 animate-pulse'
                  : multiplier > 1
                    ? 'bg-[#FF6B6B]/20 text-[#FF6B6B]'
                    : 'bg-white/10 text-gray-400'
              }`}
            >
              {multiplier}x
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
