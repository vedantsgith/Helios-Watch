import React, { useState, useEffect } from 'react';
import { useStore } from '../../store/useStore';
import { AlertTriangle, Play, TrendingUp } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';

// Historical Events Data
const HISTORICAL_EVENTS = [
    {
        id: 'carrington-1859',
        name: 'Carrington Event 1859',
        flareClass: 'X45',
        kpIndex: 9,
        windSpeed: 2000,
        flux: 4.5e-3,
        date: '1859-09-01',
        color: '#ef4444',
        description: 'Largest geomagnetic storm on record. Telegraph wires caught fire; auroras visible in the Caribbean.',
        impact: 'Telegraph systems worldwide disrupted',
    },
    {
        id: 'quebec-1989',
        name: 'Quebec Blackout 1989',
        flareClass: 'X15',
        kpIndex: 9,
        windSpeed: 800,
        flux: 1.5e-3,
        date: '1989-03-13',
        color: '#f97316',
        description: 'Collapsed Hydro-Québec power grid in 90 seconds, leaving 6 million people without power for 9 hours.',
        impact: 'Complete power grid failure',
    },
    {
        id: 'bastille-2000',
        name: 'Bastille Day Event 2000',
        flareClass: 'X5.7',
        kpIndex: 9,
        windSpeed: 1100,
        flux: 5.7e-4,
        date: '2000-07-14',
        color: '#f59e0b',
        description: 'Severe radiation storm. Blinded satellites, caused short circuits in spacecraft, and degraded GPS.',
        impact: 'Satellite damage & GPS disruption',
    },
    {
        id: 'halloween-2003',
        name: 'Halloween Storms 2003',
        flareClass: 'X28+',
        kpIndex: 9,
        windSpeed: 1500,
        flux: 2.8e-3,
        date: '2003-10-28',
        color: '#dc2626',
        description: 'Largest solar flare measured by modern sensors. Forced ISS astronauts to shelter; Sweden power outage.',
        impact: 'ISS evacuation & power outages',
    },
    {
        id: 'may-2024',
        name: 'G5 May Storm 2024',
        flareClass: 'X5.8',
        kpIndex: 9,
        windSpeed: 900,
        flux: 5.8e-4,
        date: '2024-05-10',
        color: '#eab308',
        description: 'Most recent extreme event. Auroras visible as far south as Florida and India; significant GPS degradation.',
        impact: 'Global auroras & GPS disruption',
    },
];

// Generate realistic event data for 6 seconds of graph animation
const generateEventData = (event: typeof HISTORICAL_EVENTS[0]) => {
    const points = [];
    const duration = 6; // 6 seconds
    const peakTime = 3; // Peak at 3 seconds
    
    for (let i = 0; i <= duration * 10; i++) {
        const t = i / 10;
        const progress = t / duration;
        
        // Create a realistic flare profile with rise and decay
        let intensity;
        if (t < peakTime) {
            // Rise phase (fast)
            intensity = Math.pow(t / peakTime, 1.5) * event.flux;
        } else {
            // Decay phase (slower)
            const decayProgress = (t - peakTime) / (duration - peakTime);
            intensity = event.flux * Math.exp(-decayProgress * 2);
        }
        
        // Add some realistic noise
        intensity *= (1 + (Math.random() - 0.5) * 0.1);
        
        points.push({
            time: t.toFixed(1),
            flux: intensity,
            windSpeed: event.windSpeed * (0.8 + Math.random() * 0.4),
            kpIndex: Math.min(9, event.kpIndex * (0.7 + progress * 0.3)),
        });
    }
    
    return points;
};

export const HistoryView: React.FC = () => {
    const { addDataPoint } = useStore();
    const [selectedEvent, setSelectedEvent] = useState<typeof HISTORICAL_EVENTS[0] | null>(null);
    const [graphData, setGraphData] = useState<any[]>([]);
    const [isPlaying, setIsPlaying] = useState(false);

    const playEvent = (event: typeof HISTORICAL_EVENTS[0]) => {
        setSelectedEvent(event);
        setIsPlaying(true);
        
        const data = generateEventData(event);
        setGraphData(data);
        
        // Auto-stop after 6 seconds
        setTimeout(() => {
            setIsPlaying(false);
        }, 6000);
    };

    useEffect(() => {
        if (!isPlaying && graphData.length > 0) {
            // Keep the graph visible for a moment after animation ends
            const timer = setTimeout(() => {
                // Don't clear - keep the final state visible
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [isPlaying, graphData]);

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
        <div className="flex flex-col min-h-[60vh] gap-8 animate-in fade-in duration-500 p-6">
            <h2 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 to-orange-500 tracking-widest uppercase mb-4 drop-shadow-md text-center">
                Historical Archives
            </h2>

            {/* Graph Display Area */}
            {selectedEvent && graphData.length > 0 && (
                <div className="glass-card p-6 mb-6 animate-in slide-in-from-top duration-500">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h3 className="text-2xl font-bold text-white mb-1">{selectedEvent.name}</h3>
                            <p className="text-sm text-gray-400">{selectedEvent.description}</p>
                        </div>
                        <div className="flex gap-4 text-right">
                            <div>
                                <div className="text-xs text-gray-400">Flare Class</div>
                                <div className="text-2xl font-bold text-red-400">{selectedEvent.flareClass}</div>
                            </div>
                            <div>
                                <div className="text-xs text-gray-400">Kp Index</div>
                                <div className="text-2xl font-bold text-orange-400">{selectedEvent.kpIndex}</div>
                            </div>
                            <div>
                                <div className="text-xs text-gray-400">Wind Speed</div>
                                <div className="text-2xl font-bold text-yellow-400">{selectedEvent.windSpeed} km/s</div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                        {/* X-Ray Flux */}
                        <div className="glass-card p-4">
                            <h4 className="text-sm font-bold text-gray-300 mb-3 flex items-center gap-2">
                                <TrendingUp size={16} className="text-red-400" />
                                X-Ray Flux
                            </h4>
                            <ResponsiveContainer width="100%" height={150}>
                                <AreaChart data={graphData}>
                                    <defs>
                                        <linearGradient id="fluxGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <XAxis dataKey="time" stroke="#666" tick={{fontSize: 10}} />
                                    <YAxis stroke="#666" tick={{fontSize: 10}} />
                                    <Tooltip 
                                        contentStyle={{backgroundColor: 'rgba(0,0,0,0.9)', border: '1px solid #333'}}
                                        formatter={(value: any) => `${(value as number).toExponential(2)} W/m²`}
                                    />
                                    <Area type="monotone" dataKey="flux" stroke="#ef4444" fillOpacity={1} fill="url(#fluxGradient)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Solar Wind Speed */}
                        <div className="glass-card p-4">
                            <h4 className="text-sm font-bold text-gray-300 mb-3 flex items-center gap-2">
                                <TrendingUp size={16} className="text-yellow-400" />
                                Solar Wind Speed
                            </h4>
                            <ResponsiveContainer width="100%" height={150}>
                                <LineChart data={graphData}>
                                    <XAxis dataKey="time" stroke="#666" tick={{fontSize: 10}} />
                                    <YAxis stroke="#666" tick={{fontSize: 10}} />
                                    <Tooltip 
                                        contentStyle={{backgroundColor: 'rgba(0,0,0,0.9)', border: '1px solid #333'}}
                                        formatter={(value: any) => `${Math.round(value as number)} km/s`}
                                    />
                                    <Line type="monotone" dataKey="windSpeed" stroke="#eab308" strokeWidth={2} dot={false} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Kp Index */}
                        <div className="glass-card p-4">
                            <h4 className="text-sm font-bold text-gray-300 mb-3 flex items-center gap-2">
                                <TrendingUp size={16} className="text-orange-400" />
                                Geomagnetic Activity (Kp)
                            </h4>
                            <ResponsiveContainer width="100%" height={150}>
                                <LineChart data={graphData}>
                                    <XAxis dataKey="time" stroke="#666" tick={{fontSize: 10}} />
                                    <YAxis stroke="#666" tick={{fontSize: 10}} domain={[0, 9]} />
                                    <Tooltip 
                                        contentStyle={{backgroundColor: 'rgba(0,0,0,0.9)', border: '1px solid #333'}}
                                        formatter={(value: any) => `Kp ${(value as number).toFixed(1)}`}
                                    />
                                    <Line type="monotone" dataKey="kpIndex" stroke="#f97316" strokeWidth={2} dot={false} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                        <div className="text-xs text-gray-400 mb-1">Impact</div>
                        <div className="text-sm text-white font-semibold">{selectedEvent.impact}</div>
                    </div>
                </div>
            )}

            {/* Event Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 max-w-7xl w-full mx-auto">
                {HISTORICAL_EVENTS.map((event) => (
                    <button
                        key={event.id}
                        onClick={() => playEvent(event)}
                        disabled={isPlaying}
                        className="glass-card group p-6 flex flex-col items-center gap-4 hover:bg-white/5 transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{borderColor: selectedEvent?.id === event.id ? event.color : 'transparent', borderWidth: 2}}
                    >
                        <div className="p-4 rounded-full bg-red-500/10 group-hover:bg-red-500/20 transition-colors" style={{backgroundColor: `${event.color}20`}}>
                            <AlertTriangle size={32} style={{color: event.color}} />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-lg font-bold text-white mb-1">{event.name}</h3>
                            <div className="flex gap-2 mb-2">
                                <span className="text-xs font-bold px-2 py-1 rounded bg-red-500/20 text-red-300">{event.flareClass}</span>
                                <span className="text-xs font-bold px-2 py-1 rounded bg-orange-500/20 text-orange-300">Kp{event.kpIndex}</span>
                            </div>
                            <p className="text-xs text-gray-400 line-clamp-3">{event.description}</p>
                        </div>
                        <div className="mt-auto flex items-center gap-2 text-xs font-bold tracking-widest opacity-0 group-hover:opacity-100 transition-opacity" style={{color: event.color}}>
                            <Play size={10} fill="currentColor" /> {isPlaying && selectedEvent?.id === event.id ? 'PLAYING...' : 'REPLAY EVENT'}
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
};
