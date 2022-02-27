<div align="center">
  <img src="https://forge.dijets.io/DijetsLogoJS.png?raw=true">
</div>

---

# DijetsJS - Dijets Platform JavaScript Library

## Overview

Dijets is a JavaScript Library for interfacing with Dijets Ternary Chains of Value, Utility & Method. It is built using TypeScript and intended to support both browser and Node.js. This library allows one to issue commands to Dijets node APIs.

The APIs currently supported by default are:

* Admin API
* Auth API
* DJTXv API (for: Value Chain)
* DJTXu (for: Utility Chain)
* DJTXm API (for: Method Chain)
* Health API
* Info API
* Keystore API
* Metrics API

DijetsJS main purpose is to provide developers with an easy to integrate library. With this library, any Javascript developer is able to interact with a Dijets Node running on Dijets Primary Network provided that the API endpoints are enabled for the developer's consumption. Read more about the specifications here[DijetsJS Library](https://support.dijets.co.uk).

  DijetsJS - Features:

* Locally manage private keys
* Retrieve balances on addresses
* Get UTXOs for addresses
* Build and sign transactions
* Issue signed transactions to any of the Value Chain, Utility Chain or the Method Chain.
* Intra-Chain swaps to & fro - the Value Chain<->Method Chain and the Value Chain<->Utility Chain.
* Add Validators and Delegators by staking DJTX
* Test a local node setup
* Retrieve Dijets network information

### Requirements

Dijets requires Node.js LTS version 14.16.0 or higher to compile.

### Installation

Dijets is available for installation via `npm`:

`npm install --save dijets`

You can also pull the repo down directly and build it from scratch:

`npm run build`

Running this command will generate a pure Javascript Library i.e. "dijets.js" which is placed automatically in a folder named "web" in your project's root directory.
The newly generated Javascript library "dijets.js" can then be integrated into any project simply by dropping it inside the project's workspace/folder as a pure javascript implementation of Dijets Network.

### Node.js Implemetation (How to use DijetsJS with a Node.js project)

You can have the DijetsJS library at your Node.js project's disposal by importing it like so:

```js
const dijets = require("dijets");
```

Or for your Typescript project you can import DijetsJS as follows:

```js
import { Dijets } from "dijets"
```

### Importing essentials

```js
import {
  Dijets,
  BN,
  BinTools,
  Buffer
} from "dijets"

const bintools = BinTools.getInstance();
```

The above lines import the libraries used in the tutorials. The libraries include:

* Dijets: Dijets javascript library module.
* BinTools: A collection of Binary Tool Utilities with a singleton built into Dijets. This library is used mainly to deal with binary data.
* [BN](https://www.npmjs.com/package/bn.js): A bignumber module use by Dijets.
* [Buffer](https://www.npmjs.com/package/buffer): A Buffer library.

## Example 1 &mdash; Managing Value Chain Keys

DijetsJS comes with a built-in Keychain. This KeyChain is primarily used during function calls to the API. The Keychain enables signed function calls by using keys it's registered. The first step in this process is to create an instance of DijetsJS connected to any of Dijets ternary chain's API endpoints.

```js
import {
  Dijets,
  BinTools,
  Buffer,
  BN
} from "dijets"

const bintools = BinTools.getInstance();

const myNetworkID = 12345; // the network ID always defaults to 1. We specify the ID to override the defaults to run a local network instead.
const dijets = new Dijets("localhost", 9650, "http", myNetworkID);
const vchain = dijets.VChain(); //returns a reference to the Value-Chain used by DijetsJS
```

### How to access the DijetsJS KeyChain

DijetsJS KeyChain is accessed through the Value Chain and can be referenced directly or through a reference variable.

```js
const myKeychain = vchain.keyChain();
```

This exposes the instance of the class DJTXvKeyChain which is created when the Value Chain API is created. The function supports secp256k1 curve for ECDSA key pairs.

### Creating Value Chain key pairs

The KeyChain has the ability to create new KeyPairs for you and return the dijets address associated with the respective key pair.

```js
const newAddress1 = myKeychain.makeKey(); // this will return an instance of the KeyPair class
```

You can also import your existing private key into the KeyChain using either a Buffer

```js
const mypk = bintools.cb58Decode("DFjz6epjMrBKmUL4rkurfZnjqQHu9Eq287G1C5qpv2hr2tFCur"); // this will return a Buffer
const newAddress2 = myKeychain.importKey(mypk); // this will return an instance of the KeyPair class
```

... or a CB58 string instead:

```js
const mypk = "DFjz6epjMrBKmUL4rkurfZnjqQHu9Eq287G1C5qpv2hr2tFCur";
const newAddress2 = myKeychain.importKey(mypk); // this will return an instance of the KeyPair class
```

### Working with KeyChains

The Value Chain KeyChain has built-in capabilities for general key management. The following operations are available in all the implementations of this KeyChain's interface.

```js
const addressStrings = myKeychain.getAddressStrings(); // this will return an array of strings for the addresses
const addresses = myKeychain.getAddresses(); // this will return an array of Buffers for the addresses
const exists = myKeychain.hasKey(addresses[0]); // this will return true if the address is managed
const keypair = myKeychain.getKey(addresses[0]); // this will return the KeyPair class
```

### Working with KeyPairs

The Value Chain KeyPair has standardized KeyPair functionality. The following operations are available in all the implementations of this KeyPair's instance.


#### Addresses

```js
const address = keypair.getAddress(); // this will return Buffer
const addressString = keypair.getAddressString(); // this will return string
```

#### Public Keys

```js
const pubk = keypair.getPublicKey(); // this will return Buffer
const pubkstr = keypair.getPublicKeyString(); // this will return a CB58 encoded string
```

#### Private Keys

```js
const privk = keypair.getPrivateKey(); // this will return Buffer
const privkstr = keypair.getPrivateKeyString(); //returns a CB58 encoded string

keypair.generateKey(); // creates a new random KeyPair
```

#### Misc Operations

```js
const mypk = bintools.cb58Decode("24jUJ9vZexUM6expyMcT48LBx27k1m7xpraoV62oSQAHdziao5");
const successul = keypair.importKey(mypk); // this will return boolean if private key imported successfully

const message = Buffer.from("Through consensus to the stars");
const signature = keypair.sign(message); // this will return a Buffer with the signature

const signerPubk = keypair.recover(message, signature); // this will return a Buffer
const isValid = keypair.verify(message, signature); // this will return a boolean
```

## Example 2 &mdash; Creating a Digital Asset on the Value Chain

This example shows how to create a digital asset on Dijets Value Chain and declare it publicly within the Dijets Ecosystem. Just like in the previous example, the first step in this process is to create an instance of DijetsJS connected to a ternary chain endpoint of our choice.

```js

import {
  Dijets,
  BinTools,
  BN,
  Buffer,

} from "dijets"
import {
  InitialStates,
  SECPTransferOutput
} from "dijets/dist/apis/DJTXv"

const myNetworkID = 12345; // NetworkID always defaults to 1, we need to override that for the local network
const dijets = new Dijets("localhost", 9650, "http", myNetworkID);
const vchain = dijets.VChain(); // this will return a reference to the Value Cain used by DijetsJS
```

### Describe the new digital asset

The first steps in creating a new asset using DijetsJS library is to determine the relatively basic properties of the asset. Theese properties can be the digital asset's name, its ticker symbol, and its denomination.

```js
// Giving a name to our new coin
const name = "PenXenOleFren";

// Giving a symbol to the coin
const symbol = "PXF";

// The coin's denomination indicates what the basic main unit of an asset is and where its fractional subunit begins from.
// For Example in Dijets case: 1 DJTX as the base unit has a denomination of 9. The smallest sub-unit of DJTX is a nanoDJTX (nDJTX) at 10^-9 DJTX
// NanoDijet = NanoDjtx = 1
// MicroDijet = MicroDjtx = 1000 * NanoDjtx
// Boson = 49*MicroDjtx + 463*NanoDjtx
// MesonDijet = MesonDjtx = 1000 * MicroDjtx
// Dijet = Djtx = 1000 * MesonDjtx
// PionDjtx  uint64 = 1000 * Djtx
// ExaDjtx  uint64 = 1000 * PionDjtx

const denomination = 9;
```

## Example 3 &mdash; Sending a Digital Asset

This example makes a value chain transfer to a single recipient address. The first step in this process is to create an instance of Dijets connected to our Ternary Chain API endpoint of choice.

```js
import {
  Dijets,
  BinTools,
  Buffer,
  BN
} from "dijets"

const myNetworkID = 12345; // defaults to 1, override it to use local network
const dijets = new dijets.Dijets("localhost", 9650, "http", myNetworkID);
const vchain = dijets.VChain(); // this will return a reference to the v chain used by DijetsJS
```

Now, provided the keystore contains a list of addresses which will be used in this transaction, we can start the transfer process by getting the UTXOs

### Getting the UTXO Set

Dijets Value Chain stores all available balances for addresses in a datastore called the "Unspent Transaction Outputs (UTXOs)". A UTXO Set is the unique list of outputs produced by transactions, addresses that can spend those outputs, and other variables such as lockout times (a timestamp after which the output can be spent) and thresholds (how many signers are required to spend the output).

To keep the examples compact, we're going to create a simple transaction that spends x amount of available coins and sends it to a single address without any limitations.

Here's how to get the UTXOs for the addresses we'll be using in this example.

```js
const myAddresses = vchain.keyChain().getAddresses(); // this will return an array of addresses the KeyChain manages as buffers
const addressStrings = xchain.keyChain().getAddressStrings(); // this will return an array of addresses the KeyChain manages as strings
const u = await vchain.getUTXOs(myAddresses);
const utxos = u.utxos
```

### Spending these UTXOs

#### Breakdown of the Transaction:

&mdash; Asset ID of the digital asset we wish to transfer. (For this example we are using a random AssetID)
&mdash; Helper function to send the digital asset => `buildBaseTx()`
&mdash; Available Balance of 400 coins

We can verify that we have the funds available for the transaction like so:

```js
const assetid = "8pfG5CTyL5KBVaKrEnCvNJR95dUWAKc1hrffcVxfgi8qGhqjm"; // cb58 encoded string
const mybalance = utxos.getBalance(myAddresses, assetid); // this operation returns 400 as BN (Big Number)
```

Once we have verified the balance availability of 400 coins! We can go ahead and send 200 of those coins to our friend's address.

```js
const sendAmount = new BN(200); // amount is in BN (Big Number) format
const friendsAddress = "dijets1k26annideya2ms95puxcczsa3lzwf5ftt0fjk"; // note the address format is in Bech32 as the transfer is being made on the Value Chain.

// The below returns an UnsignedTx
// Parameters sent are (in order of appearance):
//   * The UTXO Set
//   * The amount being sent as a BN
//   * An array of addresses to send the funds
//   * An array of addresses sending the funds
//   * An array of addresses any leftover funds are sent
//   * The AssetID of the funds being sent
const unsignedTx = await xchain.buildBaseTx(utxos, sendAmount, [friendsAddress], addressStrings, assetid);
const signedTx = vchain.signTx(unsignedTx);
const txid = await vchain.issueTx(signedTx);
```

The transfer is completed and the transaction is sent.

### Get the status of the transaction

Now that we sent the transaction to the network, it takes a few seconds to determine if the transaction has gone through. We can get an updated status on the transaction using the TxID through the Value Chain.

```js
// Expected responses for transactio: "Accepted", "Processing", "Unknown", and "Rejected"
const status = await vchain.getTxStatus(txid);
```

The statuses can be one of "Accepted", "Processing", "Unknown", and "Rejected":

* "Accepted" indicates that the transaction has been accepted as valid by the network and executed
* "Processing" indicates that the transaction is being voted on.
* "Unknown" indicates that node knows nothing about the transaction, indicating the node doesn't have it
* "Rejected" indicates the node knows about the transaction, but it conflicted with an accepted transaction




