/**
 * useWebSocket — Helios-Watch Frontend
 *
 * Manages the live WebSocket connection to the backend.
 * Dispatches all incoming messages to the Zustand solar store.
 * Triggers anomaly notifications for logged-in users with alerts enabled.
 */

import { useEffect, useRef } from "react";
import { useStore } from "../store/useStore";
import { sendAnomalyNotification } from "../features/auth/authStore";

const WS_URL = import.meta.env.VITE_WS_URL || "ws://127.0.0.1:8001/ws";

// Track the last notification time to avoid spamming
let lastNotificationTime = 0;
const NOTIFICATION_COOLDOWN_MS = 60_000; // 1 minute between notifications

export function useWebSocket() {
  const {
    addDataPoint,
    setSystemStatus,
    setHistory,
    setSpaceWeather,
    setCalculus,
    setTelemetryHistory,
    setRegions,
    setLatency,
    setLastUpdateTime,
    addAlertEvent,
  } = useStore();

  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    let pingInterval: ReturnType<typeof setInterval> | null = null;

    const connect = () => {
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        setSystemStatus("ONLINE");
        console.log("[WS] Connected to Helios-Watch backend");

        // Start ping interval
        if (pingInterval) clearInterval(pingInterval);
        pingInterval = setInterval(() => {
          if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ type: "ping", payload: { sentAt: Date.now() } }));
          }
        }, 5000);
      };

      ws.onclose = () => {
        setSystemStatus("OFFLINE");
        setLatency(null);
        if (pingInterval) {
          clearInterval(pingInterval);
          pingInterval = null;
        }
        console.log("[WS] Disconnected — reconnecting in 3s...");
        setTimeout(connect, 3000); // Auto-reconnect
      };

      ws.onerror = (err) => {
        console.error("[WS] Error:", err);
        setLatency(null);
      };

      ws.onmessage = (event) => {
        setLastUpdateTime(new Date().toISOString());
        try {
          const message = JSON.parse(event.data);
          handleMessage(message);
        } catch (e) {
          console.error("[WS] Parse error:", e);
        }
      };
    };

    connect();

    return () => {
      wsRef.current?.close();
      if (pingInterval) clearInterval(pingInterval);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function handleMessage(message: { type: string; payload: Record<string, unknown> }) {
    switch (message.type) {
      case "pong": {
        const sentAt = (message.payload as { sentAt?: number }).sentAt;
        if (sentAt) {
          setLatency(Date.now() - sentAt);
        }
        break;
      }

      case "new_alert":
        addAlertEvent(message.payload as unknown as Parameters<typeof addAlertEvent>[0]);
        break;

      case "data_update":
        addDataPoint(message.payload as unknown as Parameters<typeof addDataPoint>[0]);
        break;

      case "history_update": {
        const history = (message.payload as { history: Parameters<typeof addDataPoint>[0][] }).history;
        setHistory(history);
        break;
      }

      case "telemetry_update": {
        const isSim = (message.payload as { type?: string }).type === "telemetry_sim";
        setSpaceWeather(message.payload as Parameters<typeof setSpaceWeather>[0], isSim);
        break;
      }

      case "calculus_update": {
        const calcData = message.payload as unknown as Parameters<typeof setCalculus>[0];
        setCalculus(calcData);

        // Anomaly notification (rate-limited)
        if (calcData.is_warning) {
          const now = Date.now();
          if (now - lastNotificationTime > NOTIFICATION_COOLDOWN_MS) {
            lastNotificationTime = now;
            sendAnomalyNotification(
              "⚠️ Helios-Watch: Solar Anomaly Detected",
              `Status: ${calcData.status} — ${calcData.details}`
            );
          }
        }
        break;
      }

      case "telemetry_history_update":
        setTelemetryHistory(
          message.payload as Parameters<typeof setTelemetryHistory>[0]
        );
        break;

      case "regions_update": {
        const { regions } = message.payload as { regions: Parameters<typeof setRegions>[0] };
        setRegions(regions);
        break;
      }

      default:
        break;
    }
  }
}
