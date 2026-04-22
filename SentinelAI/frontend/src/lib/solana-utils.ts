import { Connection, clusterApiUrl, PublicKey } from '@solana/web3.js';

// Use 'devnet' for the hackathon so you don't spend real money
export const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');

// The address where subscription payments will be sent
export const MERCHANT_WALLET = new PublicKey('gVbwmUU2Ej4E1pBPdSHcLn4anq2AXndRhggXMhWCNCg');

// Standard Memo Program ID for anchoring data
export const MEMO_PROGRAM_ID = new PublicKey('MemoSq4gqABbox76tgS8t8vGyB4X9VMT5D9S69H143');

export const getExplorerUrl = (signature: string) =>
  `https://explorer.solana.com/tx/${signature}?cluster=devnet`;
