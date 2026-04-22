import { PublicKey, Transaction, SystemProgram } from '@solana/web3.js';

export const createPaymentTransaction = async (
  userWallet: PublicKey,
  planAmount: number // e.g., 0.1 for 0.1 SOL
) => {
  // Merchant address (Your wallet where money goes)
  const MERCHANT_WALLET = new PublicKey('YOUR_HACKATHON_WALLET_ADDRESS');

  const transaction = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: userWallet,
      toPubkey: MERCHANT_WALLET,
      lamports: planAmount * 1_000_000_000, // Convert SOL to Lamports
    })
  );

  return transaction;
};
