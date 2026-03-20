import React, { useEffect, useRef, useCallback } from 'react';

export interface ConfettiEffectProps {
  trigger: boolean;
  onComplete?: () => void;
}

/**
 * Colors drawn from the project palette.
 * Mapped to actual hex values so the confetti renders correctly
 * outside of Tailwind class context.
 */
const COLORS = [
  '#5c7cfa', // forge-500
  '#10b981', // emerald-500
  '#f59e0b', // amber-500
  '#f43f5e', // rose-500
  '#a855f7', // purple-500
  '#06b6d4', // cyan-500
];

/** Random integer between min (inclusive) and max (exclusive). */
function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min)) + min;
}

/** Random float between min and max. */
function randFloat(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  rotationSpeed: number;
  width: number;
  height: number;
  color: string;
  opacity: number;
  gravity: number;
  drag: number;
  /** Remaining lifetime in ms */
  life: number;
  /** Total lifetime in ms */
  totalLife: number;
}

function createParticle(originX: number, originY: number): Particle {
  const angle = randFloat(-Math.PI * 0.9, -Math.PI * 0.1); // Mostly upward
  const speed = randFloat(6, 14);
  const life = randFloat(1200, 2200);

  return {
    x: originX + randFloat(-20, 20),
    y: originY,
    vx: Math.cos(angle) * speed + randFloat(-2, 2),
    vy: Math.sin(angle) * speed,
    rotation: randFloat(0, 360),
    rotationSpeed: randFloat(-8, 8),
    width: randFloat(5, 10),
    height: randFloat(3, 8),
    color: COLORS[randInt(0, COLORS.length)],
    opacity: 1,
    gravity: randFloat(0.12, 0.2),
    drag: randFloat(0.97, 0.99),
    life,
    totalLife: life,
  };
}

/**
 * Pure CSS/JS confetti explosion effect.
 * Creates 50-80 small colored particles that shoot upward and fall with
 * gravity, fading out over ~2 seconds.
 */
export const ConfettiEffect: React.FC<ConfettiEffectProps> = ({
  trigger,
  onComplete,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const prevTriggerRef = useRef(false);

  const runConfetti = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Size canvas to viewport
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const originX = canvas.width / 2;
    const originY = canvas.height * 0.55;

    // Create particles
    const particleCount = randInt(50, 80);
    const particles: Particle[] = [];
    for (let i = 0; i < particleCount; i++) {
      particles.push(createParticle(originX, originY));
    }

    let lastTime = performance.now();

    function animate(time: number) {
      if (!ctx || !canvas) return;

      const dt = Math.min((time - lastTime) / 16.67, 3); // Normalize to ~60fps, cap at 3x
      lastTime = time;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      let aliveCount = 0;

      for (const p of particles) {
        if (p.life <= 0) continue;
        aliveCount++;

        // Physics
        p.vy += p.gravity * dt;
        p.vx *= Math.pow(p.drag, dt);
        p.vy *= Math.pow(p.drag, dt);
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.rotation += p.rotationSpeed * dt;
        p.life -= 16.67 * dt;

        // Fade out over the last 30% of life
        const lifeFraction = p.life / p.totalLife;
        p.opacity = lifeFraction < 0.3 ? lifeFraction / 0.3 : 1;

        // Draw
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.globalAlpha = p.opacity;
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.width / 2, -p.height / 2, p.width, p.height);
        ctx.restore();
      }

      if (aliveCount > 0) {
        animFrameRef.current = requestAnimationFrame(animate);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        onComplete?.();
      }
    }

    animFrameRef.current = requestAnimationFrame(animate);
  }, [onComplete]);

  useEffect(() => {
    // Only fire on rising edge (false -> true)
    if (trigger && !prevTriggerRef.current) {
      runConfetti();
    }
    prevTriggerRef.current = trigger;

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [trigger, runConfetti]);

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (canvas) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-[9999] pointer-events-none"
      aria-hidden="true"
    />
  );
};

export default ConfettiEffect;
