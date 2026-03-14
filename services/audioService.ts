
// Simple synthetic audio service to avoid external asset dependencies
// Uses Web Audio API to generate retro-arcade style fighting sounds and procedural music

let audioCtx: AudioContext | null = null;
let musicGainNode: GainNode | null = null;
let crowdGainNode: GainNode | null = null;

// --- MUSIC STATE ---
let isMusicPlaying = false;
let isMuted = false;
let nextNoteTime = 0.0;
let beatCount = 0;
let musicTimerID: number | null = null;
let audioFileElement: HTMLAudioElement | null = null;
let usingLocalAudio = false;

// Authentic Sarama settings
let currentBpm = 100; // Starts slow, accelerates
const MAX_BPM = 150;  // Fight intensity peak
// --- MUSIC TRACKS & SCALES ---

const SCALE_TRADITIONAL = {
    F5: 698.46, G5: 783.99, A5: 880.00, C6: 1046.50, D6: 1174.66, F6: 1396.91, G6: 1567.98
};

// Darker, more aggressive scale (C Minor Pentatonicish)
const SCALE_MODERN = {
    C5: 523.25, Eb5: 622.25, F5: 698.46, G5: 783.99, Bb5: 932.33, C6: 1046.50, Eb6: 1244.51
};

const MOTIFS_TRADITIONAL = [
    [SCALE_TRADITIONAL.G5, SCALE_TRADITIONAL.A5, SCALE_TRADITIONAL.C6, SCALE_TRADITIONAL.A5, SCALE_TRADITIONAL.G5, SCALE_TRADITIONAL.F5, SCALE_TRADITIONAL.G5, SCALE_TRADITIONAL.A5],
    [SCALE_TRADITIONAL.C6, SCALE_TRADITIONAL.D6, SCALE_TRADITIONAL.F6, SCALE_TRADITIONAL.D6, SCALE_TRADITIONAL.C6, SCALE_TRADITIONAL.A5, SCALE_TRADITIONAL.C6, SCALE_TRADITIONAL.G5],
    [SCALE_TRADITIONAL.F5, 0, SCALE_TRADITIONAL.F5, SCALE_TRADITIONAL.G5, SCALE_TRADITIONAL.A5, 0, SCALE_TRADITIONAL.G5, SCALE_TRADITIONAL.F5],
    [SCALE_TRADITIONAL.D6, SCALE_TRADITIONAL.C6, SCALE_TRADITIONAL.A5, SCALE_TRADITIONAL.G5, SCALE_TRADITIONAL.F5, SCALE_TRADITIONAL.G5, SCALE_TRADITIONAL.A5, SCALE_TRADITIONAL.C6],
    [SCALE_TRADITIONAL.F6, SCALE_TRADITIONAL.D6, SCALE_TRADITIONAL.F6, SCALE_TRADITIONAL.D6, SCALE_TRADITIONAL.C6, SCALE_TRADITIONAL.A5, SCALE_TRADITIONAL.C6, 0]
];

const MOTIFS_MODERN = [
    // Aggressive, repeating low end
    [SCALE_MODERN.C5, SCALE_MODERN.C5, SCALE_MODERN.Eb5, SCALE_MODERN.C5, SCALE_MODERN.F5, SCALE_MODERN.Eb5, SCALE_MODERN.C5, 0],
    // Rising tension
    [SCALE_MODERN.G5, SCALE_MODERN.Bb5, SCALE_MODERN.C6, SCALE_MODERN.Bb5, SCALE_MODERN.G5, SCALE_MODERN.F5, SCALE_MODERN.Eb5, SCALE_MODERN.F5],
    // High trills
    [SCALE_MODERN.C6, SCALE_MODERN.Eb6, SCALE_MODERN.C6, SCALE_MODERN.Eb6, SCALE_MODERN.C6, 0, SCALE_MODERN.Bb5, SCALE_MODERN.G5],
    // Descent
    [SCALE_MODERN.Eb6, SCALE_MODERN.C6, SCALE_MODERN.Bb5, SCALE_MODERN.G5, SCALE_MODERN.F5, SCALE_MODERN.Eb5, SCALE_MODERN.C5, SCALE_MODERN.Eb5]
];

export enum MusicTheme {
    TRADITIONAL = 'TRADITIONAL',
    MODERN = 'MODERN'
}

let currentTheme = MusicTheme.TRADITIONAL;
let currentMotifIndex = 0;

const getContext = () => {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();

        // Global Music Volume
        musicGainNode = audioCtx.createGain();
        musicGainNode.gain.value = isMuted ? 0 : 0.4;
        musicGainNode.connect(audioCtx.destination);

        // Global Crowd Volume
        crowdGainNode = audioCtx.createGain();
        crowdGainNode.gain.value = isMuted ? 0 : 0.2;
        crowdGainNode.connect(audioCtx.destination);
    }
    return audioCtx;
};

// --- SFX ---
export type SoundType = 'hit' | 'damage' | 'block' | 'miss' | 'move' | 'start' | 'win' | 'lose' | 'heal';

export const playSound = (type: SoundType) => {
    if (isMuted) return;
    const ctx = getContext();
    if (!ctx) return;

    // SFX Master Gain
    const sfxGain = ctx.createGain();
    sfxGain.connect(ctx.destination);
    sfxGain.gain.value = 0.6;

    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(sfxGain);

    switch (type) {
        case 'hit':
            // Punch impact - Sharp, clean
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(150, t);
            osc.frequency.exponentialRampToValueAtTime(40, t + 0.1);
            gain.gain.setValueAtTime(1, t);
            gain.gain.exponentialRampToValueAtTime(0.01, t + 0.15);
            osc.start(t);
            osc.stop(t + 0.15);
            break;

        case 'damage':
            // Body blow - Deeper
            osc.type = 'square';
            osc.frequency.setValueAtTime(100, t);
            osc.frequency.exponentialRampToValueAtTime(20, t + 0.2);
            gain.gain.setValueAtTime(1, t);
            gain.gain.exponentialRampToValueAtTime(0.01, t + 0.25);
            osc.start(t);
            osc.stop(t + 0.25);
            break;

        case 'block':
            // Metallic/Wood clack
            osc.type = 'square';
            osc.frequency.setValueAtTime(500, t);
            osc.frequency.exponentialRampToValueAtTime(100, t + 0.1);
            gain.gain.setValueAtTime(0.5, t);
            gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
            osc.start(t);
            osc.stop(t + 0.1);
            break;

        case 'miss':
            // Swoosh
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(600, t);
            osc.frequency.linearRampToValueAtTime(200, t + 0.15);
            gain.gain.setValueAtTime(0.2, t);
            gain.gain.linearRampToValueAtTime(0.01, t + 0.15);
            osc.start(t);
            osc.stop(t + 0.15);
            break;

        case 'move':
            osc.type = 'sine';
            osc.frequency.setValueAtTime(800, t);
            gain.gain.setValueAtTime(0.1, t);
            gain.gain.exponentialRampToValueAtTime(0.01, t + 0.05);
            osc.start(t);
            osc.stop(t + 0.05);
            break;

        case 'start':
            // Gong
            osc.type = 'sine';
            osc.frequency.setValueAtTime(200, t);
            osc.frequency.exponentialRampToValueAtTime(50, t + 2.5);

            // Harmonics for gong
            const osc2 = ctx.createOscillator();
            const gain2 = ctx.createGain();
            osc2.type = 'square';
            osc2.frequency.setValueAtTime(205, t); // Slight detune
            osc2.connect(gain2);
            gain2.connect(sfxGain);

            gain.gain.setValueAtTime(0.6, t);
            gain.gain.exponentialRampToValueAtTime(0.01, t + 2.5);

            gain2.gain.setValueAtTime(0.2, t);
            gain2.gain.exponentialRampToValueAtTime(0.01, t + 2.0);

            osc.start(t);
            osc.stop(t + 2.5);
            osc2.start(t);
            osc2.stop(t + 2.5);
            break;

        case 'win':
            playNote(ctx, 523.25, t, 0.1, 'square');
            playNote(ctx, 659.25, t + 0.1, 0.1, 'square');
            playNote(ctx, 783.99, t + 0.2, 0.4, 'square');
            break;

        case 'lose':
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(200, t);
            osc.frequency.linearRampToValueAtTime(50, t + 1);
            gain.gain.setValueAtTime(0.3, t);
            gain.gain.linearRampToValueAtTime(0.01, t + 1);
            osc.start(t);
            osc.stop(t + 1);
            break;
            
        case 'heal':
            // Uplifting chime
            playNote(ctx, 523.25, t, 0.1, 'sine');
            playNote(ctx, 659.25, t + 0.05, 0.1, 'sine');
            playNote(ctx, 783.99, t + 0.1, 0.1, 'sine');
            playNote(ctx, 1046.50, t + 0.15, 0.3, 'sine');
            break;
    }
};

const playNote = (ctx: AudioContext, freq: number, time: number, duration: number, type: OscillatorType = 'sine') => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = type;
    osc.frequency.setValueAtTime(freq, time);
    gain.gain.setValueAtTime(0.1, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + duration);

    osc.start(time);
    osc.stop(time + duration);
};

// --- AUTHENTIC SARAMA INSTRUMENTS ---

function playDrum(ctx: AudioContext, time: number, type: 'bass' | 'snare') {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(musicGainNode!);

    if (type === 'bass') {
        // "Skor Thom" - Deep, resonant boom
        osc.type = 'sine';
        osc.frequency.setValueAtTime(60, time);
        osc.frequency.exponentialRampToValueAtTime(40, time + 0.3);

        gain.gain.setValueAtTime(1.5, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + 0.4);

        osc.start(time);
        osc.stop(time + 0.4);

        // Add a little 'thwack'
        const click = ctx.createOscillator();
        const clickGain = ctx.createGain();
        click.connect(clickGain);
        clickGain.connect(musicGainNode!);
        click.type = 'triangle';
        click.frequency.setValueAtTime(120, time);
        click.frequency.exponentialRampToValueAtTime(60, time + 0.05);
        clickGain.gain.setValueAtTime(0.5, time);
        clickGain.gain.exponentialRampToValueAtTime(0.01, time + 0.05);
        click.start(time);
        click.stop(time + 0.05);

    } else {
        // "Skor" High / Snare - Sharp, tight
        const noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 0.1, ctx.sampleRate);
        const data = noiseBuffer.getChannelData(0);
        for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;

        const noise = ctx.createBufferSource();
        noise.buffer = noiseBuffer;

        // Bandpass for "wood" texture
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 1000;
        filter.Q.value = 1;

        const noiseGain = ctx.createGain();
        noise.connect(filter);
        filter.connect(noiseGain);
        noiseGain.connect(musicGainNode!);

        noiseGain.gain.setValueAtTime(0.8, time);
        noiseGain.gain.exponentialRampToValueAtTime(0.01, time + 0.1);
        noise.start(time);
    }
}

function playCymbal(ctx: AudioContext, time: number, type: 'open' | 'closed') {
    const bufferSize = ctx.sampleRate * 0.5;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    // Highpass for metallic shimmer
    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 5000;

    const gain = ctx.createGain();

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(musicGainNode!);

    if (type === 'open') {
        // "Chhing" - Resonant Ring
        gain.gain.setValueAtTime(0.1, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + 0.6);
        noise.start(time);
        noise.stop(time + 0.6);
    } else {
        // "Chap" - Damped Click
        gain.gain.setValueAtTime(0.08, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + 0.05);
        noise.start(time);
        noise.stop(time + 0.05);
    }
}

function playSralai(ctx: AudioContext, time: number, freq: number, duration: number) {
    if (freq <= 0) return;

    // Sralai: Quadruple reed, very loud, nasal, buzzing
    // We layer Sawtooth waves with aggressive filtering

    const osc = ctx.createOscillator();
    const osc2 = ctx.createOscillator(); // Detuned slightly
    const subOsc = ctx.createOscillator(); // Sub harmonic for body
    const masterGain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.value = freq;

    osc2.type = 'sawtooth';
    osc2.frequency.value = freq * 1.003;

    subOsc.type = 'square';
    subOsc.frequency.value = freq * 0.5;

    // Pitch Bending (The "Wail")
    // Start slightly flat and slide up quickly
    osc.frequency.setValueAtTime(freq * 0.9, time);
    osc.frequency.linearRampToValueAtTime(freq, time + 0.15); // Slower slide for more "cry"
    osc2.frequency.setValueAtTime(freq * 0.9 * 1.003, time);
    osc2.frequency.linearRampToValueAtTime(freq * 1.003, time + 0.15);

    // Filter 1: Formant-like Bandpass for "Nasal" tone
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 2200;
    filter.Q.value = 4.0;

    // Filter 2: Lowpass to tame harshness
    const lpFilter = ctx.createBiquadFilter();
    lpFilter.type = 'lowpass';
    lpFilter.frequency.value = 5000;

    // Vibrato
    const vibrato = ctx.createOscillator();
    vibrato.frequency.value = 6.0;
    const vibratoGain = ctx.createGain();
    vibratoGain.gain.value = 15;
    vibrato.connect(vibratoGain);
    vibratoGain.connect(osc.frequency);

    // Connections
    osc.connect(filter);
    osc2.connect(filter);
    // Mix sub osc in with less filtering for body
    subOsc.connect(lpFilter);

    filter.connect(lpFilter);
    lpFilter.connect(masterGain);
    masterGain.connect(musicGainNode!);

    // ADSR Envelope
    masterGain.gain.setValueAtTime(0, time);
    masterGain.gain.linearRampToValueAtTime(0.2, time + 0.08);
    masterGain.gain.setValueAtTime(0.2, time + duration - 0.05);
    masterGain.gain.linearRampToValueAtTime(0, time + duration);

    osc.start(time);
    osc.stop(time + duration);
    osc2.start(time);
    osc2.stop(time + duration);
    subOsc.start(time);
    subOsc.stop(time + duration);

    vibrato.start(time);
    vibrato.stop(time + duration);
}

function scheduler() {
    const ctx = getContext();
    if (!ctx || !isMusicPlaying) return;

    // Dynamic tempo calculation
    const secondsPerBeat = 60.0 / currentBpm;
    const secondsPerStep = secondsPerBeat / 4; // 16th notes

    // Schedule ahead
    while (nextNoteTime < ctx.currentTime + 0.2) {
        scheduleStep(nextNoteTime, secondsPerStep);
        nextNoteTime += secondsPerStep;
    }

    // Accelerate music slightly over time to match fight intensity
    if (currentBpm < MAX_BPM) {
        currentBpm += 0.03;
    }

    musicTimerID = window.setTimeout(scheduler, 50);
}

function scheduleStep(time: number, stepDuration: number) {
    const step = beatCount % 16;

    // --- DRUMS (Skor) ---
    // Driving Pattern
    // Bass (Thom): 0, 3, 6, 10
    // Snare (Touch): 4, 12, 14, 15

    if (step === 0 || step === 6 || step === 10) playDrum(audioCtx!, time, 'bass');
    if (step === 3 && Math.random() > 0.3) playDrum(audioCtx!, time, 'bass'); // Ghost bass

    if (step === 4 || step === 12) playDrum(audioCtx!, time, 'snare'); // Backbeat
    if (step === 14 || step === 15) playDrum(audioCtx!, time, 'snare'); // Fill

    // --- CYMBALS (Chhing) ---
    // Strict alternating Open/Closed on beat
    // 0: Open, 4: Closed, 8: Open, 12: Closed
    if (step === 0 || step === 8) playCymbal(audioCtx!, time, 'open');
    if (step === 4 || step === 12) playCymbal(audioCtx!, time, 'closed');

    // --- MELODY (Sralai) ---
    // Plays more sparsely/legato
    if (step % 2 === 0) {
        const motifSet = currentTheme === MusicTheme.TRADITIONAL ? MOTIFS_TRADITIONAL : MOTIFS_MODERN;

        // Ensure index is safe
        if (currentMotifIndex >= motifSet.length) currentMotifIndex = 0;

        const motif = motifSet[currentMotifIndex];
        const motifNoteIndex = (beatCount / 2) % 8;
        const freq = motif[Math.floor(motifNoteIndex)];

        if (freq > 0) {
            // Overlap notes for continuous sound
            playSralai(audioCtx!, time, freq, stepDuration * 2.5);
        }

        if (motifNoteIndex === 7) {
            // Randomly pick next motif, favoring staying on current one occasionally
            if (Math.random() > 0.3) {
                currentMotifIndex = Math.floor(Math.random() * motifSet.length);
            }
        }
    }

    beatCount++;
}

// --- CROWD NOISE GENERATOR ---

let crowdSource: AudioBufferSourceNode | null = null;

const createPinkNoise = (ctx: AudioContext) => {
    const bufferSize = ctx.sampleRate * 2; // 2 seconds buffer
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let b0, b1, b2, b3, b4, b5, b6;
    b0 = b1 = b2 = b3 = b4 = b5 = b6 = 0.0;
    for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        data[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
        data[i] *= 0.11; // (roughly) compensate for gain
        b6 = white * 0.115926;
    }
    return buffer;
};

const startCrowdAmbience = (ctx: AudioContext) => {
    if (crowdSource) return;

    const buffer = createPinkNoise(ctx);
    crowdSource = ctx.createBufferSource();
    crowdSource.buffer = buffer;
    crowdSource.loop = true;

    // Bandpass filter to simulate distance/mumbling
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 500;
    filter.Q.value = 0.5;

    crowdSource.connect(filter);
    filter.connect(crowdGainNode!);

    crowdSource.start(0);
};

const stopCrowdAmbience = () => {
    if (crowdSource) {
        crowdSource.stop();
        crowdSource.disconnect();
        crowdSource = null;
    }
};

// --- CONTROL ---

export const toggleMute = () => {
    isMuted = !isMuted;
    if (musicGainNode) musicGainNode.gain.value = isMuted ? 0 : 0.4;
    if (crowdGainNode) crowdGainNode.gain.value = isMuted ? 0 : 0.2;

    if (audioFileElement) {
        audioFileElement.volume = isMuted ? 0 : 0.4;
    }

    return isMuted;
}

export const startBackgroundMusic = () => {
    if (isMusicPlaying) return;

    const ctx = getContext();
    if (!ctx) return;

    if (ctx.state === 'suspended') {
        ctx.resume();
    }

    // Start Music
    isMusicPlaying = true;
    currentBpm = 100; // Reset Tempo on start

    // Try to load local audio file first
    if (!audioFileElement) {
        const audio = new Audio('/assets/audio/sarama.mp3');
        audio.loop = true;
        audio.volume = isMuted ? 0 : 0.4;

        // Add error listener to fallback if file is missing
        audio.addEventListener('error', (e) => {
            console.warn("Local audio not found, falling back to synth", e);
            usingLocalAudio = false;
            // Fallback to synth immediately
            beatCount = 0;
            currentMotifIndex = 0;
            nextNoteTime = ctx.currentTime + 0.1;
            scheduler();
        });

        // Add canplay listener to start if valid
        audio.addEventListener('canplaythrough', () => {
            console.log("Using local audio file");
            usingLocalAudio = true;
            if (isMusicPlaying) audio.play().catch(e => console.error("Play failed", e));
        });

        audioFileElement = audio;
        // Trigger load
        audio.load();
    } else if (usingLocalAudio) {
        audioFileElement.currentTime = 0;
        audioFileElement.play().catch(e => console.error("Play failed", e));
    } else {
        // Fallback or synth was already active
        beatCount = 0;
        currentMotifIndex = 0;
        nextNoteTime = ctx.currentTime + 0.1;
        scheduler();
    }

    // Start Crowd
    startCrowdAmbience(ctx);
};

export const stopBackgroundMusic = () => {
    isMusicPlaying = false;

    if (usingLocalAudio && audioFileElement) {
        audioFileElement.pause();
        audioFileElement.currentTime = 0;
    }

    if (musicTimerID) {
        clearTimeout(musicTimerID);
        musicTimerID = null;
    }
    stopCrowdAmbience();
};

export const toggleMusicTheme = () => {
    currentTheme = currentTheme === MusicTheme.TRADITIONAL ? MusicTheme.MODERN : MusicTheme.TRADITIONAL;
    // Reset specific counters for smoother transition
    currentMotifIndex = 0;
    return currentTheme;
};
