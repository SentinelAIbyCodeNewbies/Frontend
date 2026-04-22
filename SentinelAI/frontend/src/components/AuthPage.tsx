import { useState, type FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Lock, ArrowRight, Eye, EyeOff, LogIn, UserPlus } from 'lucide-react';
import { useStore } from '../store/useStore';
import { GlassEffect, GlassButton } from './ui/liquid-glass';

export default function AuthPage() {
  const { setUser, setCurrentPage } = useStore();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [localError, setLocalError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLocalError('');
    setIsLoading(true);

    try {
      const baseUrl = import.meta.env.VITE_API_URL || '/api';
      if (mode === 'register') {
        const registerRes = await fetch(`${baseUrl}/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
        const registerData = await registerRes.json();
        if (!registerRes.ok) {
          throw new Error(registerData.detail || 'Registration failed');
        }
      }

      const loginRes = await fetch(`${baseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const loginData = await loginRes.json();
      if (!loginRes.ok) {
        throw new Error(loginData.detail || 'Authentication failed');
      }

      const token = typeof loginData.access_token === 'string' ? loginData.access_token : null;
      const apiKey =
        typeof loginData.api_key === 'string'
          ? loginData.api_key
          : typeof loginData.api_key?.key === 'string'
            ? loginData.api_key.key
            : null;

      if (!token) {
        throw new Error('Backend login succeeded but no access token was returned.');
      }

      setUser({ email }, token, apiKey);
      setCurrentPage('api-dashboard');
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4">
      <div className="pointer-events-none absolute inset-0 -z-20 overflow-hidden">
        <div className="landing-ambient-orb landing-ambient-orb--emerald" />
        <div className="landing-ambient-orb landing-ambient-orb--cyan" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-md"
      >
        {/* Header */}
        <div className="text-center mb-10 space-y-3">
          <p className="text-[10px] uppercase tracking-[0.4em] text-emerald-500 font-medium">
            Developer Portal
          </p>
          <h1 className="text-3xl md:text-4xl font-medium tracking-tighter text-white">
            {mode === 'login' ? 'Welcome Back' : 'Create Account'}
          </h1>
          <p className="text-white/40 text-sm font-light">
            {mode === 'login' ? 'Access your neural API dashboard.' : 'Join the SentinelAI developer ecosystem.'}
          </p>
        </div>

        <GlassEffect className="rounded-3xl border border-white/10 shadow-2xl overflow-hidden">
          {/* Mode Toggle */}
          <div className="flex border-b border-white/5">
            {(['login', 'register'] as const).map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setLocalError(''); }}
                className={`flex-1 py-4 text-[10px] uppercase tracking-[0.2em] transition-all duration-300 flex items-center justify-center gap-2 ${
                  mode === m ? 'text-emerald-500 bg-white/[0.05]' : 'text-white/30 hover:text-white/60'
                }`}
              >
                {m === 'login' ? <LogIn size={12} /> : <UserPlus size={12} />}
                {m === 'login' ? 'Sign In' : 'Register'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-5">
            {/* Email */}
            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-emerald-500 transition-colors">
                <Mail size={16} />
              </div>
              <input
                type="email"
                placeholder="developer@sentinelai.io"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-4 pl-11 pr-4 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-emerald-500/50 focus:bg-white/[0.05] transition-all"
              />
            </div>

            {/* Password */}
            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-emerald-500 transition-colors">
                <Lock size={16} />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Min. 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-4 pl-11 pr-11 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-emerald-500/50 focus:bg-white/[0.05] transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/60 transition-colors"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {/* Error */}
            <AnimatePresence>
              {localError && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="text-xs text-rose-400 text-center bg-rose-500/5 border border-rose-500/10 rounded-xl px-4 py-3"
                >
                  {localError}
                </motion.p>
              )}
            </AnimatePresence>

            <GlassButton
              onClick={() => handleSubmit({ preventDefault: () => {} } as any)}
              className="w-full bg-emerald-500 hover:bg-emerald-400 py-4 mt-2"
              disabled={isLoading}
            >
              <div className="flex items-center justify-center gap-2 text-black font-medium">
                {isLoading ? (
                  <motion.div
                    className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                  />
                ) : (
                  <>
                    {mode === 'login' ? 'Sign In' : 'Create Account'}
                    <ArrowRight size={16} />
                  </>
                )}
              </div>
            </GlassButton>
          </form>
        </GlassEffect>

        <div className="text-center mt-6">
          <button
            onClick={() => setCurrentPage('home')}
            className="text-[10px] uppercase tracking-widest text-white/20 hover:text-white/50 transition-colors"
          >
            ← Back to SentinelAI
          </button>
        </div>
      </motion.div>
    </div>
  );
}
