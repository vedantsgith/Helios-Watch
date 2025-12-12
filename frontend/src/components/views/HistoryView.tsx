import React from 'react';
import { useStore } from '../../store/useStore';
import { AlertTriangle, Play } from 'lucide-react';

export const HistoryView: React.FC = () => {
    // In a real app, we'd trigger specific data loads here.
    // For now, we reuse the simulation logic or add placeholders.
    const { addDataPoint } = useStore();

    const simulateEvent = (magnitude: number, label: string) => {
        // Inject a simulated "Historical" point
        addDataPoint({
            timestamp: new Date().toISOString(),
            flux: magnitude,
            class_type: magnitude >= 1e-4 ? 'X' : 'M',
            source: 'simulation'
        });
        alert(`Injecting Replay Data: ${label}`);
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-8 animate-in fade-in duration-500">
            <h2 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 to-orange-500 tracking-widest uppercase mb-4 drop-shadow-md">
                Historical Archives
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl w-full">
                {/* 2003 Storm */}
                <button
                    onClick={() => simulateEvent(1.7e-3, "Halloween Storm 2003")}
                    className="glass-card group p-6 flex flex-col items-center gap-4 hover:bg-white/5 transition-all text-left"
                >
                    <div className="p-4 rounded-full bg-red-500/10 group-hover:bg-red-500/20 transition-colors">
                        <AlertTriangle size={32} className="text-red-500" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-white mb-1">Halloween Storm 2003 (X17)</h3>
                        <p className="text-xs text-gray-400">Largest solar event of modern era. Caused massive blackouts in Sweden.</p>
                    </div>
                    <div className="mt-auto flex items-center gap-2 text-red-400 text-xs font-bold tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                        <Play size={10} fill="currentColor" /> REPLAY SIMULATION
                    </div>
                </button>

                {/* 1989 Quebec */}
                <button
                    onClick={() => simulateEvent(1.5e-3, "Quebec Storm 1989")}
                    className="glass-card group p-6 flex flex-col items-center gap-4 hover:bg-white/5 transition-all text-left"
                >
                    <div className="p-4 rounded-full bg-orange-500/10 group-hover:bg-orange-500/20 transition-colors">
                        <AlertTriangle size={32} className="text-orange-500" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-white mb-1">Quebec Storm 1989 (X15)</h3>
                        <p className="text-xs text-gray-400">Collapsed Hydro-Quebec power grid in 90 seconds.</p>
                    </div>
                    <div className="mt-auto flex items-center gap-2 text-orange-400 text-xs font-bold tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                        <Play size={10} fill="currentColor" /> REPLAY SIMULATION
                    </div>
                </button>

                {/* 2024 Event */}
                <button
                    onClick={() => simulateEvent(8.7e-4, "May 2024 Event")}
                    className="glass-card group p-6 flex flex-col items-center gap-4 hover:bg-white/5 transition-all text-left"
                >
                    <div className="p-4 rounded-full bg-yellow-500/10 group-hover:bg-yellow-500/20 transition-colors">
                        <AlertTriangle size={32} className="text-yellow-500" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-white mb-1">May 2024 Event (X8.7)</h3>
                        <p className="text-xs text-gray-400">Recent major solar cycle activity. Aurora seen globally.</p>
                    </div>
                    <div className="mt-auto flex items-center gap-2 text-yellow-400 text-xs font-bold tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                        <Play size={10} fill="currentColor" /> REPLAY SIMULATION
                    </div>
                </button>

                {/* 2017 Event */}
                <button
                    onClick={() => simulateEvent(9.3e-4, "September 2017")}
                    className="glass-card group p-6 flex flex-col items-center gap-4 hover:bg-white/5 transition-all text-left"
                >
                    <div className="p-4 rounded-full bg-red-500/10 group-hover:bg-red-500/20 transition-colors">
                        <AlertTriangle size={32} className="text-red-500" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-white mb-1">September 2017 (X9.3)</h3>
                        <p className="text-xs text-gray-400">Fastest flare rise time recorded in cycle 24.</p>
                    </div>
                    <div className="mt-auto flex items-center gap-2 text-red-400 text-xs font-bold tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                        <Play size={10} fill="currentColor" /> REPLAY SIMULATION
                    </div>
                </button>
            </div>
        </div>
    );
};
