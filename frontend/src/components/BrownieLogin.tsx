// BrownieLogin Component - Session-based OTP Login for Brownie Challenge
// Implements two-step email OTP authentication UI.

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import axios from 'axios';
import { useStore } from '../store/useStore';

const API_BASE_URL = 'http://127.0.0.1:8000';

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
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4 relative overflow-hidden">
      {/* BACKGROUND & EFFECTS - Same as Dashboard */}
      <div className="solar-bg"></div>
      <div className="scanlines"></div>
      <div className="vignette"></div>

      {/* PULSATING SUN - CORE */}
      <div
        className="absolute top-1/2 -translate-y-1/2 pointer-events-none"
        style={{
          width: '400px',
          height: '400px',
          background: 'radial-gradient(circle, rgba(255,200,0,0.9) 0%, rgba(255,140,0,0.7) 20%, rgba(255,69,0,0.5) 40%, transparent 70%)',
          borderRadius: '50%',
          filter: 'blur(60px)',
          animation: 'move-and-pulse 15s ease-in-out infinite',
          zIndex: 1
        }}
      />

      {/* OUTER GLOW LAYER */}
      <div
        className="absolute top-1/2 -translate-y-1/2 pointer-events-none"
        style={{
          width: '800px',
          height: '800px',
          background: 'radial-gradient(circle, rgba(255,140,0,0.3) 0%, rgba(255,69,0,0.2) 30%, rgba(255,100,0,0.1) 50%, transparent 70%)',
          borderRadius: '50%',
          filter: 'blur(80px)',
          animation: 'move-and-pulse-slow 15s ease-in-out infinite',
          zIndex: 1
        }}
      />

      {/* AMBIENT LIGHT REFLECTIONS */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 0%, transparent 40%, rgba(255,69,0,0.05) 70%, rgba(255,140,0,0.1) 100%)',
          animation: 'ambient-pulse 4s ease-in-out infinite',
          zIndex: 1
        }}
      />

      {/* LIGHT RAYS */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
        style={{
          width: '1000px',
          height: '1000px',
          background: `
            conic-gradient(
              from 0deg,
              transparent 0deg,
              rgba(255,140,0,0.1) 10deg,
              transparent 20deg,
              transparent 90deg,
              rgba(255,69,0,0.08) 100deg,
              transparent 110deg,
              transparent 180deg,
              rgba(255,200,0,0.12) 190deg,
              transparent 200deg,
              transparent 270deg,
              rgba(255,100,0,0.09) 280deg,
              transparent 290deg,
              transparent 360deg
            )
          `,
          filter: 'blur(40px)',
          animation: 'rotate-rays 20s linear infinite',
          zIndex: 0
        }}
      />

      <style>{`
        @keyframes move-and-pulse {
          0% {
            left: -200px;
            transform: translateY(-50%) scale(0.5);
            opacity: 0.8;
          }
          25% {
            transform: translateY(-50%) scale(1);
            opacity: 1;
          }
          50% {
            left: 50%;
            transform: translate(-50%, -50%) scale(1.5);
            opacity: 0.9;
          }
          75% {
            transform: translateY(-50%) scale(2);
            opacity: 1;
          }
          100% {
            left: calc(100% + 200px);
            transform: translateY(-50%) scale(2.5);
            opacity: 0.8;
          }
        }
        
        @keyframes move-and-pulse-slow {
          0% {
            left: -400px;
            transform: translateY(-50%) scale(0.5);
            opacity: 0.5;
          }
          25% {
            transform: translateY(-50%) scale(1);
            opacity: 0.7;
          }
          50% {
            left: 50%;
            transform: translate(-50%, -50%) scale(1.5);
            opacity: 0.6;
          }
          75% {
            transform: translateY(-50%) scale(2);
            opacity: 0.7;
          }
          100% {
            left: calc(100% + 400px);
            transform: translateY(-50%) scale(2.5);
            opacity: 0.5;
          }
        }
        
        @keyframes ambient-pulse {
          0%, 100% {
            opacity: 0.6;
          }
          50% {
            opacity: 1;
          }
        }
        
        @keyframes rotate-rays {
          from {
            transform: translate(-50%, -50%) rotate(0deg);
          }
          to {
            transform: translate(-50%, -50%) rotate(360deg);
          }
        }
      `}</style>

      <div className="w-full max-w-md relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-6xl font-extrabold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-red-400 to-yellow-200 drop-shadow-[0_0_10px_rgba(255,100,0,0.5)] mb-2">
            Helios Watch
          </h1>
          <p className="text-orange-200/60 text-sm tracking-[0.3em] uppercase">Secure OTP Login</p>
        </div>

        {/* Card */}
        <div className="glass-card p-8 border border-orange-500/30">
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
                <label htmlFor="email" className="block text-sm font-medium text-orange-200 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3.5 w-5 h-5 text-orange-400" />
                  <input
                    id="email"
                    type="email"
                    required
                    placeholder="you@example.com"
                    value={state.email}
                    onChange={e =>
                      setState(prev => ({ ...prev, email: e.target.value, error: '' }))
                    }
                    className="w-full pl-10 pr-4 py-2.5 bg-black/40 border border-orange-400/50 rounded-lg text-white placeholder-orange-300/60 focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-500/30 transition backdrop-blur-sm"
                    disabled={state.loading}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={state.loading || !state.email}
                className="w-full py-2.5 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 disabled:from-gray-600 disabled:to-gray-600 text-white font-semibold rounded-lg transition flex items-center justify-center gap-2 shadow-lg"
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

              <p className="text-center text-gray-400 text-sm">
                We'll send a code to verify your email address
              </p>
            </form>
          )}

          {/* STAGE B: OTP INPUT */}
          {state.stage === 'otp' && (
            <form onSubmit={handleVerifyOTP} className="space-y-6">
              <div>
                <label htmlFor="otp" className="block text-sm font-medium text-orange-200 mb-2">
                  OTP Code
                </label>
                <p className="text-xs text-gray-400 mb-3">Sent to {state.email}</p>
                <div className="relative">
                  <Lock className="absolute left-3 top-3.5 w-5 h-5 text-orange-400" />
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
                    className="w-full pl-10 pr-4 py-2.5 bg-black/40 border border-orange-400/50 rounded-lg text-white placeholder-orange-300/60 text-center text-2xl tracking-widest focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-500/30 transition font-mono backdrop-blur-sm"
                    disabled={state.loading}
                  />
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  Code expires in 5 minutes
                </p>
              </div>

              <button
                type="submit"
                disabled={state.loading || state.otp.length !== 6}
                className="w-full py-2.5 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 disabled:from-gray-600 disabled:to-gray-600 text-white font-semibold rounded-lg transition flex items-center justify-center gap-2 shadow-lg"
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
                className="w-full py-2 text-orange-300 hover:text-orange-200 font-medium transition text-sm"
              >
                ← Use Different Email
              </button>
            </form>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-gray-400 text-sm mt-6">
          Secure authentication powered by OTP
        </p>
      </div>
    </div>
  );
};
