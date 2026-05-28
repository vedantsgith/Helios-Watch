/**
 * LoginModal — Helios-Watch Frontend
 *
 * Sliding right-panel modal for optional email + password authentication.
 * Supports both Login and Register modes with inline error handling.
 */

import React, { useState } from "react";
import { Mail, Lock, Loader2, AlertCircle, CheckCircle, X, UserPlus, LogIn } from "lucide-react";
import { useAuthStore } from "./authStore";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type ModalMode = "login" | "register";

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const { login, register, isLoading } = useAuthStore();

  const [mode, setMode] = useState<ModalMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setError("");
    setSuccess("");
  };

  const switchMode = (newMode: ModalMode) => {
    setMode(newMode);
    resetForm();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    try {
      if (mode === "login") {
        await login(email, password);
        setSuccess("Welcome back! Logged in successfully.");
      } else {
        await register(email, password);
        setSuccess("Account created! Welcome to Helios-Watch.");
      }
      setTimeout(() => {
        onClose();
        resetForm();
      }, 1200);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string } } };
      setError(
        axiosErr.response?.data?.detail ||
        (mode === "login" ? "Invalid email or password." : "Could not create account.")
      );
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300 ${
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* Sliding Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-sm z-50 transition-transform duration-300 ease-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="h-full bg-[#0a0a0a] border-l border-white/10 flex flex-col shadow-2xl shadow-black/80">

          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-white/10">
            <div>
              <h2 className="text-xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-yellow-300">
                {mode === "login" ? "Sign In" : "Create Account"}
              </h2>
              <p className="text-xs text-gray-500 mt-0.5 tracking-widest uppercase">
                Helios-Watch Access
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-gray-500 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Mode Toggle */}
          <div className="px-6 pt-6">
            <div className="flex bg-white/5 rounded-lg p-1 border border-white/10">
              <button
                onClick={() => switchMode("login")}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-bold tracking-wider transition-all duration-200 ${
                  mode === "login"
                    ? "bg-orange-500/20 text-orange-300 border border-orange-500/40"
                    : "text-gray-500 hover:text-gray-300"
                }`}
              >
                <LogIn size={14} />
                LOGIN
              </button>
              <button
                onClick={() => switchMode("register")}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-bold tracking-wider transition-all duration-200 ${
                  mode === "register"
                    ? "bg-blue-500/20 text-blue-300 border border-blue-500/40"
                    : "text-gray-500 hover:text-gray-300"
                }`}
              >
                <UserPlus size={14} />
                REGISTER
              </button>
            </div>
          </div>

          {/* Form */}
          <div className="flex-1 overflow-y-auto px-6 py-6">
            {/* Status Messages */}
            {success && (
              <div className="mb-4 p-3 bg-green-900/30 border border-green-500/50 rounded-lg flex gap-3 items-start">
                <CheckCircle size={16} className="text-green-400 mt-0.5 flex-shrink-0" />
                <p className="text-green-300 text-sm">{success}</p>
              </div>
            )}
            {error && (
              <div className="mb-4 p-3 bg-red-900/30 border border-red-500/50 rounded-lg flex gap-3 items-start">
                <AlertCircle size={16} className="text-red-400 mt-0.5 flex-shrink-0" />
                <p className="text-red-300 text-sm">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <div>
                <label htmlFor="auth-email" className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">
                  Email Address
                </label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    id="auth-email"
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError(""); }}
                    placeholder="you@example.com"
                    disabled={isLoading}
                    className="w-full pl-9 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-600 text-sm focus:outline-none focus:border-orange-500/60 focus:ring-1 focus:ring-orange-500/30 transition disabled:opacity-50"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label htmlFor="auth-password" className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">
                  Password
                </label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    id="auth-password"
                    type="password"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(""); }}
                    placeholder={mode === "register" ? "Min 6 characters" : "Your password"}
                    disabled={isLoading}
                    className="w-full pl-9 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-600 text-sm focus:outline-none focus:border-orange-500/60 focus:ring-1 focus:ring-orange-500/30 transition disabled:opacity-50"
                  />
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoading || !email || !password}
                className={`w-full py-3 rounded-lg font-bold text-sm tracking-wider transition-all duration-200 flex items-center justify-center gap-2 mt-6 ${
                  mode === "login"
                    ? "bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white"
                    : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white"
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isLoading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    {mode === "login" ? "Signing in..." : "Creating account..."}
                  </>
                ) : mode === "login" ? (
                  <><LogIn size={16} /> SIGN IN</>
                ) : (
                  <><UserPlus size={16} /> CREATE ACCOUNT</>
                )}
              </button>
            </form>

            {/* Info Box */}
            <div className="mt-6 p-4 bg-white/3 border border-white/5 rounded-lg">
              <p className="text-xs text-gray-500 leading-relaxed">
                {mode === "login"
                  ? "Sign in to enable anomaly notifications and save your preferences. The dashboard works without an account."
                  : "Create a free account to receive browser notifications when solar anomalies are detected."}
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
