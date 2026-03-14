import React, { useState, useEffect } from 'react';
import { RotateCw, Monitor, Download, X, Smartphone, Globe } from 'lucide-react';

const MobileOverlay: React.FC = () => {
    const [isPortrait, setIsPortrait] = useState(window.innerHeight > window.innerWidth);
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [showInstallModal, setShowInstallModal] = useState(false);
    const [isPWA, setIsPWA] = useState(window.matchMedia('(display-mode: standalone)').matches);

    useEffect(() => {
        const handleResize = () => {
            setIsPortrait(window.innerHeight > window.innerWidth);
        };

        const handleBeforeInstallPrompt = (e: any) => {
            e.preventDefault();
            setDeferredPrompt(e);
            // Show modal automatically after a delay if not PWA
            if (!isPWA) {
                setTimeout(() => setShowInstallModal(true), 5000);
            }
        };

        window.addEventListener('resize', handleResize);
        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, [isPWA]);

    const handleInstall = async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            setDeferredPrompt(null);
            setShowInstallModal(false);
        }
    };

    if (isPortrait) {
        return (
            <div className="fixed inset-0 z-[2000] bg-zinc-950 flex flex-col items-center justify-center text-white p-8 text-center">
                <div className="relative mb-8">
                    <Smartphone size={80} className="text-yellow-500 animate-pulse" />
                    <RotateCw size={32} className="absolute -top-2 -right-2 text-white animate-spin-slow" />
                </div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent mb-4">
                    PLEASE ROTATE DEVICE
                </h1>
                <p className="text-zinc-400 max-w-xs leading-relaxed">
                    Kun Khmer Fight 3D requires landscape mode for the best combat experience.
                </p>
                <div className="mt-12 flex items-center gap-4 text-xs text-zinc-500">
                    <div className="w-12 h-0.5 bg-zinc-800" />
                    <span>OR USE DESKTOP</span>
                    <div className="w-12 h-0.5 bg-zinc-800" />
                </div>
                <Monitor size={24} className="mt-4 text-zinc-600" />
            </div>
        );
    }

    if (showInstallModal && !isPWA) {
        return (
            <div className="fixed inset-0 z-[1500] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                <div className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl">
                    <button 
                        onClick={() => setShowInstallModal(false)}
                        className="absolute top-4 right-4 p-2 hover:bg-zinc-800 rounded-full transition-colors z-10"
                    >
                        <X size={20} className="text-zinc-400" />
                    </button>

                    {/* Banner Image */}
                    <div className="h-40 bg-gradient-to-br from-yellow-500/20 to-blue-600/20 flex items-center justify-center relative">
                        <div className="absolute inset-0 bg-[url('/public/icon-512.png')] bg-cover bg-center mix-blend-overlay opacity-30" />
                        <img src="/icon-512.png" alt="Icon" className="w-20 h-20 rounded-2xl shadow-xl border-2 border-yellow-500/50 relative z-0" />
                    </div>

                    <div className="p-8 pt-6">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="px-2 py-1 bg-yellow-500/10 text-yellow-500 text-[10px] font-bold uppercase tracking-wider rounded border border-yellow-500/20">
                                Official App
                            </span>
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">Kun Khmer Fight 3D</h2>
                        <p className="text-zinc-400 text-sm mb-8 leading-relaxed">
                            Install to your home screen for faster loading, fullscreen play, and a better experience.
                        </p>

                        <div className="space-y-3">
                            <button 
                                onClick={handleInstall}
                                className="w-full py-4 bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded-2xl transition-all shadow-lg shadow-yellow-500/20 flex items-center justify-center gap-3 active:scale-95"
                            >
                                <Download size={20} />
                                Install Now
                            </button>
                            <button 
                                onClick={() => setShowInstallModal(false)}
                                className="w-full py-4 bg-zinc-800 hover:bg-zinc-700 text-white font-medium rounded-2xl transition-all flex items-center justify-center gap-3"
                            >
                                <Globe size={18} className="text-zinc-500" />
                                Continue in Browser
                            </button>
                        </div>

                        <div className="mt-6 pt-6 border-t border-zinc-800/50 flex justify-between items-center text-[10px] text-zinc-500 font-medium">
                            <div className="flex items-center gap-1.5">
                                <Monitor size={12} />
                                PC & MOBILE
                            </div>
                            <div>VER 1.2.0</div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return null;
};

export default MobileOverlay;
