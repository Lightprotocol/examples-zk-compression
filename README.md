# Examples-zk-compression

## Client Examples

### [Node.js Client](https://github.com/Lightprotocol/example-nodejs-client/tree/main)

### [Web Client](https://github.com/Lightprotocol/example-web-client/tree/main)

### [Token Distribution](https://github.com/Lightprotocol/example-token-distribution)

## [Program Examples](https://github.com/Lightprotocol/program-examples)

### Airdrop with Claim
* [Light Compressed Claim Reference Implementation](https://github.com/Lightprotocol/example-compressed-claim/tree/main)

### Basic Operation Programs

- **[basic-operations/anchor](https://github.com/Lightprotocol/program-examples/tree/main/basic-operations/anchor)** - Anchor program with Rust and TypeScript tests
- **[basic-operations/native-rust](https://github.com/Lightprotocol/program-examples/tree/main/basic-operations/native-rust)** - Native Solana program with light-sdk and Rust tests.

Basic Operations include:
- **create** - Initialize a new compressed account.
- **update** - Modify data in an existing compressed account.
- **close** - Clear account data and preserve its address.
- **reinit** - Reinitialize a closed account with the same address.
- **burn** - Permanently delete a compressed account.

### Counter Program

Full compressed account lifecycle (create, increment, decrement, reset, close):

- **[counter/anchor](https://github.com/Lightprotocol/program-examples/tree/main/counter/anchor)** - Anchor program with Rust and TypeScript tests
- **[counter/native](https://github.com/Lightprotocol/program-examples/tree/main/counter/native)** - Native Solana program with light-sdk and Rust tests.
- **[counter/pinocchio](https://github.com/Lightprotocol/program-examples/tree/main/counter/pinocchio)** - Pinocchio program with light-sdk-pinocchio and Rust tests.


### Create-and-update Program

- **[create-and-update](https://github.com/Lightprotocol/program-examples/tree/main/create-and-update)** - Create a new compressed account and update an existing compressed account with a single validity proof in one instruction.

### Create-and-read Program

- **[read-only](https://github.com/Lightprotocol/program-examples/tree/main/read-only)** - Create a new compressed account and read it onchain.


### Compare uncompressed vs compressed accounts Program

- **[account-comparison](https://github.com/Lightprotocol/program-examples/tree/main/account-comparison)** - Compare compressed vs regular Solana accounts.

### zk-id Program

- **[zk-id](https://github.com/Lightprotocol/program-examples/tree/main/zk-id)** - A minimal zk id Solana program that uses zero-knowledge proofs for identity verification with compressed accounts.
