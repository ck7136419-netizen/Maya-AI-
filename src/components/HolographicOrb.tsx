import React, { useEffect, useRef } from 'react';
import { AssistantVoiceState } from '../types/yasmin';

interface HolographicOrbProps {
  state: AssistantVoiceState;
  micVolume?: number;
  outputVolume?: number;
  onClick?: () => void;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const HolographicOrb: React.FC<HolographicOrbProps> = ({
  state,
  micVolume = 0,
  outputVolume = 0,
  onClick,
  disabled = false,
  size = 'lg',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let phase = 0;

    const render = () => {
      phase += 0.035;
      const width = canvas.width;
      const height = canvas.height;
      const cx = width / 2;
      const cy = height / 2;

      ctx.clearRect(0, 0, width, height);

      const baseRadius = width * 0.22;
      let dynamicScale = 1;

      // Color themes depending on state
      // Cyan #00F0FF -> Purple #8B5CF6 -> Magenta #EC4899
      let coreColorStart = '#00F0FF';
      let coreColorMid = '#8B5CF6';
      let coreColorEnd = 'rgba(0, 240, 255, 0)';
      let haloAlpha = 0.25;

      if (state === 'LISTENING') {
        dynamicScale = 1 + Math.min(micVolume * 2.2, 0.7);
        coreColorStart = '#22D3EE';
        coreColorMid = '#06B6D4';
        haloAlpha = 0.45;
      } else if (state === 'SPEAKING') {
        dynamicScale = 1 + Math.min(outputVolume * 2.5, 0.85);
        coreColorStart = '#F43F5E';
        coreColorMid = '#A855F7';
        haloAlpha = 0.55;
      } else if (state === 'THINKING') {
        dynamicScale = 1 + Math.sin(phase * 3.5) * 0.12;
        coreColorStart = '#F59E0B';
        coreColorMid = '#EC4899';
        haloAlpha = 0.4;
      } else if (state === 'ERROR') {
        dynamicScale = 1 + Math.sin(phase * 5) * 0.08;
        coreColorStart = '#EF4444';
        coreColorMid = '#7F1D1D';
        haloAlpha = 0.5;
      } else {
        // IDLE: subtle breathing
        dynamicScale = 1 + Math.sin(phase * 1.2) * 0.04;
      }

      // 1. Ambient outer aura
      const auraGrad = ctx.createRadialGradient(cx, cy, baseRadius * 0.3, cx, cy, baseRadius * 2.2 * dynamicScale);
      auraGrad.addColorStop(0, coreColorStart);
      auraGrad.addColorStop(0.5, coreColorMid);
      auraGrad.addColorStop(1, coreColorEnd);

      ctx.globalAlpha = haloAlpha;
      ctx.fillStyle = auraGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, baseRadius * 2.2 * dynamicScale, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1.0;

      // 2. Futuristic Arc-Reactor segmented rings
      const ringCount = 3;
      for (let r = 1; r <= ringCount; r++) {
        const ringRadius = baseRadius * (1.1 + r * 0.28 * dynamicScale);
        const segments = 12;
        const segmentAngle = (Math.PI * 2) / segments;
        const speed = (r % 2 === 0 ? 1 : -1) * (0.015 * r);

        ctx.strokeStyle = r === 1 ? 'rgba(0, 240, 255, 0.45)' : 'rgba(139, 92, 246, 0.3)';
        ctx.lineWidth = 1.5;

        for (let s = 0; s < segments; s++) {
          if (s % 2 === 0) continue; // broken dashed tech ring
          ctx.beginPath();
          const startAngle = s * segmentAngle + phase * speed;
          const endAngle = startAngle + segmentAngle * 0.7;
          ctx.arc(cx, cy, ringRadius, startAngle, endAngle);
          ctx.stroke();
        }
      }

      // 3. Fluid undulating organic orb core
      const points = 48;
      ctx.beginPath();
      for (let i = 0; i <= points; i++) {
        const angle = (i / points) * Math.PI * 2;
        const wave =
          Math.sin(angle * 4 + phase * 1.5) * 6 * dynamicScale +
          Math.cos(angle * 6 - phase * 1.2) * 4 * dynamicScale;
        const r = baseRadius * dynamicScale + wave;
        const x = cx + Math.cos(angle) * r;
        const y = cy + Math.sin(angle) * r;

        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();

      const coreGrad = ctx.createRadialGradient(
        cx - baseRadius * 0.3,
        cy - baseRadius * 0.3,
        baseRadius * 0.1,
        cx,
        cy,
        baseRadius * dynamicScale
      );
      coreGrad.addColorStop(0, '#FFFFFF');
      coreGrad.addColorStop(0.25, coreColorStart);
      coreGrad.addColorStop(0.7, coreColorMid);
      coreGrad.addColorStop(1, '#050811');

      ctx.fillStyle = coreGrad;
      ctx.shadowColor = coreColorStart;
      ctx.shadowBlur = 24 * dynamicScale;
      ctx.fill();
      ctx.shadowBlur = 0;

      // 4. Inner quantum core eye
      ctx.beginPath();
      ctx.arc(cx - baseRadius * 0.25, cy - baseRadius * 0.25, baseRadius * 0.22 * dynamicScale, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.fill();

      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [state, micVolume, outputVolume]);

  const canvasDim = size === 'sm' ? 160 : size === 'md' ? 240 : 320;
  const containerDim = size === 'sm' ? 'w-40 h-40' : size === 'md' ? 'w-56 h-56' : 'w-72 h-72 sm:w-80 sm:h-80';

  return (
    <div className="relative flex flex-col items-center justify-center select-none">
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        aria-label={`YASMIN AI status: ${state}. Tap to activate voice interaction.`}
        className="relative group focus:outline-none focus:ring-4 focus:ring-cyan-500/40 rounded-full transition-transform active:scale-95 cursor-pointer disabled:cursor-not-allowed"
      >
        <canvas
          ref={canvasRef}
          width={canvasDim}
          height={canvasDim}
          className={`${containerDim} transition-all duration-300 drop-shadow-[0_0_35px_rgba(0,240,255,0.35)]`}
        />

        {/* Center state overlay pill */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <div className="text-[10px] sm:text-xs uppercase tracking-widest font-bold px-3 py-1 rounded-full bg-black/75 backdrop-blur-md border border-cyan-500/30 text-cyan-200 shadow-[0_0_15px_rgba(0,240,255,0.3)]">
            {state === 'IDLE' && 'YASMIN CORE'}
            {state === 'LISTENING' && 'LISTENING...'}
            {state === 'THINKING' && 'PROCESSING...'}
            {state === 'SPEAKING' && 'SPEAKING'}
            {state === 'ERROR' && 'ALERT'}
          </div>
        </div>
      </button>
    </div>
  );
};
