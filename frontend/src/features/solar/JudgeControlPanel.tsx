/**
 * JudgeControlPanel — Helios-Watch Frontend (features/solar)
 *
 * Simulation control panel for triggering synthetic solar events.
 * Moved from: components/JudgeControlPanel.tsx
 */

import React, { useState } from "react";
import { Zap, Activity, AlertTriangle } from "lucide-react";
import { useStore } from "../../store/useStore";
import { triggerSimulation } from "../../services/solarService";
import type { EventType, FlareClass } from "../../services/solarService";

export const JudgeControlPanel: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const setActiveGraphTab = useStore((state) => state.setActiveGraphTab);

  const handleSimulation = async (type: FlareClass | string, event_type: EventType) => {
    if (loading) return;
    setLoading(true);
    setActiveGraphTab(event_type as "flux" | "wind" | "kp" | "proton");

    try {
      await triggerSimulation({ type, duration: 17, event_type });
      setTimeout(() => setLoading(false), 100);

      // Auto-revert to real data after simulation finishes (~5s + buffer)
      setTimeout(() => {
        useStore.getState().revertToRealData();
      }, 5500);
    } catch (e) {
      console.error("Simulation failed", e);
      setLoading(false);
    }
  };

  return (
    <div className="glass-card p-6 mt-6 relative overflow-hidden group">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

      <div className="flex items-center gap-2 mb-6 border-b border-white/10 pb-4 relative z-10">
        <Zap className="text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]" size={20} />
        <h3 className="text-xl font-bold text-white tracking-widest font-mono">SIMULATION CONTROL</h3>
      </div>

      <div className="grid grid-cols-2 gap-4 relative z-10">
        <button
          onClick={() => handleSimulation("X", "flux")}
          disabled={loading}
          className={`col-span-2 group relative flex flex-row items-center justify-center gap-3 py-3 rounded-lg border transition-all duration-300 overflow-hidden ${loading ? "opacity-80 cursor-wait" : "hover:scale-[1.02] hover:shadow-[0_0_25px_rgba(239,68,68,0.4)]"} bg-gradient-to-r from-red-950/40 to-red-900/60 border-red-500/50 text-red-100`}
        >
          {!loading && <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent z-0" />}
          <AlertTriangle size={18} className={`text-red-500 relative z-10 ${loading ? "animate-spin" : "animate-pulse"}`} />
          <span className="text-sm font-bold tracking-[0.1em] text-red-100 relative z-10">
            {loading ? "DATA INJECTION..." : "INITIATE X-CLASS FLARE"}
          </span>
        </button>

        <button onClick={() => handleSimulation("X", "wind")} disabled={loading} className={`group relative flex flex-col items-center justify-center gap-1 py-3 rounded-lg border transition-all duration-300 ${loading ? "opacity-50 cursor-not-allowed" : "hover:-translate-y-1 hover:shadow-[0_0_15px_rgba(34,197,94,0.3)]"} bg-emerald-950/30 border-emerald-500/30 text-emerald-400`}>
          <Activity size={18} className="mb-1" />
          <span className="font-bold tracking-wider text-xs">HIGH WIND</span>
        </button>

        <button onClick={() => handleSimulation("X", "kp")} disabled={loading} className={`group relative flex flex-col items-center justify-center gap-1 py-3 rounded-lg border transition-all duration-300 ${loading ? "opacity-50 cursor-not-allowed" : "hover:-translate-y-1 hover:shadow-[0_0_15px_rgba(168,85,247,0.3)]"} bg-purple-950/30 border-purple-500/30 text-purple-400`}>
          <Zap size={18} className="mb-1" />
          <span className="font-bold tracking-wider text-xs">Kp STORM</span>
        </button>

        <button onClick={() => handleSimulation("X", "proton")} disabled={loading} className={`col-span-2 group relative flex flex-row items-center justify-center gap-2 py-3 rounded-lg border transition-all duration-300 ${loading ? "opacity-50 cursor-not-allowed" : "hover:shadow-[0_0_15px_rgba(234,179,8,0.3)]"} bg-yellow-950/30 border-yellow-500/30 text-yellow-400`}>
          <Activity size={18} />
          <span className="font-bold tracking-wider text-xs">PROTON SHOWER (S2)</span>
        </button>
      </div>

      <div className="mt-4 flex justify-between items-center px-2">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${loading ? "bg-yellow-400 animate-ping" : "bg-emerald-500"}`} />
          <span className="text-[10px] text-gray-400 uppercase tracking-widest font-mono">
            {loading ? "UPLINK ACTIVE" : "SYSTEM READY"}
          </span>
        </div>
        <span className="text-[10px] text-gray-600 font-mono">V 3.0.0</span>
      </div>
    </div>
  );
};
