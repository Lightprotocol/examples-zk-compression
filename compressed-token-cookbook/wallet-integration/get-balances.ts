import { Rpc, createRpc } from '@lightprotocol/stateless.js';
import { PublicKey } from '@solana/web3.js';

const connection: Rpc = createRpc();
const publicKey = new PublicKey('FWwR2s4TwpWN3nkCzVfhuPrpePG8kNzBXAxEbNsaDFNu');

(async () => {
    const balances = await connection.getCompressedTokenBalancesByOwnerV2(publicKey);

    if (balances.value.items.length === 0) {
        console.log("No compressed token balances found");
        return;
    }

    for (const item of balances.value.items) {
        const balanceValue = typeof item.balance === 'string'
            ? parseInt(item.balance, 16)
            : item.balance;

        const mintInfo = await connection.getAccountInfo(new PublicKey(item.mint));
        const decimals = mintInfo.data[44];
        const formattedBalance = balanceValue / Math.pow(10, decimals);

        console.log(`Mint: ${item.mint}`);
        console.log(`Balance: ${formattedBalance} tokens\n`);
    }
})();
