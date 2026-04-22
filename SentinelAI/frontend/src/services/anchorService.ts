import { Transaction, TransactionInstruction, PublicKey } from '@solana/web3.js';
import { MEMO_PROGRAM_ID } from '../lib/solana-utils';
import { connection } from '../lib/solana-utils';

export const createAnchorTransaction = async (walletPublicKey: PublicKey, fileHash: string) => {
  const tx = new Transaction();

  // Add the hash as a Memo - this makes it immutable and searchable on-chain
  tx.add(
    new TransactionInstruction({
      keys: [{ pubkey: walletPublicKey, isSigner: true, isWritable: true }],
      data: Buffer.from(`SentinelAI_Hash:${fileHash}`),
      programId: MEMO_PROGRAM_ID,
    })
  );

  return tx;
};

export const anchorService = {
  async anchorHash(wallet: any, fileHash: string): Promise<string> {
    if (!wallet?.publicKey || !wallet?.signTransaction) {
      throw new Error('Wallet not fully connected');
    }

    const tx = await createAnchorTransaction(wallet.publicKey, fileHash);
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
    tx.feePayer = wallet.publicKey;
    tx.recentBlockhash = blockhash;

    const signedTransaction = await wallet.signTransaction(tx);
    const signature = await connection.sendRawTransaction(signedTransaction.serialize());
    const confirmation = await connection.confirmTransaction(
      { signature, blockhash, lastValidBlockHeight },
      'confirmed'
    );

    if (confirmation.value.err) {
      throw new Error('Transaction failed to confirm');
    }

    return signature;
  },

  async verifyHash(_hash: string) {
    // Placeholder until a dedicated on-chain lookup flow is implemented.
    return { verified: false, message: 'Hash verification lookup is not implemented yet.' };
  },
};
