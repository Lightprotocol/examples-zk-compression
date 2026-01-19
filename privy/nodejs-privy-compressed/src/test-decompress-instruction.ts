import 'dotenv/config';
import {createRpc, bn} from '@lightprotocol/stateless.js';
import {PublicKey} from '@solana/web3.js';
import {getAssociatedTokenAddressSync} from '@solana/spl-token';
import {CompressedTokenProgram, selectMinCompressedTokenAccountsForTransfer, getTokenPoolInfos, selectTokenPoolInfosForDecompression} from '@lightprotocol/compressed-token';

// Test decompress instruction account configuration
(async function() {
  const connection = createRpc(process.env.HELIUS_RPC_URL!);

  const WALLET = new PublicKey('GyCkk6hTFUr2RUnx3DiUgeL7rrwTmeykZ8k2tzAWjz5t');
  const MINT = new PublicKey('5LxDhxhwurt6RvXYStQqymQX8SbV6mhwQLW3KcwK8a2M');
  const AMOUNT = 1_000_000; // 0.001 with 9 decimals

  const ownerAta = getAssociatedTokenAddressSync(MINT, WALLET);

  // Get compressed accounts
  const accounts = await connection.getCompressedTokenAccountsByOwner(WALLET, {mint: MINT});
  const validItems = (accounts.items || []).filter((item): item is NonNullable<typeof item> => item !== null);
  const [inputAccounts] = selectMinCompressedTokenAccountsForTransfer(validItems, bn(AMOUNT));

  // Get proof and pool info
  const proof = await connection.getValidityProof(inputAccounts.map(account => bn(account.compressedAccount.hash)));
  const tokenPoolInfos = await getTokenPoolInfos(connection, MINT);
  const selectedTokenPoolInfos = selectTokenPoolInfosForDecompression(tokenPoolInfos, AMOUNT);

  // Create instruction
  const instruction = await CompressedTokenProgram.decompress({
    payer: WALLET,
    inputCompressedTokenAccounts: inputAccounts,
    toAddress: ownerAta,
    amount: AMOUNT,
    recentInputStateRootIndices: proof.rootIndices,
    recentValidityProof: proof.compressedProof,
    tokenPoolInfos: selectedTokenPoolInfos,
  });

  console.log('\n=== Decompress Instruction Account Configuration ===\n');
  instruction.keys?.forEach((key, i) => {
    console.log(`[${i.toString().padStart(2, ' ')}] ${key.pubkey.toBase58()} - ${key.isSigner ? 'signer' : '      '} ${key.isWritable ? 'writable' : 'readonly'}`);
  });
})();
