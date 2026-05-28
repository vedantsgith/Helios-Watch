/**
 * Solar Service — Helios-Watch Frontend
 *
 * API calls for solar simulation trigger.
 */

import api from "./api";

export type EventType = "flux" | "wind" | "kp" | "proton";
export type FlareClass = "X" | "M" | "C";

export interface SimulateRequest {
  type: FlareClass | string;
  duration: number;
  event_type: EventType;
}

/**
 * Trigger a simulated solar event on the backend.
 * The backend injects synthetic data into the live WebSocket feed.
 */
export async function triggerSimulation(req: SimulateRequest): Promise<{ status: string; points: number }> {
  const res = await api.post<{ status: string; points: number }>("/simulate", req);
  return res.data;
}

export interface AlertEvent {
  id: number;
  timestamp: string;
  status: string;
  details: string;
  flux: number | null;
  slope: number | null;
}

export async function fetchAlertHistory(): Promise<AlertEvent[]> {
  const res = await api.get<AlertEvent[]>("/alerts/history");
  return res.data;
}
