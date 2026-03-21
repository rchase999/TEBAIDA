import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';

export interface ConfettiEffectProps {
  /** Whether the confetti animation is active. */
  active: boolean;
  /** Duration in milliseconds before cleanup. */
  duration?: number;
  /** Callback fired when the animation completes. */
  onComplete?: () => void;
}

const PARTICLE_COUNT = 80;

const COLORS = [
  '#5c7cfa', // forge-500
  '#4263eb', // forge-600
  '#10b981', // emerald-500
  '#f59e0b', // amber-500
  '#f43f5e', // rose-500
  '#a855f7', // purple-500
  '#06b6d4', // cyan-500
  '#ffd700', // gold
  '#c0c0c0', // silver
  '#ff6b6b', // coral
];

interface ParticleData {
  id: number;
  color: string;
  size: number;
  startX: number;
  startY: number;
  translateX: number;
  translateY: number;
  rotation: number;
  animDuration: number;
  delay: number;
  shape: 'square' | 'circle' | 'rect';
}

function rand(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function generateParticles(): ParticleData[] {
  const particles: ParticleData[] = [];
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const angle = rand(0, Math.PI * 2);
    const distance = rand(150, 500);
    particles.push({
      id: i,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      size: rand(4, 10),
      startX: rand(-30, 30),
      startY: rand(-30, 30),
      translateX: Math.cos(angle) * distance,
      translateY: Math.sin(angle) * distance - rand(100, 300),
      rotation: rand(-720, 720),
      animDuration: rand(1, 3),
      delay: rand(0, 0.3),
      shape: (['square', 'circle', 'rect'] as const)[Math.floor(Math.random() * 3)],
    });
  }
  return particles;
}

/**
 * Confetti animation component that bursts colorful particles from the
 * center of the screen. Renders via a React portal at z-index 9999.
 * Respects prefers-reduced-motion by skipping the animation entirely.
 */
export const ConfettiEffect: React.FC<ConfettiEffectProps> = ({
  active,
  duration = 3000,
  onComplete,
}) => {
  const [visible, setVisible] = useState(false);
  const [particles, setParticles] = useState<ParticleData[]>([]);
  const prevActiveRef = useRef(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const prefersReducedMotion = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  const cleanup = useCallback(() => {
    setVisible(false);
    setParticles([]);
    onComplete?.();
  }, [onComplete]);

  useEffect(() => {
    // Only trigger on rising edge (false -> true)
    if (active && !prevActiveRef.current) {
      if (prefersReducedMotion) {
        onComplete?.();
        prevActiveRef.current = active;
        return;
      }

      setParticles(generateParticles());
      setVisible(true);

      timeoutRef.current = setTimeout(() => {
        cleanup();
      }, duration);
    }

    if (!active && prevActiveRef.current) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      cleanup();
    }

    prevActiveRef.current = active;

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [active, duration, cleanup, prefersReducedMotion, onComplete]);

  if (!visible || particles.length === 0) return null;

  const keyframes = particles
    .map(
      (p) => `
@keyframes confetti-fly-${p.id} {
  0% {
    transform: translate(0, 0) rotate(0deg) scale(1);
    opacity: 1;
  }
  65% {
    opacity: 1;
  }
  100% {
    transform: translate(${p.translateX}px, ${p.translateY}px) rotate(${p.rotation}deg) scale(0.4);
    opacity: 0;
  }
}`,
    )
    .join('\n');

  const content = (
    <div
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 9999 }}
      aria-hidden="true"
    >
      <style>{keyframes}</style>
      {particles.map((p) => {
        const borderRadius =
          p.shape === 'circle' ? '50%' : p.shape === 'rect' ? '2px' : '1px';
        const width = p.shape === 'rect' ? p.size * 0.5 : p.size;

        return (
          <div
            key={p.id}
            style={{
              position: 'absolute',
              left: `calc(50% + ${p.startX}px)`,
              top: `calc(50% + ${p.startY}px)`,
              width: `${width}px`,
              height: `${p.size}px`,
              backgroundColor: p.color,
              borderRadius,
              opacity: 0,
              animation: `confetti-fly-${p.id} ${p.animDuration}s ${p.delay}s cubic-bezier(0.22, 0.61, 0.36, 1) forwards`,
            }}
          />
        );
      })}
    </div>
  );

  return createPortal(content, document.body);
};

export default ConfettiEffect;
