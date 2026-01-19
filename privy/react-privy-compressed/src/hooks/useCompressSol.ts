import { useState } from 'react';
import { PublicKey, Transaction, ComputeBudgetProgram } from '@solana/web3.js';
import { bn, LightSystemProgram, selectStateTreeInfo, createRpc } from '@lightprotocol/stateless.js';
import type { ConnectedStandardSolanaWallet } from '@privy-io/js-sdk-core';
import type { SignTransactionResult } from '@privy-io/react-auth/solana';

export interface CompressSolParams {
  ownerPublicKey: string;
  toAddress: string;
  lamports: number;
}

export interface CompressSolArgs {
  params: CompressSolParams;
  wallet: ConnectedStandardSolanaWallet;
  signTransaction: (args: {
    transaction: Buffer;
    wallet: ConnectedStandardSolanaWallet;
    chain: string;
  }) => Promise<SignTransactionResult>;
}

export function useCompressSol() {
  const [isLoading, setIsLoading] = useState(false);

  const compress = async (args: CompressSolArgs): Promise<string> => {
    setIsLoading(true);

    try {
      const { params, wallet, signTransaction } = args;
      const { ownerPublicKey, toAddress, lamports } = params;

      // Create RPC connection
      const rpc = createRpc(import.meta.env.VITE_HELIUS_RPC_URL);

      // Get state tree infos
      const stateTreeInfos = await rpc.getStateTreeInfos();
      const selectedTreeInfo = selectStateTreeInfo(stateTreeInfos);

      // Build compress instruction
      const compressIx = await LightSystemProgram.compress({
        payer: new PublicKey(ownerPublicKey),
        toAddress: new PublicKey(toAddress),
        lamports: bn(lamports),
        outputStateTreeInfo: selectedTreeInfo,
      });

      // Build transaction
      const { blockhash } = await rpc.getLatestBlockhash();
      const transaction = new Transaction();
      transaction.add(ComputeBudgetProgram.setComputeUnitLimit({ units: 300_000 }));
      transaction.add(compressIx);
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = new PublicKey(ownerPublicKey);

      // Serialize unsigned transaction
      const unsignedTxBuffer = transaction.serialize({ requireAllSignatures: false });

      // Sign with Privy
      const signedTx = await signTransaction({
        transaction: unsignedTxBuffer,
        wallet,
        chain: 'solana:devnet',
      });

      // Send transaction
      const signedTxBuffer = Buffer.from(signedTx.signedTransaction);
      const signature = await rpc.sendRawTransaction(signedTxBuffer, {
        skipPreflight: false,
        preflightCommitment: 'confirmed',
      });

      return signature;
    } finally {
      setIsLoading(false);
    }
  };

  return { compress, isLoading };
}
