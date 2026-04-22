import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { getExplorerUrl } from '../../lib/solana-utils';

export type TransactionState = 'idle' | 'processing' | 'success' | 'error';

interface TransactionStatusProps {
  status: TransactionState;
  signature?: string;
  errorMessage?: string;
  onClose?: () => void;
}

export const TransactionStatus: React.FC<TransactionStatusProps> = ({
  status,
  signature,
  errorMessage,
  onClose
}) => {
  if (status === 'idle') return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="fixed bottom-4 right-4 z-50 w-80 p-4 rounded-xl backdrop-blur-xl bg-gray-900/80 border border-gray-700 shadow-2xl"
      >
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0 mt-0.5">
            {status === 'processing' && (
              <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
            )}
            {status === 'success' && (
              <CheckCircle className="w-5 h-5 text-green-400" />
            )}
            {status === 'error' && (
              <XCircle className="w-5 h-5 text-red-400" />
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium text-white">
              {status === 'processing' && 'Processing Transaction...'}
              {status === 'success' && 'Transaction Successful'}
              {status === 'error' && 'Transaction Failed'}
            </h3>
            
            {status === 'processing' && (
              <p className="mt-1 text-xs text-gray-400">
                Please approve the transaction in your wallet.
              </p>
            )}

            {signature && status === 'success' && (
              <a
                href={getExplorerUrl(signature)}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 text-xs text-blue-400 hover:text-blue-300 underline block truncate"
              >
                View on Explorer
              </a>
            )}

            {status === 'error' && errorMessage && (
              <p className="mt-1 text-xs text-red-400">
                {errorMessage}
              </p>
            )}
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className="flex-shrink-0 ml-4 text-gray-400 hover:text-white"
            >
              <span className="sr-only">Close</span>
              <XCircle className="w-5 h-5" />
            </button>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
