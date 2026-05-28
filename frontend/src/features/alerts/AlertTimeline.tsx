import React from "react";
import { useStore } from "../../store/useStore";
import { Terminal, ShieldAlert, Compass } from "lucide-react";
import { format } from "date-fns";

export const AlertTimeline: React.FC = () => {
  const alertsHistory = useStore((state) => state.alertsHistory);

  return (
    <div className="glass-card p-6 mt-6 relative overflow-hidden group flex flex-col h-[320px]">
      <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-orange-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-4 relative z-10">
        <div className="flex items-center gap-2">
          <Terminal className="text-red-400 animate-pulse drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]" size={18} />
          <h3 className="text-sm font-bold text-white tracking-widest font-mono">LIVE ANOMALY LOGS</h3>
        </div>
        <span className="text-[9px] px-2.5 py-0.5 rounded-full bg-red-950/40 text-red-400 border border-red-500/20 font-mono tracking-widest uppercase">
          SECURE DB FEED
        </span>
      </div>

      {/* Logs Scroll Area */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-3 custom-scrollbar relative z-10 font-mono text-[11px] leading-relaxed">
        {alertsHistory.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-gray-500 gap-2 py-8">
            <Compass size={28} className="text-gray-600 animate-pulse" />
            <p className="uppercase tracking-widest text-[9px] font-bold">NO ANOMALIES RECORDED</p>
            <p className="text-[10px] text-gray-600 max-w-[200px]">
              System running normal. Real-time NOAA pipeline actively polling.
            </p>
          </div>
        ) : (
          alertsHistory.map((alert) => {
            // Unify threat visual styles
            let statusColor = "text-blue-400";
            if (alert.status === "X_CLASS_FLARE") {
              statusColor = "text-red-500 animate-pulse";
            } else if (alert.status === "M_CLASS_FLARE") {
              statusColor = "text-orange-500";
            } else if (alert.status === "RAPID_INTENSIFICATION") {
              statusColor = "text-yellow-500";
            }

            // Format datetime
            let formattedTime = "";
            try {
              formattedTime = format(new Date(alert.timestamp), "HH:mm:ss");
            } catch {
              formattedTime = alert.timestamp;
            }

            return (
              <div
                key={alert.id}
                className="p-3 rounded border bg-black/40 border-white/5 hover:border-white/10 hover:bg-white/5 transition-all flex flex-col gap-1.5"
              >
                {/* Header row */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <ShieldAlert size={12} className={statusColor} />
                    <span className={`font-bold ${statusColor} tracking-wider`}>
                      {alert.status.replace(/_/g, " ")}
                    </span>
                  </div>
                  <span className="text-[9px] text-gray-500 font-bold">{formattedTime} UTC</span>
                </div>

                {/* Description */}
                <p className="text-gray-300 text-[10px]">{alert.details}</p>

                {/* Physics details */}
                <div className="flex gap-4 text-[9px] text-gray-500 border-t border-white/5 pt-1.5 mt-0.5">
                  {typeof alert.flux === "number" && (
                    <div>
                      FLUX: <span className="text-white font-bold">{alert.flux.toExponential(2)} W/m²</span>
                    </div>
                  )}
                  {typeof alert.slope === "number" && (
                    <div>
                      dF/dt: <span className="text-white font-bold">{alert.slope.toExponential(1)} W/m²/m</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
