# Examples-zk-compression

## Client Examples

### Privy Integration

* [nodejs-privy-compressed](./privy/nodejs-privy-compressed) - Node.js Privy integration.
* [react-privy-compressed](./privy/react-privy-compressed) - React + Vite app

### Token Distribution
* [Reference implementations](https://github.com/Lightprotocol/example-token-distribution) for common token distribution flows with ZK Compression (airdrops, payments, rewards)
---
## [Program Examples](https://github.com/Lightprotocol/program-examples)

### Airdrop Claim Reference Implementations

* **Basic**: [**simple-claim**](https://github.com/Lightprotocol/program-examples-airdrop-implementations/simple-claim) - Distributes compressed tokens that get decompressed to SPL on claim.
* **Advanced**: [**merkle-distributor**](https://github.com/Lightprotocol/distributor) - Distributes SPL tokens, uses compressed PDAs to track claims with linear vesting, partial claims, clawback and admin controls.

For simple client side distribution visit [this example](https://github.com/Lightprotocol/example-token-distribution).

### Basic Operations

- **[create-nullifier](./basic-operations/anchor/create-nullifier)** - Basic Anchor example to create nullifiers for payments.
- **create** - Initialize a new compressed account
  - [Anchor](./basic-operations/anchor/create) | [Native](./basic-operations/native/programs/create)
- **update** - Modify data in an existing compressed account
  - [Anchor](./basic-operations/anchor/update) | [Native](./basic-operations/native/programs/update)
- **close** - Clear account data and preserve its address
  - [Anchor](./basic-operations/anchor/close) | [Native](./basic-operations/native/programs/close)
- **reinit** - Reinitialize a closed account with the same address
  - [Anchor](./basic-operations/anchor/reinit) | [Native](./basic-operations/native/programs/reinit)
- **burn** - Permanently delete a compressed account
  - [Anchor](./basic-operations/anchor/burn) | [Native](./basic-operations/native/programs/burn)

### Counter Program

Full compressed account lifecycle (create, increment, decrement, reset, close):

- **[counter/anchor](https://github.com/Lightprotocol/program-examples/tree/main/counter/anchor)** - Anchor program with Rust and TypeScript tests
- **[counter/native](https://github.com/Lightprotocol/program-examples/tree/main/counter/native)** - Native Solana program with light-sdk and Rust tests.
- **[counter/pinocchio](https://github.com/Lightprotocol/program-examples/tree/main/counter/pinocchio)** - Pinocchio program with light-sdk-pinocchio and Rust tests.


### Create-and-update Program

- **[create-and-update](https://github.com/Lightprotocol/program-examples/tree/main/create-and-update)** - Create a new compressed account and update an existing compressed account with a single validity proof in one instruction.

### Create-and-read Program

- **[read-only](https://github.com/Lightprotocol/program-examples/tree/main/read-only)** - Create a new compressed account and read it onchain.


### Compare Program with Solana vs Compressed Accounts

- **[account-comparison](https://github.com/Lightprotocol/program-examples/tree/main/account-comparison)** - Compare compressed vs regular Solana accounts.

### zk-id Program

- **[zk-id](https://github.com/Lightprotocol/program-examples/tree/main/zk-id)** - A minimal zk id Solana program that uses zero-knowledge proofs for identity verification with compressed accounts.
