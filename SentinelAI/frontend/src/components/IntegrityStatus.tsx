import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useStore } from '../store/useStore';
import { Terminal, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';

export const IntegrityStatus = () => {
  const { connected } = useWallet();
  const { user, setCurrentPage } = useStore();

  return (
    <div className="flex flex-col items-end gap-2.5">
      <div className="flex items-center gap-2">
        {connected && (
          <span className="flex items-center gap-1.5 text-emerald-400 text-[9px] uppercase tracking-[0.2em] px-3 py-1.5 bg-emerald-500/[0.08] border border-emerald-500/20 rounded-full backdrop-blur-sm">
            <span className="w-1 h-1 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
            Blockchain Optimized
          </span>
        )}
        <WalletMultiButton
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '9999px',
            color: 'rgba(255,255,255,0.6)',
            fontSize: '9px',
            fontWeight: 500,
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            padding: '8px 18px',
            height: 'auto',
            lineHeight: 1,
            fontFamily: 'inherit',
            transition: 'all 0.3s ease'
          }}
        />
      </div>

      {user && (
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => setCurrentPage('api-dashboard')}
          className="group flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.02] border border-white/5 text-white/30 hover:bg-emerald-500/5 hover:border-emerald-500/20 hover:text-emerald-400 transition-all duration-500"
        >
          <Terminal size={12} className="group-hover:scale-110 transition-transform" />
          <span className="text-[9px] uppercase tracking-[0.2em] font-medium">API Portal</span>
          <ChevronRight size={10} className="opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
        </motion.button>
      )}
    </div>
  );
};
