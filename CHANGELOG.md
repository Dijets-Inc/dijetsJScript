# CHANGELOG

## v1.0.0

### Notes

* Added Dijets testnet network values
* NFTs are partially implemented in anticipation of their complete release in a future build

### Method Signature Changes

* `DJTXv.makeUnsignedTx`
  * Renamed to `DJTXv.makeBaseTx`
  * Now returns `UnsignedTx` instead of `TxUnsigned`
* `avm.makeCreateAssetTx`
  * 4th parameter has been renamed `initialStates` from `initialState`
  * Now returns `UnsignedTx` instead of `TxCreateAsset`
* `DJTXv.signTx` 
  * Now accepts `UnsignedTx` instead of `TxUnsigned`
* `SelectInputClass`
  * Now accepts a `number` instead of a `Buffer`
* `DJTXv.getInputID`
  * Has been renamed to `DJTXv.getInput` and now returns an `Input` instead of a `number`

### New Methods

* `DJTXv.makeNFTTransferTx`

### New Classes

* DJTXv credentials
  * Credential
  * SecpCredential is a superset of Credential
  * NFTCredential is a superset of Credential
* DJTXv inputs
  * TransferableInput
  * AmountInput
* DJTXv ops
  * Operation
  * TransferableOperation
  * NFTTransferOperation
* DJTXv outputs
  * TransferableOutput
  * AmountOutput
  * SecpOutput
  * NFTOutBase
* DJTXv tx
  * BaseTx
  * CreateAssetTx
  * OperationTx
  * UnsignedTx
* DJTXv types
  * UTXOID

### New Types

* MergeRule

### Updated Classes

* Input is now `abstract`

### Deleted Classes

* DJTXv utxos
  * SecpUTXO
* DJTXv outputs
  * SecpOutBase
* DJTXv tx
  * TxUnsigned
  * TxCreateAsset

### New consts

* DJTXv credentials
  * SelectCredentialClass

### Deleted consts

* DJTXv utxos
  * SelectUTXOClass

### New RPC Calls

* `platform.getSubnets`
* `DJTXv.buildGenesis`
* `keystore.deleteUser`
