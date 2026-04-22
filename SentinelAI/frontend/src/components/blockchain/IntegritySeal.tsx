import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, ExternalLink } from 'lucide-react';
import { getExplorerUrl } from '../../lib/solana-utils';

interface IntegritySealProps {
  signature: string;
  timestamp: number;
}

export const IntegritySeal: React.FC<IntegritySealProps> = ({ signature, timestamp }) => {
  const date = new Date(timestamp).toLocaleString();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="inline-flex items-center space-x-3 bg-gradient-to-r from-gray-900 to-gray-800 border border-emerald-500/30 rounded-xl p-3 shadow-[0_0_15px_rgba(16,185,129,0.15)]"
    >
      <div className="flex-shrink-0 bg-emerald-500/20 p-2 rounded-full">
        <ShieldCheck className="w-5 h-5 text-emerald-400" />
      </div>
      
      <div className="flex flex-col">
        <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
          Verified on Solana
        </span>
        <span className="text-xs text-gray-400">
          {date}
        </span>
      </div>

      <a
        href={getExplorerUrl(signature)}
        target="_blank"
        rel="noopener noreferrer"
        className="ml-2 p-1.5 bg-gray-800 hover:bg-gray-700 rounded-md transition-colors text-gray-400 hover:text-white"
        title="View Transaction"
      >
        <ExternalLink className="w-4 h-4" />
      </a>
    </motion.div>
  );
};
