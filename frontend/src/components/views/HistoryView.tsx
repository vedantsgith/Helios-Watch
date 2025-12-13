import React, { useState, useEffect } from 'react';
import { TrendingUp, Info } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { REAL_HISTORICAL_EVENTS } from './HistoricalData';
import type { HistoricalEventProfile } from './HistoricalData';

export const HistoryView: React.FC = () => {
    const [selectedEvent, setSelectedEvent] = useState<HistoricalEventProfile | null>(null);
    const [graphData, setGraphData] = useState<any[]>([]);
    const [isPlaying, setIsPlaying] = useState(false);
    const [progressIndex, setProgressIndex] = useState(0);

    const playEvent = (event: HistoricalEventProfile) => {
        if (isPlaying) return; // Prevent double play

        setSelectedEvent(event);
        setIsPlaying(true);
        setGraphData([]); // Clear previous
        setProgressIndex(0);
    };

    // Animation Effect
    useEffect(() => {
        if (!isPlaying || !selectedEvent) return;

        const totalPoints = selectedEvent.data.length;

        if (progressIndex < totalPoints) {
            const timer = setTimeout(() => {
                setGraphData(prev => [...prev, selectedEvent.data[progressIndex]]);
                setProgressIndex(prev => prev + 1);
            }, 50); // Speed of animation (50ms per point)
            return () => clearTimeout(timer);
        } else {
            setIsPlaying(false); // Animation complete
        }
    }, [isPlaying, progressIndex, selectedEvent]);

    return (
        <div className="flex flex-col min-h-[60vh] gap-8 animate-in fade-in duration-500 p-6">

            {/* HIDE TITLE WHEN VIEWING EVENT TO SAVE SPACE */}
            {!selectedEvent && (
                <h2 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 to-orange-500 tracking-widest uppercase mb-4 drop-shadow-md text-center">
                    Historical Archives
                </h2>
            )}

            {/* DETAIL VIEW (GRAPH) */}
            {selectedEvent ? (
                <div className="glass-card p-6 mb-6 animate-in slide-in-from-top duration-500">
                    <div className="flex flex-col md:flex-row items-center justify-between mb-6 gap-4">
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                                <button
                                    onClick={() => {
                                        setIsPlaying(false);
                                        setSelectedEvent(null);
                                    }}
                                    className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded border border-white/20 text-xs font-bold transition-colors"
                                >
                                    ← BACK TO ARCHIVES
                                </button>
                                <h3 className="text-3xl font-bold text-white">{selectedEvent.title}</h3>
                            </div>

                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-xs font-mono text-gray-400 border border-gray-600 px-2 py-0.5 rounded">{selectedEvent.date}</span>
                                {isPlaying && <span className="text-xs font-bold text-green-400 animate-pulse">● REPLAYING DATA...</span>}
                            </div>
                            <p className="text-sm text-gray-300 leading-relaxed max-w-2xl">{selectedEvent.description}</p>
                        </div>

                        {/* Key Stats Badge */}
                        <div className="grid grid-cols-3 gap-4 text-center bg-black/30 p-4 rounded-xl border border-white/10">
                            <div>
                                <div className="text-[10px] text-gray-500 uppercase tracking-widest">Flux</div>
                                <div className="text-xl font-bold text-red-400">{selectedEvent.stats.flux}</div>
                            </div>
                            <div>
                                <div className="text-[10px] text-gray-500 uppercase tracking-widest">Wind</div>
                                <div className="text-xl font-bold text-yellow-400">{selectedEvent.stats.wind}</div>
                            </div>
                            <div>
                                <div className="text-[10px] text-gray-500 uppercase tracking-widest">Max Kp</div>
                                <div className="text-xl font-bold text-orange-400">{selectedEvent.stats.kp}</div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* X-Ray Flux */}
                        <div className="glass-card p-4 !bg-black/40">
                            <h4 className="text-xs font-bold text-gray-400 mb-3 uppercase tracking-wider flex items-center gap-2">
                                <TrendingUp size={14} className="text-red-500" /> X-Ray Flux
                            </h4>
                            <ResponsiveContainer width="100%" height={200}>
                                <AreaChart data={graphData} margin={{ left: -20, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="fluxGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
                                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <XAxis dataKey="time" stroke="#666" tick={{ fontSize: 10 }} tickMargin={5} />
                                    <YAxis stroke="#666" tick={{ fontSize: 10 }} tickFormatter={(val) => val.toExponential(0)} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#000', border: '1px solid #333', fontSize: '12px' }}
                                        formatter={(val: number) => val.toExponential(2)}
                                        labelStyle={{ display: 'none' }}
                                    />
                                    <Area type="monotone" dataKey="flux" stroke="#ef4444" strokeWidth={2} fill="url(#fluxGradient)" isAnimationActive={false} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Solar Wind */}
                        <div className="glass-card p-4 !bg-black/40">
                            <h4 className="text-xs font-bold text-gray-400 mb-3 uppercase tracking-wider flex items-center gap-2">
                                <TrendingUp size={14} className="text-yellow-500" /> Solar Wind (km/s)
                            </h4>
                            <ResponsiveContainer width="100%" height={200}>
                                <LineChart data={graphData} margin={{ left: -20, bottom: 0 }}>
                                    <XAxis dataKey="time" stroke="#666" tick={{ fontSize: 10 }} tickMargin={5} />
                                    <YAxis stroke="#666" tick={{ fontSize: 10 }} domain={[200, 'auto']} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#000', border: '1px solid #333', fontSize: '12px' }}
                                        formatter={(val: number) => `${Math.round(val)} km/s`}
                                        labelStyle={{ display: 'none' }}
                                    />
                                    <Line type="monotone" dataKey="wind" stroke="#eab308" strokeWidth={2} dot={false} isAnimationActive={false} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Kp Index */}
                        <div className="glass-card p-4 !bg-black/40">
                            <h4 className="text-xs font-bold text-gray-400 mb-3 uppercase tracking-wider flex items-center gap-2">
                                <TrendingUp size={14} className="text-orange-500" /> Kp Index
                            </h4>
                            <ResponsiveContainer width="100%" height={200}>
                                <LineChart data={graphData} margin={{ left: -20, bottom: 0 }}>
                                    <XAxis dataKey="time" stroke="#666" tick={{ fontSize: 10 }} tickMargin={5} />
                                    <YAxis stroke="#666" tick={{ fontSize: 10 }} domain={[0, 9]} ticks={[0, 3, 5, 7, 9]} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#000', border: '1px solid #333', fontSize: '12px' }}
                                        formatter={(val: number) => `Kp ${val.toFixed(1)}`}
                                        labelStyle={{ display: 'none' }}
                                    />
                                    <Line type="step" dataKey="kp" stroke="#f97316" strokeWidth={2} dot={false} isAnimationActive={false} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            ) : (
                /* GRID VIEW (Only shown when NO event is selected) */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 max-w-7xl w-full mx-auto animate-in fade-in duration-300">
                    {REAL_HISTORICAL_EVENTS.map((event) => (
                        <button
                            key={event.id}
                            onClick={() => playEvent(event)}
                            disabled={isPlaying}
                            className={`glass-card group p-5 flex flex-col items-start gap-3 hover:bg-white/5 transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed border-l-4 border-transparent hover:border-red-500/50`}
                        >
                            <div className="w-full flex justify-between items-start">
                                <h4 className="font-bold text-white text-sm line-clamp-1 group-hover:text-red-400 transition-colors">{event.title}</h4>
                            </div>

                            <div className="text-[10px] font-mono text-gray-500">{event.date}</div>
                            <p className="text-xs text-gray-400 line-clamp-3">{event.description}</p>

                            <div className="flex gap-2 w-full mt-auto pt-2 border-t border-white/5">
                                <div className="text-xs font-bold text-gray-400">
                                    <span className="text-[9px] uppercase block opacity-50">Flux</span>
                                    {event.stats.flux}
                                </div>
                                <div className="ml-auto text-xs font-bold text-gray-400 text-right">
                                    <span className="text-[9px] uppercase block opacity-50">Wind</span>
                                    {event.stats.wind}
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            )}

            <div className="text-center mt-8 text-gray-500 text-xs flex items-center justify-center gap-2 opacity-50">
                <Info size={12} />
                Data Reconstructed from NOAA Historical Archives & Scientific Estimates.
            </div>
        </div>
    );
};
