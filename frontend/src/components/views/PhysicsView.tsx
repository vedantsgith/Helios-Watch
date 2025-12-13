import React from 'react';
import { SolarGlobe } from '../SolarGlobe';
import { Wind, Zap, Activity, Globe } from 'lucide-react';
import { useStore } from '../../store/useStore';

// --- THREAT LOGIC ---
const getStatusColor = (type: 'wind' | 'kp' | 'proton' | 'flux' | 'neutral', value: number) => {
    // Neutral types (like Density/Temp) logic handled in StatBox defaults, but safe fallback here
    if (type === 'neutral') return { color: 'text-blue-400', bg: 'bg-blue-950/30', border: 'border-blue-500/10', status: '', pulse: false };

    switch (type) {
        case 'wind':
            if (value >= 900) return { color: 'text-purple-500', bg: 'bg-purple-500/10', border: 'border-purple-500/50', status: 'EXTREME', pulse: true };
            if (value >= 700) return { color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/50', status: 'CRITICAL', pulse: true };
            if (value >= 500) return { color: 'text-yellow-500', bg: 'bg-yellow-500/10', border: 'border-yellow-500/50', status: 'WARNING', pulse: false };
            return { color: 'text-green-500', bg: 'bg-green-500/10', border: 'border-green-500/20', status: 'NORMAL', pulse: false };

        case 'kp':
            if (value >= 8) return { color: 'text-purple-500', bg: 'bg-purple-500/10', border: 'border-purple-500/50', status: 'EXTREME G4', pulse: true };
            if (value >= 6) return { color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/50', status: 'STORM G2', pulse: true };
            if (value >= 5) return { color: 'text-yellow-500', bg: 'bg-yellow-500/10', border: 'border-yellow-500/50', status: 'UNSETTLED', pulse: false };
            return { color: 'text-green-500', bg: 'bg-green-500/10', border: 'border-green-500/20', status: 'QUIET', pulse: false };

        case 'proton':
            if (value >= 1000) return { color: 'text-purple-500', bg: 'bg-purple-500/10', border: 'border-purple-500/50', status: 'S3 STRONG', pulse: true };
            if (value >= 100) return { color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/50', status: 'S2 MODERATE', pulse: true };
            if (value >= 10) return { color: 'text-yellow-500', bg: 'bg-yellow-500/10', border: 'border-yellow-500/50', status: 'S1 MINOR', pulse: false };
            return { color: 'text-green-500', bg: 'bg-green-500/10', border: 'border-green-500/20', status: 'NORMAL', pulse: false };

        case 'flux':
            if (value >= 1e-4) return { color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/50', status: 'X-CLASS', pulse: true };
            if (value >= 1e-5) return { color: 'text-orange-500', bg: 'bg-orange-500/10', border: 'border-orange-500/50', status: 'M-CLASS', pulse: false };
            if (value >= 1e-6) return { color: 'text-yellow-500', bg: 'bg-yellow-500/10', border: 'border-yellow-500/50', status: 'C-CLASS', pulse: false };
            return { color: 'text-green-500', bg: 'bg-green-500/10', border: 'border-green-500/20', status: 'QUIET', pulse: false };

        default:
            return { color: 'text-gray-500', bg: 'bg-gray-500/10', border: 'border-gray-500/20', status: 'UNKNOWN', pulse: false };
    }
};

interface StatBoxProps {
    label: string;
    value: number | string;
    unit: string;
    type: 'wind' | 'kp' | 'proton' | 'flux' | 'neutral';
    description: string;
}

const StatBox: React.FC<StatBoxProps> = ({ label, value, unit, type, description }) => {
    // For 'neutral' types (like Density/Temp), defaults to Blue style
    const style = type === 'neutral'
        ? { color: 'text-blue-400', bg: 'bg-blue-950/30', border: 'border-blue-500/10', status: '', pulse: false }
        : getStatusColor(type, typeof value === 'number' ? value : 0);

    return (
        <div className={`group/stat relative ${style.bg} p-4 rounded border ${style.border} transition-all duration-500 hover:bg-white/5`}>
            <div className="flex justify-between items-center mb-1">
                <p className={`text-[10px] uppercase tracking-wider ${style.color} flex items-center gap-1`}>
                    {label}
                    {/* Info Icon with Tooltip */}
                    <div className="relative group/tooltip">
                        <div className="cursor-help opacity-50 hover:opacity-100">ⓘ</div>
                        <div className="absolute left-0 bottom-full mb-2 w-48 p-2 bg-black/90 border border-white/20 rounded text-[9px] text-gray-300 normal-case tracking-normal shadow-xl opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all z-50 pointer-events-none">
                            {description}
                            <div className="absolute left-2 top-full w-2 h-2 bg-black/90 border-r border-b border-white/20 transform rotate-45 -mt-1"></div>
                        </div>
                    </div>
                </p>
                {style.status && (
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded bg-black/40 ${style.color} ${style.pulse ? 'animate-pulse' : ''}`}>
                        {style.status}
                    </span>
                )}
            </div>
            <div className={`text-2xl font-mono font-bold text-white flex items-baseline gap-2 ${style.pulse ? 'animate-pulse' : ''}`}>
                {value} <span className="text-xs text-gray-400 font-normal">{unit}</span>
            </div>
        </div>
    );
};

export const PhysicsView: React.FC = () => {
    // Reverted to simple view (no simulation triggers, static/store data without cinematic mode)
    const { spaceWeather, activeRegions, calculus, currentFlux } = useStore();

    // Use store values (or defaults if 0/loading)
    const telemetry = {
        windSpeed: spaceWeather.windSpeed || 450,
        density: spaceWeather.density || 5.2,
        kpIndex: spaceWeather.kpIndex || 3,
        temperature: spaceWeather.temp || 150000,
        protonFlux: spaceWeather.protonFlux || 0.1
    };

    // Calculate Active Region Probabilities based on real data
    // const hasActiveRegions = activeRegions.length > 0; (Removed unused)

    // Logic for Calculus Display
    const slopeScientific = calculus.slope ? calculus.slope.toExponential(1) : "0.0e+0";
    const isRising = calculus.slope > 0;

    return (
        <div className="flex flex-col gap-6 animate-in fade-in duration-700">

            {/* 3-COLUMN LAYOUT: Solar Intelligence | Solar Globe | Space Weather */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-8">

                {/* LEFT: SOLAR INTELLIGENCE */}
                <div className="glass-card p-0 overflow-hidden flex flex-col h-full border-r-4 border-r-orange-500/50 border-l-0 bg-black/40 backdrop-blur-xl">
                    <div className="p-4 bg-orange-500/5 border-b border-orange-500/10 flex justify-between items-center relative overflow-hidden">
                        {/* Scanning Line Animation */}
                        <div className="absolute top-0 bottom-0 w-[2px] bg-orange-500/50 animate-[scan_4s_ease-in-out_infinite] blur-[2px]"></div>

                        <h2 className="text-sm font-bold text-orange-200 tracking-widest uppercase flex items-center gap-2 z-10">
                            <Zap size={16} className="text-orange-500" /> Solar Intelligence
                        </h2>
                        <span className="text-[10px] text-green-400 font-mono flex items-center gap-1 z-10 bg-black/50 px-2 py-1 rounded border border-green-500/20">
                            <Activity size={10} className="animate-pulse" /> LIVE ANALYSIS
                        </span>
                    </div>

                    <div className="p-6 flex-1 flex flex-col gap-6 relative">
                        {/* Background Grid */}
                        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none"></div>

                        {/* Active Regions Status */}
                        <div className="bg-white/5 p-4 rounded-lg border border-white/5 shadow-inner relative overflow-hidden group hover:border-orange-500/30 transition-colors">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Sunspot Analysis</h3>
                                <div className="text-xs font-mono text-orange-300">{activeRegions.length} Detected</div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-orange-400 font-bold text-xl relative">
                                    {activeRegions.length}
                                    <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_red]"></div>
                                </div>
                                <div className="flex-1">
                                    <div className="h-1.5 w-full bg-gray-700 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-yellow-500 to-red-500 transition-all duration-1000"
                                            style={{ width: `${Math.min(activeRegions.length * 20, 100)}%` }}
                                        ></div>
                                    </div>
                                    <div className="flex justify-between mt-1 text-[9px] text-gray-500 font-mono uppercase">
                                        <span>Quiet</span>
                                        <span>Active</span>
                                        <span>Extreme</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Hybrid Engine Panel */}
                        <div className={`flex-1 flex flex-col border border-white/10 rounded-xl p-4 transition-all duration-500 bg-gradient-to-b from-transparent to-black/30 ${calculus.is_warning ? 'border-red-500/50 shadow-[0_0_20px_rgba(239,68,68,0.1)]' : ''}`}>
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Predictive Engine</div>
                                    <div className={`text-lg font-bold font-mono ${calculus.is_warning ? 'text-red-400' : 'text-blue-300'}`}>
                                        {calculus.engine_type}
                                    </div>
                                </div>
                                <div className={`px-2 py-1 rounded text-[10px] font-bold border ${calculus.is_warning ? 'bg-red-500/20 border-red-500 text-red-300 animate-pulse' : 'bg-green-500/10 border-green-500/30 text-green-400'}`}>
                                    {calculus.is_warning ? 'THREAT DETECTED' : 'NOMINAL'}
                                </div>
                            </div>

                            {/* Calculus Metrics */}
                            <div className="grid grid-cols-2 gap-3 mt-auto">
                                <div className="bg-black/40 rounded p-3 border border-white/5">
                                    <div className="text-[9px] text-gray-500 uppercase mb-1">Flux Slope (Δ)</div>
                                    <div className={`text-sm font-mono font-bold flex items-center gap-1 ${isRising ? 'text-orange-400' : 'text-blue-400'}`}>
                                        {isRising ? '▲' : '▼'} {slopeScientific}
                                    </div>
                                </div>
                                <div className="bg-black/40 rounded p-3 border border-white/5">
                                    <div className="text-[9px] text-gray-500 uppercase mb-1">Threat Probability</div>
                                    <div className="text-sm font-mono font-bold text-gray-300">
                                        {calculus.is_warning ? '> 85%' : '< 10%'}
                                    </div>
                                </div>
                            </div>

                            <div className="mt-3 text-[10px] text-gray-400 leading-tight border-t border-white/5 pt-2">
                                Analysis: <span className="text-gray-300">{calculus.details}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* CENTER: SOLAR FOCUS (Seamless & Feathered) */}
                <div className="relative flex flex-col items-center justify-center min-h-[500px] z-10">

                    {/* 1. Behind-Sun Glow (Feather/Atmosphere) */}
                    <div className="absolute inset-0 bg-orange-600/10 blur-[100px] rounded-full pointer-events-none scale-150 transform transition-all duration-1000 animate-pulse-slow"></div>

                    {/* 2. The 3D Sun (Floating freely) */}
                    <div className="w-full h-full flex items-center justify-center transition-transform duration-700">
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
                    <div className="p-6 grid grid-cols-1 gap-4 overflow-y-auto max-h-[600px] custom-scrollbar">

                        {/* 0. X-Ray Flux (Added by Request) */}
                        <StatBox
                            label="X-Ray Flux"
                            value={currentFlux.toExponential(2)}
                            unit="W/m²"
                            type="flux"
                            description="Intensity of solar flares measured by GOES satellites. High flux causes radio blackouts."
                        />

                        {/* 1. Solar Wind Speed (Dynamic) */}
                        {/* 1. Solar Wind Speed (Dynamic) */}
                        <StatBox
                            label="Wind Velocity"
                            value={telemetry.windSpeed.toFixed(0)}
                            unit="km/s"
                            type="wind"
                            description="Speed of solar particles hitting Earth. Speeds >800 km/s can trigger geomagnetic storms."
                        />

                        {/* 2. Kp Index (Dynamic) */}
                        {/* 2. Kp Index (Dynamic) */}
                        <StatBox
                            label="Geomagnetic Kp"
                            value={telemetry.kpIndex.toFixed(1)}
                            unit="Index"
                            type="kp"
                            description="Global geomagnetic activity index (0-9). Higher values mean stronger auroras and grid risk."
                        />

                        {/* 3. Proton Flux (Dynamic) */}
                        {/* 3. Proton Flux (Dynamic) */}
                        <StatBox
                            label="Proton Flux (>10MeV)"
                            value={telemetry.protonFlux.toExponential(1)}
                            unit="pfu"
                            type="proton"
                            description="Density of high-energy protons. High levels (S-Scale) endanger satellites and astronauts."
                        />

                        {/* 4. Density (Neutral) */}
                        {/* 4. Density (Neutral) */}
                        <StatBox
                            label="Plasma Density"
                            value={telemetry.density.toFixed(1)}
                            unit="p/cm³"
                            type="neutral"
                            description="Concentration of solar wind particles. High density amplifies the impact of geomagnetic storms."
                        />

                        {/* 5. Temperature (Neutral) */}
                        {/* 5. Temperature (Neutral) */}
                        <StatBox
                            label="Ion Temperature"
                            value={(telemetry.temperature / 1000).toFixed(0) + 'k'}
                            unit="Kelvin"
                            type="neutral"
                            description="Thermal energy of the solar wind. Hotter wind often indicates CMEs or coronal holes."
                        />
                    </div>
                </div>

            </div>

            {/* EDUCATIONAL INTELLIGENCE GRID */}
            <div className="max-w-7xl mx-auto mt-8">
                <div className="flex items-center gap-3 mb-6 px-4">
                    <div className="h-px bg-gradient-to-r from-transparent via-orange-500/50 to-transparent flex-1"></div>
                    <h3 className="text-xl font-bold text-orange-200 uppercase tracking-[0.2em] flex items-center gap-2 text-shadow-sm">
                        <Activity size={18} className="text-orange-500" />
                        Threat Intelligence Database
                    </h3>
                    <div className="h-px bg-gradient-to-r from-transparent via-orange-500/50 to-transparent flex-1"></div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* R-SCALE CARD */}
                    <div className="group relative bg-black/40 border border-red-500/30 rounded-xl overflow-hidden hover:border-red-500/60 transition-all duration-500 hover:shadow-[0_0_30px_rgba(239,68,68,0.1)]">
                        <div className="absolute inset-0 bg-gradient-to-b from-red-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        <div className="p-5 relative z-10">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <div className="text-[10px] text-red-500 font-mono mb-1">DATA-STREAM // 01</div>
                                    <h4 className="text-xl font-bold text-white flex items-center gap-2">
                                        R-SCALE
                                        <span className="text-xs bg-red-500/20 text-red-300 px-2 py-0.5 rounded font-mono">RADIO</span>
                                    </h4>
                                </div>
                                <Zap className="text-red-500 opacity-50 group-hover:opacity-100 transition-opacity" size={24} />
                            </div>

                            <div className="space-y-4">
                                <div className="bg-black/30 p-3 rounded border border-white/5">
                                    <div className="grid grid-cols-2 gap-2 text-[10px] text-gray-400 mb-2">
                                        <div className="uppercase tracking-wider">Trigger Source</div>
                                        <div className="text-right text-red-300 font-mono">X-Ray Flux</div>
                                        <div className="uppercase tracking-wider">Arrival Time</div>
                                        <div className="text-right text-red-300 font-mono">8.3 Minutes</div>
                                    </div>
                                    <div className="h-1 w-full bg-gray-800 rounded-full overflow-hidden">
                                        <div className="h-full w-3/4 bg-red-500 animate-pulse"></div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center justify-between text-xs p-2 bg-red-950/20 border-l-2 border-red-500/50 rounded-r">
                                        <span className="text-gray-300">R1-R2 (Minor)</span>
                                        <span className="text-red-400 font-bold">M-Class</span>
                                    </div>
                                    <div className="flex items-center justify-between text-xs p-2 bg-red-950/30 border-l-2 border-red-500 rounded-r">
                                        <span className="text-gray-200">R3-R5 (Extreme)</span>
                                        <span className="text-red-400 font-bold">X-Class</span>
                                    </div>
                                </div>

                                <div className="border-t border-white/5 pt-3">
                                    <p className="text-[10px] uppercase text-red-500/70 font-mono mb-1">Physics Analysis:</p>
                                    <p className="text-[11px] text-gray-300 leading-relaxed mb-2">
                                        A blast of high-energy photons (X-Rays/UV) traveling at light speed. It ionizes the "D-Region" of Earth's ionosphere, absorbing High Frequency (HF) radio waves.
                                    </p>
                                    <p className="text-[11px] text-gray-400">
                                        <span className="text-red-400 font-bold">IMPACT:</span> Immediate loss of HF radio contact on the sunlit side of Earth. Critical for aviation & maritime.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* G-SCALE CARD */}
                    <div className="group relative bg-black/40 border border-purple-500/30 rounded-xl overflow-hidden hover:border-purple-500/60 transition-all duration-500 hover:shadow-[0_0_30px_rgba(168,85,247,0.1)]">
                        <div className="absolute inset-0 bg-gradient-to-b from-purple-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        <div className="p-5 relative z-10">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <div className="text-[10px] text-purple-500 font-mono mb-1">DATA-STREAM // 02</div>
                                    <h4 className="text-xl font-bold text-white flex items-center gap-2">
                                        G-SCALE
                                        <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded font-mono">STORM</span>
                                    </h4>
                                </div>
                                <Wind className="text-purple-500 opacity-50 group-hover:opacity-100 transition-opacity" size={24} />
                            </div>

                            <div className="space-y-4">
                                <div className="bg-black/30 p-3 rounded border border-white/5">
                                    <div className="grid grid-cols-2 gap-2 text-[10px] text-gray-400 mb-2">
                                        <div className="uppercase tracking-wider">Trigger Source</div>
                                        <div className="text-right text-purple-300 font-mono">Kp Index</div>
                                        <div className="uppercase tracking-wider">Arrival Time</div>
                                        <div className="text-right text-purple-300 font-mono">15 - 72 Hours</div>
                                    </div>
                                    <div className="h-1 w-full bg-gray-800 rounded-full overflow-hidden">
                                        <div className="h-full w-1/2 bg-purple-500 animate-pulse"></div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center justify-between text-xs p-2 bg-purple-950/20 border-l-2 border-purple-500/50 rounded-r">
                                        <span className="text-gray-300">G1-G2 (Moderate)</span>
                                        <span className="text-purple-400 font-bold">Auroras</span>
                                    </div>
                                    <div className="flex items-center justify-between text-xs p-2 bg-purple-950/30 border-l-2 border-purple-500 rounded-r">
                                        <span className="text-gray-200">G4-G5 (Severe)</span>
                                        <span className="text-purple-400 font-bold">Grid Failure</span>
                                    </div>
                                </div>

                                <div className="border-t border-white/5 pt-3">
                                    <p className="text-[10px] uppercase text-purple-500/70 font-mono mb-1">Physics Analysis:</p>
                                    <p className="text-[11px] text-gray-300 leading-relaxed mb-2">
                                        A major disturbance in Earth's magnetosphere caused by a solar wind shockwave or CME impact. Can compress the magnetic field and induce ground currents.
                                    </p>
                                    <p className="text-[11px] text-gray-400">
                                        <span className="text-purple-400 font-bold">IMPACT:</span> Voltage instability, power grid collapse (GICs), and disruptions to GPS navigation systems.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* S-SCALE CARD */}
                    <div className="group relative bg-black/40 border border-yellow-500/30 rounded-xl overflow-hidden hover:border-yellow-500/60 transition-all duration-500 hover:shadow-[0_0_30px_rgba(234,179,8,0.1)]">
                        <div className="absolute inset-0 bg-gradient-to-b from-yellow-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        <div className="p-5 relative z-10">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <div className="text-[10px] text-yellow-500 font-mono mb-1">DATA-STREAM // 03</div>
                                    <h4 className="text-xl font-bold text-white flex items-center gap-2">
                                        S-SCALE
                                        <span className="text-xs bg-yellow-500/20 text-yellow-300 px-2 py-0.5 rounded font-mono">RADIATION</span>
                                    </h4>
                                </div>
                                <Activity className="text-yellow-500 opacity-50 group-hover:opacity-100 transition-opacity" size={24} />
                            </div>

                            <div className="space-y-4">
                                <div className="bg-black/30 p-3 rounded border border-white/5">
                                    <div className="grid grid-cols-2 gap-2 text-[10px] text-gray-400 mb-2">
                                        <div className="uppercase tracking-wider">Trigger Source</div>
                                        <div className="text-right text-yellow-300 font-mono">Proton Flux</div>
                                        <div className="uppercase tracking-wider">Arrival Time</div>
                                        <div className="text-right text-yellow-300 font-mono">15 Mins - Hours</div>
                                    </div>
                                    <div className="h-1 w-full bg-gray-800 rounded-full overflow-hidden">
                                        <div className="h-full w-2/3 bg-yellow-500 animate-pulse"></div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center justify-between text-xs p-2 bg-yellow-950/20 border-l-2 border-yellow-500/50 rounded-r">
                                        <span className="text-gray-300">S1-S2 (Biological)</span>
                                        <span className="text-yellow-400 font-bold">Astronauts</span>
                                    </div>
                                    <div className="flex items-center justify-between text-xs p-2 bg-yellow-950/30 border-l-2 border-yellow-500 rounded-r">
                                        <span className="text-gray-200">S3-S5 (Electronic)</span>
                                        <span className="text-yellow-400 font-bold">Satellites</span>
                                    </div>
                                </div>

                                <div className="border-t border-white/5 pt-3">
                                    <p className="text-[10px] uppercase text-yellow-500/70 font-mono mb-1">Physics Analysis:</p>
                                    <p className="text-[11px] text-gray-300 leading-relaxed mb-2">
                                        A "blizzard" of high-energy protons accelerated by a solar flare or CME. These particles physically bombard spacecraft and penetrate shielding.
                                    </p>
                                    <p className="text-[11px] text-gray-400">
                                        <span className="text-yellow-400 font-bold">IMPACT:</span> Single Event Upsets (SEUs) in satellite computers, solar panel degradation, and radiation risk to astronauts.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* TACTICAL SUMMARY FOOTER */}
                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4 opacity-60 hover:opacity-100 transition-opacity duration-500">
                    <div className="bg-white/5 rounded p-4 border-l-2 border-orange-500/30 flex items-center gap-4">
                        <div className="p-2 rounded-full bg-orange-500/10 text-orange-400">
                            <Activity size={16} />
                        </div>
                        <div className="text-[10px] text-gray-400">
                            <strong className="text-gray-200 block mb-0.5">SCALES SYNCHRONIZED</strong>
                            Real-time monitoring of NOAA R-Scale, G-Scale, and S-Scale threats via GOES-16 & DSCOVR.
                        </div>
                    </div>
                    <div className="bg-white/5 rounded p-4 border-l-2 border-blue-500/30 flex items-center gap-4">
                        <div className="p-2 rounded-full bg-blue-500/10 text-blue-400">
                            <Globe size={16} />
                        </div>
                        <div className="text-[10px] text-gray-400">
                            <strong className="text-gray-200 block mb-0.5">PLANETARY DEFENSE</strong>
                            Early warning system allows grid operators and satellite teams to mitigate damage.
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
