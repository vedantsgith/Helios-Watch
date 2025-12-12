import React, { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';
import { AlertTriangle } from 'lucide-react';

export const FullScreenAlert: React.FC = () => {
    const { currentFlux } = useStore();
    const [alertLevel, setAlertLevel] = useState<'NONE' | 'M' | 'X'>('NONE');

    useEffect(() => {
        if (currentFlux >= 1e-4) {
            setAlertLevel('X');
        } else if (currentFlux >= 1e-5) {
            setAlertLevel('M');
        } else {
            setAlertLevel('NONE');
        }
    }, [currentFlux]);

    if (alertLevel === 'NONE') return null;

    // If M-Class, render minimal banner at top
    if (alertLevel === 'M') {
        return (
            <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 animate-bounce">
                <div className="glass-card bg-orange-900/80 border-orange-500/50 text-orange-200 px-8 py-3 rounded-full flex items-center gap-3 backdrop-blur-md shadow-[0_0_20px_rgba(249,115,22,0.4)]">
                    <AlertTriangle size={20} className="text-orange-500 animate-pulse" />
                    <span className="font-bold tracking-widest font-mono">WARNING: M-CLASS FLARE DETECTED</span>
                    <span className="text-xs opacity-70 font-mono">({currentFlux.toExponential(1)} W/m²)</span>
                </div>
            </div>
        );
    }

    // If X-Class, keep the Full Screen Blinding Alert
    const color = 'bg-red-500';
    const textColor = 'text-red-100';
    const title = 'EXTREME ALERT: X-CLASS FLARE';

    return (
        <div className={`fixed inset-0 z-50 pointer-events-none flex flex-col items-center justify-center overflow-hidden`}>
            {/* 1. Blinding Flash Overlay */}
            <div className={`absolute inset-0 ${color} mix-blend-overlay animate-[ping_1s_ease-in-out_infinite] opacity-50`}></div>

            {/* 2. Vignette Pulse */}
            <div className={`absolute inset-0 bg-[radial-gradient(circle,transparent_0%,#500_90%)] animate-[pulse_0.5s_ease-in-out_infinite]`}></div>

            {/* 3. Central Alert Box */}
            <div className="relative z-10 bg-black/80 backdrop-blur-xl border-2 border-white/20 p-8 rounded-2xl flex flex-col items-center gap-4 shadow-2xl animate-bounce">
                <AlertTriangle size={64} className="text-red-500 animate-pulse" />
                <h1 className={`text-4xl font-black ${textColor} tracking-widest uppercase text-center`}>
                    {title}
                </h1>
                <p className="text-white/60 font-mono">
                    FLUX: {currentFlux.toExponential(2)} W/m²
                </p>
            </div>
        </div>
    );
};
