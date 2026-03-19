import React, { useState, useEffect, useCallback, useRef } from 'react';
import clsx from 'clsx';
import { Volume2, VolumeX, Pause, Play, SkipForward } from 'lucide-react';
import { Button } from './Button';
import { Tooltip } from './Tooltip';

/* ======================================================================
   Voice Synthesis — TTS integration using the Web Speech API
   Supports per-debater voice assignment for distinct agent identity.
   ====================================================================== */

export interface VoiceAssignment {
  debaterId: string;
  voiceURI: string;
  rate: number;
  pitch: number;
}

interface VoiceSynthesisControlsProps {
  /** Whether TTS is globally enabled */
  enabled: boolean;
  onToggle: () => void;
  /** Currently speaking? */
  isSpeaking: boolean;
  /** Pause/resume the current utterance */
  onPauseResume: () => void;
  /** Stop and skip to end */
  onStop: () => void;
  className?: string;
}

/**
 * Compact TTS control bar for the debate toolbar.
 */
export const VoiceSynthesisControls: React.FC<VoiceSynthesisControlsProps> = ({
  enabled,
  onToggle,
  isSpeaking,
  onPauseResume,
  onStop,
  className,
}) => (
  <div className={clsx('flex items-center gap-1', className)}>
    <Tooltip content={enabled ? 'Disable voice' : 'Enable voice'}>
      <Button variant="ghost" size="sm" onClick={onToggle}>
        {enabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4 text-gray-400" />}
      </Button>
    </Tooltip>
    {enabled && isSpeaking && (
      <>
        <Tooltip content="Pause / Resume">
          <Button variant="ghost" size="sm" onClick={onPauseResume}>
            {window.speechSynthesis?.paused ? (
              <Play className="h-3.5 w-3.5" />
            ) : (
              <Pause className="h-3.5 w-3.5" />
            )}
          </Button>
        </Tooltip>
        <Tooltip content="Stop">
          <Button variant="ghost" size="sm" onClick={onStop}>
            <SkipForward className="h-3.5 w-3.5" />
          </Button>
        </Tooltip>
      </>
    )}
  </div>
);

/**
 * TTS button for a single turn bubble — click to speak that turn.
 */
export const SpeakButton: React.FC<{
  text: string;
  voiceAssignment?: VoiceAssignment;
  enabled: boolean;
  className?: string;
}> = ({ text, voiceAssignment, enabled, className }) => {
  const handleSpeak = useCallback(() => {
    if (!enabled || !window.speechSynthesis) return;

    // Cancel any current speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = voiceAssignment?.rate ?? 1.0;
    utterance.pitch = voiceAssignment?.pitch ?? 1.0;

    // Try to assign the specific voice
    if (voiceAssignment?.voiceURI) {
      const voices = window.speechSynthesis.getVoices();
      const match = voices.find((v) => v.voiceURI === voiceAssignment.voiceURI);
      if (match) utterance.voice = match;
    }

    window.speechSynthesis.speak(utterance);
  }, [text, voiceAssignment, enabled]);

  if (!enabled) return null;

  return (
    <Tooltip content="Read aloud">
      <button
        onClick={handleSpeak}
        className={clsx(
          'inline-flex items-center justify-center rounded-full p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-surface-dark-3 dark:hover:text-gray-300',
          className,
        )}
      >
        <Volume2 className="h-3.5 w-3.5" />
      </button>
    </Tooltip>
  );
};

/* ------- Voice selection helpers ------- */

const ROLE_VOICE_PREFERENCES: Record<string, { lang: string; gender: 'male' | 'female'; pitchShift: number }> = {
  housemaster: { lang: 'en-GB', gender: 'male', pitchShift: -0.1 },
  proposition: { lang: 'en-US', gender: 'male', pitchShift: 0 },
  opposition: { lang: 'en-US', gender: 'female', pitchShift: 0.1 },
};

/**
 * Automatically assign distinct voices to each debater based on their role.
 * Returns a map of debaterId -> VoiceAssignment.
 */
export function assignVoicesToDebaters(
  debaters: { id: string; position: string }[]
): Record<string, VoiceAssignment> {
  const assignments: Record<string, VoiceAssignment> = {};

  if (!window.speechSynthesis) return assignments;

  const voices = window.speechSynthesis.getVoices();
  if (voices.length === 0) return assignments;

  const usedVoiceURIs = new Set<string>();

  for (const debater of debaters) {
    const pref = ROLE_VOICE_PREFERENCES[debater.position] ?? ROLE_VOICE_PREFERENCES['proposition'];

    // Try to find a matching voice
    let bestVoice = voices.find(
      (v) =>
        v.lang.startsWith(pref.lang) &&
        !usedVoiceURIs.has(v.voiceURI),
    );

    // Fallback: any unused voice
    if (!bestVoice) {
      bestVoice = voices.find((v) => !usedVoiceURIs.has(v.voiceURI) && v.lang.startsWith('en'));
    }

    // Last fallback: any voice
    if (!bestVoice) {
      bestVoice = voices[0];
    }

    if (bestVoice) {
      usedVoiceURIs.add(bestVoice.voiceURI);
    }

    assignments[debater.id] = {
      debaterId: debater.id,
      voiceURI: bestVoice?.voiceURI ?? '',
      rate: 1.0,
      pitch: 1.0 + pref.pitchShift,
    };
  }

  return assignments;
}

/**
 * Hook for managing TTS state in the debate view.
 */
export function useVoiceSynthesis() {
  const [enabled, setEnabled] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const voiceAssignmentsRef = useRef<Record<string, VoiceAssignment>>({});

  // Update speaking state
  useEffect(() => {
    if (!window.speechSynthesis) return;

    const interval = setInterval(() => {
      setIsSpeaking(window.speechSynthesis.speaking);
    }, 200);

    return () => clearInterval(interval);
  }, []);

  const toggle = useCallback(() => {
    if (enabled) {
      window.speechSynthesis?.cancel();
    }
    setEnabled((prev) => !prev);
  }, [enabled]);

  const pauseResume = useCallback(() => {
    if (!window.speechSynthesis) return;
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    } else if (window.speechSynthesis.speaking) {
      window.speechSynthesis.pause();
    }
  }, []);

  const stop = useCallback(() => {
    window.speechSynthesis?.cancel();
  }, []);

  const speak = useCallback(
    (text: string, debaterId?: string) => {
      if (!enabled || !window.speechSynthesis) return;

      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      const assignment = debaterId ? voiceAssignmentsRef.current[debaterId] : undefined;

      if (assignment) {
        utterance.rate = assignment.rate;
        utterance.pitch = assignment.pitch;
        const voices = window.speechSynthesis.getVoices();
        const match = voices.find((v) => v.voiceURI === assignment.voiceURI);
        if (match) utterance.voice = match;
      }

      window.speechSynthesis.speak(utterance);
    },
    [enabled],
  );

  const initVoices = useCallback(
    (debaters: { id: string; position: string }[]) => {
      voiceAssignmentsRef.current = assignVoicesToDebaters(debaters);
    },
    [],
  );

  return {
    enabled,
    isSpeaking,
    toggle,
    pauseResume,
    stop,
    speak,
    initVoices,
    voiceAssignments: voiceAssignmentsRef.current,
  };
}
