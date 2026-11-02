import React, { useEffect, useState } from 'react';
import { Flashlight, X, Zap } from 'lucide-react';

interface ScreenFlashlightProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ScreenFlashlight: React.FC<ScreenFlashlightProps> = ({ isOpen, onClose }) => {
  const [strobe, setStrobe] = useState(false);
  const [strobeState, setStrobeState] = useState(true);
  const [color, setColor] = useState<'white' | 'warm' | 'cyan'>('white');

  useEffect(() => {
    if (!isOpen || !strobe) {
      setStrobeState(true);
      return;
    }
    const interval = setInterval(() => {
      setStrobeState((prev) => !prev);
    }, 120);
    return () => clearInterval(interval);
  }, [isOpen, strobe]);

  if (!isOpen) return null;

  let bgClass = 'bg-white';
  if (color === 'warm') bgClass = 'bg-amber-100';
  if (color === 'cyan') bgClass = 'bg-cyan-200';

  if (strobe && !strobeState) {
    bgClass = 'bg-black';
  }

  return (
    <div
      role="dialog"
      aria-label="Screen Flashlight Torch"
      className={`fixed inset-0 z-50 transition-colors duration-75 flex flex-col justify-between p-6 select-none ${bgClass}`}
    >
      {/* Top Controls */}
      <div className="flex items-center justify-between text-neutral-900">
        <div className="flex items-center gap-2 bg-black/70 text-white px-3 py-1.5 rounded-full backdrop-blur-md text-xs font-mono">
          <Flashlight className="w-4 h-4 text-amber-400" />
          <span>SCREEN TORCH ACTIVE</span>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Turn off flashlight"
          className="p-2.5 rounded-full bg-black/70 hover:bg-black/90 text-white backdrop-blur-md transition cursor-pointer"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Center Notice */}
      <div className="text-center">
        <p className="text-sm font-bold text-neutral-800/80 uppercase tracking-widest">
          Maximum Screen Luminance
        </p>
        <p className="text-xs text-neutral-600 mt-1">Tap anywhere or press close to exit</p>
      </div>

      {/* Bottom Mode Toolbar */}
      <div className="flex items-center justify-center gap-3">
        <div className="bg-black/80 backdrop-blur-md p-1.5 rounded-2xl flex items-center gap-2 shadow-2xl">
          <button
            type="button"
            onClick={() => setColor('white')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer ${
              color === 'white' ? 'bg-white text-black font-bold' : 'text-neutral-300 hover:text-white'
            }`}
          >
            Cool White
          </button>
          <button
            type="button"
            onClick={() => setColor('warm')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer ${
              color === 'warm' ? 'bg-amber-200 text-black font-bold' : 'text-neutral-300 hover:text-white'
            }`}
          >
            Warm
          </button>
          <button
            type="button"
            onClick={() => setColor('cyan')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer ${
              color === 'cyan' ? 'bg-cyan-300 text-black font-bold' : 'text-neutral-300 hover:text-white'
            }`}
          >
            Cyber Cyan
          </button>

          <button
            type="button"
            onClick={() => setStrobe(!strobe)}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer ${
              strobe ? 'bg-rose-500 text-white animate-pulse' : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Zap className="w-3 h-3" />
            <span>Strobe</span>
          </button>
        </div>
      </div>
    </div>
  );
};
