import { useEffect, useState } from 'react';
<<<<<<< HEAD
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Dashboard } from './pages/Dashboard';
import { BrownieLogin } from './components/BrownieLogin';
=======
import { SolarChart } from './components/SolarChart';
import { EarthGlobe } from './components/EarthGlobe';
import { JudgeControlPanel } from './components/JudgeControlPanel';
import { FullScreenAlert } from './components/FullScreenAlert';
import { ViewSelector } from './components/ViewSelector';
import { PhysicsView } from './components/views/PhysicsView';
import { HistoryView } from './components/views/HistoryView';
>>>>>>> 49b2004260d5caa71b043e1ecaaf4d8cb013a95c
import { useStore } from './store/useStore';
import { Loader2 } from 'lucide-react';
import axios from 'axios';

<<<<<<< HEAD
// Configure Axios
const api = axios.create({
  baseURL: 'http://127.0.0.1:8001',
  withCredentials: true
});

// Protected Route Component
const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const user = useStore.getState().user;
  // If no user in store, we might still be loading or check cookie...
  // For this simple demo, we rely on the store having the user.
  // Ideally, we'd have a 'loading' state for auth check.

  // Actually, let's just do a simple check. If user is null, redirect to login.
  // NOTE: On refresh, store is wiped. We need to check /me on mount.
  // We'll handle that in the App component wrapper.

  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

function AppContent() {
  const [loading, setLoading] = useState(true);
  const setUser = useStore((state) => state.setUser);

  useEffect(() => {
    // Check if we have a session
    api.get('/api/auth/me')
      .then(res => {
        setUser(res.data.user);
      })
      .catch(() => {
        setUser(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [setUser]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white">
        <Loader2 className="animate-spin w-10 h-10 text-orange-500" />
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={<BrownieLogin />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
    </Routes>
=======
function App() {
  const { addDataPoint, systemStatus, setSystemStatus, currentFlux } = useStore();
  const [currentView, setCurrentView] = useState<'live' | 'history' | 'physics'>('live');

  useEffect(() => {
    // CONNECT TO WEBSOCKET
    const ws = new WebSocket('ws://127.0.0.1:8000/ws');

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
        } else if (message.type === 'telemetry_update') {
          useStore.getState().setSpaceWeather({
            windSpeed: message.payload.wind_speed,
            temp: message.payload.temp,
            density: message.payload.density,
            kpIndex: message.payload.kp_index,
            protonFlux: message.payload.proton_flux
          });
        } else if (message.type === 'calculus_update') {
          useStore.getState().setCalculus(message.payload);
        }
      } catch (e) {
        console.error("WS Parse Error", e);
      }
    };

    return () => ws.close();
  }, [addDataPoint, setSystemStatus]);

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
      <header className="flex flex-col lg:flex-row justify-between items-center mb-8 border-b border-white/10 pb-4 relative z-10 gap-4">
        <div>
          <h1 className="text-6xl font-extrabold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-red-400 to-yellow-200 drop-shadow-[0_0_10px_rgba(255,100,0,0.5)]">
            Helios-Watch
          </h1>
          <p className="text-orange-200/60 text-sm mt-1 tracking-[0.3em] uppercase opacity-80">
            Real-time Solar Anomaly Detector
          </p>
        </div>

        {/* View Selector (Center/Right) */}
        <ViewSelector currentView={currentView} onViewChange={setCurrentView} />
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="relative z-10 w-full max-w-[1600px] mx-auto transition-all duration-500">

        {/* VIEW: LIVE DASHBOARD */}
        {currentView === 'live' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
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
          </div>
        )}

        {/* VIEW: HISTORY */}
        {currentView === 'history' && <HistoryView />}

        {/* VIEW: PHYSICS */}
        {currentView === 'physics' && <PhysicsView />}

      </main>
    </div>
>>>>>>> 49b2004260d5caa71b043e1ecaaf4d8cb013a95c
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
