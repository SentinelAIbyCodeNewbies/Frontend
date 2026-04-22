import React from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { motion } from 'framer-motion';

// Import base styles for wallet adapter
import '@solana/wallet-adapter-react-ui/styles.css';

export const WalletConnect: React.FC = () => {
  const { connected } = useWallet();

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="relative group inline-block"
    >
      <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-lg blur opacity-50 group-hover:opacity-100 transition duration-500 group-hover:duration-200" />
      
      {/* We are overriding the default styling using global CSS or passing generic classes to the container */}
      <div className="relative flex items-center justify-center bg-gray-900 rounded-lg">
        <style>
          {`
            .wallet-adapter-button {
              background-color: transparent !important;
              color: white !important;
              font-family: inherit !important;
              font-weight: 600 !important;
              padding: 0.75rem 1.5rem !important;
              border-radius: 0.5rem !important;
              height: auto !important;
              transition: all 0.2s ease-in-out !important;
            }
            .wallet-adapter-button:hover {
              background-color: rgba(255, 255, 255, 0.05) !important;
            }
            .wallet-adapter-button-trigger {
              background-color: transparent !important;
            }
          `}
        </style>
        <WalletMultiButton />
      </div>
    </motion.div>
  );
};
