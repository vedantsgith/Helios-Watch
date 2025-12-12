import React, { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';
import { AlertTriangle } from 'lucide-react';

export const FullScreenAlert: React.FC = () => {
    const { currentFlux, visualSimulation } = useStore();
    const [alertLevel, setAlertLevel] = useState<'NONE' | 'M' | 'X'>('NONE');

    useEffect(() => {
        // Priority: Visual Simulation -> Real Data
        if (visualSimulation.active) {
            setAlertLevel(visualSimulation.level);
            return;
        }

        if (currentFlux >= 1e-4) {
            setAlertLevel('X');
        } else if (currentFlux >= 1e-5) {
            setAlertLevel('M');
        } else {
            setAlertLevel('NONE');
        }
    }, [currentFlux, visualSimulation]);

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

    // If X-Class, user requested "Minimal" alert for simulation
    // We will use a smaller absolute modal instead of full screen takeover
    const color = 'bg-red-500';
    const textColor = 'text-red-100';

    return (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 animate-bounce">
            {/* Pulsing Red Aura */}
            <div className="absolute inset-0 bg-red-500 blur-xl opacity-20 animate-pulse rounded-full"></div>

            <div className={`glass-card ${color} bg-opacity-20 border-red-500 text-red-100 px-8 py-4 rounded-xl flex flex-col items-center gap-2 backdrop-blur-md shadow-[0_0_30px_rgba(239,68,68,0.4)]`}>
                <div className="flex items-center gap-3">
                    <AlertTriangle size={32} className="text-red-500 animate-[spin_1s_ease-in-out_infinite]" />
                    <span className="font-bold tracking-[0.2em] font-mono text-xl">X-CLASS DETECTED</span>
                </div>
                <span className="text-xs opacity-80 font-mono tracking-widest">
                    FLUX: {currentFlux.toExponential(2)} W/m²
                </span>
            </div>
        </div>
    );
};
