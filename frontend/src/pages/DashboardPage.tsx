/**
 * DashboardPage — Helios-Watch Frontend
 *
 * Main public dashboard. No authentication required.
 * Connects to the WebSocket feed and renders all solar monitoring views.
 */

import { useEffect } from "react";
import { Globe } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useStore } from "../store/useStore";
import { useWebSocket } from "../hooks/useWebSocket";
import { fetchAlertHistory } from "../services/solarService";
import { AlertTimeline } from "../features/alerts/AlertTimeline";

import { Navbar } from "../components/layout/Navbar";
import { SolarChart } from "../features/solar/SolarChart";
import { EarthGlobe } from "../features/solar/EarthGlobe";
import { JudgeControlPanel } from "../features/solar/JudgeControlPanel";
import { FullScreenAlert } from "../features/alerts/FullScreenAlert";

import { PhysicsView } from "../components/views/PhysicsView";
import { HistoryView } from "../components/views/HistoryView";

type ViewTab = "live" | "history" | "physics";

interface DashboardPageProps {
  view: ViewTab;
}

export function DashboardPage({ view }: DashboardPageProps) {
  const navigate = useNavigate();
  const { currentFlux, simulationActive, setAlertsHistory } = useStore();

  useEffect(() => {
    fetchAlertHistory().then(setAlertsHistory).catch(console.error);
  }, [setAlertsHistory]);

  // Establish and manage WebSocket connection
  useWebSocket();

  return (
    <div className="min-h-screen bg-black text-white p-4 lg:p-8 relative overflow-hidden font-sans">
      {/* ── Background & Atmosphere ─────────────────────────────────────── */}
      <div className="solar-bg" />
      <div className="scanlines" />
      <div className="vignette" />

      {/* ── Alert Overlay ───────────────────────────────────────────────── */}
      <FullScreenAlert />

      {/* ── Navbar ──────────────────────────────────────────────────────── */}
      <Navbar
        currentView={view}
        onViewChange={(v) => navigate(`/${v}`)}
        simulationActive={simulationActive}
      />

      {/* ── Main Content ────────────────────────────────────────────────── */}
      <main className="relative z-10">
        {/* LIVE VIEW */}
        {view === "live" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

            {/* LEFT COLUMN: Chart + Metrics (8 cols) */}
            <div className="lg:col-span-8 flex flex-col gap-6">
              <SolarChart />

              {/* Quick Metrics Row */}
              <div className="grid grid-cols-3 gap-4">
                <div className="glass-card p-6 flex flex-col justify-center">
                  <p className="text-gray-500 text-xs uppercase mb-1">Active Region</p>
                  <p className="text-3xl font-bold text-white">AR3514</p>
                </div>
                <div className="glass-card p-6 flex flex-col justify-center">
                  <p className="text-gray-500 text-xs uppercase mb-1">Probability (M-Class)</p>
                  <p className={`text-3xl font-bold ${currentFlux > 1e-6 ? "text-orange-400" : "text-gray-400"}`}>
                    {currentFlux < 1e-6 ? "10%" :
                      currentFlux < 5e-6 ? "45%" :
                        currentFlux < 1e-5 ? "85%" : "99%"}
                  </p>
                </div>
                <div className="glass-card p-6 flex flex-col justify-center">
                  <p className="text-gray-500 text-xs uppercase mb-1">Forecast</p>
                  <p className={`text-3xl font-bold ${
                    currentFlux > 1e-4 ? "text-red-500 animate-pulse drop-shadow-[0_0_10px_red]" :
                      currentFlux > 1e-5 ? "text-orange-400" : "text-green-400"
                  }`}>
                    {currentFlux > 1e-4 ? "STORM" :
                      currentFlux > 1e-5 ? "ACTIVE" : "STABLE"}
                  </p>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Globe + Controls (4 cols) */}
            <div className="lg:col-span-4 flex flex-col gap-6">
              <div className="relative min-h-[350px] flex items-center justify-center [mask-image:radial-gradient(circle,black_50%,transparent_100%)]">
                <div className="absolute top-0 left-0 z-10 flex items-center gap-2 bg-black/30 backdrop-blur px-3 py-1 rounded-full border border-white/10">
                  <Globe size={14} className="text-blue-400" />
                  <span className="text-[10px] font-bold text-blue-100/80 tracking-widest">IONOSPHERE VIEW</span>
                </div>
                <EarthGlobe />
              </div>

              <JudgeControlPanel />
              <AlertTimeline />
            </div>
          </div>
        )}

        {/* HISTORY VIEW */}
        {view === "history" && <HistoryView />}

        {/* PHYSICS VIEW */}
        {view === "physics" && <PhysicsView />}
      </main>
    </div>
  );
}
