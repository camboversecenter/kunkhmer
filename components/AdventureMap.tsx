
import React, { useState, useEffect } from 'react';
import { ChevronLeft, Lock, Star, Swords, MapPin, Skull, Trophy, Coins, Info, ArrowRight } from 'lucide-react';
import { ADVENTURE_OPPONENTS, GAME_ECONOMY } from '../constants';

interface AdventureMapProps {
  currentStage: number;
  onSelectLevel: (levelIndex: number) => void;
  onBack: () => void;
}

const AdventureMap: React.FC<AdventureMapProps> = ({ currentStage, onSelectLevel, onBack }) => {
  // Default to showing the current stage (or the last one if completed)
  const [selectedStageIndex, setSelectedStageIndex] = useState(
      Math.min(currentStage, ADVENTURE_OPPONENTS.length - 1)
  );

  // Calculate stats for the preview panel
  const selectedOpponent = ADVENTURE_OPPONENTS[selectedStageIndex];
  const isSelectedLocked = selectedStageIndex > currentStage;
  const isSelectedCompleted = selectedStageIndex < currentStage;
  const isSelectedCurrent = selectedStageIndex === currentStage;

  // Calculate estimated rewards
  const difficultyMult = 1.0 + (selectedStageIndex * 0.15); // Matches logic in App.tsx
  const estXP = Math.round(GAME_ECONOMY.BASE_XP * difficultyMult);
  const estCoins = Math.round(GAME_ECONOMY.BASE_CURRENCY * difficultyMult);

  // Auto-scroll to current level on mount (simple implementation)
  useEffect(() => {
      // Logic could be added here to center the scroll view on the specific node
  }, []);

  const renderPaths = () => {
    return ADVENTURE_OPPONENTS.map((opponent, index) => {
      if (index === ADVENTURE_OPPONENTS.length - 1) return null;
      const next = ADVENTURE_OPPONENTS[index + 1];
      const isUnlocked = index < currentStage;

      return (
        <line
          key={`path-${index}`}
          x1={`${opponent.mapPosition?.x}%`}
          y1={`${opponent.mapPosition?.y}%`}
          x2={`${next.mapPosition?.x}%`}
          y2={`${next.mapPosition?.y}%`}
          stroke={isUnlocked ? "#eab308" : "#4b5563"}
          strokeWidth={isUnlocked ? "3" : "2"}
          strokeDasharray={isUnlocked ? "0" : "4,4"}
          className="transition-all duration-1000 opacity-60"
        />
      );
    });
  };

  return (
    <div className="absolute inset-0 bg-gray-900 z-50 flex flex-col pt-[env(safe-area-inset-top)] text-white overflow-hidden font-sans">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-800 flex items-center justify-between bg-black/80 backdrop-blur-md z-30 shadow-md">
        <button onClick={onBack} className="p-2 hover:bg-gray-800 rounded-full transition-colors group">
          <ChevronLeft className="w-6 h-6 text-gray-400 group-hover:text-white" />
        </button>
        <div className="flex flex-col items-center">
             <h2 className="text-lg font-bold text-yellow-500 tracking-widest uppercase">
            ANGKOR WAT
            </h2>
            <span className="text-[10px] text-gray-500 font-bold tracking-widest uppercase">Expedition Map</span>
        </div>
        <div className="w-10"></div> {/* Spacer for alignment */}
      </div>

      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        
        {/* --- MAP AREA --- */}
        <div className="flex-1 relative bg-[#1c130e] overflow-auto custom-scrollbar">
            {/* Map Background */}
            <div className="absolute inset-0 min-w-[600px] min-h-[600px] w-full h-full pointer-events-none opacity-50">
                <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                        <pattern id="stone" patternUnits="userSpaceOnUse" width="100" height="100">
                            <rect width="100" height="100" fill="#2d221a"/>
                            <path d="M0 0 L10 0 L10 10 L0 10 Z" fill="#362920" />
                        </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#stone)" />
                    
                    {/* Simplified Angkor Floor Plan Visualization */}
                    {/* Moat */}
                    <rect x="5%" y="5%" width="90%" height="90%" fill="none" stroke="#172554" strokeWidth="20" opacity="0.4" />
                    {/* Land */}
                    <rect x="15%" y="15%" width="70%" height="70%" fill="none" stroke="#57534e" strokeWidth="2" />
                    <rect x="25%" y="25%" width="50%" height="50%" fill="none" stroke="#78716c" strokeWidth="2" />
                    <rect x="35%" y="10%" width="30%" height="25%" fill="#0c0a09" opacity="0.6" rx="5" />
                    
                    {/* Render Connections */}
                    {renderPaths()}
                </svg>
            </div>

            {/* Interactive Nodes */}
            <div className="absolute inset-0 min-w-[600px] min-h-[600px] w-full h-full">
                {ADVENTURE_OPPONENTS.map((opponent, index) => {
                const isCompleted = index < currentStage;
                const isCurrent = index === currentStage;
                const isLocked = index > currentStage;
                const isSelected = index === selectedStageIndex;
                
                const x = opponent.mapPosition?.x || 50;
                const y = opponent.mapPosition?.y || 50;

                return (
                    <div 
                        key={index}
                        className="absolute transform -translate-x-1/2 -translate-y-1/2 group z-10 cursor-pointer"
                        style={{ left: `${x}%`, top: `${y}%` }}
                        onClick={() => setSelectedStageIndex(index)}
                    >
                        {/* Selection Halo */}
                        {isSelected && (
                            <div className="absolute inset-0 bg-yellow-500/30 rounded-full scale-[2.5] animate-pulse pointer-events-none" />
                        )}

                        <button
                            className={`
                                relative w-12 h-12 rounded-full border-4 flex items-center justify-center transition-all duration-300 shadow-xl
                                ${isSelected ? 'scale-125 z-20 shadow-yellow-500/50' : 'scale-100 z-10'}
                                ${isCurrent ? 'bg-red-700 border-red-500' : ''}
                                ${isCompleted ? 'bg-yellow-700 border-yellow-500' : ''}
                                ${isLocked ? 'bg-gray-800 border-gray-600' : ''}
                            `}
                        >
                            {isCompleted && <Star className="w-5 h-5 text-yellow-200 fill-current" />}
                            {isCurrent && <Swords className="w-5 h-5 text-white animate-bounce" />}
                            {isLocked && <Lock className="w-4 h-4 text-gray-500" />}
                        </button>
                        
                        {/* Label */}
                        <div className={`
                            absolute whitespace-nowrap px-2 py-1 rounded text-[10px] font-bold border
                            transition-all duration-300 pointer-events-none text-center z-30 mt-2
                            left-1/2 -translate-x-1/2 top-full
                            ${isSelected ? 'bg-yellow-900 border-yellow-600 text-white scale-110' : 'bg-black/60 border-gray-700 text-gray-400'}
                        `}>
                            {index + 1}. {opponent.locationName}
                        </div>
                    </div>
                );
                })}
            </div>
        </div>

        {/* --- MISSION BRIEFING PANEL (Bottom on Mobile, Right on Desktop) --- */}
        <div className="w-full md:w-96 bg-gray-900 border-t md:border-t-0 md:border-l border-gray-800 flex flex-col shadow-2xl z-20 shrink-0">
            {selectedOpponent ? (
                <div className="flex flex-col h-full">
                    {/* Panel Header */}
                    <div className="p-4 md:p-6 bg-black/20">
                         <div className="flex items-center justify-between mb-2">
                             <span className={`text-xs font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                                 isSelectedCurrent ? 'bg-red-900 text-red-200' :
                                 isSelectedCompleted ? 'bg-green-900 text-green-200' :
                                 'bg-gray-800 text-gray-500'
                             }`}>
                                 {isSelectedCurrent ? "Current Target" : isSelectedCompleted ? "Completed" : "Locked"}
                             </span>
                             <span className="text-gray-500 font-mono text-xs">Stage {selectedStageIndex + 1}/15</span>
                         </div>
                         <h1 className="text-2xl md:text-3xl font-black text-white uppercase italic tracking-tight mb-1">
                             {selectedOpponent.name}
                         </h1>
                         <div className="flex items-center gap-2 text-gray-400 text-sm">
                             <MapPin size={14} />
                             <span>{selectedOpponent.locationName}</span>
                         </div>
                    </div>

                    {/* Stats & Description */}
                    <div className="flex-1 p-4 md:p-6 overflow-y-auto space-y-6">
                        <div className="space-y-2">
                            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                <Info size={12} /> Intel
                            </h3>
                            <p className="text-sm text-gray-300 leading-relaxed italic border-l-2 border-gray-700 pl-3">
                                "{selectedOpponent.description || "A formidable warrior blocking your path."}"
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-gray-800/50 p-3 rounded border border-gray-700">
                                <div className="text-[10px] text-gray-500 uppercase font-bold mb-1">Health</div>
                                <div className="text-lg font-bold text-green-400 flex items-center gap-2">
                                    {selectedOpponent.maxHealth} <span className="text-xs text-gray-600 font-normal">HP</span>
                                </div>
                            </div>
                            <div className="bg-gray-800/50 p-3 rounded border border-gray-700">
                                <div className="text-[10px] text-gray-500 uppercase font-bold mb-1">Difficulty</div>
                                <div className="flex items-center gap-1">
                                    {[...Array(3)].map((_, i) => (
                                        <Skull key={i} size={16} className={i <= Math.floor(selectedStageIndex / 5) ? "text-red-500" : "text-gray-700"} />
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Rewards Preview */}
                        <div>
                             <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                                <Trophy size={12} /> Potential Rewards
                            </h3>
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2 text-yellow-500 font-bold bg-yellow-900/10 px-3 py-1.5 rounded border border-yellow-500/20">
                                    <Coins size={16} /> +{estCoins}
                                </div>
                                <div className="flex items-center gap-2 text-blue-400 font-bold bg-blue-900/10 px-3 py-1.5 rounded border border-blue-500/20">
                                    <Star size={16} /> +{estXP} XP
                                </div>
                            </div>
                            {(selectedStageIndex + 1) % 5 === 0 && (
                                <div className="mt-2 text-xs text-purple-400 flex items-center gap-1">
                                    <Sparkles size={12} /> High chance for Sak Yant Fragments
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Action Button Area */}
                    <div className="p-4 md:p-6 border-t border-gray-800 bg-black/40">
                         {isSelectedLocked ? (
                             <button disabled className="w-full py-4 bg-gray-800 text-gray-500 font-bold rounded-xl border border-gray-700 flex items-center justify-center gap-2 cursor-not-allowed">
                                 <Lock size={18} /> TARGET LOCKED
                             </button>
                         ) : (
                             <button 
                                onClick={() => onSelectLevel(selectedStageIndex)}
                                className={`
                                    w-full py-4 rounded-xl font-black text-lg tracking-widest flex items-center justify-center gap-3 shadow-lg transition-all transform active:scale-95
                                    ${isSelectedCurrent 
                                        ? 'bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white shadow-red-900/50' 
                                        : 'bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-600'}
                                `}
                             >
                                 {isSelectedCurrent ? (
                                     <>FIGHT NOW <Swords size={20} className="animate-pulse" /></>
                                 ) : (
                                     <>REPLAY STAGE <ArrowRight size={20} /></>
                                 )}
                             </button>
                         )}
                    </div>
                </div>
            ) : (
                <div className="flex-1 flex items-center justify-center text-gray-500 flex-col gap-2 p-10 text-center">
                    <MapPin size={40} className="opacity-20" />
                    <p>Select a location on the map to view mission details.</p>
                </div>
            )}
        </div>

      </div>
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 0px; height: 0px; }
      `}</style>
    </div>
  );
};

// Helper for icon (used in rewards)
const Sparkles = ({ size, className }: { size: number, className?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
    </svg>
);

export default AdventureMap;
