import React, { useState } from 'react';
import axios from 'axios';
import { Zap, Activity, AlertTriangle } from 'lucide-react';

export const JudgeControlPanel: React.FC = () => {
    const [loading, setLoading] = useState(false);

    const triggerSimulation = async (type: string, duration: number) => {
        if (loading) return;
        setLoading(true);
        try {
            // Matches the backend endpoint we just built
            await axios.post('http://127.0.0.1:8000/simulate', {
                type: type,
                duration: duration
            });
            // Cooldown to prevent spamming
            setTimeout(() => setLoading(false), 2000);
        } catch (e) {
            console.error("Simulation failed", e);
            setLoading(false);
        }
    };

    return (

        <div className="glass-card p-6 mt-6 relative overflow-hidden group">
            {/* Cool background effect for the panel itself using a subtle gradient that shifts on hover */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>

            <div className="flex items-center gap-2 mb-6 border-b border-white/10 pb-4 relative z-10">
                <Zap className="text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]" size={20} />
                <h3 className="text-xl font-bold text-white tracking-widest font-mono">SIMULATION CONTROL</h3>
            </div>

            <div className="grid grid-cols-2 gap-4 relative z-10">
                {/* C-Class (Minor) */}
                <button
                    onClick={() => triggerSimulation("C", 60)}
                    disabled={loading}
                    className={`
                        group relative flex flex-col items-center justify-center gap-1 py-4 rounded-lg border transition-all duration-300
                        ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:-translate-y-1 hover:shadow-[0_0_15px_rgba(34,197,94,0.3)]'}
                        bg-green-950/30 border-green-500/30 text-green-400
                    `}
                >
                    <Activity size={20} className="mb-1" />
                    <span className="font-bold tracking-wider">C-CLASS</span>
                    <span className="text-[10px] opacity-60">MINOR EVENT</span>
                </button>

                {/* M-Class (Moderate) */}
                <button
                    onClick={() => triggerSimulation("M", 60)}
                    disabled={loading}
                    className={`
                        group relative flex flex-col items-center justify-center gap-1 py-4 rounded-lg border transition-all duration-300
                        ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:-translate-y-1 hover:shadow-[0_0_15px_rgba(249,115,22,0.3)]'}
                        bg-orange-950/30 border-orange-500/30 text-orange-400
                    `}
                >
                    <Activity size={20} className="mb-1" />
                    <span className="font-bold tracking-wider">M-CLASS</span>
                    <span className="text-[10px] opacity-60">MODERATE</span>
                </button>

                {/* X-Class (Major - The Wow Factor) */}
                <button
                    onClick={() => triggerSimulation("X", 60)}
                    disabled={loading}
                    className={`
                        col-span-2 group relative flex flex-row items-center justify-center gap-3 py-5 rounded-lg border transition-all duration-300 overflow-hidden
                        ${loading ? 'opacity-80 cursor-wait' : 'hover:scale-[1.02] hover:shadow-[0_0_25px_rgba(239,68,68,0.4)]'}
                        bg-gradient-to-r from-red-950/40 to-red-900/60 border-red-500/50 text-red-100
                    `}
                >
                    {/* Animated shine effect */}
                    {!loading && <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent z-0"></div>}

                    <AlertTriangle size={24} className={`text-red-500 relative z-10 ${loading ? 'animate-spin' : 'animate-pulse'}`} />
                    <div className="relative z-10 flex flex-col items-start">
                        <span className="text-lg font-bold tracking-[0.1em] text-red-100">
                            {loading ? "INJECTING DATA..." : "INITIATE X-CLASS FLARE"}
                        </span>
                        {!loading && <span className="text-[10px] text-red-400 font-mono tracking-widest">EXTREME DANGER SIMULATION</span>}
                    </div>
                </button>
            </div>

            <div className="mt-4 flex justify-between items-center px-2">
                <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${loading ? 'bg-yellow-400 animate-ping' : 'bg-emerald-500'}`}></div>
                    <span className="text-[10px] text-gray-400 uppercase tracking-widest font-mono">
                        {loading ? 'UPLINK ACTIVE' : 'SYSTEM READY'}
                    </span>
                </div>
                <span className="text-[10px] text-gray-600 font-mono">V 2.4.0</span>
            </div>
        </div>
    );

};