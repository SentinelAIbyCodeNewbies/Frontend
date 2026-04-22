import { useState, useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { paymentService, PaymentDetails } from '../services/paymentService';
import { connection } from '../lib/solana-utils';

export const useSolanaPay = () => {
  const wallet = useWallet();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processPayment = useCallback(async (details: PaymentDetails) => {
    if (!wallet.connected || !wallet.publicKey || !wallet.signTransaction) {
      setError("Wallet not fully connected");
      return null;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const transaction = await paymentService.createSubscriptionTransaction(wallet, details);
      
      // Sign and send transaction
      const signedTransaction = await wallet.signTransaction(transaction);
      const signature = await connection.sendRawTransaction(signedTransaction.serialize());
      
      // Confirm transaction
      const confirmation = await connection.confirmTransaction(signature, 'confirmed');
      
      if (confirmation.value.err) {
        throw new Error("Transaction failed to confirm");
      }

      return signature;
    } catch (err: any) {
      console.error("Payment error:", err);
      setError(err.message || "Failed to process payment");
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, [wallet]);

  return {
    processPayment,
    isProcessing,
    error,
    connected: wallet.connected
  };
};
