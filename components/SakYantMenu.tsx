
import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, Shield, Zap, Heart, Flame, Lock, CheckCircle2, ArrowUpCircle, Coins, BarChart3, ArrowRight, Hammer, Info, Puzzle, Book } from 'lucide-react';
import { SAK_YANT_DB, GAME_ECONOMY } from '../constants';
import { PlayerInventory, SakYantType } from '../types';

interface SakYantMenuProps {
  inventory: PlayerInventory;
  currency: number;
  equippedId: SakYantType | null;
  onEquip: (id: SakYantType) => void;
  onUpgrade: (id: SakYantType) => void;
  onReinforce: (id: SakYantType) => void;
  onPreview: (id: SakYantType) => void;
  onBack: () => void;
}

const RadarChart = ({ attributes, color }: { attributes: any, color: string }) => {
    // scale 0-10 to points on a 100x100 grid
    const max = 10;
    const r = 35;
    const c = 50;
    
    // Order: Strength (Top), Agility (Right), Magic (Bottom), Endurance (Left)
    const pointsData = [
        { val: attributes.strength, angle: -Math.PI/2, label: 'STR' },
        { val: attributes.agility, angle: 0, label: 'AGI' },
        { val: attributes.magic, angle: Math.PI/2, label: 'MAG' },
        { val: attributes.endurance, angle: Math.PI, label: 'END' }
    ];

    const pointsStr = pointsData.map(p => {
        const dist = (p.val / max) * r;
        return `${c + Math.cos(p.angle) * dist},${c + Math.sin(p.angle) * dist}`;
    }).join(" ");

    const bgPoints = pointsData.map(p => `${c + Math.cos(p.angle) * r},${c + Math.sin(p.angle) * r}`).join(" ");
    const midPoints = pointsData.map(p => `${c + Math.cos(p.angle) * (r/2)},${c + Math.sin(p.angle) * (r/2)}`).join(" ");

    return (
        <div className="relative w-full h-32 sm:h-40 mx-auto flex items-center justify-center">
            <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-2xl overflow-visible">
                 <defs>
                    <radialGradient id="radarGradient" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
                        <stop offset="0%" stopColor={color} stopOpacity="0.3" />
                        <stop offset="100%" stopColor={color} stopOpacity="0.05" />
                    </radialGradient>
                 </defs>

                 {/* Background Grid */}
                 <circle cx="50" cy="50" r={r} fill="none" stroke="#374151" strokeWidth="0.5" opacity="0.5" />
                 <circle cx="50" cy="50" r={r/2} fill="none" stroke="#374151" strokeWidth="0.5" opacity="0.3" />
                 <polygon points={bgPoints} fill="#1f2937" fillOpacity="0.5" stroke="#374151" strokeWidth="1" />
                 <polygon points={midPoints} fill="none" stroke="#374151" strokeWidth="0.5" strokeDasharray="2 2" />
                 
                 {/* Axes */}
                 <line x1="50" y1={50-r} x2="50" y2={50+r} stroke="#374151" strokeWidth="0.5" />
                 <line x1={50-r} y1="50" x2={50+r} y2="50" stroke="#374151" strokeWidth="0.5" />

                 {/* Labels */}
                 <text x="50" y="8" fill="#ef4444" fontSize="6" textAnchor="middle" fontWeight="bold">STR</text>
                 <text x="92" y="52" fill="#eab308" fontSize="6" textAnchor="start" fontWeight="bold" dy="0">AGI</text>
                 <text x="50" y="92" fill="#a855f7" fontSize="6" textAnchor="middle" fontWeight="bold">MAG</text>
                 <text x="8" y="52" fill="#3b82f6" fontSize="6" textAnchor="end" fontWeight="bold" dy="0">END</text>

                 {/* Data Shape */}
                 <polygon points={pointsStr} fill="url(#radarGradient)" stroke={color} strokeWidth="2" strokeLinejoin="round" />
                 
                 {/* Data Points */}
                 {pointsData.map((p, i) => {
                     const dist = (p.val / max) * r;
                     const x = c + Math.cos(p.angle) * dist;
                     const y = c + Math.sin(p.angle) * dist;
                     return <circle key={i} cx={x} cy={y} r="1.5" fill="white" stroke={color} strokeWidth="0.5" />
                 })}
            </svg>
        </div>
    )
}

const SakYantMenu: React.FC<SakYantMenuProps> = ({ inventory, currency, equippedId, onEquip, onUpgrade, onReinforce, onPreview, onBack }) => {
  const [selectedId, setSelectedId] = useState<SakYantType>(equippedId || SakYantType.HANUMAN);
  
  // Trigger preview update whenever selection changes
  useEffect(() => {
    onPreview(selectedId);
  }, [selectedId, onPreview]);

  const renderStars = (level: number) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className={`w-1 h-1 rounded-full transition-all duration-300 ${i <= level ? 'bg-yellow-500 shadow-[0_0_4px_rgba(234,179,8,0.8)]' : 'bg-gray-800'}`}
          />
        ))}
      </div>
    );
  };

  const getIcon = (type: SakYantType) => {
    switch (type) {
      case SakYantType.HANUMAN: return <Zap className="w-6 h-6" />;
      case SakYantType.GAO_YORD: return <Shield className="w-6 h-6" />;
      case SakYantType.TWIN_TIGER: return <Flame className="w-6 h-6" />;
      case SakYantType.NAGA: return <Heart className="w-6 h-6" />;
      default: return <Shield />;
    }
  };

  const selectedYant = SAK_YANT_DB[selectedId];
  const userLevel = inventory.unlockedYants[selectedId] || 0;
  const isLocked = userLevel === 0;
  
  const maxLevel = 5;
  const nextLevel = userLevel + 1;
  const canUpgrade = nextLevel <= maxLevel;
  const displayLevelData = isLocked ? null : selectedYant.levels[userLevel];
  const nextLevelData = canUpgrade ? selectedYant.levels[nextLevel] : null;

  const upgradeCost = nextLevelData?.upgradeCost || 0;
  const piecesRequired = nextLevelData?.piecesRequired || 0;
  const currentPieces = inventory.sakYantPieces?.[selectedId] || 0;

  const hasEnoughCurrencyForUpgrade = currency >= upgradeCost;
  const hasEnoughPieces = currentPieces >= piecesRequired;
  const canPerformUpgrade = hasEnoughCurrencyForUpgrade && hasEnoughPieces;

  const durabilityLevel = inventory.durabilityLevels?.[selectedId] || 0;
  const reinforceCost = GAME_ECONOMY.REINFORCE_BASE_COST + (durabilityLevel * 50);
  const reinforceBonus = GAME_ECONOMY.REINFORCE_INTEGRITY_BONUS;
  const hasEnoughCurrencyForReinforce = currency >= reinforceCost;
  
  const currentTotalIntegrity = displayLevelData ? displayLevelData.maxIntegrity + (durabilityLevel * reinforceBonus) : 0;
  const nextTotalIntegrity = nextLevelData ? nextLevelData.maxIntegrity + (durabilityLevel * reinforceBonus) : 0;

  return (
    <div className="absolute inset-0 bg-transparent z-50 flex flex-col pt-[env(safe-area-inset-top)] text-white overflow-hidden font-sans">
      
      {/* 
          Main Layout: 
          Left 50% = Transparent (Shows 3D Character)
          Right 50% = UI Panel 
      */}
      <div className="flex-1 flex flex-row">
        
        {/* Transparent Left Side */}
        <div className="w-0 md:w-1/2 h-full hidden md:block" />

        {/* Right Side UI Panel */}
        <div className="w-full md:w-1/2 h-full bg-black/90 backdrop-blur-md border-l border-gray-800 flex flex-col shadow-2xl">
            
            {/* Header */}
            <div className="p-3 md:p-4 border-b border-gray-800 flex items-center justify-between bg-black/50 z-10 shrink-0">
                <button onClick={onBack} className="p-2 hover:bg-gray-800 rounded-full transition-colors group">
                    <ChevronLeft className="w-6 h-6 group-hover:text-yellow-500 transition-colors" />
                </button>
                <h2 className="text-xl font-bold text-yellow-500 tracking-wider flex items-center gap-2">
                    <Book size={20} /> SAK YANT ALTAR
                </h2>
                <div className="flex items-center gap-2 bg-gray-900 px-3 py-1 rounded-full border border-gray-700">
                    <Coins size={14} className="text-yellow-500" />
                    <span className="font-mono text-xs font-bold text-yellow-400">{currency.toLocaleString()}</span>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 custom-scrollbar">
                
                {/* 1. SELECTION GRID */}
                <div>
                     <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Select Scroll</h3>
                     <div className="grid grid-cols-4 gap-2">
                        {Object.values(SAK_YANT_DB).map((yant) => {
                            const level = inventory.unlockedYants[yant.id];
                            const locked = level === 0;
                            const isSelected = selectedId === yant.id;
                            const isEquipped = equippedId === yant.id;
                            const collected = inventory.sakYantPieces?.[yant.id] || 0;

                            return (
                                <button
                                    key={yant.id}
                                    onClick={() => setSelectedId(yant.id)}
                                    className={`
                                        relative p-2 rounded-lg border-2 transition-all duration-200 text-center group flex flex-col items-center
                                        ${isSelected ? 'bg-gray-800 border-yellow-500 scale-[1.02]' : 'bg-gray-900 border-gray-700 hover:border-gray-500'}
                                        ${locked ? 'opacity-70' : 'opacity-100'}
                                    `}
                                >
                                    <div 
                                        className="w-8 h-8 md:w-10 md:h-10 rounded-full mb-1 flex items-center justify-center relative overflow-hidden"
                                        style={{ backgroundColor: isSelected && !locked ? yant.color : '#374151' }}
                                    >
                                        <div style={{ color: isSelected && !locked ? 'black' : (locked ? '#6b7280' : yant.color) }}>
                                            {getIcon(yant.id)}
                                        </div>
                                    </div>
                                    
                                    <div className="text-[9px] md:text-[10px] font-bold truncate w-full text-gray-300">{yant.name}</div>
                                    
                                    {!locked && <div className="mt-1">{renderStars(level)}</div>}
                                    {locked && (
                                        <div className="mt-1 flex items-center gap-0.5 text-[8px] text-gray-500">
                                            <Puzzle size={8} /> {collected}
                                        </div>
                                    )}

                                    {isEquipped && (
                                        <div className="absolute top-1 right-1">
                                            <CheckCircle2 className="w-3 h-3 text-green-500" />
                                        </div>
                                    )}
                                    {locked && !isEquipped && (
                                        <div className="absolute top-1 right-1">
                                            <Lock className="w-3 h-3 text-gray-500" />
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                     </div>
                </div>

                <div className="h-px bg-gray-800 w-full" />

                {/* 2. DETAILS PANEL */}
                <div className="flex-1 flex flex-col">
                    <div className="flex items-end justify-between mb-4">
                        <div>
                             <h1 className="text-3xl font-black uppercase italic tracking-tighter leading-none" style={{ color: isLocked ? '#9ca3af' : 'white' }}>
                                 {selectedYant.name}
                             </h1>
                             <p className="text-sm text-gray-400 font-serif">{selectedYant.khmerName}</p>
                        </div>
                        {!isLocked && (
                             <div className="bg-gray-800 px-3 py-1 rounded text-right">
                                 <span className="text-[10px] uppercase text-gray-500 font-bold block">Level</span>
                                 <span className="text-2xl font-black leading-none" style={{ color: selectedYant.color }}>{userLevel}</span>
                             </div>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                        {/* Radar Chart */}
                        <div className="bg-gray-900/50 p-2 rounded-lg border border-gray-700">
                             <RadarChart attributes={selectedYant.attributes} color={selectedYant.color} />
                        </div>

                        {/* Text Details */}
                        <div className="bg-gray-900/50 p-3 rounded-lg border border-gray-700 flex flex-col">
                             <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-1">
                                <Info size={10} /> Effect
                             </h4>
                             {displayLevelData ? (
                                 <>
                                     <div className="mb-2">
                                         <div className="flex justify-between items-center mb-1">
                                            <span className="text-[10px] text-gray-400 uppercase">Current Lvl {userLevel}</span>
                                            {nextLevelData && (
                                                <span className="text-[10px] text-green-400 uppercase flex items-center gap-1">
                                                    Next Lvl {nextLevel} <ArrowUpCircle size={10} />
                                                </span>
                                            )}
                                         </div>
                                         <p className="text-xs text-white leading-relaxed font-medium">{displayLevelData.description}</p>
                                         {nextLevelData && (
                                            <p className="text-xs text-green-300 leading-relaxed mt-1 opacity-80">{nextLevelData.description}</p>
                                         )}
                                     </div>

                                     <div className="mt-auto pt-2 border-t border-gray-800">
                                         <div className="flex justify-between text-[10px] text-gray-400 mb-1">
                                             <span>Integrity</span>
                                             <div className="flex items-center gap-2">
                                                 <span className="text-white font-mono">{currentTotalIntegrity}</span>
                                                 {nextLevelData && (
                                                    <span className="text-green-400 font-mono flex items-center gap-1">
                                                        <ArrowRight size={10} /> {nextTotalIntegrity}
                                                    </span>
                                                 )}
                                             </div>
                                         </div>
                                         <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                                             <div className="h-full" style={{ width: '100%', backgroundColor: selectedYant.color }}></div>
                                         </div>
                                     </div>
                                 </>
                             ) : (
                                 <div className="flex-1 flex flex-col items-center justify-center text-center text-gray-600">
                                     <Lock size={20} className="mb-2 opacity-50" />
                                     <span className="text-[10px]">Unlock to view effects</span>
                                 </div>
                             )}
                        </div>
                    </div>

                    {/* 3. ACTIONS */}
                    <div className="mt-auto space-y-3">
                         <div className="flex gap-3">
                             {/* Primary Upgrade / Unlock */}
                             <button 
                                onClick={() => onUpgrade(selectedId)}
                                disabled={!canUpgrade || !canPerformUpgrade}
                                className={`
                                    flex-1 relative h-16 rounded-xl font-bold border flex items-center justify-between px-3 transition-all active:scale-[0.98] group
                                    ${canUpgrade 
                                        ? (canPerformUpgrade 
                                            ? (isLocked 
                                                ? 'bg-gradient-to-r from-yellow-700 to-yellow-600 border-yellow-500/50 text-white hover:to-yellow-500 shadow-yellow-900/50 shadow-lg' // Gold for Unlock
                                                : 'bg-blue-900/20 border-blue-500/50 text-blue-100 hover:bg-blue-900/40') // Blue for Upgrade
                                            : 'bg-gray-800/20 border-gray-700 text-gray-500 cursor-not-allowed opacity-60')
                                        : 'bg-green-900/10 border-green-500/30 text-green-500 cursor-default'}
                                `}
                             >
                                 {!canUpgrade ? (
                                     <div className="w-full flex items-center justify-center gap-2">
                                         <CheckCircle2 size={20} /> MAX LEVEL
                                     </div>
                                 ) : (
                                     <>
                                         <div className="flex items-center gap-3">
                                             <div className={`p-2 rounded-full ${canPerformUpgrade ? 'bg-black/30 text-white' : 'bg-gray-700'}`}>
                                                 {isLocked ? <Lock size={16} className={canPerformUpgrade ? "animate-pulse text-yellow-300" : ""} /> : <ArrowUpCircle size={16} />}
                                             </div>
                                             <div className="flex flex-col items-start">
                                                 <span className="text-sm font-black tracking-wide">{isLocked ? "UNLOCK SCROLL" : "UPGRADE"}</span>
                                                 <span className="text-[10px] opacity-80 font-medium">Lvl {nextLevel}</span>
                                             </div>
                                         </div>
                                         <div className="flex flex-col items-end gap-0.5">
                                             <div className={`flex items-center gap-1 ${hasEnoughCurrencyForUpgrade ? 'text-white' : 'text-red-400'}`}>
                                                 <Coins size={12} className={isLocked ? "text-yellow-200" : "text-yellow-400"} /> {upgradeCost}
                                             </div>
                                             <div className={`flex items-center gap-1 ${hasEnoughPieces ? 'text-white' : 'text-red-400'}`}>
                                                 <Puzzle size={12} className={isLocked ? "text-blue-200" : "text-blue-300"} /> {currentPieces}/{piecesRequired}
                                             </div>
                                         </div>
                                     </>
                                 )}
                             </button>
                             
                             {/* Secondary Reinforce */}
                             {!isLocked && (
                                <button 
                                    onClick={() => onReinforce(selectedId)}
                                    disabled={!hasEnoughCurrencyForReinforce}
                                    className={`
                                        w-1/3 h-16 rounded-xl font-bold border flex flex-col items-center justify-center transition-all active:scale-[0.98]
                                        ${hasEnoughCurrencyForReinforce 
                                            ? 'bg-green-900/20 border-green-500/50 text-green-100 hover:bg-green-900/40' 
                                            : 'bg-gray-800/20 border-gray-700 text-gray-500 cursor-not-allowed opacity-60'}
                                    `}
                                >
                                    <div className="flex items-center gap-1 text-xs mb-0.5">
                                        <Hammer size={12} /> REINFORCE
                                    </div>
                                    <div className={`flex items-center gap-1 text-sm ${hasEnoughCurrencyForReinforce ? 'text-yellow-400' : 'text-red-400'}`}>
                                        <Coins size={12} /> {reinforceCost}
                                    </div>
                                </button>
                             )}
                         </div>

                         {/* Equip Button */}
                         {isLocked ? (
                             <div className="w-full py-3 bg-gray-900 rounded-lg border border-dashed border-gray-800 text-center text-xs text-gray-500 italic">
                                 Unlock via Fragments from Adventure Mode.
                             </div>
                         ) : equippedId === selectedId ? (
                             <button disabled className="w-full py-3 bg-green-900/20 text-green-500 font-bold uppercase tracking-widest rounded-lg border border-green-700/30 flex items-center justify-center gap-2 cursor-default">
                                 <CheckCircle2 size={16} /> EQUIPPED
                             </button>
                         ) : (
                             <button 
                                 onClick={() => onEquip(selectedId)}
                                 className="w-full py-3 bg-white hover:bg-gray-100 text-black font-black uppercase tracking-widest rounded-lg shadow-lg flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
                             >
                                 EQUIP SCROLL
                             </button>
                         )}
                    </div>
                </div>
            </div>
        </div>
      </div>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #111827;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #374151;
          border-radius: 2px;
        }
      `}</style>
    </div>
  );
};

export default SakYantMenu;
