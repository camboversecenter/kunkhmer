
import React, { useState, useEffect } from 'react';
import { ChevronLeft, Wifi, Copy, Play, Loader, Users, CheckCircle } from 'lucide-react';
import { initializePeer, connectToPeer, destroyPeer } from '../services/peerService';
import { PeerData, ProvinceId } from '../types';
import { PROVINCES } from '../constants';
import { Map, Star, Trophy, ChevronDown } from 'lucide-react';

interface OnlineLobbyProps {
  onBack: () => void;
  onPeerData: (data: PeerData, peerId: string) => void;
  onGameStart: (isHost: boolean, roomId: string, connection: any) => void;
  currentProvince: ProvinceId;
  onProvinceSelect: (provinceId: ProvinceId) => void;
}

const OnlineLobby: React.FC<OnlineLobbyProps> = ({ onBack, onPeerData, onGameStart, currentProvince, onProvinceSelect }) => {
  const [mode, setMode] = useState<'SELECT' | 'HOST' | 'JOIN'>('SELECT');
  const [showProvinceSelect, setShowProvinceSelect] = useState(false);
  const [roomId, setRoomId] = useState<string>('');
  const [joinId, setJoinId] = useState<string>('');
  const [status, setStatus] = useState<string>('');
  const [error, setError] = useState<string>('');

  // Cleanup peer on unmount if not game started
  useEffect(() => {
    return () => {
      // We don't destroy here because we pass the connection to the game
      // But if we back out, we might want to? 
      // For now, let App.tsx handle lifecycle if we successfully start.
    };
  }, []);

  const handleHost = () => {
    setMode('HOST');
    setStatus('Creating Room...');
    
    initializePeer(
      (id) => {
        setRoomId(id);
        setStatus('Waiting for opponent...');
      },
      (conn) => {
        setStatus('Opponent Connected!');
        setTimeout(() => {
          onGameStart(true, roomId, conn);
        }, 1000);
      },
      (data, id) => {
        onPeerData(data, id);
      },
      (err) => {
        setError('Connection Error: ' + err.type);
        setMode('SELECT');
      }
    );
  };

  const handleJoin = () => {
    if (!joinId) return;
    setMode('JOIN');
    setStatus('Connecting to Host...');
    
    connectToPeer(
      joinId,
      () => {
        setStatus('Connected! Starting...');
        setTimeout(() => {
          onGameStart(false, joinId, null);
        }, 1000);
      },
      (data, id) => {
        onPeerData(data, id);
      },
      (err) => {
        setError('Could not connect. Check ID.');
        setMode('SELECT');
      }
    );
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(roomId);
    setStatus('Copied to clipboard!');
    setTimeout(() => setStatus('Waiting for opponent...'), 2000);
  };

  return (
    <div className="absolute inset-0 bg-gray-900 z-50 flex flex-col pt-[env(safe-area-inset-top)] text-white overflow-hidden bg-[url('https://images.unsplash.com/photo-1599557262140-5e378c8a8220?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      
      {/* Header */}
      <div className="p-4 border-b border-gray-800 flex items-center justify-between bg-black/50 backdrop-blur-md z-10">
        <button onClick={() => {
            destroyPeer();
            onBack();
        }} className="p-2 hover:bg-gray-800 rounded-full transition-colors">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h2 className="text-xl font-bold text-blue-500 tracking-wider flex items-center gap-2">
          ONLINE PVP
        </h2>
        <div className="w-10"></div>
      </div>

      <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-6">
        
        {mode === 'SELECT' && (
          <div className="flex flex-col gap-6 w-full max-w-md animate-in fade-in slide-in-from-bottom-8">
            <h1 className="text-4xl font-black text-center mb-4 italic tracking-tighter">ONLINE ARENA</h1>

            {/* PROVINCE SELECTION */}
            <div className="bg-gray-800/80 backdrop-blur-md p-4 rounded-xl border border-gray-700 shadow-lg mb-2 relative">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                            <Map size={20} />
                        </div>
                        <div>
                            <div className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Your Province</div>
                            <div className="text-sm font-bold">{PROVINCES[currentProvince]}</div>
                        </div>
                    </div>
                    <button 
                        onClick={() => setShowProvinceSelect(!showProvinceSelect)}
                        className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                    >
                        <ChevronDown className={`w-5 h-5 transition-transform ${showProvinceSelect ? 'rotate-180' : ''}`} />
                    </button>
                </div>

                {showProvinceSelect && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-gray-800 border border-gray-700 rounded-xl shadow-2xl z-50 max-h-48 overflow-y-auto grid grid-cols-2 p-2 gap-1 animate-in slide-in-from-top-2">
                        {Object.entries(PROVINCES).map(([id, name]) => (
                            <button
                                key={id}
                                onClick={() => {
                                    onProvinceSelect(id as ProvinceId);
                                    setShowProvinceSelect(false);
                                }}
                                className={`
                                    text-[10px] font-bold py-2 px-3 rounded-lg text-left transition-all
                                    ${currentProvince === id ? 'bg-blue-600 text-white' : 'hover:bg-gray-700 text-gray-300'}
                                `}
                            >
                                {name}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* TERRITORY LEADERBOARD (MOCK) */}
            <div className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 p-4 rounded-xl border border-yellow-500/20 mb-2">
                 <h3 className="text-[10px] font-bold text-yellow-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                     <Trophy size={12} /> Territory War Leaderboard
                 </h3>
                 <div className="space-y-2">
                     {[
                        { name: 'Phnom Penh', score: 12540, trend: 'up' },
                        { name: 'Siem Reap', score: 9820, trend: 'up' },
                        { name: 'Battambang', score: 7450, trend: 'down' }
                     ].map((p, i) => (
                        <div key={i} className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                                <span className={`w-4 h-4 rounded flex items-center justify-center font-bold ${i === 0 ? 'bg-yellow-500 text-black' : 'bg-gray-800 text-gray-400'}`}>
                                    {i + 1}
                                </span>
                                <span className="font-semibold">{p.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="font-mono">{p.score.toLocaleString()} pts</span>
                                <Star size={10} className="text-yellow-500 fill-yellow-500" />
                            </div>
                        </div>
                     ))}
                 </div>
            </div>
            
            <button 
              onClick={handleHost}
              className="group relative overflow-hidden bg-blue-600 hover:bg-blue-500 p-8 rounded-xl transition-all hover:scale-105 border border-blue-400 shadow-[0_0_30px_rgba(37,99,235,0.3)]"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
              <div className="flex items-center justify-between">
                <div className="text-left">
                    <div className="text-2xl font-bold">HOST GAME</div>
                    <div className="text-blue-200 text-sm">Create a room and invite a friend</div>
                </div>
                <Wifi className="w-10 h-10 text-blue-200" />
              </div>
            </button>

            <div className="flex items-center justify-center gap-4 text-gray-500">
               <div className="h-px bg-gray-700 flex-1" />
               OR
               <div className="h-px bg-gray-700 flex-1" />
            </div>

            <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-xl">
              <label className="block text-sm font-bold text-gray-400 mb-2">JOIN EXISTING ROOM</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={joinId}
                  onChange={(e) => setJoinId(e.target.value)}
                  placeholder="Paste Room ID here..."
                  className="flex-1 bg-black/50 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 font-mono"
                />
                <button 
                  onClick={handleJoin}
                  disabled={!joinId}
                  className="bg-green-600 hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed px-6 rounded-lg font-bold transition-colors"
                >
                  JOIN
                </button>
              </div>
            </div>
            
            {error && (
                <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded-lg text-center">
                    {error}
                </div>
            )}
          </div>
        )}

        {mode === 'HOST' && (
           <div className="bg-gray-900 border border-gray-700 p-8 rounded-2xl max-w-md w-full text-center shadow-2xl animate-in zoom-in-95">
               <div className="mb-6">
                   <div className="w-20 h-20 bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                       <Wifi className="w-10 h-10 text-blue-400" />
                   </div>
                   <h2 className="text-2xl font-bold text-white">Lobby Created</h2>
                   <p className="text-gray-400 mt-2">Share this Room ID with your opponent</p>
               </div>

               {roomId ? (
                   <div className="bg-black/50 border border-gray-600 rounded-lg p-4 mb-6 flex items-center justify-between group cursor-pointer" onClick={copyToClipboard}>
                       <code className="text-2xl font-mono text-yellow-500 tracking-wider">{roomId}</code>
                       <Copy className="w-5 h-5 text-gray-500 group-hover:text-white transition-colors" />
                   </div>
               ) : (
                   <div className="flex justify-center py-8">
                       <Loader className="w-8 h-8 text-blue-500 animate-spin" />
                   </div>
               )}

               <div className="flex items-center justify-center gap-2 text-sm font-mono text-blue-400">
                   {status === 'Opponent Connected!' ? <CheckCircle className="w-4 h-4" /> : <Loader className="w-4 h-4 animate-spin" />}
                   {status}
               </div>
               
               <button onClick={() => {
                   destroyPeer();
                   setMode('SELECT');
               }} className="mt-8 text-gray-500 hover:text-white underline text-sm">
                   Cancel
               </button>
           </div>
        )}
        
        {mode === 'JOIN' && (
            <div className="text-center">
                 <Loader className="w-16 h-16 text-green-500 animate-spin mx-auto mb-6" />
                 <h2 className="text-3xl font-bold mb-2">Connecting...</h2>
                 <p className="text-gray-400">{status}</p>
            </div>
        )}

      </div>
    </div>
  );
};

export default OnlineLobby;
