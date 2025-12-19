# Examples-zk-compression

## Client Examples

### [Node.js Client] (https://github.com/Lightprotocol/example-nodejs-client/tree/3a8401db8f57970cff8f5e60751a2f757074f030)

### [Web Client] (https://github.com/Lightprotocol/example-web-client/tree/e3236edbb04898b415f85c6a82bb4720783341d8)

### [Token Distribution] (https://github.com/Lightprotocol/example-token-distribution)

## Programs with Tests

### Airdrop with Claim
* [Light Compressed Claim Reference Implementation] (https://github.com/Lightprotocol/example-compressed-claim/tree/c9e4d049ab6c6c36fe06cb7e7770b79b072271ef)

### Basic Operation Programs

- **[basic-operations/anchor](./basic-operations/anchor/)** - Anchor program with Rust and TypeScript tests
- **[basic-operations/native-rust](./basic-operations/native-rust/)** - Native Solana program with light-sdk and Rust tests.

Basic Operations include:
- **create** - Initialize a new compressed account.
- **update** - Modify data in an existing compressed account.
- **close** - Clear account data and preserve its address.
- **reinit** - Reinitialize a closed account with the same address.
- **burn** - Permanently delete a compressed account.

### Counter Program

Full compressed account lifecycle (create, increment, decrement, reset, close):

- **[counter/anchor](./counter/anchor/)** - Anchor program with Rust and TypeScript tests
- **[counter/native](./counter/native/)** - Native Solana program with light-sdk and Rust tests.
- **[counter/pinocchio](./counter/pinocchio/)** - Pinocchio program with light-sdk-pinocchio and Rust tests.


### Create-and-update Program

- **[create-and-update](./create-and-update/)** - Create a new compressed account and update an existing compressed account with a single validity proof in one instruction.

### Create-and-read Program

- **[read-only](./read-only)** - Create a new compressed account and read it onchain.


### Compare uncompressed vs compressed accounts Program

- **[account-comparison](./account-comparison/)** - Compare compressed vs regular Solana accounts.

### zk-id Program

- **[zk-id](./zk-id)** - A minimal zk id Solana program that uses zero-knowledge proofs for identity verification with compressed accounts.
