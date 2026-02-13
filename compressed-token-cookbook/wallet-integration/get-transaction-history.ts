import { Rpc, createRpc } from '@lightprotocol/stateless.js';
import { PublicKey } from '@solana/web3.js';

const connection: Rpc = createRpc();
const publicKey = new PublicKey('FWwR2s4TwpWN3nkCzVfhuPrpePG8kNzBXAxEbNsaDFNu');

(async () => {
    const signatures = await connection.getCompressionSignaturesForTokenOwner(publicKey);

    if (signatures.items.length > 0) {
        console.log(`Signatures:`);
        signatures.items.forEach((sig, index) => {
            console.log(`${index + 1}. ${sig.signature}`);
            console.log(`   Slot: ${sig.slot}`);
            console.log(`   Time: ${new Date(sig.blockTime * 1000).toISOString()}`);
        });
    } else {
        console.log("No transactions found");
    }
})();
