
import React, { useState, useEffect } from 'react';
import { Check, Sparkles } from 'lucide-react';
import { LootReward } from '../types';
import { SAK_YANT_DB } from '../constants';

interface TreasureBoxOverlayProps {
    reward: LootReward;
    onClaim: () => void;
}

// Custom SVG Chest Component for animation control
const TreasureChest = ({ isOpen }: { isOpen: boolean }) => {
    return (
        <div className="relative w-56 h-56 drop-shadow-2xl">
            <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
                <defs>
                    {/* Ancient Sandstone Gradient */}
                    <linearGradient id="sandstoneGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#d6c0a6" /> {/* Light Beige */}
                        <stop offset="30%" stopColor="#c2a88d" />
                        <stop offset="60%" stopColor="#a89078" />
                        <stop offset="100%" stopColor="#8c7562" /> {/* Darker Stone */}
                    </linearGradient>
                    
                    {/* Mossy Stone Texture for base */}
                    <linearGradient id="mossyStoneGradient" x1="0%" y1="100%" x2="0%" y2="0%">
                        <stop offset="0%" stopColor="#5c564b" />
                        <stop offset="100%" stopColor="#8c7a6b" />
                    </linearGradient>

                    {/* Ancient Gold / Bronze */}
                    <linearGradient id="ancientGoldGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#fcd34d" />
                        <stop offset="50%" stopColor="#b45309" />
                        <stop offset="100%" stopColor="#78350f" />
                    </linearGradient>

                    {/* Inner Glow */}
                    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="3" result="blur" />
                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                    
                    {/* Stone Carving Effect */}
                    <filter id="carve" x="-50%" y="-50%" width="200%" height="200%">
                        <feComponentTransfer in="SourceAlpha">
                            <feFuncA type="table" tableValues="1 0" />
                        </feComponentTransfer>
                        <feGaussianBlur stdDeviation="0.5"/>
                        <feOffset dx="0.5" dy="0.5" result="offsetblur"/>
                        <feFlood floodColor="#3f2e20" result="color"/>
                        <feComposite in2="offsetblur" operator="in"/>
                        <feComposite in2="SourceAlpha" operator="in" />
                        <feMerge>
                            <feMergeNode in="SourceGraphic"/>
                            <feMergeNode/>
                        </feMerge>
                    </filter>
                </defs>

                {/* --- BACK OF CHEST (Interior) --- */}
                {/* Dark void inside */}
                <path d="M15 45 L85 45 L85 85 L15 85 Z" fill="#1c1917" />
                
                {/* Interior Treasures (Glow) */}
                <g className={`transition-opacity duration-500 ${isOpen ? 'opacity-100' : 'opacity-0'}`}>
                    <circle cx="50" cy="50" r="25" fill="#fbbf24" filter="url(#glow)" opacity="0.5" />
                    <path d="M50 60 L20 30 L80 30 Z" fill="url(#ancientGoldGradient)" opacity="0.6" />
                    <circle cx="40" cy="55" r="3" fill="#fbbf24" />
                    <circle cx="60" cy="55" r="3" fill="#fbbf24" />
                    <circle cx="50" cy="45" r="4" fill="#fbbf24" />
                </g>

                {/* --- CHEST BASE --- */}
                <g id="base">
                    {/* Main Stone Block */}
                    <rect x="15" y="55" width="70" height="32" rx="1" fill="url(#sandstoneGradient)" stroke="#453830" strokeWidth="0.5" />
                    
                    {/* Bas-Relief Panels (Recessed Carvings) */}
                    <rect x="22" y="60" width="56" height="22" rx="1" fill="none" stroke="#5d4d3e" strokeWidth="1" />
                    <rect x="25" y="63" width="50" height="16" rx="0.5" fill="#b09b86" opacity="0.5" />
                    
                    {/* Carved Floral Pattern (Simplified Kbach) */}
                    <path d="M30 71 Q35 65 40 71 T50 71 T60 71 T70 71" fill="none" stroke="#5d4d3e" strokeWidth="1" opacity="0.6" />
                    
                    {/* Corner Pillars (Angkor Columns) */}
                    <g fill="url(#mossyStoneGradient)" stroke="#3e3228" strokeWidth="0.5">
                        {/* Left Pillar */}
                        <rect x="13" y="55" width="6" height="34" />
                        <rect x="12" y="54" width="8" height="4" /> {/* Capital */}
                        <rect x="12" y="85" width="8" height="4" /> {/* Base */}
                        
                        {/* Right Pillar */}
                        <rect x="81" y="55" width="6" height="34" />
                        <rect x="80" y="54" width="8" height="4" /> {/* Capital */}
                        <rect x="80" y="85" width="8" height="4" /> {/* Base */}
                    </g>
                </g>

                {/* --- CHEST LID (Animated) --- */}
                <g 
                    className={`transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] origin-[15px_55px]`}
                    style={{ transform: isOpen ? 'rotate(-110deg)' : 'rotate(0deg)' }}
                >
                    {/* Main Lid Shape - Curved Temple Roof Style */}
                    <path d="M15 55 Q50 25 85 55 L85 55 L15 55 Z" fill="url(#sandstoneGradient)" stroke="#453830" strokeWidth="1" />
                    
                    {/* Roof Ridges (Tiers) */}
                    <path d="M20 50 Q50 30 80 50" fill="none" stroke="#5d4d3e" strokeWidth="2" opacity="0.5" />
                    <path d="M25 45 Q50 33 75 45" fill="none" stroke="#5d4d3e" strokeWidth="2" opacity="0.5" />
                    
                    {/* Central Ridge Decoration (Naga/Spire Base) */}
                    <path d="M42 32 L50 22 L58 32 L58 55 L42 55 Z" fill="url(#ancientGoldGradient)" stroke="#451a03" strokeWidth="0.5" />
                    
                    {/* Ornate Bands */}
                    <path d="M15 55 Q18 40 22 55" fill="url(#ancientGoldGradient)" stroke="#451a03" strokeWidth="0.5" />
                    <path d="M78 55 Q82 40 85 55" fill="url(#ancientGoldGradient)" stroke="#451a03" strokeWidth="0.5" />
                    
                    {/* Lock / Lotus Motif */}
                    <circle cx="50" cy="55" r="6" fill="url(#ancientGoldGradient)" stroke="#451a03" strokeWidth="1" />
                    <circle cx="50" cy="55" r="3" fill="#1c1917" />
                </g>
            </svg>
        </div>
    );
};

const TreasureBoxOverlay: React.FC<TreasureBoxOverlayProps> = ({ reward, onClaim }) => {
    const [step, setStep] = useState<'closed' | 'shaking' | 'open'>('closed');
    const [showReward, setShowReward] = useState(false);

    useEffect(() => {
        // Auto start sequence
        const shakeTimer = setTimeout(() => setStep('shaking'), 500);
        const openTimer = setTimeout(() => {
            setStep('open');
            setTimeout(() => setShowReward(true), 600);
        }, 2000); // Shake for 1.5s then open

        return () => {
            clearTimeout(shakeTimer);
            clearTimeout(openTimer);
        };
    }, []);

    const yantData = SAK_YANT_DB[reward.type];

    return (
        <div className="absolute inset-0 z-[100] bg-black/90 flex flex-col items-center justify-center p-4">
            
            <div className="relative flex items-center justify-center">
                {/* God Rays / Light Burst */}
                {step === 'open' && (
                    <>
                        <div className="absolute inset-0 bg-yellow-500/20 blur-[80px] animate-pulse scale-150" />
                        <div className="absolute w-[800px] h-[800px] bg-[conic-gradient(from_0deg,transparent_0deg,rgba(252,211,77,0.2)_20deg,transparent_40deg,rgba(252,211,77,0.2)_60deg,transparent_80deg,rgba(252,211,77,0.2)_100deg,transparent_120deg)] animate-[spin_10s_linear_infinite] opacity-40" />
                    </>
                )}

                <div 
                    className={`
                        relative z-10 cursor-pointer transition-transform
                        ${step === 'shaking' ? 'animate-[shake_0.5s_ease-in-out_infinite]' : ''}
                        ${step === 'open' ? 'scale-110 drop-shadow-[0_0_50px_rgba(234,179,8,0.3)]' : ''}
                    `}
                    onClick={() => {
                        if (step === 'closed') setStep('shaking');
                    }}
                >
                     <TreasureChest isOpen={step === 'open'} />
                     
                     {/* Burst particles on open */}
                     {step === 'open' && (
                         <div className="absolute top-10 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-in zoom-in duration-500">
                             <Sparkles className="w-40 h-40 text-yellow-200 animate-pulse" />
                         </div>
                     )}
                </div>
            </div>

            {showReward && (
                <div className="mt-8 flex flex-col items-center animate-in slide-in-from-bottom-8 fade-in duration-700 z-20">
                    <h2 className="text-3xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-200 to-yellow-600 uppercase tracking-widest mb-4 drop-shadow-sm font-serif">
                        Ancient Relic Found
                    </h2>
                    
                    <div className="bg-[#1c1917]/90 border border-[#8c7562] p-6 rounded-sm flex flex-col md:flex-row items-center gap-6 shadow-2xl mb-8 transform hover:scale-105 transition-transform backdrop-blur-md relative overflow-hidden">
                        {/* Decorative Corners */}
                        <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-yellow-500/50"></div>
                        <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-yellow-500/50"></div>
                        <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-yellow-500/50"></div>
                        <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-yellow-500/50"></div>

                        <div className="w-24 h-24 rounded-lg bg-black flex items-center justify-center border border-gray-700 relative overflow-hidden group shadow-inner">
                            <div className="absolute inset-0 opacity-20" style={{ backgroundColor: yantData.color }}></div>
                            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stone.png')] opacity-30 mix-blend-overlay"></div>
                            <span style={{ color: yantData.color }} className="font-black text-6xl select-none drop-shadow-lg">
                                {yantData.name.charAt(0)}
                            </span>
                        </div>
                        <div className="flex flex-col text-center md:text-left">
                            <span className="text-gray-400 text-xs font-bold uppercase tracking-[0.2em] mb-1">Fragment Discovered</span>
                            <span className="text-2xl font-bold text-white mb-2 font-serif" style={{ color: yantData.color }}>
                                {yantData.name} Inscription
                            </span>
                            <div className="flex items-center justify-center md:justify-start gap-2">
                                <div className="bg-[#2a1b12] border border-[#5d4d3e] px-4 py-1 rounded-sm text-yellow-400 font-mono text-xl font-bold shadow-inner">
                                    x{reward.amount}
                                </div>
                            </div>
                        </div>
                    </div>

                    <button 
                        onClick={onClaim}
                        className="bg-gradient-to-r from-yellow-700 to-yellow-600 hover:from-yellow-600 hover:to-yellow-500 text-white border border-yellow-400/30 px-12 py-4 rounded-sm font-bold text-xl tracking-[0.2em] shadow-[0_0_20px_rgba(234,179,8,0.2)] active:scale-95 transition-all flex items-center gap-3"
                    >
                        <Check size={24} /> COLLECT
                    </button>
                </div>
            )}

            <style>{`
                @keyframes shake {
                    0%, 100% { transform: rotate(0deg); }
                    25% { transform: rotate(-2deg) translateX(1px); }
                    75% { transform: rotate(2deg) translateX(-1px); }
                }
            `}</style>
        </div>
    );
};

export default TreasureBoxOverlay;
