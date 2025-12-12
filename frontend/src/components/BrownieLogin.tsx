// BrownieLogin Component - Session-based OTP Login for Brownie Challenge
// Implements two-step email OTP authentication UI.

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import axios from 'axios';
import { useStore } from '../store/useStore';

const API_BASE_URL = 'http://127.0.0.1:8001';

interface LoginState {
  stage: 'email' | 'otp';
  email: string;
  otp: string;
  loading: boolean;
  error: string;
  success: string;
  otpExpiry: number | null;
}

export const BrownieLogin: React.FC = () => {
  const navigate = useNavigate();
  const setUser = useStore((state) => state.setUser);
  const [state, setState] = useState<LoginState>({
    stage: 'email',
    email: '',
    otp: '',
    loading: false,
    error: '',
    success: '',
    otpExpiry: null,
  });

  // ============ STAGE A: REQUEST OTP ============

  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setState(prev => ({ ...prev, error: '', success: '', loading: true }));

    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/brownie/request-otp`,
        { email: state.email },
        { withCredentials: true }
      );

      if (response.data.success) {
        setState(prev => ({
          ...prev,
          stage: 'otp',
          success: response.data.message,
          loading: false,
          otpExpiry: Date.now() + 5 * 60 * 1000, // 5 minutes from now
        }));
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || 'Failed to send OTP. Try again.';
      setState(prev => ({
        ...prev,
        error: errorMsg,
        loading: false,
      }));
    }
  };

  // ============ STAGE B: VERIFY OTP ============

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setState(prev => ({ ...prev, error: '', success: '', loading: true }));

    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/brownie/verify-otp`,
        {
          email: state.email,
          otp_code: state.otp,
        },
        { withCredentials: true }
      );

      if (response.data.success) {
        // Set user in global store
        setUser({
          id: response.data.user_id,
          email: response.data.email
        });

        setState(prev => ({
          ...prev,
          success: 'Login successful! Redirecting to dashboard...',
          loading: false,
        }));

        // Redirect to dashboard immediately
        setTimeout(() => {
          navigate('/');
        }, 800);
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || 'OTP verification failed. Try again.';
      setState(prev => ({
        ...prev,
        error: errorMsg,
        loading: false,
      }));
    }
  };

  // ============ BACK TO EMAIL STAGE ============

  const handleBackToEmail = () => {
    setState(prev => ({
      ...prev,
      stage: 'email',
      otp: '',
      error: '',
      success: '',
      otpExpiry: null,
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Helios Watch</h1>
          <p className="text-purple-300">Secure OTP Login</p>
        </div>

        {/* Card */}
        <div className="bg-slate-800 rounded-lg shadow-2xl p-8 border border-purple-500/30">
          {/* Success Message */}
          {state.success && (
            <div className="mb-6 p-4 bg-green-900/30 border border-green-500 rounded-lg flex gap-3">
              <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
              <p className="text-green-300 text-sm">{state.success}</p>
            </div>
          )}

          {/* Error Message */}
          {state.error && (
            <div className="mb-6 p-4 bg-red-900/30 border border-red-500 rounded-lg flex gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-red-300 text-sm">{state.error}</p>
            </div>
          )}

          {/* STAGE A: EMAIL INPUT */}
          {state.stage === 'email' && (
            <form onSubmit={handleRequestOTP} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-purple-200 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3.5 w-5 h-5 text-purple-400" />
                  <input
                    id="email"
                    type="email"
                    required
                    placeholder="you@example.com"
                    value={state.email}
                    onChange={e =>
                      setState(prev => ({ ...prev, email: e.target.value, error: '' }))
                    }
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-700 border border-purple-400/50 rounded-lg text-white placeholder-purple-300/60 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-500/30 transition"
                    disabled={state.loading}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={state.loading || !state.email}
                className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 disabled:from-slate-600 disabled:to-slate-600 text-white font-semibold rounded-lg transition flex items-center justify-center gap-2"
              >
                {state.loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Sending OTP...
                  </>
                ) : (
                  'Send OTP'
                )}
              </button>

              <p className="text-center text-slate-400 text-sm">
                We'll send a code to verify your email address
              </p>
            </form>
          )}

          {/* STAGE B: OTP INPUT */}
          {state.stage === 'otp' && (
            <form onSubmit={handleVerifyOTP} className="space-y-6">
              <div>
                <label htmlFor="otp" className="block text-sm font-medium text-purple-200 mb-2">
                  OTP Code
                </label>
                <p className="text-xs text-slate-400 mb-3">Sent to {state.email}</p>
                <div className="relative">
                  <Lock className="absolute left-3 top-3.5 w-5 h-5 text-purple-400" />
                  <input
                    id="otp"
                    type="text"
                    required
                    placeholder="000000"
                    maxLength={6}
                    value={state.otp}
                    onChange={e =>
                      setState(prev => ({
                        ...prev,
                        otp: e.target.value.replace(/\D/g, ''),
                        error: '',
                      }))
                    }
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-700 border border-purple-400/50 rounded-lg text-white placeholder-purple-300/60 text-center text-2xl tracking-widest focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-500/30 transition font-mono"
                    disabled={state.loading}
                  />
                </div>
                <p className="text-xs text-slate-400 mt-2">
                  Code expires in 5 minutes
                </p>
              </div>

              <button
                type="submit"
                disabled={state.loading || state.otp.length !== 6}
                className="w-full py-2.5 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 disabled:from-slate-600 disabled:to-slate-600 text-white font-semibold rounded-lg transition flex items-center justify-center gap-2"
              >
                {state.loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  'Login'
                )}
              </button>

              <button
                type="button"
                onClick={handleBackToEmail}
                disabled={state.loading}
                className="w-full py-2 text-purple-300 hover:text-purple-200 font-medium transition text-sm"
              >
                ← Use Different Email
              </button>
            </form>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-slate-400 text-sm mt-6">
          Secure authentication powered by OTP
        </p>
      </div>
    </div>
  );
};
