# TON FunC Coinsplitter Example

This example is taken from [this screencast](https://www.binance.com/hu/live/video?roomId=2120136).

The contract is deployed on [testnet here](https://testnet.tonscan.org/address/EQDnBM9zWmEBGal1-3uuOTyx0_72ZxOER43K1m7iw8IaMa-K#source) using the wallet `EQBO_BKSeVRZzRhfuj3hqF-ez4g3T0af7xXCk0cve35ps83v`.

## Fift

An example of using Fift is if you want to build a new wallet, then you can run:

```
fift -s ~/workspace/ton/ton/crypto/smartcont/new-wallet.fif 0 my_wallet_name
```

Example of usig Fift to create a message envelope to send Toncoins to a new wallet

```
fift -s ~/workspace/ton/ton/crypto/smartcont/testgiver.fif 0QAu6bT9Twd8myIygMNXY9-e2rC0GsINNvQAlnfflcOv4uVb 0x0002 10 dadou_wallet-query
```

Note that `0QAu6bT9Twd8myIygMNXY9-e2rC0GsINNvQAlnfflcOv4uVb` is the address of the test giver contract and `0x0002` is the seqno (see below how to use Liteclient to get that number), and `10` is the amouont of Toncoins to send to the wallet `dadou_wallet`.

## Liteclient

To use the lite-client you need to install the binary as [shown here](https://ton.org/docs/develop/smart-contracts/environment/installation#1-download).

Then you need to download the config either for [mainnet](https://ton.org/global-config.json) or [testnet](https://ton.org/testnet-global.config.json).

You can now start the lite-client in terminal like so:

```
lite-client -C testnet-global.config.json
```

You can inspect the state of a contract by following [these steps](https://ton.org/docs/develop/howto/step-by-step#2-inspecting-the-state-of-a-smart-contract).

You can deploy this using the lite-client using the `sendfile` command:

```
sendfile new-wallet-query.boc
```

Now this will NOT work becuase you need to fund the contract _before_ it is deployed :) For that we need to ask the test giver contract for test Toncoin.

```
last
runmethod kf_8uRo6OBbQ97jCx2EIuKm8Wmt6Vb15-KsQHFLbKSMiYIny seqno
```


You create an external message to the test giver asking it to send another message to your (uninitialized) smart contract carrying a specified amount of test Toncoin:

```
fift -s ~/workspace/ton/ton/crypto/smartcont/testgiver.fif 0QAu6bT9Twd8myIygMNXY9-e2rC0GsINNvQAlnfflcOv4uVb 0x0002 10 dadou_wallet-query
```

Now use Lite Client to send that message:

```
sendfile dadou_wallet-query
```


# TON project template (RFC)

Starter template for a new TON project - FunC contracts, unit tests, compilation and deployment scripts.

> This repo is a work in progress and is subject to change

## Layout

-   `contracts` - contains the source code of all the smart contracts of the project and their dependencies.
-   `wrappers` - contains the wrapper classes (implementing `Contract` from ton-core) for the contracts, including any [de]serialization primitives and compilation functions.
-   `tests` - tests for the contracts. Would typically use the wrappers.
-   `scripts` - contains scripts used by the project, mainly the deployment scripts.   

We ask the community to provide any comments on this layout, the wanted/required changes, or even suggestions for entirely different project structures and/or tool concepts.

PRs are welcome!

## Repo contents / tech stack
1. Compiling FunC - [https://github.com/ton-community/func-js](https://github.com/ton-community/func-js)
2. Testing TON smart contracts - [https://github.com/ton-community/sandbox/](https://github.com/ton-community/sandbox/)
3. Deployment of contracts is supported with [TON Connect 2](https://github.com/ton-connect/), [Tonhub wallet](https://tonhub.com/) or via a direct `ton://` deeplink

## How to use
* Clone this repo
* Run `yarn install`

### Building a contract
1. Interactively
   1. Run `yarn blueprint build`
   2. Choose the contract you'd like to build
1. Non-interactively
   1. Run `yarn blueprint build <CONTRACT>`
   2. example: `yarn blueprint build pingpong`

### Deploying a contract
1. Interactively
   1. Run `yarn blueprint run`
   2. Choose the contract you'd like to deploy
   3. Choose whether you're deploying on mainnet or testnet
   4. Choose how to deploy:
      1. With a TON Connect compatible wallet
      2. A `ton://` deep link / QR code
      3. Tonhub wallet
   5. Deploy the contract
2. Non-interactively
   1. Run `yarn blueprint run <CONTRACT> --<NETWORK> --<DEPLOY_METHOD>`
   2. example: `yarn blueprint run pingpong --mainnet --tonconnect`

### Testing
1. Run `yarn test`

## Adding your own contract
1. Run `yarn blueprint create <CONTRACT>`
2. example: `yarn blueprint create MyContract`

* Write code
  * FunC contracts are located in `contracts/*.fc`
    * Standalone root contracts are located in `contracts/*.fc`
    * Shared imports (when breaking code to multiple files) are in `contracts/imports/*.fc`
  * Tests in TypeScript are located in `test/*.spec.ts`
  * Wrapper classes for interacting with the contract are located in `wrappers/*.ts`
  * Any scripts (including deployers) are located in `scripts/*.ts`

* Build
  * Builder configs are located in `wrappers/*.compile.ts`
  * In the root repo dir, run in terminal `yarn blueprint build`
  * Compilation errors will appear on screen, if applicable
  * Resulting build artifacts include:
    * `build/*.compiled.json` - the binary code cell of the compiled contract (for deployment). Saved in a hex format within a json file to support webapp imports

* Test
  * In the root repo dir, run in terminal `yarn test`
  * Don't forget to build (or rebuild) before running tests
  * Tests are running inside Node.js by running TVM in web-assembly using [sandbox](https://github.com/ton-community/sandbox)

* Deploy
  * Run `yarn blueprint run <deployscript>`
  * Contracts will be rebuilt on each execution
  * Follow the on-screen instructions of the deploy script
  
# License
MIT
