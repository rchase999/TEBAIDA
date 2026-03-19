/**
 * Notification Sound utility — plays subtle audio cues for debate events.
 * Uses the Web Audio API to generate tones (no external files needed).
 */

let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioContext;
}

/**
 * Play a short tone.
 * @param frequency - Hz (e.g., 440 for A4)
 * @param duration - seconds
 * @param volume - 0 to 1
 * @param type - oscillator waveform
 */
function playTone(
  frequency: number,
  duration: number = 0.15,
  volume: number = 0.3,
  type: OscillatorType = 'sine',
): void {
  try {
    const ctx = getAudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);

    gainNode.gain.setValueAtTime(volume, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.start();
    oscillator.stop(ctx.currentTime + duration);
  } catch {
    // Audio not available — silently skip
  }
}

/** Notification when a turn completes */
export function playTurnComplete(): void {
  playTone(587.33, 0.1, 0.2); // D5
  setTimeout(() => playTone(783.99, 0.15, 0.15), 100); // G5
}

/** Notification when an agent switch happens */
export function playAgentSwitch(): void {
  playTone(440, 0.08, 0.15, 'triangle'); // A4
}

/** Notification when the debate completes */
export function playDebateComplete(): void {
  playTone(523.25, 0.12, 0.25); // C5
  setTimeout(() => playTone(659.25, 0.12, 0.2), 120); // E5
  setTimeout(() => playTone(783.99, 0.2, 0.2), 240); // G5
}

/** Notification for errors */
export function playError(): void {
  playTone(220, 0.2, 0.3, 'sawtooth'); // A3
}

/** Notification for audience vote */
export function playVote(): void {
  playTone(880, 0.05, 0.1, 'sine'); // A5 — quick pip
}
