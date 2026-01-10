# Compressed Token Cookbook

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file with your Helius API key:
```bash
cp .env.example .env
# Edit .env and add your API key
```

3. Ensure you have a funded Solana wallet at `~/.config/solana/id.json`

## Run Examples

### Actions 

```bash
npm run create-mint:action
npm run create-token-pool:action
npm run mint-to:action
npm run transfer:action
npm run compress:action
npm run decompress:action
npm run approve:action
npm run revoke:action
npm run merge-accounts:action
```

### Instructions

```bash
npm run create-mint:instruction
npm run mint-to:instruction
```

## Network Configuration

By default, scripts run on **devnet**. To switch to localnet, edit the script files:

```typescript
// Comment out devnet:
// const RPC_URL = `https://devnet.helius-rpc.com?api-key=${process.env.API_KEY!}`;
// const rpc = createRpc(RPC_URL);

// Uncomment localnet:
const rpc = createRpc();
```
