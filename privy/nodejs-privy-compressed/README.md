# Privy + Compressed Tokens - Node.js

Node.js example using Privy Node.js to sign compressed token transactions.

- **[compress.ts](src/compress.ts)** - Compress SPL tokens to recipient in one transaction
- **[transfer.ts](src/transfer.ts)** - Transfer compressed tokens
- **[decompress.ts](src/decompress.ts)** - Decompress tokens to SPL for off-ramp
- **[balances.ts](src/balances.ts)** - Fetch compressed SPL and compressed token balances
- **[get-transaction-history.ts](src/get-transaction-history.ts)** - Fetch transaction history

## Getting started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Copy the example environment file:

```bash
cp .env.example .env
```

Update `.env` with your credentials from the [Privy Dashboard](https://dashboard.privy.io):

```env
# Privy credentials
PRIVY_APP_ID=<your-privy-app-id>
PRIVY_APP_SECRET=<your-privy-app-secret>

# Server wallet configuration
TREASURY_WALLET_ID=<your-server-wallet-id>
TREASURY_WALLET_ADDRESS=<your-solana-wallet-address>
TREASURY_AUTHORIZATION_KEY=<your-base64-authorization-key>

# RPC and test configuration
HELIUS_RPC_URL=https://devnet.helius-rpc.com?api-key=<your-helius-api-key>
TEST_MINT=<token-mint-address>

# Optional defaults for scripts
DEFAULT_TEST_RECIPIENT=<recipient-wallet-address>
DEFAULT_AMOUNT=0.001
DEFAULT_DECIMALS=9
```

**Note:** Never expose `PRIVY_APP_SECRET` in client-side code.

### 3. Run the demo

```bash
npm start
```

## Usage

### Compress SPL tokens

```bash
npm run compress

npm run compress -- <mint> <recipient> <amount> <decimals>
npm run compress -- 7cT3PeXy... GyCkk6... 1 9
```

### Transfer compressed tokens

```bash
npm run transfer

npm run transfer -- <mint> <recipient> <amount> <decimals>
npm run transfer -- 7cT3PeXy... GyCkk6... 0.5 9
```

### Decompress tokens

```bash
npm run decompress

npm run decompress -- <mint> <amount> <decimals>
npm run decompress -- 7cT3PeXy... 0.5 9
```

### Helpers

**Compressed Mint**

```bash
npm run mint:compressed

npm run mint:compressed -- <decimals> <amount> <recipient>
npm run mint:compressed -- 9 100 GyCkk6...
```

**Mint SPL tokens**

```bash
npm run mint:spl

npm run mint:spl -- <mint> <recipient> <amount> <decimals>
npm run mint:spl -- 7cT3PeXy... GyCkk6... 100 9
```

## Learn more

- [Privy Dashboard](https://dashboard.privy.io)
- [Privy Server Wallets Documentation](https://docs.privy.io/guide/server/wallets/signing)
- [ZK Compression Documentation](https://www.zkcompression.com)
- [Compressed Tokens Testing Guide](https://www.zkcompression.com/compressed-token/testing)
