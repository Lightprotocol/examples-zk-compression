import { useState } from 'react';
import type { ConnectedStandardSolanaWallet } from '@privy-io/js-sdk-core';
import { useSignTransaction } from '@privy-io/react-auth/solana';
import { useTransfer } from '../../hooks/useTransfer';
import { useCompressSol } from '../../hooks/useCompressSol';
import { useCompress } from '../../hooks/useCompress';
import type { TokenBalance } from '../../hooks/useCompressedBalances';
import CopyButton from '../reusables/CopyButton';
import Section from '../reusables/Section';

interface TransferFormProps {
  selectedWallet: string;
  wallets: ConnectedStandardSolanaWallet[];
  onWalletChange: (address: string) => void;
  selectedMint: string;
  onMintChange: (mint: string) => void;
  balances: TokenBalance[];
  isLoadingBalances: boolean;
  onTransferSuccess: (signature: string) => void;
  onTransferError: (error: string) => void;
}

export default function TransferForm({
  selectedWallet,
  wallets,
  onWalletChange,
  selectedMint,
  onMintChange,
  balances,
  isLoadingBalances,
  onTransferSuccess,
  onTransferError,
}: TransferFormProps) {
  const { signTransaction } = useSignTransaction();
  const { transfer } = useTransfer();
  const { compress: compressSol } = useCompressSol();
  const { compress: compressSpl } = useCompress();

  const [recipientAddress, setRecipientAddress] = useState<string>('');
  const [amount, setAmount] = useState<string>('1');
  const [isLoading, setIsLoading] = useState(false);

  const handleTransfer = async () => {
    if (!selectedWallet) {
      alert('Please select a wallet');
      return;
    }

    if (!selectedMint) {
      alert('Please select a token');
      return;
    }

    if (!recipientAddress) {
      alert('Please enter a recipient address');
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    const wallet = wallets.find((w) => w.address === selectedWallet);
    if (!wallet) {
      alert('Selected wallet not found');
      return;
    }

    setIsLoading(true);

    try {
      const selectedToken = balances.find(b => b.mint === selectedMint);
      if (!selectedToken) {
        alert('Selected token not found in balances');
        return;
      }

      const { isNative, isCompressed, decimals } = selectedToken;
      let signature: string;

      // Transaction routing based on token state
      if (isNative && !isCompressed) {
        // Regular SOL: compress to recipient
        const lamports = Math.floor(amountNum * 1e9);
        signature = await compressSol({
          params: { ownerPublicKey: selectedWallet, toAddress: recipientAddress, lamports },
          wallet,
          signTransaction,
        });
      } else if (isCompressed) {
        // Already compressed: transfer compressed to compressed
        signature = await transfer({
          params: { ownerPublicKey: selectedWallet, mint: selectedMint, toAddress: recipientAddress, amount: amountNum, decimals },
          wallet,
          signTransaction,
        });
      } else {
        // Regular SPL: compress from ATA to recipient
        signature = await compressSpl({
          params: { ownerPublicKey: selectedWallet, toAddress: recipientAddress, mint: selectedMint, amount: amountNum, decimals },
          wallet,
          signTransaction,
        });
      }

      setRecipientAddress('');
      setAmount('1');
      onTransferSuccess(signature);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('Transfer error:', error);
      onTransferError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const selectedBalance = balances.find(b => b.mint === selectedMint);

  return (
    <Section name="Send Tokens">
      <div className="mb-4">
        <label htmlFor="wallet-select" className="block text-sm font-medium mb-2">
          From wallet
        </label>
        <div className="flex gap-2">
          <select
            id="wallet-select"
            value={selectedWallet}
            onChange={(e) => onWalletChange(e.target.value)}
            className="input flex-1"
            disabled={wallets.length === 0}
          >
            {wallets.length === 0 ? (
              <option value="">No wallets available</option>
            ) : (
              wallets.map((wallet) => (
                <option key={wallet.address} value={wallet.address}>
                  {wallet.address.slice(0, 8)}...{wallet.address.slice(-8)}
                </option>
              ))
            )}
          </select>
          {selectedWallet && (
            <CopyButton text={selectedWallet} label="Address" />
          )}
        </div>
      </div>

      <div className="mb-4">
        <label htmlFor="mint-select" className="block text-sm font-medium mb-2">
          Token
        </label>
        <div className="flex gap-2">
          <select
            id="mint-select"
            value={selectedMint}
            onChange={(e) => onMintChange(e.target.value)}
            className="input flex-1"
            disabled={isLoadingBalances || balances.length === 0}
          >
            {isLoadingBalances ? (
              <option value="">Loading tokens...</option>
            ) : balances.length === 0 ? (
              <option value="">No tokens found</option>
            ) : (
              balances.map((balance) => {
                const formatBalance = (amount: string, decimals: number): string => {
                  const num = BigInt(amount);
                  const divisor = BigInt(10 ** decimals);
                  const whole = num / divisor;
                  const fraction = num % divisor;
                  const fractionStr = fraction.toString().padStart(decimals, '0').replace(/0+$/, '');
                  return fractionStr ? `${whole}.${fractionStr}` : whole.toString();
                };

                const USDC_MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
                const TEST_MINT = '7cT3PeXyDLkyEcvr9YzsjGLuZneKsea4c8hPbJQEjMCZ';
                const isUSDC = balance.mint === USDC_MINT;
                const isTestToken = balance.mint === TEST_MINT;
                const formattedAmount = formatBalance(balance.amount, balance.decimals);

                const label = balance.isNative
                  ? `SOL - ${formattedAmount}`
                  : isUSDC
                  ? `USDC - ${formattedAmount}`
                  : isTestToken
                  ? `TEST - ${formattedAmount}`
                  : `${balance.mint.slice(0, 8)}...${balance.mint.slice(-4)} - ${formattedAmount}`;

                return (
                  <option key={balance.mint} value={balance.mint}>
                    {label}
                  </option>
                );
              })
            )}
          </select>
        </div>
      </div>

      <div className="mb-4">
        <label htmlFor="recipient" className="block text-sm font-medium mb-2">
          Recipient address
        </label>
        <input
          id="recipient"
          type="text"
          value={recipientAddress}
          onChange={(e) => setRecipientAddress(e.target.value)}
          placeholder="Enter Solana address"
          className="input"
        />
      </div>

      <div className="mb-6">
        <label htmlFor="amount" className="block text-sm font-medium mb-2">
          Amount
        </label>
        <input
          id="amount"
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="1"
          min="0"
          step="0.000001"
          className="input"
        />
      </div>

      {selectedBalance && BigInt(selectedBalance.amount) === 0n ? (
        <button
          disabled
          className="button-primary w-full opacity-50 cursor-not-allowed"
        >
          Add Balance
        </button>
      ) : (
        <button
          onClick={handleTransfer}
          disabled={isLoading || !selectedWallet || !selectedMint || !recipientAddress}
          className="button-primary w-full"
        >
          {isLoading ? 'Sending...' : 'Send'}
        </button>
      )}
    </Section>
  );
}
