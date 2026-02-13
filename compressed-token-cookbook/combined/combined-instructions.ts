// The SDK provides instruction-level APIs that return instructions without sending transactions. Combine these instructions to build custom transactions with multiple instructions.
// This example creates a token pool and compresses existing SPL tokens in a single transaction.
//
// 1. Setup: Create SPL token and mint to Associated Token Account
// 2. Build instructions for create token pool and compress
// 3. Combine instructions in one transaction
// 4. Verify compressed balance

import {
    Keypair,
    ComputeBudgetProgram,
} from '@solana/web3.js';
import {
    createRpc,
    buildAndSignTx,
    sendAndConfirmTx,
    selectStateTreeInfo,
} from '@lightprotocol/stateless.js';
import { CompressedTokenProgram } from '@lightprotocol/compressed-token';
import {
    createMint,
    getOrCreateAssociatedTokenAccount,
    mintTo,
    TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import BN from 'bn.js';

async function createPoolAndCompress() {
    // Step 1: Setup - Create regular SPL token and mint to ATA
    const rpc = createRpc();
    const payer = Keypair.generate();
    const airdropSignature = await rpc.requestAirdrop(payer.publicKey, 1000000000);
    await rpc.confirmTransaction(airdropSignature);

    // Create regular SPL token mint
    const mint = await createMint(
        rpc,
        payer,
        payer.publicKey,
        null,
        9,
        undefined,
        undefined,
        TOKEN_PROGRAM_ID
    );

    // Create ATA and mint tokens to it
    const ata = await getOrCreateAssociatedTokenAccount(
        rpc,
        payer,
        mint,
        payer.publicKey,
        undefined,
        undefined,
        undefined,
        TOKEN_PROGRAM_ID
    );

    await mintTo(
        rpc,
        payer,
        mint,
        ata.address,
        payer,
        1_000_000_000, // 1 token with 9 decimals
        undefined,
        undefined,
        TOKEN_PROGRAM_ID
    );

    console.log("Regular SPL token created:", mint.toBase58());
    console.log("ATA balance:", 1, "token");

    // Step 2: Build instructions for create token pool and compress
    const outputStateTreeInfo = selectStateTreeInfo(await rpc.getStateTreeInfos());

    // Derive token pool PDA
    const tokenPoolPda = CompressedTokenProgram.deriveTokenPoolPda(mint);

    // Create token pool instruction
    const createTokenPoolIx = await CompressedTokenProgram.createTokenPool({
        feePayer: payer.publicKey,
        mint,
        tokenProgram: TOKEN_PROGRAM_ID,
    });

    // Manually construct TokenPoolInfo for first-time compression
    const tokenPoolInfo = {
        mint: mint,
        tokenPoolPda: tokenPoolPda,
        tokenProgram: TOKEN_PROGRAM_ID,
        isInitialized: true, // Set to true even though pool will be created in this tx
        balance: new BN(0),
        poolIndex: 0,
        bump: 0, // Placeholder value
    };

    // Create compress instruction
    const compressIx = await CompressedTokenProgram.compress({
        outputStateTreeInfo,
        tokenPoolInfo,
        payer: payer.publicKey,
        owner: payer.publicKey,
        source: ata.address,
        toAddress: payer.publicKey,
        amount: new BN(1_000_000_000),
        mint,
    });

    // Step 3: Combine instructions in one transaction
    const { blockhash } = await rpc.getLatestBlockhash();

    const allInstructions = [
        ComputeBudgetProgram.setComputeUnitLimit({ units: 1_000_000 }),
        createTokenPoolIx,
        compressIx,
    ];

    const tx = buildAndSignTx(
        allInstructions,
        payer,
        blockhash,
        []
    );

    const txId = await sendAndConfirmTx(rpc, tx);

    console.log("Token pool created and tokens compressed");
    console.log("Transaction:", txId);

    // Step 4: Verify compressed balance
    const compressedAccounts = await rpc.getCompressedTokenAccountsByOwner(
        payer.publicKey,
        { mint }
    );

    const compressedBalance = compressedAccounts.items.reduce(
        (sum, account) => sum.add(account.parsed.amount),
        new BN(0)
    );

    console.log("Compressed balance:", compressedBalance.toNumber() / 1_000_000_000, "tokens");

    return {
        transactionSignature: txId,
        mint,
        compressedBalance: compressedBalance.toNumber(),
    };
}

createPoolAndCompress().catch(console.error);
