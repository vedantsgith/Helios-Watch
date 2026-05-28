/**
 * Auth Zustand Store — Helios-Watch Frontend
 *
 * Manages user session state: login, register, logout, and session restoration.
 * JWT token is stored in an httpOnly cookie (backend sets it) — not in JS memory.
 * The store only holds the resolved user object and UI-facing state.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User } from "../../types";
import {
  login as loginApi,
  register as registerApi,
  logout as logoutApi,
  getMe,
  fetchPreferences,
  savePreferences,
} from "../../services/authService";

// ─── State Interface ──────────────────────────────────────────────────────────

interface AuthState {
  user: User | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  alertsEnabled: boolean;
  notificationPermission: NotificationPermission | "unknown";
  emailAlertsEnabled: boolean;
  alertMinStatus: string;

  // Actions
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkSession: () => Promise<void>;
  setAlertsEnabled: (enabled: boolean) => Promise<void>;
  requestNotificationPermission: () => Promise<void>;
  fetchUserPreferences: () => Promise<void>;
  setEmailAlertsEnabled: (enabled: boolean) => Promise<void>;
  setAlertMinStatus: (status: string) => Promise<void>;
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isLoggedIn: false,
      isLoading: false,
      alertsEnabled: false,
      notificationPermission: "unknown",
      emailAlertsEnabled: false,
      alertMinStatus: "M_CLASS_FLARE",

      // ── Login ──────────────────────────────────────────────────────────────

      login: async (email, password) => {
        set({ isLoading: true });
        try {
          const result = await loginApi(email, password);
          set({ user: result.user, isLoggedIn: true });
          await get().fetchUserPreferences();
        } finally {
          set({ isLoading: false });
        }
      },

      // ── Register ───────────────────────────────────────────────────────────

      register: async (email, password) => {
        set({ isLoading: true });
        try {
          const result = await registerApi(email, password);
          set({ user: result.user, isLoggedIn: true });
          await get().fetchUserPreferences();
        } finally {
          set({ isLoading: false });
        }
      },

      // ── Logout ─────────────────────────────────────────────────────────────

      logout: async () => {
        try {
          await logoutApi();
        } catch {
          // Swallow network errors — clear state regardless
        }
        set({
          user: null,
          isLoggedIn: false,
          alertsEnabled: false,
          emailAlertsEnabled: false,
          alertMinStatus: "M_CLASS_FLARE",
        });
      },

      // ── Session Restore (on app mount) ─────────────────────────────────────

      checkSession: async () => {
        set({ isLoading: true });
        try {
          const user = await getMe();
          set({ user, isLoggedIn: true });
          await get().fetchUserPreferences();
        } catch {
          // 401 = not logged in — that's fine
          set({ user: null, isLoggedIn: false });
        } finally {
          set({ isLoading: false });
        }
      },

      // ── Alerts Toggle ──────────────────────────────────────────────────────

      setAlertsEnabled: async (enabled: boolean) => {
        if (enabled) {
          await get().requestNotificationPermission();
        }
        set({ alertsEnabled: enabled });
      },

      // ── Notification Permission ────────────────────────────────────────────

      requestNotificationPermission: async () => {
        if (!("Notification" in window)) {
          set({ notificationPermission: "denied" });
          return;
        }
        const permission = await Notification.requestPermission();
        set({ notificationPermission: permission });
      },

      fetchUserPreferences: async () => {
        try {
          const prefs = await fetchPreferences();
          set({
            emailAlertsEnabled: prefs.email_alerts_enabled,
            alertMinStatus: prefs.alert_min_status,
          });
        } catch (err) {
          console.error("Failed to load user preferences", err);
        }
      },

      setEmailAlertsEnabled: async (enabled: boolean) => {
        const { alertMinStatus } = get();
        try {
          await savePreferences({ email_alerts_enabled: enabled, alert_min_status: alertMinStatus });
          set({ emailAlertsEnabled: enabled });
        } catch (err) {
          console.error("Failed to save email alerts preference", err);
        }
      },

      setAlertMinStatus: async (status: string) => {
        const { emailAlertsEnabled } = get();
        try {
          await savePreferences({ email_alerts_enabled: emailAlertsEnabled, alert_min_status: status });
          set({ alertMinStatus: status });
        } catch (err) {
          console.error("Failed to save alert min status preference", err);
        }
      },
    }),
    {
      name: "helios-auth",
      // Only persist non-sensitive UI preferences (not the user object — that comes from the cookie)
      partialize: (state) => ({
        alertsEnabled: state.alertsEnabled,
        notificationPermission: state.notificationPermission,
      }),
    }
  )
);

// ─── Notification Helper (called from useWebSocket) ───────────────────────────

export function sendAnomalyNotification(title: string, body: string) {
  const { isLoggedIn, alertsEnabled, notificationPermission } = useAuthStore.getState();

  if (!isLoggedIn || !alertsEnabled) return;

  if (notificationPermission === "granted" && "Notification" in window) {
    new Notification(title, {
      body,
      icon: "/favicon.ico",
      badge: "/favicon.ico",
    });
  }
}
