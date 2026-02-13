import {
  bn,
  buildAndSignTx,
  sendAndConfirmTx,
  dedupeSigner,
  Rpc,
  createRpc,
} from "@lightprotocol/stateless.js";
import { ComputeBudgetProgram } from "@solana/web3.js";
import {
  CompressedTokenProgram,
  getTokenPoolInfos,
  selectMinCompressedTokenAccountsForTransfer,
  selectTokenPoolInfosForDecompression,
} from "@lightprotocol/compressed-token";

// 1. Setup RPC connection and fetch compressed token accounts with getCompressedTokenAccountsByOwner()
// 2. Select accounts and token pool infos using selectMinCompressedTokenAccountsForTransfer() and selectTokenPoolInfosForDecompression()
// 3. Create decompress instruction with CompressedTokenProgram.decompress() and submit transaction

// Step 1: Setup RPC connection and define decompression parameters
const connection: Rpc = createRpc("https://mainnet.helius-rpc.com?api-key=<api_key>");
const payer = PAYER_KEYPAIR;
const owner = PAYER_KEYPAIR;
const mint = MINT_ADDRESS;
const amount = 1e5; // 100K tokens to decompress

(async () => {
  // 1. Fetch compressed token accounts
  const compressedTokenAccounts =
    await connection.getCompressedTokenAccountsByOwner(owner.publicKey, {
      mint,
    });

  // 2. Select
  const [inputAccounts] = selectMinCompressedTokenAccountsForTransfer(
    compressedTokenAccounts.items,
    bn(amount)
  );

  // 3. Fetch validity proof
  const proof = await connection.getValidityProof(
    inputAccounts.map((account) => account.compressedAccount.hash)
  );

  // 4. Fetch & Select tokenPoolInfos
  const tokenPoolInfos = await getTokenPoolInfos(connection, mint);
  const selectedTokenPoolInfos = selectTokenPoolInfosForDecompression(
    tokenPoolInfos,
    amount
  );

  // 5. Build instruction
  const ix = await CompressedTokenProgram.decompress({
    payer: payer.publicKey,
    inputCompressedTokenAccounts: inputAccounts,
    toAddress: owner.publicKey,
    amount,
    tokenPoolInfos: selectedTokenPoolInfos,
    recentInputStateRootIndices: proof.rootIndices,
    recentValidityProof: proof.compressedProof,
  });


  // 6. Sign, send, and confirm.
  // Example with keypair:
  const { blockhash } = await connection.getLatestBlockhash();
  const additionalSigners = dedupeSigner(payer, [owner]);
  const signedTx = buildAndSignTx(
    [ComputeBudgetProgram.setComputeUnitLimit({ units: 300_000 }), ix],
    payer,
    blockhash,
    additionalSigners
  );

  return await sendAndConfirmTx(connection, signedTx);
})();
