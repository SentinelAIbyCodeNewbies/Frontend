import { useState, useEffect, type FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Key, Plus, Copy, Check, Terminal, RefreshCw } from 'lucide-react';
import { useStore } from '../store/useStore';
import { GlassEffect, GlassButton } from './ui/liquid-glass';

interface ApiKey {
  key: string;
  created_at: string;
}

export default function ApiDashboard() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const { token, apiKey, user, setError, setLoading, setUser } = useStore();

  const fetchKeys = async () => {
    if (!apiKey) {
      setKeys([]);
      return;
    }

    setKeys([
      {
        key: apiKey,
        created_at: new Date().toISOString(),
      },
    ]);
  };

  useEffect(() => {
    fetchKeys();
  }, [apiKey]);

  const handleGenerate = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    if (!token) {
      setError('Please sign in before regenerating your API key.');
      return;
    }

    setLoading(true, 'Regenerating API key...');
    try {
      const baseUrl = import.meta.env.VITE_API_URL || '/api';
      const res = await fetch(`${baseUrl}/auth/regenerate-key`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Failed to generate key');

      const nextApiKey = typeof data.api_key === 'string' ? data.api_key : null;
      if (!nextApiKey) {
        throw new Error('Backend did not return the regenerated API key.');
      }

      setIsGenerating(false);
      setUser(user, token, nextApiKey);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="min-h-screen pt-32 pb-20 px-6 max-w-6xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-12"
      >
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-4">
            <h1 className="text-6xl md:text-8xl font-medium tracking-tighter text-white leading-none">
              Developer <span className="text-emerald-500">Keys</span>
            </h1>
            <p className="text-lg text-white/40 max-w-xl font-light">
              Generate and manage your neural forensic API key.
              Connected to the live FastAPI developer auth flow.
            </p>
          </div>

          <GlassButton 
            onClick={() => setIsGenerating(true)}
            className="bg-emerald-500 hover:bg-emerald-400 px-8 py-4"
            style={{ boxShadow: 'none' }}
          >
            <div className="flex items-center gap-2 text-black font-medium">
              <Plus size={18} />
              Generate New Key
            </div>
          </GlassButton>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {keys.length === 0 ? (
            <GlassEffect className="p-20 rounded-3xl border border-white/5 flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-white/20">
                <Key size={32} />
              </div>
              <div className="space-y-2">
                    <h3 className="text-white font-medium">No API keys found</h3>
                <p className="text-sm text-white/20">Sign in to load your current key, or generate a fresh one.</p>
              </div>
            </GlassEffect>
          ) : (
            keys.map((key, i) => (
              <motion.div
                key={key.key}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <GlassEffect className="p-6 rounded-2xl border border-white/5 group">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-6 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                        <Terminal size={18} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] uppercase tracking-widest text-white/20 mb-1">API Key</p>
                        <p className="text-sm font-mono text-white truncate">{key.key}</p>
                      </div>
                      <div className="hidden md:block">
                        <p className="text-[10px] uppercase tracking-widest text-white/20 mb-1">Created</p>
                        <p className="text-xs text-white/60">{new Date(key.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    
                    <button 
                      onClick={() => copyToClipboard(key.key)}
                      className="p-3 rounded-xl bg-white/5 text-white/20 hover:text-emerald-500 hover:bg-emerald-500/10 transition-all"
                    >
                      {copiedKey === key.key ? <Check size={18} /> : <Copy size={18} />}
                    </button>
                  </div>
                </GlassEffect>
              </motion.div>
            ))
          )}
        </div>
      </motion.div>

      {/* Generation Modal */}
      <AnimatePresence>
        {isGenerating && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              onClick={() => setIsGenerating(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md"
            >
              <GlassEffect className="rounded-3xl border border-white/10 p-8 space-y-8">
                <div className="text-center space-y-4">
                  <div className="flex justify-center">
                    <div className="w-12 h-12 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-500">
                      <RefreshCw size={24} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-medium text-white">Regenerate API Key</h3>
                    <p className="text-sm text-white/40">This will replace your current key with a new one from the backend.</p>
                  </div>
                </div>

                <form onSubmit={handleGenerate} className="space-y-6">
                  <div className="flex gap-4">
                    <button 
                      type="button"
                      onClick={() => setIsGenerating(false)}
                      className="flex-1 py-4 text-xs uppercase tracking-widest text-white/20 hover:text-white transition-colors"
                    >
                      Cancel
                    </button>
                    <GlassButton 
                      onClick={handleGenerate}
                      className="flex-[2] bg-emerald-500 hover:bg-emerald-400 py-4"
                      style={{ boxShadow: 'none' }}
                    >
                      <span className="text-black font-medium">Regenerate Key</span>
                    </GlassButton>
                  </div>
                </form>
              </GlassEffect>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
