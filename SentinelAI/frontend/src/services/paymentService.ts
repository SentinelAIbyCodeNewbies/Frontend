import { Transaction, SystemProgram, PublicKey } from '@solana/web3.js';
import { MERCHANT_WALLET } from '../lib/solana-utils';

export interface PaymentDetails {
  solAmount: number;
}

export const createSubscriptionTx = async (userWallet: PublicKey, solAmount: number) => {
  const tx = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: userWallet,
      toPubkey: MERCHANT_WALLET,
      lamports: solAmount * 1_000_000_000, // Converts SOL to Lamports
    })
  );

  return tx;
};

export const paymentService = {
  async createSubscriptionTransaction(wallet: any, details: PaymentDetails) {
    if (!wallet?.publicKey) {
      throw new Error('Wallet not connected');
    }

    return createSubscriptionTx(wallet.publicKey, details.solAmount);
  },
};
