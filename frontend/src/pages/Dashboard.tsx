import { useEffect } from 'react';
import { SolarChart } from '../components/SolarChart';
import { EarthGlobe } from '../components/EarthGlobe';
import { JudgeControlPanel } from '../components/JudgeControlPanel';
import { FullScreenAlert } from '../components/FullScreenAlert';
import { useStore } from '../store/useStore';
import { Globe, Radio, Server, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

// Configure Axios
const api = axios.create({
    baseURL: 'http://127.0.0.1:8001',
    withCredentials: true
});

export function Dashboard() {
    const { addDataPoint, systemStatus, setSystemStatus, currentFlux, user, setUser } = useStore();
    const navigate = useNavigate();

    useEffect(() => {
        // CONNECT TO WEBSOCKET
        const ws = new WebSocket('ws://127.0.0.1:8001/ws');

        ws.onopen = () => setSystemStatus('ONLINE');
        ws.onclose = () => setSystemStatus('OFFLINE');

        ws.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                if (message.type === 'data_update') {
                    addDataPoint(message.payload);
                } else if (message.type === 'history_update') {
                    // message.payload.history is the array
                    useStore.getState().setHistory(message.payload.history);
                }
            } catch (e) {
                console.error("WS Parse Error", e);
            }
        };

        return () => ws.close();
    }, [addDataPoint, setSystemStatus]);

    const handleLogout = async () => {
        try {
            await api.post('/api/auth/logout');
            setUser(null);
            navigate('/login');
        } catch (e) {
            console.error("Logout failed", e);
        }
    };

    return (
        <div className="min-h-screen text-white p-4 lg:p-8 relative overflow-hidden font-sans">
            {/* BACKGROUND & EFFECTS */}
            <div className="solar-bg"></div>
            <div className="scanlines"></div>
            <div className="vignette"></div>
            <FullScreenAlert />

            {/* SIMULATION BANNER */}
            {useStore((state) => state.simulationActive) && (
                <div className="fixed top-0 left-0 right-0 z-50 bg-red-600/90 text-white text-center py-1 font-bold animate-pulse tracking-[0.2em] border-b border-red-500 shadow-[0_0_20px_rgba(255,0,0,0.5)]">
                    ⚠ SIMULATION MODE ACTIVE ⚠
                </div>
            )}

            {/* HEADER */}
            <header className="flex justify-between items-end mb-8 border-b border-white/10 pb-4 relative z-10">
                <div>
                    <h1 className="text-6xl font-extrabold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-red-400 to-yellow-200 drop-shadow-[0_0_10px_rgba(255,100,0,0.5)]">
                        Helios-Watch
                    </h1>
                    <p className="text-orange-200/60 text-sm mt-1 tracking-[0.3em] uppercase opacity-80">
                        Real-time Solar Anomaly Detector
                    </p>
                </div>

                {/* Status Pills */}
                <div className="flex gap-3 items-center">

                    <div className="text-right mr-4 hidden md:block">
                        <p className="text-[10px] uppercase text-gray-400 tracking-widest">Logged in as</p>
                        <p className="text-sm font-bold text-orange-200">{user?.email}</p>
                    </div>

                    <div className="glass-card !rounded-full px-6 py-2 flex items-center gap-3">
                        <Server size={14} className={systemStatus === 'ONLINE' ? "text-green-400" : "text-red-400"} />
                        <span className="text-sm font-bold text-gray-200">{systemStatus}</span>
                    </div>
                    <div className="glass-card !rounded-full px-6 py-2 flex items-center gap-3">
                        <Radio size={14} className="text-blue-400 animate-pulse" />
                        <span className="text-sm font-bold text-gray-200">LIVE FEED</span>
                    </div>

                    <button
                        onClick={handleLogout}
                        className="glass-card !rounded-full px-4 py-2 flex items-center gap-2 hover:bg-white/10 transition-colors cursor-pointer text-red-300 border-red-500/30"
                        title="Logout"
                    >
                        <LogOut size={14} />
                    </button>
                </div>
            </header>

            {/* MAIN GRID */}
            <main className="grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10">

                {/* LEFT COLUMN: CHARTS (Takes up 8 columns) */}
                <div className="lg:col-span-8 flex flex-col gap-6">
                    <div className="glass-card p-6">
                        <SolarChart />
                    </div>

                    {/* Quick Metrics (Below Chart) */}
                    <div className="grid grid-cols-3 gap-4">
                        <div className="glass-card p-6 flex flex-col justify-center">
                            <p className="text-gray-500 text-xs uppercase mb-1">Active Region</p>
                            <p className="text-3xl font-bold text-white">AR3514</p>
                        </div>
                        <div className="glass-card p-6 flex flex-col justify-center">
                            <p className="text-gray-500 text-xs uppercase mb-1">Probability (M-Class)</p>
                            <p className={`text-3xl font-bold ${currentFlux > 1e-6 ? 'text-orange-400' : 'text-gray-400'}`}>
                                {currentFlux < 1e-6 ? '10%' :
                                    currentFlux < 5e-6 ? '45%' :
                                        currentFlux < 1e-5 ? '85%' : '99%'}
                            </p>
                        </div>
                        <div className="glass-card p-6 flex flex-col justify-center">
                            <p className="text-gray-500 text-xs uppercase mb-1">Forecast</p>
                            <p className={`text-3xl font-bold ${currentFlux > 1e-4 ? 'text-red-500 animate-pulse drop-shadow-[0_0_10px_red]' :
                                currentFlux > 1e-5 ? 'text-orange-400' :
                                    'text-green-400'
                                }`}>
                                {currentFlux > 1e-4 ? 'STORM' :
                                    currentFlux > 1e-5 ? 'ACTIVE' :
                                        'STABLE'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN: GLOBE & CONTROLS (Takes up 4 columns) */}
                <div className="lg:col-span-4 flex flex-col gap-6">

                    {/* 3D Globe Card */}
                    {/* 3D Globe Card - BLENDED */}
                    <div className="relative min-h-[350px] flex items-center justify-center [mask-image:radial-gradient(circle,black_50%,transparent_100%)]">
                        <div className="absolute top-0 left-0 z-10 flex items-center gap-2 bg-black/30 backdrop-blur px-3 py-1 rounded-full border border-white/10">
                            <Globe size={14} className="text-blue-400" />
                            <span className="text-[10px] font-bold text-blue-100/80 tracking-widest">IONOSPHERE VIEW</span>
                        </div>
                        <EarthGlobe />
                    </div>

                    {/* THE JUDGE PANEL */}
                    <JudgeControlPanel />

                </div>
            </main>
        </div>
    );
}
