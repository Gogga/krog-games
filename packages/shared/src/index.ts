// ==========================================
// KROG Games Platform - Shared Utilities
// ==========================================

// Re-export types for convenience
export * from '@krog/types';

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

/**
 * Debounce a function call
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      fn(...args);
      timeoutId = null;
    }, delay);
  };
}

/**
 * Throttle a function call
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  fn: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}

/**
 * Format time in seconds to MM:SS display
 */
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Generate a random room code
 */
export function generateRoomCode(length = 6): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Sleep for a given duration
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Clamp a number between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

// ==========================================
// ELO RATING CALCULATION
// ==========================================

/**
 * Calculate ELO rating changes after a game
 * @param rating1 - Player 1's current rating
 * @param rating2 - Player 2's current rating
 * @param score1 - Player 1's score (1 = win, 0.5 = draw, 0 = loss)
 * @param K - K-factor (default 32)
 */
export function calculateEloChange(
  rating1: number,
  rating2: number,
  score1: number,
  K: number = 32
): { change1: number; change2: number } {
  const expected1 = 1 / (1 + Math.pow(10, (rating2 - rating1) / 400));
  const expected2 = 1 / (1 + Math.pow(10, (rating1 - rating2) / 400));

  const change1 = Math.round(K * (score1 - expected1));
  const change2 = Math.round(K * ((1 - score1) - expected2));

  return { change1, change2 };
}

// ==========================================
// SOUND EFFECTS (Web Audio API)
// ==========================================

let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (typeof window === 'undefined') {
    throw new Error('Audio context only available in browser');
  }
  if (!audioContext) {
    audioContext = new AudioContext();
  }
  return audioContext;
}

/**
 * Resume audio context if suspended (needed for browsers that require user interaction)
 */
export async function resumeAudio(): Promise<void> {
  if (typeof window === 'undefined') return;
  const ctx = getAudioContext();
  if (ctx.state === 'suspended') {
    await ctx.resume();
  }
}

function playTone(
  frequency: number,
  duration: number,
  type: OscillatorType = 'sine',
  volume: number = 0.3,
  attack: number = 0.01
): void {
  const ctx = getAudioContext();
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);

  gainNode.gain.setValueAtTime(0, ctx.currentTime);
  gainNode.gain.linearRampToValueAtTime(volume, ctx.currentTime + attack);
  gainNode.gain.linearRampToValueAtTime(volume * 0.7, ctx.currentTime + attack + 0.05);
  gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + duration);

  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);

  oscillator.start(ctx.currentTime);
  oscillator.stop(ctx.currentTime + duration);
}

function playNoise(duration: number, volume: number = 0.2): void {
  const ctx = getAudioContext();
  const bufferSize = ctx.sampleRate * duration;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 2);
  }

  const source = ctx.createBufferSource();
  const gainNode = ctx.createGain();
  const filter = ctx.createBiquadFilter();

  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(2000, ctx.currentTime);

  source.buffer = buffer;
  gainNode.gain.setValueAtTime(volume, ctx.currentTime);
  gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + duration);

  source.connect(filter);
  filter.connect(gainNode);
  gainNode.connect(ctx.destination);

  source.start();
}

/**
 * Game sound effects using Web Audio API
 */
export const GameSounds = {
  move(): void {
    playTone(800, 0.08, 'sine', 0.25);
    setTimeout(() => playTone(600, 0.05, 'sine', 0.15), 20);
  },

  capture(): void {
    playTone(400, 0.1, 'triangle', 0.35);
    playNoise(0.08, 0.25);
    setTimeout(() => playTone(300, 0.08, 'sine', 0.2), 30);
  },

  check(): void {
    playTone(880, 0.1, 'sine', 0.3);
    setTimeout(() => playTone(1100, 0.15, 'sine', 0.25), 100);
  },

  castle(): void {
    playTone(700, 0.08, 'sine', 0.25);
    setTimeout(() => playTone(900, 0.08, 'sine', 0.25), 100);
    setTimeout(() => playTone(700, 0.06, 'sine', 0.2), 200);
  },

  gameStart(): void {
    playTone(523, 0.1, 'sine', 0.2);
    setTimeout(() => playTone(659, 0.1, 'sine', 0.2), 100);
    setTimeout(() => playTone(784, 0.15, 'sine', 0.25), 200);
  },

  gameEnd(): void {
    playTone(523, 0.15, 'sine', 0.25);
    setTimeout(() => playTone(659, 0.15, 'sine', 0.25), 150);
    setTimeout(() => playTone(784, 0.15, 'sine', 0.25), 300);
    setTimeout(() => playTone(1047, 0.3, 'sine', 0.3), 450);
  },

  illegal(): void {
    playTone(200, 0.15, 'sawtooth', 0.2);
    setTimeout(() => playTone(150, 0.15, 'sawtooth', 0.15), 100);
  },

  promote(): void {
    playTone(400, 0.08, 'sine', 0.25);
    setTimeout(() => playTone(500, 0.08, 'sine', 0.25), 60);
    setTimeout(() => playTone(600, 0.08, 'sine', 0.25), 120);
    setTimeout(() => playTone(800, 0.12, 'sine', 0.3), 180);
  },

  drawOffer(): void {
    playTone(600, 0.1, 'sine', 0.2);
    setTimeout(() => playTone(600, 0.1, 'sine', 0.2), 150);
  },

  notify(): void {
    playTone(700, 0.08, 'sine', 0.2);
    setTimeout(() => playTone(900, 0.12, 'sine', 0.25), 80);
  },

  lowTime(): void {
    playTone(1000, 0.05, 'square', 0.15);
  },

  timeout(): void {
    playTone(300, 0.2, 'sawtooth', 0.25);
    setTimeout(() => playTone(200, 0.3, 'sawtooth', 0.2), 150);
  }
};

export type SoundType = keyof typeof GameSounds;
