import { useCallback, useRef } from 'react';

/**
 * Generates a short urgent alert tone using the Web Audio API.
 * No external audio files needed.
 */
export function useCriticalAlertSound() {
  const lastPlayed = useRef(0);
  const COOLDOWN = 10000; // Don't play more than once per 10s

  const play = useCallback(() => {
    const now = Date.now();
    if (now - lastPlayed.current < COOLDOWN) return;
    lastPlayed.current = now;

    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();

      // Tone 1 — high beep
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(880, ctx.currentTime);
      gain1.gain.setValueAtTime(0.15, ctx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      osc1.connect(gain1).connect(ctx.destination);
      osc1.start(ctx.currentTime);
      osc1.stop(ctx.currentTime + 0.15);

      // Tone 2 — higher beep (delayed)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1100, ctx.currentTime + 0.18);
      gain2.gain.setValueAtTime(0.001, ctx.currentTime);
      gain2.gain.setValueAtTime(0.15, ctx.currentTime + 0.18);
      gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc2.connect(gain2).connect(ctx.destination);
      osc2.start(ctx.currentTime + 0.18);
      osc2.stop(ctx.currentTime + 0.35);

      // Tone 3 — urgent high pitch
      const osc3 = ctx.createOscillator();
      const gain3 = ctx.createGain();
      osc3.type = 'sine';
      osc3.frequency.setValueAtTime(1320, ctx.currentTime + 0.4);
      gain3.gain.setValueAtTime(0.001, ctx.currentTime);
      gain3.gain.setValueAtTime(0.18, ctx.currentTime + 0.4);
      gain3.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
      osc3.connect(gain3).connect(ctx.destination);
      osc3.start(ctx.currentTime + 0.4);
      osc3.stop(ctx.currentTime + 0.6);

      // Clean up
      setTimeout(() => ctx.close(), 1000);
    } catch {
      // AudioContext not available — silent fallback
    }
  }, []);

  return play;
}
