import { Connection, PublicKey, Transaction, SystemProgram } from '@solana/web3.js';

// This is where the magic happens for the 'Integrity Anchor'
export const anchorFileHashOnChain = async (
  walletPublicKey: PublicKey, 
  fileHash: string,
  connection: Connection
) => {
  try {
    // In a hackathon, we can use a 'Memo' program to store data fast 
    // without writing a full custom Rust program.
    const MEMO_PROGRAM_ID = new PublicKey('MemoSq4gqABbox76tgS8t8vGyB4X9VMT5D9S69H143');
    
    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: walletPublicKey,
        toPubkey: walletPublicKey, // Sending 0 SOL to self just to trigger the Memo
        lamports: 0,
      })
    );

    // Attach the SHA-256 Hash as the Memo (This is Akib's requirement)
    transaction.add({
      keys: [{ pubkey: walletPublicKey, isSigner: true, isWritable: true }],
      data: Buffer.from(`SentinelAI_Anchor:${fileHash}`),
      programId: MEMO_PROGRAM_ID,
    });

    return transaction;
  } catch (error) {
    console.error("Blockchain Anchoring Failed:", error);
    throw error;
  }
};
