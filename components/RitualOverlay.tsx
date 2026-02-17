
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Music, Zap, Flame, Keyboard } from 'lucide-react';

interface RitualOverlayProps {
    onComplete: (score: number) => void;
    bpm: number;
}

type HitType = 'Perfect' | 'Good' | 'Miss';

interface Note {
    id: number;
    key: string; // 'W', 'A', 'S', 'D'
    targetTime: number; // Timestamp when it should be hit
    spawnTime: number;
    angle: number; // Direction it comes from (radians)
    hit: boolean;
    missed: boolean;
    color: string;
}

const KEYS = ['W', 'A', 'S', 'D'];
const KEY_COLORS: Record<string, string> = {
    'W': '#eab308', // Yellow
    'A': '#3b82f6', // Blue
    'S': '#ef4444', // Red
    'D': '#22c55e'  // Green
};

const RitualOverlay: React.FC<RitualOverlayProps> = ({ onComplete, bpm }) => {
    // Game Config
    const RITUAL_DURATION = 15; // seconds
    const TRAVEL_TIME = 1500; // ms for note to travel from edge to center
    const HIT_WINDOW_PERFECT = 100; // ms +/-
    const HIT_WINDOW_GOOD = 250; // ms +/-

    // State
    const [score, setScore] = useState(0);
    const [combo, setCombo] = useState(0);
    const [timeLeft, setTimeLeft] = useState(RITUAL_DURATION);
    const [feedback, setFeedback] = useState<{ type: HitType, text: string, id: number } | null>(null);
    const [renderTrigger, setRenderTrigger] = useState(0); // Force re-render for animation loop

    // Refs for game loop logic (to avoid stale closures)
    const startTimeRef = useRef(Date.now());
    const notesRef = useRef<Note[]>([]);
    const nextSpawnTimeRef = useRef(0);
    const scoreRef = useRef(0);
    const totalNotesSpawnedRef = useRef(0);
    const frameRef = useRef<number>(0);
    const isRunningRef = useRef(true);

    // Initialize Game Loop
    useEffect(() => {
        isRunningRef.current = true; // FIX: Reset to true for StrictMode re-mounts

        const secondsPerBeat = 60 / bpm;
        const msPerBeat = secondsPerBeat * 1000;

        // Initial setup
        startTimeRef.current = Date.now();
        nextSpawnTimeRef.current = startTimeRef.current; // Start spawning immediately

        const gameLoop = () => {
            if (!isRunningRef.current) return;

            const now = Date.now();
            const elapsedSec = (now - startTimeRef.current) / 1000;
            const remaining = Math.max(0, RITUAL_DURATION - elapsedSec);

            setTimeLeft(remaining);

            // 1. End Condition
            if (remaining <= 0) {
                isRunningRef.current = false;
                const finalScore = Math.min(1, scoreRef.current / (totalNotesSpawnedRef.current * 100 || 1));
                onComplete(finalScore);
                return;
            }

            // 2. Spawning Logic
            // We spawn notes ahead of time so they arrive on the beat
            // The "Target Time" is now + TRAVEL_TIME
            // We schedule the next spawn based on BPM
            if (now >= nextSpawnTimeRef.current && elapsedSec < (RITUAL_DURATION - (TRAVEL_TIME / 1000))) {
                spawnNote(now + TRAVEL_TIME);
                nextSpawnTimeRef.current = now + msPerBeat;
            }

            // 3. Update & Prune Notes
            notesRef.current.forEach(note => {
                // Check for Misses (passed target time by too much)
                if (!note.hit && !note.missed && now > note.targetTime + HIT_WINDOW_GOOD) {
                    note.missed = true;
                    handleResult('Miss');
                }
            });

            // Remove old notes to keep array small
            notesRef.current = notesRef.current.filter(n => now < n.targetTime + 1000);

            // Trigger React Render for visual updates
            setRenderTrigger(prev => prev + 1);
            frameRef.current = requestAnimationFrame(gameLoop);
        };

        frameRef.current = requestAnimationFrame(gameLoop);

        // Input Listener
        const handleKeyDown = (e: KeyboardEvent) => {
            const key = e.code.replace('Key', '').toUpperCase();
            if (['W', 'A', 'S', 'D'].includes(key)) {
                processInput(key);
            }
        };

        // Touch Controls mapping
        // We'll expose a function for the UI buttons to call
        (window as any).ritualTouchInput = (key: string) => processInput(key);

        window.addEventListener('keydown', handleKeyDown);

        return () => {
            isRunningRef.current = false;
            cancelAnimationFrame(frameRef.current);
            window.removeEventListener('keydown', handleKeyDown);
            delete (window as any).ritualTouchInput;
        };
    }, [bpm]);

    const spawnNote = (targetTime: number) => {
        const key = KEYS[Math.floor(Math.random() * KEYS.length)];
        // Angle based on key to make it intuitive? 
        // W=Top, A=Left, S=Bottom, D=Right
        let angle = 0;
        switch (key) {
            case 'W': angle = -Math.PI / 2; break; // Up
            case 'D': angle = 0; break; // Right
            case 'S': angle = Math.PI / 2; break; // Down
            case 'A': angle = Math.PI; break; // Left
        }

        const newNote: Note = {
            id: Math.random(),
            key,
            targetTime,
            spawnTime: Date.now(),
            angle,
            hit: false,
            missed: false,
            color: KEY_COLORS[key]
        };

        notesRef.current.push(newNote);
        totalNotesSpawnedRef.current++;
    };

    const processInput = (key: string) => {
        const now = Date.now();

        // Find the closest active note matching the key
        // Must be within the GOOD window
        const hittableNotes = notesRef.current.filter(n =>
            !n.hit &&
            !n.missed &&
            n.key === key &&
            Math.abs(now - n.targetTime) <= HIT_WINDOW_GOOD
        );

        if (hittableNotes.length === 0) {
            // Pressed key but nothing there -> Penalty? 
            // Optional: Break combo if spamming
            return;
        }

        // Sort by closest to target time
        hittableNotes.sort((a, b) => Math.abs(now - a.targetTime) - Math.abs(now - b.targetTime));
        const targetNote = hittableNotes[0];

        const diff = Math.abs(now - targetNote.targetTime);

        targetNote.hit = true;

        if (diff <= HIT_WINDOW_PERFECT) {
            handleResult('Perfect');
        } else {
            handleResult('Good');
        }
    };

    const handleResult = (type: HitType) => {
        let points = 0;
        let text = "";

        switch (type) {
            case 'Perfect':
                points = 100;
                text = "PERFECT!";
                setCombo(c => c + 1);
                break;
            case 'Good':
                points = 50;
                text = "GREAT";
                setCombo(c => c + 1);
                break;
            case 'Miss':
                points = 0;
                text = "MISS";
                setCombo(0);
                break;
        }

        scoreRef.current += points;
        setScore(scoreRef.current);
        setFeedback({ type, text, id: Date.now() });

        // Clear feedback after short delay
        setTimeout(() => {
            setFeedback(prev => (prev && Date.now() - prev.id > 400) ? null : prev);
        }, 500);
    };

    // Calculate progress for UI
    const maxPotentialScore = Math.max(1, totalNotesSpawnedRef.current * 100);
    const progressPercent = Math.min(100, (score / maxPotentialScore) * 100);

    return (
        <div className="absolute inset-0 z-[100] flex flex-col items-center justify-center pointer-events-none select-none overflow-hidden">
            {/* Background Atmosphere */}
            <div className={`absolute inset-0 transition-colors duration-200 ${feedback?.type === 'Miss' ? 'bg-red-900/30' : 'bg-black/60'} backdrop-blur-sm`} />

            {/* Header Stats */}
            <div className="absolute top-16 w-full flex justify-between px-10 items-start">
                <div className="text-left">
                    <h2 className="text-2xl font-black text-white italic tracking-widest uppercase flex items-center gap-2">
                        <Music className="text-yellow-500 animate-pulse" /> RITUAL DANCE
                    </h2>
                    <p className="text-yellow-200/60 text-xs font-bold uppercase tracking-widest">Build favor with the spirits</p>
                </div>
                <div className="text-right">
                    <div className="text-4xl font-black text-white">{score}</div>
                    <div className="text-yellow-500 font-bold text-lg tracking-widest">COMBO {combo}</div>
                </div>
            </div>

            {/* --- RHYTHM GAME AREA --- */}
            <div className="relative w-full h-full flex items-center justify-center">

                {/* 1. Target Circle (Fixed Center) */}
                <div className={`relative w-24 h-24 rounded-full border-4 flex items-center justify-center transition-all duration-100 ${feedback?.type === 'Perfect' ? 'border-yellow-400 scale-110 shadow-[0_0_30px_#facc15]' :
                    feedback?.type === 'Good' ? 'border-blue-400 scale-105 shadow-[0_0_20px_#60a5fa]' :
                        feedback?.type === 'Miss' ? 'border-red-500 scale-90' :
                            'border-white/30'
                    }`}>
                    <div className="w-2 h-2 bg-white/50 rounded-full" />

                    {/* Feedback Text Center */}
                    {feedback && (
                        <div className={`absolute z-20 text-3xl font-black italic animate-[bounce_0.4s_ease-out] whitespace-nowrap ${feedback.type === 'Perfect' ? 'text-yellow-400 drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] scale-150' :
                            feedback.type === 'Good' ? 'text-blue-400 drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]' :
                                'text-red-500 drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] opacity-80'
                            }`}>
                            {feedback.text}
                        </div>
                    )}
                </div>

                {/* 2. Flying Notes */}
                {notesRef.current.map(note => {
                    if (note.hit || note.missed) return null; // Don't render handled notes

                    // Calculate position based on time
                    const now = Date.now();
                    const timeToHit = note.targetTime - now;

                    // Don't render if not yet spawned or passed
                    if (timeToHit > TRAVEL_TIME) return null;

                    // Progress 0 (at edge) to 1 (at center)
                    const progress = 1 - (timeToHit / TRAVEL_TIME);

                    // Radius from center: Responsive based on screen size - ensure visible on mobile
                    const safeScreenRadius = Math.min(window.innerWidth, window.innerHeight) * 0.45;
                    const startRadius = Math.min(350, safeScreenRadius); // Cap at 350 for desktop, shrink for mobile
                    const currentRadius = startRadius * (1 - progress);

                    const x = Math.cos(note.angle) * currentRadius;
                    const y = Math.sin(note.angle) * currentRadius;
                    const scale = 0.5 + (progress * 0.5); // Grow as it gets closer
                    const opacity = Math.min(1, progress * 4); // Fade in

                    return (
                        <div
                            key={note.id}
                            className="absolute flex items-center justify-center w-12 h-12 rounded-full border-2 bg-black/80 font-black text-xl shadow-lg transition-transform"
                            style={{
                                transform: `translate(${x}px, ${y}px) scale(${scale})`,
                                borderColor: note.color,
                                color: note.color,
                                opacity: opacity,
                                zIndex: 10
                            }}
                        >
                            {note.key}
                        </div>
                    );
                })}

                {/* 3. Guide Lines (Optional aesthetics) */}
                <div className="absolute inset-0 pointer-events-none opacity-10">
                    <div className="absolute top-1/2 left-1/2 w-[600px] h-[1px] bg-white -translate-x-1/2 -translate-y-1/2" />
                    <div className="absolute top-1/2 left-1/2 h-[600px] w-[1px] bg-white -translate-x-1/2 -translate-y-1/2" />
                </div>
            </div>

            {/* --- CONTROLS HELPER (Mobile Tap Zones) --- */}
            <div className="absolute bottom-0 w-full h-1/3 flex pointer-events-auto md:hidden">
                {/* Invisible touch zones for mobile */}
                <div className="flex-1 bg-blue-500/10 active:bg-blue-500/30 flex items-center justify-center border-r border-white/10" onTouchStart={() => (window as any).ritualTouchInput('A')}>
                    <span className="text-blue-300 font-bold text-2xl opacity-50">A</span>
                </div>
                <div className="flex-1 flex flex-col">
                    <div className="flex-1 bg-yellow-500/10 active:bg-yellow-500/30 flex items-center justify-center border-b border-white/10" onTouchStart={() => (window as any).ritualTouchInput('W')}>
                        <span className="text-yellow-300 font-bold text-2xl opacity-50">W</span>
                    </div>
                    <div className="flex-1 bg-red-500/10 active:bg-red-500/30 flex items-center justify-center" onTouchStart={() => (window as any).ritualTouchInput('S')}>
                        <span className="text-red-300 font-bold text-2xl opacity-50">S</span>
                    </div>
                </div>
                <div className="flex-1 bg-green-500/10 active:bg-green-500/30 flex items-center justify-center border-l border-white/10" onTouchStart={() => (window as any).ritualTouchInput('D')}>
                    <span className="text-green-300 font-bold text-2xl opacity-50">D</span>
                </div>
            </div>

            {/* Desktop Instruction */}
            <div className="absolute bottom-10 flex flex-col items-center gap-4 w-full px-8 pointer-events-none hidden md:flex">
                <div className="px-6 py-3 bg-black/60 border border-white/20 rounded-xl text-white font-bold flex items-center gap-3 animate-pulse">
                    <Keyboard size={20} className="text-yellow-400" />
                    PRESS KEYS AS THEY HIT THE CENTER
                </div>

                {/* Progress Bar */}
                <div className="w-full max-w-md h-3 bg-gray-900 rounded-full overflow-hidden border border-white/10 shadow-xl relative">
                    <div
                        className={`h-full transition-all duration-300 ${progressPercent >= 80 ? 'bg-gradient-to-r from-yellow-500 to-white animate-pulse' : 'bg-gradient-to-r from-orange-600 to-yellow-400'}`}
                        style={{ width: `${progressPercent}%` }}
                    />
                    <div className="absolute top-0 bottom-0 w-0.5 bg-white left-[80%] opacity-50" />
                </div>
                <div className="w-full max-w-md flex justify-between text-[10px] text-gray-500 font-bold uppercase">
                    <span>Spirit</span>
                    <span className={progressPercent >= 80 ? "text-white animate-pulse" : "text-yellow-500"}>Buff (80%)</span>
                    <span>Max</span>
                </div>
            </div>

            {/* Timer Corner */}
            <div className="absolute bottom-10 right-10 flex flex-col items-end pointer-events-none">
                <span className="text-gray-500 font-bold text-xs uppercase tracking-tighter">Ritual ends in</span>
                <span className={`text-4xl font-black font-mono ${timeLeft <= 3 ? 'text-red-500 animate-pulse' : 'text-white'}`}>{timeLeft.toFixed(1)}s</span>
            </div>
        </div>
    );
};

export default RitualOverlay;
