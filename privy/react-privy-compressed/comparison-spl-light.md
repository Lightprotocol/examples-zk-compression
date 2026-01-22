
## Comparison Privy SDK: SPL vs Light

### 1. Setup

**SPL:**

```typescript
import { Connection } from "@solana/web3.js";

const connection = new Connection("https://api.mainnet-beta.solana.com");
```

**Compressed:**

```typescript
import { createRpc } from "@lightprotocol/stateless.js";

// Requires ZK Compression RPC (Helius, Triton)
const rpc = createRpc(import.meta.env.VITE_HELIUS_RPC_URL);
```

---

### 2. Get Balance

**SPL:**

```typescript
import { getAssociatedTokenAddress, getAccount } from "@solana/spl-token";

const ata = await getAssociatedTokenAddress(mintPubkey, ownerPubkey);
const account = await getAccount(connection, ata);
console.log(account.amount);
```

**Compressed:**

```typescript
import { useState, useCallback } from 'react';
import { PublicKey } from '@solana/web3.js';
import { createRpc } from '@lightprotocol/stateless.js';

export interface TokenBalance {
  mint: string;
  amount: string;
  decimals: number;
  isCompressed: boolean;
}

export function useCompressedBalances() {
  const [balances, setBalances] = useState<TokenBalance[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchBalances = useCallback(async (ownerAddress: string) => {
    if (!ownerAddress) return;

    setIsLoading(true);
    try {
      const rpc = createRpc(import.meta.env.VITE_HELIUS_RPC_URL);
      const owner = new PublicKey(ownerAddress);

      const compressedAccounts = await rpc.getCompressedTokenAccountsByOwner(owner);

      if (compressedAccounts?.items) {
        const mintAmounts = new Map<string, bigint>();

        for (const item of compressedAccounts.items) {
          if (item?.parsed?.mint && item?.parsed?.amount) {
            const mint = item.parsed.mint.toBase58();
            const amount = BigInt(item.parsed.amount.toString());
            const current = mintAmounts.get(mint) || 0n;
            mintAmounts.set(mint, current + amount);
          }
        }

        const tokenBalances: TokenBalance[] = [];
        for (const [mint, amount] of mintAmounts) {
          tokenBalances.push({
            mint,
            amount: amount.toString(),
            decimals: 6,
            isCompressed: true,
          });
        }
        setBalances(tokenBalances);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { balances, isLoading, fetchBalances };
}
```

---

### 3. Transfer

**SPL:**

```typescript
import { getAssociatedTokenAddress, createTransferInstruction } from "@solana/spl-token";
import { Transaction, PublicKey } from "@solana/web3.js";

const fromAta = await getAssociatedTokenAddress(mintPubkey, fromPubkey);
const toAta = await getAssociatedTokenAddress(mintPubkey, toPubkey);

const instruction = createTransferInstruction(
  fromAta,
  toAta,
  fromPubkey,
  amount
);

const transaction = new Transaction().add(instruction);
const { blockhash } = await connection.getLatestBlockhash();
transaction.recentBlockhash = blockhash;
transaction.feePayer = fromPubkey;
```

**Compressed:**

```typescript
import { useState } from 'react';
import { PublicKey, Transaction, ComputeBudgetProgram } from '@solana/web3.js';
import { CompressedTokenProgram, selectMinCompressedTokenAccountsForTransfer } from '@lightprotocol/compressed-token';
import { bn, createRpc } from '@lightprotocol/stateless.js';
import type { ConnectedStandardSolanaWallet } from '@privy-io/js-sdk-core';
import type { SignTransactionResult } from '@privy-io/react-auth/solana';

export interface TransferParams {
  ownerPublicKey: string;
  mint: string;
  toAddress: string;
  amount: number;
  decimals?: number;
}

export interface TransferArgs {
  params: TransferParams;
  wallet: ConnectedStandardSolanaWallet;
  signTransaction: (args: {
    transaction: Buffer;
    wallet: ConnectedStandardSolanaWallet;
    chain: string;
  }) => Promise<SignTransactionResult>;
}

export function useTransfer() {
  const [isLoading, setIsLoading] = useState(false);

  const transfer = async (args: TransferArgs): Promise<string> => {
    setIsLoading(true);

    try {
      const { params, wallet, signTransaction } = args;
      const { ownerPublicKey, mint, toAddress, amount, decimals = 6 } = params;

      const rpc = createRpc(import.meta.env.VITE_HELIUS_RPC_URL);

      const owner = new PublicKey(ownerPublicKey);
      const mintPubkey = new PublicKey(mint);
      const recipient = new PublicKey(toAddress);
      const tokenAmount = bn(Math.floor(amount * Math.pow(10, decimals)));

      // Get compressed token accounts
      const accounts = await rpc.getCompressedTokenAccountsByOwner(owner, { mint: mintPubkey });
      if (!accounts.items || accounts.items.length === 0) {
        throw new Error('No compressed token accounts found');
      }

      // Select minimum accounts needed
      const [inputAccounts] = selectMinCompressedTokenAccountsForTransfer(accounts.items, tokenAmount);
      if (inputAccounts.length === 0) {
        throw new Error('Insufficient balance');
      }

      // Get validity proof
      const proof = await rpc.getValidityProof(
        inputAccounts.map((account) => bn(account.compressedAccount.hash))
      );

      // Build transfer instruction
      const transferIx = await CompressedTokenProgram.transfer({
        payer: owner,
        inputCompressedTokenAccounts: inputAccounts,
        toAddress: recipient,
        amount: tokenAmount,
        recentInputStateRootIndices: proof.rootIndices,
        recentValidityProof: proof.compressedProof,
      });

      // Build transaction
      const { blockhash } = await rpc.getLatestBlockhash();
      const transaction = new Transaction();
      transaction.add(ComputeBudgetProgram.setComputeUnitLimit({ units: 300_000 }));
      transaction.add(transferIx);
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = owner;

      // Sign with Privy and send (see #6)
      const unsignedTxBuffer = transaction.serialize({ requireAllSignatures: false });
      const signedTx = await signTransaction({
        transaction: unsignedTxBuffer,
        wallet,
        chain: 'solana:devnet',
      });

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

  return { transfer, isLoading };
}
```

---

### 4. Compress

**SPL:**

N/A - SPL tokens are uncompressed by default.

**Compressed:**

```typescript
import { useState } from 'react';
import { PublicKey, Transaction, ComputeBudgetProgram } from '@solana/web3.js';
import { getAssociatedTokenAddressSync, getAccount } from '@solana/spl-token';
import { bn, createRpc, selectStateTreeInfo } from '@lightprotocol/stateless.js';
import { CompressedTokenProgram, getTokenPoolInfos, selectTokenPoolInfo } from '@lightprotocol/compressed-token';
import type { ConnectedStandardSolanaWallet } from '@privy-io/js-sdk-core';
import type { SignTransactionResult } from '@privy-io/react-auth/solana';

export interface CompressParams {
  ownerPublicKey: string;
  toAddress: string;
  mint: string;
  amount: number;
  decimals?: number;
}

export interface CompressArgs {
  params: CompressParams;
  wallet: ConnectedStandardSolanaWallet;
  signTransaction: (args: {
    transaction: Buffer;
    wallet: ConnectedStandardSolanaWallet;
    chain: string;
  }) => Promise<SignTransactionResult>;
}

export function useCompress() {
  const [isLoading, setIsLoading] = useState(false);

  const compress = async (args: CompressArgs): Promise<string> => {
    setIsLoading(true);

    try {
      const { params, wallet, signTransaction } = args;
      const { ownerPublicKey, toAddress, mint, amount, decimals = 6 } = params;

      const rpc = createRpc(import.meta.env.VITE_HELIUS_RPC_URL);

      const ownerPubkey = new PublicKey(ownerPublicKey);
      const toPubkey = new PublicKey(toAddress);
      const mintPubkey = new PublicKey(mint);
      const tokenAmount = bn(amount * Math.pow(10, decimals));

      // Get source token account and verify balance
      const ownerAta = getAssociatedTokenAddressSync(mintPubkey, ownerPubkey);
      const ataAccount = await getAccount(rpc, ownerAta);
      if (ataAccount.amount < BigInt(tokenAmount.toString())) {
        throw new Error('Insufficient SPL balance');
      }

      // Get state tree and token pool info
      const stateTreeInfos = await rpc.getStateTreeInfos();
      const selectedTreeInfo = selectStateTreeInfo(stateTreeInfos);
      const tokenPoolInfos = await getTokenPoolInfos(rpc, mintPubkey);
      const tokenPoolInfo = selectTokenPoolInfo(tokenPoolInfos);

      // Create compress instruction
      const instruction = await CompressedTokenProgram.compress({
        payer: ownerPubkey,
        owner: ownerPubkey,
        source: ownerAta,
        toAddress: toPubkey,
        mint: mintPubkey,
        amount: tokenAmount,
        outputStateTreeInfo: selectedTreeInfo,
        tokenPoolInfo,
      });

      // Build transaction
      const { blockhash } = await rpc.getLatestBlockhash();
      const transaction = new Transaction();
      transaction.add(ComputeBudgetProgram.setComputeUnitLimit({ units: 300_000 }));
      transaction.add(instruction);
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = ownerPubkey;

      // Sign with Privy and send (see #6)
      const unsignedTxBuffer = transaction.serialize({ requireAllSignatures: false });
      const signedTx = await signTransaction({
        transaction: unsignedTxBuffer,
        wallet,
        chain: 'solana:devnet',
      });

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
```

---

### 5. Decompress

**SPL:**

N/A - SPL tokens are already uncompressed.

**Compressed:**

```typescript
import { useState } from 'react';
import { PublicKey, Transaction, ComputeBudgetProgram } from '@solana/web3.js';
import { getAssociatedTokenAddressSync, createAssociatedTokenAccountInstruction, getAccount, TokenAccountNotFoundError } from '@solana/spl-token';
import { CompressedTokenProgram, selectMinCompressedTokenAccountsForTransfer, getSplInterfaceInfos, selectSplInterfaceInfosForDecompression } from '@lightprotocol/compressed-token';
import { bn, createRpc } from '@lightprotocol/stateless.js';
import type { ConnectedStandardSolanaWallet } from '@privy-io/js-sdk-core';
import type { SignTransactionResult } from '@privy-io/react-auth/solana';

export interface DecompressParams {
  ownerPublicKey: string;
  mint: string;
  amount: number;
  decimals?: number;
}

export interface DecompressArgs {
  params: DecompressParams;
  wallet: ConnectedStandardSolanaWallet;
  signTransaction: (args: {
    transaction: Buffer;
    wallet: ConnectedStandardSolanaWallet;
    chain: string;
  }) => Promise<SignTransactionResult>;
}

export function useDecompress() {
  const [isLoading, setIsLoading] = useState(false);

  const decompress = async (args: DecompressArgs): Promise<string> => {
    setIsLoading(true);

    try {
      const { params, wallet, signTransaction } = args;
      const { ownerPublicKey, mint, amount, decimals = 6 } = params;

      const rpc = createRpc(import.meta.env.VITE_HELIUS_RPC_URL);

      const owner = new PublicKey(ownerPublicKey);
      const mintPubkey = new PublicKey(mint);
      const tokenAmount = bn(Math.floor(amount * Math.pow(10, decimals)));

      // Get destination ATA
      const destinationAta = getAssociatedTokenAddressSync(mintPubkey, owner);

      // Get compressed token accounts
      const accounts = await rpc.getCompressedTokenAccountsByOwner(owner, { mint: mintPubkey });
      if (!accounts.items || accounts.items.length === 0) {
        throw new Error('No compressed token accounts found');
      }

      // Select minimum accounts needed
      const [inputAccounts] = selectMinCompressedTokenAccountsForTransfer(accounts.items, tokenAmount);
      if (inputAccounts.length === 0) {
        throw new Error('Insufficient compressed balance');
      }

      // Get validity proof and token pool info
      const proof = await rpc.getValidityProof(
        inputAccounts.map((account) => bn(account.compressedAccount.hash))
      );
      const splInterfaceInfos = await getSplInterfaceInfos(rpc, mintPubkey);
      const tokenPoolInfos = selectSplInterfaceInfosForDecompression(splInterfaceInfos, tokenAmount);

      // Build transaction
      const { blockhash } = await rpc.getLatestBlockhash();
      const transaction = new Transaction();
      transaction.add(ComputeBudgetProgram.setComputeUnitLimit({ units: 400_000 }));

      // Create ATA if needed
      try {
        await getAccount(rpc, destinationAta);
      } catch (e) {
        if (e instanceof TokenAccountNotFoundError) {
          transaction.add(
            createAssociatedTokenAccountInstruction(owner, destinationAta, owner, mintPubkey)
          );
        } else {
          throw e;
        }
      }

      // Build decompress instruction
      const decompressIx = await CompressedTokenProgram.decompress({
        payer: owner,
        inputCompressedTokenAccounts: inputAccounts,
        toAddress: destinationAta,
        amount: tokenAmount,
        recentInputStateRootIndices: proof.rootIndices,
        recentValidityProof: proof.compressedProof,
        tokenPoolInfos,
      });

      transaction.add(decompressIx);
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = owner;

      // Sign with Privy and send (see #6)
      const unsignedTxBuffer = transaction.serialize({ requireAllSignatures: false });
      const signedTx = await signTransaction({
        transaction: unsignedTxBuffer,
        wallet,
        chain: 'solana:devnet',
      });

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

  return { decompress, isLoading };
}
```

---

### 6. Sign with Privy (React)

Privy React signing uses the `signTransaction` callback from the Privy SDK:

```typescript
import type { ConnectedStandardSolanaWallet } from '@privy-io/js-sdk-core';
import type { SignTransactionResult } from '@privy-io/react-auth/solana';

// In your component, get signTransaction from Privy hooks
// const { signTransaction } = useSolanaWallets();

interface SigningArgs {
  wallet: ConnectedStandardSolanaWallet;
  signTransaction: (args: {
    transaction: Buffer;
    wallet: ConnectedStandardSolanaWallet;
    chain: string;
  }) => Promise<SignTransactionResult>;
}

// Serialize unsigned transaction
const unsignedTxBuffer = transaction.serialize({ requireAllSignatures: false });

// Sign with Privy
const signedTx = await signTransaction({
  transaction: unsignedTxBuffer,
  wallet,
  chain: 'solana:devnet', // or 'solana:mainnet'
});

// Send transaction
const signedTxBuffer = Buffer.from(signedTx.signedTransaction);
const signature = await rpc.sendRawTransaction(signedTxBuffer, {
  skipPreflight: false,
  preflightCommitment: 'confirmed',
});
```

---

### 7. Get Transaction History

**SPL:**

```typescript
const signatures = await connection.getSignaturesForAddress(ownerPubkey, {
  limit: 10,
});
```

**Compressed:**

```typescript
import { useState, useCallback } from 'react';
import { PublicKey } from '@solana/web3.js';
import { createRpc } from '@lightprotocol/stateless.js';

export interface Transaction {
  signature: string;
  slot: number;
  blockTime: number;
  timestamp: string;
  compressionInfo?: {
    closedAccounts: number;
    openedAccounts: number;
  } | null;
}

export function useTransactionHistory() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTransactionHistory = useCallback(
    async (ownerAddress: string, limit: number = 10, includeDetails: boolean = false) => {
      if (!ownerAddress) {
        setTransactions([]);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const rpc = createRpc(import.meta.env.VITE_HELIUS_RPC_URL);
        const owner = new PublicKey(ownerAddress);

        const signatures = await rpc.getCompressionSignaturesForTokenOwner(owner);

        if (signatures.items.length === 0) {
          setTransactions([]);
          return;
        }

        const limitedSignatures = signatures.items.slice(0, limit);

        if (includeDetails && limitedSignatures.length > 0) {
          const transactionsWithDetails = await Promise.all(
            limitedSignatures.map(async (sig) => {
              const txInfo = await rpc.getTransactionWithCompressionInfo(sig.signature);

              return {
                signature: sig.signature,
                slot: sig.slot,
                blockTime: sig.blockTime,
                timestamp: new Date(sig.blockTime * 1000).toISOString(),
                compressionInfo: txInfo?.compressionInfo
                  ? {
                      closedAccounts: txInfo.compressionInfo.closedAccounts.length,
                      openedAccounts: txInfo.compressionInfo.openedAccounts.length,
                    }
                  : null,
              };
            })
          );

          setTransactions(transactionsWithDetails);
          return;
        }

        const basicTransactions = limitedSignatures.map((sig) => ({
          signature: sig.signature,
          slot: sig.slot,
          blockTime: sig.blockTime,
          timestamp: new Date(sig.blockTime * 1000).toISOString(),
        }));

        setTransactions(basicTransactions);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        setError(message);
        setTransactions([]);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  return { transactions, isLoading, error, fetchTransactionHistory };
}
```