import React, { useEffect, useState } from 'react';

export interface FloatingReactionProps {
  emoji: string;
  x: number;
  y: number;
  onComplete: () => void;
}

/**
 * An absolutely-positioned emoji that floats upward and fades out.
 * Auto-removes itself after the animation completes (~1s).
 */
const FloatingReaction: React.FC<FloatingReactionProps> = ({ emoji, x, y, onComplete }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Trigger animation on next frame
    requestAnimationFrame(() => setMounted(true));

    const timer = setTimeout(() => {
      onComplete();
    }, 1000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <span
      style={{
        position: 'fixed',
        left: x,
        top: y,
        pointerEvents: 'none',
        zIndex: 9999,
        fontSize: '1.5rem',
        transition: 'all 1s ease-out',
        transform: mounted ? 'translateY(-80px) scale(1.4)' : 'translateY(0) scale(1)',
        opacity: mounted ? 0 : 1,
      }}
      aria-hidden="true"
    >
      {emoji}
    </span>
  );
};

export default FloatingReaction;
