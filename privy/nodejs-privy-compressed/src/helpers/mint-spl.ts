import 'dotenv/config';
import {Keypair, PublicKey, Transaction, ComputeBudgetProgram, sendAndConfirmTransaction} from '@solana/web3.js';
import {createRpc} from '@lightprotocol/stateless.js';
import {
  getAssociatedTokenAddressSync,
  createAssociatedTokenAccountInstruction,
  createMintToInstruction,
  getAccount,
  TokenAccountNotFoundError,
} from '@solana/spl-token';
import {homedir} from 'os';
import {readFileSync} from 'fs';

const mintSplTokens = async (
  mintAddress: string,
  recipientAddress: string,
  amount: number,
  decimals: number
) => {
  const connection = createRpc(process.env.HELIUS_RPC_URL!);

  // Load filesystem wallet
  const payer = Keypair.fromSecretKey(
    new Uint8Array(
      JSON.parse(readFileSync(`${homedir()}/.config/solana/id.json`, 'utf8'))
    )
  );

  // Create public key objects
  const mint = new PublicKey(mintAddress);
  const recipient = new PublicKey(recipientAddress);
  const tokenAmount = BigInt(amount * Math.pow(10, decimals));

  // Get recipient ATA
  const recipientAta = getAssociatedTokenAddressSync(mint, recipient);

  // Build transaction
  const transaction = new Transaction();
  transaction.add(ComputeBudgetProgram.setComputeUnitLimit({units: 300_000}));

  // Create ATA if it doesn't exist
  try {
    await getAccount(connection, recipientAta);
  } catch (e) {
    if (e instanceof TokenAccountNotFoundError) {
      transaction.add(
        createAssociatedTokenAccountInstruction(payer.publicKey, recipientAta, recipient, mint)
      );
    } else {
      throw e;
    }
  }

  // Add mint-to instruction
  transaction.add(
    createMintToInstruction(
      mint,
      recipientAta,
      payer.publicKey,
      tokenAmount
    )
  );

  // Send transaction
  const signature = await sendAndConfirmTransaction(
    connection,
    transaction,
    [payer],
    {commitment: 'confirmed'}
  );

  return signature;
};

export default mintSplTokens;
