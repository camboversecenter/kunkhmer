import React from 'react';
import { ChevronLeft, Keyboard, Gamepad2, Sword, Zap, Book } from 'lucide-react';
import { SAK_YANT_DB } from '../constants';

interface HowToPlayProps {
    onBack: () => void;
}

const HowToPlay: React.FC<HowToPlayProps> = ({ onBack }) => {
    return (
        <div className="absolute inset-0 bg-gray-900 z-50 flex flex-col pt-[env(safe-area-inset-top)] text-white overflow-hidden">
             {/* Header */}
            <div className="p-4 border-b border-gray-800 flex items-center justify-between bg-black/50">
                   <button onClick={onBack} className="p-2 hover:bg-gray-800 rounded-full"><ChevronLeft /></button>
                   <h2 className="text-xl font-bold text-yellow-500 flex items-center gap-2">MANUAL / HOW TO PLAY</h2>
                   <div className="w-8" />
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-8 max-w-4xl mx-auto w-full">
                
                {/* Introduction */}
                <section>
                    <h3 className="text-2xl font-black text-orange-500 mb-2">WELCOME TO KUN KHMER FIGHT 3D</h3>
                    <p className="text-gray-300">
                        Experience the ancient martial art of Cambodia. Master the art of the eight limbs: Hands, Legs, Elbows, and Knees. 
                        Fight against AI or challenge friends online.
                    </p>
                </section>

                {/* Controls */}
                <section className="grid md:grid-cols-2 gap-6">
                    <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
                        <div className="flex items-center gap-2 mb-4 text-blue-400">
                            <Keyboard size={24} />
                            <h4 className="font-bold text-lg">PC CONTROLS</h4>
                        </div>
                        <ul className="space-y-3">
                            <li className="flex justify-between items-center border-b border-gray-700 pb-2">
                                <span>Move</span> <span className="font-mono bg-gray-900 px-2 py-1 rounded text-yellow-500">W A S D</span>
                            </li>
                            <li className="flex justify-between items-center border-b border-gray-700 pb-2">
                                <span>Punch (Mat)</span> <span className="font-mono bg-gray-900 px-2 py-1 rounded text-yellow-500">U</span>
                            </li>
                            <li className="flex justify-between items-center border-b border-gray-700 pb-2">
                                <span>Kick (Ti)</span> <span className="font-mono bg-gray-900 px-2 py-1 rounded text-yellow-500">I</span>
                            </li>
                            <li className="flex justify-between items-center border-b border-gray-700 pb-2">
                                <span>Elbow (Sok)</span> <span className="font-mono bg-gray-900 px-2 py-1 rounded text-yellow-500">O</span>
                            </li>
                            <li className="flex justify-between items-center border-b border-gray-700 pb-2">
                                <span>Knee (Kumpleang)</span> <span className="font-mono bg-gray-900 px-2 py-1 rounded text-yellow-500">P</span>
                            </li>
                            <li className="flex justify-between items-center pb-2">
                                <span>Block (Rung)</span> <span className="font-mono bg-gray-900 px-2 py-1 rounded text-yellow-500">Space</span>
                            </li>
                        </ul>
                    </div>

                    <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
                        <div className="flex items-center gap-2 mb-4 text-purple-400">
                            <Gamepad2 size={24} />
                            <h4 className="font-bold text-lg">VR CONTROLS</h4>
                        </div>
                        <ul className="space-y-3">
                            <li className="flex justify-between items-center border-b border-gray-700 pb-2">
                                <span>Punch</span> <span className="font-mono bg-gray-900 px-2 py-1 rounded text-yellow-500">Trigger</span>
                            </li>
                            <li className="flex justify-between items-center border-b border-gray-700 pb-2">
                                <span>Kick</span> <span className="font-mono bg-gray-900 px-2 py-1 rounded text-yellow-500">A / X</span>
                            </li>
                            <li className="flex justify-between items-center border-b border-gray-700 pb-2">
                                <span>Elbow</span> <span className="font-mono bg-gray-900 px-2 py-1 rounded text-yellow-500">Thumbstick Click</span>
                            </li>
                            <li className="flex justify-between items-center border-b border-gray-700 pb-2">
                                <span>Knee</span> <span className="font-mono bg-gray-900 px-2 py-1 rounded text-yellow-500">B / Y</span>
                            </li>
                            <li className="flex justify-between items-center pb-2">
                                <span>Block</span> <span className="font-mono bg-gray-900 px-2 py-1 rounded text-yellow-500">Grip</span>
                            </li>
                        </ul>
                    </div>
                </section>

                {/* Combat System */}
                <section>
                    <h4 className="font-bold text-lg text-red-500 mb-4 flex items-center gap-2"><Sword /> COMBAT MECHANICS</h4>
                    <div className="grid md:grid-cols-3 gap-4">
                        <div className="bg-gray-800/50 p-4 rounded">
                            <h5 className="font-bold text-white mb-2">Stamina Management</h5>
                            <p className="text-sm text-gray-400">Every move costs Stamina. If you run out, you cannot attack. Hold <span className="text-yellow-500">BLOCK</span> to regenerate stamina faster.</p>
                        </div>
                        <div className="bg-gray-800/50 p-4 rounded">
                            <h5 className="font-bold text-white mb-2">Combos</h5>
                            <p className="text-sm text-gray-400">Land consecutive hits without being blocked to build your Combo Counter. High combos deal bonus damage and trigger camera effects.</p>
                        </div>
                        <div className="bg-gray-800/50 p-4 rounded">
                            <h5 className="font-bold text-white mb-2">Blocking</h5>
                            <p className="text-sm text-gray-400">Timing is key. Blocking nullifies damage but stops stamina regeneration if held too long. AI adapts to your patterns.</p>
                        </div>
                    </div>
                </section>

                {/* Sak Yant System */}
                <section>
                    <h4 className="font-bold text-lg text-green-500 mb-4 flex items-center gap-2"><Book /> SAK YANT (MAGIC TATTOOS)</h4>
                    <p className="text-gray-300 mb-4">
                        Equip Sak Yant scrolls to gain passive buffs. Scrolls have <strong>Integrity</strong> and will burn out after taking or dealing too much damage.
                        Collect drops by winning PvE fights on Medium/Hard difficulty.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {Object.values(SAK_YANT_DB).map(yant => (
                            <div key={yant.id} className="bg-gray-900 border border-gray-700 p-3 rounded flex flex-col gap-2">
                                <div className="font-bold" style={{ color: yant.color }}>{yant.name}</div>
                                <div className="text-xs text-gray-400">{yant.levels[1].description}</div>
                            </div>
                        ))}
                    </div>
                </section>
                
                 {/* Game Modes */}
                <section className="mb-8">
                     <h4 className="font-bold text-lg text-blue-400 mb-4 flex items-center gap-2"><Zap /> GAME MODES</h4>
                     <ul className="list-disc pl-5 space-y-2 text-gray-300">
                         <li><strong className="text-white">PvE (Story):</strong> Fight AI opponents. Win on Medium/Hard to rank up on the Leaderboard and find Sak Yant drops.</li>
                         <li><strong className="text-white">Online PvP:</strong> Challenge a friend by sharing a Room ID. Real-time combat synchronization.</li>
                         <li><strong className="text-white">TV Mode:</strong> Host a game on a big screen (Spectator) while two players connect via phones as controllers.</li>
                     </ul>
                </section>

            </div>
        </div>
    );
};

export default HowToPlay;