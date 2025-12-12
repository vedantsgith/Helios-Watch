import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Label } from 'recharts';
import { useStore } from '../store/useStore';
import { format } from 'date-fns';
import { AlertTriangle } from 'lucide-react';

export const SolarChart: React.FC = () => {
    const { dataPoints, currentFlux } = useStore();

    // Check if we are in simulation mode (look at the last data point)
    const isSimulation = dataPoints.length > 0 && dataPoints[dataPoints.length - 1].source === 'simulation';

    const getStrokeColor = () => {
        if (currentFlux >= 1e-4) return '#ff0000'; // X-Class
        if (currentFlux >= 1e-5) return '#ff6600'; // M-Class
        return '#00ff00'; // Quiet
    };

    return (
        <div className={`bg-black/40 backdrop-blur-md border ${isSimulation ? 'border-yellow-500/50' : 'border-white/10'} p-4 rounded-xl shadow-2xl h-[450px] relative transition-colors duration-500`}>

            {/* HEADER */}
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    {isSimulation ? (
                        <span className="flex items-center gap-2 text-yellow-500 animate-pulse">
                            <AlertTriangle size={20} /> TEST MODE: SIMULATED FLUX
                        </span>
                    ) : (
                        <>
                            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                            GOES-16 X-Ray Flux (Primary)
                        </>
                    )}
                </h2>
                <div className="text-right">
                    <p className="text-xs text-gray-400">CURRENT FLUX</p>
                    <p className="font-mono text-xl font-bold transition-colors duration-300" style={{ color: getStrokeColor() }}>
                        {currentFlux.toExponential(2)} <span className="text-sm text-gray-500">W/m²</span>
                    </p>
                </div>
            </div>

            {/* CHART */}
            <ResponsiveContainer width="100%" height="85%">
                <AreaChart data={dataPoints}>
                    <defs>
                        <linearGradient id="colorFlux" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={getStrokeColor()} stopOpacity={0.6} />
                            <stop offset="95%" stopColor={getStrokeColor()} stopOpacity={0.05} />
                        </linearGradient>
                        <filter id="glow" height="200%">
                            <feGaussianBlur in="SourceAlpha" stdDeviation="2" result="blur" />
                            <feOffset in="blur" dx="0" dy="0" result="offsetBlur" />
                            <feFlood floodColor={getStrokeColor()} floodOpacity="0.6" result="offsetColor" />
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
                        tickFormatter={(str) => format(new Date(str), 'HH:mm')}
                        stroke="#666"
                        tick={{ fontSize: 10, fontFamily: 'Rajdhani', fill: '#666', fontWeight: 'bold' }}
                        tickLine={false}
                        axisLine={false}
                        minTickGap={30}
                    />

                    <YAxis
                        scale="log"
                        domain={[1e-9, 1e-2]}
                        stroke="#666"
                        tickFormatter={(val) => val.toExponential(0)}
                        width={50}
                        tick={{ fontSize: 10, fontFamily: 'Rajdhani', fill: '#666', fontWeight: 'bold' }}
                        tickLine={false}
                        axisLine={false}
                        ticks={[1e-9, 1e-8, 1e-7, 1e-6, 1e-5, 1e-4, 1e-3, 1e-2]}
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
                        formatter={(val: number) => [val.toExponential(2) + ' W/m²', 'FLUX INTENSITY']}
                        labelFormatter={(label) => format(new Date(label), 'HH:mm:ss')}
                        cursor={{ stroke: 'rgba(255,255,255,0.5)', strokeWidth: 1, strokeDasharray: '4 4' }}
                    />

                    {/* M-Class Threshold - ORANGE */}
                    <ReferenceLine y={1e-5} stroke="#f97316" strokeDasharray="5 5" strokeOpacity={0.6}>
                        <Label value="M-CLASS" position="insideTopRight" fill="#f97316" fontSize={10} fontFamily="Rajdhani" fontWeight="bold" offset={10} />
                    </ReferenceLine>

                    {/* X-Class Threshold - RED */}
                    <ReferenceLine y={1e-4} stroke="#ef4444" strokeDasharray="10 5" strokeOpacity={0.8} strokeWidth={1}>
                        <Label value="X-CLASS (STORM)" position="insideTopRight" fill="#ef4444" fontSize={10} fontFamily="Rajdhani" fontWeight="bold" offset={10} />
                    </ReferenceLine>

                    <Area
                        type="monotone"
                        dataKey="flux"
                        stroke={getStrokeColor()}
                        fill="url(#colorFlux)"
                        isAnimationActive={false}
                        strokeWidth={2}
                        filter="url(#glow)"
                        activeDot={{ r: 5, strokeWidth: 0, fill: '#fff', className: 'animate-ping' }}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
};