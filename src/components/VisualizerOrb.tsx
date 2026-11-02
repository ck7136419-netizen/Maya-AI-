import React, { useEffect, useRef } from 'react';

export type AssistantState = 'IDLE' | 'CONNECTING' | 'LISTENING' | 'SPEAKING' | 'ERROR';

interface VisualizerOrbProps {
  state: AssistantState;
  micVolume: number;
  outputVolume: number;
  onClick?: () => void;
  disabled?: boolean;
}

export const VisualizerOrb: React.FC<VisualizerOrbProps> = ({
  state,
  micVolume,
  outputVolume,
  onClick,
  disabled = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let phase = 0;

    const render = () => {
      phase += 0.04;
      const width = canvas.width;
      const height = canvas.height;
      const centerX = width / 2;
      const centerY = height / 2;

      ctx.clearRect(0, 0, width, height);

      // Base radius and dynamic amplitude based on state
      const baseRadius = 85;
      let dynamicScale = 1;
      let primaryColor = 'rgba(244, 63, 94, '; // Rose 500
      let secondaryColor = 'rgba(168, 85, 247, '; // Purple 500
      let glowColor = 'rgba(244, 63, 94, 0.4)';

      if (state === 'LISTENING') {
        dynamicScale = 1 + Math.min(micVolume * 1.8, 0.6);
        primaryColor = 'rgba(56, 189, 248, '; // Sky blue
        secondaryColor = 'rgba(129, 140, 248, '; // Indigo
        glowColor = 'rgba(56, 189, 248, 0.5)';
      } else if (state === 'SPEAKING') {
        dynamicScale = 1 + Math.min(outputVolume * 2.2, 0.7);
        primaryColor = 'rgba(251, 113, 133, '; // Rose coral
        secondaryColor = 'rgba(236, 72, 153, '; // Pink
        glowColor = 'rgba(244, 63, 94, 0.6)';
      } else if (state === 'CONNECTING') {
        dynamicScale = 1 + Math.sin(phase * 2) * 0.1;
        primaryColor = 'rgba(250, 204, 21, '; // Amber
        secondaryColor = 'rgba(249, 115, 22, '; // Orange
        glowColor = 'rgba(250, 204, 21, 0.4)';
      } else if (state === 'ERROR') {
        dynamicScale = 1 + Math.sin(phase * 4) * 0.05;
        primaryColor = 'rgba(239, 68, 68, '; // Red
        secondaryColor = 'rgba(185, 28, 28, ';
        glowColor = 'rgba(239, 68, 68, 0.5)';
      } else {
        // IDLE: gentle breathing
        dynamicScale = 1 + Math.sin(phase * 0.8) * 0.04;
      }

      // Draw background glow halo
      const haloGradient = ctx.createRadialGradient(
        centerX,
        centerY,
        baseRadius * 0.5,
        centerX,
        centerY,
        baseRadius * 2.2 * dynamicScale
      );
      haloGradient.addColorStop(0, glowColor);
      haloGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = haloGradient;
      ctx.beginPath();
      ctx.arc(centerX, centerY, baseRadius * 2.2 * dynamicScale, 0, Math.PI * 2);
      ctx.fill();

      // Outer wave rings for SPEAKING and LISTENING
      if (state === 'SPEAKING' || state === 'LISTENING') {
        const ringCount = 3;
        for (let r = 1; r <= ringCount; r++) {
          const ringRadius = baseRadius * (1 + r * 0.25 * dynamicScale);
          const ringAlpha = Math.max(0, 0.4 - r * 0.1);
          ctx.beginPath();
          ctx.arc(centerX, centerY, ringRadius, 0, Math.PI * 2);
          ctx.strokeStyle = primaryColor + ringAlpha + ')';
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
      }

      // Draw animated undulating orb contour
      const points = 64;
      ctx.beginPath();

      for (let i = 0; i <= points; i++) {
        const angle = (i / points) * Math.PI * 2;
        // Wave deformation
        const wave =
          Math.sin(angle * 4 + phase) * 6 * dynamicScale +
          Math.cos(angle * 6 - phase * 1.5) * 4 * dynamicScale;

        const currentRadius = baseRadius * dynamicScale + wave;
        const x = centerX + Math.cos(angle) * currentRadius;
        const y = centerY + Math.sin(angle) * currentRadius;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }

      ctx.closePath();

      // Orb radial gradient
      const orbGradient = ctx.createRadialGradient(
        centerX - 25,
        centerY - 25,
        10,
        centerX,
        centerY,
        baseRadius * dynamicScale
      );
      orbGradient.addColorStop(0, '#ffffff');
      orbGradient.addColorStop(0.2, primaryColor + '0.9)');
      orbGradient.addColorStop(0.7, secondaryColor + '0.8)');
      orbGradient.addColorStop(1, primaryColor + '0.4)');

      ctx.fillStyle = orbGradient;
      ctx.fill();

      // Inner highlight
      ctx.beginPath();
      ctx.arc(centerX - 28, centerY - 28, 22 * dynamicScale, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.fill();

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [state, micVolume, outputVolume]);

  return (
    <div className="relative flex flex-col items-center justify-center select-none">
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        aria-label={`Arushi Voice Assistant status: ${state}. Click to toggle live session.`}
        className="relative group focus:outline-none focus:ring-4 focus:ring-rose-500/40 rounded-full transition-transform active:scale-95 cursor-pointer disabled:cursor-not-allowed"
      >
        <canvas
          ref={canvasRef}
          width={340}
          height={340}
          className="w-72 h-72 sm:w-80 sm:h-80 transition-all duration-300"
        />

        {/* Center state overlay text / icon */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <div className="text-xs uppercase tracking-widest font-semibold px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-white/90 shadow-lg">
            {state === 'IDLE' && 'Tap to Start'}
            {state === 'CONNECTING' && 'Connecting...'}
            {state === 'LISTENING' && 'Listening...'}
            {state === 'SPEAKING' && 'Arushi Speaking'}
            {state === 'ERROR' && 'Error'}
          </div>
        </div>
      </button>
    </div>
  );
};
