import React, { useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Label } from 'recharts';
import { useStore } from '../store/useStore';
import { format } from 'date-fns';
import { AlertTriangle, Activity, Wind, Zap, ZoomIn, ZoomOut, RefreshCw } from 'lucide-react';

type ChartMode = 'flux' | 'wind' | 'kp' | 'proton';

export const SolarChart: React.FC = () => {
    const { dataPoints, windHistory, kpHistory, protonHistory, currentFlux, activeGraphTab, setActiveGraphTab } = useStore();
    // Use Store State
    const mode = activeGraphTab;

    // Internal State
    const [dataWindow, setDataWindow] = useState<number>(1440); // Default 24h (minutes)

    const handleZoom = (direction: 'in' | 'out' | 'reset') => {
        const levels = [60, 180, 360, 720, 1440]; // 1h, 3h, 6h, 12h, 24h
        const currentIndex = levels.indexOf(dataWindow);

        if (direction === 'reset') setDataWindow(1440);
        else if (direction === 'in' && currentIndex > 0) setDataWindow(levels[currentIndex - 1]);
        else if (direction === 'out' && currentIndex < levels.length - 1) setDataWindow(levels[currentIndex + 1]);
    };

    // 0. Threat Logic Helper (Duplicated for standalone component robustness)
    const getStatusColor = (val: number, type: ChartMode): string => {
        switch (type) {
            case 'wind':
                if (val >= 900) return '#a855f7'; // Purple (Extreme)
                if (val >= 700) return '#ef4444'; // Red (Critical)
                if (val >= 500) return '#eab308'; // Yellow (Warning)
                return '#22c55e'; // Green
            case 'kp':
                if (val >= 8) return '#a855f7'; // Purple (Extreme)
                if (val >= 6) return '#ef4444'; // Red (Critical)
                if (val >= 5) return '#eab308'; // Yellow (Warning)
                return '#22c55e'; // Green
            case 'proton':
                if (val >= 1000) return '#a855f7'; // Purple (Extreme)
                if (val >= 100) return '#ef4444'; // Red (Critical)
                if (val >= 10) return '#eab308'; // Yellow (Warning)
                return '#22c55e'; // Green
            case 'flux':
            default:
                if (val >= 1e-4) return '#ef4444'; // X-Class
                if (val >= 1e-5) return '#f97316'; // M-Class
                return '#22c55e'; // Quiet
        }
    };

    // 1. Determine Data Source & Config based on Mode
    let chartData: any[] = [];
    let dataKey = "flux";
    let color = "#22c55e"; // Default Green
    let yDomain: [number | 'auto', number | 'auto'] = ['auto', 'auto'];
    let yScale: 'log' | 'linear' = 'linear';
    let label = "";
    let unit = "";

    // Check simulation (only applies to flux for now)
    const isSimulation = mode === 'flux' && dataPoints.length > 0 && dataPoints[dataPoints.length - 1].source === 'simulation';

    switch (mode) {
        case 'flux':
            chartData = dataPoints;
            dataKey = "flux";
            color = getStatusColor(currentFlux, 'flux');
            yDomain = [1e-9, 1e-2];
            yScale = 'log';
            label = "X-RAY FLUX";
            unit = "W/m²";
            break;
        case 'wind':
            chartData = windHistory;
            dataKey = "value";
            // Get latest value for color
            const latestWind = windHistory.length > 0 ? windHistory[windHistory.length - 1].value : 0;
            color = getStatusColor(latestWind, 'wind');
            yDomain = [200, 1000]; // Expanded to show >900 Extreme range
            yScale = 'linear';
            label = "SOLAR WIND";
            unit = "km/s";
            break;
        case 'kp':
            chartData = kpHistory;
            dataKey = "value";
            const latestKp = kpHistory.length > 0 ? kpHistory[kpHistory.length - 1].value : 0;
            color = getStatusColor(latestKp, 'kp');
            yDomain = [0, 10]; // 0-9 Scale with breathing room
            yScale = 'linear';
            label = "GEOMAGNETIC INDEX";
            unit = "Kp";
            break;
        case 'proton':
            chartData = protonHistory;
            dataKey = "value";
            const latestProton = protonHistory.length > 0 ? protonHistory[protonHistory.length - 1].value : 0;
            color = getStatusColor(latestProton, 'proton');
            yDomain = [0.1, 10000]; // 4 decades log scale
            yScale = 'log';
            label = "PROTON FLUX";
            unit = "pfu";
            break;
    }

    // Apply Zoom Slice
    const displayData = chartData.slice(-dataWindow);


    return (
        <div className={`bg-black/40 backdrop-blur-md border ${isSimulation ? 'border-yellow-500/50' : 'border-white/10'} p-4 rounded-xl shadow-2xl h-[450px] relative transition-colors duration-500`}>

            {/* HEADER & TABS */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">

                {/* Title - Fixed Width to prevent Layout Shift */}
                <div className="w-64 flex-shrink-0">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        {isSimulation ? (
                            <span className="flex items-center gap-2 text-yellow-500 animate-pulse">
                                <AlertTriangle size={20} /> TEST MODE: SIMULATED FLUX
                            </span>
                        ) : (
                            <>
                                <span className={`w-2 h-2 rounded-full animate-pulse`} style={{ backgroundColor: color }}></span>
                                {label} MONITOR
                            </>
                        )}
                    </h2>
                    <p className="text-[10px] text-gray-500 font-mono tracking-widest mt-1">REAL-TIME TELEMETRY</p>
                </div>

                {/* GRAPH CONTROLS (Zoom & Tab) */}
                <div className="flex gap-4">
                    {/* Zoom Controls */}
                    <div className="flex bg-black/40 p-1 rounded-lg border border-white/10">
                        <button onClick={() => handleZoom('in')} className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded transition-colors" title="Zoom In">
                            <ZoomIn size={14} />
                        </button>
                        <button onClick={() => handleZoom('out')} className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded transition-colors" title="Zoom Out">
                            <ZoomOut size={14} />
                        </button>
                        <button onClick={() => handleZoom('reset')} className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded transition-colors" title="Reset View">
                            <RefreshCw size={14} />
                        </button>
                    </div>

                    {/* Tab Controls */}
                    <div className="flex bg-black/40 p-1 rounded-lg border border-white/10">
                        <button
                            onClick={() => setActiveGraphTab('flux')}
                            className={`px-4 py-1.5 rounded flex items-center gap-2 text-xs font-bold transition-all ${mode === 'flux' ? 'bg-green-500/20 text-green-400 border border-green-500/50' : 'text-gray-500 hover:text-white'}`}
                        >
                            <Activity size={12} /> FLUX
                        </button>
                        <button
                            onClick={() => setActiveGraphTab('wind')}
                            className={`px-4 py-1.5 rounded flex items-center gap-2 text-xs font-bold transition-all ${mode === 'wind' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50' : 'text-gray-500 hover:text-white'}`}
                        >
                            <Wind size={12} /> WIND
                        </button>
                        <button
                            onClick={() => setActiveGraphTab('kp')}
                            className={`px-4 py-1.5 rounded flex items-center gap-2 text-xs font-bold transition-all ${mode === 'kp' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/50' : 'text-gray-500 hover:text-white'}`}
                        >
                            <Zap size={12} /> Kp
                        </button>
                        <button
                            onClick={() => setActiveGraphTab('proton')}
                            className={`px-4 py-1.5 rounded flex items-center gap-2 text-xs font-bold transition-all ${mode === 'proton' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50' : 'text-gray-500 hover:text-white'}`}
                        >
                            <Activity size={12} /> PROTONS
                        </button>
                    </div>
                </div>

                {/* CURRENT VALUE DISPLAY */}
                <div className="text-right hidden md:block">
                    <p className="text-xs text-gray-400">LATEST READING</p>
                    <p className="font-mono text-xl font-bold transition-colors duration-300" style={{ color: color }}>
                        {chartData.length > 0
                            ? (mode === 'flux'
                                ? chartData[chartData.length - 1].flux.toExponential(2)
                                : mode === 'proton'
                                    ? chartData[chartData.length - 1].value.toExponential(1)
                                    : chartData[chartData.length - 1].value.toFixed(1))
                            : "..."
                        } <span className="text-sm text-gray-500">{unit}</span>
                    </p>
                </div>
            </div>

            {/* CHART */}
            <ResponsiveContainer width="100%" height="80%">
                <AreaChart data={displayData}>
                    <defs>
                        <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={color} stopOpacity={0.6} />
                            <stop offset="95%" stopColor={color} stopOpacity={0.05} />
                        </linearGradient>
                        <filter id="glow" height="200%">
                            <feGaussianBlur in="SourceAlpha" stdDeviation="2" result="blur" />
                            <feOffset in="blur" dx="0" dy="0" result="offsetBlur" />
                            <feFlood floodColor={color} floodOpacity="0.6" result="offsetColor" />
                            <feComposite in="offsetColor" in2="offsetBlur" operator="in" result="offsetBlur" />
                            <feMerge>
                                <feMergeNode in="offsetBlur" />
                                <feMergeNode in="SourceGraphic" />
                            </feMerge>
                        </filter>
                    </defs>

                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />

                    <XAxis
                        dataKey="timestamp"
                        tickFormatter={(str) => {
                            try { return format(new Date(str), 'HH:mm') } catch { return "" }
                        }}
                        stroke="#666"
                        tick={{ fontSize: 10, fontFamily: 'Rajdhani', fill: '#666', fontWeight: 'bold' }}
                        tickLine={false}
                        axisLine={false}
                        minTickGap={30}
                    >
                        <Label value="TIME (UTC)" position="insideBottomRight" offset={-5} fill="#666" fontSize={10} fontFamily="Rajdhani" fontWeight="bold" />
                    </XAxis>

                    <YAxis
                        scale={yScale}
                        domain={yDomain}
                        stroke="#666"
                        tickFormatter={(val) => (mode === 'flux' || mode === 'proton') ? val.toExponential(0) : val}
                        width={50}
                        tick={{ fontSize: 10, fontFamily: 'Rajdhani', fill: '#666', fontWeight: 'bold' }}
                        tickLine={false}
                        axisLine={false}
                        ticks={mode === 'flux' ? [1e-9, 1e-8, 1e-7, 1e-6, 1e-5, 1e-4, 1e-3, 1e-2] : undefined}
                    />

                    <Tooltip
                        contentStyle={{
                            backgroundColor: 'rgba(0,0,0,0.85)',
                            borderColor: 'rgba(255,255,255,0.1)',
                            borderRadius: '4px',
                            backdropFilter: 'blur(8px)',
                            boxShadow: '0 0 20px rgba(0,0,0,0.5)'
                        }}
                        itemStyle={{ color: '#fff', fontFamily: 'Rajdhani', fontSize: '12px', letterSpacing: '0.05em' }}
                        formatter={(val: number) => [
                            (mode === 'flux' || mode === 'proton') ? val.toExponential(2) : val.toFixed(1),
                            label
                        ]}
                        labelFormatter={(label) => {
                            try { return format(new Date(label), 'HH:mm:ss') } catch { return "" }
                        }}
                        cursor={{ stroke: 'rgba(255,255,255,0.5)', strokeWidth: 1, strokeDasharray: '4 4' }}
                    />

                    {/* --- X-RAY FLUX THRESHOLDS --- */}
                    {mode === 'flux' && (
                        <>
                            <ReferenceLine y={1e-5} stroke="#f97316" strokeDasharray="5 5" strokeOpacity={0.6}>
                                <Label value="M-CLASS" position="insideTopRight" fill="#f97316" fontSize={10} fontFamily="Rajdhani" fontWeight="bold" offset={10} />
                            </ReferenceLine>
                            <ReferenceLine y={1e-4} stroke="#ef4444" strokeDasharray="10 5" strokeOpacity={0.8} strokeWidth={1}>
                                <Label value="X-CLASS (STORM)" position="insideTopRight" fill="#ef4444" fontSize={10} fontFamily="Rajdhani" fontWeight="bold" offset={10} />
                            </ReferenceLine>
                        </>
                    )}

                    {/* --- SOLAR WIND THRESHOLDS (Green < 500, Yellow 500-700, Red 700-900, Purple > 900) --- */}
                    {mode === 'wind' && (
                        <>
                            <ReferenceLine y={500} stroke="#eab308" strokeDasharray="5 5" strokeOpacity={0.6}>
                                <Label value="WARNING (>500)" position="insideTopRight" fill="#eab308" fontSize={10} fontFamily="Rajdhani" fontWeight="bold" offset={10} />
                            </ReferenceLine>
                            <ReferenceLine y={700} stroke="#ef4444" strokeDasharray="10 5" strokeOpacity={0.8}>
                                <Label value="CRITICAL (>700)" position="insideTopRight" fill="#ef4444" fontSize={10} fontFamily="Rajdhani" fontWeight="bold" offset={10} />
                            </ReferenceLine>
                            <ReferenceLine y={900} stroke="#a855f7" strokeDasharray="5 5" strokeOpacity={0.8}>
                                <Label value="EXTREME (>900)" position="insideTopRight" fill="#a855f7" fontSize={10} fontFamily="Rajdhani" fontWeight="bold" offset={10} />
                            </ReferenceLine>
                        </>
                    )}

                    {/* --- KP INDEX THRESHOLDS (Green < 5, Yellow 5, Red 6-7, Purple >= 8) --- */}
                    {mode === 'kp' && (
                        <>
                            <ReferenceLine y={5} stroke="#eab308" strokeDasharray="5 5" strokeOpacity={0.6}>
                                <Label value="UNSETTLED (5)" position="insideTopRight" fill="#eab308" fontSize={10} fontFamily="Rajdhani" fontWeight="bold" offset={10} />
                            </ReferenceLine>
                            <ReferenceLine y={6} stroke="#ef4444" strokeDasharray="10 5" strokeOpacity={0.8}>
                                <Label value="STORM G2 (>6)" position="insideTopRight" fill="#ef4444" fontSize={10} fontFamily="Rajdhani" fontWeight="bold" offset={10} />
                            </ReferenceLine>
                            <ReferenceLine y={8} stroke="#a855f7" strokeDasharray="5 5" strokeOpacity={0.8}>
                                <Label value="EXTREME G4 (>8)" position="insideTopRight" fill="#a855f7" fontSize={10} fontFamily="Rajdhani" fontWeight="bold" offset={10} />
                            </ReferenceLine>
                        </>
                    )}

                    {/* --- PROTON FLUX THRESHOLDS (Green < 10, Yellow >= 10, Red >= 100, Purple >= 1000) --- */}
                    {mode === 'proton' && (
                        <>
                            <ReferenceLine y={10} stroke="#eab308" strokeDasharray="5 5" strokeOpacity={0.8}>
                                <Label value="S1 MINOR" position="insideTopRight" fill="#eab308" fontSize={10} fontFamily="Rajdhani" fontWeight="bold" offset={10} />
                            </ReferenceLine>
                            <ReferenceLine y={100} stroke="#ef4444" strokeDasharray="10 5" strokeOpacity={0.8}>
                                <Label value="S2 MODERATE" position="insideTopRight" fill="#ef4444" fontSize={10} fontFamily="Rajdhani" fontWeight="bold" offset={10} />
                            </ReferenceLine>
                            <ReferenceLine y={1000} stroke="#a855f7" strokeDasharray="5 5" strokeOpacity={0.8}>
                                <Label value="S3 STRONG" position="insideTopRight" fill="#a855f7" fontSize={10} fontFamily="Rajdhani" fontWeight="bold" offset={10} />
                            </ReferenceLine>
                        </>
                    )}

                    <Area
                        type="monotone"
                        dataKey={dataKey}
                        stroke={color}
                        fill="url(#colorGradient)"
                        isAnimationActive={false}
                        strokeWidth={2}
                        filter="url(#glow)"
                        activeDot={{ r: 6, strokeWidth: 0, fill: '#fff', className: 'animate-ping' }}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
};