/**
 * Shared TypeScript interfaces — Helios-Watch Frontend
 *
 * Single source of truth for all data shapes used across
 * features, stores, services, and components.
 */

// ─── Solar Data ───────────────────────────────────────────────────────────────

export interface SolarPoint {
  timestamp: string;
  flux: number;
  class_type: string;
  source: "noaa" | "simulation";
}

export interface SpaceWeather {
  windSpeed: number;
  temp: number;
  density: number;
  kpIndex: number;
  protonFlux: number;
}

export interface ActiveRegion {
  region_number: number;
  latitude: number;
  longitude: number;
  class_type: string;
}

export interface CalculusData {
  slope: number;       // Rate of change (W/m²/min)
  is_warning: boolean; // Early warning triggered
  threshold: number;   // Warning threshold value
  status: string;      // e.g. "RAPID_INTENSIFICATION", "STABLE"
  details: string;     // Human-readable context
  engine_type: string; // "HYBRID (Calculus + Threshold)"
}

export interface HistoryPoint {
  timestamp: string;
  value: number;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface User {
  id: number;
  email: string;
}

export interface AlertEvent {
  id: number;
  timestamp: string;
  status: string;
  details: string;
  flux: number | null;
  slope: number | null;
}

// ─── WebSocket Messages ───────────────────────────────────────────────────────

export type WSMessageType =
  | "data_update"
  | "history_update"
  | "telemetry_update"
  | "calculus_update"
  | "telemetry_history_update"
  | "regions_update"
  | "new_alert"
  | "pong";

export interface WSMessage {
  type: WSMessageType;
  payload: Record<string, unknown>;
}

// ─── System State ─────────────────────────────────────────────────────────────

export type SystemStatus = "ONLINE" | "OFFLINE" | "CONNECTING";
export type ViewTab = "live" | "history" | "physics";
export type GraphTab = "flux" | "wind" | "kp" | "proton";
