/**
 * Navbar — Helios-Watch Frontend
 *
 * Top navigation bar with:
 * - Left: Logo + subtitle
 * - Center: View selector (Live / History / Physics)
 * - Right: System status | Bell (logged-in) | User info or Sign In button
 */

import React, { useState } from "react";
import {
  Server,
  Radio,
  LogOut,
  Bell,
  BellOff,
  Settings,
  UserCircle2,
  LogIn,
} from "lucide-react";
import { useStore } from "../../store/useStore";
import { useAuthStore } from "../../features/auth/authStore";
import { LoginModal } from "../../features/auth/LoginModal";
import { ViewSelector } from "../ViewSelector";

interface NavbarProps {
  currentView: "live" | "history" | "physics";
  onViewChange: (view: "live" | "history" | "physics") => void;
  simulationActive: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onViewChange,
  simulationActive,
}) => {
  const systemStatus = useStore((s) => s.systemStatus);
  const latency = useStore((s) => s.latency);
  const {
    user,
    isLoggedIn,
    alertsEnabled,
    logout,
    setAlertsEnabled,
    emailAlertsEnabled,
    alertMinStatus,
    setEmailAlertsEnabled,
    setAlertMinStatus,
  } = useAuthStore();

  const [loginOpen, setLoginOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const handleBellToggle = async () => {
    await setAlertsEnabled(!alertsEnabled);
  };

  const handleLogout = async () => {
    setSettingsOpen(false);
    await logout();
  };

  return (
    <>
      {/* ── Simulation Banner ─────────────────────────────────────────────── */}
      {simulationActive && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-red-600/90 text-white text-center py-1 font-bold animate-pulse tracking-[0.2em] border-b border-red-500 shadow-[0_0_20px_rgba(255,0,0,0.5)] text-sm">
          ⚠ SIMULATION MODE ACTIVE ⚠
        </div>
      )}

      {/* ── Main Navbar ───────────────────────────────────────────────────── */}
      <header
        className={`flex flex-col lg:flex-row justify-between items-center border-b border-white/10 pb-4 mb-8 relative z-10 gap-4 ${
          simulationActive ? "pt-8" : ""
        }`}
      >
        {/* LEFT: Logo */}
        <div className="flex-shrink-0">
          <h1 className="text-5xl lg:text-6xl font-extrabold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-red-400 to-yellow-200 drop-shadow-[0_0_10px_rgba(255,100,0,0.5)]">
            Helios-Watch
          </h1>
          <p className="text-orange-200/60 text-sm mt-1 tracking-[0.3em] uppercase opacity-80">
            Real-time Solar Anomaly Detector
          </p>
        </div>

        {/* CENTER: View Selector */}
        <ViewSelector currentView={currentView} onViewChange={onViewChange} />

        {/* RIGHT: Status + Auth ───────────────────────────────────────────── */}
        <div className="flex items-center gap-3">
          {/* System Status */}
          <div className="glass-card !rounded-full px-4 py-2 flex items-center gap-2">
            <Server
              size={13}
              className={systemStatus === "ONLINE" ? "text-green-400" : "text-red-400"}
            />
            <span className="text-xs font-bold text-gray-200 tracking-wider">
              {systemStatus}
            </span>
          </div>

          {/* Live Feed Indicator */}
          <div className="glass-card !rounded-full px-4 py-2 flex items-center gap-2">
            <Radio size={13} className="text-blue-400 animate-pulse" />
            <span className="text-xs font-bold text-gray-200 tracking-wider">LIVE</span>
            <span className="w-[1px] h-3 bg-white/20" />
            <span
              className={`text-[10px] font-mono font-bold tracking-wider transition-colors duration-300 ${
                systemStatus !== "ONLINE" || latency === null
                  ? "text-gray-500"
                  : latency < 100
                  ? "text-green-400"
                  : latency < 300
                  ? "text-yellow-400"
                  : "text-orange-400"
              }`}
            >
              {systemStatus !== "ONLINE" || latency === null ? "---" : `${latency}ms`}
            </span>
          </div>

          {/* ── Logged-in controls ── */}
          {isLoggedIn ? (
            <>
              {/* Anomaly Bell */}
              <button
                onClick={handleBellToggle}
                title={alertsEnabled ? "Alerts ON — click to disable" : "Alerts OFF — click to enable"}
                className={`glass-card !rounded-full p-2.5 flex items-center transition-all ${
                  alertsEnabled
                    ? "text-orange-400 border-orange-500/30 shadow-[0_0_10px_rgba(255,150,0,0.2)]"
                    : "text-gray-600 hover:text-gray-300"
                }`}
              >
                {alertsEnabled ? <Bell size={16} className="animate-pulse" /> : <BellOff size={16} />}
              </button>

              {/* User + Settings */}
              <div className="relative">
                <button
                  onClick={() => setSettingsOpen((v) => !v)}
                  className="glass-card !rounded-full px-4 py-2 flex items-center gap-2 hover:bg-white/10 transition-colors"
                >
                  <UserCircle2 size={16} className="text-orange-400" />
                  <span className="text-xs font-bold text-orange-200 max-w-[120px] truncate hidden md:block">
                    {user?.email}
                  </span>
                  <Settings size={12} className="text-gray-500" />
                </button>

                {/* Dropdown */}
                {settingsOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setSettingsOpen(false)}
                    />
                    <div className="absolute right-0 top-full mt-2 w-56 bg-[#111] border border-white/10 rounded-xl shadow-2xl z-20 overflow-hidden">
                      <div className="px-4 py-3 border-b border-white/10">
                        <p className="text-[10px] text-gray-500 uppercase tracking-wider">Signed in as</p>
                        <p className="text-sm font-bold text-orange-200 truncate">{user?.email}</p>
                      </div>

                      <div className="p-2">
                        {/* Alerts toggle */}
                        <button
                          onClick={handleBellToggle}
                          className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-white/5 transition-colors text-left"
                        >
                          <span className="flex items-center gap-2 text-xs text-gray-300">
                            {alertsEnabled ? <Bell size={13} className="text-orange-400" /> : <BellOff size={13} className="text-gray-500" />}
                            Desktop Notifications
                          </span>
                          <div
                            className={`w-7 h-3.5 rounded-full transition-colors ${
                              alertsEnabled ? "bg-orange-500" : "bg-gray-700"
                            } relative`}
                          >
                            <div
                              className={`absolute top-0.5 w-2.5 h-2.5 bg-white rounded-full transition-transform ${
                                alertsEnabled ? "translate-x-4" : "translate-x-0.5"
                              }`}
                            />
                          </div>
                        </button>

                        {/* Email Alerts toggle */}
                        <button
                          onClick={() => setEmailAlertsEnabled(!emailAlertsEnabled)}
                          className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-white/5 transition-colors text-left mt-1"
                        >
                          <span className="flex items-center gap-2 text-xs text-gray-300">
                            <Radio size={13} className={emailAlertsEnabled ? "text-orange-400" : "text-gray-500"} />
                            Email Alerts
                          </span>
                          <div
                            className={`w-7 h-3.5 rounded-full transition-colors ${
                              emailAlertsEnabled ? "bg-orange-500" : "bg-gray-700"
                            } relative`}
                          >
                            <div
                              className={`absolute top-0.5 w-2.5 h-2.5 bg-white rounded-full transition-transform ${
                                emailAlertsEnabled ? "translate-x-4" : "translate-x-0.5"
                              }`}
                            />
                          </div>
                        </button>

                        {/* Min Threat Level Selection */}
                        {emailAlertsEnabled && (
                          <div className="px-3 py-1.5 mt-1 border-t border-white/5 flex flex-col gap-1">
                            <label className="text-[9px] text-gray-500 uppercase font-bold tracking-wider">
                              Alert Threshold
                            </label>
                            <select
                              value={alertMinStatus}
                              onChange={(e) => setAlertMinStatus(e.target.value)}
                              className="bg-black border border-white/10 text-[10px] text-gray-300 rounded p-1 font-mono uppercase focus:outline-none focus:border-orange-500/50"
                            >
                              <option value="RAPID_INTENSIFICATION">Intensification+</option>
                              <option value="M_CLASS_FLARE">M-Class+</option>
                              <option value="X_CLASS_FLARE">X-Class Only</option>
                            </select>
                          </div>
                        )}

                        <div className="border-t border-white/10 my-1" />

                        {/* Sign out */}
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-red-950/50 transition-colors text-red-400 text-xs"
                        >
                          <LogOut size={13} />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </>
          ) : (
            // ── Logged-out: Sign In button ──
            <button
              onClick={() => setLoginOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold tracking-wider text-white bg-gradient-to-r from-orange-600/80 to-red-600/80 hover:from-orange-500 hover:to-red-500 transition-all border border-orange-500/30 shadow-[0_0_15px_rgba(255,100,0,0.2)]"
            >
              <LogIn size={14} />
              SIGN IN
            </button>
          )}
        </div>
      </header>

      {/* ── Login Modal ─────────────────────────────────────────────────────── */}
      <LoginModal isOpen={loginOpen} onClose={() => setLoginOpen(false)} />
    </>
  );
};
