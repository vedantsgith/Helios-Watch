export type MetricType = "wind" | "kp" | "proton" | "flux" | "neutral";

export interface StatusStyle {
  color: string;      // Tailwind text class, e.g. "text-green-500"
  bg: string;         // Tailwind bg class, e.g. "bg-green-500/10"
  border: string;     // Tailwind border class, e.g. "border-green-500/20"
  hex: string;        // Hex color code, e.g. "#22c55e"
  status: string;     // Label text, e.g. "NORMAL"
  pulse: boolean;     // Pulse state
}

/**
 * Returns unified styles and threat classifications for solar metrics based on official NOAA scales.
 */
export const getStatusColor = (type: MetricType, value: number): StatusStyle => {
  if (type === "neutral") {
    return {
      color: "text-blue-400",
      bg: "bg-blue-950/30",
      border: "border-blue-500/10",
      hex: "#60a5fa",
      status: "",
      pulse: false,
    };
  }

  switch (type) {
    case "wind":
      if (value >= 900) return { color: "text-purple-500", bg: "bg-purple-500/10", border: "border-purple-500/50", hex: "#a855f7", status: "EXTREME", pulse: true };
      if (value >= 700) return { color: "text-red-500", bg: "bg-red-500/10", border: "border-red-500/50", hex: "#ef4444", status: "CRITICAL", pulse: true };
      if (value >= 500) return { color: "text-yellow-500", bg: "bg-yellow-500/10", border: "border-yellow-500/50", hex: "#eab308", status: "WARNING", pulse: false };
      return { color: "text-green-500", bg: "bg-green-500/10", border: "border-green-500/20", hex: "#22c55e", status: "NORMAL", pulse: false };

    case "kp":
      if (value >= 8) return { color: "text-purple-500", bg: "bg-purple-500/10", border: "border-purple-500/50", hex: "#a855f7", status: "EXTREME G4", pulse: true };
      if (value >= 6) return { color: "text-red-500", bg: "bg-red-500/10", border: "border-red-500/50", hex: "#ef4444", status: "STORM G2", pulse: true };
      if (value >= 5) return { color: "text-yellow-500", bg: "bg-yellow-500/10", border: "border-yellow-500/50", hex: "#eab308", status: "UNSETTLED", pulse: false };
      return { color: "text-green-500", bg: "bg-green-500/10", border: "border-green-500/20", hex: "#22c55e", status: "QUIET", pulse: false };

    case "proton":
      if (value >= 1000) return { color: "text-purple-500", bg: "bg-purple-500/10", border: "border-purple-500/50", hex: "#a855f7", status: "S3 STRONG", pulse: true };
      if (value >= 100) return { color: "text-red-500", bg: "bg-red-500/10", border: "border-red-500/50", hex: "#ef4444", status: "S2 MODERATE", pulse: true };
      if (value >= 10) return { color: "text-yellow-500", bg: "bg-yellow-500/10", border: "border-yellow-500/50", hex: "#eab308", status: "S1 MINOR", pulse: false };
      return { color: "text-green-500", bg: "bg-green-500/10", border: "border-green-500/20", hex: "#22c55e", status: "NORMAL", pulse: false };

    case "flux":
    default:
      if (value >= 1e-4) return { color: "text-red-500", bg: "bg-red-500/10", border: "border-red-500/50", hex: "#ef4444", status: "X-CLASS", pulse: true };
      if (value >= 1e-5) return { color: "text-orange-500", bg: "bg-orange-500/10", border: "border-orange-500/50", hex: "#f97316", status: "M-CLASS", pulse: false };
      if (value >= 1e-6) return { color: "text-yellow-500", bg: "bg-yellow-500/10", border: "border-yellow-500/50", hex: "#eab308", status: "C-CLASS", pulse: false };
      return { color: "text-green-500", bg: "bg-green-500/10", border: "border-green-500/20", hex: "#22c55e", status: "QUIET", pulse: false };
  }
};
