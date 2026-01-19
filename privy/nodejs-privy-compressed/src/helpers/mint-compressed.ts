import 'dotenv/config';
import {Keypair, PublicKey, Transaction, ComputeBudgetProgram, sendAndConfirmTransaction} from '@solana/web3.js';
import {createRpc, bn} from '@lightprotocol/stateless.js';
import {CompressedTokenProgram} from '@lightprotocol/compressed-token';
import {homedir} from 'os';
import {readFileSync} from 'fs';

const createCompressedMint = async (
  decimals: number,
  initialAmount: number,
  recipientAddress: string
) => {
  const connection = createRpc(process.env.HELIUS_RPC_URL!);

  // Load filesystem wallet
  const payer = Keypair.fromSecretKey(
    new Uint8Array(
      JSON.parse(readFileSync(`${homedir()}/.config/solana/id.json`, 'utf8'))
    )
  );

  // Create mint keypair
  const mintKeypair = Keypair.generate();
  const recipient = new PublicKey(recipientAddress);
  const tokenAmount = bn(initialAmount * Math.pow(10, decimals));

  // Create mint instruction
  const createMintInstruction = await CompressedTokenProgram.createMint({
    feePayer: payer.publicKey,
    authority: payer.publicKey,
    mint: mintKeypair.publicKey,
    decimals,
  });

  // Build transaction with mint creation
  const transaction = new Transaction();
  transaction.add(ComputeBudgetProgram.setComputeUnitLimit({units: 300_000}));
  transaction.add(createMintInstruction);

  // Send transaction
  const createSignature = await sendAndConfirmTransaction(
    connection,
    transaction,
    [payer, mintKeypair],
    {commitment: 'confirmed'}
  );

  // If initialAmount > 0, mint tokens to recipient
  if (initialAmount > 0) {
    // Create mint-to instruction
    const mintToInstruction = await CompressedTokenProgram.mintTo({
      feePayer: payer.publicKey,
      authority: payer.publicKey,
      mint: mintKeypair.publicKey,
      amount: tokenAmount,
      toPubkey: recipient,
    });

    // Build mint transaction
    const mintTransaction = new Transaction();
    mintTransaction.add(ComputeBudgetProgram.setComputeUnitLimit({units: 300_000}));
    mintTransaction.add(mintToInstruction);

    // Send transaction
    const mintSignature = await sendAndConfirmTransaction(
      connection,
      mintTransaction,
      [payer],
      {commitment: 'confirmed'}
    );

    return {
      mintAddress: mintKeypair.publicKey.toBase58(),
      signature: mintSignature,
    };
  }

  return {
    mintAddress: mintKeypair.publicKey.toBase58(),
    signature: createSignature,
  };
};

export default createCompressedMint;
