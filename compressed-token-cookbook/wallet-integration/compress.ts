// 1. Setup RPC connection and get user ATA with getOrCreateAssociatedTokenAccount()
// 2. Fetch state tree and token pool infos using getStateTreeInfos() and getTokenPoolInfos()
// 3. Create compress instruction with CompressedTokenProgram.compress() and submit transaction


import {
  buildAndSignTx,
  sendAndConfirmTx,
  Rpc,
  createRpc,
  selectStateTreeInfo,
} from "@lightprotocol/stateless.js";
import { ComputeBudgetProgram } from "@solana/web3.js";
import {
  CompressedTokenProgram,
  getTokenPoolInfos,
  selectTokenPoolInfo,
} from "@lightprotocol/compressed-token";
import { getOrCreateAssociatedTokenAccount } from "@solana/spl-token";

// Step 1: Setup RPC connection and define compression parameters
const connection: Rpc = createRpc(
  "https://mainnet.helius-rpc.com?api-key=<api_key>"
);
  const payer = <PAYER_KEYPAIR>;
  const mint = <MINT_ADDRESS>;
const amount = 1e5; // 100K tokens to compress

(async () => {
  // Step 2: Get or create associated token account for SPL tokens
  const sourceTokenAccount = await getOrCreateAssociatedTokenAccount(
    connection,
    payer, // fee payer
    mint, // token mint address
    payer.publicKey // token account owner
  );

  // Step 3: Fetch and select state tree info for compression
  const treeInfos = await connection.getStateTreeInfos();
  const treeInfo = selectStateTreeInfo(treeInfos);

  // Step 4: Fetch and select token pool info for compression
  const tokenPoolInfos = await getTokenPoolInfos(connection, mint);
  const tokenPoolInfo = selectTokenPoolInfo(tokenPoolInfos);

  // Step 5: Create compress instruction - transfer SPL tokens to pool and create compressed accounts
  const compressInstruction = await CompressedTokenProgram.compress({
    payer: payer.publicKey, // fee payer
    owner: payer.publicKey, // owner of source SPL tokens
    source: sourceTokenAccount.address, // source ATA address
    toAddress: payer.publicKey, // recipient of compressed tokens (self)
    amount, // amount to compress
    mint, // token mint address
    outputStateTreeInfo: treeInfo, // state tree for compressed accounts
    tokenPoolInfo, // token pool for compression
  });

  // Step 6: Build, sign, and submit compression transaction
  const { blockhash } = await connection.getLatestBlockhash();
  const tx = buildAndSignTx(
    [
      ComputeBudgetProgram.setComputeUnitLimit({ units: 300_000 }),
      compressInstruction,
    ],
    payer, // transaction signer
    blockhash,
    [payer] // additional signers
  );
  await sendAndConfirmTx(connection, tx);
})();
