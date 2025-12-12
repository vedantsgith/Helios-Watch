import React from 'react';
import { SolarGlobe } from '../SolarGlobe';
import { Wind, Zap, Activity } from 'lucide-react';
import { useStore } from '../../store/useStore';

export const PhysicsView: React.FC = () => {
    // Reverted to simple view (no simulation triggers, static/store data without cinematic mode)
    const { spaceWeather, activeRegions, calculus } = useStore();

    // Use store values (or defaults if 0/loading)
    const telemetry = {
        windSpeed: spaceWeather.windSpeed || 450,
        density: spaceWeather.density || 5.2,
        kpIndex: spaceWeather.kpIndex || 3,
        temperature: spaceWeather.temp || 150000
    };

    // Calculate Active Region Probabilities based on real data
    const hasActiveRegions = activeRegions.length > 0;

    // Logic for Calculus Display
    const slopeScientific = calculus.slope ? calculus.slope.toExponential(1) : "0.0e+0";
    const isRising = calculus.slope > 0;

    return (
        <div className="flex flex-col gap-6 animate-in fade-in duration-700">

            {/* 3-COLUMN LAYOUT: Solar Intelligence | Solar Globe | Space Weather */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-8">

                {/* LEFT: SOLAR INTELLIGENCE */}
                <div className="glass-card p-0 overflow-hidden flex flex-col h-full border-r-4 border-r-orange-500/50 border-l-0">
                    <div className="p-4 bg-white/5 border-b border-white/5 flex justify-between items-center">
                        <h2 className="text-sm font-bold text-orange-200 tracking-widest uppercase flex items-center gap-2">
                            <Zap size={16} className="text-orange-500" /> Solar Intelligence
                        </h2>
                        <span className="text-[10px] text-green-400 font-mono flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span> LIVE HYBRID FEED
                        </span>
                    </div>
                    <div className="p-6 flex-1 flex flex-col gap-4">
                        <div className="flex items-start gap-4">
                            <div className="bg-orange-500/10 p-3 rounded-lg text-orange-400">
                                <Activity size={24} />
                            </div>
                            <div>
                                <h3 className="text-white font-bold text-sm">Active Regions: {activeRegions.length}</h3>
                                <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                                    {hasActiveRegions
                                        ? `Detected ${activeRegions.length} active regions with magnetic complexity. Potential for flaring activity.`
                                        : "Solar surface is currently quiet. No major active regions detected."}
                                </p>
                            </div>
                        </div>

                        {/* HYBRID ENGINE PANEL */}
                        <div className={`mt-auto pt-4 border-t border-white/5 transition-colors duration-500 ${calculus.is_warning ? 'bg-red-950/20' : ''}`}>
                            <div className="flex justify-between items-center mb-2">
                                <h4 className="text-[10px] text-gray-400 uppercase tracking-wider">Hybrid Engine (Calc + Threshold)</h4>
                                {calculus.is_warning && (
                                    <span className="text-[10px] text-red-500 font-bold animate-pulse flex items-center gap-1">
                                        <Zap size={10} /> {calculus.status}
                                    </span>
                                )}
                            </div>

                            <div className="bg-white/5 p-3 rounded mb-2 border border-white/5">
                                <div className="text-[10px] text-gray-500 uppercase flex justify-between">
                                    <span>Algorithm Status</span>
                                    <span className="text-orange-300/50">{calculus.engine_type}</span>
                                </div>
                                <div className={`text-sm font-bold mt-1 ${calculus.is_warning ? 'text-orange-200' : 'text-blue-200'}`}>
                                    {calculus.details}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                <div className="bg-white/5 p-2 rounded">
                                    <div className="text-[9px] text-gray-500 uppercase">Rate of Change</div>
                                    <div className={`font-mono font-bold text-sm ${isRising ? 'text-orange-400' : 'text-blue-400'}`}>
                                        {slopeScientific}
                                    </div>
                                    <div className="text-[8px] text-gray-600">W/m²/min</div>
                                </div>

                                <div className={`p-2 rounded border ${calculus.is_warning ? 'border-red-500/30 bg-red-500/10' : 'border-green-500/10 bg-green-500/5'}`}>
                                    <div className="text-[9px] uppercase opacity-70 mb-1">Engine Output</div>
                                    <div className={`text-xs font-bold ${calculus.is_warning ? 'text-red-400' : 'text-green-400'}`}>
                                        {calculus.status}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* CENTER: SOLAR FOCUS (Seamless & Feathered) */}
                <div className="relative flex flex-col items-center justify-center min-h-[500px] z-10">

                    {/* 1. Behind-Sun Glow (Feather/Atmosphere) */}
                    <div className="absolute inset-0 bg-orange-600/10 blur-[100px] rounded-full pointer-events-none scale-150 transform transition-all duration-1000 animate-pulse-slow"></div>

                    {/* 2. The 3D Sun (Floating freely) */}
                    <div className="w-full h-full flex items-center justify-center scale-125 transition-transform duration-700 hover:scale-130">
                        <SolarGlobe />
                    </div>

                    {/* 3. Minimal Floating Legend */}
                    <div className="absolute bottom-0 flex gap-6 text-[9px] uppercase tracking-[0.2em] text-orange-200/60 font-mono">
                        <div className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 shadow-[0_0_10px_yellow]"></span> Photosphere
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-orange-600 shadow-[0_0_10px_orange]"></span> Corona
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_10px_red]"></span> Loops
                        </div>
                    </div>
                </div>

                {/* RIGHT: SPACE WEATHER TELEMETRY */}
                <div className="glass-card p-0 overflow-hidden flex flex-col h-full border-l-4 border-l-blue-500/50">
                    <div className="p-4 bg-white/5 border-b border-white/5 flex justify-between items-center">
                        <h2 className="text-sm font-bold text-blue-200 tracking-widest uppercase flex items-center gap-2">
                            <Wind size={16} className="text-blue-500" /> Space Weather Telemetry
                        </h2>
                        <span className="text-[10px] text-gray-500 font-mono">NOAA/SWPC</span>
                    </div>
                    <div className="p-6 grid grid-cols-1 gap-4">
                        {/* Wind Speed */}
                        <div className="bg-blue-950/30 p-4 rounded border border-blue-500/10">
                            <p className="text-[10px] text-blue-400 uppercase tracking-wider mb-1">Wind Speed</p>
                            <div className="text-2xl font-mono font-bold text-white">
                                {telemetry.windSpeed.toFixed(0)} <span className="text-xs text-gray-500">km/s</span>
                            </div>
                        </div>
                        {/* Density */}
                        <div className="bg-purple-950/30 p-4 rounded border border-purple-500/10">
                            <p className="text-[10px] text-purple-400 uppercase tracking-wider mb-1">Proton Density</p>
                            <div className="text-2xl font-mono font-bold text-white">
                                {telemetry.density.toFixed(1)} <span className="text-xs text-gray-500">p/cm³</span>
                            </div>
                        </div>
                        {/* Kp Index */}
                        <div className="bg-green-950/30 p-4 rounded border border-green-500/10">
                            <p className="text-[10px] text-green-400 uppercase tracking-wider mb-1">K-Index</p>
                            <div className="text-2xl font-mono font-bold text-white">
                                {telemetry.kpIndex.toFixed(1)} <span className="text-xs text-gray-500">Kp</span>
                            </div>
                        </div>
                        {/* Temp */}
                        <div className="bg-yellow-950/30 p-4 rounded border border-yellow-500/10">
                            <p className="text-[10px] text-yellow-400 uppercase tracking-wider mb-1">Ion Temp</p>
                            <div className="text-2xl font-mono font-bold text-white">
                                {(telemetry.temperature / 1000).toFixed(0)}k <span className="text-xs text-gray-500">K</span>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};
