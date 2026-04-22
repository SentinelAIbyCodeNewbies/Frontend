import { useState, useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { anchorService } from '../services/anchorService';

export const useSolanaAnchor = () => {
  const wallet = useWallet();
  const [isAnchoring, setIsAnchoring] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const anchorHash = useCallback(async (hash: string) => {
    if (!wallet.connected || !wallet.publicKey) {
      setError("Wallet not connected");
      return null;
    }

    setIsAnchoring(true);
    setError(null);

    try {
      const signature = await anchorService.anchorHash(wallet, hash);
      return signature;
    } catch (err: any) {
      console.error("Anchoring error:", err);
      setError(err.message || "Failed to anchor hash");
      return null;
    } finally {
      setIsAnchoring(false);
    }
  }, [wallet]);

  const verifyHash = useCallback(async (hash: string) => {
    try {
      return await anchorService.verifyHash(hash);
    } catch (err) {
      console.error("Verification error:", err);
      return null;
    }
  }, []);

  return {
    anchorHash,
    verifyHash,
    isAnchoring,
    error,
    connected: wallet.connected
  };
};
