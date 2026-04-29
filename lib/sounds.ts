let context: AudioContext | null = null;
let isMuted = false;

export const setMuted = (muted: boolean) => {
    isMuted = muted;
};

const getContext = () => {
    if (!context) {
        context = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (context.state === 'suspended') {
        context.resume();
    }
    return context;
};

const playTone = (frequency: number, type: OscillatorType, duration: number, vol = 0.1) => {
    if (isMuted) return;
    try {
        const ctx = getContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(frequency, ctx.currentTime);
        
        gain.gain.setValueAtTime(vol, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start();
        osc.stop(ctx.currentTime + duration);
    } catch (e) {
        console.error("Audio playback failed:", e);
    }
};

export const playClickSound = () => playTone(800, 'sine', 0.1, 0.05);
export const playUploadSound = () => {
    playTone(400, 'sine', 0.1, 0.05);
    setTimeout(() => playTone(600, 'sine', 0.15, 0.05), 100);
};

export const playShutterSound = () => {
    if (isMuted) return;
    try {
        const ctx = getContext();
        const bufSize = ctx.sampleRate * 0.1;
        const buffer = ctx.createBuffer(1, bufSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        const filter = ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.value = 1000;
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.5, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
        
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        noise.start();
    } catch (e) {
        console.error("Audio playback failed:", e);
    }
};

export const playSuccessSound = () => {
    playTone(440, 'sine', 0.1, 0.05);
    setTimeout(() => playTone(554, 'sine', 0.1, 0.05), 100);
    setTimeout(() => playTone(659, 'sine', 0.2, 0.05), 200);
};

export const playRegenerateSound = () => playTone(500, 'triangle', 0.2, 0.05);
export const playDragStartSound = () => playTone(300, 'sine', 0.1, 0.05);
export const playDragEndSound = () => playTone(250, 'sine', 0.1, 0.05);
