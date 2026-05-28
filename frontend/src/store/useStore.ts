/**
 * Solar/Telemetry Zustand Store — Helios-Watch Frontend
 *
 * Manages all real-time solar data: flux history, space weather telemetry,
 * active regions, calculus engine output, and simulation state.
 *
 * User/auth state is handled separately in features/auth/authStore.ts.
 */

import { create } from "zustand";
import type {
  SolarPoint,
  SpaceWeather,
  ActiveRegion,
  CalculusData,
  HistoryPoint,
  SystemStatus,
  GraphTab,
  AlertEvent,
} from "../types";

export type { SolarPoint, SpaceWeather, ActiveRegion, CalculusData, HistoryPoint };

// ─── State Interface ──────────────────────────────────────────────────────────

interface SolarState {
  // Live data
  dataPoints: SolarPoint[];
  currentFlux: number;
  systemStatus: SystemStatus;
  realHistory: SolarPoint[];
  simulationActive: boolean;

  // Telemetry
  spaceWeather: SpaceWeather;
  activeRegions: ActiveRegion[];
  calculus: CalculusData;

  // Multi-metric time-series history
  windHistory: HistoryPoint[];
  kpHistory: HistoryPoint[];
  protonHistory: HistoryPoint[];

  // Backup real data (to restore after simulation)
  realWindHistory: HistoryPoint[];
  realKpHistory: HistoryPoint[];
  realProtonHistory: HistoryPoint[];

  // Graph tab remote control (set by JudgeControlPanel)
  activeGraphTab: GraphTab;

  // Visual simulation state (cosmetic only)
  visualSimulation: { active: boolean; level: "NONE" | "M" | "X" };

  // Diagnostics
  latency: number | null;
  lastUpdateTime: string | null;
  alertsHistory: AlertEvent[];

  // ── Actions ────────────────────────────────────────────────────────────────
  addDataPoint: (point: SolarPoint) => void;
  setSystemStatus: (status: SystemStatus) => void;
  setHistory: (points: SolarPoint[]) => void;
  setSpaceWeather: (data: Partial<SpaceWeather>, isSimulation?: boolean) => void;
  setRegions: (regions: ActiveRegion[]) => void;
  setCalculus: (data: CalculusData) => void;
  setTelemetryHistory: (history: { wind: HistoryPoint[]; kp: HistoryPoint[]; proton: HistoryPoint[] }) => void;
  setActiveGraphTab: (tab: GraphTab) => void;
  revertToRealData: () => void;
  setVisualSimulation: (active: boolean, level?: "NONE" | "M" | "X") => void;
  setLatency: (latency: number | null) => void;
  setLastUpdateTime: (time: string | null) => void;
  setAlertsHistory: (alerts: AlertEvent[]) => void;
  addAlertEvent: (alert: AlertEvent) => void;
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useStore = create<SolarState>((set) => ({
  // Initial state
  dataPoints: [],
  realHistory: [],
  currentFlux: 0,
  systemStatus: "CONNECTING",
  simulationActive: false,
  spaceWeather: { windSpeed: 0, density: 0, temp: 0, kpIndex: 0, protonFlux: 0 },
  activeRegions: [],
  calculus: {
    slope: 0,
    is_warning: false,
    threshold: 1e-7,
    status: "STABLE",
    details: "System Normal",
    engine_type: "Loading...",
  },
  windHistory: [],
  kpHistory: [],
  protonHistory: [],
  realWindHistory: [],
  realKpHistory: [],
  realProtonHistory: [],
  activeGraphTab: "flux",
  visualSimulation: { active: false, level: "NONE" },
  latency: null,
  lastUpdateTime: null,
  alertsHistory: [],

  // ── Actions ─────────────────────────────────────────────────────────────────

  setVisualSimulation: (active, level = "NONE") =>
    set({ visualSimulation: { active, level } }),

  setHistory: (points) =>
    set({
      realHistory: points,
      dataPoints: points.slice(-1440),
      currentFlux: points.length > 0 ? points[points.length - 1].flux : 0,
    }),

  addDataPoint: (point) =>
    set((state) => {
      const isSim = point.source === "simulation";

      if (isSim) {
        // Simulation: update display only, keep real history pure
        return {
          dataPoints: [...state.dataPoints, point].slice(-1440),
          currentFlux: point.flux,
          simulationActive: true,
        };
      }

      // Real data: update both history and display, clear any simulation residue
      const newRealHistory = [...state.realHistory, point].slice(-1440);
      return {
        dataPoints: newRealHistory,
        realHistory: newRealHistory,
        currentFlux: point.flux,
        simulationActive: false,
        systemStatus: "ONLINE" as SystemStatus,
      };
    }),

  setSystemStatus: (status) => set({ systemStatus: status }),

  setSpaceWeather: (data, isSimulation = false) =>
    set((state) => {
      const now = new Date().toISOString();
      const incoming = data as Record<string, number>;

      // Accept both camelCase (frontend) and snake_case (backend) keys
      const mapped: SpaceWeather = {
        windSpeed: incoming.windSpeed ?? incoming.wind_speed ?? state.spaceWeather.windSpeed,
        temp: incoming.temp ?? state.spaceWeather.temp,
        density: incoming.density ?? state.spaceWeather.density,
        kpIndex: incoming.kpIndex ?? incoming.kp_index ?? state.spaceWeather.kpIndex,
        protonFlux: incoming.protonFlux ?? incoming.proton_flux ?? state.spaceWeather.protonFlux,
      };

      const newWind = { timestamp: now, value: mapped.windSpeed };
      const newKp = { timestamp: now, value: mapped.kpIndex };
      const newProton = { timestamp: now, value: mapped.protonFlux };

      if (!isSimulation) {
        const nextRealWind = [...state.realWindHistory, newWind].slice(-1440);
        const nextRealKp = [...state.realKpHistory, newKp].slice(-1440);
        const nextRealProton = [...state.realProtonHistory, newProton].slice(-1440);
        return {
          spaceWeather: mapped,
          realWindHistory: nextRealWind,
          realKpHistory: nextRealKp,
          realProtonHistory: nextRealProton,
          windHistory: nextRealWind,
          kpHistory: nextRealKp,
          protonHistory: nextRealProton,
        };
      }

      // Simulation: update display only
      return {
        spaceWeather: mapped,
        windHistory: [...state.windHistory, newWind].slice(-1440),
        kpHistory: [...state.kpHistory, newKp].slice(-1440),
        protonHistory: [...state.protonHistory, newProton].slice(-1440),
      };
    }),

  setTelemetryHistory: (history) =>
    set({
      windHistory: history.wind,
      kpHistory: history.kp,
      protonHistory: history.proton,
      realWindHistory: history.wind,
      realKpHistory: history.kp,
      realProtonHistory: history.proton,
    }),

  revertToRealData: () =>
    set((state) => ({
      windHistory: state.realWindHistory,
      kpHistory: state.realKpHistory,
      protonHistory: state.realProtonHistory,
    })),

  setRegions: (regions) => set({ activeRegions: regions }),
  setCalculus: (data) => set({ calculus: data }),
  setActiveGraphTab: (tab) => set({ activeGraphTab: tab }),
  setLatency: (latency) => set({ latency }),
  setLastUpdateTime: (lastUpdateTime) => set({ lastUpdateTime }),
  setAlertsHistory: (alertsHistory) => set({ alertsHistory }),
  addAlertEvent: (alert) =>
    set((state) => ({
      alertsHistory: [alert, ...state.alertsHistory].slice(0, 50),
    })),
}));