
import React, { useState, useEffect } from 'react';
import { ChevronLeft, Zap, Shield, Swords, Activity, User, Lock, CheckCircle2, Heart, BarChart3 } from 'lucide-react';
import { HEROES_DB, GAME_ECONOMY } from '../constants';
import { HeroId, PlayerInventory } from '../types';

interface CharacterSelectProps {
  inventory: PlayerInventory;
  equippedHeroId: HeroId;
  onEquip: (heroId: HeroId) => void;
  onPreview: (heroId: HeroId) => void;
  onBack: () => void;
}

const CharacterSelect: React.FC<CharacterSelectProps> = ({ inventory, equippedHeroId, onEquip, onPreview, onBack }) => {
  const [activeHero, setActiveHero] = useState<HeroId>(equippedHeroId);
  const hero = HEROES_DB[activeHero];
  const isUnlocked = inventory.unlockedHeroes?.[activeHero] || false;
  const isEquipped = equippedHeroId === activeHero;
  
  // Update parent when selection changes for 3D preview
  useEffect(() => {
    onPreview(activeHero);
  }, [activeHero, onPreview]);

  // Hero Progress Data
  const heroLevel = inventory.heroLevels?.[activeHero] || 1;
  const heroExp = inventory.heroExp?.[activeHero] || 0;
  const maxHeroExp = Math.round(GAME_ECONOMY.HERO_BASE_XP * Math.pow(GAME_ECONOMY.HERO_LEVEL_MULTIPLIER, heroLevel - 1));

  const StatBar = ({ icon: Icon, label, value, color }: { icon: any, label: string; value: number; color: string }) => (
    <div className="flex items-center gap-3 mb-2">
      <div className="w-20 flex items-center gap-1.5 text-xs font-bold text-gray-400 uppercase">
          <Icon size={12} className="text-gray-500" />
          {label}
      </div>
      <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden relative">
        <div 
          className="h-full transition-all duration-500 relative" 
          style={{ width: `${value * 10}%`, backgroundColor: color }}
        >
            {value >= 8 && <div className="absolute inset-0 bg-white/20 animate-pulse"></div>}
        </div>
      </div>
      <span className="text-xs font-mono text-white w-6 text-right font-bold">{value}</span>
    </div>
  );

  return (
    <div className="absolute inset-0 bg-transparent z-50 flex flex-col pt-[env(safe-area-inset-top)] text-white overflow-hidden font-sans">
      {/* 
          Main Layout: 
          Left 50% = Transparent (Shows 3D Hero)
          Right 50% = UI Panel 
      */}
      <div className="flex-1 flex flex-row">
        
        {/* Transparent Left Side for Hero */}
        <div className="w-0 md:w-1/2 h-full hidden md:block" />

        {/* Right Side UI Panel */}
        <div className="w-full md:w-1/2 h-full bg-black/90 backdrop-blur-md border-l border-gray-800 flex flex-col shadow-2xl">
            
            {/* Header */}
            <div className="p-4 border-b border-gray-800 flex items-center justify-between bg-black/50 z-10 shrink-0">
                <button onClick={onBack} className="p-2 hover:bg-gray-800 rounded-full transition-colors group">
                    <ChevronLeft className="w-6 h-6 group-hover:text-yellow-500 transition-colors" />
                </button>
                <h2 className="text-xl font-bold text-yellow-500 tracking-wider flex items-center gap-2">
                    <User size={20} /> HERO ROSTER
                </h2>
                <div className="w-8" />
            </div>

            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
                
                {/* Hero Selection List (Grid) */}
                <div>
                     <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Select Fighter</h3>
                     <div className="grid grid-cols-3 gap-2">
                        {Object.values(HEROES_DB).map((h) => {
                            const locked = !(inventory.unlockedHeroes?.[h.id]);
                            const isActive = activeHero === h.id;
                            
                            return (
                                <button
                                    key={h.id}
                                    onClick={() => setActiveHero(h.id)}
                                    className={`
                                        relative p-2 rounded-lg border-2 transition-all duration-200 text-center group
                                        ${isActive ? 'bg-gray-800 border-yellow-500' : 'bg-gray-900 border-gray-700 hover:border-gray-500'}
                                        ${locked ? 'opacity-60 grayscale' : 'opacity-100'}
                                    `}
                                >
                                    <div 
                                        className="w-8 h-8 md:w-12 md:h-12 rounded-full mx-auto mb-1 flex items-center justify-center font-bold text-lg"
                                        style={{ backgroundColor: locked ? '#374151' : h.color }}
                                    >
                                        {h.name.charAt(0)}
                                    </div>
                                    <div className="text-[10px] md:text-xs font-bold truncate">{h.name}</div>
                                    {equippedHeroId === h.id && (
                                        <div className="absolute top-1 right-1">
                                            <CheckCircle2 className="w-3 h-3 text-green-500" />
                                        </div>
                                    )}
                                    {locked && equippedHeroId !== h.id && (
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

                {/* Hero Details Panel */}
                <div className="flex-1">
                    <div className="text-center mb-4">
                         <h1 className="text-4xl font-black uppercase italic tracking-tighter mb-1" style={{ color: isUnlocked ? hero.color : '#6b7280' }}>
                             {hero.name}
                         </h1>
                         <p className="text-lg text-gray-400 font-serif mb-2">{hero.khmerName}</p>
                         
                         {isUnlocked ? (
                            <div className="flex items-center justify-center gap-4 text-xs font-mono text-gray-500">
                                <span className="bg-gray-800 px-2 py-1 rounded">LVL {heroLevel}</span>
                                <span className="text-purple-400 font-bold">{heroExp}/{maxHeroExp} XP</span>
                            </div>
                         ) : (
                             <div className="inline-block bg-red-900/20 text-red-400 text-xs px-3 py-1 rounded border border-red-500/20">
                                 {hero.unlockDescription}
                             </div>
                         )}
                    </div>

                    {/* Description - Moved above stats for better context */}
                    <div className="text-sm text-gray-300 italic text-center px-4 mb-6 border-b border-gray-800 pb-4">
                        "{hero.description}"
                    </div>

                    <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700 mb-6">
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                             <div>
                                 <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                                    <BarChart3 size={12} /> Base Attributes
                                 </h4>
                                 <StatBar icon={Swords} label="STR" value={hero.attributes.strength} color="#ef4444" />
                                 <StatBar icon={Activity} label="AGI" value={hero.attributes.agility} color="#eab308" />
                                 <StatBar icon={Zap} label="TECH" value={hero.attributes.technique} color="#3b82f6" />
                                 <StatBar icon={Heart} label="VIT" value={hero.attributes.vitality} color="#22c55e" />
                             </div>
                             <div>
                                 <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                                    <Zap size={12} /> Combat Specialty
                                 </h4>
                                 <ul className="space-y-2 text-xs text-gray-300">
                                     {hero.modifiers.kick > 1.1 && <li className="flex gap-2"><Zap size={14} className="text-yellow-400" /> Powerful Kicks</li>}
                                     {hero.modifiers.punch > 1.1 && <li className="flex gap-2"><Swords size={14} className="text-red-400" /> Heavy Punches</li>}
                                     {hero.modifiers.elbow > 1.1 && <li className="flex gap-2"><Swords size={14} className="text-orange-400" /> Deadly Elbows</li>}
                                     {hero.modifiers.knee > 1.1 && <li className="flex gap-2"><Zap size={14} className="text-purple-400" /> Knee Master</li>}
                                     {hero.modifiers.defense < 1.0 && <li className="flex gap-2"><Shield size={14} className="text-green-400" /> Tanky Defense</li>}
                                     {hero.modifiers.speed > 1.0 && <li className="flex gap-2"><Activity size={14} className="text-blue-400" /> High Agility</li>}
                                 </ul>
                             </div>
                         </div>
                    </div>

                    {/* Action Button */}
                    <div className="pb-8">
                         {isUnlocked ? (
                             isEquipped ? (
                                <button disabled className="w-full py-4 bg-gray-800 text-green-500 font-bold uppercase tracking-widest rounded-xl border border-green-500/30 flex items-center justify-center gap-2 cursor-default opacity-80">
                                    <CheckCircle2 size={20} /> EQUIPPED
                                </button>
                             ) : (
                                <button
                                    onClick={() => onEquip(activeHero)}
                                    className="w-full py-4 bg-white hover:bg-gray-100 text-black font-black text-lg uppercase tracking-widest rounded-xl transition-all transform active:scale-95 shadow-lg flex items-center justify-center gap-2"
                                >
                                    SELECT HERO
                                </button>
                             )
                         ) : (
                             <button disabled className="w-full py-4 bg-gray-800 text-gray-600 font-bold uppercase tracking-widest rounded-xl border border-gray-700 flex items-center justify-center gap-2 cursor-not-allowed">
                                 <Lock size={20} /> LOCKED
                             </button>
                         )}
                    </div>

                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default CharacterSelect;
