// Chess sound effects using Web Audio API
// No external audio files needed - generates sounds programmatically

let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext {
    if (!audioContext) {
        audioContext = new AudioContext();
    }
    return audioContext;
}

// Resume audio context if suspended (needed for browsers that require user interaction)
export async function resumeAudio(): Promise<void> {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') {
        await ctx.resume();
    }
}

// Play a simple tone with envelope
function playTone(
    frequency: number,
    duration: number,
    type: OscillatorType = 'sine',
    volume: number = 0.3,
    attack: number = 0.01,
    decay: number = 0.1
): void {
    const ctx = getAudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);

    // Envelope: attack -> sustain -> decay
    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(volume, ctx.currentTime + attack);
    gainNode.gain.linearRampToValueAtTime(volume * 0.7, ctx.currentTime + attack + 0.05);
    gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + duration);

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + duration);
}

// Play noise burst (for captures)
function playNoise(duration: number, volume: number = 0.2): void {
    const ctx = getAudioContext();
    const bufferSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    // Generate white noise
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

// Sound effect functions
export const ChessSounds = {
    // Standard piece move - soft wood tap
    move(): void {
        playTone(800, 0.08, 'sine', 0.25);
        setTimeout(() => playTone(600, 0.05, 'sine', 0.15), 20);
    },

    // Capture - more impactful sound
    capture(): void {
        playTone(400, 0.1, 'triangle', 0.35);
        playNoise(0.08, 0.25);
        setTimeout(() => playTone(300, 0.08, 'sine', 0.2), 30);
    },

    // Check - alert tone
    check(): void {
        playTone(880, 0.1, 'sine', 0.3);
        setTimeout(() => playTone(1100, 0.15, 'sine', 0.25), 100);
    },

    // Castling - double tap
    castle(): void {
        playTone(700, 0.08, 'sine', 0.25);
        setTimeout(() => playTone(900, 0.08, 'sine', 0.25), 100);
        setTimeout(() => playTone(700, 0.06, 'sine', 0.2), 200);
    },

    // Game start
    gameStart(): void {
        playTone(523, 0.1, 'sine', 0.2); // C5
        setTimeout(() => playTone(659, 0.1, 'sine', 0.2), 100); // E5
        setTimeout(() => playTone(784, 0.15, 'sine', 0.25), 200); // G5
    },

    // Game end - victory/defeat fanfare
    gameEnd(): void {
        playTone(523, 0.15, 'sine', 0.25); // C5
        setTimeout(() => playTone(659, 0.15, 'sine', 0.25), 150); // E5
        setTimeout(() => playTone(784, 0.15, 'sine', 0.25), 300); // G5
        setTimeout(() => playTone(1047, 0.3, 'sine', 0.3), 450); // C6
    },

    // Illegal move - error buzz
    illegal(): void {
        playTone(200, 0.15, 'sawtooth', 0.2);
        setTimeout(() => playTone(150, 0.15, 'sawtooth', 0.15), 100);
    },

    // Promotion - ascending tone
    promote(): void {
        playTone(400, 0.08, 'sine', 0.25);
        setTimeout(() => playTone(500, 0.08, 'sine', 0.25), 60);
        setTimeout(() => playTone(600, 0.08, 'sine', 0.25), 120);
        setTimeout(() => playTone(800, 0.12, 'sine', 0.3), 180);
    },

    // Draw offer
    drawOffer(): void {
        playTone(600, 0.1, 'sine', 0.2);
        setTimeout(() => playTone(600, 0.1, 'sine', 0.2), 150);
    },

    // Notify (opponent joined, rematch request, etc.)
    notify(): void {
        playTone(700, 0.08, 'sine', 0.2);
        setTimeout(() => playTone(900, 0.12, 'sine', 0.25), 80);
    },

    // Low time warning
    lowTime(): void {
        playTone(1000, 0.05, 'square', 0.15);
    },

    // Time out
    timeout(): void {
        playTone(300, 0.2, 'sawtooth', 0.25);
        setTimeout(() => playTone(200, 0.3, 'sawtooth', 0.2), 150);
    }
};

export type SoundType = keyof typeof ChessSounds;
