# Privy + ZK Compression - React

Example to sign with Privy's React SDK compressed token transfers, compress SPL tokens to a recipient, and decompress for offramp.

- **[useTransfer](src/hooks/useTransfer.ts)** - Transfer compressed tokens
- **[useCompress](src/hooks/useCompress.ts)** - Compress SPL tokens to recipient in one transaction
- **[useDecompress](src/hooks/useDecompress.ts)** - Decompress tokens to SPL
- **[useCompressedBalances](src/hooks/useCompressedBalances.ts)** - Fetch compressed SPL and compressed token balances
- **[useTransactionHistory](src/hooks/useTransactionHistory.ts)** - Fetch transaction history
- **[comparison-spl-light.md](comparison-spl-light.md)** - SPL vs Compressed code comparison

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Copy the example environment file and configure your credentials:

```bash
cp .env.example .env
```

Update `.env` with your Privy app ID and Helius RPC URL:

```env
VITE_PRIVY_APP_ID=your_privy_app_id
VITE_HELIUS_RPC_URL=https://devnet.helius-rpc.com?api-key=YOUR_KEY
```

Get your Privy App ID from the [Privy Dashboard](https://dashboard.privy.io). Get a Helius API key from [Helius](https://www.helius.dev).

### 3. Start Development Server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## Resources

- [ZK Compression + Privy Guide](https://zkcompression.com/compressed-tokens/for-privy)
- [Privy React SDK - Signing](https://docs.privy.io/guide/react/wallets/usage/signing)
- [Privy Dashboard](https://dashboard.privy.io)