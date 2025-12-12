import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { ShieldCheck, Mail, Lock, ArrowRight, Loader2, AlertTriangle } from 'lucide-react';
import axios from 'axios';

// Configure Axios with credentials to send cookies
const api = axios.create({
    baseURL: 'http://127.0.0.1:8001',
    withCredentials: true
});

export function Login() {
    const navigate = useNavigate();
    const setUser = useStore((state) => state.setUser);

    const [step, setStep] = useState<'EMAIL' | 'OTP'>('EMAIL');
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSendOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await api.post('/api/auth/login', { email });
            setStep('OTP');
        } catch (err: any) {
            setError(err.response?.data?.detail || "Failed to send OTP. Ensure backend is running.");
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const res = await api.post('/api/auth/verify', { email, otp });
            setUser(res.data.user);
            navigate('/');
        } catch (err: any) {
            setError(err.response?.data?.detail || "Invalid OTP");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen text-white flex items-center justify-center relative overflow-hidden font-sans">
            {/* BACKGROUND & EFFECTS (Reuse from App) */}
            <div className="solar-bg absolute inset-0 z-0"></div>
            <div className="scanlines absolute inset-0 z-0 pointer-events-none"></div>
            <div className="vignette absolute inset-0 z-0 pointer-events-none"></div>

            <div className="relative z-10 w-full max-w-md p-8">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-5xl font-extrabold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-red-400 to-yellow-200 drop-shadow-[0_0_10px_rgba(255,100,0,0.5)]">
                        Helios-Watch
                    </h1>
                    <p className="text-orange-200/60 text-xs mt-2 tracking-[0.3em] uppercase opacity-80">
                        Secure Access Terminal
                    </p>
                </div>

                {/* Card */}
                <div className="glass-card p-8 border border-white/10 backdrop-blur-xl shadow-2xl relative">
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-black/50 border border-white/20 p-2 rounded-full shadow-[0_0_15px_rgba(0,0,0,0.5)]">
                        <ShieldCheck className="text-orange-400 w-8 h-8" />
                    </div>

                    <h2 className="text-2xl font-bold text-center mb-6 mt-4">
                        {step === 'EMAIL' ? 'Identity Verification' : 'Security Clearance'}
                    </h2>

                    {error && (
                        <div className="mb-4 bg-red-500/20 border border-red-500/50 p-3 rounded flex items-center gap-2 text-sm text-red-200 animate-pulse">
                            <AlertTriangle size={16} />
                            {error}
                        </div>
                    )}

                    {step === 'EMAIL' ? (
                        <form onSubmit={handleSendOtp} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-xs uppercase tracking-widest text-gray-400">Official Email</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
                                    <input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="agent@helios.org"
                                        className="w-full bg-black/40 border border-white/10 rounded-lg py-3 pl-10 pr-4 text-white placeholder-gray-600 focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/50 transition-all"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(255,100,0,0.3)] hover:shadow-[0_0_30px_rgba(255,100,0,0.5)] disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? <Loader2 className="animate-spin" /> : <>Request OTP <ArrowRight size={18} /></>}
                            </button>
                        </form>
                    ) : (
                        <form onSubmit={handleVerifyOtp} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-xs uppercase tracking-widest text-gray-400">One-Time Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
                                    <input
                                        type="text"
                                        required
                                        maxLength={6}
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value)}
                                        placeholder="000000"
                                        className="w-full bg-black/40 border border-white/10 rounded-lg py-3 pl-10 pr-4 text-white placeholder-gray-600 focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/50 transition-all tracking-[0.5em] font-mono text-center text-lg"
                                    />
                                </div>
                                <p className="text-xs text-center text-gray-500">Sent to {email} <button type="button" onClick={() => setStep('EMAIL')} className="text-blue-400 hover:underline">Change</button></p>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(0,255,100,0.3)] hover:shadow-[0_0_30px_rgba(0,255,100,0.5)] disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? <Loader2 className="animate-spin" /> : <>AUTHENTICATE <ShieldCheck size={18} /></>}
                            </button>
                        </form>
                    )}
                </div>

                <p className="text-center text-xs text-gray-600 mt-8 tracking-widest">
                    SYSTEM V1.0 // AUTHORIZED PERSONNEL ONLY
                </p>
            </div>
        </div>
    );
}
