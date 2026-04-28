import { useState, useEffect, type FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Key, Plus, Copy, Check, Terminal, RefreshCw, Wallet, Zap, Shield, Crown, ExternalLink, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { useStore } from '../store/useStore';
import { GlassEffect, GlassButton } from './ui/liquid-glass';
import { useWallet } from '@solana/wallet-adapter-react';
import { useConnection } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { SystemProgram, Transaction, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { MERCHANT_WALLET, getExplorerUrl } from '../lib/solana-utils';
import { buildApiUrl } from '../lib/api-base';

import '@solana/wallet-adapter-react-ui/styles.css';

interface ApiKey {
  key: string;
  created_at: string;
}

interface TxResult {
  signature: string;
  plan: string;
}

const PLANS = [
  { name: 'Starter', price: 0.05, icon: Zap, calls: '1,000', color: 'emerald', popular: false },
  { name: 'Pro', price: 0.15, icon: Shield, calls: '10,000', color: 'cyan', popular: true },
  { name: 'Enterprise', price: 0.5, icon: Crown, calls: 'Unlimited', color: 'amber', popular: false },
] as const;

export default function ApiDashboard() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [purchasingPlan, setPurchasingPlan] = useState<string | null>(null);
  const [txResult, setTxResult] = useState<TxResult | null>(null);
  const [txError, setTxError] = useState<string | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const { token, apiKey, user, setError, setLoading, setUser } = useStore();

  const { publicKey, connected, sendTransaction, connect, wallet, select } = useWallet();
  const { connection } = useConnection();

  // Fetch SOL balance when wallet connects
  useEffect(() => {
    if (publicKey && connection) {
      connection.getBalance(publicKey).then((bal) => {
        setBalance(bal / LAMPORTS_PER_SOL);
      }).catch(() => setBalance(null));
    } else {
      setBalance(null);
    }
  }, [publicKey, connection, txResult]);

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
      const res = await fetch(buildApiUrl('/auth/regenerate-key'), {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'ngrok-skip-browser-warning': 'true'
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

  const handlePurchase = async (planName: string, priceSOL: number) => {
    if (!connected || !publicKey) {
      setTxError('Please connect your Solana wallet first.');
      return;
    }

    setPurchasingPlan(planName);
    setTxError(null);
    setTxResult(null);

    try {
      // Check balance
      const bal = await connection.getBalance(publicKey);
      const balSOL = bal / LAMPORTS_PER_SOL;
      if (balSOL < priceSOL) {
        throw new Error(
          `Insufficient balance. You have ${balSOL.toFixed(4)} SOL but need ${priceSOL} SOL. ` +
          `Use the Solana Devnet Faucet to get free SOL.`
        );
      }

      // Build the transfer transaction
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: MERCHANT_WALLET,
          lamports: Math.round(priceSOL * LAMPORTS_PER_SOL),
        })
      );

      // Get a recent blockhash
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;

      // Send via wallet adapter (this triggers Phantom popup)
      const signature = await sendTransaction(transaction, connection);

      // Wait for confirmation
      await connection.confirmTransaction(
        { signature, blockhash, lastValidBlockHeight },
        'confirmed'
      );

      setTxResult({ signature, plan: planName });

      // Refresh balance
      const newBal = await connection.getBalance(publicKey);
      setBalance(newBal / LAMPORTS_PER_SOL);
    } catch (err: any) {
      const msg = err?.message || 'Transaction failed';
      // User rejected in wallet
      if (msg.includes('User rejected') || msg.includes('rejected')) {
        setTxError('Transaction cancelled by user.');
      } else {
        setTxError(msg);
      }
    } finally {
      setPurchasingPlan(null);
    }
  };

  const copyToClipboard = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const truncateAddress = (addr: string) =>
    `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  return (
    <div className="min-h-screen pt-32 pb-48 px-6 max-w-6xl mx-auto">
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
              Connect your Solana wallet to purchase access tiers.
            </p>
          </div>

          <button 
            onClick={() => setIsGenerating(true)}
            className="flex items-center gap-2 px-8 py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-medium text-sm uppercase tracking-wider transition-all duration-300 hover:shadow-[0_0_24px_rgba(52,211,153,0.3)]"
          >
            <Plus size={18} />
            Generate New Key
          </button>
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

        {/* ─── Payment Section ─── */}
        <div className="space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-medium text-white tracking-tight">Purchase <span className="text-emerald-500">API Access</span></h2>
            <p className="text-sm text-white/30">Pay with Solana to unlock API access tiers. All payments on Devnet.</p>
          </div>

          {/* Wallet Connection Card */}
          <GlassEffect allowOverflow={true} className="p-6 rounded-3xl border border-white/10 bg-white/[0.02]">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <Wallet size={20} className="text-emerald-500 shrink-0 mt-1 sm:mt-0" />
              <div className="flex-1 min-w-0">
                {connected && publicKey ? (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <p className="text-[10px] uppercase tracking-widest text-emerald-400">Wallet Connected</p>
                    </div>
                    <p className="text-sm font-mono text-white truncate">{publicKey.toBase58()}</p>
                    {balance !== null && (
                      <p className="text-xs text-white/40">
                        Balance: <span className="text-white/70 font-medium">{balance.toFixed(4)} SOL</span>
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-0.5">
                    <p className="text-[10px] uppercase tracking-widest text-white/20">No Wallet Connected</p>
                    <p className="text-xs text-white/40">Connect your Phantom wallet to purchase API access</p>
                  </div>
                )}
              </div>

              {/* Solana Wallet Multi-Button — styled to match the theme */}
              <div className="shrink-0 solana-wallet-override">
                <style>{`
                  .solana-wallet-override .wallet-adapter-button {
                    background: rgba(52, 211, 153, 0.1) !important;
                    border: 1px solid rgba(52, 211, 153, 0.2) !important;
                    color: #34d399 !important;
                    font-family: inherit !important;
                    font-size: 11px !important;
                    font-weight: 500 !important;
                    letter-spacing: 0.1em !important;
                    text-transform: uppercase !important;
                    padding: 0.6rem 1.2rem !important;
                    border-radius: 0.75rem !important;
                    height: auto !important;
                    line-height: 1.4 !important;
                    transition: all 0.3s ease !important;
                  }
                  .solana-wallet-override .wallet-adapter-button:hover {
                    background: rgba(52, 211, 153, 0.2) !important;
                    border-color: rgba(52, 211, 153, 0.4) !important;
                  }
                  .solana-wallet-override .wallet-adapter-button-trigger {
                    background: rgba(52, 211, 153, 0.1) !important;
                  }
                  .solana-wallet-override .wallet-adapter-button img,
                  .solana-wallet-override .wallet-adapter-button i {
                    width: 18px !important;
                    height: 18px !important;
                  }
                `}</style>
                <WalletMultiButton />
              </div>
            </div>
          </GlassEffect>

          {/* Merchant Info */}
          <div className="flex items-center gap-3 px-6 py-4 rounded-2xl bg-white/[0.03] border border-white/10">
            <Shield size={14} className="text-white/20 shrink-0" />
            <p className="text-[10px] text-white/20 font-mono truncate">
              Merchant: {MERCHANT_WALLET.toBase58()}
            </p>
          </div>

          {/* Transaction Result Toast */}
          <AnimatePresence>
            {txResult && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <GlassEffect className="p-5 rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.03]">
                  <div className="flex items-start gap-4">
                    <CheckCircle2 size={22} className="text-emerald-500 shrink-0 mt-0.5" />
                    <div className="flex-1 space-y-2">
                      <p className="text-sm font-medium text-emerald-400">
                        {txResult.plan} plan purchased successfully!
                      </p>
                      <p className="text-xs text-white/40 font-mono truncate">
                        Tx: {txResult.signature}
                      </p>
                      <a
                        href={getExplorerUrl(txResult.signature)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-emerald-400 hover:text-emerald-300 transition-colors"
                      >
                        View on Solana Explorer <ExternalLink size={12} />
                      </a>
                    </div>
                    <button
                      onClick={() => setTxResult(null)}
                      className="text-white/20 hover:text-white/60 text-xs transition-colors"
                    >
                      ✕
                    </button>
                  </div>
                </GlassEffect>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Transaction Error Toast */}
          <AnimatePresence>
            {txError && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <GlassEffect className="p-5 rounded-2xl border border-rose-500/20 bg-rose-500/[0.03]">
                  <div className="flex items-start gap-4">
                    <XCircle size={22} className="text-rose-500 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm text-rose-300">{txError}</p>
                    </div>
                    <button
                      onClick={() => setTxError(null)}
                      className="text-white/20 hover:text-white/60 text-xs transition-colors"
                    >
                      ✕
                    </button>
                  </div>
                </GlassEffect>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Pricing Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {PLANS.map((plan) => {
              const isPurchasing = purchasingPlan === plan.name;

              return (
                <GlassEffect 
                  key={plan.name} 
                  className={`p-8 rounded-3xl border ${plan.popular ? 'border-cyan-500/30 bg-white/[0.03]' : 'border-white/10 bg-white/[0.02]'} space-y-6 relative hover:border-white/20 transition-all duration-500`}
                >
                  {plan.popular && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[8px] uppercase tracking-[0.3em] text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-3 py-1 rounded-full">
                      Popular
                    </span>
                  )}
                  <div className="space-y-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      plan.color === 'emerald' ? 'bg-emerald-500/10 text-emerald-500' :
                      plan.color === 'cyan' ? 'bg-cyan-500/10 text-cyan-500' :
                      'bg-amber-500/10 text-amber-500'
                    }`}>
                      <plan.icon size={20} />
                    </div>
                    <h3 className="text-white font-medium">{plan.name}</h3>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-medium text-white">{plan.price}</span>
                      <span className="text-sm text-white/30">SOL</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs text-white/40">
                      <Check size={14} className="text-emerald-500" />
                      <span>{plan.calls} API calls/month</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-white/40">
                      <Check size={14} className="text-emerald-500" />
                      <span>Blockchain anchoring</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-white/40">
                      <Check size={14} className="text-emerald-500" />
                      <span>Priority support</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handlePurchase(plan.name, plan.price)}
                    disabled={isPurchasing}
                    className={`w-full py-3 rounded-xl text-sm font-medium uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                      plan.popular 
                        ? 'bg-cyan-500 hover:bg-cyan-400 text-black hover:shadow-[0_0_24px_rgba(6,182,212,0.3)]' 
                        : 'bg-white/5 hover:bg-emerald-500/10 text-white/60 hover:text-emerald-400 border border-white/10 hover:border-emerald-500/30'
                    }`}
                  >
                    {isPurchasing ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Processing...
                      </>
                    ) : !connected ? (
                      <>
                        <Wallet size={16} />
                        Connect Wallet
                      </>
                    ) : (
                      'Purchase'
                    )}
                  </button>
                </GlassEffect>
              );
            })}
          </div>
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
                    <button 
                      type="button"
                      onClick={() => handleGenerate()}
                      className="flex-[2] py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-medium text-sm uppercase tracking-wider transition-all duration-300 hover:shadow-[0_0_24px_rgba(52,211,153,0.3)]"
                    >
                      Regenerate Key
                    </button>
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
