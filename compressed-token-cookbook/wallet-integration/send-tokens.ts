import {
  Rpc,
  createRpc,
  bn,
  dedupeSigner,
  sendAndConfirmTx,
  buildAndSignTx,
} from "@lightprotocol/stateless.js";
import {
  CompressedTokenProgram,
  selectMinCompressedTokenAccountsForTransfer,
} from "@lightprotocol/compressed-token";
import { ComputeBudgetProgram, Keypair, PublicKey } from "@solana/web3.js";

const connection: Rpc = createRpc();
const mint = new PublicKey("MINT_ADDRESS");
const payer = PAYER_KEYPAIR;
const owner = payer;
const recipient = Keypair.generate();
const amount = bn(1e8);

(async () => {
  const compressedTokenAccounts =
    await connection.getCompressedTokenAccountsByOwner(owner.publicKey, { mint });

  if (compressedTokenAccounts.items.length === 0) {
    console.log("No compressed token accounts found");
    return;
  }

  const [inputAccounts] = selectMinCompressedTokenAccountsForTransfer(
    compressedTokenAccounts.items,
    amount
  );

  const proof = await connection.getValidityProof(
    inputAccounts.map((account) => account.compressedAccount.hash)
  );

  const ix = await CompressedTokenProgram.transfer({
    payer: payer.publicKey,
    inputCompressedTokenAccounts: inputAccounts,
    toAddress: recipient.publicKey,
    amount,
    recentInputStateRootIndices: proof.rootIndices,
    recentValidityProof: proof.compressedProof,
  });

  const { blockhash } = await connection.getLatestBlockhash();
  const additionalSigners = dedupeSigner(payer, [owner]);
  const signedTx = buildAndSignTx(
    [ComputeBudgetProgram.setComputeUnitLimit({ units: 300_000 }), ix],
    payer,
    blockhash,
    additionalSigners
  );

  const transferTxId = await sendAndConfirmTx(connection, signedTx);
  console.log(`Transaction: ${transferTxId}`);
})();
