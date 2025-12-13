import React from 'react';
import { SolarGlobe } from '../SolarGlobe';
import { Wind, Zap, Activity } from 'lucide-react';
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
}

const StatBox: React.FC<StatBoxProps> = ({ label, value, unit, type }) => {
    // For 'neutral' types (like Density/Temp), defaults to Blue style
    const style = type === 'neutral'
        ? { color: 'text-blue-400', bg: 'bg-blue-950/30', border: 'border-blue-500/10', status: '', pulse: false }
        : getStatusColor(type, typeof value === 'number' ? value : 0);

    return (
        <div className={`${style.bg} p-4 rounded border ${style.border} transition-all duration-500`}>
            <div className="flex justify-between items-center mb-1">
                <p className={`text-[10px] uppercase tracking-wider ${style.color}`}>{label}</p>
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
                    <div className="p-6 grid grid-cols-1 gap-4 overflow-y-auto max-h-[600px] custom-scrollbar">

                        {/* 0. X-Ray Flux (Added by Request) */}
                        <StatBox
                            label="X-Ray Flux"
                            value={currentFlux.toExponential(2)}
                            unit="W/m²"
                            type="flux"
                        />

                        {/* 1. Solar Wind Speed (Dynamic) */}
                        <StatBox
                            label="Wind Velocity"
                            value={telemetry.windSpeed.toFixed(0)}
                            unit="km/s"
                            type="wind"
                        />

                        {/* 2. Kp Index (Dynamic) */}
                        <StatBox
                            label="Geomagnetic Kp"
                            value={telemetry.kpIndex.toFixed(1)}
                            unit="Index"
                            type="kp"
                        />

                        {/* 3. Proton Flux (Dynamic) */}
                        <StatBox
                            label="Proton Flux (>10MeV)"
                            value={telemetry.protonFlux.toExponential(1)}
                            unit="pfu"
                            type="proton"
                        />

                        {/* 4. Density (Neutral) */}
                        <StatBox
                            label="Plasma Density"
                            value={telemetry.density.toFixed(1)}
                            unit="p/cm³"
                            type="neutral"
                        />

                        {/* 5. Temperature (Neutral) */}
                        <StatBox
                            label="Ion Temperature"
                            value={(telemetry.temperature / 1000).toFixed(0) + 'k'}
                            unit="Kelvin"
                            type="neutral"
                        />
                    </div>
                </div>

            </div>

            {/* EDUCATIONAL INFO BOX */}
            <div className="glass-card p-6 border-l-4 border-l-orange-500/50 max-w-6xl mx-auto">
                <h3 className="text-2xl font-bold text-orange-200 mb-4 flex items-center gap-2">
                    <Activity size={22} className="text-orange-500" />
                    Official NOAA Space Weather Scales
                </h3>
                <p className="text-sm text-gray-300 leading-relaxed mb-6">
                    Helios-Watch implements the <span className="text-orange-300 font-semibold">Official NOAA Space Weather Scales</span>, not arbitrary color coding. Our threat levels are based on internationally recognized scientific standards used by space weather forecasters worldwide. Below are the three distinct threat types monitored by this system.
                </p>

                {/* Three Threat Types Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                    
                    {/* Radio Blackouts (R-Scale) */}
                    <div className="bg-red-950/20 border border-red-500/30 rounded-lg p-5">
                        <h4 className="text-lg font-bold text-red-400 mb-2 flex items-center gap-2">
                            <Zap size={16} />
                            Radio Blackouts (R-Scale)
                        </h4>
                        <div className="text-xs text-gray-400 mb-3 space-y-1">
                            <p><span className="text-red-300 font-semibold">Trigger:</span> X-Ray Flux (Solar Flares)</p>
                            <p><span className="text-red-300 font-semibold">Sensor:</span> GOES-16 X-Ray Sensor</p>
                            <p><span className="text-red-300 font-semibold">Speed:</span> Speed of Light (8 minutes to Earth)</p>
                        </div>
                        <p className="text-xs text-gray-300 leading-relaxed mb-3">
                            A blast of high-energy photons that ionizes Earth's upper atmosphere (Ionosphere), disrupting radio communications.
                        </p>
                        <div className="space-y-2 text-xs">
                            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded p-2">
                                <span className="font-bold text-yellow-400">R1-R2 (M-Class):</span>
                                <span className="text-gray-300"> Minor radio interference</span>
                            </div>
                            <div className="bg-orange-500/10 border border-orange-500/30 rounded p-2">
                                <span className="font-bold text-orange-400">R3 (X1):</span>
                                <span className="text-gray-300"> Wide area HF radio blackout for 1 hour</span>
                            </div>
                            <div className="bg-red-500/10 border border-red-500/30 rounded p-2">
                                <span className="font-bold text-red-400">R4-R5 (X10+):</span>
                                <span className="text-gray-300"> Complete HF blackout on sunlit side for hours</span>
                            </div>
                        </div>
                        <p className="text-xs text-blue-300 mt-3 italic">
                            <span className="font-semibold">Impact:</span> Aviation & Maritime lose HF radio contact over oceans
                        </p>
                    </div>

                    {/* Geomagnetic Storms (G-Scale) */}
                    <div className="bg-purple-950/20 border border-purple-500/30 rounded-lg p-5">
                        <h4 className="text-lg font-bold text-purple-400 mb-2 flex items-center gap-2">
                            <Zap size={16} />
                            Geomagnetic Storms (G-Scale)
                        </h4>
                        <div className="text-xs text-gray-400 mb-3 space-y-1">
                            <p><span className="text-purple-300 font-semibold">Trigger:</span> Kp Index (Planetary K-index)</p>
                            <p><span className="text-purple-300 font-semibold">Sensor:</span> Ground Magnetometers</p>
                            <p><span className="text-purple-300 font-semibold">Speed:</span> 15 to 72 hours to arrive</p>
                        </div>
                        <p className="text-xs text-gray-300 leading-relaxed mb-3">
                            Disturbance in Earth's magnetic field caused by Solar Wind shockwave or CME (Coronal Mass Ejection).
                        </p>
                        <div className="space-y-2 text-xs">
                            <div className="bg-green-500/10 border border-green-500/30 rounded p-2">
                                <span className="font-bold text-green-400">G1-G2 (Kp 5-6):</span>
                                <span className="text-gray-300"> Weak grid fluctuations, high-latitude auroras</span>
                            </div>
                            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded p-2">
                                <span className="font-bold text-yellow-400">G3 (Kp 7):</span>
                                <span className="text-gray-300"> Voltage alarms, satellite drag corrections needed</span>
                            </div>
                            <div className="bg-orange-500/10 border border-orange-500/30 rounded p-2">
                                <span className="font-bold text-orange-400">G4 (Kp 8):</span>
                                <span className="text-gray-300"> Voltage control problems, protective systems trip</span>
                            </div>
                            <div className="bg-red-500/10 border border-red-500/30 rounded p-2">
                                <span className="font-bold text-red-400">G5 (Kp 9):</span>
                                <span className="text-gray-300"> Grid collapse, transformers melt, GPS useless</span>
                            </div>
                        </div>
                        <p className="text-xs text-blue-300 mt-3 italic">
                            <span className="font-semibold">Impact:</span> Power Grid operators monitor GICs (Geomagnetically Induced Currents)
                        </p>
                    </div>

                    {/* Solar Radiation Storms (S-Scale) */}
                    <div className="bg-yellow-950/20 border border-yellow-500/30 rounded-lg p-5">
                        <h4 className="text-lg font-bold text-yellow-400 mb-2 flex items-center gap-2">
                            <Zap size={16} />
                            Solar Radiation Storms (S-Scale)
                        </h4>
                        <div className="text-xs text-gray-400 mb-3 space-y-1">
                            <p><span className="text-yellow-300 font-semibold">Trigger:</span> Proton Flux (&gt;10 MeV)</p>
                            <p><span className="text-yellow-300 font-semibold">Sensor:</span> GOES-16 SEISS</p>
                            <p><span className="text-yellow-300 font-semibold">Speed:</span> Relativistic (15 min to hours)</p>
                        </div>
                        <p className="text-xs text-gray-300 leading-relaxed mb-3">
                            A "blizzard" of high-energy protons that physically bombard satellites and penetrate materials.
                        </p>
                        <div className="space-y-2 text-xs">
                            <div className="bg-green-500/10 border border-green-500/30 rounded p-2">
                                <span className="font-bold text-green-400">S1 (Minor):</span>
                                <span className="text-gray-300"> No significant impact</span>
                            </div>
                            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded p-2">
                                <span className="font-bold text-yellow-400">S2-S3 (Moderate):</span>
                                <span className="text-gray-300"> Single Event Upsets (SEUs) in satellites</span>
                            </div>
                            <div className="bg-red-500/10 border border-red-500/30 rounded p-2">
                                <span className="font-bold text-red-400">S4-S5 (Severe):</span>
                                <span className="text-gray-300"> Solar panel degradation, ISS crew takes shelter</span>
                            </div>
                        </div>
                        <p className="text-xs text-blue-300 mt-3 italic">
                            <span className="font-semibold">Impact:</span> Satellite operators enable Safe Mode to protect electronics
                        </p>
                    </div>
                </div>

                {/* Summary Table */}
                <div className="bg-black/40 border border-white/10 rounded-lg p-4">
                    <h4 className="text-sm font-bold text-gray-300 mb-3 uppercase tracking-wider">Summary: Threat Types</h4>
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                            <thead className="border-b border-white/10">
                                <tr className="text-left">
                                    <th className="pb-2 px-3 text-orange-300 font-semibold">Threat Type</th>
                                    <th className="pb-2 px-3 text-orange-300 font-semibold">Trigger</th>
                                    <th className="pb-2 px-3 text-orange-300 font-semibold">Physics</th>
                                    <th className="pb-2 px-3 text-orange-300 font-semibold">Target</th>
                                </tr>
                            </thead>
                            <tbody className="text-gray-300">
                                <tr className="border-b border-white/5">
                                    <td className="py-2 px-3 font-bold text-red-400">Radio Blackout</td>
                                    <td className="py-2 px-3">X-Ray Flux</td>
                                    <td className="py-2 px-3">Light (Ionization)</td>
                                    <td className="py-2 px-3">Aviation (Radio Comms)</td>
                                </tr>
                                <tr className="border-b border-white/5">
                                    <td className="py-2 px-3 font-bold text-purple-400">Geomagnetic Storm</td>
                                    <td className="py-2 px-3">Kp Index</td>
                                    <td className="py-2 px-3">Magnetism (Induction)</td>
                                    <td className="py-2 px-3">Power Grids (Transformers)</td>
                                </tr>
                                <tr>
                                    <td className="py-2 px-3 font-bold text-yellow-400">Radiation Storm</td>
                                    <td className="py-2 px-3">Proton Flux</td>
                                    <td className="py-2 px-3">Particles (Bombardment)</td>
                                    <td className="py-2 px-3">Satellites (Electronics)</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <p className="text-xs text-gray-400 mt-4 text-center italic">
                    Helios-Watch integrates real-time data from NOAA's Space Weather Prediction Center to monitor all three threat scales simultaneously.
                </p>
            </div>
        </div>
    );
};
